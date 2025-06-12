// editor.js

// Globale Variablen
let selectedGrundForm = null;
let selectedSubForm = null;
let selectedEdge = null;
let currentShape = null;
let currentEdges = [];
let hoveredEdge = null;
let editorCanvas = null;
let editorCtx = null;
let projectData = {};

// Initialisierung nach DOM-Ready
window.addEventListener("DOMContentLoaded", () => {
    editorCanvas = document.getElementById("editor-canvas");
    editorCtx = editorCanvas.getContext("2d");
    document.getElementById("debug-text").textContent = 'JavaScript läuft! Datum: ' + new Date().toLocaleTimeString();
    setupGrundFormListeners();
    drawAllIcons();
});

function setupGrundFormListeners() {
    const tiles = document.querySelectorAll(".shape-tile");
    tiles.forEach(tile => {
        tile.addEventListener("click", (e) => {
            document.querySelectorAll(".shape-tile").forEach(t => t.classList.remove("selected"));
            tile.classList.add("selected");
            selectedGrundForm = tile.dataset.shape;
            selectedSubForm = null;
            selectedEdge = null;
            currentEdges = [];
            loadSubForms();
        });
    });
}

function loadSubForms() {
    const subFormGroup = document.getElementById("sub-form-group");
    const subFormGrid = document.getElementById("sub-form-grid");
    const subFormTitle = document.getElementById("sub-form-title");

    subFormGrid.innerHTML = "";
    subFormTitle.textContent = `Typ wählen:`;

    const dummySubForms = ["standard", "typ2"];
    dummySubForms.forEach(type => {
        const tile = document.createElement("div");
        tile.className = "shape-tile";
        tile.dataset.subform = type;
        tile.innerHTML = `<canvas class="shape-icon" width="80" height="60"></canvas><span>${type}</span>`;
        tile.addEventListener("click", () => {
            document.querySelectorAll("#sub-form-grid .shape-tile").forEach(t => t.classList.remove("selected"));
            tile.classList.add("selected");
            selectedSubForm = type;
            selectedEdge = null;
            currentEdges = [];
            showEditor();
        });
        subFormGrid.appendChild(tile);
    });

    subFormGroup.style.display = "block";
}

function showEditor() {
    document.getElementById("editor-section").style.display = "block";
    // Dummy draw
    editorCtx.fillStyle = "#eee";
    editorCtx.fillRect(10, 10, 200, 100);
}

function goBack() {
    alert("Zurück zum Profil...");
}

function saveAndContinue() {
    alert("Dachform gespeichert! Weiter zur Berechnung...");
}
