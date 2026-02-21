
import sqlite3
import os

db_path = os.path.join('instance', 'echallan.db')

def add_column():
    if not os.path.exists(db_path):
        print(f"Database not found at {db_path}")
        return

    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    try:
        # Check if column exists first to avoid error
        cursor.execute("PRAGMA table_info(admin)")
        columns = [info[1] for info in cursor.fetchall()]
        
        if 'mobile_number' not in columns:
            print("Adding mobile_number column to admin table...")
            # Default to NULL or empty string as per model definition (nullable=True in model)
            cursor.execute("ALTER TABLE admin ADD COLUMN mobile_number VARCHAR(15)")
            conn.commit()
            print("Column added successfully.")
        else:
            print("mobile_number column already exists.")
            
    except Exception as e:
        print(f"An error occurred: {e}")
    finally:
        conn.close()

if __name__ == "__main__":
    add_column()
