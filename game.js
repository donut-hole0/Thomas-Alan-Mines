// Game State
let balance = 1000;
let betAmount = 10;
let numMines = 1;
let gameActive = false;
let minesRevealed = [];
let safeRevealed = [];
let gameField = [];
let recentPlays = [];

// Initialize game
function initGame() {
    loadState();
    renderGrid();
    updateUI();
}

// Game Functions
function startGame() {
    if (betAmount > balance) {
        showNotification('Insufficient balance!', 'error');
        return;
    }

    if (gameActive) {
        return;
    }

    balance -= betAmount;
    gameActive = true;
    minesRevealed = [];
    safeRevealed = [];
    
    // Generate random mine positions
    gameField = generateField();
    
    document.getElementById('playBtn').disabled = true;
    updateUI();
}

function generateField() {
    const totalTiles = 25;
    const field = Array(totalTiles).fill('safe');
    
    // Randomly place mines
    const minePositions = new Set();
    while (minePositions.size < numMines) {
        minePositions.add(Math.floor(Math.random() * totalTiles));
    }
    
    minePositions.forEach(pos => {
        field[pos] = 'mine';
    });
    
    return field;
}

function revealTile(index) {
    if (!gameActive || minesRevealed.includes(index) || safeRevealed.includes(index)) {
        return;
    }

    const tile = gameField[index];
    const tileElement = document.querySelectorAll('.tile')[index];

    if (tile === 'mine') {
        minesRevealed.push(index);
        tileElement.classList.add('revealed', 'mine');
        tileElement.textContent = '💣';
        
        endGame(false);
    } else {
        safeRevealed.push(index);
        tileElement.classList.add('revealed', 'safe');
        tileElement.textContent = '✓';
        
        // Check if all safe tiles are revealed
        if (safeRevealed.length === 25 - numMines) {
            endGame(true, true);
        }
        
        updateUI();
    }
}

function cashout() {
    if (!gameActive || safeRevealed.length === 0) {
        return;
    }

    const winnings = calculateWinnings();
    balance += winnings;
    
    addToRecent(true, winnings);
    showNotification(`Won $${winnings}!`, 'success');
    
    endGame(true, false);
}

function endGame(won, completedAll = false) {
    gameActive = false;
    document.getElementById('playBtn').disabled = false;
    document.getElementById('cashoutBtn').disabled = true;
    
    // Disable all tiles
    document.querySelectorAll('.tile').forEach(tile => {
        tile.classList.add('disabled');
    });

    // Reveal all mines
    minesRevealed.forEach(index => {
        const tile = document.querySelectorAll('.tile')[index];
        if (!tile.classList.contains('revealed')) {
            tile.classList.add('revealed', 'mine');
            tile.textContent = '💣';
        }
    });

    if (won) {
        if (!completedAll) {
            const winnings = calculateWinnings();
            balance += winnings;
            addToRecent(true, winnings);
            showNotification(`Won $${winnings}!`, 'success');
        } else {
            const winnings = calculateWinnings();
            balance += winnings;
            addToRecent(true, winnings);
            showNotification(`Perfect! Won $${winnings}!`, 'success');
        }
    } else {
        addToRecent(false, 0);
        showNotification('Hit a mine! Lost $' + betAmount, 'error');
    }

    updateUI();
    saveState();
}

function calculateWinnings() {
    const safeCount = safeRevealed.length;
    const multiplier = getMultiplier(safeCount);
    return Math.floor(betAmount * multiplier);
}

function getMultiplier(safeCount) {
    const minePercentage = numMines / 25;
    const base = 1 + (safeCount * 0.15) + (minePercentage * 0.5);
    return base;
}

function addToRecent(won, amount) {
    const result = won ? `+$${amount}` : `-$${betAmount}`;
    const color = won ? 'win' : 'loss';
    recentPlays.unshift({ result, color });
    if (recentPlays.length > 10) recentPlays.pop();
    renderRecent();
}

function renderRecent() {
    const container = document.getElementById('recentPlays');
    container.innerHTML = recentPlays.map(play => 
        `<div class="recent-item ${play.color}">${play.result}</div>`
    ).join('');
}

function setBet(amount) {
    if (!gameActive) {
        betAmount = amount;
        document.getElementById('betAmount').value = amount;
        updateUI();
    }
}

function setDifficulty(mines) {
    if (!gameActive) {
        numMines = mines;
        document.getElementById('mineCount').textContent = mines;
        document.getElementById('safeCount').textContent = 25 - mines;
        updateUI();
    }
}

function updateUI() {
    // Update balance
    document.getElementById('balance').textContent = balance;
    
    // Update bet display
    betAmount = parseInt(document.getElementById('betAmount').value) || 10;
    document.getElementById('displayBet').textContent = betAmount;
    
    // Update multiplier and win amount
    const multiplier = gameActive ? getMultiplier(safeRevealed.length) : 1;
    const winAmount = gameActive ? calculateWinnings() : 0;
    
    document.getElementById('multiplier').textContent = multiplier.toFixed(2);
    document.getElementById('winAmount').textContent = winAmount;
    
    // Update buttons
    document.getElementById('playBtn').disabled = gameActive;
    document.getElementById('cashoutBtn').disabled = !gameActive || safeRevealed.length === 0;
    
    // Update button text
    if (gameActive && safeRevealed.length > 0) {
        document.getElementById('cashoutBtn').disabled = false;
    }
    
    saveState();
}

function renderGrid() {
    const grid = document.getElementById('gameGrid');
    grid.innerHTML = '';
    
    for (let i = 0; i < 25; i++) {
        const tile = document.createElement('div');
        tile.className = 'tile';
        tile.onclick = () => revealTile(i);
        grid.appendChild(tile);
    }
}

function showNotification(message, type) {
    const notification = document.getElementById('notification');
    notification.textContent = message;
    notification.className = `notification show ${type}`;
    
    setTimeout(() => {
        notification.classList.remove('show');
    }, 3000);
}

function saveState() {
    localStorage.setItem('minesBalance', balance);
    localStorage.setItem('minesBet', betAmount);
    localStorage.setItem('minesDifficulty', numMines);
    localStorage.setItem('minesRecent', JSON.stringify(recentPlays));
}

function loadState() {
    const saved = localStorage.getItem('minesBalance');
    if (saved) balance = parseInt(saved);
    
    const savedBet = localStorage.getItem('minesBet');
    if (savedBet) betAmount = parseInt(savedBet);
    
    const savedDiff = localStorage.getItem('minesDifficulty');
    if (savedDiff) numMines = parseInt(savedDiff);
    
    const savedRecent = localStorage.getItem('minesRecent');
    if (savedRecent) recentPlays = JSON.parse(savedRecent);
    
    document.getElementById('betAmount').value = betAmount;
    document.getElementById('mineCount').textContent = numMines;
    document.getElementById('safeCount').textContent = 25 - numMines;
    
    renderRecent();
}

// Initialize on page load
window.addEventListener('DOMContentLoaded', initGame);

// Keyboard controls
document.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        if (gameActive && safeRevealed.length > 0) {
            cashout();
        } else if (!gameActive) {
            startGame();
        }
    }
});
