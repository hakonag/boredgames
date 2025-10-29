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
    
    container.classList.add('hidden');
    gameContainer.classList.remove('hidden');
    
    // Vis en enkel melding for nå
    const gameNames = {
        'solitaire': 'Kabal',
        'yatzy': 'Yatzy',
        'ludo': 'Ludo',
        'tetris': 'Tetris'
    };
    
    gameContent.innerHTML = `
        <h2>${gameNames[gameType]}</h2>
        <p>Dette spillet kommer snart!</p>
        <p>Du klikket på ${gameNames[gameType]}</p>
    `;
}

function goHome() {
    const container = document.querySelector('.container');
    const gameContainer = document.getElementById('game-container');
    
    container.classList.remove('hidden');
    gameContainer.classList.add('hidden');
}
