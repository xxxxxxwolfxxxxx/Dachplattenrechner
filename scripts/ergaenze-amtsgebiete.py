#!/usr/bin/env python3
"""Ergänzt in schneelastzonen.json und windzonen.json Gemeindezeilen für Zonen, die die DIBt nur als Amtsgebiet nennt.

Betroffen ist Mecklenburg-Vorpommern. Die DIBt-Tabellen nennen dort z. B. "alle Gemeinden im Amtsgebiet Lubmin" oder
"alle Gemeinden auf der Insel Usedom" statt einzelner Gemeinden. Die Zugehörigkeit zu Ämtern liefert das BKG (VG250):
  Gemeinden: .../wfs_vg250?...typeNames=vg250_gem...cql_filter=sn_l='13' AND gf=4         (Datei 13.json)
  Ämter:     .../wfs_vg250?...typeNames=vg250_vwg...cql_filter=sn_l='13' AND gf=4         (Datei vwg13.json)
(Aufruf-URLs siehe build-gemeindekarte.py; für vwg zusätzlich &propertyName=gen,bez,ags,ars)
Der ARS einer Gemeinde beginnt mit dem 9-stelligen ARS ihres Amtes bzw. der amtsfreien Gemeinde.

Reihenfolge der Skripte: build-schneelastzonen -> build-windzonen -> ergaenze-amtsgebiete -> ergaenze-flussgemeinden -> build-kreiskarte -> build-gemeindekarte
Aufruf: python3 scripts/ergaenze-amtsgebiete.py <13.json> <vwg13.json>   (idempotent)
"""
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
LAND = 'MV'

# (Datensatz, Landkreis laut Zonendaten, Zone, Ämter bzw. amtsfreie Gemeinden laut VG250, Ausnahmegemeinden, Quelle)
REGELN = [
    ('schnee', 'Vorpommern-Greifswald', '3', ['Lubmin', 'Usedom-Nord', 'Usedom-Süd', 'Heringsdorf'], [],
     'Amtsgebiet Lubmin bzw. Insel Usedom (Ämter Usedom-Nord und Usedom-Süd, Gemeinde Heringsdorf).'),
    ('wind', 'Landkreis Rostock', '2', ['Bützow-Land', 'Güstrow-Land', 'Laage', 'Krakow am See', 'Mecklenburgische Schweiz', 'Gnoien', 'Güstrow', 'Teterow'], [],
     'Amtsgebiet Bützow-Land, Güstrow-Land, Laage, Krakow am See, Mecklenburgische Schweiz oder Gnoien bzw. Stadt Güstrow/Teterow.'),
    ('wind', 'Nordwestmecklenburg', '2', ['Gadebusch', 'Lützow-Lübstorf'], [],
     'Amtsgebiet Gadebusch oder Lützow-Lübstorf.'),
    ('wind', 'Vorpommern-Rügen', '4', ['West-Rügen', 'Nord-Rügen', 'Bergen auf Rügen'], ['Gustow', 'Poseritz', 'Garz/Rügen'],
     'Amtsgebiet West-Rügen (mit Insel Hiddensee), Nord-Rügen oder Bergen, ohne Gustow, Poseritz und Garz/Rügen.'),
]
KREIS_AGS = {'Vorpommern-Greifswald': '13075', 'Landkreis Rostock': '13072', 'Nordwestmecklenburg': '13074', 'Vorpommern-Rügen': '13073'}
DATEI = {'schnee': 'schneelastzonen.json', 'wind': 'windzonen.json'}


def main():
    gemeinden = json.loads(Path(sys.argv[1]).read_text(encoding='utf-8'))['features']
    aemter = {f['properties']['ars']: f['properties']['gen'] for f in json.loads(Path(sys.argv[2]).read_text(encoding='utf-8'))['features']}
    daten = {k: json.loads((ROOT / 'public/data' / v).read_text(encoding='utf-8')) for k, v in DATEI.items()}
    neu = {k: 0 for k in DATEI}

    for satz, kreis, zone, namen, ausnahmen, hinweis in REGELN:
        vorhanden = {(z[0], z[1], z[2]) for z in daten[satz]['zeilen']}
        treffer = 0
        for f in gemeinden:
            p = f['properties']
            amt = aemter.get(p['ars'][:9])
            if p['ags'][:5] != KREIS_AGS[kreis] or amt not in namen or p['gen'] in ausnahmen:
                continue
            treffer += 1
            if (LAND, kreis, p['gen']) not in vorhanden:
                daten[satz]['zeilen'].append([LAND, kreis, p['gen'], zone, hinweis])
                neu[satz] += 1
        # Ausnahmegemeinden gehören zur Standardzone des Landkreises und brauchen keine eigene Zeile
        gefundene_amtsnamen = {aemter.get(f['properties']['ars'][:9]) for f in gemeinden if f['properties']['ags'][:5] == KREIS_AGS[kreis]}
        fehlend = [n for n in namen if n not in gefundene_amtsnamen]
        if fehlend:
            raise SystemExit(f'Amt/Gemeinde nicht in VG250 gefunden: {fehlend}')
        print(f'{satz:6} {kreis}: {treffer} Gemeinden in Zone {zone}')

    for satz, name in DATEI.items():
        (ROOT / 'public/data' / name).write_text(json.dumps(daten[satz], ensure_ascii=False, separators=(',', ':')), encoding='utf-8')
    print('Neue Zeilen:', neu)


if __name__ == '__main__':
    main()
