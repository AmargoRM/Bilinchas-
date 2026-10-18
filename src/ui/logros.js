// Pantalla de Logros: nivel, colección de bolinchas para elegir y lista de logros.
import { NIVELES, LOGROS, COLECCION } from '../progreso.js';
import { DISENOS } from '../disenos.js';
import { vistaPrevia } from '../aspecto.js';
import { tx } from '../textos.js';

export function crearPantallaLogros(progreso) {
  const $ = (id) => document.getElementById(id);

  function dibujar() {
    const n = progreso.nivel();
    const e = progreso.estado;
    $('logros-numero').textContent = `Nivel ${n.numero} de ${NIVELES.length}`;
    $('logros-titulo').textContent = n.titulo;
    $('logros-barra').style.width = Math.round(n.avance * 100) + '%';
    $('logros-siguiente').textContent = n.siguiente
      ? `Faltan ${n.siguiente.desde - n.puntos} puntos para ${n.siguiente.titulo}.`
      : 'Llegaste al nivel más alto.';
    $('logros-cifras').textContent = `${e.puntos} puntos · ${e.partidas} partidas · ${e.victorias} ganadas`;

    $('logros-coleccion').replaceChildren(
      ...COLECCION.map((id) => {
        const tiene = e.disenos.includes(id);
        const ficha = document.createElement('button');
        ficha.type = 'button';
        ficha.className = 'ficha' + (tiene ? '' : ' bloqueada') + (e.elegido === id ? ' elegida' : '');
        ficha.disabled = !tiene;
        ficha.setAttribute('aria-pressed', String(e.elegido === id));
        ficha.innerHTML = vistaPrevia(id, 52);
        const nombre = document.createElement('span');
        nombre.textContent = tx(DISENOS[id].nombre);
        const detalle = document.createElement('small');
        detalle.textContent = e.elegido === id ? tx('Tu {bolincha}') : tiene ? 'Tocar para usar' : progreso.comoSeGana(id);
        ficha.append(nombre, detalle);
        ficha.addEventListener('click', () => {
          if (progreso.elegir(id)) dibujar();
        });
        return ficha;
      })
    );

    $('logros-lista').replaceChildren(
      ...LOGROS.map((l) => {
        const hecho = e.logros.includes(l.id);
        const li = document.createElement('li');
        li.className = hecho ? '' : 'pendiente';
        li.innerHTML = '<span aria-hidden="true"></span><strong></strong><small></small>';
        li.children[0].textContent = hecho ? '★' : '☆';
        li.children[1].textContent = l.nombre;
        li.children[2].textContent = tx(l.texto) + (l.premio ? ` Premio: ${tx(DISENOS[l.premio].nombre)}.` : '');
        li.setAttribute('aria-label', `${l.nombre}: ${hecho ? 'logrado' : 'pendiente'}`);
        return li;
      })
    );
  }

  // Borrar el progreso pide un segundo toque: no se puede deshacer.
  const borrar = $('logros-borrar');
  let reloj = 0;
  borrar.addEventListener('click', () => {
    if (borrar.dataset.confirmar) {
      clearTimeout(reloj);
      delete borrar.dataset.confirmar;
      borrar.textContent = 'Borrar mi progreso';
      progreso.borrarTodo();
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

  return { dibujar };
}
