
// Fetch and render servers from backend
async function fetchServers() {
    try {
        const res = await fetch('/servers');
        const servers = await res.json();
        renderServers(servers);
    } catch {
        renderServers([]);
    }
}

function renderServers(servers) {
    const serversList = document.getElementById('serversList');
    serversList.innerHTML = '';
    if (!servers || servers.length === 0) {
        serversList.innerHTML = '<p>No servers found. Try hosting one below!</p>';
        return;
    }
    servers.forEach((server, idx) => {
        const div = document.createElement('div');
        div.className = 'server-item';
        div.innerHTML = `<strong>${server.name}</strong> <span>(${server.host})</span><br>Password: <code>${server.password}</code>`;
        serversList.appendChild(div);
    });
}

document.getElementById('hostBtn').addEventListener('click', async function() {
    const playerName = document.getElementById('playerName').value.trim();
    const serverName = document.getElementById('serverName').value.trim();
    const serverPassword = document.getElementById('serverPassword').value.trim();
    if (!playerName) {
        alert('Please enter your player name.');
        return;
    }
    if (!serverName) {
        alert('Please enter a server name.');
        return;
    }
    try {
        await fetch('/servers', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: serverName, password: serverPassword, host: playerName })
        });
        document.getElementById('serverName').value = '';
        document.getElementById('serverPassword').value = '';
        fetchServers();
    } catch {
        alert('Failed to host server.');
    }
});

// Initial render
fetchServers();
