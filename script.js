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
        const infoDiv = document.createElement('div');
        infoDiv.style.display = 'flex';
        infoDiv.style.flexDirection = 'column';
        infoDiv.style.justifyContent = 'center';
        infoDiv.style.alignItems = 'flex-start';
        infoDiv.innerHTML = `
            <div style="font-weight:bold;font-size:1.1em;">${server.name}</div>
            <div style="font-size:0.95em;">Host: ${server.host}</div>
            <div style="font-size:0.9em;color:#888;">Players: ${server.players ? server.players.length : 1}</div>
            <div style="font-size:0.85em;color:#b44;">${pwText}</div>
        `;
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
                // Password: at least 2 non-space characters
                if (!pw.trim() || pw.length < 2) {
                    alert('Password must be at least 2 characters and not just spaces.');
                    return;
                }
            }
            const playerName = document.getElementById('playerName').value.trim();
            // Player name: 1-10 letters/numbers, at least 1 letter
            if (!/^(?=.*[a-zA-Z])[a-zA-Z0-9]{1,10}$/.test(playerName)) {
                alert('Player name must be 1-10 characters, only letters and numbers, and contain at least one letter.');
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
    const serverPassword = document.getElementById('serverPassword').value;
    // Player name: 1-10 letters/numbers, at least 1 letter
    if (!/^(?=.*[a-zA-Z])[a-zA-Z0-9]{1,10}$/.test(playerName)) {
        alert('Player name must be 1-10 characters, only letters and numbers, and contain at least one letter.');
        return;
    }
    // Server name: 1-10 letters/numbers, at least 1 letter
    if (!/^(?=.*[a-zA-Z])[a-zA-Z0-9]{1,10}$/.test(serverName)) {
        alert('Server name must be 1-10 characters, only letters and numbers, and contain at least one letter.');
        return;
    }
    // Password: empty or at least 2 non-space characters
    if (serverPassword && (!serverPassword.trim() || serverPassword.length < 2)) {
        alert('Password must be at least 2 characters and not just spaces.');
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
