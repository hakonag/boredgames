// Higher Lower Game Module
import { createBackButton, setupScrollPrevention, removeScrollPrevention, setupHardReset } from '../../core/gameUtils.js';
import { injectGameStyles, removeGameStyles } from '../../core/gameStyles.js';

let higherLowerGame = null;

export function init() {
    const gameContent = document.getElementById('game-content');
    gameContent.innerHTML = createBackButton() + `
        <div class="higherlower-wrap">
            <div class="higherlower-header">
                <h1>Høyere Lavere</h1>
                <div class="higherlower-stats">
                    <div class="stat-box">
                        <div class="stat-label">Riktig</div>
                        <div class="stat-value" id="correct-higherlower">0</div>
                    </div>
                    <div class="stat-box">
                        <div class="stat-label">Rekord</div>
                        <div class="stat-value" id="best-higherlower">0</div>
                    </div>
                </div>
            </div>
            <div class="higherlower-game">
                <div class="higherlower-current">
                    <div class="number-display" id="current-number">?</div>
                    <p class="number-label">Nåværende tall</p>
                </div>
                <div class="higherlower-instructions">
                    <p id="question-higherlower">Hva tror du neste tall blir?</p>
                </div>
                <div class="higherlower-buttons">
                    <button onclick="window.guessHigherLower('lower')" class="btn-choice lower" id="btn-lower">
                        <i data-lucide="arrow-down"></i> Lavere
                    </button>
                    <button onclick="window.guessHigherLower('higher')" class="btn-choice higher" id="btn-higher">
                        <i data-lucide="arrow-up"></i> Høyere
                    </button>
                </div>
                <div id="result-higherlower" class="higherlower-result"></div>
                <div class="higherlower-buttons">
                    <button onclick="window.newGameHigherLower()" class="btn-secondary">
                        <i data-lucide="refresh-cw"></i> Nytt spill
                    </button>
                </div>
            </div>
        </div>
    `;

    injectGameStyles('higherlower', getGameSpecificStyles());
    if (typeof lucide !== 'undefined') lucide.createIcons();
    
    setupScrollPrevention('higherlower');
    
    higherLowerGame = new HigherLowerGame();
    window.higherLowerGame = higherLowerGame;
    window.guessHigherLower = (guess) => higherLowerGame.guess(guess);
    window.newGameHigherLower = () => higherLowerGame.newGame();
    
    // Load best score
    const best = localStorage.getItem('higherlower-best');
    if (best) {
        document.getElementById('best-higherlower').textContent = best;
    }
}

export function cleanup() {
    if (higherLowerGame) {
        higherLowerGame.removeControls();
        higherLowerGame = null;
    }
    removeScrollPrevention('higherlower');
    removeGameStyles('higherlower');
}

class HigherLowerGame {
    constructor() {
        this.currentNumber = 0;
        this.nextNumber = 0;
        this.correct = 0;
        this.best = parseInt(localStorage.getItem('higherlower-best') || '0');
        this.gameOver = false;
        this.setupControls();
        this.newGame();
    }
    
    newGame() {
        this.currentNumber = Math.floor(Math.random() * 100) + 1;
        this.nextNumber = Math.floor(Math.random() * 100) + 1;
        this.correct = 0;
        this.gameOver = false;
        document.getElementById('current-number').textContent = this.currentNumber;
        document.getElementById('question-higherlower').textContent = 'Hva tror du neste tall blir?';
        document.getElementById('result-higherlower').innerHTML = '';
        document.getElementById('correct-higherlower').textContent = '0';
        document.getElementById('btn-lower').disabled = false;
        document.getElementById('btn-higher').disabled = false;
    }
    
    guess(guess) {
        if (this.gameOver) return;
        
        const wasCorrect = (guess === 'higher' && this.nextNumber > this.currentNumber) ||
                          (guess === 'lower' && this.nextNumber < this.currentNumber) ||
                          (this.nextNumber === this.currentNumber); // Tie counts as correct
        
        const resultEl = document.getElementById('result-higherlower');
        
        if (wasCorrect) {
            this.correct++;
            document.getElementById('correct-higherlower').textContent = this.correct;
            
            if (this.correct > this.best) {
                this.best = this.correct;
                localStorage.setItem('higherlower-best', String(this.best));
                document.getElementById('best-higherlower').textContent = this.best;
            }
            
            resultEl.innerHTML = `<span style="color: #22c55e; font-weight: bold;">✓ Riktig! Neste tall var ${this.nextNumber}</span>`;
        } else {
            this.gameOver = true;
            resultEl.innerHTML = `<span style="color: #ef4444; font-weight: bold;">✗ Feil! Neste tall var ${this.nextNumber}</span><br>`;
            resultEl.innerHTML += `<span style="color: #6c757d;">Du fikk ${this.correct} riktige!</span>`;
            document.getElementById('btn-lower').disabled = true;
            document.getElementById('btn-higher').disabled = true;
            
            if (this.correct > this.best) {
                this.best = this.correct;
                localStorage.setItem('higherlower-best', String(this.best));
                document.getElementById('best-higherlower').textContent = this.best;
                resultEl.innerHTML += `<br><span style="color: #f59e0b; font-weight: bold;">🌟 Ny rekord!</span>`;
            }
        }
        
        // Continue or reset
        setTimeout(() => {
            if (!this.gameOver) {
                this.currentNumber = this.nextNumber;
                this.nextNumber = Math.floor(Math.random() * 100) + 1;
                document.getElementById('current-number').textContent = this.currentNumber;
                document.getElementById('question-higherlower').textContent = 'Hva tror du neste tall blir?';
                resultEl.innerHTML = '';
            }
        }, 1500);
    }
    
    setupControls() {
        this.keyHandler = setupHardReset('higherlower', (e) => {
            // Quick guess with arrow keys
            if (e.key === 'ArrowDown') {
                this.guess('lower');
            } else if (e.key === 'ArrowUp') {
                this.guess('higher');
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
        .higherlower-wrap {
            width: 100%;
            max-width: min(600px, 95vw);
            display: flex;
            flex-direction: column;
            align-items: center;
        }
        .higherlower-header {
            text-align: center;
            margin-bottom: 30px;
        }
        .higherlower-header h1 {
            font-size: 2.5rem;
            font-weight: 800;
            color: #111;
            margin: 0 0 20px 0;
        }
        .higherlower-stats {
            display: flex;
            gap: 20px;
            justify-content: center;
            margin-bottom: 20px;
        }
        .stat-box {
            background: #f8f9fa;
            border: 2px solid #dee2e6;
            border-radius: 0;
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
        .higherlower-game {
            width: 100%;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 30px;
        }
        .higherlower-current {
            text-align: center;
        }
        .number-display {
            font-size: 5rem;
            font-weight: 800;
            color: #3b82f6;
            margin-bottom: 10px;
            min-height: 80px;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .number-label {
            color: #6c757d;
            font-size: 1rem;
            font-weight: 600;
        }
        .higherlower-instructions {
            text-align: center;
        }
        .higherlower-instructions p {
            font-size: 1.3rem;
            font-weight: 600;
            color: #495057;
        }
        .higherlower-buttons {
            display: flex;
            gap: 20px;
            justify-content: center;
            width: 100%;
            max-width: 400px;
        }
        .btn-choice {
            flex: 1;
            padding: 20px 30px;
            border-radius: 0;
            font-size: 1.2rem;
            cursor: pointer;
            font-weight: 700;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 10px;
            border: 3px solid;
            transition: all 0.2s ease;
        }
        .btn-choice.lower {
            background: #fee2e2;
            color: #991b1b;
            border-color: #ef4444;
        }
        .btn-choice.lower:hover:not(:disabled) {
            background: #fecaca;
            transform: scale(1.05);
        }
        .btn-choice.higher {
            background: #dbeafe;
            color: #1e40af;
            border-color: #3b82f6;
        }
        .btn-choice.higher:hover:not(:disabled) {
            background: #bfdbfe;
            transform: scale(1.05);
        }
        .btn-choice:disabled {
            opacity: 0.5;
            cursor: not-allowed;
        }
        .btn-choice:active:not(:disabled) {
            transform: scale(0.95);
        }
        .btn-choice i {
            width: 24px;
            height: 24px;
        }
        .higherlower-result {
            min-height: 80px;
            text-align: center;
            font-size: 1.2rem;
            padding: 20px;
            background: #f8f9fa;
            border: 2px solid #dee2e6;
            border-radius: 0;
            width: 100%;
            max-width: 500px;
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
            .higherlower-header h1 {
                font-size: 2rem;
            }
            .higherlower-stats {
                flex-direction: column;
                gap: 10px;
            }
            .stat-box {
                width: 100%;
            }
            .number-display {
                font-size: 4rem;
            }
            .higherlower-buttons {
                flex-direction: column;
            }
        }
    `;
}

