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
        this.previewRow = null;
        this.previewCol = null;
        this.touchStartPos = null;
        this.dragElement = null;
        
        this.setupControls();
        this.newGame();
    }

    newGame() {
        this.board = Array(this.size).fill().map(() => Array(this.size).fill(0));
        this.score = 0;
        this.lines = 0;
        this.selectedPiece = null;
        this.draggingPiece = null;
        this.previewRow = null;
        this.previewCol = null;
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

        this.selectedPiece = null;
        this.draggingPiece = null;
        this.previewRow = null;
        this.previewCol = null;
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

    getCellFromPoint(x, y) {
        const boardEl = document.getElementById('board-1010');
        if (!boardEl) return null;
        
        const rect = boardEl.getBoundingClientRect();
        const relX = x - rect.left;
        const relY = y - rect.top;
        
        if (relX < 0 || relY < 0 || relX > rect.width || relY > rect.height) {
            return null;
        }
        
        const cellSize = rect.width / this.size;
        const col = Math.floor(relX / cellSize);
        const row = Math.floor(relY / cellSize);
        
        if (row >= 0 && row < this.size && col >= 0 && col < this.size) {
            return { row, col };
        }
        return null;
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
            
            // Add board drag handlers
            this.setupBoardHandlers(boardEl);
        }

        // Update pieces
        if (piecesEl) {
            piecesEl.innerHTML = '';
            this.pieces.forEach(piece => {
                if (piece.placed) return;
                const pieceEl = this.createPieceElement(piece, piecesEl);
                piecesEl.appendChild(pieceEl);
            });
        }
        
        // Update preview
        this.updatePreview();
    }
    
    createPieceElement(piece, container) {
        const pieceEl = document.createElement('div');
        pieceEl.className = 'piece-1010';
        pieceEl.id = piece.id;
        pieceEl.dataset.pieceId = piece.id;
        pieceEl.dataset.shape = JSON.stringify(piece.shape);
        
        const blockSize = 28;
        pieceEl.style.gridTemplateColumns = `repeat(${piece.shape[0].length}, 1fr)`;
        pieceEl.style.gridTemplateRows = `repeat(${piece.shape.length}, 1fr)`;
        pieceEl.style.width = `${piece.shape[0].length * blockSize}px`;
        pieceEl.style.height = `${piece.shape.length * blockSize}px`;

        piece.shape.forEach((row) => {
            row.forEach((cell) => {
                if (cell === 1) {
                    const block = document.createElement('div');
                    block.className = 'piece-block-1010';
                    pieceEl.appendChild(block);
                }
            });
        });

        // Click to select
        pieceEl.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            if (this.selectedPiece === piece) {
                this.selectedPiece = null;
                pieceEl.classList.remove('selected');
            } else {
                // Deselect others
                container.querySelectorAll('.piece-1010').forEach(p => {
                    p.classList.remove('selected');
                });
                this.selectedPiece = piece;
                pieceEl.classList.add('selected');
            }
            this.updatePreview();
        });

        // Mouse drag
        pieceEl.addEventListener('mousedown', (e) => {
            e.preventDefault();
            this.startDrag(piece, pieceEl, e.clientX, e.clientY);
        });

        // Touch drag
        pieceEl.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            this.startDrag(piece, pieceEl, touch.clientX, touch.clientY);
        }, { passive: false });

        return pieceEl;
    }
    
    startDrag(piece, element, clientX, clientY) {
        this.selectedPiece = piece;
        this.draggingPiece = piece;
        this.dragElement = element.cloneNode(true);
        this.dragElement.classList.add('dragging-clone');
        this.dragElement.style.position = 'fixed';
        this.dragElement.style.pointerEvents = 'none';
        this.dragElement.style.zIndex = '10000';
        document.body.appendChild(this.dragElement);
        
        const rect = element.getBoundingClientRect();
        this.dragOffset.x = clientX - rect.left;
        this.dragOffset.y = clientY - rect.top;
        
        this.updateDragPosition(clientX, clientY);
        element.classList.add('dragging');
        
        // Mouse move
        const mouseMove = (e) => {
            e.preventDefault();
            this.updateDragPosition(e.clientX, e.clientY);
            this.updatePreviewFromPoint(e.clientX, e.clientY);
        };
        
        // Mouse up
        const mouseUp = (e) => {
            e.preventDefault();
            const cell = this.getCellFromPoint(e.clientX, e.clientY);
            if (cell && this.draggingPiece) {
                this.placePiece(this.draggingPiece.id, cell.row, cell.col);
            }
            this.endDrag();
            document.removeEventListener('mousemove', mouseMove);
            document.removeEventListener('mouseup', mouseUp);
        };
        
        // Touch move
        const touchMove = (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            this.updateDragPosition(touch.clientX, touch.clientY);
            this.updatePreviewFromPoint(touch.clientX, touch.clientY);
        };
        
        // Touch end
        const touchEnd = (e) => {
            e.preventDefault();
            const touch = e.changedTouches[0];
            const cell = this.getCellFromPoint(touch.clientX, touch.clientY);
            if (cell && this.draggingPiece) {
                this.placePiece(this.draggingPiece.id, cell.row, cell.col);
            }
            this.endDrag();
            document.removeEventListener('touchmove', touchMove);
            document.removeEventListener('touchend', touchEnd);
        };
        
        document.addEventListener('mousemove', mouseMove);
        document.addEventListener('mouseup', mouseUp);
        document.addEventListener('touchmove', touchMove, { passive: false });
        document.addEventListener('touchend', touchEnd, { passive: false });
    }
    
    updateDragPosition(clientX, clientY) {
        if (this.dragElement) {
            this.dragElement.style.left = `${clientX - this.dragOffset.x}px`;
            this.dragElement.style.top = `${clientY - this.dragOffset.y}px`;
        }
    }
    
    updatePreviewFromPoint(clientX, clientY) {
        const cell = this.getCellFromPoint(clientX, clientY);
        if (cell && this.draggingPiece) {
            this.previewRow = cell.row;
            this.previewCol = cell.col;
        } else {
            this.previewRow = null;
            this.previewCol = null;
        }
        this.updatePreview();
    }
    
    updatePreview() {
        // Clear all previews
        document.querySelectorAll('.cell-1010').forEach(cell => {
            cell.classList.remove('preview', 'preview-invalid');
        });
        
        if (!this.draggingPiece || this.previewRow === null || this.previewCol === null) {
            return;
        }
        
        const piece = this.draggingPiece;
        let canFit = true;
        
        // Check if piece can fit
        for (let i = 0; i < piece.shape.length; i++) {
            for (let j = 0; j < piece.shape[i].length; j++) {
                if (piece.shape[i][j] === 1) {
                    const r = this.previewRow + i;
                    const c = this.previewCol + j;
                    if (r < 0 || r >= this.size || c < 0 || c >= this.size || this.board[r][c] !== 0) {
                        canFit = false;
                        break;
                    }
                }
            }
            if (!canFit) break;
        }
        
        // Show preview
        if (canFit) {
            for (let i = 0; i < piece.shape.length; i++) {
                for (let j = 0; j < piece.shape[i].length; j++) {
                    if (piece.shape[i][j] === 1) {
                        const r = this.previewRow + i;
                        const c = this.previewCol + j;
                        const cell = document.querySelector(`.cell-1010[data-row="${r}"][data-col="${c}"]`);
                        if (cell && !cell.classList.contains('filled')) {
                            cell.classList.add('preview');
                        }
                    }
                }
            }
        }
    }
    
    endDrag() {
        if (this.dragElement) {
            this.dragElement.remove();
            this.dragElement = null;
        }
        document.querySelectorAll('.piece-1010').forEach(el => {
            el.classList.remove('dragging');
        });
        this.draggingPiece = null;
        this.previewRow = null;
        this.previewCol = null;
        this.updatePreview();
    }
    
    setupBoardHandlers(boardEl) {
        boardEl.querySelectorAll('.cell-1010').forEach(cell => {
            cell.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                if (this.selectedPiece && !this.draggingPiece) {
                    const row = parseInt(cell.dataset.row);
                    const col = parseInt(cell.dataset.col);
                    this.placePiece(this.selectedPiece.id, row, col);
                }
            });
        });
    }

    setupControls() {
        this.keyHandler = setupHardReset('1010', (e) => {
            // Don't process shortcuts if user is typing in an input field
            const activeElement = document.activeElement;
            if (activeElement && (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA')) {
                return;
            }
        });
        document.addEventListener('keydown', this.keyHandler);
    }

    removeControls() {
        if (this.keyHandler) {
            document.removeEventListener('keydown', this.keyHandler);
        }
        this.endDrag();
    }
}

function getGameSpecificStyles() {
    return `
        .game-1010-wrap {
            width: 100%;
            max-width: min(700px, 95vw);
            max-height: calc(100vh - 20px);
            overflow-y: auto;
            overflow-x: hidden;
            display: flex;
            flex-direction: column;
            align-items: center;
            padding: 10px;
            box-sizing: border-box;
        }
        .game-1010-main {
            width: 100%;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 15px;
            flex-shrink: 0;
        }
        .game-1010-header {
            flex-shrink: 0;
            width: 100%;
        }
        .game-1010-header h1 {
            font-size: 2.5rem;
            font-weight: 800;
            color: #111;
            margin: 0 0 15px 0;
            text-align: center;
        }
        .game-1010-stats {
            display: flex;
            gap: 15px;
            margin-bottom: 0;
            justify-content: center;
            flex-wrap: wrap;
        }
        .stat-box {
            background: #4a90e2;
            border-radius: 0;
            padding: 12px 20px;
            text-align: center;
            flex: 1;
            min-width: 120px;
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
            padding: 8px;
            display: grid;
            grid-template-columns: repeat(10, 1fr);
            grid-template-rows: repeat(10, 1fr);
            gap: 2px;
            width: 100%;
            max-width: min(450px, calc(95vw - 40px));
            aspect-ratio: 1;
            margin-bottom: 0;
            flex-shrink: 0;
            border: 3px solid #333;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }
        .cell-1010 {
            background: #fff;
            border-radius: 0;
            aspect-ratio: 1;
            touch-action: none;
            -webkit-tap-highlight-color: transparent;
            transition: background-color 0.15s ease;
        }
        .cell-1010.filled {
            background: #4a90e2;
            border: 1px solid #357abd;
        }
        .cell-1010.preview {
            background: #9ec8f0 !important;
            border: 2px solid #4a90e2;
            box-shadow: inset 0 0 0 2px rgba(74, 144, 226, 0.3);
        }
        .game-1010-pieces {
            display: flex;
            gap: 15px;
            justify-content: center;
            flex-wrap: wrap;
            margin-bottom: 0;
            min-height: 100px;
            flex-shrink: 0;
            width: 100%;
            padding: 10px;
        }
        .piece-1010 {
            display: grid;
            gap: 2px;
            cursor: grab;
            padding: 4px;
            background: #f8f9fa;
            border-radius: 0;
            border: 2px solid #dee2e6;
            transition: all 0.2s ease;
            touch-action: none;
            -webkit-tap-highlight-color: transparent;
            user-select: none;
            -webkit-user-select: none;
        }
        .piece-1010:hover:not(.dragging) {
            border-color: #4a90e2;
            transform: scale(1.05);
        }
        .piece-1010.selected {
            border-color: #4a90e2;
            border-width: 3px;
            box-shadow: 0 0 0 3px rgba(74, 144, 226, 0.3);
        }
        .piece-1010.dragging {
            opacity: 0.4;
            cursor: grabbing;
        }
        .dragging-clone {
            opacity: 0.8 !important;
            transform: scale(1.1);
            filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.3));
        }
        .piece-block-1010 {
            background: #4a90e2;
            border-radius: 0;
            min-width: 26px;
            min-height: 26px;
        }
        .game-1010-controls {
            text-align: center;
            flex-shrink: 0;
            width: 100%;
            margin-top: 10px;
        }
        .btn-primary {
            background: #4a90e2;
            color: white;
            border: 2px solid #357abd;
            padding: 12px 24px;
            border-radius: 0;
            font-size: 0.9rem;
            cursor: pointer;
            font-weight: 600;
            display: inline-flex;
            align-items: center;
            gap: 6px;
            min-height: 44px;
        }
        .btn-primary:hover {
            background: #357abd;
        }
        .btn-primary i {
            width: 14px;
            height: 14px;
        }
        @media (max-width: 768px) {
            .game-1010-wrap {
                max-height: calc(100vh - 10px);
                padding: 5px;
            }
            .game-1010-header h1 {
                font-size: 2rem;
                margin-bottom: 12px;
            }
            .game-1010-stats {
                flex-direction: column;
                gap: 10px;
                width: 100%;
            }
            .stat-box {
                width: 100%;
                padding: 12px 20px;
            }
            .stat-value {
                font-size: 1.25rem;
            }
            .game-1010-board {
                max-width: 100%;
                padding: 6px;
            }
            .game-1010-pieces {
                gap: 10px;
                padding: 8px;
            }
            .piece-1010 {
                transform: scale(0.85);
            }
            .piece-1010:hover:not(.dragging) {
                transform: scale(0.9);
            }
            .piece-1010.selected {
                transform: scale(0.95);
            }
            .piece-block-1010 {
                min-width: 22px;
                min-height: 22px;
            }
            .btn-primary {
                width: 100%;
                min-height: 48px;
                padding: 14px 20px;
            }
        }
        @media (max-width: 480px) {
            .game-1010-header h1 {
                font-size: 1.75rem;
            }
            .piece-1010 {
                transform: scale(0.8);
            }
            .piece-1010.selected {
                transform: scale(0.85);
            }
        }
    `;
}
