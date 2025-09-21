// matchmaking-system.js

class MatchmakingSystem {
    constructor() {
        this.queueListener = null;
        this.matchListener = null;
        this.cleanupInterval = null;
        this.startQueueCleanup();
    }

    async startMatchmaking(mode, type) {
        try {
            console.log(`🔍 Iniciando matchmaking: ${mode} ${type}`);
            
            window.gameState.gameMode = mode;
            window.gameState.gameType = type;
            window.gameState.queueStartTime = Date.now();
            
            showMatchmakingScreen();
            this.updateMatchmakingUI();
            
            // Calcular ping primeiro
            await this.calculatePing();
            
            // Limpar qualquer entrada anterior na fila
            await this.cleanupOldQueueEntries();
            
            // Adicionar à fila de matchmaking
            const queueRef = window.firebaseApp.doc(window.firebaseApp.collection(window.firebaseApp.db, 'matchmaking_queue'));
            const queueData = {
                userId: window.gameState.user.uid,
                displayName: window.gameState.user.displayName,
                rank: window.gameState.user.rank || 'Bronze I',
                trophies: window.gameState.user.trophies || 0,
                mode: mode,
                type: type,
                ping: window.gameState.ping,
                timestamp: window.firebaseApp.serverTimestamp(),
                status: 'waiting',
                region: 'BR' // Pode ser expandido para outras regiões
            };
            
            await window.firebaseApp.setDoc(queueRef, queueData);
            window.gameState.queueId = queueRef.id;
            
            console.log(`✅ Adicionado à fila com ID: ${queueRef.id}`);
            
            // Configurar timeout para modo casual (15 segundos)
            if (type === 'casual') {
                window.gameState.matchmakingTimeout = setTimeout(() => {
                    console.log('⏱️ Timeout do casual - iniciando com bots');
                    this.startGameWithBots();
                }, 15000);
            } else {
                // Modo competitivo - timeout maior (60 segundos)
                window.gameState.matchmakingTimeout = setTimeout(() => {
                    console.log('⏱️ Timeout do competitivo - cancelando');
                    this.cancelMatchmaking('Nenhum jogador encontrado. Tente novamente.');
                }, 60000);
            }
            
            // Começar a procurar por partidas
            await this.findMatch();
            
        } catch (error) {
            console.error('Erro ao iniciar matchmaking:', error);
            showMessage('Erro ao procurar partida: ' + error.message, 'error');
            showMainMenu();
        }
    }

    async calculatePing() {
        try {
            const pingStart = Date.now();
            await window.firebaseApp.getDoc(window.firebaseApp.doc(window.firebaseApp.db, 'ping_test', 'test'));
            window.gameState.ping = Date.now() - pingStart;
            console.log(`📶 Ping calculado: ${window.gameState.ping}ms`);
        } catch (error) {
            console.error('Erro ao calcular ping:', error);
            window.gameState.ping = 100; // Valor padrão
        }
    }

    async cleanupOldQueueEntries() {
        try {
            // Remover entradas antigas deste usuário
            const oldEntriesQuery = window.firebaseApp.query(
                window.firebaseApp.collection(window.firebaseApp.db, 'matchmaking_queue'),
                window.firebaseApp.where('userId', '==', window.gameState.user.uid)
            );
            
            const oldEntriesSnapshot = await window.firebaseApp.getDocs(oldEntriesQuery);
            const deletePromises = [];
            
            oldEntriesSnapshot.forEach(doc => {
                deletePromises.push(window.firebaseApp.deleteDoc(doc.ref));
            });
            
            if (deletePromises.length > 0) {
                await Promise.all(deletePromises);
                console.log(`🧹 Limpou ${deletePromises.length} entradas antigas da fila`);
            }
        } catch (error) {
            console.error('Erro ao limpar entradas antigas:', error);
        }
    }

    async findMatch() {
        try {
            const maxPlayers = parseInt(window.gameState.gameMode.charAt(0)) * 2;
            
            console.log(`🔍 Procurando ${maxPlayers} jogadores para ${window.gameState.gameMode} ${window.gameState.gameType}`);
            
            // Query para encontrar jogadores compatíveis
            const matchQuery = window.firebaseApp.query(
                window.firebaseApp.collection(window.firebaseApp.db, 'matchmaking_queue'),
                window.firebaseApp.where('mode', '==', window.gameState.gameMode),
                window.firebaseApp.where('type', '==', window.gameState.gameType),
                window.firebaseApp.where('status', '==', 'waiting'),
                window.firebaseApp.orderBy('timestamp'),
                window.firebaseApp.limit(maxPlayers)
            );
            
            // Escutar mudanças na fila
            this.queueListener = window.firebaseApp.onSnapshot(matchQuery, async (snapshot) => {
                const players = [];
                snapshot.forEach(doc => {
                    const data = doc.data();
                    players.push({
                        id: doc.id,
                        ...data
                    });
                });
                
                console.log(`👥 Jogadores na fila: ${players.length}/${maxPlayers}`);
                this.updatePlayersFound(players, maxPlayers);
                
                if (players.length >= maxPlayers) {
                    console.log('🎉 Jogadores suficientes encontrados!');
                    
                    // Parar de escutar a fila
                    if (this.queueListener) {
                        this.queueListener();
                        this.queueListener = null;
                    }
                    
                    // Criar partida
                    await this.createMatch(players);
                }
            }, (error) => {
                console.error('Erro ao escutar fila:', error);
                this.cancelMatchmaking('Erro na busca por jogadores');
            });
            
        } catch (error) {
            console.error('Erro ao procurar partida:', error);
            this.cancelMatchmaking('Erro ao procurar partida');
        }
    }

    async createMatch(players) {
        try {
            console.log('🏗️ Criando partida...');
            
            // Determinar host (menor ping ou primeiro da fila)
            const host = players.reduce((prev, current) => 
                (prev.ping || 999) < (current.ping || 999) ? prev : current
            );
            
            window.gameState.isHost = (host.userId === window.gameState.user.uid);
            
            console.log(`👑 Host: ${host.displayName} (${host.userId})`);
            
            // Criar sala da partida
            const matchRef = window.firebaseApp.doc(window.firebaseApp.collection(window.firebaseApp.db, 'matches'));
            const matchData = {
                id: matchRef.id,
                hostId: host.userId,
                mode: window.gameState.gameMode,
                type: window.gameState.gameType,
                players: players.map((p, index) => ({
                    userId: p.userId,
                    displayName: p.displayName,
                    rank: p.rank,
                    trophies: p.trophies,
                    team: this.assignTeam(index, players.length),
                    ready: false,
                    ping: p.ping || 100
                })),
                status: 'preparing',
                createdAt: window.firebaseApp.serverTimestamp(),
                gameData: this.initializeGameData()
            };
            
            await window.firebaseApp.setDoc(matchRef, matchData);
            window.gameState.currentMatch = matchRef.id;
            
            console.log(`🎮 Partida criada: ${matchRef.id}`);
            
            // Marcar jogadores como matched na fila
            const updatePromises = players.map(player => 
                window.firebaseApp.updateDoc(
                    window.firebaseApp.doc(window.firebaseApp.db, 'matchmaking_queue', player.id),
                    {
                        status: 'matched',
                        matchId: matchRef.id
                    }
                )
            );
            
            await Promise.all(updatePromises);
            
            // Cancelar timeout se existir
            if (window.gameState.matchmakingTimeout) {
                clearTimeout(window.gameState.matchmakingTimeout);
                window.gameState.matchmakingTimeout = null;
            }
            
            // Aguardar um pouco e iniciar jogo
            setTimeout(() => {
                console.log('🚀 Iniciando jogo...');
                window.gameEngine.startGame();
            }, 3000);
            
        } catch (error) {
            console.error('Erro ao criar partida:', error);
            this.cancelMatchmaking('Erro ao criar partida');
        }
    }

    startGameWithBots() {
        try {
            console.log('🤖 Iniciando jogo com bots...');
            
            const maxPlayers = parseInt(window.gameState.gameMode.charAt(0)) * 2;
            const botCount = maxPlayers - 1; // Jogador + bots
            
            const players = [{
                userId: window.gameState.user.uid,
                displayName: window.gameState.user.displayName,
                rank: window.gameState.user.rank || 'Bronze I',
                trophies: window.gameState.user.trophies || 0,
                team: 'blue',
                isBot: false,
                ping: window.gameState.ping
            }];
            
            // Adicionar bots
            const botNames = ['Alpha Bot', 'Beta Bot', 'Gamma Bot', 'Delta Bot', 'Omega Bot'];
            for (let i = 0; i < botCount; i++) {
                players.push({
                    userId: 'bot_' + i,
                    displayName: botNames[i] || `Bot ${i + 1}`,
                    rank: 'Bronze I',
                    trophies: Math.floor(Math.random() * 200),
                    team: this.assignTeam(i + 1, maxPlayers),
                    isBot: true,
                    ping: 50 + Math.floor(Math.random() * 50)
                });
            }
            
            window.gameState.isHost = true;
            window.gameState.players = players;
            
            // Cancelar timeout e listeners
            if (window.gameState.matchmakingTimeout) {
                clearTimeout(window.gameState.matchmakingTimeout);
                window.gameState.matchmakingTimeout = null;
            }
            
            if (this.queueListener) {
                this.queueListener();
                this.queueListener = null;
            }
            
            // Limpar entrada da fila
            this.cleanupQueue();
            
            console.log('🎮 Jogo com bots iniciado');
            window.gameEngine.startGame();
            
        } catch (error) {
            console.error('Erro ao iniciar jogo com bots:', error);
            showMessage('Erro ao iniciar jogo', 'error');
            showMainMenu();
        }
    }

    assignTeam(index, totalPlayers) {
        const playersPerTeam = totalPlayers / 2;
        return index < playersPerTeam ? 'blue' : 'red';
    }

    initializeGameData() {
        const maxPlayers = parseInt(window.gameState.gameMode.charAt(0)) * 2;
        const basesPerTeam = parseInt(window.gameState.gameMode.charAt(0));
        
        return {
            mapSize: { width: 1200, height: 700 },
            bases: this.generateBases(basesPerTeam),
            extractionPoints: this.generateExtractionPoints(),
            teamMana: { blue: 500, red: 500 },
            teamScores: { blue: 0, red: 0 },
            gameTime: 600, // 10 minutos
            buildings: [],
            units: [],
            projectiles: [],
            gameStarted: false
        };
    }

    generateBases(basesPerTeam) {
        const bases = [];
        const mapWidth = 1200;
        const mapHeight = 700;
        
        for (let i = 0; i < basesPerTeam; i++) {
            // Base azul (esquerda)
            bases.push({
                id: `blue_base_${i}`,
                x: 100,
                y: (mapHeight / (basesPerTeam + 1)) * (i + 1),
                team: 'blue',
                health: 500,
                maxHealth: 500,
                size: 40,
                type: 'base'
            });
            
            // Base vermelha (direita)
            bases.push({
                id: `red_base_${i}`,
                x: mapWidth - 100,
                y: (mapHeight / (basesPerTeam + 1)) * (i + 1),
                team: 'red',
                health: 500,
                maxHealth: 500,
                size: 40,
                type: 'base'
            });
        }
        
        return bases;
    }

    generateExtractionPoints() {
        const points = [];
        const mapWidth = 1200;
        const mapHeight = 700;
        
        // Pontos no centro do mapa
        for (let i = 0; i < 4; i++) {
            points.push({
                id: `extraction_${i}`,
                x: (mapWidth / 5) * (i + 1),
                y: mapHeight / 2 + (Math.random() - 0.5) * 200,
                occupied: false,
                extractor: null
            });
        }
        
        return points;
    }

    updateMatchmakingUI() {
        document.getElementById('currentMode').textContent = window.gameState.gameMode;
        document.getElementById('currentType').textContent = 
            window.gameState.gameType === 'competitive' ? 'Competitivo' : 'Casual';
        
        // Criar slots de jogadores
        const maxPlayers = parseInt(window.gameState.gameMode.charAt(0)) * 2;
        const playersFoundDiv = document.getElementById('playersFound');
        playersFoundDiv.innerHTML = '';
        
        for (let i = 0; i < maxPlayers; i++) {
            const slot = document.createElement('div');
            slot.className = 'player-slot';
            slot.id = `player-slot-${i}`;
            slot.textContent = '?';
            playersFoundDiv.appendChild(slot);
        }
        
        // Atualizar timer
        this.startQueueTimer();
    }

    startQueueTimer() {
        const updateTimer = () => {
            if (window.gameState.queueStartTime && !document.getElementById('matchmakingScreen').classList.contains('hidden')) {
                const elapsed = Math.floor((Date.now() - window.gameState.queueStartTime) / 1000);
                document.getElementById('queueTime').textContent = `${elapsed}s`;
                document.getElementById('estimatedPing').textContent = 
                    window.gameState.ping ? `${window.gameState.ping}ms` : 'Calculando...';
                
                setTimeout(updateTimer, 1000);
            }
        };
        updateTimer();
    }

    updatePlayersFound(players, maxPlayers) {
        players.forEach((player, index) => {
            const slot = document.getElementById(`player-slot-${index}`);
            if (slot && !slot.classList.contains('filled')) {
                slot.classList.add('filled');
                slot.textContent = player.displayName.charAt(0);
                slot.title = `${player.displayName} (${player.rank})`;
            }
        });
    }

    async cancelMatchmaking(message = 'Busca cancelada') {
        try {
            console.log('❌ Cancelando matchmaking...');
            
            // Parar listeners
            if (this.queueListener) {
                this.queueListener();
                this.queueListener = null;
            }
            
            if (this.matchListener) {
                this.matchListener();
                this.matchListener = null;
            }
            
            // Cancelar timeout
            if (window.gameState.matchmakingTimeout) {
                clearTimeout(window.gameState.matchmakingTimeout);
                window.gameState.matchmakingTimeout = null;
            }
            
            // Limpar fila
            await this.cleanupQueue();
            
            // Resetar estado
            window.gameState.queueStartTime = null;
            window.gameState.gameMode = null;
            window.gameState.gameType = null;
            
            showMainMenu();
            if (message !== 'Busca cancelada') {
                showMessage(message, 'error');
            }
            
        } catch (error) {
            console.error('Erro ao cancelar matchmaking:', error);
            showMainMenu();
        }
    }

    async cleanupQueue() {
        if (window.gameState.queueId) {
            try {
                await window.firebaseApp.deleteDoc(
                    window.firebaseApp.doc(window.firebaseApp.db, 'matchmaking_queue', window.gameState.queueId)
                );
                console.log('🧹 Entrada da fila removida');
            } catch (error) {
                console.error('Erro ao limpar fila:', error);
            }
            window.gameState.queueId = null;
        }
    }

    startQueueCleanup() {
        // Limpar entradas antigas da fila a cada 30 segundos
        this.cleanupInterval = setInterval(async () => {
            try {
                const cutoffTime = Date.now() - 5 * 60 * 1000; // 5 minutos atrás
                
                const oldEntriesQuery = window.firebaseApp.query(
                    window.firebaseApp.collection(window.firebaseApp.db, 'matchmaking_queue'),
                    window.firebaseApp.where('timestamp', '<', new Date(cutoffTime))
                );
                
                const snapshot = await window.firebaseApp.getDocs(oldEntriesQuery);
                const deletePromises = [];
                
                snapshot.forEach(doc => {
                    deletePromises.push(window.firebaseApp.deleteDoc(doc.ref));
                });
                
                if (deletePromises.length > 0) {
                    await Promise.all(deletePromises);
                    console.log(`🧹 Limpou ${deletePromises.length} entradas antigas automaticamente`);
                }
            } catch (error) {
                console.error('Erro na limpeza automática:', error);
            }
        }, 30000);
    }

    destroy() {
        if (this.queueListener) {
            this.queueListener();
        }
        if (this.matchListener) {
            this.matchListener();
        }
        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval);
        }
        if (window.gameState.matchmakingTimeout) {
            clearTimeout(window.gameState.matchmakingTimeout);
        }
    }
}

// Funções globais
window.startMatchmaking = (mode, type) => {
    console.log(`🎯 Solicitado matchmaking: ${mode} ${type}`);
    window.matchmakingSystem.startMatchmaking(mode, type);
};

window.cancelMatchmaking = () => {
    window.matchmakingSystem.cancelMatchmaking();
};

// Inicializar sistema de matchmaking
window.matchmakingSystem = new MatchmakingSystem();

// Limpeza ao sair da página
window.addEventListener('beforeunload', () => {
    if (window.matchmakingSystem) {
        window.matchmakingSystem.cleanupQueue();
    }
});

console.log('🔍 Sistema de matchmaking carregado!');