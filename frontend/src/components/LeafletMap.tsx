// LeafletMap.tsx
import React, { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Calculator } from "lucide-react";

const LeafletMap = () => {
  const mapRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (mapRef.current && !mapInstanceRef.current) {
      mapInstanceRef.current = L.map(mapRef.current).setView([59.334591, 18.063240], 10);

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 15,
        attribution: '© OpenStreetMap contributors',
      }).addTo(mapInstanceRef.current);
      L.control.scale().addTo(mapInstanceRef.current);
    }
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