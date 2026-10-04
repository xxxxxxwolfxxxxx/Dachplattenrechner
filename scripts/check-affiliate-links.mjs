// Prüft, ob die Toolchest-Seiten, auf die die Affiliate-Boxen verlinken, noch
// existieren: jede Kategorie und jedes Hauptprodukt aus src/data/affiliate.ts.
//
// Aufruf: npm run check:links
// Ausstieg 1, wenn mindestens eine Seite auffällt. Der Awin-Link wird nie
// aufgerufen (das würde Klicks zählen), nur die Shop-Seiten dahinter.

import { zielSeiten, pruefeSeite } from '../src/utils/affiliate-check.ts';

const PAUSE_MS = 400;
const TIMEOUT_MS = 15000;
const UA = 'dachplattenrechner-linkcheck (+https://dachplattenrechner.de)';

const warte = (ms) => new Promise((r) => setTimeout(r, ms));

async function hole(url) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, { headers: { 'User-Agent': UA }, signal: ctrl.signal });
    return { status: res.status, html: await res.text() };
  } catch (e) {
    return { status: 0, html: '', fehler: e.name === 'AbortError' ? 'Zeitüberschreitung' : e.message };
  } finally {
    clearTimeout(timer);
  }
}

const seiten = zielSeiten();
if (seiten.length === 0) {
  console.error('Keine Zielseiten gefunden. Ist bei PARTNER.toolchest ein deeplink eingetragen?');
  process.exit(1);
}

let probleme = 0;
for (const seite of seiten) {
  const { status, html, fehler } = await hole(seite.url);
  const befund = fehler ?? pruefeSeite(seite, status, html);
  if (befund) probleme += 1;
  console.log(`${befund ? 'FEHLER' : 'ok    '} ${seite.art.padEnd(9)} ${seite.name.padEnd(34)} ${befund ?? ''}`);
  await warte(PAUSE_MS);
}

console.log(`\n${seiten.length} Seiten geprüft, ${probleme} auffällig.`);
process.exit(probleme > 0 ? 1 : 0);
