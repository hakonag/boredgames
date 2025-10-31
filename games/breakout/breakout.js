// Breakout Game Module

let breakoutGame = null;

export function init() {
    const gameContent = document.getElementById('game-content');
    gameContent.innerHTML = `
        createBackButton() + `
        <div class="breakout-wrap">
            <div class="breakout-main">
                <div class="breakout-header">
                    <h1>Breakout</h1>
                    <div class="breakout-stats">
                        <div class="stat-box">
                            <div class="stat-label">Score</div>
                            <div class="stat-value" id="score-breakout">0</div>
                        </div>
                        <div class="stat-box">
                            <div class="stat-label">Liv</div>
                            <div class="stat-value" id="lives-breakout">3</div>
                        </div>
                    </div>
                </div>
                <div class="breakout-game-area">
                    <canvas id="breakout-canvas" width="600" height="600"></canvas>
                </div>
                <div class="breakout-controls">
                    <p class="breakout-instructions">Bruk piltastene eller mus for å styre</p>
                    <div class="breakout-buttons">
                        <button onclick="window.startBreakout()" id="breakout-start" class="btn-primary">
                            <i data-lucide="play"></i> Start
                        </button>
                        <button onclick="window.resetBreakout()" class="btn-secondary">
                            <i data-lucide="refresh-cw"></i> Reset
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
    injectGameStyles('breakout', getGameSpecificStyles());
    if (typeof lucide !== 'undefined') lucide.createIcons();
    
    setupScrollPrevention('breakout');
    
    breakoutGame = new BreakoutGame();
    window.breakoutGame = breakoutGame;
    window.startBreakout = () => breakoutGame.start();
    window.resetBreakout = () => breakoutGame.reset();
}

export function cleanup() {
    if (breakoutGame) {
        breakoutGame.removeControls();
        breakoutGame = null;
    }
        removeScrollPrevention('breakout');
        removeGameStyles('breakout');
}

class BreakoutGame {
    constructor() {
        this.canvas = document.getElementById('breakout-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.width = this.canvas.width;
        this.height = this.canvas.height;
        
        this.paddle = { x: this.width/2 - 60, y: this.height - 30, width: 120, height: 15, speed: 8 };
        this.ball = { x: this.width/2, y: this.height - 60, radius: 10, dx: 4, dy: -4 };
        this.bricks = [];
        this.score = 0;
        this.lives = 3;
        this.isRunning = false;
        this.animationFrame = null;
        
        this.initBricks();
        this.setupControls();
        this.draw();
    }

    initBricks() {
        const rows = 5;
        const cols = 10;
        const brickWidth = 55;
        const brickHeight = 25;
        const padding = 5;
        const offsetTop = 50;
        const offsetLeft = (this.width - (cols * (brickWidth + padding) - padding)) / 2;
        
        const colors = ['#ef4444', '#f59e0b', '#eab308', '#22c55e', '#3b82f6'];
        
        this.bricks = [];
        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                this.bricks.push({
                    x: offsetLeft + c * (brickWidth + padding),
                    y: offsetTop + r * (brickHeight + padding),
                    width: brickWidth,
                    height: brickHeight,
                    color: colors[r],
                    visible: true
                });
            }
        }
    }

    setupControls() {
        this.keys = {};
        this.keyHandler = setupHardReset('breakout', (e) => {
            // Don't process shortcuts if user is typing in an input field
            const activeElement = document.activeElement;
            if (activeElement && (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA')) {
                return;
            }
            
            
            
            if (['ArrowLeft', 'ArrowRight'].includes(e.key)) {
                e.preventDefault();
                this.keys[e.key] = e.type === 'keydown';
            }
        };
        document.addEventListener('keydown', this.keyHandler);
        document.addEventListener('keyup', this.keyHandler);
        
        this.mouseHandler = (e) => {
            const rect = this.canvas.getBoundingClientRect();
            this.paddle.x = e.clientX - rect.left - this.paddle.width/2;
            this.paddle.x = Math.max(0, Math.min(this.width - this.paddle.width, this.paddle.x));
        };
        this.canvas.addEventListener('mousemove', this.mouseHandler);
    }

    removeControls() {
        document.removeEventListener('keydown', this.keyHandler);
        document.removeEventListener('keyup', this.keyHandler);
        this.canvas.removeEventListener('mousemove', this.mouseHandler);
    }

    start() {
        if (!this.isRunning) {
            this.isRunning = true;
            document.getElementById('breakout-start').style.display = 'none';
            this.gameLoop();
        }
    }

    reset() {
        this.isRunning = false;
        this.paddle.x = this.width/2 - 60;
        this.ball.x = this.width/2;
        this.ball.y = this.height - 60;
        this.ball.dx = 4;
        this.ball.dy = -4;
        this.score = 0;
        this.lives = 3;
        this.initBricks();
        document.getElementById('score-breakout').textContent = '0';
        document.getElementById('lives-breakout').textContent = '3';
        document.getElementById('breakout-start').style.display = 'inline-flex';
        this.draw();
    }

    gameLoop() {
        if (!this.isRunning) return;
        
        this.update();
        this.draw();
        
        this.animationFrame = requestAnimationFrame(() => this.gameLoop());
    }

    update() {
        // Move paddle
        if (this.keys['ArrowLeft']) this.paddle.x -= this.paddle.speed;
        if (this.keys['ArrowRight']) this.paddle.x += this.paddle.speed;
        this.paddle.x = Math.max(0, Math.min(this.width - this.paddle.width, this.paddle.x));

        // Move ball
        this.ball.x += this.ball.dx;
        this.ball.y += this.ball.dy;

        // Ball collision with walls
        if (this.ball.x - this.ball.radius < 0 || this.ball.x + this.ball.radius > this.width) {
            this.ball.dx *= -1;
        }
        if (this.ball.y - this.ball.radius < 0) {
            this.ball.dy *= -1;
        }

        // Ball collision with paddle
        if (this.ball.y + this.ball.radius > this.paddle.y &&
            this.ball.x > this.paddle.x &&
            this.ball.x < this.paddle.x + this.paddle.width) {
            this.ball.dy *= -1;
            this.ball.y = this.paddle.y - this.ball.radius;
        }

        // Ball collision with bricks
        for (let brick of this.bricks) {
            if (!brick.visible) continue;
            if (this.ball.x + this.ball.radius > brick.x &&
                this.ball.x - this.ball.radius < brick.x + brick.width &&
                this.ball.y + this.ball.radius > brick.y &&
                this.ball.y - this.ball.radius < brick.y + brick.height) {
                brick.visible = false;
                this.ball.dy *= -1;
                this.score += 10;
                document.getElementById('score-breakout').textContent = this.score;
            }
        }

        // Ball falls off screen
        if (this.ball.y > this.height) {
            this.lives--;
            document.getElementById('lives-breakout').textContent = this.lives;
            if (this.lives <= 0) {
                alert('Game Over! Final score: ' + this.score);
                this.reset();
            } else {
                this.ball.x = this.width/2;
                this.ball.y = this.height - 60;
                this.ball.dx = 4;
                this.ball.dy = -4;
            }
        }

        // Check win
        if (this.bricks.every(b => !b.visible)) {
            alert('Gratulerer! Du klarte det! Score: ' + this.score);
            this.reset();
        }
    }

    draw() {
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(0, 0, this.width, this.height);

        // Draw bricks
        for (let brick of this.bricks) {
            if (!brick.visible) continue;
            this.ctx.fillStyle = brick.color;
            this.ctx.fillRect(brick.x, brick.y, brick.width, brick.height);
            this.ctx.strokeStyle = '#fff';
            this.ctx.lineWidth = 2;
            this.ctx.strokeRect(brick.x, brick.y, brick.width, brick.height);
        }

        // Draw paddle
        this.ctx.fillStyle = '#0d6efd';
        this.ctx.fillRect(this.paddle.x, this.paddle.y, this.paddle.width, this.paddle.height);

        // Draw ball
        this.ctx.fillStyle = '#ffc107';
        this.ctx.beginPath();
        this.ctx.arc(this.ball.x, this.ball.y, this.ball.radius, 0, Math.PI * 2);
        this.ctx.fill();
    }
}

function getGameSpecificStyles() {
    return `
.breakout-wrap {
            width: 100%;
            max-width: min(650px, 95vw);
            display: flex;
            flex-direction: column;
            align-items: center;
        }
        .breakout-header h1 {
            font-size: 3rem;
            font-weight: 800;
            color: #333;
            margin: 0 0 20px 0;
            text-align: center;
        }
        .breakout-stats {
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
        .breakout-game-area {
            background: #000;
            border: 4px solid #6c757d;
            border-radius: 8px;
            padding: 10px;
            margin-bottom: 20px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }
        #breakout-canvas {
            display: block;
            width: 100%;
            max-width: min(620px, calc(95vw - 40px));
            height: auto;
            aspect-ratio: 1;
        }
        .breakout-controls {
            text-align: center;
        }
        .breakout-instructions {
            color: #6c757d;
            font-size: 0.9rem;
            margin-bottom: 15px;
        }
        .breakout-buttons {
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
            .breakout-header h1 {
                font-size: 2rem;
            }
            .breakout-stats {
                flex-direction: column;
                gap: 10px;
            }
            .stat-box {
                width: 100%;
            }
            .breakout-buttons {
                flex-direction: column;
            }
            .btn-primary, .btn-secondary {
                width: 100%;
            }
            #breakout-canvas {
                max-width: 100%;
            }
        }
    `;
}

