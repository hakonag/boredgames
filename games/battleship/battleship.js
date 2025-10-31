// Battleship Game Module

let battleshipGame = null;

export function init() {
    const gameContent = document.getElementById('game-content');
    gameContent.innerHTML = `
        createBackButton() + `
        <div class="battleship-wrap">
            <div class="battleship-main">
                <div class="battleship-header">
                    <h1>Battleship</h1>
                    <div class="battleship-stats">
                        <div class="stat-box">
                            <div class="stat-label">Treff</div>
                            <div class="stat-value" id="hits-battleship">0</div>
                        </div>
                        <div class="stat-box">
                            <div class="stat-label">Forsøk</div>
                            <div class="stat-value" id="shots-battleship">0</div>
                        </div>
                    </div>
                </div>
                <div class="battleship-game-area">
                    <div class="battleship-boards">
                        <div class="battleship-board-section">
                            <h3>Ditt brett</h3>
                            <div class="battleship-board" id="player-board"></div>
                        </div>
                        <div class="battleship-board-section">
                            <h3>Motstander</h3>
                            <div class="battleship-board" id="enemy-board"></div>
                        </div>
                    </div>
                </div>
                <div class="battleship-controls">
                    <p id="battleship-status" class="battleship-status">Plasser skipene dine (5 skip)</p>
                    <div class="battleship-buttons">
                        <button onclick="window.placeShipsRandom()" id="random-btn" class="btn-secondary">
                            <i data-lucide="shuffle"></i> Plasser tilfeldig
                        </button>
                        <button onclick="window.startBattleship()" id="start-btn" style="display:none" class="btn-primary">
                            <i data-lucide="play"></i> Start
                        </button>
                        <button onclick="window.resetBattleship()" class="btn-secondary">
                            <i data-lucide="refresh-cw"></i> Reset
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
    injectGameStyles('battleship', getGameSpecificStyles());
    if (typeof lucide !== 'undefined') lucide.createIcons();
    
    setupScrollPrevention('battleship');
    
    battleshipGame = new BattleshipGame();
    window.battleshipGame = battleshipGame;
    window.placeShipsRandom = () => battleshipGame.placeShipsRandom();
    window.startBattleship = () => battleshipGame.start();
    window.resetBattleship = () => battleshipGame.reset();
}

export function cleanup() {
    if (battleshipGame) {
        battleshipGame.removeControls();
        battleshipGame = null;
    }
        removeScrollPrevention('battleship');
        removeGameStyles('battleship');
}

class BattleshipGame {
    constructor() {
        this.size = 10;
        this.playerBoard = [];
        this.enemyBoard = [];
        this.enemyShips = [];
        this.playerShips = [];
        this.selectedShip = null;
        this.selectedSize = 5;
        this.shipsToPlace = [5, 4, 3, 3, 2];
        this.placingShips = true;
        this.gameStarted = false;
        this.hits = 0;
        this.shots = 0;
        this.totalShips = 5;
        
        this.initBoards();
        this.setupControls();
        this.updateDisplay();
    }

    initBoards() {
        this.playerBoard = Array(this.size).fill().map(() => Array(this.size).fill(0));
        this.enemyBoard = Array(this.size).fill().map(() => Array(this.size).fill(0));
        this.placeEnemyShips();
    }

    placeEnemyShips() {
        this.enemyShips = [];
        const sizes = [5, 4, 3, 3, 2];
        sizes.forEach(size => {
            let placed = false;
            while (!placed) {
                const row = Math.floor(Math.random() * this.size);
                const col = Math.floor(Math.random() * this.size);
                const horizontal = Math.random() > 0.5;
                
                if (this.canPlaceShip(this.enemyBoard, row, col, size, horizontal)) {
                    this.placeShip(this.enemyBoard, row, col, size, horizontal);
                    this.enemyShips.push({ row, col, size, horizontal, hits: 0 });
                    placed = true;
                }
            }
        });
    }

    canPlaceShip(board, row, col, size, horizontal) {
        for (let i = 0; i < size; i++) {
            const r = row + (horizontal ? 0 : i);
            const c = col + (horizontal ? i : 0);
            if (r >= this.size || c >= this.size || board[r][c] !== 0) {
                return false;
            }
        }
        return true;
    }

    placeShip(board, row, col, size, horizontal) {
        for (let i = 0; i < size; i++) {
            const r = row + (horizontal ? 0 : i);
            const c = col + (horizontal ? i : 0);
            board[r][c] = 1;
        }
    }

    placeShipsRandom() {
        this.playerBoard = Array(this.size).fill().map(() => Array(this.size).fill(0));
        this.playerShips = [];
        const sizes = [5, 4, 3, 3, 2];
        sizes.forEach(size => {
            let placed = false;
            let attempts = 0;
            while (!placed && attempts < 100) {
                const row = Math.floor(Math.random() * this.size);
                const col = Math.floor(Math.random() * this.size);
                const horizontal = Math.random() > 0.5;
                
                if (this.canPlaceShip(this.playerBoard, row, col, size, horizontal)) {
                    this.placeShip(this.playerBoard, row, col, size, horizontal);
                    this.playerShips.push({ row, col, size, horizontal, hits: 0 });
                    placed = true;
                }
                attempts++;
            }
        });
        this.placingShips = false;
        this.updateDisplay();
        document.getElementById('battleship-status').textContent = 'Skip plassert! Klikk Start for å begynne.';
        document.getElementById('start-btn').style.display = 'inline-flex';
    }

    start() {
        if (this.placingShips) return;
        this.gameStarted = true;
        document.getElementById('random-btn').style.display = 'none';
        document.getElementById('start-btn').style.display = 'none';
        document.getElementById('battleship-status').textContent = 'Din tur! Klikk på motstanderens brett.';
        this.updateDisplay();
    }

    reset() {
        this.placingShips = true;
        this.gameStarted = false;
        this.hits = 0;
        this.shots = 0;
        this.shipsToPlace = [5, 4, 3, 3, 2];
        this.initBoards();
        document.getElementById('hits-battleship').textContent = '0';
        document.getElementById('shots-battleship').textContent = '0';
        document.getElementById('battleship-status').textContent = 'Plasser skipene dine (5 skip)';
        document.getElementById('random-btn').style.display = 'inline-flex';
        document.getElementById('start-btn').style.display = 'none';
        this.updateDisplay();
    }

    shoot(row, col) {
        if (!this.gameStarted) return;
        if (this.enemyBoard[row][col] === 2 || this.enemyBoard[row][col] === 3) return; // Already shot
        
        this.shots++;
        document.getElementById('shots-battleship').textContent = this.shots;
        
        if (this.enemyBoard[row][col] === 1) {
            // Hit!
            this.enemyBoard[row][col] = 2; // Hit marker
            this.hits++;
            document.getElementById('hits-battleship').textContent = this.hits;
            
            // Check if ship sunk
            const ship = this.enemyShips.find(s => {
                if (s.horizontal) {
                    return s.row === row && col >= s.col && col < s.col + s.size;
                } else {
                    return s.col === col && row >= s.row && row < s.row + s.size;
                }
            });
            if (ship) {
                ship.hits++;
                if (ship.hits === ship.size) {
                    document.getElementById('battleship-status').textContent = 'Du senket et skip!';
                } else {
                    document.getElementById('battleship-status').textContent = 'Treff!';
                }
            }
            
            // Check win
            if (this.hits === 17) { // Total ship cells
                alert('Gratulerer! Du vant! Alle skip senket!');
                this.reset();
            }
        } else {
            // Miss
            this.enemyBoard[row][col] = 3; // Miss marker
            document.getElementById('battleship-status').textContent = 'Bom!';
        }
        
        this.updateDisplay();
    }

    setupControls() {
        };
        document.addEventListener('keydown', this.keyHandler);
    }

    removeControls() {
        if (this.keyHandler) {
            document.removeEventListener('keydown', this.keyHandler);
        }
    }

    updateDisplay() {
        const playerBoardEl = document.getElementById('player-board');
        const enemyBoardEl = document.getElementById('enemy-board');
        
        if (playerBoardEl) {
            playerBoardEl.innerHTML = '';
            for (let i = 0; i < this.size; i++) {
                for (let j = 0; j < this.size; j++) {
                    const cell = document.createElement('div');
                    cell.className = 'battleship-cell';
                    if (this.playerBoard[i][j] === 1) {
                        cell.classList.add('ship');
                    }
                    if (i === 0 || j === 0) {
                        cell.classList.add('label');
                        if (i === 0 && j === 0) {
                            cell.textContent = '';
                        } else if (i === 0) {
                            cell.textContent = String.fromCharCode(64 + j);
                        } else if (j === 0) {
                            cell.textContent = i;
                        }
                    }
                    playerBoardEl.appendChild(cell);
                }
            }
        }
        
        if (enemyBoardEl) {
            enemyBoardEl.innerHTML = '';
            for (let i = 0; i < this.size; i++) {
                for (let j = 0; j < this.size; j++) {
                    const cell = document.createElement('div');
                    cell.className = 'battleship-cell';
                    cell.dataset.row = i;
                    cell.dataset.col = j;
                    
                    if (i === 0 || j === 0) {
                        cell.classList.add('label');
                        if (i === 0 && j === 0) {
                            cell.textContent = '';
                        } else if (i === 0) {
                            cell.textContent = String.fromCharCode(64 + j);
                        } else if (j === 0) {
                            cell.textContent = i;
                        }
                    } else {
                        if (this.enemyBoard[i][j] === 2) {
                            cell.classList.add('hit');
                            cell.textContent = '💥';
                        } else if (this.enemyBoard[i][j] === 3) {
                            cell.classList.add('miss');
                            cell.textContent = '○';
                        }
                    }
                    
                    if (this.gameStarted) {
                        cell.addEventListener('click', () => this.shoot(i, j));
                        if (!cell.classList.contains('hit') && !cell.classList.contains('miss')) {
                            cell.style.cursor = 'pointer';
                        }
                    }
                    enemyBoardEl.appendChild(cell);
                }
            }
        }
    }
}

function getGameSpecificStyles() {
    return `
.battleship-wrap {
            width: 100%;
            max-width: min(1000px, 95vw);
            display: flex;
            flex-direction: column;
            align-items: center;
        }
        .battleship-header h1 {
            font-size: 3rem;
            font-weight: 800;
            color: #333;
            margin: 0 0 20px 0;
            text-align: center;
        }
        .battleship-stats {
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
        .battleship-game-area {
            width: 100%;
            margin-bottom: 20px;
        }
        .battleship-boards {
            display: flex;
            gap: 30px;
            justify-content: center;
            flex-wrap: wrap;
        }
        .battleship-board-section {
            display: flex;
            flex-direction: column;
            align-items: center;
        }
        .battleship-board-section h3 {
            font-size: 1.2rem;
            font-weight: 700;
            color: #333;
            margin-bottom: 10px;
        }
        .battleship-board {
            display: grid;
            grid-template-columns: repeat(11, 1fr);
            gap: 2px;
            background: #1976d2;
            padding: 8px;
            border-radius: 8px;
            border: 3px solid #1565c0;
        }
        .battleship-cell {
            width: 35px;
            height: 35px;
            background: #90caf9;
            border: 1px solid #64b5f6;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 0.9rem;
            font-weight: 600;
        }
        .battleship-cell.label {
            background: #1976d2;
            color: #fff;
            border: none;
            font-weight: 700;
        }
        .battleship-cell.ship {
            background: #555;
        }
        .battleship-cell.hit {
            background: #ff5252;
            color: #fff;
        }
        .battleship-cell.miss {
            background: #e0e0e0;
            color: #666;
        }
        .battleship-controls {
            text-align: center;
        }
        .battleship-status {
            color: #333;
            font-size: 1rem;
            font-weight: 600;
            margin-bottom: 15px;
            min-height: 24px;
        }
        .battleship-buttons {
            display: flex;
            gap: 10px;
            justify-content: center;
        }
        .btn-primary, .btn-secondary {
            padding: 10px 20px;
            border-radius: 6px;
            font-size: 0.9rem;
            cursor: pointer;
            font-weight: 600;
            display: flex;
            align-items: center;
            gap: 6px;
            border: 2px solid;
        }
        .btn-primary {
            background: #0d6efd;
            color: white;
            border-color: #0a58ca;
        }
        .btn-primary:hover {
            background: #0a58ca;
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
            width: 14px;
            height: 14px;
        }
        @media (max-width: 768px) {
            .battleship-header h1 {
                font-size: 2rem;
            }
            .battleship-stats {
                flex-direction: column;
                gap: 10px;
            }
            .stat-box {
                width: 100%;
            }
            .battleship-boards {
                flex-direction: column;
                gap: 20px;
            }
            .battleship-cell {
                width: 28px;
                height: 28px;
                font-size: 0.75rem;
            }
            .battleship-buttons {
                flex-direction: column;
            }
            .btn-primary, .btn-secondary {
                width: 100%;
            }
        }
    `;
}

