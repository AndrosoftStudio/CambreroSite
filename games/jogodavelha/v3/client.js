// client.js
// Protocolo WebSocket JSON simples.
// Porta padrão do servidor: 8080 (mude no input se necessário).

/*
 Mensagens trocadas:
 - Cliente -> Servidor:
    { type: "create" }
    { type: "join", room: "ROOMID" }
    { type: "move", index: 4 }
    { type: "ping" } // para medir RTT, servidor responde com pong
 - Servidor -> Cliente:
    { type: "created", room: "ROOMID" }
    { type: "joined", room: "ROOMID", symbol: "O", opponentWaiting: true/false }
    { type: "start", symbol: "X" } // symbol designado para o cliente
    { type: "opponent-move", index: 4 }
    { type: "opponent-left" }
    { type: "pong" }
    { type: "error", message: "..." }
*/

// Adicione vars globais
let tokenID = null;
let username = null;
let googleInitialized = false;
const GOOGLE_CLIENT_ID = '495059312856-1biaguru6b1u7ojtm5c0ut6gcd5ebimt.apps.googleusercontent.com';
let onlineCount = 0;
let currentPing = '--';
let friends = [];

// Cookie functions (from your other site)
function setCookie(name, value, days) {
  let expires = "";
  if (days) {
    const date = new Date();
    date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
    expires = "; expires=" + date.toUTCString();
  }
  document.cookie = `${name}=${value || ""}${expires}; path=/; domain=.cambrero.com; SameSite=Lax`;
}

function getCookie(name) {
  const nameEQ = name + "=";
  const ca = document.cookie.split(';');
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i].trim();
    if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
  }
  return null;
}

// UI elements
const menu = document.getElementById('menu');
const menuMp = document.getElementById('menu-mp');
const gamePanel = document.getElementById('game');

const btnLocal = document.getElementById('btn-local');
const btnMp = document.getElementById('btn-mp');
const btnBackToMenu = document.getElementById('btn-back-to-menu');
const btnBack = document.getElementById('btn-back');

const mpServerInput = document.getElementById('mp-server');
const btnCreate = document.getElementById('btn-create');
const createStatus = document.getElementById('create-status');
const roomBlock = document.getElementById('room-block');
const roomUrlInput = document.getElementById('room-url');
const copyRoomBtn = document.getElementById('copy-room');

const joinRoomIdInput = document.getElementById('join-room-id');
const btnJoin = document.getElementById('btn-join');
const pingStatus = document.getElementById('ping-status');

const boardEl = document.getElementById('board');
const cells = Array.from(document.querySelectorAll('.cell'));
const modeLabel = document.getElementById('mode-label');
const yourSymbolLabel = document.getElementById('your-symbol');
const turnIndicator = document.getElementById('turn-indicator');
const mpWait = document.getElementById('mp-wait');

const btnNew = document.getElementById('btn-new');
const btnResetScore = document.getElementById('btn-reset-score');
const scoreX = document.getElementById('scoreX');
const scoreO = document.getElementById('scoreO');
const scoreDraw = document.getElementById('scoreDraw');

// Estado do jogo
let localMode = 'local'; // 'local' ou 'multiplayer'
let board = Array(9).fill('');
let currentPlayer = 'X';
let gameActive = true;
let mySymbol = null;
let myTurn = false;
let roomId = null;
let ws = null;

// Scores
let scores = { X: 0, O: 0, draw: 0 };

// Funções util
function show(el) { el.classList.remove('hidden'); }
function hide(el) { el.classList.add('hidden'); }

// Funções de auth
function initGoogleAuth() {
  if (googleInitialized) return;
  googleInitialized = true;
  google.accounts.id.initialize({
    client_id: GOOGLE_CLIENT_ID,
    callback: handleGoogleResponse
  });
  google.accounts.id.renderButton(
    document.getElementById('google-login'),
    { theme: 'outline', size: 'large' }
  );
}

function handleGoogleResponse(response) {
  send({ type: 'auth', googleToken: response.credential });
}

function logout() {
  google.accounts.id.revoke(tokenID, () => {});
  tokenID = null;
  username = null;
  setCookie('tokenID', '', -1);
  show(document.getElementById('login-section'));
  hide(document.getElementById('profile-section'));
}

// Conexão auto ao WS
let wsServer = 'ws://' + location.hostname + (location.port ? ':' + location.port : '') + '/'; // Auto detect
ws = new WebSocket(wsServer);
ws.onopen = () => {
  console.log('Connected');
  checkAuth();
  startPing();
};

ws.onmessage = (event) => {
  const msg = JSON.parse(event.data);
  switch (msg.type) {
    case 'auth-success':
      tokenID = msg.tokenID;
      username = msg.username;
      setCookie('tokenID', tokenID, 365);
      document.getElementById('username').textContent = username;
      hide(document.getElementById('login-section'));
      show(document.getElementById('profile-section'));
      loadFriends();
      break;
    case 'online-update':
      onlineCount = msg.count;
      updateStatus();
      break;
    case 'pong':
      currentPing = Date.now() - pingStart;
      updateStatus();
      break;
    case 'match-found':
      startMultiplayerBoard(msg.symbol, msg.startIsMine);
      roomId = msg.room;
      break;
    case 'friends-list':
      friends = msg.friends;
      updateFriendsUI();
      break;
    case 'created':
      createStatus.textContent = 'Sala criada: ' + msg.room;
      roomUrlInput.value = window.location.origin + '?room=' + msg.room;
      show(roomBlock);
      break;
    case 'joined':
      // Handle joined
      break;
    case 'start':
      mySymbol = msg.symbol;
      myTurn = msg.start === mySymbol;
      updateTurnUI();
      break;
    case 'opponent-move':
      applyOpponentMove(msg.index);
      break;
    case 'opponent-left':
      alert('Oponente saiu');
      gameActive = false;
      break;
    case 'error':
      alert(msg.message);
      break;
  }
};

ws.onclose = () => {
  console.log('Disconnected');
};

// Checa auth via cookie
function checkAuth() {
  tokenID = getCookie('tokenID');
  if (tokenID) {
    send({ type: 'validate-token', tokenID });
  } else {
    initGoogleAuth();
    show(document.getElementById('login-section'));
  }
}

// Ping
let pingStart;
function startPing() {
  setInterval(() => {
    pingStart = Date.now();
    send({ type: 'ping' });
  }, 5000);
}

function updateStatus() {
  document.getElementById('online-status').textContent = `Online: ${onlineCount} | Ping: ${currentPing} ms`;
}

// Matchmaking
document.getElementById('queue-btn').addEventListener('click', () => {
  if (!tokenID) return alert('Faça login primeiro');
  send({ type: 'join-queue' });
});

// Friends
document.getElementById('add-friend').addEventListener('click', () => {
  const friendToken = document.getElementById('add-friend-token').value;
  send({ type: 'add-friend', friendToken });
});

function loadFriends() {
  send({ type: 'get-friends' });
}

function updateFriendsUI() {
  const list = document.getElementById('friends-list');
  list.innerHTML = friends.map(f => `<li>${f.username} (${f.token})</li>`).join('');
}

// Send with token
function send(obj) {
  if (tokenID) obj.tokenID = tokenID;
  ws.send(JSON.stringify(obj));
}

// Event listeners (local game, etc.)
btnLocal.addEventListener('click', () => {
  localMode = 'local';
  show(gamePanel);
  hide(menu);
  hide(menuMp);
  resetBoard();
  modeLabel.textContent = 'Local';
  yourSymbolLabel.textContent = '-';
  updateTurnUI();
});

btnMp.addEventListener('click', () => {
  show(menuMp);
  hide(menu);
});

btnBackToMenu.addEventListener('click', () => {
  show(menu);
  hide(menuMp);
});

btnBack.addEventListener('click', () => {
  show(menu);
  hide(gamePanel);
  if (localMode === 'multiplayer') {
    send({ type: 'leave-room' });
  }
});

btnCreate.addEventListener('click', () => {
  send({ type: 'create' });
});

btnJoin.addEventListener('click', () => {
  const room = joinRoomIdInput.value.trim();
  if (room) send({ type: 'join', room });
});

cells.forEach(cell => cell.addEventListener('click', (e) => {
  const i = parseInt(e.target.dataset.index);
  if (localMode === 'local') {
    if (board[i] || !gameActive) return;
    board[i] = currentPlayer;
    updateCellUI(i, currentPlayer);
    if (checkWinLocal(currentPlayer)) {
      scores[currentPlayer]++;
      gameActive = false;
      setTimeout(() => alert(`${currentPlayer} venceu!`), 20);
      updateScores();
      return;
    }
    if (board.every(x => x !== '')) {
      scores.draw++;
      gameActive = false;
      setTimeout(() => alert('Empate!'), 20);
      updateScores();
      return;
    }
    currentPlayer = currentPlayer === 'X' ? 'O' : 'X';
    updateTurnUI();
  } else if (myTurn && board[i] === '' && gameActive) {
    board[i] = mySymbol;
    updateCellUI(i, mySymbol);
    send({ type: 'move', index: i });
    myTurn = false;
    updateTurnUI();
  }
}));

btnNew.addEventListener('click', resetBoard);

btnResetScore.addEventListener('click', () => {
  scores = { X: 0, O: 0, draw: 0 };
  updateScores();
});

document.getElementById('logout').addEventListener('click', logout);

// Funções auxiliares
function resetBoard() {
  board = Array(9).fill('');
  gameActive = true;
  cells.forEach(c => { c.textContent = ''; c.style.background = ''; });
  currentPlayer = 'X';
  updateTurnUI();
}

function updateCellUI(i, sym) {
  cells[i].textContent = sym;
}

function updateScores() {
  scoreX.textContent = scores.X;
  scoreO.textContent = scores.O;
  scoreDraw.textContent = scores.draw;
}

function updateTurnUI() {
  turnIndicator.textContent = gameActive ? (localMode === 'local' ? currentPlayer : (myTurn ? 'Sua vez' : 'Vez do oponente')) : '—';
  yourSymbolLabel.textContent = mySymbol || '-';
}

function checkWinLocal(sym) {
  const wins = [
    [0,1,2],[3,4,5],[6,7,8],
    [0,3,6],[1,4,7],[2,5,8],
    [0,4,8],[2,4,6]
  ];
  for (const wc of wins) {
    if (wc.every(i => board[i] === sym)) {
      wc.forEach(i => cells[i].style.background = '#d4f8d4');
      return true;
    }
  }
  return false;
}

function startMultiplayerBoard(symbol, startIsMine) {
  localMode = 'multiplayer';
  show(gamePanel);
  hide(menu);
  hide(menuMp);
  mySymbol = symbol;
  myTurn = startIsMine;
  resetBoard();
  modeLabel.textContent = 'Multiplayer';
  yourSymbolLabel.textContent = mySymbol;
  mpWait.classList.add('hidden');
}

function applyOpponentMove(index) {
  const oppSym = mySymbol === 'X' ? 'O' : 'X';
  board[index] = oppSym;
  updateCellUI(index, oppSym);
  if (checkWinLocal(oppSym)) {
    scores[oppSym]++;
    gameActive = false;
    setTimeout(() => alert(`${oppSym} venceu!`), 20);
    updateScores();
    return;
  }
  if (board.every(x => x !== '')) {
    scores.draw++;
    gameActive = false;
    setTimeout(() => alert('Empate!'), 20);
    updateScores();
    return;
  }
  myTurn = true;
  updateTurnUI();
}

// Load scores
(function loadScores() {
  try {
    const s = localStorage.getItem('ttt-scores');
    if (s) scores = JSON.parse(s);
    updateScores();
  } catch {}
})();

// Save scores on unload
window.addEventListener('beforeunload', () => {
  try { localStorage.setItem('ttt-scores', JSON.stringify(scores)); } catch {}
});