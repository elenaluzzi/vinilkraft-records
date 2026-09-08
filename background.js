import { animate, createTimer, stagger, utils } from 'animejs';
import * as THREE from 'three';
import { getInstances } from 'animejs/adapters/three';

const [ $container ] = utils.$('.full-container');
const { clientWidth: width, clientHeight: height } = $container;

const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, preserveDrawingBuffer: true });
renderer.setSize(width, height);
renderer.setPixelRatio(window.devicePixelRatio);
$container.appendChild(renderer.domElement);

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(50, width / height, 0.01, 100);
camera.position.set(0, 0, 1.5);
scene.add(camera);

scene.add(new THREE.AmbientLight(0xffffff, 0.35));
const light = new THREE.DirectionalLight(0xffffff, 2);
light.position.set(2, 3, 4);
scene.add(light);

const gridSize = 6; // cubes per axis
const cellSize = 2 / gridSize; // size of each cube
const spread = (gridSize - 1) / 2 * cellSize; // distance from center to the outer cubes
const geometry = new THREE.BoxGeometry(cellSize, cellSize, cellSize);
const material = new THREE.MeshLambertMaterial();
const mesh = new THREE.InstancedMesh(geometry, material, gridSize * gridSize * gridSize);
scene.add(mesh);

const instances = getInstances(mesh);
// Black & white grayscale palette from CSS custom properties
const palette = ['red', 'orange', 'yellow', 'green', 'sky', 'purple', 'pink']
  .map(name => utils.get($container, `--hex-${name}-1`));
const gridAxis = (axis, span = spread) => stagger([-span, span], { grid: [gridSize, gridSize, gridSize], axis });

// Slowly rotate the whole mesh
animate(mesh, {
  rotateY: 360,
  rotateX: 360,
  duration: 24000,
  loop: true,
  ease: 'linear',
});

// Color, scale and spread each instance, staggered from the center
animate(instances, {
  color: palette,
  x: [gridAxis('x', spread * .25), gridAxis('x')],
  y: [gridAxis('y', spread * .25), gridAxis('y')],
  z: [gridAxis('z', spread * .25), gridAxis('z')],
  scale: [.1, .25, .1],
  delay: stagger([0, 3000], { grid: [gridSize, gridSize, gridSize], from: 'center', reversed: true }),
  duration: 2000,
  loopDelay: 500,
  loop: true,
  alternate: true,
  ease: 'inOutQuad',
});

window.addEventListener('resize', () => {
  const { clientWidth: w, clientHeight: h } = $container;
  renderer.setSize(w, h);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
});

createTimer({ onUpdate: () => renderer.render(scene, camera) });