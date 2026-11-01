// Ilustraciones de los mapas, vistas desde arriba y en estilo plano: pocos colores por
// lugar, formas redondeadas y suaves (copas de árboles, techos, toldos, curvas de nivel)
// y encima el recorrido real del caño —piedras, huecos, salida y meta— o el círculo de tiza.
// Todo es SVG armado en texto: no hay imágenes que bajar.
import { trazarMapa } from '../escenario/canal.js';

const ANCHO = 320;
const ALTO = 200;
let cuenta = 0; // para que los nombres internos (degradados) no choquen entre dibujos

// Números "al azar" pero siempre iguales para el mismo mapa.
function azar(semilla) {
  let s = 0;
  for (const c of semilla) s = (s * 31 + c.charCodeAt(0)) >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

const f = (n) => n.toFixed(1);

// Curva cerrada y suave que pasa por los puntos (para manchas orgánicas).
function curvaCerrada(pts) {
  const n = pts.length;
  let d = `M${f(pts[0][0])} ${f(pts[0][1])}`;
  for (let i = 0; i < n; i++) {
    const p0 = pts[(i - 1 + n) % n];
    const p1 = pts[i];
    const p2 = pts[(i + 1) % n];
    const p3 = pts[(i + 2) % n];
    d += ` C${f(p1[0] + (p2[0] - p0[0]) / 6)} ${f(p1[1] + (p2[1] - p0[1]) / 6)} ${f(p2[0] - (p3[0] - p1[0]) / 6)} ${f(p2[1] - (p3[1] - p1[1]) / 6)} ${f(p2[0])} ${f(p2[1])}`;
  }
  return d + 'Z';
}

// Forma de una mancha: cuánto se estira en cada dirección (se reusa para curvas de nivel).
const formaMancha = (r, lados = 9, irregular = 0.22) => Array.from({ length: lados }, () => 1 - irregular / 2 + r() * irregular);

function mancha(cx, cy, radio, forma, aplastar = 1) {
  const n = forma.length;
  return curvaCerrada(
    forma.map((k, i) => {
      const a = (i / n) * Math.PI * 2;
      return [cx + Math.cos(a) * radio * k, cy + Math.sin(a) * radio * k * aplastar];
    })
  );
}

// Copa de árbol vista desde arriba: sombra, copa y un brillo.
function copa(r, x, y, radio, [oscuro, claro]) {
  const forma = formaMancha(r, 8, 0.28);
  return (
    `<path d="${mancha(x + radio * 0.22, y + radio * 0.3, radio, forma)}" fill="#000" opacity=".16"/>` +
    `<path d="${mancha(x, y, radio, forma)}" fill="${oscuro}"/>` +
    `<path d="${mancha(x - radio * 0.22, y - radio * 0.24, radio * 0.58, formaMancha(r, 7, 0.3))}" fill="${claro}" opacity=".85"/>`
  );
}

// Techo visto desde arriba: dos aguas con la cumbrera al medio.
const techo = (x, y, w, h, a, b) =>
  `<rect x="${x + 2}" y="${y + 3}" width="${w}" height="${h}" rx="3" fill="#000" opacity=".15"/>` +
  `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="3" fill="${a}"/>` +
  `<path d="M${x} ${y + h / 2} H${x + w} V${y + h - 3} a3 3 0 0 1 -3 3 H${x + 3} a3 3 0 0 1 -3 -3Z" fill="${b}"/>`;

// Sombrilla de feria vista desde arriba: gajos de dos colores.
function sombrilla(x, y, radio, a, b) {
  let t = `<circle cx="${f(x + 2)}" cy="${f(y + 3)}" r="${radio}" fill="#000" opacity=".16"/>`;
  const n = 8;
  for (let i = 0; i < n; i++) {
    const a1 = (i / n) * Math.PI * 2;
    const a2 = ((i + 1) / n) * Math.PI * 2;
    t += `<path d="M${f(x)} ${f(y)} L${f(x + Math.cos(a1) * radio)} ${f(y + Math.sin(a1) * radio)} A${radio} ${radio} 0 0 1 ${f(x + Math.cos(a2) * radio)} ${f(y + Math.sin(a2) * radio)}Z" fill="${i % 2 ? a : b}"/>`;
  }
  return t + `<circle cx="${f(x)}" cy="${f(y)}" r="${f(radio * 0.12)}" fill="#fff" opacity=".8"/>`;
}

// Curvas de nivel alrededor de un punto (cerros, quebradas).
function curvasDeNivel(r, cx, cy, radioMayor, n, color, grosor = 1.4, aplastar = 0.75) {
  const forma = formaMancha(r, 10, 0.32);
  let t = '';
  for (let i = 0; i < n; i++) {
    const k = 1 - i / n;
    t += `<path d="${mancha(cx + i * 3, cy - i * 2, radioMayor * k, forma, aplastar)}" fill="none" stroke="${color}" stroke-width="${grosor}" opacity="${(0.25 + 0.4 * (i / n)).toFixed(2)}"/>`;
  }
  return t;
}

// Luz suave (faroles, luciérnagas, sol).
const luz = (id, x, y, radio, color) =>
  `<circle cx="${f(x)}" cy="${f(y)}" r="${radio}" fill="url(#${id}luz)"/><circle cx="${f(x)}" cy="${f(y)}" r="${f(Math.max(radio * 0.14, 1.2))}" fill="${color}"/>`;

// Fondo: degradado, manchas grandes de luz y sombra (el oscurecido de bordes va al final).
function fondo(id, [a, b], manchas = []) {
  return `<defs>
      <linearGradient id="${id}s" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient>
      <radialGradient id="${id}v" cx="50%" cy="50%" r="75%"><stop offset=".55" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".32"/></radialGradient>
      <radialGradient id="${id}luz"><stop offset="0" stop-color="#fff6c8" stop-opacity=".55"/><stop offset="1" stop-color="#fff6c8" stop-opacity="0"/></radialGradient>
    </defs><rect width="${ANCHO}" height="${ALTO}" fill="url(#${id}s)"/>${manchas.join('')}`;
}

// ---------- Cada lugar: colores, fondo y adornos ----------
// tinta: borde del recorrido; cinta: el caño; acento: salida y meta.
const ESCENAS = {
  patio: {
    suelo: ['#d9895a', '#a9542f'],
    tinta: '#5e2a14',
    cinta: '#f4e2c6',
    acento: '#2f8f83',
    dibujar(r, id) {
      return (
        fondo(id, this.suelo, [`<path d="${mancha(250, 150, 110, formaMancha(r))}" fill="#000" opacity=".07"/>`, `<path d="${mancha(70, 50, 90, formaMancha(r))}" fill="#fff" opacity=".08"/>`]) +
        `<path d="M-10 -10 H140 C120 20 70 26 -10 30Z" fill="#7fae5b"/><path d="M140 -10 C120 20 70 26 -10 30" fill="none" stroke="#5f8e43" stroke-width="2"/>` +
        copa(r, 30, 22, 22, ['#3f7f3a', '#69a957']) +
        copa(r, 292, 172, 26, ['#3f7f3a', '#69a957']) +
        copa(r, 262, 194, 15, ['#4c8c3f', '#77b65f'])
      );
    },
  },
  calle: {
    suelo: ['#4b5563', '#2c333d'],
    tinta: '#1a1e24',
    cinta: '#e7e2d6',
    acento: '#f0b93a',
    dibujar(r, id) {
      return (
        fondo(id, this.suelo, [`<path d="${mancha(200, 130, 120, formaMancha(r))}" fill="#fff" opacity=".04"/>`]) +
        `<rect y="-2" width="${ANCHO}" height="44" fill="#a9a59b"/><rect y="40" width="${ANCHO}" height="4" fill="#d8d3c6"/>` +
        techo(8, 2, 58, 30, '#c4553e', '#a64532') +
        techo(76, 0, 70, 32, '#e0a23e', '#c38a2e') +
        techo(158, 4, 52, 28, '#5f9d92', '#4d857b') +
        techo(222, 0, 90, 32, '#b86a4e', '#9b583f') +
        `<path d="M0 184 H${ANCHO}" stroke="#f0d36a" stroke-width="2.5" stroke-dasharray="20 16" opacity=".7"/>`
      );
    },
  },
  escuela: {
    suelo: ['#e3cf9f', '#c5a66f'],
    tinta: '#6b4a23',
    cinta: '#fbf6ea',
    acento: '#d8513a',
    dibujar(r, id) {
      return (
        fondo(id, this.suelo, [`<path d="${mancha(240, 120, 110, formaMancha(r))}" fill="#fff" opacity=".12"/>`]) +
        `<rect x="18" y="58" width="284" height="124" rx="40" fill="none" stroke="#fff" stroke-width="2" opacity=".45"/>` +
        `<circle cx="160" cy="120" r="20" fill="none" stroke="#fff" stroke-width="2" opacity=".45"/>` +
        techo(96, -4, 128, 34, '#b8573a', '#9c4930') +
        copa(r, 22, 20, 20, ['#4f8a3b', '#7cb55e']) +
        copa(r, 300, 26, 22, ['#4f8a3b', '#7cb55e']) +
        copa(r, 302, 186, 16, ['#4f8a3b', '#7cb55e'])
      );
    },
  },
  avenida: {
    suelo: ['#78ad55', '#4a8034'],
    tinta: '#24451b',
    cinta: '#f1ece0',
    acento: '#2f7fd1',
    dibujar(r, id) {
      let t = fondo(id, this.suelo, [`<path d="${mancha(100, 150, 120, formaMancha(r))}" fill="#000" opacity=".06"/>`]);
      t +=
        `<path d="M-20 34 C 80 10 220 46 340 18" fill="none" stroke="#3a3d44" stroke-width="40"/>` +
        `<path d="M-20 34 C 80 10 220 46 340 18" fill="none" stroke="#e8e4da" stroke-width="1.6" stroke-dasharray="14 12" opacity=".8"/>` +
        `<rect x="56" y="12" width="26" height="12" rx="6" fill="#e2523d"/><rect x="66" y="14" width="9" height="8" rx="3" fill="#fff" opacity=".5"/>` +
        `<rect x="216" y="24" width="28" height="12" rx="6" fill="#f0c43a"/><rect x="220" y="26" width="9" height="8" rx="3" fill="#fff" opacity=".5"/>`;
      for (const x of [24, 104, 184, 264]) t += copa(r, x, 68, 10, ['#2f6a2a', '#5d9a45']);
      return t + copa(r, 300, 180, 18, ['#2f6a2a', '#5d9a45']);
    },
  },
  zigzag: {
    suelo: ['#e0795a', '#b2472f'],
    tinta: '#5a1d10',
    cinta: '#fbeee0',
    acento: '#2d7f6f',
    dibujar(r, id) {
      let t = fondo(id, this.suelo);
      for (let i = -2; i < 8; i++) {
        const y = i * 34;
        t += `<path d="M-20 ${y + 40} C 60 ${y} 120 ${y + 70} 200 ${y + 30} S 300 ${y + 10} 340 ${y + 40}" fill="none" stroke="#fff" stroke-width="10" opacity=".06"/>`;
      }
      return (
        t +
        copa(r, 18, 30, 20, ['#2f6f4f', '#5a9e72']) +
        copa(r, 304, 170, 22, ['#2f6f4f', '#5a9e72']) +
        [[300, 30], [312, 52], [16, 176], [36, 190]].map(([x, y], i) => `<circle cx="${x}" cy="${y}" r="4" fill="${i % 2 ? '#f6d24a' : '#f06d9b'}"/>`).join('')
      );
    },
  },
  mercado: {
    suelo: ['#e8c06a', '#c48f3c'],
    tinta: '#6a4314',
    cinta: '#fff8ea',
    acento: '#c8402e',
    dibujar(r, id) {
      return (
        fondo(id, this.suelo, [`<path d="${mancha(160, 100, 140, formaMancha(r))}" fill="#fff" opacity=".1"/>`]) +
        sombrilla(30, 26, 24, '#d8402c', '#f8efe0') +
        sombrilla(96, 14, 20, '#2f8fd1', '#f8efe0') +
        sombrilla(236, 16, 22, '#3fae5a', '#f8efe0') +
        sombrilla(296, 40, 22, '#e2523d', '#f6d24a') +
        sombrilla(26, 180, 20, '#8a4fc0', '#f8efe0') +
        sombrilla(296, 182, 18, '#f0a030', '#f8efe0')
      );
    },
  },
  barrio: {
    suelo: ['#7fb25a', '#4f8638'],
    tinta: '#22451a',
    cinta: '#f3eee2',
    acento: '#e0832e',
    dibujar(r, id) {
      return (
        fondo(id, this.suelo, [`<path d="${mancha(160, 120, 130, formaMancha(r))}" fill="#000" opacity=".06"/>`]) +
        techo(-4, 12, 50, 32, '#c4553e', '#a64532') +
        techo(-4, 140, 46, 30, '#c98bb0', '#ad7397') +
        techo(276, 18, 50, 30, '#5f9d92', '#4d857b') +
        techo(282, 146, 44, 30, '#e0a23e', '#c38a2e') +
        copa(r, 150, 8, 14, ['#2f6a2a', '#5d9a45']) +
        copa(r, 70, 192, 12, ['#2f6a2a', '#5d9a45']) +
        luz(id, 66, 40, 16, '#fff3b0') +
        luz(id, 256, 120, 16, '#fff3b0') +
        luz(id, 100, 170, 14, '#fff3b0')
      );
    },
  },
  quebrada: {
    suelo: ['#5f9e62', '#2f6e4a'],
    tinta: '#163b28',
    cinta: '#f2f0e4',
    acento: '#e0832e',
    dibujar(r, id) {
      return (
        fondo(id, this.suelo) +
        curvasDeNivel(r, 60, 50, 90, 5, '#d9f0c8', 1.2) +
        curvasDeNivel(r, 270, 150, 80, 4, '#d9f0c8', 1.2) +
        `<path d="M-20 196 C 60 160 110 210 180 184 S 280 150 340 176" fill="none" stroke="#2b6fa8" stroke-width="22" stroke-linecap="round"/>` +
        `<path d="M-20 196 C 60 160 110 210 180 184 S 280 150 340 176" fill="none" stroke="#7cc3ea" stroke-width="10" stroke-linecap="round" opacity=".8"/>` +
        `<path d="M10 188 C 60 166 100 200 160 186" fill="none" stroke="#fff" stroke-width="1.6" stroke-linecap="round" opacity=".7"/>` +
        copa(r, 300, 24, 16, ['#24563a', '#4c8a5f']) +
        copa(r, 280, 46, 10, ['#24563a', '#4c8a5f'])
      );
    },
  },
  cerro: {
    suelo: ['#b9c98a', '#7d9a55'],
    tinta: '#3a4a22',
    cinta: '#fbf8ee',
    acento: '#d8513a',
    dibujar(r, id) {
      return (
        fondo(id, this.suelo) +
        curvasDeNivel(r, 250, 70, 150, 8, '#fff', 1.3, 0.7) +
        curvasDeNivel(r, 40, 170, 80, 4, '#fff', 1.1) +
        luz(id, 290, 30, 30, '#ffe58a') +
        [[18, 30, 10], [36, 48, 8], [14, 66, 7], [300, 176, 12], [280, 190, 8]].map(([x, y, s]) => copa(r, x, y, s, ['#3b5e2c', '#628a45'])).join('')
      );
    },
  },
  laberinto: {
    suelo: ['#23453f', '#0f2422'],
    tinta: '#06110f',
    cinta: '#e9f2e6',
    acento: '#f2c94c',
    dibujar(r, id) {
      let t = fondo(id, this.suelo);
      // Setos en anillos con un hueco cada uno, como un laberinto de jardín.
      for (let i = 0; i < 5; i++) {
        const rad = 26 + i * 26;
        const hueco = r() * Math.PI * 2;
        const a1 = hueco + 0.5;
        const a2 = hueco + Math.PI * 2 - 0.5;
        const p = (a) => `${f(160 + Math.cos(a) * rad * 1.5)} ${f(100 + Math.sin(a) * rad)}`;
        t += `<path d="M${p(a1)} A${rad * 1.5} ${rad} 0 1 1 ${p(a2)}" fill="none" stroke="#2f6b4a" stroke-width="9" stroke-linecap="round" opacity=".8"/>`;
      }
      for (let i = 0; i < 9; i++) t += luz(id, r() * ANCHO, r() * ALTO, 7, '#f6f08a');
      return t + `<circle cx="290" cy="28" r="12" fill="#f3efd8"/><circle cx="296" cy="24" r="11" fill="#1a3632"/>`;
    },
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

// El caño como una cinta clara con borde oscuro, sus piedras, huecos, salida y meta.
function dibujarCano(m, e) {
  const t = trazarMapa(m);
  const a = encajar(t, 26);
  const pts = [];
  for (let s = 0; s <= t.largo; s += t.largo / 160) {
    const p = t.puntoEn(s);
    pts.push(a(p.x, p.z).map(f).join(','));
  }
  const ruta = pts.join(' ');
  const linea = (color, ancho, extra = '') =>
    `<polyline points="${ruta}" fill="none" stroke="${color}" stroke-width="${ancho}" stroke-linejoin="round" stroke-linecap="round" ${extra}/>`;
  const obst = t.obstaculos
    .map((o) => {
      const [x, y] = a(o.x, o.z);
      return o.tipo === 'hueco'
        ? `<circle cx="${f(x)}" cy="${f(y)}" r="2.8" fill="${e.tinta}"/>`
        : `<circle cx="${f(x + 0.6)}" cy="${f(y + 0.9)}" r="2.7" fill="#000" opacity=".25"/><circle cx="${f(x)}" cy="${f(y)}" r="2.7" fill="#9a9184"/><circle cx="${f(x - 0.8)}" cy="${f(y - 0.9)}" r="1" fill="#fff" opacity=".6"/>`;
    })
    .join('');
  const p0 = t.puntoEn(0);
  const [sx, sy] = a(p0.x, p0.z);
  const pm = t.puntoEn(t.sMeta);
  const [mx, my] = a(pm.x, pm.z);
  return (
    linea('#000', 17, 'opacity=".18" transform="translate(2 3)"') +
    linea(e.tinta, 14) +
    linea(e.cinta, 9.5) +
    linea(e.tinta, 1.2, 'stroke-dasharray="2 7" opacity=".35"') +
    obst +
    // Salida: un punto del color del lugar con aro blanco. Meta: una diana.
    `<circle cx="${f(sx)}" cy="${f(sy)}" r="6.5" fill="${e.acento}" stroke="#fff" stroke-width="2.2"/>` +
    `<circle cx="${f(mx)}" cy="${f(my)}" r="9" fill="#fff" stroke="${e.tinta}" stroke-width="1.5"/><circle cx="${f(mx)}" cy="${f(my)}" r="5.6" fill="${e.acento}"/><circle cx="${f(mx)}" cy="${f(my)}" r="2.2" fill="#fff"/>`
  );
}

// El círculo de tiza con bolinchas desparramadas y la tiradora afuera.
function dibujarCirculo(m) {
  const r = azar(m.id + 'b');
  const colores = ['#e8452c', '#2f8fd1', '#f2cf4a', '#3fae5a', '#8a3fb0', '#f0a030', '#6fd3c8'];
  const bola = (x, y, rad, c) =>
    `<circle cx="${f(x + 1)}" cy="${f(y + 1.4)}" r="${rad}" fill="#000" opacity=".22"/><circle cx="${f(x)}" cy="${f(y)}" r="${rad}" fill="${c}"/><circle cx="${f(x - rad * 0.32)}" cy="${f(y - rad * 0.34)}" r="${f(rad * 0.32)}" fill="#fff" opacity=".75"/>`;
  let bolas = '';
  const puestas = [];
  for (let i = 0; i < 9; i++) {
    let p;
    for (let k = 0; k < 30; k++) {
      const ang = r() * Math.PI * 2;
      const d = Math.sqrt(r()) * 62;
      p = [160 + Math.cos(ang) * d, 104 + Math.sin(ang) * d * 0.62];
      if (puestas.every((q) => Math.hypot(q[0] - p[0], q[1] - p[1]) > 16)) break;
    }
    puestas.push(p);
    bolas += bola(p[0], p[1], 4, colores[i % colores.length]);
  }
  return `<ellipse cx="160" cy="104" rx="80" ry="52" fill="#fff" opacity=".06"/>
    <ellipse cx="160" cy="104" rx="80" ry="52" fill="none" stroke="#fffaf0" stroke-width="3" opacity=".9"/>
    <ellipse cx="160" cy="104" rx="76" ry="49" fill="none" stroke="#fffaf0" stroke-width="1" opacity=".35"/>
    ${bolas}${bola(160, 180, 4, '#6fd3c8')}<circle cx="160" cy="180" r="7" fill="none" stroke="#fff" stroke-width="1.2" opacity=".8"/>`;
}

// SVG completo de un mapa. "bloqueado" lo pinta apagado.
export function ilustracionMapa(m, { bloqueado = false } = {}) {
  const id = `il${++cuenta}`;
  const e = ESCENAS[m.id] || ESCENAS.barrio;
  const escena = e.dibujar(azar(m.id), id);
  const encima = m.modo === 'circulo' ? dibujarCirculo(m) : dibujarCano(m, e);
  const filtro = bloqueado ? `<defs><filter id="${id}g"><feColorMatrix type="saturate" values="0.35"/></filter></defs>` : '';
  return `<svg viewBox="0 0 ${ANCHO} ${ALTO}" class="mapa-ilustracion" aria-hidden="true">${filtro}<g${bloqueado ? ` filter="url(#${id}g)"` : ''}>${escena}${encima}<rect width="${ANCHO}" height="${ALTO}" fill="url(#${id}v)"/></g>${
    bloqueado ? `<rect width="${ANCHO}" height="${ALTO}" fill="#0c2422" opacity=".2"/>` : ''
  }</svg>`;
}
