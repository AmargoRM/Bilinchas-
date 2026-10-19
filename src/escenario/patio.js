// Escenario del Modo Círculo: el círculo de tiza y el lugar donde está dibujado.
//   "patio": tierra de barrio, zacate y cerca de madera.
//   "calle": asfalto, casas y un marco de fútbol (ver calle.js).
// Todas las texturas se dibujan por código: no hace falta descargar fotos.
import * as THREE from 'three';
import { CONFIG } from '../config.js';
import { crearCalle } from './calle.js';

// Hasta dónde se ve antes de que la niebla tape todo (cm), según el lugar.
const NIEBLA = { patio: [250, 750], calle: [450, 1700] };

// Números al azar pero siempre los mismos, para que el patio no cambie en cada carga.
export function azarFijo(semilla) {
  let s = semilla >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function crearPatio(escena, fisica) {
  const grupo = new THREE.Group();
  const lugares = { patio: new THREE.Group() };
  lugares.patio.add(crearTierra(), crearZacate(), crearCerca());
  grupo.add(lugares.patio);
  escena.add(grupo);

  // Un dibujo de tiza por cada tamaño de círculo (se hace la primera vez que se usa).
  const tizas = {};
  function usarRadio(radio) {
    if (radio && !tizas[radio]) {
      tizas[radio] = crearTiza(radio);
      grupo.add(tizas[radio]);
    }
    for (const [r, t] of Object.entries(tizas)) t.visible = Number(r) === radio;
  }
  usarRadio(CONFIG.circulo.radio);

  // Piedras fijas dentro del círculo (con su cuerpo en la física). Se crean cuando hacen falta.
  const piedras = [];
  function ponerPiedras(lista) {
    while (piedras.length < lista.length) {
      const dibujo = crearPiedra(piedras.length);
      grupo.add(dibujo);
      const cuerpo = fisica.crearFijo(fisica.RAPIER.ColliderDesc.ball(1), 0.5);
      piedras.push({ dibujo, cuerpo, radio: 1 });
    }
    piedras.forEach((p, i) => {
      const datos = lista[i];
      p.dibujo.visible = !!datos;
      p.enUso = !!datos;
      p.cuerpo.setEnabled(!!datos && activo);
      if (!datos) return;
      // Media piedra enterrada: el centro de la esfera queda un poco sobre el suelo.
      p.cuerpo.setShape(new fisica.RAPIER.Ball(datos.radio));
      p.cuerpo.setTranslation({ x: datos.x, y: datos.radio * 0.35, z: datos.z });
      p.dibujo.position.set(datos.x, datos.radio * 0.35, datos.z);
      p.dibujo.scale.setScalar(datos.radio);
    });
  }

  const suelo = crearSueloPatio(fisica);
  const nieblaNormal = escena.fog ? [escena.fog.near, escena.fog.far] : null;
  let actual = 'patio';
  let activo = true;

  function mostrar() {
    grupo.visible = activo;
    for (const [id, g] of Object.entries(lugares)) g.visible = id === actual;
    const niebla = activo ? NIEBLA[actual] : nieblaNormal;
    if (escena.fog && niebla) [escena.fog.near, escena.fog.far] = niebla;
  }

  return {
    // Muestra u oculta el escenario, y prende o apaga su suelo.
    activar(si) {
      activo = si;
      suelo.setEnabled(si);
      for (const p of piedras) p.cuerpo.setEnabled(si && p.enUso);
      mostrar();
    },
    usarRadio,
    // lista: [{ x, z, radio }] (vacía = sin piedras).
    ponerPiedras,
    // Cambia de lugar ('patio' o 'calle'). La calle se arma la primera vez que se usa.
    usarMapa(id) {
      if (!lugares[id]) {
        if (id !== 'calle') return;
        lugares.calle = crearCalle();
        grupo.add(lugares.calle);
      }
      actual = id;
      mostrar();
    },
  };
}

// Piedra gris-café, irregular, de radio 1 (se escala al tamaño que toque).
function crearPiedra(semilla) {
  const azar = azarFijo(300 + semilla);
  const geo = new THREE.IcosahedronGeometry(1, 2);
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const k = 0.85 + azar() * 0.3;
    pos.setXYZ(i, pos.getX(i) * k, pos.getY(i) * k * 0.8, pos.getZ(i) * k);
  }
  geo.computeVertexNormals();
  const tono = 0.18 + azar() * 0.1;
  const piedra = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: new THREE.Color(tono + 0.08, tono, tono - 0.04), roughness: 0.95, flatShading: true }));
  piedra.castShadow = true;
  piedra.receiveShadow = true;
  return piedra;
}

// Suelo de tierra para la física: una losa plana de 6 x 6 metros.
// (Separado del dibujo para poder probar la física sin pantalla.)
export function crearSueloPatio(fisica) {
  return fisica.crearFijo(
    fisica.RAPIER.ColliderDesc.cuboid(300, 5, 300).setTranslation(0, -5, 0),
    CONFIG.superficies.tierra.rebote
  );
}

// ---------------------------------------------------------------
// Tierra café rojiza con piedritas
// ---------------------------------------------------------------
export function crearTierra() {
  const azar = azarFijo(7);
  const tam = 1024;
  const color = document.createElement('canvas');
  color.width = color.height = tam;
  const g = color.getContext('2d');
  const relieve = document.createElement('canvas');
  relieve.width = relieve.height = tam;
  const r = relieve.getContext('2d');

  g.fillStyle = '#8c4a2b';
  g.fillRect(0, 0, tam, tam);
  r.fillStyle = '#808080';
  r.fillRect(0, 0, tam, tam);

  // Manchas grandes: zonas más secas y más húmedas.
  for (let i = 0; i < 70; i++) {
    const x = azar() * tam;
    const y = azar() * tam;
    const rad = 40 + azar() * 160;
    const claro = azar() > 0.5;
    const grad = g.createRadialGradient(x, y, 0, x, y, rad);
    grad.addColorStop(0, claro ? 'rgba(176,112,72,0.35)' : 'rgba(92,44,24,0.35)');
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = grad;
    for (const dx of [-tam, 0, tam]) {
      for (const dy of [-tam, 0, tam]) {
        g.save();
        g.translate(dx, dy);
        g.fillRect(x - rad, y - rad, rad * 2, rad * 2);
        g.restore();
      }
    }
  }

  // Granitos de tierra.
  for (let i = 0; i < 60000; i++) {
    const x = azar() * tam;
    const y = azar() * tam;
    const v = azar();
    const tono = 90 + v * 90;
    g.fillStyle = `rgba(${tono + 30},${tono * 0.55},${tono * 0.35},${0.25 + azar() * 0.35})`;
    const t = 1 + azar() * 2.5;
    g.fillRect(x, y, t, t);
    r.fillStyle = `rgba(${v * 255},${v * 255},${v * 255},0.5)`;
    r.fillRect(x, y, t, t);
  }

  // Piedritas con sombra.
  for (let i = 0; i < 1400; i++) {
    const x = azar() * tam;
    const y = azar() * tam;
    const rad = 1 + azar() * 2.6;
    const gris = 120 + azar() * 90;
    g.fillStyle = 'rgba(40,18,8,0.45)';
    g.beginPath();
    g.ellipse(x + 1.5, y + 1.5, rad, rad * 0.8, 0, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = `rgb(${gris + 20},${gris * 0.82},${gris * 0.66})`;
    g.beginPath();
    g.ellipse(x, y, rad, rad * 0.8, azar() * 3, 0, Math.PI * 2);
    g.fill();
    r.fillStyle = '#fff';
    r.beginPath();
    r.ellipse(x, y, rad, rad * 0.8, 0, 0, Math.PI * 2);
    r.fill();
  }

  const mapa = new THREE.CanvasTexture(color);
  mapa.colorSpace = THREE.SRGBColorSpace;
  const mapaRelieve = new THREE.CanvasTexture(relieve);
  for (const t of [mapa, mapaRelieve]) {
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(9, 9); // cada repetición mide unos 67 cm
    t.anisotropy = 4;
  }

  const suelo = new THREE.Mesh(
    new THREE.PlaneGeometry(600, 600),
    new THREE.MeshStandardMaterial({
      map: mapa,
      bumpMap: mapaRelieve,
      bumpScale: 0.6,
      roughness: 1,
      metalness: 0,
    })
  );
  suelo.rotation.x = -Math.PI / 2;
  suelo.receiveShadow = true;
  return suelo;
}

// ---------------------------------------------------------------
// Círculo de tiza: trazo irregular, como dibujado a mano
// ---------------------------------------------------------------
export function crearTiza(radio) {
  const azar = azarFijo(21);
  const margen = 8;
  const ladoCm = (radio + margen) * 2;
  const tam = 2048;
  const px = tam / ladoCm; // píxeles por centímetro
  const c = document.createElement('canvas');
  c.width = c.height = tam;
  const g = c.getContext('2d');
  const centro = tam / 2;

  // Ondulación suave del radio para que no sea un círculo perfecto.
  const fases = [azar() * 6, azar() * 6, azar() * 6];
  const ondula = (a) =>
    Math.sin(a * 2 + fases[0]) * 0.8 + Math.sin(a * 3 + fases[1]) * 0.5 + Math.sin(a * 7 + fases[2]) * 0.2;

  // Dos pasadas de tiza, levemente desplazadas, como hace la mano.
  for (let pasada = 0; pasada < 2; pasada++) {
    const corrida = (azar() - 0.5) * 0.8;
    const pasos = 9000;
    for (let i = 0; i < pasos; i++) {
      const a = (i / pasos) * Math.PI * 2;
      const rCm = radio + ondula(a) + corrida + (azar() - 0.5) * 2.2;
      const x = centro + Math.cos(a) * rCm * px;
      const y = centro + Math.sin(a) * rCm * px;
      if (Math.sin(a * 23 + pasada * 4) > 0.93 && azar() > 0.3) continue; // cortes del trazo
      g.fillStyle = `rgba(245,242,232,${0.05 + azar() * 0.17})`;
      const t = (0.3 + azar() * 1.2) * px;
      g.fillRect(x - t / 2, y - t / 2, t, t);
    }
  }
  // Polvo de tiza suelto alrededor.
  for (let i = 0; i < 2500; i++) {
    const a = azar() * Math.PI * 2;
    const rCm = radio + ondula(a) + (azar() - 0.5) * 7;
    g.fillStyle = `rgba(240,236,224,${azar() * 0.12})`;
    const t = (0.2 + azar() * 0.6) * px;
    g.fillRect(centro + Math.cos(a) * rCm * px, centro + Math.sin(a) * rCm * px, t, t);
  }

  const mapa = new THREE.CanvasTexture(c);
  mapa.colorSpace = THREE.SRGBColorSpace;
  mapa.anisotropy = 4;
  const tiza = new THREE.Mesh(
    new THREE.PlaneGeometry(ladoCm, ladoCm),
    new THREE.MeshStandardMaterial({
      map: mapa,
      transparent: true,
      depthWrite: false,
      roughness: 1,
      polygonOffset: true,
      polygonOffsetFactor: -2,
    })
  );
  tiza.rotation.x = -Math.PI / 2;
  tiza.position.y = 0.02;
  tiza.receiveShadow = true;
  return tiza;
}

// ---------------------------------------------------------------
// Zacate (pasto) al fondo y a los lados
// ---------------------------------------------------------------
function crearZacate() {
  const azar = azarFijo(99);
  const hoja = new THREE.PlaneGeometry(0.7, 1, 1, 2);
  hoja.translate(0, 0.5, 0);
  // Afinar la punta de la hoja.
  const pos = hoja.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const y = pos.getY(i);
    pos.setX(i, pos.getX(i) * (1 - y * 0.9));
  }

  const cantidad = 6000;
  const zacate = new THREE.InstancedMesh(
    hoja,
    new THREE.MeshStandardMaterial({ side: THREE.DoubleSide, roughness: 0.9 }),
    cantidad
  );
  const m = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const e = new THREE.Euler();
  const color = new THREE.Color();
  let n = 0;
  while (n < cantidad) {
    const x = (azar() - 0.5) * 600;
    const z = (azar() - 0.5) * 600;
    const d = Math.hypot(x, z);
    // Sin pasto en la zona de juego; más tupido a medida que se aleja.
    const densidad = THREE.MathUtils.smoothstep(d, 120, 260);
    if (azar() > densidad) continue;
    e.set((azar() - 0.5) * 0.6, azar() * Math.PI, (azar() - 0.5) * 0.6);
    q.setFromEuler(e);
    const alto = 4 + azar() * 9 * (0.5 + densidad);
    m.compose(new THREE.Vector3(x, 0, z - (z < -200 ? 120 : 0)), q, new THREE.Vector3(1 + azar(), alto, 1));
    zacate.setMatrixAt(n, m);
    color.setHSL(0.2 + azar() * 0.08, 0.45 + azar() * 0.2, 0.22 + azar() * 0.18);
    zacate.setColorAt(n, color);
    n++;
  }
  zacate.instanceMatrix.needsUpdate = true;
  return zacate;
}

// ---------------------------------------------------------------
// Cerca de tablas de madera al fondo
// ---------------------------------------------------------------
export function crearCerca() {
  const azar = azarFijo(5);
  const grupo = new THREE.Group();
  const ancho = 14;
  const cantidad = 70;
  const tablas = new THREE.InstancedMesh(
    new THREE.BoxGeometry(ancho - 0.6, 1, 2),
    new THREE.MeshStandardMaterial({ roughness: 0.95 }),
    cantidad
  );
  const m = new THREE.Matrix4();
  const color = new THREE.Color();
  for (let i = 0; i < cantidad; i++) {
    const alto = 150 + azar() * 12;
    const x = (i - cantidad / 2) * ancho;
    m.compose(
      new THREE.Vector3(x, alto / 2, -430 + azar() * 2),
      new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, (azar() - 0.5) * 0.03)),
      new THREE.Vector3(1, alto, 1)
    );
    tablas.setMatrixAt(i, m);
    color.setHSL(0.07 + azar() * 0.03, 0.35 + azar() * 0.15, 0.2 + azar() * 0.12);
    tablas.setColorAt(i, color);
  }
  grupo.add(tablas);
  // Dos travesaños horizontales.
  const travesano = new THREE.MeshStandardMaterial({ color: 0x4a2e1c, roughness: 0.95 });
  for (const y of [35, 120]) {
    const t = new THREE.Mesh(new THREE.BoxGeometry(cantidad * ancho, 8, 3), travesano);
    t.position.set(-ancho / 2, y, -428);
    grupo.add(t);
  }
  return grupo;
}
