// Click Counter Game Module
import { createBackButton, setupScrollPrevention, removeScrollPrevention, setupHardReset } from '../../core/gameUtils.js';
import { injectGameStyles, removeGameStyles } from '../../core/gameStyles.js';

let clickCounterGame = null;

export function init() {
    const gameContent = document.getElementById('game-content');
    gameContent.innerHTML = createBackButton() + `
        <div class="clickcounter-wrap">
            <div class="clickcounter-header">
                <h1>Klikk Teller</h1>
                <div class="clickcounter-stats">
                    <div class="stat-box">
                        <div class="stat-label">Klikk</div>
                        <div class="stat-value" id="clicks-clickcounter">0</div>
                    </div>
                    <div class="stat-box">
                        <div class="stat-label">KPS</div>
                        <div class="stat-value" id="cps-clickcounter">0.0</div>
                    </div>
                    <div class="stat-box">
                        <div class="stat-label">Rekord</div>
                        <div class="stat-value" id="best-clickcounter">0</div>
                    </div>
                </div>
            </div>
            <div class="clickcounter-game">
                <div class="clickcounter-instructions">
                    <p>Klikk så raskt som mulig!</p>
                    <p id="timer-clickcounter">Tid: 0s</p>
                </div>
                <button class="clickcounter-button" id="click-button" onclick="window.incrementClicks()">
                    <span class="click-emoji">🖱️</span>
                    <span class="click-label">KLIKK!</span>
                </button>
                <div class="clickcounter-buttons">
                    <button onclick="window.startClickCounter()" class="btn-primary" id="start-btn">
                        <i data-lucide="play"></i> Start
                    </button>
                    <button onclick="window.resetClickCounter()" class="btn-secondary" id="reset-btn">
                        <i data-lucide="refresh-cw"></i> Nullstill
                    </button>
                </div>
                <div class="clickcounter-history" id="history-clickcounter"></div>
            </div>
        </div>
    `;

    injectGameStyles('clickcounter', getGameSpecificStyles());
    if (typeof lucide !== 'undefined') lucide.createIcons();
    
    setupScrollPrevention('clickcounter');
    
    clickCounterGame = new ClickCounterGame();
    window.clickCounterGame = clickCounterGame;
    window.incrementClicks = () => clickCounterGame.increment();
    window.startClickCounter = () => clickCounterGame.start();
    window.resetClickCounter = () => clickCounterGame.reset();
    
    // Load best score
    const best = localStorage.getItem('clickcounter-best');
    if (best) {
        document.getElementById('best-clickcounter').textContent = best;
    }
}

export function cleanup() {
    if (clickCounterGame) {
        clickCounterGame.removeControls();
        clickCounterGame = null;
    }
    removeScrollPrevention('clickcounter');
    removeGameStyles('clickcounter');
}

class ClickCounterGame {
    constructor() {
        this.clicks = 0;
        this.startTime = 0;
        this.endTime = 0;
        this.duration = 10; // 10 seconds
        this.isRunning = false;
        this.intervalId = null;
        this.best = parseInt(localStorage.getItem('clickcounter-best') || '0');
        this.setupControls();
        this.reset();
    }
    
    start() {
        if (this.isRunning) return;
        
        this.clicks = 0;
        this.isRunning = true;
        this.startTime = Date.now();
        this.endTime = this.startTime + (this.duration * 1000);
        
        document.getElementById('start-btn').disabled = true;
        document.getElementById('reset-btn').disabled = true;
        document.getElementById('click-button').disabled = false;
        document.getElementById('timer-clickcounter').textContent = `Tid: ${this.duration}s`;
        
        // Update timer
        this.intervalId = setInterval(() => {
            if (!this.isRunning) return;
            
            const remaining = Math.max(0, Math.ceil((this.endTime - Date.now()) / 1000));
            document.getElementById('timer-clickcounter').textContent = `Tid: ${remaining}s`;
            
            if (remaining === 0) {
                this.stop();
            }
        }, 100);
        
        this.updateDisplay();
    }
    
    increment() {
        if (!this.isRunning) return;
        
        this.clicks++;
        this.updateDisplay();
    }
    
    stop() {
        if (!this.isRunning) return;
        
        this.isRunning = false;
        clearInterval(this.intervalId);
        
        document.getElementById('start-btn').disabled = false;
        document.getElementById('reset-btn').disabled = false;
        document.getElementById('click-button').disabled = true;
        
        // Calculate CPS
        const cps = (this.clicks / this.duration).toFixed(1);
        
        // Update best
        if (this.clicks > this.best) {
            this.best = this.clicks;
            localStorage.setItem('clickcounter-best', String(this.best));
            document.getElementById('best-clickcounter').textContent = this.best;
        }
        
        // Add to history
        const historyEl = document.getElementById('history-clickcounter');
        const entry = document.createElement('div');
        entry.className = 'history-entry';
        entry.innerHTML = `<strong>${this.clicks}</strong> klikk (${cps} KPS)`;
        historyEl.insertBefore(entry, historyEl.firstChild);
        
        // Keep only last 10
        while (historyEl.children.length > 10) {
            historyEl.removeChild(historyEl.lastChild);
        }
        
        this.updateDisplay();
    }
    
    reset() {
        if (this.isRunning) {
            clearInterval(this.intervalId);
        }
        
        this.clicks = 0;
        this.isRunning = false;
        this.startTime = 0;
        this.endTime = 0;
        
        document.getElementById('start-btn').disabled = false;
        document.getElementById('reset-btn').disabled = false;
        document.getElementById('click-button').disabled = true;
        document.getElementById('timer-clickcounter').textContent = 'Tid: 0s';
        
        this.updateDisplay();
    }
    
    updateDisplay() {
        document.getElementById('clicks-clickcounter').textContent = this.clicks;
        
        if (this.isRunning && this.startTime > 0) {
            const elapsed = (Date.now() - this.startTime) / 1000;
            const cps = elapsed > 0 ? (this.clicks / elapsed).toFixed(1) : '0.0';
            document.getElementById('cps-clickcounter').textContent = cps;
        } else {
            document.getElementById('cps-clickcounter').textContent = '0.0';
        }
    }
    
    setupControls() {
        this.keyHandler = (e) => {
            // Don't process shortcuts if user is typing in an input field
            const activeElement = document.activeElement;
            if (activeElement && (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA')) {
                return;
            }
            
            // Handle restart (R)
            if (e.key === 'r' || e.key === 'R') {
                window.location.href = 'https://hakonag.github.io/boredgames/?game=clickcounter';
                return;
            }
            
            // Space to click
            if (e.key === ' ' && this.isRunning) {
                e.preventDefault();
                this.increment();
            }
        };
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
        .clickcounter-wrap {
            width: 100%;
            max-width: min(700px, 95vw);
            display: flex;
            flex-direction: column;
            align-items: center;
        }
        .clickcounter-header {
            text-align: center;
            margin-bottom: 30px;
        }
        .clickcounter-header h1 {
            font-size: 2.5rem;
            font-weight: 800;
            color: #111;
            margin: 0 0 20px 0;
        }
        .clickcounter-stats {
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
            font-size: 2rem;
            font-weight: 800;
        }
        .clickcounter-game {
            width: 100%;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 30px;
        }
        .clickcounter-instructions {
            text-align: center;
        }
        .clickcounter-instructions p {
            font-size: 1.2rem;
            font-weight: 600;
            color: #495057;
            margin: 10px 0;
        }
        .clickcounter-button {
            width: 300px;
            height: 300px;
            max-width: min(300px, calc(95vw - 40px));
            max-height: min(300px, calc(95vw - 40px));
            border-radius: 50%;
            background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
            border: 5px solid #1e40af;
            cursor: pointer;
            transition: all 0.1s ease;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 15px;
            box-shadow: 0 8px 24px rgba(59, 130, 246, 0.3);
        }
        .clickcounter-button:hover:not(:disabled) {
            transform: scale(1.05);
            box-shadow: 0 12px 32px rgba(59, 130, 246, 0.4);
        }
        .clickcounter-button:active:not(:disabled) {
            transform: scale(0.95);
        }
        .clickcounter-button:disabled {
            opacity: 0.5;
            cursor: not-allowed;
        }
        .click-emoji {
            font-size: 4rem;
        }
        .click-label {
            font-size: 1.5rem;
            font-weight: 800;
            color: white;
            text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
        }
        .clickcounter-buttons {
            display: flex;
            gap: 15px;
            justify-content: center;
        }
        .btn-primary, .btn-secondary {
            padding: 12px 24px;
            border-radius: 0;
            font-size: 1rem;
            cursor: pointer;
            font-weight: 600;
            display: flex;
            align-items: center;
            gap: 6px;
            border: 2px solid;
            transition: all 0.2s ease;
        }
        .btn-primary {
            background: #3b82f6;
            color: white;
            border-color: #2563eb;
        }
        .btn-primary:hover:not(:disabled) {
            background: #2563eb;
        }
        .btn-primary:disabled {
            background: #9ca3af;
            border-color: #6b7280;
            cursor: not-allowed;
        }
        .btn-secondary {
            background: #6c757d;
            color: white;
            border-color: #5a6268;
        }
        .btn-secondary:hover:not(:disabled) {
            background: #5a6268;
        }
        .btn-secondary:disabled {
            background: #9ca3af;
            border-color: #6b7280;
            cursor: not-allowed;
        }
        .btn-primary i, .btn-secondary i {
            width: 16px;
            height: 16px;
        }
        .clickcounter-history {
            width: 100%;
            max-width: 400px;
            max-height: 200px;
            overflow-y: auto;
            background: #f8f9fa;
            border: 2px solid #dee2e6;
            border-radius: 0;
            padding: 15px;
        }
        .history-entry {
            padding: 10px;
            margin: 5px 0;
            background: #e9ecef;
            border-radius: 0;
            font-weight: 600;
            text-align: center;
            color: #495057;
        }
        @media (max-width: 768px) {
            .clickcounter-header h1 {
                font-size: 2rem;
            }
            .clickcounter-stats {
                flex-direction: column;
                gap: 10px;
            }
            .stat-box {
                width: 100%;
            }
            .clickcounter-button {
                width: 250px;
                height: 250px;
            }
            .clickcounter-buttons {
                flex-direction: column;
                width: 100%;
            }
            .btn-primary, .btn-secondary {
                width: 100%;
            }
        }
    `;
}

