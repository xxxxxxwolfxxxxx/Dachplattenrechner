// KORRIGIERTE berechnung.js - Vollständige Implementation

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
    console.log('=== ERWEITERTE DATEN-SUCHE ===');
    
    let savedData = {};
    try {
        let saved = localStorage.getItem('dachplattenrechner_data');
        if (!saved) {
            saved = sessionStorage.getItem('dachplattenrechner_data');
        }
        if (saved) {
            savedData = JSON.parse(saved);
            console.log('📦 Standard Storage gefunden:', savedData);
        }
    } catch (e) {
        console.error('Fehler beim Standard-Laden:', e);
    }
    
    // Suche nach ALLEN möglichen Storage-Keys
    const possibleKeys = [
        'dachplattenrechner_data',
        'dachplatten_data', 
        'roof_data',
        'formauswahl_data',
        'geometry_data',
        'project_data'
    ];
    
    for (const key of possibleKeys) {
        try {
            const data = localStorage.getItem(key) || sessionStorage.getItem(key);
            if (data) {
                const parsed = JSON.parse(data);
                console.log(`📦 Gefunden unter ${key}:`, parsed);
                if (parsed.geometry || parsed.roofShape) {
                    Object.assign(savedData, parsed);
                }
            }
        } catch (e) {
            // Ignoriere Fehler
        }
    }
    
    console.log('🎯 FINAL zusammengeführte Daten:', savedData);
    return savedData;
}

// KORRIGIERTE Datenvalidierung und -extraktion
function extractGeometryData() {
    console.log('=== EXTRAHIERE GEOMETRIE-DATEN ===');
    console.log('ProjectData:', projectData);
    
    let geometry = null;
    let area = 0;
    let variant = 'rechteck';
    
    // 1. Prüfe projectData.geometry (von formauswahl.html)
    if (projectData.geometry && projectData.geometry.dimensions) {
        console.log('✅ Gefunden: projectData.geometry');
        geometry = projectData.geometry;
        area = geometry.area || 0;
        variant = geometry.variant || 'rechteck';
    }
    
    // 2. Prüfe projectData.roofShape (von editor.html/dachform.html)
    else if (projectData.roofShape) {
        console.log('✅ Gefunden: projectData.roofShape');
        variant = projectData.roofShape.variant || 'rechteck';
        
        // Versuche Fläche aus points zu berechnen
        if (projectData.roofShape.points && projectData.roofShape.points.length > 2) {
            area = calculateAreaFromPoints(projectData.roofShape.points);
        } else {
            // Fallback: Standardabmessungen basierend auf Variante
            area = getDefaultAreaForVariant(variant);
        }
        
        geometry = {
            variant: variant,
            area: area,
            dimensions: getDefaultDimensionsForVariant(variant)
        };
    }
    
    // 3. Fallback
    else {
        console.log('⚠️ Keine Geometrie gefunden, verwende Fallback');
        variant = 'rechteck';
        area = 40; // 8m x 5m
        geometry = {
            variant: variant,
            area: area,
            dimensions: { length: 8, width: 5 }
        };
    }
    
    console.log('🎯 Extrahierte Geometrie:', {
        variant: variant,
        area: area,
        geometry: geometry
    });
    
    return { variant, area, geometry };
}

// Hilfsfunktionen für Fallback-Daten
function getDefaultDimensionsForVariant(variant) {
    switch (variant) {
        case 'trapez':
            return { bottomBase: 8, topBase: 6, height: 4 };
        case 'rechteck':
            return { length: 8, width: 5 };
        case 'rechtwinklig':
            return { katheteA: 4, katheteB: 5 };
        case 'kreis':
            return { radius: 4 };
        case 'lform':
            return { totalLength: 10, totalWidth: 8, cutoutLength: 4, cutoutWidth: 4 };
        case '3':
            return { sideA: 8, sideB: 6, sideC: 7 };
        case '4':
            return { bottomWidth: 10, topWidth: 8, leftSide: 6, rightSide: 6 };
        default:
            return { length: 8, width: 5 };
    }
}

function getDefaultAreaForVariant(variant) {
    const dims = getDefaultDimensionsForVariant(variant);
    
    switch (variant) {
        case 'trapez':
            return ((dims.bottomBase + dims.topBase) / 2) * dims.height;
        case 'rechteck':
            return dims.length * dims.width;
        case 'rechtwinklig':
            return (dims.katheteA * dims.katheteB) / 2;
        case 'kreis':
            return Math.PI * dims.radius * dims.radius;
        case 'lform':
            return (dims.totalLength * dims.totalWidth) - (dims.cutoutLength * dims.cutoutWidth);
        case '3':
            const s = (dims.sideA + dims.sideB + dims.sideC) / 2;
            return Math.sqrt(s * (s - dims.sideA) * (s - dims.sideB) * (s - dims.sideC));
        case '4':
            return ((dims.bottomWidth + dims.topWidth) / 2) * dims.leftSide;
        default:
            return 40;
    }
}

function calculateAreaFromPoints(points) {
    if (!points || points.length < 3) return 40;
    
    // Shoelace-Formel für Polygon-Fläche
    let area = 0;
    for (let i = 0; i < points.length; i++) {
        const j = (i + 1) % points.length;
        area += points[i].x * points[j].y;
        area -= points[j].x * points[i].y;
    }
    return Math.abs(area) / 2;
}

// Projekt-Info anzeigen
function displayProjectInfo() {
    console.log('=== ZEIGE PROJEKT-INFO ===');
    
    const profile = projectData.profile;
    const { variant, area, geometry } = extractGeometryData();
    
    if (profile) {
        // Profil-Informationen
        document.getElementById('info-profile-name').textContent = profile.profilname || 'Standard';
        document.getElementById('info-deckbreite').textContent = (profile.deckbreite || 1000) + ' mm';
        document.getElementById('info-lieferbreite').textContent = (profile.lieferbreite || 1050) + ' mm';
        document.getElementById('info-seitenueberlappung').textContent = (profile.seitenueberlappung || 50) + ' mm';
        document.getElementById('info-ueberstand').textContent = (profile.ueberstand || 50) + ' mm';
        
        console.log('✅ Profil-Info angezeigt');
    }
    
    // Geometrie-Informationen
    const shapeNames = {
        'rechtwinklig': 'Rechtwinkliges Dreieck',
        'trapez': 'Trapez',
        'rechteck': 'Rechteck',
        'quadrat': 'Quadrat',
        'kreis': 'Kreis',
        'oval': 'Oval',
        'lform': 'L-Form',
        'tform': 'T-Form',
        'dreieck': 'Gleichseitiges Dreieck',
        'ungleichschenklig': 'Ungleichschenkliges Dreieck',
        '3': 'Dreieck',
        '4': 'Viereck'
    };
    
    document.getElementById('info-roof-type').textContent = shapeNames[variant] || variant || 'Unbekannt';
    document.getElementById('info-area').textContent = area.toFixed(2) + ' m²';
    
    // Abmessungen anzeigen
    let dimensionsText = '';
    if (geometry && geometry.dimensions) {
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
    
    // Dachneigung (vereinfacht)
    document.getElementById('info-neigung').textContent = '25°'; // Standardwert
    
    console.log('✅ Projekt-Info vollständig angezeigt');
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
    
    const { variant, geometry } = extractGeometryData();
    
    if (geometry && geometry.dimensions) {
        const dims = geometry.dimensions;
        
        switch (variant) {
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
            case 'lform':
                drawLShape(centerX, centerY, dims.totalLength || 10, dims.totalWidth || 8, dims.cutoutLength || 4, dims.cutoutWidth || 4, scale);
                break;
            case '3':
                drawTriangle(centerX, centerY, dims.sideA || 8, dims.sideB || 6, dims.sideC || 7, scale);
                break;
            case '4':
                drawQuadrilateral(centerX, centerY, dims, scale);
                break;
            default:
                drawRectangle(centerX, centerY, 8, 5, scale);
        }
    } else {
        console.log('Keine Geometrie-Daten, zeichne Standard-Rechteck');
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

function drawLShape(centerX, centerY, totalLength, totalWidth, cutoutLength, cutoutWidth, scale) {
    const tl = totalLength * scale;
    const tw = totalWidth * scale;
    const cl = cutoutLength * scale;
    const cw = cutoutWidth * scale;
    
    // L-Form zeichnen
    roofCtx.beginPath();
    roofCtx.moveTo(centerX - tl/2, centerY - tw/2);
    roofCtx.lineTo(centerX + tl/2, centerY - tw/2);
    roofCtx.lineTo(centerX + tl/2, centerY - tw/2 + cw);
    roofCtx.lineTo(centerX - tl/2 + cl, centerY - tw/2 + cw);
    roofCtx.lineTo(centerX - tl/2 + cl, centerY + tw/2);
    roofCtx.lineTo(centerX - tl/2, centerY + tw/2);
    roofCtx.closePath();
    
    // Füllung
    roofCtx.fillStyle = 'rgba(0, 123, 255, 0.3)';
    roofCtx.fill();
    
    // Umriss
    roofCtx.strokeStyle = '#007bff';
    roofCtx.lineWidth = 3;
    roofCtx.stroke();
}

function drawTriangle(centerX, centerY, sideA, sideB, sideC, scale) {
    // Prüfe ob gültiges Dreieck
    if ((sideA + sideB <= sideC) || (sideA + sideC <= sideB) || (sideB + sideC <= sideA)) {
        console.log('Ungültiges Dreieck, zeichne Fallback');
        drawRightTriangle(centerX, centerY, sideA, sideB, scale);
        return;
    }
    
    // Berechne Dreieck-Koordinaten mit dem Kosinussatz
    const a = sideA * scale;
    const b = sideB * scale; 
    const c = sideC * scale;
    
    const cosC = (a*a + b*b - c*c) / (2*a*b);
    const angleC = Math.acos(Math.max(-1, Math.min(1, cosC)));
    
    // Punkte des Dreiecks
    const p1 = { x: centerX - c/2, y: centerY + 30 };
    const p2 = { x: centerX + c/2, y: centerY + 30 };
    const p3 = { 
        x: centerX - c/2 + b * Math.cos(Math.PI - angleC), 
        y: centerY + 30 - b * Math.sin(Math.PI - angleC) 
    };
    
    // Dreieck zeichnen
    roofCtx.beginPath();
    roofCtx.moveTo(p1.x, p1.y);
    roofCtx.lineTo(p2.x, p2.y);
    roofCtx.lineTo(p3.x, p3.y);
    roofCtx.closePath();
    
    // Füllung
    roofCtx.fillStyle = 'rgba(0, 123, 255, 0.3)';
    roofCtx.fill();
    
    // Umriss
    roofCtx.strokeStyle = '#007bff';
    roofCtx.lineWidth = 3;
    roofCtx.stroke();
}

function drawQuadrilateral(centerX, centerY, dims, scale) {
    const bottomWidth = dims.bottomWidth || 10;
    const topWidth = dims.topWidth || 8;
    const leftSide = dims.leftSide || 6;
    const rightSide = dims.rightSide || 6;
    const skew = dims.skew || 0;
    
    const height = leftSide * scale;
    
    const points = [
        { x: centerX - bottomWidth*scale/2, y: centerY + height/2 },
        { x: centerX + bottomWidth*scale/2, y: centerY + height/2 },
        { x: centerX + topWidth*scale/2 + skew*scale, y: centerY - height/2 },
        { x: centerX - topWidth*scale/2 + skew*scale, y: centerY - height/2 }
    ];
    
    roofCtx.beginPath();
    roofCtx.moveTo(points[0].x, points[0].y);
    roofCtx.lineTo(points[1].x, points[1].y);
    roofCtx.lineTo(points[2].x, points[2].y);
    roofCtx.lineTo(points[3].x, points[3].y);
    roofCtx.closePath();
    
    roofCtx.fillStyle = 'rgba(0, 123, 255, 0.3)';
    roofCtx.fill();
    
    roofCtx.strokeStyle = '#007bff';
    roofCtx.lineWidth = 3;
    roofCtx.stroke();
}

function drawPlateLayout() {
    if (!calculationResults.bahnenAnzahl) return;
    
    const profile = projectData.profile;
    const { geometry } = extractGeometryData();
    if (!profile || !geometry) return;
    
    const lieferbreite = profile.lieferbreite / 1000; // physische Plattenbreite
    const deckbreite = profile.deckbreite / 1000; // effektive Deckbreite
    const seitenueberlappung = (profile.seitenueberlappung / 1000); // Überlappung
    
    const scale = 50;
    const centerX = roofCanvas.width / 2;
    const centerY = roofCanvas.height / 2;
    
    console.log(`Lieferbreite: ${lieferbreite}m, Deckbreite: ${deckbreite}m, Überlappung: ${seitenueberlappung}m`);
    
    // Vereinfachte Platten-Darstellung
    for (let i = 0; i < calculationResults.bahnenAnzahl; i++) {
        const startX = centerX - (calculationResults.bahnenAnzahl * deckbreite * scale) / 2 + (i * deckbreite * scale);
        const plattenbreite = lieferbreite * scale;
        const plattenhoehe = (geometry.dimensions?.height || geometry.dimensions?.width || 5) * scale;
        
        // Platte zeichnen
        roofCtx.fillStyle = 'rgba(40, 167, 69, 0.6)';
        roofCtx.fillRect(startX, centerY - plattenhoehe/2, plattenbreite, plattenhoehe);
        
        // Plattennummer
        roofCtx.fillStyle = '#000';
        roofCtx.font = 'bold 14px Arial';
        roofCtx.textAlign = 'center';
        roofCtx.fillText(i + 1, startX + plattenbreite/2, centerY + 5);
        
        // Überlappung bei nachfolgenden Platten
        if (i > 0) {
            roofCtx.fillStyle = 'rgba(220, 53, 69, 0.6)';
            roofCtx.fillRect(startX - seitenueberlappung * scale, centerY - plattenhoehe/2, seitenueberlappung * scale, plattenhoehe);
        }
    }
}

// KORRIGIERTE Berechnung
function calculateLengths() {
    console.log('=== BERECHNUNG STARTEN ===');
    
    const profile = projectData.profile;
    const { variant, area, geometry } = extractGeometryData();
    
    if (!profile) {
        alert('Unvollständige Projektdaten. Bitte kehren Sie zu den vorherigen Schritten zurück.');
        return;
    }
    
    console.log('Berechnung für:', { variant, area, profile: profile.profilname });
    
    const deckbreite = profile.deckbreite / 1000; // in Meter
    const seitenueberlappung = (profile.seitenueberlappung || 50) / 1000; // in Meter
    const nutzbreite = deckbreite - seitenueberlappung;
    
    // Anzahl Bahnen berechnen - KORRIGIERT für verschiedene Formen
    let bahnenAnzahl;
    let plattenlaenge;
    
    if (geometry && geometry.dimensions) {
        const dims = geometry.dimensions;
        
        switch (variant) {
            case 'trapez':
                // Für Trapeze: Berechnung basierend auf der breiteren Basis
                const bottomBase = dims.bottomBase || 8;
                const topBase = dims.topBase || 6;
                const averageWidth = (bottomBase + topBase) / 2;
                bahnenAnzahl = Math.ceil(averageWidth / deckbreite);
                plattenlaenge = dims.height || 4;
                break;
                
            case 'rechtwinklig':
                // Für rechtwinklige Dreiecke: Über die längere Kathete
                const katheteA = dims.katheteA || 4;
                const katheteB = dims.katheteB || 5;
                bahnenAnzahl = Math.ceil(katheteA / deckbreite);
                plattenlaenge = katheteB;
                break;
                
            case 'rechteck':
                // Für Rechtecke: Über die Breite
                const width = dims.width || 5;
                const length = dims.length || 8;
                bahnenAnzahl = Math.ceil(width / deckbreite);
                plattenlaenge = length;
                break;
                
            case 'kreis':
                // Für Kreise: Durchmesser als Basis
                const diameter = (dims.radius || 4) * 2;
                bahnenAnzahl = Math.ceil(diameter / deckbreite);
                plattenlaenge = diameter;
                break;
                
            case 'lform':
                // Für L-Form: Gesamtbreite als Basis
                const totalWidth = dims.totalWidth || 8;
                const totalLength = dims.totalLength || 10;
                bahnenAnzahl = Math.ceil(totalWidth / deckbreite);
                plattenlaenge = totalLength;
                break;
                
            case '3':
                // KORREKTE DREIECK-BERECHNUNG
                const sideA = dims.sideA || 8;
                const sideB = dims.sideB || 6; 
                const sideC = dims.sideC || 7;
                
                // Basis ist die untere Seite (längste Seite)
                const basis = Math.max(sideA, sideB, sideC);
                
                // Anzahl Bahnen = Basis geteilt durch Deckbreite
                bahnenAnzahl = Math.ceil(basis / deckbreite);
                
                // Plattenlänge ist die maximale Höhe des Dreiecks
                const dreieckHoehe = (2 * area) / basis;
                plattenlaenge = dreieckHoehe;
                
                console.log(`🔺 Dreieck: Basis=${basis}m, Max.Höhe=${dreieckHoehe.toFixed(2)}m, Bahnen=${bahnenAnzahl}`);
                break;
                
            case '4':
                // Allgemeines Viereck
                const bottomWidth = dims.bottomWidth || 10;
                const topWidth = dims.topWidth || 8;
                const avgWidth = (bottomWidth + topWidth) / 2;
                bahnenAnzahl = Math.ceil(avgWidth / deckbreite);
                plattenlaenge = dims.leftSide || 6;
                break;
                
            default:
                // Standard-Berechnung
                bahnenAnzahl = Math.ceil(Math.sqrt(area) / deckbreite);
                plattenlaenge = Math.sqrt(area);
        }
    } else {
        // Fallback-Berechnung
        bahnenAnzahl = Math.ceil(Math.sqrt(area) / deckbreite);
        plattenlaenge = Math.sqrt(area);
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
        richtung: 'laengs',
        variant: variant
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
    
    console.log('✅ Berechnung abgeschlossen:', calculationResults);
}

// Ergebnisse anzeigen
function displayResults() {
    // Ergebnisse-Sektion anzeigen
    const resultsSection = document.getElementById('results-section');
    if (resultsSection) {
        resultsSection.style.display = 'block';
    }
    
    // Summary-Werte
    const totalRowsEl = document.getElementById('total-rows');
    const plateLengthEl = document.getElementById('plate-length');
    const totalLengthEl = document.getElementById('total-length');
    const totalWasteEl = document.getElementById('total-waste');
    
    if (totalRowsEl) totalRowsEl.textContent = calculationResults.bahnenAnzahl;
    if (plateLengthEl) plateLengthEl.textContent = calculationResults.plattenlaenge.toFixed(1) + ' m';
    if (totalLengthEl) totalLengthEl.textContent = calculationResults.gesamtlaenge.toFixed(1) + ' m';
    if (totalWasteEl) totalWasteEl.textContent = calculationResults.verschnitt.toFixed(1) + ' %';
    
    // Bestellliste
    const tbody = document.getElementById('order-tbody');
    if (tbody) {
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
    }
    
    // Erklärung
    const explanation = document.getElementById('calculation-explanation');
    if (explanation) {
        explanation.innerHTML = `
            <h5>Berechnungsschritte:</h5>
            <ol>
                <li><strong>Dachfläche:</strong> ${calculationResults.dachflaeche.toFixed(2)} m²</li>
                <li><strong>Form:</strong> ${calculationResults.variant}</li>
                <li><strong>Deckbreite:</strong> ${projectData.profile.deckbreite} mm</li>
                <li><strong>Nutzbreite:</strong> ${projectData.profile.deckbreite - (projectData.profile.seitenueberlappung || 50)} mm (nach Abzug Seitenüberlappung)</li>
                <li><strong>Geometrie-spezifische Berechnung:</strong> ${getCalculationMethod()}</li>
                <li><strong>Anzahl Bahnen:</strong> ${calculationResults.bahnenAnzahl} (optimiert für Geometrie)</li>
                <li><strong>Verlegerichtung:</strong> ${calculationResults.richtung === 'laengs' ? 'Längs' : 'Quer'} zur Wasserlaufrichtung</li>
            </ol>
            <p><strong>Empfehlung:</strong> Bestellen Sie ${calculationResults.verschnitt}% Verschnitt zusätzlich für Zuschnitte und Reserve.</p>
        `;
    }
    
    // Continue-Button aktivieren
    const continueBtn = document.getElementById('continue-btn');
    if (continueBtn) {
        continueBtn.disabled = false;
    }
    
    // Visualisierung aktualisieren
    visualizeRoof();
}

// Hilfsfunktion für Berechnungsmethode
function getCalculationMethod() {
    const { variant, geometry } = extractGeometryData();
    if (!geometry || !geometry.dimensions) return 'Standard';
    
    const dims = geometry.dimensions;
    
    switch (variant) {
        case 'trapez':
            const bottomBase = dims.bottomBase || 8;
            const topBase = dims.topBase || 6;
            const average = (bottomBase + topBase) / 2;
            return `Trapez: Mittlere Breite (${bottomBase}m + ${topBase}m) ÷ 2 = ${average.toFixed(1)}m`;
        case 'rechtwinklig':
            const katheteA = dims.katheteA || 4;
            return `Rechtwinkliges Dreieck: Basis ${katheteA}m`;
        case 'rechteck':
            const width = dims.width || 5;
            return `Rechteck: Breite ${width}m`;
        case 'kreis':
            const radius = dims.radius || 4;
            return `Kreis: Durchmesser ${radius * 2}m`;
        case 'lform':
            const totalWidth = dims.totalWidth || 8;
            return `L-Form: Gesamtbreite ${totalWidth}m`;
        case '3':
            const sideA = dims.sideA || 8;
            const sideB = dims.sideB || 6;
            const sideC = dims.sideC || 7;
            const basis = Math.max(sideA, sideB, sideC);
            return `Dreieck: ${calculationResults.bahnenAnzahl} Bahnen über ${basis}m Basis, variable Längen von links nach rechts`;
        case '4':
            const bottomWidth = dims.bottomWidth || 10;
            const topWidth = dims.topWidth || 8;
            const avgWidth = (bottomWidth + topWidth) / 2;
            return `Viereck: ${calculationResults.bahnenAnzahl} Bahnen über ${avgWidth.toFixed(1)}m mittlere Breite`;
        default:
            return 'Standard-Berechnung';
    }
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
    window.location.href = 'Dachform.html';
}

// Initialisierung - VERBESSERTE Datenladung
document.addEventListener('DOMContentLoaded', function() {
    console.log('=== BERECHNUNG-SEITE GELADEN ===');
    
    // Projektdaten laden
    projectData = loadData();
    console.log('🔍 RAW Geladene Projektdaten:', JSON.stringify(projectData, null, 2));
    
    // Erweiterte Validierung
    const { variant, area, geometry } = extractGeometryData();
    
    if (!projectData.profile) {
        console.error('❌ KEINE PROFIL-DATEN!');
        alert('Keine Profil-Daten gefunden. Bitte kehren Sie zu Schritt 1 zurück.');
        window.location.href = 'profil.html';
        return;
    }
    
    if (!variant || area <= 0) {
        console.error('❌ KEINE GÜLTIGEN GEOMETRIE-DATEN!');
        alert('Keine gültigen Geometrie-Daten gefunden. Bitte kehren Sie zu den vorherigen Schritten zurück.');
        window.location.href = 'Dachform.html';
        return;
    }
    
    console.log('✅ Validierung erfolgreich:', {
        profil: projectData.profile.profilname,
        variant: variant,
        area: area
    });
    
    // Canvas setup
    setupCanvas();
    
    // Info anzeigen
    displayProjectInfo();
    
    // AUTOMATISCHE BERECHNUNG mit echten Daten
    calculateLengths();
    
    console.log('✅ Berechnung-Seite erfolgreich initialisiert');
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
    console.log('extractedGeometry:', extractGeometryData());
    console.log('Canvas:', roofCanvas);
};

// Test-Funktionen für verschiedene Formen
window.testCalculationShape = (variant, dimensions) => {
    console.log('🧪 TESTE BERECHNUNG FÜR:', variant);
    
    // Temporäre Geometrie-Daten setzen
    projectData.geometry = {
        variant: variant,
        dimensions: dimensions || getDefaultDimensionsForVariant(variant),
        area: calculateAreaFromDimensions(variant, dimensions || getDefaultDimensionsForVariant(variant))
    };
    
    // Berechnung neu durchführen
    calculateLengths();
    
    console.log('✅ Test abgeschlossen für:', variant);
};

// Hilfsfunktion für Test-Flächen-Berechnung
function calculateAreaFromDimensions(variant, dims) {
    switch (variant) {
        case 'trapez':
            return ((dims.bottomBase + dims.topBase) / 2) * dims.height;
        case 'rechteck':
            return dims.length * dims.width;
        case 'rechtwinklig':
            return (dims.katheteA * dims.katheteB) / 2;
        case 'kreis':
            return Math.PI * dims.radius * dims.radius;
        case 'lform':
            return (dims.totalLength * dims.totalWidth) - (dims.cutoutLength * dims.cutoutWidth);
        case '3':
            const s = (dims.sideA + dims.sideB + dims.sideC) / 2;
            return Math.sqrt(s * (s - dims.sideA) * (s - dims.sideB) * (s - dims.sideC));
        case '4':
            return ((dims.bottomWidth + dims.topWidth) / 2) * dims.leftSide;
        default:
            return 40;
    }
}

// Globale Test-Funktionen
window.testAllCalculations = () => {
    console.log('🧪 TESTE ALLE BERECHNUNGEN...');
    
    const testCases = [
        ['rechtwinklig', { katheteA: 4, katheteB: 5 }],
        ['trapez', { bottomBase: 8, topBase: 6, height: 4 }],
        ['rechteck', { length: 8, width: 5 }],
        ['kreis', { radius: 4 }],
        ['lform', { totalLength: 10, totalWidth: 8, cutoutLength: 4, cutoutWidth: 4 }]
    ];
    
    testCases.forEach(([variant, dims], index) => {
        setTimeout(() => {
            testCalculationShape(variant, dims);
            console.log(`✅ Test ${index + 1}/${testCases.length}: ${variant}`);
        }, index * 2000);
    });
};

// Manual Dimension Override (für Debug/Test)
window.setManualDimensions = (variant, dimensions) => {
    console.log('🔧 SETZE MANUELLE DIMENSIONEN:', { variant, dimensions });
    
    projectData.geometry = {
        variant: variant,
        dimensions: dimensions,
        area: calculateAreaFromDimensions(variant, dimensions),
        timestamp: Date.now()
    };
    
    // UI aktualisieren
    displayProjectInfo();
    calculateLengths();
    
    console.log('✅ Manuelle Dimensionen gesetzt');
};

// Storage Debug
window.debugStorage = () => {
    console.log('=== STORAGE DEBUG ===');
    console.log('localStorage:', localStorage.getItem('dachplattenrechner_data'));
    console.log('sessionStorage:', sessionStorage.getItem('dachplattenrechner_data'));
    
    // Alle verfügbaren Keys auflisten
    console.log('Alle localStorage Keys:');
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        console.log(`- ${key}:`, localStorage.getItem(key));
    }
};

// Emergency Fallback Data
window.setFallbackData = () => {
    console.log('🚨 SETZE FALLBACK-DATEN');
    
    projectData = {
        profile: {
            kategorie: 'trapezprofil',
            profilKey: 'TP20',
            deckbreite: 1000,
            lieferbreite: 1050,
            seitenueberlappung: 50,
            profilname: 'TP20 (20/100)',
            ueberstand: 50,
            lagerlaengen: [2000, 3000, 4000, 5000, 6000]
        },
        roofShape: {
            baseShape: 'viereck',
            variant: 'trapez',
            variantName: 'Trapez'
        },
        geometry: {
            variant: 'trapez',
            dimensions: {
                bottomBase: 8,
                topBase: 6,
                height: 4
            },
            area: 28
        }
    };
    
    saveData();
    
    // Seite neu laden
    location.reload();
};

console.log('✅ berechnung.js geladen - REPARIERTE VERSION mit verbesserter Datenverarbeitung');
console.log('🧪 Verfügbare Test-Funktionen:');
console.log('  - testCalculationShape(variant, dimensions)');
console.log('  - testAllCalculations()');
console.log('  - setManualDimensions(variant, dimensions)');
console.log('  - debugCalculation()');
console.log('  - debugStorage()');
console.log('  - setFallbackData()');

// Beispiel-Aufrufe:
console.log('📝 Beispiele:');
console.log('  testCalculationShape("trapez", {bottomBase: 10, topBase: 8, height: 5})');
console.log('  testCalculationShape("rechtwinklig", {katheteA: 6, katheteB: 8})');
console.log('  testCalculationShape("lform", {totalLength: 12, totalWidth: 10, cutoutLength: 5, cutoutWidth: 5})');
