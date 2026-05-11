let aktuelleOptimierung = [];

function parseEinheitUndWert(eingabe) {
    let bereinigt = eingabe.replace(',', '.').replace(/\s/g, '').toLowerCase();

    let einheit = 'm';
    let zahlTeil = bereinigt;

    if (bereinigt.endsWith('mm')) {
        einheit = 'mm';
        zahlTeil = bereinigt.slice(0, -2);
    } else if (bereinigt.endsWith('cm')) {
        einheit = 'cm';
        zahlTeil = bereinigt.slice(0, -2);
    } else if (bereinigt.endsWith('m')) {
        einheit = 'm';
        zahlTeil = bereinigt.slice(0, -1);
    }

    const zahl = parseFloat(zahlTeil);
    if (isNaN(zahl)) return NaN;

    switch (einheit) {
        case 'mm': return zahl / 1000;
        case 'cm': return zahl / 100;
        case 'm': return zahl;
        default: return zahl;
    }
}

function parseEinfacheEingabe() {
    const text = document.getElementById('benoetigte-masze').value;
    const lines = text.split('\n');
    const masze = [];

    for (let line of lines) {
        line = line.trim();
        if (!line) continue;

        if (line.includes('x')) {
            const parts = line.split('x');
            if (parts.length === 2) {
                const anzahl = parseInt(parts[0].trim());
                const wertMitEinheit = parts[1].trim();
                const wert = parseEinheitUndWert(wertMitEinheit);

                if (!isNaN(anzahl) && !isNaN(wert) && anzahl > 0 && wert > 0 && anzahl <= 10000) {
                    for (let i = 0; i < anzahl; i++) {
                        masze.push(wert);
                    }
                    continue;
                }
            }
        }

        const wert = parseEinheitUndWert(line);
        if (!isNaN(wert) && wert > 0) {
            masze.push(wert);
        }
    }

    return masze.sort((a, b) => b - a);
}

function berechneOptimierung() {
    try {
        const benoetigteMasze = parseEinfacheEingabe();

        if (benoetigteMasze.length === 0) {
            alert('Bitte geben Sie mindestens eine Länge ein!');
            return;
        }

        const verfuegbareLaengen = getVerfuegbareLaengen();

        if (verfuegbareLaengen.length === 0) {
            alert('Bitte wählen Sie mindestens eine Lagerlänge aus!');
            return;
        }

        const optimierung = intelligenteOptimierung(benoetigteMasze, verfuegbareLaengen);
        zeigeErgebnisse(optimierung);

    } catch (error) {
        alert('Fehler bei der Optimierung: ' + error.message);
    }
}

function getVerfuegbareLaengen() {
    const verfuegbar = [];

    const lagerlaengen = [
        { id: 'lager-2.0', laenge: 2.0 },
        { id: 'lager-2.5', laenge: 2.5 },
        { id: 'lager-3.0', laenge: 3.0 },
        { id: 'lager-3.1', laenge: 3.1 },
        { id: 'lager-3.5', laenge: 3.5 },
        { id: 'lager-4.0', laenge: 4.0 },
        { id: 'lager-4.5', laenge: 4.5 },
        { id: 'lager-5.0', laenge: 5.0 },
        { id: 'lager-5.5', laenge: 5.5 },
        { id: 'lager-6.0', laenge: 6.0 },
        { id: 'lager-6.5', laenge: 6.5 },
        { id: 'lager-7.0', laenge: 7.0 },
        { id: 'lager-7.5', laenge: 7.5 },
        { id: 'lager-8.0', laenge: 8.0 },
        { id: 'lager-8.5', laenge: 8.5 },
        { id: 'lager-9.0', laenge: 9.0 }
    ];

    lagerlaengen.forEach(item => {
        const checkbox = document.getElementById(item.id);

        if (checkbox && checkbox.checked) {
            const anzahlInput = document.getElementById('anzahl-' + item.laenge);
            const anzahl = anzahlInput && anzahlInput.value !== '' ? parseInt(anzahlInput.value) : Infinity;

            verfuegbar.push({
                laenge: item.laenge,
                anzahl: Math.max(0, anzahl || Infinity)
            });
        }
    });

    return verfuegbar.sort((a, b) => b.laenge - a.laenge);
}

function berechneOptimaleKombination(masze, lagerlaenge, schnittblattBreite, toleranz) {
    if (masze.length > 0 && masze.every(m => Math.abs(m - masze[0]) < 0.001)) {
        const teilLaenge = masze[0];

        if (teilLaenge <= 0) {
            return { teile: [], verschnitt: lagerlaenge, realSchnitte: 0 };
        }

        let maxAnzahl = 1;

        while (maxAnzahl <= masze.length) {
            const minTeilLaenge = teilLaenge - toleranz;
            const minBenoetigterPlatz = maxAnzahl * minTeilLaenge + (maxAnzahl - 1) * schnittblattBreite;

            if (minBenoetigterPlatz > lagerlaenge) {
                maxAnzahl--;
                break;
            }
            if (maxAnzahl === masze.length) break;
            maxAnzahl++;
        }

        if (maxAnzahl > 0) {
            const teile = [];
            for (let i = 0; i < maxAnzahl; i++) {
                teile.push(teilLaenge);
            }

            const minTeilLaenge = teilLaenge - toleranz;
            const minBenoetigterPlatz = maxAnzahl * minTeilLaenge + (maxAnzahl - 1) * schnittblattBreite;
            const verfuegbarerVerschnitt = lagerlaenge - minBenoetigterPlatz;

            const verschnittProTeil = verfuegbarerVerschnitt / maxAnzahl;
            const kannVerschnittVerteilen = verschnittProTeil <= toleranz;

            let realSchnitte = maxAnzahl > 0 ? maxAnzahl - 1 : 0;
            let endVerschnitt = verfuegbarerVerschnitt;

            if (kannVerschnittVerteilen) {
                endVerschnitt = 0;
            } else {
                realSchnitte += 1;
            }

            return {
                teile: teile,
                verschnitt: endVerschnitt,
                realSchnitte: realSchnitte,
                kannVerschnittVerteilen: kannVerschnittVerteilen,
                verschnittProTeil: verschnittProTeil
            };
        }
    }

    const kombination = [];
    let verbleibendelaenge = lagerlaenge;
    const sortierteMasze = [...masze].sort((a, b) => b - a);

    for (let mass of sortierteMasze) {
        const minMass = mass - toleranz;
        const benoetigterPlatz = minMass + (kombination.length > 0 ? schnittblattBreite : 0);

        if (verbleibendelaenge >= benoetigterPlatz && minMass > 0) {
            kombination.push(mass);
            verbleibendelaenge -= benoetigterPlatz;
        }
    }

    let realSchnitte = kombination.length > 0 ? kombination.length - 1 : 0;

    if (verbleibendelaenge > toleranz) {
        realSchnitte += 1;
    }

    return {
        teile: kombination,
        verschnitt: verbleibendelaenge,
        realSchnitte: realSchnitte,
        kannVerschnittVerteilen: verbleibendelaenge <= toleranz
    };
}

function intelligenteOptimierung(masze, verfuegbareLaengen) {
    const ergebnis = [];
    const verbleibendeMapze = [...masze];
    const schnittblattBreite = parseFloat(document.getElementById('schnittblatt-breite').value) / 1000;
    const toleranz = parseFloat(document.getElementById('toleranz').value) / 1000;
    const modus = document.getElementById('optimierung-modus').value;

    const verbrauchteAnzahl = {};
    verfuegbareLaengen.forEach(lager => {
        verbrauchteAnzahl[lager.laenge] = 0;
    });

    let plattenNr = 1;

    while (verbleibendeMapze.length > 0 && plattenNr <= 100) {
        let bestePlatte = null;
        let besteKombination = [];
        let besterWert = Infinity;

        for (let lager of verfuegbareLaengen) {
            if (verbrauchteAnzahl[lager.laenge] >= lager.anzahl) {
                continue;
            }

            const kombination = berechneOptimaleKombination(verbleibendeMapze, lager.laenge, schnittblattBreite, toleranz);

            if (kombination.teile.length === 0) {
                continue;
            }

            let istBesser = false;
            if (modus === 'verschnitt') {
                istBesser = kombination.verschnitt < besterWert;
                if (istBesser) besterWert = kombination.verschnitt;
            } else {
                const schnittEffizienz = kombination.realSchnitte / kombination.teile.length;
                const verschnittMalus = kombination.verschnitt * 0.01;
                const bewertung = schnittEffizienz + verschnittMalus;

                istBesser = bewertung < besterWert;
                if (istBesser) besterWert = bewertung;
            }

            if (istBesser) {
                besteKombination = kombination.teile;
                bestePlatte = lager;
            }
        }

        if (!bestePlatte || besteKombination.length === 0) {
            break;
        }

        const finalKombination = berechneOptimaleKombination([...besteKombination], bestePlatte.laenge, schnittblattBreite, toleranz);

        ergebnis.push({
            plattenNr: plattenNr++,
            lagerlaenge: bestePlatte.laenge,
            masze: [...besteKombination],
            verschnitt: Math.max(0, finalKombination.verschnitt),
            anzahlSchnitte: besteKombination.length > 0 ? besteKombination.length - 1 : 0,
            realSchnitte: finalKombination.realSchnitte
        });

        verbrauchteAnzahl[bestePlatte.laenge]++;

        besteKombination.forEach(mass => {
            const index = verbleibendeMapze.findIndex(m => Math.abs(m - mass) < 0.0001);
            if (index > -1) {
                verbleibendeMapze.splice(index, 1);
            }
        });
    }

    return ergebnis;
}

function zeigeErgebnisse(optimierung) {
    aktuelleOptimierung = optimierung;

    const gesamtVerschnitt = optimierung.reduce((sum, p) => sum + p.verschnitt, 0);
    const gesamtMaterial = optimierung.reduce((sum, p) => sum + p.lagerlaenge, 0);

    const toleranz = parseFloat(document.getElementById('toleranz').value) / 1000;
    const schnittblattBreite = parseFloat(document.getElementById('schnittblatt-breite').value) / 1000;

    let tatsaechlichBenoetigtesMaterial = 0;
    let gesamtSchnitte = 0;

    optimierung.forEach(platte => {
        const nettoMaterialPlatte = platte.masze.reduce((sum, mass) => sum + (mass - toleranz), 0);
        tatsaechlichBenoetigtesMaterial += nettoMaterialPlatte;

        const schnittblattVerluste = platte.anzahlSchnitte * schnittblattBreite;
        tatsaechlichBenoetigtesMaterial += schnittblattVerluste;

        gesamtSchnitte += platte.realSchnitte || platte.anzahlSchnitte + (platte.verschnitt > 0.001 ? 1 : 0);
    });

    const effizienz = gesamtMaterial > 0 ? (tatsaechlichBenoetigtesMaterial / gesamtMaterial * 100) : 0;

    document.getElementById('lager-anzahl').textContent = optimierung.length + ' Stück';
    document.getElementById('gesamt-material').textContent = gesamtMaterial.toFixed(2) + ' m';
    document.getElementById('nutzen-material').textContent = tatsaechlichBenoetigtesMaterial.toFixed(2) + ' m';
    document.getElementById('gesamt-verschnitt').textContent = gesamtVerschnitt.toFixed(2) + ' m';
    document.getElementById('gesamt-schnitte').textContent = gesamtSchnitte + ' Stück';
    document.getElementById('effizienz').textContent = effizienz.toFixed(1) + '%';

    const tbody = document.getElementById('saegeplan-details');
    tbody.innerHTML = '';

    let verschnittOptimierungsTipp = '';

    optimierung.forEach(platte => {
        const row = document.createElement('tr');

        const anzahlSchnitte = platte.realSchnitte || platte.anzahlSchnitte + (platte.verschnitt > 0.001 ? 1 : 0);

        row.innerHTML =
            '<td><strong>P' + platte.plattenNr + '</strong></td>' +
            '<td>' + platte.lagerlaenge.toFixed(1) + 'm</td>' +
            '<td>' + platte.masze.map(m => m.toFixed(2) + 'm').join(', ') + '</td>' +
            '<td>' + platte.verschnitt.toFixed(3) + 'm</td>' +
            '<td>' + anzahlSchnitte + '</td>';
        tbody.appendChild(row);

        if (platte.verschnitt > 0.001) {
            const zusaetzlicheLaengeProTeil = platte.verschnitt / platte.masze.length * 1000;
            const aktuelleToleranz = toleranz * 1000;

            if (zusaetzlicheLaengeProTeil <= aktuelleToleranz) {
                const neueSchnittlaenge = (platte.masze[0] - toleranz + platte.verschnitt / platte.masze.length) * 1000;
                const originalSchnittlaenge = (platte.masze[0] - toleranz) * 1000;

                verschnittOptimierungsTipp += '<strong>Platte ' + platte.plattenNr + ':</strong> Statt ' + originalSchnittlaenge.toFixed(1) + 'mm &rarr; <strong>' + neueSchnittlaenge.toFixed(1) + 'mm</strong> schneiden (' + zusaetzlicheLaengeProTeil.toFixed(1) + 'mm länger pro Teil)<br>';
                verschnittOptimierungsTipp += '&rarr; <strong>Kein Verschnitt</strong> + <strong>1 Schnitt gespart</strong> (Verschnitt-Abtrennung entfällt)<br><br>';
            }
        }
    });

    if (verschnittOptimierungsTipp) {
        document.getElementById('optimierung-text').innerHTML = verschnittOptimierungsTipp +
            '<strong>Vorteile:</strong><br>' +
            '&bull; Kein Materialverschnitt<br>' +
            '&bull; Weniger Sägeschnitte (spart Zeit)<br>' +
            '&bull; Teile sind noch innerhalb der Toleranz<br>' +
            '<em>Längere Teile sind oft sogar besser als zu kurze!</em>';
        document.getElementById('verschnitt-optimierung').style.display = 'block';
    } else {
        document.getElementById('verschnitt-optimierung').style.display = 'none';
    }

    document.getElementById('results').style.display = 'block';
    document.getElementById('results').scrollIntoView({ behavior: 'smooth' });
}

function druckeSaegeplan() {
    if (aktuelleOptimierung.length === 0) {
        alert('Bitte erstellen Sie zuerst eine Optimierung!');
        return;
    }

    const gesamtVerschnitt = aktuelleOptimierung.reduce((sum, p) => sum + p.verschnitt, 0);
    const gesamtMaterial = aktuelleOptimierung.reduce((sum, p) => sum + p.lagerlaenge, 0);
    const effizienz = document.getElementById('effizienz').textContent;
    const gesamtSchnitte = document.getElementById('gesamt-schnitte').textContent;

    let druckHTML = '<div style="font-family: Arial, sans-serif; padding: 20px;">' +
        '<div style="text-align: center; margin-bottom: 25px; border-bottom: 3px solid #1e3c72; padding-bottom: 15px;">' +
        '<h2 style="color: #1e3c72; margin-bottom: 10px;">Dachplattenrechner.de - Verschnitt-Optimierung</h2>' +
        '<p style="color: #666; font-size: 1.1em;">Platten: ' + aktuelleOptimierung.length + ' Stück | Material: ' + gesamtMaterial.toFixed(2) + 'm | Verschnitt: ' + gesamtVerschnitt.toFixed(2) + 'm | Effizienz: ' + effizienz + ' | Schnitte: ' + gesamtSchnitte + '</p>' +
        '</div>' +
        '<table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">' +
        '<thead><tr style="background: #f0f0f0;">' +
        '<th style="border: 1px solid #333; padding: 8px; text-align: center; font-weight: bold;">Platte Nr.</th>' +
        '<th style="border: 1px solid #333; padding: 8px; text-align: center; font-weight: bold;">Lagerlänge</th>' +
        '<th style="border: 1px solid #333; padding: 8px; text-align: center; font-weight: bold;">Zu sägende Längen</th>' +
        '<th style="border: 1px solid #333; padding: 8px; text-align: center; font-weight: bold;">Verschnitt</th>' +
        '<th style="border: 1px solid #333; padding: 8px; text-align: center; font-weight: bold;">Anzahl Schnitte</th>' +
        '</tr></thead><tbody>';

    aktuelleOptimierung.forEach(platte => {
        let anzahlSchnitte = platte.realSchnitte || platte.anzahlSchnitte + (platte.verschnitt > 0.001 ? 1 : 0);

        druckHTML +=
            '<tr>' +
            '<td style="border: 1px solid #333; padding: 8px; text-align: center;"><strong>P' + platte.plattenNr + '</strong></td>' +
            '<td style="border: 1px solid #333; padding: 8px; text-align: center; font-weight: bold; color: #1e3c72;">' + platte.lagerlaenge.toFixed(1) + 'm</td>' +
            '<td style="border: 1px solid #333; padding: 8px; text-align: center;">' + platte.masze.map(m => m.toFixed(2) + 'm').join(', ') + '</td>' +
            '<td style="border: 1px solid #333; padding: 8px; text-align: center; font-weight: bold; color: #28a745;">' + platte.verschnitt.toFixed(3) + 'm</td>' +
            '<td style="border: 1px solid #333; padding: 8px; text-align: center;">' + anzahlSchnitte + '</td>' +
            '</tr>';
    });

    druckHTML += '</tbody></table></div>';

    const druckFenster = window.open('', '_blank');
    druckFenster.document.write(
        '<!DOCTYPE html><html><head><title>Sägeplan - Verschnitt-Optimierung</title>' +
        '<style>@media print { body { margin: 15mm; } table { page-break-inside: avoid; } } body { font-family: Arial, sans-serif; font-size: 11pt; }</style>' +
        '</head><body>' + druckHTML + '</body></html>'
    );
    druckFenster.document.close();
    druckFenster.focus();
    druckFenster.print();
    druckFenster.close();
}
