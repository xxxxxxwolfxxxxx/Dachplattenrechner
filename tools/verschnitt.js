// Verschnitt-Optimierung JavaScript
let aktuelleOptimierung = [];

function log(message) {
    console.log(message);
}

// Cookie Management System
function showCookieBanner() {
    const cookieConsent = localStorage.getItem('cookieConsent');
    if (!cookieConsent) {
        document.getElementById('cookieBanner').classList.add('show');
    }
}

function acceptAllCookies() {
    localStorage.setItem('cookieConsent', 'all');
    localStorage.setItem('analyticsCookies', 'true');
    localStorage.setItem('marketingCookies', 'true');
    
    loadAnalytics();
    loadAdSense();
    showAds();
    
    document.getElementById('cookieBanner').classList.remove('show');
}

function acceptOnlyEssential() {
    localStorage.setItem('cookieConsent', 'essential');
    localStorage.setItem('analyticsCookies', 'false');
    localStorage.setItem('marketingCookies', 'false');
    
    document.getElementById('cookieBanner').classList.remove('show');
}

function showAds() {
    // Zeige AdSense-Container immer (wie auf index.html)
    document.getElementById('top-ad-container').style.display = 'block';
    document.getElementById('middle-ad-container').style.display = 'block';
    document.getElementById('bottom-ad-container').style.display = 'block';
    
    // Bestimme ob personalisierte Werbung erlaubt ist
    const allowPersonalized = localStorage.getItem('marketingCookies') === 'true';
    
    // Lade AdSense-Anzeigen
    if (window.adsbygoogle) {
        try {
            const ads = document.querySelectorAll('.adsbygoogle');
            ads.forEach(ad => {
                if (!ad.getAttribute('data-ad-status')) {
                    // Setze nicht-personalisierte Werbung falls Marketing-Cookies abgelehnt
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
}

function hideAds() {
    document.getElementById('top-ad-container').style.display = 'none';
    document.getElementById('middle-ad-container').style.display = 'none';
    document.getElementById('bottom-ad-container').style.display = 'none';
}

// Verbesserte Druckfunktion
function druckeSaegeplan() {
    if (aktuelleOptimierung.length === 0) {
        alert('Bitte erstellen Sie zuerst eine Optimierung!');
        return;
    }
    
    if (typeof gtag !== 'undefined') {
        gtag('event', 'print_saegeplan', {
            'event_category': 'verschnitt_optimierung',
            'event_label': 'print_initiated'
        });
    }
    
    // Erstelle druckbaren Inhalt
    const gesamtVerschnitt = aktuelleOptimierung.reduce((sum, p) => sum + p.verschnitt, 0);
    const gesamtMaterial = aktuelleOptimierung.reduce((sum, p) => sum + p.lagerlaenge, 0);
    const effizienz = document.getElementById('effizienz').textContent;
    const gesamtSchnitte = document.getElementById('gesamt-schnitte').textContent;
    
    let druckHTML = `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
            <div style="text-align: center; margin-bottom: 25px; border-bottom: 3px solid #1e3c72; padding-bottom: 15px;">
                <h2 style="color: #1e3c72; margin-bottom: 10px;">Dachplattenrechner.de Sägeplan - Verschnitt-Optimierung</h2>
                <p style="color: #666; font-size: 1.1em;">
                    Platten: ${aktuelleOptimierung.length} Stück | Material: ${gesamtMaterial.toFixed(2)}m | 
                    Verschnitt: ${gesamtVerschnitt.toFixed(2)}m | Effizienz: ${effizienz} | Schnitte: ${gesamtSchnitte}
                </p>
            </div>
            
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
                <thead>
                    <tr style="background: #f0f0f0;">
                        <th style="border: 1px solid #333; padding: 8px; text-align: center; font-weight: bold;">Platte Nr.</th>
                        <th style="border: 1px solid #333; padding: 8px; text-align: center; font-weight: bold;">Lagerlänge</th>
                        <th style="border: 1px solid #333; padding: 8px; text-align: center; font-weight: bold;">Zu sägende Längen</th>
                        <th style="border: 1px solid #333; padding: 8px; text-align: center; font-weight: bold;">Verschnitt</th>
                        <th style="border: 1px solid #333; padding: 8px; text-align: center; font-weight: bold;">Anzahl Schnitte</th>
                    </tr>
                </thead>
                <tbody>`;
    
    // Tabellendaten hinzufügen
    aktuelleOptimierung.forEach(platte => {
        let anzahlSchnitte = platte.realSchnitte || platte.anzahlSchnitte + (platte.verschnitt > 0.001 ? 1 : 0);
        
        druckHTML += `
            <tr>
                <td style="border: 1px solid #333; padding: 8px; text-align: center;"><strong>P${platte.plattenNr}</strong></td>
                <td style="border: 1px solid #333; padding: 8px; text-align: center; font-weight: bold; color: #1e3c72;">${platte.lagerlaenge.toFixed(1)}m</td>
                <td style="border: 1px solid #333; padding: 8px; text-align: center;">${platte.masze.map(m => `${m.toFixed(2)}m`).join(', ')}</td>
                <td style="border: 1px solid #333; padding: 8px; text-align: center; font-weight: bold; color: #28a745;">${platte.verschnitt.toFixed(3)}m</td>
                <td style="border: 1px solid #333; padding: 8px; text-align: center;">${anzahlSchnitte}</td>
            </tr>`;
    });
    
    druckHTML += `</tbody></table>`;
    
    // Optimierungstipp hinzufügen falls vorhanden
    const optimierungElement = document.getElementById('verschnitt-optimierung');
    if (optimierungElement && optimierungElement.style.display !== 'none') {
        const toleranz = parseFloat(document.getElementById('toleranz').value) / 1000;
        let verschnittOptimierungsTipp = '';
        
        aktuelleOptimierung.forEach(platte => {
            if (platte.verschnitt > 0.001) {
                const zusaetzlicheLaengeProTeil = platte.verschnitt / platte.masze.length * 1000;
                const aktuelleToleranz = toleranz * 1000;
                
                if (zusaetzlicheLaengeProTeil <= aktuelleToleranz) {
                    const neueSchnittlaenge = (platte.masze[0] - toleranz + platte.verschnitt / platte.masze.length) * 1000;
                    const originalSchnittlaenge = (platte.masze[0] - toleranz) * 1000;
                    
                    verschnittOptimierungsTipp += `<strong>Platte ${platte.plattenNr}:</strong> Statt ${originalSchnittlaenge.toFixed(1)}mm → <strong>${neueSchnittlaenge.toFixed(1)}mm</strong> schneiden (${zusaetzlicheLaengeProTeil.toFixed(1)}mm länger pro Teil)<br>`;
                    verschnittOptimierungsTipp += `→ <strong>Kein Verschnitt</strong> + <strong>1 Schnitt gespart</strong> (Verschnitt-Abtrennung entfällt)<br><br>`;
                }
            }
        });
        
        if (verschnittOptimierungsTipp) {
            druckHTML += `
                <div style="background: #fffbf0; border: 2px solid #ffc107; padding: 15px; border-radius: 8px; margin-top: 20px;">
                    <h4 style="color: #856404; margin-bottom: 15px;">Verschnitt-Optimierungstipp</h4>
                    <div>${verschnittOptimierungsTipp}</div>
                    <strong>Vorteile:</strong><br>
                    • Kein Materialverschnitt<br>
                    • Weniger Sägeschnitte (spart Zeit)<br>
                    • Teile sind noch innerhalb der Toleranz<br>
                    <em>Längere Teile sind oft sogar besser als zu kurze!</em>
                </div>`;
        }
    }
    
    druckHTML += `</div>`;
    
    // Neues Fenster öffnen und drucken
    const druckFenster = window.open('', '_blank');
    druckFenster.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Sägeplan - Verschnitt-Optimierung</title>
            <style>
                @media print {
                    body { margin: 15mm; }
                    table { page-break-inside: avoid; }
                    div { page-break-inside: avoid; }
                }
                body { font-family: Arial, sans-serif; font-size: 11pt; }
            </style>
        </head>
        <body>
            ${druckHTML}
        </body>
        </html>
    `);
    druckFenster.document.close();
    druckFenster.focus();
    druckFenster.print();
    druckFenster.close();
}

function parseEinheitUndWert(eingabe) {
    // Bereinige Eingabe: Komma zu Punkt, Leerzeichen entfernen
    let bereinigt = eingabe.replace(',', '.').replace(/\s/g, '').toLowerCase();
    
    // Erkenne Einheit
    let einheit = 'm'; // Standard
    let zahlTeil = bereinigt;
    
    if (bereinigt.endsWith('mm')) {
        einheit = 'mm';
        zahlTeil = bereinigt.slice(0, -2);
    } else if (bereinigt.endsWith('cm')) {
        einheit = 'cm';
        zahlTeil = bereinigt.slice(0, -2);
    } else if (bereinigt.endsWith('m')) {
        einheit = 'm';
        zahlTeil = bereinigt.slice(0, -1);
    }
    
    const zahl = parseFloat(zahlTeil);
    if (isNaN(zahl)) return NaN;
    
    // Konvertiere zu Meter
    switch (einheit) {
        case 'mm': return zahl / 1000;
        case 'cm': return zahl / 100;
        case 'm': return zahl;
        default: return zahl; // Fallback: als Meter behandeln
    }
}

function parseEinfacheEingabe() {
    const text = document.getElementById('benoetigte-masze').value;
    const lines = text.split('\n');
    const masze = [];
    
    for (let line of lines) {
        line = line.trim();
        if (!line) continue;
        
        // Wiederholung: 100x1.5m, 50x2,3, 25x150cm
        if (line.includes('x')) {
            const parts = line.split('x');
            if (parts.length === 2) {
                const anzahl = parseInt(parts[0].trim());
                const wertMitEinheit = parts[1].trim();
                const wert = parseEinheitUndWert(wertMitEinheit);
                
                if (!isNaN(anzahl) && !isNaN(wert) && anzahl > 0 && wert > 0 && anzahl <= 10000) {
                    for (let i = 0; i < anzahl; i++) {
                        masze.push(wert);
                    }
                    log(`Parsed: ${anzahl}x ${wert}m`);
                    continue;
                }
            }
        }
        
        // Einfache Angabe: 1.5m, 150cm, 1500mm, 1,5
        const wert = parseEinheitUndWert(line);
        if (!isNaN(wert) && wert > 0) {
            masze.push(wert);
            log(`Parsed: ${wert}m`);
        }
    }
    
    return masze.sort((a, b) => b - a); // Größte zuerst
}

function berechneOptimierung() {
    log('Start Optimierung...');
    
    try {
        // 1. Eingabe parsen
        const benoetigteMasze = parseEinfacheEingabe();
        log(`Benötigte Maße: ${benoetigteMasze.length} Stück`);
        
        // Zeige geparste Werte zur Kontrolle
        const einzigartigeMasze = [...new Set(benoetigteMasze)];
        einzigartigeMasze.forEach(mass => {
            const anzahl = benoetigteMasze.filter(m => Math.abs(m - mass) < 0.001).length;
            log(`  → ${anzahl}x ${mass}m`);
        });
        
        if (benoetigteMasze.length === 0) {
            alert('Bitte geben Sie mindestens eine Länge ein!');
            return;
        }
        
        // 2. Lagerlängen sammeln
        const verfuegbareLaengen = getVerfuegbareLaengen();
        log(`Verfügbare Längen: ${verfuegbareLaengen.map(l => l.laenge + 'm').join(', ')}`);
        
        if (verfuegbareLaengen.length === 0) {
            alert('Bitte wählen Sie mindestens eine Lagerlänge aus!');
            return;
        }
        
        // 3. Optimierung durchführen
        const optimierung = intelligenteOptimierung(benoetigteMasze, verfuegbareLaengen);
        log('Optimierung abgeschlossen');
        
        // 4. Ergebnisse anzeigen
        zeigeErgebnisse(optimierung);
        
    } catch (error) {
        log('Fehler: ' + error.message);
        alert('Fehler bei der Optimierung: ' + error.message);
    }
}

function getVerfuegbareLaengen() {
    const verfuegbar = [];
    
    // Alle Lagerlängen mit korrekten IDs
    const lagerlaengen = [
        { id: 'lager-2.0', laenge: 2.0 },
        { id: 'lager-2.5', laenge: 2.5 },
        { id: 'lager-3.0', laenge: 3.0 },
        { id: 'lager-3.1', laenge: 3.1 },
        { id: 'lager-3.5', laenge: 3.5 },
        { id: 'lager-4.0', laenge: 4.0 },
        { id: 'lager-4.5', laenge: 4.5 },
        { id: 'lager-5.0', laenge: 5.0 },
        { id: 'lager-5.5', laenge: 5.5 },
        { id: 'lager-6.0', laenge: 6.0 },
        { id: 'lager-6.5', laenge: 6.5 },
        { id: 'lager-7.0', laenge: 7.0 },
        { id: 'lager-7.5', laenge: 7.5 },
        { id: 'lager-8.0', laenge: 8.0 },
        { id: 'lager-8.5', laenge: 8.5 },
        { id: 'lager-9.0', laenge: 9.0 }
    ];
    
    lagerlaengen.forEach(item => {
        const checkbox = document.getElementById(item.id);
        
        if (checkbox && checkbox.checked) {
            const anzahlInput = document.getElementById(`anzahl-${item.laenge}`);
            const anzahl = anzahlInput && anzahlInput.value !== '' ? parseInt(anzahlInput.value) : Infinity;
            
            verfuegbar.push({
                laenge: item.laenge,
                anzahl: Math.max(0, anzahl || Infinity)
            });
        }
    });
    
    return verfuegbar.sort((a, b) => b.laenge - a.laenge); // Größte zuerst
}

function berechneOptimaleKombination(masze, lagerlaenge, schnittblattBreite, toleranz) {
    // Spezialfall: Alle Teile sind identisch (wichtig für 100x1.5m)
    if (masze.length > 0 && masze.every(m => Math.abs(m - masze[0]) < 0.001)) {
        const teilLaenge = masze[0];
        
        if (teilLaenge <= 0) {
            return { teile: [], verschnitt: lagerlaenge, realSchnitte: 0 };
        }
        
        // Berechne maximale Anzahl identischer Teile
        let maxAnzahl = 1;
        
        // Teste schrittweise mehr Teile
        while (maxAnzahl <= masze.length) {
            // Minimaler benötigter Platz (kürzeste erlaubte Teile)
            const minTeilLaenge = teilLaenge - toleranz;
            const minBenoetigterPlatz = maxAnzahl * minTeilLaenge + (maxAnzahl - 1) * schnittblattBreite;
            
            if (minBenoetigterPlatz > lagerlaenge) {
                maxAnzahl--; // Ein Schritt zurück
                break;
            }
            if (maxAnzahl === masze.length) break; // Alle passen
            maxAnzahl++;
        }
        
        if (maxAnzahl > 0) {
            const teile = [];
            for (let i = 0; i < maxAnzahl; i++) {
                teile.push(teilLaenge);
            }
            
            // Berechne mit minimalen Teillängen
            const minTeilLaenge = teilLaenge - toleranz;
            const minBenoetigterPlatz = maxAnzahl * minTeilLaenge + (maxAnzahl - 1) * schnittblattBreite;
            const verfuegbarerVerschnitt = lagerlaenge - minBenoetigterPlatz;
            
            // Prüfe ob wir den Verschnitt auf die Teile verteilen können (innerhalb Toleranz)
            const verschnittProTeil = verfuegbarerVerschnitt / maxAnzahl;
            const kannVerschnittVerteilen = verschnittProTeil <= toleranz;
            
            let realSchnitte = maxAnzahl > 0 ? maxAnzahl - 1 : 0; // Schnitte zwischen Teilen
            let endVerschnitt = verfuegbarerVerschnitt;
            
            if (kannVerschnittVerteilen) {
                // Verschnitt kann auf Teile verteilt werden - kein Verschnitt-Schnitt nötig!
                endVerschnitt = 0;
                log(`${lagerlaenge}m mit ${maxAnzahl}x${teilLaenge}m: Verschnitt ${(verschnittProTeil*1000).toFixed(1)}mm pro Teil ≤ ${(toleranz*1000).toFixed(0)}mm Toleranz → KEIN Verschnitt-Schnitt!`);
            } else {
                // Verschnitt zu groß - muss abgetrennt werden
                realSchnitte += 1;
                log(`${lagerlaenge}m mit ${maxAnzahl}x${teilLaenge}m: Verschnitt ${(verschnittProTeil*1000).toFixed(1)}mm pro Teil > ${(toleranz*1000).toFixed(0)}mm Toleranz → +1 Verschnitt-Schnitt`);
            }
            
            return { 
                teile: teile, 
                verschnitt: endVerschnitt, 
                realSchnitte: realSchnitte,
                kannVerschnittVerteilen: kannVerschnittVerteilen,
                verschnittProTeil: verschnittProTeil
            };
        }
    }
    
    // Fallback für gemischte Teile: Greedy-Algorithmus
    const kombination = [];
    let verbleibendelaenge = lagerlaenge;
    const sortierteMasze = [...masze].sort((a, b) => b - a); // Größte zuerst
    
    for (let mass of sortierteMasze) {
        // Minimale benötigte Länge (kürzeste erlaubte Teillänge)
        const minMass = mass - toleranz;
        const benoetigterPlatz = minMass + (kombination.length > 0 ? schnittblattBreite : 0);
        
        if (verbleibendelaenge >= benoetigterPlatz && minMass > 0) {
            kombination.push(mass);
            verbleibendelaenge -= benoetigterPlatz;
        }
    }
    
    // Berechne reale Schnittanzahl für gemischte Teile
    let realSchnitte = kombination.length > 0 ? kombination.length - 1 : 0;
    
    // Bei gemischten Teilen: Verschnitt-Verteilung schwieriger - konservativ rechnen
    if (verbleibendelaenge > toleranz) {
        realSchnitte += 1;
    }
    
    return { 
        teile: kombination, 
        verschnitt: verbleibendelaenge, 
        realSchnitte: realSchnitte,
        kannVerschnittVerteilen: verbleibendelaenge <= toleranz
    };
}

function intelligenteOptimierung(masze, verfuegbareLaengen) {
    const ergebnis = [];
    const verbleibendeMapze = [...masze];
    const schnittblattBreite = parseFloat(document.getElementById('schnittblatt-breite').value) / 1000;
    const toleranz = parseFloat(document.getElementById('toleranz').value) / 1000;
    const modus = document.getElementById('optimierung-modus').value;
    
    log(`Optimierungsmodus: ${modus}`);
    log(`Schnittblattbreite: ${(schnittblattBreite*1000).toFixed(1)}mm, Toleranz: ${(toleranz*1000).toFixed(1)}mm`);
    
    // Verbrauchszähler für begrenzte Lagerlängen
    const verbrauchteAnzahl = {};
    verfuegbareLaengen.forEach(lager => {
        verbrauchteAnzahl[lager.laenge] = 0;
    });
    
    let plattenNr = 1;
    
    while (verbleibendeMapze.length > 0 && plattenNr <= 100) {
        let bestePlatte = null;
        let besteKombination = [];
        let besterWert = modus === 'verschnitt' ? Infinity : Infinity; // Beide Modi minimieren
        
        log(`Platte ${plattenNr}: Verbleibende Teile: ${verbleibendeMapze.length}`);
        
        // Teste jede verfügbare Lagerlänge
        for (let lager of verfuegbareLaengen) {
            // Prüfe ob noch verfügbar
            if (verbrauchteAnzahl[lager.laenge] >= lager.anzahl) {
                log(`Lager ${lager.laenge}m: Keine mehr verfügbar (${verbrauchteAnzahl[lager.laenge]}/${lager.anzahl})`);
                continue;
            }
            
            const kombination = berechneOptimaleKombination(verbleibendeMapze, lager.laenge, schnittblattBreite, toleranz);
            
            if (kombination.teile.length === 0) {
                log(`Lager ${lager.laenge}m: Keine Kombination möglich`);
                continue;
            }
            
            let istBesser = false;
            if (modus === 'verschnitt') {
                // Minimaler Verschnitt - URSPRÜNGLICHE LOGIK BEIBEHALTEN
                istBesser = kombination.verschnitt < besterWert;
                if (istBesser) besterWert = kombination.verschnitt;
                log(`VERSCHNITT-Modus: ${lager.laenge}m → ${kombination.teile.length} Teile, Verschnitt: ${kombination.verschnitt.toFixed(3)}m ${istBesser ? '(BESSER)' : ''}`);
            } else {
                // Wenigste Schnitte: KORRIGIERTE LOGIK
                // Primär: Minimiere Schnitte pro Teil, Sekundär: Minimiere Verschnitt
                const schnittEffizienz = kombination.realSchnitte / kombination.teile.length;
                const verschnittMalus = kombination.verschnitt * 0.01; // Sehr kleiner Malus für Verschnitt
                const bewertung = schnittEffizienz + verschnittMalus;
                
                istBesser = bewertung < besterWert;
                if (istBesser) besterWert = bewertung;
                
                let zusatzInfo = '';
                if (kombination.kannVerschnittVerteilen) {
                    zusatzInfo = ', Verschnitt verteilbar auf Teile!';
                }
                
                log(`SCHNITTE-Modus: ${lager.laenge}m → ${kombination.teile.length} Teile, ${kombination.realSchnitte} reale Schnitte, Effizienz: ${schnittEffizienz.toFixed(2)} Schnitte/Teil, Verschnitt: ${kombination.verschnitt.toFixed(3)}m${zusatzInfo} ${istBesser ? '(BESSER)' : ''}`);
            }
            
            if (istBesser) {
                besteKombination = kombination.teile;
                bestePlatte = lager;
                log(`NEUE BESTE: ${lager.laenge}m mit ${kombination.teile.length} Teilen, ${kombination.realSchnitte} reale Schnitte`);
            }
        }
        
        if (!bestePlatte || besteKombination.length === 0) {
            log('Keine optimale Platte gefunden - breche ab');
            break;
        }
        
        // Berechne finale Werte
        const finalKombination = berechneOptimaleKombination([...besteKombination], bestePlatte.laenge, schnittblattBreite, toleranz);
        
        log(`Platte ${plattenNr}: ${bestePlatte.laenge}m mit ${besteKombination.length} Teilen, Verschnitt: ${finalKombination.verschnitt.toFixed(3)}m, Reale Schnitte: ${finalKombination.realSchnitte}`);
        
        ergebnis.push({
            plattenNr: plattenNr++,
            lagerlaenge: bestePlatte.laenge,
            masze: [...besteKombination],
            verschnitt: Math.max(0, finalKombination.verschnitt),
            anzahlSchnitte: besteKombination.length > 0 ? besteKombination.length - 1 : 0,
            realSchnitte: finalKombination.realSchnitte
        });
        
        // Verbrauch markieren
        verbrauchteAnzahl[bestePlatte.laenge]++;
        
        // Entferne verwendete Maße
        besteKombination.forEach(mass => {
            const index = verbleibendeMapze.findIndex(m => Math.abs(m - mass) < 0.0001);
            if (index > -1) {
                verbleibendeMapze.splice(index, 1);
            }
        });
    }
    
    return ergebnis;
}

function zeigeErgebnisse(optimierung) {
    aktuelleOptimierung = optimierung;
    
    const gesamtVerschnitt = optimierung.reduce((sum, p) => sum + p.verschnitt, 0);
    const gesamtMaterial = optimierung.reduce((sum, p) => sum + p.lagerlaenge, 0);
    
    // Tatsächlich benötigtes Material = Netto-Material (mit abgezogener Toleranz)
    const toleranz = parseFloat(document.getElementById('toleranz').value) / 1000;
    const schnittblattBreite = parseFloat(document.getElementById('schnittblatt-breite').value) / 1000;
    
    let tatsaechlichBenoetigtesMaterial = 0;
    let gesamtSchnitte = 0;
    
    optimierung.forEach(platte => {
        // Netto-Material: Original-Längen minus Toleranz
        const nettoMaterialPlatte = platte.masze.reduce((sum, mass) => sum + (mass - toleranz), 0);
        tatsaechlichBenoetigtesMaterial += nettoMaterialPlatte;
        
        // Schnittblatt-Verluste
        const schnittblattVerluste = platte.anzahlSchnitte * schnittblattBreite;
        tatsaechlichBenoetigtesMaterial += schnittblattVerluste;
        
        // Verwende reale Schnittanzahl für Gesamtschnitte
        gesamtSchnitte += platte.realSchnitte || platte.anzahlSchnitte + (platte.verschnitt > 0.001 ? 1 : 0);
    });
    
    const effizienz = gesamtMaterial > 0 ? (tatsaechlichBenoetigtesMaterial / gesamtMaterial * 100) : 0;
    
    // Ergebnisse anzeigen
    document.getElementById('lager-anzahl').textContent = optimierung.length + ' Stück';
    document.getElementById('gesamt-material').textContent = gesamtMaterial.toFixed(2) + ' m';
    document.getElementById('nutzen-material').textContent = tatsaechlichBenoetigtesMaterial.toFixed(2) + ' m';
    document.getElementById('gesamt-verschnitt').textContent = gesamtVerschnitt.toFixed(2) + ' m';
    document.getElementById('gesamt-schnitte').textContent = gesamtSchnitte + ' Stück';
    document.getElementById('effizienz').textContent = effizienz.toFixed(1) + '%';
    
    // Tabelle füllen
    const tbody = document.getElementById('saegeplan-details');
    tbody.innerHTML = '';
    
    // Prüfe Verschnitt-Optimierung
    let verschnittOptimierungsTipp = '';
    
    optimierung.forEach(platte => {
        const row = document.createElement('tr');
        
        // Verwende reale Schnittanzahl
        const anzahlSchnitte = platte.realSchnitte || platte.anzahlSchnitte + (platte.verschnitt > 0.001 ? 1 : 0);
        
        row.innerHTML = `
            <td><strong>P${platte.plattenNr}</strong></td>
            <td>${platte.lagerlaenge.toFixed(1)}m</td>
            <td>${platte.masze.map(m => `${m.toFixed(2)}m`).join(', ')}</td>
            <td>${platte.verschnitt.toFixed(3)}m</td>
            <td>${anzahlSchnitte}</td>
        `;
        tbody.appendChild(row);
        
        // Prüfe ob Verschnitt durch Toleranz-Anpassung eliminiert werden kann
        if (platte.verschnitt > 0.001) {
            // Berechne wie viel länger jedes Teil geschnitten werden könnte
            const zusaetzlicheLaengeProTeil = platte.verschnitt / platte.masze.length * 1000; // in mm pro Teil
            const aktuelleToleranz = toleranz * 1000; // in mm
            
            // Wenn die zusätzliche Länge innerhalb der Toleranz liegt
            if (zusaetzlicheLaengeProTeil <= aktuelleToleranz) {
                const neueSchnittlaenge = (platte.masze[0] - toleranz + platte.verschnitt / platte.masze.length) * 1000; // in mm
                const originalSchnittlaenge = (platte.masze[0] - toleranz) * 1000; // in mm
                
                verschnittOptimierungsTipp += `<strong>Platte ${platte.plattenNr}:</strong> Statt ${originalSchnittlaenge.toFixed(1)}mm → <strong>${neueSchnittlaenge.toFixed(1)}mm</strong> schneiden (${zusaetzlicheLaengeProTeil.toFixed(1)}mm länger pro Teil)<br>`;
                verschnittOptimierungsTipp += `→ <strong>Kein Verschnitt</strong> + <strong>1 Schnitt gespart</strong> (Verschnitt-Abtrennung entfällt)<br><br>`;
            }
        }
    });
    
    // Zeige Verschnitt-Optimierungstipp
    if (verschnittOptimierungsTipp) {
        document.getElementById('optimierung-text').innerHTML = verschnittOptimierungsTipp + 
            '<strong>Vorteile:</strong><br>' +
            '• Kein Materialverschnitt<br>' +
            '• Weniger Sägeschnitte (spart Zeit)<br>' +
            '• Teile sind noch innerhalb der Toleranz<br>' +
            '<em>Längere Teile sind oft sogar besser als zu kurze!</em>';
        document.getElementById('verschnitt-optimierung').style.display = 'block';
    } else {
        document.getElementById('verschnitt-optimierung').style.display = 'none';
    }
    
    document.getElementById('results').style.display = 'block';
    
    // Zeige finale Statistik im Log
    log(`FINALE STATISTIK:`);
    log(`   Platten benötigt: ${optimierung.length}`);
    log(`   Gesamtmaterial: ${gesamtMaterial.toFixed(2)}m`);
    log(`   Gesamtverschnitt: ${gesamtVerschnitt.toFixed(2)}m`);
    log(`   Gesamtschnitte: ${gesamtSchnitte}`);
    log(`   Effizienz: ${effizienz.toFixed(1)}%`);
}

// Initialize everything
document.addEventListener('DOMContentLoaded', function() {
    // Initialize tracking and ads based on existing consent
    const cookieConsent = localStorage.getItem('cookieConsent');
    if (cookieConsent === 'all' || localStorage.getItem('analyticsCookies') === 'true') {
        loadAnalytics();
    }
    
    // WICHTIG: Werbung immer anzeigen (wie auf index.html)
    showAds();
});
