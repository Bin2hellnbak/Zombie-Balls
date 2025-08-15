
// Store servers in memory (mock)
let servers = [];

function renderServers() {
    const serversList = document.getElementById('serversList');
    serversList.innerHTML = '';
    if (servers.length === 0) {
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

document.getElementById('hostBtn').addEventListener('click', function() {
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
    servers.push({
        name: serverName,
        password: serverPassword,
        host: playerName
    });
    renderServers();
    document.getElementById('serverName').value = '';
    document.getElementById('serverPassword').value = '';
});

// Initial render
renderServers();
