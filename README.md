# Dachplattenrechner

Fachrechner für Dacheindeckungen mit Profilblechen: Materialbedarf, Plattenaufteilung, Zuschnitt, Verschnitt-Optimierung und PDF-Ausgabe.
Dazu Ratgeber-Artikel und eine Schneelast-/Windzonen-Suche nach Ort.

**Live:** <https://dachplattenrechner.de>

Entstanden aus meiner Arbeit in Beratung und Fertigung von Dachblechen.

## Was drin ist

- **Rechner** für Rechteck, Trapez, Dreiecksformen, Dachflächen, Lattenabstände, Sparren, Dacheindeckungs-Gewicht, U-Wert, PV-Fläche (`src/pages/tools/`)
- **Verschnitt-Optimierung** und **Kantteil-Editor** als eigenständige Werkzeuge (`tools/`)
- **Schneelast- und Windzonen** je Gemeinde, nachgeschlagen über Ort oder Postleitzahl
- **Ratgeber** als Content-Collection (`src/content/`)
- PDF-Export über `jspdf` und `html2canvas`

## Tech-Stack

Astro 6 (statische Ausgabe) · React 19 · TypeScript · Vitest · Netlify (Node 22) · Python-Skripte für die Datenaufbereitung

## Lokal starten

```bash
npm install
npm run dev        # Entwicklungsserver
npm run build      # statischer Build nach dist/
npm run preview    # Build ansehen
npm test           # Vitest
```

Node 22 wird empfohlen (so läuft auch der Netlify-Build).

## Fachdaten und Quellen

Die Dateien unter `public/data/` (Schneelast- und Windzonen, Gemeindezuordnung) sind **generiert** und werden nicht von Hand geändert.
Die Pipeline und alle Rohdatenquellen sind in [`scripts/README.md`](scripts/README.md) beschrieben. Genutzt werden:

- DIBt: Schneelast- und Windzonen nach Verwaltungsgrenzen
- BKG: Verwaltungsgebiete (VG250)
- Statistisches Bundesamt: Gebietsänderungen von Gemeinden
- GeoNames: Postleitzahlen
- OpenStreetMap (Overpass): Flussverläufe für die Zonenzuordnung an Mosel und Rhein

Die Rechner liefern Orientierungswerte. Für Planung und Statik gelten die jeweiligen Normen und die Angaben des Herstellers.

## Lizenz

Es ist keine Lizenz hinterlegt. Der Quellcode steht zur Ansicht; ohne ausdrückliche Lizenz sind Nutzung und Weitergabe nicht erlaubt.
