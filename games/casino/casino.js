// Casino MVP - Simple Slots
let slotsHandlers = [];
let spinTimeout = null;

export function init() {
    const gameContent = document.getElementById('game-content');
    if (!gameContent) return;
    gameContent.innerHTML = `
        <button class="back-button-tetris" onclick="window.goHome()">
            <i data-lucide=\"arrow-left\"></i> Tilbake
        </button>
        <div class="slots-wrap">
            <div class="slots-machine">
                <div id="reel1" class="reel">🍒</div>
                <div id="reel2" class="reel">🍋</div>
                <div id="reel3" class="reel">🔔</div>
            </div>
            <div class="slots-controls">
                <div class="balance">Saldo: <span id="slots-balance">1 000</span></div>
                <div class="bet">
                    <label>Innsats</label>
                    <input id="slots-amount" type="number" min="10" step="10" value="50" />
                </div>
                <button id="slots-spin" class="btn-primary"><i data-lucide=\"play\"></i> SPINN</button>
                <div id="slots-result" class="result-line"></div>
            </div>
        </div>
    `;
    injectGameStyles('casino', getGameSpecificStyles());
    if (typeof lucide !== 'undefined') lucide.createIcons();

    const symbols = ['🍒','🍋','🍇','🔔','⭐','7️⃣'];
    let balance = 1000;
    const $ = (id) => document.getElementById(id);
    const setBalance = () => { $("slots-balance").textContent = balance.toLocaleString(); };
    setBalance();

    const addHandler = (el, evt, fn) => { el.addEventListener(evt, fn); slotsHandlers.push([el, evt, fn]); };

    const spin = () => {
        const amt = Math.max(0, parseInt($("slots-amount").value, 10) || 0);
        if (amt <= 0 || amt > balance) { show('Ugyldig innsats'); return; }
        balance -= amt; setBalance(); show('Spinning…');
        const r1 = $("reel1"), r2 = $("reel2"), r3 = $("reel3");
        let t = 0;
        clearTimeout(spinTimeout);
        const tick = () => {
            t += 80;
            r1.textContent = symbols[Math.floor(Math.random()*symbols.length)];
            r2.textContent = symbols[Math.floor(Math.random()*symbols.length)];
            r3.textContent = symbols[Math.floor(Math.random()*symbols.length)];
            if (t < 1200) spinTimeout = setTimeout(tick, 80);
            else finish();
        };
        tick();
        const finish = () => {
            const a = r1.textContent, b = r2.textContent, c = r3.textContent;
            let win = 0;
            if (a===b && b===c) win = amt * 10;
            else if (a===b || b===c || a===c) win = amt * 2;
            if (win>0) balance += win;
            setBalance();
            show(win>0? `Vant ${win.toLocaleString()}!` : 'Ingen gevinst');
        };
    };
    const show = (t) => { $("slots-result").textContent = t; };

    // R shortcut for hard refresh
    const rHandler = (e) => {
        // Don't process shortcuts if user is typing in an input field
        const activeElement = document.activeElement;
        if (activeElement && (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA')) {
            return;
        }
        
        
    };
    addHandler(document, 'keydown', rHandler);

    addHandler($("slots-spin"), 'click', spin);
}

export function cleanup() {
    slotsHandlers.forEach(([el, evt, fn]) => { try { el.removeEventListener(evt, fn); } catch {} });
    slotsHandlers = [];
    clearTimeout(spinTimeout);
    const s = document.getElementById('slots-style');
        removeGameStyles('casino');
}

function getGameSpecificStyles() {
    return `
.slots-wrap { display:flex; gap:20px; align-items:center; justify-content:center; width:100%; max-width:min(900px, 95vw); }
    .slots-machine { display:grid; grid-template-columns: repeat(3, 100px); gap:10px; background:#000; padding:14px; border:6px solid #6c757d; border-radius: 0; box-shadow:0 6px 20px rgba(0,0,0,.15); }
    .reel { width:100px; height:100px; display:flex; align-items:center; justify-content:center; background:#111; color:#fff; font-size:48px; border-radius: 0; border:2px solid #343a40; }
    .slots-controls { display:flex; flex-direction:column; gap:10px; width:240px; }
    .balance { background:#f8f9fa; border:2px solid #dee2e6; border-radius: 0; padding:8px; text-align:center; font-weight:700; }
    .bet { display:flex; align-items:center; gap:8px; justify-content:center; }
    #slots-amount { width:100px; padding:6px 8px; border:2px solid #dee2e6; border-radius: 0; }
    .result-line { text-align:center; color:#495057; min-height:20px; font-weight:600; }
    @media (max-width: 768px) {
        
        .slots-wrap {
            flex-direction: column;
            gap: 12px;
            width: 100%;
            max-width: 100%;
        }
        .slots-machine {
            width: 100%;
            max-width: 100%;
            grid-template-columns: repeat(3, 1fr);
            gap: 8px;
            padding: 10px;
        }
        .reel {
            width: 100%;
            height: auto;
            aspect-ratio: 1;
            font-size: 36px;
        }
        .slots-controls {
            width: 100%;
        }
        .balance {
            padding: 10px;
            font-size: 0.9rem;
        }
        .bet {
            flex-wrap: wrap;
            gap: 8px;
        }
        #slots-amount {
            width: 100%;
            padding: 8px;
            font-size: 0.9rem;
        }
        .result-line {
            font-size: 0.85rem;
        }
    }
    `;
}

