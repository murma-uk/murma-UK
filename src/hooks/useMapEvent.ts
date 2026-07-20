import { useEffect, useRef } from "react";
import type maplibregl from "maplibre-gl";
import { useMapContext } from "@/components/Map/MapLibreContainer";

export type MapEventName = keyof maplibregl.MapEventType;

/**
 * Binds a MapLibre event handler to the active map and cleans it up automatically.
 */
export function useMapEvent<TEvent extends MapEventName>(
  eventName: TEvent,
  handler: (map: maplibregl.Map, event: maplibregl.MapMouseEvent | maplibregl.MapTouchEvent | maplibregl.MapWheelEvent) => void
) {
  const { map } = useMapContext();
  const handlerRef = useRef(handler);
  handlerRef.current = handler;

  useEffect(() => {
    if (!map) {
      return;
    }

    const wrappedHandler = (event: maplibregl.MapMouseEvent | maplibregl.MapTouchEvent | maplibregl.MapWheelEvent) => {
      handlerRef.current(map, event);
    };

    map.on(eventName as string, wrappedHandler as maplibregl.MapEventType[typeof eventName]);

    return () => {
      map.off(eventName as string, wrappedHandler as maplibregl.MapEventType[typeof eventName]);
    };
  }, [eventName, map]);
}

export default useMapEvent;
