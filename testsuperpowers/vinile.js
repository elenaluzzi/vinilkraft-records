import { DISC_RADIUS } from './fisica.js';

const canvas = document.getElementById('stage');
const errore = document.getElementById('errore-webgl');

function showWebglError() {
  errore.hidden = false;
}

let renderer;
try {
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setClearColor(0x050705, 1);
} catch (e) {
  showWebglError();
  throw e;
}

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 50);
camera.position.set(0, 2.35, 4.2);
camera.lookAt(0, 0, 0);

const uniforms = {
  uTime: { value: 0 }
};

const mat = new THREE.ShaderMaterial({
  transparent: true,
  uniforms,
  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    varying vec2 vUv;
    uniform float uTime;
    void main() {
      vec2 p = vUv * 2.0 - 1.0;
      float r = length(p);
      if (r > 1.0) discard;
      float grooves = sin(r * 78.0) * 0.04;
      float label = smoothstep(0.24, 0.20, r);
      vec3 irid = vec3(
        0.15 + 0.35 * sin(r * 12.0 + uTime),
        0.75 + 0.25 * sin(r * 9.0 - p.x * 3.0),
        0.35 + 0.4 * sin(p.y * 8.0 + uTime * 0.7)
      );
      vec3 green = vec3(0.15, 0.95, 0.35);
      vec3 col = mix(irid * 0.55 + green * 0.35, vec3(0.05, 0.12, 0.08), label);
      float alpha = mix(0.55 + grooves, 0.92, label);
      float edge = smoothstep(1.0, 0.96, r);
      gl_FragColor = vec4(col, alpha * edge);
    }
  `
});

const geo = new THREE.CircleGeometry(DISC_RADIUS, 96);
const disc = new THREE.Mesh(geo, mat);
disc.rotation.x = -Math.PI / 2.35;
scene.add(disc);

function resize() {
  const w = window.innerWidth;
  const h = window.innerHeight;
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
}
window.addEventListener('resize', resize);
resize();

const clock = new THREE.Clock();
const ROT_SPEED = 0.55;

export function getRotationY() {
  return disc.rotation.z;
}

function tick() {
  const dt = clock.getDelta();
  uniforms.uTime.value += dt;
  disc.rotation.z -= ROT_SPEED * dt;
  renderer.render(scene, camera);
  requestAnimationFrame(tick);
}
tick();
