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

(() => {
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
  let scores = { X:0, O:0, draw:0 };

  // Multiplayer
  let ws = null;
  let wsServer = ''; // string completa: ws://dominio:porta
  let mySymbol = null;
  let myTurn = false;
  let roomId = null;

  // Inicialização UI
  function show(el){ el.classList.remove('hidden'); }
  function hide(el){ el.classList.add('hidden'); }

  btnLocal.addEventListener('click', () => {
    localMode = 'local';
    startLocalGame();
  });

  btnMp.addEventListener('click', () => {
    hide(menu);
    show(menuMp);
  });

  btnBackToMenu.addEventListener('click', () => {
    show(menu);
    hide(menuMp);
  });

  btnBack.addEventListener('click', () => {
    // desconecta se multiplayer
    if (ws) {
      try { ws.close(); } catch(e) {}
      ws = null;
    }
    resetLocalBoard();
    show(menu);
    hide(gamePanel);
    hide(menuMp);
  });

  // Criar sala
  btnCreate.addEventListener('click', async () => {
    wsServer = mpServerInput.value.trim();
    if (!wsServer) {
      createStatus.textContent = 'Informe o servidor (ex: ws://meuservidor.com:8080)';
      return;
    }
    createStatus.textContent = 'Conectando...';
    try {
      await connectWS(wsServer);
      send({ type: 'create' });
      createStatus.textContent = 'Sala criada. Aguardando resposta do servidor...';
    } catch (e) {
      createStatus.textContent = 'Falha ao conectar: ' + (e.message||e);
    }
  });

  // Copiar endereço (mostramos wsServer + roomId)
  copyRoomBtn.addEventListener('click', () => {
    if (!roomId || !wsServer) return;
    const full = `${wsServer}?room=${roomId}`;
    navigator.clipboard.writeText(full).then(() => {
      createStatus.textContent = 'Endereço copiado!';
    });
  });

  // Entrar em sala
  btnJoin.addEventListener('click', async () => {
    wsServer = mpServerInput.value.trim();
    const rid = joinRoomIdInput.value.trim();
    if (!wsServer || !rid) {
      pingStatus.textContent = 'Informe servidor e Room ID';
      return;
    }
    try {
      await connectWS(wsServer);
      send({ type: 'join', room: rid });
      pingStatus.textContent = 'Tentando entrar...';
    } catch (e) {
      pingStatus.textContent = 'Falha ao conectar: ' + (e.message||e);
    }
  });

  // Enquanto digita IP (ou domínio) — fazemos ping WebSocket para medir latência
  let pingTimer = null;
  mpServerInput.addEventListener('input', () => {
    clearTimeout(pingTimer);
    pingStatus.textContent = 'Ping: —';
    pingTimer = setTimeout(() => tryPing(mpServerInput.value.trim()), 350);
  });

  joinRoomIdInput.addEventListener('input', () => {
    // Se já tem servidor preenchido, também pingamos
    clearTimeout(pingTimer);
    pingTimer = setTimeout(() => {
      if (mpServerInput.value.trim()) {
        tryPing(mpServerInput.value.trim());
      }
    }, 350);
  });

  async function tryPing(serverUrl) {
    if (!serverUrl) return;
    pingStatus.textContent = 'Pingando...';
    // cria conexão temporária só para medir RTT
    let temp = null;
    try {
      temp = new WebSocket(serverUrl);
    } catch (e) {
      pingStatus.textContent = 'Erro de conexão';
      return;
    }
    const start = Date.now();
    let responded = false;
    const pingTimeout = setTimeout(() => {
      if (!responded) {
        pingStatus.textContent = 'Sem resposta';
        try { temp.close(); } catch(e) {}
      }
    }, 2000);

    temp.onopen = () => {
      // envia ping e espera pong
      try {
        temp.send(JSON.stringify({ type: 'ping' }));
      } catch(e){}
    };
    temp.onmessage = (ev) => {
      try {
        const msg = JSON.parse(ev.data);
        if (msg.type === 'pong') {
          responded = true;
          const rtt = Date.now() - start;
          pingStatus.textContent = `Ping: ${rtt} ms`;
          clearTimeout(pingTimeout);
          temp.close();
        }
      } catch(e){}
    };
    temp.onerror = () => {
      // fallback
      pingStatus.textContent = 'Erro';
      clearTimeout(pingTimeout);
      try { temp.close(); } catch(e){}
    };
  }

  // Conexão persistente ao servidor WebSocket
  function connectWS(serverUrl) {
    return new Promise((resolve, reject) => {
      if (ws && ws.readyState === WebSocket.OPEN && serverUrl === wsServer) {
        resolve();
        return;
      }
      try {
        ws = new WebSocket(serverUrl);
      } catch (e) {
        reject(e);
        return;
      }
      const onOpen = () => {
        ws.removeEventListener('open', onOpen);
        ws.addEventListener('message', onMessage);
        ws.addEventListener('close', onClose);
        resolve();
      };
      const onErr = (err) => {
        reject(err);
      };
      const onCloseShort = () => { reject(new Error('Fechou antes de abrir')) };
      ws.addEventListener('open', onOpen);
      ws.addEventListener('error', onErr);
      setTimeout(() => {
        if (ws.readyState !== WebSocket.OPEN) {
          // tentar rejeitar
          if (ws.readyState === WebSocket.CLOSED) reject(new Error('Conexão fechada'));
          // caso permaneça pendente, deixa o tempo esgotar
        }
      }, 2500);
    });
  }

  function send(obj) {
    if (!ws || ws.readyState !== WebSocket.OPEN) return;
    ws.send(JSON.stringify(obj));
  }

  function onMessage(ev) {
    let msg;
    try { msg = JSON.parse(ev.data); } catch(e){ return; }
    switch (msg.type) {
      case 'created':
        roomId = msg.room;
        createStatus.textContent = `Sala criada: ${roomId}`;
        roomBlock.classList.remove('hidden');
        roomUrlInput.value = `${wsServer}?room=${roomId}`;
        mpWait.classList.remove('hidden');
        break;
      case 'joined':
        roomId = msg.room;
        mySymbol = msg.symbol; // servidor pode atribuir
        yourSymbolLabel.textContent = mySymbol;
        modeLabel.textContent = 'Multiplayer';
        // Se opponentWaiting true -> aguardando
        if (msg.opponentWaiting) {
          createStatus.textContent = 'Sala criada. Aguardando oponente...';
          mpWait.classList.remove('hidden');
        }
        break;
      case 'start':
        // servidor inicia o jogo, diz qual é o simbolo do cliente e quem começa
        mySymbol = msg.symbol;
        yourSymbolLabel.textContent = mySymbol;
        modeLabel.textContent = 'Multiplayer';
        mpWait.classList.add('hidden');
        startMultiplayerBoard(msg.symbol, msg.start === mySymbol);
        break;
      case 'opponent-move':
        applyOpponentMove(msg.index);
        break;
      case 'opponent-left':
        alert('O oponente saiu.');
        // volta ao menu
        try { ws.close(); } catch(e){}
        ws = null;
        show(menu);
        hide(gamePanel);
        break;
      case 'pong':
        // resposta a ping: nada a fazer (tryPing lida com pongs)
        break;
      case 'error':
        alert('Erro servidor: ' + (msg.message||''));
        break;
    }
  }

  function onClose() {
    //console.log('WS fechado');
    // se está em jogo multiplayer, notificar
    if (localMode === 'multiplayer') {
      mpWait.classList.add('hidden');
      // não auto volta para menu; usuário pode voltar manualmente
    }
  }

  // --- LÓGICA DO JOGO LOCAL (singleplayer / local players) ---
  btnNew.addEventListener('click', () => {
    resetLocalBoard();
  });
  btnResetScore.addEventListener('click', () => {
    scores = { X:0,O:0,draw:0};
    updateScores();
  });

  function startLocalGame() {
    localMode = 'local';
    show(gamePanel);
    hide(menu);
    hide(menuMp);
    modeLabel.textContent = 'Local';
    yourSymbolLabel.textContent = '-';
    mpWait.classList.add('hidden');
    resetLocalBoard();
  }

  function resetLocalBoard() {
    board = Array(9).fill('');
    currentPlayer = 'X';
    gameActive = true;
    cells.forEach(c => { c.textContent=''; c.style.background=''; });
    updateTurnUI();
  }

  cells.forEach(c => c.addEventListener('click', (e) => {
    const idx = parseInt(e.currentTarget.dataset.i, 10);
    if (!gameActive) return;
    if (localMode === 'local') {
      if (board[idx] !== '') return;
      board[idx] = currentPlayer;
      e.currentTarget.textContent = currentPlayer;
      if (checkWinLocal(currentPlayer)) {
        scores[currentPlayer]++;
        gameActive = false;
        setTimeout(() => alert(`${currentPlayer} venceu!`), 10);
        updateScores();
      } else if (board.every(x=>x!=='')) {
        scores.draw++;
        gameActive = false;
        setTimeout(()=>alert('Empate!'),10);
        updateScores();
      } else {
        currentPlayer = currentPlayer === 'X' ? 'O' : 'X';
        updateTurnUI();
      }
    } else if (localMode === 'multiplayer') {
      // multiplayer: envia move ao servidor se for a sua vez
      if (!myTurn) return;
      if (board[idx] !== '') return;
      // faz movimento localmente e envia
      board[idx] = mySymbol;
      updateCellUI(idx, mySymbol);
      send({ type: 'move', index: idx });
      myTurn = false;
      updateTurnUI();
    }
  }));

  function updateCellUI(i, sym) {
    const el = cells[i];
    el.textContent = sym;
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
        // highlight
        wc.forEach(i => cells[i].style.background = '#d4f8d4');
        return true;
      }
    }
    return false;
  }

  // --- MULTIPLAYER FUNCTIONS ---
  function startMultiplayerBoard(symbol, startIsMine) {
    localMode = 'multiplayer';
    show(gamePanel);
    hide(menu);
    hide(menuMp);
    mySymbol = symbol;
    myTurn = startIsMine;
    board = Array(9).fill('');
    gameActive = true;
    cells.forEach(c => { c.textContent=''; c.style.background=''; });
    updateTurnUI();
    modeLabel.textContent = 'Multiplayer';
    yourSymbolLabel.textContent = mySymbol;
    mpWait.classList.add('hidden');
  }

  function applyOpponentMove(index) {
    // oponente jogou; atualiza tabuleiro
    const oppSym = mySymbol === 'X' ? 'O' : 'X';
    board[index] = oppSym;
    updateCellUI(index, oppSym);

    // checa vitória do oponente
    if (checkWinLocal(oppSym)) {
      scores[oppSym]++;
      gameActive = false;
      setTimeout(()=>alert(`${oppSym} venceu!`), 20);
      updateScores();
      return;
    }
    if (board.every(x=>x!=='')) {
      scores.draw++;
      gameActive = false;
      setTimeout(()=>alert('Empate!'),20);
      updateScores();
      return;
    }

    // agora é sua vez
    myTurn = true;
    updateTurnUI();
  }

  // On page load, restore scores if exist
  (function loadScores() {
    try {
      const s = localStorage.getItem('ttt-scores');
      if (s) scores = JSON.parse(s);
      updateScores();
    } catch(e){}
  })();

  // Save scores on unload
  window.addEventListener('beforeunload', () => {
    try { localStorage.setItem('ttt-scores', JSON.stringify(scores)); } catch(e){}
  });

})();
