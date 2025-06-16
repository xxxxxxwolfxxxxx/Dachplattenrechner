// Verbesserte dachform.js mit Debug und korrekter Datenbehandlung

var projectData = {};
var selectedShape = null;
var selectedVariant = null;

// Formen-Definitionen mit SVG-Vorschauen
var shapes = {
    kreis: {
        name: 'Kreis',
        variants: {
            kreis: { name: 'Kreis', svg: '<circle cx="50" cy="50" r="30" fill="rgba(0, 123, 255, 0.3)" stroke="#007bff" stroke-width="2"/>' },
            oval: { name: 'Oval', svg: '<ellipse cx="50" cy="50" rx="35" ry="20" fill="rgba(0, 123, 255, 0.3)" stroke="#007bff" stroke-width="2"/>' },
            halbkreis: { name: 'Halbkreis', svg: '<path d="M 20 50 A 30 30 0 0 1 80 50 Z" fill="rgba(0, 123, 255, 0.3)" stroke="#007bff" stroke-width="2"/>' },
            viertelkreis: { name: 'Viertelkreis', svg: '<path d="M 20 20 L 80 20 A 60 60 0 0 1 20 80 Z" fill="rgba(0, 123, 255, 0.3)" stroke="#007bff" stroke-width="2"/>' },
            langloch: { name: 'Langloch', svg: '<path d="M 35 30 L 65 30 A 20 20 0 0 1 65 70 L 35 70 A 20 20 0 0 1 35 30 Z" fill="rgba(0, 123, 255, 0.3)" stroke="#007bff" stroke-width="2"/>' }
        }
    },
    dreieck: {
        name: 'Dreieck',
        variants: {
            gleichseitig: { name: 'Gleichseitiges Dreieck', svg: '<polygon points="50,20 25,70 75,70" fill="rgba(0, 123, 255, 0.3)" stroke="#007bff" stroke-width="2"/>' },
            rechtwinklig: { name: 'Rechtwinkliges Dreieck', svg: '<polygon points="25,25 75,25 25,75" fill="rgba(0, 123, 255, 0.3)" stroke="#007bff" stroke-width="2"/>' },
            ungleichschenklig: { name: 'Ungleichschenkliges Dreieck', svg: '<polygon points="40,20 20,75 80,70" fill="rgba(0, 123, 255, 0.3)" stroke="#007bff" stroke-width="2"/>' }
        }
    },
    viereck: {
        name: 'Viereck',
        variants: {
            rechteck: { name: 'Rechteck', svg: '<rect x="20" y="30" width="60" height="40" fill="rgba(0, 123, 255, 0.3)" stroke="#007bff" stroke-width="2"/>' },
            quadrat: { name: 'Quadrat', svg: '<rect x="25" y="25" width="50" height="50" fill="rgba(0, 123, 255, 0.3)" stroke="#007bff" stroke-width="2"/>' },
            parallelogramm: { name: 'Parallelogramm', svg: '<polygon points="25,30 75,30 85,70 35,70" fill="rgba(0, 123, 255, 0.3)" stroke="#007bff" stroke-width="2"/>' },
            trapez: { name: 'Trapez', svg: '<polygon points="35,30 65,30 75,70 25,70" fill="rgba(0, 123, 255, 0.3)" stroke="#007bff" stroke-width="2"/>' },
            rhombus: { name: 'Rhombus', svg: '<polygon points="50,20 75,50 50,80 25,50" fill="rgba(0, 123, 255, 0.3)" stroke="#007bff" stroke-width="2"/>' }
        }
    },
    vieleck: {
        name: 'Vieleck',
        variants: {
            fuenfeck: { name: 'Fünfeck', svg: '<polygon points="50,20 70,35 65,60 35,60 30,35" fill="rgba(0, 123, 255, 0.3)" stroke="#007bff" stroke-width="2"/>' },
            sechseck: { name: 'Sechseck', svg: '<polygon points="50,20 70,30 70,50 50,60 30,50 30,30" fill="rgba(0, 123, 255, 0.3)" stroke="#007bff" stroke-width="2"/>' },
            achteck: { name: 'Achteck', svg: '<polygon points="50,20 65,25 75,40 75,60 65,75 50,80 35,75 25,60 25,40 35,25" fill="rgba(0, 123, 255, 0.3)" stroke="#007bff" stroke-width="2"/>' },
            lform: { name: 'L-Form', svg: '<polygon points="25,25 50,25 50,45 75,45 75,75 25,75" fill="rgba(0, 123, 255, 0.3)" stroke="#007bff" stroke-width="2"/>' },
            tform: { name: 'T-Form', svg: '<polygon points="35,25 65,25 65,40 75,40 75,75 25,75 25,40 35,40" fill="rgba(0, 123, 255, 0.3)" stroke="#007bff" stroke-width="2"/>' },
            uform: { name: 'U-Form', svg: '<polygon points="25,25 35,25 35,60 65,60 65,25 75,25 75,75 25,75" fill="rgba(0, 123, 255, 0.3)" stroke="#007bff" stroke-width="2"/>' }
        }
    }
};

// VERBESSERTE Storage-Funktionen mit Debug
function saveData() {
    console.log('=== DACHFORM: SPEICHERE DATEN ===');
    console.log('Zu speichernde projectData:', JSON.stringify(projectData, null, 2));
    
    try {
        localStorage.setItem('dachplattenrechner_data', JSON.stringify(projectData));
        console.log('✅ Erfolgreich in localStorage gespeichert');
        
        // Sofort wieder auslesen zur Verifikation
        const verification = localStorage.getItem('dachplattenrechner_data');
        console.log('🔍 Verifikation - Ausgelesene Daten:', verification);
        
        return true;
    } catch (e) {
        console.log('❌ localStorage fehlgeschlagen, verwende sessionStorage:', e);
        try {
            sessionStorage.setItem('dachplattenrechner_data', JSON.stringify(projectData));
            console.log('✅ Erfolgreich in sessionStorage gespeichert');
            return true;
        } catch (e2) {
            console.error('❌ Beide Storage-Methoden fehlgeschlagen:', e2);
            return false;
        }
    }
}

function loadData() {
    console.log('=== DACHFORM: LADE DATEN ===');
    
    try {
        let saved = localStorage.getItem('dachplattenrechner_data');
        console.log('📖 localStorage Inhalt:', saved);
        
        if (!saved) {
            saved = sessionStorage.getItem('dachplattenrechner_data');
            console.log('📖 sessionStorage Inhalt:', saved);
        }
        
        if (saved) {
            const parsed = JSON.parse(saved);
            console.log('✅ Erfolgreich geparst:', parsed);
            return parsed;
        } else {
            console.log('ℹ️ Keine gespeicherten Daten gefunden');
            return {};
        }
    } catch (e) {
        console.error('❌ Fehler beim Laden der Daten:', e);
        return {};
    }
}

// Profil-Info anzeigen
function displayProfileInfo() {
    console.log('=== ZEIGE PROFIL-INFO ===');
    
    const profile = projectData.profile;
    const summaryElement = document.getElementById('profile-summary');
    
    console.log('Profil-Daten:', profile);
    console.log('Summary-Element:', summaryElement);
    
    if (profile && summaryElement) {
        document.getElementById('summary-profile-name').textContent = profile.profilname || 'Standard';
        document.getElementById('summary-deckbreite').textContent = (profile.deckbreite || 1000) + ' mm';
        document.getElementById('summary-lieferbreite').textContent = (profile.lieferbreite || 1050) + ' mm';
        document.getElementById('summary-seitenueberlappung').textContent = (profile.seitenueberlappung || 50) + ' mm';
        summaryElement.style.display = 'block';
        
        console.log('✅ Profil-Info erfolgreich angezeigt');
    } else {
        console.log('❌ Keine Profil-Daten oder Summary-Element nicht gefunden');
        
        if (!profile) {
            console.log('⚠️ KEINE PROFIL-DATEN! Umleitung zu Profil-Seite');
            alert('Keine Profil-Daten gefunden. Sie werden zu Schritt 1 weitergeleitet.');
            window.location.href = 'profil.html';
            return;
        }
    }
}

// Shape Selection
function selectShape(shape) {
    selectedShape = shape;
    
    console.log('=== SHAPE AUSGEWÄHLT ===');
    console.log('Shape:', shape);
    
    // Visual feedback
    document.querySelectorAll('.shape-tile').forEach(tile => tile.classList.remove('selected'));
    const shapeElement = document.querySelector(`[data-shape="${shape}"]`);
    if (shapeElement) {
        shapeElement.classList.add('selected');
    }
    
    showVariants(shape);
}

function showVariants(shape) {
    console.log('=== ZEIGE VARIANTEN ===');
    console.log('Für Shape:', shape);
    
    var variantsGrid = document.getElementById('variants-grid');
    variantsGrid.innerHTML = '';
    
    if (!shapes[shape]) {
        console.error('Shape nicht gefunden:', shape);
        return;
    }
    
    Object.entries(shapes[shape].variants).forEach(([key, variant]) => {
        var tile = document.createElement('div');
        tile.className = 'variant-tile';
        tile.onclick = () => selectVariant(key, variant.name);
        tile.innerHTML = `
            <div class="variant-preview">
                <svg width="100" height="100" viewBox="0 0 100 100">
                    ${variant.svg}
                </svg>
            </div>
            <h4>${variant.name}</h4>
        `;
        variantsGrid.appendChild(tile);
    });
    
    document.getElementById('shape-variants').style.display = 'block';
    document.getElementById('selected-shape').style.display = 'none';
    
    console.log(`✅ ${Object.keys(shapes[shape].variants).length} Varianten angezeigt`);
}

function selectVariant(variant, name) {
    selectedVariant = variant;
    
    console.log('=== VARIANTE AUSGEWÄHLT ===');
    console.log('Variante:', variant);
    console.log('Name:', name);
    
    // Visual feedback
    document.querySelectorAll('.variant-tile').forEach(tile => tile.classList.remove('selected'));
    event.target.closest('.variant-tile').classList.add('selected');
    
    document.getElementById('selected-shape-name').textContent = name;
    document.getElementById('shape-variants').style.display = 'none';
    document.getElementById('selected-shape').style.display = 'block';
    document.getElementById('continue-btn').disabled = false;
    
    console.log('✅ Variante ausgewählt und UI aktualisiert');
}

function saveAndContinue() {
    console.log('=== DACHFORM: SPEICHERN UND WEITER ===');
    console.log('Aktuelle projectData vor Änderung:', JSON.stringify(projectData, null, 2));
    console.log('selectedShape:', selectedShape);
    console.log('selectedVariant:', selectedVariant);
    
    // KRITISCHE VALIDIERUNG
    if (!projectData.profile) {
        console.error('❌ PROFIL-DATEN FEHLEN!');
        alert('Profil-Daten fehlen! Bitte kehren Sie zu Schritt 1 zurück.');
        window.location.href = 'profil.html';
        return;
    }
    
    if (!selectedShape || !selectedVariant) {
        console.error('❌ KEINE FORM AUSGEWÄHLT!');
        alert('Bitte wählen Sie eine Form und Variante aus!');
        return;
    }
    
    // NUR roofShape hinzufügen, OHNE andere Daten zu überschreiben!
    console.log('✅ Profil-Daten vorhanden, füge roofShape hinzu...');
    
    projectData.roofShape = {
        baseShape: selectedShape,
        variant: selectedVariant,
        points: getDefaultPoints(),
        timestamp: Date.now() // Für Debugging
    };
    
    console.log('Neue projectData mit roofShape:', JSON.stringify(projectData, null, 2));
    
    const saved = saveData();
    if (!saved) {
        console.error('❌ SPEICHERN FEHLGESCHLAGEN!');
        alert('Fehler beim Speichern! Bitte versuchen Sie es erneut.');
        return;
    }
    
    console.log('✅ Erfolgreich gespeichert, weiterleiten zu Editor.html');
    
    // Kleine Verzögerung um sicherzustellen, dass gespeichert wurde
    setTimeout(() => {
        window.location.href = 'Editor.html';
    }, 100);
}

function getDefaultPoints() {
    console.log('=== GENERIERE PUNKTE ===');
    console.log('Für:', selectedShape, selectedVariant);
    
    if (selectedShape === 'kreis') {
        return getCirclePoints();
    } else if (selectedShape === 'dreieck') {
        return getTrianglePoints();
    } else if (selectedShape === 'viereck') {
        return getRectanglePoints();
    } else if (selectedShape === 'vieleck') {
        return getPolygonPoints();
    }
    
    // Fallback
    console.log('Verwende Fallback-Punkte');
    return [
        { x: 0, y: 0 }, { x: 10, y: 0 }, 
        { x: 10, y: 6 }, { x: 0, y: 6 }
    ];
}

// Kreis-Punkte generieren
function getCirclePoints() {
    switch(selectedVariant) {
        case 'kreis':
            // Kreis mit 12 Punkten approximieren
            const points = [];
            const radius = 5;
            const centerX = 5;
            const centerY = 4;
            for (let i = 0; i < 12; i++) {
                const angle = (i * 2 * Math.PI) / 12;
                points.push({
                    x: centerX + radius * Math.cos(angle),
                    y: centerY + radius * Math.sin(angle)
                });
            }
            return points;
            
        case 'oval':
            // Oval mit 12 Punkten
            const ovalPoints = [];
            const radiusX = 6;
            const radiusY = 3;
            const centerOvalX = 5;
            const centerOvalY = 4;
            for (let i = 0; i < 12; i++) {
                const angle = (i * 2 * Math.PI) / 12;
                ovalPoints.push({
                    x: centerOvalX + radiusX * Math.cos(angle),
                    y: centerOvalY + radiusY * Math.sin(angle)
                });
            }
            return ovalPoints;
            
        case 'halbkreis':
            // Halbkreis mit gerade Linie unten
            const halfPoints = [];
            const halfRadius = 5;
            const halfCenterX = 5;
            const halfCenterY = 5;
            // Oberer Halbkreis (von 0° bis 180°)
            for (let i = 0; i <= 6; i++) {
                const angle = (i * Math.PI) / 6;
                halfPoints.push({
                    x: halfCenterX + halfRadius * Math.cos(angle),
                    y: halfCenterY - halfRadius * Math.sin(angle)
                });
            }
            return halfPoints;
            
        case 'viertelkreis':
            return [
                { x: 0, y: 0 }, { x: 6, y: 0 }, { x: 8, y: 1 },
                { x: 9, y: 3 }, { x: 9, y: 5 }, { x: 8, y: 7 },
                { x: 6, y: 8 }, { x: 3, y: 9 }, { x: 0, y: 9 }
            ];
            
        case 'langloch':
            return [
                { x: 2, y: 1 }, { x: 8, y: 1 }, { x: 9, y: 2 },
                { x: 9, y: 6 }, { x: 8, y: 7 }, { x: 2, y: 7 },
                { x: 1, y: 6 }, { x: 1, y: 2 }
            ];
            
        default:
            // Standard Kreis
            const defaultPoints = [];
            const defaultRadius = 5;
            for (let i = 0; i < 8; i++) {
                const angle = (i * 2 * Math.PI) / 8;
                defaultPoints.push({
                    x: 5 + defaultRadius * Math.cos(angle),
                    y: 4 + defaultRadius * Math.sin(angle)
                });
            }
            return defaultPoints;
    }
}

function getTrianglePoints() {
    // Je nach Variante unterschiedliche Dreiecke
    switch(selectedVariant) {
        case 'gleichseitig':
            return [
                { x: 5, y: 8 },      // Spitze oben mittig
                { x: 0, y: 0 },      // Links unten
                { x: 10, y: 0 }      // Rechts unten
            ];
        case 'rechtwinklig':
            return [
                { x: 0, y: 0 },      // Links unten (rechter Winkel)
                { x: 10, y: 0 },     // Rechts unten
                { x: 0, y: 8 }       // Links oben
            ];
        case 'ungleichschenklig':
            return [
                { x: 3, y: 8 },      // Spitze oben (versetzt)
                { x: 0, y: 0 },      // Links unten
                { x: 10, y: 0 }      // Rechts unten
            ];
        default:
            return [
                { x: 5, y: 8 },
                { x: 0, y: 0 },
                { x: 10, y: 0 }
            ];
    }
}

function getRectanglePoints() {
    // Je nach Variante unterschiedliche Vierecke
    switch(selectedVariant) {
        case 'quadrat':
            return [
                { x: 0, y: 0 }, { x: 8, y: 0 }, 
                { x: 8, y: 8 }, { x: 0, y: 8 }
            ];
        case 'parallelogramm':
            return [
                { x: 0, y: 0 }, { x: 10, y: 0 }, 
                { x: 12, y: 6 }, { x: 2, y: 6 }
            ];
        case 'trapez':
            return [
                { x: 1, y: 0 }, { x: 9, y: 0 }, 
                { x: 8, y: 6 }, { x: 2, y: 6 }
            ];
        case 'rhombus':
            return [
                { x: 5, y: 0 }, { x: 10, y: 4 }, 
                { x: 5, y: 8 }, { x: 0, y: 4 }
            ];
        default: // rechteck
            return [
                { x: 0, y: 0 }, { x: 10, y: 0 }, 
                { x: 10, y: 6 }, { x: 0, y: 6 }
            ];
    }
}

function getPolygonPoints() {
    // Je nach Variante unterschiedliche Vielecke
    switch(selectedVariant) {
        case 'fuenfeck':
            return [
                { x: 5, y: 8 }, { x: 9, y: 6 }, { x: 8, y: 1 }, 
                { x: 2, y: 1 }, { x: 1, y: 6 }
            ];
        case 'sechseck':
            return [
                { x: 5, y: 8 }, { x: 9, y: 6 }, { x: 9, y: 2 }, 
                { x: 5, y: 0 }, { x: 1, y: 2 }, { x: 1, y: 6 }
            ];
        case 'achteck':
            return [
                { x: 5, y: 8 }, { x: 7, y: 7 }, { x: 8, y: 5 }, { x: 8, y: 3 },
                { x: 7, y: 1 }, { x: 5, y: 0 }, { x: 3, y: 1 }, { x: 2, y: 3 },
                { x: 2, y: 5 }, { x: 3, y: 7 }
            ];
        case 'lform':
            return [
                { x: 0, y: 0 }, { x: 6, y: 0 }, { x: 6, y: 4 },
                { x: 10, y: 4 }, { x: 10, y: 8 }, { x: 0, y: 8 }
            ];
        case 'tform':
            return [
                { x: 3, y: 0 }, { x: 7, y: 0 }, { x: 7, y: 3 },
                { x: 10, y: 3 }, { x: 10, y: 8 }, { x: 0, y: 8 },
                { x: 0, y: 3 }, { x: 3, y: 3 }
            ];
        case 'uform':
            return [
                { x: 0, y: 0 }, { x: 3, y: 0 }, { x: 3, y: 6 },
                { x: 7, y: 6 }, { x: 7, y: 0 }, { x: 10, y: 0 },
                { x: 10, y: 8 }, { x: 0, y: 8 }
            ];
        default:
            return [
                { x: 5, y: 8 }, { x: 9, y: 6 }, { x: 8, y: 1 }, 
                { x: 2, y: 1 }, { x: 1, y: 6 }
            ];
    }
}

function goBack() {
    console.log('Zurück zu profil.html');
    window.location.href = 'profil.html';
}

// Event Setup
document.addEventListener('DOMContentLoaded', function() {
    console.log('=== DACHFORM-SEITE GELADEN ===');
    
    // Projektdaten laden
    projectData = loadData();
    console.log('Geladene Projektdaten:', projectData);
    
    // KRITISCHE VALIDIERUNG
    if (!projectData.profile) {
        console.error('❌ KEINE PROFIL-DATEN GEFUNDEN!');
        alert('Keine Profil-Daten gefunden. Sie werden zu Schritt 1 weitergeleitet.');
        window.location.href = 'profil.html';
        return;
    }
    
    // Profil-Info anzeigen
    displayProfileInfo();
    
    // Event Listeners für Shape-Tiles
    document.querySelectorAll('.shape-tile').forEach(tile => {
        tile.addEventListener('click', () => {
            selectShape(tile.dataset.shape);
        });
    });
    
    console.log('✅ Dachform-Seite erfolgreich initialisiert');
});

// Debug-Funktionen global verfügbar machen
window.debugDachformData = () => {
    console.log('=== DACHFORM DEBUG ===');
    console.log('projectData:', projectData);
    console.log('selectedShape:', selectedShape);
    console.log('selectedVariant:', selectedVariant);
    console.log('localStorage:', localStorage.getItem('dachplattenrechner_data'));
    console.log('sessionStorage:', sessionStorage.getItem('dachplattenrechner_data'));
};
