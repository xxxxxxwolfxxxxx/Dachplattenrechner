        let aktuelleSchnittliste = [];
        let verlegerichtung = 'links';

        function setVerlegerichtung(richtung) {
            verlegerichtung = richtung;
            if (aktuelleSchnittliste.length > 0) {
                berechnen();
            }
        }

        function showAds() {
            document.getElementById('top-ad-container').style.display = 'block';
            document.getElementById('middle-ad-container').style.display = 'block';
            document.getElementById('bottom-ad-container').style.display = 'block';
            
            const allowPersonalized = localStorage.getItem('marketingCookies') === 'true';
            
            setTimeout(function() {
                if (window.adsbygoogle) {
                    try {
                        const ads = document.querySelectorAll('.adsbygoogle');
                        ads.forEach(ad => {
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

        function berechneRechteck(breite, hoehe, deckbreite) {
            const schnittliste = [];
            const lieferbreite = parseFloat(document.getElementById('lieferbreite').value);
            
            let anzahlPlatten = Math.ceil((breite - lieferbreite + deckbreite) / deckbreite);
            
            for (let i = 0; i < anzahlPlatten; i++) {
                if (verlegerichtung === 'links') {
                    let positionVonLinks = (i === 0) ? 0 : i * deckbreite;
                    let positionVonLinksEnde = positionVonLinks + lieferbreite;
                    positionVonLinksEnde = Math.min(positionVonLinksEnde, breite);
                    
                    if (positionVonLinks < breite) {
                        schnittliste.push({
                            plattenNr: i + 1,
                            positionVonLinks: positionVonLinks.toFixed(2),
                            positionBis: positionVonLinksEnde.toFixed(2),
                            benoetigteLaenge: hoehe.toFixed(2),
                            plattenbreite: lieferbreite.toFixed(2),
                            richtung: 'links'
                        });
                    }
                } else {
                    let positionVonRechts = (i === 0) ? 0 : i * deckbreite;
                    let positionVonLinks = breite - positionVonRechts - lieferbreite;
                    positionVonLinks = Math.max(0, positionVonLinks);
                    let positionVonLinksEnde = positionVonLinks + lieferbreite;
                    
                    if (positionVonRechts < breite && positionVonLinks >= 0) {
                        schnittliste.push({
                            plattenNr: i + 1,
                            positionVonRechts: positionVonRechts.toFixed(2),
                            positionVonLinks: positionVonLinks.toFixed(2),
                            positionBis: positionVonLinksEnde.toFixed(2),
                            benoetigteLaenge: hoehe.toFixed(2),
                            plattenbreite: lieferbreite.toFixed(2),
                            richtung: 'rechts'
                        });
                    }
                }
            }

            return { 
                schnittliste: schnittliste,
                anzahlPlatten: schnittliste.length
            };
        }

        function berechnen() {
            const breite = parseFloat(document.getElementById('breite').value);
            const hoehe = parseFloat(document.getElementById('hoehe').value);
            const deckbreite = parseFloat(document.getElementById('deckbreite').value);
            const lieferbreite = parseFloat(document.getElementById('lieferbreite').value);

            if (!breite || !hoehe || !deckbreite || !lieferbreite) {
                alert('Bitte füllen Sie alle Felder aus!');
                return;
            }

            if (typeof gtag !== 'undefined') {
                gtag('event', 'calculation', {
                    'event_category': 'rechteck',
                    'event_label': 'form_submitted'
                });
            }

            const ueberlappung = lieferbreite - deckbreite;
            const rechteckBerechnung = berechneRechteck(breite, hoehe, deckbreite);
            const flaeche = breite * hoehe;

            document.getElementById('ueberlappung').textContent = ueberlappung.toFixed(2) + ' m';
            document.getElementById('flaeche-result').textContent = flaeche.toFixed(2) + ' m²';
            document.getElementById('benoetigte-plattenlaenge').textContent = hoehe.toFixed(2) + ' m';
            document.getElementById('anzahl-bleche-breite').textContent = rechteckBerechnung.anzahlPlatten + ' Stück';
            document.getElementById('gesamt-bleche').textContent = rechteckBerechnung.anzahlPlatten + ' Stück';

            const tbody = document.getElementById('schnitt-details');
            tbody.innerHTML = '';
            
            rechteckBerechnung.schnittliste.forEach(item => {
                const row = document.createElement('tr');
                const positionText = verlegerichtung === 'links' 
                    ? `${item.positionVonLinks} - ${item.positionBis}` 
                    : `${item.positionVonLinks} - ${item.positionBis} (von rechts: ${item.positionVonRechts})`;
                
                row.innerHTML = `
                    <td>${item.plattenNr}</td>
                    <td>${positionText}</td>
                    <td style="font-weight: bold; color: #28a745;">${item.plattenbreite}</td>
                    <td style="font-weight: bold; color: #28a745; background-color: #f8fff9; padding: 8px;">${item.benoetigteLaenge}</td>
                `;
                tbody.appendChild(row);
            });

            const verlegerichtungText = verlegerichtung === 'links' ? 'Von links nach rechts →' : '← Von rechts nach links';
            document.getElementById('verlege-info').textContent = `${verlegerichtungText}, Platten verlaufen vertikal (oben → unten)`;

            aktuelleSchnittliste = rechteckBerechnung.schnittliste;
            document.getElementById('results').style.display = 'block';
            document.getElementById('schnittliste').style.display = 'block';
            
            generiereVorschau(breite, hoehe, rechteckBerechnung.schnittliste);
            document.getElementById('vorschau').style.display = 'block';

            setTimeout(() => {
                document.getElementById('results').scrollIntoView({ 
                    behavior: 'smooth', 
                    block: 'start' 
                });
            }, 100);
        }

        function generiereVorschau(breite, hoehe, schnittliste) {
            const lieferbreite = parseFloat(document.getElementById('lieferbreite').value);
            const deckbreite = parseFloat(document.getElementById('deckbreite').value);
            const ueberlappung = lieferbreite - deckbreite;
            
            const svgWidth = 500;
            const svgHeight = 320;
            const margin = 40;
            const rechteckWidth = svgWidth - 2 * margin;
            const rechteckHeight = svgHeight - 2 * margin - 40;
            
            const scaleX = rechteckWidth / breite;
            const scaleY = rechteckHeight / hoehe;
            
            let svg = `<svg width="${svgWidth}" height="${svgHeight}" viewBox="0 0 ${svgWidth} ${svgHeight}" style="border: 1px solid #ddd; border-radius: 8px;">`;
            
            svg += `<rect width="${svgWidth}" height="${svgHeight}" fill="#fdfdfd"/>`;
            svg += `<rect x="${margin}" y="${margin}" width="${rechteckWidth}" height="${rechteckHeight}" fill="none" stroke="#1976d2" stroke-width="2"/>`;
            
            // KORRIGIERTE PFEILRICHTUNG
            const pfeilY = margin - 20;
            if (verlegerichtung === 'links') {
                // Links nach rechts: Pfeil zeigt nach rechts
                svg += `<line x1="${margin + 5}" y1="${pfeilY}" x2="${margin + rechteckWidth - 5}" y2="${pfeilY}" stroke="#ff6b35" stroke-width="2.5" marker-end="url(#arrow-right)"/>`;
                svg += `<text x="${margin + rechteckWidth/2}" y="${pfeilY - 6}" text-anchor="middle" font-size="12" font-weight="bold" fill="#ff6b35">Verlegerichtung →</text>`;
            } else {
                // Rechts nach links: Pfeil zeigt nach links
                svg += `<line x1="${margin + rechteckWidth - 5}" y1="${pfeilY}" x2="${margin + 5}" y2="${pfeilY}" stroke="#ff6b35" stroke-width="2.5" marker-end="url(#arrow-left)"/>`;
                svg += `<text x="${margin + rechteckWidth/2}" y="${pfeilY - 6}" text-anchor="middle" font-size="12" font-weight="bold" fill="#ff6b35">← Verlegerichtung</text>`;
            }
            
            // KORRIGIERTE MARKER-DEFINITIONEN MIT ORIENT
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
                
                const plattenX = margin + plattenStart * scaleX;
                const plattenWidth = (plattenEnde - plattenStart) * scaleX;
                
                svg += `<rect x="${plattenX}" y="${margin}" width="${plattenWidth}" height="${rechteckHeight}" fill="#1e3c72" opacity="0.4"/>`;
                
                if (index > 0 && ueberlappung > 0) {
                    const ueberlappungsWidth = ueberlappung * scaleX;
                    if (verlegerichtung === 'links') {
                        svg += `<rect x="${plattenX}" y="${margin}" width="${ueberlappungsWidth}" height="${rechteckHeight}" fill="#28a745" opacity="0.25"/>`;
                    } else {
                        svg += `<rect x="${plattenX + plattenWidth - ueberlappungsWidth}" y="${margin}" width="${ueberlappungsWidth}" height="${rechteckHeight}" fill="#28a745" opacity="0.25"/>`;
                    }
                }
                
                svg += `<text x="${plattenX + plattenWidth/2}" y="${margin + rechteckHeight + 18}" text-anchor="middle" font-size="11" font-weight="bold" fill="#333">${platte.plattenNr}</text>`;
                
                if (index > 0) {
                    if (verlegerichtung === 'links') {
                        svg += `<line x1="${plattenX}" y1="${margin}" x2="${plattenX}" y2="${margin + rechteckHeight}" stroke="#666" stroke-width="1" opacity="0.5"/>`;
                    } else {
                        svg += `<line x1="${plattenX + plattenWidth}" y1="${margin}" x2="${plattenX + plattenWidth}" y2="${margin + rechteckHeight}" stroke="#666" stroke-width="1" opacity="0.5"/>`;
                    }
                }
            });
            
            svg += `<line x1="${margin}" y1="${margin + rechteckHeight + 30}" x2="${margin + rechteckWidth}" y2="${margin + rechteckHeight + 30}" stroke="#666" stroke-width="1"/>`;
            svg += `<text x="${margin + rechteckWidth/2}" y="${margin + rechteckHeight + 42}" text-anchor="middle" font-size="11" font-weight="bold" fill="#666">Breite: ${breite}m</text>`;
            
            svg += `<line x1="${margin - 15}" y1="${margin}" x2="${margin - 15}" y2="${margin + rechteckHeight}" stroke="#666" stroke-width="1"/>`;
            svg += `<text x="${margin - 25}" y="${margin + rechteckHeight/2}" text-anchor="middle" font-size="11" font-weight="bold" fill="#666" transform="rotate(-90 ${margin - 25} ${margin + rechteckHeight/2})">Höhe: ${hoehe}m</text>`;
            
            svg += `</svg>`;
            
            document.getElementById('vorschau-svg').innerHTML = svg;
        }

        function erstelleAnrissplan() {
            if (aktuelleSchnittliste.length === 0) return;
            
            if (typeof gtag !== 'undefined') {
                gtag('event', 'anrissplan_generated', {
                    'event_category': 'rechteck',
                    'event_label': 'redirected_to_anrissplan'
                });
            }
            
            const breite = parseFloat(document.getElementById('breite').value);
            const hoehe = parseFloat(document.getElementById('hoehe').value);
            
            const planData = {
                breite: breite,
                hoehe: hoehe,
                schnittliste: aktuelleSchnittliste,
                verlegerichtung: verlegerichtung
            };
            
            const encodedData = encodeURIComponent(JSON.stringify(planData));
            window.location.href = `/tools/anrissplan.html?type=rechteck&data=${encodedData}`;
        }

        function erstelleLattenrechner() {
            const breite = parseFloat(document.getElementById('breite').value);
            const hoehe = parseFloat(document.getElementById('hoehe').value);
            
            if (!breite || !hoehe) {
                alert('Bitte führen Sie zuerst eine Berechnung durch, bevor Sie den Lattenrechner aufrufen.');
                return;
            }
            
            if (typeof gtag !== 'undefined') {
                gtag('event', 'lattenrechner_opened', {
                    'event_category': 'rechteck',
                    'event_label': 'redirected_to_lattenrechner'
                });
            }
            
            const params = new URLSearchParams({
                breite: breite,
                hoehe: hoehe,
                typ: 'rechteck'
            });
            
            window.location.href = `/tools/lattenrechner/?${params.toString()}`;
        }

        function erstellePVRechner() {
            const breite = parseFloat(document.getElementById('breite').value);
            const hoehe = parseFloat(document.getElementById('hoehe').value);

            if (!breite || !hoehe) {
                alert('Bitte führen Sie zuerst eine Berechnung durch, bevor Sie den PV-Rechner aufrufen.');
                return;
            }

            const params = new URLSearchParams({
                breite: breite,
                hoehe: hoehe,
                typ: 'rechteck'
            });

            window.location.href = `/tools/pv-rechner/?${params.toString()}`;
        }

        document.addEventListener('DOMContentLoaded', function() {
            loadAdSense();
            
            const cookieConsent = localStorage.getItem('cookieConsent');
            if (cookieConsent === 'all' || localStorage.getItem('analyticsCookies') === 'true') {
                loadAnalytics();
            }
            
            showAds();
        });
