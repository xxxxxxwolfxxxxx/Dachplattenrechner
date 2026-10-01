#!/usr/bin/env python3
"""Wandelt die DIBt-Tabelle "Schneelastzonen nach Verwaltungsgrenzen" in public/data/schneelastzonen.json.

Quelle: https://www.dibt.de/fileadmin/dibt-website/Dokumente/Referat/P5/Technische_Bestimmungen/Schneelastzonen_nach_Verwaltungsgrenzen.xlsx
Aufruf: python3 scripts/build-schneelastzonen.py <pfad/zur/xlsx>   (benötigt openpyxl)

Die Tabellen sind je Bundesland anders aufgebaut. Jeder Eintrag im Ergebnis hat die Form
  [Bundesland, Landkreis, Gemeinde|null, Zone, Hinweis]
Gemeinde = null bedeutet: Standardzone des ganzen Landkreises (Ausnahmen stehen als eigene Einträge
bzw. im Hinweis).
"""
import json
import re
import sys
import warnings
from pathlib import Path

import openpyxl

warnings.filterwarnings('ignore')

STAND = '2023-02-07'
ZONEN = {'1', '1a', '2', '2a', '3', '3a', '>3a', '>3'}
TIEFLAND = 'Norddeutsches Tiefland: Nachweis zusätzlich für den 2,3-fachen Wert als außergewöhnliche Einwirkung (DIN EN 1991-1-3/NA, 4.3).'

rows_out = []


def clean(v):
    if v is None:
        return ''
    return re.sub(r'\s+', ' ', str(v).replace('\xa0', ' ')).strip()


def zone(v):
    z = clean(v).lower().replace(' ', '').replace('slz', '')
    return z if z in ZONEN else None


def kreis_name(v):
    s = clean(v)
    for p in ('LK ', 'SK ', 'Landkreis ', 'Kreisfreie Stadt ', 'Stadt ', 'Region '):
        if s.startswith(p):
            s = s[len(p):]
    return s


def add(land, kreis, gemeinde, z, note=''):
    if z is None:
        raise ValueError(f'Keine Zone: {land} {kreis} {gemeinde}')
    rows_out.append([land, kreis, gemeinde or None, z, note or None])


def split_names(text):
    """Trennt Gemeindelisten an Komma und 'und', ignoriert Kommas in Klammern."""
    text = re.sub(r'^(folgende Gemeinden:|außer (den|der|dem)? ?(Gemeinden?|Ortsteilen?)?)', '', clean(text)).strip()
    parts, depth, cur = [], 0, ''
    for ch in text:
        depth += ch == '('
        depth -= ch == ')'
        if ch == ',' and depth == 0:
            parts.append(cur)
            cur = ''
        else:
            cur += ch
    parts.append(cur)
    out = []
    for p in parts:
        if depth == 0 and ' und ' in p and '(' not in p:
            out.extend(p.split(' und '))
        else:
            out.append(p)
    names = []
    for n in out:
        n = clean(n)
        n = re.sub(r'^(der\s+)?(Stadt|Samtgemeinde|Gemeinde)\s+', '', n)
        if n:
            names.append(n)
    return names


ALLE = re.compile(r'^alle(\s|,|;|$)', re.I)
AUSSER = re.compile(r'(?:außer|bis auf)\s*:?\s*(.*?)\s*=?\s*SLZ\s*=?\s*([0-9]a?)', re.I)


def kreisweit(land, kreis, text, z, note=''):
    """Zeile "alle Gemeinden" (evtl. "alle außer A, B = SLZ 2a"): Standardzone des Landkreises plus Ausnahmegemeinden."""
    add(land, kreis, None, z, note)
    m = AUSSER.search(text.replace('\n', ' '))
    if not m:
        return
    namen = split_names(m.group(1).strip(' :;'))
    add_hinweis(land, kreis, f'Abweichend Zone {m.group(2)}: {", ".join(namen)}.')
    for n in namen:
        add(land, kreis, n, m.group(2), '')


def with_key_table(ws, land, zone_col=4, note_col=5, first=1):
    """Format: Land | Landkreis | Gemeindeschlüssel | Gemeinde | Zone | Fußnote."""
    staedte = {clean(r[1]) for r in ws.iter_rows(min_row=first + 1, values_only=True)
               if r[0] and clean(r[2]).lower() != 'alle' and clean(r[3]) == clean(r[1])}
    for r in ws.iter_rows(min_row=first + 1, values_only=True):
        if not r[0] or clean(r[0]).upper() != land:
            continue
        kreis, key, gem = clean(r[1]), clean(r[2]), clean(r[3])
        if key.lower() == 'alle' and kreis in staedte:
            kreis = f'Landkreis {kreis}'
        z = zone(r[zone_col])
        note = clean(r[note_col]) if len(r) > note_col else ''
        note = TIEFLAND if 'tief' in note.lower() else ''
        if z is None:
            # RP: fünf Zeilen ohne Zone werden unten gesondert geprüft
            raise ValueError(f'{land}: Zone fehlt in Zeile {r[:5]}')
        if key.lower() == 'alle':
            extra = re.search(r'außer(.*?)=\s*SLZ\s*([0-9a]+)', r[3] and str(r[3]).replace('\n', ' ') or '', re.I)
            hinweis = note
            if extra:
                hinweis = (note + ' ' if note else '') + f'Ausnahme: {clean(extra.group(1)).strip(": ")} = Zone {extra.group(2)}.'
            add(land, kreis, None, z, hinweis)
            if extra:
                for n in split_names(extra.group(1).strip(': ')):
                    add(land, kreis, n, extra.group(2), '')
        else:
            add(land, kreis, gem or kreis, z, note)


def parse_simple_states(wb):
    for prefix, land in [('SH', 'SH'), ('HH', 'HH'), ('HB', 'HB'), ('SL', 'SL'), ('BE', 'BE'), ('BB', 'BB'), ('TH', 'TH'), ('HE', 'HE')]:
        ws = next(w for w in wb if w.title.startswith(prefix))
        with_key_table(ws, land)


def parse_by(wb):
    ws = next(w for w in wb if w.title.startswith('BY'))
    for r in ws.iter_rows(min_row=2, values_only=True):
        if not r[3]:
            continue
        z = zone(r[4])
        if z is None:
            continue
        kreis = clean(r[1]) or 'Bodensee'
        if ALLE.match(clean(r[3])):
            kreisweit('BY', kreis, clean(r[3]), z)
            continue
        add('BY', kreis, clean(r[3]), z, 'Sonderzone aus dem Bayerischen Forschungsprojekt.' if z in ('3a', '>3a') else '')


def parse_rp(wb):
    ws = next(w for w in wb if w.title.startswith('RP'))
    for r in ws.iter_rows(min_row=2, values_only=True):
        if not r[0] or not clean(r[3]):
            continue
        z = zone(r[4])
        foot = clean(r[5])
        if z is None:
            continue
        note = ''
        if 'Exklave' in foot:
            note = 'Exklaven dieser Gemeinde liegen in Zone 2.'
        if ALLE.match(clean(r[3])):
            kreisweit('RP', clean(r[1]), clean(r[3]), z)
            continue
        add('RP', clean(r[1]), clean(r[3]), z, note)


def parse_nw(wb):
    ws = next(w for w in wb if w.title.startswith('NW'))
    for r in ws.iter_rows(min_row=4, values_only=True):
        z = zone(r[3])
        if z is None or not r[2]:
            continue
        if ALLE.match(clean(r[2])):
            kreisweit('NW', clean(r[0]), clean(r[2]), z)
            continue
        add('NW', clean(r[0]), clean(r[2]), z, '')


def parse_ni(wb):
    ws = next(w for w in wb if w.title.startswith('NI'))
    foot = {
        '1)': TIEFLAND,
        '2)': 'Zone 3 ist anzusetzen, wenn das Bauvorhaben nördlich der B 243 oberhalb der 300-m-Höhenlinie liegt.',
        '3)': 'Anzusetzende Schneelast: s_k = 5,5 kN/m².',
    }
    staedte = {kreis_name(clean(r[1])) for r in ws.iter_rows(min_row=2, values_only=True)
               if r[0] and clean(r[1]).startswith('Stadt ')}
    kreis, ist_stadt = None, False
    for r in ws.iter_rows(min_row=2, values_only=True):
        txt, z_raw, fn = clean(r[1]), r[2], clean(r[3])
        if not txt or txt.startswith(('1)', '2)', '3)')):
            continue
        z = zone(z_raw)
        if r[0]:
            ist_stadt = txt.startswith('Stadt ')
            kreis = kreis_name(txt)
            if not ist_stadt and kreis in staedte:
                kreis = f'Landkreis {kreis}'
            if z is None:
                continue
            add('NI', kreis, kreis if ist_stadt else None, z, foot.get(fn, ''))
        elif txt.startswith('außer') and z is not None:
            ausnahme = re.sub(r'^außer (den |der )?(Gemeinden |Ortsteilen )?', '', txt)
            hinweis = f'Abweichend Zone {z}: {ausnahme}.'
            add_hinweis('NI', kreis, hinweis)
            if 'Ortsteil' in txt:
                continue  # Harz-Ortsteile werden unten gesondert aufgeführt
            for n in split_names(txt):
                add('NI', kreis, n, z, foot.get(fn, ''))
    # Harz: Ortsteile mit s_k = 5,5 kN/m² (Fußnote 3), Gemeinden Altenau und Braunlage
    harz = 'Anzusetzende Schneelast: s_k = 5,5 kN/m².'
    for n, teil in [('Torfhaus', 'Altenau'), ('Bastesiedlung', 'Altenau'), ('Königskrug', 'Braunlage'),
                    ('St. Andreasberg', 'Braunlage'), ('Sonnenberg', 'Braunlage'), ('Oderbrück', 'Braunlage'),
                    ('Oderberg', 'Braunlage'), ('Hohegeiß', 'Braunlage')]:
        add('NI', 'Goslar', n, '>3', f'Ortsteil von {teil}. {harz}')
    add('NI', 'Goslar', 'Altenau', '3', 'Die Ortsteile Torfhaus und Bastesiedlung liegen oberhalb von Zone 3 (s_k = 5,5 kN/m²).')
    add('NI', 'Goslar', 'Braunlage', '3', 'Die Ortsteile Königskrug, St. Andreasberg, Sonnenberg, Oderbrück, Oderberg und Hohegeiß liegen oberhalb von Zone 3 (s_k = 5,5 kN/m²).')


def add_hinweis(land, kreis, text):
    for row in rows_out:
        if row[0] == land and row[1] == kreis and row[2] is None:
            row[4] = f'{row[4]} {text}' if row[4] else text
            return


def parse_bw(wb):
    ws = next(w for w in wb if w.title.startswith('BW'))
    staedte = {kreis_name(clean(r[1])) for r in ws.iter_rows(min_row=2, values_only=True) if clean(r[1]).startswith('SK ')}
    kreis, ist_stadt = None, False
    for r in ws.iter_rows(min_row=2, values_only=True):
        if not r[0]:
            continue
        k, gem, z_raw = clean(r[1]), clean(r[2]), r[3]
        if k.startswith('Regierungsbezirk'):
            continue
        if k:
            ist_stadt = k.startswith('SK ')
            kreis = kreis_name(k)
            if not ist_stadt and kreis in staedte:
                kreis = f'Landkreis {kreis}'
        # Zone steht je nach Zeile in Spalte 2 oder 3 (Stadtkreise ohne Gemeindespalte)
        z = zone(z_raw) or zone(r[2])
        if z is None or kreis is None:
            continue
        if not zone(r[2]) and gem.lower().startswith('alle gemeinden'):
            add('BW', kreis, None, z, 'Gilt für alle übrigen Gemeinden.' if 'sofern' in gem.lower() else '')
        elif not gem or zone(r[2]):
            add('BW', kreis, kreis if ist_stadt else None, z, '')
        elif gem == 'Bodensee':
            add('BW', 'Bodensee', 'Bodensee', z, '')
        else:
            for n in split_names(gem):
                add('BW', kreis, n, z, '')


def parse_mv(wb):
    """Manuell nach Struktur der Quelle (verbundene Zellen: Zeilen 2-5 = Zone 2, Zeilen 6-11 = Zone 3)."""
    ws = next(w for w in wb if w.title.startswith('MV'))
    zonen = {}
    for rng in ws.merged_cells.ranges:
        if rng.min_col == 4:
            z = clean(ws.cell(rng.min_row, 4).value)
            for rr in range(rng.min_row, rng.max_row + 1):
                zonen[rr] = z
    for rr in range(2, 12):
        zonen.setdefault(rr, clean(ws.cell(rr, 4).value))
    for rr in range(2, 12):
        kreise, bem, z = clean(ws.cell(rr, 2).value), clean(ws.cell(rr, 3).value), zonen.get(rr)
        if not kreise or z not in ('2', '3'):
            continue
        for raw in [clean(x) for x in kreise.split(',')]:
            if not bem:  # kreisfreie bzw. große kreisangehörige Städte
                add('MV', raw, raw, z, '')
                continue
            k = raw if raw.startswith('LK ') is False else f'Landkreis {raw[3:]}'
            if bem.startswith('folgende Gemeinden'):
                gebiete = [n for n in split_names(bem) if n.lower().startswith('alle gemeinden')]
                for n in [n for n in split_names(bem) if n not in gebiete]:
                    add('MV', k, n, z, '')
                if gebiete:
                    add_hinweis('MV', k, f'Abweichend Zone {z}: ' + ' und '.join(gebiete) + '.')
            elif 'alle Gemeinden, soweit nicht' in bem:
                other = '3' if z == '2' else '2'
                add('MV', k, None, z, f'Gilt für alle übrigen Gemeinden; einzelne Gemeinden liegen in Zone {other}.')
            else:
                add('MV', k, None, z, '')
    # Kreisfreie Städte / große kreisangehörige Städte sind in der Quelle als Landkreis genannt
    # und werden oben bereits als Landkreis-Einträge geführt.


def parse_sn(wb):
    ws = next(w for w in wb if w.title.startswith('SN'))
    z, kreis = None, None
    teile = {}  # (Kreis, Gemeinde) -> [(Zone, Gemeindeteil oder '')], Reihenfolge bleibt erhalten
    for r in ws.iter_rows(values_only=True):
        a = clean(r[0])
        m = re.match(r'Schneelastzone (\d)', a)
        if m:
            z = m.group(1)
            continue
        if a != 'SN' or z is None:
            continue
        k, gem, teil = clean(r[1]), clean(r[2]), clean(r[3])
        if k:
            kreis = k.replace('Kreisfreie Stadt ', '').replace('Landkreis ', '')
        if not gem:
            if k:
                add('SN', kreis, kreis if k.startswith('Kreisfreie') else None, z, '')
            continue
        name = re.sub(r',\s*Stadt(/.*)?$', '', gem)
        eigener_teil = not teil or teil == gem
        teile.setdefault((kreis, name), []).append((z, '' if eigener_teil else teil))
    for (kreis, name), liste in teile.items():
        zonen = {zz for zz, _ in liste}
        if len(zonen) == 1:
            teil_text = [t for _, t in liste if t]
            note = f'Nur der Gemeindeteil {teil_text[0]} liegt in dieser Zone.' if teil_text and all(teil_text) else ''
            add('SN', kreis, name, liste[0][0], note)
            continue
        # Gemeinde liegt in zwei Zonen: Zone des Hauptteils, sonst die höhere; alle Teile im Hinweis
        haupt = next((zz for zz, t in liste if not t), max(zonen))
        teile_text = '; '.join(f'Zone {zz}: Gemeindeteil {t}' if t else f'Zone {zz}: übrige Gemeinde' for zz, t in liste)
        add('SN', kreis, name, haupt, f'Die Gemeinde liegt in mehreren Zonen ({teile_text}).')


def parse_st(wb):
    ws = next(w for w in wb if w.title.startswith('ST'))
    kreis = None
    for r in ws.iter_rows(min_row=2, values_only=True):
        if not r[0] and not r[2]:
            continue
        k, gem, z, fn = clean(r[1]), clean(r[2]), zone(r[3]), clean(r[4])
        if z is None:
            continue
        note = TIEFLAND if 'tief' in fn.lower() else ''
        rest = re.sub(r'^\*\s*Nordd?\.\s*Tiefld?\.?\s*', '', fn).strip()
        if rest:
            note = (note + ' ' if note else '') + f'Hinweis der Quelle: {rest}'
        if k:
            kreis = k
            if gem.lower() == 'alle':
                add('ST', kreis, None, z, note)
            else:
                add('ST', kreis, gem, z, note)
        elif kreis is None:  # kreisfreie Städte am Tabellenanfang
            name = 'Halle (Saale)' if gem.startswith('Halle') else gem
            add('ST', name, name, z, note)
        else:  # Harz: Einzelgemeinden mit abweichender Zone
            name = gem.replace('Ilsenburg(Harz)', 'Ilsenburg (Harz)')
            teil = re.match(r'Ilsenburg \(Harz\), Ortsteil (.+)', name)
            if teil:
                add('ST', kreis, teil.group(1), z, 'Ortsteil von Ilsenburg (Harz).')
            else:
                add('ST', kreis, name, z, note)


def main():
    src = Path(sys.argv[1])
    wb = openpyxl.load_workbook(src, data_only=True)
    parse_simple_states(wb)
    parse_by(wb)
    parse_rp(wb)
    parse_nw(wb)
    parse_ni(wb)
    parse_bw(wb)
    parse_mv(wb)
    parse_sn(wb)
    parse_st(wb)
    seen, uniq = set(), []
    for row in rows_out:
        key = tuple(row[:4])
        if key not in seen:
            seen.add(key)
            uniq.append(row)
    out = {'stand': STAND, 'quelle': 'DIBt, Zuordnung der Schneelastzonen nach Verwaltungsgrenzen', 'zeilen': uniq}
    target = Path(__file__).resolve().parent.parent / 'public' / 'data' / 'schneelastzonen.json'
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text(json.dumps(out, ensure_ascii=False, separators=(',', ':')), encoding='utf-8')
    print(f'{len(uniq)} Einträge -> {target}')


if __name__ == '__main__':
    main()
