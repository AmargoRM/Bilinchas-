// Punto de arranque: une todas las piezas y pone el juego en marcha.
import * as THREE from 'three';
import './ui/estilos.css';
import { CONFIG } from './config.js';
import { crearEscena } from './escena.js';
import { crearFisica } from './fisica.js';
import { crearPatio } from './escenario/patio.js';
import { crearBolincha } from './bolincha.js';
import { crearCamara } from './camara.js';
import { crearControlTiro } from './control/tiro.js';
import { crearHud } from './ui/hud.js';
import { cargarAjustesGuardados, crearPanelAjustes } from './ui/ajustes.js';

const AYUDA_TIRO = 'Toca tu bolincha y arrastra hacia atrás para tirar';
const AYUDA_CAMARA = 'Arrastra para girar la cámara. Toca «Listo» para volver a tirar';

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

  const centro = new THREE.Vector3(0, 0, 0);
  const salida = new THREE.Vector3(0, 0, CONFIG.circulo.distanciaSalida);
  const bolincha = crearBolincha({ escena, fisica, posicion: salida });

  // Las bolinchas dentro del círculo, de colores variados.
  const colores = [
    [0x2a8fd6, 0xf2cf4a],
    [0x3fae5a, 0xd8402c],
    [0xd9eef0, 0x2a8fd6],
    [0x1f9e9a, 0xf2cf4a],
    [0x6fcf6a, 0xd8402c],
    [0x2a5fc0, 0xf3eee2],
  ];
  const enCirculo = [];
  for (let i = 0; i < CONFIG.circulo.cantidadBolinchas; i++) {
    const [colorVidrio, colorVeta] = colores[i % colores.length];
    enCirculo.push(crearBolincha({ escena, fisica, posicion: centro, colorVidrio, colorVeta }));
  }
  const todas = [bolincha, ...enCirculo];

  // Reparte las bolinchas al azar dentro del círculo, sin que se toquen.
  function acomodarCirculo() {
    const zona = CONFIG.circulo.radio * CONFIG.circulo.zonaBolinchas;
    const puestas = [];
    for (const b of enCirculo) {
      let x = 0;
      let z = 0;
      for (let intento = 0; intento < 200; intento++) {
        const a = Math.random() * Math.PI * 2;
        const r = Math.sqrt(Math.random()) * zona;
        x = Math.cos(a) * r;
        z = Math.sin(a) * r;
        if (puestas.every((p) => Math.hypot(p.x - x, p.z - z) >= CONFIG.circulo.separacionMinima)) break;
      }
      puestas.push({ x, z });
      b.colocar(x, z);
    }
  }
  acomodarCirculo();

  crearPanelAjustes({ alCambiar: () => todas.forEach((b) => b.aplicarConfig()) });
  const controlCamara = crearCamara(camara);
  controlCamara.mirarDesde(salida, centro, true);

  let estado = 'listo'; // 'listo' = se puede tirar; 'rodando' = esperando que se detenga
  let tiempoQuieta = 0;

  const control = crearControlTiro({
    lienzo,
    escena,
    camara,
    controlCamara,
    bolincha,
    puedeTirar: () => estado === 'listo',
    alApuntar: (f) => {
      hud.fuerza(f);
      if (f !== null) hud.ayuda(null);
      else if (estado === 'listo' && control.modo === 'apuntar') hud.ayuda(AYUDA_TIRO);
    },
    alTirar: (direccion, fuerza) => {
      bolincha.tirar(direccion, fuerza);
      estado = 'rodando';
      tiempoQuieta = 0;
      hud.ayuda(null);
    },
  });

  function reiniciar() {
    bolincha.colocar(salida.x, salida.z);
    acomodarCirculo();
    estado = 'listo';
    controlCamara.mirarDesde(salida, centro);
    if (control.modo === 'apuntar') hud.ayuda(AYUDA_TIRO);
  }

  hud.alReiniciar(reiniciar);
  hud.alCamara(() => {
    const modo = control.alternarModoCamara();
    hud.modoCamara(modo === 'camara');
    hud.ayuda(modo === 'camara' ? AYUDA_CAMARA : estado === 'listo' ? AYUDA_TIRO : null);
  });

  const reloj = new THREE.Clock();
  renderer.setAnimationLoop(() => {
    const dt = reloj.getDelta();
    fisica.avanzar(dt, (paso) => todas.forEach((b) => b.aplicarRodadura(paso)));
    todas.forEach((b) => b.sincronizar(dt));

    // Las del círculo que se salieron del patio desaparecen.
    for (const b of enCirculo) {
      const p = b.posicion;
      if (b.grupo.visible && (p.y < -20 || Math.abs(p.x) > 280 || Math.abs(p.z) > 280)) b.quitar();
    }

    const pos = bolincha.posicion;
    if (estado === 'rodando') {
      // Se puede volver a tirar cuando TODAS las bolinchas se detuvieron.
      let quietas = true;
      for (const b of todas) if (!b.frenarSiCasiQuieta()) quietas = false;
      if (quietas) {
        tiempoQuieta += dt;
        if (tiempoQuieta > 0.3) {
          estado = 'listo';
          // Si quedó fuera del círculo, la cámara se gira para mirar al centro.
          if (Math.hypot(pos.x, pos.z) > CONFIG.circulo.radio * 0.5) controlCamara.mirarDesde(pos, centro);
          if (control.modo === 'apuntar') hud.ayuda(AYUDA_TIRO);
        }
      } else {
        tiempoQuieta = 0;
      }
    }

    // Si tu bolincha se fue del patio o se cayó, vuelve a la salida.
    if (pos.y < -20 || Math.abs(pos.x) > 280 || Math.abs(pos.z) > 280) bolincha.colocar(salida.x, salida.z);

    controlCamara.actualizar(dt, pos);
    control.actualizar();
    renderer.render(escena, camara);
  });

  hud.ayuda(AYUDA_TIRO);
  hud.listo();
}

iniciar();
