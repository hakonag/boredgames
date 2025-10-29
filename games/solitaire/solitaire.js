// Solitaire (Kabal) Game Module

let solitaireGame = null;

export function init() {
    const gameContent = document.getElementById('game-content');
    gameContent.innerHTML = `
        <button class="back-button-tetris" onclick="window.goHome()">← Tilbake</button>
        <h2>🃏 Kabal</h2>
        <div class="solitaire-game">
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
            <div class="solitaire-controls">
                <button onclick="window.resetSolitaire()">Nytt spill</button>
                <p id="solitaire-status"></p>
            </div>
        </div>
    `;
    
    // Remove scroll lock from Tetris if active
    if (window.tetrisScrollPrevent) {
        window.removeEventListener('wheel', window.tetrisScrollPrevent.wheel);
        window.removeEventListener('touchmove', window.tetrisScrollPrevent.touchmove);
        window.tetrisScrollPrevent = null;
    }
    document.body.style.overflow = '';
    document.body.style.position = '';
    document.body.style.width = '';
    document.body.style.height = '';
    document.documentElement.style.overflow = '';
    
    const style = document.createElement('style');
    style.id = 'game-specific-styles';
    style.textContent = `
        .solitaire-game {
            max-width: 1000px;
            margin: 0 auto;
            padding: 20px;
        }
        .solitaire-board {
            background: #0d7a3d;
            border-radius: 15px;
            padding: 20px;
            min-height: 600px;
        }
        .solitaire-top-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 30px;
        }
        .stock-area {
            display: flex;
            gap: 10px;
        }
        .foundation-area {
            display: flex;
            gap: 10px;
        }
        .stock-pile, .waste-pile, .foundation-pile, .tableau-pile {
            width: 80px;
            height: 112px;
            border: 2px solid rgba(255,255,255,0.3);
            border-radius: 8px;
            position: relative;
            cursor: pointer;
        }
        .foundation-pile {
            border: 2px dashed rgba(255,255,255,0.5);
            background: rgba(255,255,255,0.1);
        }
        .tableau-pile {
            width: 80px;
            min-height: 112px;
            border: none;
            margin-right: 10px;
        }
        .solitaire-card {
            width: 76px;
            height: 108px;
            background: white;
            border: 2px solid #333;
            border-radius: 6px;
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
        }
        .solitaire-card:active {
            cursor: grabbing;
        }
        .solitaire-card.dragging {
            opacity: 0.8;
            transform: rotate(2deg);
            z-index: 10000;
            cursor: grabbing;
        }
        .solitaire-card.selected {
            border: 3px solid #ffd700;
            box-shadow: 0 0 15px rgba(255,215,0,0.8);
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
            border-radius: 10px;
            font-size: 0.75rem;
            white-space: nowrap;
        }
        .stock-pile, .waste-pile {
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 2rem;
            position: relative;
        }
        .card-stack {
            position: relative;
            width: 76px;
            height: 108px;
        }
        .card-stack .stacked-card {
            position: absolute;
            width: 76px;
            height: 108px;
            border: 1px solid rgba(0,0,0,0.2);
            border-radius: 6px;
            background: rgba(255,255,255,0.95);
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .card-stack-indicator {
            position: absolute;
            width: 76px;
            height: 108px;
            border: 2px dashed rgba(255,255,255,0.3);
            border-radius: 6px;
            pointer-events: none;
        }
        .solitaire-card.face-down {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
        }
        .solitaire-card.red {
            color: #d32f2f;
        }
        .solitaire-card.black {
            color: #212121;
        }
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
            display: flex;
            gap: 10px;
            flex-wrap: wrap;
        }
        .tableau-pile {
            position: relative;
            margin-bottom: 30px;
        }
        .drop-zone {
            border: 2px dashed rgba(255,255,255,0.5);
            background: rgba(255,255,255,0.1);
        }
        .drop-zone.drag-over {
            border-color: #ffd700;
            background: rgba(255,215,0,0.2);
        }
        .solitaire-controls {
            text-align: center;
            margin-top: 20px;
        }
        .solitaire-controls button {
            background: #667eea;
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 8px;
            font-size: 1rem;
            cursor: pointer;
        }
        .solitaire-controls button:hover {
            background: #5568d3;
        }
        #solitaire-status {
            margin-top: 10px;
            color: #333;
        }
    `;
    document.head.appendChild(style);
    
    solitaireGame = new SolitaireGame();
    window.solitaireGame = solitaireGame;
    window.resetSolitaire = resetSolitaire;
}

export function cleanup() {
    solitaireGame = null;
    window.resetSolitaire = null;
}

function resetSolitaire() {
    if (solitaireGame) {
        solitaireGame.reset();
    }
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
        
        this.createDeck();
        this.shuffleDeck();
        this.deal();
        this.render();
        this.setupDragAndDrop();
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
            // Draw three cards at a time
            const cardsToDraw = Math.min(3, this.stock.length);
            for (let i = 0; i < cardsToDraw; i++) {
                const card = this.stock.pop();
                card.faceUp = true;
                this.waste.push(card);
            }
        }
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
        }
    }
    
    setupDragAndDrop() {
        document.addEventListener('mousemove', (e) => this.handleDragMove(e));
        document.addEventListener('mouseup', (e) => this.handleDragEnd(e));
        document.addEventListener('touchmove', (e) => this.handleDragMove(e), { passive: false });
        document.addEventListener('touchend', (e) => this.handleDragEnd(e));
    }
    
    render() {
        // Render stock
        const stockEl = document.getElementById('solitaire-stock');
        stockEl.innerHTML = '';
        stockEl.onclick = () => this.flipStock();
        stockEl.style.cursor = this.stock.length > 0 || this.waste.length > 0 ? 'pointer' : 'default';
        
        if (this.stock.length > 0 || this.waste.length > 0) {
            const stackCount = this.stock.length + this.waste.length;
            stockEl.innerHTML = `
                <div style="display: flex; align-items: center; justify-content: center; width: 80px; height: 112px;">
                    ${this.stock.length > 0 ? '🃏' : ''}
                </div>
                <span class="pile-counter">${stackCount}</span>
            `;
            stockEl.style.display = 'flex';
            stockEl.style.alignItems = 'center';
            stockEl.style.justifyContent = 'center';
            stockEl.style.fontSize = '2rem';
            stockEl.style.position = 'relative';
        }
        
        // Render waste - show last 3 cards, but only top card is playable
        const wasteEl = document.getElementById('solitaire-waste');
        wasteEl.innerHTML = '';
        if (this.waste.length > 0) {
            // Show the last 3 cards (or all if less than 3)
            const cardsToShow = Math.min(3, this.waste.length);
            const startIndex = Math.max(0, this.waste.length - cardsToShow);
            
            for (let i = startIndex; i < this.waste.length; i++) {
                const card = this.waste[i];
                const cardEl = this.createCardElement(card, 'waste', i);
                
                // Only the topmost card (last in array) is interactive
                if (i < this.waste.length - 1) {
                    cardEl.style.pointerEvents = 'none';
                    cardEl.style.opacity = '0.8';
                    cardEl.style.cursor = 'default';
                }
                
                // Stack cards visually with slight offset
                const offset = (this.waste.length - 1 - i) * 3;
                cardEl.style.left = `${offset}px`;
                cardEl.style.zIndex = i;
                
                wasteEl.appendChild(cardEl);
            }
            
            if (this.waste.length > 3) {
                const counter = document.createElement('span');
                counter.className = 'pile-counter';
                counter.textContent = this.waste.length;
                wasteEl.appendChild(counter);
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
                const card = this.foundations[i][this.foundations[i].length - 1];
                const cardEl = this.createCardElement(card, 'foundation', i);
                foundationEl.appendChild(cardEl);
                
                if (this.foundations[i].length > 1) {
                    const counter = document.createElement('span');
                    counter.className = 'pile-counter';
                    counter.textContent = this.foundations[i].length;
                    foundationEl.appendChild(counter);
                }
            }
        }
        
        // Render tableau
        const tableauEl = document.getElementById('solitaire-tableau');
        tableauEl.innerHTML = '';
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
            
            this.tableau[col].forEach((card, cardIndex) => {
                const cardEl = this.createCardElement(card, 'tableau', col);
                const offset = card.faceUp ? cardIndex * 25 : 0;
                cardEl.style.top = `${offset}px`;
                cardEl.style.zIndex = cardIndex;
                if (!card.faceUp) {
                    cardEl.style.opacity = '0.7';
                }
                pileEl.appendChild(cardEl);
            });
            
            // Show count if pile has many cards
            if (this.tableau[col].length > 5) {
                const counter = document.createElement('span');
                counter.className = 'pile-counter';
                counter.textContent = `${this.tableau[col].length} kort`;
                counter.style.bottom = '-25px';
                pileEl.appendChild(counter);
            }
            
            tableauEl.appendChild(pileEl);
        }
    }
    
    createCardElement(card, source, index) {
        const cardEl = document.createElement('div');
        cardEl.className = `solitaire-card ${card.color}`;
        
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
                this.dragOffset.x = clientX - rect.left - rect.width / 2;
                this.dragOffset.y = clientY - rect.top - rect.height / 2;
                
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
                cardEl.classList.add('dragging');
                cardEl.style.position = 'fixed';
                cardEl.style.pointerEvents = 'none';
                
                // Update position immediately
                this.handleDragMove(e);
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
        
        const cardEl = document.querySelector('.solitaire-card.dragging');
        if (!cardEl) return;
        
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        
        cardEl.style.left = `${clientX - this.dragOffset.x}px`;
        cardEl.style.top = `${clientY - this.dragOffset.y}px`;
        
        // Check which drop zone we're over
        const elementBelow = document.elementFromPoint(clientX, clientY);
        if (elementBelow) {
            const dropZone = elementBelow.closest('.foundation-pile, .tableau-pile');
            if (dropZone) {
                dropZone.classList.add('drag-over');
            }
        }
        
        // Remove drag-over from other elements
        document.querySelectorAll('.drag-over').forEach(el => {
            if (el !== elementBelow?.closest('.foundation-pile, .tableau-pile')) {
                el.classList.remove('drag-over');
            }
        });
    }
    
    handleDragEnd(e) {
        if (!this.dragging) return;
        
        const cardEl = document.querySelector('.solitaire-card.dragging');
        if (!cardEl) {
            this.dragging = null;
            return;
        }
        
        const clientX = e.changedTouches ? e.changedTouches[0].clientX : e.clientX;
        const clientY = e.changedTouches ? e.changedTouches[0].clientY : e.clientY;
        
        const elementBelow = document.elementFromPoint(clientX, clientY);
        let dropZone = null;
        let targetSource = null;
        let targetIndex = null;
        
        if (elementBelow) {
            const foundationEl = elementBelow.closest('.foundation-pile[id^="foundation-"]');
            const tableauEl = elementBelow.closest('.tableau-pile[id^="tableau-"]');
            
            if (foundationEl) {
                dropZone = foundationEl;
                targetSource = 'foundation';
                targetIndex = parseInt(foundationEl.id.split('-')[1]);
            } else if (tableauEl) {
                dropZone = tableauEl;
                targetSource = 'tableau';
                targetIndex = parseInt(tableauEl.id.split('-')[1]);
            }
        }
        
        // Remove all drag-over classes
        document.querySelectorAll('.drag-over').forEach(el => el.classList.remove('drag-over'));
        
        // Remove dragging class and restore card
        cardEl.classList.remove('dragging');
        cardEl.style.position = '';
        cardEl.style.left = '';
        cardEl.style.top = '';
        cardEl.style.pointerEvents = '';
        cardEl.style.transform = '';
        
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
        
        this.createDeck();
        this.shuffleDeck();
        this.deal();
        this.render();
        document.getElementById('solitaire-status').textContent = '';
    }
}
