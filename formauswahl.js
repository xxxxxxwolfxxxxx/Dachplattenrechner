// formauswahl.js - Einfache Formauswahl und Bemaßung ohne visuelle Darstellung

let projectData = {};
let selectedCategory = null;
let selectedVariant = null;
let currentDimensions = {};

// Form-Definitionen
const formCategories = {
    rund: {
        name: 'Runde Formen',
        variants: {
            kreis: { 
                name: 'Kreis', 
                description: 'Perfekte Rundform',
                dimensions: ['radius']
            },
            oval: { 
                name: 'Oval/Ellipse', 
                description: 'Längliche Rundform',
                dimensions: ['radiusX', 'radiusY']
            },
            halbkreis: { 
                name: 'Halbkreis', 
                description: 'Halbe Kreisform',
                dimensions: ['radius']
            },
            viertelkreis: { 
                name: 'Viertelkreis', 
                description: 'Viertel einer Kreisform',
                dimensions: ['radius']
            },
            langloch: { 
                name: 'Langloch', 
                description: 'Rechteck mit runden Enden',
                dimensions: ['length', 'width']
            }
        }
    },
    eckig: {
        name: 'Eckige Formen',
        variants: {
            rechteck: { 
                name: 'Rechteck', 
                description: 'Klassische rechteckige Form',
                dimensions: ['length', 'width']
            },
            quadrat: { 
                name: 'Quadrat', 
                description: 'Gleichseitiges Rechteck',
                dimensions: ['side']
            },
            dreieck: { 
                name: 'Dreieck', 
                description: 'Dreieckige Grundform',
                dimensions: ['sideA', 'sideB', 'sideC']
            },
            trapez: { 
                name: 'Trapez', 
                description: 'Viereck mit parallelen Seiten',
                dimensions: ['sideA', 'sideB', 'height', 'offset']
            },
            parallelogramm: { 
                name: 'Parallelogramm', 
                description: 'Schiefes Viereck',
                dimensions: ['length', 'width', 'angle']
            },
            rhombus: { 
                name: 'Rhombus', 
                description: 'Rautenform',
                dimensions: ['side', 'angle']
            },
            fuenfeck: { 
                name: 'Fünfeck', 
                description: 'Regelmäßiges Fünfeck',
                dimensions: ['radius']
            },
            sechseck: { 
                name: 'Sechseck', 
                description: 'Regelmäßiges Sechseck',
                dimensions: ['radius']
            },
            achteck: { 
                name: 'Achteck', 
                description: 'Regelmäßiges Achteck',
                dimensions: ['radius']
            }
        }
    },
    komplex: {
        name: 'Komplexe Formen',
        variants: {
            lform: { 
                name: 'L-Form', 
                description: 'L-förmige Grundform',
                dimensions: ['lengthTotal', 'widthTotal', 'cutLength', 'cutWidth']
            },
            tform: { 
                name: 'T-Form', 
                description: 'T-förmige Grundform',
                dimensions: ['topWidth', 'stemWidth', 'topHeight', 'stemHeight']
            },
            uform: { 
                name: 'U-Form', 
                description: 'U-förmige Grundform',
                dimensions: ['outerWidth', 'innerWidth', 'height', 'thickness']
            }
        }
    }
};

// Dimension-Labels und Standardwerte
const dimensionConfig = {
    radius: { label: 'Radius', unit: 'm', default: 4, min: 0.5, max: 50 },
    radiusX: { label: 'Radius X (Länge)', unit: 'm', default: 5, min: 0.5, max: 50 },
    radiusY: { label: 'Radius Y (Breite)', unit: 'm', default: 3, min: 0.5, max: 50 },
    length: { label: 'Länge', unit: 'm', default: 8, min: 1, max: 100 },
    width: { label: 'Breite', unit: 'm', default: 5, min: 1, max: 100 },
    side: { label: 'Seitenlänge', unit: 'm', default: 5, min: 1, max: 50 },
    sideA: { label: 'Basis unten', unit: 'm', default: 8, min: 1, max: 100 },
    sideB: { label: 'Basis oben', unit: 'm', default: 6, min: 1, max: 100 },
    sideC: { label: 'Seite C', unit: 'm', default: 6, min: 1, max: 100 },
    height: { label: 'Höhe', unit: 'm', default: 4, min: 1, max: 50 },
    offset: { label: 'Versatz', unit: 'm', default: 1, min: -10, max: 10 },
    angle: { label: 'Winkel', unit: '°', default: 60, min: 10, max: 170 },
    katheteA: { label: 'Kathete A', unit: 'm', default: 4, min: 1, max: 50 },
    katheteB: { label: 'Kathete B', unit: 'm', default: 5, min: 1, max: 50 },
    lengthTotal: { label: 'Gesamtlänge', unit: 'm', default: 10, min: 2, max: 100 },
    widthTotal: { label: 'Gesamtbreite', unit: 'm', default: 8, min: 2, max: 100 },
    cutLength: { label: 'Ausschnitt Länge', unit: 'm', default: 4, min: 1, max: 50 },
    cutWidth: { label: 'Ausschnitt Breite', unit: 'm', default: 4, min: 1, max: 50 },
    topWidth: { label: 'Breite oben', unit: 'm', default: 8, min: 1, max: 100 },
    stemWidth: { label: 'Breite Stiel', unit: 'm', default: 4, min: 1, max: 50 },
    topHeight: { label: 'Höhe oben', unit: 'm', default: 3, min: 1, max: 50 },
    stemHeight: { label: 'Höhe Stiel', unit: 'm', default: 5, min: 1, max: 50 },
    outerWidth: { label: 'Außenbreite', unit: 'm', default: 10, min: 2, max: 100 },
    innerWidth: { label: 'Innenbreite', unit: 'm', default: 4, min: 1, max: 50 },
    thickness: { label: 'Wandstärke', unit: 'm', default: 3, min: 0.5, max: 20 }
};

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
            console.error('Speichern fehlgeschlagen:', e2);
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
        return saved ? JSON.parse(saved) : {};
    } catch (e) {
        console.error('Laden fehlgeschlagen:', e);
        return {};
    }
}

// Profil-Info anzeigen
function displayProfileInfo() {
    const profile = projectData.profile;
    if (profile) {
        document.getElementById('current-profile-name').textContent = profile.profilname || 'Standard';
        document.getElementById('current-deckbreite').textContent = (profile.deckbreite || 1000) + ' mm';
        document.getElementById('current-lieferbreite').textContent = (profile.lieferbreite || 1050) + ' mm';
        document.getElementById('current-seitenueberlappung').textContent = (profile.seitenueberlappung || 50) + ' mm';
    }
}

// Kategorie auswählen
function selectCategory(category) {
    selectedCategory = category;
    selectedVariant = null;
    
    // Visual feedback
    document.querySelectorAll('.category-tile').forEach(tile => {
        tile.classList.remove('selected');
    });
    document.querySelector(`[data-category="${category}"]`).classList.add('selected');
    
    // Varianten anzeigen
    showVariants(category);
    
    // Selected shape verstecken
    document.getElementById('selected-shape').style.display = 'none';
    document.getElementById('btn-continue').disabled = true;
}

// Varianten anzeigen
function showVariants(category) {
    const variantsSection = document.getElementById('variants-section');
    const variantsGrid = document.getElementById('variants-grid');
    
    variantsGrid.innerHTML = '';
    
    const categoryData = formCategories[category];
    if (!categoryData) return;
    
    Object.entries(categoryData.variants).forEach(([key, variant]) => {
        const card = document.createElement('div');
        card.className = 'variant-card';
        card.dataset.variant = key;
        card.onclick = () => selectVariant(key);
        
        card.innerHTML = `
            <div class="variant-preview">
                ${getVariantIcon(key)}
            </div>
            <div class="variant-name">${variant.name}</div>
            <div class="variant-description">${variant.description}</div>
        `;
        
        variantsGrid.appendChild(card);
    });
    
    variantsSection.style.display = 'block';
}

// Variante auswählen
function selectVariant(variant) {
    selectedVariant = variant;
    
    // Visual feedback
    document.querySelectorAll('.variant-card').forEach(card => {
        card.classList.remove('selected');
    });
    document.querySelector(`[data-variant="${variant}"]`).classList.add('selected');
    
    // Form-Info anzeigen
    showSelectedShape(variant);
    
    // Dimensions erstellen
    createDimensionInputs(variant);
    
    // Berechnung aktualisieren
    updateCalculation();
    
    document.getElementById('btn-continue').disabled = false;
}

// Ausgewählte Form anzeigen
function showSelectedShape(variant) {
    const shapeInfo = getVariantInfo(variant);
    
    document.getElementById('shape-summary-title').textContent = shapeInfo.name;
    document.getElementById('shape-summary-details').textContent = shapeInfo.description;
    document.getElementById('selected-shape').style.display = 'block';
}

// Dimensions-Inputs erstellen
function createDimensionInputs(variant) {
    const dimensionsGrid = document.getElementById('dimensions-grid');
    dimensionsGrid.innerHTML = '';
    
    const variantInfo = getVariantInfo(variant);
    const dimensions = variantInfo.dimensions;
    
    // Gespeicherte Werte laden
    const savedGeometry = projectData.geometry || {};
    
    dimensions.forEach(dim => {
        const config = dimensionConfig[dim];
        if (!config) return;
        
        const savedValue = savedGeometry[dim] || config.default;
        currentDimensions[dim] = savedValue;
        
        const inputContainer = document.createElement('div');
        inputContainer.className = 'dimension-input';
        
        inputContainer.innerHTML = `
            <label class="dimension-label">${config.label}</label>
            <div style="display: flex; align-items: center;">
                <input type="number" 
                       class="dimension-value" 
                       data-dimension="${dim}"
                       value="${savedValue}"
                       min="${config.min}"
                       max="${config.max}"
                       step="0.1">
                <span class="dimension-unit">${config.unit}</span>
            </div>
        `;
        
        dimensionsGrid.appendChild(inputContainer);
        
        // Event listener für Änderungen
        const input = inputContainer.querySelector('.dimension-value');
        input.addEventListener('input', (e) => {
            const value = parseFloat(e.target.value);
            if (!isNaN(value)) {
                currentDimensions[dim] = value;
                updateCalculation();
            }
        });
    });
}

// Berechnung aktualisieren
function updateCalculation() {
    if (!selectedVariant) return;
    
    const area = calculateArea();
    const perimeter = calculatePerimeter();
    
    document.getElementById('calc-area').textContent = area.toFixed(2) + ' m²';
    document.getElementById('calc-perimeter').textContent = perimeter.toFixed(2) + ' m';
    document.getElementById('calculation-preview').style.display = 'block';
}

// Fläche berechnen (vereinfacht)
function calculateArea() {
    const dims = currentDimensions;
    
    switch (selectedVariant) {
        case 'kreis':
            return Math.PI * Math.pow(dims.radius || 4, 2);
        case 'oval':
            return Math.PI * (dims.radiusX || 5) * (dims.radiusY || 3);
        case 'halbkreis':
            return (Math.PI * Math.pow(dims.radius || 4, 2)) / 2;
        case 'viertelkreis':
            return (Math.PI * Math.pow(dims.radius || 4, 2)) / 4;
        case 'langloch':
            const length = dims.length || 6;
            const width = dims.width || 3;
            const radius = width / 2;
            const straightArea = (length - width) * width;
            const circleArea = Math.PI * Math.pow(radius, 2);
            return straightArea + circleArea;
        case 'rechteck':
            return (dims.length || 8) * (dims.width || 5);
        case 'quadrat':
            return Math.pow(dims.side || 5, 2);
        case 'dreieck':
            // Heron's formula vereinfacht
            const a = dims.sideA || 4;
            const b = dims.sideB || 5;
            const c = dims.sideC || 6;
            const s = (a + b + c) / 2;
            return Math.sqrt(s * (s - a) * (s - b) * (s - c));
        case 'trapez':
            const sideA = dims.sideA || 8;
            const sideB = dims.sideB || 6;
            const height = dims.height || 4;
            return ((sideA + sideB) / 2) * height;
        case 'parallelogramm':
            return (dims.length || 8) * (dims.width || 5);
        case 'rhombus':
            const side = dims.side || 5;
            const angle = (dims.angle || 60) * Math.PI / 180;
            return Math.pow(side, 2) * Math.sin(angle);
        case 'fuenfeck':
        case 'sechseck':
        case 'achteck':
            const sides = selectedVariant === 'fuenfeck' ? 5 : (selectedVariant === 'sechseck' ? 6 : 8);
            const radius = dims.radius || 4;
            return 0.5 * sides * Math.pow(radius, 2) * Math.sin(2 * Math.PI / sides);
        case 'lform':
            const totalArea = (dims.lengthTotal || 10) * (dims.widthTotal || 8);
            const cutArea = (dims.cutLength || 4) * (dims.cutWidth || 4);
            return totalArea - cutArea;
        case 'tform':
            const topArea = (dims.topWidth || 8) * (dims.topHeight || 3);
            const stemArea = (dims.stemWidth || 4) * (dims.stemHeight || 5);
            return topArea + stemArea;
        case 'uform':
            const outerArea = (dims.outerWidth || 10) * (dims.height || 6);
            const innerArea = (dims.innerWidth || 4) * ((dims.height || 6) - (dims.thickness || 3));
            return outerArea - innerArea;
        default:
            return 40; // Fallback
    }
}

// Umfang berechnen (vereinfacht)
function calculatePerimeter() {
    const dims = currentDimensions;
    
    switch (selectedVariant) {
        case 'kreis':
            return 2 * Math.PI * (dims.radius || 4);
        case 'oval':
            const a = dims.radiusX || 5;
            const b = dims.radiusY || 3;
            return Math.PI * (3 * (a + b) - Math.sqrt((3 * a + b) * (a + 3 * b)));
        case 'halbkreis':
            return Math.PI * (dims.radius || 4) + 2 * (dims.radius || 4);
        case 'viertelkreis':
            return (Math.PI * (dims.radius || 4)) / 2 + 2 * (dims.radius || 4);
        case 'langloch':
            const length = dims.length || 6;
            const width = dims.width || 3;
            return 2 * length + Math.PI * width;
        case 'rechteck':
            return 2 * ((dims.length || 8) + (dims.width || 5));
        case 'quadrat':
            return 4 * (dims.side || 5);
        case 'dreieck':
            return (dims.sideA || 4) + (dims.sideB || 5) + (dims.sideC || 6);
        case 'rhombus':
            return 4 * (dims.side || 5);
        default:
            return 24; // Fallback
    }
}

// Varianten-Icon bestimmen
function getVariantIcon(variant) {
    const icons = {
        kreis: '⭕',
        oval: '🥚',
        halbkreis: '🌙',
        viertelkreis: '◐',
        langloch: '⬭',
        rechteck: '⬜',
        quadrat: '⬛',
        dreieck: '🔺',
        trapez: '⬡',
        parallelogramm: '▱',
        rhombus: '🔷',
        fuenfeck: '⬟',
        sechseck: '⬢',
        achteck: '⬣',
        lform: '📐',
        tform: '⚹',
        uform: '🔲'
    };
    return `<span style="font-size: 2em;">${icons[variant] || '⬜'}</span>`;
}

// Varianten-Info abrufen
function getVariantInfo(variant) {
    for (const categoryData of Object.values(formCategories)) {
        if (categoryData.variants[variant]) {
            return categoryData.variants[variant];
        }
    }
    return { name: 'Unbekannt', description: '', dimensions: ['length', 'width'] };
}

// Speichern und Weiter
function saveAndContinue() {
    if (!selectedCategory || !selectedVariant) {
        alert('Bitte wählen Sie eine Form aus!');
        return;
    }
    
    // Geometry-Daten zur projectData hinzufügen
    projectData.geometry = {
        category: selectedCategory,
        variant: selectedVariant,
        shapeType: selectedVariant,
        dimensions: currentDimensions,
        dachNeigung: parseFloat(document.getElementById('dach-neigung').value) || 15,
        ausrichtung: document.getElementById('ausrichtung').value || 'laengs',
        area: calculateArea(),
        perimeter: calculatePerimeter(),
        timestamp: Date.now()
    };
    
    console.log('Speichere Geometry-Daten:', projectData.geometry);
    
    const saved = saveData();
    if (!saved) {
        alert('Fehler beim Speichern!');
        return;
    }
    
    // Weiterleitung zum Editor
    window.location.href = 'Editor.html';
}

// Zurück zur Dachform
function goBack() {
    window.location.href = 'dachform.html';
}

// Initialisierung
document.addEventListener('DOMContentLoaded', function() {
    console.log('=== FORMAUSWAHL GELADEN ===');
    
    // Projektdaten laden
    projectData = loadData();
    
    // Profil-Info anzeigen
    displayProfileInfo();
    
    // Validierung: Profil vorhanden?
    if (!projectData.profile) {
        alert('Keine Profil-Daten gefunden. Sie werden zu Schritt 1 weitergeleitet.');
        window.location.href = 'profil.html';
        return;
    }
    
    // Event Listeners für Kategorien
    document.querySelectorAll('.category-tile').forEach(tile => {
        tile.addEventListener('click', () => {
            selectCategory(tile.dataset.category);
        });
    });
    
    // Navigation Event Listeners
    document.getElementById('btn-back').addEventListener('click', goBack);
    document.getElementById('btn-continue').addEventListener('click', saveAndContinue);
    
    // Gespeicherte Auswahl wiederherstellen
    if (projectData.geometry) {
        const geo = projectData.geometry;
        if (geo.category && geo.variant) {
            selectCategory(geo.category);
            setTimeout(() => {
                selectVariant(geo.variant);
                
                // Gespeicherte Dimensionen wiederherstellen
                if (geo.dimensions) {
                    currentDimensions = { ...geo.dimensions };
                    Object.entries(geo.dimensions).forEach(([dim, value]) => {
                        const input = document.querySelector(`[data-dimension="${dim}"]`);
                        if (input) {
                            input.value = value;
                        }
                    });
                    updateCalculation();
                }
                
                // Zusätzliche Einstellungen
                if (geo.dachNeigung) {
                    document.getElementById('dach-neigung').value = geo.dachNeigung;
                }
                if (geo.ausrichtung) {
                    document.getElementById('ausrichtung').value = geo.ausrichtung;
                }
            }, 100);
        }
    }
    
    console.log('✅ Formauswahl initialisiert');
});

// Debug-Funktionen
window.debugFormauswahl = () => {
    console.log('=== FORMAUSWAHL DEBUG ===');
    console.log('projectData:', projectData);
    console.log('selectedCategory:', selectedCategory);
    console.log('selectedVariant:', selectedVariant);
    console.log('currentDimensions:', currentDimensions);
};

console.log('✅ formauswahl.js geladen');
