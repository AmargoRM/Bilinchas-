// Reglas del Modo Caño: qué pasa después de cada tiro.
// Solo decide; no mueve bolinchas ni dibuja nada. Los interruptores están
// en CONFIG.reglasCano (src/config.js).
import { CONFIG } from '../config.js';

// Recibe, después del tiro:
//   rivalFuera, tiradorFuera: si cada bolincha quedó fuera del caño.
//   tiradorEnMeta, rivalEnMeta: si cada bolincha pasó la meta (y sigue dentro del caño).
// Devuelve:
//   gana: 'tirador' | 'rival' | null
//   motivo: 'saco' | 'meta' | 'metaRival' | 'teSacaste' | 'nada'
//   devolverTirador / devolverRival: si esa bolincha vuelve a donde estaba antes del tiro.
export function resolverTiroCano({ rivalFuera, tiradorFuera, tiradorEnMeta, rivalEnMeta }) {
  const r = CONFIG.reglasCano;

  if (rivalFuera && r.ganaAlSacarRival && (!tiradorFuera || r.ganaAunqueTeSaques)) {
    return { gana: 'tirador', motivo: 'saco', devolverTirador: false, devolverRival: false };
  }
  if (tiradorFuera) {
    // Se sacó a sí mismo: pierde el turno y su bolincha vuelve a donde estaba.
    return { gana: null, motivo: 'teSacaste', devolverTirador: true, devolverRival: rivalFuera };
  }
  if (rivalFuera) {
    // Solo pasa si ganaAlSacarRival está apagado: el rival vuelve a su lugar.
    return { gana: null, motivo: 'nada', devolverTirador: false, devolverRival: true };
  }
  if (r.ganaAlLlegarMeta && tiradorEnMeta) {
    return { gana: 'tirador', motivo: 'meta', devolverTirador: false, devolverRival: false };
  }
  if (r.ganaAlLlegarMeta && r.metaCuentaSiTeEmpujan && rivalEnMeta) {
    return { gana: 'rival', motivo: 'metaRival', devolverTirador: false, devolverRival: false };
  }
  return { gana: null, motivo: 'nada', devolverTirador: false, devolverRival: false };
}
