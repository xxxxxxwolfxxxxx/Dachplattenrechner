// formauswahl.js - BEHOBENE VERSION

(function() {
    'use strict';
    
    // Lokale Variablen
    var currentProjectData = {};
    var currentDimensions = {};
    var selectedVariant = null;

    // Debug-Funktionen
    function debugLog(message, data = null) {
        console.log(`[FORMAUSWAHL] ${message}`, data);
    }

    // Dimension-Konfiguration - ERWEITERT
    var dimensionConfig = {
        // Kreis-Formen
        radius: { label: 'Radius', unit: 'm', default: 4, min: 0.5, max: 50 },
        radiusX: { label: 'Radius X (Länge)', unit: 'm', default: 5, min: 0.5, max: 50 },
        radiusY: { label: 'Radius Y (Breite)', unit: 'm', default: 3, min: 0.5, max: 50 },
        
        // Basis-Formen
        length: { label: 'Länge', unit: 'm', default: 8, min: 1, max: 100 },
        width: { label: 'Breite', unit: 'm', default: 5, min: 1, max: 100 },
        side: { label: 'Seitenlänge', unit: 'm', default: 5, min: 1, max: 50 },
        
        // Trapez-spezifisch
        sideA: { label: 'Basis unten', unit: 'm', default: 8, min: 1, max: 100 },
        sideB: { label: 'Basis oben', unit: 'm', default: 6, min: 1, max: 100 },
        sideC: { label: 'Seite C', unit: 'm', default: 6, min: 1, max: 100 },
        height: { label: 'Höhe', unit: 'm', default: 4, min: 1, max: 50 },
        offset: { label: 'Versatz', unit: 'm', default: 1, min: -10, max: 10 },
        
        // Dreieck-spezifisch
        angle: { label: 'Winkel', unit: '°', default: 60, min: 10, max: 170 },
        katheteA: { label: 'Kathete A', unit: 'm', default: 4, min: 1, max: 50 },
        katheteB: { label: 'Kathete B', unit: 'm', default: 5, min: 1, max: 50 },
        
        // Komplexe Formen
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

    // Form-Informationen - VOLLSTÄNDIG
    var shapeInfo = {
        // Kreis-Formen
        kreis: { name: 'Kreis', description: 'Perfekte Rundform', dimensions: ['radius'] },
        oval: { name: 'Oval/Ellipse', description: 'Längliche Rundform', dimensions: ['radiusX', 'radiusY'] },
        halbkreis: { name: 'Halbkreis', description: 'Halbe Kreisform', dimensions: ['radius'] },
        viertelkreis: { name: 'Viertelkreis', description: 'Viertel einer Kreisform', dimensions: ['radius'] },
        langloch: { name: 'Langloch', description: 'Rechteck mit runden Enden', dimensions: ['length', 'width'] },
        
        // Basis-Formen
        rechteck: { name: 'Rechteck', description: 'Klassische rechteckige Form', dimensions: ['length', 'width'] },
        quadrat: { name: 'Quadrat', description: 'Gleichseitiges Rechteck', dimensions: ['side'] },
        
        // Dreieck-Formen
        dreieck: { name: 'Dreieck', description: 'Allgemeines Dreieck', dimensions: ['sideA', 'sideB', 'height'] },
        gleichseitig: { name: 'Gleichseitiges Dreieck', description: 'Dreieck mit gleichen Seiten', dimensions: ['side'] },
        rechtwinklig: { name: 'Rechtwinkliges Dreieck', description: 'Dreieck mit rechtem Winkel', dimensions: ['katheteA', 'katheteB'] },
        ungleichschenklig: { name: 'Ungleichschenkliges Dreieck', description: 'Dreieck mit unterschiedlichen Seiten', dimensions: ['sideA', 'sideB', 'sideC'] },
        
        // Viereck-Formen
        trapez: { name: 'Trapez', description: 'Viereck mit parallelen Seiten', dimensions: ['sideA', 'sideB', 'height', 'offset'] },
        parallelogramm: { name: 'Parallelogramm', description: 'Schiefes Viereck', dimensions: ['length', 'width', 'angle'] },
        rhombus: { name: 'Rhombus', description: 'Rautenform', dimensions: ['side', 'angle'] },
        
        // Vieleck-Formen
        fuenfeck: { name: 'Fünfeck', description: 'Regelmäßiges Fünfeck', dimensions: ['radius'] },
        sechseck: { name: 'Sechseck', description: 'Regelmäßiges Sechseck', dimensions: ['radius'] },
        achteck: { name: 'Achteck', description: 'Regelmäßiges Achteck', dimensions: ['radius'] },
        
        // Komplexe Formen
        lform: { name: 'L-Form', description: 'L-förmige Grundform', dimensions: ['lengthTotal', 'widthTotal', 'cutLength', 'cutWidth'] },
        tform: { name: 'T-Form', description: 'T-förmige Grundform', dimensions: ['topWidth', 'stemWidth', 'topHeight', 'stemHeight'] },
        uform: { name: 'U-Form', description: 'U-förmige Grundform', dimensions: ['outerWidth', 'innerWidth', 'height', 'thickness'] }
    };

    // Storage-Funktionen
    function saveData() {
        try {
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
            
            localStorage.setItem('dachplattenrechner_data', JSON.stringify(currentProjectData));
            debugLog('Daten gespeichert', currentProjectData);
            return true;
        } catch (e) {
            try {
                sessionStorage.setItem('dachplattenrechner_data', JSON.stringify(currentProjectData));
                debugLog('Daten in sessionStorage gespeichert');
                return true;
            } catch (e2) {
                debugLog('Fehler beim Speichern', e2);
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
            var data = saved ? JSON.parse(saved) : {};
            debugLog('Daten geladen', data);
            return data;
        } catch (e) {
            debugLog('Fehler beim Laden', e);
            return {};
        }
    }

    // Form-Info anzeigen
    function displayShapeInfo() {
        debugLog('=== LADE FORM-INFO ===');
        
        var roofShape = currentProjectData.roofShape;
        debugLog('roofShape gefunden', roofShape);
        
        if (!roofShape) {
            debugLog('❌ Kein roofShape gefunden!');
            alert('Keine Dachform gewählt. Sie werden zu Schritt 2 weitergeleitet.');
            window.location.href = 'dachform.html';
            return false;
        }
        
        // WICHTIG: Prüfe beide möglichen Strukturen
        selectedVariant = roofShape.variant || roofShape.baseShape;
        
        if (!selectedVariant) {
            debugLog('❌ Keine Variante gefunden!');
            console.log('Verfügbare roofShape keys:', Object.keys(roofShape));
            alert('Keine Dachform-Variante gewählt. Sie werden zu Schritt 2 weitergeleitet.');
            window.location.href = 'dachform.html';
            return false;
        }
        
        debugLog('✅ Gewählte Variante', selectedVariant);
        
        var info = shapeInfo[selectedVariant];
        if (info) {
            document.getElementById('shape-title').textContent = info.name;
            document.getElementById('shape-description').textContent = info.description;
            debugLog('✅ Form-Info angezeigt', info);
        } else {
            debugLog('❌ Form-Info nicht gefunden für:', selectedVariant);
            console.log('Verfügbare shapeInfo keys:', Object.keys(shapeInfo));
            // Fallback
            document.getElementById('shape-title').textContent = selectedVariant;
            document.getElementById('shape-description').textContent = 'Benutzerdefinierte Form';
        }
        
        return true;
    }

    // Dimension-Inputs erstellen
    function createDimensionInputs() {
        debugLog('=== ERSTELLE DIMENSION-INPUTS ===');
        
        var dimensionsGrid = document.getElementById('dimensions-grid');
        if (!dimensionsGrid) {
            debugLog('❌ dimensions-grid nicht gefunden!');
            return;
        }
        
        dimensionsGrid.innerHTML = '';
        
        if (!selectedVariant) {
            debugLog('❌ Keine Variante ausgewählt');
            return;
        }
        
        var info = shapeInfo[selectedVariant];
        if (!info) {
            debugLog('❌ Form-Info nicht gefunden für:', selectedVariant);
            // Fallback für unbekannte Formen
            info = { dimensions: ['length', 'width'] };
        }
        
        var dimensions = info.dimensions;
        debugLog('📐 Erstelle Inputs für Dimensionen', dimensions);
        
        // Gespeicherte Werte laden
        var savedGeometry = currentProjectData.geometry || {};
        
        dimensions.forEach(function(dim) {
            var config = dimensionConfig[dim];
            if (!config) {
                debugLog('⚠️ Dimension-Config nicht gefunden für:', dim);
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
        
        debugLog('✅ Dimension-Inputs erstellt:', dimensions.length, 'Inputs');
    }

    // Form-Vorschau aktualisieren
    function updatePreview() {
        var shapeGroup = document.getElementById('shape-group');
        if (!shapeGroup) return;
        
        shapeGroup.innerHTML = '';
        
        var svg = getShapeSVG();
        shapeGroup.innerHTML = svg;
    }

    // SVG für Form generieren - VOLLSTÄNDIG
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
                
            case 'halbkreis':
                var radiusHalf = (dims.radius || 4) * 15;
                return '<path d="M -' + radiusHalf + ' 0 A ' + radiusHalf + ' ' + radiusHalf + ' 0 0 1 ' + radiusHalf + ' 0 Z" fill="rgba(0,123,255,0.3)" stroke="#007bff" stroke-width="3"/>';
                
            case 'viertelkreis':
                var radiusQuarter = (dims.radius || 4) * 15;
                return '<path d="M 0 0 L ' + radiusQuarter + ' 0 A ' + radiusQuarter + ' ' + radiusQuarter + ' 0 0 1 0 ' + radiusQuarter + ' Z" fill="rgba(0,123,255,0.3)" stroke="#007bff" stroke-width="3"/>';
                
            case 'langloch':
                var langLength = (dims.length || 6) * 10;
                var langWidth = (dims.width || 3) * 10;
                var langRadius = langWidth / 2;
                var straightLength = Math.max(0, langLength - langWidth);
                return '<path d="M -' + (straightLength/2) + ' -' + langRadius + ' L ' + (straightLength/2) + ' -' + langRadius + ' A ' + langRadius + ' ' + langRadius + ' 0 0 1 ' + (straightLength/2) + ' ' + langRadius + ' L -' + (straightLength/2) + ' ' + langRadius + ' A ' + langRadius + ' ' + langRadius + ' 0 0 1 -' + (straightLength/2) + ' -' + langRadius + ' Z" fill="rgba(0,123,255,0.3)" stroke="#007bff" stroke-width="3"/>';
                
            case 'rechteck':
                var length = (dims.length || 8) * 10;
                var width = (dims.width || 5) * 10;
                return '<rect x="' + (-length/2) + '" y="' + (-width/2) + '" width="' + length + '" height="' + width + '" fill="rgba(0,123,255,0.3)" stroke="#007bff" stroke-width="3"/>';
                
            case 'quadrat':
                var side = (dims.side || 5) * 12;
                return '<rect x="' + (-side/2) + '" y="' + (-side/2) + '" width="' + side + '" height="' + side + '" fill="rgba(0,123,255,0.3)" stroke="#007bff" stroke-width="3"/>';
                
            case 'dreieck':
                var baseTriangle = (dims.sideA || 8) * 8;
                var heightTriangle = (dims.height || 4) * 8;
                var points = '0,' + (-heightTriangle/2) + ' ' + (-baseTriangle/2) + ',' + (heightTriangle/2) + ' ' + (baseTriangle/2) + ',' + (heightTriangle/2);
                return '<polygon points="' + points + '" fill="rgba(0,123,255,0.3)" stroke="#007bff" stroke-width="3"/>';
                
            case 'gleichseitig':
                var sideEq = (dims.side || 5) * 12;
                var heightEq = sideEq * Math.sqrt(3) / 2;
                var pointsEq = '0,' + (-heightEq*2/3) + ' ' + (-sideEq/2) + ',' + (heightEq/3) + ' ' + (sideEq/2) + ',' + (heightEq/3);
                return '<polygon points="' + pointsEq + '" fill="rgba(0,123,255,0.3)" stroke="#007bff" stroke-width="3"/>';
                
            case 'rechtwinklig':
                var katheteA = (dims.katheteA || 4) * 12;
                var katheteB = (dims.katheteB || 5) * 12;
                var pointsRight = '0,0 ' + katheteA + ',0 0,' + (-katheteB);
                return '<polygon points="' + pointsRight + '" fill="rgba(0,123,255,0.3)" stroke="#007bff" stroke-width="3"/>';
                
            case 'trapez':
                var sideA = (dims.sideA || 8) * 8;
                var sideB = (dims.sideB || 6) * 8;
                var height = (dims.height || 4) * 8;
                var offset = (dims.offset || 1) * 8;
                var points = (-sideA/2) + ',' + (height/2) + ' ' + (sideA/2) + ',' + (height/2) + ' ' + (sideB/2 + offset) + ',' + (-height/2) + ' ' + (-sideB/2 + offset) + ',' + (-height/2);
                return '<polygon points="' + points + '" fill="rgba(0,123,255,0.3)" stroke="#007bff" stroke-width="3"/>';
                
            case 'parallelogramm':
                var lengthPara = (dims.length || 8) * 8;
                var widthPara = (dims.width || 5) * 8;
                var anglePara = (dims.angle || 30) * Math.PI / 180;
                var skew = widthPara * Math.cos(anglePara);
                var pointsPara = (-lengthPara/2) + ',' + (-widthPara/2) + ' ' + (lengthPara/2) + ',' + (-widthPara/2) + ' ' + (lengthPara/2 + skew) + ',' + (widthPara/2) + ' ' + (-lengthPara/2 + skew) + ',' + (widthPara/2);
                return '<polygon points="' + pointsPara + '" fill="rgba(0,123,255,0.3)" stroke="#007bff" stroke-width="3"/>';
                
            case 'rhombus':
                var rhombusSide = (dims.side || 5) * 10;
                var angleRhombus = (dims.angle || 60) * Math.PI / 180;
                var halfDiag1 = rhombusSide * Math.sin(angleRhombus / 2);
                var halfDiag2 = rhombusSide * Math.cos(angleRhombus / 2);
                var rhombusPoints = '0,' + (-halfDiag1) + ' ' + halfDiag2 + ',0 0,' + halfDiag1 + ' ' + (-halfDiag2) + ',0';
                return '<polygon points="' + rhombusPoints + '" fill="rgba(0,123,255,0.3)" stroke="#007bff" stroke-width="3"/>';
                
            case 'fuenfeck':
            case 'sechseck':
            case 'achteck':
                var radiusPoly = (dims.radius || 4) * 12;
                var n = selectedVariant === 'fuenfeck' ? 5 : 
                       selectedVariant === 'sechseck' ? 6 : 8;
                var polyPoints = [];
                for (var i = 0; i < n; i++) {
                    var angle = (i * 2 * Math.PI / n) - Math.PI / 2;
                    var x = radiusPoly * Math.cos(angle);
                    var y = radiusPoly * Math.sin(angle);
                    polyPoints.push(x + ',' + y);
                }
                return '<polygon points="' + polyPoints.join(' ') + '" fill="rgba(0,123,255,0.3)" stroke="#007bff" stroke-width="3"/>';
                
            default:
                debugLog('⚠️ Unbekannte Form, verwende Rechteck:', selectedVariant);
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

    // Fläche berechnen - VOLLSTÄNDIG
    function calculateArea() {
        var dims = currentDimensions;
        
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
                var langLength = dims.length || 6;
                var langWidth = dims.width || 3;
                var langRadius = langWidth / 2;
                var straightLength = Math.max(0, langLength - langWidth);
                return straightLength * langWidth + Math.PI * Math.pow(langRadius, 2);
                
            case 'rechteck':
                return (dims.length || 8) * (dims.width || 5);
                
            case 'quadrat':
                return Math.pow(dims.side || 5, 2);
                
            case 'dreieck':
                return ((dims.sideA || 8) * (dims.height || 4)) / 2;
                
            case 'gleichseitig':
                var sideEq = dims.side || 5;
                return (Math.sqrt(3) / 4) * Math.pow(sideEq, 2);
                
            case 'rechtwinklig':
                return ((dims.katheteA || 4) * (dims.katheteB || 5)) / 2;
                
            case 'trapez':
                var sideA = dims.sideA || 8;
                var sideB = dims.sideB || 6;
                var height = dims.height || 4;
                return ((sideA + sideB) / 2) * height;
                
            case 'parallelogramm':
                var lengthPara = dims.length || 8;
                var widthPara = dims.width || 5;
                var anglePara = (dims.angle || 60) * Math.PI / 180;
                return lengthPara * widthPara * Math.sin(anglePara);
                
            case 'rhombus':
                var side = dims.side || 5;
                var angle = (dims.angle || 60) * Math.PI / 180;
                return Math.pow(side, 2) * Math.sin(angle);
                
            case 'fuenfeck':
            case 'sechseck':
            case 'achteck':
                var radiusPoly = dims.radius || 4;
                var n = selectedVariant === 'fuenfeck' ? 5 : 
                       selectedVariant === 'sechseck' ? 6 : 8;
                return (n * Math.pow(radiusPoly, 2) * Math.sin(2 * Math.PI / n)) / 2;
                
            default:
                debugLog('Standard-Fläche verwendet für', selectedVariant);
                return 40;
        }
    }

    // Umfang berechnen - VOLLSTÄNDIG
    function calculatePerimeter() {
        var dims = currentDimensions;
        
        switch (selectedVariant) {
            case 'kreis':
                return 2 * Math.PI * (dims.radius || 4);
                
            case 'oval':
                var a = dims.radiusX || 5;
                var b = dims.radiusY || 3;
                return Math.PI * (3 * (a + b) - Math.sqrt((3 * a + b) * (a + 3 * b)));
                
            case 'halbkreis':
                var radius = dims.radius || 4;
                return Math.PI * radius + 2 * radius;
                
            case 'viertelkreis':
                var radius = dims.radius || 4;
                return (Math.PI * radius / 2) + 2 * radius;
                
            case 'rechteck':
                return 2 * ((dims.length || 8) + (dims.width || 5));
                
            case 'quadrat':
                return 4 * (dims.side || 5);
                
            case 'trapez':
                var sideA = dims.sideA || 8;
                var sideB = dims.sideB || 6;
                var height = dims.height || 4;
                var offset = dims.offset || 1;
                var sideLength = Math.sqrt(Math.pow(height, 2) + Math.pow((sideA - sideB + 2 * offset) / 2, 2));
                return sideA + sideB + 2 * sideLength;
                
            case 'rhombus':
                return 4 * (dims.side || 5);
                
            case 'fuenfeck':
            case 'sechseck':
            case 'achteck':
                var radiusPoly = dims.radius || 4;
                var n = selectedVariant === 'fuenfeck' ? 5 : 
                       selectedVariant === 'sechseck' ? 6 : 8;
                var sideLength = 2 * radiusPoly * Math.sin(Math.PI / n);
                return n * sideLength;
                
            default:
                debugLog('Standard-Umfang verwendet für', selectedVariant);
                return 24;
        }
    }

    // Speichern und Weiter
    function saveAndContinue() {
        if (!selectedVariant) {
            alert('Keine Form gefunden!');
            return;
        }
        
        var saved = saveData();
        if (!saved) {
            alert('Fehler beim Speichern!');
            return;
        }
        
        debugLog('Weiterleitung zum Editor');
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
        debugLog('=== BEMASUNG SEITE GELADEN ===');
        
        currentProjectData = loadData();
        debugLog('📁 Geladene currentProjectData:', currentProjectData);
        
        if (!currentProjectData.profile) {
            debugLog('❌ Keine Profil-Daten gefunden!');
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
        
        // Gespeicherte Geometrie-Daten laden
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
        
        debugLog('✅ Bemaßung erfolgreich initialisiert');
    });

    // Debug-Funktionen für Tests
    window.testShape = function(variant) {
        debugLog('=== TESTE FORM ===', variant);
        
        // Simuliere Auswahl einer anderen Form
        currentProjectData.roofShape = { variant: variant };
        selectedVariant = variant;
        
        // UI aktualisieren
        displayShapeInfo();
        createDimensionInputs();
        updatePreview();
        updateCalculation();
        
        debugLog('Form-Test abgeschlossen für', variant);
    };

    // Alle verfügbaren Formen zum Testen
    window.availableShapes = Object.keys(shapeInfo);
    
    debugLog('✅ formauswahl.js geladen (BEHOBENE VERSION)');

})();
