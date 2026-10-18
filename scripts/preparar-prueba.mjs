// Convierte el juego empaquetado en un solo archivo (dist-prueba/index.html)
// al formato de página de prueba: sin las etiquetas de documento, que la
// página de prueba agrega sola.
import { readFileSync, writeFileSync } from 'node:fs';

const entrada = 'dist-prueba/index.html';
const salida = 'dist-prueba/ojo-de-gato.html';

let html = readFileSync(entrada, 'utf8');
html = html
  .replace(/<!doctype html>/i, '')
  .replace(/<\/?html[^>]*>/gi, '')
  .replace(/<\/?head>/gi, '')
  .replace(/<\/?body[^>]*>/gi, '')
  .replace(/<meta charset[^>]*>/i, '')
  .replace(/<meta name="viewport"[^>]*>/i, '');

// El título tiene que quedar al principio del archivo.
const titulo = html.match(/<title>.*?<\/title>/)[0];
html = titulo + '\n' + html.replace(titulo, '').trim() + '\n';

writeFileSync(salida, html);
console.log(`Listo: ${salida} (${(html.length / 1024 / 1024).toFixed(2)} MB)`);
