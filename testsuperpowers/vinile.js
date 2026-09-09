import {
  DISC_RADIUS,
  pointerBendIntensity,
  vertexRigidity,
  isPointerOnDisc,
  squashAmount,
  bendDirection
} from './fisica.js';

const canvas = document.getElementById('stage');
const errore = document.getElementById('errore-webgl');
const aiuto = document.getElementById('aiuto');

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
      if (r > 1.0 || r < 0.035) discard;
      float grooves = 0.5 + 0.5 * sin(r * 78.0);
      float label = smoothstep(0.28, 0.18, r);
      vec3 irid = vec3(
        0.2 + 0.45 * sin(r * 12.0 + uTime),
        0.8 + 0.2 * sin(r * 9.0 - p.x * 3.0),
        0.4 + 0.45 * sin(p.y * 8.0 + uTime * 0.7)
      );
      vec3 green = vec3(0.2, 1.0, 0.4);
      vec3 labelCol = vec3(0.08, 0.42, 0.18);
      vec3 col = mix(irid * 0.5 + green * 0.45 * grooves, labelCol, label);
      float alpha = mix(0.62, 0.95, label);
      float edge = smoothstep(1.0, 0.96, r);
      gl_FragColor = vec4(col, alpha * edge);
    }
  `
});

const geo = new THREE.CircleGeometry(DISC_RADIUS, 96);
const rest = Float32Array.from(geo.attributes.position.array);
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
const raycaster = new THREE.Raycaster();
const ndc = new THREE.Vector2();
const pointer = { x: 0, y: 0, active: false };
let tapAt = -999;
let piega = 0;
let schiaccia = 0;
let piegaSm = 0;
let dirSmX = 0;
let dirSmY = 0;
let firstGesture = false;

export function getRotationY() {
  return disc.rotation.z;
}

export function getDeformState() {
  return { piega, schiaccia };
}

export function notifyFirstGesture() {
  if (firstGesture) return;
  firstGesture = true;
  aiuto.hidden = true;
}

function pointerOnDiscPlane(ev) {
  const rect = canvas.getBoundingClientRect();
  ndc.x = ((ev.clientX - rect.left) / rect.width) * 2 - 1;
  ndc.y = -((ev.clientY - rect.top) / rect.height) * 2 + 1;
  raycaster.setFromCamera(ndc, camera);
  disc.updateWorldMatrix(true, false);
  const n = new THREE.Vector3(0, 0, 1).applyQuaternion(disc.quaternion);
  const origin = new THREE.Vector3().setFromMatrixPosition(disc.matrixWorld);
  const discPlane = new THREE.Plane().setFromNormalAndCoplanarPoint(n, origin);
  const worldHit = new THREE.Vector3();
  if (!raycaster.ray.intersectPlane(discPlane, worldHit)) {
    pointer.active = false;
    return;
  }
  const local = disc.worldToLocal(worldHit.clone());
  pointer.x = local.x;
  pointer.y = local.y;
  pointer.active = true;
}

function applyDeform(now, dt) {
  const dist = Math.hypot(pointer.x, pointer.y);
  const piegaTarget = pointer.active ? pointerBendIntensity(dist) : 0;
  schiaccia = squashAmount(now - tapAt);
  const dir = bendDirection(pointer.x, pointer.y);
  const follow = 1 - Math.exp(-dt * 8);
  piegaSm += (piegaTarget - piegaSm) * follow;
  dirSmX += (dir.x - dirSmX) * follow;
  dirSmY += (dir.y - dirSmY) * follow;
  piega = piegaSm;
  const pos = geo.attributes.position;
  const arr = pos.array;
  const BEND_MAX = 0.42;
  const SQUASH_MAX = 0.5;
  const DENT = 0.28;
  for (let i = 0; i < arr.length; i += 3) {
    const rx = rest[i];
    const ry = rest[i + 1];
    const rz = rest[i + 2];
    const vr = Math.hypot(rx, ry);
    const rigid = vertexRigidity(vr);
    const pull = piegaSm * rigid * BEND_MAX;
    let x = rx + dirSmX * pull;
    let y = ry + dirSmY * pull;
    const scale = 1 - schiaccia * rigid * SQUASH_MAX;
    x *= scale;
    y *= scale;
    arr[i] = x;
    arr[i + 1] = y;
    arr[i + 2] = rz - schiaccia * rigid * DENT;
  }
  pos.needsUpdate = true;
}

canvas.addEventListener('pointermove', (ev) => {
  pointerOnDiscPlane(ev);
  notifyFirstGesture();
});
canvas.addEventListener('pointerdown', (ev) => {
  pointerOnDiscPlane(ev);
  notifyFirstGesture();
  const dist = Math.hypot(pointer.x, pointer.y);
  if (pointer.active && isPointerOnDisc(dist)) tapAt = clock.elapsedTime;
});
canvas.addEventListener('pointerleave', () => {
  pointer.active = false;
});

function tick() {
  const dt = clock.getDelta();
  uniforms.uTime.value += dt;
  disc.rotation.z -= ROT_SPEED * dt;
  applyDeform(clock.elapsedTime, dt);
  renderer.render(scene, camera);
  requestAnimationFrame(tick);
}
tick();
