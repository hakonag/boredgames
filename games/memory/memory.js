// Memory Game Module

let memoryGame = null;

export function init() {
    const gameContent = document.getElementById('game-content');
    gameContent.innerHTML = `
        <button class="back-button-tetris" onclick="window.location.href='https://hakonag.github.io/boredgames/'">
            <i data-lucide="house"></i> Tilbake
        </button>
        <div class="memory-wrap">
            <div class="memory-main">
                <div class="memory-header">
                    <h1>Memory</h1>
                    <div class="memory-stats">
                        <div class="stat-box">
                            <div class="stat-label">Trekk</div>
                            <div class="stat-value" id="moves-memory">0</div>
                        </div>
                        <div class="stat-box">
                            <div class="stat-label">Par</div>
                            <div class="stat-value" id="pairs-memory">0/12</div>
                        </div>
                    </div>
                </div>
                <div class="memory-game-area">
                    <div class="memory-board" id="memory-board"></div>
                </div>
                <div class="memory-controls">
                    <p id="memory-status" class="memory-status">Klikk på to kort</p>
                    <div class="memory-buttons">
                        <button onclick="window.resetMemory()" class="btn-secondary">
                            <i data-lucide="refresh-cw"></i> Reset
                        </button>
                    </div>
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
    window.memoryScrollPrevent = { wheel: preventScroll, touchmove: preventScroll };
    
    memoryGame = new MemoryGame();
    window.memoryGame = memoryGame;
    window.resetMemory = () => memoryGame.reset();
}

export function cleanup() {
    if (memoryGame) {
        memoryGame.removeControls();
        memoryGame = null;
    }
    // Remove scroll prevention
    if (window.memoryScrollPrevent) {
        window.removeEventListener('wheel', window.memoryScrollPrevent.wheel);
        window.removeEventListener('touchmove', window.memoryScrollPrevent.touchmove);
        delete window.memoryScrollPrevent;
    }
    const styleEl = document.getElementById('memory-style');
    if (styleEl) styleEl.remove();
}

class MemoryGame {
    constructor() {
        this.size = 6; // 6x4 grid = 24 cards = 12 pairs
        this.cards = [];
        this.flippedCards = [];
        this.matchedPairs = 0;
        this.moves = 0;
        this.gameOver = false;
        
        this.initCards();
        this.setupControls();
        this.updateDisplay();
    }

    initCards() {
        const symbols = ['🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯', '🦁', '🐮'];
        this.cards = [];
        
        // Create pairs
        for (let i = 0; i < 12; i++) {
            this.cards.push({ id: i * 2, symbol: symbols[i], flipped: false, matched: false });
            this.cards.push({ id: i * 2 + 1, symbol: symbols[i], flipped: false, matched: false });
        }
        
        // Shuffle
        for (let i = this.cards.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.cards[i], this.cards[j]] = [this.cards[j], this.cards[i]];
        }
    }

    setupControls() {
        // Controls handled in updateDisplay
    }

    removeControls() {
        // Cleanup handled by DOM removal
    }

    reset() {
        this.flippedCards = [];
        this.matchedPairs = 0;
        this.moves = 0;
        this.gameOver = false;
        this.initCards();
        document.getElementById('moves-memory').textContent = '0';
        document.getElementById('pairs-memory').textContent = '0/12';
        document.getElementById('memory-status').textContent = 'Klikk på to kort';
        this.updateDisplay();
    }

    flipCard(index) {
        if (this.gameOver || this.flippedCards.length >= 2) return;
        if (this.cards[index].flipped || this.cards[index].matched) return;
        
        this.cards[index].flipped = true;
        this.flippedCards.push(index);
        
        if (this.flippedCards.length === 2) {
            this.moves++;
            document.getElementById('moves-memory').textContent = this.moves;
            
            const card1 = this.cards[this.flippedCards[0]];
            const card2 = this.cards[this.flippedCards[1]];
            
            if (card1.symbol === card2.symbol) {
                // Match!
                card1.matched = true;
                card2.matched = true;
                this.matchedPairs++;
                document.getElementById('pairs-memory').textContent = `${this.matchedPairs}/12`;
                this.flippedCards = [];
                
                if (this.matchedPairs === 12) {
                    this.gameOver = true;
                    document.getElementById('memory-status').textContent = `Gratulerer! Du klarte det på ${this.moves} trekk!`;
                    alert(`Gratulerer! Du klarte det på ${this.moves} trekk!`);
                } else {
                    document.getElementById('memory-status').textContent = 'Match!';
                }
            } else {
                // No match
                setTimeout(() => {
                    card1.flipped = false;
                    card2.flipped = false;
                    this.flippedCards = [];
                    this.updateDisplay();
                }, 1000);
                document.getElementById('memory-status').textContent = 'Ikke match';
            }
        }
        
        this.updateDisplay();
    }

    updateDisplay() {
        const boardEl = document.getElementById('memory-board');
        if (!boardEl) return;
        
        boardEl.innerHTML = '';
        
        this.cards.forEach((card, index) => {
            const cardEl = document.createElement('div');
            cardEl.className = 'memory-card';
            cardEl.dataset.index = index;
            
            if (card.flipped || card.matched) {
                cardEl.classList.add('flipped');
                cardEl.textContent = card.symbol;
            } else {
                cardEl.textContent = '?';
            }
            
            if (card.matched) {
                cardEl.classList.add('matched');
            }
            
            if (!card.matched) {
                cardEl.addEventListener('click', () => this.flipCard(index));
            }
            
            boardEl.appendChild(cardEl);
        });
    }
}

function injectStyles() {
    if (document.getElementById('memory-style')) return;
    const style = document.createElement('style');
    style.id = 'memory-style';
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
        .memory-wrap {
            width: 100%;
            max-width: 700px;
            display: flex;
            flex-direction: column;
            align-items: center;
        }
        .memory-header h1 {
            font-size: 3rem;
            font-weight: 800;
            color: #333;
            margin: 0 0 20px 0;
            text-align: center;
        }
        .memory-stats {
            display: flex;
            gap: 20px;
            margin-bottom: 20px;
            justify-content: center;
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
        .memory-game-area {
            width: 100%;
            display: flex;
            justify-content: center;
            margin-bottom: 20px;
        }
        .memory-board {
            display: grid;
            grid-template-columns: repeat(6, 1fr);
            gap: 10px;
            max-width: 600px;
            width: 100%;
        }
        .memory-card {
            aspect-ratio: 1;
            background: #0d6efd;
            border: 3px solid #0a58ca;
            border-radius: 8px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 2.5rem;
            font-weight: 700;
            color: #fff;
            cursor: pointer;
            transition: all 0.3s ease;
            transform-style: preserve-3d;
        }
        .memory-card:hover:not(.matched) {
            background: #0a58ca;
            transform: scale(1.05);
        }
        .memory-card.flipped {
            background: #fff;
            color: #333;
            border-color: #0d6efd;
        }
        .memory-card.matched {
            background: #d4edda;
            border-color: #28a745;
            opacity: 0.7;
            cursor: default;
        }
        .memory-controls {
            text-align: center;
        }
        .memory-status {
            color: #333;
            font-size: 1rem;
            font-weight: 600;
            margin-bottom: 15px;
            min-height: 24px;
        }
        .memory-buttons {
            display: flex;
            gap: 10px;
            justify-content: center;
        }
        .btn-secondary {
            padding: 10px 20px;
            border-radius: 6px;
            font-size: 0.9rem;
            cursor: pointer;
            font-weight: 600;
            display: flex;
            align-items: center;
            gap: 6px;
            border: 2px solid;
            background: #6c757d;
            color: white;
            border-color: #5a6268;
        }
        .btn-secondary:hover {
            background: #5a6268;
        }
        .btn-secondary i {
            width: 14px;
            height: 14px;
        }
        @media (max-width: 768px) {
            .memory-header h1 {
                font-size: 2rem;
            }
            .memory-stats {
                flex-direction: column;
                gap: 10px;
            }
            .stat-box {
                width: 100%;
            }
            .memory-board {
                grid-template-columns: repeat(4, 1fr);
                gap: 8px;
            }
            .memory-card {
                font-size: 2rem;
            }
        }
    `;
    document.head.appendChild(style);
}

