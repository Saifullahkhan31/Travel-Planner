import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { CrowdLevel } from '../../types';
import { Colors } from '../../constants/colors';
import { BorderRadius } from '../../constants/spacing';

import { ViewStyle, StyleProp } from 'react-native';

interface CrowdPillProps {
  crowdLevel: CrowdLevel;
  showDot?  : boolean;
  style?    : StyleProp<ViewStyle>;
}

export default function CrowdPill({ crowdLevel, showDot = true, style }: CrowdPillProps) {
  const config = {
    low   : { bg: Colors.successTint, text: Colors.success, label: 'Low Crowd' },
    medium: { bg: Colors.warningTint, text: Colors.warning, label: 'Medium Crowd' },
    high  : { bg: Colors.errorTint,   text: Colors.error,   label: 'High Crowd' },
  }[crowdLevel];

  return (
    <View style={[styles.pill, { backgroundColor: config.bg }, style]}>
      <Text style={[styles.label, { color: config.text }]}>
        {showDot ? '● ' : ''}{config.label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    borderRadius  : BorderRadius.full,
    paddingHorizontal: 10,
    paddingVertical  : 4,
    alignSelf        : 'flex-start',
  },
  label: {
    fontSize  : 12,
    fontWeight: '500',
  },
});
