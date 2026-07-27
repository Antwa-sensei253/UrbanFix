import * as React from "react";
import { MapContainer, TileLayer, Marker, Circle, useMapEvents, useMap, Tooltip, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { type DistrictData } from "@/lib/api";

// Fix default icon issue with Leaflet in React
import iconRetina from "leaflet/dist/images/marker-icon-2x.png";
import iconUrl from "leaflet/dist/images/marker-icon.png";
import shadowUrl from "leaflet/dist/images/marker-shadow.png";

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: iconRetina,
  iconUrl: iconUrl,
  shadowUrl: shadowUrl,
});

function MapClickPicker({ onPointSelect }: { onPointSelect?: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      if (onPointSelect) {
        onPointSelect(Number(e.latlng.lat.toFixed(4)), Number(e.latlng.lng.toFixed(4)));
      }
    },
  });
  return null;
}

function MapCenterUpdater({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  const prevCenter = React.useRef([lat, lng]);
  React.useEffect(() => {
    if (Math.abs(prevCenter.current[0] - lat) > 0.0001 || Math.abs(prevCenter.current[1] - lng) > 0.0001) {
      map.panTo([lat, lng]);
      prevCenter.current = [lat, lng];
    }
  }, [lat, lng, map]);
  return null;
}

function MapResizeFixer() {
  const map = useMap();
  React.useEffect(() => {
    // Ensure Leaflet recalculates exact dimensions after modal transitions or animations complete
    const timers = [50, 250, 500].map((ms) =>
      setTimeout(() => {
        if (map && map.invalidateSize) {
          map.invalidateSize();
        }
      }, ms)
    );
    return () => timers.forEach((t) => clearTimeout(t));
  }, [map]);
  return null;
}

export interface DistrictBoundaryMapProps {
  lat: number;
  lng: number;
  radiusKm: number;
  name?: string;
  height?: string;
  interactive?: boolean;
  onLocationSelect?: (lat: number, lng: number) => void;
  otherDistricts?: DistrictData[];
  currentDistrictId?: number;
}

export default function DistrictBoundaryMap({
  lat = 30.0444,
  lng = 31.2357,
  radiusKm = 5.0,
  name = "Target Zone",
  height = "h-64",
  interactive = true,
  onLocationSelect,
  otherDistricts = [],
  currentDistrictId,
}: DistrictBoundaryMapProps) {
  // Ensure valid coordinate fallbacks
  const centerLat = !isNaN(Number(lat)) && Number(lat) !== 0 ? Number(lat) : 30.0444;
  const centerLng = !isNaN(Number(lng)) && Number(lng) !== 0 ? Number(lng) : 31.2357;
  const validRadius = !isNaN(Number(radiusKm)) && Number(radiusKm) > 0 ? Number(radiusKm) : 5.0;

  const handleDragEnd = (e: L.DragEndEvent) => {
    const marker = e.target as L.Marker;
    const pos = marker.getLatLng();
    if (onLocationSelect) {
      onLocationSelect(Number(pos.lat.toFixed(4)), Number(pos.lng.toFixed(4)));
    }
  };

  return (
    <div
      className={`relative isolate z-0 ${height} w-full overflow-hidden rounded-xl border border-border/80 shadow-inner bg-slate-900`}
      style={{ isolation: "isolate", zIndex: 0 }}
    >
      {interactive && (
        <div className="absolute top-2.5 left-2.5 z-10 rounded-md bg-card/95 px-3 py-1.5 text-[11px] font-semibold text-foreground backdrop-blur border border-border shadow-2xs pointer-events-none flex items-center gap-1.5">
          <span className="inline-block size-2 rounded-full bg-blue-500 animate-ping" />
          <span>📍 Click map or drag marker pin to point location & relocate center</span>
        </div>
      )}
      <MapContainer
        center={[centerLat, centerLng]}
        zoom={12}
        style={{ height: "100%", width: "100%", minHeight: "200px", zIndex: 0 }}
        attributionControl={false}
      >
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        
        <MapResizeFixer />
        {interactive && <MapClickPicker onPointSelect={onLocationSelect} />}
        <MapCenterUpdater lat={centerLat} lng={centerLng} />

        {/* Render neighbor districts in background for visual coordination */}
        {otherDistricts
          .filter((d) => d.id !== currentDistrictId && d.latitude && d.longitude)
          .map((d) => (
            <React.Fragment key={d.id}>
              <Circle
                center={[d.latitude!, d.longitude!]}
                radius={(d.radius_km ?? 5.0) * 1000}
                pathOptions={{ color: "#10b981", fillColor: "#10b981", fillOpacity: 0.1, weight: 1.5, dashArray: "4, 4" }}
              >
                <Tooltip direction="top" opacity={0.9}>
                  <span className="font-bold text-xs">{d.name} (Existing Jurisdiction)</span>
                </Tooltip>
              </Circle>
            </React.Fragment>
          ))}

        {/* Active/Target District Surveillance Circle */}
        <Circle
          center={[centerLat, centerLng]}
          radius={validRadius * 1000}
          pathOptions={{ color: "#2563eb", fillColor: "#3b82f6", fillOpacity: 0.25, weight: 3, dashArray: interactive ? "8, 6" : undefined }}
        />

        {/* Active Center Pin */}
        <Marker
          position={[centerLat, centerLng]}
          draggable={interactive}
          eventHandlers={{ dragend: handleDragEnd }}
        >
          <Popup>
            <div className="p-1 text-xs text-center">
              <strong className="block text-sm text-blue-600 font-bold">{name || "District Center"}</strong>
              <span className="block text-muted-foreground mt-0.5">Surveillance Radius: {validRadius} km</span>
              <span className="block font-mono text-[10px] text-slate-500 mt-1">
                {centerLat.toFixed(4)}° N, {centerLng.toFixed(4)}° E
              </span>
            </div>
          </Popup>
        </Marker>
      </MapContainer>
    </div>
  );
}
