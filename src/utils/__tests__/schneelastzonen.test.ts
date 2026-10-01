import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { sucheOrt, normalisiere, gruppiereNachZone, windzone, kartenZone, kartenTreffer, gemeindeKartenTreffer, istPlz, sucheNachPlz, findeHoehe, type Datensatz, type HoehenDatensatz, type PlzDatensatz, type Treffer } from '../schneelastzonen';

const datei = fileURLToPath(new URL('../../../public/data/schneelastzonen.json', import.meta.url));
const daten: Datensatz = JSON.parse(readFileSync(datei, 'utf-8'));

const finde = (eingabe: string, kreis?: string) =>
  sucheOrt(daten, eingabe).filter((t) => !kreis || t.kreis === kreis);

describe('normalisiere', () => {
  it('faltet Umlaute und Satzzeichen', () => {
    expect(normalisiere('München')).toBe('muenchen');
    expect(normalisiere('Muenchen')).toBe('muenchen');
    expect(normalisiere('Bad-Wörishofen (Stadt)')).toBe('bad woerishofen stadt');
  });
});

describe('Datenbestand', () => {
  it('enthält alle 16 Bundesländer und nur gültige Zonen', () => {
    const laender = new Set(daten.zeilen.map((z) => z[0]));
    expect(laender.size).toBe(16);
    const gueltig = new Set(['1', '1a', '2', '2a', '3', '3a', '>3', '>3a']);
    expect(daten.zeilen.filter((z) => !gueltig.has(z[3]))).toEqual([]);
  });

  it('hat keine doppelten Gemeinden mit widersprüchlicher Zone', () => {
    const gesehen = new Map<string, string>();
    for (const [land, kreis, gemeinde, zone] of daten.zeilen) {
      const key = `${land}|${kreis}|${gemeinde}`;
      expect(gesehen.get(key) ?? zone, key).toBe(zone);
      gesehen.set(key, zone);
    }
  });
});

describe('sucheOrt', () => {
  it('findet eine Gemeinde mit Zone (Bayern)', () => {
    const t = finde('Garmisch-Partenkirchen').find((x) => x.art === 'gemeinde');
    expect(t?.zone).toBe('2a');
    expect(t?.land).toBe('BY');
  });

  it('findet Orte unabhängig von Umlaut-Schreibweise', () => {
    const t = finde('Muenchen').find((x) => x.art === 'gemeinde' && x.land === 'BY');
    expect(t?.zone).toBe('1a');
  });

  it('liefert Ausnahmegemeinden eines Landkreises mit abweichender Zone', () => {
    const t = finde('Essingen', 'Ostalbkreis')[0];
    expect(t.zone).toBe('2a');
  });

  it('liefert für einen Landkreis Standardzone und Ausnahmen (Ostalbkreis)', () => {
    const t = finde('Ostalbkreis').find((x) => x.art === 'kreis');
    expect(t?.zone).toBe('2');
    expect(t?.gemeinden.map((g) => g.name)).toEqual(['Essingen', 'Heubach']);
  });

  it('liefert für Landkreise ohne Standardzone mehrere Zonen (Bergstraße)', () => {
    const t = finde('Bergstraße').find((x) => x.art === 'kreis');
    expect(t?.zone).toBeNull();
    expect(t?.zonen).toEqual(['1', '2']);
  });

  it('trennt kreisfreie Stadt und gleichnamigen Landkreis (Rostock)', () => {
    const stadt = finde('Rostock').find((x) => x.art === 'gemeinde' && x.name === 'Rostock');
    const kreis = finde('Rostock').find((x) => x.art === 'kreis' && x.kreis === 'Landkreis Rostock');
    expect(stadt?.zone).toBe('3');
    expect(kreis?.zone).toBe('2');
  });

  it('weist Harz-Ortsteile mit Zone >3 aus', () => {
    const t = finde('Torfhaus')[0];
    expect(t.zone).toBe('>3');
    expect(t.hinweise.join(' ')).toContain('5,5');
  });

  it('übernimmt den Tiefland-Hinweis aus dem Landkreis', () => {
    const t = finde('Pinneberg').find((x) => x.art === 'kreis');
    expect(t?.hinweise.join(' ')).toContain('Norddeutsches Tiefland');
  });

  it('antwortet auf zu kurze Eingaben und Unsinn mit leerer Liste', () => {
    expect(finde('a')).toEqual([]);
    expect(finde('xyzxyzxyz')).toEqual([]);
  });

  it('sortiert exakte Treffer vor Teiltreffern', () => {
    const treffer = finde('Hof');
    expect(treffer[0].name.toLowerCase().startsWith('hof')).toBe(true);
  });
});

describe('gruppiereNachZone', () => {
  it('gruppiert aufsteigend nach Zone', () => {
    const g = gruppiereNachZone([
      { name: 'B', zone: '2a' },
      { name: 'A', zone: '1' },
      { name: 'C', zone: '2a' },
    ]);
    expect(g).toEqual([
      { zone: '1', namen: ['A'] },
      { zone: '2a', namen: ['B', 'C'] },
    ]);
  });
});

describe('windzone', () => {
  const winddatei = fileURLToPath(new URL('../../../public/data/windzonen.json', import.meta.url));
  const wind: Datensatz = JSON.parse(readFileSync(winddatei, 'utf-8'));
  const zoneVon = (eingabe: string, art: 'gemeinde' | 'kreis' = 'gemeinde') => {
    const t = sucheOrt(daten, eingabe).find((x) => x.art === art);
    return t ? windzone(wind, t) : null;
  };

  it('liefert für jeden Landkreis der Schneedaten eine Windzone', () => {
    const kreise = new Set(daten.zeilen.map((z) => `${z[0]}|${z[1]}`));
    const ohne: string[] = [];
    for (const key of kreise) {
      const [land, kreis] = key.split('|');
      const t = { art: 'kreis', land, kreis, name: kreis, zone: null, zonen: [], hinweise: [], gemeinden: [] } as Treffer;
      if (!windzone(wind, t)) ohne.push(key);
    }
    expect(ohne).toEqual([]);
  });

  it('nutzt die Standardzone des Bundeslandes (Hessen)', () => {
    expect(zoneVon('Frankfurt am Main')?.zone).toBe('1');
  });

  it('ordnet Moselgemeinden nach der Lage zum Fluss (Windzone 1 rechts, 2 links)', () => {
    const gemeinde = (kreis: string, name: string) =>
      windzone(wind, { art: 'gemeinde', land: 'RP', kreis, name, zone: null, zonen: [], hinweise: [], gemeinden: [] } as Treffer);
    expect(gemeinde('Bernkastel-Wittlich', 'Traben-Trarbach')?.zone).toBe('1'); // überwiegend rechts der Mosel
    expect(gemeinde('Cochem-Zell', 'Cochem')?.zone).toBe('2'); // überwiegend links der Mosel
    expect(gemeinde('Cochem-Zell', 'Cochem')?.hinweis).toContain('rechts davon');
    expect(gemeinde('Cochem-Zell', 'Ulmen')?.zone).toBe('2'); // Eifel, weit links der Mosel
  });

  it('kennt die Windzone 4 an der Küste (Emden)', () => {
    expect(zoneVon('Emden')?.zone).toBe('4');
  });

  it('bevorzugt eine Gemeinde-Ausnahme vor der Landkreisregel (Füssen im Ostallgäu)', () => {
    expect(zoneVon('Füssen')?.zone).toBe('1');
  });

  it('wendet die Landkreisregel auf übrige Gemeinden an (Kaufbeuren-Land, Ostallgäu)', () => {
    expect(zoneVon('Marktoberdorf')?.zone).toBe('2');
  });

  it('liest Nordrhein-Westfalen je Gemeinde (Köln 1, Bonn 2)', () => {
    expect(zoneVon('Köln')?.zone).toBe('1');
    expect(zoneVon('Bonn')?.zone).toBe('2');
  });

  it('weist Landkreise ohne Standardzone mit mehreren Zonen aus (Rhein-Sieg-Kreis)', () => {
    const w = zoneVon('Rhein-Sieg-Kreis', 'kreis');
    expect(w?.zone).toBeNull();
    expect(w?.zonen).toEqual(['1', '2']);
  });

  it('übernimmt Hinweise der Quelle (Mayen-Koblenz: rechts von Mosel und Rhein)', () => {
    expect(zoneVon('Mayen-Koblenz', 'kreis')?.hinweis).toContain('Mosel');
  });
});

describe('Landkreis-Karte', () => {
  const wind: Datensatz = JSON.parse(readFileSync(fileURLToPath(new URL('../../../public/data/windzonen.json', import.meta.url)), 'utf-8'));
  const karte = JSON.parse(readFileSync(fileURLToPath(new URL('../../../public/data/kreiskarte.json', import.meta.url)), 'utf-8'));

  it('färbt Landkreis mit Standardzone und Ausnahmen als gemischt (Ostalbkreis)', () => {
    expect(kartenZone(daten, 'BW', 'Ostalbkreis', false)).toEqual({ haupt: '2', alle: ['2', '2a'], gemischt: true });
  });

  it('trennt kreisfreie Stadt und Landkreis gleichen Namens (München)', () => {
    expect(kartenZone(daten, 'BY', 'München', true)).toEqual({ haupt: '1a', alle: ['1a'], gemischt: false });
    expect(kartenZone(daten, 'BY', 'München', false).alle).toEqual(['1a', '2']);
  });

  it('nimmt die häufigste Gemeindezone, wenn keine Standardzone existiert (Bergstraße)', () => {
    const z = kartenZone(daten, 'HE', 'Bergstraße', false);
    expect(z.gemischt).toBe(true);
    expect(['1', '2']).toContain(z.haupt);
  });

  it('greift bei Windzonen auf den Landesstandard zurück (Hessen) und kennt die Küste (Aurich)', () => {
    expect(kartenZone(wind, 'HE', 'Kassel', false).haupt).toBe('1');
    expect(kartenZone(wind, 'NI', 'Aurich', false).haupt).toBe('4');
  });

  it('liefert Treffer für Klicks auf Stadt und Landkreis', () => {
    expect(kartenTreffer(daten, 'BY', 'München', true)?.art).toBe('gemeinde');
    expect(kartenTreffer(daten, 'BY', 'München', false)?.art).toBe('kreis');
  });

  it('verknüpft jede Kartenfläche außer Ulm mit einem Landkreis der Schneedaten', () => {
    const schluessel = new Set(daten.zeilen.map((z) => `${z[0]}|${z[1]}`));
    const lose = karte.kreise.filter((k: { land: string; k: string | null }) => !k.k || !schluessel.has(`${k.land}|${k.k}`));
    expect(lose.map((k: { name: string }) => k.name)).toEqual(['Ulm']);
  });
});

describe('Kreisweite Zeilen ("alle außer …")', () => {
  it('speichert "alle" nicht als Gemeindename', () => {
    expect(daten.zeilen.filter((z) => z[2] && /^alle(\s|,|;|$)/i.test(z[2]))).toEqual([]);
  });

  it('übernimmt Standardzone und Ausnahmen (Straubing-Bogen: 2, Geiselhöring 1a)', () => {
    const kreis = daten.zeilen.filter((z) => z[0] === 'BY' && z[1] === 'Straubing-Bogen');
    expect(kreis.find((z) => z[2] === null)?.[3]).toBe('2');
    expect(kreis.find((z) => z[2] === 'Geiselhöring')?.[3]).toBe('1a');
  });

  it('übernimmt "bis auf" in Nordrhein-Westfalen (Siegen-Wittgenstein: 2a, Bad Berleburg 3)', () => {
    const kreis = daten.zeilen.filter((z) => z[0] === 'NW' && z[1] === 'Siegen-Wittgenstein');
    expect(kreis.find((z) => z[2] === null)?.[3]).toBe('2a');
    expect(kreis.find((z) => z[2] === 'Bad Berleburg')?.[3]).toBe('3');
  });
});

describe('Gemeinde-Karte', () => {
  const gem = JSON.parse(readFileSync(fileURLToPath(new URL('../../../public/data/gemeindekarte.json', import.meta.url)), 'utf-8'));
  const karte = JSON.parse(readFileSync(fileURLToPath(new URL('../../../public/data/kreiskarte.json', import.meta.url)), 'utf-8'));
  const kreisAgs = new Set(karte.kreise.map((k: { ags: string }) => k.ags));
  const gueltig = new Set(['1', '1a', '2', '2a', '3', '3a', '>3', '>3a', '4']);

  it('ordnet jede Gemeinde einem Landkreis der Kreiskarte zu, der als ersetzt markiert ist', () => {
    const ersetzt = new Set(gem.kreise);
    for (const g of gem.gemeinden) {
      expect(kreisAgs.has(g[2]), g[1]).toBe(true);
      expect(ersetzt.has(g[2]), g[1]).toBe(true);
    }
  });

  it('enthält nur gültige Zonen und Pfade', () => {
    for (const [ags, name, , zs, zw, d] of gem.gemeinden) {
      expect(zs === null || gueltig.has(zs), `${name} ${ags}`).toBe(true);
      expect(zw === null || gueltig.has(zw), `${name} ${ags}`).toBe(true);
      expect(d.startsWith('M'), name).toBe(true);
    }
  });

  it('lässt nur wenige Gemeinden ohne Schneezone (neu gebildete Gemeinden)', () => {
    const ohne = gem.gemeinden.filter((g: unknown[]) => g[3] === null).length;
    expect(ohne / gem.gemeinden.length).toBeLessThan(0.005);
  });

  it('liefert für einen Gemeinde-Klick den Treffer mit Kartenzone', () => {
    const t = gemeindeKartenTreffer(daten, 'BY', 'Ostallgäu', 'Füssen', '3');
    expect(t?.zone).toBe('3');
    expect(gemeindeKartenTreffer(daten, 'SN', 'Vogtlandkreis', 'Klingenthal', null)).toBeNull();
  });
});

describe('Amtsgebiete in Mecklenburg-Vorpommern', () => {
  const wind: Datensatz = JSON.parse(readFileSync(fileURLToPath(new URL('../../../public/data/windzonen.json', import.meta.url)), 'utf-8'));

  it('ordnet Gemeinden im Amtsgebiet Lubmin und auf Usedom Zone 3 zu', () => {
    const zeilen = daten.zeilen.filter((z) => z[0] === 'MV' && z[1] === 'Vorpommern-Greifswald');
    for (const name of ['Lubmin', 'Zinnowitz', 'Koserow', 'Heringsdorf']) {
      expect(zeilen.find((z) => z[2] === name)?.[3], name).toBe('3');
    }
    expect(zeilen.find((z) => z[2] === null)?.[3]).toBe('2');
  });

  it('ordnet Gemeinden auf Rügen der Windzone 4 zu, außer Garz/Rügen', () => {
    const zeilen = wind.zeilen.filter((z) => z[0] === 'MV' && z[1] === 'Vorpommern-Rügen');
    expect(zeilen.find((z) => z[2] === 'Insel Hiddensee')?.[3]).toBe('4');
    expect(zeilen.find((z) => z[2] === 'Garz/Rügen')).toBeUndefined();
    expect(zeilen.find((z) => z[2] === null)?.[3]).toBe('3');
  });
});

describe('Namensabgleich Sachsen/Thüringen', () => {
  it('findet sächsische Gemeinden mit sorbischem Doppelnamen unter dem deutschen Namen', () => {
    const t = sucheOrt(daten, 'Großdubrau').find((x) => x.art === 'gemeinde');
    expect(t?.land).toBe('SN');
    expect(['2', '3']).toContain(t?.zone);
  });

  it('leitet Zonen zusammengelegter Gemeinden aus den Vorgängern ab und kennzeichnet sie', () => {
    const z = daten.zeilen.find((r) => r[0] === 'TH' && r[2] === 'Am Ohmberg');
    expect(z?.[3]).toBeTruthy();
    expect(z?.[4]).toContain('Vorgängergemeinden');
  });
});

describe('Postleitzahl', () => {
  const plzDatei = fileURLToPath(new URL('../../../public/data/plz.json', import.meta.url));
  const plz: PlzDatensatz = JSON.parse(readFileSync(plzDatei, 'utf-8'));
  const suche = (eingabe: string) => sucheNachPlz(plz, daten, eingabe);

  it('erkennt nur fünfstellige Zahlen als PLZ', () => {
    expect(istPlz('82467')).toBe(true);
    expect(istPlz(' 01067 ')).toBe(true);
    expect(istPlz('8246')).toBe(false);
    expect(istPlz('München')).toBe(false);
  });

  it('liefert Gemeinde, Schneezone und Windzone (Garmisch-Partenkirchen)', () => {
    const { treffer } = suche('82467');
    expect(treffer).toHaveLength(1);
    expect(treffer[0].treffer.name).toBe('Garmisch-Partenkirchen');
    expect(treffer[0].treffer.zone).toBe('2a');
    expect(treffer[0].windzone).toBe('1');
  });

  it('kennt die Insel Hiddensee mit Windzone 4 (Amtsgebiet)', () => {
    expect(suche('18565').treffer[0].windzone).toBe('4');
  });

  it('liefert für eine unbekannte PLZ nichts', () => {
    expect(suche('00000')).toEqual({ treffer: [], ohneZone: 0 });
  });

  it('deckt fast alle PLZ ab und verweist auf bekannte Landkreise', () => {
    expect(Object.keys(plz.plz).length).toBeGreaterThan(10500);
    const kreise = new Set(daten.zeilen.map((z) => `${z[0]}|${z[1]}`));
    const unbekannt = plz.kreise.filter(([land, kreis]) => !kreise.has(`${land}|${kreis}`));
    expect(unbekannt).toEqual([]);
  });

  it('lässt weniger als 1 % der PLZ ohne Schneelastzone', () => {
    const ohne = Object.keys(plz.plz).filter((p) => suche(p).treffer.length === 0);
    expect(ohne.length / Object.keys(plz.plz).length).toBeLessThan(0.01);
  });
});

describe('Geländehöhe', () => {
  const hoehenDatei = fileURLToPath(new URL('../../../public/data/hoehen.json', import.meta.url));
  const hoehen: HoehenDatensatz = JSON.parse(readFileSync(hoehenDatei, 'utf-8'));

  it('liefert plausible Ortshöhen', () => {
    expect(findeHoehe(hoehen, 'BY', 'Garmisch-Partenkirchen', 'Garmisch-Partenkirchen')).toBeGreaterThan(650);
    expect(findeHoehe(hoehen, 'BY', 'Garmisch-Partenkirchen', 'Garmisch-Partenkirchen')).toBeLessThan(760);
    expect(findeHoehe(hoehen, 'RP', 'Koblenz', 'Koblenz')).toBeLessThan(120);
  });

  it('findet Gemeinden auch bei abweichender Schreibung (Zusätze in Klammern oder nach dem Komma)', () => {
    const h: HoehenDatensatz = { stand: '', quelle: '', h: { 'XX|K': { 'Neukirch/Lausitz': 400, Beispiel: 100 } } };
    expect(findeHoehe(h, 'XX', 'K', 'Beispiel (Vogtland), Stadt')).toBe(100);
    expect(findeHoehe(h, 'XX', 'K', 'Unbekannt')).toBeNull();
  });

  it('deckt den Großteil der Gemeinden der DIBt-Tabelle ab (Bayern und Rheinland-Pfalz fast vollständig)', () => {
    const gemeinden = daten.zeilen.filter((z) => z[2] !== null && z[2] !== z[1]);
    const mit = (land?: string) => {
      const liste = gemeinden.filter((z) => !land || z[0] === land);
      return liste.filter((z) => findeHoehe(hoehen, z[0], z[1], z[2] as string) !== null).length / liste.length;
    };
    expect(mit()).toBeGreaterThan(0.85);
    expect(mit('BY')).toBeGreaterThan(0.95);
    expect(mit('RP')).toBeGreaterThan(0.99);
  });
});
