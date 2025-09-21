// server.js
// Use 'npm install ws' para instalar a dependência
const WebSocket = require('ws');

const wss = new WebSocket.Server({ port: 8080 });

console.log('Servidor WebSocket rodando na porta 8080');

// --- Constantes do Jogo ---
const PLAYER_SIZE = 30;
const PLAYER_SPEED = 3;
const BULLET_SIZE = 8;
const BULLET_SPEED = 8;
const PLAYER_MAX_HP = 100;
const RESPAWN_TIME = 5000;

let rooms = {};
let clients = {};

// --- Loop Principal do Jogo ---
setInterval(updateGameStates, 1000 / 60); // Roda a 60 vezes por segundo

wss.on('connection', (ws) => {
    
    ws.on('message', (message) => {
        try {
            const data = JSON.parse(message);
            handleClientMessage(ws, data);
        } catch (error) {
            console.error("Mensagem inválida recebida:", message);
        }
    });

    ws.on('close', () => {
        handleClientDisconnect(ws);
    });
});

function handleClientMessage(ws, data) {
    const { type, payload } = data;
    const playerId = ws.id;

    switch (type) {
        case 'createRoom':
            const roomId = 'room_' + Math.random().toString(36).substr(2, 5);
            ws.roomId = roomId;
            ws.id = payload.playerId;
            clients[ws.id] = ws;

            rooms[roomId] = {
                id: roomId,
                players: {},
                bullets: {},
                lastBulletId: 0,
            };

            rooms[roomId].players[playerId] = {
                id: playerId,
                name: payload.playerName,
                x: 200, y: 200, angle: 0,
                hp: PLAYER_MAX_HP, score: 0,
                lastShotTime: 0,
                isDead: false
            };
            
            ws.send(JSON.stringify({ type: 'roomCreated', roomId: roomId }));
            break;

        case 'joinRoom':
            if (rooms[payload.roomId]) {
                ws.roomId = payload.roomId;
                ws.id = payload.playerId;
                clients[ws.id] = ws;

                const room = rooms[payload.roomId];
                room.players[payload.playerId] = {
                    id: payload.playerId,
                    name: payload.playerName,
                    x: Math.random() * 500 + 100,
                    y: Math.random() * 500 + 100,
                    angle: 0,
                    hp: PLAYER_MAX_HP, score: 0,
                    lastShotTime: 0,
                    isDead: false
                };
                ws.send(JSON.stringify({ type: 'joinedRoom', roomId: payload.roomId }));
            } else {
                ws.send(JSON.stringify({ type: 'error', message: 'Sala não encontrada' }));
            }
            break;
        
        case 'input':
            const room = rooms[ws.roomId];
            if (room && room.players[playerId]) {
                const player = room.players[playerId];
                if (player.isDead) break;

                // Movimento
                player.x += payload.move.x * PLAYER_SPEED;
                player.y += payload.move.y * PLAYER_SPEED;
                player.angle = payload.angle;

                // Tiro
                const now = Date.now();
                if (payload.shooting && now - player.lastShotTime > 200) {
                    player.lastShotTime = now;
                    const bulletId = `${playerId}-${room.lastBulletId++}`;
                    room.bullets[bulletId] = {
                        id: bulletId,
                        ownerId: playerId,
                        x: player.x + Math.cos(player.angle) * (PLAYER_SIZE / 2),
                        y: player.y + Math.sin(player.angle) * (PLAYER_SIZE / 2),
                        angle: player.angle,
                    };
                }
            }
            break;

        case 'chat':
             const chatRoom = rooms[ws.roomId];
             if(chatRoom && chatRoom.players[playerId]) {
                 const sender = chatRoom.players[playerId];
                 const message = {
                     type: 'chatMessage',
                     payload: {
                         name: sender.name,
                         text: payload.text,
                         color: sender.color || '#FFFFFF'
                     }
                 };
                 broadcast(ws.roomId, JSON.stringify(message));
             }
            break;
    }
}

function handleClientDisconnect(ws) {
    const room = rooms[ws.roomId];
    if (room && room.players[ws.id]) {
        console.log(`Jogador ${ws.id} desconectado da sala ${ws.roomId}`);
        delete room.players[ws.id];
        delete clients[ws.id];

        // Se a sala estiver vazia, delete-a
        if (Object.keys(room.players).length === 0) {
            console.log(`Sala ${ws.roomId} está vazia e foi fechada.`);
            delete rooms[ws.roomId];
        }
    }
}


function updateGameStates() {
    for (const roomId in rooms) {
        const room = rooms[roomId];

        // Atualizar balas e checar colisões
        for (const bulletId in room.bullets) {
            const bullet = room.bullets[bulletId];
            bullet.x += Math.cos(bullet.angle) * BULLET_SPEED;
            bullet.y += Math.sin(bullet.angle) * BULLET_SPEED;

            // Remover balas fora da tela
            if (bullet.x < -200 || bullet.x > 2200 || bullet.y < -200 || bullet.y > 2200) {
                delete room.bullets[bulletId];
                continue;
            }

            // Checar colisão com jogadores
            for (const playerId in room.players) {
                const player = room.players[playerId];
                if (player.isDead || bullet.ownerId === playerId) continue;

                const distance = Math.hypot(bullet.x - player.x, bullet.y - player.y);
                if (distance < PLAYER_SIZE / 2 + BULLET_SIZE / 2) {
                    // Colisão!
                    player.hp -= 20;
                    delete room.bullets[bulletId];
                    
                    if (player.hp <= 0) {
                        player.isDead = true;
                        player.hp = 0;

                        const owner = room.players[bullet.ownerId];
                        if (owner) {
                            owner.score += 1;
                        }

                        // Respawn
                        setTimeout(() => {
                            player.hp = PLAYER_MAX_HP;
                            player.isDead = false;
                            player.x = Math.random() * 500 + 100;
                            player.y = Math.random() * 500 + 100;
                        }, RESPAWN_TIME);
                    }
                    break;
                }
            }
        }
        
        // Enviar estado atualizado para todos na sala
        const gameState = {
            type: 'gameState',
            payload: {
                players: room.players,
                bullets: room.bullets
            }
        };
        broadcast(roomId, JSON.stringify(gameState));
    }
}

function broadcast(roomId, message) {
    if (!rooms[roomId]) return;
    for (const playerId in rooms[roomId].players) {
        const clientWs = clients[playerId];
        if (clientWs && clientWs.readyState === WebSocket.OPEN) {
            clientWs.send(message);
        }
    }
}
