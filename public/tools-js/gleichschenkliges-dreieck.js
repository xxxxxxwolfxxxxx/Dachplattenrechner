        let aktuelleSchnittliste = [];
        let parameterModus = 'basis-hoehe';
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

        function wechsleParameterModus(modus) {
            parameterModus = modus;
            
            document.getElementById('btn-basis-hoehe').classList.remove('active');
            document.getElementById('btn-kantenlaenge').classList.remove('active');
            
            if (modus === 'kantenlaenge') {
                document.getElementById('btn-kantenlaenge').classList.add('active');
            } else {
                document.getElementById('btn-basis-hoehe').classList.add('active');
            }
            
            if (modus === 'basis-hoehe') {
                document.getElementById('basis-hoehe-inputs').style.display = 'block';
                document.getElementById('kantenlaenge-inputs').style.display = 'none';
            } else if (modus === 'kantenlaenge') {
                document.getElementById('basis-hoehe-inputs').style.display = 'none';
                document.getElementById('kantenlaenge-inputs').style.display = 'block';
            }
        }

        function berechneGleichschenkligesDreieck(basisBreite, hoehe, deckbreite) {
            const schnittliste = [];
            const lieferbreite = parseFloat(document.getElementById('lieferbreite').value);
            const spitzenPosition = basisBreite / 2;
            
            let anzahlPlatten = Math.ceil((basisBreite - lieferbreite + deckbreite) / deckbreite);
            
            for (let i = 0; i < anzahlPlatten; i++) {
                let positionVonLinks, positionVonLinksEnde;
                
                if (verlegerichtung === 'links') {
                    positionVonLinks = (i === 0) ? 0 : i * deckbreite;
                    positionVonLinksEnde = positionVonLinks + lieferbreite;
                    positionVonLinksEnde = Math.min(positionVonLinksEnde, basisBreite);
                } else {
                    let positionVonRechts = (i === 0) ? 0 : i * deckbreite;
                    positionVonLinks = basisBreite - positionVonRechts - lieferbreite;
                    positionVonLinks = Math.max(0, positionVonLinks);
                    positionVonLinksEnde = positionVonLinks + lieferbreite;
                }
                
                let benoetigteLaenge;
                
                if (positionVonLinks <= spitzenPosition && positionVonLinksEnde >= spitzenPosition) {
                    benoetigteLaenge = hoehe;
                } else {
                    const hoeheStart = berechneHoeheAnPosition(positionVonLinks, basisBreite, hoehe);
                    const hoeheEnde = berechneHoeheAnPosition(positionVonLinksEnde, basisBreite, hoehe);
                    benoetigteLaenge = Math.max(hoeheStart, hoeheEnde);
                }
                
                if (benoetigteLaenge > 0 && positionVonLinks < basisBreite && positionVonLinks >= 0) {
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

        function berechneHoeheAnPosition(position, basisBreite, maxHoehe) {
            const spitzenPosition = basisBreite / 2;
            const abstand = Math.abs(position - spitzenPosition);
            const maxAbstand = basisBreite / 2;
            
            if (abstand >= maxAbstand) return 0;
            return maxHoehe * (1 - abstand / maxAbstand);
        }

        function berechneKantenlaengeAusHoehe(basisBreite, hoehe) {
            const halbeBase = basisBreite / 2;
            return Math.sqrt(halbeBase * halbeBase + hoehe * hoehe);
        }

        function berechneHoeheAusKantenlaenge(basisBreite, kantenlaenge) {
            const halbeBase = basisBreite / 2;
            return Math.sqrt(kantenlaenge * kantenlaenge - halbeBase * halbeBase);
        }

        function berechnen() {
            let basisBreite, hoehe, kantenlaenge;
            const deckbreite = parseFloat(document.getElementById('deckbreite').value);
            const lieferbreite = parseFloat(document.getElementById('lieferbreite').value);

            if (!deckbreite || !lieferbreite) {
                alert('Bitte füllen Sie alle Materialfelder aus!');
                return;
            }

            if (parameterModus === 'basis-hoehe') {
                basisBreite = parseFloat(document.getElementById('basis-breite').value);
                hoehe = parseFloat(document.getElementById('hoehe').value);
                
                if (!basisBreite || !hoehe) {
                    alert('Bitte geben Sie Basis-Breite und Höhe ein!');
                    return;
                }
                
                kantenlaenge = berechneKantenlaengeAusHoehe(basisBreite, hoehe);
            } else if (parameterModus === 'kantenlaenge') {
                basisBreite = parseFloat(document.getElementById('basis-breite-kante').value);
                kantenlaenge = parseFloat(document.getElementById('kantenlaenge').value);
                
                if (!basisBreite || !kantenlaenge) {
                    alert('Bitte geben Sie Basis-Breite und Kantenlänge ein!');
                    return;
                }
                
                if (kantenlaenge <= basisBreite / 2) {
                    alert('Die Kantenlänge muss größer als die halbe Basis-Breite (' + (basisBreite / 2).toFixed(2) + 'm) sein!');
                    return;
                }
                
                hoehe = berechneHoeheAusKantenlaenge(basisBreite, kantenlaenge);
                
                if (hoehe <= 0 || isNaN(hoehe)) {
                    alert('Die eingegebene Kantenlänge ist nicht mit der Basis-Breite vereinbar!');
                    return;
                }
            }

            if (typeof gtag !== 'undefined') {
                gtag('event', 'calculation', {
                    'event_category': 'gleichschenkliges_dreieck',
                    'event_label': 'form_submitted'
                });
            }

            const ueberlappung = lieferbreite - deckbreite;
            const dreieckBerechnung = berechneGleichschenkligesDreieck(basisBreite, hoehe, deckbreite);
            const maxLaenge = Math.max(...dreieckBerechnung.schnittliste.map(p => parseFloat(p.benoetigteLaenge)));

            document.getElementById('ueberlappung').textContent = ueberlappung.toFixed(2) + ' m';
            document.getElementById('kantenlaenge-result').textContent = kantenlaenge.toFixed(2) + ' m';
            document.getElementById('hoehe-result').textContent = hoehe.toFixed(2) + ' m';
            document.getElementById('benoetigte-plattenlaenge').textContent = maxLaenge.toFixed(2) + ' m';
            document.getElementById('anzahl-bleche-breite').textContent = dreieckBerechnung.anzahlPlatten + ' Stück';
            document.getElementById('gesamt-bleche').textContent = dreieckBerechnung.anzahlPlatten + ' Stück';

            const tbody = document.getElementById('schnitt-details');
            tbody.innerHTML = '';
            
            dreieckBerechnung.schnittliste.forEach(item => {
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
            document.getElementById('verlege-info').textContent = `${verlegerichtungText}, Platten verlaufen vertikal (oben → unten)`;

            aktuelleSchnittliste = dreieckBerechnung.schnittliste;
            document.getElementById('results').style.display = 'block';
            document.getElementById('schnittliste').style.display = 'block';
            
            generiereVorschau(basisBreite, hoehe, dreieckBerechnung.schnittliste);
            document.getElementById('vorschau').style.display = 'block';

            setTimeout(() => {
                document.getElementById('results').scrollIntoView({ 
                    behavior: 'smooth', 
                    block: 'start' 
                });
            }, 100);
        }

        function generiereVorschau(basisBreite, hoehe, schnittliste) {
            const spitzenPosition = basisBreite / 2;
            const lieferbreite = parseFloat(document.getElementById('lieferbreite').value);
            const deckbreite = parseFloat(document.getElementById('deckbreite').value);
            const ueberlappung = lieferbreite - deckbreite;
            
            const svgWidth = 500;
            const svgHeight = 320;
            const margin = 40;
            const dreieckWidth = svgWidth - 2 * margin;
            const dreieckHeight = svgHeight - 2 * margin - 40;
            
            const scaleX = dreieckWidth / basisBreite;
            const scaleY = dreieckHeight / hoehe;
            
            let svg = `<svg width="${svgWidth}" height="${svgHeight}" viewBox="0 0 ${svgWidth} ${svgHeight}" style="border: 1px solid #ddd; border-radius: 8px;">`;
            
            svg += `<rect width="${svgWidth}" height="${svgHeight}" fill="#fdfdfd"/>`;
            
            const dreieckSpitzeX = margin + spitzenPosition * scaleX;
            const dreieckSpitzeY = margin;
            const dreieckLinksX = margin;
            const dreieckLinksY = margin + dreieckHeight;
            const dreieckRechtsX = margin + basisBreite * scaleX;
            const dreieckRechtsY = margin + dreieckHeight;
            
            svg += `<polygon points="${dreieckSpitzeX},${dreieckSpitzeY} ${dreieckLinksX},${dreieckLinksY} ${dreieckRechtsX},${dreieckRechtsY}" fill="none" stroke="#1976d2" stroke-width="2"/>`;
            
            // PFEIL FÜR VERLEGERICHTUNG - GANZ UNTEN
            const pfeilY = svgHeight - 15;
            if (verlegerichtung === 'links') {
                svg += `<line x1="${margin + 5}" y1="${pfeilY}" x2="${margin + dreieckWidth - 5}" y2="${pfeilY}" stroke="#ff6b35" stroke-width="2.5" marker-end="url(#arrow-right)"/>`;
                svg += `<text x="${margin + dreieckWidth/2}" y="${pfeilY - 6}" text-anchor="middle" font-size="12" font-weight="bold" fill="#ff6b35">Verlegerichtung →</text>`;
            } else {
                svg += `<line x1="${margin + dreieckWidth - 5}" y1="${pfeilY}" x2="${margin + 5}" y2="${pfeilY}" stroke="#ff6b35" stroke-width="2.5" marker-end="url(#arrow-left)"/>`;
                svg += `<text x="${margin + dreieckWidth/2}" y="${pfeilY - 6}" text-anchor="middle" font-size="12" font-weight="bold" fill="#ff6b35">← Verlegerichtung</text>`;
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
                
                const istLetztePlatte = originalPlattenEnde > basisBreite;
                const plattenEndeReal = istLetztePlatte ? basisBreite : originalPlattenEnde;
                const ueberdecktSpitze = plattenStart <= spitzenPosition && originalPlattenEnde >= spitzenPosition;
                
                const plattenX = margin + plattenStart * scaleX;
                const plattenWidth = (plattenEndeReal - plattenStart) * scaleX;
                
                const hoeheStart = berechneHoeheAnPosition(plattenStart, basisBreite, hoehe);
                const hoeheEnde = berechneHoeheAnPosition(plattenEndeReal, basisBreite, hoehe);
                
                const startY = margin + dreieckHeight - (hoeheStart * scaleY);
                const endY = margin + dreieckHeight - (hoeheEnde * scaleY);
                
                const plattenHoehe = benoetigteLaenge * scaleY;
                const plattenY = margin + dreieckHeight - plattenHoehe;
                
                svg += `<rect x="${plattenX}" y="${plattenY}" width="${plattenWidth}" height="${plattenHoehe}" fill="#f8f9fa" stroke="#999" stroke-width="0.5"/>`;
                
                if (ueberdecktSpitze) {
                    const spitzeX = margin + spitzenPosition * scaleX;
                    svg += `<polygon points="${plattenX},${margin + dreieckHeight} ${plattenX + plattenWidth},${margin + dreieckHeight} ${plattenX + plattenWidth},${endY} ${spitzeX},${margin} ${plattenX},${startY}" fill="#1e3c72" opacity="0.4"/>`;
                } else {
                    svg += `<polygon points="${plattenX},${margin + dreieckHeight} ${plattenX + plattenWidth},${margin + dreieckHeight} ${plattenX + plattenWidth},${endY} ${plattenX},${startY}" fill="#1e3c72" opacity="0.4"/>`;
                }
                
                if (ueberdecktSpitze) {
                    const spitzeX = margin + spitzenPosition * scaleX;
                    svg += `<polygon points="${plattenX},${startY} ${spitzeX},${margin} ${plattenX + plattenWidth},${endY} ${plattenX + plattenWidth},${plattenY} ${plattenX},${plattenY}" fill="#dc3545" opacity="0.3"/>`;
                } else {
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
                
                svg += `<text x="${plattenX + plattenWidth/2}" y="${margin + dreieckHeight + 18}" text-anchor="middle" font-size="11" font-weight="bold" fill="#333">${platte.plattenNr}</text>`;
                
                if (ueberdecktSpitze) {
                    svg += `<circle cx="${margin + spitzenPosition * scaleX}" cy="${margin}" r="3" fill="#ffc107"/>`;
                    svg += `<text x="${margin + spitzenPosition * scaleX}" y="${margin - 8}" text-anchor="middle" font-size="10" font-weight="bold" fill="#333">Spitze: ${spitzenPosition.toFixed(1)}m</text>`;
                }
            });
            
            svg += `<line x1="${margin}" y1="${margin + dreieckHeight + 30}" x2="${margin + basisBreite * scaleX}" y2="${margin + dreieckHeight + 30}" stroke="#666" stroke-width="1"/>`;
            svg += `<text x="${margin + (basisBreite * scaleX)/2}" y="${margin + dreieckHeight + 42}" text-anchor="middle" font-size="11" font-weight="bold" fill="#666">Basis: ${basisBreite}m</text>`;
            
            svg += `<line x1="${margin - 15}" y1="${margin}" x2="${margin - 15}" y2="${margin + dreieckHeight}" stroke="#666" stroke-width="1"/>`;
            svg += `<text x="${margin - 25}" y="${margin + dreieckHeight/2}" text-anchor="middle" font-size="11" font-weight="bold" fill="#666" transform="rotate(-90 ${margin - 25} ${margin + dreieckHeight/2})">Höhe: ${hoehe.toFixed(2)}m</text>`;
            
            svg += `</svg>`;
            
            document.getElementById('vorschau-svg').innerHTML = svg;
        }

        function erstelleAnrissplan() {
            if (aktuelleSchnittliste.length === 0) return;
            
            if (typeof gtag !== 'undefined') {
                gtag('event', 'anrissplan_generated', {
                    'event_category': 'gleichschenkliges_dreieck',
                    'event_label': 'redirected_to_anrissplan'
                });
            }
            
            const basisBreite = parameterModus === 'basis-hoehe' ? 
                parseFloat(document.getElementById('basis-breite').value) : 
                parseFloat(document.getElementById('basis-breite-kante').value);
            const hoehe = parseFloat(document.getElementById('hoehe-result').textContent.replace(' m', ''));
            
            const planData = {
                basisBreite: basisBreite,
                hoehe: hoehe,
                schnittliste: aktuelleSchnittliste,
                verlegerichtung: verlegerichtung
            };
            
            const encodedData = encodeURIComponent(JSON.stringify(planData));
            window.location.href = `/tools/anrissplan.html?type=gleichschenkliges-dreieck&data=${encodedData}`;
        }

        function erstelleLattenrechner() {
            const basisBreite = parameterModus === 'basis-hoehe' ?
                parseFloat(document.getElementById('basis-breite').value) :
                parseFloat(document.getElementById('basis-breite-kante').value);
            const hoehe = parseFloat(document.getElementById('hoehe-result').textContent.replace(' m', ''));

            if (!basisBreite || !hoehe) {
                alert('Bitte führen Sie zuerst eine Berechnung durch, bevor Sie den Lattenrechner aufrufen.');
                return;
            }

            if (typeof gtag !== 'undefined') {
                gtag('event', 'lattenrechner_opened', {
                    'event_category': 'gleichschenkliges_dreieck',
                    'event_label': 'redirected_to_lattenrechner'
                });
            }

            const params = new URLSearchParams({
                breite: basisBreite,
                hoehe: hoehe,
                typ: 'gleichschenkliges-dreieck'
            });

            window.location.href = `/tools/lattenrechner/?${params.toString()}`;
        }

        function erstellePVRechner() {
            if (!basisBreite) { alert('Bitte führen Sie zuerst eine Berechnung durch.'); return; }
            const params = new URLSearchParams({ breite: basisBreite, hoehe: hoehe });
            window.location.href = `/tools/pv-rechner/?${params.toString()}`;
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
            
            wechsleParameterModus('basis-hoehe');
        });
