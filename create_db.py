import sqlite3

# Connect to SQLite database (or create it if it doesn't exist)
conn = sqlite3.connect("puzzles.db")
cursor = conn.cursor()

# Create table for topics
cursor.execute("""
CREATE TABLE IF NOT EXISTS topics (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE NOT NULL
);
""")

# Create table for words (linked to topics)
cursor.execute("""
CREATE TABLE IF NOT EXISTS words (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    topic_id INTEGER,
    word TEXT NOT NULL,
    FOREIGN KEY (topic_id) REFERENCES topics(id)
);
""")

# Commit and close
conn.commit()
conn.close()

print("✅ Database and tables created successfully!")
