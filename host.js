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
    // If not host and player is not in the list, they were kicked
    if (player !== host && !players.some(pl => pl.name === player) && !kicked) {
        kicked = true;
        alert('You were kicked from the server by the host.');
        window.location.href = 'index.html';
        return;
    }
    players.forEach(pl => {
        const div = document.createElement('div');
        div.className = 'player-item-card';
        const infoSpan = document.createElement('span');
        infoSpan.textContent = pl.name;
        infoSpan.style.fontWeight = pl.name === host ? 'bold' : 'normal';
        infoSpan.style.fontSize = '1.1em';
        // Show ping if available
        const pingSpan = document.createElement('span');
        pingSpan.textContent = pl.ping !== null ? `Ping: ${pl.ping} ms` : '';
        pingSpan.style.marginLeft = '1em';
        infoSpan.appendChild(pingSpan);
        div.appendChild(infoSpan);
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
            div.appendChild(kickBtn);
        }
        div.style.display = 'flex';
        div.style.alignItems = 'center';
        div.style.justifyContent = 'space-between';
        div.style.marginBottom = '0.7em';
        div.style.padding = '0.7em 1em';
        div.style.background = '#232323';
        div.style.borderRadius = '6px';
        div.style.boxShadow = '0 1px 4px #0002';
        playersList.appendChild(div);
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
