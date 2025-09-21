// ========================================
// TANK WARFARE - DATABASE SYSTEM
// ========================================

window.DatabaseSystem = {
    // Referências do Firebase
    db: null,
    listeners: {},
    cache: {},
    
    // Inicializar sistema de banco de dados
    init() {
        console.log('💾 Initializing Database System...');
        this.db = firebase.database();
        
        // Configurar persistência offline
        this.enableOfflinePersistence();
        
        // Configurar listeners de conexão
        this.setupConnectionListeners();
    },
    
    // Habilitar persistência offline
    enableOfflinePersistence() {
        try {
            firebase.database().goOffline();
            firebase.database().goOnline();
            console.log('✅ Offline persistence enabled');
        } catch (error) {
            console.error('Error enabling offline persistence:', error);
        }
    },
    
    // Configurar listeners de conexão
    setupConnectionListeners() {
        const connectedRef = this.db.ref('.info/connected');
        
        connectedRef.on('value', (snapshot) => {
            const isConnected = snapshot.val();
            
            if (isConnected) {
                console.log('🟢 Connected to Firebase');
                this.onConnect();
            } else {
                console.log('🔴 Disconnected from Firebase');
                this.onDisconnect();
            }
        });
    },
    
    // Quando conecta ao Firebase
    onConnect() {
        // Atualizar indicador de conexão
        const indicator = document.getElementById('connectionIndicator');
        if (indicator) {
            indicator.classList.add('connected');
            indicator.classList.remove('disconnected');
        }
        
        // Sincronizar dados pendentes
        this.syncPendingData();
    },
    
    // Quando desconecta do Firebase
    onDisconnect() {
        // Atualizar indicador
        const indicator = document.getElementById('connectionIndicator');
        if (indicator) {
            indicator.classList.add('disconnected');
            indicator.classList.remove('connected');
        }
        
        NotificationSystem.show('warning', 'Conexão Perdida', 
            'Você está offline. Os dados serão sincronizados quando reconectar.');
    },
    
    // ========== OPERAÇÕES CRUD ==========
    
    // CREATE - Criar novo registro
    async create(path, data) {
        try {
            const ref = this.db.ref(path);
            const newRef = ref.push();
            
            // Adicionar timestamp e ID
            data.id = newRef.key;
            data.createdAt = firebase.database.ServerValue.TIMESTAMP;
            data.updatedAt = firebase.database.ServerValue.TIMESTAMP;
            
            await newRef.set(data);
            
            console.log(`✅ Created: ${path}/${newRef.key}`);
            return newRef.key;
            
        } catch (error) {
            console.error(`Error creating ${path}:`, error);
            throw error;
        }
    },
    
    // READ - Ler dados
    async read(path, useCache = true) {
        try {
            // Verificar cache
            if (useCache && this.cache[path]) {
                const cacheAge = Date.now() - this.cache[path].timestamp;
                if (cacheAge < 60000) { // Cache válido por 1 minuto
                    return this.cache[path].data;
                }
            }
            
            const snapshot = await this.db.ref(path).once('value');
            const data = snapshot.val();
            
            // Atualizar cache
            this.cache[path] = {
                data: data,
                timestamp: Date.now()
            };
            
            return data;
            
        } catch (error) {
            console.error(`Error reading ${path}:`, error);
            throw error;
        }
    },
    
    // UPDATE - Atualizar dados
    async update(path, updates) {
        try {
            // Adicionar timestamp de atualização
            updates.updatedAt = firebase.database.ServerValue.TIMESTAMP;
            
            await this.db.ref(path).update(updates);
            
            // Limpar cache
            delete this.cache[path];
            
            console.log(`✅ Updated: ${path}`);
            return true;
            
        } catch (error) {
            console.error(`Error updating ${path}:`, error);
            throw error;
        }
    },
    
    // DELETE - Deletar dados
    async delete(path) {
        try {
            await this.db.ref(path).remove();
            
            // Limpar cache
            delete this.cache[path];
            
            console.log(`✅ Deleted: ${path}`);
            return true;
            
        } catch (error) {
            console.error(`Error deleting ${path}:`, error);
            throw error;
        }
    },
    
    // ========== OPERAÇÕES ESPECÍFICAS ==========
    
    // Definir status online
    async setOnlineStatus(uid) {
        if (!uid) return;
        
        const userStatusRef = this.db.ref(`online/${uid}`);
        const userDataRef = this.db.ref(`players/${uid}/lastSeen`);
        
        // Dados de presença
        const onlineData = {
            uid: uid,
            status: 'online',
            timestamp: firebase.database.ServerValue.TIMESTAMP
        };
        
        // Definir como online
        await userStatusRef.set(onlineData);
        
        // Configurar para remover ao desconectar
        userStatusRef.onDisconnect().remove();
        userDataRef.onDisconnect().set(firebase.database.ServerValue.TIMESTAMP);
        
        console.log('✅ Online status set for:', uid);
    },
    
    // Remover status online
    async removeOnlineStatus(uid) {
        if (!uid) return;
        
        try {
            await this.db.ref(`online/${uid}`).remove();
            await this.db.ref(`players/${uid}/lastSeen`).set(
                firebase.database.ServerValue.TIMESTAMP
            );
        } catch (error) {
            console.error('Error removing online status:', error);
        }
    },
    
    // Obter contagem de jogadores online
    async getOnlineCount() {
        try {
            const snapshot = await this.db.ref('online').once('value');
            return snapshot.numChildren();
        } catch (error) {
            console.error('Error getting online count:', error);
            return 0;
        }
    },
    
    // Monitorar jogadores online
    watchOnlinePlayers(callback) {
        const ref = this.db.ref('online');
        
        ref.on('value', (snapshot) => {
            const count = snapshot.numChildren();
            const players = snapshot.val() || {};
            callback(count, players);
        });
        
        // Armazenar listener
        this.listeners['online'] = ref;
    },
    
    // ========== MATCHMAKING ==========
    
    // Adicionar à fila de matchmaking
    async joinMatchmakingQueue(mode, teamSize, playerData) {
        const uid = AuthSystem.currentUser?.uid;
        if (!uid) throw new Error('User not authenticated');
        
        const queuePath = `matchmaking/${mode}/${teamSize}/${uid}`;
        
        const queueData = {
            uid: uid,
            name: playerData.name || 'Player',
            rank: playerData.rank || 'unranked',
            avatar: playerData.avatar || '/assets/default-avatar.png',
            timestamp: firebase.database.ServerValue.TIMESTAMP,
            ready: true
        };
        
        await this.db.ref(queuePath).set(queueData);
        
        // Configurar para remover ao desconectar
        this.db.ref(queuePath).onDisconnect().remove();
        
        console.log('✅ Joined matchmaking queue:', mode, teamSize);
        return queuePath;
    },
    
    // Sair da fila de matchmaking
    async leaveMatchmakingQueue(mode, teamSize) {
        const uid = AuthSystem.currentUser?.uid;
        if (!uid) return;
        
        const queuePath = `matchmaking/${mode}/${teamSize}/${uid}`;
        await this.db.ref(queuePath).remove();
        
        console.log('✅ Left matchmaking queue');
    },
    
    // Monitorar fila de matchmaking
    watchMatchmakingQueue(mode, teamSize, callback) {
        const queuePath = `matchmaking/${mode}/${teamSize}`;
        const ref = this.db.ref(queuePath);
        
        ref.on('value', (snapshot) => {
            const players = snapshot.val() || {};
            const playersList = Object.values(players);
            callback(playersList);
        });
        
        // Armazenar listener
        this.listeners[`queue_${mode}_${teamSize}`] = ref;
        
        return ref;
    },
    
    // ========== PARTIDAS ==========
    
    // Criar nova partida
    async createMatch(matchData) {
        const matchRef = this.db.ref('matches').push();
        const matchId = matchRef.key;
        
        matchData.id = matchId;
        matchData.createdAt = firebase.database.ServerValue.TIMESTAMP;
        matchData.status = 'waiting';
        
        await matchRef.set(matchData);
        
        console.log('✅ Match created:', matchId);
        return matchId;
    },
    
    // Entrar em partida
    async joinMatch(matchId, playerData) {
        const uid = AuthSystem.currentUser?.uid;
        if (!uid) throw new Error('User not authenticated');
        
        const playerPath = `matches/${matchId}/players/${uid}`;
        
        await this.db.ref(playerPath).set({
            ...playerData,
            joinedAt: firebase.database.ServerValue.TIMESTAMP,
            ready: false
        });
        
        console.log('✅ Joined match:', matchId);
    },
    
    // Monitorar partida
    watchMatch(matchId, callback) {
        const ref = this.db.ref(`matches/${matchId}`);
        
        ref.on('value', (snapshot) => {
            const matchData = snapshot.val();
            callback(matchData);
        });
        
        this.listeners[`match_${matchId}`] = ref;
        return ref;
    },
    
    // ========== RANKING ==========
    
    // Atualizar ranking
    async updateRanking(uid, points) {
        const updates = {};
        updates[`players/${uid}/rankPoints`] = firebase.database.ServerValue.increment(points);
        updates[`leaderboard/${uid}/points`] = firebase.database.ServerValue.increment(points);
        updates[`leaderboard/${uid}/updatedAt`] = firebase.database.ServerValue.TIMESTAMP;
        
        await this.db.ref().update(updates);
        
        console.log('✅ Ranking updated:', uid, points);
    },
    
    // Obter leaderboard
    async getLeaderboard(limit = 100) {
        try {
            const snapshot = await this.db.ref('leaderboard')
                .orderByChild('points')
                .limitToLast(limit)
                .once('value');
            
            const data = snapshot.val() || {};
            
            // Converter para array e ordenar
            const leaderboard = Object.entries(data)
                .map(([uid, userData]) => ({
                    uid,
                    ...userData
                }))
                .sort((a, b) => b.points - a.points);
            
            return leaderboard;
            
        } catch (error) {
            console.error('Error getting leaderboard:', error);
            return [];
        }
    },
    
    // ========== CHAT ==========
    
    // Enviar mensagem
    async sendMessage(roomId, message) {
        const uid = AuthSystem.currentUser?.uid;
        if (!uid) throw new Error('User not authenticated');
        
        const messageData = {
            uid: uid,
            name: AuthSystem.currentUser.displayName || 'Player',
            message: message,
            timestamp: firebase.database.ServerValue.TIMESTAMP
        };
        
        await this.db.ref(`chat/${roomId}`).push(messageData);
        
        console.log('✅ Message sent');
    },
    
    // Monitorar chat
    watchChat(roomId, callback, limit = 50) {
        const ref = this.db.ref(`chat/${roomId}`)
            .orderByChild('timestamp')
            .limitToLast(limit);
        
        ref.on('child_added', (snapshot) => {
            const message = snapshot.val();
            message.id = snapshot.key;
            callback(message);
        });
        
        this.listeners[`chat_${roomId}`] = ref;
        return ref;
    },
    
    // ========== TRANSAÇÕES ==========
    
    // Transação atômica
    async transaction(path, updateFunction) {
        try {
            const ref = this.db.ref(path);
            const result = await ref.transaction(updateFunction);
            
            if (result.committed) {
                console.log('✅ Transaction committed:', path);
                return result.snapshot.val();
            } else {
                console.log('⚠️ Transaction aborted:', path);
                return null;
            }
            
        } catch (error) {
            console.error('Transaction error:', error);
            throw error;
        }
    },
    
    // Incrementar valor
    async increment(path, value = 1) {
        return this.transaction(path, (current) => {
            return (current || 0) + value;
        });
    },
    
    // ========== UTILIDADES ==========
    
    // Limpar cache
    clearCache(path = null) {
        if (path) {
            delete this.cache[path];
        } else {
            this.cache = {};
        }
    },
    
    // Remover listener
    removeListener(key) {
        if (this.listeners[key]) {
            this.listeners[key].off();
            delete this.listeners[key];
        }
    },
    
    // Remover todos os listeners
    removeAllListeners() {
        Object.keys(this.listeners).forEach(key => {
            this.removeListener(key);
        });
    },
    
    // Sincronizar dados pendentes
    async syncPendingData() {
        // Implementar sincronização de dados offline
        console.log('📡 Syncing pending data...');
        
        // Forçar sincronização
        await this.db.ref('.info/connected').once('value');
    },
    
    // Backup de dados do jogador
    async backupPlayerData(uid) {
        try {
            const data = await this.read(`players/${uid}`);
            const backup = {
                data: data,
                timestamp: Date.now(),
                version: GameConfig.version
            };
            
            // Salvar backup local
            localStorage.setItem(`backup_${uid}`, JSON.stringify(backup));
            
            console.log('✅ Player data backed up');
            return backup;
            
        } catch (error) {
            console.error('Error backing up data:', error);
            throw error;
        }
    },
    
    // Restaurar dados do jogador
    async restorePlayerData(uid) {
        try {
            const backupStr = localStorage.getItem(`backup_${uid}`);
            if (!backupStr) {
                throw new Error('No backup found');
            }
            
            const backup = JSON.parse(backupStr);
            
            // Verificar versão
            if (backup.version !== GameConfig.version) {
                console.warn('⚠️ Backup version mismatch');
            }
            
            // Restaurar dados
            await this.update(`players/${uid}`, backup.data);
            
            console.log('✅ Player data restored');
            return backup.data;
            
        } catch (error) {
            console.error('Error restoring data:', error);
            throw error;
        }
    }
};