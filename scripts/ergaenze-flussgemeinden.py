#!/usr/bin/env python3
"""Ergänzt in windzonen.json Gemeindezeilen für Rheinland-Pfalz, wo die Windzone von der Lage zu Mosel bzw. Rhein abhängt.

Die DIBt-Tabelle (Anlage 7.2/7.3) ordnet dort "Gemeinden und Gemeindeteile rechts der Mosel" (Landkreise Cochem-Zell,
Bernkastel-Wittlich, Trier-Saarburg, Stadt Trier) bzw. "rechts der Mosel und rechts des Rheins" (Mayen-Koblenz, Stadt Koblenz)
der Windzone 1 zu, alle übrigen Flächen der Windzone 2. "Rechts" gilt in Fließrichtung.
Grundlage ist der Flussverlauf aus OpenStreetMap (© OpenStreetMap-Mitwirkende, ODbL) und die Gemeindeflächen des BKG (VG250).
Je Gemeinde wird der Flächenanteil rechts des Flusses geschätzt (Stichprobenraster, Seite je Punkt über den nächsten Flussabschnitt):
  - Anteil >= 50 %: Zone 1, Hinweis auf Gemeindeteile in Zone 2
  - Anteil >= 3 % und < 50 %: Zone 2, Hinweis auf Gemeindeteile in Zone 1
  - sonst reine Zone der überwiegenden Seite (kein Hinweis; kleine Reste entstehen durch Grenzungenauigkeit)
Download Flussverlauf (Overpass API, mit eigenem User-Agent; Anfrage in OVERPASS unten):
  curl -A "<Kontakt>" --data-urlencode data@q.txt https://overpass-api.de/api/interpreter -o fluss.json
Aufruf: python3 scripts/ergaenze-flussgemeinden.py <07.json (BKG-Gemeinden RP)> <fluss.json>   (idempotent)
Reihenfolge: nach build-windzonen.py (und ergaenze-amtsgebiete.py), vor build-gemeindekarte.py.
"""
import heapq
import json
import sys
from pathlib import Path

import numpy as np
import shapely
from shapely.geometry import LineString, shape

ROOT = Path(__file__).resolve().parent.parent
OVERPASS = '''[out:json][timeout:120];
(way["waterway"="river"]["name"="Mosel"](49.4,6.3,50.5,7.8);
 way["waterway"="river"]["name"="Rhein"](50.2,7.2,50.6,7.8););
out geom;'''
LAND = 'RP'
RASTER = 60          # Stichprobenpunkte je Achse
LUECKE = 0.003       # größte überbrückte Lücke zwischen OSM-Wegen in Grad (ca. 200 m)
MIN_ANTEIL = 0.03    # darunter gilt die Gemeinde als vollständig auf einer Seite

# Kreisfreie Städte (Trier, Koblenz) bleiben bei Zone 2 mit Hinweistext: die Karte stellt sie als eine Fläche dar.
# Landkreis (Schlüssel in windzonen.json) -> (AGS, Flüsse, deren rechte Seite Zone 1 ergibt)
KREISE = {
    'Cochem-Zell': ('07135', ['Mosel']),
    'Bernkastel-Wittlich': ('07231', ['Mosel']),
    'Trier-Saarburg': ('07235', ['Mosel']),
    'Mayen-Koblenz': ('07137', ['Mosel', 'Rhein']),
}
HINWEIS_1 = 'Gemeinde liegt überwiegend rechts der {fluss} (Windzone 1); Gemeindeteile links davon liegen in Windzone 2.'
HINWEIS_2 = 'Gemeinde liegt überwiegend links der {fluss} (Windzone 2); Gemeindeteile rechts davon liegen in Windzone 1.'
HINWEIS_REST = 'Lage rechts bzw. links des Flusses aus Flussverlauf und Gemeindegrenzen (BKG, OpenStreetMap) abgeleitet.'


def fluss_linie(elemente, name, ende):
    """Kürzester Weg durch das Netz der OSM-Wege vom südlichsten Punkt bis zum Punkt mit dem größten `ende`-Wert.

    Der Weg läuft in Fließrichtung und umgeht Nebenarme und Schleusenkanäle, die der Fluss in OSM um Inseln bildet.
    """
    kanten, knoten, enden = {}, set(), []
    for e in elemente:
        if e['tags']['name'] != name:
            continue
        pts = [(p['lon'], p['lat']) for p in e['geometry']]
        knoten.update(pts)
        enden += [pts[0], pts[-1]]
        for a, b in zip(pts, pts[1:]):
            laenge = ((a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2) ** 0.5
            kanten.setdefault(a, []).append((b, laenge))
            kanten.setdefault(b, []).append((a, laenge))
    # kleine Lücken zwischen Wegenden (z. B. an Schleusen, wo OSM die Wege nicht verbindet) überbrücken
    for i, a in enumerate(enden):
        for b in enden[i + 1:]:
            laenge = ((a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2) ** 0.5
            if 0 < laenge <= LUECKE:
                kanten.setdefault(a, []).append((b, laenge))
                kanten.setdefault(b, []).append((a, laenge))
    start = min(knoten, key=lambda k: k[1])
    ziel = max(knoten, key=ende)
    abstand, vorher, offen = {start: 0.0}, {}, [(0.0, start)]
    while offen:
        d, k = heapq.heappop(offen)
        if k == ziel:
            break
        if d > abstand.get(k, float('inf')):
            continue
        for n, l in kanten.get(k, []):
            if d + l < abstand.get(n, float('inf')):
                abstand[n], vorher[n] = d + l, k
                heapq.heappush(offen, (d + l, n))
    if ziel not in abstand:
        raise SystemExit(f'{name}: kein zusammenhängender Weg von {start} nach {ziel}')
    weg = [ziel]
    while weg[-1] != start:
        weg.append(vorher[weg[-1]])
    return LineString(weg[::-1])


def anteil_rechts(poly, linie):
    """Anteil der Fläche rechts der Linie (in Fließrichtung), geschätzt über ein Punktraster."""
    minx, miny, maxx, maxy = poly.bounds
    xs, ys = np.meshgrid(np.linspace(minx, maxx, RASTER), np.linspace(miny, maxy, RASTER))
    punkte = shapely.points(xs.ravel(), ys.ravel())
    punkte = punkte[shapely.contains(poly, punkte)]
    if len(punkte) == 0:
        punkte = np.array([poly.representative_point()])
    pos = shapely.line_locate_point(linie, punkte)
    eps = 1e-4
    vor = shapely.line_interpolate_point(linie, np.minimum(pos + eps, linie.length))
    zurueck = shapely.line_interpolate_point(linie, np.maximum(pos - eps, 0))
    nah = shapely.line_interpolate_point(linie, pos)
    dx = shapely.get_x(vor) - shapely.get_x(zurueck)
    dy = shapely.get_y(vor) - shapely.get_y(zurueck)
    px = shapely.get_x(punkte) - shapely.get_x(nah)
    py = shapely.get_y(punkte) - shapely.get_y(nah)
    rechts = (dx * py - dy * px) < 0  # Kreuzprodukt < 0: Punkt liegt rechts der Fließrichtung
    return float(rechts.mean())


def main():
    gemeinden = json.loads(Path(sys.argv[1]).read_text(encoding='utf-8'))['features']
    elemente = json.loads(Path(sys.argv[2]).read_text(encoding='utf-8'))['elements']
    linien = {'Mosel': fluss_linie(elemente, 'Mosel', lambda k: k[0] + k[1]), 'Rhein': fluss_linie(elemente, 'Rhein', lambda k: k[1])}
    daten_pfad = ROOT / 'public/data/windzonen.json'
    daten = json.loads(daten_pfad.read_text(encoding='utf-8'))
    zeilen = daten['zeilen']
    vorhanden = {(z[0], z[1], z[2]) for z in zeilen}

    neu, bericht = 0, []
    for kreis, (ags, fluesse) in KREISE.items():
        for f in gemeinden:
            p = f['properties']
            if p['ags'][:5] != ags:
                continue
            poly = shape(f['geometry'])
            # Zone 1 verlangt die Lage rechts aller genannten Flüsse (Mosel UND Rhein bei Koblenz/Mayen-Koblenz);
            # östlich des Rheins gilt die Mosel-Bedingung als erfüllt, da die Mosel dort bereits in den Rhein mündet.
            anteile = {fl: anteil_rechts(poly, linien[fl]) for fl in fluesse}
            if len(fluesse) == 2:
                anteil = anteile['Rhein']
                fluss = 'Rhein'
            else:
                anteil = anteile['Mosel']
                fluss = 'Mosel'
            if anteil >= 1 - MIN_ANTEIL:
                zone, hinweis = '1', HINWEIS_REST
            elif anteil <= MIN_ANTEIL:
                continue  # Standardzone 2 des Landkreises
            elif anteil >= 0.5:
                zone, hinweis = '1', HINWEIS_1.format(fluss=fluss)
            else:
                zone, hinweis = '2', HINWEIS_2.format(fluss=fluss)
                # Zone 2 ist Landkreis-Standard, die Zeile trägt nur den Hinweis auf Gemeindeteile in Zone 1
            bericht.append((kreis, p['gen'], round(anteil, 2), zone))
            if (LAND, kreis, p['gen']) not in vorhanden:
                zeilen.append([LAND, kreis, p['gen'], zone, hinweis])
                neu += 1
    daten_pfad.write_text(json.dumps(daten, ensure_ascii=False, separators=(',', ':')), encoding='utf-8')
    for b in sorted(bericht):
        print(*b)
    print(f'{neu} Gemeindezeilen ergänzt')


if __name__ == '__main__':
    main()
