// Casino MVP - Simple Slots
import { createBackButton } from '../../core/gameUtils.js';
import { injectGameStyles, removeGameStyles } from '../../core/gameStyles.js';
let slotsHandlers = [];
let spinTimeout = null;

export function init() {
    const gameContent = document.getElementById('game-content');
    if (!gameContent) return;
    gameContent.innerHTML = createBackButton() + `
        <div class="casino-wrap">
            <div class="casino-main">
                <div class="casino-header">
                    <h1>Casino Slots</h1>
                    <div class="casino-stats">
                        <div class="stat-box">
                            <div class="stat-label">Saldo</div>
                            <div class="stat-value" id="slots-balance">1 000</div>
                        </div>
                    </div>
                </div>
                <div class="casino-machine-area">
                    <div class="casino-machine">
                        <div class="reel-container">
                            <div id="reel1" class="reel">🍒</div>
                            <div id="reel2" class="reel">🍋</div>
                            <div id="reel3" class="reel">🔔</div>
                        </div>
                        <div id="slots-result" class="result-line"></div>
                    </div>
                </div>
                <div class="casino-controls">
                    <div class="bet-control">
                        <label for="slots-amount" class="bet-label">Innsats</label>
                        <input id="slots-amount" type="number" min="10" step="10" value="50" class="bet-input" />
                    </div>
                    <button id="slots-spin" class="btn-primary">
                        <i data-lucide="play"></i> SPINN
                    </button>
                </div>
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
        const spinBtn = $("slots-spin");
        spinBtn.disabled = true;
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
            spinBtn.disabled = false;
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
    removeGameStyles('casino');
}

function getGameSpecificStyles() {
    return `
        .casino-wrap {
            width: 100%;
            max-width: min(700px, 95vw);
            max-height: calc(100vh - 20px);
            overflow-y: auto;
            overflow-x: hidden;
            display: flex;
            flex-direction: column;
            align-items: center;
            padding: 10px;
            box-sizing: border-box;
        }
        .casino-main {
            width: 100%;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 20px;
            flex-shrink: 0;
        }
        .casino-header {
            flex-shrink: 0;
            width: 100%;
            text-align: center;
        }
        .casino-header h1 {
            font-size: 2.5rem;
            font-weight: 800;
            color: #111;
            margin: 0 0 15px 0;
            text-align: center;
        }
        .casino-stats {
            display: flex;
            gap: 15px;
            justify-content: center;
            flex-wrap: wrap;
        }
        .stat-box {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            border-radius: 0;
            padding: 15px 30px;
            text-align: center;
            min-width: 150px;
            box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
        }
        .stat-label {
            color: rgba(255, 255, 255, 0.9);
            font-size: 0.75rem;
            font-weight: 700;
            text-transform: uppercase;
            margin-bottom: 5px;
            letter-spacing: 1px;
        }
        .stat-value {
            color: #fff;
            font-size: 1.75rem;
            font-weight: 800;
        }
        .casino-machine-area {
            flex-shrink: 0;
            width: 100%;
            display: flex;
            justify-content: center;
            padding: 20px 0;
        }
        .casino-machine {
            background: linear-gradient(145deg, #1a1a1a 0%, #2d2d2d 100%);
            border: 6px solid #ffd700;
            border-radius: 0;
            padding: 30px;
            box-shadow: 
                0 8px 32px rgba(0, 0, 0, 0.4),
                inset 0 2px 10px rgba(255, 215, 0, 0.1),
                0 0 20px rgba(255, 215, 0, 0.2);
            width: 100%;
            max-width: min(500px, calc(95vw - 40px));
        }
        .reel-container {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 15px;
            margin-bottom: 20px;
        }
        .reel {
            aspect-ratio: 1;
            display: flex;
            align-items: center;
            justify-content: center;
            background: linear-gradient(145deg, #0a0a0a 0%, #1f1f1f 100%);
            border: 3px solid #444;
            border-radius: 0;
            font-size: 64px;
            position: relative;
            overflow: hidden;
            box-shadow: 
                inset 0 2px 8px rgba(0, 0, 0, 0.5),
                0 2px 8px rgba(0, 0, 0, 0.3);
            transition: all 0.2s ease;
        }
        .reel:before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: linear-gradient(180deg, 
                rgba(255, 255, 255, 0.1) 0%, 
                transparent 50%, 
                rgba(0, 0, 0, 0.3) 100%);
            pointer-events: none;
        }
        .result-line {
            text-align: center;
            color: #ffd700;
            font-size: 1.1rem;
            font-weight: 700;
            min-height: 24px;
            padding: 10px;
            background: rgba(0, 0, 0, 0.3);
            border-radius: 0;
            border: 2px solid rgba(255, 215, 0, 0.3);
            text-transform: uppercase;
            letter-spacing: 1px;
        }
        .casino-controls {
            flex-shrink: 0;
            width: 100%;
            max-width: min(500px, calc(95vw - 40px));
            display: flex;
            flex-direction: column;
            gap: 15px;
            align-items: center;
        }
        .bet-control {
            width: 100%;
            display: flex;
            flex-direction: column;
            gap: 8px;
            align-items: center;
        }
        .bet-label {
            color: #6c757d;
            font-size: 0.9rem;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 1px;
        }
        .bet-input {
            width: 100%;
            max-width: 200px;
            padding: 12px 16px;
            border: 2px solid #dee2e6;
            border-radius: 0;
            font-size: 1rem;
            font-weight: 600;
            text-align: center;
            background: #fff;
            color: #111;
            transition: border-color 0.2s ease;
        }
        .bet-input:focus {
            outline: none;
            border-color: #667eea;
            box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
        }
        .btn-primary {
            width: 100%;
            max-width: 300px;
            padding: 16px 32px;
            font-size: 1.1rem;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 1px;
            min-height: 56px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border: none;
            border-radius: 0;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
            transition: all 0.2s ease;
        }
        .btn-primary:hover:not(:disabled) {
            transform: translateY(-2px);
            box-shadow: 0 6px 16px rgba(102, 126, 234, 0.5);
        }
        .btn-primary:active:not(:disabled) {
            transform: translateY(0);
        }
        .btn-primary:disabled {
            opacity: 0.6;
            cursor: not-allowed;
            transform: none;
        }
        .btn-primary i {
            width: 20px;
            height: 20px;
        }
        @media (max-width: 768px) {
            .casino-wrap {
                max-height: calc(100vh - 10px);
                padding: 5px;
            }
            .casino-header h1 {
                font-size: 2rem;
                margin-bottom: 12px;
            }
            .casino-stats {
                width: 100%;
            }
            .stat-box {
                width: 100%;
                padding: 12px 20px;
            }
            .stat-value {
                font-size: 1.5rem;
            }
            .casino-machine {
                padding: 20px;
            }
            .reel-container {
                gap: 10px;
            }
            .reel {
                font-size: 48px;
            }
            .result-line {
                font-size: 0.95rem;
                padding: 8px;
            }
            .casino-controls {
                width: 100%;
            }
            .bet-input {
                max-width: 100%;
            }
            .btn-primary {
                max-width: 100%;
                padding: 14px 24px;
                font-size: 1rem;
            }
        }
        @media (max-width: 480px) {
            .casino-header h1 {
                font-size: 1.75rem;
            }
            .stat-value {
                font-size: 1.25rem;
            }
            .reel {
                font-size: 40px;
            }
            .casino-machine {
                padding: 15px;
            }
            .reel-container {
                gap: 8px;
            }
        }
    `;
}
