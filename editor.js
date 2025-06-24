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

// VERBESSERTE Event-Listener mit Mouse-Events für kontinuierliche Rotation
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

    // VERBESSERTE Rotations-Event-Listener mit kontinuierlicher Rotation
    const rotateLeftBtn = document.getElementById('btn-rotate-left');
    const rotateRightBtn = document.getElementById('btn-rotate-right');
    const resetRotationBtn = document.getElementById('btn-reset-rotation');
    
    if (rotateLeftBtn) {
        // Mouse Events für kontinuierliche Rotation
        rotateLeftBtn.addEventListener('mousedown', function(e) {
            e.preventDefault();
            startContinuousRotation(-1);
        });
        
        rotateLeftBtn.addEventListener('mouseup', stopContinuousRotation);
        rotateLeftBtn.addEventListener('mouseleave', stopContinuousRotation);
        
        // Touch Events für mobile Geräte
        rotateLeftBtn.addEventListener('touchstart', function(e) {
            e.preventDefault();
            startContinuousRotation(-1);
        });
        
        rotateLeftBtn.addEventListener('touchend', stopContinuousRotation);
        rotateLeftBtn.addEventListener('touchcancel', stopContinuousRotation);
    }
    
    if (rotateRightBtn) {
        // Mouse Events für kontinuierliche Rotation
        rotateRightBtn.addEventListener('mousedown', function(e) {
            e.preventDefault();
            startContinuousRotation(1);
        });
        
        rotateRightBtn.addEventListener('mouseup', stopContinuousRotation);
        rotateRightBtn.addEventListener('mouseleave', stopContinuousRotation);
        
        // Touch Events für mobile Geräte
        rotateRightBtn.addEventListener('touchstart', function(e) {
            e.preventDefault();
            startContinuousRotation(1);
        });
        
        rotateRightBtn.addEventListener('touchend', stopContinuousRotation);
        rotateRightBtn.addEventListener('touchcancel', stopContinuousRotation);
    }
    
    if (resetRotationBtn) {
        resetRotationBtn.addEventListener('click', function() {
            stopContinuousRotation(); // Stoppe eventuelle Rotation
            resetRotation();
        });
    }
    
    // Globale Event-Listener für Sicherheit
    document.addEventListener('mouseup', stopContinuousRotation);
    window.addEventListener('blur', stopContinuousRotation);
}

// VERBESSERTE Rotations-Funktionen mit Beschleunigung und Ausrichtungs-Erkennung
let rotationInterval = null;
let rotationSpeed = 1;
let isRotating = false;

function rotateShape(degrees, fromInterval = false) {
    const oldRotation = currentRotation;
    currentRotation += degrees;
    
    // Normalisierung auf 0-360°
    while (currentRotation >= 360) currentRotation -= 360;
    while (currentRotation < 0) currentRotation += 360;
    
    console.log(`🔄 Rotation: ${oldRotation.toFixed(1)}° → ${currentRotation.toFixed(1)}°`);
    
    // Shape neu zeichnen mit Rotation
    updateShapeWithScale(calculateOptimalScale(getCurrentFormData()));
    
    // Prüfe Ausrichtung bei allen Seiten (mit Snap-Funktion)
    checkAlignment();
    
    // Feedback nur bei manuellen Klicks, nicht bei Intervallen
    if (!fromInterval) {
        showFeedback(`Gedreht um ${degrees > 0 ? '+' : ''}${degrees}° (Gesamt: ${currentRotation.toFixed(1)}°)`, '#007bff');
    }
}

function startContinuousRotation(direction) {
    if (isRotating) return;
    
    isRotating = true;
    rotationSpeed = 1;
    
    // Erste Rotation sofort
    rotateShape(direction, true);
    
    // Kontinuierliche Rotation mit Beschleunigung
    rotationInterval = setInterval(() => {
        rotateShape(direction * rotationSpeed, true);
        
        // Geschwindigkeit langsam erhöhen (max 5° pro Schritt)
        if (rotationSpeed < 5) {
            rotationSpeed += 0.1;
        }
    }, 50);
}

function stopContinuousRotation() {
    if (rotationInterval) {
        clearInterval(rotationInterval);
        rotationInterval = null;
    }
    isRotating = false;
    rotationSpeed = 1;
}

function checkAlignment() {
    const points = generateRoofPoints(getCurrentFormData());
    if (!points || points.length < 2) return;
    
    const tolerance = 3; // Toleranz in Grad für Snap-Erkennung
    const snapTolerance = 1; // Genauere Toleranz für visuelle Anzeige
    let alignedSides = [];
    let shouldSnap = null;
    
    // Prüfe alle Seiten der Form
    for (let i = 0; i < points.length; i++) {
        const p1 = points[i];
        const p2 = points[(i + 1) % points.length];
        
        // Berechne ursprünglichen Winkel der Seite (ohne Rotation)
        let originalAngle = Math.atan2(p2.y - p1.y, p2.x - p1.x) * 180 / Math.PI;
        
        // Normalisiere auf 0-360°
        while (originalAngle < 0) originalAngle += 360;
        while (originalAngle >= 360) originalAngle -= 360;
        
        // Berechne aktuellen Winkel mit Rotation
        let currentAngle = originalAngle + currentRotation;
        while (currentAngle < 0) currentAngle += 360;
        while (currentAngle >= 360) currentAngle -= 360;
        
        // Prüfe Ausrichtung zu Hauptachsen (0°, 90°, 180°, 270°)
        const targetAngles = [0, 90, 180, 270];
        for (let targetAngle of targetAngles) {
            const diff = Math.min(
                Math.abs(currentAngle - targetAngle),
                Math.abs(currentAngle - targetAngle + 360),
                Math.abs(currentAngle - targetAngle - 360)
            );
            
            // Snap-Erkennung: Wenn nah genug, merke dir den Snap
            if (diff <= tolerance && !shouldSnap) {
                const snapRotation = targetAngle - originalAngle;
                // Normalisiere Snap-Rotation
                let normalizedSnap = snapRotation;
                while (normalizedSnap < 0) normalizedSnap += 360;
                while (normalizedSnap >= 360) normalizedSnap -= 360;
                
                // Wähle kürzesten Weg zur Ziel-Rotation
                if (normalizedSnap > 180) normalizedSnap -= 360;
                
                shouldSnap = {
                    targetRotation: normalizedSnap,
                    side: i,
                    targetAngle: targetAngle,
                    originalAngle: originalAngle,
                    currentDiff: diff
                };
            }
            
            // Visuelle Anzeige: Nur bei sehr präziser Ausrichtung
            if (diff <= snapTolerance) {
                const direction = targetAngle === 0 || targetAngle === 180 ? 'horizontal' : 'vertical';
                alignedSides.push({
                    side: i,
                    direction: direction,
                    angle: targetAngle,
                    actualAngle: currentAngle,
                    p1: p1,
                    p2: p2
                });
            }
        }
    }
    
    // Automatisches Snapping
    if (shouldSnap && Math.abs(shouldSnap.currentDiff) <= tolerance) {
        performSnap(shouldSnap);
        return; // Nach Snap erneut prüfen
    }
    
    // Visuelle Rückmeldung bei perfekter Ausrichtung
    if (alignedSides.length > 0) {
        showAlignmentFeedback(alignedSides);
        highlightAlignedSides(alignedSides);
    } else {
        removeAlignmentHighlights();
    }
}

function performSnap(snapInfo) {
    console.log(`🧲 Snapping: ${snapInfo.currentDiff.toFixed(1)}° Abweichung → perfekte Ausrichtung`);
    
    // Setze Rotation auf perfekte Ausrichtung
    currentRotation = snapInfo.targetRotation;
    
    // Normalisiere auf 0-360°
    while (currentRotation < 0) currentRotation += 360;
    while (currentRotation >= 360) currentRotation -= 360;
    
    // Shape neu zeichnen
    updateShapeWithScale(calculateOptimalScale(getCurrentFormData()));
    
    // Kurzes visuelles Feedback für Snap
    showSnapFeedback(snapInfo);
    
    // Nach Snap nochmal alignment prüfen für visuelle Anzeige
    setTimeout(() => {
        checkAlignment();
    }, 50);
}

function showSnapFeedback(snapInfo) {
    const direction = snapInfo.targetAngle === 0 || snapInfo.targetAngle === 180 ? 'waagerecht' : 'senkrecht';
    showFeedback(`🧲 Eingerastet! Seite ${snapInfo.side + 1} ist jetzt perfekt ${direction}`, '#ff6b35');
    
    // Rotations-Display orange färben für Snap
    const display = document.getElementById('rotation-display');
    if (display) {
        display.style.background = '#ff6b35';
        display.style.animation = 'pulse 0.3s ease-out';
        
        setTimeout(() => {
            display.style.background = 'rgba(0, 0, 0, 0.8)';
            display.style.animation = '';
        }, 800);
    }
}

function highlightAlignedSides(alignedSides) {
    const svg = document.getElementById('main-svg');
    if (!svg) return;
    
    // Entferne alte Highlights
    removeAlignmentHighlights();
    
    // Erstelle Highlight-Gruppe
    const highlightGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    highlightGroup.id = 'alignment-highlights';
    
    const scale = calculateOptimalScale(getCurrentFormData());
    
    alignedSides.forEach(aligned => {
        const p1 = aligned.p1;
        const p2 = aligned.p2;
        
        // KORRIGIERT: Transformiere Punkte OHNE zusätzliche Rotation
        // (da die Punkte bereits aus generateRoofPoints kommen, die keine Rotation enthalten)
        const x1 = CANVAS_CENTER_X + p1.x * scale;
        const y1 = CANVAS_CENTER_Y + p1.y * scale;
        const x2 = CANVAS_CENTER_X + p2.x * scale;
        const y2 = CANVAS_CENTER_Y + p2.y * scale;
        
        // Erstelle Highlight-Linie
        const highlight = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        highlight.setAttribute('x1', x1);
        highlight.setAttribute('y1', y1);
        highlight.setAttribute('x2', x2);
        highlight.setAttribute('y2', y2);
        highlight.setAttribute('stroke', '#28a745');
        highlight.setAttribute('stroke-width', '8');
        highlight.setAttribute('opacity', '0.9');
        highlight.setAttribute('stroke-linecap', 'round');
        highlight.style.filter = 'drop-shadow(0 0 10px #28a745)';
        highlight.className = 'alignment-highlight';
        
        // KORRIGIERT: Rotation wird hier angewendet, da die Punkte ohne Rotation sind
        if (currentRotation !== 0) {
            highlight.setAttribute('transform', `rotate(${currentRotation} ${CANVAS_CENTER_X} ${CANVAS_CENTER_Y})`);
        }
        
        highlightGroup.appendChild(highlight);
    });
    
    svg.appendChild(highlightGroup);
    
    // Entferne Highlights nach 3 Sekunden
    setTimeout(() => {
        removeAlignmentHighlights();
    }, 3000);
}

function showAlignmentFeedback(alignedSides) {
    const messages = alignedSides.map(side => {
        const dir = side.direction === 'horizontal' ? 'waagerecht' : 'senkrecht';
        return `Seite ${side.side + 1}: ${dir}`;
    });
    
    showFeedback(`✓ Ausgerichtet! ${messages.join(', ')}`, '#28a745');
    
    // Rotations-Display grün färben
    const display = document.getElementById('rotation-display');
    if (display) {
        display.style.background = '#28a745';
        display.style.animation = 'pulse 0.5s ease-out';
        
        setTimeout(() => {
            display.style.background = 'rgba(0, 0, 0, 0.8)';
            display.style.animation = '';
        }, 1000);
    }
}

function highlightAlignedSides(alignedSides, points) {
    const svg = document.getElementById('main-svg');
    if (!svg) return;
    
    // Entferne alte Highlights
    removeAlignmentHighlights();
    
    // Erstelle Highlight-Gruppe
    const highlightGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    highlightGroup.id = 'alignment-highlights';
    
    const scale = calculateOptimalScale(getCurrentFormData());
    
    alignedSides.forEach(aligned => {
        const i = aligned.side;
        const p1 = points[i];
        const p2 = points[(i + 1) % points.length];
        
        // Transformiere Punkte in Canvas-Koordinaten
        const x1 = CANVAS_CENTER_X + p1.x * scale;
        const y1 = CANVAS_CENTER_Y + p1.y * scale;
        const x2 = CANVAS_CENTER_X + p2.x * scale;
        const y2 = CANVAS_CENTER_Y + p2.y * scale;
        
        // Erstelle Highlight-Linie
        const highlight = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        highlight.setAttribute('x1', x1);
        highlight.setAttribute('y1', y1);
        highlight.setAttribute('x2', x2);
        highlight.setAttribute('y2', y2);
        highlight.setAttribute('stroke', '#28a745');
        highlight.setAttribute('stroke-width', '6');
        highlight.setAttribute('opacity', '0.8');
        highlight.setAttribute('stroke-linecap', 'round');
        highlight.style.filter = 'drop-shadow(0 0 5px #28a745)';
        highlight.style.animation = 'alignmentPulse 1s ease-out';
        
        // Rotation anwenden
        if (currentRotation !== 0) {
            highlight.setAttribute('transform', `rotate(${currentRotation} ${CANVAS_CENTER_X} ${CANVAS_CENTER_Y})`);
        }
        
        highlightGroup.appendChild(highlight);
    });
    
    svg.appendChild(highlightGroup);
    
    // Entferne Highlights nach 2 Sekunden
    setTimeout(() => {
        removeAlignmentHighlights();
    }, 2000);
}

function removeAlignmentHighlights() {
    const existing = document.getElementById('alignment-highlights');
    if (existing) {
        existing.remove();
    }
}

function resetRotation() {
    const oldRotation = currentRotation;
    currentRotation = 0;
    
    console.log(`🔄 Rotation zurückgesetzt von ${oldRotation}° auf 0°`);
    
    // Shape neu zeichnen ohne Rotation
    updateShapeWithScale(calculateOptimalScale(getCurrentFormData()));
    
    // Feedback anzeigen
    showFeedback('Rotation zurückgesetzt auf 0°', '#28a745');
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

// KORRIGIERTE Punkt-Generierung für Editor.js
// Diese Funktion sollte die generateRoofPoints Funktion in editor.js ersetzen

function generateRoofPoints(data) {
    const finalShape = determineActualShape();
    const variant = determineActualVariant();
    
    console.log(`🎨 Generiere Punkte für: ${finalShape}, Variante: ${variant}`);
    console.log('Input-Daten:', data);
    
    let points = [];
    
    try {
        switch (finalShape) {
            case 'kreis':
                points = generateCirclePointsForEditor(data);
                break;
            case 'oval':
                points = generateOvalPointsForEditor(data);
                break;
            case 'halbkreis':
                points = generateHalfCirclePointsForEditor(data);
                break;
            case 'viertelkreis':
                points = generateQuarterCirclePointsForEditor(data);
                break;
            case 'langloch':
                points = generateLanglochPointsForEditor(data);
                break;
            case 'dreieck':
                points = generateTrianglePointsForEditor(data, variant);
                break;
            case 'rechteck':
                points = generateRectanglePointsForEditor(data);
                break;
            case 'quadrat':
                points = generateSquarePointsForEditor(data);
                break;
            case 'trapez':
                points = generateTrapezPointsForEditor(data);
                break;
            case 'parallelogramm':
                points = generateParallelogramPointsForEditor(data);
                break;
            case 'rhombus':
                points = generateRhombusPointsForEditor(data);
                break;
            case 'fuenfeck':
                points = generatePentagonPointsForEditor(data);
                break;
            case 'sechseck':
                points = generateHexagonPointsForEditor(data);
                break;
            case 'achteck':
                points = generateOctagonPointsForEditor(data);
                break;
            case 'lform':
                points = generateLShapePointsForEditor(data);
                break;
            case 'tform':
                points = generateTShapePointsForEditor(data);
                break;
            case 'uform':
                points = generateUShapePointsForEditor(data);
                break;
            default:
                console.log(`⚠️ Unbekannter Shape: ${finalShape}, verwende Rechteck`);
                points = generateRectanglePointsForEditor(data);
                break;
        }
        
        console.log(`✅ ${points.length} Punkte generiert für ${finalShape}`);
        return points;
        
    } catch (error) {
        console.error(`❌ Fehler bei Punkt-Generierung für ${finalShape}:`, error);
        // Fallback auf Rechteck
        return generateRectanglePointsForEditor(data);
    }
}

// EDITOR-SPEZIFISCHE PUNKT-GENERIERUNG FUNKTIONEN

function generateCirclePointsForEditor(data) {
    const radius = data.radius || 3;
    const points = [];
    const segments = 24;
    
    for (let i = 0; i < segments; i++) {
        const angle = (i * 2 * Math.PI) / segments;
        points.push({
            x: radius * Math.cos(angle),
            y: radius * Math.sin(angle)
        });
    }
    
    return points;
}

function generateOvalPointsForEditor(data) {
    const radiusX = data.radiusX || 4;
    const radiusY = data.radiusY || 2.5;
    const points = [];
    const segments = 24;
    
    for (let i = 0; i < segments; i++) {
        const angle = (i * 2 * Math.PI) / segments;
        points.push({
            x: radiusX * Math.cos(angle),
            y: radiusY * Math.sin(angle)
        });
    }
    
    return points;
}

function generateHalfCirclePointsForEditor(data) {
    const radius = data.radius || 4;
    const points = [];
    const segments = 12;
    
    // Halbkreis von 0° bis 180°, dann gerade Linie zurück
    for (let i = 0; i <= segments; i++) {
        const angle = (i * Math.PI) / segments;
        points.push({
            x: radius * Math.cos(angle),
            y: radius * Math.sin(angle)
        });
    }
    
    return points;
}

function generateQuarterCirclePointsForEditor(data) {
    const radius = data.radius || 4;
    const points = [];
    
    // Viertelkreis: Ursprung + Kreisbogen von 0° bis 90°
    points.push({ x: 0, y: 0 }); // Ursprung
    
    const segments = 8;
    for (let i = 0; i <= segments; i++) {
        const angle = (i * Math.PI / 2) / segments;
        points.push({
            x: radius * Math.cos(angle),
            y: radius * Math.sin(angle)
        });
    }
    
    return points;
}

function generateLanglochPointsForEditor(data) {
    const length = data.length || 6;
    const width = data.width || 3;
    const radius = width / 2;
    const straightLength = Math.max(0, length - width);
    
    const points = [];
    const segments = 8;
    
    // Rechtes Halbkreis-Ende (von unten nach oben)
    for (let i = 0; i <= segments; i++) {
        const angle = (-Math.PI/2) + (i * Math.PI) / segments;
        points.push({
            x: straightLength/2 + radius * Math.cos(angle),
            y: radius * Math.sin(angle)
        });
    }
    
    // Linkes Halbkreis-Ende (von oben nach unten)
    for (let i = 0; i <= segments; i++) {
        const angle = (Math.PI/2) + (i * Math.PI) / segments;
        points.push({
            x: -straightLength/2 + radius * Math.cos(angle),
            y: radius * Math.sin(angle)
        });
    }
    
    return points;
}

function generateTrianglePointsForEditor(data, variant) {
    console.log(`🔺 Generiere Dreieck für Editor: ${variant}`);
    
    if (variant === 'gleichseitig' || (!variant && data.side)) {
        const side = data.side || 6;
        const height = side * Math.sqrt(3) / 2;
        return [
            { x: 0, y: height * 2/3 },           // Spitze oben mittig
            { x: -side/2, y: -height/3 },        // Links unten
            { x: side/2, y: -height/3 }          // Rechts unten
        ];
    } else if (variant === 'rechtwinklig') {
        const katheteA = data.katheteA || 4;
        const katheteB = data.katheteB || 5;
        return [
            { x: -katheteA/2, y: -katheteB/3 },  // Links unten (rechter Winkel)
            { x: katheteA/2, y: -katheteB/3 },   // Rechts unten
            { x: -katheteA/2, y: katheteB*2/3 }  // Links oben
        ];
    } else {
        // Ungleichschenkliges Dreieck
        const sideA = data.sideA || 4;
        return [
            { x: 0, y: 3 },                      // Spitze oben (leicht versetzt)
            { x: -sideA/2, y: -2 },              // Links unten
            { x: sideA/2, y: -2 }                // Rechts unten
        ];
    }
}

function generateRectanglePointsForEditor(data) {
    const length = data.length || 8;
    const width = data.width || 5;
    
    return [
        { x: -length/2, y: -width/2 },  // Links oben
        { x: length/2, y: -width/2 },   // Rechts oben
        { x: length/2, y: width/2 },    // Rechts unten
        { x: -length/2, y: width/2 }    // Links unten
    ];
}

function generateSquarePointsForEditor(data) {
    const side = data.side || 5;
    
    return [
        { x: -side/2, y: -side/2 },  // Links oben
        { x: side/2, y: -side/2 },   // Rechts oben
        { x: side/2, y: side/2 },    // Rechts unten
        { x: -side/2, y: side/2 }    // Links unten
    ];
}

function generateTrapezPointsForEditor(data) {
    const sideA = data.sideA || 8;     // Untere Seite (breiter)
    const sideB = data.sideB || 6;     // Obere Seite (schmaler)
    const height = data.height || 4;
    const offset = data.offset || 1;   // Versatz der oberen Seite
    
    console.log(`📐 Trapez-Parameter: unten=${sideA}m, oben=${sideB}m, höhe=${height}m, versatz=${offset}m`);
    
    return [
        { x: -sideA/2, y: -height/2 },                    // Links unten
        { x: sideA/2, y: -height/2 },                     // Rechts unten
        { x: sideB/2 + offset, y: height/2 },             // Rechts oben (mit Versatz)
        { x: -sideB/2 + offset, y: height/2 }             // Links oben (mit Versatz)
    ];
}

function generateParallelogramPointsForEditor(data) {
    const length = data.length || 8;
    const width = data.width || 5;
    const angle = (data.angle || 30) * Math.PI / 180;
    const skew = width * Math.cos(angle);
    
    return [
        { x: -length/2, y: -width/2 },
        { x: length/2, y: -width/2 },
        { x: length/2 + skew, y: width/2 },
        { x: -length/2 + skew, y: width/2 }
    ];
}

function generateRhombusPointsForEditor(data) {
    const side = data.side || 5;
    const angle = (data.angle || 60) * Math.PI / 180;
    
    // Rhombus-Punkte berechnen
    const halfDiag1 = side * Math.sin(angle / 2);
    const halfDiag2 = side * Math.cos(angle / 2);
    
    return [
        { x: 0, y: -halfDiag1 },        // Oben
        { x: halfDiag2, y: 0 },         // Rechts
        { x: 0, y: halfDiag1 },         // Unten
        { x: -halfDiag2, y: 0 }         // Links
    ];
}

function generatePentagonPointsForEditor(data) {
    const radius = data.radius || 4;
    const points = [];
    
    for (let i = 0; i < 5; i++) {
        const angle = (i * 2 * Math.PI / 5) - Math.PI / 2; // Start oben
        points.push({
            x: radius * Math.cos(angle),
            y: radius * Math.sin(angle)
        });
    }
    
    return points;
}

function generateHexagonPointsForEditor(data) {
    const radius = data.radius || 4;
    const points = [];
    
    for (let i = 0; i < 6; i++) {
        const angle = (i * 2 * Math.PI / 6) - Math.PI / 2; // Start oben
        points.push({
            x: radius * Math.cos(angle),
            y: radius * Math.sin(angle)
        });
    }
    
    return points;
}

function generateOctagonPointsForEditor(data) {
    const radius = data.radius || 4;
    const points = [];
    
    for (let i = 0; i < 8; i++) {
        const angle = (i * 2 * Math.PI / 8) - Math.PI / 2; // Start oben
        points.push({
            x: radius * Math.cos(angle),
            y: radius * Math.sin(angle)
        });
    }
    
    return points;
}

function generateLShapePointsForEditor(data) {
    const lengthTotal = data.lengthTotal || 10;
    const widthTotal = data.widthTotal || 8;
    const cutLength = data.cutLength || 4;
    const cutWidth = data.cutWidth || 4;
    
    // L-Form: Großes Rechteck minus kleines Rechteck rechts oben
    return [
        { x: -lengthTotal/2, y: -widthTotal/2 },                      // Links unten
        { x: lengthTotal/2, y: -widthTotal/2 },                       // Rechts unten
        { x: lengthTotal/2, y: -widthTotal/2 + cutWidth },            // Rechts, vor Ausschnitt
        { x: -lengthTotal/2 + cutLength, y: -widthTotal/2 + cutWidth }, // Ausschnitt innen
        { x: -lengthTotal/2 + cutLength, y: widthTotal/2 },           // Ausschnitt oben
        { x: -lengthTotal/2, y: widthTotal/2 }                        // Links oben
    ];
}

function generateTShapePointsForEditor(data) {
    const topWidth = data.topWidth || 8;
    const stemWidth = data.stemWidth || 4;
    const topHeight = data.topHeight || 3;
    const stemHeight = data.stemHeight || 5;
    
    const totalHeight = topHeight + stemHeight;
    
    return [
        { x: -topWidth/2, y: totalHeight/2 },                    // Links oben
        { x: topWidth/2, y: totalHeight/2 },                     // Rechts oben
        { x: topWidth/2, y: totalHeight/2 - topHeight },         // Rechts Top Ende
        { x: stemWidth/2, y: totalHeight/2 - topHeight },        // Rechts Stiel Anfang
        { x: stemWidth/2, y: -totalHeight/2 },                   // Rechts Stiel Ende
        { x: -stemWidth/2, y: -totalHeight/2 },                  // Links Stiel Ende
        { x: -stemWidth/2, y: totalHeight/2 - topHeight },       // Links Stiel Anfang
        { x: -topWidth/2, y: totalHeight/2 - topHeight }         // Links Top Ende
    ];
}

function generateUShapePointsForEditor(data) {
    const outerWidth = data.outerWidth || 10;
    const innerWidth = data.innerWidth || 4;
    const height = data.height || 6;
    const thickness = data.thickness || 3;
    
    return [
        { x: -outerWidth/2, y: -height/2 },                    // Links außen unten
        { x: outerWidth/2, y: -height/2 },                     // Rechts außen unten
        { x: outerWidth/2, y: height/2 },                      // Rechts außen oben
        { x: innerWidth/2, y: height/2 },                      // Rechts innen oben
        { x: innerWidth/2, y: -height/2 + thickness },         // Rechts innen unten
        { x: -innerWidth/2, y: -height/2 + thickness },        // Links innen unten
        { x: -innerWidth/2, y: height/2 },                     // Links innen oben
        { x: -outerWidth/2, y: height/2 }                      // Links außen oben
    ];
}

// ZUSÄTZLICHE HILFSFUNKTIONEN FÜR AREA UND DIMENSIONS

function calculateAreaForEditor(data) {
    const finalShape = determineActualShape();
    const variant = determineActualVariant();
    
    try {
        switch (finalShape) {
            case 'kreis':
                const radius = data.radius || 3;
                return Math.PI * radius * radius;
            case 'oval':
                const radiusX = data.radiusX || 4;
                const radiusY = data.radiusY || 2.5;
                return Math.PI * radiusX * radiusY;
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
            case 'rhombus':
                const rhombusSide = data.side || 5;
                const angle = (data.angle || 60) * Math.PI / 180;
                return rhombusSide * rhombusSide * Math.sin(angle);
            case 'parallelogramm':
                const length = data.length || 8;
                const width = data.width || 5;
                const paraAngle = (data.angle || 30) * Math.PI / 180;
                return length * width * Math.sin(paraAngle);
            case 'fuenfeck':
            case 'sechseck':
            case 'achteck':
                const polygonRadius = data.radius || 4;
                const sides = finalShape === 'fuenfeck' ? 5 : finalShape === 'sechseck' ? 6 : 8;
                return 0.5 * sides * polygonRadius * polygonRadius * Math.sin(2 * Math.PI / sides);
            case 'lform':
                const lengthTotal = data.lengthTotal || 10;
                const widthTotal = data.widthTotal || 8;
                const cutLength = data.cutLength || 4;
                const cutWidth = data.cutWidth || 4;
                return (lengthTotal * widthTotal) - (cutLength * cutWidth);
            case 'tform':
                const topWidth = data.topWidth || 8;
                const stemWidth = data.stemWidth || 4;
                const topHeight = data.topHeight || 3;
                const stemHeight = data.stemHeight || 5;
                return (topWidth * topHeight) + (stemWidth * stemHeight);
            case 'uform':
                const outerWidth = data.outerWidth || 10;
                const innerWidth = data.innerWidth || 4;
                const heightU = data.height || 6;
                const thickness = data.thickness || 3;
                return (outerWidth * heightU) - (innerWidth * (heightU - thickness));
            default:
                return 40;
        }
    } catch (error) {
        console.error('❌ Flächenberechnung Fehler:', error);
        return 40;
    }
}

function calculateDimensionsForEditor(data) {
    const finalShape = determineActualShape();
    
    try {
        switch (finalShape) {
            case 'kreis':
                const circleRadius = data.radius || 3;
                return { length: circleRadius * 2, width: circleRadius * 2 };
            case 'oval':
                return { length: (data.radiusX || 4) * 2, width: (data.radiusY || 2.5) * 2 };
            case 'rechteck':
                return { length: data.length || 8, width: data.width || 5 };
            case 'quadrat':
                const side = data.side || 5;
                return { length: side, width: side };
            case 'trapez':
                return { length: Math.max(data.sideA || 8, data.sideB || 6), width: data.height || 4 };
            case 'fuenfeck':
            case 'sechseck':
            case 'achteck':
                const radius = data.radius || 4;
                return { length: radius * 2, width: radius * 2 };
            case 'lform':
                return { length: data.lengthTotal || 10, width: data.widthTotal || 8 };
            case 'tform':
                return { length: data.topWidth || 8, width: (data.topHeight || 3) + (data.stemHeight || 5) };
            case 'uform':
                return { length: data.outerWidth || 10, width: data.height || 6 };
            default:
                return { length: 8, width: 5 };
        }
    } catch (error) {
        console.error('❌ Dimensions-Berechnung Fehler:', error);
        return { length: 8, width: 5 };
    }
}

console.log('✅ Korrigierte Editor Shape-Generierung geladen - Alle Formen werden präzise dargestellt!');

function calculateArea(data) {
    const finalShape = determineActualShape();
    const variant = determineActualVariant();
    
    try {
        switch (finalShape) {
            case 'kreis':
                const radius = data.radius || 3;
                return Math.PI * radius * radius;
            case 'oval':
                const radiusX = data.radiusX || 4;
                const radiusY = data.radiusY || 2.5;
                return Math.PI * radiusX * radiusY;
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
            case 'rhombus':
                const rhombusSide = data.side || 5;
                const angle = (data.angle || 60) * Math.PI / 180;
                return rhombusSide * rhombusSide * Math.sin(angle);
            case 'parallelogramm':
                const length = data.length || 8;
                const width = data.width || 5;
                const paraAngle = (data.angle || 30) * Math.PI / 180;
                return length * width * Math.sin(paraAngle);
            case 'fuenfeck':
            case 'sechseck':
            case 'achteck':
                const polygonRadius = data.radius || 4;
                const sides = finalShape === 'fuenfeck' ? 5 : finalShape === 'sechseck' ? 6 : 8;
                return 0.5 * sides * polygonRadius * polygonRadius * Math.sin(2 * Math.PI / sides);
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
            case 'oval':
                return { length: (data.radiusX || 4) * 2, width: (data.radiusY || 2.5) * 2 };
            case 'rechteck':
                return { length: data.length || 8, width: data.width || 5 };
            case 'quadrat':
                const side = data.side || 5;
                return { length: side, width: side };
            case 'trapez':
                return { length: Math.max(data.sideA || 8, data.sideB || 6), width: data.height || 4 };
            case 'fuenfeck':
            case 'sechseck':
            case 'achteck':
                const radius = data.radius || 4;
                return { length: radius * 2, width: radius * 2 };
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

console.log('✅ Vollständige korrigierte editor.js erfolgreich geladen - Alle Dachformen + Seitenbemaßung + funktionsfähige Rotation!');

// CSS-Animationen für Ausrichtungs-Effekte dynamisch hinzufügen
function addAlignmentAnimations() {
    const style = document.createElement('style');
    style.textContent = `
        @keyframes alignmentPulse {
            0%, 100% { 
                opacity: 0.8; 
                stroke-width: 6;
                filter: drop-shadow(0 0 5px #28a745);
            }
            50% { 
                opacity: 1; 
                stroke-width: 8;
                filter: drop-shadow(0 0 15px #28a745);
            }
        }

        @keyframes pulse {
            0% { 
                transform: scale(1); 
                box-shadow: 0 0 0 0 rgba(40, 167, 69, 0.7);
            }
            70% { 
                transform: scale(1.05); 
                box-shadow: 0 0 0 10px rgba(40, 167, 69, 0);
            }
            100% { 
                transform: scale(1); 
                box-shadow: 0 0 0 0 rgba(40, 167, 69, 0);
            }
        }

        @keyframes rotationFeedback {
            0% { transform: scale(1) rotate(0deg); }
            50% { transform: scale(1.1) rotate(5deg); }
            100% { transform: scale(1) rotate(0deg); }
        }

        /* Snap-Feedback Animation */
        @keyframes snapPulse {
            0% { 
                transform: scale(1); 
                box-shadow: 0 0 0 0 rgba(255, 107, 53, 0.7);
            }
            50% { 
                transform: scale(1.1); 
                box-shadow: 0 0 0 8px rgba(255, 107, 53, 0);
            }
            100% { 
                transform: scale(1); 
                box-shadow: 0 0 0 0 rgba(255, 107, 53, 0);
            }
        }

        /* Verbesserte Alignment-Highlights */
        .alignment-highlight {
            stroke: #28a745;
            stroke-width: 8;
            opacity: 0.95;
            stroke-linecap: round;
            filter: drop-shadow(0 0 12px rgba(40, 167, 69, 0.8));
            animation: alignmentPulse 2s ease-in-out infinite;
        }

        /* Snap-Display-Effekt */
        .rotation-display.snapped {
            background: #ff6b35 !important;
            animation: snapPulse 0.5s ease-out;
            box-shadow: 0 0 20px rgba(255, 107, 53, 0.6);
        }
    `;
    
    document.head.appendChild(style);
}

// Initialisiere Animationen beim Laden
document.addEventListener('DOMContentLoaded', function() {
    addAlignmentAnimations();
});
                // VOLLSTÄNDIGE korrigierte editor.js - Alle Dachformen + Seitenbemaßung + funktionsfähige Rotation

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
        loadDefaultShape();
    }
}

// KORRIGIERTE Shape-Erkennung
function determineActualShape() {
    console.log('=== DETERMINE ACTUAL SHAPE ===');
    console.log(`Input: currentShape=${currentShape}, currentVariant=${currentVariant}`);
    
    if (shapeCache.lastShape === currentShape && shapeCache.lastVariant === currentVariant) {
        console.log(`✅ Cache-Hit: ${shapeCache.lastResult}`);
        return shapeCache.lastResult;
    }
    
    let result = 'rechteck';
    
    // WICHTIG: Prüfe zuerst die spezifische Variante
    if (currentVariant) {
        switch (currentVariant) {
            // KREIS-Varianten
            case 'kreis': result = 'kreis'; break;
            case 'oval': result = 'oval'; break;
            case 'halbkreis': result = 'halbkreis'; break;
            case 'viertelkreis': result = 'viertelkreis'; break;
            case 'langloch': result = 'langloch'; break;
            
            // DREIECK-Varianten (alle werden als 'dreieck' gezeichnet)
            case 'gleichseitig': 
            case 'rechtwinklig': 
            case 'ungleichschenklig': 
                result = 'dreieck'; break;
            
            // VIERECK-Varianten
            case 'rechteck': result = 'rechteck'; break;
            case 'quadrat': result = 'quadrat'; break;
            case 'parallelogramm': result = 'parallelogramm'; break;
            case 'trapez': result = 'trapez'; break;
            case 'rhombus': result = 'rhombus'; break;
            
            // VIELECK-Varianten
            case 'fuenfeck': result = 'fuenfeck'; break;
            case 'sechseck': result = 'sechseck'; break;
            case 'achteck': result = 'achteck'; break;
            case 'lform': result = 'lform'; break;
            case 'tform': result = 'tform'; break;
            case 'uform': result = 'uform'; break;
            
            default:
                // Falls variant nicht erkannt wird, nutze baseShape
                if (currentShape) {
                    switch (currentShape) {
                        case 'kreis': result = 'kreis'; break;
                        case 'dreieck': result = 'dreieck'; break;
                        case 'vieleck': result = 'fuenfeck'; break;  // Standard für Vieleck
                        case 'viereck': result = 'rechteck'; break;  // Standard für Viereck
                        default: result = 'rechteck'; break;
                    }
                }
                break;
        }
    } else if (currentShape) {
        // Fallback auf baseShape wenn keine variant vorhanden
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

// KORRIGIERTE updateShapeWithScale mit besserer Rotations-Anwendung
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
        // Entferne alte Transform-Attribute
        shapeGroup.removeAttribute('transform');
        
        try {
            drawCurrentShape(shapeGroup, data, scale);
            
            // Rotation NACH dem Zeichnen anwenden
            if (currentRotation !== 0) {
                const roundedRotation = Math.round(currentRotation * 10) / 10;
                shapeGroup.setAttribute('transform', `rotate(${roundedRotation} ${CANVAS_CENTER_X} ${CANVAS_CENTER_Y})`);
                console.log(`🔄 Transform angewendet: rotate(${roundedRotation} ${CANVAS_CENTER_X} ${CANVAS_CENTER_Y})`);
            }
        } catch (error) {
            console.error('❌ Shape zeichnen Fehler:', error);
        }
    }
    
    if (labelsGroup) {
        try {
            drawLabelsOnShape(labelsGroup, data, scale);
            
            // Labels auch rotieren (aber in entgegengesetzte Richtung, damit sie lesbar bleiben)
            if (currentRotation !== 0) {
                const roundedRotation = Math.round(currentRotation * 10) / 10;
                labelsGroup.setAttribute('transform', `rotate(${roundedRotation} ${CANVAS_CENTER_X} ${CANVAS_CENTER_Y})`);
            }
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

// VOLLSTÄNDIGE Zeichenfunktionen für alle Dachformen
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
            case 'halbkreis':
                drawHalfCircleShape(group, data, scale);
                break;
            case 'viertelkreis':
                drawQuarterCircleShape(group, data, scale);
                break;
            case 'langloch':
                drawLanglochShape(group, data, scale);
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
            case 'rhombus':
                drawRhombusShape(group, data, scale);
                break;
            case 'fuenfeck':
                drawPentagonShape(group, data, scale);
                break;
            case 'sechseck':
                drawHexagonShape(group, data, scale);
                break;
            case 'achteck':
                drawOctagonShape(group, data, scale);
                break;
            case 'lform':
                drawLShape(group, data, scale);
                break;
            case 'tform':
                drawTShape(group, data, scale);
                break;
            case 'uform':
                drawUShape(group, data, scale);
                break;
            default:
                console.log(`⚠️ Unbekannte Form: ${finalShape}, verwende Rechteck`);
                drawRectangleShape(group, data, scale);
        }
        
        console.log(`✅ Shape ${finalShape} erfolgreich gezeichnet`);
        
    } catch (error) {
        console.error(`❌ Fehler beim Zeichnen von ${finalShape}:`, error);
        drawRectangleShape(group, data, scale);
    }
}

// KREIS FORMEN
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

function drawHalfCircleShape(group, data, scale) {
    const radius = (data.radius || 4) * scale;
    const centerX = CANVAS_CENTER_X;
    const centerY = CANVAS_CENTER_Y;
    
    // Halbkreis mit SVG Path
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    const pathData = `M ${centerX - radius} ${centerY} 
                      A ${radius} ${radius} 0 0 1 ${centerX + radius} ${centerY} 
                      Z`;
    path.setAttribute('d', pathData);
    path.setAttribute('fill', 'rgba(0, 123, 255, 0.3)');
    path.setAttribute('stroke', '#007bff');
    path.setAttribute('stroke-width', '3');
    group.appendChild(path);
}

function drawQuarterCircleShape(group, data, scale) {
    const radius = (data.radius || 4) * scale;
    const centerX = CANVAS_CENTER_X;
    const centerY = CANVAS_CENTER_Y;
    
    // Viertelkreis mit SVG Path
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    const pathData = `M ${centerX} ${centerY} 
                      L ${centerX + radius} ${centerY} 
                      A ${radius} ${radius} 0 0 1 ${centerX} ${centerY + radius} 
                      Z`;
    path.setAttribute('d', pathData);
    path.setAttribute('fill', 'rgba(0, 123, 255, 0.3)');
    path.setAttribute('stroke', '#007bff');
    path.setAttribute('stroke-width', '3');
    group.appendChild(path);
}

function drawLanglochShape(group, data, scale) {
    const length = (data.length || 6) * scale;
    const width = (data.width || 3) * scale;
    const radius = width / 2;
    const centerX = CANVAS_CENTER_X;
    const centerY = CANVAS_CENTER_Y;
    
    // Langloch = Rechteck mit abgerundeten Enden
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    const halfLength = length / 2 - radius;
    
    const pathData = `M ${centerX - halfLength} ${centerY - radius}
                      L ${centerX + halfLength} ${centerY - radius}
                      A ${radius} ${radius} 0 0 1 ${centerX + halfLength} ${centerY + radius}
                      L ${centerX - halfLength} ${centerY + radius}
                      A ${radius} ${radius} 0 0 1 ${centerX - halfLength} ${centerY - radius}
                      Z`;
    
    path.setAttribute('d', pathData);
    path.setAttribute('fill', 'rgba(0, 123, 255, 0.3)');
    path.setAttribute('stroke', '#007bff');
    path.setAttribute('stroke-width', '3');
    group.appendChild(path);
}

// VIERECK FORMEN
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

function drawTrapezShape(group, data, scale) {
    const sideA = (data.sideA || 8) * scale;  // Untere Seite
    const sideB = (data.sideB || 6) * scale;  // Obere Seite  
    const height = (data.height || 4) * scale;
    const offset = (data.offset || 1) * scale;
    
    const centerX = CANVAS_CENTER_X;
    const centerY = CANVAS_CENTER_Y;
    
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
    
    const pointsStr = points.map(p => `${p.x},${p.y}`).join(' ');
    
    const polygon = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
    polygon.setAttribute('points', pointsStr);
    polygon.setAttribute('fill', 'rgba(0, 123, 255, 0.3)');
    polygon.setAttribute('stroke', '#007bff');
    polygon.setAttribute('stroke-width', '3');
    group.appendChild(polygon);
}

function drawRhombusShape(group, data, scale) {
    const side = (data.side || 5) * scale;
    const angle = (data.angle || 60) * Math.PI / 180;
    
    // Rhombus-Punkte berechnen
    const halfDiag1 = side * Math.sin(angle / 2);
    const halfDiag2 = side * Math.cos(angle / 2);
    
    const points = [
        { x: CANVAS_CENTER_X, y: CANVAS_CENTER_Y - halfDiag1 },      // Oben
        { x: CANVAS_CENTER_X + halfDiag2, y: CANVAS_CENTER_Y },      // Rechts
        { x: CANVAS_CENTER_X, y: CANVAS_CENTER_Y + halfDiag1 },      // Unten
        { x: CANVAS_CENTER_X - halfDiag2, y: CANVAS_CENTER_Y }       // Links
    ];
    
    const pointsStr = points.map(p => `${p.x},${p.y}`).join(' ');
    
    const polygon = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
    polygon.setAttribute('points', pointsStr);
    polygon.setAttribute('fill', 'rgba(0, 123, 255, 0.3)');
    polygon.setAttribute('stroke', '#007bff');
    polygon.setAttribute('stroke-width', '3');
    group.appendChild(polygon);
}

// DREIECK FORMEN
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
        points = `${topX},${topY} ${leftX},${leftY} ${rightX},${rightY}`;
    } else if (variant === 'rechtwinklig') {
        const katheteA = (data.katheteA || 4) * scale;
        const katheteB = (data.katheteB || 5) * scale;
        
        const leftX = CANVAS_CENTER_X - katheteA/2;
        const rightX = CANVAS_CENTER_X + katheteA/2;
        const bottomY = CANVAS_CENTER_Y + katheteB/3;
        const topY = CANVAS_CENTER_Y - katheteB*2/3;
        
        points = `${leftX},${bottomY} ${rightX},${bottomY} ${leftX},${topY}`;
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
        
        points = `${topX},${topY} ${leftX},${leftY} ${rightX},${rightY}`;
    }
    
    const triangle = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
    triangle.setAttribute('points', points);
    triangle.setAttribute('fill', 'rgba(0, 123, 255, 0.3)');
    triangle.setAttribute('stroke', '#007bff');
    triangle.setAttribute('stroke-width', '3');
    group.appendChild(triangle);
}

// VIELECK FORMEN
function drawPentagonShape(group, data, scale) {
    const radius = (data.radius || 4) * scale;
    const points = [];
    
    for (let i = 0; i < 5; i++) {
        const angle = (i * 2 * Math.PI / 5) - Math.PI / 2; // Start oben
        const x = CANVAS_CENTER_X + radius * Math.cos(angle);
        const y = CANVAS_CENTER_Y + radius * Math.sin(angle);
        points.push(`${x},${y}`);
    }
    
    const polygon = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
    polygon.setAttribute('points', points.join(' '));
    polygon.setAttribute('fill', 'rgba(0, 123, 255, 0.3)');
    polygon.setAttribute('stroke', '#007bff');
    polygon.setAttribute('stroke-width', '3');
    group.appendChild(polygon);
}

function drawHexagonShape(group, data, scale) {
    const radius = (data.radius || 4) * scale;
    const points = [];
    
    for (let i = 0; i < 6; i++) {
        const angle = (i * 2 * Math.PI / 6) - Math.PI / 2; // Start oben
        const x = CANVAS_CENTER_X + radius * Math.cos(angle);
        const y = CANVAS_CENTER_Y + radius * Math.sin(angle);
        points.push(`${x},${y}`);
    }
    
    const polygon = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
    polygon.setAttribute('points', points.join(' '));
    polygon.setAttribute('fill', 'rgba(0, 123, 255, 0.3)');
    polygon.setAttribute('stroke', '#007bff');
    polygon.setAttribute('stroke-width', '3');
    group.appendChild(polygon);
}

function drawOctagonShape(group, data, scale) {
    const radius = (data.radius || 4) * scale;
    const points = [];
    
    for (let i = 0; i < 8; i++) {
        const angle = (i * 2 * Math.PI / 8) - Math.PI / 2; // Start oben
        const x = CANVAS_CENTER_X + radius * Math.cos(angle);
        const y = CANVAS_CENTER_Y + radius * Math.sin(angle);
        points.push(`${x},${y}`);
    }
    
    const polygon = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
    polygon.setAttribute('points', points.join(' '));
    polygon.setAttribute('fill', 'rgba(0, 123, 255, 0.3)');
    polygon.setAttribute('stroke', '#007bff');
    polygon.setAttribute('stroke-width', '3');
    group.appendChild(polygon);
}

// KOMPLEXE FORMEN
function drawLShape(group, data, scale) {
    const lengthTotal = (data.lengthTotal || 10) * scale;
    const widthTotal = (data.widthTotal || 8) * scale;
    const cutLength = (data.cutLength || 4) * scale;
    const cutWidth = (data.cutWidth || 4) * scale;
    
    const centerX = CANVAS_CENTER_X;
    const centerY = CANVAS_CENTER_Y;
    
    // L-Form: Großes Rechteck minus kleines Rechteck oben rechts
    const points = [
        { x: centerX - lengthTotal/2, y: centerY - widthTotal/2 },           // Links oben
        { x: centerX + lengthTotal/2, y: centerY - widthTotal/2 },           // Rechts oben
        { x: centerX + lengthTotal/2, y: centerY - widthTotal/2 + cutWidth }, // Rechts, Ausschnitt oben
        { x: centerX - lengthTotal/2 + cutLength, y: centerY - widthTotal/2 + cutWidth }, // Ausschnitt links
        { x: centerX - lengthTotal/2 + cutLength, y: centerY + widthTotal/2 }, // Ausschnitt unten
        { x: centerX - lengthTotal/2, y: centerY + widthTotal/2 }            // Links unten
    ];
    
    const pointsStr = points.map(p => `${p.x},${p.y}`).join(' ');
    
    const polygon = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
    polygon.setAttribute('points', pointsStr);
    polygon.setAttribute('fill', 'rgba(0, 123, 255, 0.3)');
    polygon.setAttribute('stroke', '#007bff');
    polygon.setAttribute('stroke-width', '3');
    group.appendChild(polygon);
}

function drawTShape(group, data, scale) {
    const topWidth = (data.topWidth || 8) * scale;
    const stemWidth = (data.stemWidth || 4) * scale;
    const topHeight = (data.topHeight || 3) * scale;
    const stemHeight = (data.stemHeight || 5) * scale;
    
    const centerX = CANVAS_CENTER_X;
    const centerY = CANVAS_CENTER_Y;
    
    const points = [
        { x: centerX - topWidth/2, y: centerY - (topHeight + stemHeight)/2 },           // Links oben
        { x: centerX + topWidth/2, y: centerY - (topHeight + stemHeight)/2 },           // Rechts oben
        { x: centerX + topWidth/2, y: centerY - (topHeight + stemHeight)/2 + topHeight }, // Rechts, Ende Top
        { x: centerX + stemWidth/2, y: centerY - (topHeight + stemHeight)/2 + topHeight }, // Rechts Stiel oben
        { x: centerX + stemWidth/2, y: centerY + (topHeight + stemHeight)/2 },          // Rechts Stiel unten
        { x: centerX - stemWidth/2, y: centerY + (topHeight + stemHeight)/2 },          // Links Stiel unten
        { x: centerX - stemWidth/2, y: centerY - (topHeight + stemHeight)/2 + topHeight }, // Links Stiel oben
        { x: centerX - topWidth/2, y: centerY - (topHeight + stemHeight)/2 + topHeight }   // Links, Ende Top
    ];
    
    const pointsStr = points.map(p => `${p.x},${p.y}`).join(' ');
    
    const polygon = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
    polygon.setAttribute('points', pointsStr);
    polygon.setAttribute('fill', 'rgba(0, 123, 255, 0.3)');
    polygon.setAttribute('stroke', '#007bff');
    polygon.setAttribute('stroke-width', '3');
    group.appendChild(polygon);
}

function drawUShape(group, data, scale) {
    const outerWidth = (data.outerWidth || 10) * scale;
    const innerWidth = (data.innerWidth || 4) * scale;
    const height = (data.height || 6) * scale;
    const thickness = (data.thickness || 3) * scale;
    
    const centerX = CANVAS_CENTER_X;
    const centerY = CANVAS_CENTER_Y;
    
    const points = [
        { x: centerX - outerWidth/2, y: centerY - height/2 },                    // Links außen oben
        { x: centerX + outerWidth/2, y: centerY - height/2 },                    // Rechts außen oben
        { x: centerX + outerWidth/2, y: centerY + height/2 },                    // Rechts außen unten
        { x: centerX + innerWidth/2, y: centerY + height/2 },                    // Rechts innen unten
        { x: centerX + innerWidth/2, y: centerY - height/2 + thickness },        // Rechts innen oben
        { x: centerX - innerWidth/2, y: centerY - height/2 + thickness },        // Links innen oben
        { x: centerX - innerWidth/2, y: centerY + height/2 },                    // Links innen unten
        { x: centerX - outerWidth/2, y: centerY + height/2 }                     // Links außen unten
    ];
    
    const pointsStr = points.map(p => `${p.x},${p.y}`).join(' ');
    
    const polygon = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
    polygon.setAttribute('points', pointsStr);
    polygon.setAttribute('fill', 'rgba(0, 123, 255, 0.3)');
    polygon.setAttribute('stroke', '#007bff');
    polygon.setAttribute('stroke-width', '3');
    group.appendChild(polygon);
}

// KORRIGIERTE Labels und Seitenbemaßung - zeigt Seitenbemaßungen statt Eckbeschriftungen
function drawLabelsOnShape(group, data, scale) {
    const finalShape = determineActualShape();
    
    // Seitenbemaßungen statt Eckbeschriftungen
    switch (finalShape) {
        case 'rechteck':
            drawRectangleDimensions(group, data, scale);
            break;
        case 'quadrat':
            drawSquareDimensions(group, data, scale);
            break;
        case 'trapez':
            drawTrapezDimensions(group, data, scale);
            break;
        case 'dreieck':
            drawTriangleDimensions(group, data, scale);
            break;
        case 'parallelogramm':
            drawParallelogramDimensions(group, data, scale);
            break;
        case 'rhombus':
            drawRhombusDimensions(group, data, scale);
            break;
        case 'kreis':
            drawCircleDimensions(group, data, scale);
            break;
        case 'oval':
            drawOvalDimensions(group, data, scale);
            break;
        case 'langloch':
            drawLanglochDimensions(group, data, scale);
            break;
        case 'fuenfeck':
        case 'sechseck':
        case 'achteck':
            drawPolygonDimensions(group, data, scale);
            break;
        default:
            drawRectangleDimensions(group, data, scale);
            break;
    }
}

function drawRectangleDimensions(group, data, scale) {
    const length = (data.length || 8) * scale;
    const width = (data.width || 5) * scale;
    
    // Länge oben
    const lengthLabel = createDimensionLabel(
        CANVAS_CENTER_X, 
        CANVAS_CENTER_Y - width/2 - 15, 
        `${data.length || 8} m`, 
        '#007bff'
    );
    group.appendChild(lengthLabel);
    
    // Breite rechts
    const widthLabel = createDimensionLabel(
        CANVAS_CENTER_X + length/2 + 25, 
        CANVAS_CENTER_Y, 
        `${data.width || 5} m`, 
        '#28a745'
    );
    group.appendChild(widthLabel);
    
    // Bemaßungslinien
    drawDimensionLine(group, 
        CANVAS_CENTER_X - length/2, CANVAS_CENTER_Y - width/2 - 10,
        CANVAS_CENTER_X + length/2, CANVAS_CENTER_Y - width/2 - 10,
        '#007bff'
    );
    
    drawDimensionLine(group,
        CANVAS_CENTER_X + length/2 + 15, CANVAS_CENTER_Y - width/2,
        CANVAS_CENTER_X + length/2 + 15, CANVAS_CENTER_Y + width/2,
        '#28a745'
    );
}

function drawSquareDimensions(group, data, scale) {
    const side = (data.side || 5) * scale;
    
    // Seitenlänge oben
    const sideLabel = createDimensionLabel(
        CANVAS_CENTER_X, 
        CANVAS_CENTER_Y - side/2 - 15, 
        `${data.side || 5} m`, 
        '#007bff'
    );
    group.appendChild(sideLabel);
    
    // Bemaßungslinie
    drawDimensionLine(group, 
        CANVAS_CENTER_X - side/2, CANVAS_CENTER_Y - side/2 - 10,
        CANVAS_CENTER_X + side/2, CANVAS_CENTER_Y - side/2 - 10,
        '#007bff'
    );
}

function drawTrapezDimensions(group, data, scale) {
    const sideA = (data.sideA || 8) * scale;
    const sideB = (data.sideB || 6) * scale;
    const height = (data.height || 4) * scale;
    const offset = (data.offset || 1) * scale;
    
    // Untere Seite A
    const sideALabel = createDimensionLabel(
        CANVAS_CENTER_X, 
        CANVAS_CENTER_Y + height/2 + 20, 
        `A: ${data.sideA || 8} m`, 
        '#007bff'
    );
    group.appendChild(sideALabel);
    
    // Obere Seite B
    const sideBLabel = createDimensionLabel(
        CANVAS_CENTER_X + offset, 
        CANVAS_CENTER_Y - height/2 - 15, 
        `B: ${data.sideB || 6} m`, 
        '#28a745'
    );
    group.appendChild(sideBLabel);
    
    // Höhe
    const heightLabel = createDimensionLabel(
        CANVAS_CENTER_X - sideA/2 - 25, 
        CANVAS_CENTER_Y, 
        `H: ${data.height || 4} m`, 
        '#dc3545'
    );
    group.appendChild(heightLabel);
    
    // Versatz (falls vorhanden)
    if (Math.abs(data.offset || 1) > 0.1) {
        const offsetLabel = createDimensionLabel(
            CANVAS_CENTER_X + sideA/4, 
            CANVAS_CENTER_Y - height/4, 
            `Versatz: ${data.offset || 1} m`, 
            '#ffc107'
        );
        group.appendChild(offsetLabel);
    }
}

function drawTriangleDimensions(group, data, scale) {
    const variant = determineActualVariant();
    
    if (variant === 'gleichseitig') {
        const side = (data.side || 6) * scale;
        const sideLabel = createDimensionLabel(
            CANVAS_CENTER_X, 
            CANVAS_CENTER_Y + side/3 + 20, 
            `${data.side || 6} m`, 
            '#007bff'
        );
        group.appendChild(sideLabel);
    } else if (variant === 'rechtwinklig') {
        const katheteA = (data.katheteA || 4) * scale;
        const katheteB = (data.katheteB || 5) * scale;
        
        const katheteALabel = createDimensionLabel(
            CANVAS_CENTER_X, 
            CANVAS_CENTER_Y + katheteB/3 + 20, 
            `a: ${data.katheteA || 4} m`, 
            '#007bff'
        );
        group.appendChild(katheteALabel);
        
        const katheteBLabel = createDimensionLabel(
            CANVAS_CENTER_X - katheteA/2 - 25, 
            CANVAS_CENTER_Y, 
            `b: ${data.katheteB || 5} m`, 
            '#28a745'
        );
        group.appendChild(katheteBLabel);
    } else {
        // Ungleichschenkliges Dreieck
        const sideALabel = createDimensionLabel(
            CANVAS_CENTER_X, 
            CANVAS_CENTER_Y + 30, 
            `a: ${data.sideA || 4} m`, 
            '#007bff'
        );
        group.appendChild(sideALabel);
        
        const sideBLabel = createDimensionLabel(
            CANVAS_CENTER_X - 30, 
            CANVAS_CENTER_Y - 10, 
            `b: ${data.sideB || 5} m`, 
            '#28a745'
        );
        group.appendChild(sideBLabel);
        
        const sideCLabel = createDimensionLabel(
            CANVAS_CENTER_X + 30, 
            CANVAS_CENTER_Y - 10, 
            `c: ${data.sideC || 6} m`, 
            '#dc3545'
        );
        group.appendChild(sideCLabel);
    }
}

function drawParallelogramDimensions(group, data, scale) {
    const length = (data.length || 8) * scale;
    const width = (data.width || 5) * scale;
    const angle = data.angle || 30;
    
    const lengthLabel = createDimensionLabel(
        CANVAS_CENTER_X, 
        CANVAS_CENTER_Y - width/2 - 15, 
        `${data.length || 8} m`, 
        '#007bff'
    );
    group.appendChild(lengthLabel);
    
    const widthLabel = createDimensionLabel(
        CANVAS_CENTER_X + length/2 + 25, 
        CANVAS_CENTER_Y, 
        `${data.width || 5} m`, 
        '#28a745'
    );
    group.appendChild(widthLabel);
    
    const angleLabel = createDimensionLabel(
        CANVAS_CENTER_X - length/4, 
        CANVAS_CENTER_Y + width/4, 
        `∠${angle}°`, 
        '#ffc107'
    );
    group.appendChild(angleLabel);
}

function drawRhombusDimensions(group, data, scale) {
    const side = data.side || 5;
    const angle = data.angle || 60;
    
    const sideLabel = createDimensionLabel(
        CANVAS_CENTER_X + 40, 
        CANVAS_CENTER_Y - 20, 
        `${side} m`, 
        '#007bff'
    );
    group.appendChild(sideLabel);
    
    const angleLabel = createDimensionLabel(
        CANVAS_CENTER_X - 30, 
        CANVAS_CENTER_Y + 20, 
        `∠${angle}°`, 
        '#28a745'
    );
    group.appendChild(angleLabel);
}

function drawCircleDimensions(group, data, scale) {
    const radius = data.radius || 3;
    
    const radiusLabel = createDimensionLabel(
        CANVAS_CENTER_X + 30, 
        CANVAS_CENTER_Y - 30, 
        `r = ${radius} m`, 
        '#007bff'
    );
    group.appendChild(radiusLabel);
    
    // Radius-Linie
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('x1', CANVAS_CENTER_X);
    line.setAttribute('y1', CANVAS_CENTER_Y);
    line.setAttribute('x2', CANVAS_CENTER_X + radius * scale);
    line.setAttribute('y2', CANVAS_CENTER_Y);
    line.setAttribute('stroke', '#007bff');
    line.setAttribute('stroke-width', '2');
    line.setAttribute('stroke-dasharray', '5,5');
    group.appendChild(line);
}

function drawOvalDimensions(group, data, scale) {
    const radiusX = data.radiusX || 4;
    const radiusY = data.radiusY || 2.5;
    
    const radiusXLabel = createDimensionLabel(
        CANVAS_CENTER_X, 
        CANVAS_CENTER_Y - radiusY * scale - 15, 
        `rx = ${radiusX} m`, 
        '#007bff'
    );
    group.appendChild(radiusXLabel);
    
    const radiusYLabel = createDimensionLabel(
        CANVAS_CENTER_X + radiusX * scale + 15, 
        CANVAS_CENTER_Y, 
        `ry = ${radiusY} m`, 
        '#28a745'
    );
    group.appendChild(radiusYLabel);
}

function drawLanglochDimensions(group, data, scale) {
    const length = data.length || 6;
    const width = data.width || 3;
    
    const lengthLabel = createDimensionLabel(
        CANVAS_CENTER_X, 
        CANVAS_CENTER_Y - width * scale / 2 - 15, 
        `${length} m`, 
        '#007bff'
    );
    group.appendChild(lengthLabel);
    
    const widthLabel = createDimensionLabel(
        CANVAS_CENTER_X + length * scale / 2 + 15, 
        CANVAS_CENTER_Y, 
        `${width} m`, 
        '#28a745'
    );
    group.appendChild(widthLabel);
}

function drawPolygonDimensions(group, data, scale) {
    const radius = data.radius || 4;
    
    const radiusLabel = createDimensionLabel(
        CANVAS_CENTER_X + radius * scale + 15, 
        CANVAS_CENTER_Y - 10, 
        `r = ${radius} m`, 
        '#007bff'
    );
    group.appendChild(radiusLabel);
    
    // Radius-Linie zum obersten Punkt
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('x1', CANVAS_CENTER_X);
    line.setAttribute('y1', CANVAS_CENTER_Y);
    line.setAttribute('x2', CANVAS_CENTER_X);
    line.setAttribute('y2', CANVAS_CENTER_Y - radius * scale);
    line.setAttribute('stroke', '#007bff');
    line.setAttribute('stroke-width', '2');
    line.setAttribute('stroke-dasharray', '5,5');
    group.appendChild(line);
}

function createDimensionLabel(x, y, text, color) {
    const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    label.setAttribute('x', x);
    label.setAttribute('y', y);
    label.setAttribute('text-anchor', 'middle');
    label.setAttribute('fill', color);
    label.setAttribute('font-size', '12');
    label.setAttribute('font-weight', 'bold');
    label.setAttribute('stroke', 'white');
    label.setAttribute('stroke-width', '3');
    label.setAttribute('paint-order', 'stroke');
    label.textContent = text;
    return label;
}

function drawDimensionLine(group, x1, y1, x2, y2, color) {
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('x1', x1);
    line.setAttribute('y1', y1);
    line.setAttribute('x2', x2);
    line.setAttribute('y2', y2);
    line.setAttribute('stroke', color);
    line.setAttribute('stroke-width', '1');
    line.setAttribute('stroke-dasharray', '3,3');
    group.appendChild(line);
    
    // Pfeilspitzen
    const arrow1 = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
    arrow1.setAttribute('points', `${x1-3},${y1-3} ${x1+3},${y1} ${x1-3},${y1+3}`);
    arrow1.setAttribute('fill', color);
    group.appendChild(arrow1);
    
    const arrow2 = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
    arrow2.setAttribute('points', `${x2+3},${y2-3} ${x2-3},${y2} ${x2+3},${y2+3}`);
    arrow2.setAttribute('fill', color);
    group.appendChild(arrow2);
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
            case 'oval':
                const radiusX = data.radiusX || 4;
                const radiusY = data.radiusY || 2.5;
                area = Math.PI * radiusX * radiusY;
                perimeter = Math.PI * (3 * (radiusX + radiusY) - Math.sqrt((3 * radiusX + radiusY) * (radiusX + 3 * radiusY)));
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
            case 'rhombus':
                const rhombusSide = data.side || 5;
                const angle = (data.angle || 60) * Math.PI / 180;
                area = rhombusSide * rhombusSide * Math.sin(angle);
                perimeter = 4 * rhombusSide;
                break;
            case 'parallelogramm':
                const paraLength = data.length || 8;
                const paraWidth = data.width || 5;
                const paraAngle = (data.angle || 30) * Math.PI / 180;
                area = paraLength * paraWidth * Math.sin(paraAngle);
                perimeter = 2 * (paraLength + paraWidth);
                break;
            case 'fuenfeck':
            case 'sechseck':
            case 'achteck':
                const polygonRadius = data.radius || 4;
                const sides = finalShape === 'fuenfeck' ? 5 : finalShape === 'sechseck' ? 6 : 8;
                area = 0.5 * sides * polygonRadius * polygonRadius * Math.sin(2 * Math.PI / sides);
                perimeter = sides * 2 * polygonRadius * Math.sin(Math.PI / sides);
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
