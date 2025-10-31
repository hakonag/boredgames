// Reaction Time Game Module
import { createBackButton, setupScrollPrevention, removeScrollPrevention, setupHardReset } from '../../core/gameUtils.js';
import { injectGameStyles, removeGameStyles } from '../../core/gameStyles.js';

let reactionTimeGame = null;

export function init() {
    const gameContent = document.getElementById('game-content');
    gameContent.innerHTML = createBackButton() + `
        <div class="reactiontime-wrap">
            <div class="reactiontime-header">
                <h1>Reaksjonstid</h1>
                <div class="reactiontime-stats">
                    <div class="stat-box">
                        <div class="stat-label">Siste tid</div>
                        <div class="stat-value" id="last-time-reactiontime">-</div>
                    </div>
                    <div class="stat-box">
                        <div class="stat-label">Snitt</div>
                        <div class="stat-value" id="avg-time-reactiontime">-</div>
                    </div>
                    <div class="stat-box">
                        <div class="stat-label">Best</div>
                        <div class="stat-value" id="best-time-reactiontime">-</div>
                    </div>
                </div>
            </div>
            <div class="reactiontime-game">
                <div class="reactiontime-instructions">
                    <p id="instruction-reactiontime">Trykk når skjermen blir grønn!</p>
                </div>
                <div class="reactiontime-box" id="reaction-box" onclick="window.clickReactionBox()">
                    <div id="box-text">Trykk for å starte</div>
                </div>
                <div class="reactiontime-history" id="history-reactiontime"></div>
                <div class="reactiontime-buttons">
                    <button onclick="window.resetReactionTime()" class="btn-secondary">
                        <i data-lucide="refresh-cw"></i> Nullstill
                    </button>
                </div>
            </div>
        </div>
    `;

    injectGameStyles('reactiontime', getGameSpecificStyles());
    if (typeof lucide !== 'undefined') lucide.createIcons();
    
    setupScrollPrevention('reactiontime');
    
    reactionTimeGame = new ReactionTimeGame();
    window.reactionTimeGame = reactionTimeGame;
    window.clickReactionBox = () => reactionTimeGame.clickBox();
    window.resetReactionTime = () => reactionTimeGame.reset();
    
    // Load best time
    const best = localStorage.getItem('reactiontime-best');
    if (best) {
        document.getElementById('best-time-reactiontime').textContent = `${best}ms`;
    }
}

export function cleanup() {
    if (reactionTimeGame) {
        reactionTimeGame.removeControls();
        reactionTimeGame = null;
    }
    removeScrollPrevention('reactiontime');
    removeGameStyles('reactiontime');
}

class ReactionTimeGame {
    constructor() {
        this.state = 'waiting'; // waiting, ready, go, clicked
        this.startTime = 0;
        this.reactionTimes = [];
        this.best = parseInt(localStorage.getItem('reactiontime-best') || '9999');
        this.setupControls();
        this.reset();
    }
    
    reset() {
        this.reactionTimes = [];
        this.updateDisplay();
        this.startWaiting();
    }
    
    startWaiting() {
        this.state = 'waiting';
        const box = document.getElementById('reaction-box');
        const text = document.getElementById('box-text');
        box.style.backgroundColor = '#ef4444';
        box.style.cursor = 'pointer';
        text.textContent = 'Klikk for å starte';
        document.getElementById('instruction-reactiontime').textContent = 'Trykk når skjermen blir grønn!';
        document.getElementById('last-time-reactiontime').textContent = '-';
        document.getElementById('avg-time-reactiontime').textContent = '-';
    }
    
    startTest() {
        this.state = 'ready';
        const box = document.getElementById('reaction-box');
        const text = document.getElementById('box-text');
        box.style.backgroundColor = '#f59e0b';
        text.textContent = 'Vent...';
        document.getElementById('instruction-reactiontime').textContent = 'Vent på grønn...';
        
        // Random delay between 2-5 seconds
        const delay = Math.random() * 3000 + 2000;
        
        setTimeout(() => {
            if (this.state === 'ready') {
                this.state = 'go';
                this.startTime = performance.now();
                box.style.backgroundColor = '#22c55e';
                text.textContent = 'KLIKK NÅ!';
                document.getElementById('instruction-reactiontime').textContent = 'Klikk så raskt som mulig!';
            }
        }, delay);
    }
    
    clickBox() {
        if (this.state === 'waiting') {
            this.startTest();
        } else if (this.state === 'go') {
            const reactionTime = Math.round(performance.now() - this.startTime);
            this.reactionTimes.push(reactionTime);
            
            if (reactionTime < this.best) {
                this.best = reactionTime;
                localStorage.setItem('reactiontime-best', String(this.best));
            }
            
            this.updateDisplay();
            
            // Show result for 2 seconds, then reset
            setTimeout(() => {
                this.startWaiting();
            }, 2000);
        } else if (this.state === 'ready') {
            // Clicked too early
            const box = document.getElementById('reaction-box');
            const text = document.getElementById('box-text');
            box.style.backgroundColor = '#ef4444';
            text.textContent = 'For tidlig!';
            document.getElementById('instruction-reactiontime').textContent = 'Du klikket for tidlig! Prøv igjen.';
            
            setTimeout(() => {
                this.startWaiting();
            }, 2000);
        }
    }
    
    updateDisplay() {
        if (this.reactionTimes.length > 0) {
            const last = this.reactionTimes[this.reactionTimes.length - 1];
            document.getElementById('last-time-reactiontime').textContent = `${last}ms`;
            
            const avg = Math.round(this.reactionTimes.reduce((a, b) => a + b, 0) / this.reactionTimes.length);
            document.getElementById('avg-time-reactiontime').textContent = `${avg}ms`;
            
            if (this.best < 9999) {
                document.getElementById('best-time-reactiontime').textContent = `${this.best}ms`;
            }
            
            // Update history
            const historyEl = document.getElementById('history-reactiontime');
            const entry = document.createElement('div');
            entry.className = 'history-entry';
            entry.textContent = `${last}ms`;
            historyEl.insertBefore(entry, historyEl.firstChild);
            
            // Keep only last 10
            while (historyEl.children.length > 10) {
                historyEl.removeChild(historyEl.lastChild);
            }
        }
    }
    
    setupControls() {
        this.keyHandler = setupHardReset('reactiontime', (e) => {
            // Space to click box
            if (e.key === ' ') {
                e.preventDefault();
                this.clickBox();
            }
        });
        document.addEventListener('keydown', this.keyHandler);
    }
    
    removeControls() {
        if (this.keyHandler) {
            document.removeEventListener('keydown', this.keyHandler);
        }
    }
}

function getGameSpecificStyles() {
    return `
        .reactiontime-wrap {
            width: 100%;
            max-width: min(700px, 95vw);
            display: flex;
            flex-direction: column;
            align-items: center;
        }
        .reactiontime-header {
            text-align: center;
            margin-bottom: 30px;
        }
        .reactiontime-header h1 {
            font-size: 2.5rem;
            font-weight: 800;
            color: #111;
            margin: 0 0 20px 0;
        }
        .reactiontime-stats {
            display: flex;
            gap: 15px;
            justify-content: center;
            margin-bottom: 20px;
        }
        .stat-box {
            background: #f8f9fa;
            border: 2px solid #dee2e6;
            border-radius: 0;
            padding: 15px 25px;
            text-align: center;
            min-width: 100px;
        }
        .stat-label {
            color: #6c757d;
            font-size: 0.85rem;
            font-weight: 600;
            margin-bottom: 8px;
        }
        .stat-value {
            color: #212529;
            font-size: 1.5rem;
            font-weight: 800;
        }
        .reactiontime-game {
            width: 100%;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 30px;
        }
        .reactiontime-instructions {
            text-align: center;
        }
        .reactiontime-instructions p {
            font-size: 1.3rem;
            font-weight: 600;
            color: #495057;
        }
        .reactiontime-box {
            width: 400px;
            height: 400px;
            max-width: min(400px, calc(95vw - 40px));
            max-height: min(400px, calc(95vw - 40px));
            border-radius: 0;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            transition: background-color 0.3s ease;
            box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
        }
        #box-text {
            font-size: 2rem;
            font-weight: 800;
            color: white;
            text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
        }
        .reactiontime-history {
            width: 100%;
            max-width: 400px;
            max-height: 150px;
            overflow-y: auto;
            background: #f8f9fa;
            border: 2px solid #dee2e6;
            border-radius: 0;
            padding: 15px;
            display: flex;
            flex-wrap: wrap;
            gap: 10px;
            justify-content: center;
        }
        .history-entry {
            padding: 8px 16px;
            background: #e9ecef;
            border-radius: 0;
            font-weight: 600;
            color: #495057;
        }
        .reactiontime-buttons {
            display: flex;
            gap: 10px;
            justify-content: center;
        }
        .btn-secondary {
            padding: 12px 24px;
            border-radius: 0;
            font-size: 1rem;
            cursor: pointer;
            font-weight: 600;
            display: flex;
            align-items: center;
            gap: 6px;
            border: 2px solid;
            background: #6c757d;
            color: white;
            border-color: #5a6268;
            transition: all 0.2s ease;
        }
        .btn-secondary:hover {
            background: #5a6268;
        }
        .btn-secondary i {
            width: 16px;
            height: 16px;
        }
        @media (max-width: 768px) {
            .reactiontime-header h1 {
                font-size: 2rem;
            }
            .reactiontime-stats {
                flex-direction: column;
                gap: 10px;
            }
            .stat-box {
                width: 100%;
            }
            .reactiontime-box {
                width: 100%;
                height: 300px;
                max-width: calc(100vw - 40px);
                max-height: calc(100vw - 40px);
            }
        }
    `;
}

