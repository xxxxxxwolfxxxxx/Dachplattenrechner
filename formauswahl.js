// bemasung.js - Nur Bemaßung der in Schritt 2 gewählten Form

let projectData = {};
let currentDimensions = {};
let selectedVariant = null;

// Dimension-Labels und Standardwerte
const dimensionConfig = {
    radius: { label: 'Radius', unit: 'm', default: 4, min: 0.5, max: 50 },
    radiusX: { label: 'Radius X (Länge)', unit: 'm', default: 5, min: 0.5, max: 50 },
    radiusY: { label: 'Radius Y (Breite)', unit: 'm', default: 3, min: 0.5, max: 50 },
    length: { label: 'Länge', unit: 'm', default: 8, min: 1, max: 100 },
    width: { label: 'Breite', unit: 'm', default: 5, min: 1, max: 100 },
    side: { label: 'Seitenlänge', unit: 'm', default: 5, min: 1, max: 50 },
    sideA: { label: 'Basis unten', unit: 'm', default: 8, min: 1, max: 100 },
    sideB: { label: 'Basis oben', unit: 'm', default: 6, min: 1, max: 100 },
    sideC: { label: 'Seite C', unit: 'm', default: 6, min: 1, max: 100 },
    height: { label: 'Höhe', unit: 'm', default: 4, min: 1, max: 50 },
    offset: { label: 'Versatz', unit: 'm', default: 1, min: -10, max: 10 },
    angle: { label: 'Winkel', unit: '°', default: 60, min: 10, max: 170 },
    katheteA: { label: 'Kathete A', unit: 'm', default: 4, min: 1, max: 50 },
    katheteB: { label: 'Kathete B', unit: 'm', default: 5, min: 1, max: 50 },
    lengthTotal: { label: 'Gesamtlänge', unit: 'm', default: 10, min: 2, max: 100 },
    widthTotal: { label: 'Gesamtbreite', unit: 'm', default: 8, min: 2, max: 100 },
    cutLength: { label: 'Ausschnitt Länge', unit: 'm', default: 4, min: 1, max: 50 },
    cutWidth: { label: 'Ausschnitt Breite', unit: 'm', default: 4, min: 1, max: 50 },
    topWidth: { label: 'Breite oben', unit: 'm', default: 8, min: 1, max: 100 },
    stemWidth: { label: 'Breite Stiel', unit: 'm', default: 4, min: 1, max: 50 },
    topHeight: { label: 'Höhe oben', unit: 'm', default: 3, min: 1, max: 50 },
    stemHeight: { label: 'Höhe Stiel', unit: 'm', default: 5, min: 1, max: 50 },
    outerWidth: { label: 'Außenbreite', unit: 'm', default: 10, min: 2, max: 100 },
    innerWidth: { label: 'Innenbreite', unit: 'm', default: 4, min: 1, max: 50 },
    thickness: { label: 'Wandstärke', unit: 'm', default: 3, min: 0.5, max: 20 }
};

// Form-Informationen
const shapeInfo = {
    kreis: { name: 'Kreis', description: 'Perfekte Rundform', dimensions: ['radius'] },
    oval: { name: 'Oval/Ellipse', description: 'Längliche Rundform', dimensions: ['radiusX', 'radiusY'] },
    halbkreis: { name: 'Halbkreis', description: 'Halbe Kreisform', dimensions: ['radius'] },
    viertelkreis: { name: 'Viertelkreis', description: 'Viertel einer Kreisform', dimensions: ['radius'] },
    langloch: { name: 'Langloch', description: 'Rechteck mit runden Enden', dimensions: ['length', 'width'] },
    rechteck: { name: 'Rechteck', description: 'Klassische rechteckige Form', dimensions: ['length', 'width'] },
    quadrat: { name: 'Quadrat', description: 'Gleichseitiges Rechteck', dimensions: ['side'] },
    gleichseitig: { name: 'Gleichseitiges Dreieck', description: 'Dreieck mit gleichen Seiten', dimensions: ['side'] },
    rechtwinklig: { name: 'Rechtwinkliges Dreieck', description: 'Dreieck mit rechtem Winkel', dimensions: ['katheteA', 'katheteB'] },
    ungleichschenklig: { name: 'Ungleichschenkliges Dreieck', description: 'Dreieck mit unterschiedlichen Seiten', dimensions: ['sideA', 'sideB', 'sideC'] },
    trapez: { name: 'Trapez', description: 'Viereck mit parallelen Seiten', dimensions: ['sideA', 'sideB', 'height', 'offset'] },
    parallelogramm: { name: 'Parallelogramm', description: 'Schiefes Viereck', dimensions: ['length', 'width', 'angle'] },
    rhombus: { name: 'Rhombus', description: 'Rautenform', dimensions: ['side', 'angle'] },
    fuenfeck: { name: 'Fünfeck', description: 'Regelmäßiges Fünfeck', dimensions: ['radius'] },
    sechseck: { name: 'Sechseck', description: 'Regelmäßiges Sechseck', dimensions: ['radius'] },
    achteck: { name: 'Achteck', description: 'Regelmäßiges Achteck', dimensions: ['radius'] },
    lform: { name: 'L-Form', description: 'L-förmige Grundform', dimensions: ['lengthTotal', 'widthTotal', 'cutLength', 'cutWidth'] },
    tform: { name: 'T-Form', description: 'T-förmige Grundform', dimensions: ['topWidth', 'stemWidth', 'topHeight', 'stemHeight'] },
    uform: { name: 'U-Form', description: 'U-förmige Grundform', dimensions: ['outerWidth', 'innerWidth', 'height', 'thickness'] }
};

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

// Form-Info anzeigen
function displayShapeInfo() {
    console.log('=== LADE FORM-INFO ===');
    console.log('projectData:', projectData);
    
    const roofShape = projectData.roofShape;
    if (!roofShape || !roofShape.variant) {
        console.error('❌ Keine Dachform-Daten gefunden!');
        console.log('roofShape:', roofShape);
        alert('Keine Dachform gewählt. Sie werden zu Schritt 2 weitergeleitet.');
        window.location.href = 'dachform.html';
        return false;
    }
    
    selectedVariant = roofShape.variant;
    console.log('✅ Gewählte Variante:', selectedVariant);
    
    const info = shapeInfo[selectedVariant];
    
    if (info) {
        document.getElementById('shape-title').textContent = info.name;
        document.getElementById('shape-description').textContent = info.description;
        console.log('✅ Form-Info angezeigt:', info.name);
    } else {
        console.error('❌ Form-Info nicht gefunden für:', selectedVariant);
        // Fallback
        document.getElementById('shape-title').textContent = selectedVariant;
        document.getElementById('shape-description').textContent = 'Benutzerdefinierte Form';
    }
    
    return true;
}

// Dimensions-Inputs erstellen
function createDimensionInputs() {
    console.log('=== ERSTELLE DIMENSION-INPUTS ===');
    
    const dimensionsGrid = document.getElementById('dimensions-grid');
    if (!dimensionsGrid) {
        console.error('❌ dimensions-grid nicht gefunden!');
        return;
    }
    
    dimensionsGrid.innerHTML = '';
    
    if (!selectedVariant) {
        console.error('❌ Keine Variante ausgewählt');
        return;
    }
    
    const info = shapeInfo[selectedVariant];
    if (!info) {
        console.error('❌ Form-Info nicht gefunden für:', selectedVariant);
        return;
    }
    
    const dimensions = info.dimensions;
    console.log('📐 Erstelle Inputs für Dimensionen:', dimensions);
    
    // Gespeicherte Werte laden
    const savedGeometry = projectData.geometry || {};
    
    dimensions.forEach(dim => {
        const config = dimensionConfig[dim];
        if (!config) {
            console.warn('⚠️ Dimension-Config nicht gefunden für:', dim);
            return;
        }
        
        const savedValue = savedGeometry[dim] || config.default;
        currentDimensions[dim] = savedValue;
        
        const inputContainer = document.createElement('div');
        inputContainer.className = 'dimension-input';
        
        inputContainer.innerHTML = `
            <label class="dimension-label">${config.label}</label>
            <div style="display: flex; align-items: center;">
                <input type="number" 
                       class="dimension-value" 
                       data-dimension="${dim}"
                       value="${savedValue}"
                       min="${config.min}"
                       max="${config.max}"
                       step="0.1">
                <span class="dimension-unit">${config.unit}</span>
            </div>
        `;
        
        dimensionsGrid.appendChild(inputContainer);
        
        // Event listener für Änderungen
        const input = inputContainer.querySelector('.dimension-value');
        input.addEventListener('input', (e) => {
            const value = parseFloat(e.target.value);
            if (!isNaN(value)) {
                currentDimensions[dim] = value;
                updatePreview();
                updateCalculation();
            }
        });
    });
    
    console.log('✅ Dimension-Inputs erstellt:', dimensions.length, 'Inputs');
}

// Form-Vorschau aktualisieren
function updatePreview() {
    const shapeGroup = document.getElementById('shape-group');
    if (!shapeGroup) return;
    
    shapeGroup.innerHTML = '';
    
    const svg = getShapeSVG();
    shapeGroup.innerHTML = svg;
}

// SVG für Form generieren
function getShapeSVG() {
    const dims = currentDimensions;
    
    switch (selectedVariant) {
        case 'kreis':
            const radius = (dims.radius || 4) * 15; // Skalierung für Vorschau
            return `<circle cx="0" cy="0" r="${radius}" fill="rgba(0,123,255,0.3)" stroke="#007bff" stroke-width="3"/>`;
            
        case 'oval':
            const rx = (dims.radiusX || 5) * 15;
            const ry = (dims.radiusY || 3) * 15;
            return `<ellipse cx="0" cy="0" rx="${rx}" ry="${ry}" fill="rgba(0,123,255,0.3)" stroke="#007bff" stroke-width="3"/>`;
            
        case 'rechteck':
            const length = (dims.length || 8) * 10;
            const width = (dims.width || 5) * 10;
            return `<rect x="${-length/2}" y="${-width/2}" width="${length}" height="${width}" fill="rgba(0,123,255,0.3)" stroke="#007bff" stroke-width="3"/>`;
            
        case 'quadrat':
            const side = (dims.side || 5) * 12;
            return `<rect x="${-side/2}" y="${-side/2}" width="${side}" height="${side}" fill="rgba(0,123,255,0.3)" stroke="#007bff" stroke-width="3"/>`;
            
        case 'trapez':
            const sideA = (dims.sideA || 8) * 8;
            const sideB = (dims.sideB || 6) * 8;
            const height = (dims.height || 4) * 8;
            const offset = (dims.offset || 1) * 8;
            const points = `${-sideA/2},${height/2} ${sideA/2},${height/2} ${sideB/2 + offset},${-height/2} ${-sideB/2 + offset},${-height/2}`;
            return `<polygon points="${points}" fill="rgba(0,123,255,0.3)" stroke="#007bff" stroke-width="3"/>`;
            
        case 'rhombus':
            const rhombusSide = (dims.side || 5) * 10;
            const angle = (dims.angle || 60) * Math.PI / 180;
            const halfDiag1 = rhombusSide * Math.sin(angle / 2);
            const halfDiag2 = rhombusSide * Math.cos(angle / 2);
            const rhombusPoints = `0,${-halfDiag1} ${halfDiag2},0 0,${halfDiag1} ${-halfDiag2},0`;
            return `<polygon points="${rhombusPoints}" fill="rgba(0,123,255,0.3)" stroke="#007bff" stroke-width="3"/>`;
            
        default:
            // Fallback für unbekannte Formen
            console.log('⚠️ Unbekannte Form, verwende Rechteck:', selectedVariant);
            return `<rect x="-60" y="-40" width="120" height="80" fill="rgba(0,123,255,0.3)" stroke="#007bff" stroke-width="3"/>`;
    }
}

// Berechnung aktualisieren
function updateCalculation() {
    if (!selectedVariant) return;
    
    const area = calculateArea();
    const perimeter = calculatePerimeter();
    
    document.getElementById('calc-area').textContent = area.toFixed(2) + ' m²';
    document.getElementById('calc-perimeter').textContent = perimeter.toFixed(2) + ' m';
    
    // Continue-Button aktivieren wenn Werte vorhanden
    const continueBtn = document.getElementById('btn-continue');
    if (continueBtn) {
        continueBtn.disabled = area <= 0;
    }
}

// Fläche berechnen
function calculateArea() {
    const dims = currentDimensions;
    
    switch (selectedVariant) {
        case 'kreis':
            return Math.PI * Math.pow(dims.radius || 4, 2);
        case 'oval':
            return Math.PI * (dims.radiusX || 5) * (dims.radiusY || 3);
        case 'rechteck':
            return (dims.length || 8) * (dims.width || 5);
        case 'quadrat':
            return Math.pow(dims.side || 5, 2);
        case 'trapez':
            const sideA = dims.sideA || 8;
            const sideB = dims.sideB || 6;
            const height = dims.height || 4;
            return ((sideA + sideB) / 2) * height;
        case 'rhombus':
            const side = dims.side || 5;
            const angle = (dims.angle || 60) * Math.PI / 180;
            return Math.pow(side, 2) * Math.sin(angle);
        default:
            return 40; // Fallback
    }
}

// Umfang berechnen
function calculatePerimeter() {
    const dims = currentDimensions;
    
    switch (selectedVariant) {
        case 'kreis':
            return 2 * Math.PI * (dims.radius || 4);
        case 'oval':
            const a = dims.radiusX || 5;
            const b = dims.radiusY || 3;
            return Math.PI * (3 * (a + b) - Math.sqrt((3 * a + b) * (a + 3 * b)));
        case 'rechteck':
            return 2 * ((dims.length || 8) * (dims.width || 5));
        case 'quadrat':
            return 4 * (dims.side || 5);
        case 'rhombus':
            return 4 * (dims.side || 5);
        default:
            return 24; // Fallback
    }
}

// Speichern und Weiter
function saveAndContinue() {
    if (!selectedVariant) {
        alert('Keine Form gefunden!');
        return;
    }
    
    // Geometry-Daten zur projectData hinzufügen
    projectData.geometry = {
        variant: selectedVariant,
        shapeType: selectedVariant,
        dimensions: currentDimensions,
        dachNeigung: parseFloat(document.getElementById('dach-neigung').value) || 15,
        ausrichtung: document.getElementById('ausrichtung').value || 'laengs',
        area: calculateArea(),
        perimeter: calculatePerimeter(),
        timestamp: Date.now()
    };
    
    console.log('💾 Speichere Geometry-Daten:', projectData.geometry);
    
    const saved = saveData();
    if (!saved) {
        alert('Fehler beim Speichern!');
        return;
    }
    
    // Weiterleitung zum Editor
    window.location.href = 'Editor.html';
}

// Navigation
function goBack() {
    window.location.href = 'dachform.html';
}

// Initialisierung
document.addEventListener('DOMContentLoaded', function() {
    console.log('=== BEMASUNG SEITE GELADEN ===');
    
    // Projektdaten laden
    projectData = loadData();
    console.log('📁 Geladene projectData:', projectData);
    
    // Validierung: Profil vorhanden?
    if (!projectData.profile) {
        console.error('❌ Keine Profil-Daten gefunden!');
        alert('Keine Profil-Daten gefunden. Sie werden zu Schritt 1 weitergeleitet.');
        window.location.href = 'profil.html';
        return;
    }
    
    // Form-Info anzeigen und validieren
    const shapeLoaded = displayShapeInfo();
    if (!shapeLoaded) {
        return; // Fehler bereits behandelt
    }
    
    // Dimensions-Inputs erstellen
    createDimensionInputs();
    
    // Navigation Event Listeners
    document.getElementById('btn-back').addEventListener('click', goBack);
    document.getElementById('btn-continue').addEventListener('click', saveAndContinue);
    
    // Gespeicherte Dimensionen wiederherstellen
    if (projectData.geometry && projectData.geometry.dimensions) {
        currentDimensions = { ...projectData.geometry.dimensions };
        Object.entries(projectData.geometry.dimensions).forEach(([dim, value]) => {
            const input = document.querySelector(`[data-dimension="${dim}"]`);
            if (input) {
                input.value = value;
            }
        });
        
        // Zusätzliche Einstellungen
        if (projectData.geometry.dachNeigung) {
            document.getElementById('dach-neigung').value = projectData.geometry.dachNeigung;
        }
        if (projectData.geometry.ausrichtung) {
            document.getElementById('ausrichtung').value = projectData.geometry.ausrichtung;
        }
    }
    
    // Initiale Vorschau und Berechnung
    updatePreview();
    updateCalculation();
    
    console.log('✅ Bemaßung erfolgreich initialisiert');
});

// Debug-Funktionen
window.debugBemasung = () => {
    console.log('=== BEMASUNG DEBUG ===');
    console.log('projectData:', projectData);
    console.log('selectedVariant:', selectedVariant);
    console.log('currentDimensions:', currentDimensions);
    console.log('localStorage:', localStorage.getItem('dachplattenrechner_data'));
};

console.log('✅ bemasung.js geladen');

let projectData = {};
let currentDimensions = {};
let selectedVariant = null;

// Dimension-Labels und Standardwerte
const dimensionConfig = {
    radius: { label: 'Radius', unit: 'm', default: 4, min: 0.5, max: 50 },
    radiusX: { label: 'Radius X (Länge)', unit: 'm', default: 5, min: 0.5, max: 50 },
    radiusY: { label: 'Radius Y (Breite)', unit: 'm', default: 3, min: 0.5, max: 50 },
    length: { label: 'Länge', unit: 'm', default: 8, min: 1, max: 100 },
    width: { label: 'Breite', unit: 'm', default: 5, min: 1, max: 100 },
    side: { label: 'Seitenlänge', unit: 'm', default: 5, min: 1, max: 50 },
    sideA: { label: 'Basis unten', unit: 'm', default: 8, min: 1, max: 100 },
    sideB: { label: 'Basis oben', unit: 'm', default: 6, min: 1, max: 100 },
    sideC: { label: 'Seite C', unit: 'm', default: 6, min: 1, max: 100 },
    height: { label: 'Höhe', unit: 'm', default: 4, min: 1, max: 50 },
    offset: { label: 'Versatz', unit: 'm', default: 1, min: -10, max: 10 },
    angle: { label: 'Winkel', unit: '°', default: 60, min: 10, max: 170 },
    katheteA: { label: 'Kathete A', unit: 'm', default: 4, min: 1, max: 50 },
    katheteB: { label: 'Kathete B', unit: 'm', default: 5, min: 1, max: 50 },
    lengthTotal: { label: 'Gesamtlänge', unit: 'm', default: 10, min: 2, max: 100 },
    widthTotal: { label: 'Gesamtbreite', unit: 'm', default: 8, min: 2, max: 100 },
    cutLength: { label: 'Ausschnitt Länge', unit: 'm', default: 4, min: 1, max: 50 },
    cutWidth: { label: 'Ausschnitt Breite', unit: 'm', default: 4, min: 1, max: 50 },
    topWidth: { label: 'Breite oben', unit: 'm', default: 8, min: 1, max: 100 },
    stemWidth: { label: 'Breite Stiel', unit: 'm', default: 4, min: 1, max: 50 },
    topHeight: { label: 'Höhe oben', unit: 'm', default: 3, min: 1, max: 50 },
    stemHeight: { label: 'Höhe Stiel', unit: 'm', default: 5, min: 1, max: 50 },
    outerWidth: { label: 'Außenbreite', unit: 'm', default: 10, min: 2, max: 100 },
    innerWidth: { label: 'Innenbreite', unit: 'm', default: 4, min: 1, max: 50 },
    thickness: { label: 'Wandstärke', unit: 'm', default: 3, min: 0.5, max: 20 }
};

// Form-Informationen
const shapeInfo = {
    kreis: { name: 'Kreis', description: 'Perfekte Rundform', dimensions: ['radius'] },
    oval: { name: 'Oval/Ellipse', description: 'Längliche Rundform', dimensions: ['radiusX', 'radiusY'] },
    halbkreis: { name: 'Halbkreis', description: 'Halbe Kreisform', dimensions: ['radius'] },
    viertelkreis: { name: 'Viertelkreis', description: 'Viertel einer Kreisform', dimensions: ['radius'] },
    langloch: { name: 'Langloch', description: 'Rechteck mit runden Enden', dimensions: ['length', 'width'] },
    rechteck: { name: 'Rechteck', description: 'Klassische rechteckige Form', dimensions: ['length', 'width'] },
    quadrat: { name: 'Quadrat', description: 'Gleichseitiges Rechteck', dimensions: ['side'] },
    gleichseitig: { name: 'Gleichseitiges Dreieck', description: 'Dreieck mit gleichen Seiten', dimensions: ['side'] },
    rechtwinklig: { name: 'Rechtwinkliges Dreieck', description: 'Dreieck mit rechtem Winkel', dimensions: ['katheteA', 'katheteB'] },
    ungleichschenklig: { name: 'Ungleichschenkliges Dreieck', description: 'Dreieck mit unterschiedlichen Seiten', dimensions: ['sideA', 'sideB', 'sideC'] },
    trapez: { name: 'Trapez', description: 'Viereck mit parallelen Seiten', dimensions: ['sideA', 'sideB', 'height', 'offset'] },
    parallelogramm: { name: 'Parallelogramm', description: 'Schiefes Viereck', dimensions: ['length', 'width', 'angle'] },
    rhombus: { name: 'Rhombus', description: 'Rautenform', dimensions: ['side', 'angle'] },
    fuenfeck: { name: 'Fünfeck', description: 'Regelmäßiges Fünfeck', dimensions: ['radius'] },
    sechseck: { name: 'Sechseck', description: 'Regelmäßiges Sechseck', dimensions: ['radius'] },
    achteck: { name: 'Achteck', description: 'Regelmäßiges Achteck', dimensions: ['radius'] },
    lform: { name: 'L-Form', description: 'L-förmige Grundform', dimensions: ['lengthTotal', 'widthTotal', 'cutLength', 'cutWidth'] },
    tform: { name: 'T-Form', description: 'T-förmige Grundform', dimensions: ['topWidth', 'stemWidth', 'topHeight', 'stemHeight'] },
    uform: { name: 'U-Form', description: 'U-förmige Grundform', dimensions: ['outerWidth', 'innerWidth', 'height', 'thickness'] }
};

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

// Profil-Info anzeigen
function displayProfileInfo() {
    const profile = projectData.profile;
    if (profile) {
        document.getElementById('current-profile-name').textContent = profile.profilname || 'Standard';
        document.getElementById('current-deckbreite').textContent = (profile.deckbreite || 1000) + ' mm';
        document.getElementById('current-lieferbreite').textContent = (profile.lieferbreite || 1050) + ' mm';
        document.getElementById('current-seitenueberlappung').textContent = (profile.seitenueberlappung || 50) + ' mm';
    }
}

// Form-Info anzeigen
function displayShapeInfo() {
    const roofShape = projectData.roofShape;
    if (!roofShape || !roofShape.variant) {
        console.error('Keine Dachform-Daten gefunden');
        return;
    }
    
    selectedVariant = roofShape.variant;
    const info = shapeInfo[selectedVariant];
    
    if (info) {
        document.getElementById('shape-title').textContent = info.name;
        document.getElementById('shape-description').textContent = info.description;
    }
    
    console.log('Form angezeigt:', selectedVariant, info);
}

// Dimensions-Inputs erstellen
function createDimensionInputs() {
    const dimensionsGrid = document.getElementById('dimensions-grid');
    dimensionsGrid.innerHTML = '';
    
    if (!selectedVariant) {
        console.error('Keine Variante ausgewählt');
        return;
    }
    
    const info = shapeInfo[selectedVariant];
    if (!info) {
        console.error('Form-Info nicht gefunden für:', selectedVariant);
        return;
    }
    
    const dimensions = info.dimensions;
    
    // Gespeicherte Werte laden
    const savedGeometry = projectData.geometry || {};
    
    dimensions.forEach(dim => {
        const config = dimensionConfig[dim];
        if (!config) return;
        
        const savedValue = savedGeometry[dim] || config.default;
        currentDimensions[dim] = savedValue;
        
        const inputContainer = document.createElement('div');
        inputContainer.className = 'dimension-input';
        
        inputContainer.innerHTML = `
            <label class="dimension-label">${config.label}</label>
            <div style="display: flex; align-items: center;">
                <input type="number" 
                       class="dimension-value" 
                       data-dimension="${dim}"
                       value="${savedValue}"
                       min="${config.min}"
                       max="${config.max}"
                       step="0.1">
                <span class="dimension-unit">${config.unit}</span>
            </div>
        `;
        
        dimensionsGrid.appendChild(inputContainer);
        
        // Event listener für Änderungen
        const input = inputContainer.querySelector('.dimension-value');
        input.addEventListener('input', (e) => {
            const value = parseFloat(e.target.value);
            if (!isNaN(value)) {
                currentDimensions[dim] = value;
                updatePreview();
                updateCalculation();
            }
        });
    });
    
    console.log('Dimension-Inputs erstellt für:', dimensions);
}

// Form-Vorschau aktualisieren
function updatePreview() {
    const shapeGroup = document.getElementById('shape-group');
    shapeGroup.innerHTML = '';
    
    const svg = getShapeSVG();
    shapeGroup.innerHTML = svg;
}

// SVG für Form generieren
function getShapeSVG() {
    const dims = currentDimensions;
    
    switch (selectedVariant) {
        case 'kreis':
            const radius = (dims.radius || 4) * 15; // Skalierung für Vorschau
            return `<circle cx="0" cy="0" r="${radius}" fill="rgba(0,123,255,0.3)" stroke="#007bff" stroke-width="3"/>`;
            
        case 'oval':
            const rx = (dims.radiusX || 5) * 15;
            const ry = (dims.radiusY || 3) * 15;
            return `<ellipse cx="0" cy="0" rx="${rx}" ry="${ry}" fill="rgba(0,123,255,0.3)" stroke="#007bff" stroke-width="3"/>`;
            
        case 'rechteck':
            const length = (dims.length || 8) * 10;
            const width = (dims.width || 5) * 10;
            return `<rect x="${-length/2}" y="${-width/2}" width="${length}" height="${width}" fill="rgba(0,123,255,0.3)" stroke="#007bff" stroke-width="3"/>`;
            
        case 'quadrat':
            const side = (dims.side || 5) * 12;
            return `<rect x="${-side/2}" y="${-side/2}" width="${side}" height="${side}" fill="rgba(0,123,255,0.3)" stroke="#007bff" stroke-width="3"/>`;
            
        case 'trapez':
            const sideA = (dims.sideA || 8) * 8;
            const sideB = (dims.sideB || 6) * 8;
            const height = (dims.height || 4) * 8;
            const offset = (dims.offset || 1) * 8;
            const points = `${-sideA/2},${height/2} ${sideA/2},${height/2} ${sideB/2 + offset},${-height/2} ${-sideB/2 + offset},${-height/2}`;
            return `<polygon points="${points}" fill="rgba(0,123,255,0.3)" stroke="#007bff" stroke-width="3"/>`;
            
        case 'rhombus':
            const rhombusSide = (dims.side || 5) * 10;
            const angle = (dims.angle || 60) * Math.PI / 180;
            const halfDiag1 = rhombusSide * Math.sin(angle / 2);
            const halfDiag2 = rhombusSide * Math.cos(angle / 2);
            const rhombusPoints = `0,${-halfDiag1} ${halfDiag2},0 0,${halfDiag1} ${-halfDiag2},0`;
            return `<polygon points="${rhombusPoints}" fill="rgba(0,123,255,0.3)" stroke="#007bff" stroke-width="3"/>`;
            
        default:
            // Fallback für unbekannte Formen
            return `<rect x="-60" y="-40" width="120" height="80" fill="rgba(0,123,255,0.3)" stroke="#007bff" stroke-width="3"/>`;
    }
}

// Berechnung aktualisieren
function updateCalculation() {
    if (!selectedVariant) return;
    
    const area = calculateArea();
    const perimeter = calculatePerimeter();
    
    document.getElementById('calc-area').textContent = area.toFixed(2) + ' m²';
    document.getElementById('calc-perimeter').textContent = perimeter.toFixed(2) + ' m';
    
    // Continue-Button aktivieren wenn Werte vorhanden
    document.getElementById('btn-continue').disabled = area <= 0;
}

// Fläche berechnen
function calculateArea() {
    const dims = currentDimensions;
    
    switch (selectedVariant) {
        case 'kreis':
            return Math.PI * Math.pow(dims.radius || 4, 2);
        case 'oval':
            return Math.PI * (dims.radiusX || 5) * (dims.radiusY || 3);
        case 'rechteck':
            return (dims.length || 8) * (dims.width || 5);
        case 'quadrat':
            return Math.pow(dims.side || 5, 2);
        case 'trapez':
            const sideA = dims.sideA || 8;
            const sideB = dims.sideB || 6;
            const height = dims.height || 4;
            return ((sideA + sideB) / 2) * height;
        case 'rhombus':
            const side = dims.side || 5;
            const angle = (dims.angle || 60) * Math.PI / 180;
            return Math.pow(side, 2) * Math.sin(angle);
        default:
            return 40; // Fallback
    }
}

// Umfang berechnen
function calculatePerimeter() {
    const dims = currentDimensions;
    
    switch (selectedVariant) {
        case 'kreis':
            return 2 * Math.PI * (dims.radius || 4);
        case 'oval':
            const a = dims.radiusX || 5;
            const b = dims.radiusY || 3;
            return Math.PI * (3 * (a + b) - Math.sqrt((3 * a + b) * (a + 3 * b)));
        case 'rechteck':
            return 2 * ((dims.length || 8) + (dims.width || 5));
        case 'quadrat':
            return 4 * (dims.side || 5);
        case 'rhombus':
            return 4 * (dims.side || 5);
        default:
            return 24; // Fallback
    }
}

// Speichern und Weiter
function saveAndContinue() {
    if (!selectedVariant) {
        alert('Keine Form gefunden!');
        return;
    }
    
    // Geometry-Daten zur projectData hinzufügen
    projectData.geometry = {
        variant: selectedVariant,
        shapeType: selectedVariant,
        dimensions: currentDimensions,
        dachNeigung: parseFloat(document.getElementById('dach-neigung').value) || 15,
        ausrichtung: document.getElementById('ausrichtung').value || 'laengs',
        area: calculateArea(),
        perimeter: calculatePerimeter(),
        timestamp: Date.now()
    };
    
    console.log('Speichere Geometry-Daten:', projectData.geometry);
    
    const saved = saveData();
    if (!saved) {
        alert('Fehler beim Speichern!');
        return;
    }
    
    // Weiterleitung zum Editor
    window.location.href = 'Editor.html';
}

// Navigation
function goBack() {
    window.location.href = 'dachform.html';
}

// Initialisierung
document.addEventListener('DOMContentLoaded', function() {
    console.log('=== BEMASUNG GELADEN ===');
    
    // Projektdaten laden
    projectData = loadData();
    
    // Validierung: Profil und Dachform vorhanden?
    if (!projectData.profile) {
        alert('Keine Profil-Daten gefunden. Sie werden zu Schritt 1 weitergeleitet.');
        window.location.href = 'profil.html';
        return;
    }
    
    if (!projectData.roofShape || !projectData.roofShape.variant) {
        alert('Keine Dachform gewählt. Sie werden zu Schritt 2 weitergeleitet.');
        window.location.href = 'dachform.html';
        return;
    }
    
    // Profil-Info anzeigen
    displayProfileInfo();
    
    // Form-Info anzeigen
    displayShapeInfo();
    
    // Dimensions-Inputs erstellen
    createDimensionInputs();
    
    // Navigation Event Listeners
    document.getElementById('btn-back').addEventListener('click', goBack);
    document.getElementById('btn-continue').addEventListener('click', saveAndContinue);
    
    // Gespeicherte Dimensionen wiederherstellen
    if (projectData.geometry && projectData.geometry.dimensions) {
        currentDimensions = { ...projectData.geometry.dimensions };
        Object.entries(projectData.geometry.dimensions).forEach(([dim, value]) => {
            const input = document.querySelector(`[data-dimension="${dim}"]`);
            if (input) {
                input.value = value;
            }
        });
        
        // Zusätzliche Einstellungen
        if (projectData.geometry.dachNeigung) {
            document.getElementById('dach-neigung').value = projectData.geometry.dachNeigung;
        }
        if (projectData.geometry.ausrichtung) {
            document.getElementById('ausrichtung').value = projectData.geometry.ausrichtung;
        }
    }
    
    // Initiale Vorschau und Berechnung
    updatePreview();
    updateCalculation();
    
    console.log('✅ Bemaßung initialisiert');
});

// Debug-Funktionen
window.debugBemasung = () => {
    console.log('=== BEMASUNG DEBUG ===');
    console.log('projectData:', projectData);
    console.log('selectedVariant:', selectedVariant);
    console.log('currentDimensions:', currentDimensions);
};

console.log('✅ bemaßung.js geladen');
