// Tank Class
class Tank {
    constructor(config) {
        this.x = config.x || 400;
        this.y = config.y || 300;
        this.rotation = config.rotation || 0;
        this.speed = config.speed || 3;
        this.health = 100;
        this.maxHealth = 100;
        this.ammo = 30;
        this.maxAmmo = 30;
        this.fuel = 100;
        this.maxFuel = 100;
        this.color = config.color || '#667eea';
        this.isLocal = config.isLocal || false;
        this.id = config.id;
        this.size = 40;
        this.cannonLength = 35;
        this.lastFireTime = 0;
        this.fireRate = 500; // ms entre tiros
        
        // Network interpolation
        this.targetX = this.x;
        this.targetY = this.y;
        this.targetRotation = this.rotation;
    }
    
    update() {
        if (this.isLocal) {
            // Controle local
            const controls = ControlManager.getInput();
            
            if (controls.forward && this.fuel > 0) {
                this.x += Math.cos(this.rotation) * this.speed;
                this.y += Math.sin(this.rotation) * this.speed;
                this.fuel -= 0.1;
            }
            
            if (controls.backward && this.fuel > 0) {
                this.x -= Math.cos(this.rotation) * this.speed * 0.5;
                this.y -= Math.sin(this.rotation) * this.speed * 0.5;
                this.fuel -= 0.05;
            }
            
            if (controls.left) {
                this.rotation -= 0.05;
            }
            
            if (controls.right) {
                this.rotation += 0.05;
            }
            
            // Limitar posição ao mapa
            this.x = Math.max(this.size, Math.min(GameEngine.canvas.width - this.size, this.x));
            this.y = Math.max(this.size, Math.min(GameEngine.canvas.height - this.size, this.y));
        }
    }
    
    interpolate() {
        // Suavizar movimento de tanques remotos
        this.x += (this.targetX - this.x) * 0.1;
        this.y += (this.targetY - this.y) * 0.1;
        this.rotation += (this.targetRotation - this.rotation) * 0.1;
    }
    
    setNetworkPosition(data) {
        this.targetX = data.x;
        this.targetY = data.y;
        this.targetRotation = data.rotation;
    }
    
    render(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);
        
        // Desenhar corpo do tanque
        ctx.fillStyle = this.color;
        ctx.fillRect(-this.size/2, -this.size/3, this.size, this.size * 0.66);
        
        // Desenhar esteiras
        ctx.fillStyle = '#333';
        ctx.fillRect(-this.size/2, -this.size/3 - 5, this.size, 5);
        ctx.fillRect(-this.size/2, this.size/3, this.size, 5);
        
        // Desenhar torre
        ctx.beginPath();
        ctx.arc(0, 0, this.size/3, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // Desenhar canhão
        ctx.fillStyle = '#333';
        ctx.fillRect(0, -3, this.cannonLength, 6);
        
        // Desenhar ponta do canhão
        ctx.fillRect(this.cannonLength - 5, -5, 10, 10);
        
        ctx.restore();
        
        // Desenhar barra de vida
        if (this.health < this.maxHealth) {
            ctx.fillStyle = 'rgba(0,0,0,0.3)';
            ctx.fillRect(this.x - 25, this.y - 40, 50, 6);
            
            const healthPercent = this.health / this.maxHealth;
            ctx.fillStyle = healthPercent > 0.5 ? '#4CAF50' : healthPercent > 0.25 ? '#FFC107' : '#F44336';
            ctx.fillRect(this.x - 25, this.y - 40, 50 * healthPercent, 6);
        }
        
        // Desenhar nome do jogador
        if (!this.isLocal) {
            ctx.fillStyle = 'white';
            ctx.font = '12px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(this.id.substring(0, 8), this.x, this.y - 45);
        }
    }
    
    canFire() {
        return this.ammo > 0 && Date.now() - this.lastFireTime > this.fireRate;
    }
    
    fire() {
        if (this.canFire()) {
            this.ammo--;
            this.lastFireTime = Date.now();
            
            const projectile = new Projectile({
                x: this.x + Math.cos(this.rotation) * this.cannonLength,
                y: this.y + Math.sin(this.rotation) * this.cannonLength,
                angle: this.rotation,
                ownerId: this.id,
                damage: 10
            });
            
            return projectile;
        }
    }
    
    takeDamage(damage) {
        this.health = Math.max(0, this.health - damage);
        
        if (this.health === 0 && this.isLocal) {
            // Jogador morreu
            NetworkManager.sendDeath();
        }
    }
    
    refuel(amount) {
        this.fuel = Math.min(this.maxFuel, this.fuel + amount);
    }
    
    reload(amount) {
        this.ammo = Math.min(this.maxAmmo, this.ammo + amount);
    }
    
    repair(amount) {
        this.health = Math.min(this.maxHealth, this.health + amount);
    }
}

window.Tank = Tank;