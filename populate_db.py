import sqlite3

# Sample topics and words
puzzle_data = {
    "Planets": ["MERCURY", "VENUS", "EARTH", "MARS", "JUPITER", "SATURN", "URANUS", "NEPTUNE", "PLUTO", "ASTEROID"],
    "World Capitals": ["LONDON", "PARIS", "TOKYO", "OTTAWA", "MOSCOW", "BERLIN", "ROME", "MADRID", "BEIJING", "DELHI"],
    "Famous Scientists": ["EINSTEIN", "NEWTON", "TESLA", "CURIE", "DARWIN", "GALILEO", "PASTEUR", "HYPATIA", "ARCHIMEDES", "HAWKING"],
    "NBA Teams": ["LAKERS", "BULLS", "CELTICS", "HEAT", "WARRIORS", "SPURS", "RAPTORS", "NETS", "KNICKS", "SUNS"],
    "NFL Teams": ["COWBOYS", "PATRIOTS", "STEELERS", "PACKERS", "49ERS", "EAGLES", "SEAHAWKS", "BRONCOS", "RAVENS", "CHIEFS"],
    "Sitcoms": ["FRIENDS", "SEINFELD", "OFFICE", "SCRUBS", "PARKS", "FRASIER", "BROOKLYN99", "MASH", "MODERNFAMILY", "HOWIMETYOURMOTHER"],
    "Marvel Characters": ["SPIDERMAN", "IRONMAN", "THOR", "HULK", "LOKI", "BLACKWIDOW", "WOLVERINE", "STORM", "GAMORA", "DRSTRANGE"],
    "Harry Potter": ["HOGWARTS", "VOLDEMORT", "HERMIONE", "RON", "DUMBLEDORE", "HAGRID", "SNAPE", "MALFOY", "QUIDDITCH", "GRYFFINDOR"],
    "Oscar Best Pictures": ["TITANIC", "GLADIATOR", "MOONLIGHT", "GREENBOOK", "ARGO", "CHICAGO", "FORRESTGUMP", "BRAVEHEART", "BENHUR", "CASABLANCA"]
}

# Connect to SQLite
conn = sqlite3.connect("puzzles.db")
cursor = conn.cursor()

# Insert topics and words
for topic, words in puzzle_data.items():
    cursor.execute("INSERT OR IGNORE INTO topics (name) VALUES (?)", (topic,))
    topic_id = cursor.lastrowid or cursor.execute("SELECT id FROM topics WHERE name=?", (topic,)).fetchone()[0]

    for word in words:
        cursor.execute("INSERT INTO words (topic_id, word) VALUES (?, ?)", (topic_id, word))

# Commit and close
conn.commit()
conn.close()

print("✅ Database populated with topics and words!")
