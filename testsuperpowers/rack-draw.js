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
    const layers = quiet ? 1 : 2;
    for (let l = 0; l < layers; l++) {
      ctx.beginPath();
      for (let i = 0; i < n; i++) {
        const x = (i / Math.max(n - 1, 1)) * w;
        const mag = Math.abs(src[i]);
        const y = h - mag * h * (quiet ? 0.08 : 0.9) * (1 - l * 0.12);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.lineTo(w, h);
      ctx.lineTo(0, h);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }
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
    if (!quiet) {
      ctx.beginPath();
      for (let g = 0; g < 4; g++) {
        const gx = 6 + g * ((w - 12) / 3);
        ctx.moveTo(gx, h * 0.18);
        ctx.lineTo(gx, h * 0.82);
      }
      ctx.stroke();
    }
    return;
  }
  const passes = quiet ? 1 : 2;
  for (let p = 0; p < passes; p++) {
    ctx.beginPath();
    for (let i = 0; i < n; i++) {
      const x = (i / Math.max(n - 1, 1)) * w;
      const y = h * 0.5 - src[i] * h * (quiet ? 0.05 : 0.42) * (1 - p * 0.15);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }
}
