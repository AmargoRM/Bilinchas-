// Jugadores compartidos por todos los modos: colores, nombres y la "mesa"
// (quién se sienta en cada uno de los 4 lugares: persona, computadora o nadie).
import { crearBolincha } from './bolincha.js';

export const MAX_JUGADORES = 4;

export const COLORES_JUGADORES = [
  { vidrio: 0x2a8fd6, veta: 0xf2cf4a, color: '#3b9be0' }, // azul
  { vidrio: 0xd8402c, veta: 0xf2cf4a, color: '#e2523d' }, // rojo
  { vidrio: 0xe8b923, veta: 0xd8402c, color: '#f0c43a' }, // amarillo
  { vidrio: 0x8a4fd6, veta: 0xf2cf4a, color: '#a46ee6' }, // morado
];

// Lo que puede haber en cada lugar de la mesa.
export const ASIENTOS = [
  { valor: 'persona', texto: 'Persona' },
  { valor: 'facil', texto: 'Computadora · Fácil' },
  { valor: 'medio', texto: 'Computadora · Medio' },
  { valor: 'dificil', texto: 'Computadora · Difícil' },
  { valor: 'nadie', texto: 'Nadie' },
];

export const MESA_INICIAL = ['persona', 'medio', 'nadie', 'nadie'];

// Crea los 4 jugadores posibles, con su bolincha guardada (fuera del suelo).
export function crearJugadores({ escena, fisica, superficie = 'tierra' }) {
  return COLORES_JUGADORES.map((c, i) => {
    const bolincha = crearBolincha({ escena, fisica, posicion: { x: 0, z: 0 }, colorVidrio: c.vidrio, colorVeta: c.veta });
    bolincha.usarSuperficie(superficie);
    bolincha.quitar();
    return { ...c, lugar: i, nombre: '', esTu: false, esComputadora: false, nivel: null, enCancha: false, bolincha };
  });
}

// Prepara los jugadores según la mesa y devuelve solo los que juegan, en orden.
// Nombres: si hay una sola persona, es "Tú"; si hay varias, "Jugador 1", "Jugador 2"...
export function sentarJugadores(todos, mesa) {
  const personas = mesa.filter((a) => a === 'persona').length;
  const compus = mesa.filter((a) => a !== 'persona' && a !== 'nadie').length;
  let numeroCompu = 0;
  const activos = [];
  todos.forEach((j, i) => {
    const a = mesa[i];
    j.enCancha = false;
    j.bolincha.quitar();
    if (a === 'nadie') return;
    j.esComputadora = a !== 'persona';
    j.nivel = j.esComputadora ? a : null;
    j.esTu = !j.esComputadora && personas === 1;
    if (j.esTu) j.nombre = 'Tú';
    else if (!j.esComputadora) j.nombre = `Jugador ${i + 1}`;
    else j.nombre = compus === 1 ? 'Computadora' : `Computadora ${++numeroCompu}`;
    activos.push(j);
  });
  return activos;
}

// ¿Hay alguna persona que deba pasarle el teléfono a otra?
export function hayVariasPersonas(activos) {
  return activos.filter((j) => !j.esComputadora).length > 1;
}

// Cómo se nombra a un jugador en una frase: "Tú", "la computadora", "Jugador 2"...
export function sujeto(j, mayuscula = true) {
  if (j.esTu) return mayuscula ? 'Tú' : 'tú';
  if (j.nombre === 'Computadora') return mayuscula ? 'La computadora' : 'la computadora';
  return j.nombre;
}

// Selectores de la mesa para la tarjeta de inicio. "alCambiar" recibe la mesa nueva.
export function selectoresMesa(mesa, alCambiar) {
  return COLORES_JUGADORES.map((c, i) => ({
    etiqueta: `Lugar ${i + 1}`,
    color: c.color,
    // Los dos primeros lugares siempre juegan: tiene que haber al menos dos jugadores.
    opciones: i < 2 ? ASIENTOS.filter((a) => a.valor !== 'nadie') : ASIENTOS,
    valor: mesa[i],
    alCambiar: (v) => {
      mesa[i] = v;
      alCambiar(mesa);
    },
  }));
}

// Recuerda la mesa y el mapa elegidos en este teléfono (comodidad; si falla, no pasa nada).
const CLAVE = 'ojo-de-gato.mesa';
export function leerPreferencias() {
  try {
    const p = JSON.parse(localStorage.getItem(CLAVE)) || {};
    const valida = Array.isArray(p.mesa) && p.mesa.length === MAX_JUGADORES && p.mesa.every((a) => ASIENTOS.some((x) => x.valor === a));
    return { mesa: valida ? p.mesa : [...MESA_INICIAL], mapa: typeof p.mapa === 'string' ? p.mapa : null };
  } catch {
    return { mesa: [...MESA_INICIAL], mapa: null };
  }
}
export function guardarPreferencias(p) {
  try {
    localStorage.setItem(CLAVE, JSON.stringify(p));
  } catch {
    // Sin almacenamiento: se elige de nuevo la próxima vez.
  }
}
