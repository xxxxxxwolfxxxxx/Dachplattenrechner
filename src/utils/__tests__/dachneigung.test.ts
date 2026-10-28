import { describe, it, expect } from 'vitest';
import {
  gradZuProzent,
  prozentZuGrad,
  neigungAusMassen,
  berechneNeigung,
  einordnung,
  neigungstabelle,
} from '../dachneigung';

describe('Umrechnung Grad und Prozent', () => {
  it('rechnet 45° in 100 % um', () => {
    expect(gradZuProzent(45)).toBeCloseTo(100, 6);
  });
  it('rechnet 100 % in 45° um', () => {
    expect(prozentZuGrad(100)).toBeCloseTo(45, 6);
  });
  it('rechnet 2 % Flachdachgefälle in rund 1,15° um', () => {
    expect(prozentZuGrad(2)).toBeCloseTo(1.1458, 3);
  });
  it('ist umkehrbar', () => {
    expect(prozentZuGrad(gradZuProzent(33))).toBeCloseTo(33, 6);
  });
});

describe('neigungAusMassen', () => {
  it('liefert 45° bei gleicher Höhe und Breite', () => {
    expect(neigungAusMassen(3, 3)).toBeCloseTo(45, 6);
  });
  it('liefert rund 26,57° bei Höhe 2 m über 4 m Breite', () => {
    expect(neigungAusMassen(2, 4)).toBeCloseTo(26.565, 2);
  });
});

describe('berechneNeigung', () => {
  it('liefert alle Größen für 30°', () => {
    const e = berechneNeigung({ art: 'grad', wert: 30 });
    expect(e).not.toBeNull();
    expect(e!.grad).toBeCloseTo(30, 6);
    expect(e!.prozent).toBeCloseTo(57.735, 2);
    expect(e!.verhaeltnis).toBeCloseTo(1.732, 2);
    expect(e!.flaechenfaktor).toBeCloseTo(1.1547, 3);
    expect(e!.gefaelleCmProM).toBeCloseTo(57.735, 2);
  });
  it('rechnet aus Prozent', () => {
    const e = berechneNeigung({ art: 'prozent', wert: 100 });
    expect(e!.grad).toBeCloseTo(45, 6);
  });
  it('rechnet aus Höhe und Breite und nennt die Sparrenlänge', () => {
    const e = berechneNeigung({ art: 'massen', hoehe: 3, breite: 4 });
    expect(e!.grad).toBeCloseTo(36.87, 2);
    expect(e!.sparrenlaenge).toBeCloseTo(5, 6);
  });
  it('nennt keine Sparrenlänge ohne Breite', () => {
    expect(berechneNeigung({ art: 'grad', wert: 30 })!.sparrenlaenge).toBeUndefined();
  });
  it('weist ungültige Werte ab', () => {
    expect(berechneNeigung({ art: 'grad', wert: 0 })).toBeNull();
    expect(berechneNeigung({ art: 'grad', wert: 90 })).toBeNull();
    expect(berechneNeigung({ art: 'grad', wert: -5 })).toBeNull();
    expect(berechneNeigung({ art: 'grad', wert: NaN })).toBeNull();
    expect(berechneNeigung({ art: 'prozent', wert: 0 })).toBeNull();
    expect(berechneNeigung({ art: 'massen', hoehe: 0, breite: 4 })).toBeNull();
    expect(berechneNeigung({ art: 'massen', hoehe: 2, breite: 0 })).toBeNull();
  });
});

describe('einordnung', () => {
  it('nennt bis 5° ein Flachdach', () => {
    expect(einordnung(3).id).toBe('flachdach');
    expect(einordnung(5).id).toBe('flachdach');
  });
  it('trennt flach geneigt, geneigt und steil', () => {
    expect(einordnung(10).id).toBe('flach-geneigt');
    expect(einordnung(35).id).toBe('geneigt');
    expect(einordnung(50).id).toBe('steil');
  });
});

describe('neigungstabelle', () => {
  it('enthält Zeilen mit stimmigen Werten', () => {
    const zeilen = neigungstabelle();
    expect(zeilen.length).toBeGreaterThan(5);
    const z45 = zeilen.find((z) => z.grad === 45);
    expect(z45?.prozent).toBeCloseTo(100, 6);
  });
  it('ist nach Grad aufsteigend sortiert', () => {
    const grad = neigungstabelle().map((z) => z.grad);
    expect(grad).toEqual([...grad].sort((a, b) => a - b));
  });
});
