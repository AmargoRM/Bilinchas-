// Diseños de bolinchas "ojo de gato": color del vidrio y colores de los tres pétalos de la veta.
// "claro" (0 a 1): cuánto se aclara el vidrio. Más alto = vidrio más transparente.
// Opcionales:
//   esmerilado (0 a 1): vidrio opaco como lechoso. ior: cuánto dobla la luz (diamante = 2.2).
//   metal (0 a 1): bolincha de metal, sin veta. opaco: true = sin transparencia y sin veta.
export const DISENOS = {
  // Bolinchas de tiro de cada lugar de la mesa (vidrio del color del jugador).
  azul: { nombre: 'Azul', vidrio: 0x1f7fd6, vetas: [0xf2cf4a, 0xd8402c, 0xf3eee2], claro: 0.1 },
  roja: { nombre: 'Roja', vidrio: 0xd23a26, vetas: [0xf2cf4a, 0xf3eee2, 0x2a8fd6], claro: 0.1 },
  amarilla: { nombre: 'Amarilla', vidrio: 0xe8b923, vetas: [0xd8402c, 0x2a8fd6, 0x3fae5a], claro: 0.05 },
  morada: { nombre: 'Morada', vidrio: 0x7d45d0, vetas: [0xf2cf4a, 0xf3eee2, 0x3fae5a], claro: 0.1 },

  // Bolinchas del círculo: las clásicas de barrio.
  clasica: { nombre: 'Clásica', vidrio: 0x6fd3c8, vetas: [0xd8402c, 0xf2cf4a, 0x3fae5a], claro: 0.45 },
  verde: { nombre: 'Verde botella', vidrio: 0x2f9e55, vetas: [0xd8402c, 0xf2cf4a, 0xf3eee2], claro: 0.25 },
  cristal: { nombre: 'Cristal', vidrio: 0xe6f2f0, vetas: [0x2a8fd6, 0xd8402c, 0xf2cf4a], claro: 0.6 },
  agua: { nombre: 'Agua', vidrio: 0x4fb8d8, vetas: [0xf2cf4a, 0xd8402c, 0x3fae5a], claro: 0.35 },
  menta: { nombre: 'Menta', vidrio: 0x8fd3b0, vetas: [0xd8402c, 0x2a8fd6, 0xf2cf4a], claro: 0.4 },

  // Para desbloquear subiendo de nivel o con logros (ver src/progreso.js).
  tigre: { nombre: 'Tigre', vidrio: 0xd9a441, vetas: [0x1a1410, 0x1a1410, 0xf2cf4a], claro: 0.05 },
  lechera: { nombre: 'Lechera', vidrio: 0xf4f1ea, vetas: [0x2a8fd6, 0xd8402c, 0xf2cf4a], claro: 0.8, esmerilado: 0.35 },
  galaxia: { nombre: 'Galaxia', vidrio: 0x1b1f5e, vetas: [0xffffff, 0xa46ee6, 0x4fb8d8], claro: 0 },
  oro: { nombre: 'Oro', vidrio: 0xd4a73a, vetas: [], claro: 0, metal: 0.9 },
  pantano: { nombre: 'Pantano', vidrio: 0x5a6b2e, vetas: [0x8a5a2a, 0xf2cf4a, 0x9fd66a], claro: 0.1 },
  diamante: { nombre: 'Diamante', vidrio: 0xf2fbff, vetas: [0xffffff, 0xd9f2ff, 0xffffff], claro: 0.95, ior: 2.2 },
  bolichon: { nombre: '{premioMayor}', vidrio: 0xffc93a, vetas: [0xd8402c, 0x2a8fd6, 0x3fae5a], claro: 0.25 },
  esmeralda: { nombre: 'Esmeralda', vidrio: 0x0f9b55, vetas: [0xf3eee2, 0xf2cf4a, 0xf3eee2], claro: 0.1 },
  onix: { nombre: 'Ónix', vidrio: 0x121212, vetas: [], claro: 0, opaco: true },
  arcoiris: { nombre: 'Arcoíris', vidrio: 0xeef6f5, vetas: [0xd8402c, 0xf2cf4a, 0x2a8fd6], claro: 0.7 },
  fuego: { nombre: 'Fuego', vidrio: 0xff5a1f, vetas: [0xf2cf4a, 0xffffff, 0xb3200f], claro: 0.1 },
  caminante: { nombre: 'Caminante', vidrio: 0x8f8e88, vetas: [0xf3eee2, 0x3b9be0, 0xe2523d], claro: 0.2 },
};

export const DISENOS_CIRCULO = ['clasica', 'verde', 'cristal', 'agua', 'menta'];
