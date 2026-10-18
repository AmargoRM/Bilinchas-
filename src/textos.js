// Textos según el país elegido. Los textos del juego llevan huecos entre llaves
// que se completan con las palabras del país (ver src/paises.js):
//   {bolincha} {bolinchas} {Bolincha} {Bolinchas}   la bolincha común
//   {la} {La} {a_la} {las} {Las} {una} {un} {lo} {nueva} {Nueva} {ninguna} {tuyas}
//                                                    artículos y palabras que cambian si es "el cinco"
//   {boliche} {Boliche} {el_g} {El_g}                la bolincha grande
//   {caño} {Caño} {el_c} {El_c} {del_c} {un_c}       el canal de la calle
//   {chica} {mayor}                                  títulos del primer y último nivel
//   {premioMayor}                                    nombre de la bolincha dorada del último nivel
import { PAISES, PAIS_INICIAL } from './paises.js';

const CLAVE = 'ojo-de-gato.pais';
let pais = PAISES.find((p) => p.id === PAIS_INICIAL);
let elegido = false;
try {
  const guardado = PAISES.find((p) => p.id === localStorage.getItem(CLAVE));
  if (guardado) {
    pais = guardado;
    elegido = true;
  }
} catch {
  // sin almacenamiento: Costa Rica, y se vuelve a preguntar
}

const mayus = (s) => s.charAt(0).toUpperCase() + s.slice(1);

export function paisActual() {
  return pais;
}

// ¿Ya eligió país alguna vez? (si no, se le pregunta al empezar)
export function paisElegido() {
  return elegido;
}

export function usarPais(id) {
  const p = PAISES.find((x) => x.id === id);
  if (!p) return;
  pais = p;
  elegido = true;
  try {
    localStorage.setItem(CLAVE, id);
  } catch {
    // no se pudo recordar: vale hasta cerrar la página
  }
}

// Completa los huecos de un texto con las palabras del país.
export function tx(texto) {
  const p = pais;
  const f = p.fem;
  const palabras = {
    bolincha: p.bolincha,
    bolinchas: p.bolinchas,
    Bolincha: mayus(p.bolincha),
    Bolinchas: mayus(p.bolinchas),
    la: f ? 'la' : 'el',
    a_la: f ? 'a la' : 'al',
    La: f ? 'La' : 'El',
    las: f ? 'las' : 'los',
    Las: f ? 'Las' : 'Los',
    una: f ? 'una' : 'uno', // sola: "al menos una / uno"
    un: f ? 'una' : 'un', // delante de la palabra: "una bolincha / un cinco"
    lo: f ? 'la' : 'lo',
    nueva: f ? 'nueva' : 'nuevo',
    Nueva: f ? 'Nueva' : 'Nuevo',
    ninguna: f ? 'ninguna' : 'ninguno',
    tuyas: f ? 'tuyas' : 'tuyos',
    boliche: p.grande,
    Boliche: mayus(p.grande),
    el_g: p.grandeFem ? 'la' : 'el',
    El_g: p.grandeFem ? 'La' : 'El',
    caño: p.cano,
    Caño: mayus(p.cano),
    el_c: p.canoFem ? 'la' : 'el',
    El_c: p.canoFem ? 'La' : 'El',
    del_c: p.canoFem ? 'de la' : 'del',
    un_c: p.canoFem ? 'una' : 'un',
    chica: p.chica,
    mayor: p.mayor,
    premioMayor: p.premioMayor || 'Dorada',
  };
  // (Se buscan las llaves con cualquier letra adentro: \w no reconoce la ñ de {caño}.)
  return texto.replace(/\{([^{}\s]+)\}/g, (todo, clave) => palabras[clave] ?? todo);
}

// Completa los textos fijos de la página: los elementos con data-tx="texto con {huecos}".
export function aplicarTextos(raiz = document) {
  for (const el of raiz.querySelectorAll('[data-tx]')) el.textContent = tx(el.dataset.tx);
}
