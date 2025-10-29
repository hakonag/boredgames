// Enkel navigasjon mellom spill
document.addEventListener('DOMContentLoaded', () => {
    const gameCards = document.querySelectorAll('.game-card');
    
    gameCards.forEach(card => {
        card.addEventListener('click', () => {
            const gameType = card.getAttribute('data-game');
            loadGame(gameType);
        });
    });
});

function loadGame(gameType) {
    const container = document.querySelector('.container');
    const gameContainer = document.getElementById('game-container');
    const gameContent = document.getElementById('game-content');
    
    // Clean up previous game (like Tetris controls)
    if (window.tetrisGame && window.tetrisGame.removeControls) {
        window.tetrisGame.removeControls();
    }
    
    // Remove scroll lock
    document.body.style.overflow = '';
    document.body.style.position = '';
    document.documentElement.style.overflow = '';
    
    container.classList.add('hidden');
    gameContainer.classList.remove('hidden');
    
    // Clear previous game
    gameContent.innerHTML = '';
    
    // Remove any existing game styles
    const oldStyle = document.getElementById('game-specific-styles');
    if (oldStyle) oldStyle.remove();
    
    switch(gameType) {
        case 'solitaire':
            initSolitaire();
            break;
        case 'yatzy':
            initYatzy();
            break;
        case 'ludo':
            initLudo();
            break;
        case 'tetris':
            initTetris();
            break;
    }
}

function goHome() {
    // Clean up Tetris controls when leaving
    if (window.tetrisGame && window.tetrisGame.removeControls) {
        window.tetrisGame.removeControls();
    }
    
    // Remove scroll lock
    document.body.style.overflow = '';
    document.body.style.position = '';
    document.documentElement.style.overflow = '';
    
    const container = document.querySelector('.container');
    const gameContainer = document.getElementById('game-container');
    
    container.classList.remove('hidden');
    gameContainer.classList.add('hidden');
}

// ========== TETRIS GAME ==========
let tetrisGame = null;

function initTetris() {
    const gameContent = document.getElementById('game-content');
    gameContent.innerHTML = `
        <h2>🔲 Tetris</h2>
        <div class="tetris-game">
            <div class="tetris-board">
                <canvas id="tetris-canvas" width="300" height="600"></canvas>
                <div class="tetris-info">
                    <p>Poeng: <span id="tetris-score">0</span></p>
                    <p>Linjer: <span id="tetris-lines">0</span></p>
                    <p>Nivå: <span id="tetris-level">1</span></p>
                </div>
            </div>
            <div class="tetris-controls">
                <h3>Kontroller</h3>
                <p>← → Flytt</p>
                <p>↑ Roter</p>
                <p>↓ Raskt fall</p>
                <p>Space Hard drop</p>
                <button onclick="startTetris()" id="tetris-start-btn">Start</button>
                <button onclick="pauseTetris()" id="tetris-pause-btn" style="display:none">Pause</button>
            </div>
        </div>
    `;
    
    // Lock scrolling when Tetris is active
    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.width = '100%';
    document.documentElement.style.overflow = 'hidden';
    
    const style = document.createElement('style');
    style.id = 'game-specific-styles';
    style.textContent = `
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
            overflow-y: auto;
            overflow-x: hidden;
            max-width: 100%;
            margin: 0;
            border-radius: 0;
            padding: 20px;
        }
        .tetris-game {
            display: flex;
            gap: 30px;
            justify-content: center;
            align-items: flex-start;
            flex-wrap: wrap;
            max-width: 100%;
        }
        .tetris-board {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 20px;
        }
        #tetris-canvas {
            border: 3px solid #333;
            background: #000;
            display: block;
        }
        .tetris-info {
            text-align: center;
            font-size: 1.2rem;
        }
        .tetris-controls {
            padding: 20px;
            background: #f5f5f5;
            border-radius: 10px;
            min-width: 200px;
        }
        .tetris-controls h3 {
            margin-bottom: 15px;
        }
        .tetris-controls p {
            margin: 8px 0;
        }
        .tetris-controls button {
            background: #667eea;
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 8px;
            font-size: 1rem;
            cursor: pointer;
            margin-top: 15px;
            width: 100%;
        }
        .tetris-controls button:hover {
            background: #5568d3;
        }
    `;
    document.head.appendChild(style);
    
    tetrisGame = new TetrisGame();
    window.tetrisGame = tetrisGame; // Store globally for cleanup
}

class TetrisGame {
    constructor() {
        this.canvas = document.getElementById('tetris-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.grid = Array(20).fill().map(() => Array(10).fill(0));
        this.currentPiece = null;
        this.score = 0;
        this.lines = 0;
        this.level = 1;
        this.gameLoop = null;
        this.isPaused = false;
        this.fallTime = 0;
        this.fallInterval = 1000;
        
        this.pieces = [
            [[1,1,1,1]], // I
            [[1,1],[1,1]], // O
            [[0,1,0],[1,1,1]], // T
            [[1,1,0],[0,1,1]], // S
            [[0,1,1],[1,1,0]], // Z
            [[1,0,0],[1,1,1]], // L
            [[0,0,1],[1,1,1]]  // J
        ];
        
        this.setupControls();
        this.draw();
    }
    
    setupControls() {
        this.keyHandler = (e) => {
            // Prevent default for arrow keys and space when Tetris is active
            if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', ' '].includes(e.key)) {
                // Only prevent default if game is running (not paused and has a piece)
                if (this.currentPiece && !this.isPaused) {
                    e.preventDefault();
                }
            }
            
            // Only handle keys when game is active
            if (this.isPaused || !this.currentPiece) return;
            
            switch(e.key) {
                case 'ArrowLeft':
                    this.movePiece(-1, 0);
                    break;
                case 'ArrowRight':
                    this.movePiece(1, 0);
                    break;
                case 'ArrowDown':
                    this.movePiece(0, 1);
                    break;
                case 'ArrowUp':
                    this.rotatePiece();
                    break;
                case ' ':
                    this.hardDrop();
                    break;
            }
        };
        
        document.addEventListener('keydown', this.keyHandler);
    }
    
    removeControls() {
        if (this.keyHandler) {
            document.removeEventListener('keydown', this.keyHandler);
        }
    }
    
    start() {
        this.spawnPiece();
        this.gameLoop = setInterval(() => {
            if (!this.isPaused) {
                this.update();
                this.draw();
            }
        }, 16);
        
        document.getElementById('tetris-start-btn').style.display = 'none';
        document.getElementById('tetris-pause-btn').style.display = 'block';
    }
    
    pause() {
        this.isPaused = !this.isPaused;
        document.getElementById('tetris-pause-btn').textContent = this.isPaused ? 'Fortsett' : 'Pause';
    }
    
    spawnPiece() {
        const pieceType = this.pieces[Math.floor(Math.random() * this.pieces.length)];
        this.currentPiece = {
            shape: pieceType,
            x: 3,
            y: 0,
            color: `hsl(${Math.random() * 360}, 70%, 50%)`
        };
        
        if (this.checkCollision(this.currentPiece)) {
            clearInterval(this.gameLoop);
            alert(`Spill ferdig! Poeng: ${this.score}`);
            this.reset();
        }
    }
    
    movePiece(dx, dy) {
        const newPiece = {...this.currentPiece, x: this.currentPiece.x + dx, y: this.currentPiece.y + dy};
        if (!this.checkCollision(newPiece)) {
            this.currentPiece = newPiece;
        } else if (dy > 0) {
            this.placePiece();
        }
    }
    
    rotatePiece() {
        const rotated = this.currentPiece.shape[0].map((_, i) =>
            this.currentPiece.shape.map(row => row[i]).reverse()
        );
        const newPiece = {...this.currentPiece, shape: rotated};
        if (!this.checkCollision(newPiece)) {
            this.currentPiece = newPiece;
        }
    }
    
    hardDrop() {
        while (!this.checkCollision({...this.currentPiece, y: this.currentPiece.y + 1})) {
            this.currentPiece.y++;
        }
        this.placePiece();
    }
    
    checkCollision(piece) {
        for (let y = 0; y < piece.shape.length; y++) {
            for (let x = 0; x < piece.shape[y].length; x++) {
                if (piece.shape[y][x]) {
                    const nx = piece.x + x;
                    const ny = piece.y + y;
                    
                    if (nx < 0 || nx >= 10 || ny >= 20) return true;
                    if (ny >= 0 && this.grid[ny][nx]) return true;
                }
            }
        }
        return false;
    }
    
    placePiece() {
        for (let y = 0; y < this.currentPiece.shape.length; y++) {
            for (let x = 0; x < this.currentPiece.shape[y].length; x++) {
                if (this.currentPiece.shape[y][x]) {
                    const ny = this.currentPiece.y + y;
                    const nx = this.currentPiece.x + x;
                    if (ny >= 0) {
                        this.grid[ny][nx] = this.currentPiece.color;
                    }
                }
            }
        }
        
        this.clearLines();
        this.spawnPiece();
    }
    
    clearLines() {
        let linesCleared = 0;
        for (let y = this.grid.length - 1; y >= 0; y--) {
            if (this.grid[y].every(cell => cell !== 0)) {
                this.grid.splice(y, 1);
                this.grid.unshift(Array(10).fill(0));
                linesCleared++;
                y++;
            }
        }
        
        if (linesCleared > 0) {
            this.lines += linesCleared;
            this.score += linesCleared * 100 * this.level;
            this.level = Math.floor(this.lines / 10) + 1;
            this.fallInterval = Math.max(100, 1000 - (this.level - 1) * 100);
            
            document.getElementById('tetris-score').textContent = this.score;
            document.getElementById('tetris-lines').textContent = this.lines;
            document.getElementById('tetris-level').textContent = this.level;
        }
    }
    
    update() {
        this.fallTime += 16;
        if (this.fallTime >= this.fallInterval) {
            this.movePiece(0, 1);
            this.fallTime = 0;
        }
    }
    
    draw() {
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        const cellSize = 30;
        
        // Draw grid
        for (let y = 0; y < 20; y++) {
            for (let x = 0; x < 10; x++) {
                if (this.grid[y][x]) {
                    this.ctx.fillStyle = this.grid[y][x];
                    this.ctx.fillRect(x * cellSize, y * cellSize, cellSize - 1, cellSize - 1);
                }
            }
        }
        
        // Draw current piece
        if (this.currentPiece) {
            this.ctx.fillStyle = this.currentPiece.color;
            for (let y = 0; y < this.currentPiece.shape.length; y++) {
                for (let x = 0; x < this.currentPiece.shape[y].length; x++) {
                    if (this.currentPiece.shape[y][x]) {
                        const px = (this.currentPiece.x + x) * cellSize;
                        const py = (this.currentPiece.y + y) * cellSize;
                        if (py >= 0) {
                            this.ctx.fillRect(px, py, cellSize - 1, cellSize - 1);
                        }
                    }
                }
            }
        }
    }
    
    reset() {
        this.grid = Array(20).fill().map(() => Array(10).fill(0));
        this.score = 0;
        this.lines = 0;
        this.level = 1;
        this.fallTime = 0;
        this.fallInterval = 1000;
        document.getElementById('tetris-score').textContent = '0';
        document.getElementById('tetris-lines').textContent = '0';
        document.getElementById('tetris-level').textContent = '1';
        document.getElementById('tetris-start-btn').style.display = 'block';
        document.getElementById('tetris-pause-btn').style.display = 'none';
        clearInterval(this.gameLoop);
        this.draw();
    }
}

function startTetris() {
    if (tetrisGame) tetrisGame.start();
}

function pauseTetris() {
    if (tetrisGame) tetrisGame.pause();
}

// ========== PLACEHOLDER FOR OTHER GAMES ==========
function initSolitaire() {
    const gameContent = document.getElementById('game-content');
    gameContent.innerHTML = `
        <h2>🃏 Kabal</h2>
        <p>Dette spillet kommer snart!</p>
    `;
}

function initYatzy() {
    const gameContent = document.getElementById('game-content');
    gameContent.innerHTML = `
        <h2>🎲 Yatzy</h2>
        <p>Dette spillet kommer snart!</p>
    `;
}

function initLudo() {
    const gameContent = document.getElementById('game-content');
    gameContent.innerHTML = `
        <h2>🏁 Ludo</h2>
        <p>Dette spillet kommer snart!</p>
    `;
}
