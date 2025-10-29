# boredgames

Games to play when you are bored!

## Structure

This project uses a modular architecture designed to scale to 20/50/100+ games easily.

- **`core/`** - Core systems (app entry point, game registry, loader, navigation, high scores)
- **`games/`** - Individual game modules (each game in its own folder)
- **`docs/`** - Documentation (structure guide, setup instructions)
- **`styles/`** - Optional game-specific CSS

## Quick Start

Just open `index.html` in a browser. Games are automatically loaded from the registry.

## Adding Games

See [`docs/STRUCTURE.md`](docs/STRUCTURE.md) for detailed instructions on adding new games.

## High Scores

To set up cloud-based high scores, see [`docs/SETUP_SCORES.md`](docs/SETUP_SCORES.md).

## Development

The main entry point is `core/app.js`, which:
1. Loads the game registry
2. Dynamically generates game cards on the homepage
3. Handles game loading when a card is clicked

Each game is self-contained in `games/{gameId}/{gameId}.js` and exports an `init()` function.
