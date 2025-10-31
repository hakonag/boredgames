// Snake Game Module

let state = null;

export function init() {
	const gameContent = document.getElementById('game-content');
	gameContent.innerHTML = `
		<button class="back-button-tetris" onclick="window.goHome()">← boredgames</button>
		<div class="snake-root">
			<canvas id="snake-canvas"></canvas>
			<div class="snake-hud">
				<div>Score: <span id="snake-score">0</span></div>
				<button id="snake-restart">Nytt spill</button>
			</div>
		</div>
	`;

	const style = document.createElement('style');
	style.id = 'snake-styles';
	style.textContent = `
		.snake-root { position: relative; width: 100%; max-width: min(640px, 95vw); aspect-ratio: 1 / 1; margin: 0 auto; display: grid; place-items: center; }
		#snake-canvas { width: 100%; height: 100%; background: #111; border: 2px solid #333; border-radius: 0; image-rendering: pixelated; }
		.snake-hud { position: absolute; top: 10px; left: 10px; display: flex; gap: 10px; align-items: center; background: rgba(0,0,0,0.4); color: #fff; padding: 6px 10px; border-radius: 0; }
		.snake-hud button { background: #0d6efd; color: #fff; border: 1px solid #0b5ed7; border-radius: 0; padding: 4px 8px; cursor: pointer; }
		@media (max-width: 768px) {
			.game-container #game-content {
				height: 100vh;
				max-height: 100vh;
				margin: 0;
				padding: 10px;
			}
			.snake-root {
				width: 100%;
				max-width: 100%;
				min-height: calc(100vh - 80px);
			}
			#snake-canvas {
				max-width: 100%;
			}
			.snake-hud {
				font-size: 0.85rem;
				padding: 8px 12px;
			}
			.snake-hud button {
				padding: 6px 12px;
				font-size: 0.85rem;
			}
		}
	`;
	document.head.appendChild(style);

	// Prevent scroll while playing
	const preventKeys = (e) => {
		if (["ArrowUp","ArrowDown","ArrowLeft","ArrowRight"," ","Spacebar"].includes(e.key)) {
			e.preventDefault();
		}
	};
	window.addEventListener('keydown', preventKeys, { passive: false });

	// Create game state
	const canvas = document.getElementById('snake-canvas');
	const ctx = canvas.getContext('2d');
	const gridSize = 20; // cells per row/col
	const cell = 24; // pixels per cell (internal canvas size)
	canvas.width = gridSize * cell;
	canvas.height = gridSize * cell;

	state = {
		ctx,
		gridSize,
		cell,
		dir: { x: 1, y: 0 },
		nextDir: { x: 1, y: 0 },
		snake: [{ x: 8, y: 10 }, { x: 7, y: 10 }],
		food: spawnFood(),
		score: 0,
		lastTime: 0,
		acc: 0,
		speedMs: 110,
		running: true,
		preventKeys,
		touchStart,
		touchEnd,
		rafId: 0,
	};

	updateScore();
	document.getElementById('snake-restart').onclick = () => restart();
	window.addEventListener('keydown', onKey);
	
	// Touch/swipe controls for mobile
	let touchStartX, touchStartY;
	const touchStart = (e) => {
		touchStartX = e.touches[0].clientX;
		touchStartY = e.touches[0].clientY;
	};
	const touchEnd = (e) => {
		if (!touchStartX || !touchStartY) return;
		const touchEndX = e.changedTouches[0].clientX;
		const touchEndY = e.changedTouches[0].clientY;
		const diffX = touchEndX - touchStartX;
		const diffY = touchEndY - touchStartY;
		const absX = Math.abs(diffX);
		const absY = Math.abs(diffY);
		
		if (Math.max(absX, absY) > 30) {
			if (absX > absY) {
				// Horizontal swipe
				if (diffX > 0 && state.dir.x !== -1) state.nextDir = { x: 1, y: 0 };
				else if (diffX < 0 && state.dir.x !== 1) state.nextDir = { x: -1, y: 0 };
			} else {
				// Vertical swipe
				if (diffY > 0 && state.dir.y !== -1) state.nextDir = { x: 0, y: 1 };
				else if (diffY < 0 && state.dir.y !== 1) state.nextDir = { x: 0, y: -1 };
			}
		}
		touchStartX = touchStartY = null;
	};
	canvas.addEventListener('touchstart', touchStart, { passive: true });
	canvas.addEventListener('touchend', touchEnd, { passive: true });
	
	state.rafId = requestAnimationFrame(loop);

	function spawnFood() {
		let fx, fy, conflict;
		do {
			fx = Math.floor(Math.random() * gridSize);
			fy = Math.floor(Math.random() * gridSize);
			conflict = state && state.snake.some(s => s.x === fx && s.y === fy);
		} while (conflict);
		return { x: fx, y: fy };
	}

	function onKey(e) {
		const k = e.key;
		
		// Don't process shortcuts if user is typing in an input field
		const activeElement = document.activeElement;
		if (activeElement && (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA')) {
			return;
		}
		
		// Handle restart (R) - hard refresh
		if (k === 'r' || k === 'R') {
			window.location.href = 'https://hakonag.github.io/boredgames/?game=snake';
			return;
		}
		
		if (k === 'ArrowUp' && state.dir.y !== 1) state.nextDir = { x: 0, y: -1 };
		else if (k === 'ArrowDown' && state.dir.y !== -1) state.nextDir = { x: 0, y: 1 };
		else if (k === 'ArrowLeft' && state.dir.x !== 1) state.nextDir = { x: -1, y: 0 };
		else if (k === 'ArrowRight' && state.dir.x !== -1) state.nextDir = { x: 1, y: 0 };
	}

	function loop(ts) {
		if (!state.running) return;
		const dt = ts - state.lastTime;
		state.lastTime = ts;
		state.acc += dt;
		while (state.acc >= state.speedMs) {
			step();
			state.acc -= state.speedMs;
		}
		draw();
		state.rafId = requestAnimationFrame(loop);
	}

	function step() {
		state.dir = state.nextDir;
		const head = { x: state.snake[0].x + state.dir.x, y: state.snake[0].y + state.dir.y };
		// wrap around
		head.x = (head.x + gridSize) % gridSize;
		head.y = (head.y + gridSize) % gridSize;
		// self collision
		if (state.snake.some((s, i) => i !== 0 && s.x === head.x && s.y === head.y)) {
			gameOver();
			return;
		}
		state.snake.unshift(head);
		if (head.x === state.food.x && head.y === state.food.y) {
			state.score += 10;
			updateScore();
			state.food = spawnFood();
			if (state.speedMs > 60) state.speedMs -= 2;
		} else {
			state.snake.pop();
		}
	}

	function draw() {
		const { ctx, cell, gridSize } = state;
		ctx.clearRect(0, 0, canvas.width, canvas.height);
		// grid background
		ctx.fillStyle = '#0c5131';
		ctx.fillRect(0, 0, canvas.width, canvas.height);
		ctx.strokeStyle = 'rgba(255,255,255,0.05)';
		for (let i = 1; i < gridSize; i++) {
			ctx.beginPath(); ctx.moveTo(i * cell, 0); ctx.lineTo(i * cell, canvas.height); ctx.stroke();
			ctx.beginPath(); ctx.moveTo(0, i * cell); ctx.lineTo(canvas.width, i * cell); ctx.stroke();
		}
		// food
		ctx.fillStyle = '#ff4136';
		ctx.fillRect(state.food.x * cell, state.food.y * cell, cell, cell);
		// snake
		ctx.fillStyle = '#1dd1a1';
		state.snake.forEach((s, idx) => {
			ctx.fillRect(s.x * cell, s.y * cell, cell, cell);
			if (idx === 0) {
				ctx.strokeStyle = '#0b8f73';
				ctx.lineWidth = 2;
				ctx.strokeRect(s.x * cell + 1, s.y * cell + 1, cell - 2, cell - 2);
			}
		});
	}

	function updateScore() {
		const el = document.getElementById('snake-score');
		if (el) el.textContent = String(state.score);
	}

	function gameOver() {
		state.running = false;
		const ctx = state.ctx;
		ctx.fillStyle = 'rgba(0,0,0,0.6)';
		ctx.fillRect(0, 0, canvas.width, canvas.height);
		ctx.fillStyle = '#fff';
		ctx.font = 'bold 28px system-ui';
		ctx.textAlign = 'center';
		ctx.fillText('Game Over', canvas.width/2, canvas.height/2 - 10);
		ctx.font = '16px system-ui';
		ctx.fillText('Trykk "Nytt spill"', canvas.width/2, canvas.height/2 + 16);
	}

	function restart() {
		cancelAnimationFrame(state.rafId);
		window.removeEventListener('keydown', onKey);
		init();
	}
}

export function cleanup() {
	try {
		if (state) {
			cancelAnimationFrame(state.rafId);
			window.removeEventListener('keydown', state.preventKeys);
			const canvas = document.getElementById('snake-canvas');
			if (canvas) {
				// Remove touch listeners if they exist
				canvas.removeEventListener('touchstart', state.touchStart);
				canvas.removeEventListener('touchend', state.touchEnd);
			}
		}
	} catch {}
	const style = document.getElementById('snake-styles');
	if (style && style.parentNode) style.parentNode.removeChild(style);
}


