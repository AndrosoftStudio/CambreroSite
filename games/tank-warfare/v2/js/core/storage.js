// ========================================
// TANK WARFARE - STORAGE SYSTEM
// ========================================

window.StorageSystem = {
    storage: null,
    uploadTasks: {},
    cache: {},
    
    // Inicializar sistema de storage
    init() {
        console.log('📦 Initializing Storage System...');
        this.storage = firebase.storage();
        
        // Configurar limite de cache
        this.maxCacheSize = 50 * 1024 * 1024; // 50MB
        this.currentCacheSize = 0;
    },
    
    // ========== UPLOAD DE ARQUIVOS ==========
    
    // Upload de imagem de perfil
    async uploadProfileImage(file, uid) {
        if (!uid) {
            uid = AuthSystem.currentUser?.uid;
            if (!uid) throw new Error('User not authenticated');
        }
        
        // Validar arquivo
        this.validateImageFile(file);
        
        // Comprimir imagem se necessário
        const compressedFile = await this.compressImage(file);
        
        // Caminho no storage
        const path = `avatars/${uid}/${Date.now()}_${file.name}`;
        const storageRef = this.storage.ref(path);
        
        // Criar tarefa de upload
        const uploadTask = storageRef.put(compressedFile);
        
        // Armazenar referência da tarefa
        this.uploadTasks[path] = uploadTask;
        
        // Monitorar progresso
        return new Promise((resolve, reject) => {
            uploadTask.on('state_changed',
                (snapshot) => {
                    // Progresso
                    const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                    console.log(`Upload progress: ${progress}%`);
                    
                    // Atualizar UI de progresso se existir
                    this.updateUploadProgress(path, progress);
                },
                (error) => {
                    // Erro
                    console.error('Upload error:', error);
                    delete this.uploadTasks[path];
                    reject(error);
                },
                async () => {
                    // Completo
                    const downloadURL = await uploadTask.snapshot.ref.getDownloadURL();
                    
                    // Atualizar perfil do usuário
                    await DatabaseSystem.update(`players/${uid}`, {
                        photoURL: downloadURL
                    });
                    
                    // Limpar tarefa
                    delete this.uploadTasks[path];
                    
                    console.log('✅ Profile image uploaded:', downloadURL);
                    resolve(downloadURL);
                }
            );
        });
    },
    
    // Upload de screenshot de partida
    async uploadMatchScreenshot(blob, matchId) {
        const uid = AuthSystem.currentUser?.uid;
        if (!uid) throw new Error('User not authenticated');
        
        const path = `screenshots/${matchId}/${uid}_${Date.now()}.png`;
        const storageRef = this.storage.ref(path);
        
        try {
            const snapshot = await storageRef.put(blob);
            const downloadURL = await snapshot.ref.getDownloadURL();
            
            console.log('✅ Screenshot uploaded:', downloadURL);
            return downloadURL;
            
        } catch (error) {
            console.error('Screenshot upload error:', error);
            throw error;
        }
    },
    
    // Upload de replay de partida
    async uploadMatchReplay(replayData, matchId) {
        const uid = AuthSystem.currentUser?.uid;
        if (!uid) throw new Error('User not authenticated');
        
        // Converter dados para JSON
        const jsonBlob = new Blob([JSON.stringify(replayData)], {
            type: 'application/json'
        });
        
        const path = `replays/${matchId}/${uid}_${Date.now()}.json`;
        const storageRef = this.storage.ref(path);
        
        try {
            const snapshot = await storageRef.put(jsonBlob);
            const downloadURL = await snapshot.ref.getDownloadURL();
            
            // Salvar referência no banco
            await DatabaseSystem.create(`replays/${matchId}`, {
                uid: uid,
                url: downloadURL,
                size: jsonBlob.size,
                duration: replayData.duration,
                players: replayData.players
            });
            
            console.log('✅ Replay uploaded:', downloadURL);
            return downloadURL;
            
        } catch (error) {
            console.error('Replay upload error:', error);
            throw error;
        }
    },
    
    // ========== DOWNLOAD DE ARQUIVOS ==========
    
    // Download de arquivo
    async downloadFile(path) {
        // Verificar cache
        if (this.cache[path]) {
            console.log('📋 File from cache:', path);
            return this.cache[path];
        }
        
        try {
            const storageRef = this.storage.ref(path);
            const url = await storageRef.getDownloadURL();
            
            // Baixar arquivo
            const response = await fetch(url);
            const blob = await response.blob();
            
            // Adicionar ao cache se for pequeno
            if (blob.size < 5 * 1024 * 1024) { // < 5MB
                this.addToCache(path, blob);
            }
            
            console.log('✅ File downloaded:', path);
            return blob;
            
        } catch (error) {
            console.error('Download error:', error);
            throw error;
        }
    },
    
    // Obter URL de download
    async getDownloadURL(path) {
        try {
            const storageRef = this.storage.ref(path);
            const url = await storageRef.getDownloadURL();
            return url;
        } catch (error) {
            console.error('Error getting download URL:', error);
            
            // Retornar placeholder se não encontrar
            if (error.code === 'storage/object-not-found') {
                return '/assets/placeholder.png';
            }
            
            throw error;
        }
    },
    
    // Download de replay
    async downloadReplay(replayUrl) {
        try {
            const response = await fetch(replayUrl);
            const replayData = await response.json();
            
            console.log('✅ Replay downloaded');
            return replayData;
            
        } catch (error) {
            console.error('Replay download error:', error);
            throw error;
        }
    },
    
    // ========== GERENCIAMENTO DE ARQUIVOS ==========
    
    // Deletar arquivo
    async deleteFile(path) {
        try {
            const storageRef = this.storage.ref(path);
            await storageRef.delete();
            
            // Remover do cache
            delete this.cache[path];
            
            console.log('✅ File deleted:', path);
            return true;
            
        } catch (error) {
            console.error('Delete error:', error);
            
            if (error.code === 'storage/object-not-found') {
                console.warn('File not found:', path);
                return false;
            }
            
            throw error;
        }
    },
    
    // Listar arquivos
    async listFiles(path, maxResults = 100) {
        try {
            const storageRef = this.storage.ref(path);
            const result = await storageRef.list({ maxResults });
            
            const files = [];
            
            for (const item of result.items) {
                const metadata = await item.getMetadata();
                files.push({
                    name: item.name,
                    path: item.fullPath,
                    size: metadata.size,
                    created: metadata.timeCreated,
                    updated: metadata.updated,
                    contentType: metadata.contentType
                });
            }
            
            console.log(`✅ Listed ${files.length} files in ${path}`);
            return files;
            
        } catch (error) {
            console.error('List files error:', error);
            throw error;
        }
    },
    
    // Obter metadados
    async getMetadata(path) {
        try {
            const storageRef = this.storage.ref(path);
            const metadata = await storageRef.getMetadata();
            return metadata;
        } catch (error) {
            console.error('Get metadata error:', error);
            throw error;
        }
    },
    
    // ========== UTILIDADES ==========
    
    // Validar arquivo de imagem
    validateImageFile(file) {
        const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        const maxSize = 5 * 1024 * 1024; // 5MB
        
        if (!validTypes.includes(file.type)) {
            throw new Error('Tipo de arquivo inválido. Use JPEG, PNG, GIF ou WebP.');
        }
        
        if (file.size > maxSize) {
            throw new Error('Arquivo muito grande. Máximo 5MB.');
        }
        
        return true;
    },
    
    // Comprimir imagem
    async compressImage(file, maxWidth = 512, quality = 0.8) {
        return new Promise((resolve) => {
            // Se já for pequeno, não comprimir
            if (file.size < 100 * 1024) { // < 100KB
                resolve(file);
                return;
            }
            
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');
                    
                    // Calcular dimensões
                    let width = img.width;
                    let height = img.height;
                    
                    if (width > maxWidth) {
                        height = (maxWidth / width) * height;
                        width = maxWidth;
                    }
                    
                    canvas.width = width;
                    canvas.height = height;
                    
                    // Desenhar imagem redimensionada
                    ctx.drawImage(img, 0, 0, width, height);
                    
                    // Converter para blob
                    canvas.toBlob((blob) => {
                        resolve(new File([blob], file.name, {
                            type: 'image/jpeg',
                            lastModified: Date.now()
                        }));
                    }, 'image/jpeg', quality);
                };
                img.src = e.target.result;
            };
            reader.readAsDataURL(file);
        });
    },
    
    // Adicionar ao cache
    addToCache(path, data) {
        const size = data.size || new Blob([data]).size;
        
        // Verificar limite de cache
        if (this.currentCacheSize + size > this.maxCacheSize) {
            this.clearOldestCache();
        }
        
        this.cache[path] = {
            data: data,
            size: size,
            timestamp: Date.now()
        };
        
        this.currentCacheSize += size;
        console.log(`📋 Cached: ${path} (${(size / 1024).toFixed(2)}KB)`);
    },
    
    // Limpar cache mais antigo
    clearOldestCache() {
        const entries = Object.entries(this.cache)
            .sort((a, b) => a[1].timestamp - b[1].timestamp);
        
        // Remover 25% mais antigo
        const toRemove = Math.ceil(entries.length * 0.25);
        
        for (let i = 0; i < toRemove; i++) {
            const [path, data] = entries[i];
            this.currentCacheSize -= data.size;
            delete this.cache[path];
        }
        
        console.log(`🧹 Cleared ${toRemove} cached items`);
    },
    
    // Limpar todo o cache
    clearCache() {
        this.cache = {};
        this.currentCacheSize = 0;
        console.log('🧹 Cache cleared');
    },
    
    // Atualizar progresso de upload
    updateUploadProgress(path, progress) {
        // Emitir evento customizado
        const event = new CustomEvent('uploadProgress', {
            detail: { path, progress }
        });
        window.dispatchEvent(event);
        
        // Atualizar UI se existir
        const progressBar = document.querySelector(`[data-upload-path="${path}"]`);
        if (progressBar) {
            progressBar.style.width = `${progress}%`;
            progressBar.textContent = `${Math.round(progress)}%`;
        }
    },
    
    // Cancelar upload
    cancelUpload(path) {
        if (this.uploadTasks[path]) {
            this.uploadTasks[path].cancel();
            delete this.uploadTasks[path];
            console.log('❌ Upload cancelled:', path);
        }
    },
    
    // Cancelar todos os uploads
    cancelAllUploads() {
        Object.keys(this.uploadTasks).forEach(path => {
            this.cancelUpload(path);
        });
    },
    
    // Obter tamanho total de storage usado
    async getStorageUsage(uid) {
        if (!uid) {
            uid = AuthSystem.currentUser?.uid;
            if (!uid) throw new Error('User not authenticated');
        }
        
        let totalSize = 0;
        
        // Verificar avatares
        const avatars = await this.listFiles(`avatars/${uid}`);
        avatars.forEach(file => totalSize += file.size);
        
        // Verificar screenshots
        const screenshots = await this.listFiles(`screenshots`);
        const userScreenshots = screenshots.filter(f => f.path.includes(uid));
        userScreenshots.forEach(file => totalSize += file.size);
        
        // Verificar replays
        const replays = await this.listFiles(`replays`);
        const userReplays = replays.filter(f => f.path.includes(uid));
        userReplays.forEach(file => totalSize += file.size);
        
        console.log(`📊 Total storage usage: ${(totalSize / 1024 / 1024).toFixed(2)}MB`);
        
        return {
            total: totalSize,
            avatars: avatars.reduce((sum, f) => sum + f.size, 0),
            screenshots: userScreenshots.reduce((sum, f) => sum + f.size, 0),
            replays: userReplays.reduce((sum, f) => sum + f.size, 0)
        };
    },
    
    // Limpar arquivos antigos
    async cleanupOldFiles(daysOld = 30) {
        const cutoffDate = Date.now() - (daysOld * 24 * 60 * 60 * 1000);
        let deletedCount = 0;
        
        // Limpar screenshots antigas
        const screenshots = await this.listFiles('screenshots');
        for (const file of screenshots) {
            if (new Date(file.created).getTime() < cutoffDate) {
                await this.deleteFile(file.path);
                deletedCount++;
            }
        }
        
        // Limpar replays antigos
        const replays = await this.listFiles('replays');
        for (const file of replays) {
            if (new Date(file.created).getTime() < cutoffDate) {
                await this.deleteFile(file.path);
                deletedCount++;
            }
        }
        
        console.log(`🧹 Cleaned up ${deletedCount} old files`);
        return deletedCount;
    }
};