let dachBreite = 10;
let dachHoehe = 6;
let dachTyp = 'rechteck';
let obereBreite = 0;
let trapezHoehe = 0;
let rechteckHoehe = 0;
let sparrenLaengen = [];
let sparrenPositionen = [];

function loadAdSense() {
    // AdSense-Initialisierung (falls benötigt)
    console.log('AdSense wird geladen...');
}

function loadAnalytics() {
    // Analytics-Initialisierung (falls benötigt)
    console.log('Analytics wird geladen...');
}

function showAds() {
    document.getElementById('top-ad-container').style.display = 'block';
    document.getElementById('middle-ad-container').style.display = 'block';
    document.getElementById('bottom-ad-container').style.display = 'block';
    
    const allowPersonalized = localStorage.getItem('marketingCookies') === 'true';
    
    setTimeout(function() {
        if (window.adsbygoogle) {
            try {
                const ads = document.querySelectorAll('.adsbygoogle');
                ads.forEach(ad => {
                    if (!ad.getAttribute('data-ad-status') && !ad.hasAttribute('data-adsbygoogle-status')) {
                        if (!allowPersonalized) {
                            ad.setAttribute('data-npa', '1');
                        }
                        (window.adsbygoogle = window.adsbygoogle || []).push({});
                    }
                });
            } catch (e) {
                console.log('AdSense loading error:', e);
            }
        }
    }, 1000);
}

function ladeDachParameter() {
    const urlParams = new URLSearchParams(window.location.search);
    
    if (urlParams.has('breite')) {
        dachBreite = parseFloat(urlParams.get('breite'));
    }
    if (urlParams.has('hoehe')) {
        dachHoehe = parseFloat(urlParams.get('hoehe'));
    }
    if (urlParams.has('typ')) {
        dachTyp = urlParams.get('typ');
    }
    if (urlParams.has('obereBreite')) {
        obereBreite = parseFloat(urlParams.get('obereBreite'));
    }
    if (urlParams.has('trapezHoehe')) {
        trapezHoehe = parseFloat(urlParams.get('trapezHoehe'));
    }
    if (urlParams.has('rechteckHoehe')) {
        rechteckHoehe = parseFloat(urlParams.get('rechteckHoehe'));
    }

    aktualisiereAnzeige();
}

function aktualisiereAnzeige() {
    let massText = `Breite: ${dachBreite}m, Höhe: ${dachHoehe}m, Typ: ${dachTyp}`;
    
    const urlParams = new URLSearchParams(window.location.search);
    
    switch(dachTyp) {
        case 'trapez':
            if (obereBreite) {
                massText += `, Obere Breite: ${obereBreite.toFixed(1)}m`;
            }
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

function berechneDachlattenRechteck(sparrenPositionen, reihenBreite, verfuegbareLaengen, reihenStartAbsolut) {
    // Finde relevante Sparren für diese Reihe
    const relevanteSparren = sparrenPositionen.filter(pos => 
        pos >= reihenStartAbsolut - 0.05 && pos <= reihenStartAbsolut + reihenBreite + 0.05
    ).map(pos => pos - reihenStartAbsolut).sort((a, b) => a - b);
    
    if (relevanteSparren.length < 2) return null;
    
    // Stelle sicher, dass Start und Ende der Reihe als "virtuelle Sparren" existieren
    if (relevanteSparren[0] > 0.05) {
        relevanteSparren.unshift(0);
    }
    if (relevanteSparren[relevanteSparren.length - 1] < reihenBreite - 0.05) {
        relevanteSparren.push(reihenBreite);
    }
    
    const segmente = [];
    const verwendeteMaterialien = [];
    let abgedecktBis = 0;
    
    // Gehe von Sparren zu Sparren und finde optimale Latten
    while (abgedecktBis < reihenBreite - 0.01) {
        // Finde den nächsten Zielsparren (mindestens 2 Sparren überspannen)
        let zielSparrenIndex = relevanteSparren.findIndex(s => s > abgedecktBis + 0.5);
        if (zielSparrenIndex === -1) break;
        
        // Suche den weitesten erreichbaren Sparren mit verfügbaren Latten
        let besteLattenLaenge = null;
        let besterZielSparren = null;
        
        for (let i = relevanteSparren.length - 1; i >= zielSparrenIndex; i--) {
            const benoetigteLattenLaenge = relevanteSparren[i] - abgedecktBis;
            
            // Finde passende Latte (mit minimalem Verschnitt)
            const passendeLatte = verfuegbareLaengen
                .filter(l => l >= benoetigteLattenLaenge - 0.01)
                .sort((a, b) => (a - benoetigteLattenLaenge) - (b - benoetigteLattenLaenge))[0];
            
            if (passendeLatte) {
                besteLattenLaenge = passendeLatte;
                besterZielSparren = relevanteSparren[i];
                break;
            }
        }
        
        if (!besteLattenLaenge || !besterZielSparren) {
            // Keine passende Latte gefunden - nimm kleinste verfügbare bis zum nächsten Sparren
            const naechsterSparren = relevanteSparren[zielSparrenIndex];
            const kleinsteVerfuegbar = Math.min(...verfuegbareLaengen);
            
            segmente.push({
                start: abgedecktBis,
                ende: naechsterSparren,
                laenge: naechsterSparren - abgedecktBis,
                originalLaenge: kleinsteVerfuegbar,
                istRest: true
            });
            
            verwendeteMaterialien.push(kleinsteVerfuegbar);
            abgedecktBis = naechsterSparren;
        } else {
            segmente.push({
                start: abgedecktBis,
                ende: besterZielSparren,
                laenge: besterZielSparren - abgedecktBis,
                originalLaenge: besteLattenLaenge,
                istRest: false
            });
            
            verwendeteMaterialien.push(besteLattenLaenge);
            abgedecktBis = besterZielSparren;
        }
    }
    
    return { segmente, verwendeteMaterialien };
}

function berechneDachlattenIntelligent(sparrenPositionen, lattenabstand, verfuegbareLaengen, anzahlReihen) {
    const tatsaechlichVerfuegbar = verfuegbareLaengen.filter(l => l > 0);
    if (tatsaechlichVerfuegbar.length === 0) {
        return { kombination: [], gesamtLaenge: 0, verschnitt: 0, anzahlReihen: 0 };
    }
    
    tatsaechlichVerfuegbar.sort((a, b) => b - a);
    
    const materialListe = [];
    let gesamtVerschnitt = 0;
    let gesamtBenoetigteLaenge = 0;
    
    window.lattenPlan = [];
    
    // Berechne jede Reihe
    for (let reihe = anzahlReihen - 1; reihe >= 0; reihe--) {
        const fortschritt = (anzahlReihen - 1 - reihe) / Math.max(1, anzahlReihen - 1);
        let reihenBreite = berechneReihenBreite(fortschritt);
        gesamtBenoetigteLaenge += reihenBreite;
        
        const reihenStartAbsolut = (dachBreite - reihenBreite) / 2;
        
        // RECHTECK-DACH: Spezielle statisch korrekte Berechnung
        if (dachTyp === 'rechteck') {
            const ergebnis = berechneDachlattenRechteck(sparrenPositionen, reihenBreite, tatsaechlichVerfuegbar, reihenStartAbsolut);
            
            if (ergebnis) {
                window.lattenPlan[reihe] = ergebnis.segmente;
                
                // Zähle verwendete Materialien
                ergebnis.verwendeteMaterialien.forEach(laenge => {
                    const existierend = materialListe.find(m => m.laenge === laenge);
                    if (existierend) {
                        existierend.anzahl++;
                    } else {
                        materialListe.push({ laenge: laenge, anzahl: 1 });
                    }
                });
            } else {
                window.lattenPlan[reihe] = [];
            }
            
            continue;
        }
        
        // TRAPEZ-AUF-RECHTECK: Prüfe ob wir im Rechteck-Teil sind
        if (dachTyp === 'trapez-auf-rechteck') {
            const trapezAnteil = trapezHoehe / dachHoehe;
            
            if (fortschritt > trapezAnteil) {
                // Im Rechteck-Teil - verwende Rechteck-Logik
                const ergebnis = berechneDachlattenRechteck(sparrenPositionen, reihenBreite, tatsaechlichVerfuegbar, reihenStartAbsolut);
                
                if (ergebnis) {
                    window.lattenPlan[reihe] = ergebnis.segmente;
                    
                    ergebnis.verwendeteMaterialien.forEach(laenge => {
                        const existierend = materialListe.find(m => m.laenge === laenge);
                        if (existierend) {
                            existierend.anzahl++;
                        } else {
                            materialListe.push({ laenge: laenge, anzahl: 1 });
                        }
                    });
                } else {
                    window.lattenPlan[reihe] = [];
                }
                
                continue;
            }
        }
        
        // TRAPEZ/DREIECK: Alte Logik (hier ist Auflage an den Schrägen vorhanden)
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
        
        // Finde beste Kombination für Trapez/Dreieck
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
        
        window.lattenPlan[reihe] = reihenSegmente;
    }
    
    const gesamtLaenge = materialListe.reduce((sum, m) => sum + (m.laenge * m.anzahl), 0);
    gesamtVerschnitt = gesamtLaenge - gesamtBenoetigteLaenge;
    
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
            return obereBreite + (dachBreite - obereBreite) * fortschritt;
            
        case 'dreieck':
        case 'gleichschenkliges-dreieck':
        case 'ungleichschenkliges-dreieck':
            return dachBreite * (1 - fortschritt);
            
        case 'trapez-auf-rechteck':
            const trapezAnteil = trapezHoehe / dachHoehe;
            
            if (fortschritt <= trapezAnteil) {
                const trapezFortschritt = fortschritt / trapezAnteil;
                return obereBreite + (dachBreite - obereBreite) * trapezFortschritt;
            } else {
                return dachBreite;
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
    const svgWidth = 500;
    const svgHeight = 400;
    const margin = 60;
    
    const scaleX = (svgWidth - 2 * margin) / dachBreite;
    const scaleY = (svgHeight - 2 * margin - 80) / dachHoehe;
    
    let svg = `<svg width="${svgWidth}" height="${svgHeight}" viewBox="0 0 ${svgWidth} ${svgHeight}">`;
    svg += `<rect width="${svgWidth}" height="${svgHeight}" fill="#f8f9fa"/>`;
    
    // Logo/Titel
    svg += `<text x="${svgWidth/2}" y="25" text-anchor="middle" font-size="18" font-weight="bold" fill="#1e3c72">Dachplattenrechner.de</text>`;
    
    const dachStartY = margin + 40;
    
    if (dachTyp === 'trapez') {
        const seitenAbstand = (dachBreite - obereBreite) / 2;
        const trapezObenLinks = margin + seitenAbstand * scaleX;
        const trapezObenRechts = margin + (obereBreite + seitenAbstand) * scaleX;
        const trapezUntenLinks = margin;
        const trapezUntenRechts = margin + dachBreite * scaleX;
        const trapezUntenY = dachStartY + dachHoehe * scaleY;
        
        svg += `<polygon points="${trapezObenLinks},${dachStartY} ${trapezObenRechts},${dachStartY} ${trapezUntenRechts},${trapezUntenY} ${trapezUntenLinks},${trapezUntenY}" fill="none" stroke="#1976d2" stroke-width="2"/>`;
        
        // Obere Breite
        svg += `<line x1="${trapezObenLinks}" y1="${dachStartY - 15}" x2="${trapezObenRechts}" y2="${dachStartY - 15}" stroke="#333" stroke-width="1.5"/>`;
        svg += `<line x1="${trapezObenLinks}" y1="${dachStartY - 18}" x2="${trapezObenLinks}" y2="${dachStartY - 12}" stroke="#333" stroke-width="1.5"/>`;
        svg += `<line x1="${trapezObenRechts}" y1="${dachStartY - 18}" x2="${trapezObenRechts}" y2="${dachStartY - 12}" stroke="#333" stroke-width="1.5"/>`;
        svg += `<text x="${(trapezObenLinks + trapezObenRechts)/2}" y="${dachStartY - 20}" text-anchor="middle" font-size="11" font-weight="bold" fill="#333">${obereBreite.toFixed(1)}m</text>`;
        
        // Linke Schräge
        const linkeSchraegeLaenge = Math.sqrt(dachHoehe * dachHoehe + seitenAbstand * seitenAbstand);
        const linkeMitteX = (trapezObenLinks + trapezUntenLinks) / 2 - 25;
        const linkeMitteY = (dachStartY + trapezUntenY) / 2;
        const linkerWinkel = -Math.atan2(dachHoehe, seitenAbstand) * 180 / Math.PI;
        svg += `<text x="${linkeMitteX}" y="${linkeMitteY}" text-anchor="middle" font-size="11" font-weight="bold" fill="#dc3545" transform="rotate(${linkerWinkel}, ${linkeMitteX}, ${linkeMitteY})">${linkeSchraegeLaenge.toFixed(2)}m</text>`;
        
        // Rechte Schräge
        const rechteMitteX = (trapezObenRechts + trapezUntenRechts) / 2 + 25;
        const rechteMitteY = (dachStartY + trapezUntenY) / 2;
        const rechterWinkel = Math.atan2(dachHoehe, seitenAbstand) * 180 / Math.PI;
        svg += `<text x="${rechteMitteX}" y="${rechteMitteY}" text-anchor="middle" font-size="11" font-weight="bold" fill="#dc3545" transform="rotate(${rechterWinkel}, ${rechteMitteX}, ${rechteMitteY})">${linkeSchraegeLaenge.toFixed(2)}m</text>`;
        
        // Höhe
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
        
        // Linke Schräge
        const linkeSchraegeLaenge = Math.sqrt(dachHoehe * dachHoehe + (dachBreite/2) * (dachBreite/2));
        const linkeMitteX = (dreieckSpitzeX + dreieckLinksX) / 2 - 25;
        const linkeMitteY = (dachStartY + dreieckUntenY) / 2;
        const linkerWinkel = -Math.atan2(dachHoehe, dachBreite/2) * 180 / Math.PI;
        svg += `<text x="${linkeMitteX}" y="${linkeMitteY}" text-anchor="middle" font-size="11" font-weight="bold" fill="#dc3545" transform="rotate(${linkerWinkel}, ${linkeMitteX}, ${linkeMitteY})">${linkeSchraegeLaenge.toFixed(2)}m</text>`;
        
        // Rechte Schräge
        const rechteMitteX = (dreieckSpitzeX + dreieckRechtsX) / 2 + 25;
        const rechteMitteY = (dachStartY + dreieckUntenY) / 2;
        const rechterWinkel = Math.atan2(dachHoehe, dachBreite/2) * 180 / Math.PI;
        svg += `<text x="${rechteMitteX}" y="${rechteMitteY}" text-anchor="middle" font-size="11" font-weight="bold" fill="#dc3545" transform="rotate(${rechterWinkel}, ${rechteMitteX}, ${rechteMitteY})">${linkeSchraegeLaenge.toFixed(2)}m</text>`;
        
        // Höhe
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
        
        // Trapez oben
        svg += `<polygon points="${trapezObenLinks},${trapezObenY} ${trapezObenRechts},${trapezObenY} ${trapezUntenRechts},${trapezUntenY} ${trapezUntenLinks},${trapezUntenY}" fill="none" stroke="#1976d2" stroke-width="2"/>`;
        
        // Rechteck unten
        svg += `<rect x="${margin}" y="${trapezUntenY}" width="${dachBreite * scaleX}" height="${rechteckHoehe * scaleY}" fill="none" stroke="#1976d2" stroke-width="2"/>`;
        
        // Obere Breite
        svg += `<line x1="${trapezObenLinks}" y1="${trapezObenY - 15}" x2="${trapezObenRechts}" y2="${trapezObenY - 15}" stroke="#333" stroke-width="1.5"/>`;
        svg += `<line x1="${trapezObenLinks}" y1="${trapezObenY - 18}" x2="${trapezObenLinks}" y2="${trapezObenY - 12}" stroke="#333" stroke-width="1.5"/>`;
        svg += `<line x1="${trapezObenRechts}" y1="${trapezObenY - 18}" x2="${trapezObenRechts}" y2="${trapezObenY - 12}" stroke="#333" stroke-width="1.5"/>`;
        svg += `<text x="${(trapezObenLinks + trapezObenRechts)/2}" y="${trapezObenY - 20}" text-anchor="middle" font-size="11" font-weight="bold" fill="#333">${obereBreite.toFixed(1)}m</text>`;
        
        // Gesamt-Höhe
        svg += `<line x1="${margin - 20}" y1="${trapezObenY}" x2="${margin - 20}" y2="${rechteckUntenY}" stroke="#333" stroke-width="1.5"/>`;
        svg += `<line x1="${margin - 23}" y1="${trapezObenY}" x2="${margin - 17}" y2="${trapezObenY}" stroke="#333" stroke-width="1.5"/>`;
        svg += `<line x1="${margin - 23}" y1="${rechteckUntenY}" x2="${margin - 17}" y2="${rechteckUntenY}" stroke="#333" stroke-width="1.5"/>`;
        svg += `<text x="${margin - 30}" y="${(trapezObenY + rechteckUntenY)/2}" text-anchor="middle" font-size="11" font-weight="bold" fill="#333" transform="rotate(-90, ${margin - 30}, ${(trapezObenY + rechteckUntenY)/2})">${dachHoehe.toFixed(1)}m</text>`;
        
    } else {
        svg += `<rect x="${margin}" y="${dachStartY}" width="${dachBreite * scaleX}" height="${dachHoehe * scaleY}" fill="none" stroke="#1976d2" stroke-width="2"/>`;
        
        // Höhe
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
            if (dachTyp === 'trapez' || dachTyp === 'trapez-auf-rechteck') {
                sparrenY = dachStartY + (dachHoehe - sparrenLaengen[i]) * scaleY;
            } else if (dachTyp === 'dreieck' || dachTyp === 'gleichschenkliges-dreieck' || dachTyp === 'ungleichschenkliges-dreieck') {
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
            
            // Versatz-Logik: Gerade Reihen normal, ungerade Reihen umgekehrt
            const segmenteZuZeichnen = (i % 2 === 0) ? segmente : [...segmente].reverse();
            
            for (let j = 0; j < segmenteZuZeichnen.length; j++) {
                const segment = segmenteZuZeichnen[j];
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
    
    // Untere Breite
    const breiteY = dachStartY + dachHoehe * scaleY + 40;
    svg += `<line x1="${margin}" y1="${breiteY}" x2="${margin + dachBreite * scaleX}" y2="${breiteY}" stroke="#333" stroke-width="1.5"/>`;
    svg += `<line x1="${margin}" y1="${breiteY - 3}" x2="${margin}" y2="${breiteY + 3}" stroke="#333" stroke-width="1.5"/>`;
    svg += `<line x1="${margin + dachBreite * scaleX}" y1="${breiteY - 3}" x2="${margin + dachBreite * scaleX}" y2="${breiteY + 3}" stroke="#333" stroke-width="1.5"/>`;
    svg += `<text x="${margin + dachBreite * scaleX/2}" y="${breiteY + 15}" text-anchor="middle" font-size="12" font-weight="bold" fill="#333">Breite: ${dachBreite}m</text>`;
    
    svg += `</svg>`;
    
    document.getElementById('vorschau-svg').innerHTML = svg;
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

document.addEventListener('DOMContentLoaded', function() {
    loadAdSense();
    
    const cookieConsent = localStorage.getItem('cookieConsent');
    if (cookieConsent === 'all' || localStorage.getItem('analyticsCookies') === 'true') {
        loadAnalytics();
    }
    
    showAds();
    
    ladeDachParameter();
    aktualisiereLattenabstandsfeld();
    aktualisiereAutomatischeSparrenBerechnung();
});
