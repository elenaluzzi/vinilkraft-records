import { effectParams } from './audio-params.js';
import {
  midiHz,
  BPM,
  SIXTEENTHS_PER_BAR,
  PAD_COUNT
} from './pannello.js';
import {
  normalizeTheme,
  voiceOf,
  pitchedHz,
  padKind,
  padShouldHitForTheme,
  padHitRecipe,
  padCarpetRecipe,
  squashKind
} from './tema-suono.js';

const nota = document.getElementById('nota-audio');

let ctx;
let running = false;
let distNode;
let filter;
let delayGain;
let delayNode;
let glitchGain;
let glitchFilter;
let dryGain;
let stutterLfo;
let stutterDepth;
let wowLfo;
let wowDepth;
let master;
let voices = new Map();
let pads = Array(PAD_COUNT).fill(false);
let carpets = new Map();
let noiseBuf;
let nextSixteenth = 0;
let step = 0;
let timer = 0;
let pendingNotes = [];
let pendingClick = false;
let unlocking = null;
let mix;
let recNode;
let recSink;
let capturing = false;
let recChunks = [];
let tapeBuffer = null;
let tapeSource = null;
let onTapeEnded = null;
let pendingCapture = false;
let theme = 'verde';
let lastPitchDrop = 0;
let meter;
let meterBytes;

export function isAudioRunning() {
  return running;
}

export function getMeterFrame() {
  if (!running || !meter || !meterBytes) return new Float32Array(0);
  meter.getByteTimeDomainData(meterBytes);
  const out = new Float32Array(meterBytes.length);
  for (let i = 0; i < meterBytes.length; i++) out[i] = (meterBytes[i] - 128) / 128;
  return out;
}

export function setTapeEndedHandler(fn) {
  onTapeEnded = fn;
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

export function setTheme(id) {
  theme = normalizeTheme(id);
  if (!running) return;
  voices.forEach((v, midi) => applyVoiceSpec(v, midi));
  stopAllCarpets();
  syncCarpets();
}

function applyVoiceSpec(v, midi) {
  const spec = voiceOf(theme);
  v.o.type = spec.type;
  v.o.detune.setTargetAtTime(spec.detune, ctx.currentTime, 0.02);
  v.g.gain.setTargetAtTime(spec.gain, ctx.currentTime, 0.03);
  v.o.frequency.setTargetAtTime(pitchedHz(midiHz(midi), lastPitchDrop), ctx.currentTime, 0.04);
}

function flushPending() {
  const queued = pendingNotes.slice();
  pendingNotes = [];
  queued.forEach((midi) => noteOn(midi));
  if (pendingClick) {
    pendingClick = false;
    triggerSquashClick();
  }
}

export async function unlockAudio() {
  if (running) return true;
  if (unlocking) return unlocking;
  unlocking = (async () => {
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      ctx = new AC();
      master = ctx.createGain();
      master.gain.value = 0.55;
      distNode = ctx.createWaveShaper();
      distNode.curve = makeCurve(0);
      filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 12000;
      const delay = ctx.createDelay(1.0);
      delay.delayTime.value = 0.02;
      delayNode = delay;
      delayGain = ctx.createGain();
      delayGain.gain.value = 0;
      glitchGain = ctx.createGain();
      glitchGain.gain.value = 0;
      glitchFilter = ctx.createBiquadFilter();
      glitchFilter.type = 'bandpass';
      glitchFilter.frequency.value = 1800;
      glitchFilter.Q.value = 9;
      dryGain = ctx.createGain();
      dryGain.gain.value = 1;
      stutterLfo = ctx.createOscillator();
      stutterLfo.type = 'square';
      stutterLfo.frequency.value = 18;
      stutterDepth = ctx.createGain();
      stutterDepth.gain.value = 0;
      mix = ctx.createGain();
      mix.gain.value = 1;
      master.connect(distNode);
      distNode.connect(filter);
      filter.connect(dryGain);
      dryGain.connect(mix);
      filter.connect(delay);
      delay.connect(delayGain);
      delayGain.connect(mix);
      filter.connect(glitchFilter);
      glitchFilter.connect(glitchGain);
      glitchGain.connect(mix);
      stutterLfo.connect(stutterDepth);
      stutterDepth.connect(dryGain.gain);
      stutterLfo.start();
      wowLfo = ctx.createOscillator();
      wowLfo.type = 'sine';
      wowLfo.frequency.value = 0.55;
      wowDepth = ctx.createGain();
      wowDepth.gain.value = 0;
      wowLfo.connect(wowDepth);
      wowDepth.connect(filter.detune);
      wowLfo.start();
      mix.connect(ctx.destination);
      meter = ctx.createAnalyser();
      meter.fftSize = 256;
      meterBytes = new Uint8Array(meter.fftSize);
      mix.connect(meter);
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
      noiseBuf = makeNoise(1);
      await ctx.resume();
      running = true;
      nextSixteenth = ctx.currentTime + 0.05;
      step = 0;
      sched();
      if (nota) nota.hidden = true;
      flushPending();
      syncCarpets();
      if (pendingCapture) startTapeCapture();
      return true;
    } catch (e) {
      running = false;
      if (nota) nota.hidden = false;
      return false;
    } finally {
      unlocking = null;
    }
  })();
  return unlocking;
}

function sched() {
  if (!running) return;
  const dur = 60 / BPM / 4;
  const horizon = ctx.currentTime + 0.12;
  while (nextSixteenth < horizon) {
    for (let i = 0; i < PAD_COUNT; i++) {
      if (pads[i] && padKind(theme, i) !== 'carpet' && padShouldHitForTheme(theme, i, step)) {
        hitPad(i, nextSixteenth, step);
      }
    }
    if (step % SIXTEENTHS_PER_BAR === 0) pulseCarpets(nextSixteenth);
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

function hitPad(i, t, step) {
  if (theme === 'verde') {
    hitPadVerde(i, t);
    return;
  }
  const rec = padHitRecipe(theme, i, step);
  if (!rec) return;
  playHit(rec, t);
}

function playHit(rec, t) {
  if (rec.wave === 'sine' || rec.wave === 'triangle' || rec.wave === 'sawtooth') {
    const o = ctx.createOscillator();
    o.type = rec.wave;
    const hz = pitchedHz(rec.freq, lastPitchDrop);
    o.frequency.setValueAtTime(hz, t);
    if (rec.freqEnd) o.frequency.exponentialRampToValueAtTime(pitchedHz(rec.freqEnd, lastPitchDrop), t + (rec.stop || 0.2));
    o.connect(envGain(t, rec.peak, rec.attack, rec.decay));
    o.start(t);
    o.stop(t + rec.stop);
    return;
  }
  const src = ctx.createBufferSource();
  src.buffer = noiseBuf;
  const bp = ctx.createBiquadFilter();
  bp.type = rec.filter;
  bp.frequency.value = rec.filterHz;
  if (rec.q) bp.Q.value = rec.q;
  src.connect(bp);
  bp.connect(envGain(t, rec.peak, rec.attack, rec.decay));
  src.start(t);
  src.stop(t + rec.stop);
  if (rec.clap) {
    const src2 = ctx.createBufferSource();
    src2.buffer = noiseBuf;
    const bp2 = ctx.createBiquadFilter();
    bp2.type = rec.filter;
    bp2.frequency.value = rec.filterHz;
    src2.connect(bp2);
    bp2.connect(envGain(t + 0.04, rec.peak * 0.8, rec.attack, rec.decay * 0.85));
    src2.start(t + 0.04);
    src2.stop(t + rec.stop);
  }
}

function hitPadVerde(i, t) {
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

function startCarpet(i) {
  const rec = padCarpetRecipe(theme, i);
  if (!rec || carpets.has(i)) return;
  const t = ctx.currentTime;
  const nodes = [];
  if (rec.noise) {
    const src = ctx.createBufferSource();
    src.buffer = noiseBuf;
    src.loop = true;
    const bp = ctx.createBiquadFilter();
    bp.type = rec.filter;
    bp.frequency.value = rec.filterHz;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(rec.peak, t + rec.attack);
    src.connect(bp);
    bp.connect(g);
    connectVoice(g);
    src.start(t);
    nodes.push({ o: src, g, hz: rec.filterHz, noise: true });
  } else {
    (rec.freqs || []).forEach((hz) => {
      const o = ctx.createOscillator();
      o.type = rec.type;
      o.frequency.value = pitchedHz(hz, lastPitchDrop);
      const g = ctx.createGain();
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(rec.peak, t + rec.attack);
      o.connect(g);
      connectVoice(g);
      o.start();
      nodes.push({ o, g, hz, noise: false });
    });
  }
  carpets.set(i, { nodes, rec });
}

function stopCarpet(i) {
  const c = carpets.get(i);
  if (!c) return;
  const t = ctx.currentTime;
  c.nodes.forEach((n) => {
    n.g.gain.cancelScheduledValues(t);
    n.g.gain.setValueAtTime(Math.max(0.0008, n.g.gain.value), t);
    n.g.gain.exponentialRampToValueAtTime(0.0008, t + 0.25);
    try { n.o.stop(t + 0.28); } catch (e) {}
  });
  carpets.delete(i);
}

function stopAllCarpets() {
  Array.from(carpets.keys()).forEach(stopCarpet);
}

function syncCarpets() {
  if (!running) return;
  for (let i = 0; i < PAD_COUNT; i++) {
    const want = pads[i] && padKind(theme, i) === 'carpet';
    if (want && !carpets.has(i)) startCarpet(i);
    if (!want && carpets.has(i)) stopCarpet(i);
  }
}

function pulseCarpets(t) {
  carpets.forEach((c) => {
    if (!c.rec.breathe) return;
    c.nodes.forEach((n) => {
      n.g.gain.cancelScheduledValues(t);
      n.g.gain.setValueAtTime(c.rec.peak, t);
      n.g.gain.linearRampToValueAtTime(c.rec.peak * 1.18, t + 0.06);
      n.g.gain.linearRampToValueAtTime(c.rec.peak, t + 0.22);
    });
  });
}

function applyCarpetPitch() {
  carpets.forEach((c) => {
    c.nodes.forEach((n) => {
      if (n.noise || !n.o.frequency) return;
      n.o.frequency.setTargetAtTime(pitchedHz(n.hz, lastPitchDrop), ctx.currentTime, 0.05);
    });
  });
}

export function noteOn(midi) {
  if (!running) {
    if (pendingNotes.indexOf(midi) === -1) pendingNotes.push(midi);
    return;
  }
  if (voices.has(midi)) return;
  const spec = voiceOf(theme);
  const o = ctx.createOscillator();
  o.type = spec.type;
  o.detune.value = spec.detune;
  o.frequency.value = pitchedHz(midiHz(midi), lastPitchDrop);
  const g = ctx.createGain();
  g.gain.setValueAtTime(0, ctx.currentTime);
  g.gain.linearRampToValueAtTime(spec.gain, ctx.currentTime + spec.attack);
  o.connect(g);
  connectVoice(g);
  o.start();
  voices.set(midi, { o, g });
}

export function noteOff(midi) {
  pendingNotes = pendingNotes.filter((m) => m !== midi);
  if (!running) return;
  const v = voices.get(midi);
  if (!v) return;
  const spec = voiceOf(theme);
  const t = ctx.currentTime;
  v.g.gain.cancelScheduledValues(t);
  v.g.gain.setValueAtTime(Math.max(0.0008, v.g.gain.value), t);
  v.g.gain.exponentialRampToValueAtTime(0.0008, t + spec.release);
  v.o.stop(t + spec.release + 0.02);
  voices.delete(midi);
}

export function setPads(next) {
  pads = next.slice(0, PAD_COUNT);
  syncCarpets();
}

export function setAudioDeform(piega, schiaccia) {
  if (!running) return;
  const p = effectParams(piega, schiaccia, theme);
  distNode.curve = makeCurve(p.distortion);
  filter.frequency.setTargetAtTime(Math.max(280, p.filterHz), ctx.currentTime, 0.02);
  delayGain.gain.setTargetAtTime(p.delay, ctx.currentTime, 0.03);
  delayNode.delayTime.setTargetAtTime(p.delayTime, ctx.currentTime, 0.015);
  glitchGain.gain.setTargetAtTime(p.glitchGain * 0.22, ctx.currentTime, 0.015);
  glitchFilter.frequency.setTargetAtTime(400 + p.glitchGain * 5200, ctx.currentTime, 0.02);
  dryGain.gain.setTargetAtTime(Math.max(0.05, p.dry - p.stutter), ctx.currentTime, 0.02);
  stutterDepth.gain.setTargetAtTime(p.stutter, ctx.currentTime, 0.02);
  stutterLfo.frequency.setTargetAtTime(14 + p.stutter * 36, ctx.currentTime, 0.04);
  if (wowDepth) wowDepth.gain.setTargetAtTime(p.wow * 48, ctx.currentTime, 0.05);
  lastPitchDrop = p.pitchDrop;
  voices.forEach((v, midi) => {
    v.o.frequency.setTargetAtTime(pitchedHz(midiHz(midi), lastPitchDrop), ctx.currentTime, 0.05);
  });
  applyCarpetPitch();
}

export function triggerSquashClick() {
  if (!running) {
    pendingClick = true;
    return;
  }
  const t = ctx.currentTime;
  const kind = squashKind(theme);
  if (kind === 'soft') {
    const src = ctx.createBufferSource();
    src.buffer = noiseBuf;
    const hp = ctx.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.value = 900;
    src.connect(hp);
    hp.connect(envGain(t, 0.2, 0.002, 0.08));
    src.start(t);
    src.stop(t + 0.1);
    return;
  }
  if (kind === 'echo') {
    [0, 0.12, 0.24].forEach((off, n) => {
      const src = ctx.createBufferSource();
      src.buffer = noiseBuf;
      const bp = ctx.createBiquadFilter();
      bp.type = 'bandpass';
      bp.frequency.value = 700;
      src.connect(bp);
      bp.connect(envGain(t + off, 0.28 * (1 - n * 0.38), 0.002, 0.12));
      src.start(t + off);
      src.stop(t + off + 0.16);
    });
    return;
  }
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
  if (!running) {
    pendingCapture = true;
    return;
  }
  pendingCapture = false;
  stopTapeSource();
  capturing = true;
  recChunks = [];
  tapeBuffer = null;
}

export function stopTapeCaptureAndPlay() {
  pendingCapture = false;
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
  pendingCapture = false;
  capturing = false;
  recChunks = [];
  tapeBuffer = null;
  stopTapeSource();
}
