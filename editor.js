// editor.js - Korrigierte Version ohne Syntax-Fehler

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
    const roofShape = projectData.roofShape;
    if (!roofShape || !roofShape.variant) {
        console.error('Keine roofShape-Daten gefunden');
        return generateRectanglePoints({ length: 8, width: 5 }); // Fallback
    }

    const variant = roofShape.variant;
    console.log('Generiere Punkte für:', variant);

    try {
        switch (variant) {
            case 'kreis':
                return generateCirclePoints({ radius: 4 });
            case 'oval':
                return generateOvalPoints({ radiusX: 5, radiusY: 3 });
            case 'rechteck':
                return generateRectanglePoints({ length: 8, width: 5 });
            case 'quadrat':
                return generateSquarePoints({ side: 5 });
            case 'dreieck':
                return generateTrianglePoints({ side: 5 });
            case 'rechtwinklig':
                return generateRightTrianglePoints({ katheteA: 4, katheteB: 5 });
            case 'trapez':
                return generateTrapezPoints({ bottomBase: 8, topBase: 6, height: 4 });
            case 'lform':
                return generateLShapePoints({ totalLength: 10, totalWidth: 8, cutoutLength: 4, cutoutWidth: 4 });
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

function generateTrapezPoints(dims) {
    const bottomBase = dims.bottomBase || 8;
    const topBase = dims.topBase || 6;
    const height = dims.height || 4;
    
    return [
        { x: -bottomBase/2, y: -height/2 },
        { x: bottomBase/2, y: -height/2 },
        { x: topBase/2, y: height/2 },
        { x: -topBase/2, y: height/2 }
    ];
}

function generateTrianglePoints(dims) {
    const side = dims.side || 5;
    const height = side * Math.sqrt(3) / 2;
    
    return [
        { x: 0, y: height * 2/3 },
        { x: -side/2, y: -height/3 },
        { x: side/2, y: -height/3 }
    ];
}

function generateRightTrianglePoints(dims) {
    const katheteA = dims.katheteA || 4;
    const katheteB = dims.katheteB || 5;
    
    return [
        { x: 0, y: 0 },
        { x: katheteA, y: 0 },
        { x: 0, y: katheteB }
    ];
}

function generateLShapePoints(dims) {
    const totalLength = dims.totalLength || 10;
    const totalWidth = dims.totalWidth || 8;
    const cutoutLength = dims.cutoutLength || 4;
    const cutoutWidth = dims.cutoutWidth || 4;
    
    return [
        { x: -totalLength/2, y: -totalWidth/2 },
        { x: totalLength/2, y: -totalWidth/2 },
        { x: totalLength/2, y: -totalWidth/2 + cutoutWidth },
        { x: -totalLength/2 + cutoutLength, y: -totalWidth/2 + cutoutWidth },
        { x: -totalLength/2 + cutoutLength, y: totalWidth/2 },
        { x: -totalLength/2, y: totalWidth/2 }
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

// Hilfsfunktion: Prüft ob eine Linie senkrecht/waagerecht ist
function isVerticalOrHorizontal(p1, p2, tolerance = 0.1) {
    const dx = Math.abs(p2.x - p1.x);
    const dy = Math.abs(p2.y - p1.y);
    
    const isVertical = dx < tolerance;
    const isHorizontal = dy < tolerance;
    
    return { isVertical, isHorizontal };
}

// Hilfsfunktion: Berechnet den Winkel einer Linie
function getLineAngle(p1, p2) {
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    let angle = Math.atan2(dy, dx) * 180 / Math.PI;
    
    // Normalisiere auf 0-360°
    if (angle < 0) angle += 360;
    
    return angle;
}

// SVG-Darstellung mit Orientierungs-Hinweisen
function drawShape() {
    const shapeGroup = document.getElementById('shape-group');
    if (!shapeGroup) {
        console.error('shape-group Element nicht gefunden');
        return;
    }
    
    const transformedPoints = applyTransformation(generatedPoints);
    
    // Shape löschen
    shapeGroup.innerHTML = '';
    
    if (transformedPoints.length === 0) {
        console.warn('Keine Punkte zum Zeichnen');
        return;
    }
    
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
    
    // Orientierungs-Hinweise hinzufügen
    drawOrientationIndicators(transformedPoints, scale);
    
    // Legende für Wasserlaufrichtung hinzufügen
    drawWaterFlowLegend();
}
}

// Orientierungs-Hinweise zeichnen
function drawOrientationIndicators(points, scale) {
    const shapeGroup = document.getElementById('shape-group');
    if (!shapeGroup) return;
    
    // Für jede Kante der Form
    for (let i = 0; i < points.length; i++) {
        const p1 = points[i];
        const p2 = points[(i + 1) % points.length];
        
        const x1 = p1.x * scale;
        const y1 = -p1.y * scale;
        const x2 = p2.x * scale;
        const y2 = -p2.y * scale;
        
        // Prüfe Orientierung
        const orientation = isVerticalOrHorizontal(p1, p2, 0.05);
        
        // Mittelpunkt der Kante
        const midX = (x1 + x2) / 2;
        const midY = (y1 + y2) / 2;
        
        // Kantenlänge
        const length = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
        
        // Nur bei Kanten > 15px anzeigen
        if (length > 15) {
            if (orientation.isVertical) {
                // Senkrechte Kante - Blaues "S" für Senkrecht
                const indicator = document.createElementNS('http://www.w3.org/2000/svg', 'g');
                indicator.innerHTML = `
                    <circle cx="${midX + 25}" cy="${midY}" r="12" fill="#007bff" fill-opacity="0.9" stroke="#ffffff" stroke-width="2"/>
                    <text x="${midX + 25}" y="${midY + 5}" text-anchor="middle" font-size="14" font-weight="bold" fill="white">S</text>
                `;
                shapeGroup.appendChild(indicator);
                
            } else if (orientation.isHorizontal) {
                // Waagerechte Kante - Oranges "W" für Wasserlaufrichtung
                const indicator = document.createElementNS('http://www.w3.org/2000/svg', 'g');
                indicator.innerHTML = `
                    <circle cx="${midX}" cy="${midY - 25}" r="12" fill="#ff6b35" fill-opacity="0.9" stroke="#ffffff" stroke-width="2"/>
                    <text x="${midX}" y="${midY - 20}" text-anchor="middle" font-size="14" font-weight="bold" fill="white">W</text>
                `;
                shapeGroup.appendChild(indicator);
            }
        }
    }
}

function calculateScale(points) {
    if (points.length === 0) return 50;
    
    const xs = points.map(p => Math.abs(p.x));
    const ys = points.map(p => Math.abs(p.y));
    const maxExtent = Math.max(...xs, ...ys);
    
    // DEUTLICH VERGRÖSSERTE SKALIERUNG für bessere Sichtbarkeit
    return maxExtent > 0 ? Math.min(280, 200 / maxExtent) : 50;
}

// Wasserlauf-Legende zeichnen
function drawWaterFlowLegend() {
    const svg = document.getElementById('visualization-svg');
    if (!svg) return;
    
    // Entferne alte Legende
    const oldLegend = svg.querySelector('#water-flow-legend');
    if (oldLegend) {
        oldLegend.remove();
    }
    
    // Neue Legende erstellen
    const legend = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    legend.setAttribute('id', 'water-flow-legend');
    legend.innerHTML = `
        <!-- Hintergrund -->
        <rect x="10" y="10" width="180" height="80" rx="8" fill="rgba(255,255,255,0.95)" stroke="#ddd" stroke-width="1"/>
        
        <!-- Titel -->
        <text x="20" y="30" font-size="14" font-weight="bold" fill="#333">Wasserlaufrichtung:</text>
        
        <!-- W Symbol und Erklärung -->
        <circle cx="30" cy="50" r="12" fill="#ff6b35" fill-opacity="0.9" stroke="#ffffff" stroke-width="2"/>
        <text x="30" y="55" text-anchor="middle" font-size="14" font-weight="bold" fill="white">W</text>
        <text x="50" y="55" font-size="12" fill="#333">= Waagerecht (Wasserlauf)</text>
        
        <!-- S Symbol und Erklärung -->
        <circle cx="30" cy="75" r="12" fill="#007bff" fill-opacity="0.9" stroke="#ffffff" stroke-width="2"/>
        <text x="30" y="80" text-anchor="middle" font-size="14" font-weight="bold" fill="white">S</text>
        <text x="50" y="80" font-size="12" fill="#333">= Senkrecht (quer zum Wasserlauf)</text>
    `;
    
    svg.appendChild(legend);
}

function updateCompass() {
    // Kompass entfernt - nicht mehr benötigt für Wasserlaufrichtung
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
    
    if (btn) {
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
}

function updateTransformDisplay() {
    const mirrorText = [];
    if (currentTransform.mirrorH) mirrorText.push('Horizontal');
    if (currentTransform.mirrorV) mirrorText.push('Vertikal');
    
    const displayText = `Rotation: ${currentTransform.rotation}° | Spiegelung: ${mirrorText.length > 0 ? mirrorText.join(', ') : 'Keine'}`;
    const displayElement = document.getElementById('transform-display');
    if (displayElement) {
        displayElement.textContent = displayText;
    }
    
    // Info-Anzeige aktualisieren
    const rotationElement = document.getElementById('info-rotation');
    const mirroredElement = document.getElementById('info-mirrored');
    
    if (rotationElement) rotationElement.textContent = currentTransform.rotation + '°';
    if (mirroredElement) mirroredElement.textContent = mirrorText.length > 0 ? mirrorText.join(', ') : 'Nein';
}

function showFeedback(message) {
    const feedback = document.getElementById('feedback-message');
    if (feedback) {
        feedback.textContent = message;
        feedback.classList.add('show');
        
        setTimeout(() => {
            feedback.classList.remove('show');
        }, 2000);
    }
}

// Info-Anzeige aktualisieren
function updateShapeInfo() {
    const roofShape = projectData.roofShape;
    if (!roofShape) return;
    
    // Shape-Name
    const shapeNames = {
        'kreis': 'Kreis', 'oval': 'Oval', 'rechteck': 'Rechteck', 'quadrat': 'Quadrat', 
        'dreieck': 'Gleichseitiges Dreieck', 'rechtwinklig': 'Rechtwinkliges Dreieck', 
        'trapez': 'Trapez', 'lform': 'L-Form'
    };
    
    const shapeName = shapeNames[roofShape.variant] || roofShape.variant || 'Unbekannt';
    const titleElement = document.getElementById('current-shape-title');
    if (titleElement) {
        titleElement.textContent = shapeName;
    }
    
    // Vereinfachte Flächen- und Umfangsberechnung
    if (generatedPoints.length > 2) {
        const area = Math.abs(generatedPoints.reduce((sum, point, i) => {
            const nextPoint = generatedPoints[(i + 1) % generatedPoints.length];
            return sum + (point.x * nextPoint.y - nextPoint.x * point.y);
        }, 0)) / 2;
        
        const perimeter = generatedPoints.reduce((sum, point, i) => {
            const nextPoint = generatedPoints[(i + 1) % generatedPoints.length];
            const dx = nextPoint.x - point.x;
            const dy = nextPoint.y - point.y;
            return sum + Math.sqrt(dx * dx + dy * dy);
        }, 0);
        
        const areaElement = document.getElementById('info-area');
        const perimeterElement = document.getElementById('info-perimeter');
        
        if (areaElement) areaElement.textContent = area.toFixed(1) + ' m²';
        if (perimeterElement) perimeterElement.textContent = perimeter.toFixed(1) + ' m';
    }
}

// Speichern und Weiter
function saveAndContinue() {
    // Transform-Daten zur roofShape hinzufügen
    if (!projectData.roofShape) {
        alert('Keine Dachform-Daten gefunden!');
        return;
    }
    
    // Finale Punkte mit Transformationen generieren
    const finalPoints = applyTransformation(generatedPoints);
    
    projectData.roofShape.transform = { ...currentTransform };
    projectData.roofShape.points = finalPoints;
    projectData.roofShape.originalPoints = [...generatedPoints];
    
    console.log('Speichere finale roofShape-Daten:', projectData.roofShape);
    
    const saved = saveData();
    if (!saved) {
        alert('Fehler beim Speichern!');
        return;
    }
    
    // Navigation zur Bemaßung
    window.location.href = 'formauswahl.html';
}

// Navigation
function goBack() {
    window.location.href = 'dachform.html';
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
    
    // Demo-Daten falls keine vorhanden
    if (!projectData.roofShape) {
        console.log('Keine roofShape-Daten, erstelle Demo-Daten');
        projectData = {
            profile: { kategorie: 'trapezprofil', profilKey: 'TP20' },
            roofShape: { variant: 'rechteck', baseShape: 'viereck' }
        };
    }
    
    // Punkte generieren
    generatedPoints = generateShapePoints();
    console.log('Generierte Punkte:', generatedPoints);
    
    // Gespeicherte Transformationen laden
    if (projectData.roofShape.transform) {
        currentTransform = { ...projectData.roofShape.transform };
    }
    
    // Info anzeigen
    updateShapeInfo();
    updateTransformDisplay();
    
    // Shape zeichnen
    drawShape();
    
    // Event Listeners
    const btnRotateLeft = document.getElementById('btn-rotate-left');
    const btnRotateRight = document.getElementById('btn-rotate-right');
    const btnFineRotate = document.getElementById('btn-fine-rotate');
    const btnMirrorH = document.getElementById('btn-mirror-h');
    const btnMirrorV = document.getElementById('btn-mirror-v');
    const btnReset = document.getElementById('btn-reset');
    const btnBack = document.getElementById('btn-back');
    const btnContinue = document.getElementById('btn-continue');
    
    if (btnRotateLeft) {
        btnRotateLeft.addEventListener('click', () => {
            rotateShape(fineRotationMode ? -1 : -15);
        });
    }
    
    if (btnRotateRight) {
        btnRotateRight.addEventListener('click', () => {
            rotateShape(fineRotationMode ? 1 : 15);
        });
    }
    
    if (btnFineRotate) {
        btnFineRotate.addEventListener('click', toggleFineRotation);
    }
    
    if (btnMirrorH) {
        btnMirrorH.addEventListener('click', () => {
            mirrorShape('horizontal');
        });
    }
    
    if (btnMirrorV) {
        btnMirrorV.addEventListener('click', () => {
            mirrorShape('vertical');
        });
    }
    
    if (btnReset) {
        btnReset.addEventListener('click', resetTransform);
    }
    
    // Navigation
    if (btnBack) {
        btnBack.addEventListener('click', goBack);
    }
    
    if (btnContinue) {
        btnContinue.addEventListener('click', saveAndContinue);
    }
    
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

console.log('✅ editor.js geladen - Korrigierte Version ohne Syntax-Fehler');
