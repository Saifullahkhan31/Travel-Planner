import { Platform } from 'react-native';
import { PROVIDER_DEFAULT, PROVIDER_GOOGLE } from 'react-native-maps';
import type { MapType } from 'react-native-maps';

/**
 * Platform-aware map configuration.
 *
 * iOS   → Apple Maps (PROVIDER_DEFAULT), mapType "standard"
 * Android → Google Maps base (PROVIDER_GOOGLE) with mapType "none"
 *           so that an OSM UrlTile renders all the tiles instead —
 *           no Google Maps API key required.
 */
export const MAP_PROVIDER = Platform.OS === 'ios' ? PROVIDER_DEFAULT : PROVIDER_GOOGLE;
export const MAP_TYPE: MapType = Platform.OS === 'ios' ? 'standard' : 'none';

/** OpenStreetMap tile URL for the Android UrlTile fallback */
export const OSM_TILE_URL = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
