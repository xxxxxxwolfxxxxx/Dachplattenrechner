// Korrigierte Trapez-Behandlung in berechnung.js

// KORRIGIERTE analyzeRoofGeometry Funktion für Trapez
function analyzeRoofGeometry(points) {
    const xs = points.map(p => p.x);
    const ys = points.map(p => p.y);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);
    
    const width = maxX - minX;
    const height = maxY - minY;
    const area = calculateRoofArea(points);
    
    // NEUE: Spezielle Trapez-Analyse
    const shapeType = determineShapeType(points);
    
    console.log('analyzeRoofGeometry:', {
        width, height, area, 
        shapeType, 
        pointCount: points.length,
        points: points
    });
    
    return {
        minX, maxX, minY, maxY,
        width, height, area,
        points: points,
        shapeType: shapeType
    };
}

// NEUE Funktion: Shape-Type aus Punkten bestimmen
function determineShapeType(points) {
    if (!points || points.length < 3) return 'rechteck';
    
    if (points.length === 3) return 'dreieck';
    if (points.length === 4) {
        // Prüfe ob es ein Trapez ist (zwei parallele Seiten)
        if (isTrapezoid(points)) return 'trapez';
        return 'rechteck'; // Inkludiert Rechteck, Quadrat, Parallelogramm
    }
    if (points.length > 4) return 'vieleck';
    
    return 'rechteck';
}

// NEUE Funktion: Prüft ob 4 Punkte ein Trapez bilden
function isTrapezoid(points) {
    if (points.length !== 4) return false;
    
    // Prüfe alle Seitenpaare auf Parallelität
    const sides = [];
    for (let i = 0; i < 4; i++) {
        const p1 = points[i];
        const p2 = points[(i + 1) % 4];
        
        // Richtungsvektor der Seite
        const dx = p2.x - p1.x;
        const dy = p2.y - p1.y;
        const length = Math.sqrt(dx * dx + dy * dy);
        
        sides.push({
            dx: dx / length,  // Normalisierter Richtungsvektor
            dy: dy / length,
            length: length
        });
    }
    
    // Prüfe ob gegenüberliegende Seiten parallel sind
    const tolerance = 0.1; // Toleranz für Parallelität
    
    // Seite 0 vs Seite 2 (gegenüber)
    const parallel02 = Math.abs(sides[0].dx - sides[2].dx) < tolerance && 
                       Math.abs(sides[0].dy - sides[2].dy) < tolerance;
    
    // Seite 1 vs Seite 3 (gegenüber) 
    const parallel13 = Math.abs(sides[1].dx - sides[3].dx) < tolerance &&
                       Math.abs(sides[1].dy - sides[3].dy) < tolerance;
    
    console.log('Trapez-Check:', {
        sides: sides,
        parallel02: parallel02,
        parallel13: parallel13
    });
    
    // Ein Trapez hat mindestens ein Paar parallele Seiten
    return parallel02 || parallel13;
}

// KORRIGIERTE calculateForDirection Funktion für Trapez
function calculateForDirection(analysis, richtung, profile) {
    // WICHTIG: Überprüfen ob alle Profil-Daten vorhanden sind
    if (!profile.deckbreite || !profile.seitenueberlappung) {
        throw new Error(`Unvollständige Profil-Daten: deckbreite=${profile.deckbreite}, seitenueberlappung=${profile.seitenueberlappung}`);
    }

    const deckbreite = profile.deckbreite; // Das ist die NUTZBARE Breite!
    const seitenueberlappung = profile.seitenueberlappung; // Seitenüberlappung
    const ueberstand = profile.ueberstand || 50;
    
    console.log('calculateForDirection - Trapez-erweitert:', {
        deckbreite: deckbreite,
        seitenueberlappung: seitenueberlappung,
        ueberstand: ueberstand,
        richtung: richtung,
        shapeType: analysis.shapeType,
        analysis: analysis
    });
    
    let bahnenAnzahl, bahnenLaenge;
    
    // KORRIGIERTE Logik für Trapez
    if (analysis.shapeType === 'trapez') {
        console.log('Spezielle Trapez-Berechnung');
        
        if (richtung === 'laengs') {
            // Bei Trapez: Anzahl Bahnen basierend auf der BREITESTEN Stelle
            const maxBreite = analysis.width; // Breiteste Stelle des Trapezes
            bahnenAnzahl = Math.ceil(maxBreite * 1000 / deckbreite);
            bahnenLaenge = (analysis.height * 1000) + ueberstand;
        } else {
            // Quer: Über die Höhe des Trapezes
            bahnenAnzahl = Math.ceil(analysis.height * 1000 / deckbreite);
            bahnenLaenge = (analysis.width * 1000) + ueberstand;
        }
    } else if (analysis.shapeType === 'dreieck') {
        console.log('Spezielle Dreieck-Berechnung');
        
        if (richtung === 'laengs') {
            bahnenAnzahl = Math.ceil(analysis.width * 1000 / deckbreite);
            bahnenLaenge = (analysis.height * 1000) + ueberstand;
        } else {
            bahnenAnzahl = Math.ceil(analysis.height * 1000 / deckbreite);
            bahnenLaenge = (analysis.width * 1000) + ueberstand;
        }
    } else {
        // Standard Rechteck-Berechnung
        if (richtung === 'laengs') {
            bahnenAnzahl = Math.ceil(analysis.width * 1000 / deckbreite);
            bahnenLaenge = (analysis.height * 1000) + ueberstand;
        } else {
            bahnenAnzahl = Math.ceil(analysis.height * 1000 / deckbreite);
            bahnenLaenge = (analysis.width * 1000) + ueberstand;
        }
    }

    // Verfügbare Längen
