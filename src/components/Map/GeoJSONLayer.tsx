import { useEffect, useMemo } from "react";
import type { GeoJSON } from "geojson";
import { useMapContext } from "./MapLibreContainer";

export interface GeoJSONLayerProps {
  id: string;
  data: GeoJSON;
  color?: string;
  opacity?: number;
  onClick?: (feature: GeoJSON.Feature | GeoJSON.FeatureCollection | null, event?: unknown) => void;
  style?: Record<string, unknown>;
}

function resolveStyle(id: string, color: string, opacity: number, style?: Record<string, unknown>) {
  return {
    id,
    type: "fill" as const,
    source: id,
    paint: {
      "fill-color": color,
      "fill-opacity": opacity,
      ...((style?.paint as Record<string, unknown> | undefined) ?? {}),
    },
    ...style,
  };
}

/**
 * Renders a GeoJSON-backed MapLibre layer using the active map context.
 */
export function GeoJSONLayer({
  id,
  data,
  color = "#2563eb",
  opacity = 0.35,
  onClick,
  style,
}: GeoJSONLayerProps) {
  const { map } = useMapContext();

  const layerStyle = useMemo(() => resolveStyle(id, color, opacity, style), [color, id, opacity, style]);

  useEffect(() => {
    if (!map) {
      return;
    }

    if (!map.getSource(id)) {
      map.addSource(id, { type: "geojson", data });
    }

    if (!map.getLayer(id)) {
      map.addLayer(layerStyle);
    } else {
      map.setPaintProperty(id, "fill-color", color);
      map.setPaintProperty(id, "fill-opacity", opacity);
    }

    const handleClick = (event: unknown) => {
      const feature = (event as { features?: Array<GeoJSON.Feature> }).features?.[0] ?? null;
      onClick?.(feature as GeoJSON.Feature | null, event);
    };

    if (onClick) {
      map.on("click", id, handleClick as never);
    }

    return () => {
      if (onClick) {
        map.off("click", id, handleClick as never);
      }
      if (map.getLayer(id)) {
        map.removeLayer(id);
      }
      if (map.getSource(id)) {
        map.removeSource(id);
      }
    };
  }, [color, data, id, layerStyle, map, onClick, opacity]);

  useEffect(() => {
    if (!map?.getSource(id)) {
      return;
    }

    const source = map.getSource(id);
    if (source && "setData" in source) {
      (source as { setData: (geojson: GeoJSON) => void }).setData(data);
    }
  }, [data, id, map]);

  return null;
}

export default GeoJSONLayer;
