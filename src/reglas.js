import { MAPAS, MAPAS_CIRCULO } from './mapas.js';

// Las reglas de cada modo (con huecos para las palabras del país, ver src/textos.js).
// Se muestran la primera vez que se juega cada modo y en la pantalla "Reglas".
export const NOMBRES_MODOS = { circulo: 'Círculo', cano: '{Caño}', explosivas: 'Bolinchas explosivas' };

// Modos que comparten las novedades de otro (mismo círculo, misma dificultad y mismos mapas).
export const NOVEDADES_DE = { explosivas: 'circulo' };

export const REGLAS = {
  circulo: [
    'Cada {bolincha} del círculo tiene un número, como en el pool.',
    'El primer tiro de la partida puede pegarle a cualquiera. Después, hay que pegarle primero a la de número más bajo: la del número amarillo.',
    'Si le pegas primero a otra, o a {ninguna}, es falta: {las} que hayan salido vuelven al círculo y pasa el turno.',
    'Si el tiro vale, todas {las} que saques son {tuyas}, aunque no sean la del número.',
    'Si sacas al menos {una}, sigues tirando desde donde quedó tu {bolincha}.',
    'Gana quien tenga más cuando el círculo quede vacío.',
  ],
  explosivas: [
    'Es un Círculo con números, como en el pool, pero entre {las} {bolinchas} hay 3 explosivas: negras, con vetas rojas y amarillas.',
    'Si una explosiva recibe un golpe, explota y empuja hacia afuera a todas {las} que estén cerca, también a la tuya. Si empuja a otra explosiva, esa también explota.',
    'Si en tu tiro explota alguna, pierdes el turno, aunque hayas sacado: {las} que sacaste sí son {tuyas}.',
    'Pegarle primero a una explosiva es falta, igual que pegarle a otra que no era la del número.',
    'Lo demás es igual que en el Círculo.',
  ],
  cano: [
    'Por turnos, cada uno tira su {bolincha} por {el_c} {caño}. Gana el primero que pase la meta.',
    'Puedes pegarle {a_la} {bolincha} de otro para atrasar{lo} o tirar{lo} a un hueco.',
    'Si {un} {bolincha} salta la pared, vuelve a donde estaba antes del tiro.',
    'Si cae en un hueco, vuelve a la salida.',
  ],
};

// Las reglas en dibujos: 3 pasos cortos por modo, para la tarjeta "Cómo se juega".
// (La lista larga de arriba queda para la pantalla "Reglas" del menú.)
const DIBUJO = {
  sacar: '<svg viewBox="0 0 64 64"><circle cx="32" cy="32" r="26" fill="none" stroke="#f3eee2" stroke-width="3" stroke-dasharray="6 4"/><circle cx="26" cy="30" r="5" fill="#e2523d"/><circle cx="38" cy="36" r="5" fill="#2f8fd1"/><path d="M40 20 l13 -9" stroke="#f2cf4a" stroke-width="4" stroke-linecap="round"/><circle cx="57" cy="8" r="5" fill="#f2cf4a"/></svg>',
  numero: '<svg viewBox="0 0 64 64"><circle cx="32" cy="32" r="22" fill="#f2cf4a"/><text x="32" y="41" text-anchor="middle" font-size="26" font-weight="700" fill="#0c2422" font-family="sans-serif">1</text></svg>',
  repite: '<svg viewBox="0 0 64 64"><path d="M14 44 a20 20 0 1 1 36 0" fill="none" stroke="#22c08a" stroke-width="5" stroke-linecap="round"/><path d="M42 38 l8 7 l6 -10" fill="none" stroke="#22c08a" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  bomba: '<svg viewBox="0 0 64 64"><circle cx="30" cy="36" r="18" fill="#1b1b1f"/><path d="M20 30 q8 -6 16 4 M24 44 q8 -2 14 -10" stroke="#e8452c" stroke-width="3" fill="none"/><path d="M42 20 l6 -8" stroke="#a8743f" stroke-width="3"/><path d="M50 6 l2 6 l6 1 l-5 4 l1 6 l-4 -4 l-5 3 l1 -6 l-4 -4 l6 -1z" fill="#f2cf4a"/></svg>',
  meta: '<svg viewBox="0 0 64 64"><path d="M8 50 C 20 50 22 24 34 24 S 50 40 56 18" fill="none" stroke="#b8b4a8" stroke-width="9" stroke-linecap="round"/><circle cx="12" cy="50" r="5" fill="#3b9be0"/><path d="M52 18 V4" stroke="#f3eee2" stroke-width="3"/><rect x="52" y="4" width="10" height="7" fill="#f3eee2"/><rect x="52" y="4" width="5" height="3.5" fill="#0c2422"/><rect x="57" y="7.5" width="5" height="3.5" fill="#0c2422"/></svg>',
  hueco: '<svg viewBox="0 0 64 64"><ellipse cx="32" cy="42" rx="18" ry="8" fill="#0c0806"/><circle cx="32" cy="24" r="7" fill="#6fd3c8"/><path d="M32 33 v4" stroke="#f2cf4a" stroke-width="3" stroke-linecap="round"/><path d="M10 14 a10 10 0 1 1 6 9" fill="none" stroke="#f3eee2" stroke-width="3" stroke-linecap="round"/><path d="M8 20 l8 3 l1 -8" fill="none" stroke="#f3eee2" stroke-width="3" stroke-linecap="round"/></svg>',
  choque: '<svg viewBox="0 0 64 64"><circle cx="22" cy="34" r="10" fill="#3b9be0"/><circle cx="42" cy="34" r="10" fill="#e2523d"/><path d="M32 14 v8 M24 16 l4 6 M40 16 l-4 6" stroke="#f2cf4a" stroke-width="3" stroke-linecap="round"/></svg>',
};
export const PASOS = {
  circulo: [
    { dibujo: DIBUJO.sacar, titulo: 'Sácalas del círculo', detalle: '{Las} que saques son {tuyas}' },
    { dibujo: DIBUJO.numero, titulo: 'Pégale primero a la amarilla', detalle: 'Si no, es falta' },
    { dibujo: DIBUJO.repite, titulo: '¿Sacaste {una}? Repites', detalle: 'Gana quien saque más' },
  ],
  explosivas: [
    { dibujo: DIBUJO.sacar, titulo: 'Sácalas del círculo', detalle: 'Pégale primero a la amarilla' },
    { dibujo: DIBUJO.bomba, titulo: 'Cuidado con las negras', detalle: 'Si les pegas, explotan y empujan todo' },
    { dibujo: DIBUJO.repite, titulo: 'Si explota {una}, pierdes el turno', detalle: '{Las} que sacaste son {tuyas}' },
  ],
  cano: [
    { dibujo: DIBUJO.meta, titulo: 'Llega primero a la meta', detalle: 'Por turnos, un tiro cada uno' },
    { dibujo: DIBUJO.hueco, titulo: 'Si caes en un hueco, a la salida', detalle: 'Si saltas la pared, vuelves atrás' },
    { dibujo: DIBUJO.choque, titulo: 'Puedes pegarle a otro', detalle: 'Para atrasar{lo} o mandar{lo} a un hueco' },
  ],
};

// NOVEDADES: lo que se vuelve más difícil al subir de nivel. Cada una se explica
// una sola vez, antes de la primera partida en que aparece.
//   id: único y que no cambie nunca (se guarda como "ya vista")
//   modo: 'circulo' | 'cano'
//   nivel: desde qué nivel aparece (1 = el primero)
//   titulo, texto: lo que se le explica a quien juega
//   soloAviso: true si no es una regla (no se suma a la lista de reglas), solo un aviso
//   cambioDeReglas: true si avisa un cambio de reglas: solo se muestra a quien ya había jugado
export const NOVEDADES = [
  {
    id: 'circulo-orden',
    modo: 'circulo',
    nivel: 1,
    titulo: 'Regla nueva: el orden',
    texto: 'Ahora las {bolinchas} tienen número, como en el pool. El primer tiro puede pegarle a cualquiera; después hay que pegarle primero a la del número amarillo (el más bajo). Si no, es falta: {las} que salgan vuelven al círculo y pasa el turno.',
    soloAviso: true,
    cambioDeReglas: true,
  },
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
