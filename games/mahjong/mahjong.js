// Mahjong Solitaire Game Module
import { createBackButton, setupScrollPrevention, removeScrollPrevention, setupHardReset } from '../../core/gameUtils.js';
import { injectGameStyles, removeGameStyles } from '../../core/gameStyles.js';

let mahjongGame = null;

export function init() {
    const gameContent = document.getElementById('game-content');
    gameContent.innerHTML = createBackButton() + `
        <div class="mahjong-wrap">
            <div class="mahjong-main">
                <div class="mahjong-header">
                    <h1>Mahjong</h1>
                    <div class="mahjong-stats">
                        <div class="stat-box">
                            <div class="stat-label">Tid</div>
                            <div class="stat-value" id="time-mahjong">00:00</div>
                        </div>
                        <div class="stat-box">
                            <div class="stat-label">Igjen</div>
                            <div class="stat-value" id="remaining-mahjong">144</div>
                        </div>
                    </div>
                </div>
                <div class="mahjong-game-area">
                    <div class="mahjong-board" id="mahjong-board"></div>
                </div>
                <div class="mahjong-controls">
                    <p id="mahjong-status" class="mahjong-status">Klikk på to matchende brikker</p>
                    <div class="mahjong-buttons">
                        <button onclick="window.resetMahjong()" class="btn-secondary">
                            <i data-lucide="refresh-cw"></i> Reset
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
    injectGameStyles('mahjong', getGameSpecificStyles());
    if (typeof lucide !== 'undefined') lucide.createIcons();
    
    setupScrollPrevention('mahjong');
    
    mahjongGame = new MahjongGame();
    window.mahjongGame = mahjongGame;
    window.resetMahjong = () => mahjongGame.reset();
}

export function cleanup() {
    if (mahjongGame) {
        mahjongGame.removeControls();
        mahjongGame = null;
    }
        removeScrollPrevention('mahjong');
        removeGameStyles('mahjong');
}

class MahjongGame {
    constructor() {
        this.tiles = [];
        this.selectedTile = null;
        this.remainingTiles = 144;
        this.startTime = Date.now();
        this.timer = null;
        this.gameOver = false;
        
        this.initTiles();
        this.setupControls();
        this.updateDisplay();
        this.startTimer();
    }

    initTiles() {
        // Create pairs of tiles (simplified mahjong solitaire)
        const tileTypes = ['🀄', '🀅', '🀆', '🀇', '🀈', '🀉', '🀊', '🀋', '🀌', '🀍', '🀎', '🀏', '🀐', '🀑', '🀒', '🀓', '🀔', '🀕', '🀖', '🀗', '🀘', '🀙', '🀚', '🀛', '🀜', '🀝', '🀞', '🀟', '🀠', '🀡'];
        
        // Create 144 tiles (72 pairs)
        this.tiles = [];
        for (let i = 0; i < 72; i++) {
            const type = tileTypes[i % tileTypes.length];
            this.tiles.push({ id: i * 2, type: type, matched: false, x: i % 12, y: Math.floor(i / 12) });
            this.tiles.push({ id: i * 2 + 1, type: type, matched: false, x: i % 12, y: Math.floor(i / 12) });
        }
        
        // Shuffle tiles
        for (let i = this.tiles.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.tiles[i], this.tiles[j]] = [this.tiles[j], this.tiles[i]];
        }
        
        // Layout in pyramid shape
        this.layout = Array(9).fill().map(() => Array(12).fill(null));
        let tileIndex = 0;
        for (let row = 0; row < 9; row++) {
            const startCol = Math.max(0, 6 - row);
            const endCol = Math.min(12, 6 + row + 1);
            for (let col = startCol; col < endCol && tileIndex < this.tiles.length; col++) {
                if (Math.random() > 0.3) { // Some tiles are exposed
                    this.layout[row][col] = this.tiles[tileIndex++];
                }
            }
        }
    }

    setupControls() {
        // Keyboard controls can be added here if needed
    }

    removeControls() {
        if (this.keyHandler) {
            document.removeEventListener('keydown', this.keyHandler);
        }
        if (this.timer) clearInterval(this.timer);
    }

    startTimer() {
        this.startTime = Date.now();
        if (this.timer) clearInterval(this.timer);
        this.timer = setInterval(() => {
            if (this.gameOver) return;
            const elapsed = Math.floor((Date.now() - this.startTime) / 1000);
            const minutes = Math.floor(elapsed / 60);
            const seconds = elapsed % 60;
            document.getElementById('time-mahjong').textContent = 
                `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
        }, 1000);
    }

    reset() {
        this.selectedTile = null;
        this.remainingTiles = 144;
        this.gameOver = false;
        this.initTiles();
        document.getElementById('remaining-mahjong').textContent = '144';
        document.getElementById('mahjong-status').textContent = 'Klikk på to matchende brikker';
        this.startTimer();
        this.updateDisplay();
    }

    isExposed(row, col) {
        if (row === 0) return this.layout[row][col] !== null;
        if (!this.layout[row][col]) return false;
        const left = col > 0 ? this.layout[row - 1][col - 1] : null;
        const right = col < 11 ? this.layout[row - 1][col] : null;
        return left === null || right === null;
    }

    selectTile(row, col) {
        if (this.gameOver || !this.isExposed(row, col)) return;
        
        const tile = this.layout[row][col];
        if (!tile || tile.matched) return;
        
        if (this.selectedTile) {
            const selectedRow = this.selectedTile.row;
            const selectedCol = this.selectedTile.col;
            const selected = this.layout[selectedRow][selectedCol];
            if (selected && selected.type === tile.type && 
                !(selectedRow === row && selectedCol === col)) {
                // Match!
                selected.matched = true;
                tile.matched = true;
                this.remainingTiles -= 2;
                document.getElementById('remaining-mahjong').textContent = this.remainingTiles;
                
                // Remove tiles
                this.layout[selectedRow][selectedCol] = null;
                this.layout[row][col] = null;
                this.selectedTile = null;
                
                // Check win
                if (this.remainingTiles === 0) {
                    this.gameOver = true;
                    if (this.timer) clearInterval(this.timer);
                    document.getElementById('mahjong-status').textContent = 'Gratulerer! Du klarte det!';
                    alert('Gratulerer! Du løste Mahjong!');
                } else {
                    document.getElementById('mahjong-status').textContent = 'Match!';
                    setTimeout(() => {
                        document.getElementById('mahjong-status').textContent = 'Klikk på to matchende brikker';
                    }, 1000);
                }
            } else {
                this.selectedTile = { row, col };
            }
        } else {
            this.selectedTile = { row, col };
        }
        
        this.updateDisplay();
    }

    updateDisplay() {
        const boardEl = document.getElementById('mahjong-board');
        if (!boardEl) return;
        
        boardEl.innerHTML = '';
        
        for (let row = 0; row < 9; row++) {
            for (let col = 0; col < 12; col++) {
                const cell = document.createElement('div');
                cell.className = 'mahjong-cell';
                cell.dataset.row = row;
                cell.dataset.col = col;
                
                const tile = this.layout[row][col];
                if (tile && !tile.matched) {
                    const exposed = this.isExposed(row, col);
                    cell.classList.add('tile');
                    if (exposed) {
                        cell.classList.add('exposed');
                        cell.textContent = tile.type;
                        cell.style.cursor = 'pointer';
                        
                        if (this.selectedTile && this.selectedTile.row === row && this.selectedTile.col === col) {
                            cell.classList.add('selected');
                        }
                        
                        cell.addEventListener('click', () => this.selectTile(row, col));
                    } else {
                        cell.classList.add('hidden');
                    }
                }
                
                boardEl.appendChild(cell);
            }
        }
    }
}

function getGameSpecificStyles() {
    return `
.mahjong-wrap {
            width: 100%;
            max-width: min(900px, 95vw);
            display: flex;
            flex-direction: column;
            align-items: center;
        }
        .mahjong-header h1 {
            font-size: 2.5rem;
            font-weight: 800;
            color: #111;
            margin: 0 0 20px 0;
            text-align: center;
        }
        .mahjong-stats {
            display: flex;
            gap: 20px;
            margin-bottom: 20px;
            justify-content: center;
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
        .mahjong-game-area {
            width: 100%;
            display: flex;
            justify-content: center;
            margin-bottom: 20px;
            overflow: auto;
            max-height: 60vh;
        }
        .mahjong-board {
            display: grid;
            grid-template-columns: repeat(12, 1fr);
            gap: 2px;
            background: #8b4513;
            border: 4px solid #654321;
            border-radius: 0;
            padding: 8px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            max-width: min(800px, calc(95vw - 40px));
            width: 100%;
        }
        .mahjong-cell {
            aspect-ratio: 1;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 1.5rem;
            min-height: 30px;
        }
        .mahjong-cell.tile.exposed {
            background: #fff;
            border: 2px solid #333;
            border-radius: 0;
            cursor: pointer;
            transition: all 0.2s ease;
        }
        .mahjong-cell.tile.exposed:hover {
            background: #f0f0f0;
            border-color: #0d6efd;
        }
        .mahjong-cell.tile.exposed.selected {
            background: #90ee90;
            border-color: #00ff00;
        }
        .mahjong-cell.tile.hidden {
            background: #654321;
        }
        .mahjong-controls {
            text-align: center;
        }
        .mahjong-status {
            color: #111;
            font-size: 1rem;
            font-weight: 600;
            margin-bottom: 15px;
            min-height: 24px;
        }
        .mahjong-buttons {
            display: flex;
            gap: 10px;
            justify-content: center;
        }
        .btn-secondary {
            padding: 10px 20px;
            border-radius: 0;
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
            .mahjong-wrap {
                max-width: 100%;
                padding: 0 5px;
            }
            .mahjong-header h1 {
                font-size: 2rem;
                margin-bottom: 15px;
            }
            .mahjong-stats {
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
            .mahjong-game-area {
                max-height: calc(100vh - 300px);
                overflow-y: auto;
                overflow-x: hidden;
                width: 100%;
            }
            .mahjong-board {
                max-width: 100%;
                padding: 6px;
            }
            .mahjong-cell {
                font-size: 1rem;
                min-height: 24px;
                min-width: 24px;
            }
            .mahjong-buttons {
                flex-direction: column;
                width: 100%;
            }
            .btn-secondary {
                width: 100%;
                min-height: 48px;
                padding: 14px 20px;
            }
        }
        @media (max-width: 480px) {
            .mahjong-cell {
                font-size: 0.85rem;
                min-height: 20px;
                min-width: 20px;
            }
            .mahjong-header h1 {
                font-size: 1.75rem;
            }
        }
    `;
}

