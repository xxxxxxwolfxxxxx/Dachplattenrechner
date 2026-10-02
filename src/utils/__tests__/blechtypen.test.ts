import { describe, it, expect } from 'vitest';
import { BLECHTYPEN, getBlechtyp } from '../../data/blechtypen';

describe('BLECHTYPEN', () => {
  it('hat eindeutige ids und gefüllte Pflichtfelder', () => {
    const ids = BLECHTYPEN.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const t of BLECHTYPEN) {
      expect(t.name).not.toBe('');
      expect(t.schrauben).not.toBe('');
      expect(t.mindestneigung).not.toBe('');
      expect(t.schneiden).not.toBe('');
    }
  });
  it('nennt für das Standard-Trapezblech 6 Schrauben pro m²', () => {
    expect(getBlechtyp('trapez-standard')?.schraubenProQm).toBe(6);
  });
  it('führt flache Profile, Hochprofile und Sandwich getrennt', () => {
    expect(['profil-flach', 'hochprofil', 'sandwich'].every((id) => getBlechtyp(id))).toBe(true);
  });
  it('liefert für unbekannte ids undefined', () => {
    expect(getBlechtyp('gibt-es-nicht')).toBeUndefined();
  });
  it('legt für flache Profile, Hochprofile und Sandwich keine feste Schraubenzahl fest', () => {
    for (const id of ['profil-flach', 'hochprofil', 'sandwich']) expect(getBlechtyp(id)?.schraubenProQm).toBeNull();
  });
  it('legt keine pauschale Mindestneigung fest', () => {
    for (const t of BLECHTYPEN) expect(t.mindestneigung.toLowerCase()).toContain('hersteller');
  });
});
