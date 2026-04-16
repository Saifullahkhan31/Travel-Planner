import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { TicketsStackParamList, Seat, Bus, Route, FareEstimate } from '../../types';
import { Colors } from '../../constants/colors';
import { Spacing, BorderRadius } from '../../constants/spacing';
import { Typography } from '../../constants/typography';
import { Shadows } from '../../constants/shadows';
import { MOCK_BUSES, MOCK_ROUTES, MOCK_SEATS } from '../../services/mockData';
import { aiService } from '../../services/aiService';
import { bookingService } from '../../services/bookingService';
import { useAuth } from '../../context/AuthContext';
import ScreenHeader from '../../components/common/ScreenHeader';
import Button       from '../../components/common/Button';

type Props = NativeStackScreenProps<TicketsStackParamList, 'BookingSummary'>;

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

export default function BookingSummaryScreen({ navigation, route }: Props) {
  const { busId, seatId, routeId, travelDate } = route.params;
  const { user } = useAuth();
  const [bus, setBus]       = useState<Bus | null>(null);
  const [busRoute, setRoute] = useState<Route | null>(null);
  const [seat, setSeat]     = useState<Seat | null>(null);
  const [fare, setFare]     = useState<FareEstimate | null>(null);
  const [loading,  setLoading]  = useState(true);
  const [booking,  setBooking]  = useState(false);
  const [error,    setError]    = useState<string | null>(null);

  useEffect(() => {
    const b = MOCK_BUSES.find(b => b.id === busId)!;
    const r = MOCK_ROUTES.find(r => r.id === routeId)!;
    const allSeats = MOCK_SEATS[busId] ?? [];
    const s = allSeats.find(s => s.id === seatId)!;
    setBus(b); setRoute(r); setSeat(s);
    setFare(aiService.estimateFare(r.id, b.busType, r.distance));
    setTimeout(() => setLoading(false), 300);
  }, []);

  const handleProceed = async () => {
    if (!user || !bus || !busRoute || !seat || !fare) return;
    try {
      setBooking(true); setError(null);
      const { data, error: err } = await bookingService.createBooking(
        user.id, bus.id, seat.id, busRoute.id, travelDate,
        fare.totalFare, busRoute.routeName, bus.busType, seat.seatNumber
      );
      if (err || !data) { setError(err ?? 'Booking failed.'); return; }
      navigation.navigate('QRPayment', { bookingId: data.id, fareAmount: fare.totalFare });
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setBooking(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <ScreenHeader title="Booking Summary" onBack={() => navigation.goBack()} />
        <View style={styles.loadingView}><ActivityIndicator size="large" color={Colors.primary} /></View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScreenHeader title="Booking Summary" onBack={() => navigation.goBack()} />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {error && <View style={styles.errorBanner}><Text style={styles.errorText}>{error}</Text></View>}

        {/* Journey Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Journey Details</Text>
          <InfoRow label="Route"        value={busRoute?.routeName ?? ''} />
          <InfoRow label="Travel Date"  value={travelDate} />
          <InfoRow label="Seat Number"  value={`Seat ${seat?.seatNumber} (${seat?.position})`} />
          <InfoRow label="Bus Type"     value={bus?.busType ?? ''} />
          <InfoRow label="Seating Zone" value={
            seat?.seatGenderZone === 'female_only' ? '👩 Female Zone' :
            seat?.seatGenderZone === 'male_only'   ? '👨 Male Zone'   : '👥 Mixed Zone'
          } />
          <InfoRow label="Bus"          value={`${bus?.plateNumber} · Driver ${bus?.driverName}`} />
        </View>

        {/* Passenger Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Passenger Details</Text>
          <InfoRow label="Name"  value={user?.name ?? 'Passenger'} />
          <InfoRow label="Phone" value={user?.phone ?? 'N/A'} />
        </View>

        {/* Fare Breakdown */}
        {fare && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Fare Breakdown</Text>
            <InfoRow label="Base Fare"       value={`PKR ${fare.baseFare.toFixed(0)}`} />
            <InfoRow label="Distance Charge" value={`PKR ${fare.distanceCharge.toFixed(0)}`} />
            <InfoRow label="Bus Type Charge" value={`PKR ${fare.busTypeCharge.toFixed(0)}`} />
            <View style={styles.divider} />
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total Amount</Text>
              <Text style={styles.totalValue}>PKR {fare.totalFare}</Text>
            </View>
          </View>
        )}

        {/* Policy */}
        <View style={styles.policyCard}>
          <Text style={styles.policyText}>ℹ️ Cancellations are allowed up to 2 hours before departure. No-shows are non-refundable.</Text>
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Sticky Footer */}
      <View style={styles.footer}>
        <View>
          <Text style={styles.footerTotal}>PKR {fare?.totalFare ?? 0}</Text>
          <Text style={styles.footerSub}>Total payable</Text>
        </View>
        <Button label="Proceed to Payment" onPress={handleProceed} loading={booking} style={{ flex: 1, marginLeft: Spacing.md }} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe       : { flex: 1, backgroundColor: Colors.background },
  content    : { paddingHorizontal: Spacing.screenPadding, paddingBottom: 120 },
  loadingView: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  errorBanner: { backgroundColor: Colors.errorTint, borderRadius: BorderRadius.sm, padding: Spacing.md, marginBottom: Spacing.md },
  errorText  : { ...Typography.caption, color: Colors.error },
  card       : { backgroundColor: Colors.card, borderRadius: BorderRadius.xl, padding: Spacing.lg, marginBottom: Spacing.lg, ...Shadows.card },
  cardTitle  : { ...Typography.h4, marginBottom: Spacing.md, paddingBottom: Spacing.sm, borderBottomWidth: 1, borderBottomColor: Colors.divider },
  infoRow    : { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: Spacing.sm, borderBottomWidth: 1, borderBottomColor: Colors.divider + '80' },
  infoLabel  : { ...Typography.caption, color: Colors.textSecondary, flex: 1 },
  infoValue  : { ...Typography.captionMed, flex: 1, textAlign: 'right' },
  divider    : { height: 1, backgroundColor: Colors.divider, marginVertical: Spacing.sm },
  totalRow   : { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  totalLabel : { ...Typography.h4 },
  totalValue : { ...Typography.h3, color: Colors.primary },
  policyCard : { backgroundColor: Colors.warningTint, borderRadius: BorderRadius.md, padding: Spacing.md, marginBottom: Spacing.lg },
  policyText : { ...Typography.caption, color: Colors.warning, lineHeight: 18 },
  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: Colors.white, padding: Spacing.lg, flexDirection: 'row', alignItems: 'center', borderTopWidth: 1, borderTopColor: Colors.border, paddingBottom: Spacing.safeBottom },
  footerTotal: { ...Typography.h3, color: Colors.primary },
  footerSub  : { ...Typography.tiny },
});
