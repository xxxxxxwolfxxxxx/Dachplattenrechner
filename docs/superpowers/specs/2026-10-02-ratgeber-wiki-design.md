# Ratgeber-Wiki – Design (Teilprojekt 1: Gerüst + Blechdach)

Stand: 2026-10-02 · Status: Entwurf zur Prüfung

## 1. Ziel

Aus den fünf Fließtext-Seiten unter `/projekt-dach/` wird ein Wiki unter `/ratgeber/`:
**für jeden Arbeitsschritt eine eigene Anleitung** mit nummerierten Einzelschritten, erklärenden
Bildern, Werkzeug- und Materialliste, typischen Fehlern und Sicherheitshinweisen.
Humor bleibt, aber dosiert und nur im Text.

### Gesamtvorhaben und Zerlegung

| Teilprojekt | Inhalt | Status |
|---|---|---|
| **1** | Wiki-Gerüst + Gewerk **Blechdach** (Referenz) | dieses Dokument |
| 2 | Ziegel und Betondachstein | später |
| 3 | Schindeln und Bitumenbahnen (inkl. Flachdach) | später |
| 4 | Dämmung, Dachfenster, Solar | später |

Jedes Teilprojekt bekommt eigene Spec, eigenen Plan, eigene Umsetzung. Teilprojekt 1 muss das
Gerüst so bauen, dass 2–4 nur noch Inhalte (Markdown-Dateien) sind.

## 2. Ist-Zustand (Befund)

- 5 Seiten (`planung`, `messen`, `uk`, `blech`, `winkel`), zusammen rund 1.100 Zeilen, jede mit
  kopiertem CSS (Schritt-Navigation, Seitennavigation) statt gemeinsamer Vorlage.
- Reiner Fließtext mit Zwischenüberschriften. Keine nummerierten Arbeitsschritte, keine
  Material-/Werkzeuglisten pro Schritt, keine Zeit-/Schwierigkeitsangaben.
- Humor ist durchgehend und steht teils anstelle von Fachinhalt.
- **Fachfehler:** `messen.astro`, Dachformen: „Flächenberechnung: 2x(Rechteckige Fläche +
  Neigungswinkel)" addiert eine Fläche und einen Winkel. Richtig: Dachfläche = Grundfläche ÷ cos(α)
  bzw. Länge × Sparrenlänge (Sparrenlänge = Breite ÷ cos α bei Satteldach-Hälften).
- Vorhandene Fotos: `plan-1..4`, `messen-1..4`, `uk-1..4`, `blech-1..4`, `winkel-1..4`
  (echte Fotos, teils 6000–10000 px breit). Müssen gesichtet und für Web verkleinert werden.
- Rechner, die als Schritt-Hilfe verlinkt werden: Lattenrechner, Anrissplan, Kantteil-Editor,
  Sparren-Rechner, Dachfläche berechnen, Schneelastzone.

## 3. Konkurrenz-Befund

Quellen: [heimwerker.de](https://www.heimwerker.de/trapezbleche-verlegen/),
[dachheld24](https://www.dachheld24.de/content-hub/trapezbleche/trapezbleche-verlegen/),
[dachbleche24 Befestigung](https://dachbleche24-shop.de/blogs/allgemein/trapezblech-befestigung),
[MAAS Montageanleitung](https://www.maasprofile.de/DATA/Montageanleitungen/Montageanleitungen_Trapez-_und_Wellblech.pdf),
Hornbach-/Bau.de-Foren.

**Was die Konkurrenz schwach macht (unsere Chance):**
- Kein Konkurrent hat nummerierte Schritte *mit* Bild pro Schritt. heimwerker.de: 4 Fotos für
  6 Kapitel; dachheld24: gar keine Bilder, nur PDF-Verweise.
- Keine Zeit-/Schwierigkeits-/Personenangabe, keine abhakbare Checkliste.
- Hersteller-PDFs sind fachlich gut, aber für Laien schwer lesbar und nicht verlinkbar.
- Kein Konkurrent verknüpft die Anleitung mit Rechnern (Latten, Zuschnitt, Fläche).

**Was wir übernehmen (fachlich abgesichert, Quellen oben):**

| Thema | Wert | Quelle |
|---|---|---|
| Unterkonstruktion Nadelholz | mind. Sortierklasse S10, Auflagerholz mind. 40×60 mm, besser 60×60 | MAAS |
| Auflagerabstand | meist max. 1500 mm, nach Profil und Statik | MAAS |
| Freier Überstand | Traufe max. 200 mm, First/Ortgang max. 70 mm | MAAS |
| Traufblech | ca. ⅓ in die Rinne | dachheld24 |
| Mindestneigung | je Blechtyp verschieden. Beispiel MAAS-Stahl: Profilhöhe ≤ 35 mm ca. 6° (Dachtiefe ≤ 10 m) bzw. ca. 10° (> 10 m); > 35 mm ca. 4° / 5°. Wiki: Tabelle nach Blechtyp | MAAS, Praxis |
| Schrauben | Standard 6/m²; flache Profile mehr (kleinere Schrauben); Hochprofil/Sandwich weniger (größere Schrauben) | Praxis |
| Querstoß | unter 10° vermeiden; Überdeckung Dach 200 mm (ab 20° Neigung 150 mm); Dichtband | MAAS |
| Dichtband | unter 10° zusätzlich in Querüberlappung | dachbleche24 |
| Formteile First/Ortgang | Überdeckung 100–150 mm, zwei Butyl-Dichtschnüre, **nicht im Überdeckungsbereich verschrauben** (Wärmeausdehnung) | MAAS |
| Schneiden | Knabber/Blechschere bevorzugt. Winkelschleifer **nur mit dünner 1-mm-Trennscheibe und jede Tafel einzeln** (Hersteller verbieten ihn wegen verbrannter Zink-/Lackschicht, Praxis-Ausnahme). **Späne und Staub gründlich abwischen – sie rosten** und lassen die Fläche rostig aussehen | MAAS, dachheld24, Praxis |
| Hinterlüftung | mind. 30 mm durchgehend, Ein-/Auslass an Traufe/First | Foren, Hersteller |
| Lagerung | trocken, leicht geneigt, Folie öffnen für Durchlüftung; Schutzfolie max. 4 Wochen UV | MAAS |
| Transport | hochkant, mind. 2 Personen, nie über verlegte Fläche ziehen | MAAS |
| Verlegerichtung | gegen die Hauptwetterrichtung: Beginn auf der wetterabgewandten Seite (Lee), Arbeit Richtung Wetterseite, freie Überlappungskanten zeigen vom Wind weg; bei Profilen mit Sicherheits-Seitenüberlappung untergeordnet (Herstellerangabe) | MAAS, heimwerker.de |
| Aluminium | nie mit unbehandeltem Stahl/Kupfer oder Kalk/Mörtel in Kontakt | MAAS |
| Absturz | Dachfanggerüst/Schutz bei > 20° Neigung und > 3 m Absturzhöhe (gewerblich); Privatpersonen: dieselbe Schutzlogik anwenden | BG Bau |

**Widersprüche in den Quellen – müssen im Wiki ehrlich benannt werden, nicht geglättet:**

1. **Schraubenposition:** Hochsicke (DIY-Shops, dachbleche24: „jede zweite Hochsicke, Rand dichter,
   mit Kalotte") vs. Wellental/Untersicke (MAAS-Stahlprofile: „in jedem Wellental"). Ursache:
   unterschiedliche Profilgeometrien und Herstellerfreigaben. **Regel im Wiki:** „Es gilt die
   Montageanleitung deines Profils; Standardfall Hobby-Trapezblech mit Kalotte: Hochsicke."
2. **Schrauben pro m²:** Quellen nennen 5 bis 12. **Praxisregel (Betreiber, Dachdecker-Erfahrung):
   in der Regel reichen 6 Schrauben/m².** Ausnahmen: sehr flache Profile (z. B. an Wänden) brauchen
   mehr, dort sind die Schrauben aber oft kleiner; Hochprofile und Sandwichelemente brauchen
   weniger, dafür deutlich größere Schrauben. Das Wiki nennt 6/m² als Standard und erklärt die
   Abweichungen nach Profiltyp (flach / Standard / Hochprofil / Sandwich).
3. **Mindestneigung:** hängt vom Blechtyp ab (Profilhöhe, Material, Sandwich, Dachtiefe). heimwerker.de
   „10 %" (≈ 5,7°) und die MAAS-Tabelle (4–10°) gelten nur für ihre Profile. Das Wiki führt eine
   Tabelle **nach Blechtyp** und verweist immer auf die Angabe des gekauften Profils.

Diese Werte sind **Richtwerte aus Herstellerangaben, keine Statik**. Jede Schrittseite trägt den
festen Hinweis „Herstellerangaben und Statik gehen vor".

## 4. Technischer Ansatz

**Astro Content Collection** (`src/content/ratgeber/`), ein Markdown-Dokument pro Arbeitsschritt.
Seiten, Übersichten und Navigation werden daraus generiert.

### 4.1 Datenmodell (Frontmatter, per Zod validiert)

```yaml
titel: "Traglattung auf der Konterlattung montieren"
gewerk: blechdach            # blechdach | ziegel | schindeln | …
phase: unterbau              # planung | vorbereitung | unterbau | eindeckung | details | pflege
reihenfolge: 40              # Sortierung innerhalb des Gewerks
beschreibung: "…"            # Meta-Description, 120–160 Zeichen
dauer: "ca. 1 Tag bei 30 m²"
schwierigkeit: 2             # 1 leicht … 3 anspruchsvoll
personen: 2
wetter: "trocken, wenig Wind"
werkzeug: [Akkuschrauber, Wasserwaage, Schlagschnur, …]
material: [{ name: "Dachlatte 40×60 mm", menge: "nach Rechner" }, …]
sicherheit: "Absturzsicherung vor dem Betreten …"   # Pflichtfeld, nie leer
typischeFehler: ["…", "…"]
rechner: [{ titel: "Lattenrechner", href: "/tools/lattenrechner/" }]
verwandt: [slug, slug]
quellen: [{ titel: "…", href: "…" }]
bilder: Pfad-Liste im Body (siehe 4.3)
```

Der Body enthält die nummerierten Schritte mit einer kleinen Komponente
`<Schritt nr="3" bild="traglatte-abstand.svg" alt="…">Text</Schritt>`.

### 4.2 URLs und Seiten

```
/ratgeber/                          Wiki-Startseite: Phasen-Übersicht + Suche
/ratgeber/blechdach/                Gewerk-Übersicht (alle Schritte in Reihenfolge)
/ratgeber/blechdach/<schritt>/      Schrittseite
```

Trailing Slash durchgehend (Projektregel, `build.format: 'directory'`). Interne Links immer
mit Slash. Sitemap läuft über das vorhandene `@astrojs/sitemap`.

### 4.3 Bilder

- **Technische Schrittbilder** (Schnitte, Maße, Abstände, Überdeckungen, Schraubbild): **SVG, von
  mir gezeichnet**, einheitlicher Stil über gemeinsame CSS-Variablen (Hell-/Dunkelmodus), Maße als
  Zahlen im Bild. Grund: KI-Bilder machen bei Schraubenabständen, Überdeckungen und
  Absturzsicherung Fehler; bei Anleitungen für Arbeiten auf dem Dach ist ein falsches Bild ein
  Sicherheitsrisiko.
- **Fotos**: vorhandene `*-1..4`-Fotos, auf max. 1600 px Breite als WebP/AVIF verkleinert, nur dort,
  wo sie zum Schritt passen.
- **Copilot (Chrome):** optional für Fotostil-Übersichten (z. B. Werkzeugtisch). Jedes Bild wird
  fachlich geprüft, Download nur nach ausdrücklicher Freigabe mit Dateiname und Quelle. Aktuell
  nicht eingeloggt; Anmeldung macht der Nutzer selbst.
- Alle Bilder: Pflicht-`alt`-Text, `width`/`height`, `loading="lazy"` (außer erstes Bild).
- **Keine reinen Humorbilder.**

### 4.4 Komponenten (jede eine Aufgabe)

| Komponente | Aufgabe |
|---|---|
| `RatgeberLayout.astro` | gemeinsame Seitenhülle, ersetzt kopiertes CSS in den 5 Altseiten |
| `Schritt.astro` | ein nummerierter Arbeitsschritt mit Bild |
| `SchrittKopf.astro` | Dauer, Schwierigkeit, Personen, Wetter |
| `MaterialListe.astro` | Werkzeug und Material, abhakbar (lokal im Browser, ohne Server) |
| `HinweisBox.astro` | Varianten `sicherheit` (immer ernst), `fehler`, `tipp`, `witz` |
| `PhasenNav.astro` | Fortschritts-/Phasenleiste und Zurück/Weiter |
| `RatgeberSuche.astro` | clientseitige Suche über einen beim Build erzeugten JSON-Index |

Bestehende `InfoBox.astro` und `AdUnit.astro` werden weiterverwendet. AdUnits nur an wenigen
Stellen pro Seite (nicht zwischen Einzelschritten).

### 4.5 SEO und Weiterleitungen

- Neue Adressen `/ratgeber/…`; die fünf alten Seiten bekommen **301-Weiterleitungen** in
  `netlify.toml` auf die thematisch passenden neuen Schritte:
  `/projekt-dach/` → `/ratgeber/blechdach/`, `/projekt-dach/messen/` →
  `/ratgeber/blechdach/aufmass/` usw. (genaue Zuordnung im Plan).
- Pro Schrittseite JSON-LD `HowTo` (Schritte, Werkzeug, Material, Dauer) über die vorhandene
  `SchemaMarkup.astro`, plus `BreadcrumbList`.
- Kanonische URL mit Trailing Slash, Eintrag in der Sitemap, Titel < 60 Zeichen.
- Nach dem Livegang: neue Sitemap in der Search Console einreichen (Nutzer-Aufgabe).

### 4.6 Humor-Regeln (verbindlich für alle Texte)

- Humor nur als **offensichtliche Übertreibung** („Dach, das aussieht wie ein Origami-Unfall").
- Maximal ein bis zwei Pointen pro Seite, bevorzugt in Einleitung, Randnotiz (`HinweisBox witz`)
  oder Fazit – **nie** innerhalb der nummerierten Arbeitsschritte.
- **Sicherheitsboxen und Maßangaben bleiben vollständig ernst.**
- Keine Witze, die ein Risiko verharmlosen (z. B. Alkohol auf dem Dach). Die bisherige
  „Dosierungshinweis"-Box zu Bier und Helfern wird entschärft: Der Hinweis „nach der Arbeit, nicht
  davor" bleibt, aber ohne Spaß mit dem Absturz.

## 5. Inhalt Blechdach (Entwurf der Schrittliste)

Phase **Planung:** 1 Sicherheit & Absturzsicherung · 2 Wetter & Zeitplan · 3 Aufmaß ·
4 Dachfläche & Material berechnen (Rechner) · 5 Statik-Grundlagen (Schneelast, Eigenlast)
Phase **Vorbereitung:** 6 Material liefern, lagern, transportieren · 7 Altdach entfernen ·
8 Sparren prüfen und ausgleichen
Phase **Unterbau:** 9 Unterspannbahn · 10 Konterlattung · 11 Traglattung (Lattenrechner) ·
12 Hinterlüftung & Trennlage
Phase **Eindeckung:** 13 Ausschnüren & Verlegerichtung · 14 Traufe: Traufblech & Tropfkante ·
15 Bleche zuschneiden (Anrissplan, Kantteil-Editor) · 16 Verlegen & Verschrauben ·
17 Überdeckung, Querstoß & Dichtband
Phase **Details:** 18 First · 19 Ortgang · 20 Durchdringungen (Kamin, Entlüftung) ·
21 Dachrinne & Schneefang
Phase **Pflege:** 22 Kontrolle & Wartung · 23 Winkel messen (Bestand `winkel`)

Diese Liste wird beim Schreiben jedes Schritts gegen Hersteller-Anleitungen geprüft und kann
sich im Plan noch ändern. Die Altseite `projekt-dach/winkel` und `plan` gehen darin auf.

## 6. Qualitätssicherung

- **Tests (Vitest):** Frontmatter-Schema (Pflichtfelder, `sicherheit` nicht leer, `beschreibung`
  120–160 Zeichen), jeder `verwandt`-/`rechner`-Link existiert, jede Bilddatei existiert und hat
  `alt`, Reihenfolge je Gewerk lückenlos/eindeutig, jeder Altpfad hat eine 301-Weiterleitung.
- **Build:** `npm run build` ohne Fehler; Prüfung der erzeugten URLs inkl. Trailing Slash.
- **Visuell:** Screenshots bei 375, 768, 1440 px, Hell/Dunkel; Tastaturbedienung und
  `prefers-reduced-motion`.
- **Fachprüfung:** Jede Zahl in einer Schrittseite hat eine Quelle im Frontmatter. Die Seite wird
  mit dem Hinweis „Richtwerte, Herstellerangaben und Statik gehen vor" ausgeliefert.
- **Code-Review** nach der Umsetzung (Agent `code-reviewer`).

## 7. Nicht Teil von Teilprojekt 1

Ziegel, Schindeln, Bitumen, Dämmung, Fenster, Solar · Kommentarfunktion · Nutzerkonten ·
mehrsprachige Fassung · Video.

## 8. Offene Punkte für die Prüfung

1. Passt die Schrittliste in Abschnitt 5 (Reihenfolge, Granularität)?
2. Sollen die Fotos `*-1..4` wiederverwendet werden, oder machst du neue? (Ich sichte sie im Plan.)
3. Soll Copilot für die Fotostil-Übersichten wirklich eingeplant bleiben (dann bitte einloggen)?
