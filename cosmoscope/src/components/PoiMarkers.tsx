import { useEffect, useRef } from "react";
import maplibregl from "maplibre-gl";
import type { PoiFeature } from "@/adapters/DataAdapter";
import { usePlanetStore } from "@/state/usePlanetStore";

interface PoiMarkersProps {
  map: maplibregl.Map | null;
  pois: PoiFeature[];
  onSelect: (poiId: string) => void;
}

export const PoiMarkers = ({ map, pois, onSelect }: PoiMarkersProps) => {
  const markersRef = useRef<Record<string, maplibregl.Marker>>({});
  const setSelectedPoi = usePlanetStore((state) => state.setSelectedPoi);

  useEffect(() => {
    if (!map) return;

    const markers = markersRef.current;

    // Clean up stale markers
    Object.entries(markers).forEach(([id, marker]) => {
      if (!pois.find((poi) => poi.id === id)) {
        marker.remove();
        delete markers[id];
      }
    });

    pois.forEach((poi) => {
      if (markers[poi.id]) return;
      const el = document.createElement("button");
      el.className = "poi-marker";
      el.type = "button";
      el.textContent = poi.name;
      el.setAttribute("aria-label", `${poi.name} POI`);
      el.addEventListener("click", () => {
        setSelectedPoi(poi.id);
        onSelect(poi.id);
      });
      const marker = new maplibregl.Marker({ element: el }).setLngLat(poi.coordinates as [number, number]);
      marker.addTo(map);
      markers[poi.id] = marker;
    });

    const handleZoom = () => {
      const zoom = map.getZoom();
      Object.entries(markers).forEach(([id, marker]) => {
        const poi = pois.find((candidate) => candidate.id === id);
        if (!poi) return;
        const element = marker.getElement();
        element.style.display = zoom >= poi.minZoom ? "flex" : "none";
      });
    };

    handleZoom();
    map.on("zoom", handleZoom);

    return () => {
      map.off("zoom", handleZoom);
      Object.values(markers).forEach((marker) => marker.remove());
      markersRef.current = {};
    };
  }, [map, onSelect, pois, setSelectedPoi]);

  return null;
};
