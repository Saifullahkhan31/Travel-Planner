import React from 'react';
import {
  TouchableOpacity, Text, StyleSheet, ActivityIndicator,
  ViewStyle, TextStyle, View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { Spacing, BorderRadius } from '../../constants/spacing';
import { Typography } from '../../constants/typography';
import { Shadows } from '../../constants/shadows';

interface ButtonProps {
  label     : string;
  onPress   : () => void;
  variant?  : 'primary' | 'secondary' | 'ghost';
  loading?  : boolean;
  disabled? : boolean;
  iconLeft? : keyof typeof Ionicons.glyphMap;
  iconRight?: keyof typeof Ionicons.glyphMap;
  style?    : ViewStyle;
}

export default function Button({
  label, onPress, variant = 'primary', loading, disabled, iconLeft, iconRight, style,
}: ButtonProps) {
  const isPrimary   = variant === 'primary';
  const isSecondary = variant === 'secondary';
  const isGhost     = variant === 'ghost';

  return (
    <TouchableOpacity
      style={[
        styles.base,
        isPrimary   && styles.primary,
        isSecondary && styles.secondary,
        isGhost     && styles.ghost,
        (disabled || loading) && styles.disabled,
        style,
      ]}
      onPress={onPress}
      activeOpacity={0.7}
      disabled={disabled || loading}
    >
      {loading ? (
        <ActivityIndicator color={isPrimary ? Colors.white : Colors.primary} size="small" />
      ) : (
        <View style={styles.row}>
          {iconLeft && (
            <Ionicons name={iconLeft} size={18} color={isPrimary ? Colors.white : Colors.textPrimary} style={{ marginRight: Spacing.sm }} />
          )}
          <Text style={[styles.label, isSecondary && styles.labelSecondary, isGhost && styles.labelGhost]}>
            {label}
          </Text>
          {iconRight && (
            <Ionicons name={iconRight} size={18} color={isPrimary ? Colors.white : Colors.textPrimary} style={{ marginLeft: Spacing.sm }} />
          )}
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    height        : 52,
    borderRadius  : BorderRadius.md,
    alignItems    : 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
  },
  primary: {
    backgroundColor: Colors.primary,
    ...Shadows.button,
  },
  secondary: {
    backgroundColor: Colors.white,
    borderWidth    : 1,
    borderColor    : Colors.border,
    ...Shadows.card,
  },
  ghost: {
    backgroundColor: Colors.transparent,
  },
  disabled: {
    opacity: 0.5,
  },
  row: {
    flexDirection: 'row',
    alignItems   : 'center',
  },
  label: {
    ...Typography.buttonLabel,
  },
  labelSecondary: {
    color     : Colors.textPrimary,
    fontWeight: '500',
  },
  labelGhost: {
    color     : Colors.primary,
    fontWeight: '500',
  },
});
