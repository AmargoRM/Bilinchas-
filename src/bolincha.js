// Una bolincha: la esfera de vidrio que se ve y su cuerpo en la física.
// En la etapa 6 se cambia el aspecto por el "ojo de gato" completo.
import * as THREE from 'three';
import { CONFIG } from './config.js';

export function crearBolincha({ escena, fisica, posicion, tipo = 'normal', colorVidrio = 0x2fb7b0, colorVeta = 0xd8402c }) {
  const { RAPIER, mundo } = fisica;
  const datos = CONFIG.bolinchas[tipo];
  const radio = datos.diametro / 2;

  // --- Aspecto ---
  const grupo = new THREE.Group();
  const vidrio = new THREE.Mesh(
    new THREE.SphereGeometry(radio, 48, 32),
    new THREE.MeshPhysicalMaterial({
      color: new THREE.Color(colorVidrio).lerp(new THREE.Color(0xffffff), 0.35),
      metalness: 0,
      roughness: 0.04,
      transmission: 1,
      thickness: radio * 2,
      ior: 1.5,
      attenuationColor: new THREE.Color(colorVidrio),
      attenuationDistance: radio * 5,
      clearcoat: 1,
      clearcoatRoughness: 0.02,
      specularIntensity: 1,
      envMapIntensity: 1.4,
    })
  );
  vidrio.castShadow = true;
  grupo.add(vidrio);

  // Veta provisoria dentro del vidrio (sirve también para ver cómo gira).
  const veta = new THREE.Mesh(
    new THREE.SphereGeometry(radio * 0.62, 24, 12),
    new THREE.MeshStandardMaterial({ color: colorVeta, roughness: 0.35, emissive: colorVeta, emissiveIntensity: 0.15 })
  );
  veta.scale.set(1, 0.18, 0.55);
  veta.rotation.set(0.3, 0, 0.5);
  grupo.add(veta);
  escena.add(grupo);

  // --- Cuerpo físico ---
  const desc = RAPIER.RigidBodyDesc.dynamic()
    .setTranslation(posicion.x, radio, posicion.z)
    .setCcdEnabled(true) // evita que atraviese otras bolinchas en tiros fuertes
    .setCanSleep(true);
  const cuerpo = mundo.createRigidBody(desc);
  mundo.createCollider(
    RAPIER.ColliderDesc.ball(radio)
      .setMass(datos.peso)
      .setRestitution(CONFIG.bolinchas.rebote)
      .setFriction(CONFIG.bolinchas.agarre),
    cuerpo
  );

  function usarSuperficie(nombre) {
    const s = CONFIG.superficies[nombre];
    cuerpo.setLinearDamping(s.frenado);
    cuerpo.setAngularDamping(s.frenadoGiro);
  }
  usarSuperficie('tierra');

  const tmp = new THREE.Vector3();

  return {
    radio,
    grupo,
    cuerpo,
    usarSuperficie,

    get posicion() {
      const t = cuerpo.translation();
      return tmp.set(t.x, t.y, t.z);
    },

    velocidad() {
      const v = cuerpo.linvel();
      return Math.hypot(v.x, v.y, v.z);
    },

    // Lanza la bolincha en una dirección (vector horizontal) con fuerza de 0 a 1.
    tirar(direccion, fuerza) {
      const v = CONFIG.tiro.velocidadMaxima * fuerza;
      cuerpo.wakeUp();
      cuerpo.setLinvel({ x: direccion.x * v, y: 0, z: direccion.z * v }, true);
    },

    // La deja quieta en un lugar.
    colocar(x, z) {
      cuerpo.setTranslation({ x, y: radio, z }, true);
      cuerpo.setLinvel({ x: 0, y: 0, z: 0 }, true);
      cuerpo.setAngvel({ x: 0, y: 0, z: 0 }, true);
    },

    // Frena del todo cuando ya casi no se mueve (evita que se arrastre eternamente).
    frenarSiCasiQuieta() {
      if (cuerpo.isSleeping()) return true;
      if (this.velocidad() < CONFIG.velocidadParada && cuerpo.translation().y < radio + 0.05) {
        cuerpo.setLinvel({ x: 0, y: 0, z: 0 }, false);
        cuerpo.setAngvel({ x: 0, y: 0, z: 0 }, false);
        cuerpo.sleep();
        return true;
      }
      return false;
    },

    // Copia la posición y el giro de la física al dibujo.
    sincronizar() {
      const t = cuerpo.translation();
      const r = cuerpo.rotation();
      grupo.position.set(t.x, t.y, t.z);
      grupo.quaternion.set(r.x, r.y, r.z, r.w);
    },
  };
}
