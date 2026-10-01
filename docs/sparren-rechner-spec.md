# Sparren-Rechner – Spezifikation (Phase 1)

## Ziel
Mehr organische Besucher über Suchanfragen wie „Sparrenquerschnitt berechnen“, „Sparren Tragfähigkeit“,
„Sparrentabelle“ und „Gewicht Dacheindeckung“. Alleinstellung gegenüber den Wettbewerbern: dachspezifische Last
(Eindeckung + Schnee aus Zone/Höhe/Neigung) statt einer vom Nutzer geschätzten Flächenlast.

## Seiten
1. `/tools/sparren-rechner/` – Rechner, Rechenweg, Spannweitentabellen, Faustformel, FAQ.
2. `/tools/dacheindeckung-gewicht/` – Gewichtstabelle der Eindeckungen (speist den Rechner), Verlinkung zurück.

## Rechenmodell (`src/utils/sparren.ts`)
- Einfeldträger, Stützweite in Sparrenrichtung, Vollholz C16/C24/C30 oder GL24h, Nutzungsklasse 1 oder 2.
- Lasten: Eindeckung (kN/m² Dachfläche), Sparren-Eigengewicht, Schnee `s = μ1 · sk`, `sk` nach DIN EN 1991-1-3/NA
  (Zone 1, 1a, 2, 2a, 3, Geländehöhe). Schnee senkrecht zur Dachfläche: `s · cos²α`.
- Kombinationen: `1,35·G` (kmod 0,6) und `1,35·G + 1,5·S` (kmod 0,9 bis 1000 m, darüber 0,8); die ungünstigere zählt.
- Nachweise: Biegung (mit kh), Schub (kcr = 0,714), Durchbiegung `w_inst ≤ L/300`, `w_fin ≤ L/200` (kdef 0,6 / 0,8).
- Ampel: grün ≤ 80 %, gelb ≤ 100 %, rot darüber. Tabellen weisen nur grüne Spannweiten aus (Reserve).

## Bewusst nicht enthalten (steht sichtbar auf der Seite)
Wind, Schneeverwehungen/-säcke, Einzellasten (Dachdecker), Auflager, Verbindungsmittel, Mehrfeldträger, Brandschutz.
Das Ergebnis ist eine Vorbemessung und ersetzt keinen Standsicherheitsnachweis.

## SEO
Trailing Slash in allen internen Links, FAQ aus einer Quelle (sichtbar + FAQPage-Markup), Einträge in der Sitemap,
Verlinkung von Schneelast, Lattenrechner und Startseite, Tabellen als echtes HTML (aus derselben Funktion erzeugt).

## Qualität
Rechenkern mit Vitest getestet (Handrechnung, Monotonie, Plausibilität gegen Konkurrenztabellen).
