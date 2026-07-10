import React, { useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Animated, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AIStackParamList } from '../../types';
import { Colors } from '../../constants/colors';
import { Spacing, BorderRadius } from '../../constants/spacing';
import { Typography } from '../../constants/typography';
import { Shadows } from '../../constants/shadows';
import { busService } from '../../services/busService';
import { aiService } from '../../services/aiService';
import { Bus, Route } from '../../types';
import ComfortScoreRing from '../../components/cards/ComfortScoreRing';
import CrowdPill from '../../components/cards/CrowdPill';
import Button from '../../components/common/Button';

type Props = NativeStackScreenProps<AIStackParamList, 'AITripSuggestion'>;

// Reason pills generated per suggestion
function getReasonsForSuggestion(isRoutine: boolean, confidence: number, crowdLevel: string): string[] {
  const reasons: string[] = [];
  if (isRoutine)          reasons.push('📅 Matches your routine');
  if (crowdLevel === 'low')   reasons.push('✅ Low crowd expected');
  if (crowdLevel === 'medium') reasons.push('⚡ Moderate crowd, book fast');
  if (confidence > 0.85)  reasons.push('🧠 High AI confidence');
  if (confidence > 0.75)  reasons.push('🗺️ Best route for your area');
  reasons.push('🚌 Bus departing soon');
  return reasons.slice(0, 3);
}

export default function AITripSuggestionScreen({ navigation, route }: Props) {
  const { suggestionData: s } = route.params;

  const [bus, setBus] = React.useState<Bus | null>(null);
  const [busRoute, setRoute] = React.useState<Route | null>(null);
  const [aiText, setAiText] = React.useState<string | null>(null);
  const [aiTextLoading, setAiTextLoading] = React.useState(true);

  // Alternatives: other suggestions on different routes
  const alternatives = aiService.getTripSuggestions('u1').filter(sg => sg.routeId !== s.routeId).slice(0, 2);

  // Animations
  const slideAnim  = useRef(new Animated.Value(30)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const confAnim   = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(slideAnim,   { toValue: 0,   duration: 400, useNativeDriver: true }),
      Animated.timing(opacityAnim, { toValue: 1,   duration: 400, useNativeDriver: true }),
      Animated.timing(confAnim,    { toValue: 1,   duration: 800, delay: 300, useNativeDriver: false }),
    ]).start();

    // Fetch live bus and route details
    (async () => {
      try {
        let fetchedBus = null;
        if (s.suggestedBusId) {
          const { data } = await busService.getBusById(s.suggestedBusId);
          if (data) {
            fetchedBus = data;
            setBus(data);
          }
        }
        if (s.routeId) {
          const { data } = await busService.getRouteById(s.routeId);
          if (data) setRoute(data);
        }
        
        // Fetch live AI suggestion text from FastAPI
        const text = await aiService.getAISuggestionText(
          'comfortable seat, smooth journey',
          s.routeName.split(' → ')[0] ?? 'Lahore',
          s.routeName.split(' → ')[1] ?? 'Islamabad',
          s.departureTime,
          s.crowdPrediction.crowdLevel,
          s.comfortScore.score,
          fetchedBus?.busType ?? 'AC',
        );
        setAiText(text);
      } catch (err) {
        console.error("Failed to load AI text:", err);
        setAiText("Good time to travel. Crowd levels are manageable.");
      } finally {
        setAiTextLoading(false);
      }
    })();
  }, [s]);

  const reasons = getReasonsForSuggestion(s.isRoutine, s.confidenceScore, s.crowdPrediction.crowdLevel);

  const confWidth = confAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', `${Math.round(s.confidenceScore * 100)}%`],
  });

  const handleBook = () => {
    if (!bus || !busRoute) return;
    (navigation as any).navigate('SeatSelection', {
      busId       : bus.id,
      routeId     : busRoute.id,
      travelDate  : new Date().toISOString().split('T')[0],
    });
  };

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={Colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>AI Suggestion</Text>
          <View style={styles.sparkBadge}>
            <Ionicons name="sparkles" size={11} color={Colors.white} />
            <Text style={styles.sparkBadgeText}>Powered by AI</Text>
          </View>
        </View>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* Sub-label */}
        <Text style={styles.subLabel}>
          {s.isRoutine ? '📅 Based on your routine' : '⚡ Best match right now'}
        </Text>

        {/* Main Bus Card */}
        <Animated.View style={[styles.mainCard, { opacity: opacityAnim, transform: [{ translateY: slideAnim }] }]}>
          {/* Route */}
          <View style={styles.routeRow}>
            <View style={styles.routeEndpoint}>
              <Text style={styles.routeCode}>
                {(busRoute?.origin ?? s.routeName.split(' → ')[0] ?? '').slice(0, 3).toUpperCase()}
              </Text>
              <Text style={styles.routeCity}>{busRoute?.origin ?? s.routeName.split(' → ')[0]}</Text>
            </View>
            <View style={styles.routeArrow}>
              <View style={styles.arrowLine} />
              <Ionicons name="bus" size={18} color={Colors.primary} />
              <View style={styles.arrowLine} />
            </View>
            <View style={[styles.routeEndpoint, { alignItems: 'flex-end' }]}>
              <Text style={styles.routeCode}>
                {(busRoute?.destination ?? s.routeName.split(' → ')[1] ?? '').slice(0, 3).toUpperCase()}
              </Text>
              <Text style={styles.routeCity}>{busRoute?.destination ?? s.routeName.split(' → ')[1]}</Text>
            </View>
          </View>

          <View style={styles.cardDivider} />

          {/* Details Grid */}
          <View style={styles.detailGrid}>
            {[
              { icon: 'time-outline',        label: 'Departure', value: s.departureTime },
              { icon: 'speedometer-outline', label: 'ETA',       value: `${s.eta} min` },
              { icon: 'cash-outline',        label: 'Est. Fare', value: `PKR ${s.estimatedFare}` },
              { icon: 'car-outline',         label: 'Bus Type',  value: bus?.busType ?? s.comfortScore.label ?? '—' },
              { icon: 'person-outline',      label: 'Driver',    value: bus?.driverName ?? '—' },
              { icon: 'keypad-outline',      label: 'Plate',     value: bus?.plateNumber ?? '—' },
            ].map(d => (
              <View key={d.label} style={styles.detailItem}>
                <Ionicons name={d.icon as any} size={13} color={Colors.textMuted} />
                <Text style={styles.detailLabel}>{d.label}</Text>
                <Text style={styles.detailValue}>{d.value}</Text>
              </View>
            ))}
          </View>

          <View style={styles.cardDivider} />

          {/* Comfort + Crowd */}
          <View style={styles.scoresRow}>
            <View style={styles.scoreBlock}>
              <Text style={styles.scoreBlockLabel}>Comfort</Text>
              <ComfortScoreRing score={s.comfortScore.score} size="sm" showLabel />
            </View>
            <View style={styles.scoreBlockDivider} />
            <View style={styles.scoreBlock}>
              <Text style={styles.scoreBlockLabel}>Crowd</Text>
              <CrowdPill crowdLevel={s.crowdPrediction.crowdLevel} showDot style={{ alignSelf: 'center' }} />
              <Text style={styles.scoreBlockSub}>{s.crowdPrediction.occupancyPercentage}% full</Text>
            </View>
          </View>
        </Animated.View>

        {/* Why AI Suggested */}
        <Text style={styles.sectionTitle}>Why AI Suggested This</Text>
        <View style={styles.reasonsRow}>
          {reasons.map(r => (
            <View key={r} style={styles.reasonPill}>
              <Text style={styles.reasonText}>{r}</Text>
            </View>
          ))}
        </View>

        {/* Confidence Meter */}
        <View style={styles.confCard}>
          <View style={styles.confHeader}>
            <Text style={styles.confTitle}>AI Confidence Score</Text>
            <Text style={styles.confPct}>{Math.round(s.confidenceScore * 100)}%</Text>
          </View>
          <View style={styles.confBarBg}>
            <Animated.View style={[styles.confBarFill, { width: confWidth }]} />
          </View>
          <Text style={styles.confSub}>Based on your travel history and current conditions</Text>
        </View>

        {/* AI Insight Text Card */}
        <Text style={styles.sectionTitle}>AI Insight</Text>
        <View style={styles.aiInsightCard}>
          <View style={styles.aiInsightHeader}>
            <Ionicons name="sparkles" size={16} color={Colors.primary} />
            <Text style={styles.aiInsightTitle}>SmartBusPlanner AI</Text>
            {aiTextLoading && <ActivityIndicator size="small" color={Colors.primary} style={{ marginLeft: 8 }} />}
          </View>
          <Text style={styles.aiInsightText}>
            {aiTextLoading ? 'Generating personalized insight…' : aiText}
          </Text>
        </View>

        {/* Alternative Buses */}
        {alternatives.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Alternative Suggestions</Text>
            {alternatives.map((alt, i) => (
              <TouchableOpacity
                key={i}
                style={styles.altCard}
                activeOpacity={0.75}
                onPress={() => navigation.setParams({ suggestionData: alt })}
              >
                <View style={{ flex: 1 }}>
                  <Text style={styles.altRoute} numberOfLines={1}>{alt.routeName}</Text>
                  <Text style={styles.altMeta}>
                    {alt.departureTime} · PKR {alt.estimatedFare} · {alt.comfortScore.label}
                  </Text>
                </View>
                <View style={styles.altConf}>
                  <Text style={styles.altConfVal}>{Math.round(alt.confidenceScore * 100)}%</Text>
                  <Text style={styles.altConfLabel}>match</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
              </TouchableOpacity>
            ))}
          </>
        )}

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Sticky Footer */}
      <View style={styles.footer}>
        <Button
          label="Book This Trip"
          onPress={handleBook}
          style={{ flex: 1 }}
          iconRight="arrow-forward"
        />
        <TouchableOpacity style={styles.notNowBtn} onPress={() => navigation.goBack()} activeOpacity={0.7}>
          <Text style={styles.notNowText}>Not Now</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe   : { flex: 1, backgroundColor: Colors.background },
  header : {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: Spacing.screenPadding, paddingTop: Spacing.md, paddingBottom: Spacing.sm,
  },
  backBtn      : { width: 38, height: 38, alignItems: 'center', justifyContent: 'center' },
  headerCenter : { flex: 1, alignItems: 'center', gap: 4 },
  headerTitle  : { ...Typography.h4 },
  sparkBadge   : {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: Colors.primary, borderRadius: BorderRadius.full,
    paddingHorizontal: 8, paddingVertical: 3,
  },
  sparkBadgeText: { fontSize: 9, fontWeight: '700', color: Colors.white },

  content : { paddingHorizontal: Spacing.screenPadding },
  subLabel: { ...Typography.caption, color: Colors.textSecondary, textAlign: 'center', marginBottom: Spacing.md },

  mainCard: {
    backgroundColor: Colors.card, borderRadius: BorderRadius.xl,
    overflow: 'hidden', marginBottom: Spacing.lg, ...Shadows.float,
  },
  routeRow: { flexDirection: 'row', alignItems: 'center', padding: Spacing.xl },
  routeEndpoint: { flex: 1 },
  routeCode    : { fontSize: 24, fontWeight: '800', color: Colors.textPrimary },
  routeCity    : { ...Typography.tiny, marginTop: 2 },
  routeArrow   : { flex: 1, flexDirection: 'row', alignItems: 'center' },
  arrowLine    : { flex: 1, height: 1, backgroundColor: Colors.border },
  cardDivider  : { height: 1, backgroundColor: Colors.divider },

  detailGrid: { flexDirection: 'row', flexWrap: 'wrap', padding: Spacing.lg },
  detailItem: { width: '50%', paddingVertical: Spacing.sm, gap: 2 },
  detailLabel: { ...Typography.tiny, color: Colors.textMuted },
  detailValue: { ...Typography.captionMed },

  scoresRow : { flexDirection: 'row', padding: Spacing.lg },
  scoreBlock: { flex: 1, alignItems: 'center', gap: Spacing.sm },
  scoreBlockLabel  : { ...Typography.caption, color: Colors.textSecondary },
  scoreBlockSub    : { ...Typography.tiny, marginTop: 4 },
  scoreBlockDivider: { width: 1, backgroundColor: Colors.divider, alignSelf: 'stretch' },

  sectionTitle: { ...Typography.h4, marginBottom: Spacing.sm, marginTop: Spacing.sm },

  reasonsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginBottom: Spacing.lg },
  reasonPill: {
    backgroundColor: Colors.primaryTint, borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
  },
  reasonText: { ...Typography.caption, color: Colors.primary, fontWeight: '600' },

  confCard  : { backgroundColor: Colors.card, borderRadius: BorderRadius.xl, padding: Spacing.lg, ...Shadows.card, marginBottom: Spacing.lg },
  confHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.sm },
  confTitle : { ...Typography.bodyMedium },
  confPct   : { ...Typography.h4, color: Colors.primary },
  confBarBg : { height: 10, backgroundColor: Colors.border, borderRadius: 5, overflow: 'hidden', marginBottom: Spacing.sm },
  confBarFill: { height: '100%', backgroundColor: Colors.primary, borderRadius: 5 },
  confSub   : { ...Typography.tiny, color: Colors.textMuted },

  altCard: {
    backgroundColor: Colors.card, borderRadius: BorderRadius.lg, padding: Spacing.lg,
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    marginBottom: Spacing.sm, ...Shadows.card,
  },
  altRoute: { ...Typography.bodyMedium },
  altMeta : { ...Typography.tiny, marginTop: 2 },
  altConf : { alignItems: 'center', paddingHorizontal: Spacing.sm },
  altConfVal   : { ...Typography.h4, color: Colors.primary },
  altConfLabel : { ...Typography.tiny },

  footer: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: Colors.white, padding: Spacing.lg,
    gap: Spacing.sm,
    borderTopWidth: 1, borderTopColor: Colors.border, paddingBottom: Spacing.safeBottom,
  },
  notNowBtn : { alignItems: 'center', paddingVertical: Spacing.sm },
  notNowText: { ...Typography.caption, color: Colors.textMuted },

  aiInsightCard: {
    backgroundColor: Colors.primaryTint,
    borderRadius   : BorderRadius.xl,
    padding        : Spacing.lg,
    marginBottom   : Spacing.lg,
    borderWidth    : 1,
    borderColor    : Colors.primary + '30',
    ...Shadows.card,
  },
  aiInsightHeader: {
    flexDirection : 'row',
    alignItems    : 'center',
    gap           : Spacing.sm,
    marginBottom  : Spacing.sm,
  },
  aiInsightTitle: { ...Typography.captionMed, color: Colors.primary, flex: 1 },
  aiInsightText : { ...Typography.body, color: Colors.textPrimary, lineHeight: 22 },
});
