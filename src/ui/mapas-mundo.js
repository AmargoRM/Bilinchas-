// Pantalla "Mapas": una tarjeta ilustrada por lugar (su escena y su recorrido), ordenadas
// por nivel. Los bloqueados se ven apagados, con candado y el nivel que piden.
// Tocando una se ve su ficha, con la ilustración grande.
import { MAPAS, MAPAS_CIRCULO } from '../mapas.js';
import { NIVELES } from '../progreso.js';
import { trazarMapa } from '../escenario/canal.js';
import { tx } from '../textos.js';
import { ilustracionMapa } from './ilustraciones-mapas.js';

export function crearPantallaMapas({ nivel, puntos, alJugar }) {
  const $ = (id) => document.getElementById(id);
  const lienzo = $('mapas-mundo');
  const ficha = $('mapas-ficha');
  const todos = [
    ...MAPAS_CIRCULO.map((m) => ({ ...m, modo: 'circulo', nombreModo: 'Círculo' })),
    ...MAPAS.map((m) => ({ ...m, modo: 'cano', nombreModo: tx('{Caño}') })),
  ];

  function abrir(m) {
    const n = nivel();
    const bloqueado = (m.nivel || 1) > n;
    $('mapas-ficha-mini').innerHTML = ilustracionMapa(m, { bloqueado });
    $('mapas-ficha-nombre').textContent = m.nombre;
    $('mapas-ficha-modo').textContent = `${m.nombreModo} · nivel ${m.nivel || 1}${m.modo === 'cano' ? ` · ${(trazarMapa(m).largo / 100).toFixed(0)} m` : ''}`;
    $('mapas-ficha-texto').textContent = tx(m.descripcion);
    const jugar = $('mapas-ficha-jugar');
    if (bloqueado) {
      const falta = NIVELES[(m.nivel || 1) - 1].desde - puntos();
      $('mapas-ficha-candado').textContent = `🔒 Se desbloquea en el nivel ${m.nivel}: te faltan ${Math.max(falta, 0)} puntos.`;
      jugar.hidden = true;
    } else {
      $('mapas-ficha-candado').textContent = '';
      jugar.hidden = false;
      jugar.onclick = () => {
        cerrar();
        alJugar(m);
      };
    }
    ficha.hidden = false;
  }

  function cerrar() {
    ficha.hidden = true;
  }
  $('mapas-ficha-cerrar').addEventListener('click', cerrar);
  ficha.addEventListener('click', (e) => e.target === ficha && cerrar());

  function dibujar() {
    const n = nivel();
    const orden = [...todos].sort((a, b) => (a.nivel || 1) - (b.nivel || 1) || (a.modo === 'circulo' ? -1 : 1));
    const tienes = todos.filter((m) => (m.nivel || 1) <= n).length;
    $('mapas-nivel').textContent = `Estás en el nivel ${n}. Tienes ${tienes} de ${todos.length} lugares.`;
    lienzo.replaceChildren(
      ...orden.map((m) => {
        const bloqueado = (m.nivel || 1) > n;
        const b = document.createElement('button');
        b.type = 'button';
        b.className = `mapa-tarjeta${bloqueado ? ' bloqueado' : ''}`;
        b.setAttribute('aria-label', `${m.nombre}, ${m.nombreModo}${bloqueado ? `, bloqueado hasta el nivel ${m.nivel}` : ''}`);
        b.innerHTML = `${ilustracionMapa(m, { bloqueado })}<span class="mapa-tarjeta-pie"><strong></strong><small></small></span>${bloqueado ? `<span class="mapa-tarjeta-candado">🔒 Nivel ${m.nivel}</span>` : ''}`;
        b.querySelector('strong').textContent = m.nombre;
        b.querySelector('small').textContent = `${m.modo === 'circulo' ? '◎' : '≋'} ${m.nombreModo}`;
        b.addEventListener('click', () => abrir(m));
        return b;
      })
    );
  }

  return { dibujar, cerrar, get abierta() { return !ficha.hidden; } };
}
