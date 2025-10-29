// Main entry point - Uses game registry and dynamic loading
import { gameRegistry, getEnabledGames } from './gameRegistry.js';
import { loadGame } from './gameLoader.js';

// Initialize homepage with games from registry
document.addEventListener('DOMContentLoaded', () => {
    renderGameCards();
});

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
