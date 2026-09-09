# Pong Clone Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create a fully functional, retro-styled Pong clone (`pong.html`, `pong.css`, `pong.js`) with 2-player local keyboard controls, score tracking, pause, victory screen, and CRT visual effects.

**Architecture:** Vanilla HTML5 Canvas 2D for rendering, CSS overlays for UI screens (menu/pause/victory), and a game state machine (MENU → PLAYING → PAUSED → GAME_OVER) driven by `requestAnimationFrame`. All code is vanilla JS/CSS with no external libraries.

**Tech Stack:** HTML5 Canvas 2D API, CSS3 (animations, pseudo-elements for scanlines), Google Fonts (`Press Start 2P`), Vanilla JavaScript (ES6+).

**Spec:** `docs/superpowers/specs/2026-09-09-pong-clone-design.md`

## Global Constraints

- No build system; files are opened directly in a browser.
- No backend or `localStorage` persistence for scores.
- No external JavaScript libraries (no npm, no bundler).
- `pong.html` must be a standalone page but include a link back to the main site (`index.html`).
- Canvas logical size is 800x600; it must scale responsively while maintaining aspect ratio.
- Font: `Press Start 2P` from Google Fonts; fallback to `Courier New` / `monospace`.
- Color palette: black background `#000000`, white elements `#FFFFFF`, green glow `#00FF00` for title text.
- Target score to win: 10 points.
- Controls: Player 1 (`W`/`S`), Player 2 (`ArrowUp`/`ArrowDown`), Pause (`P` or `Space`).

---

## Task 1: Scaffold HTML Structure

**Files:**
- Create: `pong.html`
- Modify: None
- Test: Open `pong.html` in browser and verify structure renders.

**Interfaces:**
- Consumes: None.
- Produces: A valid HTML page with a `<canvas id="gameCanvas">`, UI overlay `<div>`s for menu, pause, and victory, and links to `pong.css` and `pong.js`.

- [ ] **Step 1: Create `pong.html` with basic structure**

```html
<!DOCTYPE html>
<html lang="it">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Pong - Vinilkraft</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="pong.css">
</head>
<body>
    <div class="game-container">
        <div class="crt-overlay">
            <div class="scanlines"></div>
            <div class="vignette"></div>
        </div>

        <canvas id="gameCanvas" width="800" height="600"></canvas>

        <!-- Menu Overlay -->
        <div id="menuOverlay" class="overlay active">
            <h1 class="game-title">PONG</h1>
            <button id="startBtn" class="retro-btn">INIZIA PARTITA</button>
            <div class="instructions">
                <p>Giocatore 1: W / S</p>
                <p>Giocatore 2: &#8593; / &#8595;</p>
                <p>Pausa: P</p>
            </div>
            <a href="index.html" class="back-link">&#8592; Torna al sito</a>
        </div>

        <!-- Pause Overlay -->
        <div id="pauseOverlay" class="overlay">
            <h2 class="pause-title">PAUSA</h2>
            <p>Premi P per riprendere</p>
        </div>

        <!-- Victory Overlay -->
        <div id="victoryOverlay" class="overlay">
            <h2 id="victoryText" class="victory-title">GIOCATORE 1 VINCE!</h2>
            <p id="finalScore" class="final-score">0 - 0</p>
            <button id="restartBtn" class="retro-btn">RIGIOCA</button>
        </div>
    </div>

    <script src="pong.js"></script>
</body>
</html>
```

- [ ] **Step 2: Open in browser to verify**

Open `pong.html` in a browser. You should see a black page with a canvas area and the text "PONG", "INIZIA PARTITA", and control instructions visible (unstyled is fine for now).

- [ ] **Step 3: Commit**

```bash
git add pong.html
git commit -m "feat(pong): scaffold pong.html structure with canvas and overlays"
```

---

## Task 2: Retro Styling and CRT Effects

**Files:**
- Create: `pong.css`
- Modify: None
- Test: Open `pong.html` in browser and verify retro styling.

**Interfaces:**
- Consumes: HTML structure from Task 1 (IDs and classes used).
- Produces: Complete retro arcade styling with scanlines, glow, and responsive canvas scaling.

- [ ] **Step 1: Write `pong.css` with base and CRT styles**

```css
/* === Base & Reset === */
*, *::before, *::after {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

body {
    background-color: #111111;
    color: #ffffff;
    font-family: 'Press Start 2P', 'Courier New', monospace;
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 100vh;
    overflow: hidden;
}

/* === Game Container === */
.game-container {
    position: relative;
    width: 100%;
    max-width: 900px;
    aspect-ratio: 4 / 3;
    display: flex;
    justify-content: center;
    align-items: center;
}

/* === Canvas === */
#gameCanvas {
    background-color: #000000;
    border: 4px solid #333333;
    width: 100%;
    height: 100%;
    image-rendering: pixelated;
    image-rendering: crisp-edges;
    display: block;
}

/* === CRT Overlays === */
.crt-overlay {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
    z-index: 10;
}

/* Scanlines */
.scanlines {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: repeating-linear-gradient(
        0deg,
        rgba(255, 255, 255, 0.03) 0px,
        rgba(255, 255, 255, 0.03) 2px,
        transparent 2px,
        transparent 4px
    );
}

/* Vignette */
.vignette {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: radial-gradient(
        circle,
        transparent 60%,
        rgba(0, 0, 0, 0.6) 100%
    );
}

/* === Overlays (Menu, Pause, Victory) === */
.overlay {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    display: none;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    background-color: rgba(0, 0, 0, 0.85);
    z-index: 20;
    text-align: center;
    padding: 20px;
}

.overlay.active {
    display: flex;
}

/* === Typography & Glow === */
.game-title {
    font-size: clamp(2rem, 8vw, 4rem);
    color: #ffffff;
    text-shadow:
        0 0 10px #00ff00,
        0 0 20px #00ff00,
        0 0 40px #00ff00;
    margin-bottom: 40px;
    letter-spacing: 4px;
}

.pause-title {
    font-size: clamp(1.5rem, 6vw, 3rem);
    color: #ffffff;
    text-shadow:
        0 0 10px #ffffff,
        0 0 20px #ffffff;
    animation: blink 1s infinite;
    margin-bottom: 20px;
}

.victory-title {
    font-size: clamp(1.2rem, 5vw, 2.5rem);
    color: #ffffff;
    text-shadow:
        0 0 10px #ffaa00,
        0 0 20px #ffaa00;
    margin-bottom: 20px;
    line-height: 1.4;
}

.final-score {
    font-size: clamp(1rem, 4vw, 1.5rem);
    color: #cccccc;
    margin-bottom: 30px;
}

.instructions {
    margin-top: 30px;
    font-size: clamp(0.6rem, 2vw, 0.8rem);
    color: #aaaaaa;
    line-height: 2;
}

.back-link {
    margin-top: 30px;
    font-size: clamp(0.6rem, 2vw, 0.8rem);
    color: #888888;
    text-decoration: none;
    transition: color 0.2s;
}

.back-link:hover {
    color: #ffffff;
}

/* === Retro Button === */
.retro-btn {
    font-family: 'Press Start 2P', 'Courier New', monospace;
    font-size: clamp(0.7rem, 2.5vw, 1rem);
    background-color: transparent;
    color: #ffffff;
    border: 4px solid #ffffff;
    padding: 15px 30px;
    cursor: pointer;
    text-transform: uppercase;
    transition: all 0.2s;
    box-shadow: 4px 4px 0px #333333;
}

.retro-btn:hover {
    background-color: #ffffff;
    color: #000000;
    box-shadow: 6px 6px 0px #555555;
    transform: translate(-2px, -2px);
}

.retro-btn:active {
    transform: translate(2px, 2px);
    box-shadow: 2px 2px 0px #333333;
}

/* === Animations === */
@keyframes blink {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.3; }
}
```

- [ ] **Step 2: Verify in browser**

Open `pong.html`. You should see:
- A black canvas with a thick border.
- The "PONG" title glowing green.
- The "INIZIA PARTITA" button with a retro border and shadow.
- Scanlines visible over the canvas.
- A vignette darkening the edges.

- [ ] **Step 3: Commit**

```bash
git add pong.css
git commit -m "feat(pong): add retro CRT styling, scanlines, glow, and responsive layout"
```

---

## Task 3: Core Game Engine - Setup & Rendering Loop

**Files:**
- Create: `pong.js`
- Modify: None
- Test: Open `pong.html` and verify canvas drawing works.

**Interfaces:**
- Consumes: `gameCanvas` from HTML, `pong.css` classes.
- Produces: `pong.js` with a working `requestAnimationFrame` loop that clears the canvas and draws the initial static elements (field, paddles, ball).

- [ ] **Step 1: Create `pong.js` with game constants, state, and rendering loop**

```javascript
// === Constants ===
const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;
const PADDLE_WIDTH = 15;
const PADDLE_HEIGHT = 80;
const PADDLE_SPEED = 7;
const BALL_SIZE = 12;
const BALL_INITIAL_SPEED = 5;
const BALL_SPEED_INCREMENT = 1.02;
const BALL_MAX_SPEED_MULT = 1.5;
const WINNING_SCORE = 10;

// === Game State ===
const STATE = {
    MENU: 'MENU',
    PLAYING: 'PLAYING',
    PAUSED: 'PAUSED',
    GAME_OVER: 'GAME_OVER'
};

let currentState = STATE.MENU;
let animationFrameId = null;

// === Canvas Setup ===
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// === Game Objects ===
const paddle1 = { x: 20, y: CANVAS_HEIGHT / 2 - PADDLE_HEIGHT / 2, width: PADDLE_WIDTH, height: PADDLE_HEIGHT, score: 0 };
const paddle2 = { x: CANVAS_WIDTH - 20 - PADDLE_WIDTH, y: CANVAS_HEIGHT / 2 - PADDLE_HEIGHT / 2, width: PADDLE_WIDTH, height: PADDLE_HEIGHT, score: 0 };
const ball = { x: CANVAS_WIDTH / 2, y: CANVAS_HEIGHT / 2, size: BALL_SIZE, speed: BALL_INITIAL_SPEED, dx: 0, dy: 0 };

// === Input Tracking ===
const keys = {};

// === Drawing Functions ===
function drawField() {
    // Background
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Center dashed line
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.setLineDash([15, 10]);
    ctx.beginPath();
    ctx.moveTo(CANVAS_WIDTH / 2, 0);
    ctx.lineTo(CANVAS_WIDTH / 2, CANVAS_HEIGHT);
    ctx.stroke();
    ctx.setLineDash([]);
}

function drawPaddle(paddle) {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(paddle.x, paddle.y, paddle.width, paddle.height);
    // Glow effect
    ctx.shadowColor = '#ffffff';
    ctx.shadowBlur = 10;
    ctx.fillRect(paddle.x, paddle.y, paddle.width, paddle.height);
    ctx.shadowBlur = 0;
}

function drawBall() {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(ball.x - ball.size / 2, ball.y - ball.size / 2, ball.size, ball.size);
    // Glow effect
    ctx.shadowColor = '#ffffff';
    ctx.shadowBlur = 15;
    ctx.fillRect(ball.x - ball.size / 2, ball.y - ball.size / 2, ball.size, ball.size);
    ctx.shadowBlur = 0;
}

function drawScore() {
    ctx.font = '48px "Press Start 2P", monospace';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.fillText(paddle1.score.toString(), CANVAS_WIDTH / 4, 60);
    ctx.fillText(paddle2.score.toString(), (CANVAS_WIDTH / 4) * 3, 60);
    ctx.textAlign = 'left'; // Reset
}

// === Game Loop ===
function gameLoop() {
    // Clear with trail effect (semi-transparent black)
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Draw static elements
    drawField();

    // Draw paddles and ball
    drawPaddle(paddle1);
    drawPaddle(paddle2);
    drawBall();
    drawScore();

    animationFrameId = requestAnimationFrame(gameLoop);
}

// Start loop immediately for visual feedback (ball won't move yet)
function init() {
    animationFrameId = requestAnimationFrame(gameLoop);
}

init();
```

- [ ] **Step 2: Verify in browser**

Open `pong.html`. You should see:
- The canvas drawing a black field.
- A white dashed line down the center.
- Two white paddles on the left and right.
- A white square ball in the center.
- The score "0" and "0" at the top.
- A trailing effect on the ball because the canvas is only partially cleared each frame.

- [ ] **Step 3: Commit**

```bash
git add pong.js
git commit -m "feat(pong): add core canvas rendering loop, field, paddles, ball, and trail effect"
```

---

## Task 4: Physics, Movement, and Collisions

**Files:**
- Modify: `pong.js`
- Test: Open `pong.html`, start game, and verify paddles and ball move/collide correctly.

**Interfaces:**
- Consumes: `STATE`, `paddle1`, `paddle2`, `ball`, `keys`, `gameLoop` from Task 3.
- Produces: Updated `pong.js` with movement, collision, and scoring logic.

- [ ] **Step 1: Add movement and collision functions to `pong.js`**

Add the following functions to `pong.js`, placing them before `gameLoop`:

```javascript
// === Utility ===
function randomDirection() {
    const angle = (Math.random() * Math.PI / 4) - (Math.PI / 8); // ±22.5 degrees
    const direction = Math.random() > 0.5 ? 1 : -1;
    return { dx: direction * Math.cos(angle), dy: Math.sin(angle) };
}

function resetBall() {
    ball.x = CANVAS_WIDTH / 2;
    ball.y = CANVAS_HEIGHT / 2;
    ball.speed = BALL_INITIAL_SPEED;
    const dir = randomDirection();
    ball.dx = dir.dx * ball.speed;
    ball.dy = dir.dy * ball.speed;
}

// === Movement ===
function updatePaddles() {
    // Player 1 (W / S)
    if (keys['KeyW'] || keys['ArrowUp'] && currentState === STATE.PLAYING) {
        // Wait, ArrowUp is for Player 2. Let's fix input mapping below.
    }
}
```

Replace the entire content of `pong.js` with the complete version below:

```javascript
// === Constants ===
const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;
const PADDLE_WIDTH = 15;
const PADDLE_HEIGHT = 80;
const PADDLE_SPEED = 7;
const BALL_SIZE = 12;
const BALL_INITIAL_SPEED = 5;
const BALL_SPEED_INCREMENT = 1.02;
const BALL_MAX_SPEED_MULT = 1.5;
const WINNING_SCORE = 10;

// === Game State ===
const STATE = {
    MENU: 'MENU',
    PLAYING: 'PLAYING',
    PAUSED: 'PAUSED',
    GAME_OVER: 'GAME_OVER'
};

let currentState = STATE.MENU;
let animationFrameId = null;
let shakeFrames = 0;

// === Canvas Setup ===
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// === Game Objects ===
const paddle1 = { x: 20, y: CANVAS_HEIGHT / 2 - PADDLE_HEIGHT / 2, width: PADDLE_WIDTH, height: PADDLE_HEIGHT, score: 0 };
const paddle2 = { x: CANVAS_WIDTH - 20 - PADDLE_WIDTH, y: CANVAS_HEIGHT / 2 - PADDLE_HEIGHT / 2, width: PADDLE_WIDTH, height: PADDLE_HEIGHT, score: 0 };
const ball = { x: CANVAS_WIDTH / 2, y: CANVAS_HEIGHT / 2, size: BALL_SIZE, speed: BALL_INITIAL_SPEED, dx: 0, dy: 0 };

// === Input Tracking ===
const keys = {};

// === Utility ===
function randomDirection() {
    const angle = (Math.random() * Math.PI / 4) - (Math.PI / 8); // ±22.5 degrees
    const direction = Math.random() > 0.5 ? 1 : -1;
    return { dx: direction * Math.cos(angle), dy: Math.sin(angle) };
}

function resetBall() {
    ball.x = CANVAS_WIDTH / 2;
    ball.y = CANVAS_HEIGHT / 2;
    ball.speed = BALL_INITIAL_SPEED;
    const dir = randomDirection();
    ball.dx = dir.dx * ball.speed;
    ball.dy = dir.dy * ball.speed;
}

// === Drawing Functions ===
function drawField() {
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.setLineDash([15, 10]);
    ctx.beginPath();
    ctx.moveTo(CANVAS_WIDTH / 2, 0);
    ctx.lineTo(CANVAS_WIDTH / 2, CANVAS_HEIGHT);
    ctx.stroke();
    ctx.setLineDash([]);
}

function drawPaddle(paddle) {
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = '#ffffff';
    ctx.shadowBlur = 10;
    ctx.fillRect(paddle.x, paddle.y, paddle.width, paddle.height);
    ctx.shadowBlur = 0;
}

function drawBall() {
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = '#ffffff';
    ctx.shadowBlur = 15;
    ctx.fillRect(ball.x - ball.size / 2, ball.y - ball.size / 2, ball.size, ball.size);
    ctx.shadowBlur = 0;
}

function drawScore() {
    ctx.font = '48px "Press Start 2P", monospace';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.fillText(paddle1.score.toString(), CANVAS_WIDTH / 4, 60);
    ctx.fillText(paddle2.score.toString(), (CANVAS_WIDTH / 4) * 3, 60);
    ctx.textAlign = 'left';
}

// === Update Logic ===
function updatePaddles() {
    // Player 1 (W / S)
    if (keys['KeyW']) {
        paddle1.y -= PADDLE_SPEED;
    }
    if (keys['KeyS']) {
        paddle1.y += PADDLE_SPEED;
    }

    // Player 2 (ArrowUp / ArrowDown)
    if (keys['ArrowUp']) {
        paddle2.y -= PADDLE_SPEED;
    }
    if (keys['ArrowDown']) {
        paddle2.y += PADDLE_SPEED;
    }

    // Clamp paddles to canvas
    paddle1.y = Math.max(0, Math.min(CANVAS_HEIGHT - PADDLE_HEIGHT, paddle1.y));
    paddle2.y = Math.max(0, Math.min(CANVAS_HEIGHT - PADDLE_HEIGHT, paddle2.y));
}

function updateBall() {
    ball.x += ball.dx;
    ball.y += ball.dy;

    // Bounce off top and bottom walls
    if (ball.y - ball.size / 2 <= 0 || ball.y + ball.size / 2 >= CANVAS_HEIGHT) {
        ball.dy = -ball.dy;
    }

    // Check paddle collisions
    // Paddle 1 (left)
    if (
        ball.x - ball.size / 2 <= paddle1.x + paddle1.width &&
        ball.y >= paddle1.y &&
        ball.y <= paddle1.y + paddle1.height &&
        ball.dx < 0
    ) {
        handlePaddleBounce(paddle1);
    }

    // Paddle 2 (right)
    if (
        ball.x + ball.size / 2 >= paddle2.x &&
        ball.y >= paddle2.y &&
        ball.y <= paddle2.y + paddle2.height &&
        ball.dx > 0
    ) {
        handlePaddleBounce(paddle2);
    }

    // Score checks
    if (ball.x < 0) {
        paddle2.score++;
        triggerShake();
        checkWin();
        resetBall();
    } else if (ball.x > CANVAS_WIDTH) {
        paddle1.score++;
        triggerShake();
        checkWin();
        resetBall();
    }
}

function handlePaddleBounce(paddle) {
    const relativeIntersectY = (paddle.y + (paddle.height / 2)) - ball.y;
    const normalizedRelativeIntersectionY = relativeIntersectY / (paddle.height / 2);
    const bounceAngle = normalizedRelativeIntersectionY * (Math.PI / 4); // Max 45 degrees

    ball.dx = (ball.dx > 0 ? -1 : 1) * Math.cos(bounceAngle) * ball.speed;
    ball.dy = -Math.sin(bounceAngle) * ball.speed;

    // Increase speed
    ball.speed = Math.min(ball.speed * BALL_SPEED_INCREMENT, BALL_INITIAL_SPEED * BALL_MAX_SPEED_MULT);
}

function triggerShake() {
    shakeFrames = 10;
}

function checkWin() {
    if (paddle1.score >= WINNING_SCORE || paddle2.score >= WINNING_SCORE) {
        currentState = STATE.GAME_OVER;
        showVictoryScreen();
    }
}

// === Game Loop ===
function gameLoop() {
    if (currentState === STATE.PLAYING) {
        updatePaddles();
        updateBall();
    }

    // Clear with trail effect
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Apply shake
    ctx.save();
    if (shakeFrames > 0) {
        const dx = (Math.random() - 0.5) * 10;
        const dy = (Math.random() - 0.5) * 10;
        ctx.translate(dx, dy);
        shakeFrames--;
    }

    drawField();
    drawPaddle(paddle1);
    drawPaddle(paddle2);
    drawBall();
    drawScore();

    ctx.restore();

    animationFrameId = requestAnimationFrame(gameLoop);
}

// === Event Listeners ===
window.addEventListener('keydown', (e) => {
    keys[e.code] = true;

    if (e.code === 'KeyP' || e.code === 'Space') {
        togglePause();
    }
});

window.addEventListener('keyup', (e) => {
    keys[e.code] = false;
});

// Prevent scrolling with arrow keys
window.addEventListener('keydown', (e) => {
    if (['ArrowUp', 'ArrowDown', 'Space'].includes(e.code)) {
        e.preventDefault();
    }
});

// === State Management ===
const menuOverlay = document.getElementById('menuOverlay');
const pauseOverlay = document.getElementById('pauseOverlay');
const victoryOverlay = document.getElementById('victoryOverlay');

function hideAllOverlays() {
    menuOverlay.classList.remove('active');
    pauseOverlay.classList.remove('active');
    victoryOverlay.classList.remove('active');
}

function showVictoryScreen() {
    const winner = paddle1.score >= WINNING_SCORE ? 'GIOCATORE 1' : 'GIOCATORE 2';
    document.getElementById('victoryText').textContent = `${winner} VINCE!`;
    document.getElementById('finalScore').textContent = `${paddle1.score} - ${paddle2.score}`;
    victoryOverlay.classList.add('active');
}

function startGame() {
    paddle1.score = 0;
    paddle2.score = 0;
    paddle1.y = CANVAS_HEIGHT / 2 - PADDLE_HEIGHT / 2;
    paddle2.y = CANVAS_HEIGHT / 2 - PADDLE_HEIGHT / 2;
    hideAllOverlays();
    currentState = STATE.PLAYING;
    resetBall();
}

function togglePause() {
    if (currentState === STATE.PLAYING) {
        currentState = STATE.PAUSED;
        pauseOverlay.classList.add('active');
    } else if (currentState === STATE.PAUSED) {
        currentState = STATE.PLAYING;
        pauseOverlay.classList.remove('active');
    }
}

function returnToMenu() {
    currentState = STATE.MENU;
    hideAllOverlays();
    menuOverlay.classList.add('active');
}

// === Button Listeners ===
document.getElementById('startBtn').addEventListener('click', startGame);
document.getElementById('restartBtn').addEventListener('click', returnToMenu);

// === Init ===
function init() {
    resetBall();
    animationFrameId = requestAnimationFrame(gameLoop);
}

init();
```

- [ ] **Step 2: Verify in browser**

Open `pong.html`, click "INIZIA PARTITA".
- Verify both paddles move with `W`/`S` and `↑`/`↓`.
- Verify the ball bounces off top/bottom walls.
- Verify the ball bounces off paddles with angle changes.
- Verify the ball leaves a trail.
- Verify score increments when ball goes past a paddle.
- Verify screen shake on score.
- Verify the game pauses with `P` or `Space`.
- Verify game ends at 10 points and shows victory screen.

- [ ] **Step 3: Commit**

```bash
git add pong.js
git commit -m "feat(pong): implement physics, collisions, scoring, pause, and victory state"
```

---

## Task 5: Final Polish and Bug Fixes

**Files:**
- Modify: `pong.js`
- Test: Full playthrough.

**Interfaces:**
- Consumes: All previous code.
- Produces: Stable, polished game.

- [ ] **Step 1: Fix duplicate event listener bug**

There are currently two separate `keydown` listeners on `window` in the code from Task 4. Combine them into one listener to avoid duplicate processing.

Replace the event listener section in `pong.js`:

```javascript
// === Event Listeners ===
window.addEventListener('keydown', (e) => {
    keys[e.code] = true;

    if (e.code === 'KeyP' || e.code === 'Space') {
        if (currentState === STATE.PLAYING || currentState === STATE.PAUSED) {
            e.preventDefault(); // Prevent scrolling only when pausing
            togglePause();
        } else if (currentState === STATE.MENU) {
            e.preventDefault();
            startGame();
        }
    }
});

window.addEventListener('keyup', (e) => {
    keys[e.code] = false;
});
```

- [ ] **Step 2: Ensure Spacebar works in menu to start game**

In the `startGame` function, make sure it handles being called from the menu correctly. It already does, but verify the `Space` key in menu starts the game.

- [ ] **Step 3: Verify trail effect works correctly after pause**

When pausing, the trail effect might accumulate because the loop keeps running but only clears partially. The current implementation is fine because the loop continues drawing with the trail alpha even when paused, but visually the screen might get darker. To fix this, when pausing, do a full clear once.

Modify `togglePause`:

```javascript
function togglePause() {
    if (currentState === STATE.PLAYING) {
        currentState = STATE.PAUSED;
        pauseOverlay.classList.add('active');
        // Full clear to remove trail buildup
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        drawField();
        drawPaddle(paddle1);
        drawPaddle(paddle2);
        drawBall();
        drawScore();
    } else if (currentState === STATE.PAUSED) {
        currentState = STATE.PLAYING;
        pauseOverlay.classList.remove('active');
    }
}
```

- [ ] **Step 4: Prevent ball from getting stuck inside paddle**

Sometimes at high speeds the ball can tunnel through a paddle. Add a safety check in `updateBall` after collision detection to push the ball outside the paddle.

In `handlePaddleBounce`, after calculating the new `dx`, add:

```javascript
if (paddle === paddle1) {
    ball.x = paddle1.x + paddle1.width + ball.size / 2 + 1;
} else {
    ball.x = paddle2.x - ball.size / 2 - 1;
}
```

- [ ] **Step 5: Final browser test**

Play a full game to 10 points. Test:
- Paddle movement responsiveness.
- Ball collision accuracy.
- Score increments correctly.
- Pause and resume.
- Victory screen appears with correct text.
- "RIGIOCA" returns to menu.

- [ ] **Step 6: Commit**

```bash
git add pong.js
git commit -m "fix(pong): polish event listeners, pause trail clearing, paddle tunneling"
```

---

## Task 6: Integration with Existing Site

**Files:**
- Modify: `index.html`
- Test: Verify link from Vinilkraft to Pong works.

**Interfaces:**
- Consumes: `index.html` structure.
- Produces: A navigation link from Vinilkraft Records to the Pong game.

- [ ] **Step 1: Add link to Pong in `index.html` navigation**

In `index.html`, find the `<nav>` element. Add a link to `pong.html`.

Example (find existing nav links and add alongside):

```html
<a href="pong.html">Gioca a Pong</a>
```

- [ ] **Step 2: Verify link**

Open `index.html` in browser, click the new link. It should open `pong.html`.

- [ ] **Step 3: Commit**

```bash
git add index.html
git commit -m "feat(pong): add navigation link from Vinilkraft to Pong game"
```

---

## Plan Self-Review

**Spec coverage:**
- [x] 2-player local controls: Task 4.
- [x] Score to 10, displayed on screen: Task 4.
- [x] Menu initial with instructions: Task 1 (HTML), Task 2 (CSS).
- [x] Pause: Task 4.
- [x] Visual effects (trail, shake, scanline, glow): Task 2 (CSS), Task 3 (trail), Task 4 (shake).
- [x] Victory screen with replay: Task 1 (HTML), Task 4 (logic).

**Placeholder scan:**
- [x] No "TBD", "TODO", or vague requirements.
- [x] All steps contain actual code or exact commands.

**Type consistency:**
- [x] State names (`STATE.MENU`, etc.) consistent across all tasks.
- [x] Function names (`startGame`, `togglePause`, `showVictoryScreen`) consistent.
- [x] Variable names (`paddle1`, `paddle2`, `ball`, `keys`) consistent.

**Gaps:** None found. All spec requirements are covered.

---

## Execution Handoff

**Plan complete and saved to `docs/superpowers/plans/2026-09-09-pong-clone.md`. Two execution options:**

**1. Subagent-Driven (recommended)** - I dispatch a fresh subagent per task, review between tasks, fast iteration.

**2. Inline Execution** - Execute tasks in this session using executing-plans, batch execution with checkpoints.

**Which approach?**
