// Lo que se ve de una explosión: un destello naranja que crece y se apaga,
// chispas y terrones de tierra que saltan, una luz que parpadea y la cámara que tiembla.
import * as THREE from 'three';
import { CONFIG } from '../config.js';

const CHISPAS = 40;
const DURACION = 0.9; // segundos

export function crearExplosiones(escena) {
  const activas = [];
  const geoDestello = new THREE.SphereGeometry(1, 20, 12);
  const geoChispa = new THREE.BoxGeometry(0.5, 0.5, 0.5);
  const matChispa = new THREE.MeshBasicMaterial({ color: 0xffb340 });
  const matTerron = new THREE.MeshStandardMaterial({ color: 0x5a2c16, roughness: 1 });
  let temblor = 0;
  // Una sola luz, creada desde el principio y apagada: agregar luces en medio del juego
  // obliga a rehacer todos los materiales y traba la pantalla un momento.
  const luz = new THREE.PointLight(0xff8a30, 0, 120, 1.5);
  escena.add(luz);

  function lanzar(pos) {
    const grupo = new THREE.Group();
    grupo.position.copy(pos).setY(0.5);
    const destello = new THREE.Mesh(
      geoDestello,
      new THREE.MeshBasicMaterial({ color: 0xffa040, transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending, depthWrite: false })
    );
    luz.position.copy(pos).setY(6);
    grupo.add(destello);
    const piezas = [];
    for (let i = 0; i < CHISPAS; i++) {
      const esChispa = i % 2 === 0;
      const m = new THREE.Mesh(geoChispa, esChispa ? matChispa : matTerron);
      const a = Math.random() * Math.PI * 2;
      const rapidez = 40 + Math.random() * 120;
      const v = new THREE.Vector3(Math.cos(a) * rapidez, 60 + Math.random() * 140, Math.sin(a) * rapidez);
      m.scale.setScalar(esChispa ? 0.5 + Math.random() * 0.6 : 0.8 + Math.random() * 1.2);
      grupo.add(m);
      piezas.push({ m, v });
    }
    escena.add(grupo);
    activas.push({ grupo, destello, piezas, t: 0 });
    temblor = Math.min(temblor + 1, 1.5);
  }

  return {
    lanzar,

    // Avanza las explosiones. Devuelve cuánto debe temblar la cámara (cm).
    actualizar(dt) {
      for (let i = activas.length - 1; i >= 0; i--) {
        const e = activas[i];
        e.t += dt;
        const k = e.t / DURACION;
        const radio = CONFIG.explosivas.radio * 0.45 * Math.min(e.t / 0.12, 1);
        e.destello.scale.setScalar(Math.max(radio, 0.01));
        e.destello.material.opacity = Math.max(0.9 * (1 - e.t / 0.35), 0);
        if (i === activas.length - 1) luz.intensity = 4000 * Math.max(1 - e.t / 0.3, 0);
        for (const p of e.piezas) {
          p.v.y -= CONFIG.gravedad * dt;
          p.m.position.addScaledVector(p.v, dt);
          if (p.m.position.y < 0) {
            p.m.position.y = 0;
            p.v.multiplyScalar(0.3);
          }
          p.m.rotation.x += dt * 8;
        }
        if (k >= 1) {
          escena.remove(e.grupo);
          e.destello.material.dispose();
          activas.splice(i, 1);
        }
      }
      if (activas.length === 0) luz.intensity = 0;
      temblor = Math.max(temblor - dt * 2.5, 0);
      return temblor * 1.2;
    },
  };
}
