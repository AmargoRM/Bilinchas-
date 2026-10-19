// Modo El hoyito: de 2 a 4 jugadores (personas o computadora) en el mismo teléfono.
//   1. Todos tiran desde la raya hacia el hoyito. Quien mete su bolincha "hizo hoyo".
//   2. Con hoyo se puede "matar": pegarle a la bolincha de otro lo deja fuera del juego.
//   3. Gana el último que queda.
import * as THREE from 'three';
import { CONFIG } from '../config.js';
import { planificarTiroHoyo } from '../ia/rival.js';
import { crearJugadores, bolinchasDe, resultadoParaProgreso, sentarJugadores, hayVariasPersonas, selectoresMesa, sujeto, leerPreferencias, guardarPreferencias } from '../jugadores.js';

const LIMITE_PATIO = 280; // cm: más allá, la bolincha se cayó del patio y vuelve a la raya
const DURACION_PUNTERIA = 0.9;

export function crearModoHoyito({ escena, fisica, hud, controlCamara, patio, mostrarPunteria = () => {}, efectos = {}, alSalir = () => {}, alTerminar = () => null, disenoDueno = () => null, instrucciones }) {
  const c = CONFIG.hoyito;
  const hoyo = new THREE.Vector3(0, 0, -40);
  const haciaRaya = new THREE.Vector3(0, 0, 1); // cambia de lado en cada partida
  const todos = crearJugadores({ escena, fisica });
  const todas = bolinchasDe(todos);
  const preferencias = leerPreferencias();
  let jugadores = [];
  let turno = 0;
  let fase = 'espera'; // 'apuntar' | 'computadora' | 'rodando' | 'espera' | 'fin'
  let tiempoQuieta = 0;
  let enfocada = { posicion: hoyo };
  let planComputadora = null;
  let relojComputadora = 0;
  let muertosDelTiro = []; // a quiénes les pegó el cazador en este tiro
  let cayoEnTiro = null; // quién hizo hoyo en este tiro
  let matadosDelDueno = 0;

  const vivos = () => jugadores.filter((j) => !j.muerto);
  const enJuego = (b) => b.cuerpo.isEnabled();

  function datosEscenario() {
    const raya = hoyo.clone().addScaledVector(haciaRaya, c.distanciaRaya);
    return { x: hoyo.x, z: hoyo.z, radio: c.radioHoyo, largoRaya: 70, raya: { x: raya.x, z: raya.z, angulo: Math.atan2(haciaRaya.x, haciaRaya.z) } };
  }

  function actualizarMarcador() {
    hud.marcador({
      jugadores: jugadores.map((j) => ({ nombre: j.nombre, color: j.color, valor: j.muerto ? 'Fuera' : j.cazador ? 'Con hoyo' : '—' })),
      turno: fase === 'fin' ? null : turno,
      detalle: `Quedan ${vivos().length} jugadores`,
    });
  }

  // Lugar de cada jugador sobre la raya (separados a lo largo de la raya).
  function lugarEnRaya(j) {
    const centro = hoyo.clone().addScaledVector(haciaRaya, c.distanciaRaya);
    const costado = new THREE.Vector3(haciaRaya.z, 0, -haciaRaya.x);
    const k = jugadores.indexOf(j) - (jugadores.length - 1) / 2;
    return centro.addScaledVector(costado, k * c.separacionEnRaya);
  }

  function ponerEnRaya(j) {
    const p = lugarEnRaya(j);
    j.bolincha.colocar(p.x, p.z);
    j.enCancha = true;
    j.enHoyo = false;
  }

  // Quien está dentro del hoyo sale a tirar desde el borde del hoyo.
  function sacarDelHoyo(j) {
    j.bolincha.colocar(hoyo.x, hoyo.z);
    j.enCancha = true;
    j.enHoyo = false;
  }

  function seguirTirando() {
    const j = jugadores[turno];
    if (!j.enCancha) ponerEnRaya(j);
    if (j.enHoyo) sacarDelHoyo(j);
    enfocada = j.bolincha;
    muertosDelTiro = [];
    cayoEnTiro = null;
    actualizarMarcador();
    const presas = vivos().filter((o) => o !== j && o.enCancha && !o.enHoyo);
    const mirarA = j.cazador && presas.length ? presas.reduce((m, o) => (o.bolincha.posicion.distanceTo(j.bolincha.posicion) < m.bolincha.posicion.distanceTo(j.bolincha.posicion) ? o : m)).bolincha.posicion : hoyo;

    if (j.esComputadora) {
      planComputadora = planificarTiroHoyo({
        tirador: j.bolincha.posicion.clone(),
        radioBolincha: j.bolincha.radio,
        hoyo,
        cazador: j.cazador,
        presas: presas.map((o) => o.bolincha.posicion.clone()),
        obstaculos: vivos()
          .filter((o) => o !== j && o.enCancha && !o.enHoyo)
          .map((o) => o.bolincha.posicion.clone()),
        nivel: j.nivel,
      });
      controlCamara.mirarDesde(j.bolincha.posicion, planComputadora.objetivo);
      relojComputadora = 0;
      fase = 'computadora';
      return;
    }
    controlCamara.mirarDesde(j.bolincha.posicion, mirarA.clone());
    fase = 'apuntar';
    hud.ayudaDeTiro(true);
  }

  function empezarPartida() {
    jugadores = sentarJugadores(todos, preferencias.mesa, preferencias.tamanos, disenoDueno());
    for (const j of jugadores) {
      j.cazador = false;
      j.muerto = false;
      j.enHoyo = false;
      j.enCancha = false;
    }
    matadosDelDueno = 0;
    const a = Math.random() * Math.PI * 2;
    haciaRaya.set(Math.sin(a), 0, Math.cos(a));
    patio?.ponerHoyo(datosEscenario());
    turno = Math.floor(Math.random() * jugadores.length);
    ponerEnRaya(jugadores[turno]);
    controlCamara.mirarDesde(jugadores[turno].bolincha.posicion, hoyo, true);
    hud.aviso(`Empieza ${sujeto(jugadores[turno], false)}: a la raya.`);
    seguirTirando();
  }

  const jugar = () => instrucciones.antesDeJugar('hoyito', empezarPartida);

  function nuevaPartida() {
    fase = 'espera';
    mostrarPunteria(null);
    patio?.usarMapa('patio');
    patio?.usarRadio(null);
    patio?.ponerPiedras([]);
    patio?.ponerHoyo(datosEscenario());
    const desde = hoyo.clone().addScaledVector(haciaRaya, c.distanciaRaya);
    enfocada = { posicion: desde };
    controlCamara.mirarDesde(desde, hoyo, true);
    hud.tarjeta({
      titulo: '¿Quién juega?',
      subtitulo: 'El hoyito',
      selectores: selectoresMesa(preferencias, () => guardarPreferencias(preferencias)),
      botones: [
        { texto: 'Jugar', alElegir: jugar },
        { texto: 'Cómo se juega', secundario: true, alElegir: () => instrucciones.mostrarReglas('hoyito', nuevaPartida) },
        { texto: 'Volver', secundario: true, alElegir: () => alSalir('modos') },
      ],
    });
  }

  // Durante el tiro: ¿alguien cayó al hoyo? ¿el cazador le pegó a alguien?
  function vigilar() {
    const tirador = jugadores[turno];
    for (const j of vivos()) {
      if (!j.enCancha || j.enHoyo || !enJuego(j.bolincha)) continue;
      const p = j.bolincha.posicion;
      // Cae al hoyo si pasa por encima despacio (solo quien todavía no tiene hoyo).
      if (!j.cazador && Math.hypot(p.x - hoyo.x, p.z - hoyo.z) < c.radioHoyo * 0.8 && j.bolincha.velocidad() < c.velocidadParaCaer) {
        j.bolincha.congelar(hoyo.x, -j.bolincha.radio * 0.4, hoyo.z);
        j.enHoyo = true;
        j.cazador = true;
        if (j === tirador) cayoEnTiro = j;
        efectos.hueco?.();
      }
    }
    // El cazador mata a la que toque directamente.
    if (tirador.cazador && enJuego(tirador.bolincha)) {
      const pt = tirador.bolincha.posicion;
      for (const o of vivos()) {
        if (o === tirador || o.enHoyo || !o.enCancha || muertosDelTiro.includes(o)) continue;
        const d = pt.distanceTo(o.bolincha.posicion);
        if (d < tirador.bolincha.radio + o.bolincha.radio + 0.3) muertosDelTiro.push(o);
      }
    }
  }

  function resolver() {
    const j = jugadores[turno];
    let texto = '';
    let repite = false;
    if (muertosDelTiro.length > 0) {
      for (const o of muertosDelTiro) {
        o.muerto = true;
        o.enCancha = false;
        o.bolincha.quitar();
      }
      if (j.lugar === 0) matadosDelDueno += muertosDelTiro.length;
      const nombres = muertosDelTiro.map((o) => sujeto(o, false)).join(' y ');
      texto = j.esTu ? `¡Mataste a ${nombres}!` : `¡${sujeto(j)} mató a ${nombres}!`;
      repite = true;
    } else if (cayoEnTiro === j) {
      texto = j.esTu ? '¡Hoyo! Ahora puedes matar: tira otra vez.' : `¡${sujeto(j)} hizo hoyo y vuelve a tirar!`;
      repite = true;
    }
    actualizarMarcador();

    if (vivos().length <= 1) {
      terminar(vivos()[0] || j);
      return;
    }
    if (repite) {
      hud.aviso(texto);
      seguirTirando();
      return;
    }

    // Turno del siguiente que siga vivo.
    do turno = (turno + 1) % jugadores.length;
    while (jugadores[turno].muerto);
    const siguiente = jugadores[turno];
    fase = 'espera';
    actualizarMarcador();
    const motivo = texto || (j.esTu ? 'Nada esta vez.' : `${sujeto(j)} no ${j.cazador ? 'mató a nadie' : 'hizo hoyo'}.`);
    if (!hayVariasPersonas(jugadores) || siguiente.esComputadora) {
      hud.aviso(`${motivo} ${siguiente.esTu ? 'Tu turno.' : `Turno de ${sujeto(siguiente, false)}.`}`);
      seguirTirando();
      return;
    }
    hud.tarjeta({
      titulo: `Turno de ${siguiente.nombre}`,
      color: siguiente.color,
      texto: `${motivo} Pásale el teléfono a ${siguiente.nombre}.`,
      botones: [{ texto: 'Tirar', alElegir: () => seguirTirando() }],
    });
  }

  function terminar(ganador) {
    fase = 'fin';
    efectos.victoria?.();
    mostrarPunteria(null);
    actualizarMarcador();
    const r = resultadoParaProgreso({ modo: 'hoyito', jugadores, ganador, extra: { matados: matadosDelDueno } });
    const premios = r ? alTerminar(r) || [] : [];
    let titulo;
    if (ganador.esTu) titulo = '¡Ganaste!';
    else if (ganador.nombre === 'Computadora') titulo = 'Ganó la computadora';
    else titulo = `¡Ganó ${ganador.nombre}!`;
    hud.tarjeta({
      titulo,
      color: ganador.color,
      texto: ganador.esTu ? 'Les ganaste a todos en el hoyito.' : `${sujeto(ganador)} les ganó a todos en el hoyito.`,
      lista: premios,
      botones: [
        { texto: 'Jugar otra vez', alElegir: jugar },
        { texto: 'Cambiar jugadores', secundario: true, alElegir: () => nuevaPartida() },
        { texto: 'Menú', secundario: true, alElegir: () => alSalir('menu') },
      ],
    });
  }

  function tirar(direccion, fuerza, efecto = null) {
    jugadores[turno].bolincha.tirar(direccion, fuerza, efecto);
    fase = 'rodando';
    tiempoQuieta = 0;
  }

  return {
    todas,
    nuevaPartida,
    empezarPartida,
    superficie: 'tierra',

    retirar() {
      fase = 'espera';
      mostrarPunteria(null);
      for (const b of todas) b.quitar();
      for (const j of todos) j.enCancha = false;
      patio?.ponerHoyo(null);
    },

    get tirador() {
      return (jugadores[turno] || todos[0]).bolincha;
    },

    get enfoque() {
      return enfocada;
    },

    puedeTirar: () => fase === 'apuntar',

    tirar(direccion, fuerza, efecto) {
      tirar(direccion, fuerza, efecto);
      hud.ayudaDeTiro(false);
    },

    actualizar(dt) {
      for (const j of jugadores) {
        const p = j.bolincha.posicion;
        if (j.enCancha && !j.enHoyo && enJuego(j.bolincha) && (p.y < -20 || Math.abs(p.x) > LIMITE_PATIO || Math.abs(p.z) > LIMITE_PATIO)) {
          j.bolincha.quitar();
          j.enCancha = false; // vuelve a la raya en su próximo turno
        }
      }

      if (fase === 'computadora') {
        relojComputadora += dt;
        const pensar = CONFIG.rival[jugadores[turno].nivel].pensar;
        const avance = (relojComputadora - pensar) / DURACION_PUNTERIA;
        if (avance >= 1) {
          mostrarPunteria(null);
          tirar(planComputadora.direccion, planComputadora.fuerza);
        } else if (avance > 0) {
          mostrarPunteria(planComputadora.direccion, planComputadora.fuerza * Math.min(avance * 1.25, 1));
        }
        return;
      }

      if (fase !== 'rodando') return;
      vigilar();
      let quietas = true;
      for (const b of todas) if (!b.frenarSiCasiQuieta()) quietas = false;
      tiempoQuieta = quietas ? tiempoQuieta + dt : 0;
      if (tiempoQuieta > 0.3) resolver();
    },
  };
}
