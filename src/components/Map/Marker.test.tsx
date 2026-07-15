import { render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import maplibregl from "maplibre-gl";
import { Marker } from "./Marker";

const addToMock = vi.fn();
const setLngLatMock = vi.fn();
const setPopupMock = vi.fn();
const removeMock = vi.fn();
const onMock = vi.fn();
const offMock = vi.fn();

vi.mock("./MapLibreContainer", () => ({
  useMapContext: () => ({ map: { on: vi.fn(), off: vi.fn() }, isLoaded: true }),
}));

vi.mock("maplibre-gl", () => ({
  default: {
    Marker: vi.fn().mockImplementation(() => ({
      addTo: addToMock,
      setLngLat: setLngLatMock,
      setPopup: setPopupMock,
      remove: removeMock,
      on: onMock,
      off: offMock,
    })),
    Popup: vi.fn().mockImplementation(() => ({
      addTo: vi.fn(),
      remove: vi.fn(),
    })),
  },
}));

describe("Marker", () => {
  it("creates a marker using the shared map context", () => {
    render(<Marker position={[-0.1, 51.5]} title="Example" color="#ff0000" icon="X" />);

    expect(maplibregl.Marker).toHaveBeenCalled();
    expect(setLngLatMock).toHaveBeenCalledWith([-0.1, 51.5]);
    expect(setPopupMock).toHaveBeenCalled();
    expect(addToMock).toHaveBeenCalled();
  });
});
