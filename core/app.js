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
            setupSearchAndSort();
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

let currentGames = [];
let sortOrder = 'az'; // 'az' or 'za'

function renderGameCards(filteredGames = null) {
    const gamesGrid = document.querySelector('.games-grid');
    if (!gamesGrid) return;
    
    // Clear existing cards
    gamesGrid.innerHTML = '';
    
    // Use filtered games if provided, otherwise use all games
    let gamesToRender = filteredGames || currentGames;
    
    // Sort games
    gamesToRender = [...gamesToRender].sort((a, b) => {
        const nameA = a.name.toUpperCase();
        const nameB = b.name.toUpperCase();
        if (sortOrder === 'az') {
            return nameA.localeCompare(nameB, 'no');
        } else {
            return nameB.localeCompare(nameA, 'no');
        }
    });
    
    // Create game cards dynamically
    gamesToRender.forEach(game => {
        const card = document.createElement('div');
        card.className = game.enabled ? 'game-card' : 'game-card coming-soon';
        card.setAttribute('data-game', game.id);
        card.innerHTML = `
            <div class="game-icon">${game.icon}</div>
            <h2>${game.name}</h2>
            <p>${game.description}</p>
        `;
        
        // Always allow click to attempt load; visual style still reflects coming-soon
        card.addEventListener('click', (e) => {
            // Check for Ctrl+Click (or Cmd+Click on Mac) to open in new tab
            if (e.ctrlKey || e.metaKey) {
                const url = new URL(window.location.href);
                url.searchParams.set('game', game.id);
                window.open(url.toString(), '_blank');
            } else {
                loadGame(game.id);
            }
        });
        if (!game.enabled) {
            card.style.cursor = 'pointer';
        }
        
        gamesGrid.appendChild(card);
    });
    
    // Update Lucide icons
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
}

function setupSearchAndSort() {
    // Store original games list
    currentGames = [...gameRegistry];
    
    const searchInput = document.getElementById('game-search');
    const sortButton = document.getElementById('sort-toggle');
    const sortIcon = document.getElementById('sort-icon');
    
    if (!searchInput || !sortButton || !sortIcon) return;
    
    // Search functionality
    searchInput.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase().trim();
        
        if (query === '') {
            renderGameCards(currentGames);
            return;
        }
        
        const filtered = currentGames.filter(game => {
            const nameMatch = game.name.toLowerCase().includes(query);
            const descMatch = game.description.toLowerCase().includes(query);
            const idMatch = game.id.toLowerCase().includes(query);
            return nameMatch || descMatch || idMatch;
        });
        
        renderGameCards(filtered);
    });
    
    // Sort functionality
    sortButton.addEventListener('click', () => {
        sortOrder = sortOrder === 'az' ? 'za' : 'az';
        
        // Update icon to indicate current sort state
        // When A-Z (ascending), show arrow-down (next will be Z-A descending)
        // When Z-A (descending), show arrow-up (next will be A-Z ascending)
        const iconName = sortOrder === 'az' ? 'arrow-down' : 'arrow-up';
        sortIcon.setAttribute('data-lucide', iconName);
        
        // Re-render with current filter
        const searchQuery = searchInput.value.toLowerCase().trim();
        let gamesToSort = currentGames;
        
        if (searchQuery !== '') {
            gamesToSort = currentGames.filter(game => {
                const nameMatch = game.name.toLowerCase().includes(searchQuery);
                const descMatch = game.description.toLowerCase().includes(searchQuery);
                const idMatch = game.id.toLowerCase().includes(searchQuery);
                return nameMatch || descMatch || idMatch;
            });
        }
        
        renderGameCards(gamesToSort);
        
        // Update Lucide icons after changing
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    });
    
    // Initialize sort icon
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
}

// Make goHome available globally
window.goHome = () => {
    import('./navigation.js').then(module => {
        module.goHome();
    });
};
