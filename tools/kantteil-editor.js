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
        if (e.button === 1 || (e.button === 0 && (e.ctrlKey || e.metaKey))) {
            e.preventDefault();
            this.isPanning = true;
            this.lastPanPoint = { x: e.clientX, y: e.clientY };
            this.canvas.style.cursor = 'grabbing';
        }
    }
    
    handleMouseUp(e) {
        if (this.isPanning && (e.button === 1 || e.button === 0)) {
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
            
            const projectedLength = dx * Math.cos(lineAngle) + dy * Math.sin(lineAngle);
            length = Math.abs(projectedLength) / this.scale;
            
            this.currentElement.end = {
                x: start.x + Math.cos(lineAngle) * projectedLength,
                y: start.y + Math.sin(lineAngle) * projectedLength
            };
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
        
        // Bestimme die Farbseite basierend auf vorherigen Elementen UND der Farbseiten-Einstellung
        const shouldSwapColors = this.shouldSwapColorsForElement(element);
        const frontColor = shouldSwapColors ? this.settings.backColor : this.settings.frontColor;
        const backColor = shouldSwapColors ? this.settings.frontColor : this.settings.backColor;
        
        // Bestimme den Versatz für Ober- und Unterseite (senkrecht zur Linie)
        const offset = width * 0.6; // Versatz um die Linien zu trennen
        
        if (element.type === 'line') {
            // Berechne die Normale (senkrecht zur Linie)
            const dx = element.end.x - element.start.x;
            const dy = element.end.y - element.start.y;
            const length = Math.sqrt(dx * dx + dy * dy);
            
            if (length > 0) {
                const normalX = -dy / length; // Normale nach links
                const normalY = dx / length;
                
                // Zeichne Oberseite (mit Versatz nach einer Seite)
                this.ctx.strokeStyle = frontColor;
                this.ctx.globalAlpha = 1.0;
                
                this.ctx.beginPath();
                this.ctx.moveTo(element.start.x + normalX * offset, element.start.y + normalY * offset);
                this.ctx.lineTo(element.end.x + normalX * offset, element.end.y + normalY * offset);
                this.ctx.stroke();
                
                // Zeichne Unterseite (mit Versatz zur anderen Seite)
                this.ctx.strokeStyle = backColor;
                this.ctx.globalAlpha = 1.0;
                
                this.ctx.beginPath();
                this.ctx.moveTo(element.start.x - normalX * offset, element.start.y - normalY * offset);
                this.ctx.lineTo(element.end.x - normalX * offset, element.end.y - normalY * offset);
                this.ctx.stroke();
            }
            
        } else if (element.type === 'curve' && element.center && element.angle !== 0) {
            const startAngle = element.startAngleFromCenter;
            const endAngle = element.endAngleFromCenter;
            const counterClockwise = element.angle < 0;
            
            // Bei Kurven: bestimme welche Seite innen/außen ist
            // Abhängig von der aktuellen Orientierung des Blechs
            
            let outerColor, innerColor;
            
            if (shouldSwapColors) {
                // Blech ist "umgedreht" - ursprüngliche Unterseite ist jetzt sichtbar
                outerColor = backColor;  // Ursprüngliche Unterseite außen
                innerColor = frontColor; // Ursprüngliche Oberseite innen
            } else {
                // Blech ist normal orientiert
                outerColor = frontColor; // Ursprüngliche Oberseite außen
                innerColor = backColor;  // Ursprüngliche Unterseite innen
            }
            
            // Zeichne äußeren Bogen
            this.ctx.strokeStyle = outerColor;
            this.ctx.globalAlpha = 1.0;
            
            this.ctx.beginPath();
            this.ctx.arc(element.center.x, element.center.y, element.radius + offset, startAngle, endAngle, counterClockwise);
            this.ctx.stroke();
            
            // Zeichne inneren Bogen
            this.ctx.strokeStyle = innerColor;
            this.ctx.globalAlpha = 1.0;
            
            this.ctx.beginPath();
            this.ctx.arc(element.center.x, element.center.y, element.radius - offset, startAngle, endAngle, counterClockwise);
            this.ctx.stroke();
        }
        
        this.ctx.globalAlpha = 1.0;
    }
    
    shouldSwapColorsForElement(targetElement) {
        // Finde die Position des Elements in der Liste
        const elementIndex = this.elements.indexOf(targetElement);
        
        // Verfolge die Orientierung durch alle Kurven bis zu diesem Element
        let totalRotation = 0; // in Grad
        
        for (let i = 0; i < elementIndex; i++) {
            const element = this.elements[i];
            if (element.type === 'curve') {
                totalRotation += element.angle;
            }
        }
        
        // Für Kurven selbst: betrachte die Rotation BIS zur Kurvenmitte
        if (targetElement.type === 'curve') {
            // Bei Kurven nehmen wir die halbe Drehung für die Darstellung
            totalRotation += targetElement.angle / 2;
        }
        
        // Normalisiere die Rotation auf 0-360°
        while (totalRotation < 0) totalRotation += 360;
        while (totalRotation >= 360) totalRotation -= 360;
        
        // Bestimme ob das Blech "umgedreht" ist
        // Bei 90-270° ist die ursprüngliche Oberseite nicht mehr oben
        const isFlipped = totalRotation > 90 && totalRotation < 270;
        
        // Berücksichtige die ursprüngliche Farbseite-Einstellung NUR für das erste Element
        let baseSwap = false;
        if (elementIndex === 0 && targetElement === this.elements[0]) {
            // Nur die erste Linie berücksichtigt die Farbseite-Einstellung
            baseSwap = (this.colorSide === 'bottom');
        }
        
        return baseSwap !== isFlipped;
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
