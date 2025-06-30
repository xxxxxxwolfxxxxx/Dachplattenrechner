// editor-simplified.js - Vereinfachter Editor nur für Transformation

let projectData = {};
let currentTransform = {
    rotation: 0,
    mirrorH: false,
    mirrorV: false
};
let generatedPoints = [];
let fineRotationMode = false;

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

// Punkt-Generierung basierend auf Geometrie-Daten
function generateShapePoints() {
    const geometry = projectData.geometry;
    if (!geometry || !geometry.variant || !geometry.dimensions) {
        console.error('Keine Geometrie-Daten gefunden');
        return [];
    }

    const variant = geometry.variant;
    const dims = geometry.dimensions;
    
    console.log('Generiere Punkte für:', variant, dims);

    try {
        switch (variant) {
            case 'kreis':
                return generateCirclePoints(dims);
            case 'oval':
                return generateOvalPoints(dims);
            case 'halbkreis':
                return generateHalfCirclePoints(dims);
            case 'viertelkreis':
                return generateQuarterCirclePoints(dims);
            case 'langloch':
                return generateLanglochPoints(dims);
            case 'rechteck':
                return generateRectanglePoints(dims);
            case 'quadrat':
                return generateSquarePoints(dims);
            case 'dreieck':
                return generateTrianglePoints(dims);
            case 'trapez':
                return generateTrapezPoints(dims);
            case 'parallelogramm':
                return generateParallelogramPoints(dims);
            case 'rhombus':
                return generateRhombusPoints(dims);
            case 'fuenfeck':
                return generatePentagonPoints(dims);
            case 'sechseck':
                return generateHexagonPoints(dims);
            case 'achteck':
                return generateOctagonPoints(dims);
            case 'lform':
                return generateLShapePoints(dims);
            case 'tform':
                return generateTShapePoints(dims);
            case 'uform':
                return generateUShapePoints(dims);
            default:
                console.log('Unbekannte Variante, verwende Rechteck');
                return generateRectanglePoints({ length: 8, width: 5 });
        }
    } catch (error) {
        console.error('Fehler bei Punkt-Generierung:', error);
        return generateRectanglePoints({ length: 8, width: 5 });
    }
}

// Punkt-Generierung Funktionen
function generateCirclePoints(dims) {
    const radius = dims.radius || 4;
    const points = [];
    const segments = 24;
    
    for (let i = 0; i < segments; i++) {
        const angle = (i * 2 * Math.PI) / segments;
        points.push({
            x: radius * Math.cos(angle),
            y: radius * Math.sin(angle)
        });
    }
    return points;
}

function generateOvalPoints(dims) {
    const radiusX = dims.radiusX || 4;
    const radiusY = dims.radiusY || 2.5;
    const points = [];
    const segments = 24;
    
    for (let i = 0; i < segments; i++) {
        const angle = (i * 2 * Math.PI) / segments;
        points.push({
            x: radiusX * Math.cos(angle),
            y: radiusY * Math.sin(angle)
        });
    }
    return points;
}

function generateHalfCirclePoints(dims) {
    const radius = dims.radius || 4;
    const points = [];
    const segments = 12;
    
    for (let i = 0; i <= segments; i++) {
        const angle = (i * Math.PI) / segments;
        points.push({
            x: radius * Math.cos(angle),
            y: radius * Math.sin(angle)
        });
    }
    return points;
}

function generateQuarterCirclePoints(dims) {
    const radius = dims.radius || 4;
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
    return points;
}

function generateLanglochPoints(dims) {
    const length = dims.length || 6;
    const width = dims.width || 3;
    const radius = width / 2;
    const straightLength = Math.max(0, length - width);
    
    const points = [];
    const segments = 8;
    
    // Rechter Halbkreis
    for (let i = 0; i <= segments; i++) {
        const angle = (-Math.PI/2) + (i * Math.PI) / segments;
        points.push({
            x: straightLength/2 + radius * Math.cos(angle),
            y: radius * Math.sin(angle)
        });
    }
    
    // Linker Halbkreis
    for (let i = 0; i <= segments; i++) {
        const angle = (Math.PI/2) + (i * Math.PI) / segments;
        points.push({
            x: -straightLength/2 + radius * Math.cos(angle),
            y: radius * Math.sin(angle)
        });
    }
    
    return points;
}

function generateRectanglePoints(dims) {
    const length = dims.length || 8;
    const width = dims.width || 5;
    
    return [
        { x: -length/2, y: -width/2 },
        { x: length/2, y: -width/2 },
        { x: length/2, y: width/2 },
        { x: -length/2, y: width/2 }
    ];
}

function generateSquarePoints(dims) {
    const side = dims.side || 5;
    
    return [
        { x: -side/2, y: -side/2 },
        { x: side/2, y: -side/2 },
        { x: side/2, y: side/2 },
        { x: -side/2, y: side/2 }
    ];
}

function generateTrianglePoints(dims) {
    const sideA = dims.sideA || 4;
    const sideB = dims.sideB || 5;
    const sideC = dims.sideC || 6;
    
    // Vereinfachtes gleichseitiges Dreieck
    const side = sideA;
    const height = side * Math.sqrt(3) / 2;
    
    return [
        { x: 0, y: height * 2/3 },
        { x: -side/2, y: -height/3 },
        { x: side/2, y: -height/3 }
    ];
}

function generateTrapezPoints(dims) {
    const sideA = dims.sideA || 8;
    const sideB = dims.sideB || 6;
    const height = dims.height || 4;
    const offset = dims.offset || 1;
    
    return [
        { x: -sideA/2, y: -height/2 },
        { x: sideA/2, y: -height/2 },
        { x: sideB/2 + offset, y: height/2 },
        { x: -sideB/2 + offset, y: height/2 }
    ];
}

function generateParallelogramPoints(dims) {
    const length = dims.length || 8;
    const width = dims.width || 5;
    const angle = (dims.angle || 30) * Math.PI / 180;
    const skew = width * Math.cos(angle);
    
    return [
        { x: -length/2, y: -width/2 },
        { x: length/2, y: -width/2 },
        { x: length/2 + skew, y: width/2 },
        { x: -length/2 + skew, y: width/2 }
    ];
}

function generateRhombusPoints(dims) {
    const side = dims.side || 5;
    const angle = (dims.angle || 60) * Math.PI / 180;
    
    const halfDiag1 = side * Math.sin(angle / 2);
    const halfDiag2 = side * Math.cos(angle / 2);
    
    return [
        { x: 0, y: -halfDiag1 },
        { x: halfDiag2, y: 0 },
        { x: 0, y: halfDiag1 },
        { x: -halfDiag2, y: 0 }
    ];
}

function generatePentagonPoints(dims) {
    const radius = dims.radius || 4;
    const points = [];
    
    for (let i = 0; i < 5; i++) {
        const angle = (i * 2 * Math.PI / 5) - Math.PI / 2;
        points.push({
            x: radius * Math.cos(angle),
            y: radius * Math.sin(angle)
        });
    }
    return points;
}

function generateHexagonPoints(dims) {
    const radius = dims.radius || 4;
    const points = [];
    
    for (let i = 0; i < 6; i++) {
        const angle = (i * 2 * Math.PI / 6) - Math.PI / 2;
        points.push({
            x: radius * Math.cos(angle),
            y: radius * Math.sin(angle)
        });
    }
    return points;
}

function generateOctagonPoints(dims) {
    const radius = dims.radius || 4;
    const points = [];
    
    for (let i = 0; i < 8; i++) {
        const angle = (i * 2 * Math.PI / 8) - Math.PI / 2;
        points.push({
            x: radius * Math.cos(angle),
            y: radius * Math.sin(angle)
        });
    }
    return points;
}

function generateLShapePoints(dims) {
    const lengthTotal = dims.lengthTotal || 10;
    const widthTotal = dims.widthTotal || 8;
    const cutLength = dims.cutLength || 4;
    const cutWidth = dims.cutWidth || 4;
    
    return [
        { x: -lengthTotal/2, y: -widthTotal/2 },
        { x: lengthTotal/2, y: -widthTotal/2 },
        { x: lengthTotal/2, y: -widthTotal/2 + cutWidth },
        { x: -lengthTotal/2 + cutLength, y: -widthTotal/2 + cutWidth },
        { x: -lengthTotal/2 + cutLength, y: widthTotal/2 },
        { x: -lengthTotal/2, y: widthTotal/2 }
    ];
}

function generateTShapePoints(dims) {
    const topWidth = dims.topWidth || 8;
    const stemWidth = dims.stemWidth || 4;
    const topHeight = dims.topHeight || 3;
    const stemHeight = dims.stemHeight || 5;
    
    const totalHeight = topHeight + stemHeight;
    
    return [
        { x: -topWidth/2, y: totalHeight/2 },
        { x: topWidth/2, y: totalHeight/2 },
        { x: topWidth/2, y: totalHeight/2 - topHeight },
        { x: stemWidth/2, y: totalHeight/2 - topHeight },
        { x: stemWidth/2, y: -totalHeight/2 },
        { x: -stemWidth/2, y: -totalHeight/2 },
        { x: -stemWidth/2, y: totalHeight/2 - topHeight },
        { x: -topWidth/2, y: totalHeight/2 - topHeight }
    ];
}

function generateUShapePoints(dims) {
    const outerWidth = dims.outerWidth || 10;
    const innerWidth = dims.innerWidth || 4;
    const height = dims.height || 6;
    const thickness = dims.thickness || 3;
    
    return [
        { x: -outerWidth/2, y: -height/2 },
        { x: outerWidth/2, y: -height/2 },
        { x: outerWidth/2, y: height/2 },
        { x: innerWidth/2, y: height/2 },
        { x: innerWidth/2, y: -height/2 + thickness },
        { x: -innerWidth/2, y: -height/2 + thickness },
        { x: -innerWidth/2, y: height/2 },
        { x: -outerWidth/2, y: height/2 }
    ];
}

// Transformations-Funktionen
function applyTransformation(points) {
    let transformedPoints = [...points];
    
    // Rotation anwenden
    if (currentTransform.rotation !== 0) {
        const angle = currentTransform.rotation * Math.PI / 180;
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);
        
        transformedPoints = transformedPoints.map(point => ({
            x: point.x * cos - point.y * sin,
            y: point.x * sin + point.y * cos
        }));
    }
    
    // Spiegelung anwenden
    if (currentTransform.mirrorH) {
        transformedPoints = transformedPoints.map(point => ({
            x: -point.x,
            y: point.y
        }));
    }
    
    if (currentTransform.mirrorV) {
        transformedPoints = transformedPoints.map(point => ({
            x: point.x,
            y: -point.y
        }));
    }
    
    return transformedPoints;
}

// SVG-Darstellung
function drawShape() {
    const shapeGroup = document.getElementById('shape-group');
    const transformedPoints = applyTransformation(generatedPoints);
    
    // Shape löschen
    shapeGroup.innerHTML = '';
    
    if (transformedPoints.length === 0) return;
    
    // Skalierung berechnen
    const scale = calculateScale(transformedPoints);
    
    // Polygon oder Pfad erstellen
    const pathData = transformedPoints.map((point, index) => {
        const x = point.x * scale;
        const y = -point.y * scale; // Y-Achse umkehren für SVG
        return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
    }).join(' ') + ' Z';
    
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', pathData);
    path.setAttribute('fill', 'url(#shapeGradient)');
    path.setAttribute('stroke', '#007bff');
    path.setAttribute('stroke-width', '3');
    path.setAttribute('filter', 'url(#shadowEffect)');
    
    shapeGroup.appendChild(path);
    
    // Kompass-Nadel aktualisieren
    updateCompass();
}

function calculateScale(points) {
    if (points.length === 0) return 20;
    
    const xs = points.map(p => Math.abs(p.x));
    const ys = points.map(p => Math.abs(p.y));
    const maxExtent = Math.max(...xs, ...ys);
    
    return maxExtent > 0 ? Math.min(120, 80 / maxExtent) : 20;
}

function updateCompass() {
    const needle = document.getElementById('compass-needle');
    needle.style.transform = `rotate(${currentTransform.rotation}deg)`;
}

// Transform-Controls
function rotateShape(degrees) {
    currentTransform.rotation = (currentTransform.rotation + degrees) % 360;
    if (currentTransform.rotation < 0) {
        currentTransform.rotation += 360;
    }
    
    drawShape();
    updateTransformDisplay();
    showFeedback(`Gedreht um ${degrees}°`);
}

function mirrorShape(direction) {
    if (direction === 'horizontal') {
        currentTransform.mirrorH = !currentTransform.mirrorH;
        showFeedback(`Horizontal ${currentTransform.mirrorH ? 'gespiegelt' : 'zurückgesetzt'}`);
    } else if (direction === 'vertical') {
        currentTransform.mirrorV = !currentTransform.mirrorV;
        showFeedback(`Vertikal ${currentTransform.mirrorV ? 'gespiegelt' : 'zurückgesetzt'}`);
    }
    
    drawShape();
    updateTransformDisplay();
}

function resetTransform() {
    currentTransform = {
        rotation: 0,
        mirrorH: false,
        mirrorV: false
    };
    
    drawShape();
    updateTransformDisplay();
    showFeedback('Transformationen zurückgesetzt');
}

function toggleFineRotation() {
    fineRotationMode = !fineRotationMode;
    const btn = document.getElementById('btn-fine-rotate');
    
    if (fineRotationMode) {
        btn.classList.add('active');
        btn.innerHTML = '<span style="font-size: 16px;">⚙</span> Aktiv';
        showFeedback('Feinrotation aktiv: Links/Rechts = ±1°');
    } else {
        btn.classList.remove('active');
        btn.innerHTML = '<span style="font-size: 16px;">⚙</span> ±1°';
        showFeedback('Feinrotation deaktiviert');
    }
}

function updateTransformDisplay() {
    const mirrorText = [];
    if (currentTransform.mirrorH) mirrorText.push('Horizontal');
    if (currentTransform.mirrorV) mirrorText.push('Vertikal');
    
    const displayText = `Rotation: ${currentTransform.rotation}° | Spiegelung: ${mirrorText.length > 0 ? mirrorText.join(', ') : 'Keine'}`;
    document.getElementById('transform-display').textContent = displayText;
    
    // Info-Anzeige aktualisieren
    document.getElementById('info-rotation').textContent = currentTransform.rotation + '°';
    document.getElementById('info-mirrored').textContent = mirrorText.length > 0 ? mirrorText.join(', ') : 'Nein';
}

function showFeedback(message) {
    const feedback = document.getElementById('feedback-message');
    feedback.textContent = message;
    feedback.classList.add('show');
    
    setTimeout(() => {
        feedback.classList.remove('show');
    }, 2000);
}

// Info-Anzeige aktualisieren
function updateShapeInfo() {
    const geometry = projectData.geometry;
    if (!geometry) return;
    
    // Shape-Name
    const shapeNames = {
        'kreis': 'Kreis', 'oval': 'Oval', 'halbkreis': 'Halbkreis', 'viertelkreis': 'Viertelkreis', 'langloch': 'Langloch',
        'rechteck': 'Rechteck', 'quadrat': 'Quadrat', 'dreieck': 'Dreieck', 'trapez': 'Trapez', 'parallelogramm': 'Parallelogramm',
        'rhombus': 'Rhombus', 'fuenfeck': 'Fünfeck', 'sechseck': 'Sechseck', 'achteck': 'Achteck',
        'lform': 'L-Form', 'tform': 'T-Form', 'uform': 'U-Form'
    };
    
    const shapeName = shapeNames[geometry.variant] || geometry.variant || 'Unbekannt';
    document.getElementById('current-shape-title').textContent = shapeName;
    
    // Fläche und Umfang
    document.getElementById('info-area').textContent = (geometry.area || 0).toFixed(1) + ' m²';
    document.getElementById('info-perimeter').textContent = (geometry.perimeter || 0).toFixed(1) + ' m';
}

// Speichern und Weiter
function saveAndContinue() {
    // Transform-Daten zur Geometrie hinzufügen
    if (!projectData.geometry) {
        alert('Keine Geometrie-Daten gefunden!');
        return;
    }
    
    // Finale Punkte mit Transformationen generieren
    const finalPoints = applyTransformation(generatedPoints);
    
    projectData.geometry.transform = { ...currentTransform };
    projectData.geometry.points = finalPoints;
    projectData.geometry.originalPoints = [...generatedPoints];
    
    console.log('Speichere finale Geometrie-Daten:', projectData.geometry);
    
    const saved = saveData();
    if (!saved) {
        alert('Fehler beim Speichern!');
        return;
    }
    
    // Weiterleitung zur Berechnung
    window.location.href = 'berechnung.html';
}

// Navigation
function goBack() {
    window.location.href = 'formauswahl.html';
}

// Tastatur-Events
document.addEventListener('keydown', function(e) {
    if (fineRotationMode) {
        if (e.key === 'ArrowLeft') {
            e.preventDefault();
            rotateShape(-1);
        } else if (e.key === 'ArrowRight') {
            e.preventDefault();
            rotateShape(1);
        }
    }
});

// Initialisierung
document.addEventListener('DOMContentLoaded', function() {
    console.log('=== EDITOR GELADEN ===');
    
    // Projektdaten laden
    projectData = loadData();
    
    // Validierung
    if (!projectData.geometry) {
        alert('Keine Geometrie-Daten gefunden. Sie werden zur Formauswahl weitergeleitet.');
        window.location.href = 'formauswahl.html';
        return;
    }
    
    // Punkte generieren
    generatedPoints = generateShapePoints();
    console.log('Generierte Punkte:', generatedPoints);
    
    // Gespeicherte Transformationen laden
    if (projectData.geometry.transform) {
        currentTransform = { ...projectData.geometry.transform };
    }
    
    // Info anzeigen
    updateShapeInfo();
    updateTransformDisplay();
    
    // Shape zeichnen
    drawShape();
    
    // Event Listeners
    document.getElementById('btn-rotate-left').addEventListener('click', () => {
        rotateShape(fineRotationMode ? -1 : -15);
    });
    
    document.getElementById('btn-rotate-right').addEventListener('click', () => {
        rotateShape(fineRotationMode ? 1 : 15);
    });
    
    document.getElementById('btn-fine-rotate').addEventListener('click', toggleFineRotation);
    
    document.getElementById('btn-mirror-h').addEventListener('click', () => {
        mirrorShape('horizontal');
    });
    
    document.getElementById('btn-mirror-v').addEventListener('click', () => {
        mirrorShape('vertical');
    });
    
    document.getElementById('btn-reset').addEventListener('click', resetTransform);
    
    // Navigation
    document.getElementById('btn-back').addEventListener('click', goBack);
    document.getElementById('btn-continue').addEventListener('click', saveAndContinue);
    
    console.log('✅ Editor erfolgreich initialisiert');
});

// Debug-Funktionen
window.debugEditor = () => {
    console.log('=== EDITOR DEBUG ===');
    console.log('projectData:', projectData);
    console.log('currentTransform:', currentTransform);
    console.log('generatedPoints:', generatedPoints);
    console.log('transformedPoints:', applyTransformation(generatedPoints));
};

console.log('✅ editor-simplified.js geladen');
