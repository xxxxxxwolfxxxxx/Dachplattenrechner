---
titel: "Dachfläche und Materialbedarf berechnen"
gewerk: blechdach
phase: planung
reihenfolge: 40
beschreibung: "Aus dem Aufmaß wird die Bestellliste: Dachfläche per Rechner bestimmen, Verschnitt optimieren, Anrissplan erstellen und Baubreite von Tafelbreite trennen."
dauer: "ca. 1 bis 2 Stunden"
schwierigkeit: 2
personen: 1
wetter: "egal, Büroarbeit"
werkzeug:
  - Aufmaß-Skizze mit allen Maßen
  - Taschenrechner oder die Rechner auf dieser Seite
material:
  - { name: "Aufmaß aller Dachflächen" }
  - { name: "Datenblatt des gewählten Blechprofils", menge: "Tafelbreite und Baubreite ablesen" }
sicherheit: "Diese Planung geschieht am Schreibtisch. Prüfe vor der Bestellung, dass die Maße stimmen, denn Fehlmaße führen später zu Nacharbeit auf dem Dach."
schritte:
  - titel: "Teilflächen berechnen"
    text: "Rechne jede Teilfläche aus deinem Aufmaß. Nutze für Rechtecke, Trapeze und Dreiecke die verlinkten Rechner und trage das Ergebnis je Fläche in deine Liste ein."
    bild: "/ratgeber/svg/dachflaeche-formel.svg"
    alt: "Schnitt durch ein Satteldach mit halber Gebäudebreite, Sparrenlänge und Neigungswinkel sowie den Formeln für Sparrenlänge und Dachfläche"
  - titel: "Flächen addieren und Zuschlag prüfen"
    text: "Addiere alle Teilflächen zur Gesamtdachfläche. Frage deinen Händler, wie er Verschnitt und Zuschlag berechnet, denn das ist je nach Profil unterschiedlich."
  - titel: "Baubreite statt Tafelbreite verwenden"
    text: "Die Tafelbreite ist das Rohmaß der Tafel, die Baubreite ist die Breite, die nach der Überlappung tatsächlich Dach deckt. Beim Beispiel MAAS TP 22-214 beträgt die Tafelbreite 1140 mm und die Baubreite 1070 mm.\n\nFür die Anzahl der Tafeln teilst du die Dachbreite durch die Baubreite, nicht durch die Tafelbreite."
  - titel: "Verschnitt optimieren"
    text: "Nutze den Verschnitt-Optimierer, um Tafellängen so zu wählen, dass möglichst wenig Abfall entsteht. Das spart Geld und Schnittarbeit."
  - titel: "Anrissplan erstellen"
    text: "Erstelle mit dem Anrissplan den Schnittplan für jede Tafel. Du bestellst danach exakt die Längen, die du brauchst, und weißt auf dem Dach, welche Tafel wohin gehört."
typischeFehler:
  - "Tafelbreite statt Baubreite benutzt, am Ende fehlt eine Tafel"
  - "Verschnitt nicht eingeplant, das Material reicht knapp nicht"
  - "Gesamtfläche bestellt statt Tafeln in passenden Längen"
  - "Maße vom Grundriss genommen statt die geneigte Dachfläche gerechnet"
rechner:
  - { titel: "Dachfläche berechnen", href: "/tools/dachflaeche-berechnen/" }
  - { titel: "Rechteck", href: "/tools/rechteck/" }
  - { titel: "Trapez", href: "/tools/trapez/" }
  - { titel: "Dreieck auf Rechteck", href: "/tools/dreieckaufrechteck/" }
  - { titel: "Verschnitt-Optimierung", href: "/tools/verschnitt-optimierung/" }
  - { titel: "Anrissplan", href: "/tools/anrissplan.html" }
verwandt:
  - aufmass
  - statik-grundlagen
quellen:
  - { titel: "MAAS Montageanleitung Trapez- und Wellprofile", href: "https://www.maasprofile.de/DATA/Montageanleitungen/Montageanleitungen_Trapez-_und_Wellblech.pdf" }
---

Jetzt wird aus Zahlen eine Bestellung. Dabei gibt es zwei Dinge, die am häufigsten schiefgehen: die Fläche und die Breite.

Die Fläche ist die geneigte Dachfläche, nicht der Grundriss. Hast du dein Aufmaß sauber gemacht, rechnet der Dachflächenrechner das für dich. Die Formel dahinter ist Dachfläche = Länge × Sparrenlänge, wobei die Sparrenlänge beim Satteldach aus der halben Gebäudebreite geteilt durch cos(α) folgt. Den Dachüberstand an Traufe (und ggf. Ortgang) addierst du zur jeweiligen Maßlänge, bevor du durch cos(α) teilst.

Die Breite betrifft die Tafeln. Weil sich benachbarte Tafeln überlappen, deckt eine Tafel weniger, als sie breit ist. Rechne deshalb immer mit der Baubreite des Profils. Die Werte stehen im Datenblatt deines Herstellers.

Wer Tafeln nach Anrissplan bestellt, bekommt ein Dach, das beim ersten Mal passt. Wer „Pi mal Daumen" bestellt, hat in der Garage bald sehr viele Bleche, von denen kein einziges passt.
