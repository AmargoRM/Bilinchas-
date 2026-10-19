// Modo Círculo: de 2 a 4 jugadores (personas o computadora) en el mismo teléfono.
// Maneja bolinchas, turnos, marcador y fin de partida.
import * as THREE from 'three';
import { CONFIG } from '../config.js';
import { crearBolincha } from '../bolincha.js';
import { DISENOS_CIRCULO } from '../disenos.js';
import { resolverTiro, ganador } from './reglas-circulo.js';
import { planificarTiro } from '../ia/rival.js';
import { crearJugadores, bolinchasDe, resultadoParaProgreso, sentarJugadores, hayVariasPersonas, selectoresMesa, sujeto, leerPreferencias, guardarPreferencias } from '../jugadores.js';
import { tx } from '../textos.js';
import { MAPAS_CIRCULO, buscarMapa, mapasDisponibles, proximoMapa } from '../mapas.js';
import { armarFormacion, NOMBRES_FORMACIONES } from './formaciones.js';



const LIMITE_PATIO = 280; // cm: más allá de esto, la bolincha se cayó del patio
const DURACION_PUNTERIA = 0.9; // segundos que se ve a la computadora apuntando

// La dificultad del Círculo para un nivel: suma las filas de CONFIG.dificultadCirculo hasta ese nivel.
export function dificultadDe(nivel) {
  const d = {};
  for (const fila of CONFIG.dificultadCirculo) if (fila.desde <= nivel) Object.assign(d, fila);
  return d;
}

// Frases según quién juega: "Tú" se trata de tú; los demás, en tercera persona.
function frases(j) {
  if (j.esTu) {
    return {
      ninguna: tx('No sacaste {ninguna}.'),
      saco: (n) => `Sacaste ${n}.`,
      dentro: tx('Tu {bolincha} quedó dentro del círculo.'),
      seLleva: (n) => `Igual te llevas ${n}.`,
      devuelve: (n) => `Las ${n} que sacaste vuelven al círculo.`,
      repite: (n) => tx(`¡Sacaste ${n}! Tira otra vez desde donde quedó tu {bolincha}.`),
    };
  }
  const quien = sujeto(j);
  const deQuien = `de ${sujeto(j, false)}`;
  return {
    ninguna: tx(`${quien} no sacó {ninguna}.`),
    saco: (n) => `${quien} sacó ${n}.`,
    dentro: tx(`{La} {bolincha} ${deQuien} quedó dentro del círculo.`),
    seLleva: (n) => `Igual se lleva ${n}.`,
    devuelve: (n) => `Las ${n} que sacó vuelven al círculo.`,
    repite: (n) => `¡${quien} sacó ${n}! Vuelve a tirar.`,
  };
}

// mostrarPunteria(direccion, fuerza): dibuja la puntería de la computadora (null la oculta).
export function crearModoCirculo({ escena, fisica, hud, controlCamara, mostrarPunteria = () => {}, efectos = {}, alSalir = () => {}, alTerminar = () => null, disenoDueno = () => null, instrucciones, patio, nivelJugador = () => 1 }) {
  const centro = new THREE.Vector3(0, 0, 0);
  // Lo que depende del nivel (CONFIG.dificultadCirculo): se fija al empezar cada partida.
  let reglas = dificultadDe(1);
  let radio = reglas.radio;
  // La salida cambia de lado en cada partida (ángulo al azar alrededor del círculo).
  const salida = new THREE.Vector3(0, 0, reglas.salida);
  let piedras = []; // [{ x, z, radio }]

  const todos = crearJugadores({ escena, fisica });
  const preferencias = leerPreferencias();
  let jugadores = []; // los que juegan esta partida
  const blancos = [];
  const maximo = Math.max(...CONFIG.dificultadCirculo.map((d) => d.bolinchas || 0));
  for (let i = 0; i < maximo; i++) {
    // Diseños clásicos de barrio (verdes y claros, para no confundirlas con las de tiro).
    const diseno = DISENOS_CIRCULO[i % DISENOS_CIRCULO.length];
    blancos.push({ enCirculo: true, bolincha: crearBolincha({ escena, fisica, posicion: centro, diseno }) });
  }
  const todas = [...bolinchasDe(todos), ...blancos.map((b) => b.bolincha)];

  // Mapa (lugar donde está dibujado el círculo): solo los que ya se desbloquearon.
  let mapa = MAPAS_CIRCULO[0];
  function usarMapa(id) {
    const disponibles = mapasDisponibles(MAPAS_CIRCULO, nivelJugador());
    mapa = buscarMapa(id, disponibles);
    patio?.usarMapa(mapa.id);
    for (const b of todas) b.usarSuperficie(mapa.superficie);
  }

  let turno = 0;
  let fase = 'espera'; // 'apuntar' | 'computadora' | 'rodando' | 'espera' | 'fin'
  let tiempoQuieta = 0;
  let enfocada = todos[0].bolincha; // la que sigue la cámara
  let mejorTiroDueno = 0; // más bolinchas sacadas de un tiro por el Lugar 1 (para los logros)
  let planComputadora = null;
  let relojComputadora = 0;

  const enJuego = (b) => b.cuerpo.isEnabled();
  const dentro = (b) => enJuego(b) && Math.hypot(b.posicion.x, b.posicion.z) <= radio;
  const quedan = () => blancos.filter((b) => b.enCirculo).length;

  function actualizarMarcador() {
    hud.marcador({
      jugadores: jugadores.map((j) => ({ nombre: j.nombre, color: j.color, valor: j.puntos })),
      turno: fase === 'fin' ? null : turno,
      detalle: `Quedan ${quedan()} en el círculo`,
    });
  }

  // ¿Hay lugar en (x, z) sin tocar ninguna bolincha en juego?
  function libre(x, z, ignorar) {
    return (
      todas.every((b) => b === ignorar || !enJuego(b) || Math.hypot(b.posicion.x - x, b.posicion.z - z) >= CONFIG.circulo.separacionMinima) &&
      piedras.every((p) => Math.hypot(p.x - x, p.z - z) >= p.radio + 2.5)
    );
  }

  // Prepara el círculo para una partida: tamaño según el nivel, salida al azar,
  // piedras (si tocan) y las bolinchas en una formación al azar.
  function armarCirculo() {
    reglas = dificultadDe(nivelJugador());
    radio = reglas.radio;
    patio?.usarRadio(radio);
    const angulo = Math.random() * Math.PI * 2;
    salida.set(Math.sin(angulo) * reglas.salida, 0, Math.cos(angulo) * reglas.salida);
    piedras = [];
    for (let intento = 0; piedras.length < reglas.piedras && intento < 200; intento++) {
      const a = Math.random() * Math.PI * 2;
      const r = (0.3 + Math.random() * 0.55) * radio;
      const p = { x: Math.cos(a) * r, z: Math.sin(a) * r, radio: 1.6 + Math.random() * 1.2 };
      if (piedras.every((q) => Math.hypot(q.x - p.x, q.z - p.z) > 14)) piedras.push(p);
    }
    patio?.ponerPiedras(piedras);
    for (const b of blancos) {
      b.bolincha.quitar();
      b.enCirculo = false;
    }
    const enJuegoAhora = blancos.slice(0, reglas.bolinchas);
    const { nombre, posiciones } = armarFormacion(enJuegoAhora.length, radio * CONFIG.circulo.zonaBolinchas, piedras);
    enJuegoAhora.forEach((b, i) => {
      if (!posiciones[i]) return;
      b.bolincha.colocar(posiciones[i].x, posiciones[i].z);
      b.enCirculo = true;
    });
    // Si alguna no entró en la formación, va suelta.
    acomodar(enJuegoAhora.filter((b) => !b.enCirculo));
    return nombre;
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
    // Hacia el costado de la salida (perpendicular a la línea al centro).
    const largo = Math.hypot(salida.x, salida.z) || 1;
    const lx = salida.z / largo;
    const lz = -salida.x / largo;
    let x = salida.x;
    let z = salida.z;
    for (let i = 1; !libre(x, z) && i < 20; i++) {
      const corrida = Math.ceil(i / 2) * 4 * (i % 2 ? 1 : -1);
      x = salida.x + lx * corrida;
      z = salida.z + lz * corrida;
    }
    j.bolincha.colocar(x, z);
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
        pesoTirador: j.bolincha.peso,
        blancos: blancos.filter((b) => b.enCirculo).map((b) => b.bolincha.posicion.clone()),
        obstaculos: [...otros, ...piedras.map((p) => new THREE.Vector3(p.x, 0, p.z))],
        nivel: j.nivel,
        radioCirculo: radio,
        superficie: mapa.superficie,
        afinado: reglas.punteriaRival,
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

  // Sienta a los jugadores de la mesa y arranca con las bolinchas en su lugar.
  function empezarPartida() {
    usarMapa(mapa.id);
    jugadores = sentarJugadores(todos, preferencias.mesa, preferencias.tamanos, disenoDueno());
    for (const j of jugadores) j.puntos = 0;
    mejorTiroDueno = 0;
    for (const j of todos) {
      j.bolincha.quitar();
      j.enCancha = false;
    }
    const formacion = armarCirculo();
    turno = Math.floor(Math.random() * jugadores.length); // se sortea quién empieza
    ponerEnSalida(jugadores[turno]);
    enfocada = jugadores[turno].bolincha;
    controlCamara.mirarDesde(enfocada.posicion, centro, true);
    hud.aviso(`${tx(`{Las} {bolinchas} están ${NOMBRES_FORMACIONES[formacion]}.`)} Empieza ${sujeto(jugadores[turno], false)}.`);
    seguirTirando();
  }

  const jugar = () => instrucciones.antesDeJugar('circulo', empezarPartida);

  // Elegir quién juega (las reglas se explican aparte, solo la primera vez).
  function nuevaPartida() {
    fase = 'espera';
    mostrarPunteria(null);
    usarMapa(preferencias.mapaCirculo);
    armarCirculo(); // que se vean en el círculo detrás de la mesa
    // Detrás de la tarjeta, el círculo visto desde la salida.
    enfocada = { posicion: salida };
    controlCamara.mirarDesde(salida, centro, true);
    const nivel = nivelJugador();
    const proximo = proximoMapa(MAPAS_CIRCULO, nivel);
    hud.tarjeta({
      titulo: '¿Quién juega?',
      subtitulo: 'Círculo',
      texto: proximo ? `Próximo mapa: ${proximo.nombre}, en el nivel ${proximo.nivel}.` : '',
      selectores: [
        {
          etiqueta: 'Mapa',
          opciones: mapasDisponibles(MAPAS_CIRCULO, nivel).map((m) => ({ valor: m.id, texto: m.nombre })),
          valor: mapa.id,
          alCambiar: (id) => {
            usarMapa(id);
            preferencias.mapaCirculo = id;
            guardarPreferencias(preferencias);
          },
        },
        ...selectoresMesa(preferencias, () => guardarPreferencias(preferencias)),
      ],
      botones: [
        { texto: 'Jugar', alElegir: jugar },
        { texto: 'Cómo se juega', secundario: true, alElegir: () => instrucciones.mostrarReglas('circulo', nuevaPartida) },
        { texto: 'Volver', secundario: true, alElegir: () => alSalir('modos') },
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
      if (j.lugar === 0) mejorTiroDueno = Math.max(mejorTiroDueno, n);
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

    if (!hayVariasPersonas(jugadores) || siguiente.esComputadora) {
      // Nadie tiene que pasar el teléfono: un aviso y sigue el juego.
      hud.aviso(`${motivo} ${siguiente.esTu ? 'Tu turno.' : `Turno de ${sujeto(siguiente, false)}.`}`);
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
    efectos.victoria?.();
    mostrarPunteria(null);
    actualizarMarcador();
    const g = ganador(jugadores);
    const r = resultadoParaProgreso({
      modo: 'circulo',
      jugadores,
      ganador: g === null ? null : jugadores[g],
      extra: { sacadas: todos[0].puntos || 0, mejorTiro: mejorTiroDueno },
    });
    const premios = r ? alTerminar(r) || [] : [];
    let titulo;
    if (g === null) titulo = 'Empate';
    else if (jugadores[g].esTu) titulo = '¡Ganaste!';
    else if (jugadores[g].nombre === 'Computadora') titulo = 'Ganó la computadora';
    else titulo = `¡Ganó ${jugadores[g].nombre}!`;
    hud.tarjeta({
      titulo,
      color: g === null ? null : jugadores[g].color,
      texto: jugadores.map((x) => `${x.nombre}: ${x.puntos}`).join(' · '),
      lista: premios,
      botones: [
        { texto: 'Jugar otra vez', alElegir: jugar },
        { texto: 'Cambiar jugadores', secundario: true, alElegir: () => nuevaPartida() },
        { texto: 'Menú', secundario: true, alElegir: () => alSalir('menu') },
      ],
    });
  }

  // Al crearse, las bolinchas nacen todas en el centro: acomodarlas para que no se encimen.
  armarCirculo();

  function tirar(direccion, fuerza, efecto = null) {
    jugadores[turno].bolincha.tirar(direccion, fuerza, efecto);
    fase = 'rodando';
    tiempoQuieta = 0;
  }

  return {
    todas,
    nuevaPartida,
    empezarPartida,

    // De qué es el suelo (para el sonido de rodar).
    get superficie() {
      return mapa.superficie;
    },

    // Saca todas las bolinchas del suelo (al cambiar de juego).
    retirar() {
      fase = 'espera';
      mostrarPunteria(null);
      for (const b of todas) b.quitar();
      for (const j of todos) j.enCancha = false;
    },

    get tirador() {
      return (jugadores[turno] || todos[0]).bolincha;
    },

    // La bolincha que sigue la cámara (la del último que tiró, hasta que empiece el turno siguiente).
    get enfoque() {
      return enfocada;
    },

    puedeTirar: () => fase === 'apuntar',

    // Tiro de la persona (desde el control táctil), con el efecto elegido (o null).
    tirar(direccion, fuerza, efecto) {
      tirar(direccion, fuerza, efecto);
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
      // Se resuelve el tiro cuando TODAS las bolinchas se detuvieron.
      let quietas = true;
      for (const b of todas) if (!b.frenarSiCasiQuieta()) quietas = false;
      tiempoQuieta = quietas ? tiempoQuieta + dt : 0;
      if (tiempoQuieta > 0.3) resolver();
    },
  };
}
