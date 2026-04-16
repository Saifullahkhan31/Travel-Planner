import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, Animated, Dimensions, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MapView, { Marker, Polyline, UrlTile } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { MapStackParamList } from '../../types';
import { Colors } from '../../constants/colors';
import { Spacing, BorderRadius } from '../../constants/spacing';
import { Typography } from '../../constants/typography';
import { Shadows } from '../../constants/shadows';
import { MOCK_BUSES, MOCK_ROUTES } from '../../services/mockData';
import { aiService } from '../../services/aiService';
import { MAP_PROVIDER, MAP_TYPE, OSM_TILE_URL } from '../../utils/mapConfig';

import CrowdPill from '../../components/cards/CrowdPill';
import ComfortScoreRing from '../../components/cards/ComfortScoreRing';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

type Props = { navigation: NativeStackNavigationProp<MapStackParamList, 'Map'> };

// ─── Crowd colour helper ──────────────────────────────────────────────────────
function crowdColour(level: 'low' | 'medium' | 'high'): string {
  if (level === 'low')    return Colors.success;
  if (level === 'medium') return Colors.warning;
  return Colors.error;
}

// ─── Route colours (one per route) ───────────────────────────────────────────
const ROUTE_COLOURS = ['#3B82F6', '#8B5CF6', '#F97316', '#10B981', '#EF4444'];

export default function MapScreen({ navigation }: Props) {
  const mapRef = useRef<MapView>(null);
  const sheetAnim = useRef(new Animated.Value(0)).current;

  const [selectedRoute, setSelectedRoute] = useState<string | null>(null);
  const [selectedBus,   setSelectedBus  ] = useState<string | null>(null);
  const [showAll,       setShowAll      ] = useState(true);

  // ── Computed ──────────────────────────────────────────────────────────────
  const visibleBuses = showAll
    ? MOCK_BUSES
    : MOCK_BUSES.filter(b => selectedRoute ? b.routeId === selectedRoute : true);

  const selectedBusData = MOCK_BUSES.find(b => b.id === selectedBus);
  const selectedBusRoute = selectedBusData
    ? MOCK_ROUTES.find(r => r.id === selectedBusData.routeId)
    : null;
  const selectedCrowd = selectedBusData
    ? aiService.predictCrowd(selectedBusData.id, selectedBusData.currentOccupancy, selectedBusData.totalSeats)
    : null;
  const selectedComfort = selectedBusData
    ? aiService.getComfortScore(selectedBusData.id, selectedBusData.currentOccupancy, selectedBusData.totalSeats, selectedBusData.busType)
    : null;

  // ── Sheet animation ───────────────────────────────────────────────────────
  useEffect(() => {
    Animated.spring(sheetAnim, {
      toValue  : selectedBus ? 1 : 0,
      useNativeDriver: true,
      tension  : 80,
      friction : 12,
    }).start();
  }, [selectedBus]);

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleSelectRoute = useCallback((routeId: string) => {
    const next = selectedRoute === routeId ? null : routeId;
    setSelectedRoute(next);
    setSelectedBus(null);

    if (next) {
      const route = MOCK_ROUTES.find(r => r.id === next);
      if (route && route.stops.length > 0) {
        const midStop = route.stops[Math.floor(route.stops.length / 2)];
        mapRef.current?.animateToRegion({
          latitude      : midStop.latitude,
          longitude     : midStop.longitude,
          latitudeDelta : 3.0,
          longitudeDelta: 3.0,
        }, 600);
      }
    } else {
      mapRef.current?.animateToRegion(PAKISTAN_REGION, 600);
    }
  }, [selectedRoute]);

  const handleMarkerPress = useCallback((busId: string) => {
    setSelectedBus(prev => prev === busId ? null : busId);
  }, []);

  const handleDismissSheet = () => setSelectedBus(null);

  const handleTrackLive = () => {
    if (!selectedBusData) return;
    navigation.navigate('LiveTracking', { busId: selectedBusData.id });
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <View style={styles.container}>
      {/* ── Map ── */}
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={MAP_PROVIDER}
        mapType={MAP_TYPE}
        initialRegion={PAKISTAN_REGION}
        showsUserLocation={false}
        showsMyLocationButton={false}
        showsCompass={false}
        onPress={handleDismissSheet}
      >
        {Platform.OS === 'android' && (
          <UrlTile urlTemplate={OSM_TILE_URL} zIndex={-1} />
        )}
        {/* Route polylines */}
        {MOCK_ROUTES.map((route, idx) => {
          const isActive = selectedRoute === null || selectedRoute === route.id;
          return (
            <Polyline
              key={route.id}
              coordinates={route.stops.map(s => ({ latitude: s.latitude, longitude: s.longitude }))}
              strokeColor={isActive ? ROUTE_COLOURS[idx % ROUTE_COLOURS.length] : Colors.border}
              strokeWidth={isActive ? 3 : 1.5}
            />
          );
        })}

        {/* Stop markers */}
        {selectedRoute && MOCK_ROUTES
          .find(r => r.id === selectedRoute)
          ?.stops.map(stop => (
            <Marker
              key={stop.id}
              coordinate={{ latitude: stop.latitude, longitude: stop.longitude }}
              anchor={{ x: 0.5, y: 0.5 }}
            >
              <View style={styles.stopDot} />
            </Marker>
          ))
        }

        {/* Bus markers */}
        {visibleBuses.map(bus => {
          const crowd = aiService.predictCrowd(bus.id, bus.currentOccupancy, bus.totalSeats);
          const isSelected = bus.id === selectedBus;
          return (
            <Marker
              key={bus.id}
              coordinate={bus.gpsLocation}
              anchor={{ x: 0.5, y: 0.5 }}
              onPress={() => handleMarkerPress(bus.id)}
            >
              <View style={[styles.busMarker, isSelected && styles.busMarkerSelected]}>
                <Text style={styles.busEmoji}>🚌</Text>
                <View style={[styles.crowdDot, { backgroundColor: crowdColour(crowd.crowdLevel) }]} />
              </View>
            </Marker>
          );
        })}
      </MapView>

      {/* ── Safe area header overlay ── */}
      <SafeAreaView style={styles.headerOverlay} edges={['top']} pointerEvents="box-none">
        {/* Title row */}
        <View style={styles.titleRow}>
          <View style={styles.titleCard}>
            <Ionicons name="map" size={16} color={Colors.primary} />
            <Text style={styles.titleText}>Live Map</Text>
            <View style={styles.liveChip}>
              <View style={styles.liveDot} />
              <Text style={styles.liveText}>LIVE</Text>
            </View>
          </View>
          {/* All / My Route toggle */}
          <TouchableOpacity
            style={styles.toggleBtn}
            activeOpacity={0.8}
            onPress={() => setShowAll(p => !p)}
          >
            <Text style={styles.toggleText}>{showAll ? 'All Buses' : 'Filtered'}</Text>
            <Ionicons
              name={showAll ? 'filter-outline' : 'filter'}
              size={14}
              color={Colors.primary}
            />
          </TouchableOpacity>
        </View>

        {/* Route chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.chipsScroll}
          contentContainerStyle={styles.chipsContent}
        >
          {MOCK_ROUTES.map((route, idx) => {
            const active = selectedRoute === route.id;
            return (
              <TouchableOpacity
                key={route.id}
                style={[
                  styles.routeChip,
                  active && { backgroundColor: ROUTE_COLOURS[idx % ROUTE_COLOURS.length] },
                ]}
                activeOpacity={0.8}
                onPress={() => handleSelectRoute(route.id)}
              >
                <View style={[
                  styles.chipDot,
                  { backgroundColor: active ? Colors.white : ROUTE_COLOURS[idx % ROUTE_COLOURS.length] },
                ]} />
                <Text style={[styles.chipText, active && { color: Colors.white }]}>
                  {route.routeName}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </SafeAreaView>

      {/* ── Legend ── */}
      <View style={styles.legend}>
        {[
          { label: 'Low',    color: Colors.success },
          { label: 'Medium', color: Colors.warning },
          { label: 'High',   color: Colors.error   },
        ].map(item => (
          <View key={item.label} style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: item.color }]} />
            <Text style={styles.legendText}>{item.label}</Text>
          </View>
        ))}
      </View>

      {/* ── Bus bottom sheet ── */}
      <Animated.View
        style={[
          styles.sheet,
          {
            transform: [{
              translateY: sheetAnim.interpolate({
                inputRange : [0, 1],
                outputRange: [260, 0],
              }),
            }],
            opacity: sheetAnim,
          },
        ]}
        pointerEvents={selectedBus ? 'auto' : 'none'}
      >
        {selectedBusData && selectedBusRoute && selectedCrowd && selectedComfort && (
          <>
            {/* Handle */}
            <View style={styles.sheetHandle} />

            <View style={styles.sheetTop}>
              <View style={{ flex: 1 }}>
                <Text style={styles.sheetRoute} numberOfLines={1}>
                  {selectedBusRoute.routeName}
                </Text>
                <Text style={styles.sheetPlate}>🚌 {selectedBusData.plateNumber}</Text>
              </View>
              <ComfortScoreRing score={selectedComfort.score} size="sm" />
            </View>

            <View style={styles.sheetMeta}>
              <CrowdPill crowdLevel={selectedCrowd.crowdLevel} />
              <View style={styles.busTypePill}>
                <Text style={styles.busTypeText}>{selectedBusData.busType}</Text>
              </View>
              <Text style={styles.driverText}>👤 {selectedBusData.driverName}</Text>
            </View>

            <View style={styles.sheetActions}>
              <TouchableOpacity
                style={styles.trackBtn}
                activeOpacity={0.8}
                onPress={handleTrackLive}
              >
                <Ionicons name="navigate" size={16} color={Colors.white} />
                <Text style={styles.trackBtnText}>Track Live</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.closeBtn}
                activeOpacity={0.8}
                onPress={handleDismissSheet}
              >
                <Ionicons name="close" size={18} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>
          </>
        )}
      </Animated.View>
    </View>
  );
}

// ─── Constants ────────────────────────────────────────────────────────────────
const PAKISTAN_REGION = {
  latitude      : 30.3753,
  longitude     : 69.3451,
  latitudeDelta : 12.0,
  longitudeDelta: 12.0,
};

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1 },
  map      : { flex: 1 },

  // Header overlay
  headerOverlay: {
    position: 'absolute',
    top     : 0,
    left    : 0,
    right   : 0,
  },
  titleRow: {
    flexDirection  : 'row',
    alignItems     : 'center',
    justifyContent : 'space-between',
    paddingHorizontal: Spacing.screenPadding,
    paddingBottom  : Spacing.sm,
  },
  titleCard: {
    flexDirection  : 'row',
    alignItems     : 'center',
    gap            : Spacing.sm,
    backgroundColor: Colors.white,
    borderRadius   : BorderRadius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    ...Shadows.card,
  },
  titleText: { ...Typography.bodyMedium },
  liveChip : {
    flexDirection  : 'row',
    alignItems     : 'center',
    gap            : 4,
    backgroundColor: Colors.successTint,
    borderRadius   : BorderRadius.full,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  liveDot : { width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.success },
  liveText: { fontSize: 10, fontWeight: '700', color: Colors.success },

  toggleBtn: {
    flexDirection  : 'row',
    alignItems     : 'center',
    gap            : 4,
    backgroundColor: Colors.white,
    borderRadius   : BorderRadius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    ...Shadows.card,
  },
  toggleText: { ...Typography.caption, color: Colors.primary, fontWeight: '600' },

  // Chips
  chipsScroll : { },
  chipsContent: {
    paddingHorizontal: Spacing.screenPadding,
    gap              : Spacing.sm,
    paddingBottom    : Spacing.sm,
  },
  routeChip: {
    flexDirection    : 'row',
    alignItems       : 'center',
    gap              : 5,
    backgroundColor  : Colors.white,
    borderRadius     : BorderRadius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical  : Spacing.sm,
    ...Shadows.card,
  },
  chipDot : { width: 8, height: 8, borderRadius: 4 },
  chipText: { ...Typography.caption, color: Colors.textSecondary, fontWeight: '500' },

  // Markers
  busMarker: {
    width          : 40,
    height         : 40,
    backgroundColor: Colors.white,
    borderRadius   : BorderRadius.md,
    alignItems     : 'center',
    justifyContent : 'center',
    ...Shadows.card,
  },
  busMarkerSelected: {
    borderWidth: 2,
    borderColor: Colors.primary,
    ...Shadows.button,
  },
  busEmoji : { fontSize: 20 },
  crowdDot : {
    width        : 8,
    height       : 8,
    borderRadius : 4,
    position     : 'absolute',
    top          : 2,
    right        : 2,
    borderWidth  : 1,
    borderColor  : Colors.white,
  },
  stopDot: {
    width          : 12,
    height         : 12,
    borderRadius   : 6,
    backgroundColor: Colors.primary,
    borderWidth    : 2,
    borderColor    : Colors.white,
  },

  // Legend
  legend: {
    position       : 'absolute',
    bottom         : 200,
    right          : Spacing.screenPadding,
    backgroundColor: Colors.white,
    borderRadius   : BorderRadius.md,
    padding        : Spacing.sm,
    gap            : 4,
    ...Shadows.card,
  },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot : { width: 8, height: 8, borderRadius: 4 },
  legendText: { ...Typography.tiny, fontWeight: '500' },

  // Bottom sheet
  sheet: {
    position       : 'absolute',
    bottom         : 0,
    left           : 0,
    right          : 0,
    backgroundColor: Colors.white,
    borderTopLeftRadius : BorderRadius.xxl,
    borderTopRightRadius: BorderRadius.xxl,
    padding        : Spacing.lg,
    paddingBottom  : Spacing.safeBottom + Spacing.lg,
    ...Shadows.float,
  },
  sheetHandle: {
    width          : 36,
    height         : 4,
    borderRadius   : 2,
    backgroundColor: Colors.border,
    alignSelf      : 'center',
    marginBottom   : Spacing.md,
  },
  sheetTop  : { flexDirection: 'row', alignItems: 'flex-start', marginBottom: Spacing.sm },
  sheetRoute: { ...Typography.h4, marginBottom: 2 },
  sheetPlate: { ...Typography.caption, color: Colors.textSecondary },
  sheetMeta : { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.md },
  busTypePill: {
    backgroundColor  : Colors.primaryTint,
    borderRadius     : BorderRadius.full,
    paddingHorizontal: 8,
    paddingVertical  : 3,
  },
  busTypeText: { fontSize: 11, fontWeight: '600', color: Colors.primary },
  driverText : { ...Typography.tiny, color: Colors.textSecondary },

  sheetActions: { flexDirection: 'row', gap: Spacing.sm },
  trackBtn: {
    flex           : 1,
    height         : 48,
    backgroundColor: Colors.primary,
    borderRadius   : BorderRadius.md,
    flexDirection  : 'row',
    alignItems     : 'center',
    justifyContent : 'center',
    gap            : Spacing.sm,
    ...Shadows.button,
  },
  trackBtnText: { ...Typography.buttonLabel },
  closeBtn: {
    width          : 48,
    height         : 48,
    backgroundColor: Colors.background,
    borderRadius   : BorderRadius.md,
    alignItems     : 'center',
    justifyContent : 'center',
  },
});
