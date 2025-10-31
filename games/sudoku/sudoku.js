// Sudoku Game Module

let sudokuGame = null;

export function init() {
    const gameContent = document.getElementById('game-content');
    gameContent.innerHTML = `
        <button class="back-button-tetris" onclick="window.location.href='https://hakonag.github.io/boredgames/'">
            <i data-lucide="house"></i> Tilbake
        </button>
        <div class="sudoku-wrap">
            <div class="sudoku-main">
                <div class="sudoku-header">
                    <h1>Sudoku</h1>
                    <div class="sudoku-stats">
                        <div class="stat-box">
                            <div class="stat-label">Feil</div>
                            <div class="stat-value" id="errors-sudoku">0</div>
                        </div>
                        <div class="stat-box">
                            <div class="stat-label">Tid</div>
                            <div class="stat-value" id="time-sudoku">00:00</div>
                        </div>
                    </div>
                </div>
                <div class="sudoku-game-area">
                    <div class="sudoku-board" id="board-sudoku"></div>
                    <div class="sudoku-controls-panel">
                        <div class="sudoku-numpad" id="numpad-sudoku"></div>
                        <div class="sudoku-buttons">
                            <button onclick="window.newSudoku()" class="btn-primary">
                                <i data-lucide="refresh-cw"></i> Nytt spill
                            </button>
                            <button onclick="window.hintSudoku()" class="btn-secondary">
                                <i data-lucide="lightbulb"></i> Hint
                            </button>
                        </div>
                        <div id="sudoku-status" class="sudoku-status"></div>
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
    window.sudokuScrollPrevent = { wheel: preventScroll, touchmove: preventScroll };
    
    sudokuGame = new SudokuGame();
    window.sudokuGame = sudokuGame;
    window.newSudoku = () => sudokuGame.newGame();
    window.hintSudoku = () => sudokuGame.hint();
}

export function cleanup() {
    if (sudokuGame) {
        sudokuGame.removeControls();
        sudokuGame = null;
    }
    // Remove scroll prevention
    if (window.sudokuScrollPrevent) {
        window.removeEventListener('wheel', window.sudokuScrollPrevent.wheel);
        window.removeEventListener('touchmove', window.sudokuScrollPrevent.touchmove);
        delete window.sudokuScrollPrevent;
    }
    const styleEl = document.getElementById('sudoku-style');
    if (styleEl) styleEl.remove();
}

class SudokuGame {
    constructor() {
        this.size = 9;
        this.board = [];
        this.solution = [];
        this.startTime = null;
        this.errors = 0;
        this.timer = null;
        this.selectedCell = null;
        this.setupControls();
        this.newGame();
    }

    newGame() {
        this.generatePuzzle();
        this.errors = 0;
        this.startTime = Date.now();
        document.getElementById('errors-sudoku').textContent = '0';
        document.getElementById('sudoku-status').textContent = '';
        this.startTimer();
        this.updateDisplay();
    }

    generatePuzzle() {
        // Create a solved board
        this.solution = this.solveSudoku(this.createEmptyBoard());
        
        // Create puzzle by removing numbers
        this.board = this.solution.map(row => [...row]);
        const toRemove = Math.floor(Math.random() * 20) + 40; // Remove 40-60 numbers
        let removed = 0;
        while (removed < toRemove) {
            const i = Math.floor(Math.random() * 9);
            const j = Math.floor(Math.random() * 9);
            if (this.board[i][j] !== 0) {
                this.board[i][j] = 0;
                removed++;
            }
        }
    }

    createEmptyBoard() {
        return Array(this.size).fill().map(() => Array(this.size).fill(0));
    }

    solveSudoku(board) {
        // Simple solver - just create a valid solution
        const nums = [1,2,3,4,5,6,7,8,9];
        for (let i = 0; i < 9; i++) {
            for (let j = 0; j < 9; j++) {
                if (board[i][j] === 0) {
                    const shuffled = [...nums].sort(() => Math.random() - 0.5);
                    for (const num of shuffled) {
                        if (this.isValid(board, i, j, num)) {
                            board[i][j] = num;
                            if (this.solveSudoku(board)) return board;
                            board[i][j] = 0;
                        }
                    }
                    return false;
                }
            }
        }
        return board;
    }

    isValid(board, row, col, num) {
        // Check row
        for (let j = 0; j < 9; j++) {
            if (board[row][j] === num) return false;
        }
        // Check column
        for (let i = 0; i < 9; i++) {
            if (board[i][col] === num) return false;
        }
        // Check 3x3 box
        const boxRow = Math.floor(row / 3) * 3;
        const boxCol = Math.floor(col / 3) * 3;
        for (let i = boxRow; i < boxRow + 3; i++) {
            for (let j = boxCol; j < boxCol + 3; j++) {
                if (board[i][j] === num) return false;
            }
        }
        return true;
    }

    hint() {
        if (!this.selectedCell) {
            document.getElementById('sudoku-status').textContent = 'Velg en celle først!';
            return;
        }
        const [row, col] = this.selectedCell;
        if (this.board[row][col] !== 0) {
            document.getElementById('sudoku-status').textContent = 'Cellen er allerede fylt!';
            return;
        }
        this.board[row][col] = this.solution[row][col];
        this.updateDisplay();
        this.checkWin();
    }

    startTimer() {
        if (this.timer) clearInterval(this.timer);
        this.timer = setInterval(() => {
            const elapsed = Math.floor((Date.now() - this.startTime) / 1000);
            const minutes = Math.floor(elapsed / 60);
            const seconds = elapsed % 60;
            document.getElementById('time-sudoku').textContent = 
                `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
        }, 1000);
    }

    setupControls() {
        this.keyHandler = (e) => {
            // Don't process shortcuts if user is typing in an input field
            const activeElement = document.activeElement;
            if (activeElement && (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA')) {
                return;
            }
            
            // Handle restart (R)
            if (e.key === 'r' || e.key === 'R') {
                window.location.href = 'https://hakonag.github.io/boredgames/?game=sudoku';
                return;
            }
            
            if (this.selectedCell && /^[1-9]$/.test(e.key)) {
                const num = parseInt(e.key);
                this.placeNumber(num);
            }
        };
        document.addEventListener('keydown', this.keyHandler);
    }

    removeControls() {
        document.removeEventListener('keydown', this.keyHandler);
        if (this.timer) clearInterval(this.timer);
    }

    placeNumber(num) {
        if (!this.selectedCell) return;
        const [row, col] = this.selectedCell;
        
        // Check if correct
        if (num === this.solution[row][col]) {
            this.board[row][col] = num;
            document.getElementById('sudoku-status').textContent = '';
        } else {
            this.errors++;
            document.getElementById('errors-sudoku').textContent = this.errors;
            document.getElementById('sudoku-status').textContent = 'Feil! Prøv igjen.';
            setTimeout(() => {
                document.getElementById('sudoku-status').textContent = '';
            }, 2000);
        }
        this.updateDisplay();
        this.checkWin();
    }

    selectCell(row, col) {
        this.selectedCell = [row, col];
        this.updateDisplay();
    }

    checkWin() {
        let filled = 0;
        for (let i = 0; i < 9; i++) {
            for (let j = 0; j < 9; j++) {
                if (this.board[i][j] !== 0) filled++;
            }
        }
        if (filled === 81) {
            if (this.timer) clearInterval(this.timer);
            document.getElementById('sudoku-status').textContent = 'Gratulerer! Du løste Sudoku!';
            alert('Gratulerer! Du løste Sudoku! Feil: ' + this.errors);
        }
    }

    updateDisplay() {
        const boardEl = document.getElementById('board-sudoku');
        const numpadEl = document.getElementById('numpad-sudoku');
        
        if (boardEl) {
            boardEl.innerHTML = '';
            for (let i = 0; i < this.size; i++) {
                for (let j = 0; j < this.size; j++) {
                    const cell = document.createElement('div');
                    cell.className = 'sudoku-cell';
                    if ((i + 1) % 3 === 0 && i < 8) cell.style.borderBottom = '3px solid #333';
                    if ((j + 1) % 3 === 0 && j < 8) cell.style.borderRight = '3px solid #333';
                    if (this.selectedCell && this.selectedCell[0] === i && this.selectedCell[1] === j) {
                        cell.classList.add('selected');
                    }
                    if (this.board[i][j] !== 0) {
                        cell.textContent = this.board[i][j];
                        cell.classList.add('filled');
                        // Check if it was a given
                        const wasGiven = this.solution[i][j] === this.board[i][j] && 
                                         this.board[i][j] !== 0;
                        if (wasGiven) {
                            // Mark cells that were in the original puzzle
                            cell.classList.add('given');
                        }
                    }
                    cell.addEventListener('click', () => this.selectCell(i, j));
                    boardEl.appendChild(cell);
                }
            }
        }
        
        if (numpadEl) {
            numpadEl.innerHTML = '';
            for (let num = 1; num <= 9; num++) {
                const btn = document.createElement('button');
                btn.className = 'numpad-btn';
                btn.textContent = num;
                btn.addEventListener('click', () => this.placeNumber(num));
                numpadEl.appendChild(btn);
            }
        }
    }
}

function injectStyles() {
    if (document.getElementById('sudoku-style')) return;
    const style = document.createElement('style');
    style.id = 'sudoku-style';
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
        .sudoku-wrap {
            width: 100%;
            max-width: min(800px, 95vw);
            display: flex;
            flex-direction: column;
            align-items: center;
        }
        .sudoku-header h1 {
            font-size: 3rem;
            font-weight: 800;
            color: #333;
            margin: 0 0 20px 0;
            text-align: center;
        }
        .sudoku-stats {
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
        .sudoku-game-area {
            display: flex;
            gap: 20px;
            align-items: flex-start;
            width: 100%;
            max-width: min(800px, 95vw);
        }
        .sudoku-board {
            display: grid;
            grid-template-columns: repeat(9, 1fr);
            grid-template-rows: repeat(9, 1fr);
            gap: 0;
            background: #000;
            border: 3px solid #333;
            padding: 2px;
            width: 100%;
            max-width: min(500px, calc(95vw - 40px));
            aspect-ratio: 1;
        }
        .sudoku-cell {
            background: #fff;
            border: 1px solid #ccc;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 1.5rem;
            font-weight: 600;
            cursor: pointer;
            aspect-ratio: 1;
            transition: all 0.2s ease;
        }
        .sudoku-cell:hover {
            background: #e9ecef;
        }
        .sudoku-cell.selected {
            background: #cfe2ff;
            border: 2px solid #0d6efd;
        }
        .sudoku-cell.filled {
            color: #212529;
        }
        .sudoku-cell.given {
            font-weight: 800;
            color: #000;
        }
        .sudoku-controls-panel {
            display: flex;
            flex-direction: column;
            gap: 15px;
            min-width: 200px;
        }
        .sudoku-numpad {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 8px;
        }
        .numpad-btn {
            background: #f8f9fa;
            border: 2px solid #dee2e6;
            border-radius: 6px;
            padding: 12px;
            font-size: 1.2rem;
            font-weight: 700;
            cursor: pointer;
            transition: all 0.2s ease;
        }
        .numpad-btn:hover {
            background: #e9ecef;
            border-color: #adb5bd;
        }
        .sudoku-buttons {
            display: flex;
            flex-direction: column;
            gap: 10px;
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
            width: 100%;
            justify-content: center;
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
        .sudoku-status {
            min-height: 20px;
            color: #495057;
            font-weight: 600;
            text-align: center;
            font-size: 0.9rem;
        }
        @media (max-width: 768px) {
            .sudoku-header h1 {
                font-size: 2rem;
            }
            .sudoku-stats {
                flex-direction: column;
                gap: 10px;
            }
            .stat-box {
                width: 100%;
            }
            .sudoku-game-area {
                flex-direction: column;
            }
            .sudoku-board {
                max-width: 100%;
            }
            .sudoku-controls-panel {
                width: 100%;
            }
            .sudoku-cell {
                font-size: 1.2rem;
            }
        }
    `;
    document.head.appendChild(style);
}

