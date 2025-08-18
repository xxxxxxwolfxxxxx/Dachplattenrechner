// Editor Implementierung - korrigierte Version
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
        
        // Touch-Support
        this.touches = [];
        this.lastTouchDistance = 0;
        
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
        // Maus-Events
        this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        this.canvas.addEventListener('click', (e) => this.handleClick(e));
        this.canvas.addEventListener('wheel', (e) => this.handleWheel(e));
        this.canvas.addEventListener('mousedown', (e) => this.handleMouseDown(e));
        this.canvas.addEventListener('mouseup', (e) => this.handleMouseUp(e));
        this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());
        
        // Touch-Events für Handy
        this.canvas.addEventListener('touchstart', (e) => this.handleTouchStart(e));
        this.canvas.addEventListener('touchmove', (e) => this.handleTouchMove(e));
        this.canvas.addEventListener('touchend', (e) => this.handleTouchEnd(e));
        
        document.addEventListener('keydown', (e) => this.handleKeyDown(e));
        
        this.canvas.setAttribute('tabindex', '0');
        this.canvas.focus();
    }
    
    // Touch-Handler für Handy
    handleTouchStart(e) {
        e.preventDefault();
        this.touches = Array.from(e.touches);
        
        if (this.touches.length === 1) {
            // Einzelner Touch - wie Mausklick
            const rect = this.canvas.getBoundingClientRect();
            const touch = this.touches[0];
            const screenPos = {
                x: touch.clientX - rect.left,
                y: touch.clientY - rect.top
            };
            this.mousePos = this.getWorldCoordinates(screenPos.x, screenPos.y);
        } else if (this.touches.length === 2) {
            // Zwei Finger - Pan/Zoom vorbereiten
            const distance = this.getTouchDistance(this.touches[0], this.touches[1]);
            this.lastTouchDistance = distance;
            this.isPanning = true;
            
            const midPoint = this.getTouchMidpoint(this.touches[0], this.touches[1]);
            this.lastPanPoint = midPoint;
        }
    }
    
    handleTouchMove(e) {
        e.preventDefault();
        this.touches = Array.from(e.touches);
        
        if (this.touches.length === 1 && !this.isPanning) {
            // Einzelner Touch - Mausbewegung simulieren
            const rect = this.canvas.getBoundingClientRect();
            const touch = this.touches[0];
            const screenPos = {
                x: touch.clientX - rect.left,
                y: touch.clientY - rect.top
            };
            this.mousePos = this.getWorldCoordinates(screenPos.x, screenPos.y);
            
            if (this.isDrawing) {
                if (this.drawingMode === 'line') {
                    this.updateLineFromMouse();
                } else if (this.drawingMode === 'curve') {
                    this.updateCurveFromMouse();
                }
                this.render();
            }
        } else if (this.touches.length === 2) {
            // Zwei Finger - Pan und Zoom
            const distance = this.getTouchDistance(this.touches[0], this.touches[1]);
            const midPoint = this.getTouchMidpoint(this.touches[0], this.touches[1]);
            
            // Zoom
            if (this.lastTouchDistance > 0) {
                const zoomFactor = distance / this.lastTouchDistance;
                const newZoom = Math.max(0.1, Math.min(10, this.zoom * zoomFactor));
                
                const worldMidX = (midPoint.x - this.panX) / this.zoom;
                const worldMidY = (midPoint.y - this.panY) / this.zoom;
                
                this.zoom = newZoom;
                
                this.panX = midPoint.x - worldMidX * this.zoom;
                this.panY = midPoint.y - worldMidY * this.zoom;
            }
            
            // Pan
            if (this.lastPanPoint) {
                const deltaX = midPoint.x - this.lastPanPoint.x;
                const deltaY = midPoint.y - this.lastPanPoint.y;
                
                this.panX += deltaX;
                this.panY += deltaY;
            }
            
            this.lastTouchDistance = distance;
            this.lastPanPoint = midPoint;
            this.render();
        }
    }
    
    handleTouchEnd(e) {
        e.preventDefault();
        this.touches = Array.from(e.touches);
        
        if (this.touches.length === 0) {
            this.isPanning = false;
            this.lastTouchDistance = 0;
            this.lastPanPoint = null;
            
            // Touch-Click simulieren wenn nicht gepannt wurde
            if (!this.isPanning && this.isDrawing) {
                this.confirmCurrentElement();
            }
        } else if (this.touches.length === 1) {
            this.isPanning = false;
        }
    }
    
    getTouchDistance(touch1, touch2) {
        const dx = touch1.clientX - touch2.clientX;
        const dy = touch1.clientY - touch2.clientY;
        return Math.sqrt(dx * dx + dy * dy);
    }
    
    getTouchMidpoint(touch1, touch2) {
        return {
            x: (touch1.clientX + touch2.clientX) / 2,
            y: (touch1.clientY + touch2.clientY) / 2
        };
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
            if (startDirection === 'horizontal') {
                startDirection = 'horizontal';
            } else {
                startDirection = 'vertical';
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
        
        this.calculateCurveEndpoint();
        const curveEnd = this.currentElement.end || this.currentElement.start;
        
        const dx = this.mousePos.x - curveEnd.x;
        const dy = this.mousePos.y - curveEnd.y;
        const mouseLineAngle = Math.atan2(dy, dx);
        let relativeAngle = mouseLineAngle - startAngle;
        
        while (relativeAngle > Math.PI) relativeAngle -= 2 * Math.PI;
        while (relativeAngle < -Math.PI) relativeAngle += 2 * Math.PI;
        
        let rawAngleDegrees = relativeAngle * 180 / Math.PI;
        
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
        
        finalAngle = Math.round(finalAngle);
        this.currentElement.angle = finalAngle;
        this.calculateCurveEndpoint();
        
        const newCurveEnd = this.currentElement.end || this.currentElement.start;
        const curveEndAngle = this.currentElement.endAngle || (startAngle + finalAngle * Math.PI / 180);
        
        const length = 100;
        const helperEndX = newCurveEnd.x + Math.cos(curveEndAngle) * length;
        const helperEndY = newCurveEnd.y + Math.sin(curveEndAngle) * length;
        
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
        
        // Zeichne fertige Elemente - DICKERE LINIEN
        this.elements.forEach(element => {
            this.drawElementWithColors(element, 6 / this.zoom); // Doppelt so dick
        });
        
        // Zeichne aktuelles Element
        if (this.currentElement) {
            this.drawElement(this.currentElement, '#e74c3c', 6 / this.zoom); // Doppelt so dick
            
            if (this.isDrawing) {
                this.drawCurrentValues();
                
                if (this.currentElement.type === 'curve') {
                    this.drawHelperLine();
                }
            }
        }
        
        // Zeichne aktive Punkte
        this.activePoints.forEach(point => {
            this.drawPoint(point, '#3498db', 12 / this.zoom); // Größere Punkte
        });
        
        this.ctx.restore();
        
        this.drawZoomInfo();
    }
    
    drawHelperLine() {
        if (!this.currentElement || this.currentElement.type !== 'curve' || !this.helperLineEnd) return;
        
        const curveEnd = this.currentElement.end || this.currentElement.start;
        
        this.ctx.strokeStyle = '#27ae60';
        this.ctx.lineWidth = 4 / this.zoom; // Dicker
        this.ctx.setLineDash([8 / this.zoom, 8 / this.zoom]);
        
        this.ctx.beginPath();
        this.ctx.moveTo(curveEnd.x, curveEnd.y);
        this.ctx.lineTo(this.helperLineEnd.x, this.helperLineEnd.y);
        this.ctx.stroke();
        
        this.ctx.setLineDash([]);
    }
    
    drawElementWithColors(element, width) {
        this.ctx.lineWidth = width;
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';
        
        const spurMapping = this.getSpurMappingForElement(element);
        
        // KEINE LÜCKE - Offset = 0
        const offset = 0;
        
        if (element.type === 'line') {
            const dx = element.end.x - element.start.x;
            const dy = element.end.y - element.start.y;
            const length = Math.sqrt(dx * dx + dy * dy);
            
            if (length > 0) {
                const normalX = -dy / length;
                const normalY = dx / length;
                
                // Spur A (nach links versetzt) - aber offset = 0
                this.ctx.strokeStyle = spurMapping.spurA;
                this.ctx.beginPath();
                this.ctx.moveTo(element.start.x + normalX * (width/2), element.start.y + normalY * (width/2));
                this.ctx.lineTo(element.end.x + normalX * (width/2), element.end.y + normalY * (width/2));
                this.ctx.stroke();
                
                // Spur B (nach rechts versetzt) - aber offset = 0
                this.ctx.strokeStyle = spurMapping.spurB;
                this.ctx.beginPath();
                this.ctx.moveTo(element.start.x - normalX * (width/2), element.start.y - normalY * (width/2));
                this.ctx.lineTo(element.end.x - normalX * (width/2), element.end.y - normalY * (width/2));
                this.ctx.stroke();
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
            
            // Äußerer Bogen - nur halbe Linienbreite Abstand
            this.ctx.strokeStyle = ersteSpurColor;
            this.ctx.beginPath();
            this.ctx.arc(element.center.x, element.center.y, element.radius + width/2, startAngle, endAngle, counterClockwise);
            this.ctx.stroke();
            
            // Innerer Bogen - nur halbe Linienbreite Abstand
            this.ctx.strokeStyle = zweiteSpurColor;
            this.ctx.beginPath();
            this.ctx.arc(element.center.x, element.center.y, element.radius - width/2, startAngle, endAngle, counterClockwise);
            this.ctx.stroke();
        }
    }
    
    getSpurMappingForElement(targetElement) {
        let spurA, spurB;
        if (this.colorSide === 'top') {
            spurA = this.settings.frontColor;
            spurB = this.settings.backColor;
        } else {
            spurA = this.settings.backColor;
            spurB = this.settings.frontColor;
        }
        
        return { spurA, spurB };
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
        this.ctx.lineWidth = 3 / this.zoom; // Dickerer Rand
        this.ctx.stroke();
    }
    
    drawCurrentValues() {
        if (!this.currentElement) return;
        
        let displayX, displayY, value, unit, color;
        
        if (this.currentElement.type === 'line') {
            displayX = this.currentElement.end.x;
            displayY = this.currentElement.end.y - 40 / this.zoom;
            value = this.currentElement.length;
            unit = 'mm';
            color = '#e74c3c';
        } else if (this.currentElement.type === 'curve') {
            if (this.currentElement.center) {
                displayX = this.currentElement.center.x;
                displayY = this.currentElement.center.y - 30 / this.zoom;
            } else {
                displayX = this.currentElement.start.x;
                displayY = this.currentElement.start.y - 40 / this.zoom;
            }
            value = this.currentElement.angle;
            unit = '°';
            color = '#f39c12';
        }
        
        const text = `${value}${unit}`;
        
        // FESTE SCHRIFTGRÖSSE UNABHÄNGIG VOM ZOOM
        const fontSize = 20 / this.zoom; // Größe umgekehrt proportional zum Zoom
        this.ctx.font = `${fontSize}px Arial`;
        this.ctx.textAlign = 'center';
        
        const textMetrics = this.ctx.measureText(text);
        const textWidth = textMetrics.width;
        const textHeight = fontSize;
        
        const padding = 12 / this.zoom; // Padding auch zoom-unabhängig
        const bgX = displayX - textWidth/2 - padding;
        const bgY = displayY - textHeight - padding;
        const bgWidth = textWidth + 2 * padding;
        const bgHeight = textHeight + 2 * padding;
        
        // Schatten
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        this.ctx.fillRect(bgX + 3/this.zoom, bgY + 3/this.zoom, bgWidth, bgHeight);
        
        // Weißer Hintergrund
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
        this.ctx.fillRect(bgX, bgY, bgWidth, bgHeight);
        
        // Rahmen
        this.ctx.strokeStyle = color;
        this.ctx.lineWidth = 3 / this.zoom;
        this.ctx.strokeRect(bgX, bgY, bgWidth, bgHeight);
        
        // Text
        this.ctx.fillStyle = color;
        this.ctx.font = `bold ${fontSize}px Arial`;
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
        this.ctx.fillRect(10, 10, 140, 35);
        
        this.ctx.fillStyle = 'white';
        this.ctx.font = '16px Arial'; // Größere Schrift
        this.ctx.fillText(`Zoom: ${Math.round(this.zoom * 100)}%`, 20, 32);
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
        const dist1 = Math.sqrt(Math.pow(line1.startX - line2.startX, 2) + Math.pow(line1.startY - line2.startY, 2));
        const dist2 = Math.sqrt(Math.pow(line1.endX - line2.endX, 2) + Math.pow(line1.endY - line2.endY, 2));
        return (dist1 < 80 && dist2 < 80);
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
        const margin = 250; // Noch mehr Platz für größere Schrift
        const drawingWidth = maxX - minX;
        const drawingHeight = maxY - minY;
        
        techCanvas.width = drawingWidth + 2 * margin;
        techCanvas.height = drawingHeight + 2 * margin + 300; // Viel mehr Platz
        
        // Weißer Hintergrund
        techCtx.fillStyle = 'white';
        techCtx.fillRect(0, 0, techCanvas.width, techCanvas.height);
        
        // Titel und Informationen - NOCH GRÖßERE SCHRIFT
        techCtx.fillStyle = 'black';
        techCtx.font = 'bold 96px Arial'; // DOPPELT SO GROß
        techCtx.textAlign = 'center';
        techCtx.fillText(partName, techCanvas.width / 2, 70);
        
        techCtx.font = 'bold 64px Arial'; // DOPPELT SO GROß
        techCtx.fillText(`Technische Zeichnung - Kantteil`, techCanvas.width / 2, 140);
        
        // WEBSITE-URL HINZUFÜGEN - DOPPELT SO GROß
        techCtx.font = 'bold 56px Arial';
        techCtx.fillStyle = '#1e3c72';
        techCtx.fillText('www.dachplattenrechner.de', techCanvas.width / 2, 200);
        
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
        
        // Unten Links - DOPPELT SO GROßE SCHRIFT
        techCtx.font = 'bold 48px Arial'; // DOPPELT SO GROß
        techCtx.textAlign = 'left';
        techCtx.fillStyle = 'black';
        techCtx.fillText(`Gesamtlänge: ${totalLength} mm`, 30, techCanvas.height - 200);
        techCtx.fillText(`Kantungen: ${kantungen}`, 30, techCanvas.height - 140);
        techCtx.fillText(`Benötigte Meter: ${quantityNeeded}`, 30, techCanvas.height - 80);
        techCtx.fillText(`Farbcode: ${this.settings.selectedColorCode}`, 30, techCanvas.height - 20); // NUR FARBCODE
        
        // Unten Rechts - DOPPELT SO GROßE SCHRIFT
        techCtx.textAlign = 'right';
        techCtx.fillText(`Materialstärke: ${this.settings.thickness} mm`, techCanvas.width - 30, techCanvas.height - 140);
        techCtx.fillText(`Datum: ${new Date().toLocaleDateString('de-DE')}`, techCanvas.width - 30, techCanvas.height - 80);
        techCtx.fillText(`erstellt mit dachplattenrechner.de`, techCanvas.width - 30, techCanvas.height - 20);
        
        // Verschiebe Koordinatensystem für Zeichnung
        techCtx.translate(-minX + margin, -minY + margin + 250); // Noch mehr Platz für riesigen Titel
        
        // Zeichne Elemente farbig mit dickeren Spuren
        this.drawTechnicalElements(techCtx);
        
        // Füge verbesserte Bemaßung hinzu
        this.addImprovedDimensions(techCtx);
        
        // Download als PNG
        const link = document.createElement('a');
        link.download = `${partName}_technische_zeichnung.png`;
        link.href = techCanvas.toDataURL();
        link.click();
        
        // Für PDF: Canvas als Bild in PDF einbetten
        this.generatePDF(techCanvas, partName);
        
        this.updateStatus('Technische Zeichnung wurde als PNG und PDF erstellt.');
    }
    
    drawTechnicalElements(ctx) {
        const spurMapping = this.getSpurMappingForElement(this.elements[0]);
        const lineWidth = 8; // VIEL DICKERE LINIEN
        
        this.elements.forEach(element => {
            if (element.type === 'line') {
                const dx = element.end.x - element.start.x;
                const dy = element.end.y - element.start.y;
                const length = Math.sqrt(dx * dx + dy * dy);
                
                if (length > 0) {
                    const normalX = -dy / length;
                    const normalY = dx / length;
                    
                    // Spur A - KEINE LÜCKE
                    ctx.strokeStyle = spurMapping.spurA;
                    ctx.lineWidth = lineWidth;
                    ctx.lineCap = 'round';
                    ctx.beginPath();
                    ctx.moveTo(element.start.x + normalX * (lineWidth/2), element.start.y + normalY * (lineWidth/2));
                    ctx.lineTo(element.end.x + normalX * (lineWidth/2), element.end.y + normalY * (lineWidth/2));
                    ctx.stroke();
                    
                    // Spur B - KEINE LÜCKE
                    ctx.strokeStyle = spurMapping.spurB;
                    ctx.beginPath();
                    ctx.moveTo(element.start.x - normalX * (lineWidth/2), element.start.y - normalY * (lineWidth/2));
                    ctx.lineTo(element.end.x - normalX * (lineWidth/2), element.end.y - normalY * (lineWidth/2));
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
                
                // Äußerer Bogen - KEINE LÜCKE
                ctx.strokeStyle = ersteSpurColor;
                ctx.beginPath();
                ctx.arc(element.center.x, element.center.y, element.radius + lineWidth/2, startAngle, endAngle, counterClockwise);
                ctx.stroke();
                
                // Innerer Bogen - KEINE LÜCKE
                ctx.strokeStyle = zweiteSpurColor;
                ctx.beginPath();
                ctx.arc(element.center.x, element.center.y, element.radius - lineWidth/2, startAngle, endAngle, counterClockwise);
                ctx.stroke();
            }
        });
    }
    
    addImprovedDimensions(ctx) {
        ctx.strokeStyle = 'blue';
        ctx.fillStyle = 'blue';
        ctx.lineWidth = 4; // Noch dickere Bemaßungslinien
        ctx.font = 'bold 40px Arial'; // DOPPELT SO GROß
        ctx.textAlign = 'center';
        
        const usedDimensionLines = [];
        
        this.elements.forEach((element, index) => {
            if (element.type === 'line') {
                const length = element.originalLength || element.length;
                
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
        
        if (length === 0) return { offset: 80, side: 1 }; // Größerer Standardabstand
        
        const normalX = -dy / length;
        const normalY = dx / length;
        
        const shapeCenter = this.calculateShapeCenter();
        const lineCenter = {
            x: (element.start.x + element.end.x) / 2,
            y: (element.start.y + element.end.y) / 2
        };
        
        const toCenter = {
            x: shapeCenter.x - lineCenter.x,
            y: shapeCenter.y - lineCenter.y
        };
        
        const dotProduct = normalX * toCenter.x + normalY * toCenter.y;
        const preferredSide = dotProduct > 0 ? -1 : 1;
        
        const lineLength = element.originalLength || element.length;
        const useInside = lineLength < 15;
        const finalSide = useInside ? -preferredSide : preferredSide;
        
        // GRÖßERE ABSTÄNDE
        const possibleOffsets = useInside ? [40, 55, 70] : [100, 130, 160, 190];
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
                
                const hasCollision = usedLines.some(usedLine => {
                    return this.linesIntersect(testPos, usedLine);
                });
                
                if (!hasCollision) {
                    return testPos;
                }
            }
        }
        
        return { 
            startX: element.start.x + normalX * (useInside ? 40 : 100),
            startY: element.start.y + normalY * (useInside ? 40 : 100),
            endX: element.end.x + normalX * (useInside ? 40 : 100),
            endY: element.end.y + normalY * (useInside ? 40 : 100),
            offset: useInside ? 40 : 100,
            side: 1,
            isInside: useInside
        };
    }
    
    drawDimensionLine(ctx, element, dimPos, length) {
        // KORREKTUR: Bemaßungslinien bis zur Kurvenmitte
        let startPoint = { x: element.start.x, y: element.start.y };
        let endPoint = { x: element.end.x, y: element.end.y };
        
        const dx = element.end.x - element.start.x;
        const dy = element.end.y - element.start.y;
        const lineLength = Math.sqrt(dx * dx + dy * dy);
        const normalX = lineLength > 0 ? -dy / lineLength : 0;
        const normalY = lineLength > 0 ? dx / lineLength : 0;
        
        // Prüfe vorherige Kurve und erweitere BIS ZUR MITTE
        const prevElement = this.elements[this.elements.indexOf(element) - 1];
        if (prevElement && prevElement.type === 'curve') {
            // Erweitere bis zur Kurvenmitte (nicht Außenkante)
            const unitX = lineLength > 0 ? -dx / lineLength : 0;
            const unitY = lineLength > 0 ? -dy / lineLength : 0;
            startPoint.x += unitX * prevElement.radius; // Bis zur Mitte
            startPoint.y += unitY * prevElement.radius;
        }
        
        // Prüfe nachfolgende Kurve und erweitere BIS ZUR MITTE
        const nextElement = this.elements[this.elements.indexOf(element) + 1];
        if (nextElement && nextElement.type === 'curve') {
            const unitX = lineLength > 0 ? dx / lineLength : 0;
            const unitY = lineLength > 0 ? dy / lineLength : 0;
            endPoint.x += unitX * nextElement.radius; // Bis zur Mitte
            endPoint.y += unitY * nextElement.radius;
        }
        
        // Zeichne Bemaßungslinie (dicker)
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(dimPos.startX, dimPos.startY);
        ctx.lineTo(dimPos.endX, dimPos.endY);
        ctx.stroke();
        
        // Zeichne SENKRECHTE Hilfslinien
        ctx.lineWidth = 2;
        ctx.beginPath();
        
        const helpStartX = startPoint.x + normalX * dimPos.offset * dimPos.side;
        const helpStartY = startPoint.y + normalY * dimPos.offset * dimPos.side;
        ctx.moveTo(startPoint.x, startPoint.y);
        ctx.lineTo(helpStartX, helpStartY);
        
        const helpEndX = endPoint.x + normalX * dimPos.offset * dimPos.side;
        const helpEndY = endPoint.y + normalY * dimPos.offset * dimPos.side;
        ctx.moveTo(endPoint.x, endPoint.y);
        ctx.lineTo(helpEndX, helpEndY);
        
        ctx.stroke();
        
        // Bemaßungstext - DOPPELT SO GROß
        const textX = (dimPos.startX + dimPos.endX) / 2;
        const textY = (dimPos.startY + dimPos.endY) / 2 - 20;
        
        // Weißer Hintergrund für bessere Lesbarkeit - größer
        ctx.fillStyle = 'white';
        ctx.fillRect(textX - 80, textY - 30, 160, 60); // Doppelt so groß
        ctx.strokeStyle = 'blue';
        ctx.lineWidth = 3;
        ctx.strokeRect(textX - 80, textY - 30, 160, 60);
        
        ctx.fillStyle = 'blue';
        ctx.font = 'bold 40px Arial'; // DOPPELT SO GROß
        ctx.fillText(`${length}mm`, textX, textY + 15);
    }
    
    generatePDF(canvas, partName) {
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
    
    document.getElementById('colorSideTop').classList.toggle('active', side === 'top');
    document.getElementById('colorSideBottom').classList.toggle('active', side === 'bottom');
    
    editor.render();
}

function openColorSelection() {
    window.open('farben.html', 'colorSelection', 'width=1000,height=700,scrollbars=yes,resizable=yes');
}

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
