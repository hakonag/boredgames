// Space Invader MVP

let invader = null;

export function init() {
    const root = document.getElementById('game-content');
    if (!root) return;
    root.innerHTML = `
        <button class="back-button-tetris" onclick="window.location.href='https://hakonag.github.io/boredgames/'">
            <i data-lucide=\"house\"></i> Tilbake
        </button>
        <div class="si-wrap">
            <div class="si-left">
                <canvas id="si-canvas" width="800" height="500"></canvas>
            </div>
            <div class="si-right">
                <div class="si-controls">
                    <h3>Kontroller</h3>
                    <div class="control-line"><strong>Bevegelse:</strong> ⬅ ➡</div>
                    <div class="control-line"><strong>Skyt:</strong> Space</div>
                    <div class="control-line"><strong>Restart:</strong> R</div>
                    <div class="buttons">
                        <button id="si-start" class="btn-primary"><i data-lucide=\"play\"></i> Start</button>
                        <button id="si-pause" class="btn-primary" style="display:none"><i data-lucide=\"pause\"></i> Pause</button>
                        <button id="si-restart" class="btn-secondary"><i data-lucide=\"refresh-cw\"></i> Restart</button>
                    </div>
                    <div class="panel">
                        <div><strong>Score:</strong> <span id="si-score">0</span></div>
                        <div><strong>Liv:</strong> <span id="si-lives">3</span></div>
                        <div id="si-status" class="si-status"></div>
                    </div>
                </div>
            </div>
        </div>
    `;

    injectStyles();
    if (typeof lucide !== 'undefined') lucide.createIcons();
    invader = new SpaceInvader();
    document.getElementById('si-start').onclick = () => invader.start();
    document.getElementById('si-pause').onclick = () => invader.togglePause();
    document.getElementById('si-restart').onclick = () => invader.restart();
}

export function cleanup() {
    if (invader) {
        invader.destroy();
        invader = null;
    }
}

class SpaceInvader {
    constructor() {
        this.canvas = document.getElementById('si-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.w = this.canvas.width; this.h = this.canvas.height;
        this.keys = new Set();
        this.running = false; this.paused = false; this.req = null; this.last = 0;
        this.player = { x: this.w/2, y: this.h - 40, w: 50, h: 12, speed: 360 };
        this.bullets = [];
        this.invaders = [];
        this.direction = 1; // 1 right, -1 left
        this.invSpeed = 48; // px/s horizontally
        this.dropY = 16;
        this.score = 0; this.lives = 3;
        this.buildInvaders();
        this.bind();
        this.drawFrame();
    }

    bind() {
        this.onKeyDown = (e) => {
            if (["ArrowLeft","ArrowRight"," ","r","R"].includes(e.key)) e.preventDefault();
            this.keys.add(e.key);
            if (e.key === ' ') this.shoot();
            if (e.key === 'r' || e.key === 'R') this.restart();
        };
        this.onKeyUp = (e) => this.keys.delete(e.key);
        document.addEventListener('keydown', this.onKeyDown, { passive: false });
        document.addEventListener('keyup', this.onKeyUp, { passive: false });
    }

    start() {
        if (this.running) return;
        this.running = true; this.paused = false; this.last = performance.now();
        document.getElementById('si-start').style.display = 'none';
        document.getElementById('si-pause').style.display = 'inline-flex';
        this.req = requestAnimationFrame(this.loop.bind(this));
    }
    togglePause() {
        if (!this.running) return;
        this.paused = !this.paused;
        const btn = document.getElementById('si-pause');
        btn.innerHTML = this.paused ? '<i data-lucide="play"></i> Fortsett' : '<i data-lucide="pause"></i> Pause';
        if (typeof lucide !== 'undefined') lucide.createIcons();
    }
    restart() {
        this.score = 0; this.lives = 3; this.bullets = []; this.invaders = []; this.buildInvaders(); this.player.x = this.w/2;
        document.getElementById('si-score').textContent = '0';
        document.getElementById('si-lives').textContent = '3';
        if (!this.running) this.start();
    }
    destroy() {
        if (this.req) cancelAnimationFrame(this.req);
        document.removeEventListener('keydown', this.onKeyDown);
        document.removeEventListener('keyup', this.onKeyUp);
    }

    buildInvaders() {
        const rows = 5, cols = 10; const padding = 12; const iw = 40, ih = 22; const startX = 60, startY = 60;
        this.invaders = [];
        for (let r=0;r<rows;r++) {
            for (let c=0;c<cols;c++) {
                this.invaders.push({ x: startX + c*(iw+padding), y: startY + r*(ih+padding), w: iw, h: ih, alive: true });
            }
        }
    }

    loop(ts) {
        this.req = requestAnimationFrame(this.loop.bind(this));
        const dt = Math.min(32, ts - this.last) / 1000; this.last = ts;
        if (!this.paused) { this.update(dt); this.drawFrame(); }
    }

    update(dt) {
        // player move
        if (this.keys.has('ArrowLeft')) this.player.x -= this.player.speed * dt;
        if (this.keys.has('ArrowRight')) this.player.x += this.player.speed * dt;
        this.player.x = Math.max(10, Math.min(this.w - this.player.w - 10, this.player.x));
        // move invaders
        let hitEdge = false;
        for (const inv of this.invaders) {
            if (!inv.alive) continue;
            inv.x += this.direction * this.invSpeed * dt;
            if (inv.x < 20 || inv.x + inv.w > this.w - 20) hitEdge = true;
        }
        if (hitEdge) {
            this.direction *= -1;
            for (const inv of this.invaders) { if (inv.alive) inv.y += this.dropY; }
        }
        // bullets
        for (const b of this.bullets) b.y -= 500*dt;
        this.bullets = this.bullets.filter(b => b.y > -20);
        // collisions
        for (const b of this.bullets) {
            for (const inv of this.invaders) {
                if (!inv.alive) continue;
                if (b.x > inv.x && b.x < inv.x+inv.w && b.y > inv.y && b.y < inv.y+inv.h) {
                    inv.alive = false; b.y = -9999; this.score += 10; document.getElementById('si-score').textContent = String(this.score);
                }
            }
        }
        // lose life if invaders reach bottom
        if (this.invaders.some(inv => inv.alive && inv.y + inv.h >= this.player.y)) {
            this.lives -= 1; document.getElementById('si-lives').textContent = String(this.lives);
            if (this.lives <= 0) {
                this.paused = true; document.getElementById('si-status').textContent = 'Game Over';
            } else {
                this.buildInvaders(); this.bullets = [];
            }
        }
        // win wave
        if (!this.invaders.some(inv => inv.alive)) {
            this.invSpeed += 20; this.dropY += 2; this.buildInvaders();
        }
    }

    shoot() {
        if (!this.running || this.paused) return;
        this.bullets.push({ x: this.player.x + this.player.w/2, y: this.player.y - 8 });
    }

    drawFrame() {
        const ctx = this.ctx; ctx.clearRect(0,0,this.w,this.h);
        // background
        ctx.fillStyle = '#000'; ctx.fillRect(0,0,this.w,this.h);
        // player
        ctx.fillStyle = '#00e676'; ctx.fillRect(this.player.x, this.player.y, this.player.w, this.player.h);
        // invaders
        ctx.fillStyle = '#f8f9fa';
        for (const inv of this.invaders) {
            if (!inv.alive) continue;
            ctx.fillRect(inv.x, inv.y, inv.w, inv.h);
        }
        // bullets
        ctx.fillStyle = '#ff6b6b';
        for (const b of this.bullets) ctx.fillRect(b.x-2, b.y-8, 4, 8);
    }
}

function injectStyles() {
    if (document.getElementById('si-style')) return;
    const style = document.createElement('style'); style.id = 'si-style';
    style.textContent = `
    .game-container #game-content, .game-container #game-content * { font-family: system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol" !important; }
    .game-container { position: fixed; inset:0; background:#fff; display:flex; align-items:center; justify-content:center; }
    .game-container #game-content { width:100%; height:90vh; max-height:90vh; margin-top:5vh; margin-bottom:5vh; display:flex; align-items:center; justify-content:center; }
    .back-button-tetris { position: fixed; top: 15px; left: 15px; background: #f8f9fa; color: #333; border: 1px solid #dee2e6; padding: 6px 10px; border-radius: 6px; font-size: 0.75rem; cursor: pointer; transition: background-color .15s ease, border-color .15s ease, color .15s ease; z-index: 10000; display: flex; align-items: center; gap: 6px; font-weight: 600; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1); }
    .si-wrap { width:100%; max-width:1200px; height:100%; display:flex; gap:16px; align-items:stretch; padding:0 10px; box-sizing:border-box; }
    .si-left { flex: 1; display:flex; align-items:center; justify-content:center; }
    #si-canvas { width:100%; height:auto; max-width:820px; border:4px solid #6c757d; border-radius:10px; box-shadow:0 8px 20px rgba(0,0,0,0.12); }
    .si-right { width:220px; flex-shrink:0; display:flex; flex-direction:column; gap:12px; }
    .si-controls { background:#f8f9fa; border:2px solid #dee2e6; border-radius:10px; padding:12px; display:flex; flex-direction:column; gap:8px; }
    .si-controls h3 { margin:0 0 6px 0; font-size:.95rem; color:#495057; text-align:center; }
    .control-line { font-size:.9rem; color:#495057; }
    .buttons { display:flex; flex-direction:column; gap:6px; }
    .panel { background:#fff; border:2px solid #dee2e6; border-radius:10px; padding:10px; display:flex; flex-direction:column; gap:6px; }
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
        .si-wrap {
            flex-direction: column;
            gap: 12px;
            height: auto;
            padding: 0;
        }
        .si-left {
            order: 1;
            width: 100%;
            flex: none;
        }
        #si-canvas {
            width: 100%;
            max-width: 100%;
            height: auto;
            aspect-ratio: 16/10;
        }
        .si-right {
            order: 2;
            width: 100%;
            flex-shrink: 1;
        }
        .si-controls {
            padding: 10px;
        }
        .si-controls h3 {
            font-size: 0.85rem;
        }
        .control-line {
            font-size: 0.8rem;
        }
        .btn-primary, .btn-secondary {
            padding: 10px;
            font-size: 0.85rem;
        }
        .panel {
            padding: 10px;
            font-size: 0.85rem;
        }
    }
    `;
    document.head.appendChild(style);
}


