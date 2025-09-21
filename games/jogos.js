// Configuração dos Jogos
const games = [
    {
        name: "Dominó Multjogador",
        category: ["tabuleiro", "classico", "IA", "Multjogador"],
        link: "domino/index.html",
        image: "../images/damas-thumb.png"
    },
    {
        name: "Damas Multjogador",
        category: ["tabuleiro", "classico", "IA", "Multjogador"],
        link: "damas/Multjogador/index.html",
        image: "../images/damas-thumb.png"
    },
    {
        name: "DamasV3",
        category: ["tabuleiro", "classico", "IA", "Multjogador"],
        link: "damas/v3/",
        image: "../images/damas-thumb.png"
    },
    {
        name: "BillionTycoon",
        category: ["Tycoon"],
        link: "BillionTycoon/Index.html",
        imagem: "../images/damas-thumb.png"
    },
    {
        name: "Damas Clássicas (Mal-desenvolvido!)",
        category: ["tabuleiro", "classico", "IA"],
        link: "damas/damas.html",
        image: "../images/damas-thumb.png"
    },
    {
        name: "Jogo da Velha",
        category: ["tabuleiro", "classico", "estrategia", "IA"],
        link: "jogodavelha/jogodavelha.html",
        image: "../images/jdv-thumb.png"
    },
    {
        name: "Jogo da Cobrinha",
        category: ["corrida", "cobra", "classico", "sobrevivencia"],
        link: "jogodacobrinha/jogodacobrinha.html",
        image: "../images/jdc-thumb.png"
    },
    {
        name: "Joguinho de Avião",
        category: ["corrida", "aviao", "classico", "sobrevivencia"],
        link: "joguinhodoaviao/aviaozinho.html",
        image: "../images/jda-thumb.png"
    },
    {
        name: "Tetris",
        category: ["estrategia", "blocos", "classico", "sobrevivencia", "organizaçao"],
        link: "tetris/tetris.html",
        image: "../images/tetris-thumb.png"
    },
    {
        name: "Guerra dos Cliques",
        category: ["frenético", "cliques", "sobrevivencia", "competição"],
        link: "guerra-de-cliques/index.html",
        image: "../images/tetris-thumb.png"
    },
    {
        name: "Jogo de Tiro 2D",
        category: ["frenético", "cliques", "sobrevivencia", "competição"],
        link: "jogodetiro/index.html",
        image: "../images/tetris-thumb.png"
    }
];

// Função para carregar jogos
function loadGames(filter = 'all', search = '') {
    const container = document.getElementById('gamesContainer');
    container.innerHTML = '';

    const filteredGames = games.filter(function(game) {
        const matchesCategory = filter === 'all' || game.category.includes(filter);
        const matchesSearch = game.name.toLowerCase().includes(search.toLowerCase());
        return matchesCategory && matchesSearch;
    });

    filteredGames.forEach(function(game) {
        const card = document.createElement('div');
        card.className = 'game-card';
        card.innerHTML = `
            <h3>${game.name}</h3>
            <button onclick="window.location.href='${game.link}'">
                Jogar Agora <i class="fas fa-arrow-right"></i>
            </button>
        `;
        container.appendChild(card);
    });
}

document.addEventListener('DOMContentLoaded', function() {
    
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
            loginBtn.innerHTML = '<i class="fab fa-google"></i> Entrar';
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

    // --- Game Filter Logic ---
    const filterButtons = document.querySelectorAll('.filter-btn');
    filterButtons.forEach(function(button) {
        button.addEventListener('click', function() {
            filterButtons.forEach(function(btn) {
                btn.classList.remove('active');
            });
            button.classList.add('active');
            const filterCategory = button.dataset.category;
            const searchValue = document.getElementById('searchInput').value;
            loadGames(filterCategory, searchValue);
        });
    });

    // --- Search Logic ---
    const searchInput = document.getElementById('searchInput');
    searchInput.addEventListener('input', function(event) {
        const activeFilter = document.querySelector('.filter-btn.active').dataset.category;
        loadGames(activeFilter, event.target.value);
    });

    // --- Initialize ---
    console.log('Initializing games application...');
    
    // Apply saved theme
    applyTheme(getCookie('theme') || 'light');
    
    // Load initial games
    loadGames();
    
    // Initialize auth system
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
});