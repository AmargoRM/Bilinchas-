// =====================================================================
// CONFIGURACIÓN DEL JUEGO — Ojo de Gato
// =====================================================================
// Este es el archivo para ajustar cómo se siente el juego.
// Cambiá un número, guardá, y probá de nuevo.
//
// Unidades que usa todo el juego:
//   - Distancias: CENTÍMETROS (una bolincha normal mide 1,6 cm).
//   - Peso: GRAMOS.
//   - Tiempo: SEGUNDOS.
// =====================================================================

export const CONFIG = {
  // ---------------------------------------------------------------
  // MUNDO
  // ---------------------------------------------------------------
  // Gravedad de la Tierra en cm/s². No conviene tocarla.
  gravedad: 981,

  // Cada cuánto calcula la física (en segundos). 1/120 = 120 veces por
  // segundo. Más chico = más preciso pero más trabajo para el teléfono.
  pasoFisica: 1 / 120,

  // ---------------------------------------------------------------
  // BOLINCHAS
  // ---------------------------------------------------------------
  bolinchas: {
    normal: {
      diametro: 1.6, // cm (16 mm)
      peso: 5.5, // gramos (vidrio macizo de 16 mm)
    },
    boliche: {
      diametro: 2.5, // cm (25 mm). Se usa desde la etapa 6.
      peso: 21, // gramos. Pesa casi 4 veces más: empuja más fuerte.
    },
    // Cuánto rebota el vidrio contra el vidrio. 0 = nada, 1 = rebote perfecto.
    rebote: 0.9,
    // Roce entre vidrio y vidrio al chocar de costado. Bajo = resbalan entre sí.
    agarre: 0.15,
  },

  // ---------------------------------------------------------------
  // SUPERFICIES
  // ---------------------------------------------------------------
  // "resistenciaRodadura": frenado parejo del suelo al rodar. Es el que más
  //   decide hasta dónde llega un tiro. Más alto = se detiene antes.
  // "frenado": frenado extra que es más fuerte cuanto más rápido va
  //   (amortigua los tiros muy fuertes).
  // "rebote": cuánto rebota la bolincha al caer sobre el suelo.
  superficies: {
    tierra: {
      resistenciaRodadura: 0.12,
      frenado: 0.5,
      rebote: 0.1,
    },
    concreto: {
      // Se usa en el Modo Caño (etapa 5). Rueda más que en tierra.
      resistenciaRodadura: 0.03,
      frenado: 0.15,
      rebote: 0.25,
    },
  },

  // Por debajo de esta velocidad (cm/s) la bolincha se considera detenida.
  velocidadParada: 2.5,

  // ---------------------------------------------------------------
  // TIRO
  // ---------------------------------------------------------------
  tiro: {
    // Velocidad de salida con la fuerza al 100 %, en cm/s. 350 = 3,5 m/s.
    velocidadMaxima: 350,
    // Cuánto hay que arrastrar el dedo (en fracción del lado más corto
    // de la pantalla) para llegar a fuerza 100 %. 0.4 = 40 % de la pantalla.
    arrastreMaximo: 0.4,
    // Fuerza mínima: si soltás por debajo de esto, el tiro se cancela.
    fuerzaMinima: 0.05,
    // Largo de la línea de puntería, en cm. Corta a propósito, para que haya dificultad.
    largoPunteria: 12,
    // Qué tan lejos de la bolincha (en píxeles) se puede tocar para empezar a apuntar.
    toleranciaToque: 90,
  },

  // ---------------------------------------------------------------
  // ESCENARIO DEL MODO CÍRCULO
  // ---------------------------------------------------------------
  circulo: {
    radio: 40, // cm. Círculo de tiza de 80 cm de ancho.
    // Cuántas bolinchas se ponen dentro del círculo.
    cantidadBolinchas: 10,
    // Se reparten al azar dentro de esta fracción del radio (0.6 = 60 % del círculo).
    zonaBolinchas: 0.6,
    // Separación mínima entre bolinchas al acomodarlas, en cm.
    separacionMinima: 3.5,
    // Dónde arranca la bolincha del tirador: a esta distancia del centro.
    distanciaSalida: 60, // cm
  },

  // ---------------------------------------------------------------
  // CÁMARA
  // ---------------------------------------------------------------
  camara: {
    distancia: 24, // cm detrás de la bolincha
    altura: 0.36, // ángulo hacia abajo (0 = a ras del suelo, 1.4 = desde arriba)
    alturaMinima: 0.12,
    alturaMaxima: 1.35,
    distanciaMinima: 15,
    distanciaMaxima: 120,
  },
};
