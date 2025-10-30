// Flappy Bird Game Module

let flappyGame = null;

export function init() {
    const gameContent = document.getElementById('game-content');
    gameContent.innerHTML = `
        <button class="back-button-tetris" onclick="window.location.href='https://hakonag.github.io/boredgames/'">
            <i data-lucide="house"></i> Tilbake
        </button>
        <div class="flappy-wrap">
            <div class="flappy-main">
                <div class="flappy-header">
                    <h1>Flappy Bird</h1>
                    <div class="flappy-stats">
                        <div class="stat-box">
                            <div class="stat-label">Score</div>
                            <div class="stat-value" id="score-flappy">0</div>
                        </div>
                        <div class="stat-box">
                            <div class="stat-label">Best</div>
                            <div class="stat-value" id="best-flappy">0</div>
                        </div>
                    </div>
                </div>
                <div class="flappy-game-area">
                    <canvas id="flappy-canvas" width="600" height="500"></canvas>
                </div>
                <div class="flappy-controls">
                    <p class="flappy-instructions">Klikk eller trykk Space for å fly</p>
                    <div class="flappy-buttons">
                        <button onclick="window.startFlappy()" id="flappy-start" class="btn-primary">
                            <i data-lucide="play"></i> Start
                        </button>
                        <button onclick="window.resetFlappy()" class="btn-secondary">
                            <i data-lucide="refresh-cw"></i> Reset
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;

    injectStyles();
    if (typeof lucide !== 'undefined') lucide.createIcons();
    
    flappyGame = new FlappyBirdGame();
    window.flappyGame = flappyGame;
    window.startFlappy = () => flappyGame.start();
    window.resetFlappy = () => flappyGame.reset();
    
    // Load best score
    const best = parseInt(localStorage.getItem('flappy-best') || '0');
    document.getElementById('best-flappy').textContent = best;
}

export function cleanup() {
    if (flappyGame) {
        flappyGame.removeControls();
        flappyGame = null;
    }
    const styleEl = document.getElementById('flappy-style');
    if (styleEl) styleEl.remove();
}

class FlappyBirdGame {
    constructor() {
        this.canvas = document.getElementById('flappy-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.width = this.canvas.width;
        this.height = this.canvas.height;
        
        this.bird = { x: 100, y: this.height/2, width: 30, height: 30, velocity: 0, gravity: 0.5 };
        this.pipes = [];
        this.score = 0;
        this.best = parseInt(localStorage.getItem('flappy-best') || '0');
        this.isRunning = false;
        this.isGameOver = false;
        this.animationFrame = null;
        this.frameCount = 0;
        
        this.setupControls();
        this.draw();
    }

    setupControls() {
        this.clickHandler = (e) => {
            if (this.isGameOver) return;
            if (!this.isRunning) {
                this.start();
            }
            this.jump();
        };
        this.canvas.addEventListener('click', this.clickHandler);
        
        this.keyHandler = (e) => {
            if (e.key === ' ') {
                e.preventDefault();
                if (this.isGameOver) return;
                if (!this.isRunning) {
                    this.start();
                }
                this.jump();
            }
        };
        document.addEventListener('keydown', this.keyHandler);
    }

    removeControls() {
        this.canvas.removeEventListener('click', this.clickHandler);
        document.removeEventListener('keydown', this.keyHandler);
    }

    jump() {
        this.bird.velocity = -8;
    }

    start() {
        if (!this.isRunning) {
            this.isRunning = true;
            this.isGameOver = false;
            this.bird = { x: 100, y: this.height/2, width: 30, height: 30, velocity: 0, gravity: 0.5 };
            this.pipes = [];
            this.score = 0;
            this.frameCount = 0;
            document.getElementById('score-flappy').textContent = '0';
            document.getElementById('flappy-start').style.display = 'none';
            this.gameLoop();
        }
    }

    reset() {
        this.isRunning = false;
        this.isGameOver = false;
        this.bird = { x: 100, y: this.height/2, width: 30, height: 30, velocity: 0, gravity: 0.5 };
        this.pipes = [];
        this.score = 0;
        this.frameCount = 0;
        document.getElementById('score-flappy').textContent = '0';
        document.getElementById('flappy-start').style.display = 'inline-flex';
        this.draw();
    }

    gameLoop() {
        if (!this.isRunning) return;
        
        this.update();
        this.draw();
        
        this.animationFrame = requestAnimationFrame(() => this.gameLoop());
    }

    update() {
        if (this.isGameOver) return;
        
        this.frameCount++;
        
        // Update bird
        this.bird.velocity += this.bird.gravity;
        this.bird.y += this.bird.velocity;
        
        // Generate pipes
        if (this.frameCount % 100 === 0) {
            const gap = 150;
            const pipeHeight = Math.random() * (this.height - gap - 100) + 50;
            this.pipes.push({
                x: this.width,
                topHeight: pipeHeight,
                bottomY: pipeHeight + gap,
                bottomHeight: this.height - (pipeHeight + gap),
                passed: false
            });
        }
        
        // Move pipes
        this.pipes.forEach(pipe => {
            pipe.x -= 3;
            
            // Check if passed
            if (!pipe.passed && pipe.x + 60 < this.bird.x) {
                pipe.passed = true;
                this.score++;
                document.getElementById('score-flappy').textContent = this.score;
                
                if (this.score > this.best) {
                    this.best = this.score;
                    localStorage.setItem('flappy-best', String(this.best));
                    document.getElementById('best-flappy').textContent = this.best;
                }
            }
        });
        
        // Remove off-screen pipes
        this.pipes = this.pipes.filter(pipe => pipe.x > -60);
        
        // Check collisions
        // Ground/ceiling
        if (this.bird.y < 0 || this.bird.y + this.bird.height > this.height) {
            this.gameOver();
            return;
        }
        
        // Pipes
        this.pipes.forEach(pipe => {
            if (this.bird.x + this.bird.width > pipe.x &&
                this.bird.x < pipe.x + 60 &&
                (this.bird.y < pipe.topHeight || this.bird.y + this.bird.height > pipe.bottomY)) {
                this.gameOver();
            }
        });
    }

    gameOver() {
        this.isGameOver = true;
        this.isRunning = false;
        document.getElementById('flappy-start').style.display = 'inline-flex';
        document.getElementById('flappy-start').innerHTML = '<i data-lucide="refresh-cw"></i> Spill igjen';
        if (typeof lucide !== 'undefined') lucide.createIcons();
        alert('Game Over! Score: ' + this.score);
    }

    draw() {
        // Sky background
        this.ctx.fillStyle = '#87ceeb';
        this.ctx.fillRect(0, 0, this.width, this.height);
        
        // Ground
        this.ctx.fillStyle = '#8b4513';
        this.ctx.fillRect(0, this.height - 50, this.width, 50);
        this.ctx.fillStyle = '#90ee90';
        this.ctx.fillRect(0, this.height - 50, this.width, 10);
        
        // Pipes
        this.ctx.fillStyle = '#00aa00';
        this.pipes.forEach(pipe => {
            // Top pipe
            this.ctx.fillRect(pipe.x, 0, 60, pipe.topHeight);
            // Bottom pipe
            this.ctx.fillRect(pipe.x, pipe.bottomY, 60, pipe.bottomHeight);
        });
        
        // Bird
        this.ctx.fillStyle = '#ffd700';
        this.ctx.beginPath();
        this.ctx.arc(
            this.bird.x + this.bird.width/2,
            this.bird.y + this.bird.height/2,
            this.bird.width/2,
            0, Math.PI * 2
        );
        this.ctx.fill();
        
        // Eye
        this.ctx.fillStyle = '#000';
        this.ctx.beginPath();
        this.ctx.arc(
            this.bird.x + this.bird.width/2 + 5,
            this.bird.y + this.bird.height/2 - 5,
            3, 0, Math.PI * 2
        );
        this.ctx.fill();
        
        // Game over text
        if (this.isGameOver) {
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            this.ctx.fillRect(0, 0, this.width, this.height);
            this.ctx.fillStyle = '#fff';
            this.ctx.font = 'bold 48px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('Game Over', this.width/2, this.height/2 - 20);
            this.ctx.font = '24px Arial';
            this.ctx.fillText('Score: ' + this.score, this.width/2, this.height/2 + 20);
        }
    }
}

function injectStyles() {
    if (document.getElementById('flappy-style')) return;
    const style = document.createElement('style');
    style.id = 'flappy-style';
    style.textContent = `
        .game-container #game-content, .game-container #game-content * {
            font-family: system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol" !important;
        }
        body { overflow: hidden !important; position: fixed !important; width: 100% !important; }
        html { overflow: hidden !important; }
        .game-container {
            position: fixed; inset: 0;
            background: #87ceeb;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .game-container #game-content {
            width: 100%;
            height: 100vh;
            max-height: 100vh;
            margin: 0;
            padding: 10px;
            display: flex;
            align-items: center;
            justify-content: center;
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
        .flappy-wrap {
            width: 100%;
            max-width: 650px;
            display: flex;
            flex-direction: column;
            align-items: center;
        }
        .flappy-header h1 {
            font-size: 3rem;
            font-weight: 800;
            color: #333;
            margin: 0 0 20px 0;
            text-align: center;
        }
        .flappy-stats {
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
        .flappy-game-area {
            background: #000;
            border: 4px solid #6c757d;
            border-radius: 8px;
            padding: 10px;
            margin-bottom: 20px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }
        #flappy-canvas {
            display: block;
            width: 100%;
            max-width: 620px;
            height: auto;
            aspect-ratio: 6/5;
        }
        .flappy-controls {
            text-align: center;
        }
        .flappy-instructions {
            color: #6c757d;
            font-size: 0.9rem;
            margin-bottom: 15px;
        }
        .flappy-buttons {
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
            .flappy-header h1 {
                font-size: 2rem;
            }
            .flappy-stats {
                flex-direction: column;
                gap: 10px;
            }
            .stat-box {
                width: 100%;
            }
            .flappy-buttons {
                flex-direction: column;
            }
            .btn-primary, .btn-secondary {
                width: 100%;
            }
            #flappy-canvas {
                max-width: 100%;
            }
        }
    `;
    document.head.appendChild(style);
}

