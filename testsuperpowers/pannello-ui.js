import {
  LOW_MIDI,
  HIGH_MIDI,
  PAD_COUNT,
  FILTER_COUNT,
  createPanelState,
  pressKey,
  releaseKey,
  togglePad,
  isBlackKey
} from './pannello.js';
import {
  createTapeState,
  isRecLampOn,
  tapRec,
  tapNewTake
} from './nastro.js';
import {
  PLUGIN_IDS,
  PLUGIN_LABELS,
  PLUGIN_ARIA,
  isNarrowViewport
} from './rack.js';

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
    syncRecLamp();
  }

  function setPluginOpen(id) {
    filtroEls.forEach((el) => {
      el.classList.toggle('acceso', el.dataset.plugin === id);
    });
  }

  return { state, tape, syncLights, setPluginOpen };
}
