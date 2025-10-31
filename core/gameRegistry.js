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
        themeColor: '#20c997',
        enabled: true
    },
    {
        id: 'snake',
        name: 'Snake',
        icon: '🐍',
        description: 'Spis, voks, unngå deg selv',
        category: 'arcade',
        initFunction: 'initSnake',
        themeColor: '#339af0',
        enabled: true
    },
    {
        id: 'minesweeper',
        name: 'Minesweeper',
        icon: '💣',
        description: 'Finn bombene – ikke spreng!',
        category: 'puzzle',
        initFunction: 'initMinesweeper',
        themeColor: '#339af0',
        enabled: true
    },
    {
        id: 'yatzy',
        name: 'Yatzy',
        icon: '🎲',
        description: 'Terningklassiker',
        category: 'dice',
        initFunction: 'initYatzy',
        themeColor: '#845ef7',
        enabled: false // Placeholder game
    },
    {
        id: 'ludo',
        name: 'Ludo',
        icon: '🏁',
        description: 'Brettspillklassiker',
        category: 'board',
        initFunction: 'initLudo',
        themeColor: '#f59f00',
        enabled: false // Placeholder game
    },
    {
        id: 'tetris',
        name: 'Tetris',
        icon: '🔲',
        description: 'Puslespillklassiker',
        category: 'puzzle',
        initFunction: 'initTetris',
        themeColor: '#4dabf7',
        enabled: true
    },
    {
        id: 'roulette',
        name: 'Roulette',
        icon: '🎰',
        description: 'Casinoklassiker',
        category: 'casino',
        initFunction: 'initRoulette',
        themeColor: '#fa5252',
        enabled: true
    },
    {
        id: 'casino',
        name: 'Casino',
        icon: '🎲',
        description: 'Casinospillsamling',
        category: 'casino',
        initFunction: 'initCasino',
        themeColor: '#fcc419',
        enabled: true
    },
    {
        id: 'tennis',
        name: 'Tennis',
        icon: '🎾',
        description: '2-spiller klassisk tennis',
        category: 'sports',
        initFunction: 'initTennis',
        themeColor: '#339af0',
        enabled: true
    },
    {
        id: 'spaceinvader',
        name: 'Space Invader',
        icon: '👾',
        description: 'Klassisk space shooter',
        category: 'arcade',
        initFunction: 'initSpaceInvader',
        themeColor: '#339af0',
        enabled: true
    },
    {
        id: '2048',
        name: '2048',
        icon: '🔢',
        description: 'Slidende tall-puslespill',
        category: 'puzzle',
        initFunction: 'init2048',
        themeColor: '#776e65',
        enabled: true
    },
    {
        id: '1010',
        name: '1010!',
        icon: '🧩',
        description: 'Blokk-puslespill',
        category: 'puzzle',
        initFunction: 'init1010',
        themeColor: '#4a90e2',
        enabled: true
    },
    {
        id: 'pong',
        name: 'Pong',
        icon: '🏓',
        description: 'Klassisk 2-spiller pong',
        category: 'arcade',
        initFunction: 'initPong',
        themeColor: '#0d6efd',
        enabled: true
    },
    {
        id: 'breakout',
        name: 'Breakout',
        icon: '🧱',
        description: 'Klassisk breakout',
        category: 'arcade',
        initFunction: 'initBreakout',
        themeColor: '#ef4444',
        enabled: true
    },
    {
        id: 'pacman',
        name: 'Pacman',
        icon: '👻',
        description: 'Klassisk pacman',
        category: 'arcade',
        initFunction: 'initPacman',
        themeColor: '#ffff00',
        enabled: true
    },
    {
        id: 'flappybird',
        name: 'Flappy Bird',
        icon: '🐦',
        description: 'Flappy bird klassiker',
        category: 'arcade',
        initFunction: 'initFlappyBird',
        themeColor: '#ffd700',
        enabled: true
    },
    {
        id: 'sudoku',
        name: 'Sudoku',
        icon: '🔢',
        description: 'Klassisk sudoku',
        category: 'puzzle',
        initFunction: 'initSudoku',
        themeColor: '#495057',
        enabled: true
    },
    {
        id: 'arkanoid',
        name: 'Arkanoid',
        icon: '🎮',
        description: 'Klassisk arkanoid',
        category: 'arcade',
        initFunction: 'initArkanoid',
        themeColor: '#ef4444',
        enabled: true
    },
    {
        id: 'checkers',
        name: 'Checkers',
        icon: '🔴',
        description: 'Klassisk dam',
        category: 'strategy',
        initFunction: 'initCheckers',
        themeColor: '#dc3545',
        enabled: true
    },
    {
        id: 'chess',
        name: 'Chess',
        icon: '♔',
        description: 'Klassisk sjakk',
        category: 'strategy',
        initFunction: 'initChess',
        themeColor: '#000000',
        enabled: true
    },
    {
        id: 'pinball',
        name: 'Pinball',
        icon: '🎱',
        description: 'Klassisk pinball',
        category: 'arcade',
        initFunction: 'initPinball',
        themeColor: '#1a1a1a',
        enabled: true
    },
    {
        id: 'tictactoe',
        name: 'Tic-Tac-Toe',
        icon: '❌',
        description: 'Tre på rad',
        category: 'strategy',
        initFunction: 'initTictactoe',
        themeColor: '#6c757d',
        enabled: true
    },
    {
        id: 'mahjong',
        name: 'Mahjong',
        icon: '🀄',
        description: 'Mahjong solitaire',
        category: 'puzzle',
        initFunction: 'initMahjong',
        themeColor: '#8b4513',
        enabled: true
    },
    {
        id: 'crossword',
        name: 'Crossword',
        icon: '📝',
        description: 'Kryssord',
        category: 'puzzle',
        initFunction: 'initCrossword',
        themeColor: '#495057',
        enabled: true
    },
    {
        id: 'memory',
        name: 'Memory',
        icon: '🧠',
        description: 'Minne-spill',
        category: 'puzzle',
        initFunction: 'initMemory',
        themeColor: '#0d6efd',
        enabled: true
    },
    {
        id: 'reversi',
        name: 'Reversi',
        icon: '⚫',
        description: 'Klassisk reversi',
        category: 'strategy',
        initFunction: 'initReversi',
        themeColor: '#228b22',
        enabled: true
    },
    {
        id: 'whackamole',
        name: 'Whack-a-Mole',
        icon: '🦫',
        description: 'Slå muldvarp',
        category: 'arcade',
        initFunction: 'initWhackamole',
        themeColor: '#8b4513',
        enabled: true
    },
    {
        id: 'dino',
        name: 'Dino',
        icon: '🦕',
        description: 'Chrome dino jump',
        category: 'arcade',
        initFunction: 'initDino',
        themeColor: '#ffffff',
        enabled: true
    },
    {
        id: 'numberguess',
        name: 'Gjett Tallet',
        icon: '🎯',
        description: 'Klassisk tallgjetting',
        category: 'puzzle',
        initFunction: 'initNumberGuess',
        themeColor: '#f59e0b',
        enabled: true
    },
    {
        id: 'rockpaperscissors',
        name: 'Stein Saks Papir',
        icon: '✂️',
        description: 'Klassisk stein saks papir',
        category: 'arcade',
        initFunction: 'initRockPaperScissors',
        themeColor: '#ef4444',
        enabled: true
    },
    {
        id: 'higherlower',
        name: 'Høyere Lavere',
        icon: '📊',
        description: 'Gjett om neste tall er høyere eller lavere',
        category: 'arcade',
        initFunction: 'initHigherLower',
        themeColor: '#3b82f6',
        enabled: true
    },
    {
        id: 'reactiontime',
        name: 'Reaksjonstid',
        icon: '⚡',
        description: 'Test din reaksjonstid',
        category: 'arcade',
        initFunction: 'initReactionTime',
        themeColor: '#22c55e',
        enabled: true
    },
    {
        id: 'clickcounter',
        name: 'Klikk Teller',
        icon: '🖱️',
        description: 'Klikk så raskt som mulig',
        category: 'arcade',
        initFunction: 'initClickCounter',
        themeColor: '#a855f7',
        enabled: true
    },
    {
        id: 'ordell',
        name: 'Ordell',
        icon: '📝',
        description: 'Gjett 5-bokstavs ord',
        category: 'puzzle',
        initFunction: 'initOrdell',
        themeColor: '#06b6d4',
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

