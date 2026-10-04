// Affiliate-Angebote für Ratgeber und PV-Rechner.
//
// Ein Partner ohne url wird nirgends angezeigt. Sobald das Awin-Programm
// freigegeben ist, genügt es, hier den Tracking-Link einzutragen. Es gibt
// bewusst keine Platzhalter-Links. Links müssen https sein und werden mit
// rel="sponsored nofollow" ausgegeben.
//
// Bei mehreren Partnern pro Angebot gewinnt der erste mit gültigem Link.

export interface Partner {
  name: string;
  url: string;
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
  toolchest: { name: 'Toolchest.de', url: 'https://www.awin1.com/cread.php?awinmid=117285&awinaffid=3113454&ued=https%3A%2F%2Fwww.toolchest.de%2F' },
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
