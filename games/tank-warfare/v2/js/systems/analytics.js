// ========================================
// TANK WARFARE - ANALYTICS SYSTEM
// ========================================

window.Analytics = {
    sessionId: null,
    userId: null,
    events: [],
    sessionStartTime: null,
    pageViewStartTime: null,
    currentPage: null,
    
    // Inicializar sistema de analytics
    init() {
        console.log('📊 Initializing Analytics System...');
        
        // Gerar ID de sessão
        this.sessionId = this.generateSessionId();
        this.sessionStartTime = Date.now();
        
        // Configurar listeners
        this.setupEventListeners();
        
        // Coletar dados iniciais
        this.collectInitialData();
        
        // Iniciar heartbeat
        this.startHeartbeat();
    },
    
    // ========== COLETA DE DADOS ==========
    
    // Coletar dados iniciais
    collectInitialData() {
        const data = {
            sessionId: this.sessionId,
            timestamp: Date.now(),
            
            // Informações do dispositivo
            device: {
                type: this.getDeviceType(),
                platform: navigator.platform,
                userAgent: navigator.userAgent,
                screen: {
                    width: screen.width,
                    height: screen.height,
                    pixelRatio: window.devicePixelRatio || 1,
                    orientation: screen.orientation?.type || 'unknown'
                },
                viewport: {
                    width: window.innerWidth,
                    height: window.innerHeight
                },
                touchSupport: 'ontouchstart' in window,
                language: navigator.language,
                languages: navigator.languages,
                onLine: navigator.onLine,
                cookieEnabled: navigator.cookieEnabled,
                doNotTrack: navigator.doNotTrack === '1'
            },
            
            // Informações do navegador
            browser: {
                name: this.getBrowserName(),
                version: this.getBrowserVersion(),
                vendor: navigator.vendor,
                webkit: 'webkitAppearance' in document.documentElement.style,
                gecko: 'MozAppearance' in document.documentElement.style
            },
            
            // Sistema operacional
            os: {
                name: this.getOSName(),
                version: this.getOSVersion()
            },
            
            // Localização (aproximada)
            location: {
                timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
                timezoneOffset: new Date().getTimezoneOffset(),
                locale: navigator.language
            },
            
            // Performance
            performance: this.getPerformanceData(),
            
            // Referência
            referrer: document.referrer,
            url: window.location.href,
            path: window.location.pathname,
            search: window.location.search,
            hash: window.location.hash
        };
        
        // Obter localização por IP (se permitido)
        this.getLocationData(data);
        
        // Salvar no Firebase
        this.saveAnalyticsData('session_start', data);
        
        console.log('📊 Initial data collected:', data);
        return data;
    },
    
    // Obter dados de localização
    async getLocationData(data) {
        // Verificar se o usuário permite
        if (navigator.doNotTrack === '1') return;
        
        try {
            const response = await fetch('https://ipapi.co/json/');
            if (response.ok) {
                const locationData = await response.json();
                
                data.location = {
                    ...data.location,
                    country: locationData.country_name,
                    countryCode: locationData.country_code,
                    region: locationData.region,
                    city: locationData.city,
                    postal: locationData.postal,
                    latitude: locationData.latitude,
                    longitude: locationData.longitude,
                    ip: locationData.ip,
                    org: locationData.org
                };
                
                // Salvar atualização
                this.saveAnalyticsData('location_detected', data.location);
            }
        } catch (error) {
            console.warn('Could not get location data:', error);
        }
    },
    
    // ========== TRACKING DE EVENTOS ==========
    
    // Registrar evento
    logEvent(eventName, parameters = {}) {
        const event = {
            name: eventName,
            parameters: parameters,
            timestamp: Date.now(),
            sessionId: this.sessionId,
            userId: this.userId || AuthSystem.currentUser?.uid,
            page: this.currentPage,
            url: window.location.href
        };
        
        // Adicionar à fila
        this.events.push(event);
        
        // Enviar imediatamente se crítico
        const criticalEvents = ['purchase', 'signup', 'login', 'error'];
        if (criticalEvents.includes(eventName)) {
            this.sendEvents([event]);
        }
        
        console.log(`📊 Event logged: ${eventName}`, parameters);
    },
    
    // Enviar eventos em lote
    async sendEvents(eventsToSend = null) {
        const events = eventsToSend || this.events.splice(0, this.events.length);
        
        if (events.length === 0) return;
        
        try {
            // Salvar no Firebase
            for (const event of events) {
                await this.saveAnalyticsData('event', event);
            }
            
            console.log(`📊 Sent ${events.length} events`);
        } catch (error) {
            console.error('Error sending events:', error);
            // Recolocar eventos na fila se falhar
            this.events.unshift(...events);
        }
    },
    
    // ========== TRACKING DE PÁGINAS ==========
    
    // Registrar visualização de página
    trackPageView(pageName) {
        // Finalizar página anterior
        if (this.currentPage) {
            const duration = Date.now() - this.pageViewStartTime;
            this.logEvent('page_view_end', {
                page: this.currentPage,
                duration: duration
            });
        }
        
        // Iniciar nova página
        this.currentPage = pageName;
        this.pageViewStartTime = Date.now();
        
        this.logEvent('page_view', {
            page: pageName,
            title: document.title,
            url: window.location.href,
            referrer: document.referrer
        });
    },
    
    // ========== TRACKING DE PERFORMANCE ==========
    
    // Obter dados de performance
    getPerformanceData() {
        const perfData = {};
        
        if (window.performance && performance.timing) {
            const timing = performance.timing;
            
            perfData.pageLoad = timing.loadEventEnd - timing.navigationStart;
            perfData.domReady = timing.domContentLoadedEventEnd - timing.navigationStart;
            perfData.dnsLookup = timing.domainLookupEnd - timing.domainLookupStart;
            perfData.tcpConnect = timing.connectEnd - timing.connectStart;
            perfData.request = timing.responseStart - timing.requestStart;
            perfData.response = timing.responseEnd - timing.responseStart;
            perfData.domProcessing = timing.domComplete - timing.domLoading;
            
            // Memória
            if (performance.memory) {
                perfData.memory = {
                    used: performance.memory.usedJSHeapSize,
                    total: performance.memory.totalJSHeapSize,
                    limit: performance.memory.jsHeapSizeLimit
                };
            }
        }
        
        // FPS (se disponível)
        perfData.fps = this.currentFPS || 0;
        
        return perfData;
    },
    
    // Monitorar FPS
    startFPSMonitoring() {
        let lastTime = performance.now();
        let frames = 0;
        
        const measureFPS = () => {
            frames++;
            const currentTime = performance.now();
            
            if (currentTime >= lastTime + 1000) {
                this.currentFPS = Math.round(frames * 1000 / (currentTime - lastTime));
                frames = 0;
                lastTime = currentTime;
                
                // Log FPS baixo
                if (this.currentFPS < 30) {
                    this.logEvent('low_fps', { fps: this.currentFPS });
                }
            }
            
            requestAnimationFrame(measureFPS);
        };
        
        requestAnimationFrame(measureFPS);
    },
    
    // ========== TRACKING DE USUÁRIO ==========
    
    // Definir ID do usuário
    setUserId(userId) {
        this.userId = userId;
        this.logEvent('user_identified', { userId });
    },
    
    // Definir propriedades do usuário
    setUserProperties(properties) {
        this.logEvent('user_properties', properties);
    },
    
    // Rastrear engajamento
    trackEngagement() {
        const sessionDuration = Date.now() - this.sessionStartTime;
        
        this.logEvent('user_engagement', {
            sessionDuration: sessionDuration,
            pageViews: this.pageViewCount || 0,
            events: this.events.length
        });
    },
    
    // ========== TRACKING DE GAMEPLAY ==========
    
    // Rastrear início de partida
    trackMatchStart(matchData) {
        this.logEvent('match_start', {
            mode: matchData.mode,
            teamSize: matchData.teamSize,
            map: matchData.map,
            players: matchData.playerCount
        });
    },
    
    // Rastrear fim de partida
    trackMatchEnd(matchData) {
        this.logEvent('match_end', {
            mode: matchData.mode,
            result: matchData.result,
            duration: matchData.duration,
            kills: matchData.kills,
            deaths: matchData.deaths,
            damage: matchData.damageDealt,
            score: matchData.score,
            rank: matchData.finalRank
        });
    },
    
    // Rastrear morte
    trackDeath(killerData) {
        this.logEvent('player_death', {
            killer: killerData.name,
            weapon: killerData.weapon,
            distance: killerData.distance
        });
    },
    
    // Rastrear kill
    trackKill(victimData) {
        this.logEvent('player_kill', {
            victim: victimData.name,
            weapon: victimData.weapon,
            distance: victimData.distance,
            headshot: victimData.headshot
        });
    },
    
    // ========== TRACKING DE ECONOMIA ==========
    
    // Rastrear compra
    trackPurchase(item, price, currency) {
        this.logEvent('purchase', {
            item_id: item.id,
            item_name: item.name,
            item_category: item.category,
            price: price,
            currency: currency,
            value: currency === 'BRL' ? price : price * 0.01 // Estimar valor em reais
        });
    },
    
    // Rastrear uso de moeda
    trackCurrencySpent(amount, currency, item) {
        this.logEvent('spend_virtual_currency', {
            value: amount,
            virtual_currency_name: currency,
            item_name: item
        });
    },
    
    // Rastrear ganho de moeda
    trackCurrencyEarned(amount, currency, source) {
        this.logEvent('earn_virtual_currency', {
            value: amount,
            virtual_currency_name: currency,
            source: source
        });
    },
    
    // ========== TRACKING DE ERROS ==========
    
    // Rastrear erro
    trackError(error, context = {}) {
        this.logEvent('error', {
            message: error.message,
            stack: error.stack,
            type: error.name,
            context: context,
            url: window.location.href,
            userAgent: navigator.userAgent
        });
    },
    
    // ========== UTILIDADES ==========
    
    // Gerar ID de sessão
    generateSessionId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    },
    
    // Obter tipo de dispositivo
    getDeviceType() {
        const userAgent = navigator.userAgent;
        
        if (/tablet|ipad|playbook|silk/i.test(userAgent)) {
            return 'tablet';
        }
        
        if (/mobile|iphone|ipod|android|blackberry|opera|mini|windows\sce|palm|smartphone|iemobile/i.test(userAgent)) {
            return 'mobile';
        }
        
        if (/smart-tv|googlebot|google-tv|playstation|xbox|nintendo/i.test(userAgent)) {
            return 'tv/console';
        }
        
        return 'desktop';
    },
    
    // Obter nome do navegador
    getBrowserName() {
        const userAgent = navigator.userAgent;
        
        if (userAgent.includes('Firefox')) return 'Firefox';
        if (userAgent.includes('Opera') || userAgent.includes('OPR')) return 'Opera';
        if (userAgent.includes('Trident')) return 'Internet Explorer';
        if (userAgent.includes('Edge')) return 'Edge';
        if (userAgent.includes('Chrome')) return 'Chrome';
        if (userAgent.includes('Safari')) return 'Safari';
        
        return 'Unknown';
    },
    
    // Obter versão do navegador
    getBrowserVersion() {
        const userAgent = navigator.userAgent;
        let match;
        
        if ((match = userAgent.match(/firefox\/(\d+)/i))) return match[1];
        if ((match = userAgent.match(/opr\/(\d+)/i))) return match[1];
        if ((match = userAgent.match(/edge\/(\d+)/i))) return match[1];
        if ((match = userAgent.match(/chrome\/(\d+)/i))) return match[1];
        if ((match = userAgent.match(/version\/(\d+)/i))) return match[1];
        
        return 'Unknown';
    },
    
    // Obter nome do SO
    getOSName() {
        const userAgent = navigator.userAgent;
        const platform = navigator.platform;
        
        if (platform.includes('Win')) return 'Windows';
        if (platform.includes('Mac')) return 'macOS';
        if (platform.includes('Linux')) return 'Linux';
        if (/android/i.test(userAgent)) return 'Android';
        if (/iphone|ipad|ipod/i.test(userAgent)) return 'iOS';
        
        return 'Unknown';
    },
    
    // Obter versão do SO
    getOSVersion() {
        const userAgent = navigator.userAgent;
        let match;
        
        if ((match = userAgent.match(/windows nt (\d+\.\d+)/i))) return match[1];
        if ((match = userAgent.match(/mac os x (\d+[._]\d+)/i))) return match[1].replace('_', '.');
        if ((match = userAgent.match(/android (\d+\.\d+)/i))) return match[1];
        if ((match = userAgent.match(/os (\d+[._]\d+)/i))) return match[1].replace('_', '.');
        
        return 'Unknown';
    },
    
    // ========== CONFIGURAÇÃO ==========
    
    // Configurar listeners de eventos
    setupEventListeners() {
        // Erro global
        window.addEventListener('error', (event) => {
            this.trackError(event.error || {
                message: event.message,
                filename: event.filename,
                lineno: event.lineno,
                colno: event.colno
            });
        });
        
        // Promise rejeitada
        window.addEventListener('unhandledrejection', (event) => {
            this.trackError({
                message: 'Unhandled Promise Rejection',
                reason: event.reason
            });
        });
        
        // Mudança de visibilidade
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.logEvent('app_background');
                this.sendEvents(); // Enviar eventos pendentes
            } else {
                this.logEvent('app_foreground');
            }
        });
        
        // Antes de sair
        window.addEventListener('beforeunload', () => {
            this.logEvent('session_end', {
                duration: Date.now() - this.sessionStartTime
            });
            this.sendEvents(); // Enviar todos os eventos pendentes
        });
        
        // Mudança de conexão
        window.addEventListener('online', () => {
            this.logEvent('connection_online');
            this.sendEvents(); // Tentar enviar eventos acumulados
        });
        
        window.addEventListener('offline', () => {
            this.logEvent('connection_offline');
        });
        
        // Mudança de orientação
        window.addEventListener('orientationchange', () => {
            this.logEvent('orientation_change', {
                orientation: screen.orientation?.type || window.orientation
            });
        });
        
        // Cliques
        document.addEventListener('click', (event) => {
            const target = event.target;
            
            // Rastrear cliques em elementos importantes
            if (target.classList.contains('buy-button')) {
                this.logEvent('button_click', {
                    button: 'buy',
                    item: target.dataset.item
                });
            } else if (target.classList.contains('play-button')) {
                this.logEvent('button_click', {
                    button: 'play',
                    mode: target.dataset.mode
                });
            }
        });
    },
    
    // Iniciar heartbeat
    startHeartbeat() {
        // Enviar eventos a cada 30 segundos
        setInterval(() => {
            this.sendEvents();
            this.trackEngagement();
        }, 30000);
        
        // Atualizar performance a cada minuto
        setInterval(() => {
            this.logEvent('performance_update', this.getPerformanceData());
        }, 60000);
    },
    
    // ========== FIREBASE ==========
    
    // Salvar dados no Firebase
    async saveAnalyticsData(type, data) {
        if (!AuthSystem.currentUser) return;
        
        try {
            const path = `analytics/${AuthSystem.currentUser.uid}/${type}`;
            await DatabaseSystem.create(path, {
                ...data,
                serverTimestamp: firebase.database.ServerValue.TIMESTAMP
            });
        } catch (error) {
            console.error('Error saving analytics:', error);
        }
    },
    
    // ========== RELATÓRIOS ==========
    
    // Obter estatísticas da sessão
    getSessionStats() {
        return {
            sessionId: this.sessionId,
            duration: Date.now() - this.sessionStartTime,
            events: this.events.length,
            currentPage: this.currentPage,
            fps: this.currentFPS
        };
    },
    
    // Obter relatório de performance
    getPerformanceReport() {
        return {
            current: this.getPerformanceData(),
            session: this.getSessionStats()
        };
    }
};