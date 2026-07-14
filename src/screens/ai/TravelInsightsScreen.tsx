import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Animated, Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AIStackParamList, RoutinePattern, AITripSuggestion } from '../../types';
import { Colors } from '../../constants/colors';
import { Spacing, BorderRadius } from '../../constants/spacing';
import { Typography } from '../../constants/typography';
import { Shadows } from '../../constants/shadows';
import { aiService } from '../../services/aiService';
import { bookingService } from '../../services/bookingService';
import { busService } from '../../services/busService';
import { useAuth } from '../../context/AuthContext';

type Props = NativeStackScreenProps<AIStackParamList, 'TravelInsights'>;

const { width: SCREEN_W } = Dimensions.get('window');
const BAR_MAX_W = SCREEN_W - Spacing.screenPadding * 2 - 80;

// Crowd chart hours 6AM–10PM
const HOURS = [6, 8, 10, 12, 14, 16, 18, 20, 22];

function crowdAtHour(h: number): { level: 'low' | 'medium' | 'high'; pct: number } {
  // Simulate peak morning / evening rush
  if (h === 8 || h === 18) return { level: 'high',   pct: 90 };
  if (h === 7 || h === 17 || h === 9 || h === 19) return { level: 'medium', pct: 65 };
  if (h === 12 || h === 13) return { level: 'medium', pct: 55 };
  return { level: 'low', pct: 30 };
}

const CROWD_COLORS = { low: Colors.success, medium: Colors.warning, high: Colors.error };

export default function TravelInsightsScreen({ navigation }: Props) {
  const { user } = useAuth();
  const [routines,    setRoutines]    = useState<RoutinePattern[]>([]);
  const [suggestions, setSuggestions] = useState<AITripSuggestion[]>([]);
  const [barAnims]   = useState(() => HOURS.map(() => new Animated.Value(0)));
  const learningAnim  = useState(() => new Animated.Value(0))[0];

  // Live stats from Supabase bookings
  const [totalTrips,   setTotalTrips]   = useState(0);
  const [totalSpent,   setTotalSpent]   = useState(0);
  const [uniqueRoutes, setUniqueRoutes] = useState(0);
  const [routeUsageList, setRouteUsageList] = useState<{ name: string; count: number; avgComfort: number }[]>([]);

  useEffect(() => {
    (async () => {
      // Load live booking history for current user
      const { data: bookings } = user
        ? await bookingService.getUserBookings(user.id)
        : { data: [] };

      const history = bookings ?? [];
      setTotalTrips(history.length);
      setTotalSpent(history.filter(b => b.bookingStatus === 'completed' || b.bookingStatus === 'boarded').reduce((s, b) => s + b.fareAmount, 0));
      const routes = new Set(history.map(b => b.routeName));
      setUniqueRoutes(routes.size);

      // Route usage
      const counts: Record<string, { name: string; count: number }> = {};
      history
        .filter(b => b.routeName && b.routeName.trim() !== '' && b.routeName.trim().toLowerCase() !== 'route')
        .forEach(b => {
          if (!counts[b.routeName]) counts[b.routeName] = { name: b.routeName, count: 0 };
          counts[b.routeName].count++;
        });
      const usageList = Object.values(counts)
        .sort((a, b) => b.count - a.count)
        .map(r => ({ ...r, avgComfort: 70 }));
      setRouteUsageList(usageList);

      // AI routines from history — skip corrupted/test entries with no real route name
      const tripHistory = history
        .filter(b => b.routeName && b.routeName.trim() !== '' && b.routeName.trim().toLowerCase() !== 'route')
        .map(b => ({
          id: b.id, userId: user?.id ?? '', routeId: b.routeId || b.routeName, routeName: b.routeName,
          travelTime: b.travelDate, fareAmount: b.fareAmount, busId: b.busId || '',
          seatSelected: b.seatNumber?.toString() ?? '', completionStatus: b.bookingStatus as any,
        }));
      setRoutines(aiService.detectRoutines(tripHistory));
      
      const [liveBusesRes, liveRoutesRes] = await Promise.all([
        busService.getAllActiveBuses(),
        busService.getAllRoutes()
      ]);
      setSuggestions(aiService.getTripSuggestions(
        user,
        liveBusesRes.data ?? [],
        liveRoutesRes.data ?? []
      ));

      // Animate crowd bars
      const anims = HOURS.map((h, i) =>
        Animated.timing(barAnims[i], {
          toValue: crowdAtHour(h).pct / 100,
          duration: 600, delay: i * 60, useNativeDriver: false,
        })
      );
      Animated.stagger(60, anims).start();

      // Learning pulse
      Animated.loop(
        Animated.sequence([
          Animated.timing(learningAnim, { toValue: 1, duration: 1400, useNativeDriver: false }),
          Animated.timing(learningAnim, { toValue: 0.4, duration: 1400, useNativeDriver: false }),
        ])
      ).start();
    })();
  }, [user]);

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>✦ AI Insights</Text>
          <Text style={styles.headerSub}>Powered by your travel patterns</Text>
        </View>
        <Animated.View style={[styles.learningBadge, { opacity: learningAnim }]}>
          <Ionicons name="sparkles" size={12} color={Colors.primary} />
          <Text style={styles.learningText}>Learning</Text>
        </Animated.View>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* ── Weekly Summary ── */}
        <View style={styles.summaryRow}>
          {[
            { icon: '🗓️', label: 'Total Trips', value: totalTrips },
            { icon: '🗺️', label: 'Routes Used', value: uniqueRoutes },
            { icon: '💰', label: 'Total Spent',  value: `PKR ${totalSpent.toLocaleString()}` },
          ].map(s => (
            <View key={s.label} style={styles.summaryCard}>
              <Text style={styles.summaryIcon}>{s.icon}</Text>
              <Text style={styles.summaryValue}>{s.value}</Text>
              <Text style={styles.summaryLabel}>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* ── Detected Routines ── */}
        <Text style={styles.sectionTitle}>Detected Routines</Text>
        {routines.length > 0 ? routines.map(r => (
          <View key={r.routeId} style={styles.routineCard}>
            <View style={styles.routineLeft}>
              <View style={styles.routineIconBg}>
                <Ionicons name="repeat" size={18} color={Colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.routineName} numberOfLines={1}>{r.routeName}</Text>
                <Text style={styles.routineMeta}>
                  ~{r.typicalDepartureTime} · {r.frequency}× per week
                </Text>
                {/* Confidence bar */}
                <View style={styles.confBarBg}>
                  <View style={[styles.confBarFill, { width: `${Math.round(r.confidenceScore * 100)}%` as any }]} />
                </View>
                <Text style={styles.confText}>{Math.round(r.confidenceScore * 100)}% confidence</Text>
              </View>
            </View>
            <TouchableOpacity
              style={styles.suggestBtn}
              activeOpacity={0.7}
              onPress={() => {
                const s = suggestions.find(sg => sg.routeId === r.routeId) ?? suggestions[0];
                if (s) navigation.navigate('AITripSuggestion', { suggestionData: s });
              }}
            >
              <Text style={styles.suggestBtnText}>Suggest</Text>
            </TouchableOpacity>
          </View>
        )) : (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyIcon}>🧠</Text>
            <Text style={styles.emptyText}>Take 3+ trips on the same route{'\n'}to detect a routine</Text>
          </View>
        )}

        {/* ── Most Used Routes ── */}
        <Text style={styles.sectionTitle}>Most Used Routes</Text>
        <View style={styles.card}>
          {routeUsageList.map(r => {
            const maxUsage = Math.max(...routeUsageList.map(x => x.count), 1);
            return (
            <View key={r.name} style={styles.routeBarRow}>
              <Text style={styles.routeBarLabel} numberOfLines={1}>{r.name}</Text>
              <View style={styles.routeBarBg}>
                <View style={[styles.routeBarFill, { width: `${Math.round((r.count / maxUsage) * 100)}%` as any }]} />
              </View>
              <Text style={styles.routeBarCount}>{r.count}×</Text>
            </View>
            );
          })}
        </View>

        {/* ── Comfort by Route ── */}
        <Text style={styles.sectionTitle}>Avg. Comfort by Route</Text>
        <View style={styles.card}>
          {routeUsageList.map(r => (
            <View key={r.name} style={styles.comfortRow}>
              <Text style={styles.comfortRouteLabel} numberOfLines={1}>{r.name}</Text>
              <View style={styles.comfortBarBg}>
                <View style={[
                  styles.comfortBarFill,
                  {
                    width: `${r.avgComfort}%` as any,
                    backgroundColor: r.avgComfort >= 70 ? Colors.success : r.avgComfort >= 50 ? Colors.warning : Colors.error,
                  },
                ]} />
              </View>
              <Text style={styles.comfortScore}>{r.avgComfort}</Text>
            </View>
          ))}
        </View>

        {/* ── Crowd Trend Chart ── */}
        <Text style={styles.sectionTitle}>Crowd Trend (Time of Day)</Text>
        <View style={styles.card}>
          <View style={styles.chartArea}>
            {HOURS.map((h, i) => {
              const { level } = crowdAtHour(h);
              const barColor = CROWD_COLORS[level];
              return (
                <View key={h} style={styles.chartColumn}>
                  <View style={styles.chartBarContainer}>
                    <Animated.View style={[
                      styles.chartBar,
                      {
                        height: barAnims[i].interpolate({ inputRange: [0, 1], outputRange: [0, 100] }),
                        backgroundColor: barColor,
                      },
                    ]} />
                  </View>
                  <Text style={styles.chartLabel}>{h > 12 ? `${h - 12}P` : h === 12 ? '12P' : `${h}A`}</Text>
                </View>
              );
            })}
          </View>
          <View style={styles.chartLegend}>
            {['low', 'medium', 'high'].map(l => (
              <View key={l} style={styles.chartLegendItem}>
                <View style={[styles.chartLegendDot, { backgroundColor: CROWD_COLORS[l as keyof typeof CROWD_COLORS] }]} />
                <Text style={styles.chartLegendText}>{l.charAt(0).toUpperCase() + l.slice(1)}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* ── Best Time to Travel ── */}
        <View style={styles.bestTimeCard}>
          <Ionicons name="time-outline" size={22} color={Colors.primary} />
          <View style={{ flex: 1 }}>
            <Text style={styles.bestTimeTitle}>Best Time to Travel</Text>
            <Text style={styles.bestTimeSub}>10 AM – 12 PM · Low crowd · Avg. comfort 78/100</Text>
          </View>
        </View>

        {/* ── AI Trip Suggestions ── */}
        <Text style={styles.sectionTitle}>AI Trip Suggestions</Text>
        {suggestions.map((s, i) => (
          <TouchableOpacity
            key={i}
            style={styles.suggestionCard}
            activeOpacity={0.75}
            onPress={() => navigation.navigate('AITripSuggestion', { suggestionData: s })}
          >
            <View style={styles.suggestionLeft}>
              <Ionicons name="sparkles" size={16} color={Colors.primary} />
              <View style={{ flex: 1 }}>
                <Text style={styles.suggestionRoute} numberOfLines={1}>{s.routeName}</Text>
                <Text style={styles.suggestionMeta}>
                  Departs {s.departureTime} · PKR {s.estimatedFare}
                </Text>
              </View>
            </View>
            <View style={styles.suggestionRight}>
              <Text style={styles.suggestionConf}>{Math.round(s.confidenceScore * 100)}%</Text>
              <Text style={[styles.suggestionConfLabel]}>match</Text>
            </View>
          </TouchableOpacity>
        ))}

        {/* ── Learning Banner ── */}
        <Animated.View style={[styles.learningBanner, { opacity: learningAnim }]}>
          <Ionicons name="sparkles-outline" size={16} color={Colors.primary} />
          <Text style={styles.learningBannerText}>
            Your travel AI is learning… more trips = smarter suggestions
          </Text>
        </Animated.View>

        <View style={{ height: Spacing.safeBottom + Spacing.xxl }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe   : { flex: 1, backgroundColor: Colors.background },
  header : {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.screenPadding, paddingTop: Spacing.lg, paddingBottom: Spacing.md,
  },
  headerTitle: { ...Typography.h2 },
  headerSub  : { ...Typography.caption, marginTop: 2 },
  learningBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: Colors.primaryTint, borderRadius: BorderRadius.full,
    paddingHorizontal: 10, paddingVertical: 4,
  },
  learningText: { fontSize: 11, fontWeight: '600', color: Colors.primary },

  content : { paddingHorizontal: Spacing.screenPadding },
  sectionTitle: { ...Typography.h4, marginBottom: Spacing.sm, marginTop: Spacing.lg },
  card: { backgroundColor: Colors.card, borderRadius: BorderRadius.xl, padding: Spacing.lg, ...Shadows.card, marginBottom: Spacing.sm },

  // Summary row
  summaryRow : { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.sm },
  summaryCard: {
    flex: 1, backgroundColor: Colors.card, borderRadius: BorderRadius.xl,
    padding: Spacing.md, alignItems: 'center', gap: 4, ...Shadows.card,
  },
  summaryIcon : { fontSize: 22 },
  summaryValue: { ...Typography.h4, color: Colors.primary },
  summaryLabel: { ...Typography.tiny, textAlign: 'center' },

  // Routine cards
  routineCard: {
    backgroundColor: Colors.card, borderRadius: BorderRadius.xl, padding: Spacing.lg,
    marginBottom: Spacing.md, flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    ...Shadows.card, borderLeftWidth: 3, borderLeftColor: Colors.primary,
  },
  routineLeft: { flex: 1, flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.md },
  routineIconBg: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: Colors.primaryTint, alignItems: 'center', justifyContent: 'center',
  },
  routineName : { ...Typography.bodyMedium, flex: 1 },
  routineMeta : { ...Typography.tiny, marginTop: 2, marginBottom: Spacing.xs },
  confBarBg   : { height: 4, backgroundColor: Colors.border, borderRadius: 2, marginTop: 4, overflow: 'hidden' },
  confBarFill : { height: '100%', backgroundColor: Colors.primary, borderRadius: 2 },
  confText    : { ...Typography.tiny, color: Colors.textMuted, marginTop: 2 },
  suggestBtn  : {
    backgroundColor: Colors.primary, borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
  },
  suggestBtnText: { ...Typography.tiny, color: Colors.white, fontWeight: '700' },
  emptyCard  : { backgroundColor: Colors.card, borderRadius: BorderRadius.xl, padding: Spacing.xxl, alignItems: 'center', gap: Spacing.sm, ...Shadows.card },
  emptyIcon  : { fontSize: 40 },
  emptyText  : { ...Typography.body, color: Colors.textSecondary, textAlign: 'center', lineHeight: 22 },

  // Route usage bars
  routeBarRow   : { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.sm },
  routeBarLabel : { ...Typography.caption, width: 90 },
  routeBarBg    : { flex: 1, height: 10, backgroundColor: Colors.border, borderRadius: 5, overflow: 'hidden' },
  routeBarFill  : { height: '100%', backgroundColor: Colors.primary, borderRadius: 5 },
  routeBarCount : { ...Typography.tiny, width: 20, textAlign: 'right' },

  // Comfort bars
  comfortRow       : { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.sm },
  comfortRouteLabel: { ...Typography.caption, width: 90 },
  comfortBarBg     : { flex: 1, height: 10, backgroundColor: Colors.border, borderRadius: 5, overflow: 'hidden' },
  comfortBarFill   : { height: '100%', borderRadius: 5 },
  comfortScore     : { ...Typography.tiny, width: 28, textAlign: 'right', fontWeight: '700' },

  // Chart
  chartArea    : { flexDirection: 'row', alignItems: 'flex-end', height: 110, gap: 4, marginBottom: Spacing.sm },
  chartColumn  : { flex: 1, alignItems: 'center', gap: 4 },
  chartBarContainer: { height: 100, justifyContent: 'flex-end', width: '100%' },
  chartBar     : { borderRadius: 3, width: '100%' },
  chartLabel   : { fontSize: 9, color: Colors.textMuted, fontWeight: '500' },
  chartLegend  : { flexDirection: 'row', gap: Spacing.md, justifyContent: 'center', marginTop: Spacing.xs },
  chartLegendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  chartLegendDot : { width: 8, height: 8, borderRadius: 4 },
  chartLegendText: { ...Typography.tiny },

  // Best time
  bestTimeCard: {
    backgroundColor: Colors.primaryTint, borderRadius: BorderRadius.xl, padding: Spacing.lg,
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md, marginBottom: Spacing.sm,
    borderWidth: 1, borderColor: Colors.primary + '30',
  },
  bestTimeTitle: { ...Typography.bodyMedium, color: Colors.primary },
  bestTimeSub  : { ...Typography.tiny, marginTop: 2 },

  // Suggestion cards
  suggestionCard: {
    backgroundColor: Colors.card, borderRadius: BorderRadius.xl, padding: Spacing.lg,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginBottom: Spacing.sm, ...Shadows.card,
  },
  suggestionLeft  : { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, flex: 1 },
  suggestionRoute : { ...Typography.bodyMedium },
  suggestionMeta  : { ...Typography.tiny, marginTop: 2 },
  suggestionRight : { alignItems: 'center' },
  suggestionConf  : { ...Typography.h4, color: Colors.primary },
  suggestionConfLabel: { ...Typography.tiny },

  // Learning banner
  learningBanner: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    backgroundColor: Colors.primaryTint, borderRadius: BorderRadius.lg,
    padding: Spacing.md, marginTop: Spacing.lg,
  },
  learningBannerText: { ...Typography.caption, color: Colors.primary, flex: 1 },
});
