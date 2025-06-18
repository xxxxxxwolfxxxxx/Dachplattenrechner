function checkForHorizontalBase(corners) {
    if (corners.length < 3) return false;
    
    // Finde die zwei untersten Punkte
    let bottomPoints = [...corners].sort((a, b) => b.y - a.y).slice(0, 2);
    
    // Prüfe ob diese eine waagerechte Linie bilden (±3 Pixel Toleranz)
    const yDiff = Math.abs(bottomPoints[0].y - bottomPoints[1].y);
    return yDiff <= 3;
}

function getHorizontalSnapAngle() {
    const data = getCurrentFormData();
    const scale = calculateDynamicScale(data);
    const corners = getActualCornerPositions(data, scale);
    
    if (corners.length < 3) return null;
    
    // Finde die zwei untersten Punkte
    let bottomPoints = [...corners].sort((a, b) => b.y - a.y).slice(0, 2);
    bottomPoints.sort((a, b) => a.x - b.x); // Links nach rechts sortieren
    
    if (bottomPoints.length < 2) return null;
    
    // Berechne den aktuellen Winkel der Basis-Linie
    const dx = bottomPoints[1].x - bottomPoints[0].x;
    const dy = bottomPoints[1].y - bottomPoints[0].y;
    const currentAngle = Math.atan2(dy, dx) * 180 / Math.PI;
    
    // Der Snap-Winkel ist die Korrektur, um die Basis horizontal zu machen
    return -currentAngle;
}
