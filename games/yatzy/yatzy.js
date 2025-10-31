// Yatzy Game Module
import { createBackButton, setupScrollPrevention, removeScrollPrevention, setupHardReset } from '../../core/gameUtils.js';
import { injectGameStyles, removeGameStyles } from '../../core/gameStyles.js';

let yatzyGame = null;

export function init() {
    const gameContent = document.getElementById('game-content');
    gameContent.innerHTML = createBackButton() + `
        <div class="yatzy-wrap">
            <div class="yatzy-main">
                <div class="yatzy-header">
                    <h1>Yatzy</h1>
                    <div class="yatzy-stats">
                        <div class="stat-box">
                            <div class="stat-label">Runde</div>
                            <div class="stat-value" id="round-yatzy">1/15</div>
                        </div>
                        <div class="stat-box">
                            <div class="stat-label">Total</div>
                            <div class="stat-value" id="total-yatzy">0</div>
                        </div>
                    </div>
                </div>
                <div class="yatzy-game-area">
                    <div class="yatzy-left">
                        <div class="yatzy-dice-area">
                            <div class="yatzy-dice-container" id="yatzy-dice"></div>
                            <div class="yatzy-roll-info">
                                <p id="yatzy-status" class="yatzy-status">Kast terningene</p>
                                <div class="yatzy-roll-buttons">
                                    <button onclick="window.rollYatzy()" id="roll-btn" class="btn-primary">
                                        <i data-lucide="dice-6"></i> Kast
                                    </button>
                                    <button onclick="window.newYatzy()" class="btn-secondary">
                                        <i data-lucide="refresh-cw"></i> Nytt spill
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="yatzy-right">
                        <div class="yatzy-scorecard">
                            <h3>Poengtavle</h3>
                            <div class="yatzy-score-list" id="yatzy-scorecard"></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    injectGameStyles('yatzy', getGameSpecificStyles());
    if (typeof lucide !== 'undefined') lucide.createIcons();
    
    setupScrollPrevention('yatzy');
    
    yatzyGame = new YatzyGame();
    window.yatzyGame = yatzyGame;
    window.rollYatzy = () => yatzyGame.rollDice();
    window.newYatzy = () => yatzyGame.newGame();
    window.selectCategory = (category) => yatzyGame.selectCategory(category);
}

export function cleanup() {
    if (yatzyGame) {
        yatzyGame.removeControls();
        yatzyGame = null;
    }
    removeScrollPrevention('yatzy');
    removeGameStyles('yatzy');
}

class YatzyGame {
    constructor() {
        this.dice = [1, 1, 1, 1, 1];
        this.heldDice = [false, false, false, false, false];
        this.rollsLeft = 3;
        this.round = 1;
        this.maxRounds = 15;
        this.scores = {};
        this.categories = [
            { id: 'ones', name: 'Enere', max: 5 },
            { id: 'twos', name: 'Toere', max: 10 },
            { id: 'threes', name: 'Treere', max: 15 },
            { id: 'fours', name: 'Firere', max: 20 },
            { id: 'fives', name: 'Femmere', max: 25 },
            { id: 'sixes', name: 'Seksere', max: 30 },
            { id: 'pair', name: 'Ett par', max: 12 },
            { id: 'twoPairs', name: 'To par', max: 22 },
            { id: 'threeKind', name: 'Tre like', max: 18 },
            { id: 'fourKind', name: 'Fire like', max: 24 },
            { id: 'fullHouse', name: 'Fullt hus', max: 28 },
            { id: 'smallStraight', name: 'Liten straight', max: 30 },
            { id: 'largeStraight', name: 'Stor straight', max: 30 },
            { id: 'yatzy', name: 'Yatzy', max: 50 },
            { id: 'chance', name: 'Sjanse', max: 30 }
        ];
        
        this.setupControls();
        this.newGame();
    }

    setupControls() {
        this.keyHandler = setupHardReset('yatzy', (e) => {
            const activeElement = document.activeElement;
            if (activeElement && (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA')) {
                return;
            }
        });
        document.addEventListener('keydown', this.keyHandler);
    }

    removeControls() {
        if (this.keyHandler) {
            document.removeEventListener('keydown', this.keyHandler);
        }
    }

    newGame() {
        this.dice = [1, 1, 1, 1, 1];
        this.heldDice = [false, false, false, false, false];
        this.rollsLeft = 3;
        this.round = 1;
        this.scores = {};
        this.updateDisplay();
        this.updateScorecard();
    }

    rollDice() {
        if (this.rollsLeft === 0) {
            document.getElementById('yatzy-status').textContent = 'Velg en kategori først!';
            return;
        }

        // Roll unheld dice
        for (let i = 0; i < 5; i++) {
            if (!this.heldDice[i]) {
                this.dice[i] = Math.floor(Math.random() * 6) + 1;
            }
        }

        this.rollsLeft--;
        this.updateDisplay();
        this.updateScorecard();

        if (this.rollsLeft === 0) {
            document.getElementById('yatzy-status').textContent = 'Velg en kategori!';
            document.getElementById('roll-btn').disabled = true;
        } else {
            document.getElementById('yatzy-status').textContent = `${this.rollsLeft} kast igjen`;
        }
    }

    toggleHold(index) {
        if (this.rollsLeft === 3) return; // Can't hold before first roll
        this.heldDice[index] = !this.heldDice[index];
        this.updateDisplay();
    }

    selectCategory(categoryId) {
        if (this.scores[categoryId] !== undefined) return; // Already scored
        if (this.rollsLeft === 3) {
            document.getElementById('yatzy-status').textContent = 'Kast terningene først!';
            return;
        }

        const score = this.calculateScore(categoryId);
        this.scores[categoryId] = score;
        this.round++;
        this.rollsLeft = 3;
        this.heldDice = [false, false, false, false, false];
        
        // Reset dice for next round
        this.dice = [1, 1, 1, 1, 1];

        if (this.round > this.maxRounds) {
            this.endGame();
        } else {
            document.getElementById('yatzy-status').textContent = 'Kast terningene';
            document.getElementById('roll-btn').disabled = false;
        }

        this.updateDisplay();
        this.updateScorecard();
    }

    calculateScore(categoryId) {
        const counts = this.getCounts();
        const sorted = [...this.dice].sort((a, b) => a - b);

        switch(categoryId) {
            case 'ones':
                return counts[1] || 0;
            case 'twos':
                return (counts[2] || 0) * 2;
            case 'threes':
                return (counts[3] || 0) * 3;
            case 'fours':
                return (counts[4] || 0) * 4;
            case 'fives':
                return (counts[5] || 0) * 5;
            case 'sixes':
                return (counts[6] || 0) * 6;
            case 'pair':
                for (let i = 6; i >= 1; i--) {
                    if (counts[i] >= 2) return i * 2;
                }
                return 0;
            case 'twoPairs':
                let pairs = [];
                for (let i = 6; i >= 1; i--) {
                    if (counts[i] >= 2) pairs.push(i);
                }
                if (pairs.length >= 2) return pairs[0] * 2 + pairs[1] * 2;
                return 0;
            case 'threeKind':
                for (let i = 6; i >= 1; i--) {
                    if (counts[i] >= 3) return i * 3;
                }
                return 0;
            case 'fourKind':
                for (let i = 6; i >= 1; i--) {
                    if (counts[i] >= 4) return i * 4;
                }
                return 0;
            case 'fullHouse':
                let hasThree = false, hasPair = false;
                for (let i = 1; i <= 6; i++) {
                    if (counts[i] === 3) hasThree = true;
                    if (counts[i] === 2) hasPair = true;
                }
                return (hasThree && hasPair) ? this.dice.reduce((a, b) => a + b, 0) : 0;
            case 'smallStraight':
                const smallStraight = sorted.join('') === '12345' || sorted.join('') === '12346' || sorted.join('') === '12356' || sorted.join('') === '12456' || sorted.join('') === '13456' || sorted.join('') === '23456';
                return smallStraight ? 30 : 0;
            case 'largeStraight':
                const largeStraight = sorted.join('') === '12345' || sorted.join('') === '23456';
                return largeStraight ? 30 : 0;
            case 'yatzy':
                return counts[this.dice[0]] === 5 ? 50 : 0;
            case 'chance':
                return this.dice.reduce((a, b) => a + b, 0);
            default:
                return 0;
        }
    }

    getCounts() {
        const counts = {};
        for (const die of this.dice) {
            counts[die] = (counts[die] || 0) + 1;
        }
        return counts;
    }

    endGame() {
        const total = this.getTotal();
        document.getElementById('yatzy-status').textContent = `Spill over! Totalt: ${total} poeng`;
        alert(`Spill over! Du fikk ${total} poeng!`);
    }

    getTotal() {
        let total = 0;
        for (const score of Object.values(this.scores)) {
            total += score;
        }
        return total;
    }

    updateDisplay() {
        const diceContainer = document.getElementById('yatzy-dice');
        diceContainer.innerHTML = '';
        
        for (let i = 0; i < 5; i++) {
            const dieEl = document.createElement('div');
            dieEl.className = `yatzy-die ${this.heldDice[i] ? 'held' : ''}`;
            dieEl.textContent = this.dice[i];
            dieEl.onclick = () => this.toggleHold(i);
            diceContainer.appendChild(dieEl);
        }

        document.getElementById('round-yatzy').textContent = `${this.round}/${this.maxRounds}`;
        document.getElementById('total-yatzy').textContent = this.getTotal();
    }

    updateScorecard() {
        const scorecardEl = document.getElementById('yatzy-scorecard');
        scorecardEl.innerHTML = '';

        for (const category of this.categories) {
            const scoreEl = document.createElement('div');
            scoreEl.className = `yatzy-score-item ${this.scores[category.id] !== undefined ? 'scored' : 'available'}`;
            
            const nameEl = document.createElement('span');
            nameEl.className = 'yatzy-score-name';
            nameEl.textContent = category.name;
            
            const scoreValueEl = document.createElement('span');
            scoreValueEl.className = 'yatzy-score-value';
            
            if (this.scores[category.id] !== undefined) {
                scoreValueEl.textContent = this.scores[category.id];
            } else {
                const possibleScore = this.rollsLeft < 3 ? this.calculateScore(category.id) : '-';
                scoreValueEl.textContent = possibleScore;
                if (possibleScore !== '-' && possibleScore > 0) {
                    scoreEl.classList.add('possible');
                    scoreEl.onclick = () => this.selectCategory(category.id);
                }
            }
            
            scoreEl.appendChild(nameEl);
            scoreEl.appendChild(scoreValueEl);
            scorecardEl.appendChild(scoreEl);
        }
    }
}

function getGameSpecificStyles() {
    return `
        .yatzy-wrap {
            width: 100%;
            max-width: min(1000px, 95vw);
            display: flex;
            flex-direction: column;
            align-items: center;
            padding: 10px;
            box-sizing: border-box;
        }
        .yatzy-header h1 {
            font-size: 2.5rem;
            font-weight: 800;
            color: #111;
            margin: 0 0 20px 0;
            text-align: center;
        }
        .yatzy-stats {
            display: flex;
            gap: 20px;
            margin-bottom: 20px;
            justify-content: center;
            flex-wrap: wrap;
        }
        .yatzy-game-area {
            display: flex;
            gap: 30px;
            width: 100%;
            max-width: 100%;
            align-items: flex-start;
            flex-wrap: wrap;
        }
        .yatzy-left {
            flex: 1;
            min-width: 300px;
        }
        .yatzy-right {
            flex: 1;
            min-width: 300px;
        }
        .yatzy-dice-area {
            background: #f8f9fa;
            border: 2px solid #dee2e6;
            border-radius: 0;
            padding: 20px;
            margin-bottom: 20px;
        }
        .yatzy-dice-container {
            display: flex;
            gap: 15px;
            justify-content: center;
            margin-bottom: 20px;
            flex-wrap: wrap;
        }
        .yatzy-die {
            width: 60px;
            height: 60px;
            background: #fff;
            border: 3px solid #6c757d;
            border-radius: 0;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 2rem;
            font-weight: 700;
            cursor: pointer;
            transition: all 0.2s ease;
            touch-action: manipulation;
            min-height: 60px;
            min-width: 60px;
        }
        .yatzy-die:hover {
            background: #e9ecef;
            border-color: #495057;
        }
        .yatzy-die.held {
            background: #cfe2ff;
            border-color: #0d6efd;
            border-width: 4px;
        }
        .yatzy-roll-info {
            text-align: center;
        }
        .yatzy-status {
            color: #111;
            font-size: 1rem;
            font-weight: 600;
            margin-bottom: 15px;
            min-height: 24px;
        }
        .yatzy-roll-buttons {
            display: flex;
            gap: 10px;
            justify-content: center;
            flex-wrap: wrap;
        }
        .yatzy-scorecard {
            background: #f8f9fa;
            border: 2px solid #dee2e6;
            border-radius: 0;
            padding: 20px;
        }
        .yatzy-scorecard h3 {
            margin: 0 0 15px 0;
            font-size: 1.2rem;
            color: #495057;
            text-align: center;
        }
        .yatzy-score-list {
            display: flex;
            flex-direction: column;
            gap: 8px;
        }
        .yatzy-score-item {
            display: flex;
            justify-content: space-between;
            padding: 10px 15px;
            background: #fff;
            border: 2px solid #dee2e6;
            border-radius: 0;
            cursor: pointer;
            transition: all 0.2s ease;
        }
        .yatzy-score-item.scored {
            background: #e9ecef;
            cursor: default;
        }
        .yatzy-score-item.available:hover {
            background: #f8f9fa;
        }
        .yatzy-score-item.possible {
            background: #d1ecf1;
            border-color: #0d6efd;
            cursor: pointer;
        }
        .yatzy-score-item.possible:hover {
            background: #bee5eb;
        }
        .yatzy-score-name {
            color: #495057;
            font-weight: 600;
            font-size: 0.95rem;
        }
        .yatzy-score-value {
            color: #111;
            font-weight: 700;
            font-size: 1rem;
        }
        @media (max-width: 768px) {
            .yatzy-wrap {
                padding: 5px;
            }
            .yatzy-header h1 {
                font-size: 2rem;
                margin-bottom: 15px;
            }
            .yatzy-stats {
                flex-direction: column;
                gap: 10px;
                width: 100%;
            }
            .stat-box {
                width: 100%;
                padding: 12px 20px;
            }
            .stat-value {
                font-size: 1.75rem;
            }
            .yatzy-game-area {
                flex-direction: column;
                gap: 20px;
            }
            .yatzy-left, .yatzy-right {
                width: 100%;
                min-width: 100%;
            }
            .yatzy-die {
                width: 50px;
                height: 50px;
                font-size: 1.5rem;
                min-height: 50px;
                min-width: 50px;
            }
            .yatzy-roll-buttons {
                flex-direction: column;
            }
            .btn-primary, .btn-secondary {
                width: 100%;
                min-height: 48px;
            }
        }
        @media (max-width: 480px) {
            .yatzy-die {
                width: 45px;
                height: 45px;
                font-size: 1.25rem;
                min-height: 45px;
                min-width: 45px;
            }
            .yatzy-header h1 {
                font-size: 1.75rem;
            }
        }
    `;
}
