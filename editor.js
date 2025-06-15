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

// Eingabefelder generieren
function generateInputFields() {
    const container = document.getElementById('geometry-inputs-grid');
    if (!container) return;
    
    console.log('Generiere Eingabefelder für:', currentShapeType, 'Variante:', projectData.roofShape?.variant);
    
    if (currentShapeType === 'dreieck') {
        generateTriangleInputFields();
    } else if (currentShapeType === 'viereck') {
        generateViereckInputFields();
    } else if (currentShapeType === 'vieleck') {
        generateVieleckInputFields();
    } else if (currentShapeType === 'kreis') {
        generateKreisInputFields();
    } else {
        generateRectangleInputFields();
    }
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
    `;
}

// Viereck-Eingabefelder
function generateViereckInputFields() {
    const container = document.getElementById('geometry-inputs-grid');
    const variant = projectData.roofShape?.variant || 'rechteck';
    
    if (variant === 'rechteck') {
        generateRectangleInputFields();
    } else if (variant === 'quadrat') {
        container.innerHTML = `
            <div class="input-group">
                <label for="dim-size">Seitenlänge:</label>
                <div class="input-group-wrapper">
                    <input type="number" id="dim-size" step="0.1" min="0.1" value="${currentValues.size || 8}" onchange="updateSquareValue('size', this.value)">
                    <span class="input-unit">m</span>
                </div>
            </div>
        `;
    } else if (variant === 'trapez') {
        container.innerHTML = `
            <div class="input-group">
                <label for="dim-bottom">Untere Breite:</label>
                <div class="input-group-wrapper">
                    <input type="number" id="dim-bottom" step="0.1" min="0.1" value="${currentValues.bottomWidth || 10}" onchange="updateValue('bottomWidth', this.value)">
                    <span class="input-unit">m</span>
                </div>
            </div>
            <div class="input-group">
                <label for="dim-top">Obere Breite:</label>
                <div class="input-group-wrapper">
                    <input type="number" id="dim-top" step="0.1" min="0.1" value="${currentValues.topWidth || 6}" onchange="updateValue('topWidth', this.value)">
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
    } else if (variant === 'parallelogramm') {
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
    } else if (variant === 'rhombus') {
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
    }
}

// Dreieck-Eingabefelder
function generateTriangleInputFields() {
    const container = document.getElementById('geometry-inputs-grid');
    const variant = projectData.roofShape?.variant || 'gleichseitig';
    
    if (variant === 'gleichseitig') {
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
    } else if (variant === 'rechtwinklig') {
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
    } else if (variant === 'ungleichschenklig') {
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
    }
}

// Kreis-Eingabefelder
function generateKreisInputFields() {
    const container = document.getElementById('geometry-inputs-grid');
    const variant = projectData.roofShape?.variant || 'kreis';
    
    if (variant === 'kreis') {
        container.innerHTML = `
            <div class="input-group">
                <label for="dim-radius">Radius:</label>
                <div class="input-group-wrapper">
                    <input type="number" id="dim-radius" step="0.1" min="0.1" value="${currentValues.radius || 5}" onchange="updateValue('radius', this.value)">
                    <span class="input-unit">m</span>
                </div>
            </div>
        `;
    } else if (variant === 'oval') {
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
    } else if (variant === 'halbkreis') {
        container.innerHTML = `
            <div class="input-group">
                <label for="dim-radius">Radius:</label>
                <div class="input-group-wrapper">
                    <input type="number" id="dim-radius" step="0.1" min="0.1" value="${currentValues.radius || 5}" onchange="updateValue('radius', this.value)">
                    <span class="input-unit">m</span>
                </div>
            </div>
        `;
    } else if (variant === 'langloch') {
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
    }
}

// Vieleck-Eingabefelder
function generateVieleckInputFields() {
    const container = document.getElementById('geometry-inputs-grid');
    const variant = projectData.roofShape?.variant || 'fuenfeck';
    
    if (variant === 'lform') {
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
    } else if (variant === 'tform') {
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
    } else {
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

// Punkte generieren
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
    if (variant === 'quadrat') {
        const size = currentValues.size || 8;
        return [
            { x: 0, y: 0 }, { x: size, y: 0 }, 
            { x: size, y: size }, { x: 0, y: size }
        ];
    } else if (variant === 'trapez') {
        const bottomWidth = currentValues.bottomWidth || 10;
        const topWidth = currentValues.topWidth || 6;
        const height = currentValues.height || 6;
        const offset = currentValues.topOffset || 2;
        return [
            { x: 0, y: 0 }, 
            { x: bottomWidth, y: 0 }, 
            { x: bottomWidth - offset, y: height }, 
            { x: offset, y: height }
        ];
    } else if (variant === 'parallelogramm') {
        const length = currentValues.length || 10;
        const width = currentValues.width || 6;
        const skew = currentValues.skew || 2;
        return [
            { x: 0, y: 0 }, { x: length, y: 0 }, 
            { x: length + skew, y: width }, { x: skew, y: width }
        ];
    } else if (variant === 'rhombus') {
        const rWidth = currentValues.width || 10;
        const rHeight = currentValues.height || 8;
        return [
            { x: rWidth / 2, y: 0 }, { x: rWidth, y: rHeight / 2 }, 
            { x: rWidth / 2, y: rHeight }, { x: 0, y: rHeight / 2 }
        ];
    } else {
        // rechteck
        return [
            { x: 0, y: 0 }, { x: currentValues.length || 10, y: 0 }, 
            { x: currentValues.length || 10, y: currentValues.width || 8 }, { x: 0, y: currentValues.width || 8 }
        ];
    }
}

function generateTrianglePoints(variant) {
    const base = currentValues.base || 10;
    const height = currentValues.height || 8;
    
    if (variant === 'gleichseitig') {
        return [
            { x: base / 2, y: height },
            { x: 0, y: 0 },
            { x: base, y: 0 }
        ];
    } else if (variant === 'rechtwinklig') {
        return [
            { x: 0, y: 0 },
            { x: base, y: 0 },
            { x: 0, y: height }
        ];
    } else if (variant === 'ungleichschenklig') {
        const offset = currentValues.offset || 3;
        return [
            { x: offset, y: height },
            { x: 0, y: 0 },
            { x: base, y: 0 }
        ];
    } else {
        return [
            { x: base / 2, y: height },
            { x: 0, y: 0 },
            { x: base, y: 0 }
        ];
    }
}

function generateCirclePoints(variant) {
    if (variant === 'kreis') {
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
    } else if (variant === 'oval') {
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
    } else if (variant === 'halbkreis') {
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
    } else if (variant === 'langloch') {
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
    } else {
        return generateCirclePoints('kreis');
    }
}

function generatePolygonPoints(variant) {
    if (variant === 'lform') {
        const w1 = currentValues.width1 || 6;
        const w2 = currentValues.width2 || 4;
        const h1 = currentValues.height1 || 4;
        const h2 = currentValues.height2 || 8;
        return [
            { x: 0, y: 0 }, { x: w1, y: 0 }, { x: w1, y: h1 },
            { x: w1 + w2, y: h1 }, { x: w1 + w2, y: h2 }, { x: 0, y: h2 }
        ];
    } else if (variant === 'tform') {
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
    } else {
        // Standard für regelmäßige Vielecke
        const r = currentValues.radius || 5;
        const sides = variant === 'fuenfeck' ? 5 : variant === 'sechseck' ? 6 : variant === 'achteck' ? 8 : 5;
        const points = [];
        for (let i = 0; i < sides; i++) {
            const angle = (i * 2 * Math.PI) / sides - Math.PI / 2;
            points.push({
                x: r + r * Math.cos(angle),
                y: r + r * Math.sin(angle)
            });
        }
        return points;
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

// Traufe-Seite auswählen
function selectTraufeSide() {
    console.log('Traufe-Auswahl gestartet');
    
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
            <button onclick="setTraufePosition('top')" style="padding: 20px 40px; font-size: 16px; cursor: pointer; border: none; border-radius: 5px;">↑ Oben</button>
            <button onclick="setTraufePosition('right')" style="padding: 20px 40px; font-size: 16px; cursor: pointer; border: none; border-radius: 5px;">→ Rechts</button>
            <button onclick="setTraufePosition('bottom')" style="padding: 20px 40px; font-size: 16px; cursor: pointer; border: none; border-radius: 5px;">↓ Unten</button>
            <button onclick="setTraufePosition('left')" style="padding: 20px 40px; font-size: 16px; cursor: pointer; border: none; border-radius: 5px;">← Links</button>
        </div>
        <button onclick="closeOverlay()" style="margin-top: 30px; padding: 10px 20px; background: #666; color: white; border: none; cursor: pointer; border-radius: 5px;">Abbrechen</button>
    `;
    
    document.body.appendChild(overlay);
    window.currentOverlay = overlay;
}

// Traufe-Position setzen
function setTraufePosition(position) {
    console.log('Traufe-Position gesetzt: ' + position);
    
    orientToTraufe(position);
    waterFlowDirection = position;
    determinePreferredDirection();
    closeOverlay();
}

// Form zur Traufe-Position ausrichten
function orientToTraufe(position) {
    const bounds = getBoundingBox(currentPoints);
    const centerX = (bounds.minX + bounds.maxX) / 2;
    const centerY = (bounds.minY + bounds.maxY) / 2;
    
    currentPoints = currentPoints.map(p => ({
        x: p.x - centerX,
        y: p.y - centerY
    }));
    
    let rotationAngle = 0;
    if (position === 'top') {
        rotationAngle = Math.PI;
    } else if (position === 'right') {
        rotationAngle = -Math.PI / 2;
    } else if (position === 'bottom') {
        rotationAngle = 0;
    } else if (position === 'left') {
        rotationAngle = Math.PI / 2;
    }
    
    if (rotationAngle !== 0) {
        currentPoints = currentPoints.map(p => ({
            x: p.x * Math.cos(rotationAngle) - p.y * Math.sin(rotationAngle),
            y: p.x * Math.sin(rotationAngle) + p.y * Math.cos(rotationAngle)
        }));
    }
    
    currentPoints = currentPoints.map(p => ({
        x: p.x + centerX,
        y: p.y + centerY
    }));
    
    updateShape();
    updateInfoPanel();
}

// Bounding Box berechnen
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

// Wasserlauf-Anzeige aktualisieren (Pfeile bleiben immer nach unten)
function updateWaterFlowDisplay() {
    const leftFlow = document.getElementById('water-flow-left');
    const rightFlow = document.getElementById('water-flow-right');
    
    if (!leftFlow || !rightFlow) return;
    
    leftFlow.style.display = 'flex';
    rightFlow.style.display = 'flex';
    
    leftFlow.innerHTML = '<div class="flow-text">Wasserlauf</div><div class="flow-arrow">⬇</div>';
    rightFlow.innerHTML = '<div class="flow-text">Wasserlauf</div><div class="flow-arrow">⬇</div>';
}

// Overlay schließen
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

    if (btnMirrorH) {
        btnMirrorH.addEventListener('click', function() {
            currentPoints = currentPoints.map(p => ({ x: -p.x, y: p.y }));
            updateShape();
            updateInfoPanel();
        });
    }

    if (btnMirrorV) {
        btnMirrorV.addEventListener('click', function() {
            currentPoints = currentPoints.map(p => ({ x: p.x, y: -p.y }));
            updateShape();
            updateInfoPanel();
        });
    }

    if (btnRotateL) {
        btnRotateL.addEventListener('click', function() {
            const angle = -Math.PI / 4;
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
    }

    if (btnRotateR) {
        btnRotateR.addEventListener('click', function() {
            const angle = Math.PI / 4;
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
    }

    if (btnTraufe) {
        btnTraufe.addEventListener('click', selectTraufeSide);
    }

    if (btnReset) {
        btnReset.addEventListener('click', function() {
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
        });
    }

    if (btnBack) {
        btnBack.addEventListener('click', function() {
            window.location.href = 'dachform.html';
        });
    }

    if (btnContinue) {
        btnContinue.addEventListener('click', saveAndContinue);
    }
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
        
        if (!projectData.roofShape) {
            console.log('Keine roofShape gefunden, erstelle Standard-roofShape');
            projectData.roofShape = {
                baseShape: 'viereck',
                variant: 'rechteck'
            };
        }
        
        console.log('RoofShape-Daten:', projectData.roofShape);
        currentShapeType = projectData.roofShape.baseShape || 'viereck';
        
        const shapeNameElement = document.getElementById('current-shape-name');
        if (shapeNameElement) {
            const shapeName = projectData.roofShape.variant || currentShapeType || 'Rechteck';
            shapeNameElement.textContent = shapeName.charAt(0).toUpperCase() + shapeName.slice(1);
        }
        
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
