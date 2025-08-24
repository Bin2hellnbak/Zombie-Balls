// Basic client-side game logic for Zombie Balls
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const socket = io();

const WORLD_SIZE = 2000;
const VIEWPORT_W = canvas.width;
const VIEWPORT_H = canvas.height;
const BALL_RADIUS = 20;
const MOVE_SPEED = 5;

let playerId = null;
let players = {};
let camera = { x: 0, y: 0 };

// Get player name from URL
function getPlayerName() {
    const params = new URLSearchParams(window.location.search);
    return params.get('player') || 'Player';
}

// Handle movement input
const keys = {};
document.addEventListener('keydown', e => { keys[e.key] = true; });
document.addEventListener('keyup', e => { keys[e.key] = false; });

function updateLocalPlayer() {
    if (!playerId || !players[playerId]) return;
    let p = players[playerId];
    let dx = 0, dy = 0;
    if (keys['ArrowUp'] || keys['w']) dy -= MOVE_SPEED;
    if (keys['ArrowDown'] || keys['s']) dy += MOVE_SPEED;
    if (keys['ArrowLeft'] || keys['a']) dx -= MOVE_SPEED;
    if (keys['ArrowRight'] || keys['d']) dx += MOVE_SPEED;
    // Clamp to world bounds
    p.x = Math.max(BALL_RADIUS, Math.min(WORLD_SIZE - BALL_RADIUS, p.x + dx));
    p.y = Math.max(BALL_RADIUS, Math.min(WORLD_SIZE - BALL_RADIUS, p.y + dy));
    // Send position to server
    socket.emit('move', { x: p.x, y: p.y });
}

function updateCamera() {
    if (!playerId || !players[playerId]) return;
    let p = players[playerId];
    camera.x = Math.max(VIEWPORT_W/2, Math.min(WORLD_SIZE - VIEWPORT_W/2, p.x));
    camera.y = Math.max(VIEWPORT_H/2, Math.min(WORLD_SIZE - VIEWPORT_H/2, p.y));
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // Draw world boundary
    ctx.strokeStyle = '#666';
    ctx.lineWidth = 4;
    ctx.strokeRect(
        VIEWPORT_W/2 - camera.x,
        VIEWPORT_H/2 - camera.y,
        WORLD_SIZE,
        WORLD_SIZE
    );
    // Draw all players
    for (const id in players) {
        const p = players[id];
        const screenX = p.x - camera.x + VIEWPORT_W/2;
        const screenY = p.y - camera.y + VIEWPORT_H/2;
        ctx.beginPath();
        ctx.arc(screenX, screenY, BALL_RADIUS, 0, 2 * Math.PI);
        ctx.fillStyle = id === playerId ? '#4caf50' : '#ff9800';
        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.fillStyle = '#fff';
        ctx.font = '16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(p.name, screenX, screenY - BALL_RADIUS - 8);
    }
}

function gameLoop() {
    updateLocalPlayer();
    updateCamera();
    draw();
    requestAnimationFrame(gameLoop);
}

gameLoop();

// Socket.io events
socket.on('init', data => {
    playerId = data.id;
    players = data.players;
});
socket.on('state', data => {
    players = data.players;
});

// Join game on load
socket.emit('join', { name: getPlayerName() });
