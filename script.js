// Fetch and render servers from backend
async function fetchServers() {
    try {
        const res = await fetch('/servers');
        let servers = await res.json();
        // Fetch countdown for each server
        servers = await Promise.all(servers.map(async s => {
            const res = await fetch(`/servers/${encodeURIComponent(s.name)}/start`);
            const data = await res.json();
            s.countdown = data.countdown;
            return s;
        }));
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
        const pwColor = server.password ? '#ff9800' : '#4caf50';
        infoDiv.innerHTML = `
            <div style="font-weight:bold;font-size:1.1em;">${server.name}</div>
            <div style="font-size:0.95em;">Host: ${server.host}</div>
            <div style="font-size:0.9em;color:#fff;">Players: ${server.players ? server.players.length : 1}</div>
            <div style="font-size:0.85em;color:${pwColor};">${pwText}</div>
        `;
        // If game is in progress (countdown > 0), disable join and show text
        if (server.countdown && server.countdown > 0) {
            const inProgress = document.createElement('span');
            inProgress.textContent = 'Game in progress';
            inProgress.style.color = '#4caf50';
            inProgress.style.fontWeight = 'bold';
            inProgress.style.marginLeft = 'auto';
            div.appendChild(infoDiv);
            div.appendChild(inProgress);
        } else {
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
                // Player name: 1-10 chars, letters/numbers/spaces, at least 1 letter, not only spaces, not starting with space
                if (!/^(?=.*[a-zA-Z])[a-zA-Z0-9 ]{1,10}$/.test(playerName) || /^\s/.test(playerName) || playerName.trim().length === 0) {
                    alert('Player name must be 1-10 characters, only letters, numbers, and spaces, must contain at least one letter, cannot start with a space or be only spaces.');
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
        }
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
    // Player name: 1-10 chars, letters/numbers/spaces, at least 1 letter, not only spaces, not starting with space
    if (!/^(?=.*[a-zA-Z])[a-zA-Z0-9 ]{1,10}$/.test(playerName) || /^\s/.test(playerName) || playerName.trim().length === 0) {
        alert('Player name must be 1-10 characters, only letters, numbers, and spaces, must contain at least one letter, cannot start with a space or be only spaces.');
        return;
    }
    // Server name: 1-10 chars, letters/numbers/spaces, at least 1 letter, not only spaces, not starting with space
    if (!/^(?=.*[a-zA-Z])[a-zA-Z0-9 ]{1,10}$/.test(serverName) || /^\s/.test(serverName) || serverName.trim().length === 0) {
        alert('Server name must be 1-10 characters, only letters, numbers, and spaces, must contain at least one letter, cannot start with a space or be only spaces.');
        return;
    }
// Restrict input fields to allowed characters in real time
function restrictNameInput(inputId) {
    const input = document.getElementById(inputId);
    input.addEventListener('input', function() {
        let val = input.value;
        // Remove disallowed characters (anything except letters, numbers, spaces)
        val = val.replace(/[^a-zA-Z0-9 ]/g, '');
        // Prevent starting with space
        if (val.length > 0 && val[0] === ' ') val = val.trimStart();
        // Limit to 10 chars
        if (val.length > 10) val = val.slice(0, 10);
        input.value = val;
    });
}
restrictNameInput('playerName');
restrictNameInput('serverName');
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
