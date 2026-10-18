// Reglas del Modo Caño: qué pasa después de cada tiro.
// Solo decide; no mueve bolinchas ni dibuja nada. Los interruptores están
// en CONFIG.reglasCano (src/config.js).
import { CONFIG } from '../config.js';

// Recibe el lugar del que tiró y el estado de cada bolincha en el caño:
//   [{ lugar, fuera, enHueco, enMeta, recorrido }]
//   fuera:     saltó la pared
//   enHueco:   cayó en un hueco
//   enMeta:    pasó la línea de meta (y sigue en el caño)
//   recorrido: cm avanzados desde la salida
// Devuelve:
//   ganador:  lugar del que gana, o null
//   devolver: lugares que vuelven a donde estaban antes del tiro (saltaron la pared)
//   aSalida:  lugares que vuelven a la salida (cayeron en un hueco)
export function resolverTiroCano({ tirador, estados }) {
  const devolver = estados.filter((e) => e.fuera).map((e) => e.lugar);
  const aSalida = estados.filter((e) => e.enHueco && !e.fuera).map((e) => e.lugar);

  const enMeta = estados.filter((e) => e.enMeta && !e.fuera && !e.enHueco);
  let ganador = null;
  if (enMeta.some((e) => e.lugar === tirador)) {
    ganador = tirador;
  } else if (enMeta.length > 0 && CONFIG.reglasCano.metaCuentaSiTeEmpujan) {
    // Lo empujaron más allá de la meta: gana el que quedó más adelante.
    ganador = enMeta.reduce((a, b) => (b.recorrido > a.recorrido ? b : a)).lugar;
  }
  return { ganador, devolver, aSalida };
}
