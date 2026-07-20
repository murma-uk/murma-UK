import { memo, useEffect } from "react";
import maplibregl from "maplibre-gl";
import { useMapContext } from "./MapLibreContainer";

export type MapControlPosition = "top-left" | "top-right" | "bottom-left" | "bottom-right";

export interface MapControlsProps {
  navigationPosition?: MapControlPosition;
  geolocatePosition?: MapControlPosition;
  scalePosition?: MapControlPosition;
  showNavigation?: boolean;
  showGeolocate?: boolean;
  showScale?: boolean;
  geolocateOptions?: maplibregl.GeolocateControlOptions;
  scaleOptions?: maplibregl.ScaleControlOptions;
}

function resolvePosition(position?: MapControlPosition) {
  return position ?? "top-right";
}

/**
 * Renders standard MapLibre controls against the current map context.
 */
function MapControls({
  navigationPosition = "top-right",
  geolocatePosition = "top-right",
  scalePosition = "bottom-left",
  showNavigation = true,
  showGeolocate = true,
  showScale = true,
  geolocateOptions,
  scaleOptions,
}: MapControlsProps) {
  const { map } = useMapContext();

  useEffect(() => {
    if (!map) {
      return;
    }

    const controls: Array<{ remove: () => void }> = [];

    if (showNavigation) {
      const navigationControl = new maplibregl.NavigationControl();
      map.addControl(navigationControl, resolvePosition(navigationPosition));
      controls.push(navigationControl);
    }

    if (showGeolocate) {
      const geolocateControl = new maplibregl.GeolocateControl(geolocateOptions);
      map.addControl(geolocateControl, resolvePosition(geolocatePosition));
      controls.push(geolocateControl);
    }

    if (showScale) {
      const scaleControl = new maplibregl.ScaleControl(scaleOptions);
      map.addControl(scaleControl, resolvePosition(scalePosition));
      controls.push(scaleControl);
    }

    return () => {
      controls.forEach((control) => control.remove());
    };
  }, [geolocateOptions, geolocatePosition, map, navigationPosition, scaleOptions, scalePosition, showGeolocate, showNavigation, showScale]);

  return null;
}

export default memo(MapControls);
