// El tiro tipo liga: tocar la bolincha, arrastrar hacia atrás y soltar.
// La cámara se maneja con el dedo, sin botones:
//   - arrastrar fuera de la bolincha: gira alrededor de ella (y sube o baja);
//   - dos dedos: pellizcar para acercar o alejar (y girar moviendo los dos);
//   - tocar dos veces rápido en un lugar vacío: vuelve a la vista normal.
import * as THREE from 'three';
import { CONFIG } from '../config.js';
import { predecirRecorrido } from '../prediccion.js';

export function crearControlTiro({ lienzo, escena, camara, controlCamara, obtenerBolincha, obtenerEfecto = () => null, obtenerLargoPunteria = () => 1, obtenerObstaculos = () => [], obtenerRecorridoCompleto = () => false, obtenerAjusteTiro = () => ({ fuerza: 1, efecto: 1 }), puedeTirar, alApuntar, alTirar }) {
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

  // Zona para arrepentirse: aparece mientras se apunta; si se suelta el dedo encima, no tira.
  const zonaCancelar = document.getElementById('zona-cancelar');
  function sobreZona(e) {
    if (zonaCancelar.hidden) return false;
    const r = zonaCancelar.getBoundingClientRect();
    const margen = 16; // un poco más grande que lo que se ve, para el dedo
    return e.clientX > r.left - margen && e.clientX < r.right + margen && e.clientY > r.top - margen && e.clientY < r.bottom + margen;
  }
  function mostrarZona(si) {
    zonaCancelar.hidden = !si;
    zonaCancelar.classList.remove('encima');
  }

  // Línea de puntería: puntos de tiza sobre el camino que de verdad va a hacer
  // (prediccion.js). Corta en las partidas; completa en la Práctica.
  const punteria = new THREE.Group();
  const cantidadPuntos = 90;
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
  // Aro "fantasma": dónde queda tu bolincha en el momento de tocar lo primero que
  // encuentre en su camino (como en los juegos de pool). Si no aparece, no toca nada.
  const fantasma = new THREE.Mesh(
    new THREE.RingGeometry(0.55, 1.15, 32).rotateX(-Math.PI / 2),
    new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.95, depthWrite: false, depthTest: false })
  );
  fantasma.visible = false;
  escena.add(fantasma);
  const ALCANCE_FANTASMA = 120; // cm: más lejos no se dibuja
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
      mostrarZona(false);
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
      mostrarZona(true);
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
      zonaCancelar.classList.toggle('encima', sobreZona(e));
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
    const enLaZona = sobreZona(e);
    mostrarZona(false);
    if (!cancelado && !enLaZona && fuerza >= t.fuerzaMinima) alTirar(direccion.clone(), fuerza);
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
      fantasma.visible = false;
      if (!apuntando) return;
      const bolincha = obtenerBolincha();
      const pos = bolincha.posicion;
      const completo = !externa && obtenerRecorridoCompleto();
      // (más larga con el poder "Ojo fino"; la de la computadora, siempre normal)
      const largo = completo ? Infinity : t.largoPunteria * (externa ? 1 : obtenerLargoPunteria());
      const ajuste = externa ? { fuerza: 1, efecto: 1 } : obtenerAjusteTiro();
      const ef = externa ? null : obtenerEfecto();
      const fuerzaReal = Math.min((externa ? externa.fuerza : fuerza) * ajuste.fuerza, 1.5);
      const r = predecirRecorrido({
        desde: { x: pos.x, z: pos.z },
        radio: bolincha.radio,
        dir: { x: direccion.x, z: direccion.z },
        fuerza: fuerzaReal,
        efecto: ef ? { arriba: ef.arriba * ajuste.efecto, costado: ef.costado * ajuste.efecto } : null,
        superficie: bolincha.superficie || 'tierra',
        obstaculos: obtenerObstaculos(),
        cada: 0.5,
        largoMaximo: completo ? Infinity : ALCANCE_FANTASMA,
      });
      // Aro fantasma: dónde toca lo primero (siguiendo la curva).
      if (r.choque) {
        fantasma.visible = true;
        fantasma.scale.setScalar(bolincha.radio);
        fantasma.position.set(r.choque.x, 0.06, r.choque.z);
      }
      // Puntos repartidos parejo a lo largo del camino (sin pisar la bolincha ni el aro).
      const camino = [];
      let acumulado = 0;
      for (let i = 0; i < r.puntos.length; i++) {
        if (i > 0) acumulado += Math.hypot(r.puntos[i].x - r.puntos[i - 1].x, r.puntos[i].z - r.puntos[i - 1].z);
        camino.push(acumulado);
      }
      const inicio = bolincha.radio + 1;
      const fin = Math.min(acumulado - (r.choque ? bolincha.radio * 1.2 : 0), largo);
      const separacion = completo ? Math.max(3, (fin - inicio) / (cantidadPuntos - 1)) : (largo - inicio) / 7;
      const enCamino = (d) => {
        let i = 1;
        while (i < camino.length - 1 && camino[i] < d) i++;
        const a = r.puntos[i - 1];
        const b = r.puntos[i] || a;
        const tramo = camino[i] - camino[i - 1] || 1;
        const k = Math.min(Math.max((d - camino[i - 1]) / tramo, 0), 1);
        return { x: a.x + (b.x - a.x) * k, z: a.z + (b.z - a.z) * k };
      };
      let usados = 0;
      for (let d = inicio; d <= fin && usados < cantidadPuntos; d += separacion) {
        const q = enCamino(d);
        punteria.children[usados++].position.set(q.x, 0.05, q.z);
      }
      // En la Práctica los puntos llegan lejos: se hacen más grandes para que se vean.
      const tam = completo ? 1.7 : 1;
      for (let i = 0; i < cantidadPuntos; i++) {
        punteria.children[i].visible = i < usados;
        punteria.children[i].scale.setScalar(tam);
      }
      punta.scale.setScalar(tam);
      // Punta de flecha al final, mirando hacia donde va.
      const dPunta = Math.max(fin + 0.6, inicio);
      const q1 = enCamino(dPunta);
      const q0 = enCamino(Math.max(dPunta - 2, 0));
      punta.visible = fin > inicio;
      punta.position.set(q1.x, 0.06, q1.z);
      punta.rotation.y = Math.atan2(q1.x - q0.x, q1.z - q0.z);
    },
  };
}
