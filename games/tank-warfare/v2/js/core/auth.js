// ========================================
// TANK WARFARE - AUTHENTICATION SYSTEM
// ========================================

window.AuthSystem = {
    currentUser: null,
    isAuthenticated: false,
    authListeners: [],
    
    // Inicializar sistema de autenticação
    async init() {
        console.log('🔐 Initializing Authentication System...');
        
        // Configurar listener de mudança de autenticação
        auth.onAuthStateChanged((user) => {
            if (user) {
                this.onUserSignIn(user);
            } else {
                this.onUserSignOut();
            }
        });
        
        // Verificar se há sessão ativa
        const user = auth.currentUser;
        if (user) {
            await this.onUserSignIn(user);
        }
    },
    
    // Login com Google
    async signInWithGoogle() {
        try {
            const provider = new firebase.auth.GoogleAuthProvider();
            provider.addScope('profile');
            provider.addScope('email');
            
            // Mostrar loading
            UIManager.showLoading('Conectando com Google...');
            
            const result = await auth.signInWithPopup(provider);
            const user = result.user;
            
            console.log('✅ Login successful:', user.email);
            
            // Analytics
            Analytics.logEvent('login', {
                method: 'google',
                uid: user.uid
            });
            
            UIManager.hideLoading();
            return user;
            
        } catch (error) {
            console.error('❌ Login error:', error);
            UIManager.hideLoading();
            
            // Tratar erros específicos
            switch (error.code) {
                case 'auth/account-exists-with-different-credential':
                    NotificationSystem.show('error', 'Erro de Login', 
                        'Esta conta já existe com outro método de login');
                    break;
                case 'auth/popup-blocked':
                    NotificationSystem.show('error', 'Pop-up Bloqueado', 
                        'Por favor, permita pop-ups para fazer login');
                    break;
                case 'auth/popup-closed-by-user':
                    NotificationSystem.show('warning', 'Login Cancelado', 
                        'Você cancelou o processo de login');
                    break;
                case 'auth/network-request-failed':
                    NotificationSystem.show('error', 'Erro de Conexão', 
                        'Verifique sua conexão com a internet');
                    break;
                default:
                    NotificationSystem.show('error', 'Erro no Login', 
                        error.message || 'Ocorreu um erro ao fazer login');
            }
            
            throw error;
        }
    },
    
    // Login com Email/Senha (futuro)
    async signInWithEmail(email, password) {
        try {
            UIManager.showLoading('Fazendo login...');
            
            const result = await auth.signInWithEmailAndPassword(email, password);
            const user = result.user;
            
            console.log('✅ Email login successful:', user.email);
            
            Analytics.logEvent('login', {
                method: 'email',
                uid: user.uid
            });
            
            UIManager.hideLoading();
            return user;
            
        } catch (error) {
            console.error('❌ Email login error:', error);
            UIManager.hideLoading();
            
            switch (error.code) {
                case 'auth/invalid-email':
                    NotificationSystem.show('error', 'Email Inválido', 
                        'Por favor, insira um email válido');
                    break;
                case 'auth/user-disabled':
                    NotificationSystem.show('error', 'Conta Desativada', 
                        'Esta conta foi desativada');
                    break;
                case 'auth/user-not-found':
                    NotificationSystem.show('error', 'Usuário não encontrado', 
                        'Não existe conta com este email');
                    break;
                case 'auth/wrong-password':
                    NotificationSystem.show('error', 'Senha Incorreta', 
                        'A senha está incorreta');
                    break;
                default:
                    NotificationSystem.show('error', 'Erro no Login', 
                        error.message);
            }
            
            throw error;
        }
    },
    
    // Registrar com Email/Senha
    async signUpWithEmail(email, password, displayName) {
        try {
            UIManager.showLoading('Criando conta...');
            
            const result = await auth.createUserWithEmailAndPassword(email, password);
            const user = result.user;
            
            // Atualizar perfil com nome
            await user.updateProfile({
                displayName: displayName
            });
            
            console.log('✅ Account created:', user.email);
            
            Analytics.logEvent('sign_up', {
                method: 'email',
                uid: user.uid
            });
            
            UIManager.hideLoading();
            return user;
            
        } catch (error) {
            console.error('❌ Sign up error:', error);
            UIManager.hideLoading();
            
            switch (error.code) {
                case 'auth/email-already-in-use':
                    NotificationSystem.show('error', 'Email em Uso', 
                        'Este email já está cadastrado');
                    break;
                case 'auth/invalid-email':
                    NotificationSystem.show('error', 'Email Inválido', 
                        'Por favor, insira um email válido');
                    break;
                case 'auth/weak-password':
                    NotificationSystem.show('error', 'Senha Fraca', 
                        'A senha deve ter pelo menos 6 caracteres');
                    break;
                default:
                    NotificationSystem.show('error', 'Erro no Cadastro', 
                        error.message);
            }
            
            throw error;
        }
    },
    
    // Login anônimo (para testes)
    async signInAnonymously() {
        try {
            UIManager.showLoading('Entrando como convidado...');
            
            const result = await auth.signInAnonymously();
            const user = result.user;
            
            console.log('✅ Anonymous login successful');
            
            Analytics.logEvent('login', {
                method: 'anonymous',
                uid: user.uid
            });
            
            UIManager.hideLoading();
            return user;
            
        } catch (error) {
            console.error('❌ Anonymous login error:', error);
            UIManager.hideLoading();
            
            NotificationSystem.show('error', 'Erro no Login', 
                'Não foi possível entrar como convidado');
            
            throw error;
        }
    },
    
    // Logout
    async signOut() {
        try {
            // Salvar dados antes de sair
            if (this.currentUser) {
                await PlayerSystem.saveData();
            }
            
            // Limpar presença online
            if (this.currentUser) {
                await DatabaseSystem.removeOnlineStatus(this.currentUser.uid);
            }
            
            await auth.signOut();
            console.log('✅ Logout successful');
            
            Analytics.logEvent('logout', {
                uid: this.currentUser?.uid
            });
            
            // Limpar dados locais
            this.clearLocalData();
            
        } catch (error) {
            console.error('❌ Logout error:', error);
            NotificationSystem.show('error', 'Erro ao Sair', 
                'Ocorreu um erro ao fazer logout');
            throw error;
        }
    },
    
    // Quando usuário faz login
    async onUserSignIn(user) {
        console.log('👤 User signed in:', user.email || user.uid);
        
        this.currentUser = user;
        this.isAuthenticated = true;
        
        // Atualizar UI
        this.updateUIForSignedInUser(user);
        
        // Carregar dados do jogador
        await PlayerSystem.loadData(user.uid);
        
        // Definir presença online
        await DatabaseSystem.setOnlineStatus(user.uid);
        
        // Verificar primeira vez
        const isNewUser = await this.checkIfNewUser(user.uid);
        if (isNewUser) {
            await this.onNewUserSetup(user);
        }
        
        // Verificar recompensas diárias
        await this.checkDailyRewards(user.uid);
        
        // Notificar listeners
        this.notifyAuthListeners('signin', user);
        
        // Esconder tela de login
        document.getElementById('loginScreen').style.display = 'none';
        document.getElementById('mainHeader').style.display = 'flex';
        document.getElementById('mainContainer').classList.add('active');
        
        // Carregar tela inicial
        ScreenManager.loadScreen('home');
        
        // Notificação de boas-vindas
        NotificationSystem.show('success', 'Bem-vindo!', 
            `Olá, ${user.displayName || 'Comandante'}!`);
    },
    
    // Quando usuário faz logout
    onUserSignOut() {
        console.log('👤 User signed out');
        
        this.currentUser = null;
        this.isAuthenticated = false;
        
        // Limpar dados
        this.clearLocalData();
        
        // Notificar listeners
        this.notifyAuthListeners('signout', null);
        
        // Voltar para tela de login
        document.getElementById('loginScreen').style.display = 'flex';
        document.getElementById('mainHeader').style.display = 'none';
        document.getElementById('mainContainer').classList.remove('active');
    },
    
    // Verificar se é novo usuário
    async checkIfNewUser(uid) {
        const snapshot = await database.ref(`players/${uid}`).once('value');
        return !snapshot.exists();
    },
    
    // Configurar novo usuário
    async onNewUserSetup(user) {
        console.log('🎉 Setting up new user');
        
        const initialData = {
            uid: user.uid,
            email: user.email,
            displayName: user.displayName || 'Jogador',
            photoURL: user.photoURL || '/assets/default-avatar.png',
            createdAt: firebase.database.ServerValue.TIMESTAMP,
            lastLogin: firebase.database.ServerValue.TIMESTAMP,
            
            // Dados iniciais do jogo
            coins: GameConfig.economy.startingCoins,
            gems: GameConfig.economy.startingGems,
            level: 1,
            experience: 0,
            
            // Ranking
            rank: 'unranked',
            rankPoints: 0,
            
            // Estatísticas
            stats: {
                matches: 0,
                wins: 0,
                losses: 0,
                kills: 0,
                deaths: 0,
                assists: 0,
                damageDealt: 0,
                damageTaken: 0,
                distanceTraveled: 0,
                shotsInformações: 0,
                shotsHit: 0,
                accuracy: 0,
                timePlayed: 0,
                favoriteМНК: 'medium',
                winStreak: 0,
                bestWinStreak: 0
            },
            
            // Inventário
            inventory: {
                tanks: ['basic'],
                skins: ['default'],
                powerups: {},
                consumables: {}
            },
            
            // Conquistas
            achievements: {},
            
            // Configurações
            settings: {
                language: 'pt-BR',
                soundEnabled: true,
                musicEnabled: true,
                graphicsQuality: 'medium',
                sensitivity: 5
            },
            
            // Social
            friends: [],
            club: null,
            
            // Privacidade
            privacy: {
                publicProfile: true,
                showOnline: true,
                acceptFriends: true
            }
        };
        
        // Salvar no banco
        await database.ref(`players/${user.uid}`).set(initialData);
        
        // Dar recompensa de primeiro login
        await this.giveFirstTimeRewards(user.uid);
        
        // Analytics
        Analytics.logEvent('new_user', {
            uid: user.uid,
            method: user.providerData[0]?.providerId || 'unknown'
        });
    },
    
    // Recompensas de primeiro login
    async giveFirstTimeRewards(uid) {
        const rewards = {
            coins: 500,
            gems: 10,
            tank: 'light',
            skin: 'starter'
        };
        
        // Adicionar recompensas
        await database.ref(`players/${uid}`).update({
            coins: firebase.database.ServerValue.increment(rewards.coins),
            gems: firebase.database.ServerValue.increment(rewards.gems),
            'inventory/tanks/1': rewards.tank,
            'inventory/skins/1': rewards.skin
        });
        
        // Notificar
        NotificationSystem.show('success', 'Recompensa de Boas-Vindas!', 
            `Você recebeu ${rewards.coins} moedas e ${rewards.gems} gemas!`);
    },
    
    // Verificar recompensas diárias
    async checkDailyRewards(uid) {
        const lastClaim = await database.ref(`players/${uid}/lastDailyReward`).once('value');
        const lastClaimTime = lastClaim.val() || 0;
        
        const now = Date.now();
        const oneDayInMs = 24 * 60 * 60 * 1000;
        
        if (now - lastClaimTime > oneDayInMs) {
            // Dar recompensa diária
            const rewards = GameConfig.economy.rewards.daily;
            
            await database.ref(`players/${uid}`).update({
                coins: firebase.database.ServerValue.increment(rewards.coins),
                gems: firebase.database.ServerValue.increment(rewards.gems),
                lastDailyReward: now
            });
            
            NotificationSystem.show('success', 'Recompensa Diária!', 
                `Você recebeu ${rewards.coins} moedas e ${rewards.gems} gemas!`);
        }
    },
    
    // Atualizar UI para usuário logado
    updateUIForSignedInUser(user) {
        // Atualizar imagem do perfil
        const profileImage = document.getElementById('profileImage');
        if (profileImage) {
            profileImage.src = user.photoURL || '/assets/default-avatar.png';
        }
        
        // Atualizar nome
        const playerName = document.getElementById('playerName');
        if (playerName) {
            playerName.textContent = user.displayName || 'Jogador';
        }
    },
    
    // Limpar dados locais
    clearLocalData() {
        // Limpar cache do jogador
        PlayerSystem.clearCache();
        
        // Limpar outros sistemas
        ShopSystem.clearCache();
        RankingSystem.clearCache();
    },
    
    // Adicionar listener de autenticação
    addAuthListener(callback) {
        this.authListeners.push(callback);
    },
    
    // Remover listener
    removeAuthListener(callback) {
        const index = this.authListeners.indexOf(callback);
        if (index > -1) {
            this.authListeners.splice(index, 1);
        }
    },
    
    // Notificar listeners
    notifyAuthListeners(event, user) {
        this.authListeners.forEach(callback => {
            try {
                callback(event, user);
            } catch (error) {
                console.error('Error in auth listener:', error);
            }
        });
    },
    
    // Obter token de ID (para API backend)
    async getIdToken() {
        if (!this.currentUser) {
            throw new Error('User not authenticated');
        }
        
        try {
            const token = await this.currentUser.getIdToken();
            return token;
        } catch (error) {
            console.error('Error getting ID token:', error);
            throw error;
        }
    },
    
    // Verificar se usuário está autenticado
    requireAuth() {
        if (!this.isAuthenticated) {
            NotificationSystem.show('warning', 'Login Necessário', 
                'Você precisa estar logado para acessar este recurso');
            throw new Error('User not authenticated');
        }
        
        return this.currentUser;
    },
    
    // Resetar senha
    async resetPassword(email) {
        try {
            await auth.sendPasswordResetEmail(email);
            NotificationSystem.show('success', 'Email Enviado', 
                'Verifique seu email para resetar a senha');
        } catch (error) {
            console.error('Password reset error:', error);
            NotificationSystem.show('error', 'Erro', 
                'Não foi possível enviar o email de reset');
            throw error;
        }
    },
    
    // Deletar conta
    async deleteAccount() {
        if (!confirm('Tem certeza que deseja deletar sua conta? Esta ação não pode ser desfeita!')) {
            return;
        }
        
        try {
            const user = this.requireAuth();
            
            // Deletar dados do banco
            await database.ref(`players/${user.uid}`).remove();
            
            // Deletar conta
            await user.delete();
            
            NotificationSystem.show('info', 'Conta Deletada', 
                'Sua conta foi deletada com sucesso');
            
        } catch (error) {
            console.error('Delete account error:', error);
            
            if (error.code === 'auth/requires-recent-login') {
                NotificationSystem.show('error', 'Reautenticação Necessária', 
                    'Por favor, faça login novamente antes de deletar a conta');
            } else {
                NotificationSystem.show('error', 'Erro', 
                    'Não foi possível deletar a conta');
            }
            
            throw error;
        }
    }
};