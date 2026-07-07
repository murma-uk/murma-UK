/**
 * Calculate distance between two points using Haversine formula
 * Returns distance in kilometers
 */
export function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export function convertKmToMiles(km: number): number {
  return km * 0.621371;
}

/**
 * Get nearby points within radius and/or limit
 * Returns items sorted by distance (closest first)
 * Respects both radius and limit - whichever is more restrictive
 */
export function getNearbyPoints<T extends { lat: number; lng: number }>(
  points: T[],
  centerLat: number,
  centerLng: number,
  options: {
    radiusKm?: number;
    limit?: number;
  } = {}
): (T & { distance_km: number })[] {
  const { radiusKm = 1.6, limit = 10 } = options;

  const withDistance = points
    .map((point) => ({
      ...point,
      distance_km: calculateDistance(centerLat, centerLng, point.lat, point.lng),
    }))
    .filter((point) => point.distance_km <= radiusKm)
    .sort((a, b) => a.distance_km - b.distance_km)
    .slice(0, limit);

  return withDistance;
}
