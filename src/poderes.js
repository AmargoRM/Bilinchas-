// Poderes de las bolinchas raras de la colección (ver "poder" en src/disenos.js).
// Solo los tiene quien juega en el Lugar 1 con su bolincha de la colección.
//   activo: se usa una vez por partida, tocando el botón del poder antes de tirar.
//   pasivo: funciona siempre, sin tocar nada.
// Los números se aplican en src/main.js (al tirar).
export const PODERES = {
  fuerza: {
    nombre: 'Fuerza',
    tipo: 'activo',
    texto: 'Una vez por partida: un tiro con la mitad más de fuerza.',
    fuerza: 1.5,
  },
  salto: {
    nombre: 'Salto',
    tipo: 'activo',
    texto: 'Una vez por partida: tu {bolincha} sale saltando y pasa por encima de lo que tenga adelante.',
    salto: 120, // cm/s hacia arriba
  },
  peso: {
    nombre: 'Peso',
    tipo: 'activo',
    texto: 'Una vez por partida: pesa el triple en ese tiro y empuja como {un} {boliche}.',
    peso: 3,
  },
  efecto: {
    nombre: 'Efecto doble',
    tipo: 'activo',
    texto: 'Una vez por partida: el efecto de tu tiro es el doble de fuerte.',
    efecto: 2,
  },
  punteria: {
    nombre: 'Ojo fino',
    tipo: 'pasivo',
    texto: 'Siempre: tu línea de puntería es tres veces más larga.',
    punteria: 3,
  },
  rey: {
    nombre: 'Rey',
    tipo: 'activo',
    texto: 'Una vez por partida: un tiro con más fuerza y el triple de peso. Y siempre, la línea de puntería larga.',
    fuerza: 1.3,
    peso: 3,
    punteria: 3,
  },
};

export const RAREZAS = { comun: 'Común', rara: 'Rara', legendaria: 'Legendaria' };

// La rareza de un diseño: legendaria si lo dice, rara si tiene poder, común si no.
export function rarezaDe(diseno) {
  if (diseno.rareza) return diseno.rareza;
  return diseno.poder ? 'rara' : 'comun';
}
