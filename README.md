# BOREDGAMES

Fast, modern, no-login browser games — built to beat boredom in seconds.

Hit play, drop into a game, and chase the leaderboard. Minimal friction, maximum fun.

## Highlights

- Modular architecture built to scale to 20/50/100+ games
- Clean, readable UI with a simple white theme
- Dynamic game loader (no reloads between games)
- Tetris with buttery-smooth rendering (requestAnimationFrame), ghost piece, hold, previews, and background music with mute
- Local high scores out of the box and optional cloud sync
- Keyboard-first controls with clear on-screen hints (Lucide icons)

## Quick Start

1) Open `index.html` in your browser.

If your browser blocks ES modules on the file:// protocol, serve the folder locally:
- VS Code: “Live Server” extension
- Node: `npx http-server -p 8010`
- Python: `python -m http.server 8010`

Then visit `http://localhost:8010`.

## Repository Structure

- `core/` — App entry, game loader, registry, navigation, high scores
- `games/` — Each game in its own folder (e.g., `games/tetris/tetris.js`)
- `styles/` — Global site styles
- `index.html` — Landing page and shell
- `SETUP_SCORES.md` — Optional cloud high-scores setup

## Tetris Features

- Smooth 60 FPS loop with `requestAnimationFrame` and delta timing
- DevicePixelRatio-scaled canvas for crisp pixels
- Offscreen-cached grid for fewer per-frame draw calls
- Ghost piece, hard drop, soft drop, rotate, move
- Hold queue and next-piece preview
- Background music with mute/unmute, plus Pause/Restart controls
- Compact, readable top-10 leaderboard

Controls (default):
- Move: Left/Right
- Rotate: Up
- Soft drop: Down
- Hard drop: Space
- Hold: C or Shift
- Pause: P
- Restart: R
- Mute: M

## Add a New Game

1) Create a folder: `games/<your-game>/<your-game>.js`
2) Export at least `init()` and optionally `cleanup()`
3) Register it in `core/gameRegistry.js`

Example export:
```js
export function init() {
  const mount = document.getElementById('game-content');
  mount.innerHTML = '<h2>My Game</h2>';
}

export function cleanup() {
  // remove listeners, timers, etc.
}
```

## High Scores

High scores are stored locally by default. To enable cloud sync, follow `SETUP_SCORES.md`.

The UI shows the top 10 scores, compact and readable, with no horizontal scrolling.

## Contributing

Issues and PRs welcome. Keep code readable and modular:
- One game per folder
- No global leakage; clean up listeners/timers in `cleanup()`
- Prefer small, focused modules with explicit exports

## License

MIT — have fun and ship games.
