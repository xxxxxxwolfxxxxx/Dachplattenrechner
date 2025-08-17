// Kantteile Editor - UI Controls & Modal Logic

// Globale Editor-Instanz
let editor;

// Hauptfunktionen
function startDrawing() {
    if (editor) editor.startDrawing();
}

function clearCanvas() {
    if (editor) editor.clearCanvas();
}

function centerView() {
    if (editor) editor.centerView();
}

function exportSketch() {
    if (editor) {
        if (editor.elements.length === 0) {
            alert('Keine Zeichnung zum Exportieren vorhanden!');
            return;
        }
        editor.showModal('exportModal');
        document.getElementById('partName').focus();
    }
}

function closeEditor() {
    if (window.parent && window.parent.closeEditor) {
        window.parent.closeEditor();
    } else {
        window.close();
    }
}

function closeHelp() {
    document.getElementById('helpOverlay').style.display = 'none';
}

// Farbseiten-Steuerung
function setColorSide(side) {
    if (editor) {
        editor.colorSide = side;
        
        // Button-Status aktualisieren
        document.getElementById('colorSideTop').classList.toggle('active', side === 'top');
        document.getElementById('colorSideBottom').classList.toggle('active', side === 'bottom');
        
        editor.render();
    }
}

function openColorSelection() {
    window.open('farben.html', 'colorSelection', 'width=1000,height=700,scrollbars=yes,resizable=yes');
}

// Callback für Farbauswahl
window.onColorSelected = function(colorData) {
    if (editor) {
        editor.settings.frontColor = colorData.color;
        editor.settings.selectedColorCode = colorData.code;
        editor.settings.selectedColorName = colorData.name;
        editor.settings.selectedColorType = colorData.type;
        
        editor.render();
    }
};

// Modal-Funktionen
function showModal(modalId) {
    document.getElementById(modalId).style.display = 'flex';
    
    if (modalId === 'lengthModal' && editor && editor.currentElement) {
        const input = document.getElementById('lengthInput');
        input.value = editor.currentElement.length || 0;
        document.getElementById('currentLength').textContent = editor.currentElement.length || 0;
        input.focus();
        input.select();
    } else if (modalId === 'angleModal' && editor && editor.currentElement) {
        const input = document.getElementById('angleInput');
        input.value = editor.currentElement.angle || 0;
        document.getElementById('currentAngle').textContent = editor.currentElement.angle || 0;
        input.focus();
        input.select();
    }
}

function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}

function confirmLength() {
    const length = parseInt(document.getElementById('lengthInput').value);
    if (length >= 1 && length <= 1000) {
        if (editor && editor.currentElement && editor.currentElement.type === 'line') {
            editor.updateLineFromLength(length);
            editor.render();
        }
    }
    closeModal('lengthModal');
}

function confirmAngle() {
    const angle = parseInt(document.getElementById('angleInput').value);
    if (angle >= -180 && angle <= 180 && angle !== 0) {
        if (editor && editor.currentElement && editor.currentElement.type === 'curve') {
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
    
    if (editor) {
        // Canvas als PNG exportieren
        const link = document.createElement('a');
        link.download = `kantteil_${partName || 'skizze'}_${new Date().toISOString().split('T')[0]}.png`;
        link.href = editor.canvas.toDataURL('image/png');
        link.click();
    }
    
    closeModal('exportModal');
}

// Editor-Initialisierung
document.addEventListener('DOMContentLoaded', function() {
    // Editor erstellen
    editor = new KantteileEditor();
    
    // Event Listeners für Modal-Inputs
    const lengthInput = document.getElementById('lengthInput');
    const angleInput = document.getElementById('angleInput');
    
    if (lengthInput) {
        lengthInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') confirmLength();
            if (e.key === 'Escape') closeModal('lengthModal');
        });
    }
    
    if (angleInput) {
        angleInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') confirmAngle();
            if (e.key === 'Escape') closeModal('angleModal');
        });
    }
});
