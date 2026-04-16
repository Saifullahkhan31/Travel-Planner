import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { Colors } from '../../constants/colors';
import { Spacing } from '../../constants/spacing';

interface DividerProps {
  spacing? : 'sm' | 'md' | 'lg';
  color?   : string;
  indent?  : number;
  style?   : ViewStyle;
}

export default function Divider({ spacing = 'md', color, indent = 0, style }: DividerProps) {
  const spaceMap = { sm: Spacing.sm, md: Spacing.md, lg: Spacing.lg };
  const gap = spaceMap[spacing];
  return (
    <View style={[{ marginVertical: gap }, style]}>
      <View style={[
        styles.line,
        { backgroundColor: color ?? Colors.divider, marginLeft: indent },
      ]} />
    </View>
  );
}

const styles = StyleSheet.create({
  line: { height: 1 },
});
