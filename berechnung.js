// MINIMALE TEST-VERSION für berechnung.js
// Diese Version hat weniger Features, dafür garantiert keine Syntax-Fehler

let projectData = {};
let calculationResults = null;
let canvas = null;
let ctx = null;

// Einfache Storage-Funktionen
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

// Canvas initialisieren
function initCanvas() {
    canvas = document.getElementById('roof-canvas');
    if (canvas) {
        ctx = canvas.getContext('2d');
        canvas.width = 600;
        canvas.height = 400;
    }
}

// Einfache Flächen-Berechnung
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

// Shape-Type bestimmen
function determineShapeTypeFromData() {
    const roofShape = projectData.roofShape;
    
    if (roofShape && roofShape.variant) {
        return roofShape.variant;
    }
    if (roofShape && roofShape.baseShape) {
        return roofShape.baseShape;
    }
    
    return 'rechteck';
}

// Einfache Punkt-Generierung
function generateCorrectRoofPoints() {
    const roofShape = projectData.roofShape || {};
    const shapeType = determineShapeTypeFromData();
    
    // Verwende gespeicherte Punkte falls vorhanden
    if (roofShape.points && roofShape.points.length > 0) {
        return roofShape.points;
    }
    
    // Einfache Fallback-Formen
    switch (shapeType) {
        case 'parallelogramm':
            const length = roofShape.length || 8;
            const width = roofShape.width || 5;
            const angle = (roofShape.angle || 30) * Math.PI / 180;
            const skew = width * Math.cos(angle);
            return [
                { x: -length/2, y: -width/2 },
                { x: length/2, y: -width/2 },
                { x: length/2 + skew, y: width/2 },
                { x: -length/2 + skew, y: width/2 }
            ];
            
        case 'rhombus':
            const side = roofShape.side || 5;
            const rhombusAngle = (roofShape.angle || 60) * Math.PI / 180;
            const halfDiag1 = side * Math.sin(rhombusAngle / 2);
            const halfDiag2 = side * Math.cos(rhombusAngle / 2);
            return [
                { x: 0, y: -halfDiag1 },
                { x: halfDiag2, y: 0 },
                { x: 0, y: halfDiag1 },
                { x: -halfDiag2, y: 0 }
            ];
            
        default:
            // Standard Rechteck
            const rectLength = roofShape.length || 8;
            const rectWidth = roofShape.width || 5;
            return [
                { x: -rectLength/2, y: -rectWidth/2 },
                { x: rectLength/2, y: -rectWidth/2 },
                { x: rectLength/2, y: rectWidth/2 },
                { x: -rectLength/2, y: rectWidth/2 }
            ];
    }
}

// Geometrie analysieren
function analyzeRoofGeometry() {
    const points = generateCorrectRoofPoints();
    
    if (!points || points.length < 3) {
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
    
    return {
        minX, maxX, minY, maxY,
        width, height, area,
        points: points,
        shapeType: shapeType
    };
}

// Projekt-Info laden
function loadProjectInfo() {
    const profile = projectData.profile;
    const analysis = analyzeRoofGeometry();

    if (!profile) {
        alert('Profil-Daten fehlen!');
        return false;
    }

    // Sichere Element-Updates
    const updateElement = (id, value) => {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = value;
        }
    };

    updateElement('info-profile-name', profile.profilname || 'Standard');
    updateElement('info-deckbreite', (profile.deckbreite || 1000) + ' mm');
    updateElement('info-lieferbreite', (profile.lieferbreite || 1050) + ' mm');
    updateElement('info-seitenueberlappung', (profile.seitenueberlappung || 50) + ' mm');
    updateElement('info-ueberstand', (profile.ueberstand || 50) + ' mm');
    
    const shapeNames = {
        'parallelogramm': 'Parallelogramm',
        'rhombus': 'Rhombus',
        'rechteck': 'Rechteck'
    };
    
    const shapeName = shapeNames[analysis.shapeType] || analysis.shapeType;
    updateElement('info-roof-type', shapeName);
    updateElement('info-dimensions', analysis.width.toFixed(1) + ' × ' + analysis.height.toFixed(1) + ' m');
    updateElement('info-area', analysis.area.toFixed(2) + ' m²');
    updateElement('info-neigung', '15°');

    return true;
}

// Einfache Berechnung
function calculateLengths() {
    const profile = projectData.profile;
    if (!profile) {
        alert('Profil-Daten fehlen!');
        return;
    }

    const analysis = analyzeRoofGeometry();
    const deckbreite = profile.deckbreite || 1000;
    const bahnenAnzahl = Math.ceil(analysis.width * 1000 / deckbreite);
    const bahnenLaenge = (analysis.height * 1000) + (profile.ueberstand || 50);
    
    // Einfache Optimierung
    const verfuegbareLaengen = profile.lagerlaengen || [2000, 3000, 4000, 5000, 6000];
    const bestLength = verfuegbareLaengen.find(l => l >= bahnenLaenge) || verfuegbareLaengen[verfuegbareLaengen.length - 1];
    const waste = Math.max(0, bestLength - bahnenLaenge);
    const totalLength = bestLength * bahnenAnzahl;
    const totalWaste = waste * bahnenAnzahl;
    const verschnittProzent = totalLength > 0 ? (totalWaste / totalLength) * 100 : 0;

    calculationResults = {
        bahnenAnzahl: bahnenAnzahl,
        bahnenLaenge: bahnenLaenge,
        bestellliste: [{ length: bestLength, quantity: bahnenAnzahl, usage: 'Standard' }],
        totalLength: totalLength / 1000,
        totalWaste: totalWaste / 1000,
        verschnitt: verschnittProzent,
        shapeType: analysis.shapeType
    };

    displayResults(calculationResults);
    drawSimpleVisualization(analysis.points);
    
    document.getElementById('continue-btn').disabled = false;
}

// Ergebnisse anzeigen
function displayResults(results) {
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
            row.innerHTML = '<td>' + item.length + '</td><td>' + item.quantity + '</td><td>' + 
                          (item.length * item.quantity / 1000).toFixed(1) + '</td><td>' + item.usage + '</td>';
        });
    }

    const resultsSection = document.getElementById('results-section');
    if (resultsSection) {
        resultsSection.style.display = 'block';
    }
}

// Einfache Visualisierung
function drawSimpleVisualization(points) {
    if (!ctx || !points) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#f8f9fa';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const xs = points.map(p => p.x);
    const ys = points.map(p => p.y);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);
    const roofWidth = maxX - minX;
    const roofHeight = maxY - minY;

    const scale = Math.min(400 / roofWidth, 300 / roofHeight) * 0.8;
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;

    ctx.beginPath();
    points.forEach((point, index) => {
        const x = centerX + (point.x - (minX + maxX) / 2) * scale;
        const y = centerY - (point.y - (minY + maxY) / 2) * scale;
        if (index === 0) {
            ctx.moveTo(x, y);
        } else {
            ctx.lineTo(x, y);
        }
    });
    ctx.closePath();
    ctx.fillStyle = 'rgba(0, 123, 255, 0.3)';
    ctx.fill();
    ctx.strokeStyle = '#007bff';
    ctx.lineWidth = 3;
    ctx.stroke();
}

// Navigation
function saveAndContinue() {
    if (!calculationResults) {
        alert('Bitte führen Sie zuerst eine Berechnung durch!');
        return;
    }
    projectData.calculations = calculationResults;
    saveData();
    window.location.href = 'anrissplan.html';
}

function goBack() {
    window.location.href = 'Editor.html';
}

// Initialisierung
function init() {
    projectData = loadData();
    initCanvas();
    loadProjectInfo();
    
    const analysis = analyzeRoofGeometry();
    if (analysis.points) {
        drawSimpleVisualization(analysis.points);
    }
}

// Event Listeners
document.addEventListener('DOMContentLoaded', init);
