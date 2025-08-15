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
    servers.push({ name, password, host });
    saveServers();
    res.json({ success: true });
});

app.listen(PORT, () => {
    console.log(`Zombie Balls backend running on http://localhost:${PORT}`);
});
