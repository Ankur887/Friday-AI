from dotenv import load_dotenv
import os
import psycopg2

load_dotenv()

print("URL:", os.getenv("DATABASE_URL"))

conn = psycopg2.connect(os.getenv("DATABASE_URL"))
print("✅ Connected Successfully")

cur = conn.cursor()
cur.execute("SELECT current_database();")
print(cur.fetchone())

conn.close()