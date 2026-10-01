#!/usr/bin/env python3
"""Ergänzt Schneelastzonen für Gemeinden, die nach dem Stand der DIBt-Tabelle neu gebildet wurden.

Die DIBt-Tabelle kennt z. B. "Jahnatal" (Sachsen) oder "Am Ohmberg" (Thüringen) nicht, weil diese Gemeinden durch
Zusammenschluss entstanden sind. Die Zone wird aus den Vorgängergemeinden abgeleitet, wenn alle Vorgänger in derselben
Zone lagen. Bei abweichenden Zonen bleibt die Gemeinde ohne Zone (die Karte zeigt sie grau).
Quellen:
  - Statistisches Bundesamt, "Gebietsänderungen" 2008-2022 (je Jahr eine Excel-Datei, alte und neue AGS/Namen):
      https://www.destatis.de/DE/Themen/Laender-Regionen/Regionales/Gemeindeverzeichnis/Namens-Grenz-Aenderung/<JAHR>.html
  - Grenzen/AGS der aktuellen Gemeinden: BKG VG250 (siehe build-gemeindekarte.py)
  - Schneelastzonen: DIBt-Excel (AGS-Zonen) und public/data/schneelastzonen.json
Aufruf: python3 scripts/ergaenze-gemeindefusionen.py <ordner_gem_01.json..16.json> <ordner_mit_<JAHR>.xlsx> <schneelastzonen.xlsx>
Reihenfolge: nach ergaenze-amtsgebiete.py, vor build-kreiskarte.py / build-gemeindekarte.py (idempotent).
"""
import json
import re
import sys
import warnings
from pathlib import Path

import openpyxl

sys.path.insert(0, str(Path(__file__).resolve().parent))
from gemeindenamen import Namensindex  # noqa: E402

warnings.filterwarnings('ignore')
ROOT = Path(__file__).resolve().parent.parent
LAENDER = {'01': 'SH', '02': 'HH', '03': 'NI', '04': 'HB', '05': 'NW', '06': 'HE', '07': 'RP', '08': 'BW',
           '09': 'BY', '10': 'SL', '11': 'BE', '12': 'BB', '13': 'MV', '14': 'SN', '15': 'ST', '16': 'TH'}
JAHRE = range(2008, 2023)  # 2009 wird vom Statistischen Bundesamt nicht als Excel angeboten und entfällt
ZONEN = {'1', '1a', '2', '2a', '3', '3a', '>3', '>3a'}
HINWEIS = 'Zone aus den Vorgängergemeinden abgeleitet (Gemeindezusammenschluss nach Stand der DIBt-Tabelle).'


def basisname(name):
    return re.sub(r',\s*(Stadt|Markt|Gemeinde|Hansestadt|Universitätsstadt|Landeshauptstadt)$', '', name.strip())


def lese_fusionen(ordner):
    """neuer AGS -> {alter AGS: alter Name} aus den jährlichen Destatis-Dateien (nur Zeilen, in denen sich der Schlüssel ändert)."""
    vorgaenger = {}
    for jahr in JAHRE:
        datei = ordner / f'{jahr}.xlsx'
        if not datei.exists():
            continue
        wb = openpyxl.load_workbook(datei, data_only=True, read_only=True)
        for ws in wb:
            for r in ws.iter_rows(values_only=True):
                zellen = [str(c).strip() for c in r if c is not None]
                if len(zellen) < 6 or 'Gemeinde' not in zellen[:3] or 'Gemeindeverband' in zellen[:3]:
                    continue
                ags = [(i, z) for i, z in enumerate(zellen) if re.fullmatch(r'\d{8}', z)]
                if len(ags) < 2:
                    continue
                (i_alt, alt), (i_neu, neu) = ags[0], ags[1]
                if alt == neu:
                    continue
                name_alt = zellen[i_alt + 1] if i_alt + 1 < len(zellen) else ''
                vorgaenger.setdefault(neu, {})[alt] = name_alt
    return vorgaenger


def vorfahren(ags, vorgaenger, tiefe_max=6):
    """Ebenenweise (Nachbar zuerst) alle Vorgänger-AGS: [{ags: name}, ...]."""
    ebenen, aktuell = [], {ags}
    for _ in range(tiefe_max):
        naechste = {}
        for a in aktuell:
            naechste.update(vorgaenger.get(a, {}))
        if not naechste:
            break
        ebenen.append(naechste)
        aktuell = set(naechste)
    return ebenen


def ags_zonen(xlsx):
    wb = openpyxl.load_workbook(xlsx, data_only=True, read_only=True)
    ergebnis = {}
    for ws in wb:
        if ws.title.startswith('Erl'):
            continue
        nw = ws.title.startswith('NW')
        for r in ws.iter_rows(values_only=True):
            ags = next((str(c).strip() for c in r if c is not None and re.fullmatch(r'\d{7,8}', str(c).strip())), None)
            z = str((r[3] if nw else (r[4] if len(r) > 4 else None)) or '').strip().lower().replace(' ', '')
            if ags and z in ZONEN:
                ergebnis[ags.zfill(8)] = z
    return ergebnis


def main():
    gem_ordner, gv_ordner, xlsx = Path(sys.argv[1]), Path(sys.argv[2]), Path(sys.argv[3])
    daten_pfad = ROOT / 'public/data/schneelastzonen.json'
    daten = json.loads(daten_pfad.read_text(encoding='utf-8'))
    kreiskarte = json.loads((ROOT / 'public/data/kreiskarte.json').read_text(encoding='utf-8'))
    kreis_nach_ags = {k['ags']: k for k in kreiskarte['kreise'] if k['k']}
    vorgaenger = lese_fusionen(gv_ordner)
    ags_zone = ags_zonen(xlsx)

    zeilen = daten['zeilen']
    standard = {(z[0], z[1]) for z in zeilen if z[2] is None}
    # je Landkreis und (für Vorgänger in anderen Landkreisen) je Land; Land-Index nutzt "*" als Landkreis
    je_kreis, je_land = Namensindex(), Namensindex()
    for z in zeilen:
        if z[2] is not None:
            je_kreis.add(z[0], z[1], basisname(z[2]), z[3])
            je_land.add(z[0], '*', basisname(z[2]), z[3])

    neu, mehrdeutig, ohne = [], [], []
    for datei in sorted(gem_ordner.glob('[0-9][0-9].json')):
        for f in json.loads(datei.read_text(encoding='utf-8'))['features']:
            p = f['properties']
            kreis = kreis_nach_ags.get(p['ags'][:5])
            if not kreis or kreis['stadt']:
                continue
            land, schl = kreis['land'], kreis['k']
            if (land, schl) in standard or p['ags'] in ags_zone or je_kreis.finde(land, schl, basisname(p['gen'])) is not None:
                continue  # Zone ist bereits über Schlüssel, Name oder Landkreis-Standard bekannt
            gefunden = None
            for ebene in vorfahren(p['ags'], vorgaenger):
                zonen = set()
                for alt, name in ebene.items():
                    if alt in ags_zone:
                        zonen.add(ags_zone[alt])
                        continue
                    z = je_kreis.finde(land, schl, basisname(name)) or je_land.finde(land, '*', basisname(name))
                    if z:
                        zonen.add(z)
                if zonen:
                    gefunden = zonen
                    break
            if gefunden is None:
                ohne.append(f"{land} {p['gen']}")
            elif len(gefunden) > 1:
                mehrdeutig.append(f"{land} {p['gen']} {sorted(gefunden)}")
            else:
                neu.append([land, schl, p['gen'], next(iter(gefunden)), HINWEIS])

    for z in neu:
        if (z[0], z[1], z[2]) not in {(a[0], a[1], a[2]) for a in zeilen}:
            zeilen.append(z)
    daten_pfad.write_text(json.dumps(daten, ensure_ascii=False, separators=(',', ':')), encoding='utf-8')
    print(f'{len(neu)} Gemeinden aus Vorgängern abgeleitet, {len(mehrdeutig)} mehrdeutig, {len(ohne)} ohne Vorgänger-Zone')
    print('Mehrdeutig:', mehrdeutig[:20])
    print('Ohne:', ohne[:40])


if __name__ == '__main__':
    main()
