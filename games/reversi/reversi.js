// Reversi (Othello) Game Module

let reversiGame = null;

export function init() {
    const gameContent = document.getElementById('game-content');
    gameContent.innerHTML = `
        <button class="back-button-tetris" onclick="window.location.href='https://hakonag.github.io/boredgames/'">
            <i data-lucide="house"></i> Tilbake
        </button>
        <div class="reversi-wrap">
            <div class="reversi-main">
                <div class="reversi-header">
                    <h1>Reversi</h1>
                    <div class="reversi-stats">
                        <div class="stat-box">
                            <div class="stat-label">Spiller</div>
                            <div class="stat-value" id="turn-reversi">Svart</div>
                        </div>
                        <div class="stat-box">
                            <div class="stat-label">Svart</div>
                            <div class="stat-value" id="black-count">2</div>
                        </div>
                        <div class="stat-box">
                            <div class="stat-label">Hvit</div>
                            <div class="stat-value" id="white-count">2</div>
                        </div>
                    </div>
                </div>
                <div class="reversi-game-area">
                    <div class="reversi-board" id="reversi-board"></div>
                </div>
                <div class="reversi-controls">
                    <p id="reversi-status" class="reversi-status">Svart spiller først</p>
                    <div class="reversi-buttons">
                        <button onclick="window.resetReversi()" class="btn-secondary">
                            <i data-lucide="refresh-cw"></i> Reset
                        </button>
                    </div>
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
    window.reversiScrollPrevent = { wheel: preventScroll, touchmove: preventScroll };
    
    reversiGame = new ReversiGame();
    window.reversiGame = reversiGame;
    window.resetReversi = () => reversiGame.reset();
}

export function cleanup() {
    if (reversiGame) {
        reversiGame.removeControls();
        reversiGame = null;
    }
    // Remove scroll prevention
    if (window.reversiScrollPrevent) {
        window.removeEventListener('wheel', window.reversiScrollPrevent.wheel);
        window.removeEventListener('touchmove', window.reversiScrollPrevent.touchmove);
        delete window.reversiScrollPrevent;
    }
    const styleEl = document.getElementById('reversi-style');
    if (styleEl) styleEl.remove();
}

class ReversiGame {
    constructor() {
        this.size = 8;
        this.board = Array(this.size).fill().map(() => Array(this.size).fill(null));
        this.currentPlayer = 'black';
        this.gameOver = false;
        
        // Initial setup
        this.board[3][3] = 'white';
        this.board[3][4] = 'black';
        this.board[4][3] = 'black';
        this.board[4][4] = 'white';
        
        this.setupControls();
        this.updateDisplay();
    }

    setupControls() {
        // Controls handled in updateDisplay
    }

    removeControls() {
        // Cleanup handled by DOM removal
    }

    reset() {
        this.board = Array(this.size).fill().map(() => Array(this.size).fill(null));
        this.currentPlayer = 'black';
        this.gameOver = false;
        
        // Initial setup
        this.board[3][3] = 'white';
        this.board[3][4] = 'black';
        this.board[4][3] = 'black';
        this.board[4][4] = 'white';
        
        document.getElementById('turn-reversi').textContent = 'Svart';
        document.getElementById('reversi-status').textContent = 'Svart spiller først';
        this.updateDisplay();
    }

    isValidMove(row, col) {
        if (this.board[row][col] !== null) return false;
        
        const directions = [
            [-1, -1], [-1, 0], [-1, 1],
            [0, -1],           [0, 1],
            [1, -1],  [1, 0],  [1, 1]
        ];
        
        for (const [dr, dc] of directions) {
            let r = row + dr;
            let c = col + dc;
            let foundOpponent = false;
            
            while (r >= 0 && r < this.size && c >= 0 && c < this.size) {
                if (this.board[r][c] === null) break;
                if (this.board[r][c] === this.currentPlayer) {
                    if (foundOpponent) return true;
                    break;
                }
                foundOpponent = true;
                r += dr;
                c += dc;
            }
        }
        
        return false;
    }

    makeMove(row, col) {
        if (this.gameOver || !this.isValidMove(row, col)) return;
        
        this.board[row][col] = this.currentPlayer;
        
        // Flip pieces
        const directions = [
            [-1, -1], [-1, 0], [-1, 1],
            [0, -1],           [0, 1],
            [1, -1],  [1, 0],  [1, 1]
        ];
        
        for (const [dr, dc] of directions) {
            let r = row + dr;
            let c = col + dc;
            const toFlip = [];
            
            while (r >= 0 && r < this.size && c >= 0 && c < this.size) {
                if (this.board[r][c] === null) break;
                if (this.board[r][c] === this.currentPlayer) {
                    toFlip.forEach(([fr, fc]) => this.board[fr][fc] = this.currentPlayer);
                    break;
                }
                toFlip.push([r, c]);
                r += dr;
                c += dc;
            }
        }
        
        // Switch player
        this.currentPlayer = this.currentPlayer === 'black' ? 'white' : 'black';
        document.getElementById('turn-reversi').textContent = this.currentPlayer === 'black' ? 'Svart' : 'Hvit';
        document.getElementById('reversi-status').textContent = `${this.currentPlayer === 'black' ? 'Svart' : 'Hvit'} spiller`;
        
        // Check if game is over
        const hasValidMoves = this.hasValidMoves();
        if (!hasValidMoves) {
            this.gameOver = true;
            const counts = this.countPieces();
            const winner = counts.black > counts.white ? 'Svart' : counts.white > counts.black ? 'Hvit' : 'Uavgjort';
            document.getElementById('reversi-status').textContent = `Game Over! ${winner} vant!`;
            alert(`Game Over! ${winner} vant!`);
        }
        
        this.updateDisplay();
    }

    hasValidMoves() {
        for (let row = 0; row < this.size; row++) {
            for (let col = 0; col < this.size; col++) {
                if (this.isValidMove(row, col)) return true;
            }
        }
        return false;
    }

    countPieces() {
        let black = 0, white = 0;
        for (let row = 0; row < this.size; row++) {
            for (let col = 0; col < this.size; col++) {
                if (this.board[row][col] === 'black') black++;
                if (this.board[row][col] === 'white') white++;
            }
        }
        return { black, white };
    }

    updateDisplay() {
        const boardEl = document.getElementById('reversi-board');
        if (!boardEl) return;
        
        boardEl.innerHTML = '';
        
        const counts = this.countPieces();
        document.getElementById('black-count').textContent = counts.black;
        document.getElementById('white-count').textContent = counts.white;
        
        for (let row = 0; row < this.size; row++) {
            for (let col = 0; col < this.size; col++) {
                const cell = document.createElement('div');
                cell.className = 'reversi-cell';
                cell.dataset.row = row;
                cell.dataset.col = col;
                
                // Alternate colors
                if ((row + col) % 2 === 0) {
                    cell.classList.add('light');
                } else {
                    cell.classList.add('dark');
                }
                
                const piece = this.board[row][col];
                if (piece) {
                    cell.classList.add('piece', piece);
                    cell.innerHTML = piece === 'black' ? '⚫' : '⚪';
                } else if (!this.gameOver && this.isValidMove(row, col)) {
                    cell.classList.add('valid');
                    cell.style.cursor = 'pointer';
                    cell.addEventListener('click', () => this.makeMove(row, col));
                }
                
                boardEl.appendChild(cell);
            }
        }
    }
}

function injectStyles() {
    if (document.getElementById('reversi-style')) return;
    const style = document.createElement('style');
    style.id = 'reversi-style';
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
            background: #ffffff;
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
        .reversi-wrap {
            width: 100%;
            max-width: 700px;
            display: flex;
            flex-direction: column;
            align-items: center;
        }
        .reversi-header h1 {
            font-size: 3rem;
            font-weight: 800;
            color: #333;
            margin: 0 0 20px 0;
            text-align: center;
        }
        .reversi-stats {
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
        .reversi-game-area {
            width: 100%;
            display: flex;
            justify-content: center;
            margin-bottom: 20px;
        }
        .reversi-board {
            display: grid;
            grid-template-columns: repeat(8, 1fr);
            gap: 2px;
            background: #228b22;
            border: 4px solid #006400;
            border-radius: 8px;
            padding: 4px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            max-width: 500px;
            width: 100%;
            aspect-ratio: 1;
        }
        .reversi-cell {
            aspect-ratio: 1;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 2rem;
        }
        .reversi-cell.light {
            background: #90ee90;
        }
        .reversi-cell.dark {
            background: #228b22;
        }
        .reversi-cell.valid {
            background: rgba(255, 255, 0, 0.3);
            cursor: pointer;
        }
        .reversi-cell.valid:hover {
            background: rgba(255, 255, 0, 0.5);
        }
        .reversi-cell.piece {
            font-weight: 700;
        }
        .reversi-controls {
            text-align: center;
        }
        .reversi-status {
            color: #333;
            font-size: 1rem;
            font-weight: 600;
            margin-bottom: 15px;
            min-height: 24px;
        }
        .reversi-buttons {
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
            .reversi-header h1 {
                font-size: 2rem;
            }
            .reversi-stats {
                flex-direction: column;
                gap: 10px;
            }
            .stat-box {
                width: 100%;
            }
            .reversi-board {
                max-width: 100%;
            }
            .reversi-cell {
                font-size: 1.5rem;
            }
        }
    `;
    document.head.appendChild(style);
}

