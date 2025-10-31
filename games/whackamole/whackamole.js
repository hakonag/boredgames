// Whack-a-Mole Game Module

let whackamoleGame = null;

export function init() {
    const gameContent = document.getElementById('game-content');
    gameContent.innerHTML = `
        createBackButton() + `
        <div class="whackamole-wrap">
            <div class="whackamole-main">
                <div class="whackamole-header">
                    <h1>Whack-a-Mole</h1>
                    <div class="whackamole-stats">
                        <div class="stat-box">
                            <div class="stat-label">Score</div>
                            <div class="stat-value" id="score-whackamole">0</div>
                        </div>
                        <div class="stat-box">
                            <div class="stat-label">Tid</div>
                            <div class="stat-value" id="time-whackamole">30</div>
                        </div>
                    </div>
                </div>
                <div class="whackamole-game-area">
                    <div class="whackamole-board" id="whackamole-board"></div>
                </div>
                <div class="whackamole-controls">
                    <p id="whackamole-status" class="whackamole-status">Klikk på muldvarpen!</p>
                    <div class="whackamole-buttons">
                        <button onclick="window.startWhackamole()" id="whackamole-start" class="btn-primary">
                            <i data-lucide="play"></i> Start
                        </button>
                        <button onclick="window.resetWhackamole()" class="btn-secondary">
                            <i data-lucide="refresh-cw"></i> Reset
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
    injectGameStyles('whackamole', getGameSpecificStyles());
    if (typeof lucide !== 'undefined') lucide.createIcons();
    
    setupScrollPrevention('whackamole');
    
    whackamoleGame = new WhackAMoleGame();
    window.whackamoleGame = whackamoleGame;
    window.startWhackamole = () => whackamoleGame.start();
    window.resetWhackamole = () => whackamoleGame.reset();
}

export function cleanup() {
    if (whackamoleGame) {
        whackamoleGame.removeControls();
        whackamoleGame = null;
    }
        removeScrollPrevention('whackamole');
        removeGameStyles('whackamole');
}

class WhackAMoleGame {
    constructor() {
        this.size = 3;
        this.holes = Array(this.size).fill().map(() => Array(this.size).fill(false));
        this.score = 0;
        this.timeLeft = 30;
        this.isRunning = false;
        this.gameInterval = null;
        this.timerInterval = null;
        this.activeMole = null;
        
        this.setupControls();
        this.updateDisplay();
    }

    setupControls() {
        };
        document.addEventListener('keydown', this.keyHandler);
    }

    removeControls() {
        if (this.keyHandler) {
            document.removeEventListener('keydown', this.keyHandler);
        }
        if (this.gameInterval) clearInterval(this.gameInterval);
        if (this.timerInterval) clearInterval(this.timerInterval);
    }

    start() {
        if (!this.isRunning) {
            this.isRunning = true;
            this.timeLeft = 30;
            document.getElementById('whackamole-start').style.display = 'none';
            document.getElementById('whackamole-status').textContent = 'Klikk på muldvarpen!';
            
            // Spawn moles
            this.gameInterval = setInterval(() => {
                if (!this.isRunning) return;
                this.spawnMole();
            }, 1500);
            
            // Timer
            this.timerInterval = setInterval(() => {
                if (!this.isRunning) return;
                this.timeLeft--;
                document.getElementById('time-whackamole').textContent = this.timeLeft;
                
                if (this.timeLeft <= 0) {
                    this.gameOver();
                }
            }, 1000);
            
            this.spawnMole();
        }
    }

    reset() {
        if (this.gameInterval) clearInterval(this.gameInterval);
        if (this.timerInterval) clearInterval(this.timerInterval);
        this.isRunning = false;
        this.holes = Array(this.size).fill().map(() => Array(this.size).fill(false));
        this.score = 0;
        this.timeLeft = 30;
        this.activeMole = null;
        document.getElementById('score-whackamole').textContent = '0';
        document.getElementById('time-whackamole').textContent = '30';
        document.getElementById('whackamole-status').textContent = 'Klikk på muldvarpen!';
        document.getElementById('whackamole-start').style.display = 'inline-flex';
        this.updateDisplay();
    }

    spawnMole() {
        // Hide current mole
        if (this.activeMole) {
            this.holes[this.activeMole.row][this.activeMole.col] = false;
        }
        
        // Spawn new mole
        const row = Math.floor(Math.random() * this.size);
        const col = Math.floor(Math.random() * this.size);
        this.holes[row][col] = true;
        this.activeMole = { row, col };
        
        // Auto-hide after 2 seconds
        setTimeout(() => {
            if (this.activeMole && this.activeMole.row === row && this.activeMole.col === col) {
                this.holes[row][col] = false;
                this.activeMole = null;
                this.updateDisplay();
            }
        }, 2000);
        
        this.updateDisplay();
    }

    whack(row, col) {
        if (!this.isRunning || !this.holes[row][col]) return;
        
        // Hit!
        this.holes[row][col] = false;
        this.activeMole = null;
        this.score += 10;
        document.getElementById('score-whackamole').textContent = this.score;
        document.getElementById('whackamole-status').textContent = 'Bra!';
        setTimeout(() => {
            document.getElementById('whackamole-status').textContent = 'Klikk på muldvarpen!';
        }, 500);
        
        this.updateDisplay();
    }

    gameOver() {
        this.isRunning = false;
        if (this.gameInterval) clearInterval(this.gameInterval);
        if (this.timerInterval) clearInterval(this.timerInterval);
        document.getElementById('whackamole-start').style.display = 'inline-flex';
        document.getElementById('whackamole-status').textContent = `Game Over! Final score: ${this.score}`;
        alert(`Game Over! Final score: ${this.score}`);
        this.holes = Array(this.size).fill().map(() => Array(this.size).fill(false));
        this.activeMole = null;
        this.updateDisplay();
    }

    updateDisplay() {
        const boardEl = document.getElementById('whackamole-board');
        if (!boardEl) return;
        
        boardEl.innerHTML = '';
        
        for (let row = 0; row < this.size; row++) {
            for (let col = 0; col < this.size; col++) {
                const cell = document.createElement('div');
                cell.className = 'whackamole-cell';
                cell.dataset.row = row;
                cell.dataset.col = col;
                
                if (this.holes[row][col]) {
                    cell.classList.add('mole');
                    cell.textContent = '🦫';
                    cell.style.cursor = 'pointer';
                    if (this.isRunning) {
                        cell.addEventListener('click', () => this.whack(row, col));
                    }
                } else {
                    cell.classList.add('hole');
                    cell.textContent = '🕳️';
                }
                
                boardEl.appendChild(cell);
            }
        }
    }
}

function getGameSpecificStyles() {
    return `
.whackamole-wrap {
            width: 100%;
            max-width: min(500px, 95vw);
            display: flex;
            flex-direction: column;
            align-items: center;
        }
        .whackamole-header h1 {
            font-size: 3rem;
            font-weight: 800;
            color: #fff;
            margin: 0 0 20px 0;
            text-align: center;
        }
        .whackamole-stats {
            display: flex;
            gap: 20px;
            margin-bottom: 20px;
            justify-content: center;
        }
        .stat-box {
            background: #f8f9fa;
            border: 2px solid #dee2e6;
            border-radius: 8px;
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
        .whackamole-game-area {
            width: 100%;
            display: flex;
            justify-content: center;
            margin-bottom: 20px;
        }
        .whackamole-board {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 15px;
            background: #654321;
            border: 4px solid #8b4513;
            border-radius: 8px;
            padding: 20px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            max-width: min(400px, calc(95vw - 40px));
            width: 100%;
            aspect-ratio: 1;
        }
        .whackamole-cell {
            aspect-ratio: 1;
            background: #8b6914;
            border: 3px solid #654321;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 4rem;
            transition: all 0.2s ease;
        }
        .whackamole-cell.hole {
            background: #5a4a3a;
        }
        .whackamole-cell.mole {
            background: #d4a574;
            cursor: pointer;
            animation: pop 0.3s ease;
        }
        .whackamole-cell.mole:hover {
            transform: scale(1.1);
        }
        @keyframes pop {
            0% { transform: scale(0); }
            50% { transform: scale(1.2); }
            100% { transform: scale(1); }
        }
        .whackamole-controls {
            text-align: center;
        }
        .whackamole-status {
            color: #fff;
            font-size: 1rem;
            font-weight: 600;
            margin-bottom: 15px;
            min-height: 24px;
        }
        .whackamole-buttons {
            display: flex;
            gap: 10px;
            justify-content: center;
        }
        .btn-primary, .btn-secondary {
            padding: 10px 20px;
            border-radius: 6px;
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
            .whackamole-header h1 {
                font-size: 2rem;
            }
            .whackamole-stats {
                flex-direction: column;
                gap: 10px;
            }
            .stat-box {
                width: 100%;
            }
            .whackamole-buttons {
                flex-direction: column;
            }
            .btn-primary, .btn-secondary {
                width: 100%;
            }
            .whackamole-board {
                max-width: 100%;
            }
            .whackamole-cell {
                font-size: 3rem;
            }
        }
    `;
}

