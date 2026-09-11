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
