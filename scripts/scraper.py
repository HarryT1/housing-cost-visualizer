import requests
from bs4 import BeautifulSoup
import math
from datetime import datetime, timedelta
import time
import psycopg2
import os
from dotenv import load_dotenv
from pathlib import Path
import json

# Connect to db
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

cur.execute("SELECT MAX(sale_date) FROM apartment_sales")
latest_date_in_db = cur.fetchone()[0]
if latest_date_in_db:
    start_date = (latest_date_in_db + timedelta(days=1)).strftime("%Y-%m-%d")
else:
    # Fallback to default, e.g., 90 days ago
    time_period_days = 90
    start_date = (datetime.today() - timedelta(days=time_period_days)).strftime("%Y-%m-%d")
    
end_date = (datetime.today()- timedelta(days = 1)).strftime("%Y-%m-%d")

url = f"https://www.booli.se/sok/slutpriser?areaIds=2&maxSoldDate={end_date}&minSoldDate={start_date}&objectType=L%C3%A4genhet"
headers = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/125.0.0.0 Safari/537.36"
    ),
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.9",
    "Referer": "https://www.booli.se/",
    "Sec-Fetch-Dest": "document",
    "Sec-Fetch-Mode": "navigate",
    "Sec-Fetch-Site": "none",
    "Sec-Fetch-User": "?1",
    "Upgrade-Insecure-Requests": "1",
    "Connection": "keep-alive"
}
response = requests.get(url)

if response.status_code != 200:
    raise Exception("Unable to fetch url")
    


soup = BeautifulSoup(response.text, "html.parser")
page_count = int(soup.find("div", class_="search-page__content").find("p", class_="m-2").get_text().split()[-1])


# Used for cleaning up the strings in the for loop to be able to convert to int/float
remove_chars = dict.fromkeys(map(ord, "  krm²rum"), None)
remove_chars[ord(",")] = ord(".")



for page in range(1, page_count+1):
    url = f"https://www.booli.se/sok/slutpriser?areaIds=2&maxSoldDate={end_date}&minSoldDate={start_date}&objectType=L%C3%A4genhet&page={page}"
    response = requests.get(url)
    if response.status_code != 200:
        print(f"Error fetching page: {page}")
        continue
    
    soup = BeautifulSoup(response.text, "html.parser")
    print("Current page: ", page)
    
    # Find json containing the desired data
    script_tag = soup.find("script", id="__NEXT_DATA__")
    data = json.loads(script_tag.string)

    props = data.get("props", {})
    pageProps = props.get("pageProps", {})
    listings = pageProps.get("__APOLLO_STATE__", {})

    # Go through each sold property and collect data
    for key, value in listings.items():
        if key.startswith("SoldProperty:"):
            id = value.get("id")
            sale_date = value.get("soldDate")
            municipality = value.get("location").get("region").get("municipalityName")
            specific_area = value.get("descriptiveAreaName")
            address = value.get("streetAddress")
            latitude = value.get("latitude")
            longitude = value.get("longitude")
            sale_type = value.get("soldPriceType")
            price = int(value.get("soldPrice").get("raw"))
            
            
            # Extract info about sqm, room count, and floor
            area_sqm = None
            room_count = None
            floor = None
            property_info = value.get("displayAttributes").get("dataPoints")
            for info in property_info:
                datapoint = info.get("value").get("plainText")
                datapoint = datapoint.replace("\xa0", " ").lower()
                if "m²" in datapoint and "kr" not in datapoint:
                    area_sqm = float(datapoint.split()[0].replace(",","."))
                elif "rum" in datapoint:
                    room_count = float(datapoint.split()[0].replace(",","."))
                elif "vån" in datapoint:
                    floor = float(datapoint.split()[1].replace(",","."))
            insert_query = """
                INSERT INTO apartment_sales (id, sale_date, municipality, neighborhood, address, latitude, longitude, sale_type, price, area_sqm, rooms, floor)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            """
            
            values = (id, sale_date, municipality, specific_area, address, latitude, longitude, sale_type, price, area_sqm, room_count, floor)

            cur.execute(insert_query, values)
            conn.commit()
        
        
cur.close()
conn.close()
