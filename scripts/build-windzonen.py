#!/usr/bin/env python3
"""Erzeugt public/data/windzonen.json aus der DIBt-Tabelle "Windzonen nach Verwaltungsgrenzen".

Quelle: https://www.dibt.de/fileadmin/dibt-website/Dokumente/Referat/P5/Technische_Bestimmungen/Windzonen_nach_Verwaltungsgrenzen.xlsx
Aufruf: python3 scripts/build-windzonen.py <pfad/zur/xlsx>   (benötigt openpyxl; public/data/schneelastzonen.json muss existieren)

Die Windtabelle besteht überwiegend aus Regeln im Fließtext ("Kreise A, B, C: alle Gemeinden").
Diese Regeln sind unten von Hand übertragen (Abschnittsnummern der Quelle in den Kommentaren);
nur Nordrhein-Westfalen steht als Gemeindetabelle in der Quelle und wird eingelesen.
Landkreisnamen werden gegen die Namen der Schneelastzonen-Daten aufgelöst, damit beide Datensätze
über dieselben Schlüssel verbunden sind. Zeilenformat wie bei den Schneelastzonen:
  [Bundesland, Landkreis|null, Gemeinde|null, Zone, Hinweis]
Landkreis = null bedeutet: Standard für das ganze Bundesland.
"""
import json
import re
import sys
import warnings
from pathlib import Path

import openpyxl

warnings.filterwarnings('ignore')

STAND = '2022-06-02'
ROOT = Path(__file__).resolve().parent.parent
schnee = json.loads((ROOT / 'public/data/schneelastzonen.json').read_text(encoding='utf-8'))['zeilen']
KREISE = {}  # land -> {normalisierter Name: Originalname}


def norm(s):
    s = s.lower().replace('ä', 'ae').replace('ö', 'oe').replace('ü', 'ue').replace('ß', 'ss')
    return re.sub(r'[^a-z0-9]+', ' ', s).strip()


for land, kreis, *_ in schnee:
    KREISE.setdefault(land, {})[norm(kreis)] = kreis

ALIAS = {
    ('BY', 'kempten'): 'Kempten (Allgäu)',
    ('BY', 'landeshauptstadt muenchen'): 'München',
    ('BY', 'landsberg am lech'): 'Landsberg a. Lech',
    ('TH', 'wartburg'): 'Wartburgkreis',
    ('TH', 'ilmkreis'): 'Ilm-Kreis',
}

rows = []
unresolved = []


def resolve(land, name):
    n = norm(re.sub(r'^(Kreis|Landkreis|LK|Stadt|Region|kreisfreie Stadt)\s+', '', name.strip()))
    kreise = KREISE.get(land, {})
    for kandidat in (norm(name), n, 'landkreis ' + n):
        if kandidat in kreise:
            return kreise[kandidat]
    if (land, n) in ALIAS:
        return ALIAS[(land, n)]
    unresolved.append((land, name))
    return name


def regel(land, namen, zone, hinweis=None, ausnahmen=()):
    """Landkreise/Städte mit Standardzone; ausnahmen = [(Zone, [Gemeinden], Beschreibung)]."""
    texte = [hinweis] if hinweis else []
    for z, gemeinden, beschreibung in ausnahmen:
        if beschreibung:
            texte.append(f'Abweichend Windzone {z}: {beschreibung}.')
    for name in namen:
        kreis = resolve(land, name)
        rows.append([land, kreis, None, zone, ' '.join(texte) or None])
        for z, gemeinden, _ in ausnahmen:
            for g in gemeinden:
                rows.append([land, kreis, g, z, None])


def land_standard(land, zone, hinweis=None):
    rows.append([land, None, None, zone, hinweis])


def stadt(land, name, zone):
    kreis = resolve(land, name)
    if (land, name) in unresolved:  # Stadt kommt in den Schneelastzonen-Daten nicht vor
        unresolved.remove((land, name))
        return
    rows.append([land, kreis, kreis, zone, None])


def schleswig_holstein():
    regel('SH', ['Schleswig-Flensburg', 'Flensburg'], '3', ausnahmen=[('4', ['Wohlde', 'Bergenhusen', 'Norderstapel', 'Süderstapel', 'Erfde', 'Meggerdorf', 'Tielen'], 'Amtsbereich Stapelholm (Gemeinden Wohlde, Bergenhusen, Norderstapel, Süderstapel, Erfde, Meggerdorf, Tielen)')])  # 1.1
    regel('SH', ['Nordfriesland', 'Dithmarschen'], '4')  # 1.2
    regel('SH', ['Rendsburg-Eckernförde', 'Pinneberg', 'Steinburg'], '3')  # 1.3
    rows.append(['SH', resolve('SH', 'Pinneberg'), 'Helgoland', '4', 'Insel Helgoland.'])
    regel('SH', ['Segeberg', 'Plön', 'Stormarn', 'Herzogtum Lauenburg', 'Kiel', 'Lübeck', 'Neumünster'], '2')  # 1.4
    regel('SH', ['Ostholstein'], '2', ausnahmen=[  # 1.5
        ('3', ['Gremersdorf', 'Neukirchen', 'Heringsdorf', 'Göhl', 'Grube', 'Dahme', 'Kellenhusen', 'Riepsdorf', 'Großenbrode', 'Heiligenhafen'], 'Amtsbereich Oldenburg Land (Gremersdorf, Neukirchen, Heringsdorf, Göhl, Grube, Dahme, Kellenhusen, Riepsdorf, Großenbrode, Heiligenhafen)'),
        ('4', ['Fehmarn'], 'Insel Fehmarn'),
    ])


def niedersachsen():
    regel('NI', ['Aurich', 'Wittmund', 'Friesland', 'Cuxhaven', 'Emden', 'Wilhelmshaven'], '4')  # 3.1
    regel('NI', ['Wesermarsch'], '3', ausnahmen=[('4', ['Butjadingen', 'Stadland', 'Nordenham', 'Jade', 'Ovelgönne', 'Brake'], 'Gebiete Butjadingen, Stadland, Jader Marsch mit den Gemeinden Nordenham, Jade, Ovelgönne-Brake')])  # 3.2
    regel('NI', ['Stade'], '3', ausnahmen=[('4', ['Freiburg', 'Balje', 'Krummendeich', 'Oederquart'], 'Gebiet Kehdingen mit den Gemeinden Freiburg, Balje, Krummendeich, Oederquart')])  # 3.3
    regel('NI', ['Leer'], '3', ausnahmen=[('4', ['Borkum'], 'Gemeinde Borkum')])  # 3.4
    regel('NI', ['Ammerland', 'Landkreis Oldenburg', 'Osterholz', 'Oldenburg (Oldenburg)', 'Delmenhorst'], '3')  # 3.4
    regel('NI', ['Rotenburg (Wümme)'], '2', ausnahmen=[('3', ['Geestequelle', 'Selsingen', 'Tarmstedt', 'Bremervörde', 'Gnarrenburg', 'Zeven', 'Heeslingen'], 'Samtgemeinden Geestequelle, Selsingen, Tarmstedt sowie die Gemeinden Bremervörde, Gnarrenburg, Zeven, Heeslingen')])  # 3.5
    regel('NI', ['Hannover', 'Emsland', 'Grafschaft Bentheim', 'Cloppenburg', 'Vechta', 'Diepholz', 'Verden', 'Harburg', 'Lüneburg', 'Heidekreis', 'Uelzen', 'Lüchow-Dannenberg', 'Celle', 'Nienburg (Weser)', 'Gifhorn', 'Peine', 'Helmstedt', 'Wolfenbüttel', 'Goslar', 'Wolfsburg', 'Braunschweig', 'Salzgitter'], '2')  # 3.6
    osn = ['Wallenhorst', 'Belm', 'Bissendorf', 'Melle', 'Dissen am Teutoburger Wald', 'Bad Iburg', 'Hilter am Teutoburger Wald', 'Georgsmarienhütte', 'Hagen am Teutoburger Wald', 'Hasbergen', 'Osnabrück']
    regel('NI', ['Landkreis Osnabrück'], '2', ausnahmen=[('1', osn, 'Gemeinden Wallenhorst, Belm, Bissendorf, Melle, Dissen am Teutoburger Wald, Bad Iburg, Hilter am Teutoburger Wald, Georgsmarienhütte, Hagen am Teutoburger Wald, Hasbergen')])  # 3.7
    regel('NI', ['Osnabrück'], '1')  # 3.7 (Stadt)
    regel('NI', ['Schaumburg'], '2', ausnahmen=[('1', ['Rinteln'], 'Stadt Rinteln')])  # 3.8
    regel('NI', ['Hameln-Pyrmont'], '1', ausnahmen=[('2', ['Bad Münder'], 'Stadt Bad Münder')])  # 3.9
    regel('NI', ['Hildesheim'], '2', ausnahmen=[('1', ['Duingen', 'Alfeld (Leine)', 'Freden (Leine)'], 'Gemeinden Duingen, Alfeld (Leine), Freden (Leine)')])  # 3.10
    regel('NI', ['Holzminden', 'Northeim'], '1')  # 3.11
    regel('NI', ['Göttingen'], '1', ausnahmen=[('2', ['Bad Grund (Harz)', 'Bad Lauterberg im Harz', 'Bad Sachsa', 'Herzberg am Harz', 'Osterode am Harz', 'Walkenried', 'Hattorf'], 'Gemeinden Bad Grund (Harz), Bad Lauterberg im Harz, Bad Sachsa, Herzberg am Harz, Osterode am Harz, Walkenried, Samtgemeinde Hattorf')])  # 3.11


def bremen_hamburg():
    stadt('HB', 'Bremen', '3')  # 4.1
    stadt('HB', 'Bremerhaven', '4')  # 4.2
    land_standard('HH', '2', 'Für den Hamburger Hafen gelten besondere Anforderungen der Technischen Baubestimmungen der Stadt Hamburg.')


def rheinland_pfalz():
    regel('RP', ['Ahrweiler', 'Vulkaneifel', 'Bitburg-Prüm'], '2')  # 7.1
    mosel = 'Gemeinden und Gemeindeteile rechts der Mosel liegen in Windzone 1, alle übrigen in Windzone 2.'
    regel('RP', ['Cochem-Zell', 'Bernkastel-Wittlich', 'Trier-Saarburg', 'Trier'], '2', mosel)  # 7.2
    regel('RP', ['Mayen-Koblenz', 'Koblenz'], '2', 'Gemeinden und Gemeindeteile rechts der Mosel und rechts des Rheins liegen in Windzone 1, alle übrigen in Windzone 2.')  # 7.3
    land_standard('RP', '1')  # 7.4 übrige Kreise


def baden_wuerttemberg():
    land_standard('BW', '1')  # 8.1, 8.2, 8.3, 8.4.1
    regel('BW', ['Konstanz'], '1', 'Bodenseeanrainergemeinden bis 3 km ins Landesinnere liegen in Windzone 2.')  # 8.3
    regel('BW', ['Bodensee'], '2')  # 8.4.4
    regel('BW', ['Alb-Donau-Kreis'], '1', ausnahmen=[('2', ['Balzheim', 'Dietenheim', 'Hüttisheim', 'Illerkirchberg', 'Illerrieden', 'Schnürpflingen', 'Staig'], 'Gemeinden Balzheim, Dietenheim, Hüttisheim, Illerkirchberg, Illerrieden, Schnürpflingen, Staig')])  # 8.4.2
    regel('BW', ['Bodenseekreis', 'Biberach', 'Ravensburg', 'Sigmaringen'], '2')  # 8.4.3


def bayern():
    land_standard('BY', '1')  # 9.1-9.5, 9.6.1, 9.7.1 (Unterfranken, Oberfranken, Mittelfranken, Niederbayern, Oberpfalz u. a.)
    regel('BY', ['Günzburg', 'Neu-Ulm', 'Augsburg', 'Aichach-Friedberg', 'Unterallgäu', 'Lindau (Bodensee)', 'Memmingen', 'Kaufbeuren'], '2')  # 9.6.2
    regel('BY', ['Oberallgäu'], '1', ausnahmen=[('2', ['Altusried', 'Dietmannsried', 'Haldenwang'], 'Gemeinden Altusried, Dietmannsried, Haldenwang')])  # 9.6.3
    regel('BY', ['Ostallgäu'], '2', ausnahmen=[('1', ['Pfronten', 'Hopferau', 'Nesselwang', 'Füssen', 'Schwangau', 'Rieden am Forggensee', 'Roßhaupten', 'Seeg', 'Görisried', 'Wald', 'Lengenwang', 'Stötten a. Auerberg', 'Rückholz', 'Eisenberg', 'Lechbruck', 'Halblech'], 'Gemeinden Pfronten, Hopferau, Nesselwang, Füssen, Schwangau, Rieden am Forggensee, Roßhaupten, Seeg, Görisried, Wald, Lengenwang, Stötten a. Auerberg, Rückholz, Eisenberg, Lechbruck, Halblech')])  # 9.6.4
    regel('BY', ['Dachau', 'München', 'Fürstenfeldbruck', 'Landsberg am Lech', 'Ebersberg', 'Starnberg', 'Rosenheim'], '2')  # 9.7.2 (Kreise und Städte München, Rosenheim)
    regel('BY', ['Weilheim-Schongau'], '2', ausnahmen=[('1', ['Bernbeuren'], 'Verwaltungsgemeinschaft Steingaden und Gemeinde Bernbeuren')])  # 9.7.3
    regel('BY', ['Bad Tölz-Wolfratshausen'], '1', ausnahmen=[('2', ['Wolfratshausen', 'Icking', 'Münsing', 'Egling', 'Geretsried', 'Eurasburg', 'Königsdorf', 'Bad Tölz', 'Reichersbeuern', 'Dietramszell', 'Bad Heilbrunn', 'Sachsenkam'], 'Gemeinden Wolfratshausen, Icking, Münsing, Egling, Geretsried, Eurasburg, Königsdorf, Bad Tölz, Reichersbeuern, Dietramszell, Bad Heilbrunn, Sachsenkam')])  # 9.7.4
    regel('BY', ['Miesbach'], '1', ausnahmen=[('2', ['Holzkirchen', 'Otterfing', 'Warngau', 'Valley', 'Weyarn', 'Irschenberg', 'Miesbach', 'Gmund a. Tegernsee', 'Waakirchen', 'Hausham'], 'Gemeinden Holzkirchen, Otterfing, Warngau, Valley, Weyarn, Irschenberg, Miesbach, Gmund a. Tegernsee, Waakirchen, Hausham')])  # 9.7.5
    regel('BY', ['Traunstein'], '2', ausnahmen=[('1', ['Grassau', 'Schleching', 'Staudach-Egerndach', 'Marquartstein', 'Unterwössen', 'Reit im Winkl', 'Ruhpolding', 'Bergen', 'Siegsdorf', 'Inzell', 'Surberg', 'Petting', 'Wonneberg', 'Waging a. See', 'Kirchanschöring', 'Fridolfing', 'Taching a. See', 'Palling', 'Tittmoning', 'Engelsberg', 'Tacherting'], 'Gemeinden Grassau, Schleching, Staudach-Egerndach, Marquartstein, Unterwössen, Reit im Winkl, Ruhpolding, Bergen, Siegsdorf, Inzell, Surberg, Petting, Wonneberg, Waging a. See, Kirchanschöring, Fridolfing, Taching a. See, Palling, Tittmoning, Engelsberg, Tacherting')])  # 9.7.6
    regel('BY', ['Rosenheim'], '2', ausnahmen=[('1', ['Kiefersfelden', 'Oberaudorf', 'Flintsbach a.Inn', 'Brannenburg', 'Nußdorf a.Inn', 'Samerberg', 'Aschau i.Chiemgau'], 'Gemeinden Kiefersfelden, Oberaudorf, Flintsbach a.Inn, Brannenburg, Nußdorf a.Inn, Samerberg, Aschau i.Chiemgau')])  # 9.7.7


def thueringen():
    regel('TH', ['Schmalkalden-Meiningen', 'Hildburghausen', 'Sonneberg', 'Suhl'], '1')  # 16.1
    regel('TH', ['Wartburgkreis'], '1', ausnahmen=[('2', ['Behringen', 'Berka v.d. Hainich', 'Creuzburg', 'Falken', 'Großenlipnitz', 'Ifta', 'Mihla', 'Nazza', 'Reichenbach', 'Ruhla', 'Schnellmannshausen', 'Treffurt', 'Tüngeda', 'Wutha-Farnroda'], 'Gemeinden Behringen, Berka v.d. Hainich, Creuzburg, Falken, Großenlipnitz, Ifta, Mihla, Nazza, Reichenbach, Ruhla, Schnellmannshausen, Treffurt, Tüngeda, Wutha-Farnroda')])  # 16.2
    regel('TH', ['Eichsfeld', 'Nordhausen', 'Unstrut-Hainich-Kreis', 'Kyffhäuserkreis', 'Sömmerda', 'Gotha', 'Ilm-Kreis', 'Weimarer Land', 'Greiz', 'Saale-Holzland-Kreis', 'Saalfeld-Rudolstadt', 'Altenburger Land', 'Saale-Orla-Kreis', 'Erfurt', 'Weimar', 'Jena', 'Gera', 'Eisenach'], '2')  # 16.3


def mecklenburg_vorpommern():
    # Zone 2: 13.1-13.4, Zone 3: 13.5-13.8, Zone 4: 13.9 (verbundene Zellen der Quelle)
    regel('MV', ['Ludwigslust-Parchim', 'Mecklenburgische Seenplatte', 'Vorpommern-Greifswald'], '2')  # 13.1
    for name in ('Greifswald', 'Güstrow', 'Neubrandenburg', 'Schwerin', 'Teterow'):
        stadt('MV', name, '2')  # 13.4
    regel('MV', ['Nordwestmecklenburg'], '3', 'Alle Gemeinden in den Amtsgebieten Gadebusch und Lützow-Lübstorf liegen in Windzone 2.')  # 13.2, 13.5
    regel('MV', ['Landkreis Rostock'], '3', 'Alle Gemeinden in den Amtsgebieten Bützow-Land, Güstrow-Land, Laage, Krakow am See, Mecklenburgische Schweiz und Gnoien liegen in Windzone 2.')  # 13.3, 13.5
    regel('MV', ['Vorpommern-Rügen'], '3', 'Alle Gemeinden in den Amtsgebieten West-Rügen (einschließlich Insel Hiddensee), Nord-Rügen und Bergen liegen in Windzone 4, ausgenommen Gustow, Poseritz und Garz/Rügen.')  # 13.6, 13.9
    for name in ('Rostock', 'Stralsund', 'Wismar'):
        stadt('MV', name, '3')  # 13.8


def nordrhein_westfalen(wb):
    ws = next(w for w in wb if w.title.startswith('NW'))
    for r in ws.iter_rows(min_row=3, values_only=True):
        kreis, gem, z = (str(r[0] or '').strip(), str(r[2] or '').strip(), str(r[3] or '').strip())
        if not kreis or z not in ('1', '2', '3', '4'):
            continue
        kreis = resolve('NW', kreis)
        if gem.lower().startswith('alle'):
            rows.append(['NW', kreis, None, z, 'Alle Gemeinden, außer Gladbeck (Windzone 1).' if 'außer' in gem else None])
        elif gem == kreis:
            rows.append(['NW', kreis, kreis, z, None])
        else:
            rows.append(['NW', kreis, gem, z, None])


def main():
    wb = openpyxl.load_workbook(Path(sys.argv[1]), data_only=True)
    schleswig_holstein(); niedersachsen(); bremen_hamburg(); rheinland_pfalz(); baden_wuerttemberg()
    bayern(); thueringen(); mecklenburg_vorpommern(); nordrhein_westfalen(wb)
    for land in ('HE', 'SL', 'SN', 'ST'):
        land_standard(land, {'HE': '1', 'SL': '1', 'SN': '2', 'ST': '2'}[land])
    land_standard('BE', '2'); land_standard('BB', '2')

    # Prüfung: Jeder Landkreis der Schneedaten muss eine Windzone bekommen (Kreisregel, Gemeindezeilen oder Landesstandard)
    standard = {r[0] for r in rows if r[1] is None}
    kreis_regeln = {(r[0], r[1]) for r in rows if r[1] is not None}
    fehlend = sorted({(l, k) for l, k, *_ in schnee if l not in standard and (l, k) not in kreis_regeln})
    nicht_aufgeloest = sorted({u for u in unresolved})
    print(f'{len(rows)} Zeilen')
    print('Nicht aufgelöste Namen:', nicht_aufgeloest)
    print('Landkreise ohne Windzone:', fehlend)

    out = {'stand': STAND, 'quelle': 'DIBt, Zuordnung der Windzonen nach Verwaltungsgrenzen', 'zeilen': rows}
    target = ROOT / 'public' / 'data' / 'windzonen.json'
    target.write_text(json.dumps(out, ensure_ascii=False, separators=(',', ':')), encoding='utf-8')
    print(f'-> {target}')


if __name__ == '__main__':
    main()
