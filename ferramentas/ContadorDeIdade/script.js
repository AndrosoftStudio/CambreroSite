document.addEventListener('DOMContentLoaded', function() {
    const navToggle = document.getElementById('navToggle');
    const navMenu = document.getElementById('navMenu');
    const navOverlay = document.getElementById('navOverlay');
    const themeToggle = document.getElementById('themeToggle');
    const backToTop = document.getElementById('backToTop');
    const birthdateInput = document.getElementById('birthdate');
    const currentTimeDisplay = document.getElementById('currentTime');
    const resultDisplay = document.getElementById('result');
    const resultDetailedDisplay = document.getElementById('resultDetailed');
    const historyList = document.getElementById('historyList');
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

    // Load Saved Birthdate
    const savedBirthdate = localStorage.getItem('birthdate');
    if (savedBirthdate) {
        birthdateInput.value = savedBirthdate;
    }

    // Load History
    let history = JSON.parse(localStorage.getItem('ageHistory')) || [];
    renderHistory();

    function calculateAge() {
        const birthdate = new Date(birthdateInput.value);
        const today = new Date();

        if (!birthdate.getTime()) {
            alert("Por favor, insira uma data de nascimento válida.");
            return;
        }

        // Save birthdate to cookies
        localStorage.setItem('birthdate', birthdateInput.value);

        // Calculate age in various units
        const diffInTime = today.getTime() - birthdate.getTime();
        const ageInSeconds = Math.floor(diffInTime / 1000);
        const ageInMinutes = Math.floor(ageInSeconds / 60);
        const ageInHours = Math.floor(ageInMinutes / 60);
        const ageInDays = Math.floor(diffInTime / (1000 * 3600 * 24));

        const ageInYears = today.getFullYear() - birthdate.getFullYear();
        const monthDifference = today.getMonth() - birthdate.getMonth();
        const isBeforeBirthdayThisYear = (monthDifference < 0) || (monthDifference === 0 && today.getDate() < birthdate.getDate());

        const years = isBeforeBirthdayThisYear ? ageInYears - 1 : ageInYears;
        const months = isBeforeBirthdayThisYear ? today.getMonth() - birthdate.getMonth() + 12 : today.getMonth() - birthdate.getMonth();
        const days = today.getDate() - birthdate.getDate();
        const daysInCurrentMonth = new Date(today.getFullYear(), today.getMonth(), 0).getDate();
        const correctedDays = days < 0 ? days + daysInCurrentMonth : days;

        const remainingHours = ageInHours % 24;
        const remainingMinutes = ageInMinutes % 60;

        // Display detailed result
        resultDetailedDisplay.innerText = `
            Anos: ${years} ano(s)
            Meses: ${months} mês(es)
            Dias: ${correctedDays} dia(s)
            Horas: ${remainingHours} hora(s)
            Minutos: ${remainingMinutes} minuto(s)
        `;
        resultDetailedDisplay.classList.add('visible');

        // Display combined result
        resultDisplay.innerText = `Você tem ${years} ano(s), ${months} mês(es), ${correctedDays} dia(s), ${remainingHours} hora(s) e ${remainingMinutes} minuto(s) de vida.`;
        resultDisplay.classList.add('visible');

        // Display current time
        const currentTime = today.toLocaleString('pt-BR', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
        });
        currentTimeDisplay.innerText = `Hora exata: ${currentTime}`;

        // Add to history
        const historyEntry = {
            birthdate: birthdateInput.value,
            result: resultDisplay.innerText,
            detailed: resultDetailedDisplay.innerText,
            timestamp: today.toISOString()
        };
        history.push(historyEntry);
        localStorage.setItem('ageHistory', JSON.stringify(history));
        renderHistory();
    }

    function renderHistory() {
        historyList.innerHTML = '';
        history.forEach((entry, index) => {
            const historyItem = document.createElement('div');
            historyItem.classList.add('history-item');
            historyItem.innerHTML = `
                <strong>Cálculo ${index + 1} (${new Date(entry.timestamp).toLocaleDateString('pt-BR')}):</strong><br>
                Data: ${entry.birthdate}<br>
                ${entry.result}<br>
                ${entry.detailed.replace(/\n/g, '<br>')}
            `;
            historyList.appendChild(historyItem);
        });
    }

    function clearInputs() {
        birthdateInput.value = '';
        resultDisplay.innerText = '';
        resultDetailedDisplay.innerText = '';
        currentTimeDisplay.innerText = '';
        resultDisplay.classList.remove('visible');
        resultDetailedDisplay.classList.remove('visible');
        localStorage.removeItem('birthdate');
    }

    function clearHistory() {
        history = [];
        localStorage.removeItem('ageHistory');
        renderHistory();
    }

    // Expose functions to global scope for HTML onclick
    window.calculateAge = calculateAge;
    window.clearInputs = clearInputs;
    window.clearHistory = clearHistory;
});