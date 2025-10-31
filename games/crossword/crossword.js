// Crossword Game Module
import { createBackButton, setupScrollPrevention, removeScrollPrevention, setupHardReset } from '../../core/gameUtils.js';
import { injectGameStyles, removeGameStyles } from '../../core/gameStyles.js';

let crosswordGame = null;

export function init() {
    const gameContent = document.getElementById('game-content');
    gameContent.innerHTML = createBackButton() + `
        <div class="crossword-wrap">
            <div class="crossword-main">
                <div class="crossword-header">
                    <h1>Crossword</h1>
                    <div class="crossword-stats">
                        <div class="stat-box">
                            <div class="stat-label">Ferdig</div>
                            <div class="stat-value" id="completed-crossword">0/10</div>
                        </div>
                    </div>
                </div>
                <div class="crossword-game-area">
                    <div class="crossword-board" id="crossword-board"></div>
                    <div class="crossword-clues" id="crossword-clues"></div>
                </div>
                <div class="crossword-controls">
                    <p id="crossword-status" class="crossword-status">Fyll inn ordene</p>
                    <div class="crossword-buttons">
                        <button onclick="window.resetCrossword()" class="btn-secondary">
                            <i data-lucide="refresh-cw"></i> Reset
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
    injectGameStyles('crossword', getGameSpecificStyles());
    if (typeof lucide !== 'undefined') lucide.createIcons();
    
    setupScrollPrevention('crossword');
    
    crosswordGame = new CrosswordGame();
    window.crosswordGame = crosswordGame;
    window.resetCrossword = () => crosswordGame.reset();
}

export function cleanup() {
    if (crosswordGame) {
        crosswordGame.removeControls();
        crosswordGame = null;
    }
        removeScrollPrevention('crossword');
        removeGameStyles('crossword');
}

class CrosswordGame {
    constructor() {
        this.size = 15;
        this.board = Array(this.size).fill().map(() => Array(this.size).fill(null));
        this.words = [
            { word: 'PROGRAMMERING', clue: '1 Tvers: Kode og utvikle', row: 5, col: 2, dir: 'across' },
            { word: 'SPILL', clue: '1 Ned: Underholdning', row: 2, col: 7, dir: 'down' },
            { word: 'KOMPUTER', clue: '2 Tvers: Maskin', row: 8, col: 4, dir: 'across' },
            { word: 'ALGORITME', clue: '2 Ned: Løsningsmetode', row: 1, col: 3, dir: 'down' },
            { word: 'INTERNETT', clue: '3 Tvers: Nettverk', row: 10, col: 3, dir: 'across' },
            { word: 'DATABASE', clue: '3 Ned: Informasjonslager', row: 3, col: 10, dir: 'down' },
            { word: 'FUNKSJON', clue: '4 Tvers: Metode', row: 6, col: 6, dir: 'across' },
            { word: 'VARIABEL', clue: '4 Ned: Navngitt verdi', row: 4, col: 1, dir: 'down' },
            { word: 'LOOP', clue: '5 Tvers: Repetisjon', row: 12, col: 5, dir: 'across' },
            { word: 'NETTSIDE', clue: '5 Ned: Web-side', row: 1, col: 8, dir: 'down' }
        ];
        this.selectedCell = null;
        this.completedWords = 0;
        
        this.placeWords();
        this.setupControls();
        this.updateDisplay();
    }

    placeWords() {
        this.words.forEach(word => {
            for (let i = 0; i < word.word.length; i++) {
                const row = word.dir === 'across' ? word.row : word.row + i;
                const col = word.dir === 'across' ? word.col + i : word.col;
                if (row < this.size && col < this.size) {
                    if (!this.board[row][col]) {
                        this.board[row][col] = { letter: null, words: [] };
                    }
                    this.board[row][col].words.push(word);
                }
            }
        });
    }

    setupControls() {
        this.keyHandler = setupHardReset('crossword', (e) => {
            if (this.selectedCell && /^[A-ZÆØÅa-zæøå]$/.test(e.key)) {
                const letter = e.key.toUpperCase();
                this.placeLetter(letter);
            }
        });
        document.addEventListener('keydown', this.keyHandler);
    }

    removeControls() {
        document.removeEventListener('keydown', this.keyHandler);
    }

    reset() {
        this.board = Array(this.size).fill().map(() => Array(this.size).fill(null));
        this.selectedCell = null;
        this.completedWords = 0;
        this.placeWords();
        document.getElementById('completed-crossword').textContent = '0/10';
        document.getElementById('crossword-status').textContent = 'Fyll inn ordene';
        this.updateDisplay();
    }

    selectCell(row, col) {
        if (this.board[row][col]) {
            this.selectedCell = { row, col };
            this.updateDisplay();
        }
    }

    placeLetter(letter) {
        if (!this.selectedCell) return;
        const { row, col } = this.selectedCell;
        if (!this.board[row][col]) return;
        
        this.board[row][col].letter = letter;
        this.checkWords();
        this.updateDisplay();
    }

    checkWords() {
        let completed = 0;
        this.words.forEach(word => {
            let correct = true;
            for (let i = 0; i < word.word.length; i++) {
                const row = word.dir === 'across' ? word.row : word.row + i;
                const col = word.dir === 'across' ? word.col + i : word.col;
                if (row >= this.size || col >= this.size) {
                    correct = false;
                    break;
                }
                const cell = this.board[row][col];
                if (!cell || cell.letter !== word.word[i]) {
                    correct = false;
                    break;
                }
            }
            if (correct) completed++;
        });
        
        this.completedWords = completed;
        document.getElementById('completed-crossword').textContent = `${completed}/10`;
        
        if (completed === this.words.length) {
            document.getElementById('crossword-status').textContent = 'Gratulerer! Du løste kryssordet!';
            alert('Gratulerer! Du løste kryssordet!');
        }
    }

    updateDisplay() {
        const boardEl = document.getElementById('crossword-board');
        const cluesEl = document.getElementById('crossword-clues');
        
        if (boardEl) {
            boardEl.innerHTML = '';
            for (let row = 0; row < this.size; row++) {
                for (let col = 0; col < this.size; col++) {
                    const cell = document.createElement('div');
                    cell.className = 'crossword-cell';
                    cell.dataset.row = row;
                    cell.dataset.col = col;
                    
                    const cellData = this.board[row][col];
                    if (cellData) {
                        cell.classList.add('active');
                        if (cellData.letter) {
                            cell.textContent = cellData.letter;
                            cell.classList.add('filled');
                        }
                        if (this.selectedCell && this.selectedCell.row === row && this.selectedCell.col === col) {
                            cell.classList.add('selected');
                        }
                        cell.addEventListener('click', () => this.selectCell(row, col));
                    }
                    
                    boardEl.appendChild(cell);
                }
            }
        }
        
        if (cluesEl) {
            cluesEl.innerHTML = '<h3>Hint:</h3>';
            this.words.forEach((word, index) => {
                const clueEl = document.createElement('div');
                clueEl.className = 'clue-item';
                clueEl.textContent = `${word.clue}`;
                cluesEl.appendChild(clueEl);
            });
        }
    }
}

function getGameSpecificStyles() {
    return `
        .crossword-wrap {
            width: 100%;
            max-width: min(1200px, 95vw);
            display: flex;
            flex-direction: column;
            align-items: center;
            padding: 10px;
            box-sizing: border-box;
        }
        .crossword-main {
            width: 100%;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 20px;
        }
        .crossword-header {
            text-align: center;
            width: 100%;
        }
        .crossword-header h1 {
            font-size: 2.5rem;
            font-weight: 800;
            color: #111;
            margin: 0 0 15px 0;
            text-align: center;
        }
        .crossword-stats {
            display: flex;
            gap: 20px;
            margin-bottom: 10px;
            justify-content: center;
        }
        .stat-box {
            background: #f8f9fa;
            border: 2px solid #dee2e6;
            border-radius: 0;
            padding: 12px 24px;
            text-align: center;
            min-width: 120px;
        }
        .stat-label {
            color: #6c757d;
            font-size: 0.85rem;
            font-weight: 600;
            margin-bottom: 6px;
        }
        .stat-value {
            color: #212529;
            font-size: 1.75rem;
            font-weight: 800;
        }
        .crossword-game-area {
            width: 100%;
            display: flex;
            gap: 30px;
            justify-content: center;
            align-items: flex-start;
            margin-bottom: 15px;
            flex-wrap: wrap;
        }
        .crossword-board {
            display: grid;
            grid-template-columns: repeat(15, 1fr);
            gap: 1px;
            background: #333;
            border: 3px solid #555;
            border-radius: 0;
            padding: 4px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            max-width: min(500px, calc(100vw - 100px));
            width: 100%;
            aspect-ratio: 1;
            flex-shrink: 0;
        }
        .crossword-cell {
            aspect-ratio: 1;
            background: #000;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 0.85rem;
            font-weight: 700;
            color: #fff;
        }
        .crossword-cell.active {
            background: #fff;
            border: 1px solid #333;
            cursor: pointer;
            color: #111;
        }
        .crossword-cell.active.selected {
            background: #cfe2ff;
            border: 2px solid #0d6efd;
        }
        .crossword-cell.active.filled {
            color: #111;
        }
        .crossword-clues {
            background: #f8f9fa;
            border: 2px solid #dee2e6;
            border-radius: 0;
            padding: 20px;
            max-width: min(400px, calc(100vw - 100px));
            width: 100%;
            max-height: min(500px, calc(100vh - 300px));
            overflow-y: auto;
            flex-shrink: 0;
        }
        .crossword-clues h3 {
            margin: 0 0 15px 0;
            font-size: 1.1rem;
            font-weight: 700;
            color: #111;
            padding-bottom: 10px;
            border-bottom: 2px solid #dee2e6;
        }
        .clue-item {
            padding: 10px 0;
            font-size: 0.9rem;
            color: #495057;
            border-bottom: 1px solid #e9ecef;
            line-height: 1.4;
        }
        .clue-item:last-child {
            border-bottom: none;
        }
        .crossword-controls {
            text-align: center;
            width: 100%;
            max-width: 600px;
        }
        .crossword-status {
            color: #111;
            font-size: 1rem;
            font-weight: 600;
            margin-bottom: 15px;
            min-height: 24px;
        }
        .crossword-buttons {
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
        @media (max-width: 968px) {
            .crossword-game-area {
                flex-direction: column;
                gap: 20px;
            }
            .crossword-board {
                max-width: min(500px, calc(100vw - 40px));
            }
            .crossword-clues {
                max-width: min(500px, calc(100vw - 40px));
                max-height: 400px;
            }
        }
        @media (max-width: 768px) {
            .crossword-wrap {
                padding: 5px;
            }
            .crossword-header h1 {
                font-size: 2rem;
                margin: 0 0 12px 0;
            }
            .crossword-stats {
                margin-bottom: 8px;
            }
            .stat-box {
                padding: 10px 20px;
            }
            .stat-value {
                font-size: 1.5rem;
            }
            .crossword-game-area {
                gap: 15px;
                margin-bottom: 10px;
            }
            .crossword-board {
                max-width: calc(100vw - 20px);
            }
            .crossword-clues {
                max-width: calc(100vw - 20px);
                max-height: 300px;
                padding: 15px;
            }
            .crossword-clues h3 {
                font-size: 1rem;
                margin: 0 0 12px 0;
            }
            .clue-item {
                font-size: 0.85rem;
                padding: 8px 0;
            }
            .crossword-cell {
                font-size: 0.7rem;
            }
        }
        @media (max-height: 800px) {
            .crossword-clues {
                max-height: 300px;
            }
        }
    `;
}

