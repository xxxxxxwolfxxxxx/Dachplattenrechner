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
        const benoetigteLaenge = Math.max(hoeheStart, hoeheEnde);

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

    // Zeichne SVG-Vorschau
    zeichneDreieckAufRechteckVorschau(breite, dreieckHoehe, rechteckHoehe, dreieckTyp, spitzenPosition);

    // Anzeige von Schnittliste und Vorschau
    document.getElementById('results').style.display = 'block';
    document.getElementById('schnittliste').style.display = 'block';
    document.getElementById('vorschau').style.display = 'block';

    showAds();
}

function zeichneDreieckAufRechteckVorschau(breite, dreieckHoehe, rechteckHoehe, dreieckTyp, spitzenPosition) {
    const container = document.getElementById('vorschau-svg');
    if (!container) return;

    const scale = 30; // Pixel pro Meter
    const svgWidth = Math.min(breite * scale + 40, 800);
    const svgHeight = (dreieckHoehe + rechteckHoehe) * scale + 40;

    let spitzePosX;
    if (dreieckTyp === 'gleichschenkliges') {
        spitzePosX = breite / 2;
    } else {
        spitzePosX = spitzenPosition;
    }

    const startX = 20;
    const startY = dreieckHoehe * scale + 20;

    const svg = `
        <svg width="${svgWidth}" height="${svgHeight}" style="border: 1px solid rgba(255,255,255,0.2); border-radius: 8px;">
            <!-- Hintergrund -->
            <rect width="${svgWidth}" height="${svgHeight}" fill="rgba(15, 23, 42, 0.3)"/>

            <!-- Rechteck-Bereich -->
            <rect x="${startX}" y="${startY}" width="${breite * scale}" height="${rechteckHoehe * scale}"
                  fill="rgba(30, 45, 74, 0.5)" stroke="#0ea5e9" stroke-width="2"/>

            <!-- Dreieck-Bereich -->
            <polygon points="${startX},${startY} ${startX + spitzePosX * scale},${startY - dreieckHoehe * scale} ${startX + breite * scale},${startY}"
                     fill="rgba(42, 82, 152, 0.4)" stroke="#0ea5e9" stroke-width="2"/>

            <!-- Sparren/Lattung (vertikale Linien) -->
            <g stroke="#cbd5e1" stroke-width="1" opacity="0.3">
                <line x1="${startX}" y1="${startY}" x2="${startX}" y2="${startY - dreieckHoehe * scale}"/>
                ${Array.from({length: Math.floor(breite) + 1}, (_, i) =>
                    `<line x1="${startX + i * scale}" y1="${startY}" x2="${startX + i * scale}" y2="${startY + rechteckHoehe * scale}"/>`
                ).join('')}
                <line x1="${startX + breite * scale}" y1="${startY}" x2="${startX + breite * scale}" y2="${startY - dreieckHoehe * scale}"/>
            </g>

            <!-- Spitze markieren -->
            <circle cx="${startX + spitzePosX * scale}" cy="${startY - dreieckHoehe * scale}" r="4" fill="#ffc107" stroke="#fff" stroke-width="1"/>

            <!-- Dimensionen -->
            <text x="${startX + breite * scale / 2}" y="${startY + rechteckHoehe * scale + 15}" text-anchor="middle" font-size="12" fill="#cbd5e1">
                Breite: ${breite.toFixed(2)}m
            </text>
            <text x="${startX - 15}" y="${startY - dreieckHoehe * scale / 2}" text-anchor="end" font-size="11" fill="#cbd5e1">
                △ ${dreieckHoehe.toFixed(2)}m
            </text>
            <text x="${startX - 15}" y="${startY + rechteckHoehe * scale / 2}" text-anchor="end" font-size="11" fill="#cbd5e1">
                ▭ ${rechteckHoehe.toFixed(2)}m
            </text>
            ${dreieckTyp === 'ungleichschenkliges' ?
                `<text x="${startX + spitzePosX * scale}" y="${startY - dreieckHoehe * scale - 8}" text-anchor="middle" font-size="10" fill="#ffc107">
                    ${spitzenPosition.toFixed(2)}m
                </text>` : ''}
        </svg>
    `;

    container.innerHTML = svg;
}

function erstelleAnrissplan() {
    console.log('Anrissplan-Funktion wird aufgerufen (noch nicht implementiert)');
    alert('Anrissplan wird noch nicht unterstützt. Bitte verwenden Sie die Anrissplan-Seite.');
}

function erstelleLattenrechner() {
    const breite = parseFloat(document.getElementById('breite').value);
    const dreieckHoehe = parseFloat(document.getElementById('dreieck-hoehe').value);
    const rechteckHoehe = parseFloat(document.getElementById('rechteck-hoehe').value);
    const dreieckTyp = document.getElementById('dreieck-typ').value;
    let spitzenPosition = parseFloat(document.getElementById('spitzen-position').value);

    // Spitzenposition: wenn nicht eingegeben, auf Mitte setzen
    if (!spitzenPosition || isNaN(spitzenPosition)) {
        spitzenPosition = breite / 2; // Default: Mitte
    }

    // Gesamthöhe = Dreieck + Rechteck
    const gesamtHoehe = dreieckHoehe + rechteckHoehe;

    // URL für Lattenrechner mit neuer Dachform (spitzenPosition in Metern)
    const url = `/tools/lattenrechner/?typ=dreieck-auf-rechteck&breite=${breite.toFixed(2)}&hoehe=${gesamtHoehe.toFixed(2)}&dreieckHoehe=${dreieckHoehe.toFixed(2)}&rechteckHoehe=${rechteckHoehe.toFixed(2)}&dreieckTyp=${dreieckTyp}&spitzenPosition=${spitzenPosition.toFixed(2)}`;
    window.location.href = url;
}

function erstellePVRechner() {
    console.log('PV-Rechner-Funktion wird aufgerufen (noch nicht implementiert)');
    alert('PV-Rechner wird noch nicht unterstützt. Bitte verwenden Sie die PV-Rechner-Seite.');
}

// Auto-Load aus URL-Parametern wenn verfügbar
window.addEventListener('load', function() {
    const params = new URLSearchParams(window.location.search);
    if (params.has('breite') && params.has('dreieckHoehe') && params.has('rechteckHoehe')) {
        setTimeout(berechnen, 100);
    }
});
