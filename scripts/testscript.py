import psycopg2
import os
from dotenv import load_dotenv
from pathlib import Path
script_dir = Path(__file__).resolve().parent
env_path = script_dir.parent / ".env"
load_dotenv(dotenv_path=env_path)
conn = psycopg2.connect(
    dbname=os.getenv("POSTGRES_DB"),
    user=os.getenv("POSTGRES_USER"),
    password=os.getenv("POSTGRES_PASSWORD"),
    host=os.getenv("DB_HOST_IP"),
    port=os.getenv("DB_PORT")
)

cur = conn.cursor()

insert_query = """
    INSERT INTO apartment_sales (sale_date, address, municipality, neighborhood, sale_type, price, area_sqm, rooms)
    VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
"""

values = ("2025-05-10", "Testvägen 6", "Testkommunen", "Testområde", "Slutpris", 100000000, 1000, 100)

cur.execute(insert_query, values)
conn.commit()
cur.close()
conn.close()