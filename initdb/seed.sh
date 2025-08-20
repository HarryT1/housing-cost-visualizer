#!/bin/bash

psql -U $POSTGRES_USER -d $POSTGRES_DB -c "
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
);"
# 0.01751 and 0.008983 come from an approximation of 1km in long/lat degrees for the geographical area of stockholm
