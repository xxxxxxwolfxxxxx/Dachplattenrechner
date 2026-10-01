// Richtwerte für das Eigengewicht von Dacheindeckungen inkl. Lattung bzw. Schalung.
// Einheit: kN/m² Dachfläche (1 kN/m² ≈ 100 kg/m²). Maßgebend sind immer die Herstellerangaben.

export interface Eindeckung {
  id: string;
  label: string;
  /** Rechenwert für den Sparren-Rechner in kN/m² */
  gewicht: number;
  /** Typische Spanne in kN/m² */
  von: number;
  bis: number;
  /** Was im Wert enthalten ist */
  aufbau: string;
}

export const EINDECKUNGEN: Eindeckung[] = [
  { id: 'trapezblech', label: 'Trapezblech / Wellblech (Stahl, Alu)', gewicht: 0.1, von: 0.05, bis: 0.12, aufbau: 'Blech 0,5–0,75 mm, Befestigung' },
  { id: 'sandwich', label: 'Sandwichpaneel (PUR/PIR 40–100 mm)', gewicht: 0.15, von: 0.1, bis: 0.2, aufbau: 'Paneel inkl. Befestigung' },
  { id: 'bitumenwellplatte', label: 'Bitumenwellplatte', gewicht: 0.15, von: 0.07, bis: 0.15, aufbau: 'Platte inkl. Lattung' },
  { id: 'faserzement', label: 'Faserzement-Wellplatte', gewicht: 0.25, von: 0.18, bis: 0.25, aufbau: 'Platte inkl. Lattung' },
  { id: 'dachziegel', label: 'Tondachziegel', gewicht: 0.55, von: 0.4, bis: 0.55, aufbau: 'Ziegel, Dachlatten, Konterlattung' },
  { id: 'betondachstein', label: 'Betondachstein', gewicht: 0.6, von: 0.5, bis: 0.6, aufbau: 'Stein, Dachlatten, Konterlattung' },
  { id: 'schiefer', label: 'Naturschiefer', gewicht: 0.6, von: 0.45, bis: 0.65, aufbau: 'Schiefer, Schalung, Unterdeckung' },
  { id: 'gruendach', label: 'Extensives Gründach (wassergesättigt)', gewicht: 1.2, von: 0.8, bis: 1.5, aufbau: 'Substrat, Drainage, Vegetation' },
];
