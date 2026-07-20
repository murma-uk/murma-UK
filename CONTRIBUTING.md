# Contributing Guide

Thank you for contributing to Murma! This guide covers development practices, code standards, and specific guidelines for working with the map component.

## Development Setup

```bash
# Clone the repository
git clone https://github.com/murma-uk/murma-UK.git
cd murma-UK

# Install dependencies
npm install

# Start development server
npm run dev
```

## Code Standards

### TypeScript
- Use strict mode (enabled by default)
- Add JSDoc comments for exported functions/components
- Define types for all props using interfaces
- Avoid `any` types

### Component Structure
```typescript
/**
 * Brief component description
 * @param {ComponentProps} props - Component props
 * @returns {JSX.Element} The rendered component
 */
export function MyComponent({ prop1, prop2 }: ComponentProps): JSX.Element {
  // Implementation
}
```

### Styling
- Use Tailwind CSS classes
- Prefer utility classes over inline styles
- Maintain consistent spacing and sizing

## Map Development Guidelines

### When Modifying MapView.tsx

**1. Understand the Architecture**
- Read [MAPLIBRE.md](./MAPLIBRE.md) first
- Review marker system and event handling
- Check coordinate ordering (longitude, latitude)

**2. Common Tasks**

**Adding a new marker type:**
```typescript
const marker = new maplibregl.Marker({
  element: createCustomMarkerElement(data),
  anchor: 'bottom'
})
  .setLngLat([lng, lat])
  .addTo(map);
```

**Listening to map events:**
```typescript
map.on('click', (e) => {
  console.log('Clicked at:', e.lngLat);
});

map.on('moveend', () => {
  const center = map.getCenter();
  const zoom = map.getZoom();
});
```

**3. Testing Map Changes**
- Test on desktop (Chrome, Firefox, Safari)
- Test on mobile (iOS Safari, Chrome Android)
- Verify responsive behavior at different viewport sizes
- Test all marker interactions (hover, click, popup)

### MapLibre-Specific Tips

- Remember: MapLibre uses `[longitude, latitude]` order
- Vector tiles require a valid style URL
- Markers must have anchor points set correctly
- Always add CSS import: `import 'maplibre-gl/dist/maplibre-gl.css';`
- Use `map.on('load')` before adding layers/markers

## Commit Messages

Follow conventional commits format:

```
type(scope): description

feat(map): add marker clustering
fix(map): resolve popup positioning issue
docs(map): update architecture guide
refactor(mapview): optimize marker rendering
```

**Types:** `feat`, `fix`, `docs`, `refactor`, `test`, `chore`

## Pull Request Process

1. Create a feature branch: `git checkout -b feature/your-feature`
2. Make changes following code standards
3. Test thoroughly (dev server, build, visual tests)
4. Commit with descriptive messages
5. Push to GitHub: `git push origin feature/your-feature`
6. Open a pull request with clear description

## Resources

- [TypeScript Docs](https://www.typescriptlang.org/)
- [React Docs](https://react.dev/)
- [Tailwind CSS](https://tailwindcss.com/)
- [MapLibre GL JS](https://maplibre.org/maplibre-gl-js/docs/)
- [Migration Guide from Leaflet](./MIGRATION_NOTES.md)

## Questions?

Open an issue or contact the maintainers. Happy contributing!
