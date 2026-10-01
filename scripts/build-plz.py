#!/usr/bin/env python3
"""Erzeugt public/data/plz.json: Postleitzahl -> Gemeinden mit Schnee- und Windzone.

Quellen:
  - Postleitzahlen mit Koordinaten: GeoNames Postal Codes DE (CC BY 4.0)
      https://download.geonames.org/export/zip/DE.zip   (Datei DE.txt)
  - Gemeindegrenzen: BKG VG250 (siehe build-gemeindekarte.py), © GeoBasis-DE / BKG, dl-de/by-2-0
  - Zonen: public/data/schneelastzonen.json, windzonen.json (Auflösung wie in build-gemeindekarte.py)
Jeder Koordinatenpunkt eines Eintrags wird der Gemeinde zugeordnet, in der er liegt (sonst der nächsten innerhalb ca. 2 km).
Eine PLZ kann mehrere Gemeinden umfassen; behalten werden Gemeinden mit mindestens 10 % der Punkte der PLZ.
Aufruf: python3 scripts/build-plz.py <ordner_mit_gem_01.json..16.json> <schneelastzonen.xlsx> <DE.txt>
Reihenfolge: nach ergaenze-gemeindefusionen.py / build-gemeindekarte.py (benötigt kreiskarte.json).
"""
import csv
import importlib.util
import json
import sys
from collections import Counter
from pathlib import Path

import numpy as np
import shapely
from shapely.geometry import shape
from shapely.strtree import STRtree

sys.path.insert(0, str(Path(__file__).resolve().parent))
from gemeindenamen import Namensindex  # noqa: E402

ROOT = Path(__file__).resolve().parent.parent
MIN_ANTEIL = 0.10
MAX_ABSTAND = 0.02  # Grad, ca. 2 km

# Zonenauflösung der Gemeindekarte wiederverwenden (Dateiname enthält einen Bindestrich)
_spec = importlib.util.spec_from_file_location('gemeindekarte', Path(__file__).with_name('build-gemeindekarte.py'))
gk = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(gk)


def main():
    ordner, xlsx, plz_datei = Path(sys.argv[1]), Path(sys.argv[2]), Path(sys.argv[3])
    schnee, wind = gk.lade('schneelastzonen.json')['zeilen'], gk.lade('windzonen.json')['zeilen']
    karte = gk.lade('kreiskarte.json')
    kreis_nach_ags = {k['ags']: k for k in karte['kreise']}
    ags_zone = gk.ags_zonen(xlsx)

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

    kreise, kreis_index, gemeinden, geometrien = [], {}, {}, []
    for datei in sorted(ordner.glob('[0-9][0-9].json')):
        for f in json.loads(datei.read_text(encoding='utf-8'))['features']:
            p = f['properties']
            kreis = kreis_nach_ags.get(p['ags'][:5])
            if not kreis or not kreis['k']:
                continue
            land, schl = kreis['land'], kreis['k']
            if kreis['stadt']:
                zs = gk.zonen_je_kreis(schnee, land, schl, True)[0]
                zw = gk.zonen_je_kreis(wind, land, schl, True)[0]
            else:
                zs = ags_zone.get(p['ags']) or schnee_namen.finde(land, schl, p['gen']) or schnee_standard.get((land, schl))
                zw = wind_namen.finde(land, schl, p['gen']) or wind_standard.get((land, schl)) or wind_land.get(land)
            if (land, schl) not in kreis_index:
                kreis_index[(land, schl)] = len(kreise)
                kreise.append([land, schl])
            gemeinden[p['ags']] = [p['gen'], kreis_index[(land, schl)], zs, zw]
            geometrien.append((p['ags'], shape(f['geometry'])))

    baum = STRtree([g for _, g in geometrien])
    plz_punkte = {}
    for r in csv.reader(plz_datei.open(encoding='utf-8'), delimiter='\t'):
        if len(r) >= 11 and r[1].isdigit() and len(r[1]) == 5 and r[9] and r[10]:
            plz_punkte.setdefault(r[1], []).append((float(r[10]), float(r[9])))

    plz_ags, ohne = {}, 0
    for plz, punkte in sorted(plz_punkte.items()):
        zaehler = Counter()
        for x, y in punkte:
            pkt = shapely.Point(x, y)
            treffer = baum.query(pkt, predicate='within')
            if len(treffer) == 0:
                nah = baum.nearest(pkt)
                if nah is None or shapely.distance(pkt, baum.geometries[nah]) > MAX_ABSTAND:
                    continue
                treffer = [nah]
            zaehler[geometrien[int(treffer[0])][0]] += 1
        summe = sum(zaehler.values())
        if summe == 0:
            ohne += 1
            continue
        behalten = [a for a, n in zaehler.most_common() if n / summe >= MIN_ANTEIL]
        plz_ags[plz] = behalten

    benutzt = {a for liste in plz_ags.values() for a in liste}
    ausgabe = {
        'stand': karte['stand'],
        'quelle': 'Postleitzahlen: GeoNames (CC BY 4.0); Gemeindegrenzen: © GeoBasis-DE / BKG (VG250), Datenlizenz Deutschland – Namensnennung 2.0',
        'kreise': kreise,
        'gemeinden': {a: gemeinden[a] for a in sorted(benutzt)},
        'plz': plz_ags,
    }
    ziel = ROOT / 'public' / 'data' / 'plz.json'
    ziel.write_text(json.dumps(ausgabe, ensure_ascii=False, separators=(',', ':')), encoding='utf-8')
    mehrere = sum(1 for v in plz_ags.values() if len(v) > 1)
    print(f'{len(plz_ags)} PLZ ({mehrere} mit mehreren Gemeinden, {ohne} ohne Zuordnung), {len(benutzt)} Gemeinden, {ziel.stat().st_size / 1024:.0f} KB -> {ziel}')
    print('Ohne Schneelastzone:', sum(1 for a in benutzt if gemeinden[a][2] is None), '| ohne Windzone:', sum(1 for a in benutzt if gemeinden[a][3] is None))


if __name__ == '__main__':
    main()
