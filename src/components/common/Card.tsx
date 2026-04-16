import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ViewStyle } from 'react-native';
import { Colors } from '../../constants/colors';
import { Spacing, BorderRadius } from '../../constants/spacing';
import { Shadows } from '../../constants/shadows';
import { Typography } from '../../constants/typography';

interface CardProps {
  children : React.ReactNode;
  style?   : ViewStyle;
  onPress? : () => void;
  disabled?: boolean;
}

export default function Card({ children, style, onPress, disabled }: CardProps) {
  if (onPress) {
    return (
      <TouchableOpacity
        style={[styles.card, style]}
        onPress={onPress}
        activeOpacity={0.7}
        disabled={disabled}
      >
        {children}
      </TouchableOpacity>
    );
  }
  return <View style={[styles.card, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.card,
    borderRadius   : BorderRadius.lg,
    padding        : Spacing.cardPadding,
    ...Shadows.card,
  },
});
