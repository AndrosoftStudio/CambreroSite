// main.js - Arquivo principal que coordena todos os sistemas

class BrawlClashGame {
    constructor() {
        this.initialized = false;
        this.systems = {};
        
        // Aguardar carregamento completo
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.init());
        } else {
            this.init();
        }
    }

    async init() {
        try {
            console.log('🎮 Inicializando Brawl Clash...');
            
            // Verificar se todos os sistemas estão carregados
            await this.waitForSystems();
            
            // Configurar sistemas
            this.setupSystems();
            
            // Configurar event listeners globais
            this.setupGlobalEvents();
            
            // Marcar como inicializado
            this.initialized = true;
            
            console.log('✅ Brawl Clash inicializado com sucesso!');
            
            // Mostrar tela inicial
            this.showInitialScreen();
            
        } catch (error) {
            console.error('❌ Erro ao inicializar jogo:', error);
            showMessage('Erro ao carregar o jogo. Recarregue a página.', 'error');
        }
    }

    async waitForSystems() {
        const maxWaitTime = 10000; // 10 segundos
        const startTime = Date.now();
        
        while (Date.now() - startTime < maxWaitTime) {
            if (window.firebaseApp && 
                window.authSystem && 
                window.matchmakingSystem && 
                window.uiEffects &&
                window.notificationSystem) {
                return;
            }
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        throw new Error('Timeout ao aguardar carregamento dos sistemas');
    }

    setupSystems() {
        this.systems = {
            auth: window.authSystem,
            matchmaking: window.matchmakingSystem,
            ui: window.uiEffects,
            notifications: window.notificationSystem,
            loading: window.loadingSystem
        };
        
        // Configurar game engine se disponível
        if (window.gameEngine) {
            this.systems.game = window.gameEngine;
        }
    }

    setupGlobalEvents() {
        // Prevenção de comportamentos padrão
        document.addEventListener('contextmenu', (e) => e.preventDefault());
        document.addEventListener('selectstart', (e) => e.preventDefault());
        
        // Controle de visibilidade da página
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.onPageHidden();
            } else {
                this.onPageVisible();
            }
        });
        
        // Controle de conexão
        window.addEventListener('online', () => {
            showNotification('Conexão restaurada!', 'success');
        });
        
        window.addEventListener('offline', () => {
            showNotification('Sem conexão com a internet', 'error');
        });
        
        // Limpeza ao sair
        window.addEventListener('beforeunload', (e) => {
            this.cleanup();
        });
        
        // Redimensionamento
        window.addEventListener('resize', () => {
            this.handleResize();
        });
        
        // Teclas globais
        document.addEventListener('keydown', (e) => {
            this.handleGlobalKeyDown(e);
        });
    }

    showInitialScreen() {
        // Verificar se há usuário logado
        const currentUser = window.firebaseApp?.auth?.currentUser;
        
        if (currentUser) {
            showLoading('Carregando perfil...');
        } else {
            showLoginScreen();
        }
    }

    onPageHidden() {
        console.log('📱 Página oculta');
        
        // Pausar jogo se estiver rodando
        if (window.gameInstance && window.gameInstance.running) {
            window.gameInstance.paused = true;
        }
        
        // Cancelar matchmaking se estiver procurando
        if (!document.getElementById('matchmakingScreen').classList.contains('hidden')) {
            showNotification('Busca pausada - página não está visível', 'warning');
        }
    }

    onPageVisible() {
        console.log('📱 Página visível');
        
        // Retomar jogo se estava pausado
        if (window.gameInstance && window.gameInstance.paused) {
            window.gameInstance.paused = false;
            showNotification('Jogo retomado', 'info');
        }
    }

    handleResize() {
        // Redimensionar canvas do jogo se ativo
        if (window.gameInstance && window.gameInstance.canvas) {
            const canvas = window.gameInstance.canvas;
            const container = document.getElementById('gameContainer');
            
            if (container.style.display !== 'none') {
                this.systems.ui.handleResize();
            }
        }
        
        // Ajustar UI para mobile
        if (window.innerWidth <= 768) {
            document.body.classList.add('mobile');
        } else {
            document.body.classList.remove('mobile');
        }
    }

    handleGlobalKeyDown(e) {
        // Teclas globais que funcionam em qualquer tela
        switch (e.code) {
            case 'F11':
                // Permitir fullscreen
                break;
                
            case 'F5':
                // Permitir refresh
                break;
                
            case 'F12':
                // Permitir dev tools
                break;
                
            case 'Escape':
                // ESC para voltar/cancelar
                this.handleEscapeKey();
                e.preventDefault();
                break;
                
            default:
                // Bloquear outras teclas especiais em produção
                if (e.code.startsWith('F') && e.code !== 'F11' && e.code !== 'F5' && e.code !== 'F12') {
                    e.preventDefault();
                }
                break;
        }
    }

    handleEscapeKey() {
        // Comportamento do ESC baseado na tela atual
        if (!document.getElementById('matchmakingScreen').classList.contains('hidden')) {
            // Na tela de matchmaking - cancelar busca
            cancelMatchmaking();
        } else if (!document.getElementById('gameContainer').style.display !== 'none') {
            // No jogo - mostrar menu de pausa (implementar depois)
            console.log('Menu de pausa (TODO)');
        } else if (!document.getElementById('mainMenu').classList.contains('hidden')) {
            // No menu principal - não fazer nada ou mostrar confirmação de saída
            console.log('No menu principal');
        }
    }

    cleanup() {
        console.log('🧹 Limpando recursos...');
        
        try {
            // Limpar matchmaking
            if (this.systems.matchmaking) {
                this.systems.matchmaking.destroy();
            }
            
            // Marcar usuário como offline
            if (window.gameState.user && this.systems.auth) {
                this.systems.auth.setUserOnline(false);
            }
            
            // Limpar game instance
            if (window.gameInstance) {
                window.gameInstance.cleanup?.();
            }
            
            // Limpar notificações
            if (this.systems.notifications) {
                this.systems.notifications.clear();
            }
            
        } catch (error) {
            console.error('Erro na limpeza:', error);
        }
    }

    // Métodos públicos para controle do jogo
    startGame() {
        if (window.gameEngine) {
            window.gameEngine.startGame();
        } else {
            console.error('Game Engine não carregado');
        }
    }

    returnToMenu() {
        // Limpar estado do jogo
        if (window.gameInstance) {
            window.gameInstance.cleanup?.();
            window.gameInstance = null;
        }
        
        // Resetar estado
        window.gameState.currentMatch = null;
        window.gameState.gameMode = null;
        window.gameState.gameType = null;
        window.gameState.isHost = false;
        window.gameState.players = {};
        
        // Mostrar menu
        showMainMenu();
    }

    // Sistema de debug (apenas em desenvolvimento)
    enableDebugMode() {
        if (window.location.hostname === 'localhost' || 
            window.location.hostname === '127.0.0.1' ||
            window.location.search.includes('debug=true')) {
            
            window.debugMode = true;
            window.gameDebug = {
                state: () => console.log('GameState:', window.gameState),
                systems: () => console.log('Systems:', this.systems),
                clearQueue: () => this.systems.matchmaking?.cleanupQueue(),
                forceMatch: (mode, type) => {
                    window.gameState.gameMode = mode;
                    window.gameState.gameType = type;
                    this.systems.matchmaking?.startGameWithBots();
                },
                addTrophies: (amount) => {
                    if (window.gameState.user) {
                        window.gameState.user.trophies += amount;
                        showNotification(`+${amount} troféus (debug)`, 'success');
                    }
                }
            };
            
            console.log('🐛 Modo debug ativado. Use window.gameDebug para comandos.');
        }
    }

    // Verificação de compatibilidade
    checkCompatibility() {
        const issues = [];
        
        // Verificar canvas
        if (!document.createElement('canvas').getContext) {
            issues.push('Canvas não suportado');
        }
        
        // Verificar WebGL
        try {
            const canvas = document.createElement('canvas');
            const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
            if (!gl) {
                issues.push('WebGL não suportado');
            }
        } catch (e) {
            issues.push('WebGL não disponível');
        }
        
        // Verificar localStorage
        try {
            localStorage.setItem('test', 'test');
            localStorage.removeItem('test');
        } catch (e) {
            issues.push('LocalStorage não disponível');
        }
        
        // Verificar WebSocket
        if (!window.WebSocket) {
            issues.push('WebSocket não suportado');
        }
        
        if (issues.length > 0) {
            console.warn('⚠️ Problemas de compatibilidade:', issues);
            showNotification('Seu navegador pode não suportar todos os recursos do jogo', 'warning', 8000);
        }
        
        return issues.length === 0;
    }

    // Métricas de performance
    startPerformanceMonitoring() {
        if (window.location.search.includes('perf=true')) {
            setInterval(() => {
                const memory = performance.memory;
                if (memory) {
                    console.log('Memory:', {
                        used: Math.round(memory.usedJSHeapSize / 1024 / 1024) + 'MB',
                        total: Math.round(memory.totalJSHeapSize / 1024 / 1024) + 'MB',
                        limit: Math.round(memory.jsHeapSizeLimit / 1024 / 1024) + 'MB'
                    });
                }
            }, 5000);
        }
    }
}

// Funções utilitárias globais
window.utils = {
    // Formatação de tempo
    formatTime: (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    },
    
    // Formatação de números
    formatNumber: (num) => {
        if (num >= 1000000) {
            return (num / 1000000).toFixed(1) + 'M';
        } else if (num >= 1000) {
            return (num / 1000).toFixed(1) + 'K';
        }
        return num.toString();
    },
    
    // Calcular distância
    distance: (x1, y1, x2, y2) => {
        return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
    },
    
    // Clamp valor
    clamp: (value, min, max) => {
        return Math.min(Math.max(value, min), max);
    },
    
    // Interpolar entre valores
    lerp: (start, end, factor) => {
        return start + (end - start) * factor;
    },
    
    // Gerar ID único
    generateId: () => {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    },
    
    // Debounce função
    debounce: (func, wait) => {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
};

// Inicializar jogo
window.brawlClash = new BrawlClashGame();

// Ativar modo debug se necessário
setTimeout(() => {
    if (window.brawlClash) {
        window.brawlClash.enableDebugMode();
        window.brawlClash.checkCompatibility();
        window.brawlClash.startPerformanceMonitoring();
    }
}, 1000);

console.log('🎮 Sistema principal do Brawl Clash carregado!');