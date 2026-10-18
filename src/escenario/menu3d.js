// Escena del menú: una bolsa de malla llena de bolinchas sobre la tierra,
// con bolinchas sueltas alrededor. La cámara gira despacio.
import * as THREE from 'three';
import { crearAspecto } from '../aspecto.js';
import { DISENOS } from '../disenos.js';
import { CONFIG } from '../config.js';
import { azarFijo, crearTierra, crearTiza, crearCerca } from './patio.js';

export function crearMenu3d({ entorno, fondo }) {
  const escena = new THREE.Scene();
  escena.background = fondo;
  escena.fog = new THREE.Fog(0xd8c9a8, 120, 420);
  escena.environment = entorno;
  const camara = new THREE.PerspectiveCamera(42, 1, 0.5, 600);

  const sol = new THREE.DirectionalLight(0xffd2a0, 3.4);
  sol.position.set(-30, 40, -20);
  sol.castShadow = true;
  sol.shadow.mapSize.set(1024, 1024);
  Object.assign(sol.shadow.camera, { left: -30, right: 30, top: 30, bottom: -30, near: 5, far: 120 });
  sol.shadow.normalBias = 0.05;
  escena.add(sol, new THREE.HemisphereLight(0xcfe3ff, 0x7a3e22, 0.8));

  escena.add(crearTierra());
  // Cerca de madera alrededor, como en el patio.
  for (const giro of [0, Math.PI / 2, Math.PI, -Math.PI / 2]) {
    const cerca = crearCerca();
    cerca.scale.set(0.5, 0.6, 0.5);
    cerca.position.set(0, 0, 0);
    const lado = new THREE.Group();
    lado.add(cerca);
    lado.rotation.y = giro;
    escena.add(lado);
  }
  const tiza = crearTiza(CONFIG.circulo.radio);
  tiza.position.set(10, 0, -12);
  escena.add(tiza);

  const azar = azarFijo(3);
  const disenos = Object.keys(DISENOS);
  const r = CONFIG.bolinchas.normal.diametro / 2;
  const rBoliche = CONFIG.bolinchas.boliche.diametro / 2;

  // --- La bolsa: forma de saco (torneada) con textura de malla ---
  const perfil = [
    [0.01, 0],
    [3.5, 0.3],
    [6.2, 2.2],
    [7.0, 5],
    [6.4, 8.5],
    [4.2, 11.2],
    [1.6, 13],
    [1.1, 13.8],
    [1.9, 15.2],
    [2.6, 16],
  ].map(([x, y]) => new THREE.Vector2(x, y));
  const radioEn = (y) => {
    for (let i = 0; i < perfil.length - 1; i++) {
      const a = perfil[i];
      const b = perfil[i + 1];
      if (y >= a.y && y <= b.y) return a.x + ((b.x - a.x) * (y - a.y)) / (b.y - a.y || 1);
    }
    return 0;
  };
  const malla = new THREE.Mesh(
    new THREE.LatheGeometry(perfil, 48),
    new THREE.MeshStandardMaterial({ color: 0x2f7fb8, alphaMap: texturaMalla(), alphaTest: 0.5, side: THREE.DoubleSide, roughness: 0.7 })
  );
  malla.castShadow = true;
  const bolsa = new THREE.Group();
  bolsa.add(malla);
  // El nudo de arriba.
  const nudo = new THREE.Mesh(new THREE.TorusGeometry(1.25, 0.35, 8, 20), new THREE.MeshStandardMaterial({ color: 0x245f8a, roughness: 0.8 }));
  nudo.rotation.x = Math.PI / 2;
  nudo.position.y = 13.6;
  bolsa.add(nudo);

  // Bolinchas adentro de la bolsa, sin encimarse.
  const adentro = [];
  for (let intento = 0; intento < 2500 && adentro.length < 70; intento++) {
    const y = r + 0.3 + azar() * 10.5;
    const max = radioEn(y) - r - 0.25;
    if (max <= 0) continue;
    const a = azar() * Math.PI * 2;
    const d = Math.sqrt(azar()) * max;
    const p = new THREE.Vector3(Math.cos(a) * d, y, Math.sin(a) * d);
    if (adentro.some((q) => q.distanceTo(p) < r * 2.02)) continue;
    adentro.push(p);
  }
  adentro.forEach((p, i) => {
    const b = crearAspecto(r, disenos[i % disenos.length]);
    b.position.copy(p);
    b.rotation.set(azar() * 6, azar() * 6, azar() * 6);
    bolsa.add(b);
  });
  bolsa.rotation.z = 0.12;
  bolsa.position.set(0, -0.2, 0);
  escena.add(bolsa);

  // Bolinchas sueltas en la tierra, y un par de boliches.
  const sueltas = [
    [9, 3, 'normal'],
    [11.5, -2, 'normal'],
    [7, 8, 'boliche'],
    [-8, 6, 'normal'],
    [-10.5, 1, 'normal'],
    [3, 11, 'normal'],
    [14, 6, 'boliche'],
    [-4, 12, 'normal'],
    [12, -9, 'normal'],
    [6, -14, 'normal'],
  ];
  sueltas.forEach(([x, z, tipo], i) => {
    const radio = tipo === 'boliche' ? rBoliche : r;
    const b = crearAspecto(radio, disenos[(i * 3 + 1) % disenos.length]);
    b.position.set(x, radio, z);
    escena.add(b);
  });

  function ajustar(ancho, alto) {
    camara.aspect = ancho / alto;
    camara.fov = camara.aspect < 1 ? 50 : 38;
    camara.updateProjectionMatrix();
  }

  let angulo = 0.6;
  return {
    escena,
    camara,
    ajustar,
    // Gira la cámara despacio alrededor de la bolsa.
    actualizar(dt) {
      angulo += dt * 0.08;
      const distancia = camara.aspect < 1 ? 46 : 36;
      camara.position.set(Math.sin(angulo) * distancia, 14, Math.cos(angulo) * distancia);
      camara.lookAt(0, camara.aspect < 1 ? 9 : 7, 0);
    },
  };
}

// Malla de rombos: blanco = hilo, negro = hueco.
function texturaMalla() {
  const tam = 128;
  const lienzo = document.createElement('canvas');
  lienzo.width = lienzo.height = tam;
  const g = lienzo.getContext('2d');
  g.fillStyle = '#000';
  g.fillRect(0, 0, tam, tam);
  g.strokeStyle = '#fff';
  g.lineWidth = 9;
  g.beginPath();
  g.moveTo(0, 0);
  g.lineTo(tam, tam);
  g.moveTo(tam, 0);
  g.lineTo(0, tam);
  g.stroke();
  const t = new THREE.CanvasTexture(lienzo);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(22, 9);
  return t;
}
