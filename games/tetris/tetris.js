// Tetris Game Module
import { displayHighScores, showScoreModal } from '../../core/highScores.js';

let tetrisGame = null;

export function init() {
    const gameContent = document.getElementById('game-content');
    gameContent.innerHTML = `
        <button class="back-button-tetris" onclick="window.location.href='https://hakonag.github.io/boredgames/'">
            <i data-lucide="house"></i> Tilbake
        </button>
        <div class="tetris-game">
            <div id="tetris-fps" class="fps-indicator">60 fps</div>
            <div class="tetris-side-panel">
                <div class="preview-box">
                    <h4>Hold</h4>
                    <canvas id="hold-canvas" width="140" height="140"></canvas>
                    <div class="key-hint">
                        <span class="key-icon">C</span>
                        <span class="key-icon">⇧</span>
                    </div>
                </div>
                <div class="preview-box">
                    <h4>Neste</h4>
                    <canvas id="next-canvas" width="140" height="140"></canvas>
                </div>
                <div class="tetris-info">
                    <div class="info-item">
                        <span class="info-label">Poeng</span>
                        <span class="info-value" id="tetris-score">0</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Linjer</span>
                        <span class="info-value" id="tetris-lines">0</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Nivå</span>
                        <span class="info-value" id="tetris-level">1</span>
                    </div>
                </div>
            </div>
            <div class="tetris-board">
                <canvas id="tetris-canvas" width="300" height="600"></canvas>
            </div>
            <div class="tetris-right-panels">
                <div class="tetris-controls-panel">
                    <h3>Kontroller</h3>
                    <div class="control-group">
                        <div class="control-item">
                            <div class="control-icons">
                                <span class="key-icon-large" data-lucide="arrow-left"></span>
                                <span class="key-icon-large" data-lucide="arrow-right"></span>
                            </div>
                            <span class="control-label">Flytt</span>
                        </div>
                        <div class="control-item">
                            <span class="key-icon-large" data-lucide="arrow-up"></span>
                            <span class="control-label">Roter</span>
                        </div>
                        <div class="control-item">
                            <span class="key-icon-large" data-lucide="arrow-down"></span>
                            <span class="control-label">Raskt fall</span>
                        </div>
                        <div class="control-item">
                            <span class="key-icon-large key-space">Space</span>
                            <span class="control-label">Hard drop</span>
                        </div>
                    <div class="control-item">
                        <div class="control-icons">
                            <span class="key-icon">C</span>
                            <span class="key-icon">⇧</span>
                        </div>
                        <span class="control-label">Hold</span>
                    </div>
                    <div class="control-item">
                        <div class="control-icons">
                            <span class="key-icon">R</span>
                        </div>
                        <span class="control-label">Restart</span>
                    </div>
                    <div class="control-item">
                        <div class="control-icons">
                            <span class="key-icon">P</span>
                        </div>
                        <span class="control-label">Pause</span>
                    </div>
                    <div class="control-item">
                        <div class="control-icons">
                            <span class="key-icon">M</span>
                        </div>
                        <span class="control-label">Mute</span>
                    </div>
                </div>
                <div class="mode-selector">
                    <h4>Vanskelighetsgrad</h4>
                    <div class="mode-buttons">
                        <button onclick="window.setTetrisMode('easy')" id="mode-easy" class="mode-btn active">
                            <i data-lucide="feather"></i> Lett
                        </button>
                        <button onclick="window.setTetrisMode('hard')" id="mode-hard" class="mode-btn">
                            <i data-lucide="flame"></i> Vanskelig
                        </button>
                    </div>
                </div>
                <div class="game-buttons">
                    <button onclick="window.startTetris()" id="tetris-start-btn" class="btn-primary">
                        <i data-lucide="play"></i> Start
                    </button>
                    <button onclick="window.pauseTetris()" id="tetris-pause-btn" style="display:none" class="btn-primary">
                        <i data-lucide="pause"></i> Pause
                    </button>
                    <button onclick="window.restartTetris()" class="btn-secondary">
                        <i data-lucide="refresh-cw"></i> Restart
                    </button>
                    <button onclick="window.toggleMute()" id="mute-btn" class="btn-secondary">
                        <i data-lucide="volume-2"></i> Mute
                    </button>
                </div>
                </div>
                <div class="tetris-leaderboard-panel">
                    <h3>Toppresultater</h3>
                    <div class="high-scores">
                        <div id="tetris-high-scores"></div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Lock scrolling when Tetris is active
    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.width = '100%';
    document.body.style.height = '100%';
    document.documentElement.style.overflow = 'hidden';
    
    // Prevent wheel scrolling
    const preventScroll = (e) => {
        e.preventDefault();
        return false;
    };
    
    window.addEventListener('wheel', preventScroll, { passive: false });
    window.addEventListener('touchmove', preventScroll, { passive: false });
    window.tetrisScrollPrevent = { wheel: preventScroll, touchmove: preventScroll };
    
    const style = document.createElement('style');
    style.id = 'game-specific-styles';
    style.textContent = `
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
            padding: 0 0;
            margin-top: 5vh;
            margin-bottom: 5vh;
            background: transparent;
            border-radius: 0;
            box-shadow: none;
        }
        /* Apply clean grotesk-style font to Tetris page */
        .game-container #game-content, 
        .game-container #game-content * {
            font-family: system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol" !important;
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
        .tetris-game {
            display: flex;
            gap: 15px;
            justify-content: center;
            align-items: stretch;
            width: 100%;
            max-width: 1200px;
            height: 100%;
            padding: 0;
            box-sizing: border-box;
        }
        .fps-indicator {
            position: absolute;
            top: -32px; /* sits just above the game window area */
            right: 20px;
            background: #f8f9fa;
            color: #6c757d;
            border: 2px solid #dee2e6;
            border-radius: 8px;
            padding: 6px 10px;
            font-size: 10px;
            line-height: 1;
            z-index: 5;
        }
        .tetris-side-panel {
            display: flex;
            flex-direction: column;
            gap: 10px;
            flex-shrink: 0;
            width: 140px;
            align-items: stretch;
        }
        .tetris-right-panels {
            display: flex;
            flex-direction: row;
            gap: 15px;
            flex-shrink: 0;
            align-items: stretch;
        }
        .tetris-controls-panel {
            padding: 15px;
            background: #f8f9fa;
            border: 2px solid #dee2e6;
            border-radius: 12px;
            width: 180px;
            flex-shrink: 0;
            box-sizing: border-box;
            display: flex;
            flex-direction: column;
        }
        .tetris-leaderboard-panel {
            padding: 12px;
            background: #f8f9fa;
            border: 2px solid #dee2e6;
            border-radius: 12px;
            width: 180px;
            flex-shrink: 0;
            box-sizing: border-box;
            display: flex;
            flex-direction: column;
            min-height: 0;
            max-height: 100%;
        }
        .preview-box {
            background: #f8f9fa;
            border: 2px solid #dee2e6;
            border-radius: 8px;
            padding: 8px;
            text-align: center;
            box-sizing: border-box;
        }
        .preview-box h4 {
            margin: 0 0 6px 0;
            font-size: 0.75rem;
            color: #495057;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        #hold-canvas, #next-canvas {
            background: #000;
            border: 2px solid #6c757d;
            border-radius: 4px;
            display: block;
            width: 100%;
            height: auto;
            max-width: 100%;
        }
        .key-hint {
            display: flex;
            gap: 4px;
            justify-content: center;
            margin-top: 8px;
        }
        .key-icon {
            background: #e9ecef;
            color: #495057;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 0.75rem;
            font-weight: bold;
            border: 1px solid #adb5bd;
        }
        .tetris-board {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 0;
            flex-shrink: 0;
            flex-grow: 1;
            justify-content: center;
        }
        /* removed arcade frame styling for full-page experience */
        #tetris-canvas {
            border: 4px solid #6c757d;
            background: #000;
            display: block;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            width: 100%;
            max-width: min(300px, calc(100vw - 500px));
            height: auto;
            aspect-ratio: 1 / 2;
        }
        .tetris-info {
            display: flex;
            flex-direction: column;
            gap: 6px;
            margin-top: 10px;
            padding: 8px;
            background: #f8f9fa;
            border-radius: 6px;
            border: 1px solid #dee2e6;
        }
        .info-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 3px 0;
        }
        .info-label {
            color: #6c757d;
            font-size: 0.7rem;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        .info-value {
            color: #212529;
            font-size: 0.9rem;
            font-weight: bold;
        }
        .tetris-controls-panel h3, .tetris-leaderboard-panel h3 {
            margin: 0 0 12px 0;
            font-size: 0.9rem;
            color: #495057;
            text-align: center;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            font-weight: 600;
        }
        .control-group {
            display: flex;
            flex-direction: column;
            gap: 6px;
            margin-bottom: 12px;
        }
        .control-item {
            display: flex;
            align-items: center;
            gap: 6px;
            padding: 6px;
            background: #ffffff;
            border-radius: 6px;
            border: 1px solid #dee2e6;
        }
        .control-icons {
            display: flex;
            gap: 6px;
        }
        .key-icon-large {
            width: 24px;
            height: 24px;
            display: flex;
            align-items: center;
            justify-content: center;
            background: #e9ecef;
            border: 2px solid #adb5bd;
            border-radius: 4px;
            color: #495057;
        }
        .key-icon-large svg {
            width: 14px;
            height: 14px;
            stroke-width: 2.5;
        }
        .key-space {
            min-width: 50px;
            font-size: 0.65rem;
            font-weight: bold;
            letter-spacing: 0.5px;
        }
        .control-label {
            color: #495057;
            font-size: 0.75rem;
            font-weight: 500;
        }
        .game-buttons {
            display: flex;
            flex-direction: column;
            gap: 6px;
            margin-bottom: 0;
            margin-top: auto;
        }
        .tetris-leaderboard-panel .high-scores {
            margin-top: 0;
            padding-top: 0;
            flex: 1;
            display: flex;
            flex-direction: column;
        }
        .tetris-leaderboard-panel .high-scores h3 {
            display: none;
        }
        #tetris-high-scores {
            flex: 1;
            overflow-y: auto;
            overflow-x: hidden;
            min-height: 0;
            max-height: 100%;
        }
        .btn-primary {
            background: #007bff;
            color: white;
            border: 2px solid #0056b3;
            padding: 6px 12px;
            border-radius: 6px;
            font-size: 0.8rem;
            cursor: pointer;
            width: 100%;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 4px;
            font-weight: 600;
            transition: all 0.2s ease;
        }
        .btn-primary:hover {
            background: #0056b3;
            border-color: #004085;
        }
        .btn-primary i {
            width: 12px;
            height: 12px;
        }
        .btn-secondary {
            background: #6c757d;
            color: white;
            border: 2px solid #5a6268;
            padding: 6px 12px;
            border-radius: 6px;
            font-size: 0.8rem;
            cursor: pointer;
            width: 100%;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 4px;
            font-weight: 600;
            transition: all 0.2s ease;
        }
        .btn-secondary:hover {
            background: #5a6268;
            border-color: #495057;
        }
        .btn-secondary i {
            width: 12px;
            height: 12px;
        }
        .mode-selector {
            margin-bottom: 12px;
            padding: 10px;
            background: #ffffff;
            border: 2px solid #dee2e6;
            border-radius: 8px;
        }
        .mode-selector h4 {
            margin: 0 0 8px 0;
            font-size: 0.75rem;
            color: #495057;
            text-align: center;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            font-weight: 600;
        }
        .mode-buttons {
            display: flex;
            gap: 6px;
        }
        .mode-btn {
            flex: 1;
            padding: 6px 10px;
            border-radius: 6px;
            font-size: 0.75rem;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 4px;
            font-weight: 600;
            transition: all 0.2s ease;
            border: 2px solid #dee2e6;
            background: #ffffff;
            color: #495057;
        }
        .mode-btn:hover {
            background: #f8f9fa;
            border-color: #adb5bd;
        }
        .mode-btn.active {
            background: #007bff;
            color: white;
            border-color: #0056b3;
        }
        .mode-btn.active:hover {
            background: #0056b3;
            border-color: #004085;
        }
        .mode-btn i {
            width: 12px;
            height: 12px;
        }
        .high-scores {
            margin-top: 0;
            padding-top: 0;
        }
        .high-scores h3 {
            font-size: 0.8rem;
            margin-bottom: 8px;
            color: #495057;
            text-align: center;
        }
        .score-entry {
            display: block;
            padding: 4px 0;
            font-size: 0.7rem;
            border-bottom: 1px solid #dee2e6;
            line-height: 1.2;
        }
        .score-entry:last-child {
            border-bottom: none;
        }
        .score-entry:first-child {
            font-weight: 600;
        }
        .score-name {
            color: #495057;
            font-size: 0.7rem;
            display: block;
            margin-bottom: 2px;
            word-break: break-word;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        }
        .score-entry:first-child .score-name {
            color: #212529;
            font-weight: 600;
        }
        .score-value {
            color: #495057;
            font-weight: 500;
            font-size: 0.7rem;
            display: block;
            margin-left: 8px;
        }
        .score-entry:first-child .score-value {
            color: #212529;
            font-weight: 600;
        }
        .score-modal {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.85);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 10000;
        }
        .score-modal-content {
            background: #ffffff;
            border: 2px solid #dee2e6;
            padding: 40px;
            border-radius: 15px;
            max-width: 400px;
            width: 90%;
            text-align: center;
            box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
        }
        .score-modal-content h3 {
            margin-bottom: 20px;
            color: #495057;
            font-size: 1.3rem;
        }
        .score-modal-content p {
            color: #6c757d;
            margin-bottom: 15px;
        }
        .score-modal-content input {
            width: 100%;
            padding: 12px;
            font-size: 1rem;
            border: 2px solid #dee2e6;
            border-radius: 8px;
            margin-bottom: 20px;
            box-sizing: border-box;
            background: #ffffff;
            color: #495057;
        }
        .score-modal-content input:focus {
            outline: none;
            border-color: #007bff;
        }
        .score-modal-content button {
            background: #007bff;
            color: white;
            border: 2px solid #0056b3;
            padding: 12px 24px;
            border-radius: 8px;
            font-size: 1rem;
            cursor: pointer;
            margin: 5px;
            font-weight: 600;
            transition: all 0.2s ease;
        }
        .score-modal-content button:hover:not(:disabled) {
            background: #0056b3;
            border-color: #004085;
        }
        .score-modal-content button:disabled {
            background: rgba(128, 128, 128, 0.3);
            cursor: not-allowed;
            opacity: 0.7;
        }
        #save-status {
            min-height: 20px;
            color: #007bff;
            margin-top: 10px;
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
            .fps-indicator {
                top: 50px;
                right: 10px;
                font-size: 9px;
                padding: 4px 8px;
            }
            .tetris-game {
                flex-direction: column;
                gap: 10px;
                width: 100%;
                height: 100%;
                max-width: 100%;
            }
            .tetris-side-panel {
                width: 100%;
                flex-direction: row;
                justify-content: space-around;
                gap: 8px;
                order: 1;
            }
            .preview-box {
                flex: 1;
                min-width: 0;
            }
            #hold-canvas, #next-canvas {
                width: 100%;
                max-width: 80px;
            }
            .tetris-board {
                order: 2;
                width: 100%;
                flex-grow: 1;
            }
            #tetris-canvas {
                max-width: min(250px, calc(100vw - 20px));
                width: 100%;
                height: auto;
            }
            .tetris-right-panels {
                flex-direction: column;
                width: 100%;
                gap: 10px;
                order: 3;
            }
            .tetris-controls-panel, .tetris-leaderboard-panel {
                width: 100%;
            }
            .tetris-info {
                margin-top: 8px;
            }
            .info-item {
                font-size: 0.85rem;
            }
            .control-item {
                padding: 8px;
                font-size: 0.85rem;
            }
            .key-icon-large {
                width: 28px;
                height: 28px;
            }
            .btn-primary, .btn-secondary {
                padding: 10px;
                font-size: 0.85rem;
            }
            .score-entry {
                font-size: 0.75rem;
                padding: 6px 0;
            }
        }
        @media (max-width: 1024px) and (min-width: 769px) {
            .tetris-game {
                flex-wrap: wrap;
                gap: 15px;
            }
            .tetris-side-panel {
                width: 100%;
                flex-direction: row;
                justify-content: center;
            }
            .tetris-controls-panel {
                width: 100%;
            }
            #tetris-canvas {
                max-width: min(300px, calc(100vw - 40px));
            }
        }
    `;
    document.head.appendChild(style);
    
    // Initialize Lucide icons after DOM is ready
    setTimeout(() => {
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    }, 100);
    
    
    // Add restart function
    window.restartTetris = () => {
        // Hard reset to deep link (clears runtime state and caches via full reload)
        window.location.href = 'https://hakonag.github.io/boredgames/?game=tetris';
    };
    
    // Fullscreen toggle
    window.toggleFullscreenTetris = () => {
        if (tetrisGame) tetrisGame.toggleFullscreen();
    };
    
    // Add mute toggle function
    window.toggleMute = () => {
        if (tetrisGame) {
            tetrisGame.toggleMute();
        }
    };
    
    // Mode selector function
    window.setTetrisMode = (mode) => {
        const easyBtn = document.getElementById('mode-easy');
        const hardBtn = document.getElementById('mode-hard');
        if (easyBtn && hardBtn) {
            easyBtn.classList.toggle('active', mode === 'easy');
            hardBtn.classList.toggle('active', mode === 'hard');
        }
        if (typeof lucide !== 'undefined') lucide.createIcons();
        // If game exists, recreate it with new mode
        const wasPaused = tetrisGame && tetrisGame.isPaused;
        const wasRunning = tetrisGame && tetrisGame.animationFrameId;
        if (tetrisGame) {
            tetrisGame.removeControls();
            tetrisGame = null;
        }
        tetrisGame = new TetrisGame(mode);
        window.tetrisGame = tetrisGame;
        // Restore game state if it was running
        if (wasRunning && !wasPaused) {
            setTimeout(() => window.startTetris(), 100);
        }
    };
    
    // Initialize with easy mode
    tetrisGame = new TetrisGame('easy');
    window.tetrisGame = tetrisGame; // Store globally for cleanup
    window.startTetris = startTetris;
    window.pauseTetris = pauseTetris;
    
    // Load and display high scores (async) - handle promise properly
    displayHighScores('tetris-high-scores', 'tetris', 30).catch(err => console.log('Error loading scores:', err));
}

export function cleanup() {
    if (tetrisGame && tetrisGame.removeControls) {
        tetrisGame.removeControls();
    }
    tetrisGame = null;
    window.startTetris = null;
    window.pauseTetris = null;
}

function startTetris() {
    if (tetrisGame) tetrisGame.start();
}

function pauseTetris() {
    if (tetrisGame) tetrisGame.pause();
}

class TetrisGame {
    constructor(mode = 'easy') {
        this.canvas = document.getElementById('tetris-canvas');
        if (!this.canvas) {
            console.error('Tetris canvas not found!');
            return;
        }
        this.ctx = this.canvas.getContext('2d');
        this.grid = Array(20).fill().map(() => Array(10).fill(0));
        this.currentPiece = null;
        this.nextPiece = null;
        this.heldPiece = null;
        this.canHold = true;
        this.score = 0;
        this.lines = 0;
        this.mode = mode || 'easy';
        // Easy mode: start at level 1, Hard mode: start at level 5 (much faster)
        this.startLevel = this.mode === 'hard' ? 5 : 1;
        this.level = this.startLevel;
        this.gameLoop = null; // deprecated, kept for compatibility
        this.animationFrameId = null;
        this.lastTimestamp = 0;
        this.gravityAccumulatorMs = 0;
        this.cellSize = 30;
        this.fps = 60;
        this.fpsDisplayAccum = 0;
        this.isPaused = false;
        this.fallTime = 0;
        // Calculate initial fall interval based on starting level
        // Formula: max(100, 1000 - (level - 1) * 100)
        this.fallInterval = Math.max(100, 1000 - (this.startLevel - 1) * 100);
        this.isMuted = false;
        this.backgroundMusic = null;
        this.setupAudio();
        this.setupCanvasScaling();
        this.createGridCache();
        
        this.pieces = [
            [[1,1,1,1]], // I
            [[1,1],[1,1]], // O
            [[0,1,0],[1,1,1]], // T
            [[1,1,0],[0,1,1]], // S
            [[0,1,1],[1,1,0]], // Z
            [[1,0,0],[1,1,1]], // L
            [[0,0,1],[1,1,1]]  // J
        ];
        
        this.pieceColors = [
            'hsl(180, 70%, 50%)', // I - cyan
            'hsl(60, 70%, 50%)',  // O - yellow
            'hsl(270, 70%, 50%)', // T - purple
            'hsl(120, 70%, 50%)', // S - green
            'hsl(0, 70%, 50%)',   // Z - red
            'hsl(30, 70%, 50%)',  // L - orange
            'hsl(240, 70%, 50%)'  // J - blue
        ];
        
        this.setupControls();
        // Delay draw slightly to ensure canvas is ready
        setTimeout(() => {
            this.draw();
            this.drawPreviews();
            // Update level display with starting level
            const levelEl = document.getElementById('tetris-level');
            if (levelEl) levelEl.textContent = this.level;
        }, 10);
    }
    
    setupControls() {
        this.keyHandler = (e) => {
            // Prevent default for arrow keys and space when Tetris is active
            if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', ' '].includes(e.key)) {
                // Only prevent default if game is running (not paused and has a piece)
                if (this.currentPiece && !this.isPaused) {
                    e.preventDefault();
                }
            }
            
            // Handle hold (C or Shift)
            if ((e.key === 'c' || e.key === 'C' || e.key === 'Shift') && !this.isPaused && this.currentPiece) {
                this.holdPiece();
                return;
            }
            
            // Handle restart (R) → hard reload to deep link
            if (e.key === 'r' || e.key === 'R') {
                window.location.href = 'https://hakonag.github.io/boredgames/?game=tetris';
                return;
            }
            
            // Handle pause (P)
            if (e.key === 'p' || e.key === 'P') {
                if (this.isPaused) {
                    this.start();
                } else {
                    this.pause();
                }
                return;
            }
            
            // Handle start (S) when not started yet
            if (e.key === 's' || e.key === 'S') {
                if (!this.currentPiece) {
                    this.start();
                }
                return;
            }
            
            // Handle mute (M)
            if (e.key === 'm' || e.key === 'M') {
                this.toggleMute();
                return;
            }
            
            // Only handle movement keys when game is active
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
                    this.hardDrop();
                    break;
            }
        };
        
        document.addEventListener('keydown', this.keyHandler);
    }
    
    removeControls() {
        if (this.keyHandler) {
            document.removeEventListener('keydown', this.keyHandler);
        }
        // Stop and cleanup audio
        this.stopBackgroundMusic();
        if (this.backgroundMusic) {
            this.backgroundMusic = null;
        }
    }
    
    start() {
        // Initialize next piece if not already set
        if (!this.nextPiece) {
            const nextPieceIndex = Math.floor(Math.random() * this.pieces.length);
            this.nextPiece = {
                shape: this.pieces[nextPieceIndex],
                pieceIndex: nextPieceIndex,
                color: this.pieceColors[nextPieceIndex]
            };
        }
        this.spawnPiece();
        this.drawPreviews();
        // kick off RAF loop
        this.lastTimestamp = performance.now();
        if (!this.animationFrameId) {
            const bound = this.runLoop.bind(this);
            this.animationFrameId = requestAnimationFrame(bound);
        }
        
        document.getElementById('tetris-start-btn').style.display = 'none';
        document.getElementById('tetris-pause-btn').style.display = 'block';
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
        
        // Start background music if not muted
        this.playBackgroundMusic();
    }
    
    pause() {
        this.isPaused = !this.isPaused;
        const pauseBtn = document.getElementById('tetris-pause-btn');
        if (this.isPaused) {
            pauseBtn.innerHTML = '<i data-lucide="play"></i> Fortsett';
            // Pause music when game is paused
            if (this.backgroundMusic && !this.backgroundMusic.paused) {
                this.backgroundMusic.pause();
            }
        } else {
            pauseBtn.innerHTML = '<i data-lucide="pause"></i> Pause';
            // Resume music when game resumes
            this.playBackgroundMusic();
        }
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    }
    
    spawnPiece() {
        // Use next piece if available, otherwise generate new
        if (this.nextPiece) {
            this.currentPiece = {
                ...this.nextPiece,
                x: 3,
                y: 0
            };
        } else {
            const pieceIndex = Math.floor(Math.random() * this.pieces.length);
            this.currentPiece = {
                shape: this.pieces[pieceIndex],
                pieceIndex: pieceIndex,
                x: 3,
                y: 0,
                color: this.pieceColors[pieceIndex]
            };
        }
        
        // Generate next piece
        const nextPieceIndex = Math.floor(Math.random() * this.pieces.length);
        this.nextPiece = {
            shape: this.pieces[nextPieceIndex],
            pieceIndex: nextPieceIndex,
            color: this.pieceColors[nextPieceIndex]
        };
        
        this.canHold = true; // Reset hold flag
        
        if (this.checkCollision(this.currentPiece)) {
            this.gameOver();
        }
        
        this.drawPreviews();
    }
    
    holdPiece() {
        if (!this.canHold || !this.currentPiece) return;
        
        // Swap current and held pieces
        const temp = this.heldPiece;
        this.heldPiece = {
            shape: this.currentPiece.shape,
            pieceIndex: this.currentPiece.pieceIndex,
            color: this.currentPiece.color
        };
        
        if (temp) {
            // Place held piece as current
            this.currentPiece = {
                ...temp,
                x: 3,
                y: 0
            };
        } else {
            // Get next piece as current
            if (this.nextPiece) {
                this.currentPiece = {
                    ...this.nextPiece,
                    x: 3,
                    y: 0
                };
                // Generate new next piece
                const nextPieceIndex = Math.floor(Math.random() * this.pieces.length);
                this.nextPiece = {
                    shape: this.pieces[nextPieceIndex],
                    pieceIndex: nextPieceIndex,
                    color: this.pieceColors[nextPieceIndex]
                };
            } else {
                this.spawnPiece();
            }
        }
        
        this.canHold = false; // Can't hold again until next piece is placed
        this.drawPreviews();
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
            // Level increases every 10 lines, but always at least the starting level
            this.level = Math.max(this.startLevel, Math.floor(this.lines / 10) + 1);
            this.fallInterval = Math.max(100, 1000 - (this.level - 1) * 100);
            
            const scoreEl = document.getElementById('tetris-score');
            const linesEl = document.getElementById('tetris-lines');
            const levelEl = document.getElementById('tetris-level');
            if (scoreEl) scoreEl.textContent = this.score.toLocaleString();
            if (linesEl) linesEl.textContent = this.lines;
            if (levelEl) levelEl.textContent = this.level;
        }
    }
    
    runLoop(timestamp) {
        // schedule next frame first to keep steady
        this.animationFrameId = requestAnimationFrame(this.runLoop.bind(this));
        const delta = Math.min(32, timestamp - this.lastTimestamp); // clamp to avoid huge jumps
        this.lastTimestamp = timestamp;
        if (!this.isPaused) {
            this.gravityAccumulatorMs += delta;
            while (this.gravityAccumulatorMs >= this.fallInterval) {
                this.movePiece(0, 1);
                this.gravityAccumulatorMs -= this.fallInterval;
            }
        }
        // FPS smoothing and display (update ~4x per second)
        if (delta > 0) this.fps = this.fps * 0.9 + (1000 / delta) * 0.1;
        this.fpsDisplayAccum += delta;
        if (this.fpsDisplayAccum >= 250) {
            const el = document.getElementById('tetris-fps');
            if (el) el.textContent = `${Math.round(this.fps)} fps`;
            this.fpsDisplayAccum = 0;
        }
        this.draw();
    }
    
    getGhostPosition() {
        if (!this.currentPiece) return null;
        
        let ghostY = this.currentPiece.y;
        while (true) {
            const testPiece = {
                ...this.currentPiece,
                y: ghostY + 1
            };
            if (this.checkCollision(testPiece)) {
                break;
            }
            ghostY++;
        }
        
        return {
            ...this.currentPiece,
            y: ghostY
        };
    }
    
    draw() {
        // clear and draw cached grid
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(0, 0, 300, 600);
        if (this.gridCacheCanvas) {
            this.ctx.drawImage(this.gridCacheCanvas, 0, 0, 300, 600);
        }
        
        const cellSize = this.cellSize;
        // Draw placed blocks
        for (let y = 0; y < 20; y++) {
            for (let x = 0; x < 10; x++) {
                if (this.grid[y][x]) {
                    this.ctx.fillStyle = this.grid[y][x];
                    this.ctx.fillRect(x * cellSize + 1, y * cellSize + 1, cellSize - 2, cellSize - 2);
                    
                    // Add border to placed blocks
                    this.ctx.strokeStyle = '#fff';
                    this.ctx.lineWidth = 1;
                    this.ctx.strokeRect(x * cellSize + 1, y * cellSize + 1, cellSize - 2, cellSize - 2);
                }
            }
        }
        
        // Draw ghost piece (shadow)
        if (this.currentPiece) {
            const ghostPiece = this.getGhostPosition();
            if (ghostPiece && ghostPiece.y !== this.currentPiece.y) {
                this.ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
                this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
                this.ctx.lineWidth = 2;
                
                for (let y = 0; y < ghostPiece.shape.length; y++) {
                    for (let x = 0; x < ghostPiece.shape[y].length; x++) {
                        if (ghostPiece.shape[y][x]) {
                            const px = (ghostPiece.x + x) * cellSize;
                            const py = (ghostPiece.y + y) * cellSize;
                            if (py >= 0) {
                                // Draw ghost with outline only
                                this.ctx.strokeRect(px + 1, py + 1, cellSize - 2, cellSize - 2);
                            }
                        }
                    }
                }
            }
            
            // Draw current piece
            this.ctx.fillStyle = this.currentPiece.color;
            this.ctx.strokeStyle = '#fff';
            this.ctx.lineWidth = 2;
            
            for (let y = 0; y < this.currentPiece.shape.length; y++) {
                for (let x = 0; x < this.currentPiece.shape[y].length; x++) {
                    if (this.currentPiece.shape[y][x]) {
                        const px = (this.currentPiece.x + x) * cellSize;
                        const py = (this.currentPiece.y + y) * cellSize;
                        if (py >= 0) {
                            this.ctx.fillRect(px + 1, py + 1, cellSize - 2, cellSize - 2);
                            this.ctx.strokeRect(px + 1, py + 1, cellSize - 2, cellSize - 2);
                        }
                    }
                }
            }
        }
    }

    setupCanvasScaling() {
        const dpr = Math.max(1, window.devicePixelRatio || 1);
        // logical size is 300x600
        this.canvas.width = 300 * dpr;
        this.canvas.height = 600 * dpr;
        this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    createGridCache() {
        const dpr = 1; // draw at logical size; main ctx scaling handles DPI
        const w = 300;
        const h = 600;
        this.gridCacheCanvas = document.createElement('canvas');
        this.gridCacheCanvas.width = w * dpr;
        this.gridCacheCanvas.height = h * dpr;
        const gctx = this.gridCacheCanvas.getContext('2d');
        gctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        // draw grid lines once
        gctx.strokeStyle = '#1a1a1a';
        gctx.lineWidth = 1;
        for (let x = 0; x <= 10; x++) {
            gctx.beginPath();
            gctx.moveTo(x * this.cellSize, 0);
            gctx.lineTo(x * this.cellSize, h);
            gctx.stroke();
        }
        for (let y = 0; y <= 20; y++) {
            gctx.beginPath();
            gctx.moveTo(0, y * this.cellSize);
            gctx.lineTo(w, y * this.cellSize);
            gctx.stroke();
        }
    }

    toggleFullscreen() {
        // No-op now that the arcade frame UI is removed; kept for compatibility
    }
    
    drawPreviews() {
        // Draw next piece
        const nextCanvas = document.getElementById('next-canvas');
        if (nextCanvas && this.nextPiece) {
            const ctx = nextCanvas.getContext('2d');
            ctx.fillStyle = '#000';
            ctx.fillRect(0, 0, nextCanvas.width, nextCanvas.height);
            
            if (this.nextPiece) {
                this.drawPiecePreview(ctx, this.nextPiece, nextCanvas.width, nextCanvas.height);
            }
        }
        
        // Draw held piece
        const holdCanvas = document.getElementById('hold-canvas');
        if (holdCanvas) {
            const ctx = holdCanvas.getContext('2d');
            ctx.fillStyle = '#000';
            ctx.fillRect(0, 0, holdCanvas.width, holdCanvas.height);
            
            if (this.heldPiece) {
                this.drawPiecePreview(ctx, this.heldPiece, holdCanvas.width, holdCanvas.height);
            }
        }
    }
    
    drawPiecePreview(ctx, piece, canvasWidth, canvasHeight) {
        const shape = piece.shape;
        const cellSize = 20;
        const shapeWidth = shape[0].length;
        const shapeHeight = shape.length;
        
        // Center the piece
        const offsetX = (canvasWidth - shapeWidth * cellSize) / 2;
        const offsetY = (canvasHeight - shapeHeight * cellSize) / 2;
        
        ctx.fillStyle = piece.color;
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 1;
        
        for (let y = 0; y < shapeHeight; y++) {
            for (let x = 0; x < shapeWidth; x++) {
                if (shape[y][x]) {
                    const px = offsetX + x * cellSize;
                    const py = offsetY + y * cellSize;
                    ctx.fillRect(px + 1, py + 1, cellSize - 2, cellSize - 2);
                    ctx.strokeRect(px + 1, py + 1, cellSize - 2, cellSize - 2);
                }
            }
        }
    }
    
    gameOver() {
        // Stop game loop and input to avoid laggy post-game state
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
        this.isPaused = true;
        const finalScore = this.score;
        // Pause music during modal
        if (this.backgroundMusic && !this.backgroundMusic.paused) this.backgroundMusic.pause();
        if (finalScore > 0) {
            showScoreModal('tetris', finalScore, 
                () => {
                    setTimeout(() => { this.reset(); }, 100);
                },
                () => {
                    setTimeout(() => { this.reset(); }, 100);
                }
            );
        } else {
            setTimeout(() => {
                this.reset();
            }, 1000);
        }
    }
    
    reset() {
        this.grid = Array(20).fill().map(() => Array(10).fill(0));
        this.score = 0;
        this.lines = 0;
        this.level = this.startLevel;
        this.fallTime = 0;
        // Reset fall interval based on starting level
        this.fallInterval = Math.max(100, 1000 - (this.startLevel - 1) * 100);
        this.currentPiece = null;
        this.nextPiece = null;
        this.heldPiece = null;
        this.canHold = true;
        this.isPaused = false;
        this.isMuted = false;
        const scoreEl = document.getElementById('tetris-score');
        const linesEl = document.getElementById('tetris-lines');
        const levelEl = document.getElementById('tetris-level');
        if (scoreEl) scoreEl.textContent = '0';
        if (linesEl) linesEl.textContent = '0';
        if (levelEl) levelEl.textContent = String(this.startLevel);
        document.getElementById('tetris-start-btn').style.display = 'block';
        document.getElementById('tetris-pause-btn').style.display = 'none';
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
        clearInterval(this.gameLoop);
        this.draw();
        this.drawPreviews();
        this.updateMuteButton();
        this.stopBackgroundMusic();
    }
    
    setupAudio() {
        // Try to load background music
        try {
            this.backgroundMusic = new Audio('games/tetris/assets/tetris-theme.wav');
            this.backgroundMusic.loop = true;
            this.backgroundMusic.volume = 0.3; // 30% volume for background music
            this.backgroundMusic.preload = 'auto';
            
            // Handle errors gracefully (file might not exist yet)
            this.backgroundMusic.addEventListener('error', (e) => {
                console.log('Background music file not found. You can add a file at games/tetris/assets/tetris-theme.wav');
                this.backgroundMusic = null;
            });
        } catch (error) {
            console.log('Could not initialize audio:', error);
            this.backgroundMusic = null;
        }
    }
    
    playBackgroundMusic() {
        if (this.backgroundMusic && !this.isMuted) {
            this.backgroundMusic.play().catch(err => {
                console.log('Could not play background music:', err);
            });
        }
    }
    
    stopBackgroundMusic() {
        if (this.backgroundMusic) {
            this.backgroundMusic.pause();
            this.backgroundMusic.currentTime = 0;
        }
    }
    
    updateMuteButton() {
        const muteBtn = document.getElementById('mute-btn');
        if (muteBtn) {
            const icon = muteBtn.querySelector('i');
            if (icon) {
                if (this.isMuted) {
                    icon.setAttribute('data-lucide', 'volume-x');
                } else {
                    icon.setAttribute('data-lucide', 'volume-2');
                }
                if (typeof lucide !== 'undefined') {
                    lucide.createIcons();
                }
            }
        }
    }
    
    toggleMute() {
        this.isMuted = !this.isMuted;
        
        // Control background music based on mute state
        if (this.backgroundMusic) {
            if (this.isMuted) {
                this.backgroundMusic.pause();
            } else if (this.currentPiece || this.isPaused) {
                // Only play if game is active
                this.backgroundMusic.play().catch(err => {
                    console.log('Could not play music:', err);
                });
            }
        }
        
        this.updateMuteButton();
    }
}
