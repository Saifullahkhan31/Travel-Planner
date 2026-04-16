import React from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Bus, Route, CrowdPrediction, ComfortScore } from '../../types';
import { Colors } from '../../constants/colors';
import { Spacing, BorderRadius } from '../../constants/spacing';
import { Typography } from '../../constants/typography';
import { Shadows } from '../../constants/shadows';
import CrowdPill from './CrowdPill';
import ComfortScoreRing from './ComfortScoreRing';

interface BusCardProps {
  bus           : Bus;
  route         : Route;
  crowdPrediction: CrowdPrediction;
  comfortScore  : ComfortScore;
  fare          : number;
  onPress       : () => void;
}

export default function BusCard({ bus, route, crowdPrediction, comfortScore, fare, onPress }: BusCardProps) {
  const now = new Date();
  const depMinutes = 15 + Math.floor(Math.random() * 30);
  const depTime = new Date(now.getTime() + depMinutes * 60000);
  const depStr  = depTime.toLocaleTimeString('en-PK', { hour: '2-digit', minute: '2-digit' });

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.header}>
        <View style={styles.routeInfo}>
          <Text style={styles.routeName} numberOfLines={1}>{route.routeName}</Text>
          <Text style={styles.busInfo}>{bus.plateNumber} · {bus.busType}</Text>
        </View>
        <ComfortScoreRing score={comfortScore.score} size="sm" />
      </View>

      <View style={styles.middle}>
        <CrowdPill crowdLevel={crowdPrediction.crowdLevel} />
        <View style={styles.busTypeBadge}>
          <Text style={styles.busTypeText}>{bus.busType}</Text>
        </View>
      </View>

      <View style={styles.footer}>
        <View style={styles.timeInfo}>
          <Ionicons name="time-outline" size={14} color={Colors.textSecondary} />
          <Text style={styles.timeText}>Departs {depStr} · {depMinutes} min</Text>
        </View>
        <View style={styles.fareRow}>
          <Text style={styles.fare}>PKR {fare}</Text>
          <View style={styles.arrowBtn}>
            <Ionicons name="chevron-forward" size={16} color={Colors.primary} />
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.card,
    borderRadius   : BorderRadius.lg,
    padding        : Spacing.cardPadding,
    marginBottom   : Spacing.itemGap,
    ...Shadows.card,
  },
  header: {
    flexDirection  : 'row',
    justifyContent : 'space-between',
    alignItems     : 'flex-start',
    marginBottom   : Spacing.sm,
  },
  routeInfo: { flex: 1, marginRight: Spacing.md },
  routeName : { ...Typography.h4, marginBottom: 2 },
  busInfo   : { ...Typography.caption },
  middle: {
    flexDirection: 'row',
    alignItems   : 'center',
    gap          : Spacing.sm,
    marginBottom : Spacing.sm,
  },
  busTypeBadge: {
    backgroundColor: Colors.primaryTint,
    borderRadius   : BorderRadius.full,
    paddingHorizontal: 8,
    paddingVertical  : 3,
  },
  busTypeText: { fontSize: 11, fontWeight: '500', color: Colors.primary },
  footer: {
    flexDirection  : 'row',
    justifyContent : 'space-between',
    alignItems     : 'center',
    borderTopWidth : 1,
    borderTopColor : Colors.divider,
    paddingTop     : Spacing.sm,
    marginTop      : Spacing.xs,
  },
  timeInfo: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  timeText : { ...Typography.caption },
  fareRow  : { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  fare     : { ...Typography.h4, color: Colors.primary },
  arrowBtn : {
    width        : 28,
    height       : 28,
    borderRadius : 14,
    backgroundColor: Colors.primaryTint,
    alignItems   : 'center',
    justifyContent: 'center',
  },
});
