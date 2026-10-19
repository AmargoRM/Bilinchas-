// Pantalla de la Ruleta diaria: una rueda de 20 casillas (15 comunes, 4 raras y
// 1 ultra rara, o sea 75 %, 20 % y 5 %). Se gira una vez por día; el premio lo decide
// progreso.girarRuleta() y la rueda frena en una casilla de esa rareza.
import { CATALOGO, RAREZAS } from '../catalogo.js';
import { HABILIDADES, lineasDeStats } from '../habilidades.js';
import { vistaPrevia } from '../aspecto.js';
import { tx } from '../textos.js';

const CASILLAS = 20;
// Qué rareza tiene cada casilla (repartidas para que las raras queden separadas).
const RAREZA_CASILLA = Array.from({ length: CASILLAS }, (_, i) => (i === 0 ? 'ultra' : [5, 10, 14, 17].includes(i) ? 'rara' : 'comun'));
const COLORES = { comun: ['#2f8f86', '#256f69'], rara: ['#7d45d0', '#7d45d0'], ultra: ['#f2cf4a', '#f2cf4a'] };

// La fecha de hoy en este teléfono, como texto ('2026-10-19').
export function hoy() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function crearPantallaRuleta(progreso, { alUsar = () => {}, alVerColeccion = () => {}, sonido = null } = {}) {
  const $ = (id) => document.getElementById(id);
  const rueda = $('ruleta-rueda');
  const boton = $('ruleta-girar');
  let giro = 0; // grados acumulados (la rueda siempre gira hacia adelante)
  let girando = false;
  let premio = null;

  // Dibuja las casillas: cada una con una bolincha chiquita del color de su rareza.
  const paso = 360 / CASILLAS;
  const punto = (ang, r) => {
    const a = ((ang - 90) * Math.PI) / 180;
    return [Math.cos(a) * r, Math.sin(a) * r];
  };
  rueda.innerHTML =
    RAREZA_CASILLA.map((r, i) => {
      const [x1, y1] = punto(i * paso, 96);
      const [x2, y2] = punto((i + 1) * paso, 96);
      const [cx, cy] = punto((i + 0.5) * paso, 72);
      const color = COLORES[r][i % 2];
      return `<path d="M0 0L${x1.toFixed(2)} ${y1.toFixed(2)}A96 96 0 0 1 ${x2.toFixed(2)} ${y2.toFixed(2)}Z" fill="${color}" stroke="#0c2422" stroke-width="1.5"/><circle cx="${cx.toFixed(2)}" cy="${cy.toFixed(2)}" r="6" fill="#fbf8f0" opacity=".85"/>`;
    }).join('') +
    '<circle r="96" fill="none" stroke="#fbf8f0" stroke-width="3"/><circle r="16" fill="#0c2422" stroke="#fbf8f0" stroke-width="3"/>';

  function mostrarEstado() {
    const libre = progreso.ruletaDisponible(hoy());
    boton.disabled = !libre || girando;
    boton.textContent = girando ? 'Girando…' : libre ? 'Girar' : 'Ya giraste hoy';
    if (libre) {
      $('ruleta-espera').textContent = '';
    } else {
      const ahora = new Date();
      const manana = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate() + 1);
      const minutos = Math.ceil((manana - ahora) / 60000);
      $('ruleta-espera').textContent = `Vuelve mañana: faltan ${Math.floor(minutos / 60)} h ${minutos % 60} min.`;
    }
  }

  function mostrarPremio(r) {
    const box = $('ruleta-premio');
    box.hidden = false;
    if (!r.id) {
      $('ruleta-vista').innerHTML = '';
      $('ruleta-rareza').textContent = RAREZAS[r.rareza].nombre;
      $('ruleta-rareza').className = `detalle-rareza ${r.rareza}`;
      $('ruleta-nombre').textContent = `+${r.puntos} puntos`;
      $('ruleta-stats').replaceChildren();
      $('ruleta-habilidad').textContent = tx('¡Ya tienes todas {las} {bolinchas}! Te llevas puntos.');
      $('ruleta-usar').hidden = true;
      return;
    }
    const b = CATALOGO.find((x) => x.id === r.id);
    $('ruleta-vista').innerHTML = vistaPrevia(b.id, 110);
    $('ruleta-rareza').textContent = RAREZAS[b.rareza].nombre;
    $('ruleta-rareza').className = `detalle-rareza ${b.rareza}`;
    $('ruleta-nombre').textContent = tx(b.nombre);
    $('ruleta-stats').replaceChildren(
      ...lineasDeStats(b.stats).map((l) => {
        const li = document.createElement('li');
        li.innerHTML = '<strong></strong> <span></span><small></small>';
        li.children[0].textContent = l.nombre;
        li.children[1].textContent = l.valor;
        li.children[2].textContent = l.explicacion;
        return li;
      })
    );
    const h = HABILIDADES[b.habilidad];
    $('ruleta-habilidad').textContent = h ? `${h.nombre}: ${tx(h.texto)}` : '';
    $('ruleta-usar').hidden = false;
    $('ruleta-usar').disabled = false;
    $('ruleta-usar').textContent = 'Usar';
  }

  boton.addEventListener('click', () => {
    if (girando) return;
    const r = progreso.girarRuleta(hoy());
    if (!r) {
      mostrarEstado();
      return;
    }
    premio = r;
    girando = true;
    $('ruleta-premio').hidden = true;
    mostrarEstado();
    // Una casilla al azar de la rareza que salió, y unas vueltas antes de llegar.
    const casillas = RAREZA_CASILLA.map((x, i) => (x === r.rareza ? i : -1)).filter((i) => i >= 0);
    const k = casillas[Math.floor(Math.random() * casillas.length)];
    const centro = (k + 0.5) * paso + (Math.random() - 0.5) * paso * 0.6;
    const destino = 360 - centro;
    giro += 360 * 6 + ((destino - (giro % 360) + 360) % 360);
    rueda.style.transform = `rotate(${giro}deg)`;
    sonido?.tiro(0.6);
    // Por si el teléfono no anima (ahorro de batería): igual se muestra el premio.
    setTimeout(alParar, 5300);
  });

  function alParar() {
    if (!girando) return;
    girando = false;
    sonido?.victoria();
    mostrarEstado();
    if (premio) {
      mostrarPremio(premio);
      $('ruleta-premio').scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }
  rueda.addEventListener('transitionend', alParar);

  $('ruleta-usar').addEventListener('click', () => {
    if (!premio?.id) return;
    progreso.elegir(premio.id);
    alUsar(premio.id);
    $('ruleta-usar').disabled = true;
    $('ruleta-usar').textContent = 'La estás usando';
  });
  $('ruleta-coleccion').addEventListener('click', () => alVerColeccion(premio?.id));

  return {
    dibujar() {
      if (!girando) $('ruleta-premio').hidden = true;
      mostrarEstado();
    },
    disponible: () => progreso.ruletaDisponible(hoy()),
  };
}
