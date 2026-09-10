# Vinile sintetizzatore Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Aggiungere alla pagina del vinile da laboratorio un sintetizzatore in barra (due ottave di tasti luminescenti da tenere + 8 pad a loop) che genera il suono, mentre il disco lo sporca senza cambiare il tempo.

**Architecture:** Logica pura in `pannello.js` (stato tasti/pad e griglia 16th a 120 BPM) e `audio-params.js` già esistente (`piega`/`schiaccia` → effetti). DOM della barra in `index.html` + `styles.css` + `pannello-ui.js`. Motore Web Audio in `audio.js` (oscillatori e colpi, niente wav come fonte). `vinile.js` resta il disco WebGL e chiama unlock/deform/click.

**Tech Stack:** HTML, CSS, JavaScript ESM, Three.js r128 (CDN, già in pagina), Web Audio API, `node --test` e runner HTML in `tests/` se Node non è in PATH.

## Global Constraints

- Nessun npm, webpack, vite o backend; solo file statici sotto `testsuperpowers/`.
- Non toccare Vinilkraft / Vision Fest; non cancellare `audio/laboratorio.wav` (resta inutilizzato).
- Testi esatti: `muovi per piegare · tocca per schiacciare`, `muovi · tocca`, `tieni i tasti · i pad restano accesi`, `audio non disponibile`, `questo esperimento ha bisogno di un browser più recente`.
- Tasti: due ottave MIDI 48–72 (Do3–Do5), suonano solo mentre premuti. Pad: 8, latch on/off.
- Loop pad: 120 BPM, 4/4, 16 sedicesimi a battuta; piega/schiaccia non cambiano questa griglia.
- Audio parte al primo `pointerdown` (tasto, pad o disco), non al solo movimento. Aiuti spariscono al primo gesto (anche `pointermove` sul disco).
- Rotazione disco mai in pausa; `fisica.js` non si modifica in questo piano.
- Commit solo file sotto `testsuperpowers/` pertinenti al task.

---

## File map

| File | Responsabilità |
| --- | --- |
| `testsuperpowers/pannello.js` | Stato tasti/pad, MIDI, pattern 16th, BPM |
| `testsuperpowers/tests/pannello.test.mjs` | Test Node di `pannello.js` |
| `testsuperpowers/tests/run-pannello.html` | Stessi test in browser |
| `testsuperpowers/audio-params.js` | Già esiste: effetti da piega/schiaccia — **non modificare** |
| `testsuperpowers/index.html` | Canvas, aiuti, nota audio, markup barra |
| `testsuperpowers/styles.css` | Layout flex canvas+barra, tasti/pad luminescenti, mobile |
| `testsuperpowers/pannello-ui.js` | Genera tasti, eventi, classi `acceso`, callback gesto |
| `testsuperpowers/audio.js` | Sostituire: synth + scheduler pad + catena effetti + click squash |
| `testsuperpowers/vinile.js` | Collegare audio, primo gesto, `triggerSquashClick` |

---

### Task 1: Stato tasti e pad (logica pura)

**Files:**
- Create: `testsuperpowers/pannello.js`
- Test: `testsuperpowers/tests/pannello.test.mjs`
- Create: `testsuperpowers/tests/run-pannello.html`

**Interfaces:**
- Consumes: niente
- Produces:
  - `LOW_MIDI = 48`, `HIGH_MIDI = 72`, `PAD_COUNT = 8`, `BPM = 120`, `SIXTEENTHS_PER_BAR = 16`
  - `export function midiHz(midi: number): number`
  - `export function isBlackKey(midi: number): boolean`
  - `export function createPanelState(): { keys: Record<string, boolean>, pads: boolean[] }`
  - `export function pressKey(state, midi): void`
  - `export function releaseKey(state, midi): void`
  - `export function heldMidis(state): number[]` (ordinati)
  - `export function togglePad(state, index): boolean` (nuovo valore; fuori range: no-op, `false`)
  - `export function padOn(state, index): boolean`
  - `export function padShouldHit(padIndex, sixteenth): boolean`
  - `export const PAD_STEPS: number[][]` lunghezza 8

- [ ] **Step 1: Write the failing test**

Crea `testsuperpowers/tests/pannello.test.mjs`:

```javascript
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  LOW_MIDI,
  HIGH_MIDI,
  PAD_COUNT,
  BPM,
  SIXTEENTHS_PER_BAR,
  midiHz,
  isBlackKey,
  createPanelState,
  pressKey,
  releaseKey,
  heldMidis,
  togglePad,
  padOn,
  padShouldHit
} from '../pannello.js';

describe('costanti', () => {
  it('due ottave e otto pad a 120', () => {
    assert.equal(LOW_MIDI, 48);
    assert.equal(HIGH_MIDI, 72);
    assert.equal(PAD_COUNT, 8);
    assert.equal(BPM, 120);
    assert.equal(SIXTEENTHS_PER_BAR, 16);
  });
});

describe('midiHz / isBlackKey', () => {
  it('A4 è 440', () => {
    assert.ok(Math.abs(midiHz(69) - 440) < 1e-6);
  });
  it('Do e neri', () => {
    assert.equal(isBlackKey(48), false);
    assert.equal(isBlackKey(49), true);
    assert.equal(isBlackKey(50), false);
  });
});

describe('tasti', () => {
  it('hold e release, ignora fuori range', () => {
    const s = createPanelState();
    pressKey(s, 48);
    pressKey(s, 60);
    pressKey(s, 47);
    pressKey(s, 73);
    assert.deepEqual(heldMidis(s), [48, 60]);
    releaseKey(s, 48);
    assert.deepEqual(heldMidis(s), [60]);
    releaseKey(s, 60);
    assert.deepEqual(heldMidis(s), []);
  });
});

describe('pad latch', () => {
  it('toggle e più pad insieme', () => {
    const s = createPanelState();
    assert.equal(togglePad(s, 0), true);
    assert.equal(togglePad(s, 2), true);
    assert.equal(padOn(s, 0), true);
    assert.equal(padOn(s, 2), true);
    assert.equal(togglePad(s, 0), false);
    assert.equal(padOn(s, 0), false);
    assert.equal(padOn(s, 2), true);
    assert.equal(togglePad(s, -1), false);
    assert.equal(togglePad(s, 8), false);
  });
});

describe('padShouldHit', () => {
  it('cassa sui quarti', () => {
    assert.equal(padShouldHit(0, 0), true);
    assert.equal(padShouldHit(0, 4), true);
    assert.equal(padShouldHit(0, 8), true);
    assert.equal(padShouldHit(0, 12), true);
    assert.equal(padShouldHit(0, 1), false);
  });
  it('wrap del sedicesimo e indice invalido', () => {
    assert.equal(padShouldHit(0, 16), true);
    assert.equal(padShouldHit(9, 0), false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test testsuperpowers/tests/pannello.test.mjs`  
Expected: FAIL (modulo assente). Se `node` non è in PATH, vai comunque allo Step 3 e verifica dopo con `tests/run-pannello.html`.

- [ ] **Step 3: Write minimal implementation**

Crea `testsuperpowers/pannello.js`:

```javascript
export const LOW_MIDI = 48;
export const HIGH_MIDI = 72;
export const PAD_COUNT = 8;
export const BPM = 120;
export const SIXTEENTHS_PER_BAR = 16;

export const PAD_STEPS = [
  [0, 4, 8, 12],
  [4, 12],
  [0, 2, 4, 6, 8, 10, 12, 14],
  [4, 12],
  [6, 14],
  [8],
  [0, 10],
  [14]
];

export function midiHz(midi) {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

export function isBlackKey(midi) {
  const pc = ((midi % 12) + 12) % 12;
  return pc === 1 || pc === 3 || pc === 6 || pc === 8 || pc === 10;
}

export function createPanelState() {
  return { keys: Object.create(null), pads: Array(PAD_COUNT).fill(false) };
}

export function pressKey(state, midi) {
  if (midi < LOW_MIDI || midi > HIGH_MIDI) return;
  state.keys[midi] = true;
}

export function releaseKey(state, midi) {
  delete state.keys[midi];
}

export function heldMidis(state) {
  return Object.keys(state.keys).map(Number).sort((a, b) => a - b);
}

export function togglePad(state, index) {
  if (index < 0 || index >= PAD_COUNT) return false;
  state.pads[index] = !state.pads[index];
  return state.pads[index];
}

export function padOn(state, index) {
  if (index < 0 || index >= PAD_COUNT) return false;
  return state.pads[index] === true;
}

export function padShouldHit(padIndex, sixteenth) {
  if (padIndex < 0 || padIndex >= PAD_COUNT) return false;
  const s = ((sixteenth % SIXTEENTHS_PER_BAR) + SIXTEENTHS_PER_BAR) % SIXTEENTHS_PER_BAR;
  return PAD_STEPS[padIndex].indexOf(s) !== -1;
}
```

Crea `testsuperpowers/tests/run-pannello.html` (stessi assert, import da `../pannello.js`), copiando la struttura di `tests/run.html` (lista di test, `PASS`/`FAIL`, riga `DONE failed=0`).

- [ ] **Step 4: Run tests and make sure they pass**

Run: `node --test testsuperpowers/tests/pannello.test.mjs`  
Expected: PASS (exit 0).  
Oppure apri `http://127.0.0.1:8765/tests/run-pannello.html` → `DONE failed=0`.

- [ ] **Step 5: Commit**

```bash
git add testsuperpowers/pannello.js testsuperpowers/tests/pannello.test.mjs testsuperpowers/tests/run-pannello.html
git commit -m "feat(vinile): stato tasti, pad latch e griglia 120 BPM"
```

---

### Task 2: Barra visiva (markup + luminescenza)

**Files:**
- Modify: `testsuperpowers/index.html`
- Modify: `testsuperpowers/styles.css`
- Create: `testsuperpowers/pannello-ui.js`

**Interfaces:**
- Consumes: `createPanelState`, `pressKey`, `releaseKey`, `togglePad`, `padOn`, `heldMidis`, `isBlackKey`, `LOW_MIDI`, `HIGH_MIDI`, `PAD_COUNT` da `pannello.js`
- Produces:
  - `export function mountPannello(root: HTMLElement, options: { onGesture: () => void, onNoteOn: (midi: number) => void, onNoteOff: (midi: number) => void, onPadsChange: (pads: boolean[]) => void }): { state, syncLights: () => void }`
  - DOM: `#pannello`, `#pad-row`, `#tastiera`, `#aiuto-pannello`, `#nota-audio`
  - Classi: `.tasto`, `.tasto-nero`, `.tasto-bianco`, `.pad`, `.acceso`

- [ ] **Step 1: Markup in index.html**

Sostituisci il `body` di `testsuperpowers/index.html` con:

```html
<body>
  <div id="errore-webgl" hidden>questo esperimento ha bisogno di un browser più recente</div>
  <p id="aiuto">
    <span class="aiuto-wide">muovi per piegare · tocca per schiacciare</span>
    <span class="aiuto-narrow">muovi · tocca</span>
  </p>
  <p id="aiuto-pannello">tieni i tasti · i pad restano accesi</p>
  <p id="nota-audio" hidden>audio non disponibile</p>
  <canvas id="stage"></canvas>
  <div id="pannello">
    <div id="pad-row"></div>
    <div id="tastiera"></div>
  </div>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
  <script type="module" src="vinile.js"></script>
</body>
```

- [ ] **Step 2: Stili barra e tasti luminescenti**

In `testsuperpowers/styles.css` aggiungi (e sposta `#aiuto` in alto, non in basso):

```css
body {
  display: flex;
  flex-direction: column;
}
#stage {
  display: block;
  flex: 1 1 auto;
  min-height: 0;
  width: 100%;
  height: auto;
}
#aiuto {
  top: 1.2rem;
  left: 1.2rem;
  bottom: auto;
}
#aiuto-pannello, #nota-audio {
  position: fixed;
  z-index: 2;
  pointer-events: none;
  letter-spacing: 0.04em;
  font-size: 0.8rem;
  opacity: 0.75;
}
#aiuto-pannello {
  left: 1.2rem;
  bottom: calc(28vh + 0.4rem);
}
#nota-audio {
  right: 1.2rem;
  top: 1.2rem;
}
#aiuto-pannello[hidden], #nota-audio[hidden] {
  display: none;
}
#pannello {
  flex: 0 0 28vh;
  min-height: 150px;
  max-height: 260px;
  z-index: 3;
  padding: 0.45rem 0.6rem 0.55rem;
  background: linear-gradient(#071208, #030503);
  border-top: 1px solid #2cff6a44;
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}
#pad-row {
  display: grid;
  grid-template-columns: repeat(8, 1fr);
  gap: 0.35rem;
  height: 32%;
  min-height: 36px;
}
.pad, .tasto {
  border: 1px solid #3dff7a55;
  background: #071a0c;
  box-shadow: 0 0 10px #39ff1422, inset 0 0 12px #39ff1428;
  cursor: pointer;
  touch-action: none;
}
.pad.acceso, .tasto.acceso {
  background: #1c4a22;
  box-shadow: 0 0 22px #7dff4a, inset 0 0 18px #b4ff50aa;
  border-color: #b8ff9a;
}
#tastiera {
  position: relative;
  flex: 1;
  min-height: 72px;
  display: flex;
}
.tasto-bianco {
  flex: 1;
  height: 100%;
  border-radius: 0 0 6px 6px;
  z-index: 1;
}
.tasto-nero {
  position: absolute;
  top: 0;
  width: 4.2%;
  height: 58%;
  background: #050a06;
  z-index: 2;
  border-radius: 0 0 4px 4px;
}
.tasto-nero.acceso {
  background: #16331c;
}
@media (max-width: 480px) {
  #pannello {
    flex-basis: 34vh;
    min-height: 168px;
  }
  #aiuto-pannello {
    bottom: calc(34vh + 0.3rem);
    font-size: 0.7rem;
  }
}
```

Tieni `overflow: hidden` e `touch-action: none` su `html, body`. Aggiorna il selettore hidden: `#errore-webgl[hidden], #aiuto[hidden]`.

- [ ] **Step 3: pannello-ui.js**

Crea `testsuperpowers/pannello-ui.js`:

```javascript
import {
  LOW_MIDI,
  HIGH_MIDI,
  PAD_COUNT,
  createPanelState,
  pressKey,
  releaseKey,
  togglePad,
  isBlackKey
} from './pannello.js';

const PAD_LABELS = ['cassa', 'rullante', 'hi-hat', 'clap', 'tom', 'lab', 'aspro', 'rumore'];

function whiteIndex(midi) {
  let n = 0;
  for (let m = LOW_MIDI; m < midi; m++) {
    if (!isBlackKey(m)) n += 1;
  }
  return n;
}

function whiteCount() {
  let n = 0;
  for (let m = LOW_MIDI; m <= HIGH_MIDI; m++) {
    if (!isBlackKey(m)) n += 1;
  }
  return n;
}

export function mountPannello(root, handlers) {
  const state = createPanelState();
  const padRow = root.querySelector('#pad-row');
  const tastiera = root.querySelector('#tastiera');
  const whites = whiteCount();
  const padEls = [];
  const keyEls = new Map();

  for (let i = 0; i < PAD_COUNT; i++) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'pad';
    b.dataset.pad = String(i);
    b.setAttribute('aria-label', PAD_LABELS[i]);
    b.addEventListener('pointerdown', (ev) => {
      ev.preventDefault();
      handlers.onGesture();
      const on = togglePad(state, i);
      b.classList.toggle('acceso', on);
      handlers.onPadsChange(state.pads.slice());
    });
    padRow.appendChild(b);
    padEls.push(b);
  }

  for (let midi = LOW_MIDI; midi <= HIGH_MIDI; midi++) {
    if (isBlackKey(midi)) continue;
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'tasto tasto-bianco';
    b.dataset.midi = String(midi);
    bindKey(b, midi);
    tastiera.appendChild(b);
    keyEls.set(midi, b);
  }

  const wCount = whites;
  for (let midi = LOW_MIDI; midi <= HIGH_MIDI; midi++) {
    if (!isBlackKey(midi)) continue;
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'tasto tasto-nero';
    b.dataset.midi = String(midi);
    const wi = whiteIndex(midi);
    b.style.left = ((wi / wCount) * 100 - 2.1) + '%';
    bindKey(b, midi);
    tastiera.appendChild(b);
    keyEls.set(midi, b);
  }

  function bindKey(el, midi) {
    const down = (ev) => {
      ev.preventDefault();
      if (el.dataset.held === '1') return;
      el.dataset.held = '1';
      handlers.onGesture();
      pressKey(state, midi);
      el.classList.add('acceso');
      handlers.onNoteOn(midi);
    };
    const up = () => {
      if (el.dataset.held !== '1') return;
      el.dataset.held = '0';
      releaseKey(state, midi);
      el.classList.remove('acceso');
      handlers.onNoteOff(midi);
    };
    el.addEventListener('pointerdown', down);
    el.addEventListener('pointerup', up);
    el.addEventListener('pointercancel', up);
    el.addEventListener('pointerleave', up);
  }

  function syncLights() {
    padEls.forEach((el, i) => el.classList.toggle('acceso', state.pads[i]));
    keyEls.forEach((el, midi) => el.classList.toggle('acceso', !!state.keys[midi]));
  }

  return { state, syncLights };
}
```

Non importare ancora questo file da `vinile.js` in questo task se preferisci un commit solo visivo: in quel caso aggiungi temporaneamente in fondo a `index.html` (prima di vinile.js) un modulo inline **non** — invece importa da `vinile.js` nello Step 4 di questo task un mount con handler vuoti, poi il Task 5 li riempie. Per non lasciare la barra vuota, fai già l’import in `vinile.js`:

In cima a `vinile.js` aggiungi:

```javascript
import { mountPannello } from './pannello-ui.js';
```

Dopo `notifyFirstGesture` esistente, nascondi anche il pannello:

```javascript
const aiutoPannello = document.getElementById('aiuto-pannello');

export function notifyFirstGesture() {
  if (firstGesture) return;
  firstGesture = true;
  aiuto.hidden = true;
  if (aiutoPannello) aiutoPannello.hidden = true;
}

mountPannello(document.getElementById('pannello'), {
  onGesture: notifyFirstGesture,
  onNoteOn() {},
  onNoteOff() {},
  onPadsChange() {}
});
```

- [ ] **Step 4: Verifica visiva**

Apri `http://127.0.0.1:8765/index.html` (se la 8765 è impallata: kill Python e riavvia `ThreadingHTTPServer` da `testsuperpowers`).  
Atteso: disco ancora visibile sopra; in basso 8 pad e tastiera due ottave, luce fioca; al tasto luce più forte finché tieni; pad resta acceso al tap, si spegne al secondo tap; aiuto pannello visibile; su ~375px disco intero e tasti tutti visibili senza scroll pagina.

- [ ] **Step 5: Commit**

```bash
git add testsuperpowers/index.html testsuperpowers/styles.css testsuperpowers/pannello-ui.js testsuperpowers/vinile.js
git commit -m "feat(vinile): barra tasti luminescenti e pad latch"
```

---

### Task 3: Motore sintetizzatore (Web Audio)

**Files:**
- Modify: `testsuperpowers/audio.js` (sostituzione completa)

**Interfaces:**
- Consumes: `effectParams(piega, schiaccia)` da `audio-params.js`; `midiHz`, `BPM`, `SIXTEENTHS_PER_BAR`, `PAD_COUNT`, `padShouldHit` da `pannello.js`
- Produces:
  - `export function isAudioRunning(): boolean`
  - `export async function unlockAudio(): Promise<boolean>`
  - `export function setAudioDeform(piega: number, schiaccia: number): void`
  - `export function noteOn(midi: number): void`
  - `export function noteOff(midi: number): void`
  - `export function setPads(pads: boolean[]): void`
  - `export function triggerSquashClick(): void`

- [ ] **Step 1: Sostituisci audio.js** (niente fetch wav)

Il file deve:

1. Creare `AudioContext` in `unlockAudio`, `resume()`, costruire la catena: `masterGain` → `WaveShaper` → `lowpass` → destination, più delay e glitch highpass come nell’`audio.js` attuale (stessi `makeCurve` e `effectParams`).
2. `noteOn`/`noteOff`: un `OscillatorNode` tipo `sawtooth` per midi, gain con attacco 0.01s e release 0.18s al `noteOff`; connettere gli oscillator al `masterGain` (o a un `voicesGain` prima del waveshaper).
3. Scheduler: `sixteenthDur = 60 / BPM / 4` (0.125s). Loop `setTimeout`/`currentTime` lookahead 0.1s. Per ogni sedicesimo, per ogni pad `i` se `pads[i] && padShouldHit(i, step)` chiama `hitPad(i, time)`.
4. `hitPad`:
   - 0 cassa: sine, freq 150→40, 0.18s
   - 1 rullante: buffer rumore, bandpass ~1800, 0.12s
   - 2 hi-hat: rumore highpass 6000, 0.05s
   - 3 clap: rumore, due burst ravvicinati
   - 4 tom: sine 140Hz, 0.2s
   - 5 lab morbido: triangle 220Hz, 0.25s
   - 6 lab aspro: sawtooth 90Hz, 0.2s
   - 7 rumore: rumore bianco 0.15s  
   Tutti nel `masterGain` (quindi passano per piega/schiaccia).
5. `triggerSquashClick`: impulso rumore 30ms + piccolo gain spike, anche senza note.
6. Se `AudioContext` fallisce: `running = false`, `#nota-audio` `hidden = false`, return `false`.
7. `setPads` aggiorna l’array usato dallo scheduler; non resetta il clock.
8. Idempotenza: secondo `unlockAudio` return `true` senza ricreare il grafo.

Implementazione di riferimento da scrivere nel file (completa, non parziale):

```javascript
import { effectParams } from './audio-params.js';
import {
  midiHz,
  BPM,
  SIXTEENTHS_PER_BAR,
  PAD_COUNT,
  padShouldHit
} from './pannello.js';

const nota = document.getElementById('nota-audio');

let ctx;
let running = false;
let distNode;
let filter;
let delayGain;
let glitchGain;
let master;
let voices = new Map();
let pads = Array(PAD_COUNT).fill(false);
let noiseBuf;
let nextSixteenth = 0;
let step = 0;
let timer = 0;

export function isAudioRunning() {
  return running;
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

function makeNoise(seconds) {
  const len = Math.floor(ctx.sampleRate * seconds);
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
  return buf;
}

function connectVoice(node) {
  node.connect(master);
}

export async function unlockAudio() {
  if (running) return true;
  try {
    const AC = window.AudioContext || window.webkitAudioContext;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = 0.22;
    distNode = ctx.createWaveShaper();
    distNode.curve = makeCurve(0);
    filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 12000;
    const delay = ctx.createDelay(1.0);
    delay.delayTime.value = 0.05;
    delayGain = ctx.createGain();
    delayGain.gain.value = 0;
    glitchGain = ctx.createGain();
    glitchGain.gain.value = 0;
    const glitchFilter = ctx.createBiquadFilter();
    glitchFilter.type = 'highpass';
    glitchFilter.frequency.value = 1800;
    master.connect(distNode);
    distNode.connect(filter);
    filter.connect(ctx.destination);
    filter.connect(delay);
    delay.connect(delayGain);
    delayGain.connect(ctx.destination);
    filter.connect(glitchFilter);
    glitchFilter.connect(glitchGain);
    glitchGain.connect(ctx.destination);
    noiseBuf = makeNoise(1);
    await ctx.resume();
    running = true;
    nextSixteenth = ctx.currentTime + 0.05;
    step = 0;
    sched();
    if (nota) nota.hidden = true;
    return true;
  } catch (e) {
    running = false;
    if (nota) nota.hidden = false;
    return false;
  }
}

function sched() {
  if (!running) return;
  const dur = 60 / BPM / 4;
  const horizon = ctx.currentTime + 0.12;
  while (nextSixteenth < horizon) {
    for (let i = 0; i < PAD_COUNT; i++) {
      if (pads[i] && padShouldHit(i, step)) hitPad(i, nextSixteenth);
    }
    nextSixteenth += dur;
    step = (step + 1) % SIXTEENTHS_PER_BAR;
  }
  timer = window.setTimeout(sched, 40);
}

function envGain(t, peak, attack, decay) {
  const g = ctx.createGain();
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(peak, t + attack);
  g.gain.exponentialRampToValueAtTime(0.0008, t + attack + decay);
  connectVoice(g);
  return g;
}

function hitPad(i, t) {
  if (i === 0) {
    const o = ctx.createOscillator();
    o.type = 'sine';
    o.frequency.setValueAtTime(150, t);
    o.frequency.exponentialRampToValueAtTime(40, t + 0.16);
    o.connect(envGain(t, 0.9, 0.005, 0.18));
    o.start(t);
    o.stop(t + 0.22);
  } else if (i === 4) {
    const o = ctx.createOscillator();
    o.type = 'sine';
    o.frequency.value = 140;
    o.connect(envGain(t, 0.5, 0.005, 0.2));
    o.start(t);
    o.stop(t + 0.24);
  } else if (i === 5) {
    const o = ctx.createOscillator();
    o.type = 'triangle';
    o.frequency.value = 220;
    o.connect(envGain(t, 0.35, 0.01, 0.25));
    o.start(t);
    o.stop(t + 0.3);
  } else if (i === 6) {
    const o = ctx.createOscillator();
    o.type = 'sawtooth';
    o.frequency.value = 90;
    o.connect(envGain(t, 0.28, 0.005, 0.2));
    o.start(t);
    o.stop(t + 0.24);
  } else {
    const src = ctx.createBufferSource();
    src.buffer = noiseBuf;
    const bp = ctx.createBiquadFilter();
    if (i === 2) {
      bp.type = 'highpass';
      bp.frequency.value = 6000;
    } else if (i === 1) {
      bp.type = 'bandpass';
      bp.frequency.value = 1800;
    } else if (i === 3) {
      bp.type = 'bandpass';
      bp.frequency.value = 1200;
    } else {
      bp.type = 'highpass';
      bp.frequency.value = 400;
    }
    src.connect(bp);
    bp.connect(envGain(t, i === 2 ? 0.22 : 0.4, 0.003, i === 2 ? 0.05 : 0.12));
    src.start(t);
    src.stop(t + 0.2);
    if (i === 3) {
      const src2 = ctx.createBufferSource();
      src2.buffer = noiseBuf;
      const bp2 = ctx.createBiquadFilter();
      bp2.type = 'bandpass';
      bp2.frequency.value = 1200;
      src2.connect(bp2);
      bp2.connect(envGain(t + 0.04, 0.32, 0.003, 0.1));
      src2.start(t + 0.04);
      src2.stop(t + 0.2);
    }
  }
}

export function noteOn(midi) {
  if (!running || voices.has(midi)) return;
  const o = ctx.createOscillator();
  o.type = 'sawtooth';
  o.frequency.value = midiHz(midi);
  const g = ctx.createGain();
  g.gain.setValueAtTime(0, ctx.currentTime);
  g.gain.linearRampToValueAtTime(0.12, ctx.currentTime + 0.01);
  o.connect(g);
  connectVoice(g);
  o.start();
  voices.set(midi, { o, g });
}

export function noteOff(midi) {
  if (!running) return;
  const v = voices.get(midi);
  if (!v) return;
  const t = ctx.currentTime;
  v.g.gain.cancelScheduledValues(t);
  v.g.gain.setValueAtTime(Math.max(0.0008, v.g.gain.value), t);
  v.g.gain.exponentialRampToValueAtTime(0.0008, t + 0.18);
  v.o.stop(t + 0.2);
  voices.delete(midi);
}

export function setPads(next) {
  pads = next.slice(0, PAD_COUNT);
}

export function setAudioDeform(piega, schiaccia) {
  if (!running) return;
  const p = effectParams(piega, schiaccia);
  distNode.curve = makeCurve(p.distortion);
  filter.frequency.setTargetAtTime(Math.max(400, p.filterHz), ctx.currentTime, 0.05);
  delayGain.gain.setTargetAtTime(p.delay, ctx.currentTime, 0.05);
  glitchGain.gain.setTargetAtTime(p.glitchGain, ctx.currentTime, 0.02);
}

export function triggerSquashClick() {
  if (!running) return;
  const t = ctx.currentTime;
  const src = ctx.createBufferSource();
  src.buffer = noiseBuf;
  const hp = ctx.createBiquadFilter();
  hp.type = 'highpass';
  hp.frequency.value = 2000;
  src.connect(hp);
  hp.connect(envGain(t, 0.55, 0.001, 0.04));
  src.start(t);
  src.stop(t + 0.06);
}
```

- [ ] **Step 2: Collegare handlers in vinile.js**

Import:

```javascript
import {
  unlockAudio,
  setAudioDeform,
  noteOn,
  noteOff,
  setPads,
  triggerSquashClick
} from './audio.js';
```

`mountPannello` handlers:

```javascript
mountPannello(document.getElementById('pannello'), {
  onGesture() {
    notifyFirstGesture();
    unlockAudio();
  },
  onNoteOn(midi) { noteOn(midi); },
  onNoteOff(midi) { noteOff(midi); },
  onPadsChange(p) { setPads(p); }
});
```

Su `canvas` `pointerdown`: `unlockAudio()`; se il tap è sul disco (`isPointerOnDisc`), chiama anche `triggerSquashClick()`.

In `tick()`, dopo `applyDeform`:

```javascript
setAudioDeform(piega, schiaccia);
```

- [ ] **Step 3: Verifica in browser (obbligatoria, non solo screenshot)**

`http://127.0.0.1:8765/index.html`:

1. All’apertura silenzio, tasti fioco.
2. Tieni tasti: note; lascia: coda breve.
3. Pad cassa: colpi sui quarti a 120; secondo tap spegne; più pad insieme.
4. Piegare il disco sporca il suono; i colpi restano sullo stesso tempo.
5. Schiacciare sul disco: click + suono schiacciato che torna; a vuoto comunque un click.
6. Disco non si ferma; barra non copre il disco.
7. Aiuti spariscono al primo gesto.
8. Viewport ~375px: disco intero, tutti i tasti, pad usabili, niente scroll.
9. (Opzionale) disattiva audio di sistema: nota `audio non disponibile` se il context fallisce; disco e luci restano.

Se 8765 dà `ERR_EMPTY_RESPONSE`: kill Python in ascolto e riavvia da `testsuperpowers`.

- [ ] **Step 4: Commit**

```bash
git add testsuperpowers/audio.js testsuperpowers/vinile.js
git commit -m "feat(vinile): synth tasti/pad deformato dal disco"
```

---

### Task 4: Chiusura e regressione logica

**Files:**
- Test esistenti: `tests/fisica.test.mjs`, `tests/audio-params.test.mjs`, `tests/pannello.test.mjs`

**Interfaces:** nessuna nuova.

- [ ] **Step 1: Rilancia i test di logica**

Run: `node --test testsuperpowers/tests/fisica.test.mjs testsuperpowers/tests/audio-params.test.mjs testsuperpowers/tests/pannello.test.mjs`  
Expected: PASS. Altrimenti i tre `tests/run.html`, `run-audio.html`, `run-pannello.html` → tutti `DONE failed=0`.

- [ ] **Step 2: Spec vs pagina**

Controlla ogni criterio della spec `docs/superpowers/specs/2026-09-10-vinile-sintetizzatore-design.md` sulla pagina viva. Non usare il wav come musica.

- [ ] **Step 3: Commit solo se nel Task 3 sono emersi fix**

```bash
git add testsuperpowers
git commit -m "fix(vinile): ritocchi synth dopo verifica browser"
```

Se non ci sono cambi: non creare commit vuoto.

---

## Self-review (copertura spec)

| Requisito spec | Task |
| --- | --- |
| Barra in basso, disco non coperto, mobile più piccolo | 2 |
| 8 pad latch, due ottave MIDI 48–72, luminescenza fioca/forte | 1, 2 |
| Tasti hold, più tasti, coda breve | 1, 2, 3 |
| Pad loop 120 BPM, cassa sui quarti, tempo fisso sotto piega | 1, 3 |
| Disco sporca timbro (effectParams), non la griglia | 3 |
| Click squash anche a vuoto | 3 |
| Testi aiuto + nota audio + WebGL | 2, 3 |
| Silenzio all’apertura, unlock al pointerdown | 3 |
| Senza audio: luci e disco | 3 |
| `fisica.js` invariato, wav non fonte | 3, 4 |
