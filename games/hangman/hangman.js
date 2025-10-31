// Hangman Game Module
import { createBackButton, setupScrollPrevention, removeScrollPrevention, setupHardReset } from '../../core/gameUtils.js';
import { injectGameStyles, removeGameStyles } from '../../core/gameStyles.js';

let hangmanGame = null;

export function init() {
    const gameContent = document.getElementById('game-content');
    gameContent.innerHTML = createBackButton() + `
        <div class="hangman-wrap">
            <div class="hangman-main">
                <div class="hangman-header">
                    <h1>Hangman</h1>
                    <div class="hangman-stats">
                        <div class="stat-box">
                            <div class="stat-label">Feil</div>
                            <div class="stat-value" id="wrong-hangman">0/6</div>
                        </div>
                    </div>
                </div>
                <div class="hangman-game-area">
                    <div class="hangman-drawing" id="hangman-drawing"></div>
                    <div class="hangman-word" id="hangman-word"></div>
                    <div class="hangman-letters" id="hangman-letters"></div>
                </div>
                <div class="hangman-controls">
                    <p id="hangman-status" class="hangman-status"></p>
                    <div class="hangman-buttons">
                        <button onclick="window.newWordHangman()" class="btn-primary">
                            <i data-lucide="refresh-cw"></i> Nytt ord
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
    injectGameStyles('hangman', getGameSpecificStyles());
    if (typeof lucide !== 'undefined') lucide.createIcons();
    
    setupScrollPrevention('hangman');
    
    hangmanGame = new HangmanGame();
    window.hangmanGame = hangmanGame;
    window.newWordHangman = () => hangmanGame.newWord();
}

export function cleanup() {
    if (hangmanGame) {
        hangmanGame.removeControls();
        hangmanGame = null;
    }
        removeScrollPrevention('hangman');
        removeGameStyles('hangman');
}

class HangmanGame {
    constructor() {
        this.words = ['PROGRAMMERING', 'SPILL', 'KOMPUTER', 'INTERNETT', 'ALGORITME', 'FUNKSJON', 'VARIABEL', 'LOOP', 'DATABASE', 'NETTSIDE'];
        this.currentWord = '';
        this.guessedLetters = new Set();
        this.wrongGuesses = 0;
        this.maxWrong = 6;
        this.gameOver = false;
        this.setupControls();
        this.newWord();
    }

    newWord() {
        this.currentWord = this.words[Math.floor(Math.random() * this.words.length)];
        this.guessedLetters.clear();
        this.wrongGuesses = 0;
        this.gameOver = false;
        document.getElementById('wrong-hangman').textContent = `0/${this.maxWrong}`;
        document.getElementById('hangman-status').textContent = '';
        this.updateDisplay();
    }

    guessLetter(letter) {
        if (this.gameOver) return;
        if (this.guessedLetters.has(letter)) return;
        
        this.guessedLetters.add(letter);
        
        if (this.currentWord.includes(letter)) {
            // Correct guess
            if (this.checkWin()) {
                this.gameOver = true;
                document.getElementById('hangman-status').textContent = 'Gratulerer! Du gjettet ordet!';
            }
        } else {
            // Wrong guess
            this.wrongGuesses++;
            document.getElementById('wrong-hangman').textContent = `${this.wrongGuesses}/${this.maxWrong}`;
            if (this.wrongGuesses >= this.maxWrong) {
                this.gameOver = true;
                document.getElementById('hangman-status').textContent = `Game Over! Ordet var: ${this.currentWord}`;
            }
        }
        
        this.updateDisplay();
    }

    checkWin() {
        return this.currentWord.split('').every(letter => this.guessedLetters.has(letter));
    }

    setupControls() {
        if (this.gameOver) return;
            const letter = e.key.toUpperCase();
            if (/^[A-ZÆØÅ]$/.test(letter)) {
                this.guessLetter(letter);
            }
        };
        document.addEventListener('keydown', this.keyHandler);
    }

    removeControls() {
        document.removeEventListener('keydown', this.keyHandler);
    }

    updateDisplay() {
        const wordEl = document.getElementById('hangman-word');
        const lettersEl = document.getElementById('hangman-letters');
        const drawingEl = document.getElementById('hangman-drawing');
        
        // Display word
        if (wordEl) {
            wordEl.innerHTML = this.currentWord.split('').map(letter => 
                `<span class="word-letter ${this.guessedLetters.has(letter) ? 'guessed' : ''}">${this.guessedLetters.has(letter) ? letter : '_'}</span>`
            ).join(' ');
        }
        
        // Display letter buttons
        if (lettersEl) {
            lettersEl.innerHTML = '';
            const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZÆØÅ';
            alphabet.split('').forEach(letter => {
                const btn = document.createElement('button');
                btn.className = 'letter-btn';
                btn.textContent = letter;
                btn.disabled = this.guessedLetters.has(letter) || this.gameOver;
                if (this.guessedLetters.has(letter)) {
                    btn.classList.add('guessed');
                    if (this.currentWord.includes(letter)) {
                        btn.classList.add('correct');
                    } else {
                        btn.classList.add('wrong');
                    }
                }
                btn.addEventListener('click', () => this.guessLetter(letter));
                lettersEl.appendChild(btn);
            });
        }
        
        // Draw hangman
        if (drawingEl) {
            drawingEl.innerHTML = '';
            const canvas = document.createElement('canvas');
            canvas.width = 200;
            canvas.height = 300;
            const ctx = canvas.getContext('2d');
            
            ctx.strokeStyle = '#333';
            ctx.lineWidth = 4;
            
            // Gallows
            if (this.wrongGuesses > 0) {
                ctx.beginPath();
                ctx.moveTo(20, 280);
                ctx.lineTo(100, 280);
                ctx.moveTo(60, 280);
                ctx.lineTo(60, 20);
                ctx.lineTo(140, 20);
                ctx.lineTo(140, 40);
                ctx.stroke();
            }
            
            // Head
            if (this.wrongGuesses > 1) {
                ctx.beginPath();
                ctx.arc(140, 70, 20, 0, Math.PI * 2);
                ctx.stroke();
            }
            
            // Body
            if (this.wrongGuesses > 2) {
                ctx.beginPath();
                ctx.moveTo(140, 90);
                ctx.lineTo(140, 170);
                ctx.stroke();
            }
            
            // Left arm
            if (this.wrongGuesses > 3) {
                ctx.beginPath();
                ctx.moveTo(140, 110);
                ctx.lineTo(100, 140);
                ctx.stroke();
            }
            
            // Right arm
            if (this.wrongGuesses > 4) {
                ctx.beginPath();
                ctx.moveTo(140, 110);
                ctx.lineTo(180, 140);
                ctx.stroke();
            }
            
            // Left leg
            if (this.wrongGuesses > 5) {
                ctx.beginPath();
                ctx.moveTo(140, 170);
                ctx.lineTo(100, 220);
                ctx.stroke();
            }
            
            // Right leg
            if (this.wrongGuesses > 6) {
                ctx.beginPath();
                ctx.moveTo(140, 170);
                ctx.lineTo(180, 220);
                ctx.stroke();
            }
            
            drawingEl.appendChild(canvas);
        }
    }
}

function getGameSpecificStyles() {
    return `
.hangman-wrap {
            width: 100%;
            max-width: min(800px, 95vw);
            display: flex;
            flex-direction: column;
            align-items: center;
        }
        .hangman-header h1 {
            font-size: 2.5rem;
            font-weight: 800;
            color: #111;
            margin: 0 0 20px 0;
            text-align: center;
        }
        .hangman-stats {
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
        .hangman-game-area {
            width: 100%;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 20px;
            margin-bottom: 20px;
        }
        .hangman-drawing {
            min-height: 300px;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .hangman-word {
            font-size: 2.5rem;
            font-weight: 800;
            letter-spacing: 10px;
            color: #111;
            text-align: center;
        }
        .word-letter {
            display: inline-block;
            margin: 0 5px;
        }
        .word-letter.guessed {
            color: #0d6efd;
        }
        .hangman-letters {
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
            justify-content: center;
            max-width: min(600px, calc(95vw - 40px));
        }
        .letter-btn {
            width: 40px;
            height: 40px;
            background: #f8f9fa;
            border: 2px solid #dee2e6;
            border-radius: 0;
            font-size: 1rem;
            font-weight: 700;
            cursor: pointer;
            transition: all 0.2s ease;
        }
        .letter-btn:hover:not(:disabled) {
            background: #e9ecef;
            border-color: #adb5bd;
        }
        .letter-btn:disabled {
            cursor: not-allowed;
        }
        .letter-btn.guessed.correct {
            background: #d4edda;
            border-color: #28a745;
            color: #155724;
        }
        .letter-btn.guessed.wrong {
            background: #f8d7da;
            border-color: #dc3545;
            color: #721c24;
        }
        .hangman-controls {
            text-align: center;
        }
        .hangman-status {
            color: #111;
            font-size: 1rem;
            font-weight: 600;
            margin-bottom: 15px;
            min-height: 24px;
        }
        .hangman-buttons {
            display: flex;
            gap: 10px;
            justify-content: center;
        }
        .btn-primary {
            padding: 10px 20px;
            border-radius: 0;
            font-size: 0.9rem;
            cursor: pointer;
            font-weight: 600;
            display: flex;
            align-items: center;
            gap: 6px;
            border: 2px solid;
            background: #0d6efd;
            color: white;
            border-color: #0a58ca;
        }
        .btn-primary:hover {
            background: #0a58ca;
        }
        .btn-primary i {
            width: 14px;
            height: 14px;
        }
        @media (max-width: 768px) {
            .hangman-header h1 {
                font-size: 2rem;
            }
            .hangman-word {
                font-size: 1.5rem;
                letter-spacing: 5px;
            }
            .letter-btn {
                width: 32px;
                height: 32px;
                font-size: 0.85rem;
            }
        }
    `;
}

