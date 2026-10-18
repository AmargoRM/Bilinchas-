// La cámara que sigue a la bolincha desde atrás y se puede girar alrededor.
import * as THREE from 'three';
import { CONFIG } from './config.js';

export function crearCamara(camara) {
  const c = CONFIG.camara;
  let giro = 0; // ángulo alrededor de la bolincha
  let giroDeseado = null;
  let altura = c.altura;
  let distancia = c.distancia;
  const objetivo = new THREE.Vector3();
  const mirar = new THREE.Vector3();
  let primeraVez = true;

  function adelante(v = new THREE.Vector3()) {
    return v.set(-Math.sin(giro), 0, -Math.cos(giro));
  }

  function derecha(v = new THREE.Vector3()) {
    return v.set(Math.cos(giro), 0, -Math.sin(giro));
  }

  return {
    adelante,
    derecha,

    // Ubica la cámara detrás de "desde", mirando hacia "hacia".
    mirarDesde(desde, hacia, inmediato = false) {
      const g = Math.atan2(-(hacia.x - desde.x), -(hacia.z - desde.z));
      if (inmediato) {
        giro = g;
        giroDeseado = null;
        objetivo.copy(desde);
      } else {
        giroDeseado = g;
      }
    },

    // Girar con el dedo (modo cámara).
    orbitar(dx, dy) {
      giroDeseado = null;
      giro -= dx * 0.008;
      altura = THREE.MathUtils.clamp(altura + dy * 0.005, c.alturaMinima, c.alturaMaxima);
    },

    acercar(factor) {
      distancia = THREE.MathUtils.clamp(distancia * factor, c.distanciaMinima, c.distanciaMaxima);
    },

    actualizar(dt, posBolincha) {
      const suave = primeraVez ? 1 : 1 - Math.exp(-dt * 6);
      primeraVez = false;
      objetivo.lerp(posBolincha, suave);
      if (giroDeseado !== null) {
        // Girar por el camino más corto.
        let dif = giroDeseado - giro;
        dif = Math.atan2(Math.sin(dif), Math.cos(dif));
        giro += dif * (1 - Math.exp(-dt * 3));
        if (Math.abs(dif) < 0.001) giroDeseado = null;
      }
      const horizontal = Math.cos(altura) * distancia;
      camara.position.set(
        objetivo.x + Math.sin(giro) * horizontal,
        objetivo.y + Math.sin(altura) * distancia,
        objetivo.z + Math.cos(giro) * horizontal
      );
      // Mirar un poco por delante de la bolincha, para que se vea hacia dónde se tira.
      adelante(mirar).multiplyScalar(distancia * 0.45).add(objetivo);
      camara.lookAt(mirar);
    },
  };
}
