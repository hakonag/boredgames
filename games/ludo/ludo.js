// Ludo Game Module
import { createBackButton, setupScrollPrevention, removeScrollPrevention, setupHardReset } from '../../core/gameUtils.js';
import { injectGameStyles, removeGameStyles } from '../../core/gameStyles.js';

let ludoGame = null;

export function init() {
    const gameContent = document.getElementById('game-content');
    gameContent.innerHTML = createBackButton() + `
        <div class="ludo-wrap">
            <div class="ludo-main">
                <div class="ludo-header">
                    <h1>Ludo</h1>
                    <div class="ludo-stats">
                        <div class="stat-box">
                            <div class="stat-label">Spiller</div>
                            <div class="stat-value" id="turn-ludo">Rød</div>
                        </div>
                        <div class="stat-box">
                            <div class="stat-label">Terning</div>
                            <div class="stat-value" id="dice-ludo">-</div>
                        </div>
                    </div>
                </div>
                <div class="ludo-game-area">
                    <div class="ludo-board-container">
                        <div class="ludo-board" id="ludo-board"></div>
                    </div>
                    <div class="ludo-controls">
                        <p id="ludo-status" class="ludo-status">Rød spiller først</p>
                        <div class="ludo-dice-area">
                            <div class="ludo-die" id="ludo-die">🎲</div>
                            <button onclick="window.rollLudo()" id="roll-ludo-btn" class="btn-primary">
                                Kast terning
                            </button>
                        </div>
                        <div class="ludo-pieces-info">
                            <div class="ludo-player-info">
                                <h4>Rød</h4>
                                <div class="ludo-pieces-status" id="red-pieces-status"></div>
                            </div>
                            <div class="ludo-player-info">
                                <h4>Blå</h4>
                                <div class="ludo-pieces-status" id="blue-pieces-status"></div>
                            </div>
                        </div>
                        <button onclick="window.resetLudo()" class="btn-secondary">
                            <i data-lucide="refresh-cw"></i> Nytt spill
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
    injectGameStyles('ludo', getGameSpecificStyles());
    if (typeof lucide !== 'undefined') lucide.createIcons();
    
    setupScrollPrevention('ludo');
    
    ludoGame = new LudoGame();
    window.ludoGame = ludoGame;
    window.rollLudo = () => ludoGame.rollDice();
    window.resetLudo = () => ludoGame.reset();
    window.movePiece = (player, pieceIndex) => ludoGame.movePiece(player, pieceIndex);
}

export function cleanup() {
    if (ludoGame) {
        ludoGame.removeControls();
        ludoGame = null;
    }
    removeScrollPrevention('ludo');
    removeGameStyles('ludo');
}

class LudoGame {
    constructor() {
        this.boardSize = 15;
        this.currentPlayer = 'red';
        this.diceValue = 0;
        this.diceRolled = false;
        this.gameOver = false;
        
        // Initialize pieces: { player: [{ position, home, finished }, ...] }
        this.pieces = {
            red: [
                { position: -1, home: true, finished: false },
                { position: -1, home: true, finished: false },
                { position: -1, home: true, finished: false },
                { position: -1, home: true, finished: false }
            ],
            blue: [
                { position: -1, home: true, finished: false },
                { position: -1, home: true, finished: false },
                { position: -1, home: true, finished: false },
                { position: -1, home: true, finished: false }
            ]
        };
        
        // Path positions for each player (simplified circular path)
        this.paths = {
            red: Array.from({ length: 57 }, (_, i) => i),
            blue: Array.from({ length: 57 }, (_, i) => i)
        };
        
        this.setupControls();
        this.updateDisplay();
    }

    setupControls() {
        this.keyHandler = setupHardReset('ludo', (e) => {
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

    reset() {
        this.currentPlayer = 'red';
        this.diceValue = 0;
        this.diceRolled = false;
        this.gameOver = false;
        
        this.pieces = {
            red: [
                { position: -1, home: true, finished: false },
                { position: -1, home: true, finished: false },
                { position: -1, home: true, finished: false },
                { position: -1, home: true, finished: false }
            ],
            blue: [
                { position: -1, home: true, finished: false },
                { position: -1, home: true, finished: false },
                { position: -1, home: true, finished: false },
                { position: -1, home: true, finished: false }
            ]
        };
        
        this.updateDisplay();
    }

    rollDice() {
        if (this.gameOver || this.diceRolled) return;
        
        this.diceValue = Math.floor(Math.random() * 6) + 1;
        this.diceRolled = true;
        document.getElementById('dice-ludo').textContent = this.diceValue;
        
        // Check if player can move
        const canMove = this.pieces[this.currentPlayer].some(piece => 
            this.canMovePiece(piece, this.diceValue)
        );
        
        if (!canMove) {
            document.getElementById('ludo-status').textContent = 
                `${this.currentPlayer === 'red' ? 'Rød' : 'Blå'} kan ikke flytte. Neste spiller.`;
            setTimeout(() => this.nextTurn(), 1500);
        } else {
            document.getElementById('ludo-status').textContent = 
                `${this.currentPlayer === 'red' ? 'Rød' : 'Blå'} kastet ${this.diceValue}. Velg en brikke å flytte.`;
        }
        
        this.updateDisplay();
    }

    canMovePiece(piece, diceValue) {
        if (piece.finished) return false;
        
        if (piece.home) {
            return diceValue === 6; // Need 6 to start
        }
        
        const newPosition = piece.position + diceValue;
        return newPosition <= 56; // Max position before finish
    }

    movePiece(player, pieceIndex) {
        if (this.gameOver || !this.diceRolled || player !== this.currentPlayer) return;
        
        const piece = this.pieces[player][pieceIndex];
        if (!this.canMovePiece(piece, this.diceValue)) return;
        
        // Check if another piece is at target position (capture)
        const targetPos = piece.home ? 0 : piece.position + this.diceValue;
        
        // Check for captures
        const otherPlayer = player === 'red' ? 'blue' : 'red';
        this.pieces[otherPlayer].forEach(p => {
            if (p.position === targetPos && !p.home && !p.finished) {
                p.position = -1;
                p.home = true;
            }
        });
        
        // Move piece
        if (piece.home && this.diceValue === 6) {
            piece.position = 0;
            piece.home = false;
        } else if (!piece.home) {
            piece.position = targetPos;
            
            // Check if finished
            if (piece.position >= 56) {
                piece.finished = true;
                piece.position = -1;
                
                // Check win condition
                if (this.pieces[player].every(p => p.finished)) {
                    this.gameOver = true;
                    document.getElementById('ludo-status').textContent = 
                        `${player === 'red' ? 'Rød' : 'Blå'} vant!`;
                    alert(`${player === 'red' ? 'Rød' : 'Blå'} vant!`);
                    return;
                }
            }
        }
        
        // Next turn (unless rolled 6)
        if (this.diceValue === 6 && !piece.finished) {
            this.diceRolled = false;
            document.getElementById('ludo-status').textContent = 
                `${player === 'red' ? 'Rød' : 'Blå'} kastet 6! Kast igjen.`;
        } else {
            this.nextTurn();
        }
        
        this.updateDisplay();
    }

    nextTurn() {
        this.currentPlayer = this.currentPlayer === 'red' ? 'blue' : 'red';
        this.diceRolled = false;
        this.diceValue = 0;
        document.getElementById('turn-ludo').textContent = this.currentPlayer === 'red' ? 'Rød' : 'Blå';
        document.getElementById('dice-ludo').textContent = '-';
        document.getElementById('ludo-status').textContent = 
            `${this.currentPlayer === 'red' ? 'Rød' : 'Blå'} sin tur. Kast terningen.`;
        this.updateDisplay();
    }

    updateDisplay() {
        const boardEl = document.getElementById('ludo-board');
        boardEl.innerHTML = '';
        
        // Create simplified board grid
        const gridSize = 15;
        for (let row = 0; row < gridSize; row++) {
            for (let col = 0; col < gridSize; col++) {
                const cell = document.createElement('div');
                cell.className = 'ludo-cell';
                
                // Color zones
                if ((row < 6 && col < 6) || (row >= 9 && col >= 9)) {
                    cell.classList.add('ludo-home-zone');
                }
                if (row === 7 || col === 7) {
                    cell.classList.add('ludo-path');
                }
                
                // Check for pieces
                let pieceHere = null;
                
                // Red pieces
                this.pieces.red.forEach((piece, idx) => {
                    if (!piece.home && !piece.finished) {
                        const pos = this.getCellPosition('red', piece.position);
                        if (pos && pos.row === row && pos.col === col) {
                            pieceHere = { player: 'red', index: idx };
                        }
                    }
                });
                
                // Blue pieces
                this.pieces.blue.forEach((piece, idx) => {
                    if (!piece.home && !piece.finished) {
                        const pos = this.getCellPosition('blue', piece.position);
                        if (pos && pos.row === row && pos.col === col) {
                            pieceHere = { player: 'blue', index: idx };
                        }
                    }
                });
                
                // Home area pieces
                if (row < 6 && col < 6) {
                    // Red home
                    this.pieces.red.forEach((piece, idx) => {
                        if (piece.home && row === 2 + Math.floor(idx / 2) && col === 2 + (idx % 2)) {
                            pieceHere = { player: 'red', index: idx, home: true };
                        }
                    });
                }
                if (row >= 9 && col >= 9) {
                    // Blue home
                    this.pieces.blue.forEach((piece, idx) => {
                        if (piece.home && row === 10 + Math.floor(idx / 2) && col === 10 + (idx % 2)) {
                            pieceHere = { player: 'blue', index: idx, home: true };
                        }
                    });
                }
                
                if (pieceHere) {
                    const pieceEl = document.createElement('div');
                    pieceEl.className = `ludo-piece ludo-piece-${pieceHere.player}`;
                    pieceEl.textContent = pieceHere.home ? '🏠' : '●';
                    if (!pieceHere.home && this.diceRolled && this.currentPlayer === pieceHere.player) {
                        pieceEl.classList.add('movable');
                        pieceEl.onclick = () => this.movePiece(pieceHere.player, pieceHere.index);
                    }
                    cell.appendChild(pieceEl);
                }
                
                boardEl.appendChild(cell);
            }
        }
        
        // Update pieces status
        this.updatePiecesStatus();
    }

    getCellPosition(player, position) {
        if (position < 0 || position > 56) return null;
        
        // Simplified path mapping
        const path = [
            { row: 7, col: 1 }, { row: 7, col: 2 }, { row: 7, col: 3 }, { row: 7, col: 4 },
            { row: 7, col: 5 }, { row: 7, col: 6 }, { row: 6, col: 7 }, { row: 5, col: 7 },
            { row: 4, col: 7 }, { row: 3, col: 7 }, { row: 2, col: 7 }, { row: 1, col: 7 },
            { row: 0, col: 7 }, { row: 0, col: 8 }, { row: 1, col: 8 }, { row: 2, col: 8 },
            { row: 3, col: 8 }, { row: 4, col: 8 }, { row: 5, col: 8 }, { row: 6, col: 8 },
            { row: 7, col: 9 }, { row: 7, col: 10 }, { row: 7, col: 11 }, { row: 7, col: 12 },
            { row: 7, col: 13 }, { row: 8, col: 13 }, { row: 9, col: 13 }, { row: 10, col: 13 },
            { row: 11, col: 13 }, { row: 12, col: 13 }, { row: 13, col: 13 }, { row: 13, col: 14 },
            { row: 13, col: 13 }, { row: 12, col: 13 }, { row: 11, col: 13 }, { row: 10, col: 13 },
            { row: 9, col: 13 }, { row: 8, col: 13 }, { row: 7, col: 11 }, { row: 7, col: 10 },
            { row: 7, col: 9 }, { row: 7, col: 8 }, { row: 7, col: 7 }, { row: 7, col: 6 },
            { row: 7, col: 5 }, { row: 7, col: 4 }, { row: 7, col: 3 }, { row: 7, col: 2 },
            { row: 7, col: 1 }, { row: 7, col: 0 }
        ];
        
        if (player === 'blue') {
            // Rotate path for blue player
            const rotated = path.map(p => ({ row: 14 - p.row, col: 14 - p.col }));
            return rotated[position] || null;
        }
        
        return path[position] || null;
    }

    updatePiecesStatus() {
        const redStatus = document.getElementById('red-pieces-status');
        const blueStatus = document.getElementById('blue-pieces-status');
        
        redStatus.innerHTML = this.pieces.red.map((piece, idx) => {
            let status = '';
            if (piece.finished) status = '✅';
            else if (piece.home) status = '🏠';
            else status = `📍${piece.position}`;
            return `<span class="piece-status">${status}</span>`;
        }).join('');
        
        blueStatus.innerHTML = this.pieces.blue.map((piece, idx) => {
            let status = '';
            if (piece.finished) status = '✅';
            else if (piece.home) status = '🏠';
            else status = `📍${piece.position}`;
            return `<span class="piece-status">${status}</span>`;
        }).join('');
    }
}

function getGameSpecificStyles() {
    return `
        .ludo-wrap {
            width: 100%;
            max-width: min(1000px, 95vw);
            display: flex;
            flex-direction: column;
            align-items: center;
            padding: 10px;
            box-sizing: border-box;
        }
        .ludo-header h1 {
            font-size: 2.5rem;
            font-weight: 800;
            color: #111;
            margin: 0 0 20px 0;
            text-align: center;
        }
        .ludo-stats {
            display: flex;
            gap: 20px;
            margin-bottom: 20px;
            justify-content: center;
            flex-wrap: wrap;
        }
        .ludo-game-area {
            display: flex;
            gap: 30px;
            width: 100%;
            max-width: 100%;
            align-items: flex-start;
            flex-wrap: wrap;
        }
        .ludo-board-container {
            flex: 1;
            min-width: 300px;
            display: flex;
            justify-content: center;
        }
        .ludo-board {
            display: grid;
            grid-template-columns: repeat(15, 1fr);
            gap: 2px;
            background: #fff;
            border: 4px solid #333;
            border-radius: 0;
            padding: 4px;
            max-width: min(600px, calc(95vw - 100px));
            aspect-ratio: 1;
        }
        .ludo-cell {
            aspect-ratio: 1;
            background: #f8f9fa;
            border: 1px solid #dee2e6;
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 30px;
        }
        .ludo-path {
            background: #e9ecef;
        }
        .ludo-home-zone {
            background: #fff3cd;
        }
        .ludo-piece {
            width: 100%;
            height: 100%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 1.2rem;
            cursor: default;
        }
        .ludo-piece-red {
            color: #dc3545;
        }
        .ludo-piece-blue {
            color: #0d6efd;
        }
        .ludo-piece.movable {
            cursor: pointer;
            animation: pulse 1s infinite;
        }
        @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.6; }
        }
        .ludo-controls {
            flex: 1;
            min-width: 250px;
            background: #f8f9fa;
            border: 2px solid #dee2e6;
            border-radius: 0;
            padding: 20px;
        }
        .ludo-status {
            color: #111;
            font-size: 1rem;
            font-weight: 600;
            margin-bottom: 20px;
            min-height: 24px;
        }
        .ludo-dice-area {
            text-align: center;
            margin-bottom: 30px;
        }
        .ludo-die {
            font-size: 4rem;
            margin-bottom: 15px;
        }
        .ludo-pieces-info {
            margin-bottom: 20px;
        }
        .ludo-player-info {
            margin-bottom: 15px;
        }
        .ludo-player-info h4 {
            margin: 0 0 10px 0;
            font-size: 1rem;
            color: #495057;
        }
        .ludo-pieces-status {
            display: flex;
            gap: 10px;
            flex-wrap: wrap;
        }
        .piece-status {
            font-size: 1.2rem;
            padding: 5px 10px;
            background: #fff;
            border: 1px solid #dee2e6;
            border-radius: 0;
        }
        @media (max-width: 768px) {
            .ludo-wrap {
                padding: 5px;
            }
            .ludo-header h1 {
                font-size: 2rem;
                margin-bottom: 15px;
            }
            .ludo-stats {
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
            .ludo-game-area {
                flex-direction: column;
                gap: 20px;
            }
            .ludo-board-container {
                width: 100%;
            }
            .ludo-board {
                max-width: 100%;
                grid-template-columns: repeat(15, 1fr);
            }
            .ludo-cell {
                min-height: 20px;
            }
            .ludo-controls {
                width: 100%;
            }
            .btn-primary, .btn-secondary {
                width: 100%;
                min-height: 48px;
            }
        }
        @media (max-width: 480px) {
            .ludo-board {
                grid-template-columns: repeat(15, 1fr);
            }
            .ludo-cell {
                min-height: 15px;
            }
            .ludo-header h1 {
                font-size: 1.75rem;
            }
        }
    `;
}
