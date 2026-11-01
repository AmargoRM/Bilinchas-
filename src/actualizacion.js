// Aviso de versión nueva (solo mientras el juego está en desarrollo).
// Al abrir la app pregunta a GitHub cuál es la última fabricación terminada del APK;
// si es más nueva que esta, avisa y ofrece bajarla directo (página de descarga "prueba",
// que el proceso de GitHub actualiza en cada fabricación; no hace falta iniciar sesión).
// Para publicar en Google Play: poner CONFIG.desarrollo.buscarActualizaciones en false
// (y entonces la app puede volver a no tener permiso de internet).
import { registerPlugin } from '@capacitor/core';
import { CONFIG } from './config.js';

/* global __NUMERO_VERSION__ */
export const NUMERO_VERSION = Number(typeof __NUMERO_VERSION__ !== 'undefined' ? __NUMERO_VERSION__ : 0);

// Llama a alHaber({ numero, direccion }) si hay una versión más nueva. Si no hay internet
// o GitHub no responde, no pasa nada.
export async function buscarActualizacion(alHaber) {
  const r = await consultarUltimaVersion();
  if (r && r.numero > NUMERO_VERSION) alHaber(r);
}

// La última versión publicada: { numero, direccion }, o null si no se pudo preguntar.
export async function consultarUltimaVersion() {
  const d = CONFIG.desarrollo;
  if (!d.buscarActualizaciones || !NUMERO_VERSION) return null;
  try {
    const url = `https://api.github.com/repos/${d.repositorio}/actions/workflows/${d.proceso}/runs?branch=${encodeURIComponent(d.rama)}&status=success&per_page=1`;
    const respuesta = await fetch(url, { headers: { Accept: 'application/vnd.github+json' } });
    if (!respuesta.ok) return null;
    const ultima = (await respuesta.json()).workflow_runs?.[0];
    if (!ultima) return null;
    return { numero: ultima.run_number, direccion: `https://github.com/${d.repositorio}/releases/download/${d.paginaDescarga}/${d.archivo}` };
  } catch {
    // sin internet: se vuelve a preguntar la próxima vez que se abra
    return null;
  }
}

// ---- Bajar sin salir del juego (solo en la app de Android) ----
// Usa el complemento propio "Actualizador" (ActualizadorPlugin.java).
const Actualizador = registerPlugin('Actualizador');

// Baja el APK de la versión r en segundo plano. alProgreso(porcentaje) mientras baja.
// Devuelve true si quedó listo para instalar.
export async function bajarVersion(r, alProgreso) {
  const oyente = await Actualizador.addListener('progreso', (p) => alProgreso?.(p.porcentaje));
  try {
    const x = await Actualizador.descargar({ url: r.direccion, numero: r.numero });
    return !!x?.listo;
  } catch {
    return false;
  } finally {
    oyente.remove();
  }
}

// Abre el instalador de Android. Devuelve 'instalando', 'permiso' (hay que dar permiso
// y volver a tocar) o 'error'.
export async function instalarVersion(numero) {
  try {
    const x = await Actualizador.instalar({ numero });
    return x?.faltaPermiso ? 'permiso' : 'instalando';
  } catch {
    return 'error';
  }
}

// Borra APKs bajados que ya no sirven (cuando no hay versión nueva).
export function limpiarBajadas() {
  Actualizador.limpiar().catch(() => {});
}
