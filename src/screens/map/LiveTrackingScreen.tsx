import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Animated, Platform, ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MapView, { Marker, Polyline, UrlTile } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';

import { MapStackParamList, Bus, Route as BusRoute } from '../../types';
import { Colors } from '../../constants/colors';
import { Spacing, BorderRadius } from '../../constants/spacing';
import { Typography } from '../../constants/typography';
import { Shadows } from '../../constants/shadows';
import { MOCK_BUSES, MOCK_ROUTES } from '../../services/mockData';
import { aiService } from '../../services/aiService';
import { busService } from '../../services/busService';
import { MAP_PROVIDER, MAP_TYPE, OSM_TILE_URL } from '../../utils/mapConfig';
import { fetchPreciseRoute, getCoordAlongPath, calculatePathDistances } from '../../utils/mapUtils';
import CrowdPill from '../../components/cards/CrowdPill';

// SCREEN : LiveTrackingScreen  ROUTE : LiveTracking

type Props = {
  navigation: NativeStackNavigationProp<MapStackParamList, 'LiveTracking'>;
  route     : RouteProp<MapStackParamList, 'LiveTracking'>;
};

// Start map far back to show entire country
const PAKISTAN_REGION = {
  latitude: 30.3753,
  longitude: 69.3451,
  latitudeDelta: 12.0,
  longitudeDelta: 12.0,
};

export default function LiveTrackingScreen({ navigation, route }: Props) {
  const { busId } = route.params;
  const mapRef = useRef<MapView>(null);

  const [loading, setLoading] = useState(true);
  const [bus, setBus] = useState<Bus | null>(null);
  const [busRoute, setBusRoute] = useState<BusRoute | null>(null);

  // ── Simulated position ─────────────────────────────────────────────────────
  // progressRef drives the animation loop without triggering re-renders.
  // busCoord is the only state that moves the map marker.
  const progressRef = useRef(0.05);
  const [progress,  setProgress ] = useState(0.05);          // for ETA display only
  const [busCoord,  setBusCoord ] = useState<{latitude: number, longitude: number} | null>(null);
  const [nextStop,  setNextStop ] = useState<{latitude: number, longitude: number, name: string} | null>(null);

  // Follow Mode
  const [isFollowing, setIsFollowing] = useState(true);
  const isFollowingRef = useRef(true);

  const [preciseRoute, setPreciseRoute] = useState<{latitude: number, longitude: number}[]>([]);
  const preciseRouteRef = useRef<{latitude: number, longitude: number}[]>([]);

  // Pulsing animation for the live dot
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // 1. Fetch real DB data or fallback to mock
  useEffect(() => {
    async function loadBusData() {
      let targetBus = MOCK_BUSES.find(b => b.id === busId);
      let targetRoute = null;

      if (!targetBus) {
        const { data } = await busService.getBusById(busId);
        if (data) targetBus = data;
      }

      if (targetBus) {
        targetRoute = MOCK_ROUTES.find(r => r.id === targetBus!.routeId);
        if (!targetRoute) {
          const { data } = await busService.getRouteById(targetBus.routeId);
          if (data) targetRoute = data;
        }
      }

      const finalBus = targetBus ?? MOCK_BUSES[0];
      const finalRoute = targetRoute ?? MOCK_ROUTES[0];

      setBus(finalBus);
      setBusRoute(finalRoute);
      setBusCoord(finalBus.gpsLocation);
      setNextStop(finalRoute.stops[1] ?? finalRoute.stops[0]);
      setLoading(false);
    }
    loadBusData();
  }, [busId]);

  // 2. Run simulation once data is loaded
  useEffect(() => {
    if (loading || !bus || !busRoute) return;

    // Pulse animation for the "LIVE" badge
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.5, duration: 700, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1.0, duration: 700, useNativeDriver: true }),
      ]),
    );
    pulse.start();

    let coordInterval: NodeJS.Timeout;
    let displayInterval: NodeJS.Timeout;
    let cameraInterval: NodeJS.Timeout;

    const startSimulation = async () => {
      // 1. Fetch precise route if not already cached
      let pathPoints = preciseRouteRef.current;
      if (pathPoints.length === 0 && busRoute.stops.length > 0) {
        pathPoints = await fetchPreciseRoute(busRoute.stops);
        if (pathPoints.length >= 2) {
          setPreciseRoute(pathPoints);
          preciseRouteRef.current = pathPoints;
        }
      }

      const effectivePath = pathPoints.length >= 2
        ? pathPoints
        : busRoute.stops.map(s => ({ latitude: s.latitude, longitude: s.longitude }));

      if (effectivePath.length < 2) return;

      // Precalculate distances once
      const { distances, totalDist } = calculatePathDistances(effectivePath);

      // Fast loop: just advance progress ref and update map marker coord (one state update per tick)
      coordInterval = setInterval(() => {
        progressRef.current += 0.00008;
        if (progressRef.current >= 1) progressRef.current = 0.05;

        const newCoord = getCoordAlongPath(effectivePath, progressRef.current, distances, totalDist);
        if (newCoord) setBusCoord(newCoord);
      }, 500);

      // Slow loop: update progress display and ETA every 2 seconds
      displayInterval = setInterval(() => {
        const p = progressRef.current;
        setProgress(p);
        const targetIdx = Math.min(Math.ceil(p * (busRoute.stops.length - 1)), busRoute.stops.length - 1);
        setNextStop(busRoute.stops[targetIdx]);
      }, 2000);

      // Camera follow every 3 seconds
      cameraInterval = setInterval(() => {
        const newCoord = getCoordAlongPath(effectivePath, progressRef.current, distances, totalDist);
        if (isFollowingRef.current && newCoord) {
          mapRef.current?.animateCamera({ center: newCoord }, { duration: 2500 });
        }
      }, 3000);
    };

    startSimulation();

    return () => {
      pulse.stop();
      clearInterval(coordInterval);
      clearInterval(displayInterval);
      clearInterval(cameraInterval);
    };
  }, [loading, bus, busRoute]);

  if (loading || !bus || !busCoord || !busRoute || !nextStop) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  const crowd   = aiService.predictCrowd(bus.id, bus.currentOccupancy, bus.totalSeats);
  const comfort = aiService.getComfortScore(bus.id, bus.currentOccupancy, bus.totalSeats, bus.busType);

  // ── ETA calculation (mock) ────────────────────────────────────────────────
  const remainingPct    = 1 - progress;
  const etaMinutes      = Math.round((busRoute.estimatedDuration || 120) * remainingPct);
  const etaDisplay      = etaMinutes > 60
    ? `${Math.floor(etaMinutes / 60)}h ${etaMinutes % 60}m`
    : `${etaMinutes} min`;

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <View style={styles.container}>
      {/* ── Map ── */}
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={MAP_PROVIDER}
        mapType={MAP_TYPE}
        initialRegion={{
          ...bus.gpsLocation,
          latitudeDelta : 1.5,
          longitudeDelta: 1.5,
        }}
        showsUserLocation={false}
        showsCompass={false}
        onPanDrag={() => {
          if (isFollowingRef.current) {
            isFollowingRef.current = false;
            setIsFollowing(false);
          }
        }}
        onRegionChangeComplete={(region, details) => {
          if (details?.isGesture && isFollowingRef.current) {
            isFollowingRef.current = false;
            setIsFollowing(false);
          }
        }}
      >
        {Platform.OS === 'android' && (
          <UrlTile urlTemplate={OSM_TILE_URL} zIndex={-1} />
        )}
        {/* Full route polyline — only re-renders when preciseRoute changes, not on every busCoord update */}
        {(() => {
          const polyCoords = preciseRoute.length >= 2
            ? preciseRoute
            : busRoute.stops
                .map(s => ({ latitude: s.latitude, longitude: s.longitude }))
                .filter(c => c.latitude !== 0 && c.longitude !== 0);
          if (polyCoords.length < 2) return null;
          return (
            <Polyline
              key={`poly-full-${busRoute.id}`}
              coordinates={polyCoords}
              strokeColor={Colors.primary + '60'}
              strokeWidth={4}
            />
          );
        })()}

        {/* Stop markers */}
        {busRoute.stops.map((stop, idx) => (
          <Marker
            key={stop.id}
            coordinate={{ latitude: stop.latitude, longitude: stop.longitude }}
            anchor={{ x: 0.5, y: 0.5 }}
          >
            <View style={[
              styles.stopMarker,
              idx === 0 && styles.stopMarkerStart,
              idx === busRoute.stops.length - 1 && styles.stopMarkerEnd,
            ]}>
              <Text style={styles.stopMarkerText} numberOfLines={2}>
                {idx === 0 ? '🏁' : idx === busRoute.stops.length - 1 ? '📍' : `${idx + 1}`}
              </Text>
            </View>
          </Marker>
        ))}

        {/* Live bus marker */}
        <Marker
          coordinate={busCoord}
          anchor={{ x: 0.5, y: 0.5 }}
        >
          <Animated.View style={[styles.liveBusMarker, { transform: [{ scale: 1 }] }]}>
            <Text style={styles.liveBusEmoji}>🚌</Text>
          </Animated.View>
        </Marker>
      </MapView>

      {/* ── Top bar overlay ── */}
      <SafeAreaView style={styles.topBar} edges={['top']}>
        <View style={styles.topBarInner}>
          <TouchableOpacity
            style={styles.backBtn}
            activeOpacity={0.7}
            onPress={() => {
              if (route.params?.returnTo) {
                navigation.getParent()?.navigate(route.params.returnTo);
              } else {
                navigation.goBack();
              }
            }}
          >
            <Ionicons name="arrow-back" size={20} color={Colors.textPrimary} />
          </TouchableOpacity>

          <View style={styles.topBarCenter}>
            <Text style={styles.topBarTitle} numberOfLines={1}>{busRoute.routeName}</Text>
            <Text style={styles.topBarPlate}>{bus.plateNumber}</Text>
          </View>

          {/* Live badge */}
          <View style={styles.liveBadge}>
            <Animated.View style={[styles.livePulse, { transform: [{ scale: pulseAnim }] }]} />
            <Text style={styles.liveBadgeText}>LIVE</Text>
          </View>
        </View>
      </SafeAreaView>

      {/* ── Progress bar ── */}
      <View style={styles.progressBarContainer}>
        <View style={[styles.progressBarFill, { width: `${Math.round(progress * 100)}%` as any }]} />
      </View>

      {/* ── Recenter Button ── */}
      {!isFollowing && (
        <TouchableOpacity
          style={styles.recenterBtn}
          activeOpacity={0.8}
          onPress={() => {
            isFollowingRef.current = true;
            setIsFollowing(true);
            mapRef.current?.animateCamera({ center: busCoord }, { duration: 1000 });
          }}
        >
          <Ionicons name="navigate" size={18} color={Colors.primary} />
          <Text style={styles.recenterText}>Re-center</Text>
        </TouchableOpacity>
      )}

      {/* ── Tracking card at bottom ── */}
      <View style={styles.card}>
        {/* Next stop */}
        <View style={styles.nextStopRow}>
          <Ionicons name="location" size={16} color={Colors.primary} />
          <View style={{ flex: 1 }}>
            <Text style={styles.nextStopLabel}>Next Stop</Text>
            <Text style={styles.nextStopName}>{nextStop.name}</Text>
          </View>
          <View style={styles.etaBadge}>
            <Text style={styles.etaValue}>{etaDisplay}</Text>
            <Text style={styles.etaLabel}>ETA</Text>
          </View>
        </View>

        <View style={styles.divider} />

        {/* Stats row */}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{bus.currentOccupancy}/{bus.totalSeats}</Text>
            <Text style={styles.statLabel}>Passengers</Text>
          </View>
          <View style={styles.statItem}>
            <CrowdPill crowdLevel={crowd.crowdLevel} />
            <Text style={styles.statLabel}>Crowd</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{comfort.label} {comfort.emoji}</Text>
            <Text style={styles.statLabel}>Comfort</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{bus.busType}</Text>
            <Text style={styles.statLabel}>Type</Text>
          </View>
        </View>

        {/* Journey progress */}
        <View style={styles.journeyRow}>
          <Text style={styles.journeyCity}>{busRoute.stops[0].name.split('(')[0].trim()}</Text>
          <View style={styles.journeyLine}>
            <View style={[styles.journeyFill, { flex: progress }]} />
            <View style={[styles.journeyEmpty, { flex: 1 - progress }]} />
          </View>
          <Text style={styles.journeyCity}>
            {busRoute.stops[busRoute.stops.length - 1].name.split('(')[0].trim()}
          </Text>
        </View>
      </View>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1 },
  map      : { flex: 1 },

  // Top bar
  topBar: {
    position: 'absolute',
    top     : 0,
    left    : 0,
    right   : 0,
  },
  topBarInner: {
    flexDirection  : 'row',
    alignItems     : 'center',
    marginHorizontal: Spacing.screenPadding,
    paddingVertical: Spacing.sm,
    gap            : Spacing.sm,
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
  topBarCenter: {
    flex           : 1,
    backgroundColor: Colors.white,
    borderRadius   : BorderRadius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    ...Shadows.card,
  },
  topBarTitle : { ...Typography.bodyMedium, fontSize: 13 },
  topBarPlate : { ...Typography.tiny, color: Colors.textSecondary },
  liveBadge   : {
    flexDirection  : 'row',
    alignItems     : 'center',
    gap            : 4,
    backgroundColor: Colors.white,
    borderRadius   : BorderRadius.full,
    paddingHorizontal: 10,
    paddingVertical: 6,
    ...Shadows.card,
  },
  livePulse    : { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.success },
  liveBadgeText: { fontSize: 10, fontWeight: '800', color: Colors.success },

  // Progress bar
  progressBarContainer: {
    position       : 'absolute',
    top            : 0,
    left           : 0,
    right          : 0,
    height         : 3,
    backgroundColor: Colors.border,
  },
  progressBarFill: {
    height         : 3,
    backgroundColor: Colors.primary,
  },

  // Markers
  stopMarker: {
    width          : 24,
    height         : 24,
    borderRadius   : 12,
    backgroundColor: Colors.white,
    borderWidth    : 2,
    borderColor    : Colors.primary,
    alignItems     : 'center',
    justifyContent : 'center',
  },
  stopMarkerStart: { backgroundColor: Colors.successTint, borderColor: Colors.success },
  stopMarkerEnd  : { backgroundColor: Colors.errorTint,   borderColor: Colors.error   },
  stopMarkerText : { fontSize: 10, fontWeight: '700', color: Colors.primary },

  liveBusMarker: {
    width          : 32,
    height         : 32,
    backgroundColor: Colors.white,
    borderRadius   : 16,
    borderWidth    : 2,
    borderColor    : Colors.primary,
    alignItems     : 'center',
    justifyContent : 'center',
    ...Shadows.card,
  },
  liveBusEmoji: { fontSize: 16 },

  // Bottom card
  recenterBtn: {
    position: 'absolute',
    bottom: 220,
    right: 20,
    backgroundColor: Colors.card,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 24,
    ...Shadows.card,
  },
  recenterText: {
    marginLeft: 6,
    color: Colors.primary,
    fontWeight: '600',
    fontSize: 14,
  },
  card: {
    position       : 'absolute',
    bottom         : 0,
    left           : 0,
    right          : 0,
    backgroundColor: Colors.white,
    borderTopLeftRadius : BorderRadius.xxl,
    borderTopRightRadius: BorderRadius.xxl,
    padding        : Spacing.lg,
    paddingBottom  : Spacing.safeBottom + Spacing.md,
    ...Shadows.float,
  },
  nextStopRow : { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.md },
  nextStopLabel: { ...Typography.tiny, color: Colors.textMuted },
  nextStopName : { ...Typography.bodyMedium },
  etaBadge     : { alignItems: 'center', backgroundColor: Colors.primaryTint, borderRadius: BorderRadius.md, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm },
  etaValue     : { ...Typography.h4, color: Colors.primary },
  etaLabel     : { ...Typography.tiny, color: Colors.primary },

  divider: { height: 1, backgroundColor: Colors.divider, marginBottom: Spacing.md },

  statsRow : { flexDirection: 'row', justifyContent: 'space-between', marginBottom: Spacing.md },
  statItem : { alignItems: 'center', gap: 3 },
  statValue: { ...Typography.captionMed, color: Colors.textPrimary },
  statLabel: { ...Typography.tiny },

  journeyRow  : { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  journeyCity : { ...Typography.tiny, fontWeight: '600', color: Colors.textSecondary, maxWidth: 70, textAlign: 'center' },
  journeyLine : { flex: 1, height: 4, borderRadius: 2, flexDirection: 'row', overflow: 'hidden' },
  journeyFill : { backgroundColor: Colors.primary },
  journeyEmpty: { backgroundColor: Colors.border },
});
