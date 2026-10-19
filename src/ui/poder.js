// Botón de la habilidad activa de la bolincha (solo para la persona del Lugar 1).
// Se toca antes de tirar para "prepararlo"; el próximo tiro lo usa. Una vez por partida.
export function crearBotonPoder({ obtenerPoder }) {
  const boton = document.getElementById('btn-poder');
  const texto = document.getElementById('btn-poder-texto');
  let usado = false;
  let preparado = false;
  let visible = false;

  function mostrarEstado() {
    const p = obtenerPoder();
    if (!p) return;
    texto.textContent = preparado ? `${p.nombre}: listo` : p.nombre;
    boton.setAttribute('aria-pressed', String(preparado));
  }

  boton.addEventListener('click', () => {
    preparado = !preparado;
    mostrarEstado();
  });

  return {
    // Al empezar cada partida el poder vuelve a estar disponible.
    reiniciar() {
      usado = false;
      preparado = false;
      mostrarEstado();
    },

    // si: es el turno de la persona del Lugar 1 y puede tirar.
    mostrar(si) {
      const p = obtenerPoder();
      const ver = si && !!p && p.tipo === 'activa' && !usado;
      if (ver !== visible) {
        visible = ver;
        boton.hidden = !ver;
        if (ver) mostrarEstado();
      }
    },

    // Al tirar: devuelve el poder si estaba preparado (y lo gasta), o null.
    usar() {
      if (!preparado || usado) return null;
      usado = true;
      preparado = false;
      return obtenerPoder();
    },
  };
}
