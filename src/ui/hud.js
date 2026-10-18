// La información en pantalla: barra de fuerza, ayuda y botones.
export function crearHud() {
  const $ = (id) => document.getElementById(id);
  const fuerza = $('fuerza');
  const relleno = $('fuerza-relleno');
  const numero = $('fuerza-numero');
  const ayuda = $('ayuda');
  const btnCamara = $('btn-camara');
  const btnCamaraTexto = $('btn-camara-texto');
  const cargando = $('cargando');

  return {
    // Muestra la fuerza de 0 a 1, o la oculta con null.
    fuerza(valor) {
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

    ayuda(texto) {
      ayuda.hidden = !texto;
      if (texto) ayuda.textContent = texto;
    },

    modoCamara(activo) {
      btnCamara.setAttribute('aria-pressed', String(activo));
      btnCamaraTexto.textContent = activo ? 'Listo' : 'Mover cámara';
    },

    alCamara(fn) {
      btnCamara.addEventListener('click', fn);
    },

    alReiniciar(fn) {
      $('btn-reiniciar').addEventListener('click', fn);
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
