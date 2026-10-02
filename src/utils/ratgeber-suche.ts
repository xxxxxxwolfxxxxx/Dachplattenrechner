// Ohne Zod-Import, damit das Such-Skript im Client-Bundle schlank bleibt.
export type SuchEintrag = { titel: string; beschreibung: string; phase: string; url: string; text: string };

export function suche(index: SuchEintrag[], anfrage: string): SuchEintrag[] {
  const woerter = anfrage.toLowerCase().split(/\s+/).filter(Boolean);
  if (woerter.length === 0) return [];
  const gewicht = (titel: string): number => {
    const t = titel.toLowerCase();
    const treffer = woerter.filter((w) => t.includes(w)).length;
    return treffer === woerter.length ? 2 : treffer > 0 ? 1 : 0;
  };
  return index
    .filter((x) => {
      const heu = `${x.titel} ${x.beschreibung} ${x.text}`.toLowerCase();
      return woerter.every((w) => heu.includes(w));
    })
    .map((x, i) => ({ x, i, g: gewicht(x.titel) }))
    .sort((a, b) => b.g - a.g || a.i - b.i)
    .map((r) => r.x);
}
