// Modo Práctica: lecciones cortas para aprender a tirar, la curva, el retroceso,
// el seguir y el salto. Cada lección arma una situación en el patio y revisa si se logró.
// Se puede repetir cuantas veces haga falta; no da ni quita puntos.
import * as THREE from 'three';
import { CONFIG } from '../config.js';
import { crearBolincha } from '../bolincha.js';
import { HABILIDADES } from '../habilidades.js';
import { tx } from '../textos.js';

const LIMITE_PATIO = 280;

// Las lecciones. Posiciones en cm (la bolincha que tira mira hacia −z, hacia los blancos).
//   blancos: bolinchas para pegarles   piedras: { x, z, radio }   aro: meta en el suelo
//   poder: habilidad que se presta en esa lección   exito(r): ¿se logró? (r: lo que pasó)
const LECCIONES = [
  {
    titulo: 'Tirar',
    texto: 'Toca tu {bolincha} (la de la flecha amarilla) y arrastra el dedo hacia atrás, como estirando una liga. La línea de tiza muestra hacia dónde sale y el aro blanco, dónde va a tocar. Arrastra hasta que la barra de la derecha llegue a la franja amarilla (entre 30 y 70 %) y suelta.',
    tirador: [0, 40],
    blancos: [[0, 0]],
    guia: { fuerza: [0.3, 0.7] },
    exito: (r) => r.blancoMovido(0) > 3,
    pista: 'Apunta derecho a la otra: el aro blanco tiene que quedar encima de ella. Suelta con la barra en la franja amarilla.',
  },
  {
    titulo: 'Curva',
    texto: '1) Abajo a la izquierda, en tu {bolincha} grande, toca el aro amarillo del borde derecho («Curva →»). 2) Arrastra apuntando a la marca amarilla del suelo, a la izquierda de la piedra. 3) Suelta con la fuerza en la franja amarilla (55 a 65 %). Va a doblar a la derecha y pegarles a las de atrás.',
    tirador: [0, 80],
    blancos: [[-4, 0], [0, 0], [4, 0]],
    piedras: [{ x: 0, z: 40, radio: 2.4 }],
    apuntar: { x: -10, z: 40 },
    guia: { efecto: { arriba: 0, costado: 1 }, fuerza: [0.55, 0.65] },
    exito: (r) => [0, 1, 2].some((i) => r.blancoMovido(i) > 3),
    pista: 'Revisa que diga «Curva →» abajo, que la línea pase por la marca amarilla y que la fuerza esté en la franja (55 a 65 %).',
  },
  {
    titulo: 'Retroceso',
    texto: '1) En tu {bolincha} grande, toca el aro amarillo de abajo («Retroceso»). 2) Apunta derecho a la otra. 3) Suelta con la fuerza en la franja amarilla (50 a 60 %). Tu {bolincha} le pega y vuelve hacia atrás, hasta el aro de tiza.',
    tirador: [0, 40],
    blancos: [[0, 0]],
    aro: { x: 0, z: 36, radio: 18 },
    guia: { efecto: { arriba: -1, costado: 0 }, fuerza: [0.5, 0.6] },
    exito: (r) => r.blancoMovido(0) > 3 && r.tiradorEnAro(),
    pista: 'Tiene que decir «Retroceso» abajo (toca bien el borde de abajo) y la fuerza entre 50 y 60 %.',
  },
  {
    titulo: 'Seguir',
    texto: '1) En tu {bolincha} grande, toca el aro amarillo de arriba («Seguir»). 2) Apunta derecho a la otra. 3) Suelta con la fuerza en la franja amarilla (45 a 55 %). Tu {bolincha} le pega y sigue de largo hasta el aro de atrás.',
    tirador: [0, 40],
    blancos: [[0, 0]],
    aro: { x: 0, z: -24, radio: 15 },
    guia: { efecto: { arriba: 1, costado: 0 }, fuerza: [0.45, 0.55] },
    exito: (r) => r.blancoMovido(0) > 3 && r.tiradorEnAro(),
    pista: 'Tiene que decir «Seguir» abajo (toca bien el borde de arriba). Si no llega al aro, un poco más fuerte; si se pasa, más suave.',
  },
  {
    titulo: 'Salto',
    texto: 'Una fila de {bolinchas} tapa el paso. 1) Toca el botón del rayo («Salto»): cambia a «Salto: listo». 2) Apunta derecho a la de atrás. 3) Suelta con la fuerza en la franja amarilla (50 a 75 %). Tu {bolincha} pasa por encima de la fila.',
    tirador: [0, 60],
    blancos: [[0, 0], [-3.4, 30], [0, 30], [3.4, 30]],
    poder: 'salto',
    guia: { fuerza: [0.5, 0.75] },
    exito: (r) => r.blancoMovido(0) > 3 && [1, 2, 3].every((i) => r.blancoMovido(i) < 2),
    pista: 'Antes de tirar toca el botón del rayo hasta que diga «Salto: listo». Fuerza entre 50 y 75 %.',
  },
];

export function crearModoTutorial({ escena, fisica, hud, controlCamara, patio, mostrarPunteria = () => {}, efectos = {}, alSalir = () => {}, disenoDueno = () => null }) {
  const centro = new THREE.Vector3();
  const tirador = crearBolincha({ escena, fisica, posicion: centro, diseno: 'azul', aro: '#3b9be0' });
  const blancos = Array.from({ length: 4 }, (_, i) => crearBolincha({ escena, fisica, posicion: centro, diseno: ['clasica', 'verde', 'cristal', 'agua'][i] }));
  const todas = [tirador, ...blancos];
  let vestida = 'azul';
  let numero = 0; // lección actual
  let fase = 'espera'; // 'apuntar' | 'rodando' | 'espera'
  let tiempoQuieta = 0;
  let enfocada = tirador;
  let ficha = 0;
  const despues = (segundos, fn) => {
    const mia = ficha;
    setTimeout(() => mia === ficha && fn(), segundos * 1000);
  };

  // El aro de la meta (retroceso y seguir): un círculo de tiza en el suelo.
  const aro = new THREE.Mesh(
    new THREE.RingGeometry(0.92, 1, 48).rotateX(-Math.PI / 2),
    new THREE.MeshBasicMaterial({ color: 0xf6f1e4, transparent: true, opacity: 0.85, depthWrite: false })
  );
  aro.visible = false;
  escena.add(aro);
  // Marca amarilla para apuntar (lección de curva).
  const mira = new THREE.Mesh(
    new THREE.RingGeometry(0.5, 1, 32).rotateX(-Math.PI / 2),
    new THREE.MeshBasicMaterial({ color: 0xffd23f, transparent: true, opacity: 0.95, depthWrite: false })
  );
  mira.scale.setScalar(2);
  mira.visible = false;
  escena.add(mira);

  const leccion = () => LECCIONES[numero];

  function armar() {
    const l = leccion();
    // La bolincha de tiro: la que el jugador eligió en la Colección.
    const diseno = disenoDueno() || 'azul';
    if (diseno !== vestida) {
      tirador.vestir(diseno);
      vestida = diseno;
    }
    for (const b of blancos) b.quitar();
    tirador.cambiarPeso(1);
    tirador.colocar(l.tirador[0], l.tirador[1]);
    l.blancos.forEach(([x, z], i) => blancos[i].colocar(x, z));
    patio?.usarMapa('patio');
    patio?.usarRadio(null);
    patio?.ponerPiedras(l.piedras || []);
    mira.visible = !!l.apuntar;
    if (l.apuntar) mira.position.set(l.apuntar.x, 0.06, l.apuntar.z);
    efectos.guiaTutorial?.(l.guia || null);
    aro.visible = !!l.aro;
    if (l.aro) {
      aro.position.set(l.aro.x, 0.05, l.aro.z);
      aro.scale.setScalar(l.aro.radio);
    }
    enfocada = tirador;
    controlCamara.vistaNormal();
    controlCamara.mirarDesde(tirador.posicion, new THREE.Vector3(l.blancos[0][0], 0, l.blancos[0][1]), true);
    efectos.nuevaPartida?.(); // el poder prestado vuelve a estar disponible
  }

  function mostrarLeccion() {
    ficha++;
    fase = 'espera';
    armar();
    const l = leccion();
    hud.tarjeta({
      titulo: `Lección ${numero + 1} de ${LECCIONES.length}: ${l.titulo}`,
      subtitulo: 'Práctica',
      texto: tx(l.texto),
      botones: [
        { texto: '¡A probar!', alElegir: () => empezarIntento() },
        { texto: 'Saltar lección', secundario: true, alElegir: () => siguiente() },
        { texto: 'Salir', secundario: true, alElegir: () => alSalir('modos') },
      ],
    });
  }

  function empezarIntento() {
    fase = 'apuntar';
    hud.ayudaDeTiro(true);
  }

  function siguiente() {
    if (numero + 1 >= LECCIONES.length) {
      terminarPractica();
      return;
    }
    numero++;
    mostrarLeccion();
  }

  function terminarPractica() {
    fase = 'espera';
    efectos.guiaTutorial?.(null);
    mira.visible = false;
    efectos.victoria?.();
    hud.tarjeta({
      titulo: '¡Terminaste la práctica!',
      texto: tx('Ya sabes tirar, hacer curva, retroceso, seguir y saltar. Las habilidades como el Salto las traen algunas {bolinchas} de la Colección.'),
      botones: [
        { texto: 'Repetir desde el principio', alElegir: () => empezarPartida() },
        { texto: 'Jugar', secundario: true, alElegir: () => alSalir('modos') },
      ],
    });
  }

  // Cuando todo se detuvo: ¿se logró la lección?
  function revisar() {
    const l = leccion();
    const r = {
      blancoMovido: (i) => {
        const [x, z] = l.blancos[i];
        const b = blancos[i];
        if (!b.cuerpo.isEnabled()) return 999;
        return Math.hypot(b.posicion.x - x, b.posicion.z - z);
      },
      tiradorEnAro: () => !!l.aro && tirador.cuerpo.isEnabled() && Math.hypot(tirador.posicion.x - l.aro.x, tirador.posicion.z - l.aro.z) <= l.aro.radio,
    };
    if (l.exito(r)) {
      efectos.victoria?.();
      hud.tarjeta({
        titulo: '¡Bien hecho!',
        subtitulo: `Lección ${numero + 1}: ${l.titulo}`,
        texto: numero + 1 < LECCIONES.length ? `Siguiente: ${LECCIONES[numero + 1].titulo}.` : 'Era la última lección.',
        botones: [
          { texto: numero + 1 < LECCIONES.length ? 'Siguiente lección' : 'Terminar', alElegir: () => siguiente() },
          { texto: 'Repetir esta', secundario: true, alElegir: () => mostrarLeccion() },
        ],
      });
      return;
    }
    hud.aviso(`Casi. ${tx(l.pista)}`);
    despues(CONFIG.ritmo.pausaEntreTurnos, () => {
      armar();
      empezarIntento();
    });
  }

  function empezarPartida() {
    numero = 0;
    mostrarLeccion();
  }

  return {
    todas,
    superficie: 'tierra',

    nuevaPartida() {
      ficha++;
      fase = 'espera';
      armar();
      hud.tarjeta({
        titulo: 'Práctica',
        texto: `${LECCIONES.length} lecciones cortas: ${LECCIONES.map((l) => l.titulo.toLowerCase()).join(', ')}. Puedes repetir cada una las veces que quieras; no da ni quita puntos.`,
        botones: [
          { texto: 'Empezar', alElegir: () => empezarPartida() },
          { texto: 'Volver', secundario: true, alElegir: () => alSalir('modos') },
        ],
      });
    },

    empezarPartida,

    retirar() {
      ficha++;
      fase = 'espera';
      mostrarPunteria(null);
      for (const b of todas) b.quitar();
      aro.visible = false;
      mira.visible = false;
      efectos.guiaTutorial?.(null);
    },

    get tirador() {
      return tirador;
    },

    get enfoque() {
      return enfocada;
    },

    puedeTirar: () => fase === 'apuntar',
    apuntaComputadora: false,
    // En la práctica tira siempre quien está aprendiendo, sin las estadísticas de su
    // bolincha de la Colección (así las fuerzas que se indican sirven siempre).
    turnoDelDueno: true,
    usaEstadisticas: false,
    // La habilidad que se presta en la lección (o null: ninguna, ni la de la Colección).
    get poderPrestado() {
      return HABILIDADES[leccion().poder] || null;
    },

    get traza() {
      return { bordes: { minX: -60, maxX: 60, minZ: -40, maxZ: 90 } };
    },

    obstaculosPunteria() {
      const l = leccion();
      return [
        ...blancos.filter((b) => b.cuerpo.isEnabled()).map((b) => ({ x: b.posicion.x, z: b.posicion.z, radio: b.radio })),
        ...(l.piedras || []).map((p) => ({ x: p.x, z: p.z, radio: Math.sqrt((p.radio + tirador.radio) ** 2 - (tirador.radio - p.radio * 0.35) ** 2) - tirador.radio })),
      ];
    },

    tirar(direccion, fuerza, efecto) {
      tirador.tirar(direccion, fuerza, efecto);
      fase = 'rodando';
      tiempoQuieta = 0;
      hud.ayudaDeTiro(false);
    },

    actualizar(dt) {
      for (const b of todas) {
        const p = b.posicion;
        if (b.cuerpo.isEnabled() && (p.y < -20 || Math.abs(p.x) > LIMITE_PATIO || Math.abs(p.z) > LIMITE_PATIO)) b.quitar();
      }
      if (fase !== 'rodando') return;
      let quietas = true;
      for (const b of todas) if (!b.frenarSiCasiQuieta()) quietas = false;
      tiempoQuieta = quietas ? tiempoQuieta + dt : 0;
      if (tiempoQuieta > CONFIG.ritmo.esperaQuietas) {
        fase = 'espera';
        revisar();
      }
    },
  };
}

export const CANTIDAD_LECCIONES = LECCIONES.length;
