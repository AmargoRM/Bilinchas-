// Reglas del Modo Círculo: qué pasa después de cada tiro.
// Solo decide; no mueve bolinchas ni dibuja nada. Los interruptores están
// en CONFIG.reglasCirculo (src/config.js).
import { CONFIG } from '../config.js';

// sacadas: cuántas bolinchas salieron del círculo con este tiro.
// tiradorDentro: si la bolincha del que tiró quedó dentro del círculo.
// falta: null si el tiro vale; 'nada' si no le pegó a ninguna; 'orden' si le pegó
//   primero a otra que no era la que tocaba (como en el pool).
// exploto: si en este tiro explotó alguna explosiva (entonces pierde el turno igual).
// Devuelve:
//   cuentan: si el tirador se queda con las que sacó (si no, vuelven al círculo).
//   repite:  si vuelve a tirar.
//   motivo:  'falta' | 'dentro' | 'saco' | 'ninguna' (para explicarle al jugador).
export function resolverTiro({ sacadas, tiradorDentro, falta = null, exploto = false }) {
  const r = CONFIG.reglasCirculo;

  // Falta: lo que haya salido vuelve al círculo y pasa el turno.
  if (falta) return { cuentan: false, repite: false, motivo: 'falta' };
  // Si sacó al menos una, sigue tirando (aunque su bolincha haya quedado dentro),
  // salvo que haya explotado algo: entonces se las lleva, pero pierde el turno.
  if (sacadas > 0) return { cuentan: true, repite: r.repiteSiSaca && !exploto, motivo: 'saco' };
  // No sacó ninguna: pasa el turno (solo cambia el mensaje si quedó dentro).
  if (tiradorDentro) return { cuentan: true, repite: false, motivo: 'dentro' };
  return { cuentan: true, repite: false, motivo: 'ninguna' };
}

// Quién ganó cuando el círculo queda vacío. Devuelve el índice del ganador,
// o null si dos o más empatan con la mayor cantidad.
export function ganador(jugadores) {
  const mejor = Math.max(...jugadores.map((j) => j.puntos));
  const primeros = jugadores.map((j, i) => (j.puntos === mejor ? i : -1)).filter((i) => i >= 0);
  return primeros.length === 1 ? primeros[0] : null;
}
