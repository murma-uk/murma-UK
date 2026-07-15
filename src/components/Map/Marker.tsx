import { useEffect, useMemo, useRef, type ReactNode } from "react";
import maplibregl from "maplibre-gl";
import { useMapContext } from "./MapLibreContainer";

export interface MarkerProps {
  /** Position in [lng, lat] order. */
  position: [number, number];
  /** Optional title shown inside the popup. */
  title?: string;
  /** Marker color for the visual marker element. */
  color?: string;
  /** Optional click handler. */
  onClick?: () => void;
  /** Optional custom icon content. */
  icon?: ReactNode;
}

function createMarkerElement(color: string, icon?: ReactNode) {
  const element = document.createElement("div");
  element.className = "flex h-8 w-8 items-center justify-center rounded-full border-2 border-white shadow-md";
  element.style.backgroundColor = color;
  element.style.color = "#fff";
  element.style.cursor = "pointer";
  element.innerHTML = icon ? `<span>${String(icon)}</span>` : "●";
  return element;
}

/**
 * Renders a MapLibre marker tied to the nearest map context.
 *
 * The marker creates a popup, wires click handling, and removes itself from the
 * map when the component unmounts.
 */
export function Marker({
  position,
  title,
  color = "#2563eb",
  onClick,
  icon,
}: MarkerProps) {
  const { map } = useMapContext();
  const markerRef = useRef<maplibregl.Marker | null>(null);
  const popupRef = useRef<maplibregl.Popup | null>(null);

  const resolvedPosition = useMemo(() => position, [position]);

  useEffect(() => {
    if (!map) {
      return;
    }

    const popup = new maplibregl.Popup({ offset: 12 }).setHTML(
      title ? `<strong>${title}</strong>` : ""
    );

    const marker = new maplibregl.Marker({
      element: createMarkerElement(color, icon),
      anchor: "bottom",
    });

    marker.setLngLat(resolvedPosition);
    marker.setPopup(popup);
    marker.addTo(map);

    markerRef.current = marker;
    popupRef.current = popup;

    const handleClick = () => {
      popup.addTo(map);
      onClick?.();
    };

    marker.on("click", handleClick);

    return () => {
      marker.off("click", handleClick);
      popup.remove();
      marker.remove();
      markerRef.current = null;
      popupRef.current = null;
    };
  }, [color, icon, map, onClick, resolvedPosition, title]);

  return null;
}

export default Marker;
