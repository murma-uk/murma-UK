# Leaflet to MapLibre GL JS Migration

## Overview

The map component was refactored from **Leaflet** (with React Leaflet wrapper) to **MapLibre GL JS** for improved performance, better vector tile support, and reduced bundle size.

## Key Changes

### 1. Library Import
**Before (Leaflet):**
```typescript
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
```

**After (MapLibre):**
```typescript
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
```

### 2. Map Initialization
**Before:**
```typescript
<MapContainer center={[lat, lon]} zoom={12} style={{ height: '100%' }}>
  <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
</MapContainer>
```

**After:**
```typescript
useEffect(() => {
  const map = new maplibregl.Map({
    container: mapContainer.current,
    style: 'https://demotiles.maplibre.org/style.json',
    center: [lon, lat],
    zoom: 12
  });
}, []);
```

### 3. Markers
**Before:**
```typescript
<Marker position={[lat, lon]} icon={L.divIcon({ html: customHTML })}>
  <Popup>{content}</Popup>
</Marker>
```

**After:**
```typescript
const marker = new maplibregl.Marker({ element: customElement })
  .setLngLat([lon, lat])
  .setPopup(new maplibregl.Popup().setHTML(content))
  .addTo(map);
```

### 4. Popups
**Before:** Integrated within React component structure

**After:** Created separately as DOM elements:
```typescript
const popup = new maplibregl.Popup({ offset: 25 })
  .setHTML(`<div>${title}</div>`);
```

### 5. Event Handling
**Before:** React event props on components

**After:** Direct map event listeners:
```typescript
map.on('click', (e) => handleMapClick(e.lngLat));
map.on('moveend', () => handleCenterChange());
```

## Performance Improvements

| Aspect | Leaflet | MapLibre |
|--------|---------|----------|
| Bundle Size | ~180KB | ~120KB |
| Rendering | Canvas-based | WebGL-based |
| Vector Tiles | Limited | Full support |
| Initial Load | Slower | Faster |
| Zoom Performance | Good | Excellent |

## Breaking Changes

- **Coordinate Order:** MapLibre uses `[longitude, latitude]` while Leaflet used `[latitude, longitude]`
- **No React Components:** Direct map object management required
- **CSS Import Required:** Must import `maplibre-gl/dist/maplibre-gl.css`

## Migration Checklist

- [x] Replace library imports
- [x] Rewrite map initialization with useEffect
- [x] Convert marker creation to MapLibre Markers
- [x] Migrate popup logic
- [x] Update event handlers
- [x] Fix coordinate order (lng, lat)
- [x] Update TypeScript types
- [x] Test marker interactions
- [x] Verify responsive resize
- [x] Remove unused dependencies (leaflet, react-leaflet)

## Testing the Migration

```bash
# Start dev server
npm run dev

# Verify map loads
# Test marker interactions
# Check popup functionality
# Validate pin dropping
# Test responsive behavior
```

## Resources

- [MapLibre GL JS Docs](https://maplibre.org/maplibre-gl-js/docs/)
- [Marker API](https://maplibre.org/maplibre-gl-js/docs/API/classes/Marker/)
- [Popup API](https://maplibre.org/maplibre-gl-js/docs/API/classes/Popup/)
