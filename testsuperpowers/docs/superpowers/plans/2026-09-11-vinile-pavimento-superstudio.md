# Vinile pavimento Superstudio Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task (utente: pezzi piccoli **in questa chat**, niente SDD/subagent unico). Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Mettere sotto il disco un pavimento nero a righine bianche sottili in prospettiva, fermo mentre il vinile si piega.

**Architecture:** Funzioni pure per maglia e dissolvenza in `pavimento.js`; `creaPavimento(THREE)` costruisce un piano orizzontale con lo stesso disegno. `vinile.js` lo aggiunge alla scena una volta, sotto il disco. Il suolo non legge il colore stanza.

**Tech Stack:** Vanilla HTML/CSS/JS ESM, Three.js già in pagina, `node --test`, preview `http://127.0.0.1:8770/index.html`.

## Global Constraints

- Nessun npm/backend; solo file sotto `testsuperpowers/`.
- Quadretti solo sotto il disco, non su MPC/testi/pallini.
- Pavimento bianco su nero, non tinto dalle stanze.
- Piegare/schiacciare non deforma il suolo.
- Suono, nastro, rack, testi d’aiuto, due ottave, 120 BPM: invariati.
- Niente scritta Superstudio, niente nuovo bottone.
- Non `git add -A`. Non cancellare `audio/laboratorio.wav`.
- Anteprima: porta **8770**. Non committare se l’utente non lo chiede.

---

## File map

| File | Responsabilità |
| --- | --- |
| `testsuperpowers/pavimento.js` | Costanti, `gridLine`, `gridFade`, `creaPavimento(THREE)` |
| `testsuperpowers/tests/pavimento.test.mjs` | Assert maglia, fade, quota sotto il disco |
| `testsuperpowers/vinile.js` | `scene.add(creaPavimento(THREE))` sotto il disco |

---

### Task 1: Maglia Superstudio (puro + mesh)

**Files:**
- Create: `testsuperpowers/tests/pavimento.test.mjs`
- Create: `testsuperpowers/pavimento.js`

**Interfaces:**
- Consumes: oggetto `THREE` globale (solo in `creaPavimento`)
- Produces: `FLOOR_Y` (numero `< -0.24`, sotto il bordo basso del disco inclinato); `GRID_STEP`; `LINE_HALF`; `FADE_START`; `FADE_END`; `gridLine(x,z) → 0..1`; `gridFade(x,z) → 0..1`; `creaPavimento(THREE) → Mesh` orizzontale a `y = FLOOR_Y`

- [ ] **Step 1: Write the failing test**

```javascript
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  FLOOR_Y,
  GRID_STEP,
  LINE_HALF,
  gridLine,
  gridFade,
  creaPavimento
} from '../pavimento.js';

describe('pavimento Superstudio', () => {
  it('sta sotto il bordo basso del disco inclinato', () => {
    assert.ok(FLOOR_Y < -0.24);
  });

  it('linea bianca sugli assi della maglia, cella nera in mezzo', () => {
    assert.ok(gridLine(0, 0) > 0.8);
    assert.ok(gridLine(GRID_STEP, 0) > 0.8);
    assert.ok(gridLine(GRID_STEP / 2, GRID_STEP / 2) < 0.05);
  });

  it('si perde in lontananza e resta piena vicino al disco', () => {
    assert.equal(gridFade(0, 0), 1);
    assert.equal(gridFade(0, 20), 0);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/pavimento.test.mjs`  
Cwd: `testsuperpowers`  
Expected: FAIL (modulo assente)

- [ ] **Step 3: Minimal implementation**

`pavimento.js`:

```javascript
export const FLOOR_Y = -0.32;
export const GRID_STEP = 0.28;
export const LINE_HALF = 0.006;
export const FADE_START = 5.5;
export const FADE_END = 13;

export function gridLine(x, z) {
  const dx = Math.abs(x - Math.round(x / GRID_STEP) * GRID_STEP);
  const dz = Math.abs(z - Math.round(z / GRID_STEP) * GRID_STEP);
  const d = Math.min(dx, dz);
  if (d > LINE_HALF) return 0;
  return 1 - d / LINE_HALF;
}

export function gridFade(x, z) {
  const r = Math.hypot(x, z);
  if (r <= FADE_START) return 1;
  if (r >= FADE_END) return 0;
  return 1 - (r - FADE_START) / (FADE_END - FADE_START);
}

export function creaPavimento(THREE) {
  const geo = new THREE.PlaneGeometry(28, 28);
  const mat = new THREE.ShaderMaterial({
    depthWrite: true,
    vertexShader: `
      varying vec3 vWorld;
      void main() {
        vec4 w = modelMatrix * vec4(position, 1.0);
        vWorld = w.xyz;
        gl_Position = projectionMatrix * viewMatrix * w;
      }
    `,
    fragmentShader: `
      varying vec3 vWorld;
      const float STEP = ${GRID_STEP.toFixed(4)};
      const float HALF = ${LINE_HALF.toFixed(4)};
      const float FADE0 = ${FADE_START.toFixed(4)};
      const float FADE1 = ${FADE_END.toFixed(4)};
      void main() {
        float dx = abs(vWorld.x - floor(vWorld.x / STEP + 0.5) * STEP);
        float dz = abs(vWorld.z - floor(vWorld.z / STEP + 0.5) * STEP);
        float d = min(dx, dz);
        float line = d > HALF ? 0.0 : 1.0 - d / HALF;
        float r = length(vWorld.xz);
        float fade = r <= FADE0 ? 1.0 : (r >= FADE1 ? 0.0 : 1.0 - (r - FADE0) / (FADE1 - FADE0));
        vec3 col = mix(vec3(0.0), vec3(0.88), line);
        float a = mix(1.0, 0.0, 1.0 - fade);
        gl_FragColor = vec4(col, 1.0);
        gl_FragColor.rgb = mix(vec3(0.02, 0.02, 0.025), gl_FragColor.rgb, fade);
      }
    `
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.y = FLOOR_Y;
  mesh.frustumCulled = false;
  return mesh;
}
```

Non esportare `creaPavimento` nel test del task 1 se non serve: il test sopra non la chiama. Va bene.

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test tests/pavimento.test.mjs`  
Expected: PASS

- [ ] **Step 5: Commit**

Saltare: l’utente non ha chiesto commit.

---

### Task 2: Aggiungere il suolo alla scena

**Files:**
- Modify: `testsuperpowers/vinile.js`

**Interfaces:**
- Consumes: `creaPavimento` da `./pavimento.js`; `THREE` globale
- Produces: mesh suolo in scena, aggiunta **prima** del disco

- [ ] **Step 1: Write the failing test**

Niente test Node extra (dipende da Three.js in pagina). Verifica visiva nel task 3.

- [ ] **Step 2: Implement**

In `vinile.js` importa `creaPavimento`. Subito dopo `scene.add(disc)`:

```javascript
scene.add(creaPavimento(THREE));
```

Meglio aggiungere il suolo **prima** del disco:

```javascript
scene.add(creaPavimento(THREE));
scene.add(disc);
```

Non toccare `applyTheme`: `setClearColor` resta il colore stanza (cielo/vuoto intorno al suolo). Il shader del pavimento non usa `--tema-rgb`.

- [ ] **Step 3: Run unit tests**

Run: `node --test tests/pavimento.test.mjs tests/pannello.test.mjs tests/fisica.test.mjs`  
Expected: PASS

- [ ] **Step 4: Commit**

Saltare.

---

### Task 3: Verifica in pagina

**Files:** nessuno, solo preview.

- [ ] **Step 1: Server 8770**

Se non è già su: `npx --yes serve -l 8770` in `testsuperpowers`. Non avviare un secondo server sulla stessa porta.

- [ ] **Step 2: Checklist** su `http://127.0.0.1:8770/index.html`

1. Sotto il disco: pavimento nero, righine bianche sottili in prospettiva.
2. MPC / testi / pallini: niente quadretti.
3. Piegare e schiacciare: suolo fermo.
4. Cambio stanza: suolo sempre bianco su nero.
5. Nessun nuovo bottone né scritta Superstudio.

---
