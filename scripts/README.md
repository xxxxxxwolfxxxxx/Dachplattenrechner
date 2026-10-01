# Datenpipeline für Schnee- und Windzonen

Die Dateien unter `public/data/` sind **generiert**. Nicht von Hand ändern, sondern die Skripte anpassen und neu bauen.

```bash
scripts/rebuild-all.sh --pruefen          # nur prüfen: Rohdaten, Python-Pakete, Download-Quellen
scripts/rebuild-all.sh                    # alles neu bauen, danach Tests
scripts/rebuild-all.sh --ohne-hoehen      # ohne den Internet-Schritt für die Höhen
scripts/rebuild-all.sh /pfad/zu/rohdaten  # anderer Rohdaten-Ordner (Standard: scripts/rohdaten)
```

Der Lauf bricht ab, wenn `public/data` uncommittete Änderungen hat. Am Ende steht `git diff --stat` für die Datendateien,
dann die Tests (`npx vitest run`). Committet wird bewusst nicht automatisch.

## Einrichtung

```bash
python3 -m venv scripts/.venv
scripts/.venv/bin/pip install shapely numpy openpyxl
```

`scripts/.venv/` und `scripts/rohdaten/` stehen in der `.gitignore`. Die Skripte brauchen Python 3 und die drei Pakete.

## Rohdaten (nicht im Repo)

Alles unter `scripts/rohdaten/`:

| Datei | Quelle |
|---|---|
| `Schneelastzonen_nach_Verwaltungsgrenzen.xlsx` | DIBt, <https://www.dibt.de/fileadmin/dibt-website/Dokumente/Referat/P5/Technische_Bestimmungen/Schneelastzonen_nach_Verwaltungsgrenzen.xlsx> |
| `Windzonen_nach_Verwaltungsgrenzen.xlsx` | DIBt, gleicher Pfad mit `Windzonen_nach_Verwaltungsgrenzen.xlsx` |
| `vg250/krs.json` | BKG VG250, WFS `vg250_krs`, GeoJSON, EPSG:4326 |
| `vg250/gem/01.json` bis `16.json` | BKG VG250, WFS `vg250_gem`, je Bundesland (`sn_l='01'` bis `'16'`, `gf=4`) |
| `vg250/gem/vwg13.json` | BKG VG250, WFS `vg250_vwg`, `sn_l='13' AND gf=4`, `propertyName=gen,bez,ags,ars` (Ämter in MV) |
| `osm/fluss.json` | OpenStreetMap über Overpass (Mosel und Rhein), Anfrage siehe unten |
| `destatis/2008.xlsx` bis `2022.xlsx` (ohne 2009) | Statistisches Bundesamt, Gebietsänderungen je Jahr, <https://www.destatis.de/DE/Themen/Laender-Regionen/Regionales/Gemeindeverzeichnis/Namens-Grenz-Aenderung/JAHR.html> |
| `geonames/DE.txt` | GeoNames Postal Codes, <https://download.geonames.org/export/zip/DE.zip> |

VG250-Abfragen (WFS-Basis `https://sgx.geodatenzentrum.de/wfs_vg250`):

```bash
BASIS='https://sgx.geodatenzentrum.de/wfs_vg250?service=WFS&version=2.0.0&request=GetFeature&outputFormat=application/json&srsName=EPSG:4326'
curl -o krs.json   "$BASIS&typeNames=vg250_krs"
curl -o 09.json    "$BASIS&typeNames=vg250_gem&cql_filter=sn_l='09'%20AND%20gf=4"
curl -o vwg13.json "$BASIS&typeNames=vg250_vwg&cql_filter=sn_l='13'%20AND%20gf=4&propertyName=gen,bez,ags,ars"
```

Overpass-Anfrage für `osm/fluss.json` (mit eigenem User-Agent senden):

```bash
cat > q.txt <<'EOF'
[out:json][timeout:120];
(way["waterway"="river"]["name"="Mosel"](49.4,6.3,50.5,7.8);
 way["waterway"="river"]["name"="Rhein"](50.2,7.2,50.6,7.8););
out geom;
EOF
curl -A "<Kontakt>" --data-urlencode data@q.txt https://overpass-api.de/api/interpreter -o fluss.json
```

`rebuild-all.sh` hat die Abfragen selbst nicht eingebaut, es prüft nur, ob die Dateien da sind. Die Quellen stehen auch in den
Skriptköpfen.

## Reihenfolge

| # | Skript | Liest | Schreibt |
|---|---|---|---|
| 1 | `build-schneelastzonen.py` | DIBt-Excel Schnee | `schneelastzonen.json` |
| 2 | `build-windzonen.py` | DIBt-Excel Wind, `schneelastzonen.json` | `windzonen.json` |
| 3 | `ergaenze-amtsgebiete.py` | `13.json`, `vwg13.json` | ergänzt beide Zonendateien (MV) |
| 4 | `ergaenze-flussgemeinden.py` | `07.json`, `fluss.json` | ergänzt `windzonen.json` (RP) |
| 5 | `build-kreiskarte.py` | `krs.json`, `schneelastzonen.json` | `kreiskarte.json` |
| 6 | `ergaenze-gemeindefusionen.py` | Gemeinden, Destatis, DIBt-Excel, `kreiskarte.json` | ergänzt `schneelastzonen.json` |
| 7 | `build-gemeindekarte.py` | Gemeinden, DIBt-Excel, Zonen, `kreiskarte.json` | `gemeindekarte.json` |
| 8 | `build-plz.py` | Gemeinden, DIBt-Excel, `DE.txt`, Zonen | `plz.json` |
| 9 | `build-hoehen.py` | Gemeinden, `DE.txt`, `kreiskarte.json`, Internet | `hoehen.json` |

`gemeindenamen.py` ist ein gemeinsames Hilfsmodul (Namensabgleich), kein eigener Schritt.

**Hinweis zur Reihenfolge:** Die Skriptköpfe nennen für `ergaenze-gemeindefusionen.py` die Position „vor `build-kreiskarte.py`“,
das Skript liest aber selbst `kreiskarte.json`. Die Reihenfolge oben ist aus dem abgeleitet, was jedes Skript liest und schreibt,
und passt dazu: Die Fusionen ergänzen nur Gemeindezeilen in bestehenden Landkreisen, dadurch ändert sich die Landkreiskarte nicht.
Ein vollständiger Neuaufbau aus den Originalrohdaten ist mit dieser Reihenfolge noch nicht gelaufen, weil die Rohdaten im Repo fehlen.
Beim ersten Lauf deshalb `git diff --stat public/data` prüfen: Die Dateien sollten sich nur minimal oder gar nicht ändern.

## Bekannte Grenzen

- **Thüringen:** Die DIBt-Tabelle nennt teils alte Gemeindenamen. Für etwa die Hälfte davon fehlt die Höhe in `hoehen.json`
  (das Höhenfeld im Fazit bleibt dann leer). Einige Gemeinden haben keine Schneelastzone und erscheinen grau (insgesamt 13).
- **Baden-Württemberg:** Ulm fehlt in der DIBt-Schneetabelle.
- **Rheinland-Pfalz, Windzone an Mosel und Rhein:** Die DIBt-Anlage ordnet Gemeinden „rechts der Mosel“ bzw. „rechts der Mosel
  und rechts des Rheins“ der Windzone 1 zu. Die Zuordnung je Gemeinde erfolgt nach dem Flächenanteil rechts des Flusses
  (ab 50 % Zone 1, ab 3 % Hinweis auf Gemeindeteile). Für Mayen-Koblenz ist „rechts der Mosel bzw. des Rheins“ eine Lesart der
  Anlage 7.3, nicht die einzig mögliche.
- **Postleitzahl zu Gemeinde:** Näherung über GeoNames-Koordinaten und BKG-Gemeindegrenzen. Rund 1.300 Postleitzahlen gehören zu
  mehreren Gemeinden, dort wählt der Nutzer. Behalten werden Gemeinden mit mindestens 10 % der Punkte einer Postleitzahl.
- **Höhe:** Richtwert für die Ortsmitte (Copernicus GLO-90 über Open-Meteo, bei Tageslimit Open Topo Data), nicht die Höhe des
  Grundstücks. `build-hoehen.py` legt einen Cache an (`hoehen-cache.json`), damit ein abgebrochener Lauf fortgesetzt werden kann.
- **Neu gebildete Gemeinden:** Die Zone wird aus den Vorgängergemeinden abgeleitet, sofern alle in derselben Zone lagen.
- **Die Lastwerte im Fazit** sind eine Vorbemessung, keine Statik.

## Quellen und Lizenzen (beibehalten)

- DIBt: Zuordnung der Schnee- und Windzonen nach Verwaltungsgrenzen (Stand Schnee 07.02.2023, Wind 02.06.2022).
- BKG: Verwaltungsgebiete 1:250 000 (VG250), © GeoBasis-DE / BKG, Datenlizenz Deutschland Namensnennung 2.0 (dl-de/by-2-0).
- GeoNames Postal Codes, CC BY 4.0.
- Open-Meteo Elevation API (Copernicus GLO-90), CC BY 4.0.
- OpenStreetMap-Mitwirkende, ODbL (Flussverlauf).
- Statistisches Bundesamt: Gebietsänderungen.
