#!/usr/bin/env bash
# Baut alle Datendateien unter public/data aus den Rohdaten neu und startet danach die Tests.
#
#   scripts/rebuild-all.sh [--pruefen] [--ohne-hoehen] [--ohne-tests] [ROHDATEN_ORDNER]
#
#   --pruefen      nur Rohdateien und Python-Pakete prüfen und die Download-Quellen auflisten, nichts bauen
#   --ohne-hoehen  hoehen.json nicht neu erzeugen (der Schritt braucht Internet und viele API-Abfragen)
#   --ohne-tests   Tests am Ende überspringen
#
# Rohdaten liegen nicht im Repo. Standardordner: scripts/rohdaten (per .gitignore ausgeschlossen).
# Python: $PYTHON, sonst scripts/.venv/bin/python, sonst python3 (benötigt shapely, numpy, openpyxl).
# Reihenfolge und Hintergründe: scripts/README.md
set -euo pipefail

WURZEL="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$WURZEL"

NUR_PRUEFEN=0
MIT_HOEHEN=1
MIT_TESTS=1
ROH="$WURZEL/scripts/rohdaten"
for arg in "$@"; do
  case "$arg" in
    --pruefen) NUR_PRUEFEN=1 ;;
    --ohne-hoehen) MIT_HOEHEN=0 ;;
    --ohne-tests) MIT_TESTS=0 ;;
    -h|--help) sed -n '2,12p' "${BASH_SOURCE[0]}"; exit 0 ;;
    -*) echo "Unbekannte Option: $arg" >&2; exit 2 ;;
    *) ROH="$(cd "$arg" && pwd)" ;;
  esac
done

if [[ -n "${PYTHON:-}" ]]; then PY="$PYTHON"
elif [[ -x "$WURZEL/scripts/.venv/bin/python" ]]; then PY="$WURZEL/scripts/.venv/bin/python"
else PY="python3"; fi

VG="$ROH/vg250"
SCHNEE_XLSX="$ROH/Schneelastzonen_nach_Verwaltungsgrenzen.xlsx"
WIND_XLSX="$ROH/Windzonen_nach_Verwaltungsgrenzen.xlsx"
GEMEINDEN="$VG/gem"
KREISE="$VG/krs.json"
AEMTER="$GEMEINDEN/vwg13.json"
FLUSS="$ROH/osm/fluss.json"
DESTATIS="$ROH/destatis"
GEONAMES="$ROH/geonames/DE.txt"
HOEHEN_CACHE="$ROH/hoehen-cache.json"

# Pfad | Download-Quelle
ERWARTET=(
  "$SCHNEE_XLSX|https://www.dibt.de/fileadmin/dibt-website/Dokumente/Referat/P5/Technische_Bestimmungen/Schneelastzonen_nach_Verwaltungsgrenzen.xlsx"
  "$WIND_XLSX|https://www.dibt.de/fileadmin/dibt-website/Dokumente/Referat/P5/Technische_Bestimmungen/Windzonen_nach_Verwaltungsgrenzen.xlsx"
  "$KREISE|BKG VG250 WFS typeNames=vg250_krs (GeoJSON, EPSG:4326), siehe scripts/README.md"
  "$AEMTER|BKG VG250 WFS typeNames=vg250_vwg, cql_filter=sn_l='13' AND gf=4, propertyName=gen,bez,ags,ars"
  "$FLUSS|OpenStreetMap über Overpass API (Mosel und Rhein), Anfrage in scripts/README.md"
  "$GEONAMES|https://download.geonames.org/export/zip/DE.zip (Datei DE.txt)"
)
for land in 01 02 03 04 05 06 07 08 09 10 11 12 13 14 15 16; do
  ERWARTET+=("$GEMEINDEN/$land.json|BKG VG250 WFS typeNames=vg250_gem, cql_filter=sn_l='$land' AND gf=4 (GeoJSON)")
done
for jahr in $(seq 2008 2022); do
  [[ "$jahr" == 2009 ]] && continue   # 2009 bietet das Statistische Bundesamt nicht als Excel an
  ERWARTET+=("$DESTATIS/$jahr.xlsx|https://www.destatis.de/DE/Themen/Laender-Regionen/Regionales/Gemeindeverzeichnis/Namens-Grenz-Aenderung/$jahr.html")
done

echo "Rohdaten-Ordner: $ROH"
echo "Python:          $PY"
fehlt=0
for eintrag in "${ERWARTET[@]}"; do
  pfad="${eintrag%%|*}"
  quelle="${eintrag#*|}"
  if [[ -s "$pfad" ]]; then
    echo "  ok       ${pfad#$ROH/}"
  else
    echo "  FEHLT    ${pfad#$ROH/}"
    echo "           Quelle: $quelle"
    fehlt=$((fehlt + 1))
  fi
done

if ! "$PY" -c 'import shapely, numpy, openpyxl' 2>/dev/null; then
  echo "  FEHLT    Python-Pakete shapely, numpy, openpyxl"
  echo "           Einrichten: python3 -m venv scripts/.venv && scripts/.venv/bin/pip install shapely numpy openpyxl"
  fehlt=$((fehlt + 1))
fi

if (( fehlt > 0 )); then
  echo "Es fehlen $fehlt Voraussetzung(en). Abbruch." >&2
  exit 1
fi
echo "Alle Voraussetzungen sind erfüllt."
(( NUR_PRUEFEN )) && exit 0

if ! git diff --quiet -- public/data || ! git diff --cached --quiet -- public/data; then
  echo "public/data hat uncommittete Änderungen. Bitte erst committen oder verwerfen, damit der Vergleich am Ende aussagekräftig ist." >&2
  exit 1
fi

schritt() { echo; echo "==> $*"; }

schritt "1/9 Schneelastzonen (DIBt)"
"$PY" scripts/build-schneelastzonen.py "$SCHNEE_XLSX"
schritt "2/9 Windzonen (DIBt)"
"$PY" scripts/build-windzonen.py "$WIND_XLSX"
schritt "3/9 Amtsgebiete Mecklenburg-Vorpommern"
"$PY" scripts/ergaenze-amtsgebiete.py "$GEMEINDEN/13.json" "$AEMTER"
schritt "4/9 Gemeinden rechts von Mosel und Rhein (Rheinland-Pfalz)"
"$PY" scripts/ergaenze-flussgemeinden.py "$GEMEINDEN/07.json" "$FLUSS"
schritt "5/9 Landkreiskarte"
"$PY" scripts/build-kreiskarte.py "$KREISE"
schritt "6/9 Gemeindefusionen"
"$PY" scripts/ergaenze-gemeindefusionen.py "$GEMEINDEN" "$DESTATIS" "$SCHNEE_XLSX"
schritt "7/9 Gemeindekarte"
"$PY" scripts/build-gemeindekarte.py "$GEMEINDEN" "$SCHNEE_XLSX"
schritt "8/9 Postleitzahlen"
"$PY" scripts/build-plz.py "$GEMEINDEN" "$SCHNEE_XLSX" "$GEONAMES"
if (( MIT_HOEHEN )); then
  schritt "9/9 Geländehöhen (Internet nötig)"
  "$PY" scripts/build-hoehen.py "$GEMEINDEN" "$GEONAMES" "$HOEHEN_CACHE"
else
  schritt "9/9 Geländehöhen übersprungen (--ohne-hoehen), hoehen.json bleibt unverändert"
fi

schritt "Geänderte Datendateien"
git diff --stat -- public/data || true

if (( MIT_TESTS )); then
  schritt "Tests"
  npx vitest run
fi
echo
echo "Fertig. Änderungen in public/data prüfen (git diff --stat) und erst dann committen."
