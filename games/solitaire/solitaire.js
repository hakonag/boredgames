import { displayHighScores, showScoreModal } from '../../core/highScores.js';
import { createBackButton } from '../../core/gameUtils.js';
// Solitaire (Kabal) Game Module

let solitaireGame = null;

export function init() {
    const gameContent = document.getElementById('game-content');
    gameContent.innerHTML = createBackButton() + `
        <div class="solitaire-game solitaire-layout">
            <div class="solitaire-board">
                <div class="solitaire-top-row">
                    <div class="stock-area">
                        <div class="stock-pile" id="solitaire-stock"></div>
                        <div class="waste-pile" id="solitaire-waste"></div>
                    </div>
                    <div class="foundation-area">
                        <div class="foundation-pile" id="foundation-0" data-foundation="0"></div>
                        <div class="foundation-pile" id="foundation-1" data-foundation="1"></div>
                        <div class="foundation-pile" id="foundation-2" data-foundation="2"></div>
                        <div class="foundation-pile" id="foundation-3" data-foundation="3"></div>
                    </div>
                </div>
                <div class="tableau-area" id="solitaire-tableau"></div>
            </div>
            <div class="solitaire-right">
                <div class="solitaire-controls">
                    <div class="game-stats">
                        <div class="stat-pill"><span class="pill-label">Trekk</span><span id="move-count">0</span></div>
                        <div class="stat-pill"><span class="pill-label">Tid</span><span id="game-timer">00:00</span></div>
                    </div>
                    <button class="btn-primary" onclick="window.resetSolitaire()"><i data-lucide="refresh-cw"></i> Nytt spill</button>
                    <p id="solitaire-status" class="sol-status"></p>
                </div>
                <div class="solitaire-leaderboard">
                    <h3>Toppresultater</h3>
                    <div id="scores-list" class="scores-list"></div>
                </div>
            </div>
        </div>
    `;
    
    // Remove scroll lock from Tetris if active
    if (window.tetrisScrollPrevent) {
        window.removeEventListener('wheel', window.tetrisScrollPrevent.wheel);
        window.removeEventListener('touchmove', window.tetrisScrollPrevent.touchmove);
        window.tetrisScrollPrevent = null;
    }
    // Lock scrolling for Solitaire
    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.width = '100%';
    document.body.style.height = '100%';
    document.documentElement.style.overflow = 'hidden';
    
    const style = document.createElement('style');
    style.id = 'game-specific-styles';
    style.textContent = `
        /* Grotesk font + full-page framing similar to Tetris */
        .game-container #game-content, .game-container #game-content * { font-family: system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol" !important; color:#111; }
        body { overflow:hidden !important; position:fixed !important; width:100% !important; }
        html { overflow:hidden !important; }
        .game-container { position: fixed; inset: 0; background:#fff; border-radius:0; box-shadow:none; padding:0; display:flex; align-items:center; justify-content:center; }
        .game-container #game-content { width:100%; height:90vh; max-height:90vh; margin-top:5vh; margin-bottom:5vh; display:flex; flex-direction:column; align-items:center; justify-content:center; background:transparent; }

        .solitaire-layout { display:grid; grid-template-columns: 4fr 1fr; gap:16px; align-items:stretch; width:100%; max-width:min(1200px, 95vw); height:100%; padding:0 10px; box-sizing:border-box; }
        .solitaire-board { --card-w:76px; --card-h:108px; --pile-gap:18px; background:
            radial-gradient(1200px 800px at 50% 0%, rgba(255,255,255,0.06), rgba(255,255,255,0) 60%),
            linear-gradient(180deg, #0e8747 0%, #0c7a41 40%, #096f3b 100%);
            border:2px solid #0b5e31; border-radius: 0; padding:16px; overflow:hidden; display:flex; flex-direction:column; min-height:0; margin:0; width:100%; height:100%; box-sizing:border-box; box-shadow:inset 0 0 0 2px rgba(255,255,255,0.06), 0 8px 24px rgba(0,0,0,.18); }
        .solitaire-game { width:100%; height:100%; margin:0; padding:0; overflow:hidden; box-sizing:border-box; }
        /* Force grid on the combined class to override any flex defaults */
        .solitaire-game.solitaire-layout { display:grid !important; grid-template-columns: 4fr 1fr; }
        .solitaire-right { min-width: 220px; display:flex; flex-direction:column; gap:12px; height:100%; align-self:stretch; }
        /* Align top row to 7-column grid like tableau: [stock][waste][gap][A][A][A][A] */
        .solitaire-top-row {
            display: grid;
            grid-template-columns: repeat(7, var(--card-w));
            justify-content: start;
            column-gap: var(--pile-gap);
            margin-bottom: 18px;
            flex-shrink: 0;
            height: var(--card-h);
        }
        .stock-area {
            grid-column: 1 / span 2;
            display: flex;
            gap: var(--pile-gap);
            justify-content: flex-start;
        }
        .foundation-area {
            grid-column: 4 / span 4;
            display: grid;
            grid-template-columns: repeat(4, var(--card-w));
            column-gap: var(--pile-gap);
            justify-content: start;
        }
        .stock-pile, .waste-pile, .foundation-pile, .tableau-pile {
            width: var(--card-w);
            height: var(--card-h);
            border: 2px dashed rgba(255,255,255,0.35);
            border-radius: 0;
            position: relative;
            cursor: pointer;
        }
        .foundation-pile { background: rgba(255,255,255,0.08); }
        .tableau-pile {
            width: var(--card-w);
            min-height: var(--card-h);
            border: none;
        }
        .solitaire-card {
            width: var(--card-w);
            height: var(--card-h);
            background: white;
            border: 2px solid #b0b6bb;
            border-radius: 0;
            position: absolute;
            cursor: grab;
            user-select: none;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            padding: 5px;
            box-sizing: border-box;
            touch-action: none;
            will-change: transform, left, top;
            box-shadow: 0 3px 8px rgba(0,0,0,0.18);
        }
        .solitaire-card:active {
            cursor: grabbing;
        }
        .solitaire-card.dragging {
            opacity: 0.8;
            transform: none;
            z-index: 10000;
            cursor: grabbing;
        }
        .solitaire-card.selected {
            border: 3px solid #ffd700;
            box-shadow: 0 0 0 4px rgba(255,215,0,0.2);
            z-index: 1000;
        }
        .pile-counter {
            position: absolute;
            bottom: -20px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(0,0,0,0.7);
            color: white;
            padding: 2px 6px;
            border-radius: 0;
            font-size: 0.75rem;
            white-space: nowrap;
        }
        .stock-pile, .waste-pile {
            position: relative;
            width: var(--card-w);
            height: var(--card-h);
        }
        .card-stack {
            position: relative;
            width: var(--card-w);
            height: var(--card-h);
        }
        .card-stack .stacked-card {
            position: absolute;
            width: var(--card-w);
            height: var(--card-h);
            border: 1px solid rgba(0,0,0,0.16);
            border-radius: 0;
            background: rgba(255,255,255,0.95);
            box-shadow: 0 2px 6px rgba(0,0,0,0.1);
        }
        .stock-visual {
            position: relative;
            width: var(--card-w);
            height: var(--card-h);
            margin: 2px;
        }
        .stock-card {
            position: absolute;
            width: var(--card-w);
            height: var(--card-h);
            background:
                repeating-linear-gradient(45deg, rgba(255,255,255,0.08) 0 8px, rgba(255,255,255,0) 8px 16px),
                linear-gradient(135deg, #1f6fe0 0%, #1a5ec4 100%);
            border: 2px solid #154c99;
            border-radius: 0;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 1.5rem;
            color: rgba(255,255,255,0.9);
            box-shadow: 0 3px 8px rgba(0,0,0,0.2), inset 0 0 0 2px rgba(255,255,255,0.08);
        }
        .card-stack-indicator {
            position: absolute;
            width: 76px;
            height: 108px;
            border: 2px dashed rgba(255,255,255,0.3);
            border-radius: 0;
            pointer-events: none;
        }
        .solitaire-card.face-down {
            background:
                repeating-linear-gradient(45deg, rgba(255,255,255,0.08) 0 8px, rgba(255,255,255,0) 8px 16px),
                linear-gradient(135deg, #1f6fe0 0%, #1a5ec4 100%);
            color:#e9f2ff;
            border-color:#154c99;
        }
        .solitaire-card.red {
            color: #d32f2f;
        }
        .solitaire-card.black {
            color: #212121;
        }
        /* Ensure inner glyphs inherit correct color */
        .solitaire-card.red .card-value,
        .solitaire-card.red .card-value-bottom,
        .solitaire-card.red .card-suit { color: #d32f2f !important; }
        .solitaire-card.black .card-value,
        .solitaire-card.black .card-value-bottom,
        .solitaire-card.black .card-suit { color: #212121 !important; }
        .card-value {
            font-size: 1rem;
            font-weight: bold;
            line-height: 1;
        }
        .card-suit {
            font-size: 1.3rem;
            text-align: center;
            flex-grow: 1;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .card-value-bottom {
            font-size: 1rem;
            font-weight: bold;
            transform: rotate(180deg);
            line-height: 1;
        }
        .tableau-area {
            display: grid;
            grid-template-columns: repeat(7, var(--card-w));
            justify-content: start;
            column-gap: var(--pile-gap);
            flex: 1;
            overflow: hidden;
            min-height: 0;
            margin-top: 18px;
        }
        .tableau-pile {
            position: relative;
            overflow: visible;
        }
        .drop-zone {
            border: 2px dashed rgba(255,255,255,0.5);
            background: rgba(255,255,255,0.08);
        }
        .drop-zone.drag-over { border-color: #ffd700; background: rgba(255,215,0,0.24); }
        /* Stronger hover indicator for any valid pile under pointer */
        .drag-over { border-color:#ffd700 !important; background: rgba(255,215,0,0.2) !important; box-shadow: 0 0 0 8px rgba(255,215,0,0.25), 0 0 24px rgba(255,215,0,0.45); }
        /* Positive feedback flash */
        @keyframes pileFlash {
            0% { box-shadow: 0 0 0 0 rgba(255,215,0,0); background-color: rgba(255,215,0,0); }
            25% { box-shadow: 0 0 0 8px rgba(255,215,0,0.45), 0 0 22px rgba(255,215,0,0.6); background-color: rgba(255,215,0,0.15); }
            100% { box-shadow: 0 0 0 0 rgba(255,215,0,0); background-color: rgba(255,215,0,0); }
        }
        .pile-flash {
            animation: pileFlash 650ms ease-out;
            border-color: #ffd700 !important;
            border-style: solid !important;
        }
        /* Card-level flash/highlight when targeting non-empty piles */
        .card-flash { animation: pileFlash 650ms ease-out; }
        .target-card-hover { outline: 3px solid #ffd700; box-shadow: 0 0 0 6px rgba(255,215,0,0.25), 0 0 20px rgba(255,215,0,0.35); }
        .solitaire-controls { display:flex; flex-direction:column; gap:10px; }
        .game-stats { display:flex; gap:8px; }
        .stat-pill { background:#f8f9fa; border:2px solid #dee2e6; border-radius: 0; padding:8px 12px; display:flex; flex-direction:column; align-items:center; min-width:90px; }
        .pill-label { font-size:.7rem; color:#6c757d; text-transform:uppercase; letter-spacing:.5px; }
        .stat-pill span:last-child { font-size:1.1rem; font-weight:800; color:#111; }
        .sol-status { min-height:20px; color:#495057; font-weight:600; }
        .solitaire-controls button {
            background: #007bff;
            color: white;
            border: 2px solid #0056b3;
            padding: 4px 8px;
            border-radius: 0;
            font-size: 0.7rem;
            cursor: pointer;
            margin: 0 2px;
            transition: background-color .15s ease, border-color .15s ease, color .15s ease;
        }
        .solitaire-controls button:hover {
            background: #0056b3;
            border-color: #004085;
        }
        #solitaire-status {
            margin-top: 2px;
            color: #111;
            font-size: 0.7rem;
        }
        .solitaire-leaderboard { background:#f8f9fa; border:2px solid #dee2e6; border-radius: 0; padding:10px; flex:1; display:flex; flex-direction:column; min-height:0; }
        .solitaire-leaderboard h3 { margin:0 0 8px 0; font-size:.9rem; text-align:center; color:#495057; }
        .scores-list { flex:1; overflow:auto; min-height:0; }
        /* Intentionally keep side-by-side layout across sizes per request */
        .score-item { display:flex; justify-content:space-between; padding:4px 0; border-bottom:1px solid #e9ecef; font-size:.8rem; }
        .score-item:last-child { border-bottom:none; }
        .score-rank {
            font-weight: bold;
            margin-right: 10px;
        }
        @media (max-width: 768px) {
            .game-container #game-content {
                height: 100vh;
                max-height: 100vh;
                margin: 0;
                padding: 10px;
            }
            .solitaire-layout {
                grid-template-columns: 1fr !important;
                grid-template-rows: auto 1fr;
                gap: 10px;
                height: 100%;
            }
            .solitaire-board {
                order: 2;
                --card-w: 56px;
                --card-h: 80px;
                --pile-gap: 12px;
                padding: 10px;
            }
            .solitaire-right {
                order: 1;
                min-width: 100%;
                flex-direction: row;
                gap: 10px;
                height: auto;
            }
            .solitaire-controls {
                flex: 1;
            }
            .solitaire-leaderboard {
                flex: 1;
                min-height: 150px;
            }
            .game-stats {
                flex-direction: column;
                gap: 6px;
            }
            .stat-pill {
                min-width: auto;
                width: 100%;
                padding: 6px 10px;
            }
            .stat-pill span:last-child {
                font-size: 1rem;
            }
            .solitaire-top-row {
                grid-template-columns: repeat(7, var(--card-w));
                column-gap: var(--pile-gap);
                margin-bottom: 12px;
            }
            .tableau-area {
                grid-template-columns: repeat(7, var(--card-w));
                column-gap: var(--pile-gap);
                margin-top: 12px;
            }
            .solitaire-card {
                width: var(--card-w);
                height: var(--card-h);
                padding: 3px;
            }
            .card-value {
                font-size: 0.85rem;
            }
            .card-suit {
                font-size: 1.1rem;
            }
            .card-value-bottom {
                font-size: 0.85rem;
            }
            .scores-list {
                max-height: 120px;
            }
            .score-item {
                font-size: 0.75rem;
                padding: 4px 0;
            }
        }
    `;
    document.head.appendChild(style);
    // Load Solitaire high scores in sidebar
    displayHighScores('scores-list', 'solitaire', 30).catch(() => {});

    // Lock scrolling (full-page)
    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.width = '100%';
    document.body.style.height = '100%';
    document.documentElement.style.overflow = 'hidden';
    const preventScroll = (e) => { e.preventDefault(); return false; };
    window.addEventListener('wheel', preventScroll, { passive: false });
    window.addEventListener('touchmove', preventScroll, { passive: false });
    window.tetrisScrollPrevent = { wheel: preventScroll, touchmove: preventScroll };
    
    solitaireGame = new SolitaireGame();
    window.solitaireGame = solitaireGame;
    window.resetSolitaire = resetSolitaire;
    window.showHighScores = () => solitaireGame.showHighScores();
}

export function cleanup() {
    if (solitaireGame && solitaireGame.gameTimer) {
        clearInterval(solitaireGame.gameTimer);
        solitaireGame.gameTimer = null;
    }
    solitaireGame = null;
    window.resetSolitaire = null;
}

function resetSolitaire() {
    // Hard reset by reloading the page
    window.location.href = 'https://hakonag.github.io/boredgames/?game=solitaire';
}

class SolitaireGame {
    constructor() {
        this.suits = ['♠', '♥', '♦', '♣'];
        this.values = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
        this.deck = [];
        this.stock = [];
        this.waste = [];
        this.foundations = [[], [], [], []];
        this.tableau = [[], [], [], [], [], [], []];
        this.selectedCard = null;
        this.selectedSource = null;
        this.dragging = null;
        this.dragOffset = { x: 0, y: 0 };
        this.dragSequence = [];
        this.moveCount = 0;
        this.gameStartTime = null;
        this.gameTimer = null;
        this.highScores = this.loadHighScores();
        
        this.createDeck();
        this.shuffleDeck();
        this.deal();
        this.render();
        this.updateScale();
        this.setupDragAndDrop();
        this.startTimer();
        window.addEventListener('resize', () => this.updateScale());
    }
    
    updateScale() {
        const board = document.querySelector('.solitaire-board');
        if (!board) return;
        const computed = getComputedStyle(board);
        const gap = parseInt(computed.getPropertyValue('--pile-gap')) || 8;
        const paddingLeft = parseInt(getComputedStyle(board).paddingLeft) || 0;
        const paddingRight = parseInt(getComputedStyle(board).paddingRight) || 0;
        const availableWidth = board.clientWidth - paddingLeft - paddingRight;
        const columns = 7;
        const totalGaps = gap * (columns - 1);
        // Allow larger cards to better fill the felt area
        const cardW = Math.max(60, Math.min(96, Math.floor((availableWidth - totalGaps) / columns)));
        const cardH = Math.floor(cardW * 1.414);
        board.style.setProperty('--card-w', cardW + 'px');
        board.style.setProperty('--card-h', cardH + 'px');
        const topRow = document.querySelector('.solitaire-top-row');
        if (topRow) topRow.style.height = cardH + 'px';
    }

    createDeck() {
        this.deck = [];
        for (let suit = 0; suit < 4; suit++) {
            for (let value = 0; value < 13; value++) {
                this.deck.push({
                    suit: suit,
                    value: value,
                    color: (suit === 1 || suit === 2) ? 'red' : 'black',
                    faceUp: false
                });
            }
        }
    }
    
    shuffleDeck() {
        for (let i = this.deck.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.deck[i], this.deck[j]] = [this.deck[j], this.deck[i]];
        }
    }
    
    deal() {
        // Deal to tableau
        let cardIndex = 0;
        for (let col = 0; col < 7; col++) {
            for (let row = 0; row <= col; row++) {
                const card = this.deck[cardIndex++];
                card.faceUp = (row === col); // Top card is face up
                this.tableau[col].push(card);
            }
        }
        
        // Remaining cards go to stock
        this.stock = this.deck.slice(cardIndex);
    }
    
    canPlaceOnFoundation(card, foundationIndex) {
        const foundation = this.foundations[foundationIndex];
        if (foundation.length === 0) {
            return card.value === 0; // Only Ace can go on empty foundation
        }
        const topCard = foundation[foundation.length - 1];
        return card.suit === topCard.suit && card.value === topCard.value + 1;
    }
    
    canPlaceOnTableau(card, tableauIndex) {
        const pile = this.tableau[tableauIndex];
        if (pile.length === 0) {
            return card.value === 12; // Only King can go on empty tableau
        }
        const topCard = pile[pile.length - 1];
        if (!topCard.faceUp) return false;
        return card.color !== topCard.color && card.value === topCard.value - 1;
    }
    
    canPlaceSequence(cards, tableauIndex) {
        if (cards.length === 0) return false;
        const pile = this.tableau[tableauIndex];
        if (pile.length === 0) {
            return cards[0].value === 12; // First card must be King
        }
        const topCard = pile[pile.length - 1];
        if (!topCard.faceUp) return false;
        return cards[0].color !== topCard.color && cards[0].value === topCard.value - 1;
    }
    
    flipStock() {
        if (this.stock.length === 0) {
            // Move waste back to stock
            this.stock = [...this.waste].reverse();
            this.stock.forEach(c => c.faceUp = false);
            this.waste = [];
        } else {
            // Draw three cards at a time - these will "cover" any existing waste cards
            const cardsToDraw = Math.min(3, this.stock.length);
            for (let i = 0; i < cardsToDraw; i++) {
                const card = this.stock.pop();
                card.faceUp = true;
                this.waste.push(card);
            }
        }
        this.incrementMoveCount();
        this.render();
    }
    
    selectCard(card, source, index) {
        // Use requestAnimationFrame for smoother updates
        requestAnimationFrame(() => {
            if (this.selectedCard && this.selectedCard.element) {
                this.selectedCard.element.classList.remove('selected');
            }
            
            if (this.selectedCard && this.selectedCard.card === card && this.selectedCard.source === source) {
                // Deselect
                this.selectedCard = null;
                this.selectedSource = null;
                this.render();
            } else {
                this.selectedCard = { card, source, index, element: null };
                this.selectedSource = source;
                this.render();
            }
        });
    }
    
    moveCardTo(card, source, sourceIndex, targetSource, targetIndex) {
        const cardsToMove = this.removeCardFromSource(source, sourceIndex, card);
        if (!cardsToMove || cardsToMove.length === 0) {
            return false;
        }
        
        if (targetSource === 'foundation') {
            if (cardsToMove.length === 1) {
                this.foundations[targetIndex].push(cardsToMove[0]);
                this.checkWin();
                const el = document.getElementById(`foundation-${targetIndex}`);
                if (el) this.flashPile(el);
            } else {
                // Can't move multiple cards to foundation
                // Put cards back
                if (source === 'waste') {
                    this.waste.push(...cardsToMove);
                } else if (source === 'foundation') {
                    this.foundations[sourceIndex].push(...cardsToMove);
                } else if (source === 'tableau') {
                    this.tableau[sourceIndex].push(...cardsToMove);
                }
                return false;
            }
        } else if (targetSource === 'tableau') {
            // Validate that we can place the sequence
            if (this.canPlaceSequence(cardsToMove, targetIndex)) {
                this.tableau[targetIndex].push(...cardsToMove);
                const el = document.getElementById(`tableau-${targetIndex}`);
                if (el) this.flashPile(el);
            } else {
                // Can't place here, put cards back
                if (source === 'waste') {
                    this.waste.push(...cardsToMove);
                } else if (source === 'foundation') {
                    this.foundations[sourceIndex].push(...cardsToMove);
                } else if (source === 'tableau') {
                    this.tableau[sourceIndex].push(...cardsToMove);
                }
                return false;
            }
        }
        
        this.flipTopCard(source, sourceIndex);
        this.selectedCard = null;
        this.selectedSource = null;
        this.incrementMoveCount();
        this.render();
        return true;
    }
    
    moveCard() {
        if (!this.selectedCard) return false;
        
        const { card, source, index } = this.selectedCard;
        
        // Try to move to foundation
        for (let i = 0; i < 4; i++) {
            if (this.canPlaceOnFoundation(card, i)) {
                return this.moveCardTo(card, source, index, 'foundation', i);
            }
        }
        
        // Try to move to tableau
        for (let i = 0; i < 7; i++) {
            if (i === index && source === 'tableau') continue; // Don't move to same pile
            if (this.canPlaceOnTableau(card, i)) {
                return this.moveCardTo(card, source, index, 'tableau', i);
            }
        }
        
        return false;
    }
    
    removeCardFromSource(source, index, cardToRemove) {
        if (source === 'waste') {
            // Only allow removing the topmost (last) card from waste
            if (this.waste.length > 0 && this.waste[this.waste.length - 1] === cardToRemove && index === this.waste.length - 1) {
                this.waste.pop();
                return [cardToRemove];
            }
        } else if (source === 'foundation') {
            if (this.foundations[index].length > 0 && this.foundations[index][this.foundations[index].length - 1] === cardToRemove) {
                this.foundations[index].pop();
                return [cardToRemove];
            }
        } else if (source === 'tableau') {
            const pile = this.tableau[index];
            const cardIndex = pile.indexOf(cardToRemove);
            if (cardIndex !== -1) {
                // Remove card and all cards below it in sequence
                const cardsToMove = pile.splice(cardIndex);
                // Verify sequence is valid
                for (let i = 1; i < cardsToMove.length; i++) {
                    if (!cardsToMove[i].faceUp || 
                        cardsToMove[i-1].color === cardsToMove[i].color ||
                        cardsToMove[i-1].value !== cardsToMove[i].value + 1) {
                        // Invalid sequence, put cards back
                        pile.push(...cardsToMove);
                        return null;
                    }
                }
                return cardsToMove;
            }
        }
        return null;
    }
    
    flipTopCard(source, index) {
        if (source === 'tableau') {
            const pile = this.tableau[index];
            if (pile.length > 0 && !pile[pile.length - 1].faceUp) {
                pile[pile.length - 1].faceUp = true;
            }
        }
    }
    
    checkWin() {
        let allComplete = true;
        for (let i = 0; i < 4; i++) {
            if (this.foundations[i].length !== 13) {
                allComplete = false;
                break;
            }
        }
        
        if (allComplete) {
            document.getElementById('solitaire-status').textContent = '🎉 Gratulerer! Du vant!';
            // Compute a Solitaire score (lower time and fewer moves => higher score)
            const elapsed = Math.floor((Date.now() - this.gameStartTime) / 1000);
            const score = Math.max(1, 200000 - elapsed * 100 - this.moveCount * 50);
            showScoreModal('solitaire', score, () => {
                setTimeout(() => displayHighScores('scores-list', 'solitaire', 30), 200);
            }, () => {
                setTimeout(() => displayHighScores('scores-list', 'solitaire', 30), 200);
            });
            return;
        }
        
        // Check for autocomplete condition
        if (this.canAutocomplete()) {
            this.startAutocomplete();
        }
    }
    
    canAutocomplete() {
        // Check if all cards on tableau are face up
        for (let col = 0; col < 7; col++) {
            for (let card of this.tableau[col]) {
                if (!card.faceUp) {
                    return false;
                }
            }
        }
        
        // Check if stock and waste are empty
        if (this.stock.length > 0 || this.waste.length > 0) {
            return false;
        }
        
        // Check if there are any playable cards on tableau
        for (let col = 0; col < 7; col++) {
            if (this.tableau[col].length > 0) {
                const topCard = this.tableau[col][this.tableau[col].length - 1];
                // Check if this card can be moved to foundation
                for (let i = 0; i < 4; i++) {
                    if (this.canPlaceOnFoundation(topCard, i)) {
                        return true;
                    }
                }
            }
        }
        
        return false;
    }
    
    async startAutocomplete() {
        document.getElementById('solitaire-status').textContent = '🤖 Autocomplete...';
        
        let movesMade = true;
        while (movesMade) {
            movesMade = false;
            
            // Try to move cards from tableau to foundation
            for (let col = 0; col < 7; col++) {
                if (this.tableau[col].length > 0) {
                    const topCard = this.tableau[col][this.tableau[col].length - 1];
                    
                    // Find a foundation where this card can be placed
                    for (let i = 0; i < 4; i++) {
                        if (this.canPlaceOnFoundation(topCard, i)) {
                            // Move the card with visual animation
                            await this.animateCardMove(topCard, 'tableau', col, 'foundation', i);
                            movesMade = true;
                            break;
                        }
                    }
                }
            }
            
            // Small delay between moves for visual effect
            if (movesMade) {
                await this.delay(300);
            }
        }
        
        // Check if game is now complete
        this.checkWin();
    }
    
    async animateCardMove(card, source, sourceIndex, targetSource, targetIndex) {
        // Create a visual copy of the card for animation
        const originalCard = document.querySelector(`[data-card-id="${card.suit}-${card.value}"]`);
        if (!originalCard) return;
        
        const animatedCard = originalCard.cloneNode(true);
        animatedCard.style.position = 'fixed';
        animatedCard.style.zIndex = '10000';
        animatedCard.style.pointerEvents = 'none';
        animatedCard.style.transition = 'all 0.5s ease-in-out';
        
        const rect = originalCard.getBoundingClientRect();
        animatedCard.style.left = `${rect.left}px`;
        animatedCard.style.top = `${rect.top}px`;
        
        document.body.appendChild(animatedCard);
        
        // Move the card in the game logic
        this.moveCardTo(card, source, sourceIndex, targetSource, targetIndex);
        
        // Wait for the target position to be available
        await this.delay(100);
        
        // Find the target position
        let targetElement;
        if (targetSource === 'foundation') {
            targetElement = document.getElementById(`foundation-${targetIndex}`);
        } else if (targetSource === 'tableau') {
            targetElement = document.getElementById(`tableau-${targetIndex}`);
        }
        
        if (targetElement) {
            const targetRect = targetElement.getBoundingClientRect();
            animatedCard.style.left = `${targetRect.left}px`;
            animatedCard.style.top = `${targetRect.top}px`;
        }
        
        // Remove the animated card after animation
        setTimeout(() => {
            if (animatedCard.parentNode) {
                animatedCard.parentNode.removeChild(animatedCard);
            }
        }, 500);
    }
    
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    loadHighScores() {
        const saved = localStorage.getItem('solitaire-high-scores');
        return saved ? JSON.parse(saved) : [];
    }
    
    saveHighScores() {
        localStorage.setItem('solitaire-high-scores', JSON.stringify(this.highScores));
    }
    
    checkHighScore() {
        const elapsed = Math.floor((Date.now() - this.gameStartTime) / 1000);
        const newScore = {
            moves: this.moveCount,
            time: elapsed,
            date: new Date().toISOString()
        };
        
        // Add to high scores
        this.highScores.push(newScore);
        
        // Sort by moves (ascending), then by time (ascending)
        this.highScores.sort((a, b) => {
            if (a.moves !== b.moves) {
                return a.moves - b.moves;
            }
            return a.time - b.time;
        });
        
        // Keep only top 10
        this.highScores = this.highScores.slice(0, 10);
        
        this.saveHighScores();
        this.displayHighScores();
    }
    
    displayHighScores() {
        const scoresList = document.getElementById('scores-list');
        if (!scoresList) return;
        
        scoresList.innerHTML = '';
        
        this.highScores.forEach((score, index) => {
            const scoreEl = document.createElement('div');
            scoreEl.className = 'score-item';
            
            const minutes = Math.floor(score.time / 60);
            const seconds = score.time % 60;
            const timeStr = `${minutes}:${seconds.toString().padStart(2, '0')}`;
            
            scoreEl.innerHTML = `
                <span class="score-rank">${index + 1}.</span>
                <span>${score.moves} trekk</span>
                <span>${timeStr}</span>
            `;
            
            scoresList.appendChild(scoreEl);
        });
    }
    
    showHighScores() {
        const highScoresEl = document.getElementById('high-scores');
        if (highScoresEl) {
            highScoresEl.classList.toggle('hidden');
            if (!highScoresEl.classList.contains('hidden')) {
                this.displayHighScores();
            }
        }
    }
    
    setupDragAndDrop() {
        // Prevent scrolling during drag
        const preventScroll = (e) => {
            if (this.dragging) {
                e.preventDefault();
            }
        };
        
        document.addEventListener('mousemove', (e) => {
            this.handleDragMove(e);
            if (this.dragging) {
                e.preventDefault();
            }
        }, { passive: false });
        
        document.addEventListener('mouseup', (e) => this.handleDragEnd(e), { passive: false });
        document.addEventListener('touchmove', (e) => {
            this.handleDragMove(e);
            if (this.dragging) {
                e.preventDefault();
            }
        }, { passive: false });
        document.addEventListener('touchend', (e) => this.handleDragEnd(e), { passive: false });
        
        // Prevent wheel scrolling during drag
        document.addEventListener('wheel', preventScroll, { passive: false });
    }
    
    render() {
        // Ensure scale fits before drawing
        this.updateScale();
        // Render stock
        const stockEl = document.getElementById('solitaire-stock');
        stockEl.innerHTML = '';
        stockEl.onclick = () => this.flipStock();
        stockEl.style.cursor = this.stock.length > 0 || this.waste.length > 0 ? 'pointer' : 'default';
        
        if (this.stock.length > 0) {
            // Show visual stack of remaining stock cards
            const stockVisual = document.createElement('div');
            stockVisual.className = 'stock-visual';
            
            // Show up to 5 cards in the stack
            const cardsToShow = Math.min(5, this.stock.length);
            for (let i = 0; i < cardsToShow; i++) {
                const cardEl = document.createElement('div');
                cardEl.className = 'stock-card';
                cardEl.innerHTML = '🃏';
                cardEl.style.left = `${i * 1}px`;
                cardEl.style.top = `${i * 1}px`;
                cardEl.style.zIndex = i;
                cardEl.style.opacity = 1 - (i * 0.1);
                stockVisual.appendChild(cardEl);
            }
            
            stockEl.appendChild(stockVisual);
        } else if (this.waste.length > 0) {
            // Show empty stock when only waste remains
            const emptyStock = document.createElement('div');
            emptyStock.className = 'stock-card';
            emptyStock.innerHTML = '';
            emptyStock.style.background = 'rgba(255,255,255,0.1)';
            emptyStock.style.border = '2px dashed rgba(255,255,255,0.3)';
            stockEl.appendChild(emptyStock);
        }
        
        // Render waste - show only the last 3 cards (current draw)
        const wasteEl = document.getElementById('solitaire-waste');
        wasteEl.innerHTML = '';
        if (this.waste.length > 0) {
            // Show only the last 3 cards (the current draw)
            const cardsToShow = Math.min(3, this.waste.length);
            const startIndex = Math.max(0, this.waste.length - cardsToShow);
            
            for (let i = startIndex; i < this.waste.length; i++) {
                const card = this.waste[i];
                const cardEl = this.createCardElement(card, 'waste', i);
                
                // Only the topmost card (last in array) is interactive
                if (i < this.waste.length - 1) {
                    cardEl.style.pointerEvents = 'none';
                    cardEl.style.cursor = 'default';
                }
                
                // Stack cards visually with small horizontal offset only
                const stackIndex = i - startIndex; // 0..2
                const offset = stackIndex * 6; // tighter stack
                cardEl.style.left = `${offset}px`;
                cardEl.style.top = `0px`;
                cardEl.style.zIndex = 100 + stackIndex;
                // Fixed opacities so waste doesn't get more transparent over time
                const opacities = [0.8, 0.9, 1.0];
                cardEl.style.opacity = opacities[stackIndex] ?? 1;
                
                wasteEl.appendChild(cardEl);
            }
        }
        
        // Render foundations
        for (let i = 0; i < 4; i++) {
            const foundationEl = document.getElementById(`foundation-${i}`);
            foundationEl.innerHTML = '';
            foundationEl.className = 'foundation-pile';
            foundationEl.onclick = () => {
                if (!this.dragging && this.selectedCard) {
                    if (this.foundations[i].length === 0 && this.selectedCard.card.value === 0) {
                        this.moveCardTo(this.selectedCard.card, this.selectedCard.source, this.selectedCard.index, 'foundation', i);
                    } else if (this.canPlaceOnFoundation(this.selectedCard.card, i)) {
                        this.moveCardTo(this.selectedCard.card, this.selectedCard.source, this.selectedCard.index, 'foundation', i);
                    }
                }
            };
            foundationEl.ondragover = (e) => {
                e.preventDefault();
                if (this.dragging) {
                    foundationEl.classList.add('drag-over');
                }
            };
            foundationEl.ondragleave = () => {
                foundationEl.classList.remove('drag-over');
            };
            foundationEl.ondrop = (e) => {
                e.preventDefault();
                foundationEl.classList.remove('drag-over');
                if (this.dragging) {
                    const { card, source, index } = this.dragging;
                    if (this.foundations[i].length === 0 && card.value === 0) {
                        this.moveCardTo(card, source, index, 'foundation', i);
                    } else if (this.canPlaceOnFoundation(card, i)) {
                        this.moveCardTo(card, source, index, 'foundation', i);
                    }
                    this.dragging = null;
                    this.render();
                }
            };
            
            if (this.foundations[i].length > 0) {
                // Show visual stack of foundation cards
                const cardsToShow = Math.min(3, this.foundations[i].length);
                const startIndex = Math.max(0, this.foundations[i].length - cardsToShow);
                
                for (let j = startIndex; j < this.foundations[i].length; j++) {
                    const card = this.foundations[i][j];
                    const cardEl = this.createCardElement(card, 'foundation', i);
                    
                    // Only top card is interactive
                    if (j < this.foundations[i].length - 1) {
                        cardEl.style.pointerEvents = 'none';
                        cardEl.style.cursor = 'default';
                    }
                    
                    // Stack top 3 with tiny offset; keep opacity solid
                    const stackIndex = j - startIndex; // 0..2
                    const offset = stackIndex * 4;
                    cardEl.style.left = `${offset}px`;
                    cardEl.style.top = `0px`;
                    cardEl.style.zIndex = 100 + stackIndex;
                    cardEl.style.opacity = 1;
                    
                    foundationEl.appendChild(cardEl);
                }
            }
        }
        
        // Render tableau
        const tableauEl = document.getElementById('solitaire-tableau');
        tableauEl.innerHTML = '';
        // Dynamically compute vertical offsets so piles fit in the available height
        const tableauArea = document.getElementById('solitaire-tableau');
        const availableHeight = tableauArea ? tableauArea.clientHeight : 300;
        const board = document.querySelector('.solitaire-board');
        const cardHeight = board ? parseInt(getComputedStyle(board).getPropertyValue('--card-h')) || 108 : 108;
        for (let col = 0; col < 7; col++) {
            const pileEl = document.createElement('div');
            pileEl.className = 'tableau-pile';
            pileEl.id = `tableau-${col}`;
            
            if (this.tableau[col].length === 0) {
                pileEl.classList.add('drop-zone');
            } else {
                pileEl.classList.remove('drop-zone');
            }
            
            pileEl.onclick = (e) => {
                // Click on empty pile area
                if (e.target === pileEl && !this.dragging && this.selectedCard) {
                    if (this.tableau[col].length === 0 && this.selectedCard.card.value === 12) {
                        this.moveCardTo(this.selectedCard.card, this.selectedCard.source, this.selectedCard.index, 'tableau', col);
                    } else if (this.tableau[col].length > 0) {
                        if (this.canPlaceOnTableau(this.selectedCard.card, col)) {
                            this.moveCardTo(this.selectedCard.card, this.selectedCard.source, this.selectedCard.index, 'tableau', col);
                        }
                    }
                }
            };
            pileEl.ondragover = (e) => {
                e.preventDefault();
                if (this.dragging) {
                    pileEl.classList.add('drag-over');
                }
            };
            pileEl.ondragleave = () => {
                pileEl.classList.remove('drag-over');
            };
            pileEl.ondrop = (e) => {
                e.preventDefault();
                pileEl.classList.remove('drag-over');
                if (this.dragging) {
                    const { card, source, index } = this.dragging;
                    if (this.tableau[col].length === 0 && card.value === 12) {
                        this.moveCardTo(card, source, index, 'tableau', col);
                    } else if (this.canPlaceOnTableau(card, col)) {
                        this.moveCardTo(card, source, index, 'tableau', col);
                    }
                    this.dragging = null;
                    this.render();
                }
            };
            
            const pileLength = this.tableau[col].length;
            const maxSteps = Math.max(1, pileLength - 1);
            // compute a per-pile step so the last card is always fully visible
            // Slightly increase spacing for cleaner stacks, especially over face-down runs
            const step = Math.max(8, Math.min(20, Math.floor((availableHeight - cardHeight) / maxSteps)));
            const faceDownStep = Math.max(6, Math.floor(step * 0.7));

            this.tableau[col].forEach((card, cardIndex) => {
                const cardEl = this.createCardElement(card, 'tableau', col);
                
                // Stack all cards with dynamic offset so they fit the column height
                const offset = card.faceUp ? cardIndex * step : cardIndex * faceDownStep;
                cardEl.style.top = `${offset}px`;
                cardEl.style.zIndex = cardIndex;
                
                if (!card.faceUp) {
                    cardEl.style.opacity = '0.9';
                    // Slightly smaller for face-down cards to clarify layering
                    cardEl.style.transform = 'scale(0.98)';
                }
                
                pileEl.appendChild(cardEl);
            });
            
            // No counter needed - cards are visually stacked
            
            tableauEl.appendChild(pileEl);
        }
    }
    
    createCardElement(card, source, index) {
        const cardEl = document.createElement('div');
        cardEl.className = `solitaire-card ${card.color}`;
        cardEl.setAttribute('data-card-id', `${card.suit}-${card.value}`);
        
        if (!card.faceUp) {
            cardEl.classList.add('face-down');
            cardEl.innerHTML = '🃏';
        } else {
            cardEl.innerHTML = `
                <div class="card-value">${this.values[card.value]}</div>
                <div class="card-suit">${this.suits[card.suit]}</div>
                <div class="card-value-bottom">${this.values[card.value]}</div>
            `;
        }
        
        const isSelected = this.selectedCard && 
                          this.selectedCard.card === card && 
                          this.selectedCard.source === source && 
                          this.selectedCard.index === index;
        
        if (isSelected) {
            cardEl.classList.add('selected');
            this.selectedCard.element = cardEl;
        }
        
        // Drag & Drop functionality
        if (card.faceUp) {
            const startDrag = (e) => {
                // Only allow dragging if this is the topmost card in waste
                if (source === 'waste' && index !== this.waste.length - 1) {
                    return; // Cannot drag non-top cards from waste
                }
                
                e.preventDefault();
                e.stopPropagation();
                
                const clientX = e.touches ? e.touches[0].clientX : e.clientX;
                const clientY = e.touches ? e.touches[0].clientY : e.clientY;
                
                const rect = cardEl.getBoundingClientRect();
                // Calculate offset from mouse to where it clicked on the card
                this.dragOffset.x = clientX - rect.left;
                this.dragOffset.y = clientY - rect.top;
                
                // Get sequence of cards to move if from tableau
                if (source === 'tableau') {
                    const pile = this.tableau[index];
                    const cardIndex = pile.indexOf(card);
                    if (cardIndex !== -1) {
                        this.dragSequence = pile.slice(cardIndex);
                        // Verify sequence is valid
                        for (let i = 1; i < this.dragSequence.length; i++) {
                            if (!this.dragSequence[i].faceUp || 
                                this.dragSequence[i-1].color === this.dragSequence[i].color ||
                                this.dragSequence[i-1].value !== this.dragSequence[i].value + 1) {
                                this.dragSequence = [card];
                                break;
                            }
                        }
                    } else {
                        this.dragSequence = [card];
                    }
                } else {
                    this.dragSequence = [card];
                }
                
                this.dragging = { card, source, index };
                // Build a ghost stack for dragging sequences
                const seq = this.dragSequence && this.dragSequence.length ? this.dragSequence : [card];
                const ghost = document.createElement('div');
                ghost.className = 'drag-ghost';
                ghost.style.position = 'fixed';
                ghost.style.pointerEvents = 'none';
                ghost.style.zIndex = '10000';
                ghost.style.transition = 'none';
                // create shallow visual clones
                seq.forEach((sc, i) => {
                    const clone = document.createElement('div');
                    clone.className = `solitaire-card ${sc.color}`;
                    clone.style.position = 'absolute';
                    clone.style.left = '0px';
                    clone.style.top = `${i * 18}px`;
                    clone.style.width = getComputedStyle(cardEl).width;
                    clone.style.height = getComputedStyle(cardEl).height;
                    clone.innerHTML = `
                        <div class="card-value">${this.values[sc.value]}</div>
                        <div class="card-suit">${this.suits[sc.suit]}</div>
                        <div class="card-value-bottom">${this.values[sc.value]}</div>
                    `;
                    ghost.appendChild(clone);
                });
                document.body.appendChild(ghost);
                this.dragGhostEl = ghost;
                // Hide originals while dragging
                const hideOriginal = (c) => {
                    const el = document.querySelector(`[data-card-id="${c.suit}-${c.value}"]`);
                    if (el) el.style.visibility = 'hidden';
                };
                seq.forEach(hideOriginal);
                // initial position
                ghost.style.left = `${clientX - this.dragOffset.x}px`;
                ghost.style.top = `${clientY - this.dragOffset.y}px`;
            };
            
            cardEl.onmousedown = startDrag;
            cardEl.ontouchstart = startDrag;
        }
        
        // Use closure to store click timer per card element
        let clickTimer = null;
        cardEl.onclick = (e) => {
            // Only allow clicking if this is the topmost card in waste
            if (source === 'waste' && index !== this.waste.length - 1) {
                return; // Cannot click non-top cards from waste
            }
            
            if (this.dragging) {
                e.stopPropagation();
                return;
            }
            e.stopPropagation();
            
            if (!card.faceUp && source === 'tableau') {
                // Flip card
                card.faceUp = true;
                this.render();
                return;
            }
            
            if (!card.faceUp) return;
            
            // Check for double-click (auto-move to foundation)
            if (clickTimer === null) {
                clickTimer = setTimeout(() => {
                    clickTimer = null;
                    // Single click logic
                    if (this.selectedCard) {
                        // We have a selected card, try to move
                        const targetCard = card;
                        const targetSource = source;
                        const targetIndex = index;
                        
                        // Check if clicking on same card (deselect)
                        if (this.selectedCard.card === targetCard && 
                            this.selectedCard.source === targetSource &&
                            this.selectedCard.index === targetIndex) {
                            this.selectedCard = null;
                            this.selectedSource = null;
                            this.render();
                            return;
                        }
                        
                        // Try to move selected card to this location
                        if (targetSource === 'foundation') {
                            if (this.canPlaceOnFoundation(this.selectedCard.card, targetIndex)) {
                                this.moveCardTo(this.selectedCard.card, this.selectedCard.source, this.selectedCard.index, 'foundation', targetIndex);
                                return;
                            }
                        } else if (targetSource === 'tableau') {
                            if (this.canPlaceOnTableau(this.selectedCard.card, targetIndex)) {
                                this.moveCardTo(this.selectedCard.card, this.selectedCard.source, this.selectedCard.index, 'tableau', targetIndex);
                                return;
                            }
                        }
                        
                        // Can't move here, select new card instead
                        this.selectCard(targetCard, targetSource, targetIndex);
                    } else {
                        // No card selected, select this one
                        this.selectCard(card, source, index);
                    }
                }, 250);
            } else {
                // Double-click detected
                clearTimeout(clickTimer);
                clickTimer = null;
                
                // Try to auto-move to foundation
                for (let i = 0; i < 4; i++) {
                    if (this.canPlaceOnFoundation(card, i)) {
                        this.moveCardTo(card, source, index, 'foundation', i);
                        return;
                    }
                }
                
                // If can't move to foundation, just select
                this.selectCard(card, source, index);
            }
        };
        
        return cardEl;
    }
    
    handleDragMove(e) {
        if (!this.dragging) return;
        
        const ghost = this.dragGhostEl;
        if (!ghost) return;
        
        e.preventDefault();
        e.stopPropagation();
        
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        
        // Position card to follow mouse precisely
        const newLeft = clientX - this.dragOffset.x;
        const newTop = clientY - this.dragOffset.y;
        ghost.style.left = `${newLeft}px`;
        ghost.style.top = `${newTop}px`;
        
        // Use pointer coordinates for hit-testing to improve accuracy on tall ghost stacks
        const target = this.findDropTargetFromPoint(clientX, clientY);
        // Remove previous hover states
        document.querySelectorAll('.drag-over').forEach(el => el.classList.remove('drag-over'));
        this.clearTargetHighlight();
        if (target) {
            if (target.classList.contains('foundation-pile')) {
                // highlight empty foundation slot; if not empty, highlight its top card instead
                if (this.isFoundationEmpty(target)) {
                    target.classList.add('drag-over');
                } else {
                    const top = this.getTopCardElement(target);
                    if (top) { top.classList.add('target-card-hover'); this.currentHoverEl = top; }
                }
            } else if (target.classList.contains('tableau-pile')) {
                const topCard = this.getTopCardElement(target);
                if (topCard) { topCard.classList.add('target-card-hover'); this.currentHoverEl = topCard; }
                else { target.classList.add('drag-over'); }
            }
        }
    }
    
    handleDragEnd(e) {
        if (!this.dragging) return;
        
        const ghost = this.dragGhostEl;
        if (!ghost) {
            this.dragging = null;
            return;
        }
        
        e.preventDefault();
        e.stopPropagation();
        
        const clientX = e.changedTouches ? e.changedTouches[0].clientX : e.clientX;
        const clientY = e.changedTouches ? e.changedTouches[0].clientY : e.clientY;
        
        // Use pointer coordinates for drop detection (more intuitive than ghost center)
        let dropZone = null;
        let targetSource = null;
        let targetIndex = null;
        const targetEl = this.findDropTargetFromPoint(clientX, clientY);
        if (targetEl) {
            if (targetEl.id && targetEl.id.startsWith('foundation-')) {
                dropZone = targetEl;
                targetSource = 'foundation';
                targetIndex = parseInt(targetEl.id.split('-')[1]);
            } else if (targetEl.id && targetEl.id.startsWith('tableau-')) {
                dropZone = targetEl;
                targetSource = 'tableau';
                targetIndex = parseInt(targetEl.id.split('-')[1]);
            }
            if (dropZone) {
                if (targetSource === 'tableau') {
                    const topCard = this.getTopCardElement(dropZone);
                    if (topCard) this.flashCard(topCard); else this.flashPile(dropZone);
                } else if (targetSource === 'foundation') {
                    if (this.isFoundationEmpty(dropZone)) this.flashPile(dropZone);
                    else {
                        const top = this.getTopCardElement(dropZone);
                        if (top) this.flashCard(top); else this.flashPile(dropZone);
                    }
                }
            }
        }
        
        // Remove all drag-over classes
        document.querySelectorAll('.drag-over').forEach(el => el.classList.remove('drag-over'));
        
        // Remove ghost and restore originals
        if (this.dragGhostEl && this.dragGhostEl.parentNode) this.dragGhostEl.parentNode.removeChild(this.dragGhostEl);
        this.dragGhostEl = null;
        const seq = this.dragSequence && this.dragSequence.length ? this.dragSequence : [this.dragging.card];
        seq.forEach((c) => {
            const el = document.querySelector(`[data-card-id="${c.suit}-${c.value}"]`);
            if (el) el.style.visibility = '';
        });
        
        const { card, source, index } = this.dragging;
        this.dragging = null;
        
        // Try to place card
        if (dropZone && targetSource !== null && targetIndex !== null) {
            if (targetSource === 'foundation') {
                if (this.foundations[targetIndex].length === 0 && card.value === 0) {
                    this.moveCardTo(card, source, index, 'foundation', targetIndex);
                    return;
                } else if (this.canPlaceOnFoundation(card, targetIndex)) {
                    this.moveCardTo(card, source, index, 'foundation', targetIndex);
                    return;
                }
            } else if (targetSource === 'tableau') {
                if (this.tableau[targetIndex].length === 0 && card.value === 12) {
                    this.moveCardTo(card, source, index, 'tableau', targetIndex);
                    return;
                } else if (this.canPlaceOnTableau(card, targetIndex)) {
                    this.moveCardTo(card, source, index, 'tableau', targetIndex);
                    return;
                }
            }
        }
        
        // If placement failed, re-render to restore card position
        this.render();
    }

    flashPile(el) {
        el.classList.remove('pile-flash');
        // restart animation
        void el.offsetWidth;
        el.classList.add('pile-flash');
        setTimeout(() => el.classList.remove('pile-flash'), 600);
    }

    flashCard(cardEl) {
        cardEl.classList.remove('card-flash');
        void cardEl.offsetWidth;
        cardEl.classList.add('card-flash');
        setTimeout(() => cardEl.classList.remove('card-flash'), 600);
    }

    clearTargetHighlight() {
        if (this.currentHoverEl) {
            this.currentHoverEl.classList.remove('target-card-hover');
            this.currentHoverEl = null;
        }
    }

    isFoundationEmpty(fEl) {
        const idx = parseInt(fEl.id.split('-')[1]);
        return this.foundations[idx] && this.foundations[idx].length === 0;
    }

    getTopCardElement(pileEl) {
        // Find the last rendered card inside this pile
        const cards = pileEl.querySelectorAll('.solitaire-card');
        return cards.length ? cards[cards.length - 1] : null;
    }

    findDropTargetFromPoint(x, y) {
        // First try direct hit
        let el = document.elementFromPoint(x, y);
        if (el) {
            const dz = el.closest('.foundation-pile[id^="foundation-"], .tableau-pile[id^="tableau-"]');
            if (dz) return dz;
        }
        // Expand search: allow small tolerance around piles for easier drops
        const expand = 14; // px tolerance
        const candidates = [
            ...document.querySelectorAll('.foundation-pile[id^="foundation-"]'),
            ...document.querySelectorAll('.tableau-pile[id^="tableau-"]')
        ];
        for (const c of candidates) {
            const r = c.getBoundingClientRect();
            if (x >= r.left - expand && x <= r.right + expand && y >= r.top - expand && y <= r.bottom + expand) {
                return c;
            }
        }
        return null;
    }
    
    startTimer() {
        this.gameStartTime = Date.now();
        this.gameTimer = setInterval(() => {
            this.updateTimer();
        }, 1000);
    }
    
    updateTimer() {
        if (!this.gameStartTime) return;
        
        const elapsed = Math.floor((Date.now() - this.gameStartTime) / 1000);
        const minutes = Math.floor(elapsed / 60);
        const seconds = elapsed % 60;
        
        const timerElement = document.getElementById('game-timer');
        if (timerElement) {
            timerElement.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        }
    }
    
    incrementMoveCount() {
        this.moveCount++;
        const moveCountElement = document.getElementById('move-count');
        if (moveCountElement) {
            moveCountElement.textContent = this.moveCount;
        }
    }
    
    reset() {
        this.deck = [];
        this.stock = [];
        this.waste = [];
        this.foundations = [[], [], [], []];
        this.tableau = [[], [], [], [], [], [], []];
        this.selectedCard = null;
        this.selectedSource = null;
        this.dragging = null;
        this.dragSequence = [];
        this.moveCount = 0;
        this.gameStartTime = null;
        
        if (this.gameTimer) {
            clearInterval(this.gameTimer);
            this.gameTimer = null;
        }
        
        this.createDeck();
        this.shuffleDeck();
        this.deal();
        this.render();
        this.startTimer();
        displayHighScores('scores-list', 'solitaire', 30).catch(()=>{});
        const statusEl = document.getElementById('solitaire-status');
        if (statusEl) statusEl.textContent = '';
    }
}
