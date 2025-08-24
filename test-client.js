const io = require('socket.io-client');
const s = io('http://localhost:4000');

s.on('connect', () => {
  console.log('test-client connected', s.id);
  s.emit('join', { name: 'TestClient' });
});

s.on('init', (d) => {
  console.log('init event, player count:', Object.keys(d.players).length);
});

s.on('state', (d) => {
  console.log('state event, player count:', Object.keys(d.players).length);
});

s.on('disconnect', () => console.log('disconnected'));

setTimeout(() => { console.log('exiting test client'); process.exit(0); }, 4000);
