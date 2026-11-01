// Mapas del Modo Caño. Cada mapa es una lista de piezas, en orden desde la salida:
//   { recta: 200 }                         tramo recto de 200 cm
//   { gira: 'derecha' }                    esquina cuadrada (90°)
//   { gira: 'izquierda', radio: 60 }       curva de 90° con ese radio (cm)
// Dentro de una recta se pueden poner obstáculos, medidos desde el comienzo de esa recta:
//   en:   cm desde el comienzo de la recta
//   lado: cm hacia la derecha (+) o la izquierda (−) del centro del caño
//   { piedra: { en: 120, lado: 5, tamano: 2.4 } }   piedra (tamano = radio en cm)
//   { hueco:  { en: 80, lado: -3, radio: 2.6 } }    hueco: si la bolincha pasa lenta, cae y vuelve a la salida
// "meta": cm antes del final del caño donde está la línea de meta.
// "nivel": desde qué nivel de quien juega se puede elegir el mapa (1 = desde el principio).

export const MAPAS = [
  {
    id: 'escuela',
    nombre: 'La escuela',
    nivel: 1,
    descripcion: '{El_c} {caño} que da la vuelta a la escuela: esquinas, curvas, piedras y huecos.',
    meta: 40,
    piezas: [
      { recta: 260, obstaculos: [{ piedra: { en: 150, lado: 5, tamano: 2.4 } }] },
      { gira: 'derecha' },
      { recta: 200, obstaculos: [{ hueco: { en: 110, lado: -3, radio: 2.8 } }] },
      { gira: 'izquierda', radio: 60 },
      { recta: 220, obstaculos: [{ piedra: { en: 60, lado: 6, tamano: 2.0 } }, { hueco: { en: 140, lado: -4, radio: 2.6 } }] },
      { gira: 'izquierda' },
      { recta: 160, obstaculos: [{ piedra: { en: 90, lado: -5, tamano: 2.6 } }] },
      { gira: 'derecha', radio: 45 },
      { recta: 300, obstaculos: [{ hueco: { en: 150, lado: 4, radio: 2.8 } }, { piedra: { en: 210, lado: -4, tamano: 2.2 } }] },
    ],
  },
  {
    id: 'zigzag',
    nombre: 'Zigzag',
    nivel: 3,
    descripcion: 'Cuatro esquinas cuadradas seguidas: para jugar a la banda.',
    meta: 40,
    piezas: [
      { recta: 200, obstaculos: [{ hueco: { en: 140, lado: 3, radio: 2.6 } }] },
      { gira: 'derecha' },
      { recta: 130, obstaculos: [{ piedra: { en: 70, lado: 0, tamano: 2.2 } }] },
      { gira: 'izquierda' },
      { recta: 130 },
      { gira: 'derecha' },
      { recta: 130, obstaculos: [{ hueco: { en: 60, lado: -4, radio: 2.8 } }] },
      { gira: 'izquierda' },
      { recta: 260, obstaculos: [{ piedra: { en: 100, lado: 5, tamano: 2.4 } }, { hueco: { en: 180, lado: -2, radio: 2.6 } }] },
    ],
  },
  {
    id: 'barrio',
    nombre: 'El barrio',
    nivel: 5,
    descripcion: 'Curvas largas que bajan por la calle, con piedras sueltas.',
    meta: 40,
    piezas: [
      { recta: 150, obstaculos: [{ piedra: { en: 90, lado: -4, tamano: 2.0 } }] },
      { gira: 'izquierda', radio: 80 },
      { recta: 100 },
      { gira: 'derecha', radio: 80 },
      { recta: 100, obstaculos: [{ hueco: { en: 50, lado: 3, radio: 2.8 } }] },
      { gira: 'derecha', radio: 60 },
      { recta: 150, obstaculos: [{ piedra: { en: 60, lado: 5, tamano: 2.6 } }, { piedra: { en: 110, lado: -5, tamano: 2.0 } }] },
      { gira: 'izquierda', radio: 60 },
      { recta: 260, obstaculos: [{ hueco: { en: 120, lado: 0, radio: 2.6 } }, { piedra: { en: 190, lado: 4, tamano: 2.4 } }] },
    ],
  },
  // ---------- Mapas largos (se desbloquean subiendo de nivel) ----------
  {
    id: 'avenida',
    nombre: 'La avenida',
    nivel: 2,
    descripcion: 'Un {caño} largo junto a la avenida: curvas suaves, piedras y huecos.',
    meta: 40,
    piezas: [
      { recta: 350, obstaculos: [{ piedra: { en: 200, lado: 4, tamano: 2.2 } }] },
      { gira: 'izquierda', radio: 120 },
      { recta: 300, obstaculos: [{ hueco: { en: 150, lado: -3, radio: 2.6 } }] },
      { gira: 'derecha', radio: 120 },
      { recta: 400, obstaculos: [{ piedra: { en: 120, lado: -5, tamano: 2.4 } }, { hueco: { en: 280, lado: 3, radio: 2.8 } }] },
      { gira: 'derecha', radio: 100 },
      { recta: 250, obstaculos: [{ piedra: { en: 130, lado: 0, tamano: 2.0 } }] },
      { gira: 'izquierda', radio: 100 },
      { recta: 450, obstaculos: [{ hueco: { en: 200, lado: -4, radio: 2.6 } }, { piedra: { en: 330, lado: 5, tamano: 2.4 } }] },
    ],
  },
  {
    id: 'mercado',
    nombre: 'El mercado',
    nivel: 4,
    descripcion: 'Da vueltas por detrás del mercado: muchas esquinas cuadradas para jugar a la banda.',
    meta: 40,
    piezas: [
      { recta: 220, obstaculos: [{ piedra: { en: 110, lado: -4, tamano: 2.2 } }] },
      { gira: 'derecha' },
      { recta: 180, obstaculos: [{ hueco: { en: 90, lado: 3, radio: 2.6 } }] },
      { gira: 'izquierda' },
      { recta: 260, obstaculos: [{ piedra: { en: 80, lado: 6.5, tamano: 2.0 } }, { piedra: { en: 180, lado: -6.5, tamano: 2.0 } }] },
      { gira: 'izquierda' },
      { recta: 180, obstaculos: [{ hueco: { en: 100, lado: 0, radio: 2.8 } }] },
      { gira: 'derecha' },
      { recta: 240, obstaculos: [{ piedra: { en: 120, lado: 0, tamano: 2.4 } }] },
      { gira: 'derecha' },
      { recta: 160 },
      { gira: 'izquierda' },
      { recta: 300, obstaculos: [{ hueco: { en: 120, lado: -4, radio: 2.6 } }, { piedra: { en: 220, lado: 4, tamano: 2.2 } }] },
      { gira: 'izquierda' },
      { recta: 200, obstaculos: [{ piedra: { en: 100, lado: -3, tamano: 2.4 } }] },
      { gira: 'derecha' },
      { recta: 320, obstaculos: [{ hueco: { en: 160, lado: 3, radio: 2.8 } }] },
    ],
  },
  {
    id: 'quebrada',
    nombre: 'La quebrada',
    nivel: 6,
    descripcion: 'Baja serpenteando hacia la quebrada: curvas cerradas y muchos huecos.',
    meta: 40,
    piezas: [
      { recta: 300, obstaculos: [{ hueco: { en: 150, lado: 2, radio: 2.8 } }] },
      { gira: 'izquierda', radio: 80 },
      { recta: 200, obstaculos: [{ piedra: { en: 100, lado: -4, tamano: 2.4 } }] },
      { gira: 'derecha', radio: 80 },
      { recta: 200, obstaculos: [{ hueco: { en: 100, lado: -3, radio: 2.8 } }] },
      { gira: 'derecha', radio: 80 },
      { recta: 200, obstaculos: [{ hueco: { en: 90, lado: 4, radio: 2.6 } }, { piedra: { en: 160, lado: -4, tamano: 2.2 } }] },
      { gira: 'izquierda', radio: 80 },
      { recta: 300, obstaculos: [{ hueco: { en: 120, lado: 0, radio: 3.0 } }, { piedra: { en: 220, lado: 5, tamano: 2.4 } }] },
      { gira: 'izquierda', radio: 60 },
      { recta: 200, obstaculos: [{ piedra: { en: 100, lado: 0, tamano: 2.2 } }] },
      { gira: 'derecha', radio: 60 },
      { recta: 400, obstaculos: [{ hueco: { en: 150, lado: -4, radio: 2.8 } }, { hueco: { en: 300, lado: 4, radio: 2.8 } }] },
    ],
  },
  {
    id: 'cerro',
    nombre: 'El cerro',
    nivel: 7,
    descripcion: 'El {caño} más largo del barrio, cerro abajo: rectas con piedras en zigzag y huecos.',
    meta: 40,
    piezas: [
      { recta: 400, obstaculos: [{ piedra: { en: 120, lado: -5, tamano: 2.2 } }, { piedra: { en: 240, lado: 5, tamano: 2.2 } }, { piedra: { en: 340, lado: -4, tamano: 2.2 } }] },
      { gira: 'derecha', radio: 150 },
      { recta: 300, obstaculos: [{ hueco: { en: 150, lado: 0, radio: 2.8 } }] },
      { gira: 'izquierda', radio: 150 },
      { recta: 500, obstaculos: [{ piedra: { en: 100, lado: 4, tamano: 2.2 } }, { hueco: { en: 220, lado: -3, radio: 2.6 } }, { piedra: { en: 350, lado: -5, tamano: 2.4 } }, { hueco: { en: 450, lado: 4, radio: 2.6 } }] },
      { gira: 'izquierda' },
      { recta: 250, obstaculos: [{ piedra: { en: 130, lado: 0, tamano: 2.4 } }] },
      { gira: 'derecha' },
      { recta: 400, obstaculos: [{ hueco: { en: 120, lado: -4, radio: 2.8 } }, { piedra: { en: 250, lado: 4, tamano: 2.2 } }, { hueco: { en: 330, lado: 0, radio: 2.6 } }] },
      { gira: 'derecha', radio: 100 },
      { recta: 300, obstaculos: [{ piedra: { en: 150, lado: -5, tamano: 2.4 } }] },
      { gira: 'izquierda', radio: 100 },
      { recta: 500, obstaculos: [{ hueco: { en: 160, lado: 3, radio: 2.8 } }, { piedra: { en: 300, lado: -3, tamano: 2.2 } }, { hueco: { en: 420, lado: -4, radio: 2.8 } }] },
    ],
  },
  {
    id: 'laberinto',
    nombre: 'El laberinto',
    nivel: 8,
    descripcion: 'Para los mejores: un zigzag de esquinas cuadradas que no se acaba.',
    meta: 40,
    piezas: [
      { recta: 200, obstaculos: [{ piedra: { en: 100, lado: 4, tamano: 2.2 } }] },
      { gira: 'derecha' },
      { recta: 160, obstaculos: [{ hueco: { en: 80, lado: -3, radio: 2.6 } }] },
      { gira: 'izquierda' },
      { recta: 160 },
      { gira: 'izquierda' },
      { recta: 160, obstaculos: [{ piedra: { en: 80, lado: 0, tamano: 2.4 } }] },
      { gira: 'derecha' },
      { recta: 200, obstaculos: [{ hueco: { en: 100, lado: 4, radio: 2.8 } }] },
      { gira: 'derecha' },
      { recta: 160, obstaculos: [{ piedra: { en: 80, lado: -4, tamano: 2.2 } }] },
      { gira: 'izquierda' },
      { recta: 160, obstaculos: [{ hueco: { en: 80, lado: 3, radio: 2.6 } }] },
      { gira: 'izquierda' },
      { recta: 160 },
      { gira: 'derecha' },
      { recta: 250, obstaculos: [{ piedra: { en: 90, lado: 5, tamano: 2.2 } }, { hueco: { en: 170, lado: -4, radio: 2.8 } }] },
      { gira: 'derecha' },
      { recta: 160, obstaculos: [{ piedra: { en: 80, lado: 0, tamano: 2.4 } }] },
      { gira: 'izquierda' },
      { recta: 160 },
      { gira: 'izquierda' },
      { recta: 160, obstaculos: [{ hueco: { en: 80, lado: 0, radio: 2.8 } }] },
      { gira: 'derecha' },
      { recta: 350, obstaculos: [{ piedra: { en: 120, lado: -5, tamano: 2.2 } }, { hueco: { en: 240, lado: 4, radio: 2.8 } }] },
    ],
  },
];

// Mapas del Modo Círculo: dónde se dibuja el círculo y de qué es el suelo
// (ver CONFIG.superficies: cambia cuánto rueda la bolincha).
export const MAPAS_CIRCULO = [
  { id: 'patio', nombre: 'El patio', nivel: 1, superficie: 'tierra', descripcion: 'Tierra de patio: la {bolincha} frena rápido.' },
  {
    id: 'calle',
    nombre: 'La calle',
    nivel: 2,
    superficie: 'asfalto',
    descripcion: 'El círculo en el asfalto de la calle, frente a las casas. Ojo: en el asfalto {la} {bolincha} rueda más lejos.',
  },
];

export function buscarMapa(id, lista = MAPAS) {
  return lista.find((m) => m.id === id) || lista[0];
}

// Los mapas que ya se pueden elegir con ese nivel.
export function mapasDisponibles(lista, nivel) {
  return lista.filter((m) => (m.nivel || 1) <= nivel);
}

// Opciones para el selector de mapas: todos, los bloqueados con candado y su nivel
// (así se ve lo que viene).
export function opcionesDeMapas(lista, nivel) {
  return [...lista].sort((a, b) => (a.nivel || 1) - (b.nivel || 1)).map((m) => {
    const bloqueada = (m.nivel || 1) > nivel;
    return { valor: m.id, texto: bloqueada ? `🔒 ${m.nombre} · nivel ${m.nivel}` : m.nombre, bloqueada };
  });
}

// Texto para un mapa bloqueado que se está mirando.
export const textoBloqueado = (m, nivel) =>
  `🔒 ${m.nombre} se desbloquea en el nivel ${m.nivel} (tú estás en el nivel ${nivel}). Detrás se ve cómo es.`;

// El próximo mapa por desbloquear (o null si ya están todos).
export function proximoMapa(lista, nivel) {
  return lista.filter((m) => (m.nivel || 1) > nivel).sort((a, b) => a.nivel - b.nivel)[0] || null;
}
