import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Animated, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AIStackParamList, CrowdPrediction } from '../../types';
import { Colors } from '../../constants/colors';
import { Spacing, BorderRadius } from '../../constants/spacing';
import { Typography } from '../../constants/typography';
import { Shadows } from '../../constants/shadows';
import { aiService } from '../../services/aiService';
import { busService } from '../../services/busService';
import { MOCK_BUSES, MOCK_ROUTES } from '../../services/mockData';
import ScreenHeader from '../../components/common/ScreenHeader';
import CrowdPill from '../../components/cards/CrowdPill';

type Props = NativeStackScreenProps<AIStackParamList, 'CrowdPrediction'>;

// Hourly crowd simulation (6 AM to 10 PM)
const HOURS = [6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22];

function simulateCrowdAtHour(h: number, baseOccupancy: number, totalSeats: number) {
  let factor = 1.0;
  if (h === 8)  factor = 1.55;
  else if (h === 9 || h === 7)  factor = 1.35;
  else if (h === 18) factor = 1.5;
  else if (h === 17 || h === 19) factor = 1.3;
  else if (h >= 12 && h <= 14)  factor = 1.15;
  else if (h <= 6 || h >= 21)   factor = 0.5;
  const occ = Math.min(Math.round(baseOccupancy * factor), totalSeats);
  const pct = Math.round((occ / totalSeats) * 100);
  const level: 'low' | 'medium' | 'high' = pct <= 40 ? 'low' : pct <= 75 ? 'medium' : 'high';
  return { pct, level };
}

const CROWD_COLORS = { low: Colors.success, medium: Colors.warning, high: Colors.error };
const CROWD_BG = { low: Colors.successTint, medium: Colors.warningTint, high: Colors.errorTint };

export default function CrowdPredictionScreen({ navigation, route }: Props) {
  const { busId, routeId } = route.params;

  // Data state
  const [bus, setBus] = useState<Bus | null>(null);
  const [busRoute, setRoute] = useState<Route | null>(null);

  // State for ML-powered prediction
  const [crowd,        setCrowd]        = useState<CrowdPrediction | null>(null);
  const [apiComfort,   setApiComfort]   = useState<number | null>(null);
  const [loading,      setLoading]      = useState(true);
  const [isFromAPI,    setIsFromAPI]    = useState(false);

  // Sibling buses on same route for comparison
  const [siblings, setSiblings] = useState<Bus[]>([]);

  // Animated fill bar for current occupancy
  const fillAnim = useRef(new Animated.Value(0)).current;
  // Bar anims for hourly chart
  const barAnims = useRef(HOURS.map(() => new Animated.Value(0))).current;

  const currentHour = new Date().getHours();

  useEffect(() => {
    (async () => {
      try {
        // 1. Fetch Bus and Route (check mock first, then Supabase)
        let b = MOCK_BUSES.find(m => m.id === busId);
        if (!b) {
          const { data } = await busService.getBusById(busId);
          if (data) b = data;
        }

        let r = MOCK_ROUTES.find(m => m.id === routeId);
        if (!r) {
          const { data } = await busService.getRouteById(routeId);
          if (data) r = data;
        }

        if (!b || !r) throw new Error("Could not load bus data");

        setBus(b);
        setRoute(r);

        // We removed siblings logic for real Supabase buses since it's just for mock UI comparison
        if (b.id.startsWith('mock')) {
          setSiblings(MOCK_BUSES.filter(sb => sb.routeId === routeId && sb.id !== busId));
        }

        // 2. Fetch crowd prediction from Python FastAPI
        const result = await aiService.predictCrowdFromAPI(
          b.id,
          b.currentOccupancy,
          b.totalSeats,
          b.busType,
          r.origin ?? 'Lahore',
          r.destination ?? 'Islamabad',
        );
        
        setCrowd(result);
        setApiComfort(result.apiComfortScore);
        setIsFromAPI(result.confidenceScore === 0.91);
        
        Animated.timing(fillAnim, {
          toValue: result.occupancyPercentage / 100,
          duration: 900,
          useNativeDriver: false,
        }).start();

        const anims = HOURS.map((h, i) =>
          Animated.timing(barAnims[i], {
            toValue: simulateCrowdAtHour(h, b.currentOccupancy, b.totalSeats).pct / 100,
            duration: 500,
            delay: i * 40,
            useNativeDriver: false,
          })
        );
        Animated.stagger(40, anims).start();
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, [busId, routeId]);

  const occupancyColor = !crowd ? Colors.primary
    : crowd.crowdLevel === 'low' ? Colors.success
    : crowd.crowdLevel === 'medium' ? Colors.warning : Colors.error;

  if (loading || !bus || !busRoute || !crowd) {
    return (
      <SafeAreaView style={styles.safe}>
        <ScreenHeader title="Crowd Prediction" onBack={() => navigation.goBack()} />
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loaderText}>Analyzing live ML models...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const bestHour = HOURS.reduce((best, h) => {
    return simulateCrowdAtHour(h, bus.currentOccupancy, bus.totalSeats).pct <
           simulateCrowdAtHour(best, bus.currentOccupancy, bus.totalSeats).pct ? h : best;
  }, HOURS[0]);

  const fillWidth = fillAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <SafeAreaView style={styles.safe}>
      <ScreenHeader title="Crowd Analysis" onBack={() => navigation.goBack()} />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* Route Strip */}
        <View style={styles.routeStrip}>
          <Ionicons name="bus-outline" size={16} color={Colors.primary} />
          <Text style={styles.routeStripText} numberOfLines={1}>{busRoute?.routeName}</Text>
          <Text style={styles.routeStripMeta}>{bus?.plateNumber}</Text>
        </View>

        {/* Current Crowd Hero */}
        <View style={styles.heroCard}>
          <Text style={styles.heroLabel}>Current Crowd Level</Text>
          <CrowdPill crowdLevel={crowd!.crowdLevel} showDot />
          <Text style={styles.heroPercent}>{crowd!.occupancyPercentage}%</Text>
          <Text style={styles.heroOcc}>
            {bus.currentOccupancy} / {bus.totalSeats} seats occupied
          </Text>

          {/* Animated fill bar */}
          <View style={styles.occupancyBarBg}>
            <Animated.View style={[
              styles.occupancyBarFill,
              {
                width: fillAnim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }),
                backgroundColor: occupancyColor,
              },
            ]} />
          </View>

          {/* Confidence */}
          <View style={styles.confRow}>
            <Ionicons name="checkmark-circle-outline" size={14} color={Colors.success} />
            <Text style={styles.confText}>
              AI Confidence: {Math.round((crowd!.confidenceScore) * 100)}%
              {isFromAPI ? '  🤖 ML Model' : '  📱 Local'}
            </Text>
          </View>
        </View>

        {/* Hourly Chart */}
        <Text style={styles.sectionTitle}>Hourly Crowd Forecast</Text>
        <View style={styles.chartCard}>
          <View style={styles.chartArea}>
            {HOURS.map((h, i) => {
              const { level } = simulateCrowdAtHour(h, bus.currentOccupancy, bus.totalSeats);
              const isNow = h === currentHour;
              return (
                <View key={h} style={styles.chartColumn}>
                  <View style={styles.chartBarContainer}>
                    <Animated.View style={[
                      styles.chartBar,
                      {
                        height: barAnims[i].interpolate({ inputRange: [0, 1], outputRange: [0, 100] }),
                        backgroundColor: CROWD_COLORS[level],
                        opacity: isNow ? 1 : 0.65,
                      },
                    ]} />
                  </View>
                  <Text style={[styles.chartHourLabel, isNow && { color: Colors.primary, fontWeight: '700' }]}>
                    {h > 12 ? `${h - 12}p` : h === 12 ? '12p' : `${h}a`}
                  </Text>
                  {isNow && <View style={styles.nowDot} />}
                </View>
              );
            })}
          </View>
          <View style={styles.chartLegend}>
            {(['low', 'medium', 'high'] as const).map(l => (
              <View key={l} style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: CROWD_COLORS[l] }]} />
                <Text style={styles.legendText}>{l.charAt(0).toUpperCase() + l.slice(1)}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Best Time */}
        <View style={styles.bestTimeCard}>
          <View style={[styles.bestTimeIcon, { backgroundColor: Colors.successTint }]}>
            <Ionicons name="time-outline" size={20} color={Colors.success} />
          </View>
          <View>
            <Text style={styles.bestTimeTitle}>Best Time to Travel</Text>
            <Text style={styles.bestTimeSub}>
              {bestHour > 12 ? `${bestHour - 12}:00 PM` : `${bestHour}:00 AM`} —
              lowest crowd expected
            </Text>
          </View>
        </View>

        {/* Bus Comparison */}
        {siblings.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Other Buses on This Route</Text>
            {siblings.slice(0, 3).map(s => {
              const sc = aiService.predictCrowd(s.id, s.currentOccupancy, s.totalSeats);
              return (
                <View key={s.id} style={styles.compCard}>
                  <View>
                    <Text style={styles.compPlate}>{s.plateNumber}</Text>
                    <Text style={styles.compType}>{s.busType}</Text>
                  </View>
                  <View style={styles.compBarWrapper}>
                    <View style={styles.compBarBg}>
                      <View style={[
                        styles.compBarFill,
                        {
                          width: `${sc.occupancyPercentage}%` as any,
                          backgroundColor: CROWD_COLORS[sc.crowdLevel],
                        },
                      ]} />
                    </View>
                    <Text style={styles.compPct}>{sc.occupancyPercentage}%</Text>
                  </View>
                  <CrowdPill crowdLevel={sc.crowdLevel} />
                </View>
              );
            })}
          </>
        )}

        <View style={{ height: Spacing.safeBottom + Spacing.xl }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe   : { flex: 1, backgroundColor: Colors.background },
  content: { paddingHorizontal: Spacing.screenPadding },

  routeStrip: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    backgroundColor: Colors.card, borderRadius: BorderRadius.lg,
    padding: Spacing.md, marginBottom: Spacing.lg, ...Shadows.card,
  },
  routeStripText: { ...Typography.bodyMedium, flex: 1 },
  routeStripMeta: { ...Typography.tiny },

  heroCard: {
    backgroundColor: Colors.card, borderRadius: BorderRadius.xl,
    padding: Spacing.xl, alignItems: 'center', ...Shadows.card, marginBottom: Spacing.lg,
  },
  heroLabel  : { ...Typography.caption, marginBottom: Spacing.sm },
  heroPercent: { fontSize: 52, fontWeight: '800', color: Colors.textPrimary, marginTop: Spacing.sm },
  heroOcc    : { ...Typography.caption, marginBottom: Spacing.lg },
  occupancyBarBg  : { width: '100%', height: 12, backgroundColor: Colors.border, borderRadius: 6, overflow: 'hidden', marginBottom: Spacing.md },
  occupancyBarFill: { height: '100%', borderRadius: 6 },
  confRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
  confText: { ...Typography.caption, color: Colors.success },

  sectionTitle: { ...Typography.h4, marginBottom: Spacing.sm, marginTop: Spacing.sm },

  chartCard  : { backgroundColor: Colors.card, borderRadius: BorderRadius.xl, padding: Spacing.lg, ...Shadows.card, marginBottom: Spacing.lg },
  chartArea  : { flexDirection: 'row', alignItems: 'flex-end', height: 110, gap: 3 },
  chartColumn: { flex: 1, alignItems: 'center' },
  chartBarContainer: { height: 100, justifyContent: 'flex-end', width: '100%' },
  chartBar   : { borderRadius: 3, width: '100%' },
  chartHourLabel: { fontSize: 9, color: Colors.textMuted, marginTop: 3 },
  nowDot     : { width: 4, height: 4, borderRadius: 2, backgroundColor: Colors.primary, marginTop: 1 },
  chartLegend  : { flexDirection: 'row', gap: Spacing.md, justifyContent: 'center', marginTop: Spacing.md },
  legendItem   : { flexDirection: 'row', alignItems: 'center', gap: 4 },
  legendDot    : { width: 8, height: 8, borderRadius: 4 },
  legendText   : { ...Typography.tiny },

  bestTimeCard: {
    backgroundColor: Colors.successTint, borderRadius: BorderRadius.xl,
    padding: Spacing.lg, flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    marginBottom: Spacing.lg, borderWidth: 1, borderColor: Colors.success + '40',
  },
  bestTimeIcon : { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  bestTimeTitle: { ...Typography.bodyMedium, color: Colors.success },
  bestTimeSub  : { ...Typography.tiny, marginTop: 2 },

  compCard: {
    backgroundColor: Colors.card, borderRadius: BorderRadius.lg, padding: Spacing.md,
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md, marginBottom: Spacing.sm, ...Shadows.card,
  },
  compPlate: { ...Typography.captionMed, width: 72 },
  compType : { ...Typography.tiny },
  compBarWrapper: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  compBarBg    : { flex: 1, height: 8, backgroundColor: Colors.border, borderRadius: 4, overflow: 'hidden' },
  compBarFill  : { height: '100%', borderRadius: 4 },
  compPct      : { ...Typography.tiny, width: 28, textAlign: 'right' },
});
