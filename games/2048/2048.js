// 2048 Game Module
import { displayHighScores, showScoreModal } from '../../core/highScores.js';
import { createBackButton, setupScrollPrevention, removeScrollPrevention, setupHardReset } from '../../core/gameUtils.js';
import { injectGameStyles, removeGameStyles } from '../../core/gameStyles.js';

let game2048 = null;

export function init() {
    const gameContent = document.getElementById('game-content');
    gameContent.innerHTML = createBackButton() + `
        <div class="game-2048-wrap">
            <div class="game-2048-main">
                <div class="game-2048-header">
                    <h1>2048</h1>
                    <div class="game-2048-stats">
                        <div class="stat-box">
                            <div class="stat-label">Score</div>
                            <div class="stat-value" id="score-2048">0</div>
                        </div>
                        <div class="stat-box">
                            <div class="stat-label">Best</div>
                            <div class="stat-value" id="best-2048">0</div>
                        </div>
                    </div>
                </div>
                <div class="game-2048-board" id="board-2048"></div>
                <div class="game-2048-controls">
                    <p class="game-2048-instructions">Bruk piltastene eller swipe for å flytte</p>
                    <div class="game-2048-buttons">
                        <button onclick="window.newGame2048()" class="btn-primary">
                            <i data-lucide="refresh-cw"></i> Nytt spill
                        </button>
                    </div>
                </div>
                <div class="game-2048-leaderboard">
                    <h3>Toppresultater</h3>
                    <div id="2048-high-scores" class="scores-list"></div>
                </div>
            </div>
        </div>
    `;

    injectGameStyles('2048', getGameSpecificStyles());
    if (typeof lucide !== 'undefined') lucide.createIcons();
    
    setupScrollPrevention('2048');
    
    game2048 = new Game2048();
    window.game2048 = game2048;
    window.newGame2048 = () => game2048.newGame();
    
    // Load best score
    const best = localStorage.getItem('2048-best');
    if (best) {
        document.getElementById('best-2048').textContent = parseInt(best).toLocaleString();
    }
    
    // Load leaderboard
    displayHighScores('2048-high-scores', '2048', 30).catch(() => {});
}

export function cleanup() {
    if (game2048) {
        game2048.removeControls();
        game2048 = null;
    }
    removeScrollPrevention('2048');
    removeGameStyles('2048');
}

class Game2048 {
    constructor() {
        this.size = 4;
        this.board = [];
        this.score = 0;
        this.best = parseInt(localStorage.getItem('2048-best') || '0');
        this.prevBoard = null;
        this.moving = false;
        this.setupControls();
        this.newGame();
    }

    newGame() {
        this.board = Array(this.size).fill().map(() => Array(this.size).fill(0));
        this.score = 0;
        this.addRandomTile();
        this.addRandomTile();
        this.updateDisplay();
    }

    addRandomTile() {
        const empty = [];
        for (let i = 0; i < this.size; i++) {
            for (let j = 0; j < this.size; j++) {
                if (this.board[i][j] === 0) empty.push([i, j]);
            }
        }
        if (empty.length === 0) return false;
        const [i, j] = empty[Math.floor(Math.random() * empty.length)];
        this.board[i][j] = Math.random() < 0.9 ? 2 : 4;
        return true;
    }

    move(direction) {
        if (this.moving) return; // Prevent moves during animation
        const oldBoard = this.board.map(row => [...row]);
        this.prevBoard = oldBoard.map(row => [...row]);
        this.moving = true;

        if (direction === 'left') {
            for (let i = 0; i < this.size; i++) {
                let row = [...this.board[i]].filter(x => x !== 0);
                for (let j = 0; j < row.length - 1; j++) {
                    if (row[j] === row[j + 1]) {
                        row[j] *= 2;
                        this.score += row[j];
                        row[j + 1] = 0;
                    }
                }
                row = row.filter(x => x !== 0);
                while (row.length < this.size) row.push(0);
                this.board[i] = row;
            }
        } else if (direction === 'right') {
            for (let i = 0; i < this.size; i++) {
                let row = [...this.board[i]].filter(x => x !== 0);
                for (let j = row.length - 1; j > 0; j--) {
                    if (row[j] === row[j - 1]) {
                        row[j] *= 2;
                        this.score += row[j];
                        row[j - 1] = 0;
                    }
                }
                row = row.filter(x => x !== 0);
                while (row.length < this.size) row.unshift(0);
                this.board[i] = row;
            }
        } else if (direction === 'up') {
            for (let j = 0; j < this.size; j++) {
                let col = [];
                for (let i = 0; i < this.size; i++) {
                    if (this.board[i][j] !== 0) col.push(this.board[i][j]);
                }
                for (let k = 0; k < col.length - 1; k++) {
                    if (col[k] === col[k + 1]) {
                        col[k] *= 2;
                        this.score += col[k];
                        col[k + 1] = 0;
                    }
                }
                col = col.filter(x => x !== 0);
                while (col.length < this.size) col.push(0);
                for (let i = 0; i < this.size; i++) {
                    this.board[i][j] = col[i];
                }
            }
        } else if (direction === 'down') {
            for (let j = 0; j < this.size; j++) {
                let col = [];
                for (let i = 0; i < this.size; i++) {
                    if (this.board[i][j] !== 0) col.push(this.board[i][j]);
                }
                for (let k = col.length - 1; k > 0; k--) {
                    if (col[k] === col[k - 1]) {
                        col[k] *= 2;
                        this.score += col[k];
                        col[k - 1] = 0;
                    }
                }
                col = col.filter(x => x !== 0);
                while (col.length < this.size) col.unshift(0);
                for (let i = 0; i < this.size; i++) {
                    this.board[i][j] = col[i];
                }
            }
        }

        const moved = JSON.stringify(oldBoard) !== JSON.stringify(this.board);
        if (moved) {
            this.updateDisplayWithAnimation(oldBoard);
            setTimeout(() => {
                this.addRandomTile();
                this.updateDisplay();
                this.moving = false;
                this.checkGameOver();
            }, 200);
        } else {
            this.moving = false;
        }
    }

    checkGameOver() {
        // Check for win
        for (let i = 0; i < this.size; i++) {
            for (let j = 0; j < this.size; j++) {
                if (this.board[i][j] === 2048) {
                    setTimeout(() => {
                        alert('Gratulerer! Du nådde 2048!');
                    }, 100);
                }
            }
        }

        // Check for game over
        let canMove = false;
        for (let i = 0; i < this.size; i++) {
            for (let j = 0; j < this.size; j++) {
                if (this.board[i][j] === 0) canMove = true;
                if (j < this.size - 1 && this.board[i][j] === this.board[i][j + 1]) canMove = true;
                if (i < this.size - 1 && this.board[i][j] === this.board[i + 1][j]) canMove = true;
            }
        }

        if (!canMove) {
            setTimeout(async () => {
                // Check if this is a high score
                const { getHighScores } = await import('../../core/highScores.js');
                const scores = await getHighScores('2048');
                const minHighScore = scores.length > 0 ? Math.min(...scores.map(s => s.score)) : 0;
                if (scores.length < 30 || this.score > minHighScore) {
                    showScoreModal('2048', this.score, 
                        () => {
                            setTimeout(() => { displayHighScores('2048-high-scores', '2048', 30); }, 200);
                        },
                        () => {
                            setTimeout(() => { displayHighScores('2048-high-scores', '2048', 30); }, 200);
                        }
                    );
                }
                this.newGame();
            }, 100);
        }
    }

    updateDisplayWithAnimation(oldBoard) {
        const boardEl = document.getElementById('board-2048');
        if (!boardEl) return;

        boardEl.innerHTML = '';
        
        // Create cell grid structure
        for (let i = 0; i < this.size; i++) {
            for (let j = 0; j < this.size; j++) {
                const cell = document.createElement('div');
                cell.className = 'cell-2048';
                cell.dataset.row = i;
                cell.dataset.col = j;
                boardEl.appendChild(cell);
            }
        }

        // Track which tiles from old board have been used
        const usedOldTiles = Array(this.size).fill().map(() => Array(this.size).fill(false));

        // Add tiles with animation
        requestAnimationFrame(() => {
            for (let i = 0; i < this.size; i++) {
                for (let j = 0; j < this.size; j++) {
                    if (this.board[i][j] !== 0) {
                        const cell = boardEl.querySelector(`.cell-2048[data-row="${i}"][data-col="${j}"]`);
                        if (!cell) continue;
                        
                        const tile = document.createElement('div');
                        tile.className = `tile-2048 tile-${this.board[i][j]}`;
                        tile.textContent = this.board[i][j];
                        
                        // Find source position in old board
                        let fromRow = i, fromCol = j;
                        let foundSource = false;
                        
                        if (oldBoard) {
                            // Find matching tile in old board that could have moved here
                            for (let oldI = 0; oldI < this.size; oldI++) {
                                for (let oldJ = 0; oldJ < this.size; oldJ++) {
                                    if (usedOldTiles[oldI][oldJ]) continue;
                                    
                                    const oldValue = oldBoard[oldI][oldJ];
                                    const newValue = this.board[i][j];
                                    
                                    // Check if this is the same tile (moved)
                                    if (oldValue === newValue && (oldI !== i || oldJ !== j)) {
                                        // Check if it's in the correct direction (same row or column)
                                        if ((oldI === i && oldJ !== j) || (oldJ === j && oldI !== i)) {
                                            fromRow = oldI;
                                            fromCol = oldJ;
                                            usedOldTiles[oldI][oldJ] = true;
                                            foundSource = true;
                                            break;
                                        }
                                    }
                                    // Check if this is a merged tile (one of the two that merged)
                                    else if (oldValue === newValue / 2 && (oldI !== i || oldJ !== j)) {
                                        // Check if it's in the correct direction
                                        if ((oldI === i && oldJ !== j) || (oldJ === j && oldI !== i)) {
                                            // Check if the other tile is also in the correct direction
                                            let otherFound = false;
                                            for (let otherI = 0; otherI < this.size; otherI++) {
                                                for (let otherJ = 0; otherJ < this.size; otherJ++) {
                                                    if (otherI === oldI && otherJ === oldJ) continue;
                                                    if (usedOldTiles[otherI][otherJ]) continue;
                                                    if (oldBoard[otherI][otherJ] === oldValue && 
                                                        ((otherI === i && otherJ !== j) || (otherJ === j && otherI !== i))) {
                                                        otherFound = true;
                                                        break;
                                                    }
                                                }
                                                if (otherFound) break;
                                            }
                                            if (otherFound) {
                                                fromRow = oldI;
                                                fromCol = oldJ;
                                                usedOldTiles[oldI][oldJ] = true;
                                                foundSource = true;
                                                break;
                                            }
                                        }
                                    }
                                }
                                if (foundSource) break;
                            }
                        }
                        
                        // Set animation properties if tile moved
                        if (foundSource && (fromRow !== i || fromCol !== j)) {
                            const deltaRow = fromRow - i; // Negative = moving down, positive = moving up
                            const deltaCol = fromCol - j; // Negative = moving right, positive = moving left
                            tile.style.setProperty('--from-row', deltaRow);
                            tile.style.setProperty('--from-col', deltaCol);
                            tile.classList.add('tile-sliding');
                        } else {
                            // New tile (spawned randomly)
                            tile.classList.add('tile-new');
                        }
                        
                        cell.appendChild(tile);
                    }
                }
            }
        });
    }

    updateDisplay() {
        const boardEl = document.getElementById('board-2048');
        const scoreEl = document.getElementById('score-2048');
        const bestEl = document.getElementById('best-2048');

        if (scoreEl) scoreEl.textContent = this.score.toLocaleString();
        if (this.score > this.best) {
            this.best = this.score;
            localStorage.setItem('2048-best', String(this.best));
            if (bestEl) bestEl.textContent = this.best.toLocaleString();
        }

        if (boardEl) {
            boardEl.innerHTML = '';
            
            // Create cell grid structure first
            for (let i = 0; i < this.size; i++) {
                for (let j = 0; j < this.size; j++) {
                    const cell = document.createElement('div');
                    cell.className = 'cell-2048';
                    cell.dataset.row = i;
                    cell.dataset.col = j;
                    boardEl.appendChild(cell);
                }
            }
            
            // Add tiles inside cells
            for (let i = 0; i < this.size; i++) {
                for (let j = 0; j < this.size; j++) {
                    if (this.board[i][j] !== 0) {
                        const cell = boardEl.querySelector(`.cell-2048[data-row="${i}"][data-col="${j}"]`);
                        if (cell) {
                            const tile = document.createElement('div');
                            tile.className = `tile-2048 tile-${this.board[i][j]}`;
                            tile.textContent = this.board[i][j];
                            cell.appendChild(tile);
                        }
                    }
                }
            }
        }
    }

    setupControls() {
        this.keyHandler = setupHardReset('2048', (e) => {
            if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
                e.preventDefault();
                const dir = e.key.replace('Arrow', '').toLowerCase();
                this.move(dir);
            }
        });
        document.addEventListener('keydown', this.keyHandler);

        // Touch controls
        let startX, startY;
        this.touchStart = (e) => {
            startX = e.touches[0].clientX;
            startY = e.touches[0].clientY;
        };
        this.touchEnd = (e) => {
            if (!startX || !startY) return;
            const endX = e.changedTouches[0].clientX;
            const endY = e.changedTouches[0].clientY;
            const diffX = endX - startX;
            const diffY = endY - startY;
            if (Math.abs(diffX) > Math.abs(diffY)) {
                if (Math.abs(diffX) > 30) {
                    this.move(diffX > 0 ? 'right' : 'left');
                }
            } else {
                if (Math.abs(diffY) > 30) {
                    this.move(diffY > 0 ? 'down' : 'up');
                }
            }
            startX = startY = null;
        };
        document.addEventListener('touchstart', this.touchStart, { passive: true });
        document.addEventListener('touchend', this.touchEnd, { passive: true });
    }

    removeControls() {
        document.removeEventListener('keydown', this.keyHandler);
        document.removeEventListener('touchstart', this.touchStart);
        document.removeEventListener('touchend', this.touchEnd);
    }
}

function getGameSpecificStyles() {
    return `
        body { background: #faf8ef; }
        .game-2048-wrap {
            width: 100%;
            max-width: min(500px, 95vw);
            display: flex;
            flex-direction: column;
            align-items: center;
        }
        .game-2048-header h1 {
            font-size: 2.5rem;
            font-weight: 800;
            color: #776e65;
            margin: 0 0 20px 0;
            text-align: center;
        }
        .game-2048-stats {
            display: flex;
            gap: 10px;
            margin-bottom: 20px;
        }
        .stat-box {
            background: #bbada0;
            border-radius: 0;
            padding: 10px 20px;
            text-align: center;
            flex: 1;
        }
        .stat-label {
            color: #eee4da;
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
        .game-2048-board {
            background: #bbada0;
            border-radius: 0;
            padding: 10px;
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            grid-template-rows: repeat(4, 1fr);
            gap: 10px;
            width: 100%;
            aspect-ratio: 1;
            margin-bottom: 20px;
        }
        .game-2048-board {
            position: relative;
        }
        
        .cell-2048 {
            position: relative;
            background: #cdc1b4;
            border-radius: 0;
        }
        
        .tile-2048 {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: #eee4da;
            border-radius: 0;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 2rem;
            font-weight: 800;
            color: #776e65;
            z-index: 1;
            transition: transform 0.15s ease-out;
        }
        
        .tile-2048.tile-empty {
            background: #cdc1b4;
            position: static;
            z-index: 0;
        }
        
        .tile-sliding {
            animation: slideIn 0.2s ease-out forwards;
        }
        
        @keyframes slideIn {
            from {
                transform: translate(
                    calc(var(--from-col, 0) * (100% + 10px)),
                    calc(var(--from-row, 0) * (100% + 10px))
                );
            }
            to {
                transform: translate(0, 0);
            }
        }
        
        .tile-2048.tile-new {
            animation: popIn 0.15s ease-out;
        }
        
        @keyframes popIn {
            0% {
                transform: scale(0);
            }
            50% {
                transform: scale(1.1);
            }
            100% {
                transform: scale(1);
            }
        }
        
        /* Classic 2048 colors */
        .tile-2 { background: #eee4da; color: #776e65; font-size: 2rem; }
        .tile-4 { background: #ede0c8; color: #776e65; font-size: 2rem; }
        .tile-8 { background: #f2b179; color: #f9f6f2; font-size: 2rem; }
        .tile-16 { background: #f59563; color: #f9f6f2; font-size: 2rem; }
        .tile-32 { background: #f67c5f; color: #f9f6f2; font-size: 1.8rem; }
        .tile-64 { background: #f65e3b; color: #f9f6f2; font-size: 1.8rem; }
        .tile-128 { background: #edcf72; color: #f9f6f2; font-size: 1.5rem; }
        .tile-256 { background: #edcc61; color: #f9f6f2; font-size: 1.5rem; }
        .tile-512 { background: #edc850; color: #f9f6f2; font-size: 1.5rem; }
        .tile-1024 { background: #edc53f; color: #f9f6f2; font-size: 1.2rem; }
        .tile-2048 { background: #edc22e; color: #f9f6f2; font-size: 1.2rem; }
        
        /* Higher tiles */
        .tile-2048[class*="tile-"]:not(.tile-empty):not(.tile-2):not(.tile-4):not(.tile-8):not(.tile-16):not(.tile-32):not(.tile-64):not(.tile-128):not(.tile-256):not(.tile-512):not(.tile-1024) {
            background: #3c3a32;
            color: #f9f6f2;
            font-size: 1.1rem;
        }
        .game-2048-controls {
            text-align: center;
        }
        .game-2048-instructions {
            color: #776e65;
            font-size: 0.9rem;
            margin-bottom: 15px;
        }
        .game-2048-buttons {
            display: flex;
            gap: 10px;
            justify-content: center;
        }
        .btn-primary {
            background: #8f7a66;
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
            background: #9f8a76;
        }
        .btn-primary i {
            width: 14px;
            height: 14px;
        }
        .game-2048-leaderboard {
            margin-top: 20px;
            padding: 15px;
            background: #faf8ef;
            border: 2px solid #bbada0;
            border-radius: 0;
            width: 100%;
            max-width: min(500px, 95vw);
        }
        .game-2048-leaderboard h3 {
            margin: 0 0 12px 0;
            font-size: 1rem;
            color: #776e65;
            text-align: center;
            font-weight: 600;
        }
        .game-2048-leaderboard .scores-list {
            max-height: 300px;
            overflow-y: auto;
        }
        @media (max-width: 768px) {
            .game-2048-header h1 {
                font-size: 2rem;
            }
            .tile-2048 {
                font-size: 1.5rem;
            }
            .tile-128, .tile-256, .tile-512 {
                font-size: 1.2rem;
            }
            .tile-1024, .tile-2048 {
                font-size: 1rem;
            }
        }
    `;
}

