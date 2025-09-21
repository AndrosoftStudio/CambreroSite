// game-engine.js - Engine simplificado do jogo

class GameEngine {
    constructor() {
        this.canvas = null;
        this.ctx = null;
        this.running = false;
        this.paused = false;
        this.lastTime = 0;
        this.fps = 60;
        this.frameId = null;
    }

    startGame() {
        try {
            console.log('🎮 Iniciando jogo...');
            
            showGameScreen();
            this.initializeCanvas();
            this.setupControls();
            this.startGameLoop();
            
            // Simular início de jogo
            setTimeout(() => {
                showNotification('Jogo iniciado! Use WASD para mover', 'success');
            }, 1000);
            
        } catch (error) {
            console.error('Erro ao iniciar jogo:', error);
            showNotification('Erro ao iniciar jogo', 'error');
            showMainMenu();
        }
    }

    initializeCanvas() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        // Redimensionar canvas
        const maxWidth = window.innerWidth - 40;
        const maxHeight = window.innerHeight - 120;
        const aspectRatio = 1200 / 700;
        
        if (maxWidth / aspectRatio <= maxHeight) {
            this.canvas.width = maxWidth;
            this.canvas.height = maxWidth / aspectRatio;
        } else {
            this.canvas.height = maxHeight;
            this.canvas.width = maxHeight * aspectRatio;
        }
        
        // Armazenar dimensões lógicas
        this.logicalWidth = 1200;
        this.logicalHeight = 700;
        this.scaleX = this.canvas.width / this.logicalWidth;
        this.scaleY = this.canvas.height / this.logicalHeight;
        
        console.log(`Canvas: ${this.canvas.width}x${this.canvas.height}, Escala: ${this.scaleX.toFixed(2)}x${this.scaleY.toFixed(2)}`);
    }

    setupControls() {
        // Controles básicos do jogo
        document.getElementById('buildBtn')?.addEventListener('click', () => {
            showNotification('Modo construção (em desenvolvimento)', 'info');
        });
        
        document.getElementById('summonServoBtn')?.addEventListener('click', () => {
            showNotification('Servo invocado!', 'success');
        });
        
        document.getElementById('summonSoldierBtn')?.addEventListener('click', () => {
            showNotification('Soldado invocado!', 'success');
        });
        
        document.getElementById('upgradeBtn')?.addEventListener('click', () => {
            showNotification('Upgrade realizado!', 'success');
        });
        
        document.getElementById('specialBtn')?.addEventListener('click', () => {
            showNotification('Habilidade especial ativada!', 'success');
        });
        
        // Chat
        const chatInput = document.getElementById('chatInput');
        if (chatInput) {
            chatInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.sendChatMessage();
                }
            });
        }
    }

    startGameLoop() {
        this.running = true;
        
        const gameLoop = (currentTime) => {
            if (!this.running) return;
            
            // Calcular FPS
            if (this.lastTime) {
                const deltaTime = currentTime - this.lastTime;
                this.fps = Math.round(1000 / deltaTime);
            }
            this.lastTime = currentTime;
            
            if (!this.paused) {
                this.update();
                this.render();
            }
            
            this.frameId = requestAnimationFrame(gameLoop);
        };
        
        this.frameId = requestAnimationFrame(gameLoop);
        console.log('🔄 Game loop iniciado');
    }

    update() {
        // Atualização da lógica do jogo (placeholder)
        // Aqui seria onde atualizamos entidades, física, etc.
    }

    render() {
        if (!this.ctx) return;
        
        // Limpar canvas
        this.ctx.save();
        this.ctx.scale(this.scaleX, this.scaleY);
        
        // Fundo do jogo
        const gradient = this.ctx.createRadialGradient(
            this.logicalWidth/2, this.logicalHeight/2, 0,
            this.logicalWidth/2, this.logicalHeight/2, Math.max(this.logicalWidth, this.logicalHeight)
        );
        gradient.addColorStop(0, '#0f3460');
        gradient.addColorStop(1, '#0a2040');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.logicalWidth, this.logicalHeight);
        
        // Grid
        this.drawGrid();
        
        // Placeholder para demonstração
        this.drawPlaceholderGame();
        
        // UI overlay
        this.drawUI();
        
        this.ctx.restore();
    }

    drawGrid() {
        this.ctx.strokeStyle = 'rgba(0, 212, 255, 0.1)';
        this.ctx.lineWidth = 1;
        
        for (let x = 0; x < this.logicalWidth; x += 50) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, this.logicalHeight);
            this.ctx.stroke();
        }
        
        for (let y = 0; y < this.logicalHeight; y += 50) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(this.logicalWidth, y);
            this.ctx.stroke();
        }
    }

    drawPlaceholderGame() {
        // Desenhar bases
        this.drawBase(100, this.logicalHeight/2, 'blue');
        this.drawBase(this.logicalWidth - 100, this.logicalHeight/2, 'red');
        
        // Desenhar pontos de extração
        for (let i = 1; i <= 4; i++) {
            const x = (this.logicalWidth / 5) * i;
            const y = this.logicalHeight / 2 + (Math.sin(Date.now() / 1000 + i) * 50);
            this.drawExtractionPoint(x, y);
        }
        
        // Desenhar jogador (placeholder)
        const playerX = 200 + Math.sin(Date.now() / 1000) * 50;
        const playerY = this.logicalHeight/2;
        this.drawPlayer(playerX, playerY);
    }

    drawBase(x, y, team) {
        const size = 40;
        
        // Sombra
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        this.ctx.fillRect(x - size + 3, y - size + 3, size * 2, size * 2);
        
        // Base
        this.ctx.fillStyle = team === 'blue' ? '#4444ff' : '#ff4444';
        this.ctx.fillRect(x - size, y - size, size * 2, size * 2);
        
        // Borda
        this.ctx.strokeStyle = team === 'blue' ? '#6666ff' : '#ff6666';
        this.ctx.lineWidth = 3;
        this.ctx.strokeRect(x - size, y - size, size * 2, size * 2);
        
        // Texto
        this.ctx.fillStyle = 'white';
        this.ctx.font = 'bold 12px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('BASE', x, y + size + 20);
    }

    drawExtractionPoint(x, y) {
        this.ctx.fillStyle = 'rgba(0, 255, 0, 0.3)';
        this.ctx.beginPath();
        this.ctx.arc(x, y, 20, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.strokeStyle = '#00ff00';
        this.ctx.lineWidth = 2;
        this.ctx.stroke();
        
        this.ctx.fillStyle = 'white';
        this.ctx.font = '16px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('⛏️', x, y + 5);
    }

    drawPlayer(x, y) {
        const size = 15;
        
        // Sombra
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        this.ctx.beginPath();
        this.ctx.arc(x + 2, y + 2, size, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Jogador
        const gradient = this.ctx.createRadialGradient(x, y, 0, x, y, size);
        gradient.addColorStop(0, '#6666ff');
        gradient.addColorStop(1, '#4444ff');
        this.ctx.fillStyle = gradient;
        this.ctx.beginPath();
        this.ctx.arc(x, y, size, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Borda
        this.ctx.strokeStyle = '#8888ff';
        this.ctx.lineWidth = 3;
        this.ctx.stroke();
        
        // Nome
        this.ctx.fillStyle = 'white';
        this.ctx.font = 'bold 14px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.strokeStyle = 'black';
        this.ctx.lineWidth = 3;
        this.ctx.strokeText(window.gameState.user?.displayName || 'Jogador', x, y - size - 10);
        this.ctx.fillText(window.gameState.user?.displayName || 'Jogador', x, y - size - 10);
    }

    drawUI() {
        // Informações de debug no canto
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillRect(10, 10, 200, 80);
        
        this.ctx.fillStyle = 'white';
        this.ctx.font = '12px monospace';
        this.ctx.textAlign = 'left';
        this.ctx.fillText(`FPS: ${this.fps}`, 20, 30);
        this.ctx.fillText(`Jogadores: ${window.gameState.players?.length || 0}`, 20, 45);
        this.ctx.fillText(`Modo: ${window.gameState.gameMode || 'N/A'}`, 20, 60);
        this.ctx.fillText(`Tipo: ${window.gameState.gameType || 'N/A'}`, 20, 75);
    }

    sendChatMessage() {
        const input = document.getElementById('chatInput');
        const message = input?.value?.trim();
        
        if (message && window.gameState.user) {
            this.addChatMessage(window.gameState.user.displayName, message);
            input.value = '';
        }
    }

    addChatMessage(sender, message) {
        const chatMessages = document.getElementById('chatMessages');
        if (!chatMessages) return;
        
        const messageDiv = document.createElement('div');
        messageDiv.innerHTML = `<strong>${sender}:</strong> ${message}`;
        messageDiv.style.marginBottom = '5px';
        messageDiv.style.fontSize = '13px';
        
        chatMessages.appendChild(messageDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
        
        // Limitar a 50 mensagens
        while (chatMessages.children.length > 50) {
            chatMessages.removeChild(chatMessages.firstChild);
        }
    }

    // Simular fim de jogo após um tempo
    simulateGameEnd() {
        setTimeout(() => {
            this.endGame('victory');
        }, 30000); // 30 segundos para teste
    }

    endGame(result) {
        this.running = false;
        
        if (this.frameId) {
            cancelAnimationFrame(this.frameId);
            this.frameId = null;
        }
        
        let message = '';
        let trophyChange = 0;
        
        switch(result) {
            case 'victory':
                message = '🎉 VITÓRIA! Parabéns!';
                trophyChange = window.gameState.gameType === 'competitive' ? 25 : 10;
                break;
            case 'defeat':
                message = '💀 DERROTA! Tente novamente!';
                trophyChange = window.gameState.gameType === 'competitive' ? -15 : -5;
                break;
            default:
                message = '⏰ Jogo finalizado!';
                trophyChange = 0;
                break;
        }
        
        // Atualizar estatísticas se não for com bots
        if (window.gameState.currentMatch && window.authSystem) {
            window.authSystem.updatePlayerStats(result, trophyChange);
        }
        
        setTimeout(() => {
            const finalMessage = `${message}\n\nTroféus: ${trophyChange >= 0 ? '+' : ''}${trophyChange}`;
            alert(finalMessage);
            
            this.cleanup();
            showMainMenu();
            
            showNotification('Jogo finalizado!', result === 'victory' ? 'success' : 'info');
        }, 1000);
    }

    stop() {
        this.running = false;
        if (this.frameId) {
            cancelAnimationFrame(this.frameId);
            this.frameId = null;
        }
    }

    cleanup() {
        this.stop();
        
        // Limpar estado
        window.gameInstance = null;
        window.gameState.currentMatch = null;
        
        console.log('🧹 Game engine limpo');
    }
}

// Funções globais para o jogo
window.sendChatMessage = () => {
    if (window.gameInstance) {
        window.gameInstance.sendChatMessage();
    }
};

// Inicializar engine
window.gameEngine = new GameEngine();

// Armazenar referência global para o jogo ativo
window.gameInstance = null;

console.log('🎮 Game Engine carregado!');