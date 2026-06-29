from database.db import engine

try:
    conn=engine.connect()
    print("Connected Successfully")
    conn.close()
except Exception as e:
    print("Error: ",e)