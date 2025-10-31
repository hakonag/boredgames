// Reaction Time Game Module
import { createBackButton, setupScrollPrevention, removeScrollPrevention, setupHardReset } from '../../core/gameUtils.js';
import { injectGameStyles, removeGameStyles } from '../../core/gameStyles.js';
import { getHighScores } from '../../core/highScores.js';

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
            <div class="reactiontime-leaderboard">
                <h3>Toppresultater</h3>
                <div class="high-scores">
                    <div id="reactiontime-high-scores"></div>
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
    
    // Load leaderboard
    displayReactionTimeScores('reactiontime-high-scores', 'reactiontime', 30).catch(() => {});
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
    
    async clickBox() {
        if (this.state === 'waiting') {
            this.startTest();
        } else if (this.state === 'go') {
            const reactionTime = Math.round(performance.now() - this.startTime);
            this.reactionTimes.push(reactionTime);
            
            if (reactionTime < this.best) {
                this.best = reactionTime;
                localStorage.setItem('reactiontime-best', String(this.best));
                
                // Check if this is a new high score (lower time = better)
                const scores = await getHighScores('reactiontime');
                const minHighScore = scores.length > 0 ? Math.min(...scores.map(s => Math.abs(s.score))) : 9999;
                // Store times as negative values so sorting works (lower time = higher negative score)
                if (scores.length < 30 || reactionTime < minHighScore) {
                    // Create custom modal for reaction time
                    const modal = document.createElement('div');
                    modal.className = 'score-modal';
                    modal.innerHTML = `
                        <div class="score-modal-content">
                            <h3>Ny best tid!</h3>
                            <p>Din tid: ${reactionTime}ms</p>
                            <p>Skriv inn navnet ditt:</p>
                            <input type="text" id="score-name-input" maxlength="20" placeholder="Ditt navn" autofocus>
                            <div style="display: flex; gap: 10px; justify-content: center;">
                                <button id="submit-score-btn" class="btn-primary" onclick="window.currentScoreSubmit(${-reactionTime})">Lagre</button>
                                <button class="btn-secondary" onclick="window.currentScoreSkip()">Hopp over</button>
                            </div>
                            <p id="save-status" style="margin-top: 10px; color: #666; font-size: 0.9rem;"></p>
                        </div>
                    `;
                    
                    document.body.appendChild(modal);
                    
                    const input = document.getElementById('score-name-input');
                    const submitBtn = document.getElementById('submit-score-btn');
                    const status = document.getElementById('save-status');
                    
                    window.currentScoreSubmit = async (scoreValue) => {
                        if (submitBtn.disabled) return;
                        const name = input ? input.value.trim() : '';
                        submitBtn.disabled = true;
                        submitBtn.textContent = 'Lagrer...';
                        status.textContent = 'Lagrer score...';
                        
                        try {
                            const { saveHighScore } = await import('../../core/highScores.js');
                            await saveHighScore('reactiontime', name, scoreValue);
                            status.textContent = 'Score lagret!';
                            status.style.color = '#4caf50';
                            setTimeout(() => {
                                modal.remove();
                                window.currentScoreSubmit = null;
                                window.currentScoreSkip = null;
                                displayReactionTimeScores('reactiontime-high-scores', 'reactiontime', 30);
                            }, 500);
                        } catch (error) {
                            console.error('Error saving score:', error);
                            status.textContent = 'Feil ved lagring. Prøv igjen.';
                            status.style.color = '#f44336';
                            submitBtn.disabled = false;
                            submitBtn.textContent = 'Lagre';
                        }
                    };
                    
                    window.currentScoreSkip = () => {
                        modal.remove();
                        window.currentScoreSubmit = null;
                        window.currentScoreSkip = null;
                        displayReactionTimeScores('reactiontime-high-scores', 'reactiontime', 30);
                    };
                    
                    if (input) {
                        input.addEventListener('keypress', async (e) => {
                            if (e.key === 'Enter' && !submitBtn.disabled) {
                                await window.currentScoreSubmit(-reactionTime);
                            }
                        });
                        input.focus();
                    }
                }
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

// Custom display function for reaction time scores (stored as negative values)
async function displayReactionTimeScores(containerId, gameId, limit = 30) {
    const scoresContainer = document.getElementById(containerId);
    if (!scoresContainer) return Promise.resolve();
    
    return getHighScores(gameId).then(scores => {
        if (scores.length === 0) {
            scoresContainer.innerHTML = '<p style="color: #999; font-size: 0.85rem;">Ingen scores ennå</p>';
            return;
        }
        
        // Show up to limit scores, display as positive times with ms
        const displayScores = scores.slice(0, limit);
        scoresContainer.innerHTML = displayScores.map((entry, index) => {
            const timeMs = Math.abs(entry.score); // Convert negative back to positive
            return `
                <div class="score-entry">
                    <div class="score-name">${index + 1}. ${entry.name}</div>
                    <div class="score-value">${timeMs}ms</div>
                </div>
            `;
        }).join('');
    }).catch(err => {
        console.error('Error displaying scores:', err);
        scoresContainer.innerHTML = '<p style="color: #999; font-size: 0.85rem;">Kunne ikke laste scores</p>';
    });
}

function getGameSpecificStyles() {
    return `
        .reactiontime-wrap {
            width: 100%;
            max-width: min(900px, 95vw);
            max-height: calc(100vh - 20px);
            display: flex;
            flex-direction: column;
            align-items: center;
            overflow-y: auto;
            overflow-x: hidden;
            min-height: 0;
            box-sizing: border-box;
            padding: 10px;
        }
        .reactiontime-header {
            text-align: center;
            margin-bottom: 20px;
            flex-shrink: 0;
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
            gap: 15px;
            flex-shrink: 0;
            box-sizing: border-box;
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
            min-width: 0;
            min-height: 0;
            flex-shrink: 0;
            border-radius: 0;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            transition: background-color 0.3s ease;
            box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
            box-sizing: border-box;
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
            max-height: 180px;
            min-height: 0;
            flex-shrink: 1;
            overflow-y: auto;
            overflow-x: hidden;
            background: #f8f9fa;
            border: 2px solid #dee2e6;
            border-radius: 0;
            padding: 15px;
            display: flex;
            flex-wrap: wrap;
            gap: 10px;
            justify-content: center;
            align-content: flex-start;
            box-sizing: border-box;
        }
        .reactiontime-history::-webkit-scrollbar {
            width: 6px;
        }
        .reactiontime-history::-webkit-scrollbar-track {
            background: #f1f1f1;
        }
        .reactiontime-history::-webkit-scrollbar-thumb {
            background: #c1c1c1;
        }
        .reactiontime-history::-webkit-scrollbar-thumb:hover {
            background: #a8a8a8;
        }
        .history-entry {
            padding: 8px 16px;
            background: #e9ecef;
            border-radius: 0;
            font-weight: 600;
            color: #495057;
            flex-shrink: 0;
            white-space: nowrap;
        }
        .reactiontime-buttons {
            display: flex;
            gap: 10px;
            justify-content: center;
            flex-shrink: 0;
            margin-bottom: 20px;
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
        .reactiontime-leaderboard {
            margin-top: 20px;
            padding: 15px;
            background: #f8f9fa;
            border: 2px solid #dee2e6;
            border-radius: 0;
            width: 100%;
            max-width: min(400px, calc(95vw - 40px));
            flex-shrink: 0;
        }
        .reactiontime-leaderboard h3 {
            margin: 0 0 12px 0;
            font-size: 1rem;
            color: #111;
            text-align: center;
            font-weight: 600;
        }
        .reactiontime-leaderboard .high-scores {
            max-height: 300px;
            overflow-y: auto;
        }
        .reactiontime-leaderboard .score-entry {
            display: flex;
            justify-content: space-between;
            padding: 6px 0;
            border-bottom: 1px solid #e9ecef;
            font-size: 0.9rem;
        }
        .reactiontime-leaderboard .score-entry:last-child {
            border-bottom: none;
        }
        .reactiontime-leaderboard .score-name {
            color: #495057;
            font-weight: 500;
        }
        .reactiontime-leaderboard .score-value {
            color: #212529;
            font-weight: 600;
        }
        @media (max-width: 768px) {
            .reactiontime-wrap {
                max-width: 100%;
                padding: 0 10px;
            }
            .reactiontime-header h1 {
                font-size: 2rem;
                margin-bottom: 15px;
            }
            .reactiontime-stats {
                flex-direction: column;
                gap: 10px;
                margin-bottom: 15px;
            }
            .stat-box {
                width: 100%;
            }
            .reactiontime-game {
                gap: 15px;
            }
            .reactiontime-box {
                width: 100%;
                height: 300px;
                max-width: calc(100vw - 40px);
                max-height: calc(100vw - 40px);
                aspect-ratio: 1;
            }
            .reactiontime-history {
                max-width: 100%;
                max-height: 150px;
                padding: 12px;
            }
            .reactiontime-leaderboard {
                max-width: calc(100vw - 40px);
            }
        }
    `;
}

