import { useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { CATEGORIES, type RequestCategory } from "@/lib/categories";

// Fix default marker icon
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

function createCategoryIcon(category: RequestCategory) {
  const color = CATEGORIES[category].color;
  return L.divIcon({
    className: "custom-marker",
    html: `<div style="
      width: 28px; height: 28px; border-radius: 50% 50% 50% 0;
      background: ${color}; transform: rotate(-45deg);
      border: 2px solid white; box-shadow: 0 2px 6px rgba(0,0,0,0.3);
    "><div style="
      width: 10px; height: 10px; border-radius: 50%;
      background: white; position: absolute;
      top: 50%; left: 50%; transform: translate(-50%, -50%);
    "></div></div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 28],
    popupAnchor: [0, -28],
  });
}

interface MapRequest {
  id: string;
  title: string;
  category: RequestCategory;
  lat: number;
  lng: number;
  town: string;
  upvote_count: number;
}

interface MapViewProps {
  requests: MapRequest[];
  onMarkerClick?: (id: string) => void;
  center?: [number, number];
  zoom?: number;
  className?: string;
}

function FlyTo({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo(center, zoom, { duration: 1 });
  }, [center, zoom, map]);
  return null;
}

export default function MapView({
  requests,
  onMarkerClick,
  center = [53.5, -2],
  zoom = 6,
  className = "",
}: MapViewProps) {
  return (
    <MapContainer
      center={center}
      zoom={zoom}
      className={`z-0 rounded-lg ${className}`}
      style={{ height: "100%", width: "100%" }}
    >
      <TileLayer
        attribution='&copy; <a href="https://osm.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <FlyTo center={center} zoom={zoom} />
      {requests.map((req) => (
        <Marker
          key={req.id}
          position={[req.lat, req.lng]}
          icon={createCategoryIcon(req.category)}
          eventHandlers={{ click: () => onMarkerClick?.(req.id) }}
        >
          <Popup>
            <div className="font-heading">
              <strong>{req.title}</strong>
              <br />
              <span className="text-sm">{req.town} · {req.upvote_count} votes</span>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
