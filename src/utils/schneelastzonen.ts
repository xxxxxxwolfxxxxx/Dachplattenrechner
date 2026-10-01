// Suche in der DIBt-Zuordnung "Schneelastzonen nach Verwaltungsgrenzen" (public/data/schneelastzonen.json).
// Reine Funktionen; die Daten werden vom Aufrufer geladen und übergeben.

/** [Bundesland, Landkreis, Gemeinde (null = Standard des Landkreises), Zone, Hinweis] */
export type Zeile = [land: string, kreis: string, gemeinde: string | null, zone: string, hinweis: string | null];

export interface Datensatz {
  stand: string;
  quelle: string;
  zeilen: Zeile[];
}

export const BUNDESLAENDER: Record<string, string> = {
  SH: 'Schleswig-Holstein', HH: 'Hamburg', NI: 'Niedersachsen', HB: 'Bremen',
  NW: 'Nordrhein-Westfalen', HE: 'Hessen', RP: 'Rheinland-Pfalz', BW: 'Baden-Württemberg',
  BY: 'Bayern', SL: 'Saarland', BE: 'Berlin', BB: 'Brandenburg',
  MV: 'Mecklenburg-Vorpommern', SN: 'Sachsen', ST: 'Sachsen-Anhalt', TH: 'Thüringen',
};

const MAX_TREFFER = 20;

export interface Treffer {
  art: 'gemeinde' | 'kreis';
  land: string;
  kreis: string;
  /** Anzeigename: Gemeinde bzw. Landkreis */
  name: string;
  /** Zone der Gemeinde; beim Landkreis die Standardzone oder null */
  zone: string | null;
  /** Alle im Landkreis vorkommenden Zonen, aufsteigend */
  zonen: string[];
  hinweise: string[];
  /** Gemeinden des Landkreises mit ihrer Zone (nur bei art = 'kreis') */
  gemeinden: { name: string; zone: string }[];
}

/** Kleinschreibung, Umlaute als ae/oe/ue/ss, Satzzeichen als Leerzeichen. */
export function normalisiere(text: string): string {
  return text
    .toLowerCase()
    .replace(/ä/g, 'ae')
    .replace(/ö/g, 'oe')
    .replace(/ü/g, 'ue')
    .replace(/ß/g, 'ss')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

const ZONEN_REIHENFOLGE = ['1', '1a', '2', '2a', '3', '3a', '>3', '>3a'];

function sortiereZonen(zonen: Iterable<string>): string[] {
  return [...new Set(zonen)].sort((a, b) => ZONEN_REIHENFOLGE.indexOf(a) - ZONEN_REIHENFOLGE.indexOf(b));
}

/** 0 = exakt, 1 = Anfang, 2 = Wortanfang, 3 = enthalten, -1 = kein Treffer */
function rang(name: string, suche: string): number {
  if (name === suche) return 0;
  if (name.startsWith(suche)) return 1;
  if (name.includes(` ${suche}`)) return 2;
  return name.includes(suche) ? 3 : -1;
}

function kreisHinweis(zeilen: Zeile[], land: string, kreis: string): string | null {
  return zeilen.find((z) => z[0] === land && z[1] === kreis && z[2] === null)?.[4] ?? null;
}

function eindeutig(werte: (string | null)[]): string[] {
  return [...new Set(werte.filter((w): w is string => !!w))];
}

/** Landkreis-Treffer aus allen Zeilen eines Landkreises; null bei kreisfreien Städten ohne Besonderheiten. */
function baueKreisTreffer(zeilen: Zeile[], land: string, kreis: string): Treffer | null {
  const standard = zeilen.find((z) => z[2] === null);
  // Kreisfreie Stadt: Kreis und Gemeinde sind identisch, der Gemeinde-Treffer reicht.
  if (!standard && zeilen.length === 1 && zeilen[0][2] === kreis) return null;
  const gemeinden = zeilen.filter((z) => z[2] !== null && z[2] !== kreis).map((z) => ({ name: z[2] as string, zone: z[3] }));
  if (!standard && gemeinden.length === 0) return null;
  return {
    art: 'kreis', land, kreis, name: kreis, zone: standard?.[3] ?? null,
    zonen: sortiereZonen(zeilen.map((z) => z[3])),
    hinweise: eindeutig([standard?.[4] ?? null]),
    gemeinden: gemeinden.sort((a, b) => a.name.localeCompare(b.name, 'de')),
  };
}

/** Treffer für einen Klick auf die Karte: Landkreis oder kreisfreie Stadt. */
export function kartenTreffer(daten: Datensatz, land: string, kreis: string, stadt: boolean): Treffer | null {
  const zeilen = daten.zeilen.filter((z) => z[0] === land && z[1] === kreis);
  if (stadt) {
    const eigene = zeilen.find((z) => z[2] === kreis);
    if (eigene) {
      return {
        art: 'gemeinde', land, kreis, name: kreis, zone: eigene[3], zonen: [eigene[3]],
        hinweise: eindeutig([eigene[4]]), gemeinden: [],
      };
    }
  }
  return baueKreisTreffer(stadt ? zeilen : zeilen.filter((z) => z[2] !== kreis), land, kreis);
}

export interface KartenZone {
  /** Zone, nach der die Fläche eingefärbt wird (Standardzone bzw. häufigste Gemeindezone); null ohne Daten */
  haupt: string | null;
  alle: string[];
  /** true, wenn im Landkreis mehrere Zonen vorkommen */
  gemischt: boolean;
}

/**
 * Zone eines Landkreises bzw. einer kreisfreien Stadt für die Kartenfärbung. Gilt für Schnee- und Windzonen;
 * ohne eigene Zeilen greift der Standard des Bundeslandes (Landkreis = null, nur Windzonen).
 */
export function kartenZone(daten: Datensatz, land: string, kreis: string | null, stadt: boolean): KartenZone {
  const alleZeilen = daten.zeilen.filter((z) => z[0] === land && z[1] === kreis);
  const zeilen = stadt ? alleZeilen : alleZeilen.filter((z) => z[2] !== kreis);
  const eigene = stadt ? alleZeilen.find((z) => z[2] === kreis) : undefined;
  if (eigene) return { haupt: eigene[3], alle: [eigene[3]], gemischt: false };
  if (zeilen.length === 0) {
    const landStandard = daten.zeilen.find((z) => z[0] === land && z[1] === null);
    return landStandard
      ? { haupt: landStandard[3], alle: [landStandard[3]], gemischt: false }
      : { haupt: null, alle: [], gemischt: false };
  }
  const standard = zeilen.find((z) => z[2] === null);
  const alle = sortiereZonen(zeilen.map((z) => z[3]));
  let haupt = standard?.[3] ?? null;
  if (haupt === null) {
    const anzahl = new Map<string, number>();
    for (const z of zeilen) anzahl.set(z[3], (anzahl.get(z[3]) ?? 0) + 1);
    haupt = [...anzahl.entries()].sort((a, b) => b[1] - a[1])[0][0];
  }
  return { haupt, alle, gemischt: alle.length > 1 };
}

export function sucheOrt(daten: Datensatz, eingabe: string): Treffer[] {
  const suche = normalisiere(eingabe);
  if (suche.length < 2) return [];

  const gefunden: { rang: number; treffer: Treffer }[] = [];
  const kreise = new Map<string, Zeile[]>();
  for (const zeile of daten.zeilen) {
    const schluessel = `${zeile[0]}|${zeile[1]}`;
    const liste = kreise.get(schluessel);
    if (liste) liste.push(zeile);
    else kreise.set(schluessel, [zeile]);
  }

  for (const zeile of daten.zeilen) {
    const [land, kreis, gemeinde, zone, hinweis] = zeile;
    if (gemeinde === null) continue;
    const r = rang(normalisiere(gemeinde), suche);
    if (r < 0) continue;
    const tiefland = kreisHinweis(daten.zeilen, land, kreis);
    gefunden.push({
      rang: r,
      treffer: {
        art: 'gemeinde', land, kreis, name: gemeinde, zone, zonen: [zone],
        hinweise: eindeutig([hinweis, tiefland?.startsWith('Norddeutsches Tiefland') ? tiefland.split('. ')[0] + '.' : null]),
        gemeinden: [],
      },
    });
  }

  for (const [schluessel, zeilen] of kreise) {
    const [land, kreis] = schluessel.split('|');
    const r = rang(normalisiere(kreis), suche);
    if (r < 0) continue;
    const treffer = baueKreisTreffer(zeilen, land, kreis);
    if (treffer) gefunden.push({ rang: r + 0.5, treffer });
  }

  return gefunden
    .sort((a, b) => a.rang - b.rang || a.treffer.name.localeCompare(b.treffer.name, 'de'))
    .slice(0, MAX_TREFFER)
    .map((g) => g.treffer);
}

/** Gemeinden eines Treffers nach Zone gruppiert (aufsteigend). */
export function gruppiereNachZone(gemeinden: { name: string; zone: string }[]): { zone: string; namen: string[] }[] {
  return sortiereZonen(gemeinden.map((g) => g.zone)).map((zone) => ({
    zone,
    namen: gemeinden.filter((g) => g.zone === zone).map((g) => g.name),
  }));
}

/** Zonen, für die s_k aus Zone und Höhe berechenbar ist (DIN EN 1991-1-3/NA). */
export function istBerechenbar(zone: string): zone is '1' | '1a' | '2' | '2a' | '3' {
  return ['1', '1a', '2', '2a', '3'].includes(zone);
}

/** Basisgeschwindigkeit v_b,0 in m/s und Basisgeschwindigkeitsdruck q_b,0 in kN/m² je Windzone (DIN EN 1991-1-4/NA). */
export const WINDWERTE: Record<string, { v: number; q: number }> = {
  '1': { v: 22.5, q: 0.32 },
  '2': { v: 25, q: 0.39 },
  '3': { v: 27.5, q: 0.47 },
  '4': { v: 30, q: 0.56 },
};

export interface WindErgebnis {
  /** Windzone des Ortes bzw. Standardzone des Landkreises; null, wenn sie je nach Gemeinde wechselt */
  zone: string | null;
  zonen: string[];
  hinweis: string | null;
}

/**
 * Windzone zu einem Suchtreffer: Gemeinde-Eintrag, sonst Standardzone des Landkreises,
 * sonst Standardzone des Bundeslandes (Landkreis = null in den Daten).
 */
export function windzone(wind: Datensatz, treffer: Treffer): WindErgebnis | null {
  const { land, kreis } = treffer;
  const kreisZeilen = wind.zeilen.filter((z) => z[0] === land && z[1] === kreis);
  const standard = kreisZeilen.find((z) => z[2] === null);
  if (treffer.art === 'gemeinde') {
    const name = normalisiere(treffer.name);
    const eigene = kreisZeilen.find((z) => z[2] !== null && normalisiere(z[2]) === name);
    const zeile = eigene ?? standard;
    if (zeile) return { zone: zeile[3], zonen: [zeile[3]], hinweis: standard?.[4] ?? zeile[4] };
  } else if (standard || kreisZeilen.length > 0) {
    const zonen = sortiereZonen(kreisZeilen.map((z) => z[3]));
    return { zone: standard?.[3] ?? null, zonen, hinweis: standard?.[4] ?? null };
  }
  const land_ = wind.zeilen.find((z) => z[0] === land && z[1] === null);
  return land_ ? { zone: land_[3], zonen: [land_[3]], hinweis: land_[4] } : null;
}
