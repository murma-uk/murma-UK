# MapLibre GL JS Architecture Guide

## Overview

The Murma map component uses **MapLibre GL JS**, a high-performance, open-source vector mapping library. It renders interactive maps with custom markers, popups, and real-time interactions for displaying requests and businesses.

## Component Structure

### MapView.tsx
Located in `src/components/MapView.tsx`, this is the main map component with the following responsibilities:

**Props:**
```typescript
interface MapViewProps {
  requests: Request[];           // Wishlist requests to display
  businesses: Business[];        // Business locations to display
  onMarkerClick: (id: string) => void;      // Request marker click handler
  onBusinessClick: (id: string) => void;    // Business marker click handler
  onMapClick: (latlng: LatLng) => void;     // Map click for pin dropping
  onCenterChange: (center: LatLng) => void; // Center changed callback
  pinMode: boolean;              // Pin drop mode active
  droppedPin?: LatLng;          // Recently dropped pin location
  center?: LatLng;              // Map center
  zoom?: number;                // Map zoom level
  className?: string;           // Container CSS class
}
```

**Key Features:**
- Request markers with category-colored teardrop icons
- Business markers with house-shaped icons
- Interactive popups showing location details
- Custom pin dropping with crosshair cursor
- Responsive design with ResizeObserver
- Smooth zoom/pan animations

## Map Initialization

MapLibre GL JS requires a DOM element and style URL:

```typescript
const map = new maplibregl.Map({
  container: 'map',
  style: 'https://demotiles.maplibre.org/style.json',
  center: [longitude, latitude],
  zoom: 12,
  antialias: true
});
```

**Style URL:** Uses OpenStreetMap vector tiles via the MapLibre demo server.

## Marker System

### Request Markers
Teardrop-shaped markers colored by category using `colorBySlug()`:

```typescript
const marker = new maplibregl.Marker({
  element: createRequestMarkerElement(request),
  anchor: 'bottom'
})
  .setLngLat([lon, lat])
  .setPopup(popup)
  .addTo(map);
```

### Business Markers
Square house-icon markers:

```typescript
const marker = new maplibregl.Marker({
  element: createBusinessMarkerElement(business),
  anchor: 'center'
})
  .setLngLat([lon, lat])
  .addTo(map);
```

## Event Handling

**Map Click for Pin Dropping:**
```typescript
map.on('click', (e) => {
  if (pinMode) {
    onMapClick({ lat: e.lngLat.lat, lng: e.lngLat.lng });
  }
});
```

**Center/Zoom Changes:**
```typescript
map.on('moveend', () => {
  const center = map.getCenter();
  onCenterChange({ lat: center.lat, lng: center.lng });
});
```

## Performance Considerations

- Markers are added/removed dynamically based on `requests` and `businesses` props
- ResizeObserver handles responsive map resizing
- Popups are lazy-loaded only when markers are clicked
- Vector tiles enable smooth pan/zoom without flickering

## Browser Compatibility

MapLibre GL JS requires WebGL support:
- Chrome/Edge 90+
- Firefox 87+
- Safari 15+
- Mobile browsers (iOS Safari 15+, Chrome Android)

## Dependencies

```json
{
  "maplibre-gl": "^4.x.x"
}
```

CSS must be imported:
```typescript
import 'maplibre-gl/dist/maplibre-gl.css';
```

## See Also

- [Migration Guide](./MIGRATION_NOTES.md) - Leaflet to MapLibre migration details
- [Contributing Guide](./CONTRIBUTING.md) - Map development guidelines
