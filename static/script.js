let grid = [];
let words = [];
let cellSize = 40;
let foundWords = new Set();
let foundWordPositions = {};
let selecting = false;
let selectedCells = [];
const colors = ["#a4f2a4", "#99ccff", "#ffb3b3", "#f7dc6f", "#c39bd3", "#ff9966", "#85c1e9"];

function loadTopics() {
    $.ajax({
        url: "/get_topics",
        type: "GET",
        success: function(data) {
            let topicSelect = $("#topicSelect");
            topicSelect.empty();

            if (data.topics.length === 0) {
                topicSelect.append(new Option("No topics available", ""));
                return;
            }

            data.topics.forEach(topic => {
                topicSelect.append(new Option(topic, topic));
            });

            // Load the first topic automatically
            loadPuzzle();
        },
        error: function(err) {
            console.error("❌ Error fetching topics:", err);
        }
    });
}

function loadPuzzle() {
    let topic = $("#topicSelect").val();

    // 🛑 Reset Found Words & Grid Before Loading a New Puzzle
    foundWords.clear();
    foundWordPositions = {};
    grid = [];
    words = [];
    selectedCells = [];

    $.ajax({
        url: "/generate",
        type: "POST",
        contentType: "application/json",
        data: JSON.stringify({ topic: topic }),
        success: function(data) {
            grid = data.grid;
            words = data.words;
            foundWords.clear();
            foundWordPositions = {};
            drawGrid();
            updateWordList();
        },
        error: function(err) {
            console.error("❌ Error fetching puzzle:", err);
        }
    });
}

function drawGrid(highlightedCells = []) {
    let canvas = document.getElementById("wordCanvas");
    let ctx = canvas.getContext("2d");

    if (!grid.length) return; // 🛑 Prevent drawing if grid is empty

    let gridSize = grid.length;
    canvas.width = gridSize * cellSize;
    canvas.height = gridSize * cellSize;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.font = "20px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    // Draw found words first
    Object.values(foundWordPositions).forEach(wordData => {
        ctx.fillStyle = wordData.color;
        wordData.positions.forEach(cell => {
            ctx.fillRect(cell[1] * cellSize, cell[0] * cellSize, cellSize, cellSize);
        });
    });

    // Highlight selection
    if (highlightedCells.length > 0) {
        ctx.fillStyle = "#d3d3d3";
        highlightedCells.forEach(cell => {
            ctx.fillRect(cell[1] * cellSize, cell[0] * cellSize, cellSize, cellSize);
        });
    }

    // Draw letters
    for (let i = 0; i < grid.length; i++) {
        for (let j = 0; j < grid[i].length; j++) {
            ctx.fillStyle = "black";
            ctx.fillText(grid[i][j], j * cellSize + cellSize / 2, i * cellSize + cellSize / 2);
        }
    }
}

function updateWordList() {
    let wordListDiv = $("#word-list");
    wordListDiv.empty();
    wordListDiv.append("<h3>Find these words:</h3>");
    words.forEach(word => {
        let wordClass = foundWords.has(word) ? "found-word" : "";
        wordListDiv.append(`<p class="${wordClass}" id="word-${word}">${word}</p>`);
    });

    if (foundWords.size === words.length) {
        showPopup();
    }
}

function markWordAsFound(word) {
    $(`#word-${word}`).addClass("found-word");  // Add strike-through effect
}

function showPopup() {
    document.getElementById("gameCompletePopup").style.display = "block";
}

function closePopup() {
    document.getElementById("gameCompletePopup").style.display = "none";
}

// ✅ Selection Logic (Mouse & Touch Support)
function getCellCoordinates(event) {
    let canvas = document.getElementById("wordCanvas");
    let rect = canvas.getBoundingClientRect();
    let x = (event.touches ? event.touches[0].clientX : event.clientX) - rect.left;
    let y = (event.touches ? event.touches[0].clientY : event.clientY) - rect.top;
    return [Math.floor(y / cellSize), Math.floor(x / cellSize)];
}

function handleStart(event) {
    selecting = true;
    selectedCells = [];
    let [row, col] = getCellCoordinates(event);
    selectedCells.push([row, col]);
    drawGrid(selectedCells);
}

function handleMove(event) {
    if (selecting) {
        let [row, col] = getCellCoordinates(event);
        let lastCell = selectedCells[selectedCells.length - 1];

        if ((row === selectedCells[0][0] || col === selectedCells[0][1] ||
             Math.abs(row - selectedCells[0][0]) === Math.abs(col - selectedCells[0][1])) &&
            (lastCell[0] !== row || lastCell[1] !== col)) {
            selectedCells.push([row, col]);
            drawGrid(selectedCells);
        }
    }
}

function handleEnd() {
    selecting = false;

    // Extract selected word
    let selectedWord = selectedCells.map(cell => grid[cell[0]][cell[1]]).join("");

    if (words.includes(selectedWord) && !foundWords.has(selectedWord)) {
        let wordColor = colors[foundWords.size % colors.length];
        foundWords.add(selectedWord);
        foundWordPositions[selectedWord] = { positions: [...selectedCells], color: wordColor };

        markWordAsFound(selectedWord);
    }

    drawGrid();
    updateWordList();
}

// ✅ Attach event listeners for both Mouse & Touch
let canvas = document.getElementById("wordCanvas");
canvas.addEventListener("mousedown", handleStart);
canvas.addEventListener("mousemove", handleMove);
canvas.addEventListener("mouseup", handleEnd);
canvas.addEventListener("touchstart", handleStart);
canvas.addEventListener("touchmove", handleMove);
canvas.addEventListener("touchend", handleEnd);

// ✅ Ensure Topic Changes Reload the Grid
$("#topicSelect").on("change", function() {
    loadPuzzle();  // Reload puzzle when topic changes
});

// ✅ Load topics on page load
$(document).ready(function() {
    loadTopics();
});
