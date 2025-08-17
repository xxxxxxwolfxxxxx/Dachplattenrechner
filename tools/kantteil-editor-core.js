// Kantteile Editor - Basis-Klasse und Core Logic
function KantteileEditor() {
    this.canvas = document.getElementById('drawingCanvas');
    this.ctx = this.canvas.getContext('2d');
    this.isMobile = window.innerWidth <= 768;
    
    // Einstellungen
    this.settings = {
        thickness: 0.6,
        frontColor: '#8B4513',
        backColor: '#B8B799',
        selectedColorCode: '8004',
        selectedColorName: 'Kupferbraun',
        selectedColorType: 'RAL'
    };
    
    // Farbseite (oben/unten)
    this.colorSide = 'top';
    
    // Zeichenlogik
    this.elements = [];
    this.currentElement = null;
    this.activePoints = [];
    this.isDrawing = false;
    this.drawingMode = null; // 'line' oder 'curve'
    
    // Navigation
    this.zoom = 1;
    this.panX = 0;
    this.panY = 0;
    this.scale = 5; // Pixel pro mm
    
    // Maus/Touch
    this.mousePos = { x: 0, y: 0 };
    this.isPanning = false;
    this.panMode = false;
    this.lastPanPoint = { x: 0, y: 0 };
    this.isTouch = false;
    this.touchStartTime = 0;
    this.lastTouchDistance = 0;
    
    this.init();
}

KantteileEditor.prototype.init = function() {
    this.setupCanvas();
    this.setupEventListeners();
    this.setupMobileControls();
    this.loadSettingsFromURL();
    this.centerView();
    this.render();
};

KantteileEditor.prototype.setupCanvas = function() {
    this.resizeCanvas();
    window.addEventListener('resize', () => this.resizeCanvas());
};

KantteileEditor.prototype.resizeCanvas = function() {
    const container = this.canvas.parentElement;
    this.canvas.width = container.clientWidth;
    this.canvas.height = container.clientHeight;
    this.render();
};

KantteileEditor.prototype.setupEventListeners = function() {
    // Maus-Events
    this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
    this.canvas.addEventListener('click', (e) => this.handleMouseClick(e));
    this.canvas.addEventListener('wheel', (e) => this.handleWheel(e), { passive: false });
    this.canvas.addEventListener('mousedown', (e) => this.handleMouseDown(e));
    this.canvas.addEventListener('mouseup', (e) => this.handleMouseUp(e));
    
    // Touch-Events
    this.setupTouchEvents();
    
    // Tastatur-Events
    document.addEventListener('keydown', (e) => this.handleKeyDown(e));
    document.addEventListener('keyup', (e) => this.handleKeyUp(e));
};

KantteileEditor.prototype.setupMobileControls = function() {
    if (this.isMobile) {
        document.getElementById('mobileControls').style.display = 'flex';
        
        document.getElementById('zoomInBtn').addEventListener('click', () => this.mobileZoom(1.2));
        document.getElementById('zoomOutBtn').addEventListener('click', () => this.mobileZoom(0.8));
        document.getElementById('panModeBtn').addEventListener('click', () => this.togglePanMode());
        document.getElementById('helpBtn').addEventListener('click', () => {
            document.getElementById('helpOverlay').style.display = 'flex';
        });
    }
};

KantteileEditor.prototype.loadSettingsFromURL = function() {
    const params = new URLSearchParams(window.location.search);
    
    if (params.has('thickness')) {
        this.settings.thickness = parseFloat(params.get('thickness'));
    }
    if (params.has('frontColor')) {
        this.settings.frontColor = params.get('frontColor');
    }
    if (params.has('selectedColorCode')) {
        this.settings.selectedColorCode = params.get('selectedColorCode');
    }
    if (params.has('selectedColorName')) {
        this.settings.selectedColorName = params.get('selectedColorName');
    }
};

KantteileEditor.prototype.handleMouseMove = function(e) {
    if (this.isTouch) return;
    
    const rect = this.canvas.getBoundingClientRect();
    this.mousePos = this.getWorldCoordinates(
        e.clientX - rect.left,
        e.clientY - rect.top
    );
    
    if (this.isPanning) {
        this.panX += e.clientX - this.lastPanPoint.x;
        this.panY += e.clientY - this.lastPanPoint.y;
        this.lastPanPoint = { x: e.clientX, y: e.clientY };
        this.render();
        return;
    }
    
    if (this.isDrawing) {
        if (this.drawingMode === 'line') {
            this.updateLineFromMouse();
        } else if (this.drawingMode === 'curve') {
            this.updateCurveFromMouse();
        }
        this.render();
    }
};

KantteileEditor.prototype.handleMouseClick = function(e) {
    if (this.isTouch) return;
    
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
};

KantteileEditor.prototype.handleMouseDown = function(e) {
    if (e.button === 1) { // Mittlere Maustaste
        e.preventDefault();
        this.isPanning = true;
        this.lastPanPoint = { x: e.clientX, y: e.clientY };
    }
};

KantteileEditor.prototype.handleMouseUp = function(e) {
    if (e.button === 1) {
        this.isPanning = false;
    }
};

KantteileEditor.prototype.handleWheel = function(e) {
    e.preventDefault();
    
    const rect = this.canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    const worldMouseX = (mouseX - this.panX) / this.zoom;
    const worldMouseY = (mouseY - this.panY) / this.zoom;
    
    const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
    this.zoom = Math.max(0.1, Math.min(10, this.zoom * zoomFactor));
    
    this.panX = mouseX - worldMouseX * this.zoom;
    this.panY = mouseY - worldMouseY * this.zoom;
    
    this.render();
};

KantteileEditor.prototype.handleKeyDown = function(e) {
    if (e.code === 'Space') {
        e.preventDefault();
        if (this.drawingMode === 'line') {
            this.showModal('lengthModal');
            document.getElementById('currentLength').textContent = this.currentElement.length;
            document.getElementById('lengthInput').value = this.currentElement.length;
            document.getElementById('lengthInput').focus();
        } else if (this.drawingMode === 'curve') {
            this.showModal('angleModal');
            document.getElementById('currentAngle').textContent = this.currentElement.angle || 0;
            document.getElementById('angleInput').value = this.currentElement.angle || 0;
            document.getElementById('angleInput').focus();
        }
    } else if (e.code === 'Enter') {
        if (this.isDrawing) {
            this.confirmCurrentElement();
        }
    } else if (e.code === 'Escape') {
        closeEditor();
    }
};

KantteileEditor.prototype.handleKeyUp = function(e) {
    // Placeholder für future key up events
};

KantteileEditor.prototype.getWorldCoordinates = function(screenX, screenY) {
    return {
        x: (screenX - this.panX) / this.zoom,
        y: (screenY - this.panY) / this.zoom
    };
};

KantteileEditor.prototype.getScreenCoordinates = function(worldX, worldY) {
    return {
        x: worldX * this.zoom + this.panX,
        y: worldY * this.zoom + this.panY
    };
};

KantteileEditor.prototype.startDrawing = function() {
    const button = document.getElementById('startBtn');
    button.style.display = 'none';
    
    if (this.isMobile) {
        document.getElementById('mobileInputBtn').style.display = 'inline-block';
    }
    
    const centerX = this.canvas.width / 2;
    const centerY = this.canvas.height / 2;
    const startPoint = this.getWorldCoordinates(centerX, centerY);
    
    this.currentElement = {
        type: 'line',
        start: startPoint,
        end: { ...startPoint },
        direction: 'horizontal',
        angle: 0,
        length: 0,
        thickness: this.settings.thickness
    };
    
    this.isDrawing = true;
    this.drawingMode = 'line';
    
    const statusMsg = this.isMobile ?
        'Zeichnen Sie die erste Linie. Touch zum Setzen oder "Eingabe"-Button.' :
        'Zeichnen Sie die erste Linie. Bewegen Sie die Maus oder drücken Sie Leertaste für manuelle Eingabe.';
    this.updateStatus(statusMsg);
    
    this.render();
};

KantteileEditor.prototype.updateLineFromMouse = function() {
    if (!this.currentElement || this.currentElement.type !== 'line') return;
    
    const start = this.currentElement.start;
    const mouse = this.mousePos;
    
    if (this.currentElement.direction === 'tangential') {
        const angle = this.currentElement.angle;
        const distance = Math.sqrt(
            Math.pow(mouse.x - start.x, 2) + 
            Math.pow(mouse.y - start.y, 2)
        );
        
        this.currentElement.end = {
            x: start.x + Math.cos(angle) * distance,
            y: start.y + Math.sin(angle) * distance
        };
        this.currentElement.length = Math.round(distance / this.scale);
    } else if (this.currentElement.direction === 'horizontal') {
        this.currentElement.end = { x: mouse.x, y: start.y };
        this.currentElement.length = Math.round(Math.abs(mouse.x - start.x) / this.scale);
    } else {
        this.currentElement.end = { x: start.x, y: mouse.y };
        this.currentElement.length = Math.round(Math.abs(mouse.y - start.y) / this.scale);
    }
};

KantteileEditor.prototype.updateLineFromLength = function(lengthMM) {
    if (!this.currentElement || this.currentElement.type !== 'line') return;
    
    const lengthPixels = lengthMM * this.scale;
    const start = this.currentElement.start;
    
    if (this.currentElement.direction === 'tangential') {
        const angle = this.currentElement.angle;
        this.currentElement.end = {
            x: start.x + Math.cos(angle) * lengthPixels,
            y: start.y + Math.sin(angle) * lengthPixels
        };
    } else if (this.currentElement.direction === 'horizontal') {
        this.currentElement.end = {
            x: start.x + lengthPixels,
            y: start.y
        };
    } else {
        this.currentElement.end = {
            x: start.x,
            y: start.y + lengthPixels
        };
    }
    
    this.currentElement.length = lengthMM;
};

KantteileEditor.prototype.updateCurveFromMouse = function() {
    if (!this.currentElement || this.currentElement.type !== 'curve') return;
    
    const start = this.currentElement.start;
    const mouse = this.mousePos;
    const distance = Math.sqrt(
        Math.pow(mouse.x - start.x, 2) + 
        Math.pow(mouse.y - start.y, 2)
    );
    
    let angle = Math.atan2(mouse.y - start.y, mouse.x - start.x) - this.currentElement.startAngle;
    
    while (angle > Math.PI) angle -= 2 * Math.PI;
    while (angle < -Math.PI) angle += 2 * Math.PI;
    
    this.currentElement.angle = Math.round(angle * 180 / Math.PI);
    this.calculateCurveEndpoint();
};

KantteileEditor.prototype.updateStatus = function(message) {
    document.getElementById('statusText').textContent = message;
};

KantteileEditor.prototype.centerView = function() {
    this.zoom = 1;
    this.panX = this.canvas.width / 2;
    this.panY = this.canvas.height / 2;
    this.render();
};

KantteileEditor.prototype.clearCanvas = function() {
    this.elements = [];
    this.activePoints = [];
    this.currentElement = null;
    this.isDrawing = false;
    this.drawingMode = null;
    
    document.getElementById('startBtn').style.display = 'inline-block';
    document.getElementById('measurementPanel').style.display = 'none';
    
    if (this.isMobile) {
        document.getElementById('mobileInputBtn').style.display = 'none';
    }
    
    this.updateStatus('Zeichnung gelöscht. Klicken Sie "Zeichnung starten" zum Beginnen.');
    this.render();
};

KantteileEditor.prototype.exportSketch = function() {
    this.showModal('exportModal');
    document.getElementById('partName').focus();
};

KantteileEditor.prototype.showModal = function(modalId) {
    document.getElementById(modalId).style.display = 'flex';
};

// Globale Funktionen
function showModal(modalId) {
    if (editor) {
        editor.showModal(modalId);
    }
}

function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}

// Editor Control Functions
function setColorSide(side) {
    if (editor) {
        editor.colorSide = side;
        
        // Update button states
        document.getElementById('colorSideTop').classList.toggle('active', side === 'top');
        document.getElementById('colorSideBottom').classList.toggle('active', side === 'bottom');
        
        editor.render();
    }
}

function openColorSelection() {
    window.open('farben.html', 'colorSelection', 'width=1000,height=700,scrollbars=yes,resizable=yes');
}

function centerView() {
    if (editor) {
        editor.centerView();
    }
}

function clearCanvas() {
    if (editor) {
        editor.clearCanvas();
    }
}

function exportSketch() {
    if (editor) {
        editor.exportSketch();
    }
}

function closeEditor() {
    if (window.parent && window.parent.closeEditor) {
        window.parent.closeEditor();
    }
}

function startDrawing() {
    if (editor) {
        editor.startDrawing();
    }
}

function showMobileInput() {
    if (editor) {
        editor.showMobileInput();
    }
}

function closeHelp() {
    document.getElementById('helpOverlay').style.display = 'none';
}

function confirmLength() {
    const input = document.getElementById('lengthInput');
    const length = parseFloat(input.value);
    
    if (length && length > 0 && editor && editor.currentElement) {
        editor.updateLineFromLength(length);
        editor.render();
        closeModal('lengthModal');
    }
}

function confirmAngle() {
    const input = document.getElementById('angleInput');
    const angle = parseFloat(input.value);
    
    if (angle !== null && !isNaN(angle) && editor && editor.currentElement) {
        editor.currentElement.angle = angle;
        editor.calculateCurveEndpoint();
        editor.render();
        closeModal('angleModal');
    }
}

function confirmExport() {
    const partName = document.getElementById('partName').value;
    const quantity = document.getElementById('quantityNeeded').value;
    
    if (editor) {
        // Export logic would go here
        console.log('Export:', partName, quantity);
        closeModal('exportModal');
    }
}

// Global editor instance
let editor;

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    editor = new KantteileEditor();
});
