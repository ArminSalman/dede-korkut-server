const express = require('express');
const http = require('http');
const WebSocket = require('ws');

const app = express();

// Render sunucunun canlı olduğunu doğrulamak için basit bir ana sayfa (404'ü önler)
app.get('/', (req, res) => {
    res.send('Dede Korkut Sinyal Sunucusu Aktif!');
});

const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

wss.on('connection', (ws) => {
    console.log('Yeni bir Alp obaya bağlandı!');
    
    ws.on('message', (message) => {
        wss.clients.forEach((client) => {
            if (client !== ws && client.readyState === WebSocket.OPEN) {
                client.send(message);
            }
        });
    });

    ws.on('close', () => console.log('Bir Alp bağlantıdan ayrıldı.'));
});

const PORT = process.env.PORT || 8910;
server.listen(PORT, () => {
    console.log(`Sunucu ${PORT} portunda başarıyla ayağa kalktı!`);
});
