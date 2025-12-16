
const express = require('express');
const app = express();
app.get('/', (req, res) => res.send('ok'));
const server = app.listen(3002, '0.0.0.0', () => {
    console.log('Debug server listening on 3002');
});
server.on('error', (e) => console.log('Server Error:', e));
setInterval(() => console.log('Heartbeat'), 5000);
