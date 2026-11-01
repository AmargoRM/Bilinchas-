// Selector de efecto: una bolincha dibujada donde se toca el punto en que se le pega.
//   arriba del centro = "seguir" (sigue de largo después de chocar)
//   abajo del centro  = "retroceso" (frena o vuelve)
//   a un costado      = curva hacia ese lado
// Solo se ve cuando es el turno de una persona. Después de cada tiro vuelve al centro.
const CENTRO = 0.22; // cerca del medio cuenta como "sin efecto"
// El punto se dibuja hasta el 76 % del radio: tocar ahí (o más afuera) es el efecto al máximo.
// (Antes el máximo estaba recién en el borde y la guía de la Práctica daba solo un 76 %.)
const ALCANCE = 0.76;

export function crearSelectorEfecto() {
  const caja = document.getElementById('efecto');
  const bola = document.getElementById('efecto-bola');
  const punto = document.getElementById('efecto-punto');
  const nombre = document.getElementById('efecto-nombre');
  let valor = { arriba: 0, costado: 0 };

  function mostrarValor() {
    punto.style.left = `${50 + valor.costado * ALCANCE * 50}%`;
    punto.style.top = `${50 - valor.arriba * ALCANCE * 50}%`;
    const partes = [];
    if (valor.arriba > 0.25) partes.push('Seguir');
    if (valor.arriba < -0.25) partes.push('Retroceso');
    if (valor.costado > 0.25) partes.push('Curva →');
    if (valor.costado < -0.25) partes.push('Curva ←');
    nombre.textContent = partes.length ? partes.join(' + ') : 'Sin efecto';
    caja.classList.toggle('activo', partes.length > 0);
  }

  function elegir(e) {
    const r = bola.getBoundingClientRect();
    let x = (((e.clientX - r.left) / r.width) * 2 - 1) / ALCANCE;
    let y = -(((e.clientY - r.top) / r.height) * 2 - 1) / ALCANCE;
    const largo = Math.hypot(x, y);
    if (largo > 1) {
      x /= largo;
      y /= largo;
    }
    valor = largo < CENTRO / ALCANCE ? { arriba: 0, costado: 0 } : { arriba: y, costado: x };
    mostrarValor();
  }

  let tocando = false;
  bola.addEventListener('pointerdown', (e) => {
    tocando = true;
    bola.setPointerCapture(e.pointerId);
    elegir(e);
    e.preventDefault();
  });
  bola.addEventListener('pointermove', (e) => tocando && elegir(e));
  bola.addEventListener('pointerup', () => (tocando = false));
  bola.addEventListener('pointercancel', () => (tocando = false));
  mostrarValor();

  let visible = false;
  // Guía de la Práctica: un aro amarillo donde conviene tocar (null lo quita).
  const guia = document.getElementById('efecto-guia');
  return {
    guia(valorGuia) {
      guia.hidden = !valorGuia;
      if (!valorGuia) return;
      guia.style.left = `${50 + valorGuia.costado * ALCANCE * 50}%`;
      guia.style.top = `${50 - valorGuia.arriba * ALCANCE * 50}%`;
    },

    // El efecto elegido ({ arriba, costado } de −1 a 1), o null si no hay.
    valor: () => (valor.arriba || valor.costado ? { ...valor } : null),
    reiniciar() {
      valor = { arriba: 0, costado: 0 };
      mostrarValor();
    },
    mostrar(si) {
      if (si === visible) return;
      visible = si;
      caja.hidden = !si;
    },
  };
}
