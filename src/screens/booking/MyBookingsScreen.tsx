import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { TicketsStackParamList, Booking, BookingStatus } from '../../types';
import { Colors } from '../../constants/colors';
import { Spacing, BorderRadius } from '../../constants/spacing';
import { Typography } from '../../constants/typography';
import { Shadows } from '../../constants/shadows';
import { bookingService } from '../../services/bookingService';
import { useAuth } from '../../context/AuthContext';

type Props = { navigation: NativeStackNavigationProp<TicketsStackParamList, 'MyBookings'> };
type Tab = 'upcoming' | 'archived' | 'cancelled';

const STATUS_MAP: Record<Tab, string[]> = {
  upcoming: ['pending', 'confirmed'],
  archived: ['completed', 'boarded'],
  cancelled: ['cancelled'],
};

function BookingItem({ booking, tab, navigation }: { booking: Booking; tab: Tab; navigation: Props['navigation'] }) {
  const statusColors: Record<string, string> = {
    pending  : Colors.warning,
    confirmed: Colors.success,
    cancelled: Colors.error,
    completed: Colors.textMuted,
    boarded: Colors.primary,
  };

  return (
    <TouchableOpacity
      style={styles.bookingCard}
      onPress={() => {
        if (tab === 'upcoming') {
          navigation.navigate('ActiveTicket', { bookingId: booking.id });
        } else {
          navigation.navigate('DigitalTicket', { bookingId: booking.id });
        }
      }}
      activeOpacity={0.7}
    >
      <View style={styles.cardHeader}>
        <View>
          <Text style={styles.routeName}>{booking.routeName}</Text>
          <Text style={styles.travelDate}>{booking.travelDate}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: statusColors[booking.bookingStatus] + '20' }]}>
          <Text style={[styles.statusText, { color: statusColors[booking.bookingStatus] }]}>
            {booking.bookingStatus === 'boarded' ? 'COMPLETED' : booking.bookingStatus.toUpperCase()}
          </Text>
        </View>
      </View>

      <View style={styles.cardMeta}>
        <Text style={styles.metaItem}>💺 Seat {booking.seatNumber}</Text>
        <Text style={styles.metaItem}>🚌 {booking.busType}</Text>
        <Text style={styles.metaItem}>💰 PKR {booking.fareAmount}</Text>
      </View>

      {tab === 'upcoming' && (
        <View style={styles.cardActions}>
          <TouchableOpacity style={styles.cardBtn}
            onPress={() => navigation.navigate('DigitalTicket', { bookingId: booking.id })}
            activeOpacity={0.7}>
            <Text style={styles.cardBtnText}>View Ticket</Text>
          </TouchableOpacity>
        </View>
      )}
    </TouchableOpacity>
  );
}

export default function MyBookingsScreen({ navigation }: Props) {
  const { user } = useAuth();
  const [tab,      setTab]      = useState<Tab>('upcoming');
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!user) return;
    const { data } = await bookingService.getUserBookings(user.id);
    setBookings(data ?? []);
    setLoading(false);
    setRefreshing(false);
  }, [user]);

  useEffect(() => { load(); }, [load]);

  const filtered = bookings.filter(b => STATUS_MAP[tab].includes(b.bookingStatus));

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.title}>My Bookings</Text>
        <TouchableOpacity
          style={styles.historyBtn}
          onPress={() => navigation.navigate('TravelHistory')}
          activeOpacity={0.7}
        >
          <Ionicons name="time-outline" size={20} color={Colors.primary} />
          <Text style={styles.historyBtnText}>History</Text>
        </TouchableOpacity>
      </View>

      {/* Tab Selector */}
      <View style={styles.tabRow}>
        {(['upcoming', 'archived', 'cancelled'] as Tab[]).map(t => (
          <TouchableOpacity
            key={t} style={[styles.tabChip, tab === t && styles.tabChipActive]}
            onPress={() => setTab(t)} activeOpacity={0.7}
          >
            <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <View style={styles.centered}><ActivityIndicator size="large" color={Colors.primary} /></View>
      ) : filtered.length === 0 ? (
        <View style={styles.empty}>
          <Text style={{ fontSize: 48 }}>🎟️</Text>
          <Text style={styles.emptyTitle}>No {tab} bookings</Text>
          <Text style={styles.emptySubtitle}>
            {tab === 'upcoming' ? 'Book a bus to get started!' : 'Your archived bookings will appear here.'}
          </Text>
          {tab === 'upcoming' && (
            <TouchableOpacity
              style={styles.searchBtn}
              onPress={() => (navigation as any).getParent()?.navigate('HomeTab', { screen: 'Search' })}
              activeOpacity={0.7}
            >
              <Text style={styles.searchBtnText}>Find a Bus</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={b => b.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={Colors.primary} />}
          renderItem={({ item }) => <BookingItem booking={item} tab={tab} navigation={navigation} />}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe       : { flex: 1, backgroundColor: Colors.background },
  header     : { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: Spacing.screenPadding, paddingTop: Spacing.lg, paddingBottom: Spacing.md },
  title      : { ...Typography.h2 },
  historyBtn : { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: Colors.primaryTint, paddingHorizontal: 12, paddingVertical: 6, borderRadius: BorderRadius.full },
  historyBtnText: { ...Typography.captionMed, color: Colors.primary },
  tabRow     : { flexDirection: 'row', gap: Spacing.sm, paddingHorizontal: Spacing.screenPadding, marginBottom: Spacing.md },
  tabChip    : { paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderRadius: BorderRadius.full, borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.card },
  tabChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  tabText    : { ...Typography.caption, color: Colors.textSecondary },
  tabTextActive: { color: Colors.white, fontWeight: '600' },
  listContent: { paddingHorizontal: Spacing.screenPadding, paddingBottom: Spacing.safeBottom },
  centered   : { flex: 1, alignItems: 'center', justifyContent: 'center' },
  bookingCard: {
    backgroundColor: Colors.card, borderRadius: BorderRadius.xl,
    padding: Spacing.lg, marginBottom: Spacing.md, ...Shadows.card,
  },
  cardHeader : { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: Spacing.sm },
  routeName  : { ...Typography.h4, flex: 1, marginRight: Spacing.sm },
  travelDate : { ...Typography.caption, marginTop: 2 },
  statusBadge: { borderRadius: BorderRadius.full, paddingHorizontal: 10, paddingVertical: 3 },
  statusText : { fontSize: 11, fontWeight: '600' },
  cardMeta   : { flexDirection: 'row', gap: Spacing.md, flexWrap: 'wrap', paddingTop: Spacing.sm, borderTopWidth: 1, borderTopColor: Colors.divider },
  metaItem   : { ...Typography.caption },
  cardActions: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.md, paddingTop: Spacing.sm, borderTopWidth: 1, borderTopColor: Colors.divider },
  cardBtn    : { flex: 1, backgroundColor: Colors.primaryTint, borderRadius: BorderRadius.md, padding: Spacing.sm, alignItems: 'center' },
  cardBtnText: { ...Typography.caption, color: Colors.primary, fontWeight: '600' },
  empty      : { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.xxxl, gap: Spacing.md },
  emptyTitle : { ...Typography.h3, textAlign: 'center' },
  emptySubtitle: { ...Typography.body, color: Colors.textSecondary, textAlign: 'center' },
  searchBtn  : { backgroundColor: Colors.primary, borderRadius: BorderRadius.md, paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md, marginTop: Spacing.md },
  searchBtnText: { ...Typography.buttonLabel },
});
