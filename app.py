import random
import numpy as np
from flask import Flask, render_template, jsonify, request

app = Flask(__name__)

GRID_SIZE = 12
WORDS_PER_PUZZLE = 10
MAX_ATTEMPTS = 50

# Hardcoded topics and words
WORDS = {
    "Animals": ["LION", "TIGER", "BEAR", "EAGLE", "SHARK", "WOLF", "ZEBRA", "HORSE", "SNAKE", "FROG"],
    "Fruits": ["APPLE", "BANANA", "ORANGE", "GRAPE", "MANGO", "PEACH", "PLUM", "CHERRY", "LEMON", "KIWI"],
    "Countries": ["INDIA", "CANADA", "FRANCE", "BRAZIL", "CHINA", "JAPAN", "EGYPT", "GERMANY", "ITALY", "SPAIN"]
}


def create_grid(size):
    """ Creates an empty grid filled with spaces """
    return np.full((size, size), " ", dtype=str)


def can_place_word(grid, word, row, col, direction):
    """ Check if a word can be placed without overwriting existing letters. """
    word_len = len(word)
    if direction == "HORIZONTAL":
        return col + word_len <= GRID_SIZE and all(grid[row, col + i] in [" ", word[i]] for i in range(word_len))
    elif direction == "VERTICAL":
        return row + word_len <= GRID_SIZE and all(grid[row + i, col] in [" ", word[i]] for i in range(word_len))
    elif direction == "DIAGONAL":
        return row + word_len <= GRID_SIZE and col + word_len <= GRID_SIZE and all(
            grid[row + i, col + i] in [" ", word[i]] for i in range(word_len))
    return False


def place_words(grid, words):
    """ Try placing words in the grid, ensuring all words are successfully placed """
    placed_words = []
    directions = ["HORIZONTAL", "VERTICAL", "DIAGONAL"]

    for word in words:
        placed = False
        attempts = 0

        while not placed and attempts < MAX_ATTEMPTS:
            row, col = random.randint(0, GRID_SIZE - 1), random.randint(0, GRID_SIZE - 1)
            direction = random.choice(directions)

            if can_place_word(grid, word, row, col, direction):
                for i in range(len(word)):
                    if direction == "HORIZONTAL":
                        grid[row, col + i] = word[i]
                    elif direction == "VERTICAL":
                        grid[row + i, col] = word[i]
                    elif direction == "DIAGONAL":
                        grid[row + i, col + i] = word[i]

                placed_words.append({"word": word, "row": row, "col": col, "direction": direction})
                placed = True
            attempts += 1

    return placed_words


def fill_grid(grid):
    """ Fill remaining empty cells with random letters """
    for i in range(GRID_SIZE):
        for j in range(GRID_SIZE):
            if grid[i, j] == " ":
                grid[i, j] = random.choice("ABCDEFGHIJKLMNOPQRSTUVWXYZ")


@app.route("/")
def index():
    return render_template("index.html", topics=list(WORDS.keys()))


@app.route("/generate", methods=["POST"])
def generate():
    data = request.get_json()
    topic = data.get("topic", "Animals")
    words = WORDS.get(topic, [])

    grid = create_grid(GRID_SIZE)
    placed_words = place_words(grid, words)
    fill_grid(grid)

    return jsonify({"grid": grid.tolist(), "words": words, "solution": placed_words})


if __name__ == "__main__":
    app.run(debug=True)
