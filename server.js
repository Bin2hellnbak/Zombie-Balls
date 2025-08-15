// Simple Express backend for Zombie Balls server browser
const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, 'servers.json');

app.use(express.json());
app.use(express.static(__dirname));

// Load servers from file or start with empty array
let servers = [];
if (fs.existsSync(DATA_FILE)) {
    try {
        servers = JSON.parse(fs.readFileSync(DATA_FILE));
    } catch {
        servers = [];
    }
}

// Save servers to file
function saveServers() {
    fs.writeFileSync(DATA_FILE, JSON.stringify(servers, null, 2));
}

// Get all servers
app.get('/servers', (req, res) => {
    res.json(servers);
});



// Add a new server
app.post('/servers', (req, res) => {
    const { name, password, host } = req.body;
    if (!name || !host) {
        return res.status(400).json({ error: 'Missing name or host' });
    }
    // Each server has a name, password, host, and players array
    servers.push({ name, password, host, players: [{ name: host, ping: null, ready: false }] });
    saveServers();
    res.json({ success: true });
});


// Join a server
app.post('/servers/join', (req, res) => {
    const { name, player, password } = req.body;
    const server = servers.find(s => s.name === name);
    if (!server) return res.status(404).json({ error: 'Server not found' });
    if (server.password && server.password !== password) {
        return res.status(403).json({ error: 'Incorrect password' });
    }
    if (!server.players.some(p => p.name === player)) server.players.push({ name: player, ping: null, ready: false });
// Set player ready status
app.post('/servers/:name/ready', (req, res) => {
    const server = servers.find(s => s.name === req.params.name);
    if (!server) return res.status(404).json({ error: 'Server not found' });
    const { player, ready } = req.body;
    const p = server.players.find(pl => pl.name === player);
    if (p) {
        p.ready = !!ready;
        saveServers();
    }
    res.json({ success: true });
});

// Check if all players are ready
app.get('/servers/:name/allready', (req, res) => {
    const server = servers.find(s => s.name === req.params.name);
    if (!server) return res.status(404).json({ error: 'Server not found' });
    const allReady = server.players.length > 0 && server.players.every(pl => pl.ready);
    res.json({ allReady });
});
    saveServers();
    res.json({ success: true });
});


// List players in a server
app.get('/servers/:name/players', (req, res) => {
    const server = servers.find(s => s.name === req.params.name);
    if (!server) return res.status(404).json({ error: 'Server not found' });
    res.json(server.players);
});

// Update player ping
app.post('/servers/:name/ping', (req, res) => {
    const server = servers.find(s => s.name === req.params.name);
    if (!server) return res.status(404).json({ error: 'Server not found' });
    const { player, ping } = req.body;
    const p = server.players.find(pl => pl.name === player);
    if (p) {
        p.ping = ping;
        saveServers();
    }
    res.json({ success: true });
});



// Kick a player from a server (only host can kick)
app.post('/servers/:name/kick', (req, res) => {
    const server = servers.find(s => s.name === req.params.name);
    if (!server) return res.status(404).json({ error: 'Server not found' });
    const { player, requester } = req.body;
    if (requester !== server.host) return res.status(403).json({ error: 'Only host can kick players' });
    if (player === server.host) return res.status(400).json({ error: 'Cannot kick host' });
    server.players = server.players.filter(p => p.name !== player);
    saveServers();
    res.json({ success: true });
});


// Leave server (if host leaves, delete server)
app.post('/servers/:name/leave', (req, res) => {
    const serverIdx = servers.findIndex(s => s.name === req.params.name);
    if (serverIdx === -1) return res.status(404).json({ error: 'Server not found' });
    const server = servers[serverIdx];
    const { player } = req.body;
    if (player === server.host) {
        servers.splice(serverIdx, 1);
        saveServers();
        return res.json({ deleted: true });
    }
    server.players = server.players.filter(p => p.name !== player);
    saveServers();
    res.json({ left: true });
});

app.listen(PORT, () => {
    console.log(`Zombie Balls backend running on http://localhost:${PORT}`);
});
