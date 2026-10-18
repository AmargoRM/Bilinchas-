// Reglas del Modo Círculo: qué pasa después de cada tiro.
// Solo decide; no mueve bolinchas ni dibuja nada. Los interruptores están
// en CONFIG.reglasCirculo (src/config.js).
import { CONFIG } from '../config.js';

// sacadas: cuántas bolinchas salieron del círculo con este tiro.
// tiradorDentro: si la bolincha del que tiró quedó dentro del círculo.
// Devuelve:
//   cuentan: si el tirador se queda con las que sacó.
//   repite:  si vuelve a tirar.
//   motivo:  'dentro' | 'saco' | 'ninguna' (para explicarle al jugador).
export function resolverTiro({ sacadas, tiradorDentro }) {
  const r = CONFIG.reglasCirculo;

  // Si sacó al menos una, sigue tirando, aunque su bolincha haya quedado dentro del círculo.
  if (sacadas > 0) {
    return { cuentan: true, repite: r.repiteSiSaca, motivo: 'saco' };
  }
  // No sacó ninguna: pasa el turno (solo cambia el mensaje si quedó dentro).
  if (tiradorDentro) {
    return { cuentan: true, repite: false, motivo: 'dentro' };
  }
  return { cuentan: true, repite: false, motivo: 'ninguna' };
}

// Quién ganó cuando el círculo queda vacío. Devuelve el índice del ganador,
// o null si dos o más empatan con la mayor cantidad.
export function ganador(jugadores) {
  const mejor = Math.max(...jugadores.map((j) => j.puntos));
  const primeros = jugadores.map((j, i) => (j.puntos === mejor ? i : -1)).filter((i) => i >= 0);
  return primeros.length === 1 ? primeros[0] : null;
}
