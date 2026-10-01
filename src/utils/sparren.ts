// Vorbemessung von Dachsparren (Einfeldträger) nach DIN EN 1995-1-1 / DIN EN 1991-1-3.
// Reine Funktionen ohne Seiteneffekte – nur für die Vorbemessung, ersetzt keinen Standsicherheitsnachweis.
// Nicht berücksichtigt: Wind, Schneeverwehungen/-säcke, Einzellasten, Auflager- und Verbindungsmittelnachweise.

export type SchneelastZone = '1' | '1a' | '2' | '2a' | '3';
export type Festigkeitsklasse = 'C16' | 'C24' | 'C30' | 'GL24h';
export type Nutzungsklasse = 1 | 2;
export type Ampel = 'gruen' | 'gelb' | 'rot';

export interface SparrenEingabe {
  /** Stützweite entlang des Sparrens in m */
  stuetzweite: number;
  /** Sparrenabstand (Achsmaß) in m */
  abstand: number;
  /** Dachneigung in Grad */
  neigung: number;
  /** Querschnitt in mm */
  breite: number;
  hoehe: number;
  /** Eigengewicht der Eindeckung inkl. Lattung in kN/m² Dachfläche */
  eindeckung: number;
  /** Charakteristische Schneelast am Boden in kN/m² */
  sk: number;
  festigkeitsklasse: Festigkeitsklasse;
  nutzungsklasse: Nutzungsklasse;
  /** Geländehöhe über NN in m (bestimmt k_mod der Schneelast) */
  hoeheNN: number;
}

export interface SparrenErgebnis {
  /** Bemessungsmoment in kNm (maßgebende Kombination) */
  bemessungsmoment: number;
  /** Bemessungsquerkraft in kN */
  bemessungsquerkraft: number;
  /** Schneelast senkrecht zur Dachfläche in kN/m² */
  schneelastDach: number;
  /** Anfangsdurchbiegung in mm */
  durchbiegungInst: number;
  /** Enddurchbiegung inkl. Kriechen in mm */
  durchbiegungFin: number;
  ausnutzung: { biegung: number; schub: number; durchbiegung: number };
  maxAusnutzung: number;
  ampel: Ampel;
}

export interface QuerschnittErgebnis extends SparrenErgebnis {
  breite: number;
  hoehe: number;
}

interface Holzkennwerte {
  fmk: number; // Biegefestigkeit N/mm²
  fvk: number; // Schubfestigkeit N/mm²
  e0mean: number; // Elastizitätsmodul N/mm²
  rho: number; // charakteristische Rohdichte kg/m³
  gammaM: number;
}

// Festigkeitswerte nach DIN EN 338 / DIN EN 14080
const HOLZ: Record<Festigkeitsklasse, Holzkennwerte> = {
  C16: { fmk: 16, fvk: 3.2, e0mean: 8000, rho: 310, gammaM: 1.3 },
  C24: { fmk: 24, fvk: 4.0, e0mean: 11000, rho: 350, gammaM: 1.3 },
  C30: { fmk: 30, fvk: 4.0, e0mean: 12000, rho: 380, gammaM: 1.3 },
  GL24h: { fmk: 24, fvk: 3.5, e0mean: 11500, rho: 385, gammaM: 1.25 },
};

export const FESTIGKEITSKLASSEN: { id: Festigkeitsklasse; label: string }[] = [
  { id: 'C16', label: 'C16 (Vollholz, einfach)' },
  { id: 'C24', label: 'C24 (Konstruktionsvollholz KVH)' },
  { id: 'C30', label: 'C30 (Vollholz, höher)' },
  { id: 'GL24h', label: 'GL24h (Brettschichtholz)' },
];

export const STANDARD_QUERSCHNITTE: { breite: number; hoehe: number }[] = [
  { breite: 60, hoehe: 120 },
  { breite: 60, hoehe: 140 },
  { breite: 80, hoehe: 140 },
  { breite: 80, hoehe: 160 },
  { breite: 80, hoehe: 180 },
  { breite: 80, hoehe: 200 },
  { breite: 100, hoehe: 200 },
  { breite: 100, hoehe: 220 },
  { breite: 100, hoehe: 240 },
  { breite: 120, hoehe: 240 },
  { breite: 120, hoehe: 260 },
  { breite: 140, hoehe: 260 },
];

// Teilsicherheits- und Kombinationsbeiwerte (DIN EN 1990)
const GAMMA_G = 1.35;
const GAMMA_Q = 1.5;
// Modifikationsbeiwerte nach DIN EN 1995-1-1: ständig, kurz (Schnee bis 1000 m), mittel (Schnee über 1000 m)
const KMOD_STAENDIG = 0.6;
const KMOD_SCHNEE_BIS_1000 = 0.9;
const KMOD_SCHNEE_UEBER_1000 = 0.8;
// Rissbeiwert für Schub (Vollholz, Brettschichtholz) nach nationalem Anhang
const KCR = 0.714;
const KDEF: Record<Nutzungsklasse, number> = { 1: 0.6, 2: 0.8 };
const GRENZE_INST = 1 / 300;
const GRENZE_FIN = 1 / 200;
const AMPEL_GELB_AB = 0.8;
const GRENZE_ROT_AB = 1;
const ROHDICHTE_UMRECHNUNG = 0.01; // kg/m³ → kN/m³

/** Charakteristische Schneelast am Boden nach DIN EN 1991-1-3/NA in kN/m². */
export function schneelastSk(zone: SchneelastZone, hoeheNN: number): number {
  const x = ((hoeheNN + 140) / 760) ** 2;
  switch (zone) {
    case '1':
      return Math.max(0.65, 0.19 + 0.91 * x);
    case '1a':
      return 1.25 * schneelastSk('1', hoeheNN);
    case '2':
      return Math.max(0.85, 0.25 + 1.91 * x);
    case '2a':
      return 1.25 * schneelastSk('2', hoeheNN);
    case '3':
      return Math.max(1.1, 0.31 + 2.91 * x);
  }
}

/** Formbeiwert μ1 für Dachschnee ohne Schneefanggitter (DIN EN 1991-1-3). */
export function schneeFormbeiwert(neigungGrad: number): number {
  if (neigungGrad <= 30) return 0.8;
  if (neigungGrad >= 60) return 0;
  return (0.8 * (60 - neigungGrad)) / 30;
}

function pruefeEingabe(e: SparrenEingabe): void {
  const positiv = [e.stuetzweite, e.abstand, e.breite, e.hoehe];
  if (positiv.some((w) => !Number.isFinite(w) || w <= 0)) {
    throw new Error('Stützweite, Abstand und Querschnitt müssen größer als 0 sein.');
  }
  if (!Number.isFinite(e.neigung) || e.neigung < 0 || e.neigung > 90) {
    throw new Error('Die Dachneigung muss zwischen 0° und 90° liegen.');
  }
  if (!Number.isFinite(e.eindeckung) || e.eindeckung < 0 || !Number.isFinite(e.sk) || e.sk < 0) {
    throw new Error('Eindeckungsgewicht und Schneelast dürfen nicht negativ sein.');
  }
}

function ampelFuer(ausnutzung: number): Ampel {
  if (ausnutzung > GRENZE_ROT_AB) return 'rot';
  if (ausnutzung > AMPEL_GELB_AB) return 'gelb';
  return 'gruen';
}

/** Biegefestigkeits-Höhenfaktor k_h für Vollholz bzw. Brettschichtholz. */
function hoehenfaktor(klasse: Festigkeitsklasse, hoehe: number): number {
  if (hoehe >= 150) return 1;
  const exponent = klasse === 'GL24h' ? 0.1 : 0.2;
  const grenze = klasse === 'GL24h' ? 1.1 : 1.3;
  return Math.min((150 / hoehe) ** exponent, grenze);
}

/** Vorbemessung eines Sparrens als Einfeldträger auf zwei Auflagern. */
export function berechneSparren(e: SparrenEingabe): SparrenErgebnis {
  pruefeEingabe(e);
  const holz = HOLZ[e.festigkeitsklasse];
  const alpha = (e.neigung * Math.PI) / 180;
  const cos = Math.cos(alpha);
  const b = e.breite;
  const h = e.hoehe;
  const L = e.stuetzweite * 1000; // mm

  // Lasten in kN je Meter Sparren, senkrecht zur Sparrenachse
  const eigenSparren = (b / 1000) * (h / 1000) * holz.rho * ROHDICHTE_UMRECHNUNG * cos;
  const g = (e.eindeckung * cos) * e.abstand + eigenSparren;
  // Schnee liegt auf der Grundfläche: Umrechnung auf die Dachfläche und Anteil senkrecht ergibt cos²
  const schneeDach = schneeFormbeiwert(e.neigung) * e.sk * cos * cos;
  const s = schneeDach * e.abstand;

  // Querschnittswerte in mm
  const W = (b * h * h) / 6;
  const I = (b * h ** 3) / 12;
  const kh = hoehenfaktor(e.festigkeitsklasse, h);
  const kmodSchnee = e.hoeheNN > 1000 ? KMOD_SCHNEE_UEBER_1000 : KMOD_SCHNEE_BIS_1000;

  // Zwei Kombinationen: nur ständige Last (kmod 0,6) und ständig + Schnee (kmod der kürzesten Einwirkung)
  const kombinationen = [
    { q: GAMMA_G * g, kmod: KMOD_STAENDIG },
    { q: GAMMA_G * g + GAMMA_Q * s, kmod: kmodSchnee },
  ].map(({ q, kmod }) => {
    const M = (q * (L / 1000) ** 2) / 8; // kNm
    const V = (q * (L / 1000)) / 2; // kN
    const fmd = (holz.fmk * kmod * kh) / holz.gammaM;
    const fvd = (holz.fvk * kmod) / holz.gammaM;
    return {
      M,
      V,
      biegung: M * 1e6 / W / fmd,
      schub: (1.5 * V * 1000) / (KCR * b * h) / fvd,
    };
  });
  const massgebend = kombinationen.reduce((a, k) => (k.biegung >= a.biegung ? k : a));
  const maxSchub = Math.max(...kombinationen.map((k) => k.schub));

  // Gebrauchstauglichkeit: kN/m = N/mm
  const verformung = (qN: number) => (5 * qN * L ** 4) / (384 * holz.e0mean * I);
  const wG = verformung(g);
  const wQ = verformung(s);
  const wInst = wG + wQ;
  const wFin = wG * (1 + KDEF[e.nutzungsklasse]) + wQ; // ψ2 = 0 für Schnee bis 1000 m
  const durchbiegung = Math.max((wInst / L) / GRENZE_INST, (wFin / L) / GRENZE_FIN);

  const ausnutzung = {
    biegung: massgebend.biegung,
    schub: maxSchub,
    durchbiegung,
  };
  const maxAusnutzung = Math.max(ausnutzung.biegung, ausnutzung.schub, ausnutzung.durchbiegung);

  return {
    bemessungsmoment: massgebend.M,
    bemessungsquerkraft: massgebend.V,
    schneelastDach: schneeDach,
    durchbiegungInst: wInst,
    durchbiegungFin: wFin,
    ausnutzung,
    maxAusnutzung,
    ampel: ampelFuer(maxAusnutzung),
  };
}

/** Größte Stützweite in m, bei der die Ausnutzung den Zielwert (z. B. 1,0) nicht übersteigt. */
export function maxStuetzweite(e: SparrenEingabe, zielAusnutzung = 1): number {
  let unten = 0.1;
  let oben = 30;
  for (let i = 0; i < 60; i++) {
    const mitte = (unten + oben) / 2;
    const u = berechneSparren({ ...e, stuetzweite: mitte }).maxAusnutzung;
    if (u > zielAusnutzung) oben = mitte;
    else unten = mitte;
  }
  return unten;
}

/** Alle Standardquerschnitte unter den gegebenen Bedingungen, nach Querschnittsfläche sortiert. */
export function pruefeQuerschnitte(e: SparrenEingabe): QuerschnittErgebnis[] {
  return [...STANDARD_QUERSCHNITTE]
    .sort((a, c) => a.breite * a.hoehe - c.breite * c.hoehe)
    .map((q) => ({ ...q, ...berechneSparren({ ...e, breite: q.breite, hoehe: q.hoehe }) }));
}
