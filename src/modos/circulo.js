// Modo Círculo para dos jugadores en el mismo teléfono:
// bolinchas, turnos, marcador y fin de partida.
import * as THREE from 'three';
import { CONFIG } from '../config.js';
import { crearBolincha } from '../bolincha.js';
import { resolverTiro, ganador } from './reglas-circulo.js';

const JUGADORES = [
  { nombre: 'Jugador 1', vidrio: 0x2a8fd6, veta: 0xf2cf4a, color: '#3b9be0' },
  { nombre: 'Jugador 2', vidrio: 0xd8402c, veta: 0xf2cf4a, color: '#e2523d' },
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

export function crearModoCirculo({ escena, fisica, hud, controlCamara }) {
  const radio = CONFIG.circulo.radio;
  const centro = new THREE.Vector3(0, 0, 0);
  const salida = new THREE.Vector3(0, 0, CONFIG.circulo.distanciaSalida);

  const jugadores = JUGADORES.map((j) => ({
    ...j,
    puntos: 0,
    enCancha: false,
    bolincha: crearBolincha({ escena, fisica, posicion: salida, colorVidrio: j.vidrio, colorVeta: j.veta }),
  }));
  const blancos = [];
  for (let i = 0; i < CONFIG.circulo.cantidadBolinchas; i++) {
    const [colorVidrio, colorVeta] = COLORES_CIRCULO[i % COLORES_CIRCULO.length];
    blancos.push({ enCirculo: true, bolincha: crearBolincha({ escena, fisica, posicion: centro, colorVidrio, colorVeta }) });
  }
  const todas = [...jugadores.map((j) => j.bolincha), ...blancos.map((b) => b.bolincha)];

  let turno = 0;
  let fase = 'espera'; // 'apuntar' | 'rodando' | 'espera' | 'fin'
  let tiempoQuieta = 0;
  let enfocada = jugadores[0].bolincha; // la que sigue la cámara

  const enJuego = (b) => b.cuerpo.isEnabled();
  const dentro = (b) => enJuego(b) && Math.hypot(b.posicion.x, b.posicion.z) <= radio;
  const quedan = () => blancos.filter((b) => b.enCirculo).length;

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
    controlCamara.mirarDesde(j.bolincha.posicion, centro);
    fase = 'apuntar';
    actualizarMarcador();
    hud.ayudaDeTiro(true);
  }

  function nuevaPartida() {
    for (const j of jugadores) {
      j.puntos = 0;
      j.enCancha = false;
      j.bolincha.quitar();
    }
    acomodar(blancos);
    turno = 0;
    fase = 'espera';
    ponerEnSalida(jugadores[0]);
    enfocada = jugadores[0].bolincha;
    controlCamara.mirarDesde(jugadores[0].bolincha.posicion, centro, true);
    actualizarMarcador();
    hud.tarjeta({
      titulo: 'Modo Círculo',
      subtitulo: 'Dos jugadores, un teléfono',
      lista: [
        'Tira desde afuera y saca bolinchas del círculo: las que saques son tuyas.',
        'Si sacas al menos una, vuelves a tirar desde donde quedó tu bolincha.',
        'Si no sacas ninguna, o tu bolincha queda dentro del círculo, pasa el turno.',
        'Gana quien tenga más cuando el círculo quede vacío.',
      ],
      boton: 'Empezar',
      alAceptar: () => seguirTirando(),
    });
  }

  // Se llama cuando todas las bolinchas se detuvieron después de un tiro.
  function resolver() {
    const j = jugadores[turno];
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
      hud.aviso(`¡${j.nombre} sacó ${n}! Tira otra vez desde donde quedó.`);
      seguirTirando();
      return;
    }

    let motivo;
    if (r.motivo === 'dentro') {
      motivo = `La bolincha de ${j.nombre} quedó dentro del círculo.`;
      if (n > 0) motivo += r.cuentan ? ` Igual se lleva ${n}.` : ` Las ${n} que sacó vuelven al círculo.`;
    } else if (r.motivo === 'saco') {
      motivo = `${j.nombre} sacó ${n}.`;
    } else {
      motivo = `${j.nombre} no sacó ninguna.`;
    }

    turno = (turno + 1) % jugadores.length;
    const siguiente = jugadores[turno];
    fase = 'espera';
    actualizarMarcador();
    hud.tarjeta({
      titulo: `Turno de ${siguiente.nombre}`,
      color: siguiente.color,
      texto: `${motivo} Pásale el teléfono a ${siguiente.nombre}.`,
      boton: 'Tirar',
      alAceptar: () => empezarTurno(),
    });
  }

  function terminar() {
    fase = 'fin';
    actualizarMarcador();
    const g = ganador(jugadores);
    const [a, b] = jugadores;
    hud.tarjeta({
      titulo: g === null ? 'Empate' : `¡Ganó ${jugadores[g].nombre}!`,
      color: g === null ? null : jugadores[g].color,
      texto: `${a.nombre}: ${a.puntos} · ${b.nombre}: ${b.puntos}`,
      boton: 'Jugar otra vez',
      alAceptar: () => nuevaPartida(),
    });
  }

  return {
    todas,
    nuevaPartida,

    get tirador() {
      return jugadores[turno].bolincha;
    },

    // La bolincha que sigue la cámara (la del último que tiró, hasta que empiece el turno siguiente).
    get enfoque() {
      return enfocada;
    },

    puedeTirar: () => fase === 'apuntar',

    tirar(direccion, fuerza) {
      jugadores[turno].bolincha.tirar(direccion, fuerza);
      fase = 'rodando';
      tiempoQuieta = 0;
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

      if (fase !== 'rodando') return;
      // Se resuelve el tiro cuando TODAS las bolinchas se detuvieron.
      let quietas = true;
      for (const b of todas) if (!b.frenarSiCasiQuieta()) quietas = false;
      tiempoQuieta = quietas ? tiempoQuieta + dt : 0;
      if (tiempoQuieta > 0.3) resolver();
    },
  };
}
