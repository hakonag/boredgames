// Roulette Game - Placeholder
// This is a template for adding the actual Roulette game

export function init() {
    const gameContent = document.getElementById('game-content');
    gameContent.innerHTML = `
        <button onclick="window.goHome()">← Tilbake</button>
        <h2>🎰 Roulette</h2>
        <div style="padding: 40px; text-align: center;">
            <p style="font-size: 1.2rem; color: #ffff00; text-shadow: 2px 2px 0 #ff0000;">Dette spillet kommer snart!</p>
            <p style="margin-top: 20px; color: #00ffff;">
                For å implementere Roulette, legg til spillet i denne filen.
            </p>
        </div>
    `;
}

export function cleanup() {
    // No cleanup needed for placeholder
}

