// Kantteile Editor - JavaScript
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
        this.colorSide = 'top';
        
        // Touch/Mobile support
        this.isMobile = this.detectMobile();
        this.isTouch = false;
        this.touchStartTime = 0;
        this.panMode = false;
        this.lastTouchDistance = 0;
        
        this.loadSettings();
        this.initCanvas();
        this.setupEventListeners();
        this.setupMobileControls();
        this.render();
        
        // Zeige Hilfe beim ersten Start
        this.showHelp();
    }
    
    detectMobile() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || 
               window.innerWidth <= 768;
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
        if (this.isMobile) {
            this.setupTouchEvents();
        } else {
            this.setupMouseEvents();
        }
        
        document.addEventListener('keydown', (e) => this.handleKeyDown(e));
        this.canvas.setAttribute('tabindex', '0');
        this.canvas.focus();
    }
    
    setupMouseEvents() {
        this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        this.canvas.addEventListener('click', (e) => this.handleClick(e));
        this.canvas.addEventListener('wheel', (e) => this.handleWheel(e));
        this.canvas.addEventListener('mousedown', (e) => this.handleMouseDown(e));
        this.canvas.addEventListener('mouseup', (e) => this.handleMouseUp(e));
        this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());
    }
    
    setupTouchEvents() {
        this.canvas.addEventListener('touchstart', (e) => this.handleTouchStart(e), { passive: false });
        this.canvas.addEventListener('touchmove', (e) => this.handleTouchMove(e), { passive: false });
        this.canvas.addEventListener('touchend', (e) => this.handleTouchEnd(e), { passive: false });
        
        // Verhindere Standard-Touch-Verhalten
        this.canvas.addEventListener('touchstart', (e) => e.preventDefault());
        this.canvas.addEventListener('touchmove', (e) => e.preventDefault());
    }
    
    setupMobileControls() {
        if (!this.isMobile) return;
        
        document.getElementById('zoomInBtn').addEventListener('click', () => this.mobileZoom(1.2));
        document.getElementById('zoomOutBtn').addEventListener('click', () => this.mobileZoom(0.8));
        document.getElementById('panModeBtn').addEventListener('click', () => this.togglePanMode());
        document.getElementById('helpBtn').addEventListener('click', () => this.showHelp());
        
        // Mobile Input Button anzeigen
        if (this.isDrawing) {
            document.getElementById('mobileInputBtn').style.display = 'block';
        }
    }
    
    handleTouchStart(e) {
        this.isTouch = true;
        this.touchStartTime = Date.now();
        
        if (e.touches.length === 1) {
            const touch = e.touches[0];
            const rect = this.canvas.getBoundingClientRect();
            const screenPos = {
                x: touch.clientX - rect.left,
                y: touch.clientY - rect.top
            };
            
            if (this.panMode) {
                this.isPanning = true;
                this.lastPanPoint = { x: touch.clientX, y: touch.clientY };
            } else {
                this.mousePos = this.getWorldCoordinates(screenPos.x, screenPos.y);
                this.handleTouchClick(screenPos);
            }
        } else if (e.touches.length === 2) {
            // Zwei-Finger-Touch für Zoom/Pan
            this.handleTwoFingerStart(e);
        }
    }
    
    handleTouchMove(e) {
        if (e.touches.length === 1) {
            const touch = e.touches[0];
            const rect = this.canvas.getBoundingClientRect();
            const screenPos = {
                x: touch.clientX - rect.left,
                y: touch.clientY - rect.top
            };
            
            if (this.isPanning || this.panMode) {
                const deltaX = touch.clientX - this.lastPanPoint.x;
                const deltaY = touch.clientY - this.lastPanPoint.y;
                
                this.panX += deltaX;
                this.panY += deltaY;
                
                this.lastPanPoint = { x: touch.clientX, y: touch.clientY };
                this.render();
            } else if (this.isDrawing) {
                this.mousePos = this.getWorldCoordinates(screenPos.x, screenPos.y);
                if (this.drawingMode === 'line') {
                    this.updateLineFromMouse();
                } else if (this.drawingMode === 'curve') {
                    this.updateCurveFromMouse();
                }
                this.render();
            }
        } else if (e.touches.length === 2) {
            this.handleTwoFingerMove(e);
        }
    }
    
    handleTouchEnd(e) {
        const touchDuration = Date.now() - this.touchStartTime;
        
        if (e.touches.length === 0) {
            this.isPanning = false;
            this.lastTouchDistance = 0;
            
            // Kurzer Touch = Click
            if (touchDuration < 300 && !this.panMode) {
                // Touch-Click wurde bereits in touchstart behandelt
            }
        }
    }
    
    handleTwoFingerStart(e) {
        const touch1 = e.touches[0];
        const touch2 = e.touches[1];
        this.lastTouchDistance = Math.sqrt(
            Math.pow(touch2.clientX - touch1.clientX, 2) +
            Math.pow(touch2.clientY - touch1.clientY, 2)
        );
        
        this.lastPanPoint = {
            x: (touch1.clientX + touch2.clientX) / 2,
            y: (touch1.clientY + touch2.clientY) / 2
        };
    }
    
    handleTwoFingerMove(e) {
        const touch1 = e.touches[0];
        const touch2 = e.touches[1];
        const currentDistance = Math.sqrt(
            Math.pow(touch2.clientX - touch1.clientX, 2) +
            Math.pow(touch2.clientY - touch1.clientY, 2)
        );
        
        if (this.lastTouchDistance > 0) {
            // Zoom
            const zoomFactor = currentDistance / this.lastTouchDistance;
            const newZoom = Math.max(0.1, Math.min(10, this.zoom * zoomFactor));
            
            const centerX = (touch1.clientX + touch2.clientX) / 2;
            const centerY = (touch1.clientY + touch2.clientY) / 2;
            
            const worldMouseX = (centerX - this.panX) / this.zoom;
            const worldMouseY = (centerY - this.panY) / this.zoom;
            
            this.zoom = newZoom;
            
            this.panX = centerX - worldMouseX * this.zoom;
            this.panY = centerY - worldMouseY * this.zoom;
            
            // Pan
            const currentCenterX = (touch1.clientX + touch2.clientX) / 2;
            const currentCenterY = (touch1.clientY + touch2.clientY) / 2;
            
            this.panX += currentCenterX - this.lastPanPoint.x;
            this.panY += currentCenterY - this.lastPanPoint.y;
            
            this.lastPanPoint = { x: currentCenterX, y: currentCenterY };
        }
        
        this.lastTouchDistance = currentDistance;
        this.render();
    }
    
    handleTouchClick(screenPos) {
        // Prüfe auf Klick auf aktive Punkte
        const clickedPoint = this.activePoints.find(point => {
            const screenPoint = this.getScreenCoordinates(point.x, point.y);
            const distance = Math.sqrt(
                Math.pow(screenPos.x - screenPoint.x, 2) + 
                Math.pow(screenPos.y - screenPoint.y, 2)
            );
            return distance < 30; // Größerer Bereich für Touch
        });
        
        if (clickedPoint) {
            this.handlePointClick(clickedPoint);
            return;
        }
        
        if (this.isDrawing) {
            this.confirmCurrentElement();
        }
    }
    
    mobileZoom(factor) {
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        
        const worldMouseX = (centerX - this.panX) / this.zoom;
        const worldMouseY = (centerY - this.panY) / this.zoom;
        
        this.zoom = Math.max(0.1, Math.min(10, this.zoom * factor));
        
        this.panX = centerX - worldMouseX * this.zoom;
        this.panY = centerY - worldMouseY * this.zoom;
        
        this.render();
    }
    
    togglePanMode() {
        this.panMode = !this.panMode;
        const btn = document.getElementById('panModeBtn');
        btn.classList.toggle('active', this.panMode);
        btn.textContent = this.panMode ? '✋' : '📱';
        
        this.updateStatus(this.panMode ? 
            'Verschiebe-Modus aktiv. Touch zum Verschieben.' : 
            'Zeichnen-Modus aktiv. Touch zum Setzen von Punkten.'
        );
    }
    
    showMobileInput() {
        if (this.drawingMode === 'line') {
            this.showModal('lengthModal');
        } else if (this.drawingMode === 'curve') {
            this.showModal('angleModal');
        }
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
        
        this.currentElement = {
            type: 'line',
            start: { ...this.startPos },
            end: { ...this.startPos },
            direction: this.settings.firstLineType,
            length: 0,
            thickness: this.settings.thickness
        };
        
        const statusMsg = this.isMobile ? 
            'Touch zum Setzen der Linie oder "Eingabe"-Button für manuelle Eingabe.' :
            'Bewegen Sie die Maus oder drücken Sie Leertaste für manuelle Eingabe. Bestätigen mit Linksklick oder Enter.';
        this.updateStatus(statusMsg);
        
        document.getElementById('startBtn').style.display = 'none';
        if (this.isMobile) {
            document.getElementById('mobileInputBtn').style.display = 'block';
        }
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
    }
    
    updateCurveFromMouse() {
        if (!this.currentElement || this.currentElement.type !== 'curve') return;
        
        const start = this.currentElement.start;
        const startAngle = this.currentElement.startAngle;
        const radius = this.currentElement.radius;
        
        const dx = this.mousePos.x - start.x;
        const dy = this.mousePos.y - start.y;
        
        // Berechne den Winkel direkt von der Startrichtung zur Mausposition
        let mouseAngle = Math.atan2(dy, dx);
        let relativeAngle = mouseAngle - startAngle;
        
        // Normalisiere Winkel auf -π bis π
        while (relativeAngle > Math.PI) relativeAngle -= 2 * Math.PI;
        while (relativeAngle < -Math.PI) relativeAngle += 2 * Math.PI;
        
        let angleDegrees = relativeAngle * 180 / Math.PI;
        
        // Spezielle Behandlung für große Winkel (>90°)
        const currentAngleDeg = Math.abs(angleDegrees);
        if (currentAngleDeg > 90) {
            // Bei großen Winkeln: Prüfe ob wir nahe an 180° sind
            const mouseDistance = Math.sqrt(dx * dx + dy * dy);
            
            // Berechne den theoretischen Abstand für 180°
            // Bei 180° sollte die Maus auf Höhe von 2x Radius sein
            const expectedDistanceFor180 = 2 * radius;
            
            // Wenn wir nahe der 180°-Position sind, snap zu 180°
            if (mouseDistance >= expectedDistanceFor180 * 0.95) {
                // Prüfe Richtung: oberhalb oder unterhalb der Startlinie
                const startDirection = { x: Math.cos(startAngle), y: Math.sin(startAngle) };
                const perpendicular = { x: -startDirection.y, y: startDirection.x };
                
                // Projiziere Mausvektor auf senkrechte Richtung
                const perpProjection = dx * perpendicular.x + dy * perpendicular.y;
                
                if (Math.abs(perpProjection) >= radius * 1.8) { // Bei etwa 2x Radius Höhe
                    angleDegrees = perpProjection > 0 ? 180 : -180;
                }
            }
        }
        
        // Runde auf ganze Grade
        angleDegrees = Math.round(angleDegrees);
        
        // Begrenze auf ±180°
        if (angleDegrees > 180) angleDegrees = 180;
        if (angleDegrees < -180) angleDegrees = -180;
        
        this.currentElement.angle = angleDegrees;
        document.getElementById('currentAngle').textContent = angleDegrees;
        
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
        
        const statusMsg = this.isMobile ?
            'Wählen Sie den Biegewinkel (-180° bis +180°). Touch zum Bestätigen oder "Eingabe"-Button.' :
            'Wählen Sie den Biegewinkel (-180° bis +180°). Negativ = links, Positiv = rechts.';
        this.updateStatus(statusMsg);
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
            const statusMsg = this.isMobile ?
                'Zeichnen Sie die nächste Linie. Touch zum Setzen oder "Eingabe"-Button.' :
                'Zeichnen Sie die nächste Linie. Bewegen Sie die Maus oder drücken Sie Leertaste für manuelle Eingabe.';
            this.updateStatus(statusMsg);
        } else {
            this.activePoints.push({ ...this.currentElement.end });
            this.currentElement = null;
            this.isDrawing = false;
            this.drawingMode = null;
            const statusMsg = this.isMobile ?
                'Touch auf den blauen Punkt um eine Kurve hinzuzufügen.' :
                'Klicken Sie auf den blauen Punkt um eine Kurve hinzuzufügen.';
            this.updateStatus(statusMsg);
            
            if (this.isMobile) {
                document.getElementById('mobileInputBtn').style.display = 'none';
            }
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
            }
        }
        
        // Zeichne aktive Punkte
        this.activePoints.forEach(point => {
            this.drawPoint(point, '#3498db', this.isMobile ? 12 / this.zoom : 8 / this.zoom);
        });
        
        this.ctx.restore();
        
        this.drawZoomInfo();
    }
    
    drawElementWithColors(element, width) {
        this.ctx.lineWidth = width;
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';
        
        if (element.type === 'line') {
            // Rückseite (betongrau) versetzt
            this.ctx.strokeStyle = this.settings.backColor;
            this.ctx.globalAlpha = 0.7;
            
            this.ctx.beginPath();
            this.ctx.moveTo(element.start.x + 2, element.start.y + 2);
            this.ctx.lineTo(element.end.x + 2, element.end.y + 2);
            this.ctx.stroke();
            
            // Vorderseite (gewählte Farbe)
            this.ctx.strokeStyle = this.settings.frontColor;
            this.ctx.globalAlpha = 1.0;
            
            this.ctx.beginPath();
            this.ctx.moveTo(element.start.x, element.start.y);
            this.ctx.lineTo(element.end.x, element.end.y);
            this.ctx.stroke();
            
        } else if (element.type === 'curve' && element.center && element.angle !== 0) {
            const startAngle = element.startAngleFromCenter;
            const endAngle = element.endAngleFromCenter;
            const counterClockwise = element.angle < 0;
            
            // Rückseite
            this.ctx.strokeStyle = this.settings.backColor;
            this.ctx.globalAlpha = 0.7;
            
            this.ctx.beginPath();
            this.ctx.arc(element.center.x + 2, element.center.y + 2, element.radius, startAngle, endAngle, counterClockwise);
            this.ctx.stroke();
            
            // Vorderseite
            this.ctx.strokeStyle = this.settings.frontColor;
            this.ctx.globalAlpha = 1.0;
            
            this.ctx.beginPath();
            this.ctx.arc(element.center.x, element.center.y, element.radius, startAngle, endAngle, counterClockwise);
            this.ctx.stroke();
        }
        
        this.ctx.globalAlpha = 1.0;
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
            // Dynamische Positionierung der Winkelanzeige
            const currentAngle = Math.abs(this.currentElement.angle || 0);
            let displayRadius = this.currentElement.radius + 30 / this.zoom;
            
            // Bei großen Winkeln (>90°) weiter weg anzeigen
            if (currentAngle > 90) {
                displayRadius = this.currentElement.radius * 2.5;
            }
            
            if (this.currentElement.center) {
                // Positioniere Anzeige basierend auf mittlerem Winkel der Kurve
                const startAngle = this.currentElement.startAngle;
                const halfAngle = (this.currentElement.angle || 0) * Math.PI / 360; // Halber Winkel in Radiant
                const middleAngle = startAngle + halfAngle;
                
                displayX = this.currentElement.center.x + Math.cos(middleAngle) * displayRadius;
                displayY = this.currentElement.center.y + Math.sin(middleAngle) * displayRadius;
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
        
        // Bei Kurven: Zeichne Hilfslinien für 180°-Positionen
        if (this.currentElement.type === 'curve') {
            const start = this.currentElement.start;
            const startAngle = this.currentElement.startAngle;
            const radius = this.currentElement.radius;
            
            // Zeichne 180°-Hilfslinie (2x Radius Abstand)
            this.ctx.strokeStyle = 'rgba(241, 196, 15, 0.4)';
            this.ctx.lineWidth = 1 / this.zoom;
            this.ctx.setLineDash([3 / this.zoom, 3 / this.zoom]);
            
            // Berechne senkrechte Richtung zur Startrichtung
            const startDirection = { x: Math.cos(startAngle), y: Math.sin(startAngle) };
            const perpendicular = { x: -startDirection.y, y: startDirection.x };
            
            // Zeichne +180° Linie (oben)
            const plus180Point = {
                x: start.x + perpendicular.x * radius * 2,
                y: start.y + perpendicular.y * radius * 2
            };
            this.ctx.beginPath();
            this.ctx.moveTo(start.x, start.y);
            this.ctx.lineTo(plus180Point.x, plus180Point.y);
            this.ctx.stroke();
            
            // Zeichne -180° Linie (unten)
            const minus180Point = {
                x: start.x - perpendicular.x * radius * 2,
                y: start.y - perpendicular.y * radius * 2
            };
            this.ctx.beginPath();
            this.ctx.moveTo(start.x, start.y);
            this.ctx.lineTo(minus180Point.x, minus180Point.y);
            this.ctx.stroke();
            
            // Zeichne Markierungen an den 180°-Punkten
            this.ctx.fillStyle = 'rgba(241, 196, 15, 0.8)';
            this.ctx.beginPath();
            this.ctx.arc(plus180Point.x, plus180Point.y, 3 / this.zoom, 0, Math.PI * 2);
            this.ctx.fill();
            
            this.ctx.beginPath();
            this.ctx.arc(minus180Point.x, minus180Point.y, 3 / this.zoom, 0, Math.PI * 2);
            this.ctx.fill();
            
            this.ctx.setLineDash([]);
        }
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
        
        // Zoom-Info jetzt rechts unten positioniert
        const infoText = `Zoom: ${Math.round(this.zoom * 100)}%`;
        this.ctx.font = '14px Arial';
        const textWidth = this.ctx.measureText(infoText).width;
        
        const x = this.canvas.width - textWidth - 30;
        const y = this.canvas.height - 40;
        
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillRect(x - 10, y - 20, textWidth + 20, 30);
        
        this.ctx.fillStyle = 'white';
        this.ctx.fillText(infoText, x, y);
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
        if (this.isMobile) {
            document.getElementById('mobileInputBtn').style.display = 'none';
        }
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

    showHelp() {
        document.getElementById('helpOverlay').style.display = 'flex';
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

function closeHelp() {
    document.getElementById('helpOverlay').style.display = 'none';
}

function showMobileInput() {
    editor.showMobileInput();
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
    const partName = document.getElementById('partName').value.trim();
    const quantity = parseFloat(document.getElementById('quantityNeeded').value) || 0;
    
    // Vereinfachter Export - erstelle Download
    const link = document.createElement('a');
    link.download = `kantteil_${partName || 'skizze'}_${new Date().toISOString().split('T')[0]}.png`;
    link.href = editor.canvas.toDataURL('image/png');
    link.click();
    
    closeModal('exportModal');
}

// Event Listeners für Modals
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('lengthInput').addEventListener('keydown', (e) => {
        if (e.key === 'Enter') confirmLength();
        if (e.key === 'Escape') closeModal('lengthModal');
    });

    document.getElementById('angleInput').addEventListener('keydown', (e) => {
        if (e.key === 'Enter') confirmAngle();
        if (e.key === 'Escape') closeModal('angleModal');
    });

    // Initialisierung
    editor = new KantteileEditor();
});
