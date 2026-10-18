// El mundo de física (Rapier): gravedad, suelo y el avance paso a paso.
import RAPIER from '@dimforge/rapier3d-compat';
import { CONFIG } from './config.js';

export async function crearFisica() {
  await RAPIER.init();

  const mundo = new RAPIER.World({ x: 0, y: -CONFIG.gravedad, z: 0 });
  mundo.timestep = CONFIG.pasoFisica;
  // Trabajamos en centímetros: 100 unidades = 1 metro.
  mundo.lengthUnit = 100;

  // Suelo de tierra: una losa plana de 6 x 6 metros.
  const tierra = CONFIG.superficies.tierra;
  mundo.createCollider(
    RAPIER.ColliderDesc.cuboid(300, 5, 300)
      .setTranslation(0, -5, 0)
      .setFriction(tierra.agarre)
      .setRestitution(tierra.rebote)
      // El rebote contra el suelo lo decide la tierra, no el vidrio.
      .setRestitutionCombineRule(RAPIER.CoefficientCombineRule.Min)
  );

  // Avanza la física al ritmo del reloj real, en pasos fijos (más estable).
  let acumulado = 0;
  function avanzar(segundos) {
    acumulado += Math.min(segundos, 0.1);
    let pasos = 0;
    while (acumulado >= CONFIG.pasoFisica && pasos < 12) {
      mundo.step();
      acumulado -= CONFIG.pasoFisica;
      pasos++;
    }
  }

  return { RAPIER, mundo, avanzar };
}
