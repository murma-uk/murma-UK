import { useEffect, useMemo, useRef } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { useCategories, type RequestCategory } from "@/lib/categories";

const DEFAULT_CENTER: [number, number] = [51.5, -0.12]; // London, UK
const FALLBACK_COLOR = "hsl(210, 100%, 50%)";
const OSM_STYLE_URL = "https://demotiles.maplibre.org/style.json";

interface MarkerHandle {
  marker: maplibregl.Marker;
  cleanup: () => void;
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

function isValidLatLng(lat: unknown, lng: unknown): lat is number {
  return typeof lat === "number" && typeof lng === "number" && Number.isFinite(lat) && Number.isFinite(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180;
}

function getSafeCenter(center: [number, number] | undefined): [number, number] {
  if (center && isValidLatLng(center[0], center[1])) {
    return center;
  }
  return DEFAULT_CENTER;
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function toMapLibreCenter(center: [number, number]): [number, number] {
  return [center[1], center[0]];
}

function createCategoryElement(color: string): HTMLDivElement {
  const element = document.createElement("div");
  element.className = "custom-marker";
  element.style.width = "28px";
  element.style.height = "28px";
  element.style.borderRadius = "50% 50% 50% 0";
  element.style.background = color;
  element.style.transform = "rotate(-45deg)";
  element.style.border = "2px solid white";
  element.style.boxShadow = "0 2px 6px rgba(0,0,0,0.3)";
  element.style.position = "relative";
  element.style.cursor = "pointer";
  element.innerHTML = `
    <div style="
      width: 10px;
      height: 10px;
      border-radius: 50%;
      background: white;
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
    " />
  `;
  return element;
}

function createBusinessElement(): HTMLDivElement {
  const element = document.createElement("div");
  element.className = "custom-marker";
  element.style.width = "32px";
  element.style.height = "32px";
  element.style.borderRadius = "6px";
  element.style.background = "hsl(var(--primary))";
  element.style.border = "2px solid white";
  element.style.boxShadow = "0 2px 8px rgba(0,0,0,0.35)";
  element.style.display = "flex";
  element.style.alignItems = "center";
  element.style.justifyContent = "center";
  element.style.cursor = "pointer";
  element.innerHTML = `
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
      <polyline points="9 22 9 12 15 12 15 22"></polyline>
    </svg>
  `;
  return element;
}

function createDroppedPinElement(): HTMLDivElement {
  const element = document.createElement("div");
  element.style.width = "18px";
  element.style.height = "18px";
  element.style.borderRadius = "999px";
  element.style.background = "#f43f5e";
  element.style.border = "2px solid white";
  element.style.boxShadow = "0 2px 8px rgba(0,0,0,0.35)";
  return element;
}

function createMarkerWithPopup({
  map,
  position,
  element,
  popupHtml,
  onClick,
}: {
  map: maplibregl.Map;
  position: [number, number];
  element: HTMLDivElement;
  popupHtml: string;
  onClick?: () => void;
}): MarkerHandle {
  const marker = new maplibregl.Marker({
    element,
    anchor: "bottom",
  });

  const popup = new maplibregl.Popup({ offset: 12 }).setHTML(popupHtml);
  // DEBUG: Log position being set
  console.log("[SETLNGLAT DEBUG] Calling marker.setLngLat with position:", position);
  marker.setLngLat(position);
  marker.setPopup(popup);

  const handleClick = () => {
    popup.setLngLat(position);
    popup.addTo(map);
    onClick?.();
  };

  element.addEventListener("click", handleClick);
  marker.addTo(map);

  return {
    marker,
    cleanup: () => {
      element.removeEventListener("click", handleClick);
      popup.remove();
      marker.remove();
    },
  };
}

/**
 * Renders a MapLibre-based map for requests, businesses, and pin interactions.
 */
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
  const mapRef = useRef<maplibregl.Map | null>(null);
  const requestMarkersRef = useRef<MarkerHandle[]>([]);
  const businessMarkersRef = useRef<MarkerHandle[]>([]);
  const pinMarkerRef = useRef<MarkerHandle | null>(null);
  const onMapClickRef = useRef(onMapClick);
  const onCenterChangeRef = useRef(onCenterChange);
  const pinModeRef = useRef(pinMode);

  onMapClickRef.current = onMapClick;
  onCenterChangeRef.current = onCenterChange;
  pinModeRef.current = pinMode;

  const { data: categories } = useCategories();
  const colorBySlug = useMemo(() => {
    const nextMap = new Map<string, string>();
    (categories ?? []).forEach((category) => nextMap.set(category.slug, category.color));
    return nextMap;
  }, [categories]);

  useEffect(() => {
    if (!mapElementRef.current || mapRef.current) {
      return;
    }

    const initialCenter = toMapLibreCenter(getSafeCenter(center));
    const initialZoom = Number.isFinite(zoom) ? zoom : 6;

    const map = new maplibregl.Map({
      container: mapElementRef.current,
      style: OSM_STYLE_URL,
      center: initialCenter,
      zoom: initialZoom,
      attributionControl: true,
    });

    mapRef.current = map;

    // DEBUG: Log map center initialization
    console.log("[MAPLIBRE DEBUG] Map initialized");
    console.log("[MAPLIBRE DEBUG] Input center prop:", center);
    console.log("[MAPLIBRE DEBUG] After getSafeCenter:", getSafeCenter(center));
    console.log("[MAPLIBRE DEBUG] After toMapLibreCenter:", initialCenter);
    console.log("[MAPLIBRE DEBUG] Map.getCenter():", map.getCenter());
    console.log("[MAPLIBRE DEBUG] Zoom level:", initialZoom);

    map.on("click", (event) => {
      if (pinModeRef.current && onMapClickRef.current) {
        onMapClickRef.current(event.lngLat.lat, event.lngLat.lng);
      }
    });

    map.on("moveend", () => {
      if (!onCenterChangeRef.current) {
        return;
      }
      const centerValue = map.getCenter();
      onCenterChangeRef.current(centerValue.lat, centerValue.lng, map.getZoom());
    });

    let lastWidth = 0;
    let lastHeight = 0;
    const resizeObserver = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) {
        return;
      }
      const { width, height } = entry.contentRect;
      if (width === lastWidth && height === lastHeight) {
        return;
      }
      lastWidth = width;
      lastHeight = height;
      if (width === 0 || height === 0) {
        return;
      }
      map.resize();
      if (lastWidth === 0 || lastHeight === 0) {
        map.jumpTo({ center: map.getCenter(), zoom: map.getZoom() });
      }
    });
    resizeObserver.observe(mapElementRef.current);

    return () => {
      resizeObserver.disconnect();
      requestMarkersRef.current.forEach((marker) => marker.cleanup());
      businessMarkersRef.current.forEach((marker) => marker.cleanup());
      pinMarkerRef.current?.cleanup();
      requestMarkersRef.current = [];
      businessMarkersRef.current = [];
      pinMarkerRef.current = null;
      map.remove();
      mapRef.current = null;
    };
  }, [center, zoom]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) {
      return;
    }
    map.getCanvas().style.cursor = pinMode ? "crosshair" : "";
  }, [pinMode]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) {
      return;
    }

    pinMarkerRef.current?.cleanup();
    pinMarkerRef.current = null;

    if (droppedPin && isValidLatLng(droppedPin.lat, droppedPin.lng)) {
      pinMarkerRef.current = createMarkerWithPopup({
        map,
        position: [droppedPin.lat, droppedPin.lng],
        element: createDroppedPinElement(),
        popupHtml: `<div class="font-heading"><strong>Drop pin</strong></div>`,
      });
    }
  }, [droppedPin]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) {
      return;
    }

    const nextCenter = toMapLibreCenter(getSafeCenter(center));
    const nextZoom = Number.isFinite(zoom) ? zoom : 6;

    map.jumpTo({ center: nextCenter, zoom: nextZoom });
  }, [center, zoom]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) {
      return;
    }

    requestMarkersRef.current.forEach((marker) => marker.cleanup());
    requestMarkersRef.current = [];

    businesses.forEach((business) => {
      if (!isValidLatLng(business.lat, business.lng)) {
        return;
      }

      const marker = createMarkerWithPopup({
        map,
        position: [business.lat, business.lng],
        element: createBusinessElement(),
        popupHtml: `
          <div class="font-heading">
            <strong>${escapeHtml(business.name)}</strong><br />
            <span class="text-sm capitalize">${escapeHtml(business.business_type.replace(/_/g, " "))}</span><br />
            <span class="text-sm">${escapeHtml(business.town)} · ${business.request_count} request${business.request_count !== 1 ? "s" : ""}</span>
          </div>
        `,
        onClick: () => onBusinessClick?.(business.id),
      });

      businessMarkersRef.current.push(marker);
    });

    requests.forEach((request) => {
      if (!isValidLatLng(request.lat, request.lng)) {
        return;
      }

      // DEBUG: Log request coordinates
      console.log(`[MARKER DEBUG] "${request.title}" - DB coords [lat=${request.lat}, lng=${request.lng}] -> position=[${request.lat}, ${request.lng}]`);

      const marker = createMarkerWithPopup({
        map,
        position: [request.lat, request.lng],
        element: createCategoryElement(colorBySlug.get(request.category) ?? FALLBACK_COLOR),
        popupHtml: `
          <div class="font-heading">
            <strong>${escapeHtml(request.title)}</strong><br />
            <span class="text-sm">${escapeHtml(request.town)} · ${request.upvote_count} voices</span>
          </div>
        `,
        onClick: () => onMarkerClick?.(request.id),
      });

      requestMarkersRef.current.push(marker);
    });
  }, [requests, businesses, onMarkerClick, onBusinessClick, colorBySlug]);

  return <div ref={mapElementRef} className={`z-0 rounded-lg ${className}`} style={{ height: "100%", width: "100%" }} />;
}
