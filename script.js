// Game variables
const gridSize = 4; // 4x4 grid
const grid = document.getElementById("grid");
const generateItemBtn = document.getElementById("generateItemBtn");
const resetGameBtn = document.getElementById("resetGameBtn");
const scoreDisplay = document.getElementById("score");
let items = []; // Array to store item objects
let score = 0;
let autoGenerateInterval;
let totalScore = 0;
let currentDifficulty = 1;

// Game progression variables
let currentGridSize = 4;
let currentWinCondition = 1;
const maxGridSize = 7;

// Item progression hierarchy
const itemHierarchy = {
    1: { icon: "fa-solid fa-leaf", nextLevel: 2, level: 1, score: 10 },
    2: { icon: "fa-solid fa-tree", nextLevel: 3, level: 2, score: 25 },
    3: { icon: "fa-solid fa-mountain", nextLevel: 4, level: 3, score: 50 },
    4: { icon: "fa-solid fa-sun", nextLevel: 5, level: 4, score: 100 },
    5: { icon: "fa-solid fa-globe-americas", nextLevel: 6, level: 5, score: 200 },
    6: { icon: "fa-solid fa-rocket", nextLevel: 7, level: 6, score: 400 },
    7: { icon: "fa-solid fa-star", nextLevel: 8, level: 7, score: 800 },
    8: { icon: "fa-solid fa-infinity", nextLevel: null, level: 8, score: 1600, isInfinity: true }
};

// Function to check win condition
function checkWinCondition() {
    const infinityCount = items.filter(item => item && item.id === 8).length;
    if (infinityCount >= currentWinCondition) {
        showWinScreen();
    }
}

// Function to show win screen
function showWinScreen() {
    clearInterval(autoGenerateInterval);
    const winScreen = document.createElement('div');
    winScreen.classList.add('win-screen');
    winScreen.innerHTML = `
        <h2>Congratulations!</h2>
        <p>You've created ${currentWinCondition} infinity item${currentWinCondition > 1 ? 's' : ''}!</p>
        <p>Your current score: ${totalScore}</p>
        ${currentGridSize < maxGridSize ? 
            `<button id="nextLevelBtn">Proceed to ${currentGridSize + 1}x${currentGridSize + 1} grid</button>` :
            '<p>You\'ve reached the maximum grid size!</p>'}
        <button id="resetGameBtn">Reset Game</button>
    `;
    document.body.appendChild(winScreen);

    const nextLevelBtn = document.getElementById('nextLevelBtn');
    if (nextLevelBtn) {
        nextLevelBtn.addEventListener('click', () => {
            currentGridSize++;
            currentWinCondition = currentGridSize === 5 ? 2 : currentGridSize === 6 ? 4 : 8;
            currentDifficulty++;
            document.body.removeChild(winScreen);
            resetGrid();
            updateDifficultyDisplay();
        });
    }

    document.getElementById('resetGameBtn').addEventListener('click', () => {
        currentGridSize = 4;
        currentWinCondition = 1;
        currentDifficulty = 1;
        totalScore = 0;
        document.body.removeChild(winScreen);
        resetGame();
    });
}

// New function to reset the grid without resetting the score
function resetGrid() {
    clearInterval(autoGenerateInterval);
    initializeGrid();
    items = new Array(currentGridSize * currentGridSize).fill(null);
    isGridFull = false;
    removeGridFullClass();
    saveGameState();
    startGame();
}

// Function to create a grid cell
function createGridCell() {
    const cell = document.createElement("div");
    cell.classList.add("grid-cell");
    cell.setAttribute("draggable", "true");
    return cell;
}

// Function to generate a random item
function generateRandomItem() {
    const itemId = 1; // Start with the base item
    return {
        id: itemId,
        icon: itemHierarchy[itemId].icon,
        level: itemHierarchy[itemId].level
    };
}

// Function to add an item to the grid
function addItemToGrid(item, cellIndex) {
    console.log(`Adding item to grid at index ${cellIndex}:`, item);
    
    if (cellIndex < 0 || cellIndex >= currentGridSize * currentGridSize) {
        console.error("Invalid cell index:", cellIndex);
        return;
    }

    const cell = grid.children[cellIndex];
    if (!cell) {
        console.error("Cell not found for index:", cellIndex);
        return;
    }

    const itemLevel = itemHierarchy[item.id]?.level;
    if (!itemLevel) {
        console.error("Invalid item level for id:", item.id);
        return;
    }

    cell.innerHTML = `<span class="item-level-${itemLevel}"><i class="${item.icon}"></i></span>`;
    cell.classList.add('new-item');
    setTimeout(() => cell.classList.remove('new-item'), 500);
    
    items[cellIndex] = { ...item };
    cell.setAttribute("data-item-index", cellIndex);
    addDragAndDropListeners(cell);
    
    console.log(`Item added successfully to grid at index ${cellIndex}`);
}

// Function to handle item dragging
function addDragAndDropListeners(cell) {
    cell.removeEventListener("dragstart", handleDragStart);
    cell.removeEventListener("dragover", handleDragOver);
    cell.removeEventListener("drop", handleDrop);

    cell.addEventListener("dragstart", handleDragStart);
    cell.addEventListener("dragover", handleDragOver);
    cell.addEventListener("drop", handleDrop);
}

let draggedItemIndex = null;

function handleDragStart(event) {
    draggedItemIndex = parseInt(event.target.closest(".grid-cell").getAttribute("data-item-index"));
    event.dataTransfer.setData("text/plain", draggedItemIndex);
}

function handleDragOver(event) {
    event.preventDefault();
}

function handleDrop(event) {
    event.preventDefault();
    const targetCell = event.target.closest(".grid-cell");
    if (!targetCell) return;

    const targetItemIndex = parseInt(targetCell.getAttribute("data-item-index"));

    if (Number.isInteger(draggedItemIndex) && Number.isInteger(targetItemIndex) && draggedItemIndex !== targetItemIndex) {
        mergeItems(draggedItemIndex, targetItemIndex);
        draggedItemIndex = null;
    }
}

// Function to handle item merging
function mergeItems(sourceItemIndex, targetItemIndex) {
    const sourceItem = items[sourceItemIndex];
    const targetItem = items[targetItemIndex];

    if (!sourceItem || !targetItem || sourceItem.id !== targetItem.id) return;

    const nextLevel = itemHierarchy[sourceItem.id]?.nextLevel;
    if (!nextLevel) return;

    const mergedItem = {
        id: nextLevel,
        icon: itemHierarchy[nextLevel].icon,
        level: itemHierarchy[nextLevel].level
    };

    addItemToGrid(mergedItem, targetItemIndex);
    removeItemFromGrid(sourceItemIndex);

    updateScore(itemHierarchy[mergedItem.id].score);
    saveGameState();

    // Check win condition after merging
    checkWinCondition();

    // Restart auto-generation if it was paused due to a full grid
    if (isGridFull) {
        isGridFull = false;
        startGame();
    }
}

// Function to remove an item from the grid
function removeItemFromGrid(cellIndex) {
    if (cellIndex < 0 || cellIndex >= currentGridSize * currentGridSize) {
        console.error("Invalid cell index:", cellIndex);
        return;
    }

    const cell = grid.children[cellIndex];
    if (!cell) {
        console.error("Cell not found for index:", cellIndex);
        return;
    }

    cell.innerHTML = "";
    items[cellIndex] = null;
    saveGameState(); // Save state after removing an item
}

// Function to update the score display
function updateScore(points) {
    if (points) {
        totalScore += points;
    }
    score = totalScore;
    scoreDisplay.textContent = score;
}

// Initialize the grid
function initializeGrid() {
    console.log(`Initializing grid with size ${currentGridSize}x${currentGridSize}`);
    grid.innerHTML = "";
    grid.style.gridTemplateColumns = `repeat(${currentGridSize}, 1fr)`;

    for (let i = 0; i < currentGridSize * currentGridSize; i++) {
        const cell = createGridCell();
        grid.appendChild(cell);
        cell.setAttribute("data-item-index", i);
        addDragAndDropListeners(cell);
    }

    console.log(`Grid initialized with ${currentGridSize * currentGridSize} cells`);
}

// Event listeners
generateItemBtn.addEventListener("click", () => {
    clearInterval(autoGenerateInterval);
    generateItem();
    if (items.some(item => item === null)) {
        startGame();
    }
});

resetGameBtn.addEventListener("click", resetGame);

let isGridFull = false; // New variable to track grid state

// Function to generate an item
function generateItem() {
    const emptyCells = items.reduce((acc, item, index) => item === null ? [...acc, index] : acc, []);

    if (emptyCells.length > 0) {
        const randomIndex = Math.floor(Math.random() * emptyCells.length);
        const emptyCellIndex = emptyCells[randomIndex];
        const newItem = generateRandomItem();
        addItemToGrid(newItem, emptyCellIndex);
        isGridFull = false;
    } else {
        clearInterval(autoGenerateInterval);
        isGridFull = true;
        console.log("Grid is full. Auto-generation paused.");
        // Add visual indicator for full grid
        grid.classList.add('grid-full');
    }
}

// Function to reset the game
function resetGame() {
    clearInterval(autoGenerateInterval);
    currentGridSize = 4;
    currentWinCondition = 1;
    currentDifficulty = 1;
    totalScore = 0;
    updateScore();
    initializeGrid();
    items = new Array(currentGridSize * currentGridSize).fill(null);
    isGridFull = false;
    removeGridFullClass();
    updateDifficultyDisplay();
    saveGameState();
    startGame();
}

// Function to start automatic item generation
function startGame() {
    clearInterval(autoGenerateInterval);
    removeGridFullClass();
    autoGenerateInterval = setInterval(generateItem, 3000);
}

// Function to save game state to localStorage
function saveGameState() {
    const gameState = {
        items: items.map(item => item ? { id: item.id, icon: item.icon, level: item.level } : null),
        totalScore: totalScore,
        isGridFull: isGridFull,
        autoGenerateActive: !!autoGenerateInterval,
        currentGridSize: currentGridSize,
        currentWinCondition: currentWinCondition,
        currentDifficulty: currentDifficulty
    };
    localStorage.setItem("mergeManiaState", JSON.stringify(gameState));
    console.log("Game state saved:", gameState);
}

// Function to load game state from localStorage
function loadGameState() {
    try {
        const savedState = localStorage.getItem("mergeManiaState");
        if (savedState) {
            const gameState = JSON.parse(savedState);
            currentGridSize = gameState.currentGridSize || 4;
            currentWinCondition = gameState.currentWinCondition || 1;
            currentDifficulty = gameState.currentDifficulty || 1;
            
            initializeGrid();
            
            items = new Array(currentGridSize * currentGridSize).fill(null);
            gameState.items.forEach((item, index) => {
                if (item && index < items.length) {
                    items[index] = { ...item };
                    addItemToGrid(item, index);
                }
            });
            
            totalScore = gameState.totalScore || 0;
            isGridFull = gameState.isGridFull;
            updateScore();
            updateDifficultyDisplay();

            if (gameState.autoGenerateActive && !isGridFull) {
                startGame();
            } else if (isGridFull) {
                grid.classList.add('grid-full');
            }

            console.log("Game state loaded:", gameState);
        } else {
            console.log("No saved game state found. Starting a new game.");
            resetGame();
        }
    } catch (error) {
        console.error("Error loading game state:", error);
        resetGame();
    }
}

// Function to remove Full Grid indicator
function removeGridFullClass() {
    grid.classList.remove('grid-full');
}

// Modify the HTML to include the difficulty display
document.querySelector('.score-container').insertAdjacentHTML('afterend', `
    <div class="difficulty-container">
        <p>Difficulty: <span id="difficulty">1</span></p>
    </div>
`);

// Function to update the difficulty display
function updateDifficultyDisplay() {
    document.getElementById('difficulty').textContent = currentDifficulty;
}

// Initialize the game
document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM fully loaded. Loading game state...");
    loadGameState();
});

// Remove the reset button from the HTML
document.getElementById('resetGameBtn').style.display = 'none';

// Call updateDifficultyDisplay at the end of your script
updateDifficultyDisplay();