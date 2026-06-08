import { useEffect, useMemo, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useCategories, type RequestCategory, type CategoryInfo } from "@/lib/categories";

// Fix default marker icon
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

const DEFAULT_CENTER: [number, number] = [51.5, -0.12]; // London, UK

function isValidLatLng(lat: unknown, lng: unknown): lat is number {
  return typeof lat === "number" && typeof lng === "number" && Number.isFinite(lat) && Number.isFinite(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180;
}

function getSafeCenter(center: [number, number] | undefined) {
  return center && isValidLatLng(center[0], center[1]) ? center : DEFAULT_CENTER;
}

function hasVisibleSize(map: L.Map) {
  const container = map.getContainer();
  return container.clientWidth > 0 && container.clientHeight > 0;
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

const FALLBACK_COLOR = "hsl(210, 100%, 50%)";

function createCategoryIcon(color: string) {
  return L.divIcon({
    className: "custom-marker",
    html: `<div style="
      width: 28px; height: 28px; border-radius: 50% 50% 50% 0;
      background: ${color}; transform: rotate(-45deg);
      border: 2px solid white; box-shadow: 0 2px 6px rgba(0,0,0,0.3);
      position: relative;
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

function createBusinessIcon() {
  return L.divIcon({
    className: "custom-marker",
    html: `<div style="
      width: 32px; height: 32px; border-radius: 6px;
      background: hsl(var(--primary));
      border: 2px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.35);
      display: flex; align-items: center; justify-content: center;
    "><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
      <polyline points="9 22 9 12 15 12 15 22"></polyline>
    </svg></div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
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

export interface MapBusiness {
  id: string;
  name: string;
  business_type: string;
  lat: number;
  lng: number;
  town: string;
  request_count: number;
}

interface MapViewProps {
  requests: MapRequest[];
  businesses?: MapBusiness[];
  onMarkerClick?: (id: string) => void;
  onBusinessClick?: (id: string) => void;
  onMapClick?: (lat: number, lng: number) => void;
  onCenterChange?: (lat: number, lng: number, zoom: number) => void;
  pinMode?: boolean;
  droppedPin?: { lat: number; lng: number } | null;
  center?: [number, number];
  zoom?: number;
  className?: string;
}

export default function MapView({
  requests,
  businesses = [],
  onMarkerClick,
  onBusinessClick,
  onMapClick,
  pinMode = false,
  droppedPin = null,
  center = DEFAULT_CENTER,
  zoom = 5, // UK-wide view
  className = "",
}: MapViewProps) {
  const mapElementRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerLayerRef = useRef<L.LayerGroup | null>(null);
  const pinMarkerRef = useRef<L.Marker | null>(null);
  const onMapClickRef = useRef(onMapClick);
  onMapClickRef.current = onMapClick;
  const pinModeRef = useRef(pinMode);
  pinModeRef.current = pinMode;

  const { data: categories } = useCategories();
  const colorBySlug = useMemo(() => {
    const map = new Map<string, string>();
    (categories ?? []).forEach((c) => map.set(c.slug, c.color));
    return map;
  }, [categories]);

  useEffect(() => {
    if (!mapElementRef.current || mapRef.current) return;

    const initialCenter = getSafeCenter(center);
    const initialZoom = Number.isFinite(zoom) ? zoom : 6;

    const map = L.map(mapElementRef.current, {
      zoomControl: true,
      attributionControl: true,
    }).setView(initialCenter, initialZoom);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://osm.org/copyright">OpenStreetMap</a>',
    }).addTo(map);

    markerLayerRef.current = L.layerGroup().addTo(map);
    mapRef.current = map;

    map.on("click", (e: L.LeafletMouseEvent) => {
      if (pinModeRef.current && onMapClickRef.current) {
        onMapClickRef.current(e.latlng.lat, e.latlng.lng);
      }
    });

    // Watch container size — Leaflet needs invalidateSize() when its container
    // goes from hidden (0x0) to visible (e.g. mobile tab toggle, orientation change).
    let lastW = 0;
    let lastH = 0;
    const resizeObserver = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      const { width, height } = entry.contentRect;
      if (width === lastW && height === lastH) return;
      const wasHidden = lastW === 0 || lastH === 0;
      lastW = width;
      lastH = height;
      if (width === 0 || height === 0) return;
      map.invalidateSize(false);
      // When revealing from hidden, re-centre so tiles load around the right spot.
      if (wasHidden) {
        map.setView(map.getCenter(), map.getZoom(), { animate: false });
      }
    });
    resizeObserver.observe(mapElementRef.current);

    return () => {
      resizeObserver.disconnect();
      markerLayerRef.current?.clearLayers();
      markerLayerRef.current = null;
      pinMarkerRef.current = null;
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Pin mode cursor + dropped pin marker
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const container = map.getContainer();
    container.style.cursor = pinMode ? "crosshair" : "";
  }, [pinMode]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (pinMarkerRef.current) {
      pinMarkerRef.current.remove();
      pinMarkerRef.current = null;
    }
    if (droppedPin && isValidLatLng(droppedPin.lat, droppedPin.lng)) {
      pinMarkerRef.current = L.marker([droppedPin.lat, droppedPin.lng], {
        zIndexOffset: 1000,
      }).addTo(map);
    }
  }, [droppedPin]);

  useEffect(() => {
    if (!mapRef.current) return;
    const map = mapRef.current;
    const nextCenter = getSafeCenter(center);
    const nextZoom = Number.isFinite(zoom) ? zoom : 6;
    if (!hasVisibleSize(map)) {
      map.setView(nextCenter, nextZoom, { animate: false });
      return;
    }
    map.invalidateSize(false);
    map.flyTo(nextCenter, nextZoom, { duration: 1 });
  }, [center, zoom]);

  useEffect(() => {
    const layer = markerLayerRef.current;
    if (!layer) return;

    layer.clearLayers();

    businesses.forEach((biz) => {
      if (!isValidLatLng(biz.lat, biz.lng)) return;

      const marker = L.marker([biz.lat, biz.lng], {
        icon: createBusinessIcon(),
      });

      marker.bindPopup(`
        <div class="font-heading">
          <strong>${escapeHtml(biz.name)}</strong><br />
          <span class="text-sm capitalize">${escapeHtml(biz.business_type.replace(/_/g, " "))}</span><br />
          <span class="text-sm">${escapeHtml(biz.town)} · ${biz.request_count} request${biz.request_count !== 1 ? "s" : ""}</span>
        </div>
      `);

      if (onBusinessClick) {
        marker.on("click", () => onBusinessClick(biz.id));
      }

      marker.addTo(layer);
    });

    requests.forEach((req) => {
      if (!isValidLatLng(req.lat, req.lng)) return;

      const marker = L.marker([req.lat, req.lng], {
        icon: createCategoryIcon(colorBySlug.get(req.category) ?? FALLBACK_COLOR),
      });

      marker.bindPopup(`
        <div class="font-heading">
          <strong>${escapeHtml(req.title)}</strong><br />
          <span class="text-sm">${escapeHtml(req.town)} · ${req.upvote_count} votes</span>
        </div>
      `);

      if (onMarkerClick) {
        marker.on("click", () => onMarkerClick(req.id));
      }

      marker.addTo(layer);
    });
  }, [requests, businesses, onMarkerClick, onBusinessClick, colorBySlug]);

  return <div ref={mapElementRef} className={`z-0 rounded-lg ${className}`} style={{ height: "100%", width: "100%" }} />;
}
