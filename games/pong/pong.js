// Pong Game Module
import { createBackButton, setupScrollPrevention, removeScrollPrevention, setupHardReset } from '../../core/gameUtils.js';
import { injectGameStyles, removeGameStyles } from '../../core/gameStyles.js';

let pongGame = null;

export function init() {
    const gameContent = document.getElementById('game-content');
    gameContent.innerHTML = createBackButton() + `
        <div class="pong-wrap">
            <div class="pong-main">
                <div class="pong-header">
                    <h1>Pong</h1>
                    <div class="pong-stats">
                        <div class="stat-box">
                            <div class="stat-label">Spiller 1</div>
                            <div class="stat-value" id="score-p1">0</div>
                        </div>
                        <div class="stat-box">
                            <div class="stat-label">Spiller 2</div>
                            <div class="stat-value" id="score-p2">0</div>
                        </div>
                    </div>
                </div>
                <div class="pong-game-area">
                    <canvas id="pong-canvas" width="800" height="500"></canvas>
                </div>
                <div class="pong-controls">
                    <p class="pong-instructions">P1: W/S | P2: ↑/↓ | Space: Start/Pause</p>
                    <div class="pong-buttons">
                        <button onclick="window.startPong()" id="pong-start" class="btn-primary">
                            <i data-lucide="play"></i> Start
                        </button>
                        <button onclick="window.pausePong()" id="pong-pause" style="display:none" class="btn-primary">
                            <i data-lucide="pause"></i> Pause
                        </button>
                        <button onclick="window.resetPong()" class="btn-secondary">
                            <i data-lucide="refresh-cw"></i> Reset
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;

    injectGameStyles('pong', getGameSpecificStyles());
    if (typeof lucide !== 'undefined') lucide.createIcons();
    
    setupScrollPrevention('pong');
    
    pongGame = new PongGame();
    window.pongGame = pongGame;
    window.startPong = () => pongGame.start();
    window.pausePong = () => pongGame.pause();
    window.resetPong = () => pongGame.reset();
}

export function cleanup() {
    if (pongGame) {
        pongGame.removeControls();
        pongGame = null;
    }
    removeScrollPrevention('pong');
    removeGameStyles('pong');
}

class PongGame {
    constructor() {
        this.canvas = document.getElementById('pong-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.width = this.canvas.width;
        this.height = this.canvas.height;
        
        this.paddle1 = { x: 20, y: this.height/2 - 50, width: 10, height: 100, speed: 5, score: 0 };
        this.paddle2 = { x: this.width - 30, y: this.height/2 - 50, width: 10, height: 100, speed: 5, score: 0 };
        this.ball = { x: this.width/2, y: this.height/2, radius: 10, dx: 5, dy: 5, speed: 5 };
        
        this.keys = {};
        this.isRunning = false;
        this.isPaused = false;
        this.animationFrame = null;
        
        this.setupControls();
        this.draw();
    }

    setupControls() {
        this.keyHandler = setupHardReset('pong', (e) => {
            this.keys[e.key] = e.type === 'keydown';
            if (e.key === ' ' && e.type === 'keydown') {
                e.preventDefault();
                if (!this.isRunning) this.start();
                else this.pause();
            }
        });
        document.addEventListener('keydown', this.keyHandler);
        document.addEventListener('keyup', this.keyHandler);
        
        // Touch controls for mobile - paddle follows touch position
        this.touchHandler = (e) => {
            if (!this.isRunning || this.isPaused) return;
            const rect = this.canvas.getBoundingClientRect();
            const touch = e.touches ? e.touches[0] : e;
            const touchY = touch.clientY - rect.top;
            const touchX = touch.clientX - rect.left;
            
            // Determine which paddle to move based on touch position
            if (touchX < this.width / 2) {
                // Left side - move paddle 1
                this.paddle1.y = Math.max(0, Math.min(this.height - this.paddle1.height, touchY - this.paddle1.height / 2));
            } else {
                // Right side - move paddle 2
                this.paddle2.y = Math.max(0, Math.min(this.height - this.paddle2.height, touchY - this.paddle2.height / 2));
            }
        };
        this.canvas.addEventListener('touchmove', this.touchHandler, { passive: true });
        this.canvas.addEventListener('mousemove', this.touchHandler);
    }

    removeControls() {
        document.removeEventListener('keydown', this.keyHandler);
        document.removeEventListener('keyup', this.keyHandler);
        if (this.canvas && this.touchHandler) {
            this.canvas.removeEventListener('touchmove', this.touchHandler);
            this.canvas.removeEventListener('mousemove', this.touchHandler);
        }
    }

    start() {
        if (!this.isRunning) {
            this.isRunning = true;
            this.isPaused = false;
            document.getElementById('pong-start').style.display = 'none';
            document.getElementById('pong-pause').style.display = 'inline-flex';
            if (!this.animationFrame) {
                this.gameLoop();
            }
        }
    }

    pause() {
        this.isPaused = !this.isPaused;
        const btn = document.getElementById('pong-pause');
        btn.innerHTML = this.isPaused ? '<i data-lucide="play"></i> Fortsett' : '<i data-lucide="pause"></i> Pause';
        if (typeof lucide !== 'undefined') lucide.createIcons();
    }

    reset() {
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
            this.animationFrame = null;
        }
        this.isRunning = false;
        this.isPaused = false;
        this.paddle1.y = this.height/2 - 50;
        this.paddle2.y = this.height/2 - 50;
        this.paddle1.score = 0;
        this.paddle2.score = 0;
        this.ball.x = this.width/2;
        this.ball.y = this.height/2;
        this.ball.dx = (Math.random() > 0.5 ? 1 : -1) * 5;
        this.ball.dy = (Math.random() > 0.5 ? 1 : -1) * 5;
        document.getElementById('score-p1').textContent = '0';
        document.getElementById('score-p2').textContent = '0';
        document.getElementById('pong-start').style.display = 'inline-flex';
        document.getElementById('pong-pause').style.display = 'none';
        if (typeof lucide !== 'undefined') lucide.createIcons();
        this.draw();
    }

    gameLoop() {
        if (!this.isRunning) return;
        
        this.update();
        this.draw();
        
        this.animationFrame = requestAnimationFrame(() => this.gameLoop());
    }

    update() {
        if (this.isPaused) return;

        // Move paddles
        if (this.keys['w'] || this.keys['W']) this.paddle1.y -= this.paddle1.speed;
        if (this.keys['s'] || this.keys['S']) this.paddle1.y += this.paddle1.speed;
        if (this.keys['ArrowUp']) this.paddle2.y -= this.paddle2.speed;
        if (this.keys['ArrowDown']) this.paddle2.y += this.paddle2.speed;

        // Keep paddles in bounds
        this.paddle1.y = Math.max(0, Math.min(this.height - this.paddle1.height, this.paddle1.y));
        this.paddle2.y = Math.max(0, Math.min(this.height - this.paddle2.height, this.paddle2.y));

        // Move ball
        this.ball.x += this.ball.dx;
        this.ball.y += this.ball.dy;

        // Ball collision with top/bottom
        if (this.ball.y - this.ball.radius < 0 || this.ball.y + this.ball.radius > this.height) {
            this.ball.dy *= -1;
        }

        // Ball collision with paddles
        if (this.ball.dx < 0 && 
            this.ball.x - this.ball.radius < this.paddle1.x + this.paddle1.width &&
            this.ball.y > this.paddle1.y &&
            this.ball.y < this.paddle1.y + this.paddle1.height) {
            this.ball.dx *= -1;
            this.ball.x = this.paddle1.x + this.paddle1.width + this.ball.radius;
        }
        if (this.ball.dx > 0 &&
            this.ball.x + this.ball.radius > this.paddle2.x &&
            this.ball.y > this.paddle2.y &&
            this.ball.y < this.paddle2.y + this.paddle2.height) {
            this.ball.dx *= -1;
            this.ball.x = this.paddle2.x - this.ball.radius;
        }

        // Scoring
        if (this.ball.x - this.ball.radius < 0) {
            this.paddle2.score++;
            document.getElementById('score-p2').textContent = this.paddle2.score;
            this.resetBall();
        }
        if (this.ball.x + this.ball.radius > this.width) {
            this.paddle1.score++;
            document.getElementById('score-p1').textContent = this.paddle1.score;
            this.resetBall();
        }
    }

    resetBall() {
        this.ball.x = this.width/2;
        this.ball.y = this.height/2;
        this.ball.dx = (Math.random() > 0.5 ? 1 : -1) * 5;
        this.ball.dy = (Math.random() > 0.5 ? 1 : -1) * 5;
    }

    draw() {
        const ctx = this.ctx;
        
        // Clear canvas
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, this.width, this.height);

        // Center line
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.setLineDash([10, 10]);
        ctx.beginPath();
        ctx.moveTo(this.width/2, 0);
        ctx.lineTo(this.width/2, this.height);
        ctx.stroke();
        ctx.setLineDash([]);

        // Paddles
        ctx.fillStyle = '#0d6efd';
        ctx.fillRect(this.paddle1.x, this.paddle1.y, this.paddle1.width, this.paddle1.height);
        ctx.fillStyle = '#dc3545';
        ctx.fillRect(this.paddle2.x, this.paddle2.y, this.paddle2.width, this.paddle2.height);

        // Ball
        ctx.fillStyle = '#ffc107';
        ctx.beginPath();
        ctx.arc(this.ball.x, this.ball.y, this.ball.radius, 0, Math.PI * 2);
        ctx.fill();
    }
}

function getGameSpecificStyles() {
    return `
        .pong-wrap {
            width: 100%;
            max-width: min(900px, 95vw);
            display: flex;
            flex-direction: column;
            align-items: center;
        }
        .pong-header h1 {
            font-size: 2.5rem;
            font-weight: 800;
            color: #111;
            margin: 0 0 20px 0;
            text-align: center;
        }
        .pong-stats {
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
        .pong-game-area {
            background: #000;
            border: 4px solid #6c757d;
            border-radius: 0;
            padding: 10px;
            margin-bottom: 20px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }
        #pong-canvas {
            display: block;
            width: 100%;
            max-width: min(820px, calc(95vw - 40px));
            height: auto;
            aspect-ratio: 8/5;
        }
        .pong-controls {
            text-align: center;
        }
        .pong-instructions {
            color: #6c757d;
            font-size: 0.9rem;
            margin-bottom: 15px;
        }
        .pong-buttons {
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
            .pong-header h1 {
                font-size: 2rem;
            }
            .pong-stats {
                flex-direction: column;
                gap: 10px;
            }
            .stat-box {
                width: 100%;
            }
            .pong-buttons {
                flex-direction: column;
            }
            .btn-primary, .btn-secondary {
                width: 100%;
            }
        }
    `;
}

