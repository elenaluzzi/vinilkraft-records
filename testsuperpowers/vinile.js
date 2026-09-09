import {
  DISC_RADIUS,
  pointerBendIntensity,
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
  renderer.sortObjects = true;
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
  depthWrite: false,
  side: THREE.DoubleSide,
  uniforms,
  vertexShader: `
    varying vec2 vUv;
    varying float vLift;
    void main() {
      vUv = uv;
      vLift = position.z;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    varying vec2 vUv;
    varying float vLift;
    uniform float uTime;
    void main() {
      vec2 p = vUv * 2.0 - 1.0;
      float r = length(p);
      if (r > 1.0 || r < 0.028) discard;
      float grooves = 0.7 + 0.3 * sin(r * 28.0 + vLift * 6.0);
      float label = smoothstep(0.24, 0.14, r);
      vec3 irid = vec3(
        0.45 + 0.4 * sin(r * 6.0 + uTime * 0.6),
        0.95 + 0.12 * sin(r * 4.0 - p.x * 2.0),
        0.65 + 0.35 * sin(p.y * 4.0 + uTime * 0.4)
      );
      vec3 jelly = vec3(0.35, 1.0, 0.55);
      vec3 labelCol = vec3(0.18, 0.7, 0.38);
      vec3 col = mix(irid * 0.28 + jelly * 0.32 * grooves, labelCol, label * 0.4);
      float rim = smoothstep(0.62, 1.0, r);
      float alpha = mix(0.09, 0.26, rim);
      alpha = mix(alpha, 0.18, label);
      alpha += abs(vLift) * 0.18;
      float edge = smoothstep(1.0, 0.88, r);
      gl_FragColor = vec4(col, clamp(alpha, 0.05, 0.32) * edge);
    }
  `
});

const geo = new THREE.CircleGeometry(DISC_RADIUS, 160);
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
const ROT_SPEED = 0.38;
const raycaster = new THREE.Raycaster();
const ndc = new THREE.Vector2();
const pointer = { x: 0, y: 0, active: false };
let tapAt = -999;
let piega = 0;
let schiaccia = 0;
let piegaSm = 0;
let dirSmX = 0;
let dirSmY = 0;
let wobble = 0;
let wobbleVel = 0;
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
  const follow = 1 - Math.exp(-dt * 2.6);
  const prev = piegaSm;
  piegaSm += (piegaTarget - piegaSm) * follow;
  dirSmX += (dir.x - dirSmX) * follow;
  dirSmY += (dir.y - dirSmY) * follow;
  wobbleVel += (piegaSm - prev) * 16;
  wobbleVel += -wobble * 20 * dt;
  wobbleVel *= Math.exp(-dt * 2.8);
  wobble += wobbleVel * dt;
  piega = piegaSm;
  const pos = geo.attributes.position;
  const arr = pos.array;
  for (let i = 0; i < arr.length; i += 3) {
    const rx = rest[i];
    const ry = rest[i + 1];
    const rz = rest[i + 2];
    const vr = Math.hypot(rx, ry);
    const rim = vr < 0.02 ? 0 : Math.pow(Math.min(1, vr / DISC_RADIUS), 5.5);
    const nx = vr < 0.02 ? 0 : rx / vr;
    const ny = vr < 0.02 ? 0 : ry / vr;
    const angle = Math.atan2(ry, rx);
    const facing = nx * dirSmX + ny * dirSmY;
    const idle =
      Math.sin(angle * 5 - now * 2.4) * 0.07 +
      Math.sin(angle * 9 + now * 1.6) * 0.035;
    const nearPointer = piegaSm * Math.max(0, facing) * 0.28;
    const jiggle = wobble * Math.sin(angle * 4 - now * 5) * 0.1;
    const squashZ = schiaccia * rim * 0.22;
    arr[i] = rx;
    arr[i + 1] = ry;
    arr[i + 2] = rz + rim * (idle + nearPointer + jiggle) - squashZ;
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
  if (pointer.active && isPointerOnDisc(dist)) {
    tapAt = clock.elapsedTime;
    wobbleVel += 2.4;
  }
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
