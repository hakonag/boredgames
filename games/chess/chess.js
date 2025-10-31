// Chess Game Module

let chessGame = null;

export function init() {
    const gameContent = document.getElementById('game-content');
    gameContent.innerHTML = `
        createBackButton() + `
        <div class="chess-wrap">
            <div class="chess-main">
                <div class="chess-header">
                    <h1>Chess</h1>
                    <div class="chess-stats">
                        <div class="stat-box">
                            <div class="stat-label">Spiller</div>
                            <div class="stat-value" id="turn-chess">Hvit</div>
                        </div>
                        <div class="stat-box">
                            <div class="stat-label">Status</div>
                            <div class="stat-value" id="status-chess">Aktiv</div>
                        </div>
                    </div>
                </div>
                <div class="chess-game-area">
                    <div class="chess-board" id="chess-board"></div>
                </div>
                <div class="chess-controls">
                    <p id="chess-status" class="chess-status">Hvit spiller først</p>
                    <div class="chess-buttons">
                        <button onclick="window.resetChess()" class="btn-secondary">
                            <i data-lucide="refresh-cw"></i> Reset
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
    injectGameStyles('chess', getGameSpecificStyles());
    if (typeof lucide !== 'undefined') lucide.createIcons();
    
    setupScrollPrevention('chess');
    
    chessGame = new ChessGame();
    window.chessGame = chessGame;
    window.resetChess = () => chessGame.reset();
}

export function cleanup() {
    if (chessGame) {
        chessGame.removeControls();
        chessGame = null;
    }
        removeScrollPrevention('chess');
        removeGameStyles('chess');
}

class ChessGame {
    constructor() {
        this.size = 8;
        this.board = [];
        this.currentPlayer = 'white';
        this.selectedPiece = null;
        this.gameOver = false;
        
        this.pieces = {
            'white': {
                'rook': '♜', 'knight': '♞', 'bishop': '♝',
                'queen': '♛', 'king': '♔', 'pawn': '♙'
            },
            'black': {
                'rook': '♜', 'knight': '♞', 'bishop': '♝',
                'queen': '♛', 'king': '♔', 'pawn': '♟'
            }
        };
        
        this.initBoard();
        this.setupControls();
        this.updateDisplay();
    }

    initBoard() {
        this.board = Array(this.size).fill().map(() => Array(this.size).fill(null));
        
        // Place white pieces (bottom)
        this.board[7] = [
            { color: 'white', type: 'rook' },
            { color: 'white', type: 'knight' },
            { color: 'white', type: 'bishop' },
            { color: 'white', type: 'queen' },
            { color: 'white', type: 'king' },
            { color: 'white', type: 'bishop' },
            { color: 'white', type: 'knight' },
            { color: 'white', type: 'rook' }
        ];
        this.board[6] = Array(8).fill().map(() => ({ color: 'white', type: 'pawn' }));
        
        // Place black pieces (top)
        this.board[0] = [
            { color: 'black', type: 'rook' },
            { color: 'black', type: 'knight' },
            { color: 'black', type: 'bishop' },
            { color: 'black', type: 'queen' },
            { color: 'black', type: 'king' },
            { color: 'black', type: 'bishop' },
            { color: 'black', type: 'knight' },
            { color: 'black', type: 'rook' }
        ];
        this.board[1] = Array(8).fill().map(() => ({ color: 'black', type: 'pawn' }));
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
        this.currentPlayer = 'white';
        this.selectedPiece = null;
        this.gameOver = false;
        this.initBoard();
        document.getElementById('turn-chess').textContent = 'Hvit';
        document.getElementById('status-chess').textContent = 'Aktiv';
        document.getElementById('chess-status').textContent = 'Hvit spiller først';
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
        
        // Simple validation - can move if target is empty or enemy piece
        const target = this.board[toRow][toCol];
        if (target && target.color === piece.color) return;
        
        // Move piece
        this.board[toRow][toCol] = piece;
        this.board[fromRow][fromCol] = null;
        
        // Check for pawn promotion
        if (piece.type === 'pawn') {
            if (piece.color === 'white' && toRow === 0) {
                piece.type = 'queen';
            } else if (piece.color === 'black' && toRow === 7) {
                piece.type = 'queen';
            }
        }
        
        // Check for checkmate (simplified - check if king is captured)
        if (target && target.type === 'king') {
            this.gameOver = true;
            const winner = piece.color === 'white' ? 'Hvit' : 'Svart';
            document.getElementById('status-chess').textContent = 'Vunnet';
            document.getElementById('chess-status').textContent = `${winner} vant!`;
            alert(`${winner} vant!`);
        }
        
        // Switch player
        this.currentPlayer = this.currentPlayer === 'white' ? 'black' : 'white';
        document.getElementById('turn-chess').textContent = this.currentPlayer === 'white' ? 'Hvit' : 'Svart';
        document.getElementById('chess-status').textContent = `${this.currentPlayer === 'white' ? 'Hvit' : 'Svart'} spiller`;
        
        this.selectedPiece = null;
        this.updateDisplay();
    }

    updateDisplay() {
        const boardEl = document.getElementById('chess-board');
        if (!boardEl) return;
        
        boardEl.innerHTML = '';
        
        for (let row = 0; row < this.size; row++) {
            for (let col = 0; col < this.size; col++) {
                const cell = document.createElement('div');
                cell.className = 'chess-cell';
                
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
                    const symbol = this.pieces[piece.color][piece.type];
                    cell.innerHTML = symbol;
                }
                
                cell.addEventListener('click', () => {
                    if (this.gameOver) return;
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
    }
}

function getGameSpecificStyles() {
    return `
.chess-wrap {
            width: 100%;
            max-width: min(700px, 95vw);
            display: flex;
            flex-direction: column;
            align-items: center;
        }
        .chess-header h1 {
            font-size: 3rem;
            font-weight: 800;
            color: #333;
            margin: 0 0 20px 0;
            text-align: center;
        }
        .chess-stats {
            display: flex;
            gap: 15px;
            margin-bottom: 20px;
            justify-content: center;
            flex-wrap: wrap;
        }
        .stat-box {
            background: #f8f9fa;
            border: 2px solid #dee2e6;
            border-radius: 8px;
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
        .chess-game-area {
            width: 100%;
            display: flex;
            justify-content: center;
            margin-bottom: 20px;
        }
        .chess-board {
            display: grid;
            grid-template-columns: repeat(8, 1fr);
            gap: 0;
            background: #8b4513;
            border: 4px solid #654321;
            border-radius: 8px;
            padding: 4px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            max-width: min(500px, calc(95vw - 40px));
            width: 100%;
            aspect-ratio: 1;
        }
        .chess-cell {
            aspect-ratio: 1;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            transition: all 0.2s ease;
            font-size: 2.5rem;
        }
        .chess-cell.light {
            background: #f0d9b5;
        }
        .chess-cell.dark {
            background: #b58863;
        }
        .chess-cell.selected {
            background: #90ee90 !important;
            border: 3px solid #00ff00;
        }
        .chess-cell.piece {
            cursor: pointer;
        }
        .chess-cell.piece.white {
            color: #ffffff;
            text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.8);
        }
        .chess-cell.piece.black {
            color: #000000;
        }
        .chess-cell:hover:not(.piece) {
            background: #e0e0e0 !important;
        }
        .chess-controls {
            text-align: center;
        }
        .chess-status {
            color: #333;
            font-size: 1rem;
            font-weight: 600;
            margin-bottom: 15px;
            min-height: 24px;
        }
        .chess-buttons {
            display: flex;
            gap: 10px;
            justify-content: center;
        }
        .btn-secondary {
            padding: 10px 20px;
            border-radius: 6px;
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
            .chess-header h1 {
                font-size: 2rem;
            }
            .chess-stats {
                flex-direction: column;
                gap: 10px;
            }
            .stat-box {
                width: 100%;
            }
            .chess-board {
                max-width: 100%;
            }
            .chess-cell {
                font-size: 2rem;
            }
        }
    `;
}

