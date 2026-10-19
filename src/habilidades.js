// Estadísticas y habilidades de las bolinchas de la Colección (ver src/catalogo.js).
// Solo las tiene quien juega en el Lugar 1 con su bolincha de la colección.
//   Estadísticas: siempre activas, en % sobre lo normal.
//   Habilidades activas: una vez por partida, tocando el botón del rayo antes de tirar.
//   Habilidades pasivas: funcionan solas (cada una dice cuándo).
// Los números se aplican en src/main.js (al tirar) y en los modos (las pasivas).
import { buscarEnCatalogo } from './catalogo.js';

export const NOMBRES_STATS = {
  fuerza: 'Fuerza',
  peso: 'Peso',
  efecto: 'Efecto',
  punteria: 'Puntería',
};

// Qué hace cada estadística, para la ficha de la colección.
export const EXPLICACION_STATS = {
  fuerza: 'tus tiros salen más rápido',
  peso: 'empuja más fuerte a las que golpea',
  efecto: 'el efecto (seguir, retroceso, curva) se nota más',
  punteria: 'la línea de puntería es más larga',
};

export const HABILIDADES = {
  superFuerza: { nombre: 'Súper fuerza', tipo: 'activa', texto: 'Una vez por partida: un tiro con 50 % más de fuerza.', fuerza: 1.5 },
  salto: { nombre: 'Salto', tipo: 'activa', texto: 'Una vez por partida: sale saltando y pasa por encima de lo que tenga adelante.', salto: 120 },
  pesoTriple: { nombre: 'Peso triple', tipo: 'activa', texto: 'Una vez por partida: en ese tiro pesa el triple y empuja como {un} {boliche}.', peso: 3 },
  efectoDoble: { nombre: 'Efecto doble', tipo: 'activa', texto: 'Una vez por partida: el efecto de ese tiro es el doble de fuerte.', efecto: 2 },
  rompePiedras: { nombre: 'Rompe piedras', tipo: 'pasiva', texto: 'Si choca con una piedra del círculo, la rompe y la saca del juego.' },
  escudo: { nombre: 'Escudo', tipo: 'pasiva', texto: 'La primera explosión de cada partida no la mueve.' },
  perdon: { nombre: 'Perdón', tipo: 'pasiva', texto: 'Tu primera falta de cada partida no se cobra.' },
  antiHueco: { nombre: 'Anti hueco', tipo: 'pasiva', texto: 'La primera vez que pasa por un hueco {del_c} {caño}, no cae.' },
};

// Lo que trae una bolincha: { stats, habilidad } (vacío si no es de la colección).
export function perfilDe(id) {
  const b = buscarEnCatalogo(id);
  return { stats: b?.stats || {}, habilidad: b ? HABILIDADES[b.habilidad] || null : null, idHabilidad: b?.habilidad || null };
}

// "Fuerza +10 %", "Peso +15 %"... para mostrar.
export function lineasDeStats(stats) {
  return Object.entries(stats)
    .filter(([, v]) => v)
    .map(([k, v]) => ({ nombre: NOMBRES_STATS[k], valor: `+${v} %`, explicacion: EXPLICACION_STATS[k] }));
}

// Multiplicador de una estadística (0,10 → 1,10).
export const multiplicador = (stats, clave) => 1 + (stats[clave] || 0) / 100;
