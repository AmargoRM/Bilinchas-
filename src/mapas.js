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

export const MAPAS = [
  {
    id: 'escuela',
    nombre: 'La escuela',
    descripcion: 'El caño que da la vuelta a la escuela: esquinas, curvas, piedras y huecos.',
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
];

export function buscarMapa(id) {
  return MAPAS.find((m) => m.id === id) || MAPAS[0];
}
