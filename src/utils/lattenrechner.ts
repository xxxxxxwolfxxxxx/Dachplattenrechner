// ============= TYPEN =============

export interface MaterialItem {
  length: number;
  count: number;
}

export interface RafterSegment {
  start: number;
  end: number;
  length: number;
  originalLength: number;
  isRest: boolean;
}

export interface RafterPlan {
  [rowIndex: number]: RafterSegment[];
}

export interface CalculationResult {
  counterRafters: {
    totalLength: number;
    count: number;
    waste: number;
    materials: MaterialItem[];
  };
  roofRafters: {
    totalLength: number;
    count: number;
    waste: number;
    materials: MaterialItem[];
    plan: RafterPlan;
  };
  roofArea: number;
  rowCount: number;
}

export interface RoofDimensions {
  width: number;
  height: number;
  type: 'rechteck' | 'trapez' | 'dreieck' | 'gleichschenkliges-dreieck' | 'ungleichschenkliges-dreieck' | 'trapez-auf-rechteck';
  upperWidth?: number;
  trapezHeight?: number;
  rectHeight?: number;
  peakPosition?: number;
}

export interface RafterCalcParams {
  roofDims: RoofDimensions;
  rafterCount: number;
  rafterSpacing: number; // in cm
  overhang: number; // in cm
  rowSpacing: number; // in mm
  availableCounters: number[];
  availableRafters: number[];
}

// ============= GLOBALER STATE =============

let sparrenPositionen: number[] = [];
let sparrenLaengen: number[] = [];
let lattenPlan: RafterPlan = {};
let currentRoofDims: RoofDimensions;

// ============= SPARREN-BERECHNUNGEN =============

function berechneSparrenPositionen(
  count: number,
  spacing: number,
  overhang: number
): void {
  sparrenPositionen = [];
  const overhangM = overhang / 100;
  const spacingM = spacing / 100;

  for (let i = 0; i < count; i++) {
    sparrenPositionen.push(overhangM + i * spacingM);
  }
}

function berechneSpitzdachSparren(count: number, dims: RoofDimensions): void {
  sparrenLaengen = [];

  switch (dims.type) {
    case 'rechteck':
      for (let i = 0; i < count; i++) {
        sparrenLaengen.push(dims.height);
      }
      break;

    case 'trapez':
      if (!dims.upperWidth) break;
      const sideDistance = (dims.width - dims.upperWidth) / 2;
      const leftEdge = sideDistance;
      const rightEdge = dims.width - sideDistance;

      for (let i = 0; i < count; i++) {
        const xPos = sparrenPositionen[i];
        let len: number;

        if (xPos <= leftEdge) {
          len = (xPos / leftEdge) * dims.height;
        } else if (xPos >= rightEdge) {
          len = ((dims.width - xPos) / sideDistance) * dims.height;
        } else {
          len = dims.height;
        }
        sparrenLaengen.push(Math.max(0, len));
      }
      break;

    case 'dreieck':
    case 'gleichschenkliges-dreieck':
    case 'ungleichschenkliges-dreieck':
      const halfWidth = dims.width / 2;

      for (let i = 0; i < count; i++) {
        const xPos = sparrenPositionen[i];
        let len: number;

        if (xPos <= halfWidth) {
          len = (xPos / halfWidth) * dims.height;
        } else {
          len = ((dims.width - xPos) / halfWidth) * dims.height;
        }
        sparrenLaengen.push(Math.max(0, len));
      }
      break;

    case 'trapez-auf-rechteck':
      if (!dims.upperWidth || !dims.trapezHeight || !dims.rectHeight) break;
      const sideDistTA = (dims.width - dims.upperWidth) / 2;
      const leftEdgeTA = sideDistTA;
      const rightEdgeTA = dims.width - sideDistTA;

      for (let i = 0; i < count; i++) {
        const xPos = sparrenPositionen[i];
        let len = dims.rectHeight;

        if (xPos <= leftEdgeTA) {
          len += (xPos / leftEdgeTA) * dims.trapezHeight;
        } else if (xPos >= rightEdgeTA) {
          len += ((dims.width - xPos) / sideDistTA) * dims.trapezHeight;
        } else {
          len += dims.trapezHeight;
        }
        sparrenLaengen.push(Math.max(0, len));
      }
      break;

    default:
      for (let i = 0; i < count; i++) {
        sparrenLaengen.push(dims.height);
      }
  }
}

// ============= REIHENBREITE (FORM-SPEZIFISCH) =============

function berechneReihenBreite(progress: number, dims: RoofDimensions): number {
  switch (dims.type) {
    case 'rechteck':
      return dims.width;

    case 'trapez':
      if (!dims.upperWidth) return dims.width;
      return dims.upperWidth + (dims.width - dims.upperWidth) * progress;

    case 'dreieck':
    case 'gleichschenkliges-dreieck':
    case 'ungleichschenkliges-dreieck':
      return dims.width * (1 - progress);

    case 'trapez-auf-rechteck':
      if (!dims.upperWidth || !dims.trapezHeight) return dims.width;
      const trapezRatio = dims.trapezHeight / dims.height;

      if (progress <= trapezRatio) {
        const trapezProgress = progress / trapezRatio;
        return dims.upperWidth + (dims.width - dims.upperWidth) * trapezProgress;
      } else {
        return dims.width;
      }

    default:
      return dims.width;
  }
}

// ============= AUFLAGEPUNKT-VALIDIERUNG =============

function countSupports(
  segment: RafterSegment,
  sparrenPos: number[],
  rowStartAbsolute: number,
  rowWidth: number
): number {
  const segmentStart = rowStartAbsolute + segment.start;
  const segmentEnd = rowStartAbsolute + segment.end;

  return sparrenPos.filter(
    pos => pos >= segmentStart - 0.01 && pos <= segmentEnd + 0.01
  ).length;
}

function isSegmentValid(count: number, isOverhang: boolean): boolean {
  // Strikt für Überstand: min 3
  if (isOverhang) return count >= 3;
  // Normal: min 2
  return count >= 2;
}

// ============= KONTERLATTEN OPTIMIERUNG =============

export function optimiereKonterlatten(
  requiredLength: number,
  availableLengths: number[]
): { materials: MaterialItem[]; totalLength: number; waste: number } {
  if (!availableLengths || availableLengths.length === 0) {
    return { materials: [], totalLength: 0, waste: 0 };
  }

  // Normalisiere auf Zentimeter zur Vermeidung von Floating-Point-Problemen
  const reqLengthCm = Math.round(requiredLength * 100);
  const availableCm = availableLengths.map(l => Math.round(l * 100));
  const maxLength = Math.ceil(reqLengthCm * 1.5);

  // Dynamische Programmierung: Coin Change Problem
  // dp[i] = minimale Anzahl Stücke für Länge i
  const dp = new Array(maxLength + 1).fill(Infinity);
  const parent = new Array(maxLength + 1).fill(-1);

  dp[0] = 0;

  for (let i = 0; i <= maxLength; i++) {
    if (dp[i] === Infinity) continue;

    for (const length of availableCm) {
      const nextIdx = i + length;
      if (nextIdx <= maxLength && dp[i] + 1 < dp[nextIdx]) {
        dp[nextIdx] = dp[i] + 1;
        parent[nextIdx] = length;
      }
    }
  }

  // Finde beste Lösung >= requiredLength mit minimalem Verschnitt
  let bestIdx = reqLengthCm;
  let bestWaste = availableCm[0]; // Worst case: eine Länge
  let bestCount = Infinity;

  for (let i = reqLengthCm; i <= maxLength && i <= reqLengthCm + Math.max(...availableCm); i++) {
    if (dp[i] !== Infinity) {
      const waste = i - reqLengthCm;
      // Bevorzuge weniger Verschnitt, sekundär weniger Stücke
      if (waste < bestWaste || (waste === bestWaste && dp[i] < bestCount)) {
        bestWaste = waste;
        bestIdx = i;
        bestCount = dp[i];
      }
    }
  }

  // Rekonstruiere die Lösung aus dem parent-Array
  const combination: number[] = [];
  let idx = bestIdx;
  while (idx > 0 && parent[idx] !== -1) {
    combination.push(parent[idx]);
    idx -= parent[idx];
  }

  // Zähle die Stücke
  const materials: MaterialItem[] = [];
  for (const length of combination) {
    const lengthM = length / 100;
    const existing = materials.find(m => Math.abs(m.length - lengthM) < 0.001);
    if (existing) {
      existing.count++;
    } else {
      materials.push({ length: lengthM, count: 1 });
    }
  }

  // Sortiere für bessere Lesbarkeit
  materials.sort((a, b) => b.length - a.length);

  return {
    materials,
    totalLength: bestIdx / 100,
    waste: Math.max(0, (bestIdx - reqLengthCm) / 100)
  };
}

// ============= HAUPTALGORITHMUS: DACHLATTEN-VERLEGUNG =============

function berechneDachlattenIntelligent(
  params: RafterCalcParams,
  rowCount: number
): {
  materials: MaterialItem[];
  totalLength: number;
  waste: number;
  plan: RafterPlan;
} {
  const { roofDims } = params;
  const availableLengths = [...params.availableRafters].filter(l => l > 0).sort((a, b) => a - b);

  if (availableLengths.length === 0) {
    return { materials: [], totalLength: 0, waste: 0, plan: {} };
  }

  const materials: MaterialItem[] = [];
  let totalWaste = 0;
  let totalUsed = 0;
  lattenPlan = {};
  const restPool: number[] = [];

  // Verarbeite Reihen von oben nach unten
  for (let row = rowCount - 1; row >= 0; row--) {
    const progress = (rowCount - 1 - row) / Math.max(1, rowCount - 1);
    let rowWidth = berechneReihenBreite(progress, roofDims);
    const rowStartAbsolute = (roofDims.width - rowWidth) / 2;

    const segments: RafterSegment[] = [];
    let filledLength = 0;

    // Versuche, die Reihe mit verfügbaren Latten zu füllen
    // Bevorzuge größere Längen zuerst
    const sortedByLength = [...availableLengths].sort((a, b) => b - a);

    // 1. Versuche, mit einer einzelnen Latte zu füllen
    for (const length of sortedByLength) {
      if (length >= rowWidth - 0.01) {
        // Passt perfekt
        segments.push({
          start: 0,
          end: rowWidth,
          length: rowWidth,
          originalLength: length,
          isRest: false
        });

        const existing = materials.find(m => m.length === length);
        if (existing) existing.count++;
        else materials.push({ length, count: 1 });

        totalWaste += length - rowWidth;
        totalUsed += length;
        filledLength = rowWidth;
        break;
      }
    }

    // 2. Falls nicht gefüllt, verwende Kombinationen
    if (filledLength < rowWidth - 0.01) {
      // Versuche: Latte + Rest
      for (const length of sortedByLength) {
        const remaining = rowWidth - length;

        // Prüfe, ob ein Rest die verbleibende Länge füllen kann
        let foundRest = false;
        for (let restIdx = 0; restIdx < restPool.length; restIdx++) {
          const rest = restPool[restIdx];
          if (rest >= remaining - 0.01) {
            // Rest ist groß genug
            const supports = countSupports(
              {
                start: length,
                end: rowWidth,
                length: remaining,
                originalLength: rest,
                isRest: true
              },
              sparrenPositionen,
              rowStartAbsolute,
              rowWidth
            );

            if (isSegmentValid(supports, false)) {
              // Gültig!
              segments.push({
                start: 0,
                end: length,
                length: length,
                originalLength: length,
                isRest: false
              });

              segments.push({
                start: length,
                end: rowWidth,
                length: remaining,
                originalLength: rest,
                isRest: true
              });

              const existing = materials.find(m => m.length === length);
              if (existing) existing.count++;
              else materials.push({ length, count: 1 });

              totalUsed += length + rest;
              totalWaste += rest - remaining;
              restPool.splice(restIdx, 1);
              filledLength = rowWidth;
              foundRest = true;
              break;
            }
          }
        }

        if (foundRest) break;
      }
    }

    // 3. Falls immer noch nicht gefüllt, einfache Greedy-Methode
    if (filledLength < rowWidth - 0.01) {
      let position = 0;

      // Verwende Latten
      while (position < rowWidth - 0.01) {
        let bestFit = null;
        let bestIdx = -1;

        // Finde beste Latte für restliche Länge
        for (let i = 0; i < sortedByLength.length; i++) {
          const length = sortedByLength[i];
          const neededLength = rowWidth - position;

          if (length >= neededLength - 0.01) {
            bestFit = length;
            bestIdx = i;
            break; // Erste Passende ist OK
          }
        }

        if (bestFit) {
          const segmentLength = Math.min(bestFit, rowWidth - position);
          segments.push({
            start: position,
            end: position + segmentLength,
            length: segmentLength,
            originalLength: bestFit,
            isRest: false
          });

          const existing = materials.find(m => m.length === bestFit);
          if (existing) existing.count++;
          else materials.push({ length: bestFit, count: 1 });

          totalUsed += bestFit;
          totalWaste += bestFit - segmentLength;
          position += segmentLength;
        } else {
          // Kein Material verfügbar - breche ab
          break;
        }
      }

      filledLength = position;
    }

    // Speichere Rest-Stücke für nächste Reihe
    for (const segment of segments) {
      if (segment.originalLength > segment.length) {
        const rest = segment.originalLength - segment.length;
        if (rest > 0.5) {
          // Rest groß genug
          const supports = countSupports(
            segment,
            sparrenPositionen,
            rowStartAbsolute,
            rowWidth
          );

          // Akzeptiere Rest wenn Auflagepunkte OK
          if (isSegmentValid(supports, false)) {
            restPool.push(rest);
          }
        }
      }
    }

    lattenPlan[row] = segments;
  }

  return {
    materials,
    totalLength: totalUsed,
    waste: totalWaste,
    plan: lattenPlan
  };
}

// ============= SVG RENDERING =============

export function generiereVorschau(
  result: CalculationResult,
  roofDims: RoofDimensions,
  rafterCount: number
): string {
  const svgWidth = 500;
  const svgHeight = 400;
  const margin = 60;

  const scaleX = (svgWidth - 2 * margin) / roofDims.width;
  const scaleY = (svgHeight - 2 * margin - 80) / roofDims.height;

  let svg = `<svg width="${svgWidth}" height="${svgHeight}" viewBox="0 0 ${svgWidth} ${svgHeight}">`;
  svg += `<rect width="${svgWidth}" height="${svgHeight}" fill="#f8f9fa"/>`;
  svg += `<text x="${svgWidth / 2}" y="25" text-anchor="middle" font-size="18" font-weight="bold" fill="#1e3c72">Verlegungsplan</text>`;

  const dachStartY = margin + 40;

  // Zeichne Dach-Umriss
  if (roofDims.type === 'trapez') {
    const sideDistance = (roofDims.width - (roofDims.upperWidth || 0)) / 2;
    const topLeft = margin + sideDistance * scaleX;
    const topRight = margin + ((roofDims.upperWidth || 0) + sideDistance) * scaleX;
    const bottomLeft = margin;
    const bottomRight = margin + roofDims.width * scaleX;
    const bottomY = dachStartY + roofDims.height * scaleY;

    svg += `<polygon points="${topLeft},${dachStartY} ${topRight},${dachStartY} ${bottomRight},${bottomY} ${bottomLeft},${bottomY}" fill="none" stroke="#1976d2" stroke-width="2"/>`;
  } else if (
    roofDims.type === 'dreieck' ||
    roofDims.type === 'gleichschenkliges-dreieck' ||
    roofDims.type === 'ungleichschenkliges-dreieck'
  ) {
    // Für ungleichschenklige Dreiecke: verwende spitzenPosition, sonst Mitte
    let peakPos = roofDims.width / 2;
    console.log(`🔍 SVG Triangle: type=${roofDims.type}, spitzenPosition=${roofDims.spitzenPosition}, width=${roofDims.width}`);
    if (roofDims.type === 'ungleichschenkliges-dreieck' && roofDims.spitzenPosition !== undefined) {
      // spitzenPosition ist ein Dezimalwert (0-1), daher mit width multiplizieren um die Position in Metern zu erhalten
      peakPos = roofDims.spitzenPosition * roofDims.width;
      console.log(`✅ Using asymmetric peak position: ${peakPos.toFixed(2)}m (${(roofDims.spitzenPosition * 100).toFixed(1)}% of ${roofDims.width}m width)`);
    } else {
      console.log(`ℹ️ Using symmetric peak position (center): ${peakPos.toFixed(2)}m (50% of ${roofDims.width}m width)`);
    }

    const peakX = margin + peakPos * scaleX;
    const leftX = margin;
    const rightX = margin + roofDims.width * scaleX;
    const bottomY = dachStartY + roofDims.height * scaleY;

    svg += `<polygon points="${peakX},${dachStartY} ${rightX},${bottomY} ${leftX},${bottomY}" fill="none" stroke="#1976d2" stroke-width="2"/>`;
  } else {
    const bottomY = dachStartY + roofDims.height * scaleY;
    svg += `<rect x="${margin}" y="${dachStartY}" width="${roofDims.width * scaleX}" height="${roofDims.height * scaleY}" fill="none" stroke="#1976d2" stroke-width="2"/>`;
  }

  // Zeichne Sparren
  for (let i = 0; i < rafterCount && i < sparrenPositionen.length; i++) {
    const sparrenX = margin + sparrenPositionen[i] * scaleX;
    let sparrenY = dachStartY;
    let sparrenHeight = roofDims.height * scaleY;

    if (sparrenLaengen[i] !== undefined) {
      sparrenHeight = sparrenLaengen[i] * scaleY;
      if (roofDims.type !== 'rechteck') {
        sparrenY = dachStartY + (roofDims.height - sparrenLaengen[i]) * scaleY;
      }
    }

    svg += `<rect x="${sparrenX - 2}" y="${sparrenY}" width="4" height="${sparrenHeight}" fill="#666" opacity="0.8"/>`;
    svg += `<rect x="${sparrenX - 1}" y="${sparrenY}" width="2" height="${sparrenHeight}" fill="#ff6b35" opacity="0.9"/>`;
  }

  // Farbpalette für verschiedene Lattenlängen
  const lattenFarben: { [key: string]: string } = {
    '3': '#9b59b6',
    '4': '#3498db',
    '5': '#f39c12',
    '6': '#27ae60'
  };
  const restFarbe = '#e74c3c';

  // Zeichne Latten aus dem Plan
  const rowCount = result.rowCount;
  for (let rowIdx = 0; rowIdx < rowCount; rowIdx++) {
    const progress = (rowCount - 1 - rowIdx) / Math.max(1, rowCount - 1);
    const rowWidth = berechneReihenBreite(progress, roofDims);
    const lattenY = dachStartY + (1 - progress) * roofDims.height * scaleY;
    const rowStartAbsolute = margin + ((roofDims.width - rowWidth) / 2) * scaleX;

    if (lattenPlan[rowIdx]) {
      const segments = lattenPlan[rowIdx];

      for (let j = 0; j < segments.length; j++) {
        const segment = segments[j];
        const segmentStartX = rowStartAbsolute + segment.start * scaleX;
        const segmentEndX = rowStartAbsolute + segment.end * scaleX;

        const farbe = segment.isRest
          ? restFarbe
          : lattenFarben[segment.originalLength.toString()] || '#27ae60';

        svg += `<line x1="${segmentStartX}" y1="${lattenY}" x2="${segmentEndX}" y2="${lattenY}" stroke="${farbe}" stroke-width="4" opacity="0.9"/>`;

        // Markiere Stöße (Joints)
        if (j < segments.length - 1) {
          svg += `<line x1="${segmentEndX}" y1="${lattenY - 6}" x2="${segmentEndX}" y2="${lattenY + 6}" stroke="#1976d2" stroke-width="3"/>`;
        }

        // Markiere Rest-Stücke
        if (segment.isRest) {
          const midX = segmentStartX + (segmentEndX - segmentStartX) / 2;
          svg += `<text x="${midX}" y="${lattenY - 8}" text-anchor="middle" font-size="8" font-weight="bold" fill="#dc3545">R</text>`;
        }
      }
    }
  }

  // Legende
  svg += `<text x="10" y="${svgHeight - 20}" font-size="11" fill="#666">Legende: Orange=Sparren | Farbig=Latten | R=Rest | Blau=Stoß</text>`;

  svg += `</svg>`;

  return svg;
}

// ============= HAUPT-BERECHNUNG =============

export function berechne(params: RafterCalcParams): CalculationResult {
  const { roofDims } = params;
  currentRoofDims = roofDims;

  // Berechne Sparren
  berechneSparrenPositionen(params.rafterCount, params.rafterSpacing, params.overhang);
  berechneSpitzdachSparren(params.rafterCount, roofDims);

  // Berechne Konterlatten
  const counterTotalLength = sparrenLaengen.reduce((sum, l) => sum + l, 0);
  const counterResult = optimiereKonterlatten(counterTotalLength, params.availableCounters);

  // Berechne Anzahl Reihen
  const rowCount = Math.ceil((roofDims.height * 100) / params.rowSpacing) + 1;

  // Berechne Dachlatten
  const roofResult = berechneDachlattenIntelligent(params, rowCount);

  // Zähle Material
  const roofCount = roofResult.materials.reduce((sum, m) => sum + m.count, 0);
  const counterCount = counterResult.materials.reduce((sum, m) => sum + m.count, 0);

  // Berechne Dachfläche
  const roofArea = roofDims.width * roofDims.height;

  return {
    counterRafters: {
      totalLength: counterResult.totalLength,
      count: counterCount,
      waste: counterResult.waste,
      materials: counterResult.materials
    },
    roofRafters: {
      totalLength: roofResult.totalLength,
      count: roofCount,
      waste: roofResult.waste,
      materials: roofResult.materials,
      plan: roofResult.plan
    },
    roofArea,
    rowCount
  };
}

// ============= EXPORT / HILFSFUNKTIONEN =============

export function getSparrenPositionen(): number[] {
  return [...sparrenPositionen];
}

export function getSparrenLaengen(): number[] {
  return [...sparrenLaengen];
}

export function getLattenPlan(): RafterPlan {
  return { ...lattenPlan };
}
