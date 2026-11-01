// Ilustraciones de los mapas: una escena dibujada según el tema de cada lugar
// (patio, calle, escuela, avenida, mercado, quebrada, cerro…) con el recorrido real
// del caño encima —sus piedras, huecos, salida y meta— o el círculo de tiza.
// Todo es SVG armado en texto: no hay imágenes que bajar.
import { trazarMapa } from '../escenario/canal.js';

const ANCHO = 320;
const ALTO = 200;
let cuenta = 0; // para que los nombres internos (degradados, tramas) no choquen entre dibujos

// Números "al azar" pero siempre iguales para el mismo mapa.
function azar(semilla) {
  let s = 0;
  for (const c of semilla) s = (s * 31 + c.charCodeAt(0)) >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

// Puntitos sueltos (tierra, granos del asfalto, pasto).
function salpicar(r, n, colores, tam = [0.6, 1.6], zona = [0, 0, ANCHO, ALTO]) {
  let t = '';
  for (let i = 0; i < n; i++) {
    const x = zona[0] + r() * (zona[2] - zona[0]);
    const y = zona[1] + r() * (zona[3] - zona[1]);
    t += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${(tam[0] + r() * (tam[1] - tam[0])).toFixed(2)}" fill="${colores[i % colores.length]}"/>`;
  }
  return t;
}

const casa = (x, y, w, h, pared, techo) =>
  `<g><rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${pared}"/><path d="M${x - 4} ${y} L${x + w / 2} ${y - h * 0.55} L${x + w + 4} ${y}Z" fill="${techo}"/>` +
  `<rect x="${x + w * 0.15}" y="${y + h * 0.25}" width="${w * 0.25}" height="${h * 0.28}" fill="#8fc6e8" stroke="#fff" stroke-width="1"/>` +
  `<rect x="${x + w * 0.58}" y="${y + h * 0.42}" width="${w * 0.24}" height="${h * 0.58}" fill="#6a3f24"/></g>`;

const arbol = (x, y, r, verde = '#2f6e2a') =>
  `<g><ellipse cx="${x + r * 0.3}" cy="${y + r * 0.9}" rx="${r}" ry="${r * 0.35}" fill="#000" opacity=".18"/><rect x="${x - 2}" y="${y}" width="4" height="${r * 0.9}" fill="#6a4426"/><circle cx="${x}" cy="${y - r * 0.2}" r="${r}" fill="${verde}"/><circle cx="${x - r * 0.35}" cy="${y - r * 0.5}" r="${r * 0.45}" fill="#fff" opacity=".12"/></g>`;

const pino = (x, y, h) =>
  `<g><rect x="${x - 1.5}" y="${y - h * 0.2}" width="3" height="${h * 0.25}" fill="#5a3a22"/><path d="M${x} ${y - h} L${x + h * 0.38} ${y - h * 0.15} L${x - h * 0.38} ${y - h * 0.15}Z" fill="#2d5e2e"/><path d="M${x} ${y - h} L${x + h * 0.38} ${y - h * 0.15} L${x} ${y - h * 0.15}Z" fill="#244d26"/></g>`;

const bolincha = (x, y, r, color) =>
  `<g><circle cx="${x + 1}" cy="${y + 1.5}" r="${r}" fill="#000" opacity=".25"/><circle cx="${x}" cy="${y}" r="${r}" fill="${color}"/><path d="M${x - r * 0.8} ${y + r * 0.1} Q${x} ${y - r * 0.5} ${x + r * 0.8} ${y + r * 0.2}" stroke="#fff" stroke-width="${r * 0.35}" fill="none" opacity=".55"/><circle cx="${x - r * 0.35}" cy="${y - r * 0.4}" r="${r * 0.28}" fill="#fff" opacity=".8"/></g>`;

const toldo = (x, y, w, a, b) => {
  let t = `<rect x="${x}" y="${y + 12}" width="${w}" height="20" fill="#8a5a36"/>`;
  const franjas = 6;
  for (let i = 0; i < franjas; i++) t += `<path d="M${x + (w / franjas) * i} ${y} h${w / franjas} v12 q${-w / franjas / 2} 6 ${-w / franjas} 0Z" fill="${i % 2 ? a : b}"/>`;
  return t;
};

// ---------- Escenas de fondo (dibujadas antes del recorrido) ----------
const ESCENAS = {
  patio(r, id) {
    return `<defs><radialGradient id="${id}t" cx="50%" cy="55%" r="70%"><stop offset="0" stop-color="#b56a40"/><stop offset="1" stop-color="#7d4026"/></radialGradient></defs>
      <rect width="${ANCHO}" height="${ALTO}" fill="url(#${id}t)"/>${salpicar(r, 160, ['#c98257', '#6e3820', '#d79a6c'])}
      <rect width="${ANCHO}" height="34" fill="#efe3c4"/><rect y="34" width="${ANCHO}" height="5" fill="#c9b994"/>
      ${[20, 70, 120, 200, 250].map((x) => `<rect x="${x}" y="7" width="30" height="18" fill="#7fb6d9" stroke="#fff" stroke-width="2"/>`).join('')}
      <rect x="160" y="4" width="26" height="30" fill="#6a3f24"/>
      ${arbol(292, 70, 20)}${arbol(26, 168, 16, '#356f2c')}`;
  },
  calle(r, id) {
    return `<defs><pattern id="${id}a" width="6" height="6" patternUnits="userSpaceOnUse"><rect width="6" height="6" fill="#47474b"/><circle cx="2" cy="2" r=".7" fill="#5c5c61"/><circle cx="5" cy="4.5" r=".5" fill="#3a3a3e"/></pattern></defs>
      <rect width="${ANCHO}" height="${ALTO}" fill="url(#${id}a)"/>
      <rect width="${ANCHO}" height="58" fill="#7aa35a"/>
      ${casa(10, 22, 48, 30, '#e9b44c', '#a5432e')}${casa(76, 18, 56, 34, '#6fb3a8', '#5b3a22')}${casa(150, 24, 46, 28, '#d9725a', '#7a4428')}
      <rect y="52" width="${ANCHO}" height="12" fill="#b9b4a8"/><rect y="64" width="${ANCHO}" height="3" fill="#8f8a7e"/>
      <path d="M0 186 H${ANCHO}" stroke="#e8d27a" stroke-width="3" stroke-dasharray="18 14"/>
      <g transform="translate(252 66)"><path d="M0 64 V0 H52 V64" fill="none" stroke="#fff" stroke-width="4"/><path d="M4 4 L14 18 H40 L48 4" fill="none" stroke="#ddd" stroke-width="1"/>
      ${[10, 18, 26, 34, 42].map((x) => `<path d="M${x} 2 V62" stroke="#fff" stroke-width=".6" opacity=".6"/>`).join('')}${[14, 26, 38, 50].map((y) => `<path d="M2 ${y} H50" stroke="#fff" stroke-width=".6" opacity=".6"/>`).join('')}</g>
      <g transform="translate(236 150)"><path d="M0 8 q2 -8 12 -6 l8 4 v6 h-20z" fill="#d8402c"/><path d="M0 12 h20" stroke="#fff" stroke-width="2"/></g>
      <g transform="translate(268 160) rotate(20)"><path d="M0 8 q2 -8 12 -6 l8 4 v6 h-20z" fill="#2f5fb3"/><path d="M0 12 h20" stroke="#fff" stroke-width="2"/></g>`;
  },
  escuela(r, id) {
    return `<defs><pattern id="${id}b" width="20" height="20" patternUnits="userSpaceOnUse"><rect width="20" height="20" fill="#cfc7b4"/><path d="M0 0 H20 M0 0 V20" stroke="#b7ae98" stroke-width="1"/></pattern></defs>
      <rect width="${ANCHO}" height="${ALTO}" fill="url(#${id}b)"/>
      <rect x="0" y="0" width="${ANCHO}" height="30" fill="#f0e3c2"/><path d="M0 0 H${ANCHO} V6 H0Z" fill="#b5643a"/>
      ${[14, 54, 94, 214, 254, 294].map((x) => `<rect x="${x}" y="11" width="16" height="13" fill="#7fb6d9" stroke="#fff" stroke-width="1.5"/>`).join('')}
      <rect x="142" y="8" width="36" height="22" fill="#5b3a22"/><path d="M135 8 L160 -4 L185 8Z" fill="#b5643a"/>
      <path d="M300 196 V120" stroke="#ccc" stroke-width="2"/><rect x="301" y="121" width="16" height="10" fill="#f2cf4a"/><rect x="301" y="126" width="16" height="5" fill="#d8402c"/>
      ${arbol(20, 178, 14)}${arbol(296, 60, 13, '#3c7a33')}`;
  },
  avenida(r) {
    return `<rect width="${ANCHO}" height="${ALTO}" fill="#5f8f3a"/>${salpicar(r, 140, ['#6f9e46', '#4f7d30'], [0.8, 2])}
      <rect y="0" width="${ANCHO}" height="40" fill="#3f3f44"/><path d="M0 20 H${ANCHO}" stroke="#f2f2f2" stroke-width="2" stroke-dasharray="14 10"/>
      <rect y="40" width="${ANCHO}" height="6" fill="#b9b4a8"/>
      <g><rect x="40" y="7" width="30" height="12" rx="3" fill="#d8402c"/><rect x="46" y="9" width="12" height="5" fill="#bfe3f5"/></g>
      <g><rect x="190" y="23" width="34" height="12" rx="3" fill="#2f8fd1"/><rect x="206" y="25" width="12" height="5" fill="#bfe3f5"/></g>
      ${[30, 110, 190, 270].map((x) => arbol(x, 64, 9, '#2e6a2a')).join('')}${arbol(300, 176, 13)}`;
  },
  zigzag(r, id) {
    return `<defs><pattern id="${id}l" width="24" height="12" patternUnits="userSpaceOnUse"><rect width="24" height="12" fill="#a8553a"/><rect x="1" y="1" width="10" height="4.5" fill="#bd6748"/><rect x="13" y="1" width="10" height="4.5" fill="#b35d40"/><rect x="-5" y="7" width="10" height="4.5" fill="#b35d40"/><rect x="7" y="7" width="10" height="4.5" fill="#c06c4c"/><rect x="19" y="7" width="10" height="4.5" fill="#bd6748"/></pattern></defs>
      <rect width="${ANCHO}" height="${ALTO}" fill="url(#${id}l)"/>
      <rect width="${ANCHO}" height="${ALTO}" fill="#000" opacity=".08"/>
      <g fill="#3d6e2c">${[12, 300].map((x) => `<rect x="${x - 8}" y="0" width="16" height="${ALTO}" opacity=".9"/>`).join('')}</g>
      ${[20, 70, 120, 170].map((y) => `<circle cx="12" cy="${y}" r="5" fill="#e65a8a"/><circle cx="300" cy="${y + 25}" r="5" fill="#f2cf4a"/>`).join('')}`;
  },
  mercado(r, id) {
    return `<defs><pattern id="${id}m" width="16" height="16" patternUnits="userSpaceOnUse"><rect width="16" height="16" fill="#c2b8a2"/><rect width="8" height="8" fill="#b3a98f"/><rect x="8" y="8" width="8" height="8" fill="#b3a98f"/></pattern></defs>
      <rect width="${ANCHO}" height="${ALTO}" fill="url(#${id}m)"/>
      ${toldo(4, 2, 70, '#d8402c', '#fff')}${toldo(84, 2, 70, '#2f8fd1', '#fff')}${toldo(164, 2, 70, '#3fae5a', '#fff')}${toldo(244, 2, 72, '#f2cf4a', '#d8402c')}
      ${[18, 98, 178, 258].map((x, i) => salpicar(azar('fruta' + i), 10, [['#e8452c', '#f0a030'], ['#f5d33a', '#7cc04a'], ['#8a3fb0', '#e8452c'], ['#f0a030', '#7cc04a']][i], [2, 3.4], [x, 18, x + 42, 30])).join('')}
      <g transform="translate(270 160)"><rect width="34" height="22" fill="#a8743f"/><path d="M0 7 H34 M0 14 H34" stroke="#7a4f28" stroke-width="2"/>${salpicar(azar('cajon'), 8, ['#e8452c', '#f5d33a'], [2.5, 3.5], [3, -4, 31, 2])}</g>
      <g transform="translate(14 168)"><rect width="30" height="20" fill="#a8743f"/><path d="M0 7 H30 M0 14 H30" stroke="#7a4f28" stroke-width="2"/>${salpicar(azar('cajon2'), 7, ['#7cc04a', '#f0a030'], [2.5, 3.5], [3, -4, 27, 2])}</g>`;
  },
  barrio(r) {
    return `<rect width="${ANCHO}" height="${ALTO}" fill="#6a9c45"/>${salpicar(r, 120, ['#78aa50', '#58883a'], [0.8, 2])}
      ${casa(8, 30, 40, 26, '#e9b44c', '#a5432e')}${casa(8, 120, 40, 26, '#c98bb0', '#5b3a22')}${casa(274, 40, 40, 26, '#6fb3a8', '#7a4428')}${casa(274, 132, 40, 26, '#f0e3c2', '#a5432e')}
      ${casa(130, 12, 50, 22, '#d9725a', '#5b3a22')}
      ${[[66, 30], [250, 110], [70, 180]].map(([x, y]) => `<path d="M${x} ${y} V${y - 26}" stroke="#4a4a4e" stroke-width="2.5"/><circle cx="${x}" cy="${y - 27}" r="4" fill="#fff4b0"/><circle cx="${x}" cy="${y - 27}" r="9" fill="#fff4b0" opacity=".25"/>`).join('')}
      ${arbol(230, 40, 11)}${arbol(110, 186, 10, '#3c7a33')}`;
  },
  quebrada(r) {
    return `<rect width="${ANCHO}" height="${ALTO}" fill="#4f8a3a"/>${salpicar(r, 150, ['#5f9c46', '#3e7230', '#77b04f'], [0.8, 2.2])}
      <path d="M-10 160 C 60 130 90 190 160 170 S 260 120 330 150 L330 210 L-10 210Z" fill="#3a6b30" opacity=".6"/>
      <path d="M-10 185 C 60 160 100 205 170 188 S 270 150 330 172" fill="none" stroke="#3b8fd0" stroke-width="16" stroke-linecap="round"/>
      <path d="M-10 185 C 60 160 100 205 170 188 S 270 150 330 172" fill="none" stroke="#9fd8f7" stroke-width="3" stroke-dasharray="7 11"/>
      ${[[30, 20, 10], [290, 30, 13], [300, 100, 8], [16, 100, 9]].map(([x, y, s]) => `<ellipse cx="${x}" cy="${y}" rx="${s}" ry="${s * 0.7}" fill="#8b8a84"/><ellipse cx="${x - s * 0.3}" cy="${y - s * 0.25}" rx="${s * 0.4}" ry="${s * 0.25}" fill="#b3b2ab"/>`).join('')}
      ${[[60, 14], [250, 70], [150, 14]].map(([x, y]) => `<g stroke="#2a5e22" stroke-width="2" fill="none"><path d="M${x} ${y + 10} q-8 -6 -10 -14"/><path d="M${x} ${y + 10} q0 -10 2 -16"/><path d="M${x} ${y + 10} q8 -6 11 -12"/></g>`).join('')}`;
  },
  cerro(r, id) {
    return `<defs><linearGradient id="${id}c" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9fd3f0"/><stop offset="1" stop-color="#e8f4f8"/></linearGradient><linearGradient id="${id}h" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7ba04a"/><stop offset="1" stop-color="#557f35"/></linearGradient></defs>
      <rect width="${ANCHO}" height="${ALTO}" fill="url(#${id}c)"/><circle cx="278" cy="26" r="15" fill="#ffd95a"/><circle cx="278" cy="26" r="24" fill="#ffd95a" opacity=".25"/>
      <path d="M-10 60 C 50 20 110 50 160 30 S 260 50 330 40 L330 210 L-10 210Z" fill="#8bb0c8" opacity=".5"/>
      <path d="M-10 76 C 60 40 120 70 180 50 S 280 70 330 60 L330 210 L-10 210Z" fill="url(#${id}h)"/>
      ${salpicar(r, 100, ['#6a9440', '#4f7a30'], [0.8, 2], [0, 80, ANCHO, ALTO])}
      ${[[18, 98, 22], [36, 110, 18], [296, 96, 24], [306, 150, 20], [20, 190, 22]].map(([x, y, h]) => pino(x, y, h)).join('')}
      <path d="M40 22 q6 -6 12 0 q6 -6 12 0" stroke="#fff" stroke-width="2" fill="none"/>`;
  },
  laberinto(r) {
    let setos = '';
    for (let x = 0; x < ANCHO; x += 40) for (let y = 0; y < ALTO; y += 40) if (r() > 0.45) setos += `<rect x="${x + 4}" y="${y + 4}" width="${r() > 0.5 ? 32 : 10}" height="${r() > 0.5 ? 10 : 32}" rx="3" fill="#2f6b3a" stroke="#3f8a4a" stroke-width="2"/>`;
    return `<rect width="${ANCHO}" height="${ALTO}" fill="#34493f"/>${salpicar(r, 80, ['#2e4038', '#1c2924'], [1, 2.5])}${setos}
      <circle cx="292" cy="24" r="12" fill="#f3efd8"/><circle cx="298" cy="20" r="11" fill="#24342e"/>
      ${salpicar(r, 14, ['#f6f08a'], [1, 1.6])}
      <rect width="${ANCHO}" height="${ALTO}" fill="#0b1a2a" opacity=".12"/>`;
  },
};

// Ajusta el recorrido al cuadro (y lo gira si es más alto que ancho).
function encajar(t, margen) {
  const b = t.bordes;
  const w = b.maxX - b.minX;
  const h = b.maxZ - b.minZ;
  const girar = h > w * 1.15;
  const ancho = girar ? h : w;
  const alto = girar ? w : h;
  const escala = Math.min((ANCHO - margen * 2) / ancho, (ALTO - margen * 2) / alto);
  const ox = (ANCHO - ancho * escala) / 2;
  const oy = (ALTO - alto * escala) / 2;
  return (x, z) => {
    const u = girar ? z - b.minZ : x - b.minX;
    const v = girar ? b.maxX - x : z - b.minZ;
    return [ox + u * escala, oy + v * escala];
  };
}

// El caño de cemento con su recorrido, piedras, huecos, salida y meta.
function dibujarCano(m) {
  const t = trazarMapa(m);
  const a = encajar(t, 24);
  const pts = [];
  for (let s = 0; s <= t.largo; s += t.largo / 160) {
    const p = t.puntoEn(s);
    pts.push(a(p.x, p.z).map((n) => n.toFixed(1)).join(','));
  }
  const ruta = pts.join(' ');
  const obst = t.obstaculos
    .map((o) => {
      const [x, y] = a(o.x, o.z);
      return o.tipo === 'hueco'
        ? `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="2.6" fill="#1c1410"/><circle cx="${x.toFixed(1)}" cy="${(y - 0.6).toFixed(1)}" r="2.6" fill="none" stroke="#000" stroke-width=".6" opacity=".5"/>`
        : `<circle cx="${(x + 0.6).toFixed(1)}" cy="${(y + 0.8).toFixed(1)}" r="2.8" fill="#000" opacity=".3"/><circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="2.8" fill="#8d8478"/><circle cx="${(x - 0.8).toFixed(1)}" cy="${(y - 0.9).toFixed(1)}" r="1.1" fill="#c4bcae"/>`;
    })
    .join('');
  const p0 = t.puntoEn(0);
  const [sx, sy] = a(p0.x, p0.z);
  const pm = t.puntoEn(t.sMeta);
  const [mx, my] = a(pm.x, pm.z);
  const meta = (x, y) =>
    `<g transform="translate(${x.toFixed(1)} ${y.toFixed(1)})"><path d="M0 0 V-22" stroke="#3a3a3a" stroke-width="2"/><rect x="0" y="-22" width="14" height="10" fill="#fff"/>` +
    `<rect x="0" y="-22" width="3.5" height="5" fill="#111"/><rect x="7" y="-22" width="3.5" height="5" fill="#111"/><rect x="3.5" y="-17" width="3.5" height="5" fill="#111"/><rect x="10.5" y="-17" width="3.5" height="5" fill="#111"/></g>`;
  return `<polyline points="${ruta}" fill="none" stroke="#000" stroke-opacity=".3" stroke-width="17" stroke-linejoin="round" stroke-linecap="round" transform="translate(2 3)"/>
    <polyline points="${ruta}" fill="none" stroke="#8e8a80" stroke-width="15" stroke-linejoin="round" stroke-linecap="round"/>
    <polyline points="${ruta}" fill="none" stroke="#b8b4a8" stroke-width="10" stroke-linejoin="round" stroke-linecap="round"/>
    <polyline points="${ruta}" fill="none" stroke="#d6d2c6" stroke-width="4" stroke-linejoin="round" stroke-linecap="round" opacity=".8"/>
    ${obst}
    <circle cx="${sx.toFixed(1)}" cy="${sy.toFixed(1)}" r="6" fill="#3b9be0" stroke="#fff" stroke-width="2"/>
    ${bolincha(sx, sy, 3.2, '#6fd3c8')}
    ${meta(mx, my)}`;
}

// El círculo de tiza con bolinchas adentro y la tiradora afuera.
function dibujarCirculo(m) {
  const r = azar(m.id + 'b');
  const colores = ['#e8452c', '#2f8fd1', '#f2cf4a', '#3fae5a', '#8a3fb0', '#f0a030', '#6fd3c8'];
  let bolas = '';
  for (let i = 0; i < 9; i++) {
    const ang = r() * Math.PI * 2;
    const d = Math.sqrt(r()) * 34;
    bolas += bolincha(160 + Math.cos(ang) * d * 1.5, 122 + Math.sin(ang) * d * 0.62, 4.2, colores[i % colores.length]);
  }
  return `<ellipse cx="160" cy="124" rx="78" ry="34" fill="#000" opacity=".08"/>
    <ellipse cx="160" cy="122" rx="78" ry="34" fill="none" stroke="#f6f1e4" stroke-width="3.5" stroke-dasharray="16 4" opacity=".92"/>
    <path d="M150 162 h20" stroke="#f6f1e4" stroke-width="3" opacity=".9"/>
    ${bolas}${bolincha(160, 176, 5.6, '#6fd3c8')}`;
}

// SVG completo de un mapa. "bloqueado" lo pinta apagado.
export function ilustracionMapa(m, { bloqueado = false } = {}) {
  const id = `il${++cuenta}`;
  const escena = (ESCENAS[m.id] || ESCENAS.barrio)(azar(m.id), id);
  const encima = m.modo === 'circulo' ? dibujarCirculo(m) : dibujarCano(m);
  const filtro = bloqueado ? `<defs><filter id="${id}g"><feColorMatrix type="saturate" values="0.4"/></filter></defs>` : '';
  return `<svg viewBox="0 0 ${ANCHO} ${ALTO}" class="mapa-ilustracion" aria-hidden="true">${filtro}<g${bloqueado ? ` filter="url(#${id}g)" opacity=".9"` : ''}>${escena}${encima}</g>${
    bloqueado ? `<rect width="${ANCHO}" height="${ALTO}" fill="#0c2422" opacity=".18"/>` : ''
  }</svg>`;
}
