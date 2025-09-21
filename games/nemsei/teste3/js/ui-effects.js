// ui-effects.js

class UIEffects {
    constructor() {
        this.setupParticles();
        this.setupResponsiveHandlers();
    }

    setupParticles() {
        const particlesContainer = document.getElementById('particles');
        const particleCount = 50;

        for (let i = 0; i < particleCount; i++) {
            setTimeout(() => {
                this.createParticle(particlesContainer);
            }, i * 100);
        }

        // Recriar partículas periodicamente
        setInterval(() => {
            if (particlesContainer.children.length < particleCount) {
                this.createParticle(particlesContainer);
            }
        }, 2000);
    }

    createParticle(container) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        
        // Posição inicial aleatória
        particle.style.left = Math.random() * 100 + '%';
        particle.style.top = Math.random() * 100 + '%';
        
        // Delay de animação aleatório
        particle.style.animationDelay = Math.random() * 6 + 's';
        
        // Duração de animação variável
        particle.style.animationDuration = (4 + Math.random() * 4) + 's';
        
        // Opacidade inicial aleatória
        particle.style.opacity = 0.3 + Math.random() * 0.7;
        
        container.appendChild(particle);
        
        // Remover partícula após um tempo
        setTimeout(() => {
            if (particle.parentNode) {
                particle.parentNode.removeChild(particle);
            }
        }, 8000);
    }

    setupResponsiveHandlers() {
        // Redimensionamento responsivo
        window.addEventListener('resize', () => {
            this.handleResize();
        });
        
        // Detectar dispositivos móveis
        if (window.innerWidth <= 768) {
            document.body.classList.add('mobile');
        }
    }

    handleResize() {
        if (window.gameInstance && window.gameInstance.canvas) {
            const canvas = window.gameInstance.canvas;
            const maxWidth = window.innerWidth - 40;
            const maxHeight = window.innerHeight - 120;
            const aspectRatio = 1200 / 700;
            
            if (maxWidth / aspectRatio <= maxHeight) {
                canvas.width = maxWidth;
                canvas.height = maxWidth / aspectRatio;
            } else {
                canvas.height = maxHeight;
                canvas.width = maxHeight * aspectRatio;
            }
        }
    }
}

// Funções de UI globais
function showMessage(message, type = 'info') {
    const messageDiv = document.getElementById('authMessage');
    const messageClass = type === 'error' ? 'error-message' : 
                        type === 'success' ? 'success-message' : 'info-message';
    
    const messageElement = document.createElement('div');
    messageElement.className = messageClass;
    messageElement.textContent = message;
    
    messageDiv.innerHTML = '';
    messageDiv.appendChild(messageElement);
    
    // Auto-remover após 5 segundos
    setTimeout(() => {
        messageDiv.innerHTML = '';
    }, 5000);
}

function showLoginScreen() {
    console.log('📱 Mostrando tela de login');
    document.getElementById('loginScreen').classList.remove('hidden');
    document.getElementById('mainMenu').classList.add('hidden');
    document.getElementById('matchmakingScreen').classList.add('hidden');
    document.getElementById('gameContainer').style.display = 'none';
}

function showMainMenu() {
    console.log('📱 Mostrando menu principal');
    
    if (window.gameState.user) {
        document.getElementById('welcomeUser').textContent = 
            `Bem-vindo, ${window.gameState.user.displayName}!`;
        document.getElementById('userRank').textContent = 
            window.gameState.user.rank || 'Bronze I';
        document.getElementById('userTrophies').textContent = 
            `${window.gameState.user.trophies || 0} 🏆`;
        
        // Atualizar contador de players online
        document.getElementById('onlineCount').textContent = 
            `${window.gameState.onlinePlayersCount} jogadores online`;
    }
    
    document.getElementById('loginScreen').classList.add('hidden');
    document.getElementById('mainMenu').classList.remove('hidden');
    document.getElementById('matchmakingScreen').classList.add('hidden');
    document.getElementById('gameContainer').style.display = 'none';
}

function showMatchmakingScreen() {
    console.log('📱 Mostrando tela de matchmaking');
    document.getElementById('loginScreen').classList.add('hidden');
    document.getElementById('mainMenu').classList.add('hidden');
    document.getElementById('matchmakingScreen').classList.remove('hidden');
    document.getElementById('gameContainer').style.display = 'none';
}

function showGameScreen() {
    console.log('📱 Mostrando tela de jogo');
    document.getElementById('loginScreen').classList.add('hidden');
    document.getElementById('mainMenu').classList.add('hidden');
    document.getElementById('matchmakingScreen').classList.add('hidden');
    document.getElementById('gameContainer').style.display = 'block';
}

// Sistema de notificações in-game
class NotificationSystem {
    constructor() {
        this.notifications = [];
        this.container = null;
        this.createContainer();
    }

    createContainer() {
        this.container = document.createElement('div');
        this.container.id = 'notifications-container';
        this.container.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 9999;
            pointer-events: none;
        `;
        document.body.appendChild(this.container);
    }

    show(message, type = 'info', duration = 4000) {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.style.cssText = `
            background: rgba(0, 0, 0, 0.9);
            backdrop-filter: blur(10px);
            padding: 15px 20px;
            border-radius: 10px;
            margin-bottom: 10px;
            color: white;
            font-size: 14px;
            font-weight: 500;
            border-left: 4px solid ${this.getTypeColor(type)};
            animation: slideInRight 0.3s ease-out;
            pointer-events: auto;
            cursor: pointer;
            transition: all 0.3s ease;
            box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
        `;
        
        notification.textContent = message;
        
        // Click para fechar
        notification.addEventListener('click', () => {
            this.remove(notification);
        });
        
        this.container.appendChild(notification);
        this.notifications.push(notification);
        
        // Auto-remover
        setTimeout(() => {
            this.remove(notification);
        }, duration);
        
        // Limitar número de notificações
        if (this.notifications.length > 5) {
            this.remove(this.notifications[0]);
        }
    }

    remove(notification) {
        if (notification && notification.parentNode) {
            notification.style.animation = 'slideOutRight 0.3s ease-in forwards';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
                const index = this.notifications.indexOf(notification);
                if (index > -1) {
                    this.notifications.splice(index, 1);
                }
            }, 300);
        }
    }

    getTypeColor(type) {
        switch (type) {
            case 'success': return '#51cf66';
            case 'error': return '#ff6b6b';
            case 'warning': return '#ffd43b';
            case 'info': return '#74c0fc';
            default: return '#74c0fc';
        }
    }

    clear() {
        this.notifications.forEach(notification => {
            this.remove(notification);
        });
    }
}

// Sistema de loading
class LoadingSystem {
    constructor() {
        this.overlay = null;
        this.createOverlay();
    }

    createOverlay() {
        this.overlay = document.createElement('div');
        this.overlay.id = 'loading-overlay';
        this.overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.8);
            backdrop-filter: blur(5px);
            display: none;
            justify-content: center;
            align-items: center;
            z-index: 10000;
            flex-direction: column;
            color: white;
        `;
        
        this.overlay.innerHTML = `
            <div class="loading-spinner" style="margin-bottom: 20px;"></div>
            <div id="loading-text" style="font-size: 18px; font-weight: 500;">Carregando...</div>
        `;
        
        document.body.appendChild(this.overlay);
    }

    show(text = 'Carregando...') {
        document.getElementById('loading-text').textContent = text;
        this.overlay.style.display = 'flex';
    }

    hide() {
        this.overlay.style.display = 'none';
    }

    updateText(text) {
        const textElement = document.getElementById('loading-text');
        if (textElement) {
            textElement.textContent = text;
        }
    }
}

// Adicionar estilos CSS para animações
const animationStyles = document.createElement('style');
animationStyles.textContent = `
    @keyframes slideInRight {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOutRight {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
    
    .notification:hover {
        transform: translateX(-5px);
        box-shadow: 0 8px 25px rgba(0, 0, 0, 0.4) !important;
    }
`;
document.head.appendChild(animationStyles);

// Inicializar sistemas
window.uiEffects = new UIEffects();
window.notificationSystem = new NotificationSystem();
window.loadingSystem = new LoadingSystem();

// Funções globais para facilitar uso
window.showNotification = (message, type, duration) => {
    window.notificationSystem.show(message, type, duration);
};

window.showLoading = (text) => {
    window.loadingSystem.show(text);
};

window.hideLoading = () => {
    window.loadingSystem.hide();
};

window.updateLoadingText = (text) => {
    window.loadingSystem.updateText(text);
};

console.log('✨ Sistema de UI e efeitos carregado!');