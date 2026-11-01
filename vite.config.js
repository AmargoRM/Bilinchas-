import { defineConfig } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';

// Regla de seguridad para la app (CSP): el juego solo puede cargar sus propios archivos
// y no puede conectarse a ningún sitio de internet.
// ('wasm-unsafe-eval' lo necesita la física; 'unsafe-inline' lo necesita Capacitor para su puente.)
const REGLA_SEGURIDAD = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  // (api.github.com: solo para el aviso de versión nueva mientras está en desarrollo)
  "connect-src 'self' data: blob: https://api.github.com",
  "object-src 'none'",
  "base-uri 'none'",
  "form-action 'none'",
].join('; ');

const conReglaDeSeguridad = {
  name: 'regla-de-seguridad',
  transformIndexHtml: (html) =>
    html.replace('<meta charset="UTF-8" />', `<meta charset="UTF-8" />\n    <meta http-equiv="Content-Security-Policy" content="${REGLA_SEGURIDAD}" />`),
};

// Modo normal: genera la carpeta dist/ (la que usará Capacitor en la etapa 7).
// Modo "prueba": junta todo en un solo archivo HTML para probar en el teléfono.
export default defineConfig(({ mode }) => ({
  base: './',
  // El número de la fabricación en GitHub (0 si se arma a mano): para el aviso de versión nueva.
  define: { __NUMERO_VERSION__: JSON.stringify(process.env.NUMERO_VERSION || '0') },
  plugins: mode === 'prueba' ? [viteSingleFile()] : [conReglaDeSeguridad],
  build: {
    outDir: mode === 'prueba' ? 'dist-prueba' : 'dist',
    target: 'es2020',
  },
}));
