// server.js
// npm i ws uuid
const WebSocket = require('ws');
const { v4: uuidv4 } = require('uuid');

const PORT = process.env.PORT || 8080;
const wss = new WebSocket.Server({ port: PORT });

console.log('WebSocket server listening on port', PORT);

// rooms: { roomId: { players: [ws, ws], createdAt, started } }
const rooms = new Map();

function send(ws, obj) {
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(obj));
  }
}

wss.on('connection', (ws, req) => {
  ws._roomId = null;
  ws._symbol = null;

  ws.on('message', (raw) => {
    let msg;
    try { msg = JSON.parse(raw); } catch(e){ return; }

    switch(msg.type) {
      case 'ping':
        send(ws, { type: 'pong' });
        break;

      case 'create': {
        // gera room id curto
        const roomId = uuidv4().split('-')[0];
        rooms.set(roomId, { players: [ws], started: false, createdAt: Date.now() });
        ws._roomId = roomId;
        ws._symbol = 'X'; // por padrão, criador = X
        send(ws, { type: 'created', room: roomId });
        // envia joined info também
        send(ws, { type: 'joined', room: roomId, symbol: 'X', opponentWaiting: true });
        break;
      }

      case 'join': {
        const roomId = (msg.room||'').trim();
        if (!roomId || !rooms.has(roomId)) {
          send(ws, { type:'error', message:'Sala não encontrada' });
          return;
        }
        const room = rooms.get(roomId);
        if (room.players.length >= 2) {
          send(ws, { type:'error', message:'Sala cheia' });
          return;
        }
        // adiciona segundo jogador
        room.players.push(ws);
        ws._roomId = roomId;
        ws._symbol = 'O';
        // notifica ambos e inicia
        const [p1, p2] = room.players;
        // informa joined
        send(p2, { type:'joined', room: roomId, symbol:'O', opponentWaiting:false });
        // decide quem começa: X (criador) começa
        send(p1, { type:'start', symbol:'X', start:'X' });
        send(p2, { type:'start', symbol:'O', start:'X' });
        room.started = true;
        break;
      }

      case 'move': {
        const roomId = ws._roomId;
        if (!roomId || !rooms.has(roomId)) return;
        const room = rooms.get(roomId);
        // broadcast move para o outro jogador
        for (const p of room.players) {
          if (p !== ws && p.readyState === WebSocket.OPEN) {
            send(p, { type: 'opponent-move', index: msg.index });
          }
        }
        break;
      }

      default:
        // ignore
        break;
    }
  });

  ws.on('close', () => {
    // remove da sala e notifica oponente
    const rid = ws._roomId;
    if (!rid || !rooms.has(rid)) return;
    const room = rooms.get(rid);
    room.players = room.players.filter(p => p !== ws);
    // se sobrou jogador, notificar
    if (room.players.length === 1) {
      const remaining = room.players[0];
      send(remaining, { type: 'opponent-left' });
      // remove sala após notificar
      rooms.delete(rid);
    } else {
      // se não há jogadores, remove
      if (room.players.length === 0) rooms.delete(rid);
    }
  });

});

