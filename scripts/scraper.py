import requests
from bs4 import BeautifulSoup
import math
from datetime import datetime, timedelta
import time
import psycopg2
import os
from dotenv import load_dotenv
from pathlib import Path

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
print(latest_date_in_db)
if latest_date_in_db:
    start_date = (latest_date_in_db + timedelta(days=1)).strftime('%Y-%m-%d')
else:
    # Fallback to default, e.g., 90 days ago
    time_period_days = 90
    start_date = (datetime.today() - timedelta(days=time_period_days)).strftime('%Y-%m-%d')
    
end_date = (datetime.today()- timedelta(days = 1)).strftime('%Y-%m-%d')

url = f"https://www.booli.se/sok/slutpriser?areaIds=2&maxSoldDate={end_date}&minSoldDate={start_date}&objectType=L%C3%A4genhet"
response = requests.get(url)

if response.status_code != 200:
    raise Exception("Unable to fetch url")
    


soup = BeautifulSoup(response.text, 'html.parser')
page_count = int(soup.find('div', class_='search-page__content').find('p', class_='m-2').get_text().split()[-1])


# Used for cleaning up the strings in the for loop to be able to convert to int/float
remove_chars = dict.fromkeys(map(ord, "  krm²rum"), None)
remove_chars[ord(',')] = ord('.')



for page in range(1, page_count+1):
    url = f"https://www.booli.se/sok/slutpriser?areaIds=2&maxSoldDate={end_date}&minSoldDate={start_date}&objectType=L%C3%A4genhet&page={page}"
    response = requests.get(url)
    if response.status_code != 200:
        print(f"Error fetching page: {page}")
        continue
    
    soup = BeautifulSoup(response.text, 'html.parser')
    properties = soup.find('div', class_ = ['pb-4', 'md:pb-6']).find_all('li', class_='search-page__module-container')
    print("Current page: ", page)

    for property in properties:
        
        address = property.find('a', class_= 'expanded-link no-underline hover:underline').get_text(strip=True)
        
        loc_info = property.find('span', class_ = "object-card__preamble").get_text().split(" · ")
        # Municipality seemed to always be the last element of this html element
        municipality = loc_info[-1] 
        specific_area = "Unspecified"
        # Most apartments have 3 fields in this html element, with specific area being the second, in case they dont, assume area is unspecified
        if len(loc_info) == 3:
            specific_area = loc_info[1]
        
        # String specifying whether the listed property was actually sold 
        # or if the price is just the last bid before listing was removed
        sold_or_last_bid = property.find('div', class_=['tag', 'tag--dark', 'tag--with-icon']).get_text()
        date = property.find('span', class_='object-card__date__logo').get_text()
        
        price_string = property.find('span', class_ = 'object-card__price__logo').get_text()
        price = int(price_string.translate(remove_chars))

        # Some properties don't have defined sqm or number of rooms
        try: property_info = property.find('ul', class_='object-card__data-list').find_all('li')
        except: 
            sq_meters = float('nan')
            room_count = float('nan')
        
        try: sq_meters = float(property_info[0].get_text().translate(remove_chars))
        except(IndexError, ValueError): sq_meters = float('nan')
        try: room_count = float(property_info[1].get_text().translate(remove_chars))
        except(IndexError, ValueError): room_count = float('nan')
        
        insert_query = """
            INSERT INTO apartment_sales (sale_date, address, municipality, neighborhood, sale_type, price, area_sqm, rooms)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
        """

        values = (date, address, municipality, specific_area, sold_or_last_bid, price, sq_meters, room_count)

        cur.execute(insert_query, values)
        conn.commit()
        
cur.close()
conn.close()
