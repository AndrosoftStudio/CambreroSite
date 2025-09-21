// auth-system.js

class AuthSystem {
    constructor() {
        this.setupEventListeners();
        this.startOnlinePlayersTracking();
    }

    setupEventListeners() {
        // Login com email/senha
        document.getElementById('loginForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('loginEmail').value;
            const password = document.getElementById('loginPassword').value;
            
            try {
                showMessage('Fazendo login...', 'info');
                const result = await window.firebaseApp.signInWithEmailAndPassword(window.firebaseApp.auth, email, password);
                await this.loadUserProfile(result.user);
                showMainMenu();
                showMessage('Login realizado com sucesso!', 'success');
            } catch (error) {
                console.error('Erro no login:', error);
                showMessage('Erro no login: ' + this.getErrorMessage(error), 'error');
            }
        });

        // Registro
        document.getElementById('registerForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const name = document.getElementById('registerName').value;
            const email = document.getElementById('registerEmail').value;
            const password = document.getElementById('registerPassword').value;
            const confirmPassword = document.getElementById('confirmPassword').value;
            
            if (password !== confirmPassword) {
                showMessage('As senhas não coincidem!', 'error');
                return;
            }
            
            try {
                showMessage('Criando conta...', 'info');
                const result = await window.firebaseApp.createUserWithEmailAndPassword(window.firebaseApp.auth, email, password);
                
                // Criar perfil do usuário
                await window.firebaseApp.setDoc(window.firebaseApp.doc(window.firebaseApp.db, 'users', result.user.uid), {
                    uid: result.user.uid,
                    displayName: name,
                    email: email,
                    createdAt: window.firebaseApp.serverTimestamp(),
                    rank: 'Bronze I',
                    trophies: 0,
                    wins: 0,
                    losses: 0,
                    totalGames: 0,
                    level: 1,
                    experience: 0,
                    lastActive: window.firebaseApp.serverTimestamp(),
                    isOnline: true
                });
                
                await this.loadUserProfile(result.user);
                showMainMenu();
                showMessage('Conta criada com sucesso!', 'success');
            } catch (error) {
                console.error('Erro ao criar conta:', error);
                showMessage('Erro ao criar conta: ' + this.getErrorMessage(error), 'error');
            }
        });

        // Login com Google
        document.getElementById('googleLoginBtn').addEventListener('click', async () => {
            try {
                showMessage('Conectando com Google...', 'info');
                const provider = new window.firebaseApp.GoogleAuthProvider();
                const result = await window.firebaseApp.signInWithPopup(window.firebaseApp.auth, provider);
                
                // Verificar se é novo usuário
                const userDoc = await window.firebaseApp.getDoc(window.firebaseApp.doc(window.firebaseApp.db, 'users', result.user.uid));
                if (!userDoc.exists()) {
                    await window.firebaseApp.setDoc(window.firebaseApp.doc(window.firebaseApp.db, 'users', result.user.uid), {
                        uid: result.user.uid,
                        displayName: result.user.displayName,
                        email: result.user.email,
                        photoURL: result.user.photoURL,
                        createdAt: window.firebaseApp.serverTimestamp(),
                        rank: 'Bronze I',
                        trophies: 0,
                        wins: 0,
                        losses: 0,
                        totalGames: 0,
                        level: 1,
                        experience: 0,
                        lastActive: window.firebaseApp.serverTimestamp(),
                        isOnline: true
                    });
                }
                
                await this.loadUserProfile(result.user);
                showMainMenu();
                showMessage('Login com Google realizado com sucesso!', 'success');
            } catch (error) {
                console.error('Erro no login com Google:', error);
                showMessage('Erro no login com Google: ' + this.getErrorMessage(error), 'error');
            }
        });

        // Monitorar estado de autenticação
        window.firebaseApp.onAuthStateChanged(window.firebaseApp.auth, async (user) => {
            if (user) {
                await this.loadUserProfile(user);
                await this.setUserOnline(true);
                showMainMenu();
            } else {
                if (window.gameState.user) {
                    await this.setUserOnline(false);
                }
                window.gameState.user = null;
                showLoginScreen();
            }
        });
    }

    async loadUserProfile(user) {
        try {
            const userDoc = await window.firebaseApp.getDoc(window.firebaseApp.doc(window.firebaseApp.db, 'users', user.uid));
            if (userDoc.exists()) {
                window.gameState.user = { ...user, ...userDoc.data() };
                
                // Atualizar última atividade e status online
                await window.firebaseApp.updateDoc(window.firebaseApp.doc(window.firebaseApp.db, 'users', user.uid), {
                    lastActive: window.firebaseApp.serverTimestamp(),
                    isOnline: true
                });
            } else {
                window.gameState.user = user;
            }
        } catch (error) {
            console.error('Erro ao carregar perfil:', error);
            window.gameState.user = user;
        }
    }

    async setUserOnline(isOnline) {
        if (window.gameState.user) {
            try {
                await window.firebaseApp.updateDoc(window.firebaseApp.doc(window.firebaseApp.db, 'users', window.gameState.user.uid), {
                    isOnline: isOnline,
                    lastActive: window.firebaseApp.serverTimestamp()
                });
            } catch (error) {
                console.error('Erro ao atualizar status online:', error);
            }
        }
    }

    startOnlinePlayersTracking() {
        // Escutar mudanças nos jogadores online
        const usersQuery = window.firebaseApp.query(
            window.firebaseApp.collection(window.firebaseApp.db, 'users'),
            window.firebaseApp.where('isOnline', '==', true)
        );

        window.firebaseApp.onSnapshot(usersQuery, (snapshot) => {
            const onlineCount = snapshot.size;
            window.gameState.onlinePlayersCount = onlineCount;
            
            // Atualizar UI se estiver no menu principal
            const onlineCountElement = document.getElementById('onlineCount');
            if (onlineCountElement) {
                onlineCountElement.textContent = `${onlineCount} jogadores online`;
            }
        });
    }

    getErrorMessage(error) {
        switch (error.code) {
            case 'auth/user-not-found':
                return 'Usuário não encontrado';
            case 'auth/wrong-password':
                return 'Senha incorreta';
            case 'auth/email-already-in-use':
                return 'Email já está em uso';
            case 'auth/weak-password':
                return 'Senha muito fraca';
            case 'auth/invalid-email':
                return 'Email inválido';
            case 'auth/popup-closed-by-user':
                return 'Login cancelado pelo usuário';
            case 'auth/network-request-failed':
                return 'Erro de rede. Verifique sua conexão';
            default:
                return error.message || 'Erro desconhecido';
        }
    }

    async logout() {
        try {
            await this.setUserOnline(false);
            await window.firebaseApp.signOut(window.firebaseApp.auth);
            window.gameState.user = null;
            showLoginScreen();
            showMessage('Logout realizado com sucesso!', 'success');
        } catch (error) {
            console.error('Erro ao fazer logout:', error);
            showMessage('Erro ao fazer logout: ' + error.message, 'error');
        }
    }

    calculateRank(trophies) {
        if (trophies < 100) return 'Bronze I';
        if (trophies < 200) return 'Bronze II';
        if (trophies < 300) return 'Bronze III';
        if (trophies < 500) return 'Prata I';
        if (trophies < 700) return 'Prata II';
        if (trophies < 900) return 'Prata III';
        if (trophies < 1200) return 'Ouro I';
        if (trophies < 1500) return 'Ouro II';
        if (trophies < 1800) return 'Ouro III';
        if (trophies < 2200) return 'Platina I';
        if (trophies < 2600) return 'Platina II';
        if (trophies < 3000) return 'Platina III';
        if (trophies < 3500) return 'Diamante I';
        if (trophies < 4000) return 'Diamante II';
        if (trophies < 4500) return 'Diamante III';
        if (trophies < 5000) return 'Mestre I';
        if (trophies < 6000) return 'Mestre II';
        if (trophies < 7000) return 'Mestre III';
        return 'Lenda';
    }

    async updatePlayerStats(result, trophyChange) {
        try {
            const updates = {
                trophies: Math.max(0, window.gameState.user.trophies + trophyChange),
                totalGames: (window.gameState.user.totalGames || 0) + 1,
                lastActive: window.firebaseApp.serverTimestamp()
            };
            
            if (result === 'victory') {
                updates.wins = (window.gameState.user.wins || 0) + 1;
            } else if (result === 'defeat') {
                updates.losses = (window.gameState.user.losses || 0) + 1;
            }
            
            // Atualizar rank baseado nos troféus
            updates.rank = this.calculateRank(updates.trophies);
            
            await window.firebaseApp.updateDoc(window.firebaseApp.doc(window.firebaseApp.db, 'users', window.gameState.user.uid), updates);
            
            // Atualizar dados locais
            Object.assign(window.gameState.user, updates);
            
        } catch (error) {
            console.error('Erro ao atualizar estatísticas:', error);
        }
    }
}

// Função global para logout
window.logout = () => {
    window.authSystem.logout();
};

// Função global para trocar abas
window.switchTab = (tab) => {
    document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.auth-form').forEach(f => f.classList.remove('active'));
    
    document.querySelector(`[onclick="switchTab('${tab}')"]`).classList.add('active');
    document.getElementById(tab + 'Form').classList.add('active');
};

// Inicializar sistema de autenticação
window.authSystem = new AuthSystem();

console.log('🔐 Sistema de autenticação carregado!');