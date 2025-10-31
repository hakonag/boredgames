// Rock Paper Scissors Game Module
let rpsGame = null;

export function init() {
    const gameContent = document.getElementById('game-content');
    gameContent.innerHTML = `
        <button class="back-button-tetris" onclick="window.location.href='https://hakonag.github.io/boredgames/'">
            <i data-lucide="house"></i> Tilbake
        </button>
        <div class="rps-wrap">
            <div class="rps-header">
                <h1>Stein Saks Papir</h1>
                <div class="rps-stats">
                    <div class="stat-box">
                        <div class="stat-label">Du</div>
                        <div class="stat-value" id="player-score-rps">0</div>
                    </div>
                    <div class="stat-box">
                        <div class="stat-label">Uavgjort</div>
                        <div class="stat-value" id="tie-score-rps">0</div>
                    </div>
                    <div class="stat-box">
                        <div class="stat-label">Motstander</div>
                        <div class="stat-value" id="computer-score-rps">0</div>
                    </div>
                </div>
            </div>
            <div class="rps-game">
                <div class="rps-choices">
                    <button onclick="window.playRPS('rock')" class="rps-choice" data-choice="rock">
                        <span class="rps-emoji">🪨</span>
                        <span class="rps-label">Stein</span>
                    </button>
                    <button onclick="window.playRPS('paper')" class="rps-choice" data-choice="paper">
                        <span class="rps-emoji">📄</span>
                        <span class="rps-label">Papir</span>
                    </button>
                    <button onclick="window.playRPS('scissors')" class="rps-choice" data-choice="scissors">
                        <span class="rps-emoji">✂️</span>
                        <span class="rps-label">Saks</span>
                    </button>
                </div>
                <div class="rps-result" id="result-rps"></div>
                <div class="rps-history" id="history-rps"></div>
                <div class="rps-buttons">
                    <button onclick="window.resetRPS()" class="btn-secondary">
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
    window.rpsScrollPrevent = { wheel: preventScroll, touchmove: preventScroll };
    
    rpsGame = new RockPaperScissorsGame();
    window.rpsGame = rpsGame;
    window.playRPS = (choice) => rpsGame.play(choice);
    window.resetRPS = () => rpsGame.reset();
}

export function cleanup() {
    if (rpsGame) {
        rpsGame.removeControls();
        rpsGame = null;
    }
    if (window.rpsScrollPrevent) {
        window.removeEventListener('wheel', window.rpsScrollPrevent.wheel);
        window.removeEventListener('touchmove', window.rpsScrollPrevent.touchmove);
        delete window.rpsScrollPrevent;
    }
    const styleEl = document.getElementById('rps-style');
    if (styleEl) styleEl.remove();
}

class RockPaperScissorsGame {
    constructor() {
        this.playerScore = 0;
        this.computerScore = 0;
        this.tieScore = 0;
        this.choices = ['rock', 'paper', 'scissors'];
        this.emoji = { rock: '🪨', paper: '📄', scissors: '✂️' };
        this.names = { rock: 'Stein', paper: 'Papir', scissors: 'Saks' };
        this.setupControls();
        this.updateDisplay();
    }
    
    play(playerChoice) {
        const computerChoice = this.choices[Math.floor(Math.random() * this.choices.length)];
        const result = this.getWinner(playerChoice, computerChoice);
        
        let resultText = '';
        if (result === 'player') {
            this.playerScore++;
            resultText = `<span style="color: #22c55e; font-weight: bold;">🎉 Du vant!</span><br>`;
        } else if (result === 'computer') {
            this.computerScore++;
            resultText = `<span style="color: #ef4444; font-weight: bold;">😢 Du tapte...</span><br>`;
        } else {
            this.tieScore++;
            resultText = `<span style="color: #6c757d; font-weight: bold;">🤝 Uavgjort!</span><br>`;
        }
        
        resultText += `Du: ${this.names[playerChoice]} ${this.emoji[playerChoice]} vs Motstander: ${this.names[computerChoice]} ${this.emoji[computerChoice]}`;
        
        document.getElementById('result-rps').innerHTML = resultText;
        
        const historyEl = document.getElementById('history-rps');
        const historyEntry = document.createElement('div');
        historyEntry.className = `history-entry ${result}`;
        historyEntry.innerHTML = `${this.emoji[playerChoice]} vs ${this.emoji[computerChoice]} - ${result === 'player' ? 'Seier' : result === 'computer' ? 'Tap' : 'Uavgjort'}`;
        historyEl.insertBefore(historyEntry, historyEl.firstChild);
        
        // Keep only last 10 entries
        while (historyEl.children.length > 10) {
            historyEl.removeChild(historyEl.lastChild);
        }
        
        this.updateDisplay();
    }
    
    getWinner(player, computer) {
        if (player === computer) return 'tie';
        if ((player === 'rock' && computer === 'scissors') ||
            (player === 'paper' && computer === 'rock') ||
            (player === 'scissors' && computer === 'paper')) {
            return 'player';
        }
        return 'computer';
    }
    
    reset() {
        this.playerScore = 0;
        this.computerScore = 0;
        this.tieScore = 0;
        document.getElementById('result-rps').innerHTML = '';
        document.getElementById('history-rps').innerHTML = '';
        this.updateDisplay();
    }
    
    updateDisplay() {
        document.getElementById('player-score-rps').textContent = this.playerScore;
        document.getElementById('computer-score-rps').textContent = this.computerScore;
        document.getElementById('tie-score-rps').textContent = this.tieScore;
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
                window.location.href = 'https://hakonag.github.io/boredgames/?game=rockpaperscissors';
                return;
            }
            
            // Quick play with number keys: 1=rock, 2=paper, 3=scissors
            if (e.key === '1') {
                this.play('rock');
            } else if (e.key === '2') {
                this.play('paper');
            } else if (e.key === '3') {
                this.play('scissors');
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
    if (document.getElementById('rps-style')) return;
    const style = document.createElement('style');
    style.id = 'rps-style';
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
        .rps-wrap {
            width: 100%;
            max-width: min(700px, 95vw);
            display: flex;
            flex-direction: column;
            align-items: center;
        }
        .rps-header {
            text-align: center;
            margin-bottom: 30px;
        }
        .rps-header h1 {
            font-size: 3rem;
            font-weight: 800;
            color: #333;
            margin: 0 0 20px 0;
        }
        .rps-stats {
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
            font-size: 2rem;
            font-weight: 800;
        }
        .rps-game {
            width: 100%;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 20px;
        }
        .rps-choices {
            display: flex;
            gap: 20px;
            justify-content: center;
            flex-wrap: wrap;
        }
        .rps-choice {
            background: #f8f9fa;
            border: 3px solid #dee2e6;
            border-radius: 12px;
            padding: 30px 40px;
            cursor: pointer;
            transition: all 0.2s ease;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 10px;
            min-width: 120px;
        }
        .rps-choice:hover {
            background: #e9ecef;
            border-color: #3b82f6;
            transform: scale(1.05);
        }
        .rps-choice:active {
            transform: scale(0.95);
        }
        .rps-emoji {
            font-size: 4rem;
        }
        .rps-label {
            font-size: 1.2rem;
            font-weight: 600;
            color: #495057;
        }
        .rps-result {
            min-height: 80px;
            text-align: center;
            font-size: 1.2rem;
            padding: 20px;
            background: #f8f9fa;
            border: 2px solid #dee2e6;
            border-radius: 8px;
            width: 100%;
            max-width: 500px;
        }
        .rps-history {
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
            text-align: center;
        }
        .history-entry.player {
            background: #d1fae5;
            color: #065f46;
        }
        .history-entry.computer {
            background: #fee2e2;
            color: #991b1b;
        }
        .history-entry.tie {
            background: #e0e7ff;
            color: #3730a3;
        }
        .rps-buttons {
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
            .rps-header h1 {
                font-size: 2rem;
            }
            .rps-stats {
                flex-direction: column;
                gap: 10px;
            }
            .stat-box {
                width: 100%;
            }
            .rps-choices {
                flex-direction: column;
                width: 100%;
            }
            .rps-choice {
                width: 100%;
            }
        }
    `;
    document.head.appendChild(style);
}

