const THREE = await import('three');
const { crearFisica } = await import('./src/fisica.js');
const { crearBolincha } = await import('./src/bolincha.js');
for (const variante of ['quitar-colocar', 'solo colocar', 'nada']) {
  const f = await crearFisica(); const esc = new THREE.Scene();
  const a = crearBolincha({ escena: esc, fisica: f, posicion: { x: 0, z: 0 } });
  const b = crearBolincha({ escena: esc, fisica: f, posicion: { x: 0, z: -20 } });
  if (variante === 'quitar-colocar') { b.quitar(); b.colocar(0, -20); }
  if (variante === 'solo colocar') { b.colocar(0, -20); }
  for (let i = 0; i < 30; i++) f.avanzar(1/60);
  b.frenarSiCasiQuieta(); a.frenarSiCasiQuieta();
  a.tirar(new THREE.Vector3(0,0,-1), 0.5);
  let minY = 9;
  for (let i = 0; i < 120; i++) { f.avanzar(1/60, s => [a,b].forEach(x => x.aplicarRodadura(s))); minY = Math.min(minY, b.posicion.y); }
  console.log(variante, 'despues y', b.posicion.y.toFixed(2), 'minY', minY.toFixed(2));
}
