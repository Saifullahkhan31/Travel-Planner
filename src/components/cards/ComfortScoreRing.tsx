import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { Colors } from '../../constants/colors';

interface ComfortScoreRingProps {
  score     : number;
  size?     : 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

const SIZES = { sm: 56, md: 64, lg: 96 };
const RING_WIDTH = 6;

export default function ComfortScoreRing({ score, size = 'md', showLabel = false }: ComfortScoreRingProps) {
  const diameter = SIZES[size];
  const radius   = (diameter - RING_WIDTH) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = ((100 - score) / 100) * circumference;
  const cx = diameter / 2;

  let ringColor = Colors.primary;
  let ringTint = Colors.primaryTint;

  if (score >= 80) {
    ringColor = Colors.success;
    ringTint = Colors.successTint;
  } else if (score >= 60) {
    ringColor = Colors.primary;
    ringTint = Colors.primaryTint;
  } else if (score >= 40) {
    ringColor = Colors.warning;
    ringTint = Colors.warningTint;
  } else {
    ringColor = Colors.error;
    ringTint = Colors.errorTint;
  }

  return (
    <View style={styles.wrapper}>
      <Svg width={diameter} height={diameter}>
        <Circle
          cx={cx} cy={cx} r={radius}
          stroke={ringTint}
          strokeWidth={RING_WIDTH}
          fill="none"
        />
        <Circle
          cx={cx} cy={cx} r={radius}
          stroke={ringColor}
          strokeWidth={RING_WIDTH}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={progress}
          strokeLinecap="round"
          rotation="-90"
          origin={`${cx}, ${cx}`}
        />
      </Svg>
      <View style={[styles.center, { width: diameter, position: 'absolute' }]}>
        <Text style={[styles.score, { fontSize: size === 'lg' ? 22 : size === 'sm' ? 14 : 18 }]}>
          {score}
        </Text>
        {(showLabel || size === 'lg') && (
          <Text style={styles.sub}>Comfort</Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems    : 'center',
    justifyContent: 'center',
  },
  center: {
    alignItems    : 'center',
    justifyContent: 'center',
  },
  score: {
    fontWeight: '700',
    color     : Colors.textPrimary,
  },
  sub: {
    fontSize : 10,
    color    : Colors.textMuted,
    marginTop: 1,
  },
});
