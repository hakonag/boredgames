// Game navigation
document.addEventListener('DOMContentLoaded', () => {
    const gameCards = document.querySelectorAll('.game-card');
    
    gameCards.forEach(card => {
        card.addEventListener('click', () => {
            const gameType = card.getAttribute('data-game');
            loadGame(gameType);
        });
    });
});

function loadGame(gameType) {
    const container = document.querySelector('.container');
    const gameContainer = document.getElementById('game-container');
    const gameContent = document.getElementById('game-content');
    
    container.classList.add('hidden');
    gameContainer.classList.remove('hidden');
    
    // Clear previous game
    gameContent.innerHTML = '';
    
    // Remove any existing game styles
    const oldStyle = document.getElementById('game-specific-styles');
    if (oldStyle) oldStyle.remove();
    
    switch(gameType) {
        case 'solitaire':
            initSolitaire();
            break;
        case 'yatzy':
            initYatzy();
            break;
        case 'ludo':
            initLudo();
            break;
        case 'tetris':
            initTetris();
            break;
    }
}

function goHome() {
    const container = document.querySelector('.container');
    const gameContainer = document.getElementById('game-container');
    
    container.classList.remove('hidden');
    gameContainer.classList.add('hidden');
}

// ========== YATZY GAME ==========
let yatzyState = {
    dice: [1, 1, 1, 1, 1],
    locked: [false, false, false, false, false],
    rollsLeft: 3,
    scores: {},
    round: 1
};

const diceFaces = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];
const scoreCategories = [
    { name: 'Enere', key: 'ones', calculate: (dice) => countDice(dice, 1) },
    { name: 'Toere', key: 'twos', calculate: (dice) => countDice(dice, 2) * 2 },
    { name: 'Treere', key: 'threes', calculate: (dice) => countDice(dice, 3) * 3 },
    { name: 'Firere', key: 'fours', calculate: (dice) => countDice(dice, 4) * 4 },
    { name: 'Femere', key: 'fives', calculate: (dice) => countDice(dice, 5) * 5 },
    { name: 'Seksere', key: 'sixes', calculate: (dice) => countDice(dice, 6) * 6 },
    { name: 'Ett par', key: 'pair', calculate: (dice) => getPair(dice) },
    { name: 'To par', key: 'twoPairs', calculate: (dice) => getTwoPairs(dice) },
    { name: 'Tre like', key: 'threeKind', calculate: (dice) => getNOfAKind(dice, 3) },
    { name: 'Fire like', key: 'fourKind', calculate: (dice) => getNOfAKind(dice, 4) },
    { name: 'Liten straight', key: 'smallStraight', calculate: (dice) => hasStraight(dice, [1,2,3,4,5]) ? 15 : 0 },
    { name: 'Stor straight', key: 'largeStraight', calculate: (dice) => hasStraight(dice, [2,3,4,5,6]) ? 20 : 0 },
    { name: 'Hus', key: 'fullHouse', calculate: (dice) => getFullHouse(dice) },
    { name: 'Sjanse', key: 'chance', calculate: (dice) => dice.reduce((a, b) => a + b, 0) },
    { name: 'Yatzy', key: 'yatzy', calculate: (dice) => getNOfAKind(dice, 5) }
];

function countDice(dice, value) {
    return dice.filter(d => d === value).length;
}

function getPair(dice) {
    const counts = {};
    dice.forEach(d => counts[d] = (counts[d] || 0) + 1);
    for (let i = 6; i >= 1; i--) {
        if (counts[i] >= 2) return i * 2;
    }
    return 0;
}

function getTwoPairs(dice) {
    const counts = {};
    dice.forEach(d => counts[d] = (counts[d] || 0) + 1);
    const pairs = Object.keys(counts).filter(k => counts[k] >= 2).map(Number).sort((a, b) => b - a);
    if (pairs.length >= 2) return pairs[0] * 2 + pairs[1] * 2;
    return 0;
}

function getNOfAKind(dice, n) {
    const counts = {};
    dice.forEach(d => counts[d] = (counts[d] || 0) + 1);
    for (let i = 6; i >= 1; i--) {
        if (counts[i] >= n) return i * n;
    }
    return 0;
}

function hasStraight(dice, required) {
    const sorted = [...dice].sort();
    return required.every(r => sorted.includes(r));
}

function getFullHouse(dice) {
    const counts = {};
    dice.forEach(d => counts[d] = (counts[d] || 0) + 1);
    const values = Object.values(counts).sort();
    if (values.length === 2 && values[0] === 2 && values[1] === 3) {
        return dice.reduce((a, b) => a + b, 0);
    }
    return 0;
}

function initYatzy() {
    const gameContent = document.getElementById('game-content');
    gameContent.innerHTML = `
        <h2>🎲 Yatzy</h2>
        <div class="yatzy-game">
            <div class="yatzy-info">
                <p>Runde: <span id="yatzy-round">1</span> / 15</p>
                <p>Kast igjen: <span id="yatzy-rolls">3</span></p>
            </div>
            <div class="dice-container" id="yatzy-dice"></div>
            <button onclick="rollYatzyDice()" class="roll-button" id="yatzy-roll-btn">Kast terninger</button>
            <div class="score-sheet">
                <h3>Poengblokk</h3>
                <div id="yatzy-score-board"></div>
                <div class="yatzy-total">
                    <p>Totalt poeng: <span id="yatzy-total-score">0</span></p>
                </div>
            </div>
        </div>
    `;
    
    const style = document.createElement('style');
    style.id = 'game-specific-styles';
    style.textContent = `
        .yatzy-game {
            text-align: center;
        }
        .yatzy-info {
            display: flex;
            justify-content: space-around;
            margin: 20px 0;
            font-size: 1.1rem;
        }
        .dice-container {
            display: flex;
            gap: 15px;
            justify-content: center;
            margin: 30px 0;
            flex-wrap: wrap;
        }
        .dice {
            width: 70px;
            height: 70px;
            background: white;
            border: 3px solid #667eea;
            border-radius: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 3rem;
            cursor: pointer;
            transition: all 0.2s;
            user-select: none;
        }
        .dice:hover {
            transform: scale(1.1);
        }
        .dice.locked {
            background: #667eea;
            color: white;
            opacity: 0.7;
        }
        .roll-button {
            background: #667eea;
            color: white;
            border: none;
            padding: 15px 40px;
            border-radius: 8px;
            font-size: 1.2rem;
            cursor: pointer;
            margin: 20px 0;
            transition: background 0.3s;
        }
        .roll-button:hover:not(:disabled) {
            background: #5568d3;
        }
        .roll-button:disabled {
            background: #ccc;
            cursor: not-allowed;
        }
        .score-sheet {
            margin-top: 30px;
            text-align: left;
            max-width: 600px;
            margin-left: auto;
            margin-right: auto;
        }
        .score-row {
            display: flex;
            justify-content: space-between;
            padding: 10px;
            border-bottom: 1px solid #eee;
            cursor: pointer;
            transition: background 0.2s;
        }
        .score-row:hover {
            background: #f5f5f5;
        }
        .score-row.used {
            cursor: default;
            opacity: 0.6;
        }
        .score-row.used:hover {
            background: transparent;
        }
        .yatzy-total {
            margin-top: 20px;
            padding-top: 20px;
            border-top: 2px solid #667eea;
            font-size: 1.2rem;
            font-weight: bold;
        }
    `;
    document.head.appendChild(style);
    
    yatzyState = {
        dice: [1, 1, 1, 1, 1],
        locked: [false, false, false, false, false],
        rollsLeft: 3,
        scores: {},
        round: 1
    };
    
    renderYatzyDice();
    renderYatzyScores();
}

function renderYatzyDice() {
    const container = document.getElementById('yatzy-dice');
    container.innerHTML = '';
    
    yatzyState.dice.forEach((value, index) => {
        const dice = document.createElement('div');
        dice.className = `dice ${yatzyState.locked[index] ? 'locked' : ''}`;
        dice.textContent = diceFaces[value - 1];
        dice.onclick = () => toggleDiceLock(index);
        container.appendChild(dice);
    });
    
    const rollBtn = document.getElementById('yatzy-roll-btn');
    rollBtn.disabled = yatzyState.rollsLeft === 0;
    document.getElementById('yatzy-rolls').textContent = yatzyState.rollsLeft;
}

function toggleDiceLock(index) {
    if (yatzyState.rollsLeft === 3) return;
    yatzyState.locked[index] = !yatzyState.locked[index];
    renderYatzyDice();
}

function rollYatzyDice() {
    if (yatzyState.rollsLeft === 0) return;
    
    yatzyState.dice.forEach((_, index) => {
        if (!yatzyState.locked[index]) {
            yatzyState.dice[index] = Math.floor(Math.random() * 6) + 1;
        }
    });
    
    yatzyState.rollsLeft--;
    renderYatzyDice();
    renderYatzyScores();
}

function renderYatzyScores() {
    const board = document.getElementById('yatzy-score-board');
    board.innerHTML = '';
    
    scoreCategories.forEach(category => {
        const row = document.createElement('div');
        const score = category.calculate(yatzyState.dice);
        const used = yatzyState.scores.hasOwnProperty(category.key);
        
        row.className = `score-row ${used ? 'used' : ''}`;
        row.innerHTML = `
            <span>${category.name}</span>
            <span>${used ? yatzyState.scores[category.key] : (score > 0 ? score : '-')}</span>
        `;
        
        if (!used) {
            row.onclick = () => selectYatzyScore(category.key, score);
        }
        
        board.appendChild(row);
    });
    
    const total = Object.values(yatzyState.scores).reduce((a, b) => a + b, 0);
    document.getElementById('yatzy-total-score').textContent = total;
}

function selectYatzyScore(key, score) {
    if (yatzyState.rollsLeft === 3) return;
    
    yatzyState.scores[key] = score;
    yatzyState.round++;
    yatzyState.rollsLeft = 3;
    yatzyState.locked = [false, false, false, false, false];
    yatzyState.dice = [1, 1, 1, 1, 1];
    
    document.getElementById('yatzy-round').textContent = yatzyState.round;
    
    if (yatzyState.round > 15) {
        alert(`Spill ferdig! Totalt poeng: ${Object.values(yatzyState.scores).reduce((a, b) => a + b, 0)}`);
        initYatzy();
        return;
    }
    
    renderYatzyDice();
    renderYatzyScores();
}

// ========== TETRIS GAME ==========
let tetrisGame = null;

function initTetris() {
    const gameContent = document.getElementById('game-content');
    gameContent.innerHTML = `
        <h2>🔲 Tetris</h2>
        <div class="tetris-game">
            <div class="tetris-board">
                <canvas id="tetris-canvas" width="300" height="600"></canvas>
                <div class="tetris-info">
                    <p>Poeng: <span id="tetris-score">0</span></p>
                    <p>Linjer: <span id="tetris-lines">0</span></p>
                    <p>Nivå: <span id="tetris-level">1</span></p>
                </div>
            </div>
            <div class="tetris-controls">
                <h3>Kontroller</h3>
                <p>← → Flytt</p>
                <p>↑ Roter</p>
                <p>↓ Raskt fall</p>
                <p>Space Hard drop</p>
                <button onclick="startTetris()" id="tetris-start-btn">Start</button>
                <button onclick="pauseTetris()" id="tetris-pause-btn" style="display:none">Pause</button>
            </div>
        </div>
    `;
    
    const style = document.createElement('style');
    style.id = 'game-specific-styles';
    style.textContent = `
        .tetris-game {
            display: flex;
            gap: 30px;
            justify-content: center;
            align-items: flex-start;
            flex-wrap: wrap;
        }
        .tetris-board {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 20px;
        }
        #tetris-canvas {
            border: 3px solid #333;
            background: #000;
            display: block;
        }
        .tetris-info {
            text-align: center;
            font-size: 1.2rem;
        }
        .tetris-controls {
            padding: 20px;
            background: #f5f5f5;
            border-radius: 10px;
            min-width: 200px;
        }
        .tetris-controls h3 {
            margin-bottom: 15px;
        }
        .tetris-controls p {
            margin: 8px 0;
        }
        .tetris-controls button {
            background: #667eea;
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 8px;
            font-size: 1rem;
            cursor: pointer;
            margin-top: 15px;
            width: 100%;
        }
        .tetris-controls button:hover {
            background: #5568d3;
        }
    `;
    document.head.appendChild(style);
    
    tetrisGame = new TetrisGame();
}

class TetrisGame {
    constructor() {
        this.canvas = document.getElementById('tetris-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.grid = Array(20).fill().map(() => Array(10).fill(0));
        this.currentPiece = null;
        this.score = 0;
        this.lines = 0;
        this.level = 1;
        this.gameLoop = null;
        this.isPaused = false;
        this.fallTime = 0;
        this.fallInterval = 1000;
        
        this.pieces = [
            [[1,1,1,1]], // I
            [[1,1],[1,1]], // O
            [[0,1,0],[1,1,1]], // T
            [[1,1,0],[0,1,1]], // S
            [[0,1,1],[1,1,0]], // Z
            [[1,0,0],[1,1,1]], // L
            [[0,0,1],[1,1,1]]  // J
        ];
        
        this.setupControls();
        this.draw();
    }
    
    setupControls() {
        document.addEventListener('keydown', (e) => {
            if (this.isPaused || !this.currentPiece) return;
            
            switch(e.key) {
                case 'ArrowLeft':
                    this.movePiece(-1, 0);
                    break;
                case 'ArrowRight':
                    this.movePiece(1, 0);
                    break;
                case 'ArrowDown':
                    this.movePiece(0, 1);
                    break;
                case 'ArrowUp':
                    this.rotatePiece();
                    break;
                case ' ':
                    e.preventDefault();
                    this.hardDrop();
                    break;
            }
        });
    }
    
    start() {
        this.spawnPiece();
        this.gameLoop = setInterval(() => {
            if (!this.isPaused) {
                this.update();
                this.draw();
            }
        }, 16);
        
        document.getElementById('tetris-start-btn').style.display = 'none';
        document.getElementById('tetris-pause-btn').style.display = 'block';
    }
    
    pause() {
        this.isPaused = !this.isPaused;
        document.getElementById('tetris-pause-btn').textContent = this.isPaused ? 'Fortsett' : 'Pause';
    }
    
    spawnPiece() {
        const pieceType = this.pieces[Math.floor(Math.random() * this.pieces.length)];
        this.currentPiece = {
            shape: pieceType,
            x: 3,
            y: 0,
            color: `hsl(${Math.random() * 360}, 70%, 50%)`
        };
        
        if (this.checkCollision(this.currentPiece)) {
            clearInterval(this.gameLoop);
            alert(`Spill ferdig! Poeng: ${this.score}`);
            this.reset();
        }
    }
    
    movePiece(dx, dy) {
        const newPiece = {...this.currentPiece, x: this.currentPiece.x + dx, y: this.currentPiece.y + dy};
        if (!this.checkCollision(newPiece)) {
            this.currentPiece = newPiece;
        } else if (dy > 0) {
            this.placePiece();
        }
    }
    
    rotatePiece() {
        const rotated = this.currentPiece.shape[0].map((_, i) =>
            this.currentPiece.shape.map(row => row[i]).reverse()
        );
        const newPiece = {...this.currentPiece, shape: rotated};
        if (!this.checkCollision(newPiece)) {
            this.currentPiece = newPiece;
        }
    }
    
    hardDrop() {
        while (!this.checkCollision({...this.currentPiece, y: this.currentPiece.y + 1})) {
            this.currentPiece.y++;
        }
        this.placePiece();
    }
    
    checkCollision(piece) {
        for (let y = 0; y < piece.shape.length; y++) {
            for (let x = 0; x < piece.shape[y].length; x++) {
                if (piece.shape[y][x]) {
                    const nx = piece.x + x;
                    const ny = piece.y + y;
                    
                    if (nx < 0 || nx >= 10 || ny >= 20) return true;
                    if (ny >= 0 && this.grid[ny][nx]) return true;
                }
            }
        }
        return false;
    }
    
    placePiece() {
        for (let y = 0; y < this.currentPiece.shape.length; y++) {
            for (let x = 0; x < this.currentPiece.shape[y].length; x++) {
                if (this.currentPiece.shape[y][x]) {
                    const ny = this.currentPiece.y + y;
                    const nx = this.currentPiece.x + x;
                    if (ny >= 0) {
                        this.grid[ny][nx] = this.currentPiece.color;
                    }
                }
            }
        }
        
        this.clearLines();
        this.spawnPiece();
    }
    
    clearLines() {
        let linesCleared = 0;
        for (let y = this.grid.length - 1; y >= 0; y--) {
            if (this.grid[y].every(cell => cell !== 0)) {
                this.grid.splice(y, 1);
                this.grid.unshift(Array(10).fill(0));
                linesCleared++;
                y++;
            }
        }
        
        if (linesCleared > 0) {
            this.lines += linesCleared;
            this.score += linesCleared * 100 * this.level;
            this.level = Math.floor(this.lines / 10) + 1;
            this.fallInterval = Math.max(100, 1000 - (this.level - 1) * 100);
            
            document.getElementById('tetris-score').textContent = this.score;
            document.getElementById('tetris-lines').textContent = this.lines;
            document.getElementById('tetris-level').textContent = this.level;
        }
    }
    
    update() {
        this.fallTime += 16;
        if (this.fallTime >= this.fallInterval) {
            this.movePiece(0, 1);
            this.fallTime = 0;
        }
    }
    
    draw() {
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        const cellSize = 30;
        
        // Draw grid
        for (let y = 0; y < 20; y++) {
            for (let x = 0; x < 10; x++) {
                if (this.grid[y][x]) {
                    this.ctx.fillStyle = this.grid[y][x];
                    this.ctx.fillRect(x * cellSize, y * cellSize, cellSize - 1, cellSize - 1);
                }
            }
        }
        
        // Draw current piece
        if (this.currentPiece) {
            this.ctx.fillStyle = this.currentPiece.color;
            for (let y = 0; y < this.currentPiece.shape.length; y++) {
                for (let x = 0; x < this.currentPiece.shape[y].length; x++) {
                    if (this.currentPiece.shape[y][x]) {
                        const px = (this.currentPiece.x + x) * cellSize;
                        const py = (this.currentPiece.y + y) * cellSize;
                        if (py >= 0) {
                            this.ctx.fillRect(px, py, cellSize - 1, cellSize - 1);
                        }
                    }
                }
            }
        }
    }
    
    reset() {
        this.grid = Array(20).fill().map(() => Array(10).fill(0));
        this.score = 0;
        this.lines = 0;
        this.level = 1;
        this.fallTime = 0;
        this.fallInterval = 1000;
        document.getElementById('tetris-score').textContent = '0';
        document.getElementById('tetris-lines').textContent = '0';
        document.getElementById('tetris-level').textContent = '1';
        document.getElementById('tetris-start-btn').style.display = 'block';
        document.getElementById('tetris-pause-btn').style.display = 'none';
        clearInterval(this.gameLoop);
        this.draw();
    }
}

function startTetris() {
    if (tetrisGame) tetrisGame.start();
}

function pauseTetris() {
    if (tetrisGame) tetrisGame.pause();
}

// ========== SOLITAIRE GAME ==========
function initSolitaire() {
    const gameContent = document.getElementById('game-content');
    gameContent.innerHTML = `
        <h2>🃏 Kabal</h2>
        <div class="solitaire-game">
            <div class="solitaire-top">
                <div class="stock-pile" id="stock" onclick="clickStock()"></div>
                <div class="waste-pile" id="waste"></div>
                <div class="foundation-piles">
                    <div class="foundation" id="foundation-0"></div>
                    <div class="foundation" id="foundation-1"></div>
                    <div class="foundation" id="foundation-2"></div>
                    <div class="foundation" id="foundation-3"></div>
                </div>
            </div>
            <div class="tableau-piles" id="tableau"></div>
            <div class="solitaire-info">
                <button onclick="resetSolitaire()">Start på nytt</button>
                <p>Klikk på bunken for å ta kort</p>
            </div>
        </div>
    `;
    
    const style = document.createElement('style');
    style.id = 'game-specific-styles';
    style.textContent = `
        .solitaire-game {
            max-width: 900px;
            margin: 0 auto;
        }
        .solitaire-top {
            display: flex;
            gap: 10px;
            margin-bottom: 30px;
            justify-content: space-between;
        }
        .foundation-piles {
            display: flex;
            gap: 10px;
        }
        .foundation, .waste-pile, .stock-pile {
            width: 80px;
            height: 112px;
            border: 2px dashed #ccc;
            border-radius: 8px;
            display: flex;
            align-items: center;
            justify-content: center;
            background: #f5f5f5;
            position: relative;
            cursor: pointer;
        }
        .stock-pile {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            font-size: 2rem;
        }
        .tableau-piles {
            display: grid;
            grid-template-columns: repeat(7, 1fr);
            gap: 10px;
            margin-bottom: 20px;
        }
        .tableau-pile {
            min-height: 150px;
            border: 2px solid #ddd;
            border-radius: 8px;
            padding: 5px;
            background: #f9f9f9;
        }
        .card {
            width: 70px;
            height: 98px;
            background: white;
            border: 1px solid #333;
            border-radius: 5px;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            padding: 5px;
            margin-bottom: -70px;
            cursor: pointer;
            font-size: 0.9rem;
            position: relative;
            transition: transform 0.1s;
        }
        .card:hover {
            transform: translateY(-2px);
        }
        .card.red { color: red; }
        .card.black { color: black; }
        .card.face-down {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            font-size: 2rem;
        }
        .card.selected {
            border: 3px solid #ffd700;
            transform: translateY(-5px);
        }
        .card-value {
            font-weight: bold;
        }
        .card-suit {
            font-size: 1.2rem;
        }
    `;
    document.head.appendChild(style);
    
    resetSolitaire();
}

let solitaireGame = {
    deck: [],
    stock: [],
    waste: [],
    foundations: [[], [], [], []],
    tableau: [[], [], [], [], [], [], []],
    selectedCard: null
};

const suits = ['♠', '♥', '♦', '♣'];
const values = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

function createDeck() {
    const deck = [];
    for (let suit = 0; suit < 4; suit++) {
        for (let value = 0; value < 13; value++) {
            deck.push({
                suit: suit,
                value: value,
                color: suit < 2 ? 'red' : 'black',
                faceUp: false
            });
        }
    }
    return shuffle(deck);
}

function shuffle(deck) {
    for (let i = deck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    return deck;
}

function resetSolitaire() {
    const deck = createDeck();
    
    solitaireGame = {
        deck: deck,
        stock: deck.slice(0, 24),
        waste: [],
        foundations: [[], [], [], []],
        tableau: [[], [], [], [], [], [], []],
        selectedCard: null
    };
    
    // Deal tableau
    let cardIndex = 24;
    for (let col = 0; col < 7; col++) {
        for (let row = 0; row <= col; row++) {
            const card = deck[cardIndex++];
            card.faceUp = (row === col);
            solitaireGame.tableau[col].push(card);
        }
    }
    
    renderSolitaire();
}

function renderSolitaire() {
    // Render stock
    const stockEl = document.getElementById('stock');
    stockEl.innerHTML = solitaireGame.stock.length > 0 ? '🃏' : '';
    
    // Render waste
    const wasteEl = document.getElementById('waste');
    wasteEl.innerHTML = '';
    if (solitaireGame.waste.length > 0) {
        const card = solitaireGame.waste[solitaireGame.waste.length - 1];
        const cardEl = createCardElement(card, 'waste');
        wasteEl.appendChild(cardEl);
    }
    
    // Render foundations
    for (let i = 0; i < 4; i++) {
        const foundationEl = document.getElementById(`foundation-${i}`);
        foundationEl.innerHTML = '';
        if (solitaireGame.foundations[i].length > 0) {
            const card = solitaireGame.foundations[i][solitaireGame.foundations[i].length - 1];
            const cardEl = createCardElement(card, `foundation-${i}`);
            foundationEl.appendChild(cardEl);
        }
    }
    
    // Render tableau
    const tableauEl = document.getElementById('tableau');
    tableauEl.innerHTML = '';
    for (let col = 0; col < 7; col++) {
        const pileEl = document.createElement('div');
        pileEl.className = 'tableau-pile';
        pileEl.id = `tableau-${col}`;
        
        solitaireGame.tableau[col].forEach((card, index) => {
            if (card.faceUp || index === solitaireGame.tableau[col].length - 1) {
                const cardEl = createCardElement(card, `tableau-${col}-${index}`);
                pileEl.appendChild(cardEl);
            }
        });
        
        tableauEl.appendChild(pileEl);
    }
}

function createCardElement(card, id) {
    const cardEl = document.createElement('div');
    cardEl.className = `card ${card.color}`;
    if (!card.faceUp) cardEl.classList.add('face-down');
    
    if (card.faceUp) {
        cardEl.innerHTML = `
            <div class="card-value">${values[card.value]}</div>
            <div class="card-suit">${suits[card.suit]}</div>
        `;
    } else {
        cardEl.innerHTML = '🃏';
    }
    
    cardEl.onclick = () => selectCard(card, id);
    
    return cardEl;
}

function clickStock() {
    if (solitaireGame.stock.length === 0) {
        solitaireGame.stock = [...solitaireGame.waste].reverse();
        solitaireGame.stock.forEach(c => c.faceUp = false);
        solitaireGame.waste = [];
    } else {
        const card = solitaireGame.stock.pop();
        card.faceUp = true;
        solitaireGame.waste.push(card);
    }
    renderSolitaire();
}

function selectCard(card, id) {
    // Simplified - just show selection for now
    alert(`Kabal-funksjonalitet er forenklet. Kort valgt: ${values[card.value]}${suits[card.suit]}`);
}

// ========== LUDO GAME ==========
function initLudo() {
    const gameContent = document.getElementById('game-content');
    gameContent.innerHTML = `
        <h2>🏁 Ludo</h2>
        <div class="ludo-game">
            <div class="ludo-board">
                <canvas id="ludo-canvas" width="500" height="500"></canvas>
            </div>
            <div class="ludo-controls">
                <p>Ludo-spillet er under utvikling!</p>
                <p>Kommer snart med full funksjonalitet.</p>
                <button onclick="alert('Ludo kommer snart!')">Start spill</button>
            </div>
        </div>
    `;
    
    const style = document.createElement('style');
    style.id = 'game-specific-styles';
    style.textContent = `
        .ludo-game {
            display: flex;
            gap: 30px;
            justify-content: center;
            align-items: flex-start;
            flex-wrap: wrap;
        }
        #ludo-canvas {
            border: 3px solid #333;
            background: #fff;
        }
        .ludo-controls {
            padding: 20px;
        }
        .ludo-controls button {
            background: #667eea;
            color: white;
            border: none;
            padding: 15px 30px;
            border-radius: 8px;
            font-size: 1.1rem;
            cursor: pointer;
            margin-top: 15px;
        }
    `;
    document.head.appendChild(style);
}
