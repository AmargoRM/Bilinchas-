// Modo Círculo: contra la computadora o dos jugadores en el mismo teléfono.
// Maneja bolinchas, turnos, marcador y fin de partida.
import * as THREE from 'three';
import { CONFIG } from '../config.js';
import { crearBolincha } from '../bolincha.js';
import { resolverTiro, ganador } from './reglas-circulo.js';
import { planificarTiro } from '../ia/rival.js';

const COLORES_JUGADORES = [
  { vidrio: 0x2a8fd6, veta: 0xf2cf4a, color: '#3b9be0' },
  { vidrio: 0xd8402c, veta: 0xf2cf4a, color: '#e2523d' },
];

// Colores de las bolinchas del círculo (sin azul ni rojo puro, para no confundirlas con las de tiro).
const COLORES_CIRCULO = [
  [0x3fae5a, 0xd8402c],
  [0xd9eef0, 0x2a8fd6],
  [0x1f9e9a, 0xf2cf4a],
  [0x6fcf6a, 0xd8402c],
  [0xc9a23a, 0x2a8fd6],
  [0x8fd3c8, 0xd8402c],
];

const LIMITE_PATIO = 280; // cm: más allá de esto, la bolincha se cayó del patio
const DURACION_PUNTERIA = 0.9; // segundos que se ve a la computadora apuntando

// Frases según quién juega: "Tú" se trata de tú; los demás, en tercera persona.
function frases(j) {
  if (j.esTu) {
    return {
      ninguna: 'No sacaste ninguna.',
      saco: (n) => `Sacaste ${n}.`,
      dentro: 'Tu bolincha quedó dentro del círculo.',
      seLleva: (n) => `Igual te llevas ${n}.`,
      devuelve: (n) => `Las ${n} que sacaste vuelven al círculo.`,
      repite: (n) => `¡Sacaste ${n}! Tira otra vez desde donde quedó tu bolincha.`,
    };
  }
  const quien = j.esComputadora ? 'La computadora' : j.nombre;
  const deQuien = j.esComputadora ? 'de la computadora' : `de ${j.nombre}`;
  return {
    ninguna: `${quien} no sacó ninguna.`,
    saco: (n) => `${quien} sacó ${n}.`,
    dentro: `La bolincha ${deQuien} quedó dentro del círculo.`,
    seLleva: (n) => `Igual se lleva ${n}.`,
    devuelve: (n) => `Las ${n} que sacó vuelven al círculo.`,
    repite: (n) => `¡${quien} sacó ${n}! Vuelve a tirar.`,
  };
}

// mostrarPunteria(direccion, fuerza): dibuja la puntería de la computadora (null la oculta).
export function crearModoCirculo({ escena, fisica, hud, controlCamara, mostrarPunteria = () => {} }) {
  const radio = CONFIG.circulo.radio;
  const centro = new THREE.Vector3(0, 0, 0);
  const salida = new THREE.Vector3(0, 0, CONFIG.circulo.distanciaSalida);

  const jugadores = COLORES_JUGADORES.map((c) => ({
    ...c,
    nombre: '',
    esTu: false,
    esComputadora: false,
    puntos: 0,
    enCancha: false,
    bolincha: crearBolincha({ escena, fisica, posicion: salida, colorVidrio: c.vidrio, colorVeta: c.veta }),
  }));
  const blancos = [];
  for (let i = 0; i < CONFIG.circulo.cantidadBolinchas; i++) {
    const [colorVidrio, colorVeta] = COLORES_CIRCULO[i % COLORES_CIRCULO.length];
    blancos.push({ enCirculo: true, bolincha: crearBolincha({ escena, fisica, posicion: centro, colorVidrio, colorVeta }) });
  }
  const todas = [...jugadores.map((j) => j.bolincha), ...blancos.map((b) => b.bolincha)];

  let rival = null; // null = dos jugadores; si no, el nivel de la computadora
  let turno = 0;
  let fase = 'espera'; // 'apuntar' | 'computadora' | 'rodando' | 'espera' | 'fin'
  let tiempoQuieta = 0;
  let enfocada = jugadores[0].bolincha; // la que sigue la cámara
  let planComputadora = null;
  let relojComputadora = 0;

  const enJuego = (b) => b.cuerpo.isEnabled();
  const dentro = (b) => enJuego(b) && Math.hypot(b.posicion.x, b.posicion.z) <= radio;
  const quedan = () => blancos.filter((b) => b.enCirculo).length;
  const contraComputadora = () => rival !== null;

  function actualizarMarcador() {
    hud.marcador({ jugadores, turno: fase === 'fin' ? null : turno, quedan: quedan() });
  }

  // ¿Hay lugar en (x, z) sin tocar ninguna bolincha en juego?
  function libre(x, z, ignorar) {
    return todas.every(
      (b) => b === ignorar || !enJuego(b) || Math.hypot(b.posicion.x - x, b.posicion.z - z) >= CONFIG.circulo.separacionMinima
    );
  }

  // Reparte bolinchas al azar dentro del círculo, sin que se toquen.
  function acomodar(lista) {
    const zona = radio * CONFIG.circulo.zonaBolinchas;
    for (const b of lista) {
      b.bolincha.quitar(); // que no estorbe su propia posición vieja
      let x = 0;
      let z = 0;
      for (let intento = 0; intento < 300; intento++) {
        const a = Math.random() * Math.PI * 2;
        const r = Math.sqrt(Math.random()) * zona;
        x = Math.cos(a) * r;
        z = Math.sin(a) * r;
        if (libre(x, z)) break;
      }
      b.bolincha.colocar(x, z);
      b.enCirculo = true;
    }
  }

  // Pone la bolincha del jugador en la salida (corrida a un lado si hay otra encima).
  function ponerEnSalida(j) {
    j.bolincha.quitar();
    let x = salida.x;
    for (let i = 1; !libre(x, salida.z) && i < 20; i++) x = salida.x + Math.ceil(i / 2) * 4 * (i % 2 ? 1 : -1);
    j.bolincha.colocar(x, salida.z);
    j.enCancha = true;
  }

  function empezarTurno() {
    const j = jugadores[turno];
    if (CONFIG.reglasCirculo.inicioDeTurno === 'salida' || !j.enCancha) {
      // El otro jugador levanta su bolincha del suelo.
      if (CONFIG.reglasCirculo.inicioDeTurno === 'salida') {
        for (const otro of jugadores) {
          if (otro !== j) {
            otro.bolincha.quitar();
            otro.enCancha = false;
          }
        }
      }
      ponerEnSalida(j);
    }
    seguirTirando();
  }

  function seguirTirando() {
    const j = jugadores[turno];
    if (!j.enCancha) ponerEnSalida(j);
    enfocada = j.bolincha;
    actualizarMarcador();

    if (j.esComputadora) {
      // La computadora decide ahora y tira después de "pensar".
      const otros = jugadores.filter((o) => o !== j && o.enCancha).map((o) => o.bolincha.posicion.clone());
      planComputadora = planificarTiro({
        tirador: j.bolincha.posicion.clone(),
        radioBolincha: j.bolincha.radio,
        blancos: blancos.filter((b) => b.enCirculo).map((b) => b.bolincha.posicion.clone()),
        obstaculos: otros,
        nivel: rival,
        radioCirculo: radio,
      });
      controlCamara.mirarDesde(j.bolincha.posicion, planComputadora.objetivo);
      relojComputadora = 0;
      fase = 'computadora';
      return;
    }

    controlCamara.mirarDesde(j.bolincha.posicion, centro);
    fase = 'apuntar';
    hud.ayudaDeTiro(true);
  }

  // Elige rival y arranca con las bolinchas en su lugar.
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
      j.puntos = 0;
      j.enCancha = false;
      j.bolincha.quitar();
    }
    acomodar(blancos);
    turno = 0;
    ponerEnSalida(jugadores[0]);
    enfocada = jugadores[0].bolincha;
    controlCamara.mirarDesde(enfocada.posicion, centro, true);
    seguirTirando();
  }

  // Muestra las reglas y la elección de rival.
  function nuevaPartida() {
    fase = 'espera';
    mostrarPunteria(null);
    hud.tarjeta({
      titulo: 'Modo Círculo',
      lista: [
        'Tira desde afuera y saca bolinchas del círculo: las que saques son tuyas.',
        'Si sacas al menos una, vuelves a tirar desde donde quedó tu bolincha.',
        'Si no sacas ninguna, o tu bolincha queda dentro del círculo, pasa el turno.',
        'Gana quien tenga más cuando el círculo quede vacío.',
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

  // Se llama cuando todas las bolinchas se detuvieron después de un tiro.
  function resolver() {
    const j = jugadores[turno];
    const dice = frases(j);
    const sacadas = blancos.filter((b) => b.enCirculo && !dentro(b.bolincha));
    const n = sacadas.length;
    const tiradorDentro = j.enCancha && dentro(j.bolincha);
    const r = resolverTiro({ sacadas: n, tiradorDentro });

    if (r.cuentan) {
      j.puntos += n;
      for (const b of sacadas) {
        b.enCirculo = false;
        b.bolincha.quitar(); // el jugador la levanta y se la guarda
      }
    } else {
      acomodar(sacadas);
    }
    actualizarMarcador();

    if (quedan() === 0) {
      terminar();
      return;
    }

    if (r.repite) {
      hud.aviso(dice.repite(n));
      seguirTirando();
      return;
    }

    let motivo;
    if (r.motivo === 'dentro') {
      motivo = dice.dentro;
      if (n > 0) motivo += ' ' + (r.cuentan ? dice.seLleva(n) : dice.devuelve(n));
    } else if (r.motivo === 'saco') {
      motivo = dice.saco(n);
    } else {
      motivo = dice.ninguna;
    }

    turno = (turno + 1) % jugadores.length;
    const siguiente = jugadores[turno];
    fase = 'espera';
    actualizarMarcador();

    if (contraComputadora()) {
      // No hay que pasar el teléfono: un aviso y sigue el juego.
      hud.aviso(`${motivo} ${siguiente.esTu ? 'Tu turno.' : 'Turno de la computadora.'}`);
      empezarTurno();
      return;
    }
    hud.tarjeta({
      titulo: `Turno de ${siguiente.nombre}`,
      color: siguiente.color,
      texto: `${motivo} Pásale el teléfono a ${siguiente.nombre}.`,
      botones: [{ texto: 'Tirar', alElegir: () => empezarTurno() }],
    });
  }

  function terminar() {
    fase = 'fin';
    mostrarPunteria(null);
    actualizarMarcador();
    const g = ganador(jugadores);
    const [a, b] = jugadores;
    let titulo;
    if (g === null) titulo = 'Empate';
    else if (jugadores[g].esTu) titulo = '¡Ganaste!';
    else if (jugadores[g].esComputadora) titulo = 'Ganó la computadora';
    else titulo = `¡Ganó ${jugadores[g].nombre}!`;
    hud.tarjeta({
      titulo,
      color: g === null ? null : jugadores[g].color,
      texto: `${a.nombre}: ${a.puntos} · ${b.nombre}: ${b.puntos}`,
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

    get tirador() {
      return jugadores[turno].bolincha;
    },

    // La bolincha que sigue la cámara (la del último que tiró, hasta que empiece el turno siguiente).
    get enfoque() {
      return enfocada;
    },

    puedeTirar: () => fase === 'apuntar',

    // Tiro de la persona (desde el control táctil).
    tirar(direccion, fuerza) {
      tirar(direccion, fuerza);
      hud.ayudaDeTiro(false);
    },

    actualizar(dt) {
      // Las que se cayeron del patio salen del juego (si eran del círculo, cuentan como sacadas).
      for (const b of todas) {
        const p = b.posicion;
        if (enJuego(b) && (p.y < -20 || Math.abs(p.x) > LIMITE_PATIO || Math.abs(p.z) > LIMITE_PATIO)) {
          b.quitar();
          const j = jugadores.find((x) => x.bolincha === b);
          if (j) j.enCancha = false;
        }
      }

      if (fase === 'computadora') {
        // Piensa, muestra cómo apunta llenando la barra de fuerza, y tira.
        relojComputadora += dt;
        const pensar = CONFIG.rival[rival].pensar;
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
      // Se resuelve el tiro cuando TODAS las bolinchas se detuvieron.
      let quietas = true;
      for (const b of todas) if (!b.frenarSiCasiQuieta()) quietas = false;
      tiempoQuieta = quietas ? tiempoQuieta + dt : 0;
      if (tiempoQuieta > 0.3) resolver();
    },
  };
}
