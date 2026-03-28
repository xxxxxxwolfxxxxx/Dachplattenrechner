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

        function berechneTrapez(obereBreite, untereBreite, hoehe, deckbreite) {
            const schnittliste = [];
            const lieferbreite = parseFloat(document.getElementById('lieferbreite').value);
            const breitenDifferenz = untereBreite - obereBreite;
            const seitenAbstand = breitenDifferenz / 2;
            const linkeObereEcke = seitenAbstand;
            const rechteObereEcke = untereBreite - seitenAbstand;
            
            let anzahlPlatten = Math.ceil((untereBreite - lieferbreite + deckbreite) / deckbreite);
            
            for (let i = 0; i < anzahlPlatten; i++) {
                let positionVonLinks, positionVonLinksEnde;
                
                if (verlegerichtung === 'links') {
                    positionVonLinks = (i === 0) ? 0 : i * deckbreite;
                    positionVonLinksEnde = positionVonLinks + lieferbreite;
                    positionVonLinksEnde = Math.min(positionVonLinksEnde, untereBreite);
                } else {
                    let positionVonRechts = (i === 0) ? 0 : i * deckbreite;
                    positionVonLinks = untereBreite - positionVonRechts - lieferbreite;
                    positionVonLinks = Math.max(0, positionVonLinks);
                    positionVonLinksEnde = positionVonLinks + lieferbreite;
                }
                
                // Höhe an beiden Positionen berechnen
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
                
                if (benoetigteLaenge > 0 && positionVonLinks < untereBreite && positionVonLinks >= 0) {
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

        function berechneSeitenlaengen(obereBreite, untereBreite, hoehe) {
            const breitenDifferenz = untereBreite - obereBreite;
            const seitenlaenge = Math.sqrt(hoehe * hoehe + (breitenDifferenz / 2) * (breitenDifferenz / 2));
            return seitenlaenge;
        }

        function berechnen() {
            const obereBreite = parseFloat(document.getElementById('obere-breite').value);
            const untereBreite = parseFloat(document.getElementById('untere-breite').value);
            const hoehe = parseFloat(document.getElementById('hoehe').value);
            const deckbreite = parseFloat(document.getElementById('deckbreite').value);
            const lieferbreite = parseFloat(document.getElementById('lieferbreite').value);

            if (!obereBreite || !untereBreite || !hoehe || !deckbreite || !lieferbreite) {
                alert('Bitte füllen Sie alle Felder aus!');
                return;
            }

            if (obereBreite >= untereBreite) {
                alert('Die obere Breite muss kleiner als die untere Breite sein!');
                return;
            }

            if (typeof gtag !== 'undefined') {
                gtag('event', 'calculation', {
                    'event_category': 'trapez',
                    'event_label': 'form_submitted'
                });
            }

            const ueberlappung = lieferbreite - deckbreite;
            const trapezBerechnung = berechneTrapez(obereBreite, untereBreite, hoehe, deckbreite);
            const maxLaenge = Math.max(...trapezBerechnung.schnittliste.map(p => parseFloat(p.benoetigteLaenge)));
            const seitenlaenge = berechneSeitenlaengen(obereBreite, untereBreite, hoehe);

            document.getElementById('ueberlappung').textContent = ueberlappung.toFixed(2) + ' m';
            document.getElementById('seiten-result').textContent = 'Links/Rechts: ' + seitenlaenge.toFixed(2) + 'm';
            document.getElementById('benoetigte-plattenlaenge').textContent = maxLaenge.toFixed(2) + ' m';
            document.getElementById('anzahl-bleche-breite').textContent = trapezBerechnung.anzahlPlatten + ' Stück';
            document.getElementById('gesamt-bleche').textContent = trapezBerechnung.anzahlPlatten + ' Stück';

            const tbody = document.getElementById('schnitt-details');
            tbody.innerHTML = '';
            
            trapezBerechnung.schnittliste.forEach(item => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${item.plattenNr}</td>
                    <td>${item.positionVonLinks} - ${item.positionBis}</td>
                    <td style="font-weight: bold; color: #28a745;">${item.plattenbreite}</td>
                    <td style="font-weight: bold; color: #28a745; background-color: #f8fff9; padding: 8px;">${item.benoetigteLaenge}</td>
                `;
                tbody.appendChild(row);
            });

            const verlegerichtungText = verlegerichtung === 'links' ? 'Von links nach rechts →' : '← Von rechts nach links';
            document.getElementById('verlege-info').textContent = `${verlegerichtungText}, Platten verlaufen vertikal (unten → oben)`;

            aktuelleSchnittliste = trapezBerechnung.schnittliste;
            document.getElementById('results').style.display = 'block';
            document.getElementById('schnittliste').style.display = 'block';
            
            generiereVorschau(obereBreite, untereBreite, hoehe, trapezBerechnung.schnittliste);
            document.getElementById('vorschau').style.display = 'block';

            setTimeout(() => {
                document.getElementById('results').scrollIntoView({ 
                    behavior: 'smooth', 
                    block: 'start' 
                });
            }, 100);
        }

        function generiereVorschau(obereBreite, untereBreite, hoehe, schnittliste) {
            const lieferbreite = parseFloat(document.getElementById('lieferbreite').value);
            const deckbreite = parseFloat(document.getElementById('deckbreite').value);
            const ueberlappung = lieferbreite - deckbreite;
            const breitenDifferenz = untereBreite - obereBreite;
            const seitenAbstand = breitenDifferenz / 2;
            const linkeObereEcke = seitenAbstand;
            const rechteObereEcke = untereBreite - seitenAbstand;
            
            const svgWidth = 500;
            const svgHeight = 320;
            const margin = 40;
            const trapezWidth = svgWidth - 2 * margin;
            const trapezHeight = svgHeight - 2 * margin - 40;
            
            const scaleX = trapezWidth / untereBreite;
            const scaleY = trapezHeight / hoehe;
            
            let svg = `<svg width="${svgWidth}" height="${svgHeight}" viewBox="0 0 ${svgWidth} ${svgHeight}" style="border: 1px solid #ddd; border-radius: 8px;">`;
            
            svg += `<rect width="${svgWidth}" height="${svgHeight}" fill="#fdfdfd"/>`;
            
            const trapezObenLinks = margin + linkeObereEcke * scaleX;
            const trapezObenRechts = margin + rechteObereEcke * scaleX;
            const trapezObenY = margin;
            const trapezUntenLinks = margin;
            const trapezUntenRechts = margin + untereBreite * scaleX;
            const trapezUntenY = margin + trapezHeight;
            
            svg += `<polygon points="${trapezObenLinks},${trapezObenY} ${trapezObenRechts},${trapezObenY} ${trapezUntenRechts},${trapezUntenY} ${trapezUntenLinks},${trapezUntenY}" fill="none" stroke="#1976d2" stroke-width="2"/>`;
            
           // PFEIL FÜR VERLEGERICHTUNG - GANZ UNTEN
const pfeilY = svgHeight - 15;
if (verlegerichtung === 'links') {
    svg += `<line x1="${margin + 5}" y1="${pfeilY}" x2="${margin + trapezWidth - 5}" y2="${pfeilY}" stroke="#ff6b35" stroke-width="2.5" marker-end="url(#arrow-right)"/>`;
    svg += `<text x="${margin + trapezWidth/2}" y="${pfeilY - 6}" text-anchor="middle" font-size="12" font-weight="bold" fill="#ff6b35">Verlegerichtung →</text>`;
} else {
    svg += `<line x1="${margin + trapezWidth - 5}" y1="${pfeilY}" x2="${margin + 5}" y2="${pfeilY}" stroke="#ff6b35" stroke-width="2.5" marker-end="url(#arrow-left)"/>`;
    svg += `<text x="${margin + trapezWidth/2}" y="${pfeilY - 6}" text-anchor="middle" font-size="12" font-weight="bold" fill="#ff6b35">← Verlegerichtung</text>`;
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
            
            schnittliste.forEach((platte, index) => {
                const plattenStart = parseFloat(platte.positionVonLinks);
                const plattenEnde = parseFloat(platte.positionBis);
                const plattenBreite = parseFloat(platte.plattenbreite);
                const originalPlattenEnde = plattenStart + plattenBreite;
                const benoetigteLaenge = parseFloat(platte.benoetigteLaenge);
                
                const istLetztePlatte = originalPlattenEnde > untereBreite;
                const plattenEndeReal = istLetztePlatte ? untereBreite : originalPlattenEnde;
                
                const plattenX = margin + plattenStart * scaleX;
                const plattenWidth = (plattenEndeReal - plattenStart) * scaleX;
                
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
                
                const hoeheStart = hoeheAnPosition(plattenStart);
                const hoeheEnde = hoeheAnPosition(plattenEndeReal);
                
                const startY = margin + trapezHeight - (hoeheStart * scaleY);
                const endY = margin + trapezHeight - (hoeheEnde * scaleY);
                
                const plattenHoehe = benoetigteLaenge * scaleY;
                const plattenY = margin + trapezHeight - plattenHoehe;
                
                svg += `<rect x="${plattenX}" y="${plattenY}" width="${plattenWidth}" height="${plattenHoehe}" fill="#f8f9fa" stroke="#999" stroke-width="0.5"/>`;
                
                const ueberdecktLinkeEcke = plattenStart <= linkeObereEcke && plattenEndeReal >= linkeObereEcke;
                const ueberdecktRechteEcke = plattenStart <= rechteObereEcke && plattenEndeReal >= rechteObereEcke;
                
                if (ueberdecktLinkeEcke && ueberdecktRechteEcke) {
                    const linkeEckeX = margin + linkeObereEcke * scaleX;
                    const rechteEckeX = margin + rechteObereEcke * scaleX;
                    const oberkanteY = margin;
                    
                    svg += `<polygon points="${plattenX},${margin + trapezHeight} ${plattenX + plattenWidth},${margin + trapezHeight} ${plattenX + plattenWidth},${endY} ${rechteEckeX},${oberkanteY} ${linkeEckeX},${oberkanteY} ${plattenX},${startY}" fill="#1e3c72" opacity="0.4"/>`;
                    svg += `<polygon points="${plattenX},${startY} ${linkeEckeX},${oberkanteY} ${rechteEckeX},${oberkanteY} ${plattenX + plattenWidth},${endY} ${plattenX + plattenWidth},${plattenY} ${plattenX},${plattenY}" fill="#dc3545" opacity="0.3"/>`;
                } else if (ueberdecktLinkeEcke) {
                    const eckeX = margin + linkeObereEcke * scaleX;
                    const oberkanteY = margin;
                    
                    svg += `<polygon points="${plattenX},${margin + trapezHeight} ${plattenX + plattenWidth},${margin + trapezHeight} ${plattenX + plattenWidth},${endY} ${eckeX},${oberkanteY} ${plattenX},${startY}" fill="#1e3c72" opacity="0.4"/>`;
                    svg += `<polygon points="${plattenX},${startY} ${eckeX},${oberkanteY} ${plattenX + plattenWidth},${endY} ${plattenX + plattenWidth},${plattenY} ${plattenX},${plattenY}" fill="#dc3545" opacity="0.3"/>`;
                } else if (ueberdecktRechteEcke) {
                    const eckeX = margin + rechteObereEcke * scaleX;
                    const oberkanteY = margin;
                    
                    svg += `<polygon points="${plattenX},${margin + trapezHeight} ${plattenX + plattenWidth},${margin + trapezHeight} ${plattenX + plattenWidth},${endY} ${eckeX},${oberkanteY} ${plattenX},${startY}" fill="#1e3c72" opacity="0.4"/>`;
                    svg += `<polygon points="${plattenX},${startY} ${eckeX},${oberkanteY} ${plattenX + plattenWidth},${endY} ${plattenX + plattenWidth},${plattenY} ${plattenX},${plattenY}" fill="#dc3545" opacity="0.3"/>`;
                } else {
                    svg += `<polygon points="${plattenX},${margin + trapezHeight} ${plattenX + plattenWidth},${margin + trapezHeight} ${plattenX + plattenWidth},${endY} ${plattenX},${startY}" fill="#1e3c72" opacity="0.4"/>`;
                    svg += `<polygon points="${plattenX},${startY} ${plattenX + plattenWidth},${endY} ${plattenX + plattenWidth},${plattenY} ${plattenX},${plattenY}" fill="#dc3545" opacity="0.3"/>`;
                }
                
                if (index > 0 && ueberlappung > 0) {
                    const ueberlappungsWidth = ueberlappung * scaleX;
                    if (verlegerichtung === 'links') {
                        svg += `<rect x="${plattenX}" y="${plattenY}" width="${ueberlappungsWidth}" height="${plattenHoehe}" fill="#28a745" opacity="0.25"/>`;
                    } else {
                        svg += `<rect x="${plattenX + plattenWidth - ueberlappungsWidth}" y="${plattenY}" width="${ueberlappungsWidth}" height="${plattenHoehe}" fill="#28a745" opacity="0.25"/>`;
                    }
                }
                
                svg += `<text x="${plattenX + plattenWidth/2}" y="${margin + trapezHeight + 18}" text-anchor="middle" font-size="11" font-weight="bold" fill="#333">${platte.plattenNr}</text>`;
                
                if (ueberdecktLinkeEcke) {
                    const eckeX = margin + linkeObereEcke * scaleX;
                    const oberkanteY = margin;
                    svg += `<circle cx="${eckeX}" cy="${oberkanteY}" r="3" fill="#ffc107"/>`;
                }
                if (ueberdecktRechteEcke) {
                    const eckeX = margin + rechteObereEcke * scaleX;
                    const oberkanteY = margin;
                    svg += `<circle cx="${eckeX}" cy="${oberkanteY}" r="3" fill="#ffc107"/>`;
                }
            });
            
            svg += `<line x1="${margin}" y1="${margin + trapezHeight + 30}" x2="${margin + untereBreite * scaleX}" y2="${margin + trapezHeight + 30}" stroke="#666" stroke-width="1"/>`;
            svg += `<text x="${margin + (untereBreite * scaleX)/2}" y="${margin + trapezHeight + 42}" text-anchor="middle" font-size="11" font-weight="bold" fill="#666">Untere Breite: ${untereBreite}m</text>`;
            
            svg += `<line x1="${margin + linkeObereEcke * scaleX}" y1="${margin - 15}" x2="${margin + rechteObereEcke * scaleX}" y2="${margin - 15}" stroke="#28a745" stroke-width="2"/>`;
            svg += `<text x="${margin + (linkeObereEcke + rechteObereEcke) * scaleX / 2}" y="${margin - 20}" text-anchor="middle" font-size="11" font-weight="bold" fill="#28a745">Obere Breite: ${obereBreite}m</text>`;
            
            svg += `<line x1="${margin - 15}" y1="${margin}" x2="${margin - 15}" y2="${margin + trapezHeight}" stroke="#666" stroke-width="1"/>`;
            svg += `<text x="${margin - 25}" y="${margin + trapezHeight/2}" text-anchor="middle" font-size="11" font-weight="bold" fill="#666" transform="rotate(-90 ${margin - 25} ${margin + trapezHeight/2})">Höhe: ${hoehe}m</text>`;
            
            svg += `</svg>`;
            
            document.getElementById('vorschau-svg').innerHTML = svg;
        }

        function erstelleAnrissplan() {
            if (aktuelleSchnittliste.length === 0) return;
            
            if (typeof gtag !== 'undefined') {
                gtag('event', 'anrissplan_generated', {
                    'event_category': 'trapez',
                    'event_label': 'redirected_to_anrissplan'
                });
            }
            
            const obereBreite = parseFloat(document.getElementById('obere-breite').value);
            const untereBreite = parseFloat(document.getElementById('untere-breite').value);
            const hoehe = parseFloat(document.getElementById('hoehe').value);
            
            const planData = {
                obereBreite: obereBreite,
                untereBreite: untereBreite,
                hoehe: hoehe,
                schnittliste: aktuelleSchnittliste,
                verlegerichtung: verlegerichtung
            };
            
            const encodedData = encodeURIComponent(JSON.stringify(planData));
            window.location.href = `anrissplan.html?type=trapez&data=${encodedData}`;
        }

        function erstelleLattenrechner() {
            const obereBreite = parseFloat(document.getElementById('obere-breite').value);
            const untereBreite = parseFloat(document.getElementById('untere-breite').value);
            const hoehe = parseFloat(document.getElementById('hoehe').value);
            
            if (!obereBreite || !untereBreite || !hoehe) {
                alert('Bitte führen Sie zuerst eine Berechnung durch, bevor Sie den Lattenrechner aufrufen.');
                return;
            }
            
            if (typeof gtag !== 'undefined') {
                gtag('event', 'lattenrechner_opened', {
                    'event_category': 'trapez',
                    'event_label': 'redirected_to_lattenrechner'
                });
            }
            
            const params = new URLSearchParams({
                breite: untereBreite,
                hoehe: hoehe,
                typ: 'trapez',
                obereBreite: obereBreite
            });
            
            window.location.href = `lattenrechner.html?${params.toString()}`;
        }

        // Initialize everything
        document.addEventListener('DOMContentLoaded', function() {
            // AdSense immer laden
            loadAdSense();
            
            // Initialize tracking based on existing consent
            const cookieConsent = localStorage.getItem('cookieConsent');
            if (cookieConsent === 'all' || localStorage.getItem('analyticsCookies') === 'true') {
                loadAnalytics();
            }
            
            // Werbung immer anzeigen
            showAds();
        });
