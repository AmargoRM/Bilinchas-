// Modo Caño: contra la computadora o dos jugadores en el mismo teléfono.
// Cada uno tira su bolincha por el caño para sacar la del rival, o llegar primero a la meta.
import * as THREE from 'three';
import { CONFIG } from '../config.js';
import { crearBolincha } from '../bolincha.js';
import { resolverTiroCano } from './reglas-cano.js';
import { planificarTiroCano } from '../ia/rival.js';
import { medidasCano } from '../escenario/cano.js';

const COLORES_JUGADORES = [
  { vidrio: 0x2a8fd6, veta: 0xf2cf4a, color: '#3b9be0' },
  { vidrio: 0xd8402c, veta: 0xf2cf4a, color: '#e2523d' },
];
const DURACION_PUNTERIA = 0.9; // segundos que se ve a la computadora apuntando

function frases(j) {
  if (j.esTu) {
    return {
      saco: '¡Sacaste la bolincha del rival del caño!',
      meta: '¡Llegaste a la meta!',
      teSacaste: 'Te saliste del caño: tu bolincha vuelve a donde estaba.',
      nada: 'No pasó nada.',
    };
  }
  const quien = j.esComputadora ? 'La computadora' : j.nombre;
  return {
    saco: `¡${quien} sacó la bolincha del rival del caño!`,
    meta: `¡${quien} llegó a la meta!`,
    teSacaste: `${quien} se salió del caño: su bolincha vuelve a donde estaba.`,
    nada: `${quien} no sacó a nadie.`,
  };
}

// mostrarPunteria(direccion, fuerza): dibuja la puntería de la computadora (null la oculta).
export function crearModoCano({ escena, fisica, hud, controlCamara, mostrarPunteria = () => {} }) {
  const m = medidasCano();
  const salida = new THREE.Vector3(0, 0, 0);

  const jugadores = COLORES_JUGADORES.map((c) => {
    const bolincha = crearBolincha({ escena, fisica, posicion: salida, colorVidrio: c.vidrio, colorVeta: c.veta });
    bolincha.usarSuperficie('concreto');
    bolincha.quitar();
    return { ...c, nombre: '', esTu: false, esComputadora: false, enCancha: false, antes: new THREE.Vector3(), bolincha };
  });
  const todas = jugadores.map((j) => j.bolincha);

  let rival = null; // null = dos jugadores; si no, el nivel de la computadora
  let turno = 0;
  let fase = 'espera'; // 'apuntar' | 'computadora' | 'rodando' | 'espera' | 'fin'
  let tiempoQuieta = 0;
  let enfocada = jugadores[0].bolincha;
  let planComputadora = null;
  let relojComputadora = 0;

  const enJuego = (b) => b.cuerpo.isEnabled();
  // Fuera del caño: pasó el borde de la boca, o se cayó del mundo.
  const fuera = (j) => !enJuego(j.bolincha) || Math.abs(j.bolincha.posicion.x) > m.mitadArriba;
  const enMeta = (j) => j.enCancha && !fuera(j) && j.bolincha.posicion.z <= m.zMeta;

  function actualizarMarcador() {
    const j = jugadores[turno];
    const falta = j.enCancha ? Math.max(j.bolincha.posicion.z - m.zMeta, 0) : -m.zMeta;
    hud.marcador({
      jugadores: jugadores.map((x) => ({ ...x, puntos: '' })),
      turno: fase === 'fin' ? null : turno,
      detalle: fase === 'fin' ? 'Partida terminada' : `Meta a ${(falta / 100).toFixed(1).replace('.', ',')} m`,
    });
  }

  // Pone la bolincha en la salida (corrida a un lado si la otra está encima).
  function ponerEnSalida(j) {
    const otra = jugadores.find((o) => o !== j && o.enCancha);
    let x = 0;
    if (otra && Math.hypot(otra.bolincha.posicion.x, otra.bolincha.posicion.z) < CONFIG.circulo.separacionMinima) {
      x = otra.bolincha.posicion.x > 0 ? -4 : 4;
    }
    j.bolincha.colocar(x, 0);
    j.enCancha = true;
  }

  // Vuelve a dejar la bolincha donde estaba antes del tiro (en el piso del caño).
  function devolver(j) {
    const x = THREE.MathUtils.clamp(j.antes.x, -m.mitadFondo + 1, m.mitadFondo - 1);
    j.bolincha.colocar(x, j.antes.z);
    j.enCancha = true;
  }

  function seguirTirando() {
    const j = jugadores[turno];
    if (!j.enCancha) ponerEnSalida(j);
    enfocada = j.bolincha;
    for (const x of jugadores) x.antes.copy(x.bolincha.posicion);
    const haciaMeta = j.bolincha.posicion.clone().add(new THREE.Vector3(0, 0, -100));
    actualizarMarcador();

    if (j.esComputadora) {
      const otro = jugadores.find((o) => o !== j);
      planComputadora = planificarTiroCano({
        tirador: j.bolincha.posicion.clone(),
        rival: otro.enCancha ? otro.bolincha.posicion.clone() : null,
        radioBolincha: j.bolincha.radio,
        nivel: rival,
        medidas: m,
      });
      controlCamara.mirarDesde(j.bolincha.posicion, planComputadora.objetivo || haciaMeta);
      relojComputadora = 0;
      fase = 'computadora';
      return;
    }
    controlCamara.mirarDesde(j.bolincha.posicion, haciaMeta);
    fase = 'apuntar';
    hud.ayudaDeTiro(true);
  }

  function empezarPartida(nivel) {
    rival = nivel;
    if (rival) {
      Object.assign(jugadores[0], { nombre: 'Tú', esTu: true, esComputadora: false });
      Object.assign(jugadores[1], { nombre: 'Computadora', esTu: false, esComputadora: true });
    } else {
      Object.assign(jugadores[0], { nombre: 'Jugador 1', esTu: false, esComputadora: false });
      Object.assign(jugadores[1], { nombre: 'Jugador 2', esTu: false, esComputadora: false });
    }
    for (const j of jugadores) {
      j.enCancha = false;
      j.bolincha.quitar();
    }
    turno = 0;
    ponerEnSalida(jugadores[0]);
    if (!CONFIG.reglasCano.primerTiroDesdeSalida) ponerEnSalida(jugadores[1]);
    enfocada = jugadores[0].bolincha;
    controlCamara.mirarDesde(enfocada.posicion, new THREE.Vector3(0, 0, -100), true);
    seguirTirando();
  }

  function nuevaPartida() {
    fase = 'espera';
    mostrarPunteria(null);
    hud.tarjeta({
      titulo: 'Modo Caño',
      lista: [
        'Cada uno tira su bolincha por el caño, por turnos.',
        'Gana el primero que saque la bolincha del rival fuera del caño.',
        'Si te sales tú, pierdes el turno y tu bolincha vuelve a donde estaba.',
        'Si nadie saca a nadie, gana el primero que llegue a la meta.',
      ],
      pregunta: '¿Contra quién juegas?',
      botones: [
        { texto: 'Computadora · Fácil', alElegir: () => empezarPartida('facil') },
        { texto: 'Computadora · Medio', alElegir: () => empezarPartida('medio') },
        { texto: 'Computadora · Difícil', alElegir: () => empezarPartida('dificil') },
        { texto: 'Dos jugadores en este teléfono', secundario: true, alElegir: () => empezarPartida(null) },
      ],
    });
  }

  function resolver() {
    const j = jugadores[turno];
    const o = jugadores[(turno + 1) % jugadores.length];
    const dice = frases(j);
    const r = resolverTiroCano({
      tiradorFuera: fuera(j),
      rivalFuera: o.enCancha && fuera(o),
      tiradorEnMeta: enMeta(j),
      rivalEnMeta: enMeta(o),
    });
    if (r.devolverTirador) devolver(j);
    if (r.devolverRival) devolver(o);

    if (r.gana) {
      terminar(r.gana === 'tirador' ? j : o, r.motivo === 'metaRival' ? frases(o).meta : dice[r.motivo]);
      return;
    }

    const motivo = dice[r.motivo];
    turno = (turno + 1) % jugadores.length;
    const siguiente = jugadores[turno];
    fase = 'espera';
    actualizarMarcador();

    if (rival) {
      hud.aviso(`${motivo} ${siguiente.esTu ? 'Tu turno.' : 'Turno de la computadora.'}`);
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

  function terminar(ganador, motivo) {
    fase = 'fin';
    mostrarPunteria(null);
    actualizarMarcador();
    let titulo;
    if (ganador.esTu) titulo = '¡Ganaste!';
    else if (ganador.esComputadora) titulo = 'Ganó la computadora';
    else titulo = `¡Ganó ${ganador.nombre}!`;
    hud.tarjeta({
      titulo,
      color: ganador.color,
      texto: motivo,
      botones: [
        { texto: 'Jugar otra vez', alElegir: () => empezarPartida(rival) },
        { texto: 'Cambiar rival', secundario: true, alElegir: () => nuevaPartida() },
      ],
    });
  }

  function tirar(direccion, fuerza) {
    jugadores[turno].bolincha.tirar(direccion, fuerza);
    fase = 'rodando';
    tiempoQuieta = 0;
  }

  return {
    todas,
    nuevaPartida,
    empezarPartida,

    // Saca las bolinchas del suelo (al cambiar de juego).
    retirar() {
      fase = 'espera';
      mostrarPunteria(null);
      for (const j of jugadores) {
        j.enCancha = false;
        j.bolincha.quitar();
      }
    },

    get tirador() {
      return jugadores[turno].bolincha;
    },

    get enfoque() {
      return enfocada;
    },

    puedeTirar: () => fase === 'apuntar',

    tirar(direccion, fuerza) {
      tirar(direccion, fuerza);
      hud.ayudaDeTiro(false);
    },

    actualizar(dt) {
      // Si se cayó del mundo, sale del juego (cuenta como fuera del caño).
      for (const b of todas) if (enJuego(b) && b.posicion.y < -20) b.quitar();

      if (fase === 'computadora') {
        relojComputadora += dt;
        const avance = (relojComputadora - CONFIG.rival[rival].pensar) / DURACION_PUNTERIA;
        if (avance >= 1) {
          mostrarPunteria(null);
          tirar(planComputadora.direccion, planComputadora.fuerza);
        } else if (avance > 0) {
          mostrarPunteria(planComputadora.direccion, planComputadora.fuerza * Math.min(avance * 1.25, 1));
        }
        return;
      }

      if (fase === 'rodando') {
        actualizarMarcador();
        let quietas = true;
        for (const b of todas) if (!b.frenarSiCasiQuieta()) quietas = false;
        tiempoQuieta = quietas ? tiempoQuieta + dt : 0;
        if (tiempoQuieta > 0.3) resolver();
      }
    },
  };
}
