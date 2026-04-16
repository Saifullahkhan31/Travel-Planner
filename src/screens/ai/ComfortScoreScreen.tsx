import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AIStackParamList, ComfortScore } from '../../types';
import { Colors } from '../../constants/colors';
import { Spacing, BorderRadius } from '../../constants/spacing';
import { Typography } from '../../constants/typography';
import { Shadows } from '../../constants/shadows';
import { aiService } from '../../services/aiService';
import { MOCK_BUSES, MOCK_ROUTES } from '../../services/mockData';
import ScreenHeader from '../../components/common/ScreenHeader';
import ComfortScoreRing from '../../components/cards/ComfortScoreRing';

type Props = NativeStackScreenProps<AIStackParamList, 'ComfortScore'>;

const EXPLAINER_STEPS = [
  { icon: '💺', label: 'Occupancy Factor (0–50)', desc: 'Less crowded buses score higher. Empty bus = 50 pts.' },
  { icon: '❄️', label: 'Bus Type Factor (0–50)', desc: 'AC buses add 50 pts, Premium 50 pts, Non-AC 30 pts.' },
  { icon: '📊', label: 'Combined Score (0–100)', desc: 'Both factors are summed and capped at 100.' },
];

// Simulate 7-day history
function generate7DayHistory(baseScore: number) {
  return Array.from({ length: 7 }, (_, i) => ({
    day: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][i],
    score: Math.max(10, Math.min(100, baseScore + (Math.random() * 20 - 10))),
  }));
}

export default function ComfortScoreScreen({ navigation, route }: Props) {
  const { busId } = route.params;
  const bus      = MOCK_BUSES.find(b => b.id === busId)!;
  const busRoute = MOCK_ROUTES.find(r => r.id === bus?.routeId);
  const comfort  = aiService.getComfortScore(busId, bus.currentOccupancy, bus.totalSeats, bus.busType);

  // Siblings on same route
  const siblings = MOCK_BUSES.filter(b => b.routeId === bus.routeId && b.id !== busId);

  const [explainerOpen, setExplainerOpen] = useState(false);
  const explainerAnim = useRef(new Animated.Value(0)).current;

  // Factor bar anims
  const occAnim  = useRef(new Animated.Value(0)).current;
  const typeAnim = useRef(new Animated.Value(0)).current;

  const history7 = generate7DayHistory(comfort.score);
  const maxHistory = Math.max(...history7.map(d => d.score), 1);

  useEffect(() => {
    Animated.stagger(200, [
      Animated.timing(occAnim,  { toValue: 1, duration: 900, useNativeDriver: false }),
      Animated.timing(typeAnim, { toValue: 1, duration: 900, useNativeDriver: false }),
    ]).start();
  }, []);

  const toggleExplainer = () => {
    const toValue = explainerOpen ? 0 : 1;
    Animated.timing(explainerAnim, { toValue, duration: 300, useNativeDriver: false }).start();
    setExplainerOpen(!explainerOpen);
  };

  const explainerH = explainerAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 200] });

  const scoreColor = comfort.score >= 80 ? Colors.success
    : comfort.score >= 60 ? Colors.primary
    : comfort.score >= 40 ? Colors.warning : Colors.error;

  return (
    <SafeAreaView style={styles.safe}>
      <ScreenHeader title="Comfort Score" onBack={() => navigation.goBack()} />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* Hero Ring */}
        <View style={styles.heroCard}>
          <ComfortScoreRing score={comfort.score} size="lg" showLabel />
          <Text style={styles.heroEmoji}>{comfort.emoji}</Text>
          <Text style={[styles.heroLabel, { color: scoreColor }]}>{comfort.label} Comfort</Text>
          <Text style={styles.heroSub}>{bus?.plateNumber} · {bus?.busType} · {busRoute?.routeName}</Text>
        </View>

        {/* Factor Breakdown */}
        <Text style={styles.sectionTitle}>Score Breakdown</Text>
        <View style={styles.card}>
          {/* Occupancy Factor */}
          <View style={styles.factorRow}>
            <View style={styles.factorIcon}>
              <Ionicons name="people-outline" size={18} color={Colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <View style={styles.factorHeader}>
                <Text style={styles.factorLabel}>Occupancy Factor</Text>
                <Text style={styles.factorScore}>{comfort.occupancyFactor} / 50</Text>
              </View>
              <View style={styles.factorBarBg}>
                <Animated.View style={[
                  styles.factorBarFill,
                  {
                    width: occAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['0%', `${(comfort.occupancyFactor / 50) * 100}%`],
                    }),
                    backgroundColor: Colors.primary,
                  },
                ]} />
              </View>
              <Text style={styles.factorDesc}>
                {bus.currentOccupancy}/{bus.totalSeats} seats filled
              </Text>
            </View>
          </View>

          <View style={styles.divider} />

          {/* Bus Type Factor */}
          <View style={styles.factorRow}>
            <View style={styles.factorIcon}>
              <Ionicons name="car-outline" size={18} color={Colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <View style={styles.factorHeader}>
                <Text style={styles.factorLabel}>Bus Type Factor</Text>
                <Text style={styles.factorScore}>{comfort.busTypeFactor} / 50</Text>
              </View>
              <View style={styles.factorBarBg}>
                <Animated.View style={[
                  styles.factorBarFill,
                  {
                    width: typeAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['0%', `${(comfort.busTypeFactor / 50) * 100}%`],
                    }),
                    backgroundColor: bus.busType === 'AC' ? Colors.success : Colors.warning,
                  },
                ]} />
              </View>
              <View style={[styles.busTypeBadge, { backgroundColor: bus.busType === 'AC' ? Colors.primaryTint : Colors.warningTint }]}>
                <Text style={[styles.busTypeBadgeText, { color: bus.busType === 'AC' ? Colors.primary : Colors.warning }]}>
                  {bus.busType === 'AC' ? '❄️ AC Bus' : bus.busType === 'Premium' ? '⭐ Premium' : '🌬️ Non-AC'}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Explainer (collapsible) */}
        <TouchableOpacity style={styles.explainerToggle} onPress={toggleExplainer} activeOpacity={0.7}>
          <Text style={styles.explainerToggleText}>How is this calculated?</Text>
          <Ionicons name={explainerOpen ? 'chevron-up' : 'chevron-down'} size={16} color={Colors.primary} />
        </TouchableOpacity>
        <Animated.View style={[styles.explainerBox, { maxHeight: explainerH, overflow: 'hidden' }]}>
          {EXPLAINER_STEPS.map(step => (
            <View key={step.label} style={styles.explainerStep}>
              <Text style={styles.explainerStepIcon}>{step.icon}</Text>
              <View>
                <Text style={styles.explainerStepLabel}>{step.label}</Text>
                <Text style={styles.explainerStepDesc}>{step.desc}</Text>
              </View>
            </View>
          ))}
        </Animated.View>

        {/* 7-Day History */}
        <Text style={styles.sectionTitle}>7-Day Comfort History</Text>
        <View style={styles.card}>
          <View style={styles.historyChart}>
            {history7.map(d => (
              <View key={d.day} style={styles.historyColumn}>
                <Text style={styles.historyScore}>{Math.round(d.score)}</Text>
                <View style={styles.historyBarBg}>
                  <View style={[
                    styles.historyBarFill,
                    {
                      height: `${(d.score / maxHistory) * 100}%` as any,
                      backgroundColor: d.score >= 70 ? Colors.success : d.score >= 50 ? Colors.primary : Colors.warning,
                    },
                  ]} />
                </View>
                <Text style={styles.historyDay}>{d.day}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Comparison */}
        {siblings.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Comparison on This Route</Text>
            {/* Current bus */}
            <View style={[styles.compCard, { borderColor: Colors.primary, borderWidth: 1.5 }]}>
              <Text style={styles.compYou}>★ This Bus</Text>
              <Text style={styles.compPlate}>{bus.plateNumber}</Text>
              <ComfortScoreRing score={comfort.score} size="sm" />
            </View>
            {siblings.slice(0, 2).map(s => {
              const sc = aiService.getComfortScore(s.id, s.currentOccupancy, s.totalSeats, s.busType);
              return (
                <View key={s.id} style={styles.compCard}>
                  <Text style={styles.compType}>{s.busType}</Text>
                  <Text style={styles.compPlate}>{s.plateNumber}</Text>
                  <ComfortScoreRing score={sc.score} size="sm" />
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

  heroCard: {
    backgroundColor: Colors.card, borderRadius: BorderRadius.xl,
    padding: Spacing.xxl, alignItems: 'center', ...Shadows.card, marginBottom: Spacing.lg, gap: Spacing.sm,
  },
  heroEmoji: { fontSize: 36 },
  heroLabel : { ...Typography.h3 },
  heroSub   : { ...Typography.caption, textAlign: 'center' },

  sectionTitle: { ...Typography.h4, marginBottom: Spacing.sm, marginTop: Spacing.sm },
  card : { backgroundColor: Colors.card, borderRadius: BorderRadius.xl, padding: Spacing.lg, ...Shadows.card, marginBottom: Spacing.sm },
  divider: { height: 1, backgroundColor: Colors.divider, marginVertical: Spacing.md },

  factorRow    : { flexDirection: 'row', gap: Spacing.md, alignItems: 'flex-start' },
  factorIcon   : { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.primaryTint, alignItems: 'center', justifyContent: 'center' },
  factorHeader : { flexDirection: 'row', justifyContent: 'space-between', marginBottom: Spacing.xs },
  factorLabel  : { ...Typography.bodyMedium },
  factorScore  : { ...Typography.bodyMedium, color: Colors.primary },
  factorBarBg  : { height: 8, backgroundColor: Colors.border, borderRadius: 4, overflow: 'hidden', marginBottom: Spacing.xs },
  factorBarFill: { height: '100%', borderRadius: 4 },
  factorDesc   : { ...Typography.tiny, color: Colors.textMuted },
  busTypeBadge : { alignSelf: 'flex-start', borderRadius: BorderRadius.full, paddingHorizontal: 10, paddingVertical: 3, marginTop: Spacing.xs },
  busTypeBadgeText: { fontSize: 11, fontWeight: '600' },

  explainerToggle: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: Colors.primaryTint, borderRadius: BorderRadius.lg,
    padding: Spacing.md, marginBottom: Spacing.xs,
  },
  explainerToggleText: { ...Typography.captionMed, color: Colors.primary },
  explainerBox: { backgroundColor: Colors.card, borderRadius: BorderRadius.lg, padding: Spacing.md, marginBottom: Spacing.sm },
  explainerStep: { flexDirection: 'row', gap: Spacing.md, marginBottom: Spacing.sm, alignItems: 'flex-start' },
  explainerStepIcon : { fontSize: 20 },
  explainerStepLabel: { ...Typography.captionMed },
  explainerStepDesc : { ...Typography.tiny, color: Colors.textMuted, marginTop: 2 },

  historyChart  : { flexDirection: 'row', gap: Spacing.sm, alignItems: 'flex-end', height: 100 },
  historyColumn : { flex: 1, alignItems: 'center', height: '100%', justifyContent: 'flex-end' },
  historyScore  : { fontSize: 9, fontWeight: '700', color: Colors.textMuted, marginBottom: 2 },
  historyBarBg  : { width: '80%', height: 70, justifyContent: 'flex-end', backgroundColor: Colors.border, borderRadius: 4, overflow: 'hidden' },
  historyBarFill: { width: '100%', borderRadius: 4 },
  historyDay    : { fontSize: 9, color: Colors.textMuted, marginTop: 4 },

  compCard   : { backgroundColor: Colors.card, borderRadius: BorderRadius.lg, padding: Spacing.md, flexDirection: 'row', alignItems: 'center', gap: Spacing.md, marginBottom: Spacing.sm, ...Shadows.card },
  compYou    : { ...Typography.tiny, color: Colors.primary, fontWeight: '700', flex: 1 },
  compType   : { ...Typography.tiny, flex: 1 },
  compPlate  : { ...Typography.captionMed, flex: 1 },
});
