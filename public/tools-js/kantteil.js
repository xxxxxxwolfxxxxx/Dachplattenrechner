// Kantteil-Rechner JS-Logik

window.kantteilSettings = {
    thickness: 0.6,
    firstLineType: 'horizontal',
    frontColor: '#8B4513',
    backColor: '#B8B799',
    selectedColorCode: '8004'
};

function getCookieSetting(key) {
    try {
        let value = localStorage.getItem(key);
        if (value && value !== 'null') {
            return value;
        }

        value = sessionStorage.getItem(key);
        if (value && value !== 'null') {
            return value;
        }

        return null;
    } catch (error) {
        console.error('Error reading cookie setting:', error);
        return null;
    }
}

document.addEventListener('DOMContentLoaded', function() {
    const thicknessEl = document.getElementById('thickness');
    const firstLineTypeEl = document.getElementById('firstLineType');

    if (thicknessEl) {
        thicknessEl.addEventListener('change', function() {
            window.kantteilSettings.thickness = parseFloat(this.value);
        });
    }

    if (firstLineTypeEl) {
        firstLineTypeEl.addEventListener('change', function() {
            window.kantteilSettings.firstLineType = this.value;
        });
    }

    updateColorPreview();
    updateSelectedColorDisplay();
});

function openColorSelection() {
    window.open('/tools/farben', 'colorSelection', 'width=1000,height=700,scrollbars=yes,resizable=yes');
}

window.onColorSelected = function(colorData) {
    window.kantteilSettings.frontColor = colorData.color;
    window.kantteilSettings.selectedColorCode = colorData.code;
    window.kantteilSettings.selectedColorName = colorData.name;
    window.kantteilSettings.selectedColorType = colorData.type;

    updateColorPreview();
    updateSelectedColorDisplay();
};

function updateColorPreview() {
    const colorFront = document.getElementById('colorFront');
    const colorBack = document.getElementById('colorBack');

    if (colorFront) colorFront.style.background = window.kantteilSettings.frontColor;
    if (colorBack) colorBack.style.background = window.kantteilSettings.backColor;
}

function updateSelectedColorDisplay() {
    const display = document.getElementById('selectedColorDisplay');
    if (!display) return;

    const settings = window.kantteilSettings;

    if (settings.selectedColorName) {
        display.textContent = `${settings.selectedColorType.toUpperCase()} ${settings.selectedColorCode} - ${settings.selectedColorName}`;
    } else {
        display.textContent = `RAL ${settings.selectedColorCode} - Kupferbraun`;
    }
}

function startEditor() {
    const editorContainer = document.getElementById('editorContainer');
    const editorFrame = document.getElementById('editorFrame');

    if (!editorContainer || !editorFrame) return;

    const params = new URLSearchParams(window.kantteilSettings);
    editorFrame.src = `/tools/kantteil-editor.html?${params.toString()}`;

    editorContainer.style.display = 'block';
    document.body.style.overflow = 'hidden';
}

window.closeEditor = function() {
    const editorContainer = document.getElementById('editorContainer');
    if (!editorContainer) return;

    editorContainer.style.display = 'none';
    document.body.style.overflow = 'auto';
};

document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        const editorContainer = document.getElementById('editorContainer');
        if (editorContainer && editorContainer.style.display === 'block') {
            window.closeEditor();
        }
    }
});
