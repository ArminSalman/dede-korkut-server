const WebSocket = require('ws');
const PORT = process.env.PORT || 8910;
const wss = new WebSocket.Server({ port: PORT });

console.log(`Dede Korkut Sinyal Sunucusu ${PORT} portunda aktif!`);

wss.on('connection', (ws) => {
    console.log('Yeni bir Alp obaya bağlandı!');
    
    ws.on('message', (message) => {
        // Gelen ağ paketini (RPC) bağlı olan diğer tüm oyunculara aynen fırlat (Relay)
        wss.clients.forEach((client) => {
            if (client !== ws && client.readyState === WebSocket.OPEN) {
                client.send(message);
            }
        });
    });

    ws.on('close', () => console.log('An Alp left the connection.'));
});
