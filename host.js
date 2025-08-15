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
        await renderPlayers(players);
    } catch {
        await renderPlayers([]);
    }
}

let kicked = false;
let lastPing = null;

async function renderPlayers(players) {
    const playersList = document.getElementById('playersList');
    playersList.innerHTML = '';
    const host = new URLSearchParams(window.location.search).get('host');
    const player = new URLSearchParams(window.location.search).get('player');
    // Show/hide controls column header
    const controlsTh = document.querySelector('.players-table th.controls-th');
    if (controlsTh) {
        controlsTh.style.display = (player === host) ? '' : 'none';
    }
    // Show/hide ready button column header
    const readyBtnTh = document.querySelector('.players-table th.ready-btn-th');
    if (readyBtnTh) {
        readyBtnTh.style.display = '';
    }
    // Adjust column spans for non-hosts
    const table = document.querySelector('.players-table');
    if (table) {
        const rows = table.querySelectorAll('tbody tr');
        rows.forEach(row => {
            if (player !== host) {
                // Remove controls cell for non-hosts
                if (row.children.length === 5) {
                    row.removeChild(row.children[4]);
                }
            }
        });
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
    let allReady = players.length > 0 && players.every(pl => pl.ready);
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
        // Ready status cell
        const readyTd = document.createElement('td');
        readyTd.textContent = pl.ready ? 'True' : 'False';
        readyTd.style.color = pl.ready ? '#8fbc8f' : '#e57373';
        tr.appendChild(readyTd);
        // Ready button cell
        const readyBtnTd = document.createElement('td');
        readyBtnTd.style.textAlign = 'center';
        if (pl.name === player) {
            const readyBtn = document.createElement('button');
            readyBtn.textContent = pl.ready ? 'Unready' : 'Ready';
            readyBtn.className = 'kick-btn';
            readyBtn.style.background = pl.ready ? '#e57373' : '#8fbc8f';
            readyBtn.onclick = async function() {
                await fetch(`/servers/${encodeURIComponent(await getQueryParam('server'))}/ready`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ player, ready: !pl.ready })
                });
                fetchPlayers();
            };
            readyBtnTd.appendChild(readyBtn);
        }
        tr.appendChild(readyBtnTd);
        // Controls cell (only for host)
        if (player === host) {
            const controlsTd = document.createElement('td');
            controlsTd.style.textAlign = 'center';
            if (pl.name !== host) {
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
        }
        playersList.appendChild(tr);
    });
    // Show start game button for host if all ready
    const startBtn = document.getElementById('startGameBtn');
    if (startBtn) {
        if (player === host && allReady) {
            startBtn.style.display = '';
            startBtn.onclick = async function() {
                startBtn.disabled = true;
                let count = 5;
                startBtn.textContent = 'Starting in ' + count + '...';
                const interval = setInterval(() => {
                    count--;
                    startBtn.textContent = 'Starting in ' + count + '...';
                    if (count === 0) {
                        clearInterval(interval);
                        startBtn.textContent = 'Start Game';
                        startBtn.disabled = false;
                    }
                }, 1000);
            };
        } else {
            startBtn.style.display = 'none';
        }
    } else {
        // Hide start button for non-hosts
        if (startBtn) startBtn.style.display = 'none';
    }
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
