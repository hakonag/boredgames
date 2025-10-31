// Tic-Tac-Toe Game Module
import { createBackButton, setupScrollPrevention, removeScrollPrevention, setupHardReset } from '../../core/gameUtils.js';
import { injectGameStyles, removeGameStyles } from '../../core/gameStyles.js';

let tictactoeGame = null;

export function init() {
    const gameContent = document.getElementById('game-content');
    gameContent.innerHTML = createBackButton() + `
        <div class="tictactoe-wrap">
            <div class="tictactoe-main">
                <div class="tictactoe-header">
                    <h1>Tic-Tac-Toe</h1>
                    <div class="tictactoe-stats">
                        <div class="stat-box">
                            <div class="stat-label">Spiller</div>
                            <div class="stat-value" id="turn-tictactoe">X</div>
                        </div>
                        <div class="stat-box">
                            <div class="stat-label">X Vant</div>
                            <div class="stat-value" id="x-wins">0</div>
                        </div>
                        <div class="stat-box">
                            <div class="stat-label">O Vant</div>
                            <div class="stat-value" id="o-wins">0</div>
                        </div>
                    </div>
                </div>
                <div class="tictactoe-game-area">
                    <div class="tictactoe-board" id="tictactoe-board"></div>
                </div>
                <div class="tictactoe-controls">
                    <p id="tictactoe-status" class="tictactoe-status">X spiller først</p>
                    <div class="tictactoe-buttons">
                        <button onclick="window.resetTictactoe()" class="btn-secondary">
                            <i data-lucide="refresh-cw"></i> Reset
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
    injectGameStyles('tictactoe', getGameSpecificStyles());
    if (typeof lucide !== 'undefined') lucide.createIcons();
    
    setupScrollPrevention('tictactoe');
    
    tictactoeGame = new TicTacToeGame();
    window.tictactoeGame = tictactoeGame;
    window.resetTictactoe = () => tictactoeGame.reset();
}

export function cleanup() {
    if (tictactoeGame) {
        tictactoeGame.removeControls();
        tictactoeGame = null;
    }
        removeScrollPrevention('tictactoe');
        removeGameStyles('tictactoe');
}

class TicTacToeGame {
    constructor() {
        this.size = 3;
        this.board = Array(this.size).fill().map(() => Array(this.size).fill(null));
        this.currentPlayer = 'X';
        this.gameOver = false;
        this.xWins = parseInt(localStorage.getItem('tictactoe-x-wins') || '0');
        this.oWins = parseInt(localStorage.getItem('tictactoe-o-wins') || '0');
        
        this.setupControls();
        this.updateDisplay();
    }

    setupControls() {
        this.keyHandler = setupHardReset('tictactoe', (e) => {
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
        this.board = Array(this.size).fill().map(() => Array(this.size).fill(null));
        this.currentPlayer = 'X';
        this.gameOver = false;
        document.getElementById('turn-tictactoe').textContent = 'X';
        document.getElementById('tictactoe-status').textContent = 'X spiller først';
        this.updateDisplay();
    }

    makeMove(row, col) {
        if (this.gameOver || this.board[row][col] !== null) return;
        
        this.board[row][col] = this.currentPlayer;
        
        // Check win condition
        if (this.checkWin(this.currentPlayer)) {
            this.gameOver = true;
            if (this.currentPlayer === 'X') {
                this.xWins++;
                localStorage.setItem('tictactoe-x-wins', String(this.xWins));
            } else {
                this.oWins++;
                localStorage.setItem('tictactoe-o-wins', String(this.oWins));
            }
            document.getElementById('tictactoe-status').textContent = `${this.currentPlayer} vant!`;
            document.getElementById('x-wins').textContent = this.xWins;
            document.getElementById('o-wins').textContent = this.oWins;
            alert(`${this.currentPlayer} vant!`);
        } else if (this.isBoardFull()) {
            this.gameOver = true;
            document.getElementById('tictactoe-status').textContent = 'Uavgjort!';
            alert('Uavgjort!');
        } else {
            this.currentPlayer = this.currentPlayer === 'X' ? 'O' : 'X';
            document.getElementById('turn-tictactoe').textContent = this.currentPlayer;
            document.getElementById('tictactoe-status').textContent = `${this.currentPlayer} spiller`;
        }
        
        this.updateDisplay();
    }

    checkWin(player) {
        // Check rows
        for (let row = 0; row < this.size; row++) {
            if (this.board[row].every(cell => cell === player)) return true;
        }
        
        // Check columns
        for (let col = 0; col < this.size; col++) {
            if (this.board.every(row => row[col] === player)) return true;
        }
        
        // Check diagonals
        if (this.board[0][0] === player && this.board[1][1] === player && this.board[2][2] === player) return true;
        if (this.board[0][2] === player && this.board[1][1] === player && this.board[2][0] === player) return true;
        
        return false;
    }

    isBoardFull() {
        return this.board.every(row => row.every(cell => cell !== null));
    }

    updateDisplay() {
        const boardEl = document.getElementById('tictactoe-board');
        if (!boardEl) return;
        
        boardEl.innerHTML = '';
        
        for (let row = 0; row < this.size; row++) {
            for (let col = 0; col < this.size; col++) {
                const cell = document.createElement('div');
                cell.className = 'tictactoe-cell';
                cell.dataset.row = row;
                cell.dataset.col = col;
                
                const value = this.board[row][col];
                if (value) {
                    cell.textContent = value;
                    cell.classList.add(value.toLowerCase());
                }
                
                if (!this.gameOver && !value) {
                    cell.addEventListener('click', () => this.makeMove(row, col));
                    cell.style.cursor = 'pointer';
                }
                
                boardEl.appendChild(cell);
            }
        }
        
        // Update win counts
        document.getElementById('x-wins').textContent = this.xWins;
        document.getElementById('o-wins').textContent = this.oWins;
    }
}

function getGameSpecificStyles() {
    return `
.tictactoe-wrap {
            width: 100%;
            max-width: min(500px, 95vw);
            display: flex;
            flex-direction: column;
            align-items: center;
        }
        .tictactoe-header h1 {
            font-size: 2.5rem;
            font-weight: 800;
            color: #111;
            margin: 0 0 20px 0;
            text-align: center;
        }
        .tictactoe-stats {
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
        .tictactoe-game-area {
            width: 100%;
            display: flex;
            justify-content: center;
            margin-bottom: 20px;
        }
        .tictactoe-board {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 8px;
            background: #333;
            border: 4px solid #555;
            border-radius: 0;
            padding: 8px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            max-width: min(400px, calc(95vw - 40px));
            width: 100%;
            aspect-ratio: 1;
        }
        .tictactoe-cell {
            aspect-ratio: 1;
            background: #fff;
            border: 2px solid #ddd;
            border-radius: 0;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 4rem;
            font-weight: 800;
            transition: all 0.2s ease;
        }
        .tictactoe-cell:hover {
            background: #f0f0f0;
            border-color: #0d6efd;
        }
        .tictactoe-cell.x {
            color: #dc3545;
        }
        .tictactoe-cell.o {
            color: #0d6efd;
        }
        .tictactoe-controls {
            text-align: center;
        }
        .tictactoe-status {
            color: #111;
            font-size: 1rem;
            font-weight: 600;
            margin-bottom: 15px;
            min-height: 24px;
        }
        .tictactoe-buttons {
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
            .tictactoe-header h1 {
                font-size: 2rem;
            }
            .tictactoe-stats {
                flex-direction: column;
                gap: 10px;
            }
            .stat-box {
                width: 100%;
            }
            .tictactoe-board {
                max-width: 100%;
            }
            .tictactoe-cell {
                font-size: 3rem;
            }
        }
    `;
}

