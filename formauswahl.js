// formauswahl.js - KORRIGIERTE VERSION mit perfekten Maßlinien

(function() {
    'use strict';
    
    // Globale Variablen
    var currentProjectData = {};
    var currentDimensions = {};
    var selectedVariant = null;

    // Debug-Funktionen
    function debugLog(message, data) {
        console.log('[FORMAUSWAHL] ' + message, data || '');
    }

    // Dimension-Konfiguration
    var dimensionConfig = {
        // Basis-Maße
        bottomBase: { label: 'Untere Basis', unit: 'm', default: 8, min: 1, max: 100 },
        topBase: { label: 'Obere Basis', unit: 'm', default: 6, min: 1, max: 100 },
        height: { label: 'Höhe', unit: 'm', default: 4, min: 1, max: 50 },
        length: { label: 'Länge', unit: 'm', default: 8, min: 1, max: 100 },
        width: { label: 'Breite', unit: 'm', default: 5, min: 1, max: 100 },
        side: { label: 'Seitenlänge', unit: 'm', default: 5, min: 1, max: 50 },
        radius: { label: 'Radius', unit: 'm', default: 4, min: 0.5, max: 50 },
        katheteA: { label: 'Kathete A', unit: 'm', default: 4, min: 1, max: 50 },
        katheteB: { label: 'Kathete B', unit: 'm', default: 5, min: 1, max: 50 },
        totalLength: { label: 'Gesamtlänge', unit: 'm', default: 10, min: 2, max: 100 },
        totalWidth: { label: 'Gesamtbreite', unit: 'm', default: 8, min: 2, max: 100 },
        cutoutLength: { label: 'Ausschnitt Länge', unit: 'm', default: 4, min: 1, max: 50 },
        cutoutWidth: { label: 'Ausschnitt Breite', unit: 'm', default: 4, min: 1, max: 50 },
        sideA: { label: 'Seite A', unit: 'm', default: 5, min: 1, max: 100 },
        sideB: { label: 'Seite B', unit: 'm', default: 6, min: 1, max: 100 },
        sideC: { label: 'Seite C', unit: 'm', default: 7, min: 1, max: 100 },
        angle: { label: 'Winkel', unit: '°', default: 60, min: 10, max: 170 },
        radiusX: { label: 'Radius X', unit: 'm', default: 5, min: 0.5, max: 50 },
        radiusY: { label: 'Radius Y', unit: 'm', default: 3, min: 0.5, max: 50 }
    };

    // Form-Informationen
    var shapeInfo = {
        trapez: { 
            name: 'Trapez', 
            description: 'Viereck mit zwei parallelen Seiten', 
            dimensions: ['bottomBase', 'topBase', 'height'] 
        },
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
        kreis: { 
            name: 'Kreis', 
            description: 'Perfekte Rundform', 
            dimensions: ['radius'] 
        },
        oval: { 
            name: 'Oval', 
            description: 'Längliche Rundform', 
            dimensions: ['radiusX', 'radiusY'] 
        },
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
        parallelogramm: { 
            name: 'Parallelogramm', 
            description: 'Schiefes Rechteck', 
            dimensions: ['length', 'width', 'angle'] 
        },
        rhombus: { 
            name: 'Rhombus', 
            description: 'Rautenform', 
            dimensions: ['side', 'angle'] 
        },
        lform: { 
            name: 'L-Form', 
            description: 'L-förmige Grundform', 
            dimensions: ['totalLength', 'totalWidth', 'cutoutLength', 'cutoutWidth'] 
        }
    };

    // Storage-Funktionen
    function saveData() {
        try {
            currentProjectData.geometry = {
                variant: selectedVariant,
                shapeType: selectedVariant,
                dimensions: currentDimensions,
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
        if (!roofShape) {
            debugLog('Keine roofShape gefunden, verwende Demo-Daten');
            selectedVariant = 'trapez'; // Fallback
            return true;
        }
        
        selectedVariant = roofShape.variant || roofShape.baseShape || 'trapez';
        debugLog('Gewählte Variante: ' + selectedVariant);
        
        var info = shapeInfo[selectedVariant];
        if (info) {
            var titleElement = document.getElementById('shape-title');
            var descElement = document.getElementById('shape-description');
            
            if (titleElement) titleElement.textContent = info.name;
            if (descElement) descElement.textContent = info.description;
            
            debugLog('Form-Info angezeigt: ' + info.name);
        } else {
            debugLog('Form-Info nicht gefunden für: ' + selectedVariant);
        }
        
        return true;
    }

    // Dimension-Inputs erstellen
    function createDimensionInputs() {
        debugLog('=== ERSTELLE DIMENSION-INPUTS ===');
        
        var dimensionsGrid = document.getElementById('dimensions-grid');
        if (!dimensionsGrid) {
            debugLog('dimensions-grid nicht gefunden!');
            return;
        }
        
        dimensionsGrid.innerHTML = '';
        
        var info = shapeInfo[selectedVariant];
        if (!info) {
            debugLog('Form-Info nicht gefunden für: ' + selectedVariant);
            return;
        }
        
        var dimensions = info.dimensions;
        debugLog('Erstelle Inputs für Dimensionen: ' + dimensions.join(', '));
        
        for (var i = 0; i < dimensions.length; i++) {
            var dim = dimensions[i];
            var config = dimensionConfig[dim];
            
            if (!config) {
                debugLog('Dimension-Config nicht gefunden für: ' + dim);
                continue;
            }
            
            var savedValue = currentDimensions[dim] || config.default;
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
                var dimension = e.target.getAttribute('data-dimension');
                var value = parseFloat(e.target.value);
                if (!isNaN(value)) {
                    currentDimensions[dimension] = value;
                    updatePreview();
                    updateCalculation();
                }
            });
        }
        
        debugLog('Dimension-Inputs erstellt: ' + dimensions.length + ' Inputs');
    }

    // Form-Vorschau aktualisieren
    function updatePreview() {
        var shapeGroup = document.getElementById('shape-group');
        var dimensionsGroup = document.getElementById('dimensions-group');
        
        if (!shapeGroup) return;
        
        // Shape neu zeichnen
        shapeGroup.innerHTML = getShapeSVG();
        
        // Bemaßung hinzufügen
        if (dimensionsGroup) {
            dimensionsGroup.innerHTML = createArrowMarker() + getDimensionsSVG();
        }
    }

    // SVG für Form generieren
    function getShapeSVG() {
        var dims = currentDimensions;
        var scale = 8;
        
        switch (selectedVariant) {
            case 'trapez':
                var bottomBase = (dims.bottomBase || 8) * scale;
                var topBase = (dims.topBase || 6) * scale;
                var height = (dims.height || 4) * scale;
                var points = (-bottomBase/2) + ',' + (height/2) + ' ' + 
                           (bottomBase/2) + ',' + (height/2) + ' ' + 
                           (topBase/2) + ',' + (-height/2) + ' ' + 
                           (-topBase/2) + ',' + (-height/2);
                return '<polygon points="' + points + '" fill="rgba(0,123,255,0.3)" stroke="#007bff" stroke-width="3"/>';
                
            case 'rechteck':
                var length = (dims.length || 8) * scale;
                var width = (dims.width || 5) * scale;
                return '<rect x="' + (-length/2) + '" y="' + (-width/2) + '" width="' + length + '" height="' + width + '" fill="rgba(0,123,255,0.3)" stroke="#007bff" stroke-width="3"/>';
                
            case 'quadrat':
                var side = (dims.side || 5) * scale;
                return '<rect x="' + (-side/2) + '" y="' + (-side/2) + '" width="' + side + '" height="' + side + '" fill="rgba(0,123,255,0.3)" stroke="#007bff" stroke-width="3"/>';
                
            case 'kreis':
                var radius = (dims.radius || 4) * scale * 2;
                return '<circle cx="0" cy="0" r="' + radius + '" fill="rgba(0,123,255,0.3)" stroke="#007bff" stroke-width="3"/>';
                
            case 'oval':
                var rx = (dims.radiusX || 5) * scale * 2;
                var ry = (dims.radiusY || 3) * scale * 2;
                return '<ellipse cx="0" cy="0" rx="' + rx + '" ry="' + ry + '" fill="rgba(0,123,255,0.3)" stroke="#007bff" stroke-width="3"/>';
                
            case 'dreieck':
                var sideEq = (dims.side || 5) * scale;
                var heightEq = sideEq * Math.sqrt(3) / 2;
                var pointsEq = '0,' + (-heightEq*2/3) + ' ' + (-sideEq/2) + ',' + (heightEq/3) + ' ' + (sideEq/2) + ',' + (heightEq/3);
                return '<polygon points="' + pointsEq + '" fill="rgba(0,123,255,0.3)" stroke="#007bff" stroke-width="3"/>';
                
            case 'rechtwinklig':
                var katheteA = (dims.katheteA || 4) * scale;
                var katheteB = (dims.katheteB || 5) * scale;
                // Dreieck mit rechtem Winkel unten links, Kathete A nach rechts, Kathete B nach oben
                var pointsRight = '0,0 ' + katheteA + ',0 0,' + (-katheteB);
                return '<polygon points="' + pointsRight + '" fill="rgba(0,123,255,0.3)" stroke="#007bff" stroke-width="3"/>';
                
            case 'lform':
                var totalLength = (dims.totalLength || 10) * scale;
                var totalWidth = (dims.totalWidth || 8) * scale;
                var cutoutLength = (dims.cutoutLength || 4) * scale;
                var cutoutWidth = (dims.cutoutWidth || 4) * scale;
                
                var lPoints = [
                    (-totalLength/2) + ',' + (-totalWidth/2),
                    (totalLength/2) + ',' + (-totalWidth/2),
                    (totalLength/2) + ',' + (-totalWidth/2 + cutoutWidth),
                    (-totalLength/2 + cutoutLength) + ',' + (-totalWidth/2 + cutoutWidth),
                    (-totalLength/2 + cutoutLength) + ',' + (totalWidth/2),
                    (-totalLength/2) + ',' + (totalWidth/2)
                ];
                return '<polygon points="' + lPoints.join(' ') + '" fill="rgba(0,123,255,0.3)" stroke="#007bff" stroke-width="3"/>';
                
            default:
                return '<rect x="-40" y="-30" width="80" height="60" fill="rgba(0,123,255,0.3)" stroke="#007bff" stroke-width="3"/>';
        }
    }

    // Arrow-Marker für SVG
    function createArrowMarker() {
        return '<defs>' +
               '<marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">' +
               '<polygon points="0 0, 10 3.5, 0 7" fill="#ff6b6b" />' +
               '</marker>' +
               '</defs>';
    }

    // KORRIGIERTE Bemaßung-SVG generieren
    function getDimensionsSVG() {
        var dims = currentDimensions;
        var scale = 8;
        var offset = 25; // Abstand der Maßlinien vom Objekt
        
        switch (selectedVariant) {
            case 'trapez':
                var bottomBase = (dims.bottomBase || 8) * scale;
                var topBase = (dims.topBase || 6) * scale;
                var height = (dims.height || 4) * scale;
                
                return [
                    // Untere Basis - Maßlinie
                    '<line x1="' + (200-bottomBase/2) + '" y1="' + (160+height/2+offset) + '" x2="' + (200+bottomBase/2) + '" y2="' + (160+height/2+offset) + '" stroke="#ff6b6b" stroke-width="2" stroke-dasharray="5,5" marker-start="url(#arrowhead)" marker-end="url(#arrowhead)"/>',
                    // Untere Basis - Text
                    '<text x="200" y="' + (160+height/2+offset+15) + '" text-anchor="middle" font-size="12" font-weight="bold" fill="#ff6b6b">' + (dims.bottomBase || 8) + 'm</text>',
                    // Untere Basis - Verbindungslinien
                    '<line x1="' + (200-bottomBase/2) + '" y1="' + (160+height/2) + '" x2="' + (200-bottomBase/2) + '" y2="' + (160+height/2+offset) + '" stroke="#ff6b6b" stroke-width="1"/>',
                    '<line x1="' + (200+bottomBase/2) + '" y1="' + (160+height/2) + '" x2="' + (200+bottomBase/2) + '" y2="' + (160+height/2+offset) + '" stroke="#ff6b6b" stroke-width="1"/>',
                    
                    // Obere Basis - Maßlinie
                    '<line x1="' + (200-topBase/2) + '" y1="' + (160-height/2-offset) + '" x2="' + (200+topBase/2) + '" y2="' + (160-height/2-offset) + '" stroke="#ff6b6b" stroke-width="2" stroke-dasharray="5,5" marker-start="url(#arrowhead)" marker-end="url(#arrowhead)"/>',
                    // Obere Basis - Text
                    '<text x="200" y="' + (160-height/2-offset-5) + '" text-anchor="middle" font-size="12" font-weight="bold" fill="#ff6b6b">' + (dims.topBase || 6) + 'm</text>',
                    // Obere Basis - Verbindungslinien
                    '<line x1="' + (200-topBase/2) + '" y1="' + (160-height/2) + '" x2="' + (200-topBase/2) + '" y2="' + (160-height/2-offset) + '" stroke="#ff6b6b" stroke-width="1"/>',
                    '<line x1="' + (200+topBase/2) + '" y1="' + (160-height/2) + '" x2="' + (200+topBase/2) + '" y2="' + (160-height/2-offset) + '" stroke="#ff6b6b" stroke-width="1"/>',
                    
                    // Höhe - Maßlinie
                    '<line x1="' + (200-bottomBase/2-offset) + '" y1="' + (160-height/2) + '" x2="' + (200-bottomBase/2-offset) + '" y2="' + (160+height/2) + '" stroke="#ff6b6b" stroke-width="2" stroke-dasharray="5,5" marker-start="url(#arrowhead)" marker-end="url(#arrowhead)"/>',
                    // Höhe - Text (gedreht)
                    '<text x="' + (200-bottomBase/2-offset-15) + '" y="160" text-anchor="middle" font-size="12" font-weight="bold" fill="#ff6b6b" transform="rotate(-90 ' + (200-bottomBase/2-offset-15) + ' 160)">' + (dims.height || 4) + 'm</text>',
                    // Höhe - Verbindungslinien
                    '<line x1="' + (200-bottomBase/2) + '" y1="' + (160-height/2) + '" x2="' + (200-bottomBase/2-offset) + '" y2="' + (160-height/2) + '" stroke="#ff6b6b" stroke-width="1"/>',
                    '<line x1="' + (200-bottomBase/2) + '" y1="' + (160+height/2) + '" x2="' + (200-bottomBase/2-offset) + '" y2="' + (160+height/2) + '" stroke="#ff6b6b" stroke-width="1"/>'
                ].join('');
                
            case 'rechteck':
                var length = (dims.length || 8) * scale;
                var width = (dims.width || 5) * scale;
                
                return [
                    // Länge - Maßlinie
                    '<line x1="' + (200-length/2) + '" y1="' + (160+width/2+offset) + '" x2="' + (200+length/2) + '" y2="' + (160+width/2+offset) + '" stroke="#ff6b6b" stroke-width="2" stroke-dasharray="5,5" marker-start="url(#arrowhead)" marker-end="url(#arrowhead)"/>',
                    // Länge - Text
                    '<text x="200" y="' + (160+width/2+offset+15) + '" text-anchor="middle" font-size="12" font-weight="bold" fill="#ff6b6b">' + (dims.length || 8) + 'm</text>',
                    // Länge - Verbindungslinien
                    '<line x1="' + (200-length/2) + '" y1="' + (160+width/2) + '" x2="' + (200-length/2) + '" y2="' + (160+width/2+offset) + '" stroke="#ff6b6b" stroke-width="1"/>',
                    '<line x1="' + (200+length/2) + '" y1="' + (160+width/2) + '" x2="' + (200+length/2) + '" y2="' + (160+width/2+offset) + '" stroke="#ff6b6b" stroke-width="1"/>',
                    
                    // Breite - Maßlinie
                    '<line x1="' + (200-length/2-offset) + '" y1="' + (160-width/2) + '" x2="' + (200-length/2-offset) + '" y2="' + (160+width/2) + '" stroke="#ff6b6b" stroke-width="2" stroke-dasharray="5,5" marker-start="url(#arrowhead)" marker-end="url(#arrowhead)"/>',
                    // Breite - Text (gedreht)
                    '<text x="' + (200-length/2-offset-15) + '" y="160" text-anchor="middle" font-size="12" font-weight="bold" fill="#ff6b6b" transform="rotate(-90 ' + (200-length/2-offset-15) + ' 160)">' + (dims.width || 5) + 'm</text>',
                    // Breite - Verbindungslinien
                    '<line x1="' + (200-length/2) + '" y1="' + (160-width/2) + '" x2="' + (200-length/2-offset) + '" y2="' + (160-width/2) + '" stroke="#ff6b6b" stroke-width="1"/>',
                    '<line x1="' + (200-length/2) + '" y1="' + (160+width/2) + '" x2="' + (200-length/2-offset) + '" y2="' + (160+width/2) + '" stroke="#ff6b6b" stroke-width="1"/>'
                ].join('');
                
            case 'kreis':
                var radius = (dims.radius || 4) * scale * 2;
                
                return [
                    // Radius - Linie von Zentrum nach außen
                    '<line x1="200" y1="160" x2="' + (200+radius) + '" y2="160" stroke="#ff6b6b" stroke-width="2" stroke-dasharray="5,5" marker-end="url(#arrowhead)"/>',
                    // Radius - Text
                    '<text x="' + (200+radius/2) + '" y="155" text-anchor="middle" font-size="12" font-weight="bold" fill="#ff6b6b">r = ' + (dims.radius || 4) + 'm</text>',
                    
                    // Durchmesser - Maßlinie unten
                    '<line x1="' + (200-radius) + '" y1="' + (160+radius+offset) + '" x2="' + (200+radius) + '" y2="' + (160+radius+offset) + '" stroke="#ff6b6b" stroke-width="2" stroke-dasharray="5,5" marker-start="url(#arrowhead)" marker-end="url(#arrowhead)"/>',
                    // Durchmesser - Text
                    '<text x="200" y="' + (160+radius+offset+15) + '" text-anchor="middle" font-size="12" font-weight="bold" fill="#ff6b6b">⌀ ' + ((dims.radius || 4) * 2) + 'm</text>',
                    // Durchmesser - Verbindungslinien
                    '<line x1="' + (200-radius) + '" y1="' + (160+radius) + '" x2="' + (200-radius) + '" y2="' + (160+radius+offset) + '" stroke="#ff6b6b" stroke-width="1"/>',
                    '<line x1="' + (200+radius) + '" y1="' + (160+radius) + '" x2="' + (200+radius) + '" y2="' + (160+radius+offset) + '" stroke="#ff6b6b" stroke-width="1"/>',
                    
                    // Zentrum markieren
                    '<circle cx="200" cy="160" r="3" fill="#ff6b6b"/>',
                    '<text x="205" y="175" font-size="10" fill="#ff6b6b">Zentrum</text>'
                ].join('');
                
            case 'rechtwinklig':
                var katheteA = (dims.katheteA || 4) * scale;
                var katheteB = (dims.katheteB || 5) * scale;
                
                return [
                    // Kathete A - Maßlinie (horizontal, weiter unten)
                    '<line x1="150" y1="' + (125+katheteB+offset+10) + '" x2="' + (150+katheteA) + '" y2="' + (125+katheteB+offset+10) + '" stroke="#ff6b6b" stroke-width="2" stroke-dasharray="5,5" marker-start="url(#arrowhead)" marker-end="url(#arrowhead)"/>',
                    // Kathete A - Text
                    '<text x="' + (150+katheteA/2) + '" y="' + (125+katheteB+offset+25) + '" text-anchor="middle" font-size="12" font-weight="bold" fill="#ff6b6b">' + (dims.katheteA || 4) + 'm</text>',
                    // Kathete A - Verbindungslinien
                    '<line x1="150" y1="' + (125+katheteB) + '" x2="150" y2="' + (125+katheteB+offset+10) + '" stroke="#ff6b6b" stroke-width="1"/>',
                    '<line x1="' + (150+katheteA) + '" y1="' + (125+katheteB) + '" x2="' + (150+katheteA) + '" y2="' + (125+katheteB+offset+10) + '" stroke="#ff6b6b" stroke-width="1"/>',
                    
                    // Kathete B - Maßlinie (vertikal, weiter links)
                    '<line x1="' + (150-offset-15) + '" y1="125" x2="' + (150-offset-15) + '" y2="' + (125+katheteB) + '" stroke="#ff6b6b" stroke-width="2" stroke-dasharray="5,5" marker-start="url(#arrowhead)" marker-end="url(#arrowhead)"/>',
                    // Kathete B - Text (gedreht, weiter links)
                    '<text x="' + (150-offset-30) + '" y="' + (125+katheteB/2) + '" text-anchor="middle" font-size="12" font-weight="bold" fill="#ff6b6b" transform="rotate(-90 ' + (150-offset-30) + ' ' + (125+katheteB/2) + ')">' + (dims.katheteB || 5) + 'm</text>',
                    // Kathete B - Verbindungslinien
                    '<line x1="150" y1="125" x2="' + (150-offset-15) + '" y2="125" stroke="#ff6b6b" stroke-width="1"/>',
                    '<line x1="150" y1="' + (125+katheteB) + '" x2="' + (150-offset-15) + '" y2="' + (125+katheteB) + '" stroke="#ff6b6b" stroke-width="1"/>',
                    
                    // Rechter Winkel Symbol (bleibt an der Ecke)
                    '<path d="M ' + (150+15) + ' ' + (125+katheteB) + ' L ' + (150+15) + ' ' + (125+katheteB-15) + ' L 150 ' + (125+katheteB-15) + '" stroke="#007bff" stroke-width="2" fill="none"/>',
                    '<text x="' + (150+20) + '" y="' + (125+katheteB-20) + '" font-size="10" fill="#007bff">90°</text>'
                ].join('');
                
            case 'lform':
                var totalLength = (dims.totalLength || 10) * scale;
                var totalWidth = (dims.totalWidth || 8) * scale;
                var cutoutLength = (dims.cutoutLength || 4) * scale;
                var cutoutWidth = (dims.cutoutWidth || 4) * scale;
                
                return [
                    // Gesamtlänge - Maßlinie
                    '<line x1="' + (200-totalLength/2) + '" y1="' + (160+totalWidth/2+offset) + '" x2="' + (200+totalLength/2) + '" y2="' + (160+totalWidth/2+offset) + '" stroke="#ff6b6b" stroke-width="2" stroke-dasharray="5,5" marker-start="url(#arrowhead)" marker-end="url(#arrowhead)"/>',
                    // Gesamtlänge - Text
                    '<text x="200" y="' + (160+totalWidth/2+offset+15) + '" text-anchor="middle" font-size="12" font-weight="bold" fill="#ff6b6b">' + (dims.totalLength || 10) + 'm</text>',
                    
                    // Gesamtbreite - Maßlinie
                    '<line x1="' + (200-totalLength/2-offset) + '" y1="' + (160-totalWidth/2) + '" x2="' + (200-totalLength/2-offset) + '" y2="' + (160+totalWidth/2) + '" stroke="#ff6b6b" stroke-width="2" stroke-dasharray="5,5" marker-start="url(#arrowhead)" marker-end="url(#arrowhead)"/>',
                    // Gesamtbreite - Text (gedreht)
                    '<text x="' + (200-totalLength/2-offset-15) + '" y="160" text-anchor="middle" font-size="12" font-weight="bold" fill="#ff6b6b" transform="rotate(-90 ' + (200-totalLength/2-offset-15) + ' 160)">' + (dims.totalWidth || 8) + 'm</text>',
                    
                    // Ausschnitt Länge - Maßlinie (innen)
                    '<line x1="' + (200-totalLength/2+cutoutLength) + '" y1="' + (160-totalWidth/2+cutoutWidth-20) + '" x2="' + (200+totalLength/2) + '" y2="' + (160-totalWidth/2+cutoutWidth-20) + '" stroke="#ff6b6b" stroke-width="2" stroke-dasharray="3,3" marker-start="url(#arrowhead)" marker-end="url(#arrowhead)"/>',
                    // Ausschnitt Länge - Text
                    '<text x="' + (200+totalLength/4-cutoutLength/4) + '" y="' + (160-totalWidth/2+cutoutWidth-25) + '" text-anchor="middle" font-size="10" font-weight="bold" fill="#ff6b6b">' + (dims.cutoutLength || 4) + 'm</text>',
                    
                    // Ausschnitt Breite - Maßlinie (seitlich)
                    '<line x1="' + (200+totalLength/2+20) + '" y1="' + (160-totalWidth/2) + '" x2="' + (200+totalLength/2+20) + '" y2="' + (160-totalWidth/2+cutoutWidth) + '" stroke="#ff6b6b" stroke-width="2" stroke-dasharray="3,3" marker-start="url(#arrowhead)" marker-end="url(#arrowhead)"/>',
                    // Ausschnitt Breite - Text (gedreht)
                    '<text x="' + (200+totalLength/2+35) + '" y="' + (160-totalWidth/2+cutoutWidth/2) + '" text-anchor="middle" font-size="10" font-weight="bold" fill="#ff6b6b" transform="rotate(-90 ' + (200+totalLength/2+35) + ' ' + (160-totalWidth/2+cutoutWidth/2) + ')">' + (dims.cutoutWidth || 4) + 'm</text>'
                ].join('');
                
            default:
                return '';
        }
    }

    // Berechnungen
    function calculateArea() {
        var dims = currentDimensions;
        
        switch (selectedVariant) {
            case 'trapez':
                var bottomBase = dims.bottomBase || 8;
                var topBase = dims.topBase || 6;
                var height = dims.height || 4;
                return ((bottomBase + topBase) / 2) * height;
                
            case 'rechteck':
                return (dims.length || 8) * (dims.width || 5);
                
            case 'quadrat':
                return Math.pow(dims.side || 5, 2);
                
            case 'kreis':
                return Math.PI * Math.pow(dims.radius || 4, 2);
                
            case 'oval':
                return Math.PI * (dims.radiusX || 5) * (dims.radiusY || 3);
                
            case 'dreieck':
                var sideEq = dims.side || 5;
                return (Math.sqrt(3) / 4) * Math.pow(sideEq, 2);
                
            case 'rechtwinklig':
                return ((dims.katheteA || 4) * (dims.katheteB || 5)) / 2;
                
            case 'lform':
                var totalLength = dims.totalLength || 10;
                var totalWidth = dims.totalWidth || 8;
                var cutoutLength = dims.cutoutLength || 4;
                var cutoutWidth = dims.cutoutWidth || 4;
                return (totalLength * totalWidth) - (cutoutLength * cutoutWidth);
                
            default:
                return 40;
        }
    }

    function calculatePerimeter() {
        var dims = currentDimensions;
        
        switch (selectedVariant) {
            case 'trapez':
                var bottomBase = dims.bottomBase || 8;
                var topBase = dims.topBase || 6;
                var height = dims.height || 4;
                var sideDiff = Math.abs(bottomBase - topBase) / 2;
                var sideLength = Math.sqrt(Math.pow(height, 2) + Math.pow(sideDiff, 2));
                return bottomBase + topBase + 2 * sideLength;
                
            case 'rechteck':
                return 2 * ((dims.length || 8) + (dims.width || 5));
                
            case 'quadrat':
                return 4 * (dims.side || 5);
                
            case 'kreis':
                return 2 * Math.PI * (dims.radius || 4);
                
            case 'rechtwinklig':
                var katheteA = dims.katheteA || 4;
                var katheteB = dims.katheteB || 5;
                var hypotenuse = Math.sqrt(Math.pow(katheteA, 2) + Math.pow(katheteB, 2));
                return katheteA + katheteB + hypotenuse;
                
            default:
                return 24;
        }
    }

    function updateCalculation() {
        var area = calculateArea();
        var perimeter = calculatePerimeter();
        
        var areaElement = document.getElementById('calc-area');
        var perimeterElement = document.getElementById('calc-perimeter');
        
        if (areaElement) areaElement.textContent = area.toFixed(2) + ' m²';
        if (perimeterElement) perimeterElement.textContent = perimeter.toFixed(2) + ' m';
        
        var continueBtn = document.getElementById('btn-continue');
        if (continueBtn) {
            continueBtn.disabled = area <= 0;
        }
    }

    // Navigation
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
        
        debugLog('Weiterleitung zur Berechnung');
        window.location.href = 'berechnung.html';
    }

    function goBack() {
        window.location.href = 'Editor.html';
    }

    // Test-Funktionen
    window.testShape = function(variant) {
        selectedVariant = variant;
        
        // Neue Standarddimensionen setzen
        var info = shapeInfo[selectedVariant];
        if (info) {
            currentDimensions = {};
            for (var i = 0; i < info.dimensions.length; i++) {
                var dim = info.dimensions[i];
                var config = dimensionConfig[dim];
                if (config) {
                    currentDimensions[dim] = config.default;
                }
            }
        }
        
        displayShapeInfo();
        createDimensionInputs();
        updatePreview();
        updateCalculation();
        
        console.log('Form gewechselt zu: ' + variant);
    };

    // Globale Funktionen
    window.saveAndContinue = saveAndContinue;
    window.goBack = goBack;
    window.availableShapes = Object.keys(shapeInfo);

    // Initialisierung
    document.addEventListener('DOMContentLoaded', function() {
        debugLog('=== SEITE GELADEN ===');
        
        currentProjectData = loadData();
        
        // Fallback für Demo
        if (!currentProjectData.profile) {
            currentProjectData = {
                profile: {
                    kategorie: 'trapezprofil',
                    profilKey: 'TP20',
                    deckbreite: 1000,
                    profilname: 'TP20'
                },
                roofShape: {
                    variant: 'trapez'
                }
            };
        }
        
        var shapeLoaded = displayShapeInfo();
        if (shapeLoaded) {
            createDimensionInputs();
            updatePreview();
            updateCalculation();
        }
        
        // Event Listeners
        var backBtn = document.getElementById('btn-back');
        var continueBtn = document.getElementById('btn-continue');
        
        if (backBtn) backBtn.addEventListener('click', goBack);
        if (continueBtn) continueBtn.addEventListener('click', saveAndContinue);
        
        debugLog('Initialisierung abgeschlossen');
    });

    debugLog('formauswahl.js geladen - Navigation zu berechnung.html');

})();
