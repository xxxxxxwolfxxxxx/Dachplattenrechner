import { describe, it, expect } from 'vitest';
import {
  schneelastSk,
  schneeFormbeiwert,
  dachSchneelast,
  lastVergleich,
  berechneSparren,
  maxStuetzweite,
  pruefeQuerschnitte,
  STANDARD_QUERSCHNITTE,
  type SparrenEingabe,
} from '../sparren';

const basis: SparrenEingabe = {
  stuetzweite: 4.0,
  abstand: 0.8,
  neigung: 35,
  breite: 80,
  hoehe: 200,
  eindeckung: 0.55,
  sk: 0.8903,
  festigkeitsklasse: 'C24',
  nutzungsklasse: 1,
  hoeheNN: 300,
};

describe('schneelastSk (DIN EN 1991-1-3/NA)', () => {
  it('Zone 1 bleibt im Flachland beim Mindestwert 0,65', () => {
    expect(schneelastSk('1', 0)).toBeCloseTo(0.65, 3);
  });
  it('Zone 2 bei 500 m: 0,25 + 1,91·((500+140)/760)²', () => {
    expect(schneelastSk('2', 500)).toBeCloseTo(1.6044, 3);
  });
  it('Zone 2 bei 300 m', () => {
    expect(schneelastSk('2', 300)).toBeCloseTo(0.8903, 3);
  });
  it('Zone 3 bei 1000 m', () => {
    expect(schneelastSk('3', 1000)).toBeCloseTo(6.8575, 3);
  });
  it('Zone 1a ist 1,25 × Zone 1', () => {
    expect(schneelastSk('1a', 600)).toBeCloseTo(schneelastSk('1', 600) * 1.25, 6);
  });
  it('Zone 2a ist 1,25 × Zone 2', () => {
    expect(schneelastSk('2a', 600)).toBeCloseTo(schneelastSk('2', 600) * 1.25, 6);
  });
});

describe('schneeFormbeiwert μ1', () => {
  it('0,8 bis 30°', () => {
    expect(schneeFormbeiwert(0)).toBe(0.8);
    expect(schneeFormbeiwert(30)).toBe(0.8);
  });
  it('linear fallend zwischen 30° und 60°', () => {
    expect(schneeFormbeiwert(35)).toBeCloseTo(0.6667, 3);
    expect(schneeFormbeiwert(45)).toBeCloseTo(0.4, 6);
  });
  it('0 ab 60°', () => {
    expect(schneeFormbeiwert(60)).toBe(0);
    expect(schneeFormbeiwert(75)).toBe(0);
  });
});

describe('berechneSparren – Handrechnung 8/20, C24, 4,0 m, a=0,8 m, 35°', () => {
  const e = berechneSparren(basis);

  it('berechnet das Bemessungsmoment', () => {
    expect(e.bemessungsmoment).toBeCloseTo(2.05, 1); // kNm
  });
  it('berechnet die Biegeausnutzung', () => {
    expect(e.ausnutzung.biegung).toBeCloseTo(0.23, 1);
  });
  it('berechnet die Durchbiegung (Anfangsdurchbiegung)', () => {
    expect(e.durchbiegungInst).toBeCloseTo(4.1, 0); // mm
  });
  it('liefert die Schneelast auf der Dachfläche', () => {
    expect(e.schneelastDach).toBeCloseTo(0.398, 2); // kN/m² senkrecht
  });
  it('meldet grün bei geringer Ausnutzung', () => {
    expect(e.ampel).toBe('gruen');
    expect(e.maxAusnutzung).toBeLessThan(0.8);
  });
});

describe('berechneSparren – Verhalten', () => {
  it('Ausnutzung steigt mit der Stützweite', () => {
    const kurz = berechneSparren({ ...basis, stuetzweite: 3 });
    const lang = berechneSparren({ ...basis, stuetzweite: 5 });
    expect(lang.maxAusnutzung).toBeGreaterThan(kurz.maxAusnutzung);
  });
  it('Ausnutzung steigt mit dem Sparrenabstand', () => {
    const eng = berechneSparren({ ...basis, abstand: 0.625 });
    const weit = berechneSparren({ ...basis, abstand: 0.9 });
    expect(weit.maxAusnutzung).toBeGreaterThan(eng.maxAusnutzung);
  });
  it('höherer Querschnitt senkt die Ausnutzung', () => {
    const klein = berechneSparren({ ...basis, hoehe: 160 });
    const gross = berechneSparren({ ...basis, hoehe: 240 });
    expect(gross.maxAusnutzung).toBeLessThan(klein.maxAusnutzung);
  });
  it('rot bei deutlicher Überlastung', () => {
    const e = berechneSparren({ ...basis, stuetzweite: 8, breite: 60, hoehe: 120 });
    expect(e.ampel).toBe('rot');
    expect(e.maxAusnutzung).toBeGreaterThan(1);
  });
  it('gelb zwischen 80 % und 100 % Ausnutzung', () => {
    const grenze = maxStuetzweite(basis, 0.9);
    const e = berechneSparren({ ...basis, stuetzweite: grenze });
    expect(e.ampel).toBe('gelb');
  });
  it('steilere Dächer ab 60° tragen keinen Schnee, der ständige Lastfall bleibt maßgebend', () => {
    const e = berechneSparren({ ...basis, neigung: 65 });
    expect(e.schneelastDach).toBe(0);
    expect(e.maxAusnutzung).toBeGreaterThan(0);
  });
  it('Nutzungsklasse 2 erhöht die Kriechverformung', () => {
    const nkl1 = berechneSparren({ ...basis, nutzungsklasse: 1 });
    const nkl2 = berechneSparren({ ...basis, nutzungsklasse: 2 });
    expect(nkl2.durchbiegungFin).toBeGreaterThan(nkl1.durchbiegungFin);
  });
  it('lehnt unsinnige Eingaben ab', () => {
    expect(() => berechneSparren({ ...basis, stuetzweite: 0 })).toThrow();
    expect(() => berechneSparren({ ...basis, abstand: -1 })).toThrow();
    expect(() => berechneSparren({ ...basis, neigung: 95 })).toThrow();
    expect(() => berechneSparren({ ...basis, hoehe: 0 })).toThrow();
  });
});

describe('maxStuetzweite', () => {
  it('liegt für 8/20 plausibel zwischen den Konkurrenz-Tabellen (4,5–6,5 m)', () => {
    const l = maxStuetzweite(basis, 1);
    expect(l).toBeGreaterThan(4.5);
    expect(l).toBeLessThan(6.5);
  });
  it('führt bei dieser Länge genau auf Ausnutzung 1', () => {
    const l = maxStuetzweite(basis, 1);
    expect(berechneSparren({ ...basis, stuetzweite: l }).maxAusnutzung).toBeCloseTo(1, 2);
  });
  it('wächst mit der Höhe des Querschnitts', () => {
    expect(maxStuetzweite({ ...basis, hoehe: 240 }, 1)).toBeGreaterThan(maxStuetzweite(basis, 1));
  });
});

describe('pruefeQuerschnitte', () => {
  it('liefert alle Standardquerschnitte mit Ampel, nach Größe sortiert', () => {
    const liste = pruefeQuerschnitte(basis);
    expect(liste).toHaveLength(STANDARD_QUERSCHNITTE.length);
    const hoehen = liste.map((z) => z.breite * z.hoehe);
    expect([...hoehen].sort((a, b) => a - b)).toEqual(hoehen);
  });
  it('größere Querschnitte sind nie schlechter bewertet', () => {
    const liste = pruefeQuerschnitte({ ...basis, stuetzweite: 5.5 });
    for (let i = 1; i < liste.length; i++) {
      expect(liste[i].maxAusnutzung).toBeLessThanOrEqual(liste[i - 1].maxAusnutzung + 1e-9);
    }
  });
});

describe('dachSchneelast', () => {
  it('nimmt ohne Neigung den Höchstwert 0,8 · s_k', () => {
    expect(dachSchneelast(2)).toBeCloseTo(1.6, 6);
    expect(dachSchneelast(2, null)).toBeCloseTo(1.6, 6);
  });
  it('bleibt bis 30° bei 0,8 · s_k', () => {
    expect(dachSchneelast(2, 30)).toBeCloseTo(1.6, 6);
  });
  it('sinkt zwischen 30° und 60° linear', () => {
    expect(dachSchneelast(2, 45)).toBeCloseTo(0.8, 6);
  });
  it('ist ab 60° null (Schnee rutscht ab)', () => {
    expect(dachSchneelast(2, 60)).toBe(0);
    expect(dachSchneelast(2, 75)).toBe(0);
  });
});

describe('lastVergleich', () => {
  it('rechnet 2,6 kN/m² in Schneehöhen und Zementsäcke um', () => {
    const v = lastVergleich(2.6);
    expect(v.neuschneeCm).toBe(260);
    expect(v.nassschneeCm).toBe(65);
    expect(v.zementSaecke).toBe(10);
  });
  it('gibt kleine Lasten mit einer Nachkommastelle an', () => {
    expect(lastVergleich(0.5).zementSaecke).toBe(2);
    expect(lastVergleich(0.2).zementSaecke).toBe(0.8);
  });
  it('liefert bei Last 0 nur Nullen', () => {
    expect(lastVergleich(0)).toEqual({ neuschneeCm: 0, nassschneeCm: 0, zementSaecke: 0 });
  });
});
