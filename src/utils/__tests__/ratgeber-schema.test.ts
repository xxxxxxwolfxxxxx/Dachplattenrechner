import { describe, it, expect } from 'vitest';
import { ratgeberSchema, PHASEN } from '../ratgeber-schema';

const gueltig = {
  titel: 'Verlegen & Verschrauben von Trapezblech',
  gewerk: 'blechdach',
  phase: 'eindeckung',
  reihenfolge: 160,
  beschreibung:
    'Trapezblech sicher verlegen und verschrauben: Verlegerichtung, Schraubposition, 6 Schrauben pro m², Kalotten und Dichtband – Schritt für Schritt erklärt.',
  dauer: 'ca. 1 Tag bei 30 m²',
  schwierigkeit: 2,
  personen: 2,
  wetter: 'trocken, windstill',
  sicherheit: 'Vor dem Betreten des Dachs Absturzsicherung anlegen und prüfen.',
  schritte: [
    { titel: 'Erste Tafel ausrichten', text: 'Gegen die Hauptwetterrichtung beginnen.' },
    { titel: 'Verschrauben', text: 'Mit Kalotte in die Hochsicke schrauben.' },
    { titel: 'Nächste Tafel', text: 'Überdeckung beachten.' },
  ],
  typischeFehler: ['Schrauben zu fest angezogen'],
};

describe('ratgeberSchema', () => {
  it('akzeptiert einen vollständigen Schritt', () => {
    expect(ratgeberSchema.safeParse(gueltig).success).toBe(true);
  });

  it('lehnt leere Sicherheitshinweise ab', () => {
    expect(ratgeberSchema.safeParse({ ...gueltig, sicherheit: '' }).success).toBe(false);
  });

  it('lehnt zu kurze Beschreibung ab', () => {
    expect(ratgeberSchema.safeParse({ ...gueltig, beschreibung: 'kurz' }).success).toBe(false);
  });

  it('lehnt weniger als drei Schritte ab', () => {
    expect(ratgeberSchema.safeParse({ ...gueltig, schritte: gueltig.schritte.slice(0, 2) }).success).toBe(false);
  });

  it('verlangt alt-Text, wenn ein Schritt ein Bild hat', () => {
    const schritte = [{ ...gueltig.schritte[0], bild: '/ratgeber/svg/x.svg' }, gueltig.schritte[1], gueltig.schritte[2]];
    expect(ratgeberSchema.safeParse({ ...gueltig, schritte }).success).toBe(false);
  });

  it('lehnt einen Titel über 50 Zeichen ab', () => {
    expect(ratgeberSchema.safeParse({ ...gueltig, titel: 'x'.repeat(51) }).success).toBe(false);
  });

  it('lehnt eine Beschreibung über 160 Zeichen ab', () => {
    expect(ratgeberSchema.safeParse({ ...gueltig, beschreibung: 'x'.repeat(161) }).success).toBe(false);
  });

  it('akzeptiert einen Schritt mit Bild und alt-Text', () => {
    const schritte = [
      { ...gueltig.schritte[0], bild: '/ratgeber/svg/x.svg', alt: 'Querschnitt durch das Dach mit Schraube' },
      gueltig.schritte[1],
      gueltig.schritte[2],
    ];
    expect(ratgeberSchema.safeParse({ ...gueltig, schritte }).success).toBe(true);
  });

  it('lehnt unbekannte Phase ab', () => {
    expect(ratgeberSchema.safeParse({ ...gueltig, phase: 'sonstiges' }).success).toBe(false);
  });

  it('kennt sechs Phasen in fester Reihenfolge', () => {
    expect(PHASEN).toEqual(['planung', 'vorbereitung', 'unterbau', 'eindeckung', 'details', 'pflege']);
  });
});
