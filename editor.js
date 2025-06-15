// Erweiterte Eingabefelder für verschiedene Formen mit automatischer Berechnung
function generateInputFields() {
    const container = document.getElementById('geometry-inputs-grid');
    if (!container) return;
    
    console.log('Generiere erweiterte Eingabefelder für:', currentShapeType, 'Variante:', projectData.roofShape?.variant);
    
    // Je nach Form unterschiedliche Eingabefelder
    if (currentShapeType === 'dreieck') {
        generateTriangleInputFields();
    } else if (currentShapeType === 'viereck') {
        generateViereckInputFields();
    } else if (currentShapeType === 'vieleck') {
        generateVieleckInputFields();
    } else if (currentShapeType === 'kreis') {
        generateKreisInputFields();
    } else {
        // Standard-Rechteck
        generateRectangleInputFields();
    }
}

// Erweiterte Viereck-Eingabefelder
function generateViereckInputFields() {
    const container = document.getElementById('geometry-inputs-grid');
    const variant = projectData.roofShape?.variant || 'rechteck';
    
    switch(variant) {
        case 'rechteck':
            container.innerHTML = `
                <div class="input-group">
                    <label for="dim-length">Länge:</label>
                    <div class="input-group-wrapper">
                        <input type="number" id="dim-length" step="0.1" min="0.1" value="${currentValues.length || 10}" onchange="updateValue('length', this.value)">
                        <span class="input-unit">m</span>
                    </div>
                </div>
                <div class="input-group">
                    <label for="dim-width">Breite:</label>
                    <div class="input-group-wrapper">
                        <input type="number" id="dim-width" step="0.1" min="0.1" value="${currentValues.width || 8}" onchange="updateValue('width', this.value)">
                        <span class="input-unit">m</span>
                    </div>
                </div>
                <div class="input-group">
                    <label>Fläche:</label>
                    <div class="input-group-wrapper">
                        <input type="number" id="calc-area-display" step="0.1" readonly value="${((currentValues.length || 10) * (currentValues.width || 8)).toFixed(1)}">
                        <span class="input-unit">m²</span>
                    </div>
                </div>
            `;
            break;
            
        case 'quadrat':
            container.innerHTML = `
                <div class="input-group">
                    <label for="dim-size">Seitenlänge:</label>
                    <div class="input-group-wrapper">
                        <input type="number" id="dim-size" step="0.1" min="0.1" value="${currentValues.size || 8}" onchange="updateSquareValue('size', this.value)">
                        <span class="input-unit">m</span>
                    </div>
                </div>
                <div class="input-group">
                    <label>Fläche:</label>
                    <div class="input-group-wrapper">
                        <input type="number" id="calc-area-display" step="0.1" readonly value="${Math.pow(currentValues.size || 8, 2).toFixed(1)}">
                        <span class="input-unit">m²</span>
                    </div>
                </div>
            `;
            break;
            
                    case 'trapez':
                container.innerHTML = `
                    <div class="input-group">
                        <label for="dim-bottom">Untere Breite (a):</label>
                        <div class="input-group-wrapper">
                            <input type="number" id="dim-bottom" step="0.1" min="0.1" value="${currentValues.bottomWidth || 10}" onchange="updateValue('bottomWidth', this.value)">
                            <span class="input-unit">m</span>
                        </div>
                    </div>
                    <div class="input-group">
                        <label for="dim-top">Obere Breite (c):</label>
                        <div class="input-group-wrapper">
                            <input type="number" id="dim-top" step="0.1" min="0.1" value="${currentValues.topWidth || 6}" onchange="updateValue('topWidth', this.value)">
                            <span class="input-unit">m</span>
                        </div>
                    </div>
                    <div class="input-group">
                        <label for="dim-height">Höhe (h):</label>
                        <div class="input-group-wrapper">
                            <input type="number" id="dim-height" step="0.1" min="0.1" value="${currentValues.height || 6}" onchange="updateValue('height', this.value)">
                            <span class="input-unit">m</span>
                        </div>
                    </div>
                    <div class="input-group">
                        <label for="dim-left-leg">Linker Schenkel:</label>
                        <div class="input-group-wrapper">
                            <input type="number" id="dim-left-leg" step="0.1" min="0.1" value="${currentValues.leftLeg || ''}" onchange="updateTrapezValue('leftLeg', this.value)" placeholder="auto">
                            <span class="input-unit">m</span>
                        </div>
                    </div>
                    <div class="input-group">
                        <label for="dim-right-leg">Rechter Schenkel:</label>
                        <div class="input-group-wrapper">
                            <input type="number" id="dim-right-leg" step="0.1" min="0.1" value="${currentValues.rightLeg || ''}" onchange="updateTrapezValue('rightLeg', this.value)" placeholder="auto">
                            <span class="input-unit">m</span>
                        </div>
                    </div>
                    <div class="input-group">
                        <label for="dim-left-angle">Linker Winkel:</label>
                        <div class="input-group-wrapper">
                            <input type="number" id="dim-left-angle" step="1" min="1" max="179" value="${currentValues.leftAngle || ''}" onchange="updateTrapezValue('leftAngle', this.value)" placeholder="auto">
                            <span class="input-unit">°</span>
                        </div>
                    </div>
                    <div class="input-group">
                        <label for="dim-right-angle">Rechter Winkel:</label>
                        <div class="input-group-wrapper">
                            <input type="number" id="dim-right-angle" step="1" min="1" max="179" value="${currentValues.rightAngle || ''}" onchange="updateTrapezValue('rightAngle', this.value)" placeholder="auto">
                            <span class="input-unit">°</span>
                        </div>
                    </div>
                    <div class="input-group">
                        <label>Fläche:</label>
                        <div class="input-group-wrapper">
                            <input type="number" id="calc-area-display" step="0.1" readonly value="${(((currentValues.bottomWidth || 10) + (currentValues.topWidth || 6)) / 2 * (currentValues.height || 6)).toFixed(1)}">
                            <span class="input-unit">m²</span>
                        </div>
                    </div>
                `;
                break;
            
        case 'parallelogramm':
            container.innerHTML = `
                <div class="input-group">
                    <label for="dim-length">Länge (a):</label>
                    <div class="input-group-wrapper">
                        <input type="number" id="dim-length" step="0.1" min="0.1" value="${currentValues.length || 10}" onchange="updateValue('length', this.value)">
                        <span class="input-unit">m</span>
                    </div>
                </div>
                <div class="input-group">
                    <label for="dim-width">Breite (b):</label>
                    <div class="input-group-wrapper">
                        <input type="number" id="dim-width" step="0.1" min="0.1" value="${currentValues.width || 6}" onchange="updateValue('width', this.value)">
                        <span class="input-unit">m</span>
                    </div>
                </div>
                <div class="input-group">
                    <label for="dim-height">Höhe (h):</label>
                    <div class="input-group-wrapper">
                        <input type="number" id="dim-height" step="0.1" min="0.1" value="${currentValues.height || 5}" onchange="updateParallelogrammValue('height', this.value)">
                        <span class="input-unit">m</span>
                    </div>
                </div>
                <div class="input-group">
                    <label for="dim-angle">Winkel (α):</label>
                    <div class="input-group-wrapper">
                        <input type="number" id="dim-angle" step="1" min="1" max="179" value="${currentValues.angle || 60}" onchange="updateParallelogrammValue('angle', this.value)">
                        <span class="input-unit">°</span>
                    </div>
                </div>
                <div class="input-group">
                    <label for="dim-skew">Schräge (x):</label>
                    <div class="input-group-wrapper">
                        <input type="number" id="dim-skew" step="0.1" value="${currentValues.skew || ''}" onchange="updateParallelogrammValue('skew', this.value)" placeholder="auto" readonly>
                        <span class="input-unit">m</span>
                    </div>
                </div>
                <div class="input-group">
                    <label>Fläche:</label>
                    <div class="input-group-wrapper">
                        <input type="number" id="calc-area-display" step="0.1" readonly value="${((currentValues.length || 10) * (currentValues.height || 5)).toFixed(1)}">
                        <span class="input-unit">m²</span>
                    </div>
                </div>
            `;
            break;
            
        case 'rhombus':
            container.innerHTML = `
                <div class="input-group">
                    <label for="dim-diagonal1">Diagonale 1 (d1):</label>
                    <div class="input-group-wrapper">
                        <input type="number" id="dim-diagonal1" step="0.1" min="0.1" value="${currentValues.diagonal1 || 10}" onchange="updateRhombusValue('diagonal1', this.value)">
                        <span class="input-unit">m</span>
                    </div>
                </div>
                <div class="input-group">
                    <label for="dim-diagonal2">Diagonale 2 (d2):</label>
                    <div class="input-group-wrapper">
                        <input type="number" id="dim-diagonal2" step="0.1" min="0.1" value="${currentValues.diagonal2 || 8}" onchange="updateRhombusValue('diagonal2', this.value)">
                        <span class="input-unit">m</span>
                    </div>
                </div>
                <div class="input-group">
                    <label for="dim-side">Seitenlänge (a):</label>
                    <div class="input-group-wrapper">
                        <input type="number" id="dim-side" step="0.1" value="${currentValues.sideLength || ''}" onchange="updateRhombusValue('sideLength', this.value)" placeholder="auto" readonly>
                        <span class="input-unit">m</span>
                    </div>
                </div>
                <div class="input-group">
                    <label>Fläche:</label>
                    <div class="input-group-wrapper">
                        <input type="number" id="calc-area-display" step="0.1" readonly value="${((currentValues.diagonal1 || 10) * (currentValues.diagonal2 || 8) / 2).toFixed(1)}">
                        <span class="input-unit">m²</span>
                    </div>
                </div>
            `;
            break;
            
        default:
            generateRectangleInputFields();
    }
}

// Erweiterte Dreieck-Eingabefelder
function generateTriangleInputFields() {
    const container = document.getElementById('geometry-inputs-grid');
    const variant = projectData.roofShape?.variant || 'gleichseitig';
    
    switch(variant) {
        case 'gleichseitig':
            container.innerHTML = `
                <div class="input-group">
                    <label for="dim-side">Seitenlänge (a):</label>
                    <div class="input-group-wrapper">
                        <input type="number" id="dim-side" step="0.1" min="0.1" value="${currentValues.sideLength || 10}" onchange="updateTriangleValue('sideLength', this.value)">
                        <span class="input-unit">m</span>
                    </div>
                </div>
                <div class="input-group">
                    <label for="dim-height">Höhe (h):</label>
                    <div class="input-group-wrapper">
                        <input type="number" id="dim-height" step="0.1" value="${currentValues.height || ''}" placeholder="auto" readonly>
                        <span class="input-unit">m</span>
                    </div>
                </div>
                <div class="input-group">
                    <label>Fläche:</label>
                    <div class="input-group-wrapper">
                        <input type="number" id="calc-area-display" step="0.1" readonly value="${(Math.pow(currentValues.sideLength || 10, 2) * Math.sqrt(3) / 4).toFixed(1)}">
                        <span class="input-unit">m²</span>
                    </div>
                </div>
            `;
            break;
            
        case 'rechtwinklig':
            container.innerHTML = `
                <div class="input-group">
                    <label for="dim-base">Basis (a):</label>
                    <div class="input-group-wrapper">
                        <input type="number" id="dim-base" step="0.1" min="0.1" value="${currentValues.base || 10}" onchange="updateTriangleValue('base', this.value)">
                        <span class="input-unit">m</span>
                    </div>
                </div>
                <div class="input-group">
                    <label for="dim-height">Höhe (b):</label>
                    <div class="input-group-wrapper">
                        <input type="number" id="dim-height" step="0.1" min="0.1" value="${currentValues.height || 8}" onchange="updateTriangleValue('height', this.value)">
                        <span class="input-unit">m</span>
                    </div>
                </div>
                <div class="input-group">
                    <label for="dim-hypotenuse">Hypotenuse (c):</label>
                    <div class="input-group-wrapper">
                        <input type="number" id="dim-hypotenuse" step="0.1" value="${currentValues.hypotenuse || ''}" onchange="updateTriangleValue('hypotenuse', this.value)" placeholder="auto" readonly>
                        <span class="input-unit">m</span>
                    </div>
                </div>
                <div class="input-group">
                    <label>Fläche:</label>
                    <div class="input-group-wrapper">
                        <input type="number" id="calc-area-display" step="0.1" readonly value="${((currentValues.base || 10) * (currentValues.height || 8) / 2).toFixed(1)}">
                        <span class="input-unit">m²</span>
                    </div>
                </div>
            `;
            break;
            
        case 'ungleichschenklig':
            container.innerHTML = `
                <div class="input-group">
                    <label for="dim-base">Basis (a):</label>
                    <div class="input-group-wrapper">
                        <input type="number" id="dim-base" step="0.1" min="0.1" value="${currentValues.base || 10}" onchange="updateTriangleValue('base', this.value)">
                        <span class="input-unit">m</span>
                    </div>
                </div>
                <div class="input-group">
                    <label for="dim-height">Höhe (h):</label>
                    <div class="input-group-wrapper">
                        <input type="number" id="dim-height" step="0.1" min="0.1" value="${currentValues.height || 8}" onchange="updateTriangleValue('height', this.value)">
                        <span class="input-unit">m</span>
                    </div>
                </div>
                <div class="input-group">
                    <label for="dim-left-side">Linke Seite (b):</label>
                    <div class="input-group-wrapper">
                        <input type="number" id="dim-left-side" step="0.1" min="0.1" value="${currentValues.leftSide || 7}" onchange="updateTriangleValue('leftSide', this.value)">
                        <span class="input-unit">m</span>
                    </div>
                </div>
                <div class="input-group">
                    <label for="dim-right-side">Rechte Seite (c):</label>
                    <div class="input-group-wrapper">
                        <input type="number" id="dim-right-side" step="0.1" min="0.1" value="${currentValues.rightSide || 9}" onchange="updateTriangleValue('rightSide', this.value)">
                        <span class="input-unit">m</span>
                    </div>
                </div>
                <div class="input-group">
                    <label for="dim-offset">Höhen-Offset:</label>
                    <div class="input-group-wrapper">
                        <input type="number" id="dim-offset" step="0.1" value="${currentValues.offset || ''}" placeholder="auto" readonly>
                        <span class="input-unit">m</span>
                    </div>
                </div>
                <div class="input-group">
                    <label>Fläche:</label>
                    <div class="input-group-wrapper">
                        <input type="number" id="calc-area-display" step="0.1" readonly value="${((currentValues.base || 10) * (currentValues.height || 8) / 2).toFixed(1)}">
                        <span class="input-unit">m²</span>
                    </div>
                </div>
            `;
            break;
    }
}

// Automatische Berechnungen für Trapez
function updateTrapezValue(fieldId, value) {
    currentValues[fieldId] = parseFloat(value) || null;
    
    const a = currentValues.bottomWidth || 10;  // untere Breite
    const c = currentValues.topWidth || 6;     // obere Breite
    const h = currentValues.height || 6;       // Höhe
    
    // Berechne fehlende Werte automatisch
    if (currentValues.leftAngle && !currentValues.leftLeg) {
        const angleRad = (currentValues.leftAngle * Math.PI) / 180;
        currentValues.leftLeg = h / Math.sin(angleRad);
        document.getElementById('dim-left-leg').value = currentValues.leftLeg.toFixed(2);
    }
    
    if (currentValues.rightAngle && !currentValues.rightLeg) {
        const angleRad = (currentValues.rightAngle * Math.PI) / 180;
        currentValues.rightLeg = h / Math.sin(angleRad);
        document.getElementById('dim-right-leg').value = currentValues.rightLeg.toFixed(2);
    }
    
    // Wenn beide Schenkel gegeben sind, berechne die Winkel
    if (currentValues.leftLeg && currentValues.rightLeg && h) {
        if (!currentValues.leftAngle) {
            const leftAngle = Math.asin(h / currentValues.leftLeg) * 180 / Math.PI;
            currentValues.leftAngle = leftAngle;
            document.getElementById('dim-left-angle').value = leftAngle.toFixed(1);
        }
        if (!currentValues.rightAngle) {
            const rightAngle = Math.asin(h / currentValues.rightLeg) * 180 / Math.PI;
            currentValues.rightAngle = rightAngle;
            document.getElementById('dim-right-angle').value = rightAngle.toFixed(1);
        }
    }
    
    // Aktualisiere Fläche
    const area = ((a + c) / 2) * h;
    document.getElementById('calc-area-display').value = area.toFixed(1);
    
    currentPoints = generatePoints();
    updateShape();
    updateInfoPanel();
}

// Automatische Berechnungen für Parallelogramm
function updateParallelogrammValue(fieldId, value) {
    currentValues[fieldId] = parseFloat(value) || null;
    
    const a = currentValues.length || 10;     // Länge
    const b = currentValues.width || 6;      // Breite
    const h = currentValues.height || 5;     // Höhe
    const angle = currentValues.angle || 60; // Winkel in Grad
    
    // Berechne Schräge basierend auf Winkel und Höhe
    const angleRad = (angle * Math.PI) / 180;
    currentValues.skew = h / Math.tan(angleRad);
    
    // Aktualisiere automatisch berechnete Höhe wenn Winkel verändert wird
    if (fieldId === 'angle') {
        currentValues.height = b * Math.sin(angleRad);
        document.getElementById('dim-height').value = currentValues.height.toFixed(2);
    }
    
    // Aktualisiere UI
    document.getElementById('dim-skew').value = currentValues.skew.toFixed(2);
    
    // Aktualisiere Fläche
    const area = a * h;
    document.getElementById('calc-area-display').value = area.toFixed(1);
    
    currentPoints = generatePoints();
    updateShape();
    updateInfoPanel();
}

// Automatische Berechnungen für Rhombus
function updateRhombusValue(fieldId, value) {
    currentValues[fieldId] = parseFloat(value) || null;
    
    const d1 = currentValues.diagonal1 || 10;
    const d2 = currentValues.diagonal2 || 8;
    
    // Berechne Seitenlänge automatisch
    const sideLength = Math.sqrt((d1/2) * (d1/2) + (d2/2) * (d2/2));
    currentValues.sideLength = sideLength;
    document.getElementById('dim-side').value = sideLength.toFixed(2);
    
    // Aktualisiere Fläche
    const area = (d1 * d2) / 2;
    document.getElementById('calc-area-display').value = area.toFixed(1);
    
    currentPoints = generatePoints();
    updateShape();
    updateInfoPanel();
}

// Standard Rechteck-Eingabe
function generateRectangleInputFields() {
    const container = document.getElementById('geometry-inputs-grid');
    container.innerHTML = `
        <div class="input-group">
            <label for="dim-length">Länge:</label>
            <div class="input-group-wrapper">
                <input type="number" id="dim-length" step="0.1" min="0.1" value="${currentValues.length || 10}" onchange="updateValue('length', this.value)">
                <span class="input-unit">m</span>
            </div>
        </div>
        <div class="input-group">
            <label for="dim-width">Breite:</label>
            <div class="input-group-wrapper">
                <input type="number" id="dim-width" step="0.1" min="0.1" value="${currentValues.width || 8}" onchange="updateValue('width', this.value)">
                <span class="input-unit">m</span>
            </div>
        </div>
        <div class="input-group">
            <label>Fläche:</label>
            <div class="input-group-wrapper">
                <input type="number" id="calc-area-display" step="0.1" readonly value="${((currentValues.length || 10) * (currentValues.width || 8)).toFixed(1)}">
                <span class="input-unit">m²</span>
            </div>
        </div>
    `;
}

// Erweiterte Kreis-Eingabefelder
function generateKreisInputFields() {
    const container = document.getElementById('geometry-inputs-grid');
    const variant = projectData.roofShape?.variant || 'kreis';
    
    switch(variant) {
        case 'kreis':
            container.innerHTML = `
                <div class="input-group">
                    <label for="dim-radius">Radius (r):</label>
                    <div class="input-group-wrapper">
                        <input type="number" id="dim-radius" step="0.1" min="0.1" value="${currentValues.radius || 5}" onchange="updateCircleValue('radius', this.value)">
                        <span class="input-unit">m</span>
                    </div>
                </div>
                <div class="input-group">
                    <label for="dim-diameter">Durchmesser (d):</label>
                    <div class="input-group-wrapper">
                        <input type="number" id="dim-diameter" step="0.1" value="${currentValues.diameter || ''}" onchange="updateCircleValue('diameter', this.value)" placeholder="auto" readonly>
                        <span class="input-unit">m</span>
                    </div>
                </div>
                <div class="input-group">
                    <label for="dim-circumference">Umfang:</label>
                    <div class="input-group-wrapper">
                        <input type="number" id="dim-circumference" step="0.1" readonly value="${(2 * Math.PI * (currentValues.radius || 5)).toFixed(2)}">
                        <span class="input-unit">m</span>
                    </div>
                </div>
                <div class="input-group">
                    <label>Fläche:</label>
                    <div class="input-group-wrapper">
                        <input type="number" id="calc-area-display" step="0.1" readonly value="${(Math.PI * Math.pow(currentValues.radius || 5, 2)).toFixed(1)}">
                        <span class="input-unit">m²</span>
                    </div>
                </div>
            `;
            break;
            
        case 'oval':
            container.innerHTML = `
                <div class="input-group">
                    <label for="dim-radiusX">Halbachse A (a):</label>
                    <div class="input-group-wrapper">
                        <input type="number" id="dim-radiusX" step="0.1" min="0.1" value="${currentValues.radiusX || 6}" onchange="updateOvalValue('radiusX', this.value)">
                        <span class="input-unit">m</span>
                    </div>
                </div>
                <div class="input-group">
                    <label for="dim-radiusY">Halbachse B (b):</label>
                    <div class="input-group-wrapper">
                        <input type="number" id="dim-radiusY" step="0.1" min="0.1" value="${currentValues.radiusY || 3}" onchange="updateOvalValue('radiusY', this.value)">
                        <span class="input-unit">m</span>
                    </div>
                </div>
                <div class="input-group">
                    <label for="dim-excentricity">Exzentrizität (e):</label>
                    <div class="input-group-wrapper">
                        <input type="number" id="dim-excentricity" step="0.01" readonly value="${currentValues.excentricity || 0}" placeholder="auto">
                        <span class="input-unit"></span>
                    </div>
                </div>
                <div class="input-group">
                    <label>Fläche (ca.):</label>
                    <div class="input-group-wrapper">
                        <input type="number" id="calc-area-display" step="0.1" readonly value="${(Math.PI * (currentValues.radiusX || 6) * (currentValues.radiusY || 3)).toFixed(1)}">
                        <span class="input-unit">m²</span>
                    </div>
                </div>
            `;
            break;
            
        case 'halbkreis':
            container.innerHTML = `
                <div class="input-group">
                    <label for="dim-radius">Radius (r):</label>
                    <div class="input-group-wrapper">
                        <input type="number" id="dim-radius" step="0.1" min="0.1" value="${currentValues.radius || 5}" onchange="updateCircleValue('radius', this.value)">
                        <span class="input-unit">m</span>
                    </div>
                </div>
                <div class="input-group">
                    <label for="dim-diameter">Durchmesser (d):</label>
                    <div class="input-group-wrapper">
                        <input type="number" id="dim-diameter" step="0.1" readonly value="${(2 * (currentValues.radius || 5)).toFixed(1)}">
                        <span class="input-unit">m</span>
                    </div>
                </div>
                <div class="input-group">
                    <label>Fläche:</label>
                    <div class="input-group-wrapper">
                        <input type="number" id="calc-area-display" step="0.1" readonly value="${(Math.PI * Math.pow(currentValues.radius || 5, 2) / 2).toFixed(1)}">
                        <span class="input-unit">m²</span>
                    </div>
                </div>
            `;
            break;
            
        case 'langloch':
            container.innerHTML = `
                <div class="input-group">
                    <label for="dim-length">Gesamt-Länge:</label>
                    <div class="input-group-wrapper">
                        <input type="number" id="dim-length" step="0.1" min="0.1" value="${currentValues.length || 8}" onchange="updateLanglochValue('length', this.value)">
                        <span class="input-unit">m</span>
                    </div>
                </div>
                <div class="input-group">
                    <label for="dim-width">Breite:</label>
                    <div class="input-group-wrapper">
                        <input type="number" id="dim-width" step="0.1" min="0.1" value="${currentValues.width || 4}" onchange="updateLanglochValue('width', this.value)">
                        <span class="input-unit">m</span>
                    </div>
                </div>
                <div class="input-group">
                    <label for="dim-straight">Gerade Strecke:</label>
                    <div class="input-group-wrapper">
                        <input type="number" id="dim-straight" step="0.1" readonly value="${currentValues.straightLength || ''}" placeholder="auto">
                        <span class="input-unit">m</span>
                    </div>
                </div>
                <div class="input-group">
                    <label>Fläche:</label>
                    <div class="input-group-wrapper">
                        <input type="number" id="calc-area-display" step="0.1" readonly value="${currentValues.area || 0}">
                        <span class="input-unit">m²</span>
                    </div>
                </div>
            `;
            break;
    }
}

// Erweiterte Vieleck-Eingabefelder
function generateVieleckInputFields() {
    const container = document.getElementById('geometry-inputs-grid');
    const variant = projectData.roofShape?.variant || 'fuenfeck';
    
    switch(variant) {
        case 'lform':
            container.innerHTML = `
                <div class="input-group">
                    <label for="dim-length1">Länge 1:</label>
                    <div class="input-group-wrapper">
                        <input type="number" id="dim-length1" step="0.1" min="0.1" value="${currentValues.length1 || 6}" onchange="updateValue('length1', this.value)">
                        <span class="input-unit">m</span>
                    </div>
                </div>
                <div class="input-group">
                    <label for="dim-width1">Breite 1:</label>
                    <div class="input-group-wrapper">
                        <input type="number" id="dim-width1" step="0.1" min="0.1" value="${currentValues.width1 || 4}" onchange="updateValue('width1', this.value)">
                        <span class="input-unit">m</span>
                    </div>
                </div>
                <div class="input-group">
                    <label for="dim-length2">Länge 2:</label>
                    <div class="input-group-wrapper">
                        <input type="number" id="dim-length2" step="0.1" min="0.1" value="${currentValues.length2 || 4}" onchange="updateValue('length2', this.value)">
                        <span class="input-unit">m</span>
                    </div>
                </div>
                <div class="input-group">
                    <label for="dim-width2">Breite 2:</label>
                    <div class="input-group-wrapper">
                        <input type="number" id="dim-width2" step="0.1" min="0.1" value="${currentValues.width2 || 4}" onchange="updateValue('width2', this.value)">
                        <span class="input-unit">m</span>
                    </div>
                </div>
                <div class="input-group">
                    <label>Fläche:</label>
                    <div class="input-group-wrapper">
                        <input type="number" id="calc-area-display" step="0.1" readonly value="${((currentValues.length1 || 6) * (currentValues.width1 || 4) + (currentValues.length2 || 4) * (currentValues.width2 || 4)).toFixed(1)}">
                        <span class="input-unit">m²</span>
                    </div>
                </div>
            `;
            break;
            
        case 'tform':
            container.innerHTML = `
                <div class="input-group">
                    <label for="dim-stem-width">Stamm-Breite:</label>
                    <div class="input-group-wrapper">
                        <input type="number" id="dim-stem-width" step="0.1" min="0.1" value="${currentValues.stemWidth || 4}" onchange="updateTFormValue('stemWidth', this.value)">
                        <span class="input-unit">m</span>
                    </div>
                </div>
                <div class="input-group">
                    <label for="dim-stem-height">Stamm-Höhe:</label>
                    <div class="input-group-wrapper">
                        <input type="number" id="dim-stem-height" step="0.1" min="0.1" value="${currentValues.stemHeight || 5}" onchange="updateTFormValue('stemHeight', this.value)">
                        <span class="input-unit">m</span>
                    </div>
                </div>
                <div class="input-group">
                    <label for="dim-top-width">Kopf-Breite:</label>
                    <div class="input-group-wrapper">
                        <input type="number" id="dim-top-width" step="0.1" min="0.1" value="${currentValues.topWidth || 10}" onchange="updateTFormValue('topWidth', this.value)">
                        <span class="input-unit">m</span>
                    </div>
                </div>
                <div class="input-group">
                    <label for="dim-top-height">Kopf-Höhe:</label>
                    <div class="input-group-wrapper">
                        <input type="number" id="dim-top-height" step="0.1" min="0.1" value="${currentValues.topHeight || 3}" onchange="updateTFormValue('topHeight', this.value)">
                        <span class="input-unit">m</span>
                    </div>
                </div>
                <div class="input-group">
                    <label>Gesamt-Höhe:</label>
                    <div class="input-group-wrapper">
                        <input type="number" id="calc-total-height" step="0.1" readonly value="${((currentValues.stemHeight || 5) + (currentValues.topHeight || 3)).toFixed(1)}">
                        <span class="input-unit">m</span>
                    </div>
                </div>
                <div class="input-group">
                    <label>Fläche:</label>
                    <div class="input-group-wrapper">
                        <input type="number" id="calc-area-display" step="0.1" readonly value="${((currentValues.stemWidth || 4) * (currentValues.stemHeight || 5) + (currentValues.topWidth || 10) * (currentValues.topHeight || 3)).toFixed(1)}">
                        <span class="input-unit">m²</span>
                    </div>
                </div>
            `;
            break;
            
        default:
            // Standard für regelmäßige Vielecke (Fünfeck, Sechseck, etc.)
            const sides = variant === 'fuenfeck' ? 5 : variant === 'sechseck' ? 6 : variant === 'achteck' ? 8 : 5;
            container.innerHTML = `
                <div class="input-group">
                    <label for="dim-radius">Umkreis-Radius:</label>
                    <div class="input-group-wrapper">
                        <input type="number" id="dim-radius" step="0.1" min="0.1" value="${currentValues.radius || 5}" onchange="updatePolygonValue('radius', this.value, ${sides})">
                        <span class="input-unit">m</span>
                    </div>
                </div>
                <div class="input-group">
                    <label for="dim-side">Seitenlänge:</label>
                    <div class="input-group-wrapper">
                        <input type="number" id="dim-side" step="0.1" readonly value="${currentValues.sideLength || ''}" placeholder="auto">
                        <span class="input-unit">m</span>
                    </div>
                </div>
                <div class="input-group">
                    <label for="dim-apothem">Inkreis-Radius:</label>
                    <div class="input-group-wrapper">
                        <input type="number" id="dim-apothem" step="0.1" readonly value="${currentValues.apothem || ''}" placeholder="auto">
                        <span class="input-unit">m</span>
                    </div>
                </div>
                <div class="input-group">
                    <label>Fläche:</label>
                    <div class="input-group-wrapper">
                        <input type="number" id="calc-area-display" step="0.1" readonly value="${currentValues.area || 0}">
                        <span class="input-unit">m²</span>
                    </div>
                </div>
            `;
    }
}

// Automatische Berechnungen für Kreise
function updateCircleValue(fieldId, value) {
    currentValues[fieldId] = parseFloat(value) || null;
    
    if (fieldId === 'radius') {
        const radius = currentValues.radius;
        currentValues.diameter = radius * 2;
        document.getElementById('dim-diameter').value = currentValues.diameter.toFixed(2);
        
        // Fläche und Umfang
        const area = Math.PI * radius * radius;
        const circumference = 2 * Math.PI * radius;
        document.getElementById('calc-area-display').value = area.toFixed(1);
        if (document.getElementById('dim-circumference')) {
            document.getElementById('dim-circumference').value = circumference.toFixed(2);
        }
    }
    
    currentPoints = generatePoints();
    updateShape();
    updateInfoPanel();
}

// Automatische Berechnungen für Ovale
function updateOvalValue(fieldId, value) {
    currentValues[fieldId] = parseFloat(value) || null;
    
    const a = currentValues.radiusX || 6;
    const b = currentValues.radiusY || 3;
    
    // Exzentrizität berechnen
    if (a > b) {
        const e = Math.sqrt(1 - (b*b)/(a*a));
        currentValues.excentricity = e;
        document.getElementById('dim-excentricity').value = e.toFixed(3);
    }
    
    // Fläche
    const area = Math.PI * a * b;
    document.getElementById('calc-area-display').value = area.toFixed(1);
    
    currentPoints = generatePoints();
    updateShape();
    updateInfoPanel();
}

// Automatische Berechnungen für Langloch
function updateLanglochValue(fieldId, value) {
    currentValues[fieldId] = parseFloat(value) || null;
    
    const length = currentValues.length || 8;
    const width = currentValues.width || 4;
    const radius = width / 2;
    
    // Gerade Strecke berechnen
    currentValues.straightLength = Math.max(0, length - width);
    document.getElementById('dim-straight').value = currentValues.straightLength.toFixed(2);
    
    // Fläche: Rechteck + Kreis
    const rectArea = currentValues.straightLength * width;
    const circleArea = Math.PI * radius * radius;
    currentValues.area = rectArea + circleArea;
    document.getElementById('calc-area-display').value = currentValues.area.toFixed(1);
    
    currentPoints = generatePoints();
    updateShape();
    updateInfoPanel();
}

// Automatische Berechnungen für T-Form
function updateTFormValue(fieldId, value) {
    currentValues[fieldId] = parseFloat(value) || null;
    
    const stemWidth = currentValues.stemWidth || 4;
    const stemHeight = currentValues.stemHeight || 5;
    const topWidth = currentValues.topWidth || 10;
    const topHeight = currentValues.topHeight || 3;
    
    // Gesamt-Höhe
    const totalHeight = stemHeight + topHeight;
    document.getElementById('calc-total-height').value = totalHeight.toFixed(1);
    
    // Fläche
    const area = stemWidth * stemHeight + topWidth * topHeight;
    document.getElementById('calc-area-display').value = area.toFixed(1);
    
    currentPoints = generatePoints();
    updateShape();
    updateInfoPanel();
}

// Automatische Berechnungen für regelmäßige Vielecke
function updatePolygonValue(fieldId, value, sides) {
    currentValues[fieldId] = parseFloat(value) || null;
    
    const radius = currentValues.radius || 5;
    
    // Seitenlänge für regelmäßiges n-Eck
    const sideLength = 2 * radius * Math.sin(Math.PI / sides);
    currentValues.sideLength = sideLength;
    document.getElementById('dim-side').value = sideLength.toFixed(2);
    
    // Inkreis-Radius (Apothem)
    const apothem = radius * Math.cos(Math.PI / sides);
    currentValues.apothem = apothem;
    document.getElementById('dim-apothem').value = apothem.toFixed(2);
    
    // Fläche
    const area = 0.5 * sides * sideLength * apothem;
    currentValues.area = area;
    document.getElementById('calc-area-display').value = area.toFixed(1);
    
    currentPoints = generatePoints();
    updateShape();
    updateInfoPanel();
} step="0.1" min="0.1" value="${currentValues.topWidth || 6}" onchange="updateValue('topWidth', this.value)">
                        <span class="input-unit">m</span>
                    </div>
                </div>
                <div class="input-group">
                    <label for="dim-height">Höhe:</label>
                    <div class="input-group-wrapper">
                        <input type="number" id="dim-height" step="0.1" min="0.1" value="${currentValues.height || 6}" onchange="updateValue('height', this.value)">
                        <span class="input-unit">m</span>
                    </div>
                </div>
                <div class="input-group">
                    <label for="dim-offset">Versatz oben:</label>
                    <div class="input-group-wrapper">
                        <input type="number" id="dim-offset" step="0.1" min="0" value="${currentValues.topOffset || 2}" onchange="updateValue('topOffset', this.value)">
                        <span class="input-unit">m</span>
                    </div>
                </div>
            `;
            break;
            
        case 'parallelogramm':
            container.innerHTML = `
                <div class="input-group">
                    <label for="dim-length">Länge:</label>
                    <div class="input-group-wrapper">
                        <input type="number" id="dim-length" step="0.1" min="0.1" value="${currentValues.length || 10}" onchange="updateValue('length', this.value)">
                        <span class="input-unit">m</span>
                    </div>
                </div>
                <div class="input-group">
                    <label for="dim-width">Breite:</label>
                    <div class="input-group-wrapper">
                        <input type="number" id="dim-width" step="0.1" min="0.1" value="${currentValues.width || 6}" onchange="updateValue('width', this.value)">
                        <span class="input-unit">m</span>
                    </div>
                </div>
                <div class="input-group">
                    <label for="dim-skew">Schräge:</label>
                    <div class="input-group-wrapper">
                        <input type="number" id="dim-skew" step="0.1" min="0" value="${currentValues.skew || 2}" onchange="updateValue('skew', this.value)">
                        <span class="input-unit">m</span>
                    </div>
                </div>
            `;
            break;
            
        case 'rhombus':
            container.innerHTML = `
                <div class="input-group">
                    <label for="dim-width">Breite:</label>
                    <div class="input-group-wrapper">
                        <input type="number" id="dim-width" step="0.1" min="0.1" value="${currentValues.width || 10}" onchange="updateValue('width', this.value)">
                        <span class="input-unit">m</span>
                    </div>
                </div>
                <div class="input-group">
                    <label for="dim-height">Höhe:</label>
                    <div class="input-group-wrapper">
                        <input type="number" id="dim-height" step="0.1" min="0.1" value="${currentValues.height || 8}" onchange="updateValue('height', this.value)">
                        <span class="input-unit">m</span>
                    </div>
                </div>
            `;
            break;
            
        default:
            generateRectangleInputFields();
    }
}

// Dreieck-Eingabefelder
function generateTriangleInputFields() {
    const container = document.getElementById('geometry-inputs-grid');
    const variant = projectData.roofShape?.variant || 'gleichseitig';
    
    switch(variant) {
        case 'gleichseitig':
            container.innerHTML = `
                <div class="input-group">
                    <label for="dim-base">Basis:</label>
                    <div class="input-group-wrapper">
                        <input type="number" id="dim-base" step="0.1" min="0.1" value="${currentValues.base || 10}" onchange="updateValue('base', this.value)">
                        <span class="input-unit">m</span>
                    </div>
                </div>
                <div class="input-group">
                    <label for="dim-height">Höhe:</label>
                    <div class="input-group-wrapper">
                        <input type="number" id="dim-height" step="0.1" min="0.1" value="${currentValues.height || 8}" onchange="updateValue('height', this.value)">
                        <span class="input-unit">m</span>
                    </div>
                </div>
            `;
            break;
            
        case 'rechtwinklig':
            container.innerHTML = `
                <div class="input-group">
                    <label for="dim-base">Basis:</label>
                    <div class="input-group-wrapper">
                        <input type="number" id="dim-base" step="0.1" min="0.1" value="${currentValues.base || 10}" onchange="updateValue('base', this.value)">
                        <span class="input-unit">m</span>
                    </div>
                </div>
                <div class="input-group">
                    <label for="dim-height">Höhe:</label>
                    <div class="input-group-wrapper">
                        <input type="number" id="dim-height" step="0.1" min="0.1" value="${currentValues.height || 8}" onchange="updateValue('height', this.value)">
                        <span class="input-unit">m</span>
                    </div>
                </div>
            `;
            break;
            
        case 'ungleichschenklig':
            container.innerHTML = `
                <div class="input-group">
                    <label for="dim-base">Basis:</label>
                    <div class="input-group-wrapper">
                        <input type="number" id="dim-base" step="0.1" min="0.1" value="${currentValues.base || 10}" onchange="updateValue('base', this.value)">
                        <span class="input-unit">m</span>
                    </div>
                </div>
                <div class="input-group">
                    <label for="dim-height">Höhe:</label>
                    <div class="input-group-wrapper">
                        <input type="number" id="dim-height" step="0.1" min="0.1" value="${currentValues.height || 8}" onchange="updateValue('height', this.value)">
                        <span class="input-unit">m</span>
                    </div>
                </div>
                <div class="input-group">
                    <label for="dim-offset">Spitzen-Versatz:</label>
                    <div class="input-group-wrapper">
                        <input type="number" id="dim-offset" step="0.1" value="${currentValues.offset || 3}" onchange="updateValue('offset', this.value)">
                        <span class="input-unit">m</span>
                    </div>
                </div>
            `;
            break;
    }
}

// Kreis-Eingabefelder
function generateKreisInputFields() {
    const container = document.getElementById('geometry-inputs-grid');
    const variant = projectData.roofShape?.variant || 'kreis';
    
    switch(variant) {
        case 'kreis':
            container.innerHTML = `
                <div class="input-group">
                    <label for="dim-radius">Radius:</label>
                    <div class="input-group-wrapper">
                        <input type="number" id="dim-radius" step="0.1" min="0.1" value="${currentValues.radius || 5}" onchange="updateValue('radius', this.value)">
                        <span class="input-unit">m</span>
                    </div>
                </div>
            `;
            break;
            
        case 'oval':
            container.innerHTML = `
                <div class="input-group">
                    <label for="dim-radiusX">Radius X:</label>
                    <div class="input-group-wrapper">
                        <input type="number" id="dim-radiusX" step="0.1" min="0.1" value="${currentValues.radiusX || 6}" onchange="updateValue('radiusX', this.value)">
                        <span class="input-unit">m</span>
                    </div>
                </div>
                <div class="input-group">
                    <label for="dim-radiusY">Radius Y:</label>
                    <div class="input-group-wrapper">
                        <input type="number" id="dim-radiusY" step="0.1" min="0.1" value="${currentValues.radiusY || 3}" onchange="updateValue('radiusY', this.value)">
                        <span class="input-unit">m</span>
                    </div>
                </div>
            `;
            break;
            
        case 'halbkreis':
            container.innerHTML = `
                <div class="input-group">
                    <label for="dim-radius">Radius:</label>
                    <div class="input-group-wrapper">
                        <input type="number" id="dim-radius" step="0.1" min="0.1" value="${currentValues.radius || 5}" onchange="updateValue('radius', this.value)">
                        <span class="input-unit">m</span>
                    </div>
                </div>
            `;
            break;
            
        case 'langloch':
            container.innerHTML = `
                <div class="input-group">
                    <label for="dim-length">Länge:</label>
                    <div class="input-group-wrapper">
                        <input type="number" id="dim-length" step="0.1" min="0.1" value="${currentValues.length || 8}" onchange="updateValue('length', this.value)">
                        <span class="input-unit">m</span>
                    </div>
                </div>
                <div class="input-group">
                    <label for="dim-width">Breite:</label>
                    <div class="input-group-wrapper">
                        <input type="number" id="dim-width" step="0.1" min="0.1" value="${currentValues.width || 4}" onchange="updateValue('width', this.value)">
                        <span class="input-unit">m</span>
                    </div>
                </div>
            `;
            break;
    }
}

// Vieleck-Eingabefelder
function generateVieleckInputFields() {
    const container = document.getElementById('geometry-inputs-grid');
    const variant = projectData.roofShape?.variant || 'fuenfeck';
    
    switch(variant) {
        case 'lform':
            container.innerHTML = `
                <div class="input-group">
                    <label for="dim-width1">Breite 1:</label>
                    <div class="input-group-wrapper">
                        <input type="number" id="dim-width1" step="0.1" min="0.1" value="${currentValues.width1 || 6}" onchange="updateValue('width1', this.value)">
                        <span class="input-unit">m</span>
                    </div>
                </div>
                <div class="input-group">
                    <label for="dim-width2">Breite 2:</label>
                    <div class="input-group-wrapper">
                        <input type="number" id="dim-width2" step="0.1" min="0.1" value="${currentValues.width2 || 4}" onchange="updateValue('width2', this.value)">
                        <span class="input-unit">m</span>
                    </div>
                </div>
                <div class="input-group">
                    <label for="dim-height1">Höhe 1:</label>
                    <div class="input-group-wrapper">
                        <input type="number" id="dim-height1" step="0.1" min="0.1" value="${currentValues.height1 || 4}" onchange="updateValue('height1', this.value)">
                        <span class="input-unit">m</span>
                    </div>
                </div>
                <div class="input-group">
                    <label for="dim-height2">Höhe 2:</label>
                    <div class="input-group-wrapper">
                        <input type="number" id="dim-height2" step="0.1" min="0.1" value="${currentValues.height2 || 8}" onchange="updateValue('height2', this.value)">
                        <span class="input-unit">m</span>
                    </div>
                </div>
            `;
            break;
            
        case 'tform':
            container.innerHTML = `
                <div class="input-group">
                    <label for="dim-topWidth">Obere Breite:</label>
                    <div class="input-group-wrapper">
                        <input type="number" id="dim-topWidth" step="0.1" min="0.1" value="${currentValues.topWidth || 4}" onchange="updateValue('topWidth', this.value)">
                        <span class="input-unit">m</span>
                    </div>
                </div>
                <div class="input-group">
                    <label for="dim-bottomWidth">Untere Breite:</label>
                    <div class="input-group-wrapper">
                        <input type="number" id="dim-bottomWidth" step="0.1" min="0.1" value="${currentValues.bottomWidth || 10}" onchange="updateValue('bottomWidth', this.value)">
                        <span class="input-unit">m</span>
                    </div>
                </div>
                <div class="input-group">
                    <label for="dim-topHeight">Obere Höhe:</label>
                    <div class="input-group-wrapper">
                        <input type="number" id="dim-topHeight" step="0.1" min="0.1" value="${currentValues.topHeight || 3}" onchange="updateValue('topHeight', this.value)">
                        <span class="input-unit">m</span>
                    </div>
                </div>
                <div class="input-group">
                    <label for="dim-totalHeight">Gesamt-Höhe:</label>
                    <div class="input-group-wrapper">
                        <input type="number" id="dim-totalHeight" step="0.1" min="0.1" value="${currentValues.totalHeight || 8}" onchange="updateValue('totalHeight', this.value)">
                        <span class="input-unit">m</span>
                    </div>
                </div>
            `;
            break;
            
        default:
            // Standard für regelmäßige Vielecke
            container.innerHTML = `
                <div class="input-group">
                    <label for="dim-radius">Radius:</label>
                    <div class="input-group-wrapper">
                        <input type="number" id="dim-radius" step="0.1" min="0.1" value="${currentValues.radius || 5}" onchange="updateValue('radius', this.value)">
                        <span class="input-unit">m</span>
                    </div>
                </div>
            `;
    }
}

// Globale Variablen
let projectData = {};
let currentPoints = [];
let currentShapeType = 'rechteck';
let currentValues = { length: 10, width: 8 };
let waterFlowDirection = 'down';
let preferredDirection = 'laengs';

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
        
        if (saved) {
            const data = JSON.parse(saved);
            return data;
        } else {
            return {};
        }
    } catch (e) {
        return {};
    }
}

// Profil-Info anzeigen
function displayProfileInfo() {
    const profile = projectData.profile;
    console.log('displayProfileInfo aufgerufen, Profil:', profile);
    
    if (profile) {
        const profilName = profile.profilname || 'Standard';
        const deckbreite = profile.deckbreite || 1000;
        const lieferbreite = profile.lieferbreite || 1050;
        const seitenueberlappung = profile.seitenueberlappung || 50;
        
        const nameElement = document.getElementById('current-profile-name');
        const deckbreiteElement = document.getElementById('current-deckbreite');
        const lieferbreiteElement = document.getElementById('current-lieferbreite');
        const seitenueberlappungElement = document.getElementById('current-seitenueberlappung');
        
        if (nameElement) nameElement.textContent = profilName;
        if (deckbreiteElement) deckbreiteElement.textContent = deckbreite + ' mm';
        if (lieferbreiteElement) lieferbreiteElement.textContent = lieferbreite + ' mm';
        if (seitenueberlappungElement) seitenueberlappungElement.textContent = seitenueberlappung + ' mm';
    }
}

// Geometrie-Berechnungen
function calculateArea(points) {
    if (!points || points.length < 3) return 0;
    let area = 0;
    for (let i = 0; i < points.length; i++) {
        const j = (i + 1) % points.length;
        area += points[i].x * points[j].y - points[j].x * points[i].y;
    }
    return Math.abs(area) / 2;
}

function calculatePerimeter(points) {
    if (!points || points.length < 2) return 0;
    let perimeter = 0;
    for (let i = 0; i < points.length; i++) {
        const j = (i + 1) % points.length;
        const dx = points[j].x - points[i].x;
        const dy = points[j].y - points[i].y;
        perimeter += Math.sqrt(dx * dx + dy * dy);
    }
    return perimeter;
}

// Punkte generieren basierend auf aktuellen Werten
function generatePoints() {
    const variant = projectData.roofShape?.variant || 'rechteck';
    const baseShape = projectData.roofShape?.baseShape || 'viereck';
    
    console.log('Generiere Punkte für:', baseShape, variant, currentValues);
    
    if (baseShape === 'viereck') {
        return generateViereckPoints(variant);
    } else if (baseShape === 'dreieck') {
        return generateTrianglePoints(variant);
    } else if (baseShape === 'kreis') {
        return generateCirclePoints(variant);
    } else if (baseShape === 'vieleck') {
        return generatePolygonPoints(variant);
    }
    
    // Fallback
    return [
        { x: 0, y: 0 }, { x: currentValues.length || 10, y: 0 }, 
        { x: currentValues.length || 10, y: currentValues.width || 8 }, { x: 0, y: currentValues.width || 8 }
    ];
}

function generateViereckPoints(variant) {
    switch(variant) {
        case 'quadrat':
            const size = currentValues.size || 8;
            return [
                { x: 0, y: 0 }, { x: size, y: 0 }, 
                { x: size, y: size }, { x: 0, y: size }
            ];
            
        case 'trapez':
            const bottomWidth = currentValues.bottomWidth || 10;
            const topWidth = currentValues.topWidth || 6;
            const height = currentValues.height || 6;
            
            // Berechne die Position der oberen Kante basierend auf den Schenkeln/Winkeln
            let leftOffset = 0;
            let rightOffset = 0;
            
            if (currentValues.leftAngle && currentValues.rightAngle) {
                // Berechne Offsets basierend auf Winkeln
                const leftAngleRad = (currentValues.leftAngle * Math.PI) / 180;
                const rightAngleRad = (currentValues.rightAngle * Math.PI) / 180;
                leftOffset = height / Math.tan(leftAngleRad);
                rightOffset = height / Math.tan(rightAngleRad);
            } else {
                // Standard: zentriert
                const totalOffset = (bottomWidth - topWidth) / 2;
                leftOffset = totalOffset;
                rightOffset = totalOffset;
            }
            
            return [
                { x: 0, y: 0 }, 
                { x: bottomWidth, y: 0 }, 
                { x: bottomWidth - rightOffset, y: height }, 
                { x: leftOffset, y: height }
            ];
            
        case 'parallelogramm':
            const length = currentValues.length || 10;
            const width = currentValues.width || 6;
            const skew = currentValues.skew || 2;
            return [
                { x: 0, y: 0 }, { x: length, y: 0 }, 
                { x: length + skew, y: width }, { x: skew, y: width }
            ];
            
        case 'rhombus':
            const d1 = currentValues.diagonal1 || 10;
            const d2 = currentValues.diagonal2 || 8;
            return [
                { x: d1 / 2, y: 0 }, { x: d1, y: d2 / 2 }, 
                { x: d1 / 2, y: d2 }, { x: 0, y: d2 / 2 }
            ];
            
        default: // rechteck
            return [
                { x: 0, y: 0 }, { x: currentValues.length || 10, y: 0 }, 
                { x: currentValues.length || 10, y: currentValues.width || 8 }, { x: 0, y: currentValues.width || 8 }
            ];
    }
}

function generateTrianglePoints(variant) {
    const base = currentValues.base || currentValues.sideLength || 10;
    const height = currentValues.height || 8;
    
    switch(variant) {
        case 'gleichseitig':
            return [
                { x: base / 2, y: height },
                { x: 0, y: 0 },
                { x: base, y: 0 }
            ];
            
        case 'rechtwinklig':
            return [
                { x: 0, y: 0 },
                { x: base, y: 0 },
                { x: 0, y: height }
            ];
            
        case 'ungleichschenklig':
            const offset = currentValues.offset || 3;
            return [
                { x: offset, y: height },
                { x: 0, y: 0 },
                { x: base, y: 0 }
            ];
            
        default:
            return [
                { x: base / 2, y: height },
                { x: 0, y: 0 },
                { x: base, y: 0 }
            ];
    }
}

function generateCirclePoints(variant) {
    switch(variant) {
        case 'kreis':
            const points = [];
            const radius = currentValues.radius || 5;
            for (let i = 0; i < 16; i++) {
                const angle = (i * 2 * Math.PI) / 16;
                points.push({
                    x: radius + radius * Math.cos(angle),
                    y: radius + radius * Math.sin(angle)
                });
            }
            return points;
            
        case 'oval':
            const ovalPoints = [];
            const radiusX = currentValues.radiusX || 6;
            const radiusY = currentValues.radiusY || 3;
            for (let i = 0; i < 16; i++) {
                const angle = (i * 2 * Math.PI) / 16;
                ovalPoints.push({
                    x: radiusX + radiusX * Math.cos(angle),
                    y: radiusY + radiusY * Math.sin(angle)
                });
            }
            return ovalPoints;
            
        case 'halbkreis':
            const halfPoints = [];
            const hRadius = currentValues.radius || 5;
            for (let i = 0; i <= 8; i++) {
                const angle = (i * Math.PI) / 8;
                halfPoints.push({
                    x: hRadius + hRadius * Math.cos(angle),
                    y: hRadius - hRadius * Math.sin(angle)
                });
            }
            return halfPoints;
            
        case 'langloch':
            const lLength = currentValues.length || 8;
            const lWidth = currentValues.width || 4;
            const radius = lWidth / 2;
            const straightLength = Math.max(0, lLength - lWidth);
            
            const langPoints = [];
            // Rechte Rundung
            for (let i = 0; i <= 8; i++) {
                const angle = (i * Math.PI) / 8 - Math.PI / 2;
                langPoints.push({
                    x: straightLength + radius + radius * Math.cos(angle),
                    y: radius + radius * Math.sin(angle)
                });
            }
            // Linke Rundung
            for (let i = 0; i <= 8; i++) {
                const angle = (i * Math.PI) / 8 + Math.PI / 2;
                langPoints.push({
                    x: radius + radius * Math.cos(angle),
                    y: radius + radius * Math.sin(angle)
                });
            }
            return langPoints;
            
        default:
            return generateCirclePoints('kreis');
    }
}

function generatePolygonPoints(variant) {
    switch(variant) {
        case 'lform':
            const l1 = currentValues.length1 || currentValues.width1 || 6;
            const w1 = currentValues.width1 || currentValues.height1 || 4;
            const l2 = currentValues.length2 || currentValues.width2 || 4;
            const w2 = currentValues.width2 || currentValues.height2 || 4;
            return [
                { x: 0, y: 0 }, { x: l1, y: 0 }, { x: l1, y: w1 },
                { x: l1 + l2, y: w1 }, { x: l1 + l2, y: w1 + w2 }, { x: 0, y: w1 + w2 }
            ];
            
        case 'tform':
            const stemWidth = currentValues.stemWidth || 4;
            const stemHeight = currentValues.stemHeight || 5;
            const topWidth = currentValues.topWidth || 10;
            const topHeight = currentValues.topHeight || 3;
            const centerOffset = (topWidth - stemWidth) / 2;
            return [
                { x: centerOffset, y: 0 }, { x: centerOffset + stemWidth, y: 0 }, 
                { x: centerOffset + stemWidth, y: stemHeight },
                { x: topWidth, y: stemHeight }, { x: topWidth, y: stemHeight + topHeight }, 
                { x: 0, y: stemHeight + topHeight }, { x: 0, y: stemHeight }, 
                { x: centerOffset, y: stemHeight }
            ];
            
        case 'fuenfeck':
            const r5 = currentValues.radius || 5;
            const points5 = [];
            for (let i = 0; i < 5; i++) {
                const angle = (i * 2 * Math.PI) / 5 - Math.PI / 2;
                points5.push({
                    x: r5 + r5 * Math.cos(angle),
                    y: r5 + r5 * Math.sin(angle)
                });
            }
            return points5;
            
        case 'sechseck':
            const r6 = currentValues.radius || 5;
            const points6 = [];
            for (let i = 0; i < 6; i++) {
                const angle = (i * 2 * Math.PI) / 6;
                points6.push({
                    x: r6 + r6 * Math.cos(angle),
                    y: r6 + r6 * Math.sin(angle)
                });
            }
            return points6;
            
        case 'achteck':
            const r8 = currentValues.radius || 5;
            const points8 = [];
            for (let i = 0; i < 8; i++) {
                const angle = (i * 2 * Math.PI) / 8;
                points8.push({
                    x: r8 + r8 * Math.cos(angle),
                    y: r8 + r8 * Math.sin(angle)
                });
            }
            return points8;
            
        default:
            return generatePolygonPoints('fuenfeck');
    }
} || 4;
            const h1 = currentValues.height1 || 4;
            const h2 = currentValues.height2 || 8;
            return [
                { x: 0, y: 0 }, { x: w1, y: 0 }, { x: w1, y: h1 },
                { x: w1 + w2, y: h1 }, { x: w1 + w2, y: h2 }, { x: 0, y: h2 }
            ];
            
        case 'tform':
            const topWidth = currentValues.topWidth || 4;
            const bottomWidth = currentValues.bottomWidth || 10;
            const topHeight = currentValues.topHeight || 3;
            const totalHeight = currentValues.totalHeight || 8;
            const centerOffset = (bottomWidth - topWidth) / 2;
            return [
                { x: centerOffset, y: 0 }, { x: centerOffset + topWidth, y: 0 }, 
                { x: centerOffset + topWidth, y: topHeight },
                { x: bottomWidth, y: topHeight }, { x: bottomWidth, y: totalHeight }, 
                { x: 0, y: totalHeight }, { x: 0, y: topHeight }, 
                { x: centerOffset, y: topHeight }
            ];
            
        case 'fuenfeck':
            const r5 = currentValues.radius || 5;
            const points5 = [];
            for (let i = 0; i < 5; i++) {
                const angle = (i * 2 * Math.PI) / 5 - Math.PI / 2;
                points5.push({
                    x: r5 + r5 * Math.cos(angle),
                    y: r5 + r5 * Math.sin(angle)
                });
            }
            return points5;
            
        case 'sechseck':
            const r6 = currentValues.radius || 5;
            const points6 = [];
            for (let i = 0; i < 6; i++) {
                const angle = (i * 2 * Math.PI) / 6;
                points6.push({
                    x: r6 + r6 * Math.cos(angle),
                    y: r6 + r6 * Math.sin(angle)
                });
            }
            return points6;
            
        default:
            return generatePolygonPoints('fuenfeck');
    }
}

// Verlegerichtung bestimmen
function determinePreferredDirection() {
    const length = currentValues.length || 10;
    const width = currentValues.width || 8;
    
    if (waterFlowDirection === 'down' || waterFlowDirection === 'bottom') {
        preferredDirection = 'laengs';
    } else {
        preferredDirection = 'quer';
    }
    
    const ratio = length / width;
    if (ratio > 2) {
        preferredDirection = 'quer';
    } else if (ratio < 0.5) {
        preferredDirection = 'laengs';
    }
    
    updateDirectionInfo();
}

// Verlegerichtung-Info aktualisieren
function updateDirectionInfo() {
    const directionElement = document.getElementById('current-direction');
    const reasonElement = document.getElementById('direction-reason');
    
    if (directionElement && reasonElement) {
        if (preferredDirection === 'laengs') {
            directionElement.textContent = 'Längs (vertikal)';
            reasonElement.textContent = 'Platten verlaufen parallel zur Wasserlaufrichtung';
        } else {
            directionElement.textContent = 'Quer (horizontal)';
            reasonElement.textContent = 'Optimiert für die Dachgeometrie';
        }
    }
}

// Form zeichnen
function updateShape() {
    const roofGroup = document.getElementById('roof-shape');
    const dimensionsGroup = document.getElementById('dimensions');
    
    if (!roofGroup || !dimensionsGroup) return;
    
    roofGroup.innerHTML = '';
    dimensionsGroup.innerHTML = '';
    
    if (!currentPoints || currentPoints.length === 0) return;
    
    const xs = currentPoints.map(p => p.x);
    const ys = currentPoints.map(p => p.y);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);
    const width = maxX - minX;
    const height = maxY - minY;
    
    const maxScale = Math.min(440 / Math.max(width, 1), 360 / Math.max(height, 1));
    const scale = maxScale * 0.9;
    const centerX = 300;
    const centerY = 200;
    
    const svgPoints = currentPoints.map(p => {
        const x = centerX + (p.x - (minX + maxX) / 2) * scale;
        const y = centerY - (p.y - (minY + maxY) / 2) * scale;
        return { x, y };
    });
    
    const polygonPoints = svgPoints.map(p => p.x + ',' + p.y).join(' ');
    const polygon = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
    polygon.setAttribute('points', polygonPoints);
    polygon.setAttribute('fill', '#007bff20');
    polygon.setAttribute('stroke', '#007bff');
    polygon.setAttribute('stroke-width', '3');
    roofGroup.appendChild(polygon);
    
    determinePreferredDirection();
}

// Info-Panel aktualisieren
function updateInfoPanel() {
    const areaElement = document.getElementById('calc-area');
    const perimeterElement = document.getElementById('calc-perimeter');
    
    if (areaElement && perimeterElement && currentPoints) {
        const area = calculateArea(currentPoints);
        const perimeter = calculatePerimeter(currentPoints);
        
        areaElement.textContent = area.toFixed(2) + ' m²';
        perimeterElement.textContent = perimeter.toFixed(2) + ' m';
    }
}

// Wert aktualisieren
function updateValue(fieldId, value) {
    currentValues[fieldId] = parseFloat(value) || 0;
    console.log('Wert aktualisiert:', fieldId, value, currentValues);
    currentPoints = generatePoints();
    updateShape();
    updateInfoPanel();
}

// Spezielle Funktion für Quadrat (beide Seiten gleich)
function updateSquareValue(fieldId, value) {
    const size = parseFloat(value) || 0;
    currentValues.size = size;
    currentValues.length = size;
    currentValues.width = size;
    currentPoints = generatePoints();
    updateShape();
    updateInfoPanel();
}

// Geometrie aktualisieren
function updateGeometry() {
    currentPoints = generatePoints();
    updateShape();
    updateInfoPanel();
}

// NEU: Traufe-Seite auswählen
function selectTraufeSide() {
    console.log('Traufe-Auswahl gestartet');
    
    // Temporäre Overlay erstellen
    const overlay = document.createElement('div');
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.7);
        z-index: 1000;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        color: white;
        font-family: Arial, sans-serif;
    `;
    
    overlay.innerHTML = `
        <h3 style="margin-bottom: 20px;">Traufe-Position bestimmen</h3>
        <p style="margin-bottom: 30px; text-align: center;">Klicken Sie auf die Seite, wo sich die Traufe (Dachrand) befindet:</p>
        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px;">
            <button onclick="window.setTraufePosition('top')" style="padding: 20px 40px; font-size: 16px; cursor: pointer; border: none; border-radius: 5px;">↑ Oben</button>
            <button onclick="window.setTraufePosition('right')" style="padding: 20px 40px; font-size: 16px; cursor: pointer; border: none; border-radius: 5px;">→ Rechts</button>
            <button onclick="window.setTraufePosition('bottom')" style="padding: 20px 40px; font-size: 16px; cursor: pointer; border: none; border-radius: 5px;">↓ Unten</button>
            <button onclick="window.setTraufePosition('left')" style="padding: 20px 40px; font-size: 16px; cursor: pointer; border: none; border-radius: 5px;">← Links</button>
        </div>
        <button onclick="window.closeOverlay()" style="margin-top: 30px; padding: 10px 20px; background: #666; color: white; border: none; cursor: pointer; border-radius: 5px;">Abbrechen</button>
    `;
    
    document.body.appendChild(overlay);
    window.currentOverlay = overlay;
}

// NEU: Traufe-Position setzen
function setTraufePosition(position) {
    console.log('Traufe-Position gesetzt: ' + position);
    
    // Form entsprechend der Traufe-Position ausrichten
    orientToTraufe(position);
    
    // Wasserlauf ist normalerweise zur Traufe hin gerichtet, aber wir speichern nur die interne Richtung
    waterFlowDirection = position;
    determinePreferredDirection();
    
    // WICHTIG: Wasserlauf-Anzeige wird NICHT aktualisiert - Pfeile bleiben immer nach unten!
    // updateWaterFlowDisplay(); // <- Diese Zeile entfernt/auskommentiert
    
    closeOverlay();
}

// NEU: Form zur Traufe-Position ausrichten
function orientToTraufe(position) {
    const bounds = getBoundingBox(currentPoints);
    const centerX = (bounds.minX + bounds.maxX) / 2;
    const centerY = (bounds.minY + bounds.maxY) / 2;
    
    // Punkte zum Zentrum verschieben
    currentPoints = currentPoints.map(p => ({
        x: p.x - centerX,
        y: p.y - centerY
    }));
    
    // Je nach Richtung rotieren
    let rotationAngle = 0;
    switch (position) {
        case 'top':
            rotationAngle = Math.PI; // 180°
            break;
        case 'right':
            rotationAngle = -Math.PI / 2; // -90°
            break;
        case 'bottom':
            rotationAngle = 0; // 0° (Standard)
            break;
        case 'left':
            rotationAngle = Math.PI / 2; // 90°
            break;
    }
    
    if (rotationAngle !== 0) {
        currentPoints = currentPoints.map(p => ({
            x: p.x * Math.cos(rotationAngle) - p.y * Math.sin(rotationAngle),
            y: p.x * Math.sin(rotationAngle) + p.y * Math.cos(rotationAngle)
        }));
    }
    
    // Zurück zum ursprünglichen Zentrum
    currentPoints = currentPoints.map(p => ({
        x: p.x + centerX,
        y: p.y + centerY
    }));
    
    updateShape();
    updateInfoPanel();
}

// NEU: Bounding Box berechnen
function getBoundingBox(points) {
    const xs = points.map(p => p.x);
    const ys = points.map(p => p.y);
    return {
        minX: Math.min(...xs),
        maxX: Math.max(...xs),
        minY: Math.min(...ys),
        maxY: Math.max(...ys)
    };
}

// NEU: Wasserlauf-Anzeige aktualisieren (Pfeile bleiben immer nach unten)
function updateWaterFlowDisplay() {
    const leftFlow = document.getElementById('water-flow-left');
    const rightFlow = document.getElementById('water-flow-right');
    
    if (!leftFlow || !rightFlow) return;
    
    // Standardmäßig beide Seiten anzeigen mit Pfeilen nach unten
    // Die Dachform wird ja automatisch gedreht, sodass die Traufe immer unten ist
    leftFlow.style.display = 'flex';
    rightFlow.style.display = 'flex';
    
    // Pfeile zeigen IMMER nach unten, da sich die Dachform entsprechend dreht
    leftFlow.innerHTML = '<div class="flow-text">Wasserlauf</div><div class="flow-arrow">⬇</div>';
    rightFlow.innerHTML = '<div class="flow-text">Wasserlauf</div><div class="flow-arrow">⬇</div>';
}

// NEU: Overlay schließen
function closeOverlay() {
    if (window.currentOverlay) {
        document.body.removeChild(window.currentOverlay);
        window.currentOverlay = null;
    }
}

// Event-Handler
function setupEventHandlers() {
    const btnMirrorH = document.getElementById('btn-mirror-horizontal');
    const btnMirrorV = document.getElementById('btn-mirror-vertical');
    const btnRotateL = document.getElementById('btn-rotate-left');
    const btnRotateR = document.getElementById('btn-rotate-right');
    const btnTraufe = document.getElementById('btn-traufe');
    const btnReset = document.getElementById('btn-reset');
    const btnBack = document.getElementById('btn-back');
    const btnContinue = document.getElementById('btn-continue');

    if (btnMirrorH) btnMirrorH.addEventListener('click', function() {
        currentPoints = currentPoints.map(p => ({ x: -p.x, y: p.y }));
        updateShape();
        updateInfoPanel();
    });

    if (btnMirrorV) btnMirrorV.addEventListener('click', function() {
        currentPoints = currentPoints.map(p => ({ x: p.x, y: -p.y }));
        updateShape();
        updateInfoPanel();
    });

    // 45° Drehung
    if (btnRotateL) btnRotateL.addEventListener('click', function() {
        const angle = -Math.PI / 4; // -45 Grad
        const bounds = getBoundingBox(currentPoints);
        const centerX = (bounds.minX + bounds.maxX) / 2;
        const centerY = (bounds.minY + bounds.maxY) / 2;
        
        currentPoints = currentPoints.map(p => {
            const x = p.x - centerX;
            const y = p.y - centerY;
            return {
                x: (x * Math.cos(angle) - y * Math.sin(angle)) + centerX,
                y: (x * Math.sin(angle) + y * Math.cos(angle)) + centerY
            };
        });
        updateShape();
        updateInfoPanel();
    });

    if (btnRotateR) btnRotateR.addEventListener('click', function() {
        const angle = Math.PI / 4; // +45 Grad
        const bounds = getBoundingBox(currentPoints);
        const centerX = (bounds.minX + bounds.maxX) / 2;
        const centerY = (bounds.minY + bounds.maxY) / 2;
        
        currentPoints = currentPoints.map(p => {
            const x = p.x - centerX;
            const y = p.y - centerY;
            return {
                x: (x * Math.cos(angle) - y * Math.sin(angle)) + centerX,
                y: (x * Math.sin(angle) + y * Math.cos(angle)) + centerY
            };
        });
        updateShape();
        updateInfoPanel();
    });

    // Traufe-Bestimmung
    if (btnTraufe) btnTraufe.addEventListener('click', selectTraufeSide);

    if (btnReset) btnReset.addEventListener('click', function() {
        // Reset zu Standardwerten basierend auf der aktuellen Form
        const variant = projectData.roofShape?.variant || 'rechteck';
        if (variant === 'quadrat') {
            currentValues = { size: 8 };
        } else if (variant === 'trapez') {
            currentValues = { bottomWidth: 10, topWidth: 6, height: 6, topOffset: 2 };
        } else {
            currentValues = { length: 10, width: 8 };
        }
        
        waterFlowDirection = 'down';
        preferredDirection = 'laengs';
        generateInputFields();
        updateGeometry();
        // Wasserlauf-Display wird NICHT zurückgesetzt - Pfeile bleiben nach unten
        // updateWaterFlowDisplay(); // <- Auskommentiert
    });

    if (btnBack) btnBack.addEventListener('click', function() {
        window.location.href = 'dachform.html';
    });

    if (btnContinue) btnContinue.addEventListener('click', saveAndContinue);
}

// Speichern und weiter
function saveAndContinue() {
    try {
        if (!projectData.profile) {
            alert('Profil-Daten fehlen! Bitte kehren Sie zu Schritt 1 zurück.');
            return;
        }

        projectData.geometry = {
            shapeType: currentShapeType,
            values: currentValues,
            points: currentPoints,
            waterFlowDirection: waterFlowDirection,
            preferredDirection: preferredDirection
        };
        
        if (!projectData.roofShape) {
            projectData.roofShape = {};
        }
        
        projectData.roofShape.points = currentPoints;
        projectData.roofShape.dachTyp = projectData.roofShape.variant || currentShapeType || 'Rechteck';
        projectData.roofShape.dachNeigung = projectData.roofShape.dachNeigung || 15;
        projectData.roofShape.area = calculateArea(currentPoints);
        projectData.roofShape.perimeter = calculatePerimeter(currentPoints);
        projectData.roofShape.waterFlowDirection = waterFlowDirection;
        projectData.roofShape.preferredDirection = preferredDirection;
        
        const saved = saveData();
        if (saved) {
            window.location.href = 'berechnung.html';
        } else {
            alert('Speichern fehlgeschlagen. Daten werden in der Session gespeichert.');
            window.location.href = 'berechnung.html';
        }
    } catch (error) {
        console.error('Fehler beim Speichern:', error);
        alert('Ein Fehler ist aufgetreten. Trotzdem fortfahren?');
        window.location.href = 'berechnung.html';
    }
}

// Initialisierung
function init() {
    try {
        console.log('Editor wird initialisiert...');
        
        projectData = loadData();
        console.log('Geladene Projektdaten:', projectData);
        
        if (!projectData || typeof projectData !== 'object') {
            alert('Keine gültigen Projektdaten gefunden! Bitte starten Sie von Schritt 1.');
            window.location.href = 'profil.html';
            return;
        }
        
        if (!projectData.profile) {
            console.log('Verfügbare Daten-Keys:', Object.keys(projectData));
            alert('Keine Profil-Daten gefunden! Bitte kehren Sie zu Schritt 1 zurück.');
            window.location.href = 'profil.html';
            return;
        }
        
        console.log('Profil-Daten gefunden:', projectData.profile);
        displayProfileInfo();
        
        // Gespeicherte Verlegerichtung laden
        if (projectData.geometry) {
            if (projectData.geometry.waterFlowDirection) {
                waterFlowDirection = projectData.geometry.waterFlowDirection;
            }
            if (projectData.geometry.preferredDirection) {
                preferredDirection = projectData.geometry.preferredDirection;
            }
            if (projectData.geometry.values) {
                currentValues = { ...projectData.geometry.values };
            }
        }
        
        // Stelle sicher, dass roofShape existiert
        if (!projectData.roofShape) {
            console.log('Keine roofShape gefunden, erstelle Standard-roofShape');
            projectData.roofShape = {
                baseShape: 'viereck',
                variant: 'rechteck'
            };
        }
        
        console.log('RoofShape-Daten:', projectData.roofShape);
        currentShapeType = projectData.roofShape.baseShape || 'viereck';
        
        // Shape-Namen aktualisieren
        const shapeNameElement = document.getElementById('current-shape-name');
        if (shapeNameElement) {
            const shapeName = projectData.roofShape.variant || currentShapeType || 'Rechteck';
            shapeNameElement.textContent = shapeName.charAt(0).toUpperCase() + shapeName.slice(1);
        }
        
        // Vorhandene Punkte laden oder neue generieren
        if (projectData.roofShape && projectData.roofShape.points && projectData.roofShape.points.length > 0) {
            console.log('Lade vorhandene Dachform-Punkte:', projectData.roofShape.points.length, 'Punkte');
            currentPoints = [...projectData.roofShape.points];
        } else {
            console.log('Keine Punkte vorhanden - generiere neue basierend auf Form');
            currentPoints = generatePoints();
        }
        
        generateInputFields();
        updateShape();
        updateInfoPanel();
        
        // Wasserlauf-Anzeige nur EINMAL beim Start setzen - danach bleiben Pfeile immer nach unten
        updateWaterFlowDisplay();
        
        setupEventHandlers();
        
        console.log('Editor erfolgreich initialisiert');
        
    } catch (error) {
        console.error('Fehler bei der Initialisierung:', error);
        alert('Fehler beim Laden des Editors: ' + error.message);
    }
}

// Globale Funktionen für Overlay-Buttons
window.setTraufePosition = setTraufePosition;
window.closeOverlay = closeOverlay;

// Event Listeners für das Laden
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOMContentLoaded Event ausgelöst');
    init();
});

if (document.readyState === 'loading') {
    console.log('Dokument lädt noch, warte auf DOMContentLoaded...');
} else {
    console.log('Dokument bereits geladen, starte sofort...');
    setTimeout(function() {
        init();
    }, 100);
}
