import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Animated, Platform,
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
import { MOCK_BUSES, MOCK_ROUTES } from '../../services/mockData';
import { aiService } from '../../services/aiService';
import { MAP_PROVIDER, MAP_TYPE, OSM_TILE_URL } from '../../utils/mapConfig';
import CrowdPill from '../../components/cards/CrowdPill';

// SCREEN : LiveTrackingScreen  ROUTE : LiveTracking

type Props = {
  navigation: NativeStackNavigationProp<MapStackParamList, 'LiveTracking'>;
  route     : RouteProp<MapStackParamList, 'LiveTracking'>;
};

// ─── Interpolate between two coordinates ─────────────────────────────────────
function lerpCoord(
  from: { latitude: number; longitude: number },
  to  : { latitude: number; longitude: number },
  t   : number,
) {
  return {
    latitude : from.latitude  + (to.latitude  - from.latitude)  * t,
    longitude: from.longitude + (to.longitude - from.longitude) * t,
  };
}

export default function LiveTrackingScreen({ navigation, route }: Props) {
  const { busId } = route.params;
  const mapRef = useRef<MapView>(null);

  const bus      = MOCK_BUSES.find(b => b.id === busId) ?? MOCK_BUSES[0];
  const busRoute = MOCK_ROUTES.find(r => r.id === bus.routeId) ?? MOCK_ROUTES[0];

  const crowd   = aiService.predictCrowd(bus.id, bus.currentOccupancy, bus.totalSeats);
  const comfort = aiService.getComfortScore(bus.id, bus.currentOccupancy, bus.totalSeats, bus.busType);

  // ── Simulated position state ──────────────────────────────────────────────
  const [progress,  setProgress ] = useState(0.1);          // 0–1 along the route
  const [busCoord,  setBusCoord ] = useState(bus.gpsLocation);
  const [nextStop,  setNextStop ] = useState(busRoute.stops[1] ?? busRoute.stops[0]);

  // Pulsing animation for the live dot
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Pulse animation
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.5, duration: 700, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1.0, duration: 700, useNativeDriver: true }),
      ]),
    );
    pulse.start();

    // Simulated movement — nudge bus position every 3 seconds
    const stops = busRoute.stops;
    let currentSegment = 0;
    let segProgress    = 0.1;

    const moveInterval = setInterval(() => {
      segProgress += 0.05;
      if (segProgress >= 1) {
        segProgress = 0;
        currentSegment = Math.min(currentSegment + 1, stops.length - 2);
      }

      const from = stops[currentSegment];
      const to   = stops[Math.min(currentSegment + 1, stops.length - 1)];
      const newCoord = lerpCoord(from, to, segProgress);

      setBusCoord(newCoord);
      setNextStop(to);
      setProgress((currentSegment + segProgress) / (stops.length - 1));

      mapRef.current?.animateToRegion({
        ...newCoord,
        latitudeDelta : 1.5,
        longitudeDelta: 1.5,
      }, 2500);
    }, 3000);

    return () => {
      pulse.stop();
      clearInterval(moveInterval);
    };
  }, [busId]);

  // ── ETA calculation (mock) ────────────────────────────────────────────────
  const remainingPct    = 1 - progress;
  const etaMinutes      = Math.round(busRoute.estimatedDuration * remainingPct);
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
      >
        {Platform.OS === 'android' && (
          <UrlTile urlTemplate={OSM_TILE_URL} zIndex={-1} />
        )}
        {/* Full route polyline (faded) */}
        <Polyline
          coordinates={busRoute.stops.map(s => ({ latitude: s.latitude, longitude: s.longitude }))}
          strokeColor={Colors.primary + '40'}
          strokeWidth={4}
        />
        {/* Travelled portion (solid) */}
        <Polyline
          coordinates={busRoute.stops
            .slice(0, Math.ceil(progress * busRoute.stops.length) + 1)
            .map(s => ({ latitude: s.latitude, longitude: s.longitude }))
          }
          strokeColor={Colors.primary}
          strokeWidth={4}
        />

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
            onPress={() => navigation.goBack()}
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
    width          : 44,
    height         : 44,
    backgroundColor: Colors.primary,
    borderRadius   : BorderRadius.md,
    alignItems     : 'center',
    justifyContent : 'center',
    ...Shadows.button,
  },
  liveBusEmoji: { fontSize: 22 },

  // Bottom card
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
