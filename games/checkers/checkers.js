// Checkers Game Module

let checkersGame = null;

export function init() {
    const gameContent = document.getElementById('game-content');
    gameContent.innerHTML = `
        createBackButton() + `
        <div class="checkers-wrap">
            <div class="checkers-main">
                <div class="checkers-header">
                    <h1>Checkers</h1>
                    <div class="checkers-stats">
                        <div class="stat-box">
                            <div class="stat-label">Spiller</div>
                            <div class="stat-value" id="turn-checkers">Rød</div>
                        </div>
                        <div class="stat-box">
                            <div class="stat-label">Rød</div>
                            <div class="stat-value" id="red-pieces">12</div>
                        </div>
                        <div class="stat-box">
                            <div class="stat-label">Svart</div>
                            <div class="stat-value" id="black-pieces">12</div>
                        </div>
                    </div>
                </div>
                <div class="checkers-game-area">
                    <div class="checkers-board" id="checkers-board"></div>
                </div>
                <div class="checkers-controls">
                    <p id="checkers-status" class="checkers-status">Rød spiller først</p>
                    <div class="checkers-buttons">
                        <button onclick="window.resetCheckers()" class="btn-secondary">
                            <i data-lucide="refresh-cw"></i> Reset
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
    injectGameStyles('checkers', getGameSpecificStyles());
    if (typeof lucide !== 'undefined') lucide.createIcons();
    
    setupScrollPrevention('checkers');
    
    checkersGame = new CheckersGame();
    window.checkersGame = checkersGame;
    window.resetCheckers = () => checkersGame.reset();
}

export function cleanup() {
    if (checkersGame) {
        checkersGame.removeControls();
        checkersGame = null;
    }
        removeScrollPrevention('checkers');
        removeGameStyles('checkers');
}

class CheckersGame {
    constructor() {
        this.size = 8;
        this.board = [];
        this.currentPlayer = 'red';
        this.selectedPiece = null;
        this.redPieces = 12;
        this.blackPieces = 12;
        
        this.initBoard();
        this.setupControls();
        this.updateDisplay();
    }

    initBoard() {
        this.board = Array(this.size).fill().map(() => Array(this.size).fill(null));
        
        // Place red pieces (top)
        for (let row = 0; row < 3; row++) {
            for (let col = 0; col < this.size; col++) {
                if ((row + col) % 2 === 1) {
                    this.board[row][col] = { color: 'red', king: false };
                }
            }
        }
        
        // Place black pieces (bottom)
        for (let row = 5; row < this.size; row++) {
            for (let col = 0; col < this.size; col++) {
                if ((row + col) % 2 === 1) {
                    this.board[row][col] = { color: 'black', king: false };
                }
            }
        }
    }

    setupControls() {
        };
        document.addEventListener('keydown', this.keyHandler);
    }

    removeControls() {
        if (this.keyHandler) {
            document.removeEventListener('keydown', this.keyHandler);
        }
    }

    reset() {
        this.currentPlayer = 'red';
        this.selectedPiece = null;
        this.redPieces = 12;
        this.blackPieces = 12;
        this.initBoard();
        document.getElementById('turn-checkers').textContent = 'Rød';
        document.getElementById('checkers-status').textContent = 'Rød spiller først';
        this.updateDisplay();
    }

    selectPiece(row, col) {
        const piece = this.board[row][col];
        if (!piece || piece.color !== this.currentPlayer) return;
        
        this.selectedPiece = { row, col };
        this.updateDisplay();
    }

    movePiece(toRow, toCol) {
        if (!this.selectedPiece) return;
        
        const { row: fromRow, col: fromCol } = this.selectedPiece;
        const piece = this.board[fromRow][fromCol];
        if (!piece) return;
        
        // Check if valid move
        const rowDiff = toRow - fromRow;
        const colDiff = Math.abs(toCol - fromCol);
        
        // Check if diagonal move
        if (Math.abs(rowDiff) !== Math.abs(colDiff)) return;
        
        // Check direction (red moves down, black moves up)
        if (!piece.king) {
            if (piece.color === 'red' && rowDiff <= 0) return;
            if (piece.color === 'black' && rowDiff >= 0) return;
        }
        
        // Simple move (one square)
        if (Math.abs(rowDiff) === 1 && this.board[toRow][toCol] === null) {
            this.board[toRow][toCol] = piece;
            this.board[fromRow][fromCol] = null;
            
            // Check for king promotion
            if (piece.color === 'red' && toRow === this.size - 1) {
                piece.king = true;
            }
            if (piece.color === 'black' && toRow === 0) {
                piece.king = true;
            }
            
            this.switchPlayer();
        }
        // Jump move (two squares)
        else if (Math.abs(rowDiff) === 2) {
            const midRow = fromRow + rowDiff / 2;
            const midCol = fromCol + (toCol - fromCol) / 2;
            const midPiece = this.board[midRow][midCol];
            
            if (midPiece && midPiece.color !== piece.color && this.board[toRow][toCol] === null) {
                // Capture piece
                this.board[midRow][midCol] = null;
                if (midPiece.color === 'red') this.redPieces--;
                else this.blackPieces--;
                
                this.board[toRow][toCol] = piece;
                this.board[fromRow][fromCol] = null;
                
                // Check for king promotion
                if (piece.color === 'red' && toRow === this.size - 1) {
                    piece.king = true;
                }
                if (piece.color === 'black' && toRow === 0) {
                    piece.king = true;
                }
                
                this.switchPlayer();
            }
        }
        
        this.selectedPiece = null;
        this.updateDisplay();
        
        // Check win condition
        if (this.redPieces === 0 || this.blackPieces === 0) {
            const winner = this.redPieces === 0 ? 'Svart' : 'Rød';
            alert(`${winner} vant!`);
            this.reset();
        }
    }

    switchPlayer() {
        this.currentPlayer = this.currentPlayer === 'red' ? 'black' : 'red';
        document.getElementById('turn-checkers').textContent = this.currentPlayer === 'red' ? 'Rød' : 'Svart';
        document.getElementById('checkers-status').textContent = `${this.currentPlayer === 'red' ? 'Rød' : 'Svart'} spiller`;
    }

    updateDisplay() {
        const boardEl = document.getElementById('checkers-board');
        if (!boardEl) return;
        
        boardEl.innerHTML = '';
        
        for (let row = 0; row < this.size; row++) {
            for (let col = 0; col < this.size; col++) {
                const cell = document.createElement('div');
                cell.className = 'checkers-cell';
                
                // Alternate colors
                if ((row + col) % 2 === 0) {
                    cell.classList.add('light');
                } else {
                    cell.classList.add('dark');
                }
                
                // Highlight selected
                if (this.selectedPiece && this.selectedPiece.row === row && this.selectedPiece.col === col) {
                    cell.classList.add('selected');
                }
                
                const piece = this.board[row][col];
                if (piece) {
                    cell.classList.add('piece', piece.color);
                    if (piece.king) {
                        cell.innerHTML = '♛';
                        cell.classList.add('king');
                    } else {
                        cell.innerHTML = '●';
                    }
                }
                
                cell.addEventListener('click', () => {
                    if (this.selectedPiece && this.selectedPiece.row === row && this.selectedPiece.col === col) {
                        this.selectedPiece = null;
                        this.updateDisplay();
                    } else if (this.selectedPiece) {
                        this.movePiece(row, col);
                    } else if (piece && piece.color === this.currentPlayer) {
                        this.selectPiece(row, col);
                    }
                });
                
                boardEl.appendChild(cell);
            }
        }
        
        // Update piece counts
        document.getElementById('red-pieces').textContent = this.redPieces;
        document.getElementById('black-pieces').textContent = this.blackPieces;
    }
}

function getGameSpecificStyles() {
    return `
.checkers-wrap {
            width: 100%;
            max-width: min(700px, 95vw);
            display: flex;
            flex-direction: column;
            align-items: center;
        }
        .checkers-header h1 {
            font-size: 2.5rem;
            font-weight: 800;
            color: #111;
            margin: 0 0 20px 0;
            text-align: center;
        }
        .checkers-stats {
            display: flex;
            gap: 15px;
            margin-bottom: 20px;
            justify-content: center;
            flex-wrap: wrap;
        }
        .stat-box {
            background: #f8f9fa;
            border: 2px solid #dee2e6;
            border-radius: 0;
            padding: 12px 20px;
            text-align: center;
            min-width: 100px;
        }
        .stat-label {
            color: #6c757d;
            font-size: 0.8rem;
            font-weight: 600;
            margin-bottom: 6px;
        }
        .stat-value {
            color: #212529;
            font-size: 1.5rem;
            font-weight: 800;
        }
        .checkers-game-area {
            width: 100%;
            display: flex;
            justify-content: center;
            margin-bottom: 20px;
        }
        .checkers-board {
            display: grid;
            grid-template-columns: repeat(8, 1fr);
            gap: 0;
            background: #8b4513;
            border: 4px solid #654321;
            border-radius: 0;
            padding: 4px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            max-width: min(500px, calc(95vw - 40px));
            width: 100%;
            aspect-ratio: 1;
        }
        .checkers-cell {
            aspect-ratio: 1;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            transition: all 0.2s ease;
            font-size: 2rem;
        }
        .checkers-cell.light {
            background: #f0d9b5;
        }
        .checkers-cell.dark {
            background: #b58863;
        }
        .checkers-cell.selected {
            background: #90ee90 !important;
            border: 3px solid #00ff00;
        }
        .checkers-cell.piece {
            cursor: pointer;
        }
        .checkers-cell.piece.red {
            color: #dc3545;
        }
        .checkers-cell.piece.black {
            color: #212529;
        }
        .checkers-cell.king {
            font-size: 2.5rem;
        }
        .checkers-cell:hover:not(.piece) {
            background: #e0e0e0 !important;
        }
        .checkers-controls {
            text-align: center;
        }
        .checkers-status {
            color: #111;
            font-size: 1rem;
            font-weight: 600;
            margin-bottom: 15px;
            min-height: 24px;
        }
        .checkers-buttons {
            display: flex;
            gap: 10px;
            justify-content: center;
        }
        .btn-secondary {
            padding: 10px 20px;
            border-radius: 0;
            font-size: 0.9rem;
            cursor: pointer;
            font-weight: 600;
            display: flex;
            align-items: center;
            gap: 6px;
            border: 2px solid;
            background: #6c757d;
            color: white;
            border-color: #5a6268;
        }
        .btn-secondary:hover {
            background: #5a6268;
        }
        .btn-secondary i {
            width: 14px;
            height: 14px;
        }
        @media (max-width: 768px) {
            .checkers-header h1 {
                font-size: 2rem;
            }
            .checkers-stats {
                flex-direction: column;
                gap: 10px;
            }
            .stat-box {
                width: 100%;
            }
            .checkers-board {
                max-width: 100%;
            }
            .checkers-cell {
                font-size: 1.5rem;
            }
            .checkers-cell.king {
                font-size: 2rem;
            }
        }
    `;
}

