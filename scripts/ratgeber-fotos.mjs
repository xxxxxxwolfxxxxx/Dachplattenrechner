// Verkleinert ausgewählte Baustellenfotos für das Ratgeber-Wiki: node scripts/ratgeber-fotos.mjs
//
// Sichtung (Step 1): Fotos aus public/images als ERKLÄRBILD für einen Wiki-Schritt (/ratgeber/blechdach/<slug>) beurteilt.
// Übernommen nur: Motiv klar erkennbar, scharf, kein erkennbares Gesicht, keine Stimmungsbilder.
//
// ÜBERNOMMEN (Quelle -> Ziel in public/ratgeber/fotos -> Schritt-Slug -> Alt-Text-Vorschlag)
//  blech-1.jpg -> dachrinne-schneefang-zinkdach.webp -> dachrinne-schneefang
//      "Graues Stehfalzdach mit Schneefangrohr über der Traufe, Dachrinne und Fallrohr"
//  winkel-1.jpg -> durchdringungen-schornstein.webp -> durchdringungen
//      "Gemauerter Schornstein am First eines roten Wellblechdachs"
//
// VERWORFEN (Datei -> Grund)
//  plan-1.jpg      Stockfoto Modellhaus mit Zollstock/Zange/Plan, Stimmungsbild, kein Schritt-Motiv
//  plan-2.jpg      KI-Bild mit Schildern Schneelast/Windlast und zwei Personen mit Gesicht
//  plan-3.jpg      Holzmaserung, kein Schritt-Motiv
//  Plan-4.png      KI-Bild Gartenfest mit Grill, Hund, Katze und Personen (Stimmung/Humor)
//  messen-1.jpg    verknäuseltes Maßband, Stimmungsbild
//  messen-2.jpg    Gewitter mit Blitzen, Stimmungsbild; Wetterschritt braucht eine Checkliste statt Foto
//  messen-3.png    KI-Bild Mann mit Messschieber vor Haus, Gesicht im Profil erkennbar
//  messen-4.jpg    Maßband vor Schwarz, Stimmungsbild (zeigt kein Aufmaß am Dach)
//  uk-1.jpg        Holzbalken-Köpfe vor blauem Himmel, Kunstmotiv, keine erkennbare Unterkonstruktion
//  uk-2.png        KI-Bild Stahlhalle mit Kiste "Fragile", Alufolie und Dosen, unpassend
//  uk-3.png        KI-Bild asiatisches Tempeldach bei Sonnenuntergang, Stimmungsbild
//  uk-4.jpg        Architektur Holzkapelle, kein Schritt-Motiv
//  blech-2.png     KI-Bild Mann liegt im Gras, Schraube mit Schnur (Humor), Gesicht sichtbar
//  blech-4.png     Schrauben als Smiley auf Trapezblech (Humor)
//  winkel-2.jpg    Karibisches Haus mit Wellplatten, niedrige Auflösung, kein klares Schritt-Motiv
//  winkel-3.jpg    Möwe auf rotem Stehfalzdach mit Giebel, Tier ist Hauptmotiv (Stimmung)
//  winkel-4.jpg    Eckansicht Ziegelprofil-Dach vor Wolken, kein Schritt-Motiv (kein Winkelmessen)
//  blech-3.JPG     zeigt Arbeit am Dachrand ohne sichtbare Absturzsicherung (Sandalen), als Laien-Erklärbild nicht vertretbar
//  messen-2.mp4    Video, nicht konvertiert
//
// Hinweis: Für aufmass, winkel-messen, sicherheit-absturzsicherung, traufe-traufblech, first, ortgang u. a. gibt es
// keine passenden Fotos. Dort stattdessen die SVG-Grafiken unter public/ratgeber/svg verwenden.
import sharp from 'sharp';
import { mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const WURZEL = fileURLToPath(new URL('..', import.meta.url));

// Quelle (public/images) → Zielname in public/ratgeber/fotos (ohne Endung).
const AUSWAHL = {
  'blech-1.jpg': 'dachrinne-schneefang-zinkdach',
  'winkel-1.jpg': 'durchdringungen-schornstein',
};

if (Object.keys(AUSWAHL).length === 0) {
  console.log('Keine Fotos ausgewählt');
  process.exit(0);
}

const ZIEL = `${WURZEL}public/ratgeber/fotos`;
await mkdir(ZIEL, { recursive: true });

for (const [quelle, name] of Object.entries(AUSWAHL)) {
  try {
    const info = await sharp(`${WURZEL}public/images/${quelle}`)
      .rotate()
      .resize({ width: 1600, withoutEnlargement: true })
      .webp({ quality: 78 })
      .toFile(`${ZIEL}/${name}.webp`);
    console.log(`${name}.webp  ${info.width}x${info.height}  ${(info.size / 1024).toFixed(0)} KB`);
  } catch (fehler) {
    console.error(`Quelle fehlt oder nicht lesbar: ${quelle} (${fehler.message})`);
    process.exitCode = 1;
  }
}
