// Aviso de versión nueva (solo mientras el juego está en desarrollo).
// Al abrir la app pregunta a GitHub cuál es la última fabricación terminada del APK;
// si es más nueva que esta, avisa y ofrece bajarla directo (página de descarga "prueba",
// que el proceso de GitHub actualiza en cada fabricación; no hace falta iniciar sesión).
// Para publicar en Google Play: poner CONFIG.desarrollo.buscarActualizaciones en false
// (y entonces la app puede volver a no tener permiso de internet).
import { CONFIG } from './config.js';

/* global __NUMERO_VERSION__ */
export const NUMERO_VERSION = Number(typeof __NUMERO_VERSION__ !== 'undefined' ? __NUMERO_VERSION__ : 0);

// Llama a alHaber({ numero, direccion }) si hay una versión más nueva. Si no hay internet
// o GitHub no responde, no pasa nada.
export async function buscarActualizacion(alHaber) {
  const d = CONFIG.desarrollo;
  if (!d.buscarActualizaciones || !NUMERO_VERSION) return;
  try {
    const url = `https://api.github.com/repos/${d.repositorio}/actions/workflows/${d.proceso}/runs?branch=${encodeURIComponent(d.rama)}&status=success&per_page=1`;
    const respuesta = await fetch(url, { headers: { Accept: 'application/vnd.github+json' } });
    if (!respuesta.ok) return;
    const ultima = (await respuesta.json()).workflow_runs?.[0];
    if (ultima && ultima.run_number > NUMERO_VERSION) {
      alHaber({ numero: ultima.run_number, direccion: `https://github.com/${d.repositorio}/releases/download/${d.paginaDescarga}/${d.archivo}` });
    }
  } catch {
    // sin internet: se vuelve a preguntar la próxima vez que se abra
  }
}
