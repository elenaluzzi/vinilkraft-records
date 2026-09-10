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
