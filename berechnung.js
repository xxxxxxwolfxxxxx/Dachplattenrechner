// berechnung.js - Updated Navigation
function goBack() {
    window.location.href = 'Editor.html';
}

// Rest des ursprünglichen berechnung.js Codes hier...
// (Der existierende Code bleibt unverändert, nur die goBack() Funktion wird geändert)

// Sichere Storage-Funktionen
function saveData() {
    try {
        localStorage.setItem('dachplattenrechner_data', JSON.stringify(projectData));
        return true;
    } catch (e) {
        console.log('localStorage nicht verfügbar, verwende Session-Speicher');
        sessionStorage.setItem('dachplattenrechner_data', JSON.stringify(projectData));
        return true;
    }
}

function loadData() {
    try {
        let saved = localStorage.getItem('dachplattenrechner_data');
        if (!saved) {
            saved = sessionStorage.getItem('dachplattenrechner_data');
        }
        return saved ? JSON.parse(saved) : {};
    } catch (e) {
        console.log('Fehler beim Laden der Daten');
        return {};
    }
}

// Hinweis: Der Rest des berechnung.js Codes ist bereits korrekt implementiert
console.log('berechnung.js mit korrigierter Navigation geladen');
