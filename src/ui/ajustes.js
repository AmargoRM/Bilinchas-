// Panel "Ajustar física": deslizadores para probar valores sin tocar el código.
// Los cambios quedan guardados en este teléfono. Para dejarlos fijos en el
// juego hay que copiarlos a src/config.js.
import { CONFIG } from '../config.js';
import { tx } from '../textos.js';

const CLAVE_GUARDADO = 'ojo-de-gato.ajustes-fisica';

const AJUSTES = [
  {
    id: 'fuerza',
    etiqueta: 'Fuerza máxima',
    lugar: () => CONFIG.tiro,
    clave: 'velocidadMaxima',
    min: 150,
    max: 700,
    paso: 10,
    mostrar: (v) => `${(v / 100).toFixed(1)} m/s`,
  },
  {
    id: 'rodadura',
    etiqueta: 'Frenado de la tierra',
    lugar: () => CONFIG.superficies.tierra,
    clave: 'resistenciaRodadura',
    min: 0.02,
    max: 0.4,
    paso: 0.01,
    mostrar: (v) => v.toFixed(2),
  },
  {
    id: 'frenado',
    etiqueta: 'Frenado en tiros fuertes',
    lugar: () => CONFIG.superficies.tierra,
    clave: 'frenado',
    min: 0,
    max: 2,
    paso: 0.05,
    mostrar: (v) => v.toFixed(2),
  },
  {
    id: 'rebote',
    etiqueta: 'Rebote entre {bolinchas}',
    lugar: () => CONFIG.bolinchas,
    clave: 'rebote',
    min: 0.3,
    max: 1,
    paso: 0.01,
    mostrar: (v) => v.toFixed(2),
  },
];

// Valores originales de config.js, para el botón "Restablecer".
const ORIGINALES = Object.fromEntries(AJUSTES.map((a) => [a.id, a.lugar()[a.clave]]));

function leerGuardados() {
  try {
    return JSON.parse(localStorage.getItem(CLAVE_GUARDADO)) || {};
  } catch {
    return {};
  }
}

function guardar() {
  try {
    localStorage.setItem(CLAVE_GUARDADO, JSON.stringify(Object.fromEntries(AJUSTES.map((a) => [a.id, a.lugar()[a.clave]]))));
  } catch {
    // Sin almacenamiento disponible: los ajustes duran hasta cerrar la página.
  }
}

// Aplica a CONFIG los valores guardados en el teléfono. Llamar antes de crear las bolinchas.
export function cargarAjustesGuardados() {
  const guardados = leerGuardados();
  for (const a of AJUSTES) {
    const v = guardados[a.id];
    if (typeof v === 'number' && v >= a.min && v <= a.max) a.lugar()[a.clave] = v;
  }
}

export function crearPanelAjustes({ alCambiar }) {
  const panel = document.getElementById('panel-ajustes');
  const lista = document.getElementById('ajustes-lista');
  const textoValores = document.getElementById('ajustes-valores');
  const btnAbrir = document.getElementById('btn-ajustes');

  const filas = AJUSTES.map((a) => {
    const fila = document.createElement('label');
    fila.className = 'ajuste';
    fila.htmlFor = 'ajuste-' + a.id;
    fila.innerHTML = '<span class="ajuste-nombre"></span><span class="ajuste-valor"></span>';
    fila.querySelector('.ajuste-nombre').dataset.tx = a.etiqueta; // se completa según el país
    fila.querySelector('.ajuste-nombre').textContent = tx(a.etiqueta);
    const control = document.createElement('input');
    control.type = 'range';
    control.id = 'ajuste-' + a.id;
    control.min = a.min;
    control.max = a.max;
    control.step = a.paso;
    fila.appendChild(control);
    lista.appendChild(fila);
    const valor = fila.querySelector('.ajuste-valor');
    control.addEventListener('input', () => {
      a.lugar()[a.clave] = Number(control.value);
      valor.textContent = a.mostrar(Number(control.value));
      actualizarTexto();
      guardar();
      alCambiar();
    });
    return { a, control, valor };
  });

  function textoParaCopiar() {
    return AJUSTES.map((a) => `${tx(a.etiqueta)}: ${a.lugar()[a.clave]}`).join(' · ');
  }

  function actualizarTexto() {
    textoValores.textContent = textoParaCopiar();
  }

  function refrescar() {
    for (const { a, control, valor } of filas) {
      control.value = a.lugar()[a.clave];
      valor.textContent = a.mostrar(a.lugar()[a.clave]);
    }
    actualizarTexto();
  }
  refrescar();

  function abrir(si) {
    panel.hidden = !si;
    btnAbrir.setAttribute('aria-expanded', String(si));
  }

  btnAbrir.addEventListener('click', () => abrir(panel.hidden));
  document.getElementById('ajustes-cerrar').addEventListener('click', () => abrir(false));

  document.getElementById('ajustes-restablecer').addEventListener('click', () => {
    for (const a of AJUSTES) a.lugar()[a.clave] = ORIGINALES[a.id];
    refrescar();
    guardar();
    alCambiar();
  });

  const btnCopiar = document.getElementById('ajustes-copiar');
  btnCopiar.addEventListener('click', () => {
    const avisar = (texto) => {
      btnCopiar.textContent = texto;
      setTimeout(() => (btnCopiar.textContent = 'Copiar valores'), 1800);
    };
    const seleccionar = () => {
      const rango = document.createRange();
      rango.selectNodeContents(textoValores);
      const sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(rango);
      avisar('Seleccionados: cópialos');
    };
    try {
      navigator.clipboard.writeText(textoParaCopiar()).then(() => avisar('Copiados'), seleccionar);
    } catch {
      seleccionar();
    }
  });
}
