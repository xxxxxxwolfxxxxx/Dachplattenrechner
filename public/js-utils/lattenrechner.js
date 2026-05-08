let dachBreite = 10;
let dachHoehe = 6;
let dachTyp = 'rechteck';
let obereBreite = 0;
let trapezHoehe = 0;
let rechteckHoehe = 0;
let dreieckHoehe = 0;
let spitzenPosition = 0.5; // 0-1, relative to width (0.5 = center)
let dreieckTyp = 'gleichschenkliges'; // gleichschenkliges or ungleichschenkliges
let sparrenLaengen = [];
let sparrenPositionen = [];

function showAds() {
    // AdUnit-Komponenten werden automatisch durch AdSense geladen
}

function ladeDachParameter() {
    const urlParams = new URLSearchParams(window.location.search);

    if (urlParams.has('breite')) dachBreite = parseFloat(urlParams.get('breite'));
    if (urlParams.has('hoehe')) dachHoehe = parseFloat(urlParams.get('hoehe'));
    if (urlParams.has('typ')) dachTyp = urlParams.get('typ');
    if (urlParams.has('obereBreite')) obereBreite = parseFloat(urlParams.get('obereBreite'));
    if (urlParams.has('trapezHoehe')) trapezHoehe = parseFloat(urlParams.get('trapezHoehe'));
    if (urlParams.has('rechteckHoehe')) rechteckHoehe = parseFloat(urlParams.get('rechteckHoehe'));
    if (urlParams.has('dreieckHoehe')) dreieckHoehe = parseFloat(urlParams.get('dreieckHoehe'));

    // Parameter name variations (tools send different names)
    if (urlParams.has('spitzenPosition')) spitzenPosition = parseFloat(urlParams.get('spitzenPosition')) / 100;
    if (urlParams.has('spitzePosX')) spitzenPosition = parseFloat(urlParams.get('spitzePosX')) / dachBreite; // Convert absolute to relative

    if (urlParams.has('dreieckTyp')) dreieckTyp = urlParams.get('dreieckTyp');
    if (urlParams.has('dachDreieckTyp')) dreieckTyp = urlParams.get('dachDreieckTyp');

    aktualisiereAnzeige();
}

function aktualisiereAnzeige() {
    let massText = `Breite: ${dachBreite}m, Höhe: ${dachHoehe}m, Typ: ${dachTyp}`;

    const urlParams = new URLSearchParams(window.location.search);

    switch(dachTyp) {
        case 'trapez':
            if (obereBreite) massText += `, Obere Breite: ${obereBreite.toFixed(1)}m`;
            break;
        case 'dreieck':
            massText += `, Spitzdach`;
            break;
        case 'trapez-auf-rechteck':
            const obereBreiteTA = urlParams.get('obereBreite');
            const trapezHoeheTA = urlParams.get('trapezHoehe');
            const rechteckHoeheTA = urlParams.get('rechteckHoehe');
            if (obereBreiteTA && trapezHoeheTA && rechteckHoeheTA) {
                massText += `, Obere Breite: ${parseFloat(obereBreiteTA).toFixed(1)}m`;
            }
            break;
        case 'dreieck-auf-rechteck':
            const dreieckHoeheDAR = urlParams.get('dreieckHoehe');
            const rechteckHoeheDAR = urlParams.get('rechteckHoehe');
            if (dreieckHoeheDAR && rechteckHoeheDAR) {
                massText += `, Dreieck-Höhe: ${parseFloat(dreieckHoeheDAR).toFixed(1)}m, Rechteck-Höhe: ${parseFloat(rechteckHoeheDAR).toFixed(1)}m`;
            }
            break;
    }

    document.getElementById('dach-masse').textContent = massText;
    document.getElementById('dach-darstellung').innerHTML = generiereSimpleDachSVG();
}

function generiereSimpleDachSVG() {
    let svg = '';
    
    switch(dachTyp) {
        case 'rechteck':
            svg = `<svg width="200" height="120" viewBox="0 0 200 120">
                <rect x="20" y="30" width="160" height="60" fill="#e3f2fd" stroke="#1976d2" stroke-width="2"/>
                <text x="100" y="65" text-anchor="middle" font-size="12" fill="#333">Rechteck</text>
            </svg>`;
            break;
        case 'trapez':
            svg = `<svg width="200" height="120" viewBox="0 0 200 120">
                <polygon points="60,30 140,30 180,90 20,90" fill="#e3f2fd" stroke="#1976d2" stroke-width="2"/>
                <text x="100" y="65" text-anchor="middle" font-size="12" fill="#333">Trapez</text>
            </svg>`;
            break;
        case 'dreieck':
        case 'gleichschenkliges-dreieck':
        case 'ungleichschenkliges-dreieck':
            svg = `<svg width="200" height="120" viewBox="0 0 200 120">
                <polygon points="100,30 180,90 20,90" fill="#e3f2fd" stroke="#1976d2" stroke-width="2"/>
                <text x="100" y="75" text-anchor="middle" font-size="12" fill="#333">Dreieck</text>
            </svg>`;
            break;
        case 'trapez-auf-rechteck':
            svg = `<svg width="200" height="120" viewBox="0 0 200 120">
                <rect x="20" y="60" width="160" height="30" fill="#e3f2fd" stroke="#1976d2" stroke-width="2"/>
                <polygon points="60,30 140,30 180,60 20,60" fill="#e3f2fd" stroke="#1976d2" stroke-width="2"/>
                <text x="100" y="75" text-anchor="middle" font-size="11" fill="#333">Trapez+Rechteck</text>
            </svg>`;
            break;
        default:
            svg = `<svg width="200" height="120" viewBox="0 0 200 120">
                <rect x="20" y="60" width="160" height="50" fill="#e3f2fd" stroke="#1976d2" stroke-width="2"/>
            </svg>`;
    }
    
    return svg;
}

let berechnungsTimer = null;

function aktualisiereAutomatischeSparrenBerechnung() {
    const anzahlInput = document.getElementById('anzahl-sparren');
    const abstandInput = document.getElementById('sparren-abstand');
    const ueberstandInput = document.getElementById('dachueberstand');
    
    [anzahlInput, abstandInput, ueberstandInput].forEach(input => {
        input.addEventListener('input', function() {
            if (berechnungsTimer) clearTimeout(berechnungsTimer);
            berechnungsTimer = setTimeout(() => berechneSparrenParameter(), 800);
        });
    });
}

function berechneSparrenParameter() {
    const anzahlInput = document.getElementById('anzahl-sparren');
    const abstandInput = document.getElementById('sparren-abstand');
    const ueberstandInput = document.getElementById('dachueberstand');
    
    const anzahl = parseFloat(anzahlInput.value) || 0;
    const abstand = parseFloat(abstandInput.value) || 0;
    const ueberstand = parseFloat(ueberstandInput.value) || 0;
    
    let gefuellteFelder = 0;
    if (anzahl > 0 && anzahlInput.value.trim() !== '') gefuellteFelder++;
    if (abstand > 0 && abstandInput.value.trim() !== '') gefuellteFelder++;
    if (ueberstand >= 0 && ueberstandInput.value.trim() !== '') gefuellteFelder++;
    
    [anzahlInput, abstandInput, ueberstandInput].forEach(input => {
        if (input.style.backgroundColor === 'rgb(232, 245, 232)') {
            input.style.backgroundColor = '';
        }
    });
    
    if (gefuellteFelder === 2) {
        if (anzahl > 0 && abstand > 0 && ueberstandInput.value.trim() === '') {
            const sparrenBreite = (anzahl - 1) * (abstand / 100);
            const neuerUeberstand = ((dachBreite - sparrenBreite) / 2) * 100;
            ueberstandInput.value = Math.max(0, neuerUeberstand).toFixed(1);
            ueberstandInput.style.backgroundColor = '#e8f5e8';
        }
        else if (anzahl > 0 && ueberstand >= 0 && abstandInput.value.trim() === '') {
            const verfuegbareBreite = dachBreite - (2 * ueberstand / 100);
            const neuerAbstand = (verfuegbareBreite / (anzahl - 1)) * 100;
            abstandInput.value = neuerAbstand.toFixed(1);
            abstandInput.style.backgroundColor = '#e8f5e8';
        }
        else if (abstand > 0 && ueberstand >= 0 && anzahlInput.value.trim() === '') {
            const verfuegbareBreite = dachBreite - (2 * ueberstand / 100);
            const neueAnzahl = Math.round((verfuegbareBreite / (abstand / 100)) + 1);
            anzahlInput.value = Math.max(2, neueAnzahl);
            anzahlInput.style.backgroundColor = '#e8f5e8';
        }
    }
    
    if (anzahlInput.value && abstandInput.value && ueberstandInput.value !== '') {
        berechneSparrenPositionen(parseInt(anzahlInput.value), parseFloat(abstandInput.value), parseFloat(ueberstandInput.value));
        berechneSpitzdachSparren(parseInt(anzahlInput.value));
    }
}

function berechneSparrenPositionen(anzahl, abstand, ueberstand) {
    sparrenPositionen = [];
    const ueberstandM = ueberstand / 100;
    
    for (let i = 0; i < anzahl; i++) {
        sparrenPositionen.push(ueberstandM + (i * abstand / 100));
    }
}

function berechneSpitzdachSparren(anzahlSparren) {
    sparrenLaengen = [];
    
    switch(dachTyp) {
        case 'rechteck':
            for (let i = 0; i < anzahlSparren; i++) {
                sparrenLaengen.push(dachHoehe);
            }
            break;
            
        case 'trapez':
            const seitenAbstand = (dachBreite - obereBreite) / 2;
            const linkeObereEcke = seitenAbstand;
            const rechteObereEcke = dachBreite - seitenAbstand;
            
            for (let i = 0; i < anzahlSparren; i++) {
                const xPosition = sparrenPositionen[i];
                let sparrenLaenge;
                
                if (xPosition <= linkeObereEcke) {
                    sparrenLaenge = (xPosition / linkeObereEcke) * dachHoehe;
                } else if (xPosition >= rechteObereEcke) {
                    sparrenLaenge = ((dachBreite - xPosition) / seitenAbstand) * dachHoehe;
                } else {
                    sparrenLaenge = dachHoehe;
                }
                sparrenLaengen.push(Math.max(0, sparrenLaenge));
            }
            break;
            
        case 'dreieck':
        case 'gleichschenkliges-dreieck':
        case 'ungleichschenkliges-dreieck':
            // Berechne Spitzenposition basierend auf dreieckTyp
            let spitzePosX_dreieck;
            if (dreieckTyp === 'ungleichschenkliges') {
                // Asymmetrisches Dreieck: Spitze ist bei spitzenPosition * dachBreite
                spitzePosX_dreieck = spitzenPosition * dachBreite;
            } else {
                // Symmetrisches Dreieck: Spitze ist in der Mitte
                spitzePosX_dreieck = dachBreite / 2;
            }

            for (let i = 0; i < anzahlSparren; i++) {
                const xPosition = sparrenPositionen[i];
                let sparrenLaenge;

                if (dreieckTyp === 'ungleichschenkliges') {
                    // Asymmetrisches Dreieck
                    if (xPosition <= spitzePosX_dreieck) {
                        const prozent = xPosition / spitzePosX_dreieck;
                        sparrenLaenge = prozent * dachHoehe;
                    } else {
                        const abstandVonRechts = dachBreite - xPosition;
                        const rechteHalbBreite = dachBreite - spitzePosX_dreieck;
                        const prozent = abstandVonRechts / rechteHalbBreite;
                        sparrenLaenge = prozent * dachHoehe;
                    }
                } else {
                    // Symmetrisches Dreieck
                    if (xPosition <= spitzePosX_dreieck) {
                        sparrenLaenge = (xPosition / spitzePosX_dreieck) * dachHoehe;
                    } else {
                        sparrenLaenge = ((dachBreite - xPosition) / spitzePosX_dreieck) * dachHoehe;
                    }
                }

                sparrenLaengen.push(Math.max(0, sparrenLaenge));
            }
            break;
            
        case 'trapez-auf-rechteck':
            const seitenAbstandTA = (dachBreite - obereBreite) / 2;
            const linkeObereEckeTA = seitenAbstandTA;
            const rechteObereEckeTA = dachBreite - seitenAbstandTA;

            for (let i = 0; i < anzahlSparren; i++) {
                const xPosition = sparrenPositionen[i];
                let sparrenLaenge = rechteckHoehe;

                if (xPosition <= linkeObereEckeTA) {
                    sparrenLaenge += (xPosition / linkeObereEckeTA) * trapezHoehe;
                } else if (xPosition >= rechteObereEckeTA) {
                    sparrenLaenge += ((dachBreite - xPosition) / seitenAbstandTA) * trapezHoehe;
                } else {
                    sparrenLaenge += trapezHoehe;
                }

                sparrenLaengen.push(Math.max(0, sparrenLaenge));
            }
            break;

        case 'dreieck-auf-rechteck':
            let spitzePosX;
            if (dreieckTyp === 'gleichschenkliges') {
                spitzePosX = dachBreite / 2;
            } else {
                spitzePosX = spitzenPosition * dachBreite;
            }

            for (let i = 0; i < anzahlSparren; i++) {
                const xPosition = sparrenPositionen[i];
                let sparrenLaenge = rechteckHoehe;

                if (dreieckTyp === 'gleichschenkliges') {
                    // Symmetrisches Dreieck
                    const abstandVonMitte = Math.abs(xPosition - spitzePosX);
                    const prozent = abstandVonMitte / spitzePosX;
                    sparrenLaenge += dreieckHoehe * (1 - prozent);
                } else {
                    // Asymmetrisches Dreieck
                    if (xPosition <= spitzePosX) {
                        const prozent = xPosition / spitzePosX;
                        sparrenLaenge += dreieckHoehe * prozent;
                    } else {
                        const abstandVonRechts = dachBreite - xPosition;
                        const prozent = abstandVonRechts / (dachBreite - spitzePosX);
                        sparrenLaenge += dreieckHoehe * prozent;
                    }
                }

                sparrenLaengen.push(Math.max(0, sparrenLaenge));
            }
            break;

        default:
            for (let i = 0; i < anzahlSparren; i++) {
                sparrenLaengen.push(dachHoehe);
            }
    }
}

function aktualisiereLattenabstandsfeld() {
    const select = document.getElementById('lattenabstand');
    const customGroup = document.getElementById('custom-lattenabstand-group');

    select.addEventListener('change', function() {
        customGroup.style.display = this.value === 'custom' ? 'block' : 'none';
    });
}

/**
 * Phase D: Globale Material-Kombi-Optimierung
 * Testet verschiedene Szenarien für Material-Einsatz und wählt das beste
 *
 * @param {number} konterlattenGesamtlaenge - Benötigte Gesamtlänge für Konterlatten
 * @param {number} dachlattenGesamtlaenge - Benötigte Gesamtlänge für Dachlatten
 * @param {number[]} verfuegbareKonterlatten - Verfügbare Konterlattenlängen
 * @param {number[]} verfuegbareDachlatten - Verfügbare Dachlattenlängen
 * @returns {Object} { szenario: string, gesamtVerschnitt: number, empfehlung: string }
 */
function optimizeGlobalMaterialCombo(konterlattenGesamtlaenge, dachlattenGesamtlaenge, verfuegbareKonterlatten, verfuegbareDachlatten) {
    // Berechne Verschnitt für verschiedene Szenarien
    const szenarien = [];

    // Szenario 1: Standard (beide Materialtypen wie berechnet)
    const standardVerschnitt = (calcWasteForLength(konterlattenGesamtlaenge, verfuegbareKonterlatten) +
                                calcWasteForLength(dachlattenGesamtlaenge, verfuegbareDachlatten));
    szenarien.push({
        szenario: 'standard',
        beschreibung: 'Standard (beide Materialtypen)',
        gesamtVerschnitt: standardVerschnitt,
        priorität: 'normal'
    });

    // Szenario 2: Priorität Konterlatten (nutze diese wo möglich)
    // Wenn wir zuerst Konterlatten verwenden und Rest mit Dachlatten füllen
    const konterFirst = Math.max(0, konterlattenGesamtlaenge);
    const restWithDach = Math.max(0, dachlattenGesamtlaenge);
    const konterFirstVerschnitt = (calcWasteForLength(konterFirst, verfuegbareKonterlatten) +
                                    calcWasteForLength(restWithDach, verfuegbareDachlatten));
    szenarien.push({
        szenario: 'konter-first',
        beschreibung: 'Priorität Konterlatten',
        gesamtVerschnitt: konterFirstVerschnitt,
        priorität: 'normal'
    });

    // Szenario 3: Priorität Dachlatten
    const dachFirst = Math.max(0, dachlattenGesamtlaenge);
    const restWithKonter = Math.max(0, konterlattenGesamtlaenge);
    const dachFirstVerschnitt = (calcWasteForLength(dachFirst, verfuegbareDachlatten) +
                                  calcWasteForLength(restWithKonter, verfuegbareKonterlatten));
    szenarien.push({
        szenario: 'dach-first',
        beschreibung: 'Priorität Dachlatten',
        gesamtVerschnitt: dachFirstVerschnitt,
        priorität: 'normal'
    });

    // Finde bestes Szenario
    const bestes = szenarien.reduce((best, current) =>
        current.gesamtVerschnitt < best.gesamtVerschnitt ? current : best
    );

    return {
        szenario: bestes.szenario,
        beschreibung: bestes.beschreibung,
        gesamtVerschnitt: bestes.gesamtVerschnitt,
        ersparnisse: Math.max(0, standardVerschnitt - bestes.gesamtVerschnitt),
        prozent: Math.round((1 - bestes.gesamtVerschnitt / Math.max(1, standardVerschnitt)) * 100)
    };
}

/**
 * Hilfsfunktion: Berechnet Verschnitt für eine bestimmte Länge mit verfügbaren Materialien
 * @param {number} benoetigteLaenge - Zu füllende Länge
 * @param {number[]} verfuegbareMaterialien - Verfügbare Materialquerschnitte
 * @returns {number} Berechneter Verschnitt
 */
function calcWasteForLength(benoetigteLaenge, verfuegbareMaterialien) {
    if (benoetigteLaenge <= 0 || !verfuegbareMaterialien || verfuegbareMaterialien.length === 0) {
        return 0;
    }

    let remaining = benoetigteLaenge;
    let totalWaste = 0;
    const sorted = [...verfuegbareMaterialien].sort((a, b) => b - a); // Größte zuerst

    while (remaining > 0) {
        const best = sorted.find(m => m >= remaining);
        if (best) {
            totalWaste += (best - remaining);
            remaining = 0;
        } else {
            const next = sorted[0];
            if (next > 0) {
                remaining -= next;
                if (remaining < 0) {
                    totalWaste += Math.abs(remaining);
                    remaining = 0;
                }
            } else {
                break;
            }
        }
    }

    if (remaining > 0) {
        totalWaste += remaining; // Nicht erfüllt - zähle als Verschnitt
    }

    return Math.max(0, totalWaste);
}

/**
 * Phase A: Knapsack-basiertes Rest-Matching
 * Findet die beste Kombination von verfügbaren Resten, die die Reihenbreite mit minimalem Verschnitt erfüllen
 *
 * @param {number[]} verfuegbareReste - Array von verfügbaren Rest-Längen
 * @param {number} zielBreite - Breite der zu füllenden Reihe
 * @param {number} tolerance - Toleranz für Vergleiche (Default: 0.01m)
 * @returns {Object} { kombination: number[], totalLength: number, waste: number }
 */
function findBestRestCombinationKnapsack(verfuegbareReste, zielBreite, tolerance = 0.01) {
    if (!verfuegbareReste || verfuegbareReste.length === 0) {
        return { kombination: [], totalLength: 0, waste: Infinity };
    }

    let besteKombination = null;
    let minWaste = Infinity;
    let bestetotalLength = 0;

    // Phase 1: Suche nach Kombinationen die >= zielBreite sind
    function searchCombinations(index, currentKombination, currentSum) {
        // Wenn wir die Mindestbreite erreicht haben, überprüfe ob diese Kombination besser ist
        if (currentSum >= zielBreite - tolerance) {
            const waste = currentSum - zielBreite;
            if (waste < minWaste) {
                minWaste = waste;
                besteKombination = [...currentKombination];
                bestetotalLength = currentSum;
            }
            return; // Weitere Erweiterung würde nur Verschnitt erhöhen
        }

        // Pruning: Wenn wir bereits zu viel haben, nicht weitermachen
        if (currentSum > zielBreite + minWaste) {
            return;
        }

        // Versuche alle verbleibenden Resten hinzuzufügen
        if (index < verfuegbareReste.length) {
            const minRest = Math.min(...verfuegbareReste.slice(index));
            if (currentSum + minRest <= zielBreite + minWaste) {
                for (let i = index; i < verfuegbareReste.length; i++) {
                    const rest = verfuegbareReste[i];
                    currentKombination.push(rest);
                    searchCombinations(i + 1, currentKombination, currentSum + rest);
                    currentKombination.pop();
                }
            }
        }
    }

    // Starte Suche
    searchCombinations(0, [], 0);

    // Phase 2: Fallback - Wenn keine Kombination >= zielBreite gefunden, nimm beste einzelne
    if (besteKombination === null || minWaste === Infinity) {
        minWaste = Infinity;
        for (let i = 0; i < verfuegbareReste.length; i++) {
            const rest = verfuegbareReste[i];
            if (rest >= zielBreite - tolerance) {
                const waste = rest - zielBreite;
                if (waste < minWaste) {
                    minWaste = waste;
                    besteKombination = [rest];
                    bestetotalLength = rest;
                }
            }
        }
    }

    // Phase 3: Letzer Fallback - Nimm einfach die längste verfügbare Latte
    if (besteKombination === null) {
        const longest = Math.max(...verfuegbareReste);
        besteKombination = [longest];
        bestetotalLength = longest;
        minWaste = longest - zielBreite;
    }

    return {
        kombination: besteKombination,
        totalLength: bestetotalLength,
        waste: Math.max(0, minWaste === Infinity ? minWaste : minWaste)
    };
}

function berechneDachlattenIntelligent(sparrenPositionen, lattenabstand, verfuegbareLaengen, anzahlReihen) {
    const tatsaechlichVerfuegbar = verfuegbareLaengen.filter(l => l > 0);
    if (tatsaechlichVerfuegbar.length === 0) {
        return { kombination: [], gesamtLaenge: 0, verschnitt: 0, anzahlReihen: 0 };
    }
    
    tatsaechlichVerfuegbar.sort((a, b) => a - b);
    
    const materialListe = [];
    let gesamtVerschnitt = 0;
    let gesamtBenoetigteLaenge = 0;
    
    window.lattenPlan = [];
    
    const istRechteckSonderfall = (dachTyp === 'rechteck' && 
        sparrenPositionen.length > 0 && 
        (sparrenPositionen[0] > 0.05 || sparrenPositionen[sparrenPositionen.length - 1] < dachBreite - 0.05));
    
    if (istRechteckSonderfall) {
        for (let reihe = anzahlReihen - 1; reihe >= 0; reihe--) {
            const reihenBreite = dachBreite;
            gesamtBenoetigteLaenge += reihenBreite;
            
            // Phase A: Knapsack-basierte Optimierung statt Greedy Matching
            const knapsackResult = findBestRestCombinationKnapsack(tatsaechlichVerfuegbar, reihenBreite);
            const besteKombination = knapsackResult.kombination.length > 0 ? knapsackResult.kombination : null;
            
            if (besteKombination) {
                let segmente = [];
                
                if (besteKombination.length === 1) {
                    // Eine Latte: gesamte Breite abdecken
                    segmente.push({
                        start: 0,
                        ende: reihenBreite,
                        laenge: reihenBreite,
                        originalLaenge: besteKombination[0],
                        istRest: false
                    });
                    
                    const existierend = materialListe.find(m => m.laenge === besteKombination[0]);
                    if (existierend) existierend.anzahl++;
                    else materialListe.push({ laenge: besteKombination[0], anzahl: 1 });
                    
                    gesamtVerschnitt += (besteKombination[0] - reihenBreite);
                    
                } else {
                    // Mehrere Latten: Intelligente Aufteilung
                    const lattenSumme = besteKombination.reduce((sum, l) => sum + l, 0);
                    
                    // Sortiere Latten: kürzeste zuerst (die wird geschnitten)
                    const sortierteLatten = [...besteKombination].sort((a, b) => a - b);
                    const zuSchneidendeLatte = sortierteLatten[0];
                    const ganzeLatten = sortierteLatten.slice(1);
                    const summeGanzeLatten = ganzeLatten.reduce((sum, l) => sum + l, 0);
                    
                    // Variante basierend auf Reihe
                    const variante = reihe % 3;
                    
                    // Die zu schneidende Latte muss die verbleibende Länge füllen
                    const restLaenge = reihenBreite - summeGanzeLatten;
                    
                    // Wenn die zu schneidende Latte nicht ausreicht, verwende Fallback
                    if (zuSchneidendeLatte < restLaenge - 0.01) {
                        // Fallback: einfache gleichmäßige Aufteilung
                        const stueckLaenge = reihenBreite / besteKombination.length;
                        let aktPos = 0;
                        
                        for (let i = 0; i < besteKombination.length; i++) {
                            const ende = (i === besteKombination.length - 1) ? reihenBreite : aktPos + stueckLaenge;
                            segmente.push({
                                start: aktPos,
                                ende: ende,
                                laenge: ende - aktPos,
                                originalLaenge: besteKombination[i],
                                istRest: false
                            });
                            aktPos = ende;
                        }
                        
                        besteKombination.forEach(laenge => {
                            const existierend = materialListe.find(m => m.laenge === laenge);
                            if (existierend) existierend.anzahl++;
                            else materialListe.push({ laenge: laenge, anzahl: 1 });
                        });
                        
                        gesamtVerschnitt += (lattenSumme - reihenBreite);
                        
                    } else {
                        // Intelligente Aufteilung: Anfangsstück + ganze Latten + Endstück
                        const minStueckLaenge = 1.0;
                        const maxSchnittPos = zuSchneidendeLatte - minStueckLaenge;
                        
                        let besteSchnittPos = null;
                        let besteQualitaet = Infinity;
                        
                        // Bevorzugte Schnittposition basierend auf Variante
                        let bevorzugteSchnittPos;
                        if (variante === 0) {
                            bevorzugteSchnittPos = restLaenge * 0.5; // 50/50
                        } else if (variante === 1) {
                            bevorzugteSchnittPos = restLaenge * 0.3; // 30/70
                        } else {
                            bevorzugteSchnittPos = restLaenge * 0.7; // 70/30
                        }
                        
                        // Teste Schnittpositionen in 0,1m Schritten
                        for (let schnittPos = minStueckLaenge; schnittPos <= Math.min(maxSchnittPos, restLaenge - minStueckLaenge); schnittPos += 0.1) {
                            // Anfangsstück
                            const stoss1 = schnittPos;
                            
                            // Dann kommen die ganzen Latten
                            let aktPos = stoss1;
                            const alleStossPositionen = [stoss1];
                            
                            for (let ganzeLatte of ganzeLatten) {
                                aktPos += ganzeLatte;
                                alleStossPositionen.push(aktPos);
                            }
                            
                            // Das letzte Stück (Rest der geschnittenen Latte) endet bei reihenBreite
                            // alleStossPositionen enthält jetzt alle Stoß-Positionen
                            
                            // Berechne Qualität: Summe aller Abstände zu nächsten Sparren
                            let sparrenQualitaet = 0;
                            for (let stossPos of alleStossPositionen) {
                                let minAbstand = Infinity;
                                for (let sparrenPos of sparrenPositionen) {
                                    minAbstand = Math.min(minAbstand, Math.abs(sparrenPos - stossPos));
                                }
                                sparrenQualitaet += minAbstand;
                            }
                            
                            // Füge leichte Präferenz für gewünschte Variante hinzu
                            const positionsAbweichung = Math.abs(schnittPos - bevorzugteSchnittPos) * 0.1;
                            const qualitaet = sparrenQualitaet + positionsAbweichung;
                            
                            if (qualitaet < besteQualitaet) {
                                besteQualitaet = qualitaet;
                                besteSchnittPos = schnittPos;
                            }
                        }
                        
                        // Verwende beste Schnittposition
                        if (besteSchnittPos) {
                            // Anfangsstück (von geschnittener Latte)
                            segmente.push({
                                start: 0,
                                ende: besteSchnittPos,
                                laenge: besteSchnittPos,
                                originalLaenge: zuSchneidendeLatte,
                                istRest: false
                            });
                            
                            // Ganze Latten
                            let aktPos = besteSchnittPos;
                            for (let ganzeLatte of ganzeLatten) {
                                segmente.push({
                                    start: aktPos,
                                    ende: aktPos + ganzeLatte,
                                    laenge: ganzeLatte,
                                    originalLaenge: ganzeLatte,
                                    istRest: false
                                });
                                aktPos += ganzeLatte;
                            }
                            
                            // Endstück (Rest der geschnittenen Latte)
                            segmente.push({
                                start: aktPos,
                                ende: reihenBreite,
                                laenge: reihenBreite - aktPos,
                                originalLaenge: zuSchneidendeLatte,
                                istRest: true  // Dies ist das Rest-Stück!
                            });
                            
                            besteKombination.forEach(laenge => {
                                const existierend = materialListe.find(m => m.laenge === laenge);
                                if (existierend) existierend.anzahl++;
                                else materialListe.push({ laenge: laenge, anzahl: 1 });
                            });
                            
                            gesamtVerschnitt += (lattenSumme - reihenBreite);
                        }
                    }
                }
                
                window.lattenPlan[reihe] = segmente;
            }
        }
        
    } else {
        const luecken = [];
        
        for (let reihe = anzahlReihen - 1; reihe >= 0; reihe--) {
            const fortschritt = (anzahlReihen - 1 - reihe) / Math.max(1, anzahlReihen - 1);
            let reihenBreite = berechneReihenBreite(fortschritt);
            
            gesamtBenoetigteLaenge += reihenBreite;
            
            let reihenStartAbsolut = (dachBreite - reihenBreite) / 2;
            if ((dachTyp === 'dreieck' || dachTyp === 'gleichschenkliges-dreieck' || dachTyp === 'ungleichschenkliges-dreieck') && dreieckTyp === 'ungleichschenkliges') {
                reihenStartAbsolut = fortschritt * (spitzenPosition * dachBreite);
            }
            const relevanteSparren = sparrenPositionen.filter(pos =>
                pos >= reihenStartAbsolut - 0.05 && pos <= reihenStartAbsolut + reihenBreite + 0.05
            ).map(pos => pos - reihenStartAbsolut).sort((a, b) => a - b);
            
            if (relevanteSparren.length === 0 || relevanteSparren[0] > 0.05) {
                relevanteSparren.unshift(0);
            }
            if (relevanteSparren[relevanteSparren.length - 1] < reihenBreite - 0.05) {
                relevanteSparren.push(reihenBreite);
            }
            
            // Phase A: Knapsack-basierte Optimierung statt Greedy Matching
            const knapsackResult = findBestRestCombinationKnapsack(tatsaechlichVerfuegbar, reihenBreite);
            const besteKombination = knapsackResult.kombination.length > 0 ? knapsackResult.kombination : null;
            
            const reihenSegmente = [];
            let aktuellePosition = 0;
            
            if (besteKombination) {
                for (let lattenLaenge of besteKombination) {
                    if (aktuellePosition >= reihenBreite - 0.01) break;
                    
                    const maxEnde = Math.min(aktuellePosition + lattenLaenge, reihenBreite);
                    
                    let zielSparren = null;
                    for (let j = relevanteSparren.length - 1; j >= 0; j--) {
                        if (relevanteSparren[j] > aktuellePosition + 0.5 && relevanteSparren[j] <= maxEnde + 0.05) {
                            zielSparren = relevanteSparren[j];
                            break;
                        }
                    }
                    
                    if (zielSparren) {
                        reihenSegmente.push({
                            start: aktuellePosition,
                            ende: zielSparren,
                            laenge: zielSparren - aktuellePosition,
                            originalLaenge: lattenLaenge,
                            istRest: false
                        });
                        
                        const existierend = materialListe.find(m => m.laenge === lattenLaenge);
                        if (existierend) {
                            existierend.anzahl++;
                        } else {
                            materialListe.push({ laenge: lattenLaenge, anzahl: 1 });
                        }
                        
                        aktuellePosition = zielSparren;
                    }
                }
            }
            
            if (aktuellePosition < reihenBreite - 0.1) {
                luecken.push({
                    reihe: reihe,
                    start: aktuellePosition,
                    ende: reihenBreite,
                    benoetigteLattenlaenge: reihenBreite - aktuellePosition,
                    relevanteSparren: relevanteSparren.filter(pos => pos > aktuellePosition)
                });
            }
            
            window.lattenPlan[reihe] = reihenSegmente;
        }
        
        if (luecken.length > 0) {
            let restPool = [];
            
            for (let luecke of luecken) {
                let gefuellt = false;
                
                for (let i = 0; i < restPool.length; i++) {
                    const restLaenge = restPool[i];
                    
                    let zielSparren = null;
                    for (let sparrenPos of luecke.relevanteSparren) {
                        if (sparrenPos <= luecke.start + restLaenge + 0.05) {
                            zielSparren = sparrenPos;
                            break;
                        }
                    }
                    
                    if (zielSparren && zielSparren >= luecke.ende - 0.05) {
                        window.lattenPlan[luecke.reihe].push({
                            start: luecke.start,
                            ende: luecke.ende,
                            laenge: luecke.benoetigteLattenlaenge,
                            originalLaenge: restLaenge,
                            istRest: true
                        });
                        
                        const neuerRest = restLaenge - luecke.benoetigteLattenlaenge;
                        restPool.splice(i, 1);
                        
                        if (neuerRest > 0.5) {
                            restPool.push(neuerRest);
                            restPool.sort((a, b) => b - a);
                        } else if (neuerRest > 0.01) {
                            gesamtVerschnitt += neuerRest;
                        }
                        
                        gefuellt = true;
                        break;
                    }
                }
                
                if (!gefuellt) {
                    const passendeLatte = tatsaechlichVerfuegbar.find(l => l >= luecke.benoetigteLattenlaenge);
                    if (passendeLatte) {
                        window.lattenPlan[luecke.reihe].push({
                            start: luecke.start,
                            ende: luecke.ende,
                            laenge: luecke.benoetigteLattenlaenge,
                            originalLaenge: passendeLatte,
                            istRest: false
                        });
                        
                        const existierend = materialListe.find(m => m.laenge === passendeLatte);
                        if (existierend) {
                            existierend.anzahl++;
                        } else {
                            materialListe.push({ laenge: passendeLatte, anzahl: 1 });
                        }
                        
                        const neuerRest = passendeLatte - luecke.benoetigteLattenlaenge;
                        if (neuerRest > 0.5) {
                            restPool.push(neuerRest);
                            restPool.sort((a, b) => b - a);
                        } else if (neuerRest > 0.01) {
                            gesamtVerschnitt += neuerRest;
                        }
                    }
                }
            }
            
            gesamtVerschnitt += restPool.reduce((sum, rest) => sum + rest, 0);
        }
    }
    
    const gesamtLaenge = materialListe.reduce((sum, m) => sum + (m.laenge * m.anzahl), 0);
    
    return {
        kombination: materialListe,
        gesamtLaenge: gesamtLaenge,
        verschnitt: gesamtVerschnitt,
        benoetigteLaenge: gesamtBenoetigteLaenge,
        anzahlReihen: anzahlReihen
    };
}

function berechneReihenBreite(fortschritt) {
    switch(dachTyp) {
        case 'rechteck':
            return dachBreite;
            
        case 'trapez':
            return obereBreite + (dachBreite - obereBreite) * (1 - fortschritt);
            
        case 'dreieck':
        case 'gleichschenkliges-dreieck':
        case 'ungleichschenkliges-dreieck':
            return dachBreite * (1 - fortschritt);
            
        case 'trapez-auf-rechteck': {
            const trapezAnteil = trapezHoehe / dachHoehe;
            if (fortschritt >= (1 - trapezAnteil)) {
                // Trapez-Bereich (oben): schmal oben, breit unten
                const trapezFortschritt = (fortschritt - (1 - trapezAnteil)) / trapezAnteil;
                return obereBreite + (dachBreite - obereBreite) * (1 - trapezFortschritt);
            } else {
                // Rechteck-Bereich (unten): volle Breite
                return dachBreite;
            }
        }
            
        default:
            return dachBreite;
    }
}

function optimiereKonterlatten(benoetigteLaenge, verfuegbareLaengen) {
    // Optimierung für Konterlatten: First-Fit-Decreasing (FFD) Bin Packing
    // Da Konterlatten beliebig kurz sein können (keine Auflagepunkt-Anforderung),
    // können wir jeden Rest verwenden - einfach hintereinander reihen

    const sortiert = [...verfuegbareLaengen].sort((a, b) => b - a); // Längste zuerst

    const kombination = [];
    let verbleibendelaenge = benoetigteLaenge;
    let gesamtVerschnitt = 0;

    if (dachTyp === 'trapez') {
        const seitenAbstand = (dachBreite - obereBreite) / 2;
        const schraegeLaenge = Math.sqrt(dachHoehe * dachHoehe + seitenAbstand * seitenAbstand);
        verbleibendelaenge += 2 * schraegeLaenge;
    }

    // FFD Algorithm: Nehme IMMER die längste verfügbare Latte die passt
    while (verbleibendelaenge > 0.01) {
        let besteMatch = null;
        let besteIndex = -1;

        // Finde BESTE (längste) Latte die passt
        for (let i = 0; i < sortiert.length; i++) {
            const laenge = sortiert[i];
            if (laenge <= verbleibendelaenge + 0.01) {
                besteMatch = laenge;
                besteIndex = i;
                break; // Erste in sortierter Liste ist längste
            }
        }

        if (besteMatch !== null) {
            const existierend = kombination.find(k => k.laenge === besteMatch);
            if (existierend) {
                existierend.anzahl++;
            } else {
                kombination.push({ laenge: besteMatch, anzahl: 1 });
            }
            verbleibendelaenge -= besteMatch;
        } else {
            // Nichts passt mehr - verwende kleinste verfügbare
            const kleinste = sortiert[sortiert.length - 1];
            const existierend = kombination.find(k => k.laenge === kleinste);
            if (existierend) {
                existierend.anzahl++;
            } else {
                kombination.push({ laenge: kleinste, anzahl: 1 });
            }
            verbleibendelaenge -= kleinste;
        }
    }

    // Berechne tatsächlichen Verschnitt
    const gesamtLaenge = kombination.reduce((sum, k) => sum + (k.laenge * k.anzahl), 0);
    const verschnitt = Math.max(0, gesamtLaenge - benoetigteLaenge);

    return {
        kombination: kombination,
        gesamtLaenge: gesamtLaenge,
        benoetigteLaenge: benoetigteLaenge,
        verschnitt: verschnitt
    };
}

function zeigeErgebnisse(konterlatten, dachlatten, anzahlLattenReihen, lattenabstand, anzahlSparren) {
    document.getElementById('konterlatte-gesamtlaenge').textContent = konterlatten.gesamtLaenge.toFixed(1) + ' m';
    document.getElementById('konterlatte-anzahl').textContent = konterlatten.kombination.reduce((sum, k) => sum + k.anzahl, 0) + ' Stück';
    document.getElementById('konterlatte-verschnitt').textContent = konterlatten.verschnitt.toFixed(1) + ' m';

    document.getElementById('dachlatte-gesamtlaenge').textContent = dachlatten.gesamtLaenge.toFixed(1) + ' m';
    document.getElementById('dachlatte-anzahl').textContent = dachlatten.kombination.reduce((sum, k) => sum + k.anzahl, 0) + ' Stück';
    document.getElementById('dachlatte-verschnitt').textContent = dachlatten.verschnitt.toFixed(1) + ' m';

    const tbody = document.getElementById('material-details');
    tbody.innerHTML = '';
    
    if (konterlatten && konterlatten.kombination) {
        konterlatten.kombination.forEach(k => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td style="font-weight: bold;">Konterlatten</td>
                <td>${k.laenge.toFixed(1)} m</td>
                <td style="color: #333; font-weight: bold;">${k.anzahl}</td>
                <td style="color: #333; font-weight: bold;">${(k.anzahl * k.laenge).toFixed(1)} m</td>
            `;
            tbody.appendChild(row);
        });
    }
    
    if (dachlatten && dachlatten.kombination) {
        dachlatten.kombination.forEach(k => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td style="font-weight: bold;">Dachlatten</td>
                <td>${k.laenge.toFixed(1)} m</td>
                <td style="color: #333; font-weight: bold;">${k.anzahl}</td>
                <td style="color: #333; font-weight: bold;">${(k.anzahl * k.laenge).toFixed(1)} m</td>
            `;
            tbody.appendChild(row);
        });
    }
                
    document.getElementById('results').style.display = 'block';
    generiereVorschau(anzahlSparren, anzahlLattenReihen, lattenabstand);

    setTimeout(() => {
        document.getElementById('results').scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
}

function generiereVorschau(anzahlSparren, anzahlLattenReihen, lattenabstand) {
    // ⚠️ KRITISCH: Importiere window-Variablen die von astro.astro gesetzt wurden
    if (window.dachBreite !== undefined) dachBreite = window.dachBreite;
    if (window.dachHoehe !== undefined) dachHoehe = window.dachHoehe;
    if (window.dachTyp !== undefined) dachTyp = window.dachTyp;
    if (window.obereBreite !== undefined) obereBreite = window.obereBreite;
    if (window.trapezHoehe !== undefined) trapezHoehe = window.trapezHoehe;
    if (window.rechteckHoehe !== undefined) rechteckHoehe = window.rechteckHoehe;
    if (window.dreieckHoehe !== undefined) dreieckHoehe = window.dreieckHoehe;
    if (window.spitzenPosition !== undefined) spitzenPosition = window.spitzenPosition;
    if (window.dreieckTyp !== undefined) dreieckTyp = window.dreieckTyp;

    const svgWidth = 900;
    const svgHeight = 700;
    const margin = 70;
    const dachStartY = margin + 120;
    // Legend rechts neben der Skizze (nicht unten, um nicht zu überdecken)
    const legendX = svgWidth - 220;
    const legendY = dachStartY;

    // DEBUG: Überprüfe globale Variablen
    console.log('🔍 generiereVorschau DEBUG:', {
        dachBreite,
        dachHoehe,
        dachTyp,
        obereBreite,
        trapezHoehe,
        rechteckHoehe,
        spitzenPosition,
        dreieckTyp
    });

    // scaleX: Platz für Sketch (bis vor die Legend auf der rechten Seite)
    const scaleX = (legendX - margin - 30) / dachBreite;
    // scaleY: Von dachStartY bis zum unteren Ende des SVG minus etwas Abstand
    const scaleY = (svgHeight - margin - 50 - dachStartY) / dachHoehe;

    let svg = `<svg width="${svgWidth}" height="${svgHeight}" viewBox="0 0 ${svgWidth} ${svgHeight}">`;
    svg += `<defs><style>
        .title { font-family: Arial, sans-serif; font-size: 20px; font-weight: bold; fill: #1e3c72; }
        .roofLabel { font-family: Arial, sans-serif; font-size: 14px; font-weight: bold; fill: #333; }
        .legendLabel { font-family: Arial, sans-serif; font-size: 12px; fill: #333; }
        .dimension { font-family: Arial, sans-serif; font-size: 11px; font-weight: bold; fill: #333; }
    </style></defs>`;
    svg += `<rect width="${svgWidth}" height="${svgHeight}" fill="#ffffff" stroke="#ddd" stroke-width="1"/>`;
    svg += `<text x="${svgWidth/2}" y="35" text-anchor="middle" class="title">Dachverlegungsplan Visualisierung</text>`;

    // Dachinfo-Box
    const dachTypDisplay = {
        'rechteck': 'Rechteck',
        'trapez': 'Trapez',
        'dreieck': dreieckTyp === 'ungleichschenkliges' ? 'Dreieck (Ungleichschenklig)' : 'Dreieck (Gleichschenklig)',
        'gleichschenkliges-dreieck': 'Dreieck (Gleichschenklig)',
        'ungleichschenkliges-dreieck': 'Dreieck (Ungleichschenklig)',
        'trapez-auf-rechteck': 'Trapez auf Rechteck',
        'dreieck-auf-rechteck': 'Dreieck auf Rechteck'
    };

    svg += `<rect x="${margin}" y="45" width="250" height="60" fill="#f0f4f8" stroke="#1976d2" stroke-width="1.5" rx="4"/>`;
    svg += `<text x="${margin + 10}" y="65" class="roofLabel">Dachtyp: ${dachTypDisplay[dachTyp] || dachTyp}</text>`;
    svg += `<text x="${margin + 10}" y="85" class="roofLabel">Sparren: ${anzahlSparren} Stück | Reihen: ${anzahlLattenReihen}</text>`;
    svg += `<text x="${margin + 10}" y="100" class="roofLabel">Größe: ${dachBreite.toFixed(1)}m × ${dachHoehe.toFixed(1)}m</text>`;
    
    if (dachTyp === 'trapez') {
        const seitenAbstand = (dachBreite - obereBreite) / 2;
        const trapezObenLinks = margin + seitenAbstand * scaleX;
        const trapezObenRechts = margin + (obereBreite + seitenAbstand) * scaleX;
        const trapezUntenLinks = margin;
        const trapezUntenRechts = margin + dachBreite * scaleX;
        const trapezUntenY = dachStartY + dachHoehe * scaleY;
        
        svg += `<polygon points="${trapezObenLinks},${dachStartY} ${trapezObenRechts},${dachStartY} ${trapezUntenRechts},${trapezUntenY} ${trapezUntenLinks},${trapezUntenY}" fill="none" stroke="#1976d2" stroke-width="2"/>`;
        svg += `<line x1="${trapezObenLinks}" y1="${dachStartY - 15}" x2="${trapezObenRechts}" y2="${dachStartY - 15}" stroke="#333" stroke-width="1.5"/>`;
        svg += `<line x1="${trapezObenLinks}" y1="${dachStartY - 18}" x2="${trapezObenLinks}" y2="${dachStartY - 12}" stroke="#333" stroke-width="1.5"/>`;
        svg += `<line x1="${trapezObenRechts}" y1="${dachStartY - 18}" x2="${trapezObenRechts}" y2="${dachStartY - 12}" stroke="#333" stroke-width="1.5"/>`;
        svg += `<text x="${(trapezObenLinks + trapezObenRechts)/2}" y="${dachStartY - 20}" text-anchor="middle" font-size="11" font-weight="bold" fill="#333">${obereBreite.toFixed(1)}m</text>`;
        
        const linkeSchraegeLaenge = Math.sqrt(dachHoehe * dachHoehe + seitenAbstand * seitenAbstand);
        const linkeMitteX = (trapezObenLinks + trapezUntenLinks) / 2 - 25;
        const linkeMitteY = (dachStartY + trapezUntenY) / 2;
        const linkerWinkel = -Math.atan2(dachHoehe, seitenAbstand) * 180 / Math.PI;
        svg += `<text x="${linkeMitteX}" y="${linkeMitteY}" text-anchor="middle" font-size="11" font-weight="bold" fill="#dc3545" transform="rotate(${linkerWinkel}, ${linkeMitteX}, ${linkeMitteY})">${linkeSchraegeLaenge.toFixed(2)}m</text>`;
        
        const rechteMitteX = (trapezObenRechts + trapezUntenRechts) / 2 + 25;
        const rechteMitteY = (dachStartY + trapezUntenY) / 2;
        const rechterWinkel = Math.atan2(dachHoehe, seitenAbstand) * 180 / Math.PI;
        svg += `<text x="${rechteMitteX}" y="${rechteMitteY}" text-anchor="middle" font-size="11" font-weight="bold" fill="#dc3545" transform="rotate(${rechterWinkel}, ${rechteMitteX}, ${rechteMitteY})">${linkeSchraegeLaenge.toFixed(2)}m</text>`;
        svg += `<line x1="${margin - 20}" y1="${dachStartY}" x2="${margin - 20}" y2="${trapezUntenY}" stroke="#333" stroke-width="1.5"/>`;
        svg += `<line x1="${margin - 23}" y1="${dachStartY}" x2="${margin - 17}" y2="${dachStartY}" stroke="#333" stroke-width="1.5"/>`;
        svg += `<line x1="${margin - 23}" y1="${trapezUntenY}" x2="${margin - 17}" y2="${trapezUntenY}" stroke="#333" stroke-width="1.5"/>`;
        svg += `<text x="${margin - 30}" y="${(dachStartY + trapezUntenY)/2}" text-anchor="middle" font-size="11" font-weight="bold" fill="#333" transform="rotate(-90, ${margin - 30}, ${(dachStartY + trapezUntenY)/2})">${dachHoehe.toFixed(1)}m</text>`;
    } else if (dachTyp === 'dreieck' || dachTyp === 'gleichschenkliges-dreieck' || dachTyp === 'ungleichschenkliges-dreieck') {
        // Berechne Spitzenposition basierend auf dreieckTyp
        let spitzePosX;
        if (dreieckTyp === 'ungleichschenkliges') {
            spitzePosX = spitzenPosition * dachBreite;
        } else {
            spitzePosX = dachBreite / 2;
        }

        const dreieckSpitzeX = margin + spitzePosX * scaleX;
        const dreieckLinksX = margin;
        const dreieckRechtsX = margin + dachBreite * scaleX;
        const dreieckUntenY = dachStartY + dachHoehe * scaleY;

        svg += `<polygon points="${dreieckSpitzeX},${dachStartY} ${dreieckRechtsX},${dreieckUntenY} ${dreieckLinksX},${dreieckUntenY}" fill="none" stroke="#1976d2" stroke-width="2"/>`;

        const linkeAbstand = spitzePosX;
        const rechteAbstand = dachBreite - spitzePosX;

        const linkeSchraegeLaenge = Math.sqrt(dachHoehe * dachHoehe + linkeAbstand * linkeAbstand);
        const linkeMitteX = (dreieckSpitzeX + dreieckLinksX) / 2 - 25;
        const linkeMitteY = (dachStartY + dreieckUntenY) / 2;
        const linkerWinkel = -Math.atan2(dachHoehe, linkeAbstand) * 180 / Math.PI;
        svg += `<text x="${linkeMitteX}" y="${linkeMitteY}" text-anchor="middle" font-size="11" font-weight="bold" fill="#dc3545" transform="rotate(${linkerWinkel}, ${linkeMitteX}, ${linkeMitteY})">${linkeSchraegeLaenge.toFixed(2)}m</text>`;

        const rechteSchraegeLaenge = Math.sqrt(dachHoehe * dachHoehe + rechteAbstand * rechteAbstand);
        const rechteMitteX = (dreieckSpitzeX + dreieckRechtsX) / 2 + 25;
        const rechteMitteY = (dachStartY + dreieckUntenY) / 2;
        const rechterWinkel = Math.atan2(dachHoehe, rechteAbstand) * 180 / Math.PI;
        svg += `<text x="${rechteMitteX}" y="${rechteMitteY}" text-anchor="middle" font-size="11" font-weight="bold" fill="#dc3545" transform="rotate(${rechterWinkel}, ${rechteMitteX}, ${rechteMitteY})">${rechteSchraegeLaenge.toFixed(2)}m</text>`;
        svg += `<line x1="${margin - 20}" y1="${dachStartY}" x2="${margin - 20}" y2="${dreieckUntenY}" stroke="#333" stroke-width="1.5"/>`;
        svg += `<line x1="${margin - 23}" y1="${dachStartY}" x2="${margin - 17}" y2="${dachStartY}" stroke="#333" stroke-width="1.5"/>`;
        svg += `<line x1="${margin - 23}" y1="${dreieckUntenY}" x2="${margin - 17}" y2="${dreieckUntenY}" stroke="#333" stroke-width="1.5"/>`;
        svg += `<text x="${margin - 30}" y="${(dachStartY + dreieckUntenY)/2}" text-anchor="middle" font-size="11" font-weight="bold" fill="#333" transform="rotate(-90, ${margin - 30}, ${(dachStartY + dreieckUntenY)/2})">${dachHoehe.toFixed(1)}m</text>`;
    } else if (dachTyp === 'trapez-auf-rechteck') {
        const seitenAbstand = (dachBreite - obereBreite) / 2;
        const trapezObenLinks = margin + seitenAbstand * scaleX;
        const trapezObenRechts = margin + (obereBreite + seitenAbstand) * scaleX;
        const trapezUntenLinks = margin;
        const trapezUntenRechts = margin + dachBreite * scaleX;
        const trapezObenY = dachStartY;
        const trapezUntenY = dachStartY + trapezHoehe * scaleY;
        const rechteckUntenY = dachStartY + dachHoehe * scaleY;

        svg += `<polygon points="${trapezObenLinks},${trapezObenY} ${trapezObenRechts},${trapezObenY} ${trapezUntenRechts},${trapezUntenY} ${trapezUntenLinks},${trapezUntenY}" fill="none" stroke="#1976d2" stroke-width="2"/>`;
        svg += `<rect x="${margin}" y="${trapezUntenY}" width="${dachBreite * scaleX}" height="${rechteckHoehe * scaleY}" fill="none" stroke="#1976d2" stroke-width="2"/>`;
        svg += `<line x1="${trapezObenLinks}" y1="${trapezObenY - 15}" x2="${trapezObenRechts}" y2="${trapezObenY - 15}" stroke="#333" stroke-width="1.5"/>`;
        svg += `<line x1="${trapezObenLinks}" y1="${trapezObenY - 18}" x2="${trapezObenLinks}" y2="${trapezObenY - 12}" stroke="#333" stroke-width="1.5"/>`;
        svg += `<line x1="${trapezObenRechts}" y1="${trapezObenY - 18}" x2="${trapezObenRechts}" y2="${trapezObenY - 12}" stroke="#333" stroke-width="1.5"/>`;
        svg += `<text x="${(trapezObenLinks + trapezObenRechts)/2}" y="${trapezObenY - 20}" text-anchor="middle" font-size="11" font-weight="bold" fill="#333">${obereBreite.toFixed(1)}m</text>`;
        svg += `<line x1="${margin - 20}" y1="${trapezObenY}" x2="${margin - 20}" y2="${rechteckUntenY}" stroke="#333" stroke-width="1.5"/>`;
        svg += `<line x1="${margin - 23}" y1="${trapezObenY}" x2="${margin - 17}" y2="${trapezObenY}" stroke="#333" stroke-width="1.5"/>`;
        svg += `<line x1="${margin - 23}" y1="${rechteckUntenY}" x2="${margin - 17}" y2="${rechteckUntenY}" stroke="#333" stroke-width="1.5"/>`;
        svg += `<text x="${margin - 30}" y="${(trapezObenY + rechteckUntenY)/2}" text-anchor="middle" font-size="11" font-weight="bold" fill="#333" transform="rotate(-90, ${margin - 30}, ${(trapezObenY + rechteckUntenY)/2})">${dachHoehe.toFixed(1)}m</text>`;
    } else if (dachTyp === 'dreieck-auf-rechteck') {
        // Dreieck auf Rechteck
        let spitzePosX;
        if (dreieckTyp === 'gleichschenkliges') {
            spitzePosX = dachBreite / 2;
        } else {
            spitzePosX = spitzenPosition * dachBreite;
        }

        const dreieckSpitzeX = margin + spitzePosX * scaleX;
        const dreieckLinksX = margin;
        const dreieckRechtsX = margin + dachBreite * scaleX;
        const dreieckObenY = dachStartY;
        const dreieckUntenY = dachStartY + dreieckHoehe * scaleY;
        const rechteckUntenY = dachStartY + dachHoehe * scaleY;

        // Dreieck oben
        svg += `<polygon points="${dreieckSpitzeX},${dreieckObenY} ${dreieckRechtsX},${dreieckUntenY} ${dreieckLinksX},${dreieckUntenY}" fill="none" stroke="#1976d2" stroke-width="2"/>`;
        // Rechteck unten
        svg += `<rect x="${margin}" y="${dreieckUntenY}" width="${dachBreite * scaleX}" height="${rechteckHoehe * scaleY}" fill="none" stroke="#1976d2" stroke-width="2"/>`;

        // Spitzen-Markierung
        svg += `<circle cx="${dreieckSpitzeX}" cy="${dreieckObenY}" r="3" fill="#28a745" opacity="0.8"/>`;

        // Höhen-Markierungen
        svg += `<line x1="${margin - 20}" y1="${dreieckObenY}" x2="${margin - 20}" y2="${rechteckUntenY}" stroke="#333" stroke-width="1.5"/>`;
        svg += `<line x1="${margin - 23}" y1="${dreieckObenY}" x2="${margin - 17}" y2="${dreieckObenY}" stroke="#333" stroke-width="1.5"/>`;
        svg += `<line x1="${margin - 23}" y1="${rechteckUntenY}" x2="${margin - 17}" y2="${rechteckUntenY}" stroke="#333" stroke-width="1.5"/>`;
        svg += `<text x="${margin - 30}" y="${(dreieckObenY + rechteckUntenY)/2}" text-anchor="middle" font-size="11" font-weight="bold" fill="#333" transform="rotate(-90, ${margin - 30}, ${(dreieckObenY + rechteckUntenY)/2})">${dachHoehe.toFixed(1)}m</text>`;

        // Breiten-Markierung (unten)
        svg += `<line x1="${dreieckLinksX}" y1="${rechteckUntenY + 15}" x2="${dreieckRechtsX}" y2="${rechteckUntenY + 15}" stroke="#333" stroke-width="1.5"/>`;
        svg += `<line x1="${dreieckLinksX}" y1="${rechteckUntenY + 12}" x2="${dreieckLinksX}" y2="${rechteckUntenY + 18}" stroke="#333" stroke-width="1.5"/>`;
        svg += `<line x1="${dreieckRechtsX}" y1="${rechteckUntenY + 12}" x2="${dreieckRechtsX}" y2="${rechteckUntenY + 18}" stroke="#333" stroke-width="1.5"/>`;
        svg += `<text x="${(dreieckLinksX + dreieckRechtsX)/2}" y="${rechteckUntenY + 30}" text-anchor="middle" font-size="11" font-weight="bold" fill="#333">${dachBreite.toFixed(1)}m</text>`;
    } else {
        svg += `<rect x="${margin}" y="${dachStartY}" width="${dachBreite * scaleX}" height="${dachHoehe * scaleY}" fill="none" stroke="#1976d2" stroke-width="2"/>`;
        svg += `<line x1="${margin - 20}" y1="${dachStartY}" x2="${margin - 20}" y2="${dachStartY + dachHoehe * scaleY}" stroke="#333" stroke-width="1.5"/>`;
        svg += `<line x1="${margin - 23}" y1="${dachStartY}" x2="${margin - 17}" y2="${dachStartY}" stroke="#333" stroke-width="1.5"/>`;
        svg += `<line x1="${margin - 23}" y1="${dachStartY + dachHoehe * scaleY}" x2="${margin - 17}" y2="${dachStartY + dachHoehe * scaleY}" stroke="#333" stroke-width="1.5"/>`;
        svg += `<text x="${margin - 30}" y="${dachStartY + dachHoehe * scaleY / 2}" text-anchor="middle" font-size="11" font-weight="bold" fill="#333" transform="rotate(-90, ${margin - 30}, ${dachStartY + dachHoehe * scaleY / 2})">${dachHoehe.toFixed(1)}m</text>`;
    }
    
    for (let i = 0; i < anzahlSparren && i < sparrenPositionen.length; i++) {
        const sparrenX = margin + sparrenPositionen[i] * scaleX;
        let sparrenY = dachStartY;
        let sparrenHeight = dachHoehe * scaleY;
        
        if (sparrenLaengen[i] !== undefined) {
            sparrenHeight = sparrenLaengen[i] * scaleY;
            if (dachTyp === 'trapez' || dachTyp === 'trapez-auf-rechteck' || dachTyp === 'dreieck-auf-rechteck' || dachTyp === 'dreieck' || dachTyp === 'gleichschenkliges-dreieck' || dachTyp === 'ungleichschenkliges-dreieck') {
                sparrenY = dachStartY + (dachHoehe - sparrenLaengen[i]) * scaleY;
            }
        }
        
        svg += `<rect x="${sparrenX - 2}" y="${sparrenY}" width="4" height="${sparrenHeight}" fill="#666" opacity="0.8"/>`;
        svg += `<rect x="${sparrenX - 1}" y="${sparrenY}" width="2" height="${sparrenHeight}" fill="#ff6b35" opacity="0.9"/>`;
    }
    
    if (dachTyp === 'trapez') {
        const seitenAbstand = (dachBreite - obereBreite) / 2;
        const linkeObenX = margin + seitenAbstand * scaleX;
        const rechteObenX = margin + (dachBreite - seitenAbstand) * scaleX;
        const untenY = dachStartY + dachHoehe * scaleY;
        
        svg += `<line x1="${linkeObenX}" y1="${dachStartY}" x2="${margin}" y2="${untenY}" stroke="#ff6b35" stroke-width="2" opacity="0.9"/>`;
        svg += `<line x1="${rechteObenX}" y1="${dachStartY}" x2="${margin + dachBreite * scaleX}" y2="${untenY}" stroke="#ff6b35" stroke-width="2" opacity="0.9"/>`;
    } else if (dachTyp === 'dreieck' || dachTyp === 'gleichschenkliges-dreieck' || dachTyp === 'ungleichschenkliges-dreieck') {
        let spitzePosXEdge;
        if (dreieckTyp === 'ungleichschenkliges') {
            spitzePosXEdge = spitzenPosition * dachBreite;
        } else {
            spitzePosXEdge = dachBreite / 2;
        }
        const spitzeX = margin + spitzePosXEdge * scaleX;
        const untenY = dachStartY + dachHoehe * scaleY;

        svg += `<line x1="${spitzeX}" y1="${dachStartY}" x2="${margin}" y2="${untenY}" stroke="#ff6b35" stroke-width="2" opacity="0.9"/>`;
        svg += `<line x1="${spitzeX}" y1="${dachStartY}" x2="${margin + dachBreite * scaleX}" y2="${untenY}" stroke="#ff6b35" stroke-width="2" opacity="0.9"/>`;
    } else if (dachTyp === 'trapez-auf-rechteck') {
        const trapezObenY = dachStartY;
        const trapezUntenY = dachStartY + trapezHoehe * scaleY;
        const seitenAbstand = (dachBreite - obereBreite) / 2;
        const linkeObenX = margin + seitenAbstand * scaleX;
        const rechteObenX = margin + (dachBreite - seitenAbstand) * scaleX;
        
        svg += `<line x1="${linkeObenX}" y1="${trapezObenY}" x2="${margin}" y2="${trapezUntenY}" stroke="#ff6b35" stroke-width="2" opacity="0.9"/>`;
        svg += `<line x1="${rechteObenX}" y1="${trapezObenY}" x2="${margin + dachBreite * scaleX}" y2="${trapezUntenY}" stroke="#ff6b35" stroke-width="2" opacity="0.9"/>`;
    }
    
    const lattenFarben = { 6: '#9b59b6', 5: '#3498db', 4: '#f39c12', 3: '#27ae60' };
    const restFarbe = '#e74c3c';
    
    for (let i = 0; i < anzahlLattenReihen; i++) {
        const fortschritt = (anzahlLattenReihen - 1 - i) / Math.max(1, anzahlLattenReihen - 1);
        const reihenBreite = berechneReihenBreite(fortschritt);
        const lattenY = dachStartY + (1 - fortschritt) * dachHoehe * scaleY;

        let reihenStartAbsolut = (dachBreite - reihenBreite) / 2;
        if ((dachTyp === 'dreieck' || dachTyp === 'gleichschenkliges-dreieck' || dachTyp === 'ungleichschenkliges-dreieck') && dreieckTyp === 'ungleichschenkliges') {
            const peakPos = spitzenPosition * dachBreite;
            reihenStartAbsolut = fortschritt * peakPos;
        }
        const reihenStartX = margin + reihenStartAbsolut * scaleX;
        
        if (window.lattenPlan && window.lattenPlan[i]) {
            const segmente = window.lattenPlan[i];
            
            for (let j = 0; j < segmente.length; j++) {
                const segment = segmente[j];
                const segmentStartX = reihenStartX + segment.start * scaleX;
                const segmentEndX = reihenStartX + segment.ende * scaleX;
                const segmentFarbe = segment.istRest ? restFarbe : (lattenFarben[segment.originalLaenge] || '#27ae60');
                
                svg += `<line x1="${segmentStartX}" y1="${lattenY}" x2="${segmentEndX}" y2="${lattenY}" stroke="${segmentFarbe}" stroke-width="4" opacity="0.9"/>`;
                
                if (j < segmente.length - 1) {
                    svg += `<line x1="${segmentEndX}" y1="${lattenY - 6}" x2="${segmentEndX}" y2="${lattenY + 6}" stroke="#1976d2" stroke-width="3"/>`;
                }
                
                if (segment.istRest) {
                    const mitteX = segmentStartX + (segmentEndX - segmentStartX) / 2;
                    svg += `<text x="${mitteX}" y="${lattenY - 8}" text-anchor="middle" font-size="8" font-weight="bold" fill="#dc3545">R</text>`;
                }
            }
        }
    }
    
    const breiteY = dachStartY + dachHoehe * scaleY + 40;
    svg += `<line x1="${margin}" y1="${breiteY}" x2="${margin + dachBreite * scaleX}" y2="${breiteY}" stroke="#333" stroke-width="2"/>`;
    svg += `<line x1="${margin}" y1="${breiteY - 5}" x2="${margin}" y2="${breiteY + 5}" stroke="#333" stroke-width="2"/>`;
    svg += `<line x1="${margin + dachBreite * scaleX}" y1="${breiteY - 5}" x2="${margin + dachBreite * scaleX}" y2="${breiteY + 5}" stroke="#333" stroke-width="2"/>`;
    svg += `<text x="${margin + dachBreite * scaleX/2}" y="${breiteY + 20}" text-anchor="middle" class="dimension">Breite: ${dachBreite.toFixed(1)}m</text>`;

    // Legend für Latten-Längen und Elemente - rechts neben der Skizze
    const legendWidth = 200;
    const legendHeight = 130;

    // Latten-Farben-Box
    svg += `<rect x="${legendX}" y="${legendY}" width="${legendWidth}" height="${legendHeight}" fill="#f9f9f9" stroke="#1976d2" stroke-width="1.5" rx="4"/>`;
    svg += `<text x="${legendX + 10}" y="${legendY + 20}" class="legendLabel" style="font-weight: bold; font-size: 11px;">Latten-Längen:</text>`;

    let legendY_current = legendY + 38;
    [6, 5, 4, 3].forEach(laenge => {
        if (lattenFarben[laenge]) {
            svg += `<rect x="${legendX + 10}" y="${legendY_current - 8}" width="10" height="10" fill="${lattenFarben[laenge]}" stroke="#333" stroke-width="0.5"/>`;
            svg += `<text x="${legendX + 25}" y="${legendY_current}" class="legendLabel" style="font-size: 10px;">${laenge}m</text>`;
            legendY_current += 14;
        }
    });

    svg += `<rect x="${legendX + 10}" y="${legendY_current - 8}" width="10" height="10" fill="${restFarbe}" stroke="#333" stroke-width="0.5"/>`;
    svg += `<text x="${legendX + 25}" y="${legendY_current}" class="legendLabel" style="font-size: 10px;">Rest</text>`;

    // Elemente-Box darunter
    const elementsBoxY = legendY + legendHeight + 15;
    svg += `<rect x="${legendX}" y="${elementsBoxY}" width="${legendWidth}" height="100" fill="#f9f9f9" stroke="#ff6b35" stroke-width="1.5" rx="4"/>`;
    svg += `<text x="${legendX + 10}" y="${elementsBoxY + 20}" class="legendLabel" style="font-weight: bold; font-size: 11px;">Elemente:</text>`;
    svg += `<rect x="${legendX + 10}" y="${elementsBoxY + 28}" width="3" height="16" fill="#ff6b35" opacity="0.9"/>`;
    svg += `<text x="${legendX + 20}" y="${elementsBoxY + 42}" class="legendLabel" style="font-size: 10px;">Sparren</text>`;
    svg += `<line x1="${legendX + 10}" y1="${elementsBoxY + 60}" x2="${legendX + 20}" y2="${elementsBoxY + 60}" stroke="#1976d2" stroke-width="2"/>`;
    svg += `<text x="${legendX + 25}" y="${elementsBoxY + 65}" class="legendLabel" style="font-size: 10px;">Stoß</text>`;

    svg += `</svg>`;

    // Schreibe ins DOM (falls Element existiert) UND returne den String
    const vorschauDiv = document.getElementById('vorschau-svg');
    if (vorschauDiv) {
        vorschauDiv.innerHTML = svg;
    }
    return svg;
}

function druckeLattenplan() {
    const druckInhalt = `<!DOCTYPE html><html><head><title>Lattenplan</title><style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        h2 { color: #1e3c72; margin-bottom: 20px; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th, td { border: 1px solid #ddd; padding: 10px; text-align: left; }
        th { background-color: #f5f5f5; font-weight: bold; }
    </style></head><body>
        <h2>Lattenplan</h2>
        <p><strong>Dach:</strong> ${dachBreite}m × ${dachHoehe}m (${dachTyp})</p>
        <div style="text-align: center; margin: 20px 0;">
            ${document.getElementById('vorschau-svg').innerHTML}
        </div>
        <table><thead><tr><th>Material</th><th>Länge</th><th>Anzahl</th><th>Gesamtlänge</th></tr></thead>
            ${document.getElementById('material-details').outerHTML.replace('<tbody id="material-details">', '<tbody>')}
        </table>
    </body></html>`;
    
    const druckFenster = window.open('', '_blank');
    druckFenster.document.write(druckInhalt);
    druckFenster.document.close();
    
    setTimeout(() => {
        druckFenster.print();
        druckFenster.close();
    }, 500);
}

function berechnen() {
    // ⚠️ KRITISCH: Importiere window-Variablen die von astro.astro gesetzt wurden
    // astro setzt diese als window.*, aber berechne() benutzt lokale Variablen
    if (window.dachBreite !== undefined) dachBreite = window.dachBreite;
    if (window.dachHoehe !== undefined) dachHoehe = window.dachHoehe;
    if (window.dachTyp !== undefined) dachTyp = window.dachTyp;
    if (window.obereBreite !== undefined) obereBreite = window.obereBreite;
    if (window.trapezHoehe !== undefined) trapezHoehe = window.trapezHoehe;
    if (window.rechteckHoehe !== undefined) rechteckHoehe = window.rechteckHoehe;
    if (window.dreieckHoehe !== undefined) dreieckHoehe = window.dreieckHoehe;
    if (window.spitzenPosition !== undefined) spitzenPosition = window.spitzenPosition;
    if (window.dreieckTyp !== undefined) dreieckTyp = window.dreieckTyp;

    console.log('📥 berechnen() - Importierte window-Variablen:', {
        dachBreite, dachHoehe, dachTyp, dreieckTyp, spitzenPosition
    });

    const anzahlSparren = parseInt(document.getElementById('anzahl-sparren').value);
    const sparrenAbstand = parseFloat(document.getElementById('sparren-abstand').value);
    const dachueberstand = parseFloat(document.getElementById('dachueberstand').value) || 0;
    const lattenabstandSelect = document.getElementById('lattenabstand');

    if (!anzahlSparren || anzahlSparren < 2) {
        alert('Bitte geben Sie eine gültige Anzahl Sparren ein (mindestens 2)!');
        return;
    }

    if (!sparrenAbstand || sparrenAbstand <= 0) {
        alert('Bitte geben Sie einen gültigen Sparren-Abstand ein!');
        return;
    }

    if (typeof gtag !== 'undefined') {
        gtag('event', 'calculation', {
            'event_category': 'lattenrechner',
            'event_label': 'latten_berechnung_durchgeführt'
        });
    }

    let lattenabstand;
    if (lattenabstandSelect.value === 'custom') {
        lattenabstand = parseFloat(document.getElementById('custom-lattenabstand').value);
        if (!lattenabstand) {
            alert('Bitte geben Sie einen benutzerdefinierten Lattenabstand ein!');
            return;
        }
    } else {
        lattenabstand = parseFloat(lattenabstandSelect.value);
    }

    const verfuegbareKonterlatten = [];
    const verfuegbareDachlatten = [];
    
    [3, 4, 5, 6].forEach(laenge => {
        const konterlatteCheckbox = document.getElementById(`konterlatte-${laenge}m`);
        const dachlatteCheckbox = document.getElementById(`dachlatte-${laenge}m`);
        
        if (konterlatteCheckbox && konterlatteCheckbox.checked) {
            verfuegbareKonterlatten.push(laenge);
        }
        if (dachlatteCheckbox && dachlatteCheckbox.checked) {
            verfuegbareDachlatten.push(laenge);
        }
    });

    if (verfuegbareKonterlatten.length === 0) {
        alert('Bitte wählen Sie mindestens eine Konterlattenlänge aus!');
        return;
    }
    
    if (verfuegbareDachlatten.length === 0) {
        alert('Bitte wählen Sie mindestens eine Dachlattenlänge aus!');
        return;
    }

    berechneSparrenPositionen(anzahlSparren, sparrenAbstand, dachueberstand);
    berechneSpitzdachSparren(anzahlSparren);

    const konterlattenGesamtlaenge = sparrenLaengen.reduce((sum, laenge) => sum + laenge, 0);
    const konterlattenKombination = optimiereKonterlatten(konterlattenGesamtlaenge, verfuegbareKonterlatten);

    const anzahlLattenReihen = Math.ceil((dachHoehe * 1000) / lattenabstand) + 1;
    const dachlattenKombination = berechneDachlattenIntelligent(sparrenPositionen, lattenabstand, verfuegbareDachlatten, anzahlLattenReihen);

    zeigeErgebnisse(konterlattenKombination, dachlattenKombination, anzahlLattenReihen, lattenabstand, anzahlSparren);
}

function zuVerschnitt() {
    window.location.href = '/tools/verschnitt-optimierung/';
}

function zuPVRechner() {
    const params = new URLSearchParams({
        breite: dachBreite,
        hoehe: dachHoehe,
    });
    window.location.href = `/tools/pv-rechner/?${params.toString()}`;
}

// ============= EXPORT FÜR ASTRO-UTILITY =============
// Wrapper-Objekt für die Nutzung in lattenrechner.astro

window.lattenrechner = {
  berechne: function(params) {
    try {
      const roofDims = params.roofDims;
      dachBreite = roofDims.width;
      dachHoehe = roofDims.height;
      dachTyp = roofDims.type;
      obereBreite = roofDims.upperWidth || 0;
      trapezHoehe = roofDims.trapezHeight || 0;
      rechteckHoehe = roofDims.rectHeight || 0;
      if (roofDims.spitzenPosition !== undefined) spitzenPosition = roofDims.spitzenPosition;
      if (roofDims.dreieckType) dreieckTyp = roofDims.dreieckType;

      // Berechne Sparren
      berechneSparrenPositionen(params.rafterCount, params.rafterSpacing, params.overhang);
      berechneSpitzdachSparren(params.rafterCount);

      // Berechne Konterlatten
      const konterlattenGesamtlaenge = sparrenLaengen.reduce((sum, laenge) => sum + laenge, 0);
      const counterResult = optimiereKonterlatten(konterlattenGesamtlaenge, params.availableCounters);

      // Berechne Dachlatten
      const anzahlLattenReihen = Math.ceil((dachHoehe * 1000) / params.rowSpacing) + 1;
      const roofResult = berechneDachlattenIntelligent(sparrenPositionen, params.rowSpacing, params.availableRafters, anzahlLattenReihen);

      // counterResult hat { kombination: [...{ laenge, anzahl }], gesamtLaenge, verschnitt }
      const counterCount = counterResult.kombination.reduce((sum, m) => sum + (m.anzahl || 1), 0);
      const counterTotal = counterResult.gesamtLaenge || 0;

      // roofResult hat auch { kombination: [...{ laenge, anzahl }], gesamtLaenge, verschnitt }
      const roofCount = roofResult.kombination.reduce((sum, m) => sum + (m.anzahl || 1), 0);
      const roofTotal = roofResult.gesamtLaenge || 0;

      console.log('✅ Berechnung erfolgreich abgeschlossen');
      console.log('Konterlatten:', counterTotal, 'm,', counterCount, 'Stück');
      console.log('Dachlatten:', roofTotal, 'm,', roofCount, 'Stück');

      return {
        counterRafters: {
          totalLength: counterTotal,
          count: counterCount,
          waste: counterResult.verschnitt || 0,
          materials: counterResult.kombination.map(m => ({ length: m.laenge, count: m.anzahl || 1 }))
        },
        roofRafters: {
          totalLength: roofTotal,
          count: roofCount,
          waste: roofResult.verschnitt || 0,
          materials: roofResult.kombination.map(m => ({ length: m.laenge, count: m.anzahl || 1 })),
          plan: roofResult.lattenPlan || {}
        },
        roofArea: dachBreite * dachHoehe,
        rowCount: anzahlLattenReihen
      };
    } catch (e) {
      console.error('❌ Fehler in berechne():', e.message, e.stack);
      throw e;
    }
  },

  generiereVorschau: function(result, roofDims, rafterCount, rowSpacing) {
    try {
      // Setze globale Werte für die Rendering-Funktion
      dachBreite = roofDims.width;
      dachHoehe = roofDims.height;
      dachTyp = roofDims.type;
      obereBreite = roofDims.upperWidth || 0;
      trapezHoehe = roofDims.trapezHeight || 0;
      rechteckHoehe = roofDims.rectHeight || 0;
      if (roofDims.spitzenPosition !== undefined) spitzenPosition = roofDims.spitzenPosition;
      if (roofDims.dreieckType) dreieckTyp = roofDims.dreieckType;

      // Berechne Sparren-Längen für den Dachtyp (notwendig für korrektes SVG-Rendering!)
      berechneSpitzdachSparren(rafterCount);

      // window.lattenPlan wird bereits von berechneDachlattenIntelligent() gesetzt
      console.log(`🎨 Generiere SVG für ${dachTyp} (${rafterCount} Sparren)`);
      console.log('📋 window.lattenPlan hat', Array.isArray(window.lattenPlan) ? window.lattenPlan.length : Object.keys(window.lattenPlan || {}).length, 'Reihen');
      return generiereVorschau(rafterCount, result.rowCount, rowSpacing || 600);
    } catch (e) {
      console.error('❌ Fehler in generiereVorschau():', e.message, e.stack);
      throw e;
    }
  }
};

// Nur bei DOMContentLoaded ausführen wenn echte HTML-Seite
if (typeof document !== 'undefined' && document.readyState !== 'loading') {
  // Seite wird nicht als Astro geladen
  document.addEventListener('DOMContentLoaded', function() {
    ladeDachParameter();
    aktualisiereLattenabstandsfeld();
    aktualisiereAutomatischeSparrenBerechnung();
  });
}
