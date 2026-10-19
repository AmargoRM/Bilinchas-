// Modo Caño: de 2 a 4 jugadores (personas o computadora) en un caño con esquinas,
// curvas, piedras y huecos. Gana el primero que pasa la meta.
import * as THREE from 'three';
import { CONFIG } from '../config.js';
import { resolverTiroCano } from './reglas-cano.js';
import { planificarTiroCanal } from '../ia/rival.js';
import { MAPAS, buscarMapa, mapasDisponibles, proximoMapa } from '../mapas.js';
import { crearJugadores, bolinchasDe, resultadoParaProgreso, sentarJugadores, hayVariasPersonas, selectoresMesa, sujeto, leerPreferencias, guardarPreferencias } from '../jugadores.js';
import { tx } from '../textos.js';
import { botonUsarNueva } from '../ui/final.js';

const DURACION_PUNTERIA = 0.9; // segundos que se ve a la computadora apuntando
const metros = (cm) => `${(Math.max(cm, 0) / 100).toFixed(1).replace('.', ',')} m`;

// canal: el escenario (src/escenario/canal.js), que arma el mapa elegido.
// mostrarPunteria(direccion, fuerza): dibuja la puntería de la computadora (null la oculta).
export function crearModoCano({ escena, fisica, hud, controlCamara, canal, mostrarPunteria = () => {}, efectos = {}, alSalir = () => {}, alTerminar = () => null, disenoDueno = () => null, instrucciones, nuevasBolinchas, usarBolincha, nivelJugador = () => 1 }) {
  const todos = crearJugadores({ escena, fisica, superficie: 'concreto' });
  const todas = bolinchasDe(todos);
  const preferencias = leerPreferencias();
  let mapa = buscarMapa(preferencias.mapa); // se revisa que esté desbloqueado al abrir la mesa
  let traza = null;

  let jugadores = []; // los que juegan esta partida
  let turno = 0;
  let fase = 'espera'; // 'apuntar' | 'computadora' | 'rodando' | 'espera' | 'fin'
  let tiempoQuieta = 0;
  let enfocada = todos[0].bolincha;
  let huecosDelDueno = 0; // rivales que el Lugar 1 metió en un hueco (para el progreso)
  let planComputadora = null;
  let relojComputadora = 0;

  const enJuego = (b) => b.cuerpo.isEnabled();
  const recorrido = (j) => traza.proyectar(j.bolincha.posicion.x, j.bolincha.posicion.z).s;
  // Lo que se ve adelante en el caño, para orientar la cámara.
  const adelanteDe = (pos) => {
    const p = traza.puntoEn(traza.proyectar(pos.x, pos.z).s + 70);
    return new THREE.Vector3(p.x, 0, p.z);
  };

  function actualizarMarcador() {
    hud.marcador({
      jugadores: jugadores.map((j) => ({
        nombre: j.nombre,
        color: j.color,
        valor: j.enCancha ? metros(traza.sMeta - recorrido(j)) : '—',
      })),
      turno: fase === 'fin' ? null : turno,
      detalle: `${mapa.nombre} · distancia a la meta`,
    });
  }

  // ¿Hay lugar en (x, z) sin tocar otra bolincha?
  function libre(x, z, ignorar) {
    return todas.every(
      (b) => b === ignorar || !enJuego(b) || Math.hypot(b.posicion.x - x, b.posicion.z - z) >= CONFIG.circulo.separacionMinima
    );
  }

  // Deja la bolincha cerca del punto "s" del caño, corrida a un lado si hay otra.
  function colocarEn(j, s, lado = 0) {
    j.bolincha.quitar();
    const p = traza.puntoEn(s);
    const derecha = new THREE.Vector2(-p.dir.y, p.dir.x);
    for (const corrimiento of [0, 4, -4, 8, -8]) {
      for (const atras of [0, 4, 8, 12]) {
        const l = THREE.MathUtils.clamp(lado + corrimiento, -CONFIG.canal.ancho / 2 + 1.5, CONFIG.canal.ancho / 2 - 1.5);
        const x = p.x + derecha.x * l - p.dir.x * atras;
        const z = p.z + derecha.y * l - p.dir.y * atras;
        if (libre(x, z, j.bolincha)) {
          j.bolincha.colocar(x, z);
          j.enCancha = true;
          return;
        }
      }
    }
    j.bolincha.colocar(p.x, p.z);
    j.enCancha = true;
  }

  function seguirTirando() {
    const j = jugadores[turno];
    if (!j.enCancha) colocarEn(j, traza.sSalida);
    enfocada = j.bolincha;
    // Se anota dónde estaba cada bolincha antes del tiro (por si salta la pared).
    for (const x of jugadores) {
      x.antes = x.enCancha ? { s: recorrido(x), pos: x.bolincha.posicion.clone() } : null;
      x.fuera = false;
      x.enHueco = false;
    }
    actualizarMarcador();

    if (j.esComputadora) {
      planComputadora = planificarTiroCanal({
        traza,
        tirador: j.bolincha.posicion.clone(),
        radioBolincha: j.bolincha.radio,
        pesoTirador: j.bolincha.peso,
        otros: jugadores
          .filter((o) => o !== j && o.enCancha)
          .map((o) => ({ pos: o.bolincha.posicion.clone(), recorrido: recorrido(o), radio: o.bolincha.radio, peso: o.bolincha.peso })),
        nivel: j.nivel,
      });
      controlCamara.mirarDesde(j.bolincha.posicion, planComputadora.objetivo || adelanteDe(j.bolincha.posicion));
      relojComputadora = 0;
      fase = 'computadora';
      return;
    }
    controlCamara.mirarDesde(j.bolincha.posicion, adelanteDe(j.bolincha.posicion));
    fase = 'apuntar';
    hud.ayudaDeTiro(true);
  }

  function empezarPartida() {
    efectos.nuevaPartida?.();
    traza = canal.usarMapa(mapa);
    jugadores = sentarJugadores(todos, preferencias.mesa, preferencias.tamanos, disenoDueno());
    huecosDelDueno = 0;
    turno = CONFIG.reglasCano.sorteoDeQuienEmpieza ? Math.floor(Math.random() * jugadores.length) : 0;
    colocarEn(jugadores[turno], traza.sSalida);
    enfocada = jugadores[turno].bolincha;
    controlCamara.mirarDesde(enfocada.posicion, adelanteDe(enfocada.posicion), true);
    if (jugadores.length > 1) hud.aviso(`Se sorteó quién empieza: ${sujeto(jugadores[turno])}.`);
    seguirTirando();
  }

  const jugar = () => instrucciones.antesDeJugar('cano', empezarPartida);

  // Elegir mapa y quién juega (las reglas se explican aparte, solo la primera vez).
  function nuevaPartida() {
    fase = 'espera';
    mostrarPunteria(null);
    const nivel = nivelJugador();
    const disponibles = mapasDisponibles(MAPAS, nivel);
    mapa = buscarMapa(mapa.id, disponibles); // si el guardado todavía está bloqueado, el primero
    traza = canal.usarMapa(mapa);
    const proximo = proximoMapa(MAPAS, nivel);
    hud.tarjeta({
      titulo: '¿Quién juega?',
      subtitulo: tx('{Caño}'),
      texto: proximo ? `Próximo mapa: ${proximo.nombre}, en el nivel ${proximo.nivel}.` : '',
      selectores: [
        {
          etiqueta: 'Mapa',
          opciones: disponibles.map((m) => ({ valor: m.id, texto: m.nombre })),
          valor: mapa.id,
          alCambiar: (id) => {
            mapa = buscarMapa(id, disponibles);
            traza = canal.usarMapa(mapa);
            preferencias.mapa = id;
            guardarPreferencias(preferencias);
          },
        },
        ...selectoresMesa(preferencias, () => guardarPreferencias(preferencias)),
      ],
      botones: [
        { texto: 'Jugar', alElegir: jugar },
        { texto: 'Cómo se juega', secundario: true, alElegir: () => instrucciones.mostrarReglas('cano', nuevaPartida) },
        { texto: 'Volver', secundario: true, alElegir: () => alSalir('modos') },
      ],
    });
  }

  // Durante el tiro: huecos y bolinchas que saltan la pared.
  function vigilar() {
    for (const j of jugadores) {
      if (!j.enCancha || j.fuera || j.enHueco || !enJuego(j.bolincha)) continue;
      const p = j.bolincha.posicion;
      if (!traza.dentro(p.x, p.z, 0.5)) {
        j.fuera = true;
        j.bolincha.congelar(p.x, Math.max(p.y, CONFIG.canal.altoPared + j.bolincha.radio), p.z);
        continue;
      }
      for (const o of traza.obstaculos) {
        if (o.tipo !== 'hueco') continue;
        if (Math.hypot(p.x - o.x, p.z - o.z) < o.radio - 0.3 && j.bolincha.velocidad() < CONFIG.canal.velocidadParaCaerEnHueco) {
          j.enHueco = true;
          efectos.hueco?.();
          if (jugadores[turno].lugar === 0 && j.lugar !== 0) huecosDelDueno++;
          j.bolincha.congelar(o.x, -j.bolincha.radio * 0.9, o.z); // se ve hundida en el hueco
          break;
        }
      }
    }
  }

  function resolver() {
    const j = jugadores[turno];
    const estados = jugadores
      .filter((x) => x.enCancha)
      .map((x) => ({
        lugar: x.lugar,
        fuera: x.fuera,
        enHueco: x.enHueco,
        recorrido: x.fuera || x.enHueco ? 0 : recorrido(x),
        enMeta: !x.fuera && !x.enHueco && recorrido(x) >= traza.sMeta,
      }));
    const r = resolverTiroCano({ tirador: j.lugar, estados });

    const avisos = [];
    for (const lugar of r.devolver) {
      const x = todos[lugar];
      colocarEnPosicion(x, x.antes);
      avisos.push(`${sujeto(x)} ${x.esTu ? 'saltaste' : 'saltó'} la pared: vuelve a donde estaba.`);
    }
    for (const lugar of r.aSalida) {
      const x = todos[lugar];
      colocarEn(x, traza.sSalida);
      avisos.push(`${sujeto(x)} ${x.esTu ? 'caíste' : 'cayó'} en un hueco: vuelve a la salida.`);
    }

    if (r.ganador !== null) {
      terminar(todos[r.ganador]);
      return;
    }

    turno = (turno + 1) % jugadores.length;
    const siguiente = jugadores[turno];
    fase = 'espera';
    actualizarMarcador();
    const motivo = avisos.join(' ');

    if (!hayVariasPersonas(jugadores) || siguiente.esComputadora) {
      // Nadie tiene que pasar el teléfono: un aviso y sigue el juego.
      const quien = siguiente.esTu ? 'Tu turno.' : `Turno de ${sujeto(siguiente, false)}.`;
      hud.aviso(motivo ? `${motivo} ${quien}` : quien);
      seguirTirando();
      return;
    }
    hud.tarjeta({
      titulo: `Turno de ${siguiente.nombre}`,
      color: siguiente.color,
      texto: `${motivo ? motivo + ' ' : ''}Pásale el teléfono a ${siguiente.nombre}.`,
      botones: [{ texto: 'Tirar', alElegir: () => seguirTirando() }],
    });
  }

  // Vuelve a dejar la bolincha donde estaba antes del tiro.
  function colocarEnPosicion(j, antes) {
    if (!antes) {
      colocarEn(j, traza.sSalida);
      return;
    }
    j.bolincha.quitar();
    if (libre(antes.pos.x, antes.pos.z, j.bolincha)) {
      j.bolincha.colocar(antes.pos.x, antes.pos.z);
      j.enCancha = true;
    } else {
      colocarEn(j, antes.s); // alguien quedó en su lugar: al lado
    }
  }

  function terminar(ganador) {
    fase = 'fin';
    efectos.victoria?.();
    const r = resultadoParaProgreso({ modo: 'cano', jugadores, ganador, extra: { huecos: huecosDelDueno, mapa: mapa.id } });
    const premios = r ? alTerminar(r) || [] : [];
    mostrarPunteria(null);
    actualizarMarcador();
    let titulo;
    if (ganador.esTu) titulo = '¡Ganaste!';
    else if (ganador.nombre === 'Computadora') titulo = 'Ganó la computadora';
    else titulo = `¡Ganó ${ganador.nombre}!`;
    const mostrar = (extra = null) =>
      hud.tarjeta({
        titulo,
        color: ganador.color,
        texto: `${sujeto(ganador)} ${ganador.esTu ? 'llegaste' : 'llegó'} primero a la meta en ${mapa.nombre}.`,
        lista: extra ? [...premios, extra] : premios,
        botones: [
          ...(extra ? [] : botonUsarNueva({ nuevas: nuevasBolinchas, usar: usarBolincha, mostrar })),
          { texto: 'Jugar otra vez', alElegir: jugar },
          { texto: 'Cambiar mapa o jugadores', secundario: true, alElegir: () => nuevaPartida() },
          { texto: 'Menú', secundario: true, alElegir: () => alSalir('menu') },
        ],
      });
    mostrar();
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
    get traza() {
      return traza;
    },
    // Posiciones de las bolinchas en juego, con su color (para la vista de mapa).
    marcas() {
      return jugadores.filter((j) => j.enCancha || j.fuera || j.enHueco).map((j) => ({ pos: j.bolincha.grupo.position, color: j.color }));
    },

    retirar() {
      fase = 'espera';
      mostrarPunteria(null);
      for (const j of todos) {
        j.enCancha = false;
        j.bolincha.quitar();
      }
    },

    get tirador() {
      return (jugadores[turno] || todos[0]).bolincha;
    },

    get enfoque() {
      return enfocada;
    },

    puedeTirar: () => fase === 'apuntar',

    // ¿Tira ahora la persona del Lugar 1? (la única con la bolincha de su colección y su poder)
    get turnoDelDueno() {
      const j = jugadores[turno];
      return !!j && j.lugar === 0 && !j.esComputadora;
    },

    tirar(direccion, fuerza, efecto) {
      tirar(direccion, fuerza, efecto);
      hud.ayudaDeTiro(false);
    },

    actualizar(dt) {
      if (fase === 'computadora') {
        relojComputadora += dt;
        const avance = (relojComputadora - CONFIG.rival[jugadores[turno].nivel].pensar) / DURACION_PUNTERIA;
        if (avance >= 1) {
          mostrarPunteria(null);
          tirar(planComputadora.direccion, planComputadora.fuerza);
        } else if (avance > 0) {
          mostrarPunteria(planComputadora.direccion, planComputadora.fuerza * Math.min(avance * 1.25, 1));
        }
        return;
      }

      if (fase === 'rodando') {
        vigilar();
        actualizarMarcador();
        let quietas = true;
        for (const b of todas) if (!b.frenarSiCasiQuieta()) quietas = false;
        tiempoQuieta = quietas ? tiempoQuieta + dt : 0;
        if (tiempoQuieta > 0.3) resolver();
      }
    },
  };
}
