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

  it('liefert mit den ausgelieferten Daten nichts, solange keine Links eingetragen sind', () => {
    for (const key of Object.keys(ANGEBOTE)) expect(angebot(key)).toBeNull();
  });
});
