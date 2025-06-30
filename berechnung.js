// KORREKTUR für berechnung.js - Rhombus-Orientierung fix

// Die Rhombus-Generierung in berechnung.js muss mit der im Editor übereinstimmen
// Ersetze die generateRhombusPoints Funktion in berechnung.js:

function generateRhombusPoints(data) {
    const side = data.side || 5;
    const angle = (data.angle || 60) * Math.PI / 180;
    
    // KORRIGIERT: Verwende die GLEICHE Berechnung wie im Editor
    const halfDiag1 = side * Math.sin(angle / 2);
    const halfDiag2 = side * Math.cos(angle / 2);
    
    // WICHTIG: Gleiche Punkt-Reihenfolge wie im Editor
    const points = [
        { x: 0, y: -halfDiag1 },        // Oben
        { x: halfDiag2, y: 0 },         // Rechts  
        { x: 0, y: halfDiag1 },         // Unten
        { x: -halfDiag2, y: 0 }         // Links
    ];
    
    console.log(`✅ Rhombus generiert: seite=${side}m, winkel=${data.angle}°`);
    console.log('Punkte:', points);
    return points;
}

// ALTERNATIVE LÖSUNG: Wenn das Problem weiterhin besteht, 
// können wir die Punkte horizontal spiegeln:

function generateRhombusPointsFlipped(data) {
    const side = data.side || 5;
    const angle = (data.angle || 60) * Math.PI / 180;
    
    const halfDiag1 = side * Math.sin(angle / 2);
    const halfDiag2 = side * Math.cos(angle / 2);
    
    // Horizontal gespiegelt für konsistente Darstellung
    const points = [
        { x: 0, y: -halfDiag1 },        // Oben
        { x: -halfDiag2, y: 0 },        // Links (war rechts)
        { x: 0, y: halfDiag1 },         // Unten
        { x: halfDiag2, y: 0 }          // Rechts (war links)
    ];
    
    console.log(`✅ Rhombus (gespiegelt) generiert: seite=${side}m, winkel=${data.angle}°`);
    return points;
}

// VOLLSTÄNDIGE LÖSUNG: Universelle Punkt-Generierung für beide Module
// Diese Funktion sollte sowohl im Editor als auch in der Berechnung verwendet werden:

function generateUniversalRhombusPoints(data) {
    const side = data.side || 5;
    const angle = (data.angle || 60) * Math.PI / 180;
    
    // Berechne die Halbdiagonalen
    const halfDiag1 = side * Math.sin(angle / 2);
    const halfDiag2 = side * Math.cos(angle / 2);
    
    // Standardisierte Punkt-Reihenfolge (gegen Uhrzeigersinn, start oben)
    const points = [
        { x: 0, y: -halfDiag1 },        // Oben (12 Uhr)
        { x: halfDiag2, y: 0 },         // Rechts (3 Uhr)
        { x: 0, y: halfDiag1 },         // Unten (6 Uhr)
        { x: -halfDiag2, y: 0 }         // Links (9 Uhr)
    ];
    
    console.log(`🔶 Universeller Rhombus: ${side}m Seite, ${data.angle}° Winkel`);
    console.log(`   Diagonalen: horizontal=${halfDiag2*2:.2f}m, vertikal=${halfDiag1*2:.2f}m`);
    console.log(`   Punkte:`, points.map(p => `(${p.x.toFixed(2)}, ${p.y.toFixed(2)})`).join(', '));
    
    return points;
}

// ZUSÄTZLICH: Debug-Funktion um die Punkt-Übereinstimmung zu prüfen
function debugRhombusConsistency() {
    const testData = { side: 5, angle: 60 };
    
    console.log('=== RHOMBUS KONSISTENZ CHECK ===');
    
    // Editor-Version (aus editor.js)
    const editorPoints = generateRhombusPointsForEditor(testData);
    console.log('Editor Punkte:', editorPoints);
    
    // Berechnung-Version (aus berechnung.js) 
    const calcPoints = generateRhombusPoints(testData);
    console.log('Berechnung Punkte:', calcPoints);
    
    // Vergleiche die Punkte
    let consistent = true;
    if (editorPoints.length === calcPoints.length) {
        for (let i = 0; i < editorPoints.length; i++) {
            const diff = Math.abs(editorPoints[i].x - calcPoints[i].x) + 
                        Math.abs(editorPoints[i].y - calcPoints[i].y);
            if (diff > 0.001) {
                consistent = false;
                console.log(`❌ Punkt ${i} unterschiedlich: Editor(${editorPoints[i].x}, ${editorPoints[i].y}) vs Calc(${calcPoints[i].x}, ${calcPoints[i].y})`);
            }
        }
    } else {
        consistent = false;
        console.log(`❌ Unterschiedliche Anzahl Punkte: Editor=${editorPoints.length}, Calc=${calcPoints.length}`);
    }
    
    if (consistent) {
        console.log('✅ Rhombus-Punkte sind konsistent zwischen Editor und Berechnung');
    } else {
        console.log('❌ Rhombus-Punkte sind NICHT konsistent - muss behoben werden');
    }
    
    return consistent;
}

// INTEGRATION: Diese Funktion in beide Module einbauen
// 1. In editor.js die generateRhombusPointsForEditor ersetzen
// 2. In berechnung.js die generateRhombusPoints ersetzen  
// 3. Beide Module verwenden dann generateUniversalRhombusPoints

console.log('🔶 Rhombus-Konsistenz-Fix geladen');
