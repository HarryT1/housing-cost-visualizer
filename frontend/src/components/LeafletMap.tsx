import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const LeafletMap = () => {
  const mapRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  function getColor(d: number) {
    return d > 75000 ? '#08306b' :
      d > 65000 ? '#08519c' :
        d > 55000 ? '#2171b5' :
          d > 50000 ? '#4292c6' :
            d > 45000 ? '#6baed6' :
              d > 40000 ? '#9ecae1' :
                d > 35000 ? '#c6dbef' :
                  '#deebf7';
  }

  function style(feature: any) {

    return {
      fillColor: getColor(feature.properties.avg_price_per_sqm),
      weight: 1,
      opacity: 1,
      color: 'white',
      dashArray: '3',
      fillOpacity: 0.7
    };
  }



  useEffect(() => {
    const fetchDataAndRenderMap = async () => {
      if (mapRef.current && !mapInstanceRef.current) {
        mapInstanceRef.current = L.map(mapRef.current).setView([59.334591, 18.063240], 10);

        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          maxZoom: 15,
          attribution: "© OpenStreetMap contributors",
        }).addTo(mapInstanceRef.current);

        L.control.scale().addTo(mapInstanceRef.current);

        try {
          // Load data for showing municipalities and average sqm prices
          const [geoRes, dataRes] = await Promise.all([
            fetch("./data/stockholm_municipalities.geojson"),
            fetch("http://localhost:5000/PropertyListing/AvgSqmPriceByMunicipality")
          ]);


          // Geojson data containing municipality outlines
          const municipalityGeoData = await geoRes.json();
          const municipalityAvgSqmPrice: Record<string, number> = await dataRes.json();
          // Add average price/sqm to each municipality in the geojson
          const modifiedGeoJson = {
            ...municipalityGeoData,
            features: municipalityGeoData.features.map((feature: any) => {
              const komName = feature.properties.kom_name;
              const avgPrice = municipalityAvgSqmPrice[komName];
              return {
                ...feature,
                properties: {
                  ...feature.properties,
                  avg_price_per_sqm: avgPrice
                }
              };
            })
          };
          // Set style for the map
          L.geoJson(modifiedGeoJson, {style: style})
            .addTo(mapInstanceRef.current);

        } catch (error) {
          console.error("Error loading data:", error);
        }
      }
    };

    fetchDataAndRenderMap();
  }, []);

  return (
    <div
      id="map"
      ref={mapRef}
      style={{
        height: "100%",
        position: "absolute",
        left: "16rem",
        right: 0
      }}
    />
  );
};

export default LeafletMap;