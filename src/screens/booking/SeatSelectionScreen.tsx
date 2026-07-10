import React, { useState, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList, Seat, Bus, Route, CrowdPrediction, ComfortScore } from '../../types';
import { Colors } from '../../constants/colors';
import { Spacing, BorderRadius } from '../../constants/spacing';
import { Typography } from '../../constants/typography';
import { Shadows } from '../../constants/shadows';
import { busService } from '../../services/busService';
import { aiService } from '../../services/aiService';
import ScreenHeader from '../../components/common/ScreenHeader';
import Button       from '../../components/common/Button';

type Props = NativeStackScreenProps<RootStackParamList, 'SeatSelection'>;
type ZoneFilter = 'no_preference' | 'female_only' | 'male_only';

export default function SeatSelectionScreen({ navigation, route }: Props) {
  const { busId, routeId, travelDate } = route.params;
  const [seats,    setSeats]    = useState<Seat[]>([]);
  const [selected, setSelected] = useState<Seat | null>(null);
  const [zoneFilter, setZone]   = useState<ZoneFilter>('no_preference');
  const [comfort,  setComfort]  = useState<ComfortScore | null>(null);
  const [crowd,    setCrowd]    = useState<CrowdPrediction | null>(null);
  const [loading,  setLoading]  = useState(true);

  const [bus, setBus] = useState<Bus | null>(null);
  const [busRoute, setRoute] = useState<Route | null>(null);

  useFocusEffect(
    useCallback(() => {
      let isActive = true;
      setLoading(true);

      (async () => {
        const { data: b } = await busService.getBusById(busId);
        const { data: r } = await busService.getRouteById(routeId);
        const { data: s } = await busService.getSeatsByBus(busId, travelDate);
        
        if (isActive && b && r) {
          setBus(b);
          setRoute(r);
          setSeats(s || []);
          setComfort(aiService.getComfortScore(busId, b.currentOccupancy, b.totalSeats, b.busType));
          setCrowd(aiService.predictCrowd(busId, b.currentOccupancy, b.totalSeats));
          setLoading(false);
        }
      })();

      return () => { isActive = false; };
    }, [busId, routeId, travelDate])
  );

  // Determine top-recommended seats
  const recommended = seats
    .filter(s => s.availabilityStatus)
    .slice(0, 2)
    .map(s => s.id);

  const filteredSeats = zoneFilter === 'no_preference'
    ? seats
    : seats.filter(s => s.seatGenderZone === zoneFilter || s.seatGenderZone === 'no_preference');

  // Grid: 4 columns (seats go row by row)
  const maxRow = Math.max(...seats.map(s => s.row), 0);

  const getSeatColor = (s: Seat) => {
    if (!s.availabilityStatus) return Colors.border;
    if (selected?.id === s.id) return Colors.primary;
    if (s.seatGenderZone === 'female_only') return '#FDF2F8';
    if (s.seatGenderZone === 'male_only') return '#EFF6FF';
    return Colors.successTint;
  };

  const getSeatBorder = (s: Seat) => {
    if (selected?.id === s.id) return Colors.primary;
    if (!s.availabilityStatus) return Colors.border;
    if (s.seatGenderZone === 'female_only') return '#EC4899';
    if (s.seatGenderZone === 'male_only') return '#3B82F6';
    return Colors.success;
  };

  const handleConfirm = () => {
    if (!selected || !bus || !busRoute) return;
    navigation.navigate('BookingSummary', {
      busId,
      seatId: selected.id,
      routeId,
      travelDate,
    });
  };

  const handleBack = () => {
    (navigation as any).navigate('MainTabs', { screen: 'HomeTab' });
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScreenHeader title="Select Your Seat" onBack={handleBack} />

      {/* Bus Strip */}
      <View style={styles.strip}>
        <Text style={styles.stripRoute}>{busRoute?.routeName}</Text>
        <Text style={styles.stripMeta}>{bus?.busType} · {travelDate}</Text>
      </View>

      {/* Zone Toggle */}
      <View style={styles.zoneRow}>
        {([
          { label: 'No Preference', value: 'no_preference' as ZoneFilter },
          { label: '👩 Female Zone',  value: 'female_only' as ZoneFilter },
          { label: '👨 Male Zone',    value: 'male_only'   as ZoneFilter },
        ]).map(z => (
          <TouchableOpacity
            key={z.value}
            style={[styles.zoneChip, zoneFilter === z.value && styles.zoneChipActive]}
            onPress={() => setZone(z.value)} activeOpacity={0.7}
          >
            <Text style={[styles.zoneText, zoneFilter === z.value && styles.zoneTextActive]}>{z.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <View style={styles.loadingView}><ActivityIndicator size="large" color={Colors.primary} /></View>
      ) : (
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {/* Driver cab */}
          <View style={styles.driverCab}>
            <Text style={styles.driverCabText}>🚌 Driver</Text>
          </View>

          {/* Seat Grid */}
          <View style={styles.seatGrid}>
            {Array.from({ length: maxRow }, (_, i) => i + 1).map(row => (
              <View key={row} style={styles.seatRow}>
                {seats.filter(s => s.row === row).map(seat => {
                  const isRec = recommended.includes(seat.id) && seat.availabilityStatus;
                  const visible = filteredSeats.some(fs => fs.id === seat.id);
                  if (!visible && seat.availabilityStatus) {
                    return <View key={seat.id} style={[styles.seat, { opacity: 0.2 }]} />;
                  }
                  return (
                    <TouchableOpacity
                      key={seat.id}
                      style={[
                        styles.seat,
                        { backgroundColor: getSeatColor(seat), borderColor: getSeatBorder(seat) },
                        selected?.id === seat.id && { transform: [{ scale: 1.05 }] },
                      ]}
                      onPress={() => seat.availabilityStatus ? setSelected(seat) : null}
                      activeOpacity={seat.availabilityStatus ? 0.7 : 1}
                      disabled={!seat.availabilityStatus}
                    >
                      {isRec && <Text style={styles.starIcon}>⭐</Text>}
                      <Text style={[styles.seatNum, !seat.availabilityStatus && { color: Colors.textMuted }]}>
                        {seat.seatNumber}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            ))}
          </View>

          {/* Legend */}
          <View style={styles.legend}>
            {[
              { color: Colors.successTint, border: Colors.success, label: 'Available' },
              { color: Colors.border,      border: Colors.border,  label: 'Booked' },
              { color: Colors.primary,     border: Colors.primary, label: 'Selected' },
              { color: '#FDF2F8',          border: '#EC4899',      label: 'Female Zone' },
              { color: '#EFF6FF',          border: '#3B82F6',      label: 'Male Zone' },
            ].map(l => (
              <View key={l.label} style={styles.legendItem}>
                <View style={[styles.legendBox, { backgroundColor: l.color, borderColor: l.border }]} />
                <Text style={styles.legendText}>{l.label}</Text>
              </View>
            ))}
          </View>

          {/* AI Recommendation note */}
          <View style={styles.aiNote}>
            <Text style={styles.aiNoteText}>⭐ = AI recommended based on your preferences</Text>
          </View>

          {/* Selected Summary */}
          {selected && (
            <View style={styles.selectedCard}>
              <Text style={styles.selectedTitle}>Seat {selected.seatNumber} Selected</Text>
              <Text style={styles.selectedMeta}>
                {selected.position.charAt(0).toUpperCase() + selected.position.slice(1)} seat ·{' '}
                {selected.seatGenderZone === 'female_only' ? '👩 Female Zone' :
                 selected.seatGenderZone === 'male_only'   ? '👨 Male Zone'   : '👥 Mixed Zone'}
              </Text>
              {comfort && <Text style={styles.selectedComfort}>Comfort: {comfort.score}/100 {comfort.emoji}</Text>}
            </View>
          )}
        </ScrollView>
      )}

      {/* Sticky Footer */}
      <View style={styles.footer}>
        <Button
          label={selected ? `Confirm Seat ${selected.seatNumber}` : 'Select a Seat'}
          onPress={handleConfirm}
          disabled={!selected}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe  : { flex: 1, backgroundColor: Colors.background },
  strip : { backgroundColor: Colors.card, padding: Spacing.md, paddingHorizontal: Spacing.screenPadding, borderBottomWidth: 1, borderBottomColor: Colors.border },
  stripRoute: { ...Typography.bodyMedium },
  stripMeta : { ...Typography.caption },
  zoneRow: { flexDirection: 'row', gap: Spacing.sm, paddingHorizontal: Spacing.screenPadding, paddingVertical: Spacing.sm, backgroundColor: Colors.card, borderBottomWidth: 1, borderBottomColor: Colors.border },
  zoneChip: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: BorderRadius.full, borderWidth: 1, borderColor: Colors.border },
  zoneChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  zoneText: { fontSize: 11, color: Colors.textSecondary },
  zoneTextActive: { color: Colors.white, fontWeight: '600' },
  loadingView: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: { paddingHorizontal: Spacing.screenPadding, paddingBottom: 120 },
  driverCab: { backgroundColor: Colors.textPrimary, borderRadius: BorderRadius.md, padding: Spacing.sm, alignItems: 'center', marginVertical: Spacing.md },
  driverCabText: { color: Colors.white, fontWeight: '600', fontSize: 12 },
  seatGrid: { gap: 8 },
  seatRow : { flexDirection: 'row', justifyContent: 'center', gap: 8 },
  seat: {
    width: 52, height: 52, borderRadius: BorderRadius.md,
    borderWidth: 1.5, alignItems: 'center', justifyContent: 'center',
  },
  starIcon: { position: 'absolute', top: -8, right: -8, fontSize: 12 },
  seatNum : { fontSize: 12, fontWeight: '600', color: Colors.textPrimary },
  legend  : { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginTop: Spacing.lg },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  legendBox : { width: 14, height: 14, borderRadius: 3, borderWidth: 1.5 },
  legendText: { ...Typography.tiny },
  aiNote  : { backgroundColor: Colors.primaryTint, borderRadius: BorderRadius.sm, padding: Spacing.sm, marginTop: Spacing.sm },
  aiNoteText: { ...Typography.tiny, color: Colors.primary },
  selectedCard: { backgroundColor: Colors.card, borderRadius: BorderRadius.lg, padding: Spacing.md, marginTop: Spacing.lg, borderLeftWidth: 3, borderLeftColor: Colors.primary, ...Shadows.card },
  selectedTitle  : { ...Typography.h4, marginBottom: 4 },
  selectedMeta   : { ...Typography.caption },
  selectedComfort: { ...Typography.tiny, marginTop: 4 },
  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: Colors.white, padding: Spacing.lg, borderTopWidth: 1, borderTopColor: Colors.border, paddingBottom: Spacing.safeBottom },
});
