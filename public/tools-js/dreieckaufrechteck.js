let aktuelleSchnittliste = [];
let verlegerichtung = 'links';

function setVerlegerichtung(richtung) {
    verlegerichtung = richtung;
    if (aktuelleSchnittliste.length > 0) {
        berechnen();
    }
}

// Cookie Management System
function showAds() {
    document.getElementById('top-ad-container').style.display = 'block';
    document.getElementById('middle-ad-container').style.display = 'block';
    document.getElementById('bottom-ad-container').style.display = 'block';

    const allowPersonalized = localStorage.getItem('marketingCookies') === 'true';

    // Warte bis AdSense geladen ist
    setTimeout(function() {
        if (window.adsbygoogle) {
            try {
                const ads = document.querySelectorAll('.adsbygoogle');
                ads.forEach(ad => {
                    // Prüfe ob Ad bereits geladen ist
                    if (!ad.getAttribute('data-ad-status') && !ad.hasAttribute('data-adsbygoogle-status')) {
                        if (!allowPersonalized) {
                            ad.setAttribute('data-npa', '1');
                        }
                        (window.adsbygoogle = window.adsbygoogle || []).push({});
                    }
                });
            } catch (e) {
                console.log('AdSense loading error:', e);
            }
        }
    }, 1000);
}

function berechneDreieckAufRechteck(breite, dreieckHoehe, rechteckHoehe, dreieckTyp, spitzenPosition, deckbreite) {
    const schnittliste = [];
    const lieferbreite = parseFloat(document.getElementById('lieferbreite').value);
    const gesamtHoehe = dreieckHoehe + rechteckHoehe;

    // Bestimme Spitzenpunkt basierend auf Dreieckstyp
    let spitzePosX;
    if (dreieckTyp === 'gleichschenkliges') {
        spitzePosX = breite / 2; // Spitze zentriert
    } else {
        // Ungleichschenkliges Dreieck: Spitzenpunkt in Metern von links
        spitzePosX = spitzenPosition;
    }

    let anzahlPlatten = Math.ceil((breite - lieferbreite + deckbreite) / deckbreite);

    for (let i = 0; i < anzahlPlatten; i++) {
        let positionVonLinks, positionVonLinksEnde;

        if (verlegerichtung === 'links') {
            positionVonLinks = (i === 0) ? 0 : i * deckbreite;
            positionVonLinksEnde = positionVonLinks + lieferbreite;
            positionVonLinksEnde = Math.min(positionVonLinksEnde, breite);
        } else {
            let positionVonRechts = (i === 0) ? 0 : i * deckbreite;
            positionVonLinks = breite - positionVonRechts - lieferbreite;
            positionVonLinks = Math.max(0, positionVonLinks);
            positionVonLinksEnde = positionVonLinks + lieferbreite;
        }

        // Höhe berechnen - Kombination aus Dreieck und Rechteck
        function hoeheAnPosition(pos) {
            // Im Rechteck-Bereich: volle Höhe
            // Im Dreieck-Bereich: linear vom Übergang zur Spitze

            // Berechne die Höhe auf Basis der Position relativ zur Spitze
            if (dreieckTyp === 'gleichschenkliges') {
                // Symmetrisches Dreieck
                if (pos <= breite / 2) {
                    // Linke Seite
                    const abstand = Math.abs(pos - breite / 2);
                    const prozent = abstand / (breite / 2);
                    const dreieckHoeheAnPos = dreieckHoehe * (1 - prozent);
                    return rechteckHoehe + dreieckHoeheAnPos;
                } else {
                    // Rechte Seite
                    const abstand = Math.abs(pos - breite / 2);
                    const prozent = abstand / (breite / 2);
                    const dreieckHoeheAnPos = dreieckHoehe * (1 - prozent);
                    return rechteckHoehe + dreieckHoeheAnPos;
                }
            } else {
                // Asymmetrisches Dreieck
                if (pos <= spitzePosX) {
                    // Linke Seite zur Spitze
                    const prozent = (pos) / spitzePosX;
                    const dreieckHoeheAnPos = dreieckHoehe * prozent;
                    return rechteckHoehe + dreieckHoeheAnPos;
                } else {
                    // Rechte Seite von Spitze
                    const abstand = breite - pos;
                    const prozent = abstand / (breite - spitzePosX);
                    const dreieckHoeheAnPos = dreieckHoehe * prozent;
                    return rechteckHoehe + dreieckHoeheAnPos;
                }
            }
        }

        const hoeheStart = hoeheAnPosition(positionVonLinks);
        const hoeheEnde = hoeheAnPosition(positionVonLinksEnde);
        let benoetigteLaenge = Math.max(hoeheStart, hoeheEnde);

        // Wenn die Spitze innerhalb der Platte liegt, berücksichtige die volle Höhe dort
        if (spitzePosX >= positionVonLinks && spitzePosX <= positionVonLinksEnde) {
            const hoeheBeiSpitze = hoeheAnPosition(spitzePosX);
            benoetigteLaenge = Math.max(benoetigteLaenge, hoeheBeiSpitze);
        }

        if (benoetigteLaenge > 0 && positionVonLinks < breite && positionVonLinks >= 0) {
            schnittliste.push({
                plattenNr: i + 1,
                positionVonLinks: positionVonLinks.toFixed(2),
                positionBis: positionVonLinksEnde.toFixed(2),
                benoetigteLaenge: benoetigteLaenge.toFixed(2),
                plattenbreite: lieferbreite.toFixed(2)
            });
        }
    }

    return {
        schnittliste: schnittliste,
        anzahlPlatten: schnittliste.length
    };
}

function berechneSeitenlaengen(breite, dreieckHoehe, rechteckHoehe, dreieckTyp, spitzenPosition) {
    let linkeSeite, rechteSeite;

    if (dreieckTyp === 'gleichschenkliges') {
        // Symmetrisches Dreieck
        const halbeBreite = breite / 2;
        const linkeTriangelSeite = Math.sqrt(dreieckHoehe * dreieckHoehe + halbeBreite * halbeBreite);
        const linkeGesamtSeite = linkeTriangelSeite + rechteckHoehe;
        linkeSeite = linkeGesamtSeite;
        rechteSeite = linkeGesamtSeite; // Gleich bei symmetrischem Dreieck
    } else {
        // Asymmetrisches Dreieck
        const spitzePosX = spitzenPosition;
        const linkeBreite = spitzePosX;
        const rechteBreite = breite - spitzePosX;

        const linkeTriangelSeite = Math.sqrt(dreieckHoehe * dreieckHoehe + linkeBreite * linkeBreite);
        const rechteTriangelSeite = Math.sqrt(dreieckHoehe * dreieckHoehe + rechteBreite * rechteBreite);

        linkeSeite = linkeTriangelSeite + rechteckHoehe;
        rechteSeite = rechteTriangelSeite + rechteckHoehe;
    }

    return { linkeSeite, rechteSeite };
}

function berechnen() {
    const breite = parseFloat(document.getElementById('breite').value);
    const dreieckHoehe = parseFloat(document.getElementById('dreieck-hoehe').value);
    const rechteckHoehe = parseFloat(document.getElementById('rechteck-hoehe').value);
    const dreieckTyp = document.getElementById('dreieck-typ').value;
    const deckbreite = parseFloat(document.getElementById('deckbreite').value);
    const lieferbreite = parseFloat(document.getElementById('lieferbreite').value);

    if (!breite || !dreieckHoehe || !rechteckHoehe || !deckbreite || !lieferbreite) {
        alert('Bitte füllen Sie alle erforderlichen Felder aus!');
        return;
    }

    // Spitzenposition: wenn nicht eingegeben, auf Mitte setzen (für symmetrisches Dreieck)
    let spitzenPosition = parseFloat(document.getElementById('spitzen-position').value);
    if (!spitzenPosition || isNaN(spitzenPosition)) {
        spitzenPosition = breite / 2; // Default: Mitte
    }

    if (typeof gtag !== 'undefined') {
        gtag('event', 'calculation', {
            'event_category': 'dreieck_auf_rechteck',
            'event_label': 'form_submitted'
        });
    }

    const ueberlappung = lieferbreite - deckbreite;
    const berechnung = berechneDreieckAufRechteck(breite, dreieckHoehe, rechteckHoehe, dreieckTyp, spitzenPosition, deckbreite);
    const maxLaenge = Math.max(...berechnung.schnittliste.map(p => parseFloat(p.benoetigteLaenge)));
    const { linkeSeite, rechteSeite } = berechneSeitenlaengen(breite, dreieckHoehe, rechteckHoehe, dreieckTyp, spitzenPosition);
    const gesamtHoehe = dreieckHoehe + rechteckHoehe;

    document.getElementById('ueberlappung').textContent = ueberlappung.toFixed(2) + ' m';
    document.getElementById('gesamt-hoehe-result').textContent = gesamtHoehe.toFixed(2) + ' m';

    if (dreieckTyp === 'gleichschenkliges') {
        document.getElementById('seiten-result').textContent = 'Links/Rechts: ' + linkeSeite.toFixed(2) + 'm (symmetrisch)';
    } else {
        document.getElementById('seiten-result').textContent = 'Links: ' + linkeSeite.toFixed(2) + 'm | Rechts: ' + rechteSeite.toFixed(2) + 'm';
    }

    document.getElementById('benoetigte-plattenlaenge').textContent = maxLaenge.toFixed(2) + ' m';
    document.getElementById('anzahl-bleche-breite').textContent = berechnung.anzahlPlatten + ' Stück';
    document.getElementById('gesamt-bleche').textContent = berechnung.anzahlPlatten + ' Stück';

    const tbody = document.getElementById('schnitt-details');
    tbody.innerHTML = '';


    berechnung.schnittliste.forEach((platte) => {
        const zeile = `
            <tr>
                <td style="padding: 10px; text-align: center;">${platte.plattenNr}</td>
                <td style="padding: 10px; text-align: right;">${platte.positionVonLinks} m</td>
                <td style="padding: 10px; text-align: right;">${platte.plattenbreite} m</td>
                <td style="padding: 10px; text-align: right; font-weight: bold; color: #d32f2f;">${platte.benoetigteLaenge} m</td>
            </tr>
        `;
        tbody.innerHTML += zeile;
    });

    const verlegerichtungText = verlegerichtung === 'links' ? 'Von links nach rechts' : 'Von rechts nach links';
    document.getElementById('verlege-info').textContent = verlegerichtungText + ', Platten verlaufen vertikal über beide Bereiche (Rechteck + Dreieck)';

    aktuelleSchnittliste = berechnung.schnittliste;

    // Zeichne SVG-Vorschau mit Schnittliste
    zeichneDreieckAufRechteckVorschau(breite, dreieckHoehe, rechteckHoehe, dreieckTyp, spitzenPosition, berechnung.schnittliste);

    // Anzeige von Schnittliste und Vorschau
    document.getElementById('results').style.display = 'block';
    document.getElementById('schnittliste').style.display = 'block';
    document.getElementById('vorschau').style.display = 'block';

    showAds();
}

function zeichneDreieckAufRechteckVorschau(breite, dreieckHoehe, rechteckHoehe, dreieckTyp, spitzenPosition, schnittliste) {
    const container = document.getElementById('vorschau-svg');
    if (!container) return;

    const svgWidth = 500;
    const svgHeight = 320;
    const margin = 40;
    const dachWidth = svgWidth - 2 * margin;
    const dachHeight = svgHeight - 2 * margin - 40;

    const gesamtHoehe = dreieckHoehe + rechteckHoehe;
    const scaleX = dachWidth / breite;
    const scaleY = dachHeight / gesamtHoehe;

    let spitzePosX;
    if (dreieckTyp === 'gleichschenkliges') {
        spitzePosX = breite / 2;
    } else {
        spitzePosX = spitzenPosition;
    }

    // Hilfsfunktion: Höhe an Position berechnen
    function hoeheAnPosition(pos) {
        if (dreieckTyp === 'gleichschenkliges') {
            const abstand = Math.abs(pos - breite / 2);
            const prozent = abstand / (breite / 2);
            const dreieckHoeheAnPos = dreieckHoehe * (1 - prozent);
            return rechteckHoehe + dreieckHoeheAnPos;
        } else {
            if (pos <= spitzePosX) {
                const prozent = pos / spitzePosX;
                const dreieckHoeheAnPos = dreieckHoehe * prozent;
                return rechteckHoehe + dreieckHoeheAnPos;
            } else {
                const abstand = breite - pos;
                const prozent = abstand / (breite - spitzePosX);
                const dreieckHoeheAnPos = dreieckHoehe * prozent;
                return rechteckHoehe + dreieckHoeheAnPos;
            }
        }
    }

    let svg = `<svg width="${svgWidth}" height="${svgHeight}" viewBox="0 0 ${svgWidth} ${svgHeight}" style="border: 1px solid #ddd; border-radius: 8px;">`;

    svg += `<rect width="${svgWidth}" height="${svgHeight}" fill="#fdfdfd"/>`;

    // Umriss Rechteck + Dreieck (im Hintergrund)
    const rectBottomY = margin + dachHeight;
    const dreieckPeakX = margin + spitzePosX * scaleX;
    // Spitze ist oben: margin + (dachHeight - (rechteckHoehe + dreieckHoehe) * scaleY)
    const dreieckBaseY = margin + dachHeight - rechteckHoehe * scaleY; // Übergang Rechteck→Dreieck
    const dreieckPeakY = dreieckBaseY - dreieckHoehe * scaleY; // Spitze des Dreiecks

    // Rechteck-Umriss und Dreieck-Umriss werden NACH den Platten gezeichnet (z-order fix)
    // Speichere sie zur späteren Verwendung
    const rechteckUmriss = `<rect x="${margin}" y="${margin + dachHeight - rechteckHoehe * scaleY}" width="${dachWidth}" height="${rechteckHoehe * scaleY}" fill="none" stroke="#ff6b35" stroke-width="3"/>`;
    const dreieckUmriss = `<polygon points="${margin},${margin + dachHeight - rechteckHoehe * scaleY} ${dreieckPeakX},${dreieckPeakY} ${margin + dachWidth},${margin + dachHeight - rechteckHoehe * scaleY}" fill="none" stroke="#ff6b35" stroke-width="3"/>`;

    // PFEIL FÜR VERLEGERICHTUNG
    const pfeilY = margin - 20;
    if (verlegerichtung === 'links') {
        svg += `<line x1="${margin + 5}" y1="${pfeilY}" x2="${margin + dachWidth - 5}" y2="${pfeilY}" stroke="#ff6b35" stroke-width="2.5" marker-end="url(#arrow-right)"/>`;
        svg += `<text x="${margin + dachWidth/2}" y="${pfeilY - 6}" text-anchor="middle" font-size="12" font-weight="bold" fill="#ff6b35">Verlegerichtung →</text>`;
    } else {
        svg += `<line x1="${margin + dachWidth - 5}" y1="${pfeilY}" x2="${margin + 5}" y2="${pfeilY}" stroke="#ff6b35" stroke-width="2.5" marker-end="url(#arrow-left)"/>`;
        svg += `<text x="${margin + dachWidth/2}" y="${pfeilY - 6}" text-anchor="middle" font-size="12" font-weight="bold" fill="#ff6b35">← Verlegerichtung</text>`;
    }

    // MARKER DEFINITIONEN
    svg += `<defs>
        <marker id="arrow-right" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="8" markerHeight="8" orient="0">
            <path d="M 0 0 L 10 5 L 0 10 z" fill="#ff6b35"/>
        </marker>
        <marker id="arrow-left" viewBox="0 0 10 10" refX="1" refY="5" markerWidth="8" markerHeight="8" orient="180">
            <path d="M 0 0 L 10 5 L 0 10 z" fill="#ff6b35"/>
        </marker>
    </defs>`;

    // BLECHPLATTEN ZEICHNEN
    schnittliste.forEach((platte, index) => {
        const plattenStart = parseFloat(platte.positionVonLinks);
        const plattenEnde = parseFloat(platte.positionBis);
        const plattenBreite = parseFloat(platte.plattenbreite);
        const benoetigteLaenge = parseFloat(platte.benoetigteLaenge);

        const hoeheStart = hoeheAnPosition(plattenStart);
        const hoeheEnde = hoeheAnPosition(plattenEnde);
        let maxHoehe = Math.max(hoeheStart, hoeheEnde);

        // Wenn die Spitze innerhalb der Platte liegt, berücksichtige die Höhe dort
        if (spitzePosX >= plattenStart && spitzePosX <= plattenEnde) {
            const hoeheBeiSpitze = hoeheAnPosition(spitzePosX);
            maxHoehe = Math.max(maxHoehe, hoeheBeiSpitze);
        }

        const plattenX = margin + plattenStart * scaleX;
        const plattenWidth = (plattenEnde - plattenStart) * scaleX;

        const startY = margin + dachHeight - (hoeheStart * scaleY);
        const endY = margin + dachHeight - (hoeheEnde * scaleY);
        const plattenHoehe = benoetigteLaenge * scaleY;
        const plattenY = margin + dachHeight - plattenHoehe;

        // Platte mit Dreieck-Oberkante
        const oberkante = margin + dachHeight - (maxHoehe * scaleY);
        svg += `<rect x="${plattenX}" y="${oberkante}" width="${plattenWidth}" height="${plattenHoehe - (oberkante - plattenY)}" fill="#1e3c72" opacity="0.4"/>`;

        // Platte Nummer
        svg += `<text x="${plattenX + plattenWidth/2}" y="${margin + dachHeight + 18}" text-anchor="middle" font-size="11" font-weight="bold" fill="#333">${platte.plattenNr}</text>`;

        // Trennlinie zwischen Platten
        if (index > 0) {
            svg += `<line x1="${plattenX}" y1="${margin}" x2="${plattenX}" y2="${margin + dachHeight}" stroke="#666" stroke-width="1" opacity="0.5"/>`;
        }
    });

    // Umrisse NACH Platten zeichnen (z-order: oben!)
    svg += rechteckUmriss;
    svg += dreieckUmriss;

    // BEMASSUNG: Breite
    svg += `<line x1="${margin}" y1="${margin + dachHeight + 30}" x2="${margin + dachWidth}" y2="${margin + dachHeight + 30}" stroke="#666" stroke-width="1"/>`;
    svg += `<text x="${margin + dachWidth/2}" y="${margin + dachHeight + 42}" text-anchor="middle" font-size="11" font-weight="bold" fill="#666">Breite: ${breite}m</text>`;

    // BEMASSUNG: Gesamthöhe
    svg += `<line x1="${margin - 15}" y1="${dreieckPeakY}" x2="${margin - 15}" y2="${margin + dachHeight}" stroke="#666" stroke-width="1"/>`;
    svg += `<text x="${margin - 25}" y="${(dreieckPeakY + margin + dachHeight)/2}" text-anchor="middle" font-size="11" font-weight="bold" fill="#666" transform="rotate(-90 ${margin - 25} ${(dreieckPeakY + margin + dachHeight)/2})">H: ${gesamtHoehe}m</text>`;

    svg += `</svg>`;

    container.innerHTML = svg;
}

function erstelleAnrissplan() {
    const breite = parseFloat(document.getElementById('breite').value);
    const dreieckHoehe = parseFloat(document.getElementById('dreieck-hoehe').value);
    const rechteckHoehe = parseFloat(document.getElementById('rechteck-hoehe').value);
    const dreieckTyp = document.getElementById('dreieck-typ').value;
    let spitzenPosition = parseFloat(document.getElementById('spitzen-position').value);

    // Spitzenposition: wenn nicht eingegeben, auf Mitte setzen
    if (!spitzenPosition || isNaN(spitzenPosition)) {
        spitzenPosition = breite / 2;
    }

    const gesamtHoehe = dreieckHoehe + rechteckHoehe;
    const url = `/tools/dreieckaufrechteck/?typ=dreieck-auf-rechteck&breite=${breite.toFixed(2)}&hoehe=${gesamtHoehe.toFixed(2)}&dreieckHoehe=${dreieckHoehe.toFixed(2)}&rechteckHoehe=${rechteckHoehe.toFixed(2)}&dreieckTyp=${dreieckTyp}&spitzenPosition=${spitzenPosition.toFixed(2)}&showAnrissplan=true`;
    window.location.href = url;
}

function erstelleLattenrechner() {
    const breite = parseFloat(document.getElementById('breite').value);
    const dreieckHoehe = parseFloat(document.getElementById('dreieck-hoehe').value);
    const rechteckHoehe = parseFloat(document.getElementById('rechteck-hoehe').value);
    const dreieckTyp = document.getElementById('dreieck-typ').value;
    let spitzenPosition = parseFloat(document.getElementById('spitzen-position').value);

    // Spitzenposition: wenn nicht eingegeben, auf Mitte setzen
    if (!spitzenPosition || isNaN(spitzenPosition)) {
        spitzenPosition = breite / 2;
    }

    const gesamtHoehe = dreieckHoehe + rechteckHoehe;
    const url = `/tools/lattenrechner/?typ=dreieck-auf-rechteck&breite=${breite.toFixed(2)}&hoehe=${gesamtHoehe.toFixed(2)}&dreieckHoehe=${dreieckHoehe.toFixed(2)}&rechteckHoehe=${rechteckHoehe.toFixed(2)}&dreieckTyp=${dreieckTyp}&spitzenPosition=${spitzenPosition.toFixed(2)}`;
    window.location.href = url;
}

function erstellePVRechner() {
    const breite = parseFloat(document.getElementById('breite').value);
    const dreieckHoehe = parseFloat(document.getElementById('dreieck-hoehe').value);
    const rechteckHoehe = parseFloat(document.getElementById('rechteck-hoehe').value);
    const dreieckTyp = document.getElementById('dreieck-typ').value;
    const gesamtHoehe = dreieckHoehe + rechteckHoehe;

    // Spitzenposition: wenn nicht eingegeben, auf Mitte setzen
    let spitzenPosition = parseFloat(document.getElementById('spitzen-position').value);
    if (!spitzenPosition || isNaN(spitzenPosition)) {
        spitzenPosition = breite / 2;
    }

    const url = `/tools/pv-rechner/?typ=dreieck-auf-rechteck&breite=${breite.toFixed(2)}&hoehe=${gesamtHoehe.toFixed(2)}&dreieckHoehe=${dreieckHoehe.toFixed(2)}&rechteckHoehe=${rechteckHoehe.toFixed(2)}&dreieckTyp=${dreieckTyp}&spitzenPosition=${spitzenPosition.toFixed(2)}`;
    window.location.href = url;
}

// Auto-Load aus URL-Parametern wenn verfügbar
window.addEventListener('load', function() {
    const params = new URLSearchParams(window.location.search);
    if (params.has('breite') && params.has('dreieckHoehe') && params.has('rechteckHoehe')) {
        setTimeout(berechnen, 100);
    }
});
