/**
 * AndroidMapView.tsx
 *
 * Safe platform-specific map wrapper for Android.
 * - In Production APK: Uses @maplibre/maplibre-react-native with OpenFreeMap vector tiles.
 * - In Expo Go: Gracefully falls back to react-native-maps so the app never crashes.
 */
import React, { forwardRef, useImperativeHandle, useRef, ReactNode } from 'react';
import { StyleSheet, View, Text, Platform } from 'react-native';
import RNMapView, { Marker as RNMarker, Polyline as RNPolyline, PROVIDER_DEFAULT } from 'react-native-maps';
// Duplicate React import removed – using named import above

// Free vector tile style — OpenFreeMap Liberty (no API key, no registration)
export const MAPLIBRE_STYLE_URL = 'https://tiles.openfreemap.org/styles/liberty';

export interface Coordinate {
  latitude: number;
  longitude: number;
}

export interface Region {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
}

export interface AndroidMapRef {
  animateCamera: (opts: { center: Coordinate }, opts2?: { duration?: number }) => void;
  fitToCoordinates: (coords: Coordinate[], opts?: { edgePadding?: { top: number; right: number; bottom: number; left: number }; animated?: boolean }) => void;
  animateToRegion: (region: Region, duration?: number) => void;
}

export interface AndroidMapViewProps {
  style?: object;
  initialRegion?: Region;
  scrollEnabled?: boolean;
  zoomEnabled?: boolean;
  rotateEnabled?: boolean;
  pitchEnabled?: boolean;
  onPress?: () => void;
  onPanDrag?: () => void;
  children?: ReactNode;
}

export interface MarkerViewProps {
  coordinate: [number, number] | Coordinate;
  anchor?: string;
  children?: ReactNode;
}

// Safely load MapLibreGL (fails gracefully in Expo Go)
let MapLibreComponents: any = null;
let mapLibreLoadError: any = null;
try {
  const MapLibreModule = require('@maplibre/maplibre-react-native');
  if (MapLibreModule && MapLibreModule.Map) {
    MapLibreComponents = MapLibreModule;
  }
} catch (err) {
  // Running inside Expo Go — native MapLibre module is not pre-compiled into Expo Go app
  mapLibreLoadError = err;
  console.error('Failed to load MapLibre module:', err);
  MapLibreComponents = null;
}

export const MarkerView: React.FC<MarkerViewProps> = ({ coordinate, anchor = 'center', children }) => {
  if (MapLibreComponents?.ViewAnnotation) {
    const ViewAnnotation = MapLibreComponents.ViewAnnotation;
    const lngLat: [number, number] = Array.isArray(coordinate)
      ? coordinate
      : [coordinate.longitude, coordinate.latitude];
    return (
      <ViewAnnotation lngLat={lngLat} anchor={anchor}>
        {children}
      </ViewAnnotation>
    );
  }
  // Expo Go fallback -> react-native-maps Marker
  const coordObj: Coordinate = Array.isArray(coordinate)
    ? { longitude: coordinate[0], latitude: coordinate[1] }
    : coordinate;
  return (
    <RNMarker coordinate={coordObj} anchor={{ x: 0.5, y: 0.5 }}>
      {children}
    </RNMarker>
  );
};

export const ShapeSource: React.FC<any> = ({ children, data }) => {
  if (MapLibreComponents?.GeoJSONSource) {
    const GeoJSONSource = MapLibreComponents.GeoJSONSource;
    return <GeoJSONSource id="routeLine" data={data}>{children}</GeoJSONSource>;
  }
  // Fallback for Expo Go -> parse coords for RNPolyline if available
  const feature = data?.features?.[0];
  if (feature?.geometry?.coordinates) {
    const coords = feature.geometry.coordinates.map((c: [number, number]) => ({
      longitude: c[0],
      latitude: c[1],
    }));
    return <RNPolyline coordinates={coords} strokeColor="#3B82F6" strokeWidth={4} />;
  }
  return null;
};

export const Layer: React.FC<any> = (props) => {
  if (MapLibreComponents?.Layer) {
    const MapLayer = MapLibreComponents.Layer;
    return <MapLayer {...props} />;
  }
  return null;
};

/** Convert lat/lon coordinate to MapLibre [lon, lat] tuple */
export function toLonLat(c: Coordinate): [number, number] {
  return [c.longitude, c.latitude];
}

/** Approximate zoom level from latitudeDelta */
function regionToZoom(region: Region): number {
  return Math.max(0, Math.min(20, Math.log2(360 / region.latitudeDelta)));
}

const AndroidMapViewInner = forwardRef<AndroidMapRef, AndroidMapViewProps>(
  (props, ref) => {
    const {
      style,
      initialRegion,
      scrollEnabled = true,
      zoomEnabled = true,
      rotateEnabled = true,
      pitchEnabled = true,
      onPress,
      onPanDrag,
      children,
    } = props;

    const cameraRef = useRef<any>(null);
    const rnMapRef = useRef<RNMapView>(null);

    useImperativeHandle(ref, () => ({
      animateCamera(opts, opts2) {
        if (MapLibreComponents) {
          cameraRef.current?.setCamera({
            centerCoordinate: toLonLat(opts.center),
            animationDuration: opts2?.duration ?? 1000,
          });
        } else {
          rnMapRef.current?.animateCamera({ center: opts.center }, { duration: opts2?.duration ?? 1000 });
        }
      },
      fitToCoordinates(coords, opts) {
        if (!coords || coords.length === 0) return;
        if (MapLibreComponents) {
          const pad = opts?.edgePadding ?? { top: 80, right: 40, bottom: 80, left: 40 };
          const lons = coords.map(c => c.longitude);
          const lats = coords.map(c => c.latitude);
          cameraRef.current?.setCamera({
            bounds: {
              ne: [Math.max(...lons), Math.max(...lats)],
              sw: [Math.min(...lons), Math.min(...lats)],
              paddingTop: pad.top,
              paddingRight: pad.right,
              paddingBottom: pad.bottom,
              paddingLeft: pad.left,
            },
            animationDuration: opts?.animated !== false ? 600 : 0,
          });
        } else {
          rnMapRef.current?.fitToCoordinates(coords, opts);
        }
      },
      animateToRegion(region, duration) {
        if (MapLibreComponents) {
          cameraRef.current?.setCamera({
            centerCoordinate: [region.longitude, region.latitude],
            animationDuration: duration ?? 600,
          });
        } else {
          rnMapRef.current?.animateToRegion(region, duration);
        }
      },
    }));

    // Log loading status for debugging (especially in release builds)
    React.useEffect(() => {
      if (MapLibreComponents) {
        console.log('MapLibre components loaded successfully');
      } else {
        console.warn('MapLibre not available, falling back to react-native-maps');
        if (mapLibreLoadError) {
          console.warn('MapLibre load error:', mapLibreLoadError);
        }
      }
      console.log('Map style URL:', MAPLIBRE_STYLE_URL);
    }, []);

    // If native MapLibre module is loaded (Production APK)
    if (MapLibreComponents) {
      const MapLibreMap = MapLibreComponents.Map;
      const MapLibreCamera = MapLibreComponents.Camera;
      const defaultCenter: [number, number] = initialRegion
        ? [initialRegion.longitude, initialRegion.latitude]
        : [69.3451, 30.3753];
      const defaultZoom = initialRegion ? regionToZoom(initialRegion) : 5;

      return (
        <MapLibreMap
          style={[styles.map, style]}
          mapStyle={MAPLIBRE_STYLE_URL}
          scrollEnabled={scrollEnabled}
          zoomEnabled={zoomEnabled}
          rotateEnabled={rotateEnabled}
          pitchEnabled={pitchEnabled}
          onPress={onPress as any}
          onTouchStart={onPanDrag}
          androidView="texture"
        >
          <MapLibreCamera
            ref={cameraRef}
            centerCoordinate={defaultCenter}
            zoomLevel={defaultZoom}
          />
          {children}
        </MapLibreMap>
      );
    }

    // Expo Go Fallback — react-native-maps
    const defaultRegion = initialRegion ?? {
      latitude: 30.3753,
      longitude: 69.3451,
      latitudeDelta: 12.0,
      longitudeDelta: 12.0,
    };

    return (
      <RNMapView
        ref={rnMapRef}
        style={[styles.map, style]}
        provider={PROVIDER_DEFAULT}
        initialRegion={defaultRegion}
        scrollEnabled={scrollEnabled}
        zoomEnabled={zoomEnabled}
        rotateEnabled={rotateEnabled}
        pitchEnabled={pitchEnabled}
        onPress={onPress}
        onPanDrag={onPanDrag}
        showsUserLocation={false}
        showsCompass={false}
      >
        {children}
      </RNMapView>
    );
  },
);

const styles = StyleSheet.create({ map: { flex: 1 } });

export default AndroidMapViewInner;
