// Datenaufbereitung für die statischen Seiten /schneelastzone/<ort>/ und /schneelastzone/landkreis/<kreis>/.
// Läuft nur beim Build (liest public/data); die Auswahl der Orte steht in MIN_PLZ_FUER_ORTSSEITE.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  gemeindeKartenTreffer,
  findeHoehe,
  windzone,
  istBerechenbar,
  type Datensatz,
  type HoehenDatensatz,
  type PlzDatensatz,
} from './schneelastzonen';
import { schneelastSk, dachSchneelast, schneeFormbeiwert, lastVergleich, type LastVergleich } from './sparren';

/**
 * Stufe 1: Ortsseiten nur für Gemeinden mit mindestens so vielen Postleitzahlen (≈ Städte und größere Orte).
 * Auf 1 setzen, um alle Gemeinden mit Schneelastzone aufzunehmen; die Adressen (Slugs) bleiben dabei stabil,
 * weil sie über alle Gemeinden vergeben werden.
 */
export const MIN_PLZ_FUER_ORTSSEITE = 2;
/** Landkreisseiten brauchen mindestens so viele Gemeinden, sonst wäre die Übersicht leer (kreisfreie Städte). */
export const MIN_GEMEINDEN_FUER_KREISSEITE = 2;
/** Slugs, die als Unterverzeichnis von /schneelastzone/ vergeben sind. */
const RESERVIERT = new Set(['landkreis']);

export interface Ort {
  slug: string;
  name: string;
  ags: string;
  land: string;
  kreis: string;
  kreisSlug: string;
  /** Name kommt mehrfach in Deutschland vor (Slug und Titel enthalten dann den Landkreis) */
  mehrdeutig: boolean;
  schnee: string | null;
  wind: string | null;
  hoehe: number | null;
  plz: string[];
  hinweise: string[];
  /** Eigene Seite vorhanden (Stufe 1) */
  hatSeite: boolean;
}

export interface Landkreis {
  slug: string;
  land: string;
  name: string;
  orte: Ort[];
  hatSeite: boolean;
}

export interface Ortsdaten {
  orte: Ort[];
  kreise: Landkreis[];
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/ä/g, 'ae')
    .replace(/ö/g, 'oe')
    .replace(/ü/g, 'ue')
    .replace(/ß/g, 'ss')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function zaehle(werte: string[]): Map<string, number> {
  const anzahl = new Map<string, number>();
  for (const w of werte) anzahl.set(w, (anzahl.get(w) ?? 0) + 1);
  return anzahl;
}

export function baueOrtsdaten(plz: PlzDatensatz, schnee: Datensatz, wind: Datensatz, hoehen: HoehenDatensatz): Ortsdaten {
  const plzJeGemeinde = new Map<string, string[]>();
  for (const [nummer, schluessel] of Object.entries(plz.plz).sort(([a], [b]) => a.localeCompare(b))) {
    for (const ags of schluessel) plzJeGemeinde.set(ags, [...(plzJeGemeinde.get(ags) ?? []), nummer]);
  }

  const eintraege = Object.entries(plz.gemeinden).map(([ags, [name, kreisIndex, schneeZone, windZone]]) => ({
    ags, name, kreisIndex, schneeZone, windZone,
    land: plz.kreise[kreisIndex][0],
    kreis: plz.kreise[kreisIndex][1],
  }));

  // Slugs über alle Gemeinden vergeben: Namen, die mehrfach vorkommen, erhalten den Landkreis, bleibt es doppelt, den Schlüssel
  const nameAnzahl = zaehle(eintraege.map((e) => slugify(e.name)));
  const kombiAnzahl = zaehle(eintraege.map((e) => `${slugify(e.name)}-${slugify(e.kreis)}`));
  const vergeben = (e: (typeof eintraege)[number]): { slug: string; mehrdeutig: boolean } => {
    const basis = slugify(e.name);
    if (nameAnzahl.get(basis) === 1 && !RESERVIERT.has(basis)) return { slug: basis, mehrdeutig: false };
    const mitKreis = `${basis}-${slugify(e.kreis)}`;
    return { slug: kombiAnzahl.get(mitKreis) === 1 ? mitKreis : `${mitKreis}-${e.ags}`, mehrdeutig: true };
  };

  const kreisBasis = zaehle(plz.kreise.map(([, k]) => slugify(k)));
  const kreisSlug = (land: string, kreis: string) => (kreisBasis.get(slugify(kreis)) === 1 ? slugify(kreis) : `${slugify(kreis)}-${land.toLowerCase()}`);

  const orte: Ort[] = eintraege.map((e) => {
    const { slug, mehrdeutig } = vergeben(e);
    const treffer = e.schneeZone ? gemeindeKartenTreffer(schnee, e.land, e.kreis, e.name, e.schneeZone) : null;
    const windHinweis = treffer ? windzone(wind, treffer)?.hinweis ?? null : null;
    const meine = plzJeGemeinde.get(e.ags) ?? [];
    return {
      slug, mehrdeutig, name: e.name, ags: e.ags, land: e.land, kreis: e.kreis,
      kreisSlug: kreisSlug(e.land, e.kreis),
      schnee: e.schneeZone, wind: e.windZone,
      hoehe: findeHoehe(hoehen, e.land, e.kreis, e.name),
      plz: meine,
      hinweise: [...new Set([...(treffer?.hinweise ?? []), ...(windHinweis ? [windHinweis] : [])])],
      hatSeite: e.schneeZone !== null && meine.length >= MIN_PLZ_FUER_ORTSSEITE,
    };
  });

  const kreise: Landkreis[] = plz.kreise.map(([land, name]) => {
    const meine = orte.filter((o) => o.land === land && o.kreis === name).sort((a, b) => a.name.localeCompare(b.name, 'de'));
    return { slug: kreisSlug(land, name), land, name, orte: meine, hatSeite: meine.length >= MIN_GEMEINDEN_FUER_KREISSEITE };
  });
  return { orte, kreise };
}

/** Liest die Datendateien aus public/data (nur zur Build-Zeit; Astro und Vitest laufen im Projektordner). */
export function ladeOrtsdaten(): Ortsdaten {
  const lies = <T>(datei: string): T => JSON.parse(readFileSync(join(process.cwd(), 'public/data', datei), 'utf-8')) as T;
  return baueOrtsdaten(lies<PlzDatensatz>('plz.json'), lies<Datensatz>('schneelastzonen.json'), lies<Datensatz>('windzonen.json'), lies<HoehenDatensatz>('hoehen.json'));
}

export interface LastZeile {
  neigung: string;
  formbeiwert: number;
  /** kN/m² Grundfläche */
  kn: number;
  kg: number;
}

/** Dachschneelast des Ortes für typische Neigungen; leer bei Sonderzonen ohne berechenbaren Wert. */
export function lastTabelle(zone: string | null, hoehe: number | null): { sk: number; mindest: number; zeilen: LastZeile[]; vergleich: LastVergleich } | null {
  if (!zone || !istBerechenbar(zone)) return null;
  const sk = schneelastSk(zone, hoehe ?? 0);
  const neigungen: [string, number][] = [['bis 30°', 30], ['35°', 35], ['40°', 40], ['45°', 45], ['50°', 50], ['55°', 55], ['ab 60°', 60]];
  const zeilen = neigungen.map(([neigung, grad]) => {
    const kn = dachSchneelast(sk, grad);
    return { neigung, formbeiwert: schneeFormbeiwert(grad), kn, kg: Math.round(kn * 100) };
  });
  return { sk, mindest: schneelastSk(zone, 0), zeilen, vergleich: lastVergleich(dachSchneelast(sk, 30)) };
}
