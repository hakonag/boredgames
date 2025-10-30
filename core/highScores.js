// Shared High Score System - Can be used by any game
// Using JSONBin.io for shared scores (free tier)

const SCORES_BIN_ID = '690215d8ae596e708f35a6f6'; // Bin ID fra JSONBin.io
const JSONBIN_API_KEY = '$2a$10$1O0Z6MZSatbiabe61Zuhm.wyX.0PsnBCG/fF5aerdhynJnaQHkQgG'; // Master Key fra JSONBin.io

export async function getHighScores(gameId = 'tetris') {
    try {
        const storageKey = `${gameId}HighScores`;
        // Get local scores as fallback
        const localScores = localStorage.getItem(storageKey);
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
                    
                    // Filter by gameId and remove any placeholder/example scores
                    remoteScores = remoteScores.filter(s => 
                        s && s.name && s.score !== undefined && s.gameId === gameId &&
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
                    const top30 = uniqueScores.slice(0, 30);
                    
                    // Update localStorage with merged scores
                    localStorage.setItem(storageKey, JSON.stringify(top30));
                    
                    return top30;
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
        const storageKey = `${gameId}HighScores`;
        const localScores = localStorage.getItem(storageKey);
        return localScores ? JSON.parse(localScores) : [];
    }
}

export async function saveHighScore(gameId, name, score) {
    const storageKey = `${gameId}HighScores`;
    // Get current scores (both local and remote)
    const currentScores = await getHighScores(gameId);
    const newScore = { 
        gameId: gameId,
        name: name || 'Anonym', 
        score: score, 
        date: new Date().toISOString() 
    };
    
    // Add new score and sort
    currentScores.push(newScore);
    currentScores.sort((a, b) => b.score - a.score);
    const top30 = currentScores.slice(0, 30);
    
    // Save to localStorage
    localStorage.setItem(storageKey, JSON.stringify(top30));
    
    // Try to save to JSONBin and wait for it to complete
    if (JSONBIN_API_KEY && SCORES_BIN_ID && SCORES_BIN_ID !== 'tetris-high-scores') {
        try {
            const response = await fetch(`https://api.jsonbin.io/v3/b/${SCORES_BIN_ID}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Master-Key': JSONBIN_API_KEY
                },
                body: JSON.stringify(top30)
            });
            
            if (!response.ok) {
                throw new Error(`Failed to save: ${response.status} ${response.statusText}`);
            }
            
            // Wait for response to ensure it's saved
            await response.json();
            console.log('Score saved to cloud successfully!');
        } catch (error) {
            console.log('Could not save to remote, saved locally:', error);
            // Still continue - local save worked
        }
    } else {
        console.log('JSONBin not configured. Scores saved locally only.');
    }
    
    return top30;
}

export function displayHighScores(containerId, gameId, limit = 10) {
    const scoresContainer = document.getElementById(containerId);
    if (!scoresContainer) return Promise.resolve();
    
    return getHighScores(gameId).then(scores => {
        if (scores.length === 0) {
            scoresContainer.innerHTML = '<p style="color: #999; font-size: 0.85rem;">Ingen scores ennå</p>';
            return;
        }
        
        // Show up to limit scores (default 30, but can be customized per game)
        const displayScores = scores.slice(0, limit);
        scoresContainer.innerHTML = displayScores.map((entry, index) => `
            <div class="score-entry">
                <div class="score-name">${index + 1}. ${entry.name}</div>
                <div class="score-value">${entry.score.toLocaleString()}</div>
            </div>
        `).join('');
    }).catch(err => {
        console.error('Error displaying scores:', err);
        scoresContainer.innerHTML = '<p style="color: #999; font-size: 0.85rem;">Kunne ikke laste scores</p>';
    });
}

export function showScoreModal(gameId, score, onSubmit, onSkip) {
    const modal = document.createElement('div');
    modal.className = 'score-modal';
    modal.innerHTML = `
        <div class="score-modal-content">
            <h3>Ny high score!</h3>
            <p>Du fikk ${score.toLocaleString()} poeng</p>
            <p>Skriv inn navnet ditt:</p>
            <input type="text" id="score-name-input" maxlength="20" placeholder="Ditt navn" autofocus>
            <div>
                <button id="submit-score-btn" onclick="window.currentScoreSubmit(${score})">Lagre</button>
                <button onclick="window.currentScoreSkip()">Hopp over</button>
            </div>
            <p id="save-status" style="margin-top: 10px; color: #666; font-size: 0.9rem;"></p>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Store callbacks globally for onclick handlers
    window.currentScoreSubmit = async (scoreValue) => {
        const input = document.getElementById('score-name-input');
        const submitBtn = document.getElementById('submit-score-btn');
        const status = document.getElementById('save-status');
        
        if (submitBtn.disabled) return;
        
        const name = input ? input.value.trim() : '';
        
        submitBtn.disabled = true;
        submitBtn.textContent = 'Lagrer...';
        status.textContent = 'Lagrer score...';
        
        try {
            await saveHighScore(gameId, name, scoreValue);
            status.textContent = 'Score lagret!';
            status.style.color = '#4caf50';
            
            setTimeout(() => {
                modal.remove();
                window.currentScoreSubmit = null;
                window.currentScoreSkip = null;
                if (onSubmit) onSubmit();
            }, 500);
        } catch (error) {
            console.error('Error saving score:', error);
            status.textContent = 'Feil ved lagring. Prøv igjen.';
            status.style.color = '#f44336';
            submitBtn.disabled = false;
            submitBtn.textContent = 'Lagre';
        }
    };
    
    window.currentScoreSkip = () => {
        modal.remove();
        window.currentScoreSubmit = null;
        window.currentScoreSkip = null;
        if (onSkip) onSkip();
    };
    
    const input = document.getElementById('score-name-input');
    const submitBtn = document.getElementById('submit-score-btn');
    
    input.addEventListener('keypress', async (e) => {
        if (e.key === 'Enter' && !submitBtn.disabled) {
            await window.currentScoreSubmit(score);
        }
    });
    
    input.focus();
}


