// Verbesserte Seitenbeschriftung - direkt an den Kanten
function drawLabelsAndAnnotations(group, data) {
    const finalShape = determineActualShape();
    const finalVariant = determineActualVariant();
    
    // WICHTIG: Diese Funktion wird NACH der Transformation aufgerufen,
    // daher die realen Canvas-Koordinaten der Ecken verwenden
    const corners = getActualCanvasCorners();
    
    if (finalShape === 'dreieck') {
        drawTriangleLabelsAtEdges(group, data, finalVariant, corners);
    } else if (finalShape === 'rechteck' || finalShape === 'quadrat') {
        drawRectangleLabelsAtEdges(group, data, corners);
    } else if (finalShape === 'trapez') {
        drawTrapezLabelsAtEdges(group, data, corners);
    } else if (finalShape === 'kreis') {
        drawCircleLabelsAtCenter(group, data, finalVariant);
    }
}

// NEUE Funktion: Hole die tatsächlichen Canvas-Koordinaten der Ecken
function getActualCanvasCorners() {
    const currentData = getCurrentFormData();
    const shapePoints = getRawShapePoints(currentData);
    
    if (!shapePoints || shapePoints.length === 0) return [];
    
    // Transformiere die Punkte zu Canvas-Koordinaten (ohne Transformation)
    const canvasCorners = shapePoints.map(point => {
        const canvasX = CANVAS_CENTER_X + point.x * SCALE_FACTOR;
        const canvasY = CANVAS_CENTER_Y - point.y * SCALE_FACTOR;
        return { x: canvasX, y: canvasY };
    });
    
    return canvasCorners;
}
