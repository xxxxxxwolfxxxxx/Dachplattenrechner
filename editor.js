// editor.js – modularisiert für alle Formen

import * as Dreieck from './figures/dreieck.js';
import * as Rechteck from './figures/rechteck.js';
import * as Kreis from './figures/kreis.js';
import * as Vieleck from './figures/vieleck.js';
import * as Trapez from './figures/trapez.js';
import * as Rhombus from './figures/rhombus.js';
import * as Langloch from './figures/langloch.js';

document.addEventListener('DOMContentLoaded', () => {
  const dataString = localStorage.getItem('dachplattenrechner_data');
  if (!dataString) {
    console.warn('Keine Projektinformationen gefunden.');
    return;
  }

  const projectData = JSON.parse(dataString);
  const shape = projectData.baseShape?.toLowerCase?.() || '';
  const variant = projectData.variant?.toLowerCase?.() || '';

  switch (shape) {
    case 'dreieck':
      Dreieck.init(projectData);
      break;
    case 'rechteck':
    case 'quadrat':
      Rechteck.init(projectData);
      break;
    case 'kreis':
    case 'halbkreis':
    case 'viertelkreis':
      Kreis.init(projectData);
      break;
    case 'trapez':
      Trapez.init(projectData);
      break;
    case 'rhombus':
      Rhombus.init(projectData);
      break;
    case 'langloch':
      Langloch.init(projectData);
      break;
    case 'fuenfeck':
    case 'sechseck':
    case 'achteck':
    case 'vieleck':
      Vieleck.init(projectData);
      break;
    default:
      console.warn('Keine passende Formmodul-Zuordnung gefunden:', shape);
  }
});
