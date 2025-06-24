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
        debugContent.innerHTML = `
            <pre>${JSON.stringify(info, null, 2)}</pre>
        `;
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

// Dachfläche berechnen
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

// KORRIGIERTE analyzeRoofGeometry Funktion für Trapez
function analyzeRoofGeometry(points) {
    const xs = points.map(p => p.x);
    const ys = points.map(p => p.y);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);
    
    const width = maxX - minX;
    const height = maxY - minY;
    const area = calculateRoofArea(points);
    
    // NEUE: Spezielle Trapez-Analyse
    const shapeType = determineShapeType(points);
    
    console.log('analyzeRoofGeometry:', {
        width, height, area, 
        shapeType, 
        pointCount: points.length,
        points: points
    });
    
    return {
        minX, maxX, minY, maxY,
        width, height, area,
        points: points,
        shapeType: shapeType
    };
}

// NEUE Funktion: Shape-Type aus Punkten bestimmen
function determineShapeType(points) {
    if (!points || points.length < 3) return 'rechteck';
    
    if (points.length === 3) return 'dreieck';
    if (points.length === 4) {
        // Prüfe ob es ein Trapez ist (zwei parallele Seiten)
        if (isTrapezoid(points)) return 'trapez';
        return 'rechteck'; // Inkludiert Rechteck, Quadrat, Parallelogramm
    }
    if (points.length > 4) return 'vieleck';
    
    return 'rechteck';
}

// NEUE Funktion: Prüft ob 4 Punkte ein Trapez bilden
function isTrapezoid(points) {
    if (points.length !== 4) return false;
    
    // Prüfe alle Seitenpaare auf Parallelität
    const sides = [];
    for (let i = 0; i < 4; i++) {
        const p1 = points[i];
        const p2 = points[(i + 1) % 4];
        
        // Richtungsvektor der Seite
        const dx = p2.x - p1.x;
        const dy = p2.y - p1.y;
        const length = Math.sqrt(dx * dx + dy * dy);
        
        sides.push({
            dx: dx / length,  // Normalisierter Richtungsvektor
            dy: dy / length,
            length: length
        });
    }
    
    // Prüfe ob gegenüberliegende Seiten parallel sind
    const tolerance = 0.1; // Toleranz für Parallelität
    
    // Seite 0 vs Seite 2 (gegenüber)
    const parallel02 = Math.abs(sides[0].dx - sides[2].dx) < tolerance && 
                       Math.abs(sides[0].dy - sides[2].dy) < tolerance;
    
    // Seite 1 vs Seite 3 (gegenüber) 
    const parallel13 = Math.abs(sides[1].dx - sides[3].dx) < tolerance &&
                       Math.abs(sides[1].dy - sides[3].dy) < tolerance;
    
    console.log('Trapez-Check:', {
        sides: sides,
        parallel02: parallel02,
        parallel13: parallel13
    });
    
    // Ein Trapez hat mindestens ein Paar parallele Seiten
    return parallel02 || parallel13;
}

// Projekt-Info laden
function loadProjectInfo() {
    const profile = projectData.profile;
    const roof = projectData.roofShape;
    const geometry = projectData.geometry;

    console.log('Lade Projekt-Info:', { 
        hasProfile: !!profile, 
        hasRoof: !!roof, 
        hasGeometry: !!geometry,
        profileData: profile 
    });

    if (!profile) {
        showDebugInfo({
            error: 'Profil-Daten fehlen!',
            projectData: projectData
        });
        alert('Profil-Daten fehlen! Bitte kehren Sie zu Schritt 1 zurück.');
        return false;
    }

    // Punkte ermitteln
    let roofPoints = null;
    if (roof && roof.points) {
        roofPoints = roof.points;
    } else if (geometry && geometry.points) {
        roofPoints = geometry.points;
    }

    if (!roofPoints || roofPoints.length < 3) {
        showDebugInfo({
            error: 'Dachform-Daten fehlen!',
            roof: roof,
            geometry: geometry
        });
        alert('Dachform-Daten fehlen! Bitte kehren Sie zu Schritt 2 zurück.');
        return false;
    }

    // Info-Felder füllen
    document.getElementById('info-profile-name').textContent = profile.profilname || 'Standard';
    document.getElementById('info-deckbreite').textContent = profile.deckbreite + ' mm (nutzbar)';
    document.getElementById('info-lieferbreite').textContent = profile.lieferbreite + ' mm (inkl. Überlappung)';
    document.getElementById('info-seitenueberlappung').textContent = (profile.seitenueberlappung || 50) + ' mm';
    document.getElementById('info-ueberstand').textContent = (profile.ueberstand || 50) + ' mm';
    
    const dachTyp = (roof && roof.dachTyp) || (roof && roof.variant) || (geometry && geometry.shapeType) || 'Rechteck';
    document.getElementById('info-roof-type').textContent = dachTyp;
    
    // Abmessungen berechnen
    const xs = roofPoints.map(p => p.x);
    const ys = roofPoints.map(p => p.y);
    const width = Math.max(...xs) - Math.min(...xs);
    const height = Math.max(...ys) - Math.min(...ys);
    document.getElementById('info-dimensions').textContent = `${width.toFixed(1)} × ${height.toFixed(1)} m`;
    
    const area = calculateRoofArea(roofPoints);
    document.getElementById('info-area').textContent = area.toFixed(2) + ' m²';

    // Dachneigung
    const dachNeigung = (roof && roof.dachNeigung) || 15;
    document.getElementById('info-neigung').textContent = dachNeigung + '°';

    // Verlegerichtung bestimmen
    let verlegerichtung = 'Längs (parallel zur Wasserlaufrichtung)';
    if (geometry && geometry.preferredDirection === 'quer') {
        verlegerichtung = 'Quer (senkrecht zur Wasserlaufrichtung)';
    }
    document.getElementById('direction-text').textContent = verlegerichtung;

    console.log('Projekt-Info erfolgreich geladen:', {
        profilname: profile.profilname,
        deckbreite: profile.deckbreite,
        seitenueberlappung: profile.seitenueberlappung,
        verlegerichtung: verlegerichtung
    });

    return true;
}

// VOLLSTÄNDIG KORRIGIERTE berechnung.js - Richtige Dachformen und präzise Berechnungen

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

// VOLLSTÄNDIG ÜBERARBEITETE Punkt-Generierung basierend auf Shape-Type
function generateCorrectRoofPoints() {
    const roofShape = projectData.roofShape;
    const shapeType = determineShapeTypeFromData();
    
    console.log(`🎨 Generiere Punkte für: ${shapeType}`);
    console.log('RoofShape Daten:', roofShape);
    
    try {
        switch (shapeType) {
            case 'kreis':
                return generateCirclePoints(roofShape);
            case 'oval':
                return generateOvalPoints(roofShape);
            case 'halbkreis':
                return generateHalfCirclePoints(roofShape);
            case 'viertelkreis':
                return generateQuarterCirclePoints(roofShape);
            case 'langloch':
                return generateLanglochPoints(roofShape);
            case 'dreieck':
            case 'gleichseitig':
            case 'rechtwinklig':
            case 'ungleichschenklig':
                return generateTrianglePoints(roofShape, shapeType);
            case 'rechteck':
                return generateRectanglePoints(roofShape);
            case 'quadrat':
                return generateSquarePoints(roofShape);
            case 'trapez':
                return generateTrapezPoints(roofShape);
            case 'parallelogramm':
                return generateParallelogramPoints(roofShape);
            case 'rhombus':
                return generateRhombusPoints(roofShape);
            case 'fuenfeck':
                return generatePentagonPoints(roofShape);
            case 'sechseck':
                return generateHexagonPoints(roofShape);
            case 'achteck':
                return generateOctagonPoints(roofShape);
            case 'lform':
                return generateLShapePoints(roofShape);
            case 'tform':
                return generateTShapePoints(roofShape);
            case 'uform':
                return generateUShapePoints(roofShape);
            default:
                console.log(`⚠️ Unbekannter Shape-Type: ${shapeType}, verwende Rechteck`);
                return generateRectanglePoints(roofShape);
        }
    } catch (error) {
        console.error(`❌ Fehler bei Punkt-Generierung für ${shapeType}:`, error);
        return generateRectanglePoints(roofShape);
    }
}

// PUNKT-GENERIERUNG FUNKTIONEN FÜR JEDE FORM

function generateCirclePoints(data) {
    const radius = data.radius || 3;
    const points = [];
    const segments = 24; // Mehr Segmente für glatten Kreis
    
    for (let i = 0; i < segments; i++) {
        const angle = (i * 2 * Math.PI) / segments;
        points.push({
            x: radius * Math.cos(angle),
            y: radius * Math.sin(angle)
        });
    }
    
    console.log(`✅ Kreis generiert: radius=${radius}, ${segments} Punkte`);
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
    
    // Halbkreis von 0° bis 180°
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
    
    // Viertelkreis von 0° bis 90°
    points.push({ x: 0, y: 0 }); // Ursprung
    
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
    const straightLength = length - width;
    
    const points = [];
    const segments = 8;
    
    // Rechtes Halbkreis-Ende
    for (let i = 0; i <= segments; i++) {
        const angle = (-Math.PI/2) + (i * Math.PI) / segments;
        points.push({
            x: straightLength/2 + radius * Math.cos(angle),
            y: radius * Math.sin(angle)
        });
    }
    
    // Linkes Halbkreis-Ende
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
            { x: 0, y: height * 2/3 },           // Spitze oben
            { x: -side/2, y: -height/3 },        // Links unten
            { x: side/2, y: -height/3 }          // Rechts unten
        ];
    } else if (variant === 'rechtwinklig') {
        const katheteA = data.katheteA || 4;
        const katheteB = data.katheteB || 5;
        return [
            { x: -katheteA/2, y: -katheteB/3 },  // Links unten (rechter Winkel)
            { x: katheteA/2, y: -katheteB/3 },   // Rechts unten
            { x: -katheteA/2, y: katheteB*2/3 }  // Links oben
        ];
    } else {
        // Ungleichschenkliges Dreieck
        const sideA = data.sideA || 4;
        const sideB = data.sideB || 5;
        const sideC = data.sideC || 6;
        
        // Verwende Heron's Formel für korrekte Geometrie
        const s = (sideA + sideB + sideC) / 2;
        const area = Math.sqrt(s * (s - sideA) * (s - sideB) * (s - sideC));
        const height = (2 * area) / sideA;
        
        return [
            { x: 0, y: height * 2/3 },          // Spitze oben
            { x: -sideA/2, y: -height/3 },      // Links unten
            { x: sideA/2, y: -height/3 }        // Rechts unten
        ];
    }
}

function generateRectanglePoints(data) {
    const length = data.length || 8;
    const width = data.width || 5;
    
    const points = [
        { x: -length/2, y: -width/2 },  // Links oben
        { x: length/2, y: -width/2 },   // Rechts oben
        { x: length/2, y: width/2 },    // Rechts unten
        { x: -length/2, y: width/2 }    // Links unten
    ];
    
    console.log(`✅ Rechteck generiert: ${length}×${width}m`);
    return points;
}

function generateSquarePoints(data) {
    const side = data.side || 5;
    
    const points = [
        { x: -side/2, y: -side/2 },  // Links oben
        { x: side/2, y: -side/2 },   // Rechts oben
        { x: side/2, y: side/2 },    // Rechts unten
        { x: -side/2, y: side/2 }    // Links unten
    ];
    
    console.log(`✅ Quadrat generiert: ${side}×${side}m`);
    return points;
}

function generateTrapezPoints(data) {
    const sideA = data.sideA || 8;     // Untere Seite (breiter)
    const sideB = data.sideB || 6;     // Obere Seite (schmaler)
    const height = data.height || 4;
    const offset = data.offset || 1;   // Versatz der oberen Seite
    
    const points = [
        { x: -sideA/2, y: -height/2 },                    // Links unten
        { x: sideA/2, y: -height/2 },                     // Rechts unten
        { x: sideB/2 + offset, y: height/2 },             // Rechts oben (mit Versatz)
        { x: -sideB/2 + offset, y: height/2 }             // Links oben (mit Versatz)
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
    
    console.log(`✅ Parallelogramm generiert: ${length}×${width}m, winkel=${data.angle}°`);
    return points;
}

function generateRhombusPoints(data) {
    const side = data.side || 5;
    const angle = (data.angle || 60) * Math.PI / 180;
    
    const halfDiag1 = side * Math.sin(angle / 2);
    const halfDiag2 = side * Math.cos(angle / 2);
    
    const points = [
        { x: 0, y: -halfDiag1 },        // Oben
        { x: halfDiag2, y: 0 },         // Rechts
        { x: 0, y: halfDiag1 },         // Unten
        { x: -halfDiag2, y: 0 }         // Links
    ];
    
    console.log(`✅ Rhombus generiert: seite=${side}m, winkel=${data.angle}°`);
    return points;
}

function generatePentagonPoints(data) {
    const radius = data.radius || 4;
    const points = [];
    
    for (let i = 0; i < 5; i++) {
        const angle = (i * 2 * Math.PI / 5) - Math.PI / 2; // Start oben
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
        const angle = (i * 2 * Math.PI / 6) - Math.PI / 2; // Start oben
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
        const angle = (i * 2 * Math.PI / 8) - Math.PI / 2; // Start oben
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
    
    // L-Form: Großes Rechteck minus kleines Rechteck rechts oben
    const points = [
        { x: -lengthTotal/2, y: -widthTotal/2 },                      // Links unten
        { x: lengthTotal/2, y: -widthTotal/2 },                       // Rechts unten
        { x: lengthTotal/2, y: -widthTotal/2 + cutWidth },            // Rechts, vor Ausschnitt
        { x: -lengthTotal/2 + cutLength, y: -widthTotal/2 + cutWidth }, // Ausschnitt innen
        { x: -lengthTotal/2 + cutLength, y: widthTotal/2 },           // Ausschnitt oben
        { x: -lengthTotal/2, y: widthTotal/2 }                        // Links oben
    ];
    
    console.log(`✅ L-Form generiert: gesamt=${lengthTotal}×${widthTotal}m, ausschnitt=${cutLength}×${cutWidth}m`);
    return points;
}

function generateTShapePoints(data) {
    const topWidth = data.topWidth || 8;
    const stemWidth = data.stemWidth || 4;
    const topHeight = data.topHeight || 3;
    const stemHeight = data.stemHeight || 5;
    
    const totalHeight = topHeight + stemHeight;
    
    const points = [
        { x: -topWidth/2, y: totalHeight/2 },                    // Links oben
        { x: topWidth/2, y: totalHeight/2 },                     // Rechts oben
        { x: topWidth/2, y: totalHeight/2 - topHeight },         // Rechts Top Ende
        { x: stemWidth/2, y: totalHeight/2 - topHeight },        // Rechts Stiel Anfang
        { x: stemWidth/2, y: -totalHeight/2 },                   // Rechts Stiel Ende
        { x: -stemWidth/2, y: -totalHeight/2 },                  // Links Stiel Ende
        { x: -stemWidth/2, y: totalHeight/2 - topHeight },       // Links Stiel Anfang
        { x: -topWidth/2, y: totalHeight/2 - topHeight }         // Links Top Ende
    ];
    
    console.log(`✅ T-Form generiert: top=${topWidth}×${topHeight}m, stiel=${stemWidth}×${stemHeight}m`);
    return points;
}

function generateUShapePoints(data) {
    const outerWidth = data.outerWidth || 10;
    const innerWidth = data.innerWidth || 4;
    const height = data.height || 6;
    const thickness = data.thickness || 3;
    
    const points = [
        { x: -outerWidth/2, y: -height/2 },                    // Links außen unten
        { x: outerWidth/2, y: -height/2 },                     // Rechts außen unten
        { x: outerWidth/2, y: height/2 },                      // Rechts außen oben
        { x: innerWidth/2, y: height/2 },                      // Rechts innen oben
        { x: innerWidth/2, y: -height/2 + thickness },         // Rechts innen unten
        { x: -innerWidth/2, y: -height/2 + thickness },        // Links innen unten
        { x: -innerWidth/2, y: height/2 },                     // Links innen oben
        { x: -outerWidth/2, y: height/2 }                      // Links außen oben
    ];
    
    console.log(`✅ U-Form generiert: außen=${outerWidth}×${height}m, innen=${innerWidth}m, dicke=${thickness}m`);
    return points;
}

// KORRIGIERTE Geometrie-Analyse mit richtigen Punkten
function analyzeRoofGeometry() {
    console.log('=== ANALYSIERE DACH-GEOMETRIE ===');
    
    // Generiere korrekte Punkte basierend auf Shape-Type
    const points = generateCorrectRoofPoints();
    
    if (!points || points.length < 3) {
        console.error('❌ Keine gültigen Punkte generiert');
        return {
            minX: 0, maxX: 8, minY: 0, maxY: 5,
            width: 8, height: 5, area: 40,
            points: generateRectanglePoints({ length: 8, width: 5 }),
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
    
    console.log(`✅ Geometrie analysiert: ${shapeType}, ${width.toFixed(1)}×${height.toFixed(1)}m, ${area.toFixed(2)}m²`);
    
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
    console.log('Profile:', profile);
    console.log('Analysis:', analysis);

    if (!profile) {
        showDebugInfo({
            error: 'Profil-Daten fehlen!',
            projectData: projectData
        });
        alert('Profil-Daten fehlen! Bitte kehren Sie zu Schritt 1 zurück.');
        return false;
    }

    // Info-Felder füllen
    document.getElementById('info-profile-name').textContent = profile.profilname || 'Standard';
    document.getElementById('info-deckbreite').textContent = profile.deckbreite + ' mm (nutzbar)';
    document.getElementById('info-lieferbreite').textContent = profile.lieferbreite + ' mm (inkl. Überlappung)';
    document.getElementById('info-seitenueberlappung').textContent = (profile.seitenueberlappung || 50) + ' mm';
    document.getElementById('info-ueberstand').textContent = (profile.ueberstand || 50) + ' mm';
    
    document.getElementById('info-roof-type').textContent = analysis.shapeType;
    document.getElementById('info-dimensions').textContent = `${analysis.width.toFixed(1)} × ${analysis.height.toFixed(1)} m`;
    document.getElementById('info-area').textContent = analysis.area.toFixed(2) + ' m²';

    // Dachneigung
    const dachNeigung = projectData.roofShape?.dachNeigung || 15;
    document.getElementById('info-neigung').textContent = dachNeigung + '°';

    // Verlegerichtung
    document.getElementById('direction-text').textContent = 'Längs (parallel zur Wasserlaufrichtung)';

    console.log('✅ Projekt-Info erfolgreich geladen');
    return true;
}

// KORRIGIERTE Hauptberechnung
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

        // Geometrie analysieren
        const analysis = analyzeRoofGeometry();
        
        // Verlegerichtung bestimmen (Standard: längs)
        const verlegerichtung = 'laengs';

        // Berechnung durchführen
        calculationResults = calculateForDirection(analysis, verlegerichtung, profile);

        // Ergebnisse anzeigen
        displayResults(calculationResults);
        
        // Visualisierung aktualisieren
        drawRoofVisualization(analysis.points, calculationResults);
        
        document.getElementById('continue-btn').disabled = false;

    } catch (error) {
        console.error('❌ Fehler bei der Berechnung:', error);
        showDebugInfo({
            error: error.message,
            stack: error.stack
        });
        alert('Fehler bei der Berechnung: ' + error.message);
    }
}

// KORRIGIERTE Richtungsberechnung mit Form-spezifischer Logik
function calculateForDirection(analysis, richtung, profile) {
    console.log('=== BERECHNE FÜR RICHTUNG ===');
    console.log(`Shape: ${analysis.shapeType}, Richtung: ${richtung}`);
    console.log('Profile:', profile);
    
    const deckbreite = profile.deckbreite; // Nutzbare Breite
    const seitenueberlappung = profile.seitenueberlappung;
    const ueberstand = profile.ueberstand || 50;
    
    let bahnenAnzahl, bahnenLaenge;
    let variableLengths = [];
    
    // Form-spezifische Berechnung
    switch (analysis.shapeType) {
        case 'kreis':
        case 'oval':
            // Kreisförmige Dächer: Durchmesser als Basis
            bahnenAnzahl = Math.ceil(analysis.width * 1000 / deckbreite);
            bahnenLaenge = (analysis.height * 1000) + ueberstand;
            break;
            
        case 'dreieck':
        case 'gleichseitig':
        case 'rechtwinklig':
        case 'ungleichschenklig':
            // Dreieckige Dächer: Variable Längen
            bahnenAnzahl = Math.ceil(analysis.width * 1000 / deckbreite);
            bahnenLaenge = (analysis.height * 1000) + ueberstand;
            variableLengths = calculateTrianglePlateLengths(analysis, bahnenAnzahl, deckbreite, ueberstand);
            break;
            
        case 'trapez':
            // Trapezförmige Dächer: Spezielle Berechnung
            bahnenAnzahl = Math.ceil(analysis.width * 1000 / deckbreite);
            bahnenLaenge = (analysis.height * 1000) + ueberstand;
            variableLengths = calculateTrapezPlateLengths(analysis, bahnenAnzahl, deckbreite, ueberstand);
            break;
            
        case 'lform':
        case 'tform':
        case 'uform':
            // Komplexe Formen: Spezielle Behandlung
            const complexResult = calculateComplexShape(analysis, deckbreite, ueberstand);
            bahnenAnzahl = complexResult.bahnenAnzahl;
            bahnenLaenge = complexResult.bahnenLaenge;
            variableLengths = complexResult.variableLengths;
            break;
            
        default:
            // Standard Rechteck/Quadrat
            if (richtung === 'laengs') {
                bahnenAnzahl = Math.ceil(analysis.width * 1000 / deckbreite);
                bahnenLaenge = (analysis.height * 1000) + ueberstand;
            } else {
                bahnenAnzahl = Math.ceil(analysis.height * 1000 / deckbreite);
                bahnenLaenge = (analysis.width * 1000) + ueberstand;
            }
            break;
    }

    // Verfügbare Längen ermitteln
    let verfuegbareLaengen = [];
    if (profile.laengentyp === 'lager') {
        verfuegbareLaengen = [...profile.lagerlaengen];
    } else {
        for (let l = profile.minL

// KORRIGIERTE calculateForDirection Funktion für Trapez
function calculateForDirection(analysis, richtung, profile) {
    // WICHTIG: Überprüfen ob alle Profil-Daten vorhanden sind
    if (!profile.deckbreite || !profile.seitenueberlappung) {
        throw new Error(`Unvollständige Profil-Daten: deckbreite=${profile.deckbreite}, seitenueberlappung=${profile.seitenueberlappung}`);
    }

    const deckbreite = profile.deckbreite; // Das ist die NUTZBARE Breite!
    const seitenueberlappung = profile.seitenueberlappung; // Seitenüberlappung
    const ueberstand = profile.ueberstand || 50;
    
    console.log('calculateForDirection - Trapez-erweitert:', {
        deckbreite: deckbreite,
        seitenueberlappung: seitenueberlappung,
        ueberstand: ueberstand,
        richtung: richtung,
        shapeType: analysis.shapeType,
        analysis: analysis
    });
    
    let bahnenAnzahl, bahnenLaenge;
    
    // KORRIGIERTE Logik für Trapez
    if (analysis.shapeType === 'trapez') {
        console.log('Spezielle Trapez-Berechnung');
        
        if (richtung === 'laengs') {
            // Bei Trapez: Anzahl Bahnen basierend auf der BREITESTEN Stelle
            const maxBreite = analysis.width; // Breiteste Stelle des Trapezes
            bahnenAnzahl = Math.ceil(maxBreite * 1000 / deckbreite);
            bahnenLaenge = (analysis.height * 1000) + ueberstand;
        } else {
            // Quer: Über die Höhe des Trapezes
            bahnenAnzahl = Math.ceil(analysis.height * 1000 / deckbreite);
            bahnenLaenge = (analysis.width * 1000) + ueberstand;
        }
    } else if (analysis.shapeType === 'dreieck') {
        console.log('Spezielle Dreieck-Berechnung');
        
        if (richtung === 'laengs') {
            bahnenAnzahl = Math.ceil(analysis.width * 1000 / deckbreite);
            bahnenLaenge = (analysis.height * 1000) + ueberstand;
        } else {
            bahnenAnzahl = Math.ceil(analysis.height * 1000 / deckbreite);
            bahnenLaenge = (analysis.width * 1000) + ueberstand;
        }
    } else {
        // Standard Rechteck-Berechnung
        if (richtung === 'laengs') {
            bahnenAnzahl = Math.ceil(analysis.width * 1000 / deckbreite);
            bahnenLaenge = (analysis.height * 1000) + ueberstand;
        } else {
            bahnenAnzahl = Math.ceil(analysis.height * 1000 / deckbreite);
            bahnenLaenge = (analysis.width * 1000) + ueberstand;
        }
    }

    // Verfügbare Längen
    let verfuegbareLaengen = [];
    if (profile.laengentyp === 'lager') {
        verfuegbareLaengen = [...profile.lagerlaengen];
    } else {
        for (let l = profile.minLaenge; l <= profile.maxLaenge; l += (profile.schnittRaster || 100)) {
            verfuegbareLaengen.push(l);
        }
    }

    // Für Dreiecke und Trapezoide: Variable Plattenlängen berechnen
    let variableLengths = [];
    const isTriangle = analysis.shapeType === 'dreieck';
    const isTrapez = analysis.shapeType === 'trapez';
    
    if ((isTriangle || isTrapez) && richtung === 'laengs') {
        if (isTriangle) {
            variableLengths = calculateTrianglePlateLengths(analysis, bahnenAnzahl, deckbreite, ueberstand);
        } else if (isTrapez) {
            variableLengths = calculateTrapezPlateLengths(analysis, bahnenAnzahl, deckbreite, ueberstand);
        }
    }

    // Optimale Länge finden
    const optimization = variableLengths.length > 0 ? 
        optimizeVariableLengths(variableLengths, verfuegbareLaengen) :
        optimizeLengths(bahnenLaenge, verfuegbareLaengen, bahnenAnzahl);
    
    const totalLength = optimization.totalLength;
    const totalWaste = optimization.totalWaste;
    const verschnittProzent = totalLength > 0 ? (totalWaste / totalLength) * 100 : 0;
    
    console.log('Berechnung abgeschlossen:', {
        shapeType: analysis.shapeType,
        bahnenAnzahl: bahnenAnzahl,
        bahnenLaenge: bahnenLaenge,
        totalLength: totalLength,
        verschnittProzent: verschnittProzent
    });
    
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
        // Zusätzliche Infos für Erläuterung
        dachbreite: analysis.width,
        dachhoehe: analysis.height,
        deckbreite: profile.deckbreite,
        lieferbreite: profile.lieferbreite,
        seitenueberlappung: profile.seitenueberlappung,
        isTriangle: isTriangle,
        isTrapez: isTrapez,
        shapeType: analysis.shapeType
    };
}

// NEUE Funktion: Berechnung der Plattenlängen für Trapez
function calculateTrapezPlateLengths(analysis, bahnenAnzahl, deckbreite, ueberstand) {
    const points = analysis.points;
    if (points.length !== 4) return [];

    const profile = projectData.profile;
    const lieferbreite = profile.lieferbreite;

    // Trapez-Geometrie analysieren
    const xs = points.map(p => p.x);
    const ys = points.map(p => p.y);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);
    
    const basisBreite = maxX - minX;
    const trapezHoehe = maxY - minY;

    console.log('Trapez-Plattenberechnung:', {
        basisBreite: basisBreite,
        trapezHoehe: trapezHoehe,
        bahnenAnzahl: bahnenAnzahl,
        deckbreite: deckbreite,
        lieferbreite: lieferbreite
    });

    // Bei einem Trapez ist die Höhe konstant über die gesamte Breite
    const plateLengths = [];
    
    for (let i = 0; i < bahnenAnzahl; i++) {
        // Physische Platte bestimmt die Abdeckung
        const platteStart = i * (deckbreite / 1000);
        const platteEnd = platteStart + (lieferbreite / 1000);
        
        // Sicherstellen, dass Platte nicht über Trapez hinausgeht
        const platteStartKorrigiert = Math.max(0, platteStart);
        const platteEndKorrigiert = Math.min(basisBreite, platteEnd);
        
        // Plattenlänge = Trapez-Höhe + Überstand (konstant für alle Bahnen)
        const plattenLaenge = (trapezHoehe * 1000) + ueberstand;
        
        console.log(`Trapez-Bahn ${i + 1}: Platte ${platteStartKorrigiert.toFixed(2)}m-${platteEndKorrigiert.toFixed(2)}m`);
        console.log(`  → Trapez-Höhe: ${trapezHoehe.toFixed(2)}m, Plattenlänge: ${plattenLaenge.toFixed(0)}mm`);
        
        plateLengths.push({
            bahnNummer: i + 1,
            laenge: Math.round(plattenLaenge),
            trapezHoehe: trapezHoehe,
            position: platteStartKorrigiert,
            platteStart: platteStartKorrigiert,
            platteEnd: platteEndKorrigiert
        });
    }
    
    return plateLengths;
}

// FINALE KORRIGIERTE Funktion für Dreieck-Berechnungen
function calculateTrianglePlateLengths(analysis, bahnenAnzahl, deckbreite, ueberstand) {
    const points = analysis.points;
    if (points.length !== 3) return [];

    const profile = projectData.profile;
    const lieferbreite = profile.lieferbreite;

    // Analysiere die Dreieck-Geometrie
    const xs = points.map(p => p.x);
    const ys = points.map(p => p.y);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);
    
    const basisBreite = maxX - minX;
    const dreieckHoehe = maxY - minY;

    // Bestimme Dreieck-Typ basierend auf roofShape.variant
    const dreieckTyp = projectData.roofShape?.variant || 'rechtwinklig';

    console.log('FINALE Dreieck-Analyse (physische Plattenabdeckung):', {
        basisBreite: basisBreite,
        dreieckHoehe: dreieckHoehe,
        bahnenAnzahl: bahnenAnzahl,
        deckbreite: deckbreite,
        lieferbreite: lieferbreite,
        dreieckTyp: dreieckTyp
    });

    // Funktion um Dreieckshöhe an beliebiger Position zu berechnen
    function getTriangleHeightAtPosition(relativePosition) {
        // Sicherstellen, dass Position im gültigen Bereich ist
        relativePosition = Math.max(0, Math.min(1, relativePosition));
        
        if (dreieckTyp === 'gleichseitig' || dreieckTyp === 'gleichschenklig') {
            // Gleichschenkliges Dreieck: Spitze in der Mitte oben
            if (relativePosition <= 0.5) {
                // Linke Hälfte: Höhe steigt linear von 0 auf dreieckHoehe
                return dreieckHoehe * (relativePosition * 2);
            } else {
                // Rechte Hälfte: Höhe fällt linear von dreieckHoehe auf 0
                return dreieckHoehe * (2 - relativePosition * 2);
            }
        } else if (dreieckTyp === 'rechtwinklig') {
            // Rechtwinkliges Dreieck: Spitze rechts
            return dreieckHoehe * (1 - relativePosition);
        } else {
            // Standard: rechtwinkliges Verhalten
            return dreieckHoehe * (1 - relativePosition);
        }
    }

    const plateLengths = [];
    
    for (let i = 0; i < bahnenAnzahl; i++) {
        // KORREKT: Physische Platte (Lieferbreite) bestimmt die Abdeckung
        // Erste Platte: 0 bis lieferbreite
        // Zweite Platte: deckbreite bis (deckbreite + lieferbreite)
        // usw.
        
        const platteStart = i * (deckbreite / 1000);
        const platteEnd = platteStart + (lieferbreite / 1000);
        
        // Sicherstellen, dass Platte nicht über Dreieck hinausgeht
        const platteStartKorrigiert = Math.max(0, platteStart);
        const platteEndKorrigiert = Math.min(basisBreite, platteEnd);
        
        // Relative Positionen für Höhenberechnung
        const relativeStart = platteStartKorrigiert / basisBreite;
        const relativeEnd = platteEndKorrigiert / basisBreite;
        
        // Höhen an den Rändern der physischen Platte
        const hoeheLinks = getTriangleHeightAtPosition(relativeStart);
        const hoeheRechts = getTriangleHeightAtPosition(relativeEnd);
        
        // Prüfe ob die Spitze des Dreiecks innerhalb der Platte liegt
        let hoeheMitte = 0;
        if (dreieckTyp === 'gleichseitig' || dreieckTyp === 'gleichschenklig') {
            // Spitze bei relativer Position 0.5 (Mitte)
            const spitzePosition = 0.5;
            if (relativeStart <= spitzePosition && spitzePosition <= relativeEnd) {
                // Spitze liegt innerhalb der Platte
                hoeheMitte = getTriangleHeightAtPosition(spitzePosition);
                console.log(`Bahn ${i + 1}: SPITZE liegt in der Platte! Höhe=${hoeheMitte.toFixed(2)}m`);
            }
        }
        
        // Die Plattenlänge ist das MAXIMUM der drei Höhen
        const maxHoehe = Math.max(hoeheLinks, hoeheRechts, hoeheMitte);
        
        // Bestimme welche Seite/Position das Maximum liefert (für Debug)
        let maxPosition = 'links';
        if (maxHoehe === hoeheRechts && hoeheRechts > hoeheLinks && hoeheRechts >= hoeheMitte) {
            maxPosition = 'rechts';
        } else if (maxHoehe === hoeheMitte && hoeheMitte > 0) {
            maxPosition = 'spitze';
        }
        
        // Plattenlänge = maximale Dreieckshöhe + Überstand
        const plattenLaenge = Math.max(ueberstand, (maxHoehe * 1000) + ueberstand);
        
        console.log(`Bahn ${i + 1}: Platte ${platteStartKorrigiert.toFixed(2)}m-${platteEndKorrigiert.toFixed(2)}m`);
        console.log(`  Links: ${hoeheLinks.toFixed(2)}m, Rechts: ${hoeheRechts.toFixed(2)}m, Mitte: ${hoeheMitte.toFixed(2)}m`);
        console.log(`  → MAX: ${maxHoehe.toFixed(2)}m (${maxPosition}), Plattenlänge: ${plattenLaenge.toFixed(0)}mm`);
        
        plateLengths.push({
            bahnNummer: i + 1,
            laenge: Math.round(plattenLaenge),
            dreieckHoehe: maxHoehe,
            position: platteStartKorrigiert,
            platteStart: platteStartKorrigiert,
            platteEnd: platteEndKorrigiert,
            hoeheLinks: hoeheLinks,
            hoeheRechts: hoeheRechts,
            hoeheMitte: hoeheMitte,
            maxPosition: maxPosition
        });
    }
    
    return plateLengths;
}

// Neue Funktion für variable Längen-Optimierung
function optimizeVariableLengths(variableLengths, verfuegbareLaengen) {
    const sortedLengths = verfuegbareLaengen.sort((a, b) => b - a);
    
    let totalLength = 0;
    let totalWaste = 0;
    const orderList = [];
    const cuttingPlan = [];
    
    // Gruppiere ähnliche Längen
    const lengthGroups = {};
    variableLengths.forEach(plate => {
        if (plate.laenge > 0) {
            // Finde beste verfügbare Länge
            const bestLength = sortedLengths.find(length => length >= plate.laenge) || sortedLengths[0];
            
            if (!lengthGroups[bestLength]) {
                lengthGroups[bestLength] = {
                    length: bestLength,
                    quantity: 0,
                    plates: []
                };
            }
            
            lengthGroups[bestLength].quantity++;
            lengthGroups[bestLength].plates.push(plate);
        }
    });
    
    // Erstelle Bestellliste
    Object.values(lengthGroups).forEach(group => {
        const waste = group.plates.reduce((sum, plate) => sum + (group.length - plate.laenge), 0);
        
        orderList.push({
            length: group.length,
            quantity: group.quantity,
            usage: group.quantity === 1 ? 'Einzelplatte' : `${group.quantity} Platten`
        });
        
        cuttingPlan.push({
            sourceLength: group.length,
            cuts: group.plates.map(plate => ({
                length: plate.laenge,
                quantity: 1,
                usage: `Bahn ${plate.bahnNummer}`
            })),
            waste: waste / group.quantity
        });
        
        totalLength += group.length * group.quantity;
        totalWaste += waste;
    });
    
    return {
        orderList: orderList,
        cuttingPlan: cuttingPlan,
        totalLength: totalLength,
        totalWaste: totalWaste
    };
}

function optimizeLengths(benoetigteLaenge, verfuegbareLaengen, anzahlBahnen) {
    const sortedLengths = verfuegbareLaengen.sort((a, b) => b - a);
    
    // Beste passende Länge finden
    let bestLength = sortedLengths.find(length => length >= benoetigteLaenge);
    
    if (!bestLength) {
        // Falls keine passende Länge vorhanden, die größte nehmen
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

// Dach und Platten visualisieren
function drawRoofVisualization(roofPoints, plateLayout) {
    if (!ctx || !roofPoints) return;

    // Canvas leeren
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Hintergrund
    ctx.fillStyle = '#f8f9fa';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    console.log('drawRoofVisualization aufgerufen mit plateLayout:', plateLayout);

    // Bounding Box berechnen
    const xs = roofPoints.map(p => p.x);
    const ys = roofPoints.map(p => p.y);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);
    const roofWidth = maxX - minX;
    const roofHeight = maxY - minY;

    // Skalierung berechnen
    const margin = 40;
    const availableWidth = canvas.width - 2 * margin;
    const availableHeight = canvas.height - 2 * margin;
    const scale = Math.min(availableWidth / roofWidth, availableHeight / roofHeight) * 0.8;
    
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const roofCenterX = (minX + maxX) / 2;
    const roofCenterY = (minY + maxY) / 2;

    // Koordinaten transformieren
    function transformPoint(x, y) {
        return {
            x: centerX + (x - roofCenterX) * scale,
            y: centerY - (y - roofCenterY) * scale
        };
    }

    // Dachfläche zeichnen
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
    ctx.lineWidth = 2;
    ctx.stroke();

    // Platten zeichnen (falls Layout vorhanden)
    if (plateLayout) {
        console.log('Zeichne Platten mit Layout:', {
            variableLengths: plateLayout.variableLengths,
            bahnenAnzahl: plateLayout.bahnenAnzahl
        });
        drawPlateLayout(plateLayout, transformPoint, scale);
    } else {
        console.log('Kein plateLayout vorhanden');
    }

    // Bemaßung
    drawDimensions(roofPoints, transformPoint);
}

function drawPlateLayout(layout, transformPoint, scale) {
    const profile = projectData.profile;
    const deckbreite = profile.deckbreite / 1000; // in Meter
    const lieferbreite = profile.lieferbreite / 1000; // in Meter

    // Hilfsfunktion: Prüft ob ein Punkt innerhalb der Form liegt
    function isPointInShape(x, y, roofPoints) {
        if (!roofPoints || roofPoints.length < 3) return false;
        
        // Ray casting algorithm für Punkt-in-Polygon Test
        let inside = false;
        for (let i = 0, j = roofPoints.length - 1; i < roofPoints.length; j = i++) {
            if (((roofPoints[i].y > y) !== (roofPoints[j].y > y)) &&
                (x < (roofPoints[j].x - roofPoints[i].x) * (y - roofPoints[i].y) / (roofPoints[j].y - roofPoints[i].y) + roofPoints[i].x)) {
                inside = !inside;
            }
        }
        return inside;
    }

    // Hole die Dach-Punkte für die Verschnitt-Berechnung
    const roofPoints = projectData.roofShape?.points || projectData.geometry?.points || [];

    for (let i = 0; i < layout.bahnenAnzahl; i++) {
        let currentPlateLength = layout.bahnenLaenge / 1000; // Standardlänge in Meter

        if (layout.variableLengths && layout.variableLengths.length > i) {
            currentPlateLength = layout.variableLengths[i].laenge / 1000;
        }

        // Position der kompletten physischen Platte
        let plateX, plateY, plateWidth, plateHeight;

        if (layout.richtung === 'laengs') {
            plateX = i * deckbreite;
            plateY = 0;
            plateWidth = lieferbreite; // Komplette Lieferbreite
            plateHeight = currentPlateLength;
        } else {
            plateX = 0;
            plateY = i * deckbreite;
            plateWidth = currentPlateLength;
            plateHeight = lieferbreite;
        }

        // Teile die Platte in kleine Bereiche und prüfe jeden separat
        const steps = 20; // Auflösung für die Verschnitt-Erkennung
        
        for (let sx = 0; sx < steps; sx++) {
            for (let sy = 0; sy < steps; sy++) {
                const subX = plateX + (plateWidth * sx / steps);
                const subY = plateY + (plateHeight * sy / steps);
                const subWidth = plateWidth / steps;
                const subHeight = plateHeight / steps;
                
                // Prüfe Mittelpunkt des Sub-Bereichs
                const centerX = subX + subWidth / 2;
                const centerY = subY + subHeight / 2;
                
                const isInRoof = isPointInShape(centerX, centerY, roofPoints);
                
                // Canvas-Koordinaten für diesen Sub-Bereich
                const topLeft = transformPoint(subX, subY);
                const bottomRight = transformPoint(subX + subWidth, subY + subHeight);
                const rectWidth = bottomRight.x - topLeft.x;
                const rectHeight = bottomRight.y - topLeft.y;
                
                if (isInRoof) {
                    // Innerhalb der Dachfläche: bestimme Typ
                    const deckbereichStart = i * deckbreite;
                    const deckbereichEnd = deckbereichStart + deckbreite;
                    
                    if (layout.richtung === 'laengs') {
                        if (subX >= deckbereichStart && subX < deckbereichEnd) {
                            // Hauptbereich (Deckbreite)
                            ctx.fillStyle = 'rgba(40, 167, 69, 0.4)'; // Hellgrün
                        } else {
                            // Seitenüberlappung
                            ctx.fillStyle = 'rgba(40, 167, 69, 0.8)'; // Dunkelgrün
                        }
                    } else {
                        // Ähnliche Logik für quer
                        ctx.fillStyle = 'rgba(40, 167, 69, 0.4)'; // Vereinfacht
                    }
                } else {
                    // Außerhalb der Dachfläche: Verschnitt
                    ctx.fillStyle = 'rgba(220, 53, 69, 0.6)'; // Rot
                }
                
                ctx.fillRect(topLeft.x, topLeft.y, rectWidth, rectHeight);
            }
        }

        // Bahnnummer nur im Hauptbereich
        if (layout.richtung === 'laengs') {
            const deckX = i * deckbreite;
            const deckY = 0;
            const deckW = deckbreite;
            const deckH = currentPlateLength;
            
            const topLeft = transformPoint(deckX, deckY);
            const bottomRight = transformPoint(deckX + deckW, deckY + deckH);
            const rectWidth = bottomRight.x - topLeft.x;
            const rectHeight = bottomRight.y - topLeft.y;

            // Rahmen um Hauptbereich
            ctx.strokeStyle = '#28a745';
            ctx.lineWidth = 2;
            ctx.strokeRect(topLeft.x, topLeft.y, rectWidth, rectHeight);

            // Bahnnummer
            ctx.fillStyle = '#000';
            ctx.font = '12px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(
                (i + 1).toString(),
                topLeft.x + rectWidth / 2,
                topLeft.y + rectHeight / 2
            );
        }
    }
}

function drawDimensions(roofPoints, transformPoint) {
    ctx.strokeStyle = '#666';
    ctx.fillStyle = '#000';
    ctx.lineWidth = 1;
    ctx.font = '10px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';

    // Außenmaße der ersten beiden Seiten
    for (let i = 0; i < Math.min(2, roofPoints.length); i++) {
        const p1 = roofPoints[i];
        const p2 = roofPoints[(i + 1) % roofPoints.length];
        
        const start = transformPoint(p1.x, p1.y);
        const end = transformPoint(p2.x, p2.y);
        
        const midX = (start.x + end.x) / 2;
        const midY = (start.y + end.y) / 2;
        
        // Länge berechnen
        const length = Math.sqrt((p2.x - p1.x) ** 2 + (p2.y - p1.y) ** 2);
        
        // Maßtext
        ctx.fillText(length.toFixed(1) + 'm', midX, midY - 5);
    }
}

function displayResults(results) {
    document.getElementById('total-rows').textContent = results.bahnenAnzahl;
    document.getElementById('plate-length').textContent = (results.bahnenLaenge / 1000).toFixed(1) + ' m';
    document.getElementById('total-length').textContent = results.totalLength.toFixed(1) + ' m';
    document.getElementById('total-waste').textContent = results.verschnitt.toFixed(1) + ' %';

    // Bestelltabelle füllen
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

    // Berechnungserklärung anzeigen
    displayCalculationExplanation(results);

    document.getElementById('results-section').style.display = 'block';
}

// Erweiterte displayCalculationExplanation für Trapez
function displayCalculationExplanation(results) {
    const container = document.getElementById('calculation-explanation');
    if (!container) return;

    const verlegerichtungText = results.richtung === 'laengs' ? 'längs (parallel zur Wasserlaufrichtung)' : 'quer (senkrecht zur Wasserlaufrichtung)';
    const ueberstendWert = ((results.bahnenLaenge - (results.richtung === 'laengs' ? results.dachhoehe * 1000 : results.dachbreite * 1000))).toFixed(0);
    
    let plattenLaengenText = '';
    let shapeSpecificText = '';
    
    // Shape-spezifische Erklärungen
    if (results.shapeType === 'trapez') {
        shapeSpecificText = `
            <p><strong>Trapez-Besonderheit:</strong> Bei trapezförmigen Dächern ist die Plattenlänge über die gesamte Breite konstant, 
            da die Höhe des Trapezes gleichmäßig ist. Alle Bahnen haben daher die gleiche Länge.</p>
        `;
        
        if (results.variableLengths && results.variableLengths.length > 0) {
            plattenLaengenText = `
                <p><strong>Konstante Plattenlänge für Trapez:</strong> ${(results.variableLengths[0].laenge / 1000).toFixed(2)}m 
                (Trapez-Höhe: ${results.dachhoehe.toFixed(1)}m + ${ueberstendWert}mm Überstand)</p>
            `;
        } else {
            plattenLaengenText = `
                <p><strong>Konstante Plattenlänge:</strong> ${(results.bahnenLaenge / 1000).toFixed(2)} m</p>
            `;
        }
    } else if (results.isTriangle && results.variableLengths && results.variableLengths.length > 0) {
        shapeSpecificText = `
            <p><strong>Dreieck-Besonderheit:</strong> Bei dreieckigen Dächern werden die Platten zur Spitze hin kürzer, um Material zu sparen.</p>
        `;
        
        plattenLaengenText = `
            <p><strong>Variable Plattenlängen (bei Dreiecken):</strong></p>
            <ul style="margin-left: 20px;">
                ${results.variableLengths.slice(0, 3).map(plate => 
                    `<li>Bahn ${plate.bahnNummer}: ${(plate.laenge / 1000).toFixed(2)}m (Dreieckshöhe: ${plate.dreieckHoehe.toFixed(1)}m + ${ueberstendWert}mm Überstand)</li>`
                ).join('')}
                ${results.variableLengths.length > 3 ? '<li>... weitere Bahnen werden kürzer</li>' : ''}
            </ul>
        `;
    } else {
        plattenLaengenText = `
            <p><strong>Konstante Plattenlänge:</strong> ${(results.bahnenLaenge / 1000).toFixed(2)} m</p>
        `;
    }
    
    container.innerHTML = `
        <h5>Berechnungsschritte:</h5>
        <div style="margin: 10px 0;">
            <p><strong>1. Dachform:</strong> ${results.shapeType === 'trapez' ? 'Trapez' : results.shapeType === 'dreieck' ? 'Dreieck' : 'Rechteck'}</p>
            <p><strong>2. Verlegerichtung:</strong> ${verlegerichtungText}</p>
            <p><strong>3. Bahnenanzahl berechnen:</strong></p>
            <ul style="margin-left: 20px;">
                <li>Dachbreite ${results.richtung === 'laengs' ? 'quer' : 'längs'} zur Verlegung: ${results.richtung === 'laengs' ? results.dachbreite.toFixed(1) : results.dachhoehe.toFixed(1)} m</li>
                <li>Deckbreite (nutzbar): ${results.deckbreite} mm</li>
                <li>Benötigte Bahnen: ${(results.richtung === 'laengs' ? results.dachbreite * 1000 : results.dachhoehe * 1000).toFixed(0)}mm ÷ ${results.deckbreite}mm = ${results.bahnenAnzahl} Bahnen</li>
            </ul>
            <p><strong>4. Plattenlänge berechnen:</strong></p>
            <ul style="margin-left: 20px;">
                <li>Dachlänge ${results.richtung === 'laengs' ? 'längs' : 'quer'}: ${results.richtung === 'laengs' ? results.dachhoehe.toFixed(1) : results.dachbreite.toFixed(1)} m</li>
                <li>Überstand nur an der Traufe: ${ueberstendWert}mm</li>
                ${plattenLaengenText}
            </ul>
            <p><strong>Wichtig:</strong> Die Deckbreite (${results.deckbreite}mm) ist die bereits nutzbare Breite pro Platte. Die Seitenüberlappung (${results.seitenueberlappung}mm) ist in der Lieferbreite bereits berücksichtigt.</p>
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
        console.log('Berechnung wird initialisiert...');
        
        // Projektdaten laden
        projectData = loadData();
        console.log('Geladene Projektdaten:', projectData);
        
        // Canvas initialisieren
        initCanvas();
        
        // Projekt-Info laden
        const infoLoaded = loadProjectInfo();
        
        if (infoLoaded) {
            // Erste Visualisierung (nur Dach, ohne Platten)
            const roof = projectData.roofShape;
            const geometry = projectData.geometry;
            let roofPoints = null;
            if (roof && roof.points) {
                roofPoints = roof.points;
            } else if (geometry && geometry.points) {
                roofPoints = geometry.points;
            }
            
            if (roofPoints) {
                drawRoofVisualization(roofPoints, null);
            }
        }
        
        console.log('Berechnung erfolgreich initialisiert');
        
    } catch (error) {
        console.error('Fehler bei der Initialisierung:', error);
        showDebugInfo({
            error: 'Initialisierungsfehler',
            message: error.message,
            stack: error.stack
        });
        alert('Fehler beim Laden der Berechnung: ' + error.message);
    }
}

// Canvas-Größe bei Fenster-Resize anpassen
window.addEventListener('resize', function() {
    if (canvas) {
        const container = canvas.parentElement;
        const newWidth = Math.min(600, container.clientWidth - 40);
        const newHeight = (newWidth / 600) * 400;
        
        canvas.width = newWidth;
        canvas.height = newHeight;
        canvas.style.width = newWidth + 'px';
        canvas.style.height = newHeight + 'px';
        
        // Neu zeichnen
        if (calculationResults) {
            const roof = projectData.roofShape;
            const geometry = projectData.geometry;
            let roofPoints = null;
            if (roof && roof.points) {
                roofPoints = roof.points;
            } else if (geometry && geometry.points) {
                roofPoints = geometry.points;
            }
            if (roofPoints) {
                drawRoofVisualization(roofPoints, calculationResults);
            }
        }
    }
});

// Event Listeners
document.addEventListener('DOMContentLoaded', function() {
    init();
});

// Überprüfung der Projektdaten nach dem Laden
window.addEventListener('load', function() {
    const profile = projectData.profile;
    const roof = projectData.roofShape;
    const geometry = projectData.geometry;
    
    console.log('Überprüfe Projektdaten beim Laden:', {
        profile: !!profile,
        roof: !!roof,
        geometry: !!geometry,
        roofPoints: (roof && roof.points) || (geometry && geometry.points),
        data: projectData
    });
    
    if (!profile) {
        setTimeout(function() {
            if (confirm('Profil-Daten fehlen. Möchten Sie zu Schritt 1 zurückkehren?')) {
                window.location.href = 'profil.html';
            }
        }, 1000);
    } else if ((!roof && !geometry) || (!profile.deckbreite || !profile.seitenueberlappung)) {
        setTimeout(function() {
            showDebugInfo({
                message: 'Unvollständige Daten erkannt',
                profile: profile,
                roof: roof,
                geometry: geometry
            });
            if (confirm('Unvollständige Daten erkannt. Möchten Sie zum vorherigen Schritt zurückkehren?')) {
                if (!profile.deckbreite || !profile.seitenueberlappung) {
                    window.location.href = 'profil.html';
                } else {
                    window.location.href = 'dachform.html';
                }
            }
        }, 1000);
    } else if ((!roof || !roof.points) && (!geometry || !geometry.points)) {
        setTimeout(function() {
            if (confirm('Geometrie-Daten fehlen. Möchten Sie zum Editor zurückkehren?')) {
                window.location.href = 'Editor.html';
            }
        }, 1000);
    }
});

console.log('Trapez-korrigierte berechnung.js vollständig geladen');
