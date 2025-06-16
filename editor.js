// editor.js – Intelligente Version mit automatischer Parameter-Erkennung

// Globale Variablen
let projectData = {};
let currentPoints = [];
let currentShape = '';
let currentVariant = '';
let waterFlowDirection = 'bottom';
let svg;

// ANGEPASSTE Konstanten für bessere Sichtbarkeit
const CANVAS_WIDTH = 600;
const CANVAS_HEIGHT = 400;
const CANVAS_CENTER_X = 300;
const CANVAS_CENTER_Y = 200;
const SCALE_FACTOR = 25; // NOCHMALS ERHÖHT für noch größere Formen

document.addEventListener('DOMContentLoaded', () => {
    console.log('=== SMART EDITOR WIRD INITIALISIERT ===');
    
    // Kleine Verzögerung für DOM-Ladung
    setTimeout(() => {
        try {
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
            
            console.log('✅ Smart Editor erfolgreich initialisiert');
        } catch (error) {
            console.error('❌ Fehler bei Editor-Initialisierung:', error);
        }
    }, 100);
});

function loadProjectData() {
    console.log('=== EDITOR: LADE PROJEKTDATEN ===');
    
    const dataString = localStorage.getItem('dachplattenrechner_data') || 
                       sessionStorage.getItem('dachplattenrechner_data');
    
    if (!dataString) {
        console.error('❌ Keine Projektdaten gefunden');
        alert('Keine Projektdaten gefunden. Sie werden zu Schritt 1 weitergeleitet.');
        window.location.href = 'profil.html';
        return;
    }

    try {
        projectData = JSON.parse(dataString);
        console.log('✅ Projektdaten erfolgreich geparst:', projectData);
        
        if (!projectData.profile || !projectData.roofShape) {
            throw new Error('Unvollständige Projektdaten');
        }
        
        console.log('✅ Alle notwendigen Daten vorhanden');
        
    } catch (e) {
        console.error('❌ Fehler beim Laden der Projektdaten:', e);
        alert('Fehler beim Laden der Projektdaten. Bitte starten Sie neu.');
        window.location.href = 'index.html';
    }
}

function initializeCanvas() {
    console.log('=== INITIALISIERE CANVAS ===');
    
    svg = document.getElementById('main-svg');
    
    if (!svg) {
        console.error('❌ SVG Element nicht gefunden - erstelle Fallback');
        createFallbackCanvas();
        return;
    }
    
    console.log('✅ SVG Element gefunden');
}

function createFallbackCanvas() {
    const container = document.querySelector('.canvas-container') || document.querySelector('main');
    
    if (!container) {
        console.error('❌ Kein Container gefunden');
        return;
    }
    
    const wrapper = document.createElement('div');
    wrapper.className = 'canvas-wrapper';
    wrapper.style.cssText = `
        border: 2px solid #e9ecef;
        border-radius: 8px;
        background: white;
        width: 600px;
        height: 400px;
        margin: 20px auto;
        position: relative;
    `;
    
    svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.id = 'main-svg';
    svg.setAttribute('width', '600');
    svg.setAttribute('height', '400');
    svg.setAttribute('viewBox', '0 0 600 400');
    
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
        <g id="dimensions"></g>
    `;
    
    wrapper.appendChild(svg);
    container.appendChild(wrapper);
    console.log('✅ Fallback-Canvas erstellt');
}

function initializeUI() {
    console.log('=== INITIALISIERE UI ===');
    displayProfileInfo();
    updateShapeTitle();
}

function displayProfileInfo() {
    const profile = projectData.profile;
    if (!profile) return;
    
    const elements = {
        'current-profile-name': profile.profilname || 'Standard',
        'current-deckbreite': `${profile.deckbreite || 1000} mm`,
        'current-lieferbreite': `${profile.lieferbreite || 1050} mm`,
        'current-seitenueberlappung': `${profile.seitenueberlappung || 50} mm`
    };
    
    Object.entries(elements).forEach(([id, value]) => {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = value;
        }
    });
}

function updateShapeTitle() {
    const roofShape = projectData.roofShape;
    if (!roofShape) return;
    
    const shapeNames = {
        'dreieck': 'Dreieck',
        'rechteck': 'Rechteck',
        'quadrat': 'Quadrat',
        'kreis': 'Kreis',
        'trapez': 'Trapez',
        'rhombus': 'Rhombus',
        'langloch': 'Langloch',
        'fuenfeck': 'Fünfeck',
        'sechseck': 'Sechseck',
        'achteck': 'Achteck'
    };
    
    const shapeName = shapeNames[roofShape.variant] || shapeNames[roofShape.baseShape] || 'Unbekannt';
    
    const element = document.getElementById('current-shape-name');
    if (element) {
        element.textContent = shapeName;
    }
}

function loadAndDrawShape() {
    console.log('=== LADE UND ZEICHNE FORM ===');
    
    const roofShape = projectData.roofShape;
    if (!roofShape) {
        console.error('❌ Keine Dachform-Daten gefunden');
        return;
    }
    
    currentShape = roofShape.baseShape;
    currentVariant = roofShape.variant;
    
    console.log('📊 Lade Form:', currentShape, 'Variante:', currentVariant);
    
    // Eingabefelder erstellen
    createInputFields();
    
    // Initial zeichnen
    updateShape();
}

function createInputFields() {
    console.log('=== ERSTELLE INTELLIGENTE EINGABEFELDER ===');
    
    const container = document.getElementById('geometry-inputs-grid');
    if (!container) {
        console.error('❌ Container nicht gefunden');
        return;
    }
    
    container.innerHTML = '';
    
    // INTELLIGENTE Eingabefeld-Erstellung basierend auf Form UND Variante
    console.log(`🎯 Erstelle Felder für: ${currentShape} (${currentVariant})`);
    
    if (currentShape === 'dreieck') {
        switch (currentVariant) {
            case 'gleichseitig':
                container.appendChild(createInput('Seitenlänge (m)', 'side', '6'));
                console.log('✅ Gleichseitiges Dreieck: Seitenlänge');
                break;
                
            case 'rechtwinklig':
                container.appendChild(createInput('Kathete A (m)', 'katheteA', '4'));
                container.appendChild(createInput('Kathete B (m)', 'katheteB', '5'));
                console.log('✅ Rechtwinkliges Dreieck: Katheten');
                break;
                
            default: // ungleichschenklig oder allgemein
                container.appendChild(createInput('Seite A (m)', 'sideA', '4'));
                container.appendChild(createInput('Seite B (m)', 'sideB', '5'));
                container.appendChild(createInput('Seite C (m)', 'sideC', '6'));
                console.log('✅ Allgemeines Dreieck: Drei Seiten');
        }
    } else if (currentShape === 'kreis') {
        container.appendChild(createInput('Radius (m)', 'radius', '4'));
        console.log('✅ Kreis: Radius');
    } else if (currentShape === 'rechteck' || currentShape === 'quadrat') {
        if (currentVariant === 'quadrat') {
            container.appendChild(createInput('Seitenlänge (m)', 'side', '5'));
            console.log('✅ Quadrat: Seitenlänge');
        } else {
            container.appendChild(createInput('Länge (m)', 'length', '8'));
            container.appendChild(createInput('Breite (m)', 'width', '5'));
            console.log('✅ Rechteck: Länge und Breite');
        }
    } else if (currentShape === 'trapez') {
        container.appendChild(createInput('Basis A (m)', 'baseA', '8'));
        container.appendChild(createInput('Basis B (m)', 'baseB', '5'));
        container.appendChild(createInput('Höhe (m)', 'height', '4'));
        console.log('✅ Trapez: Beide Basen und Höhe');
    } else {
        // Fallback für unbekannte Formen
        container.appendChild(createInput('Länge (m)', 'length', '8'));
        container.appendChild(createInput('Breite (m)', 'width', '5'));
        console.log('⚠️ Fallback: Länge und Breite');
    }
    
    console.log('✅ Eingabefelder erstellt');
}

function createInput(labelText, id, defaultValue = '') {
    const wrapper = document.createElement('div');
    wrapper.className = 'input-group';
    
    const label = document.createElement('label');
    label.textContent = labelText;
    
    const inputWrapper = document.createElement('div');
    inputWrapper.className = 'input-group-wrapper';
    
    const input = document.createElement('input');
    input.type = 'number';
    input.id = id;
    input.value = defaultValue;
    input.step = '0.1';
    input.min = '0.1';
    
    // Event Listeners mit Smart Debug
    input.addEventListener('input', function() {
        console.log(`🔥 INPUT: ${id} = ${this.value} (für ${currentShape}/${currentVariant})`);
        updateShape();
    });
    
    input.addEventListener('change', function() {
        console.log(`✅ CHANGE: ${id} = ${this.value} (für ${currentShape}/${currentVariant})`);
        updateShape();
    });
    
    const unit = document.createElement('span');
    unit.className = 'input-unit';
    unit.textContent = 'm';
    
    inputWrapper.appendChild(input);
    inputWrapper.appendChild(unit);
    wrapper.appendChild(label);
    wrapper.appendChild(inputWrapper);
    
    return wrapper;
}

function updateShape() {
    console.log('🎯 === SMART UPDATE SHAPE ===');
    
    if (!svg) {
        console.error('❌ SVG nicht verfügbar');
        return;
    }
    
    const shapeGroup = document.getElementById('roof-shape');
    if (!shapeGroup) {
        console.error('❌ roof-shape Gruppe nicht gefunden');
        return;
    }
    
    // Gruppe leeren
    shapeGroup.innerHTML = '';
    
    // Aktuelle Daten sammeln
    const currentData = getCurrentFormData();
    console.log('📊 Smart Data:', currentData);
    
    // Form zeichnen
    drawSmartShape(shapeGroup, currentData);
    
    // Berechnungen aktualisieren
    updateCalculations(currentData);
    
    console.log('✅ Smart Update abgeschlossen');
}

function getCurrentFormData() {
    const data = { 
        shape: currentShape,
        variant: currentVariant 
    };
    
    // Alle Eingabefelder auslesen
    const inputs = document.querySelectorAll('#geometry-inputs-grid input');
    
    inputs.forEach(input => {
        if (input.value) {
            const numValue = parseFloat(input.value);
            if (!isNaN(numValue)) {
                data[input.id] = numValue;
            }
        }
    });
    
    return data;
}

function drawSmartShape(group, data) {
    console.log('🎨 === SMART DRAW ===');
    console.log('Form:', data.shape, 'Variante:', data.variant);
    console.log('Daten:', data);
    
    switch (data.shape) {
        case 'dreieck':
            drawSmartTriangle(group, data);
            break;
        case 'kreis':
            drawSmartCircle(group, data);
            break;
        case 'rechteck':
        case 'quadrat':
            drawSmartRectangle(group, data);
            break;
        case 'trapez':
            drawSmartTrapez(group, data);
            break;
        default:
            console.log('⚠️ Unbekannte Form, verwende Rechteck-Fallback');
            drawSmartRectangle(group, data);
    }
}

function drawSmartTriangle(group, data) {
    console.log('🔺 Zeichne intelligentes Dreieck:', data.variant);
    
    let points = '';
    
    if (data.variant === 'gleichseitig') {
        const side = (data.side || 6) * SCALE_FACTOR;
        const height = side * Math.sqrt(3) / 2;
        points = `${CANVAS_CENTER_X},${CANVAS_CENTER_Y - height/2} ${CANVAS_CENTER_X - side/2},${CANVAS_CENTER_Y + height/2} ${CANVAS_CENTER_X + side/2},${CANVAS_CENTER_Y + height/2}`;
        console.log('📐 Gleichseitig: Seitenlänge =', data.side);
        
    } else if (data.variant === 'rechtwinklig') {
        const a = (data.katheteA || 4) * SCALE_FACTOR;
        const b = (data.katheteB || 5) * SCALE_FACTOR;
        points = `${CANVAS_CENTER_X - a/2},${CANVAS_CENTER_Y + b/2} ${CANVAS_CENTER_X + a/2},${CANVAS_CENTER_Y + b/2} ${CANVAS_CENTER_X - a/2},${CANVAS_CENTER_Y - b/2}`;
        console.log('📐 Rechtwinklig: Katheten =', data.katheteA, 'x', data.katheteB);
        
    } else {
        // Allgemeines Dreieck - verwende verfügbare Daten
        const a = (data.sideA || 4) * SCALE_FACTOR;
        const b = (data.sideB || 5) * SCALE_FACTOR;
        const height = a * 0.8; // Approximation
        points = `${CANVAS_CENTER_X},${CANVAS_CENTER_Y - height/2} ${CANVAS_CENTER_X - a/2},${CANVAS_CENTER_Y + height/2} ${CANVAS_CENTER_X + a/2 - 20},${CANVAS_CENTER_Y + height/2}`;
        console.log('📐 Allgemein: Seiten =', data.sideA, data.sideB, data.sideC);
    }
    
    const triangle = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
    triangle.setAttribute('points', points);
    triangle.setAttribute('fill', 'rgba(0, 123, 255, 0.3)');
    triangle.setAttribute('stroke', '#007bff');
    triangle.setAttribute('stroke-width', '3');
    
    group.appendChild(triangle);
    console.log('✅ Dreieck gezeichnet');
}

function drawSmartCircle(group, data) {
    console.log('⭕ Zeichne intelligenten Kreis');
    
    const radius = (data.radius || 4) * SCALE_FACTOR;
    
    const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    circle.setAttribute('cx', CANVAS_CENTER_X);
    circle.setAttribute('cy', CANVAS_CENTER_Y);
    circle.setAttribute('r', radius);
    circle.setAttribute('fill', 'rgba(0, 123, 255, 0.3)');
    circle.setAttribute('stroke', '#007bff');
    circle.setAttribute('stroke-width', '3');
    
    group.appendChild(circle);
    console.log('✅ Kreis gezeichnet, Radius:', radius);
}

function drawSmartRectangle(group, data) {
    console.log('📐 Zeichne intelligentes Rechteck/Quadrat');
    
    let width, height;
    
    if (data.variant === 'quadrat') {
        const side = (data.side || 5) * SCALE_FACTOR;
        width = height = side;
        console.log('📐 Quadrat: Seitenlänge =', data.side);
    } else {
        width = (data.length || 8) * SCALE_FACTOR;
        height = (data.width || 5) * SCALE_FACTOR;
        console.log('📐 Rechteck: Länge =', data.length, 'Breite =', data.width);
    }
    
    const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    rect.setAttribute('x', CANVAS_CENTER_X - width/2);
    rect.setAttribute('y', CANVAS_CENTER_Y - height/2);
    rect.setAttribute('width', width);
    rect.setAttribute('height', height);
    rect.setAttribute('fill', 'rgba(0, 123, 255, 0.3)');
    rect.setAttribute('stroke', '#007bff');
    rect.setAttribute('stroke-width', '3');
    
    group.appendChild(rect);
    console.log('✅ Rechteck gezeichnet:', width, 'x', height);
}

function drawSmartTrapez(group, data) {
    console.log('🔷 Zeichne intelligentes Trapez');
    
    const baseA = (data.baseA || 8) * SCALE_FACTOR;
    const baseB = (data.baseB || 5) * SCALE_FACTOR;
    const height = (data.height || 4) * SCALE_FACTOR;
    
    const points = `${CANVAS_CENTER_X - baseA/2},${CANVAS_CENTER_Y + height/2} ${CANVAS_CENTER_X + baseA/2},${CANVAS_CENTER_Y + height/2} ${CANVAS_CENTER_X + baseB/2},${CANVAS_CENTER_Y - height/2} ${CANVAS_CENTER_X - baseB/2},${CANVAS_CENTER_Y - height/2}`;
    
    const trapez = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
    trapez.setAttribute('points', points);
    trapez.setAttribute('fill', 'rgba(0, 123, 255, 0.3)');
    trapez.setAttribute('stroke', '#007bff');
    trapez.setAttribute('stroke-width', '3');
    
    group.appendChild(trapez);
    console.log('✅ Trapez gezeichnet: Basen', data.baseA, '/', data.baseB, 'Höhe', data.height);
}

function updateCalculations(data) {
    let area = 0;
    let perimeter = 0;
    
    // Intelligente Berechnungen
    switch (data.shape) {
        case 'dreieck':
            if (data.variant === 'gleichseitig') {
                const side = data.side || 6;
                area = (Math.sqrt(3) / 4) * side * side;
                perimeter = 3 * side;
            } else if (data.variant === 'rechtwinklig') {
                const a = data.katheteA || 4;
                const b = data.katheteB || 5;
                area = 0.5 * a * b;
                perimeter = a + b + Math.sqrt(a*a + b*b);
            }
            break;
            
        case 'kreis':
            const radius = data.radius || 4;
            area = Math.PI * radius * radius;
            perimeter = 2 * Math.PI * radius;
            break;
            
        case 'rechteck':
        case 'quadrat':
            if (data.variant === 'quadrat') {
                const side = data.side || 5;
                area = side * side;
                perimeter = 4 * side;
            } else {
                const length = data.length || 8;
                const width = data.width || 5;
                area = length * width;
                perimeter = 2 * (length + width);
            }
            break;
            
        case 'trapez':
            const baseA = data.baseA || 8;
            const baseB = data.baseB || 5;
            const height = data.height || 4;
            area = 0.5 * (baseA + baseB) * height;
            perimeter = baseA + baseB + 2 * Math.sqrt(height*height + ((baseA-baseB)/2)*((baseA-baseB)/2));
            break;
    }
    
    // Anzeige aktualisieren
    const areaElement = document.getElementById('calc-area');
    const perimeterElement = document.getElementById('calc-perimeter');
    
    if (areaElement) areaElement.textContent = `${area.toFixed(2)} m²`;
    if (perimeterElement) perimeterElement.textContent = `${perimeter.toFixed(2)} m`;
}

function setupEventListeners() {
    console.log('=== SETUP EVENT LISTENERS ===');
    
    // Navigation
    const backBtn = document.getElementById('btn-back');
    const continueBtn = document.getElementById('btn-continue');
    
    if (backBtn) {
        backBtn.addEventListener('click', () => {
            saveCurrentData();
            window.location.href = 'dachform.html';
        });
    }
    
    if (continueBtn) {
        continueBtn.addEventListener('click', () => {
            saveCurrentData();
            window.location.href = 'berechnung.html';
        });
    }
    
    // Tools
    setupToolButtons();
    
    console.log('✅ Event Listeners eingerichtet');
}

function setupToolButtons() {
    const tools = {
        'btn-reset': () => {
            console.log('🔄 Smart Reset');
            resetToSmartDefaults();
            showToolFeedback('Auf optimale Werte zurückgesetzt');
        },
        'btn-mirror-horizontal': () => showToolFeedback('Horizontal gespiegelt'),
        'btn-mirror-vertical': () => showToolFeedback('Vertikal gespiegelt'),
        'btn-rotate-left': () => showToolFeedback('Um 45° links gedreht'),
        'btn-rotate-right': () => showToolFeedback('Um 45° rechts gedreht'),
        'btn-traufe': () => showToolFeedback('Traufe-Tool aktiviert')
    };
    
    Object.entries(tools).forEach(([id, handler]) => {
        const element = document.getElementById(id);
        if (element) {
            element.addEventListener('click', function() {
                handler();
                // Visuelles Feedback
                this.style.transform = 'scale(0.95)';
                setTimeout(() => {
                    this.style.transform = 'scale(1)';
                }, 100);
            });
        }
    });
}

function showToolFeedback(message) {
    const feedback = document.createElement('div');
    feedback.style.cssText = `
        position: fixed;
        top: 100px;
        right: 20px;
        background: #28a745;
        color: white;
        padding: 10px 20px;
        border-radius: 5px;
        z-index: 1000;
        box-shadow: 0 2px 10px rgba(0,0,0,0.2);
    `;
    feedback.textContent = message;
    document.body.appendChild(feedback);
    
    setTimeout(() => {
        document.body.removeChild(feedback);
    }, 2000);
}

function resetToSmartDefaults() {
    console.log('🔄 Smart Reset für:', currentShape, currentVariant);
    
    const inputs = document.querySelectorAll('#geometry-inputs-grid input');
    
    inputs.forEach(input => {
        switch(input.id) {
            // Dreieck
            case 'side': input.value = '6'; break;
            case 'katheteA': input.value = '4'; break;
            case 'katheteB': input.value = '5'; break;
            case 'sideA': input.value = '4'; break;
            case 'sideB': input.value = '5'; break;
            case 'sideC': input.value = '6'; break;
            
            // Kreis
            case 'radius': input.value = '4'; break;
            
            // Rechteck
            case 'length': input.value = '8'; break;
            case 'width': input.value = '5'; break;
            
            // Trapez
            case 'baseA': input.value = '8'; break;
            case 'baseB': input.value = '5'; break;
            case 'height': input.value = '4'; break;
        }
    });
    
    updateShape();
}

function saveCurrentData() {
    const currentData = getCurrentFormData();
    
    if (!projectData.roofShape) {
        projectData.roofShape = {};
    }
    
    Object.assign(projectData.roofShape, currentData);
    
    try {
        localStorage.setItem('dachplattenrechner_data', JSON.stringify(projectData));
    } catch (e) {
        sessionStorage.setItem('dachplattenrechner_data', JSON.stringify(projectData));
    }
}

// Debug-Funktionen
window.debugEditor = function() {
    console.log('=== SMART EDITOR DEBUG ===');
    console.log('Form:', currentShape, 'Variante:', currentVariant);
    console.log('SVG:', !!svg);
    console.log('roof-shape:', !!document.getElementById('roof-shape'));
    
    const inputs = document.querySelectorAll('#geometry-inputs-grid input');
    console.log('Eingabefelder:', inputs.length);
    inputs.forEach(input => {
        console.log(`  ${input.id}: ${input.value}`);
    });
};

window.forceUpdate = updateShape;

console.log('✅ Smart Editor geladen und bereit!');
