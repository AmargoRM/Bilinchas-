// El mundo 3D: dibujante (renderer), cámara, luz de tarde, cielo y reflejos.
import * as THREE from 'three';

export function crearEscena(lienzo) {
  const renderer = new THREE.WebGLRenderer({
    canvas: lienzo,
    antialias: true,
    powerPreference: 'high-performance',
  });
  // Limitar la resolución a 2x: en teléfonos con pantalla 3x se ve igual y pesa mucho menos.
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;

  const escena = new THREE.Scene();
  escena.background = texturaCielo();
  escena.fog = new THREE.Fog(0xd8c9a8, 250, 750);

  const camara = new THREE.PerspectiveCamera(50, 1, 0.5, 2000);

  // Sol de tarde: bajo, cálido y detrás del círculo, para sombras largas hacia la cámara.
  const sol = new THREE.DirectionalLight(0xffd9a8, 3.2);
  sol.position.set(-160, 130, -220);
  sol.castShadow = true;
  sol.shadow.mapSize.set(2048, 2048);
  const s = sol.shadow.camera;
  s.left = -130;
  s.right = 130;
  s.top = 130;
  s.bottom = -130;
  s.near = 50;
  s.far = 700;
  sol.shadow.bias = -0.0004;
  sol.shadow.normalBias = 0.05;
  escena.add(sol, sol.target);

  // Luz de cielo azul arriba y rebote de tierra rojiza abajo.
  escena.add(new THREE.HemisphereLight(0xcfe3ff, 0x7a3e22, 0.9));

  // Reflejos: un "mundo" simplificado (cielo, horizonte verde, tierra, sol)
  // que el vidrio de las bolinchas refleja.
  const pmrem = new THREE.PMREMGenerator(renderer);
  escena.environment = pmrem.fromScene(escenaReflejos(), 0.02).texture;
  escena.environmentIntensity = 0.9;
  pmrem.dispose();

  function ajustarTamano() {
    const ancho = window.innerWidth;
    const alto = window.innerHeight;
    renderer.setSize(ancho, alto, false);
    camara.aspect = ancho / alto;
    // En vertical se ve menos de ancho: abrir un poco el lente.
    camara.fov = camara.aspect < 1 ? 58 : 46;
    camara.updateProjectionMatrix();
  }
  ajustarTamano();
  window.addEventListener('resize', ajustarTamano);

  return { renderer, escena, camara };
}

function lienzo(ancho, alto) {
  const c = document.createElement('canvas');
  c.width = ancho;
  c.height = alto;
  return c;
}

function texturaCielo() {
  const c = lienzo(8, 512);
  const g = c.getContext('2d');
  const grad = g.createLinearGradient(0, 0, 0, 512);
  grad.addColorStop(0, '#6f9fd0');
  grad.addColorStop(0.45, '#bcd3e3');
  grad.addColorStop(0.62, '#efdcb5');
  grad.addColorStop(1, '#d9b98a');
  g.fillStyle = grad;
  g.fillRect(0, 0, 8, 512);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function escenaReflejos() {
  const c = lienzo(16, 256);
  const g = c.getContext('2d');
  const grad = g.createLinearGradient(0, 0, 0, 256);
  grad.addColorStop(0, '#7fb2e6');
  grad.addColorStop(0.44, '#e8eef0');
  grad.addColorStop(0.5, '#5e7a3a');
  grad.addColorStop(0.56, '#8a4b2c');
  grad.addColorStop(1, '#4a2616');
  g.fillStyle = grad;
  g.fillRect(0, 0, 16, 256);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;

  const e = new THREE.Scene();
  e.add(
    new THREE.Mesh(
      new THREE.SphereGeometry(100, 32, 16),
      new THREE.MeshBasicMaterial({ map: t, side: THREE.BackSide })
    )
  );
  // El sol: un punto muy brillante que deja el destello blanco en el vidrio.
  const sol = new THREE.Mesh(
    new THREE.SphereGeometry(7, 16, 8),
    new THREE.MeshBasicMaterial({ color: new THREE.Color(14, 12, 9) })
  );
  sol.position.set(-50, 45, -70);
  e.add(sol);
  return e;
}
