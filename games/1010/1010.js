// 1010 Block Puzzle Game Module

let game1010 = null;

export function init() {
    const gameContent = document.getElementById('game-content');
    gameContent.innerHTML = `
        <button class="back-button-tetris" onclick="window.location.href='https://hakonag.github.io/boredgames/'">
            <i data-lucide="house"></i> Tilbake
        </button>
        <div class="game-1010-wrap">
            <div class="game-1010-main">
                <div class="game-1010-header">
                    <h1>1010!</h1>
                    <div class="game-1010-stats">
                        <div class="stat-box">
                            <div class="stat-label">Score</div>
                            <div class="stat-value" id="score-1010">0</div>
                        </div>
                        <div class="stat-box">
                            <div class="stat-label">Linjer</div>
                            <div class="stat-value" id="lines-1010">0</div>
                        </div>
                    </div>
                </div>
                <div class="game-1010-board" id="board-1010"></div>
                <div class="game-1010-pieces" id="pieces-1010"></div>
                <div class="game-1010-controls">
                    <button onclick="window.newGame1010()" class="btn-primary">
                        <i data-lucide="refresh-cw"></i> Nytt spill
                    </button>
                </div>
            </div>
        </div>
    `;

    injectStyles();
    if (typeof lucide !== 'undefined') lucide.createIcons();
    
    // Prevent wheel scrolling
    const preventScroll = (e) => {
        e.preventDefault();
        return false;
    };
    window.addEventListener('wheel', preventScroll, { passive: false });
    window.addEventListener('touchmove', preventScroll, { passive: false });
    window.game1010ScrollPrevent = { wheel: preventScroll, touchmove: preventScroll };
    
    game1010 = new Game1010();
    window.game1010 = game1010;
    window.newGame1010 = () => game1010.newGame();
}

export function cleanup() {
    if (game1010) {
        game1010.removeControls();
        game1010 = null;
    }
    // Remove scroll prevention
    if (window.game1010ScrollPrevent) {
        window.removeEventListener('wheel', window.game1010ScrollPrevent.wheel);
        window.removeEventListener('touchmove', window.game1010ScrollPrevent.touchmove);
        delete window.game1010ScrollPrevent;
    }
    const styleEl = document.getElementById('game-1010-style');
    if (styleEl) styleEl.remove();
}

class Game1010 {
    constructor() {
        this.size = 10;
        this.board = [];
        this.score = 0;
        this.lines = 0;
        this.selectedPiece = null;
        this.dragOffset = { x: 0, y: 0 };
        this.pieces = [];
        this.setupControls();
        this.newGame();
    }

    newGame() {
        this.board = Array(this.size).fill().map(() => Array(this.size).fill(0));
        this.score = 0;
        this.lines = 0;
        this.generatePieces();
        this.updateDisplay();
    }

    generatePieces() {
        const shapes = [
            [[1]],
            [[1, 1]],
            [[1, 1, 1]],
            [[1, 1], [1]],
            [[1, 1, 1, 1]],
            [[1, 1, 1], [1]],
            [[1, 1, 1], [1, 1]],
            [[1, 1, 1, 1, 1]],
            [[1, 1, 1], [1, 1, 1]],
            [[1], [1], [1], [1], [1]],
            [[1, 1], [1, 1], [1]],
            [[1, 1, 1], [1], [1]],
        ];
        this.pieces = [];
        for (let i = 0; i < 3; i++) {
            const shape = shapes[Math.floor(Math.random() * shapes.length)];
            this.pieces.push({
                shape: shape,
                id: `piece-${i}`,
                placed: false
            });
        }
    }

    placePiece(pieceId, row, col) {
        const piece = this.pieces.find(p => p.id === pieceId);
        if (!piece || piece.placed) return false;

        // Check if piece can fit
        for (let i = 0; i < piece.shape.length; i++) {
            for (let j = 0; j < piece.shape[i].length; j++) {
                if (piece.shape[i][j] === 1) {
                    const r = row + i;
                    const c = col + j;
                    if (r < 0 || r >= this.size || c < 0 || c >= this.size || this.board[r][c] !== 0) {
                        return false;
                    }
                }
            }
        }

        // Place piece
        for (let i = 0; i < piece.shape.length; i++) {
            for (let j = 0; j < piece.shape[i].length; j++) {
                if (piece.shape[i][j] === 1) {
                    this.board[row + i][col + j] = 1;
                }
            }
        }

        piece.placed = true;
        this.score += piece.shape.flat().filter(x => x === 1).length * 10;
        this.clearLines();
        this.updateDisplay();

        // Check if game over
        if (this.pieces.every(p => p.placed)) {
            this.generatePieces();
        }

        // Check if no moves possible
        if (!this.canPlaceAnyPiece()) {
            setTimeout(() => {
                alert('Spill over! Ingen flere trekk mulig.');
                this.newGame();
            }, 100);
        }

        return true;
    }

    canPlaceAnyPiece() {
        for (const piece of this.pieces) {
            if (piece.placed) continue;
            for (let i = 0; i <= this.size - piece.shape.length; i++) {
                for (let j = 0; j <= this.size - piece.shape[0].length; j++) {
                    let canPlace = true;
                    for (let r = 0; r < piece.shape.length; r++) {
                        for (let c = 0; c < piece.shape[r].length; c++) {
                            if (piece.shape[r][c] === 1 && this.board[i + r][j + c] !== 0) {
                                canPlace = false;
                                break;
                            }
                        }
                        if (!canPlace) break;
                    }
                    if (canPlace) return true;
                }
            }
        }
        return false;
    }

    clearLines() {
        let cleared = 0;

        // Check rows
        for (let i = 0; i < this.size; i++) {
            if (this.board[i].every(cell => cell === 1)) {
                this.board[i] = Array(this.size).fill(0);
                cleared++;
            }
        }

        // Check columns
        for (let j = 0; j < this.size; j++) {
            if (this.board.every(row => row[j] === 1)) {
                for (let i = 0; i < this.size; i++) {
                    this.board[i][j] = 0;
                }
                cleared++;
            }
        }

        if (cleared > 0) {
            this.lines += cleared;
            this.score += cleared * 100;
        }
    }

    updateDisplay() {
        const boardEl = document.getElementById('board-1010');
        const piecesEl = document.getElementById('pieces-1010');
        const scoreEl = document.getElementById('score-1010');
        const linesEl = document.getElementById('lines-1010');

        if (scoreEl) scoreEl.textContent = this.score.toLocaleString();
        if (linesEl) linesEl.textContent = this.lines.toLocaleString();

        // Update board
        if (boardEl) {
            boardEl.innerHTML = '';
            for (let i = 0; i < this.size; i++) {
                for (let j = 0; j < this.size; j++) {
                    const cell = document.createElement('div');
                    cell.className = `cell-1010 ${this.board[i][j] === 1 ? 'filled' : ''}`;
                    cell.dataset.row = i;
                    cell.dataset.col = j;
                    boardEl.appendChild(cell);
                }
            }
        }

        // Update pieces
        if (piecesEl) {
            piecesEl.innerHTML = '';
            this.pieces.forEach(piece => {
                if (piece.placed) return;
                const pieceEl = document.createElement('div');
                pieceEl.className = 'piece-1010';
                pieceEl.id = piece.id;
                pieceEl.dataset.pieceId = piece.id;
                pieceEl.style.gridTemplateColumns = `repeat(${piece.shape[0].length}, 1fr)`;
                pieceEl.style.gridTemplateRows = `repeat(${piece.shape.length}, 1fr)`;
                pieceEl.style.width = `${piece.shape[0].length * 30}px`;
                pieceEl.style.height = `${piece.shape.length * 30}px`;
                pieceEl.draggable = true;

                piece.shape.forEach((row, i) => {
                    row.forEach((cell, j) => {
                        if (cell === 1) {
                            const block = document.createElement('div');
                            block.className = 'piece-block-1010';
                            pieceEl.appendChild(block);
                        }
                    });
                });

                pieceEl.addEventListener('dragstart', (e) => {
                    this.selectedPiece = piece;
                    e.dataTransfer.effectAllowed = 'move';
                });

                pieceEl.addEventListener('click', () => {
                    this.selectedPiece = piece;
                });

                piecesEl.appendChild(pieceEl);
            });
        }

        // Add drop handlers to board cells
        if (boardEl) {
            boardEl.querySelectorAll('.cell-1010').forEach(cell => {
                cell.addEventListener('dragover', (e) => {
                    e.preventDefault();
                    e.dataTransfer.dropEffect = 'move';
                });

                cell.addEventListener('drop', (e) => {
                    e.preventDefault();
                    if (this.selectedPiece) {
                        const row = parseInt(cell.dataset.row);
                        const col = parseInt(cell.dataset.col);
                        this.placePiece(this.selectedPiece.id, row, col);
                        this.selectedPiece = null;
                    }
                });

                cell.addEventListener('click', () => {
                    if (this.selectedPiece) {
                        const row = parseInt(cell.dataset.row);
                        const col = parseInt(cell.dataset.col);
                        this.placePiece(this.selectedPiece.id, row, col);
                        this.selectedPiece = null;
                    }
                });
            });
        }
    }

    setupControls() {
        // Controls handled in updateDisplay
    }

    removeControls() {
        // Cleanup handled by DOM removal
    }
}

function injectStyles() {
    if (document.getElementById('game-1010-style')) return;
    const style = document.createElement('style');
    style.id = 'game-1010-style';
    style.textContent = `
        .game-container #game-content, .game-container #game-content * {
            font-family: system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol" !important;
        }
        body {
            overflow: hidden !important;
            position: fixed !important;
            width: 100% !important;
        }
        html {
            overflow: hidden !important;
        }
        .game-container {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            overflow: hidden !important;
            max-width: 100vw;
            max-height: 100vh;
            margin: 0;
            padding: 0;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            box-sizing: border-box;
            background: #f0f0f0;
        }
        .game-container #game-content {
            position: relative;
            width: 100%;
            height: 90vh;
            max-height: 90vh;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            max-width: 100%;
            overflow: hidden;
            box-sizing: border-box;
            padding: 10px;
            margin-top: 5vh;
            margin-bottom: 5vh;
            background: transparent;
            border-radius: 0;
            box-shadow: none;
        }
        .back-button-tetris {
            position: fixed;
            top: 15px;
            left: 15px;
            background: #f8f9fa;
            color: #333;
            border: 1px solid #dee2e6;
            padding: 6px 10px;
            border-radius: 6px;
            font-size: 0.75rem;
            cursor: pointer;
            transition: all 0.2s ease;
            z-index: 10000;
            display: flex;
            align-items: center;
            gap: 6px;
            font-weight: 600;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }
        .game-1010-wrap {
            width: 100%;
            max-width: 600px;
            display: flex;
            flex-direction: column;
            align-items: center;
        }
        .game-1010-header h1 {
            font-size: 3rem;
            font-weight: 800;
            color: #333;
            margin: 0 0 20px 0;
            text-align: center;
        }
        .game-1010-stats {
            display: flex;
            gap: 10px;
            margin-bottom: 20px;
        }
        .stat-box {
            background: #4a90e2;
            border-radius: 8px;
            padding: 10px 20px;
            text-align: center;
            flex: 1;
        }
        .stat-label {
            color: #fff;
            font-size: 0.75rem;
            font-weight: 700;
            text-transform: uppercase;
            margin-bottom: 5px;
        }
        .stat-value {
            color: #fff;
            font-size: 1.5rem;
            font-weight: 800;
        }
        .game-1010-board {
            background: #ddd;
            border-radius: 8px;
            padding: 10px;
            display: grid;
            grid-template-columns: repeat(10, 1fr);
            grid-template-rows: repeat(10, 1fr);
            gap: 2px;
            width: 100%;
            max-width: 400px;
            aspect-ratio: 1;
            margin-bottom: 20px;
        }
        .cell-1010 {
            background: #fff;
            border-radius: 4px;
            aspect-ratio: 1;
        }
        .cell-1010.filled {
            background: #4a90e2;
        }
        .game-1010-pieces {
            display: flex;
            gap: 15px;
            justify-content: center;
            flex-wrap: wrap;
            margin-bottom: 20px;
            min-height: 100px;
        }
        .piece-1010 {
            display: grid;
            gap: 2px;
            cursor: grab;
            padding: 5px;
            background: #f8f9fa;
            border-radius: 6px;
            border: 2px solid #dee2e6;
        }
        .piece-1010:hover {
            border-color: #4a90e2;
        }
        .piece-1010:active {
            cursor: grabbing;
        }
        .piece-block-1010 {
            background: #4a90e2;
            border-radius: 4px;
            min-width: 28px;
            min-height: 28px;
        }
        .game-1010-controls {
            text-align: center;
        }
        .btn-primary {
            background: #4a90e2;
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 6px;
            font-size: 0.9rem;
            cursor: pointer;
            font-weight: 600;
            display: flex;
            align-items: center;
            gap: 6px;
        }
        .btn-primary:hover {
            background: #357abd;
        }
        .btn-primary i {
            width: 14px;
            height: 14px;
        }
        @media (max-width: 768px) {
            .game-1010-header h1 {
                font-size: 2rem;
            }
            .game-1010-board {
                max-width: 100%;
            }
            .piece-1010 {
                transform: scale(0.8);
            }
        }
    `;
    document.head.appendChild(style);
}

