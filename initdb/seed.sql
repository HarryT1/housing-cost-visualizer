\c server_db
CREATE EXTENSION postgis;

CREATE TABLE apartment_sales (
  id INTEGER PRIMARY KEY,
  property_type TEXT,
  sale_date DATE,
  municipality TEXT,
  neighborhood TEXT,
  address TEXT,
  latitude double precision,
  longitude double precision,
  sale_type TEXT,
  price INTEGER,
  area_sqm double precision,
  rooms double precision,
  floor double precision,
  grid_x INTEGER GENERATED ALWAYS AS (FLOOR(longitude / (0.01751 * 0.1))) STORED,
  grid_y INTEGER GENERATED ALWAYS AS (FLOOR(latitude / (0.008983 * 0.1))) STORED
);
/* 0.01751 and 0.008983 come from an approximation of 1km in long/lat degrees for the geographical area of stockholm */

/* Not updated to new schema yet
INSERT INTO apartment_sales (
  sale_date, address, municipality, neighborhood, sale_type, price, area_sqm, rooms
) VALUES
('2025-04-16', 'Södermannagatan 60', 'Stockholm', 'Södermalm', 'Slutpris', 4800000, 40.0, 2.0),
('2025-04-16', 'Bergsundsgatan 16', 'Stockholm', 'Hornstull', 'Slutpris', 3430000, 27.0, 1.0),
('2025-04-16', 'Typografvägen 3', 'Stockholm', 'Aspudden', 'Slutpris', 7300000, 80.0, 3.0),
('2025-04-16', 'Östgötagatan 40', 'Stockholm', 'Södermalm', 'Slutpris', 6615000, 56.0, 2.0),
('2025-04-16', 'Västerled 31', 'Stockholm', 'Äppelviken', 'Slutpris', 5720000, 70.0, 2.0),
('2025-04-16', 'Jakob Westinsgatan 7', 'Stockholm', 'Kungsholmen', 'Slutpris', 7900000, 77.0, 2.5),
('2025-04-16', 'Birger Jarlsgatan 46B', 'Stockholm', 'Östermalm', 'Sista bud', 9700000, 68.0, 3.0),
('2025-04-16', 'Atlasgatan 13', 'Stockholm', 'Vasastan', 'Slutpris', 3400000, 25.0, 1.5),
('2025-04-16', 'Charlottenburgsvägen 32C', 'Solna', 'Råsunda', 'Sista bud', 2550000, 36.0, 1.0),
('2025-04-16', 'Kungsholms Hamnplan 5A', 'Stockholm', 'Kungsholmen', 'Sista bud', 7985000, 64.0, 2.0);
*/