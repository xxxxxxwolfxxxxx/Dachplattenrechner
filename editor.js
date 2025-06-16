// editor.js – Vollständig funktionaler Editor mit Rotation und Traufe

let projectData = {};
let currentShape = '';
let currentVariant = '';
let svg;
let isUpdating = false;

// Transformation state
let currentRotation = 0; // Rotation in Grad
let isMirroredH = false; // Horizontal gespiegelt
let isMirroredV = false; // Vertikal gespiegelt
let traufePosition = 'bottom'; // Traufe-Position: top, right, bottom, left

const CANVAS_CENTER_X = 300;
const CANVAS_CENTER_Y = 200;
const SCALE_FACTOR = 25;

document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        try {
            loadProjectData();
            initializeCanvas();
            initializeUI();
            loadAndDrawShape();
            setupEventListeners();
            console.log('✅ Funktionaler Editor initialisiert');
        } catch (error) {
            console.error('❌ Editor-Fehler:', error);
        }
    }, 100);
});

function loadProjectData() {
    const dataString = localStorage.getItem('dachplattenrechner_data') || 
                       sessionStorage.getItem('dachplattenrechner_data');
    
    if (!dataString) {
        alert('Keine Projektdaten gefunden.');
        window.location.href = 'profil.html';
        return;
    }

    try {
        projectData = JSON.parse(dataString);
        
        if (!projectData.profile || !projectData.roofShape) {
            throw new Error('Unvollständige Daten');
        }
        
    } catch (e) {
        alert('Fehler beim Laden der Daten.');
        window.location.href = 'index.html';
    }
}

function initializeCanvas() {
    svg = document.getElementById('main-svg');
    
    if (!svg) {
        createFallbackCanvas();
    }
}

function createFallbackCanvas() {
    const container = document.querySelector('.canvas-container') || document.querySelector('main');
    
    if (!container) return;
    
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
}

function initializeUI() {
    displayProfileInfo();
    updateShapeTitle();
    updateDirectionInfo();
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
        'gleichseitig': 'Gleichseitiges Dreieck',
        'rechtwinklig': 'Rechtwinkliges Dreieck',
        'ungleichschenklig': 'Ungleichschenkliges Dreieck'
    };
    
    const shapeName = shapeNames[roofShape.variant] || shapeNames[roofShape.baseShape] || 'Unbekannt';
    
    const element = document.getElementById('current-shape-name');
    if (element) {
        element.textContent = shapeName;
    }
}

function updateDirectionInfo() {
    const directionElement = document.getElementById('current-direction');
    const reasonElement = document.getElementById('direction-reason');
    
    if (directionElement) {
        const direction = getRecommendedDirection();
        directionElement.textContent = direction.name;
    }
    
    if (reasonElement) {
        const reason = getDirectionReason();
        reasonElement.textContent = reason;
    }
}

function getRecommendedDirection() {
    // Basierend auf aktueller Rotation und Form
    const rotationDeg = currentRotation % 360;
    
    if (rotationDeg >= -45 && rotationDeg <= 45) {
        return { name: 'Längs (vertikal)', code: 'vertical' };
    } else if (rotationDeg >= 45 && rotationDeg <= 135) {
        return { name: 'Quer (horizontal)', code: 'horizontal' };
    } else if (rotationDeg >= 135 || rotationDeg <= -135) {
        return { name: 'Längs (gedreht)', code: 'vertical-rotated' };
    } else {
        return { name: 'Quer (gedreht)', code: 'horizontal-rotated' };
    }
}

function getDirectionReason() {
    const traufeNames = {
        'top': 'oben',
        'right': 'rechts', 
        'bottom': 'unten',
        'left': 'links'
    };
    
    return `Traufe ${traufeNames[traufePosition]}, Rotation ${currentRotation}°`;
}

function loadAndDrawShape() {
    const roofShape = projectData.roofShape;
    if (!roofShape) return;
    
    currentShape = roofShape.baseShape;
    currentVariant = roofShape.variant;
    
    createInputFields();
    updateShape();
}

function createInputFields() {
    const container = document.getElementById('geometry-inputs-grid');
    if (!container) return;
    
    container.innerHTML = '';
    
    // Erstelle passende Eingabefelder
    if (currentShape === 'dreieck') {
        switch (currentVariant) {
            case 'gleichseitig':
                container.appendChild(createInput('Seitenlänge (m)', 'side', '6'));
                break;
            case 'rechtwinklig':
                container.appendChild(createInput('Kathete A (m)', 'katheteA', '4'));
                container.appendChild(createInput('Kathete B (m)', 'katheteB', '5'));
                break;
            default:
                container.appendChild(createInput('Seite A (m)', 'sideA', '4'));
                container.appendChild(createInput('Seite B (m)', 'sideB', '5'));
                container.appendChild(createInput('Seite C (m)', 'sideC', '6'));
        }
    } else if (currentShape === 'kreis') {
        container.appendChild(createInput('Radius (m)', 'radius', '4'));
    } else if (currentShape === 'rechteck' || currentShape === 'quadrat') {
        if (currentVariant === 'quadrat') {
            container.appendChild(createInput('Seitenlänge (m)', 'side', '5'));
        } else {
            container.appendChild(createInput('Länge (m)', 'length', '8'));
            container.appendChild(createInput('Breite (m)', 'width', '5'));
        }
    } else if (currentShape === 'trapez') {
        container.appendChild(createInput('Basis A (m)', 'baseA', '8'));
        container.appendChild(createInput('Basis B (m)', 'baseB', '5'));
        container.appendChild(createInput('Höhe (m)', 'height', '4'));
    } else {
        // Fallback
        container.appendChild(createInput('Länge (m)', 'length', '8'));
        container.appendChild(createInput('Breite (m)', 'width', '5'));
    }
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
    
    // Event Listeners
    input.addEventListener('input', handleInputChange);
    input.addEventListener('change', handleInputChange);
    
    const unit = document.createElement('span');
    unit.className = 'input-unit';
    unit.textContent = 'm';
    
    inputWrapper.appendChild(input);
    inputWrapper.appendChild(unit);
    wrapper.appendChild(label);
    wrapper.appendChild(inputWrapper);
    
    return wrapper;
}

function handleInputChange() {
    if (isUpdating) return;
    
    isUpdating = true;
    updateShape();
    setTimeout(() => {
        isUpdating = false;
    }, 50);
}

function updateShape() {
    if (!svg || isUpdating) return;
    
    const shapeGroup = document.getElementById('roof-shape');
    if (!shapeGroup) return;
    
    // Gruppe leeren
    shapeGroup.innerHTML = '';
    
    // Aktuelle Daten sammeln
    const currentData = getCurrentFormData();
    
    // Form zeichnen mit Transformationen
    drawTransformedShape(shapeGroup, currentData);
    
    // Berechnungen aktualisieren
    updateCalculations(currentData);
    
    // Richtungsinfo aktualisieren
    updateDirectionInfo();
}

function getCurrentFormData() {
    const data = { 
        shape: currentShape,
        variant: currentVariant 
    };
    
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

function drawTransformedShape(group, data) {
    // Erstelle eine Transform-Gruppe
    const transformGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    
    // Berechne Transformationen
    let transform = `translate(${CANVAS_CENTER_X}, ${CANVAS_CENTER_Y})`;
    
    // Rotation
    if (currentRotation !== 0) {
        transform += ` rotate(${currentRotation})`;
    }
    
    // Spiegelung
    let scaleX = isMirroredH ? -1 : 1;
    let scaleY = isMirroredV ? -1 : 1;
    if (scaleX !== 1 || scaleY !== 1) {
        transform += ` scale(${scaleX}, ${scaleY})`;
    }
    
    // Zurück zum Ursprung für das Zeichnen
    transform += ` translate(${-CANVAS_CENTER_X}, ${-CANVAS_CENTER_Y})`;
    
    transformGroup.setAttribute('transform', transform);
    
    // Form in die Transform-Gruppe zeichnen
    drawShape(transformGroup, data);
    
    // Transform-Gruppe zur Haupt-Gruppe hinzufügen
    group.appendChild(transformGroup);
}

function drawShape(group, data) {
    switch (data.shape) {
        case 'dreieck':
            drawTriangle(group, data);
            break;
        case 'kreis':
            drawCircle(group, data);
            break;
        case 'rechteck':
        case 'quadrat':
            drawRectangle(group, data);
            break;
        case 'trapez':
            drawTrapez(group, data);
            break;
        default:
            drawRectangle(group, data);
    }
}

function drawTriangle(group, data) {
    let points = '';
    
    if (data.variant === 'gleichseitig') {
        const side = (data.side || 6) * SCALE_FACTOR;
        const height = side * Math.sqrt(3) / 2;
        points = `${CANVAS_CENTER_X},${CANVAS_CENTER_Y - height/2} ${CANVAS_CENTER_X - side/2},${CANVAS_CENTER_Y + height/2} ${CANVAS_CENTER_X + side/2},${CANVAS_CENTER_Y + height/2}`;
    } else if (data.variant === 'rechtwinklig') {
        const a = (data.katheteA || 4) * SCALE_FACTOR;
        const b = (data.katheteB || 5) * SCALE_FACTOR;
        points = `${CANVAS_CENTER_X - a/2},${CANVAS_CENTER_Y + b/2} ${CANVAS_CENTER_X + a/2},${CANVAS_CENTER_Y + b/2} ${CANVAS_CENTER_X - a/2},${CANVAS_CENTER_Y - b/2}`;
    } else {
        const a = (data.sideA || 4) * SCALE_FACTOR;
        const height = a * 0.8;
        points = `${CANVAS_CENTER_X},${CANVAS_CENTER_Y - height/2} ${CANVAS_CENTER_X - a/2},${CANVAS_CENTER_Y + height/2} ${CANVAS_CENTER_X + a/2 - 20},${CANVAS_CENTER_Y + height/2}`;
    }
    
    const triangle = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
    triangle.setAttribute('points', points);
    triangle.setAttribute('fill', 'rgba(0, 123, 255, 0.3)');
    triangle.setAttribute('stroke', '#007bff');
    triangle.setAttribute('stroke-width', '3');
    
    group.appendChild(triangle);
}

function drawCircle(group, data) {
    const radius = (data.radius || 4) * SCALE_FACTOR;
    
    const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    circle.setAttribute('cx', CANVAS_CENTER_X);
    circle.setAttribute('cy', CANVAS_CENTER_Y);
    circle.setAttribute('r', radius);
    circle.setAttribute('fill', 'rgba(0, 123, 255, 0.3)');
    circle.setAttribute('stroke', '#007bff');
    circle.setAttribute('stroke-width', '3');
    
    group.appendChild(circle);
}

function drawRectangle(group, data) {
    let width, height;
    
    if (data.variant === 'quadrat') {
        const side = (data.side || 5) * SCALE_FACTOR;
        width = height = side;
    } else {
        width = (data.length || 8) * SCALE_FACTOR;
        height = (data.width || 5) * SCALE_FACTOR;
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
}

function drawTrapez(group, data) {
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
}

function updateCalculations(data) {
    let area = 0;
    let perimeter = 0;
    
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
    
    const areaElement = document.getElementById('calc-area');
    const perimeterElement = document.getElementById('calc-perimeter');
    
    if (areaElement) areaElement.textContent = `${area.toFixed(2)} m²`;
    if (perimeterElement) perimeterElement.textContent = `${perimeter.toFixed(2)} m`;
}

function setupEventListeners() {
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
    
    // Tools mit echter Funktionalität
    setupToolButtons();
}

function setupToolButtons() {
    const tools = {
        'btn-reset': resetToDefaults,
        'btn-mirror-horizontal': () => {
            isMirroredH = !isMirroredH;
            updateShape();
            showFeedback(isMirroredH ? 'Horizontal gespiegelt' : 'Horizontale Spiegelung aufgehoben');
        },
        'btn-mirror-vertical': () => {
            isMirroredV = !isMirroredV;
            updateShape();
            showFeedback(isMirroredV ? 'Vertikal gespiegelt' : 'Vertikale Spiegelung aufgehoben');
        },
        'btn-rotate-left': () => {
            currentRotation -= 45;
            if (currentRotation <= -180) currentRotation += 360;
            updateShape();
            showFeedback(`Um 45° links gedreht (${currentRotation}°)`);
        },
        'btn-rotate-right': () => {
            currentRotation += 45;
            if (currentRotation >= 180) currentRotation -= 360;
            updateShape();
            showFeedback(`Um 45° rechts gedreht (${currentRotation}°)`);
        },
        'btn-traufe': selectTraufePosition
    };
    
    Object.entries(tools).forEach(([id, handler]) => {
        const element = document.getElementById(id);
        if (element) {
            element.addEventListener('click', handler);
        }
    });
}

function selectTraufePosition() {
    // Erstelle Traufe-Auswahl-Dialog mit klarerer Beschreibung
    const overlay = document.createElement('div');
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.7);
        z-index: 10000;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        color: white;
        font-family: Arial, sans-serif;
    `;
    
    overlay.innerHTML = `
        <h3 style="margin-bottom: 20px; font-size: 24px; text-align: center;">Traufe-Position bestimmen</h3>
        <p style="margin-bottom: 30px; text-align: center; font-size: 16px; max-width: 500px; line-height: 1.4;">
            Welche Seite Ihrer Form ist die <strong>Traufe</strong> (Dachrand)?<br>
            Die gewählte Seite wird automatisch nach unten ausgerichtet.
        </p>
        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; margin-bottom: 20px;">
            <button onclick="setTraufePosition('top')" style="padding: 20px 30px; font-size: 14px; cursor: pointer; border: none; border-radius: 8px; background: #007bff; color: white; text-align: center;">
                ↑<br><strong>Obere Seite</strong><br><small>ist Traufe</small>
            </button>
            <button onclick="setTraufePosition('right')" style="padding: 20px 30px; font-size: 14px; cursor: pointer; border: none; border-radius: 8px; background: #007bff; color: white; text-align: center;">
                →<br><strong>Rechte Seite</strong><br><small>ist Traufe</small>
            </button>
            <button onclick="setTraufePosition('bottom')" style="padding: 20px 30px; font-size: 14px; cursor: pointer; border: none; border-radius: 8px; background: #28a745; color: white; text-align: center;">
                ↓<br><strong>Untere Seite</strong><br><small>ist Traufe</small>
            </button>
            <button onclick="setTraufePosition('left')" style="padding: 20px 30px; font-size: 14px; cursor: pointer; border: none; border-radius: 8px; background: #007bff; color: white; text-align: center;">
                ←<br><strong>Linke Seite</strong><br><small>ist Traufe</small>
            </button>
        </div>
        <button onclick="closeTraufeDialog()" style="margin-top: 10px; padding: 12px 24px; background: #6c757d; color: white; border: none; cursor: pointer; border-radius: 8px;">Abbrechen</button>
    `;
    
    document.body.appendChild(overlay);
}

// Globale Funktionen für Traufe-Dialog
window.setTraufePosition = function(position) {
    traufePosition = position;
    
    // KORRIGIERTE Rotation: Die gewählte Seite nach UNTEN drehen
    switch(position) {
        case 'top':
            // Obere Seite nach unten → 180° drehen (richtig)
            currentRotation = 180;
            break;
        case 'right':
            // Rechte Seite nach unten → 90° nach rechts drehen (war falsch: -90°)
            currentRotation = 90;
            break;
        case 'bottom':
            // Untere Seite ist schon unten → keine Drehung (richtig)
            currentRotation = 0;
            break;
        case 'left':
            // Linke Seite nach unten → 90° nach links drehen (war falsch: 90°)
            currentRotation = -90;
            break;
    }
    
    updateShape();
    closeTraufeDialog();
    
    const positionNames = {
        'top': 'oben',
        'right': 'rechts',
        'bottom': 'unten',
        'left': 'links'
    };
    
    showFeedback(`Traufe-Seite "${positionNames[position]}" nach unten gedreht (${currentRotation}°)`);
};

window.closeTraufeDialog = function() {
    const overlays = document.querySelectorAll('[style*="position: fixed"]');
    overlays.forEach(overlay => {
        if (overlay.parentNode) {
            overlay.parentNode.removeChild(overlay);
        }
    });
};

function showFeedback(message) {
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
        if (feedback.parentNode) {
            document.body.removeChild(feedback);
        }
    }, 3000);
}

function resetToDefaults() {
    // Reset Transformationen
    currentRotation = 0;
    isMirroredH = false;
    isMirroredV = false;
    traufePosition = 'bottom';
    
    // Reset Eingabefelder
    const inputs = document.querySelectorAll('#geometry-inputs-grid input');
    
    inputs.forEach(input => {
        switch(input.id) {
            case 'side': input.value = currentVariant === 'quadrat' ? '5' : '6'; break;
            case 'katheteA': input.value = '4'; break;
            case 'katheteB': input.value = '5'; break;
            case 'sideA': input.value = '4'; break;
            case 'sideB': input.value = '5'; break;
            case 'sideC': input.value = '6'; break;
            case 'radius': input.value = '4'; break;
            case 'length': input.value = '8'; break;
            case 'width': input.value = '5'; break;
            case 'baseA': input.value = '8'; break;
            case 'baseB': input.value = '5'; break;
            case 'height': input.value = '4'; break;
        }
    });
    
    updateShape();
    showFeedback('Komplett zurückgesetzt: Form, Rotation und Spiegelung');
}

function saveCurrentData() {
    const currentData = getCurrentFormData();
    
    // Füge Transformationsdaten hinzu
    currentData.rotation = currentRotation;
    currentData.mirroredH = isMirroredH;
    currentData.mirroredV = isMirroredV;
    currentData.traufePosition = traufePosition;
    
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

console.log('✅ Funktionaler Editor mit Rotation und Traufe geladen');
