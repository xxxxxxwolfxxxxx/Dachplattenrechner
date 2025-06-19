// Editor.js - VOLLSTÄNDIG KORRIGIERT

let projectData = {};
let currentShape = '';
let currentVariant = '';
let svg;
let isUpdating = false;

// Transformation state
let currentRotation = 0;
let isMirroredH = false;
let isMirroredV = false;

// Interaktion state
let isDragging = false;
let dragStartAngle = 0;
let dragStartRotation = 0;
let rotationCenter = { x: 0, y: 0 };

const CANVAS_CENTER_X = 300;
const CANVAS_CENTER_Y = 200;
const CORNER_RADIUS = 8;

// Konstanten für bessere Skalierung
const MIN_SCALE = 20;
const MAX_SCALE = 120;
const CANVAS_PADDING = 60;

// Shape-Cache
let shapeCache = {
    lastShape: '',
    lastVariant: '',
    lastResult: ''
};

// Auto-Repeat Variablen
let rotationInterval = null;
let rotationTimeout = null;
let rotationSpeed = 1;
let isMouseDown = false;

// Initialisierung
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        try {
            loadProjectData();
            initializeCanvas();
            initializeUI();
            loadAndDrawShape();
            setupEventListeners();
        } catch (error) {
            console.error('Editor-Fehler:', error);
        }
    }, 100);
});

function loadProjectData() {
    const dataString = localStorage.getItem('dachplattenrechner_data') || 
                       sessionStorage.getItem('dachplattenrechner_data');
    
    if (!dataString) {
        projectData = {
            profile: { profilname: 'Standard Profil', deckbreite: 1000, lieferbreite: 1050, seitenueberlappung: 50 },
            roofShape: { baseShape: 'viereck', variant: 'rechteck' }
        };
        return;
    }

    try {
        projectData = JSON.parse(dataString);
        if (!projectData.profile) {
            projectData.profile = { profilname: 'Standard Profil', deckbreite: 1000, lieferbreite: 1050, seitenueberlappung: 50 };
        }
        if (!projectData.roofShape) {
            projectData.roofShape = { baseShape: 'viereck', variant: 'rechteck' };
        }
    } catch (e) {
        projectData = {
            profile: { profilname: 'Standard Profil', deckbreite: 1000, lieferbreite: 1050, seitenueberlappung: 50 },
            roofShape: { baseShape: 'viereck', variant: 'rechteck' }
        };
    }
}

function initializeCanvas() {
    svg = document.getElementById('main-svg');
    
    if (!svg) {
        createFallbackCanvas();
    }
    
    rotationCenter = { x: CANVAS_CENTER_X, y: CANVAS_CENTER_Y };
}

function createFallbackCanvas() {
    const container = document.querySelector('.canvas-container') || document.querySelector('main');
    if (!container) return;
    
    const wrapper = document.createElement('div');
    wrapper.className = 'canvas-wrapper';
    wrapper.style.cssText = `
        border: 2px solid #e9ecef; border-radius: 8px; background: white;
        width: 600px; height: 400px; margin: 20px auto; position: relative; user-select: none;
    `;
    
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
}

function initializeUI() {
    displayProfileInfo();
    updateShapeTitle();
    createRotationDisplay();
    createRotationControls();
}

function createRotationControls() {
    const existingLeftBtn = document.getElementById('btn-rotate-left');
    const existingRightBtn = document.getElementById('btn-rotate-right');
    const existingResetBtn = document.getElementById('btn-reset-rotation');
    
    if (existingLeftBtn && existingRightBtn && existingResetBtn) {
        // Links-Button mit Auto-Repeat (NEGATIV = gegen Uhrzeigersinn)
        existingLeftBtn.addEventListener('mousedown', (e) => {
            e.preventDefault();
            startRotationRepeat(-1); // NEGATIV für links
        });
        existingLeftBtn.addEventListener('mouseup', stopRotationRepeat);
        existingLeftBtn.addEventListener('mouseleave', stopRotationRepeat);
        
        // Rechts-Button mit Auto-Repeat (POSITIV = im Uhrzeigersinn)
        existingRightBtn.addEventListener('mousedown', (e) => {
            e.preventDefault();
            startRotationRepeat(1); // POSITIV für rechts
        });
        existingRightBtn.addEventListener('mouseup', stopRotationRepeat);
        existingRightBtn.addEventListener('mouseleave', stopRotationRepeat);
        
        // Reset-Button
        existingResetBtn.addEventListener('click', () => {
            currentRotation = 0;
            updateShapeWithScale(calculateOptimalScale(getCurrentFormData()));
            updateRotationDisplay();
            showFeedback('Rotation zurückgesetzt');
        });
    }
}

function startRotationRepeat(direction) {
    if (isMouseDown) return;
    
    isMouseDown = true;
    rotationSpeed = 1;
    
    // Erste Drehung: Nur 1°
    rotateByDegrees(direction * 1);
    
    // Warten auf gedrückt halten (800ms)
    rotationTimeout = setTimeout(() => {
        if (!isMouseDown) return;
        
        // Phase 1: Langsam (1° alle 200ms)
        rotationSpeed = 1;
        rotationInterval = setInterval(() => {
            if (!isMouseDown) return;
            rotateByDegrees(direction * rotationSpeed);
        }, 200);
        
        // Phase 2: Nach 2 Sekunden etwas schneller (1° alle 100ms)
        setTimeout(() => {
            if (!isMouseDown) return;
            clearInterval(rotationInterval);
            
            rotationSpeed = 1;
            rotationInterval = setInterval(() => {
                if (!isMouseDown) return;
                rotateByDegrees(direction * rotationSpeed);
            }, 100);
            
            // Phase 3: Nach weiteren 3 Sekunden schneller (2° alle 80ms)
            setTimeout(() => {
                if (!isMouseDown) return;
                clearInterval(rotationInterval);
                
                rotationSpeed = 2;
                rotationInterval = setInterval(() => {
                    if (!isMouseDown) return;
                    rotateByDegrees(direction * rotationSpeed);
                }, 80);
                
                // Phase 4: Nach weiteren 3 Sekunden am schnellsten (3° alle 60ms)
                setTimeout(() => {
                    if (!isMouseDown) return;
                    clearInterval(rotationInterval);
                    
                    rotationSpeed = 3;
                    rotationInterval = setInterval(() => {
                        if (!isMouseDown) return;
                        rotateByDegrees(direction * rotationSpeed);
                    }, 60);
                }, 3000);
            }, 3000);
        }, 2000);
    }, 800); // Längere Wartezeit vor Auto-Repeat
}

function stopRotationRepeat() {
    isMouseDown = false;
    rotationSpeed = 1;
    
    // WICHTIG: Alle Timeouts und Intervals komplett löschen
    if (rotationTimeout) {
        clearTimeout(rotationTimeout);
        rotationTimeout = null;
    }
    
    if (rotationInterval) {
        clearInterval(rotationInterval);
        rotationInterval = null;
    }
    
    // Extra-Sicherheit: Nach kurzer Verzögerung nochmals prüfen
    setTimeout(() => {
        if (rotationTimeout) {
            clearTimeout(rotationTimeout);
            rotationTimeout = null;
        }
        if (rotationInterval) {
            clearInterval(rotationInterval);
            rotationInterval = null;
        }
        isMouseDown = false;
    }, 50);
}

function rotateByDegrees(degrees) {
    currentRotation += degrees;
    
    // KORRIGIERTE Rotation: Behalte vollen Bereich für bessere Erkennung
    while (currentRotation > 360) currentRotation -= 360;
    while (currentRotation < 0) currentRotation += 360;
    
    const data = getCurrentFormData();
    const scale = calculateOptimalScale(data);
    updateShapeWithScale(scale);
    updateRotationDisplay();
    
    // Verzögerte Ausrichtungsprüfung für bessere Performance
    clearTimeout(window.alignmentCheckTimeout);
    window.alignmentCheckTimeout = setTimeout(() => {
        checkAlignmentAndHighlight();
    }, 50);
}

function checkAlignmentAndHighlight() {
    const data = getCurrentFormData();
    const baseCorners = getActualCornerPositions(data, calculateOptimalScale(data));
    
    // KORREKTE Rotation anwenden
    const rotatedCorners = baseCorners.map(corner => {
        if (Math.abs(currentRotation) < 0.1) return corner;
        
        const angle = (currentRotation * Math.PI) / 180;
        const relX = corner.x - CANVAS_CENTER_X;
        const relY = corner.y - CANVAS_CENTER_Y;
        
        return {
            x: CANVAS_CENTER_X + relX * Math.cos(angle) - relY * Math.sin(angle),
            y: CANVAS_CENTER_Y + relX * Math.sin(angle) + relY * Math.cos(angle)
        };
    });
    
    let hasHorizontalLine = false;
    let hasVerticalLine = false;
    let alignedEdges = [];
    let totalHorizontalLines = 0;
    let totalVerticalLines = 0;
    let alignedSides = []; // Welche Seiten sind ausgerichtet
    
    // KORRIGIERTE Ausrichtungserkennung: ALLE Seiten prüfen mit besserer Toleranz
    for (let i = 0; i < rotatedCorners.length; i++) {
        const nextIndex = (i + 1) % rotatedCorners.length;
        const p1 = rotatedCorners[i];
        const p2 = rotatedCorners[nextIndex];
        
        const deltaX = Math.abs(p2.x - p1.x);
        const deltaY = Math.abs(p2.y - p1.y);
        const lineLength = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
        
        // VERBESSERTE Toleranz: Abhängig von der Linienlänge
        const tolerancePercent = 0.02; // 2% der Linienlänge
        const minTolerance = 1.0;       // Minimum 1px
        const maxTolerance = 5.0;       // Maximum 5px
        
        const tolerance = Math.max(minTolerance, Math.min(maxTolerance, lineLength * tolerancePercent));
        const minLineLength = 20; // Reduziert für bessere Erkennung
        
        const sideLabels = ['A', 'B', 'C', 'D', 'E', 'F'];
        const sideName = sideLabels[i] || `Seite ${i+1}`;
        
        console.log(`Prüfe ${sideName}: Länge=${lineLength.toFixed(1)}px, deltaX=${deltaX.toFixed(1)}, deltaY=${deltaY.toFixed(1)}, Toleranz=${tolerance.toFixed(1)}`);
        
        if (lineLength > minLineLength) {
            // Prüfung für horizontale Linien (kleine Y-Differenz)
            if (deltaY <= tolerance && deltaX > minLineLength) {
                hasHorizontalLine = true;
                totalHorizontalLines++;
                alignedSides.push(`${sideName} (horizontal)`);
                alignedEdges.push({
                    type: 'horizontal',
                    p1: p1,
                    p2: p2,
                    index: i,
                    deviation: deltaY,
                    sideName: sideName
                });
                console.log(`✅ ${sideName} ist HORIZONTAL (deltaY=${deltaY.toFixed(1)} ≤ ${tolerance.toFixed(1)})`);
            }
            // Prüfung für vertikale Linien (kleine X-Differenz)  
            else if (deltaX <= tolerance && deltaY > minLineLength) {
                hasVerticalLine = true;
                totalVerticalLines++;
                alignedSides.push(`${sideName} (vertikal)`);
                alignedEdges.push({
                    type: 'vertical',
                    p1: p1,
                    p2: p2,
                    index: i,
                    deviation: deltaX,
                    sideName: sideName
                });
                console.log(`✅ ${sideName} ist VERTIKAL (deltaX=${deltaX.toFixed(1)} ≤ ${tolerance.toFixed(1)})`);
            } else {
                console.log(`❌ ${sideName} ist nicht ausgerichtet (deltaX=${deltaX.toFixed(1)}, deltaY=${deltaY.toFixed(1)})`);
            }
        } else {
            console.log(`⚠️ ${sideName} zu kurz (${lineLength.toFixed(1)}px < ${minLineLength}px)`);
        }
    }
    
    // ERWEITERTE Logik: Lockerere Anforderungen für bessere Erkennung
    const finalShape = determineActualShape();
    let sufficientAlignment = false;
    
    if (finalShape === 'dreieck') {
        // Bei Dreiecken: mindestens 1 Seite ausgerichtet
        sufficientAlignment = alignedEdges.length >= 1;
    } else if (finalShape === 'rechteck' || finalShape === 'quadrat') {
        // Bei Rechtecken: mindestens 1 Seite ausgerichtet (nicht mehr beide Richtungen)
        sufficientAlignment = alignedEdges.length >= 1;
    } else {
        sufficientAlignment = alignedEdges.length >= 1;
    }
    
    // KRITISCH: Lockerere Rotations-Toleranz
    const normalizedRotation = ((currentRotation % 360) + 360) % 360;
    const nearestCardinal = Math.round(normalizedRotation / 90) * 90;
    const rotationDeviation = Math.abs(normalizedRotation - nearestCardinal);
    
    console.log(`Zusammenfassung: Form=${finalShape}, Horizontal=${totalHorizontalLines}, Vertikal=${totalVerticalLines}, Rotation=${currentRotation.toFixed(1)}°, Abweichung=${rotationDeviation.toFixed(1)}°, Ausgerichtete Seiten: [${alignedSides.join(', ')}]`);
    
    if (alignedEdges.length > 0 && rotationDeviation < 6 && sufficientAlignment) {
        highlightAlignedEdges(alignedEdges);
        showAlignmentFeedback(hasHorizontalLine, hasVerticalLine, totalHorizontalLines, totalVerticalLines, alignedSides);
    } else {
        removeAlignmentHighlights();
        console.log(`Keine Ausrichtung angezeigt: alignedEdges=${alignedEdges.length}, rotationDeviation=${rotationDeviation.toFixed(1)}°, sufficient=${sufficientAlignment}`);
    }
}

function highlightAlignedEdges(alignedEdges) {
    removeAlignmentHighlights();
    
    alignedEdges.forEach((edge, index) => {
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.id = `alignment-highlight-${index}`;
        
        // KORREKT: Verwende die bereits rotierten Koordinaten
        line.setAttribute('x1', edge.p1.x);
        line.setAttribute('y1', edge.p1.y);
        line.setAttribute('x2', edge.p2.x);
        line.setAttribute('y2', edge.p2.y);
        
        line.setAttribute('stroke', '#28a745');
        line.setAttribute('stroke-width', '6');
        line.setAttribute('opacity', '0.9');
        line.style.pointerEvents = 'none';
        
        // Kürzere Animation
        line.style.animation = 'alignmentPulse 1s ease-in-out 2';
        
        // WICHTIG: Highlight-Linie OHNE Transform hinzufügen, da Koordinaten bereits rotiert sind
        svg.appendChild(line);
        
        // Auto-Remove nach Animation
        setTimeout(() => {
            if (line.parentNode) {
                line.remove();
            }
        }, 2000);
    });
    
    // CSS-Animation hinzufügen falls noch nicht vorhanden
    if (!document.getElementById('alignment-animation-styles')) {
        const style = document.createElement('style');
        style.id = 'alignment-animation-styles';
        style.textContent = `
            @keyframes alignmentPulse {
                0%, 100% { opacity: 0.9; stroke-width: 6; }
                50% { opacity: 1; stroke-width: 8; }
            }
        `;
        document.head.appendChild(style);
    }
}

function removeAlignmentHighlights() {
    if (!svg) return;
    
    // Entferne alle Highlight-Linien (sowohl direkt im SVG als auch in Gruppen)
    const highlights = svg.querySelectorAll('[id^="alignment-highlight-"]');
    highlights.forEach(highlight => highlight.remove());
    
    // Entferne auch die Highlight-Gruppe falls vorhanden
    const highlightGroup = document.getElementById('alignment-highlights');
    if (highlightGroup) {
        highlightGroup.remove();
    }
}

function showAlignmentFeedback(hasHorizontal, hasVertical, totalHorizontal, totalVertical, alignedSides) {
    // WICHTIG: Zusätzliche Validierung vor Anzeige
    const normalizedRotation = ((currentRotation % 360) + 360) % 360;
    const nearestCardinal = Math.round(normalizedRotation / 90) * 90;
    const rotationDeviation = Math.abs(normalizedRotation - nearestCardinal);
    
    // Nur anzeigen wenn wirklich gut ausgerichtet
    if (rotationDeviation > 4) {
        return; // Keine Anzeige bei schlechter Ausrichtung
    }
    
    // Entferne vorherige Feedback-Nachrichten
    const existingFeedback = document.querySelectorAll('.alignment-feedback');
    existingFeedback.forEach(fb => fb.remove());
    
    let message = '📐 Ausgerichtet: ';
    
    // ERWEITERTE Meldung mit Details über ausgerichtete Seiten
    if (alignedSides && alignedSides.length > 0) {
        message += alignedSides.join(', ');
    } else {
        // Fallback wenn alignedSides nicht verfügbar
        const messages = [];
        if (hasHorizontal) {
            messages.push(`${totalHorizontal} Horizontal`);
        }
        if (hasVertical) {
            messages.push(`${totalVertical} Vertikal`);
        }
        message += messages.join(' & ');
    }
    
    // Zusätzliche Info über Kardinalrichtung
    const cardinalNames = { 0: '0°', 90: '90°', 180: '180°', 270: '270°' };
    const cardinalName = cardinalNames[nearestCardinal] || `${nearestCardinal}°`;
    
    message += ` (${cardinalName})`;
    
    // Temporäres Feedback mit Auto-Remove
    const feedback = document.createElement('div');
    feedback.className = 'alignment-feedback';
    feedback.style.cssText = `
        position: fixed; top: 140px; right: 20px; background: #28a745; color: white;
        padding: 8px 16px; border-radius: 6px; z-index: 1000; box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        font-size: 12px; font-weight: 500; animation: slideIn 0.3s ease-out; max-width: 300px;
    `;
    feedback.textContent = message;
    document.body.appendChild(feedback);
    
    // Auto-Remove nach 2 Sekunden
    setTimeout(() => {
        if (feedback.parentNode) {
            feedback.style.animation = 'slideOut 0.3s ease-in';
            setTimeout(() => { 
                if (feedback.parentNode) { 
                    feedback.remove(); 
                } 
            }, 300);
        }
    }, 2500);
}

function createRotationDisplay() {
    const existing = document.getElementById('rotation-display');
    if (existing) existing.remove();
    
    const display = document.createElement('div');
    display.id = 'rotation-display';
    display.style.cssText = `
        position: absolute; top: 10px; right: 10px; background: rgba(0, 0, 0, 0.8); color: white;
        padding: 8px 12px; border-radius: 6px; font-family: 'Courier New', monospace;
        font-size: 14px; font-weight: bold; z-index: 1000; pointer-events: none;
    `;
    display.textContent = '0°';
    
    const canvasWrapper = document.querySelector('.canvas-wrapper');
    if (canvasWrapper) { canvasWrapper.appendChild(display); }
}

function updateRotationDisplay() {
    const display = document.getElementById('rotation-display');
    if (display) {
        const roundedRotation = Math.round(currentRotation * 10) / 10;
        display.textContent = roundedRotation + '°';
        
        // KORRIGIERTE Logik für Ausrichtung
        const normalizedRotation = ((roundedRotation % 360) + 360) % 360;
        const nearestCardinal = Math.round(normalizedRotation / 90) * 90;
        const rotationDeviation = Math.abs(normalizedRotation - nearestCardinal);
        
        // Nur bei sehr präziser Ausrichtung (innerhalb 2°) grün anzeigen
        const isAligned = rotationDeviation <= 2;
        display.style.background = isAligned ? '#28a745' : 'rgba(0, 0, 0, 0.8)';
        
        // Debug für Entwicklung
        if (rotationDeviation <= 5) {
            console.log(`Rotation: ${roundedRotation}°, Nächste Kardinalrichtung: ${nearestCardinal}°, Abweichung: ${rotationDeviation.toFixed(1)}°`);
        }
    }
}

function displayProfileInfo() {
    const profile = projectData.profile;
    if (!profile) return;
    
    const elements = {
        'current-profile-name': profile.profilname || 'Standard',
        'current-deckbreite': (profile.deckbreite || 1000) + ' mm',
        'current-lieferbreite': (profile.lieferbreite || 1050) + ' mm',
        'current-seitenueberlappung': (profile.seitenueberlappung || 50) + ' mm'
    };
    
    Object.entries(elements).forEach(([id, value]) => {
        const element = document.getElementById(id);
        if (element) { element.textContent = value; }
    });
}

function updateShapeTitle() {
    const roofShape = projectData.roofShape;
    if (!roofShape) return;
    
    const shapeNames = {
        'kreis': 'Kreis', 'oval': 'Oval', 'halbkreis': 'Halbkreis', 'viertelkreis': 'Viertelkreis', 'langloch': 'Langloch',
        'dreieck': 'Dreieck', 'gleichseitig': 'Gleichseitiges Dreieck', 'rechtwinklig': 'Rechtwinkliges Dreieck', 
        'ungleichschenklig': 'Ungleichschenkliges Dreieck', 'viereck': 'Viereck', 'rechteck': 'Rechteck', 'quadrat': 'Quadrat',
        'parallelogramm': 'Parallelogramm', 'trapez': 'Trapez', 'rhombus': 'Rhombus', 'vieleck': 'Vieleck',
        'fuenfeck': 'Fünfeck', 'sechseck': 'Sechseck', 'achteck': 'Achteck', 'lform': 'L-Form', 'tform': 'T-Form', 'uform': 'U-Form'
    };
    
    const shapeName = shapeNames[roofShape.variant] || shapeNames[roofShape.baseShape] || 'Unbekannt';
    
    const element = document.getElementById('current-shape-name');
    if (element) { element.textContent = shapeName; }
}

function loadAndDrawShape() {
    const roofShape = projectData.roofShape;
    if (!roofShape) {
        currentShape = 'viereck';
        currentVariant = 'rechteck';
    } else {
        currentShape = roofShape.baseShape || 'viereck';
        currentVariant = roofShape.variant || 'rechteck';
        if (roofShape.rotation !== undefined) currentRotation = roofShape.rotation;
    }
    
    createInputFields();
    updateShape();
}

function determineActualShape() {
    if (shapeCache.lastShape === currentShape && shapeCache.lastVariant === currentVariant) {
        return shapeCache.lastResult;
    }
    
    let result = 'rechteck';
    
    if (currentVariant === 'quadrat') result = 'quadrat';
    else if (currentVariant === 'trapez') result = 'trapez';
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

function determineActualVariant() {
    return currentVariant || 'rechteck';
}

function createInputFields() {
    const container = document.getElementById('geometry-inputs-grid');
    if (!container) return;
    
    container.innerHTML = '';
    const finalShape = determineActualShape();
    const variant = determineActualVariant();
    const savedData = projectData.roofShape || {};
    
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
        container.appendChild(createInput('Seite A (m)', 'sideA', savedData.sideA || '8'));
        container.appendChild(createInput('Seite B (m)', 'sideB', savedData.sideB || '6'));
        container.appendChild(createInput('Höhe (m)', 'height', savedData.height || '4'));
    } else {
        container.appendChild(createInput('Länge (m)', 'length', savedData.length || '8'));
        container.appendChild(createInput('Breite (m)', 'width', savedData.width || '5'));
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
    window.inputTimeout = setTimeout(() => {
        if (isUpdating) return;
        isUpdating = true;
        
        try {
            const data = getCurrentFormData();
            const newScale = calculateOptimalScale(data);
            updateShapeWithScale(newScale);
        } catch (error) {
            console.error('Input-Change Fehler:', error);
        } finally {
            setTimeout(() => { isUpdating = false; }, 50);
        }
    }, 100);
}

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

function updateShapeWithScale(scale) {
    if (!svg) return;
    
    const data = getCurrentFormData();
    
    const shapeGroup = document.getElementById('roof-shape');
    const labelsGroup = document.getElementById('labels');
    
    if (shapeGroup) shapeGroup.innerHTML = '';
    if (labelsGroup) labelsGroup.innerHTML = '';
    
    if (shapeGroup) {
        shapeGroup.removeAttribute('transform');
        drawCurrentShape(shapeGroup, data, scale);
    }
    
    if (labelsGroup) {
        drawLabelsOnShape(labelsGroup, data, scale);
    }
    
    updateCalculations(data);
    updateRotationDisplay();
    checkAlignmentAndHighlight();
}

function updateShape() {
    const data = getCurrentFormData();
    const optimalScale = calculateOptimalScale(data);
    updateShapeWithScale(optimalScale);
}

function getCurrentFormData() {
    const data = { shape: currentShape, variant: currentVariant };
    const inputs = document.querySelectorAll('#geometry-inputs-grid input');
    
    inputs.forEach(input => {
        if (input.value && input.value.trim() !== '') {
            const numValue = parseFloat(input.value);
            if (!isNaN(numValue) && numValue > 0) {
                data[input.id] = numValue;
            }
        }
    });
    
    return data;
}

function drawCurrentShape(group, data, scale) {
    const finalShape = determineActualShape();
    
    if (finalShape === 'kreis') {
        drawCircleShape(group, data, scale);
    } else if (finalShape === 'oval') {
        drawOvalShape(group, data, scale);
    } else if (finalShape === 'rechteck') {
        drawRectangleShape(group, data, scale);
    } else if (finalShape === 'quadrat') {
        drawSquareShape(group, data, scale);
    } else if (finalShape === 'dreieck') {
        drawTriangleShape(group, data, scale);
    } else if (finalShape === 'trapez') {
        drawTrapezShape(group, data, scale);
    } else {
        drawRectangleShape(group, data, scale);
    }
    
    if (currentRotation !== 0) {
        group.setAttribute('transform', `rotate(${currentRotation} ${CANVAS_CENTER_X} ${CANVAS_CENTER_Y})`);
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

function drawTrapezShape(group, data, scale) {
    const sideA = (data.sideA || 8) * scale;
    const sideB = (data.sideB || 6) * scale;
    const height = (data.height || 4) * scale;
    
    const centerX = CANVAS_CENTER_X;
    const centerY = CANVAS_CENTER_Y;
    
    const points = `
        ${centerX - sideA/2},${centerY + height/2}
        ${centerX + sideA/2},${centerY + height/2}
        ${centerX + sideB/2},${centerY - height/2}
        ${centerX - sideB/2},${centerY - height/2}
    `;
    
    const polygon = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
    polygon.setAttribute('points', points);
    polygon.setAttribute('fill', 'rgba(0, 123, 255, 0.3)');
    polygon.setAttribute('stroke', '#007bff');
    polygon.setAttribute('stroke-width', '3');
    group.appendChild(polygon);
}

function getActualCornerPositions(data, scale) {
    const finalShape = determineActualShape();
    const variant = determineActualVariant();
    let corners = [];
    
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
        const sideA = (data.sideA || 8) * scale;
        const sideB = (data.sideB || 6) * scale;
        const height = (data.height || 4) * scale;
        corners = [
            { x: CANVAS_CENTER_X - sideA/2, y: CANVAS_CENTER_Y + height/2 },
            { x: CANVAS_CENTER_X + sideA/2, y: CANVAS_CENTER_Y + height/2 },
            { x: CANVAS_CENTER_X + sideB/2, y: CANVAS_CENTER_Y - height/2 },
            { x: CANVAS_CENTER_X - sideB/2, y: CANVAS_CENTER_Y - height/2 }
        ];
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

function drawLabelsOnShape(group, data, scale) {
    const corners = getActualCornerPositions(data, scale);
    const finalShape = determineActualShape();
    const variant = determineActualVariant();
    
    if (finalShape === 'dreieck' && corners.length >= 3) {
        const labels = ['A', 'B', 'C'];
        const colors = ['#dc3545', '#28a745', '#ffc107'];
        
        // DEBUG: Ausgabe der Eckpunkte
        console.log('Dreieck-Ecken:', corners.map((c, i) => `${labels[i]}: (${c.x.toFixed(1)}, ${c.y.toFixed(1)})`));
        
        // SPEZIELLE Behandlung für verschiedene Dreieck-Typen
        if (variant === 'gleichseitig') {
            // Gleichseitiges Dreieck: Spitze oben, Basis unten
            const labels_positions = [
                { label: 'A', pos: corners[0], offset: { x: 0, y: -20 } },    // Spitze oben
                { label: 'B', pos: corners[1], offset: { x: -20, y: 15 } },   // Links unten
                { label: 'C', pos: corners[2], offset: { x: 20, y: 15 } }     // Rechts unten
            ];
            
            labels_positions.forEach((item, i) => {
                const labelX = item.pos.x + item.offset.x;
                const labelY = item.pos.y + item.offset.y;
                const label = createLabel(labelX, labelY, item.label, colors[i]);
                group.appendChild(label);
            });
        } else if (variant === 'rechtwinklig') {
            // Rechtwinkliges Dreieck: Rechter Winkel unten links
            const labels_positions = [
                { label: 'A', pos: corners[0], offset: { x: -25, y: 15 } },   // Unten links (rechter Winkel)
                { label: 'B', pos: corners[1], offset: { x: 25, y: 15 } },    // Unten rechts
                { label: 'C', pos: corners[2], offset: { x: -25, y: -15 } }   // Oben links
            ];
            
            labels_positions.forEach((item, i) => {
                const labelX = item.pos.x + item.offset.x;
                const labelY = item.pos.y + item.offset.y;
                const label = createLabel(labelX, labelY, item.label, colors[i]);
                group.appendChild(label);
            });
        } else {
            // Ungleichschenkliges Dreieck: Standard-Positionierung
            const labels_positions = [
                { label: 'A', pos: corners[0], offset: { x: 0, y: -20 } },    // Spitze oben
                { label: 'B', pos: corners[1], offset: { x: -20, y: 15 } },   // Links unten
                { label: 'C', pos: corners[2], offset: { x: 20, y: 15 } }     // Rechts unten
            ];
            
            labels_positions.forEach((item, i) => {
                const labelX = item.pos.x + item.offset.x;
                const labelY = item.pos.y + item.offset.y;
                const label = createLabel(labelX, labelY, item.label, colors[i]);
                group.appendChild(label);
            });
        }
    } else if (corners.length >= 4 && ['quadrat', 'rechteck', 'trapez'].includes(finalShape)) {
        const labels = ['A', 'B', 'C', 'D'];
        const colors = ['#007bff', '#28a745', '#dc3545', '#ffc107'];
        
        // DEBUG: Ausgabe der Eckpunkte
        console.log('Rechteck-Ecken:', corners.map((c, i) => `${labels[i]}: (${c.x.toFixed(1)}, ${c.y.toFixed(1)})`));
        
        // Fixe Positionierung basierend auf der Eckpunkt-Reihenfolge
        const labels_positions = [
            { label: 'A', pos: corners[0], offset: { x: -20, y: -15 } },  // Erste Ecke
            { label: 'B', pos: corners[1], offset: { x: 20, y: -15 } },   // Zweite Ecke  
            { label: 'C', pos: corners[2], offset: { x: 20, y: 20 } },    // Dritte Ecke
            { label: 'D', pos: corners[3], offset: { x: -20, y: 20 } }    // Vierte Ecke
        ];
        
        labels_positions.forEach((item, i) => {
            if (i < corners.length) {
                const labelX = item.pos.x + item.offset.x;
                const labelY = item.pos.y + item.offset.y;
                const label = createLabel(labelX, labelY, item.label, colors[i]);
                group.appendChild(label);
            }
        });
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
            const sideA = data.sideA || 8;
            const sideB = data.sideB || 6;
            const height = data.height || 4;
            area = ((sideA + sideB) / 2) * height;
            const sideLength = Math.sqrt(height * height + ((sideA - sideB) / 2) * ((sideA - sideB) / 2));
            perimeter = sideA + sideB + 2 * sideLength;
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
    removeAlignmentHighlights();
    
    const inputs = document.querySelectorAll('#geometry-inputs-grid input');
    inputs.forEach(input => {
        const finalShape = determineActualShape();
        switch(input.id) {
            case 'radius': input.value = '3'; break;
            case 'radiusX': input.value = '4'; break;
            case 'radiusY': input.value = '2.5'; break;
            case 'side': 
                input.value = finalShape === 'quadrat' ? '5' : '6'; 
                break;
            case 'katheteA': input.value = '4'; break;
            case 'katheteB': input.value = '5'; break;
            case 'sideA': input.value = '4'; break;
            case 'sideB': input.value = '5'; break;
            case 'sideC': input.value = '6'; break;
            case 'length': input.value = '8'; break;
            case 'width': input.value = '5'; break;
            case 'height': input.value = '4'; break;
        }
    });
    
    updateShape();
    showFeedback('Zurückgesetzt: Form, Rotation und alle Parameter');
}

function showFeedback(message, backgroundColor = '#28a745') {
    const existingFeedback = document.querySelectorAll('.feedback-message');
    existingFeedback.forEach(fb => fb.remove());
    
    const feedback = document.createElement('div');
    feedback.className = 'feedback-message';
    feedback.style.cssText = `
        position: fixed; top: 100px; right: 20px; background: ${backgroundColor}; color: white;
        padding: 12px 20px; border-radius: 6px; z-index: 1000; box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        max-width: 300px; font-size: 14px; font-weight: 500; animation: slideIn 0.3s ease-out;
    `;
    
    if (!document.getElementById('feedback-styles')) {
        const style = document.createElement('style');
        style.id = 'feedback-styles';
        style.textContent = `
            @keyframes slideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
            @keyframes slideOut { from { transform: translateX(0); opacity: 1; } to { transform: translateX(100%); opacity: 0; } }
        `;
        document.head.appendChild(style);
    }
    
    feedback.textContent = message;
    document.body.appendChild(feedback);
    
    setTimeout(() => {
        feedback.style.animation = 'slideOut 0.3s ease-in';
        setTimeout(() => { if (feedback.parentNode) { feedback.remove(); } }, 300);
    }, 3000);
}

function saveCurrentData() {
    const currentData = getCurrentFormData();
    currentData.rotation = currentRotation;
    
    if (!projectData.roofShape) { projectData.roofShape = {}; }
    Object.assign(projectData.roofShape, currentData);
    
    projectData.roofShape.points = generateRoofPoints(currentData);
    
    projectData.geometry = {
        shapeType: determineActualShape(),
        variant: determineActualVariant(),
        points: projectData.roofShape.points,
        rotation: currentRotation,
        area: calculateArea(currentData),
        dimensions: calculateDimensions(currentData)
    };
    
    try {
        localStorage.setItem('dachplattenrechner_data', JSON.stringify(projectData));
    } catch (e) {
        sessionStorage.setItem('dachplattenrechner_data', JSON.stringify(projectData));
    }
}

function generateRoofPoints(data) {
    const finalShape = determineActualShape();
    const variant = determineActualVariant();
    let points = [];
    
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

function calculateArea(data) {
    const finalShape = determineActualShape();
    const variant = determineActualVariant();
    
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
        default:
            return 40;
    }
}

function calculateDimensions(data) {
    const finalShape = determineActualShape();
    
    switch (finalShape) {
        case 'kreis':
            const circleRadius = data.radius || 3;
            return { length: circleRadius * 2, width: circleRadius * 2 };
        case 'rechteck':
            return { length: data.length || 8, width: data.width || 5 };
        case 'quadrat':
            const side = data.side || 5;
            return { length: side, width: side };
        default:
            return { length: 8, width: 5 };
    }
}

// Globale Event Listener
document.addEventListener('mouseup', () => {
    if (isMouseDown) {
        stopRotationRepeat();
    }
});

document.addEventListener('contextmenu', (e) => {
    if (e.target.closest('.btn-tool.rotation')) {
        e.preventDefault();
    }
});

console.log('Editor.js erfolgreich geladen');
