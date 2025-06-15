// Globale Variablen
let projectData = {};
let currentPoints = [];
let currentShapeType = 'rechteck';
let currentValues = { length: 10, width: 8 };
let waterFlowDirection = 'down';
let preferredDirection = 'laengs';

// DEBUG-Funktion
function showDebugInfo(message) {
    const debugElement = document.getElementById('debug-content');
    if (debugElement) {
        debugElement.innerHTML += '<div style="margin: 2px 0; font-size: 12px;">' + message + '</div>';
    } else {
        console.log('DEBUG: ' + message);
    }
}

// Storage-Funktionen
function saveData() {
    try {
        showDebugInfo('💾 Speichere Daten...');
        localStorage.setItem('dachplattenrechner_data', JSON.stringify(projectData));
        showDebugInfo('✅ Daten erfolgreich in localStorage gespeichert');
        return true;
    } catch (e) {
        showDebugInfo('⚠️ localStorage nicht verfügbar, versuche sessionStorage');
        try {
            sessionStorage.setItem('dachplattenrechner_data', JSON.stringify(projectData));
            showDebugInfo('✅ Daten erfolgreich in sessionStorage gespeichert');
            return true;
        } catch (e2) {
            showDebugInfo('❌ Speichern fehlgeschlagen: ' + e2.message);
            return false;
        }
    }
}

function loadData() {
    try {
        showDebugInfo('📥 Versuche Daten zu laden...');
        
        let saved = localStorage.getItem('dachplattenrechner_data');
        showDebugInfo('📦 localStorage: ' + (saved ? 'Daten gefunden (' + saved.length + ' Zeichen)' : 'Leer'));
        
        if (!saved) {
            saved = sessionStorage.getItem('dachplattenrechner_data');
            showDebugInfo('📦 sessionStorage: ' + (saved ? 'Daten gefunden (' + saved.length + ' Zeichen)' : 'Leer'));
        }
        
        if (saved) {
            const data = JSON.parse(saved);
            showDebugInfo('📋 Geladene Daten-Struktur: ' + Object.keys(data).join(', '));
            showDebugInfo('👤 Profil vorhanden: ' + (data.profile ? 'JA' : 'NEIN'));
            if (data.profile) {
                showDebugInfo('🔧 Profil-Name: ' + (data.profile.profilname || 'Unbekannt'));
                showDebugInfo('📐 Deckbreite: ' + (data.profile.deckbreite || 'Unbekannt'));
            }
            return data;
        } else {
            showDebugInfo('❌ Keine gespeicherten Daten gefunden');
            return {};
        }
    } catch (e) {
        showDebugInfo('❌ Fehler beim Laden: ' + e.message);
        return {};
    }
}

// Profil-Info anzeigen
function displayProfileInfo() {
    showDebugInfo('🎯 displayProfileInfo aufgerufen');
    const profile = projectData.profile;
    
    showDebugInfo('🔍 Profil-Objekt: ' + (profile ? 'Vorhanden' : 'Fehlt'));
    
    if (profile) {
        showDebugInfo('✅ Profil-Daten verfügbar, fülle UI-Felder...');
        
        const profilName = profile.profilname || 'Standard';
        const deckbreite = profile.deckbreite || 1000;
        const lieferbreite = profile.lieferbreite || 1050;
        const seitenueberlappung = profile.seitenueberlappung || 50;
        
        showDebugInfo('📋 Werte: ' + profilName + ', ' + deckbreite + 'mm, ' + lieferbreite + 'mm, ' + seitenueberlappung + 'mm');
        
        const nameElement = document.getElementById('current-profile-name');
        const deckbreiteElement = document.getElementById('current-deckbreite');
        const lieferbreiteElement = document.getElementById('current-lieferbreite');
        const seitenueberlappungElement = document.getElementById('current-seitenueberlappung');
        
        showDebugInfo('🎯 UI-Elemente: ' + 
            (nameElement ? '✅' : '❌') + 'Name ' +
            (deckbreiteElement ? '✅' : '❌') + 'Deckbreite ' +
            (lieferbreiteElement ? '✅' : '❌') + 'Lieferbreite ' +
            (seitenueberlappungElement ? '✅' : '❌') + 'Überlappung'
        );
        
        if (nameElement) nameElement.textContent = profilName;
        if (deckbreiteElement) deckbreiteElement.textContent = deckbreite + ' mm';
        if (lieferbreiteElement) lieferbreiteElement.textContent = lieferbreite + ' mm';
        if (seitenueberlappungElement) seitenueberlappungElement.textContent = seitenueberlappung + ' mm';
        
        showDebugInfo('✅ Profil-Info erfolgreich angezeigt');
    } else {
        showDebugInfo('❌ Keine Profil-Daten gefunden!');
        
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
    
    if (waterFlowDirection === 'down') {
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

// Eingabefelder generieren
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

// Wasserlaufrichtung umschalten
function toggleWaterFlow() {
    const leftFlow = document.getElementById('water-flow-left');
    const rightFlow = document.getElementById('water-flow-right');
    const waterBtn = document.getElementById('btn-water-flow');
    
    if (waterFlowDirection === 'down') {
        waterFlowDirection = 'side';
        if (leftFlow) leftFlow.style.display = 'none';
        if (rightFlow) rightFlow.style.display = 'none';
        if (waterBtn) waterBtn.classList.add('active');
    } else {
        waterFlowDirection = 'down';
        if (leftFlow) leftFlow.style.display = 'flex';
        if (rightFlow) rightFlow.style.display = 'flex';
        if (waterBtn) waterBtn.classList.remove('active');
    }
    
    determinePreferredDirection();
}

// Event-Handler
function setupEventHandlers() {
    const btnMirrorH = document.getElementById('btn-mirror-horizontal');
    const btnMirrorV = document.getElementById('btn-mirror-vertical');
    const btnRotateL = document.getElementById('btn-rotate-left');
    const btnRotateR = document.getElementById('btn-rotate-right');
    const btnWaterFlow = document.getElementById('btn-water-flow');
    const btnReset = document.getElementById('btn-reset');
    const btnBack = document.getElementById('btn-back');
    const btnContinue = document.getElementById('btn-continue');

    if (btnMirrorH) btnMirrorH.addEventListener('click', function() {
        currentPoints = currentPoints.map(p => ({ x: -p.x, y: p.y }));
        updateShape();
    });

    if (btnMirrorV) btnMirrorV.addEventListener('click', function() {
        currentPoints = currentPoints.map(p => ({ x: p.x, y: -p.y }));
        updateShape();
    });

    if (btnRotateL) btnRotateL.addEventListener('click', function() {
        currentPoints = currentPoints.map(p => ({ x: -p.y, y: p.x }));
        updateShape();
    });

    if (btnRotateR) btnRotateR.addEventListener('click', function() {
        currentPoints = currentPoints.map(p => ({ x: p.y, y: -p.x }));
        updateShape();
    });

    if (btnWaterFlow) btnWaterFlow.addEventListener('click', toggleWaterFlow);

    if (btnReset) btnReset.addEventListener('click', function() {
        currentValues = { length: 10, width: 8 };
        waterFlowDirection = 'down';
        preferredDirection = 'laengs';
        generateInputFields();
        updateGeometry();
        const leftFlow = document.getElementById('water-flow-left');
        const rightFlow = document.getElementById('water-flow-right');
        const waterBtn = document.getElementById('btn-water-flow');
        if (leftFlow) leftFlow.style.display = 'flex';
        if (rightFlow) rightFlow.style.display = 'flex';
        if (waterBtn) waterBtn.classList.remove('active');
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
        
        showDebugInfo('💾 Speichere Projektdaten mit Profil: ' + (projectData.profile?.profilname || 'Unbekannt'));

        const saved = saveData();
        if (saved) {
            showDebugInfo('✅ Daten erfolgreich gespeichert');
            window.location.href = 'berechnung.html';
        } else {
            alert('Speichern fehlgeschlagen. Daten werden in der Session gespeichert.');
            window.location.href = 'berechnung.html';
        }
    } catch (error) {
        showDebugInfo('❌ Fehler beim Speichern: ' + error.message);
        alert('Ein Fehler ist aufgetreten. Trotzdem fortfahren?');
        window.location.href = 'berechnung.html';
    }
}

// Initialisierung
function init() {
    try {
        showDebugInfo('🚀 Editor wird initialisiert...');
        
        projectData = loadData();
        showDebugInfo('📊 Projektdaten geladen: ' + Object.keys(projectData).length + ' Eigenschaften');
        showDebugInfo('📋 Verfügbare Keys: ' + Object.keys(projectData).join(', '));
        
        if (!projectData || typeof projectData !== 'object') {
            showDebugInfo('❌ Projektdaten sind ungültig!');
            alert('Keine gültigen Projektdaten gefunden! Bitte starten Sie von Schritt 1.');
            window.location.href = 'profil.html';
            return;
        }
        
        if (!projectData.profile) {
            showDebugInfo('❌ Keine Profil-Daten in projectData gefunden!');
            showDebugInfo('🔍 Verfügbare Daten: ' + Object.keys(projectData).join(', '));
            alert('Keine Profil-Daten gefunden! Bitte kehren Sie zu Schritt 1 zurück.');
            window.location.href = 'profil.html';
            return;
        }
        
        showDebugInfo('✅ Profil-Daten gefunden: ' + projectData.profile.profilname);
        
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
        
        if (!projectData.roofShape) {
            projectData.roofShape = {
                baseShape: 'viereck',
                variant: 'rechteck'
            };
        }
        
        generateInputFields();
        updateGeometry();
        
        // Wasserlauf-Anzeige setzen
        const leftFlow = document.getElementById('water-flow-left');
        const rightFlow = document.getElementById('water-flow-right');
        const waterBtn = document.getElementById('btn-water-flow');
        
        if (waterFlowDirection === 'side') {
            if (leftFlow) leftFlow.style.display = 'none';
            if (rightFlow) rightFlow.style.display = 'none';
            if (waterBtn) waterBtn.classList.add('active');
        } else {
            if (leftFlow) leftFlow.style.display = 'flex';
            if (rightFlow) rightFlow.style.display = 'flex';
            if (waterBtn) waterBtn.classList.remove('active');
        }
        
        setupEventHandlers();
        
        showDebugInfo('✅ Editor erfolgreich initialisiert');
        
    } catch (error) {
        showDebugInfo('❌ Fehler bei der Initialisierung: ' + error.message);
        alert('Fehler beim Laden des Editors: ' + error.message);
    }
}

// Event Listeners für das Laden
document.addEventListener('DOMContentLoaded', function() {
    showDebugInfo('🔄 DOMContentLoaded Event ausgelöst');
    init();
});

if (document.readyState === 'loading') {
    showDebugInfo('⏳ Dokument lädt noch, warte auf DOMContentLoaded...');
} else {
    showDebugInfo('⚡ Dokument bereits geladen, starte sofort...');
    setTimeout(function() {
        init();
    }, 100);
}
