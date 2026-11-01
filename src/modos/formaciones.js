// Cómo se acomodan las bolinchas dentro del círculo: sueltas y desparramadas por todo
// el círculo, al azar, sin filas ni montones (como cuando se tiran de la mano y ruedan).
// Cada posición es { x, z } en cm, con el círculo en (0, 0).

// Reparte n bolinchas en un disco de radio "zona", lo más separadas posible entre sí,
// sin tocar los "estorbos" ([{ x, z, radio }], las piedras).
// Para cada bolincha se prueban varios lugares al azar y se queda el que tiene más
// espacio libre alrededor: así quedan abiertas por el campo pero sin parecer ordenadas.
export function repartirDispersas(n, zona, estorbos = [], separacionMinima = 4) {
  const lista = [];
  const holgura = (p) => {
    let d = Infinity;
    for (const q of lista) d = Math.min(d, Math.hypot(q.x - p.x, q.z - p.z));
    for (const e of estorbos) d = Math.min(d, Math.hypot(e.x - p.x, e.z - p.z) - e.radio - 1.5);
    return d;
  };
  for (let i = 0; i < n; i++) {
    let mejor = null;
    let mejorHolgura = -Infinity;
    // Pocas pruebas = más desorden; muchas = más parejo. 8 queda natural.
    for (let k = 0; k < 8 || (mejorHolgura < separacionMinima && k < 400); k++) {
      const a = Math.random() * Math.PI * 2;
      const r = Math.sqrt(Math.random()) * zona;
      const p = { x: Math.cos(a) * r, z: Math.sin(a) * r };
      const h = holgura(p);
      if (h > mejorHolgura) {
        mejor = p;
        mejorHolgura = h;
      }
    }
    lista.push(mejor);
  }
  return lista;
}

// ¿Se puede tirar en línea recta desde "desde" hasta "hasta" sin tocar ningún otro
// obstáculo ([{ x, z, radio }])? radioTiro: radio de la bolincha que se tira.
export function caminoLibre(desde, hasta, obstaculos, radioTiro, margen = 1.2) {
  const dx = hasta.x - desde.x;
  const dz = hasta.z - desde.z;
  const largo = Math.hypot(dx, dz) || 1;
  const ux = dx / largo;
  const uz = dz / largo;
  return obstaculos.every((o) => {
    const cx = o.x - desde.x;
    const cz = o.z - desde.z;
    const avance = cx * ux + cz * uz;
    if (avance <= 0 || avance >= largo) return Math.hypot(cx, cz) > o.radio + radioTiro + margen && Math.hypot(o.x - hasta.x, o.z - hasta.z) > 0.01;
    const lado = Math.abs(cx * uz - cz * ux);
    return lado > o.radio + radioTiro + margen;
  });
}
