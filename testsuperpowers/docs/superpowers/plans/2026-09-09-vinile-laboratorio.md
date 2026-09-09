# Vinile da laboratorio Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Una pagina statica a sé con un vinile da laboratorio (trasparente, verde acido, iridescente) che gira sempre, si piega verso il puntatore, si schiaccia al tap e sporca un loop elettronico in base a piega e schiacciamento.

**Architecture:** Logica pura in `fisica.js` e `audio-params.js` (testabile con `node --test`, senza npm). Rendering WebGL del disco in `vinile.js` (Three.js da CDN). Audio Web Audio in `audio.js` su un loop nel repo. `index.html` + `styles.css` solo scena, overlay e messaggi. Nessun build, nessun backend.

**Tech Stack:** HTML, CSS, JavaScript ESM, Three.js r128 (CDN), Web Audio API, Node.js built-in test runner (`node --test`).

## Global Constraints

- Nessun npm, webpack, vite o backend; solo file statici e `node --test` per la logica pura.
- Testi interfaccia in italiano, esatti: `muovi per piegare · tocca per schiacciare` (desktop), `muovi · tocca` (viewport stretta), `audio non disponibile`, `questo esperimento ha bisogno di un browser più recente`.
- Rotazione del disco mai in pausa; piega e schiaccia si sommano.
- Audio parte solo al primo gesto utente; se manca o è bloccato, il gioco visivo resta.
- File solo sotto `testsuperpowers/` (non toccare Vinilkraft / Vision Fest).
- Durata schiacciamento `SQUASH_DURATION = 2.0` secondi (dentro 1,5–2,5).
- Piegare se distanza dal centro ≤ `1.2` raggi; schiacciare solo se distanza ≤ `1.0` raggio.

---

## File map

| File | Responsabilità |
| --- | --- |
| `testsuperpowers/fisica.js` | Costanti e math: intensità piega, rigidità etichetta, inviluppo squash, hit-test |
| `testsuperpowers/audio-params.js` | `piega`/`schiaccia` → parametri effetti |
| `testsuperpowers/tests/fisica.test.mjs` | Test `fisica.js` |
| `testsuperpowers/tests/audio-params.test.mjs` | Test `audio-params.js` |
| `testsuperpowers/index.html` | Canvas, overlay aiuto, nota audio, messaggio WebGL |
| `testsuperpowers/styles.css` | Fondo scuro, full viewport, overlay, mobile |
| `testsuperpowers/vinile.js` | Three.js, input, deformazione vertici, loop di frame |
| `testsuperpowers/audio.js` | Context, load loop, catena effetti, unlock al gesto |
| `testsuperpowers/scripts/make-loop.mjs` | Genera `audio/laboratorio.wav` senza dipendenze |
| `testsuperpowers/audio/laboratorio.wav` | Loop elettronico sperimentale |

---

### Task 1: Math della deformazione

**Files:**
- Create: `testsuperpowers/fisica.js`
- Test: `testsuperpowers/tests/fisica.test.mjs`

**Interfaces:**
- Consumes: niente
- Produces:
  - `DISC_RADIUS = 1`
  - `BEND_RANGE = 1.2`
  - `LABEL_RADIUS = 0.22`
  - `SQUASH_DURATION = 2`
  - `pointerBendIntensity(distFromCenter: number): number` → 0–1
  - `vertexRigidity(vertexRadius: number): number` → 0 sul perno/etichetta, 1 sul bordo
  - `isPointerOnDisc(distFromCenter: number): boolean`
  - `squashAmount(secondsSinceTap: number): number` → 0–1, 0 fuori da `[0, SQUASH_DURATION)`
  - `bendDirection(px: number, py: number): { x: number, y: number }` → vettore unitario nel piano; `{0,0}` se il puntatore è sul centro

- [ ] **Step 1: Write the failing test**

Crea `testsuperpowers/tests/fisica.test.mjs`:

```js
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  BEND_RANGE,
  DISC_RADIUS,
  LABEL_RADIUS,
  SQUASH_DURATION,
  pointerBendIntensity,
  vertexRigidity,
  isPointerOnDisc,
  squashAmount,
  bendDirection
} from '../fisica.js';

describe('pointerBendIntensity', () => {
  it('è 1 sopra il disco', () => {
    assert.equal(pointerBendIntensity(0), 1);
    assert.equal(pointerBendIntensity(DISC_RADIUS), 1);
  });
  it('decade nella corona e è 0 oltre 1.2 raggi', () => {
    const mid = (DISC_RADIUS + BEND_RANGE) / 2;
    const v = pointerBendIntensity(mid);
    assert.ok(v > 0 && v < 1);
    assert.equal(pointerBendIntensity(BEND_RANGE), 0);
    assert.equal(pointerBendIntensity(BEND_RANGE + 0.01), 0);
  });
});

describe('vertexRigidity', () => {
  it('è 0 sull’etichetta e ~1 sul bordo', () => {
    assert.equal(vertexRigidity(0), 0);
    assert.equal(vertexRigidity(LABEL_RADIUS), 0);
    assert.ok(vertexRigidity(DISC_RADIUS) > 0.99);
  });
});

describe('isPointerOnDisc', () => {
  it('true solo dentro il raggio', () => {
    assert.equal(isPointerOnDisc(DISC_RADIUS), true);
    assert.equal(isPointerOnDisc(DISC_RADIUS + 0.01), false);
  });
});

describe('squashAmount', () => {
  it('è 0 prima del tap e dopo la durata', () => {
    assert.equal(squashAmount(-0.1), 0);
    assert.equal(squashAmount(SQUASH_DURATION), 0);
    assert.equal(squashAmount(SQUASH_DURATION + 1), 0);
  });
  it('è alto subito dopo il tap e poi scende', () => {
    const a = squashAmount(0.05);
    const b = squashAmount(1.5);
    assert.ok(a > 0.5);
    assert.ok(b < a);
    assert.ok(b > 0);
  });
});

describe('bendDirection', () => {
  it('restituisce un vettore unitario', () => {
    const d = bendDirection(3, 4);
    assert.ok(Math.abs(d.x * d.x + d.y * d.y - 1) < 1e-6);
    assert.ok(Math.abs(d.x - 0.6) < 1e-6);
  });
  it('è zero sul centro', () => {
    const d = bendDirection(0, 0);
    assert.equal(d.x, 0);
    assert.equal(d.y, 0);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test testsuperpowers/tests/fisica.test.mjs`  
Working directory: `C:\Users\asus\OneDrive\Desktop\test`  
Expected: FAIL (modulo `fisica.js` assente)

- [ ] **Step 3: Write minimal implementation**

Crea `testsuperpowers/fisica.js`:

```js
export const DISC_RADIUS = 1;
export const BEND_RANGE = 1.2;
export const LABEL_RADIUS = 0.22;
export const SQUASH_DURATION = 2;

export function pointerBendIntensity(distFromCenter) {
  if (distFromCenter > BEND_RANGE) return 0;
  if (distFromCenter <= DISC_RADIUS) return 1;
  return 1 - (distFromCenter - DISC_RADIUS) / (BEND_RANGE - DISC_RADIUS);
}

export function vertexRigidity(vertexRadius) {
  if (vertexRadius <= LABEL_RADIUS) return 0;
  const t = (vertexRadius - LABEL_RADIUS) / (DISC_RADIUS - LABEL_RADIUS);
  return Math.min(1, Math.max(0, t));
}

export function isPointerOnDisc(distFromCenter) {
  return distFromCenter <= DISC_RADIUS;
}

export function squashAmount(secondsSinceTap) {
  if (secondsSinceTap < 0 || secondsSinceTap >= SQUASH_DURATION) return 0;
  const t = secondsSinceTap / SQUASH_DURATION;
  return Math.sin((1 - t) * Math.PI) * Math.exp(-1.8 * t);
}

export function bendDirection(px, py) {
  const len = Math.hypot(px, py);
  if (len < 1e-6) return { x: 0, y: 0 };
  return { x: px / len, y: py / len };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test testsuperpowers/tests/fisica.test.mjs`  
Expected: PASS (tutti i test)

- [ ] **Step 5: Commit**

```bash
git add testsuperpowers/fisica.js testsuperpowers/tests/fisica.test.mjs
git commit -m "feat(vinile): math piega, rigidità etichetta e inviluppo squash"
```

---

### Task 2: Mappatura piega/schiaccia → effetti audio

**Files:**
- Create: `testsuperpowers/audio-params.js`
- Test: `testsuperpowers/tests/audio-params.test.mjs`

**Interfaces:**
- Consumes: niente
- Produces: `effectParams(piega: number, schiaccia: number): { distortion: number, delay: number, filterHz: number, glitchGain: number }`
  - `piega` e `schiaccia` clamp 0–1
  - a `(0,0)`: `distortion === 0`, `delay === 0`, `filterHz === 12000`, `glitchGain === 0` (suono pulito)
  - `piega` alza distortion e delay, abbassa `filterHz`
  - `schiaccia` alza `glitchGain` e distortion extra

- [ ] **Step 1: Write the failing test**

Crea `testsuperpowers/tests/audio-params.test.mjs`:

```js
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { effectParams } from '../audio-params.js';

describe('effectParams', () => {
  it('a zero è pulito', () => {
    const p = effectParams(0, 0);
    assert.equal(p.distortion, 0);
    assert.equal(p.delay, 0);
    assert.equal(p.filterHz, 12000);
    assert.equal(p.glitchGain, 0);
  });
  it('la piega sporca filtro e delay', () => {
    const p = effectParams(1, 0);
    assert.ok(p.distortion > 0.4);
    assert.ok(p.delay > 0.15);
    assert.ok(p.filterHz < 4000);
    assert.equal(p.glitchGain, 0);
  });
  it('lo schiaccia accende il glitch', () => {
    const p = effectParams(0, 1);
    assert.ok(p.glitchGain > 0.6);
    assert.ok(p.distortion > 0.2);
  });
  it('clampa valori fuori range', () => {
    const p = effectParams(9, -2);
    const q = effectParams(1, 0);
    assert.deepEqual(p, q);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test testsuperpowers/tests/audio-params.test.mjs`  
Expected: FAIL (modulo assente)

- [ ] **Step 3: Write minimal implementation**

Crea `testsuperpowers/audio-params.js`:

```js
function clamp01(v) {
  return Math.min(1, Math.max(0, v));
}

export function effectParams(piega, schiaccia) {
  const p = clamp01(piega);
  const s = clamp01(schiaccia);
  return {
    distortion: Math.min(1, p * 0.75 + s * 0.45),
    delay: p * 0.28,
    filterHz: 12000 - p * 9000 - s * 2500,
    glitchGain: s * 0.85
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test testsuperpowers/tests/audio-params.test.mjs`  
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add testsuperpowers/audio-params.js testsuperpowers/tests/audio-params.test.mjs
git commit -m "feat(vinile): mappa piega e schiaccia sui parametri audio"
```

---

### Task 3: Pagina a tutto schermo e overlay

**Files:**
- Create: `testsuperpowers/index.html`
- Create: `testsuperpowers/styles.css`

**Interfaces:**
- Consumes: niente
- Produces: DOM ids usati dopo: `#stage`, `#aiuto`, `#nota-audio`, `#errore-webgl`

- [ ] **Step 1: Write index.html**

```html
<!DOCTYPE html>
<html lang="it">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
  <title>Vinile da laboratorio</title>
  <link rel="stylesheet" href="styles.css" />
</head>
<body>
  <div id="errore-webgl" hidden>questo esperimento ha bisogno di un browser più recente</div>
  <canvas id="stage"></canvas>
  <p id="aiuto">
    <span class="aiuto-wide">muovi per piegare · tocca per schiacciare</span>
    <span class="aiuto-narrow">muovi · tocca</span>
  </p>
  <p id="nota-audio" hidden>audio non disponibile</p>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
  <script type="module" src="vinile.js"></script>
</body>
</html>
```

- [ ] **Step 2: Write styles.css**

```css
* { box-sizing: border-box; margin: 0; padding: 0; }
html, body {
  width: 100%;
  height: 100%;
  overflow: hidden;
  background: #050705;
  color: #b8ff9a;
  font-family: "Segoe UI", system-ui, sans-serif;
  touch-action: none;
  user-select: none;
}
#stage {
  display: block;
  width: 100%;
  height: 100%;
}
#aiuto, #nota-audio, #errore-webgl {
  position: fixed;
  z-index: 2;
  pointer-events: none;
  letter-spacing: 0.04em;
}
#aiuto {
  left: 1.2rem;
  bottom: 1.2rem;
  font-size: 0.85rem;
  opacity: 0.75;
}
#nota-audio {
  right: 1.2rem;
  bottom: 1.2rem;
  font-size: 0.8rem;
  opacity: 0.7;
}
#errore-webgl {
  inset: 0;
  display: grid;
  place-items: center;
  text-align: center;
  padding: 2rem;
  background: #050705;
}
#errore-webgl[hidden], #nota-audio[hidden], #aiuto[hidden] {
  display: none;
}
.aiuto-narrow { display: none; }
@media (max-width: 480px) {
  .aiuto-wide { display: none; }
  .aiuto-narrow { display: inline; }
}
```

- [ ] **Step 3: Temporary vinile.js so the page loads**

Crea `testsuperpowers/vinile.js`:

```js
console.log('vinile: scaffold');
```

Apri `testsuperpowers/index.html` nel browser. Expected: fondo quasi nero, testo d’aiuto in basso a sinistra, canvas vuoto (nero). A ~375px di larghezza il testo diventa `muovi · tocca`.

- [ ] **Step 4: Commit**

```bash
git add testsuperpowers/index.html testsuperpowers/styles.css testsuperpowers/vinile.js
git commit -m "feat(vinile): pagina a tutto schermo con testo di aiuto"
```

---

### Task 4: Disco che gira (ancora rigido)

**Files:**
- Modify: `testsuperpowers/vinile.js`
- Modify: `testsuperpowers/index.html` (già ha canvas e Three.js)

**Interfaces:**
- Consumes: `THREE` globale, `#stage`, `#errore-webgl`
- Produces: `export function getRotationY()` (radianti, per debug) e mesh disco che ruota ogni frame. Funzione `showWebglError()` se il renderer non si crea.

- [ ] **Step 1: Implementare scena Three.js**

Sostituisci `testsuperpowers/vinile.js` con:

```js
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
```

- [ ] **Step 2: Verifica visiva**

Apri la pagina (meglio da un server statico locale se `file://` blocca i moduli). Expected: disco trasparente verde/iridescente con solchi ed etichetta, che gira da solo senza interazione. Nessun tasto play.

Per simulare WebGL assente: in DevTools, prima del load, non serve se non verificabile; il `try/catch` su `WebGLRenderer` copre il caso. Non implementare fallback 2D.

- [ ] **Step 3: Commit**

```bash
git add testsuperpowers/vinile.js
git commit -m "feat(vinile): disco WebGL iridescente in rotazione continua"
```

---

### Task 5: Piegare e schiacciare

**Files:**
- Modify: `testsuperpowers/vinile.js`

**Interfaces:**
- Consumes: `pointerBendIntensity`, `vertexRigidity`, `isPointerOnDisc`, `squashAmount`, `bendDirection`, `DISC_RADIUS` da `fisica.js`
- Produces: ogni frame `piega` (0–1) e `schiaccia` (0–1) disponibili per l’audio tramite `export function getDeformState(): { piega: number, schiaccia: number }`
- Vertici: offset nel piano del disco verso il puntatore × piega × rigidità; squash scala il raggio verso il perno × rigidità. Resting positions salvate all’init. Rotazione `disc.rotation.z` resta indipendente (non azzerare).

- [ ] **Step 1: Aggiungere input e deformazione vertici**

In `vinile.js`, dopo la creazione di `geo` / `disc`:

```js
import {
  DISC_RADIUS,
  pointerBendIntensity,
  vertexRigidity,
  isPointerOnDisc,
  squashAmount,
  bendDirection
} from './fisica.js';

const rest = geo.attributes.position.array.slice();
const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
const raycaster = new THREE.Raycaster();
const ndc = new THREE.Vector2();
const hit = new THREE.Vector3();

let pointer = { x: 0, y: 0, active: false };
let tapAt = -999;

function setPointerFromEvent(ev) {
  const rect = canvas.getBoundingClientRect();
  ndc.x = ((ev.clientX - rect.left) / rect.width) * 2 - 1;
  ndc.y = -((ev.clientY - rect.top) / rect.height) * 2 + 1;
  raycaster.setFromCamera(ndc, camera);
  const ok = raycaster.ray.intersectPlane(plane, hit);
  if (!ok) {
    pointer.active = false;
    return;
  }
  pointer.x = hit.x;
  pointer.y = hit.z;
  pointer.active = true;
}

canvas.addEventListener('pointermove', (ev) => {
  setPointerFromEvent(ev);
});
canvas.addEventListener('pointerdown', (ev) => {
  setPointerFromEvent(ev);
  const dist = Math.hypot(pointer.x, pointer.y);
  if (pointer.active && isPointerOnDisc(dist)) tapAt = performance.now() / 1000;
});
canvas.addEventListener('pointerleave', () => {
  pointer.active = false;
});

let piega = 0;
let schiaccia = 0;

export function getDeformState() {
  return { piega, schiaccia };
}

function applyDeform(now) {
  const dist = Math.hypot(pointer.x, pointer.y);
  piega = pointer.active ? pointerBendIntensity(dist) : 0;
  schiaccia = squashAmount(now - tapAt);
  const dir = bendDirection(pointer.x, pointer.y);
  const pos = geo.attributes.position;
  const arr = pos.array;
  const BEND_MAX = 0.28;
  const SQUASH_MAX = 0.38;
  for (let i = 0; i < arr.length; i += 3) {
    const rx = rest[i];
    const ry = rest[i + 1];
    const rz = rest[i + 2];
    const vr = Math.hypot(rx, ry);
    const rigid = vertexRigidity(vr);
    const pull = piega * rigid * BEND_MAX;
    let x = rx + dir.x * pull;
    let y = ry + dir.y * pull;
    const scale = 1 - schiaccia * rigid * SQUASH_MAX;
    x *= scale;
    y *= scale;
    arr[i] = x;
    arr[i + 1] = y;
    arr[i + 2] = rz;
  }
  pos.needsUpdate = true;
}
```

Nel `tick`, prima di `renderer.render`:

```js
  const now = clock.elapsedTime;
  applyDeform(now);
```

Usa lo stesso `clock` (non mescolare `performance.now` e `clock` per lo squash): imposta `tapAt` in secondi di `clock.elapsedTime`.

Correggi il pointerdown:

```js
canvas.addEventListener('pointerdown', (ev) => {
  setPointerFromEvent(ev);
  const dist = Math.hypot(pointer.x, pointer.y);
  if (pointer.active && isPointerOnDisc(dist)) tapAt = clock.elapsedTime;
});
```

e `applyDeform(clock.elapsedTime)` con `squashAmount(now - tapAt)`.

Nota: `CircleGeometry` è nel piano XY; il mesh è ruotato su X. Il raycast sul piano XZ (`y=0`) deve coincidere con il piano del disco dopo la rotazione. Se il disco è ruotato su X, il piano del mesh non è `y=0` orizzontale puro.

Usa un piano allineato al disco:

```js
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
```

Deforma in spazio locale (`rest` è locale). `bendDirection(pointer.x, pointer.y)` resta in locale.

- [ ] **Step 2: Verifica nel browser**

- Muovi il puntatore vicino al bordo: il disco si stira verso di te; etichetta quasi ferma.
- Allontana oltre ~1,2 raggi: torna tondo.
- Clic sul disco: si comprime verso il centro e rimbalza in ~2 s.
- Clic fuori: nessuno schiacciamento.
- Durante piega + clic: i due effetti insieme; la rotazione non si ferma.

- [ ] **Step 3: Commit**

```bash
git add testsuperpowers/vinile.js
git commit -m "feat(vinile): piega verso il puntatore e squash al tap"
```

---

### Task 6: Nascondere l’aiuto al primo gesto

**Files:**
- Modify: `testsuperpowers/vinile.js`

**Interfaces:**
- Consumes: `#aiuto`
- Produces: `export function notifyFirstGesture()` — nasconde `#aiuto` una volta; chiamata da `pointermove` (se il puntatore si è mosso) e `pointerdown`

- [ ] **Step 1: Implementare**

```js
const aiuto = document.getElementById('aiuto');
let firstGesture = false;

export function notifyFirstGesture() {
  if (firstGesture) return;
  firstGesture = true;
  aiuto.hidden = true;
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
```

Un `pointermove` minimo (jitter) nasconde l’aiuto: accettabile. Non nascondere all’avvio senza eventi.

- [ ] **Step 2: Verifica**

Ricarica: l’aiuto c’è. Primo movimento o tap: sparisce e non torna. La rotazione c’è già prima del gesto.

- [ ] **Step 3: Commit**

```bash
git add testsuperpowers/vinile.js
git commit -m "feat(vinile): nasconde l’aiuto dopo il primo gesto"
```

---

### Task 7: Loop audio nel repo e motore Web Audio

**Files:**
- Create: `testsuperpowers/scripts/make-loop.mjs`
- Create: `testsuperpowers/audio/laboratorio.wav` (generato)
- Create: `testsuperpowers/audio.js`
- Modify: `testsuperpowers/vinile.js` (chiamare unlock al primo gesto)

**Interfaces:**
- Consumes: `effectParams` da `audio-params.js`; file `audio/laboratorio.wav`
- Produces:
  - `export async function unlockAudio(): Promise<boolean>` — `true` se il loop gira, `false` se load/resume fallisce (mostra `#nota-audio`)
  - `export function setAudioDeform(piega: number, schiaccia: number): void` — no-op se non sbloccato
  - `export function isAudioRunning(): boolean`

- [ ] **Step 1: Script del loop (senza npm)**

Crea `testsuperpowers/scripts/make-loop.mjs`:

```js
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const dir = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'audio');
fs.mkdirSync(dir, { recursive: true });

const sampleRate = 44100;
const seconds = 8;
const n = sampleRate * seconds;
const data = new Int16Array(n);

for (let i = 0; i < n; i++) {
  const t = i / sampleRate;
  const a = Math.sin(2 * Math.PI * 55 * t) * 0.18;
  const b = Math.sin(2 * Math.PI * 82.4 * t + Math.sin(t * 0.7)) * 0.12;
  const c = Math.sin(2 * Math.PI * 220 * t) * 0.04 * (Math.sin(t * 1.3) * 0.5 + 0.5);
  const noise = ((i * 1103515245 + 12345) & 0x7fff) / 0x7fff - 0.5;
  const hiss = noise * 0.03;
  const env = 0.85 + 0.15 * Math.sin(2 * Math.PI * t / seconds);
  const s = Math.max(-1, Math.min(1, (a + b + c + hiss) * env));
  data[i] = (s * 32767) | 0;
}

const bytes = data.byteLength;
const buf = Buffer.alloc(44 + bytes);
buf.write('RIFF', 0);
buf.writeUInt32LE(36 + bytes, 4);
buf.write('WAVE', 8);
buf.write('fmt ', 12);
buf.writeUInt32LE(16, 16);
buf.writeUInt16LE(1, 20);
buf.writeUInt16LE(1, 22);
buf.writeUInt32LE(sampleRate, 24);
buf.writeUInt32LE(sampleRate * 2, 28);
buf.writeUInt16LE(2, 32);
buf.writeUInt16LE(16, 34);
buf.write('data', 36);
buf.writeUInt32LE(bytes, 40);
Buffer.from(data.buffer).copy(buf, 44);
fs.writeFileSync(path.join(dir, 'laboratorio.wav'), buf);
```

Run: `node testsuperpowers/scripts/make-loop.mjs`  
Expected: crea `testsuperpowers/audio/laboratorio.wav`.

- [ ] **Step 2: audio.js**

```js
import { effectParams } from './audio-params.js';

const nota = document.getElementById('nota-audio');

let ctx;
let running = false;
let distNode;
let filter;
let delay;
let delayGain;
let glitchGain;
let dry;

export function isAudioRunning() {
  return running;
}

export async function unlockAudio() {
  if (running) return true;
  try {
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    const res = await fetch('audio/laboratorio.wav');
    if (!res.ok) throw new Error('missing');
    const buf = await ctx.decodeAudioData(await res.arrayBuffer());
    const src = ctx.createBufferSource();
    src.buffer = buf;
    src.loop = true;

    dry = ctx.createGain();
    dry.gain.value = 0.7;
    distNode = ctx.createWaveShaper();
    distNode.curve = makeCurve(0);
    filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 12000;
    delay = ctx.createDelay(1.0);
    delay.delayTime.value = 0.05;
    delayGain = ctx.createGain();
    delayGain.gain.value = 0;
    glitchGain = ctx.createGain();
    glitchGain.gain.value = 0;

    const glitchFilter = ctx.createBiquadFilter();
    glitchFilter.type = 'highpass';
    glitchFilter.frequency.value = 1800;

    src.connect(dry);
    dry.connect(distNode);
    distNode.connect(filter);
    filter.connect(ctx.destination);
    filter.connect(delay);
    delay.connect(delayGain);
    delayGain.connect(ctx.destination);
    filter.connect(glitchFilter);
    glitchFilter.connect(glitchGain);
    glitchGain.connect(ctx.destination);

    await ctx.resume();
    src.start(0);
    running = true;
    nota.hidden = true;
    return true;
  } catch (e) {
    running = false;
    nota.hidden = false;
    return false;
  }
}

export function setAudioDeform(piega, schiaccia) {
  if (!running) return;
  const p = effectParams(piega, schiaccia);
  distNode.curve = makeCurve(p.distortion);
  filter.frequency.setTargetAtTime(Math.max(400, p.filterHz), ctx.currentTime, 0.05);
  delayGain.gain.setTargetAtTime(p.delay, ctx.currentTime, 0.05);
  glitchGain.gain.setTargetAtTime(p.glitchGain, ctx.currentTime, 0.02);
}

function makeCurve(amount) {
  const n = 256;
  const curve = new Float32Array(n);
  const k = amount * 40;
  for (let i = 0; i < n; i++) {
    const x = (i * 2) / n - 1;
    curve[i] = k === 0 ? x : ((1 + k) * x) / (1 + k * Math.abs(x));
  }
  return curve;
}
```

- [ ] **Step 3: Collegare unlock in vinile.js**

```js
import { unlockAudio, setAudioDeform } from './audio.js';

function onFirstGesture() {
  notifyFirstGesture();
  unlockAudio();
}
```

Usa `onFirstGesture` al posto di `notifyFirstGesture` nei listener. In `tick`, dopo `applyDeform`:

```js
  const st = getDeformState();
  setAudioDeform(st.piega, st.schiaccia);
```

- [ ] **Step 4: Verifica**

Senza gesto: silenzio. Primo gesto: parte il loop. Piegando, il suono si sporca; al tap, impulso/glitch. Rinomina temporaneamente il wav: deve comparire `audio non disponibile` e il disco continua a funzionare. Ripristina il file.

- [ ] **Step 5: Commit**

```bash
git add testsuperpowers/scripts/make-loop.mjs testsuperpowers/audio/laboratorio.wav testsuperpowers/audio.js testsuperpowers/vinile.js
git commit -m "feat(vinile): loop elettronico reattivo a piega e squash"
```

---

### Task 8: Accettazione browser (desktop + stretto)

**Files:**
- Nessun file nuovo salvo fix se qualcosa fallisce

**Interfaces:**
- Consumes: pagina completa
- Produces: comportamento allineato ai 8 criteri della spec

- [ ] **Step 1: Checklist visiva e sonora**

Apri `testsuperpowers/index.html` (server statico se i moduli ESM lo richiedono).

1. All’apertura: vinile laboratorio che gira, aiuto visibile, no musica.
2. Puntatore vicino: piega verso il gesto; lontano: torna tondo; etichetta più rigida.
3. Tap sul disco: squash + rimbalzo ~2s; tap fuori: no squash.
4. Rotazione continua durante piega e squash.
5. Primo gesto: aiuto sparisce, loop parte; piega sporca; tap glitcha.
6. Viewport ~375px: disco intero, centrato, testo `muovi · tocca`, niente scroll.
7. File audio assente: nota piccola, gioco visivo ok.
8. Ricarica: stato fresco (aiuto di nuovo, audio di nuovo da sbloccare).

- [ ] **Step 2: Ri-eseguire i test unitari**

Run: `node --test testsuperpowers/tests/fisica.test.mjs testsuperpowers/tests/audio-params.test.mjs`  
Expected: PASS

- [ ] **Step 3: Commit solo se hai corretto bug**

```bash
git add -u testsuperpowers
git commit -m "fix(vinile): ritocchi da verifica di accettazione"
```

Se non ci sono cambi, non creare un commit vuoto.

---

## Self-review vs spec

| Requisito spec | Task |
| --- | --- |
| Pagina a sé, no negozio/festival | 3 (file solo in testsuperpowers) |
| Look trasparente / verde acido / iridescente / solchi / etichetta | 4 |
| Gira già all’apertura | 4 |
| Testo aiuto esatto + versione corta + sparisce al gesto | 3, 6 |
| Audio non autoplay | 7 |
| Piegare verso puntatore, corona 1.2, etichetta rigida | 1, 5 |
| Squash tap 1.5–2.5s, somma con piega, no tap fuori | 1, 5 |
| Rotazione mai ferma | 4, 5 |
| Loop elettronico, piega sporca, tap glitch | 2, 7 |
| `audio non disponibile` senza rompere il visivo | 7, 8 |
| WebGL fail: messaggio, no fallback 2D | 4 |
| Mobile, no zoom, no scroll | 3, 8 |
| File `index.html`, `styles.css`, `vinile.js`, `audio.js`, wav nel repo | 3, 4, 7 |
