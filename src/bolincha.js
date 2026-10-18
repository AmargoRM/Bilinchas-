// Una bolincha: su aspecto (aspecto.js) y su cuerpo en la física.
import * as THREE from 'three';
import { CONFIG } from './config.js';
import { crearAspecto } from './aspecto.js';

// diseno: uno de src/disenos.js. aro: color del aro en el piso que marca de quién es (o null).
export function crearBolincha({ escena, fisica, posicion, tipo = 'normal', diseno = 'clasica', aro = null }) {
  const { RAPIER, mundo } = fisica;
  const datos = CONFIG.bolinchas[tipo];
  const radio = datos.diametro / 2;

  // --- Aspecto ---
  const grupo = crearAspecto(radio, diseno);
  escena.add(grupo);
  let anillo = null;
  if (aro) {
    anillo = new THREE.Mesh(
      new THREE.RingGeometry(radio * 1.25, radio * 1.65, 32).rotateX(-Math.PI / 2),
      new THREE.MeshBasicMaterial({ color: aro, transparent: true, opacity: 0.6, depthWrite: false })
    );
    escena.add(anillo);
  }

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

  // ¿Está apoyada en el suelo o en una pared (algo que no se mueve)?
  function apoyada() {
    let si = false;
    mundo.contactPairsWith(colisionador, (otro) => {
      if (si) return;
      const padre = otro.parent();
      if (padre && !padre.isFixed()) return;
      mundo.contactPair(colisionador, otro, (m) => {
        if (m.numContacts() > 0) si = true;
      });
    });
    return si;
  }
  const tmp = new THREE.Vector3();
  const eje = new THREE.Vector3();
  const giro = new THREE.Quaternion();

  const bolincha = {
    radio,
    tipo,
    peso: datos.peso,
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
      if (anillo) anillo.visible = true;
      cuerpo.setTranslation({ x, y: radio, z }, true);
      cuerpo.setLinvel({ x: 0, y: 0, z: 0 }, true);
    },

    // Resistencia de la tierra al rodar: le quita una cantidad fija de velocidad
    // por segundo, así frena parejo y se detiene en vez de arrastrarse sin fin.
    aplicarRodadura(dt) {
      if (!cuerpo.isEnabled() || cuerpo.isSleeping()) return;
      if (!apoyada()) return; // en el aire no hay roce con el suelo
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
      if (bolincha.velocidad() < CONFIG.velocidadParada && apoyada()) {
        // Solo se frena; no se duerme a la fuerza. Si se duerme mientras toca otra
        // bolincha despierta, Rapier la sigue moviendo sin el suelo y se hunde.
        cuerpo.setLinvel({ x: 0, y: 0, z: 0 }, false);
        return true;
      }
      return false;
    },

    // La deja quieta y fuera de la física, pero visible (en un hueco, o afuera del caño).
    congelar(x, y, z) {
      cuerpo.setTranslation({ x, y, z }, false);
      cuerpo.setLinvel({ x: 0, y: 0, z: 0 }, false);
      cuerpo.setEnabled(false);
      grupo.visible = true;
      if (anillo) anillo.visible = true;
    },

    // Saca la bolincha del juego (por ejemplo, si se cayó fuera del patio).
    quitar() {
      cuerpo.setEnabled(false);
      grupo.visible = false;
      if (anillo) anillo.visible = false;
    },

    // Copia la posición de la física al dibujo y la hace girar como si rodara.
    sincronizar(dt) {
      const t = cuerpo.translation();
      grupo.position.set(t.x, t.y, t.z);
      if (anillo) anillo.position.set(t.x, t.y - radio + 0.04, t.z);
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
