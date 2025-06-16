// editor.js – Reparierte Version mit voller Interaktivität

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
const SCALE_FACTOR = 20; // ERHÖHT von 10 auf 20 für größere Formen

document.addEventListener('DOMContentLoaded', () => {
    console.log('=== EDITOR WIRD INITIALISIERT ===');
    
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
            
            console.log('✅ Editor erfolgreich initialisiert');
        } catch (error) {
            console.error('❌ Fehler bei Editor-Initialisierung:', error);
        }
    }, 100);
});

function loadProjectData() {
    console.log('=== EDITOR: LADE PROJEKTDATEN ===');
    
    const dataString = localStorage.getItem('dachplattenrechner_data') || 
                       sessionStorage.getItem('dachplattenrechner_data');
    
    console.log('Rohe Daten aus Storage:', dataString);
    
    if (!dataString) {
        console.error('❌ Keine Projektdaten gefunden - Weiterleitung zu Schritt 1');
        alert('Keine Projektdaten gefunden. Sie werden zu Schritt 1 weitergeleitet.');
        window.location.href = 'profil.html';
        return;
    }

    try {
        projectData = JSON.parse(dataString);
        console.log('✅ Projektdaten erfolgreich geparst:', projectData);
        
        // Detaillierte Validierung
        if (!projectData.profile) {
            console.error('❌ Keine Profil-Daten gefunden');
            throw new Error('Keine Profil-Daten vorhanden');
        }
        
        if (!projectData.roofShape) {
            console.error('❌ Keine Dachform-Daten gefunden');
            throw new Error('Keine Dachform-Daten vorhanden');
        }
        
        console.log('✅ Alle notwendigen Daten vorhanden');
        console.log('Profil:', projectData.profile);
        console.log('Dachform:', projectData.roofShape);
        
    } catch (e) {
        console.error('❌ Fehler beim Laden der Projektdaten:', e);
        
        // Spezifische Fehlerbehandlung
        if (e.message.includes('Profil')) {
            alert('Profil-Daten fehlen. Sie werden zu Schritt 1 weitergeleitet.');
            window.location.href = 'profil.html';
        } else if (e.message.includes('Dachform')) {
            alert('Dachform-Daten fehlen. Sie werden zu Schritt 2 weitergeleitet.');
            window.location.href = 'dachform.html';
        } else {
            alert('Fehler beim Laden der Projektdaten. Bitte starten Sie neu.');
            window.location.href = 'index.html';
        }
    }
}

function initializeCanvas() {
    console.log('=== INITIALISIERE CANVAS ===');
    
    // SVG Element holen
    svg = document.getElementById('main-svg');
    
    if (!svg) {
        console.error('❌ SVG Element nicht gefunden!');
        // Fallback: Canvas dynamisch erstellen falls nicht vorhanden
        createFallbackCanvas();
        return;
    }
    
    console.log('✅ SVG Element gefunden:', svg);
}

function createFallbackCanvas() {
    console.log('Erstelle Fallback-Canvas...');
    
    // Finde Container
    const container = document.querySelector('.canvas-container') || 
                     document.querySelector('.editor-section') ||
                     document.querySelector('main');
    
    if (!container) {
        console.error('❌ Kein geeigneter Container gefunden');
        return;
    }
    
    // Erstelle Canvas-Wrapper
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
    
    // Erstelle SVG
    svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.id = 'main-svg';
    svg.setAttribute('width', '600');
    svg.setAttribute('height', '400');
    svg.setAttribute('viewBox', '0 0 600 400');
    
    // Grid-Pattern hinzufügen
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
    
    // Profil-Info anzeigen
    displayProfileInfo();
    
    // Shape-Name anzeigen
    updateShapeTitle();
}

function displayProfileInfo() {
    console.log('=== ZEIGE PROFIL-INFO ===');
    
    const profile = projectData.profile;
    if (!profile) {
        console.log('❌ Keine Profil-Daten zum Anzeigen');
        return;
    }
    
    // Sichere Element-Zugriffe
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
            console.log(`✅ ${id} gesetzt: ${value}`);
        } else {
            console.log(`⚠️ Element ${id} nicht gefunden`);
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
    
    const element = document.getElementById('current-shape-name');
    if (element) {
        element.textContent = shapeName;
        console.log('✅ Shape-Name gesetzt:', shapeName);
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
    
    console.log('Lade Form:', currentShape, currentVariant);
    
    // Eingabefelder erstellen
    createInputFields();
    
    // Initial zeichnen
    updateShape();
}

function createInputFields() {
    console.log('=== ERSTELLE EINGABEFELDER ===');
    
    const container = document.getElementById('geometry-inputs-grid');
    if (!container) {
        console.error('❌ Eingabefeld-Container nicht gefunden');
        return;
    }
    
    container.innerHTML = '';
    
    // Eingabefelder basierend auf Form
    switch (currentShape) {
        case 'rechteck':
        case 'quadrat':
            container.appendChild(createInput('Länge (m)', 'length', '8'));
            container.appendChild(createInput('Breite (m)', 'width', '5'));
            break;
            
        case 'kreis':
            container.appendChild(createInput('Radius (m)', 'radius', '4'));
            break;
            
        case 'dreieck':
            if (currentVariant === 'gleichseitig') {
                container.appendChild(createInput('Seitenlänge (m)', 'side', '6'));
            } else if (currentVariant === 'rechtwinklig') {
                container.appendChild(createInput('Kathete A (m)', 'katheteA', '5'));
                container.appendChild(createInput('Kathete B (m)', 'katheteB', '6'));
            } else {
                container.appendChild(createInput('Seite A (m)', 'sideA', '5'));
                container.appendChild(createInput('Seite B (m)', 'sideB', '6'));
                container.appendChild(createInput('Seite C (m)', 'sideC', '7'));
            }
            break;
            
        case 'trapez':
            container.appendChild(createInput('Basis A (m)', 'baseA', '8'));
            container.appendChild(createInput('Basis B (m)', 'baseB', '5'));
            container.appendChild(createInput('Höhe (m)', 'height', '4'));
            break;
            
        default:
            container.appendChild(createInput('Länge (m)', 'length', '8'));
            container.appendChild(createInput('Breite (m)', 'width', '5'));
    }
    
    console.log('✅ Eingabefelder erstellt für:', currentShape);
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
    
    // WICHTIG: Event Listeners direkt hinzufügen
    input.addEventListener('input', function() {
        console.log('Input geändert:', id, this.value);
        updateShape();
    });
    input.addEventListener('change', function() {
        console.log('Input final geändert:', id, this.value);
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
    console.log('=== AKTUALISIERE FORM ===');
    
    if (!svg) {
        console.log('❌ SVG nicht verfügbar');
        return;
    }
    
    // SVG Form-Gruppe leeren
    const shapeGroup = document.getElementById('roof-shape');
    if (shapeGroup) {
        shapeGroup.innerHTML = '';
        
        // Aktuelle Daten sammeln
        const currentData = getCurrentFormData();
        console.log('Aktuelle Form-Daten:', currentData);
        
        // Einfache Form zeichnen
        drawShape(shapeGroup, currentData);
        
        // Berechnungen aktualisieren
        updateCalculations(currentData);
        
        console.log('✅ Form aktualisiert');
    }
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
            }
        }
    });
    
    return data;
}

function drawShape(group, data) {
    console.log('=== ZEICHNE FORM ===', currentShape, data);
    
    switch (currentShape) {
        case 'rechteck':
        case 'quadrat':
            drawRectangle(group, data);
            break;
        case 'kreis':
            drawCircle(group, data);
            break;
        case 'dreieck':
            drawTriangle(group, data);
            break;
        case 'trapez':
            drawTrapez(group, data);
            break;
        default:
            drawRectangle(group, data); // Fallback
    }
}

function drawRectangle(group, data) {
    const length = (data.length || 8) * SCALE_FACTOR;
    const width = (data.width || 5) * SCALE_FACTOR;
    
    const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    rect.setAttribute('x', CANVAS_CENTER_X - length/2);
    rect.setAttribute('y', CANVAS_CENTER_Y - width/2);
    rect.setAttribute('width', length);
    rect.setAttribute('height', width);
    rect.setAttribute('fill', 'rgba(0, 123, 255, 0.3)');
    rect.setAttribute('stroke', '#007bff');
    rect.setAttribute('stroke-width', '2');
    group.appendChild(rect);
    
    console.log('✅ Rechteck gezeichnet:', length, 'x', width);
}

function drawCircle(group, data) {
    const radius = (data.radius || 4) * SCALE_FACTOR;
    
    const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    circle.setAttribute('cx', CANVAS_CENTER_X);
    circle.setAttribute('cy', CANVAS_CENTER_Y);
    circle.setAttribute('r', radius);
    circle.setAttribute('fill', 'rgba(0, 123, 255, 0.3)');
    circle.setAttribute('stroke', '#007bff');
    circle.setAttribute('stroke-width', '2');
    group.appendChild(circle);
    
    console.log('✅ Kreis gezeichnet, Radius:', radius);
}

function drawTriangle(group, data) {
    let points = '';
    
    if (currentVariant === 'gleichseitig') {
        const side = (data.side || 6) * SCALE_FACTOR;
        const height = side * Math.sqrt(3) / 2;
        points = `${CANVAS_CENTER_X},${CANVAS_CENTER_Y - height/2} ${CANVAS_CENTER_X - side/2},${CANVAS_CENTER_Y + height/2} ${CANVAS_CENTER_X + side/2},${CANVAS_CENTER_Y + height/2}`;
    } else if (currentVariant === 'rechtwinklig') {
        const a = (data.katheteA || 5) * SCALE_FACTOR;
        const b = (data.katheteB || 6) * SCALE_FACTOR;
        points = `${CANVAS_CENTER_X - a/2},${CANVAS_CENTER_Y + b/2} ${CANVAS_CENTER_X + a/2},${CANVAS_CENTER_Y + b/2} ${CANVAS_CENTER_X - a/2},${CANVAS_CENTER_Y - b/2}`;
    } else {
        // Allgemeines Dreieck
        const base = 120;
        const height = 100;
        points = `${CANVAS_CENTER_X},${CANVAS_CENTER_Y - height/2} ${CANVAS_CENTER_X - base/2},${CANVAS_CENTER_Y + height/2} ${CANVAS_CENTER_X + base/2},${CANVAS_CENTER_Y + height/2}`;
    }
    
    const triangle = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
    triangle.setAttribute('points', points);
    triangle.setAttribute('fill', 'rgba(0, 123, 255, 0.3)');
    triangle.setAttribute('stroke', '#007bff');
    triangle.setAttribute('stroke-width', '2');
    group.appendChild(triangle);
    
    console.log('✅ Dreieck gezeichnet');
}

function drawTrapez(group, data) {
    const baseA = (data.baseA || 8) * SCALE_FACTOR;
    const baseB = (data.baseB || 5) * SCALE_FACTOR;
    const height = (data.height || 4) * SCALE_FACTOR;
    const dx = (baseA - baseB) / 2;
    
    const points = `${CANVAS_CENTER_X - baseA/2},${CANVAS_CENTER_Y + height/2} ${CANVAS_CENTER_X + baseA/2},${CANVAS_CENTER_Y + height/2} ${CANVAS_CENTER_X + baseB/2},${CANVAS_CENTER_Y - height/2} ${CANVAS_CENTER_X - baseB/2},${CANVAS_CENTER_Y - height/2}`;
    
    const trapez = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
    trapez.setAttribute('points', points);
    trapez.setAttribute('fill', 'rgba(0, 123, 255, 0.3)');
    trapez.setAttribute('stroke', '#007bff');
    trapez.setAttribute('stroke-width', '2');
    group.appendChild(trapez);
    
    console.log('✅ Trapez gezeichnet');
}

function updateCalculations(data) {
    let area = 0;
    let perimeter = 0;
    
    // Berechnungen basierend auf Form
    switch (currentShape) {
        case 'rechteck':
        case 'quadrat':
            const length = data.length || 8;
            const width = data.width || 5;
            area = length * width;
            perimeter = 2 * (length + width);
            break;
            
        case 'kreis':
            const radius = data.radius || 4;
            area = Math.PI * radius * radius;
            perimeter = 2 * Math.PI * radius;
            break;
            
        case 'dreieck':
            if (currentVariant === 'gleichseitig') {
                const side = data.side || 6;
                area = (Math.sqrt(3) / 4) * side * side;
                perimeter = 3 * side;
            } else if (currentVariant === 'rechtwinklig') {
                const a = data.katheteA || 5;
                const b = data.katheteB || 6;
                area = 0.5 * a * b;
                perimeter = a + b + Math.sqrt(a*a + b*b);
            }
            break;
            
        case 'trapez':
            const baseA = data.baseA || 8;
            const baseB = data.baseB || 5;
            const height = data.height || 4;
            area = 0.5 * (baseA + baseB) * height;
            // Vereinfachte Umfang-Berechnung
            perimeter = baseA + baseB + 2 * Math.sqrt(height*height + ((baseA-baseB)/2)*((baseA-baseB)/2));
            break;
    }
    
    // Anzeige aktualisieren
    const areaElement = document.getElementById('calc-area');
    const perimeterElement = document.getElementById('calc-perimeter');
    
    if (areaElement) areaElement.textContent = `${area.toFixed(2)} m²`;
    if (perimeterElement) perimeterElement.textContent = `${perimeter.toFixed(2)} m`;
    
    console.log('✅ Berechnungen aktualisiert:', { area, perimeter });
}

function setupEventListeners() {
    console.log('=== SETUP EVENT LISTENERS ===');
    
    // Navigation
    const backBtn = document.getElementById('btn-back');
    const continueBtn = document.getElementById('btn-continue');
    
    if (backBtn) {
        backBtn.addEventListener('click', () => {
            console.log('Zurück-Button geklickt');
            saveCurrentData();
            window.location.href = 'dachform.html';
        });
    }
    
    if (continueBtn) {
        continueBtn.addEventListener('click', () => {
            console.log('Weiter-Button geklickt');
            saveCurrentData();
            window.location.href = 'berechnung.html';
        });
    }
    
    // Tools mit visueller Rückmeldung
    const tools = {
        'btn-mirror-horizontal': () => {
            console.log('Horizontal spiegeln');
            showToolFeedback('Horizontal gespiegelt');
        },
        'btn-mirror-vertical': () => {
            console.log('Vertikal spiegeln');
            showToolFeedback('Vertikal gespiegelt');
        },
        'btn-rotate-left': () => {
            console.log('Links rotieren');
            showToolFeedback('Um 45° links gedreht');
        },
        'btn-rotate-right': () => {
            console.log('Rechts rotieren');
            showToolFeedback('Um 45° rechts gedreht');
        },
        'btn-reset': () => {
            console.log('Form zurücksetzen');
            resetToDefaults();
            showToolFeedback('Auf Standardwerte zurückgesetzt');
        },
        'btn-traufe': () => {
            console.log('Traufe-Tool');
            showToolFeedback('Traufe-Tool aktiviert');
        }
    };
    
    Object.entries(tools).forEach(([id, handler]) => {
        const element = document.getElementById(id);
        if (element) {
            element.addEventListener('click', function() {
                console.log(`${id} geklickt`);
                handler();
                
                // Visuelles Feedback
                this.style.transform = 'scale(0.95)';
                setTimeout(() => {
                    this.style.transform = 'scale(1)';
                }, 100);
            });
        }
    });
    
    console.log('✅ Event Listeners eingerichtet');
}

function showToolFeedback(message) {
    // Temporäre Nachricht anzeigen
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

function resetToDefaults() {
    // Setze Standardwerte in Eingabefelder
    const inputs = document.querySelectorAll('#geometry-inputs-grid input');
    inputs.forEach(input => {
        switch(input.id) {
            case 'length': input.value = '8'; break;
            case 'width': input.value = '5'; break;
            case 'radius': input.value = '4'; break;
            case 'side': input.value = '6'; break;
            case 'katheteA': input.value = '5'; break;
            case 'katheteB': input.value = '6'; break;
            case 'baseA': input.value = '8'; break;
            case 'baseB': input.value = '5'; break;
            case 'height': input.value = '4'; break;
        }
    });
    
    // Form neu zeichnen
    updateShape();
}

function saveCurrentData() {
    console.log('=== SPEICHERE AKTUELLE DATEN ===');
    
    const currentData = getCurrentFormData();
    
    if (!projectData.roofShape) {
        projectData.roofShape = {};
    }
    
    // Form-spezifische Daten speichern
    Object.assign(projectData.roofShape, currentData);
    
    // In Storage speichern
    try {
        localStorage.setItem('dachplattenrechner_data', JSON.stringify(projectData));
        console.log('✅ Daten gespeichert:', projectData);
    } catch (e) {
        sessionStorage.setItem('dachplattenrechner_data', JSON.stringify(projectData));
    }
}

// Export für globalen Zugriff
window.updateShape = updateShape;
console.log('✅ Editor-Script geladen und bereit!');
