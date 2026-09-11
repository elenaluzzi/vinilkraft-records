# Vinile rack plugin Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Quattro tasti `REV` `ECO` `EQ` `CMP` aprono sotto la tastiera un cassetto-plugin (manopole, fader, grafico tinto dalla stanza) che non cambia il suono.

**Architecture:** Stato puro in `rack.js` (selezione esclusiva, params 0–1, `vinile_rack`). DOM del cassetto in `rack-ui.js`. Disegno grafico in `rack-draw.js`. Prelievo analizzatore in `audio.js` senza inserire effetti. `pannello-ui.js` etichetta i tasti e chiama `onPluginToggle` solo se la larghezza è ≥ 700 px.

**Tech Stack:** HTML/CSS/JS ESM, `node --test`, preview `http://127.0.0.1:8770/index.html`.

## Global Constraints

- Nessun npm/backend; solo file sotto `testsuperpowers/`.
- Testi d’aiuto invariati.
- Manopole/fader non alterano il mix né il nastro.
- Sigle visibili `REV` `ECO` `EQ` `CMP`; aria `riverbero` `eco` `equalizzatore` `compressore`.
- Cassetto chiuso all’avvio; sotto 700 px non si apre; resize sotto 700 chiude.
- Chiave `vinile_rack`; plugin aperto non persistito; default controlli 0,5.
- Niente logo di marca. Disco, pallini, nastro, otto pad, due ottave, 120 BPM, stanze: invariati.
- Non `git add -A`. Non cancellare `audio/laboratorio.wav`.
- Anteprima: porta **8770** (non 8765).
- Repo git: cartella padre `test`; stage solo i file elencati nel task.

---

## File map

| File | Responsabilità |
| --- | --- |
| `testsuperpowers/rack.js` | Id plugin, controlli, toggle, clamp, load/save |
| `testsuperpowers/tests/rack.test.mjs` | Toggle, persistenza, clamp, viewport |
| `testsuperpowers/pannello-ui.js` | Sigle, latch, `onPluginToggle` |
| `testsuperpowers/tests/run-pannello.html` | DOM sigle e toggle |
| `testsuperpowers/rack-draw.js` | Disegno grafico da campioni |
| `testsuperpowers/tests/rack-draw.test.mjs` | Stile per plugin + silenzio |
| `testsuperpowers/rack-ui.js` | Cassetto, manopole, fader, canvas |
| `testsuperpowers/styles.css` | Look rack e `#pannello.rack-aperto` |
| `testsuperpowers/audio.js` | `getMeterFrame()` prelievo |
| `testsuperpowers/vinile.js` | Collegamento toggle, resize, tick grafico |

---

### Task 1: Stato rack (puro)

**Files:**
- Create: `testsuperpowers/rack.js`
- Create: `testsuperpowers/tests/rack.test.mjs`

**Interfaces:**
- Consumes: nessuno
- Produces: `NARROW_PX = 700`, `STORAGE_KEY = 'vinile_rack'`, `PLUGIN_IDS`, `PLUGIN_LABELS`, `PLUGIN_TITLES`, `PLUGIN_ARIA`, `CONTROLS`, `isNarrowViewport(widthPx)`, `clamp01`, `defaultParams`, `parseParams`, `loadParams(storage)`, `saveParams(storage, params)`, `createRackState(storage)` → `{ open, params, storage }`, `togglePlugin(state, id)`, `closePlugin(state)`, `setParam(state, pluginId, controlId, value)`

- [ ] **Step 1: Write the failing test**

Crea `testsuperpowers/tests/rack.test.mjs`:

```javascript
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  NARROW_PX,
  STORAGE_KEY,
  PLUGIN_IDS,
  PLUGIN_LABELS,
  PLUGIN_TITLES,
  PLUGIN_ARIA,
  CONTROLS,
  isNarrowViewport,
  clamp01,
  defaultParams,
  parseParams,
  loadParams,
  createRackState,
  togglePlugin,
  closePlugin,
  setParam
} from '../rack.js';

function mem(initial) {
  const m = new Map(initial ? Object.entries(initial) : []);
  return {
    getItem(k) { return m.has(k) ? m.get(k) : null; },
    setItem(k, v) { m.set(k, String(v)); }
  };
}

describe('costanti plugin', () => {
  it('quattro id, sigle e titoli', () => {
    assert.deepEqual(PLUGIN_IDS, ['rev', 'eco', 'eq', 'cmp']);
    assert.equal(PLUGIN_LABELS.rev, 'REV');
    assert.equal(PLUGIN_LABELS.eco, 'ECO');
    assert.equal(PLUGIN_LABELS.eq, 'EQ');
    assert.equal(PLUGIN_LABELS.cmp, 'CMP');
    assert.equal(PLUGIN_TITLES.rev, 'RIVERBERO');
    assert.equal(PLUGIN_TITLES.eco, 'ECO');
    assert.equal(PLUGIN_TITLES.eq, 'EQUALIZZATORE');
    assert.equal(PLUGIN_TITLES.cmp, 'COMPRESSORE');
    assert.equal(PLUGIN_ARIA.rev, 'riverbero');
    assert.equal(PLUGIN_ARIA.eco, 'eco');
    assert.equal(PLUGIN_ARIA.eq, 'equalizzatore');
    assert.equal(PLUGIN_ARIA.cmp, 'compressore');
    assert.equal(NARROW_PX, 700);
    assert.equal(STORAGE_KEY, 'vinile_rack');
    assert.deepEqual(CONTROLS.rev.map((c) => c.id), ['livello', 'coda', 'stanza', 'mix']);
    assert.deepEqual(CONTROLS.eco.map((c) => c.id), ['tempo', 'ripetizioni', 'mix']);
    assert.deepEqual(CONTROLS.eq.map((c) => c.id), ['gravi', 'medi', 'acuti', 'presenza', 'brillantezza']);
    assert.deepEqual(CONTROLS.cmp.map((c) => c.id), ['soglia', 'rapporto', 'attacco', 'mix']);
  });
});

describe('viewport', () => {
  it('stretto sotto 700', () => {
    assert.equal(isNarrowViewport(699), true);
    assert.equal(isNarrowViewport(700), false);
    assert.equal(isNarrowViewport(1280), false);
  });
});

describe('toggle', () => {
  it('apre, sostituisce, chiude, ignora id falso', () => {
    const s = createRackState(mem());
    assert.equal(s.open, null);
    assert.equal(togglePlugin(s, 'rev'), 'rev');
    assert.equal(togglePlugin(s, 'eq'), 'eq');
    assert.equal(s.open, 'eq');
    assert.equal(togglePlugin(s, 'eq'), null);
    assert.equal(togglePlugin(s, 'nope'), null);
    closePlugin(s);
    togglePlugin(s, 'cmp');
    closePlugin(s);
    assert.equal(s.open, null);
  });
});

describe('params', () => {
  it('default 0.5, clamp, persistenza, JSON rotto', () => {
    assert.equal(clamp01(-1), 0);
    assert.equal(clamp01(2), 1);
    assert.equal(clamp01('x'), 0.5);
    const d = defaultParams();
    assert.equal(d.rev.coda, 0.5);
    assert.equal(d.eq.gravi, 0.5);
    const broken = parseParams('{');
    assert.equal(broken.cmp.mix, 0.5);
    const st = mem();
    const s = createRackState(st);
    assert.equal(setParam(s, 'rev', 'coda', 0.8), 0.8);
    assert.equal(s.params.rev.coda, 0.8);
    const s2 = createRackState(st);
    assert.equal(s2.params.rev.coda, 0.8);
    assert.equal(s2.open, null);
    assert.equal(setParam(s, 'rev', 'ghost', 1), 0.5);
    const empty = loadParams(null);
    assert.equal(empty.eco.tempo, 0.5);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/rack.test.mjs`  
Cwd: `testsuperpowers`  
Expected: FAIL (modulo `rack.js` assente)

- [ ] **Step 3: Minimal implementation**

Crea `testsuperpowers/rack.js` con esattamente:

```javascript
export const NARROW_PX = 700;
export const STORAGE_KEY = 'vinile_rack';
export const PLUGIN_IDS = ['rev', 'eco', 'eq', 'cmp'];

export const PLUGIN_LABELS = {
  rev: 'REV',
  eco: 'ECO',
  eq: 'EQ',
  cmp: 'CMP'
};

export const PLUGIN_TITLES = {
  rev: 'RIVERBERO',
  eco: 'ECO',
  eq: 'EQUALIZZATORE',
  cmp: 'COMPRESSORE'
};

export const PLUGIN_ARIA = {
  rev: 'riverbero',
  eco: 'eco',
  eq: 'equalizzatore',
  cmp: 'compressore'
};

export const CONTROLS = {
  rev: [
    { id: 'livello', group: 'Ingresso', kind: 'fader' },
    { id: 'coda', group: 'Riverbero', kind: 'knob' },
    { id: 'stanza', group: 'Riverbero', kind: 'knob' },
    { id: 'mix', group: 'Mix', kind: 'fader' }
  ],
  eco: [
    { id: 'tempo', group: 'Tempo', kind: 'knob' },
    { id: 'ripetizioni', group: 'Ripetizioni', kind: 'knob' },
    { id: 'mix', group: 'Mix', kind: 'fader' }
  ],
  eq: [
    { id: 'gravi', group: 'Bande', kind: 'fader' },
    { id: 'medi', group: 'Bande', kind: 'fader' },
    { id: 'acuti', group: 'Bande', kind: 'fader' },
    { id: 'presenza', group: 'Timbro', kind: 'knob' },
    { id: 'brillantezza', group: 'Timbro', kind: 'knob' }
  ],
  cmp: [
    { id: 'soglia', group: 'Dinamica', kind: 'knob' },
    { id: 'rapporto', group: 'Dinamica', kind: 'knob' },
    { id: 'attacco', group: 'Dinamica', kind: 'knob' },
    { id: 'mix', group: 'Mix', kind: 'fader' }
  ]
};

export function isNarrowViewport(widthPx) {
  return Number(widthPx) < NARROW_PX;
}

export function clamp01(n) {
  const x = Number(n);
  if (!Number.isFinite(x)) return 0.5;
  if (x < 0) return 0;
  if (x > 1) return 1;
  return x;
}

export function defaultParams() {
  const o = {};
  PLUGIN_IDS.forEach((id) => {
    o[id] = {};
    CONTROLS[id].forEach((c) => {
      o[id][c.id] = 0.5;
    });
  });
  return o;
}

export function parseParams(raw) {
  const base = defaultParams();
  if (raw == null || raw === '') return base;
  let data;
  try {
    data = typeof raw === 'string' ? JSON.parse(raw) : raw;
  } catch (e) {
    return base;
  }
  if (!data || typeof data !== 'object') return base;
  PLUGIN_IDS.forEach((id) => {
    const src = data[id];
    if (!src || typeof src !== 'object') return;
    CONTROLS[id].forEach((c) => {
      if (src[c.id] != null) base[id][c.id] = clamp01(src[c.id]);
    });
  });
  return base;
}

export function loadParams(storage) {
  try {
    const raw = storage && storage.getItem ? storage.getItem(STORAGE_KEY) : null;
    return parseParams(raw);
  } catch (e) {
    return defaultParams();
  }
}

export function saveParams(storage, params) {
  if (!storage || typeof storage.setItem !== 'function') return;
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(params));
  } catch (e) {}
}

export function createRackState(storage) {
  return { open: null, params: loadParams(storage), storage: storage || null };
}

export function togglePlugin(state, id) {
  if (PLUGIN_IDS.indexOf(id) === -1) return state.open;
  state.open = state.open === id ? null : id;
  return state.open;
}

export function closePlugin(state) {
  state.open = null;
  return state.open;
}

export function setParam(state, pluginId, controlId, value) {
  if (!state.params[pluginId] || !Object.prototype.hasOwnProperty.call(state.params[pluginId], controlId)) {
    return 0.5;
  }
  const v = clamp01(value);
  state.params[pluginId][controlId] = v;
  saveParams(state.storage, state.params);
  return v;
}
```

- [ ] **Step 4: Run tests**

Run: `node --test tests/rack.test.mjs`  
Cwd: `testsuperpowers`  
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add testsuperpowers/rack.js testsuperpowers/tests/rack.test.mjs
git commit -m "feat(vinile): stato rack plugin e persistenza manopole"
```

---

### Task 2: Tasti REV ECO EQ CMP

**Files:**
- Modify: `testsuperpowers/pannello-ui.js`
- Modify: `testsuperpowers/tests/run-pannello.html`
- Non toccare: `testsuperpowers/tests/pannello.test.mjs`

**Interfaces:**
- Consumes: `PLUGIN_IDS`, `PLUGIN_LABELS`, `PLUGIN_ARIA`, `isNarrowViewport` da `rack.js`; `handlers.onPluginToggle(id)`; `handlers.viewportWidth()` opzionale
- Produces: quattro `.filtro` con `data-plugin`, testo sigla, `aria-label` italiano; `setPluginOpen(id|null)` sul valore di ritorno di `mountPannello`; sotto soglia: solo `onGesture`

- [ ] **Step 1: Write the failing DOM test**

In `tests/run-pannello.html`, sostituisci il test `'quattro tasti filtro nel DOM'` e aggiungi:

```javascript
          ['quattro tasti filtro nel DOM', () => {
            const root = document.createElement('div');
            root.id = 'pannello';
            root.innerHTML = '<div id="pad-row"></div><div id="tastiera"></div>';
            mountPannello(root, {
              onGesture: () => {},
              onNoteOn: () => {},
              onNoteOff: () => {},
              onPadsChange: () => {},
              onTapeAction: () => {}
            });
            const btns = root.querySelectorAll('.filtro');
            assert(btns.length === 4);
            assert(btns[0].textContent === 'REV');
            assert(btns[1].textContent === 'ECO');
            assert(btns[2].textContent === 'EQ');
            assert(btns[3].textContent === 'CMP');
            assert(btns[0].getAttribute('aria-label') === 'riverbero');
            assert(btns[1].getAttribute('aria-label') === 'eco');
            assert(btns[2].getAttribute('aria-label') === 'equalizzatore');
            assert(btns[3].getAttribute('aria-label') === 'compressore');
            assert(btns[0].dataset.plugin === 'rev');
          }],
          ['toggle plugin su computer, silenzio sotto 700', () => {
            const root = document.createElement('div');
            root.id = 'pannello';
            root.innerHTML = '<div id="pad-row"></div><div id="tastiera"></div>';
            const seen = [];
            const mounted = mountPannello(root, {
              onGesture: () => {},
              onNoteOn: () => { seen.push('note'); },
              onNoteOff: () => {},
              onPadsChange: () => { seen.push('pads'); },
              onTapeAction: () => { seen.push('tape'); },
              onPluginToggle: (id) => { seen.push(id); },
              viewportWidth: () => 1280
            });
            const rev = root.querySelector('[data-plugin="rev"]');
            rev.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
            assert(seen.indexOf('rev') !== -1);
            assert(seen.indexOf('note') === -1);
            assert(seen.indexOf('pads') === -1);
            assert(seen.indexOf('tape') === -1);
            mounted.setPluginOpen('rev');
            assert(rev.classList.contains('acceso'));
            const root2 = document.createElement('div');
            root2.innerHTML = '<div id="pad-row"></div><div id="tastiera"></div>';
            const seen2 = [];
            mountPannello(root2, {
              onGesture: () => {},
              onNoteOn: () => {},
              onNoteOff: () => {},
              onPadsChange: () => {},
              onTapeAction: () => {},
              onPluginToggle: (id) => { seen2.push(id); },
              viewportWidth: () => 699
            });
            root2.querySelector('[data-plugin="eq"]').dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
            assert(seen2.length === 0);
          }]
```

- [ ] **Step 2: Run node suite (pannello resta verde)**

Run: `node --test tests/pannello.test.mjs tests/rack.test.mjs`  
Cwd: `testsuperpowers`  
Expected: PASS (i nuovi assert DOM vivono in `run-pannello.html`)

- [ ] **Step 3: Implementation**

In `pannello-ui.js` importa da `./rack.js`:

```javascript
import {
  PLUGIN_IDS,
  PLUGIN_LABELS,
  PLUGIN_ARIA,
  isNarrowViewport
} from './rack.js';
```

Sostituisci il ciclo filtri con:

```javascript
  const filtri = document.createElement('div');
  filtri.id = 'filtri';
  const filtroEls = [];
  for (let i = 0; i < FILTER_COUNT; i++) {
    const id = PLUGIN_IDS[i];
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'filtro';
    b.dataset.plugin = id;
    b.textContent = PLUGIN_LABELS[id];
    b.setAttribute('aria-label', PLUGIN_ARIA[id]);
    b.addEventListener('pointerdown', (ev) => {
      ev.preventDefault();
      handlers.onGesture();
      const w = handlers.viewportWidth
        ? handlers.viewportWidth()
        : (typeof window !== 'undefined' ? window.innerWidth : 1280);
      if (isNarrowViewport(w)) return;
      if (handlers.onPluginToggle) handlers.onPluginToggle(id);
    });
    filtri.appendChild(b);
    filtroEls.push(b);
  }
  padRow.appendChild(filtri);
```

Nel `return` di `mountPannello` aggiungi:

```javascript
  function setPluginOpen(id) {
    filtroEls.forEach((el) => {
      el.classList.toggle('acceso', el.dataset.plugin === id);
    });
  }

  return { state, tape, syncLights, setPluginOpen };
```

- [ ] **Step 4: CSS minimo sigle**

In `styles.css` dopo `.filtro:active` aggiungi:

```css
.filtro {
  font-size: 0.52rem;
  letter-spacing: 0.06em;
  color: rgba(196, 194, 188, 0.55);
  font-family: "Segoe UI", system-ui, sans-serif;
}
.filtro.acceso {
  border-color: rgba(var(--tema-rgb), 0.55);
  background: linear-gradient(180deg, rgba(var(--tema-rgb), 0.28), #232628);
  box-shadow: inset 0 0 10px rgba(var(--tema-rgb), 0.22);
  color: rgba(255, 255, 255, 0.92);
}
```

Se `.filtro {` esiste già (bordo/gomma), **non** duplicare il selettore di scocca: aggiungi solo `font-size`, `letter-spacing`, `color`, `font-family` dentro la regola `.filtro` esistente, e la nuova `.filtro.acceso`.

- [ ] **Step 5: Commit**

```bash
git add testsuperpowers/pannello-ui.js testsuperpowers/tests/run-pannello.html testsuperpowers/styles.css
git commit -m "feat(vinile): sigle REV ECO EQ CMP sui tasti plugin"
```

---

### Task 3: Disegno grafico

**Files:**
- Create: `testsuperpowers/rack-draw.js`
- Create: `testsuperpowers/tests/rack-draw.test.mjs`

**Interfaces:**
- Consumes: `PLUGIN_IDS`
- Produces: `samplesQuiet(samples)` → boolean; `drawPluginGraph(ctx, pluginId, samples, rgb)` dove `rgb` è stringa `'61, 255, 74'` come `--tema-rgb`; `ctx` ha `canvas`, `clearRect`, `beginPath`, `moveTo`, `lineTo`, `stroke`, `fillRect`, `fill`, `closePath`

- [ ] **Step 1: Failing test**

```javascript
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { samplesQuiet, drawPluginGraph } from '../rack-draw.js';

function mockCtx(w, h) {
  const calls = [];
  return {
    calls,
    canvas: { width: w, height: h },
    strokeStyle: '',
    fillStyle: '',
    lineWidth: 0,
    clearRect() { calls.push('clear'); },
    beginPath() { calls.push('begin'); },
    moveTo() { calls.push('move'); },
    lineTo() { calls.push('line'); },
    stroke() { calls.push('stroke'); },
    fill() { calls.push('fill'); },
    closePath() { calls.push('close'); },
    fillRect() { calls.push('rect'); }
  };
}

describe('samplesQuiet', () => {
  it('silenzio vs suono', () => {
    assert.equal(samplesQuiet(new Float32Array(8)), true);
    const loud = new Float32Array([0, 0.4, -0.5, 0]);
    assert.equal(samplesQuiet(loud), false);
    assert.equal(samplesQuiet(null), true);
  });
});

describe('drawPluginGraph', () => {
  it('ogni plugin disegna e il silenzio resta quasi vuoto', () => {
    ['rev', 'eco', 'eq', 'cmp'].forEach((id) => {
      const quiet = mockCtx(120, 40);
      drawPluginGraph(quiet, id, new Float32Array(32), '61, 255, 74');
      assert.ok(quiet.calls.indexOf('clear') !== -1);
      const loud = mockCtx(120, 40);
      const s = new Float32Array(32);
      for (let i = 0; i < 32; i++) s[i] = Math.sin(i / 3);
      drawPluginGraph(loud, id, s, '61, 255, 74');
      assert.ok(loud.calls.length > quiet.calls.length);
    });
  });
});
```

- [ ] **Step 2: Run — FAIL**

Run: `node --test tests/rack-draw.test.mjs`  
Cwd: `testsuperpowers`  
Expected: FAIL

- [ ] **Step 3: Implement `rack-draw.js`**

```javascript
export function samplesQuiet(samples) {
  if (!samples || !samples.length) return true;
  let peak = 0;
  for (let i = 0; i < samples.length; i++) {
    const a = Math.abs(samples[i]);
    if (a > peak) peak = a;
  }
  return peak < 0.04;
}

export function drawPluginGraph(ctx, pluginId, samples, rgb) {
  const w = ctx.canvas.width;
  const h = ctx.canvas.height;
  ctx.clearRect(0, 0, w, h);
  const col = 'rgba(' + rgb + ', 0.85)';
  const dim = 'rgba(' + rgb + ', 0.22)';
  ctx.strokeStyle = col;
  ctx.fillStyle = dim;
  ctx.lineWidth = 1;
  const src = samples && samples.length ? samples : new Float32Array(32);
  const quiet = samplesQuiet(src);
  const n = src.length;
  if (pluginId === 'eco') {
    const copies = quiet ? 1 : 3;
    for (let c = 0; c < copies; c++) {
      ctx.beginPath();
      const off = c * 6;
      for (let i = 0; i < n; i++) {
        const x = (i / Math.max(n - 1, 1)) * w;
        const y = h * 0.5 - src[i] * h * 0.35 * (1 - c * 0.25);
        const xi = Math.min(w - 1, x + off);
        if (i === 0) ctx.moveTo(xi, y);
        else ctx.lineTo(xi, Math.round(y / 4) * 4);
      }
      ctx.stroke();
    }
    return;
  }
  if (pluginId === 'eq') {
    ctx.beginPath();
    for (let i = 0; i < n; i++) {
      const x = (i / Math.max(n - 1, 1)) * w;
      const mag = Math.abs(src[i]);
      const y = h - mag * h * (quiet ? 0.08 : 0.9);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.lineTo(w, h);
    ctx.lineTo(0, h);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    return;
  }
  if (pluginId === 'cmp') {
    let peak = 0;
    for (let i = 0; i < n; i++) peak = Math.max(peak, Math.abs(src[i]));
    const bar = (quiet ? 0.04 : Math.min(1, peak)) * (w - 8);
    ctx.fillRect(4, h * 0.35, bar, h * 0.3);
    ctx.strokeStyle = col;
    ctx.beginPath();
    const cap = w * 0.72;
    ctx.moveTo(cap, h * 0.2);
    ctx.lineTo(cap, h * 0.8);
    ctx.stroke();
    return;
  }
  ctx.beginPath();
  for (let i = 0; i < n; i++) {
    const x = (i / Math.max(n - 1, 1)) * w;
    const y = h * 0.5 - src[i] * h * (quiet ? 0.05 : 0.42);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();
}
```

- [ ] **Step 4: Run — PASS**

Run: `node --test tests/rack-draw.test.mjs tests/rack.test.mjs`  
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add testsuperpowers/rack-draw.js testsuperpowers/tests/rack-draw.test.mjs
git commit -m "feat(vinile): disegno grafico rack per i quattro plugin"
```

---

### Task 4: Cassetto UI + CSS

**Files:**
- Create: `testsuperpowers/rack-ui.js`
- Modify: `testsuperpowers/styles.css`
- Modify: `testsuperpowers/index.html` — solo se serve `#rack` vuoto; preferisci crearlo in JS come `#nastro`

**Interfaces:**
- Consumes: `CONTROLS`, `PLUGIN_TITLES`, `setParam`, `drawPluginGraph`
- Produces: `mountRack(pannelloEl, state)` → `{ setOpen(id|null), draw(samples) }`

- [ ] **Step 1: Implement `rack-ui.js`**

```javascript
import {
  CONTROLS,
  PLUGIN_TITLES,
  setParam
} from './rack.js';
import { drawPluginGraph } from './rack-draw.js';

function rgbVar() {
  const v = getComputedStyle(document.body).getPropertyValue('--tema-rgb').trim();
  return v || '61, 255, 74';
}

function bindFader(track, fill, state, pluginId, controlId, onChange) {
  const apply = (clientY) => {
    const r = track.getBoundingClientRect();
    const t = 1 - (clientY - r.top) / Math.max(r.height, 1);
    const v = setParam(state, pluginId, controlId, t);
    fill.style.height = (v * 100) + '%';
    if (onChange) onChange();
  };
  track.addEventListener('pointerdown', (ev) => {
    ev.preventDefault();
    track.setPointerCapture(ev.pointerId);
    apply(ev.clientY);
  });
  track.addEventListener('pointermove', (ev) => {
    if (!track.hasPointerCapture(ev.pointerId)) return;
    apply(ev.clientY);
  });
}

function bindKnob(el, needle, state, pluginId, controlId) {
  const apply = (clientY, startY, startV) => {
    const v = setParam(state, pluginId, controlId, startV - (clientY - startY) / 80);
    needle.style.transform = 'rotate(' + (-140 + v * 280) + 'deg)';
  };
  el.addEventListener('pointerdown', (ev) => {
    ev.preventDefault();
    el.setPointerCapture(ev.pointerId);
    el._ky = ev.clientY;
    el._kv = state.params[pluginId][controlId];
    apply(ev.clientY, el._ky, el._kv);
  });
  el.addEventListener('pointermove', (ev) => {
    if (!el.hasPointerCapture(ev.pointerId)) return;
    apply(ev.clientY, el._ky, el._kv);
  });
}

function renderControls(host, state, pluginId) {
  host.textContent = '';
  const groups = [];
  const seen = {};
  CONTROLS[pluginId].forEach((c) => {
    if (!seen[c.group]) {
      seen[c.group] = true;
      groups.push(c.group);
    }
  });
  groups.forEach((gName) => {
    const g = document.createElement('div');
    g.className = 'rack-gruppo';
    const h = document.createElement('p');
    h.className = 'rack-gruppo-titolo';
    h.textContent = gName;
    g.appendChild(h);
    const row = document.createElement('div');
    row.className = 'rack-gruppo-row';
    CONTROLS[pluginId].filter((c) => c.group === gName).forEach((c) => {
      const wrap = document.createElement('label');
      wrap.className = 'rack-ctrl';
      const name = document.createElement('span');
      name.textContent = c.id;
      wrap.appendChild(name);
      const val = state.params[pluginId][c.id];
      if (c.kind === 'fader') {
        const track = document.createElement('div');
        track.className = 'rack-fader';
        const fill = document.createElement('div');
        fill.className = 'rack-fader-fill';
        fill.style.height = (val * 100) + '%';
        track.appendChild(fill);
        bindFader(track, fill, state, pluginId, c.id);
        wrap.appendChild(track);
      } else {
        const knob = document.createElement('div');
        knob.className = 'rack-knob';
        const needle = document.createElement('div');
        needle.className = 'rack-knob-ago';
        needle.style.transform = 'rotate(' + (-140 + val * 280) + 'deg)';
        knob.appendChild(needle);
        bindKnob(knob, needle, state, pluginId, c.id);
        wrap.appendChild(knob);
      }
      row.appendChild(wrap);
    });
    g.appendChild(row);
    host.appendChild(g);
  });
}

export function mountRack(pannelloEl, state) {
  const el = document.createElement('div');
  el.id = 'rack';
  el.hidden = true;
  const comandi = document.createElement('div');
  comandi.className = 'rack-comandi';
  const grafico = document.createElement('div');
  grafico.className = 'rack-grafico';
  const canvas = document.createElement('canvas');
  canvas.className = 'rack-canvas';
  canvas.width = 480;
  canvas.height = 88;
  const titolo = document.createElement('p');
  titolo.className = 'rack-titolo';
  grafico.appendChild(canvas);
  grafico.appendChild(titolo);
  el.appendChild(comandi);
  el.appendChild(grafico);
  pannelloEl.appendChild(el);
  const ctx = canvas.getContext('2d');

  function setOpen(id) {
    if (!id) {
      el.hidden = true;
      pannelloEl.classList.remove('rack-aperto');
      return;
    }
    el.hidden = false;
    pannelloEl.classList.add('rack-aperto');
    titolo.textContent = PLUGIN_TITLES[id];
    renderControls(comandi, state, id);
  }

  function draw(samples) {
    if (el.hidden || !state.open || !ctx) return;
    drawPluginGraph(ctx, state.open, samples, rgbVar());
  }

  return { setOpen, draw, el };
}
```

- [ ] **Step 2: CSS**

Appendi in coda a `styles.css`:

```css
.filtro {
  font-size: 0.52rem;
  letter-spacing: 0.06em;
  color: rgba(196, 194, 188, 0.55);
}
#pannello.rack-aperto {
  flex-basis: 46vh;
  max-height: 420px;
}
#aiuto-pannello.rack-spostato {
  bottom: calc(46vh + 0.4rem);
}
#rack {
  display: flex;
  flex-direction: column;
  gap: 0.28rem;
  min-height: 0;
  flex: 1 1 42%;
  border: 1px solid rgba(var(--tema-rgb), 0.28);
  background: linear-gradient(180deg, rgba(var(--tema-rgb), 0.08), #121416 55%);
  padding: 0.28rem 0.35rem 0.32rem;
}
#rack[hidden] { display: none; }
.rack-comandi {
  display: flex;
  gap: 0.45rem;
  overflow: hidden;
  height: 58%;
  min-height: 72px;
}
.rack-gruppo {
  flex: 1;
  min-width: 0;
  border-right: 1px solid rgba(196, 194, 188, 0.12);
  padding-right: 0.3rem;
}
.rack-gruppo:last-child { border-right: 0; }
.rack-gruppo-titolo {
  font-size: 0.58rem;
  letter-spacing: 0.08em;
  color: rgba(var(--tema-rgb), 0.7);
  margin-bottom: 0.2rem;
}
.rack-gruppo-row {
  display: flex;
  gap: 0.35rem;
  height: calc(100% - 1.1rem);
  align-items: stretch;
}
.rack-ctrl {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.15rem;
  font-size: 0.52rem;
  color: rgba(196, 194, 188, 0.55);
  flex: 1;
}
.rack-fader {
  flex: 1;
  width: 0.55rem;
  min-height: 36px;
  border: 1px solid rgba(196, 194, 188, 0.2);
  background: #0c0e10;
  position: relative;
  cursor: ns-resize;
}
.rack-fader-fill {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(var(--tema-rgb), 0.55);
}
.rack-knob {
  width: 1.55rem;
  height: 1.55rem;
  border-radius: 50%;
  border: 1px solid rgba(196, 194, 188, 0.25);
  background: radial-gradient(circle at 35% 30%, #3a3e42, #16181a);
  position: relative;
  cursor: ns-resize;
}
.rack-knob-ago {
  position: absolute;
  left: 50%;
  top: 12%;
  width: 1px;
  height: 38%;
  background: rgba(var(--tema-rgb), 0.9);
  transform-origin: bottom center;
}
.rack-grafico {
  position: relative;
  flex: 1;
  min-height: 52px;
  border: 1px solid rgba(196, 194, 188, 0.14);
  background: #0a0c0e;
}
.rack-canvas {
  display: block;
  width: 100%;
  height: 100%;
}
.rack-titolo {
  position: absolute;
  right: 0.4rem;
  top: 0.25rem;
  font-size: 0.72rem;
  letter-spacing: 0.14em;
  color: rgba(var(--tema-rgb), 0.55);
  pointer-events: none;
}
@media (max-width: 700px) {
  #rack { display: none !important; }
  #pannello.rack-aperto {
    flex-basis: 28vh;
    max-height: 260px;
  }
}
```

Se Task 2 ha già messo font su `.filtro`, non ripetere il blocco `.filtro` qui: tieni solo `#pannello.rack-aperto` e il resto.

- [ ] **Step 3: Commit**

```bash
git add testsuperpowers/rack-ui.js testsuperpowers/styles.css
git commit -m "feat(vinile): cassetto plugin con manopole e grafico"
```

---

### Task 5: Audio meter + cablaggio

**Files:**
- Modify: `testsuperpowers/audio.js`
- Modify: `testsuperpowers/vinile.js`

**Interfaces:**
- Consumes: `createRackState`, `togglePlugin`, `closePlugin`, `isNarrowViewport`, `mountRack`, `getMeterFrame`
- Produces: `getMeterFrame()` → `Float32Array` (vuoto se audio spento); tap `AnalyserNode` su `mix` **oltre** a `mix.connect(destination)`, senza spezzare la catena

- [ ] **Step 1: `getMeterFrame` in `audio.js`**

Vicino agli altri `let` di grafo:

```javascript
let meter;
let meterBytes;
```

Dentro `unlockAudio`, dopo `mix.connect(ctx.destination);`:

```javascript
      meter = ctx.createAnalyser();
      meter.fftSize = 256;
      meterBytes = new Uint8Array(meter.fftSize);
      mix.connect(meter);
```

Esporta:

```javascript
export function getMeterFrame() {
  if (!running || !meter || !meterBytes) return new Float32Array(0);
  meter.getByteTimeDomainData(meterBytes);
  const out = new Float32Array(meterBytes.length);
  for (let i = 0; i < meterBytes.length; i++) out[i] = (meterBytes[i] - 128) / 128;
  return out;
}
```

Non toccare `master.gain`, delay, glitch, rec.

- [ ] **Step 2: Cablaggio `vinile.js`**

Import extra:

```javascript
import { getMeterFrame } from './audio.js';
import {
  createRackState,
  togglePlugin,
  closePlugin,
  isNarrowViewport
} from './rack.js';
import { mountRack } from './rack-ui.js';
```

Sostituisci il blocco `const mounted = mountPannello(...)` con:

```javascript
const rackState = createRackState(typeof localStorage !== 'undefined' ? localStorage : null);
let rackUi = null;
let mounted = null;

function syncRackChrome() {
  if (!mounted || !rackUi) return;
  const open = rackState.open;
  mounted.setPluginOpen(open);
  rackUi.setOpen(open);
  if (aiutoPannello) aiutoPannello.classList.toggle('rack-spostato', !!open);
}

function onPluginToggle(id) {
  if (isNarrowViewport(window.innerWidth)) return;
  togglePlugin(rackState, id);
  syncRackChrome();
}

function onViewportChange() {
  if (isNarrowViewport(window.innerWidth) && rackState.open) {
    closePlugin(rackState);
    syncRackChrome();
  }
}
window.addEventListener('resize', onViewportChange);

mounted = mountPannello(document.getElementById('pannello'), {
  onGesture() {
    notifyFirstGesture();
    unlockAudio();
  },
  onNoteOn(midi) { noteOn(midi); },
  onNoteOff(midi) { noteOff(midi); },
  onPadsChange(p) { setPads(p); },
  nowSec() { return performance.now() / 1000; },
  onTapeAction(action) { applyTapeAction(action); },
  onPluginToggle,
  viewportWidth() { return window.innerWidth; }
});
rackUi = mountRack(document.getElementById('pannello'), rackState);
```

In `tick()`, dopo `setAudioDeform(...)`:

```javascript
  if (rackState.open && rackUi) rackUi.draw(getMeterFrame());
```

- [ ] **Step 3: Suite**

Run: `node --test tests/pannello.test.mjs tests/tema-suono.test.mjs tests/audio-params.test.mjs tests/nastro.test.mjs tests/temi.test.mjs tests/fisica.test.mjs tests/rack.test.mjs tests/rack-draw.test.mjs`  
Cwd: `testsuperpowers`  
Expected: tutti PASS

- [ ] **Step 4: Commit**

```bash
git add testsuperpowers/audio.js testsuperpowers/vinile.js
git commit -m "feat(vinile): cablaggio cassetto plugin e grafico sul mix"
```

---

### Task 6: Verifica browser

**Files:** nessuno se Task 1–5 ok.

- [ ] **Step 1: Suite** (stesso comando del Task 5 Step 3) — tutti PASS

- [ ] **Step 2: Checklist** su `http://127.0.0.1:8770/index.html`

1. Avvio: niente cassetto; sigle visibili spente.  
2. `REV` apre riverbero; `EQ` sostituisce; `EQ` di nuovo chiude.  
3. Manopole restano; ricarica: cassetto chiuso, valori ok.  
4. Pallino: colore rack cambia, valori no.  
5. Suono/nastro come prima; girare mix non si sente.  
6. Grafico si muove suonando.  
7. Larghezza &lt; 700: cassetto no.  
8. Nessun logo; aiuti invariati.

- [ ] **Step 3:** commit solo se ritocchi CSS

---

## Self-review (spec coverage)

| Requisito | Task |
| --- | --- |
| Sigle + aria | 2 |
| Toggle / chiuso all’avvio | 1, 2, 5 |
| Persistenza `vinile_rack`, non l’aperto | 1, 5 |
| Cassetto due strati, tinta stanza | 4 |
| Controlli elencati | 1, 4 |
| Grafico dal mix, silenzio fermo | 3, 5 |
| Nessun effetto audio | 5 (solo analyser tap) |
| Telefono / resize 700 | 1, 2, 4, 5 |
| Aiuti / disco / nastro invariati | nessun tocco testi |
