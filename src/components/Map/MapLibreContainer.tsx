import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

export interface MapContextValue {
  map: maplibregl.Map | null;
  isLoaded: boolean;
}

export interface MapLibreContainerProps {
  center?: [number, number];
  zoom?: number;
  style?: maplibregl.StyleSpecification | string;
  onMapLoad?: (map: maplibregl.Map) => void;
  children?: ReactNode;
  className?: string;
}

const MapContext = createContext<MapContextValue | undefined>(undefined);

function isValidLatLng(value: [number, number] | undefined): value is [number, number] {
  if (!value) {
    return false;
  }

  const [lng, lat] = value;
  return typeof lng === "number" && typeof lat === "number" && Number.isFinite(lng) && Number.isFinite(lat);
}

/**
 * Provides a MapLibre map instance and loading state to descendants.
 *
 * The container initializes a MapLibre map on mount, exposes it through
 * context for child components, and removes it on unmount to avoid leaks.
 */
export function MapLibreContainer({
  center = [0, 0],
  zoom = 2,
  style = "https://demotiles.maplibre.org/style.json",
  onMapLoad,
  children,
  className,
}: MapLibreContainerProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [map, setMap] = useState<maplibregl.Map | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (!containerRef.current || map) {
      return;
    }

    const nextMap = new maplibregl.Map({
      container: containerRef.current,
      style,
      center: isValidLatLng(center) ? [center[1], center[0]] : [0, 0],
      zoom,
      attributionControl: true,
    });

    setMap(nextMap);

    const handleLoad = () => {
      setIsLoaded(true);
      onMapLoad?.(nextMap);
    };

    nextMap.once("load", handleLoad);

    return () => {
      nextMap.off("load", handleLoad);
      nextMap.remove();
      setMap(null);
      setIsLoaded(false);
    };
  }, [center, map, onMapLoad, style, zoom]);

  const value = useMemo<MapContextValue>(
    () => ({
      map,
      isLoaded,
    }),
    [isLoaded, map]
  );

  return (
    <div className={className} data-testid="maplibre-container">
      <div ref={containerRef} className="h-full w-full" />
      <MapContext.Provider value={value}>{children}</MapContext.Provider>
    </div>
  );
}

/**
 * Access the active MapLibre map instance and its loaded state.
 */
export function useMapContext() {
  const context = useContext(MapContext);

  if (!context) {
    throw new Error("useMapContext must be used within a MapLibreContainer");
  }

  return context;
}

export default MapLibreContainer;
