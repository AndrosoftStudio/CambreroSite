document.addEventListener('DOMContentLoaded', function() {
    // Função para obter cookie
    function getCookie(name) {
        const nameEQ = name + "=";
        const ca = document.cookie.split(';');
        for (let i = 0; i < ca.length; i++) {
            let c = ca[i];
            while (c.charAt(0) === ' ') {
                c = c.substring(1, c.length);
            }
            if (c.indexOf(nameEQ) === 0) {
                return c.substring(nameEQ.length, c.length);
            }
        }
        return null;
    }

    // Ajustar botão "Entrar/Conta"
    const authBtnText = document.getElementById('authBtnText');
    const loginToken = getCookie('login_token');
    const contaBtn = document.querySelector('.menu-btn[data-section="conta"]');
    if (loginToken) {
        authBtnText.textContent = 'Conta';
    } else {
        authBtnText.textContent = 'Entrar';
    }

    // Carregar seção com base no hash da URL
    const hash = window.location.hash.replace('#', '');
    if (hash && loginToken) {
        loadSection(hash);
        document.querySelector(`.menu-btn[data-section="${hash}"]`).classList.add('active');
    } else {
        loadSection('conta'); // Carrega "conta" por padrão
        contaBtn.classList.add('active');
    }

    // Evento dos botões de menu
    const menuButtons = document.querySelectorAll('.menu-btn');
    menuButtons.forEach(button => {
        button.addEventListener('click', function() {
            const section = this.getAttribute('data-section');
            if (section === 'conta' && !loginToken) {
                window.location.href = 'https://cambrero.com/account/login.html';
                return;
            }
            menuButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
            loadSection(section);
        });
    });

    // Função para carregar seções
    async function loadSection(section) {
        const contentArea = document.getElementById('contentArea');
        let url;

        switch (section) {
            case 'conta':
                url = loginToken ? 'https://cambrero.com/config/conta/conta.html' : 'https://cambrero.com/account/login.html';
                break;
            case 'privacidade':
                url = 'https://cambrero.com/config/privacidade.html'; // Placeholder
                break;
            case 'seguranca':
                url = 'https://cambrero.com/config/seguranca.html'; // Placeholder
                break;
            case 'sobre':
                url = 'https://cambrero.com/config/sobre.html'; // Placeholder
                break;
            default:
                url = 'https://cambrero.com/config/conta/conta.html';
        }

        try {
            const response = await fetch(url);
            const html = await response.text();
            contentArea.innerHTML = html;
        } catch (error) {
            contentArea.innerHTML = `<p>Erro ao carregar a seção: ${error.message}</p>`;
        }
    }
});