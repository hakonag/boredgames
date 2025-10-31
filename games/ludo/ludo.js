// Ludo Game - Placeholder
// This is a template for adding the actual Ludo game

export function init() {
    const gameContent = document.getElementById('game-content');
    gameContent.innerHTML = `
        <button onclick="window.goHome()">← Tilbake</button>
        <h2>🏁 Ludo</h2>
        <div style="padding: 40px; text-align: center;">
            <p style="font-size: 1.2rem; color: #6c757d;">Dette spillet kommer snart!</p>
            <p style="margin-top: 20px; color: #999;">
                For å implementere Ludo, legg til spillet i denne filen.
            </p>
        </div>
    `;
}

export function cleanup() {
    // No cleanup needed for placeholder
}

