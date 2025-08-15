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
        let pwText = server.password ? 'Password required' : 'No password';
        // Create server info and join button container
        const infoDiv = document.createElement('span');
        infoDiv.innerHTML = `<strong>${server.name}</strong> <span>(${server.host})</span> | ${pwText}`;
        infoDiv.style.display = 'inline-block';
        infoDiv.style.verticalAlign = 'middle';
        const joinBtn = document.createElement('button');
        joinBtn.textContent = 'Join';
        joinBtn.className = 'join-btn';
        joinBtn.style.marginLeft = 'auto';
        joinBtn.style.float = 'right';
        joinBtn.onclick = async function() {
            let pw = '';
            if (server.password) {
                pw = prompt('Enter server password:');
                if (pw === null) return;
            }
            const playerName = document.getElementById('playerName').value.trim();
            if (!playerName) {
                alert('Please enter your player name.');
                return;
            }
            try {
                const res = await fetch('/servers/join', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name: server.name, player: playerName, password: pw })
                });
                const result = await res.json();
                if (result.error) {
                    alert(result.error);
                } else {
                    window.location.href = 'host.html?server=' + encodeURIComponent(server.name) + '&host=' + encodeURIComponent(server.host) + '&player=' + encodeURIComponent(playerName);
                }
            } catch {
                alert('Failed to join server.');
            }
        };
        div.appendChild(infoDiv);
        div.appendChild(joinBtn);
        div.style.display = 'flex';
        div.style.alignItems = 'center';
        div.style.justifyContent = 'space-between';
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
        // Host is auto-joined, redirect to host.html
        window.location.href = 'host.html?server=' + encodeURIComponent(serverName) + '&host=' + encodeURIComponent(playerName) + '&player=' + encodeURIComponent(playerName);
    } catch {
        alert('Failed to host server.');
    }
});

document.getElementById('refreshServersBtn').addEventListener('click', fetchServers);

// Initial render
fetchServers();
