// El aspecto de una bolincha "ojo de gato": esfera de vidrio con una veta de
// tres pétalos retorcidos adentro. Solo dibujo: la física está en bolincha.js.
import * as THREE from 'three';
import { DISENOS } from './disenos.js';

// Formas compartidas entre todas las bolinchas del mismo tamaño (ahorra memoria).
const formas = new Map();
function formasPara(radio) {
  if (!formas.has(radio)) formas.set(radio, { vidrio: new THREE.SphereGeometry(radio, 40, 28), petalo: formaPetalo(radio) });
  return formas.get(radio);
}

// Un pétalo: una hoja delgada que cruza la bolincha por el centro, angosta en
// las puntas y retorcida, como la veta de una bolincha ojo de gato.
function formaPetalo(radio) {
  const geo = new THREE.PlaneGeometry(1, 1, 24, 4);
  const p = geo.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const t = p.getX(i) * 2; // de -1 a 1 a lo largo
    const v = p.getY(i); // de -0.5 a 0.5 a lo ancho
    // (ancha, para que la veta se vea igual que en el dibujo de la Colección)
    const ancho = radio * 0.85 * Math.pow(Math.max(1 - t * t, 0), 0.5);
    const giro = t * 1.3;
    const y = v * ancho;
    p.setXYZ(i, t * radio * 0.9, y * Math.cos(giro), y * Math.sin(giro));
  }
  geo.computeVertexNormals();
  return geo;
}

// Materiales compartidos por diseño y tamaño.
const materiales = new Map();
function materialesPara(idDiseno, radio) {
  const clave = idDiseno + ':' + radio;
  if (!materiales.has(clave)) {
    const d = DISENOS[idDiseno] || DISENOS.clasica;
    const color = new THREE.Color(d.vidrio);
    // Metal u opaca: una superficie brillante sin transparencia ni veta.
    if (d.metal || d.opaco) {
      materiales.set(clave, {
        vidrio: new THREE.MeshPhysicalMaterial({
          color,
          metalness: d.metal || 0,
          roughness: d.metal ? 0.22 : 0.08,
          clearcoat: 1,
          clearcoatRoughness: 0.03,
          envMapIntensity: 1.6,
        }),
        petalos: [],
      });
      return materiales.get(clave);
    }
    // Vidrio pulido con la veta pintada en la piel (como el dibujo de la Colección).
    // Antes era vidrio transparente con la veta adentro: según el color, o se veía
    // la veta o se veía el color, y la bolincha no se parecía a la elegida.
    const textura = texturaVeta(d);
    materiales.set(clave, {
      vidrio: new THREE.MeshPhysicalMaterial({
        map: textura,
        emissiveMap: textura,
        emissive: 0xffffff,
        emissiveIntensity: 0.06, // un poco de brillo propio: se ve el color aunque esté a la sombra
        metalness: 0,
        roughness: d.esmerilado ? 0.3 + d.esmerilado * 0.4 : 0.06,
        clearcoat: 1,
        clearcoatRoughness: 0.03,
        ior: d.ior ?? 1.52,
        specularIntensity: 0.6,
        envMapIntensity: 0.8,
      }),
      petalos: [],
    });
  }
  return materiales.get(clave);
}

// La piel de la bolincha: su color con tres vetas onduladas alrededor (las mismas del
// dibujo de la Colección). Una por diseño, compartida.
const texturas = new Map();
function texturaVeta(d) {
  const clave = d.vidrio + ':' + d.vetas.join(',') + ':' + d.claro;
  if (texturas.has(clave)) return texturas.get(clave);
  if (typeof document === 'undefined') return null; // (simulaciones sin pantalla)
  const lienzo = document.createElement('canvas');
  lienzo.width = 512;
  lienzo.height = 256;
  const g = lienzo.getContext('2d');
  const base = new THREE.Color(d.vidrio);
  const hsl = base.getHSL({});
  // (los muy oscuros se aclaran un poco para que se note el color)
  base.setHSL(hsl.h, hsl.s, Math.max(hsl.l, 0.16)).lerp(new THREE.Color(0xffffff), d.claro * 0.2);
  const degradado = g.createLinearGradient(0, 0, 0, 256);
  degradado.addColorStop(0, '#' + base.clone().lerp(new THREE.Color(0xffffff), 0.18).getHexString());
  degradado.addColorStop(0.5, '#' + base.getHexString());
  degradado.addColorStop(1, '#' + base.clone().multiplyScalar(0.8).getHexString());
  g.fillStyle = degradado;
  g.fillRect(0, 0, 512, 256);
  // Vetas: bandas onduladas que dan la vuelta (el borde izquierdo empalma con el derecho).
  d.vetas.forEach((c, k) => {
    g.strokeStyle = '#' + new THREE.Color(c).getHexString();
    g.lineWidth = 26;
    g.lineCap = 'round';
    g.globalAlpha = 0.95;
    g.beginPath();
    for (let x = -10; x <= 522; x += 8) {
      const y = 96 + k * 32 + Math.sin((x / 512) * Math.PI * 4 + k * 0.6) * 22;
      if (x === -10) g.moveTo(x, y);
      else g.lineTo(x, y);
    }
    g.stroke();
  });
  g.globalAlpha = 1;
  const t = new THREE.CanvasTexture(lienzo);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = THREE.RepeatWrapping;
  t.anisotropy = 8;
  texturas.set(clave, t);
  return t;
}

// Devuelve un grupo listo para agregar a la escena.
export function crearAspecto(radio, idDiseno = 'clasica') {
  const forma = formasPara(radio);
  const mat = materialesPara(idDiseno, radio);
  const grupo = new THREE.Group();
  const vidrio = new THREE.Mesh(forma.vidrio, mat.vidrio);
  vidrio.castShadow = true;
  // Cada bolincha con la veta en otra posición, para que no se vean todas iguales.
  vidrio.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
  grupo.add(vidrio);
  const veta = new THREE.Group();
  mat.petalos.forEach((m, k) => {
    const petalo = new THREE.Mesh(forma.petalo, m);
    petalo.rotation.x = (k * Math.PI) / 3; // tres pétalos repartidos
    veta.add(petalo);
  });
  // Cada bolincha con la veta en otra posición, para que no se vean todas iguales.
  veta.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
  grupo.add(veta);
  return grupo;
}

// Vista previa chica (dibujo SVG) para la colección: no usa 3D.
export function vistaPrevia(idDiseno, tamano = 56) {
  const d = DISENOS[idDiseno] || DISENOS.clasica;
  const hex = (n) => '#' + n.toString(16).padStart(6, '0');
  const base = new THREE.Color(d.vidrio);
  const claro = '#' + base.clone().lerp(new THREE.Color(0xffffff), 0.55).getHexString();
  const oscuro = '#' + base.clone().multiplyScalar(0.45).getHexString();
  const id = 'v-' + idDiseno;
  const vetas = d.vetas
    .map((c, i) => {
      const y = 42 + i * 8;
      return `<path d="M20 ${y + 6}C38 ${y - 14} 62 ${y + 14} 80 ${y - 6}" stroke="${hex(c)}" stroke-width="7" fill="none" stroke-linecap="round" opacity=".9"/>`;
    })
    .join('');
  return `<svg width="${tamano}" height="${tamano}" viewBox="0 0 100 100" aria-hidden="true"><defs><radialGradient id="${id}" cx="38%" cy="32%" r="72%"><stop offset="0" stop-color="${claro}"/><stop offset=".55" stop-color="${hex(d.vidrio)}"/><stop offset="1" stop-color="${oscuro}"/></radialGradient></defs><circle cx="50" cy="50" r="46" fill="url(#${id})"/>${vetas}<ellipse cx="36" cy="28" rx="13" ry="7" fill="#fff" opacity=".65" transform="rotate(-25 36 28)"/></svg>`;
}
