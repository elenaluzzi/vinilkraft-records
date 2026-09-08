let time = 0;
const cols = 40;
const rows = 25;
const spacing = 20;
const dots = [];

function setup() {
  createCanvas(windowWidth, windowHeight);
  
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      dots.push({
        baseX: x * spacing - (cols * spacing) / 2,
        baseY: y * spacing - (rows * spacing) / 2,
        x: 0,
        y: 0,
        z: 0
      });
    }
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}

function draw() {
  fill(26, 26, 46, 38);
  noStroke();
  rect(0, 0, width, height);

  time += 0.02;

  const centerX = width / 2;
  const centerY = height / 2;

  for (let i = 0; i < dots.length; i++) {
    const dot = dots[i];
    
    const waveX = sin(time + dot.baseY * 0.03) * 30;
    const waveY = cos(time * 0.7 + dot.baseX * 0.03) * 25;
    const waveZ = sin(time * 1.3 + dot.baseX * 0.02 + dot.baseY * 0.02) * 40;

    const rotateY = sin(time * 0.3) * 0.5;
    const rx = dot.baseX * cos(rotateY) - waveZ * sin(rotateY);
    const rz = dot.baseX * sin(rotateY) + waveZ * cos(rotateY);

    dot.x = centerX + rx + waveX;
    dot.y = centerY + dot.baseY + waveY;
    dot.z = rz;

    const scale = 600 / (600 + dot.z);
    const sz = 3 * scale;
    const alpha = (0.5 + scale * 0.5) * 255;

    fill(255, 140 + scale * 60, 30 + scale * 30, alpha);
    ellipse(dot.x, dot.y, sz, sz);
  }
}
