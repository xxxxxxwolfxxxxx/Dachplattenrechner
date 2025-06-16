// editor.js – Korrigierte und vollständige Version

let projectData = {};
let currentShape = '';
let currentVariant = '';
let svg;
let isUpdating = false;

// Transformation state
let currentRotation = 0;
let isMirroredH = false;
let isMirroredV = false;
let traufePosition = 'bottom';

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
            console.log('✅ Editor initialisiert');
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
        'parallelogramm': 'Parallelogramm',
        'trapez': 'Trapez',
        'rhombus': 'Rhombus',
        'kreis': 'Kreis',
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

function determineActualShape() {
    // Spezialfall: Quadrat
    if (currentVariant === 'quadrat') {
        return 'quadrat';
    }
    
    // Spezialfall: Trapez
    if (currentVariant === 'trapez') {
        return 'trapez';
    }
    
    // Spezialfall: Parallelogramm
    if (currentVariant === 'parallelogramm') {
        return 'parallelogramm';
    }
    
    // Spezialfall: Rhombus
    if (currentVariant === 'rhombus') {
        return 'rhombus';
    }
    
    // Spezialfall: Langloch
    if (currentVariant === 'langloch') {
        return 'langloch';
    }
    
    // Spezialfall: Vielecke
    if (['fuenfeck', 'sechseck', 'achteck', 'lform', 'tform', 'uform'].includes(currentVariant)) {
        return 'vieleck';
    }
    
    return currentShape || 'rechteck';
}

function determineActualVariant() {
    const validVariants = {
        'dreieck': ['gleichseitig', 'rechtwinklig', 'ungleichschenklig', 'allgemein'],
        'kreis': ['kreis', 'vollkreis', 'halbkreis', 'viertelkreis', 'oval'],
        'rechteck': ['rechteck'],
        'quadrat': ['quadrat'],
        'trapez': ['trapez'],
        'parallelogramm': ['parallelogramm'],
        'rhombus': ['rhombus'],
        'langloch': ['langloch'],
        'vieleck': ['fuenfeck', 'sechseck', 'achteck', 'lform', 'tform', 'uform']
    };
    
    const finalShape = determineActualShape();
    
    if (validVariants[finalShape] && validVariants[finalShape].includes(currentVariant)) {
        return currentVariant;
    }
    
    return validVariants[finalShape] ? validVariants[finalShape][0] : 'standard';
}

function createInputFields() {
    const container = document.getElementById('geometry-inputs-grid');
    if (!container) return;
    
    container.innerHTML = '';
    
    const finalShape = determineActualShape();
    const finalVariant = determineActualVariant();
    
    if (finalShape === 'dreieck') {
        createTriangleInputs(finalVariant, container);
    } else if (finalShape === 'kreis') {
        createCircleInputs(finalVariant, container);
    } else if (finalShape === 'rechteck') {
        createRectangleInputs('rechteck', container);
    } else if (finalShape === 'quadrat') {
        createRectangleInputs('quadrat', container);
    } else if (finalShape === 'trapez') {
        createTrapezInputs(container);
    } else if (finalShape === 'parallelogramm') {
        createParallelogrammInputs(container);
    } else if (finalShape === 'rhombus') {
        createRhombusInputs(container);
    } else if (finalShape === 'langloch') {
        createLanglochInputs(container);
    } else if (finalShape === 'vieleck') {
        createPolygonInputs(finalVariant, container);
    } else {
        createRectangleInputs('rechteck', container);
    }
}

function createTriangleInputs(variant, container) {
    switch (variant) {
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
}

function createCircleInputs(variant, container) {
    switch (variant) {
        case 'oval':
            container.appendChild(createInput('Halbachse A (m)', 'radiusA', '5'));
            container.appendChild(createInput('Halbachse B (m)', 'radiusB', '3'));
            break;
        default:
            container.appendChild(createInput('Radius (m)', 'radius', '4'));
    }
}

function createRectangleInputs(variant, container) {
    if (variant === 'quadrat') {
        container.appendChild(createInput('Seitenlänge (m)', 'side', '5'));
    } else {
        container.appendChild(createInput('Länge (m)', 'length', '8'));
        container.appendChild(createInput('Breite (m)', 'width', '5'));
    }
}

function createTrapezInputs(container) {
    container.appendChild(createInput('Basis A (m)', 'baseA', '8'));
    container.appendChild(createInput('Basis B (m)', 'baseB', '5'));
    container.appendChild(createInput('Höhe (m)', 'height', '4'));
}

function createParallelogrammInputs(container) {
    container.appendChild(createInput('Basis (m)', 'base', '8'));
    container.appendChild(createInput('Seite (m)', 'side', '5'));
    container.appendChild(createInput('Höhe (m)', 'height', '4'));
}

function createRhombusInputs(container) {
    container.appendChild(createInput('Seitenlänge (m)', 'side', '5'));
    container.appendChild(createInput('Höhe (m)', 'height', '4'));
}

function createLanglochInputs(container) {
    container.appendChild(createInput('Länge (m)', 'length', '8'));
    container.appendChild(createInput('Breite (m)', 'width', '3'));
    container.appendChild(createInput('Eckenradius (m)', 'radius', '1'));
}

function createPolygonInputs(variant, container) {
    switch (variant) {
        case 'fuenfeck':
        case 'sechseck':
        case 'achteck':
            container.appendChild(createInput('Seitenlänge (m)', 'side', '5'));
            break;
        default:
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
    
    // MEHRERE Event Listener für sofortige Reaktion
    input.addEventListener('input', handleInputChange);      // Während dem Tippen
    input.addEventListener('change', handleInputChange);     // Nach Änderung
    input.addEventListener('keyup', handleInputChange);      // Nach Tastendruck
    input.addEventListener('blur', handleInputChange);       // Beim Verlassen des Feldes
    
    console.log('Input-Feld erstellt:', id, 'mit Wert:', defaultValue);
    
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
    
    console.log('Input geändert, aktualisiere Form...');
    
    // Direkte Aktualisierung ohne isUpdating Block
    updateShape();
}

function updateShape() {
    if (!svg) {
        console.log('SVG nicht verfügbar');
        return;
    }
    
    const shapeGroup = document.getElementById('roof-shape');
    if (!shapeGroup) {
        console.log('Shape-Group nicht gefunden');
        return;
    }
    
    console.log('Aktualisiere Form...');
    
    shapeGroup.innerHTML = '';
    
    const currentData = getCurrentFormData();
    console.log('Aktuelle Form-Daten:', currentData);
    
    drawTransformedShape(shapeGroup, currentData);
    updateCalculations(currentData);
    updateDirectionInfo();
    
    console.log('Form erfolgreich aktualisiert');
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
    const transformGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    
    let transform = `translate(${CANVAS_CENTER_X}, ${CANVAS_CENTER_Y})`;
    
    if (currentRotation !== 0) {
        transform += ` rotate(${currentRotation})`;
    }
    
    let scaleX = isMirroredH ? -1 : 1;
    let scaleY = isMirroredV ? -1 : 1;
    if (scaleX !== 1 || scaleY !== 1) {
        transform += ` scale(${scaleX}, ${scaleY})`;
    }
    
    transform += ` translate(${-CANVAS_CENTER_X}, ${-CANVAS_CENTER_Y})`;
    
    transformGroup.setAttribute('transform', transform);
    
    drawShape(transformGroup, data);
    group.appendChild(transformGroup);
}

function drawShape(group, data) {
    const finalShape = determineActualShape();
    const finalVariant = determineActualVariant();
    
    switch (finalShape) {
        case 'dreieck':
            drawTriangle(group, data, finalVariant);
            break;
        case 'kreis':
            drawCircle(group, data, finalVariant);
            break;
        case 'rechteck':
            drawRectangle(group, data, 'rechteck');
            break;
        case 'quadrat':
            drawRectangle(group, data, 'quadrat');
            break;
        case 'trapez':
            drawTrapez(group, data);
            break;
        case 'parallelogramm':
            drawParallelogramm(group, data);
            break;
        case 'rhombus':
            drawRhombus(group, data);
            break;
        case 'langloch':
            drawLangloch(group, data);
            break;
        case 'vieleck':
            drawPolygon(group, data, finalVariant);
            break;
        default:
            drawRectangle(group, data, 'rechteck');
    }
}

function drawTriangle(group, data, variant) {
    let points = '';
    
    if (variant === 'gleichseitig') {
        const side = (data.side || 6) * SCALE_FACTOR;
        const height = side * Math.sqrt(3) / 2;
        points = `${CANVAS_CENTER_X},${CANVAS_CENTER_Y - height/2} ${CANVAS_CENTER_X - side/2},${CANVAS_CENTER_Y + height/2} ${CANVAS_CENTER_X + side/2},${CANVAS_CENTER_Y + height/2}`;
    } else if (variant === 'rechtwinklig') {
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

function drawCircle(group, data, variant) {
    if (variant === 'oval') {
        const radiusA = (data.radiusA || 5) * SCALE_FACTOR;
        const radiusB = (data.radiusB || 3) * SCALE_FACTOR;
        
        const ellipse = document.createElementNS('http://www.w3.org/2000/svg', 'ellipse');
        ellipse.setAttribute('cx', CANVAS_CENTER_X);
        ellipse.setAttribute('cy', CANVAS_CENTER_Y);
        ellipse.setAttribute('rx', radiusA);
        ellipse.setAttribute('ry', radiusB);
        ellipse.setAttribute('fill', 'rgba(0, 123, 255, 0.3)');
        ellipse.setAttribute('stroke', '#007bff');
        ellipse.setAttribute('stroke-width', '3');
        
        group.appendChild(ellipse);
    } else {
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
}

function drawRectangle(group, data, variant) {
    let width, height;
    
    if (variant === 'quadrat') {
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

function drawParallelogramm(group, data) {
    const base = (data.base || 8) * SCALE_FACTOR;
    const height = (data.height || 4) * SCALE_FACTOR;
    const shear = base * 0.3; // Vereinfachte Schrägung
    
    const points = `${CANVAS_CENTER_X - base/2},${CANVAS_CENTER_Y + height/2} ${CANVAS_CENTER_X + base/2},${CANVAS_CENTER_Y + height/2} ${CANVAS_CENTER_X + base/2 - shear},${CANVAS_CENTER_Y - height/2} ${CANVAS_CENTER_X - base/2 - shear},${CANVAS_CENTER_Y - height/2}`;
    
    const parallelogramm = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
    parallelogramm.setAttribute('points', points);
    parallelogramm.setAttribute('fill', 'rgba(0, 123, 255, 0.3)');
    parallelogramm.setAttribute('stroke', '#007bff');
    parallelogramm.setAttribute('stroke-width', '3');
    
    group.appendChild(parallelogramm);
}

function drawRhombus(group, data) {
    const side = (data.side || 5) * SCALE_FACTOR;
    const height = (data.height || 4) * SCALE_FACTOR;
    
    const width = side * 1.2; // Vereinfachte Berechnung
    
    const points = `${CANVAS_CENTER_X - width/2},${CANVAS_CENTER_Y} ${CANVAS_CENTER_X},${CANVAS_CENTER_Y - height/2} ${CANVAS_CENTER_X + width/2},${CANVAS_CENTER_Y} ${CANVAS_CENTER_X},${CANVAS_CENTER_Y + height/2}`;
    
    const rhombus = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
    rhombus.setAttribute('points', points);
    rhombus.setAttribute('fill', 'rgba(0, 123, 255, 0.3)');
    rhombus.setAttribute('stroke', '#007bff');
    rhombus.setAttribute('stroke-width', '3');
    
    group.appendChild(rhombus);
}

function drawLangloch(group, data) {
    const length = (data.length || 8) * SCALE_FACTOR;
    const width = (data.width || 3) * SCALE_FACTOR;
    const radius = Math.min((data.radius || 1) * SCALE_FACTOR, width / 2);
    
    const x = CANVAS_CENTER_X - length/2;
    const y = CANVAS_CENTER_Y - width/2;
    
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    const d = `M ${x + radius} ${y} L ${x + length - radius} ${y} A ${radius} ${radius} 0 0 1 ${x + length - radius} ${y + width} L ${x + radius} ${y + width} A ${radius} ${radius} 0 0 1 ${x + radius} ${y} Z`;
    
    path.setAttribute('d', d);
    path.setAttribute('fill', 'rgba(0, 123, 255, 0.3)');
    path.setAttribute('stroke', '#007bff');
    path.setAttribute('stroke-width', '3');
    
    group.appendChild(path);
}

function drawPolygon(group, data, variant) {
    if (['fuenfeck', 'sechseck', 'achteck'].includes(variant)) {
        const sides = variant === 'fuenfeck' ? 5 : variant === 'sechseck' ? 6 : 8;
        const radius = (data.side || 5) * SCALE_FACTOR / 2;
        
        let points = '';
        for (let i = 0; i < sides; i++) {
            const angle = (i * 2 * Math.PI / sides) - Math.PI / 2;
            const x = CANVAS_CENTER_X + radius * Math.cos(angle);
            const y = CANVAS_CENTER_Y + radius * Math.sin(angle);
            points += `${x},${y} `;
        }
        
        const polygon = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
        polygon.setAttribute('points', points.trim());
        polygon.setAttribute('fill', 'rgba(0, 123, 255, 0.3)');
        polygon.setAttribute('stroke', '#007bff');
        polygon.setAttribute('stroke-width', '3');
        
        group.appendChild(polygon);
    } else {
        drawRectangle(group, data, 'rechteck');
    }
}

function updateCalculations(data) {
    let area = 0;
    let perimeter = 0;
    
    const finalShape = determineActualShape();
    
    switch (finalShape) {
        case 'dreieck':
            const finalVariant = determineActualVariant();
            if (finalVariant === 'gleichseitig') {
                const side = data.side || 6;
                area = (Math.sqrt(3) / 4) * side * side;
                perimeter = 3 * side;
            } else if (finalVariant === 'rechtwinklig') {
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
            const length = data.length || 8;
            const width = data.width || 5;
            area = length * width;
            perimeter = 2 * (length + width);
            break;
            
        case 'quadrat':
            const side = data.side || 5;
            area = side * side;
            perimeter = 4 * side;
            break;
            
        case 'trapez':
            const baseA = data.baseA || 8;
            const baseB = data.baseB || 5;
            const height = data.height || 4;
            area = 0.5 * (baseA + baseB) * height;
            perimeter = baseA + baseB + 2 * Math.sqrt(height*height + ((baseA-baseB)/2)*((baseA-baseB)/2));
            break;
            
        case 'parallelogramm':
            const base = data.base || 8;
            const pSide = data.side || 5;
            const pHeight = data.height || 4;
            area = base * pHeight;
            perimeter = 2 * (base + pSide);
            break;
            
        case 'rhombus':
            const rhombusSide = data.side || 5;
            const rhombusHeight = data.height || 4;
            area = rhombusSide * rhombusHeight;
            perimeter = 4 * rhombusSide;
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
    
    switch(position) {
        case 'top':
            currentRotation = 180;
            break;
        case 'right':
            currentRotation = 90;
            break;
        case 'bottom':
            currentRotation = 0;
            break;
        case 'left':
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
    currentRotation = 0;
    isMirroredH = false;
    isMirroredV = false;
    traufePosition = 'bottom';
    
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
            case 'base': input.value = '8'; break;
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

console.log('✅ Editor komplett geladen');
