const express = require('express');
const http = require('http');
const WebSocket = require('ws');

const app = express();
app.get('/', (req, res) => res.send('Dede Korkut Server Active'));

const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

let rooms = {}; 

wss.on('connection', (ws) => {
    ws.on('message', (message) => {
        try {
            const packet = JSON.parse(message);
            
            if (packet.action === "host_room") {
                rooms[packet.oba_name] = {
                    oba_name: packet.oba_name,
                    players: [packet.host_name]
                };
                ws.room_name = packet.oba_name;
                ws.player_name = packet.host_name;
                broadcast_room_update(packet.oba_name);
            }
            
            else if (packet.action === "join_room") {
                let targetRoom = packet.oba_name;
                if (!rooms[targetRoom] && Object.keys(rooms).length > 0) {
                    targetRoom = Object.keys(rooms)[0];
                }
                
                if (rooms[targetRoom]) {
                    if (!rooms[targetRoom].players.includes(packet.player_name)) {
                        rooms[targetRoom].players.push(packet.player_name);
                    }
                    ws.room_name = targetRoom;
                    ws.player_name = packet.player_name;
                    broadcast_room_update(targetRoom);
                }
            }

            // NEW: Handle host terminating the entire room
            else if (packet.action === "close_room") {
                if (ws.room_name && rooms[ws.room_name]) {
                    const targetRoom = ws.room_name;
                    
                    // Broadcast termination command to everyone in this room
                    const terminatePayload = JSON.stringify({ type: "room_terminated" });
                    wss.clients.forEach((client) => {
                        if (client.room_name === targetRoom && client.readyState === WebSocket.OPEN) {
                            client.send(terminatePayload);
                            // Reset client room references on the server side
                            client.room_name = null;
                        }
                    });
                    
                    // Delete the room from server memory entirely
                    delete rooms[targetRoom];
                    console.log(`[Server Memory] Room ${targetRoom} shut down by host.`);
                }
            }
        } catch (e) {
            console.error("Non-JSON packet dropped.");
        }
    });

    ws.on('close', () => {
        if (ws.room_name && rooms[ws.room_name]) {
            rooms[ws.room_name].players = rooms[ws.room_name].players.filter(p => p !== ws.player_name);
            if (rooms[ws.room_name].players.length === 0) {
                delete rooms[ws.room_name];
            } else {
                broadcast_room_update(ws.room_name);
            }
        }
    });
});

function broadcast_room_update(roomName) {
    if (!rooms[roomName]) return;
    const updatePayload = JSON.stringify({
        type: "lobby_update",
        oba_name: rooms[roomName].oba_name,
        players: rooms[roomName].players
    });
    
    wss.clients.forEach((client) => {
        if (client.room_name === roomName && client.readyState === WebSocket.OPEN) {
            client.send(updatePayload);
        }
    });
}

server.listen(process.env.PORT || 8910);
