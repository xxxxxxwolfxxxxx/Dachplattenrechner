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
    
    // Test-Rotation für horizontale Basis
    let testRotation = newRotation;
    const data = getCurrentFormData();
    const scale = calculateDynamicScale(data);
    
    // Temporär Test-Rotation setzen für Eckpunkt-Berechnung
    const originalRotation = currentRotation;
    currentRotation = testRotation;
    const corners = getActualCornerPositions(data, scale);
    currentRotation = originalRotation;
    
    const isHorizontal = checkForHorizontalBase(corners);
    
    // Finde nächstgelegene horizontale Position
    let snapAngles = [];
    for (let testAngle = -180; testAngle <= 180; testAngle += 1) {
        currentRotation = testAngle;
        const testCorners = getActualCornerPositions(data, scale);
        if (checkForHorizontalBase(testCorners)) {
            snapAngles.push(testAngle);
        }
    }
    currentRotation = originalRotation;
    
    // Finde nächstgelegenen Snap-Winkel
    if (snapAngles.length > 0) {
        let closestSnapAngle = snapAngles[0];
        let minDistance = Math.abs(newRotation - closestSnapAngle);
        
        snapAngles.forEach(angle => {
            const distance = Math.abs(newRotation - angle);
            if (distance < minDistance) {
                minDistance = distance;
                closestSnapAngle = angle;
            }
        });
        
        // Einrasten wenn nah genug
        if (minDistance <= snapTolerance) {
            currentRotation = closestSnapAngle;
            isSnapped = true;
            
            // Feedback anzeigen
            showSnapFeedback();
            const snappedCorners = getActualCornerPositions(data, scale);
            highlightBottomEdge(snappedCorners);
        } else {
            currentRotation = newRotation;
            removeSnapEffects();
        }
    } else {
        currentRotation = newRotation;
        removeSnapEffects();
    }
    
    // Anzeige aktualisieren
    updateShapeWithScale(scale);
    updateRotationDisplay(isSnapped);
}
