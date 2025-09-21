// Menu Toggle
const navToggle = document.getElementById('navToggle');
const navMenu = document.getElementById('navMenu');
const navOverlay = document.getElementById('navOverlay');

function toggleNavMenu() {
    navMenu.classList.toggle('active');
    navOverlay.classList.toggle('active');
}

navToggle.addEventListener('click', toggleNavMenu);
navOverlay.addEventListener('click', toggleNavMenu);

// Game Menu Toggle
const gameMenuToggle = document.getElementById('gameMenuToggle');
const gameMenu = document.getElementById('gameMenu');
const menuOverlay = document.getElementById('menuOverlay');
const closeGameMenu = document.getElementById('closeGameMenu');

function toggleGameMenu() {
    gameMenu.classList.toggle('active');
    menuOverlay.classList.toggle('active');
}

function closeGameMenuHandler() {
    gameMenu.classList.remove('active');
    menuOverlay.classList.remove('active');
}

gameMenuToggle.addEventListener('click', toggleGameMenu);
menuOverlay.addEventListener('click', closeGameMenuHandler);
closeGameMenu.addEventListener('click', closeGameMenuHandler);

// Theme Toggle
const themeToggle = document.getElementById('themeToggle');
const body = document.body;

function toggleDarkMode() {
    body.classList.toggle('dark-mode');
    const isDark = body.classList.contains('dark-mode');
    localStorage.setItem('theme', isDark);
    themeToggle.innerHTML = isDark ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
    resetCanvasBackground();
}

themeToggle.addEventListener('click', toggleDarkMode);

// Carregar tema salvo
const savedTheme = localStorage.getItem('theme');
if (savedTheme === 'dark') {
    body.classList.add('dark-mode');
    themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
} else {
    themeToggle.innerHTML = '<i class="fas fa-moon"></i>';
}

// Cookies para tutorial
function hasSeenTutorial() {
    return localStorage.getItem('snakeTutorialSeen') === 'true';
}

function setTutorialSeen() {
    localStorage.setItem('snakeTutorialSeen', 'true');
}

// Cookies para controles
function areControlsVisible() {
    return localStorage.getItem('snakeControlsVisible') !== 'false';
}

function toggleControlsVisibility() {
    const controls = document.querySelector('.mobile-controls');
    const isVisible = !areControlsVisible();
    if (isVisible) {
        controls.classList.remove('hidden');
    } else {
        controls.classList.add('hidden');
    }
    localStorage.setItem('snakeControlsVisible', isVisible);
    const toggleBtn = document.getElementById('toggleControlsBtn');
    toggleBtn.innerHTML = isVisible ? '<i class="fas fa-eye"></i>' : '<i class="fas fa-eye-slash"></i>';
}

// Cookies para dificuldade
function getSavedDifficulty() {
    return localStorage.getItem('snakeDifficulty') || 'medium';
}

function setSavedDifficulty(difficulty) {
    localStorage.setItem('snakeDifficulty', difficulty);
    switch (difficulty) {
        case 'easy':
            gameSpeed = 150;
            break;
        case 'medium':
            gameSpeed = 100;
            break;
        case 'hard':
            gameSpeed = 60;
            break;
    }
}

// Game Logic
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('score');
const highScoreElement = document.getElementById('highScore');
const pauseBtn = document.getElementById('pauseBtn');
const instructionsScreen = document.getElementById('instructionsScreen');
const startGameBtn = document.getElementById('startGameBtn');
const speedSelect = document.getElementById('speedSelect');
const upBtn = document.getElementById('upBtn');
const downBtn = document.getElementById('downBtn');
const leftBtn = document.getElementById('leftBtn');
const rightBtn = document.getElementById('rightBtn');
const gameArea = document.getElementById('gameArea');
const newGameBtn = document.getElementById('newGame');
const gameOverScreen = document.getElementById('gameOver');
const gameOverMessage = document.getElementById('gameOverMessage');
const restartGameBtn = document.getElementById('restartGameBtn');
const toggleControlsBtn = document.getElementById('toggleControlsBtn');
const difficultySelect = document.getElementById('difficultySelect');

// Configurações do jogo
const tileCount = 20; // 20x20 tiles

// Ajustar o tamanho do canvas com base no game-container
const gameContainer = document.querySelector('.game-container');
let canvasSize = Math.min(
    gameContainer.clientWidth - 40, // Considerar padding de 20px de cada lado
    gameContainer.clientHeight - 150, // Ajustar para caber com o score-board e controles
    400
);
canvas.width = canvasSize;
canvas.height = canvasSize;
const gridSize = canvasSize / tileCount;

let snake = [{ x: Math.floor(tileCount / 2), y: Math.floor(tileCount / 2) }]; // Cobra começa no centro
let food = { x: 15, y: 15 };
let dx = 0; // Começa parado
let dy = 0;
let score = 0;
let highScore = parseInt(localStorage.getItem('snakeHighScore')) || 0;
let touchStartX = 0;
let touchStartY = 0;
let isPaused = true; // Jogo começa pausado
let gameInterval;
let gameSpeed = 100; // Velocidade padrão (médio)
let hasMoved = false; // Para evitar game over antes do primeiro movimento

// Funções do jogo
function resetCanvasBackground() {
    ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--entry-bg');
    ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function generateFood() {
    food.x = Math.floor(Math.random() * tileCount);
    food.y = Math.floor(Math.random() * tileCount);
    if (snake.some(segment => segment.x === food.x && segment.y === food.y)) {
        generateFood();
    }
}

function collision() {
    // Evitar colisão falsa na inicialização
    if (!hasMoved) return false;
    return snake.slice(1).some(segment => segment.x === snake[0].x && segment.y === snake[0].y);
}

function checkCanvasCollision(head) {
    const headXInPixels = head.x * gridSize;
    const headYInPixels = head.y * gridSize;
    return (
        headXInPixels < 0 ||
        headXInPixels + gridSize > canvas.width ||
        headYInPixels < 0 ||
        headYInPixels + gridSize > canvas.height
    );
}

function changeDirection(event) {
    // Iniciar o jogo se ainda não começou
    if (isPaused) {
        isPaused = false;
        gameInterval = setInterval(drawGame, gameSpeed);
        pauseBtn.innerHTML = '<i class="fas fa-pause"></i>';
    }

    const LEFT_KEY = 'ArrowLeft';
    const RIGHT_KEY = 'ArrowRight';
    const UP_KEY = 'ArrowUp';
    const DOWN_KEY = 'ArrowDown';

    const keyPressed = event.key || event;
    const goingUp = dy === -1;
    const goingDown = dy === 1;
    const goingRight = dx === 1;
    const goingLeft = dx === -1;

    if (keyPressed === LEFT_KEY && !goingRight) {
        dx = -1;
        dy = 0;
        hasMoved = true;
    }
    if (keyPressed === UP_KEY && !goingDown) {
        dx = 0;
        dy = -1;
        hasMoved = true;
    }
    if (keyPressed === RIGHT_KEY && !goingLeft) {
        dx = 1;
        dy = 0;
        hasMoved = true;
    }
    if (keyPressed === DOWN_KEY && !goingUp) {
        dx = 0;
        dy = 1;
        hasMoved = true;
    }
}

function gameOver() {
    clearInterval(gameInterval);
    gameOverMessage.textContent = `Pontuação: ${score}\nRecorde: ${highScore}`;
    gameOverScreen.style.display = 'flex';
    isPaused = true;
    pauseBtn.innerHTML = '<i class="fas fa-play"></i>';
}

function resetGame() {
    gameOverScreen.style.display = 'none';
    clearInterval(gameInterval);
    snake = [{ x: Math.floor(tileCount / 2), y: Math.floor(tileCount / 2) }]; // Cobra no centro
    dx = 0; // Cobra começa parada
    dy = 0;
    score = 0;
    scoreElement.textContent = score;
    highScoreElement.textContent = highScore;
    hasMoved = false;
    generateFood();
    resetCanvasBackground();
    isPaused = true;
    pauseBtn.innerHTML = '<i class="fas fa-play"></i>';
    if (!hasSeenTutorial()) {
        instructionsScreen.classList.remove('hidden');
    }
}

function togglePause() {
    isPaused = !isPaused;
    pauseBtn.innerHTML = isPaused ? '<i class="fas fa-play"></i>' : '<i class="fas fa-pause"></i>';
    if (!isPaused) {
        gameInterval = setInterval(drawGame, gameSpeed);
    } else {
        clearInterval(gameInterval);
    }
    closeGameMenuHandler();
}

function animateScore(element) {
    element.classList.add('active');
}

function drawGame() {
    if (isPaused) {
        // Desenhar a cobra e a comida mesmo quando pausado para garantir que ela apareça
        resetCanvasBackground();
        ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--accent-color');
        snake.forEach(segment => {
            ctx.fillRect(segment.x * gridSize, segment.y * gridSize, gridSize, gridSize); // Ocupar todo o espaço do tile
        });

        // Desenhar comida
        ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--primary-color');
        ctx.fillRect(food.x * gridSize, food.y * gridSize, gridSize, gridSize); // Ocupar todo o espaço do tile
        return;
    }

    // Só mover a cobra se ela tiver começado a se mover
    if (!hasMoved) {
        resetCanvasBackground();
        ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--accent-color');
        snake.forEach(segment => {
            ctx.fillRect(segment.x * gridSize, segment.y * gridSize, gridSize, gridSize); // Ocupar todo o espaço do tile
        });

        // Desenhar comida
        ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--primary-color');
        ctx.fillRect(food.x * gridSize, food.y * gridSize, gridSize, gridSize); // Ocupar todo o espaço do tile
        return;
    }

    const head = { x: snake[0].x + dx, y: snake[0].y + dy };
    snake.unshift(head);

    // Verificar colisão com comida
    if (head.x === food.x && head.y === food.y) {
        score += 10;
        if (score > highScore) {
            highScore = score;
            localStorage.setItem('snakeHighScore', highScore);
            animateScore(highScoreElement);
        }
        scoreElement.textContent = score;
        highScoreElement.textContent = highScore;
        animateScore(scoreElement);
        generateFood();
    } else {
        snake.pop();
    }

    resetCanvasBackground();

    // Desenhar cobra
    ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--accent-color');
    snake.forEach(segment => {
        ctx.fillRect(segment.x * gridSize, segment.y * gridSize, gridSize, gridSize); // Ocupar todo o espaço do tile
    });

    // Desenhar comida
    ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--primary-color');
    ctx.fillRect(food.x * gridSize, food.y * gridSize, gridSize, gridSize); // Ocupar todo o espaço do tile

    // Verificar colisões
    if (hasMoved && (checkCanvasCollision(head) || collision())) {
        gameOver();
    }
}

// Event Listeners
document.addEventListener('keydown', changeDirection);

canvas.addEventListener('touchstart', function(e) {
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
    e.preventDefault();
}, false);

canvas.addEventListener('touchend', function(e) {
    // Iniciar o jogo se ainda não começou
    if (isPaused) {
        isPaused = false;
        gameInterval = setInterval(drawGame, gameSpeed);
        pauseBtn.innerHTML = '<i class="fas fa-pause"></i>';
    }

    const touchEndX = e.changedTouches[0].clientX;
    const touchEndY = e.changedTouches[0].clientY;
    
    const deltaX = touchEndX - touchStartX;
    const deltaY = touchEndY - touchStartY;
    
    const goingUp = dy === -1;
    const goingDown = dy === 1;
    const goingRight = dx === 1;
    const goingLeft = dx === -1;

    if (Math.abs(deltaX) > Math.abs(deltaY)) {
        if (deltaX > 0 && !goingLeft) {
            changeDirection('ArrowRight');
        } else if (deltaX < 0 && !goingRight) {
            changeDirection('ArrowLeft');
        }
    } else {
        if (deltaY > 0 && !goingUp) {
            changeDirection('ArrowDown');
        } else if (deltaY < 0 && !goingDown) {
            changeDirection('ArrowUp');
        }
    }
    e.preventDefault();
}, false);

upBtn.addEventListener('click', () => changeDirection('ArrowUp'));
downBtn.addEventListener('click', () => changeDirection('ArrowDown'));
leftBtn.addEventListener('click', () => changeDirection('ArrowLeft'));
rightBtn.addEventListener('click', () => changeDirection('ArrowRight'));

newGameBtn.addEventListener('click', () => {
    resetGame();
    closeGameMenuHandler();
});

pauseBtn.addEventListener('click', togglePause);

restartGameBtn.addEventListener('click', resetGame);

toggleControlsBtn.addEventListener('click', () => {
    toggleControlsVisibility();
    closeGameMenuHandler();
});

difficultySelect.addEventListener('change', () => {
    const difficulty = difficultySelect.value;
    setSavedDifficulty(difficulty);
    closeGameMenuHandler();
});

// Inicializar jogo
startGameBtn.addEventListener('click', () => {
    const speed = speedSelect.value;
    setSavedDifficulty(speed);
    instructionsScreen.classList.add('hidden');
    setTutorialSeen();
    togglePause();
});

// Inicialização do jogo
const savedDifficulty = getSavedDifficulty();
difficultySelect.value = savedDifficulty;
speedSelect.value = savedDifficulty;
setSavedDifficulty(savedDifficulty);

highScoreElement.textContent = highScore;
generateFood();
resetCanvasBackground();

// Mostrar tutorial apenas na primeira vez
if (hasSeenTutorial()) {
    instructionsScreen.classList.add('hidden');
}

// Carregar visibilidade dos controles
if (!areControlsVisible()) {
    document.querySelector('.mobile-controls').classList.add('hidden');
}
toggleControlsBtn.innerHTML = areControlsVisible() ? '<i class="fas fa-eye"></i>' : '<i class="fas fa-eye-slash"></i>';

// Focar no display principal
window.addEventListener('load', () => {
    gameArea.scrollIntoView({ behavior: 'smooth', block: 'center' });
});

// Ajustar tamanho do canvas dinamicamente
window.addEventListener('resize', () => {
    canvasSize = Math.min(
        gameContainer.clientWidth - 40, // Considerar padding de 20px de cada lado
        gameContainer.clientHeight - 150, // Ajustar para caber com o score-board e controles
        400
    );
    canvas.width = canvasSize;
    canvas.height = canvasSize;
    resetCanvasBackground();
});