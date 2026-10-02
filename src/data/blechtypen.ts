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
