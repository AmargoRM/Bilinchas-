// La información en pantalla: marcador, barra de fuerza, avisos, tarjetas y botones.
const AYUDA_TIRO = 'Toca tu bolincha y arrastra hacia atrás para tirar';
const AYUDA_CAMARA = 'Arrastra para girar la cámara. Toca «Listo» para volver a tirar';
// Después de esta cantidad de tiros, la ayuda de cómo tirar deja de aparecer.
const TIROS_CON_AYUDA = 2;

export function crearHud() {
  const $ = (id) => document.getElementById(id);
  const fuerza = $('fuerza');
  const relleno = $('fuerza-relleno');
  const numero = $('fuerza-numero');
  const ayuda = $('ayuda');
  const btnCamara = $('btn-camara');
  const btnCamaraTexto = $('btn-camara-texto');
  const cargando = $('cargando');
  const aviso = $('aviso');
  const tarjeta = $('tarjeta');

  let modoCamara = false;
  let apuntando = false;
  let quiereAyudaTiro = false;
  let tirosHechos = 0;
  let relojAviso = 0;

  function mostrarAyuda() {
    let texto = null;
    if (modoCamara) texto = AYUDA_CAMARA;
    else if (quiereAyudaTiro && !apuntando && tirosHechos < TIROS_CON_AYUDA) texto = AYUDA_TIRO;
    ayuda.hidden = !texto;
    if (texto) ayuda.textContent = texto;
  }

  return {
    // Muestra la fuerza de 0 a 1, o la oculta con null.
    fuerza(valor) {
      apuntando = valor !== null;
      mostrarAyuda();
      if (valor === null) {
        fuerza.hidden = true;
        return;
      }
      fuerza.hidden = false;
      const pct = Math.round(valor * 100);
      relleno.style.width = pct + '%';
      relleno.classList.toggle('alta', valor >= 0.75 && valor < 1);
      relleno.classList.toggle('maxima', valor >= 1);
      numero.textContent = pct + ' %';
    },

    // true cuando el jugador puede tirar; false cuando acaba de tirar.
    ayudaDeTiro(si) {
      if (!si && quiereAyudaTiro) tirosHechos++;
      quiereAyudaTiro = si;
      mostrarAyuda();
    },

    modoCamara(activo) {
      modoCamara = activo;
      btnCamara.setAttribute('aria-pressed', String(activo));
      btnCamaraTexto.textContent = activo ? 'Listo' : 'Mover cámara';
      mostrarAyuda();
    },

    // Puntos de cada jugador, de quién es el turno y una línea de detalle abajo.
    marcador({ jugadores, turno, detalle }) {
      jugadores.forEach((j, i) => {
        const fila = $('marcador-j' + (i + 1));
        fila.querySelector('.marcador-punto').style.background = j.color;
        fila.querySelector('.marcador-nombre').textContent = j.nombre;
        fila.querySelector('.marcador-puntos').textContent = j.puntos;
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
    tarjeta({ titulo, subtitulo = '', texto = '', lista = [], pregunta = '', botones, color = null }) {
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

    alCamara(fn) {
      btnCamara.addEventListener('click', fn);
    },

    // "Nueva partida" pide un segundo toque para confirmar.
    alNuevaPartida(fn) {
      const btn = $('btn-nueva');
      let reloj = 0;
      btn.addEventListener('click', () => {
        if (btn.dataset.confirmar) {
          clearTimeout(reloj);
          delete btn.dataset.confirmar;
          btn.textContent = 'Nueva partida';
          fn();
          return;
        }
        btn.dataset.confirmar = '1';
        btn.textContent = '¿Seguro? Toca otra vez';
        reloj = setTimeout(() => {
          delete btn.dataset.confirmar;
          btn.textContent = 'Nueva partida';
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
