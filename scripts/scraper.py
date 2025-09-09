import requests
from bs4 import BeautifulSoup
from datetime import datetime, timedelta
import time
import psycopg2
import os
from dotenv import load_dotenv
from pathlib import Path
import json
import argparse


# Retry to avoid rate limit issues
def get_result_with_retry(url: str, attempts: int):
    for i in range(attempts):
        try:
            response = requests.get(url)
            if response.status_code != 200:
                raise Exception("Unable to fetch url")
                
            if response.text is None:
                raise Exception("No data in response")
        except:
            print(f"Error, retrying page in {2 ** (i+6)} seconds")
            time.sleep(2 ** (i+6))
            continue
        return response



def main():
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

    cur.execute("""
        SELECT MIN(sale_date), MAX(sale_date)
        FROM apartment_sales
    """)
    earliest_date_in_db, latest_date_in_db = cur.fetchone()

    parser = argparse.ArgumentParser(description="ArgParser for startdate of the scrape")

    parser.add_argument("--startDate", help="The date from which you want the scraper to start")

    args = parser.parse_args()

    if args.startDate is None:
        # Check if db was empty
        if latest_date_in_db:
            start_date = (latest_date_in_db).strftime("%Y-%m-%d")
        else:
            # Fallback to default, e.g., 90 days ago
            time_period_days = 90
            start_date = (datetime.today() - timedelta(days=time_period_days)).strftime("%Y-%m-%d") 
        
    else:
        start_date = args.startDate

    end_date = (datetime.today()- timedelta(days = 1)).strftime("%Y-%m-%d")


    
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
    start_datetime = datetime.strptime(start_date, "%Y-%m-%d")
    end_datetime   = datetime.strptime(end_date, "%Y-%m-%d")

    # Loop in steps of 30 days
    batch_start = start_datetime
    
    if(batch_start + timedelta(days=30) < end_datetime):
        batch_end = batch_start +timedelta(days=30)
    else:
        batch_end = end_datetime
        
    while batch_start < end_datetime:
        batch_start_str = batch_start.strftime("%Y-%m-%d")
        batch_end_str = batch_end.strftime("%Y-%m-%d")
        
        # Each +1 increase in attempts will double the previous highest wait time of the attempts
        request_attempts = 4
        url = f"https://www.booli.se/sok/slutpriser?areaIds=2&maxSoldDate={batch_end_str}&minSoldDate={batch_start_str}"
        response = get_result_with_retry(url, request_attempts)
        if response.status_code != 200:
            raise Exception("Unable to fetch url")
        soup = BeautifulSoup(response.text, "html.parser")
        page_count = int(soup.find("div", class_="search-page__content").find("p", class_="m-2").get_text().split()[-1])

        
        for page in range(page_count, 0, -1):
            url = f"https://www.booli.se/sok/slutpriser?areaIds=2&maxSoldDate={batch_end_str}&minSoldDate={batch_start_str}&page={page}"
            response = get_result_with_retry(url, request_attempts)
            response.raise_for_status()
            soup = BeautifulSoup(response.text, "html.parser")
            
            # Find json containing the desired data
            script_tag = soup.find("script", id="__NEXT_DATA__")
            data = json.loads(script_tag.string)

            props = data.get("props", {})
            pageProps = props.get("pageProps", {})
            listings = pageProps.get("__APOLLO_STATE__", {})
            
            key, value = next(
            ((k, v) for k, v in listings.items() if k.startswith("SoldProperty:")),
            (None, None))
            date = value.get("soldDate")
            print(f"Current page: {page} Date of first page listing: {date} Batch range: {batch_start_str} to {batch_end_str}")
            
            # Go through each sold property and send data to db
            for key, value in listings.items():
                if key.startswith("SoldProperty:"):
                    id = value.get("id")
                    sale_date = value.get("soldDate")
                    municipality = value.get("location").get("region").get("municipalityName")
                    property_type = value.get("objectType")
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
                    
                    if property_type == "Lägenhet":
                        for info in property_info:
                            datapoint = info.get("value").get("plainText")
                            datapoint = datapoint.replace("\xa0", " ").lower()
                            if "m²" in datapoint and "kr" not in datapoint and "tomt" not in datapoint:
                                if "+" in datapoint:
                                    area_sqm = float(datapoint.split()[0].replace(",",".")) + float(datapoint.split()[2].replace(",","."))
                                else: 
                                    area_sqm = float(datapoint.split()[0].replace(",","."))
                            elif "rum" in datapoint:
                                room_count = float(datapoint.split()[0].replace(",","."))
                            elif "vån" in datapoint:
                                floor = float(datapoint.split()[1].replace(",","."))
                    elif property_type == "Villa":
                        continue
                    elif property_type == "Radhus":
                        continue
                    else:
                        continue
                    insert_query = """
                        INSERT INTO apartment_sales (id, property_type, sale_date, municipality, neighborhood, address, latitude, longitude, sale_type, price, area_sqm, rooms, floor)
                        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                        ON CONFLICT (id)
                        DO UPDATE SET
                        property_type = EXCLUDED.property_type,
                        sale_date = EXCLUDED.sale_date,
                        municipality = EXCLUDED.municipality,
                        neighborhood = EXCLUDED.neighborhood,
                        address = EXCLUDED.address,
                        latitude = EXCLUDED.latitude,
                        longitude = EXCLUDED.longitude,
                        sale_type = EXCLUDED.sale_type,
                        price = EXCLUDED.price,
                        area_sqm = EXCLUDED.area_sqm,
                        rooms = EXCLUDED.rooms,
                        floor = EXCLUDED.floor;
                    """
                    
                    values = (id, property_type, sale_date, municipality, specific_area, address, latitude, longitude, sale_type, price, area_sqm, room_count, floor)

                    cur.execute(insert_query, values)
                    conn.commit()

        batch_start = batch_start + timedelta(days=31)
        if(batch_start + timedelta(days=30) < end_datetime):
            batch_end = batch_start +timedelta(days=30)
        else:
            batch_end = end_datetime
        
    
    
            
            
    cur.close()
    conn.close()

if __name__ == "__main__":
    main()