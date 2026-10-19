// Tarjeta del final de partida: si se ganó una bolincha nueva, ofrece usarla ahí mismo.
// nuevas(): [{ id, nombre }] ganadas en la partida; usar(id): la elige para las próximas partidas.
// mostrar(extra): vuelve a dibujar la tarjeta, con una línea más (o sin ella).
export function botonUsarNueva({ nuevas, usar, mostrar }) {
  const lista = nuevas ? nuevas() : [];
  if (lista.length === 0) return [];
  const { id, nombre } = lista[lista.length - 1];
  return [
    {
      texto: `Usar ${nombre}`,
      alElegir: () => {
        usar(id);
        mostrar(`Listo: desde la próxima partida tiras con ${nombre}.`);
      },
    },
  ];
}
