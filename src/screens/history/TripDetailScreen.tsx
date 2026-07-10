import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';

import { TicketsStackParamList, Booking } from '../../types';
import { Colors } from '../../constants/colors';
import { Spacing, BorderRadius } from '../../constants/spacing';
import { Typography } from '../../constants/typography';
import { Shadows } from '../../constants/shadows';
import { bookingService } from '../../services/bookingService';
import { aiService } from '../../services/aiService';
import { busService } from '../../services/busService';
import ScreenHeader from '../../components/common/ScreenHeader';
import Button from '../../components/common/Button';
import ComfortScoreRing from '../../components/cards/ComfortScoreRing';

type Props = NativeStackScreenProps<TicketsStackParamList, 'TripDetail'>;

// Parse routeName like "Karachi → Lahore" into origin / destination
function parseRoute(routeName: string): { origin: string; destination: string } {
  const parts = routeName.split(/→|->|-/).map(s => s.trim());
  return { origin: parts[0] ?? routeName, destination: parts[1] ?? '' };
}

export default function TripDetailScreen({ navigation, route }: Props) {
  const { tripId } = route.params;   // tripId here is actually a bookingId
  const [booking,     setBooking]     = useState<Booking | null>(null);
  const [comfortScore, setComfort]    = useState<number>(70);
  const [comfortLabel, setLabel]      = useState<string>('Good');
  const [loading,     setLoading]     = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await bookingService.getBookingById(tripId);
      if (data) {
        setBooking(data);
        // Fetch live bus for real comfort score
        if (data.busId) {
          const { data: bus } = await busService.getBusById(data.busId);
          if (bus) {
            const cs = aiService.getComfortScore(bus.id, bus.currentOccupancy, bus.totalSeats, bus.busType);
            setComfort(cs.score);
            setLabel(cs.label);
          }
        }
      }
      setLoading(false);
    })();
  }, [tripId]);

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <ScreenHeader title="Trip Details" onBack={() => navigation.goBack()} />
        <View style={styles.centered}><ActivityIndicator size="large" color={Colors.primary} /></View>
      </SafeAreaView>
    );
  }

  if (!booking) {
    return (
      <SafeAreaView style={styles.safe}>
        <ScreenHeader title="Trip Details" onBack={() => navigation.goBack()} />
        <View style={styles.centered}>
          <Text style={styles.errorText}>Trip details not found.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const { origin, destination } = parseRoute(booking.routeName);

  return (
    <SafeAreaView style={styles.safe}>
      <ScreenHeader title="Trip Details" onBack={() => navigation.goBack()} />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* Route Card */}
        <View style={styles.routeCard}>
          <View style={styles.routeRow}>
            <View style={styles.routeEndpoint}>
              <Text style={styles.routeCode}>{origin.slice(0, 3).toUpperCase()}</Text>
              <Text style={styles.routeCity}>{origin}</Text>
            </View>
            <View style={styles.routeArrow}>
              <View style={styles.arrowLine} />
              <Ionicons name="bus" size={18} color={Colors.primary} />
              <View style={styles.arrowLine} />
            </View>
            <View style={[styles.routeEndpoint, { alignItems: 'flex-end' }]}>
              <Text style={styles.routeCode}>{(destination || 'DST').slice(0, 3).toUpperCase()}</Text>
              <Text style={styles.routeCity}>{destination}</Text>
            </View>
          </View>
        </View>

        {/* Status & Comfort */}
        <View style={styles.statusRow}>
          <View style={styles.statusPill}>
            <Ionicons name="checkmark-circle" size={16} color={Colors.success} />
            <Text style={styles.statusText}>{booking.bookingStatus.toUpperCase()}</Text>
          </View>
          <View style={styles.comfortPill}>
            <ComfortScoreRing score={comfortScore} size="sm" />
            <Text style={styles.comfortText}>Comfort: {comfortLabel}</Text>
          </View>
        </View>

        {/* Trip Info Grid */}
        <Text style={styles.sectionLabel}>TRIP INFO</Text>
        <View style={styles.infoCard}>
          {[
            { label: 'Travel Date',   value: booking.travelDate },
            { label: 'Bus Type',      value: booking.busType },
            { label: 'Seat Assigned', value: `Seat ${booking.seatNumber}` },
            { label: 'Fare Paid',     value: `PKR ${booking.fareAmount}` },
            { label: 'Booking Ref',   value: booking.id.slice(0, 16).toUpperCase() },
          ].map((item, idx) => (
            <View key={item.label} style={[styles.infoRow, idx === 4 && { borderBottomWidth: 0 }]}>
              <Text style={styles.infoLabel}>{item.label}</Text>
              <Text style={styles.infoValue}>{item.value}</Text>
            </View>
          ))}
        </View>

        <View style={{ height: Spacing.xxxl }} />
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <Button
          label="Book Same Route"
          onPress={() => (navigation as any).getParent()?.navigate('HomeTab', { screen: 'Search' })}
          style={{ marginBottom: Spacing.sm }}
        />
        <TouchableOpacity style={styles.shareBtn} activeOpacity={0.7}>
          <Ionicons name="share-outline" size={18} color={Colors.textMuted} />
          <Text style={styles.shareText}>Share Trip Details</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  content: { paddingHorizontal: Spacing.screenPadding, paddingBottom: 150 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  errorText: { ...Typography.body, color: Colors.textSecondary },

  routeCard: {
    backgroundColor: Colors.card, borderRadius: BorderRadius.xl,
    padding: Spacing.xl, ...Shadows.card, marginBottom: Spacing.lg,
  },
  routeRow    : { flexDirection: 'row', alignItems: 'center' },
  routeEndpoint: { flex: 1 },
  routeCode   : { fontSize: 24, fontWeight: '800', color: Colors.textPrimary },
  routeCity   : { ...Typography.tiny, marginTop: 2 },
  routeArrow  : { flex: 1, flexDirection: 'row', alignItems: 'center' },
  arrowLine   : { flex: 1, height: 1, backgroundColor: Colors.border },

  statusRow  : { flexDirection: 'row', justifyContent: 'space-between', marginBottom: Spacing.xl },
  statusPill : { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: Colors.successTint, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderRadius: BorderRadius.full },
  statusText : { ...Typography.captionMed, color: Colors.success, fontWeight: '700' },
  comfortPill: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, backgroundColor: Colors.card, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderRadius: BorderRadius.full, ...Shadows.card },
  comfortText: { ...Typography.caption, color: Colors.textSecondary },

  sectionLabel: { ...Typography.sectionLabel, marginBottom: Spacing.sm },
  infoCard: { backgroundColor: Colors.card, borderRadius: BorderRadius.lg, padding: Spacing.lg, ...Shadows.card, marginBottom: Spacing.xl },
  infoRow : { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.divider },
  infoLabel: { ...Typography.body, color: Colors.textSecondary },
  infoValue: { ...Typography.bodyMedium, color: Colors.textPrimary },

  footer   : { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: Colors.card, padding: Spacing.lg, borderTopWidth: 1, borderTopColor: Colors.border, paddingBottom: Spacing.safeBottom },
  shareBtn : { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6, paddingVertical: Spacing.sm },
  shareText: { ...Typography.captionMed, color: Colors.textMuted },
});
