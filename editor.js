// editor.js – Vollständiger Smart Geometry Editor mit Modulen

import * as Dreieck from './figures/dreieck.js';
import * as Rechteck from './figures/rechteck.js';
import * as Kreis from './figures/kreis.js';
import * as Vieleck from './figures/vieleck.js';
import * as Trapez from './figures/trapez.js';
import * as Rhombus from './figures/rhombus.js';
import * as Langloch from './figures/langloch.js';

// Globale Variablen
let projectData = {};
let currentPoints = [];
let currentModule = null;
let currentShape = '';
let currentVariant = '';
let waterFlowDirection = 'bottom';
let svg, canvas, ctx;

// Konstanten
const CANVAS_WIDTH = 600;
const CANVAS_HEIGHT = 400;
const CANVAS_CENTER_X = 300;
const CANVAS_CENTER_Y = 200;
const SCALE_FACTOR = 10; // 1 Meter = 10 Pixel

document.addEventListener('DOMContentLoaded', () => {
    console.log('Editor wird initialisiert...');
    
    // Projektdaten laden
    loadProjectData();
    
    // Canvas und SVG initialisieren
    initializeCanvas();
    
    // UI initialisieren
    initializeUI();
    
    // Form laden und zeichnen
    loadAndDrawShape();
    
    // Event Listeners einrichten
    setupEventListeners();
    
    console.log('Editor erfolgreich initialisiert');
});

function loadProjectData() {
    const dataString = localStorage.getItem('dachplattenrechner_data') || 
                       sessionStorage.getItem('dachplattenrechner_data');
    
    if (!dataString) {
        console.warn('Keine Projektdaten gefunden - Weiterleitung zu Schritt 1');
        window.location.href = 'profil.html';
        return;
    }

    try {
        projectData = JSON.parse(dataString);
        console.log('Projektdaten geladen:', projectData);
        
        // Validiere notwendige Daten
        if (!projectData.profile || !projectData.roofShape) {
            throw new Error('Unvollständige Projektdaten');
        }
        
    } catch (e) {
        console.error('Fehler beim Laden der Projektdaten:', e);
        alert('Fehler beim Laden der Projektdaten. Bitte starten Sie neu.');
        window.location.href = 'index.html';
    }
}

function initializeCanvas() {
    // SVG Element holen
    svg = document.getElementById('main-svg');
    
    if (!svg) {
        console.error('SVG Element nicht gefunden!');
        return;
    }
    
    console.log('Canvas initialisiert');
}

function initializeUI() {
    // Profil-Info anzeigen
    displayProfileInfo();
    
    // Shape-Name anzeigen
    updateShapeTitle();
}

function displayProfileInfo() {
    const profile = projectData.profile;
    if (!profile) return;
    
    document.getElementById('current-profile-name').textContent = profile.profilname || 'Standard';
    document.getElementById('current-deckbreite').textContent = `${profile.deckbreite || 1000} mm`;
    document.getElementById('current-lieferbreite').textContent = `${profile.lieferbreite || 1050} mm`;
    document.getElementById('current-seitenueberlappung').textContent = `${profile.seitenueberlappung || 50} mm`;
}

function updateShapeTitle() {
    const roofShape = projectData.roofShape;
    if (!roofShape) return;
    
    const shapeNames = {
        'dreieck': 'Dreieck',
        'rechteck': 'Rechteck',
        'quadrat': 'Quadrat',
        'kreis': 'Kreis',
        'oval': 'Oval',
        'halbkreis': 'Halbkreis',
        'viertelkreis': 'Viertelkreis',
        'trapez': 'Trapez',
        'rhombus': 'Rhombus',
        'langloch': 'Langloch',
        'fuenfeck': 'Fünfeck',
        'sechseck': 'Sechseck',
        'achteck': 'Achteck',
        'vieleck': 'Vieleck'
    };
    
    const shapeName = shapeNames[roofShape.variant] || shapeNames[roofShape.baseShape] || 'Unbekannt';
    document.getElementById('current-shape-name').textContent = shapeName;
}

function loadAndDrawShape() {
    const roofShape = projectData.roofShape;
    if (!roofShape) {
        console.error('Keine Dachform-Daten gefunden');
        return;
    }
    
    currentShape = roofShape.baseShape;
    currentVariant = roofShape.variant;
    
    console.log('Lade Form:', currentShape, currentVariant);
    
    // Passenden Modul laden
    switch (currentShape) {
        case 'dreieck':
            currentModule = Dreieck;
            break;
        case 'rechteck':
        case 'quadrat':
            currentModule = Rechteck;
            break;
        case 'kreis':
        case 'halbkreis':
        case 'viertelkreis':
        case 'oval':
        case 'langloch':
            if (currentVariant === 'langloch') {
                currentModule = Langloch;
            } else {
                currentModule = Kreis;
            }
            break;
        case 'trapez':
            currentModule = Trapez;
            break;
        case 'rhombus':
            currentModule = Rhombus;
            break;
        case 'fuenfeck':
        case 'sechseck':
        case 'achteck':
        case 'vieleck':
            currentModule = Vieleck;
            break;
        default:
            console.warn('Unbekannte Form:', currentShape);
            currentModule = Rechteck; // Fallback
    }
    
    // Eingabefelder erstellen
    if (currentModule && currentModule.init) {
        currentModule.init({
            ...roofShape,
            variant: currentVariant
        });
    }
    
    // Standardwerte setzen falls nicht vorhanden
    setDefaultValues();
    
    // Initial zeichnen
    updateShape();
}

function setDefaultValues() {
    // Setze Standardwerte basierend auf der Form
    switch (currentShape) {
        case 'rechteck':
        case 'quadrat':
            if (!document.getElementById('length').value) {
                document.getElementById('length').value = '10';
            }
            if (!document.getElementById('width').value) {
                document.getElementById('width').value = '6';
            }
            break;
            
        case 'kreis':
            if (!document.getElementById('radius').value) {
                document.getElementById('radius').value = '5';
            }
            break;
            
        case 'dreieck':
            if (currentVariant === 'gleichseitig' && !document.getElementById('side').value) {
                document.getElementById('side').value = '8';
            } else if (currentVariant === 'rechtwinklig') {
                if (!document.getElementById('katheteA').value) {
                    document.getElementById('katheteA').value = '6';
                }
                if (!document.getElementById('katheteB').value) {
                    document.getElementById('katheteB').value = '8';
                }
            }
            break;
            
        case 'trapez':
            if (!document.getElementById('baseA').value) {
                document.getElementById('baseA').value = '10';
            }
            if (!document.getElementById('baseB').value) {
                document.getElementById('baseB').value = '6';
            }
            if (!document.getElementById('height').value) {
                document.getElementById('height').value = '5';
            }
            break;
    }
}

function updateShape() {
    if (!svg || !currentModule) return;
    
    // SVG Form-Gruppe leeren
    const shapeGroup = document.getElementById('roof-shape');
    shapeGroup.innerHTML = '';
    
    // Aktuelle Daten sammeln
    const currentData = getCurrentFormData();
    
    // Canvas Context für Module-Zeichnung simulieren
    const canvasCtx = createSVGCanvasContext(shapeGroup);
    
    // Modul-spezifische Zeichnung
    if (currentModule.draw) {
        currentModule.draw(canvasCtx, currentData);
    } else if (currentModule.drawTriangle) {
        // Spezialfall für Dreieck
        currentModule.drawTriangle(canvasCtx, currentData);
    }
    
    // Bemaßung hinzufügen
    updateDimensions(currentData);
    
    // Berechnungen aktualisieren
    updateCalculations(currentData);
    
    // Verlegerichtung bestimmen
    determinePreferredDirection();
    
    console.log('Form aktualisiert:', currentData);
}

function createSVGCanvasContext(svgGroup) {
    // Simuliert Canvas-API für SVG
    return {
        beginPath: () => {
            // Neue Path beginnen
        },
        moveTo: (x, y) => {
            this.currentPath = `M ${x + CANVAS_CENTER_X} ${y + CANVAS_CENTER_Y}`;
        },
        lineTo: (x, y) => {
            this.currentPath += ` L ${x + CANVAS_CENTER_X} ${y + CANVAS_CENTER_Y}`;
        },
        closePath: () => {
            this.currentPath += ' Z';
        },
        rect: (x, y, width, height) => {
            const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
            rect.setAttribute('x', x + CANVAS_CENTER_X);
            rect.setAttribute('y', y + CANVAS_CENTER_Y);
            rect.setAttribute('width', width);
            rect.setAttribute('height', height);
            rect.setAttribute('fill', 'rgba(0, 123, 255, 0.3)');
            rect.setAttribute('stroke', '#007bff');
            rect.setAttribute('stroke-width', '2');
            svgGroup.appendChild(rect);
        },
        arc: (x, y, radius, startAngle, endAngle) => {
            const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            circle.setAttribute('cx', x + CANVAS_CENTER_X);
            circle.setAttribute('cy', y + CANVAS_CENTER_Y);
            circle.setAttribute('r', radius);
            circle.setAttribute('fill', 'rgba(0, 123, 255, 0.3)');
            circle.setAttribute('stroke', '#007bff');
            circle.setAttribute('stroke-width', '2');
            svgGroup.appendChild(circle);
        },
        arcTo: (x1, y1, x2, y2, radius) => {
            // Vereinfachte arcTo Implementation
            this.currentPath += ` L ${x2 + CANVAS_CENTER_X} ${y2 + CANVAS_CENTER_Y}`;
        },
        stroke: () => {
            if (this.currentPath) {
                const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                path.setAttribute('d', this.currentPath);
                path.setAttribute('fill', 'rgba(0, 123, 255, 0.3)');
                path.setAttribute('stroke', '#007bff');
                path.setAttribute('stroke-width', '2');
                svgGroup.appendChild(path);
                this.currentPath = '';
            }
        }
    };
}

function getCurrentFormData() {
    const data = { variant: currentVariant };
    
    // Alle Eingabefelder auslesen
    const inputs = document.querySelectorAll('#geometry-inputs-grid input');
    inputs.forEach(input => {
        if (input.value) {
            const numValue = parseFloat(input.value);
            if (!isNaN(numValue)) {
                data[input.id] = numValue;
            } else {
                data[input.id] = input.value;
            }
        }
    });
    
    return data;
}

function updateDimensions(data) {
    const dimensionsGroup = document.getElementById('dimensions');
    dimensionsGroup.innerHTML = '';
    
    // Einfache Bemaßung basierend auf Form
    switch (currentShape) {
        case 'rechteck':
        case 'quadrat':
            addRectangleDimensions(dimensionsGroup, data);
            break;
        case 'kreis':
            addCircleDimensions(dimensionsGroup, data);
            break;
    }
}

function addRectangleDimensions(group, data) {
    const length = (data.length || 10) * SCALE_FACTOR;
    const width = (data.width || 6) * SCALE_FACTOR;
    
    // Längen-Bemaßung (horizontal)
    const lengthLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    lengthLine.setAttribute('x1', CANVAS_CENTER_X - length/2);
    lengthLine.setAttribute('y1', CANVAS_CENTER_Y + width/2 + 20);
    lengthLine.setAttribute('x2', CANVAS_CENTER_X + length/2);
    lengthLine.setAttribute('y2', CANVAS_CENTER_Y + width/2 + 20);
    lengthLine.setAttribute('class', 'dimension-line');
    group.appendChild(lengthLine);
    
    const lengthText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    lengthText.setAttribute('x', CANVAS_CENTER_X);
    lengthText.setAttribute('y', CANVAS_CENTER_Y + width/2 + 35);
    lengthText.setAttribute('class', 'dimension-text');
    lengthText.textContent = `${data.length || 10} m`;
    group.appendChild(lengthText);
    
    // Breiten-Bemaßung (vertikal)
    const widthLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    widthLine.setAttribute('x1', CANVAS_CENTER_X - length/2 - 20);
    widthLine.setAttribute('y1', CANVAS_CENTER_Y - width/2);
    widthLine.setAttribute('x2', CANVAS_CENTER_X - length/2 - 20);
    widthLine.setAttribute('y2', CANVAS_CENTER_Y + width/2);
    widthLine.setAttribute('class', 'dimension-line');
    group.appendChild(widthLine);
    
    const widthText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    widthText.setAttribute('x', CANVAS_CENTER_X - length/2 - 35);
    widthText.setAttribute('y', CANVAS_CENTER_Y);
    widthText.setAttribute('class', 'dimension-text');
    widthText.setAttribute('transform', `rotate(-90, ${CANVAS_CENTER_X - length/2 - 35}, ${CANVAS_CENTER_Y})`);
    widthText.textContent = `${data.width || 6} m`;
    group.appendChild(widthText);
}

function addCircleDimensions(group, data) {
    const radius = (data.radius || 5) * SCALE_FACTOR;
    
    // Durchmesser-Linie
    const diameterLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    diameterLine.setAttribute('x1', CANVAS_CENTER_X - radius);
    diameterLine.setAttribute('y1', CANVAS_CENTER_Y);
    diameterLine.setAttribute('x2', CANVAS_CENTER_X + radius);
    diameterLine.setAttribute('y2', CANVAS_CENTER_Y);
    diameterLine.setAttribute('class', 'dimension-line');
    group.appendChild(diameterLine);
    
    const diameterText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    diameterText.setAttribute('x', CANVAS_CENTER_X);
    diameterText.setAttribute('y', CANVAS_CENTER_Y - 10);
    diameterText.setAttribute('class', 'dimension-text');
    diameterText.textContent = `⌀ ${(data.radius || 5) * 2} m`;
    group.appendChild(diameterText);
}

function updateCalculations(data) {
    let area = 0;
    let perimeter = 0;
    
    // Berechnungen basierend auf Form
    switch (currentShape) {
        case 'rechteck':
        case 'quadrat':
            const length = data.length || 10;
            const width = data.width || 6;
            area = length * width;
            perimeter = 2 * (length + width);
            break;
            
        case 'kreis':
            const radius = data.radius || 5;
            area = Math.PI * radius * radius;
            perimeter = 2 * Math.PI * radius;
            break;
            
        case 'dreieck':
            if (currentVariant === 'gleichseitig') {
                const side = data.side || 8;
                area = (Math.sqrt(3) / 4) * side * side;
                perimeter = 3 * side;
            } else if (currentVariant === 'rechtwinklig') {
                const a = data.katheteA || 6;
                const b = data.katheteB || 8;
                area = 0.5 * a * b;
                perimeter = a + b + Math.sqrt(a*a + b*b);
            }
            break;
            
        case 'trapez':
            const baseA = data.baseA || 10;
            const baseB = data.baseB || 6;
            const height = data.height || 5;
            area = 0.5 * (baseA + baseB) * height;
            // Vereinfachte Umfang-Berechnung
            perimeter = baseA + baseB + 2 * Math.sqrt(height*height + ((baseA-baseB)/2)*((baseA-baseB)/2));
            break;
    }
    
    // Anzeige aktualisieren
    document.getElementById('calc-area').textContent = `${area.toFixed(2)} m²`;
    document.getElementById('calc-perimeter').textContent = `${perimeter.toFixed(2)} m`;
}

function determinePreferredDirection() {
    const data = getCurrentFormData();
    let direction = 'längs';
    let reason = 'Standard-Verlegerichtung';
    
    // Intelligente Richtungsbestimmung
    if (currentShape === 'rechteck' || currentShape === 'quadrat') {
        const length = data.length || 10;
        const width = data.width || 6;
        
        if (length > width * 1.5) {
            direction = 'quer';
            reason = 'Lange schmale Form → Querverlegung optimiert Materialverbrauch';
        } else if (width > length * 1.5) {
            direction = 'längs';
            reason = 'Hohe schmale Form → Längsverlegung optimiert Materialverbrauch';
        } else {
            direction = 'längs';
            reason = 'Ausgewogene Proportionen → Längsverlegung bevorzugt';
        }
    }
    
    // Anzeige aktualisieren
    document.getElementById('current-direction').textContent = direction;
    document.getElementById('direction-reason').textContent = reason;
}

function setupEventListeners() {
    // Navigation
    document.getElementById('btn-back').addEventListener('click', () => {
        saveCurrentData();
        window.location.href = 'dachform.html';
    });
    
    document.getElementById('btn-continue').addEventListener('click', () => {
        saveCurrentData();
        window.location.href = 'berechnung.html';
    });
    
    // Tools
    document.getElementById('btn-mirror-horizontal').addEventListener('click', mirrorHorizontal);
    document.getElementById('btn-mirror-vertical').addEventListener('click', mirrorVertical);
    document.getElementById('btn-rotate-left').addEventListener('click', () => rotateShape(-45));
    document.getElementById('btn-rotate-right').addEventListener('click', () => rotateShape(45));
    document.getElementById('btn-reset').addEventListener('click', resetShape);
    
    // Eingabefeld-Updates (delegierte Events)
    document.addEventListener('input', (e) => {
        if (e.target.closest('#geometry-inputs-grid')) {
            updateShape();
        }
    });
    
    document.addEventListener('change', (e) => {
        if (e.target.closest('#geometry-inputs-grid')) {
            updateShape();
        }
    });
}

function mirrorHorizontal() {
    console.log('Horizontal spiegeln');
    // TODO: Implementierung für komplexere Formen
    updateShape();
}

function mirrorVertical() {
    console.log('Vertikal spiegeln');
    // TODO: Implementierung für komplexere Formen
    updateShape();
}

function rotateShape(degrees) {
    console.log(`Rotiere um ${degrees}°`);
    // TODO: Implementierung für komplexere Formen
    updateShape();
}

function resetShape() {
    console.log('Form zurücksetzen');
    setDefaultValues();
    updateShape();
}

function saveCurrentData() {
    // Aktuelle Eingaben in projectData speichern
    const currentData = getCurrentFormData();
    
    if (!projectData.roofShape) {
        projectData.roofShape = {};
    }
    
    // Form-spezifische Daten speichern
    Object.assign(projectData.roofShape, currentData);
    
    // In Storage speichern
    try {
        localStorage.setItem('dachplattenrechner_data', JSON.stringify(projectData));
        console.log('Daten gespeichert:', projectData);
    } catch (e) {
        sessionStorage.setItem('dachplattenrechner_data', JSON.stringify(projectData));
    }
}

// Utility-Funktionen
function convertToSVGCoordinates(x, y) {
    return {
        x: x * SCALE_FACTOR + CANVAS_CENTER_X,
        y: y * SCALE_FACTOR + CANVAS_CENTER_Y
    };
}

function getShapePoints(data) {
    // Generiert Punkte basierend auf der aktuellen Form
    const points = [];
    
    switch (currentShape) {
        case 'rechteck':
        case 'quadrat':
            const length = data.length || 10;
            const width = data.width || 6;
            points.push(
                { x: -length/2, y: -width/2 },
                { x: length/2, y: -width/2 },
                { x: length/2, y: width/2 },
                { x: -length/2, y: width/2 }
            );
            break;
    }
    
    return points.map(p => convertToSVGCoordinates(p.x, p.y));
}

// Export für globalen Zugriff
window.updateShape = updateShape;
window.determinePreferredDirection = determinePreferredDirection;
window.currentPoints = currentPoints;
