let grid = [];
let words = [];
let cellSize = 40;
let foundWords = new Set();
let foundWordPositions = {};
let selecting = false;
let selectedCells = [];

// 🎨 Pastel Colors for Found Words
const pastelColors = ["#FFD1DC", "#FFDFBA", "#D4A5A5", "#A8D5BA", "#B5EAD7", "#C7CEEA", "#FFB3BA", "#FFDAC1", "#FF9AA2", "#D9D9D9"];

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

            loadPuzzle();
        },
        error: function(err) {
            console.error("❌ Error fetching topics:", err);
        }
    });
}

function loadPuzzle() {
    let topic = $("#topicSelect").val();
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
            drawGrid();
            updateWordList();
        },
        error: function(err) {
            console.error("❌ Error fetching puzzle:", err);
        }
    });
}

function drawGrid() {
    let canvas = document.getElementById("wordCanvas");
    let ctx = canvas.getContext("2d");

    if (!grid.length) return;

    let gridSize = grid.length;
    canvas.width = gridSize * cellSize;
    canvas.height = gridSize * cellSize;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.font = "20px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    // ✅ Draw found words overlay (Each found word gets a pastel color)
    Object.keys(foundWordPositions).forEach((word, index) => {
        ctx.globalAlpha = 0.6; // Less transparent for found words
        ctx.fillStyle = pastelColors[index % pastelColors.length]; // Assign unique pastel color
        drawWordOverlay(ctx, foundWordPositions[word].positions);
    });

    // ✅ Draw letters (so they appear above highlights)
    ctx.globalAlpha = 1; // Reset transparency for text
    for (let i = 0; i < grid.length; i++) {
        for (let j = 0; j < grid[i].length; j++) {
            ctx.fillStyle = "black";
            ctx.fillText(grid[i][j], j * cellSize + cellSize / 2, i * cellSize + cellSize / 2);
        }
    }

    // ✅ Highlight ongoing selection (transparent gray)
    if (selectedCells.length > 0) {
        ctx.globalAlpha = 0.3;  // Keep the selection transparent
        ctx.fillStyle = "#A0A0A0"; // Soft grey for selection
        drawWordOverlay(ctx, selectedCells);
    }

    ctx.globalAlpha = 1; // Reset transparency for normal rendering
}

// ✅ Smooth overlay highlight for words
function drawWordOverlay(ctx, cells) {
    if (cells.length < 2) return;

    let startX = cells[0][1] * cellSize + cellSize / 2;
    let startY = cells[0][0] * cellSize + cellSize / 2;
    let endX = cells[cells.length - 1][1] * cellSize + cellSize / 2;
    let endY = cells[cells.length - 1][0] * cellSize + cellSize / 2;

    ctx.beginPath();
    ctx.lineWidth = cellSize / 2;
    ctx.lineCap = "round";
    ctx.moveTo(startX, startY);
    ctx.lineTo(endX, endY);
    ctx.stroke();
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
        showPopup();  // 🎉 Show the completion popup when all words are found
    }
}

function markWordAsFound(word) {
    $(`#word-${word}`).addClass("found-word");
}

// ✅ Improved function for getting touch & mouse coordinates
function getCellCoordinates(event) {
    let canvas = document.getElementById("wordCanvas");
    let rect = canvas.getBoundingClientRect();

    let x, y;

    if (event.touches) {
        x = event.touches[0].pageX - rect.left;
        y = event.touches[0].pageY - rect.top;
    } else {
        x = event.clientX - rect.left;
        y = event.clientY - rect.top;
    }

    // Adjust for device pixel ratio
    x *= canvas.width / rect.width;
    y *= canvas.height / rect.height;

    return [Math.floor(y / cellSize), Math.floor(x / cellSize)];
}

function handleStart(event) {
    selecting = true;
    selectedCells = [];
    let [row, col] = getCellCoordinates(event);
    selectedCells.push([row, col]);
    drawGrid();
}

function handleMove(event) {
    if (selecting) {
        let [row, col] = getCellCoordinates(event);
        let lastCell = selectedCells[selectedCells.length - 1];

        if ((row === selectedCells[0][0] || col === selectedCells[0][1] ||
             Math.abs(row - selectedCells[0][0]) === Math.abs(col - selectedCells[0][1])) &&
            (lastCell[0] !== row || lastCell[1] !== col)) {
            selectedCells.push([row, col]);
            drawGrid();
        }
    }
}

function handleEnd() {
    selecting = false;

    // Extract selected word
    let selectedWord = selectedCells.map(cell => grid[cell[0]][cell[1]]).join("");

    if (words.includes(selectedWord) && !foundWords.has(selectedWord)) {
        let wordColor = pastelColors[foundWords.size % pastelColors.length];
        foundWords.add(selectedWord);
        foundWordPositions[selectedWord] = { positions: [...selectedCells], color: wordColor };

        markWordAsFound(selectedWord);
    }

    drawGrid();
    updateWordList();
}

// ✅ Pop-up for game completion
function showPopup() {
    document.getElementById("gameCompletePopup").style.display = "block";
}

function closePopup() {
    document.getElementById("gameCompletePopup").style.display = "none";
}

function playAgain() {
    closePopup();
    loadPuzzle();
}

// ✅ Attach event listeners for both Mouse & Touch
let canvas = document.getElementById("wordCanvas");
canvas.addEventListener("mousedown", handleStart);
canvas.addEventListener("mousemove", handleMove);
canvas.addEventListener("mouseup", handleEnd);
canvas.addEventListener("touchstart", handleStart, { passive: true });
canvas.addEventListener("touchmove", handleMove, { passive: true });
canvas.addEventListener("touchend", handleEnd);

$("#topicSelect").on("change", function() {
    loadPuzzle();
});

$(document).ready(function() {
    loadTopics();
});
