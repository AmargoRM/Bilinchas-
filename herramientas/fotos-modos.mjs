// Saca las fotos de las tarjetas de "Modos de juego" desde el juego real
// (src/assets/modo-*.jpg). Uso: npm run build, `npx vite preview --port 4180`
// y en otra terminal: node herramientas/fotos-modos.mjs
const { chromium } = await import('playwright').catch(() => import(process.env.PLAYWRIGHT_RUTA || '/opt/node22/lib/node_modules/playwright/index.mjs'));
const DIRECCION = process.env.JUEGO_URL || 'http://localhost:4180/';
const navegador = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });

for (const modo of process.argv.slice(2).length ? process.argv.slice(2) : ['circulo', 'cano']) {
  const p = await navegador.newPage({ viewport: { width: 640, height: 290 }, deviceScaleFactor: 1.5 });
  await p.addInitScript(() => {
    localStorage.setItem('ojo-de-gato.pais', 'cr');
    localStorage.setItem('ojo-de-gato.instrucciones', JSON.stringify(['circulo', 'cano']));
  });
  await p.goto(DIRECCION);
  await p.waitForFunction(() => document.getElementById('cargando').classList.contains('oculto'), null, { timeout: 60000 });
  await p.click('#portada');
  await p.click('#menu-jugar');
  await p.click(`#modo-${modo}`);
  await p.locator('#tarjeta-botones button', { hasText: /^Jugar$/ }).click();
  await p.waitForTimeout(2500);
  await p.addStyleTag({ content: '#hud, #tarjeta { display: none !important; }' });
  await p.waitForTimeout(1500);
  await p.screenshot({ path: `src/assets/modo-${modo}.jpg`, type: 'jpeg', quality: 82 });
  await p.close();
  console.log(`foto ${modo}`);
}
await navegador.close();
