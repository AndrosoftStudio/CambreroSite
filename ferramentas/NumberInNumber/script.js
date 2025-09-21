document.addEventListener('DOMContentLoaded', function() {
    const navToggle = document.getElementById('navToggle');
    const navMenu = document.getElementById('navMenu');
    const navOverlay = document.getElementById('navOverlay');
    const themeToggle = document.getElementById('themeToggle');
    const inputTab = document.getElementById('inputTab');
    const resultTab = document.getElementById('resultTab');
    const converterBtn = document.getElementById('converterBtn');
    const voltarBtn = document.getElementById('voltarBtn');
    const clearBtn = document.getElementById('clearBtn');
    const nomeInput = document.getElementById('nome');
    const tipoConversao = document.getElementById('tipoConversao');
    const resultadoNumeros = document.getElementById('resultadoNumeros');
    const resultadoDetalhado = document.getElementById('resultadoDetalhado');
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

    // Load Saved Inputs
    const savedNome = localStorage.getItem('numberInNumberNome');
    const savedTipo = localStorage.getItem('numberInNumberTipo');
    if (savedNome) nomeInput.value = savedNome;
    if (savedTipo) tipoConversao.value = savedTipo;

    // Load History
    let history = JSON.parse(localStorage.getItem('numberInNumberHistory')) || [];
    renderHistory();

    function showTab(tab) {
        inputTab.classList.remove('active');
        resultTab.classList.remove('active');
        tab.classList.add('active');
    }

    converterBtn.addEventListener('click', function() {
        const nome = nomeInput.value.toUpperCase();
        const tipo = tipoConversao.value;
        let numeros = [];
        let detalhes = [];

        for (let i = 0; i < nome.length; i++) {
            const codigo = nome.charCodeAt(i);
            if (codigo >= 65 && codigo <= 90) { // Letras de A a Z
                const numero = codigo - 64;
                numeros.push(numero);
                detalhes.push(`${nome[i]}: ${numero}`);
            }
        }

        if (numeros.length === 0) {
            alert("Por favor, insira um nome válido contendo apenas letras de A a Z.");
            return;
        }

        // Save inputs to cookies
        localStorage.setItem('numberInNumberNome', nomeInput.value);
        localStorage.setItem('numberInNumberTipo', tipoConversao.value);

        if (tipo === 'soma') {
            const soma = numeros.reduce((acc, val) => acc + val, 0);
            resultadoNumeros.innerText = `A soma dos valores numéricos do nome é: ${soma}`;
            resultadoDetalhado.innerText = detalhes.join('\n');
        } else if (tipo === 'substituicao') {
            resultadoNumeros.innerText = `O nome com letras substituídas por números:\n${numeros.join(' - ')}`;
            resultadoDetalhado.innerText = detalhes.join('\n');
        }

        // Add to history
        const historyEntry = {
            nome: nomeInput.value,
            tipo: tipoConversao.options[tipoConversao.selectedIndex].text,
            resultado: resultadoNumeros.innerText,
            detalhado: resultadoDetalhado.innerText,
            timestamp: new Date().toISOString()
        };
        history.push(historyEntry);
        localStorage.setItem('numberInNumberHistory', JSON.stringify(history));
        renderHistory();

        showTab(resultTab);
    });

    voltarBtn.addEventListener('click', function() {
        showTab(inputTab);
    });

    clearBtn.addEventListener('click', function() {
        nomeInput.value = '';
        tipoConversao.value = 'soma';
        localStorage.removeItem('numberInNumberNome');
        localStorage.removeItem('numberInNumberTipo');
    });

    function renderHistory() {
        historyList.innerHTML = '';
        history.forEach((entry, index) => {
            const historyItem = document.createElement('div');
            historyItem.classList.add('history-item');
            historyItem.innerHTML = `
                <strong>Conversão ${index + 1} (${new Date(entry.timestamp).toLocaleDateString('pt-BR')}):</strong><br>
                Nome: ${entry.nome}<br>
                Tipo: ${entry.tipo}<br>
                ${entry.resultado}<br>
                ${entry.detalhado.replace(/\n/g, '<br>')}
            `;
            historyList.appendChild(historyItem);
        });
    }

    function clearHistory() {
        history = [];
        localStorage.removeItem('numberInNumberHistory');
        renderHistory();
    }

    // Expose clearHistory to global scope for HTML onclick
    window.clearHistory = clearHistory;

    // Inicializa exibindo a aba de entrada
    showTab(inputTab);
});