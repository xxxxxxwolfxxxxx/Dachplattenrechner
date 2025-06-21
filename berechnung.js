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
    let verfuegbareLaengen = [];
    if (profile.laengentyp === 'lager') {
        verfuegbareLaengen = [...profile.lagerlaengen];
    } else {
        for (let l = profile.minLaenge; l <= profile.maxLaenge; l += (profile.schnittRaster || 100)) {
            verfuegbareLaengen.push(l);
        }
    }

    // Für Dreiecke und Trapezoide: Variable Plattenlängen berechnen
    let variableLengths = [];
    const isTriangle = analysis.shapeType === 'dreieck';
    const isTrapez = analysis.shapeType === 'trapez';
    
    if ((isTriangle || isTrapez) && richtung === 'laengs') {
        if (isTriangle) {
            variableLengths = calculateTrianglePlateLengths(analysis, bahnenAnzahl, deckbreite, ueberstand);
        } else if (isTrapez) {
            variableLengths = calculateTrapezPlateLengths(analysis, bahnenAnzahl, deckbreite, ueberstand);
        }
    }

    // Optimale Länge finden
    const optimization = variableLengths.length > 0 ? 
        optimizeVariableLengths(variableLengths, verfuegbareLaengen) :
        optimizeLengths(bahnenLaenge, verfuegbareLaengen, bahnenAnzahl);
    
    const totalLength = optimization.totalLength;
    const totalWaste = optimization.totalWaste;
    const verschnittProzent = totalLength > 0 ? (totalWaste / totalLength) * 100 : 0;
    
    console.log('Berechnung abgeschlossen:', {
        shapeType: analysis.shapeType,
        bahnenAnzahl: bahnenAnzahl,
        bahnenLaenge: bahnenLaenge,
        totalLength: totalLength,
        verschnittProzent: verschnittProzent
    });
    
    return {
        richtung: richtung,
        bahnenAnzahl: bahnenAnzahl,
        bahnenLaenge: bahnenLaenge,
        variableLengths: variableLengths,
        bestellliste: optimization.orderList,
        schnittplan: optimization.cuttingPlan,
        totalLength: totalLength / 1000,
        totalWaste: totalWaste / 1000,
        verschnitt: verschnittProzent,
        dachflaeche: analysis.area,
        // Zusätzliche Infos für Erläuterung
        dachbreite: analysis.width,
        dachhoehe: analysis.height,
        deckbreite: profile.deckbreite,
        lieferbreite: profile.lieferbreite,
        seitenueberlappung: profile.seitenueberlappung,
        isTriangle: isTriangle,
        isTrapez: isTrapez,
        shapeType: analysis.shapeType
    };
}

// NEUE Funktion: Berechnung der Plattenlängen für Trapez
function calculateTrapezPlateLengths(analysis, bahnenAnzahl, deckbreite, ueberstand) {
    const points = analysis.points;
    if (points.length !== 4) return [];

    const profile = projectData.profile;
    const lieferbreite = profile.lieferbreite;

    // Trapez-Geometrie analysieren
    const xs = points.map(p => p.x);
    const ys = points.map(p => p.y);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);
    
    const basisBreite = maxX - minX;
    const trapezHoehe = maxY - minY;

    console.log('Trapez-Plattenberechnung:', {
        basisBreite: basisBreite,
        trapezHoehe: trapezHoehe,
        bahnenAnzahl: bahnenAnzahl,
        deckbreite: deckbreite,
        lieferbreite: lieferbreite
    });

    // Funktion um Trapez-Höhe an beliebiger Position zu berechnen
    function getTrapezHeightAtPosition(relativePosition) {
        relativePosition = Math.max(0, Math.min(1, relativePosition));
        
        // Bestimme obere und untere Breite des Trapezes
        // Sortiere Y-Koordinaten um oben/unten zu identifizieren
        const topPoints = points.filter(p => Math.abs(p.y - maxY) < 0.1);
        const bottomPoints = points.filter(p => Math.abs(p.y - minY) < 0.1);
        
        const topWidth = topPoints.length >= 2 ? 
            Math.abs(topPoints[1].x - topPoints[0].x) : basisBreite;
        const bottomWidth = bottomPoints.length >= 2 ? 
            Math.abs(bottomPoints[1].x - bottomPoints[0].x) : basisBreite;
        
        console.log('Trapez-Breiten:', { topWidth, bottomWidth });
        
        // Lineare Interpolation der Höhe basierend auf Position
        // An Position 0: bottomWidth, an Position 1: topWidth
        const currentWidth = bottomWidth + (topWidth - bottomWidth) * relativePosition;
        
        // Die "Höhe" an dieser Position ist die Trapez-Höhe (konstant für Trapez)
        return trapezHoehe;
    }

    const plateLengths = [];
    
    for (let i = 0; i < bahnenAnzahl; i++) {
        // Physische Platte bestimmt die Abdeckung
        const platteStart = i * (deckbreite / 1000);
        const platteEnd = platteStart + (lieferbreite / 1000);
        
        // Sicherstellen, dass Platte nicht über Trapez hinausgeht
        const platteStartKorrigiert = Math.max(0, platteStart);
        const platteEndKorrigiert = Math.min(basisBreite, platteEnd);
        
        // Relative Positionen für Höhenberechnung
        const relativeStart = platteStartKorrigiert / basisBreite;
        const relativeEnd = platteEndKorrigiert / basisBreite;
        
        // Bei einem Trapez ist die Höhe konstant über die gesamte Breite
        const trapezHeight = getTrapezHeightAtPosition((relativeStart + relativeEnd) / 2);
        
        // Plattenlänge = Trapez-Höhe + Überstand
        const plattenLaenge = Math.max(ueberstand, (trapezHeight * 1000) + ueberstand);
        
        console.log(`Trapez-Bahn ${i + 1}: Platte ${platteStartKorrigiert.toFixed(2)}m-${platteEndKorrigiert.toFixed(2)}m`);
        console.log(`  → Trapez-Höhe: ${trapezHeight.toFixed(2)}m, Plattenlänge: ${plattenLaenge.toFixed(0)}mm`);
        
        plateLengths.push({
            bahnNummer: i + 1,
            laenge: Math.round(plattenLaenge),
            trapezHoehe: trapezHeight,
            position: platteStartKorrigiert,
            platteStart: platteStartKorrigiert,
            platteEnd: platteEndKorrigiert
        });
    }
    
    return plateLengths;
}

// Erweiterte displayCalculationExplanation für Trapez
function displayCalculationExplanation(results) {
    const container = document.getElementById('calculation-explanation');
    if (!container) return;

    const verlegerichtungText = results.richtung === 'laengs' ? 'längs (parallel zur Wasserlaufrichtung)' : 'quer (senkrecht zur Wasserlaufrichtung)';
    const ueberstendWert = ((results.bahnenLaenge - (results.richtung === 'laengs' ? results.dachhoehe * 1000 : results.dachbreite * 1000))).toFixed(0);
    
    let plattenLaengenText = '';
    let shapeSpecificText = '';
    
    // Shape-spezifische Erklärungen
    if (results.shapeType === 'trapez') {
        shapeSpecificText = `
            <p><strong>Trapez-Besonderheit:</strong> Bei trapezförmigen Dächern ist die Plattenlänge über die gesamte Breite konstant, 
            da die Höhe des Trapezes gleichmäßig ist. Alle Bahnen haben daher die gleiche Länge.</p>
        `;
        
        if (results.variableLengths && results.variableLengths.length > 0) {
            plattenLaengenText = `
                <p><strong>Konstante Plattenlänge für Trapez:</strong> ${(results.variableLengths[0].laenge / 1000).toFixed(2)}m 
                (Trapez-Höhe: ${results.dachhoehe.toFixed(1)}m + ${ueberstendWert}mm Überstand)</p>
            `;
        } else {
            plattenLaengenText = `
                <p><strong>Konstante Plattenlänge:</strong> ${(results.bahnenLaenge / 1000).toFixed(2)} m</p>
            `;
        }
    } else if (results.isTriangle && results.variableLengths && results.variableLengths.length > 0) {
        shapeSpecificText = `
            <p><strong>Dreieck-Besonderheit:</strong> Bei dreieckigen Dächern werden die Platten zur Spitze hin kürzer, um Material zu sparen.</p>
        `;
        
        plattenLaengenText = `
            <p><strong>Variable Plattenlängen (bei Dreiecken):</strong></p>
            <ul style="margin-left: 20px;">
                ${results.variableLengths.slice(0, 3).map(plate => 
                    `<li>Bahn ${plate.bahnNummer}: ${(plate.laenge / 1000).toFixed(2)}m (Dreieckshöhe: ${plate.dreieckHoehe.toFixed(1)}m + ${ueberstendWert}mm Überstand)</li>`
                ).join('')}
                ${results.variableLengths.length > 3 ? '<li>... weitere Bahnen werden kürzer</li>' : ''}
            </ul>
        `;
    } else {
        plattenLaengenText = `
            <p><strong>Konstante Plattenlänge:</strong> ${(results.bahnenLaenge / 1000).toFixed(2)} m</p>
        `;
    }
    
    container.innerHTML = `
        <h5>Berechnungsschritte:</h5>
        <div style="margin: 10px 0;">
            <p><strong>1. Dachform:</strong> ${results.shapeType === 'trapez' ? 'Trapez' : results.shapeType === 'dreieck' ? 'Dreieck' : 'Rechteck'}</p>
            <p><strong>2. Verlegerichtung:</strong> ${verlegerichtungText}</p>
            <p><strong>3. Bahnenanzahl berechnen:</strong></p>
            <ul style="margin-left: 20px;">
                <li>Dachbreite ${results.richtung === 'laengs' ? 'quer' : 'längs'} zur Verlegung: ${results.richtung === 'laengs' ? results.dachbreite.toFixed(1) : results.dachhoehe.toFixed(1)} m</li>
                <li>Deckbreite (nutzbar): ${results.deckbreite} mm</li>
                <li>Benötigte Bahnen: ${(results.richtung === 'laengs' ? results.dachbreite * 1000 : results.dachhoehe * 1000).toFixed(0)}mm ÷ ${results.deckbreite}mm = ${results.bahnenAnzahl} Bahnen</li>
            </ul>
            <p><strong>4. Plattenlänge berechnen:</strong></p>
            <ul style="margin-left: 20px;">
                <li>Dachlänge ${results.richtung === 'laengs' ? 'längs' : 'quer'}: ${results.richtung === 'laengs' ? results.dachhoehe.toFixed(1) : results.dachbreite.toFixed(1)} m</li>
                <li>Überstand nur an der Traufe: ${ueberstendWert}mm</li>
                ${plattenLaengenText}
            </ul>
            <p><strong>Wichtig:</strong> Die Deckbreite (${results.deckbreite}mm) ist die bereits nutzbare Breite pro Platte. Die Seitenüberlappung (${results.seitenueberlappung}mm) ist in der Lieferbreite bereits berücksichtigt.</p>
            ${shapeSpecificText}
        </div>
    `;
}

console.log('Trapez-korrigierte berechnung.js Funktionen geladen');
