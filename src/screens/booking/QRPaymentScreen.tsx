import React, { useEffect, useState, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import QRCode from 'react-native-qrcode-svg';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { TicketsStackParamList } from '../../types';
import { Colors } from '../../constants/colors';
import { Spacing, BorderRadius } from '../../constants/spacing';
import { Typography } from '../../constants/typography';
import { Shadows } from '../../constants/shadows';
import { bookingService } from '../../services/bookingService';
import ScreenHeader from '../../components/common/ScreenHeader';
import Button       from '../../components/common/Button';

type Props = NativeStackScreenProps<TicketsStackParamList, 'QRPayment'>;

export default function QRPaymentScreen({ navigation, route }: Props) {
  const { bookingId, fareAmount } = route.params;
  const [selectedMethod, setMethod] = useState<'qr' | 'wallet' | 'cash'>('qr');
  const [seconds, setSeconds] = useState(299); // 4:59
  const qrValue = React.useMemo(() => bookingService.generateQRCode(bookingId), [bookingId]);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Countdown
    const interval = setInterval(() => {
      setSeconds(s => { if (s <= 1) { clearInterval(interval); return 0; } return s - 1; });
    }, 1000);

    // QR pulse
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.04, duration: 1000, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
      ])
    ).start();

    return () => clearInterval(interval);
  }, []);

  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  const timerStr = `${mins}:${secs.toString().padStart(2, '0')}`;

  const handleSimulate = () => {
    navigation.navigate('PaymentProcessing', { bookingId, paymentId: `pay_${Date.now()}` });
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScreenHeader title="Payment" onBack={() => navigation.goBack()} />

      <View style={styles.content}>
        {/* Amount */}
        <View style={styles.amountCard}>
          <Text style={styles.amountLabel}>Amount Due</Text>
          <Text style={styles.amount}>PKR {fareAmount}</Text>
        </View>

        {/* Method Selector */}
        <View style={styles.methodRow}>
          {[
            { id: 'qr' as const,     label: '📱 QR Code', disabled: false },
            { id: 'wallet' as const, label: '💳 Wallet',  disabled: false },
            { id: 'cash' as const,   label: '💵 Cash',    disabled: true },
          ].map(m => (
            <TouchableOpacity
              key={m.id}
              style={[styles.methodChip, selectedMethod === m.id && styles.methodChipActive, m.disabled && styles.methodDisabled]}
              onPress={() => !m.disabled && setMethod(m.id)} activeOpacity={m.disabled ? 1 : 0.7}
            >
              <Text style={[styles.methodText, selectedMethod === m.id && styles.methodTextActive]}>
                {m.label}{m.disabled ? ' (N/A)' : ''}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* QR Code */}
        <Animated.View style={[styles.qrCard, { transform: [{ scale: pulseAnim }] }]}>
          <QRCode
            value={qrValue}
            size={180}
            color={Colors.textPrimary}
            backgroundColor={Colors.white}
          />
          <Text style={styles.qrInstruction}>Scan this QR to complete payment</Text>
          <View style={styles.timerRow}>
            <Text style={styles.timerLabel}>QR expires in</Text>
            <Text style={[styles.timer, seconds < 60 && { color: Colors.error }]}>{timerStr}</Text>
          </View>
        </Animated.View>

        {/* Simulate button */}
        <Button
          label="✓ Pay"
          onPress={handleSimulate}
          style={styles.simulateBtn}
        />

        <TouchableOpacity style={styles.cancelLink} activeOpacity={0.7} onPress={() => navigation.goBack()}>
          <Text style={styles.cancelText}>Cancel Booking</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe   : { flex: 1, backgroundColor: Colors.background },
  content: { flex: 1, paddingHorizontal: Spacing.screenPadding, paddingBottom: Spacing.safeBottom },
  amountCard: {
    backgroundColor: Colors.primary, borderRadius: BorderRadius.xl,
    padding: Spacing.xl, alignItems: 'center', marginBottom: Spacing.lg, ...Shadows.button,
  },
  amountLabel: { ...Typography.caption, color: 'rgba(255,255,255,0.8)', marginBottom: 4 },
  amount     : { fontSize: 36, fontWeight: '800', color: Colors.white },
  methodRow  : { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.lg },
  methodChip : { flex: 1, paddingVertical: Spacing.sm, borderRadius: BorderRadius.md, borderWidth: 1.5, borderColor: Colors.border, alignItems: 'center' },
  methodChipActive  : { borderColor: Colors.primary, backgroundColor: Colors.primaryTint },
  methodDisabled    : { opacity: 0.4 },
  methodText        : { ...Typography.caption, color: Colors.textSecondary },
  methodTextActive  : { color: Colors.primary, fontWeight: '600' },
  qrCard: {
    backgroundColor: Colors.card, borderRadius: BorderRadius.xl,
    padding: Spacing.xxl, alignItems: 'center', marginBottom: Spacing.lg,
    borderWidth: 2, borderColor: Colors.primary + '30', ...Shadows.card,
  },
  qrInstruction: { ...Typography.caption, marginTop: Spacing.lg, textAlign: 'center' },
  timerRow     : { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginTop: Spacing.sm },
  timerLabel   : { ...Typography.caption, color: Colors.textSecondary },
  timer        : { ...Typography.h4, color: Colors.primary, fontVariant: ['tabular-nums'] },
  simulateBtn  : { marginBottom: Spacing.md },
  cancelLink   : { alignItems: 'center' },
  cancelText   : { ...Typography.caption, color: Colors.error, fontWeight: '500' },
});
