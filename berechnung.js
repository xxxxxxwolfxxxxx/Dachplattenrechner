// Globale Variablen
let projectData = {};
let calculationResults = null;
let canvas = null;
let ctx = null;

// Storage-Funktionen
function saveData() {
    try {
        localStorage.setItem('dachplattenrechner_data', JSON.stringify(projectData));
        return true;
    } catch (e) {
        try {
            sessionStorage.setItem('dachplattenrechner_data', JSON.stringify(projectData));
            return true;
        } catch (e2) {
            console.log('Speichern nicht möglich');
            return false;
        }
    }
}

function loadData() {
    try {
        let saved = localStorage.getItem('dachplattenrechner_data');
        if (!saved) {
            saved = sessionStorage.getItem('dachplattenrechner_data');
        }
        return saved ? JSON.parse(saved) : {};
    } catch (e) {
        console.log('Laden nicht möglich');
        return {};
    }
}

// Debug-Informationen anzeigen
function showDebugInfo(info) {
    const debugElement = document.getElementById('debug-info');
    const debugContent = document.getElementById('debug-content');
    
    if (debugElement && debugContent) {
        debugContent.innerHTML = `
            <pre>${JSON.stringify(info, null, 2)}</pre>
        `;
        debugElement.style.display = 'block';
    }
}

// Canvas initialisieren
function initCanvas() {
    canvas = document.getElementById('roof-canvas');
    if (canvas) {
        ctx = canvas.getContext('2d');
        canvas.width = 600;
        canvas.height = 400;
    }
}

// Dachfläche berechnen
function calculateRoofArea(points) {
    if (!points || points.length < 3) return 0;
    
    let area = 0;
    for (let i = 0; i < points.length; i++) {
        const j = (i + 1) % points.length;
        area += points[i].x * points[j].y;
        area -= points[j].x * points[i].y;
    }
    return Math.abs(area) / 2;
}

// Projekt-Info laden
function loadProjectInfo() {
    const profile = projectData.profile;
    const roof = projectData.roofShape;
    const geometry = projectData.geometry;

    console.log('Lade Projekt-Info:', { 
        hasProfile: !!profile, 
        hasRoof: !!roof, 
        hasGeometry: !!geometry,
        profileData: profile 
    });

    if (!profile) {
        showDebugInfo({
            error: 'Profil-Daten fehlen!',
            projectData: projectData
        });
        alert('Profil-Daten fehlen! Bitte kehren Sie zu Schritt 1 zurück.');
        return false;
    }

    // Punkte ermitteln
    let roofPoints = null;
    if (roof && roof.points) {
        roofPoints = roof.points;
    } else if (geometry && geometry.points) {
        roofPoints = geometry.points;
    }

    if (!roofPoints || roofPoints.length < 3) {
        showDebugInfo({
            error: 'Dachform-Daten fehlen!',
            roof: roof,
            geometry: geometry
        });
        alert('Dachform-Daten fehlen! Bitte kehren Sie zu Schritt 2 zurück.');
        return false;
    }

    // Info-Felder füllen
    document.getElementById('info-profile-name').textContent = profile.profilname || 'Standard';
    document.getElementById('info-deckbreite').textContent = profile.deckbreite + ' mm (nutzbar)';
    document.getElementById('info-lieferbreite').textContent = profile.lieferbreite + ' mm (inkl. Überlappung)';
    document.getElementById('info-seitenueberlappung').textContent = (profile.seitenueberlappung || 50) + ' mm';
    document.getElementById('info-ueberstand').textContent = (profile.ueberstand || 50) + ' mm';
    
    const dachTyp = (roof && roof.dachTyp) || (roof && roof.variant) || (geometry && geometry.shapeType) || 'Rechteck';
    document.getElementById('info-roof-type').textContent = dachTyp;
    
    // Abmessungen berechnen
    const xs = roofPoints.map(p => p.x);
    const ys = roofPoints.map(p => p.y);
    const width = Math.max(...xs) - Math.min(...xs);
    const height = Math.max(...ys) - Math.min(...ys);
    document.getElementById('info-dimensions').textContent = `${width.toFixed(1)} × ${height.toFixed(1)} m`;
    
    const area = calculateRoofArea(roofPoints);
    document.getElementById('info-area').textContent = area.toFixed(2) + ' m²';

    // Dachneigung
    const dachNeigung = (roof && roof.dachNeigung) || 15;
    document.getElementById('info-neigung').textContent = dachNeigung + '°';

    // Verlegerichtung bestimmen
    let verlegerichtung = 'Längs (parallel zur Wasserlaufrichtung)';
    if (geometry && geometry.preferredDirection === 'quer') {
        verlegerichtung = 'Quer (senkrecht zur Wasserlaufrichtung)';
    }
    document.getElementById('direction-text').textContent = verlegerichtung;

    console.log('Projekt-Info erfolgreich geladen:', {
        profilname: profile.profilname,
        deckbreite: profile.deckbreite,
        seitenueberlappung: profile.seitenueberlappung,
        verlegerichtung: verlegerichtung
    });

    return true;
}

function calculateLengths() {
    try {
        const profile = projectData.profile;
        const roof = projectData.roofShape;
        const geometry = projectData.geometry;
        
        console.log('Starte Berechnung mit Daten:', {
            hasProfile: !!profile,
            hasRoof: !!roof, 
            hasGeometry: !!geometry,
            profileDetails: profile
        });

        if (!profile) {
            showDebugInfo({
                error: 'Profil-Daten unvollständig!',
                projectData: projectData
            });
            alert('Profil-Daten unvollständig!');
            return;
        }

        // WICHTIGE Validierung der Profil-Daten
        if (!profile.deckbreite || !profile.seitenueberlappung) {
            showDebugInfo({
                error: 'Kritische Profil-Daten fehlen!',
                deckbreite: profile.deckbreite,
                seitenueberlappung: profile.seitenueberlappung,
                profile: profile
            });
            alert(`Kritische Profil-Daten fehlen!\nDeckbreite: ${profile.deckbreite}\nSeitenüberlappung: ${profile.seitenueberlappung}`);
            return;
        }

        // Punkte laden
        let roofPoints = null;
        if (roof && roof.points) {
            roofPoints = roof.points;
        } else if (geometry && geometry.points) {
            roofPoints = geometry.points;
        }

        if (!roofPoints || roofPoints.length < 3) {
            showDebugInfo({
                error: 'Dachform-Daten unvollständig!',
                roof: roof,
                geometry: geometry
            });
            alert('Dachform-Daten unvollständig!');
            return;
        }

        // Geometrie analysieren
        const analysis = analyzeRoofGeometry(roofPoints);
        
        // Verlegerichtung bestimmen
        let verlegerichtung = 'laengs'; // Standard: parallel zur Wasserlaufrichtung
        if (geometry && geometry.preferredDirection) {
            verlegerichtung = geometry.preferredDirection;
        } else if (roof && roof.preferredDirection) {
            verlegerichtung = roof.preferredDirection;
        }

        console.log('Verwende Verlegerichtung:', verlegerichtung);

        // Berechnung
        calculationResults = calculateForDirection(analysis, verlegerichtung, profile);

        // Ergebnisse anzeigen
        displayResults(calculationResults);
        
        // Visualisierung aktualisieren
        drawRoofVisualization(roofPoints, calculationResults);
        
        document.getElementById('continue-btn').disabled = false;

    } catch (error) {
        console.error('Fehler bei der Berechnung:', error);
        showDebugInfo({
            error: error.message,
            stack: error.stack,
            projectData: projectData
        });
        alert('Fehler bei der Berechnung: ' + error.message);
    }
}

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
    
    return {
        minX, maxX, minY, maxY,
        width, height, area,
        points: points
    };
}

// KORRIGIERTE Berechnungsfunktion
function calculateForDirection(analysis, richtung, profile) {
    // WICHTIG: Überprüfen ob alle Profil-Daten vorhanden sind
    if (!profile.deckbreite || !profile.seitenueberlappung) {
        throw new Error(`Unvollständige Profil-Daten: deckbreite=${profile.deckbreite}, seitenueberlappung=${profile.seitenueberlappung}`);
    }

    const deckbreite = profile.deckbreite; // Das ist die NUTZBARE Breite!
    const seitenueberlappung = profile.seitenueberlappung; // Seitenüberlappung
    const ueberstand = profile.ueberstand || 50;
    
    console.log('Berechne mit Profil-Daten:', {
        deckbreite: deckbreite,
        seitenueberlappung: seitenueberlappung,
        ueberstand: ueberstand,
        richtung: richtung
    });
    
    let bahnenAnzahl, bahnenLaenge;
    
    if (richtung === 'laengs') {
        // KORREKT: Deckbreite ist bereits die nutzbare Breite
        bahnenAnzahl = Math.ceil(analysis.width * 1000 / deckbreite);
        // KORRIGIERT: Nur EIN Überstand (nur an der Traufe, nicht am First)
        bahnenLaenge = (analysis.height * 1000) + ueberstand;
    } else {
        // KORREKT: Deckbreite ist bereits die nutzbare Breite  
        bahnenAnzahl = Math.ceil(analysis.height * 1000 / deckbreite);
        // KORRIGIERT: Nur EIN Überstand (nur an der Traufe, nicht am First)
        bahnenLaenge = (analysis.width * 1000) + ueberstand;
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

    // Für Dreiecke: Variable Plattenlängen berechnen
    let variableLengths = [];
    const isTriangle = analysis.points.length === 3;
    
    if (isTriangle && richtung === 'laengs') {
        // Bei Dreiecken werden die Platten zur Spitze hin kürzer
        variableLengths = calculateTrianglePlateLengths(analysis, bahnenAnzahl, deckbreite, ueberstand);
    }

    // Optimale Länge finden
    const optimization = variableLengths.length > 0 ? 
        optimizeVariableLengths(variableLengths, verfuegbareLaengen) :
        optimizeLengths(bahnenLaenge, verfuegbareLaengen, bahnenAnzahl);
    
    const totalLength = optimization.totalLength;
    const totalWaste = optimization.totalWaste;
    const verschnittProzent = totalLength > 0 ? (totalWaste / totalLength) * 100 : 0;
    
    console.log('Berechnung abgeschlossen:', {
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
        isTriangle: isTriangle
    };
}

// FINALE KORRIGIERTE Funktion für Dreieck-Berechnungen
function calculateTrianglePlateLengths(analysis, bahnenAnzahl, deckbreite, ueberstand) {
    const points = analysis.points;
    if (points.length !== 3) return [];

    const profile = projectData.profile;
    const lieferbreite = profile.lieferbreite;

    // Analysiere die Dreieck-Geometrie
    const xs = points.map(p => p.x);
    const ys = points.map(p => p.y);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);
    
    const basisBreite = maxX - minX;
    const dreieckHoehe = maxY - minY;

    // Bestimme Dreieck-Typ basierend auf roofShape.variant
    const dreieckTyp = projectData.roofShape?.variant || 'rechtwinklig';

    console.log('FINALE Dreieck-Analyse (physische Plattenabdeckung):', {
        basisBreite: basisBreite,
        dreieckHoehe: dreieckHoehe,
        bahnenAnzahl: bahnenAnzahl,
        deckbreite: deckbreite,
        lieferbreite: lieferbreite,
        dreieckTyp: dreieckTyp
    });

    // Funktion um Dreieckshöhe an beliebiger Position zu berechnen
    function getTriangleHeightAtPosition(relativePosition) {
        // Sicherstellen, dass Position im gültigen Bereich ist
        relativePosition = Math.max(0, Math.min(1, relativePosition));
        
        if (dreieckTyp === 'gleichseitig' || dreieckTyp === 'gleichschenklig') {
            // Gleichschenkliges Dreieck: Spitze in der Mitte oben
            if (relativePosition <= 0.5) {
                // Linke Hälfte: Höhe steigt linear von 0 auf dreieckHoehe
                return dreieckHoehe * (relativePosition * 2);
            } else {
                // Rechte Hälfte: Höhe fällt linear von dreieckHoehe auf 0
                return dreieckHoehe * (2 - relativePosition * 2);
            }
        } else if (dreieckTyp === 'rechtwinklig') {
            // Rechtwinkliges Dreieck: Spitze rechts
            return dreieckHoehe * (1 - relativePosition);
        } else {
            // Standard: rechtwinkliges Verhalten
            return dreieckHoehe * (1 - relativePosition);
        }
    }

    const plateLengths = [];
    
    for (let i = 0; i < bahnenAnzahl; i++) {
        // KORREKT: Physische Platte (Lieferbreite) bestimmt die Abdeckung
        // Erste Platte: 0 bis lieferbreite
        // Zweite Platte: deckbreite bis (deckbreite + lieferbreite)
        // usw.
        
        const platteStart = i * (deckbreite / 1000);
        const platteEnd = platteStart + (lieferbreite / 1000);
        
        // Sicherstellen, dass Platte nicht über Dreieck hinausgeht
        const platteStartKorrigiert = Math.max(0, platteStart);
        const platteEndKorrigiert = Math.min(basisBreite, platteEnd);
        
        // Relative Positionen für Höhenberechnung
        const relativeStart = platteStartKorrigiert / basisBreite;
        const relativeEnd = platteEndKorrigiert / basisBreite;
        
        // Höhen an den Rändern der physischen Platte
        const hoeheLinks = getTriangleHeightAtPosition(relativeStart);
        const hoeheRechts = getTriangleHeightAtPosition(relativeEnd);
        
        // Prüfe ob die Spitze des Dreiecks innerhalb der Platte liegt
        let hoeheMitte = 0;
        if (dreieckTyp === 'gleichseitig' || dreieckTyp === 'gleichschenklig') {
            // Spitze bei relativer Position 0.5 (Mitte)
            const spitzePosition = 0.5;
            if (relativeStart <= spitzePosition && spitzePosition <= relativeEnd) {
                // Spitze liegt innerhalb der Platte
                hoeheMitte = getTriangleHeightAtPosition(spitzePosition);
                console.log(`Bahn ${i + 1}: SPITZE liegt in der Platte! Höhe=${hoeheMitte.toFixed(2)}m`);
            }
        }
        
        // Die Plattenlänge ist das MAXIMUM der drei Höhen
        const maxHoehe = Math.max(hoeheLinks, hoeheRechts, hoeheMitte);
        
        // Bestimme welche Seite/Position das Maximum liefert (für Debug)
        let maxPosition = 'links';
        if (maxHoehe === hoeheRechts && hoeheRechts > hoeheLinks && hoeheRechts >= hoeheMitte) {
            maxPosition = 'rechts';
        } else if (maxHoehe === hoeheMitte && hoeheMitte > 0) {
            maxPosition = 'spitze';
        }
        
        // Plattenlänge = maximale Dreieckshöhe + Überstand
        const plattenLaenge = Math.max(ueberstand, (maxHoehe * 1000) + ueberstand);
        
        console.log(`Bahn ${i + 1}: Platte ${platteStartKorrigiert.toFixed(2)}m-${platteEndKorrigiert.toFixed(2)}m`);
        console.log(`  Links: ${hoeheLinks.toFixed(2)}m, Rechts: ${hoeheRechts.toFixed(2)}m, Mitte: ${hoeheMitte.toFixed(2)}m`);
        console.log(`  → MAX: ${maxHoehe.toFixed(2)}m (${maxPosition}), Plattenlänge: ${plattenLaenge.toFixed(0)}mm`);
        
        plateLengths.push({
            bahnNummer: i + 1,
            laenge: Math.round(plattenLaenge),
            dreieckHoehe: maxHoehe,
            position: platteStartKorrigiert,
            platteStart: platteStartKorrigiert,
            platteEnd: platteEndKorrigiert,
            hoeheLinks: hoeheLinks,
            hoeheRechts: hoeheRechts,
            hoeheMitte: hoeheMitte,
            maxPosition: maxPosition
        });
    }
    
    return plateLengths;
}

// Neue Funktion für variable Längen-Optimierung
function optimizeVariableLengths(variableLengths, verfuegbareLaengen) {
    const sortedLengths = verfuegbareLaengen.sort((a, b) => b - a);
    
    let totalLength = 0;
    let totalWaste = 0;
    const orderList = [];
    const cuttingPlan = [];
    
    // Gruppiere ähnliche Längen
    const lengthGroups = {};
    variableLengths.forEach(plate => {
        if (plate.laenge > 0) {
            // Finde beste verfügbare Länge
            const bestLength = sortedLengths.find(length => length >= plate.laenge) || sortedLengths[0];
            
            if (!lengthGroups[bestLength]) {
                lengthGroups[bestLength] = {
                    length: bestLength,
                    quantity: 0,
                    plates: []
                };
            }
            
            lengthGroups[bestLength].quantity++;
            lengthGroups[bestLength].plates.push(plate);
        }
    });
    
    // Erstelle Bestellliste
    Object.values(lengthGroups).forEach(group => {
        const waste = group.plates.reduce((sum, plate) => sum + (group.length - plate.laenge), 0);
        
        orderList.push({
            length: group.length,
            quantity: group.quantity,
            usage: group.quantity === 1 ? 'Einzelplatte' : `${group.quantity} Platten`
        });
        
        cuttingPlan.push({
            sourceLength: group.length,
            cuts: group.plates.map(plate => ({
                length: plate.laenge,
                quantity: 1,
                usage: `Bahn ${plate.bahnNummer}`
            })),
            waste: waste / group.quantity
        });
        
        totalLength += group.length * group.quantity;
        totalWaste += waste;
    });
    
    return {
        orderList: orderList,
        cuttingPlan: cuttingPlan,
        totalLength: totalLength,
        totalWaste: totalWaste
    };
}

function optimizeLengths(benoetigteLaenge, verfuegbareLaengen, anzahlBahnen) {
    const sortedLengths = verfuegbareLaengen.sort((a, b) => b - a);
    
    // Beste passende Länge finden
    let bestLength = sortedLengths.find(length => length >= benoetigteLaenge);
    
    if (!bestLength) {
        // Falls keine passende Länge vorhanden, die größte nehmen
        bestLength = sortedLengths[0] || benoetigteLaenge;
    }

    const waste = Math.max(0, bestLength - benoetigteLaenge);
    
    return {
        orderList: [{ 
            length: bestLength, 
            quantity: anzahlBahnen, 
            usage: waste === 0 ? 'Exakt passend' : 'Standard mit Verschnitt' 
        }],
        cuttingPlan: [{
            sourceLength: bestLength,
            cuts: [{ length: benoetigteLaenge, quantity: anzahlBahnen, usage: 'Nutzlänge' }],
            waste: waste
        }],
        totalLength: bestLength * anzahlBahnen,
        totalWaste: waste * anzahlBahnen
    };
}

// Dach und Platten visualisieren
function drawRoofVisualization(roofPoints, plateLayout) {
    if (!ctx || !roofPoints) return;

    // Canvas leeren
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Hintergrund
    ctx.fillStyle = '#f8f9fa';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    console.log('drawRoofVisualization aufgerufen mit plateLayout:', plateLayout);

    // Bounding Box berechnen
    const xs = roofPoints.map(p => p.x);
    const ys = roofPoints.map(p => p.y);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);
    const roofWidth = maxX - minX;
    const roofHeight = maxY - minY;

    // Skalierung berechnen
    const margin = 40;
    const availableWidth = canvas.width - 2 * margin;
    const availableHeight = canvas.height - 2 * margin;
    const scale = Math.min(availableWidth / roofWidth, availableHeight / roofHeight) * 0.8;
    
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const roofCenterX = (minX + maxX) / 2;
    const roofCenterY = (minY + maxY) / 2;

    // Koordinaten transformieren
    function transformPoint(x, y) {
        return {
            x: centerX + (x - roofCenterX) * scale,
            y: centerY - (y - roofCenterY) * scale
        };
    }

    // Dachfläche zeichnen
    ctx.beginPath();
    roofPoints.forEach((point, index) => {
        const transformed = transformPoint(point.x, point.y);
        if (index === 0) {
            ctx.moveTo(transformed.x, transformed.y);
        } else {
            ctx.lineTo(transformed.x, transformed.y);
        }
    });
    ctx.closePath();
    ctx.fillStyle = 'rgba(0, 123, 255, 0.2)';
    ctx.fill();
    ctx.strokeStyle = '#007bff';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Platten zeichnen (falls Layout vorhanden)
    if (plateLayout) {
        console.log('Zeichne Platten mit Layout:', {
            variableLengths: plateLayout.variableLengths,
            bahnenAnzahl: plateLayout.bahnenAnzahl
        });
        drawPlateLayout(plateLayout, transformPoint, scale);
    } else {
        console.log('Kein plateLayout vorhanden');
    }

    // Bemaßung
    drawDimensions(roofPoints, transformPoint);
}

function drawPlateLayout(layout, transformPoint, scale) {
    const profile = projectData.profile;
    const deckbreite = profile.deckbreite / 1000; // in Meter
    const lieferbreite = profile.lieferbreite / 1000; // in Meter
    const seitenueberlappung = profile.seitenueberlappung / 1000; // in Meter

    // Hilfsfunktion: Prüft ob ein Punkt innerhalb des Dreiecks liegt
    function isPointInTriangle(x, y, roofPoints) {
        // Für Dreiecke: Verwende Barycentric Coordinates oder Ray Casting
        // Vereinfacht: Für unser gleichschenkliges Dreieck
        const xs = roofPoints.map(p => p.x);
        const ys = roofPoints.map(p => p.y);
        const minX = Math.min(...xs);
        const maxX = Math.max(...xs);
        const minY = Math.min(...ys);
        const maxY = Math.max(...ys);
        
        // Erst grobe Prüfung: ist Punkt in Bounding Box?
        if (x < minX || x > maxX || y < minY || y > maxY) {
            return false;
        }
        
        // Für gleichschenkliges Dreieck: detaillierte Prüfung
        const basisBreite = maxX - minX;
        const dreieckHoehe = maxY - minY;
        const relativeX = (x - minX) / basisBreite;
        const relativeY = (y - minY) / dreieckHoehe;
        
        // Höhe des Dreiecks an dieser X-Position
        let maxHoeheAnX;
        if (relativeX <= 0.5) {
            maxHoeheAnX = relativeX * 2; // Anstieg zur Mitte
        } else {
            maxHoeheAnX = 2 - relativeX * 2; // Abstieg von der Mitte
        }
        
        return relativeY <= maxHoeheAnX;
    }

    // Hole die Dach-Punkte für die Verschnitt-Berechnung
    const roofPoints = projectData.roofShape?.points || projectData.geometry?.points || [];

    for (let i = 0; i < layout.bahnenAnzahl; i++) {
        let currentPlateLength = layout.bahnenLaenge / 1000; // Standardlänge in Meter

        if (layout.variableLengths && layout.variableLengths.length > i) {
            currentPlateLength = layout.variableLengths[i].laenge / 1000;
        }

        // Position der kompletten physischen Platte
        let plateX, plateY, plateWidth, plateHeight;

        if (layout.richtung === 'laengs') {
            plateX = i * deckbreite;
            plateY = 0;
            plateWidth = lieferbreite; // Komplette Lieferbreite
            plateHeight = currentPlateLength;
        } else {
            plateX = 0;
            plateY = i * deckbreite;
            plateWidth = currentPlateLength;
            plateHeight = lieferbreite;
        }

        // Teile die Platte in kleine Bereiche und prüfe jeden separat
        const steps = 20; // Auflösung für die Verschnitt-Erkennung
        
        for (let sx = 0; sx < steps; sx++) {
            for (let sy = 0; sy < steps; sy++) {
                const subX = plateX + (plateWidth * sx / steps);
                const subY = plateY + (plateHeight * sy / steps);
                const subWidth = plateWidth / steps;
                const subHeight = plateHeight / steps;
                
                // Prüfe Mittelpunkt des Sub-Bereichs
                const centerX = subX + subWidth / 2;
                const centerY = subY + subHeight / 2;
                
                const isInRoof = isPointInTriangle(centerX, centerY, roofPoints);
                
                // Canvas-Koordinaten für diesen Sub-Bereich
                const topLeft = transformPoint(subX, subY);
                const bottomRight = transformPoint(subX + subWidth, subY + subHeight);
                const rectWidth = bottomRight.x - topLeft.x;
                const rectHeight = bottomRight.y - topLeft.y;
                
                if (isInRoof) {
                    // Innerhalb der Dachfläche: bestimme Typ
                    const deckbereichStart = i * deckbreite;
                    const deckbereichEnd = deckbereichStart + deckbreite;
                    
                    if (layout.richtung === 'laengs') {
                        if (subX >= deckbereichStart && subX < deckbereichEnd) {
                            // Hauptbereich (Deckbreite)
                            ctx.fillStyle = 'rgba(40, 167, 69, 0.4)'; // Hellgrün
                        } else {
                            // Seitenüberlappung
                            ctx.fillStyle = 'rgba(40, 167, 69, 0.8)'; // Dunkelgrün
                        }
                    } else {
                        // Ähnliche Logik für quer
                        ctx.fillStyle = 'rgba(40, 167, 69, 0.4)'; // Vereinfacht
                    }
                } else {
                    // Außerhalb der Dachfläche: Verschnitt
                    ctx.fillStyle = 'rgba(220, 53, 69, 0.6)'; // Rot
                }
                
                ctx.fillRect(topLeft.x, topLeft.y, rectWidth, rectHeight);
            }
        }

        // Bahnnummer nur im Hauptbereich
        if (layout.richtung === 'laengs') {
            const deckX = i * deckbreite;
            const deckY = 0;
            const deckW = deckbreite;
            const deckH = currentPlateLength;
            
            const topLeft = transformPoint(deckX, deckY);
            const bottomRight = transformPoint(deckX + deckW, deckY + deckH);
            const rectWidth = bottomRight.x - topLeft.x;
            const rectHeight = bottomRight.y - topLeft.y;

            // Rahmen um Hauptbereich
            ctx.strokeStyle = '#28a745';
            ctx.lineWidth = 2;
            ctx.strokeRect(topLeft.x, topLeft.y, rectWidth, rectHeight);

            // Bahnnummer
            ctx.fillStyle = '#000';
            ctx.font = '12px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(
                (i + 1).toString(),
                topLeft.x + rectWidth / 2,
                topLeft.y + rectHeight / 2
            );
        }
    }
}

function drawDimensions(roofPoints, transformPoint) {
    ctx.strokeStyle = '#666';
    ctx.fillStyle = '#000';
    ctx.lineWidth = 1;
    ctx.font = '10px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';

    // Außenmaße der ersten beiden Seiten
    for (let i = 0; i < Math.min(2, roofPoints.length); i++) {
        const p1 = roofPoints[i];
        const p2 = roofPoints[(i + 1) % roofPoints.length];
        
        const start = transformPoint(p1.x, p1.y);
        const end = transformPoint(p2.x, p2.y);
        
        const midX = (start.x + end.x) / 2;
        const midY = (start.y + end.y) / 2;
        
        // Länge berechnen
        const length = Math.sqrt((p2.x - p1.x) ** 2 + (p2.y - p1.y) ** 2);
        
        // Maßtext
        ctx.fillText(length.toFixed(1) + 'm', midX, midY - 5);
    }
}

function displayResults(results) {
    document.getElementById('total-rows').textContent = results.bahnenAnzahl;
    document.getElementById('plate-length').textContent = (results.bahnenLaenge / 1000).toFixed(1) + ' m';
    document.getElementById('total-length').textContent = results.totalLength.toFixed(1) + ' m';
    document.getElementById('total-waste').textContent = results.verschnitt.toFixed(1) + ' %';

    // Bestelltabelle füllen
    const tbody = document.getElementById('order-tbody');
    if (tbody) {
        tbody.innerHTML = '';
        results.bestellliste.forEach(item => {
            const row = tbody.insertRow();
            row.innerHTML = `
                <td>${item.length}</td>
                <td>${item.quantity}</td>
                <td>${(item.length * item.quantity / 1000).toFixed(1)}</td>
                <td>${item.usage}</td>
            `;
        });
    }

    // Berechnungserklärung anzeigen
    displayCalculationExplanation(results);

    document.getElementById('results-section').style.display = 'block';
}

function displayCalculationExplanation(results) {
    const container = document.getElementById('calculation-explanation');
    if (!container) return;

    const verlegerichtungText = results.richtung === 'laengs' ? 'längs (parallel zur Wasserlaufrichtung)' : 'quer (senkrecht zur Wasserlaufrichtung)';
    const ueberstendWert = ((results.bahnenLaenge - (results.richtung === 'laengs' ? results.dachhoehe * 1000 : results.dachbreite * 1000))).toFixed(0);
    
    let plattenLaengenText = '';
    if (results.variableLengths && results.variableLengths.length > 0) {
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
            <p><strong>1. Verlegerichtung:</strong> ${verlegerichtungText}</p>
            <p><strong>2. Bahnenanzahl berechnen:</strong></p>
            <ul style="margin-left: 20px;">
                <li>Dachbreite ${results.richtung === 'laengs' ? 'quer' : 'längs'} zur Verlegung: ${results.richtung === 'laengs' ? results.dachbreite.toFixed(1) : results.dachhoehe.toFixed(1)} m</li>
                <li>Deckbreite (nutzbar): ${results.deckbreite} mm</li>
                <li>Benötigte Bahnen: ${(results.richtung === 'laengs' ? results.dachbreite * 1000 : results.dachhoehe * 1000).toFixed(0)}mm ÷ ${results.deckbreite}mm = ${results.bahnenAnzahl} Bahnen</li>
            </ul>
            <p><strong>3. Plattenlänge berechnen:</strong></p>
            <ul style="margin-left: 20px;">
                <li>Dachlänge ${results.richtung === 'laengs' ? 'längs' : 'quer'}: ${results.richtung === 'laengs' ? results.dachhoehe.toFixed(1) : results.dachbreite.toFixed(1)} m</li>
                <li>Überstand nur an der Traufe: ${ueberstendWert}mm</li>
                ${plattenLaengenText}
            </ul>
            <p><strong>Wichtig:</strong> Die Deckbreite (${results.deckbreite}mm) ist die bereits nutzbare Breite pro Platte. Die Seitenüberlappung (${results.seitenueberlappung}mm) ist in der Lieferbreite bereits berücksichtigt.</p>
            ${results.isTriangle ? '<p><strong>Dreieck-Besonderheit:</strong> Bei dreieckigen Dächern werden die Platten zur Spitze hin kürzer, um Material zu sparen.</p>' : ''}
        </div>
    `;
}

function saveAndContinue() {
    if (!calculationResults) {
        alert('Bitte führen Sie zuerst eine Berechnung durch!');
        return;
    }

    try {
        projectData.calculations = calculationResults;
        const saved = saveData();
        
        if (saved) {
            window.location.href = 'anrissplan.html';
        } else {
            alert('Speichern fehlgeschlagen, fahre trotzdem fort.');
            window.location.href = 'anrissplan.html';
        }
    } catch (error) {
        console.error('Fehler beim Speichern:', error);
        alert('Fehler beim Speichern: ' + error.message);
    }
}

function goBack() {
    window.location.href = 'Editor.html';
}

// Initialisierung
function init() {
    try {
        console.log('Berechnung wird initialisiert...');
        
        // Projektdaten laden
        projectData = loadData();
        console.log('Geladene Projektdaten:', projectData);
        
        // Canvas initialisieren
        initCanvas();
        
        // Projekt-Info laden
        const infoLoaded = loadProjectInfo();
        
        if (infoLoaded) {
            // Erste Visualisierung (nur Dach, ohne Platten)
            const roof = projectData.roofShape;
            const geometry = projectData.geometry;
            let roofPoints = null;
            if (roof && roof.points) {
                roofPoints = roof.points;
            } else if (geometry && geometry.points) {
                roofPoints = geometry.points;
            }
            
            if (roofPoints) {
                drawRoofVisualization(roofPoints, null);
            }
        }
        
        console.log('Berechnung erfolgreich initialisiert');
        
    } catch (error) {
        console.error('Fehler bei der Initialisierung:', error);
        showDebugInfo({
            error: 'Initialisierungsfehler',
            message: error.message,
            stack: error.stack
        });
        alert('Fehler beim Laden der Berechnung: ' + error.message);
    }
}

// Canvas-Größe bei Fenster-Resize anpassen
window.addEventListener('resize', function() {
    if (canvas) {
        const container = canvas.parentElement;
        const newWidth = Math.min(600, container.clientWidth - 40);
        const newHeight = (newWidth / 600) * 400;
        
        canvas.width = newWidth;
        canvas.height = newHeight;
        canvas.style.width = newWidth + 'px';
        canvas.style.height = newHeight + 'px';
        
        // Neu zeichnen
        if (calculationResults) {
            const roof = projectData.roofShape;
            const geometry = projectData.geometry;
            let roofPoints = null;
            if (roof && roof.points) {
                roofPoints = roof.points;
            } else if (geometry && geometry.points) {
                roofPoints = geometry.points;
            }
            if (roofPoints) {
                drawRoofVisualization(roofPoints, calculationResults);
            }
        }
    }
});

// Event Listeners
document.addEventListener('DOMContentLoaded', function() {
    init();
});

// Überprüfung der Projektdaten nach dem Laden
window.addEventListener('load', function() {
    const profile = projectData.profile;
    const roof = projectData.roofShape;
    const geometry = projectData.geometry;
    
    console.log('Überprüfe Projektdaten beim Laden:', {
        profile: !!profile,
        roof: !!roof,
        geometry: !!geometry,
        roofPoints: (roof && roof.points) || (geometry && geometry.points),
        data: projectData
    });
    
    if (!profile) {
        setTimeout(function() {
            if (confirm('Profil-Daten fehlen. Möchten Sie zu Schritt 1 zurückkehren?')) {
                window.location.href = 'profil.html';
            }
        }, 1000);
    } else if ((!roof && !geometry) || (!profile.deckbreite || !profile.seitenueberlappung)) {
        setTimeout(function() {
            showDebugInfo({
                message: 'Unvollständige Daten erkannt',
                profile: profile,
                roof: roof,
                geometry: geometry
            });
            if (confirm('Unvollständige Daten erkannt. Möchten Sie zum vorherigen Schritt zurückkehren?')) {
                if (!profile.deckbreite || !profile.seitenueberlappung) {
                    window.location.href = 'profil.html';
                } else {
                    window.location.href = 'dachform.html';
                }
            }
        }, 1000);
    } else if ((!roof || !roof.points) && (!geometry || !geometry.points)) {
        setTimeout(function() {
            if (confirm('Geometrie-Daten fehlen. Möchten Sie zum Editor zurückkehren?')) {
                window.location.href = 'Editor.html';
            }
        }, 1000);
    }
});
