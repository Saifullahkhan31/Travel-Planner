export async function fetchPreciseRoute(stops: { latitude: number; longitude: number }[]): Promise<{ latitude: number; longitude: number }[]> {
  // 1. Sanitize input stops
  const validStops = (stops || []).filter(
    s => s && typeof s.latitude === 'number' && typeof s.longitude === 'number' && !isNaN(s.latitude) && !isNaN(s.longitude) && s.latitude !== 0 && s.longitude !== 0
  );
  if (validStops.length < 2) return validStops.map(s => ({ latitude: s.latitude, longitude: s.longitude }));

  try {
    // OSRM requires coordinates in longitude,latitude format
    const coordsStr = validStops.map(s => `${s.longitude},${s.latitude}`).join(';');
    const url = `https://router.project-osrm.org/route/v1/driving/${coordsStr}?overview=simplified&geometries=geojson`;
    
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
      const coords = data.routes[0].geometry.coordinates;
      if (!coords || !Array.isArray(coords)) {
        console.warn("OSRM returned invalid geometry:", data.routes[0].geometry);
        return validStops.map(s => ({ latitude: s.latitude, longitude: s.longitude }));
      }
      
      // 2. Sanitize output coordinates (a single NaN will cause react-native-maps Polyline to disappear)
      const mapped = coords
        .map((coord: number[]) => ({
          latitude: Number(coord[1]),
          longitude: Number(coord[0]),
        }))
        .filter(c => !isNaN(c.latitude) && !isNaN(c.longitude) && c.latitude !== 0 && c.longitude !== 0);
        
      return mapped;
    } else {
      console.warn("OSRM returned non-Ok code or no routes:", data);
    }
  } catch (e) {
    console.warn("OSRM fetch failed:", e);
  }
  return validStops.map(s => ({ latitude: s.latitude, longitude: s.longitude })); // fallback
}

// Helper to calculate Haversine distance between two coordinates
function getDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371e3; // Earth radius in meters
  const rad = Math.PI / 180;
  const dLat = (lat2 - lat1) * rad;
  const dLon = (lon2 - lon1) * rad;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * rad) * Math.cos(lat2 * rad) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export function calculatePathDistances(path: { latitude: number; longitude: number }[]) {
  if (!path || path.length === 0) return { distances: [], totalDist: 0 };
  const distances = [0];
  let totalDist = 0;
  for (let i = 1; i < path.length; i++) {
    const d = getDistance(path[i - 1].latitude, path[i - 1].longitude, path[i].latitude, path[i].longitude);
    totalDist += d;
    distances.push(totalDist);
  }
  return { distances, totalDist };
}

export function getCoordAlongPath(
  path: { latitude: number; longitude: number }[],
  progress: number, // 0 to 1
  precalcDistances?: number[],
  precalcTotalDist?: number
) {
  if (path.length === 0) return null;
  if (path.length === 1) return path[0];
  if (progress <= 0) return path[0];
  if (progress >= 1) return path[path.length - 1];

  let distances = precalcDistances;
  let totalDist = precalcTotalDist;

  if (!distances || totalDist === undefined) {
    const calc = calculatePathDistances(path);
    distances = calc.distances;
    totalDist = calc.totalDist;
  }

  const targetDist = totalDist * progress;

  for (let i = 0; i < distances.length - 1; i++) {
    if (targetDist >= distances[i] && targetDist <= distances[i + 1]) {
      const segDist = distances[i + 1] - distances[i];
      const fraction = segDist === 0 ? 0 : (targetDist - distances[i]) / segDist;
      
      const from = path[i];
      const to = path[i + 1];
      
      return {
        latitude: from.latitude + (to.latitude - from.latitude) * fraction,
        longitude: from.longitude + (to.longitude - from.longitude) * fraction,
      };
    }
  }

  return path[path.length - 1];
}

// Returns the array of coordinates from the start up to the exact progress distance
export function getPathUpToProgress(
  path: { latitude: number; longitude: number }[],
  progress: number, // 0 to 1
  precalcDistances?: number[],
  precalcTotalDist?: number
) {
  if (path.length === 0) return [];
  if (path.length === 1) return path;
  if (progress <= 0) return [path[0]];
  if (progress >= 1) return path;

  let distances = precalcDistances;
  let totalDist = precalcTotalDist;

  if (!distances || totalDist === undefined) {
    const calc = calculatePathDistances(path);
    distances = calc.distances;
    totalDist = calc.totalDist;
  }

  const targetDist = totalDist * progress;
  let slicedPath = [];

  for (let i = 0; i < distances.length - 1; i++) {
    slicedPath.push(path[i]);
    if (targetDist >= distances[i] && targetDist <= distances[i + 1]) {
      const segDist = distances[i + 1] - distances[i];
      const fraction = segDist === 0 ? 0 : (targetDist - distances[i]) / segDist;
      
      const from = path[i];
      const to = path[i + 1];
      
      const exactCoord = {
        latitude: from.latitude + (to.latitude - from.latitude) * fraction,
        longitude: from.longitude + (to.longitude - from.longitude) * fraction,
      };
      slicedPath.push(exactCoord);
      return slicedPath;
    }
  }

  return path;
}
