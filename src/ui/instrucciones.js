// Instrucciones de cada modo: se muestran la primera vez que se juega,
// y después solo las novedades de dificultad que trae cada nivel nuevo.
import { REGLAS, NOVEDADES, NOMBRES_MODOS, NOVEDADES_DE } from '../reglas.js';
import { tx } from '../textos.js';

const CLAVE = 'ojo-de-gato.instrucciones';

// nivel(): número del nivel actual de quien juega (1 = el primero).
export function crearInstrucciones({ hud, nivel }) {
  let vistas = new Set();
  try {
    const guardadas = JSON.parse(localStorage.getItem(CLAVE));
    if (Array.isArray(guardadas)) vistas = new Set(guardadas);
  } catch {
    // sin almacenamiento: se vuelven a mostrar en cada partida nueva
  }
  const marcar = (ids) => {
    ids.forEach((id) => vistas.add(id));
    try {
      localStorage.setItem(CLAVE, JSON.stringify([...vistas]));
    } catch {
      // no se pudo recordar
    }
  };
  const novedadesDe = (modo) => NOVEDADES.filter((n) => n.modo === (NOVEDADES_DE[modo] || modo) && n.nivel <= nivel());
  const reglasExtra = (modo) => novedadesDe(modo).filter((n) => !n.soloAviso);

  function tarjetaReglas(modo, extra, boton, alCerrar) {
    hud.tarjeta({
      titulo: 'Cómo se juega',
      subtitulo: tx(NOMBRES_MODOS[modo]),
      lista: [...REGLAS[modo], ...extra.map((n) => n.texto)].map(tx),
      botones: [{ texto: boton, alElegir: alCerrar }],
    });
  }

  return {
    // Antes de empezar una partida: explica lo que todavía no se vio y después sigue.
    antesDeJugar(modo, seguir) {
      let pendientes = novedadesDe(modo).filter((n) => !vistas.has(n.id));
      const mostrarSiguiente = (i) => {
        if (i >= pendientes.length) {
          seguir();
          return;
        }
        const n = pendientes[i];
        hud.tarjeta({
          titulo: tx(n.titulo),
          subtitulo: `Nuevo en ${tx(NOMBRES_MODOS[modo])} · Nivel ${n.nivel}`,
          texto: tx(n.texto),
          botones: [
            {
              texto: i + 1 < pendientes.length ? 'Siguiente' : '¡A jugar!',
              alElegir: () => {
                marcar([n.id]);
                mostrarSiguiente(i + 1);
              },
            },
          ],
        });
      };
      if (!vistas.has(modo)) {
        // Primera vez: las reglas, con las dificultades que ya trae el nivel actual incluidas.
        // Después, los avisos (mapas nuevos) que haya.
        const reglas = pendientes.filter((n) => !n.soloAviso);
        tarjetaReglas(modo, reglas, '¡A jugar!', () => {
          marcar([modo, ...reglas.map((n) => n.id)]);
          pendientes = pendientes.filter((n) => n.soloAviso);
          mostrarSiguiente(0);
        });
        return;
      }
      mostrarSiguiente(0);
    },

    // Para volver a leer las reglas cuando se quiera (incluye las novedades ya alcanzadas).
    mostrarReglas(modo, alCerrar) {
      tarjetaReglas(modo, reglasExtra(modo), 'Entendido', alCerrar);
    },

    // Las reglas completas de un modo, ya con las palabras del país (para la pantalla "Reglas").
    reglasDe: (modo) => [...REGLAS[modo], ...reglasExtra(modo).map((n) => n.texto)].map(tx),

    borrar() {
      vistas = new Set();
      marcar([]);
    },
  };
}
