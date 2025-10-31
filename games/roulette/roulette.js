// Roulette MVP
import { createBackButton, setupScrollPrevention, removeScrollPrevention, setupHardReset } from '../../core/gameUtils.js';
import { injectGameStyles, removeGameStyles } from '../../core/gameStyles.js';
let rouletteHandlers = [];

export function init() {
    const gameContent = document.getElementById('game-content');
    if (!gameContent) return;
    gameContent.innerHTML = createBackButton() + `
        <div class="roulette-wrap">
            <div class="roulette-left">
                <div class="roulette-wheel">
                    <div class="wheel-inner" id="wheel-inner"></div>
                    <div class="wheel-pointer"></div>
                </div>
                <div class="roulette-controls">
                    <div class="balance">Saldo: <span id="roul-balance">1 000</span></div>
                    <div class="bets">
                        <button data-bet="red" class="bet-btn bet-red"><i data-lucide="circle"></i> Rød x2</button>
                        <button data-bet="black" class="bet-btn bet-black"><i data-lucide="circle"></i> Svart x2</button>
                        <input id="bet-amount" type="number" min="10" step="10" value="50" />
                    </div>
                    <div class="num-bet">
                        <input id="bet-number" type="number" min="0" max="36" placeholder="Nummer (0-36)"/>
                        <button id="bet-number-btn" class="btn-primary">Sett nummer x35</button>
                    </div>
                    <button id="spin-btn" class="btn-primary"><i data-lucide="play"></i> SPINN</button>
                    <div id="roul-result" class="result-line"></div>
                </div>
            </div>
            <div class="roulette-right">
                <h3>Siste runder</h3>
                <div id="roul-history" class="roul-history"></div>
            </div>
        </div>
    `;
    injectGameStyles('roulette', getGameSpecificStyles());
    if (typeof lucide !== 'undefined') lucide.createIcons();
    
    setupScrollPrevention('roulette');

    const segments = buildSegments();
    drawWheel(document.getElementById('wheel-inner'), segments);

    let balance = 1000;
    let spinning = false;
    const history = [];

    const $ = (id) => document.getElementById(id);
    const setBalance = () => { $("roul-balance").textContent = balance.toLocaleString(); };
    setBalance();

    const addHandler = (el, evt, fn) => { el.addEventListener(evt, fn); rouletteHandlers.push([el, evt, fn]); };

    const spin = (bet) => {
        if (spinning) return;
        const amt = Math.max(0, parseInt($("bet-amount").value, 10) || 0);
        if (amt <= 0 || amt > balance) {
            showResult('Ugyldig innsats');
            return;
        }
        spinning = true;
        balance -= amt;
        setBalance();
        const target = Math.floor(Math.random() * 37); // 0-36
        const turns = 6 + Math.floor(Math.random() * 3);
        const degPer = 360 / 37;
        const finalDeg = 360 * turns + (360 - target * degPer) + (Math.random()*degPer*0.4 - degPer*0.2);
        const wheel = document.getElementById('wheel-inner');
        wheel.style.transition = 'transform 2.2s cubic-bezier(.17,.67,.29,1)';
        wheel.style.transform = `rotate(${finalDeg}deg)`;

        setTimeout(() => {
            const color = segments[target].color;
            let win = 0;
            if (bet?.type === 'color' && bet.value === color) win = amt * 2;
            if (bet?.type === 'number' && bet.value === target) win = amt * 35;
            if (win > 0) balance += win;
            setBalance();
            history.unshift({ n: target, color });
            renderHistory(history);
            showResult(`Resultat: ${target} (${color.toUpperCase()}) ${win>0?'+'+win.toLocaleString():'tap'}`);
            spinning = false;
        }, 2300);
    };

    const renderHistory = (arr) => {
        const box = $("roul-history");
        box.innerHTML = arr.slice(0,12).map(h => `<span class="hist ${h.color}">${h.n}</span>`).join('');
    };
    const showResult = (t) => { $("roul-result").textContent = t; };

    // R shortcut for hard refresh
    const rHandler = setupHardReset('roulette', (e) => {
        // Additional key handling if needed
    });
    addHandler(document, 'keydown', rHandler);
    
    // UI handlers
    const spinBtn = $("spin-btn");
    addHandler(spinBtn, 'click', () => spin());
    document.querySelectorAll('.bet-btn').forEach(btn => {
        addHandler(btn, 'click', () => {
            const bet = { type: 'color', value: btn.dataset.bet };
            spin(bet);
        });
    });
    addHandler($("bet-number-btn"), 'click', () => {
        const n = parseInt($("bet-number").value, 10);
        if (Number.isInteger(n) && n>=0 && n<=36) spin({ type:'number', value:n });
    });
}

export function cleanup() {
    // remove listeners
    rouletteHandlers.forEach(([el, evt, fn]) => { try { el.removeEventListener(evt, fn); } catch {} });
    rouletteHandlers = [];
    removeScrollPrevention('roulette');
    removeGameStyles('roulette');
}

function getGameSpecificStyles() {
    return `
.roulette-wrap { display:flex; gap:20px; align-items:center; justify-content:center; width:100%; max-width:min(1100px, 95vw); }
    .roulette-left { display:flex; flex-direction:column; align-items:center; gap:12px; }
    .roulette-right { width:200px; background:#f8f9fa; border:2px solid #dee2e6; border-radius: 0; padding:12px; }
    .roulette-right h3 { margin:0 0 8px 0; font-size:.9rem; color:#495057; text-align:center; }
    .roul-history { display:flex; flex-wrap:wrap; gap:6px; }
    .roul-history .hist { width:36px; height:36px; border-radius: 0; display:flex; align-items:center; justify-content:center; color:#fff; font-weight:700; }
    .roul-history .hist.red { background:#dc3545; }
    .roul-history .hist.black { background:#212529; }
    .roul-history .hist.green { background:#198754; }
    .roulette-wheel { position:relative; width:320px; height:320px; border:8px solid #6c757d; border-radius:50%; background:#000; box-shadow:0 6px 20px rgba(0,0,0,.15); }
    .wheel-inner { position:absolute; inset:0; border-radius:50%; background:conic-gradient(#198754 0deg 9.73deg, #dc3545 9.73deg 19.46deg, #212529 19.46deg 29.19deg, #dc3545 29.19deg 38.92deg, #212529 38.92deg 48.65deg, #dc3545 48.65deg 58.38deg, #212529 58.38deg 68.11deg, #dc3545 68.11deg 77.84deg, #212529 77.84deg 87.57deg, #dc3545 87.57deg 97.3deg, #212529 97.3deg 107.03deg, #dc3545 107.03deg 116.76deg, #212529 116.76deg 126.49deg, #dc3545 126.49deg 136.22deg, #212529 136.22deg 145.95deg, #dc3545 145.95deg 155.68deg, #212529 155.68deg 165.41deg, #dc3545 165.41deg 175.14deg, #212529 175.14deg 184.87deg, #dc3545 184.87deg 194.6deg, #212529 194.6deg 204.33deg, #dc3545 204.33deg 214.06deg, #212529 214.06deg 223.79deg, #dc3545 223.79deg 233.52deg, #212529 233.52deg 243.25deg, #dc3545 243.25deg 252.98deg, #212529 252.98deg 262.71deg, #dc3545 262.71deg 272.44deg, #212529 272.44deg 282.17deg, #dc3545 282.17deg 291.9deg, #212529 291.9deg 301.63deg, #dc3545 301.63deg 311.36deg, #212529 311.36deg 321.09deg, #dc3545 321.09deg 330.82deg, #212529 330.82deg 340.55deg, #dc3545 340.55deg 350.28deg, #212529 350.28deg 360deg); }
    .wheel-pointer { position:absolute; top:-12px; left:50%; transform:translateX(-50%); width:0; height:0; border-left:10px solid transparent; border-right:10px solid transparent; border-bottom:12px solid #ffc107; }
    .roulette-controls { display:flex; flex-direction:column; gap:10px; width:320px; }
    .balance { background:#f8f9fa; border:2px solid #dee2e6; border-radius: 0; padding:8px; text-align:center; font-weight:700; }
    .bets { display:flex; gap:8px; align-items:center; justify-content:center; }
    .bet-btn { display:flex; align-items:center; gap:6px; padding:6px 10px; border-radius: 0; border:2px solid #dee2e6; cursor:pointer; background:#fff; font-weight:700; }
    .bet-red { color:#dc3545; }
    .bet-black { color:#212529; }
    #bet-amount { width:80px; padding:6px 8px; border:2px solid #dee2e6; border-radius: 0; }
    .num-bet { display:flex; gap:8px; justify-content:center; }
    #bet-number { width:130px; padding:6px 8px; border:2px solid #dee2e6; border-radius: 0; }
    .result-line { text-align:center; color:#495057; min-height:20px; font-weight:600; }
    @media (max-width: 768px) {
        
        .roulette-wrap {
            flex-direction: column;
            gap: 12px;
            width: 100%;
            max-width: 100%;
        }
        .roulette-left {
            order: 2;
            width: 100%;
        }
        .roulette-wheel {
            width: 100%;
            max-width: min(320px, calc(100vw - 40px));
            height: auto;
            aspect-ratio: 1;
        }
        .roulette-controls {
            width: 100%;
            max-width: 320px;
        }
        .roulette-right {
            order: 1;
            width: 100%;
            max-width: 100%;
        }
        .roul-history .hist {
            width: 32px;
            height: 32px;
            font-size: 0.85rem;
        }
        .balance {
            padding: 10px;
            font-size: 0.9rem;
        }
        .bets {
            flex-wrap: wrap;
            gap: 8px;
        }
        .bet-btn {
            padding: 8px 12px;
            font-size: 0.85rem;
        }
        #bet-amount {
            width: 100%;
            max-width: 120px;
            padding: 8px;
            font-size: 0.9rem;
        }
        .num-bet {
            flex-wrap: wrap;
            gap: 8px;
        }
        #bet-number {
            width: 100%;
            max-width: 200px;
            padding: 8px;
            font-size: 0.9rem;
        }
        .result-line {
            font-size: 0.85rem;
        }
    }
    `;
}

function buildSegments() {
    // map of roulette colors (European)
    const reds = new Set([1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36]);
    const arr = [];
    for (let i=0;i<=36;i++) {
        const color = i===0 ? 'green' : (reds.has(i) ? 'red' : 'black');
        arr.push({ n:i, color });
    }
    return arr;
}

function drawWheel(el, segs) {
    // Already using conic gradient background; numbers overlay optional for MVP.
    // Keep it simple for performance.
    (void)el; (void)segs;
}

