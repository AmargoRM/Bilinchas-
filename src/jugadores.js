// Jugadores compartidos por todos los modos: colores, nombres y la "mesa"
// (quién se sienta en cada uno de los 4 lugares: persona, computadora o nadie).
import { crearBolincha } from './bolincha.js';
import { tx } from './textos.js';

export const MAX_JUGADORES = 4;

export const COLORES_JUGADORES = [
  { diseno: 'azul', color: '#3b9be0' },
  { diseno: 'roja', color: '#e2523d' },
  { diseno: 'amarilla', color: '#f0c43a' },
  { diseno: 'morada', color: '#a46ee6' },
];

// Con qué tira cada lugar: bolincha normal o boliche (más grande y pesado).
export const TAMANOS = [
  { valor: 'normal', texto: 'Normal' },
  { valor: 'boliche', texto: '{Boliche}' },
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
export const TAMANOS_INICIALES = ['normal', 'normal', 'normal', 'normal'];

// Crea los 4 jugadores posibles, cada uno con una bolincha normal y un boliche
// guardados (fuera del suelo). "bolincha" es la que usa en la partida.
export function crearJugadores({ escena, fisica, superficie = 'tierra' }) {
  return COLORES_JUGADORES.map((c, i) => {
    const deTipo = (tipo) => {
      const b = crearBolincha({ escena, fisica, posicion: { x: 0, z: 0 }, tipo, diseno: c.diseno, aro: c.color });
      b.usarSuperficie(superficie);
      b.quitar();
      return b;
    };
    const tipos = { normal: deTipo('normal'), boliche: deTipo('boliche') };
    return { ...c, lugar: i, nombre: '', esTu: false, esComputadora: false, nivel: null, enCancha: false, tipos, bolincha: tipos.normal, vestida: c.diseno };
  });
}

// Todas las bolinchas de los jugadores (normales y boliches).
export const bolinchasDe = (todos) => todos.flatMap((j) => [j.tipos.normal, j.tipos.boliche]);

// Prepara los jugadores según la mesa y devuelve solo los que juegan, en orden.
// Nombres: si hay una sola persona, es "Tú"; si hay varias, "Jugador 1", "Jugador 2"...
// disenoDueno: la bolincha que eligió en Logros quien juega en el Lugar 1 (si es persona).
export function sentarJugadores(todos, mesa, tamanos = TAMANOS_INICIALES, disenoDueno = null) {
  const personas = mesa.filter((a) => a === 'persona').length;
  const compus = mesa.filter((a) => a !== 'persona' && a !== 'nadie').length;
  let numeroCompu = 0;
  const activos = [];
  todos.forEach((j, i) => {
    const a = mesa[i];
    j.enCancha = false;
    j.tipos.normal.quitar();
    j.tipos.boliche.quitar();
    j.bolincha = j.tipos[tamanos[i]] || j.tipos.normal;
    const diseno = i === 0 && a === 'persona' && disenoDueno ? disenoDueno : j.diseno;
    if (j.vestida !== diseno) {
      j.tipos.normal.vestir(diseno);
      j.tipos.boliche.vestir(diseno);
      j.vestida = diseno;
    }
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

// Lo que el progreso necesita saber de la partida, visto desde el Lugar 1.
// Devuelve null si en el Lugar 1 no juega una persona (entonces no se anota nada).
export function resultadoParaProgreso({ modo, jugadores, ganador, extra = {} }) {
  const dueno = jugadores.find((j) => j.lugar === 0);
  if (!dueno || dueno.esComputadora) return null;
  return {
    modo,
    gano: ganador === dueno,
    empate: ganador === null,
    rivales: jugadores.filter((j) => j !== dueno).map((j) => (j.esComputadora ? j.nivel : 'persona')),
    jugadores: jugadores.length,
    conBoliche: dueno.bolincha.tipo === 'boliche',
    ...extra,
  };
}

// Cómo se nombra a un jugador en una frase: "Tú", "la computadora", "Jugador 2"...
export function sujeto(j, mayuscula = true) {
  if (j.esTu) return mayuscula ? 'Tú' : 'tú';
  if (j.nombre === 'Computadora') return mayuscula ? 'La computadora' : 'la computadora';
  return j.nombre;
}

// Selectores de la mesa para la tarjeta de inicio: quién juega en cada lugar y con qué tira.
// "alCambiar" se llama después de cada cambio (para guardar las preferencias).
export function selectoresMesa(preferencias, alCambiar) {
  return COLORES_JUGADORES.map((c, i) => ({
    etiqueta: `${i + 1}`,
    color: c.color,
    // Los dos primeros lugares siempre juegan: tiene que haber al menos dos jugadores.
    opciones: i < 2 ? ASIENTOS.filter((a) => a.valor !== 'nadie') : ASIENTOS,
    valor: preferencias.mesa[i],
    alCambiar: (v) => {
      preferencias.mesa[i] = v;
      alCambiar();
    },
    extra: {
      opciones: TAMANOS.map((t) => ({ ...t, texto: tx(t.texto) })),
      valor: preferencias.tamanos[i],
      alCambiar: (v) => {
        preferencias.tamanos[i] = v;
        alCambiar();
      },
    },
  }));
}

// Recuerda la mesa y el mapa elegidos en este teléfono (comodidad; si falla, no pasa nada).
const CLAVE = 'ojo-de-gato.mesa';
let preferencias = null; // una sola copia, compartida por todos los modos
export function leerPreferencias() {
  if (!preferencias) preferencias = cargar();
  return preferencias;
}
function cargar() {
  try {
    const p = JSON.parse(localStorage.getItem(CLAVE)) || {};
    const valida = Array.isArray(p.mesa) && p.mesa.length === MAX_JUGADORES && p.mesa.every((a) => ASIENTOS.some((x) => x.valor === a));
    const tamanosValidos =
      Array.isArray(p.tamanos) && p.tamanos.length === MAX_JUGADORES && p.tamanos.every((t) => TAMANOS.some((x) => x.valor === t));
    return {
      mesa: valida ? p.mesa : [...MESA_INICIAL],
      tamanos: tamanosValidos ? p.tamanos : [...TAMANOS_INICIALES],
      mapa: typeof p.mapa === 'string' ? p.mapa : null,
      mapaCirculo: typeof p.mapaCirculo === 'string' ? p.mapaCirculo : null,
    };
  } catch {
    return { mesa: [...MESA_INICIAL], tamanos: [...TAMANOS_INICIALES], mapa: null, mapaCirculo: null };
  }
}
export function guardarPreferencias(p) {
  try {
    localStorage.setItem(CLAVE, JSON.stringify(p));
  } catch {
    // Sin almacenamiento: se elige de nuevo la próxima vez.
  }
}
