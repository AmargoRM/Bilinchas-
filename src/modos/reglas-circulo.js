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

  if (tiradorDentro && r.pierdeTurnoSiQuedaDentro) {
    return { cuentan: r.cuentanSiQuedaDentro, repite: false, motivo: 'dentro' };
  }
  if (sacadas > 0) {
    return { cuentan: true, repite: r.repiteSiSaca, motivo: 'saco' };
  }
  return { cuentan: true, repite: false, motivo: 'ninguna' };
}

// Quién ganó cuando el círculo queda vacío. Devuelve el índice del ganador, o null si hay empate.
export function ganador(jugadores) {
  const [a, b] = jugadores;
  if (a.puntos === b.puntos) return null;
  return a.puntos > b.puntos ? 0 : 1;
}
