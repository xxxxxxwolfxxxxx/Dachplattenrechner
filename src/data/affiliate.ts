// Affiliate-Angebote für Ratgeber und PV-Rechner.
//
// Ein Partner ohne url wird nirgends angezeigt. Sobald das Awin-Programm
// freigegeben ist, genügt es, hier den Tracking-Link einzutragen. Es gibt
// bewusst keine Platzhalter-Links. Links müssen https sein und werden mit
// rel="sponsored nofollow" ausgegeben.
//
// Bei mehreren Partnern pro Angebot gewinnt der erste mit gültigem Link.

export interface Deeplink {
  /** Awin-Link bis vor dem Ziel, z. B. https://www.awin1.com/cread.php?awinmid=…&awinaffid=… */
  basis: string;
  /** Domain des Shops ohne abschließenden Slash */
  ziel: string;
}

export interface Partner {
  name: string;
  url: string;
  deeplink?: Deeplink;
}

export interface Angebot {
  partner: string[];
  text: string;
  button: string;
}

export interface Treffer {
  name: string;
  url: string;
  text: string;
  button: string;
}

export const PARTNER: Record<string, Partner> = {
  toolchest: {
    name: 'Toolchest.de',
    url: 'https://www.awin1.com/cread.php?awinmid=117285&awinaffid=3113454&ued=https%3A%2F%2Fwww.toolchest.de%2F',
    deeplink: {
      basis: 'https://www.awin1.com/cread.php?awinmid=117285&awinaffid=3113454',
      ziel: 'https://www.toolchest.de',
    },
  },
  werkzeugstore24: { name: 'Werkzeugstore24', url: '' },
  ankersolix: { name: 'Anker Solix', url: '' },
};

export const ANGEBOTE: Record<string, Angebot> = {
  werkzeug: {
    partner: ['toolchest', 'werkzeugstore24'],
    text: 'Das Werkzeug aus dieser Liste bekommst du im Fachhandel für Werkzeug. Preise und Verfügbarkeit unterscheiden sich je Shop.',
    button: 'Werkzeug im Shop ansehen',
  },
  pv: {
    partner: ['ankersolix'],
    text: 'Für dein Ergebnis aus dem PV-Rechner: Speicher und Balkonkraftwerk-Lösungen kannst du beim Hersteller vergleichen.',
    button: 'Speicherlösungen ansehen',
  },
};

/**
 * Liefert das anzeigbare Angebot oder null.
 * null heißt: nichts ausgeben (kein Angebot, kein Link oder kein https-Link).
 */
export function angebot(
  key: string,
  partner: Record<string, Partner> = PARTNER,
  angebote: Record<string, Angebot> = ANGEBOTE,
): Treffer | null {
  const a = angebote[key];
  if (!a) return null;
  for (const id of a.partner) {
    const p = partner[id];
    if (p && p.url.startsWith('https://')) {
      return { name: p.name, url: p.url, text: a.text, button: a.button };
    }
  }
  return null;
}

// --- Toolchest-Kategorien für die Werkzeuglisten im Ratgeber -----------------
//
// Pfade am 04.10.2026 auf toolchest.de geprüft (jeweils eine Kategorieseite).
// Bewusst nicht verlinkt: Absturzsicherung (keine passende Kategorie, und bei
// Sicherheitsthemen soll kein Ersatzprodukt nahegelegt werden), Akkuschrauber
// (die Kategorie führt am 04.10.2026 nur zwei 3,6-V-Schraubendreher und einen
// Schlagschrauber, zu wenig für das Verschrauben von Blechen) sowie Werkzeug,
// zu dem es nur einzelne Produktseiten gibt.

export interface Kategorie {
  muster: RegExp;
  pfad: string;
  label: string;
}

export const KATEGORIEN: Kategorie[] = [
  { muster: /ma(ß|ss)band|bandma(ß|ss)/i, pfad: 'Massbaender', label: 'Maßbänder' },
  { muster: /zollstock/i, pfad: 'Zollstoecke', label: 'Zollstöcke' },
  { muster: /wasserwaage/i, pfad: 'Wasserwaagen', label: 'Wasserwaagen' },
  { muster: /winkel(?!schleifer)/i, pfad: 'Winkel', label: 'Winkel' },
  { muster: /blechschere|knabber/i, pfad: 'Scheren', label: 'Scheren' },
  { muster: /cutter/i, pfad: 'Cuttermesser', label: 'Cuttermesser' },
  { muster: /schlagschnur/i, pfad: 'Schlagschnuere', label: 'Schlagschnüre' },
  { muster: /handschuh/i, pfad: 'Handschuhe', label: 'Handschuhe' },
  { muster: /helm/i, pfad: 'Schutzhelme', label: 'Schutzhelme' },
  { muster: /schutzbrille/i, pfad: 'Schutzbrillen', label: 'Schutzbrillen' },
  { muster: /geh(ö|oe)rschutz/i, pfad: 'Gehoerschutz', label: 'Gehörschutz' },
];

const MAX_KATEGORIEN = 3;

/** Passende Kategorien in der Reihenfolge der Liste, ohne Dopplungen, höchstens drei. */
export function kategorienFuerWerkzeug(werkzeug: string[]): Kategorie[] {
  const treffer: Kategorie[] = [];
  for (const eintrag of werkzeug) {
    const k = KATEGORIEN.find((kat) => kat.muster.test(eintrag));
    if (k && !treffer.includes(k)) treffer.push(k);
    if (treffer.length === MAX_KATEGORIEN) break;
  }
  return treffer;
}

/** Awin-Deeplink auf eine Kategorieseite des Partners oder null (kein Deeplink, kein https). */
export function kategorieLink(
  partnerId: string,
  pfad: string,
  partner: Record<string, Partner> = PARTNER,
): string | null {
  const d = partner[partnerId]?.deeplink;
  if (!d || !d.basis.startsWith('https://') || !d.ziel.startsWith('https://')) return null;
  return `${d.basis}&ued=${encodeURIComponent(`${d.ziel}/${pfad}`)}`;
}

export interface KategorieLink {
  label: string;
  url: string;
}

/** Kategorie-Links für eine Werkzeugliste. Leer, solange Toolchest keinen Link hat. */
export function werkzeugLinks(werkzeug: string[], partner: Record<string, Partner> = PARTNER): KategorieLink[] {
  if (!partner.toolchest?.url.startsWith('https://')) return [];
  return kategorienFuerWerkzeug(werkzeug).flatMap((k) => {
    const url = kategorieLink('toolchest', k.pfad, partner);
    return url ? [{ label: k.label, url }] : [];
  });
}
