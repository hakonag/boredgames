import { displayHighScores, showScoreModal } from '../../core/highScores.js';
import { createBackButton, setupScrollPrevention, removeScrollPrevention, setupHardReset } from '../../core/gameUtils.js';
import { injectGameStyles, removeGameStyles } from '../../core/gameStyles.js';
// Minesweeper MVP
let msHandlers = [];

export function init() {
    const root = document.getElementById('game-content');
    if (!root) return;
    root.innerHTML = createBackButton() + `
        <div class="ms-wrap">
            <div class="ms-header">
                <h1 class="ms-title">MINESWEEPER</h1>
                <div class="ms-stats-row">
                    <div class="ms-stat-box">
                        <div class="ms-stat-label">⏱️ Tid</div>
                        <div class="ms-stat-value" id="ms-time">0</div>
                    </div>
                    <div class="ms-stat-box">
                        <div class="ms-stat-label">🚩 Flagg</div>
                        <div class="ms-stat-value" id="ms-flags">0</div>
                    </div>
                    <div class="ms-stat-box">
                        <div class="ms-stat-label">📊 Bomber</div>
                        <div class="ms-stat-value" id="ms-bombs-display">10</div>
                    </div>
                </div>
            </div>
            <div class="ms-controls-row">
                <div class="ms-controls">
                    <label class="ms-label">Størrelse:</label>
                    <select id="ms-size" class="ms-select">
                        <option value="9">Liten (9x9 · 10 bomber)</option>
                        <option value="12">Middels (12x12 · 20 bomber)</option>
                        <option value="16">Stor (16x16 · 40 bomber)</option>
                    </select>
                </div>
                <button id="ms-reset" class="btn-primary">
                    <i data-lucide="refresh-cw"></i> Nytt spill
                </button>
            </div>
            <div id="ms-status" class="ms-status"></div>
            <div class="ms-game-area">
                <div id="ms-board" class="ms-board" role="grid" aria-label="Minesweeper board"></div>
                <div class="ms-sidebar">
                    <h3 class="ms-sidebar-title">Toppresultater</h3>
                    <div id="minesweeper-high-scores" class="ms-highscores"></div>
                </div>
            </div>
        </div>
    `;
    injectGameStyles('minesweeper', getGameSpecificStyles());
    if (typeof lucide !== 'undefined') lucide.createIcons();

    setupScrollPrevention('minesweeper');

    const $ = (id) => document.getElementById(id);
    let size = parseInt($("ms-size").value, 10);
    let bombs = size === 9 ? 10 : size === 12 ? 20 : 40;
    let board = [];
    let revealed = new Set();
    let flagged = new Set();
    let started = false;
    let gameOver = false;
    let gameWon = false;
    let timer = 0;
    let timerId = null;
    updateFlags();
    render(size);

    function startTimer() {
        if (timerId) return;
        timerId = setInterval(() => {
            timer += 1;
            $("ms-time").textContent = String(timer);
        }, 1000);
    }
    function stopTimer() { clearInterval(timerId); timerId = null; }

    function reset() {
        stopTimer(); timer = 0; $("ms-time").textContent = '0';
        revealed.clear(); flagged.clear();
        size = parseInt($("ms-size").value, 10);
        bombs = size === 9 ? 10 : size === 12 ? 20 : 40;
        started = false;
        gameOver = false;
        gameWon = false;
        board = createBoard(size, bombs);
        updateBombsDisplay();
        $("ms-status").textContent = '';
        $("ms-status").className = 'ms-status';
        updateFlags();
        paintBoard();
    }

    function render(s) {
        board = createBoard(s, bombs);
        updateBombsDisplay();
        paintBoard();
        addHandler($("ms-reset"), 'click', reset);
        addHandler($("ms-size"), 'change', () => { reset(); });
        // load highscores
        displayHighScores('minesweeper-high-scores', 'minesweeper', 30).catch(()=>{});
    }

    function createBoard(n, numBombs) {
        const cells = Array.from({ length: n * n }, () => ({ bomb:false, num:0 }));
        // place bombs
        let placed = 0;
        while (placed < numBombs) {
            const idx = Math.floor(Math.random() * n * n);
            if (!cells[idx].bomb) { cells[idx].bomb = true; placed++; }
        }
        // compute numbers
        const dirs = [-1, 0, 1];
        const inB = (x,y)=> x>=0 && x<n && y>=0 && y<n;
        for (let y=0;y<n;y++) for (let x=0;x<n;x++) {
            const i = y*n + x;
            if (cells[i].bomb) continue;
            let c=0;
            for (const dy of dirs) for (const dx of dirs) {
                if (dx===0 && dy===0) continue;
                const nx = x+dx, ny = y+dy; if (!inB(nx,ny)) continue;
                if (cells[ny*n+nx].bomb) c++;
            }
            cells[i].num = c;
        }
        return { n, cells };
    }

    function paintBoard() {
        const host = $("ms-board");
        host.style.setProperty('--ms-size', String(board.n));
        host.innerHTML = '';
        for (let i=0;i<board.n*board.n;i++) {
            const cell = document.createElement('button');
            cell.type = 'button';
            cell.className = 'ms-cell';
            cell.setAttribute('data-i', String(i));
            cell.setAttribute('aria-label', 'Cell');
            if (flagged.has(i)) cell.classList.add('flag');
            if (revealed.has(i)) cell.classList.add('open');
            
            // Show bomb icon when revealed
            if (revealed.has(i) && board.cells[i].bomb) {
                cell.classList.add('bomb');
                cell.innerHTML = '<i data-lucide="bomb"></i>';
            } else if (revealed.has(i) && !board.cells[i].bomb && board.cells[i].num>0) {
                cell.textContent = String(board.cells[i].num);
            }
            
            host.appendChild(cell);
        }
        // Re-initialize Lucide icons after adding bomb icons
        if (typeof lucide !== 'undefined') lucide.createIcons();
        
        // interactions
        addHandler(host, 'click', onLeftClick);
        addHandler(host, 'contextmenu', onRightClick);
    }

    function onLeftClick(e) {
        if (gameOver || gameWon) return; // Prevent clicks when game is over
        const t = e.target;
        if (!(t instanceof HTMLElement)) return;
        if (!t.classList.contains('ms-cell')) return;
        const i = parseInt(t.getAttribute('data-i'), 10);
        if (!started) { started = true; startTimer(); }
        if (flagged.has(i) || revealed.has(i)) return;
        reveal(i);
        checkWin();
    }
    function onRightClick(e) {
        if (gameOver || gameWon) return false; // Prevent flags when game is over
        e.preventDefault();
        const t = e.target;
        if (!(t instanceof HTMLElement)) return false;
        if (!t.classList.contains('ms-cell')) return false;
        const i = parseInt(t.getAttribute('data-i'), 10);
        if (revealed.has(i)) return false;
        if (flagged.has(i)) flagged.delete(i); else flagged.add(i);
        updateFlags();
        paintBoard();
        return false;
    }

    function reveal(i) {
        if (revealed.has(i)) return;
        revealed.add(i);
        const c = board.cells[i];
        if (c.bomb) { // lose
            gameOver = true;
            stopTimer();
            $("ms-status").className = 'ms-status ms-status-lost';
            $("ms-status").innerHTML = '💥 <strong>Boom! Du tapte.</strong> <button class="ms-play-again-btn" onclick="window.msPlayAgain()"><i data-lucide="play"></i> Spill igjen</button>';
            if (typeof lucide !== 'undefined') lucide.createIcons();
            
            // show all bombs
            for (let k=0;k<board.cells.length;k++) if (board.cells[k].bomb) revealed.add(k);
            paintBoard();
            
            // Create explosion effect on the clicked bomb (after painting)
            setTimeout(() => {
                const clickedCell = $("ms-board").querySelector(`[data-i="${i}"]`);
                if (clickedCell) {
                    clickedCell.classList.add('exploded');
                    // Add explosion animation
                    createExplosion(clickedCell);
                }
            }, 50);
            return;
        }
        if (c.num===0) flood(i);
        paintBoard();
    }
    
    function createExplosion(cell) {
        // Create explosion effect with particles
        const rect = cell.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        
        // Create explosion overlay
        const explosion = document.createElement('div');
        explosion.className = 'explosion-overlay';
        explosion.style.position = 'fixed';
        explosion.style.left = centerX + 'px';
        explosion.style.top = centerY + 'px';
        explosion.style.transform = 'translate(-50%, -50%)';
        explosion.style.pointerEvents = 'none';
        explosion.style.zIndex = '10001';
        explosion.style.width = '80px';
        explosion.style.height = '80px';
        
        // Create particles
        const particleCount = 16;
        for (let i = 0; i < particleCount; i++) {
            const particle = document.createElement('div');
            particle.className = 'explosion-particle';
            const angle = (Math.PI * 2 * i) / particleCount;
            const distance = 25 + Math.random() * 15;
            const tx = Math.cos(angle) * distance;
            const ty = Math.sin(angle) * distance;
            particle.style.left = '50%';
            particle.style.top = '50%';
            particle.style.setProperty('--tx', tx + 'px');
            particle.style.setProperty('--ty', ty + 'px');
            explosion.appendChild(particle);
        }
        
        // Create central explosion emoji
        const centerExplosion = document.createElement('div');
        centerExplosion.textContent = '💥';
        centerExplosion.style.position = 'absolute';
        centerExplosion.style.left = '50%';
        centerExplosion.style.top = '50%';
        centerExplosion.style.transform = 'translate(-50%, -50%)';
        centerExplosion.style.fontSize = '2rem';
        centerExplosion.style.animation = 'pulse 0.4s ease-out';
        explosion.appendChild(centerExplosion);
        
        document.body.appendChild(explosion);
        
        // Remove explosion after animation
        setTimeout(() => {
            explosion.remove();
        }, 800);
    }

    function flood(i) {
        const n = board.n;
        const q = [i];
        const inB = idx => idx>=0 && idx<n*n;
        while (q.length) {
            const p = q.pop();
            const y = Math.floor(p/n), x = p % n;
            for (let dy=-1; dy<=1; dy++) for (let dx=-1; dx<=1; dx++) {
                if (dx===0 && dy===0) continue;
                const nx = x+dx, ny = y+dy; if (nx<0||ny<0||nx>=n||ny>=n) continue;
                const ni = ny*n+nx; if (!inB(ni)) continue;
                if (!revealed.has(ni) && !board.cells[ni].bomb) {
                    revealed.add(ni);
                    if (board.cells[ni].num===0) q.push(ni);
                }
            }
        }
    }

    function checkWin() {
        const safe = board.cells.length - board.cells.filter(c=>c.bomb).length;
        if (revealed.size >= safe) {
            gameWon = true;
            stopTimer();
            $("ms-status").className = 'ms-status ms-status-won';
            $("ms-status").innerHTML = `🎉 <strong>Gratulerer! Du vant på ${timer} sekunder!</strong> <button class="ms-play-again-btn" onclick="window.msPlayAgain()"><i data-lucide="play"></i> Spill igjen</button>`;
            if (typeof lucide !== 'undefined') lucide.createIcons();
            
            // Higher score is better: use inverse of time
            const score = Math.max(1, 100000 - (timer*1000));
            showScoreModal('minesweeper', score, () => {
                setTimeout(() => displayHighScores('minesweeper-high-scores', 'minesweeper', 30), 200);
            }, () => {
                setTimeout(() => displayHighScores('minesweeper-high-scores', 'minesweeper', 30), 200);
            });
        }
    }

    function updateFlags() {
        $("ms-flags").textContent = String(flagged.size);
    }
    
    function updateBombsDisplay() {
        $("ms-bombs-display").textContent = String(bombs);
    }
    
    // Make play again function globally accessible
    window.msPlayAgain = function() {
        reset();
    };

    function addHandler(el, evt, fn) { el.addEventListener(evt, fn); msHandlers.push([el, evt, fn]); }
}

export function cleanup() {
    msHandlers.forEach(([el, evt, fn]) => { try { el.removeEventListener(evt, fn); } catch {} });
    msHandlers = [];
    removeScrollPrevention('minesweeper');
    removeGameStyles('minesweeper');
}

function getGameSpecificStyles() {
    return `
    .ms-wrap { 
        width: 100%;
        max-width: min(1400px, 95vw);
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 20px;
        padding: 10px;
    }
    
    .ms-header {
        width: 100%;
        text-align: center;
        margin-bottom: 10px;
    }
    
    .ms-title {
        font-size: 2.5rem;
        font-weight: 800;
        letter-spacing: 2px;
        color: #111;
        margin: 0 0 20px 0;
    }
    
    .ms-stats-row {
        display: flex;
        justify-content: center;
        gap: 20px;
        flex-wrap: wrap;
    }
    
    .ms-stat-box {
        background: #f8f9fa;
        border: 2px solid #dee2e6;
        border-radius: 0;
        padding: 12px 24px;
        min-width: 120px;
        text-align: center;
    }
    
    .ms-stat-label {
        font-size: 0.85rem;
        font-weight: 600;
        color: #6c757d;
        margin-bottom: 6px;
        text-transform: uppercase;
        letter-spacing: 0.5px;
    }
    
    .ms-stat-value {
        font-size: 1.875rem;
        font-weight: 700;
        color: #111;
    }
    
    .ms-controls-row {
        display: flex;
        justify-content: center;
        align-items: center;
        gap: 16px;
        flex-wrap: wrap;
        width: 100%;
    }
    
    .ms-controls {
        display: flex;
        align-items: center;
        gap: 10px;
    }
    
    .ms-label {
        font-weight: 600;
        color: #495057;
        font-size: 0.9375rem;
    }
    
    .ms-select {
        padding: 10px 14px;
        border: 2px solid #dee2e6;
        border-radius: 0;
        background: #fff;
        color: #111;
        font-size: 0.9375rem;
        font-weight: 600;
        cursor: pointer;
        font-family: 'Space Grotesk', system-ui, sans-serif;
    }
    
    .ms-select:focus {
        outline: none;
        border-color: #111;
    }
    
    .ms-status {
        min-height: 50px;
        padding: 12px 20px;
        font-size: 1.1rem;
        font-weight: 600;
        text-align: center;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 12px;
        flex-wrap: wrap;
        border-radius: 0;
    }
    
    .ms-status-lost {
        background: #fff3cd;
        border: 2px solid #ffc107;
        color: #856404;
    }
    
    .ms-status-won {
        background: #d1f2eb;
        border: 2px solid #22c55e;
        color: #166534;
    }
    
    .ms-play-again-btn {
        padding: 8px 16px;
        background: #111;
        color: #fff;
        border: 2px solid #111;
        border-radius: 0;
        font-size: 0.9375rem;
        font-weight: 600;
        cursor: pointer;
        display: inline-flex;
        align-items: center;
        gap: 6px;
        transition: all 0.2s ease;
        font-family: 'Space Grotesk', system-ui, sans-serif;
    }
    
    .ms-play-again-btn:hover {
        background: #333;
        border-color: #333;
    }
    
    .ms-play-again-btn i {
        width: 16px;
        height: 16px;
        stroke-width: 2;
    }
    
    .ms-game-area {
        display: flex;
        gap: 24px;
        align-items: flex-start;
        justify-content: center;
        width: 100%;
        flex-wrap: wrap;
    }
    
    .ms-board { 
        --ms-size: 9;
        display: grid;
        grid-template-columns: repeat(var(--ms-size), 1fr);
        grid-auto-rows: 1fr;
        gap: 3px;
        background: #e9ecef;
        padding: 8px;
        border: 3px solid #dee2e6;
        border-radius: 0;
        box-shadow: 0 6px 20px rgba(0,0,0,.12);
        width: fit-content;
        max-width: 100%;
    }
    
    .ms-board[style*="--ms-size: 9"] {
        --cell-size: min(calc((100vw - 100px) / 9 - 3px), 50px);
    }
    
    .ms-board[style*="--ms-size: 12"] {
        --cell-size: min(calc((100vw - 100px) / 12 - 3px), 42px);
    }
    
    .ms-board[style*="--ms-size: 16"] {
        --cell-size: min(calc((100vw - 100px) / 16 - 3px), 36px);
    }
    
    .ms-cell {
        width: var(--cell-size, 48px);
        height: var(--cell-size, 48px);
        min-width: 28px;
        min-height: 28px;
        aspect-ratio: 1;
        background: #f1f3f5;
        color: #111;
        border: 2px solid #dee2e6;
        border-radius: 0;
        cursor: pointer;
        font-weight: 800;
        display: flex;
        align-items: center;
        justify-content: center;
        position: relative;
        font-size: clamp(0.7rem, 2vw, 1.1rem);
        transition: all 0.1s ease;
    }
    
    .ms-cell:hover:not(.open):not(.bomb) {
        background: #e9ecef;
        border-color: #adb5bd;
    }
    
    .ms-cell.open { 
        background: #fff;
        cursor: default;
    }
    
    .ms-cell.bomb { 
        background: #ff6b6b;
        border-color: #dc3545;
        cursor: default;
    }
    
    .ms-cell.bomb i { 
        width: 70%;
        height: 70%;
        color: #dc3545;
        stroke-width: 2.5;
    }
    
    .ms-cell.exploded { 
        background: #dc3545;
        border-color: #c82333;
        animation: explode 0.4s ease-out;
    }
    
    .ms-cell.flag::after { 
        content: '🚩';
        font-size: 70%;
    }
    
    .ms-sidebar {
        width: 280px;
        max-width: 100%;
        background: #f8f9fa;
        border: 2px solid #dee2e6;
        border-radius: 0;
        padding: 20px;
    }
    
    .ms-sidebar-title {
        margin: 0 0 12px 0;
        font-size: 1.1rem;
        color: #495057;
        text-align: center;
        font-weight: 700;
    }
    
    .ms-highscores {
        max-height: 400px;
        overflow-y: auto;
    }
    
    /* Explosion animation */
    @keyframes explode {
        0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(220, 53, 69, 0.7); }
        50% { transform: scale(1.3); box-shadow: 0 0 0 10px rgba(220, 53, 69, 0.5); }
        100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(220, 53, 69, 0); }
    }
    
    /* Explosion overlay */
    .explosion-overlay {
        width: 60px;
        height: 60px;
        position: fixed;
    }
    
    .explosion-particle {
        position: absolute;
        width: 6px;
        height: 6px;
        background: #ffc107;
        border-radius: 50%;
        animation: particleExplode 0.8s ease-out forwards;
    }
    
    @keyframes particleExplode {
        0% {
            opacity: 1;
            transform: translate(0, 0) scale(1);
        }
        100% {
            opacity: 0;
            transform: translate(var(--tx, 0), var(--ty, 0)) scale(0);
        }
    }
    
    @keyframes pulse {
        0%, 100% { transform: translate(-50%, -50%) scale(1); }
        50% { transform: translate(-50%, -50%) scale(1.5); }
    }
    
    
    
    
    @media (max-width: 768px) {
        .ms-wrap {
            padding: 8px;
            gap: 16px;
        }
        
        .ms-title {
            font-size: 2rem;
            margin-bottom: 16px;
        }
        
        .ms-stats-row {
            gap: 12px;
        }
        
        .ms-stat-box {
            padding: 10px 16px;
            min-width: 100px;
        }
        
        .ms-stat-label {
            font-size: 0.75rem;
        }
        
        .ms-stat-value {
            font-size: 1.5rem;
        }
        
        .ms-controls-row {
            flex-direction: column;
            gap: 12px;
        }
        
        .ms-controls {
            width: 100%;
            justify-content: center;
        }
        
        .ms-select {
            flex: 1;
            max-width: 300px;
        }
        
        .ms-status {
            font-size: 1rem;
            padding: 10px 16px;
            flex-direction: column;
        }
        
        .ms-game-area {
            flex-direction: column;
            gap: 16px;
        }
        
        .ms-board {
            width: 100%;
            justify-content: center;
            padding: 6px;
        }
        
        .ms-sidebar {
            width: 100%;
            order: -1;
        }
        
        .ms-highscores {
            max-height: 250px;
        }
    }
    
    @media (max-width: 480px) {
        .ms-title {
            font-size: 1.75rem;
        }
        
        .ms-stat-box {
            padding: 8px 12px;
            min-width: 80px;
        }
        
        .ms-stat-value {
            font-size: 1.25rem;
        }
    }
    `;
}


