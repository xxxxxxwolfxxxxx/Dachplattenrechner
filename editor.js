function checkForHorizontalBase(corners) {
    if (corners.length < 3) return false;
    
    // Finde die zwei untersten Punkte
    let bottomPoints = [...corners].sort((a, b) => b.y - a.y).slice(0, 2);
    
    // Prüfe ob diese eine waagerechte Linie bilden (±3 Pixel Toleranz)
    const yDiff = Math.abs(bottomPoints[0].y - bottomPoints[1].y);
    return yDiff <= 3;
}

function getHorizontalSnapAngle() {
    try {
        const data = getCurrentFormData();
        const scale = calculateDynamicScale(data);
        
        // Erstelle temporäre Ecken ohne Rotation zur Analyse
        const tempRotation = currentRotation;
        currentRotation = 0; // Temporär auf 0 setzen
        const baseCorners = getActualCornerPositions(data, scale);
        currentRotation = tempRotation; // Wiederherstellen
        
        if (baseCorners.length < 3) return null;
        
        // Finde die zwei untersten Punkte in der unrotierten Form
        let bottomPoints = [...baseCorners].sort((a, b) => b.y - a.y).slice(0, 2);
        bottomPoints.sort((a, b) => a.x - b.x); // Links nach rechts sortieren
        
        if (bottomPoints.length < 2) return null;
        
        // Berechne den Winkel, der nötig ist, um diese Linie horizontal zu machen
        const dx = bottomPoints[1].x - bottomPoints[0].x;
        const dy = bottomPoints[1].y - bottomPoints[0].y;
        
        if (Math.abs(dx) < 0.1) return null; // Vermeiden von Division durch fast Null
        
        const baseAngle = Math.atan2(dy, dx) * 180 / Math.PI;
        
        // Der Snap-Winkel ist die Korrektur relativ zur aktuellen Rotation
        return -baseAngle;
        
    } catch (e) {
        console.log('Fehler in getHorizontalSnapAngle:', e);
        return null;
    }
}
