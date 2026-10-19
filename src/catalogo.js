// Catálogo de la Colección: todas las bolinchas que se pueden conseguir.
// Cada fila: [id, nombre, color del vidrio, [colores de la veta], extras]
//   extras (opcional): { claro, esmerilado, metal, opaco, ior, rareza, stats, habilidad }
// La rareza por defecto es la de la serie. Las estadísticas y la habilidad se
// reparten solas según la rareza (siempre iguales para la misma bolincha), salvo
// las que las traen escritas a mano.
//
// Rarezas: 'comun', 'rara', 'ultra'. En la ruleta diaria salen con 75 %, 20 % y 5 %.
// Estadísticas (en % sobre lo normal): fuerza, peso, efecto, punteria.
// Habilidades: ver src/habilidades.js.

const R = 0xd8402c; // rojo
const A = 0xf2cf4a; // amarillo
const V = 0x3fae5a; // verde
const Z = 0x2a8fd6; // azul
const B = 0xf3eee2; // blanco
const N = 0x161616; // negro
const M = 0xa46ee6; // morado

const SERIES = [
  {
    id: 'clasicas',
    nombre: 'Clásicas',
    rareza: 'comun',
    bolinchas: [
      ['azul', 'Azul', 0x1f7fd6, [A, R, B], { claro: 0.1 }],
      ['clasica', 'Clásica', 0x6fd3c8, [R, A, V], { claro: 0.45 }],
      ['celeste', 'Celeste', 0x7cc8f0, [B, Z, A], { claro: 0.4 }],
      ['naranja', 'Naranja', 0xff8a2a, [B, R, A], { claro: 0.15 }],
      ['rosada', 'Rosada', 0xf28bb4, [B, M, A], { claro: 0.3 }],
      ['turquesa', 'Turquesa', 0x1fb5a8, [A, B, R], { claro: 0.25 }],
      ['limon', 'Limón', 0xd8e84a, [V, B, A], { claro: 0.3 }],
      ['uva', 'Uva', 0x6b2f8a, [B, A, M], { claro: 0.1 }],
      ['cielo', 'Cielo', 0x9fd4ff, [B, B, Z], { claro: 0.55 }],
      ['mar', 'Mar', 0x1d6fa0, [B, 0x6fd3c8, A], { claro: 0.2 }],
      ['lima', 'Lima', 0x8fd34a, [A, B, V], { claro: 0.3 }],
      ['coral', 'Coral', 0xff7a6a, [B, A, Z], { claro: 0.25 }],
      ['ambar', 'Ámbar', 0xe0961f, [R, B, A], { claro: 0.2 }],
      ['humo', 'Humo', 0x8a8f96, [B, N, B], { claro: 0.35 }],
      ['vino', 'Vino', 0x7a1d2e, [A, B, R], { claro: 0.05 }],
      ['pino', 'Pino', 0x1f5e3a, [A, B, R], { claro: 0.1 }],
      ['durazno', 'Durazno', 0xffb38a, [R, B, A], { claro: 0.35 }],
      ['lavanda', 'Lavanda', 0xb9a3e8, [B, M, Z], { claro: 0.4 }],
      ['caramelo', 'Caramelo', 0xc4781f, [B, A, R], { claro: 0.15 }],
      ['hielo-azul', 'Hielo azul', 0xcde9f5, [Z, B, Z], { claro: 0.7 }],
    ],
  },
  {
    id: 'lecheras',
    nombre: 'Lecheras',
    rareza: 'comun',
    bolinchas: [
      ['lechera', 'Lechera', 0xf4f1ea, [Z, R, A], { claro: 0.8, esmerilado: 0.35 }],
      ['lechera-roja', 'Lechera roja', 0xf6e3e0, [R, R, A], { claro: 0.8, esmerilado: 0.35 }],
      ['lechera-azul', 'Lechera azul', 0xe3ecf6, [Z, Z, B], { claro: 0.8, esmerilado: 0.35 }],
      ['lechera-verde', 'Lechera verde', 0xe5f3e6, [V, A, V], { claro: 0.8, esmerilado: 0.35 }],
      ['lechera-morada', 'Lechera morada', 0xeee5f6, [M, Z, M], { claro: 0.8, esmerilado: 0.35 }],
      ['crema', 'Crema', 0xf3e6c8, [A, R, A], { claro: 0.75, esmerilado: 0.4 }],
      ['algodon', 'Algodón', 0xfbf4f8, [0xf28bb4, 0x9fd4ff, B], { claro: 0.85, esmerilado: 0.45 }],
      ['perla', 'Perla', 0xf4f2ef, [B, 0xd9f2ff, B], { claro: 0.85, esmerilado: 0.2, rareza: 'rara' }],
      ['marfil', 'Marfil', 0xefe6d2, [0x8a5a2a, A, 0x8a5a2a], { claro: 0.8, esmerilado: 0.4 }],
      ['nata', 'Nata', 0xfaf7ee, [A, A, B], { claro: 0.9, esmerilado: 0.5 }],
    ],
  },
  {
    id: 'frutas',
    nombre: 'Frutas',
    rareza: 'comun',
    bolinchas: [
      ['sandia', 'Sandía', 0xe23a4a, [V, N, V], { claro: 0.1 }],
      ['mango', 'Mango', 0xffb21f, [R, V, A], { claro: 0.15 }],
      ['fresa', 'Fresa', 0xe0283a, [A, B, V], { claro: 0.1 }],
      ['pina', 'Piña', 0xf2c84a, [V, 0x8a5a2a, A], { claro: 0.2 }],
      ['guayaba', 'Guayaba', 0xf47a8a, [V, B, A], { claro: 0.25 }],
      ['mora', 'Mora', 0x3a1440, [M, R, M], { claro: 0.05 }],
      ['kiwi', 'Kiwi', 0x8fbf3a, [N, B, 0x8a5a2a], { claro: 0.2 }],
      ['papaya', 'Papaya', 0xff8a4a, [N, V, A], { claro: 0.2 }],
      ['coco', 'Coco', 0x6b4a2e, [B, B, 0x8a5a2a], { claro: 0.05 }],
      ['maracuya', 'Maracuyá', 0xe8c23a, [M, N, A], { claro: 0.2, rareza: 'rara' }],
    ],
  },
  {
    id: 'naturaleza',
    nombre: 'Naturaleza',
    rareza: 'comun',
    bolinchas: [
      ['pantano', 'Pantano', 0x5a6b2e, [0x8a5a2a, A, 0x9fd66a], { claro: 0.1 }],
      ['selva', 'Selva', 0x1f7a3a, [A, V, R], { claro: 0.15 }],
      ['arena', 'Arena', 0xe0c890, [0x8a5a2a, B, A], { claro: 0.35 }],
      ['rio', 'Río', 0x3a8fc0, [B, V, B], { claro: 0.35 }],
      ['nube', 'Nube', 0xeef3f6, [B, 0x9fd4ff, B], { claro: 0.8, esmerilado: 0.3 }],
      ['musgo', 'Musgo', 0x4a6b2a, [V, A, V], { claro: 0.1 }],
      ['hoja', 'Hoja', 0x5fae3a, [A, V, A], { claro: 0.2 }],
      ['tierra', 'Tierra', 0x7d3f22, [A, 0x8a5a2a, B], { claro: 0.05 }],
      ['ceniza', 'Ceniza', 0x6e6a66, [R, N, B], { claro: 0.1 }],
      ['niebla', 'Niebla', 0xc9d4d8, [B, B, Z], { claro: 0.7, esmerilado: 0.4 }],
      ['arcilla', 'Arcilla', 0xb5643a, [B, A, B], { claro: 0.1 }],
      ['rocio', 'Rocío', 0xd9f5ee, [V, B, Z], { claro: 0.75 }],
      ['tormenta', 'Tormenta', 0x3a4250, [A, B, Z], { claro: 0.05, rareza: 'rara' }],
      ['aurora', 'Aurora', 0x2a3a6a, [V, M, 0x6fd3c8], { claro: 0.05, rareza: 'rara' }],
      ['volcan', 'Volcán', 0x2a1a14, [R, 0xff8a2a, A], { claro: 0.02, rareza: 'rara' }],
    ],
  },
  {
    id: 'animales',
    nombre: 'Animales',
    rareza: 'rara',
    bolinchas: [
      ['tigre', 'Tigre', 0xd9a441, [N, N, A], { claro: 0.05 }],
      ['jaguar', 'Jaguar', 0xe0b04a, [N, 0x8a5a2a, N], { claro: 0.05 }],
      ['cebra', 'Cebra', 0xf4f1ea, [N, N, N], { claro: 0.6, esmerilado: 0.3 }],
      ['tucan', 'Tucán', 0x161616, [A, 0xff8a2a, V], { claro: 0 }],
      ['rana-dorada', 'Rana dorada', 0xffc21f, [N, A, N], { claro: 0.1 }],
      ['lapa', 'Lapa', 0xd8202a, [Z, A, Z], { claro: 0.05 }],
      ['perezoso', 'Perezoso', 0x8a7a5a, [B, N, B], { claro: 0.1, rareza: 'comun' }],
      ['morpho', 'Morpho', 0x1f6fe0, [N, 0x6fd3c8, N], { claro: 0.1 }],
      ['quetzal', 'Quetzal', 0x1f9e6a, [R, V, B], { claro: 0.05, rareza: 'ultra' }],
      ['tortuga', 'Tortuga', 0x5a7a3a, [A, 0x8a5a2a, V], { claro: 0.1, rareza: 'comun' }],
      ['delfin', 'Delfín', 0x6f9fc0, [B, Z, B], { claro: 0.3 }],
      ['pantera', 'Pantera', 0x101010, [M, N, M], { claro: 0, opaco: true }],
    ],
  },
  {
    id: 'piedras',
    nombre: 'Piedras preciosas',
    rareza: 'rara',
    bolinchas: [
      ['esmeralda', 'Esmeralda', 0x0f9b55, [B, A, B], { claro: 0.1 }],
      ['rubi', 'Rubí', 0xc0102a, [B, R, B], { claro: 0.15, ior: 1.8 }],
      ['zafiro', 'Zafiro', 0x1030a0, [B, Z, B], { claro: 0.15, ior: 1.8 }],
      ['amatista', 'Amatista', 0x8a3ad0, [B, M, B], { claro: 0.2 }],
      ['topacio', 'Topacio', 0xffb030, [B, A, B], { claro: 0.25 }],
      ['opalo', 'Ópalo', 0xe8eef0, [0xf28bb4, 0x6fd3c8, A], { claro: 0.7, esmerilado: 0.15 }],
      ['jade', 'Jade', 0x3aa070, [B, V, B], { claro: 0.3, esmerilado: 0.25 }],
      ['onix', 'Ónix', 0x121212, [], { claro: 0, opaco: true, habilidad: 'pesoTriple', stats: { peso: 15 } }],
      ['turmalina', 'Turmalina', 0x2a8a6a, [0xf28bb4, B, V], { claro: 0.2 }],
      ['granate', 'Granate', 0x7a1020, [R, B, R], { claro: 0.1 }],
      ['aguamarina', 'Aguamarina', 0x7fe0d8, [B, Z, B], { claro: 0.55 }],
      ['cuarzo', 'Cuarzo', 0xf6e8f0, [B, 0xf28bb4, B], { claro: 0.8, rareza: 'comun' }],
    ],
  },
  {
    id: 'metales',
    nombre: 'Metales',
    rareza: 'rara',
    bolinchas: [
      ['oro', 'Oro', 0xd4a73a, [], { claro: 0, metal: 0.9, habilidad: 'efectoDoble', stats: { efecto: 10 } }],
      ['plata', 'Plata', 0xc8ccd2, [], { claro: 0, metal: 0.9 }],
      ['bronce', 'Bronce', 0xb07a3a, [], { claro: 0, metal: 0.85 }],
      ['cobre', 'Cobre', 0xc0603a, [], { claro: 0, metal: 0.85 }],
      ['acero', 'Acero', 0x8a929a, [], { claro: 0, metal: 0.8, rareza: 'comun' }],
      ['cromo', 'Cromo', 0xe0e4ea, [], { claro: 0, metal: 1 }],
      ['titanio', 'Titanio', 0x6e7480, [], { claro: 0, metal: 0.9, rareza: 'ultra' }],
      ['platino', 'Platino', 0xe8e6e0, [], { claro: 0, metal: 1, rareza: 'ultra' }],
    ],
  },
  {
    id: 'espacio',
    nombre: 'Espacio',
    rareza: 'rara',
    bolinchas: [
      ['galaxia', 'Galaxia', 0x1b1f5e, [B, M, 0x4fb8d8], { claro: 0, habilidad: 'salto', stats: { punteria: 10 } }],
      ['nebulosa', 'Nebulosa', 0x3a1a5e, [0xf28bb4, 0x6fd3c8, M], { claro: 0.05 }],
      ['cometa', 'Cometa', 0x10203a, [B, 0x9fd4ff, B], { claro: 0.05 }],
      ['luna', 'Luna', 0xd8d8d0, [0x8a8f96, B, 0x8a8f96], { claro: 0.4, esmerilado: 0.4, rareza: 'comun' }],
      ['sol', 'Sol', 0xffb000, [R, A, B], { claro: 0.1 }],
      ['marte', 'Marte', 0xb04a2a, [0x8a5a2a, A, R], { claro: 0.05, rareza: 'comun' }],
      ['saturno', 'Saturno', 0xd8b878, [B, 0x8a5a2a, A], { claro: 0.2 }],
      ['estrella-fugaz', 'Estrella fugaz', 0x0a0a2a, [A, B, A], { claro: 0.02 }],
      ['agujero-negro', 'Agujero negro', 0x050505, [M, 0xff8a2a, M], { claro: 0, rareza: 'ultra' }],
      ['supernova', 'Supernova', 0xfff2c0, [R, Z, M], { claro: 0.3, rareza: 'ultra' }],
    ],
  },
  {
    id: 'elementos',
    nombre: 'Elementos',
    rareza: 'ultra',
    bolinchas: [
      ['fuego', 'Fuego', 0xff5a1f, [A, B, 0xb3200f], { claro: 0.1, rareza: 'rara', habilidad: 'superFuerza', stats: { fuerza: 10 } }],
      ['hielo', 'Hielo', 0xd9f5ff, [B, Z, B], { claro: 0.85, ior: 1.31 }],
      ['rayo', 'Rayo', 0x2a2a50, [A, B, A], { claro: 0.05 }],
      ['lava', 'Lava', 0x3a0a05, [0xff5a1f, A, R], { claro: 0.02 }],
      ['viento', 'Viento', 0xe8f6f2, [B, 0x6fd3c8, B], { claro: 0.8, rareza: 'rara' }],
      ['veneno', 'Veneno', 0x3a8a1a, [0xc0ff3a, N, 0xc0ff3a], { claro: 0.1, rareza: 'rara' }],
      ['plasma', 'Plasma', 0x6a1aa0, [0xf28bb4, 0x6fd3c8, B], { claro: 0.1 }],
      ['sombra', 'Sombra', 0x1a1a24, [0x3a3a50, M, 0x3a3a50], { claro: 0 }],
    ],
  },
  {
    id: 'leyendas',
    nombre: 'Leyendas',
    rareza: 'ultra',
    bolinchas: [
      ['diamante', 'Diamante', 0xf2fbff, [B, 0xd9f2ff, B], { claro: 0.95, ior: 2.2, stats: { punteria: 200, fuerza: 10 }, habilidad: 'perdon' }],
      ['arcoiris', 'Arcoíris', 0xeef6f5, [R, A, Z], { claro: 0.7, rareza: 'rara' }],
      ['caminante', 'Caminante', 0x8f8e88, [B, 0x3b9be0, 0xe2523d], { claro: 0.2, rareza: 'rara', habilidad: 'antiHueco' }],
      ['ojo-de-dragon', 'Ojo de dragón', 0x1a0a05, [A, 0xff5a1f, A], { claro: 0.02 }],
      ['fenix', 'Fénix', 0xff7a1f, [A, R, B], { claro: 0.1, habilidad: 'escudo' }],
      ['bolichon', '{premioMayor}', 0xffc93a, [R, Z, V], { claro: 0.25, stats: { fuerza: 20, peso: 20, punteria: 50 }, habilidad: 'escudo' }],
    ],
  },
];

// Números al azar pero siempre iguales para la misma bolincha (salen de su nombre).
function azarDe(texto) {
  let s = 0;
  for (const c of texto) s = (Math.imul(s, 31) + c.charCodeAt(0)) >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const STATS = ['fuerza', 'peso', 'efecto', 'punteria'];
const HABILIDADES_AL_AZAR = ['superFuerza', 'salto', 'pesoTriple', 'efectoDoble', 'rompePiedras', 'escudo', 'perdon', 'antiHueco'];

// Reparte estadísticas y habilidad según la rareza.
//   común: a veces una estadística de +5 %.
//   rara:  una o dos de +10 o +15 %, y a veces una habilidad.
//   ultra: dos o tres de +15 a +25 %, y siempre una habilidad.
function repartir(id, rareza) {
  const azar = azarDe(id);
  // Mezcla a mano (siempre igual en cualquier teléfono; "sort" al azar no lo es).
  const elegir = (cuantas) => {
    const lista = [...STATS];
    for (let i = lista.length - 1; i > 0; i--) {
      const j = Math.floor(azar() * (i + 1));
      [lista[i], lista[j]] = [lista[j], lista[i]];
    }
    return lista.slice(0, cuantas);
  };
  const stats = {};
  let habilidad = null;
  if (rareza === 'comun') {
    if (azar() < 0.5) stats[elegir(1)[0]] = 5;
  } else if (rareza === 'rara') {
    const cuantas = azar() < 0.5 ? 1 : 2;
    for (const s of elegir(cuantas)) stats[s] = azar() < 0.5 ? 10 : 15;
    if (azar() < 0.45) habilidad = HABILIDADES_AL_AZAR[Math.floor(azar() * HABILIDADES_AL_AZAR.length)];
  } else {
    const cuantas = azar() < 0.5 ? 2 : 3;
    for (const s of elegir(cuantas)) stats[s] = [15, 20, 25][Math.floor(azar() * 3)];
    habilidad = HABILIDADES_AL_AZAR[Math.floor(azar() * HABILIDADES_AL_AZAR.length)];
  }
  // La puntería se nota poco con +5 %: se agranda (es solo el largo de la línea).
  if (stats.punteria) stats.punteria *= 3;
  return { stats, habilidad };
}

export const CATALOGO = SERIES.flatMap((serie) =>
  serie.bolinchas.map(([id, nombre, vidrio, vetas, extras = {}]) => {
    const rareza = extras.rareza || serie.rareza;
    const auto = repartir(id, rareza);
    return {
      id,
      nombre,
      serie: serie.id,
      rareza,
      vidrio,
      vetas,
      claro: extras.claro ?? 0.2,
      esmerilado: extras.esmerilado,
      metal: extras.metal,
      opaco: extras.opaco,
      ior: extras.ior,
      stats: extras.stats || auto.stats,
      habilidad: extras.habilidad !== undefined ? extras.habilidad : auto.habilidad,
    };
  })
);

export const SERIES_COLECCION = SERIES.map((s) => ({ id: s.id, nombre: s.nombre }));

export const RAREZAS = {
  comun: { nombre: 'Común', probabilidad: 0.75 },
  rara: { nombre: 'Rara', probabilidad: 0.2 },
  ultra: { nombre: 'Ultra rara', probabilidad: 0.05 },
};

export const buscarEnCatalogo = (id) => CATALOGO.find((b) => b.id === id) || null;
