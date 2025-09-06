import { useEffect, useRef } from "react";
import L, { Control } from "leaflet";
import "leaflet/dist/leaflet.css";

interface LeafletMapProps {
  showGrid: boolean; // true = show grid, false = show municipalities
  className?: string;
  cellSize: number; // Cell size of grid in km, minimum of 0.1, maximum of 5 (step size 0.1)
  fromDate: Date | undefined;
  toDate: Date | undefined;
}

const LeafletMap = ({
  showGrid,
  className,
  cellSize,
  fromDate,
  toDate,
}: LeafletMapProps) => {
  const mapRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const layerRef = useRef<L.GeoJSON | null>(null);
  const infoRef = useRef<
    | (L.Control & { _div?: HTMLDivElement; update: (props?: any) => void })
    | null
  >(null);

  function formatToSwedishDate(date: Date | undefined): string {
    if (!date) return "";
    const swedishDate = new Date(
      date.toLocaleString("sv-SE", { timeZone: "Europe/Stockholm" })
    );

    const year = swedishDate.getFullYear();
    const month = String(swedishDate.getMonth() + 1).padStart(2, "0");
    const day = String(swedishDate.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`; // YYYY-MM-DD
  }

  function getColor(d: number) {
    return d > 120000
      ? "#08306b" // darkest blue, above 120k
      : d > 110000
      ? "#084594"
      : d > 100000
      ? "#0868ac"
      : d > 90000
      ? "#2b8cbe"
      : d > 80000
      ? "#4ba3d9"
      : d > 70000
      ? "#69b3e7"
      : d > 60000
      ? "#8cc6f2"
      : d > 50000
      ? "#add8ff"
      : d > 40000
      ? "#cde9ff"
      : d > 30000
      ? "#e7f3ff"
      : "#f0f8ff"; // Lightest blue, below 30k
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

  // Method for updating info control in top right corner to include more information about sold properties
  const initInfoControl = () => {
    const info = new Control({}) as L.Control & {
      _div?: HTMLDivElement;
      update: (props?: any) => void;
    };
    info.onAdd = function () {
      this._div = L.DomUtil.create("div", "info");
      this.update();
      return this._div;
    };
    info.update = function (props) {
      if (!this._div) return;
      const isMobile = window.innerWidth < 768;
      const noInfoMessage = isMobile
        ? "Klicka på ett område för mer info"
        : "Håll musen över ett område för mer info";

      if (showGrid) {
        this._div.innerHTML = props
          ? "<h4>Genomsnittligt kvadratmeterpris</h4>" +
            `${Math.round(props.averagePricePerSqm).toLocaleString(
              "sv-SE"
            )} kr/m<sup>2</sup> <br><br>
        <h4>Antal bostäder</h4> ${props.count} sålda bostäder <br><br>
        <h4>Högsta kvadratmeterpris i området</h4> ${Math.round(
          props.maxPricePerSqm
        ).toLocaleString("sv-SE")} kr/m<sup>2</sup> <br><br>
        <h4>Lägsta kvadratmeterpris i området</h4> ${Math.round(
          props.minPricePerSqm
        ).toLocaleString("sv-SE")} kr/m<sup>2</sup>`
          : noInfoMessage;
      } else {
        this._div.innerHTML = props
          ? "<h4>Genomsnittligt kvadratmeterpris</h4>" +
            `${Math.round(props.averagePricePerSqm).toLocaleString(
              "sv-SE"
            )} kr/m<sup>2</sup> <br><br>` +
            "<h4>Kommun</h4>" +
            props.kom_name
          : noInfoMessage;
      }
    };
    return info;
  };

  const initLegend = () => {
    const legend = new Control({ position: "bottomright" });
    legend.onAdd = function () {
      const div = L.DomUtil.create("div", "info legend");
      const grades = [
        0, 30000, 40000, 50000, 60000, 70000, 80000, 90000, 100000, 110000,
        120000,
      ];
      for (let i = 0; i < grades.length; i++) {
        const from = grades[i].toLocaleString("sv-SE");
        const to = grades[i + 1] ? grades[i + 1].toLocaleString("sv-SE") : null;
        div.innerHTML += `<i style="background:${getColor(
          grades[i] + 1
        )}"></i> ${from}${to ? `&ndash;${to}<br>` : "+"}`;
      }
      return div;
    };
    return legend;
  };

  const initMap = () => {
    if (mapRef.current && !mapInstanceRef.current) {
      mapInstanceRef.current = L.map(mapRef.current, {
        center: [59.334591, 18.10324],
        zoom: 12,
        zoomControl: false,
      });
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 15,
        attribution: "© OpenStreetMap contributors",
      }).addTo(mapInstanceRef.current);
      L.control.scale().addTo(mapInstanceRef.current);
      const legend = initLegend();
      legend.addTo(mapInstanceRef.current);
      infoRef.current = initInfoControl();
      infoRef.current.addTo(mapInstanceRef.current);
    }
  };

  function highlightFeature(e: L.LeafletMouseEvent) {
    var layer = e.target;

    layer.setStyle({
      weight: 3,
      color: "#FFF",
      dashArray: "",
      fillOpacity: 0.7,
    });

    layer.bringToFront();
    infoRef.current?.update(layer.feature.properties);
  }

  function resetHighlight(e: L.LeafletMouseEvent) {
    if (layerRef.current) layerRef.current.resetStyle(e.target);

    infoRef.current?.update();
  }

  function onEachFeature(_feature: GeoJSON.Feature, layer: L.Layer) {
    layer.on({
      mouseover: highlightFeature,
      mouseout: resetHighlight,
    });
  }

  const renderMunicipalities = async () => {
    const [geoRes, dataRes] = await Promise.all([
      fetch("/stockholm_municipalities.geojson", {
        headers: {
          Accept: "application/geo+json",
        },
      }),
      fetch(`api/PropertyListing/AvgSqmPriceByMunicipality`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fromDate: formatToSwedishDate(fromDate),
          toDate: formatToSwedishDate(toDate),
        }),
      }),
    ]);
    const municipalityAvgSqmPrice: Record<string, number> =
      await dataRes.json();
    console.log(municipalityAvgSqmPrice);
    const municipalityGeoData =
      (await geoRes.json()) as GeoJSON.FeatureCollection;

    console.log(municipalityGeoData);

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
      layerRef.current = L.geoJSON(modifiedGeoJson, {
        style,
        onEachFeature: onEachFeature,
      }).addTo(mapInstanceRef.current);
    }
  };

  const renderGrid = async () => {

    // Approximate stepsizes in latitude and longitude based on cellsize in km
    const latStep = 0.008983 * cellSize;
    const lngStep = 0.01751 * cellSize;
    const gridCells: GeoJSON.Feature<GeoJSON.Polygon>[] = [];
    const averageSqmPricePerGrid = await fetch(
      `api/PropertyListing/GridSqmPrices`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          cellScale: cellSize * 10,
          fromDate: formatToSwedishDate(fromDate),
          toDate: formatToSwedishDate(toDate),
        }),
      }
    );

    interface GridCellData {
      newGridX: number;
      newGridY: number;
      averagePricePerSqm: number;
      count: number;
      minPricePerSqm: number;
      maxPricePerSqm: number;
    }
    const gridData: GridCellData[] = await averageSqmPricePerGrid.json();

    for (const cell of gridData) {
      const minLng = cell.newGridX * lngStep;
      const maxLng = (cell.newGridX + 1) * lngStep;
      const minLat = cell.newGridY * latStep;
      const maxLat = (cell.newGridY + 1) * latStep;

      const cellCoords: [number, number][] = [
        [minLng, minLat], //polygon startingpoint
        [maxLng, minLat],
        [maxLng, maxLat],
        [minLng, maxLat],
        [minLng, minLat], // close the polygon
      ];

      const cellPolygon: GeoJSON.Feature<GeoJSON.Polygon> = {
        type: "Feature",
        geometry: {
          type: "Polygon",
          coordinates: [cellCoords],
        },
        properties: {
          averagePricePerSqm: cell.averagePricePerSqm,
          maxPricePerSqm: cell.maxPricePerSqm,
          minPricePerSqm: cell.minPricePerSqm,
          count: cell.count,
        },
      };
      
      gridCells.push(cellPolygon);
      
    }

    const gridFeatureCollection: GeoJSON.FeatureCollection<GeoJSON.Polygon> = {
      type: "FeatureCollection",
      features: gridCells,
    };

    if (mapInstanceRef.current) {
      if (layerRef.current) {
        mapInstanceRef.current.removeLayer(layerRef.current);
      }
      layerRef.current = L.geoJSON(gridFeatureCollection, {
        style,
        onEachFeature: onEachFeature,
      }).addTo(mapInstanceRef.current);
    }
  };

  useEffect(() => {
    const fetchDataAndRender = async () => {
      if (!mapInstanceRef.current) {
        initMap();
      } else {
        // Recreate and re-add info control
        if (infoRef.current) {
          mapInstanceRef.current?.removeControl(infoRef.current);
        }
        infoRef.current = initInfoControl();
        infoRef.current.addTo(mapInstanceRef.current!);
      }

      // Remove old layer if exists
      if (layerRef.current && mapInstanceRef.current) {
        layerRef.current.eachLayer((layer) => {
          layer.off({
            mouseover: highlightFeature,
            mouseout: resetHighlight,
          });
        });
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
  }, [showGrid, cellSize, fromDate, toDate]);

  return (
    <div
      className={className || "h-full absolute left-64 right-0"}
      id="map"
      ref={mapRef}
    />
  );
};

export default LeafletMap;
