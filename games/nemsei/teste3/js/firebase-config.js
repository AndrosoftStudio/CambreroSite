// Import Firebase com configurações corretas
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-app.js";
import { 
    getAuth, 
    signInWithPopup, 
    GoogleAuthProvider, 
    signOut, 
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.0.0/firebase-auth.js";
import { 
    getFirestore, 
    doc, 
    setDoc, 
    getDoc, 
    updateDoc, 
    deleteDoc,
    collection, 
    addDoc,
    query, 
    where, 
    orderBy,
    limit,
    onSnapshot, 
    serverTimestamp,
    getDocs
} from "https://www.gstatic.com/firebasejs/10.0.0/firebase-firestore.js";

// Configuração do Firebase
const firebaseConfig = {
    apiKey: "AIzaSyCFv6rHPSRLHvZ1OmZqroeSU3A3_VYZDV4",
    authDomain: "nemsei-c5e83.firebaseapp.com",
    projectId: "nemsei-c5e83",
    storageBucket: "nemsei-c5e83.firebasestorage.app",
    messagingSenderId: "866918578524",
    appId: "1:866918578524:web:8fbd112e59e50a7bb6e999",
    measurementId: "G-84P45Q6TQ4"
};

// Inicializar Firebase
console.log('🔥 Inicializando Firebase...');
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Estado do jogo
let gameState = {
    user: null,
    currentMatch: null,
    gameMode: null,
    gameType: null,
    queueStartTime: null,
    queueId: null,
    onlinePlayersCount: 0,
    queueCount: 0,
    matchmakingListener: null,
    initialized: false
};

// Sistema de jogo completo
let gameLoop = null;
let gameCanvas = null;
let gameCtx = null;
let gameRunning = false;
let joystick = null;
let keys = {};
const player = {
    id: "player",
    x: 200,
    y: 350,
    radius: 20,
    speed: 5,
    color: '#667eea',
    health: 100,
    mana: 100,
    score: 0
};

// Jogadores (exemplo com um inimigo)
const players = [
    {
        id: "enemy",
        x: 800,
        y: 350,
        radius: 20,
        speed: 3,
        color: '#ff5252',
        health: 100,
        mana: 100,
        score: 0
    }
];

// Classe para projéteis
class Projectile {
    constructor(x, y, targetX, targetY, speed, damage) {
        this.x = x;
        this.y = y;
        this.targetX = targetX;
        this.targetY = targetY;
        this.speed = speed;
        this.damage = damage;
        this.radius = 5;
        this.color = '#ff5252';
        
        // Calcular direção
        const angle = Math.atan2(targetY - y, targetX - x);
        this.velocity = {
            x: Math.cos(angle) * speed,
            y: Math.sin(angle) * speed
        };
    }
    
    update() {
        this.x += this.velocity.x;
        this.y += this.velocity.y;
    }
    
    draw() {
        gameCtx.beginPath();
        gameCtx.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
        gameCtx.fillStyle = this.color;
        gameCtx.fill();
    }
}

const projectiles = [];

// Configurar provedor do Google
const provider = new GoogleAuthProvider();
provider.addScope('profile');
provider.addScope('email');
provider.setCustomParameters({
    'prompt': 'select_account'
});

// Login com Google
async function loginWithGoogle() {
    try {
        console.log('🔐 Iniciando login com Google...');
        showMessage('Conectando com Google...', 'info');
        
        const result = await signInWithPopup(auth, provider);
        const user = result.user;
        
        console.log('✅ Login bem-sucedido:', user.displayName);
        
        // Verificar se é novo usuário e criar documento
        const userDocRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userDocRef);
        
        if (!userDoc.exists()) {
            console.log('👤 Criando novo usuário no banco...');
            await setDoc(userDocRef, {
                uid: user.uid,
                displayName: user.displayName,
                email: user.email,
                photoURL: user.photoURL,
                createdAt: serverTimestamp(),
                rank: 'Bronze I',
                trophies: 0,
                wins: 0,
                losses: 0,
                totalGames: 0,
                isOnline: true,
                lastActive: serverTimestamp(),
                region: 'BR'
            });
        } else {
            // Atualizar status online
            await updateDoc(userDocRef, {
                isOnline: true,
                lastActive: serverTimestamp()
            });
        }
        
        showMessage('Login realizado com sucesso!', 'success');
        
    } catch (error) {
        console.error('❌ Erro no login:', error);
        
        let errorMessage = 'Erro desconhecido no login';
        
        switch (error.code) {
            case 'auth/popup-closed-by-user':
                errorMessage = 'Login cancelado pelo usuário';
                break;
            case 'auth/popup-blocked':
                errorMessage = 'Popup bloqueado pelo navegador. Permita popups para este site.';
                break;
            case 'auth/cancelled-popup-request':
                errorMessage = 'Múltiplas tentativas de login detectadas';
                break;
            case 'auth/network-request-failed':
                errorMessage = 'Erro de rede. Verifique sua conexão.';
                break;
            case 'auth/internal-error':
                errorMessage = 'Erro interno. Tente novamente.';
                break;
            default:
                errorMessage = error.message || 'Erro no login';
                break;
        }
        
        showMessage(errorMessage, 'error');
    }
}

// Configurar event listener do botão de login
document.getElementById('googleLoginBtn').addEventListener('click', loginWithGoogle);

// Monitor de estado de autenticação
onAuthStateChanged(auth, async (user) => {
    console.log('🔄 Estado de autenticação mudou:', user ? user.displayName : 'nenhum usuário');
    
    if (user) {
        gameState.user = user;
        await updateUserProfile(user);
        await setUserOnline(true);
        showMainMenu();
    } else {
        if (gameState.user) {
            await setUserOnline(false);
            await cleanupQueue();
        }
        gameState.user = null;
        showLoginScreen();
    }
});

// Atualizar perfil do usuário
async function updateUserProfile(user) {
    try {
        const userDocRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userDocRef);
        
        if (userDoc.exists()) {
            const userData = userDoc.data();
            gameState.user = { ...user, ...userData };
            
            // Atualizar UI
            document.getElementById('welcomeUser').textContent = `Bem-vindo, ${user.displayName}!`;
            document.getElementById('userRank').textContent = userData.rank || 'Bronze I';
            document.getElementById('userTrophies').textContent = `${userData.trophies || 0} 🏆`;
            
            // Atualizar foto do perfil
            const profileImg = document.getElementById('profileImg');
            const profilePlaceholder = document.getElementById('profilePlaceholder');
            
            if (user.photoURL) {
                profileImg.src = user.photoURL;
                profileImg.style.display = 'block';
                profilePlaceholder.style.display = 'none';
            } else {
                profileImg.style.display = 'none';
                profilePlaceholder.style.display = 'flex';
            }
            
            document.getElementById('profileBtn').style.display = 'block';
            document.getElementById('logoutBtn').style.display = 'block';
        }
    } catch (error) {
        console.error('❌ Erro ao carregar perfil:', error);
    }
}

// Definir status online/offline
async function setUserOnline(isOnline) {
    if (gameState.user) {
        try {
            const userDocRef = doc(db, 'users', gameState.user.uid);
            await updateDoc(userDocRef, {
                isOnline: isOnline,
                lastActive: serverTimestamp()
            });
        } catch (error) {
            console.error('❌ Erro ao atualizar status:', error);
        }
    }
}

// Sistema de matchmaking melhorado
let matchmakingTimeout = null;
let queueTimer = null;
let botsTimeout = null;

async function startMatchmaking(mode, type) {
    if (!gameState.user) {
        showNotification('Você precisa estar logado para jogar!', 'error');
        return;
    }

    console.log(`🎯 Iniciando matchmaking: ${mode} ${type}`);
    
    gameState.gameMode = mode;
    gameState.gameType = type;
    gameState.queueStartTime = Date.now();
    
    showMatchmakingScreen();
    updateMatchmakingUI();
    
    try {
        // Limpar qualquer entrada anterior na fila
        await cleanupQueue();
        
        // Adicionar à fila de matchmaking
        const queueRef = doc(collection(db, 'matchmaking_queue'));
        const queueData = {
            userId: gameState.user.uid,
            displayName: gameState.user.displayName,
            rank: gameState.user.rank || 'Bronze I',
            trophies: gameState.user.trophies || 0,
            mode: mode,
            type: type,
            timestamp: serverTimestamp(),
            status: 'waiting',
            region: 'BR'
        };
        
        await setDoc(queueRef, queueData);
        gameState.queueId = queueRef.id;
        
        console.log(`✅ Adicionado à fila com ID: ${queueRef.id}`);
        
        // Configurar timeouts baseados no tipo
        if (type === 'casual') {
            // Casual: bots após 30 segundos
            botsTimeout = setTimeout(() => {
                console.log('⏰ Timeout casual - iniciando com bots');
                updateMatchmakingStatus('Nenhum jogador encontrado. Iniciando com bots...');
                setTimeout(() => startGameWithBots(), 2000);
            }, 30000);
        } else {
            // Competitivo: apenas mensagem de espera, sem bots
            setTimeout(() => {
                if (!document.getElementById('matchmakingScreen').classList.contains('hidden')) {
                    updateMatchmakingStatus('Procure ser paciente. Modo competitivo não usa bots.');
                }
            }, 30000);
            
            // Timeout muito longo para competitivo (10 minutos)
            matchmakingTimeout = setTimeout(() => {
                console.log('⏰ Timeout competitivo - cancelando');
                cancelMatchmaking('Não foi possível encontrar jogadores. Tente novamente mais tarde.');
            }, 600000); // 10 minutos
        }
        
        // Começar a procurar por partidas
        await findMatch();
        
    } catch (error) {
        console.error('❌ Erro ao iniciar matchmaking:', error);
        showNotification('Erro ao procurar partida: ' + error.message, 'error');
        showMainMenu();
    }
}

async function findMatch() {
    try {
        const maxPlayers = parseInt(gameState.gameMode.charAt(0)) * 2;
        
        console.log(`🔍 Procurando ${maxPlayers} jogadores para ${gameState.gameMode} ${gameState.gameType}`);
        
        // Query para encontrar jogadores compatíveis
        const matchQuery = query(
            collection(db, 'matchmaking_queue'),
            where('mode', '==', gameState.gameMode),
            where('type', '==', gameState.gameType),
            where('status', '==', 'waiting'),
            orderBy('timestamp'),
            limit(maxPlayers)
        );
        
        // Escutar mudanças na fila
        gameState.matchmakingListener = onSnapshot(matchQuery, async (snapshot) => {
            const players = [];
            snapshot.forEach(doc => {
                const data = doc.data();
                players.push({
                    id: doc.id,
                    ...data
                });
            });
            
            console.log(`👥 Jogadores na fila: ${players.length}/${maxPlayers}`);
            updatePlayersFound(players, maxPlayers);
            
            if (players.length >= maxPlayers) {
                console.log('🎉 Jogadores suficientes encontrados!');
                
                // Parar de escutar a fila
                if (gameState.matchmakingListener) {
                    gameState.matchmakingListener();
                    gameState.matchmakingListener = null;
                }
                
                // Cancelar timeouts
                if (botsTimeout) {
                    clearTimeout(botsTimeout);
                    botsTimeout = null;
                }
                if (matchmakingTimeout) {
                    clearTimeout(matchmakingTimeout);
                    matchmakingTimeout = null;
                }
                
                updateMatchmakingStatus('Todos os jogadores encontrados! Iniciando partida...');
                
                // Aguardar um pouco e iniciar jogo
                setTimeout(() => {
                    startGame();
                }, 3000);
            }
        }, (error) => {
            console.error('❌ Erro ao escutar fila:', error);
            cancelMatchmaking('Erro na busca por jogadores');
        });
        
    } catch (error) {
        console.error('❌ Erro ao procurar partida:', error);
        cancelMatchmaking('Erro ao procurar partida');
    }
}

function updateMatchmakingUI() {
    document.getElementById('currentMode').textContent = gameState.gameMode;
    document.getElementById('currentType').textContent = 
        gameState.gameType === 'competitive' ? 'Competitivo' : 'Casual';
    
    // Criar slots de jogadores
    const maxPlayers = parseInt(gameState.gameMode.charAt(0)) * 2;
    const playersFoundDiv = document.getElementById('playersFound');
    playersFoundDiv.innerHTML = '';
    
    for (let i = 0; i < maxPlayers; i++) {
        const slot = document.createElement('div');
        slot.className = 'player-slot';
        slot.id = `player-slot-${i}`;
        slot.textContent = '?';
        playersFoundDiv.appendChild(slot);
    }
    
    // Timer da fila
    startQueueTimer();
}

function updateMatchmakingStatus(message) {
    const statusElement = document.getElementById('matchmakingStatus');
    if (statusElement) {
        statusElement.textContent = message;
    }
}

function startQueueTimer() {
    if (queueTimer) clearInterval(queueTimer);
    
    queueTimer = setInterval(() => {
        if (gameState.queueStartTime && !document.getElementById('matchmakingScreen').classList.contains('hidden')) {
            const elapsed = Math.floor((Date.now() - gameState.queueStartTime) / 1000);
            document.getElementById('queueTime').textContent = `${elapsed}s`;
            document.getElementById('estimatedPing').textContent = '~50ms';
            
            // Avisos baseados no tempo para modo casual
            if (gameState.gameType === 'casual') {
                if (elapsed === 20) {
                    updateMatchmakingStatus('Procurando jogadores... (bots em 10s)');
                } else if (elapsed === 25) {
                    updateMatchmakingStatus('Procurando jogadores... (bots em 5s)');
                }
            }
        } else {
            clearInterval(queueTimer);
            queueTimer = null;
        }
    }, 1000);
}

function updatePlayersFound(players, maxPlayers) {
    // Limpar slots
    for (let i = 0; i < maxPlayers; i++) {
        const slot = document.getElementById(`player-slot-${i}`);
        if (slot) {
            slot.classList.remove('filled', 'bot');
            slot.textContent = '?';
            slot.title = '';
        }
    }
    
    // Preencher com jogadores encontrados
    players.forEach((player, index) => {
        const slot = document.getElementById(`player-slot-${index}`);
        if (slot) {
            slot.classList.add('filled');
            slot.textContent = player.displayName.charAt(0).toUpperCase();
            slot.title = `${player.displayName} (${player.rank || 'Bronze I'})`;
        }
    });
    
    updateMatchmakingStatus(`${players.length}/${maxPlayers} jogadores encontrados`);
}

function startGameWithBots() {
    try {
        console.log('🤖 Iniciando jogo com bots...');
        
        const maxPlayers = parseInt(gameState.gameMode.charAt(0)) * 2;
        
        // Cancelar listeners e timeouts
        if (gameState.matchmakingListener) {
            gameState.matchmakingListener();
            gameState.matchmakingListener = null;
        }
        
        if (botsTimeout) {
            clearTimeout(botsTimeout);
            botsTimeout = null;
        }
        
        // Preencher slots com bots
        for (let i = 1; i < maxPlayers; i++) {
            const slot = document.getElementById(`player-slot-${i}`);
            if (slot && !slot.classList.contains('filled')) {
                slot.classList.add('filled', 'bot');
                slot.textContent = '🤖';
                slot.title = `Bot ${i}`;
            }
        }
        
        // Limpar fila
        cleanupQueue();
        
        setTimeout(() => {
            startGame();
        }, 2000);
        
    } catch (error) {
        console.error('❌ Erro ao iniciar jogo com bots:', error);
        showNotification('Erro ao iniciar jogo', 'error');
        showMainMenu();
    }
}

async function cancelMatchmaking(message = 'Busca cancelada') {
    try {
        console.log('❌ Cancelando matchmaking...');
        
        // Parar listeners
        if (gameState.matchmakingListener) {
            gameState.matchmakingListener();
            gameState.matchmakingListener = null;
        }
        
        // Cancelar timeouts
        if (matchmakingTimeout) {
            clearTimeout(matchmakingTimeout);
            matchmakingTimeout = null;
        }
        
        if (botsTimeout) {
            clearTimeout(botsTimeout);
            botsTimeout = null;
        }
        
        if (queueTimer) {
            clearInterval(queueTimer);
            queueTimer = null;
        }
        
        // Limpar fila
        await cleanupQueue();
        
        // Resetar estado
        gameState.queueStartTime = null;
        gameState.gameMode = null;
        gameState.gameType = null;
        
        showMainMenu();
        if (message !== 'Busca cancelada') {
            showNotification(message, 'warning');
        }
        
    } catch (error) {
        console.error('❌ Erro ao cancelar matchmaking:', error);
        showMainMenu();
    }
}

async function cleanupQueue() {
    if (gameState.queueId) {
        try {
            await deleteDoc(doc(db, 'matchmaking_queue', gameState.queueId));
            console.log('🧹 Entrada da fila removida');
        } catch (error) {
            console.error('❌ Erro ao limpar fila:', error);
        }
        gameState.queueId = null;
    }
}

// Sistema de jogo simplificado
function startGame() {
    console.log('🚀 Iniciando jogo...');
    
    // Cancelar todos os timeouts e listeners do matchmaking
    if (matchmakingTimeout) {
        clearTimeout(matchmakingTimeout);
        matchmakingTimeout = null;
    }
    
    if (botsTimeout) {
        clearTimeout(botsTimeout);
        botsTimeout = null;
    }
    
    if (queueTimer) {
        clearInterval(queueTimer);
        queueTimer = null;
    }
    
    if (gameState.matchmakingListener) {
        gameState.matchmakingListener();
        gameState.matchmakingListener = null;
    }
    
    showGameScreen();
    initializeGame();
}

function initializeGame() {
    gameCanvas = document.getElementById('gameCanvas');
    gameCtx = gameCanvas.getContext('2d');
    gameRunning = true;
    
    // Ajustar tamanho do canvas responsivamente
    resizeCanvas();
    
    // Configurar controles
    setupControls();
    
    // Mostrar controles mobile se necessário
    if (window.innerWidth <= 768) {
        document.getElementById('mobileControls').style.display = 'flex';
    }
    
    // Iniciar loop do jogo
    startGameLoop();
    
    // Limpar entrada da fila
    cleanupQueue();
    
    showNotification(`Jogo ${gameState.gameType} iniciado!`, 'success');
    console.log('✅ Jogo inicializado!');
}

function setupControls() {
    // Controles de teclado
    window.addEventListener('keydown', (e) => {
        keys[e.key] = true;
    });
    
    window.addEventListener('keyup', (e) => {
        keys[e.key] = false;
    });
    
    // Controles touch para mobile
    if (window.innerWidth <= 768) {
        // Joystick virtual
        const joystickContainer = document.createElement('div');
        joystickContainer.style.position = 'fixed';
        joystickContainer.style.bottom = '100px';
        joystickContainer.style.left = '50px';
        joystickContainer.style.width = '150px';
        joystickContainer.style.height = '150px';
        joystickContainer.style.zIndex = '1000';
        document.body.appendChild(joystickContainer);
        
        joystick = nipplejs.create({
            zone: joystickContainer,
            mode: 'static',
            position: { left: '50%', top: '50%' },
            color: 'blue',
            size: 100
        });
        
        // Botão de ataque
        document.getElementById('attackBtn').addEventListener('touchstart', attackAction);
        document.getElementById('specialBtn').addEventListener('touchstart', useSpecial);
    }
}

function resizeCanvas() {
    if (!gameCanvas) return;
    
    const maxWidth = Math.min(window.innerWidth - 40, 1000);
    const maxHeight = Math.min(window.innerHeight - 200, 600);
    
    // Manter proporção 5:3
    const aspectRatio = 5/3;
    
    if (maxWidth / aspectRatio <= maxHeight) {
        gameCanvas.width = maxWidth;
        gameCanvas.height = maxWidth / aspectRatio;
    } else {
        gameCanvas.height = maxHeight;
        gameCanvas.width = maxHeight * aspectRatio;
    }
}

function startGameLoop() {
    let lastTime = 0;
    const fps = 60;
    const frameTime = 1000 / fps;
    
    function gameLoopFunction(currentTime) {
        if (!gameRunning || document.getElementById('gameContainer').style.display === 'none') {
            return;
        }
        
        if (currentTime - lastTime >= frameTime) {
            updateGame();
            renderGame();
            lastTime = currentTime;
        }
        
        gameLoop = requestAnimationFrame(gameLoopFunction);
    }
    
    gameLoop = requestAnimationFrame(gameLoopFunction);
}

function updateGame() {
    // Atualizar movimento do jogador
    if (joystick && joystick.force > 0) {
        const angle = joystick.angle.radian;
        player.x += Math.cos(angle) * player.speed * joystick.force;
        player.y += Math.sin(angle) * player.speed * joystick.force;
    } else {
        // Controles de teclado
        if (keys['w'] || keys['ArrowUp']) player.y -= player.speed;
        if (keys['s'] || keys['ArrowDown']) player.y += player.speed;
        if (keys['a'] || keys['ArrowLeft']) player.x -= player.speed;
        if (keys['d'] || keys['ArrowRight']) player.x += player.speed;
    }
    
    // Manter jogador dentro dos limites
    player.x = Math.max(player.radius, Math.min(gameCanvas.width - player.radius, player.x));
    player.y = Math.max(player.radius, Math.min(gameCanvas.height - player.radius, player.y));
    
    // Atualizar inimigos (movimento simples)
    players.forEach(enemy => {
        // Movimento aleatório para inimigos
        if (Math.random() < 0.02) {
            enemy.x += (Math.random() - 0.5) * enemy.speed * 2;
            enemy.y += (Math.random() - 0.5) * enemy.speed * 2;
        }
        
        // Manter inimigos dentro dos limites
        enemy.x = Math.max(enemy.radius, Math.min(gameCanvas.width - enemy.radius, enemy.x));
        enemy.y = Math.max(enemy.radius, Math.min(gameCanvas.height - enemy.radius, enemy.y));
    });
    
    // Atualizar projéteis
    for (let i = projectiles.length - 1; i >= 0; i--) {
        projectiles[i].update();
        
        // Remover projéteis fora da tela
        if (projectiles[i].x < 0 || projectiles[i].x > gameCanvas.width || 
            projectiles[i].y < 0 || projectiles[i].y > gameCanvas.height) {
            projectiles.splice(i, 1);
        }
    }
}

function renderGame() {
    if (!gameCtx || !gameCanvas) return;
    
    const width = gameCanvas.width;
    const height = gameCanvas.height;
    
    // Limpar canvas com gradiente
    const gradient = gameCtx.createRadialGradient(width/2, height/2, 0, width/2, height/2, Math.max(width, height));
    gradient.addColorStop(0, '#1a202c');
    gradient.addColorStop(1, '#0f1419');
    gameCtx.fillStyle = gradient;
    gameCtx.fillRect(0, 0, width, height);
    
    // Desenhar grid
    drawGrid();
    
    // Desenhar elementos do jogo
    drawGameElements(width, height);
    
    // Desenhar jogadores
    drawPlayer(player);
    players.forEach(p => drawPlayer(p));
    
    // Desenhar projéteis
    projectiles.forEach(projectile => projectile.draw());
    
    // Desenhar UI
    drawGameInfo();
}

function drawGrid() {
    const width = gameCanvas.width;
    const height = gameCanvas.height;
    
    gameCtx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    gameCtx.lineWidth = 1;
    
    const gridSize = 40;
    
    for (let x = 0; x < width; x += gridSize) {
        gameCtx.beginPath();
        gameCtx.moveTo(x, 0);
        gameCtx.lineTo(x, height);
        gameCtx.stroke();
    }
    
    for (let y = 0; y < height; y += gridSize) {
        gameCtx.beginPath();
        gameCtx.moveTo(0, y);
        gameCtx.lineTo(width, y);
        gameCtx.stroke();
    }
}

function drawGameElements(width, height) {
    // Bases
    drawBase(80, height/2, 'blue');
    drawBase(width - 80, height/2, 'red');
    
    // Pontos de extração no centro
    for (let i = 1; i <= 3; i++) {
        const x = (width / 4) * i;
        const y = height/2 + Math.sin(Date.now() / 1000 + i) * 30;
        drawExtractionPoint(x, y);
    }
}

function drawPlayer(character) {
    const size = character.radius;
    
    // Sombra
    gameCtx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    gameCtx.beginPath();
    gameCtx.arc(character.x + 2, character.y + 2, size, 0, Math.PI * 2);
    gameCtx.fill();
    
    // Jogador
    const gradient = gameCtx.createRadialGradient(
        character.x, character.y, 0,
        character.x, character.y, size
    );
    gradient.addColorStop(0, character.color);
    gradient.addColorStop(1, character.color.replace(')', ', 0.8)').replace('rgb', 'rgba'));
    gameCtx.fillStyle = gradient;
    gameCtx.beginPath();
    gameCtx.arc(character.x, character.y, size, 0, Math.PI * 2);
    gameCtx.fill();
    
    // Borda
    gameCtx.strokeStyle = 'white';
    gameCtx.lineWidth = 2;
    gameCtx.stroke();
    
    // Nome
    if (character.id === "player") {
        gameCtx.fillStyle = 'white';
        gameCtx.font = 'bold 14px Arial';
        gameCtx.textAlign = 'center';
        gameCtx.strokeStyle = 'black';
        gameCtx.lineWidth = 3;
        gameCtx.strokeText(gameState.user?.displayName || 'Jogador', character.x, character.y - size - 10);
        gameCtx.fillText(gameState.user?.displayName || 'Jogador', character.x, character.y - size - 10);
    }
}

function drawBase(x, y, team) {
    const size = 25;
    
    // Sombra
    gameCtx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    gameCtx.fillRect(x - size + 2, y - size + 2, size * 2, size * 2);
    
    // Base
    gameCtx.fillStyle = team === 'blue' ? '#4299e1' : '#e53e3e';
    gameCtx.fillRect(x - size, y - size, size * 2, size * 2);
    
    // Borda decorativa
    gameCtx.strokeStyle = team === 'blue' ? '#63b3ed' : '#fc8181';
    gameCtx.lineWidth = 2;
    gameCtx.strokeRect(x - size, y - size, size * 2, size * 2);
    
    // Detalhes
    gameCtx.fillStyle = 'rgba(255, 255, 255, 0.2)';
    gameCtx.fillRect(x - size + 5, y - size + 5, size * 2 - 10, size * 2 - 10);
    
    // Texto
    gameCtx.fillStyle = 'white';
    gameCtx.font = 'bold 12px Arial';
    gameCtx.textAlign = 'center';
    gameCtx.fillText('BASE', x, y + size + 15);
}

function drawExtractionPoint(x, y) {
    // Área de extração
    gameCtx.fillStyle = 'rgba(72, 187, 120, 0.2)';
    gameCtx.beginPath();
    gameCtx.arc(x, y, 20, 0, Math.PI * 2);
    gameCtx.fill();
    
    gameCtx.strokeStyle = '#48bb78';
    gameCtx.lineWidth = 2;
    gameCtx.stroke();
    
    // Ícone animado
    const scale = 1 + Math.sin(Date.now() / 300) * 0.1;
    gameCtx.save();
    gameCtx.translate(x, y);
    gameCtx.scale(scale, scale);
    gameCtx.fillStyle = '#68d391';
    gameCtx.font = '20px Arial';
    gameCtx.textAlign = 'center';
    gameCtx.fillText('⛏️', 0, 5);
    gameCtx.restore();
}

function drawGameInfo() {
    if (!gameCtx) return;
    
    // Info do tipo de jogo
    gameCtx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    gameCtx.fillRect(10, 10, 180, 60);
    
    gameCtx.fillStyle = 'white';
    gameCtx.font = 'bold 14px Arial';
    gameCtx.textAlign = 'left';
    gameCtx.fillText(`Modo: ${gameState.gameMode}`, 20, 30);
    gameCtx.fillText(`Tipo: ${gameState.gameType === 'competitive' ? 'Competitivo' : 'Casual'}`, 20, 50);
    
    // Barra de vida do jogador
    const healthBarWidth = 100;
    const healthPercent = player.health / 100;
    
    gameCtx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    gameCtx.fillRect(player.x - healthBarWidth/2, player.y - 40, healthBarWidth, 8);
    
    gameCtx.fillStyle = healthPercent > 0.7 ? '#48bb78' : healthPercent > 0.3 ? '#ecc94b' : '#e53e3e';
    gameCtx.fillRect(player.x - healthBarWidth/2, player.y - 40, healthBarWidth * healthPercent, 8);
}

function attackAction() {
    if (!gameRunning) return;
    
    // Criar projétil na direção do mouse
    const projectile = new Projectile(
        player.x, 
        player.y,
        player.x + (Math.random() - 0.5) * 200, // Alvo aleatório para demonstração
        player.y + (Math.random() - 0.5) * 200,
        7,
        10
    );
    
    projectiles.push(projectile);
    showNotification('Ataque realizado!', 'success', 1000);
}

function buildAction() {
    showNotification('Construindo defesa...', 'info', 2000);
}

function summonServo() {
    showNotification('Servo invocado!', 'success', 2000);
}

function summonSoldier() {
    showNotification('Soldado invocado!', 'success', 2000);
}

function useSpecial() {
    showNotification('Habilidade especial ativada!', 'success', 2000);
}

function returnToMenu() {
    gameRunning = false;
    
    if (gameLoop) {
        cancelAnimationFrame(gameLoop);
        gameLoop = null;
    }
    
    // Remover joystick
    if (joystick) {
        joystick.destroy();
        const container = document.querySelector('.joystick-container');
        if (container) {
            container.remove();
        }
    }
    
    // Remover controles mobile
    document.getElementById('mobileControls').style.display = 'none';
    
    // Resetar estado
    gameState.currentMatch = null;
    gameState.gameMode = null;
    gameState.gameType = null;
    
    showMainMenu();
}

// Expor funções globalmente
window.buildAction = buildAction;
window.summonServo = summonServo;
window.summonSoldier = summonSoldier;
window.useSpecial = useSpecial;
window.returnToMenu = returnToMenu;
window.attackAction = attackAction;

// Contador de jogadores online e na fila
function startOnlineCounter() {
    try {
        // Jogadores online
        const usersQuery = query(collection(db, 'users'), where('isOnline', '==', true));
        onSnapshot(usersQuery, (snapshot) => {
            const count = snapshot.size;
            gameState.onlinePlayersCount = count;
            
            const onlineCounter = document.getElementById('onlineCounter');
            const onlineCounterMain = document.getElementById('onlineCounterMain');
            
            if (onlineCounter) {
                onlineCounter.textContent = `${count} jogadores online`;
            }
            if (onlineCounterMain) {
                onlineCounterMain.textContent = `${count} jogadores online`;
            }
        }, (error) => {
            console.error('❌ Erro ao escutar usuários online:', error);
        });

        // Contador da fila
        const queueQuery = query(collection(db, 'matchmaking_queue'), where('status', '==', 'waiting'));
        onSnapshot(queueQuery, (snapshot) => {
            const count = snapshot.size;
            gameState.queueCount = count;
            
            const queueCountElement = document.getElementById('queueCount');
            if (queueCountElement) {
                queueCountElement.textContent = count;
            }
        }, (error) => {
            console.error('❌ Erro ao escutar fila:', error);
        });
        
    } catch (error) {
        console.error('❌ Erro ao iniciar contadores:', error);
        // Fallback
        document.getElementById('onlineCounter').textContent = '1 jogador online';
        document.getElementById('onlineCounterMain').textContent = '1 jogador online';
        document.getElementById('queueCount').textContent = '0';
    }
}

// Logout
async function performLogout() {
    try {
        await setUserOnline(false);
        await cleanupQueue();
        await signOut(auth);
        showMessage('Logout realizado com sucesso!', 'success');
    } catch (error) {
        console.error('❌ Erro ao fazer logout:', error);
        showMessage('Erro ao fazer logout', 'error');
    }
}

// Inicializar contadores após um breve delay
setTimeout(() => {
    startOnlineCounter();
}, 1000);

// Limpeza automática da fila (executar a cada 2 minutos)
setInterval(async () => {
    try {
        const cutoffTime = new Date(Date.now() - 5 * 60 * 1000); // 5 minutos atrás
        
        const oldEntriesQuery = query(
            collection(db, 'matchmaking_queue'),
            where('timestamp', '<', cutoffTime)
        );
        
        const snapshot = await getDocs(oldEntriesQuery);
        const deletePromises = [];
        
        snapshot.forEach(doc => {
            deletePromises.push(deleteDoc(doc.ref));
        });
        
        if (deletePromises.length > 0) {
            await Promise.all(deletePromises);
            console.log(`🧹 Limpou ${deletePromises.length} entradas antigas da fila automaticamente`);
        }
    } catch (error) {
        console.error('❌ Erro na limpeza automática da fila:', error);
    }
}, 120000); // 2 minutos

// Expor funções globalmente
window.gameState = gameState;
window.auth = auth;
window.db = db;
window.setUserOnline = setUserOnline;
window.performLogout = performLogout;
window.startMatchmaking = startMatchmaking;
window.cancelMatchmaking = cancelMatchmaking;
window.returnToMenu = returnToMenu;

console.log('✅ Firebase configurado e sistema de jogo pronto!');