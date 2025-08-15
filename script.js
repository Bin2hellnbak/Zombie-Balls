
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
        div.innerHTML = `<strong>${server.name}</strong> <span>(${server.host})</span><br><em>${server.desc}</em>`;
        serversList.appendChild(div);
    });
}

document.getElementById('hostBtn').addEventListener('click', function() {
    const playerName = document.getElementById('playerName').value.trim();
    const serverName = document.getElementById('serverName').value.trim();
    const serverDesc = document.getElementById('serverDesc').value.trim();
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
        desc: serverDesc,
        host: playerName
    });
    renderServers();
    document.getElementById('serverName').value = '';
    document.getElementById('serverDesc').value = '';
});

// Initial render
renderServers();
