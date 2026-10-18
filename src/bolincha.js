// Una bolincha: la esfera de vidrio que se ve y su cuerpo en la física.
// En la etapa 6 se cambia el aspecto por el "ojo de gato" completo.
import * as THREE from 'three';
import { CONFIG } from './config.js';

// Formas compartidas entre todas las bolinchas del mismo tamaño (ahorra memoria).
const formas = new Map();
function formasPara(radio) {
  if (!formas.has(radio)) {
    formas.set(radio, {
      vidrio: new THREE.SphereGeometry(radio, 48, 32),
      veta: new THREE.SphereGeometry(radio * 0.62, 24, 12),
    });
  }
  return formas.get(radio);
}

export function crearBolincha({ escena, fisica, posicion, tipo = 'normal', colorVidrio = 0x2fb7b0, colorVeta = 0xd8402c }) {
  const { RAPIER, mundo } = fisica;
  const datos = CONFIG.bolinchas[tipo];
  const radio = datos.diametro / 2;
  const forma = formasPara(radio);

  // --- Aspecto ---
  const grupo = new THREE.Group();
  const vidrio = new THREE.Mesh(
    forma.vidrio,
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
    forma.veta,
    new THREE.MeshStandardMaterial({ color: colorVeta, roughness: 0.35, emissive: colorVeta, emissiveIntensity: 0.15 })
  );
  veta.scale.set(1, 0.18, 0.55);
  veta.rotation.set(0.3, 0, 0.5);
  grupo.add(veta);
  escena.add(grupo);

  // --- Cuerpo físico ---
  const cuerpo = mundo.createRigidBody(
    RAPIER.RigidBodyDesc.dynamic()
      .setTranslation(posicion.x, radio, posicion.z)
      .setCcdEnabled(true) // evita que atraviese otras bolinchas en tiros fuertes
      .setCanSleep(true)
      // El giro no lo calcula la física (ver fisica.js): se dibuja en sincronizar().
      .lockRotations()
  );
  const colisionador = mundo.createCollider(RAPIER.ColliderDesc.ball(radio).setMass(datos.peso), cuerpo);

  let superficie = 'tierra';
  const tmp = new THREE.Vector3();
  const eje = new THREE.Vector3();
  const giro = new THREE.Quaternion();

  const bolincha = {
    radio,
    grupo,
    cuerpo,

    // Vuelve a leer los valores de CONFIG (se llama cuando se mueven los ajustes).
    aplicarConfig() {
      const s = CONFIG.superficies[superficie];
      colisionador.setRestitution(CONFIG.bolinchas.rebote);
      colisionador.setFriction(CONFIG.bolinchas.agarre);
      cuerpo.setLinearDamping(s.frenado);
    },

    usarSuperficie(nombre) {
      superficie = nombre;
      bolincha.aplicarConfig();
    },

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
      cuerpo.setEnabled(true);
      grupo.visible = true;
      cuerpo.setTranslation({ x, y: radio, z }, true);
      cuerpo.setLinvel({ x: 0, y: 0, z: 0 }, true);
    },

    // Resistencia de la tierra al rodar: le quita una cantidad fija de velocidad
    // por segundo, así frena parejo y se detiene en vez de arrastrarse sin fin.
    aplicarRodadura(dt) {
      if (!cuerpo.isEnabled() || cuerpo.isSleeping()) return;
      if (cuerpo.translation().y > radio + 0.15) return; // en el aire no hay roce con el suelo
      const v = cuerpo.linvel();
      const rapidez = Math.hypot(v.x, v.z);
      if (rapidez < 1e-6) return;
      const freno = CONFIG.superficies[superficie].resistenciaRodadura * CONFIG.gravedad * dt;
      const k = Math.max(rapidez - freno, 0) / rapidez;
      cuerpo.setLinvel({ x: v.x * k, y: v.y, z: v.z * k }, false);
    },

    // Frena del todo cuando ya casi no se mueve. Devuelve true si está quieta.
    frenarSiCasiQuieta() {
      if (!cuerpo.isEnabled() || cuerpo.isSleeping()) return true;
      if (bolincha.velocidad() < CONFIG.velocidadParada && cuerpo.translation().y < radio + 0.05) {
        // Solo se frena; no se duerme a la fuerza. Si se duerme mientras toca otra
        // bolincha despierta, Rapier la sigue moviendo sin el suelo y se hunde.
        cuerpo.setLinvel({ x: 0, y: 0, z: 0 }, false);
        return true;
      }
      return false;
    },

    // Saca la bolincha del juego (por ejemplo, si se cayó fuera del patio).
    quitar() {
      cuerpo.setEnabled(false);
      grupo.visible = false;
    },

    // Copia la posición de la física al dibujo y la hace girar como si rodara.
    sincronizar(dt) {
      const t = cuerpo.translation();
      grupo.position.set(t.x, t.y, t.z);
      const v = cuerpo.linvel();
      const rapidez = Math.hypot(v.x, v.z);
      if (rapidez > 0.01) {
        // Eje de giro: perpendicular al avance, acostado sobre el suelo.
        eje.set(v.z, 0, -v.x).divideScalar(rapidez);
        giro.setFromAxisAngle(eje, (rapidez * dt) / radio);
        grupo.quaternion.premultiply(giro);
      }
    },
  };

  bolincha.aplicarConfig();
  return bolincha;
}
