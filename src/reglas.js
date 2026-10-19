import { MAPAS, MAPAS_CIRCULO } from './mapas.js';

// Las reglas de cada modo (con huecos para las palabras del país, ver src/textos.js).
// Se muestran la primera vez que se juega cada modo y en la pantalla "Reglas".
export const NOMBRES_MODOS = { circulo: 'Círculo', cano: '{Caño}' };

export const REGLAS = {
  circulo: [
    'Tira desde afuera y saca {bolinchas} del círculo: {las} que saques son {tuyas}.',
    'Si sacas al menos {una}, sigues tirando desde donde quedó tu {bolincha}, aunque haya quedado dentro del círculo.',
    'Si no sacas {ninguna}, pasa el turno.',
    'Tu {bolincha} se queda donde paró: en tu próximo turno tiras desde ahí.',
    'Gana quien tenga más cuando el círculo quede vacío.',
  ],
  cano: [
    'Por turnos, cada uno tira su {bolincha} por {el_c} {caño}. Gana el primero que pase la meta.',
    'Puedes pegarle {a_la} {bolincha} de otro para atrasar{lo} o tirar{lo} a un hueco.',
    'Si {un} {bolincha} salta la pared, vuelve a donde estaba antes del tiro.',
    'Si cae en un hueco, vuelve a la salida.',
  ],
};

// NOVEDADES: lo que se vuelve más difícil al subir de nivel. Cada una se explica
// una sola vez, antes de la primera partida en que aparece.
//   id: único y que no cambie nunca (se guarda como "ya vista")
//   modo: 'circulo' | 'cano'
//   nivel: desde qué nivel aparece (1 = el primero)
//   titulo, texto: lo que se le explica a quien juega
//   soloAviso: true si no es una regla (no se suma a la lista de reglas), solo un aviso
export const NOVEDADES = [
  // Círculo: van con CONFIG.dificultadCirculo (src/config.js).
  {
    id: 'circulo-grande',
    modo: 'circulo',
    nivel: 3,
    titulo: 'Círculo más grande',
    texto: 'Desde el nivel 3, el círculo es más grande y tiene 12 {bolinchas}: hay que pegar más fuerte para sacarlas.',
  },
  {
    id: 'circulo-piedras',
    modo: 'circulo',
    nivel: 4,
    titulo: 'Piedras en el círculo',
    texto: 'Desde el nivel 4, hay piedras dentro del círculo. No se mueven: si una {bolincha} choca con una, rebota.',
  },
  {
    id: 'circulo-salida-lejos',
    modo: 'circulo',
    nivel: 5,
    titulo: 'Salida más lejos',
    texto: 'Desde el nivel 5, el primer tiro de cada uno sale desde más lejos del círculo.',
  },
  {
    id: 'circulo-rivales',
    modo: 'circulo',
    nivel: 6,
    titulo: 'Rivales más finos',
    texto: 'Desde el nivel 6, la computadora apunta mejor en Fácil, Medio y Difícil.',
  },
  {
    id: 'circulo-gigante',
    modo: 'circulo',
    nivel: 7,
    titulo: 'El círculo grande',
    texto: 'Desde el nivel 7, el círculo es todavía más grande y tiene 14 {bolinchas}.',
  },
];

// Cada mapa que se desbloquea con el nivel se avisa una vez.
for (const [modo, lista] of [['circulo', MAPAS_CIRCULO], ['cano', MAPAS]]) {
  for (const m of lista) {
    if ((m.nivel || 1) <= 1) continue;
    NOVEDADES.push({
      id: `mapa-${m.id}`,
      modo,
      nivel: m.nivel,
      titulo: `Nuevo mapa: ${m.nombre}`,
      texto: `${m.descripcion} Lo eliges en «¿Quién juega?».`,
      soloAviso: true,
    });
  }
}
