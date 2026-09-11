export const FLOOR_Y = -0.32;
export const GRID_STEP = 0.28;
export const LINE_HALF = 0.006;
export const FADE_START = 5.5;
export const FADE_END = 13;

export function gridLine(x, z) {
  const dx = Math.abs(x - Math.round(x / GRID_STEP) * GRID_STEP);
  const dz = Math.abs(z - Math.round(z / GRID_STEP) * GRID_STEP);
  const d = Math.min(dx, dz);
  if (d > LINE_HALF) return 0;
  return 1 - d / LINE_HALF;
}

export function gridFade(x, z) {
  const r = Math.hypot(x, z);
  if (r <= FADE_START) return 1;
  if (r >= FADE_END) return 0;
  return 1 - (r - FADE_START) / (FADE_END - FADE_START);
}

export function creaPavimento(THREE) {
  const geo = new THREE.PlaneGeometry(28, 28);
  const mat = new THREE.ShaderMaterial({
    depthWrite: true,
    extensions: { derivatives: true },
    vertexShader: `
      varying vec3 vWorld;
      void main() {
        vec4 w = modelMatrix * vec4(position, 1.0);
        vWorld = w.xyz;
        gl_Position = projectionMatrix * viewMatrix * w;
      }
    `,
    fragmentShader: `
      varying vec3 vWorld;
      const float STEP = ${GRID_STEP.toFixed(4)};
      const float HALF = ${LINE_HALF.toFixed(4)};
      const float FADE0 = ${FADE_START.toFixed(4)};
      const float FADE1 = ${FADE_END.toFixed(4)};
      void main() {
        float dx = abs(vWorld.x - floor(vWorld.x / STEP + 0.5) * STEP);
        float dz = abs(vWorld.z - floor(vWorld.z / STEP + 0.5) * STEP);
        float vert = dx > HALF ? 0.0 : 1.0 - dx / HALF;
        float orizSottile = dz > HALF ? 0.0 : 1.0 - dz / HALF;
        float pixZ = fwidth(vWorld.z);
        float orizLontana = 1.0 - smoothstep(0.0, pixZ, dz);
        float line = max(vert, max(orizSottile, orizLontana));
        float r = length(vWorld.xz);
        float fade = r <= FADE0 ? 1.0 : (r >= FADE1 ? 0.0 : 1.0 - (r - FADE0) / (FADE1 - FADE0));
        vec3 col = mix(vec3(0.0), vec3(0.32), line);
        gl_FragColor = vec4(mix(vec3(0.02, 0.02, 0.025), col, fade), 1.0);
      }
    `
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.y = FLOOR_Y;
  mesh.frustumCulled = false;
  return mesh;
}
