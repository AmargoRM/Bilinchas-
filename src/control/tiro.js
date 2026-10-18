// El tiro tipo liga: tocar la bolincha, arrastrar hacia atrás y soltar.
// También maneja el modo cámara (arrastrar para girar alrededor).
import * as THREE from 'three';
import { CONFIG } from '../config.js';

export function crearControlTiro({ lienzo, escena, camara, controlCamara, bolincha, puedeTirar, alApuntar, alTirar }) {
  const t = CONFIG.tiro;
  let modo = 'apuntar'; // 'apuntar' o 'camara'
  let arrastre = null; // { id, x, y, tipo }
  let fuerza = 0;
  const direccion = new THREE.Vector3();
  const adelante = new THREE.Vector3();
  const derecha = new THREE.Vector3();
  const proyectada = new THREE.Vector3();

  // Línea corta de puntería: puntos de tiza.
  const punteria = new THREE.Group();
  const cantidadPuntos = 7;
  const materialPunto = new THREE.MeshBasicMaterial({ color: 0xf6f1e4, transparent: true, opacity: 0.9, depthWrite: false });
  const geoPunto = new THREE.CircleGeometry(0.32, 12);
  geoPunto.rotateX(-Math.PI / 2);
  for (let i = 0; i < cantidadPuntos; i++) punteria.add(new THREE.Mesh(geoPunto, materialPunto));
  // Punta de flecha al final.
  const punta = new THREE.Mesh(
    new THREE.ConeGeometry(0.9, 1.8, 3).rotateX(Math.PI / 2).scale(1, 0.25, 1),
    materialPunto
  );
  punteria.add(punta);
  punteria.visible = false;
  escena.add(punteria);

  function enPantalla(pos) {
    proyectada.copy(pos).project(camara);
    const r = lienzo.getBoundingClientRect();
    return { x: (proyectada.x * 0.5 + 0.5) * r.width + r.left, y: (-proyectada.y * 0.5 + 0.5) * r.height + r.top };
  }

  function calcularTiro(e) {
    const dx = e.clientX - arrastre.x;
    const dy = e.clientY - arrastre.y;
    const largo = Math.hypot(dx, dy);
    const maximo = Math.min(window.innerWidth, window.innerHeight) * t.arrastreMaximo;
    fuerza = Math.min(largo / maximo, 1);
    if (largo < 1) return;
    // Arrastrar hacia abajo (hacia uno) = tirar hacia adelante, como una liga.
    controlCamara.adelante(adelante);
    controlCamara.derecha(derecha);
    direccion
      .copy(adelante)
      .multiplyScalar(dy)
      .addScaledVector(derecha, -dx)
      .normalize();
  }

  lienzo.addEventListener('pointerdown', (e) => {
    if (arrastre) return;
    if (modo === 'camara') {
      arrastre = { id: e.pointerId, x: e.clientX, y: e.clientY, tipo: 'camara' };
    } else {
      if (!puedeTirar()) return;
      const p = enPantalla(bolincha.posicion);
      if (Math.hypot(e.clientX - p.x, e.clientY - p.y) > t.toleranciaToque) return;
      arrastre = { id: e.pointerId, x: e.clientX, y: e.clientY, tipo: 'tiro' };
      fuerza = 0;
      alApuntar(0);
    }
    lienzo.setPointerCapture(e.pointerId);
    e.preventDefault();
  });

  lienzo.addEventListener('pointermove', (e) => {
    if (!arrastre || e.pointerId !== arrastre.id) return;
    if (arrastre.tipo === 'camara') {
      controlCamara.orbitar(e.clientX - arrastre.x, e.clientY - arrastre.y);
      arrastre.x = e.clientX;
      arrastre.y = e.clientY;
    } else {
      calcularTiro(e);
      alApuntar(fuerza);
    }
  });

  function soltar(e, cancelado) {
    if (!arrastre || e.pointerId !== arrastre.id) return;
    const era = arrastre.tipo;
    arrastre = null;
    if (era !== 'tiro') return;
    punteria.visible = false;
    alApuntar(null);
    if (!cancelado && fuerza >= t.fuerzaMinima) alTirar(direccion.clone(), fuerza);
    fuerza = 0;
  }
  lienzo.addEventListener('pointerup', (e) => soltar(e, false));
  lienzo.addEventListener('pointercancel', (e) => soltar(e, true));

  // Rueda del mouse: acercar o alejar la cámara.
  lienzo.addEventListener(
    'wheel',
    (e) => {
      controlCamara.acercar(e.deltaY > 0 ? 1.1 : 0.9);
      e.preventDefault();
    },
    { passive: false }
  );

  return {
    get modo() {
      return modo;
    },

    alternarModoCamara() {
      modo = modo === 'camara' ? 'apuntar' : 'camara';
      arrastre = null;
      punteria.visible = false;
      alApuntar(null);
      return modo;
    },

    // Ubica los puntos de puntería frente a la bolincha.
    actualizar() {
      const apuntando = arrastre && arrastre.tipo === 'tiro' && fuerza >= t.fuerzaMinima;
      punteria.visible = !!apuntando;
      if (!apuntando) return;
      const pos = bolincha.posicion;
      const inicio = bolincha.radio + 1;
      const tramo = (t.largoPunteria - inicio) / cantidadPuntos;
      for (let i = 0; i < cantidadPuntos; i++) {
        const d = inicio + tramo * i;
        punteria.children[i].position.set(pos.x + direccion.x * d, 0.05, pos.z + direccion.z * d);
      }
      const dPunta = t.largoPunteria + 0.6;
      punta.position.set(pos.x + direccion.x * dPunta, 0.06, pos.z + direccion.z * dPunta);
      punta.rotation.y = Math.atan2(direccion.x, direccion.z);
    },
  };
}
