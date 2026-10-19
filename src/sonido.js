// Sonidos del juego, generados en el momento (sin archivos de audio).
// El navegador solo deja sonar después de que la persona toca la pantalla:
// por eso hay que llamar a desbloquear() desde un toque.
const CLAVE = 'ojo-de-gato.sonido';

export function crearSonido() {
  let ctx = null;
  let maestro = null;
  let ruido = null; // un segundo de ruido blanco, reutilizado
  let rodado = null; // { tierra, concreto }: sonido continuo de rodar
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
    rodado = { tierra: crearRodado(320, 0.5, 'lowpass'), concreto: crearRodado(1100, 0.8, 'bandpass') };
  }

  // Ruido continuo filtrado: su volumen sube con la velocidad de las bolinchas.
  function crearRodado(frecuencia, q, tipo) {
    const fuente = ctx.createBufferSource();
    fuente.buffer = ruido;
    fuente.loop = true;
    const filtro = ctx.createBiquadFilter();
    filtro.type = tipo;
    filtro.frequency.value = frecuencia;
    filtro.Q.value = q;
    const volumen = ctx.createGain();
    volumen.gain.value = 0;
    fuente.connect(filtro).connect(volumen).connect(maestro);
    fuente.start();
    return { volumen, filtro, base: frecuencia };
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

    // Contra la pared, una piedra o el suelo al caer.
    golpeSeco(fuerza, superficie = 'tierra') {
      if (!listo()) return;
      const v = Math.min(fuerza, 1) * 0.6 + 0.04;
      if (superficie === 'concreto') {
        golpe({ frecuencia: 1500, q: 1.5, duracion: 0.05, volumen: v * 0.8 });
        nota(2100 + Math.random() * 400, 0.04, v * 0.15);
      } else {
        golpe({ frecuencia: 420, q: 0.9, tipo: 'lowpass', duracion: 0.07, volumen: v });
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

    // Llamar en cada cuadro: velocidad total (cm/s) de las bolinchas que ruedan apoyadas.
    rodar(velTierra, velConcreto) {
      if (!ctx || !rodado) return;
      const t = ctx.currentTime;
      const ajustar = (r, vel) => {
        const nivel = activo ? Math.min(vel / 350, 1) * 0.28 : 0;
        r.volumen.gain.setTargetAtTime(nivel, t, 0.05);
        r.filtro.frequency.setTargetAtTime(r.base * (0.7 + Math.min(vel / 300, 1) * 0.6), t, 0.05);
      };
      ajustar(rodado.tierra, velTierra);
      ajustar(rodado.concreto, velConcreto);
    },
  };
}
