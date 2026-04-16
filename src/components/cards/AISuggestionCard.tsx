import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AITripSuggestion } from '../../types';
import { Colors } from '../../constants/colors';
import { Spacing, BorderRadius } from '../../constants/spacing';
import { Typography } from '../../constants/typography';
import { Shadows } from '../../constants/shadows';
import CrowdPill from './CrowdPill';
import ComfortScoreRing from './ComfortScoreRing';

interface AISuggestionCardProps {
  suggestion : AITripSuggestion;
  onPress    : () => void;
  onBook?    : () => void;
  style?     : ViewStyle;
}

export default function AISuggestionCard({ suggestion: s, onPress, onBook, style }: AISuggestionCardProps) {
  return (
    <TouchableOpacity style={[styles.card, style]} onPress={onPress} activeOpacity={0.8}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.aiBadge}>
          <Ionicons name="sparkles" size={11} color={Colors.white} />
          <Text style={styles.aiText}>AI Suggestion</Text>
        </View>
        {s.isRoutine && (
          <View style={styles.routinePill}>
            <Text style={styles.routineText}>📅 Routine</Text>
          </View>
        )}
      </View>

      {/* Route name */}
      <Text style={styles.routeName} numberOfLines={1}>{s.routeName}</Text>

      {/* Route arrow visual */}
      <View style={styles.routeLine}>
        <View style={styles.routeDot} />
        <View style={styles.routeTrack}>
          {[1, 2, 3].map(i => <View key={i} style={styles.routeSegment} />)}
        </View>
        <View style={[styles.routeDot, { backgroundColor: Colors.primary }]} />
      </View>

      {/* Bottom meta row */}
      <View style={styles.metaRow}>
        <View style={styles.metaLeft}>
          <Text style={styles.departure}>🕐 {s.departureTime}</Text>
          <View style={styles.pillRow}>
            <CrowdPill crowdLevel={s.crowdPrediction.crowdLevel} />
            <Text style={styles.fareText}>PKR {s.estimatedFare}</Text>
          </View>
          <Text style={styles.confidence}>
            {Math.round(s.confidenceScore * 100)}% AI match
          </Text>
        </View>

        <ComfortScoreRing score={s.comfortScore.score} size="md" showLabel />
      </View>

      {/* Book Button */}
      {onBook && (
        <TouchableOpacity style={styles.bookBtn} onPress={onBook} activeOpacity={0.8}>
          <Text style={styles.bookBtnText}>Book Now</Text>
          <Ionicons name="arrow-forward" size={14} color={Colors.white} />
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.card,
    borderRadius   : BorderRadius.xl,
    padding        : Spacing.xl,
    ...Shadows.float,
    borderWidth    : 1,
    borderColor    : Colors.primary + '20',
    marginBottom   : Spacing.md,
  },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.sm },
  aiBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: Colors.primary, borderRadius: BorderRadius.full, paddingHorizontal: 8, paddingVertical: 3 },
  aiText : { fontSize: 9, fontWeight: '700', color: Colors.white },
  routinePill: { backgroundColor: Colors.successTint, borderRadius: BorderRadius.full, paddingHorizontal: 8, paddingVertical: 3 },
  routineText: { ...Typography.tiny, color: Colors.success, fontWeight: '600' },

  routeName: { ...Typography.h4, marginBottom: Spacing.sm },

  routeLine   : { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.md },
  routeDot    : { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.border, borderWidth: 2, borderColor: Colors.primary },
  routeTrack  : { flex: 1, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginHorizontal: 4 },
  routeSegment: { height: 2, width: '28%', backgroundColor: Colors.primary + '40', borderRadius: 1 },

  metaRow : { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  metaLeft: { flex: 1, gap: Spacing.xs },
  departure: { ...Typography.caption, color: Colors.textSecondary },
  pillRow   : { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  fareText  : { ...Typography.captionMed, color: Colors.textPrimary },
  confidence: { ...Typography.tiny, color: Colors.primary, fontWeight: '600' },

  bookBtn    : { marginTop: Spacing.md, backgroundColor: Colors.primary, borderRadius: BorderRadius.md, paddingVertical: Spacing.sm, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  bookBtnText: { ...Typography.captionMed, color: Colors.white, fontWeight: '700' },
});
