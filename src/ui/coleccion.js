// Pantalla de Colección: el nivel, todas las bolinchas agrupadas por serie (con filtro
// por rareza), la ficha de cada una con sus estadísticas y su habilidad, el botón "Usar",
// y los desafíos que regalan bolinchas.
import { NIVELES, LOGROS } from '../progreso.js';
import { CATALOGO, SERIES_COLECCION, RAREZAS } from '../catalogo.js';
import { DISENOS } from '../disenos.js';
import { HABILIDADES, lineasDeStats } from '../habilidades.js';
import { vistaPrevia } from '../aspecto.js';
import { tx } from '../textos.js';

const FILTROS = [
  { id: 'todas', nombre: 'Todas' },
  { id: 'comun', nombre: 'Comunes' },
  { id: 'rara', nombre: 'Raras' },
  { id: 'ultra', nombre: 'Ultra raras' },
  { id: 'mias', nombre: 'Las mías' },
];

export function crearPantallaColeccion(progreso, { alBorrar = () => {} } = {}) {
  const $ = (id) => document.getElementById(id);
  const detalle = $('detalle');
  let abierta = null; // la bolincha que se está mirando en la ficha
  let filtro = 'todas';

  // Ficha grande de una bolincha.
  function abrir(id) {
    abierta = id;
    const b = CATALOGO.find((x) => x.id === id);
    const e = progreso.estado;
    const tiene = e.disenos.includes(id);
    const serie = SERIES_COLECCION.find((s) => s.id === b.serie);
    $('detalle-vista').innerHTML = vistaPrevia(id, 130);
    $('detalle-vista').classList.toggle('bloqueada', !tiene);
    $('detalle-rareza').textContent = RAREZAS[b.rareza].nombre;
    $('detalle-rareza').className = `detalle-rareza ${b.rareza}`;
    $('detalle-nombre').textContent = tx(b.nombre);
    $('detalle-serie').textContent = `Serie: ${serie.nombre}`;
    const lineas = lineasDeStats(b.stats);
    $('detalle-stats').replaceChildren(
      ...(lineas.length
        ? lineas.map((l) => {
            const li = document.createElement('li');
            li.innerHTML = '<strong></strong> <span></span><small></small>';
            li.children[0].textContent = l.nombre;
            li.children[1].textContent = l.valor;
            li.children[2].textContent = l.explicacion;
            return li;
          })
        : [Object.assign(document.createElement('li'), { className: 'sin-stats', textContent: 'Sin estadísticas extra: una clásica para lucirse.' })])
    );
    const h = HABILIDADES[b.habilidad];
    $('detalle-habilidad').hidden = !h;
    if (h) $('detalle-habilidad').textContent = `${h.nombre} (${h.tipo === 'activa' ? 'se usa con el botón del rayo' : 'funciona sola'}): ${tx(h.texto)}`;
    const como = progreso.comoSeGana(id);
    $('detalle-como').textContent = tiene ? '' : `Cómo conseguirla: ${como}${como.endsWith('.') ? '' : '.'}`;
    const usar = $('detalle-usar');
    usar.hidden = !tiene;
    usar.disabled = e.elegido === id;
    usar.textContent = e.elegido === id ? 'La estás usando' : 'Usar';
    detalle.hidden = false;
    usar.hidden ? $('detalle-cerrar').focus() : usar.focus();
  }

  function cerrar() {
    detalle.hidden = true;
    abierta = null;
  }

  $('detalle-cerrar').addEventListener('click', cerrar);
  detalle.addEventListener('click', (ev) => ev.target === detalle && cerrar());
  $('detalle-usar').addEventListener('click', () => {
    if (abierta && progreso.elegir(abierta)) {
      const id = abierta;
      dibujar();
      abrir(id);
    }
  });

  function ficha(b, e) {
    const tiene = e.disenos.includes(b.id);
    const boton = document.createElement('button');
    boton.type = 'button';
    boton.className = `ficha ${b.rareza}` + (tiene ? '' : ' bloqueada') + (e.elegido === b.id ? ' elegida' : '');
    boton.innerHTML = vistaPrevia(b.id, 46);
    const nombre = document.createElement('span');
    nombre.textContent = tiene ? tx(b.nombre) : '???';
    const debajo = document.createElement('small');
    if (e.elegido === b.id) debajo.textContent = 'En uso';
    else debajo.textContent = RAREZAS[b.rareza].nombre;
    boton.append(nombre, debajo);
    if (b.habilidad) {
      const marca = document.createElement('i');
      marca.className = 'ficha-marca';
      marca.textContent = '⚡';
      marca.setAttribute('aria-hidden', 'true');
      boton.append(marca);
    }
    boton.setAttribute('aria-label', `${tiene ? tx(b.nombre) : 'Bloqueada'}, ${RAREZAS[b.rareza].nombre}${e.elegido === b.id ? ', en uso' : ''}`);
    boton.addEventListener('click', () => abrir(b.id));
    return boton;
  }

  function dibujar() {
    const n = progreso.nivel();
    const e = progreso.estado;
    $('coleccion-numero').textContent = `Nivel ${n.numero} de ${NIVELES.length}`;
    $('coleccion-titulo').textContent = n.titulo;
    $('coleccion-barra').style.width = Math.round(n.avance * 100) + '%';
    $('coleccion-siguiente').textContent = n.siguiente
      ? `Faltan ${n.siguiente.desde - n.puntos} puntos para ${n.siguiente.titulo}.`
      : 'Llegaste al nivel más alto.';
    $('coleccion-cifras').textContent = `${e.puntos} puntos · ${e.partidas} partidas · ${e.victorias} ganadas`;
    const tienes = CATALOGO.filter((b) => e.disenos.includes(b.id)).length;
    $('coleccion-cuenta').textContent = tx(
      `Tienes ${tienes} de ${CATALOGO.length}. Toca una para ver sus estadísticas; con «Usar» la llevas a tus partidas. Las del rayo ⚡ tienen una habilidad.`
    );

    $('coleccion-filtros').replaceChildren(
      ...FILTROS.map((f) => {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'filtro' + (f.id === filtro ? ' activo' : '');
        b.setAttribute('aria-pressed', String(f.id === filtro));
        b.textContent = f.nombre;
        b.addEventListener('click', () => {
          filtro = f.id;
          dibujar();
        });
        return b;
      })
    );

    const pasa = (b) => (filtro === 'todas' ? true : filtro === 'mias' ? e.disenos.includes(b.id) : b.rareza === filtro);
    $('coleccion-fichas').replaceChildren(
      ...SERIES_COLECCION.flatMap((serie) => {
        const deLaSerie = CATALOGO.filter((b) => b.serie === serie.id);
        const visibles = deLaSerie.filter(pasa);
        if (visibles.length === 0) return [];
        const titulo = document.createElement('h4');
        titulo.className = 'serie-titulo';
        titulo.textContent = `${serie.nombre} · ${deLaSerie.filter((b) => e.disenos.includes(b.id)).length}/${deLaSerie.length}`;
        const grilla = document.createElement('div');
        grilla.className = 'coleccion';
        grilla.append(...visibles.map((b) => ficha(b, e)));
        return [titulo, grilla];
      })
    );

    $('coleccion-desafios').replaceChildren(
      ...LOGROS.map((l) => {
        const hecho = e.logros.includes(l.id);
        const li = document.createElement('li');
        li.className = hecho ? '' : 'pendiente';
        li.innerHTML = '<span aria-hidden="true"></span><strong></strong><small></small>';
        li.children[0].textContent = hecho ? '★' : '☆';
        li.children[1].textContent = l.nombre;
        li.children[2].textContent = tx(l.texto) + (l.premio ? tx(` Regala: ${DISENOS[l.premio].nombre}.`) : '');
        li.setAttribute('aria-label', `${l.nombre}: ${hecho ? 'cumplido' : 'pendiente'}`);
        return li;
      })
    );
  }

  // Borrar el progreso pide un segundo toque: no se puede deshacer.
  const borrar = $('coleccion-borrar');
  let reloj = 0;
  borrar.addEventListener('click', () => {
    if (borrar.dataset.confirmar) {
      clearTimeout(reloj);
      delete borrar.dataset.confirmar;
      borrar.textContent = 'Borrar mi progreso';
      progreso.borrarTodo();
      alBorrar();
      dibujar();
      return;
    }
    borrar.dataset.confirmar = '1';
    borrar.textContent = '¿Seguro? Se pierde todo. Toca otra vez';
    reloj = setTimeout(() => {
      delete borrar.dataset.confirmar;
      borrar.textContent = 'Borrar mi progreso';
    }, 4000);
  });

  return {
    dibujar,
    cerrar,
    abrir,
    get abierta() {
      return !detalle.hidden;
    },
  };
}
