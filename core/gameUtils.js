// Shared Game Utilities - Common JavaScript utilities for all games
// Reduces boilerplate code across 35+ game files

/**
 * Creates the back button HTML that all games use
 * @returns {string} HTML string for back button
 */
export function createBackButton() {
    return `
        <button class="back-button-tetris" onclick="window.location.href='https://hakonag.github.io/boredgames/'">
            <i data-lucide="house"></i> Tilbake
        </button>
    `;
}

/**
 * Sets up scroll prevention for games
 * @param {string} gameId - The game ID for unique window property name
 * @returns {object} Object with wheel and touchmove handlers for cleanup
 */
export function setupScrollPrevention(gameId) {
    const preventScroll = (e) => {
        e.preventDefault();
        return false;
    };
    
    window.addEventListener('wheel', preventScroll, { passive: false });
    window.addEventListener('touchmove', preventScroll, { passive: false });
    
    const preventObj = { wheel: preventScroll, touchmove: preventScroll };
    window[`${gameId}ScrollPrevent`] = preventObj;
    
    return preventObj;
}

/**
 * Removes scroll prevention for games
 * @param {string} gameId - The game ID for unique window property name
 */
export function removeScrollPrevention(gameId) {
    const preventObj = window[`${gameId}ScrollPrevent`];
    if (preventObj) {
        window.removeEventListener('wheel', preventObj.wheel);
        window.removeEventListener('touchmove', preventObj.touchmove);
        delete window[`${gameId}ScrollPrevent`];
    }
}

/**
 * Sets up hard reset (R key) shortcut for a game
 * @param {string} gameId - The game ID for hard reset URL
 * @param {function} keyHandler - Optional existing key handler function to wrap
 * @returns {function} Enhanced key handler with hard reset support
 */
export function setupHardReset(gameId, keyHandler = null) {
    return (e) => {
        // Check if input is active - don't trigger shortcuts
        const activeElement = document.activeElement;
        if (activeElement && (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA')) {
            if (keyHandler) return keyHandler(e);
            return;
        }
        
        // Handle restart (R)
        if (e.key === 'r' || e.key === 'R') {
            window.location.href = `https://hakonag.github.io/boredgames/?game=${gameId}`;
            return;
        }
        
        // Call original handler if provided
        if (keyHandler) return keyHandler(e);
    };
}

/**
 * Checks if an input field is currently active
 * @returns {boolean} True if input/textarea is focused
 */
export function isInputActive() {
    const activeElement = document.activeElement;
    return activeElement && (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA');
}

