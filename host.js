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

function renderPlayers(players) {
    const playersList = document.getElementById('playersList');
    playersList.innerHTML = '';
    const host = new URLSearchParams(window.location.search).get('host');
    const player = new URLSearchParams(window.location.search).get('player');
    players.forEach(p => {
        const div = document.createElement('div');
        div.className = 'player-item';
        div.innerHTML = `<span>${p}</span>`;
        if (player === host && p !== host) {
            const kickBtn = document.createElement('button');
            kickBtn.textContent = 'Kick';
            kickBtn.onclick = async function() {
                await fetch(`/servers/${encodeURIComponent(await getQueryParam('server'))}/kick`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ player: p, requester: host })
                });
                fetchPlayers();
            };
            div.appendChild(kickBtn);
        }
        playersList.appendChild(div);
    });
}

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
