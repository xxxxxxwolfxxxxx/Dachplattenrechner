let currentMap = 'schnee';
function toggleMap(type) {
  currentMap = type;
  document.getElementById('btnSchnee').classList.toggle('active', type === 'schnee');
  document.getElementById('btnWind').classList.toggle('active', type === 'wind');
  document.getElementById('mapSchnee').classList.toggle('hidden', type !== 'schnee');
  document.getElementById('mapWind').classList.toggle('hidden', type !== 'wind');
  updateMapLegend();
}

function updateMapLegend() {
  const legend = document.getElementById('mapLegend');
  let html = '';
  if (currentMap === 'schnee') {
    html = '<h4>Schneelastzonen – Mindestwerte der Schneelast am Boden</h4><div class="legend-grid">';
    html += '<div class="legend-item"><div class="legend-color" style="background:#e6f2ff"></div><span>Zone 1: 65 kg/m²</span></div>';
    html += '<div class="legend-item"><div class="legend-color" style="background:#b3d9ff"></div><span>Zone 1a: 81 kg/m²</span></div>';
    html += '<div class="legend-item"><div class="legend-color" style="background:#80bfff"></div><span>Zone 2: 85 kg/m²</span></div>';
    html += '<div class="legend-item"><div class="legend-color" style="background:#4da6ff"></div><span>Zone 2a: 106 kg/m²</span></div>';
    html += '<div class="legend-item"><div class="legend-color" style="background:#1a8cff"></div><span>Zone 3: 110 kg/m²</span></div>';
    html += '</div>';
  } else {
    html = '<h4>Windzonen – Staudruckwerte</h4><div class="legend-grid">';
    html += '<div class="legend-item"><div class="legend-color" style="background:#f5e6d3"></div><span>Zone 1: 32 kg/m²</span></div>';
    html += '<div class="legend-item"><div class="legend-color" style="background:#ffd966"></div><span>Zone 2: 39 kg/m²</span></div>';
    html += '<div class="legend-item"><div class="legend-color" style="background:#f2a74b"></div><span>Zone 3: 47 kg/m²</span></div>';
    html += '<div class="legend-item"><div class="legend-color" style="background:#d9692a"></div><span>Zone 4: 56 kg/m²</span></div>';
    html += '</div>';
  }
  legend.innerHTML = html;
}

document.addEventListener('DOMContentLoaded', function() {
  updateMapLegend();
});
