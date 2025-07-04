// REPARIERTE formauswahl.js - Korrektes Form-Mapping

(function() {
    'use strict';
    
    // Globale Variablen
    var currentProjectData = {};
    var currentDimensions = {};
    var selectedVariant = null;

    // Debug-Funktionen
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

    // ERWEITERTE Form-Erkennung mit ausführlichem Debug
    function determineShapeFromProject() {
        debugLog('=== BESTIMME FORM AUS PROJEKT ===');
        
        const projectData = loadData();
        debugLog('Geladene Projektdaten:', JSON.stringify(projectData, null, 2));
        
        if (projectData.roofShape) {
            const baseShape = projectData.roofShape.baseShape;
            const variant = projectData.roofShape.variant;
            
            debugLog('🔍 baseShape:', baseShape);
            debugLog('🔍 variant:', variant);
            
            // KORRIGIERT: Kombiniere baseShape + variant richtig
            let finalVariant = variant;
            
            // Spezial-Mapping für Dreieck-Formen
            if (baseShape === 'dreieck') {
                debugLog('📐 DREIECK-MAPPING für variant:', variant);
                switch (variant) {
                    case 'dreieck':
                    case 'gleichseitig':
                        finalVariant = 'dreieck';
                        debugLog('✅ Mapped zu: dreieck (Gleichseitig)');
                        break;
                    case 'rechtwinklig':
                        finalVariant = 'rechtwinklig';
                        debugLog('✅ Mapped zu: rechtwinklig');
                        break;
                    case 'ungleichschenklig':
                        finalVariant = 'ungleichschenklig';
                        debugLog('✅ Mapped zu: ungleichschenklig');
                        break;
                    default:
                        finalVariant = 'rechtwinklig'; // Fallback für Dreiecke
                        debugLog('⚠️ Unbekannte Dreieck-Variante, Fallback zu: rechtwinklig');
                }
            }
            
            // Spezial-Mapping für Viereck-Formen
            else if (baseShape === 'viereck') {
                debugLog('📦 VIERECK-MAPPING für variant:', variant);
                switch (variant) {
                    case 'rechteck':
                        finalVariant = 'rechteck';
                        debugLog('✅ Mapped zu: rechteck');
                        break;
                    case 'quadrat':
                        finalVariant = 'quadrat';
                        debugLog('✅ Mapped zu: quadrat');
                        break;
                    case 'trapez':
                        finalVariant = 'trapez';
                        debugLog('✅ Mapped zu: trapez');
                        break;
                    case 'parallelogramm':
                        finalVariant = 'parallelogramm';
                        debugLog('✅ Mapped zu: parallelogramm');
                        break;
                    case 'rhombus':
                        finalVariant = 'rhombus';
                        debugLog('✅ Mapped zu: rhombus');
                        break;
                    default:
                        finalVariant = 'rechteck'; // Fallback für Vierecke
                        debugLog('⚠️ Unbekannte Viereck-Variante, Fallback zu: rechteck');
                }
            }
            
            // Spezial-Mapping für Kreis-Formen
            else if (baseShape === 'kreis') {
                debugLog('⭕ KREIS-MAPPING für variant:', variant);
                switch (variant) {
                    case 'kreis':
                        finalVariant = 'kreis';
                        debugLog('✅ Mapped zu: kreis');
                        break;
                    case 'oval':
                        finalVariant = 'oval';
                        debugLog('✅ Mapped zu: oval');
                        break;
                    case 'halbkreis':
                    case 'viertelkreis':
                    case 'langloch':
                        finalVariant = 'kreis'; // Vereinfacht zu Kreis
                        debugLog('✅ Mapped zu: kreis (vereinfacht)');
                        break;
                    default:
                        finalVariant = 'kreis';
                        debugLog('⚠️ Unbekannte Kreis-Variante, Fallback zu: kreis');
                }
            }
            
            // Spezial-Mapping für Vieleck-Formen
            else if (baseShape === 'vieleck') {
                debugLog('🔷 VIELECK-MAPPING für variant:', variant);
                switch (variant) {
                    case 'lform':
                        finalVariant = 'lform';
                        debugLog('✅ Mapped zu: lform');
                        break;
                    case 'tform':
                        finalVariant = 'tform';
                        debugLog('✅ Mapped zu: tform');
                        break;
                    case 'uform':
                        finalVariant = 'uform';
                        debugLog('✅ Mapped zu: uform');
                        break;
                    case 'fuenfeck':
                        finalVariant = 'fuenfeck';
                        debugLog('✅ Mapped zu: fuenfeck');
                        break;
                    case 'sechseck':
                        finalVariant = 'sechseck';
                        debugLog('✅ Mapped zu: sechseck');
                        break;
                    case 'achteck':
                        finalVariant = 'achteck';
                        debugLog('✅ Mapped zu: achteck');
                        break;
                    default:
                        finalVariant = 'lform'; // Fallback für Vielecke
                        debugLog('⚠️ Unbekannte Vieleck-Variante, Fallback zu: lform');
                }
            }
            
            // Fallback: Verwende variantMapping wenn kein baseShape Match
            else {
                debugLog('❓ UNBEKANNTE baseShape, verwende variantMapping');
                finalVariant = variantMapping[variant] || variant;
                debugLog('Gemappt über variantMapping:', variant, '→', finalVariant);
            }
            
            debugLog('🎯 Final gemappte Variante:', finalVariant);
            
            // Validierung: Existiert die Form in unseren Definitionen?
            if (shapeInfo[finalVariant]) {
                debugLog('✅ Form gefunden in shapeInfo:', finalVariant);
                debugLog('🏁 RÜCKGABE:', finalVariant);
                return finalVariant;
            } else {
                debugLog('❌ Form nicht in shapeInfo gefunden:', finalVariant);
                debugLog('Verfügbare Formen:', Object.keys(shapeInfo));
                debugLog('⚠️ Fallback zu rechtwinklig');
            }
        } else {
            debugLog('❌ Keine roofShape gefunden in projectData');
        }
        
        debugLog('🔄 FINAL FALLBACK: rechtwinklig');
        return 'rechtwinklig';
    }

    // Form-Info anzeigen
    function displayShapeInfo() {
        debugLog('=== LADE FORM-INFO ===');
        
        var info = shapeInfo[selectedVariant];
        if (info) {
            var titleElement = document.querySelector('.shape-title');
            var descElement = document.querySelector('.shape-description');
            
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
        
        var dimensionsGrid = document.querySelector('.dimensions-grid');
        if (!dimensionsGrid) {
            debugLog('dimensions-grid nicht gefunden!');
            return;
        }
        
        // Bestehende Inputs löschen
        dimensionsGrid.innerHTML = '';
        
        var info = shapeInfo[selectedVariant];
        if (!info || !info.dimensions) {
            debugLog('Keine Dimensions-Info für:', selectedVariant);
            return;
        }
        
        // Neue Inputs für die aktuelle Form erstellen
        info.dimensions.forEach(function(dimKey) {
            var config = dimensionConfig[dimKey];
            if (!config) {
                debugLog('Keine Config für Dimension:', dimKey);
                return;
            }
            
            var container = document.createElement('div');
            container.className = 'dimension-input';
            container.innerHTML = `
                <label class="dimension-label">${config.label}</label>
                <div style="display: flex; align-items: center;">
                    <input type="number" class="dimension-value" data-dimension="${dimKey}" 
                           value="${config.default}" min="${config.min}" max="${config.max}" step="0.1">
                    <span class="dimension-unit">${config.unit}</span>
                </div>
            `;
            dimensionsGrid.appendChild(container);
            
            // Event Listener für das neue Input
            var input = container.querySelector('.dimension-value');
            input.addEventListener('input', function(e) {
                var dimension = e.target.getAttribute('data-dimension');
                var value = parseFloat(e.target.value);
                if (!isNaN(value)) {
                    currentDimensions[dimension] = value;
                    updatePreview();
                    updateCalculation();
                }
            });
            
            // Standardwert in currentDimensions setzen
            currentDimensions[dimKey] = config.default;
        });
        
        debugLog('Inputs erstellt für Form:', selectedVariant);
        debugLog('Aktuelle Dimensionen:', currentDimensions);
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
        var scale = 80; // Vergrößert für bessere Sichtbarkeit
        
        switch (selectedVariant) {
            case 'trapez':
                var bottomBase = (dims.bottomBase || 8) * scale;
                var topBase = (dims.topBase || 6) * scale;
                var height = (dims.height || 4) * scale;
                var points = (-bottomBase/2) + ',' + (height/2) + ' ' + 
                           (bottomBase/2) + ',' + (height/2) + ' ' + 
                           (topBase/2) + ',' + (-height/2) + ' ' + 
                           (-topBase/2) + ',' + (-height/2);
                return '<polygon points="' + points + '" fill="url(#shapeGradient)" stroke="#007bff" stroke-width="5" filter="url(#shadowEffect)"/>';
                
            case 'rechteck':
                var length = (dims.length || 8) * scale;
                var width = (dims.width || 5) * scale;
                return '<rect x="' + (-length/2) + '" y="' + (-width/2) + '" width="' + length + '" height="' + width + '" fill="url(#shapeGradient)" stroke="#007bff" stroke-width="5" filter="url(#shadowEffect)"/>';
                
            case 'quadrat':
                var side = (dims.side || 5) * scale;
                return '<rect x="' + (-side/2) + '" y="' + (-side/2) + '" width="' + side + '" height="' + side + '" fill="url(#shapeGradient)" stroke="#007bff" stroke-width="5" filter="url(#shadowEffect)"/>';
                
            case 'kreis':
                var radius = (dims.radius || 4) * scale;
                return '<circle cx="0" cy="0" r="' + radius + '" fill="url(#shapeGradient)" stroke="#007bff" stroke-width="5" filter="url(#shadowEffect)"/>';
                
            case 'oval':
                var rx = (dims.radiusX || 5) * scale;
                var ry = (dims.radiusY || 3) * scale;
                return '<ellipse cx="0" cy="0" rx="' + rx + '" ry="' + ry + '" fill="url(#shapeGradient)" stroke="#007bff" stroke-width="5" filter="url(#shadowEffect)"/>';
                
            case 'dreieck':
                var sideEq = (dims.side || 5) * scale;
                var heightEq = sideEq * Math.sqrt(3) / 2;
                var pointsEq = '0,' + (-heightEq*2/3) + ' ' + (-sideEq/2) + ',' + (heightEq/3) + ' ' + (sideEq/2) + ',' + (heightEq/3);
                return '<polygon points="' + pointsEq + '" fill="url(#shapeGradient)" stroke="#007bff" stroke-width="5" filter="url(#shadowEffect)"/>';
                
            case 'rechtwinklig':
                var katheteA = (dims.katheteA || 4) * scale;
                var katheteB = (dims.katheteB || 5) * scale;
                var pointsRight = '0,0 ' + katheteA + ',0 0,' + (-katheteB);
                return '<polygon points="' + pointsRight + '" fill="url(#shapeGradient)" stroke="#007bff" stroke-width="5" filter="url(#shadowEffect)"/>';
                
            case 'ungleichschenklig':
                var sideA = (dims.sideA || 5) * scale;
                var sideB = (dims.sideB || 6) * scale;
                var sideC = (dims.sideC || 7) * scale;
                // Vereinfachte Darstellung als ungleichschenkliges Dreieck
                var pointsUngleich = '0,' + (-sideA*0.6) + ' ' + (-sideB*0.4) + ',' + (sideA*0.4) + ' ' + (sideC*0.4) + ',' + (sideA*0.4);
                return '<polygon points="' + pointsUngleich + '" fill="url(#shapeGradient)" stroke="#007bff" stroke-width="5" filter="url(#shadowEffect)"/>';
                
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
                return '<polygon points="' + lPoints.join(' ') + '" fill="url(#shapeGradient)" stroke="#007bff" stroke-width="5" filter="url(#shadowEffect)"/>';
                
            case 'tform':
                var totalLength = (dims.totalLength || 10) * scale;
                var totalWidth = (dims.totalWidth || 8) * scale;
                var cutoutLength = (dims.cutoutLength || 3) * scale;
                var cutoutWidth = (dims.cutoutWidth || 3) * scale;
                
                var tPoints = [
                    (-totalLength/2) + ',' + (-totalWidth/2),
                    (totalLength/2) + ',' + (-totalWidth/2),
                    (totalLength/2) + ',' + (-totalWidth/2 + cutoutWidth),
                    (cutoutLength/2) + ',' + (-totalWidth/2 + cutoutWidth),
                    (cutoutLength/2) + ',' + (totalWidth/2),
                    (-cutoutLength/2) + ',' + (totalWidth/2),
                    (-cutoutLength/2) + ',' + (-totalWidth/2 + cutoutWidth),
                    (-totalLength/2) + ',' + (-totalWidth/2 + cutoutWidth)
                ];
                return '<polygon points="' + tPoints.join(' ') + '" fill="url(#shapeGradient)" stroke="#007bff" stroke-width="5" filter="url(#shadowEffect)"/>';
                
            default:
                return '<rect x="-100" y="-75" width="200" height="150" fill="url(#shapeGradient)" stroke="#007bff" stroke-width="5" filter="url(#shadowEffect)"/>';
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

    // Bemaßung-SVG generieren
    function getDimensionsSVG() {
        var dims = currentDimensions;
        var scale = 80;
        var offset = 120;
        
        switch (selectedVariant) {
            case 'trapez':
                var bottomBase = (dims.bottomBase || 8) * scale;
                var topBase = (dims.topBase || 6) * scale;
                var height = (dims.height || 4) * scale;
                
                return [
                    // Untere Basis
                    '<line x1="' + (500-bottomBase/2) + '" y1="' + (500+height/2+offset) + '" x2="' + (500+bottomBase/2) + '" y2="' + (500+height/2+offset) + '" stroke="#ff6b6b" stroke-width="3" stroke-dasharray="5,5" marker-start="url(#arrowhead)" marker-end="url(#arrowhead)"/>',
                    '<text x="500" y="' + (500+height/2+offset+25) + '" text-anchor="middle" font-size="16" font-weight="bold" fill="#ff6b6b">' + (dims.bottomBase || 8) + 'm</text>',
                    // Obere Basis
                    '<line x1="' + (500-topBase/2) + '" y1="' + (500-height/2-offset) + '" x2="' + (500+topBase/2) + '" y2="' + (500-height/2-offset) + '" stroke="#ff6b6b" stroke-width="3" stroke-dasharray="5,5" marker-start="url(#arrowhead)" marker-end="url(#arrowhead)"/>',
                    '<text x="500" y="' + (500-height/2-offset-10) + '" text-anchor="middle" font-size="16" font-weight="bold" fill="#ff6b6b">' + (dims.topBase || 6) + 'm</text>',
                    // Höhe
                    '<line x1="' + (500-bottomBase/2-offset) + '" y1="' + (500-height/2) + '" x2="' + (500-bottomBase/2-offset) + '" y2="' + (500+height/2) + '" stroke="#ff6b6b" stroke-width="3" stroke-dasharray="5,5" marker-start="url(#arrowhead)" marker-end="url(#arrowhead)"/>',
                    '<text x="' + (500-bottomBase/2-offset-25) + '" y="500" text-anchor="middle" font-size="16" font-weight="bold" fill="#ff6b6b" transform="rotate(-90 ' + (500-bottomBase/2-offset-25) + ' 500)">' + (dims.height || 4) + 'm</text>'
                ].join('');
                
            case 'rechteck':
                var length = (dims.length || 8) * scale;
                var width = (dims.width || 5) * scale;
                
                return [
                    // Länge
                    '<line x1="' + (500-length/2) + '" y1="' + (500+width/2+offset) + '" x2="' + (500+length/2) + '" y2="' + (500+width/2+offset) + '" stroke="#ff6b6b" stroke-width="3" stroke-dasharray="5,5" marker-start="url(#arrowhead)" marker-end="url(#arrowhead)"/>',
                    '<text x="500" y="' + (500+width/2+offset+25) + '" text-anchor="middle" font-size="16" font-weight="bold" fill="#ff6b6b">' + (dims.length || 8) + 'm</text>',
                    // Breite
                    '<line x1="' + (500-length/2-offset) + '" y1="' + (500-width/2) + '" x2="' + (500-length/2-offset) + '" y2="' + (500+width/2) + '" stroke="#ff6b6b" stroke-width="3" stroke-dasharray="5,5" marker-start="url(#arrowhead)" marker-end="url(#arrowhead)"/>',
                    '<text x="' + (500-length/2-offset-25) + '" y="500" text-anchor="middle" font-size="16" font-weight="bold" fill="#ff6b6b" transform="rotate(-90 ' + (500-length/2-offset-25) + ' 500)">' + (dims.width || 5) + 'm</text>'
                ].join('');
                
            case 'rechtwinklig':
                var katheteA = (dims.katheteA || 4) * scale;
                var katheteB = (dims.katheteB || 5) * scale;
                
                return [
                    // Kathete A (horizontal)
                    '<line x1="500" y1="' + (500+offset+40) + '" x2="' + (500+katheteA) + '" y2="' + (500+offset+40) + '" stroke="#ff6b6b" stroke-width="3" stroke-dasharray="5,5" marker-start="url(#arrowhead)" marker-end="url(#arrowhead)"/>',
                    '<text x="' + (500+katheteA/2) + '" y="' + (500+offset+65) + '" text-anchor="middle" font-size="16" font-weight="bold" fill="#ff6b6b">' + (dims.katheteA || 4) + 'm</text>',
                    // Kathete B (vertikal)
                    '<line x1="' + (500-offset-40) + '" y1="500" x2="' + (500-offset-40) + '" y2="' + (500-katheteB) + '" stroke="#ff6b6b" stroke-width="3" stroke-dasharray="5,5" marker-start="url(#arrowhead)" marker-end="url(#arrowhead)"/>',
                    '<text x="' + (500-offset-65) + '" y="' + (500-katheteB/2) + '" text-anchor="middle" font-size="16" font-weight="bold" fill="#ff6b6b" transform="rotate(-90 ' + (500-offset-65) + ' ' + (500-katheteB/2) + ')">' + (dims.katheteB || 5) + 'm</text>',
                    // Rechter Winkel Symbol
                    '<path d="M ' + (500+30) + ' 500 L ' + (500+30) + ' ' + (500-30) + ' L 500 ' + (500-30) + '" stroke="#007bff" stroke-width="4" fill="none"/>',
                    '<text x="' + (500+40) + '" y="' + (500-40) + '" font-size="16" fill="#007bff">90°</text>'
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
                
            case 'ungleichschenklig':
                // Vereinfachte Berechnung mit Heron's Formel
                var a = dims.sideA || 5;
                var b = dims.sideB || 6;
                var c = dims.sideC || 7;
                var s = (a + b + c) / 2;
                return Math.sqrt(s * (s - a) * (s - b) * (s - c));
                
            case 'lform':
                var totalLength = dims.totalLength || 10;
                var totalWidth = dims.totalWidth || 8;
                var cutoutLength = dims.cutoutLength || 4;
                var cutoutWidth = dims.cutoutWidth || 4;
                return (totalLength * totalWidth) - (cutoutLength * cutoutWidth);
                
            case 'tform':
                var totalLength = dims.totalLength || 10;
                var totalWidth = dims.totalWidth || 8;
                var cutoutLength = dims.cutoutLength || 3;
                var cutoutWidth = dims.cutoutWidth || 3;
                // T-Form: Gesamtfläche minus zwei Ausschnitte
                return (totalLength * cutoutWidth) + (cutoutLength * (totalWidth - cutoutWidth));
                
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
        window.location.href = 'dachform.html';
    }

    // Test-Funktionen
    window.testShape = function(variant) {
        debugLog('🧪 TESTE FORM:', variant);
        
        if (!shapeInfo[variant]) {
            debugLog('❌ Unbekannte Form:', variant);
            return;
        }
        
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
        
        debugLog('✅ Form gewechselt zu:', variant);
    };

    // DIREKTE Form-Setzung ohne Daten-Abhängigkeit
    window.forceShape = function(variant) {
        debugLog('🔧 FORCE SHAPE:', variant);
        
        if (!shapeInfo[variant]) {
            console.error('❌ Unbekannte Form:', variant);
            console.log('Verfügbare Formen:', Object.keys(shapeInfo));
            return;
        }
        
        // Überschreibe selectedVariant direkt
        selectedVariant = variant;
        
        // Setze auch currentProjectData
        currentProjectData.roofShape = {
            baseShape: 'test',
            variant: variant,
            timestamp: Date.now()
        };
        
        // UI komplett neu aufbauen
        displayShapeInfo();
        createDimensionInputs();
        updatePreview();
        updateCalculation();
        
        console.log('✅ Form DIREKT gesetzt zu:', variant);
        console.log('Aktuelle selectedVariant:', selectedVariant);
    };

    // Debug aktuelle Situation
    window.debugCurrentForm = function() {
        console.log('=== AKTUELLE FORM DEBUG ===');
        console.log('selectedVariant:', selectedVariant);
        console.log('currentProjectData:', currentProjectData);
        console.log('localStorage:', localStorage.getItem('dachplattenrechner_data'));
        
        const extracted = determineShapeFromProject();
        console.log('determineShapeFromProject() returns:', extracted);
        
        console.log('shapeInfo keys:', Object.keys(shapeInfo));
        console.log('shapeInfo[selectedVariant]:', shapeInfo[selectedVariant]);
    };

    // Teste alle verfügbaren Formen
    window.testAllShapes = function() {
        const shapes = Object.keys(shapeInfo);
        console.log('🧪 TESTE ALLE FORMEN:', shapes);
        
        shapes.forEach((shape, index) => {
            setTimeout(() => {
                console.log(`\n=== TEST ${index + 1}/${shapes.length}: ${shape} ===`);
                forceShape(shape);
            }, index * 2000);
        });
    };

    // Globale Funktionen
    window.saveAndContinue = saveAndContinue;
    window.goBack = goBack;
    window.availableShapes = Object.keys(shapeInfo);

    // Initialisierung
    document.addEventListener('DOMContentLoaded', function() {
        debugLog('=== SEITE GELADEN ===');
        
        currentProjectData = loadData();
        
        // KORRIGIERT: Form-Bestimmung aus Projektdaten
        selectedVariant = determineShapeFromProject();
        debugLog('Bestimmte Form:', selectedVariant);
        
        // Standard-Dimensionen für die bestimmte Form setzen
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
                    baseShape: 'dreieck',
                    variant: 'rechtwinklig'
                }
            };
            debugLog('🔄 Demo-Daten gesetzt');
        }
        
        displayShapeInfo();
        createDimensionInputs();
        updatePreview();
        updateCalculation();
        
        // Event Listeners für Navigation
        var backBtn = document.getElementById('btn-back');
        var continueBtn = document.getElementById('btn-continue');
        
        if (backBtn) backBtn.addEventListener('click', goBack);
        if (continueBtn) continueBtn.addEventListener('click', saveAndContinue);
        
        debugLog('✅ Initialisierung abgeschlossen für Form:', selectedVariant);
    });

    debugLog('formauswahl.js geladen - REPARIERTE VERSION mit korrektem Form-Mapping');

})(); debugLog(message, data) {
        console.log('[FORMAUSWAHL] ' + message, data || '');
    }

    // KORRIGIERTES Form-Mapping zwischen dachform.js und formauswahl.js
    const variantMapping = {
        // Kreis-Formen
        'kreis': 'kreis',
        'oval': 'oval',
        'halbkreis': 'kreis',
        'viertelkreis': 'kreis',
        'langloch': 'oval',
        
        // Dreieck-Formen  
        'dreieck': 'dreieck',
        'rechtwinklig': 'rechtwinklig',
        'ungleichschenklig': 'ungleichschenklig',
        
        // Viereck-Formen
        'rechteck': 'rechteck',
        'quadrat': 'quadrat',
        'parallelogramm': 'parallelogramm',
        'trapez': 'trapez',
        'rhombus': 'rhombus',
        
        // Vieleck-Formen
        'fuenfeck': 'fuenfeck',
        'sechseck': 'sechseck',
        'achteck': 'achteck',
        'lform': 'lform',
        'tform': 'tform',
        'uform': 'uform'
    };

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

    // KORRIGIERTE Form-Informationen - Mapping zur Dachform-Auswahl
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
        },
        tform: {
            name: 'T-Form',
            description: 'T-förmige Grundform',
            dimensions: ['totalLength', 'totalWidth', 'cutoutLength', 'cutoutWidth']
        },
        uform: {
            name: 'U-Form', 
            description: 'U-förmige Grundform',
            dimensions: ['totalLength', 'totalWidth', 'cutoutLength', 'cutoutWidth']
        },
        fuenfeck: {
            name: 'Fünfeck',
            description: 'Polygon mit 5 Ecken',
            dimensions: ['side']
        },
        sechseck: {
            name: 'Sechseck',
            description: 'Polygon mit 6 Ecken',
            dimensions: ['side']
        },
        achteck: {
            name: 'Achteck',
            description: 'Polygon mit 8 Ecken',
            dimensions: ['side']
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

    function
