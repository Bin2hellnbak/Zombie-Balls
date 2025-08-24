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
let gameStarting = false;
let gameCountdown = 0;

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
        // Do not return here; allow table to render for others
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
        readyTd.textContent = pl.ready ? 'Ready' : 'Unready';
        readyTd.style.color = pl.ready ? '#4caf50' : '#ff9800';
        readyTd.style.fontWeight = 'bold';
        tr.appendChild(readyTd);
        // Ready button cell
        const readyBtnTd = document.createElement('td');
        readyBtnTd.className = 'ready-btn-td';
        readyBtnTd.style.textAlign = 'center';
        if (pl.name === player) {
            const readyBtn = document.createElement('button');
            readyBtn.textContent = pl.ready ? 'Unready' : 'Ready';
            readyBtn.className = 'ready-btn';
            readyBtn.style.backgroundColor = pl.ready ? '#ff9800' : '#4caf50';
            readyBtn.style.color = '#fff';
            // Disable unreadying during countdown
            if (gameStarting && gameCountdown > 0 && pl.ready) {
                readyBtn.disabled = true;
            } else {
                readyBtn.disabled = false;
            }
            readyBtn.onclick = async function() {
                if (gameStarting && gameCountdown > 0 && pl.ready) return;
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

    // Show countdown display for all players
    const actionsRow = document.querySelector('.server-actions-row');
    if (actionsRow) {
        let countdownDiv = document.getElementById('gameCountdownDiv');
        if (!countdownDiv) {
            countdownDiv = document.createElement('div');
            countdownDiv.id = 'gameCountdownDiv';
            countdownDiv.style.marginLeft = '2em';
            countdownDiv.style.fontWeight = 'bold';
            countdownDiv.style.fontSize = '1.2em';
            actionsRow.appendChild(countdownDiv);
        }
        if (gameStarting && gameCountdown > 0) {
            countdownDiv.textContent = `Game starting in ${gameCountdown}...`;
        } else {
            countdownDiv.textContent = '';
        }
    }

    // Start/Abort game button for host when everyone is ready
    const startBtn = document.getElementById('startGameBtn');
    if (startBtn) {
        if (player === host && allReady) {
            startBtn.style.display = '';
            startBtn.textContent = gameStarting ? 'Abort' : 'Start Game';
            startBtn.classList.toggle('abort', gameStarting);
            startBtn.disabled = false;
            startBtn.onclick = async function() {
                if (!gameStarting) {
                    gameStarting = true;
                    gameCountdown = 5;
                    await fetch(`/servers/${encodeURIComponent(await getQueryParam('server'))}/start`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ countdown: gameCountdown })
                    });
                    startBtn.textContent = 'Abort';
                    startBtn.classList.add('abort');
                } else {
                    // Abort
                    gameStarting = false;
                    await fetch(`/servers/${encodeURIComponent(await getQueryParam('server'))}/start`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ countdown: 0 })
                    });
                    startBtn.textContent = 'Start Game';
                    startBtn.classList.remove('abort');
                }
            };
        } else {
            startBtn.style.display = 'none';
        }
    }
}

// Poll for game start status
async function pollGameStart() {
    const serverName = await getQueryParam('server');
    if (!serverName) return;
    try {
        const res = await fetch(`/servers/${encodeURIComponent(serverName)}/start`);
        const data = await res.json();
        if (data.started) {
            // Redirect all clients to the game page when server reports it started
            const player = new URLSearchParams(window.location.search).get('player');
            // Navigate to the game server (assumes socket server served on port 4000 in same host)
            // Use relative path to game.html which will load socket.io from the game server when hosted separately.
            window.location.href = `game.html?player=${encodeURIComponent(player)}`;
            return;
        }
        if (data.countdown && data.countdown > 0) {
            gameStarting = true;
            gameCountdown = data.countdown;
        } else {
            gameStarting = false;
            gameCountdown = 0;
        }
        renderPlayers(await (await fetch(`/servers/${encodeURIComponent(serverName)}/players`)).json());
    } catch {}
}
setInterval(pollGameStart, 1000);

// Periodically send ping to server
async function sendPing() {
    const serverName = await getQueryParam('server');
    const player = await getQueryParam('player');
    if (!serverName || !player) return;
    const start = performance.now();
    await fetch('/servers'); // simple request to measure latency
    const ping = Math.round(performance.now() - start);
    lastPing = ping;
    // Always send heartbeat so backend doesn't remove us when ping doesn't change
    await fetch(`/servers/${encodeURIComponent(serverName)}/ping`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ player, ping })
    });
}
// Send pings regularly and on focus/visibility events to keep heartbeat alive
let pingIntervalId = setInterval(sendPing, 2000);
document.addEventListener('visibilitychange', () => {
    if (!document.hidden) sendPing();
});
window.addEventListener('focus', () => sendPing());
window.addEventListener('pageshow', () => sendPing());
window.addEventListener('pagehide', () => sendPing());

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

// Send initial ping and fetch players immediately on page load
async function initialSetup() {
    await sendPing();
    await fetchPlayers();
}
initialSetup();
setInterval(sendPing, 3000);
setInterval(fetchPlayers, 2000);
