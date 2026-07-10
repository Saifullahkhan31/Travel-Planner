import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { HomeStackParamList, Bus, Route, CrowdPrediction, ComfortScore, FareEstimate } from '../../types';
import { Colors } from '../../constants/colors';
import { Spacing, BorderRadius } from '../../constants/spacing';
import { Typography } from '../../constants/typography';
import { Shadows } from '../../constants/shadows';
import { busService } from '../../services/busService';
import { aiService } from '../../services/aiService';
import ScreenHeader from '../../components/common/ScreenHeader';
import CrowdPill from '../../components/cards/CrowdPill';
import ComfortScoreRing from '../../components/cards/ComfortScoreRing';
import Button from '../../components/common/Button';

type Props = NativeStackScreenProps<HomeStackParamList, 'BusDetail'>;

export default function BusDetailScreen({ navigation, route }: Props) {
  const { busId, routeId } = route.params;
  const [bus, setBus] = useState<Bus | null>(null);
  const [busRoute, setRoute] = useState<Route | null>(null);
  const [crowd, setCrowd] = useState<CrowdPrediction | null>(null);
  const [comfort, setComfort] = useState<ComfortScore | null>(null);
  const [fare, setFare] = useState<FareEstimate | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data: b } = await busService.getBusById(busId);
      const { data: r } = await busService.getRouteById(routeId);
      if (b && r) {
        setBus(b);
        setRoute(r);
        setCrowd(aiService.predictCrowd(b.id, b.currentOccupancy, b.totalSeats));
        setComfort(aiService.getComfortScore(b.id, b.currentOccupancy, b.totalSeats, b.busType));
        setFare(aiService.estimateFare(r.id, b.busType, r.distance));
      }
      setLoading(false);
    })();
  }, [busId, routeId]);

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <ScreenHeader title="Bus Details" onBack={() => navigation.goBack()} />
        <View style={styles.loadingView}><ActivityIndicator size="large" color={Colors.primary} /></View>
      </SafeAreaView>
    );
  }

  if (!bus || !busRoute) {
    return (
      <SafeAreaView style={styles.safe}>
        <ScreenHeader title="Bus Details" onBack={() => navigation.goBack()} />
        <View style={styles.loadingView}><Text style={Typography.body}>Bus not found.</Text></View>
      </SafeAreaView>
    );
  }

  const occupancyPct = crowd ? crowd.occupancyPercentage : 0;

  return (
    <SafeAreaView style={styles.safe}>
      <ScreenHeader
        title="Bus Details"
        onBack={() => navigation.goBack()}
        rightComponent={<Ionicons name="share-outline" size={20} color={Colors.textPrimary} />}
      />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* Bus Info Card */}
        <View style={styles.busInfoCard}>
          <View style={styles.busInfoHeader}>
            <View>
              <Text style={styles.busPlate}>{bus.plateNumber}</Text>
              <Text style={styles.routeName}>{busRoute.routeName}</Text>
            </View>
            <View style={[styles.busTypeBadge, bus.busType === 'AC' ? { backgroundColor: Colors.primaryTint } : { backgroundColor: Colors.warningTint }]}>
              <Text style={[styles.busTypeText, bus.busType === 'AC' ? { color: Colors.primary } : { color: Colors.warning }]}>
                {bus.busType === 'AC' ? '❄️ AC' : '🌬️ Non-AC'}
              </Text>
            </View>
          </View>
          <View style={styles.infoRow}>
            <View style={styles.infoItem}>
              <Ionicons name="person-outline" size={14} color={Colors.textMuted} />
              <Text style={styles.infoText}>Driver: {bus.driverName}</Text>
            </View>
            <View style={styles.infoItem}>
              <Ionicons name="people-outline" size={14} color={Colors.textMuted} />
              <Text style={styles.infoText}>{bus.currentOccupancy}/{bus.totalSeats} seats</Text>
            </View>
            <View style={styles.infoItem}>
              <Ionicons name="time-outline" size={14} color={Colors.textMuted} />
              <Text style={styles.infoText}>{busRoute.estimatedDuration} min</Text>
            </View>
          </View>
        </View>

        {/* Comfort + Crowd Row */}
        <View style={styles.scoreRow}>
          {/* Comfort Score */}
          <View style={styles.scoreCard}>
            <Text style={styles.scoreLabel}>Comfort Score</Text>
            {comfort && <ComfortScoreRing score={comfort.score} size="lg" showLabel />}
            <Text style={styles.scoreSubLabel}>{comfort?.emoji} {comfort?.label}</Text>
          </View>

          {/* Crowd Prediction */}
          <View style={styles.scoreCard}>
            <Text style={styles.scoreLabel}>Crowd Level</Text>
            {crowd && <CrowdPill crowdLevel={crowd.crowdLevel} style={{ alignSelf: 'center' }} />}
            <View style={styles.occupancyBar}>
              <View style={[styles.occupancyFill, {
                width: `${occupancyPct}%` as any,
                backgroundColor: crowd?.crowdLevel === 'low' ? Colors.success : crowd?.crowdLevel === 'medium' ? Colors.warning : Colors.error,
              }]} />
            </View>
            <Text style={styles.scoreSubLabel}>{occupancyPct}% occupied</Text>
            <Text style={[styles.tiny, { marginTop: 4 }]}>Confidence {((crowd?.confidenceScore ?? 0) * 100).toFixed(0)}%</Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.aiPredictionButton}
          onPress={() => {
            // Navigate directly to the RootStack's Crowd Prediction screen
            (navigation as any).navigate('CrowdPrediction', { busId: bus.id, routeId: busRoute.id });
          }}
        >
          <Ionicons name="sparkles" size={16} color={Colors.white} />
          <Text style={styles.aiPredictionButtonText}>View AI Crowd Prediction</Text>
        </TouchableOpacity>

        {/* Fare Breakdown */}
        {fare && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Fare Breakdown</Text>
            {[
              { label: 'Base Fare', value: fare.baseFare },
              { label: 'Distance Charge', value: fare.distanceCharge },
              { label: 'Bus Type Surcharge', value: fare.busTypeCharge },
            ].map(item => (
              <View key={item.label} style={styles.fareRow}>
                <Text style={styles.fareLabel}>{item.label}</Text>
                <Text style={styles.fareVal}>PKR {item.value.toFixed(0)}</Text>
              </View>
            ))}
            <View style={[styles.fareRow, styles.totalRow]}>
              <Text style={styles.totalLabel}>Total Fare</Text>
              <Text style={styles.totalVal}>PKR {fare.totalFare}</Text>
            </View>
          </View>
        )}

        {/* Route Stops */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Route Stops</Text>
          {busRoute.stops.map((stop, i) => (
            <View key={stop.id} style={styles.stopRow}>
              <View style={styles.stopDotCol}>
                <View style={[styles.stopDot, i === 0 && { backgroundColor: Colors.success }, i === busRoute.stops.length - 1 && { backgroundColor: Colors.primary }]} />
                {i < busRoute.stops.length - 1 && <View style={styles.stopLine} />}
              </View>
              <View style={styles.stopInfo}>
                <Text style={styles.stopName}>{stop.name}</Text>
                <Text style={styles.stopArrival}>ETA: {stop.estimatedArrival}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Gender Zones */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Seating Zones</Text>
          <View style={styles.zoneRow}>
            {[
              { label: 'Female Zone', color: '#EC4899', bg: '#FDF2F8', icon: '👩' },
              { label: 'No Preference', color: Colors.primary, bg: Colors.primaryTint, icon: '👥' },
              { label: 'Male Zone', color: '#2563EB', bg: '#EFF6FF', icon: '👨' },
            ].map(z => (
              <View key={z.label} style={[styles.zoneBox, { backgroundColor: z.bg }]}>
                <Text style={{ fontSize: 18 }}>{z.icon}</Text>
                <Text style={[styles.zoneLabel, { color: z.color }]}>{z.label}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Sticky Footer */}
      <View style={styles.stickyFooter}>
        <View>
          <Text style={styles.footerFare}>PKR {fare?.totalFare ?? 0}</Text>
          <Text style={styles.footerFareSub}>Estimated fare</Text>
        </View>
        <Button
          label="Select Seat"
          onPress={() => (navigation as any).navigate('SeatSelection', {
            busId: bus.id, 
            routeId: busRoute.id, 
            travelDate: new Date().toISOString().split('T')[0]
          })}
          style={{ flex: 1, marginLeft: Spacing.md }}
          iconRight="arrow-forward"
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  content: { paddingHorizontal: Spacing.screenPadding, paddingBottom: 120 },
  loadingView: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  busInfoCard: { backgroundColor: Colors.card, borderRadius: BorderRadius.xl, padding: Spacing.lg, marginBottom: Spacing.lg, ...Shadows.card },
  busInfoHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: Spacing.md },
  busPlate: { ...Typography.h3 },
  routeName: { ...Typography.caption, marginTop: 2 },
  busTypeBadge: { borderRadius: BorderRadius.full, paddingHorizontal: 12, paddingVertical: 5 },
  busTypeText: { fontSize: 12, fontWeight: '600' },
  infoRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md },
  infoItem: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  infoText: { ...Typography.caption },

  aiPredictionButton: {
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.md,
    borderRadius: BorderRadius.md,
    gap: 8,
  },
  aiPredictionButtonText: {
    ...Typography.body,
    fontFamily: 'Inter-SemiBold',
    color: Colors.white,
  },

  scoreRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.lg },
  scoreCard: { flex: 1, backgroundColor: Colors.card, borderRadius: BorderRadius.lg, padding: Spacing.md, alignItems: 'center', ...Shadows.card },
  scoreLabel: { ...Typography.captionMed, fontWeight: '600', marginBottom: Spacing.sm, color: Colors.textPrimary },
  scoreSubLabel: { ...Typography.tiny, marginTop: Spacing.sm, textAlign: 'center' },
  occupancyBar: { width: '100%', height: 8, backgroundColor: Colors.border, borderRadius: 4, marginVertical: Spacing.sm, overflow: 'hidden' },
  occupancyFill: { height: '100%', borderRadius: 4 },
  tiny: { ...Typography.tiny },

  card: { backgroundColor: Colors.card, borderRadius: BorderRadius.xl, padding: Spacing.lg, marginBottom: Spacing.lg, ...Shadows.card },
  cardTitle: { ...Typography.h4, marginBottom: Spacing.md },

  fareRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: Spacing.sm, borderBottomWidth: 1, borderBottomColor: Colors.divider },
  fareLabel: { ...Typography.body, color: Colors.textSecondary },
  fareVal: { ...Typography.bodyMedium },
  totalRow: { borderBottomWidth: 0, marginTop: Spacing.xs },
  totalLabel: { ...Typography.h4 },
  totalVal: { ...Typography.h4, color: Colors.primary },

  stopRow: { flexDirection: 'row', gap: Spacing.md, marginBottom: Spacing.sm },
  stopDotCol: { alignItems: 'center', width: 16 },
  stopDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: Colors.textMuted },
  stopLine: { flex: 1, width: 2, backgroundColor: Colors.border, marginTop: 4 },
  stopInfo: { flex: 1, paddingBottom: Spacing.sm },
  stopName: { ...Typography.bodyMedium },
  stopArrival: { ...Typography.tiny },

  zoneRow: { flexDirection: 'row', gap: Spacing.sm },
  zoneBox: { flex: 1, borderRadius: BorderRadius.md, padding: Spacing.md, alignItems: 'center', gap: 6 },
  zoneLabel: { fontSize: 10, fontWeight: '600', textAlign: 'center' },

  stickyFooter: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: Colors.white, padding: Spacing.lg,
    flexDirection: 'row', alignItems: 'center',
    borderTopWidth: 1, borderTopColor: Colors.border, ...Shadows.float,
    paddingBottom: Spacing.safeBottom,
  },
  footerFare: { ...Typography.h3, color: Colors.primary },
  footerFareSub: { ...Typography.tiny },
});
