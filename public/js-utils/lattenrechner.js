let dachBreite = 10;
let dachHoehe = 6;
let dachTyp = 'rechteck';
let obereBreite = 0;
let trapezHoehe = 0;
let rechteckHoehe = 0;
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
            const halbBreite = dachBreite / 2;
            
            for (let i = 0; i < anzahlSparren; i++) {
                const xPosition = sparrenPositionen[i];
                let sparrenLaenge;
                
                if (xPosition <= halbBreite) {
                    sparrenLaenge = (xPosition / halbBreite) * dachHoehe;
                } else {
                    sparrenLaenge = ((dachBreite - xPosition) / halbBreite) * dachHoehe;
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
            
            // Finde beste Kombination
            let besteKombination = null;
            let minVerschnitt = Infinity;
            
            for (let i = 0; i < tatsaechlichVerfuegbar.length; i++) {
                if (tatsaechlichVerfuegbar[i] >= reihenBreite - 0.01) {
                    const verschnitt = tatsaechlichVerfuegbar[i] - reihenBreite;
                    if (verschnitt < minVerschnitt) {
                        minVerschnitt = verschnitt;
                        besteKombination = [tatsaechlichVerfuegbar[i]];
                    }
                }
            }
            
            for (let i = 0; i < tatsaechlichVerfuegbar.length; i++) {
                for (let j = i; j < tatsaechlichVerfuegbar.length; j++) {
                    const summe = tatsaechlichVerfuegbar[i] + tatsaechlichVerfuegbar[j];
                    if (summe >= reihenBreite - 0.01) {
                        const verschnitt = summe - reihenBreite;
                        if (verschnitt < minVerschnitt) {
                            minVerschnitt = verschnitt;
                            besteKombination = [tatsaechlichVerfuegbar[i], tatsaechlichVerfuegbar[j]];
                        }
                    }
                }
            }
            
            for (let i = 0; i < tatsaechlichVerfuegbar.length; i++) {
                for (let j = i; j < tatsaechlichVerfuegbar.length; j++) {
                    for (let k = j; k < tatsaechlichVerfuegbar.length; k++) {
                        const summe = tatsaechlichVerfuegbar[i] + tatsaechlichVerfuegbar[j] + tatsaechlichVerfuegbar[k];
                        if (summe >= reihenBreite - 0.01) {
                            const verschnitt = summe - reihenBreite;
                            if (verschnitt < minVerschnitt) {
                                minVerschnitt = verschnitt;
                                besteKombination = [tatsaechlichVerfuegbar[i], tatsaechlichVerfuegbar[j], tatsaechlichVerfuegbar[k]];
                            }
                        }
                    }
                }
            }
            
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
            
            const reihenStartAbsolut = (dachBreite - reihenBreite) / 2;
            const relevanteSparren = sparrenPositionen.filter(pos => 
                pos >= reihenStartAbsolut - 0.05 && pos <= reihenStartAbsolut + reihenBreite + 0.05
            ).map(pos => pos - reihenStartAbsolut).sort((a, b) => a - b);
            
            if (relevanteSparren.length === 0 || relevanteSparren[0] > 0.05) {
                relevanteSparren.unshift(0);
            }
            if (relevanteSparren[relevanteSparren.length - 1] < reihenBreite - 0.05) {
                relevanteSparren.push(reihenBreite);
            }
            
            let besteKombination = null;
            let minVerschnitt = Infinity;
            
            for (let i = 0; i < tatsaechlichVerfuegbar.length; i++) {
                const summe = tatsaechlichVerfuegbar[i];
                if (summe >= reihenBreite - 0.01) {
                    const verschnitt = summe - reihenBreite;
                    if (verschnitt < minVerschnitt) {
                        minVerschnitt = verschnitt;
                        besteKombination = [tatsaechlichVerfuegbar[i]];
                    }
                }
            }
            
            for (let i = 0; i < tatsaechlichVerfuegbar.length; i++) {
                for (let j = i; j < tatsaechlichVerfuegbar.length; j++) {
                    const summe = tatsaechlichVerfuegbar[i] + tatsaechlichVerfuegbar[j];
                    if (summe >= reihenBreite - 0.01) {
                        const verschnitt = summe - reihenBreite;
                        if (verschnitt < minVerschnitt) {
                            minVerschnitt = verschnitt;
                            besteKombination = [tatsaechlichVerfuegbar[i], tatsaechlichVerfuegbar[j]];
                        }
                    }
                }
            }
            
            for (let i = 0; i < tatsaechlichVerfuegbar.length; i++) {
                for (let j = i; j < tatsaechlichVerfuegbar.length; j++) {
                    for (let k = j; k < tatsaechlichVerfuegbar.length; k++) {
                        const summe = tatsaechlichVerfuegbar[i] + tatsaechlichVerfuegbar[j] + tatsaechlichVerfuegbar[k];
                        if (summe >= reihenBreite - 0.01) {
                            const verschnitt = summe - reihenBreite;
                            if (verschnitt < minVerschnitt) {
                                minVerschnitt = verschnitt;
                                besteKombination = [tatsaechlichVerfuegbar[i], tatsaechlichVerfuegbar[j], tatsaechlichVerfuegbar[k]];
                            }
                        }
                    }
                }
            }
            
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
    verfuegbareLaengen.sort((a, b) => b - a);
    
    const kombination = [];
    let verbleibendelaenge = benoetigteLaenge;
    
    if (dachTyp === 'trapez') {
        const seitenAbstand = (dachBreite - obereBreite) / 2;
        const schraegeLaenge = Math.sqrt(dachHoehe * dachHoehe + seitenAbstand * seitenAbstand);
        verbleibendelaenge += 2 * schraegeLaenge;
    }
    
    while (verbleibendelaenge > 0) {
        let gefunden = false;
        for (let laenge of verfuegbareLaengen) {
            if (laenge <= verbleibendelaenge + 0.01) {
                const existierend = kombination.find(k => k.laenge === laenge);
                if (existierend) {
                    existierend.anzahl++;
                } else {
                    kombination.push({ laenge: laenge, anzahl: 1 });
                }
                verbleibendelaenge -= laenge;
                gefunden = true;
                break;
            }
        }
        
        if (!gefunden) {
            const kleinste = Math.min(...verfuegbareLaengen);
            const existierend = kombination.find(k => k.laenge === kleinste);
            if (existierend) {
                existierend.anzahl++;
            } else {
                kombination.push({ laenge: kleinste, anzahl: 1 });
            }
            verbleibendelaenge -= kleinste;
        }
    }
    
    const gesamtLaenge = kombination.reduce((sum, k) => sum + (k.laenge * k.anzahl), 0);
    const verschnitt = gesamtLaenge - benoetigteLaenge;
    
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
    const svgWidth = 900;
    const svgHeight = 700;
    const margin = 70;
    const legendX = margin + 20;
    const legendY = svgHeight - 150;
    const dachStartY = margin + 120;

    const scaleX = (svgWidth - 2 * margin - 180) / dachBreite;
    const scaleY = (legendY - dachStartY) / dachHoehe;

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
        'dreieck': 'Dreieck (Gleichschenklig)',
        'gleichschenkliges-dreieck': 'Dreieck (Gleichschenklig)',
        'ungleichschenkliges-dreieck': 'Dreieck (Ungleichschenklig)',
        'trapez-auf-rechteck': 'Trapez auf Rechteck'
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
        const dreieckSpitzeX = margin + (dachBreite / 2) * scaleX;
        const dreieckLinksX = margin;
        const dreieckRechtsX = margin + dachBreite * scaleX;
        const dreieckUntenY = dachStartY + dachHoehe * scaleY;
        
        svg += `<polygon points="${dreieckSpitzeX},${dachStartY} ${dreieckRechtsX},${dreieckUntenY} ${dreieckLinksX},${dreieckUntenY}" fill="none" stroke="#1976d2" stroke-width="2"/>`;
        
        const linkeSchraegeLaenge = Math.sqrt(dachHoehe * dachHoehe + (dachBreite/2) * (dachBreite/2));
        const linkeMitteX = (dreieckSpitzeX + dreieckLinksX) / 2 - 25;
        const linkeMitteY = (dachStartY + dreieckUntenY) / 2;
        const linkerWinkel = -Math.atan2(dachHoehe, dachBreite/2) * 180 / Math.PI;
        svg += `<text x="${linkeMitteX}" y="${linkeMitteY}" text-anchor="middle" font-size="11" font-weight="bold" fill="#dc3545" transform="rotate(${linkerWinkel}, ${linkeMitteX}, ${linkeMitteY})">${linkeSchraegeLaenge.toFixed(2)}m</text>`;
        
        const rechteMitteX = (dreieckSpitzeX + dreieckRechtsX) / 2 + 25;
        const rechteMitteY = (dachStartY + dreieckUntenY) / 2;
        const rechterWinkel = Math.atan2(dachHoehe, dachBreite/2) * 180 / Math.PI;
        svg += `<text x="${rechteMitteX}" y="${rechteMitteY}" text-anchor="middle" font-size="11" font-weight="bold" fill="#dc3545" transform="rotate(${rechterWinkel}, ${rechteMitteX}, ${rechteMitteY})">${linkeSchraegeLaenge.toFixed(2)}m</text>`;
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
            if (dachTyp === 'trapez' || dachTyp === 'trapez-auf-rechteck' || dachTyp === 'dreieck' || dachTyp === 'gleichschenkliges-dreieck' || dachTyp === 'ungleichschenkliges-dreieck') {
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
        const spitzeX = margin + (dachBreite / 2) * scaleX;
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
        
        const reihenStartAbsolut = (dachBreite - reihenBreite) / 2;
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

    // Legend für Latten-Längen
    svg += `<rect x="${legendX}" y="${legendY}" width="300" height="130" fill="#f9f9f9" stroke="#1976d2" stroke-width="1.5" rx="4"/>`;
    svg += `<text x="${legendX + 10}" y="${legendY + 25}" class="roofLabel">Latten-Längen (Farben):</text>`;

    let legendY_current = legendY + 50;
    [6, 5, 4, 3].forEach(laenge => {
        if (lattenFarben[laenge]) {
            svg += `<rect x="${legendX + 15}" y="${legendY_current - 8}" width="12" height="12" fill="${lattenFarben[laenge]}" stroke="#333" stroke-width="0.5"/>`;
            svg += `<text x="${legendX + 35}" y="${legendY_current}" class="legendLabel">${laenge}m Latten</text>`;
            legendY_current += 18;
        }
    });

    svg += `<rect x="${legendX + 15}" y="${legendY_current - 8}" width="12" height="12" fill="${restFarbe}" stroke="#333" stroke-width="0.5"/>`;
    svg += `<text x="${legendX + 35}" y="${legendY_current}" class="legendLabel">Rest/Verschnitt</text>`;

    // Sparren-Legende
    svg += `<rect x="${legendX + 170}" y="${legendY}" width="120" height="130" fill="#f9f9f9" stroke="#ff6b35" stroke-width="1.5" rx="4"/>`;
    svg += `<text x="${legendX + 180}" y="${legendY + 25}" class="roofLabel">Elemente:</text>`;
    svg += `<rect x="${legendX + 185}" y="${legendY + 40}" width="4" height="20" fill="#ff6b35" opacity="0.9"/>`;
    svg += `<text x="${legendX + 200}" y="${legendY + 55}" class="legendLabel">Sparren</text>`;
    svg += `<line x1="${legendX + 185}" y1="${legendY + 75}" x2="${legendX + 195}" y2="${legendY + 75}" stroke="#1976d2" stroke-width="3"/>`;
    svg += `<text x="${legendX + 200}" y="${legendY + 80}" class="legendLabel">Stoß</text>`;

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
    
    const anzahlLattenReihen = Math.ceil((dachHoehe * 100) / lattenabstand) + 1;
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

      // Berechne Sparren
      berechneSparrenPositionen(params.rafterCount, params.rafterSpacing, params.overhang);
      berechneSpitzdachSparren(params.rafterCount);

      // Berechne Konterlatten
      const konterlattenGesamtlaenge = sparrenLaengen.reduce((sum, laenge) => sum + laenge, 0);
      const counterResult = optimiereKonterlatten(konterlattenGesamtlaenge, params.availableCounters);

      // Berechne Dachlatten
      const anzahlLattenReihen = Math.ceil((dachHoehe * 100) / params.rowSpacing) + 1;
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

      // Berechne Sparren-Längen für den Dachtyp (notwendig für korrektes SVG-Rendering!)
      berechneSpitzdachSparren(rafterCount);

      console.log(`🎨 Generiere SVG für ${dachTyp} (${rafterCount} Sparren)`);
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
