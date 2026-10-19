// El tiro tipo liga: tocar la bolincha, arrastrar hacia atrás y soltar.
// La cámara se maneja con el dedo, sin botones:
//   - arrastrar fuera de la bolincha: gira alrededor de ella (y sube o baja);
//   - dos dedos: pellizcar para acercar o alejar (y girar moviendo los dos);
//   - tocar dos veces rápido en un lugar vacío: vuelve a la vista normal.
import * as THREE from 'three';
import { CONFIG } from '../config.js';

export function crearControlTiro({ lienzo, escena, camara, controlCamara, obtenerBolincha, puedeTirar, alApuntar, alTirar }) {
  const t = CONFIG.tiro;
  let arrastre = null; // un dedo: { id, x, y, tipo: 'tiro' | 'camara' }
  const dedos = new Map(); // dedos apoyados: id → { x, y }
  let pellizco = null; // dos dedos: { distancia, x, y }
  let ultimoToque = { t: 0, x: 0, y: 0 }; // para reconocer el doble toque
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

  function cancelarTiro() {
    if (arrastre && arrastre.tipo === 'tiro') {
      punteria.visible = false;
      alApuntar(null);
      fuerza = 0;
    }
    arrastre = null;
  }

  function medirPellizco() {
    const [a, b] = [...dedos.values()];
    return { distancia: Math.max(Math.hypot(a.x - b.x, a.y - b.y), 1), x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
  }

  lienzo.addEventListener('pointerdown', (e) => {
    dedos.set(e.pointerId, { x: e.clientX, y: e.clientY });
    lienzo.setPointerCapture(e.pointerId);
    e.preventDefault();

    if (dedos.size === 2) {
      // Entró un segundo dedo: se deja de apuntar (no tira) y se pasa a pellizcar.
      cancelarTiro();
      pellizco = medirPellizco();
      return;
    }
    if (dedos.size > 2) return;

    // Un solo dedo: sobre la bolincha (si es su turno) apunta; en cualquier otro lado, mueve la cámara.
    let tipo = 'camara';
    if (puedeTirar()) {
      const p = enPantalla(obtenerBolincha().posicion);
      if (Math.hypot(e.clientX - p.x, e.clientY - p.y) <= t.toleranciaToque) tipo = 'tiro';
    }
    arrastre = { id: e.pointerId, x: e.clientX, y: e.clientY, inicioX: e.clientX, inicioY: e.clientY, tipo };
    if (tipo === 'tiro') {
      fuerza = 0;
      alApuntar(0);
    }
  });

  lienzo.addEventListener('pointermove', (e) => {
    const dedo = dedos.get(e.pointerId);
    if (!dedo) return;
    dedo.x = e.clientX;
    dedo.y = e.clientY;

    if (pellizco && dedos.size === 2) {
      const ahora = medirPellizco();
      controlCamara.acercar(pellizco.distancia / ahora.distancia);
      controlCamara.orbitar(ahora.x - pellizco.x, 0);
      pellizco = ahora;
      return;
    }
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
    if (!dedos.delete(e.pointerId)) return;
    if (dedos.size < 2) pellizco = null;
    if (!arrastre || e.pointerId !== arrastre.id) return;
    const era = arrastre;
    arrastre = null;
    if (era.tipo === 'camara') {
      // Un toque corto sin moverse, dos veces seguidas: vuelve a la vista normal.
      const quieto = Math.hypot(e.clientX - era.inicioX, e.clientY - era.inicioY) < 12;
      if (quieto && !cancelado) {
        const ahora = performance.now();
        if (ahora - ultimoToque.t < 350 && Math.hypot(e.clientX - ultimoToque.x, e.clientY - ultimoToque.y) < 40) {
          controlCamara.vistaNormal();
          ultimoToque.t = 0;
        } else {
          ultimoToque = { t: ahora, x: e.clientX, y: e.clientY };
        }
      }
      return;
    }
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

  let externa = null; // puntería que muestra la computadora: { direccion, fuerza }

  return {
    // Muestra la puntería de la computadora (null la oculta).
    mostrarPunteriaExterna(dir, f) {
      externa = dir ? { direccion: dir, fuerza: f } : null;
    },

    // Ubica los puntos de puntería frente a la bolincha.
    actualizar() {
      if (externa) direccion.copy(externa.direccion);
      const apuntando = externa || (arrastre && arrastre.tipo === 'tiro' && fuerza >= t.fuerzaMinima);
      punteria.visible = !!apuntando;
      if (!apuntando) return;
      const bolincha = obtenerBolincha();
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
