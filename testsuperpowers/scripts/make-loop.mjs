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
  const env = 0.85 + 0.15 * Math.sin((2 * Math.PI * t) / seconds);
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
