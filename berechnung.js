// KORRIGIERTE Hauptberechnung - Function Declaration fix
function calculateLengths() {
    try {
        console.log('=== STARTE BERECHNUNG ===');
        
        const profile = projectData.profile;
        if (!profile || !profile.deckbreite || !profile.seitenueberlappung) {
            showDebugInfo({
                error: 'Kritische Profil-Daten fehlen!',
                profile: profile
            });
            alert('Kritische Profil-Daten fehlen!');
            return;
        }

        const analysis = analyzeRoofGeometry();
        const verlegerichtung = 'laengs';

        calculationResults = calculateForDirection(analysis, verlegerichtung, profile);

        displayResults(calculationResults);
        drawRoofVisualization(analysis.points, calculationResults);
        
        const continueBtn = document.getElementById('continue-btn');
        if (continueBtn) {
            continueBtn.disabled = false;
        }

    } catch (error) {
        console.error('❌ Fehler bei der Berechnung:', error);
        showDebugInfo({
            error: error.message,
            stack: error.stack
        });
        alert('Fehler bei der Berechnung: ' + error.message);
    }
}

// KORRIGIERTE Richtungsberechnung
function calculateForDirection(analysis, richtung, profile) {
    console.log('=== BERECHNE FÜR RICHTUNG ===');
    console.log('Shape: ' + analysis.shapeType + ', Richtung: ' + richtung);
    
    const deckbreite = profile.deckbreite;
    const seitenueberlappung = profile.seitenueberlappung;
    const ueberstand = profile.ueberstand || 50;
    
    let bahnenAnzahl, bahnenLaenge;
    let variableLengths = [];
    
    // Standard-Berechnung für alle Formen
    if (richtung === 'laengs') {
        bahnenAnzahl = Math.ceil(analysis.width * 1000 / deckbreite);
        bahnenLaenge = (analysis.height * 1000) + ueberstand;
    } else {
        bahnenAnzahl = Math.ceil(analysis.height * 1000 / deckbreite);
        bahnenLaenge = (analysis.width * 1000) + ueberstand;
    }

    // Verfügbare Längen ermitteln
    let verfuegbareLaengen = [];
    if (profile.laengentyp === 'lager') {
        verfuegbareLaengen = profile.lagerlaengen ? [...profile.lagerlaengen] : [2000, 3000, 4000, 5000, 6000];
    } else {
        for (let l = profile.minLaenge || 1000; l <= (profile.maxLaenge || 12000); l += (profile.schnittRaster || 100)) {
            verfuegbareLaengen.push(l);
        }
    }

    // Optimierung
    const optimization = optimizeLengths(bahnenLaenge, verfuegbareLaengen, bahnenAnzahl);
    
    const totalLength = optimization.totalLength;
    const totalWaste = optimization.totalWaste;
    const verschnittProzent = totalLength > 0 ? (totalWaste / totalLength) * 100 : 0;
    
    console.log('✅ Berechnung abgeschlossen: ' + bahnenAnzahl + ' Bahnen, ' + verschnittProzent.toFixed(1) + '% Verschnitt');
    
    return {
        richtung: richtung,
        bahnenAnzahl: bahnenAnzahl,
        bahnenLaenge: bahnenLaenge,
        variableLengths: variableLengths,
        bestellliste: optimization.orderList,
        schnittplan: optimization.cuttingPlan,
        totalLength: totalLength / 1000,
        totalWaste: totalWaste / 1000,
        verschnitt: verschnittProzent,
        dachflaeche: analysis.area,
        dachbreite: analysis.width,
        dachhoehe: analysis.height,
        deckbreite: profile.deckbreite,
        lieferbreite: profile.lieferbreite,
        seitenueberlappung: profile.seitenueberlappung,
        shapeType: analysis.shapeType
    };
}

// Standard Optimierung für konstante Längen
function optimizeLengths(benoetigteLaenge, verfuegbareLaengen, anzahlBahnen) {
    const sortedLengths = verfuegbareLaengen.sort((a, b) => b - a);
    
    let bestLength = sortedLengths.find(length => length >= benoetigteLaenge);
    if (!bestLength) {
        bestLength = sortedLengths[0] || benoetigteLaenge;
    }

    const waste = Math.max(0, bestLength - benoetigteLaenge);
    
    return {
        orderList: [{ 
            length: bestLength, 
            quantity: anzahlBahnen, 
            usage: waste === 0 ? 'Exakt passend' : 'Standard mit Verschnitt' 
        }],
        cuttingPlan: [{
            sourceLength: bestLength,
            cuts: [{ length: benoetigteLaenge, quantity: anzahlBahnen, usage: 'Nutzlänge' }],
            waste: waste
        }],
        totalLength: bestLength * anzahlBahnen,
        totalWaste: waste * anzahlBahnen
    };
}

// KORRIGIERTE Visualisierung - Form ZENTRIERT auf Platten
function drawRoofVisualization(roofPoints, plateLayout) {
    if (!ctx || !roofPoints) return;

    console.log('🎨 Zeichne Visualisierung:', { 
        punkteAnzahl: roofPoints.length, 
        plateLayout: !!plateLayout 
    });

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#f8f9fa';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const xs = roofPoints.map(p => p.x);
    const ys = roofPoints.map(p => p.y);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);
    const roofWidth = maxX - minX;
    const roofHeight = maxY - minY;

    const margin = 40;
    const availableWidth = canvas.width - 2 * margin;
    const availableHeight = canvas.height - 2 * margin;
    const scale = Math.min(availableWidth / roofWidth, availableHeight / roofHeight) * 0.8;
    
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const roofCenterX = (minX + maxX) / 2;
    const roofCenterY = (minY + maxY) / 2;

    function transformPoint(x, y) {
        return {
            x: centerX + (x - roofCenterX) * scale,
            y: centerY - (y - roofCenterY) * scale
        };
    }

    // KORREKTE Dachfläche zeichnen
    ctx.beginPath();
    roofPoints.forEach((point, index) => {
        const transformed = transformPoint(point.x, point.y);
        if (index === 0) {
            ctx.moveTo(transformed.x, transformed.y);
        } else {
            ctx.lineTo(transformed.x, transformed.y);
        }
    });
    ctx.closePath();
    ctx.fillStyle = 'rgba(0, 123, 255, 0.2)';
    ctx.fill();
    ctx.strokeStyle = '#007bff';
    ctx.lineWidth = 3;
    ctx.stroke();

    // KORRIGIERTES Platten-Layout - ZENTRIERT auf die Form
    if (plateLayout) {
        drawPlateLayoutCentered(plateLayout, transformPoint, scale, roofPoints);
    }

    // Bemaßung
    drawDimensions(roofPoints, transformPoint);
    
    console.log('✅ Visualisierung fertiggestellt');
}

// NEUE FUNKTION: Platten-Layout ZENTRIERT auf der Form
function drawPlateLayoutCentered(layout, transformPoint, scale, roofPoints) {
    const profile = projectData.profile;
    const deckbreite = profile.deckbreite / 1000;
    const lieferbreite = profile.lieferbreite / 1000;

    console.log('🎨 Zeichne zentrierte Platten: ' + layout.bahnenAnzahl + ' Bahnen');

    // Berechne Dach-Zentrum und Grenzen
    const xs = roofPoints.map(p => p.x);
    const ys = roofPoints.map(p => p.y);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);
    const roofCenterX = (minX + maxX) / 2;
    const roofCenterY = (minY + maxY) / 2;
    const roofWidth = maxX - minX;

    // ZENTRIERTE Plattenplatzierung
    const totalPlateWidth = layout.bahnenAnzahl * deckbreite;
    const plateStartX = roofCenterX - (totalPlateWidth / 2);

    function isPointInShape(x, y, points) {
        if (!points || points.length < 3) return false;
        
        let inside = false;
        for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
            if (((points[i].y > y) !== (points[j].y > y)) &&
                (x < (points[j].x - points[i].x) * (y - points[i].y) / (points[j].y - points[i].y) + points[i].x)) {
                inside = !inside;
            }
        }
        return inside;
    }

    for (let i = 0; i < layout.bahnenAnzahl; i++) {
        let currentPlateLength = layout.bahnenLaenge / 1000;

        // Platte zentriert auf dem Dach positionieren
        const plateX = plateStartX + (i * deckbreite);
        const plateY = roofCenterY - (currentPlateLength / 2); // ZENTRIERT!
        const plateWidth = lieferbreite;
        const plateHeight = currentPlateLength;

        const segments = 20;
        for (let sx = 0; sx < segments; sx++) {
            for (let sy = 0; sy < segments; sy++) {
                const subX = plateX + (plateWidth * sx / segments);
                const subY = plateY + (plateHeight * sy / segments);
                const subWidth = plateWidth / segments;
                const subHeight = plateHeight / segments;
                
                const centerX = subX + subWidth / 2;
                const centerY = subY + subHeight / 2;
                
                const isInRoof = isPointInShape(centerX, centerY, roofPoints);
                
                const topLeft = transformPoint(subX, subY);
                const bottomRight = transformPoint(subX + subWidth, subY + subHeight);
                const rectWidth = bottomRight.x - topLeft.x;
                const rectHeight = bottomRight.y - topLeft.y;
                
                if (isInRoof) {
                    const deckbereichStart = plateStartX + (i * deckbreite);
                    const deckbereichEnd = deckbereichStart + deckbreite;
                    
                    if (subX >= deckbereichStart && subX < deckbereichEnd) {
                        ctx.fillStyle = 'rgba(40, 167, 69, 0.4)'; // Deckbereich
                    } else {
                        ctx.fillStyle = 'rgba(40, 167, 69, 0.8)'; // Überlappung
                    }
                } else {
                    ctx.fillStyle = 'rgba(220, 53, 69, 0.6)'; // Verschnitt
                }
                
                ctx.fillRect(topLeft.x, topLeft.y, rectWidth, rectHeight);
            }
        }

        // Bahnnummer im Deckbereich
        const deckX = plateStartX + (i * deckbreite);
        const deckW = deckbreite;
        const deckH = currentPlateLength;
        
        const topLeft = transformPoint(deckX, plateY);
        const bottomRight = transformPoint(deckX + deckW, plateY + deckH);
        const rectWidth = bottomRight.x - topLeft.x;
        const rectHeight = bottomRight.y - topLeft.y;

        ctx.strokeStyle = '#28a745';
        ctx.lineWidth = 2;
        ctx.strokeRect(topLeft.x, topLeft.y, rectWidth, rectHeight);

        ctx.fillStyle = '#000';
        ctx.font = '14px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(
            (i + 1).toString(),
            topLeft.x + rectWidth / 2,
            topLeft.y + rectHeight / 2
        );
    }
}

function drawDimensions(roofPoints, transformPoint) {
    ctx.strokeStyle = '#666';
    ctx.fillStyle = '#000';
    ctx.lineWidth = 1;
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';

    for (let i = 0; i < Math.min(2, roofPoints.length); i++) {
        const p1 = roofPoints[i];
        const p2 = roofPoints[(i + 1) % roofPoints.length];
        
        const start = transformPoint(p1.x, p1.y);
        const end = transformPoint(p2.x, p2.y);
        
        const midX = (start.x + end.x) / 2;
        const midY = (start.y + end.y) / 2;
        
        const length = Math.sqrt((p2.x - p1.x) ** 2 + (p2.y - p1.y) ** 2);
        ctx.fillText(length.toFixed(1) + 'm', midX, midY - 5);
    }
}

function displayResults(results) {
    console.log('=== ZEIGE ERGEBNISSE ===');
    
    const updateElement = (id, value) => {
        const element = document.getElementById(id);
        if (element) element.textContent = value;
    };
    
    updateElement('total-rows', results.bahnenAnzahl);
    updateElement('plate-length', (results.bahnenLaenge / 1000).toFixed(1) + ' m');
    updateElement('total-length', results.totalLength.toFixed(1) + ' m');
    updateElement('total-waste', results.verschnitt.toFixed(1) + ' %');

    const tbody = document.getElementById('order-tbody');
    if (tbody) {
        tbody.innerHTML = '';
        results.bestellliste.forEach(item => {
            const row = tbody.insertRow();
            row.innerHTML = `
                <td>${item.length}</td>
                <td>${item.quantity}</td>
                <td>${(item.length * item.quantity / 1000).toFixed(1)}</td>
                <td>${item.usage}</td>
            `;
        });
    }

    displayCalculationExplanation(results);
    
    const resultsSection = document.getElementById('results-section');
    if (resultsSection) {
        resultsSection.style.display = 'block';
    }
    
    console.log('✅ Ergebnisse angezeigt');
}

function displayCalculationExplanation(results) {
    const container = document.getElementById('calculation-explanation');
    if (!container) return;

    const verlegerichtungText = results.richtung === 'laengs' ? 'längs (parallel zur Wasserlaufrichtung)' : 'quer (senkrecht zur Wasserlaufrichtung)';
    const ueberstendWert = ((results.bahnenLaenge - (results.dachhoehe * 1000))).toFixed(0);
    
    let shapeSpecificText = '';
    if (results.shapeType === 'rhombus') {
        shapeSpecificText = `
            <p><strong>Rhombus-Form:</strong> Die Dachplatten sind jetzt korrekt auf der rhombusförmigen Fläche zentriert.</p>
        `;
    }
    
    container.innerHTML = `
        <h5>Berechnungsschritte:</h5>
        <div style="margin: 10px 0;">
            <p><strong>1. Dachform:</strong> ${results.shapeType}</p>
            <p><strong>2. Verlegerichtung:</strong> ${verlegerichtungText}</p>
            <p><strong>3. Bahnenanzahl:</strong> ${(results.dachbreite * 1000).toFixed(0)}mm ÷ ${results.deckbreite}mm = ${results.bahnenAnzahl} Bahnen</p>
            <p><strong>4. Plattenlänge:</strong> ${results.dachhoehe.toFixed(1)}m + ${ueberstendWert}mm Überstand</p>
            <p><strong>Konstante Plattenlänge:</strong> ${(results.bahnenLaenge / 1000).toFixed(2)} m</p>
            ${shapeSpecificText}
        </div>
    `;
}

function saveAndContinue() {
    if (!calculationResults) {
        alert('Bitte führen Sie zuerst eine Berechnung durch!');
        return;
    }

    try {
        projectData.calculations = calculationResults;
        const saved = saveData();
        
        if (saved) {
            window.location.href = 'anrissplan.html';
        } else {
            alert('Speichern fehlgeschlagen, fahre trotzdem fort.');
            window.location.href = 'anrissplan.html';
        }
    } catch (error) {
        console.error('Fehler beim Speichern:', error);
        alert('Fehler beim Speichern: ' + error.message);
    }
}

function goBack() {
    window.location.href = 'Editor.html';
}

// Initialisierung
function init() {
    try {
        console.log('🚀 Initialisiere Berechnung...');
        
        projectData = loadData();
        console.log('Projektdaten geladen:', projectData);
        
        initCanvas();
        
        const infoLoaded = loadProjectInfo();
        
        if (infoLoaded) {
            const analysis = analyzeRoofGeometry();
            if (analysis.points) {
                drawRoofVisualization(analysis.points, null);
            }
        }
        
        console.log('✅ Berechnung erfolgreich initialisiert');
        
    } catch (error) {
        console.error('❌ Initialisierungsfehler:', error);
        showDebugInfo({
            error: 'Initialisierungsfehler',
            message: error.message
        });
        alert('Fehler beim Laden: ' + error.message);
    }
}

// Canvas-Resize
window.addEventListener('resize', function() {
    if (canvas) {
        const container = canvas.parentElement;
        const newWidth = Math.min(600, container.clientWidth - 40);
        const newHeight = (newWidth / 600) * 400;
        
        canvas.width = newWidth;
        canvas.height = newHeight;
        
        if (calculationResults) {
            const analysis = analyzeRoofGeometry();
            if (analysis.points) {
                drawRoofVisualization(analysis.points, calculationResults);
            }
        }
    }
});

// Event Listeners
document.addEventListener('DOMContentLoaded', function() {
    init();
});

// Datenvalidierung beim Laden
window.addEventListener('load', function() {
    const profile = projectData.profile;
    const hasValidRoof = projectData.roofShape || projectData.geometry;
    
    console.log('🔍 Validiere Daten:', {
        profile: !!profile,
        validProfile: !!(profile && profile.deckbreite),
        hasValidRoof: !!hasValidRoof
    });
    
    if (!profile || !profile.deckbreite) {
        setTimeout(function() {
            if (confirm('Profil-Daten fehlen. Möchten Sie zu Schritt 1 zurückkehren?')) {
                window.location.href = 'profil.html';
            }
        }, 1000);
    } else if (!hasValidRoof) {
        setTimeout(function() {
            if (confirm('Dachform-Daten fehlen. Möchten Sie zum Editor zurückkehren?')) {
                window.location.href = 'Editor.html';
            }
        }, 1000);
    }
});

console.log('✅ Vollständig korrigierte berechnung.js geladen - Alle Dachformen sind konsistent und ZENTRIERT!');// VOLLSTÄNDIG KORRIGIERTE UND BEREINIGTE berechnung.js
// Basiert auf deiner Original-Datei mit gezielten Korrekturen

// Globale Variablen
let projectData = {};
let calculationResults = null;
let canvas = null;
let ctx = null;

// Storage-Funktionen
function saveData() {
    try {
        localStorage.setItem('dachplattenrechner_data', JSON.stringify(projectData));
        return true;
    } catch (e) {
        try {
            sessionStorage.setItem('dachplattenrechner_data', JSON.stringify(projectData));
            return true;
        } catch (e2) {
            console.log('Speichern nicht möglich');
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
        console.log('Laden nicht möglich');
        return {};
    }
}

// Debug-Informationen anzeigen
function showDebugInfo(info) {
    const debugElement = document.getElementById('debug-info');
    const debugContent = document.getElementById('debug-content');
    
    if (debugElement && debugContent) {
        debugContent.innerHTML = `<pre>${JSON.stringify(info, null, 2)}</pre>`;
        debugElement.style.display = 'block';
    }
}

// Canvas initialisieren
function initCanvas() {
    canvas = document.getElementById('roof-canvas');
    if (canvas) {
        ctx = canvas.getContext('2d');
        canvas.width = 600;
        canvas.height = 400;
    }
}

// KORRIGIERTE Dachfläche berechnen
function calculateRoofArea(points) {
    if (!points || points.length < 3) return 0;
    
    let area = 0;
    for (let i = 0; i < points.length; i++) {
        const j = (i + 1) % points.length;
        area += points[i].x * points[j].y;
        area -= points[j].x * points[i].y;
    }
    return Math.abs(area) / 2;
}

// KORRIGIERTE Shape-Type Bestimmung aus Daten
function determineShapeTypeFromData() {
    const roofShape = projectData.roofShape;
    const geometry = projectData.geometry;
    
    console.log('🔍 Bestimme Shape-Type aus:', { roofShape, geometry });
    
    // Prüfe verschiedene Datenquellen
    if (roofShape?.variant) {
        const variant = roofShape.variant;
        console.log(`✅ Shape-Type aus roofShape.variant: ${variant}`);
        return variant;
    }
    
    if (roofShape?.baseShape) {
        const baseShape = roofShape.baseShape;
        console.log(`✅ Shape-Type aus roofShape.baseShape: ${baseShape}`);
        return baseShape;
    }
    
    if (geometry?.shapeType) {
        const shapeType = geometry.shapeType;
        console.log(`✅ Shape-Type aus geometry.shapeType: ${shapeType}`);
        return shapeType;
    }
    
    console.log('⚠️ Kein Shape-Type gefunden, verwende rechteck');
    return 'rechteck';
}

// HAUPTFUNKTION: Generiere Roof Points - IDENTISCH mit Editor
function generateCorrectRoofPoints() {
    const roofShape = projectData.roofShape;
    const geometry = projectData.geometry;
    
    console.log('🎨 Generiere Punkte für Berechnung');
    console.log('RoofShape:', roofShape);
    console.log('Geometry:', geometry);
    
    // PRIORITÄT 1: Verwende bereits generierte Punkte aus dem Editor
    if (geometry && geometry.points && geometry.points.length > 0) {
        console.log('✅ Verwende geometry.points vom Editor:', geometry.points);
        return geometry.points;
    }
    
    if (roofShape && roofShape.points && roofShape.points.length > 0) {
        console.log('✅ Verwende roofShape.points vom Editor:', roofShape.points);
        return roofShape.points;
    }
    
    // PRIORITÄT 2: Re-generiere basierend auf Editor-Daten
    console.log('⚠️ Keine fertigen Punkte gefunden, re-generiere...');
    
    const shapeType = determineShapeTypeFromData();
    const data = { ...roofShape, ...geometry }; // Kombiniere alle verfügbaren Daten
    
    return generatePointsFromEditorData(shapeType, data);
}

// PUNKT-GENERIERUNG basierend auf Editor-Daten
function generatePointsFromEditorData(shapeType, data) {
    console.log(`🔧 Re-generiere Punkte für: ${shapeType}`, data);
    
    try {
        switch (shapeType) {
            case 'kreis':
                return generateCirclePoints(data);
            case 'oval':
                return generateOvalPoints(data);
            case 'halbkreis':
                return generateHalfCirclePoints(data);
            case 'viertelkreis':
                return generateQuarterCirclePoints(data);
            case 'langloch':
                return generateLanglochPoints(data);
            case 'dreieck':
            case 'gleichseitig':
            case 'rechtwinklig':
            case 'ungleichschenklig':
                return generateTrianglePoints(data, shapeType);
            case 'rechteck':
                return generateRectanglePoints(data);
            case 'quadrat':
                return generateSquarePoints(data);
            case 'trapez':
                return generateTrapezPoints(data);
            case 'parallelogramm':
                return generateParallelogramPoints(data);
            case 'rhombus':
                return generateRhombusPoints(data);
            case 'fuenfeck':
                return generatePentagonPoints(data);
            case 'sechseck':
                return generateHexagonPoints(data);
            case 'achteck':
                return generateOctagonPoints(data);
            case 'lform':
                return generateLShapePoints(data);
            case 'tform':
                return generateTShapePoints(data);
            case 'uform':
                return generateUShapePoints(data);
            default:
                console.log(`⚠️ Unbekannter Shape-Type: ${shapeType}, verwende Rechteck`);
                return generateRectanglePoints(data);
        }
    } catch (error) {
        console.error(`❌ Fehler bei Punkt-Generierung für ${shapeType}:`, error);
        return generateRectanglePoints({ length: 8, width: 5 });
    }
}

// ===== PUNKT-GENERIERUNG FUNKTIONEN (IDENTISCH MIT EDITOR) =====

function generateCirclePoints(data) {
    const radius = data.radius || 3;
    const points = [];
    const segments = 24;
    
    for (let i = 0; i < segments; i++) {
        const angle = (i * 2 * Math.PI) / segments;
        points.push({
            x: radius * Math.cos(angle),
            y: radius * Math.sin(angle)
        });
    }
    
    console.log(`✅ Kreis generiert: radius=${radius}`);
    return points;
}

function generateOvalPoints(data) {
    const radiusX = data.radiusX || 4;
    const radiusY = data.radiusY || 2.5;
    const points = [];
    const segments = 24;
    
    for (let i = 0; i < segments; i++) {
        const angle = (i * 2 * Math.PI) / segments;
        points.push({
            x: radiusX * Math.cos(angle),
            y: radiusY * Math.sin(angle)
        });
    }
    
    console.log(`✅ Oval generiert: radiusX=${radiusX}, radiusY=${radiusY}`);
    return points;
}

function generateHalfCirclePoints(data) {
    const radius = data.radius || 4;
    const points = [];
    const segments = 12;
    
    for (let i = 0; i <= segments; i++) {
        const angle = (i * Math.PI) / segments;
        points.push({
            x: radius * Math.cos(angle),
            y: radius * Math.sin(angle)
        });
    }
    
    console.log(`✅ Halbkreis generiert: radius=${radius}`);
    return points;
}

function generateQuarterCirclePoints(data) {
    const radius = data.radius || 4;
    const points = [];
    
    points.push({ x: 0, y: 0 });
    
    const segments = 6;
    for (let i = 0; i <= segments; i++) {
        const angle = (i * Math.PI / 2) / segments;
        points.push({
            x: radius * Math.cos(angle),
            y: radius * Math.sin(angle)
        });
    }
    
    console.log(`✅ Viertelkreis generiert: radius=${radius}`);
    return points;
}

function generateLanglochPoints(data) {
    const length = data.length || 6;
    const width = data.width || 3;
    const radius = width / 2;
    const straightLength = Math.max(0, length - width);
    
    const points = [];
    const segments = 8;
    
    for (let i = 0; i <= segments; i++) {
        const angle = (-Math.PI/2) + (i * Math.PI) / segments;
        points.push({
            x: straightLength/2 + radius * Math.cos(angle),
            y: radius * Math.sin(angle)
        });
    }
    
    for (let i = 0; i <= segments; i++) {
        const angle = (Math.PI/2) + (i * Math.PI) / segments;
        points.push({
            x: -straightLength/2 + radius * Math.cos(angle),
            y: radius * Math.sin(angle)
        });
    }
    
    console.log(`✅ Langloch generiert: length=${length}, width=${width}`);
    return points;
}

function generateTrianglePoints(data, variant) {
    console.log(`🔺 Generiere Dreieck: ${variant}`);
    
    if (variant === 'gleichseitig' || (!variant && data.side)) {
        const side = data.side || 6;
        const height = side * Math.sqrt(3) / 2;
        return [
            { x: 0, y: height * 2/3 },
            { x: -side/2, y: -height/3 },
            { x: side/2, y: -height/3 }
        ];
    } else if (variant === 'rechtwinklig') {
        const katheteA = data.katheteA || 4;
        const katheteB = data.katheteB || 5;
        return [
            { x: -katheteA/2, y: -katheteB/3 },
            { x: katheteA/2, y: -katheteB/3 },
            { x: -katheteA/2, y: katheteB*2/3 }
        ];
    } else {
        const sideA = data.sideA || 4;
        const sideB = data.sideB || 5;
        const sideC = data.sideC || 6;
        
        const s = (sideA + sideB + sideC) / 2;
        const area = Math.sqrt(s * (s - sideA) * (s - sideB) * (s - sideC));
        const height = (2 * area) / sideA;
        
        return [
            { x: 0, y: height * 2/3 },
            { x: -sideA/2, y: -height/3 },
            { x: sideA/2, y: -height/3 }
        ];
    }
}

function generateRectanglePoints(data) {
    const length = data.length || 8;
    const width = data.width || 5;
    
    const points = [
        { x: -length/2, y: -width/2 },
        { x: length/2, y: -width/2 },
        { x: length/2, y: width/2 },
        { x: -length/2, y: width/2 }
    ];
    
    console.log(`✅ Rechteck generiert: ${length}×${width}m`);
    return points;
}

function generateSquarePoints(data) {
    const side = data.side || 5;
    
    const points = [
        { x: -side/2, y: -side/2 },
        { x: side/2, y: -side/2 },
        { x: side/2, y: side/2 },
        { x: -side/2, y: side/2 }
    ];
    
    console.log(`✅ Quadrat generiert: ${side}×${side}m`);
    return points;
}

function generateTrapezPoints(data) {
    const sideA = data.sideA || 8;
    const sideB = data.sideB || 6;
    const height = data.height || 4;
    const offset = data.offset || 1;
    
    const points = [
        { x: -sideA/2, y: -height/2 },
        { x: sideA/2, y: -height/2 },
        { x: sideB/2 + offset, y: height/2 },
        { x: -sideB/2 + offset, y: height/2 }
    ];
    
    console.log(`✅ Trapez generiert: unten=${sideA}m, oben=${sideB}m, höhe=${height}m, versatz=${offset}m`);
    return points;
}

function generateParallelogramPoints(data) {
    const length = data.length || 8;
    const width = data.width || 5;
    const angle = (data.angle || 30) * Math.PI / 180;
    const skew = width * Math.cos(angle);
    
    const points = [
        { x: -length/2, y: -width/2 },
        { x: length/2, y: -width/2 },
        { x: length/2 + skew, y: width/2 },
        { x: -length/2 + skew, y: width/2 }
    ];
    
    console.log(`✅ Parallelogramm generiert: ${length}×${width}m, winkel=${data.angle || 30}°`);
    return points;
}

// KRITISCHE KORREKTUR: Rhombus-Punkte EXAKT wie im Editor
function generateRhombusPoints(data) {
    const side = data.side || 5;
    const angle = (data.angle || 60) * Math.PI / 180;
    
    // EXAKT wie im Editor: gleiche Berechnung
    const halfDiag1 = side * Math.sin(angle / 2);
    const halfDiag2 = side * Math.cos(angle / 2);
    
    // EXAKT dieselbe Punkt-Reihenfolge wie im Editor
    const points = [
        { x: 0, y: -halfDiag1 },        // Oben
        { x: halfDiag2, y: 0 },         // Rechts
        { x: 0, y: halfDiag1 },         // Unten
        { x: -halfDiag2, y: 0 }         // Links
    ];
    
    console.log('✅ Rhombus generiert: seite=' + side + 'm, winkel=' + (data.angle || 60) + '°');
    console.log('    Halbdiagonalen: h=' + (halfDiag2*2).toFixed(2) + 'm, v=' + (halfDiag1*2).toFixed(2) + 'm');
    console.log('    Punkte: ' + points.map(p => '(' + p.x.toFixed(2) + ', ' + p.y.toFixed(2) + ')').join(', '));
    return points;
}

function generatePentagonPoints(data) {
    const radius = data.radius || 4;
    const points = [];
    
    for (let i = 0; i < 5; i++) {
        const angle = (i * 2 * Math.PI / 5) - Math.PI / 2;
        points.push({
            x: radius * Math.cos(angle),
            y: radius * Math.sin(angle)
        });
    }
    
    console.log(`✅ Fünfeck generiert: radius=${radius}m`);
    return points;
}

function generateHexagonPoints(data) {
    const radius = data.radius || 4;
    const points = [];
    
    for (let i = 0; i < 6; i++) {
        const angle = (i * 2 * Math.PI / 6) - Math.PI / 2;
        points.push({
            x: radius * Math.cos(angle),
            y: radius * Math.sin(angle)
        });
    }
    
    console.log(`✅ Sechseck generiert: radius=${radius}m`);
    return points;
}

function generateOctagonPoints(data) {
    const radius = data.radius || 4;
    const points = [];
    
    for (let i = 0; i < 8; i++) {
        const angle = (i * 2 * Math.PI / 8) - Math.PI / 2;
        points.push({
            x: radius * Math.cos(angle),
            y: radius * Math.sin(angle)
        });
    }
    
    console.log(`✅ Achteck generiert: radius=${radius}m`);
    return points;
}

function generateLShapePoints(data) {
    const lengthTotal = data.lengthTotal || 10;
    const widthTotal = data.widthTotal || 8;
    const cutLength = data.cutLength || 4;
    const cutWidth = data.cutWidth || 4;
    
    const points = [
        { x: -lengthTotal/2, y: -widthTotal/2 },
        { x: lengthTotal/2, y: -widthTotal/2 },
        { x: lengthTotal/2, y: -widthTotal/2 + cutWidth },
        { x: -lengthTotal/2 + cutLength, y: -widthTotal/2 + cutWidth },
        { x: -lengthTotal/2 + cutLength, y: widthTotal/2 },
        { x: -lengthTotal/2, y: widthTotal/2 }
    ];
    
    console.log(`✅ L-Form generiert: gesamt=${lengthTotal}×${widthTotal}m`);
    return points;
}

function generateTShapePoints(data) {
    const topWidth = data.topWidth || 8;
    const stemWidth = data.stemWidth || 4;
    const topHeight = data.topHeight || 3;
    const stemHeight = data.stemHeight || 5;
    
    const totalHeight = topHeight + stemHeight;
    
    const points = [
        { x: -topWidth/2, y: totalHeight/2 },
        { x: topWidth/2, y: totalHeight/2 },
        { x: topWidth/2, y: totalHeight/2 - topHeight },
        { x: stemWidth/2, y: totalHeight/2 - topHeight },
        { x: stemWidth/2, y: -totalHeight/2 },
        { x: -stemWidth/2, y: -totalHeight/2 },
        { x: -stemWidth/2, y: totalHeight/2 - topHeight },
        { x: -topWidth/2, y: totalHeight/2 - topHeight }
    ];
    
    console.log(`✅ T-Form generiert`);
    return points;
}

function generateUShapePoints(data) {
    const outerWidth = data.outerWidth || 10;
    const innerWidth = data.innerWidth || 4;
    const height = data.height || 6;
    const thickness = data.thickness || 3;
    
    const points = [
        { x: -outerWidth/2, y: -height/2 },
        { x: outerWidth/2, y: -height/2 },
        { x: outerWidth/2, y: height/2 },
        { x: innerWidth/2, y: height/2 },
        { x: innerWidth/2, y: -height/2 + thickness },
        { x: -innerWidth/2, y: -height/2 + thickness },
        { x: -innerWidth/2, y: height/2 },
        { x: -outerWidth/2, y: height/2 }
    ];
    
    console.log(`✅ U-Form generiert`);
    return points;
}

// KORRIGIERTE Geometrie-Analyse
function analyzeRoofGeometry() {
    console.log('=== ANALYSIERE DACH-GEOMETRIE ===');
    
    const points = generateCorrectRoofPoints();
    
    if (!points || points.length < 3) {
        console.error('❌ Keine gültigen Punkte generiert');
        return {
            minX: -4, maxX: 4, minY: -2.5, maxY: 2.5,
            width: 8, height: 5, area: 40,
            points: [
                { x: -4, y: -2.5 }, { x: 4, y: -2.5 }, 
                { x: 4, y: 2.5 }, { x: -4, y: 2.5 }
            ],
            shapeType: 'rechteck'
        };
    }
    
    const xs = points.map(p => p.x);
    const ys = points.map(p => p.y);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);
    
    const width = maxX - minX;
    const height = maxY - minY;
    const area = calculateRoofArea(points);
    const shapeType = determineShapeTypeFromData();
    
    console.log('✅ Geometrie analysiert: ' + shapeType + ', ' + width.toFixed(1) + '×' + height.toFixed(1) + 'm, ' + area.toFixed(2) + 'm²');
    
    return {
        minX, maxX, minY, maxY,
        width, height, area,
        points: points,
        shapeType: shapeType
    };
}

// Projekt-Info laden und anzeigen
function loadProjectInfo() {
    const profile = projectData.profile;
    const analysis = analyzeRoofGeometry();

    console.log('=== LADE PROJEKT-INFO ===');

    if (!profile) {
        showDebugInfo({
            error: 'Profil-Daten fehlen!',
            projectData: projectData
        });
        alert('Profil-Daten fehlen! Bitte kehren Sie zu Schritt 1 zurück.');
        return false;
    }

    // Sichere Element-Updates
    const updateElement = (id, value) => {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = value;
        } else {
            console.warn(`Element ${id} nicht gefunden`);
        }
    };

    updateElement('info-profile-name', profile.profilname || 'Standard');
    updateElement('info-deckbreite', (profile.deckbreite || 1000) + ' mm (nutzbar)');
    updateElement('info-lieferbreite', (profile.lieferbreite || 1050) + ' mm (inkl. Überlappung)');
    updateElement('info-seitenueberlappung', (profile.seitenueberlappung || 50) + ' mm');
    updateElement('info-ueberstand', (profile.ueberstand || 50) + ' mm');
    
    // Dachform-Informationen mit Fallbacks
    const shapeNames = {
        'kreis': 'Kreis', 'oval': 'Oval', 'halbkreis': 'Halbkreis', 'viertelkreis': 'Viertelkreis', 'langloch': 'Langloch',
        'dreieck': 'Dreieck', 'gleichseitig': 'Gleichseitiges Dreieck', 'rechtwinklig': 'Rechtwinkliges Dreieck', 'ungleichschenklig': 'Ungleichschenkliges Dreieck',
        'rechteck': 'Rechteck', 'quadrat': 'Quadrat', 'parallelogramm': 'Parallelogramm', 'trapez': 'Trapez', 'rhombus': 'Rhombus',
        'fuenfeck': 'Fünfeck', 'sechseck': 'Sechseck', 'achteck': 'Achteck', 'lform': 'L-Form', 'tform': 'T-Form', 'uform': 'U-Form'
    };
    
    const shapeName = shapeNames[analysis.shapeType] || analysis.shapeType || 'Unbekannt';
    updateElement('info-roof-type', shapeName);
    updateElement('info-dimensions', analysis.width.toFixed(1) + ' × ' + analysis.height.toFixed(1) + ' m');
    updateElement('info-area', analysis.area.toFixed(2) + ' m²');

    const dachNeigung = projectData.roofShape?.dachNeigung || 15;
    updateElement('info-neigung', dachNeigung + '°');

    updateElement('direction-text', 'Längs (parallel zur Wasserlaufrichtung)');

    console.log('✅ Projekt-Info erfolgreich geladen');
    console.log('Shape: ' + analysis.shapeType + ', Name: ' + shapeName + ', Area: ' + analysis.area.toFixed(2) + 'm²');
    return true;
}
