document.addEventListener('DOMContentLoaded', function() {
    
    const themeToggle = document.getElementById('theme-toggle');
    const authBtnText = document.getElementById('authBtnText');
    const menuButtons = document.querySelectorAll('.menu-btn');
    const contentArea = document.getElementById('contentArea');

    // --- LÓGICA DE TEMA UNIFICADA (USANDO COOKIES) ---
    // Funções alinhadas com o seu 'diario.html' para consistência total.
    function setCookie(name, value, days) {
        let expires = "";
        if (days) {
            const date = new Date();
            date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
            expires = "; expires=" + date.toUTCString();
        }
        // Assegura que o cookie é válido para todo o site, definindo o caminho para a raiz.
        document.cookie = name + "=" + (value || "") + expires + "; path=/";
    }

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

    function applyTheme(theme) {
        if (theme === 'dark') {
            document.body.classList.add('dark-mode');
            if (themeToggle) themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
        } else {
            document.body.classList.remove('dark-mode');
            if (themeToggle) themeToggle.innerHTML = '<i class="fas fa-moon"></i>';
        }
    }
    
    if (themeToggle) {
        themeToggle.addEventListener('click', () => {
            const isDark = document.body.classList.toggle('dark-mode');
            const newTheme = isDark ? 'dark' : 'light';
            // Salva a preferência no cookie
            setCookie('theme', newTheme, 365); 
            applyTheme(newTheme);
        });
    }
    
    // Ao carregar, lê a preferência do cookie
    const savedTheme = getCookie('theme');
    if (savedTheme) {
        applyTheme(savedTheme);
    }


    // --- LÓGICA DE AUTENTICAÇÃO E UI ---
    const loginToken = getCookie('login_token');
    if (authBtnText) {
        authBtnText.textContent = loginToken ? 'Conta' : 'Entrar';
    }

    // --- CARREGAMENTO DINÂMICO DE SEÇÕES ---
    async function loadSection(sectionName) {
        // O caminho agora está correto, buscando de dentro da pasta /config/
        const url = `/config/${sectionName}/${sectionName}.html`; 

        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error(`Network response was not ok for ${url}`);
            
            contentArea.innerHTML = await response.text();

            const scripts = contentArea.getElementsByTagName('script');
            for (let i = 0; i < scripts.length; i++) {
                try {
                    new Function(scripts[i].innerText)();
                } catch (e) {
                    console.error("Erro ao executar script da seção carregada:", e);
                }
            }
        } catch (error) {
            console.error('Erro ao carregar a seção:', error);
            contentArea.innerHTML = `<h2>Erro ao carregar</h2><p>Não foi possível encontrar o conteúdo para esta seção. Verifique se o ficheiro <strong>${sectionName}.html</strong> existe dentro da pasta <strong>/config/${sectionName}/</strong>.</p>`;
        }
    }

    menuButtons.forEach(button => {
        button.addEventListener('click', function() {
            const section = this.dataset.section;
            menuButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
            loadSection(section);
        });
    });

    // --- INICIALIZAÇÃO ---
    if (menuButtons.length > 0) {
        const initialSection = menuButtons[0].dataset.section;
        loadSection(initialSection);
        menuButtons[0].classList.add('active');
    }
});
