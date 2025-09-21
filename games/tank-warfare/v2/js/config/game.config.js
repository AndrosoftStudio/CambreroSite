// ========================================
// TANK WARFARE - GAME CONFIGURATION
// ========================================

window.GameConfig = {
    // Versão do jogo
    version: '1.0.0',
    
    // Configurações de gameplay
    gameplay: {
        // Modos de jogo
        modes: {
            solo: {
                minPlayers: 2,
                maxPlayers: 10,
                respawnTime: 5000, // 5 segundos
                matchDuration: 300000, // 5 minutos
                pointsPerKill: 10,
                pointsPerDeath: -5,
                winCondition: 'points', // points, time, kills
                targetPoints: 100
            },
            casual: {
                minPlayers: 2,
                maxPlayers: 10,
                respawnEnabled: false,
                matchDuration: 600000, // 10 minutos
                friendlyFire: false,
                botsEnabled: true,
                botDifficulty: 'medium'
            },
            competitive: {
                minPlayers: 2,
                maxPlayers: 10,
                respawnEnabled: false,
                matchDuration: 900000, // 15 minutos
                friendlyFire: true,
                botsEnabled: false,
                rankingEnabled: true,
                winReward: 200,
                loseReward: 50
            }
        },
        
        // Configurações de team sizes
        teamSizes: ['1v1', '2v2', '3v3', '4v4', '5v5'],
        
        // Matchmaking
        matchmaking: {
            searchTimeout: 120000, // 2 minutos
            rankTolerance: 5, // Diferença máxima de rank
            pingLimit: 150, // ms
            regionLocked: false
        }
    },
    
    // Configurações de tanques
    tanks: {
        default: {
            health: 100,
            armor: 50,
            speed: 3,
            rotationSpeed: 0.05,
            fireRate: 500, // ms entre tiros
            damage: 10,
            ammo: 30,
            fuel: 100,
            size: 40
        },
        
        classes: {
            light: {
                health: 75,
                armor: 25,
                speed: 5,
                rotationSpeed: 0.07,
                fireRate: 400,
                damage: 8,
                ammo: 40,
                fuel: 120,
                size: 35
            },
            medium: {
                health: 100,
                armor: 50,
                speed: 3,
                rotationSpeed: 0.05,
                fireRate: 500,
                damage: 10,
                ammo: 30,
                fuel: 100,
                size: 40
            },
            heavy: {
                health: 150,
                armor: 100,
                speed: 2,
                rotationSpeed: 0.03,
                fireRate: 700,
                damage: 15,
                ammo: 20,
                fuel: 80,
                size: 50
            },
            destroyer: {
                health: 100,
                armor: 75,
                speed: 1.5,
                rotationSpeed: 0.02,
                fireRate: 1000,
                damage: 25,
                ammo: 15,
                fuel: 60,
                size: 45
            }
        }
    },
    
    // Configurações de projéteis
    projectiles: {
        default: {
            speed: 10,
            damage: 10,
            size: 5,
            lifetime: 3000, // ms
            penetration: false
        },
        
        types: {
            standard: {
                speed: 10,
                damage: 10,
                size: 5,
                color: '#FFD700'
            },
            armor_piercing: {
                speed: 12,
                damage: 15,
                size: 4,
                color: '#FF4500',
                penetration: true
            },
            explosive: {
                speed: 8,
                damage: 20,
                size: 8,
                color: '#FF6347',
                areaOfEffect: 50
            },
            tracer: {
                speed: 15,
                damage: 5,
                size: 3,
                color: '#00FF00',
                trail: true
            }
        }
    },
    
    // Configurações de power-ups
    powerups: {
        spawn: {
            interval: 15000, // 15 segundos
            maxOnMap: 5,
            despawnTime: 30000 // 30 segundos
        },
        
        types: {
            shield: {
                duration: 10000,
                protection: 0.5, // 50% de redução de dano
                icon: '🛡️',
                color: '#9C27B0',
                rarity: 'rare'
            },
            speed_boost: {
                duration: 8000,
                multiplier: 1.5,
                icon: '⚡',
                color: '#2196F3',
                rarity: 'common'
            },
            rapid_fire: {
                duration: 10000,
                multiplier: 2,
                icon: '🔥',
                color: '#FF9800',
                rarity: 'uncommon'
            },
            invisibility: {
                duration: 5000,
                opacity: 0.3,
                icon: '👻',
                color: '#607D8B',
                rarity: 'legendary'
            },
            damage_boost: {
                duration: 12000,
                multiplier: 2,
                icon: '💥',
                color: '#F44336',
                rarity: 'rare'
            },
            heal: {
                instant: true,
                amount: 50,
                icon: '❤️',
                color: '#4CAF50',
                rarity: 'common'
            },
            ammo: {
                instant: true,
                amount: 15,
                icon: '🎯',
                color: '#FFC107',
                rarity: 'common'
            },
            fuel: {
                instant: true,
                amount: 50,
                icon: '⛽',
                color: '#00BCD4',
                rarity: 'common'
            }
        }
    },
    
    // Configurações de mapas
    maps: {
        available: ['desert', 'jungle', 'arctic', 'urban', 'space'],
        
        sizes: {
            small: { width: 1000, height: 1000 },
            medium: { width: 1500, height: 1500 },
            large: { width: 2000, height: 2000 }
        },
        
        obstacles: {
            destructible: {
                crate: { health: 20, size: 40 },
                barrel: { health: 10, size: 30, explosive: true }
            },
            indestructible: {
                wall: { size: 50 },
                rock: { size: 60 }
            }
        }
    },
    
    // Sistema de ranking
    ranking: {
        tiers: [
            { id: 'unranked', name: 'Sem Classificação', minWins: 0, icon: '🎯' },
            { id: 'bronze_1', name: 'Bronze I', minPoints: 0, icon: '🥉' },
            { id: 'bronze_2', name: 'Bronze II', minPoints: 100, icon: '🥉' },
            { id: 'bronze_3', name: 'Bronze III', minPoints: 200, icon: '🥉' },
            { id: 'bronze_4', name: 'Bronze IV', minPoints: 300, icon: '🥉' },
            { id: 'bronze_5', name: 'Bronze V', minPoints: 400, icon: '🥉' },
            { id: 'iron_1', name: 'Ferro I', minPoints: 500, icon: '⚙️' },
            { id: 'iron_2', name: 'Ferro II', minPoints: 650, icon: '⚙️' },
            { id: 'iron_3', name: 'Ferro III', minPoints: 800, icon: '⚙️' },
            { id: 'iron_4', name: 'Ferro IV', minPoints: 950, icon: '⚙️' },
            { id: 'iron_5', name: 'Ferro V', minPoints: 1100, icon: '⚙️' },
            { id: 'silver_1', name: 'Prata I', minPoints: 1300, icon: '🥈' },
            { id: 'silver_2', name: 'Prata II', minPoints: 1500, icon: '🥈' },
            { id: 'silver_3', name: 'Prata III', minPoints: 1700, icon: '🥈' },
            { id: 'silver_4', name: 'Prata IV', minPoints: 1900, icon: '🥈' },
            { id: 'silver_5', name: 'Prata V', minPoints: 2100, icon: '🥈' },
            { id: 'gold_1', name: 'Ouro I', minPoints: 2400, icon: '🥇' },
            { id: 'gold_2', name: 'Ouro II', minPoints: 2700, icon: '🥇' },
            { id: 'gold_3', name: 'Ouro III', minPoints: 3000, icon: '🥇' },
            { id: 'gold_4', name: 'Ouro IV', minPoints: 3300, icon: '🥇' },
            { id: 'gold_5', name: 'Ouro V', minPoints: 3600, icon: '🥇' },
            { id: 'platinum_1', name: 'Platina I', minPoints: 4000, icon: '💎' },
            { id: 'platinum_2', name: 'Platina II', minPoints: 4400, icon: '💎' },
            { id: 'platinum_3', name: 'Platina III', minPoints: 4800, icon: '💎' },
            { id: 'platinum_4', name: 'Platina IV', minPoints: 5200, icon: '💎' },
            { id: 'platinum_5', name: 'Platina V', minPoints: 5600, icon: '💎' },
            { id: 'diamond_1', name: 'Diamante I', minPoints: 6100, icon: '💠' },
            { id: 'diamond_2', name: 'Diamante II', minPoints: 6600, icon: '💠' },
            { id: 'diamond_3', name: 'Diamante III', minPoints: 7100, icon: '💠' },
            { id: 'diamond_4', name: 'Diamante IV', minPoints: 7600, icon: '💠' },
            { id: 'diamond_5', name: 'Diamante V', minPoints: 8100, icon: '💠' },
            { id: 'lonsdaleite_1', name: 'Lonsdaleíta I', minPoints: 8700, icon: '⬡' },
            { id: 'lonsdaleite_2', name: 'Lonsdaleíta II', minPoints: 9300, icon: '⬡' },
            { id: 'lonsdaleite_3', name: 'Lonsdaleíta III', minPoints: 9900, icon: '⬡' },
            { id: 'lonsdaleite_4', name: 'Lonsdaleíta IV', minPoints: 10500, icon: '⬡' },
            { id: 'lonsdaleite_5', name: 'Lonsdaleíta V', minPoints: 11100, icon: '⬡' },
            { id: 'nbw_1', name: 'NBW I', minPoints: 11800, icon: '⚡' },
            { id: 'nbw_2', name: 'NBW II', minPoints: 12500, icon: '⚡' },
            { id: 'nbw_3', name: 'NBW III', minPoints: 13200, icon: '⚡' },
            { id: 'nbw_4', name: 'NBW IV', minPoints: 13900, icon: '⚡' },
            { id: 'nbw_5', name: 'NBW V', minPoints: 14600, icon: '⚡' },
            { id: 'titan_1', name: 'Titã I', minPoints: 15400, icon: '🔱' },
            { id: 'titan_2', name: 'Titã II', minPoints: 16200, icon: '🔱' },
            { id: 'titan_3', name: 'Titã III', minPoints: 17000, icon: '🔱' },
            { id: 'titan_4', name: 'Titã IV', minPoints: 17800, icon: '🔱' },
            { id: 'titan_5', name: 'Titã V', minPoints: 18600, icon: '🔱' },
            { id: 'champion_1', name: 'Campeão I', minPoints: 19500, icon: '👑' },
            { id: 'champion_2', name: 'Campeão II', minPoints: 20500, icon: '👑' },
            { id: 'champion_3', name: 'Campeão III', minPoints: 21500, icon: '👑' },
            { id: 'magnus', name: 'Magnus Champion', minPoints: 23000, icon: '🏆' }
        ],
        
        points: {
            win: 25,
            loss: -10,
            kill: 2,
            assist: 1,
            mvp: 10
        }
    },
    
    // Economia do jogo
    economy: {
        startingCoins: 1000,
        startingGems: 50,
        
        rewards: {
            daily: {
                coins: 100,
                gems: 5
            },
            win: {
                casual: { coins: 50, gems: 0 },
                competitive: { coins: 100, gems: 2 },
                solo: { coins: 30, gems: 0 }
            },
            loss: {
                casual: { coins: 10, gems: 0 },
                competitive: { coins: 25, gems: 0 },
                solo: { coins: 5, gems: 0 }
            },
            achievements: {
                firstWin: { coins: 500, gems: 10 },
                firstKill: { coins: 100, gems: 2 },
                winStreak5: { coins: 1000, gems: 20 },
                winStreak10: { coins: 2500, gems: 50 }
            }
        },
        
        prices: {
            tanks: {
                light: { coins: 5000, gems: 0 },
                medium: { coins: 10000, gems: 0 },
                heavy: { coins: 20000, gems: 0 },
                destroyer: { coins: 0, gems: 100 }
            },
            skins: {
                common: { coins: 1000, gems: 0 },
                rare: { coins: 2500, gems: 0 },
                epic: { coins: 5000, gems: 0 },
                legendary: { coins: 0, gems: 50 }
            },
            boosts: {
                xp_2x_1h: { coins: 500, gems: 0 },
                xp_2x_24h: { coins: 0, gems: 10 },
                coins_2x_1h: { coins: 0, gems: 5 },
                coins_2x_24h: { coins: 0, gems: 20 }
            }
        }
    },
    
    // Configurações de rede
    network: {
        updateRate: 60, // Updates por segundo
        interpolationDelay: 100, // ms
        maxLatency: 500, // ms
        disconnectTimeout: 10000, // 10 segundos
        reconnectAttempts: 3
    },
    
    // Configurações de áudio
    audio: {
        masterVolume: 0.7,
        sfxVolume: 0.8,
        musicVolume: 0.5,
        
        sounds: {
            fire: 'fire.mp3',
            explosion: 'explosion.mp3',
            hit: 'hit.mp3',
            powerup: 'powerup.mp3',
            engine: 'engine.mp3',
            reload: 'reload.mp3',
            victory: 'victory.mp3',
            defeat: 'defeat.mp3'
        }
    },
    
    // Configurações de gráficos
    graphics: {
        quality: {
            low: {
                shadows: false,
                particles: 10,
                effects: false,
                antialiasing: false
            },
            medium: {
                shadows: true,
                particles: 50,
                effects: true,
                antialiasing: false
            },
            high: {
                shadows: true,
                particles: 100,
                effects: true,
                antialiasing: true
            }
        },
        
        defaultQuality: 'medium',
        fps: 60,
        renderDistance: 1000
    },
    
    // Configurações de controles
    controls: {
        keyboard: {
            forward: 'w',
            backward: 's',
            left: 'a',
            right: 'd',
            fire: ' ',
            boost: 'shift',
            map: 'tab',
            chat: 'enter',
            menu: 'escape'
        },
        
        mouse: {
            fire: 0, // Botão esquerdo
            aim: 2 // Botão direito
        },
        
        gamepad: {
            deadzone: 0.1,
            vibration: true
        },
        
        mobile: {
            joystickSize: 150,
            buttonSize: 80,
            opacity: 0.7
        }
    },
    
    // URLs e endpoints
    api: {
        backend: 'https://api.tankwarfare.com',
        assets: 'https://assets.tankwarfare.com',
        cdn: 'https://cdn.tankwarfare.com'
    },
    
    // Flags de desenvolvimento
    debug: {
        enabled: false,
        showFPS: false,
        showPing: true,
        showHitboxes: false,
        unlimitedAmmo: false,
        godMode: false,
        skipLogin: false
    },
    
    // Métodos auxiliares
    getRankByPoints(points) {
        for (let i = this.ranking.tiers.length - 1; i >= 0; i--) {
            if (points >= this.ranking.tiers[i].minPoints) {
                return this.ranking.tiers[i];
            }
        }
        return this.ranking.tiers[0];
    },
    
    getTankConfig(type) {
        return this.tanks.classes[type] || this.tanks.default;
    },
    
    getPowerupConfig(type) {
        return this.powerups.types[type];
    },
    
    getProjectileConfig(type) {
        return this.projectiles.types[type] || this.projectiles.default;
    },
    
    getModeConfig(mode) {
        return this.gameplay.modes[mode];
    },
    
    getReward(mode, result) {
        return this.economy.rewards[result][mode] || { coins: 0, gems: 0 };
    }
};