let currentPlayer = 'X';
let gameMode = 'pvp';
let gameActive = true;
let board = ['', '', '', '', '', '', '', '', ''];
let scores = {
    X: 0,
    O: 0,
    draw: 0
};
let lastStarter = 'O'; // Controla quem começou o último jogo
let lastLoser; // Armazena o jogador que perdeu

// Inicialização
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('gameMode').addEventListener('change', (e) => {
        gameMode = e.target.value;
        resetGame();
    });

    document.querySelectorAll('.cell').forEach(cell => {
        cell.addEventListener('click', handleCellClick);
    });

    // Carregar pontuação salva
    const savedScores = localStorage.getItem('ticTacToeScores');
    if (savedScores) {
        scores = JSON.parse(savedScores);
        updateScoreDisplay();
    }

    updateCurrentPlayerDisplay();

    // Menu toggle (como no principal)
    const menuToggle = document.querySelector('.menu-toggle');
    const sideMenu = document.querySelector('.side-menu');
    menuToggle.addEventListener('click', () => {
        sideMenu.classList.toggle('hidden');
    });

    // Dark mode (como no principal)
    const themeToggle = document.getElementById('darkModeToggle');
    const themeMenuToggle = document.getElementById('themeMenuToggle');
    const body = document.body;

    function applyTheme(theme) {
        if (theme === 'dark') {
            body.classList.add('dark-mode');
            themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
            themeMenuToggle.innerHTML = '<i class="fas fa-sun"></i> <span id="themeMenuText">Modo Claro</span>';
        } else {
            body.classList.remove('dark-mode');
            themeToggle.innerHTML = '<i class="fas fa-moon"></i>';
            themeMenuToggle.innerHTML = '<i class="fas fa-moon"></i> <span id="themeMenuText">Modo Escuro</span>';
        }
    }

    function toggleTheme() {
        const newTheme = body.classList.contains('dark-mode') ? 'light' : 'dark';
        applyTheme(newTheme);
        localStorage.setItem('theme', newTheme);
    }

    themeToggle.addEventListener('click', toggleTheme);
    themeMenuToggle.addEventListener('click', toggleTheme);

    const savedTheme = localStorage.getItem('theme') || 'light';
    applyTheme(savedTheme);
});

function handleCellClick(e) {
    const index = e.target.dataset.index;
    
    if (!gameActive || board[index] !== '') return;
    
    makeMove(index);
    
    if (gameMode === 'ai' && gameActive) {
        setTimeout(() => aiMove(), 500);
    }
}

function makeMove(index) {
    board[index] = currentPlayer;
    document.querySelectorAll('.cell')[index].textContent = currentPlayer;
    
    if (checkWin()) {
        scores[currentPlayer]++;
        gameActive = false;
        updateScoreDisplay();
        
        // Define o perdedor como próximo a começar
        lastLoser = currentPlayer === 'X' ? 'O' : 'X';
        
        setTimeout(() => alert(`${currentPlayer} venceu!`), 10);
    } else if (board.every(cell => cell !== '')) {
        scores.draw++;
        gameActive = false;
        updateScoreDisplay();
        
        // Em caso de empate, alterna normalmente
        lastLoser = undefined;
        
        setTimeout(() => alert('Empate!'), 10);
    } else {
        currentPlayer = currentPlayer === 'X' ? 'O' : 'X';
        updateCurrentPlayerDisplay();
    }
}

function aiMove() {
    let available = board.reduce((acc, cell, i) => {
        if (cell === '') acc.push(i);
        return acc;
    }, []);
    
    if (available.length === 0) return;
    
    // Lógica simples de IA: tenta vencer ou bloquear
    let move = findBestMove('O') || findBestMove('X') || available[Math.floor(Math.random() * available.length)];
    makeMove(move);
}

function findBestMove(player) {
    const wins = [
        [0,1,2], [3,4,5], [6,7,8],
        [0,3,6], [1,4,7], [2,5,8],
        [0,4,8], [2,4,6]
    ];
    
    for (let combo of wins) {
        let [a,b,c] = combo;
        if (board[a] === player && board[b] === player && board[c] === '') return c;
        if (board[a] === player && board[c] === player && board[b] === '') return b;
        if (board[b] === player && board[c] === player && board[a] === '') return a;
    }
    return null;
}

function checkWin() {
    const wins = [
        [0,1,2], [3,4,5], [6,7,8],
        [0,3,6], [1,4,7], [2,5,8],
        [0,4,8], [2,4,6]
    ];
    
    return wins.some(combo => {
        return combo.every(i => board[i] === currentPlayer);
    });
}

function resetGame() {
    board = ['', '', '', '', '', '', '', '', ''];
    gameActive = true;
    
    if (lastLoser) {
        currentPlayer = lastLoser;
        lastStarter = lastLoser;
    } else {
        currentPlayer = lastStarter === 'X' ? 'O' : 'X';
        lastStarter = currentPlayer;
    }
    
    updateCurrentPlayerDisplay();
    document.querySelectorAll('.cell').forEach(cell => {
        cell.textContent = '';
    });
}

function resetScore() {
    scores = { X: 0, O: 0, draw: 0 };
    lastStarter = 'O';
    lastLoser = undefined;
    updateScoreDisplay();
    localStorage.setItem('ticTacToeScores', JSON.stringify(scores));
}

function updateScoreDisplay() {
    document.getElementById('scoreX').textContent = scores.X;
    document.getElementById('scoreO').textContent = scores.O;
    document.getElementById('scoreDraw').textContent = scores.draw;
    localStorage.setItem('ticTacToeScores', JSON.stringify(scores));
}

function updateCurrentPlayerDisplay() {
    document.getElementById('currentPlayer').textContent = 
        `Vez do Jogador: ${currentPlayer}`;
}