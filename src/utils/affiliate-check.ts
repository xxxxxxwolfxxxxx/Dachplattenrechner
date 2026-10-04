// Link-Check für die Toolchest-Seiten, auf die die Affiliate-Boxen verlinken.
//
// Geprüft werden ausschließlich Seiten des Shops, nie der Awin-Link selbst:
// Jeder Aufruf von awin1.com würde als Klick gezählt.
//
// Die Logik ist rein (Status und HTML rein, Befund raus), damit sie ohne
// Netzwerk getestet werden kann. Das Skript scripts/check-affiliate-links.mjs
// holt die Seiten.

import { KATEGORIEN, PARTNER } from '../data/affiliate.ts';

export type Art = 'kategorie' | 'produkt';

export interface Zielseite {
  art: Art;
  /** Anzeigename aus dem Mapping, bei Produkten Quelle für die Markenprüfung */
  name: string;
  url: string;
}

/** Alle Shop-Seiten, die das Mapping verlinkt: jede Kategorie und jedes Hauptprodukt. */
export function zielSeiten(): Zielseite[] {
  const ziel = PARTNER.toolchest?.deeplink?.ziel;
  if (!ziel) return [];
  const seiten: Zielseite[] = [];
  for (const k of KATEGORIEN) {
    seiten.push({ art: 'kategorie', name: k.label, url: `${ziel}/${k.pfad}` });
    if (k.produkt) seiten.push({ art: 'produkt', name: k.produkt.name, url: `${ziel}/${k.produkt.pfad}` });
  }
  return seiten;
}

const text = (s: string) => s.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
const ueberschrift = (html: string) => text(html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)?.[1] ?? '');

/**
 * Befund für eine geholte Seite. null heißt: in Ordnung.
 * Kategorie: erreichbar und mindestens eine Produktkachel.
 * Produkt: erreichbar, Überschrift nennt die Marke, Preis vorhanden, laut Shop verfügbar.
 */
export function pruefeSeite(seite: Pick<Zielseite, 'art' | 'name'>, status: number, html: string): string | null {
  if (status !== 200) return `HTTP ${status}`;

  if (seite.art === 'kategorie') {
    return /class="product-box/.test(html) ? null : 'Kategorie enthält keine Produkte';
  }

  const marke = seite.name.split(' ')[0].toLowerCase();
  if (!ueberschrift(html).toLowerCase().includes(marke)) {
    return `Überschrift nennt "${marke}" nicht (jetzt: "${ueberschrift(html).slice(0, 50)}")`;
  }
  if (!/itemprop="price" content="[\d.]+"/.test(html)) return 'Preis fehlt';
  // Maßgeblich ist die maschinenlesbare Verfügbarkeit dieses Produkts. Das Wort
  // "Ausverkauft" im Seitentext gehört meist zu anderen Produkten im Karussell.
  const verfuegbarkeit = html.match(/itemprop="availability"[^>]*href="https?:\/\/schema\.org\/(\w+)"/)?.[1];
  if (verfuegbarkeit && verfuegbarkeit !== 'InStock') return `Produkt nicht lieferbar (${verfuegbarkeit})`;
  return null;
}
