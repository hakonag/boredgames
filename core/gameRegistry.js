// Game Registry - Manages all available games
// To add a new game, just add an entry here and create the game file in /games/

export const gameRegistry = [
    {
        id: 'solitaire',
        name: 'Kabal',
        icon: '🃏',
        description: 'Klassisk solitær',
        category: 'card',
        initFunction: 'initSolitaire',
        enabled: true
    },
    {
        id: 'yatzy',
        name: 'Yatzy',
        icon: '🎲',
        description: 'Terningklassiker',
        category: 'dice',
        initFunction: 'initYatzy',
        enabled: false // Placeholder game
    },
    {
        id: 'ludo',
        name: 'Ludo',
        icon: '🏁',
        description: 'Brettspillklassiker',
        category: 'board',
        initFunction: 'initLudo',
        enabled: false // Placeholder game
    },
    {
        id: 'tetris',
        name: 'Tetris',
        icon: '🔲',
        description: 'Puslespillklassiker',
        category: 'puzzle',
        initFunction: 'initTetris',
        enabled: true
    }
];

// Get all enabled games
export function getEnabledGames() {
    return gameRegistry.filter(game => game.enabled);
}

// Get game by ID
export function getGameById(id) {
    return gameRegistry.find(game => game.id === id);
}

// Get games by category
export function getGamesByCategory(category) {
    return gameRegistry.filter(game => game.enabled && game.category === category);
}

