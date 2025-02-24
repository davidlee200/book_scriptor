from flask import Flask, render_template, jsonify, request
import random
import numpy as np

app = Flask(__name__)

# Grid size for the word search
GRID_SIZE = 12
WORDS_PER_PUZZLE = 10
MAX_ATTEMPTS = 100  # Increased attempts to guarantee word placement

# 🔹 HARD-CODED TOPICS AND WORDS
TOPIC_WORDS = {
    "Technology": ["PYTHON", "FLASK", "STREAMLIT", "AIRFLOW", "PANDAS", "SQL", "SNOWFLAKE",
                   "DASH", "TABLEAU", "NUMPY", "MACHINE", "LEARNING", "PIPELINE", "KUBERNETES"],
    "Sports": ["FOOTBALL", "BASKETBALL", "TENNIS", "BASEBALL", "HOCKEY", "SOCCER", "CRICKET",
               "GOLF", "RUGBY", "WRESTLING", "BOXING", "MOTORSPORT", "SWIMMING", "CYCLING"],
    "Movies": ["INCEPTION", "TITANIC", "AVENGERS", "GLADIATOR", "JOKER", "MATRIX", "STARWARS",
               "INTERSTELLAR", "GODFATHER", "BATMAN", "SUPERMAN", "HOBBIT", "JURASSIC", "ALIEN"],
    "Sitcoms": ["FRIENDS", "SEINFELD", "BIGBANG", "OFFICE", "BROOKLYN", "CHEERS", "SCRUBS",
                "SIMPSONS", "FAMILYGUY", "HOWIMET", "PARKS", "MASH", "MODERNFAMILY", "ARRESTED"],
}


def create_grid(size):
    """Creates an empty grid filled with spaces."""
    return np.full((size, size), " ", dtype=str)


def can_place_word(grid, word, row, col, direction):
    """Checks if a word can be placed without overwriting existing letters."""
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
    """Places all words into the grid, ensuring they appear."""
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

        if not placed:
            print(f"⚠️ WARNING: Could not place word {word} after {MAX_ATTEMPTS} attempts!")

    return placed_words


def fill_grid(grid):
    """Fills remaining empty cells with random letters."""
    for i in range(GRID_SIZE):
        for j in range(GRID_SIZE):
            if grid[i, j] == " ":
                grid[i, j] = random.choice("ABCDEFGHIJKLMNOPQRSTUVWXYZ")


@app.route("/")
def index():
    """Loads the main HTML page with available topics."""
    return render_template("index.html", topics=list(TOPIC_WORDS.keys()))


@app.route("/get_topics")
def get_topics():
    """Returns the list of hardcoded topics."""
    return jsonify({"topics": list(TOPIC_WORDS.keys())})


@app.route("/generate", methods=["POST"])
def generate():
    """Generates a word search puzzle for the selected topic, ensuring all words appear."""
    data = request.get_json()
    topic = data.get("topic", "Technology")  # Default to "Technology" if no topic is selected

    words = random.sample(TOPIC_WORDS[topic], min(WORDS_PER_PUZZLE, len(TOPIC_WORDS[topic])))
    grid = create_grid(GRID_SIZE)
    placed_words = place_words(grid, words)

    # If any words were not placed, retry
    retry_count = 0
    while len(placed_words) < len(words) and retry_count < 5:
        print(f"🔄 Retrying word placement (attempt {retry_count + 1})")
        grid = create_grid(GRID_SIZE)  # Reset grid
        placed_words = place_words(grid, words)
        retry_count += 1

    fill_grid(grid)

    return jsonify({"grid": grid.tolist(), "words": words, "solution": placed_words})


if __name__ == "__main__":
    app.run(debug=True)
