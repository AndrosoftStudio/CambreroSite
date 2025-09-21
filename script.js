document.addEventListener('DOMContentLoaded', function() {
    
    // --- Google OAuth Configuration ---
    const GOOGLE_CLIENT_ID = '495059312856-1biaguru6b1u7ojtm5c0ut6gcd5ebimt.apps.googleusercontent.com';
    
    // --- Cookie Functions with Cross-Domain Support ---
    function setCookie(name, value, days) {
        let expires = "";
        if (days) {
            const date = new Date();
            date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
            expires = "; expires=" + date.toUTCString();
        }
        
        // Set cookie for the main domain to work across subdomains
        document.cookie = `${name}=${value || ""}${expires}; path=/; domain=.cambrero.com; SameSite=Lax`;
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
        // Delete cookie by setting expiration to past date
        setCookie(name, '', -1);
    }

    // --- Theme Logic ---
    const themeToggle = document.getElementById('themeToggle');
    const themeMenuToggle = document.getElementById('themeMenuToggle');
    const themeMenuText = document.getElementById('themeMenuText');
    const body = document.body;

    function applyTheme(theme) {
        if (theme === 'dark') {
            body.classList.add('dark-mode');
            if(themeToggle) themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
            if(themeMenuToggle) {
                themeMenuToggle.innerHTML = '<i class="fas fa-sun"></i> <span id="themeMenuText">Modo Claro</span>';
            }
        } else {
            body.classList.remove('dark-mode');
            if(themeToggle) themeToggle.innerHTML = '<i class="fas fa-moon"></i>';
            if(themeMenuToggle) {
                themeMenuToggle.innerHTML = '<i class="fas fa-moon"></i> <span id="themeMenuText">Modo Escuro</span>';
            }
        }
    }

    function toggleTheme() {
        const newTheme = body.classList.contains('dark-mode') ? 'light' : 'dark';
        setCookie('theme', newTheme, 365);
        applyTheme(newTheme);
        console.log('Theme changed to:', newTheme);
    }

    // Event listeners para ambos os botões de tema
    if(themeToggle) {
        themeToggle.addEventListener('click', toggleTheme);
    }

    if(themeMenuToggle) {
        themeMenuToggle.addEventListener('click', (e) => {
            e.preventDefault();
            toggleTheme();
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

        // Close menu when clicking on menu items (except theme toggle)
        const menuItems = document.querySelectorAll('.menu-item:not(#themeMenuToggle)');
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
        console.log('Initializing simple redirect auth...');
        
        // Check if user is already logged in
        checkLoginStatus();
        
        // Add simple redirect handler for login button
        if(loginBtn) {
            loginBtn.addEventListener('click', (e) => {
                e.preventDefault();
                console.log('Login button clicked, redirecting to login.cambrero.com...');
                
                // Simple redirect to login page
                window.location.href = 'https://login.cambrero.com';
            });
        }
    }

    function handleGoogleSignIn(response) {
        console.log('Google sign-in response received:', response);
        
        try {
            // Decode the JWT token to get user info
            const userInfo = parseJwt(response.credential);
            console.log('Parsed user info:', userInfo);
            
            if (!userInfo) {
                console.error('Failed to parse user info from token');
                return;
            }
            
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
        console.log('Checking login status...');
        const userData = getCookie('google_user');
        console.log('Cookie data found:', userData);
        
        if (userData) {
            try {
                const user = JSON.parse(userData);
                console.log('User found in cookies:', user);
                
                // Check if token is still valid (not older than 7 days)
                const now = new Date().getTime();
                const loginTime = user.timestamp || 0;
                const sevenDays = 7 * 24 * 60 * 60 * 1000;
                
                if (now - loginTime < sevenDays) {
                    console.log('Token is valid, updating UI for logged in user');
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
            console.log('No user data found in cookies, showing login button');
            showLoginButton();
        }
    }

    function showLoginButton() {
        console.log('Showing login button');
        if(loginBtn) {
            loginBtn.style.display = 'flex';
            loginBtn.innerHTML = '<i class="fab fa-google"></i> Entrar com Google';
        }
        if(profileMenu) profileMenu.style.display = 'none';
    }

    function updateUIForLoggedInUser(userData) {
        console.log('Updating UI for logged in user:', userData);
        
        if(loginBtn) {
            loginBtn.style.display = 'none';
            console.log('Login button hidden');
        }
        if(profileMenu) {
            profileMenu.style.display = 'flex';
            console.log('Profile menu shown');
        }
        
        const profileNameEl = document.getElementById('profileName');
        const profileEmailEl = document.getElementById('profileEmail');
        const profilePicEl = document.getElementById('profilePic');

        if(profileNameEl) {
            profileNameEl.textContent = userData.name;
            console.log('Profile name updated:', userData.name);
        }
        if(profileEmailEl) {
            profileEmailEl.textContent = userData.email;
            console.log('Profile email updated:', userData.email);
        }
        if(profilePicEl) {
            const profilePicture = userData.picture || `https://placehold.co/40x40/3498db/ffffff?text=${userData.name.charAt(0).toUpperCase()}`;
            profilePicEl.src = profilePicture;
            console.log('Profile picture updated:', profilePicture);
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
            console.log('Profile dropdown toggled');
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
            console.log('Logout button clicked');
            
            // Sign out from Google
            if (googleAuth) {
                try {
                    google.accounts.id.disableAutoSelect();
                    console.log('Google auto-select disabled');
                } catch (error) {
                    console.error('Error disabling Google auto-select:', error);
                }
            }
            
            // Clear cookies
            deleteCookie('google_user');
            deleteCookie('google_token');
            
            // Update UI
            showLoginButton();
            
            console.log('User logged out successfully');
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
            { title: 'DamasV3', icon: 'fas fa-chess-board', desc: 'Jogue damas multijogador online', link: 'https://games.cambrero.com/damas/v3/' },
            { title: 'Damas', icon: 'fas fa-chess-board', desc: 'Jogue damas multijogador online', link: 'https://games.cambrero.com/damas/Multjogador/index.html' },
            { title: 'Dominó', icon: 'fas fa-dice', desc: 'Jogo clássico de dominó', link: 'https://games.cambrero.com/domino/index.html' },
            { title: 'Snake', icon: 'fa-solid fa-snake', desc: 'Jogo da cobrinha clássico', link: 'https://games.cambrero.com/jogodacobrinha/jogodacobrinha.html' },
            { title: 'Jogo da Velha', icon: 'fas fa-hashtag', desc: 'Tic-tac-toe clássico', link: 'https://games.cambrero.com/jogodavelha/jogodavelha.html' },
            { title: 'Jogo do Aviãozinho', icon: 'fas fa-plane', desc: 'Aventura aérea emocionante', link: 'https://games.cambrero.com/joguinhodoaviao/aviaozinho.html' },
            { title: 'Tetris', icon: 'fas fa-th-large', desc: 'O clássico jogo de blocos', link: 'https://games.cambrero.com/tetris/tetris.html' },
            { title: 'Guerra dos Cliques', icon: 'fas fa-mouse-pointer', desc: 'Teste sua velocidade de clique', link: 'https://games.cambrero.com/guerra-de-cliques/index.html' },
            { title: 'Nemsei', icon: 'fas fa-puzzle-piece', desc: 'Jogo de estratégia e lógica', link: 'https://games.cambrero.com/nemsei/' },
            { title: 'Super Tiro', icon: 'fas fa-crosshairs', desc: 'Ação e precisão em tiros', link: 'https://supertiro.cambrero.com' },
            { title: 'Jogo de Tiro 2D', icon: 'fas fa-bullseye', desc: 'Aventura de tiro em 2D', link: 'https://games.cambrero.com/jogodetiro/index.html' },
            { title: 'BillionTycoon', icon: 'fas fa-bullseye', desc: 'BillionTycoon é um jogo de se tornar um bilionario ', link: 'https://games.cambrero.com/BillionTycoon/index.html' }
        ],
        bot: [
            { title: 'RL BOT', icon: 'fas fa-robot', desc: 'Bot inteligente para Discord', link: 'https://cambrero.com/bots/discord/rlbot/' }
        ]
    };

    // --- Filter Logic ---
    const filterBtns = document.querySelectorAll('.filter-btn');
    const contentGrid = document.getElementById('contentGrid');

    function showContent(filter) {
        console.log('Showing content for filter:', filter);
        const content = contentData[filter] || [];
        console.log('Content data for filter:', content);
        
        if(contentGrid) {
            contentGrid.innerHTML = '';

            if (content.length === 0) {
                const noContent = document.createElement('div');
                noContent.className = 'no-content';
                noContent.innerHTML = '<p>Nenhum conteúdo disponível para esta categoria.</p>';
                contentGrid.appendChild(noContent);
                return;
            }

            content.forEach((item, index) => {
                console.log('Creating card for item:', item);
                const card = document.createElement('div');
                card.className = item.featured ? 'card featured' : 'card';
                
                card.innerHTML = `
                    <i class="${item.icon}"></i>
                    <h4>${item.title}</h4>
                    <p>${item.desc}</p>
                `;
                
                card.addEventListener('click', () => {
                    console.log('Card clicked, navigating to:', item.link);
                    window.location.href = item.link;
                });
                
                contentGrid.appendChild(card);
            });
        }
    }

    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            console.log('Filter button clicked:', btn.dataset.filter);
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            showContent(btn.dataset.filter);
        });
    });

    // --- Initialize ---
    console.log('Initializing application...');
    applyTheme(getCookie('theme') || 'light');
    showContent('desenvolvimento');
    
    // Initialize simple auth (just redirect functionality and status check)
    console.log('Initializing auth system...');
    initGoogleAuth();

    // Force check login status after delays to ensure everything is loaded
    setTimeout(() => {
        console.log('Forced login status check after 1 second');
        checkLoginStatus();
    }, 1000);
    
    setTimeout(() => {
        console.log('Forced login status check after 3 seconds');
        checkLoginStatus();
    }, 3000);

    // Debug: Log all content data to console
    console.log('All content data:', contentData);
    console.log('Bot content specifically:', contentData.bot);
});