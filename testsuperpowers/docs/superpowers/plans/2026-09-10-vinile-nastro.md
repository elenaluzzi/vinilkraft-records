# Vinile nastro Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task (utente: pezzi piccoli **in questa chat**, niente SDD/subagent unico). Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Aggiungere a sinistra dei pad una spia rossa (registra / ferma / riascolta una volta) e un quadrato «nuova presa» che cancella il nastro e resta in silenzio, catturando il suono già in uscita (tasti, pad, disco).

**Architecture:** Stato puro in `nastro.js` (idle / recording / playing, un solo nastro, tetto 60 s). Luci e bottoni in `pannello-ui.js` + `styles.css`. Cattura e riproduzione in `audio.js`: bus `mix` verso le casse, copia PCM mentre `capturing`, playback `AudioBuffer` diretto a `destination` (non di nuovo negli effetti). `vinile.js` smista tap e `checkRecLimit` ogni frame. `fisica.js` e `audio-params.js` invariati.

**Tech Stack:** HTML/CSS/JS ESM, Web Audio API, `node --test` + runner HTML in `tests/`.

## Global Constraints

- Nessun npm/backend; solo file statici sotto `testsuperpowers/`.
- Testi esatti etichette: `registra`, `registrazione`, `nuova presa`; nota audio già esistente `audio non disponibile`.
- Spia rossa forte **solo** in rec; riascolto a luce fioca; quadrato vetro verde come i pad.
- Tap spia con nastro già presente = riascolto, non rec sopra. Rec nuova solo dopo «nuova presa».
- Riascolto una volta; disco non risporca il nastro; live sopra non si incide.
- Non cancellare `audio/laboratorio.wav`. Non `git add -A`; stage solo file del task sotto `testsuperpowers/`.
- Anteprima: `http://127.0.0.1:8770/index.html` (se 8765 è impallata, non riusare quella porta).

---

## File map

| File | Responsabilità |
| --- | --- |
| `testsuperpowers/nastro.js` | Macchina a stati del nastro (puro) |
| `testsuperpowers/tests/nastro.test.mjs` | Test Node |
| `testsuperpowers/tests/run-nastro.html` | Stessi test in browser |
| `testsuperpowers/pannello-ui.js` | Spia + nuova presa, luci, callback |
| `testsuperpowers/styles.css` | Layout pad-row, spia rossa, quadrato |
| `testsuperpowers/audio.js` | Bus mix, cattura PCM, play una volta, clear |
| `testsuperpowers/vinile.js` | Unlock, tap rec/new, limite 60 s, fine play |

---

### Task 1: Stato nastro (logica pura)

**Files:**
- Create: `testsuperpowers/nastro.js`
- Test: `testsuperpowers/tests/nastro.test.mjs`
- Create: `testsuperpowers/tests/run-nastro.html`

**Interfaces:**
- Consumes: niente
- Produces:
  - `MAX_REC_SEC = 60`
  - `IDLE = 'idle'`, `RECORDING = 'recording'`, `PLAYING = 'playing'`
  - `export function createTapeState(): { mode: string, hasTape: boolean, recStartedAt: number }`
  - `export function isRecLampOn(state): boolean` (true solo se `mode === RECORDING`)
  - `export function tapRec(state, nowSec: number): { action: 'startRec' | 'stopRecAndPlay' | 'play' | 'none' }`
  - `export function tapNewTake(state): { action: 'clear' }`
  - `export function checkRecLimit(state, nowSec: number): { action: 'stopRecAndPlay' | 'none' }`
  - `export function onPlayEnded(state): void` (`PLAYING` → `IDLE`, `hasTape` resta true)

- [ ] **Step 1: Write the failing test**

Crea `testsuperpowers/tests/nastro.test.mjs`:

```javascript
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  MAX_REC_SEC,
  IDLE,
  RECORDING,
  PLAYING,
  createTapeState,
  isRecLampOn,
  tapRec,
  tapNewTake,
  checkRecLimit,
  onPlayEnded
} from '../nastro.js';

describe('costanti', () => {
  it('tetto 60 s', () => {
    assert.equal(MAX_REC_SEC, 60);
  });
});

describe('tapRec', () => {
  it('vuoto avvia rec, secondo tap stop+play, poi play, in play no-op', () => {
    const s = createTapeState();
    assert.equal(s.mode, IDLE);
    assert.equal(isRecLampOn(s), false);
    assert.equal(tapRec(s, 1).action, 'startRec');
    assert.equal(s.mode, RECORDING);
    assert.equal(isRecLampOn(s), true);
    assert.equal(s.recStartedAt, 1);
    assert.equal(tapRec(s, 3).action, 'stopRecAndPlay');
    assert.equal(s.mode, PLAYING);
    assert.equal(s.hasTape, true);
    assert.equal(isRecLampOn(s), false);
    onPlayEnded(s);
    assert.equal(s.mode, IDLE);
    assert.equal(s.hasTape, true);
    assert.equal(tapRec(s, 10).action, 'play');
    assert.equal(s.mode, PLAYING);
    assert.equal(tapRec(s, 11).action, 'none');
    assert.equal(s.mode, PLAYING);
  });
});

describe('tapNewTake', () => {
  it('cancella e idle, anche durante rec', () => {
    const s = createTapeState();
    tapRec(s, 0);
    assert.equal(tapNewTake(s).action, 'clear');
    assert.equal(s.mode, IDLE);
    assert.equal(s.hasTape, false);
    assert.equal(isRecLampOn(s), false);
  });
});

describe('checkRecLimit', () => {
  it('a 60 s stop+play, prima no', () => {
    const s = createTapeState();
    tapRec(s, 5);
    assert.equal(checkRecLimit(s, 64.9).action, 'none');
    assert.equal(checkRecLimit(s, 65).action, 'stopRecAndPlay');
    assert.equal(s.mode, PLAYING);
    assert.equal(s.hasTape, true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test testsuperpowers/tests/nastro.test.mjs`  
Expected: FAIL (modulo assente). Se `node` manca, Step 3 e poi `tests/run-nastro.html`.

- [ ] **Step 3: Write minimal implementation**

Crea `testsuperpowers/nastro.js`:

```javascript
export const MAX_REC_SEC = 60;
export const IDLE = 'idle';
export const RECORDING = 'recording';
export const PLAYING = 'playing';

export function createTapeState() {
  return { mode: IDLE, hasTape: false, recStartedAt: 0 };
}

export function isRecLampOn(state) {
  return state.mode === RECORDING;
}

export function tapRec(state, nowSec) {
  if (state.mode === PLAYING) return { action: 'none' };
  if (state.mode === RECORDING) {
    state.mode = PLAYING;
    state.hasTape = true;
    return { action: 'stopRecAndPlay' };
  }
  if (state.hasTape) {
    state.mode = PLAYING;
    return { action: 'play' };
  }
  state.mode = RECORDING;
  state.recStartedAt = nowSec;
  return { action: 'startRec' };
}

export function tapNewTake(state) {
  state.mode = IDLE;
  state.hasTape = false;
  state.recStartedAt = 0;
  return { action: 'clear' };
}

export function checkRecLimit(state, nowSec) {
  if (state.mode !== RECORDING) return { action: 'none' };
  if (nowSec - state.recStartedAt < MAX_REC_SEC) return { action: 'none' };
  state.mode = PLAYING;
  state.hasTape = true;
  return { action: 'stopRecAndPlay' };
}

export function onPlayEnded(state) {
  if (state.mode === PLAYING) state.mode = IDLE;
}
```

Crea `testsuperpowers/tests/run-nastro.html` copiando `tests/run-pannello.html`: stesso `assert`/`PASS`/`FAIL`/`DONE failed=0`, import da `../nastro.js`, stessi casi del file Node.

- [ ] **Step 4: Run tests and make sure they pass**

Run: `node --test testsuperpowers/tests/nastro.test.mjs`  
Expected: PASS, exit 0.

- [ ] **Step 5: Commit**

```bash
git add testsuperpowers/nastro.js testsuperpowers/tests/nastro.test.mjs testsuperpowers/tests/run-nastro.html
git commit -m "feat(vinile): stato nastro rec/play/nuova presa"
```

---

### Task 2: Bottoni visivi (spia rossa + nuova presa)

**Files:**
- Modify: `testsuperpowers/styles.css`
- Modify: `testsuperpowers/pannello-ui.js`
- Modify: `testsuperpowers/vinile.js` (handler nastro, luci; audio nastro ancora no-op o collegato in Task 3)

**Interfaces:**
- Consumes: `createTapeState`, `isRecLampOn`, `tapRec`, `tapNewTake` da `nastro.js`
- Produces: in `mountPannello` handlers extra `onRecTap()`, `onNewTake()`; DOM `#nastro`, `.spia-rec`, `.nuova-presa`, classe `.acceso` sulla spia solo in rec; etichette `registra` / `registrazione` / `nuova presa`

- [ ] **Step 1: Stili riga pad + spia**

In `styles.css` sostituisci `#pad-row` e aggiungi:

```css
#pad-row {
  display: grid;
  grid-template-columns: auto repeat(8, 1fr);
  gap: 0.35rem;
  height: 32%;
  min-height: 36px;
  align-items: stretch;
}
#nastro {
  display: flex;
  gap: 0.3rem;
  height: 100%;
}
.spia-rec, .nuova-presa {
  appearance: none;
  -webkit-appearance: none;
  cursor: pointer;
  touch-action: none;
  outline: none;
}
.spia-rec {
  width: 2.35rem;
  flex: 0 0 2.35rem;
  border-radius: 50%;
  border: 1px solid rgba(255, 80, 70, 0.28);
  background: radial-gradient(circle at 35% 30%, rgba(90, 28, 24, 0.7), rgba(28, 8, 8, 0.96));
  box-shadow:
    inset 0 8px 12px rgba(255, 120, 100, 0.08),
    0 4px 10px rgba(0, 0, 0, 0.5);
}
.spia-rec.acceso {
  border-color: rgba(255, 160, 140, 0.7);
  background: radial-gradient(circle at 35% 30%, rgba(255, 90, 70, 0.95), rgba(120, 16, 12, 0.95));
  box-shadow:
    inset 0 0 16px rgba(255, 80, 60, 0.45),
    0 0 18px rgba(255, 40, 30, 0.45);
}
.nuova-presa {
  width: 1.55rem;
  flex: 0 0 1.55rem;
  border-radius: 4px;
  border: 1px solid rgba(160, 255, 170, 0.12);
  background: linear-gradient(180deg, rgba(40, 58, 46, 0.45), rgba(8, 12, 9, 0.96));
  box-shadow: inset 0 8px 12px rgba(140, 255, 150, 0.04);
}
@media (max-width: 480px) {
  .spia-rec { width: 2.1rem; flex-basis: 2.1rem; }
  .nuova-presa { width: 1.35rem; flex-basis: 1.35rem; }
}
```

`.pad, .tasto` restano come ora (non applicare stili pad alla spia).

- [ ] **Step 2: montare i bottoni in pannello-ui.js**

In cima a `mountPannello`, dopo `padRow`:

```javascript
  const tape = createTapeState();
  const nastro = document.createElement('div');
  nastro.id = 'nastro';
  const spia = document.createElement('button');
  spia.type = 'button';
  spia.className = 'spia-rec';
  spia.setAttribute('aria-label', 'registra');
  const nuova = document.createElement('button');
  nuova.type = 'button';
  nuova.className = 'nuova-presa';
  nuova.setAttribute('aria-label', 'nuova presa');
  nastro.appendChild(spia);
  nastro.appendChild(nuova);
  padRow.appendChild(nastro);

  function syncRecLamp() {
    const on = isRecLampOn(tape);
    spia.classList.toggle('acceso', on);
    spia.setAttribute('aria-label', on ? 'registrazione' : 'registra');
  }

  spia.addEventListener('pointerdown', (ev) => {
    ev.preventDefault();
    handlers.onGesture();
    const nowSec = handlers.nowSec ? handlers.nowSec() : 0;
    const { action } = tapRec(tape, nowSec);
    syncRecLamp();
    handlers.onTapeAction(action, tape);
  });
  nuova.addEventListener('pointerdown', (ev) => {
    ev.preventDefault();
    handlers.onGesture();
    tapNewTake(tape);
    syncRecLamp();
    handlers.onTapeAction('clear', tape);
  });
```

Import da `./nastro.js`: `createTapeState`, `isRecLampOn`, `tapRec`, `tapNewTake`.

Estendi `syncLights` con `syncRecLamp()`. Return `{ state, tape, syncLights }`.

- [ ] **Step 3: vinile.js handlers (audio nastro ancora vuoto)**

```javascript
import { checkRecLimit, onPlayEnded } from './nastro.js';
```

`mountPannello` handlers: aggiungi

```javascript
  nowSec() { return performance.now() / 1000; },
  onTapeAction(action, tape) {
    // Task 3 riempie startRec / stopRecAndPlay / play / clear
  }
```

In `tick()`, dopo `setAudioDeform`:

```javascript
  const recLimit = checkRecLimit(mounted.tape, performance.now() / 1000);
  if (recLimit.action === 'stopRecAndPlay') {
    mounted.syncLights();
    // Task 3: stesso ramo stopRecAndPlay
  }
```

Salva il return di `mountPannello` in `const mounted = mountPannello(...)`.

- [ ] **Step 4: Verifica visiva**

Apri `http://127.0.0.1:8770/index.html`.  
Atteso: a sinistra dei pad spia tonda rossa fioca + quadrato verde; 8 pad visibili; tap spia → rossa forte; tap di nuovo → fioca; nuova presa → fioca; ~375px niente scroll.

- [ ] **Step 5: Commit**

```bash
git add testsuperpowers/styles.css testsuperpowers/pannello-ui.js testsuperpowers/vinile.js
git commit -m "feat(vinile): spia rec rossa e nuova presa"
```

---

### Task 3: Cattura e riascolto (Web Audio)

**Files:**
- Modify: `testsuperpowers/audio.js`
- Modify: `testsuperpowers/vinile.js`

**Interfaces:**
- Consumes: stato azioni `'startRec' | 'stopRecAndPlay' | 'play' | 'clear'`; `onPlayEnded` da `nastro.js`
- Produces:
  - `export function startTapeCapture(): void`
  - `export function stopTapeCaptureAndPlay(): void`
  - `export function playTape(): void`
  - `export function clearTape(): void`
  - `export function setTapeEndedHandler(fn: () => void): void`

- [ ] **Step 1: Bus mix in unlockAudio**

Nel grafo, **non** collegare filter/delayGain/glitchGain a `destination`. Aggiungi `mix`:

```javascript
let mix;
let recNode;
let recSink;
let capturing = false;
let recChunks = [];
let tapeBuffer = null;
let tapeSource = null;
let onTapeEnded = null;

export function setTapeEndedHandler(fn) {
  onTapeEnded = fn;
}
```

Dentro `unlockAudio`, dopo aver creato filter/delay/glitch:

```javascript
      mix = ctx.createGain();
      mix.gain.value = 1;
      master.connect(distNode);
      distNode.connect(filter);
      filter.connect(mix);
      filter.connect(delay);
      delay.connect(delayGain);
      delayGain.connect(mix);
      filter.connect(glitchFilter);
      glitchFilter.connect(glitchGain);
      glitchGain.connect(mix);
      mix.connect(ctx.destination);
      recSink = ctx.createGain();
      recSink.gain.value = 0;
      recNode = ctx.createScriptProcessor(2048, 1, 1);
      mix.connect(recNode);
      recNode.connect(recSink);
      recSink.connect(ctx.destination);
      recNode.onaudioprocess = (ev) => {
        if (!capturing) return;
        recChunks.push(Float32Array.from(ev.inputBuffer.getChannelData(0)));
      };
```

Togli i tre `.connect(ctx.destination)` vecchi su filter/delayGain/glitchGain.

- [ ] **Step 2: start/stop/play/clear**

Aggiungi in `audio.js` (dopo che `running` è true; no-op se `!running`):

```javascript
function stopTapeSource() {
  if (tapeSource) {
    try { tapeSource.stop(); } catch (e) {}
    tapeSource = null;
  }
}

function chunksToBuffer() {
  let len = 0;
  recChunks.forEach((c) => { len += c.length; });
  if (!len || !ctx) return null;
  const data = new Float32Array(len);
  let o = 0;
  recChunks.forEach((c) => { data.set(c, o); o += c.length; });
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  buf.getChannelData(0).set(data);
  return buf;
}

export function startTapeCapture() {
  if (!running) return;
  stopTapeSource();
  capturing = true;
  recChunks = [];
  tapeBuffer = null;
}

export function stopTapeCaptureAndPlay() {
  capturing = false;
  if (!running) return;
  tapeBuffer = chunksToBuffer();
  recChunks = [];
  playTape();
}

export function playTape() {
  if (!running || !tapeBuffer || tapeBuffer.length < 32) {
    if (onTapeEnded) onTapeEnded();
    return;
  }
  stopTapeSource();
  const src = ctx.createBufferSource();
  src.buffer = tapeBuffer;
  src.connect(ctx.destination);
  src.onended = () => {
    if (tapeSource === src) tapeSource = null;
    if (onTapeEnded) onTapeEnded();
  };
  tapeSource = src;
  src.start();
}

export function clearTape() {
  capturing = false;
  recChunks = [];
  tapeBuffer = null;
  stopTapeSource();
}
```

- [ ] **Step 3: Collegare vinile.js**

Import da `audio.js` anche `startTapeCapture`, `stopTapeCaptureAndPlay`, `playTape`, `clearTape`, `setTapeEndedHandler`.

```javascript
function applyTapeAction(action) {
  if (action === 'startRec') startTapeCapture();
  else if (action === 'stopRecAndPlay') stopTapeCaptureAndPlay();
  else if (action === 'play') playTape();
  else if (action === 'clear') clearTape();
}

const mounted = mountPannello(document.getElementById('pannello'), {
  onGesture() {
    notifyFirstGesture();
    unlockAudio();
  },
  onNoteOn(midi) { noteOn(midi); },
  onNoteOff(midi) { noteOff(midi); },
  onPadsChange(p) { setPads(p); },
  nowSec() { return performance.now() / 1000; },
  onTapeAction(action) { applyTapeAction(action); }
});

setTapeEndedHandler(() => {
  onPlayEnded(mounted.tape);
  mounted.syncLights();
});
```

In `tick`:

```javascript
  const recLimit = checkRecLimit(mounted.tape, performance.now() / 1000);
  if (recLimit.action === 'stopRecAndPlay') {
    mounted.syncLights();
    applyTapeAction('stopRecAndPlay');
  }
```

- [ ] **Step 4: Verifica in browser**

`http://127.0.0.1:8770/index.html`:

1. Rec + tasto/pad + piega disco → stop: riascolto una volta con la sporcizia.
2. Tap spia: stesso nastro un’altra volta; luce fioca in ascolto.
3. Durante ascolto, suonare dal vivo: si sente sopra, al tap successivo il nastro è ancora quello vecchio.
4. Nuova presa: silenzio; tap spia registra da capo.
5. Rec ~60 s: stop da solo e play.
6. ~375px: bottoni + 8 pad visibili.

- [ ] **Step 5: Commit**

```bash
git add testsuperpowers/audio.js testsuperpowers/vinile.js
git commit -m "feat(vinile): cattura nastro e riascolto una volta"
```

---

### Task 4: Regressione

**Files:** test esistenti + `tests/nastro.test.mjs`

- [ ] **Step 1:** `node --test testsuperpowers/tests/fisica.test.mjs testsuperpowers/tests/audio-params.test.mjs testsuperpowers/tests/pannello.test.mjs testsuperpowers/tests/nastro.test.mjs`  
Expected: PASS.

- [ ] **Step 2:** Checklist spec `2026-09-10-vinile-nastro-design.md` sulla pagina viva.

- [ ] **Step 3:** Commit solo se ci sono fix:

```bash
git add testsuperpowers
git commit -m "fix(vinile): ritocchi nastro dopo verifica"
```

Niente commit vuoto.

---

## Self-review (copertura spec)

| Requisito spec | Task |
| --- | --- |
| Spia tonda rossa a sinistra + quadrato nuova presa, 8 pad visibili | 2 |
| Rec = suono udibile (tasti, pad, disco) | 3 |
| Stop rec → play una volta; tap dopo = play; in play tap no-op | 1, 3 |
| Luce forte solo in rec | 1, 2 |
| Nuova presa: clear, silenzio, non avvia rec | 1, 2, 3 |
| Rec nuova solo a nastro vuoto | 1 |
| Disco non risporca il nastro; live non si incide | 3 (buffer già mixato, play su destination, capturing off) |
| Tetto 60 s | 1, 3 |
| Etichette registra / registrazione / nuova presa | 2 |
| Senza audio: luce ok, niente nastro | 3 (start no-op se !running) |
| `fisica.js` / wav fonte | 3, 4 |
