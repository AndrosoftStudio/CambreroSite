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

// Theme Toggle
const themeToggle = document.getElementById('themeToggle');
const body = document.body;

function toggleDarkMode() {
    body.classList.toggle('dark-mode');
    const isDark = body.classList.contains('dark-mode');
    localStorage.setItem('theme', isDark);
    themeToggle.innerHTML = isDark ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
}

themeToggle.addEventListener('click', toggleDarkMode);

// Carregar tema salvo
const savedTheme = localStorage.getItem('theme');
if (savedTheme === 'dark') {
    body.classList.add('dark-mode');
    themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
}

// Game Menu Toggle
const gameMenuToggle = document.getElementById('gameMenuToggle');
const gameMenu = document.getElementById('gameMenu');
const menuOverlay = document.getElementById('menuOverlay');
const closeGameMenu = document.getElementById('closeGameMenu');
const showHistoryBtn = document.getElementById('showHistory');
const historyTab = document.getElementById('historyTab');
const historyOverlay = document.getElementById('historyOverlay');
const closeHistoryTab = document.getElementById('closeHistoryTab');
const modeToggleBtn = document.getElementById('modeToggle');

function toggleGameMenu() {
    gameMenu.classList.toggle('active');
    menuOverlay.classList.toggle('active');
}

function closeGameMenuHandler() {
    gameMenu.classList.remove('active');
    menuOverlay.classList.remove('active');
    historyTab.classList.remove('active');
    historyOverlay.classList.remove('active');
}

function toggleHistoryTab() {
    historyTab.classList.toggle('active');
    historyOverlay.classList.toggle('active');
}

function closeHistoryTabHandler() {
    historyTab.classList.remove('active');
    historyOverlay.classList.remove('active');
}

gameMenuToggle.addEventListener('click', toggleGameMenu);
menuOverlay.addEventListener('click', closeGameMenuHandler);
closeGameMenu.addEventListener('click', closeGameMenuHandler);
showHistoryBtn.addEventListener('click', toggleHistoryTab);
historyOverlay.addEventListener('click', closeHistoryTabHandler);
closeHistoryTab.addEventListener('click', closeHistoryTabHandler);

// Load History
let history = JSON.parse(localStorage.getItem('damasHistory')) || [];
renderHistory();

class Board {
    constructor() {
        this.grid = Array(8).fill().map(() => Array(8).fill(null));
        this.currentPlayer = 'player'; // Brancas começam
        this.selectedPiece = null;
        this.captured = { player: [], ia: [] };
        this.moveCount = 0; // Contador para empate
        this.lastCaptureMove = 0; // Último movimento com captura
        this.moveHistory = []; // Histórico para detectar repetição de posições
        this.initializePieces();
    }

    initializePieces() {
        // Peças brancas (jogador) nas últimas 3 linhas (5, 6, 7)
        for (let row = 5; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                if ((row + col) % 2 === 1) {
                    this.grid[row][col] = { type: 'player', queen: false };
                }
            }
        }

        // Peças pretas (IA/Jogador 2) nas primeiras 3 linhas (0, 1, 2)
        for (let row = 0; row < 3; row++) {
            for (let col = 0; col < 8; col++) {
                if ((row + col) % 2 === 1) {
                    this.grid[row][col] = { type: 'ia', queen: false };
                }
            }
        }
    }

    getValidMoves(row, col, isChainCapture = false, chainDirection = null) {
        const moves = [];
        const captures = [];
        const piece = this.grid[row][col];
        if (!piece || piece.type !== this.currentPlayer) return { moves, captures };

        const forwardDirections = piece.type === 'player' 
            ? [[-1, -1], [-1, 1]] // Peças brancas movem para cima
            : [[1, -1], [1, 1]]; // Peças pretas movem para baixo

        const captureDirections = piece.queen 
            ? [[-1, -1], [-1, 1], [1, -1], [1, 1]] // Damas podem capturar em todas as direções
            : [...forwardDirections, ...forwardDirections.map(([dy, dx]) => [-dy, -dx])]; // Pedras podem capturar para frente e para trás

        // Capturas
        captureDirections.forEach(([dy, dx]) => {
            // Se estivermos em uma captura em cadeia, só permitimos capturas na mesma direção
            if (isChainCapture && chainDirection && (dy !== chainDirection[0] || dx !== chainDirection[1])) {
                return;
            }

            let currentRow = row;
            let currentCol = col;
            const capturedPieces = [];
            let canCapture = false;
            let lastEnemyPosition = null;

            // Verificar capturas ao longo da diagonal
            while (this.isValidPosition(currentRow + dy, currentCol + dx)) {
                currentRow += dy;
                currentCol += dx;

                const cell = this.grid[currentRow][currentCol];
                if (!cell) {
                    if (lastEnemyPosition) {
                        captures.push({
                            row: currentRow,
                            col: currentCol,
                            capture: true,
                            captured: [...capturedPieces],
                            direction: [dy, dx]
                        });
                        if (!isChainCapture) {
                            moves.push({
                                row: currentRow,
                                col: currentCol,
                                capture: true,
                                captured: [...capturedPieces],
                                direction: [dy, dx]
                            });
                        }
                    }
                    continue;
                }

                if (cell.type === piece.type) break;

                // Verificar se há duas ou mais peças inimigas juntas na mesma diagonal
                const nextRow = currentRow + dy;
                const nextCol = currentCol + dx;
                if (this.isValidPosition(nextRow, nextCol) && this.grid[nextRow][nextCol] && this.grid[nextRow][nextCol].type !== piece.type) {
                    break; // Duas peças inimigas juntas não podem ser capturadas
                }

                capturedPieces.push({ row: currentRow, col: currentCol });
                lastEnemyPosition = { row: currentRow, col: currentCol };
            }
        });

        // Movimentos simples (não capturas)
        if (!isChainCapture) {
            const moveDirections = piece.queen ? [[-1, -1], [-1, 1], [1, -1], [1, 1]] : forwardDirections;
            moveDirections.forEach(([dy, dx]) => {
                let currentRow = row;
                let currentCol = col;
                while (this.isValidPosition(currentRow + dy, currentCol + dx)) {
                    currentRow += dy;
                    currentCol += dx;
                    if (this.grid[currentRow][currentCol]) break;
                    moves.push({
                        row: currentRow,
                        col: currentCol,
                        capture: false
                    });
                    if (!piece.queen) break; // Pedras só podem se mover uma casa
                }
            });
        }

        // Capturas simultâneas (somente se alinhadas)
        captures.forEach(move => {
            const chainMoves = this.getValidMoves(move.row, move.col, true, move.direction).captures
                .map(cm => ({
                    ...cm,
                    captured: [...move.captured, ...cm.captured]
                }));
            moves.push(...chainMoves);
            captures.push(...chainMoves);
        });

        return { moves, captures };
    }

    isValidPosition(row, col) {
        return row >= 0 && row < 8 && col >= 0 && col < 8;
    }

    movePiece(fromRow, fromCol, toRow, toCol, captures) {
        const piece = this.grid[fromRow][fromCol];
        this.grid[toRow][toCol] = piece;
        this.grid[fromRow][fromCol] = null;

        if (captures) {
            captures.forEach(({ row, col }) => {
                this.captured[piece.type === 'player' ? 'ia' : 'player'].push(true);
                this.grid[row][col] = null;
            });
            this.lastCaptureMove = this.moveCount;
        }

        // Promoção a dama (só se parar na casa de coroação)
        if ((piece.type === 'player' && toRow === 0) || 
            (piece.type === 'ia' && toRow === 7)) {
            piece.queen = true;
        }

        // Verificar se há mais capturas possíveis na mesma direção
        const hasMoreCaptures = captures && captures.length > 0 
            ? this.getValidMoves(toRow, toCol, true, captures[0].direction).captures.length > 0
            : false;
        if (!hasMoreCaptures) {
            this.currentPlayer = this.currentPlayer === 'player' ? 'ia' : 'player';
        }

        this.moveCount++;
        // Adicionar posição atual ao histórico para verificar repetição
        const positionString = JSON.stringify(this.grid);
        this.moveHistory.push(positionString);
    }

    checkGameOver() {
        let playerPieces = 0;
        let iaPieces = 0;
        let playerMoves = 0;
        let iaMoves = 0;
        let playerQueens = 0;
        let iaQueens = 0;
        let stoneMoves = 0;

        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const piece = this.grid[row][col];
                if (piece) {
                    if (piece.type === 'player') {
                        playerPieces++;
                        if (piece.queen) playerQueens++;
                        else stoneMoves++;
                        if (piece.type === this.currentPlayer) {
                            const { moves } = this.getValidMoves(row, col);
                            playerMoves += moves.length;
                        }
                    } else if (piece.type === 'ia') {
                        iaPieces++;
                        if (piece.queen) iaQueens++;
                        else stoneMoves++;
                        if (piece.type === this.currentPlayer) {
                            const { moves } = this.getValidMoves(row, col);
                            iaMoves += moves.length;
                        }
                    }
                }
            }
        }

        // Verificar empate por repetição de posição (3 vezes)
        const positionCounts = {};
        this.moveHistory.forEach(pos => {
            positionCounts[pos] = (positionCounts[pos] || 0) + 1;
            if (positionCounts[pos] >= 3) {
                return 'draw';
            }
        });

        // Verificar empate após 20 lances sucessivos de damas sem captura ou movimento de pedras
        if (playerPieces === playerQueens && iaPieces === iaQueens && stoneMoves === 0 && this.moveCount - this.lastCaptureMove >= 20) {
            return 'draw';
        }

        // Condições de empate específicas após 5 lances
        if (this.moveCount - this.lastCaptureMove >= 5) {
            if ((playerQueens === 2 && iaQueens === 2) ||
                (playerQueens === 2 && iaQueens === 1) ||
                (playerQueens === 1 && iaQueens === 2) ||
                (playerQueens === 1 && iaQueens === 1)) {
                return 'draw';
            }
        }

        if (playerPieces === 0 || (this.currentPlayer === 'player' && playerMoves === 0)) return 'ia';
        if (iaPieces === 0 || (this.currentPlayer === 'ia' && iaMoves === 0)) return 'player';
        return null;
    }

    getAllPossibleMoves() {
        const moves = [];
        const captures = [];

        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const piece = this.grid[row][col];
                if (piece && piece.type === this.currentPlayer) {
                    const { moves: pieceMoves, captures: pieceCaptures } = this.getValidMoves(row, col);
                    pieceMoves.forEach(move => {
                        if (move.capture) {
                            captures.push({ from: { row, col }, to: move });
                        } else {
                            moves.push({ from: { row, col }, to: move });
                        }
                    });
                }
            }
        }

        return { moves, captures };
    }
}

class Game {
    constructor() {
        this.mode = localStorage.getItem('damasMode') || 'vsIA'; // Modo: 'vsIA' ou 'vsPlayer'
        this.board = new Board();
        this.wins = JSON.parse(localStorage.getItem('damasWins')) || { player: 0, ia: 0 };
        this.isGameOver = false;
        this.render();
        this.addClickListeners();
        this.updateCaptured();
        this.setupResizeListener();

        // Reiniciar Partida
        document.getElementById('restartGame').addEventListener('click', () => {
            this.isGameOver = false;
            this.board = new Board();
            this.render();
            this.updateCaptured();
            document.getElementById('gameOver').style.display = 'none';

            // Iniciar o turno da IA se for o primeiro jogador e modo vs IA
            if (this.board.currentPlayer === 'ia' && this.mode === 'vsIA') {
                setTimeout(() => this.makeAIMove(), 1000);
            }
        });

        // Fechar Modal de Game Over
        document.getElementById('closeGameOver').addEventListener('click', () => {
            document.getElementById('gameOver').style.display = 'none';
            this.isGameOver = false;
            this.board = new Board();
            this.render();
            this.updateCaptured();

            // Iniciar o turno da IA se for o primeiro jogador e modo vs IA
            if (this.board.currentPlayer === 'ia' && this.mode === 'vsIA') {
                setTimeout(() => this.makeAIMove(), 1000);
            }
        });

        // Alternar Modo
        modeToggleBtn.addEventListener('click', () => {
            this.mode = this.mode === 'vsIA' ? 'vsPlayer' : 'vsIA';
            localStorage.setItem('damasMode', this.mode);
            modeToggleBtn.textContent = `Mudar Modo (${this.mode === 'vsIA' ? 'Jogador vs IA' : 'Jogador vs Jogador'})`;
            this.isGameOver = false;
            this.board = new Board();
            this.render();
            this.updateCaptured();
            document.getElementById('gameOver').style.display = 'none';

            // Iniciar o turno da IA se for o primeiro jogador e modo vs IA
            if (this.board.currentPlayer === 'ia' && this.mode === 'vsIA') {
                setTimeout(() => this.makeAIMove(), 1000);
            }
        });

        // Definir texto inicial do botão de modo
        modeToggleBtn.textContent = `Mudar Modo (${this.mode === 'vsIA' ? 'Jogador vs IA' : 'Jogador vs Jogador'})`;

        // Iniciar o turno da IA se for o primeiro jogador e modo vs IA
        if (this.board.currentPlayer === 'ia' && this.mode === 'vsIA') {
            setTimeout(() => this.makeAIMove(), 1000);
        }
    }

    setupResizeListener() {
        window.addEventListener('resize', () => this.handleResize());
        this.handleResize();
    }

    handleResize() {
        const boardElement = document.getElementById('board');
        const size = Math.min(window.innerWidth * 0.9, window.innerHeight * 0.5, 400);
        boardElement.style.width = `${size}px`;
        boardElement.style.height = `${size}px`;
    }

    render() {
        const boardElement = document.getElementById('board');
        boardElement.innerHTML = '';

        const cellSize = boardElement.offsetWidth / 8;

        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const cell = document.createElement('div');
                cell.className = `cell ${(row + col) % 2 === 0 ? 'white' : 'black'}`;
                cell.style.width = `${cellSize}px`;
                cell.style.height = `${cellSize}px`;

                if (this.board.grid[row][col]) {
                    const piece = document.createElement('div');
                    piece.className = `piece ${this.board.grid[row][col].type}`;
                    if (this.board.grid[row][col].queen) {
                        piece.classList.add('queen');
                    }
                    cell.appendChild(piece);
                }

                if (this.board.selectedPiece?.row === row && this.board.selectedPiece?.col === col) {
                    cell.classList.add('selected');
                }

                cell.dataset.row = row;
                cell.dataset.col = col;
                boardElement.appendChild(cell);
            }
        }

        if (this.board.selectedPiece) {
            const { moves } = this.board.getValidMoves(
                this.board.selectedPiece.row,
                this.board.selectedPiece.col
            );

            moves.forEach(move => {
                const cell = document.querySelector(
                    `[data-row="${move.row}"][data-col="${move.col}"]`
                );
                if (cell) {
                    cell.classList.add(move.capture ? 'valid-capture' : 'valid-move');
                }
            });
        }

        // Atualizar indicadores de turno
        const iaTurn = document.getElementById('iaTurn');
        const playerTurn = document.getElementById('playerTurn');
        if (this.board.currentPlayer === 'ia') {
            iaTurn.classList.add('active');
            playerTurn.classList.remove('active');
        } else {
            playerTurn.classList.add('active');
            iaTurn.classList.remove('active');
        }

        this.updateCaptured();
    }

    updateCaptured() {
        const renderCaptured = (type, elementId) => {
            const container = document.getElementById(elementId);
            container.innerHTML = this.board.captured[type]
                .map(() => `<div class="captured-piece ${type === 'player' ? 'ia' : 'player'}"></div>`)
                .join('');
        };

        renderCaptured('player', 'captured-player');
        renderCaptured('ia', 'captured-ia');
    }

    addClickListeners() {
        document.getElementById('board').addEventListener('click', (e) => {
            if (this.isGameOver) return;

            const cell = e.target.closest('.cell');
            if (!cell) return;

            const row = parseInt(cell.dataset.row);
            const col = parseInt(cell.dataset.col);

            if (this.board.grid[row][col]?.type === this.board.currentPlayer) {
                this.board.selectedPiece = { row, col };
                this.render();
            } else if (this.board.selectedPiece) {
                const { moves, captures } = this.board.getValidMoves(
                    this.board.selectedPiece.row, 
                    this.board.selectedPiece.col
                );

                const move = moves.find(m => m.row === row && m.col === col);
                if (move) {
                    // Captura obrigatória
                    if (captures.length > 0 && !move.capture) {
                        alert("Captura obrigatória! Você deve capturar uma peça do oponente.");
                        return;
                    }
                    this.handleMove(move);
                }
            }
        });
    }

    handleMove(move) {
        const fromRow = this.board.selectedPiece.row;
        const fromCol = this.board.selectedPiece.col;

        const pieceElement = document.querySelector(`[data-row="${fromRow}"][data-col="${fromCol}"] .piece`);
        const targetCell = document.querySelector(`[data-row="${move.row}"][data-col="${move.col}"]`);

        if (move.capture) {
            playCaptureSound();
            const capturedCells = move.captured.map(pos => document.querySelector(`[data-row="${pos.row}"][data-col="${pos.col}"] .piece`));
            capturedCells.forEach(cell => {
                if (cell) {
                    cell.classList.add('captured-animation');
                }
            });

            setTimeout(() => {
                this.animateMove(pieceElement, targetCell, () => {
                    this.board.movePiece(fromRow, fromCol, move.row, move.col, move.captured);
                    this.board.selectedPiece = null;
                    this.render();
                    this.updateCaptured();

                    const winner = this.board.checkGameOver();
                    if (winner) {
                        this.showGameOver(winner);
                        return;
                    }

                    if (this.board.currentPlayer === 'ia' && this.mode === 'vsIA') {
                        setTimeout(() => this.makeAIMove(), 1000);
                    }
                });
            }, capturedCells.length * 200);
        } else {
            playMoveSound();
            this.animateMove(pieceElement, targetCell, () => {
                this.board.movePiece(fromRow, fromCol, move.row, move.col, move.captured);
                this.board.selectedPiece = null;
                this.render();
                this.updateCaptured();

                const winner = this.board.checkGameOver();
                if (winner) {
                    this.showGameOver(winner);
                    return;
                }

                if (this.board.currentPlayer === 'ia' && this.mode === 'vsIA') {
                    setTimeout(() => this.makeAIMove(), 1000);
                }
            });
        }
    }

    animateMove(pieceElement, targetCell, callback) {
        if (!pieceElement || !targetCell) {
            callback();
            return;
        }

        const pieceRect = pieceElement.getBoundingClientRect();
        const targetRect = targetCell.getBoundingClientRect();
        const deltaX = targetRect.left - pieceRect.left;
        const deltaY = targetRect.top - pieceRect.top;

        pieceElement.style.transition = 'transform 0.5s ease-in-out';
        pieceElement.style.transform = `translate(${deltaX}px, ${deltaY}px)`;

        setTimeout(callback, 500);
    }

    showGameOver(winner) {
        const gameOverTitle = document.getElementById('gameOverTitle');
        const gameOverMessage = document.getElementById('gameOverMessage');
        const gameOverScreen = document.getElementById('gameOver');
        let message = '';

        if (winner === 'player') {
            this.wins.player++;
            message = this.mode === 'vsIA' ? 'Você venceu! Parabéns!' : 'Jogador 1 (Brancas) venceu!';
        } else if (winner === 'ia') {
            this.wins.ia++;
            message = this.mode === 'vsIA' ? 'A IA venceu! Tente novamente!' : 'Jogador 2 (Pretas) venceu!';
        } else {
            message = 'Empate!';
        }

        gameOverTitle.textContent = 'Fim de Jogo';
        gameOverMessage.textContent = message;
        gameOverScreen.style.display = 'flex';
        this.isGameOver = true;

        // Save wins to cookies
        localStorage.setItem('damasWins', JSON.stringify(this.wins));

        // Add to history
        const historyEntry = {
            winner: winner === 'player' ? (this.mode === 'vsIA' ? 'Jogador' : 'Jogador 1 (Brancas)') : (this.mode === 'vsIA' ? 'IA' : 'Jogador 2 (Pretas)'),
            capturedPlayer: this.board.captured.player.length,
            capturedIA: this.board.captured.ia.length,
            timestamp: new Date().toISOString()
        };
        history.push(historyEntry);
        localStorage.setItem('damasHistory', JSON.stringify(history));
        renderHistory();
    }

    makeAIMove() {
        if (this.isGameOver) return;
        if (this.mode !== 'vsIA') return;

        let moves = [];
        let captureMoves = [];

        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                if (this.board.grid[row][col]?.type === 'ia') {
                    const { moves: pieceMoves, captures: pieceCaptures } = this.board.getValidMoves(row, col);
                    pieceMoves.forEach(move => {
                        if (move.capture) {
                            captureMoves.push({ 
                                from: { row, col }, 
                                to: move,
                                priority: move.captured.length * 100
                            });
                        } else {
                            moves.push({ 
                                from: { row, col }, 
                                to: move,
                                priority: 0
                            });
                        }
                    });
                }
            }
        }

        captureMoves.sort((a, b) => b.priority - a.priority);
        const bestMove = captureMoves.length > 0 ? captureMoves[0] : moves[0];

        if (bestMove) {
            const pieceElement = document.querySelector(`[data-row="${bestMove.from.row}"][data-col="${bestMove.from.col}"] .piece`);
            const targetCell = document.querySelector(`[data-row="${bestMove.to.row}"][data-col="${bestMove.to.col}"]`);

            if (bestMove.to.capture) {
                playCaptureSound();
                const capturedCells = bestMove.to.captured.map(pos => document.querySelector(`[data-row="${pos.row}"][data-col="${pos.col}"] .piece`));
                capturedCells.forEach(cell => {
                    if (cell) {
                        cell.classList.add('captured-animation');
                    }
                });

                setTimeout(() => {
                    this.animateMove(pieceElement, targetCell, () => {
                        this.board.movePiece(
                            bestMove.from.row,
                            bestMove.from.col,
                            bestMove.to.row,
                            bestMove.to.col,
                            bestMove.to.captured
                        );
                        this.board.selectedPiece = null;
                        this.render();
                        this.updateCaptured();

                        const winner = this.board.checkGameOver();
                        if (winner) {
                            this.showGameOver(winner);
                            return;
                        }

                        if (this.board.currentPlayer === 'ia' && this.mode === 'vsIA') {
                            setTimeout(() => this.makeAIMove(), 1000);
                        }
                    });
                }, capturedCells.length * 200);
            } else {
                playMoveSound();
                this.animateMove(pieceElement, targetCell, () => {
                    this.board.movePiece(
                        bestMove.from.row,
                        bestMove.from.col,
                        bestMove.to.row,
                        bestMove.to.col,
                        bestMove.to.captured
                    );
                    this.board.selectedPiece = null;
                    this.render();
                    this.updateCaptured();

                    const winner = this.board.checkGameOver();
                    if (winner) {
                        this.showGameOver(winner);
                        return;
                    }

                    if (this.board.currentPlayer === 'ia' && this.mode === 'vsIA') {
                        setTimeout(() => this.makeAIMove(), 1000);
                    }
                });
            }
        } else {
            this.board.currentPlayer = 'player';
            this.render();
        }
    }
}

function renderHistory() {
    const historyList = document.getElementById('historyList');
    historyList.innerHTML = '';
    history.forEach((entry, index) => {
        const historyItem = document.createElement('div');
        historyItem.classList.add('history-item');
        historyItem.innerHTML = `
            <strong>Partida ${index + 1} (${new Date(entry.timestamp).toLocaleDateString('pt-BR')}):</strong><br>
            Vencedor: ${entry.winner}<br>
            Peças Capturadas (Jogador): ${entry.capturedPlayer}<br>
            Peças Capturadas (IA): ${entry.capturedIA}
        `;
        historyList.appendChild(historyItem);
    });
}

function clearHistory() {
    history = [];
    localStorage.removeItem('damasHistory');
    renderHistory();
}

new Game();