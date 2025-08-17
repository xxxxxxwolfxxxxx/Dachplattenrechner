// Kantteile Editor - Mobile Touch Events
KantteileEditor.prototype.setupTouchEvents = function() {
    this.canvas.addEventListener('touchstart', (e) => this.handleTouchStart(e), { passive: false });
    this.canvas.addEventListener('touchmove', (e) => this.handleTouchMove(e), { passive: false });
    this.canvas.addEventListener('touchend', (e) => this.handleTouchEnd(e), { passive: false });
    
    // Verhindere Standard-Touch-Verhalten
    this.canvas.addEventListener('touchstart', (e) => e.preventDefault());
    this.canvas.addEventListener('touchmove', (e) => e.preventDefault());
};

KantteileEditor.prototype.handleTouchStart = function(e) {
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
};

KantteileEditor.prototype.handleTouchMove = function(e) {
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
};

KantteileEditor.prototype.handleTouchEnd = function(e) {
    const touchDuration = Date.now() - this.touchStartTime;
    
    if (e.touches.length === 0) {
        this.isPanning = false;
        this.lastTouchDistance = 0;
    }
};

KantteileEditor.prototype.handleTouchClick = function(screenPos) {
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
};

KantteileEditor.prototype.handleTwoFingerStart = function(e) {
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
};

KantteileEditor.prototype.handleTwoFingerMove = function(e) {
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
};

KantteileEditor.prototype.mobileZoom = function(factor) {
    const centerX = this.canvas.width / 2;
    const centerY = this.canvas.height / 2;
    
    const worldMouseX = (centerX - this.panX) / this.zoom;
    const worldMouseY = (centerY - this.panY) / this.zoom;
    
    this.zoom = Math.max(0.1, Math.min(10, this.zoom * factor));
    
    this.panX = centerX - worldMouseX * this.zoom;
    this.panY = centerY - worldMouseY * this.zoom;
    
    this.render();
};

KantteileEditor.prototype.togglePanMode = function() {
    this.panMode = !this.panMode;
    const btn = document.getElementById('panModeBtn');
    btn.classList.toggle('active', this.panMode);
    btn.textContent = this.panMode ? '✋' : '📱';
    
    this.updateStatus(this.panMode ? 
        'Verschiebe-Modus aktiv. Touch zum Verschieben.' : 
        'Zeichnen-Modus aktiv. Touch zum Setzen von Punkten.'
    );
};

KantteileEditor.prototype.showMobileInput = function() {
    if (this.drawingMode === 'line') {
        this.showModal('lengthModal');
    } else if (this.drawingMode === 'curve') {
        this.showModal('angleModal');
    }
};
