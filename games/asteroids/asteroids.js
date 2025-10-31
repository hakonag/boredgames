// Asteroids Game Module

let asteroidsGame = null;

export function init() {
    const gameContent = document.getElementById('game-content');
    gameContent.innerHTML = `
        <button class="back-button-tetris" onclick="window.location.href='https://hakonag.github.io/boredgames/'">
            <i data-lucide="house"></i> Tilbake
        </button>
        <div class="asteroids-wrap">
            <div class="asteroids-main">
                <div class="asteroids-header">
                    <h1>Asteroids</h1>
                    <div class="asteroids-stats">
                        <div class="stat-box">
                            <div class="stat-label">Score</div>
                            <div class="stat-value" id="score-asteroids">0</div>
                        </div>
                        <div class="stat-box">
                            <div class="stat-label">Liv</div>
                            <div class="stat-value" id="lives-asteroids">3</div>
                        </div>
                    </div>
                </div>
                <div class="asteroids-game-area">
                    <canvas id="asteroids-canvas" width="800" height="600"></canvas>
                </div>
                <div class="asteroids-controls">
                    <p class="asteroids-instructions">Rotasjon: ← → | Accelerasjon: ↑ | Skyt: Space</p>
                    <div class="asteroids-buttons">
                        <button onclick="window.startAsteroids()" id="asteroids-start" class="btn-primary">
                            <i data-lucide="play"></i> Start
                        </button>
                        <button onclick="window.resetAsteroids()" class="btn-secondary">
                            <i data-lucide="refresh-cw"></i> Reset
                        </button>
                    </div>
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
    window.asteroidsScrollPrevent = { wheel: preventScroll, touchmove: preventScroll };
    
    asteroidsGame = new AsteroidsGame();
    window.asteroidsGame = asteroidsGame;
    window.startAsteroids = () => asteroidsGame.start();
    window.resetAsteroids = () => asteroidsGame.reset();
}

export function cleanup() {
    if (asteroidsGame) {
        asteroidsGame.removeControls();
        asteroidsGame = null;
    }
    // Remove scroll prevention
    if (window.asteroidsScrollPrevent) {
        window.removeEventListener('wheel', window.asteroidsScrollPrevent.wheel);
        window.removeEventListener('touchmove', window.asteroidsScrollPrevent.touchmove);
        delete window.asteroidsScrollPrevent;
    }
    const styleEl = document.getElementById('asteroids-style');
    if (styleEl) styleEl.remove();
}

class AsteroidsGame {
    constructor() {
        this.canvas = document.getElementById('asteroids-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.width = this.canvas.width;
        this.height = this.canvas.height;
        
        this.ship = {
            x: this.width/2,
            y: this.height/2,
            angle: 0,
            speed: 0,
            maxSpeed: 5,
            rotationSpeed: 0.1,
            size: 20
        };
        this.asteroids = [];
        this.bullets = [];
        this.score = 0;
        this.lives = 3;
        this.isRunning = false;
        this.animationFrame = null;
        
        this.setupControls();
        this.initAsteroids();
        this.draw();
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
            if ((e.key === 'r' || e.key === 'R') && e.type === 'keydown') {
                window.location.href = 'https://hakonag.github.io/boredgames/?game=asteroids';
                return;
            }
            
            if (['ArrowLeft', 'ArrowRight', 'ArrowUp', ' '].includes(e.key)) {
                e.preventDefault();
                this.keys[e.key] = e.type === 'keydown';
                if (e.key === ' ' && e.type === 'keydown') {
                    this.shoot();
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

    initAsteroids() {
        this.asteroids = [];
        for (let i = 0; i < 5; i++) {
            this.asteroids.push(this.createAsteroid(3));
        }
    }

    createAsteroid(size) {
        const side = Math.floor(Math.random() * 4);
        let x, y;
        switch(side) {
            case 0: x = Math.random() * this.width; y = 0; break;
            case 1: x = this.width; y = Math.random() * this.height; break;
            case 2: x = Math.random() * this.width; y = this.height; break;
            case 3: x = 0; y = Math.random() * this.height; break;
        }
        const angle = Math.random() * Math.PI * 2;
        const speed = 1 + Math.random() * 2;
        return {
            x, y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            size: size,
            rotation: Math.random() * Math.PI * 2,
            rotationSpeed: (Math.random() - 0.5) * 0.05,
            vertices: this.generateAsteroidVertices(size * 20)
        };
    }

    generateAsteroidVertices(radius) {
        const vertices = [];
        const numPoints = 8;
        for (let i = 0; i < numPoints; i++) {
            const angle = (i / numPoints) * Math.PI * 2;
            const r = radius * (0.7 + Math.random() * 0.3);
            vertices.push({
                x: Math.cos(angle) * r,
                y: Math.sin(angle) * r
            });
        }
        return vertices;
    }

    shoot() {
        if (!this.isRunning) return;
        const bulletSpeed = 8;
        this.bullets.push({
            x: this.ship.x,
            y: this.ship.y,
            vx: Math.cos(this.ship.angle) * bulletSpeed,
            vy: Math.sin(this.ship.angle) * bulletSpeed,
            life: 60
        });
    }

    start() {
        if (!this.isRunning) {
            this.isRunning = true;
            document.getElementById('asteroids-start').style.display = 'none';
            this.gameLoop();
        }
    }

    reset() {
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
            this.animationFrame = null;
        }
        this.isRunning = false;
        this.ship = {
            x: this.width/2,
            y: this.height/2,
            angle: 0,
            speed: 0,
            maxSpeed: 5,
            rotationSpeed: 0.1,
            size: 20
        };
        this.asteroids = [];
        this.bullets = [];
        this.score = 0;
        this.lives = 3;
        this.initAsteroids();
        document.getElementById('score-asteroids').textContent = '0';
        document.getElementById('lives-asteroids').textContent = '3';
        document.getElementById('asteroids-start').style.display = 'inline-flex';
        this.draw();
    }

    gameLoop() {
        if (!this.isRunning) return;
        
        this.update();
        this.draw();
        
        this.animationFrame = requestAnimationFrame(() => this.gameLoop());
    }

    update() {
        // Rotate ship
        if (this.keys['ArrowLeft']) this.ship.angle -= this.ship.rotationSpeed;
        if (this.keys['ArrowRight']) this.ship.angle += this.ship.rotationSpeed;
        
        // Accelerate ship
        if (this.keys['ArrowUp']) {
            this.ship.speed = Math.min(this.ship.speed + 0.1, this.ship.maxSpeed);
        } else {
            this.ship.speed *= 0.98;
        }
        
        // Move ship
        this.ship.x += Math.cos(this.ship.angle) * this.ship.speed;
        this.ship.y += Math.sin(this.ship.angle) * this.ship.speed;
        
        // Wrap ship around screen
        if (this.ship.x < 0) this.ship.x = this.width;
        if (this.ship.x > this.width) this.ship.x = 0;
        if (this.ship.y < 0) this.ship.y = this.height;
        if (this.ship.y > this.height) this.ship.y = 0;
        
        // Move asteroids
        this.asteroids.forEach(ast => {
            ast.x += ast.vx;
            ast.y += ast.vy;
            ast.rotation += ast.rotationSpeed;
            
            // Wrap around screen
            if (ast.x < 0) ast.x = this.width;
            if (ast.x > this.width) ast.x = 0;
            if (ast.y < 0) ast.y = this.height;
            if (ast.y > this.height) ast.y = 0;
        });
        
        // Move bullets
        this.bullets.forEach(bullet => {
            bullet.x += bullet.vx;
            bullet.y += bullet.vy;
            bullet.life--;
            
            // Wrap around screen
            if (bullet.x < 0) bullet.x = this.width;
            if (bullet.x > this.width) bullet.x = 0;
            if (bullet.y < 0) bullet.y = this.height;
            if (bullet.y > this.height) bullet.y = 0;
        });
        
        // Remove dead bullets
        this.bullets = this.bullets.filter(b => b.life > 0);
        
        // Check bullet-asteroid collisions
        this.bullets.forEach((bullet, bi) => {
            this.asteroids.forEach((asteroid, ai) => {
                const dx = bullet.x - asteroid.x;
                const dy = bullet.y - asteroid.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < asteroid.size * 20) {
                    // Hit!
                    this.bullets.splice(bi, 1);
                    this.asteroids.splice(ai, 1);
                    this.score += asteroid.size * 10;
                    document.getElementById('score-asteroids').textContent = this.score;
                    
                    // Break into smaller asteroids
                    if (asteroid.size > 1) {
                        for (let i = 0; i < 2; i++) {
                            this.asteroids.push({
                                ...this.createAsteroid(asteroid.size - 1),
                                x: asteroid.x,
                                y: asteroid.y
                            });
                        }
                    }
                    
                    // Generate new asteroids if needed
                    if (this.asteroids.length === 0) {
                        this.initAsteroids();
                    }
                }
            });
        });
        
        // Check ship-asteroid collisions
        this.asteroids.forEach(asteroid => {
            const dx = this.ship.x - asteroid.x;
            const dy = this.ship.y - asteroid.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < asteroid.size * 20 + this.ship.size) {
                this.lives--;
                document.getElementById('lives-asteroids').textContent = this.lives;
                if (this.lives <= 0) {
                    alert('Game Over! Final score: ' + this.score);
                    this.reset();
                } else {
                    this.ship.x = this.width/2;
                    this.ship.y = this.height/2;
                    this.ship.speed = 0;
                }
            }
        });
    }

    draw() {
        const ctx = this.ctx;
        
        // Clear canvas
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, this.width, this.height);
        
        // Draw stars background
        ctx.fillStyle = '#fff';
        for (let i = 0; i < 50; i++) {
            const x = (i * 73) % this.width;
            const y = (i * 137) % this.height;
            ctx.fillRect(x, y, 2, 2);
        }
        
        // Draw asteroids
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        this.asteroids.forEach(ast => {
            ctx.save();
            ctx.translate(ast.x, ast.y);
            ctx.rotate(ast.rotation);
            ctx.beginPath();
            ctx.moveTo(ast.vertices[0].x, ast.vertices[0].y);
            for (let i = 1; i < ast.vertices.length; i++) {
                ctx.lineTo(ast.vertices[i].x, ast.vertices[i].y);
            }
            ctx.closePath();
            ctx.stroke();
            ctx.restore();
        });
        
        // Draw bullets
        ctx.fillStyle = '#fff';
        this.bullets.forEach(bullet => {
            ctx.beginPath();
            ctx.arc(bullet.x, bullet.y, 2, 0, Math.PI * 2);
            ctx.fill();
        });
        
        // Draw ship
        ctx.save();
        ctx.translate(this.ship.x, this.ship.y);
        ctx.rotate(this.ship.angle);
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(this.ship.size, 0);
        ctx.lineTo(-this.ship.size, -this.ship.size/2);
        ctx.lineTo(-this.ship.size/2, 0);
        ctx.lineTo(-this.ship.size, this.ship.size/2);
        ctx.closePath();
        ctx.stroke();
        ctx.restore();
    }
}

function injectStyles() {
    if (document.getElementById('asteroids-style')) return;
    const style = document.createElement('style');
    style.id = 'asteroids-style';
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
            background: #000000;
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
        .asteroids-wrap {
            width: 100%;
            max-width: min(850px, 95vw);
            display: flex;
            flex-direction: column;
            align-items: center;
        }
        .asteroids-header h1 {
            font-size: 3rem;
            font-weight: 800;
            color: #fff;
            margin: 0 0 20px 0;
            text-align: center;
        }
        .asteroids-stats {
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
        .asteroids-game-area {
            background: #000;
            border: 4px solid #6c757d;
            border-radius: 8px;
            padding: 10px;
            margin-bottom: 20px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }
        #asteroids-canvas {
            display: block;
            width: 100%;
            max-width: min(820px, calc(95vw - 40px));
            height: auto;
            aspect-ratio: 4/3;
        }
        .asteroids-controls {
            text-align: center;
        }
        .asteroids-instructions {
            color: #6c757d;
            font-size: 0.9rem;
            margin-bottom: 15px;
        }
        .asteroids-buttons {
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
            .asteroids-header h1 {
                font-size: 2rem;
            }
            .asteroids-stats {
                flex-direction: column;
                gap: 10px;
            }
            .stat-box {
                width: 100%;
            }
            .asteroids-buttons {
                flex-direction: column;
            }
            .btn-primary, .btn-secondary {
                width: 100%;
            }
            #asteroids-canvas {
                max-width: 100%;
            }
        }
    `;
    document.head.appendChild(style);
}

