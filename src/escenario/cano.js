// Escenario del Modo Caño: canal de concreto en U hecho de tramos con juntas,
// pasto a un lado, calle al otro, y la salida y la meta marcadas con tiza.
// El caño corre a lo largo del eje Z: la salida está en z = 0 y la meta hacia z negativo.
import * as THREE from 'three';
import { CONFIG } from '../config.js';
import { azarFijo, crearCerca } from './patio.js';

const ATRAS = 50; // cm de caño detrás de la salida
const FONDO_LOSA = 6; // cm de concreto debajo del piso del caño

// Medidas que usan el modo y la computadora.
export function medidasCano() {
  const c = CONFIG.cano;
  const largo = c.tramo * c.tramos;
  const a = THREE.MathUtils.degToRad(c.inclinacionPared);
  return {
    mitadFondo: c.anchoFondo / 2,
    // Ancho de la boca: piso + lo que se abre la pared inclinada.
    mitadArriba: c.anchoFondo / 2 + c.profundidad / Math.tan(a),
    alto: c.profundidad,
    zAtras: ATRAS,
    zFinal: ATRAS - largo,
    zMeta: -c.meta,
    largo,
  };
}

// Puntos de la pared derecha, de abajo hacia arriba.
function paredDerecha() {
  const m = medidasCano();
  return [new THREE.Vector2(m.mitadFondo, 0), new THREE.Vector2(m.mitadArriba, m.alto)];
}

// ---------------------------------------------------------------
// Física: piso, paredes curvas, suelo de afuera y tapas.
// (Separado del dibujo para poder probar la física sin pantalla.)
// ---------------------------------------------------------------
export function crearSueloCano(fisica) {
  const { RAPIER } = fisica;
  const m = medidasCano();
  const rebote = CONFIG.superficies.concreto.rebote;
  const colisionadores = [];
  const fijo = (desc) => colisionadores.push(fisica.crearFijo(desc, rebote));

  // Piso plano, dos paredes inclinadas y suelo de afuera. Cada pared se estira
  // hacia abajo, por debajo del piso, para que no quede ningún borde asomado
  // (un borde asomado frena la bolincha de golpe aunque no se vea).
  const zCentro = (m.zAtras + m.zFinal) / 2;
  const mitadLargo = m.largo / 2;
  const grosor = 3;
  fijo(RAPIER.ColliderDesc.cuboid(m.mitadFondo + 3, grosor, mitadLargo).setTranslation(0, -grosor, zCentro));
  const a = THREE.MathUtils.degToRad(CONFIG.cano.inclinacionPared);
  const largoPared = m.alto / Math.sin(a);
  const extra = 4; // cm que la pared sigue por debajo del piso
  for (const lado of [1, -1]) {
    const d = new THREE.Vector2(Math.cos(a) * lado, Math.sin(a));
    const n = lado > 0 ? new THREE.Vector2(-d.y, d.x) : new THREE.Vector2(d.y, -d.x); // hacia adentro
    const centro = new THREE.Vector2(lado * m.mitadFondo, 0)
      .addScaledVector(d, (largoPared - extra) / 2)
      .addScaledVector(n, -grosor);
    const q = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), Math.atan2(d.y, d.x));
    fijo(
      RAPIER.ColliderDesc.cuboid((largoPared + extra) / 2, grosor, mitadLargo)
        .setTranslation(centro.x, centro.y, zCentro)
        .setRotation({ x: q.x, y: q.y, z: q.z, w: q.w })
    );
    // Suelo de afuera (3 m), a la altura de la boca del caño.
    fijo(
      RAPIER.ColliderDesc.cuboid(150, grosor, mitadLargo + 150).setTranslation(
        lado * (m.mitadArriba + 150),
        m.alto - grosor,
        zCentro
      )
    );
  }

  // Tapas en los dos extremos (paredes del caño y suelo de afuera).
  for (const z of [m.zAtras + 75, m.zFinal - 75]) {
    fijo(RAPIER.ColliderDesc.cuboid(m.mitadArriba + 1, (m.alto + 10) / 2, 75).setTranslation(0, (m.alto - 10) / 2, z));
  }
  return colisionadores;
}

export function crearCano(escena, fisica) {
  const grupo = new THREE.Group();
  const m = medidasCano();
  const c = CONFIG.cano;

  const concreto = new THREE.MeshStandardMaterial({ map: texturaConcreto(), roughness: 0.92, metalness: 0 });
  const forma = formaPerfil(m, c.bordillo);

  // Tramos de concreto con una junta de 8 mm entre uno y otro, algo desparejos por el uso.
  const azar = azarFijo(13);
  for (let k = 0; k < c.tramos; k++) {
    const geo = new THREE.ExtrudeGeometry(forma, { depth: c.tramo - 0.8, bevelEnabled: false });
    const tramo = new THREE.Mesh(geo, concreto);
    tramo.position.set(0, (azar() - 0.5) * 0.25, m.zAtras - (k + 1) * c.tramo + 0.4);
    tramo.rotation.y = (azar() - 0.5) * 0.002;
    tramo.receiveShadow = true;
    tramo.castShadow = true;
    grupo.add(tramo);
  }
  // Debajo de las juntas: concreto oscuro y sucio.
  const fondoJuntas = new THREE.Mesh(
    new THREE.ExtrudeGeometry(forma, { depth: m.largo, bevelEnabled: false }),
    new THREE.MeshStandardMaterial({ color: 0x2c2a26, roughness: 1 })
  );
  fondoJuntas.position.set(0, -0.6, m.zFinal);
  fondoJuntas.scale.set(0.995, 1, 1);
  grupo.add(fondoJuntas);

  // Tapas de concreto en los extremos.
  for (const z of [m.zAtras + 4, m.zFinal - 4]) {
    const tapa = new THREE.Mesh(new THREE.BoxGeometry(m.mitadArriba * 2 + c.bordillo * 2, m.alto + FONDO_LOSA, 8), concreto);
    tapa.position.set(0, (m.alto - FONDO_LOSA) / 2, z);
    tapa.receiveShadow = true;
    grupo.add(tapa);
  }

  // Afuera: pasto a la izquierda, calle a la derecha.
  const largoAfuera = m.largo + 400;
  const zCentro = (m.zAtras + m.zFinal) / 2;
  const anchoAfuera = 500;
  const pasto = new THREE.Mesh(
    new THREE.PlaneGeometry(anchoAfuera, largoAfuera),
    new THREE.MeshStandardMaterial({ map: texturaSuelo('#5d6b2e', '#7b8a3a', '#4a3a22', 5), roughness: 1 })
  );
  pasto.rotation.x = -Math.PI / 2;
  pasto.position.set(-(m.mitadArriba + c.bordillo + anchoAfuera / 2), m.alto - 0.05, zCentro);
  pasto.receiveShadow = true;
  const calle = new THREE.Mesh(
    new THREE.PlaneGeometry(anchoAfuera, largoAfuera),
    new THREE.MeshStandardMaterial({ map: texturaSuelo('#3d3d3b', '#55554f', '#2a2a28', 6), roughness: 0.95 })
  );
  calle.rotation.x = -Math.PI / 2;
  calle.position.set(m.mitadArriba + c.bordillo + anchoAfuera / 2, m.alto - 0.05, zCentro);
  calle.receiveShadow = true;
  grupo.add(pasto, calle, crearZacateOrilla(m, c.bordillo, largoAfuera, zCentro));

  // Cerca de madera del lado del pasto.
  const cerca = crearCerca();
  cerca.rotation.y = Math.PI / 2;
  cerca.position.set(180, m.alto, zCentro);
  cerca.scale.set(1.4, 1, 1);
  grupo.add(cerca);

  // Tiza: línea de salida y meta.
  grupo.add(marcaTiza('SALIDA', 0, m), marcaTiza('META', m.zMeta, m));

  escena.add(grupo);
  const suelo = crearSueloCano(fisica);

  return {
    activar(si) {
      grupo.visible = si;
      for (const s of suelo) s.setEnabled(si);
    },
  };
}

// Corte transversal del caño: un bloque de concreto con la U adentro.
function formaPerfil(m, bordillo) {
  const exterior = m.mitadArriba + bordillo;
  const forma = new THREE.Shape();
  forma.moveTo(-exterior, m.alto);
  forma.lineTo(-exterior, -FONDO_LOSA);
  forma.lineTo(exterior, -FONDO_LOSA);
  forma.lineTo(exterior, m.alto);
  const arco = paredDerecha();
  for (let i = arco.length - 1; i >= 0; i--) forma.lineTo(arco[i].x, arco[i].y);
  for (let i = 0; i < arco.length; i++) forma.lineTo(-arco[i].x, arco[i].y);
  forma.closePath();
  return forma;
}

function texturaConcreto() {
  const azar = azarFijo(31);
  const tam = 512;
  const c = document.createElement('canvas');
  c.width = c.height = tam;
  const g = c.getContext('2d');
  g.fillStyle = '#9b9a93';
  g.fillRect(0, 0, tam, tam);
  // Manchas de humedad y desgaste.
  for (let i = 0; i < 40; i++) {
    const x = azar() * tam;
    const y = azar() * tam;
    const r = 20 + azar() * 90;
    const grad = g.createRadialGradient(x, y, 0, x, y, r);
    const oscuro = azar() > 0.35;
    grad.addColorStop(0, oscuro ? 'rgba(60,62,52,0.28)' : 'rgba(200,198,188,0.25)');
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = grad;
    g.fillRect(x - r, y - r, r * 2, r * 2);
  }
  // Grano del concreto.
  for (let i = 0; i < 26000; i++) {
    const v = 110 + azar() * 90;
    g.fillStyle = `rgba(${v},${v},${v * 0.95},${0.15 + azar() * 0.25})`;
    g.fillRect(azar() * tam, azar() * tam, 1 + azar() * 2, 1 + azar() * 2);
  }
  // Grietas finas.
  g.strokeStyle = 'rgba(40,40,36,0.55)';
  for (let i = 0; i < 7; i++) {
    let x = azar() * tam;
    let y = azar() * tam;
    g.lineWidth = 0.6 + azar() * 0.8;
    g.beginPath();
    g.moveTo(x, y);
    for (let k = 0; k < 12; k++) {
      x += (azar() - 0.5) * 30;
      y += azar() * 14;
      g.lineTo(x, y);
    }
    g.stroke();
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(1 / 70, 1 / 70); // un dibujo cada 70 cm
  t.anisotropy = 4;
  return t;
}

function texturaSuelo(base, claro, oscuro, semilla) {
  const azar = azarFijo(semilla);
  const tam = 512;
  const c = document.createElement('canvas');
  c.width = c.height = tam;
  const g = c.getContext('2d');
  g.fillStyle = base;
  g.fillRect(0, 0, tam, tam);
  for (let i = 0; i < 22000; i++) {
    g.fillStyle = azar() > 0.5 ? claro : oscuro;
    g.globalAlpha = 0.25 + azar() * 0.4;
    g.fillRect(azar() * tam, azar() * tam, 1 + azar() * 3, 1 + azar() * 3);
  }
  g.globalAlpha = 1;
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(8, 18);
  t.anisotropy = 4;
  return t;
}

// Hojas de zacate en la orilla del lado del pasto.
function crearZacateOrilla(m, bordillo, largo, zCentro) {
  const azar = azarFijo(77);
  const hoja = new THREE.PlaneGeometry(0.7, 1, 1, 2);
  hoja.translate(0, 0.5, 0);
  const pos = hoja.attributes.position;
  for (let i = 0; i < pos.count; i++) pos.setX(i, pos.getX(i) * (1 - pos.getY(i) * 0.9));
  const cantidad = 5000;
  const zacate = new THREE.InstancedMesh(hoja, new THREE.MeshStandardMaterial({ side: THREE.DoubleSide, roughness: 0.9 }), cantidad);
  const mat = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const color = new THREE.Color();
  const borde = m.mitadArriba + bordillo;
  for (let i = 0; i < cantidad; i++) {
    const x = -(borde + 1 + Math.pow(azar(), 1.8) * 160);
    const z = zCentro + (azar() - 0.5) * largo;
    q.setFromEuler(new THREE.Euler((azar() - 0.5) * 0.6, azar() * Math.PI, (azar() - 0.5) * 0.6));
    mat.compose(new THREE.Vector3(x, m.alto, z), q, new THREE.Vector3(1 + azar(), 3 + azar() * 9, 1));
    zacate.setMatrixAt(i, mat);
    color.setHSL(0.2 + azar() * 0.08, 0.45 + azar() * 0.2, 0.22 + azar() * 0.18);
    zacate.setColorAt(i, color);
  }
  return zacate;
}

// Una línea de tiza de lado a lado del piso, con una palabra escrita antes de la línea.
function marcaTiza(palabra, z, m) {
  const azar = azarFijo(palabra.length * 97);
  const ancho = m.mitadFondo * 2;
  const largo = 22;
  const px = 24; // píxeles por cm
  const c = document.createElement('canvas');
  c.width = Math.round(ancho * px);
  c.height = Math.round(largo * px);
  const g = c.getContext('2d');
  // La línea va arriba del dibujo (= más lejos de la salida).
  for (let i = 0; i < 1400; i++) {
    g.fillStyle = `rgba(245,242,232,${0.1 + azar() * 0.3})`;
    const t = (0.3 + azar()) * px * 0.5;
    g.fillRect(azar() * c.width, px * (1.2 + (azar() - 0.5) * 1.4), t, t);
  }
  g.fillStyle = 'rgba(245,242,232,0.85)';
  g.font = `italic 700 ${Math.round(px * 6.5)}px "Barlow Condensed", "Arial Narrow", sans-serif`;
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.fillText(palabra, c.width / 2, c.height * 0.6);
  // Borronear la letra para que parezca tiza.
  g.globalCompositeOperation = 'destination-out';
  for (let i = 0; i < 2500; i++) {
    g.fillStyle = `rgba(0,0,0,${azar() * 0.5})`;
    g.fillRect(azar() * c.width, azar() * c.height, 2, 2);
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  const marca = new THREE.Mesh(
    new THREE.PlaneGeometry(ancho, largo),
    new THREE.MeshStandardMaterial({ map: t, transparent: true, depthWrite: false, roughness: 1, polygonOffset: true, polygonOffsetFactor: -2 })
  );
  marca.rotation.x = -Math.PI / 2;
  // La línea queda justo en "z"; la palabra, del lado de la salida.
  marca.position.set(0, 0.03, z + largo / 2 - 1.2);
  marca.receiveShadow = true;
  return marca;
}
