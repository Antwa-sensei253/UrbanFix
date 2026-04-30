import { MapContainer, TileLayer, Marker } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

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

export default function MapPreview({ lat, lng, height = "h-32" }: { lat: number; lng: number; height?: string }) {
  if (!lat || !lng) return null;
  return (
    <div className={`mt-2 ${height} w-full overflow-hidden rounded-md border`}>
      <MapContainer 
        center={[lat, lng]} 
        zoom={15} 
        style={{ height: "100%", width: "100%" }} 
        attributionControl={false}
      >
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <Marker position={[lat, lng]} />
      </MapContainer>
    </div>
  );
}
