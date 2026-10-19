// Formas de acomodar las bolinchas dentro del círculo. En cada partida se elige
// una al azar, girada y corrida, para que nunca empiece igual.
// Cada formación devuelve n posiciones { x, z } (cm), con el círculo en (0, 0).
// separacion: distancia entre centros de bolinchas vecinas (cm).

const SEPARACION = 3.8; // bolinchas casi tocándose

export const FORMACIONES = {
  // Sueltas por todo el centro del círculo.
  sueltas(n, zona, estorbos = []) {
    const lista = [];
    for (let intento = 0; lista.length < n && intento < 3000; intento++) {
      const a = Math.random() * Math.PI * 2;
      const r = Math.sqrt(Math.random()) * zona;
      const p = { x: Math.cos(a) * r, z: Math.sin(a) * r };
      const lejos = estorbos.every((e) => Math.hypot(p.x - e.x, p.z - e.z) >= e.radio + 2.5);
      if (lejos && lista.every((q) => Math.hypot(q.x - p.x, q.z - p.z) >= 4)) lista.push(p);
    }
    return lista;
  },

  // Montón apretado (como tiradas de la mano), en panal.
  monton(n) {
    const lista = [];
    for (let anillo = 0; lista.length < n; anillo++) {
      if (anillo === 0) {
        lista.push({ x: 0, z: 0 });
        continue;
      }
      for (let lado = 0; lado < 6; lado++) {
        for (let k = 0; k < anillo; k++) {
          const a1 = (lado * Math.PI) / 3;
          const a2 = ((lado + 2) * Math.PI) / 3;
          lista.push({
            x: (Math.cos(a1) * anillo + Math.cos(a2) * k) * SEPARACION,
            z: (Math.sin(a1) * anillo + Math.sin(a2) * k) * SEPARACION,
          });
        }
      }
    }
    return lista.slice(0, n);
  },

  // Una cruz: dos filas que se cruzan en el medio.
  cruz(n) {
    const lista = [{ x: 0, z: 0 }];
    const paso = SEPARACION * 1.5;
    for (let k = 1; lista.length < n; k++) {
      for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) if (lista.length < n) lista.push({ x: dx * k * paso, z: dz * k * paso });
    }
    return lista;
  },

  // Una fila que atraviesa el círculo.
  fila(n) {
    const paso = SEPARACION * 1.15;
    return Array.from({ length: n }, (_, i) => ({ x: (i - (n - 1) / 2) * paso, z: 0 }));
  },

  // Un anillo de bolinchas, con una en el medio.
  anillo(n, zona) {
    const r = Math.min(zona * 0.75, Math.max(((n - 1) * SEPARACION * 1.3) / (Math.PI * 2), 8));
    const lista = [{ x: 0, z: 0 }];
    for (let i = 0; i < n - 1; i++) {
      const a = (i / (n - 1)) * Math.PI * 2;
      lista.push({ x: Math.cos(a) * r, z: Math.sin(a) * r });
    }
    return lista;
  },

  // Triángulo, como las bolas del billar.
  triangulo(n) {
    const lista = [];
    for (let fila = 0; lista.length < n; fila++) {
      for (let k = 0; k <= fila && lista.length < n; k++) {
        lista.push({ x: (k - fila / 2) * SEPARACION, z: fila * SEPARACION * 0.87 });
      }
    }
    const filas = Math.ceil((Math.sqrt(8 * n + 1) - 1) / 2);
    return lista.map((p) => ({ x: p.x, z: p.z - ((filas - 1) * SEPARACION * 0.87) / 2 }));
  },

  // Dos montoncitos separados.
  dosMontones(n) {
    const a = FORMACIONES.monton(Math.ceil(n / 2)).map((p) => ({ x: p.x - 10, z: p.z }));
    const b = FORMACIONES.monton(Math.floor(n / 2)).map((p) => ({ x: p.x + 10, z: p.z }));
    return [...a, ...b];
  },
};

export const NOMBRES_FORMACIONES = {
  sueltas: 'por todo el centro',
  monton: 'en montón',
  cruz: 'en cruz',
  fila: 'en fila',
  anillo: 'en anillo',
  triangulo: 'en triángulo',
  dosMontones: 'en dos montones',
};

// Elige una formación al azar, la gira y la corre un poco; descarta posiciones
// que choquen con "estorbos" ([{ x, z, radio }]) o que se salgan de la zona.
// Devuelve { nombre, posiciones } (puede traer menos de n si no entran todas).
export function armarFormacion(n, zona, estorbos = []) {
  const nombres = Object.keys(FORMACIONES);
  for (let intento = 0; intento < 20; intento++) {
    const nombre = nombres[Math.floor(Math.random() * nombres.length)];
    const giro = Math.random() * Math.PI * 2;
    const c = Math.cos(giro);
    const s = Math.sin(giro);
    // Corrida al azar, pero sin salir de la zona.
    const base = FORMACIONES[nombre](n, zona, estorbos).map((p) => ({ x: p.x * c - p.z * s, z: p.x * s + p.z * c }));
    const alcance = Math.max(...base.map((p) => Math.hypot(p.x, p.z)));
    const margen = Math.max(zona - alcance, 0);
    const a = Math.random() * Math.PI * 2;
    const r = Math.sqrt(Math.random()) * margen;
    const posiciones = base.map((p) => ({ x: p.x + Math.cos(a) * r, z: p.z + Math.sin(a) * r }));
    const valen = posiciones.every(
      (p) => Math.hypot(p.x, p.z) <= zona + 2 && estorbos.every((e) => Math.hypot(p.x - e.x, p.z - e.z) >= e.radio + 2.5)
    );
    if (valen && posiciones.length === n) return { nombre, posiciones };
  }
  return { nombre: 'sueltas', posiciones: FORMACIONES.sueltas(n, zona, estorbos) };
}
