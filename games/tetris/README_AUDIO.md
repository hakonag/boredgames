# Tetris Background Music Setup

## How to Add Background Music

To add background music to the Tetris game:

1. **Get an audio file** - You'll need either:
   - An MP3 file (recommended for web)
   - A WAV file (larger but better quality)
   
   Popular options:
   - Use a royalty-free Tetris-style song from sites like:
     - [Freesound.org](https://freesound.org/)
     - [OpenGameArt.org](https://opengameart.org/)
     - [Incompetech](https://incompetech.com/music/royalty-free/) (Kevin MacLeod)
   - Or use your own music file

2. **Place the file** - Create the directory and add your file:
   ```
   games/tetris/assets/tetris-theme.wav
   ```
   
   The code is already configured to use WAV format.

## Features

- **Auto-plays** when the game starts
- **Loops continuously** while playing
- **Volume set to 30%** (adjustable in code)
- **Respects mute button** - stops when muted
- **Pauses** when game is paused
- **Stops** when game is reset

## Current Settings

- File: `games/tetris/assets/tetris-theme.wav`
- Volume: 30% (adjust in `setupAudio()` method)
- Loop: Enabled
- Auto-play: On game start
- Mute/Unmute: M key or Mute button

## File Size Recommendations

For web performance:
- **MP3**: Recommended, smaller file size
- **OGG**: Good alternative, open format
- **WAV**: Larger files, but higher quality

Keep files under 2-3 MB for best performance.

