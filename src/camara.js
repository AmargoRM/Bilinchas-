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
  let mapa = null; // { cx, cz, ancho, largo } cuando se mira el mapa desde arriba

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

    // Girar con el dedo.
    orbitar(dx, dy) {
      giroDeseado = null;
      giro -= dx * 0.008;
      altura = THREE.MathUtils.clamp(altura + dy * 0.005, c.alturaMinima, c.alturaMaxima);
    },

    // Vuelve a la altura y distancia de siempre (el giro queda donde está).
    vistaNormal() {
      altura = c.altura;
      distancia = c.distancia;
    },

    acercar(factor) {
      distancia = THREE.MathUtils.clamp(distancia * factor, c.distanciaMinima, c.distanciaMaxima);
    },

    // Vista desde arriba de todo el mapa (bordes: { minX, maxX, minZ, maxZ }); null para volver.
    vistaMapa(bordes) {
      mapa = bordes
        ? { cx: (bordes.minX + bordes.maxX) / 2, cz: (bordes.minZ + bordes.maxZ) / 2, ancho: bordes.maxX - bordes.minX, largo: bordes.maxZ - bordes.minZ }
        : null;
    },

    actualizar(dt, posBolincha) {
      if (mapa) {
        // Altura justa para que entre todo el mapa en la pantalla.
        const tan = Math.tan(THREE.MathUtils.degToRad(camara.fov / 2));
        // Con margen para que el marcador de arriba y los botones de abajo no tapen el mapa.
        const alto = (Math.max(mapa.ancho / camara.aspect, mapa.largo) / (2 * tan)) * 1.5 + 20;
        const corrimiento = alto * tan * 0.16; // baja un poco el mapa en la pantalla
        camara.position.set(mapa.cx, alto, mapa.cz - corrimiento + 0.01);
        camara.lookAt(mapa.cx, 0, mapa.cz - corrimiento);
        return;
      }
      const suave = primeraVez ? 1 : 1 - Math.exp(-dt * 6);
      primeraVez = false;
      objetivo.lerp(posBolincha, suave);
      if (giroDeseado !== null) {
        // Girar por el camino más corto.
        let dif = giroDeseado - giro;
        dif = Math.atan2(Math.sin(dif), Math.cos(dif));
        giro += dif * (1 - Math.exp(-dt * 2)); // giro tranquilo hacia el próximo tiro
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
