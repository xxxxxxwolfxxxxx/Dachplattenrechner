import { describe, it, expect } from 'vitest';
import { zielSeiten, pruefeSeite } from '../affiliate-check';
import { KATEGORIEN } from '../../data/affiliate';

const KACHEL = '<div class="product-box pt-0"><div class="productbox-title"></div></div>';
const kategorieHtml = (anzahl: number) => `<h1>Maßbänder</h1>${KACHEL.repeat(anzahl)}`;
const produktHtml = (h1: string, verfuegbarkeit = 'InStock', preis = '11.99') =>
  `<h1>${h1}</h1><meta itemprop="price" content="${preis}"><link itemprop="availability" href="https://schema.org/${verfuegbarkeit}"><span>Lieferzeit: 1-3 Tage</span>`;

describe('zielSeiten', () => {
  it('enthält jede Kategorie und jedes Hauptprodukt genau einmal', () => {
    const seiten = zielSeiten();
    const erwartet = KATEGORIEN.length + KATEGORIEN.filter((k) => k.produkt).length;
    expect(seiten).toHaveLength(erwartet);
    expect(new Set(seiten.map((s) => s.url)).size).toBe(seiten.length);
  });

  it('prüft ausschließlich Seiten des Shops, nie den Awin-Link (sonst zählen Klicks)', () => {
    for (const s of zielSeiten()) {
      expect(s.url.startsWith('https://www.toolchest.de/')).toBe(true);
      expect(s.url).not.toContain('awin1.com');
    }
  });
});

describe('pruefeSeite', () => {
  it('akzeptiert eine Kategorie mit Produktkacheln', () => {
    expect(pruefeSeite({ art: 'kategorie', name: 'Maßbänder' }, 200, kategorieHtml(5))).toBeNull();
  });

  it('meldet eine leere Kategorie', () => {
    expect(pruefeSeite({ art: 'kategorie', name: 'Maßbänder' }, 200, kategorieHtml(0))).toMatch(/keine Produkte/i);
  });

  it('meldet einen Statuscode außer 200', () => {
    expect(pruefeSeite({ art: 'kategorie', name: 'x' }, 404, '')).toBe('HTTP 404');
    expect(pruefeSeite({ art: 'produkt', name: 'x' }, 500, '')).toBe('HTTP 500');
  });

  it('akzeptiert ein Produkt mit passender Marke, Preis und Lieferzeit', () => {
    const html = produktHtml('STABILA Taschenbandmaß 5 m metrische Skala BM 100');
    expect(pruefeSeite({ art: 'produkt', name: 'STABILA Taschenbandmaß 5 m' }, 200, html)).toBeNull();
  });

  it('meldet ein Produkt, dessen Überschrift die Marke nicht mehr nennt', () => {
    const html = produktHtml('Silverline Rollbandmaß');
    expect(pruefeSeite({ art: 'produkt', name: 'STABILA Taschenbandmaß 5 m' }, 200, html)).toMatch(/Überschrift/);
  });

  it('meldet ein Produkt ohne Preis', () => {
    const html = '<h1>STABILA Taschenbandmaß</h1>';
    expect(pruefeSeite({ art: 'produkt', name: 'STABILA Taschenbandmaß 5 m' }, 200, html)).toMatch(/Preis/);
  });

  it('meldet ein Produkt, das der Shop als nicht verfügbar kennzeichnet', () => {
    const html = produktHtml('STABILA Taschenbandmaß', 'OutOfStock');
    expect(pruefeSeite({ art: 'produkt', name: 'STABILA Taschenbandmaß 5 m' }, 200, html)).toMatch(/nicht lieferbar/);
  });

  it('lässt sich nicht von "Ausverkauft" bei anderen Produkten im Karussell täuschen', () => {
    const html = produktHtml('STABILA Taschenbandmaß') + '<div>STABILA Wasserwaage 90 cm Ausverkauft</div>';
    expect(pruefeSeite({ art: 'produkt', name: 'STABILA Taschenbandmaß 5 m' }, 200, html)).toBeNull();
  });

  it('beanstandet nichts, wenn die Seite keine Verfügbarkeit angibt', () => {
    const html = '<h1>STABILA Taschenbandmaß</h1><meta itemprop="price" content="11.99">';
    expect(pruefeSeite({ art: 'produkt', name: 'STABILA Taschenbandmaß 5 m' }, 200, html)).toBeNull();
  });
});
