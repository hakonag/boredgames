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
        id: 'snake',
        name: 'Snake',
        icon: '🐍',
        description: 'Spis, voks, unngå deg selv',
        category: 'arcade',
        initFunction: 'initSnake',
        enabled: true
    },
    {
        id: 'minesweeper',
        name: 'Minesweeper',
        icon: '💣',
        description: 'Finn bombene – ikke spreng!',
        category: 'puzzle',
        initFunction: 'initMinesweeper',
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
    },
    {
        id: 'roulette',
        name: 'Roulette',
        icon: '🎰',
        description: 'Casinoklassiker',
        category: 'casino',
        initFunction: 'initRoulette',
        enabled: true
    },
    {
        id: 'casino',
        name: 'Casino',
        icon: '🎲',
        description: 'Casinospillsamling',
        category: 'casino',
        initFunction: 'initCasino',
        enabled: true
    },
    {
        id: 'tennis',
        name: 'Tennis',
        icon: '🎾',
        description: '2-spiller klassisk tennis',
        category: 'sports',
        initFunction: 'initTennis',
        enabled: true
    },
    {
        id: 'spaceinvader',
        name: 'Space Invader',
        icon: '👾',
        description: 'Klassisk space shooter',
        category: 'arcade',
        initFunction: 'initSpaceInvader',
        enabled: true
    },
    {
        id: '2048',
        name: '2048',
        icon: '🔢',
        description: 'Slidende tall-puslespill',
        category: 'puzzle',
        initFunction: 'init2048',
        enabled: true
    },
    {
        id: '1010',
        name: '1010!',
        icon: '🧩',
        description: 'Blokk-puslespill',
        category: 'puzzle',
        initFunction: 'init1010',
        enabled: true
    },
    {
        id: 'pong',
        name: 'Pong',
        icon: '🏓',
        description: 'Klassisk 2-spiller pong',
        category: 'arcade',
        initFunction: 'initPong',
        enabled: true
    },
    {
        id: 'breakout',
        name: 'Breakout',
        icon: '🧱',
        description: 'Klassisk breakout',
        category: 'arcade',
        initFunction: 'initBreakout',
        enabled: true
    },
    {
        id: 'pacman',
        name: 'Pacman',
        icon: '👻',
        description: 'Klassisk pacman',
        category: 'arcade',
        initFunction: 'initPacman',
        enabled: true
    },
    {
        id: 'flappybird',
        name: 'Flappy Bird',
        icon: '🐦',
        description: 'Flappy bird klassiker',
        category: 'arcade',
        initFunction: 'initFlappyBird',
        enabled: true
    },
    {
        id: 'sudoku',
        name: 'Sudoku',
        icon: '🔢',
        description: 'Klassisk sudoku',
        category: 'puzzle',
        initFunction: 'initSudoku',
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

