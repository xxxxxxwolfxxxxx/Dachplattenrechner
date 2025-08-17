// Kantteile Editor - Controls & Global Functions
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
    // Ändere die globale Farbseite (bleibt konstant, ändert sich nicht beim Biegen)
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

// Event Listeners für Modals und Initialisierung
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
