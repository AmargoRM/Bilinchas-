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
// pesoTirador: gramos de la bolincha que tira (un boliche empuja más fuerte).
// afinado: multiplica los errores del nivel (menos de 1 = apunta mejor; ver CONFIG.dificultadCirculo).
// Las del círculo son siempre bolinchas normales.
export function planificarTiro({ tirador, radioBolincha, pesoTirador = CONFIG.bolinchas.normal.peso, blancos, obstaculos = [], nivel, radioCirculo, superficie = 'tierra', afinado = 1 }) {
  const f = frenos(superficie);
  const base = CONFIG.rival[nivel];
  const n = { ...base, errorAngulo: base.errorAngulo * afinado, errorFuerza: base.errorFuerza * afinado, despiste: base.despiste * afinado };
  const vMax = CONFIG.tiro.velocidadMaxima;
  const e = CONFIG.bolinchas.rebote;
  const normal = CONFIG.bolinchas.normal;
  const contacto = radioBolincha + normal.diametro / 2;
  // Qué parte de la velocidad pasa al blanco en un choque de frente (depende de los pesos).
  const traspaso = ((1 + e) * pesoTirador) / (pesoTirador + normal.peso);
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
      const vChoque = vBlanco / (Math.cos(corte) * traspaso);
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

// ---------------------------------------------------------------
// Modo Caño: planificarTiroCanal devuelve { direccion, fuerza, objetivo, intencion }.
//   traza:   el recorrido del mapa (src/escenario/canal.js)
//   tirador: posición propia
//   otros:   [{ pos, recorrido }] de las demás bolinchas en el caño
// Decide en este orden:
//   1. Si ve la meta en línea recta y le alcanza, tira para pasarla.
//   2. Si un rival va adelante y tiene un hueco cerca, intenta meterlo en el hueco.
//   3. Si no, avanza hasta el punto más lejano que ve sin chocar paredes ni piedras.
// ---------------------------------------------------------------
//   otros[i] puede traer { radio, peso } (si es un boliche); si no, se supone bolincha normal.
export function planificarTiroCanal({ traza, tirador, radioBolincha, pesoTirador = CONFIG.bolinchas.normal.peso, otros, nivel }) {
  const f = frenos('concreto');
  const n = CONFIG.rival[nivel];
  const vMax = CONFIG.tiro.velocidadMaxima;
  const e = CONFIG.bolinchas.rebote;
  const alcance = distanciaHastaParar(vMax, f) * 0.92;
  const miRecorrido = traza.proyectar(tirador.x, tirador.z).s;
  const piedras = traza.obstaculos.filter((o) => o.tipo === 'piedra');
  const huecos = traza.obstaculos.filter((o) => o.tipo === 'hueco');

  // ¿Se puede ir en línea recta de "a" a "b" sin tocar paredes, piedras ni bolinchas?
  function caminoLibre(a, b, ignorar = null) {
    const largo = Math.hypot(b.x - a.x, b.z - a.z);
    const pasos = Math.ceil(largo / 2);
    for (let k = 1; k <= pasos; k++) {
      const t = k / pasos;
      const x = a.x + (b.x - a.x) * t;
      const z = a.z + (b.z - a.z) * t;
      if (!traza.dentro(x, z, -(radioBolincha + 0.6))) return false;
    }
    for (const p of piedras) if (distanciaASegmento(p, a, b) < p.radio + radioBolincha + 0.5) return false;
    for (const o of otros) {
      const choque = radioBolincha + (o.radio ?? CONFIG.bolinchas.normal.diametro / 2);
      if (o.pos !== ignorar && distanciaASegmento(o.pos, a, b) < choque * 0.98) return false;
    }
    return true;
  }
  const cercaDeHueco = (p) => huecos.some((h) => Math.hypot(p.x - h.x, p.z - h.z) < h.radio + 4);
  const fuerzaPara = (distancia) => {
    const v0 = buscar((v) => distanciaHastaParar(v, f), Math.max(distancia, 5), vMax * 1.5);
    return v0 === null ? 1 : v0 / vMax;
  };

  let elegido = null;

  // 1. Ganar: pasar la meta por 25 cm.
  for (let s = traza.sMeta + 25; s <= traza.sMeta + 35 && !elegido; s += 5) {
    const p = traza.puntoEn(s);
    const destino = new THREE.Vector3(p.x, 0, p.z);
    const d = destino.distanceTo(tirador);
    if (d < alcance && caminoLibre(tirador, destino)) {
      elegido = { direccion: destino.clone().sub(tirador).setY(0).normalize(), fuerza: fuerzaPara(d), objetivo: destino, intencion: 'meta' };
    }
  }

  // 2. Atacar: meter en un hueco a un rival que va adelante.
  if (!elegido) {
    let mejor = null;
    for (const o of otros) {
      if (o.recorrido < miRecorrido - 30) continue; // solo a los que van adelante o parejos
      for (const h of huecos) {
        const haciaHueco = new THREE.Vector3(h.x - o.pos.x, 0, h.z - o.pos.z);
        const distHueco = haciaHueco.length();
        if (distHueco > 70 || distHueco < 1) continue;
        haciaHueco.divideScalar(distHueco);
        const contactoRival = radioBolincha + (o.radio ?? CONFIG.bolinchas.normal.diametro / 2);
        const traspaso = ((1 + e) * pesoTirador) / (pesoTirador + (o.peso ?? CONFIG.bolinchas.normal.peso));
        const fantasma = o.pos.clone().addScaledVector(haciaHueco, -contactoRival);
        const camino = new THREE.Vector3().subVectors(fantasma, tirador).setY(0);
        const largo = camino.length();
        if (largo < contactoRival || largo > 160) continue;
        const dir = camino.clone().divideScalar(largo);
        const corte = dir.angleTo(haciaHueco);
        if (corte > THREE.MathUtils.degToRad(55)) continue;
        if (!caminoLibre(tirador, fantasma, o.pos) || !caminoLibre(o.pos, new THREE.Vector3(h.x, 0, h.z), o.pos)) continue;
        // Que el rival llegue al hueco ya casi sin velocidad (si va rápido, lo salta).
        const vBlanco = buscar((v) => distanciaHastaParar(v, f), distHueco + 1, vMax);
        if (vBlanco === null) continue;
        const v0 = buscar((v) => velocidadTras(v, largo, f), vBlanco / (Math.cos(corte) * traspaso), vMax * 1.5);
        if (v0 === null || v0 > vMax) continue;
        const costo = corte + largo / 100;
        if (!mejor || costo < mejor.costo) mejor = { direccion: dir, fuerza: v0 / vMax, objetivo: o.pos, intencion: 'atacar', costo };
      }
    }
    if (mejor && Math.random() >= n.despiste) elegido = mejor;
  }

  // 3. Avanzar al punto más lejano que se ve, sin quedar arriba de un hueco.
  if (!elegido) {
    for (let s = Math.min(miRecorrido + alcance, traza.largo - 10); s > miRecorrido + 10 && !elegido; s -= 10) {
      for (const lado of [0, 4, -4, 7, -7]) {
        const p = traza.puntoEn(s);
        const destino = new THREE.Vector3(p.x - p.dir.y * lado, 0, p.z + p.dir.x * lado);
        const d = destino.distanceTo(tirador);
        if (d > alcance || cercaDeHueco(destino) || !caminoLibre(tirador, destino)) continue;
        elegido = { direccion: destino.clone().sub(tirador).setY(0).normalize(), fuerza: fuerzaPara(d), objetivo: destino, intencion: 'avanzar' };
        break;
      }
    }
  }

  // 4. Encerrado (no ve ningún punto libre): un tiro suave hacia adelante por el caño.
  if (!elegido) {
    const p = traza.puntoEn(miRecorrido + 30);
    const destino = new THREE.Vector3(p.x, 0, p.z);
    elegido = { direccion: destino.clone().sub(tirador).setY(0).normalize(), fuerza: 0.35, objetivo: destino, intencion: 'avanzar' };
  }

  const direccion = elegido.direccion
    .clone()
    .applyAxisAngle(new THREE.Vector3(0, 1, 0), THREE.MathUtils.degToRad(azarCampana() * n.errorAngulo));
  const fuerza = THREE.MathUtils.clamp(elegido.fuerza * (1 + azarCampana() * n.errorFuerza), 0.06, 1);
  return { direccion, fuerza, objetivo: elegido.objetivo, intencion: elegido.intencion };
}
