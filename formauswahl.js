// formauswahl.js - KOMPLETT KORRIGIERTE VERSION

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

    // KORRIGIERTE Dimension-Konfiguration
    var dimensionConfig = {
        // Basis-Maße
        radius: { label: 'Radius', unit: 'm', default: 4, min: 0.5, max: 50 },
        radiusX: { label: 'Radius Längs', unit: 'm', default: 5, min: 0.5, max: 50 },
        radiusY: { label: 'Radius Quer', unit: 'm', default: 3, min: 0.5, max: 50 },
        length: { label: 'Länge', unit: 'm', default: 8, min: 1, max: 100 },
        width: { label: 'Breite', unit: 'm', default: 5, min: 1, max: 100 },
        side: { label: 'Seitenlänge', unit: 'm', default: 5, min: 1, max: 50 },
        
        // Trapez (korrigiert)
        bottomBase: { label: 'Untere Basis', unit: 'm', default: 8, min: 1, max: 100 },
        topBase: { label: 'Obere Basis', unit: 'm', default: 6, min: 1, max: 100 },
        height: { label: 'Höhe', unit: 'm', default: 4, min: 1, max: 50 },
        
        // Dreieck-Varianten (korrigiert)
        base: { label: 'Basis', unit: 'm', default: 6, min: 1, max: 100 },
        sideA: { label: 'Seite A', unit: 'm', default: 5, min: 1, max: 100 },
        sideB: { label: 'Seite B', unit: 'm', default: 6, min: 1, max: 100 },
        sideC: { label: 'Seite C', unit: 'm', default: 7, min: 1, max: 100 },
        katheteA: { label: 'Kathete A', unit: 'm', default: 4, min: 1, max: 50 },
        katheteB: { label: 'Kathete B', unit: 'm', default: 5, min: 1, max: 50 },
        
        // Parallelogramm
        angle: { label: 'Winkel', unit: '°', default: 60, min: 10, max: 170 },
        
        // L-Form (korrigiert)
        totalLength: { label: 'Gesamtlänge', unit: 'm', default: 10, min: 2, max: 100 },
        totalWidth: { label: 'Gesamtbreite', unit: 'm', default: 8, min: 2, max: 100 },
        cutoutLength: { label: 'Ausschnitt Länge', unit: 'm', default: 4, min: 1, max: 50 },
        cutoutWidth: { label: 'Ausschnitt Breite', unit: 'm', default: 4, min: 1, max: 50 },
        
        // T-Form (korrigiert)
        topWidth: { label: 'Kopfbreite', unit: 'm', default: 8, min: 1, max: 100 },
        stemWidth: { label: 'Stielbreite', unit: 'm', default: 3, min: 1, max: 50 },
        topHeight: { label: 'Kopfhöhe', unit: 'm', default: 2, min: 1, max: 50 },
        stemHeight: { label: 'Stielhöhe', unit: 'm', default: 6, min: 1, max: 50 },
        
        // U-Form (korrigiert)
        outerWidth: { label: 'Außenbreite', unit: 'm', default: 10, min: 2, max: 100 },
        innerWidth: { label: 'Innenbreite', unit: 'm', default: 4, min: 1, max: 50 },
        thickness: { label: 'Wandstärke', unit: 'm', default: 2, min: 0.5, max: 20 }
    };

    // KORRIGIERTE Form-Informationen mit richtigen Dimensionen
    var shapeInfo = {
        // Kreis-Formen
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
        },
        
        // Basis-Formen
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
        
        // Dreieck-Varianten (KORRIGIERT)
        dreieck: { 
            name: 'Gleichseitiges Dreieck', 
            description: 'Dreieck mit allen Seiten gleich', 
            dimensions: ['side'] 
        },
        rechtwinklig: { 
            name: 'Rechtwinkliges Dreieck', 
            description: 'Dreieck mit rechtem Winkel', 
            dimensions: ['katheteA', 'katheteB'] 
        },
        ungleichschenklig: { 
            name: 'Ungleichschenkliges Dreieck', 
            description: 'Dreieck mit drei verschiedenen Seiten', 
            dimensions: ['sideA', 'sideB', 'sideC'] 
        },
        
        // Viereck-Formen (KORRIGIERT)
        trapez: { 
            name: 'Trapez', 
            description: 'Viereck mit zwei parallelen Seiten', 
            dimensions: ['bottomBase', 'topBase', 'height'] 
        },
        parallelogramm: { 
            name: 'Parallelogramm', 
            description: 'Schiefes Rechteck', 
            dimensions: ['length', 'width', 'angle'] 
        },
        rhombus: { 
            name: 'Rhombus/Raute', 
            description: 'Gleichseitiges Parallelogramm', 
            dimensions: ['side', 'angle'] 
        },
        
        // Vieleck-Formen
        fuenfeck: { 
            name: 'Regelmäßiges Fünfeck', 
            description: 'Fünfeck mit gleichen Seiten', 
            dimensions: ['radius'] 
        },
        sechseck: { 
            name: 'Regelmäßiges Sechseck', 
            description: 'Sechseck mit gleichen Seiten', 
            dimensions: ['radius'] 
        },
        achteck: { 
            name: 'Regelmäßiges Achteck', 
            description: 'Achteck mit gleichen Seiten', 
            dimensions: ['radius'] 
        },
        
        // Komplexe Formen (KORRIGIERT)
        lform: { 
            name: 'L-Form', 
            description: 'L-förmige Grundform mit Ausschnitt', 
            dimensions: ['totalLength', 'totalWidth', 'cutoutLength', 'cutoutWidth'] 
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
        
        selectedVariant = roofShape.variant || roofShape.baseShape;
        
        if (!selectedVariant) {
            debugLog('❌ Keine Variante gefunden!');
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
            info = { dimensions: ['length', 'width'] };
        }
        
        var dimensions = info.dimensions;
        debugLog('📐 Erstelle Inputs für Dimensionen', dimensions);
        
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

    // KORRIGIERTE SVG-Generierung
    function getShapeSVG() {
        var dims = currentDimensions;
        var scale = 8; // Einheitliche Skalierung
        
        switch (selectedVariant) {
            case 'kreis':
                var radius = (dims.radius || 4) * scale * 2;
                return '<circle cx="0" cy="0" r="' + radius + '" fill="rgba(0,123,255,0.3)" stroke="#007bff" stroke-width="3"/>';
                
            case 'oval':
                var rx = (dims.radiusX || 5) * scale * 2;
                var ry = (dims.radiusY || 3) * scale * 2;
                return '<ellipse cx="0" cy="0" rx="' + rx + '" ry="' + ry + '" fill="rgba(0,123,255,0.3)" stroke="#007bff" stroke-width="3"/>';
                
            case 'halbkreis':
                var radiusHalf = (dims.radius || 4) * scale * 2;
                return '<path d="M -' + radiusHalf + ' 0 A ' + radiusHalf + ' ' + radiusHalf + ' 0 0 1 ' + radiusHalf + ' 0 Z" fill="rgba(0,123,255,0.3)" stroke="#007bff" stroke-width="3"/>';
                
            case 'viertelkreis':
                var radiusQuarter = (dims.radius || 4) * scale * 2;
                return '<path d="M 0 0 L ' + radiusQuarter + ' 0 A ' + radiusQuarter + ' ' + radiusQuarter + ' 0 0 1 0 ' + radiusQuarter + ' Z" fill="rgba(0,123,255,0.3)" stroke="#007bff" stroke-width="3"/>';
                
            case 'langloch':
                var langLength = (dims.length || 6) * scale;
                var langWidth = (dims.width || 3) * scale;
                var langRadius = langWidth / 2;
                var straightLength = Math.max(0, langLength - langWidth);
                return '<path d="M -' + (straightLength/2) + ' -' + langRadius + ' L ' + (straightLength/2) + ' -' + langRadius + ' A ' + langRadius + ' ' + langRadius + ' 0 0 1 ' + (straightLength/2) + ' ' + langRadius + ' L -' + (straightLength/2) + ' ' + langRadius + ' A ' + langRadius + ' ' + langRadius + ' 0 0 1 -' + (straightLength/2) + ' -' + langRadius + ' Z" fill="rgba(0,123,255,0.3)" stroke="#007bff" stroke-width="3"/>';
                
            case 'rechteck':
                var length = (dims.length || 8) * scale;
                var width = (dims.width || 5) * scale;
                return '<rect x="' + (-length/2) + '" y="' + (-width/2) + '" width="' + length + '" height="' + width + '" fill="rgba(0,123,255,0.3)" stroke="#007bff" stroke-width="3"/>';
                
            case 'quadrat':
                var side = (dims.side || 5) * scale;
                return '<rect x="' + (-side/2) + '" y="' + (-side/2) + '" width="' + side + '" height="' + side + '" fill="rgba(0,123,255,0.3)" stroke="#007bff" stroke-width="3"/>';
                
            // KORRIGIERTE Dreiecke
            case 'dreieck': // Gleichseitiges Dreieck
                var sideEq = (dims.side || 5) * scale;
                var heightEq = sideEq * Math.sqrt(3) / 2;
                var pointsEq = '0,' + (-heightEq*2/3) + ' ' + (-sideEq/2) + ',' + (heightEq/3) + ' ' + (sideEq/2) + ',' + (heightEq/3);
                return '<polygon points="' + pointsEq + '" fill="rgba(0,123,255,0.3)" stroke="#007bff" stroke-width="3"/>';
                
            case 'rechtwinklig': // Rechtwinkliges Dreieck
                var katheteA = (dims.katheteA || 4) * scale;
                var katheteB = (dims.katheteB || 5) * scale;
                var pointsRight = '0,0 ' + katheteA + ',0 0,' + (-katheteB);
                return '<polygon points="' + pointsRight + '" fill="rgba(0,123,255,0.3)" stroke="#007bff" stroke-width="3"/>';
                
            case 'ungleichschenklig': // Ungleichschenkliges Dreieck (vereinfacht)
                var sideA = (dims.sideA || 5) * scale;
                var sideB = (dims.sideB || 6) * scale;
                var sideC = (dims.sideC || 7) * scale;
                // Vereinfachte Darstellung basierend auf sideA als Basis
                var heightCalc = 4 * scale; // Vereinfachte Höhe
                var pointsUnequal = '0,' + (-heightCalc) + ' ' + (-sideA/2) + ',0 ' + (sideA/2) + ',0';
                return '<polygon points="' + pointsUnequal + '" fill="rgba(0,123,255,0.3)" stroke="#007bff" stroke-width="3"/>';
                
            // KORRIGIERTES Trapez
            case 'trapez':
                var bottomBase = (dims.bottomBase || 8) * scale;
                var topBase = (dims.topBase || 6) * scale;
                var height = (dims.height || 4) * scale;
                var points = (-bottomBase/2) + ',' + (height/2) + ' ' + (bottomBase/2) + ',' + (height/2) + ' ' + (topBase/2) + ',' + (-height/2) + ' ' + (-topBase/2) + ',' + (-height/2);
                return '<polygon points="' + points + '" fill="rgba(0,123,255,0.3)" stroke="#007bff" stroke-width="3"/>';
                
            case 'parallelogramm':
                var lengthPara = (dims.length || 8) * scale;
                var widthPara = (dims.width || 5) * scale;
                var anglePara = (dims.angle || 30) * Math.PI / 180;
                var skew = widthPara * Math.cos(anglePara);
                var pointsPara = (-lengthPara/2) + ',' + (-widthPara/2) + ' ' + (lengthPara/2) + ',' + (-widthPara/2) + ' ' + (lengthPara/2 + skew) + ',' + (widthPara/2) + ' ' + (-lengthPara/2 + skew) + ',' + (widthPara/2);
                return '<polygon points="' + pointsPara + '" fill="rgba(0,123,255,0.3)" stroke="#007bff" stroke-width="3"/>';
                
            case 'rhombus':
                var rhombusSide = (dims.side || 5) * scale;
                var angleRhombus = (dims.angle || 60) * Math.PI / 180;
                var halfDiag1 = rhombusSide * Math.sin(angleRhombus / 2);
                var halfDiag2 = rhombusSide * Math.cos(angleRhombus / 2);
                var rhombusPoints = '0,' + (-halfDiag1) + ' ' + halfDiag2 + ',0 0,' + halfDiag1 + ' ' + (-halfDiag2) + ',0';
                return '<polygon points="' + rhombusPoints + '" fill="rgba(0,123,255,0.3)" stroke="#007bff" stroke-width="3"/>';
                
            // Regelmäßige Vielecke
            case 'fuenfeck':
            case 'sechseck':
            case 'achteck':
                var radiusPoly = (dims.radius || 4) * scale;
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
                
            // KORRIGIERTE L-Form
            case 'lform':
                var totalLength = (dims.totalLength || 10) * scale;
                var totalWidth = (dims.totalWidth || 8) * scale;
                var cutoutLength = (dims.cutoutLength || 4) * scale;
                var cutoutWidth = (dims.cutoutWidth || 4) * scale;
                
                var lPoints = [
                    (-totalLength/2) + ',' + (-totalWidth/2),           // Links unten
                    (totalLength/2) + ',' + (-totalWidth/2),            // Rechts unten
                    (totalLength/2) + ',' + (-totalWidth/2 + cutoutWidth), // Rechts Einschnitt unten
                    (-totalLength/2 + cutoutLength) + ',' + (-totalWidth/2 + cutoutWidth), // Einschnitt innen unten
                    (-totalLength/2 + cutoutLength) + ',' + (totalWidth/2), // Einschnitt innen oben
                    (-totalLength/2) + ',' + (totalWidth/2)             // Links oben
                ];
                return '<polygon points="' + lPoints.join(' ') + '" fill="rgba(0,123,255,0.3)" stroke="#007bff" stroke-width="3"/>';
                
            // KORRIGIERTE T-Form
            case 'tform':
                var topWidth = (dims.topWidth || 8) * scale;
                var stemWidth = (dims.stemWidth || 3) * scale;
                var topHeight = (dims.topHeight || 2) * scale;
                var stemHeight = (dims.stemHeight || 6) * scale;
                
                var totalHeight = topHeight + stemHeight;
                
                var tPoints = [
                    (-topWidth/2) + ',' + (totalHeight/2),              // Links oben
                    (topWidth/2) + ',' + (totalHeight/2),               // Rechts oben
                    (topWidth/2) + ',' + (totalHeight/2 - topHeight),   // Rechts Kopf unten
                    (stemWidth/2) + ',' + (totalHeight/2 - topHeight),  // Stiel rechts oben
                    (stemWidth/2) + ',' + (-totalHeight/2),             // Stiel rechts unten
                    (-stemWidth/2) + ',' + (-totalHeight/2),            // Stiel links unten
                    (-stemWidth/2) + ',' + (totalHeight/2 - topHeight), // Stiel links oben
                    (-topWidth/2) + ',' + (totalHeight/2 - topHeight)   // Links Kopf unten
                ];
                return '<polygon points="' + tPoints.join(' ') + '" fill="rgba(0,123,255,0.3)" stroke="#007bff" stroke-width="3"/>';
                
            // KORRIGIERTE U-Form
            case 'uform':
                var outerWidth = (dims.outerWidth || 10) * scale;
                var innerWidth = (dims.innerWidth || 4) * scale;
                var height = (dims.height || 6) * scale;
                var thickness = (dims.thickness || 2) * scale;
                
                var uPoints = [
                    (-outerWidth/2) + ',' + (-height/2),                // Links unten außen
                    (outerWidth/2) + ',' + (-height/2),                 // Rechts unten außen
                    (outerWidth/2) + ',' + (height/2),                  // Rechts oben außen
                    (innerWidth/2) + ',' + (height/2),                  // Rechts oben innen
                    (innerWidth/2) + ',' + (-height/2 + thickness),     // Rechts unten innen
                    (-innerWidth/2) + ',' + (-height/2 + thickness),    // Links unten innen
                    (-innerWidth/2) + ',' + (height/2),                 // Links oben innen
                    (-outerWidth/2) + ',' + (height/2)                  // Links oben außen
                ];
                return '<polygon points="' + uPoints.join(' ') + '" fill="rgba(0,123,255,0.3)" stroke="#007bff" stroke-width="3"/>';
                
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

    // KORRIGIERTE Flächen-Berechnung
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
                
            // KORRIGIERTE Dreieck-Berechnungen
            case 'dreieck': // Gleichseitiges Dreieck
                var sideEq = dims.side || 5;
                return (Math.sqrt(3) / 4) * Math.pow(sideEq, 2);
                
            case 'rechtwinklig': // Rechtwinkliges Dreieck
                return ((dims.katheteA || 4) * (dims.katheteB || 5)) / 2;
                
            case 'ungleichschenklig': // Ungleichschenkliges Dreieck (Heron-Formel)
                var a = dims.sideA || 5;
                var b = dims.sideB || 6;
                var c = dims.sideC || 7;
                var s = (a + b + c) / 2;
                var area = Math.sqrt(s * (s - a) * (s - b) * (s - c));
                return isNaN(area) ? 0 : area;
                
            // KORRIGIERTE Trapez-Berechnung
            case 'trapez':
                var bottomBase = dims.bottomBase || 8;
                var topBase = dims.topBase || 6;
                var height = dims.height || 4;
                return ((bottomBase + topBase) / 2) * height;
                
            case 'parallelogramm':
                var lengthPara = dims.length || 8;
                var widthPara = dims.width || 5;
                var anglePara = (dims.angle || 60) * Math.PI / 180;
                return lengthPara * widthPara * Math.sin(anglePara);
                
            case 'rhombus':
                var side = dims.side || 5;
                var angle = (dims.angle || 60) * Math.PI / 180;
                return Math.pow(side, 2) * Math.sin(angle);
                
            // Regelmäßige Vielecke
            case 'fuenfeck':
            case 'sechseck':
            case 'achteck':
                var radiusPoly = dims.radius || 4;
                var n = selectedVariant === 'fuenfeck' ? 5 : 
                       selectedVariant === 'sechseck' ? 6 : 8;
                return (n * Math.pow(radiusPoly, 2) * Math.sin(2 * Math.PI / n)) / 2;
                
            // KORRIGIERTE komplexe Formen
            case 'lform':
                var totalLength = dims.totalLength || 10;
                var totalWidth = dims.totalWidth || 8;
                var cutoutLength = dims.cutoutLength || 4;
                var cutoutWidth = dims.cutoutWidth || 4;
                var totalArea = totalLength * totalWidth;
                var cutoutArea = cutoutLength * cutoutWidth;
                return totalArea - cutoutArea;
                
            case 'tform':
                var topWidth = dims.topWidth || 8;
                var stemWidth = dims.stemWidth || 3;
                var topHeight = dims.topHeight || 2;
                var stemHeight = dims.stemHeight || 6;
                var topArea = topWidth * topHeight;
                var stemArea = stemWidth * stemHeight;
                return topArea + stemArea;
                
            case 'uform':
                var outerWidth = dims.outerWidth || 10;
                var innerWidth = dims.innerWidth || 4;
                var height = dims.height || 6;
                var thickness = dims.thickness || 2;
                var outerArea = outerWidth * height;
                var innerArea = innerWidth * (height - thickness);
                return outerArea - innerArea;
                
            default:
                debugLog('Standard-Fläche verwendet für', selectedVariant);
                return 40;
        }
    }

    // KORRIGIERTE Umfang-Berechnung
    function calculatePerimeter() {
        var dims = currentDimensions;
        
        switch (selectedVariant) {
            case 'kreis':
                return 2 * Math.PI * (dims.radius || 4);
                
            case 'oval':
                var a = dims.radiusX || 5;
                var b = dims.radiusY || 3;
                // Ramanujan-Approximation für Ellipsenumfang
                return Math.PI * (3 * (a + b) - Math.sqrt((3 * a + b) * (a + 3 * b)));
                
            case 'halbkreis':
                var radius = dims.radius || 4;
                return Math.PI * radius + 2 * radius;
                
            case 'viertelkreis':
                var radius = dims.radius || 4;
                return (Math.PI * radius / 2) + 2 * radius;
                
            case 'langloch':
                var langLength = dims.length || 6;
                var langWidth = dims.width || 3;
                var langRadius = langWidth / 2;
                var straightLength = Math.max(0, langLength - langWidth);
                return 2 * straightLength + 2 * Math.PI * langRadius;
                
            case 'rechteck':
                return 2 * ((dims.length || 8) + (dims.width || 5));
                
            case 'quadrat':
                return 4 * (dims.side || 5);
                
            // KORRIGIERTE Dreieck-Umfänge
            case 'dreieck': // Gleichseitiges Dreieck
                return 3 * (dims.side || 5);
                
            case 'rechtwinklig': // Rechtwinkliges Dreieck
                var katheteA = dims.katheteA || 4;
                var katheteB = dims.katheteB || 5;
                var hypotenuse = Math.sqrt(Math.pow(katheteA, 2) + Math.pow(katheteB, 2));
                return katheteA + katheteB + hypotenuse;
                
            case 'ungleichschenklig': // Ungleichschenkliges Dreieck
                var a = dims.sideA || 5;
                var b = dims.sideB || 6;
                var c = dims.sideC || 7;
                return a + b + c;
                
            // KORRIGIERTE Trapez-Umfang
            case 'trapez':
                var bottomBase = dims.bottomBase || 8;
                var topBase = dims.topBase || 6;
                var height = dims.height || 4;
                // Vereinfachte Berechnung der Schrägseiten
                var sideDiff = Math.abs(bottomBase - topBase) / 2;
                var sideLength = Math.sqrt(Math.pow(height, 2) + Math.pow(sideDiff, 2));
                return bottomBase + topBase + 2 * sideLength;
                
            case 'parallelogramm':
                return 2 * ((dims.length || 8) + (dims.width || 5));
                
            case 'rhombus':
                return 4 * (dims.side || 5);
                
            // Regelmäßige Vielecke
            case 'fuenfeck':
            case 'sechseck':
            case 'achteck':
                var radiusPoly = dims.radius || 4;
                var n = selectedVariant === 'fuenfeck' ? 5 : 
                       selectedVariant === 'sechseck' ? 6 : 8;
                var sideLength = 2 * radiusPoly * Math.sin(Math.PI / n);
                return n * sideLength;
                
            // KORRIGIERTE komplexe Formen
            case 'lform':
                var totalLength = dims.totalLength || 10;
                var totalWidth = dims.totalWidth || 8;
                var cutoutLength = dims.cutoutLength || 4;
                var cutoutWidth = dims.cutoutWidth || 4;
                // Vereinfachte Berechnung des Außenumfangs
                return 2 * totalLength + 2 * totalWidth - 2 * cutoutLength - 2 * cutoutWidth + 2 * cutoutLength + 2 * cutoutWidth;
                
            case 'tform':
                var topWidth = dims.topWidth || 8;
                var stemWidth = dims.stemWidth || 3;
                var topHeight = dims.topHeight || 2;
                var stemHeight = dims.stemHeight || 6;
                // Vereinfachte Berechnung des Außenumfangs
                return 2 * topWidth + 2 * topHeight + 2 * stemHeight + 2 * (topWidth - stemWidth) / 2;
                
            case 'uform':
                var outerWidth = dims.outerWidth || 10;
                var innerWidth = dims.innerWidth || 4;
                var height = dims.height || 6;
                var thickness = dims.thickness || 2;
                // Vereinfachte Berechnung des Außenumfangs
                return 2 * outerWidth + 2 * height + 2 * innerWidth + 2 * (height - thickness);
                
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
    
    // Spezielle Test-Funktionen für die korrigierten Formen
    window.testProblematicShapes = function() {
        console.log('=== TESTE PROBLEMATISCHE FORMEN ===');
        
        // Trapez testen
        console.log('1. Teste Trapez...');
        testShape('trapez');
        setTimeout(() => {
            console.log('2. Teste L-Form...');
            testShape('lform');
            setTimeout(() => {
                console.log('3. Teste Dreieck-Varianten...');
                testShape('dreieck');
                setTimeout(() => testShape('rechtwinklig'), 1000);
                setTimeout(() => testShape('ungleichschenklig'), 2000);
            }, 1000);
        }, 1000);
    };
    
    debugLog('✅ formauswahl.js geladen (KOMPLETT KORRIGIERTE VERSION)');
    debugLog('📋 Verfügbare Formen:', window.availableShapes);
    debugLog('🧪 Teste problematische Formen mit: testProblematicShapes()');

})();
