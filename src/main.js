// Punto de arranque: une todas las piezas y pone el juego en marcha.
import * as THREE from 'three';
import './ui/estilos.css';
import { crearEscena } from './escena.js';
import { crearFisica } from './fisica.js';
import { crearPatio } from './escenario/patio.js';
import { crearCano } from './escenario/cano.js';
import { crearCamara } from './camara.js';
import { crearControlTiro } from './control/tiro.js';
import { crearHud } from './ui/hud.js';
import { cargarAjustesGuardados, crearPanelAjustes } from './ui/ajustes.js';
import { crearModoCirculo } from './modos/circulo.js';
import { crearModoCano } from './modos/cano.js';

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
  const { renderer, escena, camara, seguirSombra } = mundo3d;

  let fisica;
  try {
    fisica = await crearFisica();
  } catch (e) {
    hud.error('No se pudo iniciar la física del juego. ' + e.message);
    return;
  }

  const escenarios = { circulo: crearPatio(escena, fisica), cano: crearCano(escena, fisica) };
  const controlCamara = crearCamara(camara);

  let control = null;
  const mostrarPunteria = (direccion, fuerza) => {
    control.mostrarPunteriaExterna(direccion, fuerza);
    hud.fuerza(direccion ? fuerza : null);
  };
  const modos = {
    circulo: crearModoCirculo({ escena, fisica, hud, controlCamara, mostrarPunteria }),
    cano: crearModoCano({ escena, fisica, hud, controlCamara, mostrarPunteria }),
  };
  let modo = modos.circulo;
  const todas = [...modos.circulo.todas, ...modos.cano.todas];
  crearPanelAjustes({ alCambiar: () => todas.forEach((b) => b.aplicarConfig()) });

  control = crearControlTiro({
    lienzo,
    escena,
    camara,
    controlCamara,
    obtenerBolincha: () => modo.tirador,
    puedeTirar: () => modo.puedeTirar(),
    alApuntar: (f) => hud.fuerza(f),
    alTirar: (direccion, fuerza) => modo.tirar(direccion, fuerza),
  });

  function usarJuego(nombre) {
    for (const [clave, m] of Object.entries(modos)) {
      if (clave !== nombre) m.retirar();
      escenarios[clave].activar(clave === nombre);
    }
    modo = modos[nombre];
    modo.nuevaPartida();
  }

  // Elegir juego (el menú completo llega en la etapa 6).
  function elegirJuego() {
    hud.tarjeta({
      titulo: 'Ojo de Gato',
      subtitulo: 'Bolinchas, canicas, marbles',
      pregunta: '¿A qué juegas?',
      botones: [
        { texto: 'Círculo', alElegir: () => usarJuego('circulo') },
        { texto: 'Caño', alElegir: () => usarJuego('cano') },
      ],
    });
  }

  hud.alNuevaPartida(elegirJuego);
  hud.alCamara(() => hud.modoCamara(control.alternarModoCamara() === 'camara'));

  const reloj = new THREE.Clock();
  renderer.setAnimationLoop(() => {
    const dt = reloj.getDelta();
    fisica.avanzar(dt, (paso) => modo.todas.forEach((b) => b.aplicarRodadura(paso)));
    modo.todas.forEach((b) => b.sincronizar(dt));
    modo.actualizar(dt);
    const foco = modo.enfoque.posicion;
    controlCamara.actualizar(dt, foco);
    seguirSombra(foco);
    control.actualizar();
    renderer.render(escena, camara);
  });

  // Mientras se elige el juego, de fondo se ve el patio.
  escenarios.cano.activar(false);
  modos.cano.retirar();
  elegirJuego();
  hud.listo();
}

iniciar();
