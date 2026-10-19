// Cómo se apunta y se tira (como en los juegos de pool):
//   - Apuntar: deslizar el dedo de lado a lado en cualquier parte de la pantalla.
//     La cámara gira detrás de la bolincha y el tiro sale hacia donde mira.
//     Deslizar hacia arriba o abajo sube o baja la vista.
//   - Tirar: la barra de fuerza de la derecha. Se baja con el dedo (más abajo = más fuerte)
//     y al soltarla sale el tiro. Si se vuelve a subir hasta arriba, no tira.
//   - Dos dedos: pellizcar para acercar o alejar.
//   - Tocar dos veces rápido: vuelve a la vista normal.
import * as THREE from 'three';
import { CONFIG } from '../config.js';

// Radianes que gira la puntería por cada píxel de deslizamiento (chico = más fino).
const GIRO_POR_PIXEL = 0.0032;

export function crearControlTiro({ lienzo, escena, controlCamara, obtenerBolincha, obtenerEfecto = () => null, obtenerLargoPunteria = () => 1, puedeTirar, alApuntar, alTirar }) {
  const t = CONFIG.tiro;
  let arrastre = null; // un dedo sobre la pantalla: { id, x, y, inicioX, inicioY }
  const dedos = new Map(); // dedos apoyados: id → { x, y }
  let pellizco = null; // dos dedos: { distancia }
  let ultimoToque = { t: 0, x: 0, y: 0 }; // para reconocer el doble toque
  let fuerza = 0;
  let cargando = null; // la barra de fuerza: { id, y0 }
  const direccion = new THREE.Vector3();

  // Línea de puntería: puntos de tiza.
  const punteria = new THREE.Group();
  const cantidadPuntos = 12;
  const materialPunto = new THREE.MeshBasicMaterial({ color: 0xf6f1e4, transparent: true, opacity: 0.9, depthWrite: false });
  const geoPunto = new THREE.CircleGeometry(0.32, 12);
  geoPunto.rotateX(-Math.PI / 2);
  for (let i = 0; i < cantidadPuntos; i++) punteria.add(new THREE.Mesh(geoPunto, materialPunto));
  // Punta de flecha al final.
  const punta = new THREE.Mesh(new THREE.ConeGeometry(0.9, 1.8, 3).rotateX(Math.PI / 2).scale(1, 0.25, 1), materialPunto);
  punteria.add(punta);
  punteria.visible = false;
  escena.add(punteria);

  // ---------------- Pantalla: apuntar y mirar ----------------
  const medirPellizco = () => {
    const [a, b] = [...dedos.values()];
    return { distancia: Math.max(Math.hypot(a.x - b.x, a.y - b.y), 1) };
  };

  lienzo.addEventListener('pointerdown', (e) => {
    dedos.set(e.pointerId, { x: e.clientX, y: e.clientY });
    lienzo.setPointerCapture(e.pointerId);
    e.preventDefault();
    if (dedos.size === 2) {
      arrastre = null;
      pellizco = medirPellizco();
      return;
    }
    if (dedos.size > 2) return;
    arrastre = { id: e.pointerId, x: e.clientX, y: e.clientY, inicioX: e.clientX, inicioY: e.clientY };
  });

  lienzo.addEventListener('pointermove', (e) => {
    const dedo = dedos.get(e.pointerId);
    if (!dedo) return;
    dedo.x = e.clientX;
    dedo.y = e.clientY;
    if (pellizco && dedos.size === 2) {
      const ahora = medirPellizco();
      controlCamara.acercar(pellizco.distancia / ahora.distancia);
      pellizco = ahora;
      return;
    }
    if (!arrastre || e.pointerId !== arrastre.id) return;
    // De lado a lado gira (y con eso apunta); de arriba a abajo sube o baja la vista.
    controlCamara.orbitar((e.clientX - arrastre.x) * (GIRO_POR_PIXEL / 0.008), e.clientY - arrastre.y);
    arrastre.x = e.clientX;
    arrastre.y = e.clientY;
  });

  function soltarPantalla(e, cancelado) {
    if (!dedos.delete(e.pointerId)) return;
    if (dedos.size < 2) pellizco = null;
    if (!arrastre || e.pointerId !== arrastre.id) return;
    const era = arrastre;
    arrastre = null;
    // Un toque corto sin moverse, dos veces seguidas: vuelve a la vista normal.
    const quieto = Math.hypot(e.clientX - era.inicioX, e.clientY - era.inicioY) < 12;
    if (!quieto || cancelado) return;
    const ahora = performance.now();
    if (ahora - ultimoToque.t < 350 && Math.hypot(e.clientX - ultimoToque.x, e.clientY - ultimoToque.y) < 40) {
      controlCamara.vistaNormal();
      ultimoToque.t = 0;
    } else {
      ultimoToque = { t: ahora, x: e.clientX, y: e.clientY };
    }
  }
  lienzo.addEventListener('pointerup', (e) => soltarPantalla(e, false));
  lienzo.addEventListener('pointercancel', (e) => soltarPantalla(e, true));

  // Rueda del mouse: acercar o alejar la cámara.
  lienzo.addEventListener(
    'wheel',
    (e) => {
      controlCamara.acercar(e.deltaY > 0 ? 1.1 : 0.9);
      e.preventDefault();
    },
    { passive: false }
  );

  // ---------------- Barra de fuerza: bajar y soltar ----------------
  const barra = document.getElementById('barra-tiro');
  const carril = document.getElementById('barra-carril');
  function fuerzaDesde(y) {
    const r = carril.getBoundingClientRect();
    return THREE.MathUtils.clamp((y - cargando.y0) / (r.height * 0.95), 0, 1);
  }
  barra.addEventListener('pointerdown', (e) => {
    if (!puedeTirar() || cargando) return;
    cargando = { id: e.pointerId, y0: e.clientY };
    barra.setPointerCapture(e.pointerId);
    fuerza = 0;
    alApuntar(0);
    e.preventDefault();
  });
  barra.addEventListener('pointermove', (e) => {
    if (!cargando || e.pointerId !== cargando.id) return;
    fuerza = fuerzaDesde(e.clientY);
    alApuntar(fuerza);
  });
  function soltarBarra(e, cancelado) {
    if (!cargando || e.pointerId !== cargando.id) return;
    cargando = null;
    alApuntar(null);
    if (!cancelado && fuerza >= t.fuerzaMinima && puedeTirar()) {
      controlCamara.adelante(direccion);
      alTirar(direccion.clone(), fuerza);
    }
    fuerza = 0;
  }
  barra.addEventListener('pointerup', (e) => soltarBarra(e, false));
  barra.addEventListener('pointercancel', (e) => soltarBarra(e, true));

  let externa = null; // puntería que muestra la computadora: { direccion, fuerza }

  return {
    // Muestra la puntería de la computadora (null la oculta).
    mostrarPunteriaExterna(dir, f) {
      externa = dir ? { direccion: dir, fuerza: f } : null;
    },

    // Ubica los puntos de puntería frente a la bolincha.
    actualizar() {
      if (externa) direccion.copy(externa.direccion);
      else controlCamara.adelante(direccion);
      const apuntando = !!externa || puedeTirar();
      punteria.visible = apuntando;
      if (!apuntando) return;
      const bolincha = obtenerBolincha();
      const pos = bolincha.posicion;
      const inicio = bolincha.radio + 1;
      // (más larga con el poder "Ojo fino"; la de la computadora, siempre normal)
      const largo = t.largoPunteria * (externa ? 1 : obtenerLargoPunteria());
      const tramo = (largo - inicio) / cantidadPuntos;
      // Con curva, la línea se tuerce hacia ese lado (solo en el tiro de la persona).
      const curva = externa ? 0 : obtenerEfecto()?.costado || 0;
      const torcer = (d) => curva * 3 * (d / largo) ** 2;
      // Derecha de la dirección, en el suelo.
      const dx = -direccion.z;
      const dz = direccion.x;
      for (let i = 0; i < cantidadPuntos; i++) {
        const d = inicio + tramo * i;
        const lado = torcer(d);
        punteria.children[i].position.set(pos.x + direccion.x * d + dx * lado, 0.05, pos.z + direccion.z * d + dz * lado);
      }
      const dPunta = largo + 0.6;
      const ladoPunta = torcer(dPunta);
      punta.position.set(pos.x + direccion.x * dPunta + dx * ladoPunta, 0.06, pos.z + direccion.z * dPunta + dz * ladoPunta);
      // La punta apunta según la tangente de la curva.
      const pendiente = (curva * 6 * dPunta) / largo ** 2;
      punta.rotation.y = Math.atan2(direccion.x + dx * pendiente, direccion.z + dz * pendiente);
    },
  };
}
