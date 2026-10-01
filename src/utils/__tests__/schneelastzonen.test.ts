import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { sucheOrt, normalisiere, gruppiereNachZone, type Datensatz } from '../schneelastzonen';

const datei = fileURLToPath(new URL('../../../public/data/schneelastzonen.json', import.meta.url));
const daten: Datensatz = JSON.parse(readFileSync(datei, 'utf-8'));

const finde = (eingabe: string, kreis?: string) =>
  sucheOrt(daten, eingabe).filter((t) => !kreis || t.kreis === kreis);

describe('normalisiere', () => {
  it('faltet Umlaute und Satzzeichen', () => {
    expect(normalisiere('München')).toBe('muenchen');
    expect(normalisiere('Muenchen')).toBe('muenchen');
    expect(normalisiere('Bad-Wörishofen (Stadt)')).toBe('bad woerishofen stadt');
  });
});

describe('Datenbestand', () => {
  it('enthält alle 16 Bundesländer und nur gültige Zonen', () => {
    const laender = new Set(daten.zeilen.map((z) => z[0]));
    expect(laender.size).toBe(16);
    const gueltig = new Set(['1', '1a', '2', '2a', '3', '3a', '>3', '>3a']);
    expect(daten.zeilen.filter((z) => !gueltig.has(z[3]))).toEqual([]);
  });

  it('hat keine doppelten Gemeinden mit widersprüchlicher Zone', () => {
    const gesehen = new Map<string, string>();
    for (const [land, kreis, gemeinde, zone] of daten.zeilen) {
      const key = `${land}|${kreis}|${gemeinde}`;
      expect(gesehen.get(key) ?? zone, key).toBe(zone);
      gesehen.set(key, zone);
    }
  });
});

describe('sucheOrt', () => {
  it('findet eine Gemeinde mit Zone (Bayern)', () => {
    const t = finde('Garmisch-Partenkirchen').find((x) => x.art === 'gemeinde');
    expect(t?.zone).toBe('2a');
    expect(t?.land).toBe('BY');
  });

  it('findet Orte unabhängig von Umlaut-Schreibweise', () => {
    const t = finde('Muenchen').find((x) => x.art === 'gemeinde' && x.land === 'BY');
    expect(t?.zone).toBe('1a');
  });

  it('liefert Ausnahmegemeinden eines Landkreises mit abweichender Zone', () => {
    const t = finde('Essingen', 'Ostalbkreis')[0];
    expect(t.zone).toBe('2a');
  });

  it('liefert für einen Landkreis Standardzone und Ausnahmen (Ostalbkreis)', () => {
    const t = finde('Ostalbkreis').find((x) => x.art === 'kreis');
    expect(t?.zone).toBe('2');
    expect(t?.gemeinden.map((g) => g.name)).toEqual(['Essingen', 'Heubach']);
  });

  it('liefert für Landkreise ohne Standardzone mehrere Zonen (Bergstraße)', () => {
    const t = finde('Bergstraße').find((x) => x.art === 'kreis');
    expect(t?.zone).toBeNull();
    expect(t?.zonen).toEqual(['1', '2']);
  });

  it('trennt kreisfreie Stadt und gleichnamigen Landkreis (Rostock)', () => {
    const stadt = finde('Rostock').find((x) => x.art === 'gemeinde' && x.name === 'Rostock');
    const kreis = finde('Rostock').find((x) => x.art === 'kreis' && x.kreis === 'Landkreis Rostock');
    expect(stadt?.zone).toBe('3');
    expect(kreis?.zone).toBe('2');
  });

  it('weist Harz-Ortsteile mit Zone >3 aus', () => {
    const t = finde('Torfhaus')[0];
    expect(t.zone).toBe('>3');
    expect(t.hinweise.join(' ')).toContain('5,5');
  });

  it('übernimmt den Tiefland-Hinweis aus dem Landkreis', () => {
    const t = finde('Pinneberg').find((x) => x.art === 'kreis');
    expect(t?.hinweise.join(' ')).toContain('Norddeutsches Tiefland');
  });

  it('antwortet auf zu kurze Eingaben und Unsinn mit leerer Liste', () => {
    expect(finde('a')).toEqual([]);
    expect(finde('xyzxyzxyz')).toEqual([]);
  });

  it('sortiert exakte Treffer vor Teiltreffern', () => {
    const treffer = finde('Hof');
    expect(treffer[0].name.toLowerCase().startsWith('hof')).toBe(true);
  });
});

describe('gruppiereNachZone', () => {
  it('gruppiert aufsteigend nach Zone', () => {
    const g = gruppiereNachZone([
      { name: 'B', zone: '2a' },
      { name: 'A', zone: '1' },
      { name: 'C', zone: '2a' },
    ]);
    expect(g).toEqual([
      { zone: '1', namen: ['A'] },
      { zone: '2a', namen: ['B', 'C'] },
    ]);
  });
});
