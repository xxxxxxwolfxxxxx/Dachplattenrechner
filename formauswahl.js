// formauswahl.js - Bemaßung ohne Variablen-Konflikte

(function() {
    'use strict';
    
    // Lokale Variablen (kein Konflikt mit anderen Skripten)
    var currentProjectData = {};
    var currentDimensions = {};
    var selectedVariant = null;

    // Dimension-Labels und Standardwerte
    var dimensionConfig = {
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

    // Form-Informationen
    var shapeInfo = {
        kreis: { name: 'Kreis', description: 'Perfekte Rundform', dimensions: ['radius'] },
        oval: { name: 'Oval/Ellipse', description: 'Längliche Rundform', dimensions: ['radiusX', 'radiusY'] },
        halbkreis: { name: 'Halbkreis', description: 'Halbe Kreisform', dimensions: ['radius'] },
        viertelkreis: { name: 'Viertelkreis', description: 'Viertel einer Kreisform', dimensions: ['radius'] },
        langloch: { name: 'Langloch', description: 'Rechteck mit runden Enden', dimensions: ['length', 'width'] },
        rechteck: { name: 'Rechteck', description: 'Klassische rechteckige Form', dimensions: ['length', 'width'] },
        quadrat: { name: 'Quadrat', description: 'Gleichseitiges Rechteck', dimensions: ['side'] },
        gleichseitig: { name: 'Gleichseitiges Dreieck', description: 'Dreieck mit gleichen Seiten', dimensions: ['side'] },
        rechtwinklig: { name: 'Rechtwinkliges Dreieck', description: 'Dreieck mit rechtem Winkel', dimensions: ['katheteA', 'katheteB'] },
        ungleichschenklig: { name: 'Ungleichschenkliges Dreieck', description: 'Dreieck mit unterschiedlichen Seiten', dimensions: ['sideA', 'sideB', 'sideC'] },
        trapez: { name: 'Trapez', description: 'Viereck mit parallelen Seiten', dimensions: ['sideA', 'sideB', 'height', 'offset'] },
        parallelogramm: { name: 'Parallelogramm', description: 'Schiefes Viereck', dimensions: ['length', 'width', 'angle'] },
        rhombus: { name: 'Rhombus', description: 'Rautenform', dimensions: ['side', 'angle'] },
        fuenfeck: { name: 'Fünfeck', description: 'Regelmäßiges Fünfeck', dimensions: ['radius'] },
        sechseck: { name: 'Sechseck', description: 'Regelmäßiges Sechseck', dimensions: ['radius'] },
        achteck: { name: 'Achteck', description: 'Regelmäßiges Achteck', dimensions: ['radius'] },
        lform: { name: 'L-Form', description: 'L-förmige Grundform', dimensions: ['lengthTotal', 'widthTotal', 'cutLength', 'cutWidth'] },
        tform: { name: 'T-Form', description: 'T-förmige Grundform', dimensions: ['topWidth', 'stemWidth', 'topHeight', 'stemHeight'] },
        uform: { name: 'U-Form', description: 'U-förmige Grundform', dimensions: ['outerWidth', 'innerWidth', 'height', 'thickness'] }
    };

    // Storage-Funktionen
    function saveData() {
        try {
            localStorage.setItem('dachplattenrechner_data', JSON.stringify(currentProjectData));
            return true;
        } catch (e) {
            try {
                sessionStorage.setItem('dachplattenrechner_data', JSON.stringify(currentProjectData));
                return true;
            } catch (e2) {
                console.error('Speichern fehlgeschlagen:', e2);
                return false;
            }
        }
    }

    function loadData() {
        try {
            var saved = localStorage.getItem('dachplattenrechner_data');
            if (!saved) {
                saved = sessionStorage.getItem('dachplattenrechner_data');
            }
            return saved ? JSON.parse(saved) : {};
        } catch (e) {
            console.error('Laden fehlgeschlagen:', e);
            return {};
        }
    }

    // Form-Info anzeigen
    function displayShapeInfo() {
        console.log('=== LADE FORM-INFO ===');
        console.log('currentProjectData:', currentProjectData);
        
        var roofShape = currentProjectData.roofShape;
        console.log('roofShape:', roofShape);
        
        if (!roofShape) {
            console.error('❌ Kein roofShape gefunden!');
            alert('Keine Dachform gewählt. Sie werden zu Schritt 2 weitergeleitet.');
            window.location.href = 'dachform.html';
            return false;
        }
        
        if (!roofShape.variant) {
            console.error('❌ Keine variant in roofShape gefunden!');
            console.log('Verfügbare roofShape keys:', Object.keys(roofShape));
            alert('Keine Dachform-Variante gewählt. Sie werden zu Schritt 2 weitergeleitet.');
            window.location.href = 'dachform.html';
            return false;
        }
        
        selectedVariant = roofShape.variant;
        console.log('✅ Gewählte Variante:', selectedVariant);
        
        var info = shapeInfo[selectedVariant];
        console.log('Shape Info für', selectedVariant, ':', info);
        
        if (info) {
            document.getElementById('shape-title').textContent = info.name;
            document.getElementById('shape-description').textContent = info.description;
            console.log('✅ Form-Info angezeigt:', info.name);
        } else {
            console.error('❌ Form-Info nicht gefunden für:', selectedVariant);
            console.log('Verfügbare shapeInfo keys:', Object.keys(shapeInfo));
            // Fallback
            document.getElementById('shape-title').textContent = selectedVariant;
            document.getElementById('shape-description').textContent = 'Benutzerdefinierte Form';
        }
        
        return true;
    }

    // Dimensions-Inputs erstellen
    function createDimensionInputs() {
        console.log('=== ERSTELLE DIMENSION-INPUTS ===');
        
        var dimensionsGrid = document.getElementById('dimensions-grid');
        if (!dimensionsGrid) {
            console.error('❌ dimensions-grid nicht gefunden!');
            return;
        }
        
        dimensionsGrid.innerHTML = '';
        
        if (!selectedVariant) {
            console.error('❌ Keine Variante ausgewählt');
            return;
        }
        
        var info = shapeInfo[selectedVariant];
        if (!info) {
            console.error('❌ Form-Info nicht gefunden für:', selectedVariant);
            return;
        }
        
        var dimensions = info.dimensions;
        console.log('📐 Erstelle Inputs für Dimensionen:', dimensions);
        
        // Gespeicherte Werte laden
        var savedGeometry = currentProjectData.geometry || {};
        
        dimensions.forEach(function(dim) {
            var config = dimensionConfig[dim];
            if (!config) {
                console.warn('⚠️ Dimension-Config nicht gefunden für:', dim);
                return;
            }
            
            var savedValue = savedGeometry[dim] || config.default;
            currentDimensions[dim] = savedValue;
            
            var inputContainer = document.createElement('div');
            inputContainer.className = 'dimension-input';
            
            inputContainer.innerHTML = 
                '<label class="dimension-label">' + config.label + '</label>' +
                '<div style="display: flex; align-items: center;">' +
                    '<input type="number" ' +
                           'class="dimension-value" ' +
                           'data-dimension="' + dim + '"' +
                           'value="' + savedValue + '"' +
                           'min="' + config.min + '"' +
                           'max="' + config.max + '"' +
                           'step="0.1">' +
                    '<span class="dimension-unit">' + config.unit + '</span>' +
                '</div>';
            
            dimensionsGrid.appendChild(inputContainer);
            
            // Event listener für Änderungen
            var input = inputContainer.querySelector('.dimension-value');
            input.addEventListener('input', function(e) {
                var value = parseFloat(e.target.value);
                if (!isNaN(value)) {
                    currentDimensions[dim] = value;
                    updatePreview();
                    updateCalculation();
                }
            });
        });
        
        console.log('✅ Dimension-Inputs erstellt:', dimensions.length, 'Inputs');
    }

    // Form-Vorschau aktualisieren
    function updatePreview() {
        var shapeGroup = document.getElementById('shape-group');
        if (!shapeGroup) return;
        
        shapeGroup.innerHTML = '';
        
        var svg = getShapeSVG();
        shapeGroup.innerHTML = svg;
    }

    // SVG für Form generieren
    function getShapeSVG() {
        var dims = currentDimensions;
        
        switch (selectedVariant) {
            case 'kreis':
                var radius = (dims.radius || 4) * 15;
                return '<circle cx="0" cy="0" r="' + radius + '" fill="rgba(0,123,255,0.3)" stroke="#007bff" stroke-width="3"/>';
                
            case 'oval':
                var rx = (dims.radiusX || 5) * 15;
                var ry = (dims.radiusY || 3) * 15;
                return '<ellipse cx="0" cy="0" rx="' + rx + '" ry="' + ry + '" fill="rgba(0,123,255,0.3)" stroke="#007bff" stroke-width="3"/>';
                
            case 'rechteck':
                var length = (dims.length || 8) * 10;
                var width = (dims.width || 5) * 10;
                return '<rect x="' + (-length/2) + '" y="' + (-width/2) + '" width="' + length + '" height="' + width + '" fill="rgba(0,123,255,0.3)" stroke="#007bff" stroke-width="3"/>';
                
            case 'quadrat':
                var side = (dims.side || 5) * 12;
                return '<rect x="' + (-side/2) + '" y="' + (-side/2) + '" width="' + side + '" height="' + side + '" fill="rgba(0,123,255,0.3)" stroke="#007bff" stroke-width="3"/>';
                
            case 'trapez':
                var sideA = (dims.sideA || 8) * 8;
                var sideB = (dims.sideB || 6) * 8;
                var height = (dims.height || 4) * 8;
                var offset = (dims.offset || 1) * 8;
                var points = (-sideA/2) + ',' + (height/2) + ' ' + (sideA/2) + ',' + (height/2) + ' ' + (sideB/2 + offset) + ',' + (-height/2) + ' ' + (-sideB/2 + offset) + ',' + (-height/2);
                return '<polygon points="' + points + '" fill="rgba(0,123,255,0.3)" stroke="#007bff" stroke-width="3"/>';
                
            case 'rhombus':
                var rhombusSide = (dims.side || 5) * 10;
                var angle = (dims.angle || 60) * Math.PI / 180;
                var halfDiag1 = rhombusSide * Math.sin(angle / 2);
                var halfDiag2 = rhombusSide * Math.cos(angle / 2);
                var rhombusPoints = '0,' + (-halfDiag1) + ' ' + halfDiag2 + ',0 0,' + halfDiag1 + ' ' + (-halfDiag2) + ',0';
                return '<polygon points="' + rhombusPoints + '" fill="rgba(0,123,255,0.3)" stroke="#007bff" stroke-width="3"/>';
                
            default:
                console.log('⚠️ Unbekannte Form, verwende Rechteck:', selectedVariant);
                return '<rect x="-60" y="-40" width="120" height="80" fill="rgba(0,123,255,0.3)" stroke="#007bff" stroke-width="3"/>';
        }
    }

    // Berechnung aktualisieren
    function updateCalculation() {
        if (!selectedVariant) return;
        
        var area = calculateArea();
        var perimeter = calculatePerimeter();
        
        document.getElementById('calc-area').textContent = area.toFixed(2) + ' m²';
        document.getElementById('calc-perimeter').textContent = perimeter.toFixed(2) + ' m';
        
        var continueBtn = document.getElementById('btn-continue');
        if (continueBtn) {
            continueBtn.disabled = area <= 0;
        }
    }

    // Fläche berechnen
    function calculateArea() {
        var dims = currentDimensions;
        
        switch (selectedVariant) {
            case 'kreis':
                return Math.PI * Math.pow(dims.radius || 4, 2);
            case 'oval':
                return Math.PI * (dims.radiusX || 5) * (dims.radiusY || 3);
            case 'rechteck':
                return (dims.length || 8) * (dims.width || 5);
            case 'quadrat':
                return Math.pow(dims.side || 5, 2);
            case 'trapez':
                var sideA = dims.sideA || 8;
                var sideB = dims.sideB || 6;
                var height = dims.height || 4;
                return ((sideA + sideB) / 2) * height;
            case 'rhombus':
                var side = dims.side || 5;
                var angle = (dims.angle || 60) * Math.PI / 180;
                return Math.pow(side, 2) * Math.sin(angle);
            default:
                return 40;
        }
    }

    // Umfang berechnen
    function calculatePerimeter() {
        var dims = currentDimensions;
        
        switch (selectedVariant) {
            case 'kreis':
                return 2 * Math.PI * (dims.radius || 4);
            case 'oval':
                var a = dims.radiusX || 5;
                var b = dims.radiusY || 3;
                return Math.PI * (3 * (a + b) - Math.sqrt((3 * a + b) * (a + 3 * b)));
            case 'rechteck':
                return 2 * ((dims.length || 8) + (dims.width || 5));
            case 'quadrat':
                return 4 * (dims.side || 5);
            case 'rhombus':
                return 4 * (dims.side || 5);
            default:
                return 24;
        }
    }

    // Speichern und Weiter
    function saveAndContinue() {
        if (!selectedVariant) {
            alert('Keine Form gefunden!');
            return;
        }
        
        currentProjectData.geometry = {
            variant: selectedVariant,
            shapeType: selectedVariant,
            dimensions: currentDimensions,
            dachNeigung: 15,
            ausrichtung: 'laengs',
            area: calculateArea(),
            perimeter: calculatePerimeter(),
            timestamp: Date.now()
        };
        
        console.log('💾 Speichere Geometry-Daten:', currentProjectData.geometry);
        
        var saved = saveData();
        if (!saved) {
            alert('Fehler beim Speichern!');
            return;
        }
        
        window.location.href = 'Editor.html';
    }

    // Navigation
    function goBack() {
        window.location.href = 'dachform.html';
    }

    // Globale Funktionen für HTML verfügbar machen
    window.saveAndContinue = saveAndContinue;
    window.goBack = goBack;

    // Initialisierung
    document.addEventListener('DOMContentLoaded', function() {
        console.log('=== BEMASUNG SEITE GELADEN ===');
        
        currentProjectData = loadData();
        console.log('📁 Geladene currentProjectData:', currentProjectData);
        
        if (!currentProjectData.profile) {
            console.error('❌ Keine Profil-Daten gefunden!');
            alert('Keine Profil-Daten gefunden. Sie werden zu Schritt 1 weitergeleitet.');
            window.location.href = 'profil.html';
            return;
        }
        
        var shapeLoaded = displayShapeInfo();
        if (!shapeLoaded) {
            return;
        }
        
        createDimensionInputs();
        
        document.getElementById('btn-back').addEventListener('click', goBack);
        document.getElementById('btn-continue').addEventListener('click', saveAndContinue);
        
        if (currentProjectData.geometry && currentProjectData.geometry.dimensions) {
            currentDimensions = Object.assign({}, currentProjectData.geometry.dimensions);
            Object.keys(currentProjectData.geometry.dimensions).forEach(function(dim) {
                var value = currentProjectData.geometry.dimensions[dim];
                var input = document.querySelector('[data-dimension="' + dim + '"]');
                if (input) {
                    input.value = value;
                }
            });
        }
        
        updatePreview();
        updateCalculation();
        
        console.log('✅ Bemaßung erfolgreich initialisiert');
    });

    console.log('✅ formauswahl.js geladen (in IIFE-Wrapper)');

})();
