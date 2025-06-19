function checkAlignmentAndHighlight() {
    const data = getCurrentFormData();
    const baseCorners = getActualCornerPositions(data, calculateOptimalScale(data));
    
    // KORREKTE Rotation anwenden
    const rotatedCorners = baseCorners.map(corner => {
        if (Math.abs(currentRotation) < 0.1) return corner;
        
        const angle = (currentRotation * Math.PI) / 180;
        const relX = corner.x - CANVAS_CENTER_X;
        const relY = corner.y - CANVAS_CENTER_Y;
        
        return {
            x: CANVAS_CENTER_X + relX * Math.cos(angle) - relY * Math.sin(angle),
            y: CANVAS_CENTER_Y + relX * Math.sin(angle) + relY * Math.cos(angle)
        };
    });
    
    let hasHorizontalLine = false;
    let hasVerticalLine = false;
    let alignedEdges = [];
    
    // KORRIGIERTE Ausrichtungserkennung mit strikteren Toleranzen
    for (let i = 0; i < rotatedCorners.length; i++) {
        const nextIndex = (i + 1) % rotatedCorners.length;
        const p1 = rotatedCorners[i];
        const p2 = rotatedCorners[nextIndex];
        
        const deltaX = Math.abs(p2.x - p1.x);
        const deltaY = Math.abs(p2.y - p1.y);
        const lineLength = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
        
        // Sehr strenge Toleranz: Linie muss mindestens 30px lang sein und fast perfekt ausgerichtet
        const tolerance = 1.5;
        const minLineLength = 30;
        
        if (lineLength > minLineLength) {
            if (deltaY <= tolerance && deltaX > minLineLength) {
                // Horizontale Linie
                hasHorizontalLine = true;
                alignedEdges.push({
                    type: 'horizontal',
                    p1: p1,
                    p2: p2,
                    index: i,
                    deviation: deltaY
                });
            } else if (deltaX <= tolerance && deltaY > minLineLength) {
                // Vertikale Linie
                hasVerticalLine = true;
                alignedEdges.push({
                    type: 'vertical',
                    p1: p1,
                    p2: p2,
                    index: i,
                    deviation: deltaX
                });
            }
        }
    }
    
    // KRITISCH: Nur bei TATSÄCHLICHER Ausrichtung anzeigen
    // Zusätzliche Prüfung: Rotation muss nahe an 0°, 90°, 180°, 270° sein
    const normalizedRotation = ((currentRotation % 360) + 360) % 360;
    const nearestCardinal = Math.round(normalizedRotation / 90) * 90;
    const rotationDeviation = Math.abs(normalizedRotation - nearestCardinal);
    
    if (alignedEdges.length > 0 && rotationDeviation < 3) {
        highlightAlignedEdges(alignedEdges);
        showAlignmentFeedback(hasHorizontalLine, hasVerticalLine);
    } else {
        removeAlignmentHighlights();
    }
}
