// 1010 Block Puzzle Game Module
import { createBackButton, setupScrollPrevention, removeScrollPrevention, setupHardReset } from '../../core/gameUtils.js';
import { injectGameStyles, removeGameStyles } from '../../core/gameStyles.js';

let game1010 = null;

export function init() {
    const gameContent = document.getElementById('game-content');
    gameContent.innerHTML = createBackButton() + `
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

    injectGameStyles('1010', getGameSpecificStyles());
    if (typeof lucide !== 'undefined') lucide.createIcons();
    
    setupScrollPrevention('1010');
    
    game1010 = new Game1010();
    window.game1010 = game1010;
    window.newGame1010 = () => game1010.newGame();
}

export function cleanup() {
    if (game1010) {
        game1010.removeControls();
        game1010 = null;
    }
    removeScrollPrevention('1010');
    removeGameStyles('1010');
}

class Game1010 {
    constructor() {
        this.size = 10;
        this.board = [];
        this.score = 0;
        this.lines = 0;
        this.selectedPiece = null;
        this.draggingPiece = null;
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
        
        // Generate new pieces if all are placed
        if (this.pieces.every(p => p.placed)) {
            this.generatePieces();
        }

        this.updateDisplay();

        // Check if no moves possible (after generating new pieces)
        setTimeout(() => {
            if (!this.canPlaceAnyPiece()) {
                alert('Spill over! Ingen flere trekk mulig. Final score: ' + this.score.toLocaleString());
                this.newGame();
            }
        }, 100);

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
                pieceEl.touchAction = 'none';

                piece.shape.forEach((row, i) => {
                    row.forEach((cell, j) => {
                        if (cell === 1) {
                            const block = document.createElement('div');
                            block.className = 'piece-block-1010';
                            pieceEl.appendChild(block);
                        }
                    });
                });

                // Drag handlers
                pieceEl.addEventListener('dragstart', (e) => {
                    this.selectedPiece = piece;
                    this.draggingPiece = piece;
                    e.dataTransfer.effectAllowed = 'move';
                    e.dataTransfer.setData('text/plain', ''); // Required for some browsers
                    pieceEl.classList.add('dragging');
                    
                    // Create ghost preview
                    this.createDragPreview(piece, e);
                });

                pieceEl.addEventListener('dragend', (e) => {
                    pieceEl.classList.remove('dragging');
                    this.removeDragPreview();
                    this.selectedPiece = null;
                    this.draggingPiece = null;
                    this.clearBoardPreview();
                });

                // Touch support
                let touchStartX = 0;
                let touchStartY = 0;
                pieceEl.addEventListener('touchstart', (e) => {
                    e.preventDefault();
                    this.selectedPiece = piece;
                    this.draggingPiece = piece;
                    const touch = e.touches[0];
                    touchStartX = touch.clientX;
                    touchStartY = touch.clientY;
                    pieceEl.classList.add('dragging');
                }, { passive: false });

                pieceEl.addEventListener('touchmove', (e) => {
                    e.preventDefault();
                    if (!this.selectedPiece) return;
                    const touch = e.touches[0];
                    const deltaX = touch.clientX - touchStartX;
                    const deltaY = touch.clientY - touchStartY;
                    pieceEl.style.transform = `translate(${deltaX}px, ${deltaY}px)`;
                }, { passive: false });

                pieceEl.addEventListener('touchend', (e) => {
                    e.preventDefault();
                    pieceEl.classList.remove('dragging');
                    pieceEl.style.transform = '';
                    this.selectedPiece = null;
                    this.draggingPiece = null;
                }, { passive: false });

                pieceEl.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    this.selectedPiece = piece;
                    pieceEl.classList.add('selected');
                    // Remove selection from other pieces
                    piecesEl.querySelectorAll('.piece-1010').forEach(p => {
                        if (p !== pieceEl) p.classList.remove('selected');
                    });
                });

                piecesEl.appendChild(pieceEl);
            });
        }

        // Add drop handlers to board cells
        if (boardEl) {
            boardEl.querySelectorAll('.cell-1010').forEach(cell => {
                // Prevent zoom on mobile
                cell.addEventListener('touchstart', (e) => {
                    e.preventDefault();
                }, { passive: false });

                cell.addEventListener('dragover', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    e.dataTransfer.dropEffect = 'move';
                    
                    if (this.draggingPiece) {
                        const row = parseInt(cell.dataset.row);
                        const col = parseInt(cell.dataset.col);
                        this.showBoardPreview(this.draggingPiece, row, col);
                    }
                });

                cell.addEventListener('dragleave', (e) => {
                    e.preventDefault();
                    this.clearBoardPreview();
                });

                cell.addEventListener('drop', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    this.clearBoardPreview();
                    if (this.selectedPiece) {
                        const row = parseInt(cell.dataset.row);
                        const col = parseInt(cell.dataset.col);
                        this.placePiece(this.selectedPiece.id, row, col);
                        this.selectedPiece = null;
                        this.draggingPiece = null;
                    }
                });

                cell.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (this.selectedPiece) {
                        const row = parseInt(cell.dataset.row);
                        const col = parseInt(cell.dataset.col);
                        const placed = this.placePiece(this.selectedPiece.id, row, col);
                        if (placed) {
                            this.selectedPiece = null;
                            // Clear selection
                            piecesEl.querySelectorAll('.piece-1010').forEach(p => {
                                p.classList.remove('selected');
                            });
                        }
                    }
                });
            });
        }
    }
    
    createDragPreview(piece, e) {
        // Ghost preview is handled by CSS drag image
        const dragImg = document.createElement('div');
        dragImg.style.position = 'absolute';
        dragImg.style.top = '-1000px';
        dragImg.style.opacity = '0.5';
        dragImg.style.pointerEvents = 'none';
        dragImg.className = 'piece-1010 preview';
        dragImg.style.gridTemplateColumns = `repeat(${piece.shape[0].length}, 1fr)`;
        dragImg.style.gridTemplateRows = `repeat(${piece.shape.length}, 1fr)`;
        dragImg.style.width = `${piece.shape[0].length * 30}px`;
        dragImg.style.height = `${piece.shape.length * 30}px`;
        
        piece.shape.forEach((row, i) => {
            row.forEach((cell, j) => {
                if (cell === 1) {
                    const block = document.createElement('div');
                    block.className = 'piece-block-1010';
                    dragImg.appendChild(block);
                }
            });
        });
        
        document.body.appendChild(dragImg);
        e.dataTransfer.setDragImage(dragImg, dragImg.offsetWidth / 2, dragImg.offsetHeight / 2);
    }
    
    removeDragPreview() {
        const preview = document.querySelector('.piece-1010.preview');
        if (preview) preview.remove();
    }
    
    showBoardPreview(piece, row, col) {
        // Clear previous preview
        this.clearBoardPreview();
        
        // Check if piece can fit
        let canFit = true;
        for (let i = 0; i < piece.shape.length; i++) {
            for (let j = 0; j < piece.shape[i].length; j++) {
                if (piece.shape[i][j] === 1) {
                    const r = row + i;
                    const c = col + j;
                    if (r < 0 || r >= this.size || c < 0 || c >= this.size || this.board[r][c] !== 0) {
                        canFit = false;
                        break;
                    }
                }
            }
            if (!canFit) break;
        }
        
        if (canFit) {
            // Show preview on board
            for (let i = 0; i < piece.shape.length; i++) {
                for (let j = 0; j < piece.shape[i].length; j++) {
                    if (piece.shape[i][j] === 1) {
                        const r = row + i;
                        const c = col + j;
                        const cell = document.querySelector(`.cell-1010[data-row="${r}"][data-col="${c}"]`);
                        if (cell && !cell.classList.contains('filled')) {
                            cell.classList.add('preview');
                        }
                    }
                }
            }
        }
    }
    
    clearBoardPreview() {
        document.querySelectorAll('.cell-1010.preview').forEach(cell => {
            cell.classList.remove('preview');
        });
    }

    setupControls() {
        this.keyHandler = setupHardReset('1010', (e) => {
            // No additional key handling needed
        });
        document.addEventListener('keydown', this.keyHandler);
    }

    removeControls() {
        if (this.keyHandler) {
            document.removeEventListener('keydown', this.keyHandler);
        }
    }
}

function getGameSpecificStyles() {
    return `
        body { background: #f0f0f0; }
        .game-1010-wrap {
            width: 100%;
            max-width: min(600px, 95vw);
            display: flex;
            flex-direction: column;
            align-items: center;
        }
        .game-1010-header h1 {
            font-size: 2.5rem;
            font-weight: 800;
            color: #111;
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
            border-radius: 0;
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
            border-radius: 0;
            padding: 10px;
            display: grid;
            grid-template-columns: repeat(10, 1fr);
            grid-template-rows: repeat(10, 1fr);
            gap: 2px;
            width: 100%;
            max-width: min(400px, calc(95vw - 40px));
            aspect-ratio: 1;
            margin-bottom: 20px;
        }
        .cell-1010 {
            background: #fff;
            border-radius: 0;
            aspect-ratio: 1;
            touch-action: none;
            -webkit-tap-highlight-color: transparent;
        }
        .cell-1010.filled {
            background: #4a90e2;
        }
        .cell-1010.preview {
            background: #9ec8f0;
            border: 2px dashed #4a90e2;
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
            border-radius: 0;
            border: 2px solid #dee2e6;
            transition: all 0.2s ease;
            touch-action: none;
            -webkit-tap-highlight-color: transparent;
            user-select: none;
        }
        .piece-1010:hover {
            border-color: #4a90e2;
            transform: scale(1.05);
        }
        .piece-1010.selected {
            border-color: #4a90e2;
            border-width: 3px;
            box-shadow: 0 0 0 3px rgba(74, 144, 226, 0.3);
        }
        .piece-1010.dragging {
            opacity: 0.5;
            cursor: grabbing;
            transform: scale(0.9);
        }
        .piece-1010:active {
            cursor: grabbing;
        }
        .piece-block-1010 {
            background: #4a90e2;
            border-radius: 0;
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
            border-radius: 0;
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
                transform: scale(0.9);
            }
            .piece-1010:hover {
                transform: scale(0.95);
            }
            .piece-1010.selected {
                transform: scale(1);
            }
            
            /* Prevent zoom on double tap */
            * {
                touch-action: manipulation;
            }
            
            .cell-1010, .piece-1010 {
                -webkit-user-select: none;
                user-select: none;
            }
        }
    `;
}

