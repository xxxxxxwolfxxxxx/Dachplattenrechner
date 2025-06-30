// KORRIGIERTE createInputFields Funktion in editor.js

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
                // KORRIGIERT: Richtige Labels für Trapez
                container.appendChild(createInput('Basis unten (m)', 'sideA', savedData.sideA || '8'));
                container.appendChild(createInput('Basis oben (m)', 'sideB', savedData.sideB || '6'));
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

// KORRIGIERTE Rhombus-Zeichnung in editor.js
function drawRhombusShape(group, data, scale) {
    const side = (data.side || 5) * scale;
    const angle = (data.angle || 60) * Math.PI / 180;
    
    // KONSISTENTE Rhombus-Punkte (wie in berechnung.js)
    const halfDiag1 = side * Math.sin(angle / 2);
    const halfDiag2 = side * Math.cos(angle / 2);
    
    // WICHTIG: Gleiche Punkt-Reihenfolge wie in berechnung.js
    const points = [
        { x: CANVAS_CENTER_X, y: CANVAS_CENTER_Y - halfDiag1 },        // Oben
        { x: CANVAS_CENTER_X + halfDiag2, y: CANVAS_CENTER_Y },         // Rechts
        { x: CANVAS_CENTER_X, y: CANVAS_CENTER_Y + halfDiag1 },         // Unten
        { x: CANVAS_CENTER_X - halfDiag2, y: CANVAS_CENTER_Y }          // Links
    ];
    
    const pointsStr = points.map(p => `${p.x},${p.y}`).join(' ');
    
    const polygon = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
    polygon.setAttribute('points', pointsStr);
    polygon.setAttribute('fill', 'rgba(0, 123, 255, 0.3)');
    polygon.setAttribute('stroke', '#007bff');
    polygon.setAttribute('stroke-width', '3');
    group.appendChild(polygon);
    
    console.log('🔶 Rhombus gezeichnet mit Punkten:', points.map(p => `(${(p.x-CANVAS_CENTER_X)/scale}, ${(CANVAS_CENTER_Y-p.y)/scale})`));
}

// KORRIGIERTE Punkt-Generierung für Rhombus in editor.js
function generateRhombusPointsForEditor(data) {
    const side = data.side || 5;
    const angle = (data.angle || 60) * Math.PI / 180;
    
    // EXAKT wie in berechnung.js
    const halfDiag1 = side * Math.sin(angle / 2);
    const halfDiag2 = side * Math.cos(angle / 2);
    
    // IDENTISCHE Punkt-Reihenfolge
    const points = [
        { x: 0, y: -halfDiag1 },        // Oben
        { x: halfDiag2, y: 0 },         // Rechts
        { x: 0, y: halfDiag1 },         // Unten
        { x: -halfDiag2, y: 0 }         // Links
    ];
    
    console.log('🔶 Editor Rhombus-Punkte generiert:', points);
    return points;
}

// KORRIGIERTE Trapez-Zeichnung in editor.js  
function drawTrapezShape(group, data, scale) {
    const sideA = (data.sideA || 8) * scale;  // Untere Basis
    const sideB = (data.sideB || 6) * scale;  // Obere Basis
    const height = (data.height || 4) * scale; // Höhe
    const offset = (data.offset || 1) * scale; // Versatz
    
    const centerX = CANVAS_CENTER_X;
    const centerY = CANVAS_CENTER_Y;
    
    // Trapez-Punkte: unten breiter, oben schmaler
    const points = [
        { x: centerX - sideA/2, y: centerY + height/2 },  // Links unten
        { x: centerX + sideA/2, y: centerY + height/2 },  // Rechts unten
        { x: centerX + sideB/2 + offset, y: centerY - height/2 },  // Rechts oben
        { x: centerX - sideB/2 + offset, y: centerY - height/2 }   // Links oben
    ];
    
    const pointsStr = points.map(p => `${p.x},${p.y}`).join(' ');
    
    const polygon = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
    polygon.setAttribute('points', pointsStr);
    polygon.setAttribute('fill', 'rgba(0, 123, 255, 0.3)');
    polygon.setAttribute('stroke', '#007bff');
    polygon.setAttribute('stroke-width', '3');
    group.appendChild(polygon);
    
    console.log('📐 Trapez gezeichnet: unten=' + (sideA/scale) + 'm, oben=' + (sideB/scale) + 'm, höhe=' + (height/scale) + 'm');
}

// KORRIGIERTE Trapez-Punkt-Generierung für editor.js
function generateTrapezPointsForEditor(data) {
    const sideA = data.sideA || 8;     // Untere Basis (breiter)
    const sideB = data.sideB || 6;     // Obere Basis (schmaler)
    const height = data.height || 4;   // Höhe
    const offset = data.offset || 1;   // Versatz der oberen Basis
    
    console.log('📐 Trapez-Parameter: unten=' + sideA + 'm, oben=' + sideB + 'm, höhe=' + height + 'm, versatz=' + offset + 'm');
    
    return [
        { x: -sideA/2, y: -height/2 },                    // Links unten
        { x: sideA/2, y: -height/2 },                     // Rechts unten
        { x: sideB/2 + offset, y: height/2 },             // Rechts oben (mit Versatz)
        { x: -sideB/2 + offset, y: height/2 }             // Links oben (mit Versatz)
    ];
}

// ÜBERPRÜFUNG: Konsistenz zwischen Editor und Berechnung
function debugShapeConsistency() {
    console.log('=== SHAPE KONSISTENZ CHECK ===');
    
    // Teste Rhombus
    const rhombusData = { side: 5, angle: 60 };
    const editorRhombus = generateRhombusPointsForEditor(rhombusData);
    console.log('Editor Rhombus:', editorRhombus);
    
    // Teste Trapez  
    const trapezData = { sideA: 8, sideB: 6, height: 4, offset: 1 };
    const editorTrapez = generateTrapezPointsForEditor(trapezData);
    console.log('Editor Trapez:', editorTrapez);
    
    return { rhombus: editorRhombus, trapez: editorTrapez };
}

console.log('✅ Korrigierte Editor-Funktionen geladen - Trapez Labels & Rhombus Konsistenz!');
