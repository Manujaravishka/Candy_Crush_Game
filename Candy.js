// Game variables
const candies = ["Blue", "Orange", "Green", "Yellow", "Red", "Purple"];
const candyEmojis = {
    "Blue": "🟦",
    "Orange": "🟧", 
    "Green": "🟩",
    "Yellow": "🟨",
    "Red": "🟥",
    "Purple": "🟪"
};

let board = [];
const rows = 9;
const columns = 9;
let score = 0;
let level = 1;
let moves = 30;
let targetScore = 1000;
let gameRunning = true;
let comboCount = 0;

let currTile;
let otherTile;
let gameInterval;

// Initialize game
window.onload = function() {
    startGame();
    gameInterval = setInterval(function(){
        if (gameRunning) {
            let crushed = crushCandy();
            if (crushed) {
                slideCandy();
                generateCandy();
                comboCount++;
                if (comboCount > 1) {
                    showComboMessage();
                }
            } else {
                comboCount = 0;
            }
            checkGameState();
        }
    }, 150);
}

function randomCandy() {
    return candies[Math.floor(Math.random() * candies.length)];
}

function startGame() {
    document.getElementById("board").innerHTML = "";
    board = [];
    
    for (let r = 0; r < rows; r++) {
        let row = [];
        for (let c = 0; c < columns; c++) {
            let tile = document.createElement("div");
            tile.id = r.toString() + "-" + c.toString();
            
            let candy = randomCandy();
            tile.innerHTML = candyEmojis[candy];
            tile.className = `candy-${candy.toLowerCase()}`;
            tile.style.cssText = `
                width: 50px;
                height: 50px;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 30px;
                cursor: grab;
                transition: transform 0.2s ease;
                border-radius: 8px;
                user-select: none;
            `;
            
            tile.draggable = true;
            tile.addEventListener("dragstart", dragStart);
            tile.addEventListener("dragover", dragOver);
            tile.addEventListener("dragenter", dragEnter);
            tile.addEventListener("drop", dragDrop);
            tile.addEventListener("dragend", dragEnd);
            
            // Touch events for mobile
            tile.addEventListener("touchstart", handleTouchStart, {passive: false});
            tile.addEventListener("touchmove", handleTouchMove, {passive: false});
            tile.addEventListener("touchend", handleTouchEnd, {passive: false});

            document.getElementById("board").appendChild(tile);
            row.push(tile);
        }
        board.push(row);
    }
    
    // Ensure no initial matches
    setTimeout(() => {
        while (checkValid()) {
            shuffleBoardInternal();
        }
    }, 100);
}

// Touch handling for mobile
let touchStartTile = null;

function handleTouchStart(e) {
    e.preventDefault();
    touchStartTile = this;
}

function handleTouchMove(e) {
    e.preventDefault();
}

function handleTouchEnd(e) {
    e.preventDefault();
    if (touchStartTile && e.changedTouches) {
        const touch = e.changedTouches[0];
        const element = document.elementFromPoint(touch.clientX, touch.clientY);
        if (element && element !== touchStartTile && element.id.includes('-')) {
            currTile = touchStartTile;
            otherTile = element;
            processMove();
        }
    }
    touchStartTile = null;
}

// Drag and drop functions
function dragStart() {
    currTile = this;
}

function dragOver(e) {
    e.preventDefault();
}

function dragEnter(e) {
    e.preventDefault();
}

function dragDrop() {
    otherTile = this;
}

function dragEnd() {
    processMove();
}

function processMove() {
    if (!currTile || !otherTile || currTile === otherTile) return;
    if (!gameRunning || moves <= 0) return;

    let currCoords = currTile.id.split("-");
    let r = parseInt(currCoords[0]);
    let c = parseInt(currCoords[1]);

    let otherCoords = otherTile.id.split("-");
    let r2 = parseInt(otherCoords[0]);
    let c2 = parseInt(otherCoords[1]);

    let moveLeft = c2 == c-1 && r == r2;
    let moveRight = c2 == c+1 && r == r2;
    let moveUp = r2 == r-1 && c == c2;
    let moveDown = r2 == r+1 && c == c2;
    let isAdjacent = moveLeft || moveRight || moveUp || moveDown;

    if (isAdjacent) {
        // Swap candies
        let currContent = currTile.innerHTML;
        let currClass = currTile.className;
        let otherContent = otherTile.innerHTML;
        let otherClass = otherTile.className;

        currTile.innerHTML = otherContent;
        currTile.className = otherClass;
        otherTile.innerHTML = currContent;
        otherTile.className = currClass;

        let validMove = checkValid();
        if (validMove) {
            moves--;
            updateUI();
            createParticleEffect(currTile);
            createParticleEffect(otherTile);
        } else {
            // Revert swap
            currTile.innerHTML = currContent;
            currTile.className = currClass;
            otherTile.innerHTML = otherContent;
            otherTile.className = otherClass;
        }
    }
}

function crushCandy() {
    let candiesCrushed = false;
    candiesCrushed = crushThree() || candiesCrushed;
    candiesCrushed = crushFour() || candiesCrushed;
    candiesCrushed = crushFive() || candiesCrushed;
    return candiesCrushed;
}

function crushThree() {
    let crushed = false;
    
    // Check rows
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < columns-2; c++) {
            let candy1 = board[r][c];
            let candy2 = board[r][c+1];
            let candy3 = board[r][c+2];
            if (candy1.innerHTML === candy2.innerHTML && 
                candy2.innerHTML === candy3.innerHTML && 
                candy1.innerHTML !== "⬜") {
                
                candy1.innerHTML = "⬜";
                candy2.innerHTML = "⬜";
                candy3.innerHTML = "⬜";
                candy1.className = candy2.className = candy3.className = "blank";
                
                score += 30 * (comboCount + 1);
                crushed = true;
                
                createParticleEffect(candy1);
                createParticleEffect(candy2);
                createParticleEffect(candy3);
            }
        }
    }

    // Check columns
    for (let c = 0; c < columns; c++) {
        for (let r = 0; r < rows-2; r++) {
            let candy1 = board[r][c];
            let candy2 = board[r+1][c];
            let candy3 = board[r+2][c];
            if (candy1.innerHTML === candy2.innerHTML && 
                candy2.innerHTML === candy3.innerHTML && 
                candy1.innerHTML !== "⬜") {
                
                candy1.innerHTML = "⬜";
                candy2.innerHTML = "⬜";
                candy3.innerHTML = "⬜";
                candy1.className = candy2.className = candy3.className = "blank";
                
                score += 30 * (comboCount + 1);
                crushed = true;
                
                createParticleEffect(candy1);
                createParticleEffect(candy2);
                createParticleEffect(candy3);
            }
        }
    }
    
    return crushed;
}

function crushFour() {
    let crushed = false;
    
    // Check rows
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < columns-3; c++) {
            let candy1 = board[r][c];
            let candy2 = board[r][c+1];
            let candy3 = board[r][c+2];
            let candy4 = board[r][c+3];
            if (candy1.innerHTML === candy2.innerHTML && 
                candy2.innerHTML === candy3.innerHTML && 
                candy3.innerHTML === candy4.innerHTML && 
                candy1.innerHTML !== "⬜") {
                
                [candy1, candy2, candy3, candy4].forEach(candy => {
                    candy.innerHTML = "⬜";
                    candy.className = "blank";
                    createParticleEffect(candy);
                });
                
                score += 60 * (comboCount + 1);
                crushed = true;
            }
        }
    }

    // Check columns  
    for (let c = 0; c < columns; c++) {
        for (let r = 0; r < rows-3; r++) {
            let candy1 = board[r][c];
            let candy2 = board[r+1][c];
            let candy3 = board[r+2][c];
            let candy4 = board[r+3][c];
            if (candy1.innerHTML === candy2.innerHTML && 
                candy2.innerHTML === candy3.innerHTML && 
                candy3.innerHTML === candy4.innerHTML && 
                candy1.innerHTML !== "⬜") {
                
                [candy1, candy2, candy3, candy4].forEach(candy => {
                    candy.innerHTML = "⬜";
                    candy.className = "blank";
                    createParticleEffect(candy);
                });
                
                score += 60 * (comboCount + 1);
                crushed = true;
            }
        }
    }
    
    return crushed;
}

function crushFive() {
    let crushed = false;
    
    // Check rows
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < columns-4; c++) {
            let matches = [board[r][c], board[r][c+1], board[r][c+2], board[r][c+3], board[r][c+4]];
            if (matches.every(candy => candy.innerHTML === matches[0].innerHTML && candy.innerHTML !== "⬜")) {
                matches.forEach(candy => {
                    candy.innerHTML = "⬜";
                    candy.className = "blank";
                    createParticleEffect(candy);
                });
                score += 100 * (comboCount + 1);
                crushed = true;
            }
        }
    }

    // Check columns
    for (let c = 0; c < columns; c++) {
        for (let r = 0; r < rows-4; r++) {
            let matches = [board[r][c], board[r+1][c], board[r+2][c], board[r+3][c], board[r+4][c]];
            if (matches.every(candy => candy.innerHTML === matches[0].innerHTML && candy.innerHTML !== "⬜")) {
                matches.forEach(candy => {
                    candy.innerHTML = "⬜";
                    candy.className = "blank";
                    createParticleEffect(candy);
                });
                score += 100 * (comboCount + 1);
                crushed = true;
            }
        }
    }
    
    return crushed;
}

function checkValid() {
    // Check rows
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < columns-2; c++) {
            let candy1 = board[r][c];
            let candy2 = board[r][c+1];
            let candy3 = board[r][c+2];
            if (candy1.innerHTML === candy2.innerHTML && 
                candy2.innerHTML === candy3.innerHTML && 
                candy1.innerHTML !== "⬜") {
                return true;
            }
        }
    }

    // Check columns
    for (let c = 0; c < columns; c++) {
        for (let r = 0; r < rows-2; r++) {
            let candy1 = board[r][c];
            let candy2 = board[r+1][c];
            let candy3 = board[r+2][c];
            if (candy1.innerHTML === candy2.innerHTML && 
                candy2.innerHTML === candy3.innerHTML && 
                candy1.innerHTML !== "⬜") {
                return true;
            }
        }
    }

    return false;
}

function slideCandy() {
    for (let c = 0; c < columns; c++) {
        let ind = rows - 1;
        
        // Move all non-blank candies down
        for (let r = rows - 1; r >= 0; r--) {  // Fixed: was using 'columns' instead of 'rows'
            if (board[r][c].innerHTML !== "⬜") {
                if (r !== ind) {
                    board[ind][c].innerHTML = board[r][c].innerHTML;
                    board[ind][c].className = board[r][c].className;
                    board[r][c].innerHTML = "⬜";
                    board[r][c].className = "blank";
                }
                ind--;
            }
        }
    }
}

function generateCandy() {
    for (let c = 0; c < columns; c++) {
        for (let r = 0; r < rows; r++) {
            if (board[r][c].innerHTML === "⬜") {
                let candy = randomCandy();
                board[r][c].innerHTML = candyEmojis[candy];
                board[r][c].className = `candy-${candy.toLowerCase()}`;
            }
        }
    }
}

// UI and game state functions
function updateUI() {
    document.getElementById("score").innerText = `Score: ${score}`;
    document.getElementById("level").innerText = `Level: ${level}`;
    document.getElementById("moves").innerText = `Moves: ${moves}`;
    document.getElementById("target").innerText = `Target: ${targetScore}`;
}

function checkGameState() {
    updateUI();
    
    if (score >= targetScore) {
        level++;
        targetScore = Math.floor(targetScore * 1.5);
        moves += 20;
        showComboMessage("LEVEL UP! 🎉");
    }
    
    if (moves <= 0 && score < targetScore) {
        gameRunning = false;
        showComboMessage("GAME OVER! 😢");
    }
}

function showComboMessage(message = `COMBO x${comboCount}! ⭐`) {
    const messageEl = document.createElement("div");
    messageEl.className = "combo-message";
    messageEl.textContent = message;
    document.body.appendChild(messageEl);
    
    setTimeout(() => {
        document.body.removeChild(messageEl);
    }, 1500);
}

function createParticleEffect(element) {
    const rect = element.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    for (let i = 0; i < 6; i++) {
        const particle = document.createElement("div");
        particle.className = "particle";
        particle.style.cssText = `
            left: ${centerX}px;
            top: ${centerY}px;
            background: ${getRandomColor()};
            --dx: ${(Math.random() - 0.5) * 200}px;
            --dy: ${(Math.random() - 0.5) * 200}px;
        `;
        
        document.body.appendChild(particle);
        setTimeout(() => document.body.removeChild(particle), 1000);
    }
}

function getRandomColor() {
    const colors = ['#ff6b6b', '#ffd93d', '#6bcf7f', '#4d79ff', '#ff6bb3', '#c44569'];
    return colors[Math.floor(Math.random() * colors.length)];
}

// Control functions
function restartGame() {
    score = 0;
    level = 1;
    moves = 30;
    targetScore = 1000;
    gameRunning = true;
    comboCount = 0;
    startGame();
}

function shuffleBoard() {
    if (moves > 0) {
        moves--;
        shuffleBoardInternal();
    }
}

function shuffleBoardInternal() {
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < columns; c++) {
            let candy = randomCandy();
            board[r][c].innerHTML = candyEmojis[candy];
            board[r][c].className = `candy-${candy.toLowerCase()}`;
        }
    }
}

function togglePause() {
    gameRunning = !gameRunning;
    const btn = event.target;
    btn.textContent = gameRunning ? "⏸️ Pause" : "▶️ Resume";
}