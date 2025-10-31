// Shared Game Styles - Common CSS for all games
// Reduces duplication across 35+ game files

/**
 * Returns the base CSS styles that all games need
 * @param {string} gameId - The game ID for unique style ID
 * @returns {string} Base CSS string
 */
export function getBaseGameStyles(gameId) {
    return `
        /* Base game styles - shared across all games */
        .game-container #game-content, .game-container #game-content * {
            font-family: system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol" !important;
            color: #111;
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
        }
    `;
}

/**
 * Injects game-specific styles with base styles included
 * @param {string} gameId - The game ID for unique style ID
 * @param {string} gameSpecificStyles - Game-specific CSS (without base styles)
 */
export function injectGameStyles(gameId, gameSpecificStyles = '') {
    const styleId = `${gameId}-style`;
    if (document.getElementById(styleId)) return;
    
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = getBaseGameStyles(gameId) + '\n' + gameSpecificStyles;
    document.head.appendChild(style);
}

/**
 * Removes game-specific styles
 * @param {string} gameId - The game ID for unique style ID
 */
export function removeGameStyles(gameId) {
    const styleId = `${gameId}-style`;
    const styleEl = document.getElementById(styleId);
    if (styleEl) styleEl.remove();
}

