import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, ViewStyle } from 'react-native';
import { Colors } from '../../constants/colors';

type SpinnerSize = 'sm' | 'md' | 'lg';

interface LoadingSpinnerProps {
  size?    : SpinnerSize;
  label?   : string;
  style?   : ViewStyle;
  color?   : string;
}

const SIZE_MAP: Record<SpinnerSize, number> = { sm: 24, md: 40, lg: 64 };

export default function LoadingSpinner({ size = 'md', label, style, color }: LoadingSpinnerProps) {
  const spinAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(spinAnim, {
        toValue: 1,
        duration: 900,
        useNativeDriver: true,
      })
    ).start();
  }, []);

  const spin = spinAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  const dim = SIZE_MAP[size];
  const borderWidth = size === 'sm' ? 2 : size === 'lg' ? 5 : 3;
  const activeColor = color ?? Colors.primary;

  return (
    <View style={[styles.wrapper, style]}>
      <Animated.View style={[
        styles.ring,
        {
          width: dim, height: dim,
          borderRadius: dim / 2,
          borderWidth,
          borderTopColor: activeColor,
          borderRightColor: activeColor + '30',
          borderBottomColor: activeColor + '30',
          borderLeftColor: activeColor + '30',
          transform: [{ rotate: spin }],
        },
      ]} />
      {label && <Text style={styles.label}>{label}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { alignItems: 'center', justifyContent: 'center' },
  ring   : {},
  label  : { marginTop: 12, fontSize: 13, color: Colors.textSecondary },
});
