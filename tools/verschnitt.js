// Cookie Banner Funktionen
function showCookieBanner() {
    const banner = document.getElementById('cookieBanner');
    const essentialCookies = localStorage.getItem('essentialCookies');
    const analyticsCookies = localStorage.getItem('analyticsCookies');
    const marketingCookies = localStorage.getItem('marketingCookies');
    
    // Banner nur anzeigen wenn noch nicht entschieden wurde
    if (essentialCookies === null || analyticsCookies === null || marketingCookies === null) {
        banner.classList.add('show');
    }
}

function acceptAllCookies() {
    localStorage.setItem('essentialCookies', 'true');
    localStorage.setItem('analyticsCookies', 'true');
    localStorage.setItem('marketingCookies', 'true');
    hideCookieBanner();
    loadAnalytics();
    loadAdSense();
}

function acceptOnlyEssential() {
    localStorage.setItem('essentialCookies', 'true');
    localStorage.setItem('analyticsCookies', 'false');
    localStorage.setItem('marketingCookies', 'false');
    hideCookieBanner();
    hideAds();
}

function hideCookieBanner() {
    const banner = document.getElementById('cookieBanner');
    banner.classList.remove('show');
}

function hideAds() {
    document.querySelectorAll('.ad-container, .ad-container-middle').forEach(container => {
        container.style.display = 'none';
        container.style.height = '0';
        container.style.margin = '0';
        container.style.padding = '0';
    });
}

function loadAdSense() {
    if (localStorage.getItem('marketingCookies') === 'true') {
        document.querySelectorAll('.ad-container, .ad-container-middle').forEach(container => {
            container.style.display = 'block';
        });
    }
}

function loadAnalytics() {
    if (localStorage.getItem('analyticsCookies') === 'true' && typeof gtag !== 'undefined') {
        gtag('config', 'G-6NSYG8B1T9', {
            anonymize_ip: true,
            cookie_flags: 'SameSite=None;Secure'
        });
    }
}

// Hauptfunktionen für Verschnitt-Optimierung
function parseEingabe(text) {
    const zeilen = text.split('\n').map(z => z.trim()).filter(z => z.length > 0);
    const benoetigte = [];
    
    for (const zeile of zeilen) {
        // Erkenne Format: [Anzahl]x[Länge][Einheit]
        const match = zeile.match(/^(\d+(?:\.\d+)?)?x?(\d+(?:[,.]?\d+)?)\s*(m|cm|mm)?$/i);
        
        if (match) {
            let anzahl = parseFloat(match[1]) || 1;
            let laenge = parseFloat(match[2].replace(',', '.'));
            const einheit = (match[3] || '').toLowerCase();
            
            // Einheiten normalisieren zu Metern
            if (einheit === 'cm') {
                laenge = laenge / 100;
            } else if (einheit === 'mm') {
                laenge = laenge / 1000;
            }
            
            for (let i = 0; i < anzahl; i++) {
                benoetigte.push(laenge);
            }
        }
    }
    
    return benoetigte.sort((a, b) => b - a); // Größte zuerst
}

function getLagerlaengen() {
    const lagerlaengen = [];
    const checkboxes = document.querySelectorAll('.lager-item input[type="checkbox"]:checked');
    
    for (const checkbox of checkboxes) {
        const laenge = parseFloat(checkbox.value);
        const anzahlInput = document.getElementById(`anzahl-${checkbox.value}`);
        const anzahl = anzahlInput.value ? parseInt(anzahlInput.value) : Infinity;
        
        lagerlaengen.push({ laenge, anzahl });
    }
    
    return lagerlaengen.sort((a, b) => a.laenge - b.laenge); // Kleinste zuerst
}

function optimiereVerschnitt(benoetigte, lagerlaengen, modus, schnittbreite, toleranz) {
    const ergebnis = {
        platten: [],
        gesamtVerschnitt: 0,
        gesamtMaterial: 0,
        nutzenMaterial: 0,
        gesamtSchnitte: 0
    };
    
    const reste = [...benoetigte];
    const verfuegbar = lagerlaengen.map(l => ({ ...l, verwendet: 0 }));
    
    while (reste.length > 0) {
        let bestePlatte = null;
        let besteKombination = null;
        let besterWert = Infinity;
        
        // Für jede verfügbare Lagerlänge
        for (const lager of verfuegbar) {
            if (lager.verwendet >= lager.anzahl) continue;
            
            const kombination = findeBesteKombination(reste, lager.laenge, schnittbreite, toleranz, modus);
            
            if (kombination.stuecke.length > 0) {
                let wert;
                if (modus === 'verschnitt') {
                    wert = kombination.verschnitt;
                } else {
                    wert = -kombination.stuecke.length; // Negative für absteigende Sortierung
                }
                
                if (wert < besterWert) {
                    besterWert = wert;
                    bestePlatte = lager;
                    besteKombination = kombination;
                }
            }
        }
        
        if (!bestePlatte) break;
        
        // Platte verwenden
        bestePlatte.verwendet++;
        
        // Stücke aus der Liste entfernen
        for (const stueck of besteKombination.stuecke) {
            const index = reste.indexOf(stueck);
            if (index > -1) reste.splice(index, 1);
        }
        
        // Ergebnis speichern
        ergebnis.platten.push({
            lagerlaenge: bestePlatte.laenge,
            stuecke: [...besteKombination.stuecke],
            verschnitt: besteKombination.verschnitt,
            schnitte: besteKombination.stuecke.length
        });
        
        ergebnis.gesamtVerschnitt += besteKombination.verschnitt;
        ergebnis.gesamtMaterial += bestePlatte.laenge;
        ergebnis.nutzenMaterial += besteKombination.stuecke.reduce((sum, s) => sum + s, 0);
        ergebnis.gesamtSchnitte += besteKombination.stuecke.length;
    }
    
    if (reste.length > 0) {
        console.warn('Nicht alle Stücke konnten zugeschnitten werden:', reste);
    }
    
    return ergebnis;
}

function findeBesteKombination(stuecke, lagerlaenge, schnittbreite, toleranz, modus) {
    const maxLaenge = lagerlaenge - toleranz / 1000;
    let besteKombination = { stuecke: [], verschnitt: lagerlaenge };
    
    // Greedy-Ansatz: Größtes Stück zuerst
    const verfuegbar = [...stuecke];
    const gewaehlte = [];
    let verbraucht = 0;
    
    while (verfuegbar.length > 0) {
        let gefunden = false;
        
        for (let i = 0; i < verfuegbar.length; i++) {
            const stueck = verfuegbar[i];
            const neuerVerbrauch = verbraucht + stueck + (gewaehlte.length > 0 ? schnittbreite / 1000 : 0);
            
            if (neuerVerbrauch <= maxLaenge) {
                gewaehlte.push(stueck);
                verfuegbar.splice(i, 1);
                verbraucht = neuerVerbrauch;
                gefunden = true;
                break;
            }
        }
        
        if (!gefunden) break;
    }
    
    const verschnitt = lagerlaenge - verbraucht;
    
    return {
        stuecke: gewaehlte,
        verschnitt: verschnitt
    };
}

function berechneOptimierung() {
    const eingabe = document.getElementById('benoetigte-masze').value;
    const modus = document.getElementById('optimierung-modus').value;
    const schnittbreite = parseFloat(document.getElementById('schnittblatt-breite').value) || 3.0;
    const toleranz = parseFloat(document.getElementById('toleranz').value) || 5.0;
    
    if (!eingabe.trim()) {
        alert('Bitte geben Sie die benötigten Längen ein.');
        return;
    }
    
    const benoetigte = parseEingabe(eingabe);
    const lagerlaengen = getLagerlaengen();
    
    if (benoetigte.length === 0) {
        alert('Keine gültigen Längen erkannt. Bitte überprüfen Sie die Eingabe.');
        return;
    }
    
    if (lagerlaengen.length === 0) {
        alert('Bitte wählen Sie mindestens eine Lagerlänge aus.');
        return;
    }
    
    const ergebnis = optimiereVerschnitt(benoetigte, lagerlaengen, modus, schnittbreite, toleranz);
    zeigeErgebnisse(ergebnis);
}

function zeigeErgebnisse(ergebnis) {
    document.getElementById('results').style.display = 'block';
    
    const effizienz = ergebnis.nutzenMaterial / ergebnis.gesamtMaterial * 100;
    
    document.getElementById('lager-anzahl').textContent = ergebnis.platten.length;
    document.getElementById('gesamt-material').textContent = ergebnis.gesamtMaterial.toFixed(2) + ' m';
    document.getElementById('nutzen-material').textContent = ergebnis.nutzenMaterial.toFixed(2) + ' m';
    document.getElementById('gesamt-verschnitt').textContent = ergebnis.gesamtVerschnitt.toFixed(2) + ' m';
    document.getElementById('gesamt-schnitte').textContent = ergebnis.gesamtSchnitte;
    document.getElementById('effizienz').textContent = effizienz.toFixed(1) + '%';
    
    // Sägeplan-Tabelle
    const tbody = document.getElementById('saegeplan-details');
    tbody.innerHTML = '';
    
    ergebnis.platten.forEach((platte, index) => {
        const row = tbody.insertRow();
        row.insertCell(0).textContent = index + 1;
        row.insertCell(1).textContent = platte.lagerlaenge.toFixed(1) + ' m';
        row.insertCell(2).textContent = platte.stuecke.map(s => s.toFixed(2) + 'm').join(', ');
        row.insertCell(3).textContent = platte.verschnitt.toFixed(3) + ' m';
        row.insertCell(4).textContent = platte.schnitte;
    });
    
    // Optimierungstipp
    if (ergebnis.gesamtVerschnitt > 0.5) {
        const tip = document.getElementById('verschnitt-optimierung');
        tip.style.display = 'block';
        
        const tipText = `
            <strong>Verschnitt-Reduzierung möglich:</strong><br>
            Es entstehen <strong>${ergebnis.gesamtVerschnitt.toFixed(2)} m Verschnitt</strong>. 
            Dies entspricht ${(ergebnis.gesamtVerschnitt / ergebnis.gesamtMaterial * 100).toFixed(1)}% 
            des eingekauften Materials.<br><br>
            <em>Tipp: Prüfen Sie, ob andere Lagerlängen oder eine Anpassung der Toleranz 
            den Verschnitt reduzieren könnte.</em>
        `;
        
        document.getElementById('optimierung-text').innerHTML = tipText;
    }
}

function druckeSaegeplan() {
    const druckinhalt = document.getElementById('druckbarer-saegeplan').innerHTML;
    const originalInhalt = document.body.innerHTML;
    
    document.body.innerHTML = `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
            <h1 style="text-align: center; margin-bottom: 30px;">Sägeplan - Verschnitt-Optimierung</h1>
            <div style="margin-bottom: 20px;">
                <strong>Erstellt am:</strong> ${new Date().toLocaleDateString('de-DE')}<br>
                <strong>Uhrzeit:</strong> ${new Date().toLocaleTimeString('de-DE')}
            </div>
            ${druckinhalt}
        </div>
    `;
    
    window.print();
    document.body.innerHTML = originalInhalt;
    location.reload(); // Seite neu laden um Event-Listener zu restaurieren
}
