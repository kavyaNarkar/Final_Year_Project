
import sqlite3
import os

db_path = os.path.join('instance', 'echallan.db')

def check_user_schema():
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    cursor.execute("PRAGMA table_info(user)")
    columns = [row[1] for row in cursor.fetchall()]
    print(f"User table columns: {columns}")
    conn.close()

if __name__ == "__main__":
    check_user_schema()
