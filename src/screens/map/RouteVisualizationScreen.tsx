import React, { useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MapView, { Marker, Polyline, UrlTile } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';

import { MapStackParamList } from '../../types';
import { Colors } from '../../constants/colors';
import { Spacing, BorderRadius } from '../../constants/spacing';
import { Typography } from '../../constants/typography';
import { Shadows } from '../../constants/shadows';
import { MOCK_ROUTES, MOCK_BUSES } from '../../services/mockData';
import { aiService } from '../../services/aiService';
import { MAP_PROVIDER, MAP_TYPE, OSM_TILE_URL } from '../../utils/mapConfig';

// SCREEN : RouteVisualizationScreen  ROUTE : RouteVisualization

type Props = {
  navigation : NativeStackNavigationProp<MapStackParamList, 'RouteVisualization'>;
  route      : RouteProp<MapStackParamList, 'RouteVisualization'>;
};

export default function RouteVisualizationScreen({ navigation, route }: Props) {
  const { routeId } = route.params;
  const mapRef = useRef<MapView>(null);

  const busRoute  = MOCK_ROUTES.find(r => r.id === routeId) ?? MOCK_ROUTES[0];
  const routeBuses = MOCK_BUSES.filter(b => b.routeId === busRoute.id);

  // Fit map to route stops
  useEffect(() => {
    if (busRoute.stops.length > 0) {
      setTimeout(() => {
        mapRef.current?.fitToCoordinates(
          busRoute.stops.map(s => ({ latitude: s.latitude, longitude: s.longitude })),
          { edgePadding: { top: 80, right: 40, bottom: 300, left: 40 }, animated: true },
        );
      }, 500);
    }
  }, [routeId]);

  return (
    <View style={styles.container}>
      {/* ── Map ── */}
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={MAP_PROVIDER}
        mapType={MAP_TYPE}
        initialRegion={{
          latitude      : busRoute.stops[0]?.latitude   ?? 30.37,
          longitude     : busRoute.stops[0]?.longitude  ?? 69.34,
          latitudeDelta : 3.0,
          longitudeDelta: 3.0,
        }}
        showsCompass={false}
        showsUserLocation={false}
      >
        {Platform.OS === 'android' && (
          <UrlTile urlTemplate={OSM_TILE_URL} zIndex={-1} />
        )}
        {/* Route polyline */}
        <Polyline
          coordinates={busRoute.stops.map(s => ({ latitude: s.latitude, longitude: s.longitude }))}
          strokeColor={Colors.primary}
          strokeWidth={4}
        />

        {/* Stop markers */}
        {busRoute.stops.map((stop, idx) => {
          const isFirst = idx === 0;
          const isLast  = idx === busRoute.stops.length - 1;
          return (
            <Marker
              key={stop.id}
              coordinate={{ latitude: stop.latitude, longitude: stop.longitude }}
              anchor={{ x: 0.5, y: 0.5 }}
            >
              <View style={[
                styles.stopMarker,
                isFirst && styles.stopFirst,
                isLast  && styles.stopLast,
              ]}>
                <Text style={styles.stopOrder}>{isFirst ? '🏁' : isLast ? '📍' : idx + 1}</Text>
              </View>
            </Marker>
          );
        })}

        {/* Bus markers on this route */}
        {routeBuses.map(bus => {
          const crowd = aiService.predictCrowd(bus.id, bus.currentOccupancy, bus.totalSeats);
          return (
            <Marker
              key={bus.id}
              coordinate={bus.gpsLocation}
              anchor={{ x: 0.5, y: 0.5 }}
            >
              <View style={styles.busMarker}>
                <Text style={styles.busEmoji}>🚌</Text>
              </View>
            </Marker>
          );
        })}
      </MapView>

      {/* ── Header overlay ── */}
      <SafeAreaView style={styles.headerOverlay} edges={['top']}>
        <View style={styles.headerRow}>
          <TouchableOpacity
            style={styles.backBtn}
            activeOpacity={0.7}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={20} color={Colors.textPrimary} />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle} numberOfLines={1}>{busRoute.routeName}</Text>
            <Text style={styles.headerSub}>{busRoute.stops.length} stops · {busRoute.distance} km</Text>
          </View>
        </View>
      </SafeAreaView>

      {/* ── Stops panel at bottom ── */}
      <View style={styles.stopsPanel}>
        {/* Route meta strip */}
        <View style={styles.metaStrip}>
          <View style={styles.metaItem}>
            <Ionicons name="time-outline" size={14} color={Colors.textSecondary} />
            <Text style={styles.metaText}>
              {Math.floor(busRoute.estimatedDuration / 60)}h {busRoute.estimatedDuration % 60}m
            </Text>
          </View>
          <View style={styles.metaDivider} />
          <View style={styles.metaItem}>
            <Ionicons name="map-outline" size={14} color={Colors.textSecondary} />
            <Text style={styles.metaText}>{busRoute.distance} km</Text>
          </View>
          <View style={styles.metaDivider} />
          <View style={styles.metaItem}>
            <Ionicons name="bus-outline" size={14} color={Colors.textSecondary} />
            <Text style={styles.metaText}>{routeBuses.length} buses active</Text>
          </View>
          <View style={styles.metaDivider} />
          <View style={styles.metaItem}>
            <Ionicons name="cash-outline" size={14} color={Colors.textSecondary} />
            <Text style={styles.metaText}>PKR {busRoute.baseFare}+</Text>
          </View>
        </View>

        <Text style={styles.stopsLabel}>STOPS</Text>

        <ScrollView
          horizontal={false}
          showsVerticalScrollIndicator={false}
          style={styles.stopsList}
          nestedScrollEnabled
        >
          {busRoute.stops.map((stop, idx) => {
            const isFirst = idx === 0;
            const isLast  = idx === busRoute.stops.length - 1;
            return (
              <View key={stop.id} style={styles.stopRow}>
                {/* Timeline */}
                <View style={styles.timeline}>
                  <View style={[
                    styles.timelineDot,
                    isFirst && { backgroundColor: Colors.success },
                    isLast  && { backgroundColor: Colors.error   },
                  ]} />
                  {!isLast && <View style={styles.timelineLine} />}
                </View>
                {/* Info */}
                <View style={styles.stopInfo}>
                  <Text style={styles.stopName}>{stop.name}</Text>
                  <Text style={styles.stopEta}>{stop.estimatedArrival}</Text>
                </View>
                {/* Tag */}
                {(isFirst || isLast) && (
                  <View style={[
                    styles.stopTag,
                    { backgroundColor: isFirst ? Colors.successTint : Colors.errorTint },
                  ]}>
                    <Text style={[
                      styles.stopTagText,
                      { color: isFirst ? Colors.success : Colors.error },
                    ]}>
                      {isFirst ? 'Origin' : 'Destination'}
                    </Text>
                  </View>
                )}
              </View>
            );
          })}
        </ScrollView>
      </View>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1 },
  map      : { flex: 1 },

  // Header
  headerOverlay: { position: 'absolute', top: 0, left: 0, right: 0 },
  headerRow    : {
    flexDirection: 'row',
    alignItems   : 'center',
    gap          : Spacing.sm,
    margin       : Spacing.screenPadding,
  },
  backBtn: {
    width          : 40,
    height         : 40,
    borderRadius   : 20,
    backgroundColor: Colors.white,
    alignItems     : 'center',
    justifyContent : 'center',
    ...Shadows.card,
  },
  headerCenter: {
    flex           : 1,
    backgroundColor: Colors.white,
    borderRadius   : BorderRadius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    ...Shadows.card,
  },
  headerTitle: { ...Typography.bodyMedium },
  headerSub  : { ...Typography.tiny, color: Colors.textSecondary },

  // Markers
  stopMarker: {
    width          : 28,
    height         : 28,
    borderRadius   : 14,
    backgroundColor: Colors.white,
    borderWidth    : 2,
    borderColor    : Colors.primary,
    alignItems     : 'center',
    justifyContent : 'center',
    ...Shadows.card,
  },
  stopFirst  : { borderColor: Colors.success },
  stopLast   : { borderColor: Colors.error   },
  stopOrder  : { fontSize: 12, fontWeight: '700', color: Colors.primary },
  busMarker  : {
    width          : 36,
    height         : 36,
    backgroundColor: Colors.primary,
    borderRadius   : BorderRadius.sm,
    alignItems     : 'center',
    justifyContent : 'center',
    ...Shadows.card,
  },
  busEmoji: { fontSize: 18 },

  // Stops panel
  stopsPanel: {
    position       : 'absolute',
    bottom         : 0,
    left           : 0,
    right          : 0,
    backgroundColor: Colors.white,
    borderTopLeftRadius : BorderRadius.xxl,
    borderTopRightRadius: BorderRadius.xxl,
    padding        : Spacing.lg,
    paddingBottom  : Spacing.safeBottom + Spacing.md,
    maxHeight      : 320,
    ...Shadows.float,
  },

  // Meta strip
  metaStrip  : { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.md },
  metaItem   : { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4 },
  metaText   : { ...Typography.tiny, fontWeight: '500' },
  metaDivider: { width: 1, height: 16, backgroundColor: Colors.divider },

  stopsLabel: { ...Typography.sectionLabel, marginBottom: Spacing.sm },
  stopsList : { },

  // Stop row
  stopRow  : { flexDirection: 'row', alignItems: 'flex-start', marginBottom: Spacing.sm },
  timeline : { width: 24, alignItems: 'center' },
  timelineDot : {
    width          : 12,
    height         : 12,
    borderRadius   : 6,
    backgroundColor: Colors.primary,
    borderWidth    : 2,
    borderColor    : Colors.white,
    zIndex         : 1,
  },
  timelineLine: {
    position       : 'absolute',
    top            : 12,
    width          : 2,
    height         : 28,
    backgroundColor: Colors.border,
  },
  stopInfo : { flex: 1, paddingLeft: Spacing.sm },
  stopName : { ...Typography.bodyMedium, fontSize: 13 },
  stopEta  : { ...Typography.tiny, color: Colors.textSecondary },
  stopTag  : {
    borderRadius     : BorderRadius.full,
    paddingHorizontal: 8,
    paddingVertical  : 2,
  },
  stopTagText: { fontSize: 10, fontWeight: '600' },
});
