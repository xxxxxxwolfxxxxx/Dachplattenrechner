let dachBreite = 10;
let dachHoehe = 6;
let dachTyp = 'rechteck';
let obereBreite = 0;
let sparrenLaengen = [];
let sparrenPositionen = [];

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
        case 'trapez-auf-rechteck':
            const obereBreiteTA = urlParams.get('obereBreite');
            const trapezHoehe = urlParams.get('trapezHoehe');
            const rechteckHoehe = urlParams.get('rechteckHoehe');
            if (obereBreiteTA && trapezHoehe && rechteckHoehe) {
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
    
    tatsaechlichVerfuegbar.sort((a, b) => b - a);
    
    let restPool = [];
    const materialListe = [];
    let gesamtVerschnitt = 0;
    let gesamtBenoetigteLaenge = 0;
    
    window.lattenPlan = [];
    
    for (let reihe = 0; reihe < anzahlReihen; reihe++) {
        const fortschritt = reihe / Math.max(1, anzahlReihen - 1);
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
        
        const reihenSegmente = [];
        let aktuellePosition = 0;
        
        while (aktuellePosition < reihenBreite - 0.01) {
            const naechsterSparren = relevanteSparren.find(pos => pos > aktuellePosition + 0.01);
            if (!naechsterSparren) break;
            
            const benoetigteLattenlaenge = naechsterSparren - aktuellePosition;
            
            let verwendeteLatte = null;
            let restIndex = -1;
            let istRestStück = false;
            
            // 1. Prüfe ob ein Rest passt
            for (let i = 0; i < restPool.length; i++) {
                if (restPool[i] >= benoetigteLattenlaenge - 0.01) {
                    verwendeteLatte = {
                        laenge: restPool[i],
                        originalLaenge: restPool[i]
                    };
                    restIndex = i;
                    istRestStück = true;
                    break;
                }
            }
            
            // 2. Falls kein Rest passt, nimm neue Latte
            if (!verwendeteLatte) {
                const passendeLatte = tatsaechlichVerfuegbar.find(l => l >= benoetigteLattenlaenge - 0.01);
                if (passendeLatte) {
                    verwendeteLatte = {
                        laenge: passendeLatte,
                        originalLaenge: passendeLatte
                    };
                    
                    const existierend = materialListe.find(m => m.laenge === passendeLatte);
                    if (existierend) {
                        existierend.anzahl++;
                    } else {
                        materialListe.push({ laenge: passendeLatte, anzahl: 1 });
                    }
                    istRestStück = false;
                } else {
                    break;
                }
            }
            
            // Segment zur Reihe hinzufügen
            reihenSegmente.push({
                start: aktuellePosition,
                ende: naechsterSparren,
                laenge: benoetigteLattenlaenge,
                originalLaenge: verwendeteLatte.originalLaenge,
                istRest: istRestStück
            });
            
            // Rest-Verwaltung
            const neuerRest = verwendeteLatte.laenge - benoetigteLattenlaenge;
            
            if (istRestStück && restIndex >= 0) {
                restPool.splice(restIndex, 1);
            }
            
            if (neuerRest > 0.5) {
                restPool.push(neuerRest);
                restPool.sort((a, b) => b - a);
            } else if (neuerRest > 0.01) {
                gesamtVerschnitt += neuerRest;
            }
            
            aktuellePosition = naechsterSparren;
        }
        
        window.lattenPlan[reihe] = reihenSegmente;
    }
    
    gesamtVerschnitt += restPool.reduce((sum, rest) => sum + rest, 0);
    
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
        case 'trapez':
            return obereBreite + (dachBreite - obereBreite) * fortschritt;
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
    const svgHeight = 350;
    const margin = 50;
    
    const scaleX = (svgWidth - 2 * margin) / dachBreite;
    const scaleY = (svgHeight - 2 * margin - 40) / dachHoehe;
    
    let svg = `<svg width="${svgWidth}" height="${svgHeight}" viewBox="0 0 ${svgWidth} ${svgHeight}">`;
    svg += `<rect width="${svgWidth}" height="${svgHeight}" fill="#f8f9fa"/>`;
    
    if (dachTyp === 'trapez') {
        const seitenAbstand = (dachBreite - obereBreite) / 2;
        const trapezObenLinks = margin + seitenAbstand * scaleX;
        const trapezObenRechts = margin + (obereBreite + seitenAbstand) * scaleX;
        const trapezUntenLinks = margin;
        const trapezUntenRechts = margin + dachBreite * scaleX;
        const trapezUntenY = margin + dachHoehe * scaleY;
        
        svg += `<polygon points="${trapezObenLinks},${margin} ${trapezObenRechts},${margin} ${trapezUntenRechts},${trapezUntenY} ${trapezUntenLinks},${trapezUntenY}" fill="none" stroke="#1976d2" stroke-width="2"/>`;
    } else {
        svg += `<rect x="${margin}" y="${margin}" width="${dachBreite * scaleX}" height="${dachHoehe * scaleY}" fill="none" stroke="#1976d2" stroke-width="2"/>`;
    }
    
    for (let i = 0; i < anzahlSparren && i < sparrenPositionen.length; i++) {
        const sparrenX = margin + sparrenPositionen[i] * scaleX;
        let sparrenY = margin;
        let sparrenHeight = dachHoehe * scaleY;
        
        if (sparrenLaengen[i] !== undefined) {
            sparrenHeight = sparrenLaengen[i] * scaleY;
            if (dachTyp === 'trapez') {
                sparrenY = margin + (dachHoehe - sparrenLaengen[i]) * scaleY;
            }
        }
        
        svg += `<rect x="${sparrenX - 2}" y="${sparrenY}" width="4" height="${sparrenHeight}" fill="#666" opacity="0.8"/>`;
        svg += `<rect x="${sparrenX - 1}" y="${sparrenY}" width="2" height="${sparrenHeight}" fill="#ff6b35" opacity="0.9"/>`;
    }
    
    if (dachTyp === 'trapez') {
        const seitenAbstand = (dachBreite - obereBreite) / 2;
        const linkeObenX = margin + seitenAbstand * scaleX;
        const rechteObenX = margin + (dachBreite - seitenAbstand) * scaleX;
        const untenY = margin + dachHoehe * scaleY;
        
        svg += `<line x1="${linkeObenX}" y1="${margin}" x2="${margin}" y2="${untenY}" stroke="#ff6b35" stroke-width="2" opacity="0.9"/>`;
        svg += `<line x1="${rechteObenX}" y1="${margin}" x2="${margin + dachBreite * scaleX}" y2="${untenY}" stroke="#ff6b35" stroke-width="2" opacity="0.9"/>`;
    }
    
    const lattenFarben = { 6: '#9b59b6', 5: '#3498db', 4: '#f39c12', 3: '#27ae60' };
    const restFarbe = '#e74c3c';
    
    for (let i = 0; i < anzahlLattenReihen; i++) {
        const fortschritt = i / Math.max(1, anzahlLattenReihen - 1);
        const reihenBreite = berechneReihenBreite(fortschritt);
        const lattenY = margin + fortschritt * dachHoehe * scaleY;
        
        const reihenStartAbsolut = (dachBreite - reihenBreite) / 2;
        const reihenStartX = margin + reihenStartAbsolut * scaleX;
        
        if (window.lattenPlan && window.lattenPlan[i]) {
            const segmente = window.lattenPlan[i];
            
            for (let j = 0; j < segmente.length; j++) {
                const segment = segmente[j];
                const segmentStartX = reihenStartX + segment.start * scaleX;
                const segmentEndX = reihenStartX + segment.ende * scaleX;
                
                const segmentFarbe = segment.istRest ? restFarbe : (lattenFarben[segment.originalLaenge] || restFarbe);
                
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
    
    svg += `<line x1="${margin}" y1="${margin + dachHoehe * scaleY + 35}" x2="${margin + dachBreite * scaleX}" y2="${margin + dachHoehe * scaleY + 35}" stroke="#333" stroke-width="1"/>`;
    svg += `<text x="${margin + dachBreite * scaleX/2}" y="${margin + dachHoehe * scaleY + 50}" text-anchor="middle" font-size="12" font-weight="bold" fill="#333">Breite: ${dachBreite}m</text>`;
    
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
