document.addEventListener('DOMContentLoaded', function() {
    
    // --- Google OAuth Configuration ---
    const GOOGLE_CLIENT_ID = '495059312856-1biaguru6b1u7ojtm5c0ut6gcd5ebimt.apps.googleusercontent.com';
    
    // --- Cookie Functions with Cross-Domain Support ---
    function setCookie(name, value, days, domain = null) {
        let expires = "";
        if (days) {
            const date = new Date();
            date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
            expires = "; expires=" + date.toUTCString();
        }
        
        // Set domain for cross-subdomain sharing
        const domainStr = domain ? `; domain=${domain}` : '; domain=.cambrero.com';
        document.cookie = `${name}=${value || ""}${expires}; path=/${domainStr}; SameSite=Lax; Secure`;
    }

    function getCookie(name) {
        const nameEQ = name + "=";
        const ca = document.cookie.split(';');
        for (let i = 0; i < ca.length; i++) {
            let c = ca[i].trim();
            if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
        }
        return null;
    }

    function deleteCookie(name) {
        // Delete for all possible domains
        setCookie(name, '', -1, null);
        setCookie(name, '', -1, '.cambrero.com');
        setCookie(name, '', -1, 'cambrero.com');
    }

    // --- Theme Logic ---
    const themeToggle = document.getElementById('themeToggle');
    const body = document.body;

    function applyTheme(theme) {
        if (theme === 'dark') {
            body.classList.add('dark-mode');
            if(themeToggle) themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
        } else {
            body.classList.remove('dark-mode');
            if(themeToggle) themeToggle.innerHTML = '<i class="fas fa-moon"></i>';
        }
    }

    if(themeToggle) {
        themeToggle.addEventListener('click', () => {
            const newTheme = body.classList.contains('dark-mode') ? 'light' : 'dark';
            setCookie('theme', newTheme, 365);
            applyTheme(newTheme);
        });
    }

    // --- Side Menu Logic ---
    const menuToggle = document.getElementById('menuToggle');
    const sideMenu = document.getElementById('sideMenu');
    const menuOverlay = document.getElementById('menuOverlay');

    if (menuToggle && sideMenu && menuOverlay) {
        menuToggle.addEventListener('click', () => {
            sideMenu.classList.add('active');
            menuOverlay.classList.add('active');
        });

        menuOverlay.addEventListener('click', () => {
            sideMenu.classList.remove('active');
            menuOverlay.classList.remove('active');
        });

        // Close menu when clicking on menu items
        const menuItems = document.querySelectorAll('.menu-item');
        menuItems.forEach(item => {
            item.addEventListener('click', () => {
                sideMenu.classList.remove('active');
                menuOverlay.classList.remove('active');
            });
        });
    }

    // --- Google Sign-In Logic ---
    let googleAuth = null;
    const loginBtn = document.getElementById('googleLoginBtn');
    const profileMenu = document.getElementById('profileMenu');

    function initGoogleAuth() {
        if (typeof google !== 'undefined' && google.accounts) {
            google.accounts.id.initialize({
                client_id: GOOGLE_CLIENT_ID,
                callback: handleGoogleSignIn,
                auto_select: false,
                cancel_on_tap_outside: true,
                use_fedcm_for_prompt: false
            });

            googleAuth = google.accounts.id;
            
            // Check if user is already logged in
            checkLoginStatus();
            
            // Add click handler for login button
            if(loginBtn) {
                loginBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    google.accounts.id.prompt();
                });
            }
        } else {
            // Retry after a short delay if Google API isn't loaded yet
            setTimeout(initGoogleAuth, 500);
        }
    }

    function handleGoogleSignIn(response) {
        try {
            // Decode the JWT token to get user info
            const userInfo = parseJwt(response.credential);
            
            // Store user data
            const userData = {
                id: userInfo.sub,
                name: userInfo.name,
                email: userInfo.email,
                picture: userInfo.picture,
                token: response.credential,
                timestamp: new Date().getTime()
            };

            // Save to cookie with cross-domain support
            setCookie('google_user', JSON.stringify(userData), 7);
            setCookie('google_token', response.credential, 7);

            // Update UI
            updateUIForLoggedInUser(userData);
            
            console.log('Login successful:', userData);
        } catch (error) {
            console.error('Error processing Google sign-in:', error);
        }
    }

    function parseJwt(token) {
        try {
            const base64Url = token.split('.')[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
                return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
            }).join(''));
            return JSON.parse(jsonPayload);
        } catch (error) {
            console.error('Error parsing JWT:', error);
            return null;
        }
    }

    function checkLoginStatus() {
        const userData = getCookie('google_user');
        console.log('Checking login status, userData:', userData);
        
        if (userData) {
            try {
                const user = JSON.parse(userData);
                console.log('User found in cookies:', user);
                
                // Check if token is still valid (not older than 7 days)
                const now = new Date().getTime();
                const loginTime = user.timestamp || 0;
                const sevenDays = 7 * 24 * 60 * 60 * 1000;
                
                if (now - loginTime < sevenDays) {
                    updateUIForLoggedInUser(user);
                } else {
                    console.log('Token expired, clearing cookies');
                    showLoginButton();
                    deleteCookie('google_user');
                    deleteCookie('google_token');
                }
            } catch (error) {
                console.error('Error parsing user data:', error);
                showLoginButton();
                deleteCookie('google_user');
                deleteCookie('google_token');
            }
        } else {
            console.log('No user data found in cookies');
            showLoginButton();
        }
    }

    function showLoginButton() {
        if(loginBtn) {
            loginBtn.style.display = 'flex';
            loginBtn.innerHTML = '<i class="fab fa-google"></i> Entrar com Google';
        }
        if(profileMenu) profileMenu.style.display = 'none';
    }

    function updateUIForLoggedInUser(userData) {
        console.log('Updating UI for logged in user:', userData);
        
        if(loginBtn) loginBtn.style.display = 'none';
        if(profileMenu) profileMenu.style.display = 'flex';
        
        const profileNameEl = document.getElementById('profileName');
        const profileEmailEl = document.getElementById('profileEmail');
        const profilePicEl = document.getElementById('profilePic');

        if(profileNameEl) profileNameEl.textContent = userData.name;
        if(profileEmailEl) profileEmailEl.textContent = userData.email;
        if(profilePicEl) {
            profilePicEl.src = userData.picture || `https://placehold.co/40x40/3498db/ffffff?text=${userData.name.charAt(0).toUpperCase()}`;
        }
    }

    // --- Profile Menu Events ---
    const profileBtn = document.getElementById('profileBtn');
    const profileDropdown = document.getElementById('profileDropdown');
    const logoutBtn = document.getElementById('logoutBtn');

    if(profileBtn && profileDropdown) {
        profileBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            profileDropdown.classList.toggle('active');
        });
    }

    document.addEventListener('click', () => {
        if (profileDropdown && profileDropdown.classList.contains('active')) {
            profileDropdown.classList.remove('active');
        }
    });

    if(logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            
            // Sign out from Google
            if (googleAuth) {
                google.accounts.id.disableAutoSelect();
            }
            
            // Clear cookies
            deleteCookie('google_user');
            deleteCookie('google_token');
            
            // Update UI
            showLoginButton();
            
            console.log('User logged out');
        });
    }

    // --- Content Data ---
    const contentData = {
        desenvolvimento: [
            { title: 'Rico aos 30', icon: 'fas fa-gem', desc: 'Estratégias para o sucesso financeiro', link: 'desenvolvimentopessoal/ricoantesdostrinta.html' }
        ],
        pregacoes: [
            { title: 'Passos para Alcançar Objetivos', icon: 'fas fa-bible', desc: 'Pregação motivacional', link: 'pregacoes/pregacao.html' },
            { title: 'Prosperidade Divina', icon: 'fas fa-bible', desc: 'Sobre prosperidade espiritual', link: 'pregacoes/pregacao1.html' }
        ],
        oracoes: [
            { title: 'Orações Especiais', icon: 'fas fa-pray', desc: 'Coleção de orações', link: 'oracoes/oracoes.html' }
        ],
        diario: [
            { title: 'Diário Pessoal', icon: 'fas fa-book-open', desc: 'Seu diário espiritual', link: 'diario.html' }
        ],
        ferramentas: [
            { title: 'Ferramentas Úteis', icon: 'fas fa-tools', desc: 'Ferramentas de desenvolvimento', link: 'ferramentas/ferramentas.html' }
        ],
        quiz: [
            { title: 'Quiz Espiritual', icon: 'fas fa-question-circle', desc: 'Teste seus conhecimentos', link: 'quizz/index.html' }
        ],
        jogos: [
            { title: 'Portal de Jogos', icon: 'fas fa-gamepad', desc: 'Acesse todos os jogos', link: 'https://games.cambrero.com', featured: true },
            { title: 'Damas', icon: 'fas fa-chess-board', desc: 'Jogue damas multijogador online', link: 'https://games.cambrero.com/damas/Multjogador/index.html' },
            { title: 'Dominó', icon: 'fas fa-dice', desc: 'Jogo clássico de dominó', link: 'https://games.cambrero.com/domino/index.html' },
            { title: 'Snake', icon: 'fas fa-snake', desc: 'Jogo da cobrinha clássico', link: 'https://games.cambrero.com/jogodacobrinha/jogodacobrinha.html' },
            { title: 'Jogo da Velha', icon: 'fas fa-hashtag', desc: 'Tic-tac-toe clássico', link: 'https://games.cambrero.com/jogodavelha/jogodavelha.html' },
            { title: 'Jogo do Aviãozinho', icon: 'fas fa-plane', desc: 'Aventura aérea emocionante', link: 'https://games.cambrero.com/joguinhodoaviao/aviaozinho.html' },
            { title: 'Tetris', icon: 'fas fa-th-large', desc: 'O clássico jogo de blocos', link: 'https://games.cambrero.com/tetris/tetris.html' },
            { title: 'Guerra dos Cliques', icon: 'fas fa-mouse-pointer', desc: 'Teste sua velocidade de clique', link: 'https://games.cambrero.com/guerra-de-cliques/index.html' },
            { title: 'Nemsei', icon: 'fas fa-puzzle-piece', desc: 'Jogo de estratégia e lógica', link: 'https://games.cambrero.com/nemsei/' },
            { title: 'Super Tiro', icon: 'fas fa-crosshairs', desc: 'Ação e precisão em tiros', link: 'https://supertiro.cambrero.com' },
            { title: 'Jogo de Tiro 2D', icon: 'fas fa-bullseye', desc: 'Aventura de tiro em 2D', link: 'https://games.cambrero.com/jogodetiro/index.html' },
            { title: 'BillionTycoon', icon: 'fas fa-bullseye', desc: 'BillionTycoon é um jogo de se tornar um bilionario ', link: 'https://games.cambrero.com/BillionTycoon/index.html' }
        ]
    };

    // --- Filter Logic ---
    const filterBtns = document.querySelectorAll('.filter-btn');
    const contentGrid = document.getElementById('contentGrid');

    function showContent(filter) {
        const content = contentData[filter] || [];
        if(contentGrid) {
            contentGrid.innerHTML = '';

            content.forEach((item, index) => {
                const card = document.createElement('div');
                card.className = item.featured ? 'card featured' : 'card';
                
                card.innerHTML = `
                    <i class="${item.icon}"></i>
                    <h4>${item.title}</h4>
                    <p>${item.desc}</p>
                `;
                
                card.addEventListener('click', () => {
                    if (item.link.startsWith('http')) {
                        window.open(item.link, '_blank');
                    } else {
                        window.location.href = item.link;
                    }
                });
                
                contentGrid.appendChild(card);
            });
        }
    }

    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            showContent(btn.dataset.filter);
        });
    });

    // --- Initialize ---
    applyTheme(getCookie('theme') || 'light');
    showContent('desenvolvimento');
    
    // Initialize Google Auth when the page loads
    if (typeof google !== 'undefined') {
        initGoogleAuth();
    } else {
        // Wait for Google API to load
        window.addEventListener('load', () => {
            setTimeout(initGoogleAuth, 1000);
        });
    }

    // Force check login status after a delay to ensure cookies are loaded
    setTimeout(checkLoginStatus, 1000);
});