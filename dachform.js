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

// Storage
function saveData() {
    try {
        localStorage.setItem('dachplattenrechner_data', JSON.stringify(projectData));
        return true;
    } catch (e) {
        sessionStorage.setItem('dachplattenrechner_data', JSON.stringify(projectData));
        return true;
    }
}

function loadData() {
    try {
        var saved = localStorage.getItem('dachplattenrechner_data') || sessionStorage.getItem('dachplattenrechner_data');
        return saved ? JSON.parse(saved) : {};
    } catch (e) {
        return {};
    }
}

// Profil-Info anzeigen
function displayProfileInfo() {
    const profile = projectData.profile;
    const summaryElement = document.getElementById('profile-summary');
    
    if (profile && summaryElement) {
        document.getElementById('summary-profile-name').textContent = profile.profilname || 'Standard';
        document.getElementById('summary-deckbreite').textContent = (profile.deckbreite || 1000) + ' mm';
        document.getElementById('summary-lieferbreite').textContent = (profile.lieferbreite || 1050) + ' mm';
        document.getElementById('summary-seitenueberlappung').textContent = (profile.seitenueberlappung || 50) + ' mm';
        summaryElement.style.display = 'block';
    }
}

// Shape Selection
function selectShape(shape) {
    selectedShape = shape;
    
    // Visual feedback
    document.querySelectorAll('.shape-tile').forEach(tile => tile.classList.remove('selected'));
    document.querySelector(`[data-shape="${shape}"]`).classList.add('selected');
    
    showVariants(shape);
}

function showVariants(shape) {
    var variantsGrid = document.getElementById('variants-grid');
    variantsGrid.innerHTML = '';
    
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
}

function selectVariant(variant, name) {
    selectedVariant = variant;
    
    // Visual feedback
    document.querySelectorAll('.variant-tile').forEach(tile => tile.classList.remove('selected'));
    event.target.closest('.variant-tile').classList.add('selected');
    
    document.getElementById('selected-shape-name').textContent = name;
    document.getElementById('shape-variants').style.display = 'none';
    document.getElementById('selected-shape').style.display = 'block';
    document.getElementById('continue-btn').disabled = false;
}

function saveAndContinue() {
    // WICHTIG: Profil-Daten BEIBEHALTEN!
    if (!projectData.profile) {
        alert('Profil-Daten fehlen! Bitte kehren Sie zu Schritt 1 zurück.');
        window.location.href = 'profil.html';
        return;
    }
    
    // Nur roofShape hinzufügen, ohne andere Daten zu überschreiben
    projectData.roofShape = {
        baseShape: selectedShape,
        variant: selectedVariant,
        points: getDefaultPoints()
    };
    
    console.log('Speichere Projektdaten vor Weiterleitung:', projectData);
    
    saveData();
    
    // KORRIGIERT: Weiterleitung zur richtigen Editor-Datei
    window.location.href = 'Editor.html';
}

function getDefaultPoints() {
    // Einfache Standard-Punkte für jede Form
    var defaults = {
        'kreis': [
            { x: 5, y: 0 }, { x: 3.54, y: 3.54 }, { x: 0, y: 5 }, 
            { x: -3.54, y: 3.54 }, { x: -5, y: 0 }, { x: -3.54, y: -3.54 }, 
            { x: 0, y: -5 }, { x: 3.54, y: -3.54 }
        ],
        'dreieck': getTrianglePoints(),
        'viereck': getRectanglePoints(),
        'vieleck': getPolygonPoints()
    };
    return defaults[selectedShape] || defaults['viereck'];
}

function getTrianglePoints() {
    // Je nach Variante unterschiedliche Dreiecke
    switch(selectedVariant) {
        case 'gleichseitig':
            return [
                { x: 0, y: 8 },      // Spitze oben mittig
                { x: -5, y: 0 },     // Links unten
                { x: 5, y: 0 }       // Rechts unten
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
                { x: -2, y: 0 },     // Links unten
                { x: 8, y: 0 }       // Rechts unten
            ];
        default:
            return [
                { x: 0, y: 8 },
                { x: -5, y: 0 },
                { x: 5, y: 0 }
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
    window.location.href = 'profil.html';
}

// Event Setup
document.addEventListener('DOMContentLoaded', function() {
    projectData = loadData();
    
    console.log('Dachform-Seite geladen, Projektdaten:', projectData);
    
    // Profil-Info anzeigen falls vorhanden
    displayProfileInfo();
    
    document.querySelectorAll('.shape-tile').forEach(tile => {
        tile.addEventListener('click', () => {
            selectShape(tile.dataset.shape);
        });
    });
});
