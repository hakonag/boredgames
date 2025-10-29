// Enkel navigasjon mellom spill
document.addEventListener('DOMContentLoaded', () => {
    const gameCards = document.querySelectorAll('.game-card');
    
    gameCards.forEach(card => {
        card.addEventListener('click', () => {
            const gameType = card.getAttribute('data-game');
            loadGame(gameType);
        });
    });
});

function loadGame(gameType) {
    const container = document.querySelector('.container');
    const gameContainer = document.getElementById('game-container');
    const gameContent = document.getElementById('game-content');
    
    // Clean up previous game (like Tetris controls)
    if (window.tetrisGame && window.tetrisGame.removeControls) {
        window.tetrisGame.removeControls();
    }
    
    // Remove scroll lock
    document.body.style.overflow = '';
    document.body.style.position = '';
    document.body.style.width = '';
    document.body.style.height = '';
    document.documentElement.style.overflow = '';
    
    // Remove scroll prevention listeners if they exist
    if (window.tetrisScrollPrevent) {
        window.removeEventListener('wheel', window.tetrisScrollPrevent.wheel);
        window.removeEventListener('touchmove', window.tetrisScrollPrevent.touchmove);
        window.tetrisScrollPrevent = null;
    }
    
    container.classList.add('hidden');
    gameContainer.classList.remove('hidden');
    
    // Clear previous game
    gameContent.innerHTML = '';
    
    // Remove any existing game styles
    const oldStyle = document.getElementById('game-specific-styles');
    if (oldStyle) oldStyle.remove();
    
    switch(gameType) {
        case 'solitaire':
            initSolitaire();
            break;
        case 'yatzy':
            initYatzy();
            break;
        case 'ludo':
            initLudo();
            break;
        case 'tetris':
            initTetris();
            break;
    }
}

function goHome() {
    // Clean up Tetris controls when leaving
    if (window.tetrisGame && window.tetrisGame.removeControls) {
        window.tetrisGame.removeControls();
    }
    
    // Remove scroll lock
    document.body.style.overflow = '';
    document.body.style.position = '';
    document.body.style.width = '';
    document.body.style.height = '';
    document.documentElement.style.overflow = '';
    
    // Remove scroll prevention listeners
    if (window.tetrisScrollPrevent) {
        window.removeEventListener('wheel', window.tetrisScrollPrevent.wheel);
        window.removeEventListener('touchmove', window.tetrisScrollPrevent.touchmove);
        window.tetrisScrollPrevent = null;
    }
    
    const container = document.querySelector('.container');
    const gameContainer = document.getElementById('game-container');
    
    container.classList.remove('hidden');
    gameContainer.classList.add('hidden');
}

// ========== TETRIS GAME ==========
let tetrisGame = null;

function initTetris() {
    const gameContent = document.getElementById('game-content');
    gameContent.innerHTML = `
        <button class="back-button-tetris" onclick="goHome()">← Tilbake</button>
        <h2>🔲 Tetris</h2>
        <div class="tetris-game">
            <div class="tetris-side-panel">
                <div class="preview-box">
                    <h4>Hold</h4>
                    <canvas id="hold-canvas" width="120" height="120"></canvas>
                    <p style="font-size: 0.8rem; margin-top: 5px;">C / Shift</p>
                </div>
                <div class="preview-box">
                    <h4>Neste</h4>
                    <canvas id="next-canvas" width="120" height="120"></canvas>
                </div>
            </div>
            <div class="tetris-board">
                <canvas id="tetris-canvas" width="300" height="600"></canvas>
                <div class="tetris-info">
                    <p>Poeng: <span id="tetris-score">0</span></p>
                    <p>Linjer: <span id="tetris-lines">0</span></p>
                    <p>Nivå: <span id="tetris-level">1</span></p>
                </div>
            </div>
            <div class="tetris-controls">
                <h3>Kontroller</h3>
                <p>← → Flytt</p>
                <p>↑ Roter</p>
                <p>↓ Raskt fall</p>
                <p>Space Hard drop</p>
                <p>C / Shift Hold</p>
                <button onclick="startTetris()" id="tetris-start-btn">Start</button>
                <button onclick="pauseTetris()" id="tetris-pause-btn" style="display:none">Pause</button>
                <div class="high-scores">
                    <h3>Top 10</h3>
                    <div id="tetris-high-scores"></div>
                </div>
            </div>
        </div>
    `;
    
    // Lock scrolling when Tetris is active
    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.width = '100%';
    document.body.style.height = '100%';
    document.documentElement.style.overflow = 'hidden';
    
    // Prevent wheel scrolling
    const preventScroll = (e) => {
        e.preventDefault();
        return false;
    };
    
    window.addEventListener('wheel', preventScroll, { passive: false });
    window.addEventListener('touchmove', preventScroll, { passive: false });
    window.tetrisScrollPrevent = { wheel: preventScroll, touchmove: preventScroll };
    
    const style = document.createElement('style');
    style.id = 'game-specific-styles';
    style.textContent = `
        body {
            overflow: hidden !important;
            position: fixed !important;
            width: 100% !important;
        }
        html {
            overflow: hidden !important;
        }
        .game-container {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            overflow: hidden !important;
            max-width: 100vw;
            max-height: 100vh;
            margin: 0;
            padding: 5px;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            box-sizing: border-box;
        }
        .game-container #game-content {
            position: relative;
            width: 100%;
            height: 100%;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            max-width: 100%;
            max-height: 100%;
            overflow: hidden;
            box-sizing: border-box;
        }
        .game-container h2 {
            margin-top: 35px;
            margin-bottom: 8px;
            font-size: 1.5rem;
        }
        .back-button-tetris {
            position: fixed;
            top: 10px;
            left: 10px;
            background: #667eea;
            color: white;
            border: none;
            padding: 8px 16px;
            border-radius: 8px;
            font-size: 0.9rem;
            cursor: pointer;
            transition: background 0.3s ease;
            z-index: 10000;
        }
        .back-button-tetris:hover {
            background: #5568d3;
        }
        .tetris-game {
            display: flex;
            gap: 8px;
            justify-content: center;
            align-items: flex-start;
            flex-wrap: wrap;
            max-width: 100%;
            margin-top: 0;
            padding: 0;
            box-sizing: border-box;
        }
        .tetris-side-panel {
            display: flex;
            flex-direction: column;
            gap: 8px;
            flex-shrink: 0;
            max-width: 130px;
        }
        .preview-box {
            background: #f5f5f5;
            border-radius: 6px;
            padding: 6px;
            text-align: center;
            width: 120px;
            max-width: 120px;
            box-sizing: border-box;
        }
        .preview-box h4 {
            margin: 0 0 6px 0;
            font-size: 0.8rem;
            color: #667eea;
        }
        #hold-canvas, #next-canvas {
            background: #000;
            border: 2px solid #333;
            border-radius: 4px;
            display: block;
            width: 100%;
            height: auto;
            max-width: 100%;
        }
        .tetris-board {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 5px;
            flex-shrink: 0;
            max-width: 100%;
        }
        #tetris-canvas {
            border: 3px solid #333;
            background: #000;
            display: block;
            max-width: min(300px, calc(100vw - 300px));
            max-height: min(600px, calc(100vh - 100px));
            width: auto;
            height: auto;
        }
        .tetris-info {
            text-align: center;
            font-size: 0.85rem;
            margin-top: 2px;
        }
        .tetris-info p {
            margin: 1px 0;
        }
        .tetris-controls {
            padding: 10px;
            background: #f5f5f5;
            border-radius: 8px;
            width: 170px;
            max-width: 170px;
            max-height: calc(100vh - 100px);
            overflow-y: auto;
            overflow-x: hidden;
            flex-shrink: 0;
            box-sizing: border-box;
        }
        .tetris-controls h3 {
            margin-bottom: 8px;
            font-size: 0.95rem;
        }
        .tetris-controls p {
            margin: 4px 0;
            font-size: 0.85rem;
        }
        .tetris-controls button {
            background: #667eea;
            color: white;
            border: none;
            padding: 8px 16px;
            border-radius: 6px;
            font-size: 0.9rem;
            cursor: pointer;
            margin-top: 8px;
            width: 100%;
        }
        .tetris-controls button:hover {
            background: #5568d3;
        }
        .high-scores {
            margin-top: 15px;
            padding-top: 12px;
            border-top: 2px solid #ddd;
        }
        .high-scores h3 {
            font-size: 0.95rem;
            margin-bottom: 6px;
        }
        .score-entry {
            display: flex;
            justify-content: space-between;
            padding: 2px 0;
            font-size: 0.8rem;
        }
        .score-entry:first-child {
            font-weight: bold;
            color: #667eea;
        }
        .score-name {
            flex: 1;
            text-align: left;
        }
        .score-value {
            font-weight: bold;
        }
        .score-modal {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.7);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 10000;
        }
        .score-modal-content {
            background: white;
            padding: 30px;
            border-radius: 10px;
            max-width: 400px;
            width: 90%;
            text-align: center;
        }
        .score-modal-content h3 {
            margin-bottom: 20px;
        }
        .score-modal-content input {
            width: 100%;
            padding: 10px;
            font-size: 1rem;
            border: 2px solid #ddd;
            border-radius: 5px;
            margin-bottom: 20px;
            box-sizing: border-box;
        }
        .score-modal-content button {
            background: #667eea;
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 5px;
            font-size: 1rem;
            cursor: pointer;
            margin: 5px;
        }
        .score-modal-content button:hover {
            background: #5568d3;
        }
    `;
    document.head.appendChild(style);
    
    tetrisGame = new TetrisGame();
    window.tetrisGame = tetrisGame; // Store globally for cleanup
    
    // Load and display high scores (async)
    displayHighScores().catch(err => console.log('Error loading scores:', err));
}

class TetrisGame {
    constructor() {
        this.canvas = document.getElementById('tetris-canvas');
        if (!this.canvas) {
            console.error('Tetris canvas not found!');
            return;
        }
        this.ctx = this.canvas.getContext('2d');
        this.grid = Array(20).fill().map(() => Array(10).fill(0));
        this.currentPiece = null;
        this.nextPiece = null;
        this.heldPiece = null;
        this.canHold = true;
        this.score = 0;
        this.lines = 0;
        this.level = 1;
        this.gameLoop = null;
        this.isPaused = false;
        this.fallTime = 0;
        this.fallInterval = 1000;
        
        this.pieces = [
            [[1,1,1,1]], // I
            [[1,1],[1,1]], // O
            [[0,1,0],[1,1,1]], // T
            [[1,1,0],[0,1,1]], // S
            [[0,1,1],[1,1,0]], // Z
            [[1,0,0],[1,1,1]], // L
            [[0,0,1],[1,1,1]]  // J
        ];
        
        this.pieceColors = [
            'hsl(180, 70%, 50%)', // I - cyan
            'hsl(60, 70%, 50%)',  // O - yellow
            'hsl(270, 70%, 50%)', // T - purple
            'hsl(120, 70%, 50%)', // S - green
            'hsl(0, 70%, 50%)',   // Z - red
            'hsl(30, 70%, 50%)',  // L - orange
            'hsl(240, 70%, 50%)'  // J - blue
        ];
        
        this.setupControls();
        // Delay draw slightly to ensure canvas is ready
        setTimeout(() => {
            this.draw();
            this.drawPreviews();
        }, 10);
    }
    
    setupControls() {
        this.keyHandler = (e) => {
            // Prevent default for arrow keys and space when Tetris is active
            if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', ' '].includes(e.key)) {
                // Only prevent default if game is running (not paused and has a piece)
                if (this.currentPiece && !this.isPaused) {
                    e.preventDefault();
                }
            }
            
            // Handle hold (C or Shift)
            if ((e.key === 'c' || e.key === 'C' || e.key === 'Shift') && !this.isPaused && this.currentPiece) {
                this.holdPiece();
                return;
            }
            
            // Only handle keys when game is active
            if (this.isPaused || !this.currentPiece) return;
            
            switch(e.key) {
                case 'ArrowLeft':
                    this.movePiece(-1, 0);
                    break;
                case 'ArrowRight':
                    this.movePiece(1, 0);
                    break;
                case 'ArrowDown':
                    this.movePiece(0, 1);
                    break;
                case 'ArrowUp':
                    this.rotatePiece();
                    break;
                case ' ':
                    this.hardDrop();
                    break;
            }
        };
        
        document.addEventListener('keydown', this.keyHandler);
    }
    
    removeControls() {
        if (this.keyHandler) {
            document.removeEventListener('keydown', this.keyHandler);
        }
    }
    
    start() {
        // Initialize next piece if not already set
        if (!this.nextPiece) {
            const nextPieceIndex = Math.floor(Math.random() * this.pieces.length);
            this.nextPiece = {
                shape: this.pieces[nextPieceIndex],
                pieceIndex: nextPieceIndex,
                color: this.pieceColors[nextPieceIndex]
            };
        }
        this.spawnPiece();
        this.drawPreviews();
        this.gameLoop = setInterval(() => {
            if (!this.isPaused) {
                this.update();
                this.draw();
            }
        }, 16);
        
        document.getElementById('tetris-start-btn').style.display = 'none';
        document.getElementById('tetris-pause-btn').style.display = 'block';
    }
    
    pause() {
        this.isPaused = !this.isPaused;
        document.getElementById('tetris-pause-btn').textContent = this.isPaused ? 'Fortsett' : 'Pause';
    }
    
    spawnPiece() {
        // Use next piece if available, otherwise generate new
        if (this.nextPiece) {
            this.currentPiece = {
                ...this.nextPiece,
                x: 3,
                y: 0
            };
        } else {
            const pieceIndex = Math.floor(Math.random() * this.pieces.length);
            this.currentPiece = {
                shape: this.pieces[pieceIndex],
                pieceIndex: pieceIndex,
                x: 3,
                y: 0,
                color: this.pieceColors[pieceIndex]
            };
        }
        
        // Generate next piece
        const nextPieceIndex = Math.floor(Math.random() * this.pieces.length);
        this.nextPiece = {
            shape: this.pieces[nextPieceIndex],
            pieceIndex: nextPieceIndex,
            color: this.pieceColors[nextPieceIndex]
        };
        
        this.canHold = true; // Reset hold flag
        
        if (this.checkCollision(this.currentPiece)) {
            clearInterval(this.gameLoop);
            this.gameOver();
        }
        
        this.drawPreviews();
    }
    
    holdPiece() {
        if (!this.canHold || !this.currentPiece) return;
        
        // Swap current and held pieces
        const temp = this.heldPiece;
        this.heldPiece = {
            shape: this.currentPiece.shape,
            pieceIndex: this.currentPiece.pieceIndex,
            color: this.currentPiece.color
        };
        
        if (temp) {
            // Place held piece as current
            this.currentPiece = {
                ...temp,
                x: 3,
                y: 0
            };
        } else {
            // Get next piece as current
            if (this.nextPiece) {
                this.currentPiece = {
                    ...this.nextPiece,
                    x: 3,
                    y: 0
                };
                // Generate new next piece
                const nextPieceIndex = Math.floor(Math.random() * this.pieces.length);
                this.nextPiece = {
                    shape: this.pieces[nextPieceIndex],
                    pieceIndex: nextPieceIndex,
                    color: this.pieceColors[nextPieceIndex]
                };
            } else {
                this.spawnPiece();
            }
        }
        
        this.canHold = false; // Can't hold again until next piece is placed
        this.drawPreviews();
    }
    
    movePiece(dx, dy) {
        const newPiece = {...this.currentPiece, x: this.currentPiece.x + dx, y: this.currentPiece.y + dy};
        if (!this.checkCollision(newPiece)) {
            this.currentPiece = newPiece;
        } else if (dy > 0) {
            this.placePiece();
        }
    }
    
    rotatePiece() {
        const rotated = this.currentPiece.shape[0].map((_, i) =>
            this.currentPiece.shape.map(row => row[i]).reverse()
        );
        const newPiece = {...this.currentPiece, shape: rotated};
        if (!this.checkCollision(newPiece)) {
            this.currentPiece = newPiece;
        }
    }
    
    hardDrop() {
        while (!this.checkCollision({...this.currentPiece, y: this.currentPiece.y + 1})) {
            this.currentPiece.y++;
        }
        this.placePiece();
    }
    
    checkCollision(piece) {
        for (let y = 0; y < piece.shape.length; y++) {
            for (let x = 0; x < piece.shape[y].length; x++) {
                if (piece.shape[y][x]) {
                    const nx = piece.x + x;
                    const ny = piece.y + y;
                    
                    if (nx < 0 || nx >= 10 || ny >= 20) return true;
                    if (ny >= 0 && this.grid[ny][nx]) return true;
                }
            }
        }
        return false;
    }
    
    placePiece() {
        for (let y = 0; y < this.currentPiece.shape.length; y++) {
            for (let x = 0; x < this.currentPiece.shape[y].length; x++) {
                if (this.currentPiece.shape[y][x]) {
                    const ny = this.currentPiece.y + y;
                    const nx = this.currentPiece.x + x;
                    if (ny >= 0) {
                        this.grid[ny][nx] = this.currentPiece.color;
                    }
                }
            }
        }
        
        this.clearLines();
        this.spawnPiece();
    }
    
    clearLines() {
        let linesCleared = 0;
        for (let y = this.grid.length - 1; y >= 0; y--) {
            if (this.grid[y].every(cell => cell !== 0)) {
                this.grid.splice(y, 1);
                this.grid.unshift(Array(10).fill(0));
                linesCleared++;
                y++;
            }
        }
        
        if (linesCleared > 0) {
            this.lines += linesCleared;
            this.score += linesCleared * 100 * this.level;
            this.level = Math.floor(this.lines / 10) + 1;
            this.fallInterval = Math.max(100, 1000 - (this.level - 1) * 100);
            
            document.getElementById('tetris-score').textContent = this.score;
            document.getElementById('tetris-lines').textContent = this.lines;
            document.getElementById('tetris-level').textContent = this.level;
        }
    }
    
    update() {
        this.fallTime += 16;
        if (this.fallTime >= this.fallInterval) {
            this.movePiece(0, 1);
            this.fallTime = 0;
        }
    }
    
    getGhostPosition() {
        if (!this.currentPiece) return null;
        
        let ghostY = this.currentPiece.y;
        while (true) {
            const testPiece = {
                ...this.currentPiece,
                y: ghostY + 1
            };
            if (this.checkCollision(testPiece)) {
                break;
            }
            ghostY++;
        }
        
        return {
            ...this.currentPiece,
            y: ghostY
        };
    }
    
    draw() {
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        const cellSize = 30;
        const gridColor = '#1a1a1a';
        
        // Draw grid lines
        this.ctx.strokeStyle = gridColor;
        this.ctx.lineWidth = 1;
        
        // Vertical lines
        for (let x = 0; x <= 10; x++) {
            this.ctx.beginPath();
            this.ctx.moveTo(x * cellSize, 0);
            this.ctx.lineTo(x * cellSize, this.canvas.height);
            this.ctx.stroke();
        }
        
        // Horizontal lines
        for (let y = 0; y <= 20; y++) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y * cellSize);
            this.ctx.lineTo(this.canvas.width, y * cellSize);
            this.ctx.stroke();
        }
        
        // Draw placed blocks
        for (let y = 0; y < 20; y++) {
            for (let x = 0; x < 10; x++) {
                if (this.grid[y][x]) {
                    this.ctx.fillStyle = this.grid[y][x];
                    this.ctx.fillRect(x * cellSize + 1, y * cellSize + 1, cellSize - 2, cellSize - 2);
                    
                    // Add border to placed blocks
                    this.ctx.strokeStyle = '#fff';
                    this.ctx.lineWidth = 1;
                    this.ctx.strokeRect(x * cellSize + 1, y * cellSize + 1, cellSize - 2, cellSize - 2);
                }
            }
        }
        
        // Draw ghost piece (shadow)
        if (this.currentPiece) {
            const ghostPiece = this.getGhostPosition();
            if (ghostPiece && ghostPiece.y !== this.currentPiece.y) {
                this.ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
                this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
                this.ctx.lineWidth = 2;
                
                for (let y = 0; y < ghostPiece.shape.length; y++) {
                    for (let x = 0; x < ghostPiece.shape[y].length; x++) {
                        if (ghostPiece.shape[y][x]) {
                            const px = (ghostPiece.x + x) * cellSize;
                            const py = (ghostPiece.y + y) * cellSize;
                            if (py >= 0) {
                                // Draw ghost with outline only
                                this.ctx.strokeRect(px + 1, py + 1, cellSize - 2, cellSize - 2);
                            }
                        }
                    }
                }
            }
            
            // Draw current piece
            this.ctx.fillStyle = this.currentPiece.color;
            this.ctx.strokeStyle = '#fff';
            this.ctx.lineWidth = 2;
            
            for (let y = 0; y < this.currentPiece.shape.length; y++) {
                for (let x = 0; x < this.currentPiece.shape[y].length; x++) {
                    if (this.currentPiece.shape[y][x]) {
                        const px = (this.currentPiece.x + x) * cellSize;
                        const py = (this.currentPiece.y + y) * cellSize;
                        if (py >= 0) {
                            this.ctx.fillRect(px + 1, py + 1, cellSize - 2, cellSize - 2);
                            this.ctx.strokeRect(px + 1, py + 1, cellSize - 2, cellSize - 2);
                        }
                    }
                }
            }
        }
    }
    
    drawPreviews() {
        // Draw next piece
        const nextCanvas = document.getElementById('next-canvas');
        if (nextCanvas && this.nextPiece) {
            const ctx = nextCanvas.getContext('2d');
            ctx.fillStyle = '#000';
            ctx.fillRect(0, 0, nextCanvas.width, nextCanvas.height);
            
            if (this.nextPiece) {
                this.drawPiecePreview(ctx, this.nextPiece, nextCanvas.width, nextCanvas.height);
            }
        }
        
        // Draw held piece
        const holdCanvas = document.getElementById('hold-canvas');
        if (holdCanvas) {
            const ctx = holdCanvas.getContext('2d');
            ctx.fillStyle = '#000';
            ctx.fillRect(0, 0, holdCanvas.width, holdCanvas.height);
            
            if (this.heldPiece) {
                this.drawPiecePreview(ctx, this.heldPiece, holdCanvas.width, holdCanvas.height);
            }
        }
    }
    
    drawPiecePreview(ctx, piece, canvasWidth, canvasHeight) {
        const shape = piece.shape;
        const cellSize = 20;
        const shapeWidth = shape[0].length;
        const shapeHeight = shape.length;
        
        // Center the piece
        const offsetX = (canvasWidth - shapeWidth * cellSize) / 2;
        const offsetY = (canvasHeight - shapeHeight * cellSize) / 2;
        
        ctx.fillStyle = piece.color;
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 1;
        
        for (let y = 0; y < shapeHeight; y++) {
            for (let x = 0; x < shapeWidth; x++) {
                if (shape[y][x]) {
                    const px = offsetX + x * cellSize;
                    const py = offsetY + y * cellSize;
                    ctx.fillRect(px + 1, py + 1, cellSize - 2, cellSize - 2);
                    ctx.strokeRect(px + 1, py + 1, cellSize - 2, cellSize - 2);
                }
            }
        }
    }
    
    gameOver() {
        const finalScore = this.score;
        if (finalScore > 0) {
            showScoreModal(finalScore);
        } else {
            setTimeout(() => {
                this.reset();
            }, 1000);
        }
    }
    
    reset() {
        this.grid = Array(20).fill().map(() => Array(10).fill(0));
        this.score = 0;
        this.lines = 0;
        this.level = 1;
        this.fallTime = 0;
        this.fallInterval = 1000;
        this.currentPiece = null;
        this.nextPiece = null;
        this.heldPiece = null;
        this.canHold = true;
        document.getElementById('tetris-score').textContent = '0';
        document.getElementById('tetris-lines').textContent = '0';
        document.getElementById('tetris-level').textContent = '1';
        document.getElementById('tetris-start-btn').style.display = 'block';
        document.getElementById('tetris-pause-btn').style.display = 'none';
        clearInterval(this.gameLoop);
        this.draw();
        this.drawPreviews();
    }
}

function startTetris() {
    if (tetrisGame) tetrisGame.start();
}

function pauseTetris() {
    if (tetrisGame) tetrisGame.pause();
}

// ========== HIGH SCORE SYSTEM ==========
// Using JSONBin.io for shared scores (free tier)
// INSTRUKSJONER: Se SETUP_SCORES.md for hvordan du setter dette opp
const SCORES_BIN_ID = '690215d8ae596e708f35a6f6'; // Bin ID fra JSONBin.io
const JSONBIN_API_KEY = '$2a$10$1O0Z6MZSatbiabe61Zuhm.wyX.0PsnBCG/fF5aerdhynJnaQHkQgG'; // Master Key fra JSONBin.io

async function getHighScores() {
    try {
        // Get local scores as fallback
        const localScores = localStorage.getItem('tetrisHighScores');
        const localScoresArray = localScores ? JSON.parse(localScores) : [];
        
        // Try to fetch from JSONBin if configured
        if (JSONBIN_API_KEY && SCORES_BIN_ID && SCORES_BIN_ID !== 'tetris-high-scores') {
            try {
                const response = await fetch(`https://api.jsonbin.io/v3/b/${SCORES_BIN_ID}/latest`, {
                    headers: {
                        'X-Master-Key': JSONBIN_API_KEY
                    }
                });
                
                if (response.ok) {
                    const data = await response.json();
                    // Handle different response formats
                    let remoteScores = [];
                    
                    if (Array.isArray(data.record)) {
                        remoteScores = data.record;
                    } else if (data.record && Array.isArray(data.record.scores)) {
                        remoteScores = data.record.scores;
                    } else if (data.record && typeof data.record === 'object') {
                        // Try to extract array from object
                        const keys = Object.keys(data.record);
                        if (keys.length > 0 && Array.isArray(data.record[keys[0]])) {
                            remoteScores = data.record[keys[0]];
                        }
                    }
                    
                    // Filter out any placeholder/example scores
                    remoteScores = remoteScores.filter(s => 
                        s && s.name && s.score !== undefined && 
                        !(s.name === 'Eksempel' && s.score === 1000)
                    );
                    
                    // Merge local and remote scores (avoid duplicates)
                    const allScores = [...localScoresArray, ...remoteScores];
                    const uniqueScores = [];
                    const seen = new Set();
                    
                    allScores.forEach(score => {
                        const key = `${score.name}-${score.score}-${score.date}`;
                        if (!seen.has(key)) {
                            seen.add(key);
                            uniqueScores.push(score);
                        }
                    });
                    
                    uniqueScores.sort((a, b) => b.score - a.score);
                    const top10 = uniqueScores.slice(0, 10);
                    
                    // Update localStorage with merged scores
                    localStorage.setItem('tetrisHighScores', JSON.stringify(top10));
                    
                    return top10;
                }
            } catch (error) {
                console.log('Could not fetch remote scores, using local:', error);
            }
        } else {
            console.log('JSONBin not configured. Using local scores only.');
        }
        
        // Fallback to localStorage
        return localScoresArray;
    } catch (error) {
        console.error('Error getting high scores:', error);
        const localScores = localStorage.getItem('tetrisHighScores');
        return localScores ? JSON.parse(localScores) : [];
    }
}

async function saveHighScore(name, score) {
    // Get current scores (both local and remote)
    const currentScores = await getHighScores();
    const newScore = { name: name || 'Anonym', score: score, date: new Date().toISOString() };
    
    // Add new score and sort
    currentScores.push(newScore);
    currentScores.sort((a, b) => b.score - a.score);
    const top10 = currentScores.slice(0, 10);
    
    // Save to localStorage
    localStorage.setItem('tetrisHighScores', JSON.stringify(top10));
    
    // Try to save to JSONBin
    if (JSONBIN_API_KEY && SCORES_BIN_ID && SCORES_BIN_ID !== 'tetris-high-scores') {
        try {
            const response = await fetch(`https://api.jsonbin.io/v3/b/${SCORES_BIN_ID}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Master-Key': JSONBIN_API_KEY
                },
                body: JSON.stringify(top10)
            });
            
            if (response.ok) {
                console.log('Score saved to cloud successfully!');
            }
        } catch (error) {
            console.log('Could not save to remote, saved locally:', error);
        }
    } else {
        console.log('JSONBin not configured. Scores saved locally only.');
    }
    
    displayHighScores();
    return top10;
}

async function displayHighScores() {
    const scoresContainer = document.getElementById('tetris-high-scores');
    if (!scoresContainer) return;
    
    const scores = await getHighScores();
    
    if (scores.length === 0) {
        scoresContainer.innerHTML = '<p style="color: #999; font-size: 0.85rem;">Ingen scores ennå</p>';
        return;
    }
    
    scoresContainer.innerHTML = scores.map((entry, index) => `
        <div class="score-entry">
            <span class="score-name">${index + 1}. ${entry.name}</span>
            <span class="score-value">${entry.score.toLocaleString()}</span>
        </div>
    `).join('');
}

function showScoreModal(score) {
    const modal = document.createElement('div');
    modal.className = 'score-modal';
    modal.innerHTML = `
        <div class="score-modal-content">
            <h3>Ny high score!</h3>
            <p>Du fikk ${score.toLocaleString()} poeng</p>
            <p>Skriv inn navnet ditt:</p>
            <input type="text" id="score-name-input" maxlength="20" placeholder="Ditt navn" autofocus>
            <div>
                <button onclick="submitScore(${score})">Lagre</button>
                <button onclick="skipScore()">Hopp over</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    const input = document.getElementById('score-name-input');
    input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            submitScore(score);
        }
    });
    
    input.focus();
}

function submitScore(score) {
    const input = document.getElementById('score-name-input');
    const name = input ? input.value.trim() : '';
    saveHighScore(name, score);
    
    const modal = document.querySelector('.score-modal');
    if (modal) modal.remove();
    
    if (tetrisGame) {
        setTimeout(() => {
            tetrisGame.reset();
        }, 500);
    }
}

function skipScore() {
    const modal = document.querySelector('.score-modal');
    if (modal) modal.remove();
    
    if (tetrisGame) {
        setTimeout(() => {
            tetrisGame.reset();
        }, 500);
    }
}

// ========== PLACEHOLDER FOR OTHER GAMES ==========
function initSolitaire() {
    const gameContent = document.getElementById('game-content');
    gameContent.innerHTML = `
        <h2>🃏 Kabal</h2>
        <p>Dette spillet kommer snart!</p>
    `;
}

function initYatzy() {
    const gameContent = document.getElementById('game-content');
    gameContent.innerHTML = `
        <h2>🎲 Yatzy</h2>
        <p>Dette spillet kommer snart!</p>
    `;
}

function initLudo() {
    const gameContent = document.getElementById('game-content');
    gameContent.innerHTML = `
        <h2>🏁 Ludo</h2>
        <p>Dette spillet kommer snart!</p>
    `;
}
