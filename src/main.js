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
import { crearModoTutorial } from './modos/tutorial.js';
import { crearExplosiones } from './efectos/explosion.js';
import { crearMenu3d } from './escenario/menu3d.js';
import { crearSonido } from './sonido.js';
import { crearProgreso } from './progreso.js';
import { crearPantallaColeccion } from './ui/coleccion.js';
import { crearPantallaRuleta, hoy } from './ui/ruleta.js';
import { crearPantallaMapas } from './ui/mapas-mundo.js';
import { leerPreferencias, guardarPreferencias } from './jugadores.js';
import { pantallaPartida } from './ui/partida.js';
import { buscarActualizacion, consultarUltimaVersion, NUMERO_VERSION } from './actualizacion.js';
import { crearInstrucciones } from './ui/instrucciones.js';
import { crearSelectorEfecto } from './ui/efecto.js';
import { crearBotonPoder } from './ui/poder.js';
import { perfilDe, multiplicador } from './habilidades.js';
import { MAPAS, MAPAS_CIRCULO } from './mapas.js';
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
  const explosiones = crearExplosiones(escena);
  let botonPoder = null;
  const efectos = {
    hueco: () => sonido.hueco(),
    victoria: () => sonido.victoria(),
    // Guías de la Práctica: dónde tocar el efecto y qué fuerza usar (null las quita).
    guiaTutorial: (guia) => {
      efecto.guia(guia?.efecto || null);
      hud.guiaFuerza(guia?.fuerza || null);
      if (guia) hud.fuerza(null);
    },
    // Vista desde arriba de un mapa entero (detrás de la tarjeta para elegir mapa); null la quita.
    vistaPrevia: (bordes) => {
      controlCamara.vistaMapa(bordes);
      escena.fog = bordes ? null : niebla;
    },
    nuevaPartida: () => {
      botonPoder?.reiniciar();
      progreso.nuevas.length = 0; // lo ganado antes ya se ofreció en su partida
    },
    explosion: (pos) => {
      sonido.explosion();
      explosiones.lanzar(pos);
      navigator.vibrate?.(120); // en el teléfono, una vibración corta
    },
  };
  const progreso = crearProgreso({
    cantidadMapas: MAPAS.length,
    // Lo que se desbloquea al llegar a cada nivel, para la tarjeta del final de la partida.
    desbloqueosDeNivel: (n) => [...MAPAS_CIRCULO, ...MAPAS].filter((m) => m.nivel === n).map((m) => `Nuevo mapa: ${m.nombre}.`),
  });
  progreso.usarNombres(Object.fromEntries(Object.entries(DISENOS).map(([id, d]) => [id, d.nombre])));
  const instrucciones = crearInstrucciones({ hud, nivel: () => progreso.nivel().numero });
  const pantallaColeccion = crearPantallaColeccion(progreso, { alBorrar: () => instrucciones.borrar() });
  // Mapas del barrio: "Jugar aquí" deja elegido ese mapa y abre su modo.
  const pantallaMapas = crearPantallaMapas({
    nivel: () => progreso.nivel().numero,
    puntos: () => progreso.estado.puntos,
    alJugar: (m) => {
      const pref = leerPreferencias();
      if (m.modo === 'cano') pref.mapa = m.id;
      else pref.mapaCirculo = m.id;
      guardarPreferencias(pref);
      modos[m.modo].elegirMapa?.(m.id);
      mostrarPantalla(null);
      usarJuego(m.modo);
    },
  });
  const pantallaRuleta = crearPantallaRuleta(progreso, {
    sonido,
    alVerColeccion: (id) => {
      mostrarPantalla('pantalla-coleccion');
      if (id) pantallaColeccion.abrir(id);
    },
  });
  // Lo que los modos necesitan del progreso.
  const delProgreso = {
    alTerminar: (resultado) => progreso.registrar(resultado),
    disenoDueno: () => progreso.estado.elegido,
    nivelJugador: () => progreso.nivel().numero,
    // La habilidad pasiva de la bolincha de la persona del Lugar 1 (o null).
    habilidadDueno: () => perfilDe(progreso.estado.elegido).idHabilidad,
    // Bolinchas ganadas en la partida, para ofrecer usarlas en la tarjeta del final.
    nuevasBolinchas: () => progreso.nuevas.map((id) => ({ id, nombre: tx(DISENOS[id].nombre) })),
    usarBolincha: (id) => progreso.elegir(id),
    instrucciones,
  };
  const controlCamara = crearCamara(camara);

  let control = null;
  const mostrarPunteria = (direccion, fuerza) => {
    control.mostrarPunteriaExterna(direccion, fuerza);
    hud.fuerza(direccion ? fuerza : null);
  };
  const modos = {
    circulo: crearModoCirculo({ escena, fisica, hud, controlCamara, patio: escenarios.circulo, mostrarPunteria, efectos, alSalir: (a) => irA(a), ...delProgreso }),
    explosivas: crearModoCirculo({
      variante: 'explosivas',
      escena,
      fisica,
      hud,
      controlCamara,
      patio: escenarios.circulo,
      mostrarPunteria,
      efectos,
      alSalir: (a) => irA(a),
      ...delProgreso,
    }),
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
  modos.tutorial = crearModoTutorial({
    escena,
    fisica,
    hud,
    controlCamara,
    patio: escenarios.circulo,
    mostrarPunteria,
    efectos,
    alSalir: (a) => irA(a),
    disenoDueno: delProgreso.disenoDueno,
  });
  const todas = Object.values(modos).flatMap((m) => m.todas);
  // En qué escenario se juega cada modo.
  const ESCENARIO_DE = { circulo: 'circulo', explosivas: 'circulo', tutorial: 'circulo', cano: 'cano' };
  crearPanelAjustes({ alCambiar: () => todas.forEach((b) => b.aplicarConfig()) });

  const efecto = crearSelectorEfecto();
  // Estadísticas y habilidad de la bolincha que usa la persona del Lugar 1.
  const perfilDueno = () => perfilDe(progreso.estado.elegido);
  // (en la Práctica, la habilidad la presta la lección)
  botonPoder = crearBotonPoder({ obtenerPoder: () => ('poderPrestado' in modo ? modo.poderPrestado : perfilDueno().habilidad) });
  let conPesoExtra = null; // { bolincha, tiempo }: el poder "Peso" dura solo ese tiro
  control = crearControlTiro({
    lienzo,
    escena,
    camara,
    controlCamara,
    obtenerBolincha: () => modo.tirador,
    obtenerEfecto: () => efecto.valor(),
    obtenerObstaculos: () => modo.obstaculosPunteria?.() || [],
    // En la Práctica la línea muestra el camino entero; en las partidas, un tramo.
    obtenerRecorridoCompleto: () => modo.recorridoCompleto === true,
    // Lo mismo que se le aplica al tiro al soltar (estadísticas de su bolincha).
    obtenerAjusteTiro: () => {
      if (!modo.turnoDelDueno || modo.usaEstadisticas === false) return { fuerza: 1, efecto: 1 };
      const { stats } = perfilDueno();
      return { fuerza: multiplicador(stats, 'fuerza'), efecto: multiplicador(stats, 'efecto') };
    },
    obtenerLargoPunteria: () => (modo.turnoDelDueno && modo.usaEstadisticas !== false ? multiplicador(perfilDueno().stats, 'punteria') : 1),
    puedeTirar: () => modo.puedeTirar(),
    alApuntar: (f) => hud.fuerza(f),
    alTirar: (direccion, fuerza) => {
      sonido.tiro(fuerza);
      let elEfecto = efecto.valor();
      let peso = 1;
      if (modo.turnoDelDueno && modo.usaEstadisticas !== false) {
        // Las estadísticas de su bolincha valen en todos sus tiros (no en la Práctica).
        const { stats } = perfilDueno();
        fuerza *= multiplicador(stats, 'fuerza');
        peso *= multiplicador(stats, 'peso');
        const m = multiplicador(stats, 'efecto');
        if (elEfecto) elEfecto = { arriba: elEfecto.arriba * m, costado: elEfecto.costado * m };
      }
      // La habilidad activa, si la preparó con el botón del rayo.
      const poder = modo.turnoDelDueno ? botonPoder.usar() : null;
      if (poder) {
        hud.aviso(`¡${poder.nombre}!`);
        if (poder.fuerza) fuerza *= poder.fuerza;
        if (poder.efecto && elEfecto) elEfecto = { arriba: elEfecto.arriba * poder.efecto, costado: elEfecto.costado * poder.efecto };
        if (poder.peso) peso *= poder.peso;
      }
      if (peso !== 1) {
        modo.tirador.cambiarPeso(peso);
        conPesoExtra = { bolincha: modo.tirador, tiempo: 0 };
      }
      modo.tirar(direccion, fuerza, elEfecto);
      if (poder?.salto) modo.tirador.saltar(poder.salto);
      efecto.reiniciar();
    },
  });

  // Vista de mapa (Caño): cámara desde arriba y un punto de color sobre cada bolincha.
  let vistaMapa = false;
  const niebla = escena.fog;
  const puntos = [];
  // Flecha que flota sobre la bolincha que tira, para saber siempre cuál es.
  const flechaTirador = (() => {
    const lienzo = document.createElement('canvas');
    lienzo.width = lienzo.height = 64;
    const g = lienzo.getContext('2d');
    g.beginPath();
    g.moveTo(10, 14);
    g.lineTo(54, 14);
    g.lineTo(32, 54);
    g.closePath();
    g.fillStyle = '#ffd23f';
    g.fill();
    g.lineWidth = 5;
    g.strokeStyle = '#1b1b1b';
    g.stroke();
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(lienzo), sizeAttenuation: false, depthTest: false }));
    s.scale.set(0.034, 0.034, 1);
    s.renderOrder = 11;
    s.visible = false;
    escena.add(s);
    return s;
  })();

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
    hud.mostrarBotonMapa(true);
    for (const [clave, m] of Object.entries(modos)) if (clave !== nombre) m.retirar();
    for (const [clave, e] of Object.entries(escenarios)) e.activar(clave === ESCENARIO_DE[nombre]);
    modo = modos[nombre];
    modo.nuevaPartida();
  }

  // ---------------- Pantallas del menú ----------------
  const pantallas = ['portada', 'menu-principal', 'pantalla-modos', 'pantalla-ajustes', 'pantalla-coleccion', 'pantalla-reglas', 'pantalla-paises', 'pantalla-privacidad', 'pantalla-ruleta', 'pantalla-mapas'];
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
      document.getElementById('ruleta-aviso').hidden = !pantallaRuleta.disponible();
    }
    if (id === 'pantalla-coleccion') pantallaColeccion.dibujar();
    if (id === 'pantalla-ruleta') pantallaRuleta.dibujar();
    if (id === 'pantalla-mapas') pantallaMapas.dibujar();
    if (id !== 'pantalla-mapas') pantallaMapas.cerrar();
    if (id === 'pantalla-reglas') {
      for (const m of ['circulo', 'cano', 'explosivas']) {
        $(`reglas-${m}`).replaceChildren(
          ...instrucciones.reglasDe(m).map((t) => {
            const li = document.createElement('li');
            li.textContent = t;
            return li;
          })
        );
      }
    }
    if (enMenu) hud.cerrarTarjeta();
    if (id !== 'pantalla-coleccion') pantallaColeccion.cerrar();
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
  // La primera vez que se abre el juego cada día, si la ruleta está libre, se va directo a ella.
  function pantallaDeEntrada() {
    // La primera vez que se abre el juego, directo a la Práctica (una sola vez).
    const CLAVE_PRACTICA = 'ojo-de-gato.practica-ofrecida';
    try {
      if (!localStorage.getItem(CLAVE_PRACTICA)) {
        localStorage.setItem(CLAVE_PRACTICA, '1');
        return 'practica';
      }
    } catch {
      // sin almacenamiento: no se fuerza
    }
    const CLAVE_RULETA = 'ojo-de-gato.ruleta-mostrada';
    let yaHoy = false;
    try {
      yaHoy = localStorage.getItem(CLAVE_RULETA) === hoy();
      localStorage.setItem(CLAVE_RULETA, hoy());
    } catch {
      // sin almacenamiento: se muestra si está libre
    }
    return !yaHoy && pantallaRuleta.disponible() ? 'pantalla-ruleta' : 'menu-principal';
  }
  // Ir a una pantalla, o a la Práctica ('practica').
  function irADestino(destino) {
    if (destino === 'practica') {
      mostrarPantalla(null);
      usarJuego('tutorial');
      return;
    }
    mostrarPantalla(destino);
  }
  $('portada').addEventListener('click', () => {
    const destino = pantallaDeEntrada();
    paisElegido() ? irADestino(destino) : elegirPais(destino);
  });
  $('menu-jugar').addEventListener('click', () => mostrarPantalla('pantalla-modos'));
  $('menu-ajustes').addEventListener('click', () => mostrarPantalla('pantalla-ajustes'));
  $('menu-reglas').addEventListener('click', () => mostrarPantalla('pantalla-reglas'));
  $('menu-coleccion').addEventListener('click', () => mostrarPantalla('pantalla-coleccion'));
  $('menu-ruleta').addEventListener('click', () => mostrarPantalla('pantalla-ruleta'));
  $('menu-mapas').addEventListener('click', () => mostrarPantalla('pantalla-mapas'));
  $('ruleta-menu').addEventListener('click', () => mostrarPantalla('menu-principal'));
  $('ajuste-privacidad').addEventListener('click', () => mostrarPantalla('pantalla-privacidad'));
  $('privacidad-volver').addEventListener('click', () => mostrarPantalla('pantalla-ajustes'));
  for (const b of document.querySelectorAll('[data-volver]')) b.addEventListener('click', () => mostrarPantalla('menu-principal'));
  // Toda la tarjeta del modo sirve para elegirlo, no solo el botón «Jugar».
  for (const tarjeta of document.querySelectorAll('.modo')) {
    tarjeta.addEventListener('click', () => {
      mostrarPantalla(null);
      usarJuego(tarjeta.dataset.modo);
    });
  }
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
          irADestino(despuesDePais);
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
  $('ajuste-version').textContent = NUMERO_VERSION ? `Versión de prueba ${NUMERO_VERSION}` : 'Versión armada a mano';
  $('ajuste-actualizar').hidden = !Capacitor.isNativePlatform(); // (en el navegador no hace falta)
  if (Capacitor.isNativePlatform()) {
    // ¿Hay un APK de prueba más nuevo? Se avisa arriba (en cualquier pantalla) y en el menú.
    // La descarga la hace el navegador del teléfono: la app NO instala nada por su cuenta
    // (eso hacía que Google Play Protect la marcara como dañina).
    const avisar = ({ numero, direccion }) => {
      $('version-lista-texto').textContent = `Hay una versión nueva (${numero}). Tú tienes la ${NUMERO_VERSION}.`;
      $('version-lista').hidden = false;
      $('aviso-version-texto').textContent = `Hay una versión nueva del juego (${numero}). Tú tienes la ${NUMERO_VERSION}.`;
      $('aviso-version-descargar').textContent = 'Descargar';
      $('aviso-version-descargar').hidden = false;
      $('aviso-version').hidden = false;
      // Capacitor abre las direcciones de afuera en el navegador del teléfono.
      const bajar = () => (window.location.href = direccion);
      $('aviso-version-descargar').onclick = bajar;
      $('version-lista-actualizar').onclick = bajar;
    };
    $('version-lista-cerrar').addEventListener('click', () => ($('version-lista').hidden = true));
    buscarActualizacion(avisar);
    // En Ajustes: buscar a mano y decir qué pasó.
    $('ajuste-actualizar').addEventListener('click', async () => {
      const nota = $('ajuste-actualizar-nota');
      nota.textContent = 'Preguntando a GitHub…';
      const r = await consultarUltimaVersion();
      if (!r) nota.textContent = 'No se pudo preguntar (¿hay internet?). Prueba otra vez en un rato.';
      else if (r.numero > NUMERO_VERSION) {
        nota.textContent = `Hay una versión nueva: la ${r.numero}. Se abre la descarga en el navegador.`;
        avisar(r);
        window.location.href = r.direccion;
      } else nota.textContent = `Tienes la más nueva (${NUMERO_VERSION}).`;
    });
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
      } else if (pantallaActual === 'pantalla-mapas' && pantallaMapas.abierta) {
        pantallaMapas.cerrar();
      } else if (pantallaActual === 'pantalla-coleccion' && pantallaColeccion.abierta) {
        pantallaColeccion.cerrar();
      } else if (pantallaActual === 'pantalla-privacidad') {
        mostrarPantalla('pantalla-ajustes');
      } else if (pantallaPartida().abierta) {
        pantallaPartida().volver();
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

  // ---------------- Sonidos de choques y rodado ----------------
  // Cada cuadro se mira cuánto cambió la velocidad de cada bolincha: un cambio
  // brusco es un choque (contra otra bolincha = vidrio; si no, pared o suelo).
  const anteriores = new Map();
  const vel = new THREE.Vector3();
  function sonidosDelCuadro() {
    // El asfalto suena como el concreto.
    const superficie = modo === modos.cano || modo.superficie === 'asfalto' ? 'concreto' : 'tierra';
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
      efecto.mostrar(false);
      botonPoder.mostrar(false);
      sonido.rodar(0, 0);
      menu3d.actualizar(dt);
      renderer.render(menu3d.escena, menu3d.camara);
      return;
    }
    fisica.avanzar(dt, (paso) => {
      modo.todas.forEach((b) => b.aplicarRodadura(paso));
      modo.alPaso?.();
    });
    modo.todas.forEach((b) => b.sincronizar(dt));
    modo.actualizar(dt);
    const foco = modo.enfoque.posicion;
    controlCamara.actualizar(dt, foco);
    const temblor = explosiones.actualizar(dt);
    if (temblor > 0) camara.position.add(new THREE.Vector3((Math.random() - 0.5) * temblor, (Math.random() - 0.5) * temblor, (Math.random() - 0.5) * temblor));
    const marcas = vistaMapa && modo.marcas ? modo.marcas() : [];
    while (puntos.length < marcas.length) puntos.push(puntoDeColor());
    puntos.forEach((s, i) => {
      s.visible = i < marcas.length;
      if (!s.visible) return;
      s.position.copy(marcas[i].pos).setY(12);
      s.material.color.set(marcas[i].color);
    });
    // La flecha sobre la que tira (salta un poco para llamar la atención).
    const tira = modo.tirador;
    flechaTirador.visible = modo.puedeTirar() || modo.apuntaComputadora;
    if (flechaTirador.visible) {
      const p = tira.posicion;
      flechaTirador.position.set(p.x, p.y + tira.radio + 2.6 + Math.sin(performance.now() / 180) * 0.5, p.z);
    }
    seguirSombra(foco);
    control.actualizar();
    efecto.mostrar(modo.puedeTirar());
    botonPoder.mostrar(modo.puedeTirar() && modo.turnoDelDueno);
    // El peso extra se termina cuando la bolincha se detiene.
    if (conPesoExtra) {
      conPesoExtra.tiempo += dt;
      if (conPesoExtra.tiempo > 0.5 && conPesoExtra.bolincha.velocidad() < 1) {
        conPesoExtra.bolincha.cambiarPeso(1);
        conPesoExtra = null;
      }
    }
    sonidosDelCuadro();
    renderer.render(escena, camara);
  });

  escenarios.cano.activar(false);
  modos.cano.retirar();
  modos.explosivas.retirar();
  modos.tutorial.retirar();
  mostrarPantalla('portada');
  hud.listo();
}

iniciar();
