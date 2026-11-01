// Recorrido que va a hacer una bolincha tirada, calculado con las MISMAS reglas que la
// mueven en el juego (bolincha.js: frenado de la tierra, curva y patinazo del efecto,
// y la amortiguación de Rapier). Sirve para dibujar la línea de puntería tal como va
// a ser de verdad. No calcula choques: se corta en lo primero que toque.
import { CONFIG } from './config.js';

// desde: { x, z }; dir: { x, z } normalizada; efecto: { arriba, costado } o null.
// obstaculos: [{ x, z, radio }] (bolinchas, piedras): se corta al tocar uno.
// Devuelve { puntos: [{ x, z }], choque: { x, z } | null }.
export function predecirRecorrido({ desde, radio, dir, fuerza, efecto = null, superficie = 'tierra', obstaculos = [], cada = 1.5, largoMaximo = Infinity }) {
  const dt = CONFIG.pasoFisica;
  const e = CONFIG.efecto;
  const s = CONFIG.superficies[superficie];
  const velMax = CONFIG.tiro.velocidadMaxima * fuerza;
  let vx = dir.x * velMax;
  let vz = dir.z * velMax;
  let x = desde.x;
  let z = desde.z;
  let giro = null;
  if (efecto && efecto.arriba) {
    const adelante = 1 + efecto.arriba * (efecto.arriba > 0 ? e.arriba : e.abajo);
    giro = { x: dir.x * adelante * velMax, z: dir.z * adelante * velMax };
  }
  let curvaEmpuje = 0;
  let curvaRestante = 0;
  if (efecto && efecto.costado) {
    curvaEmpuje = e.curvaEmpuje * efecto.costado;
    curvaRestante = e.curvaDuracion;
  }
  const puntos = [{ x, z }];
  let recorrido = 0;
  let desdeUltimo = 0;
  const freno = s.resistenciaRodadura * CONFIG.gravedad * dt;
  for (let paso = 0; paso < 20 / dt; paso++) {
    // --- lo mismo que aplicarRodadura ---
    const rapidezCurva = Math.hypot(vx, vz);
    if (curvaRestante > 0 && rapidezCurva > 5) {
      curvaRestante -= dt;
      const ang = Math.max(-0.1, Math.min(0.1, (curvaEmpuje * dt) / rapidezCurva));
      const c = Math.cos(ang);
      const sn = Math.sin(ang);
      [vx, vz] = [vx * c - vz * sn, vz * c + vx * sn];
      if (giro) [giro.x, giro.z] = [giro.x * c - giro.z * sn, giro.z * c + giro.x * sn];
    }
    let frenarVelocidad = true;
    if (giro) {
      const px = vx - giro.x;
      const pz = vz - giro.z;
      const patina = Math.hypot(px, pz);
      const a = e.roce * CONFIG.gravedad * dt;
      if (patina < 1 || 3.5 * a >= patina) {
        vx -= px / 3.5;
        vz -= pz / 3.5;
        giro = null;
      } else {
        vx -= (px / patina) * a;
        vz -= (pz / patina) * a;
        giro.x += (px / patina) * a * 2.5;
        giro.z += (pz / patina) * a * 2.5;
        const g = Math.hypot(giro.x, giro.z);
        const kg = g > 1e-6 ? Math.max(g - freno, 0) / g : 0;
        giro.x *= kg;
        giro.z *= kg;
        frenarVelocidad = false;
      }
    }
    if (frenarVelocidad) {
      const rapidez = Math.hypot(vx, vz);
      const k = rapidez > 1e-6 ? Math.max(rapidez - freno, 0) / rapidez : 0;
      vx *= k;
      vz *= k;
    }
    // --- amortiguación de Rapier y avance ---
    const amort = 1 / (1 + dt * s.frenado);
    vx *= amort;
    vz *= amort;
    const dx = vx * dt;
    const dz = vz * dt;
    const d = Math.hypot(dx, dz);
    // ¿Toca algo en este tramo? (se mira el tramo entero, no solo la punta, para no
    // saltarse un roce cuando va rápido)
    let primero = Infinity;
    for (const o of obstaculos) {
      const suma = radio + o.radio;
      const cx = o.x - x;
      const cz = o.z - z;
      if (cx * cx + cz * cz <= suma * suma) {
        primero = 0;
        break;
      }
      if (d < 1e-9) continue;
      const ux = dx / d;
      const uz = dz / d;
      const avance = cx * ux + cz * uz;
      const lado2 = cx * cx + cz * cz - avance * avance;
      if (avance <= 0 || lado2 >= suma * suma) continue;
      const t = avance - Math.sqrt(suma * suma - lado2);
      if (t <= d && t < primero) primero = t;
    }
    if (primero < Infinity) {
      const k = d > 1e-9 ? primero / d : 0;
      x += dx * k;
      z += dz * k;
      puntos.push({ x, z });
      return { puntos, choque: { x, z } };
    }
    x += dx;
    z += dz;
    recorrido += d;
    desdeUltimo += d;
    if (desdeUltimo >= cada) {
      puntos.push({ x, z });
      desdeUltimo = 0;
    }
    if (recorrido >= largoMaximo) break;
    const quieta = Math.hypot(vx, vz) < CONFIG.velocidadParada && !(giro && Math.hypot(giro.x, giro.z) > CONFIG.velocidadParada * 2);
    if (quieta) break;
  }
  puntos.push({ x, z });
  return { puntos, choque: null };
}
