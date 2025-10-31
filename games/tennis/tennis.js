// Two-player Tennis (Pong-style) MVP

let tennis = null;

export function init() {
    const root = document.getElementById('game-content');
    if (!root) return;
    root.innerHTML = `
        <button class="back-button-tetris" onclick="window.location.href='https://hakonag.github.io/boredgames/'">
            <i data-lucide="house"></i> Tilbake
        </button>
        <div class="tennis-wrap">
            <div class="tennis-left">
                <canvas id="tennis-canvas" width="800" height="500"></canvas>
            </div>
            <div class="tennis-right">
                <div class="tennis-controls">
                    <h3>Kontroller</h3>
                    <div class="control-line"><strong>Spiller 1:</strong> W / S</div>
                    <div class="control-line"><strong>Spiller 2:</strong> ⬆ / ⬇</div>
                    <div class="control-line"><strong>Start/Pause:</strong> Space</div>
                    <div class="control-line"><strong>Restart:</strong> R</div>
                    <div class="buttons">
                        <button id="tennis-start" class="btn-primary"><i data-lucide="play"></i> Start</button>
                        <button id="tennis-pause" class="btn-primary" style="display:none"><i data-lucide="pause"></i> Pause</button>
                        <button id="tennis-restart" class="btn-secondary"><i data-lucide="refresh-cw"></i> Restart</button>
                    </div>
                    <div class="scoreboard">
                        <div class="score"><span>P1</span> <strong id="score-left">0</strong></div>
                        <div class="score"><span>P2</span> <strong id="score-right">0</strong></div>
                    </div>
                </div>
            </div>
        </div>
    `;

    injectStyles();
    if (typeof lucide !== 'undefined') lucide.createIcons();

    tennis = new TennisGame();
    window._tennis = tennis;

    // Buttons
    document.getElementById('tennis-start').onclick = () => tennis.start();
    document.getElementById('tennis-pause').onclick = () => tennis.togglePause();
    document.getElementById('tennis-restart').onclick = () => tennis.restart();
}

export function cleanup() {
    if (tennis) {
        tennis.destroy();
        tennis = null;
    }
}

class TennisGame {
    constructor() {
        this.canvas = document.getElementById('tennis-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.width = this.canvas.width;
        this.height = this.canvas.height;
        this.keys = new Set();
        this.running = false;
        this.paused = false;
        this.lastTs = 0;
        this.req = null;
        this.left = { x: 30, y: this.height/2 - 50, w: 12, h: 100, speed: 380 };
        this.right = { x: this.width - 42, y: this.height/2 - 50, w: 12, h: 100, speed: 380 };
        this.ball = { x: this.width/2, y: this.height/2, r: 8, vx: 260, vy: 160 };
        this.score = { left: 0, right: 0 };
        this.bindEvents();
        this.drawCourt();
    }

    bindEvents() {
        this.keyDown = (e) => {
            // Don't process shortcuts if user is typing in an input field
            const activeElement = document.activeElement;
            if (activeElement && (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA')) {
                return;
            }
            
            // Handle restart (R) - hard refresh
            if (e.key === 'r' || e.key === 'R') {
                window.location.href = 'https://hakonag.github.io/boredgames/?game=tennis';
                return;
            }
            
            if ([" ", "ArrowUp", "ArrowDown", "w", "W", "s", "S"].includes(e.key)) e.preventDefault();
            this.keys.add(e.key);
            if (e.key === ' ') this.togglePause();
        };
        this.keyUp = (e) => this.keys.delete(e.key);
        document.addEventListener('keydown', this.keyDown, { passive: false });
        document.addEventListener('keyup', this.keyUp, { passive: false });
    }

    start() {
        if (this.running) return;
        this.running = true;
        this.paused = false;
        this.lastTs = performance.now();
        document.getElementById('tennis-start').style.display = 'none';
        document.getElementById('tennis-pause').style.display = 'inline-flex';
        this.req = requestAnimationFrame(this.loop.bind(this));
    }

    togglePause() {
        if (!this.running) return;
        this.paused = !this.paused;
        const btn = document.getElementById('tennis-pause');
        btn.innerHTML = this.paused ? '<i data-lucide="play"></i> Fortsett' : '<i data-lucide="pause"></i> Pause';
        if (typeof lucide !== 'undefined') lucide.createIcons();
    }

    restart() {
        this.score.left = 0; this.score.right = 0;
        this.resetBall();
        document.getElementById('score-left').textContent = '0';
        document.getElementById('score-right').textContent = '0';
        if (!this.running) this.start();
    }

    destroy() {
        if (this.req) cancelAnimationFrame(this.req);
        document.removeEventListener('keydown', this.keyDown);
        document.removeEventListener('keyup', this.keyUp);
    }

    loop(ts) {
        this.req = requestAnimationFrame(this.loop.bind(this));
        const dt = Math.min(32, ts - this.lastTs) / 1000;
        this.lastTs = ts;
        if (!this.paused) {
            this.update(dt);
            this.render();
        }
    }

    update(dt) {
        // paddles
        if (this.keys.has('w') || this.keys.has('W')) this.left.y -= this.left.speed * dt;
        if (this.keys.has('s') || this.keys.has('S')) this.left.y += this.left.speed * dt;
        if (this.keys.has('ArrowUp')) this.right.y -= this.right.speed * dt;
        if (this.keys.has('ArrowDown')) this.right.y += this.right.speed * dt;
        this.left.y = Math.max(0, Math.min(this.height - this.left.h, this.left.y));
        this.right.y = Math.max(0, Math.min(this.height - this.right.h, this.right.y));

        // ball
        this.ball.x += this.ball.vx * dt;
        this.ball.y += this.ball.vy * dt;
        if (this.ball.y - this.ball.r < 0 || this.ball.y + this.ball.r > this.height) this.ball.vy *= -1;

        // paddle collisions
        if (this.ball.x - this.ball.r < this.left.x + this.left.w &&
            this.ball.y > this.left.y && this.ball.y < this.left.y + this.left.h &&
            this.ball.vx < 0) {
            this.ball.vx *= -1;
            const offset = (this.ball.y - (this.left.y + this.left.h/2)) / (this.left.h/2);
            this.ball.vy = offset * 220;
        }
        if (this.ball.x + this.ball.r > this.right.x &&
            this.ball.y > this.right.y && this.ball.y < this.right.y + this.right.h &&
            this.ball.vx > 0) {
            this.ball.vx *= -1;
            const offset = (this.ball.y - (this.right.y + this.right.h/2)) / (this.right.h/2);
            this.ball.vy = offset * 220;
        }

        // scoring
        if (this.ball.x < -20) { this.scorePoint('right'); }
        if (this.ball.x > this.width + 20) { this.scorePoint('left'); }
    }

    scorePoint(side) {
        this.score[side]++;
        document.getElementById('score-left').textContent = String(this.score.left);
        document.getElementById('score-right').textContent = String(this.score.right);
        this.resetBall(side === 'left');
    }

    resetBall(towardsRight = Math.random() > 0.5) {
        this.ball.x = this.width/2;
        this.ball.y = this.height/2;
        this.ball.vx = (towardsRight ? 1 : -1) * (220 + Math.random()*80);
        this.ball.vy = (Math.random() * 2 - 1) * 160;
    }

    render() {
        this.drawCourt();
        const ctx = this.ctx;
        // paddles
        ctx.fillStyle = '#222';
        ctx.fillRect(this.left.x, this.left.y, this.left.w, this.left.h);
        ctx.fillRect(this.right.x, this.right.y, this.right.w, this.right.h);
        // ball
        ctx.beginPath(); ctx.arc(this.ball.x, this.ball.y, this.ball.r, 0, Math.PI*2); ctx.closePath();
        ctx.fillStyle = '#007bff'; ctx.fill();
    }

    drawCourt() {
        const ctx = this.ctx;
        ctx.clearRect(0,0,this.width,this.height);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0,0,this.width,this.height);
        ctx.strokeStyle = '#dee2e6';
        ctx.lineWidth = 4;
        // border
        ctx.strokeRect(2,2,this.width-4,this.height-4);
        // center line
        ctx.setLineDash([10, 14]);
        ctx.beginPath(); ctx.moveTo(this.width/2, 0); ctx.lineTo(this.width/2, this.height); ctx.stroke();
        ctx.setLineDash([]);
        // serve boxes
        ctx.strokeStyle = '#e9ecef';
        ctx.lineWidth = 2;
        ctx.strokeRect(2, this.height/4, this.width-4, this.height/2);
    }
}

function injectStyles() {
    if (document.getElementById('tennis-style')) return;
    const style = document.createElement('style');
    style.id = 'tennis-style';
    style.textContent = `
    .game-container #game-content, .game-container #game-content * { font-family: system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol" !important; }
    .game-container { position: fixed; inset: 0; background:#fff; padding:0; display:flex; align-items:center; justify-content:center; }
    .game-container #game-content { width:100%; height:90vh; max-height:90vh; margin-top:5vh; margin-bottom:5vh; display:flex; align-items:center; justify-content:center; }
    .back-button-tetris { position: fixed; top: 15px; left: 15px; background: #f8f9fa; color: #333; border: 1px solid #dee2e6; padding: 6px 10px; border-radius: 6px; font-size: 0.75rem; cursor: pointer; transition: background-color .15s ease, border-color .15s ease, color .15s ease; z-index: 10000; display: flex; align-items: center; gap: 6px; font-weight: 600; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1); }
    .back-button-tetris:hover { background:#e9ecef; border-color:#adb5bd; }
    .back-button-tetris i { width:14px; height:14px; }
    .tennis-wrap { width:100%; max-width:min(1200px, 95vw); height:100%; display:flex; gap:16px; align-items:stretch; padding:0 10px; box-sizing:border-box; }
    .tennis-left { flex: 1 1 auto; display:flex; align-items:center; justify-content:center; }
    #tennis-canvas { width: 100%; height: auto; max-width: min(820px, calc(95vw - 240px)); border: 4px solid #6c757d; border-radius: 10px; box-shadow: 0 8px 20px rgba(0,0,0,0.12); background:#fff; }
    .tennis-right { width:220px; flex-shrink:0; display:flex; flex-direction:column; gap:12px; }
    .tennis-controls { background:#f8f9fa; border:2px solid #dee2e6; border-radius:10px; padding:12px; display:flex; flex-direction:column; gap:8px; }
    .tennis-controls h3 { margin:0 0 6px 0; font-size:.95rem; color:#495057; text-align:center; }
    .control-line { font-size:.9rem; color:#495057; }
    .buttons { display:flex; flex-direction:column; gap:6px; }
    .btn-primary, .btn-secondary { display:flex; align-items:center; justify-content:center; gap:6px; padding:6px 10px; border-radius:6px; font-weight:700; cursor:pointer; }
    .btn-primary { background:#007bff; color:#fff; border:2px solid #0056b3; }
    .btn-primary:hover { background:#0056b3; border-color:#004085; }
    .btn-secondary { background:#6c757d; color:#fff; border:2px solid #5a6268; }
    .btn-secondary:hover { background:#5a6268; border-color:#495057; }
    .scoreboard { display:flex; justify-content:space-between; gap:10px; margin-top:6px; }
    .score { background:#fff; border:2px solid #dee2e6; border-radius:8px; padding:8px 10px; flex:1; display:flex; align-items:center; justify-content:space-between; font-size:1rem; }
    @media (max-width: 768px) {
        .game-container #game-content {
            height: 100vh;
            max-height: 100vh;
            margin: 0;
            padding: 10px;
        }
        .back-button-tetris {
            top: 10px;
            left: 10px;
            padding: 8px 10px;
            font-size: 0.7rem;
        }
        .tennis-wrap {
            flex-direction: column;
            gap: 12px;
            height: auto;
            padding: 0;
        }
        .tennis-left {
            order: 1;
            width: 100%;
            flex: none;
        }
        #tennis-canvas {
            width: 100%;
            max-width: 100%;
            height: auto;
            aspect-ratio: 4/3;
        }
        .tennis-right {
            order: 2;
            width: 100%;
            flex-shrink: 1;
        }
        .tennis-controls {
            padding: 10px;
        }
        .tennis-controls h3 {
            font-size: 0.85rem;
        }
        .control-line {
            font-size: 0.8rem;
        }
        .btn-primary, .btn-secondary {
            padding: 10px;
            font-size: 0.85rem;
        }
        .scoreboard {
            flex-direction: column;
            gap: 8px;
        }
        .score {
            font-size: 0.9rem;
            padding: 10px;
        }
    }
    `;
    document.head.appendChild(style);
}


