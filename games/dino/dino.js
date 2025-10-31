// Chrome Dino Game Module
import { displayHighScores, showScoreModal } from '../../core/highScores.js';

let dinoGame = null;

export function init() {
    const gameContent = document.getElementById('game-content');
    gameContent.innerHTML = `
        <button class="back-button-tetris" onclick="window.location.href='https://hakonag.github.io/boredgames/'">
            <i data-lucide="house"></i> Tilbake
        </button>
        <div class="dino-wrap">
            <div class="dino-main">
                <div class="dino-header">
                    <h1>Dino</h1>
                    <div class="dino-stats">
                        <div class="stat-box">
                            <div class="stat-label">Score</div>
                            <div class="stat-value" id="score-dino">0</div>
                        </div>
                        <div class="stat-box">
                            <div class="stat-label">Best</div>
                            <div class="stat-value" id="best-dino">0</div>
                        </div>
                    </div>
                </div>
                <div class="dino-game-area">
                    <canvas id="dino-canvas" width="800" height="200"></canvas>
                </div>
                <div class="dino-controls">
                    <p class="dino-instructions">Space eller ↑ for å hoppe | ↓ for å dukke</p>
                    <div class="dino-buttons">
                        <button onclick="window.startDino()" id="dino-start" class="btn-primary">
                            <i data-lucide="play"></i> Start
                        </button>
                        <button onclick="window.resetDino()" class="btn-secondary">
                            <i data-lucide="refresh-cw"></i> Reset
                        </button>
                    </div>
                </div>
                <div class="dino-leaderboard">
                    <h3>Toppresultater</h3>
                    <div id="dino-high-scores" class="scores-list"></div>
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
    window.dinoScrollPrevent = { wheel: preventScroll, touchmove: preventScroll };
    
    dinoGame = new DinoGame();
    window.dinoGame = dinoGame;
    window.startDino = () => dinoGame.start();
    window.resetDino = () => dinoGame.reset();
    
    // Load best score
    const best = parseInt(localStorage.getItem('dino-best') || '0');
    document.getElementById('best-dino').textContent = best;
    
    // Load leaderboard
    displayHighScores('dino-high-scores', 'dino', 30).catch(() => {});
}

export function cleanup() {
    if (dinoGame) {
        dinoGame.removeControls();
        dinoGame = null;
    }
    // Remove scroll prevention
    if (window.dinoScrollPrevent) {
        window.removeEventListener('wheel', window.dinoScrollPrevent.wheel);
        window.removeEventListener('touchmove', window.dinoScrollPrevent.touchmove);
        delete window.dinoScrollPrevent;
    }
    const styleEl = document.getElementById('dino-style');
    if (styleEl) styleEl.remove();
}

class DinoGame {
    constructor() {
        this.canvas = document.getElementById('dino-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.width = this.canvas.width;
        this.height = this.canvas.height;
        
        this.dino = {
            x: 50,
            y: this.height - 80,
            width: 40,
            height: 60,
            velocityY: 0,
            onGround: true,
            ducking: false,
            animationFrame: 0
        };
        this.groundY = this.height - 60;
        this.obstacles = [];
        this.clouds = [];
        this.score = 0;
        this.best = parseInt(localStorage.getItem('dino-best') || '0');
        this.isRunning = false;
        this.isGameOver = false;
        this.animationFrame = null;
        this.speed = 5;
        this.frameCount = 0;
        
        this.setupControls();
        this.initClouds();
        this.draw();
    }

    initClouds() {
        this.clouds = [];
        for (let i = 0; i < 5; i++) {
            this.clouds.push({
                x: Math.random() * this.width,
                y: Math.random() * 80 + 20,
                width: 40 + Math.random() * 30,
                height: 20 + Math.random() * 15
            });
        }
    }

    setupControls() {
        this.keys = {};
        this.keyHandler = (e) => {
            // Don't process shortcuts if user is typing in an input field
            const activeElement = document.activeElement;
            if (activeElement && (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA')) {
                return;
            }
            
            // Handle restart (R)
            if (e.key === 'r' || e.key === 'R') {
                window.location.href = 'https://hakonag.github.io/boredgames/?game=dino';
                return;
            }
            
            if ([' ', 'ArrowUp', 'ArrowDown'].includes(e.key)) {
                e.preventDefault();
                if (e.type === 'keydown') {
                    if (e.key === ' ' || e.key === 'ArrowUp') {
                        this.jump();
                    } else if (e.key === 'ArrowDown') {
                        this.keys['ArrowDown'] = true;
                        this.duck(true);
                    }
                } else if (e.key === 'ArrowDown') {
                    this.keys['ArrowDown'] = false;
                    this.duck(false);
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

    jump() {
        if (this.dino.onGround && !this.isGameOver) {
            this.dino.velocityY = -15;
            this.dino.onGround = false;
        }
    }

    duck(isDucking) {
        if (!this.isGameOver) {
            this.dino.ducking = isDucking;
            if (isDucking) {
                this.dino.height = 30;
                this.dino.y = this.groundY - 30;
            } else {
                this.dino.height = 60;
                this.dino.y = this.groundY - 60;
            }
        }
    }

    start() {
        if (!this.isRunning && !this.isGameOver) {
            this.isRunning = true;
            document.getElementById('dino-start').style.display = 'none';
            this.gameLoop();
        } else if (this.isGameOver) {
            this.reset();
            this.start();
        }
    }

    reset() {
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
            this.animationFrame = null;
        }
        this.isRunning = false;
        this.isGameOver = false;
        this.dino = {
            x: 50,
            y: this.height - 80,
            width: 40,
            height: 60,
            velocityY: 0,
            onGround: true,
            ducking: false,
            animationFrame: 0
        };
        this.obstacles = [];
        this.clouds = [];
        this.score = 0;
        this.speed = 5;
        this.frameCount = 0;
        this.keys = {};
        this.initClouds();
        document.getElementById('score-dino').textContent = '0';
        document.getElementById('dino-start').style.display = 'inline-flex';
        this.draw();
    }

    gameLoop() {
        if (!this.isRunning) return;
        
        this.update();
        this.draw();
        
        if (!this.isGameOver) {
            this.animationFrame = requestAnimationFrame(() => this.gameLoop());
        }
    }

    update() {
        if (this.isGameOver) return;
        
        this.frameCount++;
        
        // Gravity
        this.dino.velocityY += 0.8;
        this.dino.y += this.dino.velocityY;
        
        // Ground collision
        const groundLevel = this.dino.ducking ? this.groundY - 30 : this.groundY - 60;
        if (this.dino.y >= groundLevel) {
            this.dino.y = groundLevel;
            this.dino.velocityY = 0;
            this.dino.onGround = true;
        }
        
        // Move clouds
        this.clouds.forEach(cloud => {
            cloud.x -= this.speed * 0.2;
            if (cloud.x + cloud.width < 0) {
                cloud.x = this.width;
                cloud.y = Math.random() * 80 + 20;
            }
        });
        
        // Generate obstacles
        if (this.frameCount % Math.floor(120 - this.speed * 5) === 0) {
            const obstacleHeight = 30 + Math.random() * 20;
            this.obstacles.push({
                x: this.width,
                y: this.groundY - obstacleHeight,
                width: 20,
                height: obstacleHeight,
                type: Math.random() > 0.7 ? 'cactus_tall' : 'cactus'
            });
        }
        
        // Move obstacles
        this.obstacles.forEach(obstacle => {
            obstacle.x -= this.speed;
        });
        
        // Remove off-screen obstacles
        this.obstacles = this.obstacles.filter(obs => obs.x + obs.width > 0);
        
        // Check collisions
        this.obstacles.forEach(obstacle => {
            if (this.dino.x < obstacle.x + obstacle.width &&
                this.dino.x + this.dino.width > obstacle.x &&
                this.dino.y < obstacle.y + obstacle.height &&
                this.dino.y + this.dino.height > obstacle.y) {
                this.gameOver();
            }
        });
        
        // Increase score and speed
        if (this.frameCount % 10 === 0) {
            this.score++;
            document.getElementById('score-dino').textContent = this.score;
            
            if (this.score > this.best) {
                this.best = this.score;
                localStorage.setItem('dino-best', String(this.best));
                document.getElementById('best-dino').textContent = this.best;
            }
            
            // Increase speed gradually
            if (this.score % 100 === 0 && this.speed < 15) {
                this.speed += 0.5;
            }
        }
        
        // Animate dino
        this.dino.animationFrame++;
    }

    gameOver() {
        this.isGameOver = true;
        this.isRunning = false;
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
            this.animationFrame = null;
        }
        this.draw(); // Draw game over screen
        document.getElementById('dino-start').style.display = 'inline-flex';
        document.getElementById('dino-start').innerHTML = '<i data-lucide="refresh-cw"></i> Spill igjen';
        if (typeof lucide !== 'undefined') lucide.createIcons();
        
        // Check if this is a high score
        import('../../core/highScores.js').then(({ getHighScores }) => {
            getHighScores('dino').then(scores => {
                const minHighScore = scores.length > 0 ? Math.min(...scores.map(s => s.score)) : 0;
                if (scores.length < 30 || this.score > minHighScore) {
                    showScoreModal('dino', this.score, 
                        () => {
                            setTimeout(() => { displayHighScores('dino-high-scores', 'dino', 30); }, 200);
                        },
                        () => {
                            setTimeout(() => { displayHighScores('dino-high-scores', 'dino', 30); }, 200);
                        }
                    );
                }
            });
        });
    }

    draw() {
        const ctx = this.ctx;
        
        // Clear canvas
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, this.width, this.height);
        
        // Draw clouds
        ctx.fillStyle = '#f0f0f0';
        this.clouds.forEach(cloud => {
            ctx.fillRect(cloud.x, cloud.y, cloud.width, cloud.height);
            ctx.fillRect(cloud.x + 10, cloud.y - 5, cloud.width * 0.8, cloud.height * 0.8);
        });
        
        // Draw ground
        ctx.fillStyle = '#535353';
        ctx.fillRect(0, this.groundY, this.width, this.height - this.groundY);
        
        // Draw ground lines
        ctx.strokeStyle = '#878787';
        ctx.lineWidth = 2;
        for (let x = 0; x < this.width; x += 20) {
            const offset = (this.frameCount * this.speed) % 20;
            ctx.beginPath();
            ctx.moveTo(x - offset, this.groundY);
            ctx.lineTo(x + 10 - offset, this.groundY);
            ctx.stroke();
        }
        
        // Draw obstacles
        ctx.fillStyle = '#535353';
        this.obstacles.forEach(obstacle => {
            if (obstacle.type === 'cactus_tall') {
                ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
                // Add cactus details
                ctx.fillRect(obstacle.x - 5, obstacle.y + 10, 10, 15);
                ctx.fillRect(obstacle.x + obstacle.width - 5, obstacle.y + 15, 10, 10);
            } else {
                ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
            }
        });
        
        // Draw dino
        ctx.fillStyle = '#535353';
        if (this.dino.ducking) {
            // Ducking pose
            ctx.fillRect(this.dino.x, this.dino.y, this.dino.width, this.dino.height);
            // Legs
            ctx.fillRect(this.dino.x + 5, this.dino.y + this.dino.height - 5, 15, 5);
            ctx.fillRect(this.dino.x + 20, this.dino.y + this.dino.height - 5, 15, 5);
        } else {
            // Normal running pose
            const legOffset = Math.sin(this.dino.animationFrame * 0.3) * 3;
            ctx.fillRect(this.dino.x, this.dino.y, this.dino.width, this.dino.height);
            // Head
            ctx.fillRect(this.dino.x + 25, this.dino.y - 10, 15, 15);
            // Eye
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(this.dino.x + 30, this.dino.y - 5, 5, 5);
            ctx.fillStyle = '#535353';
            // Legs
            ctx.fillRect(this.dino.x + 5, this.dino.y + this.dino.height - 10, 12, 10);
            ctx.fillRect(this.dino.x + 5, this.dino.y + this.dino.height - 10 + legOffset, 12, 10);
            ctx.fillRect(this.dino.x + 23, this.dino.y + this.dino.height - 10, 12, 10);
            ctx.fillRect(this.dino.x + 23, this.dino.y + this.dino.height - 10 - legOffset, 12, 10);
        }
        
        // Draw game over message
        if (this.isGameOver) {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            ctx.fillRect(0, 0, this.width, this.height);
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 48px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('Game Over', this.width/2, this.height/2 - 20);
            ctx.font = '24px Arial';
            ctx.fillText('Score: ' + this.score, this.width/2, this.height/2 + 20);
        }
    }
}

function injectStyles() {
    if (document.getElementById('dino-style')) return;
    const style = document.createElement('style');
    style.id = 'dino-style';
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
        .dino-wrap {
            width: 100%;
            max-width: min(850px, 95vw);
            display: flex;
            flex-direction: column;
            align-items: center;
        }
        .dino-header h1 {
            font-size: 3rem;
            font-weight: 800;
            color: #333;
            margin: 0 0 20px 0;
            text-align: center;
        }
        .dino-stats {
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
        .dino-game-area {
            background: #ffffff;
            border: 4px solid #6c757d;
            border-radius: 8px;
            padding: 10px;
            margin-bottom: 20px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }
        #dino-canvas {
            display: block;
            width: 100%;
            max-width: min(820px, calc(95vw - 40px));
            height: auto;
            aspect-ratio: 4/1;
        }
        .dino-controls {
            text-align: center;
        }
        .dino-instructions {
            color: #6c757d;
            font-size: 0.9rem;
            margin-bottom: 15px;
        }
        .dino-buttons {
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
        .dino-leaderboard {
            margin-top: 20px;
            padding: 15px;
            background: #f8f9fa;
            border: 2px solid #dee2e6;
            border-radius: 8px;
            width: 100%;
            max-width: min(850px, calc(95vw - 40px));
        }
        .dino-leaderboard h3 {
            margin: 0 0 12px 0;
            font-size: 1rem;
            color: #495057;
            text-align: center;
            font-weight: 600;
        }
        .dino-leaderboard .scores-list {
            max-height: 300px;
            overflow-y: auto;
        }
        @media (max-width: 768px) {
            .dino-header h1 {
                font-size: 2rem;
            }
            .dino-stats {
                flex-direction: column;
                gap: 10px;
            }
            .stat-box {
                width: 100%;
            }
            .dino-buttons {
                flex-direction: column;
            }
            .btn-primary, .btn-secondary {
                width: 100%;
            }
            #dino-canvas {
                max-width: 100%;
            }
        }
    `;
    document.head.appendChild(style);
}

