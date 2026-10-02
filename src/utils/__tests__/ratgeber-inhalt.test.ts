import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync, existsSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { parse } from 'yaml';
import { ratgeberSchema, GEWERKE } from '../ratgeber-schema';

const WURZEL = join(process.cwd(), 'src/content/ratgeber');
const PUBLIC = join(process.cwd(), 'public');
const PAGES = join(process.cwd(), 'src/pages');

function dateien(dir: string): string[] {
  return readdirSync(dir).flatMap((n) => {
    const p = join(dir, n);
    return statSync(p).isDirectory() ? dateien(p) : p.endsWith('.md') ? [p] : [];
  });
}

const geladen = dateien(WURZEL).map((pfad) => {
  const roh = readFileSync(pfad, 'utf8');
  const m = roh.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!m) throw new Error(`Kein Frontmatter in ${pfad}`);
  const id = pfad.slice(WURZEL.length + 1).replace(/\.md$/, '');
  return { id, pfad, daten: parse(m[1]), body: m[2] };
});

const slugs = new Set(geladen.map((g) => g.id.split('/').pop()));
const geladeRatgeberIds = new Set(geladen.map((g) => g.id));

function istLinkAufloesbar(href: string): boolean {
  // Links müssen mit "/" oder "https://" beginnen
  if (!href.startsWith('/') && !href.startsWith('https://')) {
    return false;
  }

  // Externe Links sind OK
  if (href.startsWith('https://')) {
    return true;
  }

  // Ab hier nur interne Links mit "/"
  // Ratgeber-Links müssen korrekt auflösen
  if (href.startsWith('/ratgeber/')) {
    // /ratgeber/ allein OK
    if (href === '/ratgeber/') {
      return true;
    }

    // /ratgeber/<gewerk>/ OK wenn gewerk existiert
    const afterRatgeber = href.slice('/ratgeber/'.length);
    const parts = afterRatgeber.split('/').filter(Boolean);

    if (parts.length === 1 && afterRatgeber.endsWith('/')) {
      // /ratgeber/<gewerk>/
      return (GEWERKE as readonly string[]).includes(parts[0]);
    }

    if (parts.length === 2 && afterRatgeber.endsWith('/')) {
      // /ratgeber/<gewerk>/<slug>/
      const [gewerk, slug] = parts;
      const id = `${gewerk}/${slug}`;
      return geladeRatgeberIds.has(id);
    }

    // Alles andere (mit oder ohne Slash) ist Fehler
    return false;
  }

  // .html → muss in public existieren
  if (href.endsWith('.html')) {
    return existsSync(join(PUBLIC, href));
  }

  // Mit Trailing Slash → Astro-Route
  if (href.endsWith('/')) {
    const ohneSlash = href.slice(0, -1);
    // z.B. /tools/lattenrechner/ → src/pages/tools/lattenrechner.astro
    if (existsSync(join(PAGES, `${ohneSlash}.astro`))) return true;
    // z.B. /tools/sparren-rechner/ → src/pages/tools/sparren-rechner/index.astro
    if (existsSync(join(PAGES, `${ohneSlash}/index.astro`))) return true;
    return false;
  }

  // Ohne Slash und ohne .html → Fehler
  return false;
}

describe('Linkauflösung', () => {
  it('akzeptiert /ratgeber/', () => {
    expect(istLinkAufloesbar('/ratgeber/')).toBe(true);
  });

  it('akzeptiert /ratgeber/<gewerk>/ für existierende Gewerke', () => {
    expect(istLinkAufloesbar('/ratgeber/blechdach/')).toBe(true);
  });

  it('akzeptiert /ratgeber/<gewerk>/<slug>/ für existierende Inhalte', () => {
    expect(istLinkAufloesbar('/ratgeber/blechdach/verlegen-verschrauben/')).toBe(true);
  });

  it('lehnt /ratgeber/<gewerk>/<slug> (ohne Trailing Slash) ab', () => {
    expect(istLinkAufloesbar('/ratgeber/blechdach/verlegen-verschrauben')).toBe(false);
  });

  it('lehnt /ratgeber/<gewerk>/<slug-gibts-nicht>/ ab', () => {
    expect(istLinkAufloesbar('/ratgeber/blechdach/gibts-nicht/')).toBe(false);
  });

  it('lehnt relative Links wie tools/x/ ab', () => {
    expect(istLinkAufloesbar('tools/x/')).toBe(false);
  });

  it('akzeptiert externe Links mit https://', () => {
    expect(istLinkAufloesbar('https://example.com')).toBe(true);
  });

  it('akzeptiert /tools/lattenrechner/ (Astro-Route)', () => {
    expect(istLinkAufloesbar('/tools/lattenrechner/')).toBe(true);
  });

  it('akzeptiert /tools/anrissplan.html (static in public)', () => {
    expect(istLinkAufloesbar('/tools/anrissplan.html')).toBe(true);
  });

  it('lehnt /tools/anrissplan/ (als Route ohne .astro) ab', () => {
    expect(istLinkAufloesbar('/tools/anrissplan/')).toBe(false);
  });
});

describe('Ratgeber-Inhalte', () => {
  it('enthält mindestens einen Schritt', () => {
    expect(geladen.length).toBeGreaterThan(0);
  });

  for (const g of geladen) {
    describe(g.id, () => {
      const r = ratgeberSchema.safeParse(g.daten);

      it('erfüllt das Schema', () => {
        expect(r.success, r.success ? '' : JSON.stringify(r.error.issues, null, 2)).toBe(true);
      });

      if (!r.success) return;
      const d = r.data;

      it('liegt im Ordner seines Gewerks', () => {
        expect(g.id.startsWith(`${d.gewerk}/`)).toBe(true);
      });

      it('verweist nur auf vorhandene verwandte Schritte', () => {
        for (const v of d.verwandt) expect(slugs.has(v), `verwandt: ${v}`).toBe(true);
      });

      it('verweist nur auf vorhandene Bilder', () => {
        const bilder = [...d.schritte.map((s) => s.bild), d.titelbild].filter(Boolean) as string[];
        for (const b of bilder) expect(existsSync(join(PUBLIC, b)), `Bild fehlt: ${b}`).toBe(true);
      });

      it('verlinkt nur auflösbare interne Seiten', () => {
        const allLinks = [...d.rechner, ...d.quellen];
        for (const link of allLinks) {
          expect(istLinkAufloesbar(link.href), `Link auflösbar: ${link.href}`).toBe(true);
        }
      });

      it('hat mindestens eine Quelle oder ist ausdrücklich Praxis', () => {
        expect(d.quellen.length > 0 || g.body.includes('Praxis')).toBe(true);
      });

      it('hat eine nicht leere Dauer', () => {
        expect(d.dauer.trim().length).toBeGreaterThan(0);
      });

      it('verweist nicht auf sich selbst', () => {
        expect(d.verwandt, 'Selbstverweis in verwandt').not.toContain(g.id.split('/').pop());
      });

      it('enthält keine Emoji in den Schritten', () => {
        const text = d.schritte.map((s) => `${s.titel} ${s.text}`).join(' ');
        expect(/\p{Extended_Pictographic}/u.test(text), `Emoji gefunden in: ${text}`).toBe(false);
      });

      it('hat Sicherheitshinweise ohne Witz oder Spaß', () => {
        const hatWitz = /witz|spaß/i.test(d.sicherheit);
        expect(hatWitz, `Sicherheit sollte ernst bleiben, gefunden: ${d.sicherheit}`).toBe(false);
      });

      it('hat keine ungelösten Platzhalter in Schritten oder typischen Fehlern', () => {
        const allTexte = [
          ...d.schritte.map((s) => s.text),
          ...d.typischeFehler,
        ];
        const ungeloesteMuster = /\b(TODO|TBD|FIXME)\b/;
        for (const text of allTexte) {
          expect(ungeloesteMuster.test(text), `Ungelöster Platzhalter in: ${text}`).toBe(false);
        }
      });
    });
  }

  it('hat je Gewerk eindeutige reihenfolge', () => {
    const seen = new Map<string, Set<number>>();
    for (const g of geladen) {
      const gewerk = g.id.split('/')[0];
      const set = seen.get(gewerk) ?? new Set<number>();
      expect(set.has(g.daten.reihenfolge), `doppelte reihenfolge ${g.daten.reihenfolge} in ${gewerk}`).toBe(false);
      set.add(g.daten.reihenfolge);
      seen.set(gewerk, set);
    }
  });

  it('hat eindeutige Slugs über alle Gewerke', () => {
    const allSlugs = new Map<string, string>();
    for (const g of geladen) {
      const slug = g.id.split('/').pop();
      if (!slug) continue;
      expect(
        !allSlugs.has(slug),
        `Slug doppelt: ${slug} in ${g.id} und ${allSlugs.get(slug)}`
      ).toBe(true);
      allSlugs.set(slug, g.id);
    }
  });
});
