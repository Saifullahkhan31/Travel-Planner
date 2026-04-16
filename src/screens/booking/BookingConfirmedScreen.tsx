import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Animated, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { TicketsStackParamList, Booking } from '../../types';
import { Colors } from '../../constants/colors';
import { Spacing, BorderRadius } from '../../constants/spacing';
import { Typography } from '../../constants/typography';
import { Shadows } from '../../constants/shadows';
import { bookingService } from '../../services/bookingService';
import Button from '../../components/common/Button';

type Props = NativeStackScreenProps<TicketsStackParamList, 'BookingConfirmed'>;

export default function BookingConfirmedScreen({ navigation, route }: Props) {
  const { bookingId } = route.params;
  const [booking, setBooking] = useState<Booking | null>(null);
  const scaleAnim  = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    (async () => {
      const { data } = await bookingService.getBookingById(bookingId);
      setBooking(data);
    })();

    Animated.sequence([
      Animated.delay(200),
      Animated.spring(scaleAnim, { toValue: 1, tension: 60, friction: 5, useNativeDriver: true }),
    ]).start();
    Animated.timing(opacityAnim, { toValue: 1, duration: 600, delay: 400, useNativeDriver: true }).start();
  }, []);

  const goHome = () => {
    navigation.reset({ index: 0, routes: [{ name: 'MyBookings' }] });
    (navigation as any).getParent()?.navigate('HomeTab');
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* Animated Checkmark */}
        <Animated.View style={[styles.checkCircle, { transform: [{ scale: scaleAnim }] }]}>
          <Text style={styles.checkIcon}>✓</Text>
        </Animated.View>

        <Animated.View style={{ opacity: opacityAnim, alignItems: 'center' }}>
          <Text style={styles.title}>Booking Confirmed!</Text>
          <Text style={styles.subtitle}>Your seat has been reserved successfully.</Text>

          {/* Booking Reference */}
          <View style={styles.refCard}>
            <Text style={styles.refLabel}>Booking Reference</Text>
            <Text style={styles.refNum}>{bookingId.slice(0, 16).toUpperCase()}</Text>
          </View>

          {/* Journey Summary */}
          <View style={styles.summaryCard}>
            {booking && (
              <>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryIcon}>🚌</Text>
                  <View>
                    <Text style={styles.summaryLabel}>Route</Text>
                    <Text style={styles.summaryValue}>{booking.routeName}</Text>
                  </View>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryIcon}>📅</Text>
                  <View>
                    <Text style={styles.summaryLabel}>Travel Date</Text>
                    <Text style={styles.summaryValue}>{booking.travelDate}</Text>
                  </View>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryIcon}>💺</Text>
                  <View>
                    <Text style={styles.summaryLabel}>Seat Number</Text>
                    <Text style={styles.summaryValue}>Seat {booking.seatNumber}</Text>
                  </View>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryIcon}>💰</Text>
                  <View>
                    <Text style={styles.summaryLabel}>Amount Paid</Text>
                    <Text style={[styles.summaryValue, { color: Colors.primary }]}>PKR {booking.fareAmount}</Text>
                  </View>
                </View>
              </>
            )}

            {/* Status */}
            <View style={styles.statusPill}>
              <Text style={styles.statusText}>✓ Payment Successful</Text>
            </View>
          </View>

          <Button
            label="View Digital Ticket"
            onPress={() => navigation.navigate('DigitalTicket', { bookingId })}
            style={{ width: '100%', marginBottom: Spacing.md }}
          />
          <Button
            label="Back to Home"
            onPress={goHome}
            variant="secondary"
            style={{ width: '100%' }}
          />
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe   : { flex: 1, backgroundColor: Colors.background },
  content: {
    paddingHorizontal : Spacing.screenPadding,
    paddingBottom     : Spacing.safeBottom,
    alignItems        : 'center',
    paddingTop        : Spacing.xxxl,
  },
  checkCircle: {
    width        : 100,
    height       : 100,
    borderRadius : 50,
    backgroundColor: Colors.success,
    alignItems   : 'center',
    justifyContent: 'center',
    marginBottom : Spacing.xxl,
    ...Shadows.button,
  },
  checkIcon: { fontSize: 48, color: Colors.white, fontWeight: '700' },
  title    : { ...Typography.h2, marginBottom: Spacing.sm, textAlign: 'center' },
  subtitle : { ...Typography.body, color: Colors.textSecondary, textAlign: 'center', marginBottom: Spacing.xxl },
  refCard  : {
    backgroundColor: Colors.primaryTint, borderRadius: BorderRadius.xl,
    padding: Spacing.lg, alignItems: 'center', marginBottom: Spacing.xl, width: '100%',
    borderWidth: 2, borderStyle: 'dashed', borderColor: Colors.primary + '50',
  },
  refLabel : { ...Typography.caption, color: Colors.primary, marginBottom: 4 },
  refNum  : { ...Typography.h3, color: Colors.primary, letterSpacing: 2 },
  summaryCard: {
    backgroundColor: Colors.card, borderRadius: BorderRadius.xl,
    padding: Spacing.lg, width: '100%', marginBottom: Spacing.xxl, ...Shadows.card,
  },
  summaryRow  : { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.md, paddingVertical: Spacing.sm, borderBottomWidth: 1, borderBottomColor: Colors.divider },
  summaryIcon : { fontSize: 20, width: 28 },
  summaryLabel: { ...Typography.tiny, marginBottom: 2 },
  summaryValue: { ...Typography.bodyMedium },
  statusPill  : {
    backgroundColor: Colors.successTint, borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.xl, paddingVertical: Spacing.sm,
    alignSelf: 'center', marginTop: Spacing.md,
  },
  statusText: { ...Typography.captionMed, color: Colors.success, fontWeight: '700' },
});
