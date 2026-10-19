// Escenario "La calle" del Modo Círculo: el círculo de tiza en el asfalto,
// casas de colores a los dos lados y, al fondo, un marco de fútbol con zapatos tirados.
// Todo se dibuja por código. Medidas en cm; la calle corre a lo largo del eje Z
// (la cámara mira hacia −Z, hacia el marco).
import * as THREE from 'three';
import { azarFijo } from './patio.js';

const MEDIA_CALLE = 330; // del centro de la calle al cordón de la acera
const ACERA = 160; // ancho de la acera
const ALTO_ACERA = 15;
const FRENTE_CASAS = MEDIA_CALLE + ACERA; // donde empiezan las fachadas
const LARGO = 2600; // largo de la calle que se dibuja
const FONDO_MARCO = -620; // dónde está el marco de fútbol

export function crearCalle() {
  const grupo = new THREE.Group();
  grupo.add(crearAsfalto(), crearLineaCentral(), crearAceras(), crearCasas(), crearPostes(), crearMarco(), crearZapatosYBola());
  return grupo;
}

function lienzo(ancho, alto) {
  const c = document.createElement('canvas');
  c.width = ancho;
  c.height = alto;
  return [c, c.getContext('2d')];
}

function textura(c, repetirX = 1, repetirY = 1) {
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(repetirX, repetirY);
  t.anisotropy = 4;
  return t;
}

// ---------------------------------------------------------------
// Asfalto gastado: gris oscuro con piedrita, grietas y manchas
// ---------------------------------------------------------------
function crearAsfalto() {
  const azar = azarFijo(41);
  const tam = 1024;
  const [c, g] = lienzo(tam, tam);
  const [cr, r] = lienzo(tam, tam);
  g.fillStyle = '#46464a';
  g.fillRect(0, 0, tam, tam);
  r.fillStyle = '#808080';
  r.fillRect(0, 0, tam, tam);
  // Manchas: zonas más gastadas (claras) y de aceite (oscuras).
  for (let i = 0; i < 50; i++) {
    const x = azar() * tam;
    const y = azar() * tam;
    const rad = 30 + azar() * 140;
    const grad = g.createRadialGradient(x, y, 0, x, y, rad);
    grad.addColorStop(0, azar() > 0.35 ? 'rgba(120,118,112,0.28)' : 'rgba(20,20,24,0.35)');
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = grad;
    for (const dx of [-tam, 0, tam]) for (const dy of [-tam, 0, tam]) g.fillRect(x - rad + dx, y - rad + dy, rad * 2, rad * 2);
  }
  // Piedrita del asfalto.
  for (let i = 0; i < 90000; i++) {
    const x = azar() * tam;
    const y = azar() * tam;
    const v = azar();
    const gris = 55 + v * 75;
    g.fillStyle = `rgba(${gris},${gris},${gris + 4},${0.3 + azar() * 0.4})`;
    const t = 1 + azar() * 2.2;
    g.fillRect(x, y, t, t);
    r.fillStyle = `rgba(${v * 255},${v * 255},${v * 255},0.6)`;
    r.fillRect(x, y, t, t);
  }
  // Grietas finas.
  g.strokeStyle = 'rgba(18,18,20,0.75)';
  r.strokeStyle = '#000';
  for (let i = 0; i < 14; i++) {
    let x = azar() * tam;
    let y = azar() * tam;
    let a = azar() * Math.PI * 2;
    g.lineWidth = r.lineWidth = 1 + azar() * 1.5;
    g.beginPath();
    r.beginPath();
    g.moveTo(x, y);
    r.moveTo(x, y);
    for (let k = 0; k < 18; k++) {
      a += (azar() - 0.5) * 1.1;
      x += Math.cos(a) * 10;
      y += Math.sin(a) * 10;
      g.lineTo(x, y);
      r.lineTo(x, y);
    }
    g.stroke();
    r.stroke();
  }
  const ancho = (FRENTE_CASAS + 200) * 2;
  const suelo = new THREE.Mesh(
    new THREE.PlaneGeometry(ancho, LARGO),
    new THREE.MeshStandardMaterial({
      map: textura(c, ancho / 90, LARGO / 90),
      bumpMap: textura(cr, ancho / 90, LARGO / 90),
      bumpScale: 0.5,
      roughness: 0.95,
    })
  );
  suelo.rotation.x = -Math.PI / 2;
  suelo.receiveShadow = true;
  return suelo;
}

// Raya amarilla del centro, cortada y despintada (pasa por debajo del círculo).
function crearLineaCentral() {
  const azar = azarFijo(8);
  const [c, g] = lienzo(32, 1024);
  // Tramos pintados con pintura gastada (más transparente en algunas partes).
  for (let y = 0; y < 1024; y += 256) {
    const grad = g.createLinearGradient(0, y, 0, y + 150);
    grad.addColorStop(0, 'rgba(226,190,70,0.35)');
    grad.addColorStop(0.5, 'rgba(226,190,70,0.6)');
    grad.addColorStop(1, 'rgba(226,190,70,0.3)');
    g.fillStyle = grad;
    g.fillRect(2, y, 28, 150);
  }
  // Partes donde se borró la pintura.
  g.globalCompositeOperation = 'destination-out';
  for (let i = 0; i < 700; i++) {
    g.fillStyle = `rgba(0,0,0,${azar() * 0.6})`;
    g.beginPath();
    g.arc(azar() * 32, azar() * 1024, 1 + azar() * 4, 0, Math.PI * 2);
    g.fill();
  }
  const mapa = textura(c, 1, LARGO / 400);
  const raya = new THREE.Mesh(
    new THREE.PlaneGeometry(10, LARGO),
    new THREE.MeshStandardMaterial({ map: mapa, transparent: true, depthWrite: false, roughness: 0.9, polygonOffset: true, polygonOffsetFactor: -1 })
  );
  raya.rotation.x = -Math.PI / 2;
  raya.position.set(-2, 0.01, 0);
  raya.receiveShadow = true;
  return raya;
}

// ---------------------------------------------------------------
// Aceras de concreto con cordón
// ---------------------------------------------------------------
function texturaConcretoAcera() {
  const azar = azarFijo(13);
  const [c, g] = lienzo(256, 256);
  g.fillStyle = '#a9a59b';
  g.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 6000; i++) {
    const v = 140 + azar() * 70;
    g.fillStyle = `rgba(${v},${v * 0.97},${v * 0.9},0.35)`;
    g.fillRect(azar() * 256, azar() * 256, 2, 2);
  }
  g.strokeStyle = 'rgba(70,66,60,0.6)';
  g.lineWidth = 3;
  g.strokeRect(0, 0, 256, 256); // juntas entre losas
  return c;
}

function crearAceras() {
  const grupo = new THREE.Group();
  const material = new THREE.MeshStandardMaterial({ map: textura(texturaConcretoAcera(), 1, LARGO / ACERA), roughness: 0.95 });
  const cordon = new THREE.MeshStandardMaterial({ color: 0xc9c4b8, roughness: 0.9 });
  for (const lado of [-1, 1]) {
    const acera = new THREE.Mesh(new THREE.BoxGeometry(ACERA, ALTO_ACERA, LARGO), material);
    acera.position.set(lado * (MEDIA_CALLE + ACERA / 2), ALTO_ACERA / 2, 0);
    acera.receiveShadow = true;
    const borde = new THREE.Mesh(new THREE.BoxGeometry(10, ALTO_ACERA + 1, LARGO), cordon);
    borde.position.set(lado * (MEDIA_CALLE + 5), (ALTO_ACERA + 1) / 2, 0);
    grupo.add(acera, borde);
  }
  return grupo;
}

// ---------------------------------------------------------------
// Casas de barrio: paredes de colores, puerta, ventanas con reja y techo de zinc
// ---------------------------------------------------------------
const COLORES_CASAS = ['#e9b44c', '#6fb3a8', '#d9725a', '#f0e3c2', '#8fb7d9', '#c98bb0', '#a8c66c', '#f2a65a'];

function fachada(ancho, alto, color, azar) {
  const px = 2; // píxeles por cm
  const [c, g] = lienzo(Math.round(ancho * px), Math.round(alto * px));
  const W = c.width;
  const H = c.height;
  g.fillStyle = color;
  g.fillRect(0, 0, W, H);
  // Repello: manchitas y suciedad que sube desde el suelo.
  for (let i = 0; i < W * H * 0.02; i++) {
    g.fillStyle = `rgba(${azar() > 0.5 ? '255,255,255' : '0,0,0'},${azar() * 0.06})`;
    g.fillRect(azar() * W, azar() * H, 3, 3);
  }
  const suciedad = g.createLinearGradient(0, H, 0, H * 0.6);
  suciedad.addColorStop(0, 'rgba(60,45,30,0.35)');
  suciedad.addColorStop(1, 'rgba(60,45,30,0)');
  g.fillStyle = suciedad;
  g.fillRect(0, 0, W, H);
  // Zócalo (franja de abajo de otro color).
  g.fillStyle = 'rgba(40,40,40,0.35)';
  g.fillRect(0, H - 45 * px, W, 45 * px);

  // Puerta.
  const anchoPuerta = 95 * px;
  const altoPuerta = 215 * px;
  const xPuerta = W * (0.2 + azar() * 0.5);
  g.fillStyle = ['#5b3a22', '#2f5d8a', '#7a2e2e', '#2e6b4a'][Math.floor(azar() * 4)];
  g.fillRect(xPuerta, H - altoPuerta, anchoPuerta, altoPuerta);
  g.strokeStyle = 'rgba(0,0,0,0.35)';
  g.lineWidth = 4;
  g.strokeRect(xPuerta + 12, H - altoPuerta + 12, anchoPuerta - 24, altoPuerta * 0.42);
  g.strokeRect(xPuerta + 12, H - altoPuerta * 0.52, anchoPuerta - 24, altoPuerta * 0.42);
  g.fillStyle = '#d8c070';
  g.fillRect(xPuerta + anchoPuerta - 22, H - altoPuerta * 0.5, 8, 8);

  // Ventanas con reja a los costados de la puerta.
  const ventana = (x) => {
    const w = 120 * px;
    const h = 100 * px;
    const y = H - 210 * px;
    if (x < 10 || x + w > W - 10) return;
    g.fillStyle = '#2c3a44';
    g.fillRect(x, y, w, h);
    g.fillStyle = 'rgba(190,220,235,0.35)';
    g.fillRect(x + 6, y + 6, w / 2 - 9, h - 12);
    g.fillRect(x + w / 2 + 3, y + 6, w / 2 - 9, h - 12);
    g.strokeStyle = '#1b1b1b';
    g.lineWidth = 5;
    for (let k = 1; k < 8; k++) {
      g.beginPath();
      g.moveTo(x + (w * k) / 8, y - 6);
      g.lineTo(x + (w * k) / 8, y + h + 6);
      g.stroke();
    }
    g.strokeRect(x - 4, y - 6, w + 8, h + 12);
    g.fillStyle = 'rgba(0,0,0,0.25)';
    g.fillRect(x - 10, y + h + 8, w + 20, 10); // repisa
  };
  ventana(xPuerta - 170 * px);
  ventana(xPuerta + anchoPuerta + 50 * px);
  return c;
}

function techoZinc() {
  const [c, g] = lienzo(256, 64);
  for (let x = 0; x < 256; x++) {
    const v = 150 + Math.sin(x / 4) * 45; // ondas del zinc
    g.fillStyle = `rgb(${v},${v * 0.95},${v * 0.9})`;
    g.fillRect(x, 0, 1, 64);
  }
  // Óxido.
  const azar = azarFijo(3);
  for (let i = 0; i < 400; i++) {
    g.fillStyle = `rgba(140,70,30,${azar() * 0.3})`;
    g.fillRect(azar() * 256, azar() * 64, 4 + azar() * 10, 2 + azar() * 8);
  }
  return c;
}

function crearCasas() {
  const azar = azarFijo(77);
  const grupo = new THREE.Group();
  const zinc = new THREE.MeshStandardMaterial({ map: textura(techoZinc(), 6, 1), roughness: 0.6, metalness: 0.35, side: THREE.DoubleSide });
  for (const lado of [-1, 1]) {
    let z = 900;
    let k = lado > 0 ? 3 : 0;
    while (z > -LARGO / 2 + 200) {
      const ancho = 560 + azar() * 340; // a lo largo de la calle
      const alto = 270 + azar() * 60;
      const fondo = 600;
      const color = COLORES_CASAS[k++ % COLORES_CASAS.length];
      const liso = new THREE.MeshStandardMaterial({ color, roughness: 0.95 });
      const frente = new THREE.MeshStandardMaterial({ map: textura(fachada(ancho, alto, color, azar)), roughness: 0.95 });
      frente.map.wrapS = frente.map.wrapT = THREE.ClampToEdgeWrapping;
      // La fachada mira a la calle: cara +X para las casas de la izquierda, −X para las de la derecha.
      const caras = [liso, liso, liso, liso, liso, liso];
      caras[lado < 0 ? 0 : 1] = frente;
      const casa = new THREE.Mesh(new THREE.BoxGeometry(fondo, alto, ancho), caras);
      const zc = z - ancho / 2;
      casa.position.set(lado * (FRENTE_CASAS + fondo / 2), alto / 2, zc);
      casa.castShadow = true;
      casa.receiveShadow = true;
      grupo.add(casa);
      // Techo de zinc inclinado hacia la calle, con alero.
      const techo = new THREE.Mesh(new THREE.PlaneGeometry(fondo + 90, ancho + 30), zinc);
      techo.rotation.order = 'YXZ';
      techo.rotation.x = -Math.PI / 2;
      techo.rotation.y = 0;
      techo.rotateOnWorldAxis(new THREE.Vector3(0, 0, 1), lado * 0.18);
      techo.position.set(lado * (FRENTE_CASAS + fondo / 2 - 45), alto + 40, zc);
      techo.castShadow = true;
      grupo.add(techo);
      z -= ancho + 20 + azar() * 60; // un pasillito entre casa y casa
    }
  }
  return grupo;
}

// ---------------------------------------------------------------
// Postes de luz con cables
// ---------------------------------------------------------------
function crearPostes() {
  const grupo = new THREE.Group();
  const concreto = new THREE.MeshStandardMaterial({ color: 0x9a968c, roughness: 0.9 });
  const negro = new THREE.LineBasicMaterial({ color: 0x1a1a1a });
  const puntas = [];
  for (const z of [500, -300, -1100]) {
    const x = -(MEDIA_CALLE + 40);
    const poste = new THREE.Mesh(new THREE.CylinderGeometry(9, 13, 850, 10), concreto);
    poste.position.set(x, 425, z);
    poste.castShadow = true;
    const brazo = new THREE.Mesh(new THREE.BoxGeometry(160, 6, 8), concreto);
    brazo.position.set(x + 80, 780, z);
    const lampara = new THREE.Mesh(new THREE.BoxGeometry(45, 10, 22), new THREE.MeshStandardMaterial({ color: 0x55585c, roughness: 0.5 }));
    lampara.position.set(x + 160, 774, z);
    grupo.add(poste, brazo, lampara);
    puntas.push(new THREE.Vector3(x, 820, z));
  }
  // Cables que cuelgan de poste a poste.
  for (let i = 0; i < puntas.length - 1; i++) {
    for (const alto of [0, -25]) {
      const a = puntas[i].clone().setY(puntas[i].y + alto);
      const b = puntas[i + 1].clone().setY(puntas[i + 1].y + alto);
      const puntos = [];
      for (let t = 0; t <= 20; t++) {
        const p = a.clone().lerp(b, t / 20);
        p.y -= Math.sin((t / 20) * Math.PI) * 60;
        puntos.push(p);
      }
      grupo.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(puntos), negro));
    }
  }
  return grupo;
}

// ---------------------------------------------------------------
// Marco de fútbol (de calle: 3 m de ancho, 2 m de alto) con red
// ---------------------------------------------------------------
function texturaRed() {
  const [c, g] = lienzo(256, 256);
  g.strokeStyle = 'rgba(245,245,240,0.9)';
  g.lineWidth = 3;
  for (let i = 0; i <= 256; i += 32) {
    g.beginPath();
    g.moveTo(i, 0);
    g.lineTo(i, 256);
    g.moveTo(0, i);
    g.lineTo(256, i);
    g.stroke();
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}

function crearMarco() {
  const grupo = new THREE.Group();
  const ancho = 300;
  const alto = 200;
  const hondo = 110;
  const blanco = new THREE.MeshStandardMaterial({ color: 0xf2f2ee, roughness: 0.4, metalness: 0.2 });
  const tubo = (largo) => new THREE.CylinderGeometry(4.5, 4.5, largo, 12);
  for (const lado of [-1, 1]) {
    const palo = new THREE.Mesh(tubo(alto), blanco);
    palo.position.set((lado * ancho) / 2, alto / 2, 0);
    palo.castShadow = true;
    grupo.add(palo);
    // Patas de atrás que sostienen la red.
    const pata = new THREE.Mesh(tubo(hondo), blanco);
    pata.rotation.x = Math.PI / 2;
    pata.position.set((lado * ancho) / 2, 3, -hondo / 2);
    grupo.add(pata);
  }
  const travesano = new THREE.Mesh(tubo(ancho + 9), blanco);
  travesano.rotation.z = Math.PI / 2;
  travesano.position.set(0, alto, 0);
  travesano.castShadow = true;
  grupo.add(travesano);

  // Red: atrás (inclinada), arriba y a los costados.
  const red = (ancho2, alto2) => {
    const t = texturaRed();
    t.repeat.set(ancho2 / 14, alto2 / 14);
    return new THREE.MeshStandardMaterial({ map: t, alphaMap: t, transparent: true, alphaTest: 0.3, side: THREE.DoubleSide, depthWrite: false, roughness: 1 });
  };
  const largoAtras = Math.hypot(alto, hondo);
  const atras = new THREE.Mesh(new THREE.PlaneGeometry(ancho, largoAtras), red(ancho, largoAtras));
  atras.position.set(0, alto / 2, -hondo / 2);
  atras.rotation.x = -Math.atan2(hondo, alto);
  grupo.add(atras);
  const formaCostado = new THREE.Shape([new THREE.Vector2(0, 0), new THREE.Vector2(0, alto), new THREE.Vector2(-hondo, 0)]);
  for (const lado of [-1, 1]) {
    const geo = new THREE.ShapeGeometry(formaCostado);
    // UV por cm, para que la malla tenga el mismo tamaño que la de atrás.
    const uv = geo.attributes.uv;
    const pos = geo.attributes.position;
    for (let i = 0; i < uv.count; i++) uv.setXY(i, pos.getX(i) / 14, pos.getY(i) / 14);
    const material = red(1, 1);
    material.map.repeat.set(1, 1);
    const costado = new THREE.Mesh(geo, material);
    costado.rotation.y = Math.PI / 2;
    costado.position.set((lado * ancho) / 2, 0, 0);
    grupo.add(costado);
  }
  grupo.position.set(0, 0, FONDO_MARCO);
  return grupo;
}

// ---------------------------------------------------------------
// Zapatos tenis tirados junto al marco, y la bola
// ---------------------------------------------------------------
// Perfil de costado de un zapato tenis (cm): x = largo (talón en 0), y = alto.
function perfilZapato() {
  const s = new THREE.Shape();
  s.moveTo(0, 2.5);
  s.lineTo(0, 10);
  s.quadraticCurveTo(1, 12.5, 4, 12); // talón alto
  s.lineTo(7, 10.5); // boca del zapato
  s.quadraticCurveTo(10, 10, 12, 11);
  s.quadraticCurveTo(19, 9, 24, 6.5); // empeine
  s.quadraticCurveTo(28, 5.5, 28, 3.5);
  s.lineTo(28, 2.5);
  s.lineTo(0, 2.5);
  return s;
}

function perfilSuela() {
  const s = new THREE.Shape();
  s.moveTo(0, 0);
  s.lineTo(27, 0);
  s.quadraticCurveTo(29.5, 0.5, 29, 3);
  s.lineTo(-0.5, 3);
  s.quadraticCurveTo(-1, 1, 0, 0);
  return s;
}

function crearZapato(color) {
  const zapato = new THREE.Group();
  const ancho = 9;
  const extruir = (forma, prof, bisel) =>
    new THREE.ExtrudeGeometry(forma, { depth: prof, bevelEnabled: true, bevelThickness: bisel, bevelSize: bisel, bevelSegments: 3, curveSegments: 10 });
  const arriba = new THREE.Mesh(extruir(perfilZapato(), ancho - 3, 1.5), new THREE.MeshStandardMaterial({ color, roughness: 0.7 }));
  arriba.position.z = -(ancho - 3) / 2;
  const suela = new THREE.Mesh(extruir(perfilSuela(), ancho - 1, 0.5), new THREE.MeshStandardMaterial({ color: 0xf4f1ea, roughness: 0.8 }));
  suela.position.z = -(ancho - 1) / 2;
  zapato.add(arriba, suela);
  // Cordones: rayitas blancas sobre el empeine.
  const cordon = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.8 });
  for (let i = 0; i < 4; i++) {
    const c = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.6, ancho - 2), cordon);
    c.position.set(13 + i * 2.6, 10.6 - i * 0.9, 0);
    c.rotation.z = -0.35;
    zapato.add(c);
  }
  // La "pipa" del costado.
  const marca = new THREE.Mesh(new THREE.TorusGeometry(4, 0.5, 6, 16, Math.PI * 0.7), cordon);
  marca.position.set(12, 6.5, ancho / 2 + 0.2);
  marca.rotation.z = Math.PI * 1.1;
  const marca2 = marca.clone();
  marca2.position.z = -marca.position.z;
  zapato.add(marca, marca2);
  zapato.traverse((o) => (o.castShadow = true));
  return zapato;
}

function crearBola() {
  const [c, g] = lienzo(512, 256);
  g.fillStyle = '#f5f5f0';
  g.fillRect(0, 0, 512, 256);
  g.fillStyle = '#1d1d1d';
  const azar = azarFijo(2);
  for (let i = 0; i < 12; i++) {
    const x = (i % 6) * 86 + (Math.floor(i / 6) ? 43 : 0) + azar() * 6;
    const y = Math.floor(i / 6) * 128 + 64;
    g.beginPath();
    for (let k = 0; k < 5; k++) {
      const a = (k / 5) * Math.PI * 2 - Math.PI / 2;
      g.lineTo(x + Math.cos(a) * 22, y + Math.sin(a) * 26);
    }
    g.fill();
  }
  const bola = new THREE.Mesh(new THREE.SphereGeometry(11, 24, 16), new THREE.MeshStandardMaterial({ map: textura(c), roughness: 0.55 }));
  bola.castShadow = true;
  return bola;
}

function crearZapatosYBola() {
  const grupo = new THREE.Group();
  // Un par junto a cada palo (como cuando se juega en medias), uno caído de lado.
  const pares = [
    { color: 0xd23a2a, x: -175, z: FONDO_MARCO + 40, giro: 0.4 },
    { color: 0x2a64c8, x: 168, z: FONDO_MARCO + 55, giro: -2.3 },
  ];
  for (const p of pares) {
    const a = crearZapato(p.color);
    a.position.set(p.x, 0, p.z);
    a.rotation.y = p.giro;
    const b = crearZapato(p.color);
    b.position.set(p.x + 16, 4.5, p.z + 14);
    b.rotation.set(Math.PI / 2 - 0.15, p.giro + 0.9, 0); // tirado de costado
    grupo.add(a, b);
  }
  const bola = crearBola();
  bola.position.set(60, 11, FONDO_MARCO + 90);
  grupo.add(bola);
  return grupo;
}
