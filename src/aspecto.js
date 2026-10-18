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
    materiales.set(clave, {
      vidrio: new THREE.MeshPhysicalMaterial({
        color: color.clone().lerp(new THREE.Color(0xffffff), d.claro),
        metalness: 0,
        roughness: 0.03,
        transmission: 1,
        thickness: radio * 2,
        ior: 1.52,
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
