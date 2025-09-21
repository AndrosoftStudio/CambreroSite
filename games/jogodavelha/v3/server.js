// server.js
// npm i ws uuid google-auth-library
const WebSocket = require('ws');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs').promises;
const path = require('path');
const { OAuth2Client } = require('google-auth-library');

const PORT = process.env.PORT || 8080;
const wss = new WebSocket.Server({ port: PORT });
const CLIENT_ID = '495059312856-1biaguru6b1u7ojtm5c0ut6gcd5ebimt.apps.googleusercontent.com';
const client = new OAuth2Client(CLIENT_ID);

console.log('WebSocket server listening on port', PORT);

const rooms = new Map();
const users = new Map(); // ws -> {tokenID, username, googleSub}
const queue = []; // Array de ws esperando match
const baseDataPath = path.join(__dirname, 'dados');

async function verifyGoogleToken(token) {
  const ticket = await client.verifyIdToken({ idToken: token, audience: CLIENT_ID });
  return ticket.getPayload();
}

function broadcastOnline() {
  const count = wss.clients.size;
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify({ type: 'online-update', count }));
    }
  });
}

async function saveMatchHistory(tokenID, matchData) {
  const userDir = await getUserDir(tokenID);
  const historyPath = path.join(userDir, 'match_history.json');
  let history = [];
  try {
    history = JSON.parse(await fs.readFile(historyPath, 'utf8'));
  } catch {}
  history.push(matchData);
  await fs.writeFile(historyPath, JSON.stringify(history, null, 2));
}

async function saveFriends(tokenID, friends) {
  const userDir = await getUserDir(tokenID);
  await fs.writeFile(path.join(userDir, 'friends.json'), JSON.stringify(friends, null, 2));
}

async function getUserDir(tokenID) {
  const user = Array.from(users.values()).find(u => u.tokenID === tokenID);
  if (!user) throw new Error('User not found');
  const dir = path.join(baseDataPath, `${user.username}(${tokenID})`);
  await fs.mkdir(dir, { recursive: true });
  return dir;
}

async function saveProfile(tokenID, payload) {
  const userDir = await getUserDir(tokenID);
  await fs.writeFile(path.join(userDir, 'profile.json'), JSON.stringify(payload, null, 2));
}

async function loadFriends(tokenID) {
  try {
    const userDir = await getUserDir(tokenID);
    return JSON.parse(await fs.readFile(path.join(userDir, 'friends.json'), 'utf8')) || [];
  } catch {
    return [];
  }
}

function checkWin(board, sym) {
  const wins = [
    [0,1,2],[3,4,5],[6,7,8],
    [0,3,6],[1,4,7],[2,5,8],
    [0,4,8],[2,4,6]
  ];
  return wins.some(wc => wc.every(i => board[i] === sym));
}

function send(ws, obj) {
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(obj));
  }
}

wss.on('connection', (ws) => {
  ws._roomId = null;
  ws._symbol = null;
  ws._board = Array(9).fill(''); // Board per connection for multiplayer

  ws.on('message', async (raw) => {
    let msg;
    try { msg = JSON.parse(raw); } catch { return; }

    if (msg.type !== 'auth' && msg.type !== 'ping' && msg.type !== 'validate-token') {
      if (!msg.tokenID || !users.has(ws) || users.get(ws).tokenID !== msg.tokenID) {
        return send(ws, { type: 'error', message: 'Invalid token' });
      }
    }

    switch (msg.type) {
      case 'auth':
        try {
          const payload = await verifyGoogleToken(msg.googleToken);
          const tokenID = uuidv4();
          users.set(ws, { tokenID, username: payload.name, googleSub: payload.sub });
          await saveProfile(tokenID, payload);
          send(ws, { type: 'auth-success', tokenID, username: payload.name });
          broadcastOnline();
        } catch (e) {
          send(ws, { type: 'error', message: 'Auth failed' });
        }
        break;
      case 'validate-token':
        if (users.has(ws)) {
          send(ws, { type: 'auth-success', tokenID: msg.tokenID, username: users.get(ws).username });
        } else {
          send(ws, { type: 'error', message: 'Invalid token' });
        }
        break;
      case 'join-queue':
        queue.push(ws);
        if (queue.length >= 2) {
          const [p1, p2] = queue.splice(0, 2);
          const roomId = uuidv4().split('-')[0];
          const room = { players: [p1, p2], started: true, moves: [], board: Array(9).fill('') };
          rooms.set(roomId, room);
          p1._roomId = roomId; p1._symbol = 'X'; p1._board = room.board;
          p2._roomId = roomId; p2._symbol = 'O'; p2._board = room.board;
          send(p1, { type: 'match-found', room: roomId, symbol: 'X', startIsMine: true });
          send(p2, { type: 'match-found', room: roomId, symbol: 'O', startIsMine: false });
        }
        break;
      case 'move':
        const roomId = ws._roomId;
        const room = rooms.get(roomId);
        if (!room || room.board[msg.index] !== '') return;
        room.board[msg.index] = ws._symbol;
        room.moves.push({ player: ws._symbol, index: msg.index });
        room.players.forEach(p => {
          if (p !== ws) send(p, { type: 'opponent-move', index: msg.index });
        });
        if (checkWin(room.board, ws._symbol)) {
          const matchData = { date: new Date(), opponent: users.get(room.players.find(p => p !== ws)).tokenID, moves: room.moves, result: `${ws._symbol} win` };
          await saveMatchHistory(users.get(ws).tokenID, matchData);
          await saveMatchHistory(users.get(room.players.find(p => p !== ws)).tokenID, matchData);
          rooms.delete(roomId);
          return;
        }
        if (room.board.every(x => x !== '')) {
          const matchData = { date: new Date(), opponent: users.get(room.players.find(p => p !== ws)).tokenID, moves: room.moves, result: 'draw' };
          await saveMatchHistory(users.get(ws).tokenID, matchData);
          await saveMatchHistory(users.get(room.players.find(p => p !== ws)).tokenID, matchData);
          rooms.delete(roomId);
          return;
        }
        break;
      case 'add-friend':
        const friendUser = Array.from(users.values()).find(u => u.tokenID === msg.friendToken);
        if (!friendUser) return send(ws, { type: 'error', message: 'Friend not found' });
        let friendsList = await loadFriends(users.get(ws).tokenID);
        if (!friendsList.some(f => f.token === msg.friendToken)) {
          friendsList.push({ token: msg.friendToken, username: friendUser.username });
          await saveFriends(users.get(ws).tokenID, friendsList);
        }
        let friendFriends = await loadFriends(msg.friendToken);
        if (!friendFriends.some(f => f.token === users.get(ws).tokenID)) {
          friendFriends.push({ token: users.get(ws).tokenID, username: users.get(ws).username });
          await saveFriends(msg.friendToken, friendFriends);
        }
        send(ws, { type: 'friends-list', friends: friendsList });
        break;
      case 'get-friends':
        const myFriends = await loadFriends(users.get(ws).tokenID);
        send(ws, { type: 'friends-list', friends: myFriends });
        break;
      case 'ping':
        send(ws, { type: 'pong' });
        break;
      case 'create':
        const roomIdCreate = uuidv4().split('-')[0];
        rooms.set(roomIdCreate, { players: [ws], started: false, createdAt: Date.now(), moves: [], board: Array(9).fill('') });
        ws._roomId = roomIdCreate;
        ws._symbol = 'X';
        ws._board = rooms.get(roomIdCreate).board;
        send(ws, { type: 'created', room: roomIdCreate });
        send(ws, { type: 'joined', room: roomIdCreate, symbol: 'X', opponentWaiting: true });
        break;
      case 'join':
        const roomIdJoin = (msg.room || '').trim();
        if (!roomIdJoin || !rooms.has(roomIdJoin)) {
          send(ws, { type: 'error', message: 'Sala não encontrada' });
          return;
        }
        const roomJoin = rooms.get(roomIdJoin);
        if (roomJoin.players.length >= 2) {
          send(ws, { type: 'error', message: 'Sala cheia' });
          return;
        }
        roomJoin.players.push(ws);
        ws._roomId = roomIdJoin;
        ws._symbol = 'O';
        ws._board = roomJoin.board;
        send(ws, { type: 'joined', room: roomIdJoin, symbol: 'O', opponentWaiting: false });
        const [p1Join, p2Join] = roomJoin.players;
        send(p1Join, { type: 'start', symbol: 'X', start: 'X' });
        send(p2Join, { type: 'start', symbol: 'O', start: 'X' });
        roomJoin.started = true;
        break;
      default:
        break;
    }
  });

  ws.on('close', () => {
    users.delete(ws);
    queue = queue.filter(p => p !== ws);
    const rid = ws._roomId;
    if (rid && rooms.has(rid)) {
      const room = rooms.get(rid);
      room.players = room.players.filter(p => p !== ws);
      if (room.players.length === 1) {
        send(room.players[0], { type: 'opponent-left' });
      }
      rooms.delete(rid);
    }
    broadcastOnline();
  });
});