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
            <div class="ms-top">
                <div class="ms-info">⏱️ <span id="ms-time">0</span>s</div>
                <div class="ms-title">MINESWEEPER</div>
                <div class="ms-info">🚩 <span id="ms-flags">0</span></div>
            </div>
            <div class="ms-controls">
                <label>Størrelse</label>
                <select id="ms-size">
                    <option value="9">Liten (9x9 · 10 bomber)</option>
                    <option value="12">Middels (12x12 · 20 bomber)</option>
                    <option value="16">Stor (16x16 · 40 bomber)</option>
                </select>
                <button id="ms-reset" class="btn-primary"><i data-lucide="refresh-cw"></i> Nytt spill</button>
            </div>
            <div class="ms-main">
                <div id="ms-board" class="ms-board" role="grid" aria-label="Minesweeper board"></div>
                <div class="ms-sidebar">
                    <h3>Toppresultater</h3>
                    <div id="minesweeper-high-scores" class="ms-highscores"></div>
                </div>
            </div>
            <div id="ms-status" class="ms-status"></div>
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
        board = createBoard(size, bombs);
        $("ms-status").textContent = '';
        updateFlags();
        paintBoard();
    }

    function render(s) {
        board = createBoard(s, bombs);
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
            if (revealed.has(i) && !board.cells[i].bomb && board.cells[i].num>0) cell.textContent = String(board.cells[i].num);
            host.appendChild(cell);
        }
        // interactions
        addHandler(host, 'click', onLeftClick);
        addHandler(host, 'contextmenu', onRightClick);
    }

    function onLeftClick(e) {
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
            stopTimer();
            $("ms-status").textContent = 'Boom! Du tapte.';
            // show bombs
            for (let k=0;k<board.cells.length;k++) if (board.cells[k].bomb) revealed.add(k);
            paintBoard();
            return;
        }
        if (c.num===0) flood(i);
        paintBoard();
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
            stopTimer();
            $("ms-status").textContent = 'Gratulerer! Du vant!';
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
/* Page framing similar to Tetris (5/90/5) and grotesk font */
    
    
    
    
    .ms-wrap { display:flex; flex-direction:column; align-items:center; gap:14px; }
    .ms-top { display:flex; align-items:center; justify-content:space-between; gap:16px; width:min(560px, 100%); }
    .ms-title { font-weight:800; letter-spacing:.5px; color: #111; }
    .ms-info { background:#f8f9fa; border:2px solid #dee2e6; border-radius: 0; padding:6px 10px; font-weight:700; color:#495057; }
    .ms-controls { display:flex; gap:8px; align-items:center; }
    .ms-controls select { padding:6px 8px; border:2px solid #dee2e6; border-radius: 0; background:#fff; color:#111; }
    .ms-main { display:flex; gap:16px; align-items:flex-start; }
    .ms-board { --ms-size: 9; display:grid; grid-template-columns: repeat(var(--ms-size), 28px); grid-auto-rows: 28px; gap:4px; background:#fff; padding:12px; border:2px solid #dee2e6; border-radius: 0; box-shadow:0 6px 20px rgba(0,0,0,.12); }
    .ms-sidebar { width:200px; background:#f8f9fa; border:2px solid #dee2e6; border-radius: 0; padding:10px; }
    .ms-sidebar h3 { margin:0 0 8px 0; font-size:.9rem; color:#495057; text-align:center; }
    .ms-highscores { max-height:320px; overflow:auto; }
    .ms-cell { background:#f1f3f5; color:#111; border:2px solid #dee2e6; border-radius: 0; cursor:pointer; font-weight:800; display:flex; align-items:center; justify-content:center; }
    .ms-cell.open { background:#fff; }
    .ms-cell.flag::after { content:'🚩'; }
    .ms-status { min-height:20px; color:#495057; font-weight:700; }
    
    
    
    
    @media (max-width: 768px) {
        
        
        .ms-wrap {
            width: 100%;
            gap: 10px;
        }
        .ms-top {
            flex-direction: column;
            width: 100%;
            gap: 10px;
        }
        .ms-title {
            font-size: 1.2rem;
        }
        .ms-main {
            flex-direction: column;
            width: 100%;
            gap: 12px;
        }
        .ms-board {
            width: 100%;
            max-width: 100%;
            justify-content: center;
            padding: 8px;
        }
        .ms-cell {
            width: calc((100vw - 60px) / var(--ms-size) - 4px);
            height: calc((100vw - 60px) / var(--ms-size) - 4px);
            max-width: 32px;
            max-height: 32px;
            font-size: 0.7rem;
        }
        .ms-sidebar {
            width: 100%;
            order: -1;
        }
        .ms-highscores {
            max-height: 200px;
        }
        .ms-controls select {
            font-size: 0.85rem;
            padding: 8px;
        }
    }
    `;
}


