# Project Structure

This project has been restructured to support scalability - adding 20/50/100+ games easily!

## Folder Structure

```
boredgames/
├── core/               # Shared utilities and core systems
│   ├── app.js              # Main entry point (uses registry)
│   ├── gameRegistry.js     # Registry of all available games
│   ├── gameLoader.js       # Handles dynamic game loading
│   ├── navigation.js       # Navigation and cleanup functions
│   └── highScores.js       # Shared high score system (JSONBin.io + localStorage)
│
├── games/              # Individual game modules
│   ├── tetris/
│   │   └── tetris.js      # Tetris game implementation
│   ├── solitaire/
│   │   └── solitaire.js   # Solitaire/Kabal game implementation
│   ├── yatzy/
│   │   └── yatzy.js       # Yatzy game (placeholder)
│   └── ludo/
│       └── ludo.js        # Ludo game (placeholder)
│
├── docs/              # Documentation files
│   ├── STRUCTURE.md       # This file - project structure guide
│   └── SETUP_SCORES.md    # High score system setup instructions
│
├── styles/             # Stylesheets
│   └── main.css        # Main stylesheet
├── index.html          # Main HTML (game cards generated dynamically)
```

## Adding a New Game

### Step 1: Add to Game Registry

Edit `core/gameRegistry.js` and add your game:

```javascript
export const gameRegistry = [
    // ... existing games ...
    {
        id: 'mygame',
        name: 'My Game',
        icon: '🎮',
        description: 'My awesome game',
        category: 'puzzle',
        initFunction: 'initMyGame',
        enabled: true
    }
];
```

### Step 2: Create Game Folder and File

Create `games/mygame/mygame.js`:

```javascript
// games/mygame/mygame.js
import { displayHighScores, showScoreModal } from '../../core/highScores.js';
import { goHome } from '../../core/navigation.js';

let myGame = null;

export function init() {
    const gameContent = document.getElementById('game-content');
    gameContent.innerHTML = `
        <button onclick="window.goHome()">← Tilbake</button>
        <h2>🎮 My Game</h2>
        <div id="my-game-board">
            <!-- Your game HTML here -->
        </div>
    `;
    
    // Add game-specific styles
    const style = document.createElement('style');
    style.id = 'game-specific-styles';
    style.textContent = `
        /* Your game styles here */
    `;
    document.head.appendChild(style);
    
    // Initialize your game
    myGame = new MyGame();
}

export function cleanup() {
    // Clean up event listeners, timers, etc.
    if (myGame) {
        myGame.cleanup();
        myGame = null;
    }
}

class MyGame {
    constructor() {
        // Initialize your game
    }
    
    cleanup() {
        // Remove event listeners, clear intervals, etc.
    }
}
```

### Step 3: That's it!

The game will automatically appear on the homepage. No need to modify `index.html` or `core/app.js`.

## Game Module Requirements

Each game module (`games/{gameId}/{gameId}.js`) must:

1. **Export an `init()` function** - Called when the game is loaded
2. **Optionally export a `cleanup()` function** - Called when leaving the game
3. **Use `window.goHome()`** for the back button
4. **Add game-specific styles** with id `game-specific-styles` (will be auto-removed on cleanup)

## Shared Utilities

### High Scores (`core/highScores.js`)

```javascript
import { displayHighScores, showScoreModal, saveHighScore } from '../../core/highScores.js';

// Display scores in a container
displayHighScores('my-score-container', 'mygame');

// Show score modal when game ends
showScoreModal('mygame', score, 
    () => { /* on submit callback */ },
    () => { /* on skip callback */ }
);

// Save score programmatically
await saveHighScore('mygame', playerName, score);
```

### Navigation (`core/navigation.js`)

```javascript
import { goHome } from '../../core/navigation.js';

// Navigate back to homepage
goHome();
```

## Benefits of This Structure

✅ **Scalable** - Add unlimited games without touching main code  
✅ **Modular** - Each game is self-contained  
✅ **Maintainable** - Easy to find and update individual games  
✅ **Shared Code** - Common utilities (high scores, navigation) in one place  
✅ **Dynamic Loading** - Games only load when clicked (performance)  
✅ **Clean Separation** - Game logic, styles, and assets organized

## Migration Notes

The old single-file structure (original `script.js` - now backed up as `script.old.js`) has been split:
- **Tetris**: Needs to be moved to `games/tetris/tetris.js`  
- **Solitaire**: Needs to be moved to `games/solitaire/solitaire.js`  
- **High Scores**: Now in `core/highScores.js` (reusable across games)  
- **Navigation**: Now in `core/navigation.js`

