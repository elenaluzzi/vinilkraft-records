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
    const angle = (Math.random() * Math.PI / 4) - (Math.PI / 8); // +/-22.5 degrees
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

    // Prevent ball from getting stuck inside paddle
    if (paddle === paddle1) {
        ball.x = paddle1.x + paddle1.width + ball.size / 2 + 1;
    } else {
        ball.x = paddle2.x - ball.size / 2 - 1;
    }
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
        if (currentState === STATE.PLAYING || currentState === STATE.PAUSED) {
            e.preventDefault();
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

// Prevent scrolling with arrow keys and space
window.addEventListener('keydown', (e) => {
    if (['ArrowUp', 'ArrowDown', 'Space'].includes(e.code)) {
        e.preventDefault();
    }
}, { passive: false });

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
