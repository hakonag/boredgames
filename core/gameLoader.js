// Game Loader - Dynamically loads and initializes games
import { cleanupActiveGame } from './navigation.js';
import { gameRegistry } from './gameRegistry.js';

let currentGame = null;

export function loadGame(gameId) {
    // Clean up previous game
    // Call game-specific cleanup if available
    try {
        if (currentGame && typeof currentGame.cleanup === 'function') {
            currentGame.cleanup();
        }
    } catch {}
    cleanupActiveGame();
    
    const container = document.querySelector('.container');
    const gameContainer = document.getElementById('game-container');
    const gameContent = document.getElementById('game-content');
    
    container.classList.add('hidden');
    gameContainer.classList.remove('hidden');
    showGameLoader(gameId);
    
    // Update favicon to game emoji
    const game = gameRegistry.find(g => g.id === gameId);
    if (game && game.icon) {
        updateFavicon(game.icon, gameId);
    }
    
    // Clear previous game
    gameContent.innerHTML = '';
    
    // Dynamically import and initialize the game
    // Use import.meta.url to get the current module's URL and resolve relative to it
    const currentModuleUrl = new URL(import.meta.url);
    const gamePath = new URL(`../games/${gameId}/${gameId}.js`, currentModuleUrl).href;
    
    const startTs = performance.now();
    const MIN_LOADER_MS = 1200; // let users enjoy the transition

    import(gamePath)
        .then(async module => {
            if (module.init) {
                const elapsed = performance.now() - startTs;
                const waitMs = Math.max(0, MIN_LOADER_MS - elapsed);
                await new Promise(r => setTimeout(r, waitMs));

                currentGame = module;
                module.init();
                hideGameLoader();
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
        .catch(async error => {
            const elapsed = performance.now() - startTs;
            const waitMs = Math.max(0, MIN_LOADER_MS - elapsed);
            await new Promise(r => setTimeout(r, waitMs));
            console.error(`Failed to load game ${gameId}:`, error);
            gameContent.innerHTML = `
                <button onclick="window.goHome()">← boredgames</button>
                <h2>Feil</h2>
                <p>Kunne ikke laste spillet. ${error.message}</p>
            `;
            hideGameLoader();
        });
}

function goBackToHome() {
    const container = document.querySelector('.container');
    const gameContainer = document.getElementById('game-container');
    container.classList.remove('hidden');
    gameContainer.classList.add('hidden');
    
    // Reset favicon to default
    updateFavicon('🎮');
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

function showGameLoader(gameId) {
    const overlay = document.getElementById('game-loader');
    if (!overlay) return;
    const game = (gameRegistry || []).find(g => g.id === gameId);
    const icon = game?.icon || '🎮';
    const name = game?.name || gameId;
    // Get theme color from registry
    const theme = game?.themeColor || '#339af0';
    const blocks = gameId === 'tetris' ? 8 : 6;
    const blocksHtml = Array.from({ length: blocks }).map(() => `<span class="game-block" style="background:${theme}"></span>`).join('');
    overlay.innerHTML = `
        <div class="loader-content game-loader-inner">
            <div class="loader-logo">${icon}</div>
            <div class="game-loader-title">${name}</div>
            <div class="game-loader-sub">Loading…</div>
            <div class="game-loader-anim">${blocksHtml}</div>
        </div>
    `;
    overlay.classList.remove('hidden');
}

function hideGameLoader() {
    const overlay = document.getElementById('game-loader');
    if (!overlay) return;
    overlay.classList.add('hidden');
    overlay.innerHTML = '';
}

/**
 * Updates the favicon to show the game emoji
 * @param {string} emoji - The emoji to display in the favicon
 * @param {string} gameId - Optional game ID for title update
 */
export function updateFavicon(emoji, gameId = null) {
    // Remove existing favicon links
    const existingLinks = document.querySelectorAll('link[rel="icon"]');
    existingLinks.forEach(link => link.remove());
    
    // Create new favicon link with emoji
    const link = document.createElement('link');
    link.rel = 'icon';
    link.href = `data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>${emoji}</text></svg>`;
    document.head.appendChild(link);
    
    // Update title based on game
    if (gameId) {
        const game = gameRegistry.find(g => g.id === gameId);
        if (game) {
            document.title = `${game.name} - BoredGames`;
        }
    } else if (emoji === '🎮') {
        document.title = 'Bored Games - Spill når du kjeder deg';
    }
}

