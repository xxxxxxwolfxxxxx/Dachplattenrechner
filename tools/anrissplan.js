// anrissplan.js - Alle JavaScript-Funktionen für den Anrissplan

// Globale Variablen
let planData = null;
let planType = null;

// URL Parameter auslesen
function getUrlParams() {
    const urlParams = new URLSearchParams(window.location.search);
    return {
        type: urlParams.get('type'),
        data: urlParams.get('data')
    };
}

// Daten dekodieren
function decodeData(encodedData) {
    try {
        return JSON.parse(decodeURIComponent(encodedData));
    } catch (e) {
        console.error('Fehler beim Dekodieren der Daten:', e);
        return null;
    }
}

// Header aktualisieren
function updateHeader(type, data) {
    const titleElement = document.getElementById('plan-title');
    const infoElement = document.getElementById('plan-info');
    
    let title = '';
    let info = '';
    
    switch(type) {
        case 'gleichschenkliges-dreieck':
            title = 'Anrissplan - Gleichschenkliges Dreieck';
            info = 'Basis: ' + data.basisBreite + 'm | Höhe: ' + data.hoehe + 'm | Spitze mittig | Platten: ' + data.schnittliste.length + ' Stück';
            break;
        case 'ungleichschenkliges-dreieck':
            title = 'Anrissplan - Ungleichschenkliges Dreieck';
            info = 'Basis: ' + data.basisBreite + 'm | Höhe: ' + data.hoehe + 'm | Spitze bei: ' + data.spitzenPosition + 'm | Platten: ' + data.schnittliste.length + ' Stück';
            break;
        case 'trapez':
            title = 'Anrissplan - Trapez';
            info = 'Oben: ' + data.obereBreite + 'm | Unten: ' + data.untereBreite + 'm | Höhe: ' + data.hoehe + 'm | Platten: ' + data.schnittliste.length + ' Stück';
            break;
        case 'trapez-auf-rechteck':
            title = 'Anrissplan - Trapez auf Rechteck';
            info = 'Oben: ' + data.obereBreite + 'm | Unten: ' + data.untereBreite + 'm | Trapez: ' + data.trapezHoehe + 'm | Rechteck: ' + data.rechteckHoehe + 'm | Platten: ' + data.schnittliste.length + ' Stück';
            break;
        default:
            title = 'Anrissplan - Unbekannter Typ';
            info = 'Unbekannte Dachform';
    }
    
    titleElement.textContent = title;
    infoElement.innerHTML = '<strong>' + title + ':</strong> ' + info;
}

// Übersicht generieren
function generateOverview(type, data) {
    const container = document.getElementById('overview-content');
    
    let svg = '';
    
    switch(type) {
        case 'gleichschenkliges-dreieck':
            svg = generateTriangleOverview(data, true);
            break;
        case 'ungleichschenkliges-dreieck':
            svg = generateTriangleOverview(data, false);
            break;
        case 'trapez':
            svg = generateTrapezOverview(data);
            break;
        case 'trapez-auf-rechteck':
            svg = generateTrapezRechteckOverview(data);
            break;
        default:
            svg = '<p>Unbekannte Dachform</p>';
    }
    
    container.innerHTML = '<div style="text-align: center; border: 2px solid #1e3c72; border-radius: 8px; padding: 20px; background: white; display: inline-block;">' + svg + '<div style="margin-top: 15px; font-size: 14px; color: #666;"><strong>Plattenaufteilung für ' + data.schnittliste.length + ' Platten</strong></div></div>';
}

// Dreieck Übersicht
function generateTriangleOverview(data, isGleichschenklig) {
    const width = 800;
    const height = 300;
    const margin = 40;
    const diagramWidth = 460;
    
    const basisBreite = parseFloat(data.basisBreite);
    const hoehe = parseFloat(data.hoehe);
    const spitzenPosition = isGleichschenklig ? basisBreite / 2 : parseFloat(data.spitzenPosition);
    
    const scaleX = (diagramWidth - 2 * margin) / basisBreite;
    const scaleY = (height - 2 * margin - 40) / hoehe;
    
    const spitzeX = margin + spitzenPosition * scaleX;
    const spitzeY = margin;
    const linksX = margin;
    const linksY = margin + hoehe * scaleY;
    const rechtsX = margin + basisBreite * scaleX;
    const rechtsY = margin + hoehe * scaleY;
    
    let svg = '<svg width="' + width + '" height="' + height + '" viewBox="0 0 ' + width + ' ' + height + '">';
    svg += '<rect width="' + width + '" height="' + height + '" fill="#fdfdfd"/>';
    
    // Dreieck gefüllt
    svg += '<polygon points="' + spitzeX + ',' + spitzeY + ' ' + linksX + ',' + linksY + ' ' + rechtsX + ',' + rechtsY + '" fill="#e3f2fd" stroke="#1976d2" stroke-width="2"/>';
    
    // Platten als senkrechte Linien
    for (let i = 0; i < data.schnittliste.length; i++) {
        const platte = data.schnittliste[i];
        const plattenStart = parseFloat(platte.positionVonLinks);
        const plattenBreite = parseFloat(platte.plattenbreite);
        const plattenMitte = plattenStart + (plattenBreite / 2);
        const plattenX = margin + plattenStart * scaleX;
        const plattenMitteX = margin + plattenMitte * scaleX;
        
        let plattenObenY;
        if (plattenStart <= spitzenPosition) {
            const anteilVonLinks = plattenStart / spitzenPosition;
            plattenObenY = linksY - anteilVonLinks * (linksY - spitzeY);
        } else {
            const abstandVonSpitze = plattenStart - spitzenPosition;
            const rechteSeite = basisBreite - spitzenPosition;
            const verhaeltnis = abstandVonSpitze / rechteSeite;
            plattenObenY = spitzeY + verhaeltnis * (rechtsY - spitzeY);
        }
        
        svg += '<line x1="' + plattenX + '" y1="' + linksY + '" x2="' + plattenX + '" y2="' + plattenObenY + '" stroke="#666" stroke-width="1.5" opacity="0.8"/>';
        svg += '<text x="' + plattenMitteX + '" y="' + (linksY + 20) + '" text-anchor="middle" font-size="12" fill="#333" font-weight="bold">' + platte.plattenNr + '</text>';
    }
    
    // Spitze markieren
    svg += '<circle cx="' + spitzeX + '" cy="' + spitzeY + '" r="4" fill="#dc3545"/>';
    svg += '<text x="' + spitzeX + '" y="' + (spitzeY - 10) + '" text-anchor="middle" font-size="12" fill="#dc3545" font-weight="bold">Spitze</text>';
    
    // Basis-Maß
    svg += '<line x1="' + margin + '" y1="' + (linksY + 30) + '" x2="' + rechtsX + '" y2="' + (linksY + 30) + '" stroke="#666" stroke-width="1"/>';
    svg += '<text x="' + (margin + (basisBreite * scaleX)/2) + '" y="' + (linksY + 45) + '" text-anchor="middle" font-size="14" fill="#333" font-weight="bold">Basis: ' + basisBreite + 'm</text>';
    
    // Längenliste rechts
    const listenStart = diagramWidth + 20;
    svg += '<text x="' + listenStart + '" y="25" font-size="14" fill="#333" font-weight="bold">Plattenlängen:</text>';
    
    const spaltenAnzahl = data.schnittliste.length > 12 ? 2 : 1;
    const spaltenBreite = spaltenAnzahl === 2 ? 140 : 280;
    
    for (let i = 0; i < data.schnittliste.length; i++) {
        const platte = data.schnittliste[i];
        const spalte = spaltenAnzahl === 2 ? Math.floor(i / Math.ceil(data.schnittliste.length / 2)) : 0;
        const zeile = spaltenAnzahl === 2 ? i % Math.ceil(data.schnittliste.length / 2) : i;
        
        const x = listenStart + spalte * spaltenBreite;
        const y = 50 + zeile * 18;
        
        svg += '<text x="' + x + '" y="' + y + '" font-size="11" fill="#666">Platte ' + platte.plattenNr + ': ' + platte.benoetigteLaenge + 'm</text>';
    }
    
    svg += '</svg>';
    return svg;
}

// Trapez Übersicht - vollständig implementiert
function generateTrapezOverview(data) {
    const width = 800;
    const height = 300;
    const margin = 40;
    const diagramWidth = 460;
    
    const obereBreite = parseFloat(data.obereBreite);
    const untereBreite = parseFloat(data.untereBreite);
    const hoehe = parseFloat(data.hoehe);
    
    const seitenAbstand = (untereBreite - obereBreite) / 2;
    const scaleX = (diagramWidth - 2 * margin) / untereBreite;
    const scaleY = (height - 2 * margin - 40) / hoehe;
    
    const obenLinksX = margin + seitenAbstand * scaleX;
    const obenRechtsX = margin + (untereBreite - seitenAbstand) * scaleX;
    const obenY = margin;
    const untenLinksX = margin;
    const untenRechtsX = margin + untereBreite * scaleX;
    const untenY = margin + hoehe * scaleY;
    
    let svg = '<svg width="' + width + '" height="' + height + '" viewBox="0 0 ' + width + ' ' + height + '">';
    svg += '<rect width="' + width + '" height="' + height + '" fill="#fdfdfd"/>';
    
    // Trapez gefüllt
    svg += '<polygon points="' + obenLinksX + ',' + obenY + ' ' + obenRechtsX + ',' + obenY + ' ' + untenRechtsX + ',' + untenY + ' ' + untenLinksX + ',' + untenY + '" fill="#e3f2fd" stroke="#1976d2" stroke-width="2"/>';
    
    // Platten als senkrechte Linien
    for (let i = 0; i < data.schnittliste.length; i++) {
        const platte = data.schnittliste[i];
        const plattenStart = parseFloat(platte.positionVonLinks);
        const plattenBreite = parseFloat(platte.plattenbreite);
        const plattenMitte = plattenStart + (plattenBreite / 2);
        const plattenX = margin + plattenStart * scaleX;
        const plattenMitteX = margin + plattenMitte * scaleX;
        
        const hoeheAnPosition = berechneHoeheAnPositionTrapezOverview(plattenStart, seitenAbstand, untereBreite, hoehe);
        const plattenObenY = untenY - (hoeheAnPosition * scaleY);
        
        svg += '<line x1="' + plattenX + '" y1="' + untenY + '" x2="' + plattenX + '" y2="' + plattenObenY + '" stroke="#666" stroke-width="1.5" opacity="0.8"/>';
        svg += '<text x="' + plattenMitteX + '" y="' + (untenY + 20) + '" text-anchor="middle" font-size="12" fill="#333" font-weight="bold">' + platte.plattenNr + '</text>';
    }
    
    // Obere Kante markieren
    svg += '<line x1="' + obenLinksX + '" y1="' + obenY + '" x2="' + obenRechtsX + '" y2="' + obenY + '" stroke="#28a745" stroke-width="3"/>';
    svg += '<text x="' + ((obenLinksX + obenRechtsX)/2) + '" y="' + (obenY - 10) + '" text-anchor="middle" font-size="12" fill="#28a745" font-weight="bold">Oben: ' + obereBreite + 'm</text>';
    
    // Untere Kante
    svg += '<text x="' + (margin + (untereBreite * scaleX)/2) + '" y="' + (height - 10) + '" text-anchor="middle" font-size="12" fill="#333" font-weight="bold">Unten: ' + untereBreite + 'm</text>';
    
    // Längenliste rechts
    const listenStart = diagramWidth + 20;
    svg += '<text x="' + listenStart + '" y="25" font-size="14" fill="#333" font-weight="bold">Plattenlängen:</text>';
    
    const spaltenAnzahl = data.schnittliste.length > 12 ? 2 : 1;
    const spaltenBreite = spaltenAnzahl === 2 ? 140 : 280;
    
    for (let i = 0; i < data.schnittliste.length; i++) {
        const platte = data.schnittliste[i];
        const spalte = spaltenAnzahl === 2 ? Math.floor(i / Math.ceil(data.schnittliste.length / 2)) : 0;
        const zeile = spaltenAnzahl === 2 ? i % Math.ceil(data.schnittliste.length / 2) : i;
        
        const x = listenStart + spalte * spaltenBreite;
        const y = 50 + zeile * 18;
        
        svg += '<text x="' + x + '" y="' + y + '" font-size="11" fill="#666">Platte ' + platte.plattenNr + ': ' + platte.benoetigteLaenge + 'm</text>';
    }
    
    svg += '</svg>';
    return svg;
}

// Trapez auf Rechteck Übersicht - vollständig implementiert
function generateTrapezRechteckOverview(data) {
    const width = 800;
    const height = 350;
    const margin = 40;
    const diagramWidth = 460;
    
    const obereBreite = parseFloat(data.obereBreite);
    const untereBreite = parseFloat(data.untereBreite);
    const trapezHoehe = parseFloat(data.trapezHoehe);
    const rechteckHoehe = parseFloat(data.rechteckHoehe);
    const gesamtHoehe = trapezHoehe + rechteckHoehe;
    
    const seitenAbstand = (untereBreite - obereBreite) / 2;
    const scaleX = (diagramWidth - 2 * margin) / untereBreite;
    const scaleY = (height - 2 * margin - 40) / gesamtHoehe;
    
    const rechteckY = margin + trapezHoehe * scaleY;
    
    let svg = '<svg width="' + width + '" height="' + height + '" viewBox="0 0 ' + width + ' ' + height + '">';
    svg += '<rect width="' + width + '" height="' + height + '" fill="#fdfdfd"/>';
    
    // Rechteck (unten)
    svg += '<rect x="' + margin + '" y="' + rechteckY + '" width="' + (untereBreite * scaleX) + '" height="' + (rechteckHoehe * scaleY) + '" fill="#e8f4fd" stroke="#1976d2" stroke-width="2"/>';
    
    // Trapez (oben)
    const obenLinksX = margin + seitenAbstand * scaleX;
    const obenRechtsX = margin + (untereBreite - seitenAbstand) * scaleX;
    const untenRechtsX = margin + untereBreite * scaleX;
    
    svg += '<polygon points="' + obenLinksX + ',' + margin + ' ' + obenRechtsX + ',' + margin + ' ' + untenRechtsX + ',' + rechteckY + ' ' + margin + ',' + rechteckY + '" fill="#e3f2fd" stroke="#1976d2" stroke-width="2"/>';
    
    // Platten als senkrechte Linien über beide Bereiche - korrigierte Höhe
    for (let i = 0; i < data.schnittliste.length; i++) {
        const platte = data.schnittliste[i];
        const plattenStart = parseFloat(platte.positionVonLinks);
        const plattenBreite = parseFloat(platte.plattenbreite);
        const plattenMitte = plattenStart + (plattenBreite / 2);
        const plattenX = margin + plattenStart * scaleX;
        const plattenMitteX = margin + plattenMitte * scaleX;
        
        // Bestimme korrekte Oberkante basierend auf Position
        let plattenObenY;
        if (plattenStart <= seitenAbstand) {
            // Links: Von Rechteck-Oberkante zur oberen linken Ecke
            const verhaeltnis = plattenStart / seitenAbstand;
            plattenObenY = rechteckY - verhaeltnis * (rechteckY - margin);
        } else if (plattenStart >= (untereBreite - seitenAbstand)) {
            // Rechts: Von Rechteck-Oberkante zur oberen rechten Ecke
            const abstandVonRechts = untereBreite - plattenStart;
            const verhaeltnis = abstandVonRechts / seitenAbstand;
            plattenObenY = rechteckY - verhaeltnis * (rechteckY - margin);
        } else {
            // Mitte: Bis zur Trapez-Oberkante
            plattenObenY = margin;
        }
        
        svg += '<line x1="' + plattenX + '" y1="' + (margin + gesamtHoehe * scaleY) + '" x2="' + plattenX + '" y2="' + plattenObenY + '" stroke="#666" stroke-width="1.5" opacity="0.8"/>';
        svg += '<text x="' + plattenMitteX + '" y="' + (margin + gesamtHoehe * scaleY + 20) + '" text-anchor="middle" font-size="12" fill="#333" font-weight="bold">' + platte.plattenNr + '</text>';
    }
    
    // Obere Ecken markieren
    svg += '<circle cx="' + obenLinksX + '" cy="' + margin + '" r="3" fill="#dc3545"/>';
    svg += '<circle cx="' + obenRechtsX + '" cy="' + margin + '" r="3" fill="#dc3545"/>';
    svg += '<text x="' + obenLinksX + '" y="' + (margin - 10) + '" text-anchor="middle" font-size="10" fill="#dc3545" font-weight="bold">Ecke</text>';
    svg += '<text x="' + obenRechtsX + '" y="' + (margin - 10) + '" text-anchor="middle" font-size="10" fill="#dc3545" font-weight="bold">Ecke</text>';
    
    // Obere Kante markieren
    svg += '<line x1="' + obenLinksX + '" y1="' + margin + '" x2="' + obenRechtsX + '" y2="' + margin + '" stroke="#28a745" stroke-width="3"/>';
    svg += '<text x="' + ((obenLinksX + obenRechtsX)/2) + '" y="' + (margin - 25) + '" text-anchor="middle" font-size="12" fill="#28a745" font-weight="bold">Oben: ' + obereBreite + 'm</text>';
    
    // Übergang markieren
    svg += '<line x1="' + margin + '" y1="' + rechteckY + '" x2="' + untenRechtsX + '" y2="' + rechteckY + '" stroke="#ffc107" stroke-width="2" stroke-dasharray="5,5"/>';
    svg += '<text x="' + (width/2 - 150) + '" y="' + (height - 10) + '" text-anchor="middle" font-size="12" fill="#333" font-weight="bold">Trapez: ' + trapezHoehe + 'm + Rechteck: ' + rechteckHoehe + 'm</text>';
    
    // Längenliste rechts
    const listenStart = diagramWidth + 20;
    svg += '<text x="' + listenStart + '" y="25" font-size="14" fill="#333" font-weight="bold">Plattenlängen:</text>';
    
    const spaltenAnzahl = data.schnittliste.length > 14 ? 2 : 1;
    const spaltenBreite = spaltenAnzahl === 2 ? 140 : 280;
    
    for (let i = 0; i < data.schnittliste.length; i++) {
        const platte = data.schnittliste[i];
        const spalte = spaltenAnzahl === 2 ? Math.floor(i / Math.ceil(data.schnittliste.length / 2)) : 0;
        const zeile = spaltenAnzahl === 2 ? i % Math.ceil(data.schnittliste.length / 2) : i;
        
        const x = listenStart + spalte * spaltenBreite;
        const y = 50 + zeile * 18;
        
        svg += '<text x="' + x + '" y="' + y + '" font-size="11" fill="#666">Platte ' + platte.plattenNr + ': ' + platte.benoetigteLaenge + 'm</text>';
    }
    
    svg += '</svg>';
    return svg;
}

// Hilfsfunktion für Trapez-Höhenberechnung in Übersicht
function berechneHoeheAnPositionTrapezOverview(position, seitenAbstand, untereBreite, hoehe) {
    if (position <= seitenAbstand) {
        return hoehe * (position / seitenAbstand);
    } else if (position >= (untereBreite - seitenAbstand)) {
        const abstandVonRechts = untereBreite - position;
        return hoehe * (abstandVonRechts / seitenAbstand);
    } else {
        return hoehe;
    }
}

// Anrissmaße berechnen - erweitert für alle Dachformen
function calculateAnreissMasse(plattenStart, plattenEnde, type, data) {
    let anreissLinks = 0;
    let anreissRechts = 0;
    
    switch(type) {
        case 'gleichschenkliges-dreieck':
            const basisGleich = parseFloat(data.basisBreite);
            const hoeheGleich = parseFloat(data.hoehe);
            
            const hoeheStartGleich = berechneHoeheAnPositionGleich(plattenStart, basisGleich, hoeheGleich);
            const hoeheEndeGleich = berechneHoeheAnPositionGleich(plattenEnde, basisGleich, hoeheGleich);
            
            anreissLinks = Math.round(hoeheStartGleich * 100);
            anreissRechts = Math.round(hoeheEndeGleich * 100);
            break;
            
        case 'ungleichschenkliges-dreieck':
            const spitzeUngleich = parseFloat(data.spitzenPosition);
            const hoeheUngleich = parseFloat(data.hoehe);
            const basisUngleich = parseFloat(data.basisBreite);
            
            const hoeheStartUngleich = berechneHoeheAnPositionUngleich(plattenStart, basisUngleich, hoeheUngleich, spitzeUngleich);
            const hoeheEndeUngleich = berechneHoeheAnPositionUngleich(plattenEnde, basisUngleich, hoeheUngleich, spitzeUngleich);
            
            anreissLinks = Math.round(hoeheStartUngleich * 100);
            anreissRechts = Math.round(hoeheEndeUngleich * 100);
            break;
            
        case 'trapez':
            const obereBreiteTrapez = parseFloat(data.obereBreite);
            const untereBreiteTrapez = parseFloat(data.untereBreite);
            const hoeheTrapez = parseFloat(data.hoehe);
            const seitenAbstandTrapez = (untereBreiteTrapez - obereBreiteTrapez) / 2;
            
            const hoeheStartTrapez = berechneHoeheAnPositionTrapez(plattenStart, seitenAbstandTrapez, untereBreiteTrapez, hoeheTrapez);
            const hoeheEndeTrapez = berechneHoeheAnPositionTrapez(plattenEnde, seitenAbstandTrapez, untereBreiteTrapez, hoeheTrapez);
            
            anreissLinks = Math.round(hoeheStartTrapez * 100);
            anreissRechts = Math.round(hoeheEndeTrapez * 100);
            break;
            
        case 'trapez-auf-rechteck':
            const obereBreiteCombo = parseFloat(data.obereBreite);
            const untereBreiteCombo = parseFloat(data.untereBreite);
            const trapezHoeheCombo = parseFloat(data.trapezHoehe);
            const rechteckHoeheCombo = parseFloat(data.rechteckHoehe);
            const seitenAbstandCombo = (untereBreiteCombo - obereBreiteCombo) / 2;
            
            const hoeheStartCombo = berechneHoeheAnPositionCombo(plattenStart, seitenAbstandCombo, untereBreiteCombo, trapezHoeheCombo, rechteckHoeheCombo);
            const hoeheEndeCombo = berechneHoeheAnPositionCombo(plattenEnde, seitenAbstandCombo, untereBreiteCombo, trapezHoeheCombo, rechteckHoeheCombo);
            
            anreissLinks = Math.round(hoeheStartCombo * 100);
            anreissRechts = Math.round(hoeheEndeCombo * 100);
            break;
    }
    
    return { links: anreissLinks, rechts: anreissRechts };
}

// Höhenberechnungen für verschiedene Formen - erweitert
function berechneHoeheAnPositionGleich(position, basisBreite, maxHoehe) {
    const spitzenPosition = basisBreite / 2;
    const abstand = Math.abs(position - spitzenPosition);
    const maxAbstand = basisBreite / 2;
    
    if (abstand >= maxAbstand) return 0;
    return maxHoehe * (1 - abstand / maxAbstand);
}

function berechneHoeheAnPositionUngleich(position, basisBreite, hoehe, spitzenPosition) {
    if (position <= 0) return 0;
    if (position >= basisBreite) return 0;
    
    if (position <= spitzenPosition) {
        const abstand = spitzenPosition - position;
        const linkeSeite = spitzenPosition;
        if (linkeSeite === 0) return hoehe;
        return hoehe * (1 - abstand / linkeSeite);
    } else {
        const abstand = position - spitzenPosition;
        const rechteSeite = basisBreite - spitzenPosition;
        if (rechteSeite === 0) return hoehe;
        return hoehe * (1 - abstand / rechteSeite);
    }
}

function berechneHoeheAnPositionTrapez(position, seitenAbstand, untereBreite, hoehe) {
    if (position <= seitenAbstand) {
        return hoehe * (position / seitenAbstand);
    } else if (position >= (untereBreite - seitenAbstand)) {
        const abstandVonRechts = untereBreite - position;
        return hoehe * (abstandVonRechts / seitenAbstand);
    } else {
        return hoehe;
    }
}

function berechneHoeheAnPositionCombo(position, seitenAbstand, untereBreite, trapezHoehe, rechteckHoehe) {
    if (position <= seitenAbstand) {
        const prozent = position / seitenAbstand;
        return rechteckHoehe + (trapezHoehe * prozent);
    } else if (position >= (untereBreite - seitenAbstand)) {
        const abstandVonRechts = untereBreite - position;
        const prozent = abstandVonRechts / seitenAbstand;
        return rechteckHoehe + (trapezHoehe * prozent);
    } else {
        return trapezHoehe + rechteckHoehe;
    }
}

// Plattendiagramm generieren
function generatePlateDiagram(item, anreissMasse, type, data) {
    const plattenStart = parseFloat(item.positionVonLinks);
    const plattenBreite = parseFloat(item.plattenbreite);
    const benoetigteLaengeM = parseFloat(item.benoetigteLaenge);
    
    // Bestimme ob Spitzenplatte und letzte Platte
    let basisBreite = 0;
    let spitzenPosition = 0;
    let istSpitzenPlatte = false;
    let istTrapezEckenPlatte = false;
    let linkeEcke = 0;
    let rechteEcke = 0;
    
    switch(type) {
        case 'gleichschenkliges-dreieck':
        case 'ungleichschenkliges-dreieck':
            basisBreite = parseFloat(data.basisBreite);
            spitzenPosition = type === 'gleichschenkliges-dreieck' ? basisBreite / 2 : parseFloat(data.spitzenPosition);
            // Korrigierte Spitzenerkennung: Prüfe ob Spitze innerhalb der Platte liegt
            istSpitzenPlatte = plattenStart < spitzenPosition && (plattenStart + plattenBreite) > spitzenPosition;
            break;
        case 'trapez':
            basisBreite = parseFloat(data.untereBreite);
            const obereBreiteTrapez = parseFloat(data.obereBreite);
            const seitenAbstandTrapez = (basisBreite - obereBreiteTrapez) / 2;
            linkeEcke = seitenAbstandTrapez;
            rechteEcke = basisBreite - seitenAbstandTrapez;
            
            // Prüfe ob Platte eine oder beide Trapez-Ecken enthält
            const plattenEndeTrapez = plattenStart + plattenBreite;
            istTrapezEckenPlatte = (plattenStart < linkeEcke && plattenEndeTrapez > linkeEcke) || 
                                 (plattenStart < rechteEcke && plattenEndeTrapez > rechteEcke);
            istSpitzenPlatte = false;
            break;
        case 'trapez-auf-rechteck':
            basisBreite = parseFloat(data.untereBreite);
            const obereBreite = parseFloat(data.obereBreite);
            const seitenAbstand = (basisBreite - obereBreite) / 2;
            linkeEcke = seitenAbstand;
            rechteEcke = basisBreite - seitenAbstand;
            
            // Prüfe ob Platte eine oder beide Trapez-Ecken enthält
            const plattenEnde = plattenStart + plattenBreite;
            istTrapezEckenPlatte = (plattenStart < linkeEcke && plattenEnde > linkeEcke) || 
                                 (plattenStart < rechteEcke && plattenEnde > rechteEcke);
            break;
    }
    
    const originalPlattenEnde = plattenStart + plattenBreite;
    const istLetztePlatte = originalPlattenEnde > basisBreite;
    const plattenEndeReal = istLetztePlatte ? basisBreite : (plattenStart + plattenBreite);
    
    // SVG Dimensionen - gesamte Darstellung tiefer
    const plattenX = 20;
    const plattenY = 60;  // Tiefer positioniert
    const plattenWidth = 360;
    const plattenHeight = 160;
    
    // Berechne tatsächliche genutzte Plattenbreite für Darstellung
    const dargestellteBreite = plattenEndeReal - plattenStart;
    const endX = (dargestellteBreite / plattenBreite) * plattenWidth;
    
    // Anriss-Höhen berechnen
    const anrissHoeheLinks = (anreissMasse.links / 100 / benoetigteLaengeM) * plattenHeight;
    const anrissHoeheRechts = (anreissMasse.rechts / 100 / benoetigteLaengeM) * plattenHeight;
    
    // Y-Koordinaten
    const nutzenStartY = plattenY + plattenHeight - anrissHoeheLinks;
    const nutzenEndY = plattenY + plattenHeight - anrissHoeheRechts;
    
    // Bei Spitzenplatte: Spitzenposition innerhalb der Platte
    let spitzeX = 0;
    if (istSpitzenPlatte) {
        const spitzeVonLinks = spitzenPosition - plattenStart;
        spitzeX = plattenX + (spitzeVonLinks / plattenBreite) * plattenWidth;
    }
    
    let svg = '<svg width="100%" height="100%" viewBox="0 0 400 280" style="position: absolute; top: 0; left: 0;">';
    
    // Plattenhintergrund (vollständige Platte)
    svg += '<rect x="' + plattenX + '" y="' + plattenY + '" width="' + plattenWidth + '" height="' + plattenHeight + '" fill="#e9ecef" stroke="#999" stroke-width="2" rx="4"/>';
    
    // Tatsächlich genutzte Plattenbreite
    svg += '<rect x="' + plattenX + '" y="' + plattenY + '" width="' + endX + '" height="' + plattenHeight + '" fill="#ddd" stroke="#666" stroke-width="2" rx="4"/>';
    
    // Nutzenbereich (blau)
    if (istSpitzenPlatte) {
        svg += '<polygon points="' + plattenX + ',' + (plattenY + plattenHeight) + ' ' + (plattenX + endX) + ',' + (plattenY + plattenHeight) + ' ' + (plattenX + endX) + ',' + nutzenEndY + ' ' + spitzeX + ',' + plattenY + ' ' + plattenX + ',' + nutzenStartY + '" fill="#4a90e2" opacity="0.8"/>';
    } else if (istTrapezEckenPlatte && type === 'trapez-auf-rechteck') {
        // Trapez-auf-Rechteck: Komplexere Schnittlinie mit Ecken
        const obereBreite = parseFloat(data.obereBreite);
        const trapezHoehe = parseFloat(data.trapezHoehe);
        const rechteckHoehe = parseFloat(data.rechteckHoehe);
        const gesamtHoehe = trapezHoehe + rechteckHoehe;
        const seitenAbstand = (basisBreite - obereBreite) / 2;
        
        // Berechne Y-Position der Trapez-Rechteck-Grenze
        const trapezGrenzeY = plattenY + plattenHeight - (rechteckHoehe / gesamtHoehe) * plattenHeight;
        
        let nutzenPunkte = plattenX + ',' + (plattenY + plattenHeight) + ' ' + (plattenX + endX) + ',' + (plattenY + plattenHeight);
        
        // Bestimme Schnittpunkte basierend auf welche Ecken in der Platte sind
        const plattenEnde = plattenStart + plattenBreite;
        const enthaeltLinkeEcke = plattenStart < linkeEcke && plattenEnde > linkeEcke;
        const enthaeltRechteEcke = plattenStart < rechteEcke && plattenEnde > rechteEcke;
        
        if (enthaeltLinkeEcke && enthaeltRechteEcke) {
            // Beide Ecken in der Platte - waagerechte Linie oben
            const linkeEckeX = plattenX + ((linkeEcke - plattenStart) / plattenBreite) * plattenWidth;
            const rechteEckeX = plattenX + ((rechteEcke - plattenStart) / plattenBreite) * plattenWidth;
            nutzenPunkte += ' ' + (plattenX + endX) + ',' + nutzenEndY + ' ' + rechteEckeX + ',' + trapezGrenzeY + ' ' + linkeEckeX + ',' + trapezGrenzeY + ' ' + plattenX + ',' + nutzenStartY;
        } else if (enthaeltLinkeEcke) {
            // Nur linke Ecke
            const linkeEckeX = plattenX + ((linkeEcke - plattenStart) / plattenBreite) * plattenWidth;
            nutzenPunkte += ' ' + (plattenX + endX) + ',' + nutzenEndY + ' ' + linkeEckeX + ',' + trapezGrenzeY + ' ' + plattenX + ',' + nutzenStartY;
        } else if (enthaeltRechteEcke) {
            // Nur rechte Ecke
            const rechteEckeX = plattenX + ((rechteEcke - plattenStart) / plattenBreite) * plattenWidth;
            nutzenPunkte += ' ' + (plattenX + endX) + ',' + nutzenEndY + ' ' + rechteEckeX + ',' + trapezGrenzeY + ' ' + plattenX + ',' + nutzenStartY;
        }
        
        svg += '<polygon points="' + nutzenPunkte + '" fill="#4a90e2" opacity="0.8"/>';
    } else {
        svg += '<polygon points="' + plattenX + ',' + (plattenY + plattenHeight) + ' ' + (plattenX + endX) + ',' + (plattenY + plattenHeight) + ' ' + (plattenX + endX) + ',' + nutzenEndY + ' ' + plattenX + ',' + nutzenStartY + '" fill="#4a90e2" opacity="0.8"/>';
    }
    
    // Verschnittbereich (rot)
    if (istSpitzenPlatte) {
        svg += '<polygon points="' + plattenX + ',' + nutzenStartY + ' ' + spitzeX + ',' + plattenY + ' ' + (plattenX + endX) + ',' + nutzenEndY + ' ' + (plattenX + endX) + ',' + plattenY + ' ' + plattenX + ',' + plattenY + '" fill="#e74c3c" opacity="0.8"/>';
    } else if (istTrapezEckenPlatte && type === 'trapez-auf-rechteck') {
        // Verschnitt für Trapez-auf-Rechteck
        const obereBreite = parseFloat(data.obereBreite);
        const trapezHoehe = parseFloat(data.trapezHoehe);
        const rechteckHoehe = parseFloat(data.rechteckHoehe);
        const gesamtHoehe = trapezHoehe + rechteckHoehe;
        const seitenAbstand = (basisBreite - obereBreite) / 2;
        
        const trapezGrenzeY = plattenY + plattenHeight - (rechteckHoehe / gesamtHoehe) * plattenHeight;
        
        let verschnittPunkte = plattenX + ',' + plattenY + ' ' + (plattenX + endX) + ',' + plattenY;
        
        const plattenEnde = plattenStart + plattenBreite;
        const enthaeltLinkeEcke = plattenStart < linkeEcke && plattenEnde > linkeEcke;
        const enthaeltRechteEcke = plattenStart < rechteEcke && plattenEnde > rechteEcke;
        
        if (enthaeltLinkeEcke && enthaeltRechteEcke) {
            const linkeEckeX = plattenX + ((linkeEcke - plattenStart) / plattenBreite) * plattenWidth;
            const rechteEckeX = plattenX + ((rechteEcke - plattenStart) / plattenBreite) * plattenWidth;
            verschnittPunkte += ' ' + (plattenX + endX) + ',' + nutzenEndY + ' ' + rechteEckeX + ',' + trapezGrenzeY + ' ' + linkeEckeX + ',' + trapezGrenzeY + ' ' + plattenX + ',' + nutzenStartY;
        } else if (enthaeltLinkeEcke) {
            const linkeEckeX = plattenX + ((linkeEcke - plattenStart) / plattenBreite) * plattenWidth;
            verschnittPunkte += ' ' + (plattenX + endX) + ',' + nutzenEndY + ' ' + linkeEckeX + ',' + trapezGrenzeY + ' ' + plattenX + ',' + nutzenStartY;
        } else if (enthaeltRechteEcke) {
            const rechteEckeX = plattenX + ((rechteEcke - plattenStart) / plattenBreite) * plattenWidth;
            verschnittPunkte += ' ' + (plattenX + endX) + ',' + nutzenEndY + ' ' + rechteEckeX + ',' + trapezGrenzeY + ' ' + plattenX + ',' + nutzenStartY;
        }
        
        svg += '<polygon points="' + verschnittPunkte + '" fill="#e74c3c" opacity="0.8"/>';
    } else {
        svg += '<polygon points="' + plattenX + ',' + nutzenStartY + ' ' + (plattenX + endX) + ',' + nutzenEndY + ' ' + (plattenX + endX) + ',' + plattenY + ' ' + plattenX + ',' + plattenY + '" fill="#e74c3c" opacity="0.8"/>';
    }
    
    // Schnittlinie (schwarz)
    if (istSpitzenPlatte) {
        svg += '<line x1="' + plattenX + '" y1="' + nutzenStartY + '" x2="' + spitzeX + '" y2="' + plattenY + '" stroke="#000" stroke-width="3"/>';
        svg += '<line x1="' + spitzeX + '" y1="' + plattenY + '" x2="' + (plattenX + endX) + '" y2="' + nutzenEndY + '" stroke="#000" stroke-width="3"/>';
    } else if (istTrapezEckenPlatte && type === 'trapez-auf-rechteck') {
        // Schnittlinie für Trapez-auf-Rechteck mit Ecken
        const obereBreite = parseFloat(data.obereBreite);
        const trapezHoehe = parseFloat(data.trapezHoehe);
        const rechteckHoehe = parseFloat(data.rechteckHoehe);
        const gesamtHoehe = trapezHoehe + rechteckHoehe;
        const seitenAbstand = (basisBreite - obereBreite) / 2;
        
        const trapezGrenzeY = plattenY + plattenHeight - (rechteckHoehe / gesamtHoehe) * plattenHeight;
        
        const plattenEnde = plattenStart + plattenBreite;
        const enthaeltLinkeEcke = plattenStart < linkeEcke && plattenEnde > linkeEcke;
        const enthaeltRechteEcke = plattenStart < rechteEcke && plattenEnde > rechteEcke;
        
        if (enthaeltLinkeEcke && enthaeltRechteEcke) {
            // Beide Ecken: Linie von links schräg hoch, waagerecht, dann schräg runter
            const linkeEckeX = plattenX + ((linkeEcke - plattenStart) / plattenBreite) * plattenWidth;
            const rechteEckeX = plattenX + ((rechteEcke - plattenStart) / plattenBreite) * plattenWidth;
            svg += '<line x1="' + plattenX + '" y1="' + nutzenStartY + '" x2="' + linkeEckeX + '" y2="' + trapezGrenzeY + '" stroke="#000" stroke-width="3"/>';
            svg += '<line x1="' + linkeEckeX + '" y1="' + trapezGrenzeY + '" x2="' + rechteEckeX + '" y2="' + trapezGrenzeY + '" stroke="#000" stroke-width="3"/>';
            svg += '<line x1="' + rechteEckeX + '" y1="' + trapezGrenzeY + '" x2="' + (plattenX + endX) + '" y2="' + nutzenEndY + '" stroke="#000" stroke-width="3"/>';
        } else if (enthaeltLinkeEcke) {
            // Nur linke Ecke: schräg hoch, dann waagerecht bis Plattenende
            const linkeEckeX = plattenX + ((linkeEcke - plattenStart) / plattenBreite) * plattenWidth;
            svg += '<line x1="' + plattenX + '" y1="' + nutzenStartY + '" x2="' + linkeEckeX + '" y2="' + trapezGrenzeY + '" stroke="#000" stroke-width="3"/>';
        } else if (enthaeltRechteEcke) {
            // Nur rechte Ecke: waagerecht bis Ecke, dann schräg runter
            const rechteEckeX = plattenX + ((rechteEcke - plattenStart) / plattenBreite) * plattenWidth;
            svg += '<line x1="' + plattenX + '" y1="' + nutzenStartY + '" x2="' + rechteEckeX + '" y2="' + trapezGrenzeY + '" stroke="#000" stroke-width="3"/>';
            svg += '<line x1="' + rechteEckeX + '" y1="' + trapezGrenzeY + '" x2="' + (plattenX + endX) + '" y2="' + nutzenEndY + '" stroke="#000" stroke-width="3"/>';
        } else {
            // Keine Ecke: normale Diagonale
            svg += '<line x1="' + plattenX + '" y1="' + nutzenStartY + '" x2="' + (plattenX + endX) + '" y2="' + nutzenEndY + '" stroke="#000" stroke-width="3"/>';
        }
    } else {
        svg += '<line x1="' + plattenX + '" y1="' + nutzenStartY + '" x2="' + (plattenX + endX) + '" y2="' + nutzenEndY + '" stroke="#000" stroke-width="3"/>';
    }
    
    // Anrisslinien (rot)
    svg += '<line x1="' + plattenX + '" y1="' + (plattenY + plattenHeight) + '" x2="' + plattenX + '" y2="' + nutzenStartY + '" stroke="#dc3545" stroke-width="4"/>';
    svg += '<line x1="' + (plattenX + endX) + '" y1="' + (plattenY + plattenHeight) + '" x2="' + (plattenX + endX) + '" y2="' + nutzenEndY + '" stroke="#dc3545" stroke-width="4"/>';
    
    // Anrissmaße - korrigierte Position für 0cm bei letzter Platte
    if (anreissMasse.links === 0) {
        svg += '<text x="10" y="' + (plattenY + plattenHeight + 10) + '" text-anchor="middle" font-size="14" fill="#dc3545" font-weight="bold" transform="rotate(-90 10 ' + (plattenY + plattenHeight + 10) + ')">' + anreissMasse.links + 'cm</text>';
    } else {
        svg += '<text x="10" y="' + (nutzenStartY + (plattenHeight - anrissHoeheLinks)/2) + '" text-anchor="middle" font-size="14" fill="#dc3545" font-weight="bold" transform="rotate(-90 10 ' + (nutzenStartY + (plattenHeight - anrissHoeheLinks)/2) + ')">' + anreissMasse.links + 'cm</text>';
    }
    
    if (anreissMasse.rechts === 0) {
        // Bei 0cm rechts der letzten Platte: Genau da wo die Diagonale die Unterkante trifft
        if (istLetztePlatte) {
            svg += '<text x="' + (plattenX + endX) + '" y="' + (plattenY + plattenHeight + 15) + '" text-anchor="middle" font-size="14" fill="#dc3545" font-weight="bold">' + anreissMasse.rechts + 'cm</text>';
        } else {
            svg += '<text x="' + (plattenX + endX + 20) + '" y="' + (plattenY + plattenHeight + 10) + '" text-anchor="middle" font-size="14" fill="#dc3545" font-weight="bold" transform="rotate(-90 ' + (plattenX + endX + 20) + ' ' + (plattenY + plattenHeight + 10) + ')">' + anreissMasse.rechts + 'cm</text>';
        }
    } else {
        svg += '<text x="' + (plattenX + endX + 20) + '" y="' + (nutzenEndY + (plattenHeight - anrissHoeheRechts)/2) + '" text-anchor="middle" font-size="14" fill="#dc3545" font-weight="bold" transform="rotate(-90 ' + (plattenX + endX + 20) + ' ' + (nutzenEndY + (plattenHeight - anrissHoeheRechts)/2) + ')">' + anreissMasse.rechts + 'cm</text>';
    }
    
    // Beschriftung "Nutzen" unter der Platte - angepasst für tiefere Position
    svg += '<text x="' + (plattenX + endX/2) + '" y="' + (plattenY + plattenHeight + 50) + '" text-anchor="middle" fill="#333" font-weight="bold" font-size="16">Nutzen</text>';
    
    // "Abschnitt" Beschriftungen über der Platte
    if (istSpitzenPlatte) {
        const linkerAbschnittX = plattenX + (spitzeX - plattenX) / 2;
        const rechterAbschnittX = spitzeX + (plattenX + endX - spitzeX) / 2;
        
        if (spitzeX - plattenX > 40) {
            svg += '<text x="' + linkerAbschnittX + '" y="' + (plattenY - 15) + '" text-anchor="middle" fill="#333" font-weight="bold" font-size="14">Abschnitt</text>';
        }
        if (plattenX + endX - spitzeX > 40) {
            svg += '<text x="' + rechterAbschnittX + '" y="' + (plattenY - 15) + '" text-anchor="middle" fill="#333" font-weight="bold" font-size="14">Abschnitt</text>';
        }
    } else {
        svg += '<text x="' + (plattenX + endX/2) + '" y="' + (plattenY - 15) + '" text-anchor="middle" fill="#333" font-weight="bold" font-size="14">Abschnitt</text>';
    }
    
    // Bei letzter Platte: Grüne Linie für Überhang-Abschnitt und Abstandsmaß
    if (istLetztePlatte) {
        const ueberhang = originalPlattenEnde - basisBreite;
        
        // Grüne ENDE-Linie
        svg += '<line x1="' + (plattenX + endX) + '" y1="' + (plattenY - 5) + '" x2="' + (plattenX + endX) + '" y2="' + (plattenY + plattenHeight + 5) + '" stroke="#28a745" stroke-width="3"/>';
        svg += '<text x="' + (plattenX + endX + 8) + '" y="' + (plattenY - 8) + '" font-size="12" fill="#28a745" font-weight="bold">ENDE</text>';
        
        // Abstandsmaß zwischen Dachende und Plattenende (oberhalb der Platte)
        if (ueberhang > 0) {
            const abstandsLinieY = plattenY - 30;
            svg += '<line x1="' + (plattenX + endX) + '" y1="' + abstandsLinieY + '" x2="' + (plattenX + plattenWidth) + '" y2="' + abstandsLinieY + '" stroke="#dc3545" stroke-width="2" stroke-dasharray="3,2"/>';
            svg += '<text x="' + (plattenX + endX + (plattenWidth - endX)/2) + '" y="' + (abstandsLinieY - 5) + '" text-anchor="middle" font-size="11" fill="#dc3545" font-weight="bold">' + (ueberhang * 100).toFixed(0) + 'cm</text>';
        }
    }
    
    // Nur bei Spitzenplatte: Gelbe gestrichelte Maßlinie zur Spitze
    if (istSpitzenPlatte) {
        const spitzeVonLinks = spitzenPosition - plattenStart;
        const massLinieY = plattenY + plattenHeight/2;
        
        svg += '<line x1="' + plattenX + '" y1="' + massLinieY + '" x2="' + spitzeX + '" y2="' + massLinieY + '" stroke="#ffc107" stroke-width="2" stroke-dasharray="5,3"/>';
        svg += '<text x="' + (plattenX + (spitzeX - plattenX)/2) + '" y="' + (massLinieY - 8) + '" text-anchor="middle" font-size="12" fill="#ffc107" font-weight="bold">' + spitzeVonLinks.toFixed(2) + 'm</text>';
        
        svg += '<line x1="' + spitzeX + '" y1="' + plattenY + '" x2="' + spitzeX + '" y2="' + (plattenY + plattenHeight) + '" stroke="#ffc107" stroke-width="3"/>';
        svg += '<text x="' + spitzeX + '" y="' + (plattenY - 25) + '" text-anchor="middle" font-size="12" fill="#ffc107" font-weight="bold">SPITZE</text>';
    }
    
    // Bei Trapez-auf-Rechteck: Markiere Ecken
    if (istTrapezEckenPlatte && type === 'trapez-auf-rechteck') {
        const obereBreite = parseFloat(data.obereBreite);
        const trapezHoehe = parseFloat(data.trapezHoehe);
        const rechteckHoehe = parseFloat(data.rechteckHoehe);
        const gesamtHoehe = trapezHoehe + rechteckHoehe;
        const seitenAbstand = (basisBreite - obereBreite) / 2;
        
        const trapezGrenzeY = plattenY + plattenHeight - (rechteckHoehe / gesamtHoehe) * plattenHeight;
        const plattenEnde = plattenStart + plattenBreite;
        
        if (plattenStart < linkeEcke && plattenEnde > linkeEcke) {
            const linkeEckeX = plattenX + ((linkeEcke - plattenStart) / plattenBreite) * plattenWidth;
            svg += '<circle cx="' + linkeEckeX + '" cy="' + trapezGrenzeY + '" r="4" fill="#ffc107"/>';
            svg += '<text x="' + linkeEckeX + '" y="' + (trapezGrenzeY - 10) + '" text-anchor="middle" font-size="10" fill="#ffc107" font-weight="bold">ECKE L</text>';
        }
        
        if (plattenStart < rechteEcke && plattenEnde > rechteEcke) {
            const rechteEckeX = plattenX + ((rechteEcke - plattenStart) / plattenBreite) * plattenWidth;
            svg += '<circle cx="' + rechteEckeX + '" cy="' + trapezGrenzeY + '" r="4" fill="#ffc107"/>';
            svg += '<text x="' + rechteEckeX + '" y="' + (trapezGrenzeY - 10) + '" text-anchor="middle" font-size="10" fill="#ffc107" font-weight="bold">ECKE R</text>';
        }
    }
    
    svg += '</svg>';
    return svg;
}

// Anweisungen generieren
function generateInstructions(item, anreissMasse, type, data) {
    const plattenStart = parseFloat(item.positionVonLinks);
    const plattenBreite = parseFloat(item.plattenbreite);
    
    let instructions = '<strong>Anzeichnen:</strong><br>';
    
    let basisBreite = 0;
    switch(type) {
        case 'gleichschenkliges-dreieck':
        case 'ungleichschenkliges-dreieck':
            basisBreite = parseFloat(data.basisBreite);
            break;
        case 'trapez':
        case 'trapez-auf-rechteck':
            basisBreite = parseFloat(data.untereBreite);
            break;
    }
    
    const originalPlattenEnde = plattenStart + plattenBreite;
    const istLetztePlatte = originalPlattenEnde > basisBreite;
    
    if (istLetztePlatte) {
        const ueberhang = originalPlattenEnde - basisBreite;
        if (ueberhang > 0) {
            instructions += '• <strong style="color: #dc3545;">ZUERST: Rechts ' + (ueberhang * 100).toFixed(0) + 'cm abschneiden!</strong><br>';
        }
    }
    
    instructions += '• Von der Unterkante: Links bei ' + anreissMasse.links + 'cm und rechts bei ' + anreissMasse.rechts + 'cm markieren<br>';
    instructions += '• Diagonale Schnittlinie anzeichnen und oberen Teil absägen<br>';
    
    if (anreissMasse.links === anreissMasse.rechts) {
        instructions += '• <strong style="color: #198754;">TIPP: Symmetrischer Schnitt!</strong><br>';
    }
    
    return instructions;
}

// Einzelne Platte generieren
function generatePlate(item, index, type, data) {
    const plattenStart = parseFloat(item.positionVonLinks);
    const plattenEnde = parseFloat(item.positionBis);
    const anreissMasse = calculateAnreissMasse(plattenStart, plattenEnde, type, data);
    
    let html = '<div class="anriss-plate">';
    html += '<div style="display: flex; gap: 20px;">';
    html += '<div style="flex: 0 0 350px;">';
    html += '<h3>Platte ' + item.plattenNr + ' (Position: ' + item.positionVonLinks + 'm - ' + item.positionBis + 'm)</h3>';
    
    html += '<div style="margin: 15px 0; padding: 10px; background: #f0f8ff; border-radius: 6px;">';
    html += '<div><strong>Links:</strong> ' + anreissMasse.links + 'cm</div>';
    html += '<div><strong>Rechts:</strong> ' + anreissMasse.rechts + 'cm</div>';
    html += '<div><strong>Benötigte Länge:</strong> ' + item.benoetigteLaenge + 'm</div>';
    html += '</div>';
    
    html += '<div style="background: #f8f9fa; border-left: 4px solid #ffc107; padding: 12px; border-radius: 6px; font-size: 13px; line-height: 1.4;">';
    html += generateInstructions(item, anreissMasse, type, data);
    html += '</div>';
    
    html += '</div>';
    html += '<div style="flex: 1; position: relative; height: 280px; background: #f8f9fa; border-radius: 8px; border: 1px solid #ddd;">';
    html += generatePlateDiagram(item, anreissMasse, type, data);
    html += '</div>';
    html += '</div>';
    html += '</div>';
    
    return html;
}

// Alle Platten generieren
function generateAllPlates(type, data) {
    const container = document.getElementById('plates-container');
    let html = '';
    
    for (let i = 0; i < data.schnittliste.length; i++) {
        html += generatePlate(data.schnittliste[i], i, type, data);
    }
    
    // Drucken-Button unter der letzten Platte
    html += '<div style="text-align: center; margin: 30px 0;">';
    html += '<button onclick="window.print()" class="btn btn-primary">Anrissplan drucken</button>';
    html += '</div>';
    
    container.innerHTML = html;
}

// Hauptinitialisierung
function init() {
    console.log('Anrissplan init gestartet');
    
    try {
        const params = getUrlParams();
        console.log('URL Parameters:', params);
        
        if (!params.type || !params.data) {
            console.log('Keine Parameter gefunden');
            document.getElementById('plan-title').textContent = 'Fehler: Keine Daten übertragen';
            document.getElementById('plan-info').innerHTML = '<strong style="color: #dc3545;">Fehler:</strong> Keine gültigen Daten gefunden. Bitte kehren Sie zum Rechner zurück.';
            return;
        }
        
        planType = params.type;
        planData = decodeData(params.data);
        console.log('Dekodierte Daten:', planData);
        
        if (!planData) {
            console.log('Daten konnten nicht dekodiert werden');
            document.getElementById('plan-title').textContent = 'Fehler: Daten beschädigt';
            document.getElementById('plan-info').innerHTML = '<strong style="color: #dc3545;">Fehler:</strong> Die übertragenen Daten sind beschädigt. Bitte kehren Sie zum Rechner zurück.';
            return;
        }
        
        console.log('Starte Header-Update');
        updateHeader(planType, planData);
        
        console.log('Starte Übersicht-Generierung');
        generateOverview(planType, planData);
        
        console.log('Starte Platten-Generierung');
        generateAllPlates(planType, planData);
        
        console.log('Anrissplan erfolgreich geladen');
        
    } catch (error) {
        console.error('Fehler in init():', error);
        document.getElementById('plan-title').textContent = 'JavaScript-Fehler aufgetreten';
        document.getElementById('plan-info').innerHTML = '<strong style="color: #dc3545;">Fehler:</strong> ' + error.message;
    }
}
