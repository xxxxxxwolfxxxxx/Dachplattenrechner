function updateRotation(x, y) {
    if (!isDragging) return;
    
    const currentAngle = Math.atan2(y - rotationCenter.y, x - rotationCenter.x);
    let angleDiff = currentAngle - dragStartAngle;
    
    while (angleDiff > Math.PI) angleDiff -= 2 * Math.PI;
    while (angleDiff < -Math.PI) angleDiff += 2 * Math.PI;
    
    let newRotation = dragStartRotation + (angleDiff * 180 / Math.PI);
    
    // Normalisiere die Rotation
    while (newRotation > 180) newRotation -= 360;
    while (newRotation < -180) newRotation += 360;
    
    // SNAP-LOGIK: Prüfe auf horizontale Basis
    const snapTolerance = 5; // Grad-Toleranz für Einrasten
    let isSnapped = false;
    
    const data = getCurrentFormData();
    const scale = calculateDynamicScale(data);
    
    // Sichere die aktuelle Rotation
    const originalRotation = currentRotation;
    
    // Finde nächstgelegene horizontale Position
    let bestSnapAngle = null;
    let minDistance = snapTolerance + 1;
    
    // Teste Winkel in der Nähe der aktuellen Position
    for (let testAngle = newRotation - snapTolerance; testAngle <= newRotation + snapTolerance; testAngle += 0.5) {
        // Temporär Test-Rotation setzen
        currentRotation = testAngle;
        const testCorners = getActualCornerPositions(data, scale);
        
        if (checkForHorizontalBase(testCorners)) {
            const distance = Math.abs(newRotation - testAngle);
            if (distance < minDistance) {
                minDistance = distance;
                bestSnapAngle = testAngle;
            }
        }
    }
    
    // Stelle die ursprüngliche Rotation wieder her
    currentRotation = originalRotation;
    
    // Entscheide: Einrasten oder normale Rotation
    if (bestSnapAngle !== null && minDistance <= snapTolerance) {
        currentRotation = bestSnapAngle;
        isSnapped = true;
        
        // Feedback anzeigen
        showSnapFeedback();
        const snappedCorners = getActualCornerPositions(data, scale);
        highlightBottomEdge(snappedCorners);
    } else {
        currentRotation = newRotation;
        removeSnapEffects();
    }
    
    // Anzeige aktualisieren
    updateShapeWithScale(scale);
    updateRotationDisplay(isSnapped);
}
