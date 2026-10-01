#!/usr/bin/env python3
"""Erzeugt public/data/hoehen.json: Geländehöhe (m ü. NN) je Gemeinde als Richtwert für die Schneelast.

Die Schneelast am Boden s_k hängt nach DIN EN 1991-1-3/NA von Zone und Geländehöhe ab. Als Höhe dient ein Punkt in der
Ortsmitte: aus den GeoNames-Koordinaten der Postleitzahlen der Gemeinde der Punkt, der dem Median aller Punkte am nächsten
liegt, sonst ein innerer Punkt der Gemeindefläche. Die Höhe stammt aus dem Höhenmodell Copernicus GLO-90 über die
Open-Meteo-Höhen-API (https://open-meteo.com/en/docs/elevation-api, CC BY 4.0, Abfrage in 100er-Paketen);
bei erreichtem Tageslimit weichen die restlichen Abfragen auf Open Topo Data (EU-DEM 25 m) aus.
Quellen: GeoNames Postal Codes DE (CC BY 4.0), Gemeindegrenzen BKG VG250 (dl-de/by-2-0), Zuordnung wie build-plz.py.
Aufruf: python3 scripts/build-hoehen.py <ordner_mit_gem_01.json..16.json> <DE.txt> <cache.json>
        (cache.json speichert abgefragte Höhen und macht den Lauf wiederholbar, falls die API Abfragen begrenzt)
Reihenfolge: nach ergaenze-gemeindefusionen.py (benötigt kreiskarte.json).
Ausgabe: {"stand","quelle","h": {"<Land>|<Landkreis>": {"<Gemeinde>": Höhe in m}}}
"""
import csv
import json
import sys
import time
import urllib.request
from pathlib import Path

import numpy as np
import shapely
from shapely.geometry import shape
from shapely.strtree import STRtree

ROOT = Path(__file__).resolve().parent.parent
API = 'https://api.open-meteo.com/v1/elevation'
API_AUSWEICH = 'https://api.opentopodata.org/v1/eudem25m'
PAKET = 100
PAUSE = 1.0  # Sekunden zwischen Abfragen


def abfrage_open_meteo(paket):
    lons = ','.join(k.split(',')[0] for k in paket)
    lats = ','.join(k.split(',')[1] for k in paket)
    with urllib.request.urlopen(f'{API}?latitude={lats}&longitude={lons}', timeout=60) as r:
        return json.load(r)['elevation']


def abfrage_opentopodata(paket):
    """Ausweichquelle bei Tageslimit: Copernicus EU-DEM 25 m (Abweichung zu GLO-90 im Meterbereich)."""
    orte = '|'.join(f"{k.split(',')[1]},{k.split(',')[0]}" for k in paket)
    with urllib.request.urlopen(f'{API_AUSWEICH}?locations={orte}', timeout=60) as r:
        return [e['elevation'] for e in json.load(r)['results']]


def hole_hoehen(punkte, cache_pfad):
    """Höhen je (lon, lat), mit Cache auf der Festplatte; bei 429 (Limit der API) Ausweichquelle."""
    cache = json.loads(cache_pfad.read_text()) if cache_pfad.exists() else {}
    schluessel = lambda p: f'{p[0]:.4f},{p[1]:.4f}'  # noqa: E731
    offen = sorted({schluessel(p) for p in punkte} - set(cache))
    abfrage = abfrage_open_meteo
    for i in range(0, len(offen), PAKET):
        paket = offen[i:i + PAKET]
        for versuch in range(5):
            try:
                werte = abfrage(paket)
                break
            except Exception as fehler:  # noqa: BLE001 - Netzwerkfehler/Limit: Ausweichquelle bzw. warten
                print('Abfrage fehlgeschlagen:', fehler)
                if '429' in str(fehler) and abfrage is abfrage_open_meteo:
                    abfrage = abfrage_opentopodata
                else:
                    time.sleep(10 * (versuch + 1))
        else:
            cache_pfad.write_text(json.dumps(cache))
            raise SystemExit('Höhen-API nicht erreichbar; Cache gespeichert, Skript erneut starten.')
        cache.update(dict(zip(paket, werte)))
        cache_pfad.write_text(json.dumps(cache))
        time.sleep(PAUSE)
    return {p: cache[schluessel(p)] for p in punkte}


def main():
    ordner, plz_datei, cache_pfad = Path(sys.argv[1]), Path(sys.argv[2]), Path(sys.argv[3])
    karte = json.loads((ROOT / 'public/data/kreiskarte.json').read_text(encoding='utf-8'))
    kreis_nach_ags = {k['ags']: k for k in karte['kreise']}

    gemeinden = []  # (land, kreis, name, geometrie)
    for datei in sorted(ordner.glob('[0-9][0-9].json')):
        for f in json.loads(datei.read_text(encoding='utf-8'))['features']:
            p = f['properties']
            kreis = kreis_nach_ags.get(p['ags'][:5])
            if kreis and kreis['k']:
                gemeinden.append((kreis['land'], kreis['k'], p['gen'], shape(f['geometry'])))

    baum = STRtree([g[3] for g in gemeinden])
    punkte_je_gemeinde = {}
    for r in csv.reader(plz_datei.open(encoding='utf-8'), delimiter='\t'):
        if len(r) < 11 or not r[9] or not r[10]:
            continue
        pkt = shapely.Point(float(r[10]), float(r[9]))
        for i in baum.query(pkt, predicate='within')[:1]:
            punkte_je_gemeinde.setdefault(int(i), []).append((pkt.x, pkt.y))

    wahl = []
    for i, (_, _, _, geom) in enumerate(gemeinden):
        punkte = punkte_je_gemeinde.get(i)
        if punkte:
            mitte = np.median(np.array(punkte), axis=0)
            x, y = min(punkte, key=lambda p: (p[0] - mitte[0]) ** 2 + (p[1] - mitte[1]) ** 2)
        else:
            rp = geom.representative_point()
            x, y = rp.x, rp.y
        wahl.append((round(x, 4), round(y, 4)))

    hoehen = hole_hoehen(wahl, cache_pfad)
    ausgabe = {}
    for (land, kreis, name, _), p in zip(gemeinden, wahl):
        h = hoehen[p]
        if h is None:
            continue
        ausgabe.setdefault(f'{land}|{kreis}', {})[name] = round(h)

    ziel = ROOT / 'public' / 'data' / 'hoehen.json'
    ziel.write_text(json.dumps({
        'stand': karte['stand'],
        'quelle': 'Höhen: Copernicus GLO-90 über Open-Meteo (CC BY 4.0); Orte: GeoNames (CC BY 4.0), BKG VG250',
        'h': ausgabe,
    }, ensure_ascii=False, separators=(',', ':')), encoding='utf-8')
    anzahl = sum(len(v) for v in ausgabe.values())
    mit_plz = sum(1 for i in range(len(gemeinden)) if i in punkte_je_gemeinde)
    print(f'{anzahl} Gemeinden ({mit_plz} mit PLZ-Ortsmitte, Rest innerer Flächenpunkt), {ziel.stat().st_size / 1024:.0f} KB -> {ziel}')


if __name__ == '__main__':
    main()
