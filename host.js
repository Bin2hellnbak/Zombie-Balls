// host.js - manages the host's server and player list
// This will be filled in after backend changes are made

async function getQueryParam(name) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(name);
}

async function fetchPlayers() {
    const serverName = await getQueryParam('server');
    if (!serverName) return;
    try {
        const res = await fetch(`/servers/${encodeURIComponent(serverName)}/players`);
        const players = await res.json();
        renderPlayers(players);
    } catch {
        renderPlayers([]);
    }
}

let kicked = false;
let lastPing = null;

function renderPlayers(players) {
    const playersList = document.getElementById('playersList');
    playersList.innerHTML = '';
    const host = new URLSearchParams(window.location.search).get('host');
    const player = new URLSearchParams(window.location.search).get('player');
    // Show/hide controls column header
    const controlsTh = document.querySelector('.players-table th.controls-th');
    if (controlsTh) {
        controlsTh.style.display = (player === host) ? '' : 'none';
    }
    // If not host and player is not in the list, they were kicked or host left
    if (player !== host && !players.some(pl => pl.name === player) && !kicked) {
        kicked = true;
        // Check if host is still present
        if (!players.some(pl => pl.name === host)) {
            alert('The host left the server.');
        } else {
            alert('You were kicked from the server by the host.');
        }
        window.location.href = 'index.html';
        return;
    }
    players.forEach(pl => {
        const tr = document.createElement('tr');
        // Name cell
        const nameTd = document.createElement('td');
        nameTd.textContent = pl.name;
        nameTd.style.fontWeight = pl.name === host ? 'bold' : 'normal';
        nameTd.style.fontSize = '1.1em';
        tr.appendChild(nameTd);
        // Ping cell
        const pingTd = document.createElement('td');
        pingTd.textContent = pl.ping !== null ? `${pl.ping} ms` : '';
        tr.appendChild(pingTd);
        // Controls cell
        const controlsTd = document.createElement('td');
        controlsTd.style.textAlign = 'center';
        if (player === host && pl.name !== host) {
            const kickBtn = document.createElement('button');
            kickBtn.textContent = 'Kick';
            kickBtn.className = 'kick-btn';
            kickBtn.onclick = async function() {
                await fetch(`/servers/${encodeURIComponent(await getQueryParam('server'))}/kick`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ player: pl.name, requester: host })
                });
                fetchPlayers();
            };
            controlsTd.appendChild(kickBtn);
        }
        tr.appendChild(controlsTd);
        playersList.appendChild(tr);
    });
}

// Periodically send ping to server
async function sendPing() {
    const serverName = await getQueryParam('server');
    const player = await getQueryParam('player');
    if (!serverName || !player) return;
    const start = performance.now();
    await fetch('/servers'); // simple request to measure latency
    const ping = Math.round(performance.now() - start);
    if (lastPing !== ping) {
        lastPing = ping;
        await fetch(`/servers/${encodeURIComponent(serverName)}/ping`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ player, ping })
        });
    }
}
setInterval(sendPing, 3000);

// Leave server (host deletes server)
async function leaveServer() {
    const serverName = await getQueryParam('server');
    const player = await getQueryParam('player');
    if (!serverName || !player) return;
    await fetch(`/servers/${encodeURIComponent(serverName)}/leave`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ player })
    });
    window.location.href = 'index.html';
}

// Replace Back to Main button with Leave Server
const backBtn = document.querySelector('button');
if (backBtn) {
    backBtn.textContent = 'Leave Server';
    backBtn.onclick = leaveServer;
}

fetchPlayers();
setInterval(fetchPlayers, 2000);
