import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { Colors } from '../../constants/colors';
import { BorderRadius, Spacing } from '../../constants/spacing';

type BadgeVariant = 'default' | 'success' | 'warning' | 'error' | 'info';
type BadgeSize = 'sm' | 'md';

interface BadgeProps {
  label    : string;
  variant? : BadgeVariant;
  size?    : BadgeSize;
  style?   : ViewStyle;
}

const VARIANT_STYLES: Record<BadgeVariant, { bg: string; text: string }> = {
  default : { bg: Colors.primaryTint,   text: Colors.primary },
  success : { bg: Colors.successTint,   text: Colors.success },
  warning : { bg: Colors.warningTint,   text: Colors.warning },
  error   : { bg: Colors.errorTint,     text: Colors.error   },
  info    : { bg: '#EFF6FF',            text: '#3B82F6'      },
};

export default function Badge({ label, variant = 'default', size = 'md', style }: BadgeProps) {
  const colors = VARIANT_STYLES[variant];
  return (
    <View style={[
      styles.badge,
      { backgroundColor: colors.bg },
      size === 'sm' && styles.badgeSm,
      style,
    ]}>
      <Text style={[styles.label, { color: colors.text }, size === 'sm' && styles.labelSm]}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf      : 'flex-start',
    borderRadius   : BorderRadius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical  : 4,
  },
  badgeSm: {
    paddingHorizontal: Spacing.sm,
    paddingVertical  : 2,
  },
  label: {
    fontSize  : 12,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  labelSm: {
    fontSize: 10,
  },
});
