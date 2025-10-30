// Main entry point - Uses game registry and dynamic loading
import { gameRegistry, getEnabledGames } from './gameRegistry.js';
import { loadGame } from './gameLoader.js';

// Initialize homepage with games from registry
document.addEventListener('DOMContentLoaded', () => {
    const gameFromUrl = getGameFromUrl();
    showGlobalLoader();
    if (gameFromUrl) {
        // defer slightly to show loader transition
        setTimeout(() => {
            hideGlobalLoader();
            loadGame(gameFromUrl);
        }, 600);
    } else {
        // Simulate quick intro loading then render grid
        setTimeout(() => {
            renderGameCards();
            hideGlobalLoader();
        }, 700);
    }
});

function getGameFromUrl() {
    const params = new URLSearchParams(window.location.search);
    const q = params.get('game');
    if (q) return q;
    // Also support /games/<id>/ and /<id>
    const parts = window.location.pathname.split('/').filter(Boolean);
    const last = parts[parts.length - 1] || '';
    const secondLast = parts[parts.length - 2] || '';
    if (secondLast === 'games' && last) return last; // /games/<id>
    // If hosted under a repo path, last may be index.html; try prev
    if (last === 'index.html' && parts.length >= 2 && parts[parts.length - 2] !== 'games') {
        return null;
    }
    // Allow /<id>
    if (last && last !== 'index.html' && last !== 'boredgames') return last;
    return null;
}

function showGlobalLoader() {
    const el = document.getElementById('global-loader');
    if (el) el.classList.remove('hidden');
}
function hideGlobalLoader() {
    const el = document.getElementById('global-loader');
    if (el) el.classList.add('hidden');
}

function renderGameCards() {
    const gamesGrid = document.querySelector('.games-grid');
    if (!gamesGrid) return;
    
    // Clear existing cards
    gamesGrid.innerHTML = '';
    
    // Get ALL games from registry (show all, even if not implemented yet)
    const allGames = gameRegistry;
    
    // Create game cards dynamically
    allGames.forEach(game => {
        const card = document.createElement('div');
        card.className = game.enabled ? 'game-card' : 'game-card coming-soon';
        card.setAttribute('data-game', game.id);
        card.innerHTML = `
            <div class="game-icon">${game.icon}</div>
            <h2>${game.name}</h2>
            <p>${game.description}</p>
        `;
        
        if (game.enabled) {
            card.addEventListener('click', () => {
                loadGame(game.id);
            });
        } else {
            card.style.cursor = 'not-allowed';
            card.addEventListener('click', () => {
                // Show message that game is coming soon
                alert(`🎮 ${game.name} kommer snart!`);
            });
        }
        
        gamesGrid.appendChild(card);
    });
}

// Make goHome available globally
window.goHome = () => {
    import('./navigation.js').then(module => {
        module.goHome();
    });
};
