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
export const NOVEDADES = [];
