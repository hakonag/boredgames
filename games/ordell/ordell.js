// Ordell (Wordle) Game Module
let ordellGame = null;

export function init() {
    const gameContent = document.getElementById('game-content');
    gameContent.innerHTML = `
        <button class="back-button-tetris" onclick="window.location.href='https://hakonag.github.io/boredgames/'">
            <i data-lucide="house"></i> Tilbake
        </button>
        <div class="ordell-wrap">
            <div class="ordell-header">
                <h1>Ordell</h1>
                <div class="ordell-stats">
                    <div class="stat-box">
                        <div class="stat-label">Forsøk</div>
                        <div class="stat-value" id="attempts-ordell">0/6</div>
                    </div>
                    <div class="stat-box">
                        <div class="stat-label">Seiere</div>
                        <div class="stat-value" id="wins-ordell">0</div>
                    </div>
                </div>
            </div>
            <div class="ordell-game">
                <div class="ordell-board" id="board-ordell"></div>
                <div class="ordell-keyboard" id="keyboard-ordell"></div>
                <div id="message-ordell" class="ordell-message"></div>
                <div class="ordell-buttons">
                    <button onclick="window.newGameOrdell()" class="btn-secondary">
                        <i data-lucide="refresh-cw"></i> Nytt spill
                    </button>
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
    window.ordellScrollPrevent = { wheel: preventScroll, touchmove: preventScroll };
    
    // Load words first
    fetch('games/ordell/words.json')
        .then(res => res.json())
        .then(words => {
            // Filter to only 5-letter words and convert to uppercase
            const fiveLetterWords = words
                .map(w => w.value.toUpperCase())
                .filter(word => word.length === 5);
            
            if (fiveLetterWords.length === 0) {
                throw new Error('No valid 5-letter words found');
            }
            
            ordellGame = new OrdellGame(fiveLetterWords);
            window.ordellGame = ordellGame;
            window.newGameOrdell = () => ordellGame.newGame();
        })
        .catch(err => {
            console.error('Failed to load words:', err);
            // Fallback words
            const fallback = ['HUSET', 'BOKEN', 'STUEN', 'VINEN', 'SOLEN', 'NESTE', 'KVELD', 'DRIKK', 'SPISE', 'REISE'];
            ordellGame = new OrdellGame(fallback);
            window.ordellGame = ordellGame;
            window.newGameOrdell = () => ordellGame.newGame();
        });
    
    // Load wins
    const wins = localStorage.getItem('ordell-wins');
    if (wins) {
        document.getElementById('wins-ordell').textContent = wins;
    }
}

export function cleanup() {
    if (ordellGame) {
        ordellGame.removeControls();
        ordellGame = null;
    }
    if (window.ordellScrollPrevent) {
        window.removeEventListener('wheel', window.ordellScrollPrevent.wheel);
        window.removeEventListener('touchmove', window.ordellScrollPrevent.touchmove);
        delete window.ordellScrollPrevent;
    }
    const styleEl = document.getElementById('ordell-style');
    if (styleEl) styleEl.remove();
}

class OrdellGame {
    constructor(words) {
        this.words = words;
        this.wordLength = 5;
        this.maxAttempts = 6;
        this.targetWord = '';
        this.currentAttempt = '';
        this.attempts = [];
        this.gameOver = false;
        this.wins = parseInt(localStorage.getItem('ordell-wins') || '0');
        this.letterStates = {}; // 'correct', 'present', 'absent'
        this.setupControls();
        this.newGame();
    }
    
    newGame() {
        this.targetWord = this.words[Math.floor(Math.random() * this.words.length)].toUpperCase();
        this.currentAttempt = '';
        this.attempts = [];
        this.gameOver = false;
        this.letterStates = {};
        document.getElementById('attempts-ordell').textContent = '0/6';
        document.getElementById('message-ordell').textContent = '';
        this.renderBoard();
        this.renderKeyboard();
    }
    
    renderBoard() {
        const board = document.getElementById('board-ordell');
        board.innerHTML = '';
        
        for (let i = 0; i < this.maxAttempts; i++) {
            const row = document.createElement('div');
            row.className = 'ordell-row';
            
            for (let j = 0; j < this.wordLength; j++) {
                const cell = document.createElement('div');
                cell.className = 'ordell-cell';
                
                if (i < this.attempts.length) {
                    const attempt = this.attempts[i];
                    const letter = attempt.word[j] || '';
                    const state = attempt.states[j] || '';
                    
                    cell.textContent = letter;
                    cell.classList.add(state);
                } else if (i === this.attempts.length) {
                    // Current attempt
                    cell.textContent = this.currentAttempt[j] || '';
                }
                
                row.appendChild(cell);
            }
            
            board.appendChild(row);
        }
    }
    
    renderKeyboard() {
        const keyboard = document.getElementById('keyboard-ordell');
        keyboard.innerHTML = '';
        
        const rows = [
            ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P', 'Å'],
            ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L', 'Ø', 'Æ'],
            ['ENTER', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', 'BACK']
        ];
        
        rows.forEach(rowKeys => {
            const row = document.createElement('div');
            row.className = 'keyboard-row';
            
            rowKeys.forEach(key => {
                const keyEl = document.createElement('button');
                keyEl.className = 'keyboard-key';
                keyEl.textContent = key;
                
                if (key === 'ENTER') {
                    keyEl.classList.add('key-enter');
                    keyEl.onclick = () => this.submitGuess();
                } else if (key === 'BACK') {
                    keyEl.classList.add('key-back');
                    keyEl.onclick = () => this.backspace();
                } else {
                    keyEl.onclick = () => this.addLetter(key);
                    
                    // Color based on letter state
                    if (this.letterStates[key]) {
                        keyEl.classList.add(this.letterStates[key]);
                    }
                }
                
                row.appendChild(keyEl);
            });
            
            keyboard.appendChild(row);
        });
    }
    
    addLetter(letter) {
        if (this.gameOver) return;
        if (this.currentAttempt.length >= this.wordLength) return;
        if (this.attempts.length >= this.maxAttempts) return;
        
        this.currentAttempt += letter;
        this.renderBoard();
    }
    
    backspace() {
        if (this.gameOver) return;
        if (this.currentAttempt.length === 0) return;
        
        this.currentAttempt = this.currentAttempt.slice(0, -1);
        this.renderBoard();
    }
    
    submitGuess() {
        if (this.gameOver) return;
        if (this.currentAttempt.length !== this.wordLength) {
            document.getElementById('message-ordell').textContent = 'Ordet må være 5 bokstaver!';
            setTimeout(() => {
                document.getElementById('message-ordell').textContent = '';
            }, 2000);
            return;
        }
        
        if (!this.words.includes(this.currentAttempt.toUpperCase())) {
            document.getElementById('message-ordell').textContent = 'Ordet finnes ikke i ordlisten!';
            setTimeout(() => {
                document.getElementById('message-ordell').textContent = '';
            }, 2000);
            return;
        }
        
        const guess = this.currentAttempt.toUpperCase();
        const states = this.evaluateGuess(guess);
        
        this.attempts.push({
            word: guess,
            states: states
        });
        
        // Update letter states for keyboard
        guess.split('').forEach((letter, i) => {
            const state = states[i];
            if (!this.letterStates[letter] || 
                (state === 'correct') ||
                (state === 'present' && this.letterStates[letter] !== 'correct')) {
                this.letterStates[letter] = state;
            }
        });
        
        this.currentAttempt = '';
        document.getElementById('attempts-ordell').textContent = `${this.attempts.length}/6`;
        
        // Check win
        if (guess === this.targetWord) {
            this.gameOver = true;
            this.wins++;
            localStorage.setItem('ordell-wins', String(this.wins));
            document.getElementById('wins-ordell').textContent = this.wins;
            document.getElementById('message-ordell').textContent = `🎉 Gratulerer! Du gjettet ordet på ${this.attempts.length} forsøk!`;
        } else if (this.attempts.length >= this.maxAttempts) {
            this.gameOver = true;
            document.getElementById('message-ordell').textContent = `😢 Ordet var: ${this.targetWord}`;
        }
        
        this.renderBoard();
        this.renderKeyboard();
    }
    
    evaluateGuess(guess) {
        const states = Array(this.wordLength).fill('absent');
        const targetLetters = this.targetWord.split('');
        const guessLetters = guess.split('');
        
        // First pass: mark correct positions
        for (let i = 0; i < this.wordLength; i++) {
            if (guessLetters[i] === targetLetters[i]) {
                states[i] = 'correct';
                targetLetters[i] = null; // Mark as used
                guessLetters[i] = null; // Mark as used
            }
        }
        
        // Second pass: mark present letters
        for (let i = 0; i < this.wordLength; i++) {
            if (guessLetters[i] === null) continue; // Already marked correct
            
            const index = targetLetters.findIndex((letter, idx) => 
                letter === guessLetters[i] && states[idx] !== 'correct'
            );
            
            if (index !== -1) {
                states[i] = 'present';
                targetLetters[index] = null; // Mark as used
            }
        }
        
        return states;
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
                window.location.href = 'https://hakonag.github.io/boredgames/?game=ordell';
                return;
            }
            
            if (this.gameOver) return;
            
            // Handle letter input - accept both uppercase and lowercase, including Norwegian letters
            const key = e.key;
            // Normalize to uppercase for Norwegian letters: æ→Æ, ø→Ø, å→Å
            let normalizedKey = key.toUpperCase();
            // Handle Norwegian lowercase letters specifically
            if (key === 'æ') normalizedKey = 'Æ';
            else if (key === 'ø') normalizedKey = 'Ø';
            else if (key === 'å') normalizedKey = 'Å';
            
            if (/^[A-ZÆØÅ]$/.test(normalizedKey)) {
                this.addLetter(normalizedKey);
            } else if (e.key === 'Backspace') {
                this.backspace();
            } else if (e.key === 'Enter') {
                this.submitGuess();
            }
        };
        document.addEventListener('keydown', this.keyHandler);
    }
    
    removeControls() {
        if (this.keyHandler) {
            document.removeEventListener('keydown', this.keyHandler);
        }
    }
}

function injectStyles() {
    if (document.getElementById('ordell-style')) return;
    const style = document.createElement('style');
    style.id = 'ordell-style';
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
        .back-button-tetris:hover {
            background: #e9ecef;
            border-color: #adb5bd;
        }
        .back-button-tetris i {
            width: 14px;
            height: 14px;
        }
        .ordell-wrap {
            width: 100%;
            max-width: min(700px, 95vw);
            display: flex;
            flex-direction: column;
            align-items: center;
        }
        .ordell-header {
            text-align: center;
            margin-bottom: 30px;
        }
        .ordell-header h1 {
            font-size: 3rem;
            font-weight: 800;
            color: #333;
            margin: 0 0 20px 0;
            letter-spacing: 4px;
        }
        .ordell-stats {
            display: flex;
            gap: 20px;
            justify-content: center;
            margin-bottom: 20px;
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
        .ordell-game {
            width: 100%;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 30px;
        }
        .ordell-board {
            display: flex;
            flex-direction: column;
            gap: 8px;
        }
        .ordell-row {
            display: flex;
            gap: 8px;
        }
        .ordell-cell {
            width: 60px;
            height: 60px;
            max-width: min(60px, calc((95vw - 100px) / 5 - 8px));
            max-height: min(60px, calc((95vw - 100px) / 5 - 8px));
            aspect-ratio: 1;
            border: 2px solid #dee2e6;
            border-radius: 8px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 1.8rem;
            font-weight: 800;
            color: #212529;
            background: #ffffff;
            transition: all 0.3s ease;
        }
        .ordell-cell.correct {
            background: #22c55e;
            border-color: #22c55e;
            color: white;
        }
        .ordell-cell.present {
            background: #f59e0b;
            border-color: #f59e0b;
            color: white;
        }
        .ordell-cell.absent {
            background: #9ca3af;
            border-color: #9ca3af;
            color: white;
        }
        .ordell-keyboard {
            display: flex;
            flex-direction: column;
            gap: 8px;
            width: 100%;
            max-width: 600px;
        }
        .keyboard-row {
            display: flex;
            gap: 6px;
            justify-content: center;
        }
        .keyboard-key {
            padding: 12px 16px;
            border: 2px solid #dee2e6;
            border-radius: 8px;
            background: #f8f9fa;
            color: #212529;
            font-size: 1rem;
            font-weight: 700;
            cursor: pointer;
            transition: all 0.2s ease;
            min-width: 40px;
            height: 50px;
        }
        .keyboard-key:hover {
            background: #e9ecef;
            border-color: #adb5bd;
        }
        .keyboard-key:active {
            transform: scale(0.95);
        }
        .keyboard-key.correct {
            background: #22c55e;
            border-color: #22c55e;
            color: white;
        }
        .keyboard-key.present {
            background: #f59e0b;
            border-color: #f59e0b;
            color: white;
        }
        .keyboard-key.absent {
            background: #9ca3af;
            border-color: #9ca3af;
            color: white;
        }
        .key-enter, .key-back {
            background: #3b82f6;
            border-color: #2563eb;
            color: white;
            font-size: 0.85rem;
            padding: 12px 12px;
        }
        .key-enter:hover, .key-back:hover {
            background: #2563eb;
        }
        .key-enter {
            min-width: 80px;
        }
        .key-back {
            min-width: 60px;
        }
        .ordell-message {
            min-height: 40px;
            text-align: center;
            font-size: 1.2rem;
            font-weight: 600;
            color: #495057;
            padding: 10px;
        }
        .ordell-buttons {
            display: flex;
            gap: 10px;
            justify-content: center;
        }
        .btn-secondary {
            padding: 12px 24px;
            border-radius: 8px;
            font-size: 1rem;
            cursor: pointer;
            font-weight: 600;
            display: flex;
            align-items: center;
            gap: 6px;
            border: 2px solid;
            background: #6c757d;
            color: white;
            border-color: #5a6268;
            transition: all 0.2s ease;
        }
        .btn-secondary:hover {
            background: #5a6268;
        }
        .btn-secondary i {
            width: 16px;
            height: 16px;
        }
        @media (max-width: 768px) {
            .game-container #game-content {
                height: 100vh;
                max-height: 100vh;
                margin: 0;
                padding: 10px;
            }
            .back-button-tetris {
                top: 10px;
                left: 10px;
                padding: 8px 10px;
                font-size: 0.7rem;
            }
            .ordell-header h1 {
                font-size: 2rem;
            }
            .ordell-stats {
                flex-direction: column;
                gap: 10px;
            }
            .stat-box {
                width: 100%;
            }
            .ordell-cell {
                width: 50px;
                height: 50px;
                font-size: 1.5rem;
            }
            .keyboard-key {
                padding: 8px 10px;
                font-size: 0.85rem;
                height: 45px;
                min-width: 30px;
            }
            .key-enter, .key-back {
                font-size: 0.75rem;
                padding: 8px 8px;
            }
            .key-enter {
                min-width: 60px;
            }
            .key-back {
                min-width: 50px;
            }
        }
    `;
    document.head.appendChild(style);
}

