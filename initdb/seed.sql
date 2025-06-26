CREATE DATABASE sampledb;

\c sampledb

CREATE TABLE apartment_sales (
  id SERIAL PRIMARY KEY,
  sale_date DATE,
  address TEXT,
  municipality TEXT,
  neighborhood TEXT,
  sale_type TEXT,
  price INTEGER,
  area_sqm REAL,
  rooms REAL
);

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
