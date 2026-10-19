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
    asfalto: {
      // Círculo en la calle: rueda más que en tierra y menos que en el caño.
      resistenciaRodadura: 0.085,
      frenado: 0.4,
      rebote: 0.18,
    },
    concreto: {
      // Modo Caño. Rueda más que en tierra: un tiro al 100 % llega a unos 5 m.
      resistenciaRodadura: 0.06,
      frenado: 0.3,
      rebote: 0.25,
    },
  },

  // ---------------------------------------------------------------
  // EFECTOS AL TIRAR (pegarle a la bolincha arriba, abajo o de costado)
  // ---------------------------------------------------------------
  // Como en el billar: la bolincha sale patinando con un giro distinto al de
  // rodar, y el roce con el suelo la va empujando hasta que rueda normal.
  //   roce: cuánto agarra el suelo mientras patina (más alto = el efecto dura menos)
  //   arriba: "seguir": cuánto giro de más lleva hacia adelante (1 = el doble)
  //   abajo: "retroceso": cuánto giro hacia atrás (más de 1 = vuelve después del choque)
  //   costado: "curva": cuánto giro de costado (cuánto se tuerce el camino)
  efecto: {
    roce: 0.2,
    arriba: 1.2,
    abajo: 3.5,
    costado: 0.7,
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
    toleranciaToque: 100, // px alrededor de la bolincha donde un toque apunta (fuera de eso, mueve la cámara)
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
  // Modo Bolinchas explosivas (un Círculo con algunas bolinchas que explotan al recibir un golpe).
  explosivas: {
    cantidad: 3, // cuántas explosivas hay mezcladas en el círculo
    radio: 16, // cm: hasta dónde llega el empujón de la explosión
    empuje: 150, // cm/s que gana una bolincha pegada a la explosión (menos cuanto más lejos)
    salto: 50, // cm/s hacia arriba (las hace saltar un poco)
    velocidadParaExplotar: 25, // cm/s: si la mueven más rápido que esto, explota
    retardo: 0.12, // segundos entre el golpe y la explosión
  },

  // Modo El hoyito.
  hoyito: {
    distanciaRaya: 170, // cm de la raya al hoyo
    radioHoyo: 3, // cm
    velocidadParaCaer: 75, // cm/s: si pasa por el hoyo más lenta que esto, cae; si no, lo salta
    separacionEnRaya: 10, // cm entre los lugares de salida sobre la raya
  },

  // Dificultad del Círculo según el nivel de quien juega (Lugar 1).
  // Cada fila cambia algo desde ese nivel en adelante; lo que no dice, sigue igual.
  // Cada cambio se le explica al jugador una vez (src/reglas.js).
  //   bolinchas: cuántas hay en el círculo   radio: tamaño del círculo (cm)
  //   salida: a qué distancia del centro se tira la primera vez (cm)
  //   piedras: piedras fijas dentro del círculo
  //   punteriaRival: multiplica el error de la computadora (menos = apunta mejor)
  dificultadCirculo: [
    { desde: 1, bolinchas: 10, radio: 40, salida: 60, piedras: 0, punteriaRival: 1 },
    { desde: 3, bolinchas: 12, radio: 46 },
    { desde: 4, piedras: 3 },
    { desde: 5, salida: 80 },
    { desde: 6, punteriaRival: 0.7 },
    { desde: 7, bolinchas: 14, radio: 52 },
  ],


  // ---------------------------------------------------------------
  // ESCENARIO DEL MODO CAÑO (los recorridos están en src/mapas.js)
  // ---------------------------------------------------------------
  canal: {
    ancho: 22, // cm entre pared y pared
    altoPared: 5, // cm. Paredes rectas: la bolincha rebota como en una mesa de pool.
    grosorPared: 4, // cm
    rebotePared: 0.55, // cuánto rebota la bolincha contra la pared (0 a 1)
    salida: 14, // cm desde la pared de atrás hasta donde se pone la bolincha
    juntaCada: 100, // cm entre juntas del concreto (solo se ve)
    // Si la bolincha pasa por un hueco más lenta que esto (cm/s), cae.
    // Más rápida, lo salta.
    velocidadParaCaerEnHueco: 110,
  },

  // ---------------------------------------------------------------
  // REGLAS DEL MODO CAÑO
  // ---------------------------------------------------------------
  // Lo que no se cambia aquí:
  //   - Gana el primero que pase la línea de meta.
  //   - Si una bolincha salta la pared, vuelve a donde estaba antes del tiro.
  //   - Si una bolincha cae en un hueco, vuelve a la salida.
  reglasCano: {
    // Se sortea quién empieza. false = siempre empieza el lugar 1.
    sorteoDeQuienEmpieza: true,
    // Si alguien te empuja más allá de la meta, ¿ganas tú?
    metaCuentaSiTeEmpujan: true,
  },

  // ---------------------------------------------------------------
  // REGLAS DEL MODO CÍRCULO
  // ---------------------------------------------------------------
  // Cambiá true/false para probar otras reglas.
  reglasCirculo: {
    // Si saca al menos una bolincha, vuelve a tirar desde donde quedó la suya,
    // aunque haya quedado dentro del círculo.
    repiteSiSaca: true,
    // Al empezar un turno nuevo (no al repetir), ¿desde dónde tira?
    //   'salida'     = desde la salida, afuera del círculo. La bolincha del
    //                  otro jugador se levanta del suelo mientras tanto.
    //   'dondeQuedo' = desde donde quedó su bolincha la última vez. Las dos
    //                  bolinchas de tiro quedan en el suelo y se pueden pegar.
    inicioDeTurno: 'dondeQuedo',
  },

  // ---------------------------------------------------------------
  // COMPUTADORA COMO RIVAL
  // ---------------------------------------------------------------
  // errorAngulo:  cuánto se le desvía la puntería, en grados. Para pegarle
  //               a una bolincha a 50 cm hay que acertar dentro de ~2 grados.
  // errorFuerza:  cuánto se equivoca en la fuerza (0.2 = hasta un 20 % de más o de menos).
  // despiste:     probabilidad de elegir un tiro peor que el mejor (0.3 = 3 de cada 10 tiros).
  // margenFuerza: fuerza extra "por las dudas" (1.15 = 15 % más de lo justo).
  // pensar:       segundos que espera antes de tirar, para que se vea natural.
  rival: {
    facil: { errorAngulo: 4, errorFuerza: 0.25, despiste: 0.35, margenFuerza: 1.1, pensar: 1.2 },
    medio: { errorAngulo: 1.8, errorFuerza: 0.12, despiste: 0.12, margenFuerza: 1.15, pensar: 1.0 },
    dificil: { errorAngulo: 1.1, errorFuerza: 0.08, despiste: 0.04, margenFuerza: 1.2, pensar: 0.8 },
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
