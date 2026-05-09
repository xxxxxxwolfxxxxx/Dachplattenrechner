// anrissplan.js - Alle JavaScript-Funktionen für den Anrissplan

// Globale Variablen
let planData = null;
let planType = null;

// URL Parameter auslesen
function getUrlParams() {
    const urlParams = new URLSearchParams(window.location.search);
    return {
        // Altes Format (Backward-Kompatibilität)
        type: urlParams.get('type'),
        data: urlParams.get('data'),

        // Neues Format (einfache Parameter)
        breite: parseFloat(urlParams.get('breite') || '0'),
        hoehe: parseFloat(urlParams.get('hoehe') || '0'),
        typ: urlParams.get('typ') || urlParams.get('type'),

        // Form-spezifische Parameter
        breiteOben: parseFloat(urlParams.get('breiteOben') || urlParams.get('breite-oben') || '0'),
        spitzenPosition: parseFloat(urlParams.get('spitzenPosition') || '0'),
        rechteckHoehe: parseFloat(urlParams.get('rechteckHoehe') || urlParams.get('rechteck-hoehe') || '0'),
        dreieckHoehe: parseFloat(urlParams.get('dreieckHoehe') || urlParams.get('trapez-hoehe') || '0'),
        dreieckTyp: urlParams.get('dreieckTyp') || 'symmetrisch',

        // Optional: Plattenabmessungen (defaults: 1.05m lieferbreite, 1.00m deckbreite)
        lieferbreite: parseFloat(urlParams.get('lieferbreite') || '1.05'),
        deckbreite: parseFloat(urlParams.get('deckbreite') || '1.00'),

        // Für Kompatibilität mit altem Parameter-Schema
        'breite-oben': urlParams.get('breite-oben'),
        'trapez-hoehe': urlParams.get('trapez-hoehe'),
        'rechteck-hoehe': urlParams.get('rechteck-hoehe')
    };
}

// ============================================================================
// Schnittliste-Generierung (Neue Funktionen für einfache Parameter)
// ============================================================================

// Schnittliste für Rechteck generieren
function generateSchnittlisteRectangle(breite, hoehe, lieferbreite, deckbreite) {
    const schnittliste = [];
    let anzahlPlatten = Math.ceil((breite - lieferbreite + deckbreite) / deckbreite);

    for (let i = 0; i < anzahlPlatten; i++) {
        let positionVonLinks = (i === 0) ? 0 : i * deckbreite;
        let positionVonLinksEnde = positionVonLinks + lieferbreite;
        positionVonLinksEnde = Math.min(positionVonLinksEnde, breite);

        if (positionVonLinks < breite) {
            schnittliste.push({
                plattenNr: i + 1,
                positionVonLinks: positionVonLinks.toFixed(2),
                positionBis: positionVonLinksEnde.toFixed(2),
                benoetigteLaenge: hoehe.toFixed(2),
                plattenbreite: lieferbreite.toFixed(2)
            });
        }
    }

    return schnittliste;
}

// Schnittliste für Gleichschenkliges Dreieck generieren
function generateSchnittlisteEqualTriangle(breite, hoehe, lieferbreite, deckbreite) {
    const schnittliste = [];
    const linkeEcke = breite / 2;
    let anzahlPlatten = Math.ceil((breite - lieferbreite + deckbreite) / deckbreite);

    for (let i = 0; i < anzahlPlatten; i++) {
        let positionVonLinks = (i === 0) ? 0 : i * deckbreite;
        let positionVonLinksEnde = positionVonLinks + lieferbreite;
        positionVonLinksEnde = Math.min(positionVonLinksEnde, breite);

        // Höhe an beiden Positionen berechnen (Dreieck)
        function hoeheAnPosition(pos) {
            const abstandVonMitte = Math.abs(pos - breite / 2);
            return hoehe * (1 - abstandVonMitte / (breite / 2));
        }

        const hoeheStart = hoeheAnPosition(positionVonLinks);
        const hoeheEnde = hoeheAnPosition(positionVonLinksEnde);
        const benoetigteLaenge = Math.max(hoeheStart, hoeheEnde);

        if (benoetigteLaenge > 0 && positionVonLinks < breite) {
            schnittliste.push({
                plattenNr: i + 1,
                positionVonLinks: positionVonLinks.toFixed(2),
                positionBis: positionVonLinksEnde.toFixed(2),
                benoetigteLaenge: benoetigteLaenge.toFixed(2),
                plattenbreite: lieferbreite.toFixed(2)
            });
        }
    }

    return schnittliste;
}

// Schnittliste für Ungleichschenkliges Dreieck generieren
function generateSchnittlisteUnequalTriangle(breite, hoehe, spitzenPosition, lieferbreite, deckbreite) {
    const schnittliste = [];
    let anzahlPlatten = Math.ceil((breite - lieferbreite + deckbreite) / deckbreite);

    for (let i = 0; i < anzahlPlatten; i++) {
        let positionVonLinks = (i === 0) ? 0 : i * deckbreite;
        let positionVonLinksEnde = positionVonLinks + lieferbreite;
        positionVonLinksEnde = Math.min(positionVonLinksEnde, breite);

        // Höhe an Position berechnen
        function hoeheAnPosition(pos) {
            if (pos <= spitzenPosition) {
                return hoehe * (pos / spitzenPosition);
            } else {
                return hoehe * (breite - pos) / (breite - spitzenPosition);
            }
        }

        const hoeheStart = hoeheAnPosition(positionVonLinks);
        const hoeheEnde = hoeheAnPosition(positionVonLinksEnde);
        const benoetigteLaenge = Math.max(hoeheStart, hoeheEnde);

        if (benoetigteLaenge > 0 && positionVonLinks < breite) {
            schnittliste.push({
                plattenNr: i + 1,
                positionVonLinks: positionVonLinks.toFixed(2),
                positionBis: positionVonLinksEnde.toFixed(2),
                benoetigteLaenge: benoetigteLaenge.toFixed(2),
                plattenbreite: lieferbreite.toFixed(2)
            });
        }
    }

    return schnittliste;
}

// Schnittliste für Trapez generieren
function generateSchnittlisteTrapez(untereBreite, obereBreite, hoehe, lieferbreite, deckbreite) {
    const schnittliste = [];
    const breitenDifferenz = untereBreite - obereBreite;
    const seitenAbstand = breitenDifferenz / 2;
    const linkeObereEcke = seitenAbstand;
    const rechteObereEcke = untereBreite - seitenAbstand;

    let anzahlPlatten = Math.ceil((untereBreite - lieferbreite + deckbreite) / deckbreite);

    for (let i = 0; i < anzahlPlatten; i++) {
        let positionVonLinks = (i === 0) ? 0 : i * deckbreite;
        let positionVonLinksEnde = positionVonLinks + lieferbreite;
        positionVonLinksEnde = Math.min(positionVonLinksEnde, untereBreite);

        // Höhe an Position berechnen
        function hoeheAnPosition(pos) {
            if (pos <= linkeObereEcke) {
                return hoehe * (pos / linkeObereEcke);
            } else if (pos >= rechteObereEcke) {
                const abstandVonRechts = untereBreite - pos;
                return hoehe * (abstandVonRechts / seitenAbstand);
            } else {
                return hoehe;
            }
        }

        const hoeheStart = hoeheAnPosition(positionVonLinks);
        const hoeheEnde = hoeheAnPosition(positionVonLinksEnde);
        const benoetigteLaenge = Math.max(hoeheStart, hoeheEnde);

        if (benoetigteLaenge > 0 && positionVonLinks < untereBreite) {
            schnittliste.push({
                plattenNr: i + 1,
                positionVonLinks: positionVonLinks.toFixed(2),
                positionBis: positionVonLinksEnde.toFixed(2),
                benoetigteLaenge: benoetigteLaenge.toFixed(2),
                plattenbreite: lieferbreite.toFixed(2)
            });
        }
    }

    return schnittliste;
}

// Schnittliste für Trapez auf Rechteck generieren
function generateSchnittlisteTrapezRectangle(untereBreite, obereBreite, rechteckHoehe, dreieckHoehe, lieferbreite, deckbreite) {
    const schnittliste = [];
    const breitenDifferenz = untereBreite - obereBreite;
    const seitenAbstand = breitenDifferenz / 2;
    const linkeObereEcke = seitenAbstand;
    const rechteObereEcke = untereBreite - seitenAbstand;
    const totalHoehe = rechteckHoehe + dreieckHoehe;

    let anzahlPlatten = Math.ceil((untereBreite - lieferbreite + deckbreite) / deckbreite);

    for (let i = 0; i < anzahlPlatten; i++) {
        let positionVonLinks = (i === 0) ? 0 : i * deckbreite;
        let positionVonLinksEnde = positionVonLinks + lieferbreite;
        positionVonLinksEnde = Math.min(positionVonLinksEnde, untereBreite);

        // Höhe an Position berechnen
        function hoeheAnPosition(pos) {
            // Rechteck-Teil
            let hoeheRectangle = rechteckHoehe;

            // Trapez-Teil (oben)
            let hoeheTrapez = 0;
            if (pos <= linkeObereEcke) {
                hoeheTrapez = dreieckHoehe * (pos / linkeObereEcke);
            } else if (pos >= rechteObereEcke) {
                const abstandVonRechts = untereBreite - pos;
                hoeheTrapez = dreieckHoehe * (abstandVonRechts / seitenAbstand);
            } else {
                hoeheTrapez = dreieckHoehe;
            }

            return hoeheRectangle + hoeheTrapez;
        }

        const hoeheStart = hoeheAnPosition(positionVonLinks);
        const hoeheEnde = hoeheAnPosition(positionVonLinksEnde);
        const benoetigteLaenge = Math.max(hoeheStart, hoeheEnde);

        if (benoetigteLaenge > 0 && positionVonLinks < untereBreite) {
            schnittliste.push({
                plattenNr: i + 1,
                positionVonLinks: positionVonLinks.toFixed(2),
                positionBis: positionVonLinksEnde.toFixed(2),
                benoetigteLaenge: benoetigteLaenge.toFixed(2),
                plattenbreite: lieferbreite.toFixed(2)
            });
        }
    }

    return schnittliste;
}

// Schnittliste für Dreieck auf Rechteck generieren
function generateSchnittlisteTriangleRectangle(breite, rechteckHoehe, dreieckHoehe, spitzenPosition, lieferbreite, deckbreite) {
    const schnittliste = [];
    const totalHoehe = rechteckHoehe + dreieckHoehe;
    let anzahlPlatten = Math.ceil((breite - lieferbreite + deckbreite) / deckbreite);

    for (let i = 0; i < anzahlPlatten; i++) {
        let positionVonLinks = (i === 0) ? 0 : i * deckbreite;
        let positionVonLinksEnde = positionVonLinks + lieferbreite;
        positionVonLinksEnde = Math.min(positionVonLinksEnde, breite);

        function hoeheAnPosition(pos) {
            if (pos <= 0 || pos >= breite) return rechteckHoehe;
            let dreieckAnteil;
            if (pos <= spitzenPosition) {
                dreieckAnteil = dreieckHoehe * (pos / spitzenPosition);
            } else {
                dreieckAnteil = dreieckHoehe * (breite - pos) / (breite - spitzenPosition);
            }
            return rechteckHoehe + dreieckAnteil;
        }

        const hoeheStart = hoeheAnPosition(positionVonLinks);
        const hoeheEnde = hoeheAnPosition(positionVonLinksEnde);
        const benoetigteLaenge = Math.max(hoeheStart, hoeheEnde);

        if (benoetigteLaenge > 0 && positionVonLinks < breite) {
            schnittliste.push({
                plattenNr: i + 1,
                positionVonLinks: positionVonLinks.toFixed(2),
                positionBis: positionVonLinksEnde.toFixed(2),
                benoetigteLaenge: benoetigteLaenge.toFixed(2),
                plattenbreite: lieferbreite.toFixed(2)
            });
        }
    }

    return schnittliste;
}

// Hauptfunktion: schnittliste aus einfachen Parametern generieren
function generateSchnittlisteFromParams(breite, hoehe, typ, additionalParams = {}) {
    const lieferbreite = additionalParams.lieferbreite || 1.05;
    const deckbreite = additionalParams.deckbreite || 1.00;

    let schnittliste = [];
    let obereBreite = breite;

    switch(typ) {
        case 'rechteck':
            schnittliste = generateSchnittlisteRectangle(breite, hoehe, lieferbreite, deckbreite);
            obereBreite = breite;
            break;

        case 'gleichschenkliges-dreieck':
            schnittliste = generateSchnittlisteEqualTriangle(breite, hoehe, lieferbreite, deckbreite);
            obereBreite = 0;
            break;

        case 'ungleichschenkliges-dreieck':
            const spitzenPosition = additionalParams.spitzenPosition || breite / 2;
            schnittliste = generateSchnittlisteUnequalTriangle(breite, hoehe, spitzenPosition, lieferbreite, deckbreite);
            obereBreite = 0;
            break;

        case 'trapez':
            obereBreite = additionalParams.breiteOben || breite * 0.8;
            schnittliste = generateSchnittlisteTrapez(breite, obereBreite, hoehe, lieferbreite, deckbreite);
            break;

        case 'dreieck-auf-rechteck':
            const drRechteckH = additionalParams.rechteckHoehe || hoehe * 0.5;
            const drDreieckH = additionalParams.dreieckHoehe || hoehe * 0.5;
            const drSpitze = additionalParams.spitzenPosition || breite / 2;
            obereBreite = 0;
            schnittliste = generateSchnittlisteTriangleRectangle(breite, drRechteckH, drDreieckH, drSpitze, lieferbreite, deckbreite);
            break;

        case 'trapez-auf-rechteck':
            obereBreite = additionalParams.breiteOben || breite * 0.8;
            const rechteckHoehe = additionalParams.rechteckHoehe || hoehe * 0.5;
            const dreieckHoehe = additionalParams.dreieckHoehe || hoehe * 0.5;
            schnittliste = generateSchnittlisteTrapezRectangle(breite, obereBreite, rechteckHoehe, dreieckHoehe, lieferbreite, deckbreite);
            break;

        default:
            // Fallback zu rechteck
            schnittliste = generateSchnittlisteRectangle(breite, hoehe, lieferbreite, deckbreite);
            obereBreite = breite;
    }

    return {
        // Haupt-Dimensionen (für alle Übersicht-Funktionen notwendig)
        breite: breite,              // Für Rechteck-Übersicht
        basisBreite: breite,         // Für Dreieck-Übersicht
        untereBreite: breite,        // Für Trapez-Übersicht
        obereBreite: obereBreite,    // Für Trapez-Übersicht
        hoehe: hoehe,

        // Form-spezifische Parameter
        spitzenPosition: additionalParams.spitzenPosition || breite / 2,
        rechteckHoehe: additionalParams.rechteckHoehe || 0,
        dreieckHoehe: additionalParams.dreieckHoehe || 0,
        trapezHoehe: additionalParams.dreieckHoehe || 0,

        // Dreieck-Typ
        dreieckTyp: additionalParams.dreieckTyp || 'symmetrisch',

        // Plattendimensionen
        lieferbreite: lieferbreite,
        deckbreite: deckbreite,

        // Schnittliste (wichtigste Eigenschaft)
        schnittliste: schnittliste
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
        case 'dreieck-auf-rechteck':
            title = 'Anrissplan - Dreieck auf Rechteck';
            info = 'Breite: ' + data.basisBreite + 'm | Dreieck: ' + data.dreieckHoehe + 'm | Rechteck: ' + data.rechteckHoehe + 'm | Platten: ' + data.schnittliste.length + ' Stück';
            break;
        case 'rechteck':
            title = 'Anrissplan - Rechteck/Quadrat';
            info = 'Breite: ' + data.breite + 'm | Höhe: ' + data.hoehe + 'm | Platten: ' + data.schnittliste.length + ' Stück';
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
        case 'dreieck-auf-rechteck':
            svg = generateDreieckRechteckOverview(data);
            break;
        case 'rechteck':
            svg = generateRechteckOverview(data);
            break;
        default:
            svg = '<p>Unbekannte Dachform</p>';
    }
    
    // BRANDING-STELLE 1: In der Übersicht
    container.innerHTML = '<div style="text-align: center; border: 2px solid #1e3c72; border-radius: 8px; padding: 20px; background: white; display: inline-block;">' + svg + '<div style="margin-top: 15px; font-size: 14px; color: #666;"><strong>Plattenaufteilung für ' + data.schnittliste.length + ' Platten</strong></div><div style="margin-top: 10px; padding-top: 10px; border-top: 1px solid #e0e0e0; font-size: 11px; color: #999;">erstellt mit <strong style="color: #1e3c72;">Dachplattenrechner.de</strong></div></div>';
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
    svg += '<line x1="' + margin + '" y1="' + (linksY + 50) + '" x2="' + rechtsX + '" y2="' + (linksY + 50) + '" stroke="#666" stroke-width="1"/>';
    svg += '<text x="' + (margin + (basisBreite * scaleX)/2) + '" y="' + (linksY + 65) + '" text-anchor="middle" font-size="14" fill="#333" font-weight="bold">Basis: ' + basisBreite + 'm</text>';
    
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

// Trapez Übersicht
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

// Trapez auf Rechteck Übersicht
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
    
    // Platten als senkrechte Linien über beide Bereiche
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
            const verhaeltnis = plattenStart / seitenAbstand;
            plattenObenY = rechteckY - verhaeltnis * (rechteckY - margin);
        } else if (plattenStart >= (untereBreite - seitenAbstand)) {
            const abstandVonRechts = untereBreite - plattenStart;
            const verhaeltnis = abstandVonRechts / seitenAbstand;
            plattenObenY = rechteckY - verhaeltnis * (rechteckY - margin);
        } else {
            plattenObenY = margin;
        }
        
        svg += '<line x1="' + plattenX + '" y1="' + (margin + gesamtHoehe * scaleY) + '" x2="' + plattenX + '" y2="' + plattenObenY + '" stroke="#666" stroke-width="1.5" opacity="0.8"/>';
        svg += '<text x="' + plattenMitteX + '" y="' + (margin + gesamtHoehe * scaleY + 20) + '" text-anchor="middle" font-size="12" fill="#333" font-weight="bold">' + platte.plattenNr + '</text>';
    }
    
    // Trapez-Ecken markieren (links und rechts)
    svg += '<circle cx="' + obenLinksX + '" cy="' + margin + '" r="4" fill="#ffc107"/>';
    svg += '<circle cx="' + obenRechtsX + '" cy="' + margin + '" r="4" fill="#ffc107"/>';
    svg += '<text x="' + obenLinksX + '" y="' + (margin - 15) + '" text-anchor="middle" font-size="11" fill="#ffc107" font-weight="bold">ECKE L</text>';
    svg += '<text x="' + obenRechtsX + '" y="' + (margin - 15) + '" text-anchor="middle" font-size="11" fill="#ffc107" font-weight="bold">ECKE R</text>';
    
    // Obere Kante markieren
    svg += '<line x1="' + obenLinksX + '" y1="' + margin + '" x2="' + obenRechtsX + '" y2="' + margin + '" stroke="#28a745" stroke-width="3"/>';
    svg += '<text x="' + ((obenLinksX + obenRechtsX)/2) + '" y="' + (margin - 25) + '" text-anchor="middle" font-size="12" fill="#28a745" font-weight="bold">Oben: ' + obereBreite + 'm</text>';
    
    // Untere Kante
    svg += '<text x="' + (margin + (untereBreite * scaleX)/2) + '" y="' + (height - 10) + '" text-anchor="middle" font-size="12" fill="#333" font-weight="bold">Unten: ' + untereBreite + 'm</text>';
    
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

// Rechteck Übersicht
function generateDreieckRechteckOverview(data) {
    const width = 800;
    const height = 350;
    const margin = 40;
    const diagramWidth = 460;

    const basisBreite = parseFloat(data.basisBreite);
    const dreieckHoehe = parseFloat(data.dreieckHoehe);
    const rechteckHoehe = parseFloat(data.rechteckHoehe);
    const gesamtHoehe = dreieckHoehe + rechteckHoehe;
    const spitzenPosition = parseFloat(data.spitzenPosition) || basisBreite / 2;

    const scaleX = (diagramWidth - 2 * margin) / basisBreite;
    const scaleY = (height - 2 * margin - 40) / gesamtHoehe;

    const dreieckUntenY = margin + dreieckHoehe * scaleY;

    let svg = '<svg width="' + width + '" height="' + height + '" viewBox="0 0 ' + width + ' ' + height + '">';
    svg += '<rect width="' + width + '" height="' + height + '" fill="#fdfdfd"/>';

    // Rechteck (unten)
    svg += '<rect x="' + margin + '" y="' + dreieckUntenY + '" width="' + (basisBreite * scaleX) + '" height="' + (rechteckHoehe * scaleY) + '" fill="#e8f4fd" stroke="#1976d2" stroke-width="2"/>';

    // Dreieck (oben)
    const spitzeX = margin + spitzenPosition * scaleX;
    const linksX = margin;
    const rechtsX = margin + basisBreite * scaleX;

    svg += '<polygon points="' + spitzeX + ',' + margin + ' ' + linksX + ',' + dreieckUntenY + ' ' + rechtsX + ',' + dreieckUntenY + '" fill="#e3f2fd" stroke="#1976d2" stroke-width="2"/>';

    // Platten als senkrechte Linien
    for (let i = 0; i < data.schnittliste.length; i++) {
        const platte = data.schnittliste[i];
        const plattenStart = parseFloat(platte.positionVonLinks);
        const plattenBreite = parseFloat(platte.plattenbreite);
        const plattenMitte = plattenStart + (plattenBreite / 2);
        const plattenX = margin + plattenStart * scaleX;
        const plattenMitteX = margin + plattenMitte * scaleX;

        // Oberkante im Dreieck berechnen
        let plattenObenY;
        if (plattenStart <= spitzenPosition) {
            const verhaeltnis = plattenStart / spitzenPosition;
            plattenObenY = dreieckUntenY - verhaeltnis * (dreieckUntenY - margin);
        } else {
            const abstandVonRechts = basisBreite - plattenStart;
            const rechteSeite = basisBreite - spitzenPosition;
            const verhaeltnis = abstandVonRechts / rechteSeite;
            plattenObenY = dreieckUntenY - verhaeltnis * (dreieckUntenY - margin);
        }

        svg += '<line x1="' + plattenX + '" y1="' + (margin + gesamtHoehe * scaleY) + '" x2="' + plattenX + '" y2="' + plattenObenY + '" stroke="#666" stroke-width="1.5" opacity="0.8"/>';
        svg += '<text x="' + plattenMitteX + '" y="' + (margin + gesamtHoehe * scaleY + 20) + '" text-anchor="middle" font-size="12" fill="#333" font-weight="bold">' + platte.plattenNr + '</text>';
    }

    // Spitze markieren
    svg += '<circle cx="' + spitzeX + '" cy="' + margin + '" r="4" fill="#28a745"/>';
    svg += '<text x="' + spitzeX + '" y="' + (margin - 15) + '" text-anchor="middle" font-size="11" fill="#28a745" font-weight="bold">SPITZE</text>';

    // Untere Kante
    svg += '<text x="' + (margin + (basisBreite * scaleX)/2) + '" y="' + (height - 10) + '" text-anchor="middle" font-size="12" fill="#333" font-weight="bold">Breite: ' + basisBreite + 'm</text>';

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

function generateRechteckOverview(data) {
    const width = 800;
    const height = 300;
    const margin = 40;
    const diagramWidth = 460;
    
    const breite = parseFloat(data.breite);
    const hoehe = parseFloat(data.hoehe);
    
    const scaleX = (diagramWidth - 2 * margin) / breite;
    const scaleY = (height - 2 * margin - 40) / hoehe;
    
    let svg = '<svg width="' + width + '" height="' + height + '" viewBox="0 0 ' + width + ' ' + height + '">';
    svg += '<rect width="' + width + '" height="' + height + '" fill="#fdfdfd"/>';
    
    // Rechteck gefüllt
    svg += '<rect x="' + margin + '" y="' + margin + '" width="' + (breite * scaleX) + '" height="' + (hoehe * scaleY) + '" fill="#e3f2fd" stroke="#1976d2" stroke-width="2"/>';
    
    // Platten als senkrechte Linien
    for (let i = 0; i < data.schnittliste.length; i++) {
        const platte = data.schnittliste[i];
        const plattenStart = parseFloat(platte.positionVonLinks);
        const plattenBreite = parseFloat(platte.plattenbreite);
        const plattenMitte = plattenStart + (plattenBreite / 2);
        const plattenX = margin + plattenStart * scaleX;
        const plattenMitteX = margin + plattenMitte * scaleX;
        
        svg += '<line x1="' + plattenX + '" y1="' + margin + '" x2="' + plattenX + '" y2="' + (margin + hoehe * scaleY) + '" stroke="#666" stroke-width="1.5" opacity="0.8"/>';
        svg += '<text x="' + plattenMitteX + '" y="' + (margin + hoehe * scaleY + 20) + '" text-anchor="middle" font-size="12" fill="#333" font-weight="bold">' + platte.plattenNr + '</text>';
    }
    
    // Maßlinien
    svg += '<line x1="' + margin + '" y1="' + (margin + hoehe * scaleY + 40) + '" x2="' + (margin + breite * scaleX) + '" y2="' + (margin + hoehe * scaleY + 40) + '" stroke="#666" stroke-width="1"/>';
    svg += '<text x="' + (margin + (breite * scaleX)/2) + '" y="' + (margin + hoehe * scaleY + 55) + '" text-anchor="middle" font-size="14" fill="#333" font-weight="bold">Breite: ' + breite + 'm</text>';
    
    svg += '<line x1="' + (margin - 15) + '" y1="' + margin + '" x2="' + (margin - 15) + '" y2="' + (margin + hoehe * scaleY) + '" stroke="#666" stroke-width="1"/>';
    svg += '<text x="' + (margin - 25) + '" y="' + (margin + (hoehe * scaleY)/2) + '" text-anchor="middle" font-size="14" fill="#333" font-weight="bold" transform="rotate(-90 ' + (margin - 25) + ' ' + (margin + (hoehe * scaleY)/2) + ')">Höhe: ' + hoehe + 'm</text>';
    
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

// Anreissmaße berechnen
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

        case 'dreieck-auf-rechteck':
            const drBasisBreite = parseFloat(data.basisBreite);
            const drDreieckHoehe = parseFloat(data.dreieckHoehe);
            const drRechteckHoehe = parseFloat(data.rechteckHoehe);
            const drSpitzenPos = parseFloat(data.spitzenPosition) || drBasisBreite / 2;

            const hoeheStartDR = berechneHoeheAnPositionDreieckRechteck(plattenStart, drBasisBreite, drDreieckHoehe, drRechteckHoehe, drSpitzenPos);
            const hoeheEndeDR = berechneHoeheAnPositionDreieckRechteck(plattenEnde, drBasisBreite, drDreieckHoehe, drRechteckHoehe, drSpitzenPos);

            anreissLinks = Math.round(hoeheStartDR * 100);
            anreissRechts = Math.round(hoeheEndeDR * 100);
            break;

        case 'rechteck':
            // Bei Rechtecken gibt es keine Anreissmaße - alle Platten haben die volle Höhe
            const rechteckHoehe = parseFloat(data.hoehe);
            anreissLinks = Math.round(rechteckHoehe * 100);
            anreissRechts = Math.round(rechteckHoehe * 100);
            break;
    }
    
    return { links: anreissLinks, rechts: anreissRechts };
}

// Höhenberechnungen für verschiedene Formen
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

function berechneHoeheAnPositionDreieckRechteck(position, basisBreite, dreieckHoehe, rechteckHoehe, spitzenPosition) {
    if (position <= 0 || position >= basisBreite) return rechteckHoehe;
    let dreieckAnteil;
    if (position <= spitzenPosition) {
        dreieckAnteil = dreieckHoehe * (position / spitzenPosition);
    } else {
        dreieckAnteil = dreieckHoehe * (basisBreite - position) / (basisBreite - spitzenPosition);
    }
    return rechteckHoehe + dreieckAnteil;
}

// Plattendiagramm generieren
function generatePlateDiagram(item, anreissMasse, type, data) {
    const plattenStart = parseFloat(item.positionVonLinks);
    const plattenBreite = parseFloat(item.plattenbreite);
    const benoetigteLaengeM = parseFloat(item.benoetigteLaenge);
    
    // Alle Variablen initialisieren
    let basisBreite = 0;
    let spitzenPosition = 0;
    let istSpitzenPlatte = false;
    let istTrapezEckenPlatte = false;
    let linkeEcke = 0;
    let rechteEcke = 0;
    
    // Bestimme Parameter basierend auf Dachtyp
    switch(type) {
        case 'gleichschenkliges-dreieck':
        case 'ungleichschenkliges-dreieck':
            basisBreite = parseFloat(data.basisBreite);
            spitzenPosition = type === 'gleichschenkliges-dreieck' ? basisBreite / 2 : parseFloat(data.spitzenPosition);
            istSpitzenPlatte = plattenStart < spitzenPosition && (plattenStart + plattenBreite) > spitzenPosition;
            istTrapezEckenPlatte = false;
            break;
        case 'trapez':
            basisBreite = parseFloat(data.untereBreite);
            const obereBreiteTrapez = parseFloat(data.obereBreite);
            const seitenAbstandTrapez = (basisBreite - obereBreiteTrapez) / 2;
            linkeEcke = seitenAbstandTrapez;
            rechteEcke = basisBreite - seitenAbstandTrapez;
            
            const plattenEndeTrapez = plattenStart + plattenBreite;
            istTrapezEckenPlatte = (plattenStart < linkeEcke && plattenEndeTrapez > linkeEcke) || 
                                 (plattenStart < rechteEcke && plattenEndeTrapez > rechteEcke);
            istSpitzenPlatte = false;
            break;
        case 'trapez-auf-rechteck':
            basisBreite = parseFloat(data.untereBreite);
            const obereBreiteCombo = parseFloat(data.obereBreite);
            const seitenAbstandCombo = (basisBreite - obereBreiteCombo) / 2;
            linkeEcke = seitenAbstandCombo;
            rechteEcke = basisBreite - seitenAbstandCombo;

            const plattenEndeCombo = plattenStart + plattenBreite;
            istTrapezEckenPlatte = (plattenStart < linkeEcke && plattenEndeCombo > linkeEcke) ||
                                 (plattenStart < rechteEcke && plattenEndeCombo > rechteEcke);
            istSpitzenPlatte = false;
            break;
        case 'dreieck-auf-rechteck':
            basisBreite = parseFloat(data.basisBreite);
            spitzenPosition = parseFloat(data.spitzenPosition) || basisBreite / 2;
            istSpitzenPlatte = plattenStart < spitzenPosition && (plattenStart + plattenBreite) > spitzenPosition;
            istTrapezEckenPlatte = false;
            break;
        case 'rechteck':
            basisBreite = parseFloat(data.breite);
            istSpitzenPlatte = false;
            istTrapezEckenPlatte = false;
            break;
        default:
            basisBreite = 0;
            istSpitzenPlatte = false;
            istTrapezEckenPlatte = false;
            break;
    }
    
    const originalPlattenEnde = plattenStart + plattenBreite;
    const istLetztePlatte = originalPlattenEnde > basisBreite;
    const plattenEndeReal = istLetztePlatte ? basisBreite : (plattenStart + plattenBreite);
    
    // SVG Dimensionen
    const plattenX = 20;
    const plattenY = 60;
    const plattenWidth = 360;
    const plattenHeight = 160;
    
    // Berechne tatsächliche genutzte Plattenbreite für Darstellung
    const dargestellteBreite = plattenEndeReal - plattenStart;
    const endX = (dargestellteBreite / plattenBreite) * plattenWidth;
    
    // Bei Rechtecken: keine Anrisse, nur volle Plattenhöhe
    let svg = '<svg width="100%" height="100%" viewBox="0 0 400 280" style="position: absolute; top: 0; left: 0;">';
    
    if (type === 'rechteck') {
        // Rechteck-Platten: Einfache Darstellung ohne Anrisse
        svg += '<rect x="' + plattenX + '" y="' + plattenY + '" width="' + plattenWidth + '" height="' + plattenHeight + '" fill="#e9ecef" stroke="#999" stroke-width="2" rx="4"/>';
        svg += '<rect x="' + plattenX + '" y="' + plattenY + '" width="' + endX + '" height="' + plattenHeight + '" fill="#4a90e2" stroke="#666" stroke-width="2" rx="4" opacity="0.8"/>';
        
        // Beschriftung
        svg += '<text x="' + (plattenX + endX/2) + '" y="' + (plattenY + plattenHeight/2) + '" text-anchor="middle" fill="white" font-weight="bold" font-size="20">Vollständige Platte</text>';
        svg += '<text x="' + (plattenX + endX/2) + '" y="' + (plattenY + plattenHeight + 20) + '" text-anchor="middle" fill="#333" font-weight="bold" font-size="16">Keine Anrisse nötig</text>';
        
        // Bei letzter Platte: Überhang anzeigen
        if (istLetztePlatte) {
            const ueberhang = originalPlattenEnde - basisBreite;
            svg += '<line x1="' + (plattenX + endX) + '" y1="' + (plattenY - 5) + '" x2="' + (plattenX + endX) + '" y2="' + (plattenY + plattenHeight + 5) + '" stroke="#28a745" stroke-width="3"/>';
            svg += '<text x="' + (plattenX + endX + 8) + '" y="' + (plattenY - 8) + '" font-size="12" fill="#28a745" font-weight="bold">ENDE</text>';
            
            if (ueberhang > 0) {
                const abstandsLinieY = plattenY - 30;
                svg += '<line x1="' + (plattenX + endX) + '" y1="' + abstandsLinieY + '" x2="' + (plattenX + plattenWidth) + '" y2="' + abstandsLinieY + '" stroke="#dc3545" stroke-width="2" stroke-dasharray="3,2"/>';
                svg += '<text x="' + (plattenX + endX + (plattenWidth - endX)/2) + '" y="' + (abstandsLinieY - 5) + '" text-anchor="middle" font-size="11" fill="#dc3545" font-weight="bold">' + (ueberhang * 100).toFixed(0) + 'cm abschneiden</text>';
            }
        }
        
        svg += '</svg>';
        return svg;
    }
    
    // Rest der Funktion für andere Dachformen
    const anrissHoeheLinks = (anreissMasse.links / 100 / benoetigteLaengeM) * plattenHeight;
    const anrissHoeheRechts = (anreissMasse.rechts / 100 / benoetigteLaengeM) * plattenHeight;
    
    const nutzenStartY = plattenY + plattenHeight - anrissHoeheLinks;
    const nutzenEndY = plattenY + plattenHeight - anrissHoeheRechts;
    
    let besondereX = 0;
    let hatBesondere = false;
    let besondereBezeichnung = '';
    
    if (istSpitzenPlatte) {
        const spitzeVonLinks = spitzenPosition - plattenStart;
        besondereX = plattenX + (spitzeVonLinks / plattenBreite) * plattenWidth;
        hatBesondere = true;
        besondereBezeichnung = 'SPITZE';
    } else if (istTrapezEckenPlatte) {
        // Bestimme welche Ecke in der Platte ist
        const plattenEnde = plattenStart + plattenBreite;
        
        if (plattenStart < linkeEcke && plattenEnde > linkeEcke) {
            // Linke Ecke
            const eckeVonLinks = linkeEcke - plattenStart;
            besondereX = plattenX + (eckeVonLinks / plattenBreite) * plattenWidth;
            hatBesondere = true;
            besondereBezeichnung = 'ECKE L';
        } else if (plattenStart < rechteEcke && plattenEnde > rechteEcke) {
            // Rechte Ecke
            const eckeVonLinks = rechteEcke - plattenStart;
            besondereX = plattenX + (eckeVonLinks / plattenBreite) * plattenWidth;
            hatBesondere = true;
            besondereBezeichnung = 'ECKE R';
        }
    }
    
    // Plattenhintergrund (vollständige Platte)
    svg += '<rect x="' + plattenX + '" y="' + plattenY + '" width="' + plattenWidth + '" height="' + plattenHeight + '" fill="#e9ecef" stroke="#999" stroke-width="2" rx="4"/>';
    
    // Tatsächlich genutzte Plattenbreite
    svg += '<rect x="' + plattenX + '" y="' + plattenY + '" width="' + endX + '" height="' + plattenHeight + '" fill="#ddd" stroke="#666" stroke-width="2" rx="4"/>';
    
    // Nutzenbereich (blau)
    if (hatBesondere) {
        svg += '<polygon points="' + plattenX + ',' + (plattenY + plattenHeight) + ' ' + (plattenX + endX) + ',' + (plattenY + plattenHeight) + ' ' + (plattenX + endX) + ',' + nutzenEndY + ' ' + besondereX + ',' + plattenY + ' ' + plattenX + ',' + nutzenStartY + '" fill="#4a90e2" opacity="0.8"/>';
    } else {
        svg += '<polygon points="' + plattenX + ',' + (plattenY + plattenHeight) + ' ' + (plattenX + endX) + ',' + (plattenY + plattenHeight) + ' ' + (plattenX + endX) + ',' + nutzenEndY + ' ' + plattenX + ',' + nutzenStartY + '" fill="#4a90e2" opacity="0.8"/>';
    }
    
    // Verschnittbereich (rot)
    if (hatBesondere) {
        svg += '<polygon points="' + plattenX + ',' + nutzenStartY + ' ' + besondereX + ',' + plattenY + ' ' + (plattenX + endX) + ',' + nutzenEndY + ' ' + (plattenX + endX) + ',' + plattenY + ' ' + plattenX + ',' + plattenY + '" fill="#e74c3c" opacity="0.8"/>';
    } else {
        svg += '<polygon points="' + plattenX + ',' + nutzenStartY + ' ' + (plattenX + endX) + ',' + nutzenEndY + ' ' + (plattenX + endX) + ',' + plattenY + ' ' + plattenX + ',' + plattenY + '" fill="#e74c3c" opacity="0.8"/>';
    }
    
    // Schnittlinie (schwarz)
    if (hatBesondere) {
        svg += '<line x1="' + plattenX + '" y1="' + nutzenStartY + '" x2="' + besondereX + '" y2="' + plattenY + '" stroke="#000" stroke-width="3"/>';
        svg += '<line x1="' + besondereX + '" y1="' + plattenY + '" x2="' + (plattenX + endX) + '" y2="' + nutzenEndY + '" stroke="#000" stroke-width="3"/>';
    } else {
        svg += '<line x1="' + plattenX + '" y1="' + nutzenStartY + '" x2="' + (plattenX + endX) + '" y2="' + nutzenEndY + '" stroke="#000" stroke-width="3"/>';
    }
    
    // Anrisslinien (rot)
    svg += '<line x1="' + plattenX + '" y1="' + (plattenY + plattenHeight) + '" x2="' + plattenX + '" y2="' + nutzenStartY + '" stroke="#dc3545" stroke-width="4"/>';
    svg += '<line x1="' + (plattenX + endX) + '" y1="' + (plattenY + plattenHeight) + '" x2="' + (plattenX + endX) + '" y2="' + nutzenEndY + '" stroke="#dc3545" stroke-width="4"/>';
    
    // Anreissmaße
    if (anreissMasse.links === 0) {
        svg += '<text x="10" y="' + (plattenY + plattenHeight + 10) + '" text-anchor="middle" font-size="14" fill="#dc3545" font-weight="bold" transform="rotate(-90 10 ' + (plattenY + plattenHeight + 10) + ')">' + anreissMasse.links + 'cm</text>';
    } else {
        svg += '<text x="10" y="' + (nutzenStartY + (plattenHeight - anrissHoeheLinks)/2) + '" text-anchor="middle" font-size="14" fill="#dc3545" font-weight="bold" transform="rotate(-90 10 ' + (nutzenStartY + (plattenHeight - anrissHoeheLinks)/2) + ')">' + anreissMasse.links + 'cm</text>';
    }
    
    if (anreissMasse.rechts === 0) {
        if (istLetztePlatte) {
            svg += '<text x="' + (plattenX + endX) + '" y="' + (plattenY + plattenHeight + 15) + '" text-anchor="middle" font-size="14" fill="#dc3545" font-weight="bold">' + anreissMasse.rechts + 'cm</text>';
        } else {
            svg += '<text x="' + (plattenX + endX + 20) + '" y="' + (plattenY + plattenHeight + 10) + '" text-anchor="middle" font-size="14" fill="#dc3545" font-weight="bold" transform="rotate(-90 ' + (plattenX + endX + 20) + ' ' + (plattenY + plattenHeight + 10) + ')">' + anreissMasse.rechts + 'cm</text>';
        }
    } else {
        svg += '<text x="' + (plattenX + endX + 20) + '" y="' + (nutzenEndY + (plattenHeight - anrissHoeheRechts)/2) + '" text-anchor="middle" font-size="14" fill="#dc3545" font-weight="bold" transform="rotate(-90 ' + (plattenX + endX + 20) + ' ' + (nutzenEndY + (plattenHeight - anrissHoeheRechts)/2) + ')">' + anreissMasse.rechts + 'cm</text>';
    }
    
    // Beschriftung "Nutzen" unter der Platte
    svg += '<text x="' + (plattenX + endX/2) + '" y="' + (plattenY + plattenHeight + 50) + '" text-anchor="middle" fill="#333" font-weight="bold" font-size="16">Nutzen</text>';
    
    // "Abschnitt" Beschriftungen über der Platte
    if (hatBesondere) {
        const linkerAbschnittX = plattenX + (besondereX - plattenX) / 2;
        const rechterAbschnittX = besondereX + (plattenX + endX - besondereX) / 2;
        
        if (type === 'trapez' || type === 'trapez-auf-rechteck') {
            // Bei Trapez-Eckplatten: Nur "Abschnitt" wo Verschnitt ist
            const obereBreite = parseFloat(data.obereBreite);
            const untereBreite = parseFloat(data.untereBreite);
            const seitenAbstand = (untereBreite - obereBreite) / 2;
            
            // Links von der Ecke: nur wenn Platte im schrägen Bereich startet
            if (besondereX - plattenX > 40 && plattenStart < seitenAbstand) {
                svg += '<text x="' + linkerAbschnittX + '" y="' + (plattenY - 15) + '" text-anchor="middle" fill="#333" font-weight="bold" font-size="14">Abschnitt</text>';
            }
            // Rechts von der Ecke: nur wenn Platte im schrägen Bereich endet
            const plattenEnde = plattenStart + plattenBreite;
            if (plattenX + endX - besondereX > 40 && plattenEnde > (untereBreite - seitenAbstand)) {
                svg += '<text x="' + rechterAbschnittX + '" y="' + (plattenY - 15) + '" text-anchor="middle" fill="#333" font-weight="bold" font-size="14">Abschnitt</text>';
            }
        } else {
            // Bei Dreiecken: links und rechts der Spitze
            if (besondereX - plattenX > 40) {
                svg += '<text x="' + linkerAbschnittX + '" y="' + (plattenY - 15) + '" text-anchor="middle" fill="#333" font-weight="bold" font-size="14">Abschnitt</text>';
            }
            if (plattenX + endX - besondereX > 40) {
                svg += '<text x="' + rechterAbschnittX + '" y="' + (plattenY - 15) + '" text-anchor="middle" fill="#333" font-weight="bold" font-size="14">Abschnitt</text>';
            }
        }
    } else if (type === 'trapez' || type === 'trapez-auf-rechteck') {
        // Bei Trapez-Formen: Nur "Abschnitt" wenn die Platte in den schrägen Bereichen liegt
        const obereBreite = parseFloat(data.obereBreite);
        const untereBreite = parseFloat(data.untereBreite);
        const seitenAbstand = (untereBreite - obereBreite) / 2;
        
        const plattenEnde = plattenStart + plattenBreite;
        const istImSchragenBereich = plattenStart < seitenAbstand || plattenEnde > (untereBreite - seitenAbstand);
        
        if (istImSchragenBereich) {
            svg += '<text x="' + (plattenX + endX/2) + '" y="' + (plattenY - 15) + '" text-anchor="middle" fill="#333" font-weight="bold" font-size="14">Abschnitt</text>';
        }
    } else {
        // Bei Dreiecken: Immer "Abschnitt"
        svg += '<text x="' + (plattenX + endX/2) + '" y="' + (plattenY - 15) + '" text-anchor="middle" fill="#333" font-weight="bold" font-size="14">Abschnitt</text>';
    }
    
    // Bei letzter Platte: Grüne Linie für Überhang-Abschnitt
    if (istLetztePlatte) {
        const ueberhang = originalPlattenEnde - basisBreite;
        
        svg += '<line x1="' + (plattenX + endX) + '" y1="' + (plattenY - 5) + '" x2="' + (plattenX + endX) + '" y2="' + (plattenY + plattenHeight + 5) + '" stroke="#28a745" stroke-width="3"/>';
        svg += '<text x="' + (plattenX + endX + 8) + '" y="' + (plattenY - 8) + '" font-size="12" fill="#28a745" font-weight="bold">ENDE</text>';
        
        if (ueberhang > 0) {
            const abstandsLinieY = plattenY - 30;
            svg += '<line x1="' + (plattenX + endX) + '" y1="' + abstandsLinieY + '" x2="' + (plattenX + plattenWidth) + '" y2="' + abstandsLinieY + '" stroke="#dc3545" stroke-width="2" stroke-dasharray="3,2"/>';
            svg += '<text x="' + (plattenX + endX + (plattenWidth - endX)/2) + '" y="' + (abstandsLinieY - 5) + '" text-anchor="middle" font-size="11" fill="#dc3545" font-weight="bold">' + (ueberhang * 100).toFixed(0) + 'cm</text>';
        }
    }
    
    // Bei besonderen Punkten: Gelbe gestrichelte Maßlinie und Markierung
    if (hatBesondere) {
        const besondereVonLinks = istSpitzenPlatte ? (spitzenPosition - plattenStart) : 
                                 (besondereBezeichnung === 'ECKE L' ? (linkeEcke - plattenStart) : (rechteEcke - plattenStart));
        const massLinieY = plattenY + plattenHeight/2;
        
        svg += '<line x1="' + plattenX + '" y1="' + massLinieY + '" x2="' + besondereX + '" y2="' + massLinieY + '" stroke="#ffc107" stroke-width="2" stroke-dasharray="5,3"/>';
        svg += '<text x="' + (plattenX + (besondereX - plattenX)/2) + '" y="' + (massLinieY - 8) + '" text-anchor="middle" font-size="12" fill="#ffc107" font-weight="bold">' + besondereVonLinks.toFixed(2) + 'm</text>';
        
        if (istSpitzenPlatte) {
            svg += '<line x1="' + besondereX + '" y1="' + plattenY + '" x2="' + besondereX + '" y2="' + (plattenY + plattenHeight) + '" stroke="#ffc107" stroke-width="3"/>';
        } else {
            svg += '<circle cx="' + besondereX + '" cy="' + plattenY + '" r="4" fill="#ffc107"/>';
            svg += '<line x1="' + besondereX + '" y1="' + plattenY + '" x2="' + besondereX + '" y2="' + (plattenY + plattenHeight) + '" stroke="#ffc107" stroke-width="3"/>';
        }
        svg += '<text x="' + besondereX + '" y="' + (plattenY - 25) + '" text-anchor="middle" font-size="12" fill="#ffc107" font-weight="bold">' + besondereBezeichnung + '</text>';
    }
    
    svg += '</svg>';
    return svg;
}

// Anweisungen generieren
function generateInstructions(item, anreissMasse, type, data) {
    const plattenStart = parseFloat(item.positionVonLinks);
    const plattenBreite = parseFloat(item.plattenbreite);
    
    // Bei Rechtecken: Spezielle Anweisungen
    if (type === 'rechteck') {
        const rechteckBreite = parseFloat(data.breite);
        const originalPlattenEnde = plattenStart + plattenBreite;
        const istLetztePlatte = originalPlattenEnde > rechteckBreite;
        
        let instructions = '<strong>Anzeichnen:</strong><br>';
        
        if (istLetztePlatte) {
            const ueberhang = originalPlattenEnde - rechteckBreite;
            if (ueberhang > 0) {
                instructions += '• <strong style="color: #dc3545;">Rechts ' + (ueberhang * 100).toFixed(0) + 'cm abschneiden!</strong><br>';
            }
        }
        
        instructions += '• <strong style="color: #198754;">Keine Anrisse nötig - Platte vollständig verwenden</strong><br>';
        instructions += '• Platte einfach in benötigter Länge (' + item.benoetigteLaenge + 'm) zuschneiden<br>';
        
        return instructions;
    }
    
    // Für andere Dachformen: Original-Logik
    let instructions = '<strong>Anzeichnen:</strong><br>';
    
    let basisBreite = 0;
    switch(type) {
        case 'gleichschenkliges-dreieck':
        case 'ungleichschenkliges-dreieck':
        case 'dreieck-auf-rechteck':
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
    html += '<div style="display: flex; gap: 20px; position: relative; z-index: 10;">';
    html += '<div style="flex: 0 0 350px; position: relative; z-index: 10;">';
    html += '<h3>Platte ' + item.plattenNr + ' (Position: ' + item.positionVonLinks + 'm - ' + item.positionBis + 'm)</h3>';
    
    html += '<div style="margin: 15px 0; padding: 10px; background: #f0f8ff; border-radius: 6px; position: relative; z-index: 10;">';
    if (type === 'rechteck') {
        html += '<div><strong>Benötigte Länge:</strong> ' + item.benoetigteLaenge + 'm</div>';
        html += '<div><strong>Plattenbreite:</strong> ' + item.plattenbreite + 'm</div>';
    } else {
        html += '<div><strong>Links:</strong> ' + anreissMasse.links + 'cm</div>';
        html += '<div><strong>Rechts:</strong> ' + anreissMasse.rechts + 'cm</div>';
        html += '<div><strong>Benötigte Länge:</strong> ' + item.benoetigteLaenge + 'm</div>';
    }
    html += '</div>';
    
    html += '<div style="background: #f8f9fa; border-left: 4px solid #ffc107; padding: 12px; border-radius: 6px; font-size: 13px; line-height: 1.4; position: relative; z-index: 10;">';
    html += generateInstructions(item, anreissMasse, type, data);
    html += '</div>';
    
    html += '</div>';
    html += '<div style="flex: 1; position: relative; height: 280px; background: #f8f9fa; border-radius: 8px; border: 1px solid #ddd; overflow: hidden; z-index: 10;">';
    html += generatePlateDiagram(item, anreissMasse, type, data);
    html += '</div>';
    html += '</div>';
    
    // BRANDING-STELLE 2: Unter jeder Platte
    html += '<div style="text-align: center; margin-top: 15px; padding-top: 10px; border-top: 1px solid #e0e0e0; font-size: 11px; color: #999;">erstellt mit <strong style="color: #1e3c72;">Dachplattenrechner.de</strong></div>';
    
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

        // NEUES FORMAT: Einfache Parameter (breite, hoehe, typ, ...)
        if (params.breite > 0 && params.hoehe > 0 && params.typ) {
            console.log('Neues Parameter-Format erkannt');

            const dachtyp = params.typ;
            planType = dachtyp;

            // schnittliste aus einfachen Parametern generieren
            planData = generateSchnittlisteFromParams(
                params.breite,
                params.hoehe,
                dachtyp,
                {
                    breiteOben: params.breiteOben,
                    spitzenPosition: params.spitzenPosition,
                    rechteckHoehe: params.rechteckHoehe,
                    dreieckHoehe: params.dreieckHoehe,
                    dreieckTyp: params.dreieckTyp,
                    lieferbreite: params.lieferbreite,
                    deckbreite: params.deckbreite
                }
            );

            console.log('Schnittliste generiert:', planData);
        }
        // ALTES FORMAT: Backward-Kompatibilität (type, data)
        else if (params.type && params.data) {
            console.log('Altes Parameter-Format erkannt (Backward-Kompatibilität)');

            planType = params.type;
            planData = decodeData(params.data);
            console.log('Dekodierte Daten:', planData);

            if (!planData) {
                console.log('Daten konnten nicht dekodiert werden');
                document.getElementById('plan-title').textContent = 'Fehler: Daten beschädigt';
                document.getElementById('plan-info').innerHTML = '<strong style="color: #dc3545;">Fehler:</strong> Die übertragenen Daten sind beschädigt. Bitte kehren Sie zum Rechner zurück.';
                return;
            }
        }
        // FEHLER: Keine Parameter gefunden
        else {
            console.log('Keine Parameter gefunden');
            document.getElementById('plan-title').textContent = 'Fehler: Keine Daten übertragen';
            document.getElementById('plan-info').innerHTML = '<strong style="color: #dc3545;">Fehler:</strong> Keine gültigen Daten gefunden. Bitte kehren Sie zum Rechner zurück.';
            return;
        }

        console.log('Starte Header-Update');
        updateHeader(planType, planData);

        console.log('Starte Übersicht-Generierung');
        generateOverview(planType, planData);

        console.log('Starte Platten-Generierung');
        generateAllPlates(planType, planData);

        console.log('Anrissplan erfolgreich geladen');

        // Navigation-Links aktualisieren
        updateNavigationLinks(params);

    } catch (error) {
        console.error('Fehler in init():', error);
        document.getElementById('plan-title').textContent = 'JavaScript-Fehler aufgetreten';
        document.getElementById('plan-info').innerHTML = '<strong style="color: #dc3545;">Fehler:</strong> ' + error.message;
    }
}

// Navigation-Links zu anderen Rechnern
function updateNavigationLinks(params) {
    if (!params.breite || !params.hoehe) return;

    const breite = parseFloat(params.breite);
    const hoehe = parseFloat(params.hoehe);

    // Typ: neue oder alte Parameter verwenden
    let typ = params.typ || params.type;

    // Zusätzliche Parameter (neue und alte Namen unterstützen)
    const spitzenPosition = params.spitzenPosition;
    const breiteOben = params.breiteOben || params['breite-oben'];
    const rechteckHoehe = params.rechteckHoehe || params['rechteck-hoehe'];
    const dreieckHoehe = params.dreieckHoehe || params['trapez-hoehe'];

    // Lattenrechner Link (mit allen Parametern)
    let lattenUrl = `/tools/lattenrechner/?breite=${breite}&hoehe=${hoehe}&typ=${typ}`;
    if (spitzenPosition) lattenUrl += `&spitzenPosition=${spitzenPosition}`;
    if (breiteOben) lattenUrl += `&breiteOben=${breiteOben}`;
    if (rechteckHoehe) lattenUrl += `&rechteckHoehe=${rechteckHoehe}`;
    if (dreieckHoehe) lattenUrl += `&dreieckHoehe=${dreieckHoehe}`;
    if (params.lieferbreite) lattenUrl += `&lieferbreite=${params.lieferbreite}`;
    if (params.deckbreite) lattenUrl += `&deckbreite=${params.deckbreite}`;

    // PV-Rechner Link (mit allen Parametern)
    let pvUrl = `/tools/pv-rechner/?breite=${breite}&hoehe=${hoehe}&typ=${typ}`;
    if (spitzenPosition) pvUrl += `&spitzenPosition=${spitzenPosition}`;
    if (breiteOben) pvUrl += `&breiteOben=${breiteOben}`;
    if (rechteckHoehe) pvUrl += `&rechteckHoehe=${rechteckHoehe}`;
    if (dreieckHoehe) pvUrl += `&dreieckHoehe=${dreieckHoehe}`;
    if (params.lieferbreite) pvUrl += `&lieferbreite=${params.lieferbreite}`;
    if (params.deckbreite) pvUrl += `&deckbreite=${params.deckbreite}`;

    // Links anzeigen
    const lattenLink = document.getElementById('to-lattenrechner');
    const pvLink = document.getElementById('to-pv-rechner');

    if (lattenLink) {
        lattenLink.href = lattenUrl;
        lattenLink.style.display = 'inline-flex';
    }
    if (pvLink) {
        pvLink.href = pvUrl;
        pvLink.style.display = 'inline-flex';
    }
}
