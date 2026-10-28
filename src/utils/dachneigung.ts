// Umrechnung und Einordnung der Dachneigung. Reine Funktionen ohne Seiteneffekte.

const RAD_ZU_GRAD = 180 / Math.PI;
const GRAD_ZU_RAD = Math.PI / 180;

/** Bis zu dieser Neigung gilt ein Dach nach üblicher Einteilung als Flachdach. */
const GRENZE_FLACHDACH = 5;
const GRENZE_FLACH_GENEIGT = 22;
const GRENZE_GENEIGT = 45;

export type NeigungEingabe =
  | { art: 'grad'; wert: number }
  | { art: 'prozent'; wert: number }
  | { art: 'massen'; hoehe: number; breite: number };

export interface NeigungErgebnis {
  /** Dachneigung in Grad */
  grad: number;
  /** Steigung in Prozent (Höhe je 100 Einheiten Breite) */
  prozent: number;
  /** Breite je 1 Einheit Höhe, also das x in 1:x */
  verhaeltnis: number;
  /** Faktor von der Grundfläche zur Dachfläche (1 / cos) */
  flaechenfaktor: number;
  /** Höhenunterschied in cm je Meter Breite */
  gefaelleCmProM: number;
  /** Länge entlang der Dachfläche, nur wenn die Breite bekannt ist */
  sparrenlaenge?: number;
}

export interface Einordnung {
  id: 'flachdach' | 'flach-geneigt' | 'geneigt' | 'steil';
  label: string;
}

export interface Neigungszeile {
  grad: number;
  prozent: number;
  verhaeltnis: number;
}

export function gradZuProzent(grad: number): number {
  return Math.tan(grad * GRAD_ZU_RAD) * 100;
}

export function prozentZuGrad(prozent: number): number {
  return Math.atan(prozent / 100) * RAD_ZU_GRAD;
}

export function neigungAusMassen(hoehe: number, breite: number): number {
  return Math.atan2(hoehe, breite) * RAD_ZU_GRAD;
}

const istPositiv = (x: number): boolean => Number.isFinite(x) && x > 0;

function ergebnisAusGrad(grad: number, breite?: number): NeigungErgebnis {
  const prozent = gradZuProzent(grad);
  const flaechenfaktor = 1 / Math.cos(grad * GRAD_ZU_RAD);
  return {
    grad,
    prozent,
    verhaeltnis: 100 / prozent,
    flaechenfaktor,
    gefaelleCmProM: prozent,
    sparrenlaenge: breite === undefined ? undefined : breite * flaechenfaktor,
  };
}

/** Liefert null bei ungültigen Eingaben (nicht endlich, 0 oder negativ, 90° oder mehr). */
export function berechneNeigung(eingabe: NeigungEingabe): NeigungErgebnis | null {
  switch (eingabe.art) {
    case 'grad':
      if (!istPositiv(eingabe.wert) || eingabe.wert >= 90) return null;
      return ergebnisAusGrad(eingabe.wert);
    case 'prozent':
      if (!istPositiv(eingabe.wert)) return null;
      return ergebnisAusGrad(prozentZuGrad(eingabe.wert));
    case 'massen':
      if (!istPositiv(eingabe.hoehe) || !istPositiv(eingabe.breite)) return null;
      return ergebnisAusGrad(neigungAusMassen(eingabe.hoehe, eingabe.breite), eingabe.breite);
  }
}

export function einordnung(grad: number): Einordnung {
  if (grad <= GRENZE_FLACHDACH) return { id: 'flachdach', label: 'Flachdach' };
  if (grad <= GRENZE_FLACH_GENEIGT) return { id: 'flach-geneigt', label: 'Flach geneigtes Dach' };
  if (grad <= GRENZE_GENEIGT) return { id: 'geneigt', label: 'Geneigtes Dach' };
  return { id: 'steil', label: 'Steildach' };
}

const TABELLEN_GRAD: readonly number[] = [3, 5, 7, 10, 15, 20, 25, 30, 35, 40, 45, 50, 60];

/** Umrechnungstabelle für die Seite, aufsteigend nach Grad. */
export function neigungstabelle(): Neigungszeile[] {
  return TABELLEN_GRAD.map((grad) => {
    const prozent = gradZuProzent(grad);
    return { grad, prozent, verhaeltnis: 100 / prozent };
  });
}
