// Game Loader - Dynamically loads and initializes games
import { cleanupActiveGame } from './navigation.js';

let currentGame = null;

export function loadGame(gameId) {
    // Clean up previous game
    cleanupActiveGame();
    
    const container = document.querySelector('.container');
    const gameContainer = document.getElementById('game-container');
    const gameContent = document.getElementById('game-content');
    
    container.classList.add('hidden');
    gameContainer.classList.remove('hidden');
    
    // Clear previous game
    gameContent.innerHTML = '';
    
    // Dynamically import and initialize the game
    // Use import.meta.url to get the current module's URL and resolve relative to it
    const currentModuleUrl = new URL(import.meta.url);
    const gamePath = new URL(`../games/${gameId}/${gameId}.js`, currentModuleUrl).href;
    
    import(gamePath)
        .then(module => {
            if (module.init) {
                currentGame = module;
                module.init();
                // Update browser URL for deep-linking
                try {
                    const url = new URL(window.location.href);
                    url.searchParams.set('game', gameId);
                    window.history.pushState({ gameId }, '', url);
                } catch {}
            } else {
                console.error(`Game ${gameId} does not export an init function`);
                goBackToHome();
            }
        })
        .catch(error => {
            console.error(`Failed to load game ${gameId}:`, error);
            gameContent.innerHTML = `
                <button onclick="window.goHome()">← Tilbake</button>
                <h2>Feil</h2>
                <p>Kunne ikke laste spillet. ${error.message}</p>
            `;
        });
}

function goBackToHome() {
    const container = document.querySelector('.container');
    const gameContainer = document.getElementById('game-container');
    container.classList.remove('hidden');
    gameContainer.classList.add('hidden');
}

// Make goHome available globally for onclick handlers
window.goHome = () => {
    cleanupActiveGame();
    if (currentGame && currentGame.cleanup) {
        currentGame.cleanup();
    }
    currentGame = null;
    goBackToHome();
    // Remove game param from URL
    try {
        const url = new URL(window.location.href);
        url.searchParams.delete('game');
        window.history.pushState({}, '', url.pathname.replace(/\/$/, '') + (url.search || '') + url.hash);
    } catch {}
};

// Handle back/forward navigation
window.addEventListener('popstate', (e) => {
    const params = new URLSearchParams(window.location.search);
    const game = params.get('game');
    if (game) {
        // If already showing a game, avoid duplicate init
        cleanupActiveGame();
        loadGame(game);
    } else {
        window.goHome();
    }
});

