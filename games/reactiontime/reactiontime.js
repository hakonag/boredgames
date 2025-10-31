// Reaction Time Game Module
let reactionTimeGame = null;

export function init() {
    const gameContent = document.getElementById('game-content');
    gameContent.innerHTML = `
        <button class="back-button-tetris" onclick="window.location.href='https://hakonag.github.io/boredgames/'">
            <i data-lucide="house"></i> Tilbake
        </button>
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

    injectStyles();
    if (typeof lucide !== 'undefined') lucide.createIcons();
    
    // Prevent wheel scrolling
    const preventScroll = (e) => {
        e.preventDefault();
        return false;
    };
    window.addEventListener('wheel', preventScroll, { passive: false });
    window.addEventListener('touchmove', preventScroll, { passive: false });
    window.reactionTimeScrollPrevent = { wheel: preventScroll, touchmove: preventScroll };
    
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
    if (window.reactionTimeScrollPrevent) {
        window.removeEventListener('wheel', window.reactionTimeScrollPrevent.wheel);
        window.removeEventListener('touchmove', window.reactionTimeScrollPrevent.touchmove);
        delete window.reactionTimeScrollPrevent;
    }
    const styleEl = document.getElementById('reactiontime-style');
    if (styleEl) styleEl.remove();
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
        this.keyHandler = (e) => {
            // Don't process shortcuts if user is typing in an input field
            const activeElement = document.activeElement;
            if (activeElement && (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA')) {
                return;
            }
            
            // Handle restart (R)
            if (e.key === 'r' || e.key === 'R') {
                window.location.href = 'https://hakonag.github.io/boredgames/?game=reactiontime';
                return;
            }
            
            // Space to click box
            if (e.key === ' ') {
                e.preventDefault();
                this.clickBox();
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

function injectStyles() {
    if (document.getElementById('reactiontime-style')) return;
    const style = document.createElement('style');
    style.id = 'reactiontime-style';
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
            background: #ffffff;
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
        .back-button-tetris:hover {
            background: #e9ecef;
            border-color: #adb5bd;
        }
        .back-button-tetris i {
            width: 14px;
            height: 14px;
        }
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
            font-size: 3rem;
            font-weight: 800;
            color: #333;
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
            border-radius: 8px;
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
            border-radius: 20px;
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
            border-radius: 8px;
            padding: 15px;
            display: flex;
            flex-wrap: wrap;
            gap: 10px;
            justify-content: center;
        }
        .history-entry {
            padding: 8px 16px;
            background: #e9ecef;
            border-radius: 6px;
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
            border-radius: 8px;
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
    document.head.appendChild(style);
}

