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
