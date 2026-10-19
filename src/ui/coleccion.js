// Pantalla de Colección: el nivel, todas las bolinchas (las que tienes y las que faltan),
// la ficha de cada una con su poder y el botón "Usar", y los desafíos que regalan bolinchas.
import { NIVELES, LOGROS, COLECCION } from '../progreso.js';
import { DISENOS } from '../disenos.js';
import { PODERES, RAREZAS, rarezaDe } from '../poderes.js';
import { vistaPrevia } from '../aspecto.js';
import { tx } from '../textos.js';

export function crearPantallaColeccion(progreso, { alBorrar = () => {} } = {}) {
  const $ = (id) => document.getElementById(id);
  const detalle = $('detalle');
  let abierta = null; // la bolincha que se está mirando en la ficha

  // Ficha grande de una bolincha.
  function abrir(id) {
    abierta = id;
    const d = DISENOS[id];
    const e = progreso.estado;
    const tiene = e.disenos.includes(id);
    const rareza = rarezaDe(d);
    const poder = PODERES[d.poder];
    $('detalle-vista').innerHTML = vistaPrevia(id, 130);
    $('detalle-vista').classList.toggle('bloqueada', !tiene);
    $('detalle-rareza').textContent = RAREZAS[rareza];
    $('detalle-rareza').className = `detalle-rareza ${rareza}`;
    $('detalle-nombre').textContent = tx(d.nombre);
    $('detalle-poder').textContent = poder ? `Poder: ${poder.nombre}. ${tx(poder.texto)}` : 'Sin poder: una clásica para lucirse.';
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
    const tienes = COLECCION.filter((id) => e.disenos.includes(id)).length;
    $('coleccion-cuenta').textContent = tx(`Tienes ${tienes} de ${COLECCION.length}. Toca una para verla; con «Usar» la llevas a tus partidas. Las raras tienen un poder.`);

    $('coleccion-fichas').replaceChildren(
      ...COLECCION.map((id) => {
        const d = DISENOS[id];
        const tiene = e.disenos.includes(id);
        const rareza = rarezaDe(d);
        const ficha = document.createElement('button');
        ficha.type = 'button';
        ficha.className = `ficha ${rareza}` + (tiene ? '' : ' bloqueada') + (e.elegido === id ? ' elegida' : '');
        ficha.innerHTML = vistaPrevia(id, 52);
        const nombre = document.createElement('span');
        nombre.textContent = tiene ? tx(d.nombre) : '???';
        const detalleFicha = document.createElement('small');
        if (e.elegido === id) detalleFicha.textContent = 'En uso';
        else if (!tiene) detalleFicha.textContent = 'Bloqueada';
        else detalleFicha.textContent = d.poder ? PODERES[d.poder].nombre : 'Común';
        ficha.append(nombre, detalleFicha);
        if (rareza !== 'comun') {
          const marca = document.createElement('i');
          marca.className = 'ficha-marca';
          marca.textContent = rareza === 'legendaria' ? '★' : '⚡';
          marca.setAttribute('aria-hidden', 'true');
          ficha.append(marca);
        }
        ficha.setAttribute('aria-label', `${tiene ? tx(d.nombre) : 'Bloqueada'}${e.elegido === id ? ', en uso' : ''}`);
        ficha.addEventListener('click', () => abrir(id));
        return ficha;
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

  return { dibujar, cerrar, get abierta() { return !detalle.hidden; } };
}
