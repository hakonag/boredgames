// Number Guess Game Module
let numberGuessGame = null;

export function init() {
    const gameContent = document.getElementById('game-content');
    gameContent.innerHTML = `
        <button class="back-button-tetris" onclick="window.location.href='https://hakonag.github.io/boredgames/'">
            <i data-lucide="house"></i> Tilbake
        </button>
        <div class="numberguess-wrap">
            <div class="numberguess-header">
                <h1>Gjett Tallet</h1>
                <div class="numberguess-stats">
                    <div class="stat-box">
                        <div class="stat-label">Forsøk</div>
                        <div class="stat-value" id="attempts-numberguess">0</div>
                    </div>
                    <div class="stat-box">
                        <div class="stat-label">Rekord</div>
                        <div class="stat-value" id="best-numberguess">-</div>
                    </div>
                </div>
            </div>
            <div class="numberguess-game">
                <div class="numberguess-instructions">
                    <p>Jeg tenker på et tall mellom <strong>1 og 100</strong>.</p>
                    <p id="hint-numberguess">Kan du gjette det?</p>
                </div>
                <div class="numberguess-input-area">
                    <input type="number" id="guess-input" min="1" max="100" placeholder="Skriv et tall (1-100)">
                    <button onclick="window.makeGuess()" class="btn-primary" id="guess-btn">
                        <i data-lucide="check"></i> Gjett
                    </button>
                </div>
                <div id="feedback-numberguess" class="numberguess-feedback"></div>
                <div class="numberguess-history" id="history-numberguess"></div>
                <div class="numberguess-buttons">
                    <button onclick="window.newGameNumberGuess()" class="btn-secondary">
                        <i data-lucide="refresh-cw"></i> Nytt spill
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
    window.numberGuessScrollPrevent = { wheel: preventScroll, touchmove: preventScroll };
    
    numberGuessGame = new NumberGuessGame();
    window.numberGuessGame = numberGuessGame;
    window.makeGuess = () => numberGuessGame.makeGuess();
    window.newGameNumberGuess = () => numberGuessGame.newGame();
    
    // Load best score
    const best = localStorage.getItem('numberguess-best');
    if (best) {
        document.getElementById('best-numberguess').textContent = best;
    }
    
    // Focus input
    document.getElementById('guess-input').focus();
}

export function cleanup() {
    if (numberGuessGame) {
        numberGuessGame.removeControls();
        numberGuessGame = null;
    }
    if (window.numberGuessScrollPrevent) {
        window.removeEventListener('wheel', window.numberGuessScrollPrevent.wheel);
        window.removeEventListener('touchmove', window.numberGuessScrollPrevent.touchmove);
        delete window.numberGuessScrollPrevent;
    }
    const styleEl = document.getElementById('numberguess-style');
    if (styleEl) styleEl.remove();
}

class NumberGuessGame {
    constructor() {
        this.min = 1;
        this.max = 100;
        this.target = 0;
        this.attempts = 0;
        this.gameOver = false;
        this.setupControls();
        this.newGame();
    }
    
    newGame() {
        this.target = Math.floor(Math.random() * (this.max - this.min + 1)) + this.min;
        this.attempts = 0;
        this.gameOver = false;
        document.getElementById('attempts-numberguess').textContent = '0';
        document.getElementById('hint-numberguess').textContent = 'Kan du gjette det?';
        document.getElementById('feedback-numberguess').textContent = '';
        document.getElementById('history-numberguess').innerHTML = '';
        document.getElementById('guess-input').value = '';
        document.getElementById('guess-input').disabled = false;
        document.getElementById('guess-btn').disabled = false;
        document.getElementById('guess-input').focus();
    }
    
    makeGuess() {
        if (this.gameOver) return;
        
        const input = document.getElementById('guess-input');
        const guess = parseInt(input.value);
        
        if (isNaN(guess) || guess < this.min || guess > this.max) {
            document.getElementById('feedback-numberguess').textContent = `Vennligst skriv et tall mellom ${this.min} og ${this.max}!`;
            input.value = '';
            input.focus();
            return;
        }
        
        this.attempts++;
        document.getElementById('attempts-numberguess').textContent = this.attempts;
        
        const historyEl = document.getElementById('history-numberguess');
        const feedbackEl = document.getElementById('feedback-numberguess');
        
        if (guess === this.target) {
            this.gameOver = true;
            feedbackEl.innerHTML = `<span style="color: #22c55e; font-weight: bold;">🎉 Riktig! Tallet var ${this.target}!</span>`;
            feedbackEl.innerHTML += `<br><span style="color: #6c757d;">Du brukte ${this.attempts} ${this.attempts === 1 ? 'forsøk' : 'forsøk'}!</span>`;
            
            const best = parseInt(localStorage.getItem('numberguess-best') || '999');
            if (this.attempts < best) {
                localStorage.setItem('numberguess-best', String(this.attempts));
                document.getElementById('best-numberguess').textContent = this.attempts;
                feedbackEl.innerHTML += `<br><span style="color: #f59e0b; font-weight: bold;">🌟 Ny rekord!</span>`;
            }
            
            input.disabled = true;
            document.getElementById('guess-btn').disabled = true;
            
            const historyEntry = document.createElement('div');
            historyEntry.className = 'history-entry correct';
            historyEntry.textContent = `✓ ${guess} - Riktig!`;
            historyEl.insertBefore(historyEntry, historyEl.firstChild);
        } else if (guess < this.target) {
            feedbackEl.innerHTML = `<span style="color: #3b82f6;">📈 For lavt! Prøv høyere.</span>`;
            
            const historyEntry = document.createElement('div');
            historyEntry.className = 'history-entry low';
            historyEntry.textContent = `↑ ${guess} - For lavt`;
            historyEl.insertBefore(historyEntry, historyEl.firstChild);
        } else {
            feedbackEl.innerHTML = `<span style="color: #ef4444;">📉 For høyt! Prøv lavere.</span>`;
            
            const historyEntry = document.createElement('div');
            historyEntry.className = 'history-entry high';
            historyEntry.textContent = `↓ ${guess} - For høyt`;
            historyEl.insertBefore(historyEntry, historyEl.firstChild);
        }
        
        input.value = '';
        input.focus();
    }
    
    setupControls() {
        this.keyHandler = (e) => {
            // Don't process shortcuts if user is typing in an input field
            const activeElement = document.activeElement;
            if (activeElement && (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA')) {
                if (e.key === 'Enter') {
                    this.makeGuess();
                }
                return;
            }
            
            // Handle restart (R)
            if (e.key === 'r' || e.key === 'R') {
                window.location.href = 'https://hakonag.github.io/boredgames/?game=numberguess';
                return;
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
    if (document.getElementById('numberguess-style')) return;
    const style = document.createElement('style');
    style.id = 'numberguess-style';
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
        .numberguess-wrap {
            width: 100%;
            max-width: min(600px, 95vw);
            display: flex;
            flex-direction: column;
            align-items: center;
        }
        .numberguess-header {
            text-align: center;
            margin-bottom: 30px;
        }
        .numberguess-header h1 {
            font-size: 3rem;
            font-weight: 800;
            color: #333;
            margin: 0 0 20px 0;
        }
        .numberguess-stats {
            display: flex;
            gap: 20px;
            justify-content: center;
            margin-bottom: 20px;
        }
        .stat-box {
            background: #f8f9fa;
            border: 2px solid #dee2e6;
            border-radius: 8px;
            padding: 15px 30px;
            text-align: center;
            min-width: 120px;
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
        .numberguess-game {
            width: 100%;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 20px;
        }
        .numberguess-instructions {
            text-align: center;
            color: #495057;
            font-size: 1.1rem;
            line-height: 1.6;
        }
        .numberguess-instructions p {
            margin: 10px 0;
        }
        .numberguess-input-area {
            display: flex;
            gap: 10px;
            width: 100%;
            max-width: 400px;
        }
        #guess-input {
            flex: 1;
            padding: 12px 16px;
            font-size: 1.1rem;
            border: 2px solid #dee2e6;
            border-radius: 8px;
            text-align: center;
        }
        #guess-input:focus {
            outline: none;
            border-color: #3b82f6;
        }
        .btn-primary, .btn-secondary {
            padding: 12px 24px;
            border-radius: 8px;
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
        .btn-secondary:hover {
            background: #5a6268;
        }
        .btn-primary i, .btn-secondary i {
            width: 16px;
            height: 16px;
        }
        .numberguess-feedback {
            min-height: 60px;
            text-align: center;
            font-size: 1.1rem;
            padding: 15px;
            background: #f8f9fa;
            border: 2px solid #dee2e6;
            border-radius: 8px;
            width: 100%;
            max-width: 500px;
        }
        .numberguess-history {
            width: 100%;
            max-width: 400px;
            max-height: 200px;
            overflow-y: auto;
            background: #f8f9fa;
            border: 2px solid #dee2e6;
            border-radius: 8px;
            padding: 15px;
        }
        .history-entry {
            padding: 8px;
            margin: 5px 0;
            border-radius: 6px;
            font-weight: 600;
        }
        .history-entry.correct {
            background: #d1fae5;
            color: #065f46;
        }
        .history-entry.low {
            background: #dbeafe;
            color: #1e40af;
        }
        .history-entry.high {
            background: #fee2e2;
            color: #991b1b;
        }
        .numberguess-buttons {
            display: flex;
            gap: 10px;
            justify-content: center;
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
            .numberguess-header h1 {
                font-size: 2rem;
            }
            .numberguess-stats {
                flex-direction: column;
                gap: 10px;
            }
            .stat-box {
                width: 100%;
            }
            .numberguess-input-area {
                flex-direction: column;
            }
        }
    `;
    document.head.appendChild(style);
}

