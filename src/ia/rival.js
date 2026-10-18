// La computadora como rival: elige a qué bolincha tirarle, calcula el tiro
// y le agrega un error según el nivel, para que falle como una persona.
import * as THREE from 'three';
import { CONFIG } from '../config.js';

// ---------------------------------------------------------------
// Modelo simple del frenado (el mismo que aplica bolincha.js):
// cada segundo pierde "a" cm/s fijos (tierra) más "d" veces su velocidad.
// ---------------------------------------------------------------
function frenos(superficie) {
  const s = CONFIG.superficies[superficie];
  return { a: s.resistenciaRodadura * CONFIG.gravedad, d: s.frenado };
}

// Distancia que recorre una bolincha que sale a velocidad v hasta detenerse.
function distanciaHastaParar(v, { a, d }) {
  if (d < 1e-6) return (v * v) / (2 * a);
  return v / d - (a / (d * d)) * Math.log(1 + (d * v) / a);
}

// Velocidad que le queda después de recorrer "distancia" saliendo a v0 (0 si no llega).
function velocidadTras(v0, distancia, f) {
  let v = v0;
  let x = 0;
  const dt = 1 / 240;
  while (x < distancia) {
    if (v <= 0) return 0;
    x += v * dt;
    v -= (f.a + f.d * v) * dt;
  }
  return Math.max(v, 0);
}

// Busca por tanteo el valor de entrada que da el resultado buscado (la función debe crecer).
function buscar(fn, objetivo, max) {
  let lo = 0;
  let hi = max;
  if (fn(hi) < objetivo) return null;
  for (let i = 0; i < 40; i++) {
    const m = (lo + hi) / 2;
    if (fn(m) < objetivo) lo = m;
    else hi = m;
  }
  return hi;
}

// Distancia desde el punto p, avanzando en dirección d, hasta salir del círculo.
function distanciaASalir(p, d, radio) {
  const pd = p.x * d.x + p.z * d.z;
  const c = p.x * p.x + p.z * p.z - radio * radio;
  return -pd + Math.sqrt(Math.max(pd * pd - c, 0));
}

// Distancia mínima entre el punto q y el segmento a→b (en el suelo).
function distanciaASegmento(q, a, b) {
  const abx = b.x - a.x;
  const abz = b.z - a.z;
  const largo2 = abx * abx + abz * abz || 1;
  const t = THREE.MathUtils.clamp(((q.x - a.x) * abx + (q.z - a.z) * abz) / largo2, 0, 1);
  return Math.hypot(a.x + abx * t - q.x, a.z + abz * t - q.z);
}

// Número al azar con forma de campana (la mayoría cerca de 0, algunos lejos).
function azarCampana() {
  let u = 0;
  while (u === 0) u = Math.random();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * Math.random());
}

// ---------------------------------------------------------------
// planificarTiro: devuelve { direccion, fuerza, objetivo } ya con el error del nivel.
//   tirador:    posición de la bolincha de la computadora
//   blancos:    posiciones de las bolinchas que quedan en el círculo
//   obstaculos: otras bolinchas en el suelo (por ejemplo, la del rival)
// ---------------------------------------------------------------
export function planificarTiro({ tirador, radioBolincha, blancos, obstaculos = [], nivel, radioCirculo, superficie = 'tierra' }) {
  const f = frenos(superficie);
  const n = CONFIG.rival[nivel];
  const vMax = CONFIG.tiro.velocidadMaxima;
  const e = CONFIG.bolinchas.rebote;
  const contacto = radioBolincha * 2;
  const opciones = [];

  for (const blanco of blancos) {
    const recto = new THREE.Vector3().subVectors(blanco, tirador).setY(0).normalize();
    const haciaAfuera = new THREE.Vector3(blanco.x, 0, blanco.z).normalize();
    if (haciaAfuera.lengthSq() === 0) haciaAfuera.copy(recto);

    // Varias direcciones de salida para el blanco: derecho hacia afuera, siguiendo el tiro, y mezclas.
    for (const mezcla of [0, 0.33, 0.66, 1]) {
      const salidaBlanco = haciaAfuera.clone().lerp(recto, mezcla).normalize();
      // "Bolincha fantasma": dónde tiene que estar la del tirador al pegar.
      const fantasma = blanco.clone().addScaledVector(salidaBlanco, -contacto);
      const camino = new THREE.Vector3().subVectors(fantasma, tirador).setY(0);
      const largo = camino.length();
      if (largo < contacto) continue;
      const dir = camino.clone().divideScalar(largo);
      const corte = dir.angleTo(salidaBlanco); // 0 = de frente
      if (corte > THREE.MathUtils.degToRad(65)) continue;

      // ¿Algo se interpone en el camino del tirador?
      const estorbo = [...blancos, ...obstaculos].some(
        (o) => o !== blanco && distanciaASegmento(o, tirador, fantasma) < contacto * 0.98
      );
      if (estorbo) continue;

      // Fuerza necesaria: que el blanco cruce la línea con margen.
      const recorrido = distanciaASalir(blanco, salidaBlanco, radioCirculo) + 4;
      const vBlanco = buscar((v) => distanciaHastaParar(v, f), recorrido, vMax * 3);
      if (vBlanco === null) continue;
      const vChoque = vBlanco / (Math.cos(corte) * ((1 + e) / 2));
      const v0 = buscar((v) => velocidadTras(v, largo, f), vChoque, vMax * 1.5);
      if (v0 === null) continue;
      const fuerza = (v0 * n.margenFuerza) / vMax;
      if (fuerza > 1) continue;

      // Puntaje: menos es mejor. Corte chico, poca distancia, fuerza moderada.
      const costo = corte / THREE.MathUtils.degToRad(65) + largo / 150 + fuerza * 0.4;
      opciones.push({ direccion: dir, fuerza, objetivo: blanco, costo });
    }
  }

  let elegido;
  if (opciones.length === 0) {
    // Sin tiro limpio: tirarle fuerte a la más cercana y ver qué pasa.
    const cercano = blancos.reduce((m, b) => (b.distanceTo(tirador) < m.distanceTo(tirador) ? b : m), blancos[0]);
    elegido = {
      direccion: new THREE.Vector3().subVectors(cercano, tirador).setY(0).normalize(),
      fuerza: 0.8,
      objetivo: cercano,
    };
  } else {
    opciones.sort((x, y) => x.costo - y.costo);
    // A veces se despista y elige un tiro peor.
    elegido = Math.random() < n.despiste ? opciones[Math.floor(Math.random() * opciones.length)] : opciones[0];
  }

  // El pulso humano: error de puntería y de fuerza.
  const direccion = elegido.direccion
    .clone()
    .applyAxisAngle(new THREE.Vector3(0, 1, 0), THREE.MathUtils.degToRad(azarCampana() * n.errorAngulo));
  const fuerza = THREE.MathUtils.clamp(elegido.fuerza * (1 + azarCampana() * n.errorFuerza), 0.08, 1);
  return { direccion, fuerza, objetivo: elegido.objetivo };
}
