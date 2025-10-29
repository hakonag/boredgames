// Core navigation functions - shared across all games

export function goHome() {
    // Clean up any active games
    cleanupActiveGame();
    
    const container = document.querySelector('.container');
    const gameContainer = document.getElementById('game-container');
    
    container.classList.remove('hidden');
    gameContainer.classList.add('hidden');
}

export function cleanupActiveGame() {
    // Clean up Tetris controls if active
    if (window.tetrisGame && window.tetrisGame.removeControls) {
        window.tetrisGame.removeControls();
        window.tetrisGame = null;
    }
    
    // Clean up Solitaire if active
    if (window.solitaireGame) {
        window.solitaireGame = null;
        window.resetSolitaire = null;
    }
    
    // Remove scroll lock
    document.body.style.overflow = '';
    document.body.style.position = '';
    document.body.style.width = '';
    document.body.style.height = '';
    document.documentElement.style.overflow = '';
    
    // Remove scroll prevention listeners
    if (window.tetrisScrollPrevent) {
        window.removeEventListener('wheel', window.tetrisScrollPrevent.wheel);
        window.removeEventListener('touchmove', window.tetrisScrollPrevent.touchmove);
        window.tetrisScrollPrevent = null;
    }
    
    // Remove any game-specific styles
    const oldStyle = document.getElementById('game-specific-styles');
    if (oldStyle) oldStyle.remove();
}

