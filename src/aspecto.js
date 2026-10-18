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
    const ancho = radio * 0.5 * Math.pow(Math.max(1 - t * t, 0), 0.6);
    const giro = t * 1.3;
    const y = v * ancho;
    p.setXYZ(i, t * radio * 0.84, y * Math.cos(giro), y * Math.sin(giro));
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
    materiales.set(clave, {
      vidrio: new THREE.MeshPhysicalMaterial({
        color: color.clone().lerp(new THREE.Color(0xffffff), d.claro),
        metalness: 0,
        roughness: d.esmerilado ?? 0.03,
        transmission: 1,
        thickness: radio * 2,
        ior: d.ior ?? 1.52,
        attenuationColor: color,
        attenuationDistance: radio * (3 + d.claro * 10),
        clearcoat: 1,
        clearcoatRoughness: 0.02,
        specularIntensity: 1,
        envMapIntensity: 1.5,
      }),
      petalos: d.vetas.map(
        (c) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.3, side: THREE.DoubleSide, emissive: c, emissiveIntensity: 0.12 })
      ),
    });
  }
  return materiales.get(clave);
}

// Devuelve un grupo listo para agregar a la escena.
export function crearAspecto(radio, idDiseno = 'clasica') {
  const forma = formasPara(radio);
  const mat = materialesPara(idDiseno, radio);
  const grupo = new THREE.Group();
  const vidrio = new THREE.Mesh(forma.vidrio, mat.vidrio);
  vidrio.castShadow = true;
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
