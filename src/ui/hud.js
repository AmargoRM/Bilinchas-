// La información en pantalla: marcador, barra de fuerza, avisos, tarjetas y botones.
import { tx } from '../textos.js';
const AYUDA_TIRO = 'Toca tu {bolincha} y arrastra hacia atrás para tirar.\nArrastra en otro lado para mirar; pellizca para acercar.';
// Después de esta cantidad de tiros, la ayuda de cómo tirar deja de aparecer.
const TIROS_CON_AYUDA = 2;

export function crearHud() {
  const $ = (id) => document.getElementById(id);
  const barra = $('barra-tiro');
  const relleno = $('barra-relleno');
  const taco = $('barra-taco');
  const numero = $('barra-numero');
  const ayuda = $('ayuda');
  const cargando = $('cargando');
  const aviso = $('aviso');
  const tarjeta = $('tarjeta');

  let enMapa = false;
  let apuntando = false;
  let quiereAyudaTiro = false;
  let tirosHechos = 0;
  let relojAviso = 0;

  function mostrarAyuda() {
    let texto = null;
    if (enMapa) texto = null;
    else if (quiereAyudaTiro && !apuntando && tirosHechos < TIROS_CON_AYUDA) texto = tx(AYUDA_TIRO);
    ayuda.hidden = !texto;
    if (texto) ayuda.textContent = texto;
  }

  return {
    // Muestra la fuerza de 0 a 1 en la barra de la derecha, o la oculta con null.
    // (La barra solo muestra: la fuerza se elige arrastrando la bolincha.)
    fuerza(valor) {
      apuntando = valor !== null;
      mostrarAyuda();
      barra.hidden = valor === null;
      const v = valor ?? 0;
      const pct = Math.round(v * 100);
      relleno.style.height = pct + '%';
      taco.style.top = pct + '%';
      relleno.classList.toggle('alta', v >= 0.75 && v < 1);
      relleno.classList.toggle('maxima', v >= 1);
      numero.textContent = pct + ' %';
    },


    // true cuando el jugador puede tirar; false cuando acaba de tirar.
    ayudaDeTiro(si) {
      if (!si && quiereAyudaTiro) tirosHechos++;
      quiereAyudaTiro = si;
      mostrarAyuda();
    },

    // Una fila por jugador (color, nombre y valor), quién tira, y una línea de detalle abajo.
    // jugadores: [{ nombre, color, valor }]; turno: índice del que tira (o null).
    marcador({ jugadores, turno, detalle }) {
      const filas = $('marcador-filas');
      while (filas.children.length < jugadores.length) {
        const fila = document.createElement('div');
        fila.className = 'marcador-fila';
        fila.innerHTML = '<span class="marcador-punto"></span><span class="marcador-nombre"></span><span class="marcador-puntos"></span>';
        filas.appendChild(fila);
      }
      while (filas.children.length > jugadores.length) filas.lastChild.remove();
      jugadores.forEach((j, i) => {
        const fila = filas.children[i];
        fila.querySelector('.marcador-punto').style.background = j.color;
        fila.querySelector('.marcador-nombre').textContent = j.nombre;
        fila.querySelector('.marcador-puntos').textContent = j.valor;
        fila.classList.toggle('activo', i === turno);
      });
      $('marcador-quedan').textContent = detalle;
    },

    // Mensaje corto que desaparece solo.
    aviso(texto) {
      aviso.textContent = texto;
      aviso.hidden = false;
      clearTimeout(relojAviso);
      relojAviso = setTimeout(() => (aviso.hidden = true), 2600);
    },

    // Tarjeta en el centro que espera a que el jugador toque un botón.
    // botones: [{ texto, alElegir, secundario }]
    // selectores: [{ etiqueta, color, opciones: [{ valor, texto }], valor, alCambiar, extra }]
    //   cada selector es un botón que pasa a la opción siguiente al tocarlo.
    //   "extra" (opcional) es un segundo botón más chico con sus propias opciones.
    tarjeta({ titulo, subtitulo = '', texto = '', lista = [], pregunta = '', selectores = [], botones, color = null }) {
      $('tarjeta-titulo').textContent = titulo;
      $('tarjeta-titulo').style.color = color || '';
      $('tarjeta-subtitulo').textContent = subtitulo;
      $('tarjeta-subtitulo').hidden = !subtitulo;
      $('tarjeta-texto').textContent = texto;
      $('tarjeta-texto').hidden = !texto;
      const ul = $('tarjeta-lista');
      ul.replaceChildren(
        ...lista.map((t) => {
          const li = document.createElement('li');
          li.textContent = t;
          return li;
        })
      );
      ul.hidden = lista.length === 0;
      const cajaSel = $('tarjeta-selectores');
      cajaSel.replaceChildren(
        ...selectores.map((s, k) => {
          const fila = document.createElement('div');
          fila.className = 'selector';
          const etiqueta = document.createElement('span');
          etiqueta.className = 'selector-etiqueta';
          if (s.color) {
            const punto = document.createElement('span');
            punto.className = 'marcador-punto';
            punto.style.background = s.color;
            etiqueta.appendChild(punto);
          }
          etiqueta.append(s.etiqueta);
          // Un botón que recorre las opciones; devuelve también cómo saber qué tiene elegido.
          const boton = (def, id, clase) => {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.id = id;
            btn.className = 'boton ' + clase;
            let i = Math.max(def.opciones.findIndex((o) => o.valor === def.valor), 0);
            const mostrar = () => {
              btn.textContent = def.opciones[i].texto;
              btn.classList.toggle('apagado', def.opciones[i].valor === 'nadie');
            };
            mostrar();
            btn.addEventListener('click', () => {
              i = (i + 1) % def.opciones.length;
              mostrar();
              def.alCambiar(def.opciones[i].valor);
              if (alCambiarFila) alCambiarFila();
            });
            return { btn, valor: () => def.opciones[i].valor };
          };
          let alCambiarFila = null;
          const principal = boton(s, 'selector-' + k, 'selector-boton');
          fila.append(etiqueta, principal.btn);
          if (s.extra) {
            const extra = boton(s.extra, 'selector-' + k + '-extra', 'selector-boton selector-extra');
            fila.append(extra.btn);
            fila.classList.add('con-extra');
            // Si el lugar queda vacío, el tamaño no importa: se apaga.
            alCambiarFila = () => {
              extra.btn.disabled = principal.valor() === 'nadie';
            };
            alCambiarFila();
          }
          return fila;
        })
      );
      cajaSel.hidden = selectores.length === 0;
      $('tarjeta-pregunta').textContent = pregunta;
      $('tarjeta-pregunta').hidden = !pregunta;
      const caja = $('tarjeta-botones');
      caja.replaceChildren(
        ...botones.map((b) => {
          const btn = document.createElement('button');
          btn.type = 'button';
          btn.className = 'boton ' + (b.secundario ? 'boton-secundario' : 'boton-principal');
          btn.textContent = b.texto;
          btn.addEventListener('click', () => {
            tarjeta.hidden = true;
            b.alElegir();
          });
          return btn;
        })
      );
      aviso.hidden = true;
      tarjeta.hidden = false;
    },

    // Botón de la vista desde arriba.
    mostrarBotonMapa(si) {
      $('btn-mapa').hidden = !si;
    },
    vistaMapa(activa) {
      enMapa = activa;
      mostrarAyuda();
      $('btn-mapa').setAttribute('aria-pressed', String(activa));
    },
    alMapa(fn) {
      $('btn-mapa').addEventListener('click', fn);
    },

    cerrarTarjeta() {
      tarjeta.hidden = true;
    },

    // Muestra u oculta todo lo del juego (marcador, botones) mientras se ve el menú.
    mostrar(si) {
      $('hud').hidden = !si;
      if (!si) {
        aviso.hidden = true;
        barra.hidden = true;
      }
    },

    // "Menú" pide un segundo toque para confirmar (se pierde la partida).
    alNuevaPartida(fn) {
      const btn = $('btn-nueva');
      let reloj = 0;
      btn.addEventListener('click', () => {
        if (btn.dataset.confirmar) {
          clearTimeout(reloj);
          delete btn.dataset.confirmar;
          btn.textContent = 'Menú';
          fn();
          return;
        }
        btn.dataset.confirmar = '1';
        btn.textContent = '¿Seguro? Toca otra vez';
        reloj = setTimeout(() => {
          delete btn.dataset.confirmar;
          btn.textContent = 'Menú';
        }, 3000);
      });
    },

    listo() {
      cargando.classList.add('oculto');
    },

    error(texto) {
      $('cargando-texto').textContent = texto;
      cargando.classList.remove('oculto');
    },
  };
}
