// Sonidos del juego, generados en el momento (sin archivos de audio).
// El navegador solo deja sonar después de que la persona toca la pantalla:
// por eso hay que llamar a desbloquear() desde un toque.
const CLAVE = 'ojo-de-gato.sonido';

// Cómo suena rodar sobre cada suelo. Se arma con tres cosas:
//   fondo: ruido continuo filtrado (bandas: [tipo, frecuencia, q, volumen])
//   granos: clics cortos sueltos (piedritas, arena), más seguidos cuanto más rápido
//     va: { porSegundo (a 3,5 m/s), tipo, frecuencia, q, duracion, volumen }
//   vibra: temblor del volumen en suelos disparejos { profundidad, frecuencia (a 3,5 m/s) }
const PERFILES = {
  // Tierra: grave y apagado, con crujido de tierra suelta.
  tierra: {
    fondo: [['lowpass', 260, 0.7, 0.75]],
    granos: { porSegundo: 55, tipo: 'bandpass', frecuencia: 1200, q: 1.1, duracion: 0.008, volumen: 0.3 },
    vibra: { profundidad: 0.45, frecuencia: 11 },
  },
  // Asfalto: áspero, con mucha grava fina que chirría.
  asfalto: {
    fondo: [['bandpass', 900, 0.6, 0.3], ['highpass', 3200, 0.7, 0.02]],
    granos: { porSegundo: 140, tipo: 'bandpass', frecuencia: 2400, q: 0.9, duracion: 0.004, volumen: 0.07 },
    vibra: { profundidad: 0.25, frecuencia: 23 },
  },
  // Concreto liso del caño: zumbido limpio con eco de canal, casi sin granos.
  concreto: {
    fondo: [['bandpass', 1250, 2.6, 0.32], ['bandpass', 380, 1.6, 0.22]],
    granos: { porSegundo: 10, tipo: 'bandpass', frecuencia: 3200, q: 2, duracion: 0.005, volumen: 0.05 },
    vibra: { profundidad: 0.08, frecuencia: 6 },
  },
};

export function crearSonido() {
  let ctx = null;
  let maestro = null;
  let ruido = null; // un segundo de ruido blanco, reutilizado
  let rodado = null; // { tierra, asfalto, concreto }: sonido de rodar de cada suelo
  let ultimoRodar = 0;
  let activo = true;
  try {
    activo = localStorage.getItem(CLAVE) !== 'no';
  } catch {
    // sin almacenamiento: sonido prendido
  }

  function desbloquear() {
    if (ctx) {
      if (ctx.state === 'suspended') ctx.resume();
      return;
    }
    const Contexto = window.AudioContext || window.webkitAudioContext;
    if (!Contexto) return;
    ctx = new Contexto();
    maestro = ctx.createGain();
    maestro.gain.value = activo ? 0.9 : 0;
    maestro.connect(ctx.destination);
    ruido = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const datos = ruido.getChannelData(0);
    for (let i = 0; i < datos.length; i++) datos[i] = Math.random() * 2 - 1;
    rodado = Object.fromEntries(Object.entries(PERFILES).map(([nombre, p]) => [nombre, crearRodado(p)]));
  }

  // El sonido de rodar de un suelo: fondo continuo, temblor y la entrada de los granos.
  // Todo arranca en silencio; rodar() sube el volumen según la velocidad.
  function crearRodado(perfil) {
    const volumen = ctx.createGain();
    volumen.gain.value = 0;
    // Temblor: el volumen sube y baja un poco (suelo disparejo).
    const temblor = ctx.createGain();
    temblor.gain.value = 1 - perfil.vibra.profundidad / 2;
    const lfo = ctx.createOscillator();
    lfo.frequency.value = perfil.vibra.frecuencia;
    const lfoCuanto = ctx.createGain();
    lfoCuanto.gain.value = perfil.vibra.profundidad / 2;
    lfo.connect(lfoCuanto).connect(temblor.gain);
    lfo.start();
    temblor.connect(volumen).connect(maestro);
    const bandas = perfil.fondo.map(([tipo, frecuencia, q, nivel]) => {
      const fuente = ctx.createBufferSource();
      fuente.buffer = ruido;
      fuente.loop = true;
      const filtro = ctx.createBiquadFilter();
      filtro.type = tipo;
      filtro.frequency.value = frecuencia;
      filtro.Q.value = q;
      const g = ctx.createGain();
      g.gain.value = nivel;
      fuente.connect(filtro).connect(g).connect(temblor);
      fuente.start(0, Math.random());
      return { filtro, base: frecuencia };
    });
    // Los granos entran por su propio filtro (uno solo, compartido).
    const filtroGranos = ctx.createBiquadFilter();
    filtroGranos.type = perfil.granos.tipo;
    filtroGranos.frequency.value = perfil.granos.frecuencia;
    filtroGranos.Q.value = perfil.granos.q;
    filtroGranos.connect(maestro);
    return { perfil, volumen, lfo, bandas, filtroGranos, debe: 0 };
  }

  // Un grano: un clic de ruido de pocos milisegundos, en el momento t.
  function grano(r, t, fuerza) {
    const g = r.perfil.granos;
    const fuente = ctx.createBufferSource();
    fuente.buffer = ruido;
    const env = ctx.createGain();
    const v = g.volumen * fuerza * (0.4 + Math.random() * 0.6);
    env.gain.setValueAtTime(v, t);
    env.gain.exponentialRampToValueAtTime(0.0001, t + g.duracion);
    fuente.connect(env).connect(r.filtroGranos);
    fuente.start(t, Math.random() * 0.9);
    fuente.stop(t + g.duracion + 0.01);
  }

  // Un golpe de ruido corto, filtrado.
  function golpe({ frecuencia, q = 1, tipo = 'bandpass', duracion, volumen }) {
    const t = ctx.currentTime;
    const fuente = ctx.createBufferSource();
    fuente.buffer = ruido;
    const filtro = ctx.createBiquadFilter();
    filtro.type = tipo;
    filtro.frequency.value = frecuencia;
    filtro.Q.value = q;
    const g = ctx.createGain();
    g.gain.setValueAtTime(volumen, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + duracion);
    fuente.connect(filtro).connect(g).connect(maestro);
    fuente.start(t, Math.random() * 0.5);
    fuente.stop(t + duracion + 0.02);
  }

  // Una nota que se apaga rápido (para el "clinc" del vidrio y la música).
  function nota(frecuencia, duracion, volumen, retraso = 0, forma = 'sine') {
    const t = ctx.currentTime + retraso;
    const osc = ctx.createOscillator();
    osc.type = forma;
    osc.frequency.value = frecuencia;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(volumen, t + 0.004);
    g.gain.exponentialRampToValueAtTime(0.0001, t + duracion);
    osc.connect(g).connect(maestro);
    osc.start(t);
    osc.stop(t + duracion + 0.02);
  }

  const listo = () => ctx && activo;

  return {
    desbloquear,

    get activo() {
      return activo;
    },

    activar(si) {
      activo = si;
      try {
        localStorage.setItem(CLAVE, si ? 'si' : 'no');
      } catch {
        // no se pudo recordar: vale para esta vez
      }
      if (maestro) maestro.gain.value = si ? 0.9 : 0;
      if (si) desbloquear();
    },

    // Vidrio contra vidrio. fuerza: de 0 a 1. Un boliche suena más grave.
    choqueVidrio(fuerza, grave = false) {
      if (!listo()) return;
      const v = Math.min(fuerza, 1) * 0.5 + 0.04;
      const base = (grave ? 2300 : 3200) + Math.random() * 900;
      nota(base, 0.09, v * 0.6);
      nota(base * 2.37, 0.05, v * 0.35);
      golpe({ frecuencia: 5200, q: 0.8, tipo: 'highpass', duracion: 0.025, volumen: v * 0.7 });
    },

    // Contra la pared, una piedra o el suelo al caer. Suena según el suelo.
    golpeSeco(fuerza, superficie = 'tierra') {
      if (!listo()) return;
      const v = Math.min(fuerza, 1) * 0.6 + 0.04;
      if (superficie === 'concreto') {
        // Cemento: golpe duro con un poco de timbre.
        golpe({ frecuencia: 1500, q: 1.5, duracion: 0.05, volumen: v * 0.8 });
        nota(2100 + Math.random() * 400, 0.05, v * 0.15);
        golpe({ frecuencia: 420, q: 4, duracion: 0.12, volumen: v * 0.25 }); // eco del canal
      } else if (superficie === 'asfalto') {
        // Asfalto: seco y áspero, con grava que salta.
        golpe({ frecuencia: 1100, q: 1, duracion: 0.045, volumen: v * 0.75 });
        golpe({ frecuencia: 3500, q: 0.7, tipo: 'highpass', duracion: 0.02, volumen: v * 0.35 });
      } else {
        // Tierra: golpe sordo y polvo.
        golpe({ frecuencia: 380, q: 0.9, tipo: 'lowpass', duracion: 0.08, volumen: v });
        golpe({ frecuencia: 1300, q: 1, duracion: 0.03, volumen: v * 0.2 });
      }
    },

    // El "tic" del dedo al tirar.
    tiro(fuerza) {
      if (!listo()) return;
      golpe({ frecuencia: 2600, q: 2, duracion: 0.03, volumen: 0.12 + fuerza * 0.25 });
    },

    // Cae en un hueco: golpe hueco y unos rebotes.
    hueco() {
      if (!listo()) return;
      [0, 0.12, 0.2, 0.25].forEach((r, i) => {
        setTimeout(() => golpe({ frecuencia: 260 + i * 40, q: 3, duracion: 0.08, volumen: 0.35 / (i + 1) }), r * 1000);
      });
    },

    // Explosión: un golpe grave largo, un retumbe y chisporroteo.
    explosion() {
      if (!listo()) return;
      golpe({ frecuencia: 160, q: 0.7, tipo: 'lowpass', duracion: 0.7, volumen: 1 });
      nota(55, 0.5, 0.5, 0, 'sine');
      for (let i = 0; i < 6; i++) {
        setTimeout(() => golpe({ frecuencia: 3000 + Math.random() * 2000, q: 1, tipo: 'highpass', duracion: 0.03, volumen: 0.15 }), 60 + Math.random() * 350);
      }
    },

    // Repique al ganar.
    victoria() {
      if (!listo()) return;
      [523.3, 659.3, 784, 1046.5].forEach((f, i) => nota(f, 0.35, 0.18, i * 0.11, 'triangle'));
    },

    // Llamar en cada cuadro con la velocidad total (cm/s) de las bolinchas que ruedan
    // apoyadas en cada suelo: { tierra, asfalto, concreto } (las que falten, 0).
    rodar(velocidades = {}) {
      if (!ctx || !rodado) return;
      const t = ctx.currentTime;
      const paso = Math.min(Math.max(t - ultimoRodar, 0), 0.1);
      ultimoRodar = t;
      for (const [nombre, r] of Object.entries(rodado)) {
        const vel = activo ? velocidades[nombre] || 0 : 0;
        const rapidez = Math.min(vel / 350, 1);
        r.volumen.gain.setTargetAtTime(rapidez * 0.75, t, 0.05);
        for (const b of r.bandas) b.filtro.frequency.setTargetAtTime(b.base * (0.7 + Math.min(vel / 300, 1) * 0.6), t, 0.05);
        // El temblor va más rápido cuanto más rápido rueda.
        r.lfo.frequency.setTargetAtTime(r.perfil.vibra.frecuencia * (0.3 + rapidez), t, 0.1);
        // Granos: los que tocan en este rato, en momentos al azar.
        if (vel > 3) {
          r.debe += r.perfil.granos.porSegundo * Math.min(vel / 350, 1.5) * paso;
          while (r.debe >= 1) {
            r.debe -= 1;
            grano(r, t + Math.random() * Math.max(paso, 0.016), 0.5 + rapidez * 0.5);
          }
        } else r.debe = 0;
      }
    },
  };
}
