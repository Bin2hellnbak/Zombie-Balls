// Simple Socket.io game server for Zombie Balls
const http = require('http');
const express = require('express');
const socketio = require('socket.io');
const app = express();
const server = http.createServer(app);
// Allow cross-origin connections from the lobby server (or any origin during development)
const io = socketio(server, {
    cors: {
        origin: '*'
    }
});

const WORLD_SIZE = 2000;
const BALL_RADIUS = 20;

let players = {};

io.on('connection', socket => {
    let playerId = socket.id;
    console.log(`Socket connected: ${playerId}`);
    socket.on('join', ({ name }) => {
        console.log(`Player join requested: ${name} (socket ${playerId})`);
        // Spawn player in center
        players[playerId] = {
            id: playerId,
            name: name || 'Player',
            x: WORLD_SIZE/2,
            y: WORLD_SIZE/2
        };
        socket.emit('init', { id: playerId, players });
        io.emit('state', { players });
    });
    socket.on('move', ({ x, y }) => {
        if (players[playerId]) {
            // Clamp to world bounds
            players[playerId].x = Math.max(BALL_RADIUS, Math.min(WORLD_SIZE - BALL_RADIUS, x));
            players[playerId].y = Math.max(BALL_RADIUS, Math.min(WORLD_SIZE - BALL_RADIUS, y));
            io.emit('state', { players });
        }
    });
    socket.on('disconnect', () => {
        delete players[playerId];
        io.emit('state', { players });
    });
});

app.use(express.static(__dirname));

const PORT = process.env.PORT || 4000;
server.listen(PORT, '0.0.0.0', (err) => {
    if (err) {
        console.error('Failed to start game server:', err);
        process.exit(1);
    }
    console.log(`Zombie Balls game server running on http://0.0.0.0:${PORT}`);
});

server.on('error', (err) => {
    console.error('Game server error:', err);
});