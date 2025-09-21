document.addEventListener('DOMContentLoaded', function() {

    // --- Funções de Cookie e Tema (Sincronizadas com seu site principal) ---

    // Função para obter um cookie específico
    function getCookie(name) {
        const nameEQ = name + "=";
        const ca = document.cookie.split(';');
        for (let i = 0; i < ca.length; i++) {
            let c = ca[i];
            while (c.charAt(0) === ' ') c = c.substring(1, c.length);
            if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
        }
        return null;
    }
    
    // Função para definir um cookie
    function setCookie(name, value, days) {
        let expires = "";
        if (days) {
            const date = new Date();
            date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
            expires = "; expires=" + date.toUTCString();
        }
        // Explicação: Garante que o cookie do tema seja definido com os mesmos parâmetros do site principal.
        document.cookie = name + "=" + (value || "") + expires + "; path=/; domain=.cambrero.com; SameSite=Lax";
    }

    // --- Lógica da Página ---

    const themeToggle = document.getElementById('themeToggle');
    const body = document.body;

    // Explicação: Verifica o cookie 'theme' ao carregar a página para manter consistência.
    function loadTheme() {
        const savedTheme = getCookie('theme');
        if (savedTheme === 'dark') {
            body.classList.add('dark-mode');
            themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
        } else {
            body.classList.remove('dark-mode');
            themeToggle.innerHTML = '<i class="fas fa-moon"></i>';
        }
    }
    
    themeToggle.addEventListener('click', function() {
        body.classList.toggle('dark-mode');
        const newTheme = body.classList.contains('dark-mode') ? 'dark' : 'light';
        setCookie('theme', newTheme, 365); // Salva a preferência por 1 ano
        themeToggle.innerHTML = newTheme === 'dark' ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
    });
    
    // Alternar entre seções de Login e Cadastro
    window.showSection = (sectionId) => {
        document.querySelectorAll('.form-section').forEach(section => {
            section.classList.remove('active');
        });
        document.getElementById(sectionId).classList.add('active');
    };

    // Função para mostrar notificações
    const notification = document.getElementById('notification');
    function showNotification(message, type) {
        notification.textContent = message;
        notification.className = `notification ${type} show`;
        setTimeout(() => {
            notification.classList.remove('show');
        }, 3000); // A notificação some após 3 segundos
    }
    
    // Enviar dados para o handler.php
    async function sendToServer(action, data) {
        const response = await fetch('handler.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({ action, ...data })
        });
        return await response.json();
    }

    // Verificar se já está logado
    function checkLoginStatus() {
        if (getCookie('login_token')) {
            window.location.href = "https://cambrero.com";
        }
    }

    // Formulário de Login
    document.getElementById('login-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;

        const result = await sendToServer('login', { email, password });
        showNotification(result.message, result.success ? 'success' : 'error');

        if (result.success) {
            setTimeout(() => {
                window.location.href = "https://cambrero.com";
            }, 1500); // Redireciona após 1.5 segundos
        }
    });

    // Formulário de Cadastro
    document.getElementById('register-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const data = {
            name: document.getElementById('reg-name').value,
            surname: document.getElementById('reg-surname').value,
            email: document.getElementById('reg-email').value,
            password: document.getElementById('reg-password').value
        };

        const result = await sendToServer('register', data);
        showNotification(result.message, result.success ? 'success' : 'error');

        if (result.success) {
            // Limpa o formulário e volta para a tela de login
            e.target.reset();
            setTimeout(() => {
                 showSection('login-section');
            }, 1500);
        }
    });

    // Executar ao carregar a página
    loadTheme();
    checkLoginStatus();
});