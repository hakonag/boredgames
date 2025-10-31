// Pacman Game Module
import { createBackButton, setupScrollPrevention, removeScrollPrevention, setupHardReset } from '../../core/gameUtils.js';
import { injectGameStyles, removeGameStyles } from '../../core/gameStyles.js';

let pacmanGame = null;

export function init() {
    const gameContent = document.getElementById('game-content');
    gameContent.innerHTML = createBackButton() + `
        <div class="pacman-wrap">
            <div class="pacman-main">
                <div class="pacman-header">
                    <h1>Pacman</h1>
                    <div class="pacman-stats">
                        <div class="stat-box">
                            <div class="stat-label">Score</div>
                            <div class="stat-value" id="score-pacman">0</div>
                        </div>
                        <div class="stat-box">
                            <div class="stat-label">Liv</div>
                            <div class="stat-value" id="lives-pacman">3</div>
                        </div>
                    </div>
                </div>
                <div class="pacman-game-area">
                    <canvas id="pacman-canvas" width="600" height="600"></canvas>
                </div>
                <div class="pacman-controls">
                    <p class="pacman-instructions">Bruk piltastene for å bevege deg</p>
                    <div class="pacman-buttons">
                        <button onclick="window.startPacman()" id="pacman-start" class="btn-primary">
                            <i data-lucide="play"></i> Start
                        </button>
                        <button onclick="window.resetPacman()" class="btn-secondary">
                            <i data-lucide="refresh-cw"></i> Reset
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
    injectGameStyles('pacman', getGameSpecificStyles());
    if (typeof lucide !== 'undefined') lucide.createIcons();
    
    setupScrollPrevention('pacman');
    
    pacmanGame = new PacmanGame();
    window.pacmanGame = pacmanGame;
    window.startPacman = () => pacmanGame.start();
    window.resetPacman = () => pacmanGame.reset();
}

export function cleanup() {
    if (pacmanGame) {
        pacmanGame.removeControls();
        pacmanGame = null;
    }
        removeScrollPrevention('pacman');
        removeGameStyles('pacman');
}

class PacmanGame {
    constructor() {
        this.canvas = document.getElementById('pacman-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.width = this.canvas.width;
        this.height = this.canvas.height;
        this.cellSize = 30;
        this.gridCols = Math.floor(this.width / this.cellSize);
        this.gridRows = Math.floor(this.height / this.cellSize);
        
        this.grid = [];
        this.pellets = [];
        this.score = 0;
        this.lives = 3;
        this.isRunning = false;
        this.animationFrame = null;
        
        this.pacman = { x: 1, y: 1, direction: 'right', nextDirection: null, mouthOpen: 0 };
        this.ghosts = [
            { x: 9, y: 9, direction: 'left', color: '#ff0000' },
            { x: 10, y: 9, direction: 'up', color: '#ffb8ff' },
            { x: 9, y: 10, direction: 'down', color: '#00ffff' }
        ];
        
        this.moveCounter = 0;
        this.moveDelay = 12; // Move every 12 frames (~5 moves per second at 60fps)
        this.currentKey = null; // Track which key is currently pressed
        
        this.initMaze();
        this.setupControls();
        this.draw();
    }

    initMaze() {
        // Simple maze pattern
        this.grid = Array(this.gridRows).fill().map(() => Array(this.gridCols).fill(0));
        
        // Outer walls
        for (let i = 0; i < this.gridRows; i++) {
            this.grid[i][0] = 1;
            this.grid[i][this.gridCols - 1] = 1;
        }
        for (let j = 0; j < this.gridCols; j++) {
            this.grid[0][j] = 1;
            this.grid[this.gridRows - 1][j] = 1;
        }
        
        // Inner walls
        for (let i = 2; i < this.gridRows - 2; i += 3) {
            for (let j = 2; j < this.gridCols - 2; j += 3) {
                this.grid[i][j] = 1;
            }
        }
        
        // Add pellets
        this.pellets = [];
        for (let i = 1; i < this.gridRows - 1; i++) {
            for (let j = 1; j < this.gridCols - 1; j++) {
                if (this.grid[i][j] === 0) {
                    this.pellets.push({ x: j, y: i });
                }
            }
        }
    }

    setupControls() {
        this.keys = {};
        this.keyHandler = setupHardReset('pacman', (e) => {
            if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
                e.preventDefault();
                const dir = e.key.replace('Arrow', '').toLowerCase();
                if (e.type === 'keydown') {
                    this.currentKey = dir;
                    this.pacman.nextDirection = dir;
                } else if (e.type === 'keyup' && this.currentKey === dir) {
                    // Stop moving when key is released
                    this.currentKey = null;
                    this.pacman.nextDirection = null;
                }
            }
        });
        document.addEventListener('keydown', this.keyHandler);
        document.addEventListener('keyup', this.keyHandler);
        
        // Touch/swipe controls for mobile
        let touchStartX, touchStartY;
        this.touchStart = (e) => {
            touchStartX = e.touches[0].clientX;
            touchStartY = e.touches[0].clientY;
        };
        this.touchEnd = (e) => {
            if (!touchStartX || !touchStartY) return;
            const touchEndX = e.changedTouches[0].clientX;
            const touchEndY = e.changedTouches[0].clientY;
            const diffX = touchEndX - touchStartX;
            const diffY = touchEndY - touchStartY;
            const absX = Math.abs(diffX);
            const absY = Math.abs(diffY);
            
            if (Math.max(absX, absY) > 30) {
                if (absX > absY) {
                    // Horizontal swipe
                    this.currentKey = diffX > 0 ? 'right' : 'left';
                    this.pacman.nextDirection = this.currentKey;
                } else {
                    // Vertical swipe
                    this.currentKey = diffY > 0 ? 'down' : 'up';
                    this.pacman.nextDirection = this.currentKey;
                }
                // Clear direction after a short delay
                setTimeout(() => {
                    if (this.currentKey) {
                        this.currentKey = null;
                        this.pacman.nextDirection = null;
                    }
                }, 100);
            }
            touchStartX = touchStartY = null;
        };
        const canvas = document.getElementById('pacman-canvas');
        if (canvas) {
            canvas.addEventListener('touchstart', this.touchStart, { passive: true });
            canvas.addEventListener('touchend', this.touchEnd, { passive: true });
        }
    }

    removeControls() {
        document.removeEventListener('keydown', this.keyHandler);
        document.removeEventListener('keyup', this.keyHandler);
        const canvas = document.getElementById('pacman-canvas');
        if (canvas && this.touchStart && this.touchEnd) {
            canvas.removeEventListener('touchstart', this.touchStart);
            canvas.removeEventListener('touchend', this.touchEnd);
        }
    }

    start() {
        if (!this.isRunning) {
            this.isRunning = true;
            document.getElementById('pacman-start').style.display = 'none';
            this.gameLoop();
        }
    }

    reset() {
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
            this.animationFrame = null;
        }
        this.isRunning = false;
        this.pacman = { x: 1, y: 1, direction: 'right', nextDirection: null, mouthOpen: 0 };
        this.ghosts = [
            { x: 9, y: 9, direction: 'left', color: '#ff0000' },
            { x: 10, y: 9, direction: 'up', color: '#ffb8ff' },
            { x: 9, y: 10, direction: 'down', color: '#00ffff' }
        ];
        this.score = 0;
        this.lives = 3;
        this.moveCounter = 0;
        this.currentKey = null;
        this.initMaze();
        document.getElementById('score-pacman').textContent = '0';
        document.getElementById('lives-pacman').textContent = '3';
        document.getElementById('pacman-start').style.display = 'inline-flex';
        this.draw();
    }

    gameLoop() {
        if (!this.isRunning) return;
        
        this.update();
        this.draw();
        
        this.animationFrame = requestAnimationFrame(() => this.gameLoop());
    }

    update() {
        this.moveCounter++;
        
        // Only update movement every N frames to slow down the game
        if (this.moveCounter < this.moveDelay) {
            // Still animate mouth and move ghosts (but slower)
            if (this.moveCounter % 3 === 0) {
                this.pacman.mouthOpen = (this.pacman.mouthOpen + 0.1) % 1;
            }
            // Move ghosts less frequently
            if (this.moveCounter % 6 === 0) {
                this.moveGhosts();
            }
            return;
        }
        
        this.moveCounter = 0;
        
        // Move pacman only if a key is pressed
        if (!this.pacman.nextDirection) {
            // No key pressed, don't move
            this.pacman.mouthOpen = (this.pacman.mouthOpen + 0.1) % 1;
            this.moveGhosts();
            return;
        }
        
        const directions = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };
        
        // Try to change direction
        if (this.pacman.nextDirection) {
            const nextDir = directions[this.pacman.nextDirection];
            const nextX = this.pacman.x + nextDir[0];
            const nextY = this.pacman.y + nextDir[1];
            if (this.canMove(nextX, nextY)) {
                this.pacman.direction = this.pacman.nextDirection;
            }
        }
        
        // Move in current direction (only if key is pressed)
        if (this.pacman.direction && this.currentKey) {
            const dir = directions[this.pacman.direction];
            const newX = this.pacman.x + dir[0];
            const newY = this.pacman.y + dir[1];
            
            if (this.canMove(newX, newY)) {
                this.pacman.x = newX;
                this.pacman.y = newY;
            }
        }
        
        // Collect pellets
        this.pellets = this.pellets.filter(pellet => {
            if (pellet.x === this.pacman.x && pellet.y === this.pacman.y) {
                this.score += 10;
                document.getElementById('score-pacman').textContent = this.score;
                return false;
            }
            return true;
        });
        
        // Move ghosts and check collisions
        this.moveGhosts();
        
        // Check win
        if (this.pellets.length === 0) {
            alert('Gratulerer! Du samlet alle pellets! Score: ' + this.score);
            this.reset();
        }
        
        // Animate mouth
        this.pacman.mouthOpen = (this.pacman.mouthOpen + 0.1) % 1;
    }
    
    moveGhosts() {
        const directions = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };
        this.ghosts.forEach(ghost => {
            const dirs = ['up', 'down', 'left', 'right'];
            const validDirs = dirs.filter(d => {
                const [dx, dy] = directions[d];
                return this.canMove(ghost.x + dx, ghost.y + dy);
            });
            if (validDirs.length > 0) {
                const randDir = validDirs[Math.floor(Math.random() * validDirs.length)];
                const [dx, dy] = directions[randDir];
                ghost.x += dx;
                ghost.y += dy;
            }
        });
        
        // Check collision with ghosts
        this.ghosts.forEach(ghost => {
            if (ghost.x === this.pacman.x && ghost.y === this.pacman.y) {
                this.lives--;
                document.getElementById('lives-pacman').textContent = this.lives;
                if (this.lives <= 0) {
                    alert('Game Over! Final score: ' + this.score);
                    this.reset();
                } else {
                    this.pacman.x = 1;
                    this.pacman.y = 1;
                    this.pacman.direction = 'right';
                    this.pacman.nextDirection = null;
                    this.currentKey = null;
                }
            }
        });
    }

    canMove(x, y) {
        if (x < 0 || x >= this.gridCols || y < 0 || y >= this.gridRows) return false;
        return this.grid[y][x] === 0;
    }

    draw() {
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(0, 0, this.width, this.height);
        
        // Draw walls
        this.ctx.fillStyle = '#0000ff';
        for (let i = 0; i < this.gridRows; i++) {
            for (let j = 0; j < this.gridCols; j++) {
                if (this.grid[i][j] === 1) {
                    this.ctx.fillRect(j * this.cellSize, i * this.cellSize, this.cellSize, this.cellSize);
                }
            }
        }
        
        // Draw pellets
        this.ctx.fillStyle = '#ffc107';
        this.pellets.forEach(pellet => {
            this.ctx.beginPath();
            this.ctx.arc(
                pellet.x * this.cellSize + this.cellSize/2,
                pellet.y * this.cellSize + this.cellSize/2,
                3, 0, Math.PI * 2
            );
            this.ctx.fill();
        });
        
        // Draw pacman
        this.ctx.fillStyle = '#ffff00';
        this.ctx.beginPath();
        const px = this.pacman.x * this.cellSize + this.cellSize/2;
        const py = this.pacman.y * this.cellSize + this.cellSize/2;
        const radius = this.cellSize/2 - 2;
        const startAngle = {
            right: this.pacman.mouthOpen * Math.PI,
            left: Math.PI + this.pacman.mouthOpen * Math.PI,
            up: Math.PI/2 + this.pacman.mouthOpen * Math.PI,
            down: 3 * Math.PI/2 + this.pacman.mouthOpen * Math.PI
        }[this.pacman.direction] || 0;
        this.ctx.arc(px, py, radius, startAngle, startAngle + 2 * Math.PI - this.pacman.mouthOpen * Math.PI);
        this.ctx.lineTo(px, py);
        this.ctx.fill();
        
        // Draw ghosts
        this.ghosts.forEach(ghost => {
            this.ctx.fillStyle = ghost.color;
            const gx = ghost.x * this.cellSize + this.cellSize/2;
            const gy = ghost.y * this.cellSize + this.cellSize/2;
            this.ctx.beginPath();
            this.ctx.arc(gx, gy, this.cellSize/2 - 2, 0, Math.PI * 2);
            this.ctx.fill();
        });
    }
}

function getGameSpecificStyles() {
    return `
.pacman-wrap {
            width: 100%;
            max-width: min(650px, 95vw);
            display: flex;
            flex-direction: column;
            align-items: center;
        }
        .pacman-header h1 {
            font-size: 2.5rem;
            font-weight: 800;
            color: #111;
            margin: 0 0 20px 0;
            text-align: center;
        }
        .pacman-stats {
            display: flex;
            gap: 20px;
            margin-bottom: 20px;
            justify-content: center;
        }
        .stat-box {
            background: #f8f9fa;
            border: 2px solid #dee2e6;
            border-radius: 0;
            padding: 15px 30px;
            text-align: center;
            min-width: 120px;
        }
        .stat-label {
            color: #6c757d;
            font-size: 0.85rem;
            font-weight: 600;
            margin-bottom: 8px;
        }
        .stat-value {
            color: #212529;
            font-size: 2rem;
            font-weight: 800;
        }
        .pacman-game-area {
            background: #000;
            border: 4px solid #6c757d;
            border-radius: 0;
            padding: 10px;
            margin-bottom: 20px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }
        #pacman-canvas {
            display: block;
            width: 100%;
            max-width: min(620px, calc(95vw - 40px));
            height: auto;
            aspect-ratio: 1;
        }
        .pacman-controls {
            text-align: center;
        }
        .pacman-instructions {
            color: #6c757d;
            font-size: 0.9rem;
            margin-bottom: 15px;
        }
        .pacman-buttons {
            display: flex;
            gap: 10px;
            justify-content: center;
        }
        .btn-primary, .btn-secondary {
            padding: 10px 20px;
            border-radius: 0;
            font-size: 0.9rem;
            cursor: pointer;
            font-weight: 600;
            display: flex;
            align-items: center;
            gap: 6px;
            border: 2px solid;
        }
        .btn-primary {
            background: #0d6efd;
            color: white;
            border-color: #0a58ca;
        }
        .btn-primary:hover {
            background: #0a58ca;
        }
        .btn-secondary {
            background: #6c757d;
            color: white;
            border-color: #5a6268;
        }
        .btn-secondary:hover {
            background: #5a6268;
        }
        .btn-primary i, .btn-secondary i {
            width: 14px;
            height: 14px;
        }
        @media (max-width: 768px) {
            .pacman-header h1 {
                font-size: 2rem;
            }
            .pacman-stats {
                flex-direction: column;
                gap: 10px;
            }
            .stat-box {
                width: 100%;
            }
            .pacman-buttons {
                flex-direction: column;
            }
            .btn-primary, .btn-secondary {
                width: 100%;
            }
            #pacman-canvas {
                max-width: 100%;
            }
        }
    `;
}

