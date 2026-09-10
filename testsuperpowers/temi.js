export const THEME_IDS = ['verde', 'violetto', 'giallo'];
export const DEFAULT_THEME = 'verde';

const THEMES = {
  verde: {
    id: 'verde',
    label: 'verde acido',
    swatch: '#3dff4a',
    keyRgb: '61, 255, 74',
    page: '#050705',
    clear: 0x050705,
    base: [0.08, 0.95, 0.18],
    hot: [0.55, 1.0, 0.05],
    accent: [0.0, 0.85, 0.75],
    labelCol: [0.15, 1.0, 0.35],
    fresnel: [0.3, 1.0, 0.45]
  },
  violetto: {
    id: 'violetto',
    label: 'violetto',
    swatch: '#b44cff',
    keyRgb: '180, 76, 255',
    page: '#070510',
    clear: 0x070510,
    base: [0.42, 0.08, 0.92],
    hot: [0.88, 0.38, 1.0],
    accent: [0.45, 0.28, 0.95],
    labelCol: [0.72, 0.45, 1.0],
    fresnel: [0.75, 0.4, 1.0]
  },
  giallo: {
    id: 'giallo',
    label: 'giallo',
    swatch: '#ffe14a',
    keyRgb: '255, 225, 74',
    page: '#0a0904',
    clear: 0x0a0904,
    base: [0.95, 0.86, 0.08],
    hot: [1.0, 0.62, 0.05],
    accent: [1.0, 0.78, 0.2],
    labelCol: [1.0, 0.94, 0.35],
    fresnel: [1.0, 0.85, 0.2]
  }
};

export function themeOf(id) {
  return THEMES[id] || THEMES[DEFAULT_THEME];
}
