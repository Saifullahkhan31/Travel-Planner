import { Platform } from 'react-native';
import { PROVIDER_DEFAULT } from 'react-native-maps';
import type { MapType } from 'react-native-maps';

/**
 * Platform-aware map configuration.
 *
 * iOS     → Apple Maps (PROVIDER_DEFAULT), mapType "standard" via react-native-maps
 * Android → MapLibre GL via @maplibre/maplibre-react-native with OpenFreeMap tiles.
 *           No Google Maps API key required on Android.
 */

// iOS react-native-maps config (unchanged)
export const MAP_PROVIDER = PROVIDER_DEFAULT;
export const MAP_TYPE: MapType = 'standard'; // only used on iOS now

// MapLibre GL style URL for Android — free, no API key, no registration
// OpenFreeMap Liberty style (vector tiles, beautiful rendering)
export const MAPLIBRE_STYLE_URL = 'https://tiles.openfreemap.org/styles/liberty';

// Kept for any legacy reference; no longer used on Android
export const OSM_TILE_URL = 'https://a.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png';
