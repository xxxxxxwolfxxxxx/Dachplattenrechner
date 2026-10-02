import { describe, it, expect } from 'vitest';
import { GEWERKE } from '../ratgeber-schema';
import {
  slugVon, gewerkVon, schrittUrl, sortiere, nachGewerk,
  gruppiereNachPhase, nachbarn, howToSchema, baueSuchindex, GEWERK_TITEL,
  type Eintrag,
} from '../ratgeber';
import { suche, type SuchEintrag } from '../ratgeber-suche';

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

describe('GEWERK_TITEL', () => {
  it('hat für jedes Gewerk einen Titel', () => {
    for (const g of GEWERKE) expect(GEWERK_TITEL[g], g).toBeTruthy();
  });
});

describe('Suche: Gewichtung', () => {
  const eintrag = (titel: string, text: string, beschreibung = 'x'): SuchEintrag => ({
    titel, beschreibung, phase: 'Details', url: `/ratgeber/blechdach/${titel}/`, text,
  });
  const text1 = eintrag('Schrauben setzen', 'der first wird zuletzt gesetzt');
  const titel1 = eintrag('First eindecken', 'firstblech montieren');
  const text2 = eintrag('Wartung', 'first kontrollieren');
  const titel2 = eintrag('First Pflege', 'nichts');

  it('stellt Titel-Treffer vor Text-Treffer', () => {
    const r = suche([text1, titel1], 'first');
    expect(r.map((x) => x.titel)).toEqual(['First eindecken', 'Schrauben setzen']);
  });
  it('bleibt innerhalb gleicher Gewichte stabil', () => {
    const r = suche([text1, titel1, text2, titel2], 'first');
    expect(r.map((x) => x.titel)).toEqual(['First eindecken', 'First Pflege', 'Schrauben setzen', 'Wartung']);
  });
  it('alle Wörter im Titel schlagen ein Wort im Titel', () => {
    const teil = eintrag('First Schrauben', 'dach');
    const voll = eintrag('Dach decken', 'first schrauben');
    const alle = eintrag('Dach First', 'schrauben');
    const r = suche([voll, teil, alle], 'dach first');
    expect(r.map((x) => x.titel)).toEqual(['Dach First', 'Dach decken', 'First Schrauben']);
  });
  it('verändert das Eingabe-Array nicht', () => {
    const eingabe = [text1, titel1];
    suche(eingabe, 'first');
    expect(eingabe).toEqual([text1, titel1]);
  });
  it('leere Anfrage liefert []', () => {
    expect(suche([text1], '')).toEqual([]);
  });
});
