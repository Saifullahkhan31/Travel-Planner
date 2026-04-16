import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { TicketsStackParamList } from '../../types';
import { Colors } from '../../constants/colors';
import { Spacing, BorderRadius } from '../../constants/spacing';
import { Typography } from '../../constants/typography';
import { bookingService } from '../../services/bookingService';

type Props = NativeStackScreenProps<TicketsStackParamList, 'PaymentProcessing'>;

const STEPS = ['Verifying payment...', 'Processing transaction...', 'Confirming booking...'];

export default function PaymentProcessingScreen({ navigation, route }: Props) {
  const { bookingId } = route.params;
  const [stepIdx, setStepIdx] = useState(0);
  const rotation = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Spinner rotation
    Animated.loop(
      Animated.timing(rotation, {
        toValue  : 1,
        duration : 900,
        easing   : Easing.linear,
        useNativeDriver: true,
      })
    ).start();

    // Step cycling
    let idx = 0;
    const stepInterval = setInterval(() => {
      idx++;
      if (idx < STEPS.length) {
        Animated.sequence([
          Animated.timing(fadeAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
          Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
        ]).start(() => setStepIdx(idx));
      }
    }, 800);

    // Navigate after 2.5s
    const timer = setTimeout(async () => {
      clearInterval(stepInterval);
      await bookingService.confirmBooking(bookingId);
      navigation.replace('BookingConfirmed', { bookingId });
    }, 2500);

    return () => { clearTimeout(timer); clearInterval(stepInterval); };
  }, []);

  const spin = rotation.interpolate({
    inputRange : [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.content}>
        {/* Animated Spinner */}
        <View style={styles.spinnerWrapper}>
          <View style={styles.spinnerTrack} />
          <Animated.View style={[styles.spinnerHead, { transform: [{ rotate: spin }] }]}>
            <View style={styles.spinnerDot} />
          </Animated.View>
          <View style={styles.spinnerCenter}>
            <Text style={styles.spinnerIcon}>💳</Text>
          </View>
        </View>

        <Text style={styles.title}>Processing Payment...</Text>
        <Text style={styles.caption}>Please do not close the app</Text>

        {/* Steps */}
        <View style={styles.stepsCard}>
          {STEPS.map((step, i) => (
            <View key={i} style={styles.stepRow}>
              <View style={[styles.stepDot,
                i < stepIdx  && styles.stepDotDone,
                i === stepIdx && styles.stepDotActive,
              ]}>
                {i < stepIdx && <Text style={{ color: Colors.white, fontSize: 10 }}>✓</Text>}
              </View>
              <Animated.Text style={[
                styles.stepText,
                i === stepIdx && styles.stepTextActive,
                i < stepIdx && styles.stepTextDone,
                i === stepIdx && { opacity: fadeAnim },
              ]}>
                {step}
              </Animated.Text>
            </View>
          ))}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe   : { flex: 1, backgroundColor: Colors.background },
  content: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.screenPadding },

  spinnerWrapper: { width: 120, height: 120, alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.xxxl },
  spinnerTrack  : { position: 'absolute', width: 100, height: 100, borderRadius: 50, borderWidth: 8, borderColor: Colors.primaryTint },
  spinnerHead   : { position: 'absolute', width: 100, height: 100, alignItems: 'center' },
  spinnerDot    : { width: 16, height: 16, borderRadius: 8, backgroundColor: Colors.primary, marginTop: -4 },
  spinnerCenter : { position: 'absolute' },
  spinnerIcon   : { fontSize: 36 },

  title  : { ...Typography.h2, marginBottom: Spacing.sm, textAlign: 'center' },
  caption: { ...Typography.body, color: Colors.textSecondary, marginBottom: Spacing.xxxl, textAlign: 'center' },

  stepsCard: {
    backgroundColor: Colors.card, borderRadius: BorderRadius.xl,
    padding: Spacing.lg, width: '100%', gap: Spacing.md,
  },
  stepRow        : { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  stepDot        : { width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: Colors.border, alignItems: 'center', justifyContent: 'center' },
  stepDotActive  : { borderColor: Colors.primary, backgroundColor: Colors.primaryTint },
  stepDotDone    : { borderColor: Colors.success, backgroundColor: Colors.success },
  stepText       : { ...Typography.body, color: Colors.textMuted },
  stepTextActive : { color: Colors.primary, fontWeight: '500' },
  stepTextDone   : { color: Colors.success, fontWeight: '500' },
});
