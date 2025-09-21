// Main Game Engine
window.GameEngine = {
    canvas: null,
    ctx: null,
    players: {},
    myTank: null,
    projectiles: [],
    powerups: [],
    map: null,
    isRunning: false,
    matchId: null,
    
    init(matchId) {
        this.matchId = matchId;
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        this.setupCanvas();
        this.loadMap();
        this.createMyTank();
        this.startNetworking();
        this.isRunning = true;
        this.gameLoop();
    },
    
    setupCanvas() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        
        window.addEventListener('resize', () => {
            this.canvas.width = window.innerWidth;
            this.canvas.height = window.innerHeight;
        });
    },
    
    createMyTank() {
        const spawnPoint = this.map.getSpawnPoint();
        this.myTank = new Tank({
            x: spawnPoint.x,
            y: spawnPoint.y,
            color: '#667eea',
            isLocal: true,
            id: auth.currentUser.uid
        });
        
        this.players[auth.currentUser.uid] = this.myTank;
        
        // Sincronizar posição inicial
        NetworkManager.sendPosition(this.myTank);
    },
    
    gameLoop() {
        if (!this.isRunning) return;
        
        // Update
        this.update();
        
        // Render
        this.render();
        
        requestAnimationFrame(() => this.gameLoop());
    },
    
    update() {
        // Atualizar tanque local
        if (this.myTank) {
            this.myTank.update();
            
            // Verificar colisões com power-ups
            this.powerups.forEach((powerup, index) => {
                if (Physics.checkCollision(this.myTank, powerup)) {
                    powerup.apply(this.myTank);
                    this.powerups.splice(index, 1);
                }
            });
        }
        
        // Atualizar projéteis
        this.projectiles.forEach((projectile, index) => {
            projectile.update();
            
            // Verificar colisões com tanques
            Object.values(this.players).forEach(tank => {
                if (tank.id !== projectile.ownerId && Physics.checkCollision(projectile, tank)) {
                    tank.takeDamage(projectile.damage);
                    this.projectiles.splice(index, 1);
                    
                    // Enviar dano pela rede
                    NetworkManager.sendDamage(tank.id, projectile.damage);
                }
            });
            
            // Remover projéteis fora da tela
            if (projectile.isOutOfBounds()) {
                this.projectiles.splice(index, 1);
            }
        });
        
        // Atualizar outros jogadores
        Object.values(this.players).forEach(player => {
            if (player.id !== auth.currentUser.uid) {
                player.interpolate();
            }
        });
    },
    
    render() {
        // Limpar canvas
        this.ctx.fillStyle = '#2a2a2a';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Renderizar mapa
        if (this.map) {
            this.map.render(this.ctx);
        }
        
        // Renderizar power-ups
        this.powerups.forEach(powerup => {
            powerup.render(this.ctx);
        });
        
        // Renderizar tanques
        Object.values(this.players).forEach(player => {
            player.render(this.ctx);
        });
        
        // Renderizar projéteis
        this.projectiles.forEach(projectile => {
            projectile.render(this.ctx);
        });
        
        // Renderizar HUD
        HUD.render(this.ctx, this.myTank);
    },
    
    loadMap() {
        this.map = new GameMap('desert');
        this.map.load();
    },
    
    startNetworking() {
        NetworkManager.init(this.matchId);
        NetworkManager.onPlayerUpdate = (playerId, data) => {
            if (playerId !== auth.currentUser.uid) {
                if (!this.players[playerId]) {
                    this.players[playerId] = new Tank({
                        x: data.x,
                        y: data.y,
                        rotation: data.rotation,
                        color: data.color,
                        isLocal: false,
                        id: playerId
                    });
                } else {
                    this.players[playerId].setNetworkPosition(data);
                }
            }
        };
    },
    
    fire() {
        if (this.myTank && this.myTank.canFire()) {
            const projectile = this.myTank.fire();
            this.projectiles.push(projectile);
            NetworkManager.sendFire(projectile);
        }
    }
};