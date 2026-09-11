# Vinile rack suono Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Le manopole `REV` `ECO` `EQ` `CMP` colorano tasti, pad e disco: mix a zero = plugin assente; mix alzato = effetto da laboratorio, anche a cassetto chiuso; nastro registra dopo la catena e in riascolto non ripassa dai plugin.

**Architecture:** Default e migrazione in `rack.js` (mix a 0, versione `v: 2`). Mappa 0–1 → valori audio in `rack-dsp.js` (puro, testabile in Node). Nodi Web Audio in `audio.js` dopo il `mix` già esistente (stanze/piega) e prima di altoparlante, rec e grafico. `vinile.js` passa `applyRack` a `createRackState`. Il riascolto nastro resta su `ctx.destination`.

**Tech Stack:** HTML/CSS/JS ESM, `node --test`, preview `http://127.0.0.1:8770/index.html`.

## Global Constraints

- Nessun npm/backend; solo file sotto `testsuperpowers/`.
- Testi d’aiuto invariati. Niente logo di marca.
- Disco, pallini, nastro (gesti, tetto 60 s), otto pad, due ottave, 120 BPM, carattere delle tre stanze: invariati.
- Mix = porta: a 0 quel plugin è assente dal suono. Altri controlli si sentono solo con mix > 0.
- Default nuovi: mix **0**, altri controlli **0,5**. Chiave `vinile_rack`. Plugin aperto non persistito.
- Salvataggi senza `v: 2`: forzare i quattro mix a 0 una volta, tenere il resto, poi scrivere `v: 2`.
- Catena fissa: EQ → CMP → ECO → REV, dopo il mix stanze, prima di ascolto/rec/grafico.
- Riascolto nastro: `destination`, niente catena plugin.
- Look cassetto invariato, tranne il fader **mix** su `EQ` (oggi manca; la spec lo richiede come porta).
- Non `git add -A`. Non cancellare `audio/laboratorio.wav`.
- Anteprima: porta **8770**. Repo git: cartella padre `test`.
- Non lavorare su `main`: `git checkout -b feat/vinile-rack-suono` se manca. Su Windows: `git commit -m "messaggio"` (niente bash HEREDOC). `py -3` se serve Python; `python` può essere lo stub Store.
- Non “sistemare” wow giallo / sub violetto / scontro accordi.

---

## File map

| File | Responsabilità |
| --- | --- |
| `testsuperpowers/rack.js` | Default mix 0, `clampMix`, `PARAMS_VERSION`, load/save con `v` |
| `testsuperpowers/tests/rack.test.mjs` | Mix 0, migrazione, EQ ha mix |
| `testsuperpowers/rack-dsp.js` | Mappa params → wet/dry e target nodi |
| `testsuperpowers/tests/rack-dsp.test.mjs` | Mix 0 = wet 0; mix 1 = range da laboratorio |
| `testsuperpowers/audio.js` | Nodi EQ/CMP/ECO/REV, `applyRack`, meter/rec dopo la catena |
| `testsuperpowers/vinile.js` | `createRackState(storage, applyRack)` |
| `testsuperpowers/rack-ui.js` | Nessuna modifica (legge `CONTROLS`) |

---

### Task 1: Mix a zero, versione, mix su EQ

**Files:**
- Modify: `testsuperpowers/rack.js`
- Modify: `testsuperpowers/tests/rack.test.mjs`

**Interfaces:**
- Consumes: `CONTROLS`, `PLUGIN_IDS`, `STORAGE_KEY` già esistenti
- Produces: `PARAMS_VERSION = 2`, `clampMix(n) → 0..1` (non finito → **0**), `defaultParams()` mix 0 e resto 0.5, `CONTROLS.eq` include `mix`, `loadParams` migra e `saveParams` scrive `{ v: 2, rev, eco, eq, cmp }`, `createRackState(storage, onParams?)` chiama `onParams(params)` dopo il load, `setParam` usa `clampMix` se `controlId === 'mix'` e poi `onParams`

- [ ] **Step 1: Branch**

Cwd git root `C:\Users\asus\OneDrive\Desktop\test`. Se HEAD è `main` (o il ramo non è `feat/vinile-rack-suono`):

```bash
git checkout -b feat/vinile-rack-suono
```

- [ ] **Step 2: Aggiorna il test in `tests/rack.test.mjs`**

Import extra: `PARAMS_VERSION`, `clampMix`.

Nella describe `costanti plugin`, dopo i `CONTROLS.eq`:

```javascript
    assert.deepEqual(CONTROLS.eq.map((c) => c.id), ['gravi', 'medi', 'acuti', 'presenza', 'brillantezza', 'mix']);
    assert.equal(PARAMS_VERSION, 2);
```

Sostituisci la describe `params` con:

```javascript
describe('params', () => {
  it('mix default 0, resto 0.5, clampMix, persistenza, JSON rotto', () => {
    assert.equal(clamp01(-1), 0);
    assert.equal(clamp01(2), 1);
    assert.equal(clamp01('x'), 0.5);
    assert.equal(clampMix(-1), 0);
    assert.equal(clampMix(2), 1);
    assert.equal(clampMix('x'), 0);
    const d = defaultParams();
    assert.equal(d.rev.coda, 0.5);
    assert.equal(d.rev.mix, 0);
    assert.equal(d.eco.mix, 0);
    assert.equal(d.eq.mix, 0);
    assert.equal(d.eq.gravi, 0.5);
    assert.equal(d.cmp.mix, 0);
    const broken = parseParams('{');
    assert.equal(broken.cmp.mix, 0);
    const st = mem();
    const seen = [];
    const s = createRackState(st, (p) => { seen.push(p.rev.mix); });
    assert.equal(s.params.rev.mix, 0);
    assert.equal(seen[0], 0);
    assert.equal(setParam(s, 'rev', 'coda', 0.8), 0.8);
    assert.equal(setParam(s, 'rev', 'mix', 0.6), 0.6);
    assert.equal(s.params.rev.mix, 0.6);
    const stored = JSON.parse(st.getItem(STORAGE_KEY));
    assert.equal(stored.v, 2);
    assert.equal(stored.rev.mix, 0.6);
    const s2 = createRackState(st);
    assert.equal(s2.params.rev.mix, 0.6);
    assert.equal(s2.params.rev.coda, 0.8);
    assert.equal(s2.open, null);
    assert.equal(setParam(s, 'rev', 'ghost', 1), 0.5);
    const empty = loadParams(null);
    assert.equal(empty.eco.tempo, 0.5);
    assert.equal(empty.eco.mix, 0);
  });

  it('salvataggio scenografico senza v: mix a 0, resto tenuto', () => {
    const raw = JSON.stringify({
      rev: { livello: 0.4, coda: 0.9, stanza: 0.3, mix: 0.8 },
      eco: { tempo: 0.2, ripetizioni: 0.7, mix: 0.9 },
      eq: { gravi: 0.1, medi: 0.2, acuti: 0.3, presenza: 0.4, brillantezza: 0.6 },
      cmp: { soglia: 0.2, rapporto: 0.3, attacco: 0.4, mix: 1 }
    });
    const st = mem({ vinile_rack: raw });
    const s = createRackState(st);
    assert.equal(s.params.rev.mix, 0);
    assert.equal(s.params.eco.mix, 0);
    assert.equal(s.params.eq.mix, 0);
    assert.equal(s.params.cmp.mix, 0);
    assert.equal(s.params.rev.coda, 0.9);
    assert.equal(s.params.eco.tempo, 0.2);
    assert.equal(s.params.eq.gravi, 0.1);
    assert.equal(s.params.cmp.soglia, 0.2);
    const stored = JSON.parse(st.getItem(STORAGE_KEY));
    assert.equal(stored.v, 2);
    assert.equal(stored.rev.mix, 0);
    assert.equal(stored.rev.coda, 0.9);
  });
});
```

- [ ] **Step 3: Run — FAIL**

Run: `node --test tests/rack.test.mjs`  
Cwd: `testsuperpowers`  
Expected: FAIL (mix ancora 0.5, EQ senza mix, niente `clampMix` / `PARAMS_VERSION`)

- [ ] **Step 4: Implementazione minima in `rack.js`**

Dopo `STORAGE_KEY`:

```javascript
export const PARAMS_VERSION = 2;
```

In `CONTROLS.eq` aggiungi come ultimo elemento:

```javascript
    { id: 'mix', group: 'Mix', kind: 'fader' }
```

Dopo `clamp01`:

```javascript
export function clampMix(n) {
  const x = Number(n);
  if (!Number.isFinite(x)) return 0;
  if (x < 0) return 0;
  if (x > 1) return 1;
  return x;
}
```

Sostituisci `defaultParams`:

```javascript
export function defaultParams() {
  const o = {};
  PLUGIN_IDS.forEach((id) => {
    o[id] = {};
    CONTROLS[id].forEach((c) => {
      o[id][c.id] = c.id === 'mix' ? 0 : 0.5;
    });
  });
  return o;
}
```

In `parseParams`, nel forEach controlli:

```javascript
      if (src[c.id] != null) {
        base[id][c.id] = c.id === 'mix' ? clampMix(src[c.id]) : clamp01(src[c.id]);
      }
```

Sostituisci `loadParams` e `saveParams` e `createRackState` e `setParam`:

```javascript
export function loadParams(storage) {
  try {
    const raw = storage && storage.getItem ? storage.getItem(STORAGE_KEY) : null;
    const params = parseParams(raw);
    let data = null;
    if (raw != null && raw !== '') {
      try {
        data = typeof raw === 'string' ? JSON.parse(raw) : raw;
      } catch (e) {
        data = null;
      }
    }
    if (!data || data.v !== PARAMS_VERSION) {
      PLUGIN_IDS.forEach((id) => {
        params[id].mix = 0;
      });
      saveParams(storage, params);
    }
    return params;
  } catch (e) {
    return defaultParams();
  }
}

export function saveParams(storage, params) {
  if (!storage || typeof storage.setItem !== 'function') return;
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify({
      v: PARAMS_VERSION,
      rev: params.rev,
      eco: params.eco,
      eq: params.eq,
      cmp: params.cmp
    }));
  } catch (e) {}
}

export function createRackState(storage, onParams) {
  const state = {
    open: null,
    params: loadParams(storage),
    storage: storage || null,
    onParams: typeof onParams === 'function' ? onParams : null
  };
  if (state.onParams) state.onParams(state.params);
  return state;
}

export function setParam(state, pluginId, controlId, value) {
  if (!state.params[pluginId] || !Object.prototype.hasOwnProperty.call(state.params[pluginId], controlId)) {
    return 0.5;
  }
  const v = controlId === 'mix' ? clampMix(value) : clamp01(value);
  state.params[pluginId][controlId] = v;
  saveParams(state.storage, state.params);
  if (state.onParams) state.onParams(state.params);
  return v;
}
```

- [ ] **Step 5: Run — PASS**

Run: `node --test tests/rack.test.mjs`  
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add testsuperpowers/rack.js testsuperpowers/tests/rack.test.mjs
git commit -m "feat(vinile): mix plugin a zero e migrazione vinile_rack v2"
```

---

### Task 2: Mappa dsp pura

**Files:**
- Create: `testsuperpowers/rack-dsp.js`
- Create: `testsuperpowers/tests/rack-dsp.test.mjs`

**Interfaces:**
- Consumes: `clamp01`, `clampMix` da `rack.js`
- Produces: `mixWet(mix) → 0..1`, `mixDry(mix) → 1-wet`, `dspEq(p)`, `dspCmp(p)`, `dspEco(p)`, `dspRev(p)` oggetti numerici sotto. Mix 0 ⇒ `wet === 0` e `dry === 1`.

- [ ] **Step 1: Failing test `tests/rack-dsp.test.mjs`**

```javascript
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { mixWet, mixDry, dspEq, dspCmp, dspEco, dspRev } from '../rack-dsp.js';
import { defaultParams } from '../rack.js';

describe('mixWet / mixDry', () => {
  it('zero chiude, uno apre, non finito è zero', () => {
    assert.equal(mixWet(0), 0);
    assert.equal(mixDry(0), 1);
    assert.equal(mixWet(1), 1);
    assert.equal(mixDry(1), 0);
    assert.equal(mixWet('x'), 0);
    assert.ok(Math.abs(mixWet(0.5) - 0.5) < 1e-9);
  });
});

describe('dsp a mix 0', () => {
  it('wet a zero sui quattro, bande piatte a 0.5', () => {
    const d = defaultParams();
    const eq = dspEq(d.eq);
    assert.equal(eq.wet, 0);
    assert.equal(eq.dry, 1);
    assert.equal(eq.graviDb, 0);
    assert.equal(eq.mediDb, 0);
    assert.equal(eq.acutiDb, 0);
    const cmp = dspCmp(d.cmp);
    assert.equal(cmp.wet, 0);
    assert.equal(cmp.dry, 1);
    const eco = dspEco(d.eco);
    assert.equal(eco.wet, 0);
    assert.equal(eco.dry, 1);
    const rev = dspRev(d.rev);
    assert.equal(rev.wet, 0);
    assert.equal(rev.dry, 1);
  });
});

describe('dsp a mix 1', () => {
  it('wet pieno e range da laboratorio', () => {
    const eq = dspEq({ mix: 1, gravi: 1, medi: 0, acuti: 1, presenza: 1, brillantezza: 0 });
    assert.equal(eq.wet, 1);
    assert.ok(eq.graviDb >= 10);
    assert.ok(eq.mediDb <= -8);
    const cmp = dspCmp({ mix: 1, soglia: 0, rapporto: 1, attacco: 0 });
    assert.equal(cmp.wet, 1);
    assert.ok(cmp.thresholdDb <= -28);
    assert.ok(cmp.ratio >= 6);
    assert.ok(cmp.attackSec <= 0.01);
    const eco = dspEco({ mix: 1, tempo: 1, ripetizioni: 1 });
    assert.equal(eco.wet, 1);
    assert.ok(eco.delaySec >= 0.45);
    assert.ok(eco.feedback >= 0.55);
    const rev = dspRev({ mix: 1, livello: 1, coda: 1, stanza: 1 });
    assert.equal(rev.wet, 1);
    assert.ok(rev.inputGain >= 0.85);
    assert.ok(rev.decaySec >= 2.2);
    assert.ok(rev.dampHz >= 6000);
  });
});
```

- [ ] **Step 2: Run — FAIL**

Run: `node --test tests/rack-dsp.test.mjs`  
Cwd: `testsuperpowers`  
Expected: FAIL (modulo assente)

- [ ] **Step 3: Crea `rack-dsp.js` esattamente**

```javascript
import { clamp01, clampMix } from './rack.js';

export function mixWet(mix) {
  return clampMix(mix);
}

export function mixDry(mix) {
  return 1 - clampMix(mix);
}

export function dspEq(p) {
  const g = (v, span) => (clamp01(v) - 0.5) * span;
  return {
    wet: mixWet(p && p.mix),
    dry: mixDry(p && p.mix),
    graviDb: g(p && p.gravi, 24),
    mediDb: g(p && p.medi, 20),
    acutiDb: g(p && p.acuti, 24),
    presenzaDb: g(p && p.presenza, 16),
    brillantezzaDb: g(p && p.brillantezza, 16)
  };
}

export function dspCmp(p) {
  const soglia = clamp01(p && p.soglia);
  const rapporto = clamp01(p && p.rapporto);
  const attacco = clamp01(p && p.attacco);
  return {
    wet: mixWet(p && p.mix),
    dry: mixDry(p && p.mix),
    thresholdDb: -40 + soglia * 32,
    ratio: 1.5 + rapporto * 8.5,
    attackSec: 0.003 + attacco * 0.037,
    knee: 8,
    releaseSec: 0.12
  };
}

export function dspEco(p) {
  const tempo = clamp01(p && p.tempo);
  const rip = clamp01(p && p.ripetizioni);
  return {
    wet: mixWet(p && p.mix),
    dry: mixDry(p && p.mix),
    delaySec: 0.14 + tempo * 0.42,
    feedback: 0.12 + rip * 0.58,
    toneHz: 3200
  };
}

export function dspRev(p) {
  const livello = clamp01(p && p.livello);
  const coda = clamp01(p && p.coda);
  const stanza = clamp01(p && p.stanza);
  return {
    wet: mixWet(p && p.mix),
    dry: mixDry(p && p.mix),
    inputGain: 0.25 + livello * 0.75,
    decaySec: 0.7 + coda * 2.1,
    dampHz: 1800 + stanza * 6200
  };
}
```

- [ ] **Step 4: Run — PASS**

Run: `node --test tests/rack-dsp.test.mjs tests/rack.test.mjs`  
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add testsuperpowers/rack-dsp.js testsuperpowers/tests/rack-dsp.test.mjs
git commit -m "feat(vinile): mappa manopole rack verso valori audio"
```

---

### Task 3: Catena Web Audio + applyRack

**Files:**
- Modify: `testsuperpowers/audio.js`

**Interfaces:**
- Consumes: `dspEq`, `dspCmp`, `dspEco`, `dspRev` da `rack-dsp.js`; `defaultParams` da `rack.js`
- Produces: `applyRack(params)` — no-op se audio spento, applica i nodi se `running`; `getMeterFrame()` preleva **dopo** `rackOut`; rec collegata a `rackOut`; `mix` **non** va più a `destination` (ci va `rackOut`); `playTape` resta `src.connect(ctx.destination)`

- [ ] **Step 1: Import e variabili**

In cima a `audio.js`, dopo gli import esistenti:

```javascript
import { defaultParams } from './rack.js';
import { dspEq, dspCmp, dspEco, dspRev } from './rack-dsp.js';
```

Vicino a `let meter;`:

```javascript
let lastRackParams = null;
let rackIn;
let rackOut;
let eqLow;
let eqMid;
let eqHigh;
let eqPres;
let eqBrit;
let eqMixDry;
let eqMixWet;
let cmpNode;
let cmpMixDry;
let cmpMixWet;
let ecoDelay;
let ecoFb;
let ecoTone;
let ecoMixDry;
let ecoMixWet;
let revInGain;
let revDamp;
let revConv;
let revMixDry;
let revMixWet;
let lastRevKey = '';
```

- [ ] **Step 2: Helper impulso + build + apply**

Aggiungi prima di `export async function unlockAudio`:

```javascript
function makeRevImpulse(decaySec, dampHz) {
  const sr = ctx.sampleRate;
  const len = Math.max(1, Math.floor(sr * decaySec));
  const buf = ctx.createBuffer(1, len, sr);
  const d = buf.getChannelData(0);
  const damp = Math.exp((-2 * Math.PI * dampHz) / sr);
  let lp = 0;
  for (let i = 0; i < len; i++) {
    const env = Math.pow(1 - i / len, 1.6);
    const n = (Math.random() * 2 - 1) * env;
    lp = lp * damp + n * (1 - damp);
    d[i] = lp;
  }
  return buf;
}

function wireRack() {
  rackIn = ctx.createGain();
  rackIn.gain.value = 1;
  eqLow = ctx.createBiquadFilter();
  eqLow.type = 'lowshelf';
  eqLow.frequency.value = 120;
  eqMid = ctx.createBiquadFilter();
  eqMid.type = 'peaking';
  eqMid.frequency.value = 800;
  eqMid.Q.value = 1;
  eqHigh = ctx.createBiquadFilter();
  eqHigh.type = 'highshelf';
  eqHigh.frequency.value = 4000;
  eqPres = ctx.createBiquadFilter();
  eqPres.type = 'peaking';
  eqPres.frequency.value = 2500;
  eqPres.Q.value = 1.2;
  eqBrit = ctx.createBiquadFilter();
  eqBrit.type = 'highshelf';
  eqBrit.frequency.value = 8000;
  eqMixDry = ctx.createGain();
  eqMixWet = ctx.createGain();
  const eqOut = ctx.createGain();
  rackIn.connect(eqMixDry);
  eqMixDry.connect(eqOut);
  rackIn.connect(eqLow);
  eqLow.connect(eqMid);
  eqMid.connect(eqHigh);
  eqHigh.connect(eqPres);
  eqPres.connect(eqBrit);
  eqBrit.connect(eqMixWet);
  eqMixWet.connect(eqOut);

  cmpNode = ctx.createDynamicsCompressor();
  cmpMixDry = ctx.createGain();
  cmpMixWet = ctx.createGain();
  const cmpOut = ctx.createGain();
  eqOut.connect(cmpMixDry);
  cmpMixDry.connect(cmpOut);
  eqOut.connect(cmpNode);
  cmpNode.connect(cmpMixWet);
  cmpMixWet.connect(cmpOut);

  ecoDelay = ctx.createDelay(1.0);
  ecoTone = ctx.createBiquadFilter();
  ecoTone.type = 'lowpass';
  ecoFb = ctx.createGain();
  ecoMixDry = ctx.createGain();
  ecoMixWet = ctx.createGain();
  const ecoOut = ctx.createGain();
  cmpOut.connect(ecoMixDry);
  ecoMixDry.connect(ecoOut);
  cmpOut.connect(ecoDelay);
  ecoDelay.connect(ecoTone);
  ecoTone.connect(ecoFb);
  ecoFb.connect(ecoDelay);
  ecoTone.connect(ecoMixWet);
  ecoMixWet.connect(ecoOut);

  revInGain = ctx.createGain();
  revDamp = ctx.createBiquadFilter();
  revDamp.type = 'lowpass';
  revConv = ctx.createConvolver();
  revMixDry = ctx.createGain();
  revMixWet = ctx.createGain();
  rackOut = ctx.createGain();
  ecoOut.connect(revMixDry);
  revMixDry.connect(rackOut);
  ecoOut.connect(revInGain);
  revInGain.connect(revDamp);
  revDamp.connect(revConv);
  revConv.connect(revMixWet);
  revMixWet.connect(rackOut);
  revConv.buffer = makeRevImpulse(0.7, 1800);
  lastRevKey = '0.700:1800';
}

export function applyRack(params) {
  if (params) lastRackParams = params;
  const p = lastRackParams || defaultParams();
  if (!running || !rackOut) return;
  const eq = dspEq(p.eq);
  eqMixWet.gain.setTargetAtTime(eq.wet, ctx.currentTime, 0.02);
  eqMixDry.gain.setTargetAtTime(eq.dry, ctx.currentTime, 0.02);
  eqLow.gain.setTargetAtTime(eq.graviDb, ctx.currentTime, 0.03);
  eqMid.gain.setTargetAtTime(eq.mediDb, ctx.currentTime, 0.03);
  eqHigh.gain.setTargetAtTime(eq.acutiDb, ctx.currentTime, 0.03);
  eqPres.gain.setTargetAtTime(eq.presenzaDb, ctx.currentTime, 0.03);
  eqBrit.gain.setTargetAtTime(eq.brillantezzaDb, ctx.currentTime, 0.03);
  const cmp = dspCmp(p.cmp);
  cmpMixWet.gain.setTargetAtTime(cmp.wet, ctx.currentTime, 0.02);
  cmpMixDry.gain.setTargetAtTime(cmp.dry, ctx.currentTime, 0.02);
  cmpNode.threshold.setTargetAtTime(cmp.thresholdDb, ctx.currentTime, 0.03);
  cmpNode.ratio.setTargetAtTime(cmp.ratio, ctx.currentTime, 0.03);
  cmpNode.attack.setTargetAtTime(cmp.attackSec, ctx.currentTime, 0.03);
  cmpNode.knee.setTargetAtTime(cmp.knee, ctx.currentTime, 0.05);
  cmpNode.release.setTargetAtTime(cmp.releaseSec, ctx.currentTime, 0.05);
  const eco = dspEco(p.eco);
  ecoMixWet.gain.setTargetAtTime(eco.wet, ctx.currentTime, 0.02);
  ecoMixDry.gain.setTargetAtTime(eco.dry, ctx.currentTime, 0.02);
  ecoDelay.delayTime.setTargetAtTime(eco.delaySec, ctx.currentTime, 0.04);
  ecoFb.gain.setTargetAtTime(eco.feedback, ctx.currentTime, 0.04);
  ecoTone.frequency.setTargetAtTime(eco.toneHz, ctx.currentTime, 0.05);
  const rev = dspRev(p.rev);
  revMixWet.gain.setTargetAtTime(rev.wet, ctx.currentTime, 0.03);
  revMixDry.gain.setTargetAtTime(rev.dry, ctx.currentTime, 0.03);
  revInGain.gain.setTargetAtTime(rev.inputGain, ctx.currentTime, 0.03);
  revDamp.frequency.setTargetAtTime(rev.dampHz, ctx.currentTime, 0.05);
  const key = rev.decaySec.toFixed(3) + ':' + rev.dampHz.toFixed(0);
  if (rev.wet > 0 && key !== lastRevKey) {
    lastRevKey = key;
    revConv.buffer = makeRevImpulse(rev.decaySec, rev.dampHz);
  }
}
```

- [ ] **Step 3: Ricollega unlockAudio**

Sostituisci il blocco da `mix.connect(ctx.destination);` fino a `mix.connect(recNode);` (compresi meter) con:

```javascript
      wireRack();
      mix.connect(rackIn);
      rackOut.connect(ctx.destination);
      meter = ctx.createAnalyser();
      meter.fftSize = 256;
      meterBytes = new Uint8Array(meter.fftSize);
      rackOut.connect(meter);
      recSink = ctx.createGain();
      recSink.gain.value = 0;
      recNode = ctx.createScriptProcessor(2048, 1, 1);
      rackOut.connect(recNode);
```

Le due righe subito dopo, `recNode.connect(recSink);` e `recSink.connect(ctx.destination);`, **restano**.

Subito dopo `running = true;` (prima di `nextSixteenth`):

```javascript
      applyRack(lastRackParams || defaultParams());
```

Non toccare `playTape`: deve restare `src.connect(ctx.destination)`. Non toccare `master`, delay/glitch di stanza, `setAudioDeform`.

- [ ] **Step 4: Suite**

Run: `node --test tests/pannello.test.mjs tests/tema-suono.test.mjs tests/audio-params.test.mjs tests/nastro.test.mjs tests/temi.test.mjs tests/fisica.test.mjs tests/rack.test.mjs tests/rack-draw.test.mjs tests/rack-dsp.test.mjs`  
Cwd: `testsuperpowers`  
Expected: tutti PASS (non importare `audio.js` in Node: usa `document`)

- [ ] **Step 5: Commit**

```bash
git add testsuperpowers/audio.js
git commit -m "feat(vinile): catena EQ CMP ECO REV dopo il mix delle stanze"
```

---

### Task 4: Cablaggio vinile

**Files:**
- Modify: `testsuperpowers/vinile.js`

**Interfaces:**
- Consumes: `applyRack` da `audio.js`; `createRackState(storage, onParams)` da Task 1
- Produces: ogni `setParam` (manopole) chiama `applyRack`; all’unlock i params già caricati sono in `lastRackParams` perché `createRackState` invoca `onParams` subito

- [ ] **Step 1: Import e createRackState**

In `vinile.js` aggiungi `applyRack` all’import da `./audio.js`.

Sostituisci:

```javascript
const rackState = createRackState(typeof localStorage !== 'undefined' ? localStorage : null);
```

con:

```javascript
const rackState = createRackState(
  typeof localStorage !== 'undefined' ? localStorage : null,
  applyRack
);
```

Nessun altro file. `rack-ui.js` già chiama `setParam`; EQ mostra il fader mix perché è in `CONTROLS`.

- [ ] **Step 2: Suite** (stesso comando del Task 3 Step 4) — tutti PASS

- [ ] **Step 3: Commit**

```bash
git add testsuperpowers/vinile.js
git commit -m "feat(vinile): applica i plugin a ogni manopola"
```

---

### Task 5: Verifica browser

**Files:** nessuno se Task 1–4 ok; CSS solo se il mix EQ non sta nel cassetto.

- [ ] **Step 1: Suite** (comando Task 3 Step 4) — tutti PASS

- [ ] **Step 2: Checklist** su `http://127.0.0.1:8770/index.html` (un solo server sulla 8770)

1. Mix a zero: verde/giallo/violetto come prima (wow, delay di piega, sub). Girare coda/gravi con mix a zero: orecchio invariato.  
2. Alzare solo mix `REV`: coda evidente da laboratorio; chiudere il cassetto, la coda resta.  
3. Alzare anche mix `ECO`: si sentono entrambi.  
4. Mix EQ e CMP a zero: non colorano. Alzare mix EQ: bande evidenti. Alzare mix CMP: picchi più schiacciati.  
5. Rec con riverbero, poi mix `REV` a zero: riascolto **con** riverbero. Nuova presa a mix zero: pulita.  
6. Ricarica: mix alzati restano (dopo eventuale prima migrazione).  
7. Larghezza &lt; 700: niente cassetto; suono secondo i mix salvati.  
8. Grafico (cassetto aperto) si muove suonando; aiuti e disco invariati; nessun logo.

Un server python è forse già su 8770: non avviarne un secondo. Chrome CDP come nelle verifiche rack precedenti, pagina **live** `index.html`, niente fixture. Screenshot in `C:\Users\asus\OneDrive\Desktop\test\.superpowers\sdd\` se utile. Limite headless: se non si sente, ispezionare il grafo (`mix → rackIn`, `rackOut → destination/meter/rec`, `playTape → destination`) e dichiararlo.

- [ ] **Step 3:** commit solo se ritocchi CSS

```bash
git add testsuperpowers/styles.css
git commit -m "fix(vinile): spazio mix EQ nel cassetto"
```

---

## Self-review (spec coverage)

| Requisito | Task |
| --- | --- |
| Mix porta, default 0, resto 0.5 | 1, 2 |
| Migrazione salvataggi scenografici | 1 |
| Mix su tutti e quattro (EQ incluso) | 1 (CONTROLS + UI da CONTROLS) |
| Catena EQ → CMP → ECO → REV dopo le stanze | 3 |
| Sempre attivi a cassetto chiuso | 3, 4 (`applyRack` non dipende da `open`) |
| Carattere da laboratorio, stanza riconoscibile | 2 (range), 5 orecchio |
| Nastro rec dopo la catena | 3 (`rackOut → rec`) |
| Riascolto senza plugin | 3 (`playTape` → destination) |
| Grafico dopo i plugin | 3 (`rackOut → meter`) |
| Telefono: niente cassetto, mix salvati si sentono | già UI; 5 |
| Stanze/wow/delay piega invariati | 3 non tocca `setAudioDeform` |
| Look/aiuti invariati | nessun tocco testi; EQ +1 fader mix |
