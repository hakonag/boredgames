// Chess Game Module
import { createBackButton, setupScrollPrevention, removeScrollPrevention, setupHardReset } from '../../core/gameUtils.js';
import { injectGameStyles, removeGameStyles } from '../../core/gameStyles.js';

let chessGame = null;

export function init() {
    const gameContent = document.getElementById('game-content');
    gameContent.innerHTML = createBackButton() + `
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
                    <div class="chess-board-container">
                        <div class="chess-board" id="chess-board"></div>
                    </div>
                    <div class="chess-captured">
                        <div class="captured-section">
                            <h4>Fanget av Hvit</h4>
                            <div class="captured-pieces" id="captured-white"></div>
                        </div>
                        <div class="captured-section">
                            <h4>Fanget av Svart</h4>
                            <div class="captured-pieces" id="captured-black"></div>
                        </div>
                    </div>
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
        this.validMoves = [];
        this.gameOver = false;
        this.capturedPieces = { white: [], black: [] };
        
        this.pieces = {
            'white': {
                'rook': '♖', 'knight': '♘', 'bishop': '♗',
                'queen': '♕', 'king': '♔', 'pawn': '♙'
            },
            'black': {
                'rook': '♜', 'knight': '♞', 'bishop': '♝',
                'queen': '♛', 'king': '♚', 'pawn': '♟'
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
        this.keyHandler = setupHardReset('chess', (e) => {
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
    }

    reset() {
        this.currentPlayer = 'white';
        this.selectedPiece = null;
        this.validMoves = [];
        this.gameOver = false;
        this.capturedPieces = { white: [], black: [] };
        this.initBoard();
        document.getElementById('turn-chess').textContent = 'Hvit';
        document.getElementById('status-chess').textContent = 'Aktiv';
        document.getElementById('chess-status').textContent = 'Hvit spiller først';
        this.updateCapturedPieces();
        this.updateDisplay();
    }

    getValidMoves(row, col) {
        const piece = this.board[row][col];
        if (!piece) return [];
        
        const moves = [];
        const directions = {
            rook: [[-1,0], [1,0], [0,-1], [0,1]],
            bishop: [[-1,-1], [-1,1], [1,-1], [1,1]],
            queen: [[-1,0], [1,0], [0,-1], [0,1], [-1,-1], [-1,1], [1,-1], [1,1]],
            king: [[-1,0], [1,0], [0,-1], [0,1], [-1,-1], [-1,1], [1,-1], [1,1]],
            knight: [[-2,-1], [-2,1], [-1,-2], [-1,2], [1,-2], [1,2], [2,-1], [2,1]],
            pawn: []
        };
        
        if (piece.type === 'pawn') {
            const direction = piece.color === 'white' ? -1 : 1;
            const startRow = piece.color === 'white' ? 6 : 1;
            
            // Forward move
            if (row + direction >= 0 && row + direction < 8 && !this.board[row + direction][col]) {
                moves.push([row + direction, col]);
                // Double move from start
                if (row === startRow && !this.board[row + 2*direction][col]) {
                    moves.push([row + 2*direction, col]);
                }
            }
            // Capture diagonally
            for (const dc of [-1, 1]) {
                const newCol = col + dc;
                if (newCol >= 0 && newCol < 8) {
                    const target = this.board[row + direction]?.[newCol];
                    if (target && target.color !== piece.color) {
                        moves.push([row + direction, newCol]);
                    }
                }
            }
        } else if (directions[piece.type]) {
            const dirs = directions[piece.type];
            const isSlider = ['rook', 'bishop', 'queen'].includes(piece.type);
            
            for (const [dr, dc] of dirs) {
                if (isSlider) {
                    // Sliding pieces
                    for (let i = 1; i < 8; i++) {
                        const newRow = row + dr * i;
                        const newCol = col + dc * i;
                        if (newRow < 0 || newRow >= 8 || newCol < 0 || newCol >= 8) break;
                        const target = this.board[newRow][newCol];
                        if (!target) {
                            moves.push([newRow, newCol]);
                        } else {
                            if (target.color !== piece.color) {
                                moves.push([newRow, newCol]);
                            }
                            break;
                        }
                    }
                } else {
                    // Jumping pieces (knight, king)
                    const newRow = row + dr;
                    const newCol = col + dc;
                    if (newRow >= 0 && newRow < 8 && newCol >= 0 && newCol < 8) {
                        const target = this.board[newRow][newCol];
                        if (!target || target.color !== piece.color) {
                            moves.push([newRow, newCol]);
                        }
                    }
                }
            }
        }
        
        return moves;
    }

    selectPiece(row, col) {
        const piece = this.board[row][col];
        if (!piece || piece.color !== this.currentPlayer || this.gameOver) return;
        
        this.selectedPiece = { row, col };
        this.validMoves = this.getValidMoves(row, col);
        this.updateDisplay();
    }

    movePiece(toRow, toCol) {
        if (!this.selectedPiece) return;
        
        const { row: fromRow, col: fromCol } = this.selectedPiece;
        const piece = this.board[fromRow][fromCol];
        if (!piece) return;
        
        // Check if move is valid
        const isValidMove = this.validMoves.some(([r, c]) => r === toRow && c === toCol);
        if (!isValidMove) return;
        
        // Capture piece if there is one
        const target = this.board[toRow][toCol];
        if (target) {
            this.capturedPieces[piece.color].push(target);
            this.updateCapturedPieces();
        }
        
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
        this.validMoves = [];
        this.updateDisplay();
    }

    updateCapturedPieces() {
        const whiteEl = document.getElementById('captured-white');
        const blackEl = document.getElementById('captured-black');
        
        if (whiteEl) {
            whiteEl.innerHTML = this.capturedPieces.white.map(p => 
                `<span class="captured-piece ${p.color}">${this.pieces[p.color][p.type]}</span>`
            ).join('');
        }
        
        if (blackEl) {
            blackEl.innerHTML = this.capturedPieces.black.map(p => 
                `<span class="captured-piece ${p.color}">${this.pieces[p.color][p.type]}</span>`
            ).join('');
        }
    }

    updateDisplay() {
        const boardEl = document.getElementById('chess-board');
        if (!boardEl) return;
        
        boardEl.innerHTML = '';
        
        for (let row = 0; row < this.size; row++) {
            for (let col = 0; col < this.size; col++) {
                const cell = document.createElement('div');
                cell.className = 'chess-cell';
                
                // Alternate colors - modern black/white
                if ((row + col) % 2 === 0) {
                    cell.classList.add('light');
                } else {
                    cell.classList.add('dark');
                }
                
                // Highlight selected
                if (this.selectedPiece && this.selectedPiece.row === row && this.selectedPiece.col === col) {
                    cell.classList.add('selected');
                }
                
                // Highlight valid moves
                const isValidMove = this.validMoves.some(([r, c]) => r === row && c === col);
                if (isValidMove) {
                    cell.classList.add('valid-move');
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
                        this.validMoves = [];
                        this.updateDisplay();
                    } else if (this.selectedPiece && isValidMove) {
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
            max-width: min(900px, 95vw);
            display: flex;
            flex-direction: column;
            align-items: center;
            padding: 10px;
            box-sizing: border-box;
        }
        .chess-header h1 {
            font-size: 2.5rem;
            font-weight: 800;
            color: #111;
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
        .chess-game-area {
            display: flex;
            gap: 20px;
            width: 100%;
            max-width: 100%;
            align-items: flex-start;
            justify-content: center;
            flex-wrap: wrap;
        }
        .chess-board-container {
            flex: 1;
            display: flex;
            justify-content: center;
            min-width: 300px;
        }
        .chess-board {
            display: grid;
            grid-template-columns: repeat(8, 1fr);
            gap: 0;
            background: #fff;
            border: 3px solid #333;
            border-radius: 0;
            padding: 2px;
            box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
            max-width: min(600px, calc(95vw - 200px));
            width: 100%;
            aspect-ratio: 1;
        }
        .chess-cell {
            aspect-ratio: 1;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            transition: all 0.15s ease;
            font-size: 3rem;
            font-weight: 500;
            position: relative;
        }
        .chess-cell.light {
            background: #f0d9b5;
        }
        .chess-cell.dark {
            background: #b58863;
        }
        .chess-cell.selected {
            background: #7fc8ff !important;
            box-shadow: inset 0 0 0 3px #007bff;
        }
        .chess-cell.valid-move::before {
            content: '';
            position: absolute;
            width: 30%;
            height: 30%;
            border-radius: 50%;
            background: rgba(0, 123, 255, 0.5);
            z-index: 1;
        }
        .chess-cell.valid-move:has(.piece)::before {
            width: 100%;
            height: 100%;
            border-radius: 0;
            background: rgba(220, 53, 69, 0.3);
            border: 3px solid rgba(220, 53, 69, 0.8);
        }
        .chess-cell.piece {
            cursor: pointer;
            z-index: 2;
            position: relative;
        }
        .chess-cell.piece:hover {
            transform: scale(1.1);
        }
        .chess-cell.piece.white {
            color: #ffffff;
            text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.8);
        }
        .chess-cell.piece.black {
            color: #000000;
            text-shadow: 1px 1px 2px rgba(255, 255, 255, 0.5);
        }
        .chess-captured {
            display: flex;
            flex-direction: column;
            gap: 15px;
            min-width: 150px;
            background: #f8f9fa;
            border: 2px solid #dee2e6;
            border-radius: 0;
            padding: 15px;
        }
        .captured-section h4 {
            margin: 0 0 10px 0;
            font-size: 0.9rem;
            color: #495057;
            font-weight: 600;
        }
        .captured-pieces {
            display: flex;
            flex-wrap: wrap;
            gap: 5px;
            min-height: 30px;
        }
        .captured-piece {
            font-size: 1.5rem;
            display: inline-block;
            opacity: 0.7;
        }
        .captured-piece.white {
            color: #fff;
            text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.8);
        }
        .captured-piece.black {
            color: #000;
        }
        .chess-controls {
            text-align: center;
            width: 100%;
            margin-top: 20px;
        }
        .chess-status {
            color: #111;
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
            .chess-wrap {
                padding: 5px;
            }
            .chess-header h1 {
                font-size: 2rem;
                margin-bottom: 15px;
            }
            .chess-stats {
                flex-direction: column;
                gap: 10px;
                width: 100%;
            }
            .stat-box {
                width: 100%;
                padding: 12px 20px;
            }
            .chess-game-area {
                flex-direction: column;
                gap: 15px;
            }
            .chess-board-container {
                width: 100%;
            }
            .chess-board {
                max-width: 100%;
            }
            .chess-cell {
                font-size: 2rem;
            }
            .chess-captured {
                width: 100%;
                flex-direction: row;
                justify-content: space-around;
            }
            .captured-section {
                flex: 1;
            }
        }
        @media (max-width: 480px) {
            .chess-cell {
                font-size: 1.5rem;
            }
            .chess-header h1 {
                font-size: 1.75rem;
            }
        }
    `;
}
