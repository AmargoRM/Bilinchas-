// Punto de arranque: une todas las piezas y pone el juego en marcha.
import * as THREE from 'three';
// Letras incluidas en la app (funcionan sin internet).
import '@fontsource/barlow-condensed/500.css';
import '@fontsource/barlow-condensed/600.css';
import '@fontsource/barlow-condensed/700-italic.css';
import '@fontsource/permanent-marker/400.css';
import './ui/estilos.css';
import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';
import { crearEscena } from './escena.js';
import { crearFisica } from './fisica.js';
import { crearPatio } from './escenario/patio.js';
import { crearCanal } from './escenario/canal.js';
import { crearCamara } from './camara.js';
import { crearControlTiro } from './control/tiro.js';
import { crearHud } from './ui/hud.js';
import { cargarAjustesGuardados, crearPanelAjustes } from './ui/ajustes.js';
import { crearModoCirculo } from './modos/circulo.js';
import { crearModoCano } from './modos/cano.js';
import { crearMenu3d } from './escenario/menu3d.js';
import { crearSonido } from './sonido.js';
import { crearProgreso } from './progreso.js';
import { crearPantallaLogros } from './ui/logros.js';
import { MAPAS } from './mapas.js';
import { DISENOS } from './disenos.js';
import { PAISES } from './paises.js';
import { tx, aplicarTextos, paisActual, paisElegido, usarPais } from './textos.js';

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

  const escenarios = { circulo: crearPatio(escena, fisica), cano: crearCanal(escena, fisica) };
  const menu3d = crearMenu3d({ entorno: escena.environment, fondo: escena.background });
  const ajustarMenu = () => menu3d.ajustar(window.innerWidth, window.innerHeight);
  ajustarMenu();
  window.addEventListener('resize', ajustarMenu);
  const sonido = crearSonido();
  // El navegador solo deja sonar después de un toque: se habilita en el primero.
  window.addEventListener('pointerdown', () => sonido.desbloquear(), { capture: true });
  const efectos = { hueco: () => sonido.hueco(), victoria: () => sonido.victoria() };
  const progreso = crearProgreso({ cantidadMapas: MAPAS.length });
  progreso.usarNombres(Object.fromEntries(Object.entries(DISENOS).map(([id, d]) => [id, d.nombre])));
  const pantallaLogros = crearPantallaLogros(progreso);
  // Lo que los modos necesitan del progreso.
  const delProgreso = {
    alTerminar: (resultado) => progreso.registrar(resultado),
    disenoDueno: () => progreso.estado.elegido,
  };
  const controlCamara = crearCamara(camara);

  let control = null;
  const mostrarPunteria = (direccion, fuerza) => {
    control.mostrarPunteriaExterna(direccion, fuerza);
    hud.fuerza(direccion ? fuerza : null);
  };
  const modos = {
    circulo: crearModoCirculo({ escena, fisica, hud, controlCamara, mostrarPunteria, efectos, alSalir: (a) => irA(a), ...delProgreso }),
    cano: crearModoCano({
      escena,
      fisica,
      hud,
      controlCamara,
      canal: escenarios.cano,
      mostrarPunteria,
      efectos,
      alSalir: (a) => irA(a),
      ...delProgreso,
    }),
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
    puedeTirar: () => modo.puedeTirar() && !vistaMapa,
    alApuntar: (f) => hud.fuerza(f),
    alTirar: (direccion, fuerza) => {
      sonido.tiro(fuerza);
      modo.tirar(direccion, fuerza);
    },
  });

  // Vista de mapa (Caño): cámara desde arriba y un punto de color sobre cada bolincha.
  let vistaMapa = false;
  const niebla = escena.fog;
  const puntos = [];
  function puntoDeColor() {
    const lienzo = document.createElement('canvas');
    lienzo.width = lienzo.height = 64;
    const g = lienzo.getContext('2d');
    g.beginPath();
    g.arc(32, 32, 26, 0, Math.PI * 2);
    g.fillStyle = '#ffffff';
    g.fill();
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(lienzo), sizeAttenuation: false, depthTest: false }));
    s.scale.set(0.045, 0.045, 1);
    s.renderOrder = 10;
    s.visible = false;
    escena.add(s);
    return s;
  }
  function mostrarMapa(si) {
    vistaMapa = si;
    controlCamara.vistaMapa(si ? modo.traza.bordes : null);
    escena.fog = si ? null : niebla;
    hud.vistaMapa(si);
    if (si) hud.fuerza(null);
  }
  hud.alMapa(() => mostrarMapa(!vistaMapa));

  function usarJuego(nombre) {
    mostrarMapa(false);
    hud.mostrarBotonMapa(nombre === 'cano');
    for (const [clave, m] of Object.entries(modos)) {
      if (clave !== nombre) m.retirar();
      escenarios[clave].activar(clave === nombre);
    }
    modo = modos[nombre];
    modo.nuevaPartida();
  }

  // ---------------- Pantallas del menú ----------------
  const pantallas = ['portada', 'menu-principal', 'pantalla-modos', 'pantalla-ajustes', 'pantalla-logros', 'pantalla-reglas', 'pantalla-paises'];
  let enMenu = true;
  let pantallaActual = 'portada';
  function mostrarPantalla(id) {
    pantallaActual = id;
    for (const p of pantallas) document.getElementById(p).hidden = p !== id;
    enMenu = id !== null;
    hud.mostrar(!enMenu);
    if (id === 'menu-principal') {
      const n = progreso.nivel();
      document.getElementById('menu-nivel').textContent = `Nivel ${n.numero} · ${n.titulo}`;
    }
    if (id === 'pantalla-logros') pantallaLogros.dibujar();
    if (enMenu) hud.cerrarTarjeta();
  }
  // Salir de una partida: a la lista de modos o al menú principal.
  function irA(destino) {
    mostrarMapa(false);
    hud.fuerza(null);
    for (const m of Object.values(modos)) m.retirar();
    mostrarPantalla(destino === 'modos' ? 'pantalla-modos' : 'menu-principal');
  }
  const $ = (id) => document.getElementById(id);
  // La primera vez se pregunta el país; después se cambia en Ajustes.
  $('portada').addEventListener('click', () => (paisElegido() ? mostrarPantalla('menu-principal') : elegirPais('menu-principal')));
  $('menu-jugar').addEventListener('click', () => mostrarPantalla('pantalla-modos'));
  $('menu-ajustes').addEventListener('click', () => mostrarPantalla('pantalla-ajustes'));
  $('menu-reglas').addEventListener('click', () => mostrarPantalla('pantalla-reglas'));
  $('menu-logros').addEventListener('click', () => mostrarPantalla('pantalla-logros'));
  for (const b of document.querySelectorAll('[data-volver]')) b.addEventListener('click', () => mostrarPantalla('menu-principal'));
  $('modo-circulo').addEventListener('click', () => {
    mostrarPantalla(null);
    usarJuego('circulo');
  });
  $('modo-cano').addEventListener('click', () => {
    mostrarPantalla(null);
    usarJuego('cano');
  });
  const botonSonido = $('ajuste-sonido');
  const mostrarSonido = () => {
    botonSonido.textContent = sonido.activo ? 'Sí' : 'No';
    botonSonido.setAttribute('aria-pressed', String(sonido.activo));
  };
  mostrarSonido();
  botonSonido.addEventListener('click', () => {
    sonido.activar(!sonido.activo);
    mostrarSonido();
  });

  // ---------------- País ----------------
  let despuesDePais = 'menu-principal';
  function mostrarPais() {
    const p = paisActual();
    $('ajuste-pais').textContent = p.nombre;
    $('ajuste-pais-nota').textContent = tx('Palabras: {bolincha}, {boliche} y {caño}.');
  }
  function elegirPais(despues) {
    despuesDePais = despues;
    $('paises-lista').replaceChildren(
      ...PAISES.map((p) => {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'boton-pais-opcion' + (paisElegido() && p === paisActual() ? ' elegido' : '');
        b.innerHTML = '<span></span><small></small>';
        b.children[0].textContent = p.nombre;
        b.children[1].textContent = `${p.bolincha} · ${p.grande}`;
        b.addEventListener('click', () => {
          usarPais(p.id);
          aplicarTextos();
          mostrarPais();
          mostrarPantalla(despuesDePais);
        });
        return b;
      })
    );
    mostrarPantalla('pantalla-paises');
  }
  $('ajuste-pais').addEventListener('click', () => elegirPais('pantalla-ajustes'));
  $('paises-volver').addEventListener('click', () => mostrarPantalla(despuesDePais));
  aplicarTextos();
  mostrarPais();

  // ---------------- Solo en la app de Android ----------------
  if (Capacitor.isNativePlatform()) {
    $('menu-salir').hidden = false;
    $('menu-salir').addEventListener('click', () => App.exitApp());
    // Flecha "atrás" del teléfono: vuelve una pantalla; en el juego pide confirmar.
    let reloj = 0;
    let apretoUnaVez = false;
    App.addListener('backButton', () => {
      if (pantallaActual === 'portada' || pantallaActual === 'menu-principal') {
        App.exitApp();
      } else if (pantallaActual === 'pantalla-paises') {
        mostrarPantalla(despuesDePais);
      } else if (enMenu) {
        mostrarPantalla('menu-principal');
      } else if (apretoUnaVez) {
        clearTimeout(reloj);
        apretoUnaVez = false;
        irA('menu');
      } else {
        apretoUnaVez = true;
        hud.aviso('Toca atrás otra vez para salir al menú.');
        reloj = setTimeout(() => (apretoUnaVez = false), 2500);
      }
    });
  }

  hud.alNuevaPartida(() => irA('menu'));
  hud.alCamara(() => hud.modoCamara(control.alternarModoCamara() === 'camara'));

  // ---------------- Sonidos de choques y rodado ----------------
  // Cada cuadro se mira cuánto cambió la velocidad de cada bolincha: un cambio
  // brusco es un choque (contra otra bolincha = vidrio; si no, pared o suelo).
  const anteriores = new Map();
  const vel = new THREE.Vector3();
  function sonidosDelCuadro() {
    const superficie = modo === modos.cano ? 'concreto' : 'tierra';
    const enJuego = modo.todas.filter((b) => b.cuerpo.isEnabled());
    const yaSonaron = new Set();
    let rodando = 0;
    for (const b of enJuego) {
      const v = b.cuerpo.linvel();
      vel.set(v.x, v.y, v.z);
      const antes = anteriores.get(b);
      if (b.posicion.y < b.radio + 0.3) rodando += Math.hypot(v.x, v.z);
      if (antes) {
        const cambio = vel.distanceTo(antes);
        if (cambio > 25 && !yaSonaron.has(b)) {
          const otra = enJuego.find((o) => o !== b && o.posicion.distanceTo(b.posicion) < o.radio + b.radio + 0.4);
          if (otra) {
            sonido.choqueVidrio(cambio / 300, b.tipo === 'boliche' || otra.tipo === 'boliche');
            yaSonaron.add(otra);
          } else if (antes.length() > 1) {
            // (si estaba quieta y sale sola, es un tiro: ya sonó el "tic")
            sonido.golpeSeco(cambio / 300, superficie);
          }
          yaSonaron.add(b);
        }
        antes.copy(vel);
      } else {
        anteriores.set(b, vel.clone());
      }
    }
    for (const b of anteriores.keys()) if (!b.cuerpo.isEnabled()) anteriores.delete(b);
    sonido.rodar(superficie === 'tierra' ? rodando : 0, superficie === 'concreto' ? rodando : 0);
  }

  const reloj = new THREE.Clock();
  renderer.setAnimationLoop(() => {
    const dt = reloj.getDelta();
    if (enMenu) {
      sonido.rodar(0, 0);
      menu3d.actualizar(dt);
      renderer.render(menu3d.escena, menu3d.camara);
      return;
    }
    fisica.avanzar(dt, (paso) => modo.todas.forEach((b) => b.aplicarRodadura(paso)));
    modo.todas.forEach((b) => b.sincronizar(dt));
    modo.actualizar(dt);
    const foco = modo.enfoque.posicion;
    controlCamara.actualizar(dt, foco);
    const marcas = vistaMapa && modo.marcas ? modo.marcas() : [];
    while (puntos.length < marcas.length) puntos.push(puntoDeColor());
    puntos.forEach((s, i) => {
      s.visible = i < marcas.length;
      if (!s.visible) return;
      s.position.copy(marcas[i].pos).setY(12);
      s.material.color.set(marcas[i].color);
    });
    seguirSombra(foco);
    control.actualizar();
    sonidosDelCuadro();
    renderer.render(escena, camara);
  });

  escenarios.cano.activar(false);
  modos.cano.retirar();
  mostrarPantalla('portada');
  hud.listo();
}

iniciar();
