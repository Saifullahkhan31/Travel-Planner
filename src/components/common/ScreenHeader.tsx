import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { Spacing, BorderRadius } from '../../constants/spacing';
import { Typography } from '../../constants/typography';
import { Shadows } from '../../constants/shadows';

interface ScreenHeaderProps {
  title        : string;
  onBack?      : () => void;
  subtitle?    : string;
  rightComponent?: React.ReactNode;
}

export default function ScreenHeader({ title, onBack, subtitle, rightComponent }: ScreenHeaderProps) {
  return (
    <View style={styles.container}>
      <View style={styles.left}>
        {onBack && (
          <TouchableOpacity onPress={onBack} style={styles.backBtn} activeOpacity={0.7}>
            <Ionicons name="chevron-back" size={22} color={Colors.textPrimary} />
          </TouchableOpacity>
        )}
      </View>
      <View style={styles.center}>
        <Text style={styles.title}>{title}</Text>
        {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      </View>
      <View style={styles.right}>
        {rightComponent}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection  : 'row',
    alignItems     : 'center',
    paddingHorizontal: Spacing.screenPadding,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.background,
  },
  left : { width: 40 },
  right: { width: 40, alignItems: 'flex-end' },
  center: { flex: 1, alignItems: 'center' },
  backBtn: {
    width        : 36,
    height       : 36,
    borderRadius : 18,
    backgroundColor: Colors.card,
    alignItems   : 'center',
    justifyContent: 'center',
    ...Shadows.card,
  },
  title   : { ...Typography.h4 },
  subtitle: { ...Typography.caption, marginTop: 2 },
});
