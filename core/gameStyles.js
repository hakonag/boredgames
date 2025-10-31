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
            font-family: 'Space Grotesk', system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol" !important;
            color: #111;
        }
        /* Mobile-friendly touch targets */
        * {
            -webkit-tap-highlight-color: transparent;
            -webkit-touch-callout: none;
        }
        button, .btn-primary, .btn-secondary, a, [role="button"] {
            touch-action: manipulation;
            -webkit-user-select: none;
            user-select: none;
            min-height: 44px;
            min-width: 44px;
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
            height: 100vh;
            max-height: 100vh;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            max-width: 100%;
            overflow: hidden;
            box-sizing: border-box;
            padding: 5px;
            margin: 0;
            background: transparent;
            border-radius: 0;
            box-shadow: none;
            min-height: 0;
        }
        .back-button-shared {
            position: fixed;
            top: 10px;
            left: 10px;
            background: #f8f9fa;
            color: #111;
            border: 2px solid #dee2e6;
            padding: 8px 12px;
            border-radius: 0;
            font-size: 0.875rem;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s ease;
            z-index: 10000;
            display: flex;
            align-items: center;
            gap: 6px;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }
        .back-button-shared:hover {
            background: #e9ecef;
            border-color: #111;
        }
        .back-button-shared i {
            width: 16px;
            height: 16px;
            stroke-width: 2;
        }
        /* Standard button styles - squares */
        .btn-primary, .btn-secondary {
            padding: 12px 24px;
            border-radius: 0;
            font-size: 0.9375rem;
            font-weight: 600;
            cursor: pointer;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            border: 2px solid;
            transition: all 0.2s ease;
            font-family: 'Space Grotesk', system-ui, sans-serif;
            min-height: 44px;
            min-width: 44px;
            touch-action: manipulation;
        }
        .btn-primary {
            background: #111;
            color: #fff;
            border-color: #111;
        }
        .btn-primary:hover:not(:disabled) {
            background: #333;
            border-color: #333;
        }
        .btn-primary:disabled {
            background: #9ca3af;
            border-color: #9ca3af;
            cursor: not-allowed;
            opacity: 0.6;
        }
        .btn-secondary {
            background: #6c757d;
            color: #fff;
            border-color: #6c757d;
        }
        .btn-secondary:hover:not(:disabled) {
            background: #5a6268;
            border-color: #5a6268;
        }
        .btn-secondary:disabled {
            background: #9ca3af;
            border-color: #9ca3af;
            cursor: not-allowed;
            opacity: 0.6;
        }
        .btn-primary i, .btn-secondary i {
            width: 18px;
            height: 18px;
            stroke-width: 2;
        }
        /* Standard stat box styles */
        .stat-box {
            background: #f8f9fa;
            border: 2px solid #dee2e6;
            border-radius: 0;
            padding: 12px 20px;
            text-align: center;
        }
        .stat-label {
            color: #6c757d;
            font-size: 0.8125rem;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 6px;
        }
        .stat-value {
            color: #111;
            font-size: 1.875rem;
            font-weight: 700;
        }
        /* Standard heading styles */
        .game-container #game-content h1 {
            font-size: 2.5rem;
            font-weight: 700;
            color: #111;
            margin: 0 0 20px 0;
            text-align: center;
        }
        /* Lucide icon styling */
        [data-lucide] {
            width: 18px;
            height: 18px;
            stroke-width: 2;
        }
        [data-lucide]:not([class*="icon"]) {
            vertical-align: middle;
        }
        /* Score modal styles */
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
            color: #111;
            font-size: 1.5rem;
            font-weight: 700;
        }
        .score-modal-content p {
            color: #6c757d;
            margin-bottom: 15px;
            font-size: 1rem;
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
            color: #111;
            font-family: 'Space Grotesk', system-ui, sans-serif;
        }
        .score-modal-content input:focus {
            outline: none;
            border-color: #111;
        }
        .score-modal-content button {
            margin: 5px;
            font-weight: 600;
            font-family: 'Space Grotesk', system-ui, sans-serif;
        }
        #save-status {
            min-height: 20px;
            color: #6c757d;
            margin-top: 10px;
            font-size: 0.9375rem;
        }
        @media (max-width: 768px) {
            .game-container #game-content {
                height: 100vh;
                max-height: 100vh;
                margin: 0;
                padding: 8px;
            }
            .back-button-shared {
                top: 8px;
                left: 8px;
                padding: 10px 14px;
                font-size: 0.875rem;
                min-height: 44px;
                min-width: 44px;
            }
            .game-container #game-content h1 {
                font-size: 2rem;
                margin-bottom: 15px;
            }
            .btn-primary, .btn-secondary {
                padding: 14px 20px;
                font-size: 1rem;
                min-height: 48px;
            }
            .stat-box {
                padding: 14px 16px;
                min-width: 80px;
            }
            .stat-value {
                font-size: 1.75rem;
            }
            .stat-label {
                font-size: 0.75rem;
            }
            /* Improve touch targets for mobile */
            input[type="text"],
            input[type="number"],
            select,
            textarea {
                min-height: 44px;
                font-size: 16px; /* Prevents zoom on iOS */
            }
            /* Score modal mobile adjustments */
            .score-modal-content {
                padding: 30px 20px;
                margin: 20px;
            }
            .score-modal-content input {
                min-height: 48px;
                font-size: 16px;
            }
            .score-modal-content button {
                min-height: 48px;
                padding: 14px 20px;
                font-size: 1rem;
            }
        }
        /* Small mobile devices */
        @media (max-width: 480px) {
            .game-container #game-content {
                padding: 5px;
            }
            .game-container #game-content h1 {
                font-size: 1.75rem;
                margin-bottom: 12px;
            }
            .stat-box {
                padding: 12px 14px;
            }
            .stat-value {
                font-size: 1.5rem;
            }
            .btn-primary, .btn-secondary {
                padding: 12px 18px;
                font-size: 0.9375rem;
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

