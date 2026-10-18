// Escenario del Modo Caño: arma el caño de un mapa (src/mapas.js) con su física y su dibujo.
// El piso del caño está a la altura 0; el suelo de afuera, a la altura de las paredes.
// Las paredes son rectas (verticales): la bolincha rebota en ellas como en una mesa de pool.
import * as THREE from 'three';
import { CONFIG } from '../config.js';
import { azarFijo, crearCerca } from './patio.js';

// ---------------------------------------------------------------
// TRAZADO: convierte las piezas del mapa en una línea de puntos (el centro del caño)
// y calcula todo lo que el juego necesita saber del recorrido.
// ---------------------------------------------------------------
export function trazarMapa(mapa) {
  const c = CONFIG.canal;
  const mitad = c.ancho / 2;
  const puntos = [new THREE.Vector2(0, 0)]; // (x, z)
  let dir = new THREE.Vector2(0, -1); // hacia adelante
  const derechaDe = (d) => new THREE.Vector2(-d.y, d.x);
  const girar = (d, ang) => d.clone().multiplyScalar(Math.cos(ang)).add(derechaDe(d).multiplyScalar(Math.sin(ang)));
  const obstaculos = [];
  let pos = puntos[0].clone();
  let recorrido = 0;

  for (const p of mapa.piezas) {
    if (p.recta) {
      for (const o of p.obstaculos || []) {
        const [tipo, datos] = Object.entries(o)[0];
        const lugar = pos.clone().addScaledVector(dir, datos.en).addScaledVector(derechaDe(dir), datos.lado);
        obstaculos.push({ tipo, x: lugar.x, z: lugar.y, radio: datos.tamano ?? datos.radio, en: recorrido + datos.en });
      }
      pos = pos.clone().addScaledVector(dir, p.recta);
      recorrido += p.recta;
      puntos.push(pos.clone());
    } else if (p.gira) {
      const signo = p.gira === 'derecha' ? 1 : -1;
      if (!p.radio) {
        dir = girar(dir, (signo * Math.PI) / 2); // esquina cuadrada
      } else {
        // Curva: arco de 90° hecho de tramos cortos.
        const pasos = 9;
        const delta = ((signo * Math.PI) / 2) / pasos;
        const cuerda = 2 * p.radio * Math.sin(Math.abs(delta) / 2);
        for (let k = 0; k < pasos; k++) {
          dir = girar(dir, delta / 2);
          pos = pos.clone().addScaledVector(dir, cuerda);
          dir = girar(dir, delta / 2);
          recorrido += cuerda;
          puntos.push(pos.clone());
        }
      }
    }
  }

  // Largo acumulado en cada punto.
  const acumulado = [0];
  for (let i = 1; i < puntos.length; i++) acumulado.push(acumulado[i - 1] + puntos[i].distanceTo(puntos[i - 1]));
  const largo = acumulado[acumulado.length - 1];

  // Dirección de cada tramo y "inglete" de cada punto (cómo correr el borde en las esquinas).
  const dirs = [];
  for (let i = 0; i < puntos.length - 1; i++) dirs.push(puntos[i + 1].clone().sub(puntos[i]).normalize());
  function desplazado(distancia) {
    return puntos.map((p, i) => {
      const n0 = derechaDe(dirs[Math.max(i - 1, 0)]);
      const n1 = derechaDe(dirs[Math.min(i, dirs.length - 1)]);
      const suma = n0.clone().add(n1);
      const escala = distancia / (1 + n0.dot(n1));
      return p.clone().addScaledVector(suma, escala);
    });
  }

  // Borde interior del caño (para saber si algo está adentro).
  const derecha = desplazado(mitad);
  const izquierda = desplazado(-mitad);
  const poligono = [...izquierda, ...derecha.slice().reverse()];

  // Punto del centro del caño más cercano a (x, z): cuánto recorrido lleva y a qué distancia está.
  function proyectar(x, z) {
    let mejor = { s: 0, distancia: Infinity, i: 0 };
    for (let i = 0; i < dirs.length; i++) {
      const a = puntos[i];
      const d = dirs[i];
      const lar = acumulado[i + 1] - acumulado[i];
      const t = THREE.MathUtils.clamp((x - a.x) * d.x + (z - a.y) * d.y, 0, lar);
      const dist = Math.hypot(a.x + d.x * t - x, a.y + d.y * t - z);
      if (dist < mejor.distancia) mejor = { s: acumulado[i] + t, distancia: dist, i };
    }
    return mejor;
  }

  // Posición y dirección del centro del caño a "s" cm de la salida.
  function puntoEn(s) {
    s = THREE.MathUtils.clamp(s, 0, largo);
    let i = 0;
    while (i < dirs.length - 1 && acumulado[i + 1] < s) i++;
    const p = puntos[i].clone().addScaledVector(dirs[i], s - acumulado[i]);
    return { x: p.x, z: p.y, dir: dirs[i].clone() };
  }

  // ¿El punto está dentro del caño? (margen > 0 agranda el caño hacia afuera)
  const poligonos = new Map([[0, poligono]]);
  function dentro(x, z, margen = 0) {
    if (!poligonos.has(margen)) poligonos.set(margen, [...desplazado(-mitad - margen), ...desplazado(mitad + margen).reverse()]);
    const poli = poligonos.get(margen);
    let adentro = false;
    for (let i = 0, j = poli.length - 1; i < poli.length; j = i++) {
      const a = poli[i];
      const b = poli[j];
      if (a.y > z !== b.y > z && x < ((b.x - a.x) * (z - a.y)) / (b.y - a.y) + a.x) adentro = !adentro;
    }
    return adentro;
  }

  const xs = poligono.map((p) => p.x);
  const zs = poligono.map((p) => p.y);
  const bordes = { minX: Math.min(...xs), maxX: Math.max(...xs), minZ: Math.min(...zs), maxZ: Math.max(...zs) };

  return {
    mapa,
    puntos,
    dirs,
    acumulado,
    largo,
    sMeta: largo - mapa.meta,
    sSalida: c.salida,
    obstaculos,
    poligono,
    bordes,
    desplazado,
    proyectar,
    puntoEn,
    dentro,
  };
}

// ---------------------------------------------------------------
// FÍSICA: piso, paredes y piedras. (Separado del dibujo para probar sin pantalla.)
// ---------------------------------------------------------------
export function crearFisicaCanal(fisica, traza) {
  const { RAPIER } = fisica;
  const c = CONFIG.canal;
  const colisionadores = [];
  const b = traza.bordes;

  // Piso: una sola losa grande (sin uniones que hagan saltar la bolincha).
  colisionadores.push(
    fisica.crearFijo(
      RAPIER.ColliderDesc.cuboid((b.maxX - b.minX) / 2 + 200, 5, (b.maxZ - b.minZ) / 2 + 200).setTranslation(
        (b.minX + b.maxX) / 2,
        -5,
        (b.minZ + b.maxZ) / 2
      ),
      CONFIG.superficies.concreto.rebote
    )
  );

  for (const pared of paredesDe(traza)) {
    colisionadores.push(
      fisica.crearFijo(
        RAPIER.ColliderDesc.cuboid(pared.largo / 2, (c.altoPared + 1) / 2, pared.grosor / 2)
          .setTranslation(pared.x, (c.altoPared - 1) / 2, pared.z)
          .setRotation(pared.q),
        c.rebotePared
      )
    );
  }

  // Piedras: media esfera asomada del piso; hacen de rampa.
  for (const o of traza.obstaculos) {
    if (o.tipo !== 'piedra') continue;
    colisionadores.push(
      fisica.crearFijo(
        RAPIER.ColliderDesc.ball(o.radio).setTranslation(o.x, -o.radio * 0.3, o.z),
        CONFIG.superficies.concreto.rebote
      )
    );
  }
  return colisionadores;
}

// Todas las paredes como cajas: { x, z, largo, grosor, q (giro), angulo }.
function paredesDe(traza) {
  const c = CONFIG.canal;
  const t = c.grosorPared;
  const paredes = [];
  const caja = (a, bb, extraA, extraB) => {
    const d = bb.clone().sub(a);
    const largo = d.length();
    d.normalize();
    const centro = a.clone().addScaledVector(d, (largo + extraB - extraA) / 2);
    const angulo = Math.atan2(-d.y, d.x);
    const q = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), angulo);
    paredes.push({ x: centro.x, z: centro.y, largo: largo + extraA + extraB, grosor: t, angulo, q: { x: q.x, y: q.y, z: q.z, w: q.w } });
  };
  // Cuánto alargar cada caja en una unión para cerrar la esquina sin asomar hacia adentro.
  const giroEn = (i) => {
    if (i <= 0 || i >= traza.dirs.length) return 0;
    return Math.acos(THREE.MathUtils.clamp(traza.dirs[i - 1].dot(traza.dirs[i]), -1, 1));
  };
  const extra = (i) => (t / 2) * Math.tan(giroEn(i) / 2) + 0.05;
  for (const lado of [1, -1]) {
    const linea = traza.desplazado(lado * (c.ancho / 2 + t / 2));
    for (let i = 0; i < linea.length - 1; i++) caja(linea[i], linea[i + 1], i === 0 ? t / 2 : extra(i), i === linea.length - 2 ? t / 2 : extra(i + 1));
  }
  // Pared de atrás (límite: no se puede retroceder más) y pared del final.
  const atras = traza.puntoEn(0);
  const final = traza.puntoEn(traza.largo);
  for (const [p, signo] of [
    [atras, -1],
    [final, 1],
  ]) {
    const centro = new THREE.Vector2(p.x, p.z).addScaledVector(p.dir, (signo * t) / 2);
    const lado = new THREE.Vector2(-p.dir.y, p.dir.x);
    caja(
      centro.clone().addScaledVector(lado, -(c.ancho / 2 + t)),
      centro.clone().addScaledVector(lado, c.ancho / 2 + t),
      0,
      0
    );
  }
  return paredes;
}

// ---------------------------------------------------------------
// DIBUJO
// ---------------------------------------------------------------
export function crearCanal(escena, fisica) {
  let grupo = null;
  let colisionadores = [];
  let traza = null;
  let activo = false;

  const concreto = new THREE.MeshStandardMaterial({ map: texturaConcreto(), roughness: 0.92 });

  function usarMapa(mapa) {
    if (grupo) {
      escena.remove(grupo);
      grupo.traverse((o) => {
        if (o.geometry) o.geometry.dispose();
      });
    }
    for (const col of colisionadores) fisica.mundo.removeCollider(col, false);

    traza = trazarMapa(mapa);
    colisionadores = crearFisicaCanal(fisica, traza);
    grupo = dibujar(traza, concreto);
    escena.add(grupo);
    activar(activo);
    return traza;
  }

  function activar(si) {
    activo = si;
    if (grupo) grupo.visible = si;
    for (const col of colisionadores) col.setEnabled(si);
  }

  return {
    usarMapa,
    activar,
    get traza() {
      return traza;
    },
  };
}

function dibujar(traza, concreto) {
  const c = CONFIG.canal;
  const grupo = new THREE.Group();
  const b = traza.bordes;
  const cx = (b.minX + b.maxX) / 2;
  const cz = (b.minZ + b.maxZ) / 2;
  const ancho = b.maxX - b.minX + 1200;
  const largo = b.maxZ - b.minZ + 1200;

  // Piso de concreto del caño (solo se ve por la boca del caño).
  const piso = new THREE.Mesh(new THREE.PlaneGeometry(ancho, largo), concreto);
  piso.rotation.x = -Math.PI / 2;
  piso.position.set(cx, 0, cz);
  piso.receiveShadow = true;
  escalarTextura(piso.geometry, ancho / 70, largo / 70);
  grupo.add(piso);

  // Paredes de concreto.
  for (const p of paredesDe(traza)) {
    const geo = new THREE.BoxGeometry(p.largo, c.altoPared + 1 - 0.04, p.grosor);
    escalarTextura(geo, p.largo / 70, (c.altoPared + 1) / 70);
    const pared = new THREE.Mesh(geo, concreto);
    pared.position.set(p.x, (c.altoPared - 1) / 2 - 0.02, p.z);
    pared.rotation.y = p.angulo;
    pared.castShadow = true;
    pared.receiveShadow = true;
    grupo.add(pared);
  }

  // Suelo de afuera, con el hueco del caño recortado.
  const forma = new THREE.Shape([
    new THREE.Vector2(cx - ancho / 2, -(cz - largo / 2)),
    new THREE.Vector2(cx + ancho / 2, -(cz - largo / 2)),
    new THREE.Vector2(cx + ancho / 2, -(cz + largo / 2)),
    new THREE.Vector2(cx - ancho / 2, -(cz + largo / 2)),
  ]);
  forma.holes.push(new THREE.Path(traza.poligono.map((p) => new THREE.Vector2(p.x, -p.y))));
  const suelo = new THREE.Mesh(
    new THREE.ShapeGeometry(forma),
    new THREE.MeshStandardMaterial({ map: texturaSuelo('#6b6a3a', '#8a8248', '#4d3a26', 5), roughness: 1 })
  );
  suelo.rotation.x = -Math.PI / 2;
  suelo.position.y = c.altoPared + 0.02;
  suelo.receiveShadow = true;
  // Coordenadas de textura según la posición, para que el dibujo no se estire.
  const uv = suelo.geometry.attributes.uv;
  const pos = suelo.geometry.attributes.position;
  for (let i = 0; i < pos.count; i++) uv.setXY(i, pos.getX(i) / 60, pos.getY(i) / 60);
  grupo.add(suelo);

  // Juntas del concreto: líneas oscuras de lado a lado del piso.
  const materialJunta = new THREE.MeshBasicMaterial({ color: 0x3a3833, transparent: true, opacity: 0.7, depthWrite: false });
  for (let s = c.juntaCada; s < traza.largo; s += c.juntaCada) {
    const p = traza.puntoEn(s);
    const junta = new THREE.Mesh(new THREE.PlaneGeometry(c.ancho, 0.6), materialJunta);
    junta.rotation.x = -Math.PI / 2;
    junta.rotation.z = Math.atan2(-p.dir.x, -p.dir.y);
    junta.position.set(p.x, 0.02, p.z);
    grupo.add(junta);
  }

  // Piedras y huecos.
  const azar = azarFijo(41);
  for (const o of traza.obstaculos) {
    if (o.tipo === 'piedra') {
      const geo = new THREE.IcosahedronGeometry(o.radio, 1);
      const v = geo.attributes.position;
      for (let i = 0; i < v.count; i++) {
        const k = 0.85 + azar() * 0.25;
        v.setXYZ(i, v.getX(i) * k, v.getY(i) * k, v.getZ(i) * k);
      }
      geo.computeVertexNormals();
      const piedra = new THREE.Mesh(
        geo,
        new THREE.MeshStandardMaterial({ color: new THREE.Color().setHSL(0.08, 0.12, 0.35 + azar() * 0.15), roughness: 0.95, flatShading: true })
      );
      piedra.position.set(o.x, -o.radio * 0.3, o.z);
      piedra.castShadow = true;
      piedra.receiveShadow = true;
      grupo.add(piedra);
    } else {
      grupo.add(dibujoHueco(o));
    }
  }

  // Tiza: salida y meta.
  grupo.add(marcaTiza('SALIDA', traza, traza.sSalida + 2, 0), marcaTiza('META', traza, traza.sMeta, 0));

  // Zacate a los lados del caño.
  grupo.add(zacateOrillas(traza));

  // Una cerca al costado, lejos.
  const cerca = crearCerca();
  cerca.rotation.y = Math.PI / 2;
  cerca.position.set(b.minX - 250 + 430, c.altoPared, cz);
  grupo.add(cerca);

  return grupo;
}

// Un dibujo de concreto cada 70 cm, sin importar el tamaño de la pieza.
function escalarTextura(geo, repU, repV) {
  const uv = geo.attributes.uv;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * repU, uv.getY(i) * repV);
}

function dibujoHueco(o) {
  const tam = 128;
  const lienzo = document.createElement('canvas');
  lienzo.width = lienzo.height = tam;
  const g = lienzo.getContext('2d');
  const grad = g.createRadialGradient(tam / 2, tam / 2, 0, tam / 2, tam / 2, tam / 2);
  grad.addColorStop(0, 'rgba(8,6,4,1)');
  grad.addColorStop(0.62, 'rgba(20,16,12,1)');
  grad.addColorStop(0.8, 'rgba(60,54,46,0.9)');
  grad.addColorStop(1, 'rgba(60,54,46,0)');
  g.fillStyle = grad;
  g.fillRect(0, 0, tam, tam);
  const t = new THREE.CanvasTexture(lienzo);
  t.colorSpace = THREE.SRGBColorSpace;
  const hueco = new THREE.Mesh(
    new THREE.PlaneGeometry(o.radio * 2.6, o.radio * 2.6),
    new THREE.MeshBasicMaterial({ map: t, transparent: true, depthWrite: false })
  );
  hueco.rotation.x = -Math.PI / 2;
  hueco.position.set(o.x, 0.03, o.z);
  return hueco;
}

// Línea de tiza de lado a lado, con una palabra escrita del lado de la salida.
function marcaTiza(palabra, traza, s) {
  const c = CONFIG.canal;
  const azar = azarFijo(palabra.length * 97);
  const ancho = c.ancho;
  const largo = 22;
  const px = 24;
  const lienzo = document.createElement('canvas');
  lienzo.width = Math.round(ancho * px);
  lienzo.height = Math.round(largo * px);
  const g = lienzo.getContext('2d');
  for (let i = 0; i < 1600; i++) {
    g.fillStyle = `rgba(245,242,232,${0.1 + azar() * 0.3})`;
    const t = (0.3 + azar()) * px * 0.5;
    g.fillRect(azar() * lienzo.width, px * (1.2 + (azar() - 0.5) * 1.4), t, t);
  }
  g.fillStyle = 'rgba(245,242,232,0.85)';
  g.font = `italic 700 ${Math.round(px * 6)}px "Barlow Condensed", "Arial Narrow", sans-serif`;
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.fillText(palabra, lienzo.width / 2, lienzo.height * 0.6);
  g.globalCompositeOperation = 'destination-out';
  for (let i = 0; i < 2500; i++) {
    g.fillStyle = `rgba(0,0,0,${azar() * 0.5})`;
    g.fillRect(azar() * lienzo.width, azar() * lienzo.height, 2, 2);
  }
  const t = new THREE.CanvasTexture(lienzo);
  t.colorSpace = THREE.SRGBColorSpace;
  const marca = new THREE.Mesh(
    new THREE.PlaneGeometry(ancho, largo),
    new THREE.MeshStandardMaterial({ map: t, transparent: true, depthWrite: false, roughness: 1, polygonOffset: true, polygonOffsetFactor: -2 })
  );
  // La línea queda justo en "s"; la palabra, del lado de la salida.
  const p = traza.puntoEn(Math.max(s - largo / 2 + 1.2, 0));
  marca.rotation.order = 'YXZ';
  marca.rotation.y = Math.atan2(-p.dir.x, -p.dir.y);
  marca.rotation.x = -Math.PI / 2;
  marca.position.set(p.x, 0.03, p.z);
  marca.receiveShadow = true;
  return marca;
}

function zacateOrillas(traza) {
  const c = CONFIG.canal;
  const azar = azarFijo(77);
  const hoja = new THREE.PlaneGeometry(0.7, 1, 1, 2);
  hoja.translate(0, 0.5, 0);
  const pos = hoja.attributes.position;
  for (let i = 0; i < pos.count; i++) pos.setX(i, pos.getX(i) * (1 - pos.getY(i) * 0.9));
  const cantidad = 6000;
  const zacate = new THREE.InstancedMesh(hoja, new THREE.MeshStandardMaterial({ side: THREE.DoubleSide, roughness: 0.9 }), cantidad);
  const mat = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const color = new THREE.Color();
  let n = 0;
  for (let intento = 0; n < cantidad && intento < cantidad * 4; intento++) {
    const p = traza.puntoEn(azar() * traza.largo);
    const lado = azar() > 0.5 ? 1 : -1;
    const distancia = c.ancho / 2 + c.grosorPared + 2 + Math.pow(azar(), 2) * 120;
    const x = p.x - p.dir.y * distancia * lado;
    const z = p.z + p.dir.x * distancia * lado;
    if (traza.dentro(x, z, c.grosorPared + 1)) continue;
    q.setFromEuler(new THREE.Euler((azar() - 0.5) * 0.6, azar() * Math.PI, (azar() - 0.5) * 0.6));
    mat.compose(new THREE.Vector3(x, c.altoPared, z), q, new THREE.Vector3(1 + azar(), 3 + azar() * 8, 1));
    zacate.setMatrixAt(n, mat);
    color.setHSL(0.2 + azar() * 0.08, 0.45 + azar() * 0.2, 0.22 + azar() * 0.18);
    zacate.setColorAt(n, color);
    n++;
  }
  zacate.count = n;
  return zacate;
}

function texturaConcreto() {
  const azar = azarFijo(31);
  const tam = 512;
  const lienzo = document.createElement('canvas');
  lienzo.width = lienzo.height = tam;
  const g = lienzo.getContext('2d');
  g.fillStyle = '#9b9a93';
  g.fillRect(0, 0, tam, tam);
  for (let i = 0; i < 40; i++) {
    const x = azar() * tam;
    const y = azar() * tam;
    const r = 20 + azar() * 90;
    const grad = g.createRadialGradient(x, y, 0, x, y, r);
    grad.addColorStop(0, azar() > 0.35 ? 'rgba(60,62,52,0.28)' : 'rgba(200,198,188,0.25)');
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = grad;
    g.fillRect(x - r, y - r, r * 2, r * 2);
  }
  for (let i = 0; i < 26000; i++) {
    const v = 110 + azar() * 90;
    g.fillStyle = `rgba(${v},${v},${v * 0.95},${0.15 + azar() * 0.25})`;
    g.fillRect(azar() * tam, azar() * tam, 1 + azar() * 2, 1 + azar() * 2);
  }
  g.strokeStyle = 'rgba(40,40,36,0.5)';
  for (let i = 0; i < 6; i++) {
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
  const t = new THREE.CanvasTexture(lienzo);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.anisotropy = 4;
  return t;
}

function texturaSuelo(base, claro, oscuro, semilla) {
  const azar = azarFijo(semilla);
  const tam = 512;
  const lienzo = document.createElement('canvas');
  lienzo.width = lienzo.height = tam;
  const g = lienzo.getContext('2d');
  g.fillStyle = base;
  g.fillRect(0, 0, tam, tam);
  for (let i = 0; i < 22000; i++) {
    g.fillStyle = azar() > 0.5 ? claro : oscuro;
    g.globalAlpha = 0.25 + azar() * 0.4;
    g.fillRect(azar() * tam, azar() * tam, 1 + azar() * 3, 1 + azar() * 3);
  }
  g.globalAlpha = 1;
  const t = new THREE.CanvasTexture(lienzo);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.anisotropy = 4;
  return t;
}
