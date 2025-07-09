import { useEffect, useRef } from "react";
import L, { geoJson } from "leaflet";
import "leaflet/dist/leaflet.css";
import * as turf from "@turf/turf";

interface LeafletMapProps {
  showGrid: boolean; // true = show grid, false = show municipalities
}

const LeafletMap = ({ showGrid }: LeafletMapProps) => {
  const mapRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const layerRef = useRef<L.GeoJSON | null>(null);

  function getColor(d: number) {
    return d > 75000
      ? "#08306b"
      : d > 65000
        ? "#08519c"
        : d > 55000
          ? "#2171b5"
          : d > 50000
            ? "#4292c6"
            : d > 45000
              ? "#6baed6"
              : d > 40000
                ? "#9ecae1"
                : d > 35000
                  ? "#c6dbef"
                  : "#deebf7";
  }

  function style(feature: any) {
    return {
      fillColor: getColor(feature.properties.avg_price_per_sqm),
      weight: 1,
      opacity: 1,
      color: "white",
      dashArray: "3",
      fillOpacity: 0.7,
    };
  }

  const initMap = () => {
    if (mapRef.current && !mapInstanceRef.current) {
      mapInstanceRef.current = L.map(mapRef.current).setView([59.334591, 18.06324], 10);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 15,
        attribution: "© OpenStreetMap contributors",
      }).addTo(mapInstanceRef.current);
      L.control.scale().addTo(mapInstanceRef.current);
    }
  };

  const renderMunicipalities = async () => {
    const [geoRes, dataRes] = await Promise.all([
      fetch("./data/stockholm_municipalities.geojson"),
      fetch("http://localhost:5000/PropertyListing/AvgSqmPriceByMunicipality"),
    ]);
    const municipalityGeoData = (await geoRes.json()) as GeoJSON.FeatureCollection;
    const municipalityAvgSqmPrice: Record<string, number> = await dataRes.json();

    const modifiedGeoJson = {
      ...municipalityGeoData,
      features: municipalityGeoData.features.map((feature: any) => {
        const komName = feature.properties.kom_name;
        const avgPrice = municipalityAvgSqmPrice[komName];
        return {
          ...feature,
          properties: {
            ...feature.properties,
            avg_price_per_sqm: avgPrice,
          },
        };
      }),
    };

    if (mapInstanceRef.current) {
      if (layerRef.current) {
        mapInstanceRef.current.removeLayer(layerRef.current);
      }
      layerRef.current = L.geoJSON(modifiedGeoJson, { style }).addTo(mapInstanceRef.current);
    }
  };

  const renderGrid = async () => {
    // Get geographical data about stockholms län
    const [geoRes, bboxRes] = await Promise.all([
      fetch("http://localhost:5000/PropertyListing/Polygon"),
      fetch("http://localhost:5000/PropertyListing/BoundingBox")
    ]);
    const geojson = await geoRes.json();
    const {minLng, minLat, maxLng, maxLat} = await bboxRes.json();

    // Approximate stepsizes in latitude and longitude based on cellsize in km
    const cellSize = 2 // Cell size in km
    const latStep = 0.008983 * cellSize;
    const lngStep = 0.01751 * cellSize;

    // Get boundingbox of geograpgical region
    

    const gridCells: GeoJSON.Feature<GeoJSON.Polygon>[] = [];

    // Loop over bounding box using approximate degree steps
    for (let lng = minLng; lng < maxLng; lng += lngStep) {
      for (let lat = minLat; lat < maxLat; lat += latStep) {
        const cellCoords: [number, number][] = [
          [lng, lat],
          [lng + lngStep, lat],
          [lng + lngStep, lat + latStep],
          [lng, lat + latStep],
          [lng, lat],
        ];

        const cellPolygon: GeoJSON.Feature<GeoJSON.Polygon> = {
          type: "Feature",
          geometry: {
            type: "Polygon",
            coordinates: [cellCoords],
          },
          properties: {},
        };

        // Only add a cell if it exists within the geographical region (Stockholm)
        if (turf.booleanIntersects(cellPolygon, geojson)) {
          gridCells.push(cellPolygon);
        }
      }
    }

    const gridFeatureCollection: GeoJSON.FeatureCollection<GeoJSON.Polygon> = {
      type: "FeatureCollection",
      features: gridCells,
    };

    if (layerRef.current && mapInstanceRef.current) {
      mapInstanceRef.current.removeLayer(layerRef.current);
      layerRef.current = null;
    }

    if (mapInstanceRef.current) {
      layerRef.current = L.geoJSON(gridFeatureCollection, {
        style: {
          color: "#000",
          weight: 0.5,
          fillColor: "#ccc",
          fillOpacity: 0.3,
        },
      }).addTo(mapInstanceRef.current);
    }
  };

  useEffect(() => {
    const fetchDataAndRender = async () => {
      initMap();

      // Remove old layer if exists
      if (layerRef.current && mapInstanceRef.current) {
        mapInstanceRef.current.removeLayer(layerRef.current);
        layerRef.current = null;
      }

      if (showGrid) {
        await renderGrid();
      } else {
        await renderMunicipalities();
      }
    };

    fetchDataAndRender();
  }, [showGrid]);

  return (
    <div
      id="map"
      ref={mapRef}
      style={{
        height: "100%",
        position: "absolute",
        left: "16rem",
        right: 0,
      }}
    />
  );
};

export default LeafletMap;
