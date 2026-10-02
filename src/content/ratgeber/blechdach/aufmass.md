---
titel: "Dach aufmessen: Dachformen und Messpunkte"
gewerk: blechdach
phase: planung
reihenfolge: 30
beschreibung: "Dach richtig aufmessen: Pult-, Sattel- und Walmdach in Teilflächen zerlegen, Messpunkte festlegen, Diagonalen prüfen und die Dachfläche korrekt berechnen."
dauer: "ca. 2 bis 4 Stunden je nach Dachform"
schwierigkeit: 2
personen: 2
wetter: "trocken, windstill"
werkzeug:
  - Maßband
  - Digitaler Winkelmesser
  - Notizblock oder Skizze zum Ausdrucken
  - Teleskopmessstab für die Höhe
  - Schnur und Marker
material:
  - { name: "Skizze der Dachform", menge: "ausgedruckt, pro Dachfläche eine" }
sicherheit: "Zum Messen auf das Dach nur mit Dachfanggerüst oder anderer Absturzsicherung und nie allein. Auf nassen oder bemoosten Flächen nicht messen."
schritte:
  - titel: "Dachform erkennen und in Teilflächen zerlegen"
    text: "Zerlege jede Dachform in Rechtecke, Trapeze und Dreiecke. Ein Pultdach ist ein Rechteck, ein Satteldach besteht aus zwei Rechtecken, ein Walmdach aus zwei Trapezen und zwei Dreiecken."
    bild: "/ratgeber/svg/dachformen-aufmass.svg"
    alt: "Draufsicht auf Pultdach, Satteldach und Walmdach mit eingezeichneten Messpunkten an Traufe, First, Seitenkanten und den beiden Diagonalen"
  - titel: "Messpunkte festlegen"
    text: "Markiere Traufe, First und Seitenkanten jeder Teilfläche. Beim Walmdach kommen die Gratlinien und Eckpunkte der Schrägen dazu. Eine Skizze pro Fläche hilft, nichts zu vergessen."
  - titel: "Kantenlängen messen"
    text: "Miss Traufe, First und beide Seitenkanten mit dem Maßband. Zu zweit geht es schneller und genauer: einer hält am Fixpunkt, der andere liest ab und notiert."
  - titel: "Beide Diagonalen messen"
    text: "Miss bei jeder Rechteckfläche beide Diagonalen. Sind sie gleich lang, ist die Fläche rechtwinklig. Weichen sie ab, ist das Dach schief oder du hast dich verlesen, dann miss nach."
  - titel: "Neigung bestimmen"
    text: "Lege den digitalen Winkelmesser auf einen Sparren oder eine Latte und notiere den Winkel in Grad. Miss an mehreren Stellen, denn die Neigung braucht jede Fläche einzeln."
  - titel: "Dachfläche berechnen"
    text: "Dachfläche = Grundfläche ÷ cos(α), oder Länge mal Sparrenlänge. Beim Satteldach gilt: Sparrenlänge = halbe Gebäudebreite ÷ cos(α); den Dachüberstand an Traufe (und ggf. Ortgang) addierst du zur jeweiligen Maßlänge, bevor du durch cos(α) teilst. Für jede Dachhälfte rechnest du Länge mal Sparrenlänge.\n\nDen Rechner findest du unten verlinkt, er nimmt dir die Rechenarbeit ab."
typischeFehler:
  - "Nur die Grundfläche gemessen und die Neigung vergessen, das Dach ist größer als der Grundriss"
  - "Diagonalen nicht gemessen, schiefe Flächen bleiben unentdeckt"
  - "Winkel und Fläche addiert statt die Fläche durch cos(α) zu teilen"
  - "Walmdach nicht in Trapeze und Dreiecke zerlegt, sondern als ein Rechteck geschätzt"
  - "Maße nicht notiert und später aus dem Gedächtnis rekonstruiert"
rechner:
  - { titel: "Dachfläche berechnen", href: "/tools/dachflaeche-berechnen/" }
  - { titel: "Rechteck", href: "/tools/rechteck/" }
  - { titel: "Trapez", href: "/tools/trapez/" }
  - { titel: "Dreieck auf Rechteck", href: "/tools/dreieckaufrechteck/" }
  - { titel: "Skizze Pultdach (Download)", href: "/skizzen/pultdach.html" }
  - { titel: "Skizze Satteldach (Download)", href: "/skizzen/Satteldach.html" }
  - { titel: "Skizze Walmdach (Download)", href: "/skizzen/walmdach.html" }
  - { titel: "Skizze Pyramidendach (Download)", href: "/skizzen/pyramidendach.html" }
verwandt:
  - sicherheit-absturzsicherung
  - dachflaeche-material-berechnen
quellen: []
---

Wer sein Dach verkehrt misst, deckt hinterher ein Dach, das aussieht wie ein Origami-Unfall. Ein gutes Aufmaß ist deshalb die Grundlage für Materialmenge, Zuschnitt und Kosten.

Der häufigste Denkfehler ist die Grundfläche. Die Fläche des Gebäudes von oben ist kleiner als die Dachfläche, denn die Dachfläche ist geneigt. Je steiler, desto größer fällt der Unterschied aus. Deshalb dividierst du die Grundfläche durch cos(α), den Kosinus des Neigungswinkels.

Beim Satteldach ist es anschaulich: Jede Hälfte ist ein Rechteck mit der Länge des Gebäudes und der Sparrenlänge als zweite Seite. Die Sparrenlänge ist die Strecke von der Traufe zum First entlang der Dachfläche. Sie ergibt sich aus der halben Gebäudebreite geteilt durch cos(α); den Dachüberstand an Traufe (und ggf. Ortgang) addierst du zur jeweiligen Maßlänge, bevor du durch cos(α) teilst.

Beim Walmdach zerlegst du das Dach in zwei Trapeze und zwei Dreiecke und addierst die Teilflächen. Fertige Skizzen unten helfen dir, nichts auszulassen. Die Hinweise beruhen auf Praxis und gängiger Geometrie.
