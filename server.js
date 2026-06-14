const express = require('express');
const http = require('http');
const WebSocket = require('ws');

const app = express();

app.get('/', (req, res) => {
    res.send('Dede Korkut Cloud Server is Active!');
});

const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Central server memory storage
let globalLobbyState = {
    oba_name: "",
    players: {}
};

wss.on('connection', (ws) => {
    console.log('An Alp connected to the cloud server.');

    ws.on('message', (message) => {
        try {
            const data = JSON.parse(message);

            // Handle incoming data synchronization packet
            if (data.type === "sync_state") {
                globalLobbyState.oba_name = data.oba_name;
                globalLobbyState.players = data.players;
                console.log(`[Server Storage Updated] Oba: ${globalLobbyState.oba_name}, Total Players: ${Object.keys(globalLobbyState.players).length}`);
                
                // Broadcast the updated server memory to ALL connected clients
                broadcast(JSON.stringify({
                    type: "lobby_update",
                    oba_name: globalLobbyState.oba_name,
                    players: globalLobbyState.players
                }));
            } 
            // Handle new client raw request for current server data
            else if (data.type === "request_initial_data") {
                ws.send(JSON.stringify({
                    type: "lobby_update",
                    oba_name: globalLobbyState.oba_name,
                    players: globalLobbyState.players
                }));
                console.log("[Server Memory] Sent stored lobby information to a newly joined client.");
            }
        } catch (e) {
            // Fallback for native engine RPC raw bytes packets
            wss.clients.forEach((client) => {
                if (client !== ws && client.readyState === WebSocket.OPEN) {
                    client.send(message);
                }
            });
        }
    });

    ws.on('close', () => {
        console.log('An Alp disconnected from the gateway.');
    });
});

function broadcast(packet) {
    wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(packet);
        }
    });
}

const PORT = process.env.PORT || 8910;
server.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
});
