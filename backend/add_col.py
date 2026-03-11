import sqlite3;
try:
    conn = sqlite3.connect('instance/echallan.db'); 
    conn.execute("ALTER TABLE violation ADD COLUMN payment_status VARCHAR(20) DEFAULT 'UNPAID';"); 
    conn.commit(); 
    conn.close();
    print("Column added")
except Exception as e:
    print(e)
