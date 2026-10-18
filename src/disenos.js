// Diseños de bolinchas "ojo de gato": color del vidrio y colores de los tres pétalos de la veta.
// "claro" (0 a 1): cuánto se aclara el vidrio. Más alto = vidrio más transparente.
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
};

export const DISENOS_CIRCULO = ['clasica', 'verde', 'cristal', 'agua', 'menta'];
