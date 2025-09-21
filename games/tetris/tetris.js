document.addEventListener('DOMContentLoaded', function() {
    const grid = document.querySelector('#grid');
    const scoreDisplay = document.querySelector('#score');
    const startBtn = document.querySelector('#start-button');
    const pauseBtn = document.querySelector('#pause-button');
    const restartBtn = document.querySelector('#restart-button');
    const themeToggle = document.querySelector('#theme-toggle');
    const gameMenuToggle = document.querySelector('#gameMenuToggle');
    const gameMenu = document.querySelector('#gameMenu');
    const closeGameMenu = document.querySelector('#closeGameMenu');
    const highScoreDisplay = document.querySelector('#high-score');
    const totalLinesDisplay = document.querySelector('#total-lines');
    const gamesPlayedDisplay = document.querySelector('#games-played');
    const maxTimeDisplay = document.querySelector('#max-time');
    const gameOverScreen = document.querySelector('#gameOver');
    const finalScoreDisplay = document.querySelector('#finalScore');
    const finalHighScoreDisplay = document.querySelector('#finalHighScore');
    const finalLinesDisplay = document.querySelector('#finalLines');
    const finalGameTimeDisplay = document.querySelector('#finalGameTime');
    const closeGameOverBtn = document.querySelector('#closeGameOver');
    const controls = document.querySelector('#controls');
    const controlsToggle = document.querySelector('#controlsToggle');
    const width = 10;
    let squares = [];
    let currentPosition = 4;
    let currentRotation = 0;
    let score = 0;
    let timerId = null;
    let isPaused = true;
    let linesCleared = 0;
    let gamesPlayed = 0;
    let gameStartTime = 0;
    let maxGameTime = 0;
    let dropInterval = 1000;

    // Menu Principal
    const navToggle = document.getElementById('navToggle');
    const navMenu = document.getElementById('navMenu');
    const navOverlay = document.getElementById('navOverlay');

    function toggleNavMenu() {
        navMenu.classList.toggle('active');
        navOverlay.classList.toggle('active');
    }

    navToggle.addEventListener('click', toggleNavMenu);
    navOverlay.addEventListener('click', toggleNavMenu);

    // Menu do Jogo
    function toggleGameMenu() {
        gameMenu.classList.toggle('active');
        console.log('Menu toggled:', gameMenu.classList.contains('active'));
    }

    gameMenuToggle.addEventListener('click', toggleGameMenu);
    closeGameMenu.addEventListener('click', toggleGameMenu);

    // Theme Toggle
    const body = document.body;
    themeToggle.addEventListener('click', function() {
        body.classList.toggle('dark-mode');
        themeToggle.innerHTML = body.classList.contains('dark-mode') ? 
            '<i class="fas fa-sun"></i> Modo Claro' : '<i class="fas fa-moon"></i> Modo Escuro';
        localStorage.setItem('theme', body.classList.contains('dark-mode') ? 'dark' : 'light');
    });

    if (localStorage.getItem('theme') === 'dark') {
        body.classList.add('dark-mode');
        themeToggle.innerHTML = '<i class="fas fa-sun"></i> Modo Claro';
    }

    // Funções de Cookies
    function getCookie(name) {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return parts.pop().split(';').shift();
        return null;
    }

    function setCookie(name, value, days) {
        const date = new Date();
        date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
        const expires = `expires=${date.toUTCString()}`;
        document.cookie = `${name}=${value};${expires};path=/`;
    }

    // Carregar recordes dos cookies
    let highScore = parseInt(getCookie('highScore')) || 0;
    let totalLines = parseInt(getCookie('totalLines')) || 0;
    let savedGamesPlayed = parseInt(getCookie('gamesPlayed')) || 0;
    let savedMaxGameTime = parseInt(getCookie('maxGameTime')) || 0;

    highScoreDisplay.textContent = highScore;
    totalLinesDisplay.textContent = totalLines;
    gamesPlayedDisplay.textContent = savedGamesPlayed;
    maxTimeDisplay.textContent = formatTime(savedMaxGameTime);

    gamesPlayed = savedGamesPlayed;
    maxGameTime = savedMaxGameTime;

    function saveGameStats() {
        setCookie('highScore', highScore, 365);
        setCookie('totalLines', totalLines, 365);
        setCookie('gamesPlayed', gamesPlayed, 365);
        setCookie('maxGameTime', maxGameTime, 365);
        setCookie('currentScore', score, 365);
        setCookie('currentLines', linesCleared, 365);
        highScoreDisplay.textContent = highScore;
        totalLinesDisplay.textContent = totalLines;
        gamesPlayedDisplay.textContent = gamesPlayed;
        maxTimeDisplay.textContent = formatTime(maxGameTime);
    }

    // Controle dos botões de setas via toggler
    let showControls = getCookie('showControls') === 'true';
    controlsToggle.checked = showControls;
    if (showControls) {
        controls.classList.add('visible');
    }

    controlsToggle.addEventListener('change', function() {
        showControls = controlsToggle.checked;
        setCookie('showControls', showControls, 365);
        if (showControls) {
            controls.classList.add('visible');
        } else {
            controls.classList.remove('visible');
        }
    });

    // Criar o grid (20 linhas x 10 colunas = 200 células + 10 células "taken" na base)
    for (let i = 0; i < 200; i++) {
        const square = document.createElement('div');
        grid.appendChild(square);
        squares.push(square);
    }
    for (let i = 0; i < 10; i++) {
        const square = document.createElement('div');
        square.classList.add('taken');
        grid.appendChild(square);
        squares.push(square);
    }

    // Tetrominós
    const lTetromino = [
        [1, width + 1, width * 2 + 1, 2],
        [width, width + 1, width + 2, width * 2 + 2],
        [1, width + 1, width * 2 + 1, width * 2],
        [width, width * 2, width * 2 + 1, width * 2 + 2]
    ];

    const zTetromino = [
        [0, width, width + 1, width * 2 + 1],
        [width + 1, width + 2, width * 2, width * 2 + 1],
        [0, width, width + 1, width * 2 + 1],
        [width + 1, width + 2, width * 2, width * 2 + 1]
    ];

    const tTetromino = [
        [1, width, width + 1, width + 2],
        [1, width + 1, width + 2, width * 2 + 1],
        [width, width + 1, width + 2, width * 2 + 1],
        [1, width, width + 1, width * 2 + 1]
    ];

    const oTetromino = [
        [0, 1, width, width + 1],
        [0, 1, width, width + 1],
        [0, 1, width, width + 1],
        [0, 1, width, width + 1]
    ];

    const iTetromino = [
        [1, width + 1, width * 2 + 1, width * 3 + 1],
        [width, width + 1, width + 2, width + 3],
        [1, width + 1, width * 2 + 1, width * 3 + 1],
        [width, width + 1, width + 2, width + 3]
    ];

    const theTetrominoes = [lTetromino, zTetromino, tTetromino, oTetromino, iTetromino];
    let random = Math.floor(Math.random() * theTetrominoes.length);
    let current = theTetrominoes[random][currentRotation];

    function draw() {
        current.forEach(index => {
            if (squares[currentPosition + index]) {
                squares[currentPosition + index].classList.add('tetromino');
            } else {
                console.error('Invalid square index:', currentPosition + index);
            }
        });
        console.log('Tetromino drawn at position:', currentPosition);
    }

    function undraw() {
        current.forEach(index => {
            if (squares[currentPosition + index]) {
                squares[currentPosition + index].classList.remove('tetromino');
            }
        });
    }

    function moveDown() {
        if (!isPaused) {
            undraw();
            currentPosition += width;
            draw();
            freeze();
            saveGameStats();
        }
    }

    function moveLeft() {
        if (!isPaused) {
            undraw();
            const isAtLeftEdge = current.some(index => (currentPosition + index) % width === 0);
            if (!isAtLeftEdge) currentPosition -= 1;
            if (current.some(index => squares[currentPosition + index] && squares[currentPosition + index].classList.contains('taken'))) {
                currentPosition += 1;
            }
            draw();
            console.log('Moved left to position:', currentPosition);
        }
    }

    function moveRight() {
        if (!isPaused) {
            undraw();
            const isAtRightEdge = current.some(index => (currentPosition + index) % width === width - 1);
            if (!isAtRightEdge) currentPosition += 1;
            if (current.some(index => squares[currentPosition + index] && squares[currentPosition + index].classList.contains('taken'))) {
                currentPosition -= 1;
            }
            draw();
            console.log('Moved right to position:', currentPosition);
        }
    }

    function rotate() {
        if (!isPaused) {
            undraw();
            currentRotation++;
            if (currentRotation === current.length) {
                currentRotation = 0;
            }
            current = theTetrominoes[random][currentRotation];
            checkRotationCollision();
            draw();
            console.log('Rotated to rotation:', currentRotation);
        }
    }

    function checkRotationCollision() {
        const maxIndex = width * 20; // 20 linhas
        if (current.some(index => {
            const newIndex = currentPosition + index;
            return newIndex < 0 || newIndex >= squares.length || squares[newIndex].classList.contains('taken') || (newIndex % width < 0 || newIndex % width >= width);
        })) {
            currentRotation--;
            if (currentRotation < 0) currentRotation = current.length - 1;
            current = theTetrominoes[random][currentRotation];
        }
    }

    function freeze() {
        if (current.some(index => {
            const newIndex = currentPosition + index + width;
            return newIndex >= squares.length || (squares[newIndex] && squares[newIndex].classList.contains('taken'));
        })) {
            current.forEach(index => {
                if (squares[currentPosition + index]) {
                    squares[currentPosition + index].classList.add('taken');
                }
            });
            random = Math.floor(Math.random() * theTetrominoes.length);
            current = theTetrominoes[random][currentRotation];
            currentPosition = 4;
            draw();
            addScore();
            gameOver();
        }
    }

    function addScore() {
        for (let i = 0; i < 199; i += width) {
            const row = [i, i + 1, i + 2, i + 3, i + 4, i + 5, i + 6, i + 7, i + 8, i + 9];
            if (row.every(index => squares[index] && squares[index].classList.contains('taken'))) {
                score += 10;
                linesCleared += 1;
                totalLines += 1;
                scoreDisplay.textContent = `Pontuação: ${score}`;
                row.forEach(index => {
                    if (squares[index]) {
                        squares[index].classList.remove('taken');
                        squares[index].classList.remove('tetromino');
                    }
                });
                const squaresRemoved = squares.splice(i, width);
                squares = squaresRemoved.concat(squares);
                squares.forEach(cell => grid.appendChild(cell));
                dropInterval = Math.max(100, dropInterval - 20);
                if (timerId) {
                    clearInterval(timerId);
                    timerId = setInterval(moveDown, dropInterval);
                }
                if (score > highScore) {
                    highScore = score;
                    saveGameStats();
                }
            }
        }
    }

    function gameOver() {
        if (current.some(index => squares[currentPosition + index] && squares[currentPosition + index].classList.contains('taken'))) {
            scoreDisplay.textContent = 'Fim de Jogo';
            clearInterval(timerId);
            timerId = null;
            pauseBtn.style.display = 'none';
            restartBtn.style.display = 'inline-block';
            gamesPlayed++;
            const gameTime = Math.floor((Date.now() - gameStartTime) / 1000);
            if (gameTime > maxGameTime) {
                maxGameTime = gameTime;
            }
            if (score > highScore) {
                highScore = score;
            }
            saveGameStats();
            showGameOver(gameTime);
        }
    }

    function showGameOver(gameTime) {
        finalScoreDisplay.textContent = score;
        finalHighScoreDisplay.textContent = highScore;
        finalLinesDisplay.textContent = linesCleared;
        finalGameTimeDisplay.textContent = formatTime(gameTime);
        gameOverScreen.style.display = 'flex';
    }

    function formatTime(seconds) {
        const minutes = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${minutes}m ${secs}s`;
    }

    document.addEventListener('keydown', function(e) {
        if (timerId && !isPaused) {
            switch(e.key.toLowerCase()) {
                case 'arrowleft':
                case 'a': moveLeft(); break;
                case 'arrowright':
                case 'd': moveRight(); break;
                case 'arrowdown':
                case 's': moveDown(); break;
                case 'r': rotate(); break;
            }
        }
    });

    navigator.getGamepads = navigator.getGamepads || navigator.webkitGetGamepads || navigator.mozGetGamepads;
    function checkGamepad() {
        const gamepads = navigator.getGamepads();
        if (gamepads[0] && timerId && !isPaused) {
            const gp = gamepads[0];
            if (gp.buttons[14].pressed || gp.axes[0] < -0.5) moveLeft();
            if (gp.buttons[15].pressed || gp.axes[0] > 0.5) moveRight();
            if (gp.buttons[13].pressed || gp.axes[1] > 0.5) moveDown();
            if (gp.buttons[0].pressed) rotate();
        }
        requestAnimationFrame(checkGamepad);
    }
    requestAnimationFrame(checkGamepad);

    startBtn.addEventListener('click', function() {
        draw();
        gameStartTime = Date.now();
        dropInterval = 1000;
        startBtn.style.display = 'none';
        pauseBtn.style.display = 'inline-block';
        pauseBtn.textContent = 'Continuar';
        restartBtn.style.display = 'inline-block';
        linesCleared = 0;
        score = 0;
        scoreDisplay.textContent = `Pontuação: ${score}`;
        isPaused = true;
        console.log('Start clicked - isPaused:', isPaused, 'timerId:', timerId);
    });

    pauseBtn.addEventListener('click', function() {
        if (isPaused) {
            timerId = setInterval(moveDown, dropInterval);
            pauseBtn.textContent = 'Pausar';
            isPaused = false;
        } else {
            clearInterval(timerId);
            timerId = null;
            pauseBtn.textContent = 'Continuar';
            isPaused = true;
            saveGameStats();
        }
        console.log('Pause clicked - isPaused:', isPaused, 'timerId:', timerId);
    });

    restartBtn.addEventListener('click', function() {
        clearInterval(timerId);
        timerId = null;
        squares.forEach(square => {
            square.classList.remove('tetromino', 'taken');
        });
        for (let i = 200; i < 210; i++) {
            squares[i].classList.add('taken');
        }
        score = 0;
        scoreDisplay.textContent = `Pontuação: ${score}`;
        currentPosition = 4;
        currentRotation = 0;
        random = Math.floor(Math.random() * theTetrominoes.length);
        current = theTetrominoes[random][currentRotation];
        draw();
        gameStartTime = Date.now();
        dropInterval = 1000;
        pauseBtn.style.display = 'inline-block';
        pauseBtn.textContent = 'Continuar';
        isPaused = true;
        console.log('Restart clicked - isPaused:', isPaused, 'timerId:', timerId);
    });

    closeGameOverBtn.addEventListener('click', function() {
        gameOverScreen.style.display = 'none';
    });

    window.addEventListener('beforeunload', function() {
        if (score > highScore || timerId) {
            saveGameStats();
        }
    });

    let lastScrollY = 0;
    window.addEventListener('scroll', function() {
        const gameHeader = document.getElementById('gameHeader');
        const currentScrollY = window.scrollY;
        if (currentScrollY < lastScrollY) {
            gameHeader.classList.add('visible');
        } else {
            gameHeader.classList.remove('visible');
        }
        lastScrollY = currentScrollY;
    });

    document.querySelectorAll('.control-btn').forEach(button => {
        button.addEventListener('touchstart', function(e) {
            e.preventDefault();
            if (timerId && !isPaused) {
                const action = button.getAttribute('onclick');
                if (action === 'moveLeft()') moveLeft();
                if (action === 'moveRight()') moveRight();
                if (action === 'rotate()') rotate();
                if (action === 'moveDown()') moveDown();
                console.log('Control button touched:', action);
            }
        });
        button.addEventListener('click', function(e) {
            e.preventDefault();
            if (timerId && !isPaused) {
                const action = button.getAttribute('onclick');
                if (action === 'moveLeft()') moveLeft();
                if (action === 'moveRight()') moveRight();
                if (action === 'rotate()') rotate();
                if (action === 'moveDown()') moveDown();
                console.log('Control button clicked:', action);
            }
        });
    });
});