import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const toml = readFileSync(join(process.cwd(), 'netlify.toml'), 'utf8');
const regeln = [...toml.matchAll(/\[\[redirects\]\]\s+from = "([^"]+)"\s+to = "([^"]+)"\s+status = (\d+)/g)].map(
  (m) => ({ from: m[1], to: m[2], status: Number(m[3]) }),
);

const ALTE_PFADE = ['/projekt-dach/', '/projekt-dach/messen/', '/projekt-dach/uk/', '/projekt-dach/blech/', '/projekt-dach/winkel/'];

describe('Weiterleitungen der Altseiten', () => {
  it('liest mindestens fünf Regeln aus netlify.toml', () => {
    expect(regeln.length).toBeGreaterThanOrEqual(5);
  });

  for (const pfad of ALTE_PFADE) {
    it(`${pfad} leitet per 301 um`, () => {
      const r = regeln.find((x) => x.from === pfad);
      expect(r, `Regel für ${pfad}`).toBeDefined();
      expect(r!.status).toBe(301);
      expect(r!.to.endsWith('/')).toBe(true);
    });
  }

  it('hat eine Sammelregel /projekt-dach/* nach den exakten Regeln', () => {
    const i = regeln.findIndex((x) => x.from === '/projekt-dach/*');
    expect(i, 'Sammelregel vorhanden').toBeGreaterThan(-1);
    expect(regeln[i].status).toBe(301);
    expect(regeln[i].to).toBe('/ratgeber/blechdach/');
    for (const pfad of ALTE_PFADE) {
      expect(regeln.findIndex((x) => x.from === pfad), `${pfad} vor Sammelregel`).toBeLessThan(i);
    }
    expect(toml).toMatch(/from = "\/projekt-dach\/\*"\s+to = "[^"]+"\s+status = 301\s+force = true/);
  });

  it('alle Ziele existieren als Inhaltsdatei', () => {
    for (const r of regeln.filter((x) => x.from.startsWith('/projekt-dach'))) {
      const teile = r.to.split('/').filter(Boolean); // ['ratgeber','blechdach','aufmass']
      const datei =
        teile.length === 3 ? join(process.cwd(), 'src/content/ratgeber', teile[1], `${teile[2]}.md`) : null;
      if (datei) expect(existsSync(datei), r.to).toBe(true);
      else if (teile.length === 2) {
        expect(existsSync(join(process.cwd(), 'src/content/ratgeber', teile[1])), r.to).toBe(true);
      }
    }
  });
});
