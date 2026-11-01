// Pantalla "Mapas": el barrio dibujado, con un alfiler en cada lugar donde se juega.
// Los desbloqueados se ven de color; los bloqueados, en gris con candado y su nivel,
// para que se sepa qué viene al subir de nivel. Tocando uno se ve su ficha.
import { MAPAS, MAPAS_CIRCULO } from '../mapas.js';
import { NIVELES } from '../progreso.js';
import { trazarMapa } from '../escenario/canal.js';
import { tx } from '../textos.js';

// Dónde está cada lugar en el dibujo del barrio (viewBox 360 × 480).
const LUGARES = {
  patio: [70, 405],
  calle: [180, 318],
  escuela: [288, 420],
  avenida: [182, 212],
  zigzag: [78, 262],
  mercado: [290, 290],
  barrio: [80, 160],
  quebrada: [292, 168],
  cerro: [236, 66],
  laberinto: [82, 62],
};

// El dibujo del barrio: pasto, calles, río, cerro, casas, escuela, mercado y árboles.
const DIBUJO = `
<defs>
  <linearGradient id="mm-pasto" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5f8f3a"/><stop offset="1" stop-color="#3f6e2a"/></linearGradient>
  <linearGradient id="mm-cerro" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8a6a3a"/><stop offset="1" stop-color="#5a7a35"/></linearGradient>
</defs>
<rect width="360" height="480" fill="url(#mm-pasto)"/>
<path d="M150 0 C 200 30 280 20 360 50 L360 0Z" fill="#9fc7e8" opacity=".5"/>
<path d="M120 110 C 170 20 290 10 350 100 Z" fill="url(#mm-cerro)"/>
<path d="M190 60 l10 -14 l10 14 M250 70 l12 -16 l12 16" stroke="#3f6e2a" stroke-width="4" fill="none"/>
<path d="M360 120 C 300 140 330 190 270 200 C 220 210 250 250 300 250 C 340 250 330 220 360 215" fill="none" stroke="#4a9ad8" stroke-width="14" stroke-linecap="round"/>
<path d="M360 120 C 300 140 330 190 270 200 C 220 210 250 250 300 250 C 340 250 330 220 360 215" fill="none" stroke="#8fd0f5" stroke-width="4" stroke-dasharray="6 10" stroke-linecap="round"/>
<g stroke="#555a60" stroke-width="26" fill="none" stroke-linecap="round">
  <path d="M-10 230 H370"/><path d="M180 480 V120"/><path d="M-10 350 H370"/><path d="M40 120 C 60 80 100 80 130 110"/>
</g>
<g stroke="#e8d27a" stroke-width="2" fill="none" stroke-dasharray="10 9">
  <path d="M-10 230 H370"/><path d="M180 480 V120"/><path d="M-10 350 H370"/>
</g>
<g fill="#d9725a"><rect x="20" y="290" width="44" height="34" rx="3"/><rect x="100" y="380" width="40" height="36" rx="3"/></g>
<g fill="#6fb3a8"><rect x="210" y="372" width="40" height="40" rx="3"/><rect x="120" y="270" width="34" height="34" rx="3"/></g>
<g fill="#e9b44c"><rect x="20" y="180" width="40" height="30" rx="3"/><rect x="215" y="150" width="36" height="34" rx="3"/></g>
<g fill="#7a4428" opacity=".9"><path d="M18 290 l24 -14 l24 14Z M98 380 l22 -14 l22 14Z M208 372 l22 -14 l22 14Z"/></g>
<rect x="250" y="390" width="86" height="56" rx="4" fill="#f0e3c2"/><path d="M246 392 h94 l-47 -22Z" fill="#b5643a"/><rect x="286" y="420" width="14" height="26" fill="#5b3a22"/>
<g><rect x="250" y="262" width="80" height="44" rx="4" fill="#c98bb0"/><path d="M250 262 h80 v-10 h-80Z" fill="#fff" opacity=".8"/><path d="M256 252 v10 M276 252 v10 M296 252 v10 M316 252 v10" stroke="#d8402c" stroke-width="6"/></g>
<rect x="40" y="380" width="56" height="56" rx="6" fill="#a65a35"/><circle cx="68" cy="408" r="18" fill="none" stroke="#f3eee2" stroke-width="3" stroke-dasharray="8 3"/>
<g fill="#2f6e2a"><circle cx="120" cy="190" r="12"/><circle cx="335" cy="330" r="12"/><circle cx="25" cy="450" r="10"/><circle cx="150" cy="440" r="11"/><circle cx="60" cy="110" r="11"/><circle cx="330" cy="460" r="9"/></g>
<rect x="40" y="30" width="86" height="62" rx="6" fill="#4a3a2a" opacity=".85"/><path d="M52 42 h20 v20 h-20 v18 h40 v-30 h20" stroke="#e8d27a" stroke-width="3" fill="none"/>
`;

export function crearPantallaMapas({ nivel, puntos, alJugar }) {
  const $ = (id) => document.getElementById(id);
  const lienzo = $('mapas-mundo');
  const ficha = $('mapas-ficha');
  const todos = [
    ...MAPAS_CIRCULO.map((m) => ({ ...m, modo: 'circulo', nombreModo: 'Círculo' })),
    ...MAPAS.map((m) => ({ ...m, modo: 'cano', nombreModo: tx('{Caño}') })),
  ];

  // Dibujo chiquito del recorrido de un caño (o del círculo) para la ficha.
  function miniatura(m) {
    if (m.modo === 'circulo') {
      const suelo = m.superficie === 'asfalto' ? '#4a4a4e' : '#8c4a2b';
      return `<svg viewBox="0 0 120 120" class="mapas-mini" aria-hidden="true"><rect width="120" height="120" rx="10" fill="${suelo}"/><circle cx="60" cy="60" r="38" fill="none" stroke="#f3eee2" stroke-width="5" stroke-dasharray="14 4"/><g fill="#6fd3c8"><circle cx="54" cy="56" r="5"/><circle cx="66" cy="62" r="5"/><circle cx="58" cy="68" r="5"/></g></svg>`;
    }
    const t = trazarMapa(m);
    const b = t.bordes;
    const ancho = b.maxX - b.minX;
    const largo = b.maxZ - b.minZ;
    const escala = 100 / Math.max(ancho, largo);
    const puntosRuta = [];
    for (let s = 0; s <= t.largo; s += t.largo / 80) {
      const p = t.puntoEn(s);
      puntosRuta.push(`${(10 + (p.x - b.minX) * escala + (100 - ancho * escala) / 2).toFixed(1)},${(10 + (p.z - b.minZ) * escala + (100 - largo * escala) / 2).toFixed(1)}`);
    }
    const ruta = puntosRuta.join(' ');
    const inicio = puntosRuta[0].split(',');
    const fin = puntosRuta[puntosRuta.length - 1].split(',');
    return `<svg viewBox="0 0 120 120" class="mapas-mini" aria-hidden="true"><rect width="120" height="120" rx="10" fill="#5f8f3a"/><polyline points="${ruta}" fill="none" stroke="#9b9a93" stroke-width="7" stroke-linejoin="round" stroke-linecap="round"/><polyline points="${ruta}" fill="none" stroke="#c8c6bc" stroke-width="3" stroke-linejoin="round"/><circle cx="${inicio[0]}" cy="${inicio[1]}" r="4" fill="#3b9be0"/><circle cx="${fin[0]}" cy="${fin[1]}" r="4" fill="#f2cf4a"/></svg>`;
  }

  function abrir(m) {
    const n = nivel();
    const bloqueado = (m.nivel || 1) > n;
    $('mapas-ficha-mini').innerHTML = miniatura(m);
    $('mapas-ficha-nombre').textContent = m.nombre;
    $('mapas-ficha-modo').textContent = `${m.nombreModo} · nivel ${m.nivel || 1}${m.modo === 'cano' ? ` · ${(trazarMapa(m).largo / 100).toFixed(0)} m` : ''}`;
    $('mapas-ficha-texto').textContent = tx(m.descripcion);
    const jugar = $('mapas-ficha-jugar');
    if (bloqueado) {
      const falta = NIVELES[(m.nivel || 1) - 1].desde - puntos();
      $('mapas-ficha-candado').textContent = `🔒 Se desbloquea en el nivel ${m.nivel}: te faltan ${Math.max(falta, 0)} puntos.`;
      jugar.hidden = true;
    } else {
      $('mapas-ficha-candado').textContent = '';
      jugar.hidden = false;
      jugar.onclick = () => {
        cerrar();
        alJugar(m);
      };
    }
    ficha.hidden = false;
  }

  function cerrar() {
    ficha.hidden = true;
  }
  $('mapas-ficha-cerrar').addEventListener('click', cerrar);
  ficha.addEventListener('click', (e) => e.target === ficha && cerrar());

  function dibujar() {
    const n = nivel();
    const alfileres = todos
      .map((m) => {
        const [x, y] = LUGARES[m.id] || [180, 240];
        const bloqueado = (m.nivel || 1) > n;
        const color = bloqueado ? '#7a7f84' : m.modo === 'circulo' ? '#f2cf4a' : '#3fb6aa';
        const texto = bloqueado ? `🔒 Nv ${m.nivel}` : m.nombre;
        const anchoTexto = Math.max(texto.length * 6.4 + 14, 44);
        return `<g class="mapas-alfiler${bloqueado ? ' bloqueado' : ''}" data-id="${m.modo}:${m.id}" tabindex="0" role="button" aria-label="${m.nombre}${bloqueado ? `, bloqueado hasta el nivel ${m.nivel}` : ''}">
          <circle cx="${x}" cy="${y}" r="15" fill="${color}" stroke="#0c2422" stroke-width="3"/>
          <text x="${x}" y="${y + 5}" text-anchor="middle" font-size="14">${bloqueado ? '🔒' : m.modo === 'circulo' ? '◎' : '≋'}</text>
          <rect x="${x - anchoTexto / 2}" y="${y + 18}" width="${anchoTexto}" height="18" rx="9" fill="#0c2422" opacity=".85"/>
          <text x="${x}" y="${y + 31}" text-anchor="middle" font-size="11" font-weight="700" fill="${bloqueado ? '#c9d0d4' : '#fbf8f0'}">${texto}</text>
        </g>`;
      })
      .join('');
    lienzo.innerHTML = `<svg viewBox="0 0 360 480" class="mapas-svg">${DIBUJO}${alfileres}</svg>`;
    for (const g of lienzo.querySelectorAll('.mapas-alfiler')) {
      const [modo, id] = g.dataset.id.split(':');
      const m = todos.find((x) => x.modo === modo && x.id === id);
      g.addEventListener('click', () => abrir(m));
      g.addEventListener('keydown', (e) => (e.key === 'Enter' || e.key === ' ') && abrir(m));
    }
    // Lo que viene: los próximos mapas por nivel.
    const proximos = todos.filter((m) => (m.nivel || 1) > n).sort((a, b) => a.nivel - b.nivel);
    $('mapas-nivel').textContent = `Estás en el nivel ${n}. Tienes ${todos.length - proximos.length} de ${todos.length} lugares.`;
    $('mapas-proximos').replaceChildren(
      ...proximos.map((m) => {
        const li = document.createElement('li');
        li.innerHTML = '<strong></strong> <span></span>';
        li.children[0].textContent = `Nivel ${m.nivel}:`;
        li.children[1].textContent = `${m.nombre} (${m.nombreModo})`;
        li.addEventListener('click', () => abrir(m));
        return li;
      })
    );
    $('mapas-proximos-titulo').hidden = proximos.length === 0;
  }

  return { dibujar, cerrar, get abierta() { return !ficha.hidden; } };
}
