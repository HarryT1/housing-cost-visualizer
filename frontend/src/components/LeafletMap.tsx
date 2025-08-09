import { useEffect, useRef } from "react";
import L from "leaflet";
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
    return d > 120000 ? "#08306b" :  // darkest blue, above 120k
      d > 110000 ? "#084594" :
        d > 100000 ? "#0868ac" :
          d > 90000 ? "#2b8cbe" :
            d > 80000 ? "#4ba3d9" :
              d > 70000 ? "#69b3e7" :
                d > 60000 ? "#8cc6f2" :
                  d > 50000 ? "#add8ff" :
                    d > 40000 ? "#cde9ff" :
                      d > 30000 ? "#e7f3ff" :   // light blue for 30k-40k
                        "#f0f8ff";  // *lightest* blue for below 30k
  }

  function style(feature: any) {
    return {
      fillColor: getColor(feature.properties.averagePricePerSqm),
      weight: 1,
      opacity: 1,
      color: "black",
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
            averagePricePerSqm: avgPrice,
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
    const { minLng, minLat, maxLng, maxLat } = await bboxRes.json();

    // Approximate stepsizes in latitude and longitude based on cellsize in km
    const cellSize = 2 // Cell size in km
    const latStep = 0.008983 * cellSize;
    const lngStep = 0.01751 * cellSize;
    const gridCells: GeoJSON.Feature<GeoJSON.Polygon>[] = [];

    // Loop over bounding box using approximate degree steps
    let allCoords: { minLng: string, maxLng: string, minLat: string, maxLat: string }[] = []

    for (let lng = minLng; lng < maxLng; lng += lngStep) {
      for (let lat = minLat; lat < maxLat; lat += latStep) {
        const cellCoords: [number, number][] = [
          [lng, lat],
          [lng + lngStep, lat],
          [lng + lngStep, lat + latStep],
          [lng, lat + latStep],
          [lng, lat],
        ];
        let cellCoordsDict =
        {
          "minLng": lng,
          "maxLng": lng + lngStep,
          "minLat": lat,
          "maxLat": lat + latStep
        }


        const cellPolygon: GeoJSON.Feature<GeoJSON.Polygon> = {
          type: "Feature",
          geometry: {
            type: "Polygon",
            coordinates: [cellCoords],
          },
          properties: {},
        };

        // Only add a cell if it exists within the geographical region in geojson
        if (turf.booleanIntersects(cellPolygon, geojson)) {
          gridCells.push(cellPolygon);
          allCoords.push(cellCoordsDict)
        }
      }
    }

    const averageSqmPricePerGrid = await fetch("http://localhost:5000/PropertyListing/GridSqmPrices", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(
        allCoords
      ),
    });

    const averages = await averageSqmPricePerGrid.json()
    const filteredFeatures = gridCells
      .map((feature, index) => {
        // Add info to properties
        return {
          ...feature,
          properties: {
            ...feature.properties,
            averagePricePerSqm: averages[index].averagePricePerSqm,
            propertyCount: averages[index].propertyCount
          },
        };
      })
      .filter(feature => feature.properties.averagePricePerSqm !== -1);
    const gridFeatureCollection: GeoJSON.FeatureCollection<GeoJSON.Polygon> = {
      type: "FeatureCollection",
      features: filteredFeatures,
    };

    if (layerRef.current && mapInstanceRef.current) {
      mapInstanceRef.current.removeLayer(layerRef.current);
      layerRef.current = null;
    }

    if (mapInstanceRef.current) {
      layerRef.current = L.geoJSON(gridFeatureCollection, {
        style,
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
