"""Namensabgleich für Gemeinden zwischen DIBt-Tabellen, BKG VG250 und Destatis (gemeinsam genutzt von den build-Skripten)."""
import re


def norm(s):
    s = s.lower().replace('ä', 'ae').replace('ö', 'oe').replace('ü', 'ue').replace('ß', 'ss')
    return re.sub(r'[^a-z0-9]+', ' ', s).strip()


# Namenszusätze, ab denen der Kernname endet ("Rosenbach im Vogtland", "Neustadt in Sachsen")
_ZUSATZ = re.compile(r'\s+(im|in|an|am|bei|auf|ob|i\.|a\.|i\.d\.)\s.*$', re.I)


def kernname(name):
    """Vergleichsschlüssel: ohne ", Stadt"/", Kurort", ohne Doppelnamen nach "/" und ohne Lagezusatz."""
    n = re.sub(r',.*$', '', name.strip())
    n = n.split('/')[0]
    return norm(_ZUSATZ.sub('', n))


class Namensindex:
    """Ordnet Gemeindenamen (je Land und Landkreis) einem Wert zu. Suche: exakt, sonst eindeutig über den Kernnamen."""

    def __init__(self):
        self._exakt = {}
        self._kern = {}

    def add(self, land, kreis, name, wert):
        self._exakt[(land, kreis, norm(name))] = wert
        self._kern.setdefault((land, kreis, kernname(name)), set()).add(wert)

    def finde(self, land, kreis, name):
        wert = self._exakt.get((land, kreis, norm(name)))
        if wert is not None:
            return wert
        werte = self._kern.get((land, kreis, kernname(name)), set())
        return next(iter(werte)) if len(werte) == 1 else None
