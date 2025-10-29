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
    
    // Get enabled games from registry
    const enabledGames = getEnabledGames();
    
    // Create game cards dynamically
    enabledGames.forEach(game => {
        const card = document.createElement('div');
        card.className = 'game-card';
        card.setAttribute('data-game', game.id);
        card.innerHTML = `
            <div class="game-icon">${game.icon}</div>
            <h2>${game.name}</h2>
            <p>${game.description}</p>
        `;
        
        card.addEventListener('click', () => {
            loadGame(game.id);
        });
        
        gamesGrid.appendChild(card);
    });
}

// Make goHome available globally
window.goHome = () => {
    import('./navigation.js').then(module => {
        module.goHome();
    });
};
