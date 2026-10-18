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
  // No tiene roce: Rapier no deja girar un objeto a más de ~94 radianes por
  // segundo, y una bolincha de 16 mm rodando a 3,5 m/s necesita unos 440.
  // Por eso el frenado del suelo lo calcula cada bolincha (aplicarRodadura)
  // y el giro que se ve se dibuja a partir de la velocidad.
  mundo.createCollider(
    RAPIER.ColliderDesc.cuboid(300, 5, 300)
      .setTranslation(0, -5, 0)
      .setFriction(0)
      .setFrictionCombineRule(RAPIER.CoefficientCombineRule.Min)
      .setRestitution(CONFIG.superficies.tierra.rebote)
      // El rebote contra el suelo lo decide la tierra, no el vidrio.
      .setRestitutionCombineRule(RAPIER.CoefficientCombineRule.Min)
  );

  // Avanza la física al ritmo del reloj real, en pasos fijos (más estable).
  let acumulado = 0;
  // "antesDePaso" se ejecuta antes de cada paso (ahí se aplica el frenado de la tierra).
  function avanzar(segundos, antesDePaso) {
    acumulado += Math.min(segundos, 0.1);
    let pasos = 0;
    while (acumulado >= CONFIG.pasoFisica && pasos < 12) {
      if (antesDePaso) antesDePaso(CONFIG.pasoFisica);
      mundo.step();
      acumulado -= CONFIG.pasoFisica;
      pasos++;
    }
  }

  return { RAPIER, mundo, avanzar };
}
