import { describe, it, expect } from 'vitest';
import { baueOrtsdaten, ladeOrtsdaten, lastTabelle, slugify, MIN_PLZ_FUER_ORTSSEITE, type Ortsdaten } from '../ortsseiten';
import type { Datensatz, HoehenDatensatz, PlzDatensatz } from '../schneelastzonen';

const echt: Ortsdaten = ladeOrtsdaten();
const ort = (name: string, kreis?: string) => echt.orte.find((o) => o.name === name && (!kreis || o.kreis === kreis));

describe('slugify', () => {
  it('wandelt Umlaute und Sonderzeichen in Adressen um', () => {
    expect(slugify('Garmisch-Partenkirchen')).toBe('garmisch-partenkirchen');
    expect(slugify('Lüchow (Wendland), Stadt')).toBe('luechow-wendland-stadt');
    expect(slugify('Großenhain')).toBe('grossenhain');
  });
});

describe('Adressen der Ortsseiten (echte Daten)', () => {
  it('vergibt jedem Ort eine eindeutige Adresse', () => {
    const slugs = echt.orte.map((o) => o.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });
  it('hängt bei mehrfach vorkommenden Namen den Landkreis an', () => {
    const treffer = echt.orte.filter((o) => o.name === 'Neuenkirchen');
    expect(treffer.length).toBeGreaterThan(1);
    expect(treffer.every((o) => o.mehrdeutig && o.slug.startsWith('neuenkirchen-'))).toBe(true);
  });
  it('unterscheidet gleichnamige Gemeinden im selben Landkreis über den Schlüssel', () => {
    const gartow = echt.orte.filter((o) => o.name === 'Gartow');
    expect(gartow).toHaveLength(2);
    expect(gartow[0].slug).not.toBe(gartow[1].slug);
    expect(gartow.every((o) => o.slug.includes(o.ags))).toBe(true);
  });
  it('lässt eindeutige Namen unverändert', () => {
    expect(ort('Garmisch-Partenkirchen')?.slug).toBe('garmisch-partenkirchen');
    expect(ort('Garmisch-Partenkirchen')?.mehrdeutig).toBe(false);
  });
  it('vergibt den reservierten Slug "landkreis" nie', () => {
    expect(echt.orte.some((o) => o.slug === 'landkreis')).toBe(false);
  });
});

describe('Auswahl der Ortsseiten (Stufe 1)', () => {
  it('erzeugt Seiten nur für Orte mit Schneelastzone und genug Postleitzahlen', () => {
    for (const o of echt.orte) {
      expect(o.hatSeite).toBe(o.schnee !== null && o.plz.length >= MIN_PLZ_FUER_ORTSSEITE);
    }
  });
  it('liegt in der erwarteten Größenordnung', () => {
    const seiten = echt.orte.filter((o) => o.hatSeite).length;
    expect(seiten).toBeGreaterThan(1000);
    expect(seiten).toBeLessThan(1300);
  });
  it('enthält Gemeinden mit Zone, Windzone, Höhe und Postleitzahlen', () => {
    const o = ort('Garmisch-Partenkirchen');
    expect(o).toMatchObject({ schnee: '2a', wind: '1', land: 'BY', hatSeite: true });
    expect(o?.hoehe).toBeGreaterThan(600);
    expect(o?.plz).toContain('82467');
  });
  it('führt Landkreise mit ihren Orten, kreisfreie Städte ohne Übersicht', () => {
    const kreis = echt.kreise.find((k) => k.name === 'Mayen-Koblenz');
    expect(kreis?.hatSeite).toBe(true);
    expect(kreis?.orte.length).toBeGreaterThan(10);
    expect(echt.kreise.find((k) => k.name === 'Kiel')?.hatSeite).toBe(false);
  });
});

describe('baueOrtsdaten (kleine Testdaten)', () => {
  const plz: PlzDatensatz = {
    stand: 't', quelle: 't',
    kreise: [['BY', 'Teststadt'], ['BY', 'Testland']],
    gemeinden: { '1': ['Alpha', 1, '2', '1'], '2': ['Beta', 1, '3', '2'], '3': ['Ohne', 1, null, '1'] },
    plz: { '10000': ['1'], '10001': ['1', '2'], '10002': ['1'], '10003': ['3'] },
  };
  const schnee: Datensatz = { stand: 't', quelle: 't', zeilen: [['BY', 'Testland', null, '2', null]] };
  const hoehen: HoehenDatensatz = { stand: 't', quelle: 't', h: { 'BY|Testland': { Alpha: 500 } } };
  const d = baueOrtsdaten(plz, schnee, { stand: 't', quelle: 't', zeilen: [] }, hoehen);

  it('sammelt Postleitzahlen je Gemeinde sortiert', () => {
    expect(d.orte.find((o) => o.name === 'Alpha')?.plz).toEqual(['10000', '10001', '10002']);
  });
  it('verlangt eine Schneelastzone und genug Postleitzahlen', () => {
    expect(d.orte.find((o) => o.name === 'Alpha')?.hatSeite).toBe(true);
    expect(d.orte.find((o) => o.name === 'Beta')?.hatSeite).toBe(false);
    expect(d.orte.find((o) => o.name === 'Ohne')?.hatSeite).toBe(false);
  });
  it('findet die Höhe und markiert fehlende', () => {
    expect(d.orte.find((o) => o.name === 'Alpha')?.hoehe).toBe(500);
    expect(d.orte.find((o) => o.name === 'Beta')?.hoehe).toBeNull();
  });
  it('liefert Landkreise mit mindestens zwei Gemeinden als Seite', () => {
    expect(d.kreise.find((k) => k.name === 'Testland')?.hatSeite).toBe(true);
    expect(d.kreise.find((k) => k.name === 'Teststadt')?.hatSeite).toBe(false);
  });
});

describe('lastTabelle', () => {
  it('berechnet Schneelast je Neigung aus Zone und Höhe', () => {
    const t = lastTabelle('2', 300);
    expect(t).not.toBeNull();
    const bis30 = t!.zeilen[0];
    expect(bis30.formbeiwert).toBe(0.8);
    expect(bis30.kn).toBeCloseTo(0.8 * t!.sk, 6);
    expect(t!.zeilen.at(-1)!.kg).toBe(0);
    expect(t!.zeilen.map((z) => z.kg)).toEqual([...t!.zeilen.map((z) => z.kg)].sort((a, b) => b - a));
  });
  it('nutzt ohne Höhe den Mindestwert der Zone', () => {
    expect(lastTabelle('2', null)!.sk).toBeCloseTo(0.85, 6);
  });
  it('liefert bei Sonderzonen und fehlender Zone nichts', () => {
    expect(lastTabelle('3a', 900)).toBeNull();
    expect(lastTabelle('>3a', 900)).toBeNull();
    expect(lastTabelle(null, 100)).toBeNull();
  });
});
