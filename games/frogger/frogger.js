// Frogger Game Module

let froggerGame = null;

export function init() {
    const gameContent = document.getElementById('game-content');
    gameContent.innerHTML = `
        <button class="back-button-tetris" onclick="window.location.href='https://hakonag.github.io/boredgames/'">
            <i data-lucide="house"></i> Tilbake
        </button>
        <div class="frogger-wrap">
            <div class="frogger-main">
                <div class="frogger-header">
                    <h1>Frogger</h1>
                    <div class="frogger-stats">
                        <div class="stat-box">
                            <div class="stat-label">Score</div>
                            <div class="stat-value" id="score-frogger">0</div>
                        </div>
                        <div class="stat-box">
                            <div class="stat-label">Liv</div>
                            <div class="stat-value" id="lives-frogger">3</div>
                        </div>
                    </div>
                </div>
                <div class="frogger-game-area">
                    <canvas id="frogger-canvas" width="600" height="600"></canvas>
                </div>
                <div class="frogger-controls">
                    <p class="frogger-instructions">Bruk piltastene for å bevege deg over veien</p>
                    <div class="frogger-buttons">
                        <button onclick="window.startFrogger()" id="frogger-start" class="btn-primary">
                            <i data-lucide="play"></i> Start
                        </button>
                        <button onclick="window.resetFrogger()" class="btn-secondary">
                            <i data-lucide="refresh-cw"></i> Reset
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;

    injectStyles();
    if (typeof lucide !== 'undefined') lucide.createIcons();
    
    froggerGame = new FroggerGame();
    window.froggerGame = froggerGame;
    window.startFrogger = () => froggerGame.start();
    window.resetFrogger = () => froggerGame.reset();
}

export function cleanup() {
    if (froggerGame) {
        froggerGame.removeControls();
        froggerGame = null;
    }
    const styleEl = document.getElementById('frogger-style');
    if (styleEl) styleEl.remove();
}

class FroggerGame {
    constructor() {
        this.canvas = document.getElementById('frogger-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.width = this.canvas.width;
        this.height = this.canvas.height;
        this.cellSize = 30;
        
        this.frog = { x: this.width/2, y: this.height - 40, size: 25 };
        this.cars = [];
        this.logs = [];
        this.score = 0;
        this.lives = 3;
        this.isRunning = false;
        this.animationFrame = null;
        this.frameCount = 0;
        
        this.setupControls();
        this.draw();
    }

    setupControls() {
        this.keys = {};
        this.keyHandler = (e) => {
            if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
                e.preventDefault();
                if (e.type === 'keydown') {
                    this.moveFrog(e.key.replace('Arrow', '').toLowerCase());
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

    moveFrog(direction) {
        if (!this.isRunning) return;
        
        const moves = {
            up: [0, -this.cellSize],
            down: [0, this.cellSize],
            left: [-this.cellSize, 0],
            right: [this.cellSize, 0]
        };
        
        const [dx, dy] = moves[direction];
        const newX = this.frog.x + dx;
        const newY = this.frog.y + dy;
        
        if (newX >= 0 && newX < this.width && newY >= 0 && newY < this.height) {
            this.frog.x = newX;
            this.frog.y = newY;
            
            // Check if reached top
            if (this.frog.y < 50) {
                this.score += 100;
                document.getElementById('score-frogger').textContent = this.score;
                this.frog.x = this.width/2;
                this.frog.y = this.height - 40;
                this.generateCars();
            }
        }
    }

    generateCars() {
        this.cars = [];
        const lanes = [60, 120, 180, 240, 300, 360];
        lanes.forEach((y, i) => {
            const direction = i % 2 === 0 ? 1 : -1;
            const speed = 2 + Math.random() * 2;
            for (let j = 0; j < 3; j++) {
                this.cars.push({
                    x: direction === 1 ? -60 - j * 200 : this.width + 60 + j * 200,
                    y: y,
                    width: 50,
                    height: 30,
                    speed: direction * speed,
                    color: ['#ff0000', '#0000ff', '#00ff00', '#ffff00'][Math.floor(Math.random() * 4)]
                });
            }
        });
    }

    start() {
        if (!this.isRunning) {
            this.isRunning = true;
            this.generateCars();
            document.getElementById('frogger-start').style.display = 'none';
            this.gameLoop();
        }
    }

    reset() {
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
            this.animationFrame = null;
        }
        this.isRunning = false;
        this.frog = { x: this.width/2, y: this.height - 40, size: 25 };
        this.cars = [];
        this.score = 0;
        this.lives = 3;
        document.getElementById('score-frogger').textContent = '0';
        document.getElementById('lives-frogger').textContent = '3';
        document.getElementById('frogger-start').style.display = 'inline-flex';
        this.draw();
    }

    gameLoop() {
        if (!this.isRunning) return;
        
        this.update();
        this.draw();
        
        this.animationFrame = requestAnimationFrame(() => this.gameLoop());
    }

    update() {
        this.frameCount++;
        
        // Move cars
        this.cars.forEach(car => {
            car.x += car.speed;
            
            // Reset car position when off screen
            if (car.speed > 0 && car.x > this.width) {
                car.x = -60;
            } else if (car.speed < 0 && car.x < -60) {
                car.x = this.width + 60;
            }
            
            // Check collision with frog
            if (this.frog.x + this.frog.size > car.x &&
                this.frog.x < car.x + car.width &&
                this.frog.y + this.frog.size > car.y &&
                this.frog.y < car.y + car.height) {
                this.lives--;
                document.getElementById('lives-frogger').textContent = this.lives;
                if (this.lives <= 0) {
                    alert('Game Over! Final score: ' + this.score);
                    this.reset();
                } else {
                    this.frog.x = this.width/2;
                    this.frog.y = this.height - 40;
                }
            }
        });
        
        // Check if frog fell in water (middle section)
        if (this.frog.y > 50 && this.frog.y < 400) {
            // Check if on log (simplified - assume safe if not on road)
            const onRoad = this.cars.some(car => 
                Math.abs(car.y - this.frog.y) < 50
            );
            if (onRoad && !this.cars.some(car =>
                this.frog.x + this.frog.size > car.x &&
                this.frog.x < car.x + car.width &&
                Math.abs(car.y - this.frog.y) < 30
            )) {
                // Frog in water
                this.lives--;
                document.getElementById('lives-frogger').textContent = this.lives;
                if (this.lives <= 0) {
                    alert('Game Over! Final score: ' + this.score);
                    this.reset();
                } else {
                    this.frog.x = this.width/2;
                    this.frog.y = this.height - 40;
                }
            }
        }
    }

    draw() {
        const ctx = this.ctx;
        
        // Background
        ctx.fillStyle = '#90ee90';
        ctx.fillRect(0, 0, this.width, this.height);
        
        // Road areas (gray)
        const roads = [60, 120, 180, 240, 300, 360];
        roads.forEach(y => {
            ctx.fillStyle = '#808080';
            ctx.fillRect(0, y - 30, this.width, 40);
            // Road lines
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 2;
            for (let x = 0; x < this.width; x += 40) {
                ctx.beginPath();
                ctx.moveTo(x, y);
                ctx.lineTo(x + 20, y);
                ctx.stroke();
            }
        });
        
        // Water area (blue)
        ctx.fillStyle = '#1e90ff';
        ctx.fillRect(0, 50, this.width, 350);
        
        // Safe zones (green)
        ctx.fillStyle = '#90ee90';
        ctx.fillRect(0, 0, this.width, 50);
        ctx.fillRect(0, 400, this.width, 50);
        
        // Draw cars
        this.cars.forEach(car => {
            ctx.fillStyle = car.color;
            ctx.fillRect(car.x, car.y, car.width, car.height);
            // Car windows
            ctx.fillStyle = '#fff';
            ctx.fillRect(car.x + 5, car.y + 5, 15, 10);
            ctx.fillRect(car.x + 30, car.y + 5, 15, 10);
        });
        
        // Draw frog
        ctx.fillStyle = '#00ff00';
        ctx.beginPath();
        ctx.arc(this.frog.x, this.frog.y, this.frog.size/2, 0, Math.PI * 2);
        ctx.fill();
        // Eyes
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(this.frog.x - 5, this.frog.y - 5, 3, 0, Math.PI * 2);
        ctx.arc(this.frog.x + 5, this.frog.y - 5, 3, 0, Math.PI * 2);
        ctx.fill();
    }
}

function injectStyles() {
    if (document.getElementById('frogger-style')) return;
    const style = document.createElement('style');
    style.id = 'frogger-style';
    style.textContent = `
        .game-container #game-content, .game-container #game-content * {
            font-family: system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol" !important;
        }
        body { overflow: hidden !important; position: fixed !important; width: 100% !important; }
        html { overflow: hidden !important; }
        .game-container {
            position: fixed; inset: 0;
            background: #90ee90;
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
        .frogger-wrap {
            width: 100%;
            max-width: 650px;
            display: flex;
            flex-direction: column;
            align-items: center;
        }
        .frogger-header h1 {
            font-size: 3rem;
            font-weight: 800;
            color: #333;
            margin: 0 0 20px 0;
            text-align: center;
        }
        .frogger-stats {
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
        .frogger-game-area {
            background: #000;
            border: 4px solid #6c757d;
            border-radius: 8px;
            padding: 10px;
            margin-bottom: 20px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }
        #frogger-canvas {
            display: block;
            width: 100%;
            max-width: 620px;
            height: auto;
            aspect-ratio: 1;
        }
        .frogger-controls {
            text-align: center;
        }
        .frogger-instructions {
            color: #6c757d;
            font-size: 0.9rem;
            margin-bottom: 15px;
        }
        .frogger-buttons {
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
            .frogger-header h1 {
                font-size: 2rem;
            }
            .frogger-stats {
                flex-direction: column;
                gap: 10px;
            }
            .stat-box {
                width: 100%;
            }
            .frogger-buttons {
                flex-direction: column;
            }
            .btn-primary, .btn-secondary {
                width: 100%;
            }
            #frogger-canvas {
                max-width: 100%;
            }
        }
    `;
    document.head.appendChild(style);
}

