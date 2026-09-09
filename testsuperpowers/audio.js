import { effectParams } from './audio-params.js';

const nota = document.getElementById('nota-audio');

let ctx;
let running = false;
let distNode;
let filter;
let delayGain;
let glitchGain;

export function isAudioRunning() {
  return running;
}

export async function unlockAudio() {
  if (running) return true;
  try {
    const res = await fetch('audio/laboratorio.wav');
    if (!res.ok) throw new Error('missing');
    const bytes = await res.arrayBuffer();
    const AC = window.AudioContext || window.webkitAudioContext;
    ctx = new AC();
    const buf = await ctx.decodeAudioData(bytes.slice(0));
    const src = ctx.createBufferSource();
    src.buffer = buf;
    src.loop = true;

    const dry = ctx.createGain();
    dry.gain.value = 0.7;
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
