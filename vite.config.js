import { defineConfig } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';

// Modo normal: genera la carpeta dist/ (la que usará Capacitor en la etapa 7).
// Modo "prueba": junta todo en un solo archivo HTML para probar en el teléfono.
export default defineConfig(({ mode }) => ({
  base: './',
  plugins: mode === 'prueba' ? [viteSingleFile()] : [],
  build: {
    outDir: mode === 'prueba' ? 'dist-prueba' : 'dist',
    target: 'es2020',
  },
}));
