import type { SuchEintrag } from './ratgeber-suche';
import { PHASEN, type Gewerk, type Phase, type RatgeberDaten } from './ratgeber-schema';

export interface Eintrag {
  id: string;
  data: RatgeberDaten;
}

export const PHASEN_TITEL: Record<Phase, string> = {
  planung: 'Planung',
  vorbereitung: 'Vorbereitung',
  unterbau: 'Unterbau',
  eindeckung: 'Eindeckung',
  details: 'Details',
  pflege: 'Pflege',
};

export const GEWERK_TITEL: Record<Gewerk, string> = {
  blechdach: 'Blechdach',
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
