// Pantalla para elegir la partida, con dibujos y pocas palabras:
// el mapa (con su ilustración y flechas), contra quién (caritas Fácil, Medio, Difícil
// o Amigos), cuántos rivales y un solo botón grande para jugar. Las reglas, en el «?».
import { ilustracionMapa } from './ilustraciones-mapas.js';
import { tx } from '../textos.js';

const CARAS = {
  facil: `<svg viewBox="0 0 48 48" aria-hidden="true"><circle cx="24" cy="24" r="20" fill="#7cc04a"/><circle cx="17" cy="21" r="3" fill="#0c2422"/><circle cx="31" cy="21" r="3" fill="#0c2422"/><path d="M15 29 q9 8 18 0" stroke="#0c2422" stroke-width="3" fill="none" stroke-linecap="round"/></svg>`,
  medio: `<svg viewBox="0 0 48 48" aria-hidden="true"><circle cx="24" cy="24" r="20" fill="#f2cf4a"/><circle cx="17" cy="21" r="3" fill="#0c2422"/><circle cx="31" cy="21" r="3" fill="#0c2422"/><path d="M16 31 h16" stroke="#0c2422" stroke-width="3" stroke-linecap="round"/></svg>`,
  dificil: `<svg viewBox="0 0 48 48" aria-hidden="true"><circle cx="24" cy="24" r="20" fill="#e2523d"/><path d="M12 15 l9 5 M36 15 l-9 5" stroke="#0c2422" stroke-width="3" stroke-linecap="round"/><circle cx="17" cy="23" r="3" fill="#0c2422"/><circle cx="31" cy="23" r="3" fill="#0c2422"/><path d="M15 34 q9 -7 18 0" stroke="#0c2422" stroke-width="3" fill="none" stroke-linecap="round"/></svg>`,
  amigos: `<svg viewBox="0 0 48 48" aria-hidden="true"><circle cx="17" cy="18" r="7" fill="#3b9be0"/><path d="M5 40 a12 12 0 0 1 24 0z" fill="#3b9be0"/><circle cx="32" cy="18" r="7" fill="#e2523d"/><path d="M20 40 a12 12 0 0 1 24 0z" fill="#e2523d"/></svg>`,
};
const RIVALES = [
  { valor: 'facil', texto: 'Fácil' },
  { valor: 'medio', texto: 'Medio' },
  { valor: 'dificil', texto: 'Difícil' },
  { valor: 'amigos', texto: 'Amigos' },
];
// Colores de los lugares 2, 3 y 4 (los mismos de src/jugadores.js).
const COLORES_RIVALES = ['#e2523d', '#f0c43a', '#a46ee6'];

export function crearPantallaPartida() {
  const raiz = document.createElement('div');
  raiz.id = 'partida';
  raiz.className = 'partida-fondo';
  raiz.hidden = true;
  raiz.innerHTML = `
    <div class="partida" role="dialog" aria-modal="true" aria-labelledby="partida-titulo">
      <div class="partida-cabeza">
        <button type="button" class="partida-redondo" data-volver aria-label="Volver"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 12H5M11 5l-7 7 7 7"/></svg></button>
        <h2 id="partida-titulo" class="partida-titulo"></h2>
        <button type="button" class="partida-redondo" data-reglas aria-label="Cómo se juega">?</button>
      </div>
      <div class="partida-mapa">
        <div class="partida-dibujo"></div>
        <span class="partida-mapa-nombre"></span>
        <span class="partida-candado" hidden></span>
        <button type="button" class="partida-flecha izquierda" data-mapa="-1" aria-label="Mapa anterior">‹</button>
        <button type="button" class="partida-flecha derecha" data-mapa="1" aria-label="Mapa siguiente">›</button>
      </div>
      <div class="partida-puntos" aria-hidden="true"></div>
      <p class="partida-rotulo">Contra quién</p>
      <div class="partida-rivales" role="radiogroup" aria-label="Contra quién"></div>
      <p class="partida-rotulo" data-cuantos-rotulo></p>
      <div class="partida-cuantos" role="radiogroup"></div>
      <button type="button" class="partida-jugar" data-jugar></button>
    </div>`;
  document.body.appendChild(raiz);
  const $ = (s) => raiz.querySelector(s);

  let actual = null; // las opciones de la última vez que se mostró

  // Dibuja todo según "actual".
  function pintar() {
    const o = actual;
    const lista = [...o.mapas].sort((a, b) => (a.nivel || 1) - (b.nivel || 1));
    const i = Math.max(lista.findIndex((m) => m.id === o.mapaId), 0);
    const m = lista[i];
    const bloqueado = (m.nivel || 1) > o.nivel;
    $('#partida-titulo').textContent = tx(o.titulo);
    $('.partida-dibujo').innerHTML = ilustracionMapa({ ...m, modo: o.modoMapa || m.modo }, { bloqueado });
    $('.partida-mapa-nombre').textContent = m.nombre;
    $('.partida-candado').hidden = !bloqueado;
    $('.partida-candado').textContent = `🔒 Nivel ${m.nivel}`;
    $('[data-mapa="-1"]').hidden = lista.length < 2;
    $('[data-mapa="1"]').hidden = lista.length < 2;
    $('.partida-puntos').innerHTML = lista.length < 2 ? '' : lista.map((x, k) => `<i class="${k === i ? 'si' : ''}"></i>`).join('');
    $('.partida-mapa').dataset.indice = i;
    $('.partida-mapa').dataset.total = lista.length;

    $('.partida-rivales').replaceChildren(
      ...RIVALES.map((r) => {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'partida-rival' + (o.rival === r.valor ? ' si' : '');
        b.setAttribute('role', 'radio');
        b.setAttribute('aria-checked', String(o.rival === r.valor));
        b.innerHTML = `${CARAS[r.valor]}<span>${r.texto}</span>`;
        b.addEventListener('click', () => cambiar({ rival: r.valor }));
        return b;
      })
    );
    $('[data-cuantos-rotulo]').textContent = o.rival === 'amigos' ? 'Cuántos amigos' : 'Cuántos rivales';
    $('.partida-cuantos').replaceChildren(
      ...COLORES_RIVALES.map((color, k) => {
        const n = k + 1;
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'partida-bola' + (n <= o.cuantos ? ' si' : '');
        b.style.setProperty('--color', color);
        b.setAttribute('role', 'radio');
        b.setAttribute('aria-checked', String(n === o.cuantos));
        b.setAttribute('aria-label', String(n));
        b.textContent = String(n);
        b.addEventListener('click', () => cambiar({ cuantos: n }));
        return b;
      })
    );
    const jugar = $('[data-jugar]');
    jugar.disabled = bloqueado;
    jugar.innerHTML = bloqueado ? `🔒 Nivel ${m.nivel}` : '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 4l13 8-13 8z"/></svg>Jugar';
  }

  function cambiar(cambio) {
    Object.assign(actual, cambio);
    actual.alCambiar?.({ rival: actual.rival, cuantos: actual.cuantos });
    pintar();
  }

  function cerrar() {
    raiz.hidden = true;
  }

  raiz.addEventListener('click', (e) => {
    if (!actual) return;
    const flecha = e.target.closest('[data-mapa]');
    if (flecha) {
      const caja = $('.partida-mapa');
      const total = Number(caja.dataset.total);
      const i = (Number(caja.dataset.indice) + Number(flecha.dataset.mapa) + total) % total;
      const lista = [...actual.mapas].sort((a, b) => (a.nivel || 1) - (b.nivel || 1));
      actual.mapaId = lista[i].id;
      pintar();
      actual.alCambiarMapa?.(lista[i].id);
      return;
    }
    if (e.target.closest('[data-volver]')) {
      cerrar();
      actual.alVolver?.();
    } else if (e.target.closest('[data-reglas]')) {
      cerrar();
      actual.alReglas?.();
    } else if (e.target.closest('[data-jugar]')) {
      cerrar();
      actual.alJugar?.();
    }
  });

  // Deslizar el dibujo del mapa a los costados también cambia de mapa.
  let inicioX = null;
  $('.partida-mapa').addEventListener('pointerdown', (e) => (inicioX = e.clientX));
  $('.partida-mapa').addEventListener('pointerup', (e) => {
    if (inicioX === null) return;
    const dx = e.clientX - inicioX;
    inicioX = null;
    if (Math.abs(dx) > 40) $(`[data-mapa="${dx < 0 ? 1 : -1}"]`).click();
  });

  return {
    // opciones: { titulo, mapas, mapaId, nivel, modoMapa, rival, cuantos,
    //             alCambiarMapa(id), alCambiar({ rival, cuantos }), alJugar, alReglas, alVolver }
    mostrar(opciones) {
      actual = { ...opciones };
      pintar();
      raiz.hidden = false;
    },
    cerrar,
    get abierta() {
      return !raiz.hidden;
    },
    // Flecha "atrás" del teléfono.
    volver() {
      cerrar();
      actual?.alVolver?.();
    },
  };
}

// Una sola pantalla para todos los modos (se crea la primera vez que se usa).
let unica = null;
export function pantallaPartida() {
  if (!unica) unica = crearPantallaPartida();
  return unica;
}
