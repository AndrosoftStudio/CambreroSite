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
    const bestMove = minimax([...board], currentPlayer).index;
    makeMove(bestMove);
}

function minimax(newBoard, player) {
    const emptySpots = newBoard.reduce((acc, cell, index) => {
        if (cell === '') acc.push(index);
        return acc;
    }, []);

    if (checkWinForMinimax(newBoard, 'X')) return { score: -1 };
    if (checkWinForMinimax(newBoard, 'O')) return { score: 1 };
    if (emptySpots.length === 0) return { score: 0 };

    const moves = [];
    for (let spot of emptySpots) {
        const move = { index: spot };
        newBoard[spot] = player;
        
        if (player === 'O') {
            const result = minimax(newBoard, 'X');
            move.score = result.score;
        } else {
            const result = minimax(newBoard, 'O');
            move.score = result.score;
        }
        
        newBoard[spot] = '';
        moves.push(move);
    }

    let bestMove;
    if (player === 'O') {
        let bestScore = -Infinity;
        for (let move of moves) {
            if (move.score > bestScore) {
                bestScore = move.score;
                bestMove = move;
            }
        }
    } else {
        let bestScore = Infinity;
        for (let move of moves) {
            if (move.score < bestScore) {
                bestScore = move.score;
                bestMove = move;
            }
        }
    }
    return bestMove;
}

function checkWin() {
    const winConditions = [
        [0, 1, 2], [3, 4, 5], [6, 7, 8],
        [0, 3, 6], [1, 4, 7], [2, 5, 8],
        [0, 4, 8], [2, 4, 6]
    ];

    return winConditions.some(condition => {
        if (condition.every(index => board[index] === currentPlayer)) {
            highlightWin(condition);
            return true;
        }
        return false;
    });
}

function checkWinForMinimax(board, player) {
    const winConditions = [
        [0, 1, 2], [3, 4, 5], [6, 7, 8],
        [0, 3, 6], [1, 4, 7], [2, 5, 8],
        [0, 4, 8], [2, 4, 6]
    ];

    return winConditions.some(condition => 
        condition.every(index => board[index] === player)
    );
}

function highlightWin(cells) {
    cells.forEach(index => {
        document.querySelector(`[data-index="${index}"]`).style.backgroundColor = '#27ae60';
    });
}

function resetGame() {
    board = ['', '', '', '', '', '', '', '', ''];
    gameActive = true;
    
    // Lógica para definir quem começa
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
        cell.style.backgroundColor = '';
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

// Dark Mode Script
const darkModeToggle = document.getElementById('darkModeToggle');
const body = document.body;

function toggleDarkMode() {
    body.classList.toggle('dark-mode');
    const isDark = body.classList.contains('dark-mode');
    localStorage.setItem('darkMode', isDark);
    darkModeToggle.innerHTML = isDark ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
}

darkModeToggle.addEventListener('click', toggleDarkMode);

// Carregar tema salvo
const savedDarkMode = localStorage.getItem('darkMode') === 'true';
if (savedDarkMode) {
    body.classList.add('dark-mode');
    darkModeToggle.innerHTML = '<i class="fas fa-sun"></i>';
}