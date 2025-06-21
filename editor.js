// Korrigierte determineActualShape() Funktion
function determineActualShape() {
    if (shapeCache.lastShape === currentShape && shapeCache.lastVariant === currentVariant) {
        return shapeCache.lastResult;
    }
    
    let result = 'rechteck';
    
    // WICHTIGE KORREKTUR: trapez explizit behandeln
    if (currentVariant === 'trapez') result = 'trapez';
    else if (currentVariant === 'quadrat') result = 'quadrat';
    else if (currentVariant === 'parallelogramm') result = 'parallelogramm';
    else if (currentVariant === 'rhombus') result = 'rhombus';
    else if (currentVariant === 'rechteck') result = 'rechteck';
    else if (currentVariant === 'kreis') result = 'kreis';
    else if (currentVariant === 'oval') result = 'oval';
    else if (currentVariant === 'halbkreis') result = 'halbkreis';
    else if (currentVariant === 'viertelkreis') result = 'viertelkreis';
    else if (currentVariant === 'langloch') result = 'langloch';
    else if (currentVariant === 'gleichseitig' || currentVariant === 'rechtwinklig' || currentVariant === 'ungleichschenklig') result = 'dreieck';
    else if (currentVariant === 'fuenfeck') result = 'fuenfeck';
    else if (currentVariant === 'sechseck') result = 'sechseck';
    else if (currentVariant === 'achteck') result = 'achteck';
    else if (currentVariant === 'lform') result = 'lform';
    else if (currentVariant === 'tform') result = 'tform';
    else if (currentVariant === 'uform') result = 'uform';
    else if (currentShape === 'kreis') result = 'kreis';
    else if (currentShape === 'dreieck') result = 'dreieck';
    else if (currentShape === 'vieleck') result = 'fuenfeck';
    
    shapeCache.lastShape = currentShape;
    shapeCache.lastVariant = currentVariant;
    shapeCache.lastResult = result;
    
    return result;
}

// Korrigierte createInputFields() Funktion 
function createInputFields() {
    const container = document.getElementById('geometry-inputs-grid');
    if (!container) return;
    
    container.innerHTML = '';
    const finalShape = determineActualShape();
    const variant = determineActualVariant();
    const savedData = projectData.roofShape || {};
    
    console.log('createInputFields - finalShape:', finalShape, 'variant:', variant);
    
    if (finalShape === 'kreis') {
        container.appendChild(createInput('Radius (m)', 'radius', savedData.radius || '3'));
    } else if (finalShape === 'oval') {
        container.appendChild(createInput('Radius X (m)', 'radiusX', savedData.radiusX || '4'));
        container.appendChild(createInput('Radius Y (m)', 'radiusY', savedData.radiusY || '2.5'));
    } else if (finalShape === 'dreieck') {
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
    } else if (finalShape === 'quadrat') {
        container.appendChild(createInput('Seitenlänge (m)', 'side', savedData.side || '5'));
    } else if (finalShape === 'trapez') {
        // KORREKTUR: Spezielle Trapez-Eingabefelder
        container.appendChild(createInput('Seite A (unten) (m)', 'sideA', savedData.sideA || '8'));
        container.appendChild(createInput('Seite B (oben) (m)', 'sideB', savedData.sideB || '6'));
        container.appendChild(createInput('Höhe (m)', 'height', savedData.height || '4'));
        container.appendChild(createInput('Versatz (m)', 'offset', savedData.offset || '1'));
    } else {
        // Standard Rechteck
        container.appendChild(createInput('Länge (m)', 'length', savedData.length || '8'));
        container.appendChild(createInput('Breite (m)', 'width', savedData.width || '5'));
    }
}

// Korrigierte drawTrapezShape() Funktion
function drawTrapezShape(group, data, scale) {
    const sideA = (data.sideA || 8) * scale;     // Untere Seite (länger)
    const sideB = (data.sideB || 6) * scale;     // Obere Seite (kürzer)
    const height = (data.height || 4) * scale;   // Höhe des Trapezes
    const offset = (data.offset || 1) * scale;   // Versatz der oberen Seite
    
    const centerX = CANVAS_CENTER_X;
    const centerY = CANVAS_CENTER_Y;
    
    // KORRIGIERTE Trapez-Punkte: unten links -> unten rechts -> oben rechts -> oben links
    const points = [
        { x: centerX - sideA/2, y: centerY + height/2 },        // unten links
        { x: centerX + sideA/2, y: centerY + height/2 },        // unten rechts  
        { x: centerX + sideB/2 + offset, y: centerY - height/2 }, // oben rechts (mit Versatz)
        { x: centerX - sideB/2 + offset, y: centerY - height/2 }  // oben links (mit Versatz)
    ];
    
    const pointsStr = points.map(p => `${p.x},${p.y}`).join(' ');
    
    const polygon = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
    polygon.setAttribute('points', pointsStr);
    polygon.setAttribute('fill', 'rgba(0, 123, 255, 0.3)');
    polygon.setAttribute('stroke', '#007bff');
    polygon.setAttribute('stroke-width', '3');
    group.appendChild(polygon);
    
    console.log('Trapez gezeichnet mit Punkten:', points);
}

// Korrigierte getActualCornerPositions() für Trapez
function getActualCornerPositions(data, scale) {
    const finalShape = determineActualShape();
    const variant = determineActualVariant();
    let corners = [];
    
    console.log('getActualCornerPositions - finalShape:', finalShape, 'data:', data);
    
    if (finalShape === 'kreis') {
        const radius = (data.radius || 3) * scale;
        for (let i = 0; i < 12; i++) {
            const angle = (i * 2 * Math.PI) / 12;
            corners.push({
                x: CANVAS_CENTER_X + radius * Math.cos(angle),
                y: CANVAS_CENTER_Y + radius * Math.sin(angle)
            });
        }
    } else if (finalShape === 'oval') {
        const radiusX = (data.radiusX || 4) * scale;
        const radiusY = (data.radiusY || 2.5) * scale;
        for (let i = 0; i < 12; i++) {
            const angle = (i * 2 * Math.PI) / 12;
            corners.push({
                x: CANVAS_CENTER_X + radiusX * Math.cos(angle),
                y: CANVAS_CENTER_Y + radiusY * Math.sin(angle)
            });
        }
    } else if (finalShape === 'dreieck') {
        if (variant === 'gleichseitig') {
            const side = (data.side || 6) * scale;
            const height = side * Math.sqrt(3) / 2;
            corners = [
                { x: CANVAS_CENTER_X, y: CANVAS_CENTER_Y - height/3 },
                { x: CANVAS_CENTER_X - side/2, y: CANVAS_CENTER_Y + height*2/3 },
                { x: CANVAS_CENTER_X + side/2, y: CANVAS_CENTER_Y + height*2/3 }
            ];
        } else if (variant === 'rechtwinklig') {
            const katheteA = (data.katheteA || 4) * scale;
            const katheteB = (data.katheteB || 5) * scale;
            corners = [
                { x: CANVAS_CENTER_X - katheteA/2, y: CANVAS_CENTER_Y + katheteB/3 },
                { x: CANVAS_CENTER_X + katheteA/2, y: CANVAS_CENTER_Y + katheteB/3 },
                { x: CANVAS_CENTER_X - katheteA/2, y: CANVAS_CENTER_Y - katheteB*2/3 }
            ];
        } else {
            const sideA = (data.sideA || 4) * scale;
            corners = [
                { x: CANVAS_CENTER_X, y: CANVAS_CENTER_Y - 3 * scale },
                { x: CANVAS_CENTER_X - sideA/2, y: CANVAS_CENTER_Y + 2 * scale },
                { x: CANVAS_CENTER_X + sideA/2, y: CANVAS_CENTER_Y + 2 * scale }
            ];
        }
    } else if (finalShape === 'quadrat') {
        const side = (data.side || 5) * scale;
        corners = [
            { x: CANVAS_CENTER_X - side/2, y: CANVAS_CENTER_Y - side/2 },
            { x: CANVAS_CENTER_X + side/2, y: CANVAS_CENTER_Y - side/2 },
            { x: CANVAS_CENTER_X + side/2, y: CANVAS_CENTER_Y + side/2 },
            { x: CANVAS_CENTER_X - side/2, y: CANVAS_CENTER_Y + side/2 }
        ];
    } else if (finalShape === 'trapez') {
        // KORRIGIERTE Trapez-Eckpunkte
        const sideA = (data.sideA || 8) * scale;
        const sideB = (data.sideB || 6) * scale;
        const height = (data.height || 4) * scale;
        const offset = (data.offset || 1) * scale;
        
        corners = [
            { x: CANVAS_CENTER_X - sideA/2, y: CANVAS_CENTER_Y + height/2 },        // unten links
            { x: CANVAS_CENTER_X + sideA/2, y: CANVAS_CENTER_Y + height/2 },        // unten rechts
            { x: CANVAS_CENTER_X + sideB/2 + offset, y: CANVAS_CENTER_Y - height/2 }, // oben rechts
            { x: CANVAS_CENTER_X - sideB/2 + offset, y: CANVAS_CENTER_Y - height/2 }  // oben links
        ];
        
        console.log('Trapez-Eckpunkte berechnet:', corners);
    } else {
        // Rechteck
        const length = (data.length || 8) * scale;
        const width = (data.width || 5) * scale;
        corners = [
            { x: CANVAS_CENTER_X - length/2, y: CANVAS_CENTER_Y - width/2 },
            { x: CANVAS_CENTER_X + length/2, y: CANVAS_CENTER_Y - width/2 },
            { x: CANVAS_CENTER_X + length/2, y: CANVAS_CENTER_Y + width/2 },
            { x: CANVAS_CENTER_X - length/2, y: CANVAS_CENTER_Y + width/2 }
        ];
    }
    
    return corners;
}

// Korrigierte updateCalculations() für Trapez
function updateCalculations(data) {
    let area = 0;
    let perimeter = 0;
    const finalShape = determineActualShape();
    const variant = determineActualVariant();
    
    console.log('updateCalculations - finalShape:', finalShape, 'data:', data);
    
    switch (finalShape) {
        case 'kreis':
            const radius = data.radius || 3;
            area = Math.PI * radius * radius;
            perimeter = 2 * Math.PI * radius;
            break;
        case 'oval':
            const radiusX = data.radiusX || 4;
            const radiusY = data.radiusY || 2.5;
            area = Math.PI * radiusX * radiusY;
            perimeter = Math.PI * (3 * (radiusX + radiusY) - Math.sqrt((3 * radiusX + radiusY) * (radiusX + 3 * radiusY)));
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
        case 'trapez':
            // KORRIGIERTE Trapez-Berechnung
            const sideA = data.sideA || 8;  // untere Seite
            const sideB = data.sideB || 6;  // obere Seite  
            const height = data.height || 4;
            
            // Fläche: (a + b) / 2 * h
            area = ((sideA + sideB) / 2) * height;
            
            // Umfang: a + b + 2 * seitenlänge
            // Seitenlänge mit Offset berechnen
            const offset = data.offset || 1;
            const sideLength = Math.sqrt(height * height + offset * offset);
            perimeter = sideA + sideB + 2 * sideLength;
            
            console.log('Trapez-Berechnung:', { 
                sideA, sideB, height, offset, area: area.toFixed(2), perimeter: perimeter.toFixed(2) 
            });
            break;
        default:
            area = 40;
            perimeter = 26;
    }
    
    const areaElement = document.getElementById('calc-area');
    const perimeterElement = document.getElementById('calc-perimeter');
    
    if (areaElement) areaElement.textContent = area.toFixed(2) + ' m²';
    if (perimeterElement) perimeterElement.textContent = perimeter.toFixed(2) + ' m';
}

// Korrigierte generateRoofPoints() für Trapez
function generateRoofPoints(data) {
    const finalShape = determineActualShape();
    const variant = determineActualVariant();
    let points = [];
    
    console.log('generateRoofPoints - finalShape:', finalShape, 'data:', data);
    
    switch (finalShape) {
        case 'kreis':
            const radius = data.radius || 3;
            for (let i = 0; i < 16; i++) {
                const angle = (i * 2 * Math.PI) / 16;
                points.push({
                    x: radius * Math.cos(angle),
                    y: radius * Math.sin(angle)
                });
            }
            break;
        case 'dreieck':
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
        case 'quadrat':
            const side = data.side || 5;
            points = [
                { x: -side/2, y: -side/2 }, { x: side/2, y: -side/2 },
                { x: side/2, y: side/2 }, { x: -side/2, y: side/2 }
            ];
            break;
        case 'trapez':
            // KORRIGIERTE Trapez-Punkte
            const sideA = data.sideA || 8;
            const sideB = data.sideB || 6;
            const height = data.height || 4;
            const offset = data.offset || 1;
            
            points = [
                { x: -sideA/2, y: -height/2 },           // unten links
                { x: sideA/2, y: -height/2 },            // unten rechts
                { x: sideB/2 + offset, y: height/2 },    // oben rechts
                { x: -sideB/2 + offset, y: height/2 }    // oben links
            ];
            
            console.log('Trapez-Punkte generiert:', points);
            break;
        default:
            const rectLength = data.length || 8;
            const rectWidth = data.width || 5;
            points = [
                { x: -rectLength/2, y: -rectWidth/2 }, { x: rectLength/2, y: -rectWidth/2 },
                { x: rectLength/2, y: rectWidth/2 }, { x: -rectLength/2, y: rectWidth/2 }
            ];
    }
    
    return points;
}

// Korrigierte calculateOptimalScale() für Trapez
function calculateOptimalScale(data) {
    const finalShape = determineActualShape();
    let maxDimension = 0;
    
    if (finalShape === 'kreis') {
        maxDimension = (data.radius || 3) * 2;
    } else if (finalShape === 'oval') {
        maxDimension = Math.max((data.radiusX || 4) * 2, (data.radiusY || 2.5) * 2);
    } else if (finalShape === 'rechteck') {
        maxDimension = Math.max(data.length || 8, data.width || 5);
    } else if (finalShape === 'quadrat') {
        maxDimension = data.side || 5;
    } else if (finalShape === 'dreieck') {
        maxDimension = Math.max(data.sideA || 4, data.sideB || 5, data.sideC || 6);
    } else if (finalShape === 'trapez') {
        // KORRIGIERTE Trapez-Skalierung
        const sideA = data.sideA || 8;
        const sideB = data.sideB || 6;
        const height = data.height || 4;
        const offset = Math.abs(data.offset || 1);
        
        // Maximum von Breite und Höhe bestimmen
        const maxWidth = Math.max(sideA, sideB + offset * 2); // Berücksichtige Versatz
        maxDimension = Math.max(maxWidth, height);
        
        console.log('Trapez-Skalierung:', { sideA, sideB, height, offset, maxWidth, maxDimension });
    } else {
        maxDimension = Math.max(data.length || 8, data.width || 5);
    }
    
    const canvasWidth = 600 - (CANVAS_PADDING * 2);
    const canvasHeight = 400 - (CANVAS_PADDING * 2);
    
    let scale = Math.min(canvasWidth / maxDimension, canvasHeight / maxDimension) * 0.85;
    scale = Math.max(scale, MIN_SCALE);
    scale = Math.min(scale, MAX_SCALE);
    
    return scale;
}

console.log('Trapez-korrigierte editor.js Funktionen geladen');
