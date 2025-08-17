// Kantteile Editor - Rendering & Visual Logic
KantteileEditor.prototype.calculateCurveEndpoint = function() {
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
};

KantteileEditor.prototype.handlePointClick = function(point) {
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
};

KantteileEditor.prototype.getTravelDirection = function(lastElement) {
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
};

KantteileEditor.prototype.shortenLastLine = function(lineElement, radiusMM) {
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
};

KantteileEditor.prototype.confirmCurrentElement = function() {
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
};

KantteileEditor.prototype.updateMeasurements = function() {
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
};

KantteileEditor.prototype.render = function() {
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
            this.drawHelperLines();
        }
    }
    
    // Zeichne aktive Punkte
    this.activePoints.forEach(point => {
        this.drawPoint(point, '#3498db', this.isMobile ? 12 / this.zoom : 8 / this.zoom);
    });
    
    this.ctx.restore();
    
    this.drawZoomInfo();
};

KantteileEditor.prototype.drawElementWithColors = function(element, width) {
    this.ctx.lineWidth = width;
    this.ctx.lineCap = 'round';
    this.ctx.lineJoin = 'round';
    
    // Bestimme welche Farbe oben/unten ist basierend auf aktueller Farbseite
    const topColor = this.colorSide === 'top' ? this.settings.frontColor : this.settings.backColor;
    const bottomColor = this.colorSide === 'top' ? this.settings.backColor : this.settings.frontColor;
    
    if (element.type === 'line') {
        // Rückseite (unten) versetzt
        this.ctx.strokeStyle = bottomColor;
        this.ctx.globalAlpha = 0.7;
        
        this.ctx.beginPath();
        this.ctx.moveTo(element.start.x + 2, element.start.y + 2);
        this.ctx.lineTo(element.end.x + 2, element.end.y + 2);
        this.ctx.stroke();
        
        // Vorderseite (oben)
        this.ctx.strokeStyle = topColor;
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
        this.ctx.strokeStyle = bottomColor;
        this.ctx.globalAlpha = 0.7;
        
        this.ctx.beginPath();
        this.ctx.arc(element.center.x + 2, element.center.y + 2, element.radius, startAngle, endAngle, counterClockwise);
        this.ctx.stroke();
        
        // Vorderseite
        this.ctx.strokeStyle = topColor;
        this.ctx.globalAlpha = 1.0;
        
        this.ctx.beginPath();
        this.ctx.arc(element.center.x, element.center.y, element.radius, startAngle, endAngle, counterClockwise);
        this.ctx.stroke();
    }
    
    this.ctx.globalAlpha = 1.0;
};

KantteileEditor.prototype.drawElement = function(element, color, width) {
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
};

KantteileEditor.prototype.drawPoint = function(point, color, radius) {
    this.ctx.fillStyle = color;
    this.ctx.beginPath();
    this.ctx.arc(point.x, point.y, radius, 0, Math.PI * 2);
    this.ctx.fill();
    
    this.ctx.strokeStyle = 'white';
    this.ctx.lineWidth = 2 / this.zoom;
    this.ctx.stroke();
};

KantteileEditor.prototype.drawCurrentValues = function() {
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
};

KantteileEditor.prototype.drawHelperLines = function() {
    if (this.currentElement && this.currentElement.type === 'curve') {
        const start = this.currentElement.start;
        const startAngle = this.currentElement.startAngle;
        const radius = this.currentElement.radius;
        
        // Zeichne grüne gestrichelte Linie vom Kurvenstart zur Mausposition
        this.ctx.strokeStyle = 'rgba(39, 174, 96, 0.8)';
        this.ctx.lineWidth = 2 / this.zoom;
        this.ctx.setLineDash([8 / this.zoom, 4 / this.zoom]);
        
        this.ctx.beginPath();
        this.ctx.moveTo(start.x, start.y);
        this.ctx.lineTo(this.mousePos.x, this.mousePos.y);
        this.ctx.stroke();
        
        // Zeichne gestrichelten Kreis bei 2x Radius für 180°-Bereich
        this.ctx.strokeStyle = 'rgba(39, 174, 96, 0.4)';
        this.ctx.lineWidth = 1 / this.zoom;
        this.ctx.setLineDash([4 / this.zoom, 4 / this.zoom]);
        
        this.ctx.beginPath();
        this.ctx.arc(start.x, start.y, radius * 2, 0, Math.PI * 2);
        this.ctx.stroke();
        
        this.ctx.setLineDash([]);
    }
};

KantteileEditor.prototype.drawGrid = function() {
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
};

KantteileEditor.prototype.drawZoomInfo = function() {
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
};
