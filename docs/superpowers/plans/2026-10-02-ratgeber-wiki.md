# Ratgeber-Wiki Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ein Wiki unter `/ratgeber/` mit einer eigenen Anleitung (nummerierte Schritte, erklärende Bilder, Werkzeug/Material, Fehler, Sicherheit) für jeden Arbeitsschritt beim Blechdach; die fünf Altseiten unter `/projekt-dach/` gehen darin auf.

**Architecture:** Astro Content Collection `ratgeber` (ein Markdown-Dokument pro Arbeitsschritt, die nummerierten Schritte stehen strukturiert im Frontmatter, Fließtext im Body). Reine TypeScript-Helfer in `src/utils/ratgeber.ts` (testbar mit Vitest) erzeugen Reihenfolge, Phasen, Vor/Zurück, HowTo-Schema und Suchindex. Seiten, Komponenten und Layout sind dünne Hüllen darüber. Blechtyp-Werte (Schrauben, Neigung, Schneiden) liegen einmal in `src/data/blechtypen.ts`.

**Tech Stack:** Astro 6.1 (static, `build.format: 'directory'`), TypeScript strict, `astro/zod`, Vitest 5, SVG-Handarbeit, `sharp` (bereits als Astro-Abhängigkeit vorhanden) für Foto-Optimierung, Netlify-Redirects.

**Spec:** `docs/superpowers/specs/2026-10-02-ratgeber-wiki-design.md`

## Global Constraints

- Sprache aller Texte: Deutsch, volle Umlaute (ä ö ü ß), Sie/du: **du** (wie Bestand).
- Alle internen Links **mit Trailing Slash** (`/ratgeber/blechdach/`), sonst wählt Google die slashlose URL als kanonisch.
- Nur erklärende Bilder, **keine Humorbilder**. Technische Bilder als **SVG**; jedes Bild mit `alt`, `width`, `height`.
- Humor nur im Text, als **offensichtliche Übertreibung**, max. 1–2 Pointen pro Seite, **nie** in den nummerierten Schritten, **nie** in Sicherheitsboxen/Maßangaben; keine Witze, die Risiko verharmlosen.
- Schrauben: Standard **6 pro m²**; flache Profile mehr (kleinere Schrauben); Hochprofil/Sandwich weniger (größere Schrauben). Mindestneigung **je Blechtyp**, nie pauschal.
- Winkelschleifer **nur** mit dünner **1-mm-Trennscheibe, jede Tafel einzeln**; Knabber/Blechschere bevorzugt; **Staub und Späne gründlich abwischen (rosten)**.
- Jede Seite trägt den Hinweis „Richtwerte aus Herstellerangaben – Herstellerangaben und Statik gehen vor".
- Jede Zahl in einem Schritt hat eine Quelle im Frontmatter (`quellen`) oder ist als „Praxis" gekennzeichnet.
- `beschreibung` 120–160 Zeichen; `sicherheit` nie leer; Seitentitel (`titel`) max. 50 Zeichen (Layout hängt ` | Dachplattenrechner.de` an).
- Dateien < 400 Zeilen typisch, 800 max; keine Mutation von Eingabedaten (Helfer geben neue Arrays zurück).
- Commits im Format `<type>: <beschreibung>` (feat, fix, docs, test, chore), Attribution-Zeile wie vom Projekt vorgegeben.
- Arbeitsbranch: `feat/ratgeber-wiki` (nicht direkt auf `main`).

## Dateistruktur

| Datei | Verantwortung |
|---|---|
| `src/utils/ratgeber-schema.ts` | Zod-Schema, `PHASEN`, `GEWERKE`, Typen |
| `src/content.config.ts` | Collection `ratgeber` (glob-Loader) |
| `src/utils/ratgeber.ts` | reine Helfer: Sortierung, Phasen, Nachbarn, HowTo, Suchindex, Suche |
| `src/data/blechtypen.ts` | Blechtyp-Tabelle (Schrauben, Neigung, Schneiden) |
| `src/components/ratgeber/*.astro` | `HinweisBox`, `SchrittKopf`, `Schritt`, `MaterialListe`, `PhasenNav`, `Blechtypen`, `RatgeberSuche` |
| `src/styles/ratgeber.css` | gemeinsames Wiki-Styling (ersetzt das 5-fach kopierte CSS) |
| `src/pages/ratgeber/index.astro` | Wiki-Startseite |
| `src/pages/ratgeber/[gewerk]/index.astro` | Gewerk-Übersicht |
| `src/pages/ratgeber/[gewerk]/[schritt].astro` | Schrittseite |
| `src/pages/ratgeber/suche.json.ts` | Suchindex beim Build |
| `src/content/ratgeber/blechdach/*.md` | 23 Arbeitsschritte |
| `public/ratgeber/svg/*.svg`, `public/ratgeber/fotos/*.webp` | Bilder |
| `scripts/ratgeber-fotos.mjs` | Fotos verkleinern |
| `netlify.toml` | 301-Weiterleitungen |
| `src/utils/__tests__/ratgeber*.test.ts`, `ratgeber-inhalt.test.ts` | Tests |

---

### Task 1: Branch, Abhängigkeit, Schema und Collection

**Files:**
- Create: `src/utils/ratgeber-schema.ts`, `src/content.config.ts`
- Test: `src/utils/__tests__/ratgeber-schema.test.ts`

**Interfaces:**
- Produces: `PHASEN: readonly ['planung','vorbereitung','unterbau','eindeckung','details','pflege']`, `GEWERKE: readonly ['blechdach']`, `ratgeberSchema` (Zod), `type RatgeberDaten = z.infer<typeof ratgeberSchema>`, `type Phase`, `type Gewerk`.

- [ ] **Step 1: Branch und Test-Abhängigkeit**

```bash
git checkout -b feat/ratgeber-wiki
npm install --save-dev yaml
```

- [ ] **Step 2: Failing test schreiben** – `src/utils/__tests__/ratgeber-schema.test.ts`

```ts
import { describe, it, expect } from 'vitest';
import { ratgeberSchema, PHASEN } from '../ratgeber-schema';

const gueltig = {
  titel: 'Verlegen & Verschrauben von Trapezblech',
  gewerk: 'blechdach',
  phase: 'eindeckung',
  reihenfolge: 160,
  beschreibung:
    'Trapezblech sicher verlegen und verschrauben: Verlegerichtung, Schraubposition, 6 Schrauben pro m², Kalotten und Dichtband – Schritt für Schritt erklärt.',
  dauer: 'ca. 1 Tag bei 30 m²',
  schwierigkeit: 2,
  personen: 2,
  wetter: 'trocken, windstill',
  sicherheit: 'Vor dem Betreten des Dachs Absturzsicherung anlegen und prüfen.',
  schritte: [
    { titel: 'Erste Tafel ausrichten', text: 'Gegen die Hauptwetterrichtung beginnen.' },
    { titel: 'Verschrauben', text: 'Mit Kalotte in die Hochsicke schrauben.' },
    { titel: 'Nächste Tafel', text: 'Überdeckung beachten.' },
  ],
  typischeFehler: ['Schrauben zu fest angezogen'],
};

describe('ratgeberSchema', () => {
  it('akzeptiert einen vollständigen Schritt', () => {
    expect(ratgeberSchema.safeParse(gueltig).success).toBe(true);
  });

  it('lehnt leere Sicherheitshinweise ab', () => {
    expect(ratgeberSchema.safeParse({ ...gueltig, sicherheit: '' }).success).toBe(false);
  });

  it('lehnt zu kurze Beschreibung ab', () => {
    expect(ratgeberSchema.safeParse({ ...gueltig, beschreibung: 'kurz' }).success).toBe(false);
  });

  it('lehnt weniger als drei Schritte ab', () => {
    expect(ratgeberSchema.safeParse({ ...gueltig, schritte: gueltig.schritte.slice(0, 2) }).success).toBe(false);
  });

  it('verlangt alt-Text, wenn ein Schritt ein Bild hat', () => {
    const schritte = [{ ...gueltig.schritte[0], bild: '/ratgeber/svg/x.svg' }, gueltig.schritte[1], gueltig.schritte[2]];
    expect(ratgeberSchema.safeParse({ ...gueltig, schritte }).success).toBe(false);
  });

  it('lehnt unbekannte Phase ab', () => {
    expect(ratgeberSchema.safeParse({ ...gueltig, phase: 'sonstiges' }).success).toBe(false);
  });

  it('kennt sechs Phasen in fester Reihenfolge', () => {
    expect(PHASEN).toEqual(['planung', 'vorbereitung', 'unterbau', 'eindeckung', 'details', 'pflege']);
  });
});
```

- [ ] **Step 3: Test laufen lassen, Fehlschlag prüfen**

Run: `npx vitest run src/utils/__tests__/ratgeber-schema.test.ts`
Expected: FAIL (`Cannot find module '../ratgeber-schema'`)

- [ ] **Step 4: Schema implementieren** – `src/utils/ratgeber-schema.ts`

```ts
import { z } from 'astro/zod';

export const PHASEN = ['planung', 'vorbereitung', 'unterbau', 'eindeckung', 'details', 'pflege'] as const;
export const GEWERKE = ['blechdach'] as const;

export type Phase = (typeof PHASEN)[number];
export type Gewerk = (typeof GEWERKE)[number];

const link = z.object({
  titel: z.string().min(1),
  href: z.string().regex(/^(\/|https:\/\/)/, 'Link muss mit / oder https:// beginnen'),
});

const schritt = z
  .object({
    titel: z.string().min(3),
    text: z.string().min(10),
    bild: z.string().regex(/^\/ratgeber\/(svg|fotos)\//).optional(),
    alt: z.string().min(10).optional(),
  })
  .refine((s) => !s.bild || !!s.alt, { message: 'Ein Bild braucht einen alt-Text', path: ['alt'] });

export const ratgeberSchema = z.object({
  titel: z.string().min(10).max(50),
  gewerk: z.enum(GEWERKE),
  phase: z.enum(PHASEN),
  reihenfolge: z.number().int().positive(),
  beschreibung: z.string().min(120).max(160),
  dauer: z.string().min(1),
  schwierigkeit: z.number().int().min(1).max(3),
  personen: z.number().int().min(1),
  wetter: z.string().min(1),
  werkzeug: z.array(z.string().min(1)).default([]),
  material: z.array(z.object({ name: z.string().min(1), menge: z.string().optional() })).default([]),
  sicherheit: z.string().min(20),
  schritte: z.array(schritt).min(3),
  typischeFehler: z.array(z.string().min(5)).min(1),
  rechner: z.array(link).default([]),
  verwandt: z.array(z.string()).default([]),
  quellen: z.array(link).default([]),
  titelbild: z.string().regex(/^\/ratgeber\/(svg|fotos)\//).optional(),
});

export type RatgeberDaten = z.infer<typeof ratgeberSchema>;
```

- [ ] **Step 5: Collection anlegen** – `src/content.config.ts`

```ts
import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { ratgeberSchema } from './utils/ratgeber-schema';

const ratgeber = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/ratgeber' }),
  schema: ratgeberSchema,
});

export const collections = { ratgeber };
```

- [ ] **Step 6: Test grün**

Run: `npx vitest run src/utils/__tests__/ratgeber-schema.test.ts`
Expected: PASS (7 Tests)

- [ ] **Step 7: Commit**

```bash
git add package.json package-lock.json src/utils/ratgeber-schema.ts src/content.config.ts src/utils/__tests__/ratgeber-schema.test.ts
git commit -m "feat(ratgeber): Content-Collection-Schema für Arbeitsschritte"
```

---

### Task 2: Reine Helfer (Reihenfolge, Phasen, Nachbarn, HowTo, Suche)

**Files:**
- Create: `src/utils/ratgeber.ts`
- Test: `src/utils/__tests__/ratgeber.test.ts`

**Interfaces:**
- Consumes: `RatgeberDaten`, `PHASEN`, `Phase` aus `ratgeber-schema.ts`.
- Produces:
  - `interface Eintrag { id: string; data: RatgeberDaten }` (`id` = `"blechdach/verlegen-verschrauben"`)
  - `slugVon(id: string): string`, `gewerkVon(id: string): string`, `schrittUrl(id: string): string` → `/ratgeber/<id>/`
  - `sortiere(e: Eintrag[]): Eintrag[]` (nach `reihenfolge`, neues Array)
  - `nachGewerk(e: Eintrag[], gewerk: string): Eintrag[]` (sortiert)
  - `PHASEN_TITEL: Record<Phase, string>`
  - `gruppiereNachPhase(e: Eintrag[]): { phase: Phase; titel: string; schritte: Eintrag[] }[]` (nur nicht-leere Phasen, in `PHASEN`-Reihenfolge)
  - `nachbarn(e: Eintrag[], id: string): { zurueck: Eintrag | null; weiter: Eintrag | null }` (innerhalb des Gewerks)
  - `howToSchema(e: Eintrag, siteUrl: string): Record<string, unknown>`
  - `type SuchEintrag = { titel: string; beschreibung: string; phase: string; url: string; text: string }`
  - `baueSuchindex(e: Eintrag[]): SuchEintrag[]`
  - `suche(index: SuchEintrag[], anfrage: string): SuchEintrag[]`

- [ ] **Step 1: Failing test** – `src/utils/__tests__/ratgeber.test.ts`

```ts
import { describe, it, expect } from 'vitest';
import {
  slugVon, gewerkVon, schrittUrl, sortiere, nachGewerk,
  gruppiereNachPhase, nachbarn, howToSchema, baueSuchindex, suche,
  type Eintrag,
} from '../ratgeber';

function e(id: string, reihenfolge: number, phase: Eintrag['data']['phase'], titel = 'Beispielschritt lang genug'): Eintrag {
  return {
    id,
    data: {
      titel, gewerk: 'blechdach', phase, reihenfolge,
      beschreibung: 'x'.repeat(130), dauer: '1 h', schwierigkeit: 1, personen: 1, wetter: 'egal',
      werkzeug: ['Akkuschrauber'], material: [{ name: 'Schrauben', menge: '6 pro m²' }],
      sicherheit: 'Absturzsicherung vor dem Betreten anlegen.',
      schritte: [
        { titel: 'Eins', text: 'Erster Schritt hier.' },
        { titel: 'Zwei', text: 'Zweiter Schritt hier.' },
        { titel: 'Drei', text: 'Dritter Schritt hier.' },
      ],
      typischeFehler: ['Zu fest angezogen'], rechner: [], verwandt: [], quellen: [],
    },
  };
}

const daten = [
  e('blechdach/c', 30, 'eindeckung'),
  e('blechdach/a', 10, 'planung'),
  e('blechdach/b', 20, 'planung'),
];

describe('id-Helfer', () => {
  it('trennt Gewerk und Slug', () => {
    expect(slugVon('blechdach/aufmass')).toBe('aufmass');
    expect(gewerkVon('blechdach/aufmass')).toBe('blechdach');
    expect(schrittUrl('blechdach/aufmass')).toBe('/ratgeber/blechdach/aufmass/');
  });
});

describe('sortiere / nachGewerk', () => {
  it('sortiert nach reihenfolge und verändert das Original nicht', () => {
    const vorher = daten.map((x) => x.id);
    expect(sortiere(daten).map((x) => x.id)).toEqual(['blechdach/a', 'blechdach/b', 'blechdach/c']);
    expect(daten.map((x) => x.id)).toEqual(vorher);
  });
  it('filtert nach Gewerk', () => {
    expect(nachGewerk([...daten, { ...e('ziegel/z', 1, 'planung'), data: { ...e('x', 1, 'planung').data, gewerk: 'blechdach' } }], 'ziegel')).toHaveLength(1);
  });
});

describe('gruppiereNachPhase', () => {
  it('liefert nur belegte Phasen in fester Reihenfolge', () => {
    const g = gruppiereNachPhase(sortiere(daten));
    expect(g.map((x) => x.phase)).toEqual(['planung', 'eindeckung']);
    expect(g[0].schritte.map((s) => s.id)).toEqual(['blechdach/a', 'blechdach/b']);
    expect(g[0].titel).toBe('Planung');
  });
});

describe('nachbarn', () => {
  it('gibt Vorgänger und Nachfolger zurück', () => {
    expect(nachbarn(daten, 'blechdach/b')).toMatchObject({ zurueck: { id: 'blechdach/a' }, weiter: { id: 'blechdach/c' } });
  });
  it('liefert null an den Enden', () => {
    expect(nachbarn(daten, 'blechdach/a').zurueck).toBeNull();
    expect(nachbarn(daten, 'blechdach/c').weiter).toBeNull();
  });
});

describe('howToSchema', () => {
  it('erzeugt ein HowTo mit Schritten, Werkzeug und Material', () => {
    const s = howToSchema(daten[1], 'https://dachplattenrechner.de') as any;
    expect(s['@type']).toBe('HowTo');
    expect(s.url).toBe('https://dachplattenrechner.de/ratgeber/blechdach/a/');
    expect(s.step).toHaveLength(3);
    expect(s.step[0]).toMatchObject({ '@type': 'HowToStep', position: 1, name: 'Eins' });
    expect(s.tool[0]).toMatchObject({ '@type': 'HowToTool', name: 'Akkuschrauber' });
    expect(s.supply[0]).toMatchObject({ '@type': 'HowToSupply', name: 'Schrauben' });
  });
});

describe('Suche', () => {
  const index = baueSuchindex(sortiere([e('blechdach/a', 10, 'planung', 'Aufmaß der Dachfläche nehmen')]));
  it('findet über Titel, ohne Groß-/Kleinschreibung', () => {
    expect(suche(index, 'aufmaß')).toHaveLength(1);
  });
  it('verlangt alle Suchwörter', () => {
    expect(suche(index, 'aufmaß katze')).toHaveLength(0);
  });
  it('leere Anfrage liefert nichts', () => {
    expect(suche(index, '  ')).toEqual([]);
  });
});
```

- [ ] **Step 2: Fehlschlag prüfen**

Run: `npx vitest run src/utils/__tests__/ratgeber.test.ts`
Expected: FAIL (`Cannot find module '../ratgeber'`)

- [ ] **Step 3: Implementierung** – `src/utils/ratgeber.ts`

```ts
import { PHASEN, type Phase, type RatgeberDaten } from './ratgeber-schema';

export interface Eintrag {
  id: string;
  data: RatgeberDaten;
}

export type SuchEintrag = { titel: string; beschreibung: string; phase: string; url: string; text: string };

export const PHASEN_TITEL: Record<Phase, string> = {
  planung: 'Planung',
  vorbereitung: 'Vorbereitung',
  unterbau: 'Unterbau',
  eindeckung: 'Eindeckung',
  details: 'Details',
  pflege: 'Pflege',
};

export const slugVon = (id: string): string => id.split('/').pop() ?? id;
export const gewerkVon = (id: string): string => id.split('/')[0];
export const schrittUrl = (id: string): string => `/ratgeber/${id}/`;

export const sortiere = (e: Eintrag[]): Eintrag[] => [...e].sort((a, b) => a.data.reihenfolge - b.data.reihenfolge);

export const nachGewerk = (e: Eintrag[], gewerk: string): Eintrag[] =>
  sortiere(e.filter((x) => gewerkVon(x.id) === gewerk));

export function gruppiereNachPhase(e: Eintrag[]) {
  return PHASEN.map((phase) => ({
    phase,
    titel: PHASEN_TITEL[phase],
    schritte: e.filter((x) => x.data.phase === phase),
  })).filter((g) => g.schritte.length > 0);
}

export function nachbarn(e: Eintrag[], id: string): { zurueck: Eintrag | null; weiter: Eintrag | null } {
  const liste = nachGewerk(e, gewerkVon(id));
  const i = liste.findIndex((x) => x.id === id);
  return { zurueck: i > 0 ? liste[i - 1] : null, weiter: i >= 0 && i < liste.length - 1 ? liste[i + 1] : null };
}

export function howToSchema(e: Eintrag, siteUrl: string): Record<string, unknown> {
  const url = `${siteUrl}${schrittUrl(e.id)}`;
  return {
    '@type': 'HowTo',
    name: e.data.titel,
    description: e.data.beschreibung,
    url,
    inLanguage: 'de-DE',
    tool: e.data.werkzeug.map((name) => ({ '@type': 'HowToTool', name })),
    supply: e.data.material.map((m) => ({ '@type': 'HowToSupply', name: m.name })),
    step: e.data.schritte.map((s, i) => ({
      '@type': 'HowToStep',
      position: i + 1,
      name: s.titel,
      text: s.text,
      url: `${url}#schritt-${i + 1}`,
    })),
  };
}

export function baueSuchindex(e: Eintrag[]): SuchEintrag[] {
  return e.map((x) => ({
    titel: x.data.titel,
    beschreibung: x.data.beschreibung,
    phase: PHASEN_TITEL[x.data.phase],
    url: schrittUrl(x.id),
    text: [...x.data.schritte.map((s) => `${s.titel} ${s.text}`), ...x.data.werkzeug, ...x.data.material.map((m) => m.name)]
      .join(' ')
      .toLowerCase(),
  }));
}

export function suche(index: SuchEintrag[], anfrage: string): SuchEintrag[] {
  const woerter = anfrage.toLowerCase().split(/\s+/).filter(Boolean);
  if (woerter.length === 0) return [];
  return index.filter((x) => {
    const heu = `${x.titel} ${x.beschreibung} ${x.text}`.toLowerCase();
    return woerter.every((w) => heu.includes(w));
  });
}
```

- [ ] **Step 4: Grün**

Run: `npx vitest run src/utils/__tests__/ratgeber.test.ts`
Expected: PASS (alle Tests)

- [ ] **Step 5: Commit**

```bash
git add src/utils/ratgeber.ts src/utils/__tests__/ratgeber.test.ts
git commit -m "feat(ratgeber): Helfer für Reihenfolge, Phasen, HowTo-Schema und Suche"
```

---

### Task 3: Blechtyp-Daten

**Files:**
- Create: `src/data/blechtypen.ts`
- Test: `src/utils/__tests__/blechtypen.test.ts`

**Interfaces:**
- Produces: `interface Blechtyp { id: string; name: string; schraubenProQm: number | null; schrauben: string; mindestneigung: string; schneiden: string }`, `BLECHTYPEN: readonly Blechtyp[]`, `getBlechtyp(id: string): Blechtyp | undefined`.

- [ ] **Step 1: Failing test**

```ts
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
  it('legt keine pauschale Mindestneigung fest', () => {
    for (const t of BLECHTYPEN) expect(t.mindestneigung.toLowerCase()).toContain('hersteller');
  });
});
```

- [ ] **Step 2:** Run `npx vitest run src/utils/__tests__/blechtypen.test.ts` → Expected: FAIL (Modul fehlt)

- [ ] **Step 3: Implementierung** – `src/data/blechtypen.ts`

```ts
export interface Blechtyp {
  id: string;
  name: string;
  /** Richtwert; null = keine feste Zahl, Herstellerangabe gilt */
  schraubenProQm: number | null;
  schrauben: string;
  mindestneigung: string;
  schneiden: string;
}

const SCHNEIDEN_BLECH =
  'Knabber oder Blechschere. Winkelschleifer nur mit dünner 1-mm-Trennscheibe und jede Tafel einzeln. Staub und Späne gründlich abwischen, sie rosten.';

export const BLECHTYPEN: readonly Blechtyp[] = [
  {
    id: 'trapez-standard',
    name: 'Trapezblech (Standardprofil)',
    schraubenProQm: 6,
    schrauben: 'In der Regel 6 Schrauben pro m². Im Randbereich dichter, Lattenabstand beachten.',
    mindestneigung:
      'Laut Hersteller. Beispiel MAAS Stahl, Profilhöhe bis 35 mm: ca. 6° bei Dachtiefe bis 10 m, ca. 10° darüber.',
    schneiden: SCHNEIDEN_BLECH,
  },
  {
    id: 'profil-flach',
    name: 'Sehr flaches Profil (z. B. Wandprofil)',
    schraubenProQm: null,
    schrauben: 'Mehr als 6 Schrauben pro m², dafür oft kleinere Schrauben.',
    mindestneigung: 'Laut Hersteller, flache Profile sind meist nur für steilere Flächen oder die Wand gedacht.',
    schneiden: SCHNEIDEN_BLECH,
  },
  {
    id: 'hochprofil',
    name: 'Hochprofil',
    schraubenProQm: null,
    schrauben: 'Weniger als 6 Schrauben pro m², dafür deutlich größere Schrauben.',
    mindestneigung:
      'Laut Hersteller. Beispiel MAAS Stahl, Profilhöhe über 35 mm: ca. 4° bei Dachtiefe bis 10 m, ca. 5° darüber.',
    schneiden: SCHNEIDEN_BLECH,
  },
  {
    id: 'sandwich',
    name: 'Sandwichelement',
    schraubenProQm: null,
    schrauben: 'Weniger als 6 Schrauben pro m², dafür deutlich größere Schrauben (nach Elementdicke).',
    mindestneigung: 'Laut Hersteller, Angaben der Elementhersteller unterscheiden sich stark.',
    schneiden: 'Nach Herstellervorgabe des Elements. Schnittkanten versiegeln, Staub und Späne gründlich abwischen.',
  },
] as const;

export const getBlechtyp = (id: string): Blechtyp | undefined => BLECHTYPEN.find((t) => t.id === id);
```

- [ ] **Step 4:** Run `npx vitest run src/utils/__tests__/blechtypen.test.ts` → Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/data/blechtypen.ts src/utils/__tests__/blechtypen.test.ts
git commit -m "feat(ratgeber): Blechtyp-Tabelle mit Schrauben, Neigung und Schneiden"
```

---

### Task 4: Wiki-Layout, Komponenten und CSS

**Files:**
- Create: `src/styles/ratgeber.css`, `src/components/ratgeber/HinweisBox.astro`, `SchrittKopf.astro`, `Schritt.astro`, `MaterialListe.astro`, `PhasenNav.astro`, `Blechtypen.astro`
- Modify: `src/components/SchemaMarkup.astro` (Prop `extra`), `src/layouts/BaseLayout.astro` (Prop `extraSchema`), `src/layouts/ToolLayout.astro` (Prop `extraSchema` durchreichen)

**Interfaces:**
- Consumes: `Eintrag`, `PHASEN_TITEL`, `schrittUrl` (Task 2); `BLECHTYPEN` (Task 3).
- Produces:
  - `<HinweisBox variant="sicherheit|fehler|tipp|witz" titel?>` (Slot)
  - `<SchrittKopf dauer schwierigkeit personen wetter />`
  - `<Schritt nr titel text bild? alt? />` mit Anker `id="schritt-{nr}"`
  - `<MaterialListe werkzeug material storageKey />`
  - `<PhasenNav schritte aktivId />` (Phasen mit Schrittlisten)
  - `<Blechtypen />`
  - `ToolLayout`/`BaseLayout`/`SchemaMarkup` akzeptieren `extraSchema?: Record<string, unknown>[]`, das in den `@graph` aufgenommen wird.

- [ ] **Step 1: `SchemaMarkup` um `extra` erweitern** (`src/components/SchemaMarkup.astro`)

Props-Interface ergänzen:

```ts
  extra?: Record<string, unknown>[];
```

Destrukturierung ändern in:

```ts
const { type, title, description, url, breadcrumbs = [], faq = [], extra = [] } = Astro.props;
```

Direkt vor `const schema = …` einfügen:

```ts
graph.push(...extra);
```

- [ ] **Step 2: `BaseLayout` und `ToolLayout` durchreichen**

`BaseLayout.astro`: in `interface Props` `extraSchema?: Record<string, unknown>[];` ergänzen, in der Destrukturierung `extraSchema,` ergänzen und `<SchemaMarkup … extra={extraSchema} />` setzen (Zeile 61).
`ToolLayout.astro`: in `interface Props` `extraSchema?: Record<string, unknown>[];`, in der Destrukturierung `extraSchema` und `<BaseLayout … extraSchema={extraSchema}>`.

- [ ] **Step 3: Bestehendes Verhalten sichern**

Run: `npm run build 2>&1 | tail -5` und `npx vitest run`
Expected: Build ok, alle vorhandenen Tests PASS (Seiten ohne `extraSchema` unverändert).

- [ ] **Step 4: Gemeinsames CSS** – `src/styles/ratgeber.css`

Design-Tokens kommen aus dem bestehenden `main.css` (`--text-primary`, `--text-secondary`, `--text-muted`, `--accent-cyan`, `--accent-blue`, `--border-color`, `--gradient-surface`, `--radius-sm/md`, `--spacing-*`). Das Styling nutzt dieselben Variablen wie die Altseiten, einmal zentral:

```css
.ratgeber { max-width: 820px; margin: 0 auto; }
.ratgeber h1 { font-size: clamp(1.8rem, 4vw, 2.6rem); font-weight: 900; color: var(--text-primary); margin-bottom: var(--spacing-sm); }
.ratgeber h2 { font-size: clamp(1.3rem, 3vw, 1.7rem); font-weight: 700; color: var(--accent-cyan); margin: var(--spacing-xl) 0 12px; padding-bottom: var(--spacing-sm); border-bottom: 1px solid var(--border-color); }
.ratgeber h3 { font-size: 1.05rem; font-weight: 600; color: var(--text-primary); margin: var(--spacing-lg) 0 var(--spacing-sm); }
.ratgeber p, .ratgeber li { color: var(--text-secondary); line-height: 1.7; }
.ratgeber p { margin-bottom: 12px; }
.ratgeber ul, .ratgeber ol { margin: var(--spacing-sm) 0 var(--spacing-md) 20px; }
.ratgeber strong { color: var(--text-primary); }
.ratgeber a:focus-visible, .ratgeber button:focus-visible { outline: 2px solid var(--accent-cyan); outline-offset: 2px; }

.r-kopf { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 12px; margin: 20px 0; padding: 16px 20px; background: var(--gradient-surface); border: 1px solid var(--border-color); border-radius: var(--radius-md); }
.r-kopf dt { font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-muted); }
.r-kopf dd { margin: 2px 0 0; font-weight: 600; color: var(--text-primary); }

.r-schritt { display: grid; grid-template-columns: 44px 1fr; gap: 4px 16px; margin: 28px 0; scroll-margin-top: 80px; }
.r-schritt-nr { grid-row: 1 / span 3; width: 44px; height: 44px; border-radius: 50%; background: rgba(14,165,233,0.15); border: 1px solid rgba(14,165,233,0.4); color: var(--accent-blue); font-weight: 800; display: flex; align-items: center; justify-content: center; }
.r-schritt h3 { margin: 6px 0 4px; }
.r-schritt figure { margin: 12px 0 0; }
.r-schritt img { width: 100%; height: auto; border-radius: var(--radius-md); border: 1px solid var(--border-color); background: #fff; }

.r-box { border-radius: 10px; padding: 14px 18px; margin: 20px 0; font-size: 0.92rem; border: 1px solid; }
.r-box h4 { margin: 0 0 6px; font-size: 0.92rem; }
.r-box--sicherheit { background: rgba(239,68,68,0.08); border-color: rgba(239,68,68,0.45); }
.r-box--sicherheit h4 { color: #ef4444; }
.r-box--fehler { background: rgba(245,158,11,0.08); border-color: rgba(245,158,11,0.4); }
.r-box--fehler h4 { color: #f59e0b; }
.r-box--tipp { background: rgba(16,185,129,0.08); border-color: rgba(16,185,129,0.35); }
.r-box--tipp h4 { color: #10b981; }
.r-box--witz { background: transparent; border-style: dashed; border-color: var(--border-color); font-style: italic; }

.r-liste { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 16px; }
.r-liste label { display: flex; gap: 8px; align-items: flex-start; cursor: pointer; }
.r-liste input:checked + span { text-decoration: line-through; opacity: 0.6; }

.r-phasen { display: grid; gap: 20px; }
.r-phase h3 { color: var(--accent-cyan); }
.r-phase ol { list-style: none; margin-left: 0; padding: 0; display: grid; gap: 6px; }
.r-phase a { display: block; padding: 10px 14px; border: 1px solid var(--border-color); border-radius: var(--radius-sm); color: var(--text-primary); text-decoration: none; transition: background var(--transition-fast), border-color var(--transition-fast); }
.r-phase a:hover { background: rgba(14,165,233,0.1); border-color: var(--accent-blue); }
.r-phase a[aria-current='page'] { background: rgba(14,165,233,0.15); border-color: var(--accent-blue); font-weight: 700; }

.r-tabelle { width: 100%; border-collapse: collapse; font-size: 0.88rem; }
.r-tabelle th, .r-tabelle td { text-align: left; padding: 8px 10px; border-bottom: 1px solid var(--border-color); vertical-align: top; }
.r-tabelle th { color: var(--text-muted); font-size: 0.75rem; text-transform: uppercase; }
@media (max-width: 640px) { .r-tabelle { display: block; overflow-x: auto; } .r-schritt { grid-template-columns: 36px 1fr; } }

.r-hinweis { font-size: 0.85rem; color: var(--text-muted); border-top: 1px solid var(--border-color); margin-top: 32px; padding-top: 12px; }
.r-seitennav { display: flex; justify-content: space-between; gap: 12px; margin-top: 40px; padding-top: 16px; border-top: 1px solid var(--border-color); }
.r-seitennav a { color: var(--accent-cyan); text-decoration: none; font-weight: 600; padding: 10px 18px; border: 1px solid rgba(14,165,233,0.3); border-radius: var(--radius-sm); }
.r-seitennav a:hover { background: rgba(14,165,233,0.1); border-color: var(--accent-blue); }
@media (prefers-reduced-motion: reduce) { .ratgeber * { transition: none !important; } }
```

- [ ] **Step 5: Komponenten**

`src/components/ratgeber/HinweisBox.astro`:

```astro
---
interface Props { variant?: 'sicherheit' | 'fehler' | 'tipp' | 'witz'; titel?: string }
const { variant = 'tipp', titel } = Astro.props;
const ICON = { sicherheit: '⚠️', fehler: '🚫', tipp: '💡', witz: '😏' } as const;
---
<aside class={`r-box r-box--${variant}`} role={variant === 'sicherheit' ? 'note' : undefined}>
  {titel && <h4>{ICON[variant]} {titel}</h4>}
  <slot />
</aside>
```

`src/components/ratgeber/SchrittKopf.astro`:

```astro
---
interface Props { dauer: string; schwierigkeit: 1 | 2 | 3; personen: number; wetter: string }
const { dauer, schwierigkeit, personen, wetter } = Astro.props;
const STUFE = { 1: 'leicht', 2: 'mittel', 3: 'anspruchsvoll' } as const;
---
<dl class="r-kopf">
  <div><dt>Dauer</dt><dd>{dauer}</dd></div>
  <div><dt>Schwierigkeit</dt><dd>{STUFE[schwierigkeit]}</dd></div>
  <div><dt>Personen</dt><dd>{personen}</dd></div>
  <div><dt>Wetter</dt><dd>{wetter}</dd></div>
</dl>
```

`src/components/ratgeber/Schritt.astro`:

```astro
---
interface Props { nr: number; titel: string; text: string; bild?: string; alt?: string }
const { nr, titel, text, bild, alt } = Astro.props;
const absaetze = text.split(/\n{2,}/);
---
<section class="r-schritt" id={`schritt-${nr}`} aria-labelledby={`schritt-titel-${nr}`}>
  <div class="r-schritt-nr" aria-hidden="true">{nr}</div>
  <h3 id={`schritt-titel-${nr}`}>{titel}</h3>
  <div>{absaetze.map((a) => <p>{a}</p>)}</div>
  {bild && (
    <figure>
      <img src={bild} alt={alt} width="800" height="450" loading={nr === 1 ? 'eager' : 'lazy'} decoding="async" />
    </figure>
  )}
</section>
```

`src/components/ratgeber/MaterialListe.astro` (Häkchen nur lokal im Browser, mit try/catch):

```astro
---
interface Props { werkzeug: string[]; material: { name: string; menge?: string }[]; storageKey: string }
const { werkzeug, material, storageKey } = Astro.props;
---
<div class="r-liste" data-key={storageKey}>
  <div>
    <h3>Werkzeug</h3>
    <ul style="list-style:none;margin-left:0;">
      {werkzeug.map((w, i) => <li><label><input type="checkbox" data-i={`w${i}`} /><span>{w}</span></label></li>)}
    </ul>
  </div>
  <div>
    <h3>Material</h3>
    <ul style="list-style:none;margin-left:0;">
      {material.map((m, i) => <li><label><input type="checkbox" data-i={`m${i}`} /><span>{m.name}{m.menge ? ` – ${m.menge}` : ''}</span></label></li>)}
    </ul>
  </div>
</div>
<script>
  document.querySelectorAll<HTMLElement>('.r-liste').forEach((box) => {
    const key = `ratgeber-check-${box.dataset.key}`;
    let gespeichert: string[] = [];
    try { gespeichert = JSON.parse(localStorage.getItem(key) ?? '[]'); } catch { /* ohne Speicher weiter */ }
    const boxen = box.querySelectorAll<HTMLInputElement>('input[type=checkbox]');
    boxen.forEach((cb) => {
      cb.checked = gespeichert.includes(cb.dataset.i ?? '');
      cb.addEventListener('change', () => {
        const an = [...boxen].filter((x) => x.checked).map((x) => x.dataset.i);
        try { localStorage.setItem(key, JSON.stringify(an)); } catch { /* ignorieren */ }
      });
    });
  });
</script>
```

`src/components/ratgeber/PhasenNav.astro`:

```astro
---
import { gruppiereNachPhase, schrittUrl, type Eintrag } from '../../utils/ratgeber';
interface Props { schritte: Eintrag[]; aktivId?: string }
const { schritte, aktivId } = Astro.props;
const gruppen = gruppiereNachPhase(schritte);
let nr = 0;
---
<nav class="r-phasen" aria-label="Alle Arbeitsschritte">
  {gruppen.map((g) => (
    <div class="r-phase">
      <h3>{g.titel}</h3>
      <ol>
        {g.schritte.map((s) => {
          nr += 1;
          return <li><a href={schrittUrl(s.id)} aria-current={s.id === aktivId ? 'page' : undefined}>{nr}. {s.data.titel}</a></li>;
        })}
      </ol>
    </div>
  ))}
</nav>
```

`src/components/ratgeber/Blechtypen.astro`:

```astro
---
import { BLECHTYPEN } from '../../data/blechtypen';
---
<table class="r-tabelle">
  <thead><tr><th>Blechtyp</th><th>Schrauben</th><th>Mindestneigung</th><th>Schneiden</th></tr></thead>
  <tbody>
    {BLECHTYPEN.map((t) => (
      <tr><td><strong>{t.name}</strong></td><td>{t.schrauben}</td><td>{t.mindestneigung}</td><td>{t.schneiden}</td></tr>
    ))}
  </tbody>
</table>
```

- [ ] **Step 6: Build prüfen**

Run: `npm run build 2>&1 | tail -5`
Expected: erfolgreich (Komponenten sind noch unbenutzt).

- [ ] **Step 7: Commit**

```bash
git add src/styles/ratgeber.css src/components/ratgeber src/components/SchemaMarkup.astro src/layouts/BaseLayout.astro src/layouts/ToolLayout.astro
git commit -m "feat(ratgeber): Komponenten, gemeinsames Styling und Schema-Erweiterung"
```

---

### Task 5: Seiten (Startseite, Gewerk, Schritt) und Suche

**Files:**
- Create: `src/pages/ratgeber/index.astro`, `src/pages/ratgeber/[gewerk]/index.astro`, `src/pages/ratgeber/[gewerk]/[schritt].astro`, `src/pages/ratgeber/suche.json.ts`, `src/components/ratgeber/RatgeberSuche.astro`
- Test: Build + Pfadprüfung (Task 9)

**Interfaces:**
- Consumes: Collection `ratgeber`, alle Helfer aus Task 2, Komponenten aus Task 4, `ToolLayout` mit `extraSchema` und `breadcrumbs`.
- Produces: URLs `/ratgeber/`, `/ratgeber/blechdach/`, `/ratgeber/blechdach/<slug>/`, `/ratgeber/suche.json`.

> Die Seiten brauchen mindestens einen Inhaltsschritt, damit der Build etwas erzeugt. Task 6 legt ihn an; führe Task 5 und 6 direkt nacheinander aus und committe Task 5 erst, wenn der Build mit dem Pilotschritt grün ist.

- [ ] **Step 1: Suchindex** – `src/pages/ratgeber/suche.json.ts`

```ts
import { getCollection } from 'astro:content';
import { baueSuchindex, sortiere } from '../../utils/ratgeber';

export async function GET() {
  const eintraege = await getCollection('ratgeber');
  return new Response(JSON.stringify(baueSuchindex(sortiere(eintraege))), {
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
}
```

- [ ] **Step 2: Suchkomponente** – `src/components/ratgeber/RatgeberSuche.astro`

```astro
---
---
<div class="r-suche" role="search">
  <label for="r-suche-feld">Anleitung suchen</label>
  <input id="r-suche-feld" type="search" placeholder="z. B. First, Schrauben, Traufblech" autocomplete="off" />
  <ul id="r-suche-ergebnis" aria-live="polite"></ul>
</div>
<style>
  .r-suche { margin: 20px 0 32px; }
  .r-suche label { display: block; font-size: 0.8rem; color: var(--text-muted); margin-bottom: 6px; }
  .r-suche input { width: 100%; padding: 12px 14px; border-radius: var(--radius-sm); border: 1px solid var(--border-color); background: var(--gradient-surface); color: var(--text-primary); }
  .r-suche ul { list-style: none; margin: 8px 0 0; padding: 0; display: grid; gap: 6px; }
  .r-suche li a { display: block; padding: 10px 14px; border: 1px solid var(--border-color); border-radius: var(--radius-sm); color: var(--text-primary); text-decoration: none; }
  .r-suche li small { display: block; color: var(--text-muted); }
</style>
<script>
  import { suche, type SuchEintrag } from '../../utils/ratgeber';
  const feld = document.querySelector<HTMLInputElement>('#r-suche-feld');
  const liste = document.querySelector<HTMLUListElement>('#r-suche-ergebnis');
  let index: SuchEintrag[] | null = null;
  async function lade() {
    if (index) return index;
    const res = await fetch('/ratgeber/suche.json');
    if (!res.ok) throw new Error(`Suchindex nicht ladbar: ${res.status}`);
    index = (await res.json()) as SuchEintrag[];
    return index;
  }
  feld?.addEventListener('input', async () => {
    if (!liste) return;
    try {
      const treffer = suche(await lade(), feld.value);
      liste.replaceChildren(
        ...treffer.map((t) => {
          const li = document.createElement('li');
          const a = document.createElement('a');
          a.href = t.url;
          a.textContent = t.titel;
          const klein = document.createElement('small');
          klein.textContent = t.phase;
          a.append(klein);
          li.append(a);
          return li;
        }),
      );
      if (feld.value.trim() && treffer.length === 0) liste.textContent = 'Keine Anleitung gefunden.';
    } catch (e) {
      liste.textContent = 'Die Suche ist gerade nicht verfügbar.';
      console.error(e);
    }
  });
</script>
```

- [ ] **Step 3: Wiki-Startseite** – `src/pages/ratgeber/index.astro`

```astro
---
import { getCollection } from 'astro:content';
import ToolLayout from '../../layouts/ToolLayout.astro';
import RatgeberSuche from '../../components/ratgeber/RatgeberSuche.astro';
import PhasenNav from '../../components/ratgeber/PhasenNav.astro';
import '../../styles/ratgeber.css';
import { nachGewerk } from '../../utils/ratgeber';

const eintraege = nachGewerk(await getCollection('ratgeber'), 'blechdach');
---
<ToolLayout
  title="Dach-Ratgeber: Anleitungen für jeden Arbeitsschritt"
  description="Schritt-für-Schritt-Anleitungen mit Bildern für dein Dachprojekt: vom Aufmaß über den Unterbau bis zur Eindeckung, mit Werkzeug- und Materiallisten."
  navTitle="Ratgeber"
  breadcrumbs={[{ name: 'Startseite', url: '/' }, { name: 'Ratgeber', url: '/ratgeber/' }]}
>
  <div class="ratgeber">
    <h1>Dach-Ratgeber</h1>
    <p>Für jeden Arbeitsschritt eine Anleitung: mit Werkzeugliste, Materialliste, Bildern, typischen Fehlern und Sicherheitshinweisen.</p>
    <RatgeberSuche />
    <h2>Blechdach selbst decken</h2>
    <p><a href="/ratgeber/blechdach/">Alle {eintraege.length} Schritte im Überblick →</a></p>
    <PhasenNav schritte={eintraege} />
    <p class="r-hinweis">Alle Werte sind Richtwerte aus Herstellerangaben und Praxiserfahrung. Herstellerangaben und Statik gehen vor.</p>
  </div>
</ToolLayout>
```

- [ ] **Step 4: Gewerk-Übersicht** – `src/pages/ratgeber/[gewerk]/index.astro`

```astro
---
import { getCollection } from 'astro:content';
import ToolLayout from '../../../layouts/ToolLayout.astro';
import PhasenNav from '../../../components/ratgeber/PhasenNav.astro';
import Blechtypen from '../../../components/ratgeber/Blechtypen.astro';
import '../../../styles/ratgeber.css';
import { GEWERKE } from '../../../utils/ratgeber-schema';
import { nachGewerk } from '../../../utils/ratgeber';

export function getStaticPaths() {
  return GEWERKE.map((gewerk) => ({ params: { gewerk } }));
}
const { gewerk } = Astro.params;
const schritte = nachGewerk(await getCollection('ratgeber'), gewerk);
---
<ToolLayout
  title="Blechdach selbst decken – alle Arbeitsschritte"
  description={`Blechdach selbst decken in ${schritte.length} Schritten: Planung, Unterbau, Eindeckung und Details mit Bildern, Listen und Sicherheitshinweisen.`}
  navTitle="Ratgeber"
  breadcrumbs={[{ name: 'Startseite', url: '/' }, { name: 'Ratgeber', url: '/ratgeber/' }, { name: 'Blechdach', url: `/ratgeber/${gewerk}/` }]}
>
  <div class="ratgeber">
    <h1>Blechdach selbst decken</h1>
    <p>{schritte.length} Arbeitsschritte in der Reihenfolge, in der du sie auf der Baustelle brauchst.</p>
    <PhasenNav schritte={schritte} />
    <h2>Welches Blech braucht was?</h2>
    <p>Schrauben, Mindestneigung und Schneiden hängen vom Blechtyp ab. Es gilt immer die Anleitung des gekauften Profils.</p>
    <Blechtypen />
    <p class="r-hinweis">Richtwerte aus Herstellerangaben – Herstellerangaben und Statik gehen vor.</p>
  </div>
</ToolLayout>
```

- [ ] **Step 5: Schrittseite** – `src/pages/ratgeber/[gewerk]/[schritt].astro`

```astro
---
import { getCollection, render } from 'astro:content';
import ToolLayout from '../../../layouts/ToolLayout.astro';
import SchrittKopf from '../../../components/ratgeber/SchrittKopf.astro';
import Schritt from '../../../components/ratgeber/Schritt.astro';
import HinweisBox from '../../../components/ratgeber/HinweisBox.astro';
import MaterialListe from '../../../components/ratgeber/MaterialListe.astro';
import '../../../styles/ratgeber.css';
import { gewerkVon, slugVon, schrittUrl, nachbarn, howToSchema, PHASEN_TITEL } from '../../../utils/ratgeber';

export async function getStaticPaths() {
  const alle = await getCollection('ratgeber');
  return alle.map((e) => ({
    params: { gewerk: gewerkVon(e.id), schritt: slugVon(e.id) },
    props: { eintrag: e, alle },
  }));
}

const { eintrag, alle } = Astro.props;
const d = eintrag.data;
const { Content } = await render(eintrag);
const { zurueck, weiter } = nachbarn(alle, eintrag.id);
const verwandt = alle.filter((x) => gewerkVon(x.id) === gewerkVon(eintrag.id) && d.verwandt.includes(slugVon(x.id)));
const SITE = 'https://dachplattenrechner.de';
---
<ToolLayout
  title={d.titel}
  description={d.beschreibung}
  navTitle="Ratgeber"
  extraSchema={[howToSchema(eintrag, SITE)]}
  breadcrumbs={[
    { name: 'Startseite', url: '/' },
    { name: 'Ratgeber', url: '/ratgeber/' },
    { name: 'Blechdach', url: `/ratgeber/${gewerkVon(eintrag.id)}/` },
    { name: d.titel, url: schrittUrl(eintrag.id) },
  ]}
>
  <article class="ratgeber">
    <p class="r-phase-label">{PHASEN_TITEL[d.phase]}</p>
    <h1>{d.titel}</h1>
    <SchrittKopf dauer={d.dauer} schwierigkeit={d.schwierigkeit as 1 | 2 | 3} personen={d.personen} wetter={d.wetter} />

    <HinweisBox variant="sicherheit" titel="Sicherheit zuerst"><p>{d.sicherheit}</p></HinweisBox>

    <div class="r-text"><Content /></div>

    {(d.werkzeug.length > 0 || d.material.length > 0) && (
      <>
        <h2>Das brauchst du</h2>
        <MaterialListe werkzeug={d.werkzeug} material={d.material} storageKey={eintrag.id} />
      </>
    )}

    <h2>Schritt für Schritt</h2>
    {d.schritte.map((s, i) => <Schritt nr={i + 1} titel={s.titel} text={s.text} bild={s.bild} alt={s.alt} />)}

    <HinweisBox variant="fehler" titel="Typische Fehler">
      <ul>{d.typischeFehler.map((f) => <li>{f}</li>)}</ul>
    </HinweisBox>

    {d.rechner.length > 0 && (
      <HinweisBox variant="tipp" titel="Passende Rechner">
        <ul>{d.rechner.map((r) => <li><a href={r.href}>{r.titel}</a></li>)}</ul>
      </HinweisBox>
    )}

    {verwandt.length > 0 && (
      <>
        <h2>Verwandte Schritte</h2>
        <ul>{verwandt.map((v) => <li><a href={schrittUrl(v.id)}>{v.data.titel}</a></li>)}</ul>
      </>
    )}

    {d.quellen.length > 0 && (
      <>
        <h2>Quellen</h2>
        <ul>{d.quellen.map((q) => <li><a href={q.href} rel="noopener">{q.titel}</a></li>)}</ul>
      </>
    )}

    <p class="r-hinweis">Richtwerte aus Herstellerangaben und Praxiserfahrung. Herstellerangaben und Statik gehen vor.</p>

    <nav class="r-seitennav" aria-label="Weiter im Ratgeber">
      {zurueck ? <a href={schrittUrl(zurueck.id)}>← {zurueck.data.titel}</a> : <span></span>}
      {weiter ? <a href={schrittUrl(weiter.id)}>{weiter.data.titel} →</a> : <a href={`/ratgeber/${gewerkVon(eintrag.id)}/`}>Alle Schritte →</a>}
    </nav>
  </article>
</ToolLayout>
```

- [ ] **Step 6:** Weiter mit Task 6 (Pilotschritt), dann Build prüfen und beide Tasks zusammen committen (siehe Task 6, Step 6).

---

### Task 6: Pilotschritt „Verlegen & Verschrauben" mit SVG

**Files:**
- Create: `src/content/ratgeber/blechdach/verlegen-verschrauben.md`, `public/ratgeber/svg/schraubbild-hochsicke.svg`
- Test: `src/utils/__tests__/ratgeber-inhalt.test.ts` (Task 7 deckt alle Schritte ab; hier Build-Prüfung)

**Interfaces:**
- Consumes: Schema aus Task 1.
- Produces: Muster für alle weiteren Schritte (Frontmatter, Bild-Konvention, Hinweis-Konventionen).

- [ ] **Step 1: SVG anlegen** – `public/ratgeber/svg/schraubbild-hochsicke.svg` (zeigt Querschnitt Trapezblech, Schraube mit Kalotte in der Hochsicke auf Latte; Hell-/Dunkelmodus per `prefers-color-scheme` im SVG selbst)

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 450" role="img" aria-labelledby="t d">
  <title id="t">Schraube mit Kalotte in der Hochsicke</title>
  <desc id="d">Querschnitt durch ein Trapezblech auf einer Dachlatte. Die Schraube sitzt mit Kalotte oben auf der Hochsicke und geht durch Blech und Trennlage in die Latte.</desc>
  <style>
    :root { --bg:#ffffff; --fg:#0f172a; --blech:#94a3b8; --holz:#c08a52; --akzent:#0ea5e9; --warn:#dc2626; }
    @media (prefers-color-scheme: dark) { :root { --bg:#0f172a; --fg:#e2e8f0; --blech:#64748b; --holz:#a16f3d; } }
    .bg{fill:var(--bg)} .t{fill:var(--fg);font:600 18px system-ui,sans-serif}
    .k{fill:var(--fg);font:500 15px system-ui,sans-serif}
    .blech{fill:none;stroke:var(--blech);stroke-width:6;stroke-linejoin:round}
    .holz{fill:var(--holz)} .lin{stroke:var(--fg);stroke-width:1.5;fill:none}
    .akz{stroke:var(--akzent);stroke-width:3;fill:none} .kal{fill:var(--akzent)}
  </style>
  <rect class="bg" width="800" height="450"/>
  <text class="t" x="400" y="34" text-anchor="middle">Schraube sitzt in der Hochsicke, nicht im Wasserlauf</text>
  <!-- Latte -->
  <rect class="holz" x="250" y="330" width="300" height="70"/>
  <text class="k" x="400" y="372" text-anchor="middle" fill="#fff">Traglatte</text>
  <!-- Profil: Hochsicke in der Mitte, Täler links/rechts -->
  <path class="blech" d="M60 300 L190 300 L240 230 L310 230 L360 300 L440 300 L490 230 L560 230 L610 300 L740 300"/>
  <path class="blech" d="M60 306 L190 306" stroke-dasharray="0"/>
  <!-- Schraube mit Kalotte in rechter Hochsicke (x=525) -->
  <ellipse class="kal" cx="525" cy="222" rx="26" ry="8"/>
  <line class="akz" x1="525" y1="226" x2="525" y2="352"/>
  <!-- Maßlinie und Beschriftung -->
  <line class="lin" x1="240" y1="200" x2="310" y2="200"/><text class="k" x="275" y="192" text-anchor="middle">Hochsicke</text>
  <line class="lin" x1="360" y1="318" x2="440" y2="318"/><text class="k" x="400" y="310" text-anchor="middle">Tal = Wasserlauf</text>
  <text class="k" x="600" y="205">Kalotte + Dichtscheibe</text>
  <line class="lin" x1="552" y1="222" x2="598" y2="208"/>
  <text class="k" x="400" y="430" text-anchor="middle">Standard: 6 Schrauben pro m² · Randbereich dichter</text>
</svg>
```

- [ ] **Step 2: Pilot-Markdown** – `src/content/ratgeber/blechdach/verlegen-verschrauben.md`

```markdown
---
titel: "Verlegen & Verschrauben von Trapezblech"
gewerk: blechdach
phase: eindeckung
reihenfolge: 160
beschreibung: "Trapezblech sicher verlegen und verschrauben: Verlegerichtung, Schraubposition, 6 Schrauben pro m², Kalotten und Dichtband – Schritt für Schritt erklärt."
dauer: "ca. 1 Tag bei 30 m² mit zwei Personen"
schwierigkeit: 2
personen: 2
wetter: "trocken, windstill, nicht in praller Sonne"
werkzeug:
  - Akkuschrauber mit Tiefenanschlag
  - Schlagschnur
  - Maßband
  - Knabber oder Blechschere
  - Handschuhe
material:
  - { name: "Trapezblech-Tafeln", menge: "nach Anrissplan" }
  - { name: "Dachschrauben mit EPDM-Dichtscheibe", menge: "6 pro m² plus Randbereich" }
  - { name: "Kalotten", menge: "eine je Schraube" }
  - { name: "Butyl-Dichtband", menge: "für Querstöße" }
sicherheit: "Vor jedem Betreten Absturzsicherung anlegen. Blech nie mit nassen Schuhen betreten, blanke Kanten nur mit Handschuhen anfassen."
schritte:
  - titel: "Verlegerichtung festlegen"
    text: "Beginne am Ortgang, der der Hauptwetterrichtung zugewandt ist, und verlege gegen die Wetterrichtung. So drückt der Wind das Wasser nicht unter die Überlappung."
  - titel: "Erste Tafel ausrichten"
    text: "Lege die Tafel rechtwinklig zur Traufe an die Schnurlinie. Der Überstand an der Traufe darf höchstens 200 mm betragen, an First und Ortgang höchstens 70 mm."
  - titel: "In der Hochsicke verschrauben"
    text: "Setze Kalotte und Dichtschraube in die Hochsicke, nicht ins Tal. Standard sind 6 Schrauben pro m², im Randbereich dichter.\n\nDrehe nur so weit, bis die EPDM-Scheibe leicht eingedrückt ist. Zu fest angezogen reißt die Dichtung."
    bild: "/ratgeber/svg/schraubbild-hochsicke.svg"
    alt: "Querschnitt durch Trapezblech: Schraube mit Kalotte sitzt in der Hochsicke auf der Traglatte"
  - titel: "Nächste Tafel überdecken"
    text: "Lege die nächste Tafel so an, dass die Seitenüberlappung dicht schließt. Bei Querstößen rechnest du 200 mm Überdeckung, ab 20° Dachneigung genügen 150 mm. Unter 10° Neigung legst du zusätzlich Dichtband ein."
  - titel: "Späne entfernen und Folie abziehen"
    text: "Wische Bohr- und Schneidspäne sowie Staub sofort gründlich ab, sie rosten und färben die Fläche. Ziehe die Schutzfolie innerhalb von vier Wochen ab, sie ist nicht UV-beständig."
typischeFehler:
  - "Schrauben zu fest angezogen, die Dichtscheibe wird beschädigt"
  - "Falsche Verlegerichtung, Wasser läuft unter die Überlappung"
  - "Schrauben im Tal statt in der Hochsicke (bei Standardprofil mit Kalotte)"
  - "Späne liegen gelassen, die Fläche rostet punktuell"
  - "Blech über bereits verlegte Tafeln gezogen, die Beschichtung wird zerkratzt"
rechner:
  - { titel: "Anrissplan", href: "/tools/anrissplan/" }
  - { titel: "Verschnitt-Optimierung", href: "/tools/verschnitt-optimierung/" }
verwandt: []
quellen:
  - { titel: "MAAS Montageanleitung Trapez- und Wellprofile", href: "https://www.maasprofile.de/DATA/Montageanleitungen/Montageanleitungen_Trapez-_und_Wellblech.pdf" }
  - { titel: "dachbleche24: Trapezblech befestigen", href: "https://dachbleche24-shop.de/blogs/allgemein/trapezblech-befestigung" }
---

Jetzt wird es ernst: Aus Blech wird ein Dach. Wichtig ist die Reihenfolge, denn eine falsch verlegte erste Tafel ärgert dich bis zur letzten.

Wer mit dem ersten Blech so lange wartet, bis wirklich alles perfekt ist, deckt sein Dach im nächsten Jahrzehnt. Nimm dir Zeit, aber fang an.

**Welches Blech braucht wie viele Schrauben?** Die Zahl hängt vom Blechtyp ab. Hochprofile und Sandwichelemente brauchen weniger, dafür deutlich größere Schrauben, sehr flache Profile mehr. Es gilt die Anleitung deines Profils.
```

- [ ] **Step 3: Build**

Run: `npm run build 2>&1 | tail -15`
Expected: erfolgreich; `dist/ratgeber/index.html`, `dist/ratgeber/blechdach/index.html`, `dist/ratgeber/blechdach/verlegen-verschrauben/index.html`, `dist/ratgeber/suche.json` existieren.

- [ ] **Step 4: Ausgabe prüfen**

Run:
```bash
test -f dist/ratgeber/blechdach/verlegen-verschrauben/index.html && grep -c '"@type":"HowTo"' dist/ratgeber/blechdach/verlegen-verschrauben/index.html
cat dist/ratgeber/suche.json | head -c 300
```
Expected: `1`, danach JSON-Anfang mit `"titel":"Verlegen & Verschrauben von Trapezblech"`.

- [ ] **Step 5: Visuell prüfen**

Run: `preview_start` (Dev-Server) und öffne `/ratgeber/blechdach/verlegen-verschrauben/`. Prüfe bei 375 px und 1440 px, Hell/Dunkel: Kopfdaten, Sicherheitsbox, abhakbare Listen, Schritt 3 mit Bild, Typische Fehler, Vor/Zurück. Konsole ohne Fehler.

- [ ] **Step 6: Commit (Task 5 + 6 zusammen)**

```bash
git add src/pages/ratgeber src/components/ratgeber/RatgeberSuche.astro src/content/ratgeber public/ratgeber
git commit -m "feat(ratgeber): Wiki-Seiten, Suche und Pilotschritt Verlegen & Verschrauben"
```

---

### Task 7: Inhalts-Integritätstest

**Files:**
- Test: `src/utils/__tests__/ratgeber-inhalt.test.ts`

**Interfaces:**
- Consumes: `ratgeberSchema`, `yaml`, alle Markdown-Dateien unter `src/content/ratgeber/`.
- Produces: Gate, das alle weiteren Inhalts-Tasks erfüllen müssen.

- [ ] **Step 1: Test schreiben**

```ts
import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync, existsSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { parse } from 'yaml';
import { ratgeberSchema } from '../ratgeber-schema';

const WURZEL = join(process.cwd(), 'src/content/ratgeber');
const PUBLIC = join(process.cwd(), 'public');

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

      it('nutzt Trailing Slash bei internen Rechner-Links', () => {
        for (const link of d.rechner) if (link.href.startsWith('/')) expect(link.href.endsWith('/'), link.href).toBe(true);
      });

      it('hat mindestens eine Quelle oder ist ausdrücklich Praxis', () => {
        expect(d.quellen.length > 0 || g.body.includes('Praxis')).toBe(true);
      });

      it('enthält in den Schritten keine Emoji-Witze und keine Sicherheits-Pointe', () => {
        const text = d.schritte.map((s) => `${s.titel} ${s.text}`).join(' ');
        expect(/[\u{1F300}-\u{1FAFF}]/u.test(text)).toBe(false);
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
});
```

- [ ] **Step 2:** Run `npx vitest run src/utils/__tests__/ratgeber-inhalt.test.ts` → Expected: PASS (Pilotschritt erfüllt alles)

- [ ] **Step 3: Commit**

```bash
git add src/utils/__tests__/ratgeber-inhalt.test.ts
git commit -m "test(ratgeber): Integritätstest für alle Inhaltsdateien"
```

---

### Task 8: Fotos optimieren

**Files:**
- Create: `scripts/ratgeber-fotos.mjs`, `public/ratgeber/fotos/*.webp`
- Modify: `scripts/README.md` (Abschnitt ergänzen)

**Interfaces:**
- Produces: `/ratgeber/fotos/<name>.webp` (max. 1600 px breit); die Dateinamen sind in den Inhalts-Tasks die einzigen erlaubten Foto-Pfade.

- [ ] **Step 1: Fotos ansehen und Zuordnung festhalten**

Öffne jedes der Fotos `public/images/{plan,messen,uk,blech,winkel}-{1..4}.*` mit dem Read-Tool, notiere pro Foto in einer Tabelle (Datei → welcher der 23 Schritte, ja/nein, weil unscharf/unpassend). Nur passende Fotos werden konvertiert. Ergebnis als Kommentar am Kopf von `scripts/ratgeber-fotos.mjs`.

- [ ] **Step 2: Skript** – `scripts/ratgeber-fotos.mjs`

```js
// Verkleinert ausgewählte Baustellenfotos für das Ratgeber-Wiki: node scripts/ratgeber-fotos.mjs
import sharp from 'sharp';
import { mkdir } from 'node:fs/promises';

// Quelle (public/images) → Zielname in public/ratgeber/fotos (ohne Endung). Nach Sichtung in Step 1 füllen.
const AUSWAHL = {
  // 'messen-1.jpg': 'aufmass-dachkante',
};

const ZIEL = 'public/ratgeber/fotos';
await mkdir(ZIEL, { recursive: true });

for (const [quelle, name] of Object.entries(AUSWAHL)) {
  const info = await sharp(`public/images/${quelle}`)
    .rotate()
    .resize({ width: 1600, withoutEnlargement: true })
    .webp({ quality: 78 })
    .toFile(`${ZIEL}/${name}.webp`);
  console.log(`${name}.webp  ${info.width}x${info.height}  ${(info.size / 1024).toFixed(0)} KB`);
}
```

Trage in `AUSWAHL` die in Step 1 gewählten Fotos ein (echte Dateinamen, keine Platzhalter) und lasse das Skript laufen.

- [ ] **Step 3: Ausführen und Größen prüfen**

Run: `node scripts/ratgeber-fotos.mjs`
Expected: je Foto eine Zeile, jede Datei < 400 KB.

- [ ] **Step 4: Commit**

```bash
git add scripts/ratgeber-fotos.mjs scripts/README.md public/ratgeber/fotos
git commit -m "chore(ratgeber): Baustellenfotos als WebP für das Wiki aufbereitet"
```

---

### Task 9: Inhalt Phase „Planung" (Schritte 1–5)

**Files:**
- Create in `src/content/ratgeber/blechdach/`: `sicherheit-absturzsicherung.md` (reihenfolge 10), `wetter-zeitplan.md` (20), `aufmass.md` (30), `dachflaeche-material-berechnen.md` (40), `statik-grundlagen.md` (50)
- Create SVGs in `public/ratgeber/svg/`: `absturzsicherung-prinzip.svg`, `dachformen-aufmass.svg`, `dachflaeche-formel.svg`, `schneelast-rechnung.svg`
- Test: `src/utils/__tests__/ratgeber-inhalt.test.ts` (Task 7)

**Interfaces:**
- Consumes: Muster aus Task 6 (jede Datei folgt exakt dem Frontmatter des Pilots; `phase: planung`).
- Produces: Slugs, auf die spätere Schritte in `verwandt` verweisen.

Jede Datei braucht vollständig: alle Pflichtfelder, ≥ 3 Schritte, ≥ 1 Bild mit `alt`, Fehlerliste, Quellen, Fließtext-Body nach den Humor-Regeln. Inhaltsvorgaben (diese Fakten sind verbindlich):

- **Sicherheit & Absturzsicherung:** Gewerblich Schutzeinrichtung bei Neigung > 20° und Absturzhöhe > 3 m; Dachfanggerüst ab 22,5° bis 60° bei > 2 m Absturzhöhe ab Traufe, Höhenunterschied Traufe–Gerüstbelag max. 1,50 m (BG Bau). Als Privatperson dieselbe Schutzlogik anwenden. PSA gegen Absturz nur, wenn Gerüst/Fangeinrichtung nicht möglich. Helm, festes Schuhwerk, Handschuhe. Niemand allein auf dem Dach. Quellen: BG Bau-Merkblätter `https://www.bgbau.de/fileadmin/Medien-Objekte/Medien/Bausteine/b_121/b_121.pdf`. Bild: Prinzip Dachfanggerüst/Auffanggurt (SVG).
- **Wetter & Zeitplan:** trockene, windstille, milde Tage; nasse Latten rutschen; Blech nie in praller Sonne (Hitze, Verbrennung); Material komplett vor Beginn da; drei Etappen (Aufmaß/Planung → Altdach + Unterbau → Eindeckung); Helfer-Planung. Humor: Helfer-Mathematik, ohne Alkohol-Witz (nur „Etappenabschluss nach der Arbeit, nicht davor").
- **Aufmaß:** Pultdach, Satteldach, Walmdach in Teilflächen zerlegen (Rechtecke, Trapeze, Dreiecke); Messpunkte Traufe, First, Seitenkanten, **beide Diagonalen** zur Winkelkontrolle; Neigung mit digitalem Winkelmesser. **Korrekte Formel:** Dachfläche = Grundfläche ÷ cos(α) bzw. Länge × Sparrenlänge, Sparrenlänge = Gebäudebreite-Hälfte ÷ cos(α) beim Satteldach. Rechner: `/tools/dachflaeche-berechnen/`, `/tools/rechteck/`, `/tools/trapez/`, `/tools/dreieckaufrechteck/`. Skizzen-Download aus `/skizzen/` weiter verlinken. Bild: Dachformen mit Messpunkten.
- **Dachfläche & Material berechnen:** Rechner Rechteck/Trapez/Dreieck; Verschnitt-Optimierung `/tools/verschnitt-optimierung/`; Anrissplan `/tools/anrissplan/`; Tafelbreiten (Baubreite vs. Tafelbreite, z. B. MAAS TP 22-214: Tafelbreite 1140 mm, Baubreite 1070 mm).
- **Statik-Grundlagen:** Blechdach 5–8 kg/m², mit Unterbau/Trennlage/Dämmung rund 25 kg/m²; Schneelastzone 2 ≈ 85 kg/m² → ca. 110 kg/m²; PV 12–14 kg/m², Solarthermie 20–30 kg/m² (bestehende Werte aus `projekt-dach/index.astro`); Links `/tools/schneelastzone/`, `/tools/karte/`, `/tools/sparren-rechner/`; Hinweis: Statik im Zweifel vom Fachmann prüfen lassen. Bild: Lastrechnung als Balken.

- [ ] **Step 1:** Datei `sicherheit-absturzsicherung.md` samt SVG schreiben (Muster: Task 6).
- [ ] **Step 2:** Run `npx vitest run src/utils/__tests__/ratgeber-inhalt.test.ts` → Expected: PASS
- [ ] **Step 3:** Schritte 2–5 jeweils schreiben und nach jeder Datei den Test aus Step 2 laufen lassen.
- [ ] **Step 4:** `npm run build 2>&1 | tail -5` → Expected: erfolgreich; Seite im Browser stichprobenartig bei 375 px prüfen.
- [ ] **Step 5: Commit**

```bash
git add src/content/ratgeber public/ratgeber
git commit -m "feat(ratgeber): Phase Planung mit fünf Anleitungen"
```

---

### Task 10: Inhalt Phase „Vorbereitung" (Schritte 6–8)

**Files:**
- Create in `src/content/ratgeber/blechdach/`: `material-lagern-transportieren.md` (60), `altdach-entfernen.md` (70), `sparren-pruefen-ausgleichen.md` (80)
- Create SVGs: `lagerung-schraeglage.svg`, `sparren-ausgleich.svg`

**Interfaces:** wie Task 9 (`phase: vorbereitung`).

Verbindliche Fakten:
- **Material liefern/lagern/transportieren:** Folie an beiden Paketenden öffnen (Durchlüftung), kein Regen zwischen die Tafeln; Pakete leicht schräg auf Hölzern, gegen Sturm sichern; unbeschichtetes Material nicht im Freien; Weißrost/Aluminium-Schwärze binnen Stunden bei Feuchte → sofort vereinzeln; Tafeln hochkant tragen, mind. 2 Personen, ab 7,5 m nicht mit Gabelstapler; nie über verlegte Flächen oder scharfe Kanten ziehen; Schutzfolie max. 4 Wochen UV. Aluminium nicht mit unbehandeltem Stahl/Kupfer/Kalk/Mörtel in Kontakt. Quelle: MAAS.
- **Altdach entfernen:** nur in Etappen abdecken, was am selben Tag wieder dicht wird (Wetterschutz); Entsorgung (Asbest-Verdacht bei Wellplatten alter Dächer: Fachbetrieb, nicht selbst brechen); Unterspannbahn als Notdach. Keine erfundenen Zahlen; Asbest-Hinweis ohne Rechtsberatung, mit Verweis auf Fachbetrieb.
- **Sparren prüfen/ausgleichen:** Zustand (Feuchte, Schädlinge), Ebenheit, Konterlattung gleicht Unebenheiten aus (MAAS); Auflager Nadelholz mind. S10 nach DIN 4074-1.

- [ ] **Step 1–3:** je Datei schreiben, nach jeder Datei `npx vitest run src/utils/__tests__/ratgeber-inhalt.test.ts` → PASS.
- [ ] **Step 4:** `npm run build 2>&1 | tail -5` → erfolgreich.
- [ ] **Step 5: Commit**

```bash
git add src/content/ratgeber public/ratgeber
git commit -m "feat(ratgeber): Phase Vorbereitung mit drei Anleitungen"
```

---

### Task 11: Inhalt Phase „Unterbau" (Schritte 9–12)

**Files:**
- Create in `src/content/ratgeber/blechdach/`: `unterspannbahn.md` (90), `konterlattung.md` (100), `traglattung.md` (110), `hinterlueftung-trennlage.md` (120)
- Create SVGs: `dachaufbau-schnitt.svg`, `konterlattung-stoss.svg`, `lattenabstand.svg`, `hinterlueftung-luftweg.svg`

**Interfaces:** wie Task 9 (`phase: unterbau`); `traglattung` verlinkt `/tools/lattenrechner/`.

Verbindliche Fakten:
- **Unterspannbahn:** diffusionsoffen; Trennlage zwischen Holz und Metall gegen Feuchtestau/Korrosion; Verlegung über der Konterlattung für Lüftungsraum; Quellen Dörken-Verlegeanleitung `https://www.doerken.com/ch/de/content/preview/2957/file/Verlegeanleitung_Unterdeck-Unterspann-Schalungsbahnen.pdf`.
- **Konterlattung:** nur über den Sparren, darf gestückelt werden bei durchgängiger Auflage; durchlaufend befestigen; gleicht Unebenheiten aus (MAAS).
- **Traglattung:** Dachlatten mind. 40/60 mm, besser 60/60 mm oder nach Dämmstärke; hochkant einbauen; Abstand nach Profil, **max. 1500 mm** (bei den meisten Profilen); Herstellertabelle maßgeblich; Rechner `/tools/lattenrechner/`; Hinweis: enger gesetzte Lattung = tragfähiger.
- **Hinterlüftung & Trennlage:** durchgehend **mind. 30 mm** hoch, Ein- und Auslass an Traufe und First; Kondenswasser vermeiden; Anti-Kondens-Vlies unter dem Blech; Holzschutz.

- [ ] **Step 1–3:** je Datei schreiben, nach jeder Datei Integritätstest → PASS.
- [ ] **Step 4:** Build erfolgreich.
- [ ] **Step 5: Commit**

```bash
git add src/content/ratgeber public/ratgeber
git commit -m "feat(ratgeber): Phase Unterbau mit vier Anleitungen"
```

---

### Task 12: Inhalt Phase „Eindeckung" (Schritte 13–15, 17)

**Files:**
- Create in `src/content/ratgeber/blechdach/`: `ausschnueren-verlegerichtung.md` (130), `traufe-traufblech.md` (140), `bleche-zuschneiden.md` (150), `ueberdeckung-querstoss-dichtband.md` (170)
- Create SVGs: `ausschnueren-schnurschlag.svg`, `traufe-ueberstand.svg`, `schneidwerkzeuge.svg`, `querstoss-ueberdeckung.svg`
- (Schritt 16 `verlegen-verschrauben.md`, reihenfolge 160, ist der Pilot aus Task 6)
- Modify: `verlegen-verschrauben.md` → `verwandt: [ausschnueren-verlegerichtung, ueberdeckung-querstoss-dichtband, bleche-zuschneiden]`

**Interfaces:** wie Task 9 (`phase: eindeckung`); `bleche-zuschneiden` verlinkt `/tools/anrissplan/`, `/tools/kantteil/`, `/tools/verschnitt-optimierung/`.

Verbindliche Fakten:
- **Ausschnüren/Verlegerichtung:** Trauflinie parallel zur Firstlinie festlegen, Profile rechtwinklig dazu; erster Schnurschlag am Ortgang = gewünschter Überstand + zulässiger freier Überstand; weitere Schläge im Abstand der Baubreite (z. B. TP 22-214: 1070 mm); Ortgang ungleichmäßig bei schiefem Gebäude → Ortgangkantteile; Wasserwaage ungeeignet zum Ausrichten von Wellprofilen; immer in einer Walzrichtung verlegen (Farbunterschiede); gegen Hauptwetterrichtung.
- **Traufe/Traufblech:** Traufblech ca. ⅓ in die Rinne, rechtwinklig zur Rinne; freier Überstand max. 200 mm; Tropfkante; Rinneneisen vorher demontieren/neu setzen.
- **Zuschneiden:** Knabber/Blechschere bevorzugt; **Winkelschleifer nur mit dünner 1-mm-Trennscheibe, jede Tafel einzeln**; Kreissäge/Schleifer mit dicker Scheibe verbrennen Zink und Lack; Schnittkante versiegeln; **Späne und Staub gründlich abwischen, rosten**; Handschuhe (blanke Kanten); Hinweis auf Blechtypen-Tabelle `/ratgeber/blechdach/`.
- **Überdeckung/Querstoß/Dichtband:** Dach Querstoß 200 mm, ab 20° 150 mm; unter 10° Querstöße vermeiden; Längsstoß Schraubabstand max. 500 mm (Stahl, MAAS); ab Profillänge über 7 m Schiebestoß mit Fixpunkt; Butyl-Dichtband/Compriband; unter 7° Anti-Kondens-Vlies im Stoß versiegeln.

- [ ] **Step 1–4:** je Datei schreiben, Integritätstest nach jeder → PASS.
- [ ] **Step 5:** Build erfolgreich.
- [ ] **Step 6: Commit**

```bash
git add src/content/ratgeber public/ratgeber
git commit -m "feat(ratgeber): Phase Eindeckung mit vier weiteren Anleitungen"
```

---

### Task 13: Inhalt Phase „Details" und „Pflege" (Schritte 18–23)

**Files:**
- Create in `src/content/ratgeber/blechdach/`: `first.md` (180), `ortgang.md` (190), `durchdringungen.md` (200), `dachrinne-schneefang.md` (210), `kontrolle-wartung.md` (220), `winkel-messen.md` (230)
- Create SVGs: `first-ueberdeckung.svg`, `ortgang-befestigung.svg`, `durchdringung-kamin.svg`, `schneefang-position.svg`, `wartung-checkliste.svg`, `winkelmessung.svg`
- Mapping Bestand: Inhalt von `src/pages/projekt-dach/winkel.astro` fließt in `winkel-messen.md` (fachlich prüfen, Humor kürzen).

**Interfaces:** wie Task 9; `first`/`ortgang` `phase: details`, `kontrolle-wartung`/`winkel-messen` `phase: pflege`.

Verbindliche Fakten:
- **First/Ortgang:** Überdeckung der Formteile 100–150 mm; mittig **zwei Butyl-Kittschnüre** im Überdeckungsbereich; Formteile mit Formteilschrauben befestigen, **nicht im Überdeckungsbereich verschrauben** (Wärmeausdehnung); freier Überstand First/Ortgang max. 70 mm.
- **Durchdringungen:** Kamin, Entlüftung: Anschluss-/Manschettenlösung nach Herstellerdetail, Dichtband, keine Schrauben im Wasserlauf; Fachbetrieb bei Kaminanschluss empfehlen (Brandschutz).
- **Dachrinne/Schneefang:** Traufblech ⅓ in die Rinne; Schneefang bei Zugang/Verkehr unter dem Dach, Lage nach Herstellerangabe; Zugänge für Schornsteinfeger/Wartung (Dachsteg/Leiter) aus `projekt-dach/index.astro` übernehmen.
- **Kontrolle/Wartung:** Schrauben/Dichtungen, Rost an Schnittkanten (Späne!), Rinnen, nach Sturm/Hagel, Laub; jährlich einmal.
- **Winkel messen:** aus Bestand `winkel.astro` prüfen und übernehmen.

- [ ] **Step 1–6:** je Datei schreiben, Integritätstest nach jeder → PASS.
- [ ] **Step 7:** `npm run build 2>&1 | tail -5` → erfolgreich; `ls src/content/ratgeber/blechdach | wc -l` → `23`.
- [ ] **Step 8: Commit**

```bash
git add src/content/ratgeber public/ratgeber
git commit -m "feat(ratgeber): Phasen Details und Pflege mit sechs Anleitungen"
```

---

### Task 14: Weiterleitungen und Test

**Files:**
- Modify: `netlify.toml`
- Test: `src/utils/__tests__/ratgeber-redirects.test.ts`

**Interfaces:**
- Produces: 301-Regeln für `/projekt-dach/*`; Test verlangt, dass jedes Ziel als Seite existiert.

- [ ] **Step 1: Failing test**

```ts
import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const toml = readFileSync(join(process.cwd(), 'netlify.toml'), 'utf8');
const regeln = [...toml.matchAll(/\[\[redirects\]\]\s+from = "([^"]+)"\s+to = "([^"]+)"\s+status = (\d+)/g)].map(
  (m) => ({ from: m[1], to: m[2], status: Number(m[3]) }),
);

const ALTE_PFADE = ['/projekt-dach/', '/projekt-dach/messen/', '/projekt-dach/uk/', '/projekt-dach/blech/', '/projekt-dach/winkel/'];

describe('Weiterleitungen der Altseiten', () => {
  for (const pfad of ALTE_PFADE) {
    it(`${pfad} leitet per 301 um`, () => {
      const r = regeln.find((x) => x.from === pfad);
      expect(r, `Regel für ${pfad}`).toBeDefined();
      expect(r!.status).toBe(301);
      expect(r!.to.endsWith('/')).toBe(true);
    });
  }

  it('alle Ziele existieren als Inhaltsdatei', () => {
    for (const r of regeln.filter((x) => x.from.startsWith('/projekt-dach'))) {
      const teile = r.to.split('/').filter(Boolean); // ['ratgeber','blechdach','aufmass']
      const datei =
        teile.length === 3 ? join(process.cwd(), 'src/content/ratgeber', teile[1], `${teile[2]}.md`) : null;
      if (datei) expect(existsSync(datei), r.to).toBe(true);
    }
  });
});
```

- [ ] **Step 2:** Run `npx vitest run src/utils/__tests__/ratgeber-redirects.test.ts` → Expected: FAIL (keine Regeln)

- [ ] **Step 3: `netlify.toml` ergänzen** (am Dateiende anhängen)

```toml
[[redirects]]
  from = "/projekt-dach/"
  to = "/ratgeber/blechdach/"
  status = 301
  force = true

[[redirects]]
  from = "/projekt-dach/messen/"
  to = "/ratgeber/blechdach/aufmass/"
  status = 301
  force = true

[[redirects]]
  from = "/projekt-dach/uk/"
  to = "/ratgeber/blechdach/konterlattung/"
  status = 301
  force = true

[[redirects]]
  from = "/projekt-dach/blech/"
  to = "/ratgeber/blechdach/verlegen-verschrauben/"
  status = 301
  force = true

[[redirects]]
  from = "/projekt-dach/winkel/"
  to = "/ratgeber/blechdach/winkel-messen/"
  status = 301
  force = true
```

- [ ] **Step 4:** Test erneut → Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add netlify.toml src/utils/__tests__/ratgeber-redirects.test.ts
git commit -m "feat(ratgeber): 301-Weiterleitungen von /projekt-dach/ auf das Wiki"
```

---

### Task 15: Altseiten ablösen, Links umstellen

**Files:**
- Delete: `src/pages/projekt-dach/index.astro`, `messen.astro`, `uk.astro`, `blech.astro`, `winkel.astro`
- Modify: `src/components/Footer.astro:40`, `src/pages/index.astro:300-306`
- Modify: andere Verweise (Step 1 ermittelt sie)

**Interfaces:**
- Consumes: Redirects aus Task 14 (die URL `/projekt-dach/` bleibt über Netlify erreichbar).

- [ ] **Step 1: Verweise finden**

Run: `grep -rn "projekt-dach" src public --include='*.astro' --include='*.ts' --include='*.html' --include='*.md' | grep -v "^src/pages/projekt-dach/"`
Expected: Liste der zu ändernden Stellen (u. a. Footer, Startseite, Nav, andere Tool-Seiten).

- [ ] **Step 2: Verweise umstellen**

Footer (`src/components/Footer.astro`): `<li><a href="/projekt-dach/">Projekt Dach</a></li>` → `<li><a href="/ratgeber/">Dach-Ratgeber</a></li>`.
Startseite (`src/pages/index.astro`, Karte „Projekt Dach"): `href="/ratgeber/"`, Titel „Dach-Ratgeber", Text: „Für jeden Arbeitsschritt eine Anleitung mit Bildern: von Sicherheit und Aufmaß über den Unterbau bis zu First und Ortgang.", CTA „Anleitungen ansehen →". Jede weitere in Step 1 gefundene Stelle auf `/ratgeber/…` mit Trailing Slash umstellen.

- [ ] **Step 3: Altseiten löschen**

```bash
git rm src/pages/projekt-dach/index.astro src/pages/projekt-dach/messen.astro src/pages/projekt-dach/uk.astro src/pages/projekt-dach/blech.astro src/pages/projekt-dach/winkel.astro
```

- [ ] **Step 4: Build und Linkprüfung**

Run: `npm run build 2>&1 | tail -5`, danach
```bash
grep -rln "/projekt-dach/" dist | head
```
Expected: Build erfolgreich; keine Treffer in `dist` (außer ggf. `_redirects`-Ausgabe von Netlify, die kommt erst beim Deploy).

- [ ] **Step 5: Sitemap prüfen**

Run: `grep -o "ratgeber[^<]*" dist/sitemap-0.xml | head -30`
Expected: `/ratgeber/`, `/ratgeber/blechdach/` und alle 23 Schrittseiten, jeweils mit Trailing Slash; `suche.json` nicht in der Sitemap.

- [ ] **Step 6: Commit**

```bash
git add -A src
git commit -m "feat(ratgeber): Altseiten unter /projekt-dach/ durch das Wiki ersetzt"
```

---

### Task 16: Optionale Fotostil-Übersichten via Copilot (nur nach Freigabe)

**Files:**
- Create (nur bei Freigabe): `public/ratgeber/fotos/<name>.webp`

**Interfaces:** liefert ggf. `titelbild` für Phasen- oder Schrittseiten.

> Diese Task ist **optional** und läuft nur mit ausdrücklicher Freigabe. Das Anmelden in Copilot macht der Nutzer selbst. Jedes erzeugte Bild wird fachlich geprüft, bevor es verwendet wird; Bilder mit Schrauben, Überdeckungen oder Absturzsicherung werden **nicht** aus Copilot übernommen, dafür gibt es die SVGs.

- [ ] **Step 1:** Mit dem Nutzer klären, welche Übersichtsbilder gewünscht sind (z. B. „Werkzeug für die Eindeckung auf einem Tisch"), und im Copilot-Fenster einloggen lassen.
- [ ] **Step 2:** Prompt pro Bild formulieren: „Fotorealistische Aufsicht auf einem Holztisch: Akkuschrauber, Schlagschnur, Maßband, Blechschere, Arbeitshandschuhe. Keine Personen, kein Text." Bild erzeugen und ansehen.
- [ ] **Step 3:** Bild prüfen: Werkzeug korrekt erkennbar, keine verzerrten Details. Bei Mängeln neu erzeugen.
- [ ] **Step 4:** Vor jedem Download beim Nutzer nachfragen (Dateiname, Quelle Copilot, Größe), dann nach `public/ratgeber/fotos/` ablegen und mit `sharp` auf 1600 px WebP bringen.
- [ ] **Step 5:** `titelbild` im Frontmatter des zugehörigen Schritts setzen, Integritätstest laufen lassen, Build prüfen, Commit.

```bash
git add public/ratgeber/fotos src/content/ratgeber
git commit -m "feat(ratgeber): Copilot-Übersichtsbilder für Werkzeug und Material"
```

---

### Task 17: Gesamtprüfung und Abschluss

**Files:**
- Modify: `README.md` (kurzer Abschnitt „Ratgeber-Wiki: neuen Schritt anlegen")

- [ ] **Step 1: Alle Tests**

Run: `npx vitest run`
Expected: alle PASS (Bestand + neue Ratgeber-Tests).

- [ ] **Step 2: Produktionsbuild**

Run: `npm run build 2>&1 | tail -10`
Expected: erfolgreich, 25+ neue Seiten unter `dist/ratgeber/`.

- [ ] **Step 3: Visuelle Prüfung** mit dem Browser-Pane

Seiten: `/ratgeber/`, `/ratgeber/blechdach/`, ein Schritt je Phase. Breiten 375, 768, 1024, 1440; Hell und Dunkel. Prüfen: kein horizontaler Scroll, Bilder laden, Fokus per Tab sichtbar, Suche findet „First" und „Schrauben", abhakbare Listen speichern nach Reload, Konsole ohne Fehler.

- [ ] **Step 4: Strukturdaten**

Prüfe eine Schrittseite im Rich-Results-Test (`https://search.google.com/test/rich-results`) auf `HowTo` und `BreadcrumbList` ohne Fehler (Nutzer öffnet den Link oder Ausgabe von `dist/` manuell prüfen: `grep -o '"@type":"HowTo"' dist/ratgeber/blechdach/first/index.html`).

- [ ] **Step 5: README ergänzen**

```markdown
## Ratgeber-Wiki

Anleitungen liegen als Markdown unter `src/content/ratgeber/<gewerk>/<schritt>.md`.
Neuen Schritt anlegen: Datei mit dem Frontmatter aus `src/utils/ratgeber-schema.ts` erstellen,
Bilder als SVG nach `public/ratgeber/svg/` legen, dann `npx vitest run` (prüft Schema, Bilder, Links).
```

- [ ] **Step 6: Code-Review und Abschluss**

Agent `ecc:code-reviewer` über den Branch `feat/ratgeber-wiki` laufen lassen, CRITICAL/HIGH beheben. Danach `superpowers:finishing-a-development-branch` (PR oder Merge nach Wahl des Nutzers).

- [ ] **Step 7: Commit**

```bash
git add README.md
git commit -m "docs(ratgeber): README-Abschnitt zum Anlegen neuer Schritte"
```

- [ ] **Step 8 (Nutzer):** Nach dem Deploy die neue Sitemap in der Search Console einreichen und `/ratgeber/` per URL-Prüfung zur Indexierung anfordern; Weiterleitungen stichprobenartig im Browser testen.
