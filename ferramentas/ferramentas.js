document.addEventListener('DOMContentLoaded', function() {
    const navToggle = document.getElementById('navToggle');
    const navMenu = document.getElementById('navMenu');
    const navOverlay = document.getElementById('navOverlay');
    const themeToggle = document.getElementById('themeToggle');
    const backToTop = document.getElementById('backToTop');
    const searchInput = document.getElementById('searchInput');
    const sortTools = document.getElementById('sortTools');
    const toolButtons = document.querySelectorAll('.tool-button');
    const body = document.body;

    // Funções para manipulação de cookies
    function setCookie(name, value, days) {
        let expires = "";
        if (days) {
            const date = new Date();
            date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
            expires = "; expires=" + date.toUTCString();
        }
        document.cookie = name + "=" + (value || "") + expires + "; path=/; domain=.cambrero.com; SameSite=Lax";
    }

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

    // Menu Toggle
    function toggleNavMenu() {
        navMenu.classList.toggle('active');
        navOverlay.classList.toggle('active');
    }

    navToggle.addEventListener('click', toggleNavMenu);
    navOverlay.addEventListener('click', toggleNavMenu);

    // Theme Toggle
    themeToggle.addEventListener('click', function() {
        body.classList.toggle('dark-mode');
        const newTheme = body.classList.contains('dark-mode') ? 'dark' : 'light';
        setCookie('theme', newTheme, 365);
        themeToggle.innerHTML = newTheme === 'dark' ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
    });

    const savedTheme = getCookie('theme');
    if (savedTheme === 'dark') {
        body.classList.add('dark-mode');
        themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
    } else {
        body.classList.remove('dark-mode');
        themeToggle.innerHTML = '<i class="fas fa-moon"></i>';
    }

    // Back to Top
    window.addEventListener('scroll', function() {
        if (window.scrollY > 300) {
            backToTop.style.display = 'block';
        } else {
            backToTop.style.display = 'none';
        }
    });

    backToTop.addEventListener('click', function() {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    // Search Functionality
    searchInput.addEventListener('input', function() {
        const searchTerm = searchInput.value.toLowerCase();
        toolButtons.forEach(button => {
            const toolName = button.getAttribute('data-tool').toLowerCase();
            const toolDate = button.getAttribute('data-date');
            if (toolName.includes(searchTerm) || toolDate.includes(searchTerm)) {
                button.style.display = 'flex';
            } else {
                button.style.display = 'none';
            }
        });
    });

    // Sort Functionality
    sortTools.addEventListener('change', function() {
        const sortValue = sortTools.value;
        const toolsArray = Array.from(toolButtons);

        toolsArray.sort((a, b) => {
            const nameA = a.getAttribute('data-tool').toLowerCase();
            const nameB = b.getAttribute('data-tool').toLowerCase();
            const dateA = new Date(a.getAttribute('data-date'));
            const dateB = new Date(b.getAttribute('data-date'));

            if (sortValue === 'name-asc') {
                return nameA.localeCompare(nameB);
            } else if (sortValue === 'name-desc') {
                return nameB.localeCompare(nameA);
            } else if (sortValue === 'date-asc') {
                return dateA - dateB;
            } else if (sortValue === 'date-desc') {
                return dateB - dateB;
            }
            return 0;
        });

        const toolsGrid = document.getElementById('toolsGrid');
        toolsGrid.innerHTML = '';
        toolsArray.forEach(button => toolsGrid.appendChild(button));
    });
});