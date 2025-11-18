// Tetris Game Module
import { createBackButton } from '../../core/gameUtils.js';
import { getHighScores, showScoreModal } from '../../core/highScores.js';

let tetrisGame = null;

// Global mute state management
const GLOBAL_MUTE_KEY = 'tetrisGlobalMute';
function getGlobalMuteState() {
    const stored = localStorage.getItem(GLOBAL_MUTE_KEY);
    return stored === 'true';
}
function setGlobalMuteState(isMuted) {
    localStorage.setItem(GLOBAL_MUTE_KEY, String(isMuted));
}

// Global theme state management
const GLOBAL_THEME_KEY = 'tetrisGlobalTheme';
function getGlobalTheme() {
    const stored = localStorage.getItem(GLOBAL_THEME_KEY);
    return stored || 'light';
}
function setGlobalTheme(theme) {
    localStorage.setItem(GLOBAL_THEME_KEY, theme);
    document.documentElement.setAttribute('data-theme', theme);
}

export function init() {
    // Initialize theme
    const currentTheme = getGlobalTheme();
    document.documentElement.setAttribute('data-theme', currentTheme);
    
    const gameContent = document.getElementById('game-content');
    gameContent.innerHTML = createBackButton() + `
        <div class="theme-toggle-container">
            <button onclick="window.toggleTetrisTheme()" id="theme-toggle-btn" class="theme-toggle-btn">
                <i data-lucide="${currentTheme === 'dark' ? 'sun-medium' : 'moon'}" id="theme-icon"></i>
            </button>
        </div>
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
                    <div class="mode-selector-inline">
                        <button onclick="window.toggleTetrisMode()" id="mode-toggle" class="mode-toggle-btn">
                            <i data-lucide="feather" id="mode-icon"></i>
                            <span id="mode-text">Lett</span>
                        </button>
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
                    <div class="leaderboard-pagination-controls">
                        <button onclick="window.tetrisLeaderboardPrev()" id="leaderboard-prev-btn" class="pagination-btn">
                            <i data-lucide="chevron-left"></i>
                        </button>
                        <span id="leaderboard-page-info" class="page-info"></span>
                        <button onclick="window.tetrisLeaderboardNext()" id="leaderboard-next-btn" class="pagination-btn">
                            <i data-lucide="chevron-right"></i>
                        </button>
                    </div>
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
            background: #ffffff !important;
            transition: background 0.3s ease;
        }
        html {
            overflow: hidden !important;
        }
        [data-theme="dark"] body {
            background: #000000 !important;
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
            transition: background 0.3s ease;
        }
        /* Dark mode background with starry night */
        [data-theme="dark"] .game-container {
            background: #000000;
        }
        [data-theme="dark"] .game-container::before {
            content: '';
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: 
                radial-gradient(2px 2px at 20% 30%, #fff, transparent),
                radial-gradient(2px 2px at 60% 70%, #fff, transparent),
                radial-gradient(1px 1px at 50% 50%, #fff, transparent),
                radial-gradient(1px 1px at 80% 10%, #fff, transparent),
                radial-gradient(2px 2px at 90% 40%, #fff, transparent),
                radial-gradient(1px 1px at 33% 60%, #fff, transparent),
                radial-gradient(1px 1px at 15% 80%, #fff, transparent),
                radial-gradient(2px 2px at 55% 15%, #fff, transparent),
                radial-gradient(1px 1px at 25% 50%, #fff, transparent),
                radial-gradient(1px 1px at 75% 25%, #fff, transparent),
                radial-gradient(2px 2px at 40% 90%, #fff, transparent),
                radial-gradient(1px 1px at 10% 20%, #fff, transparent),
                radial-gradient(1px 1px at 70% 60%, #fff, transparent),
                radial-gradient(2px 2px at 85% 80%, #fff, transparent),
                radial-gradient(1px 1px at 45% 10%, #fff, transparent);
            background-size: 200% 200%;
            background-position: 0% 0%, 100% 0%, 50% 50%, 0% 100%, 100% 100%, 50% 0%, 0% 50%, 100% 50%, 25% 25%, 75% 75%, 50% 100%, 0% 0%, 100% 100%, 50% 50%, 25% 75%;
            animation: twinkle 20s linear infinite;
            pointer-events: none;
            z-index: 0;
        }
        @keyframes twinkle {
            0%, 100% { opacity: 0.8; }
            50% { opacity: 1; }
        }
        [data-theme="dark"] .game-container > * {
            position: relative;
            z-index: 1;
        }
        /* Theme toggle button */
        .theme-toggle-container {
            position: fixed;
            top: 10px;
            right: 10px;
            z-index: 10001;
        }
        .theme-toggle-btn {
            background: #f8f9fa;
            color: #111;
            border: 2px solid #dee2e6;
            padding: 8px;
            border-radius: 0;
            cursor: pointer;
            transition: all 0.3s ease;
            display: flex;
            align-items: center;
            justify-content: center;
            width: 40px;
            height: 40px;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }
        .theme-toggle-btn:hover {
            background: #e9ecef;
            border-color: #111;
            transform: scale(1.05);
        }
        [data-theme="dark"] .theme-toggle-btn {
            background: #1a1a1a;
            color: #fff;
            border-color: #444;
            border-width: 2px;
        }
        [data-theme="dark"] .theme-toggle-btn:hover {
            background: #2a2a2a;
            border-color: #666;
        }
        .theme-toggle-btn i {
            width: 20px;
            height: 20px;
            stroke-width: 2;
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
        /* Ensure back button is positioned correctly */
        .back-button-shared {
            position: fixed !important;
            top: 10px !important;
            left: 10px !important;
            background: #f8f9fa !important;
            color: #111 !important;
            border: 2px solid #dee2e6 !important;
            padding: 8px 12px !important;
            border-radius: 0 !important;
            font-size: 0.875rem !important;
            font-weight: 600 !important;
            cursor: pointer !important;
            transition: all 0.2s ease !important;
            z-index: 10000 !important;
            display: flex !important;
            align-items: center !important;
            gap: 6px !important;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1) !important;
            margin: 0 !important;
        }
        .back-button-shared:hover {
            background: #e9ecef !important;
            border-color: #111 !important;
        }
        .back-button-shared i {
            width: 16px !important;
            height: 16px !important;
            stroke-width: 2 !important;
        }
        /* Apply clean grotesk-style font to Tetris page */
        .game-container #game-content, 
        .game-container #game-content * {
            font-family: system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol" !important;
        }
        .tetris-game {
            display: flex;
            gap: 15px;
            justify-content: center;
            align-items: stretch;
            width: 100%;
            max-width: min(1200px, 95vw);
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
            border-radius: 0;
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
            border-radius: 0;
            width: 180px;
            flex-shrink: 0;
            box-sizing: border-box;
            display: flex;
            flex-direction: column;
        }
        [data-theme="dark"] .tetris-controls-panel {
            background: #1a1a1a;
            border-color: #444;
            border-width: 2px;
        }
        [data-theme="dark"] .tetris-controls-panel h3 {
            color: #fff;
        }
        [data-theme="dark"] .control-item {
            background: #2a2a2a;
            border-color: #444;
            border-width: 1px;
        }
        [data-theme="dark"] .control-label {
            color: #ddd;
        }
        [data-theme="dark"] .preview-box {
            background: #1a1a1a;
            border-color: #444;
            border-width: 2px;
        }
        [data-theme="dark"] .preview-box h4 {
            color: #fff;
        }
        [data-theme="dark"] .back-button-shared {
            background: #1a1a1a !important;
            color: #fff !important;
            border-color: #444 !important;
            border-width: 2px !important;
        }
        [data-theme="dark"] .back-button-shared:hover {
            background: #2a2a2a !important;
            border-color: #666 !important;
        }
        [data-theme="dark"] .fps-indicator {
            background: #1a1a1a;
            color: #aaa;
            border-color: #444;
            border-width: 2px;
        }
        .tetris-leaderboard-panel {
            padding: 12px;
            background: #f8f9fa;
            border: 2px solid #dee2e6;
            border-radius: 0;
            width: 180px;
            flex-shrink: 0;
            box-sizing: border-box;
            display: flex;
            flex-direction: column;
            min-height: 0;
            max-height: 100%;
            gap: 8px;
        }
        [data-theme="dark"] .tetris-leaderboard-panel {
            background: #1a1a1a;
            border-color: #444;
            border-width: 2px;
        }
        .leaderboard-pagination-controls {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            margin-bottom: 0;
            padding: 6px 4px;
            border-bottom: 1px solid #dee2e6;
        }
        [data-theme="dark"] .leaderboard-pagination-controls {
            border-bottom-color: #444;
            border-bottom-width: 1px;
        }
        .pagination-btn {
            background: #e9ecef;
            color: #495057;
            border: 1px solid #adb5bd;
            padding: 4px 8px;
            border-radius: 0;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            width: 24px;
            height: 24px;
            transition: all 0.2s ease;
            opacity: 1;
        }
        .pagination-btn:hover:not(:disabled) {
            background: #dee2e6;
            border-color: #495057;
        }
        .pagination-btn:disabled {
            opacity: 0.4;
            cursor: not-allowed;
        }
        [data-theme="dark"] .pagination-btn {
            background: #2a2a2a;
            color: #fff;
            border-color: #555;
            border-width: 1px;
        }
        [data-theme="dark"] .pagination-btn:hover:not(:disabled) {
            background: #3a3a3a;
            border-color: #777;
        }
        [data-theme="dark"] .pagination-btn:disabled {
            opacity: 0.3;
        }
        .pagination-btn i {
            width: 14px;
            height: 14px;
        }
        .page-info {
            display: none;
        }
        .preview-box {
            background: #f8f9fa;
            border: 2px solid #dee2e6;
            border-radius: 0;
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
            border-radius: 0;
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
            border-radius: 0;
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
            max-width: min(300px, calc(95vw - 400px));
            height: auto;
            aspect-ratio: 1 / 2;
        }
        .tetris-info {
            display: flex;
            flex-direction: column;
            gap: 8px;
            margin-top: 10px;
            padding: 12px;
            background: #f8f9fa;
            border-radius: 0;
            border: 3px solid #007bff;
            box-shadow: 0 4px 8px rgba(0, 123, 255, 0.2);
            font-weight: 600;
        }
        [data-theme="dark"] .tetris-info {
            background: #1a1a1a;
            border-color: #4a9eff;
            border-width: 3px;
            box-shadow: 0 4px 8px rgba(74, 158, 255, 0.3);
        }
        .info-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 3px 0;
        }
        .info-label {
            color: #6c757d;
            font-size: 0.75rem;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            font-weight: 600;
        }
        [data-theme="dark"] .info-label {
            color: #aaa;
        }
        .info-value {
            color: #212529;
            font-size: 1.1rem;
            font-weight: bold;
        }
        [data-theme="dark"] .info-value {
            color: #fff;
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
        [data-theme="dark"] .tetris-leaderboard-panel h3 {
            color: #fff;
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
            border-radius: 0;
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
            border-radius: 0;
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
            min-height: 0;
            overflow: hidden;
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
            padding-right: 2px; /* Add small padding for scrollbar */
            display: flex;
            flex-direction: column;
        }
        .btn-primary {
            background: #007bff;
            color: white;
            border: 2px solid #0056b3;
            padding: 6px 12px;
            border-radius: 0;
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
            border-radius: 0;
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
        .mode-selector-inline {
            margin-top: 10px;
            padding-top: 10px;
            border-top: 1px solid #dee2e6;
        }
        .mode-toggle-btn {
            width: 100%;
            padding: 8px 12px;
            border-radius: 0;
            font-size: 0.75rem;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 6px;
            font-weight: 600;
            transition: all 0.2s ease;
            border: 2px solid #dee2e6;
            background: #ffffff;
            color: #495057;
        }
        .mode-toggle-btn:hover {
            background: #f8f9fa;
            border-color: #adb5bd;
        }
        .mode-toggle-btn i {
            width: 14px;
            height: 14px;
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
            display: flex;
            flex-direction: column;
            padding: 6px 6px;
            font-size: 0.85rem;
            border-bottom: 1px solid #dee2e6;
            line-height: 1.3;
            gap: 2px;
            flex-shrink: 0;
        }
        [data-theme="dark"] .score-entry {
            border-bottom-color: #444;
            border-bottom-width: 1px;
        }
        .score-entry:last-child {
            border-bottom: none;
        }
        /* Gold medal styling for 1st place */
        .score-entry-gold {
            background: linear-gradient(135deg, rgba(255, 215, 0, 0.15) 0%, rgba(255, 223, 0, 0.1) 100%);
            border-left: 3px solid #ffd700;
            box-shadow: 0 0 8px rgba(255, 215, 0, 0.3);
            font-weight: 600;
        }
        [data-theme="dark"] .score-entry-gold {
            background: linear-gradient(135deg, rgba(255, 215, 0, 0.2) 0%, rgba(255, 223, 0, 0.15) 100%);
            box-shadow: 0 0 12px rgba(255, 215, 0, 0.4);
        }
        .score-entry-gold .score-name {
            color: #b8860b;
            font-weight: 600;
        }
        [data-theme="dark"] .score-entry-gold .score-name {
            color: #ffd700;
        }
        .score-entry-gold .score-value {
            color: #daa520;
            font-weight: 700;
        }
        [data-theme="dark"] .score-entry-gold .score-value {
            color: #ffd700;
        }
        /* Silver medal styling for 2nd place */
        .score-entry-silver {
            background: linear-gradient(135deg, rgba(192, 192, 192, 0.15) 0%, rgba(211, 211, 211, 0.1) 100%);
            border-left: 3px solid #c0c0c0;
            box-shadow: 0 0 6px rgba(192, 192, 192, 0.25);
            font-weight: 600;
        }
        [data-theme="dark"] .score-entry-silver {
            background: linear-gradient(135deg, rgba(192, 192, 192, 0.2) 0%, rgba(211, 211, 211, 0.15) 100%);
            box-shadow: 0 0 10px rgba(192, 192, 192, 0.35);
        }
        .score-entry-silver .score-name {
            color: #808080;
            font-weight: 600;
        }
        [data-theme="dark"] .score-entry-silver .score-name {
            color: #c0c0c0;
        }
        .score-entry-silver .score-value {
            color: #a9a9a9;
            font-weight: 700;
        }
        [data-theme="dark"] .score-entry-silver .score-value {
            color: #c0c0c0;
        }
        /* Bronze medal styling for 3rd place */
        .score-entry-bronze {
            background: linear-gradient(135deg, rgba(205, 127, 50, 0.15) 0%, rgba(184, 115, 51, 0.1) 100%);
            border-left: 3px solid #cd7f32;
            box-shadow: 0 0 6px rgba(205, 127, 50, 0.25);
            font-weight: 600;
        }
        [data-theme="dark"] .score-entry-bronze {
            background: linear-gradient(135deg, rgba(205, 127, 50, 0.2) 0%, rgba(184, 115, 51, 0.15) 100%);
            box-shadow: 0 0 10px rgba(205, 127, 50, 0.35);
        }
        .score-entry-bronze .score-name {
            color: #8b4513;
            font-weight: 600;
        }
        [data-theme="dark"] .score-entry-bronze .score-name {
            color: #cd7f32;
        }
        .score-entry-bronze .score-value {
            color: #a0522d;
            font-weight: 700;
        }
        [data-theme="dark"] .score-entry-bronze .score-value {
            color: #cd7f32;
        }
        .score-name {
            color: #495057;
            font-size: 0.9rem;
            display: block;
            margin-bottom: 0;
            word-break: break-word;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
            font-weight: 500;
        }
        [data-theme="dark"] .score-name {
            color: #ddd;
        }
        .score-value {
            color: #495057;
            font-weight: 600;
            font-size: 0.95rem;
            display: block;
            margin-left: 0;
            text-align: right;
        }
        [data-theme="dark"] .score-value {
            color: #bbb;
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
            border-radius: 0;
            max-width: min(400px, calc(95vw - 40px));
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
            border-radius: 0;
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
            border-radius: 0;
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
    
    // Add mute toggle function (global)
    window.toggleMute = () => {
        if (tetrisGame) {
            tetrisGame.toggleMute();
        }
    };
    
    // Theme toggle function
    window.toggleTetrisTheme = () => {
        const currentTheme = getGlobalTheme();
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        setGlobalTheme(newTheme);
        
        const themeIcon = document.getElementById('theme-icon');
        if (themeIcon) {
            themeIcon.setAttribute('data-lucide', newTheme === 'dark' ? 'sun-medium' : 'moon');
            if (typeof lucide !== 'undefined') lucide.createIcons();
        }
    };
    
    // Leaderboard pagination functions
    let currentLeaderboardPage = 0;
    const scoresPerPage = 10;
    const maxScores = 100;
    
    window.tetrisLeaderboardPrev = () => {
        if (currentLeaderboardPage > 0) {
            currentLeaderboardPage--;
            displayTetrisLeaderboard(currentLeaderboardPage);
        }
    };
    
    window.tetrisLeaderboardNext = () => {
        const maxPage = Math.ceil(Math.min(maxScores, window.tetrisAllScores?.length || 0) / scoresPerPage) - 1;
        if (currentLeaderboardPage < maxPage) {
            currentLeaderboardPage++;
            displayTetrisLeaderboard(currentLeaderboardPage);
        }
    };
    
    async function displayTetrisLeaderboard(page = 0) {
        const scoresContainer = document.getElementById('tetris-high-scores');
        const prevBtn = document.getElementById('leaderboard-prev-btn');
        const nextBtn = document.getElementById('leaderboard-next-btn');
        const pageInfo = document.getElementById('leaderboard-page-info');
        
        if (!scoresContainer) return;
        
        try {
            const allScores = await getHighScores('tetris');
            window.tetrisAllScores = allScores;
            
            const totalScores = Math.min(maxScores, allScores.length);
            const maxPage = Math.ceil(totalScores / scoresPerPage) - 1;
            const startIdx = page * scoresPerPage;
            // Calculate end index: start + scoresPerPage, but not more than total
            const endIdx = Math.min(startIdx + scoresPerPage, totalScores);
            // Slice to get the scores for this page (endIdx is exclusive)
            const displayScores = allScores.slice(startIdx, endIdx);
            
            // Debug: ensure we're getting the right number of scores
            if (displayScores.length !== Math.min(scoresPerPage, totalScores - startIdx)) {
                console.warn(`Expected ${Math.min(scoresPerPage, totalScores - startIdx)} scores, got ${displayScores.length}`);
            }
            
            if (displayScores.length === 0) {
                scoresContainer.innerHTML = '<p style="color: #999; font-size: 0.85rem;">Ingen scores ennå</p>';
                prevBtn.style.display = 'flex';
                nextBtn.style.display = 'flex';
                prevBtn.disabled = true;
                nextBtn.disabled = true;
                pageInfo.textContent = '';
                return;
            }
            
            scoresContainer.innerHTML = displayScores.map((entry, index) => {
                const rank = startIdx + index + 1;
                let medalClass = '';
                if (rank === 1) medalClass = 'score-entry-gold';
                else if (rank === 2) medalClass = 'score-entry-silver';
                else if (rank === 3) medalClass = 'score-entry-bronze';
                return `
                <div class="score-entry ${medalClass}">
                    <div class="score-name">${rank}. ${entry.name}</div>
                    <div class="score-value">${entry.score.toLocaleString().replace(/\s/g, '&nbsp;')}</div>
                </div>
            `;
            }).join('');
            
            // Update pagination controls - always show buttons
            prevBtn.style.display = 'flex';
            nextBtn.style.display = 'flex';
            // Disable buttons when at boundaries
            prevBtn.disabled = page === 0;
            nextBtn.disabled = page >= maxPage;
            // Hide page info (removed per user request)
            pageInfo.textContent = '';
            
        } catch (err) {
            console.error('Error displaying scores:', err);
            scoresContainer.innerHTML = '<p style="color: #999; font-size: 0.85rem;">Kunne ikke laste scores</p>';
        }
    }
    
    // Mode toggle function
    window.toggleTetrisMode = () => {
        if (!tetrisGame) return;
        
        // Get current mode and toggle it
        const currentMode = tetrisGame.mode || 'easy';
        const newMode = currentMode === 'easy' ? 'hard' : 'easy';
        
        // Update toggle button
        const modeToggle = document.getElementById('mode-toggle');
        const modeIcon = document.getElementById('mode-icon');
        const modeText = document.getElementById('mode-text');
        
        if (modeToggle && modeIcon && modeText) {
            if (newMode === 'easy') {
                modeIcon.setAttribute('data-lucide', 'feather');
                modeText.textContent = 'Lett';
            } else {
                modeIcon.setAttribute('data-lucide', 'flame');
                modeText.textContent = 'Vanskelig';
            }
            if (typeof lucide !== 'undefined') lucide.createIcons();
        }
        
        // Hard reset game with new mode
        if (tetrisGame) {
            tetrisGame.removeControls();
            tetrisGame = null;
        }
        tetrisGame = new TetrisGame(newMode);
        window.tetrisGame = tetrisGame;
        
        // Reset all game state
        document.getElementById('tetris-score').textContent = '0';
        document.getElementById('tetris-lines').textContent = '0';
        document.getElementById('tetris-level').textContent = String(newMode === 'hard' ? 5 : 1);
        document.getElementById('tetris-start-btn').style.display = 'block';
        document.getElementById('tetris-pause-btn').style.display = 'none';
    };
    
    // Initialize with easy mode
    tetrisGame = new TetrisGame('easy');
    window.tetrisGame = tetrisGame; // Store globally for cleanup
    window.startTetris = startTetris;
    window.pauseTetris = pauseTetris;
    
    // Load and display high scores with pagination
    displayTetrisLeaderboard(0).catch(err => console.log('Error loading scores:', err));
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
        // Use global mute state
        this.isMuted = getGlobalMuteState();
        this.backgroundMusic = null;
        this.setupAudio();
        this.initializeLevelPalettes();
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
        
        // Base piece colors (will be modified by level palette)
        this.basePieceColors = [
            'hsl(180, 70%, 50%)', // I - cyan
            'hsl(60, 70%, 50%)',  // O - yellow
            'hsl(270, 70%, 50%)', // T - purple
            'hsl(120, 70%, 50%)', // S - green
            'hsl(0, 70%, 50%)',   // Z - red
            'hsl(30, 70%, 50%)',  // L - orange
            'hsl(240, 70%, 50%)'  // J - blue
        ];
        this.pieceColors = [...this.basePieceColors];
        
        this.setupControls();
        // Delay draw slightly to ensure canvas is ready
        setTimeout(() => {
            this.updateLevelPalette();
            this.draw();
            this.drawPreviews();
            // Update level display with starting level
            const levelEl = document.getElementById('tetris-level');
            if (levelEl) levelEl.textContent = this.level;
            // Update mute button to reflect global state
            this.updateMuteButton();
        }, 10);
    }
    
    initializeLevelPalettes() {
        // Create 30 unique color palettes for levels 1-30, then cycle
        this.levelPalettes = [];
        for (let i = 0; i < 30; i++) {
            const hueShift = (i * 12) % 360; // Rotate through hue spectrum
            const saturation = 60 + (i % 3) * 10; // Vary saturation 60-80%
            const lightness = 45 + (i % 4) * 5; // Vary lightness 45-60%
            
            const palette = [
                `hsl(${(hueShift + 180) % 360}, ${saturation}%, ${lightness}%)`, // I
                `hsl(${(hueShift + 60) % 360}, ${saturation}%, ${lightness}%)`,  // O
                `hsl(${(hueShift + 270) % 360}, ${saturation}%, ${lightness}%)`, // T
                `hsl(${(hueShift + 120) % 360}, ${saturation}%, ${lightness}%)`, // S
                `hsl(${hueShift % 360}, ${saturation}%, ${lightness}%)`,         // Z
                `hsl(${(hueShift + 30) % 360}, ${saturation}%, ${lightness}%)`, // L
                `hsl(${(hueShift + 240) % 360}, ${saturation}%, ${lightness}%)`  // J
            ];
            this.levelPalettes.push(palette);
        }
    }
    
    updateLevelPalette() {
        // Get palette index (level 1 = index 0, level 31 = index 0, etc.)
        const paletteIndex = (this.level - 1) % 30;
        this.pieceColors = [...this.levelPalettes[paletteIndex]];
        
        // Update current piece color if it exists
        if (this.currentPiece) {
            const pieceIndex = this.currentPiece.pieceIndex;
            if (pieceIndex >= 0 && pieceIndex < this.pieceColors.length) {
                this.currentPiece.color = this.pieceColors[pieceIndex];
            }
        }
        
        // Update next piece color
        if (this.nextPiece) {
            const pieceIndex = this.nextPiece.pieceIndex;
            if (pieceIndex >= 0 && pieceIndex < this.pieceColors.length) {
                this.nextPiece.color = this.pieceColors[pieceIndex];
            }
        }
        
        // Update held piece color
        if (this.heldPiece) {
            const pieceIndex = this.heldPiece.pieceIndex;
            if (pieceIndex >= 0 && pieceIndex < this.pieceColors.length) {
                this.heldPiece.color = this.pieceColors[pieceIndex];
            }
        }
        
        // Note: Placed pieces in grid keep their colors until cleared
        // This creates a nice visual transition effect as the level changes
    }
    
    setupControls() {
        this.keyHandler = (e) => {
            // Don't process shortcuts if user is typing in an input field
            const activeElement = document.activeElement;
            if (activeElement && (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA')) {
                return;
            }
            
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
        // Update mute button to reflect global state
        this.updateMuteButton();
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
            const oldLevel = this.level;
            this.lines += linesCleared;
            this.score += linesCleared * 100 * this.level;
            // Level increases every 10 lines, but always at least the starting level
            this.level = Math.max(this.startLevel, Math.floor(this.lines / 10) + 1);
            this.fallInterval = Math.max(100, 1000 - (this.level - 1) * 100);
            
            // Update color palette if level changed
            if (this.level !== oldLevel) {
                this.updateLevelPalette();
            }
            
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
        // Restore global mute state
        this.isMuted = getGlobalMuteState();
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
        this.updateLevelPalette();
        this.draw();
        this.drawPreviews();
        this.updateMuteButton();
        this.stopBackgroundMusic();
        // Load a new random music track for the next game
        this.setupAudio();
    }
    
    setupAudio() {
        // List of available music files
        const musicFiles = [
            'games/tetris/assets/tetris-theme.wav',
            'games/tetris/assets/tetris-music (1).wav',
            'games/tetris/assets/tetris-music (2).mp3',
            'games/tetris/assets/tetris-music (3).mp3',
            'games/tetris/assets/tetris-music (4).mp3',
            'games/tetris/assets/tetris-music (5).mp3'
        ];
        
        // Randomly select a music file
        const randomMusicFile = musicFiles[Math.floor(Math.random() * musicFiles.length)];
        
        // Try to load background music
        try {
            this.backgroundMusic = new Audio(randomMusicFile);
            this.backgroundMusic.loop = true;
            this.backgroundMusic.volume = 0.3; // 30% volume for background music
            this.backgroundMusic.preload = 'auto';
            
            // Handle errors gracefully (file might not exist yet)
            this.backgroundMusic.addEventListener('error', (e) => {
                console.log(`Background music file not found: ${randomMusicFile}`);
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
        // Save to global state
        setGlobalMuteState(this.isMuted);
        
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
