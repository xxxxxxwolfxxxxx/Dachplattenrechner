// Eingabefelder generieren (für Rechtecke)
function generateInputFields() {
    const container = document.getElementById('geometry-inputs-grid');
    if (!container) return;
    
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

// Globale Variablen
let projectData = {};
let currentPoints = [];
let currentShapeType = 'rechteck';
let currentValues = { length: 10, width: 8 };
let waterFlowDirection = 'down';
let preferredDirection = 'laengs';

// DEBUG-Funktion (deaktiviert)
function showDebugInfo(message) {
    // Debug-Ausgaben deaktiviert
    console.log('DEBUG: ' + message);
}

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
        
        console.log('Profil-Werte:', { profilName, deckbreite, lieferbreite, seitenueberlappung });
        
        const nameElement = document.getElementById('current-profile-name');
        const deckbreiteElement = document.getElementById('current-deckbreite');
        const lieferbreiteElement = document.getElementById('current-lieferbreite');
        const seitenueberlappungElement = document.getElementById('current-seitenueberlappung');
        
        console.log('UI-Elemente gefunden:', {
            nameElement: !!nameElement,
            deckbreiteElement: !!deckbreiteElement,
            lieferbreiteElement: !!lieferbreiteElement,
            seitenueberlappungElement: !!seitenueberlappungElement
        });
        
        if (nameElement) nameElement.textContent = profilName;
        if (deckbreiteElement) deckbreiteElement.textContent = deckbreite + ' mm';
        if (lieferbreiteElement) lieferbreiteElement.textContent = lieferbreite + ' mm';
        if (seitenueberlappungElement) seitenueberlappungElement.textContent = seitenueberlappung + ' mm';
        
        console.log('Profil-Info erfolgreich angezeigt');
    } else {
        console.log('Keine Profil-Daten gefunden!');
        
        const elements = [
            'current-profile-name',
            'current-deckbreite', 
            'current-lieferbreite',
            'current-seitenueberlappung'
        ];
        
        elements.forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.textContent = 'Nicht verfügbar';
                element.style.color = 'red';
            }
        });
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
    const length = currentValues.length || 10;
    const width = currentValues.width || 8;
    
    return [
        { x: 0, y: 0 },
        { x: length, y: 0 },
        { x: length, y: width },
        { x: 0, y: width }
    ];
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

// Eingabefelder für Dreieck
function generateTriangleInputFields() {
    const container = document.getElementById('geometry-inputs-grid');
    if (!container) return;
    
    container.innerHTML = `
        <div class="input-group">
            <label>Dreieck-Typ:</label>
            <div class="input-group-wrapper">
                <span>${projectData.roofShape?.variant || 'Standard'}</span>
            </div>
        </div>
        <div class="input-group">
            <label>Basis:</label>
            <div class="input-group-wrapper">
                <input type="number" step="0.1" min="0.1" value="${(Math.max(...currentPoints.map(p => p.x)) - Math.min(...currentPoints.map(p => p.x))).toFixed(1)}" onchange="updateTriangleSize('width', this.value)">
                <span class="input-unit">m</span>
            </div>
        </div>
        <div class="input-group">
            <label>Höhe:</label>
            <div class="input-group-wrapper">
                <input type="number" step="0.1" min="0.1" value="${(Math.max(...currentPoints.map(p => p.y)) - Math.min(...currentPoints.map(p => p.y))).toFixed(1)}" onchange="updateTriangleSize('height', this.value)">
                <span class="input-unit">m</span>
            </div>
        </div>
        <div class="input-group">
            <label>Punkte:</label>
            <div class="input-group-wrapper">
                <span>${currentPoints.length}</span>
            </div>
        </div>
    `;
}

// Eingabefelder für Vieleck
function generatePolygonInputFields() {
    const container = document.getElementById('geometry-inputs-grid');
    if (!container) return;
    
    container.innerHTML = `
        <div class="input-group">
            <label>Form-Typ:</label>
            <div class="input-group-wrapper">
                <span>${projectData.roofShape?.variant || 'Vieleck'}</span>
            </div>
        </div>
        <div class="input-group">
            <label>Breite:</label>
            <div class="input-group-wrapper">
                <span>${(Math.max(...currentPoints.map(p => p.x)) - Math.min(...currentPoints.map(p => p.x))).toFixed(1)} m</span>
            </div>
        </div>
        <div class="input-group">
            <label>Höhe:</label>
            <div class="input-group-wrapper">
                <span>${(Math.max(...currentPoints.map(p => p.y)) - Math.min(...currentPoints.map(p => p.y))).toFixed(1)} m</span>
            </div>
        </div>
        <div class="input-group">
            <label>Punkte:</label>
            <div class="input-group-wrapper">
                <span>${currentPoints.length}</span>
            </div>
        </div>
    `;
}

// Dreieck-Größe anpassen
function updateTriangleSize(dimension, value) {
    const newValue = parseFloat(value) || 1;
    
    if (dimension === 'width') {
        // Basis anpassen
        const currentWidth = Math.max(...currentPoints.map(p => p.x)) - Math.min(...currentPoints.map(p => p.x));
        const scale = newValue / currentWidth;
        currentPoints = currentPoints.map(p => ({ x: p.x * scale, y: p.y }));
    } else if (dimension === 'height') {
        // Höhe anpassen
        const currentHeight = Math.max(...currentPoints.map(p => p.y)) - Math.min(...currentPoints.map(p => p.y));
        const scale = newValue / currentHeight;
        currentPoints = currentPoints.map(p => ({ x: p.x, y: p.y * scale }));
    }
    
    updateShape();
    updateInfoPanel();
}

// Wert aktualisieren
function updateValue(fieldId, value) {
    currentValues[fieldId] = parseFloat(value) || 0;
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

// NEU: Wasserlauf-Seite auswählen
function selectWaterFlowSide() {
    console.log('Wasserlauf-Auswahl gestartet');
    
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
        <h3 style="margin-bottom: 20px;">Wasserlauf-Richtung bestimmen</h3>
        <p style="margin-bottom: 30px; text-align: center;">Klicken Sie auf die Seite, in die das Wasser fließen soll:</p>
        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px;">
            <button onclick="window.setWaterFlowDirection('top')" style="padding: 20px 40px; font-size: 16px; cursor: pointer; border: none; border-radius: 5px;">↑ Nach oben</button>
            <button onclick="window.setWaterFlowDirection('right')" style="padding: 20px 40px; font-size: 16px; cursor: pointer; border: none; border-radius: 5px;">→ Nach rechts</button>
            <button onclick="window.setWaterFlowDirection('bottom')" style="padding: 20px 40px; font-size: 16px; cursor: pointer; border: none; border-radius: 5px;">↓ Nach unten</button>
            <button onclick="window.setWaterFlowDirection('left')" style="padding: 20px 40px; font-size: 16px; cursor: pointer; border: none; border-radius: 5px;">← Nach links</button>
        </div>
        <button onclick="window.closeOverlay()" style="margin-top: 30px; padding: 10px 20px; background: #666; color: white; border: none; cursor: pointer; border-radius: 5px;">Abbrechen</button>
    `;
    
    document.body.appendChild(overlay);
    window.currentOverlay = overlay;
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

// NEU: Wasserlauf-Richtung setzen
function setWaterFlowDirection(direction) {
    console.log('Wasserlauf-Richtung gesetzt: ' + direction);
    
    // Form entsprechend der Wasserlauf-Richtung ausrichten
    orientToWaterFlow(direction);
    
    waterFlowDirection = direction;
    determinePreferredDirection();
    updateWaterFlowDisplay();
    
    closeOverlay();
}

// NEU: Traufe-Position setzen
function setTraufePosition(position) {
    console.log('Traufe-Position gesetzt: ' + position);
    
    // Form entsprechend der Traufe-Position ausrichten
    orientToTraufe(position);
    
    // Wasserlauf ist normalerweise zur Traufe hin gerichtet
    waterFlowDirection = position;
    determinePreferredDirection();
    updateWaterFlowDisplay();
    
    closeOverlay();
}

// NEU: Form zur Wasserlauf-Richtung ausrichten
function orientToWaterFlow(direction) {
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
    switch (direction) {
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

// NEU: Form zur Traufe-Position ausrichten
function orientToTraufe(position) {
    // Gleiche Logik wie bei Wasserlauf, da Traufe = Wasserlauf-Ziel
    orientToWaterFlow(position);
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

// NEU: Wasserlauf-Anzeige aktualisieren
function updateWaterFlowDisplay() {
    const leftFlow = document.getElementById('water-flow-left');
    const rightFlow = document.getElementById('water-flow-right');
    
    if (!leftFlow || !rightFlow) return;
    
    // Alle ausblenden
    leftFlow.style.display = 'none';
    rightFlow.style.display = 'none';
    
    // Je nach Richtung anzeigen
    switch (waterFlowDirection) {
        case 'bottom':
        case 'down':
            leftFlow.style.display = 'flex';
            rightFlow.style.display = 'flex';
            leftFlow.innerHTML = '<div class="flow-text">Wasserlauf</div><div class="flow-arrow">⬇</div>';
            rightFlow.innerHTML = '<div class="flow-text">Wasserlauf</div><div class="flow-arrow">⬇</div>';
            break;
        case 'top':
            leftFlow.style.display = 'flex';
            rightFlow.style.display = 'flex';
            leftFlow.innerHTML = '<div class="flow-text">Wasserlauf</div><div class="flow-arrow">⬆</div>';
            rightFlow.innerHTML = '<div class="flow-text">Wasserlauf</div><div class="flow-arrow">⬆</div>';
            break;
        case 'left':
            leftFlow.style.display = 'flex';
            leftFlow.innerHTML = '<div class="flow-text">Wasserlauf</div><div class="flow-arrow">⬅</div>';
            break;
        case 'right':
            rightFlow.style.display = 'flex';
            rightFlow.innerHTML = '<div class="flow-text">Wasserlauf</div><div class="flow-arrow">➡</div>';
            break;
    }
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
    const btnWaterFlow = document.getElementById('btn-water-flow');
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

    // KORRIGIERT: 45° Drehung statt 90°
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

    // NEU: Wasserlauf-Bestimmung mit Seitenauswahl
    if (btnWaterFlow) btnWaterFlow.addEventListener('click', selectWaterFlowSide);

    // NEU: Traufe-Bestimmung mit Seitenauswahl
    if (btnTraufe) btnTraufe.addEventListener('click', selectTraufeSide);

    if (btnReset) btnReset.addEventListener('click', function() {
        currentValues = { length: 10, width: 8 };
        waterFlowDirection = 'down';
        preferredDirection = 'laengs';
        generateInputFields();
        updateGeometry();
        updateWaterFlowDisplay();
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
        
        // Vorhandene Punkte aus roofShape laden
        if (projectData.roofShape && projectData.roofShape.points && projectData.roofShape.points.length > 0) {
            console.log('Lade vorhandene Dachform-Punkte:', projectData.roofShape.points.length, 'Punkte');
            currentPoints = [...projectData.roofShape.points];
            currentShapeType = projectData.roofShape.baseShape || 'rechteck';
            
            // Shape-Namen aktualisieren
            const shapeNameElement = document.getElementById('current-shape-name');
            if (shapeNameElement) {
                const shapeName = projectData.roofShape.variant || currentShapeType || 'Rechteck';
                shapeNameElement.textContent = shapeName.charAt(0).toUpperCase() + shapeName.slice(1);
            }
            
            if (currentPoints.length === 3) {
                console.log('Dreieck erkannt - verwende spezielle Eingabe');
                generateTriangleInputFields();
            } else if (currentPoints.length === 4) {
                console.log('Rechteck erkannt - verwende Standard-Eingabe');
                const xs = currentPoints.map(p => p.x);
                const ys = currentPoints.map(p => p.y);
                currentValues.length = Math.max(...xs) - Math.min(...xs);
                currentValues.width = Math.max(...ys) - Math.min(...ys);
                generateInputFields();
            } else {
                console.log('Vieleck erkannt - verwende Punkt-Eingabe');
                generatePolygonInputFields();
            }
        } else {
            console.log('Keine Punkte vorhanden - verwende Standard-Rechteck');
            generateInputFields();
            updateGeometry();
        }
        
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
window.setWaterFlowDirection = setWaterFlowDirection;
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
