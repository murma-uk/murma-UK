import { render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import maplibregl from "maplibre-gl";
import { MapLibreContainer, useMapContext } from "./MapLibreContainer";

const removeMock = vi.fn();
const onMock = vi.fn();
const offMock = vi.fn();
const onceMock = vi.fn();

vi.mock("maplibre-gl", () => ({
  default: {
    Map: vi.fn().mockImplementation(() => ({
      addControl: vi.fn(),
      remove: removeMock,
      getCenter: () => ({ lng: 0, lat: 0 }),
      getZoom: () => 5,
      on: onMock,
      off: offMock,
      once: onceMock,
      resize: vi.fn(),
      removeControl: vi.fn(),
    })),
    NavigationControl: vi.fn(),
    GeolocateControl: vi.fn(),
  },
}));

function TestConsumer() {
  const context = useMapContext();
  return <div data-testid="context-status">{context.isLoaded ? "loaded" : "loading"}</div>;
}

describe("MapLibreContainer", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("renders a map container, exposes context, and cleans up on unmount", async () => {
    const { unmount } = render(
      <MapLibreContainer center={[51.5, -0.12]} zoom={10}>
        <TestConsumer />
      </MapLibreContainer>
    );

    const container = screen.getByTestId("maplibre-container");
    expect(container).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByTestId("context-status").textContent).toBe("loaded");
    });

    expect(maplibregl.Map).toHaveBeenCalled();

    unmount();
    expect(removeMock).toHaveBeenCalled();
  });
});
