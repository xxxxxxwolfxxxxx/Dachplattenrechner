// Editor Implementierung hier - vereinfachte Version für bessere Performance
class KantteileEditor {
    constructor() {
        this.canvas = document.getElementById('drawingCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.elements = [];
        this.currentElement = null;
        this.activePoints = [];
        this.isDrawing = false;
        this.drawingMode = null;
        this.mousePos = { x: 0, y: 0 };
        this.startPos = { x: 500, y: 300 };
        this.scale = 20;
        this.zoom = 1;
        this.panX = 0;
        this.panY = 0;
        this.isPanning = false;
        this.lastPanPoint = { x: 0, y: 0 };
        this.measurementLabels = [];
        this.colorSide = 'top'; // 'top' oder 'bottom'
        
        // Einstellungen von URL-Parametern laden
        this.loadSettings();
        this.initCanvas();
        this.setupEventListeners();
        this.render();
    }
    
    loadSettings() {
        const params = new URLSearchParams(window.location.search);
        this.settings = {
            thickness: parseFloat(params.get('thickness')) || 0.6,
            firstLineType: params.get('firstLineType') || 'horizontal',
            frontColor: params.get('frontColor') || '#8B4513',
            backColor: params.get('backColor') || '#B8B799',
            selectedColorCode: params.get('selectedColorCode') || '8004'
        };
    }
    
    initCanvas() {
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());
    }
    
    resizeCanvas() {
        const container = this.canvas.parentElement;
        this.canvas.width = container.clientWidth;
        this.canvas.height = container.clientHeight;
        this.render();
    }
    
    setupEventListeners() {
        this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        this.canvas.addEventListener('click', (e) => this.handleClick(e));
        this.canvas.addEventListener('wheel', (e) => this.handleWheel(e));
        this.canvas.addEventListener('mousedown', (e) => this.handleMouseDown(e));
        this.canvas.addEventListener('mouseup', (e) => this.handleMouseUp(e));
        this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());
        
        document.addEventListener('keydown', (e) => this.handleKeyDown(e));
        
        this.canvas.setAttribute('tabindex', '0');
        this.canvas.focus();
    }
    
    handleMouseMove(e) {
        const rect = this.canvas.getBoundingClientRect();
        const screenPos = {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        };
        
        if (this.isPanning) {
            const deltaX = e.clientX - this.lastPanPoint.x;
            const deltaY = e.clientY - this.lastPanPoint.y;
            
            this.panX += deltaX;
            this.panY += deltaY;
            
            this.lastPanPoint = { x: e.clientX, y: e.clientY };
            this.render();
            return;
        }
        
        this.mousePos = this.getWorldCoordinates(screenPos.x, screenPos.y);
        
        if (this.isDrawing) {
            if (this.drawingMode === 'line') {
                this.updateLineFromMouse();
            } else if (this.drawingMode === 'curve') {
                this.updateCurveFromMouse();
            }
            this.render();
        }
    }
    
    handleClick(e) {
        if (this.isPanning) return;
        if (e.ctrlKey || e.metaKey) return;
        
        const rect = this.canvas.getBoundingClientRect();
        const screenPos = {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        };
        
        // Prüfe auf Klick auf aktive Punkte
        const clickedPoint = this.activePoints.find(point => {
            const screenPoint = this.getScreenCoordinates(point.x, point.y);
            const distance = Math.sqrt(
                Math.pow(screenPos.x - screenPoint.x, 2) + 
                Math.pow(screenPos.y - screenPoint.y, 2)
            );
            return distance < 15;
        });
        
        if (clickedPoint) {
            this.handlePointClick(clickedPoint);
            return;
        }
        
        if (this.isDrawing) {
            this.confirmCurrentElement();
        }
    }
    
    handleWheel(e) {
        e.preventDefault();
        
        const rect = this.canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        
        const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
        const newZoom = Math.max(0.1, Math.min(10, this.zoom * zoomFactor));
        
        const worldMouseX = (mouseX - this.panX) / this.zoom;
        const worldMouseY = (mouseY - this.panY) / this.zoom;
        
        this.zoom = newZoom;
        
        this.panX = mouseX - worldMouseX * this.zoom;
        this.panY = mouseY - worldMouseY * this.zoom;
        
        this.render();
    }
    
    handleMouseDown(e) {
        if (e.button === 1) { // Mittlere Maustaste
            e.preventDefault();
            this.isPanning = true;
            this.lastPanPoint = { x: e.clientX, y: e.clientY };
            this.canvas.style.cursor = 'grabbing';
        }
    }
    
    handleMouseUp(e) {
        if (this.isPanning && e.button === 1) {
            this.isPanning = false;
            this.canvas.style.cursor = 'crosshair';
        }
    }
    
    handleKeyDown(e) {
        if (e.key === 'Escape') {
            closeEditor();
            return;
        }
        
        if (!this.isDrawing) return;
        
        if (e.key === 'Enter') {
            this.confirmCurrentElement();
        } else if (e.key === ' ') {
            e.preventDefault();
            if (this.drawingMode === 'line') {
                this.showModal('lengthModal');
            } else if (this.drawingMode === 'curve') {
                this.showModal('angleModal');
            }
        }
    }
    
    getWorldCoordinates(screenX, screenY) {
        return {
            x: (screenX - this.panX) / this.zoom,
            y: (screenY - this.panY) / this.zoom
        };
    }
    
    getScreenCoordinates(worldX, worldY) {
        return {
            x: worldX * this.zoom + this.panX,
            y: worldY * this.zoom + this.panY
        };
    }
    
    startDrawing() {
        this.clearCanvas();
        this.isDrawing = true;
        this.drawingMode = 'line';
        
        // Bestimme Startrichtung basierend auf Farbseite
        let startDirection = this.settings.firstLineType;
        if (this.colorSide === 'bottom') {
            // Wenn Unterseite gewählt, drehe die Richtung um
            if (startDirection === 'horizontal') {
                startDirection = 'horizontal'; // Bleibt horizontal, aber andere Richtung im Rendering
            } else {
                startDirection = 'vertical'; // Richtung bleibt gleich
            }
        }
        
        this.currentElement = {
            type: 'line',
            start: { ...this.startPos },
            end: { ...this.startPos },
            direction: startDirection,
            length: 0,
            thickness: this.settings.thickness
        };
        
        this.updateStatus('Bewegen Sie die Maus oder drücken Sie Leertaste für manuelle Eingabe. Bestätigen mit Linksklick oder Enter.');
        document.getElementById('startBtn').style.display = 'none';
        this.showValueOverlay();
        this.render();
    }
    
    updateLineFromMouse() {
        if (!this.currentElement || this.currentElement.type !== 'line') return;
        
        const start = this.currentElement.start;
        let length;
        
        if (this.currentElement.direction === 'horizontal') {
            length = Math.abs(this.mousePos.x - start.x) / this.scale;
            this.currentElement.end = {
                x: this.mousePos.x,
                y: start.y
            };
        } else if (this.currentElement.direction === 'vertical') {
            length = Math.abs(this.mousePos.y - start.y) / this.scale;
            this.currentElement.end = {
                x: start.x,
                y: this.mousePos.y
            };
        } else if (this.currentElement.direction === 'tangential') {
            const lineAngle = this.currentElement.angle;
            const dx = this.mousePos.x - start.x;
            const dy = this.mousePos.y - start.y;
            
            // Projiziere nur in Fahrtrichtung
            const projectedLength = dx * Math.cos(lineAngle) + dy * Math.sin(lineAngle);
            
            // Verhindere Rückwärtszeichnung
            if (projectedLength < 0) {
                this.currentElement.end = { ...start };
                length = 0;
            } else {
                length = projectedLength / this.scale;
                this.currentElement.end = {
                    x: start.x + Math.cos(lineAngle) * projectedLength,
                    y: start.y + Math.sin(lineAngle) * projectedLength
                };
            }
        }
        
        this.currentElement.length = Math.round(length);
        document.getElementById('currentLength').textContent = this.currentElement.length;
        this.updateValueOverlay(this.currentElement.length + ' mm');
    }
    
    updateCurveFromMouse() {
        if (!this.currentElement || this.currentElement.type !== 'curve') return;
        
        const startAngle = this.currentElement.startAngle;
        const currentDisplayAngle = parseInt(document.getElementById('currentAngle').textContent) || 0;
        
        // 1. Erst Kurve mit aktuellem Winkel berechnen für korrektes Ende
        this.calculateCurveEndpoint();
        const curveEnd = this.currentElement.end || this.currentElement.start;
        
        // 2. Berechne Winkel vom Kurvenende zur Maus (nicht vom Start!)
        const dx = this.mousePos.x - curveEnd.x;
        const dy = this.mousePos.y - curveEnd.y;
        const mouseLineAngle = Math.atan2(dy, dx);
        let relativeAngle = mouseLineAngle - startAngle;
        
        while (relativeAngle > Math.PI) relativeAngle -= 2 * Math.PI;
        while (relativeAngle < -Math.PI) relativeAngle += 2 * Math.PI;
        
        let rawAngleDegrees = relativeAngle * 180 / Math.PI;
        
        // 3. Wende Hysterese auf den Winkel an
        let finalAngle = rawAngleDegrees;
        
        const distanceFromStart = Math.sqrt(
            Math.pow(this.mousePos.x - this.currentElement.start.x, 2) + 
            Math.pow(this.mousePos.y - this.currentElement.start.y, 2)
        );
        const pufferDistance = 4 * this.currentElement.radius;
        const isInPufferZone = distanceFromStart > pufferDistance;
        
        if (Math.abs(rawAngleDegrees) >= 180) {
            if (Math.abs(currentDisplayAngle) < 180) {
                finalAngle = (rawAngleDegrees > 0) ? 180 : -180;
            } else {
                if (isInPufferZone) {
                    if (currentDisplayAngle > 0 && rawAngleDegrees < -180) {
                        finalAngle = -180;
                    } else if (currentDisplayAngle < 0 && rawAngleDegrees > 180) {
                        finalAngle = 180;
                    } else {
                        finalAngle = currentDisplayAngle;
                    }
                } else {
                    finalAngle = currentDisplayAngle;
                }
            }
        } else if (Math.abs(currentDisplayAngle) >= 180) {
            if (Math.abs(rawAngleDegrees) < 160) {
                finalAngle = rawAngleDegrees;
            } else {
                finalAngle = currentDisplayAngle;
            }
        }
        
        // 4. Setze den Winkel und berechne die Kurve neu
        finalAngle = Math.round(finalAngle);
        this.currentElement.angle = finalAngle;
        this.calculateCurveEndpoint();
        
        // 5. Grüne Linie ist IMMER eine Verlängerung der Kurve
        const newCurveEnd = this.currentElement.end || this.currentElement.start;
        const curveEndAngle = this.currentElement.endAngle || (startAngle + finalAngle * Math.PI / 180);
        
        const length = 100;
        const helperEndX = newCurveEnd.x + Math.cos(curveEndAngle) * length;
        const helperEndY = newCurveEnd.y + Math.sin(curveEndAngle) * length;
        
        // 6. Speichere und zeige an
        this.helperLineEnd = { x: helperEndX, y: helperEndY };
        document.getElementById('currentAngle').textContent = finalAngle;
        this.updateValueOverlay(finalAngle + '°');
    }
    
    showValueOverlay() {
        document.getElementById('valueOverlay').style.display = 'block';
    }
    
    hideValueOverlay() {
        document.getElementById('valueOverlay').style.display = 'none';
    }
    
    updateValueOverlay(text) {
        document.getElementById('valueText').textContent = text;
    }
    
    getDistanceToOriginalLine(point) {
        // Berechne die Distanz vom Punkt zur ursprünglichen Startlinie
        const start = this.currentElement.start;
        const startAngle = this.currentElement.startAngle;
        
        // Erstelle einen Punkt auf der ursprünglichen Linie
        const linePoint = {
            x: start.x + Math.cos(startAngle) * 1000, // Lange Linie
            y: start.y + Math.sin(startAngle) * 1000
        };
        
        // Berechne Distanz von Punkt zur Linie
        const A = start.y - linePoint.y;
        const B = linePoint.x - start.x;
        const C = start.x * linePoint.y - linePoint.x * start.y;
        
        const distance = Math.abs(A * point.x + B * point.y + C) / Math.sqrt(A * A + B * B);
        return distance;
    }
    
    calculateCurveFromAngle() {
        // Hilfsmethode für rekursive Berechnung
        if (!this.currentElement || this.currentElement.type !== 'curve') return;
        this.calculateCurveEndpoint();
    }
    
    calculateCurveEndpoint() {
        if (!this.currentElement || this.currentElement.type !== 'curve') return;
        
        const { start, radius, startAngle, angle } = this.currentElement;
        
        if (angle === 0) {
            this.currentElement.end = { ...start };
            return;
        }
        
        const angleRad = angle * Math.PI / 180;
        const centerAngle = startAngle + (angle > 0 ? Math.PI/2 : -Math.PI/2);
        
        const center = {
            x: start.x + Math.cos(centerAngle) * radius,
            y: start.y + Math.sin(centerAngle) * radius
        };
        
        const startAngleFromCenter = startAngle + (angle > 0 ? -Math.PI/2 : Math.PI/2);
        const endAngleFromCenter = startAngleFromCenter + angleRad;
        
        this.currentElement.end = {
            x: center.x + Math.cos(endAngleFromCenter) * radius,
            y: center.y + Math.sin(endAngleFromCenter) * radius
        };
        
        this.currentElement.endAngle = startAngle + angleRad;
        this.currentElement.center = center;
        this.currentElement.startAngleFromCenter = startAngleFromCenter;
        this.currentElement.endAngleFromCenter = endAngleFromCenter;
    }
    
    handlePointClick(point) {
        this.activePoints = this.activePoints.filter(p => p !== point);
        
        this.drawingMode = 'curve';
        this.isDrawing = true;
        
        const lastElement = this.elements[this.elements.length - 1];
        const travelDirection = this.getTravelDirection(lastElement);
        
        if (lastElement && lastElement.type === 'line') {
            const radiusMM = 1;
            this.shortenLastLine(lastElement, radiusMM);
            point = { ...lastElement.end };
        }
        
        this.currentElement = {
            type: 'curve',
            start: { ...point },
            radius: 1 * this.scale,
            startAngle: travelDirection,
            angle: 0,
            end: { ...point }
        };
        
        this.showValueOverlay();
        this.updateStatus('Wählen Sie den Biegewinkel (-180° bis +180°). Negativ = links, Positiv = rechts.');
        this.render();
    }
    
    getTravelDirection(lastElement) {
        if (!lastElement) return 0;
        
        if (lastElement.type === 'line') {
            if (lastElement.direction === 'tangential') {
                return lastElement.angle;
            } else if (lastElement.direction === 'horizontal') {
                return lastElement.end.x > lastElement.start.x ? 0 : Math.PI;
            } else {
                return lastElement.end.y > lastElement.start.y ? Math.PI/2 : -Math.PI/2;
            }
        } else if (lastElement.type === 'curve') {
            return lastElement.endAngle;
        }
        
        return 0;
    }
    
    shortenLastLine(lineElement, radiusMM) {
        const radiusPixels = radiusMM * this.scale;
        
        if (!lineElement.originalLength) {
            lineElement.originalLength = lineElement.length;
        }
        
        if (lineElement.direction === 'tangential') {
            const lineAngle = lineElement.angle;
            lineElement.end = {
                x: lineElement.end.x - Math.cos(lineAngle) * radiusPixels,
                y: lineElement.end.y - Math.sin(lineAngle) * radiusPixels
            };
        } else if (lineElement.direction === 'horizontal') {
            if (lineElement.end.x > lineElement.start.x) {
                lineElement.end.x -= radiusPixels;
            } else {
                lineElement.end.x += radiusPixels;
            }
        } else {
            if (lineElement.end.y > lineElement.start.y) {
                lineElement.end.y -= radiusPixels;
            } else {
                lineElement.end.y += radiusPixels;
            }
        }
        
        lineElement.length = Math.max(0, lineElement.originalLength - radiusMM);
    }
    
    confirmCurrentElement() {
        if (!this.currentElement) return;
        
        if (this.currentElement.type === 'line' && this.currentElement.length === 0) {
            this.updateStatus('Die Linie muss mindestens 1mm lang sein!');
            return;
        }
        
        if (this.currentElement.type === 'curve' && this.currentElement.angle === 0) {
            this.updateStatus('Wählen Sie einen Winkel ungleich 0°!');
            return;
        }
        
        this.elements.push({ ...this.currentElement });
        
        if (this.currentElement.type === 'curve') {
            // Nach einer Kurve: nächste Linie ist tangential zur Kurve
            this.currentElement = {
                type: 'line',
                start: { ...this.currentElement.end },
                end: { ...this.currentElement.end },
                direction: 'tangential',
                angle: this.currentElement.endAngle,
                length: 0,
                thickness: this.settings.thickness
            };
            
            this.drawingMode = 'line';
            this.updateStatus('Zeichnen Sie die nächste Linie. Bewegen Sie die Maus oder drücken Sie Leertaste für manuelle Eingabe.');
        } else {
            // Nach einer Linie: Punkt für Kurve hinzufügen
            this.activePoints.push({ ...this.currentElement.end });
            this.currentElement = null;
            this.isDrawing = false;
            this.drawingMode = null;
            this.hideValueOverlay();
            this.updateStatus('Klicken Sie auf den blauen Punkt um eine Kurve hinzuzufügen.');
        }
        
        this.updateMeasurements();
        this.render();
    }
    
    showModal(modalId) {
        document.getElementById(modalId).style.display = 'flex';
        if (modalId === 'lengthModal') {
            const input = document.getElementById('lengthInput');
            input.value = this.currentElement?.length || 0;
            input.focus();
            input.select();
        } else if (modalId === 'angleModal') {
            const input = document.getElementById('angleInput');
            input.value = this.currentElement?.angle || 0;
            input.focus();
            input.select();
        }
    }
    
    updateMeasurements() {
        const panel = document.getElementById('measurementPanel');
        const list = document.getElementById('measurementList');
        
        list.innerHTML = '';
        
        let totalLength = 0;
        let kantungen = 0;
        
        this.elements.forEach((element) => {
            if (element.type === 'line') {
                const lengthToAdd = element.originalLength || element.length;
                totalLength += lengthToAdd;
            } else if (element.type === 'curve') {
                kantungen++;
            }
        });
        
        if (this.elements.length > 0) {
            list.innerHTML = `
                <div style="padding: 10px 0; border-top: 2px solid #1e3c72; margin-top: 10px; font-weight: bold;">
                    <div style="margin-bottom: 5px;">Gesamtlänge: ${totalLength} mm</div>
                    <div>Kantungen: ${kantungen}</div>
                </div>
            `;
            
            panel.style.display = 'block';
        }
    }
    
    render() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.ctx.save();
        this.ctx.scale(this.zoom, this.zoom);
        this.ctx.translate(this.panX / this.zoom, this.panY / this.zoom);
        
        this.drawGrid();
        
        // Zeichne fertige Elemente
        this.elements.forEach(element => {
            this.drawElementWithColors(element, 3 / this.zoom);
        });
        
        // Zeichne aktuelles Element
        if (this.currentElement) {
            this.drawElement(this.currentElement, '#e74c3c', 3 / this.zoom);
            
            if (this.isDrawing) {
                this.drawCurrentValues();
                
                // Zeichne grüne gestrichelte Hilfslinie bei Kurven
                if (this.currentElement.type === 'curve') {
                    this.drawHelperLine();
                }
            }
        }
        
        // Zeichne aktive Punkte
        this.activePoints.forEach(point => {
            this.drawPoint(point, '#3498db', 8 / this.zoom);
        });
        
        this.ctx.restore();
        
        this.drawZoomInfo();
    }
    
    drawHelperLine() {
        if (!this.currentElement || this.currentElement.type !== 'curve' || !this.helperLineEnd) return;
        
        // Zeichne gestrichelte grüne Linie zum berechneten Ende
        const curveEnd = this.currentElement.end || this.currentElement.start;
        
        this.ctx.strokeStyle = '#27ae60';
        this.ctx.lineWidth = 2 / this.zoom;
        this.ctx.setLineDash([5 / this.zoom, 5 / this.zoom]);
        
        this.ctx.beginPath();
        this.ctx.moveTo(curveEnd.x, curveEnd.y);
        this.ctx.lineTo(this.helperLineEnd.x, this.helperLineEnd.y);
        this.ctx.stroke();
        
        // Zurück zu durchgezogener Linie
        this.ctx.setLineDash([]);
    }
    
    drawElementWithColors(element, width) {
        this.ctx.lineWidth = width;
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';
        
        // Bestimme die Spurzuordnung für dieses Element
        const spurMapping = this.getSpurMappingForElement(element);
        
        const offset = width * 0.6;
        
        if (element.type === 'line') {
            const dx = element.end.x - element.start.x;
            const dy = element.end.y - element.start.y;
            const length = Math.sqrt(dx * dx + dy * dy);
            
            if (length > 0) {
                // Normale zeigt nach links (bezogen auf die Zeichenrichtung)
                const normalX = -dy / length;
                const normalY = dx / length;
                
                // Spur A (nach links versetzt)
                this.ctx.strokeStyle = spurMapping.spurA;
                this.ctx.beginPath();
                this.ctx.moveTo(element.start.x + normalX * offset, element.start.y + normalY * offset);
                this.ctx.lineTo(element.end.x + normalX * offset, element.end.y + normalY * offset);
                this.ctx.stroke();
                
                // Spur B (nach rechts versetzt)
                this.ctx.strokeStyle = spurMapping.spurB;
                this.ctx.beginPath();
                this.ctx.moveTo(element.start.x - normalX * offset, element.start.y - normalY * offset);
                this.ctx.lineTo(element.end.x - normalX * offset, element.end.y - normalY * offset);
                this.ctx.stroke();
            }
            
        } else if (element.type === 'curve' && element.center && element.angle !== 0) {
            const startAngle = element.startAngleFromCenter;
            const endAngle = element.endAngleFromCenter;
            const counterClockwise = element.angle < 0;
            
            // KORREKTUR: Bei Rechtskurven (angle > 0) müssen die Spuren getauscht werden
            // weil die Kurvenberechnung bei positiven Winkeln die Radien umkehrt
            
            let ersteSpurColor, zweiteSpurColor;
            
            if (element.angle > 0) {
                // Rechtskurve: Spuren tauschen wegen umgekehrter Radiusberechnung
                ersteSpurColor = spurMapping.spurB;
                zweiteSpurColor = spurMapping.spurA;
            } else {
                // Linkskurve: normale Zuordnung
                ersteSpurColor = spurMapping.spurA;
                zweiteSpurColor = spurMapping.spurB;
            }
            
            // Äußerer Bogen (größerer Radius)
            this.ctx.strokeStyle = ersteSpurColor;
            this.ctx.beginPath();
            this.ctx.arc(element.center.x, element.center.y, element.radius + offset, startAngle, endAngle, counterClockwise);
            this.ctx.stroke();
            
            // Innerer Bogen (kleinerer Radius)
            this.ctx.strokeStyle = zweiteSpurColor;
            this.ctx.beginPath();
            this.ctx.arc(element.center.x, element.center.y, element.radius - offset, startAngle, endAngle, counterClockwise);
            this.ctx.stroke();
        }
    }
    
    getSpurMappingForElement(targetElement) {
        // VEREINFACHT: Keine Umklappung mehr!
        // Die Farbseite-Wahl gilt nur für die allererste Linie
        // Danach bleiben die Spuren IMMER gleich zugeordnet
        
        let spurA, spurB;
        if (this.colorSide === 'top') {
            spurA = this.settings.frontColor;    // Gewählte Farbe = Spur A
            spurB = this.settings.backColor;     // Andere Farbe = Spur B
        } else {
            spurA = this.settings.backColor;     // Andere Farbe = Spur A
            spurB = this.settings.frontColor;    // Gewählte Farbe = Spur B
        }
        
        // KEINE Umklappung mehr - Farben bleiben IMMER gleich
        return { spurA, spurB };
    }
    
    isElementFlipped(targetElement) {
        // Finde die Position des Elements
        const elementIndex = this.elements.indexOf(targetElement);
        
        // Zähle alle Kurven davor
        let totalRotation = 0;
        for (let i = 0; i < elementIndex; i++) {
            const element = this.elements[i];
            if (element.type === 'curve') {
                totalRotation += element.angle;
            }
        }
        
        // Normalisiere auf -180 bis +180
        while (totalRotation > 180) totalRotation -= 360;
        while (totalRotation <= -180) totalRotation += 360;
        
        // Umgedreht wenn mehr als 90° oder weniger als -90°
        return Math.abs(totalRotation) > 90;
    }
    
    drawElement(element, color, width) {
        this.ctx.strokeStyle = color;
        this.ctx.lineWidth = width;
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';
        
        if (element.type === 'line') {
            this.ctx.beginPath();
            this.ctx.moveTo(element.start.x, element.start.y);
            this.ctx.lineTo(element.end.x, element.end.y);
            this.ctx.stroke();
        } else if (element.type === 'curve' && element.center && element.angle !== 0) {
            this.ctx.beginPath();
            
            const startAngle = element.startAngleFromCenter;
            const endAngle = element.endAngleFromCenter;
            const counterClockwise = element.angle < 0;
            
            this.ctx.arc(element.center.x, element.center.y, element.radius, startAngle, endAngle, counterClockwise);
            this.ctx.stroke();
        }
    }
    
    drawPoint(point, color, radius) {
        this.ctx.fillStyle = color;
        this.ctx.beginPath();
        this.ctx.arc(point.x, point.y, radius, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.strokeStyle = 'white';
        this.ctx.lineWidth = 2 / this.zoom;
        this.ctx.stroke();
    }
    
    drawCurrentValues() {
        if (!this.currentElement) return;
        
        let displayX, displayY, value, unit, color;
        
        if (this.currentElement.type === 'line') {
            displayX = this.currentElement.end.x;
            displayY = this.currentElement.end.y - 30 / this.zoom;
            value = this.currentElement.length;
            unit = 'mm';
            color = '#e74c3c';
        } else if (this.currentElement.type === 'curve') {
            if (this.currentElement.center) {
                displayX = this.currentElement.center.x;
                displayY = this.currentElement.center.y - 20 / this.zoom;
            } else {
                displayX = this.currentElement.start.x;
                displayY = this.currentElement.start.y - 30 / this.zoom;
            }
            value = this.currentElement.angle;
            unit = '°';
            color = '#f39c12';
        }
        
        const text = `${value}${unit}`;
        this.ctx.font = `${16 / this.zoom}px Arial`;
        this.ctx.textAlign = 'center';
        
        const textMetrics = this.ctx.measureText(text);
        const textWidth = textMetrics.width;
        const textHeight = 16 / this.zoom;
        
        const padding = 8 / this.zoom;
        const bgX = displayX - textWidth/2 - padding;
        const bgY = displayY - textHeight - padding;
        const bgWidth = textWidth + 2 * padding;
        const bgHeight = textHeight + 2 * padding;
        
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        this.ctx.fillRect(bgX + 2/this.zoom, bgY + 2/this.zoom, bgWidth, bgHeight);
        
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
        this.ctx.fillRect(bgX, bgY, bgWidth, bgHeight);
        
        this.ctx.strokeStyle = color;
        this.ctx.lineWidth = 2 / this.zoom;
        this.ctx.strokeRect(bgX, bgY, bgWidth, bgHeight);
        
        this.ctx.fillStyle = color;
        this.ctx.font = `bold ${16 / this.zoom}px Arial`;
        this.ctx.fillText(text, displayX, displayY);
    }
    
    drawGrid() {
        this.ctx.strokeStyle = '#ecf0f1';
        this.ctx.lineWidth = 1 / this.zoom;
        
        const visibleArea = {
            left: -this.panX / this.zoom,
            top: -this.panY / this.zoom,
            right: (this.canvas.width - this.panX) / this.zoom,
            bottom: (this.canvas.height - this.panY) / this.zoom
        };
        
        const gridSize = this.scale * 5;
        
        const startX = Math.floor(visibleArea.left / gridSize) * gridSize;
        for (let x = startX; x <= visibleArea.right; x += gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, visibleArea.top);
            this.ctx.lineTo(x, visibleArea.bottom);
            this.ctx.stroke();
        }
        
        const startY = Math.floor(visibleArea.top / gridSize) * gridSize;
        for (let y = startY; y <= visibleArea.bottom; y += gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(visibleArea.left, y);
            this.ctx.lineTo(visibleArea.right, y);
            this.ctx.stroke();
        }
    }
    
    drawZoomInfo() {
        this.ctx.setTransform(1, 0, 0, 1, 0, 0);
        
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillRect(10, 10, 120, 30);
        
        this.ctx.fillStyle = 'white';
        this.ctx.font = '14px Arial';
        this.ctx.fillText(`Zoom: ${Math.round(this.zoom * 100)}%`, 20, 30);
    }
    
    updateStatus(message) {
        document.getElementById('statusText').textContent = message;
    }
    
    clearCanvas() {
        this.elements = [];
        this.activePoints = [];
        this.currentElement = null;
        this.isDrawing = false;
        this.drawingMode = null;
        
        this.zoom = 1;
        this.panX = 0;
        this.panY = 0;
        
        document.getElementById('measurementPanel').style.display = 'none';
        document.getElementById('startBtn').style.display = 'block';
        this.updateStatus('Canvas geleert. Starten Sie eine neue Zeichnung.');
        this.render();
    }
    
    centerView() {
        if (this.elements.length === 0) {
            this.zoom = 1;
            this.panX = this.canvas.width/2 - this.startPos.x;
            this.panY = this.canvas.height/2 - this.startPos.y;
        } else {
            let minX = Infinity, minY = Infinity;
            let maxX = -Infinity, maxY = -Infinity;
            
            this.elements.forEach(element => {
                if (element.type === 'line') {
                    minX = Math.min(minX, element.start.x, element.end.x);
                    maxX = Math.max(maxX, element.start.x, element.end.x);
                    minY = Math.min(minY, element.start.y, element.end.y);
                    maxY = Math.max(maxY, element.start.y, element.end.y);
                } else if (element.type === 'curve' && element.center) {
                    const r = element.radius;
                    minX = Math.min(minX, element.center.x - r);
                    maxX = Math.max(maxX, element.center.x + r);
                    minY = Math.min(minY, element.center.y - r);
                    maxY = Math.max(maxY, element.center.y + r);
                }
            });
            
            const centerX = (minX + maxX) / 2;
            const centerY = (minY + maxY) / 2;
            const width = maxX - minX + 100;
            const height = maxY - minY + 100;
            
            const zoomX = this.canvas.width / width;
            const zoomY = this.canvas.height / height;
            this.zoom = Math.min(zoomX, zoomY, 2);
            
            this.panX = this.canvas.width/2 - centerX * this.zoom;
            this.panY = this.canvas.height/2 - centerY * this.zoom;
        }
        
        this.render();
        this.updateStatus('Ansicht zentriert.');
    }
    
    exportSketch() {
        if (this.elements.length === 0) {
            alert('Keine Zeichnung zum Exportieren vorhanden!');
            return;
        }
        
        this.showModal('exportModal');
    }
    
    calculateShapeCenter() {
        if (this.elements.length === 0) return { x: 0, y: 0 };
        
        let totalX = 0, totalY = 0, pointCount = 0;
        
        this.elements.forEach(element => {
            if (element.type === 'line') {
                totalX += element.start.x + element.end.x;
                totalY += element.start.y + element.end.y;
                pointCount += 2;
            } else if (element.type === 'curve' && element.center) {
                // Füge Start- und Endpunkt der Kurve hinzu
                totalX += element.start.x + element.end.x;
                totalY += element.start.y + element.end.y;
                pointCount += 2;
            }
        });
        
        return {
            x: totalX / pointCount,
            y: totalY / pointCount
        };
    }
    
    linesIntersect(line1, line2) {
        // Verbesserte Kollisionsprüfung
        const dist1 = Math.sqrt(Math.pow(line1.startX - line2.startX, 2) + Math.pow(line1.startY - line2.startY, 2));
        const dist2 = Math.sqrt(Math.pow(line1.endX - line2.endX, 2) + Math.pow(line1.endY - line2.endY, 2));
        return (dist1 < 80 && dist2 < 80); // Größerer Abstand
    }
    
    confirmExport() {
        const partName = document.getElementById('partName').value.trim();
        const quantityNeeded = parseFloat(document.getElementById('quantityNeeded').value);
        
        if (!partName) {
            alert('Bitte geben Sie einen Namen für das Kantteil ein!');
            return;
        }
        
        if (!quantityNeeded || quantityNeeded <= 0) {
            alert('Bitte geben Sie eine gültige Meterzahl ein!');
            return;
        }
        
        try {
            this.generateTechnicalDrawing(partName, quantityNeeded);
            closeModal('exportModal');
        } catch (error) {
            console.error('Fehler beim Export:', error);
            alert('Fehler beim Erstellen der technischen Zeichnung. Bitte versuchen Sie es erneut.');
        }
    }
    
    generateTechnicalDrawing(partName = 'Kantteil', quantityNeeded = 0) {
        if (this.elements.length === 0) {
            alert('Keine Zeichnung für Bemaßung vorhanden!');
            return;
        }
        
        // Erstelle ein neues Canvas für die technische Zeichnung
        const techCanvas = document.createElement('canvas');
        const techCtx = techCanvas.getContext('2d');
        
        // Bestimme Bounding Box der Zeichnung
        let minX = Infinity, minY = Infinity;
        let maxX = -Infinity, maxY = -Infinity;
        
        this.elements.forEach(element => {
            if (element.type === 'line') {
                minX = Math.min(minX, element.start.x, element.end.x);
                maxX = Math.max(maxX, element.start.x, element.end.x);
                minY = Math.min(minY, element.start.y, element.end.y);
                maxY = Math.max(maxY, element.start.y, element.end.y);
            } else if (element.type === 'curve' && element.center) {
                const r = element.radius + 20;
                minX = Math.min(minX, element.center.x - r);
                maxX = Math.max(maxX, element.center.x + r);
                minY = Math.min(minY, element.center.y - r);
                maxY = Math.max(maxY, element.center.y + r);
            }
        });
        
       // Canvas-Größe mit Rand für Bemaßung und Titel
        const margin = 200; // Mehr Platz für Bemaßung
        const drawingWidth = maxX - minX;
        const drawingHeight = maxY - minY;
        
        techCanvas.width = drawingWidth + 2 * margin;
        techCanvas.height = drawingHeight + 2 * margin + 150; // Mehr Platz für Legende
        
        // Weißer Hintergrund
        techCtx.fillStyle = 'white';
        techCtx.fillRect(0, 0, techCanvas.width, techCanvas.height);
        
        // Titel und Informationen
        techCtx.fillStyle = 'black';
        techCtx.font = 'bold 28px Arial'; // Größere Schrift
        techCtx.textAlign = 'center';
        techCtx.fillText(partName, techCanvas.width / 2, 35);
        
        techCtx.font = 'bold 18px Arial'; // Größere Schrift
        techCtx.fillText(`Technische Zeichnung - Kantteil`, techCanvas.width / 2, 60);
        
        // Website-URL hinzufügen
        techCtx.font = '16px Arial';
        techCtx.fillText(`www.dachplattenrechner.de`, techCanvas.width / 2, 85);
        
        // Berechne Gesamtlänge und Kantungen
        let totalLength = 0;
        let kantungen = 0;
        this.elements.forEach((element) => {
            if (element.type === 'line') {
                totalLength += element.originalLength || element.length;
            } else if (element.type === 'curve') {
                kantungen++;
            }
        });
        
        // Bestimme Farbseiten-Text
        const spurMapping = this.getSpurMappingForElement(this.elements[0]);
        const selectedColor = this.settings.frontColor;
        const spurAIsColorSide = (spurMapping.spurA === selectedColor);
        const farbseiteText = spurAIsColorSide ? 'Farbseite: Obere Spur' : 'Farbseite: Untere Spur';
        
        // Legende unten mit größerer Schrift
        const legendY = techCanvas.height - 100;
        techCtx.font = 'bold 16px Arial'; // Größere Schrift
        techCtx.textAlign = 'left';
        techCtx.fillText(`Gesamtlänge: ${totalLength} mm`, 20, legendY);
        techCtx.fillText(`Kantungen: ${kantungen}`, 20, legendY + 25);
        techCtx.fillText(`Benötigte Meter: ${quantityNeeded}`, 20, legendY + 50);
        techCtx.fillText(farbseiteText, 20, legendY + 75);
        
        techCtx.textAlign = 'right';
        techCtx.fillText(`Farbcode: ${this.settings.selectedColorCode}`, techCanvas.width - 20, legendY);
        techCtx.fillText(`Materialstärke: ${this.settings.thickness} mm`, techCanvas.width - 20, legendY + 25);
        techCtx.fillText(`Datum: ${new Date().toLocaleDateString('de-DE')}`, techCanvas.width - 20, legendY + 50);
        
        // Verschiebe Koordinatensystem für Zeichnung
        techCtx.translate(-minX + margin, -minY + margin + 100);
        
        // Zeichne Elemente mit dickeren Linien
        this.drawTechnicalElementsImproved(techCtx);
        
        // Füge verbesserte Bemaßung hinzu (bis zur Kurvenmitte)
        this.addImprovedDimensionsToCenter(techCtx);
    
    drawTechnicalElements(ctx) {
        const spurMapping = this.getSpurMappingForElement(this.elements[0]);
        const lineWidth = 3;
        const offset = lineWidth * 0.8;
        
        this.elements.forEach(element => {
            if (element.type === 'line') {
                const dx = element.end.x - element.start.x;
                const dy = element.end.y - element.start.y;
                const length = Math.sqrt(dx * dx + dy * dy);
                
                if (length > 0) {
                    const normalX = -dy / length;
                    const normalY = dx / length;
                    
                    // Spur A
                    ctx.strokeStyle = spurMapping.spurA;
                    ctx.lineWidth = lineWidth;
                    ctx.lineCap = 'round';
                    ctx.beginPath();
                    ctx.moveTo(element.start.x + normalX * offset, element.start.y + normalY * offset);
                    ctx.lineTo(element.end.x + normalX * offset, element.end.y + normalY * offset);
                    ctx.stroke();
                    
                    // Spur B
                    ctx.strokeStyle = spurMapping.spurB;
                    ctx.beginPath();
                    ctx.moveTo(element.start.x - normalX * offset, element.start.y - normalY * offset);
                    ctx.lineTo(element.end.x - normalX * offset, element.end.y - normalY * offset);
                    ctx.stroke();
                }
            } else if (element.type === 'curve' && element.center && element.angle !== 0) {
                const startAngle = element.startAngleFromCenter;
                const endAngle = element.endAngleFromCenter;
                const counterClockwise = element.angle < 0;
                
                let ersteSpurColor, zweiteSpurColor;
                if (element.angle > 0) {
                    ersteSpurColor = spurMapping.spurB;
                    zweiteSpurColor = spurMapping.spurA;
                } else {
                    ersteSpurColor = spurMapping.spurA;
                    zweiteSpurColor = spurMapping.spurB;
                }
                
                ctx.lineWidth = lineWidth;
                
                // Äußerer Bogen
                ctx.strokeStyle = ersteSpurColor;
                ctx.beginPath();
                ctx.arc(element.center.x, element.center.y, element.radius + offset, startAngle, endAngle, counterClockwise);
                ctx.stroke();
                
                // Innerer Bogen
                ctx.strokeStyle = zweiteSpurColor;
                ctx.beginPath();
                ctx.arc(element.center.x, element.center.y, element.radius - offset, startAngle, endAngle, counterClockwise);
                ctx.stroke();
            }
        });
    }
    
    addImprovedDimensions(ctx) {
        ctx.strokeStyle = 'blue';
        ctx.fillStyle = 'blue';
        ctx.lineWidth = 2; // Dickere Linien
        ctx.font = 'bold 16px Arial'; // Größere Schrift
        ctx.textAlign = 'center';
        
        const usedDimensionLines = [];
        
        this.elements.forEach((element, index) => {
            if (element.type === 'line') {
                const length = element.originalLength || element.length;
                
                // Bestimme optimale Bemaßungsposition
                const dimPosition = this.findOptimalDimensionPosition(element, usedDimensionLines, index);
                
                this.drawDimensionLine(ctx, element, dimPosition, length);
                usedDimensionLines.push(dimPosition);
            }
        });
    }
    
    findOptimalDimensionPosition(element, usedLines, elementIndex) {
        const dx = element.end.x - element.start.x;
        const dy = element.end.y - element.start.y;
        const length = Math.sqrt(dx * dx + dy * dy);
        
        if (length === 0) return { offset: 50, side: 1 };
        
        const normalX = -dy / length;
        const normalY = dx / length;
        
        // Berechne Schwerpunkt für Innen/Außen-Bestimmung
        const shapeCenter = this.calculateShapeCenter();
        const lineCenter = {
            x: (element.start.x + element.end.x) / 2,
            y: (element.start.y + element.end.y) / 2
        };
        
        // Bestimme welche Seite außen ist (weg vom Schwerpunkt)
        const toCenter = {
            x: shapeCenter.x - lineCenter.x,
            y: shapeCenter.y - lineCenter.y
        };
        
        // Prüfe welche Normale-Richtung vom Schwerpunkt wegzeigt
        const dotProduct = normalX * toCenter.x + normalY * toCenter.y;
        const preferredSide = dotProduct > 0 ? -1 : 1; // Außenseite bevorzugen
        
        // Für kurze Linien (< 15mm): nach innen bemaßen
        const lineLength = element.originalLength || element.length;
        const useInside = lineLength < 15;
        const finalSide = useInside ? -preferredSide : preferredSide;
        
        // Prüfe verschiedene Abstände
        const possibleOffsets = useInside ? [25, 35, 45] : [60, 90, 120, 150];
        const sides = [finalSide, -finalSide];
        
        for (const side of sides) {
            for (const offset of possibleOffsets) {
                const testPos = {
                    startX: element.start.x + normalX * offset * side,
                    startY: element.start.y + normalY * offset * side,
                    endX: element.end.x + normalX * offset * side,
                    endY: element.end.y + normalY * offset * side,
                    offset: offset,
                    side: side,
                    isInside: useInside
                };
                
                // Prüfe Kollision mit existierenden Bemaßungslinien
                const hasCollision = usedLines.some(usedLine => {
                    return this.linesIntersect(testPos, usedLine);
                });
                
                if (!hasCollision) {
                    return testPos;
                }
            }
        }
        
        // Fallback
        return { 
            startX: element.start.x + normalX * (useInside ? 25 : 60),
            startY: element.start.y + normalY * (useInside ? 25 : 60),
            endX: element.end.x + normalX * (useInside ? 25 : 60),
            endY: element.end.y + normalY * (useInside ? 25 : 60),
            offset: useInside ? 25 : 60,
            side: 1,
            isInside: useInside
        };
    }
    
    drawDimensionLine(ctx, element, dimPos, length) {
        // Bestimme echte Start- und Endpunkte inkl. Bogenerweiterungen
        let startPoint = { x: element.start.x, y: element.start.y };
        let endPoint = { x: element.end.x, y: element.end.y };
        
        const dx = element.end.x - element.start.x;
        const dy = element.end.y - element.start.y;
        const lineLength = Math.sqrt(dx * dx + dy * dy);
        const normalX = lineLength > 0 ? -dy / lineLength : 0;
        const normalY = lineLength > 0 ? dx / lineLength : 0;
        
        // Prüfe vorherige Kurve und erweitere bis zur Außenkante
        const prevElement = this.elements[this.elements.indexOf(element) - 1];
        if (prevElement && prevElement.type === 'curve') {
            const radiusExtension = 4; // Bis zur Außenkante des Bogens
            const unitX = lineLength > 0 ? -dx / lineLength : 0;
            const unitY = lineLength > 0 ? -dy / lineLength : 0;
            startPoint.x += unitX * radiusExtension;
            startPoint.y += unitY * radiusExtension;
        }
        
        // Prüfe nachfolgende Kurve und erweitere bis zur Außenkante
        const nextElement = this.elements[this.elements.indexOf(element) + 1];
        if (nextElement && nextElement.type === 'curve') {
            const radiusExtension = 4;
            const unitX = lineLength > 0 ? dx / lineLength : 0;
            const unitY = lineLength > 0 ? dy / lineLength : 0;
            endPoint.x += unitX * radiusExtension;
            endPoint.y += unitY * radiusExtension;
        }
        
        // Zeichne Bemaßungslinie (dicker)
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(dimPos.startX, dimPos.startY);
        ctx.lineTo(dimPos.endX, dimPos.endY);
        ctx.stroke();
        
        // Zeichne SENKRECHTE Hilfslinien (nicht schief!)
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        
        // Hilfslinie am Start - senkrecht zur Bemaßungslinie
        const helpStartX = startPoint.x + normalX * dimPos.offset * dimPos.side;
        const helpStartY = startPoint.y + normalY * dimPos.offset * dimPos.side;
        ctx.moveTo(startPoint.x, startPoint.y);
        ctx.lineTo(helpStartX, helpStartY);
        
        // Hilfslinie am Ende - senkrecht zur Bemaßungslinie  
        const helpEndX = endPoint.x + normalX * dimPos.offset * dimPos.side;
        const helpEndY = endPoint.y + normalY * dimPos.offset * dimPos.side;
        ctx.moveTo(endPoint.x, endPoint.y);
        ctx.lineTo(helpEndX, helpEndY);
        
        ctx.stroke();
        
        // Bemaßungstext (größer)
        const textX = (dimPos.startX + dimPos.endX) / 2;
        const textY = (dimPos.startY + dimPos.endY) / 2 - 8;
        
        // Weißer Hintergrund für bessere Lesbarkeit
        ctx.fillStyle = 'white';
        ctx.fillRect(textX - 30, textY - 12, 60, 24);
        ctx.strokeStyle = 'blue';
        ctx.lineWidth = 1;
        ctx.strokeRect(textX - 30, textY - 12, 60, 24);
        
        ctx.fillStyle = 'blue';
        ctx.font = 'bold 16px Arial';
        ctx.fillText(`${length}mm`, textX, textY + 6);
    }
    
    addColorSideLabels(ctx) {
        if (this.elements.length === 0) return;
        
        // Finde die längste Linie
        let longestLine = null;
        let maxLength = 0;
        
        this.elements.forEach(element => {
            if (element.type === 'line') {
                const length = element.originalLength || element.length;
                if (length > maxLength) {
                    maxLength = length;
                    longestLine = element;
                }
            }
        });
        
        if (!longestLine) return;
        
        // Berechne Schwerpunkt für korrekte Innen/Außen-Bestimmung
        const shapeCenter = this.calculateShapeCenter();
        const spurMapping = this.getSpurMappingForElement(longestLine);
        
        const dx = longestLine.end.x - longestLine.start.x;
        const dy = longestLine.end.y - longestLine.start.y;
        const length = Math.sqrt(dx * dx + dy * dy);
        
        if (length === 0) return;
        
        const normalX = -dy / length;
        const normalY = dx / length;
        
        // Positioniere Beschriftung am Anfang der längsten Linie (nicht in der Mitte)
        const labelBaseX = longestLine.start.x + dx * 0.2; // 20% vom Start
        const labelBaseY = longestLine.start.y + dy * 0.2;
        
        // Bestimme wo sich die Farbspuren tatsächlich befinden
        const spurAPos = { x: labelBaseX + normalX * 4, y: labelBaseY + normalY * 4 };
        const spurBPos = { x: labelBaseX - normalX * 4, y: labelBaseY - normalY * 4 };
        
        // Berechne Distanz zum Schwerpunkt um Innen/Außen zu bestimmen
        const distSpurAToCenter = Math.sqrt(Math.pow(spurAPos.x - shapeCenter.x, 2) + Math.pow(spurAPos.y - shapeCenter.y, 2));
        const distSpurBToCenter = Math.sqrt(Math.pow(spurBPos.x - shapeCenter.x, 2) + Math.pow(spurBPos.y - shapeCenter.y, 2));
        
        // Die Spur mit größerer Distanz zum Schwerpunkt ist außen
        const spurAIsOutside = distSpurAToCenter > distSpurBToCenter;
        
        // Positioniere Beschriftungen mit noch mehr Abstand
        const labelOffset = 70; // Größerer Abstand vom Objekt
        let spurALabelPos, spurBLabelPos;
        
        if (spurAIsOutside) {
            spurALabelPos = { x: labelBaseX + normalX * labelOffset, y: labelBaseY + normalY * labelOffset };
            spurBLabelPos = { x: labelBaseX - normalX * labelOffset, y: labelBaseY - normalY * labelOffset };
        } else {
            spurALabelPos = { x: labelBaseX - normalX * labelOffset, y: labelBaseY - normalY * labelOffset };
            spurBLabelPos = { x: labelBaseX + normalX * labelOffset, y: labelBaseY + normalY * labelOffset };
        }
        
        // Bestimme korrekt welche Spur die Farbseite ist
        // Prüfe direkt die Farbzuordnung statt komplizierte Logik
        const spurAColor = spurMapping.spurA;
        const spurBColor = spurMapping.spurB;
        const selectedColor = this.settings.frontColor;
        
        const spurAIsColorSide = (spurAColor === selectedColor);
        
        // Zeichne Beschriftungen mit Rahmen für bessere Sichtbarkeit
        ctx.font = 'bold 18px Arial'; // Große Schrift beibehalten
        ctx.textAlign = 'center';
        ctx.lineWidth = 2;
        
        // Spur A beschriften
        const spurALabel = spurAIsColorSide ? 'Farbseite' : 'Rückseite';
        
        // Weißer Hintergrund für Spur A
        ctx.fillStyle = 'white';
        ctx.fillRect(spurALabelPos.x - 45, spurALabelPos.y - 12, 90, 24);
        ctx.strokeStyle = spurAColor;
        ctx.strokeRect(spurALabelPos.x - 45, spurALabelPos.y - 12, 90, 24);
        
        ctx.fillStyle = spurAColor;
        ctx.fillText(spurALabel, spurALabelPos.x, spurALabelPos.y + 6);
        
        // Spur B beschriften
        const spurBLabel = spurAIsColorSide ? 'Rückseite' : 'Farbseite';
        
        // Weißer Hintergrund für Spur B
        ctx.fillStyle = 'white';
        ctx.fillRect(spurBLabelPos.x - 45, spurBLabelPos.y - 12, 90, 24);
        ctx.strokeStyle = spurBColor;
        ctx.strokeRect(spurBLabelPos.x - 45, spurBLabelPos.y - 12, 90, 24);
        
        ctx.fillStyle = spurBColor;
        ctx.fillText(spurBLabel, spurBLabelPos.x, spurBLabelPos.y + 6);
        
        // Dünnere Pfeile zur Zuordnung mit größerer Distanz
        ctx.lineWidth = 1.5;
        ctx.strokeStyle = spurAColor;
        this.drawArrow(ctx, spurALabelPos.x, spurALabelPos.y + 15, spurAPos.x, spurAPos.y);
        
        ctx.strokeStyle = spurBColor;
        this.drawArrow(ctx, spurBLabelPos.x, spurBLabelPos.y + 15, spurBPos.x, spurBPos.y);
    }
    
    drawArrow(ctx, fromX, fromY, toX, toY) {
        const headlen = 12; // Größere Pfeilspitzen
        const angle = Math.atan2(toY - fromY, toX - fromX);
        
        ctx.beginPath();
        ctx.moveTo(fromX, fromY);
        ctx.lineTo(toX, toY);
        ctx.lineTo(toX - headlen * Math.cos(angle - Math.PI / 6), toY - headlen * Math.sin(angle - Math.PI / 6));
        ctx.moveTo(toX, toY);
        ctx.lineTo(toX - headlen * Math.cos(angle + Math.PI / 6), toY - headlen * Math.sin(angle + Math.PI / 6));
        ctx.stroke();
    }
    
    generatePDF(canvas, partName) {
        // Erstelle Druckvorschau-Fenster
        const printWindow = window.open('', '_blank', 'width=800,height=600');
        const imgData = canvas.toDataURL('image/png');
        
        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>${partName} - Technische Zeichnung</title>
                <style>
                    body { 
                        margin: 0; 
                        padding: 20px; 
                        font-family: Arial, sans-serif;
                        background: #f5f5f5;
                    }
                    .container {
                        max-width: 210mm;
                        margin: 0 auto;
                        background: white;
                        padding: 20mm;
                        box-shadow: 0 0 10px rgba(0,0,0,0.1);
                    }
                    .controls {
                        margin-bottom: 20px;
                        text-align: center;
                        background: #e9e9e9;
                        padding: 10px;
                        border-radius: 5px;
                    }
                    .controls button {
                        margin: 0 10px;
                        padding: 8px 16px;
                        background: #007cba;
                        color: white;
                        border: none;
                        border-radius: 4px;
                        cursor: pointer;
                    }
                    .controls button:hover {
                        background: #005a8b;
                    }
                    img { 
                        width: 100%; 
                        height: auto; 
                        border: 1px solid #ddd;
                    }
                    @media print {
                        body { background: white; }
                        .controls { display: none; }
                        .container { 
                            box-shadow: none; 
                            padding: 0;
                            max-width: none;
                        }
                        img { border: none; }
                    }
                </style>
            </head>
            <body>
                <div class="controls">
                    <button onclick="window.print()">🖨️ Drucken</button>
                    <button onclick="downloadImage()">📥 PNG herunterladen</button>
                    <button onclick="window.close()">❌ Schließen</button>
                </div>
                <div class="container">
                    <img src="${imgData}" alt="Technische Zeichnung">
                </div>
                <script>
                    function downloadImage() {
                        const link = document.createElement('a');
                        link.download = '${partName}_technische_zeichnung.png';
                        link.href = '${imgData}';
                        link.click();
                    }
                </script>
            </body>
            </html>
        `);
        printWindow.document.close();
    }
    
    addDimensions(ctx) {
        // Diese alte Methode wird durch addImprovedDimensions ersetzt
        // Bleibt als Fallback bestehen
        ctx.strokeStyle = 'blue';
        ctx.fillStyle = 'blue';
        ctx.lineWidth = 1;
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        
        let dimensionOffset = 30;
        
        this.elements.forEach((element, index) => {
            if (element.type === 'line') {
                const length = element.originalLength || element.length;
                
                // Mittelpunkt der Linie
                const midX = (element.start.x + element.end.x) / 2;
                const midY = (element.start.y + element.end.y) / 2;
                
                // Normale für Bemaßungslinie
                const dx = element.end.x - element.start.x;
                const dy = element.end.y - element.start.y;
                const lineLength = Math.sqrt(dx * dx + dy * dy);
                
                if (lineLength > 0) {
                    const normalX = -dy / lineLength;
                    const normalY = dx / lineLength;
                    
                    // Bemaßungslinie
                    const dimStartX = element.start.x + normalX * dimensionOffset;
                    const dimStartY = element.start.y + normalY * dimensionOffset;
                    const dimEndX = element.end.x + normalX * dimensionOffset;
                    const dimEndY = element.end.y + normalY * dimensionOffset;
                    
                    // Zeichne Bemaßungslinie
                    ctx.beginPath();
                    ctx.moveTo(dimStartX, dimStartY);
                    ctx.lineTo(dimEndX, dimEndY);
                    ctx.stroke();
                    
                    // Hilfslinien
                    ctx.beginPath();
                    ctx.moveTo(element.start.x, element.start.y);
                    ctx.lineTo(dimStartX, dimStartY);
                    ctx.moveTo(element.end.x, element.end.y);
                    ctx.lineTo(dimEndX, dimEndY);
                    ctx.stroke();
                    
                    // Bemaßungstext
                    const textX = (dimStartX + dimEndX) / 2;
                    const textY = (dimStartY + dimEndY) / 2 - 5;
                    
                    ctx.fillStyle = 'white';
                    ctx.fillRect(textX - 15, textY - 8, 30, 16);
                    ctx.fillStyle = 'blue';
                    ctx.fillText(`${length}mm`, textX, textY + 4);
                }
                
                dimensionOffset += 25;
            }
        });
    }
    
    updateLineFromLength(length) {
        if (!this.currentElement || this.currentElement.type !== 'line') return;
        
        const start = this.currentElement.start;
        
        if (this.currentElement.direction === 'tangential') {
            const lineAngle = this.currentElement.angle;
            const lengthPixels = length * this.scale;
            
            this.currentElement.end = {
                x: start.x + Math.cos(lineAngle) * lengthPixels,
                y: start.y + Math.sin(lineAngle) * lengthPixels
            };
        } else if (this.currentElement.direction === 'horizontal') {
            this.currentElement.end = {
                x: start.x + length * this.scale,
                y: start.y
            };
        } else {
            this.currentElement.end = {
                x: start.x,
                y: start.y + length * this.scale
            };
        }
    }
}

// Globale Funktionen
let editor;

function startDrawing() {
    editor.startDrawing();
}

function clearCanvas() {
    editor.clearCanvas();
}

function centerView() {
    editor.centerView();
}

function exportSketch() {
    editor.exportSketch();
}

function closeEditor() {
    if (window.parent && window.parent.closeEditor) {
        window.parent.closeEditor();
    } else {
        window.close();
    }
}

function setColorSide(side) {
    editor.colorSide = side;
    
    // Button-Status aktualisieren
    document.getElementById('colorSideTop').classList.toggle('active', side === 'top');
    document.getElementById('colorSideBottom').classList.toggle('active', side === 'bottom');
    
    editor.render();
}

function openColorSelection() {
    window.open('farben.html', 'colorSelection', 'width=1000,height=700,scrollbars=yes,resizable=yes');
}

// Callback für Farbauswahl
window.onColorSelected = function(colorData) {
    editor.settings.frontColor = colorData.color;
    editor.settings.selectedColorCode = colorData.code;
    editor.settings.selectedColorName = colorData.name;
    editor.settings.selectedColorType = colorData.type;
    
    editor.render();
};

function showModal(modalId) {
    document.getElementById(modalId).style.display = 'flex';
}

function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}

function confirmLength() {
    const length = parseInt(document.getElementById('lengthInput').value);
    if (length >= 1 && length <= 1000) {
        if (editor.currentElement && editor.currentElement.type === 'line') {
            editor.currentElement.length = length;
            editor.updateLineFromLength(length);
            editor.render();
        }
    }
    closeModal('lengthModal');
}

function confirmAngle() {
    const angle = parseInt(document.getElementById('angleInput').value);
    if (angle >= -180 && angle <= 180 && angle !== 0) {
        if (editor.currentElement && editor.currentElement.type === 'curve') {
            editor.currentElement.angle = angle;
            editor.calculateCurveEndpoint();
            editor.render();
        }
    }
    closeModal('angleModal');
}

function confirmExport() {
    if (editor) {
        editor.confirmExport();
    }
}

function generateTechnicalDrawing() {
    if (editor) {
        const partName = document.getElementById('partName').value.trim() || 'Kantteil';
        const quantityNeeded = parseFloat(document.getElementById('quantityNeeded').value) || 0;
        editor.generateTechnicalDrawing(partName, quantityNeeded);
    }
}

function closeHelp() {
    document.getElementById('helpOverlay').style.display = 'none';
}

// Event Listeners für Modals
document.getElementById('lengthInput').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') confirmLength();
    if (e.key === 'Escape') closeModal('lengthModal');
});

document.getElementById('angleInput').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') confirmAngle();
    if (e.key === 'Escape') closeModal('angleModal');
});

// Initialisierung
document.addEventListener('DOMContentLoaded', () => {
    editor = new KantteileEditor();
});
