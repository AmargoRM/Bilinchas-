// Saca las capturas de pantalla y la imagen destacada para la ficha de Google Play.
// Uso: npm run build, después `npx vite preview --port 4180` y en otra terminal
//      node herramientas/capturas-tienda.mjs
// Necesita Playwright con Chromium (si no está en el proyecto, indicar la ruta en PLAYWRIGHT_RUTA).
import { mkdirSync, readFileSync } from 'node:fs';

const { chromium } = await import('playwright').catch(() => import(process.env.PLAYWRIGHT_RUTA || '/opt/node22/lib/node_modules/playwright/index.mjs'));

const DIRECCION = process.env.JUEGO_URL || 'http://localhost:4180/';
const SALIDA = 'tienda';
mkdirSync(`${SALIDA}/capturas`, { recursive: true });

const navegador = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });

async function abrir(ancho, alto, escala) {
  const pagina = await navegador.newPage({ viewport: { width: ancho, height: alto }, deviceScaleFactor: escala });
  // Que no pregunte el país ni use progreso de otra prueba.
  await pagina.addInitScript(() => {
    localStorage.setItem('ojo-de-gato.pais', 'cr');
    localStorage.setItem('ojo-de-gato.instrucciones', JSON.stringify(['circulo', 'cano', 'explosivas', 'hoyito']));
  });
  await pagina.goto(DIRECCION);
  await pagina.waitForFunction(() => document.getElementById('cargando').classList.contains('oculto'), null, { timeout: 60000 });
  return pagina;
}

const esperar = (pagina, ms) => pagina.waitForTimeout(ms);
const clic = async (pagina, selector) => {
  await pagina.click(selector);
  await esperar(pagina, 400);
};

// Empieza una partida desde el menú principal (pasa la tarjeta de jugadores si aparece).
async function empezar(pagina, modo) {
  await clic(pagina, '#menu-jugar');
  await clic(pagina, `#modo-${modo}`);
  const jugar = pagina.locator('#tarjeta-botones button', { hasText: /^Jugar$/ });
  if (await jugar.isVisible()) await jugar.click();
  await esperar(pagina, 2500);
}

// ---------- Capturas de teléfono: 1080 × 1920 ----------
const capturas = [
  { nombre: '1-portada', pasos: async () => {} },
  { nombre: '2-menu', pasos: async (p) => clic(p, '#portada') },
  { nombre: '3-modos', pasos: async (p) => { await clic(p, '#portada'); await clic(p, '#menu-jugar'); } },
  { nombre: '4-circulo', pasos: async (p) => { await clic(p, '#portada'); await empezar(p, 'circulo'); } },
  { nombre: '5-cano', pasos: async (p) => { await clic(p, '#portada'); await empezar(p, 'cano'); } },
  { nombre: '6-coleccion', pasos: async (p) => { await clic(p, '#portada'); await clic(p, '#menu-logros'); } },
];
for (const c of capturas) {
  const p = await abrir(360, 640, 3);
  await esperar(p, 1500);
  await c.pasos(p);
  await p.screenshot({ path: `${SALIDA}/capturas/${c.nombre}.png` });
  await p.close();
  console.log(`captura ${c.nombre}`);
}

// ---------- Imagen destacada: 1024 × 500 ----------
{
  const p = await abrir(1024, 500, 1);
  await clic(p, '#portada');
  await empezar(p, 'circulo');
  const bolincha = readFileSync('assets/icono-grande.png').toString('base64');
  await p.evaluate((bolincha) => {
    document.getElementById('hud').style.display = 'none';
    const capa = document.createElement('div');
    capa.style.cssText =
      'position:fixed;inset:0;z-index:99;display:flex;align-items:center;gap:28px;padding:0 56px;' +
      'background:linear-gradient(90deg,rgba(6,22,20,.92) 0%,rgba(6,22,20,.75) 45%,rgba(6,22,20,0) 75%)';
    capa.innerHTML =
      `<img src="data:image/png;base64,${bolincha}" style="width:250px;height:250px;border-radius:50%;` +
      'mask-image:radial-gradient(circle,#000 52%,transparent 70%);-webkit-mask-image:radial-gradient(circle,#000 52%,transparent 70%)">' +
      '<div><div style="font:400 92px/0.95 \'Permanent Marker\';color:#fff;text-shadow:0 4px 0 rgba(0,0,0,.35)">Ojo<br>de Gato</div>' +
      '<div style="font:600 28px \'Barlow Condensed\';color:#bfe9e1;margin-top:14px">Bolinchas · Canicas · Marbles</div></div>';
    document.body.appendChild(capa);
  }, bolincha);
  await esperar(p, 500);
  await p.screenshot({ path: `${SALIDA}/imagen-destacada-1024x500.png` });
  await p.close();
  console.log('imagen destacada');
}

await navegador.close();
