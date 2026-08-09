/**
 * Farbkatalog - Tabs und Suche.
 *
 * Die Farbkarten werden von Astro serverseitig gerendert (src/data/farben.ts).
 * Dieses Skript baut kein HTML mehr auf, es blendet vorhandene Karten nur ein
 * und aus. Ohne JavaScript bleibt der komplette Katalog lesbar.
 */
(function () {
  'use strict';

  var SUCHE_MIN_LAENGE = 1;

  var tabButtons = Array.prototype.slice.call(document.querySelectorAll('.tab-btn'));
  var tabPanels = Array.prototype.slice.call(document.querySelectorAll('.tab-content'));
  var searchInput = document.getElementById('searchInput');
  var searchStatus = document.getElementById('searchStatus');
  var cards = Array.prototype.slice.call(document.querySelectorAll('.color-card'));
  var groups = Array.prototype.slice.call(document.querySelectorAll('.color-group'));

  if (!tabButtons.length || !cards.length) return;

  function switchTab(tab) {
    tabButtons.forEach(function (button) {
      var active = button.dataset.tab === tab;
      button.classList.toggle('active', active);
      button.setAttribute('aria-selected', active ? 'true' : 'false');
    });

    tabPanels.forEach(function (panel) {
      panel.classList.toggle('active', panel.id === tab + '-tab');
    });

    // Trefferzahl bezieht sich auf den aktiven Tab und muss neu ermittelt werden.
    if (searchInput) filterColors(searchInput.value);
  }

  function filterColors(searchTerm) {
    var term = searchTerm.trim().toLowerCase();
    var treffer = 0;

    var aktivesPanel = document.querySelector('.tab-content.active');

    cards.forEach(function (card) {
      var sichtbar = term.length < SUCHE_MIN_LAENGE || card.dataset.search.indexOf(term) !== -1;
      card.hidden = !sichtbar;
      // Der Zaehler bezieht sich auf den sichtbaren Tab, sonst meldet die
      // Statuszeile Treffer, die im anderen Tab liegen.
      if (sichtbar && aktivesPanel && aktivesPanel.contains(card)) treffer++;
    });

    // Gruppen ohne Treffer komplett ausblenden, sonst bleiben leere
    // Ueberschriften mit Einleitungstext stehen.
    groups.forEach(function (group) {
      var sichtbareKarten = group.querySelectorAll('.color-card:not([hidden])').length;
      group.hidden = sichtbareKarten === 0;
    });

    if (!searchStatus) return;

    if (term.length < SUCHE_MIN_LAENGE) {
      searchStatus.textContent = '';
    } else if (treffer === 0) {
      searchStatus.textContent = 'Kein Farbton gefunden für „' + searchTerm.trim() + '“';
    } else {
      searchStatus.textContent = treffer === 1 ? '1 Farbton gefunden' : treffer + ' Farbtöne gefunden';
    }
  }

  tabButtons.forEach(function (button) {
    button.addEventListener('click', function () {
      switchTab(button.dataset.tab);
    });
  });

  if (searchInput) {
    searchInput.addEventListener('input', function () {
      filterColors(this.value);
    });
  }
})();
