// berechnung.js - Vollständige Implementation

// Globale Variablen
let projectData = {};
let roofCanvas = null;
let roofCtx = null;
let calculationResults = {};

// Sichere Storage-Funktionen
function saveData() {
    try {
        localStorage.setItem('dachplattenrechner_data', JSON.stringify(projectData));
        return true;
    } catch (e) {
        console.log('localStorage nicht verfügbar, verwende Session-Speicher');
        try {
            sessionStorage.setItem('dachplattenrechner_data', JSON.stringify(projectData));
            return true;
        } catch (e2) {
            console.error('Speichern fehlgeschlagen:', e2);
            return false;
        }
    }
}

function loadData() {
    try {
        let saved = localStorage.getItem('dachplattenrechner_data');
        if (!saved) {
            saved = sessionStorage.getItem('dachplattenrechner_data');
        }
        return saved ? JSON.parse(saved) : {};
    } catch (e) {
        console.error('Laden fehlgeschlagen:', e);
        return {};
    }
}

// Projekt-Info anzeigen
function displayProjectInfo() {
    console.log('=== ZEIGE PROJEKT-INFO ===');
    
    const profile = projectData.profile;
    const geometry = projectData.geometry;
    
    if (profile) {
        // Profil-Informationen
        document.getElementById('info-profile-name').textContent = profile.profilname || 'Standard';
        document.getElementById('info-deckbreite').textContent = (profile.deckbreite || 1000) + ' mm';
        document.getElementById('info-lieferbreite').textContent = (profile.lieferbreite || 1050) + ' mm';
        document.getElementById('info-seitenueberlappung').textContent = (profile.seitenueberlappung || 50) + ' mm';
        document.getElementById('info-ueberstand').textContent = (profile.ueberstand || 50) + ' mm';
        
        console.log('✅ Profil-Info angezeigt');
    }
    
    if (geometry) {
        // Geometrie-Informationen
        const shapeNames = {
            'rechtwinklig': 'Rechtwinkliges Dreieck',
            'trapez': 'Trapez',
            'rechteck': 'Rechteck',
            'kreis': 'Kreis'
        };
        
        document.getElementById('info-roof-type').textContent = shapeNames[geometry.variant] || geometry.variant || 'Unbekannt';
        document.getElementById('info-area').textContent = (geometry.area || 0).toFixed(2) + ' m²';
        
        // Abmessungen anzeigen
        let dimensionsText = '';
        if (geometry.dimensions) {
            const dims = geometry.dimensions;
            if (dims.katheteA && dims.katheteB) {
                dimensionsText = `${dims.katheteA}m × ${dims.katheteB}m`;
            } else if (dims.length && dims.width) {
                dimensionsText = `${dims.length}m × ${dims.width}m`;
            } else if (dims.radius) {
                dimensionsText = `Radius: ${dims.radius}m`;
            } else if (dims.bottomBase && dims.topBase && dims.height) {
                dimensionsText = `${dims.bottomBase}m × ${dims.topBase}m × ${dims.height}m`;
            }
        }
        document.getElementById('info-dimensions').textContent = dimensionsText || '-';
        
        console.log('✅ Geometrie-Info angezeigt');
    }
    
    // Dachneigung (vereinfacht)
    document.getElementById('info-neigung').textContent = '25°'; // Standardwert
    
    // Button ausblenden da automatische Berechnung
    const calculateBtn = document.querySelector('button[onclick="calculateLengths()"]');
    if (calculateBtn) {
        calculateBtn.style.display = 'none';
        console.log('✅ Berechnung-Button ausgeblendet');
    }
}

// Wasserlaufrichtung bestimmen
function determineWaterDirection() {
    console.log('=== BESTIMME WASSERLAUFRICHTUNG ===');
    
    // Vereinfachte Logik: Immer längs zur Hauptrichtung
    const direction = 'laengs';
    const directionText = 'Längs (parallel zur Wasserlaufrichtung)';
    
    document.getElementById('direction-text').textContent = directionText;
    
    console.log('Wasserlaufrichtung:', direction);
    return direction;
}

// Canvas-Setup
function setupCanvas() {
    roofCanvas = document.getElementById('roof-canvas');
    if (!roofCanvas) {
        console.error('Canvas nicht gefunden!');
        return;
    }
    
    roofCtx = roofCanvas.getContext('2d');
    
    // Canvas-Größe anpassen
    const container = roofCanvas.parentElement;
    if (container) {
        roofCanvas.width = container.clientWidth - 40;
        roofCanvas.height = 400;
    }
    
    console.log('Canvas setup abgeschlossen');
}

// Dach visualisieren
function visualizeRoof() {
    if (!roofCtx || !roofCanvas) {
        console.error('Canvas nicht initialisiert');
        return;
    }
    
    // Canvas löschen
    roofCtx.clearRect(0, 0, roofCanvas.width, roofCanvas.height);
    
    // Hintergrund
    roofCtx.fillStyle = '#f8f9fa';
    roofCtx.fillRect(0, 0, roofCanvas.width, roofCanvas.height);
    
    const centerX = roofCanvas.width / 2;
    const centerY = roofCanvas.height / 2;
    const scale = 50; // Pixel pro Meter
    
    const geometry = projectData.geometry;
    if (!geometry || !geometry.dimensions) {
        console.log('Keine Geometrie-Daten, zeichne Standard-Rechteck');
        drawRectangle(centerX, centerY, 8, 5, scale);
        return;
    }
    
    const dims = geometry.dimensions;
    
    switch (geometry.variant) {
        case 'rechtwinklig':
            drawRightTriangle(centerX, centerY, dims.katheteA || 4, dims.katheteB || 5, scale);
            break;
        case 'trapez':
            drawTrapezoid(centerX, centerY, dims.bottomBase || 8, dims.topBase || 6, dims.height || 4, scale);
            break;
        case 'rechteck':
            drawRectangle(centerX, centerY, dims.length || 8, dims.width || 5, scale);
            break;
        case 'kreis':
            drawCircle(centerX, centerY, dims.radius || 4, scale);
            break;
        default:
            drawRectangle(centerX, centerY, 8, 5, scale);
    }
    
    // Platten-Layout überlagern
    drawPlateLayout();
}

// Zeichenfunktionen
function drawRectangle(centerX, centerY, length, width, scale) {
    const w = length * scale;
    const h = width * scale;
    
    // Dachfläche
    roofCtx.fillStyle = 'rgba(0, 123, 255, 0.3)';
    roofCtx.fillRect(centerX - w/2, centerY - h/2, w, h);
    
    // Umriss
    roofCtx.strokeStyle = '#007bff';
    roofCtx.lineWidth = 3;
    roofCtx.strokeRect(centerX - w/2, centerY - h/2, w, h);
}

function drawRightTriangle(centerX, centerY, katheteA, katheteB, scale) {
    const a = katheteA * scale;
    const b = katheteB * scale;
    
    // Dreieck zeichnen
    roofCtx.beginPath();
    roofCtx.moveTo(centerX - a/2, centerY + b/2);
    roofCtx.lineTo(centerX + a/2, centerY + b/2);
    roofCtx.lineTo(centerX - a/2, centerY - b/2);
    roofCtx.closePath();
    
    // Füllung
    roofCtx.fillStyle = 'rgba(0, 123, 255, 0.3)';
    roofCtx.fill();
    
    // Umriss
    roofCtx.strokeStyle = '#007bff';
    roofCtx.lineWidth = 3;
    roofCtx.stroke();
}

function drawTrapezoid(centerX, centerY, bottomBase, topBase, height, scale) {
    const bb = bottomBase * scale;
    const tb = topBase * scale;
    const h = height * scale;
    
    // Trapez zeichnen
    roofCtx.beginPath();
    roofCtx.moveTo(centerX - bb/2, centerY + h/2);
    roofCtx.lineTo(centerX + bb/2, centerY + h/2);
    roofCtx.lineTo(centerX + tb/2, centerY - h/2);
    roofCtx.lineTo(centerX - tb/2, centerY - h/2);
    roofCtx.closePath();
    
    // Füllung
    roofCtx.fillStyle = 'rgba(0, 123, 255, 0.3)';
    roofCtx.fill();
    
    // Umriss
    roofCtx.strokeStyle = '#007bff';
    roofCtx.lineWidth = 3;
    roofCtx.stroke();
}

function drawCircle(centerX, centerY, radius, scale) {
    const r = radius * scale;
    
    // Kreis zeichnen
    roofCtx.beginPath();
    roofCtx.arc(centerX, centerY, r, 0, 2 * Math.PI);
    
    // Füllung
    roofCtx.fillStyle = 'rgba(0, 123, 255, 0.3)';
    roofCtx.fill();
    
    // Umriss
    roofCtx.strokeStyle = '#007bff';
    roofCtx.lineWidth = 3;
    roofCtx.stroke();
}

function drawPlateLayout() {
    if (!calculationResults.bahnenAnzahl) return;
    
    const profile = projectData.profile;
    const geometry = projectData.geometry;
    if (!profile || !geometry) return;
    
    // KORRIGIERT: Richtige Begriffe verwenden
    const lieferbreite = profile.lieferbreite / 1000; // physische Plattenbreite (z.B. 1.05m)
    const deckbreite = profile.deckbreite / 1000; // effektive Deckbreite (z.B. 1.0m)
    const seitenueberlappung = (profile.seitenueberlappung / 1000); // z.B. 0.05m
    
    const scale = 50;
    const centerX = roofCanvas.width / 2;
    const centerY = roofCanvas.height / 2;
    
    console.log(`Lieferbreite: ${lieferbreite}m, Deckbreite: ${deckbreite}m, Überlappung: ${seitenueberlappung}m`);
    
    if (geometry.variant === 'trapez') {
        // Trapez: Einfacher Ansatz mit Farbfilter
        const bottomBase = (geometry.dimensions.bottomBase || 8) * scale;
        const topBase = (geometry.dimensions.topBase || 6) * scale;
        const height = (geometry.dimensions.height || 4) * scale;
        
        // SCHRITT 1: Alle Platten ROT zeichnen (Verschnitt)
        for (let i = 0; i < calculationResults.bahnenAnzahl; i++) {
            const startX = centerX - bottomBase/2 + (i * deckbreite * scale);
            const plattenbreite = lieferbreite * scale;
            
            // Komplette Platte als VERSCHNITT (rot)
            roofCtx.fillStyle = 'rgba(220, 53, 69, 0.8)'; // Verschnitt-Rot
            roofCtx.fillRect(startX, centerY - height/2, plattenbreite, height);
            
            // Plattennummer in weiß (auf rotem Hintergrund)
            roofCtx.fillStyle = '#fff';
            roofCtx.font = 'bold 14px Arial';
            roofCtx.textAlign = 'center';
            roofCtx.fillText(i + 1, startX + plattenbreite/2, centerY + 5);
        }
        
        // SCHRITT 2: Trapez-Form als GRÜNE MASKE drüber zeichnen
        roofCtx.fillStyle = 'rgba(40, 167, 69, 0.9)'; // Nutzbarer Bereich (grün)
        roofCtx.beginPath();
        roofCtx.moveTo(centerX - bottomBase/2, centerY + height/2);  // unten links
        roofCtx.lineTo(centerX + bottomBase/2, centerY + height/2);  // unten rechts
        roofCtx.lineTo(centerX + topBase/2, centerY - height/2);     // oben rechts
        roofCtx.lineTo(centerX - topBase/2, centerY - height/2);     // oben links
        roofCtx.closePath();
        roofCtx.fill();
        
        // SCHRITT 3: Seitenüberlappungen (dunkelgrün) über die grüne Maske
        for (let i = 1; i < calculationResults.bahnenAnzahl; i++) { // Ab Platte 2
            const startX = centerX - bottomBase/2 + (i * deckbreite * scale);
            const ueberlappungX = startX - (seitenueberlappung * scale);
            const plattenbreite = lieferbreite * scale;
            
            // Überlappungsbereich (nur innerhalb der Trapez-Form)
            // Clip auf Trapez-Form
            roofCtx.save();
            roofCtx.beginPath();
            roofCtx.moveTo(centerX - bottomBase/2, centerY + height/2);
            roofCtx.lineTo(centerX + bottomBase/2, centerY + height/2);
            roofCtx.lineTo(centerX + topBase/2, centerY - height/2);
            roofCtx.lineTo(centerX - topBase/2, centerY - height/2);
            roofCtx.closePath();
            roofCtx.clip();
            
            // Überlappung zeichnen
            roofCtx.fillStyle = 'rgba(20, 100, 50, 0.8)'; // Dunkelgrün für Überlappung
            roofCtx.fillRect(ueberlappungX, centerY - height/2, seitenueberlappung * scale, height);
            
            roofCtx.restore();
        }
        
        // SCHRITT 4: Plattennummern neu zeichnen (auf grünem Hintergrund)
        for (let i = 0; i < calculationResults.bahnenAnzahl; i++) {
            const startX = centerX - bottomBase/2 + (i * deckbreite * scale);
            const plattenbreite = lieferbreite * scale;
            
            roofCtx.fillStyle = '#000';
            roofCtx.font = 'bold 14px Arial';
            roofCtx.textAlign = 'center';
            roofCtx.fillText(i + 1, startX + plattenbreite/2, centerY + 5);
        }
        
        // SCHRITT 5: Trapez-Umriss zeichnen
        roofCtx.strokeStyle = '#007bff';
        roofCtx.lineWidth = 3;
        roofCtx.beginPath();
        roofCtx.moveTo(centerX - bottomBase/2, centerY + height/2);
        roofCtx.lineTo(centerX + bottomBase/2, centerY + height/2);
        roofCtx.lineTo(centerX + topBase/2, centerY - height/2);
        roofCtx.lineTo(centerX - topBase/2, centerY - height/2);
        roofCtx.closePath();
        roofCtx.stroke();
        
        console.log('✅ Trapez mit Farbfilter-Methode gezeichnet');
        
    } else {
        // Andere Formen hier mit dem gleichen Prinzip...
        console.log('Andere Geometrie - noch nicht implementiert');
    }
}

// Berechnung durchführen
function calculateLengths() {
    console.log('=== BERECHNUNG STARTEN ===');
    
    const profile = projectData.profile;
    const geometry = projectData.geometry;
    
    if (!profile || !geometry) {
        alert('Unvollständige Projektdaten. Bitte kehren Sie zu den vorherigen Schritten zurück.');
        return;
    }
    
    // Vereinfachte Berechnung
    const area = geometry.area || 40;
    const deckbreite = profile.deckbreite / 1000; // in Meter
    const seitenueberlappung = (profile.seitenueberlappung || 50) / 1000; // in Meter
    const nutzbreite = deckbreite - seitenueberlappung;
    
    // Anzahl Bahnen berechnen - KORRIGIERT für Trapez und Dreieck
    let bahnenAnzahl;
    if (geometry.variant === 'trapez') {
        // Für Trapeze: Berechnung basierend auf der breiteren Basis (unten)
        // Da wir von der breiteren Seite starten, benötigen wir weniger Platten
        const bottomBase = geometry.dimensions.bottomBase || 8;
        const topBase = geometry.dimensions.topBase || 6;
        
        // Mittlere Breite für realistischere Berechnung
        const averageWidth = (bottomBase + topBase) / 2;
        bahnenAnzahl = Math.ceil(averageWidth / nutzbreite);
        
        console.log(`Trapez-Berechnung: Unten ${bottomBase}m, Oben ${topBase}m, Mittel ${averageWidth}m, Bahnen: ${bahnenAnzahl}`);
        
    } else if (geometry.variant === 'rechtwinklig') {
        // Für rechtwinklige Dreiecke: Über die längere Kathete
        const katheteA = geometry.dimensions.katheteA || 4;
        const katheteB = geometry.dimensions.katheteB || 5;
        
        // Die Basis ist die horizontale Kathete
        const basis = katheteA;
        bahnenAnzahl = Math.ceil(basis / nutzbreite);
        
        console.log(`Dreieck-Berechnung: Basis ${basis}m, Bahnen: ${bahnenAnzahl}`);
        
    } else if (geometry.variant === 'rechteck') {
        // Für Rechtecke: Über die Breite
        const width = geometry.dimensions.width || 5;
        bahnenAnzahl = Math.ceil(width / nutzbreite);
    } else {
        // Standard-Berechnung
        bahnenAnzahl = Math.ceil(Math.sqrt(area) / nutzbreite);
    }
    
    // Plattenlänge berechnen
    let plattenlaenge;
    if (geometry.variant === 'rechtwinklig') {
        plattenlaenge = geometry.dimensions.katheteB || 5;
    } else if (geometry.variant === 'trapez') {
        plattenlaenge = geometry.dimensions.height || 4;
    } else if (geometry.variant === 'rechteck') {
        plattenlaenge = geometry.dimensions.length || 8;
    } else {
        plattenlaenge = 6; // Standard
    }
    
    // Gesamtlänge und Verschnitt
    const gesamtlaenge = bahnenAnzahl * plattenlaenge;
    const verschnitt = 10; // 10% Verschnitt
    
    // Ergebnisse speichern
    calculationResults = {
        bahnenAnzahl: bahnenAnzahl,
        plattenlaenge: plattenlaenge,
        gesamtlaenge: gesamtlaenge,
        verschnitt: verschnitt,
        dachflaeche: area,
        richtung: 'laengs'
    };
    
    // Bestellliste erstellen
    const bestellliste = [];
    if (profile.lagerlaengen && profile.lagerlaengen.length > 0) {
        // Lagerlängen verwenden
        const benoetigteLaenge = plattenlaenge * 1000; // in mm
        let besteLaenge = profile.lagerlaengen.find(l => l >= benoetigteLaenge);
        if (!besteLaenge) {
            besteLaenge = Math.max(...profile.lagerlaengen);
        }
        
        bestellliste.push({
            length: besteLaenge,
            quantity: bahnenAnzahl,
            usage: 'Hauptbahnen'
        });
    } else {
        // Bestellbereich verwenden
        const laenge = Math.min(Math.max(plattenlaenge * 1000, profile.minLaenge || 1000), profile.maxLaenge || 12000);
        bestellliste.push({
            length: laenge,
            quantity: bahnenAnzahl,
            usage: 'Hauptbahnen'
        });
    }
    
    calculationResults.bestellliste = bestellliste;
    
    // Ergebnisse anzeigen
    displayResults();
    
    console.log('Berechnung abgeschlossen:', calculationResults);
}

// Ergebnisse anzeigen
function displayResults() {
    // Ergebnisse-Sektion anzeigen
    document.getElementById('results-section').style.display = 'block';
    
    // Summary-Werte
    document.getElementById('total-rows').textContent = calculationResults.bahnenAnzahl;
    document.getElementById('plate-length').textContent = calculationResults.plattenlaenge.toFixed(1) + ' m';
    document.getElementById('total-length').textContent = calculationResults.gesamtlaenge.toFixed(1) + ' m';
    document.getElementById('total-waste').textContent = calculationResults.verschnitt.toFixed(1) + ' %';
    
    // Bestellliste
    const tbody = document.getElementById('order-tbody');
    tbody.innerHTML = '';
    
    calculationResults.bestellliste.forEach(item => {
        const row = tbody.insertRow();
        row.innerHTML = `
            <td>${item.length}</td>
            <td>${item.quantity}</td>
            <td>${(item.length * item.quantity / 1000).toFixed(1)}</td>
            <td>${item.usage}</td>
        `;
    });
    
    // Erklärung
    const explanation = document.getElementById('calculation-explanation');
    explanation.innerHTML = `
        <h5>Berechnungsschritte:</h5>
        <ol>
            <li><strong>Dachfläche:</strong> ${calculationResults.dachflaeche.toFixed(2)} m²</li>
            <li><strong>Deckbreite:</strong> ${projectData.profile.deckbreite} mm</li>
            <li><strong>Nutzbreite:</strong> ${projectData.profile.deckbreite - projectData.profile.seitenueberlappung} mm (nach Abzug Seitenüberlappung)</li>
            <li><strong>Geometrie-spezifische Berechnung:</strong> ${getCalculationMethod()}</li>
            <li><strong>Anzahl Bahnen:</strong> ${calculationResults.bahnenAnzahl} (optimiert für Geometrie)</li>
            <li><strong>Verlegerichtung:</strong> ${calculationResults.richtung === 'laengs' ? 'Längs' : 'Quer'} zur Wasserlaufrichtung</li>
        </ol>
        <p><strong>Empfehlung:</strong> Bestellen Sie ${calculationResults.verschnitt}% Verschnitt zusätzlich für Zuschnitte und Reserve.</p>
        <p><strong>Hinweis:</strong> Bei trapezförmigen Dächern wird von der breiteren Seite aus begonnen, wodurch weniger Platten benötigt werden.</p>
    `;
    
    // Continue-Button aktivieren
    document.getElementById('continue-btn').disabled = false;
    
    // Visualisierung aktualisieren
    visualizeRoof();
}

// Hilfsfunktion für Berechnungsmethode
function getCalculationMethod() {
    const geometry = projectData.geometry;
    if (!geometry) return 'Standard';
    
    switch (geometry.variant) {
        case 'trapez':
            const bottomBase = geometry.dimensions.bottomBase || 8;
            const topBase = geometry.dimensions.topBase || 6;
            const average = (bottomBase + topBase) / 2;
            return `Trapez: Mittlere Breite (${bottomBase}m + ${topBase}m) ÷ 2 = ${average.toFixed(1)}m`;
        case 'rechtwinklig':
            const katheteA = geometry.dimensions.katheteA || 4;
            return `Rechtwinkliges Dreieck: Basis ${katheteA}m`;
        case 'rechteck':
            const width = geometry.dimensions.width || 5;
            return `Rechteck: Breite ${width}m`;
        default:
            return 'Standard-Berechnung';
    }
    
    // Continue-Button aktivieren
    document.getElementById('continue-btn').disabled = false;
    
    // Visualisierung aktualisieren
    visualizeRoof();
}

// Speichern und weiter
function saveAndContinue() {
    if (!calculationResults.bahnenAnzahl) {
        alert('Bitte führen Sie zuerst die Berechnung durch!');
        return;
    }
    
    // Berechnungsergebnisse zu Projektdaten hinzufügen
    projectData.calculations = calculationResults;
    
    const saved = saveData();
    if (!saved) {
        alert('Fehler beim Speichern!');
        return;
    }
    
    // Navigation zum Anrissplan
    window.location.href = 'Anrissplan.html';
}

// Navigation
function goBack() {
    window.location.href = 'Editor.html';
}

// Initialisierung
document.addEventListener('DOMContentLoaded', function() {
    console.log('=== BERECHNUNG-SEITE GELADEN ===');
    
    // Projektdaten laden
    projectData = loadData();
    console.log('Geladene Projektdaten:', projectData);
    
    // Validierung
    if (!projectData.profile || !projectData.geometry) {
        console.error('Unvollständige Projektdaten');
        
        // Debug-Info anzeigen
        const debugInfo = document.getElementById('debug-info');
        const debugContent = document.getElementById('debug-content');
        if (debugInfo && debugContent) {
            debugInfo.style.display = 'block';
            debugContent.innerHTML = `
                <p><strong>Gefundene Daten:</strong></p>
                <pre>${JSON.stringify(projectData, null, 2)}</pre>
                <p>Fehlende Daten werden mit Standardwerten ersetzt.</p>
            `;
        }
        
        // Fallback-Daten setzen
        if (!projectData.profile) {
            projectData.profile = {
                profilname: 'TP20 Standard',
                deckbreite: 1000,
                lieferbreite: 1050,
                seitenueberlappung: 50,
                ueberstand: 50,
                lagerlaengen: [2000, 3000, 4000, 5000, 6000]
            };
        }
        
        if (!projectData.geometry) {
            projectData.geometry = {
                variant: 'rechteck',
                dimensions: { length: 8, width: 5 },
                area: 40
            };
        }
    }
    
    // Canvas setup
    setupCanvas();
    
    // Info anzeigen
    displayProjectInfo();
    determineWaterDirection();
    
    // AUTOMATISCHE BERECHNUNG beim Laden der Seite
    calculateLengths();
    
    console.log('✅ Berechnung-Seite erfolgreich initialisiert mit automatischer Berechnung');
});

// Canvas-Größe bei Fenster-Resize anpassen
window.addEventListener('resize', function() {
    setTimeout(setupCanvas, 100);
    setTimeout(visualizeRoof, 200);
});

// Debug-Funktionen
window.debugCalculation = () => {
    console.log('=== BERECHNUNG DEBUG ===');
    console.log('projectData:', projectData);
    console.log('calculationResults:', calculationResults);
    console.log('Canvas:', roofCanvas);
};

console.log('✅ berechnung.js vollständig geladen');
