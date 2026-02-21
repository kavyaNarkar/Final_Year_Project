
import sqlite3

def check_schema():
    conn = sqlite3.connect('instance/echallan.db')
    cursor = conn.cursor()
    cursor.execute("PRAGMA table_info(admin)")
    columns = cursor.fetchall()
    print("Admin table columns:")
    for col in columns:
        print(col)
    conn.close()

if __name__ == "__main__":
    check_schema()
