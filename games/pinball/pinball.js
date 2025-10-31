// Pinball Game Module

let pinballGame = null;

export function init() {
    const gameContent = document.getElementById('game-content');
    gameContent.innerHTML = `
        createBackButton() + `
        <div class="pinball-wrap">
            <div class="pinball-main">
                <div class="pinball-header">
                    <h1>Pinball</h1>
                    <div class="pinball-stats">
                        <div class="stat-box">
                            <div class="stat-label">Score</div>
                            <div class="stat-value" id="score-pinball">0</div>
                        </div>
                        <div class="stat-box">
                            <div class="stat-label">Liv</div>
                            <div class="stat-value" id="lives-pinball">3</div>
                        </div>
                    </div>
                </div>
                <div class="pinball-game-area">
                    <canvas id="pinball-canvas" width="500" height="700"></canvas>
                </div>
                <div class="pinball-controls">
                    <p class="pinball-instructions">Piltastene: ← → for å styre | Space: Launcher</p>
                    <div class="pinball-buttons">
                        <button onclick="window.startPinball()" id="pinball-start" class="btn-primary">
                            <i data-lucide="play"></i> Start
                        </button>
                        <button onclick="window.resetPinball()" class="btn-secondary">
                            <i data-lucide="refresh-cw"></i> Reset
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
    injectGameStyles('pinball', getGameSpecificStyles());
    if (typeof lucide !== 'undefined') lucide.createIcons();
    
    setupScrollPrevention('pinball');
    
    pinballGame = new PinballGame();
    window.pinballGame = pinballGame;
    window.startPinball = () => pinballGame.start();
    window.resetPinball = () => pinballGame.reset();
}

export function cleanup() {
    if (pinballGame) {
        pinballGame.removeControls();
        pinballGame = null;
    }
        removeScrollPrevention('pinball');
        removeGameStyles('pinball');
}

class PinballGame {
    constructor() {
        this.canvas = document.getElementById('pinball-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.width = this.canvas.width;
        this.height = this.canvas.height;
        
        this.ball = { x: this.width/2, y: this.height - 80, radius: 10, dx: 0, dy: 0 };
        this.flippers = [
            { x: this.width/2 - 50, y: this.height - 60, width: 80, height: 10, angle: -0.5 },
            { x: this.width/2 + 50, y: this.height - 60, width: 80, height: 10, angle: 0.5 }
        ];
        this.bumpers = [
            { x: 150, y: 200, radius: 30 },
            { x: 350, y: 200, radius: 30 },
            { x: 250, y: 300, radius: 30 }
        ];
        this.score = 0;
        this.lives = 3;
        this.isRunning = false;
        this.animationFrame = null;
        
        this.setupControls();
        this.draw();
    }

    setupControls() {
        this.keys = {};
        this.keyHandler = setupHardReset('pinball', (e) => {
            // Don't process shortcuts if user is typing in an input field
            const activeElement = document.activeElement;
            if (activeElement && (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA')) {
                return;
            }
            
            
            
            if (['ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
                e.preventDefault();
                this.keys[e.key] = e.type === 'keydown';
                if (e.key === ' ' && e.type === 'keydown') {
                    this.launchBall();
                }
            }
        };
        document.addEventListener('keydown', this.keyHandler);
        document.addEventListener('keyup', this.keyHandler);
    }

    removeControls() {
        document.removeEventListener('keydown', this.keyHandler);
        document.removeEventListener('keyup', this.keyHandler);
    }

    launchBall() {
        if (!this.isRunning) return;
        if (this.ball.y > this.height - 100) {
            this.ball.dy = -15;
            this.ball.dx = (Math.random() - 0.5) * 4;
        }
    }

    start() {
        if (!this.isRunning) {
            this.isRunning = true;
            document.getElementById('pinball-start').style.display = 'none';
            this.ball.x = this.width/2;
            this.ball.y = this.height - 80;
            this.ball.dx = 0;
            this.ball.dy = 0;
            this.gameLoop();
        }
    }

    reset() {
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
            this.animationFrame = null;
        }
        this.isRunning = false;
        this.ball = { x: this.width/2, y: this.height - 80, radius: 10, dx: 0, dy: 0 };
        this.score = 0;
        this.lives = 3;
        document.getElementById('score-pinball').textContent = '0';
        document.getElementById('lives-pinball').textContent = '3';
        document.getElementById('pinball-start').style.display = 'inline-flex';
        this.draw();
    }

    gameLoop() {
        if (!this.isRunning) return;
        
        this.update();
        this.draw();
        
        this.animationFrame = requestAnimationFrame(() => this.gameLoop());
    }

    update() {
        // Gravity
        this.ball.dy += 0.3;
        
        // Move ball
        this.ball.x += this.ball.dx;
        this.ball.y += this.ball.dy;
        
        // Friction
        this.ball.dx *= 0.98;
        this.ball.dy *= 0.98;
        
        // Ball collision with walls
        if (this.ball.x - this.ball.radius < 20 || this.ball.x + this.ball.radius > this.width - 20) {
            this.ball.dx *= -0.8;
            this.ball.x = Math.max(20 + this.ball.radius, Math.min(this.width - 20 - this.ball.radius, this.ball.x));
        }
        if (this.ball.y - this.ball.radius < 20) {
            this.ball.dy *= -0.8;
            this.ball.y = 20 + this.ball.radius;
        }
        
        // Ball collision with bumpers
        this.bumpers.forEach(bumper => {
            const dx = this.ball.x - bumper.x;
            const dy = this.ball.y - bumper.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < this.ball.radius + bumper.radius) {
                const angle = Math.atan2(dy, dx);
                this.ball.dx = Math.cos(angle) * 8;
                this.ball.dy = Math.sin(angle) * 8;
                this.score += 100;
                document.getElementById('score-pinball').textContent = this.score;
            }
        });
        
        // Ball collision with flippers
        this.flippers.forEach(flipper => {
            const flipperX = flipper.x + Math.cos(flipper.angle) * flipper.width/2;
            const flipperY = flipper.y + Math.sin(flipper.angle) * flipper.width/2;
            const dx = this.ball.x - flipperX;
            const dy = this.ball.y - flipperY;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < this.ball.radius + flipper.height/2) {
                const angle = Math.atan2(dy, dx);
                const force = 10;
                this.ball.dx = Math.cos(angle) * force;
                this.ball.dy = Math.sin(angle) * force;
                this.score += 50;
                document.getElementById('score-pinball').textContent = this.score;
            }
        });
        
        // Ball falls off screen
        if (this.ball.y > this.height) {
            this.lives--;
            document.getElementById('lives-pinball').textContent = this.lives;
            if (this.lives <= 0) {
                alert('Game Over! Final score: ' + this.score);
                this.reset();
            } else {
                this.ball.x = this.width/2;
                this.ball.y = this.height - 80;
                this.ball.dx = 0;
                this.ball.dy = 0;
            }
        }
        
        // Update flippers
        if (this.keys['ArrowLeft']) {
            this.flippers[0].angle = Math.max(-0.8, this.flippers[0].angle - 0.1);
        } else {
            this.flippers[0].angle = Math.min(-0.3, this.flippers[0].angle + 0.1);
        }
        if (this.keys['ArrowRight']) {
            this.flippers[1].angle = Math.min(0.8, this.flippers[1].angle + 0.1);
        } else {
            this.flippers[1].angle = Math.max(0.3, this.flippers[1].angle - 0.1);
        }
    }

    draw() {
        const ctx = this.ctx;
        
        // Clear canvas
        ctx.fillStyle = '#1a1a1a';
        ctx.fillRect(0, 0, this.width, this.height);
        
        // Draw walls
        ctx.fillStyle = '#444';
        ctx.fillRect(0, 0, this.width, 20);
        ctx.fillRect(0, 0, 20, this.height);
        ctx.fillRect(this.width - 20, 0, 20, this.height);
        
        // Draw bumpers
        ctx.fillStyle = '#0d6efd';
        this.bumpers.forEach(bumper => {
            ctx.beginPath();
            ctx.arc(bumper.x, bumper.y, bumper.radius, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 3;
            ctx.stroke();
        });
        
        // Draw flippers
        ctx.fillStyle = '#ffc107';
        this.flippers.forEach(flipper => {
            ctx.save();
            ctx.translate(flipper.x, flipper.y);
            ctx.rotate(flipper.angle);
            ctx.fillRect(-flipper.width/2, -flipper.height/2, flipper.width, flipper.height);
            ctx.restore();
        });
        
        // Draw ball
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(this.ball.x, this.ball.y, this.ball.radius, 0, Math.PI * 2);
        ctx.fill();
    }
}

function getGameSpecificStyles() {
    return `
.pinball-wrap {
            width: 100%;
            max-width: min(550px, 95vw);
            display: flex;
            flex-direction: column;
            align-items: center;
        }
        .pinball-header h1 {
            font-size: 3rem;
            font-weight: 800;
            color: #fff;
            margin: 0 0 20px 0;
            text-align: center;
        }
        .pinball-stats {
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
        .pinball-game-area {
            background: #000;
            border: 4px solid #6c757d;
            border-radius: 8px;
            padding: 10px;
            margin-bottom: 20px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }
        #pinball-canvas {
            display: block;
            width: 100%;
            max-width: min(520px, calc(95vw - 40px));
            height: auto;
            aspect-ratio: 5/7;
        }
        .pinball-controls {
            text-align: center;
        }
        .pinball-instructions {
            color: #6c757d;
            font-size: 0.9rem;
            margin-bottom: 15px;
        }
        .pinball-buttons {
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
            .pinball-header h1 {
                font-size: 2rem;
            }
            .pinball-stats {
                flex-direction: column;
                gap: 10px;
            }
            .stat-box {
                width: 100%;
            }
            .pinball-buttons {
                flex-direction: column;
            }
            .btn-primary, .btn-secondary {
                width: 100%;
            }
            #pinball-canvas {
                max-width: 100%;
            }
        }
    `;
}

