import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import * as React from "react";

export default function HeatmapView({ reports }: { reports: any[] }) {
  const mapData = reports.filter(r => r.latitude && r.longitude);
  const centerLat = mapData.length > 0 ? mapData[0].latitude : 30.0444;
  const centerLng = mapData.length > 0 ? mapData[0].longitude : 31.2357;

  return (
    <div className="h-[600px] w-full rounded-md border overflow-hidden">
      <MapContainer center={[centerLat, centerLng]} zoom={12} style={{ height: "100%", width: "100%" }}>
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        {mapData.map(r => {
          let colorClass = "bg-red-500"; // Default: Critical/New
          if (r.status === "Resolved") colorClass = "bg-green-500";
          else if (r.status === "InProgress" || r.status === "Assigned" || r.status === "Verified") colorClass = "bg-yellow-500";
          
          if (r.urgency === "Critical" && r.status !== "Resolved") colorClass = "bg-red-600 animate-pulse";

          const icon = L.divIcon({
            className: "bg-transparent",
            html: `<div class="w-4 h-4 rounded-full border-2 border-white shadow-md ${colorClass}"></div>`,
            iconSize: [16, 16],
            iconAnchor: [8, 8],
          });

          return (
            <Marker key={r.id} position={[r.latitude, r.longitude]} icon={icon}>
              <Popup>
                <div className="text-xs p-1">
                  <strong className="block text-sm mb-1">{r.category} (#{r.id})</strong>
                  <span className="inline-block px-1.5 py-0.5 rounded text-white text-[10px] bg-slate-800 mb-1">{r.status}</span>
                  <span className="inline-block px-1.5 py-0.5 rounded text-white text-[10px] bg-red-800 ml-1 mb-1">{r.urgency}</span>
                  <p className="mt-1 text-muted-foreground">{r.address_description}</p>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}
