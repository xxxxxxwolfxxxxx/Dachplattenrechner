#!/usr/bin/env python3
"""Erzeugt public/data/gemeindekarte.json: Gemeindeflächen für alle Landkreise, in denen Schnee- oder Windzone wechseln.

Quellen:
  - Grenzen: BKG VG250 (WFS vg250_gem, je Bundesland, GeoJSON), © GeoBasis-DE / BKG, dl-de/by-2-0
      https://sgx.geodatenzentrum.de/wfs_vg250?service=WFS&version=2.0.0&request=GetFeature&typeNames=vg250_gem&outputFormat=application/json&srsName=EPSG:4326&cql_filter=sn_l='09' AND gf=4
  - Zonen: public/data/schneelastzonen.json, public/data/windzonen.json (siehe die zugehörigen build-Skripte)
  - Gemeindeschlüssel (AGS) der Schneelastzonen: DIBt-Excel, soweit dort vorhanden (BY, HE, RP, TH, NW u. a.)
Aufruf: python3 scripts/build-gemeindekarte.py <ordner_mit_gem_01.json..16.json> <schneelastzonen.xlsx>
        (Dateien heißen 01.json ... 16.json; benötigt shapely und openpyxl; public/data/kreiskarte.json muss existieren)

Landkreise ohne wechselnde Zonen bleiben in der Karte als Landkreisfläche; Gemeinden werden nur dort gezeichnet,
wo sie Information tragen. Gemeinden ohne auflösbare Zone bleiben leer (grau) und werden gemeldet.
Gemeinden in Landkreisen ohne Gemeindeeinträge der DIBt (z. B. Ausnahmen ohne Namen) erhalten die Landkreis-Standardzone.
"""
import json
import re
import sys
import warnings
from collections import Counter
from pathlib import Path

import openpyxl
import shapely
from shapely.geometry import shape
from shapely.geometry.polygon import orient

sys.path.insert(0, str(Path(__file__).resolve().parent))
from gemeindenamen import Namensindex  # noqa: E402

warnings.filterwarnings('ignore')

ROOT = Path(__file__).resolve().parent.parent
LAENDER = {'01': 'SH', '02': 'HH', '03': 'NI', '04': 'HB', '05': 'NW', '06': 'HE', '07': 'RP', '08': 'BW',
           '09': 'BY', '10': 'SL', '11': 'BE', '12': 'BB', '13': 'MV', '14': 'SN', '15': 'ST', '16': 'TH'}
TOLERANZ = 0.004       # Vereinfachung in Grad (ca. 350 m)
MIN_FLAECHE = 0.00002  # Quadratgrad; kleinere Teilflächen von Gemeinden entfallen
ZONEN = {'1', '1a', '2', '2a', '3', '3a', '>3', '>3a'}


def norm(s):
    s = s.lower().replace('ä', 'ae').replace('ö', 'oe').replace('ü', 'ue').replace('ß', 'ss')
    return re.sub(r'[^a-z0-9]+', ' ', s).strip()


def zone(v):
    z = str(v or '').strip().lower().replace(' ', '')
    return z if z in ZONEN else None


def lade(name):
    return json.loads((ROOT / 'public' / 'data' / name).read_text(encoding='utf-8'))


def ags_zonen(xlsx):
    """AGS (8-stellig) -> Schneelastzone aus den Blättern, die einen Gemeindeschlüssel enthalten."""
    wb = openpyxl.load_workbook(xlsx, data_only=True, read_only=True)
    ergebnis = {}
    for ws in wb:
        if ws.title.startswith('Erl'):
            continue
        nw = ws.title.startswith('NW')
        for r in ws.iter_rows(values_only=True):
            zellen = [str(c).strip() if c is not None else '' for c in r]
            ags = next((z for z in zellen if re.fullmatch(r'\d{7,8}', z)), None)
            z = zone(r[3] if nw else (r[4] if len(r) > 4 else None))
            if ags and z:
                ergebnis[ags.zfill(8)] = z
    return ergebnis


def zonen_je_kreis(daten, land, kreis, stadt):
    """Python-Gegenstück zu kartenZone() in src/utils/schneelastzonen.ts: (Hauptzone, alle Zonen)."""
    alle_zeilen = [z for z in daten if z[0] == land and z[1] == kreis]
    zeilen = alle_zeilen if stadt else [z for z in alle_zeilen if z[2] != kreis]
    if stadt:
        eigene = next((z for z in alle_zeilen if z[2] == kreis), None)
        if eigene:
            return eigene[3], {eigene[3]}
    if not zeilen:
        landstandard = next((z for z in daten if z[0] == land and z[1] is None), None)
        return (landstandard[3], {landstandard[3]}) if landstandard else (None, set())
    standard = next((z for z in zeilen if z[2] is None), None)
    zonen = {z[3] for z in zeilen}
    haupt = standard[3] if standard else Counter(z[3] for z in zeilen).most_common(1)[0][0]
    return haupt, zonen


def pfad(poly, pt):
    """Pfad mit relativen Koordinaten (kurz): M x y l dx dy ... z"""
    teile = []
    for ring in [poly.exterior, *poly.interiors]:
        punkte = [pt(x, y) for x, y in ring.coords[:-1]]
        if len(punkte) < 3:
            continue
        x0, y0 = punkte[0]
        teil = f'M{x0:g} {y0:g}l'
        letzte = (x0, y0)
        schritte = []
        for x, y in punkte[1:]:
            schritte.append(f'{round(x - letzte[0], 2):g} {round(y - letzte[1], 2):g}')
            letzte = (x, y)
        teile.append(teil + ' '.join(schritte) + 'z')
    return ''.join(teile)


def main():
    ordner, xlsx = Path(sys.argv[1]), Path(sys.argv[2])
    schnee, wind = lade('schneelastzonen.json')['zeilen'], lade('windzonen.json')['zeilen']
    karte = lade('kreiskarte.json')
    proj = karte['projektion']
    ags_zone = ags_zonen(xlsx)
    kreis_nach_ags = {k['ags']: k for k in karte['kreise']}

    def pt(x, y):
        return round((x - proj['minx']) * proj['kx'] * proj['skala'], 2), round((proj['maxy'] - y) * proj['skala'], 2)

    # 1. Landkreise bestimmen, in denen Schnee- oder Windzone wechseln
    gemischt = {}
    for ags, k in kreis_nach_ags.items():
        if not k['k']:
            continue
        _, zs = zonen_je_kreis(schnee, k['land'], k['k'], k['stadt'])
        _, zw = zonen_je_kreis(wind, k['land'], k['k'], k['stadt'])
        if len(zs) > 1 or len(zw) > 1:
            gemischt[ags] = k

    # 2. Gemeinden dieser Landkreise einlesen und Zonen auflösen
    schnee_namen, wind_namen, schnee_standard, wind_standard = Namensindex(), Namensindex(), {}, {}
    for z in schnee:
        if z[2] is None:
            schnee_standard[(z[0], z[1])] = z[3]
        else:
            schnee_namen.add(z[0], z[1], z[2], z[3])
    for z in wind:
        if z[2] is None:
            wind_standard[(z[0], z[1])] = z[3]
        else:
            wind_namen.add(z[0], z[1], z[2], z[3])
    wind_land = {z[0]: z[3] for z in wind if z[1] is None}

    gemeinden, ungeloest = [], Counter()
    for datei in sorted(ordner.glob('[0-9][0-9].json')):
        for f in json.loads(datei.read_text(encoding='utf-8'))['features']:
            p = f['properties']
            kreis = gemischt.get(p['ags'][:5])
            if not kreis:
                continue
            land, schl = kreis['land'], kreis['k']
            name = p['gen']
            n = norm(name)
            zs = ags_zone.get(p['ags']) or schnee_namen.finde(land, schl, name) or schnee_standard.get((land, schl))
            zw = wind_namen.finde(land, schl, name) or wind_standard.get((land, schl)) or wind_land.get(land)
            if zs is None:
                ungeloest[land] += 1
            gemeinden.append((p['ags'], name, zs, zw, shape(f['geometry'])))

    # 3. Geometrie vereinfachen (gemeinsame Grenzen bleiben deckungsgleich) und als Pfad ausgeben
    vereinfacht = shapely.coverage_simplify([g for *_, g in gemeinden], TOLERANZ)
    ausgabe = []
    for (ags, name, zs, zw, _), geom in zip(gemeinden, vereinfacht):
        flaechen = list(geom.geoms) if geom.geom_type == 'MultiPolygon' else [geom]
        d = ''.join(pfad(orient(fl), pt) for fl in flaechen if fl.area >= MIN_FLAECHE or len(flaechen) == 1)
        ausgabe.append([ags, name, ags[:5], zs, zw, d])

    ziel = ROOT / 'public' / 'data' / 'gemeindekarte.json'
    ziel.write_text(json.dumps({
        'stand': karte['stand'],
        'quelle': karte['quelle'],
        'kreise': sorted(gemischt),
        'gemeinden': ausgabe,
    }, ensure_ascii=False, separators=(',', ':')), encoding='utf-8')
    print(f'{len(gemischt)} Landkreise mit wechselnden Zonen, {len(ausgabe)} Gemeinden, {ziel.stat().st_size / 1024:.0f} KB -> {ziel}')
    print('Ohne Schneelastzone je Bundesland:', dict(ungeloest))
    print('Gemeinden pro Bundesland:', dict(Counter(LAENDER[g[0][:2]] for g in ausgabe)))


if __name__ == '__main__':
    main()
