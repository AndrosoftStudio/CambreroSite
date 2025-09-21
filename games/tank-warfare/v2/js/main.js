// Main Application Entry Point
document.addEventListener('DOMContentLoaded', async () => {
    // Inicializar configurações
    FirebaseConfig.init();
    MercadoPagoConfig.init();
    
    // Inicializar sistemas
    await AuthSystem.init();
    await i18n.init();
    Analytics.collectInitialData();
    
    // Configurar UI
    UIManager.init();
    NotificationSystem.init();
    
    // Desenhar logo animado no login
    drawAnimatedLogo();
    
    console.log('Tank Warfare initialized successfully!');
});

function drawAnimatedLogo() {
    const canvas = document.getElementById('logoCanvas');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    let rotation = 0;
    
    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        ctx.save();
        ctx.translate(60, 60);
        ctx.rotate(rotation);
        
        // Desenhar tanque estilizado
        ctx.fillStyle = 'white';
        ctx.fillRect(-25, -15, 50, 30);
        ctx.fillRect(-30, -20, 60, 5);
        ctx.fillRect(-30, 15, 60, 5);
        
        ctx.beginPath();
        ctx.arc(0, 0, 15, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillRect(0, -3, 35, 6);
        
        ctx.restore();
        
        rotation += 0.01;
        requestAnimationFrame(animate);
    }
    
    animate();
}