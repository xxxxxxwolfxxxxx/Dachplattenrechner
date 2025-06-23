// Korrigierte editor.js - Dachform wird richtig geladen

let projectData = {};
let currentShape = '';
let currentVariant = '';
let svg;
let isUpdating = false;

// Transformation state
let currentRotation = 0;

// Konstanten
const CANVAS_CENTER_X = 300;
const CANVAS_CENTER_Y = 200;
const MIN_SCALE = 20;
const MAX_SCALE = 120;
const CANVAS_PADDING = 60;

// Shape-Cache
let shapeCache = {
    lastShape: '',
    lastVariant: '',
    lastResult: ''
};

// Initialisierung
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(function() {
        try {
            console.log('🚀 Starte Editor-Initialisierung...');
            loadProjectData();
            initializeCanvas();
            initializeUI();
            loadAndDrawShape();
            setupEventListeners();
            console.log('✅ Editor erfolgreich initialisiert');
        } catch (error) {
            console.error('❌ Editor-Initialisierung fehlgeschlagen:', error);
            // Fallback: Lade Standard-Form
            loadDefaultShape();
        }
    }, 100);
});

function loadProjectData() {
    console.log('=== LADE PROJEKTDATEN ===');
    
    try {
        const dataString = localStorage.getItem('dachplattenrechner_data') || 
                           sessionStorage.getItem('dachplattenrechner_data');
        
        if (!dataString) {
            console.log('⚠️ Keine gespeicherten Daten gefunden, verwende Standardwerte');
            projectData = createDefaultProjectData();
            return;
        }

        projectData = JSON.parse(dataString);
        console.log('📖 Projektdaten aus Storage geladen:', projectData);
        
        // Validierung und Bereinigung
        if (!projectData.profile) {
            console.log('⚠️ Keine Profil-Daten, setze Standard');
            projectData.profile = createDefaultProfile();
        }
        
        if (!projectData.roofShape) {
            console.log('⚠️ Keine RoofShape-Daten, setze Standard');
            projectData.roofShape = createDefaultRoofShape();
        }
        
        console.log('✅ Projektdaten validiert und bereinigt');
        
    } catch (e) {
        console.error('❌ Fehler beim Laden der Projektdaten:', e);
        projectData = createDefaultProjectData();
    }
}

function createDefaultProjectData() {
    return {
        profile: createDefaultProfile(),
        roofShape: createDefaultRoofShape()
    };
}

function createDefaultProfile() {
    return { 
        profilname: 'Standard Profil', 
        deckbreite: 1000, 
        lieferbreite: 1050, 
        seitenueberlappung: 50 
    };
}

function createDefaultRoofShape() {
    return { 
        baseShape: 'viereck', 
        variant: 'rechteck',
        length: 8,
        width: 5,
        rotation: 0
    };
}

function loadDefaultShape() {
    console.log('🔄 Lade Standard-Form als Fallback');
    currentShape = 'viereck';
    currentVariant = 'rechteck';
    currentRotation = 0;
    
    try {
        createInputFields();
        updateShape();
    } catch (error) {
        console.error('❌ Fehler beim Laden der Standard-Form:', error);
    }
}

function initializeCanvas() {
    console.log('=== INITIALISIERE CANVAS ===');
    
    svg = document.getElementById('main-svg');
    
    if (!svg) {
        console.log('⚠️ SVG nicht gefunden, erstelle Fallback');
        createFallbackCanvas();
    } else {
        console.log('✅ SVG gefunden');
    }
}

function createFallbackCanvas() {
    const container = document.querySelector('.canvas-container') || document.querySelector('main');
    if (!container) {
        console.error('❌ Kein Container für Canvas gefunden');
        return;
    }
    
    const wrapper = document.createElement('div');
    wrapper.className = 'canvas-wrapper';
    wrapper.style.cssText = 'border: 2px solid #e9ecef; border-radius: 8px; background: white; width: 600px; height: 400px; margin: 20px auto; position: relative; user-select: none;';
    
    svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.id = 'main-svg';
    svg.setAttribute('width', '600');
    svg.setAttribute('height', '400');
    svg.setAttribute('viewBox', '0 0 600 400');
    svg.style.cursor = 'default';
    
    svg.innerHTML = `
        <defs>
            <pattern id="grid" width="25" height="25" patternUnits="userSpaceOnUse">
                <path d="M 25 0 L 0 0 0 25" fill="none" stroke="#e0e0e0" stroke-width="1"/>
            </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
        <line x1="300" y1="0" x2="300" y2="400" stroke="#c0c0c0" stroke-width="2"/>
        <line x1="0" y1="200" x2="600" y2="200" stroke="#c0c0c0" stroke-width="2"/>
        <g id="roof-shape"></g>
        <g id="corner-handles"></g>
        <g id="labels"></g>
    `;
    
    wrapper.appendChild(svg);
    container.appendChild(wrapper);
    
    console.log('✅ Fallback-Canvas erstellt');
}

function initializeUI() {
    console.log('=== INITIALISIERE UI ===');
    
    try {
        displayProfileInfo();
        updateShapeTitle();
        createRotationDisplay();
    } catch (error) {
        console.error('❌ UI-Initialisierung Fehler:', error);
    }
}

function displayProfileInfo() {
    const profile = projectData.profile;
    if (!profile) {
        console.log('⚠️ Keine Profil-Daten vorhanden');
        return;
    }
    
    const elements = {
        'current-profile-name': profile.profilname || 'Standard',
        'current-deckbreite': (profile.deckbreite || 1000) + ' mm',
        'current-lieferbreite': (profile.lieferbreite || 1050) + ' mm',
        'current-seitenueberlappung': (profile.seitenueberlappung || 50) + ' mm'
    };
    
    for (const id in elements) {
        const element = document.getElementById(id);
        if (element) { 
            element.textContent = elements[id];
            console.log(`✅ ${id}: ${elements[id]}`);
        } else {
            console.warn(`⚠️ Element ${id} nicht gefunden`);
        }
    }
}

function updateShapeTitle() {
    console.log('=== UPDATE SHAPE TITLE ===');
    
    const roofShape = projectData.roofShape;
    console.log('RoofShape Daten:', roofShape);
    
    if (!roofShape) {
        console.log('⚠️ Keine RoofShape-Daten, verwende Standard');
        const element = document.getElementById('current-shape-name');
        if (element) element.textContent = 'Rechteck';
        return;
    }
    
    const shapeNames = {
        'kreis': 'Kreis', 'oval': 'Oval', 'halbkreis': 'Halbkreis', 'viertelkreis': 'Viertelkreis', 'langloch': 'Langloch',
        'dreieck': 'Dreieck', 'gleichseitig': 'Gleichseitiges Dreieck', 'rechtwinklig': 'Rechtwinkliges Dreieck', 'ungleichschenklig': 'Ungleichschenkliges Dreieck',
        'viereck': 'Viereck', 'rechteck': 'Rechteck', 'quadrat': 'Quadrat', 'parallelogramm': 'Parallelogramm', 'trapez': 'Trapez', 'rhombus': 'Rhombus',
        'vieleck': 'Vieleck', 'fuenfeck': 'Fünfeck', 'sechseck': 'Sechseck', 'achteck': 'Achteck', 'lform': 'L-Form', 'tform': 'T-Form', 'uform': 'U-Form'
    };
    
    let shapeName = 'Unbekannt';
    if (roofShape.variant && shapeNames[roofShape.variant]) {
        shapeName = shapeNames[roofShape.variant];
        console.log(`✅ Shape-Name aus variant: ${roofShape.variant} -> ${shapeName}`);
    } else if (roofShape.baseShape && shapeNames[roofShape.baseShape]) {
        shapeName = shapeNames[roofShape.baseShape];
        console.log(`✅ Shape-Name aus baseShape: ${roofShape.baseShape} -> ${shapeName}`);
    }
    
    const element = document.getElementById('current-shape-name');
    if (element) { 
        element.textContent = shapeName;
        console.log(`✅ Shape-Titel gesetzt auf: ${shapeName}`);
    } else {
        console.warn('⚠️ current-shape-name Element nicht gefunden');
    }
}

function loadAndDrawShape() {
    console.log('=== LADE UND ZEICHNE SHAPE ===');
    
    const roofShape = projectData.roofShape;
    console.log('RoofShape beim Laden:', roofShape);
    
    if (!roofShape) {
        console.log('⚠️ Keine RoofShape, verwende Standard-Werte');
        currentShape = 'viereck';
        currentVariant = 'rechteck';
        currentRotation = 0;
    } else {
        // WICHTIG: Korrekte Zuweisung der Shape-Daten
        currentShape = roofShape.baseShape || 'viereck';
        currentVariant = roofShape.variant || 'rechteck';
        currentRotation = roofShape.rotation || 0;
        
        console.log(`✅ Geladene Werte: Shape=${currentShape}, Variant=${currentVariant}, Rotation=${currentRotation}`);
    }
    
    try {
        createInputFields();
        updateShape();
        console.log('✅ Shape erfolgreich geladen und gezeichnet');
    } catch (error) {
        console.error('❌ Fehler beim Laden/Zeichnen:', error);
        // Fallback
        loadDefaultShape();
    }
}

function determineActualShape() {
    console.log('=== DETERMINE ACTUAL SHAPE ===');
    console.log(`Input: currentShape=${currentShape}, currentVariant=${currentVariant}`);
    
    if (shapeCache.lastShape === currentShape && shapeCache.lastVariant === currentVariant) {
        console.log(`✅ Cache-Hit: ${shapeCache.lastResult}`);
        return shapeCache.lastResult;
    }
    
    let result = 'rechteck';
    
    if (currentVariant) {
        switch (currentVariant) {
            case 'trapez': result = 'trapez'; break;
            case 'quadrat': result = 'quadrat'; break;
            case 'parallelogramm': result = 'parallelogramm'; break;
            case 'rhombus': result = 'rhombus'; break;
            case 'rechteck': result = 'rechteck'; break;
            case 'kreis': result = 'kreis'; break;
            case 'oval': result = 'oval'; break;
            case 'halbkreis': result = 'halbkreis'; break;
            case 'viertelkreis': result = 'viertelkreis'; break;
            case 'langloch': result = 'langloch'; break;
            case 'gleichseitig':
            case 'rechtwinklig':
            case 'ungleichschenklig':
                result = 'dreieck'; break;
            case 'fuenfeck': result = 'fuenfeck'; break;
            case 'sechseck': result = 'sechseck'; break;
            case 'achteck': result = 'achteck'; break;
            case 'lform': result = 'lform'; break;
            case 'tform': result = 'tform'; break;
            case 'uform': result = 'uform'; break;
            default:
                if (currentShape) {
                    switch (currentShape) {
                        case 'kreis': result = 'kreis'; break;
                        case 'dreieck': result = 'dreieck'; break;
                        case 'vieleck': result = 'fuenfeck'; break;
                        case 'viereck': result = 'rechteck'; break;
                        default: result = 'rechteck'; break;
                    }
                }
                break;
        }
    } else if (currentShape) {
        switch (currentShape) {
            case 'kreis': result = 'kreis'; break;
            case 'dreieck': result = 'dreieck'; break;
            case 'vieleck': result = 'fuenfeck'; break;
            case 'viereck': result = 'rechteck'; break;
            default: result = 'rechteck'; break;
        }
    }
    
    shapeCache.lastShape = currentShape;
    shapeCache.lastVariant = currentVariant;
    shapeCache.lastResult = result;
    
    console.log(`✅ Bestimmte Shape: ${result}`);
    return result;
}

function determineActualVariant() {
    const variant = currentVariant || 'rechteck';
    console.log(`✅ Bestimmte Variant: ${variant}`);
    return variant;
}

function createInputFields() {
    console.log('=== ERSTELLE INPUT FELDER ===');
    
    const container = document.getElementById('geometry-inputs-grid');
    if (!container) {
        console.error('❌ geometry-inputs-grid Container nicht gefunden');
        return;
    }
    
    container.innerHTML = '';
    const finalShape = determineActualShape();
    const variant = determineActualVariant();
    const savedData = projectData.roofShape || {};
    
    console.log(`✅ Erstelle Inputs für: finalShape=${finalShape}, variant=${variant}`);
    console.log('Gespeicherte Daten:', savedData);
    
    try {
        switch (finalShape) {
            case 'kreis':
                container.appendChild(createInput('Radius (m)', 'radius', savedData.radius || '3'));
                break;
            case 'oval':
                container.appendChild(createInput('Radius X (m)', 'radiusX', savedData.radiusX || '4'));
                container.appendChild(createInput('Radius Y (m)', 'radiusY', savedData.radiusY || '2.5'));
                break;
            case 'halbkreis':
            case 'viertelkreis':
                container.appendChild(createInput('Radius (m)', 'radius', savedData.radius || '4'));
                break;
            case 'langloch':
                container.appendChild(createInput('Länge (m)', 'length', savedData.length || '6'));
                container.appendChild(createInput('Breite (m)', 'width', savedData.width || '3'));
                break;
            case 'dreieck':
                if (variant === 'gleichseitig') {
                    container.appendChild(createInput('Seitenlänge (m)', 'side', savedData.side || '6'));
                } else if (variant === 'rechtwinklig') {
                    container.appendChild(createInput('Kathete A (m)', 'katheteA', savedData.katheteA || '4'));
                    container.appendChild(createInput('Kathete B (m)', 'katheteB', savedData.katheteB || '5'));
                } else {
                    container.appendChild(createInput('Seite A (m)', 'sideA', savedData.sideA || '4'));
                    container.appendChild(createInput('Seite B (m)', 'sideB', savedData.sideB || '5'));
                    container.appendChild(createInput('Seite C (m)', 'sideC', savedData.sideC || '6'));
                }
                break;
            case 'quadrat':
                container.appendChild(createInput('Seitenlänge (m)', 'side', savedData.side || '5'));
                break;
            case 'trapez':
                container.appendChild(createInput('Seite A (unten) (m)', 'sideA', savedData.sideA || '8'));
                container.appendChild(createInput('Seite B (oben) (m)', 'sideB', savedData.sideB || '6'));
                container.appendChild(createInput('Höhe (m)', 'height', savedData.height || '4'));
                container.appendChild(createInput('Versatz (m)', 'offset', savedData.offset || '1'));
                break;
            case 'parallelogramm':
                container.appendChild(createInput('Länge (m)', 'length', savedData.length || '8'));
                container.appendChild(createInput('Breite (m)', 'width', savedData.width || '5'));
                container.appendChild(createInput('Neigungswinkel (°)', 'angle', savedData.angle || '30'));
                break;
            case 'rhombus':
                container.appendChild(createInput('Seitenlänge (m)', 'side', savedData.side || '5'));
                container.appendChild(createInput('Winkel (°)', 'angle', savedData.angle || '60'));
                break;
            case 'fuenfeck':
            case 'sechseck':
            case 'achteck':
                container.appendChild(createInput('Radius (m)', 'radius', savedData.radius || '4'));
                break;
            case 'lform':
                container.appendChild(createInput('Länge gesamt (m)', 'lengthTotal', savedData.lengthTotal || '10'));
                container.appendChild(createInput('Breite gesamt (m)', 'widthTotal', savedData.widthTotal || '8'));
                container.appendChild(createInput('Länge Ausschnitt (m)', 'cutLength', savedData.cutLength || '4'));
                container.appendChild(createInput('Breite Ausschnitt (m)', 'cutWidth', savedData.cutWidth || '4'));
                break;
            case 'tform':
                container.appendChild(createInput('Breite oben (m)', 'topWidth', savedData.topWidth || '8'));
                container.appendChild(createInput('Breite Stiel (m)', 'stemWidth', savedData.stemWidth || '4'));
                container.appendChild(createInput('Höhe oben (m)', 'topHeight', savedData.topHeight || '3'));
                container.appendChild(createInput('Höhe Stiel (m)', 'stemHeight', savedData.stemHeight || '5'));
                break;
            case 'uform':
                container.appendChild(createInput('Außenbreite (m)', 'outerWidth', savedData.outerWidth || '10'));
                container.appendChild(createInput('Innenbreite (m)', 'innerWidth', savedData.innerWidth || '4'));
                container.appendChild(createInput('Höhe (m)', 'height', savedData.height || '6'));
                container.appendChild(createInput('Wandstärke (m)', 'thickness', savedData.thickness || '3'));
                break;
            default:
                container.appendChild(createInput('Länge (m)', 'length', savedData.length || '8'));
                container.appendChild(createInput('Breite (m)', 'width', savedData.width || '5'));
                break;
        }
        
        console.log(`✅ Input-Felder für ${finalShape} erstellt`);
        
    } catch (error) {
        console.error('❌ Fehler beim Erstellen der Input-Felder:', error);
        container.appendChild(createInput('Länge (m)', 'length', '8'));
        container.appendChild(createInput('Breite (m)', 'width', '5'));
    }
}

function createInput(labelText, id, defaultValue) {
    const wrapper = document.createElement('div');
    wrapper.className = 'input-group';
    
    const label = document.createElement('label');
    label.textContent = labelText;
    
    const inputWrapper = document.createElement('div');
    inputWrapper.className = 'input-group-wrapper';
    
    const input = document.createElement('input');
    input.type = 'number';
    input.id = id;
    input.value = defaultValue || '';
    input.step = '0.1';
    input.min = '0.1';
    
    input.addEventListener('input', handleInputChange);
    input.addEventListener('change', handleInputChange);
    
    const unit = document.createElement('span');
    unit.className = 'input-unit';
    unit.textContent = id.includes('angle') ? '°' : 'm';
    
    inputWrapper.appendChild(input);
    inputWrapper.appendChild(unit);
    wrapper.appendChild(label);
    wrapper.appendChild(inputWrapper);
    
    return wrapper;
}

function handleInputChange() {
    if (isUpdating) return;
    
    clearTimeout(window.inputTimeout);
    window.inputTimeout = setTimeout(function() {
        if (isUpdating) return;
        isUpdating = true;
        
        try {
            const data = getCurrentFormData();
            const newScale = calculateOptimalScale(data);
            updateShapeWithScale(newScale);
        } catch (error) {
            console.error('❌ Input-Change Fehler:', error);
        }
        
        setTimeout(function() { isUpdating = false; }, 50);
    }, 100);
}

function updateShape() {
    console.log('=== UPDATE SHAPE ===');
    try {
        const data = getCurrentFormData();
        console.log('Form-Daten:', data);
        const optimalScale = calculateOptimalScale(data);
        console.log('Optimale Skalierung:', optimalScale);
        updateShapeWithScale(optimalScale);
    } catch (error) {
        console.error('❌ Shape-Update Fehler:', error);
    }
}

function getCurrentFormData() {
    const data = { 
        shape: currentShape, 
        variant: currentVariant 
    };
    
    const inputs = document.querySelectorAll('#geometry-inputs-grid input');
    console.log(`Gefundene Inputs: ${inputs.length}`);
    
    for (let i = 0; i < inputs.length; i++) {
        const input = inputs[i];
        if (input.value && input.value.trim() !== '') {
            const numValue = parseFloat(input.value);
            if (!isNaN(numValue) && numValue > 0) {
                data[input.id] = numValue;
                console.log(`${input.id}: ${numValue}`);
            }
        }
    }
    
    console.log('✅ Finale Form-Daten:', data);
    return data;
}

function calculateOptimalScale(data) {
    const finalShape = determineActualShape();
    let maxDimension = 8;
    
    try {
        switch (finalShape) {
            case 'kreis':
            case 'halbkreis':
            case 'viertelkreis':
                maxDimension = (data.radius || 3) * 2;
                break;
            case 'oval':
                maxDimension = Math.max((data.radiusX || 4) * 2, (data.radiusY || 2.5) * 2);
                break;
            case 'langloch':
                maxDimension = Math.max(data.length || 6, data.width || 3);
                break;
            case 'rechteck':
                maxDimension = Math.max(data.length || 8, data.width || 5);
                break;
            case 'quadrat':
                maxDimension = data.side || 5;
                break;
            case 'dreieck':
                maxDimension = Math.max(data.sideA || 4, data.sideB || 5, data.sideC || 6, data.side || 6);
                break;
            case 'trapez':
                const sideA = data.sideA || 8;
                const sideB = data.sideB || 6;
                const height = data.height || 4;
                const offset = Math.abs(data.offset || 1);
                const maxWidth = Math.max(sideA, sideB + offset * 2);
                maxDimension = Math.max(maxWidth, height);
                break;
            case 'parallelogramm':
                maxDimension = Math.max(data.length || 8, data.width || 5);
                break;
            case 'rhombus':
                maxDimension = (data.side || 5) * 1.5;
                break;
            case 'fuenfeck':
            case 'sechseck':
            case 'achteck':
                maxDimension = (data.radius || 4) * 2;
                break;
            case 'lform':
                maxDimension = Math.max(data.lengthTotal || 10, data.widthTotal || 8);
                break;
            case 'tform':
                maxDimension = Math.max(data.topWidth || 8, (data.topHeight || 3) + (data.stemHeight || 5));
                break;
            case 'uform':
                maxDimension = Math.max(data.outerWidth || 10, data.height || 6);
                break;
            default:
                maxDimension = Math.max(data.length || 8, data.width || 5);
        }
    } catch (error) {
        console.error('❌ Skalierungs-Berechnung Fehler:', error);
        maxDimension = 8;
    }
    
    const canvasWidth = 600 - (CANVAS_PADDING * 2);
    const canvasHeight = 400 - (CANVAS_PADDING * 2);
    
    let scale = Math.min(canvasWidth / maxDimension, canvasHeight / maxDimension) * 0.85;
    scale = Math.max(scale, MIN_SCALE);
    scale = Math.min(scale, MAX_SCALE);
    
    return scale;
}

function updateShapeWithScale(scale) {
    if (!svg) {
        console.error('❌ SVG nicht verfügbar');
        return;
    }
    
    const data = getCurrentFormData();
    
    const shapeGroup = document.getElementById('roof-shape');
    const labelsGroup = document.getElementById('labels');
    
    if (shapeGroup) shapeGroup.innerHTML = '';
    if (labelsGroup) labelsGroup.innerHTML = '';
    
    if (shapeGroup) {
        shapeGroup.removeAttribute('transform');
        try {
            drawCurrentShape(shapeGroup, data, scale);
        } catch (error) {
            console.error('❌ Shape zeichnen Fehler:', error);
        }
    }
    
    if (labelsGroup) {
        try {
            drawLabelsOnShape(labelsGroup, data, scale);
        } catch (error) {
            console.error('❌ Labels zeichnen Fehler:', error);
        }
    }
    
    try {
        updateCalculations(data);
        updateRotationDisplay();
    } catch (error) {
        console.error('❌ Berechnungen/Rotation Fehler:', error);
    }
}

function drawCurrentShape(group, data, scale) {
    const finalShape = determineActualShape();
    console.log(`🎨 Zeichne Shape: ${finalShape} mit Skalierung: ${scale}`);
    
    try {
        switch (finalShape) {
            case 'kreis':
                drawCircleShape(group, data, scale);
                break;
            case 'oval':
                drawOvalShape(group, data, scale);
                break;
            case 'rechteck':
                drawRectangleShape(group, data, scale);
                break;
            case 'quadrat':
                drawSquareShape(group, data, scale);
                break;
            case 'dreieck':
                drawTriangleShape(group, data, scale);
                break;
            case 'trapez':
                drawTrapezShape(group, data, scale);
                break;
            case 'parallelogramm':
                drawParallelogramShape(group, data, scale);
                break;
            default:
                console.log(`⚠️ Unbekannte Form: ${finalShape}, verwende Rechteck`);
                drawRectangleShape(group, data, scale);
        }
        
        if (currentRotation !== 0) {
            group.setAttribute('transform', 'rotate(' + currentRotation + ' ' + CANVAS_CENTER_X + ' ' + CANVAS_CENTER_Y + ')');
        }
        
        console.log(`✅ Shape ${finalShape} erfolgreich gezeichnet`);
        
    } catch (error) {
        console.error(`❌ Fehler beim Zeichnen von ${finalShape}:`, error);
        drawRectangleShape(group, data, scale);
    }
}

function drawCircleShape(group, data, scale) {
    const radius = (data.radius || 3) * scale;
    const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    circle.setAttribute('cx', CANVAS_CENTER_X);
    circle.setAttribute('cy', CANVAS_CENTER_Y);
    circle.setAttribute('r', radius);
    circle.setAttribute('fill', 'rgba(0, 123, 255, 0.3)');
    circle.setAttribute('stroke', '#007bff');
    circle.setAttribute('stroke-width', '3');
    group.appendChild(circle);
}

function drawOvalShape(group, data, scale) {
    const radiusX = (data.radiusX || 4) * scale;
    const radiusY = (data.radiusY || 2.5) * scale;
    const ellipse = document.createElementNS('http://www.w3.org/2000/svg', 'ellipse');
    ellipse.setAttribute('cx', CANVAS_CENTER_X);
    ellipse.setAttribute('cy', CANVAS_CENTER_Y);
    ellipse.setAttribute('rx', radiusX);
    ellipse.setAttribute('ry', radiusY);
    ellipse.setAttribute('fill', 'rgba(0, 123, 255, 0.3)');
    ellipse.setAttribute('stroke', '#007bff');
    ellipse.setAttribute('stroke-width', '3');
    group.appendChild(ellipse);
}

function drawRectangleShape(group, data, scale) {
    const length = (data.length || 8) * scale;
    const width = (data.width || 5) * scale;
    
    const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    rect.setAttribute('x', CANVAS_CENTER_X - length/2);
    rect.setAttribute('y', CANVAS_CENTER_Y - width/2);
    rect.setAttribute('width', length);
    rect.setAttribute('height', width);
    rect.setAttribute('fill', 'rgba(0, 123, 255, 0.3)');
    rect.setAttribute('stroke', '#007bff');
    rect.setAttribute('stroke-width', '3');
    group.appendChild(rect);
    
    console.log(`✅ Rechteck gezeichnet: ${length} x ${width} px`);
}

function drawSquareShape(group, data, scale) {
    const side = (data.side || 5) * scale;
    const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    rect.setAttribute('x', CANVAS_CENTER_X - side/2);
    rect.setAttribute('y', CANVAS_CENTER_Y - side/2);
    rect.setAttribute('width', side);
    rect.setAttribute('height', side);
    rect.setAttribute('fill', 'rgba(0, 123, 255, 0.3)');
    rect.setAttribute('stroke', '#007bff');
    rect.setAttribute('stroke-width', '3');
    group.appendChild(rect);
}

function drawTriangleShape(group, data, scale) {
    const variant = determineActualVariant();
    let points = '';
    
    if (variant === 'gleichseitig') {
        const side = (data.side || 6) * scale;
        const height = side * Math.sqrt(3) / 2;
        const topX = CANVAS_CENTER_X;
        const topY = CANVAS_CENTER_Y - height/3;
        const leftX = CANVAS_CENTER_X - side/2;
        const leftY = CANVAS_CENTER_Y + height*2/3;
        const rightX = CANVAS_CENTER_X + side/2;
        const rightY = CANVAS_CENTER_Y + height*2/3;
        points = topX + ',' + topY + ' ' + leftX + ',' + leftY + ' ' + rightX + ',' + rightY;
    } else if (variant === 'rechtwinklig') {
        const katheteA = (data.katheteA || 4) * scale;
        const katheteB = (data.katheteB || 5) * scale;
        
        const leftX = CANVAS_CENTER_X - katheteA/2;
        const rightX = CANVAS_CENTER_X + katheteA/2;
        const bottomY = CANVAS_CENTER_Y + katheteB/3;
        const topY = CANVAS_CENTER_Y - katheteB*2/3;
        
        points = leftX + ',' + bottomY + ' ' + rightX + ',' + bottomY + ' ' + leftX + ',' + topY;
    } else {
        const sideA = (data.sideA || 4) * scale;
        const avgSide = ((data.sideB || 5) + (data.sideC || 6)) / 2;
        const height = avgSide * scale * 0.8;
        
        const topX = CANVAS_CENTER_X;
        const topY = CANVAS_CENTER_Y - height/2;
        const leftX = CANVAS_CENTER_X - sideA/2;
        const leftY = CANVAS_CENTER_Y + height/2;
        const rightX = CANVAS_CENTER_X + sideA/2;
        const rightY = CANVAS_CENTER_Y + height/2;
        
        points = topX + ',' + topY + ' ' + leftX + ',' + leftY + ' ' + rightX + ',' + rightY;
    }
    
    const triangle = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
    triangle.setAttribute('points', points);
    triangle.setAttribute('fill', 'rgba(0, 123, 255, 0.3)');
    triangle.setAttribute('stroke', '#007bff');
    triangle.setAttribute('stroke-width', '3');
    group.appendChild(triangle);
}

function drawTrapezShape(group, data, scale) {
    console.log('🎨 === ZEICHNE TRAPEZ ===');
    console.log('Daten:', data);
    console.log('Skalierung:', scale);
    
    const sideA = (data.sideA || 8) * scale;
    const sideB = (data.sideB || 6) * scale;
    const height = (data.height || 4) * scale;
    const offset = (data.offset || 1) * scale;
    
    console.log(`Trapez-Parameter: sideA=${sideA}px, sideB=${sideB}px, height=${height}px, offset=${offset}px`);
    
    const centerX = CANVAS_CENTER_X;
    const centerY = CANVAS_CENTER_Y;
    
    const points = [
        { x: centerX - sideA/2, y: centerY + height/2 },
        { x: centerX + sideA/2, y: centerY + height/2 },
        { x: centerX + sideB/2 + offset, y: centerY - height/2 },
        { x: centerX - sideB/2 + offset, y: centerY - height/2 }
    ];
    
    console.log('Trapez-Punkte:', points);
    
    const pointsStr = points.map(function(p) { return p.x + ',' + p.y; }).join(' ');
    
    const polygon = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
    polygon.setAttribute('points', pointsStr);
    polygon.setAttribute('fill', 'rgba(0, 123, 255, 0.3)');
    polygon.setAttribute('stroke', '#007bff');
    polygon.setAttribute('stroke-width', '3');
    group.appendChild(polygon);
    
    console.log('✅ Trapez erfolgreich gezeichnet');
}

function drawParallelogramShape(group, data, scale) {
    const length = (data.length || 8) * scale;
    const width = (data.width || 5) * scale;
    const angle = (data.angle || 30) * Math.PI / 180;
    const skew = width * Math.cos(angle);
    
    const points = [
        { x: CANVAS_CENTER_X - length/2, y: CANVAS_CENTER_Y - width/2 },
        { x: CANVAS_CENTER_X + length/2, y: CANVAS_CENTER_Y - width/2 },
        { x: CANVAS_CENTER_X + length/2 + skew, y: CANVAS_CENTER_Y + width/2 },
        { x: CANVAS_CENTER_X - length/2 + skew, y: CANVAS_CENTER_Y + width/2 }
    ];
    
    const pointsStr = points.map(function(p) { return p.x + ',' + p.y; }).join(' ');
    
    const polygon = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
    polygon.setAttribute('points', pointsStr);
    polygon.setAttribute('fill', 'rgba(0, 123, 255, 0.3)');
    polygon.setAttribute('stroke', '#007bff');
    polygon.setAttribute('stroke-width', '3');
    group.appendChild(polygon);
}

function drawLabelsOnShape(group, data, scale) {
    const finalShape = determineActualShape();
    
    if (finalShape === 'dreieck') {
        const labels = ['A', 'B', 'C'];
        const colors = ['#dc3545', '#28a745', '#ffc107'];
        
        const positions = [
            { x: CANVAS_CENTER_X, y: CANVAS_CENTER_Y - 50 },
            { x: CANVAS_CENTER_X - 40, y: CANVAS_CENTER_Y + 30 },
            { x: CANVAS_CENTER_X + 40, y: CANVAS_CENTER_Y + 30 }
        ];
        
        for (let i = 0; i < 3; i++) {
            const label = createLabel(positions[i].x, positions[i].y, labels[i], colors[i]);
            group.appendChild(label);
        }
    } else if (finalShape === 'trapez' || finalShape === 'rechteck' || finalShape === 'quadrat' || finalShape === 'parallelogramm') {
        const labels = ['A', 'B', 'C', 'D'];
        const colors = ['#007bff', '#28a745', '#dc3545', '#ffc107'];
        
        const positions = [
            { x: CANVAS_CENTER_X - 40, y: CANVAS_CENTER_Y - 30 },
            { x: CANVAS_CENTER_X + 40, y: CANVAS_CENTER_Y - 30 },
            { x: CANVAS_CENTER_X + 40, y: CANVAS_CENTER_Y + 40 },
            { x: CANVAS_CENTER_X - 40, y: CANVAS_CENTER_Y + 40 }
        ];
        
        for (let i = 0; i < 4; i++) {
            const label = createLabel(positions[i].x, positions[i].y, labels[i], colors[i]);
            group.appendChild(label);
        }
    }
}

function createLabel(x, y, text, color) {
    const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    label.setAttribute('x', x);
    label.setAttribute('y', y);
    label.setAttribute('text-anchor', 'middle');
    label.setAttribute('fill', color);
    label.setAttribute('font-size', '12');
    label.setAttribute('font-weight', 'bold');
    label.setAttribute('stroke', 'white');
    label.setAttribute('stroke-width', '2');
    label.setAttribute('paint-order', 'stroke');
    label.textContent = text;
    return label;
}

function updateCalculations(data) {
    let area = 0;
    let perimeter = 0;
    const finalShape = determineActualShape();
    const variant = determineActualVariant();
    
    try {
        switch (finalShape) {
            case 'kreis':
                const radius = data.radius || 3;
                area = Math.PI * radius * radius;
                perimeter = 2 * Math.PI * radius;
                break;
            case 'trapez':
                const sideA = data.sideA || 8;
                const sideB = data.sideB || 6;
                const height = data.height || 4;
                area = ((sideA + sideB) / 2) * height;
                const offset = data.offset || 1;
                const trapezSideLength = Math.sqrt(height * height + offset * offset);
                perimeter = sideA + sideB + 2 * trapezSideLength;
                break;
            case 'rechteck':
                const rectLength = data.length || 8;
                const rectWidth = data.width || 5;
                area = rectLength * rectWidth;
                perimeter = 2 * (rectLength + rectWidth);
                break;
            case 'quadrat':
                const side = data.side || 5;
                area = side * side;
                perimeter = 4 * side;
                break;
            case 'dreieck':
                if (variant === 'rechtwinklig') {
                    const a = data.katheteA || 4;
                    const b = data.katheteB || 5;
                    area = 0.5 * a * b;
                    const c = Math.sqrt(a*a + b*b);
                    perimeter = a + b + c;
                } else if (variant === 'gleichseitig') {
                    const s = data.side || 6;
                    area = (Math.sqrt(3) / 4) * s * s;
                    perimeter = 3 * s;
                } else {
                    const a = data.sideA || 4;
                    const b = data.sideB || 5;
                    const c = data.sideC || 6;
                    const s = (a + b + c) / 2;
                    area = Math.sqrt(s * (s - a) * (s - b) * (s - c));
                    perimeter = a + b + c;
                }
                break;
            default:
                area = 40;
                perimeter = 26;
        }
    } catch (error) {
        console.error('❌ Berechnungen Fehler:', error);
        area = 40;
        perimeter = 26;
    }
    
    const areaElement = document.getElementById('calc-area');
    const perimeterElement = document.getElementById('calc-perimeter');
    
    if (areaElement) areaElement.textContent = area.toFixed(2) + ' m²';
    if (perimeterElement) perimeterElement.textContent = perimeter.toFixed(2) + ' m';
}

function createRotationDisplay() {
    const existing = document.getElementById('rotation-display');
    if (existing) existing.remove();
    
    const display = document.createElement('div');
    display.id = 'rotation-display';
    display.style.cssText = 'position: absolute; top: 10px; right: 10px; background: rgba(0, 0, 0, 0.8); color: white; padding: 8px 12px; border-radius: 6px; font-family: monospace; font-size: 14px; font-weight: bold; z-index: 1000; pointer-events: none;';
    display.textContent = '0°';
    
    const canvasWrapper = document.querySelector('.canvas-wrapper');
    if (canvasWrapper) { 
        canvasWrapper.appendChild(display); 
    }
}

function updateRotationDisplay() {
    const display = document.getElementById('rotation-display');
    if (display) {
        const roundedRotation = Math.round(currentRotation * 10) / 10;
        display.textContent = roundedRotation + '°';
    }
}

function setupEventListeners() {
    const backBtn = document.getElementById('btn-back');
    const continueBtn = document.getElementById('btn-continue');
    
    if (backBtn) {
        backBtn.addEventListener('click', function() {
            saveCurrentData();
            window.location.href = 'dachform.html';
        });
    }
    
    if (continueBtn) {
        continueBtn.addEventListener('click', function() {
            saveCurrentData();
            window.location.href = 'berechnung.html';
        });
    }
    
    const resetBtn = document.getElementById('btn-reset');
    if (resetBtn) {
        resetBtn.addEventListener('click', function() {
            resetToDefaults();
        });
    }
}

function resetToDefaults() {
    currentRotation = 0;
    
    const inputs = document.querySelectorAll('#geometry-inputs-grid input');
    for (let i = 0; i < inputs.length; i++) {
        const input = inputs[i];
        const finalShape = determineActualShape();
        
        switch(input.id) {
            case 'radius': 
                input.value = finalShape === 'kreis' ? '3' : '4'; 
                break;
            case 'radiusX': input.value = '4'; break;
            case 'radiusY': input.value = '2.5'; break;
            case 'side': 
                input.value = finalShape === 'quadrat' ? '5' : '6'; 
                break;
            case 'katheteA': input.value = '4'; break;
            case 'katheteB': input.value = '5'; break;
            case 'sideA': 
                input.value = finalShape === 'trapez' ? '8' : '4'; 
                break;
            case 'sideB': 
                input.value = finalShape === 'trapez' ? '6' : '5'; 
                break;
            case 'sideC': input.value = '6'; break;
            case 'length': input.value = '8'; break;
            case 'width': input.value = '5'; break;
            case 'height': input.value = '4'; break;
            case 'offset': input.value = '1'; break;
            case 'angle': input.value = '30'; break;
            default: 
                input.value = '5'; 
                break;
        }
    }
    
    updateShape();
    showFeedback('Zurückgesetzt: Form, Rotation und alle Parameter');
}

function showFeedback(message, backgroundColor) {
    if (!backgroundColor) backgroundColor = '#28a745';
    
    const existingFeedback = document.querySelectorAll('.feedback-message');
    for (let i = 0; i < existingFeedback.length; i++) {
        existingFeedback[i].remove();
    }
    
    const feedback = document.createElement('div');
    feedback.className = 'feedback-message';
    feedback.style.cssText = 'position: fixed; top: 100px; right: 20px; background: ' + backgroundColor + '; color: white; padding: 12px 20px; border-radius: 6px; z-index: 1000; box-shadow: 0 4px 12px rgba(0,0,0,0.2); max-width: 300px; font-size: 14px; font-weight: 500;';
    
    feedback.textContent = message;
    document.body.appendChild(feedback);
    
    setTimeout(function() {
        if (feedback.parentNode) { 
            feedback.remove(); 
        }
    }, 3000);
}

function saveCurrentData() {
    console.log('=== SPEICHERE AKTUELLE DATEN ===');
    
    const currentData = getCurrentFormData();
    currentData.rotation = currentRotation;
    
    if (!projectData.roofShape) { 
        projectData.roofShape = {}; 
    }
    
    for (const key in currentData) {
        projectData.roofShape[key] = currentData[key];
    }
    
    projectData.roofShape.points = generateRoofPoints(currentData);
    
    projectData.geometry = {
        shapeType: determineActualShape(),
        variant: determineActualVariant(),
        points: projectData.roofShape.points,
        rotation: currentRotation,
        area: calculateArea(currentData),
        dimensions: calculateDimensions(currentData)
    };
    
    console.log('✅ Gespeicherte Daten:', projectData);
    
    try {
        localStorage.setItem('dachplattenrechner_data', JSON.stringify(projectData));
        console.log('✅ Daten erfolgreich in localStorage gespeichert');
    } catch (e) {
        sessionStorage.setItem('dachplattenrechner_data', JSON.stringify(projectData));
        console.log('✅ Daten in sessionStorage gespeichert');
    }
}

function generateRoofPoints(data) {
    const finalShape = determineActualShape();
    let points = [];
    
    try {
        switch (finalShape) {
            case 'rechteck':
                const rectLength = data.length || 8;
                const rectWidth = data.width || 5;
                points = [
                    { x: -rectLength/2, y: -rectWidth/2 }, 
                    { x: rectLength/2, y: -rectWidth/2 },
                    { x: rectLength/2, y: rectWidth/2 }, 
                    { x: -rectLength/2, y: rectWidth/2 }
                ];
                break;
                
            case 'trapez':
                const sideA = data.sideA || 8;
                const sideB = data.sideB || 6;
                const height = data.height || 4;
                const offset = data.offset || 1;
                
                points = [
                    { x: -sideA/2, y: -height/2 },
                    { x: sideA/2, y: -height/2 },
                    { x: sideB/2 + offset, y: height/2 },
                    { x: -sideB/2 + offset, y: height/2 }
                ];
                break;
                
            case 'dreieck':
                const variant = determineActualVariant();
                if (variant === 'gleichseitig') {
                    const side = data.side || 6;
                    const height = side * Math.sqrt(3) / 2;
                    points = [
                        { x: 0, y: height * 2/3 },
                        { x: -side/2, y: -height/3 },
                        { x: side/2, y: -height/3 }
                    ];
                } else if (variant === 'rechtwinklig') {
                    const a = data.katheteA || 4;
                    const b = data.katheteB || 5;
                    points = [
                        { x: -a/2, y: -b/3 },
                        { x: a/2, y: -b/3 },
                        { x: -a/2, y: b*2/3 }
                    ];
                } else {
                    const sideA = data.sideA || 4;
                    points = [
                        { x: 0, y: 3 },
                        { x: -sideA/2, y: -2 },
                        { x: sideA/2, y: -2 }
                    ];
                }
                break;
                
            default:
                points = [
                    { x: -4, y: -2.5 }, { x: 4, y: -2.5 },
                    { x: 4, y: 2.5 }, { x: -4, y: 2.5 }
                ];
        }
    } catch (error) {
        console.error('❌ Punkt-Generierung Fehler:', error);
        points = [
            { x: -4, y: -2.5 }, { x: 4, y: -2.5 },
            { x: 4, y: 2.5 }, { x: -4, y: 2.5 }
        ];
    }
    
    return points;
}

function calculateArea(data) {
    const finalShape = determineActualShape();
    const variant = determineActualVariant();
    
    try {
        switch (finalShape) {
            case 'kreis':
                const radius = data.radius || 3;
                return Math.PI * radius * radius;
            case 'rechteck':
                return (data.length || 8) * (data.width || 5);
            case 'quadrat':
                const side = data.side || 5;
                return side * side;
            case 'dreieck':
                if (variant === 'rechtwinklig') {
                    return 0.5 * (data.katheteA || 4) * (data.katheteB || 5);
                } else if (variant === 'gleichseitig') {
                    const s = data.side || 6;
                    return (Math.sqrt(3) / 4) * s * s;
                } else {
                    const a = data.sideA || 4;
                    const b = data.sideB || 5;
                    const c = data.sideC || 6;
                    const s = (a + b + c) / 2;
                    return Math.sqrt(s * (s - a) * (s - b) * (s - c));
                }
            case 'trapez':
                const sideA = data.sideA || 8;
                const sideB = data.sideB || 6;
                const height = data.height || 4;
                return ((sideA + sideB) / 2) * height;
            default:
                return 40;
        }
    } catch (error) {
        console.error('❌ Flächenberechnung Fehler:', error);
        return 40;
    }
}

function calculateDimensions(data) {
    const finalShape = determineActualShape();
    
    try {
        switch (finalShape) {
            case 'kreis':
                const circleRadius = data.radius || 3;
                return { length: circleRadius * 2, width: circleRadius * 2 };
            case 'rechteck':
                return { length: data.length || 8, width: data.width || 5 };
            case 'quadrat':
                const side = data.side || 5;
                return { length: side, width: side };
            case 'trapez':
                return { length: Math.max(data.sideA || 8, data.sideB || 6), width: data.height || 4 };
            default:
                return { length: 8, width: 5 };
        }
    } catch (error) {
        console.error('❌ Dimensions-Berechnung Fehler:', error);
        return { length: 8, width: 5 };
    }
}

// Überprüfung der Projektdaten nach dem Laden
window.addEventListener('load', function() {
    setTimeout(function() {
        const profile = projectData.profile;
        const roof = projectData.roofShape;
        
        console.log('🔍 Load-Check:', { 
            profile: !!profile, 
            roof: !!roof,
            profileValid: profile && profile.deckbreite,
            roofValid: roof && (roof.baseShape || roof.variant)
        });
        
        if (!profile || !profile.deckbreite) {
            console.log('⚠️ Profil-Daten unvollständig');
            if (confirm('Profil-Daten fehlen. Möchten Sie zu Schritt 1 zurückkehren?')) {
                window.location.href = 'profil.html';
            }
        } else if (!roof || (!roof.baseShape && !roof.variant)) {
            console.log('⚠️ Dachform-Daten unvollständig');
            if (confirm('Dachform-Daten fehlen. Möchten Sie zu Schritt 2 zurückkehren?')) {
                window.location.href = 'dachform.html';
            }
        } else {
            console.log('✅ Alle erforderlichen Daten vorhanden');
        }
    }, 1500);
});

console.log('✅ Korrigierte editor.js erfolgreich geladen - Dachformen werden jetzt richtig geladen!');
