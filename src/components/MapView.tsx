import { useEffect, useMemo, useRef } from "react";
import maplibregl, { Map as MapLibreMap } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { useCategories, type RequestCategory } from "@/lib/categories";

const DEFAULT_CENTER: [number, number] = [51.5, -0.12]; // London, UK

function isValidLatLng(lat: unknown, lng: unknown): lat is number {
  return typeof lat === "number" && typeof lng === "number" && Number.isFinite(lat) && Number.isFinite(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180;
}

function getSafeCenter(center: [number, number] | undefined): [number, number] {
  return center && isValidLatLng(center[0], center[1]) ? [center[1], center[0]] : [DEFAULT_CENTER[1], DEFAULT_CENTER[0]]; // Convert [lat, lng] to [lng, lat] for MapLibre
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// OpenStreetMap style for MapLibre
const OSM_STYLE = {
  version: 8,
  name: "OpenStreetMap",
  sources: {
    osm: {
      type: "raster",
      tiles: ["https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"],
      tileSize: 256,
      attribution: '&copy; <a href="https://osm.org/copyright">OpenStreetMap</a> contributors',
    },
  },
  layers: [
    {
      id: "osm-base",
      type: "raster",
      source: "osm",
      minzoom: 0,
      maxzoom: 28,
    },
  ],
};

const FALLBACK_COLOR = "hsl(210, 100%, 50%)";

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
  onCenterChange,
  pinMode = false,
  droppedPin = null,
  center = DEFAULT_CENTER,
  zoom = 5,
  className = "",
}: MapViewProps) {
  const mapElementRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const onMapClickRef = useRef(onMapClick);
  onMapClickRef.current = onMapClick;
  const onCenterChangeRef = useRef(onCenterChange);
  onCenterChangeRef.current = onCenterChange;
  const pinModeRef = useRef(pinMode);
  pinModeRef.current = pinMode;

  const { data: categories } = useCategories();
  const colorBySlug = useMemo(() => {
    const map = new Map<string, string>();
    (categories ?? []).forEach((c) => map.set(c.slug, c.color));
    return map;
  }, [categories]);

  // Initialize map
  useEffect(() => {
    if (!mapElementRef.current || mapRef.current) return;

    const initialCenter = getSafeCenter(center);
    const initialZoom = Number.isFinite(zoom) ? zoom : 6;

    const map = new maplibregl.Map({
      container: mapElementRef.current,
      style: OSM_STYLE,
      center: initialCenter,
      zoom: initialZoom,
      attributionControl: true,
    });

    // Add navigation controls
    map.addControl(new maplibregl.NavigationControl());

    // Handle map click
    map.on("click", (e) => {
      if (pinModeRef.current && onMapClickRef.current) {
        onMapClickRef.current(e.lngLat.lat, e.lngLat.lng);
      }
    });

    // Handle map movement
    map.on("moveend", () => {
      if (!onCenterChangeRef.current) return;
      const c = map.getCenter();
      onCenterChangeRef.current(c.lat, c.lng, map.getZoom());
    });

    // Handle container resize
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
      map.resize();
      if (wasHidden) {
        const currentCenter = map.getCenter();
        map.setCenter([currentCenter.lng, currentCenter.lat]);
      }
    });
    resizeObserver.observe(mapElementRef.current);

    mapRef.current = map;

    return () => {
      resizeObserver.disconnect();
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Update pin mode cursor
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const container = map.getContainer();
    container.style.cursor = pinMode ? "crosshair" : "";
  }, [pinMode]);

  // Update center and zoom
  useEffect(() => {
    if (!mapRef.current) return;
    const map = mapRef.current;
    const nextCenter = getSafeCenter(center);
    const nextZoom = Number.isFinite(zoom) ? zoom : 6;
    if (mapElementRef.current?.clientWidth === 0 || mapElementRef.current?.clientHeight === 0) {
      map.setCenter(nextCenter);
      map.setZoom(nextZoom);
      return;
    }
    map.flyTo({ center: nextCenter, zoom: nextZoom, duration: 1 });
  }, [center, zoom]);

  // Update markers (requests and businesses) using DOM overlays
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Clean up existing markers
    const existingMarkers = document.querySelectorAll(".maplibre-marker");
    existingMarkers.forEach((marker) => marker.remove());

    // Add request markers
    requests.forEach((req) => {
      if (!isValidLatLng(req.lat, req.lng)) return;

      const color = colorBySlug.get(req.category) ?? FALLBACK_COLOR;

      // Create marker element
      const el = document.createElement("div");
      el.className = "maplibre-marker";
      el.style.cursor = "pointer";
      el.innerHTML = `
        <div style="
          width: 28px; height: 28px; border-radius: 50% 50% 50% 0;
          background: ${color}; transform: rotate(-45deg);
          border: 2px solid white; box-shadow: 0 2px 6px rgba(0,0,0,0.3);
          position: relative;
        "><div style="
          width: 10px; height: 10px; border-radius: 50%;
          background: white; position: absolute;
          top: 50%; left: 50%; transform: translate(-50%, -50%);
        "></div></div>
      `;

      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([req.lng, req.lat])
        .addTo(map);

      el.addEventListener("click", (e) => {
        e.stopPropagation();

        const popupHTML = `
          <div class="font-heading">
            <strong>${escapeHtml(req.title)}</strong><br />
            <span class="text-sm">${escapeHtml(req.town)} · ${req.upvote_count} voices</span>
          </div>
        `;

        new maplibregl.Popup({ offset: [0, -14] })
          .setLngLat([req.lng, req.lat])
          .setHTML(popupHTML)
          .addTo(map);

        if (onMarkerClick) {
          onMarkerClick(req.id);
        }
      });
    });

    // Add business markers
    businesses.forEach((biz) => {
      if (!isValidLatLng(biz.lat, biz.lng)) return;

      const el = document.createElement("div");
      el.className = "maplibre-marker";
      el.style.cursor = "pointer";
      el.innerHTML = `
        <div style="
          width: 32px; height: 32px; border-radius: 6px;
          background: hsl(var(--primary));
          border: 2px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.35);
          display: flex; align-items: center; justify-content: center;
        "><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
          <polyline points="9 22 9 12 15 12 15 22"></polyline>
        </svg></div>
      `;

      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([biz.lng, biz.lat])
        .addTo(map);

      el.addEventListener("click", (e) => {
        e.stopPropagation();

        const popupHTML = `
          <div class="font-heading">
            <strong>${escapeHtml(biz.name)}</strong><br />
            <span class="text-sm capitalize">${escapeHtml(biz.business_type.replace(/_/g, " "))}</span><br />
            <span class="text-sm">${escapeHtml(biz.town)} · ${biz.request_count} request${biz.request_count !== 1 ? "s" : ""}</span>
          </div>
        `;

        new maplibregl.Popup({ offset: [0, -16] })
          .setLngLat([biz.lng, biz.lat])
          .setHTML(popupHTML)
          .addTo(map);

        if (onBusinessClick) {
          onBusinessClick(biz.id);
        }
      });
    });
  }, [requests, businesses, onMarkerClick, onBusinessClick, colorBySlug]);

  // Update dropped pin
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Remove existing dropped pin marker
    const existingPin = document.querySelector(".maplibre-dropped-pin");
    if (existingPin) {
      existingPin.remove();
    }

    if (droppedPin && isValidLatLng(droppedPin.lat, droppedPin.lng)) {
      const el = document.createElement("div");
      el.className = "maplibre-dropped-pin";
      el.innerHTML = `
        <div style="
          width: 12px; height: 12px; border-radius: 50%;
          background: #3b82f6;
          border: 2px solid white;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        "></div>
      `;

      new maplibregl.Marker({ element: el })
        .setLngLat([droppedPin.lng, droppedPin.lat])
        .addTo(map);
    }
  }, [droppedPin]);

  return <div ref={mapElementRef} className={`z-0 rounded-lg ${className}`} style={{ height: "100%", width: "100%" }} />;
}
