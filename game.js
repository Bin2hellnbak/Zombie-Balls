// Basic client-side game logic for Zombie Balls
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
// We'll initialize socket after ensuring the socket.io lib is loaded.
let socket = null;
let localMode = false; // fallback when socket can't be used

// Ensure canvas has sensible size (some hosts may serve CSS first)
if (!canvas.width || !canvas.height) {
    canvas.width = Math.max(800, Math.floor(window.innerWidth * 0.9));
    canvas.height = Math.max(600, Math.floor(window.innerHeight * 0.75));
}

const WORLD_SIZE = 2000;
let VIEWPORT_W = canvas.width;
let VIEWPORT_H = canvas.height;
const BALL_RADIUS = 20;
const MOVE_SPEED = 5;

let playerId = null;
let players = {};
let camera = { x: 0, y: 0 };

console.log('Game client starting, attempting to connect to http://localhost:4000');

function startLocalMode() {
    console.warn('Starting local offline mode (no socket)');
    localMode = true;
    const id = 'local';
    playerId = id;
    players = {};
    players[id] = { id, name: getPlayerName() || 'LocalPlayer', x: WORLD_SIZE/2, y: WORLD_SIZE/2 };
    updateStatus();
}

function connectSocketOnce() {
    if (typeof io === 'undefined') return false;
    try {
        socket = io('http://localhost:4000');
    } catch (e) {
        console.error('Error creating socket:', e);
        return false;
    }
    // Wire socket handlers
    socket.on('connect', () => { console.log('socket connected', socket.id); updateStatus(); });
    socket.on('init', data => {
        playerId = data.id;
        players = data.players || {};
        console.log('socket init:', playerId, Object.keys(players).length, 'players');
        updateStatus();
    });
    socket.on('state', data => {
        players = data.players || {};
        updateStatus();
    });
    socket.on('connect_error', (err) => {
        console.error('Socket connect_error', err);
    });
    return true;
}

// Try to connect immediately; if socket.io not yet loaded poll for a short time then fallback to local mode
let connectAttempted = connectSocketOnce();
if (!connectAttempted) {
    let tries = 0;
    const poll = setInterval(() => {
        if (connectSocketOnce()) { clearInterval(poll); connectAttempted = true; }
        else if (++tries > 10) { clearInterval(poll); startLocalMode(); }
    }, 300);
}

// Simple status overlay for debugging connection / players
const statusDiv = document.createElement('div');
statusDiv.style.position = 'absolute';
statusDiv.style.left = '12px';
statusDiv.style.top = '12px';
statusDiv.style.padding = '6px 10px';
statusDiv.style.background = 'rgba(0,0,0,0.6)';
statusDiv.style.color = '#fff';
statusDiv.style.fontFamily = 'Arial, sans-serif';
statusDiv.style.fontSize = '13px';
statusDiv.style.zIndex = 9999;
document.body.appendChild(statusDiv);
function updateStatus() {
    statusDiv.textContent = `mode:${localMode ? 'local' : (socket && socket.connected ? 'online' : 'disconnected')} id:${playerId || '-'} players:${Object.keys(players || {}).length}`;
}
updateStatus();

// Get player name from URL
function getPlayerName() {
    const params = new URLSearchParams(window.location.search);
    return params.get('player') || 'Player';
}

// Handle movement input (normalize to lowercase)
const keys = {};
document.addEventListener('keydown', e => { keys[(e.key || '').toLowerCase()] = true; });
document.addEventListener('keyup', e => { keys[(e.key || '').toLowerCase()] = false; });

function updateLocalPlayer() {
    if (!playerId || !players[playerId]) return;
    let p = players[playerId];
    let dx = 0, dy = 0;
    if (keys['arrowup'] || keys['w']) dy -= MOVE_SPEED;
    if (keys['arrowdown'] || keys['s']) dy += MOVE_SPEED;
    if (keys['arrowleft'] || keys['a']) dx -= MOVE_SPEED;
    if (keys['arrowright'] || keys['d']) dx += MOVE_SPEED;
    // Clamp to world bounds
    p.x = Math.max(BALL_RADIUS, Math.min(WORLD_SIZE - BALL_RADIUS, p.x + dx));
    p.y = Math.max(BALL_RADIUS, Math.min(WORLD_SIZE - BALL_RADIUS, p.y + dy));
    // Send position to server
    if (!localMode && socket && socket.connected) {
        socket.emit('move', { x: p.x, y: p.y });
    }
    // small debug
    // console.log('Local move', p.x, p.y);
}

function updateCamera() {
    if (!playerId || !players[playerId]) {
        // center camera on world if local player not available yet
        camera.x = WORLD_SIZE / 2;
        camera.y = WORLD_SIZE / 2;
        return;
    }
    let p = players[playerId];
    camera.x = Math.max(VIEWPORT_W/2, Math.min(WORLD_SIZE - VIEWPORT_W/2, p.x));
    camera.y = Math.max(VIEWPORT_H/2, Math.min(WORLD_SIZE - VIEWPORT_H/2, p.y));
}

function draw() {
    // refresh viewport dims from canvas in case of resize
    VIEWPORT_W = canvas.width;
    VIEWPORT_H = canvas.height;
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
    // Draw all players (or waiting text)
    if (!players || Object.keys(players).length === 0) {
        ctx.fillStyle = '#fff';
        ctx.font = '20px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Waiting for players...', canvas.width/2, canvas.height/2);
    }
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
    updateStatus();
}

function gameLoop() {
    updateLocalPlayer();
    updateCamera();
    draw();
    updateStatus();
    requestAnimationFrame(gameLoop);
}

gameLoop();

// Socket.io events
socket.on('init', data => {
    playerId = data.id;
    players = data.players;
    console.log('socket init:', playerId, Object.keys(players).length, 'players');
});
socket.on('state', data => {
    players = data.players;
    // console.log('socket state:', Object.keys(players).length, 'players');
});

// Join game on load
socket.emit('join', { name: getPlayerName() });

// Socket error handling: show overlay on connection failure
socket.io && socket.io.on('error', (err) => {
    console.error('Socket.io engine error', err);
});
socket.on('connect_error', (err) => {
    console.error('Socket connect_error', err);
    const o = document.createElement('div');
    o.style.position = 'fixed';
    o.style.left = '0';
    o.style.top = '0';
    o.style.right = '0';
    o.style.bottom = '0';
    o.style.background = 'rgba(0,0,0,0.9)';
    o.style.color = '#fff';
    o.style.display = 'flex';
    o.style.alignItems = 'center';
    o.style.justifyContent = 'center';
    o.style.fontSize = '18px';
    o.style.zIndex = 99999;
    o.innerText = `Socket connection failed: ${err && err.message ? err.message : err}`;
    document.body.appendChild(o);
});
socket.on('connect', () => updateStatus());
socket.on('disconnect', () => updateStatus());
