// Progreso del jugador: puntos, nivel con título, logros y bolinchas desbloqueadas.
// Se guarda en este teléfono. Cuenta para el Lugar 1 de la mesa, cuando juega una persona.
// Si se borran los datos del navegador o de la app, el progreso se pierde.
import { tx } from './textos.js';

// ---------------------------------------------------------------
// NIVELES: título, puntos necesarios y bolincha que se gana al llegar.
// Los títulos llevan huecos que se completan con las palabras del país (src/textos.js).
// ---------------------------------------------------------------
export const NIVELES = [
  { titulo: '{chica}', desde: 0, premio: null },
  { titulo: 'Aprendiz de tiza', desde: 60, premio: 'tigre' },
  { titulo: 'Tirador de barrio', desde: 160, premio: 'lechera' },
  { titulo: 'Ojo de águila', desde: 320, premio: 'galaxia' },
  { titulo: 'Rey {del_c} {caño}', desde: 540, premio: 'oro' },
  { titulo: 'Maestro del círculo', desde: 850, premio: 'pantano' },
  { titulo: '{Boliche}', desde: 1250, premio: 'diamante' },
  { titulo: '{mayor}', desde: 1800, premio: 'bolichon' },
];

// ---------------------------------------------------------------
// PUNTOS por partida (solo si en el Lugar 1 juega una persona).
// ---------------------------------------------------------------
export const PUNTOS = {
  porJugar: 5, // por terminar una partida, se gane o se pierda
  porGanar: 20, // base por ganar
  // Por cada rival vencido, según quién era:
  porRival: { persona: 15, facil: 10, medio: 25, dificil: 45 },
  porSacada: 2, // Círculo: por cada bolincha que sacaste
  porHueco: 5, // Caño: por cada rival que metiste en un hueco
};

// ---------------------------------------------------------------
// LOGROS: se ganan una sola vez. Algunos regalan una bolincha.
// ---------------------------------------------------------------
export const LOGROS = [
  { id: 'primera', nombre: 'Primera victoria', texto: 'Gana tu primera partida.', premio: 'esmeralda' },
  { id: 'dificil', nombre: 'Sin miedo', texto: 'Gánale a la computadora en Difícil.', premio: 'onix' },
  { id: 'cuatro', nombre: 'Rey de la cuadra', texto: 'Gana una partida de 4 jugadores.', premio: 'arcoiris' },
  { id: 'racha', nombre: 'Racha', texto: 'Gana 3 partidas seguidas.', premio: 'fuego' },
  { id: 'mapas', nombre: 'Conoce el barrio', texto: 'Gana en todos los mapas de {Caño}.', premio: 'caminante' },
  { id: 'limpio', nombre: 'Tiro limpio', texto: 'Saca 3 o más {bolinchas} de un solo tiro en el Círculo.', premio: null },
  { id: 'hueco', nombre: 'Al hueco', texto: 'Mete a un rival en un hueco en {Caño}.', premio: null },
  { id: 'boliche', nombre: 'Peso pesado', texto: 'Gana una partida tirando con {el_g} {boliche}.', premio: null },
];

const INICIALES = ['azul', 'clasica']; // las que se tienen desde el principio
const CLAVE = 'ojo-de-gato.progreso';

function vacio() {
  return { puntos: 0, partidas: 0, victorias: 0, racha: 0, logros: [], disenos: [...INICIALES], elegido: 'azul', mapasGanados: [] };
}

export function crearProgreso({ cantidadMapas, desbloqueosDeNivel = () => [] }) {
  let estado = vacio();
  try {
    const guardado = JSON.parse(localStorage.getItem(CLAVE));
    if (guardado && typeof guardado.puntos === 'number') estado = { ...vacio(), ...guardado };
  } catch {
    // sin almacenamiento o datos dañados: se empieza de cero
  }
  const guardar = () => {
    try {
      localStorage.setItem(CLAVE, JSON.stringify(estado));
    } catch {
      // no se pudo guardar: el progreso dura hasta cerrar la página
    }
  };

  const indiceNivel = (puntos = estado.puntos) => NIVELES.reduce((k, n, i) => (puntos >= n.desde ? i : k), 0);

  function desbloquear(id, mensajes, motivo) {
    if (!id || estado.disenos.includes(id)) return;
    estado.disenos.push(id);
    mensajes.push(tx(`{Nueva} {bolincha} para tu colección: ${motivo}.`));
    nuevas.push(id);
  }

  function lograr(id, mensajes) {
    if (estado.logros.includes(id)) return;
    const l = LOGROS.find((x) => x.id === id);
    estado.logros.push(id);
    mensajes.push(`Desafío cumplido: ${l.nombre}.`);
    desbloquear(l.premio, mensajes, l.premio ? nombreDe(l.premio) : '');
  }

  let nombres = {};
  let nuevas = []; // bolinchas ganadas en la última partida (para ofrecer usarlas)
  const nombreDe = (id) => tx(nombres[id] || id);

  return {
    // Para mostrar el nombre de cada bolincha en los mensajes.
    usarNombres(mapa) {
      nombres = mapa;
    },

    get estado() {
      return estado;
    },

    nivel() {
      const i = indiceNivel();
      const actual = NIVELES[i];
      const siguiente = NIVELES[i + 1] || null;
      const avance = siguiente ? (estado.puntos - actual.desde) / (siguiente.desde - actual.desde) : 1;
      return { numero: i + 1, titulo: tx(actual.titulo), siguiente: siguiente && { ...siguiente, titulo: tx(siguiente.titulo) }, avance, puntos: estado.puntos };
    },

    // Las bolinchas que se ganaron en la última partida anotada.
    get nuevas() {
      return nuevas;
    },

    elegir(id) {
      if (!estado.disenos.includes(id)) return false;
      estado.elegido = id;
      guardar();
      return true;
    },

    // Anota una partida terminada. Devuelve los mensajes para la tarjeta final.
    // r: { modo, gano, empate, rivales: ['persona'|'facil'|'medio'|'dificil'], sacadas,
    //      mejorTiro, huecos, mapa, conBoliche, jugadores }
    registrar(r) {
      const mensajes = [];
      nuevas = [];
      const nivelAntes = indiceNivel();
      let puntos = PUNTOS.porJugar;
      if (r.gano) {
        puntos += PUNTOS.porGanar;
        for (const rival of r.rivales) puntos += PUNTOS.porRival[rival] || 0;
      }
      puntos += (r.sacadas || 0) * PUNTOS.porSacada + (r.huecos || 0) * PUNTOS.porHueco;

      estado.puntos += puntos;
      estado.partidas += 1;
      if (r.gano) {
        estado.victorias += 1;
        estado.racha += 1;
      } else if (!r.empate) {
        estado.racha = 0;
      }
      mensajes.push(`+${puntos} puntos`);

      // Logros.
      if (r.gano) lograr('primera', mensajes);
      if (r.gano && r.rivales.includes('dificil')) lograr('dificil', mensajes);
      if (r.gano && r.jugadores >= 4) lograr('cuatro', mensajes);
      if (estado.racha >= 3) lograr('racha', mensajes);
      if (r.gano && r.conBoliche) lograr('boliche', mensajes);
      if ((r.mejorTiro || 0) >= 3) lograr('limpio', mensajes);
      if ((r.huecos || 0) > 0) lograr('hueco', mensajes);
      if (r.gano && r.modo === 'cano' && r.mapa && !estado.mapasGanados.includes(r.mapa)) estado.mapasGanados.push(r.mapa);
      if (estado.mapasGanados.length >= cantidadMapas) lograr('mapas', mensajes);

      // Subir de nivel.
      const nivelAhora = indiceNivel();
      for (let i = nivelAntes + 1; i <= nivelAhora; i++) {
        mensajes.push(`¡Subiste de nivel! Ahora eres ${tx(NIVELES[i].titulo)}.`);
        desbloquear(NIVELES[i].premio, mensajes, nombreDe(NIVELES[i].premio));
        mensajes.push(...desbloqueosDeNivel(i + 1));
      }
      guardar();
      return mensajes;
    },

    // Qué falta para desbloquear una bolincha (para la colección).
    comoSeGana(id) {
      if (INICIALES.includes(id)) return 'Desde el principio';
      const n = NIVELES.find((x) => x.premio === id);
      if (n) return `Nivel ${NIVELES.indexOf(n) + 1}: ${tx(n.titulo)}`;
      const l = LOGROS.find((x) => x.premio === id);
      if (l) return `Desafío «${l.nombre}»: ${tx(l.texto)}`;
      return '';
    },

    borrarTodo() {
      estado = vacio();
      guardar();
    },
  };
}

// Todas las bolinchas que se pueden coleccionar, en orden.
export const COLECCION = [...INICIALES, ...NIVELES.map((n) => n.premio).filter(Boolean), ...LOGROS.map((l) => l.premio).filter(Boolean)];
