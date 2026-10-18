// Palabras de cada país. Las fuentes son de calidad desigual (Wikipedia, blogs,
// sitios de preguntas) y a veces se contradicen: si alguien de ese país dice
// otra cosa, vale más su palabra. Corregir aquí y listo.
//
//   bolincha / bolinchas: cómo se dice la bolincha común
//   fem:        true si es femenina ("la bolincha"), false si es masculina ("el cinco")
//   grande:     la bolincha grande (en Costa Rica, "boliche")
//   grandeFem:  true si la grande es femenina
//   cano:       el canal de la calle donde se juega (en Costa Rica, "caño")
//   canoFem:    true si es femenino ("la cuneta")
//   chica:      título del primer nivel (la bolincha más chiquita)
//   mayor:      título del último nivel
//   premioMayor: nombre de la bolincha dorada del último nivel (si no se pone: "Dorada")
export const PAISES = [
  { id: 'cr', nombre: 'Costa Rica', bolincha: 'bolincha', bolinchas: 'bolinchas', fem: true, grande: 'boliche', grandeFem: false, cano: 'caño', canoFem: false, chica: 'Bolichita', mayor: 'Bolichón', premioMayor: 'Bolichón' },
  { id: 'mx', nombre: 'México', bolincha: 'canica', bolinchas: 'canicas', fem: true, grande: 'bombocha', grandeFem: true, cano: 'cuneta', canoFem: true, chica: 'Caniquita', mayor: 'Rey de las canicas' },
  { id: 'gt', nombre: 'Guatemala', bolincha: 'cinco', bolinchas: 'cincos', fem: false, grande: 'chimbombón', grandeFem: false, cano: 'cuneta', canoFem: true, chica: 'Cinquito', mayor: 'Rey de los cincos' },
  { id: 'sv', nombre: 'El Salvador', bolincha: 'chibola', bolinchas: 'chibolas', fem: true, grande: 'chibolón', grandeFem: false, cano: 'cuneta', canoFem: true, chica: 'Chibolita', mayor: 'Rey de las chibolas' },
  { id: 'hn', nombre: 'Honduras', bolincha: 'chibola', bolinchas: 'chibolas', fem: true, grande: 'bolonca', grandeFem: true, cano: 'cuneta', canoFem: true, chica: 'Chibolita', mayor: 'Rey de las chibolas' },
  { id: 'ni', nombre: 'Nicaragua', bolincha: 'chibola', bolinchas: 'chibolas', fem: true, grande: 'chibolón', grandeFem: false, cano: 'cuneta', canoFem: true, chica: 'Chibolita', mayor: 'Rey de las chibolas' },
  { id: 'pa', nombre: 'Panamá', bolincha: 'bolita', bolinchas: 'bolitas', fem: true, grande: 'bolón', grandeFem: false, cano: 'cuneta', canoFem: true, chica: 'Bolitita', mayor: 'Rey de las bolitas' },
  { id: 'cu', nombre: 'Cuba', bolincha: 'bola', bolinchas: 'bolas', fem: true, grande: 'bolón', grandeFem: false, cano: 'cuneta', canoFem: true, chica: 'Bolita', mayor: 'Rey de las bolas' },
  { id: 'do', nombre: 'República Dominicana', bolincha: 'bolita', bolinchas: 'bolitas', fem: true, grande: 'bolón', grandeFem: false, cano: 'cuneta', canoFem: true, chica: 'Bolitita', mayor: 'Rey de las bolitas' },
  { id: 'pr', nombre: 'Puerto Rico', bolincha: 'bolita', bolinchas: 'bolitas', fem: true, grande: 'bolón', grandeFem: false, cano: 'cuneta', canoFem: true, chica: 'Pique', mayor: 'Rey de las bolitas' },
  { id: 've', nombre: 'Venezuela', bolincha: 'metra', bolinchas: 'metras', fem: true, grande: 'bolondrona', grandeFem: true, cano: 'cuneta', canoFem: true, chica: 'Metrita', mayor: 'Rey de las metras' },
  { id: 'co', nombre: 'Colombia', bolincha: 'bolita', bolinchas: 'bolitas', fem: true, grande: 'bolón', grandeFem: false, cano: 'caño', canoFem: false, chica: 'Bolitica', mayor: 'Rey de las bolitas' },
  { id: 'ec', nombre: 'Ecuador', bolincha: 'bola', bolinchas: 'bolas', fem: true, grande: 'bolondrón', grandeFem: false, cano: 'cuneta', canoFem: true, chica: 'Bolita', mayor: 'Rey de las bolas' },
  { id: 'pe', nombre: 'Perú', bolincha: 'canica', bolinchas: 'canicas', fem: true, grande: 'bolón', grandeFem: false, cano: 'cuneta', canoFem: true, chica: 'Caniquita', mayor: 'Rey de las canicas' },
  { id: 'bo', nombre: 'Bolivia', bolincha: 'canica', bolinchas: 'canicas', fem: true, grande: 'torombolón', grandeFem: false, cano: 'cuneta', canoFem: true, chica: 'Caniquita', mayor: 'Rey de las canicas' },
  { id: 'cl', nombre: 'Chile', bolincha: 'bolita', bolinchas: 'bolitas', fem: true, grande: 'polcón', grandeFem: false, cano: 'cuneta', canoFem: true, chica: 'Tirito', mayor: 'Rey de las bolitas' },
  { id: 'ar', nombre: 'Argentina', bolincha: 'bolita', bolinchas: 'bolitas', fem: true, grande: 'bolón', grandeFem: false, cano: 'cuneta', canoFem: true, chica: 'Bolitita', mayor: 'Rey de las bolitas' },
  { id: 'uy', nombre: 'Uruguay', bolincha: 'bolita', bolinchas: 'bolitas', fem: true, grande: 'bochón', grandeFem: false, cano: 'cuneta', canoFem: true, chica: 'Bolitita', mayor: 'Rey de las bolitas' },
  { id: 'py', nombre: 'Paraguay', bolincha: 'bolita', bolinchas: 'bolitas', fem: true, grande: 'bolón', grandeFem: false, cano: 'cuneta', canoFem: true, chica: 'Bolitita', mayor: 'Rey de las bolitas' },
  { id: 'es', nombre: 'España', bolincha: 'canica', bolinchas: 'canicas', fem: true, grande: 'bolón', grandeFem: false, cano: 'cuneta', canoFem: true, chica: 'Caniquita', mayor: 'Rey de las canicas' },
  { id: 'otro', nombre: 'Otro país', bolincha: 'canica', bolinchas: 'canicas', fem: true, grande: 'bolón', grandeFem: false, cano: 'cuneta', canoFem: true, chica: 'Caniquita', mayor: 'Rey de las canicas' },
];

export const PAIS_INICIAL = 'cr';
