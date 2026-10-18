// Punto de arranque: une todas las piezas y pone el juego en marcha.
import * as THREE from 'three';
import './ui/estilos.css';
import { crearEscena } from './escena.js';
import { crearFisica } from './fisica.js';
import { crearPatio } from './escenario/patio.js';
import { crearCamara } from './camara.js';
import { crearControlTiro } from './control/tiro.js';
import { crearHud } from './ui/hud.js';
import { cargarAjustesGuardados, crearPanelAjustes } from './ui/ajustes.js';
import { crearModoCirculo } from './modos/circulo.js';

async function iniciar() {
  cargarAjustesGuardados();
  const hud = crearHud();
  const lienzo = document.getElementById('lienzo');

  let mundo3d;
  try {
    mundo3d = crearEscena(lienzo);
  } catch (e) {
    hud.error('Este navegador no puede mostrar gráficos 3D (WebGL). ' + e.message);
    return;
  }
  const { renderer, escena, camara } = mundo3d;
  crearPatio(escena);

  let fisica;
  try {
    fisica = await crearFisica();
  } catch (e) {
    hud.error('No se pudo iniciar la física del juego. ' + e.message);
    return;
  }

  const controlCamara = crearCamara(camara);
  let control = null;
  const modo = crearModoCirculo({
    escena,
    fisica,
    hud,
    controlCamara,
    mostrarPunteria: (direccion, fuerza) => {
      control.mostrarPunteriaExterna(direccion, fuerza);
      hud.fuerza(direccion ? fuerza : null);
    },
  });
  crearPanelAjustes({ alCambiar: () => modo.todas.forEach((b) => b.aplicarConfig()) });

  control = crearControlTiro({
    lienzo,
    escena,
    camara,
    controlCamara,
    obtenerBolincha: () => modo.tirador,
    puedeTirar: modo.puedeTirar,
    alApuntar: (f) => hud.fuerza(f),
    alTirar: (direccion, fuerza) => modo.tirar(direccion, fuerza),
  });

  hud.alNuevaPartida(() => modo.nuevaPartida());
  hud.alCamara(() => hud.modoCamara(control.alternarModoCamara() === 'camara'));

  const reloj = new THREE.Clock();
  renderer.setAnimationLoop(() => {
    const dt = reloj.getDelta();
    fisica.avanzar(dt, (paso) => modo.todas.forEach((b) => b.aplicarRodadura(paso)));
    modo.todas.forEach((b) => b.sincronizar(dt));
    modo.actualizar(dt);
    controlCamara.actualizar(dt, modo.enfoque.posicion);
    control.actualizar();
    renderer.render(escena, camara);
  });

  modo.nuevaPartida();
  hud.listo();
}

iniciar();
