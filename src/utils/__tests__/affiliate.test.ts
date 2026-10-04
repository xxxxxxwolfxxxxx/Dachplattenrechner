import { describe, it, expect } from 'vitest';
import { angebot, PARTNER, ANGEBOTE } from '../../data/affiliate';

describe('angebot', () => {
  it('liefert null für unbekannte Schlüssel', () => {
    expect(angebot('gibt-es-nicht')).toBeNull();
  });

  it('liefert null, solange kein Partner einen Link hat', () => {
    const partner = { a: { name: 'A', url: '' } };
    const angebote = { werkzeug: { partner: ['a'], text: 't', button: 'b' } };
    expect(angebot('werkzeug', partner, angebote)).toBeNull();
  });

  it('nimmt den ersten Partner mit https-Link', () => {
    const partner = { a: { name: 'A', url: '' }, b: { name: 'B', url: 'https://example.com/b' } };
    const angebote = { werkzeug: { partner: ['a', 'b'], text: 't', button: 'btn' } };
    expect(angebot('werkzeug', partner, angebote)).toEqual({
      name: 'B', url: 'https://example.com/b', text: 't', button: 'btn',
    });
  });

  it('lehnt Links ohne https ab', () => {
    const partner = { a: { name: 'A', url: 'javascript:alert(1)' }, b: { name: 'B', url: 'http://example.com' } };
    const angebote = { werkzeug: { partner: ['a', 'b'], text: 't', button: 'btn' } };
    expect(angebot('werkzeug', partner, angebote)).toBeNull();
  });

  it('verweist jedes Angebot auf existierende Partner', () => {
    for (const [key, a] of Object.entries(ANGEBOTE)) {
      for (const p of a.partner) expect(PARTNER[p], `${key} → ${p}`).toBeDefined();
    }
  });

  it('trägt nur leere oder https-Links ein', () => {
    for (const [id, p] of Object.entries(PARTNER)) {
      expect(p.url === '' || p.url.startsWith('https://'), id).toBe(true);
    }
  });

  it('liefert für Werkzeug den Toolchest-Link, solange er eingetragen ist', () => {
    const treffer = angebot('werkzeug');
    expect(treffer?.name).toBe('Toolchest.de');
    expect(treffer?.url).toContain('awinmid=117285');
  });

  it('zeigt für PV nichts, solange Anker Solix keinen Link hat', () => {
    expect(PARTNER.ankersolix.url === '' ? angebot('pv') : null).toBeNull();
  });
});

import { kategorienFuerWerkzeug, kategorieLink, KATEGORIEN } from '../../data/affiliate';

describe('kategorienFuerWerkzeug', () => {
  it('ordnet typisches Ratgeber-Werkzeug passenden Kategorien zu', () => {
    const k = kategorienFuerWerkzeug(['Maßband', 'Wasserwaage', 'Digitaler Winkelmesser']);
    expect(k.map((x) => x.pfad)).toEqual(['Massbaender', 'Wasserwaagen', 'Winkel']);
  });

  it('begrenzt auf drei Kategorien in der Reihenfolge der Liste', () => {
    const k = kategorienFuerWerkzeug(['Maßband', 'Wasserwaage', 'Cuttermesser', 'Akkuschrauber', 'Helm']);
    expect(k.map((x) => x.pfad)).toEqual(['Massbaender', 'Wasserwaagen', 'Cuttermesser']);
  });

  it('fasst Handschuhe und Arbeitshandschuhe zu einer Kategorie zusammen', () => {
    const k = kategorienFuerWerkzeug(['Handschuhe', 'Arbeitshandschuhe']);
    expect(k.map((x) => x.pfad)).toEqual(['Handschuhe']);
  });

  it('verlinkt Blechscheren auf Scheren, nicht auf Schieferscheren', () => {
    const k = kategorienFuerWerkzeug(['Knabber oder Blechschere']);
    expect(k.map((x) => x.pfad)).toEqual(['Scheren']);
  });

  it('verwechselt einen Winkelschleifer nicht mit einem Winkelmesser', () => {
    expect(kategorienFuerWerkzeug(['Winkelschleifer mit dünner 1-mm-Trennscheibe (nur als Ausnahme)'])).toEqual([]);
  });

  it('verlinkt Absturzsicherung bewusst nirgends', () => {
    expect(kategorienFuerWerkzeug(['Absturzsicherung'])).toEqual([]);
  });

  it('ignoriert Werkzeug ohne passende Kategorie', () => {
    expect(kategorienFuerWerkzeug(['Notizblock oder Skizze zum Ausdrucken', 'Fernglas'])).toEqual([]);
  });

  it('nutzt nur Pfade aus erlaubten Zeichen', () => {
    for (const k of KATEGORIEN) expect(k.pfad).toMatch(/^[A-Za-z0-9_-]+$/);
  });
});

describe('kategorieLink', () => {
  const partner = {
    t: { name: 'T', url: '', deeplink: { basis: 'https://www.awin1.com/cread.php?awinmid=1&awinaffid=2', ziel: 'https://www.shop.de' } },
  };

  it('baut einen Awin-Deeplink mit kodiertem Ziel', () => {
    expect(kategorieLink('t', 'Wasserwaagen', partner)).toBe(
      'https://www.awin1.com/cread.php?awinmid=1&awinaffid=2&ued=https%3A%2F%2Fwww.shop.de%2FWasserwaagen',
    );
  });

  it('liefert null ohne Deeplink-Basis oder ohne https', () => {
    expect(kategorieLink('x', 'Winkel', partner)).toBeNull();
    expect(kategorieLink('t', 'Winkel', { t: { name: 'T', url: '', deeplink: { basis: 'http://a', ziel: 'https://s' } } })).toBeNull();
    expect(kategorieLink('t', 'Winkel', { t: { name: 'T', url: '' } })).toBeNull();
  });
});
