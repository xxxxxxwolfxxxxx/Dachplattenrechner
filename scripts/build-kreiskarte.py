#!/usr/bin/env python3
"""Erzeugt public/data/kreiskarte.json (vereinfachte SVG-Pfade der Landkreise) aus den BKG-Verwaltungsgrenzen.

Quelle: BKG, Verwaltungsgebiete 1:250 000 (VG250), © GeoBasis-DE / BKG, Datenlizenz Deutschland – Namensnennung 2.0 (dl-de/by-2-0)
Download (WFS, GeoJSON):
  https://sgx.geodatenzentrum.de/wfs_vg250?service=WFS&version=2.0.0&request=GetFeature&typeNames=vg250_krs&outputFormat=application/json&srsName=EPSG:4326
Aufruf: python3 scripts/build-kreiskarte.py <pfad/zur/krs.json>   (benötigt shapely; public/data/schneelastzonen.json muss existieren)

Jeder Landkreis erhält den Schlüssel (Bundesland, Name) der Schneelastzonen-Daten, damit die Karte
beide Datensätze (Schnee, Wind) über dieselben Namen verbindet.
"""
import json
import math
import re
import sys
from pathlib import Path

import shapely
from shapely.geometry import shape
from shapely.geometry.polygon import orient

ROOT = Path(__file__).resolve().parent.parent
LAENDER = {'01': 'SH', '02': 'HH', '03': 'NI', '04': 'HB', '05': 'NW', '06': 'HE', '07': 'RP', '08': 'BW',
           '09': 'BY', '10': 'SL', '11': 'BE', '12': 'BB', '13': 'MV', '14': 'SN', '15': 'ST', '16': 'TH'}
BREITE = 600           # Breite der SVG-Zeichenfläche
TOLERANZ = 0.01        # Vereinfachung in Grad (ca. 800 m), Coverage-Vereinfachung
MIN_FLAECHE = 0.0004   # kleinere Inseln/Teilflächen entfallen (Quadratgrad)
KREISFREI = ('Kreisfreie Stadt', 'Stadtkreis')

# Namen, die in den DIBt-Tabellen anders geschrieben sind als im VG250
ALIAS = {
    ('NI', 'oldenburg oldb'): 'Oldenburg (Oldenburg)',
    ('NI', 'region hannover'): 'Hannover',
    ('NW', 'staedteregion aachen'): 'Aachen',
    ('RP', 'eifelkreis bitburg pruem'): 'Bitburg-Prüm',
    ('SL', 'regionalverband saarbruecken'): 'Stadtverband Saarbrücken',
    ('BY', 'landsberg am lech'): 'Landsberg a. Lech',
}


def norm(s):
    s = s.lower().replace('ä', 'ae').replace('ö', 'oe').replace('ü', 'ue').replace('ß', 'ss')
    return re.sub(r'[^a-z0-9]+', ' ', s).strip()


def lade_schluessel():
    zeilen = json.loads((ROOT / 'public/data/schneelastzonen.json').read_text(encoding='utf-8'))['zeilen']
    schluessel = {}
    for land, kreis, *_ in zeilen:
        schluessel.setdefault(land, {})[norm(kreis)] = kreis
    return schluessel


def finde_schluessel(schluessel, land, gen, bez):
    namen = schluessel.get(land, {})
    n = norm(gen)
    if (land, n) in ALIAS:
        return ALIAS[(land, n)]
    stadt = bez in KREISFREI
    # Kreisfreie Stadt bevorzugt den schlichten Namen, Landkreis bevorzugt "Landkreis X"
    kandidaten = [n, 'landkreis ' + n] if stadt else ['landkreis ' + n, n, n.replace(' kreis', '').strip()]
    kandidaten += [norm(re.sub(r'\s*\(.*?\)', '', gen)), norm(re.sub(r',.*$', '', gen))]
    for k in kandidaten:
        if k in namen:
            return namen[k]
    return ALIAS.get((land, n))


def main():
    quelle = json.loads(Path(sys.argv[1]).read_text(encoding='utf-8'))
    schluessel = lade_schluessel()
    features = [f for f in quelle['features'] if f['properties']['gf'] == 4]

    gebiete = []
    for f in features:
        geom = shape(f['geometry'])
        # einfache flächentreue Näherung: Längengrad mit cos(51,2°) stauchen
        gebiete.append((f['properties'], geom))
    vereinfacht = shapely.coverage_simplify([g for _, g in gebiete], TOLERANZ)
    gebiete = [(p, g) for (p, _), g in zip(gebiete, vereinfacht)]
    minx = min(g.bounds[0] for _, g in gebiete)
    maxx = max(g.bounds[2] for _, g in gebiete)
    miny = min(g.bounds[1] for _, g in gebiete)
    maxy = max(g.bounds[3] for _, g in gebiete)
    kx = math.cos(math.radians(51.2))
    skala = BREITE / ((maxx - minx) * kx)
    hoehe = round((maxy - miny) * skala)

    def pt(x, y):
        return round((x - minx) * kx * skala, 1), round((maxy - y) * skala, 1)

    kreise, ohne = [], []
    for p, geom in gebiete:
        land = LAENDER[p['ags'][:2]]
        flaechen = list(geom.geoms) if geom.geom_type == 'MultiPolygon' else [geom]
        teile = []
        for poly in flaechen:
            if poly.area < MIN_FLAECHE and len(flaechen) > 1:
                continue
            poly = orient(poly)
            for ring in [poly.exterior, *poly.interiors]:
                koord = [pt(x, y) for x, y in ring.coords[:-1]]
                if len(koord) >= 3:
                    teile.append('M' + 'L'.join(f'{x:g} {y:g}' for x, y in koord) + 'Z')
        schl = finde_schluessel(schluessel, land, p['gen'], p['bez'])
        if schl is None:
            ohne.append(f"{land} {p['gen']} ({p['bez']})")
        kreise.append({
            'ags': p['ags'], 'name': p['gen'], 'land': land, 'k': schl,
            'stadt': p['bez'] in KREISFREI, 'd': ''.join(teile),
        })

    ausgabe = {
        'viewBox': [BREITE, hoehe],
        'projektion': {'minx': minx, 'maxy': maxy, 'kx': kx, 'skala': skala},
        'stand': (features[0]['properties']['beginn'] or '')[:10],
        'quelle': '© GeoBasis-DE / BKG (VG250), Datenlizenz Deutschland – Namensnennung 2.0',
        'kreise': kreise,
    }
    ziel = ROOT / 'public' / 'data' / 'kreiskarte.json'
    ziel.write_text(json.dumps(ausgabe, ensure_ascii=False, separators=(',', ':')), encoding='utf-8')
    print(f'{len(kreise)} Landkreise, {ziel.stat().st_size / 1024:.0f} KB -> {ziel}')
    print('Ohne Schlüssel:', ohne)


if __name__ == '__main__':
    main()
