export const NARROW_PX = 700;
export const STORAGE_KEY = 'vinile_rack';
export const PLUGIN_IDS = ['rev', 'eco', 'eq', 'cmp'];

export const PLUGIN_LABELS = {
  rev: 'REV',
  eco: 'ECO',
  eq: 'EQ',
  cmp: 'CMP'
};

export const PLUGIN_TITLES = {
  rev: 'RIVERBERO',
  eco: 'ECO',
  eq: 'EQUALIZZATORE',
  cmp: 'COMPRESSORE'
};

export const PLUGIN_ARIA = {
  rev: 'riverbero',
  eco: 'eco',
  eq: 'equalizzatore',
  cmp: 'compressore'
};

export const CONTROLS = {
  rev: [
    { id: 'livello', group: 'Ingresso', kind: 'fader' },
    { id: 'coda', group: 'Riverbero', kind: 'knob' },
    { id: 'stanza', group: 'Riverbero', kind: 'knob' },
    { id: 'mix', group: 'Mix', kind: 'fader' }
  ],
  eco: [
    { id: 'tempo', group: 'Tempo', kind: 'knob' },
    { id: 'ripetizioni', group: 'Ripetizioni', kind: 'knob' },
    { id: 'mix', group: 'Mix', kind: 'fader' }
  ],
  eq: [
    { id: 'gravi', group: 'Bande', kind: 'fader' },
    { id: 'medi', group: 'Bande', kind: 'fader' },
    { id: 'acuti', group: 'Bande', kind: 'fader' },
    { id: 'presenza', group: 'Timbro', kind: 'knob' },
    { id: 'brillantezza', group: 'Timbro', kind: 'knob' }
  ],
  cmp: [
    { id: 'soglia', group: 'Dinamica', kind: 'knob' },
    { id: 'rapporto', group: 'Dinamica', kind: 'knob' },
    { id: 'attacco', group: 'Dinamica', kind: 'knob' },
    { id: 'mix', group: 'Mix', kind: 'fader' }
  ]
};

export function isNarrowViewport(widthPx) {
  return Number(widthPx) < NARROW_PX;
}

export function clamp01(n) {
  const x = Number(n);
  if (!Number.isFinite(x)) return 0.5;
  if (x < 0) return 0;
  if (x > 1) return 1;
  return x;
}

export function defaultParams() {
  const o = {};
  PLUGIN_IDS.forEach((id) => {
    o[id] = {};
    CONTROLS[id].forEach((c) => {
      o[id][c.id] = 0.5;
    });
  });
  return o;
}

export function parseParams(raw) {
  const base = defaultParams();
  if (raw == null || raw === '') return base;
  let data;
  try {
    data = typeof raw === 'string' ? JSON.parse(raw) : raw;
  } catch (e) {
    return base;
  }
  if (!data || typeof data !== 'object') return base;
  PLUGIN_IDS.forEach((id) => {
    const src = data[id];
    if (!src || typeof src !== 'object') return;
    CONTROLS[id].forEach((c) => {
      if (src[c.id] != null) base[id][c.id] = clamp01(src[c.id]);
    });
  });
  return base;
}

export function loadParams(storage) {
  try {
    const raw = storage && storage.getItem ? storage.getItem(STORAGE_KEY) : null;
    return parseParams(raw);
  } catch (e) {
    return defaultParams();
  }
}

export function saveParams(storage, params) {
  if (!storage || typeof storage.setItem !== 'function') return;
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(params));
  } catch (e) {}
}

export function createRackState(storage) {
  return { open: null, params: loadParams(storage), storage: storage || null };
}

export function togglePlugin(state, id) {
  if (PLUGIN_IDS.indexOf(id) === -1) return state.open;
  state.open = state.open === id ? null : id;
  return state.open;
}

export function closePlugin(state) {
  state.open = null;
  return state.open;
}

export function setParam(state, pluginId, controlId, value) {
  if (!state.params[pluginId] || !Object.prototype.hasOwnProperty.call(state.params[pluginId], controlId)) {
    return 0.5;
  }
  const v = clamp01(value);
  state.params[pluginId][controlId] = v;
  saveParams(state.storage, state.params);
  return v;
}
