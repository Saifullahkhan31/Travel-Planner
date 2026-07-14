import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';

import { TicketsStackParamList } from '../../types';
import { Colors } from '../../constants/colors';
import { Spacing, BorderRadius } from '../../constants/spacing';
import { Typography } from '../../constants/typography';
import { Shadows } from '../../constants/shadows';
import { bookingService } from '../../services/bookingService';
import { useAuth } from '../../context/AuthContext';
import ScreenHeader from '../../components/common/ScreenHeader';

type Props = NativeStackScreenProps<TicketsStackParamList, 'TravelHistory'>;

// Adapt a Supabase Booking to look like TripHistory for display
interface DisplayTrip {
  id             : string;
  routeName      : string;
  fareAmount     : number;
  travelDate     : string;
  seatNumber     : number;
  bookingStatus  : string;
}

export default function TravelHistoryScreen({ navigation }: Props) {
  const { user } = useAuth();
  const [history,    setHistory]    = useState<DisplayTrip[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    if (!user) return;
    // Fetch ALL bookings — we'll show completed + cancelled as "history"
    const { data } = await bookingService.getUserBookings(user.id);
    const past = (data ?? [])
      .filter(b => ['completed', 'cancelled', 'boarded'].includes(b.bookingStatus))
      .sort((a, b) => new Date(b.travelDate).getTime() - new Date(a.travelDate).getTime());
    setHistory(past);
    setLoading(false);
    setRefreshing(false);
  }, [user]);

  useEffect(() => { loadData(); }, [loadData]);

  // Summary stats
  const totalTrips = history.length;
  const totalSpent = history
    .filter(t => t.bookingStatus === 'completed' || t.bookingStatus === 'boarded')
    .reduce((sum, t) => sum + t.fareAmount, 0);

  // Most used route
  const counts: Record<string, { count: number; name: string }> = {};
  history.forEach(t => {
    const key = t.routeName;
    if (!counts[key]) counts[key] = { count: 0, name: key };
    counts[key].count++;
  });
  let mostUsedRoute = 'None yet';
  let maxCount = 0;
  Object.values(counts).forEach(c => {
    if (c.count > maxCount) { maxCount = c.count; mostUsedRoute = c.name; }
  });

  let displayRoute = mostUsedRoute;
  if (mostUsedRoute !== 'None yet') {
    const separator = mostUsedRoute.includes('→') ? '→' : mostUsedRoute.includes('-') ? '-' : null;
    if (separator) {
      displayRoute = mostUsedRoute
        .split(separator)
        .map(city => city.trim().substring(0, 3).toUpperCase())
        .join(` ${separator} `);
    }
  }

  const renderItem = ({ item }: { item: DisplayTrip }) => {
    const isCompleted = item.bookingStatus === 'completed' || item.bookingStatus === 'boarded';
    return (
      <TouchableOpacity
        style={styles.tripCard}
        activeOpacity={0.7}
        onPress={() => navigation.navigate('TripDetail', { tripId: item.id })}
      >
        <View style={styles.tripHeader}>
          <Text style={styles.tripRoute}>{item.routeName}</Text>
          <Text style={styles.tripFare}>PKR {item.fareAmount}</Text>
        </View>
        <View style={styles.tripMeta}>
          <Text style={styles.tripDate}>{item.travelDate}</Text>
          <Text style={styles.tripSeat}>Seat {item.seatNumber}</Text>
        </View>
        <View style={[styles.statusBadge, isCompleted ? styles.statusCompleted : styles.statusOther]}>
          <Text style={[styles.statusText, { color: isCompleted ? Colors.success : Colors.textMuted }]}>
            {item.bookingStatus === 'boarded' ? 'COMPLETED' : item.bookingStatus.toUpperCase()}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScreenHeader title="Travel History" onBack={() => navigation.goBack()} />

      {/* Summary Strip */}
      <View style={styles.summaryStrip}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryValue}>{totalTrips}</Text>
          <Text style={styles.summaryLabel}>Total Trips</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={styles.summaryValue}>PKR {totalSpent}</Text>
          <Text style={styles.summaryLabel}>Total Spent</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={styles.summaryValue} numberOfLines={1}>
            {displayRoute.length > 10 ? displayRoute.slice(0, 10) + '…' : displayRoute}
          </Text>
          <Text style={styles.summaryLabel}>Most Used</Text>
        </View>
      </View>

      {loading ? (
        <View style={styles.centered}><ActivityIndicator size="large" color={Colors.primary} /></View>
      ) : (
        <FlatList
          data={history}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadData(); }} tintColor={Colors.primary} />}
          ListEmptyComponent={
            !refreshing ? (
              <View style={styles.emptyContainer}>
                <Ionicons name="document-text-outline" size={64} color={Colors.border} />
                <Text style={styles.emptyText}>No travel history yet</Text>
                <Text style={styles.emptySubtext}>Completed bookings will appear here.</Text>
              </View>
            ) : null
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe       : { flex: 1, backgroundColor: Colors.background },
  listContent: { paddingHorizontal: Spacing.screenPadding, paddingBottom: Spacing.safeBottom + Spacing.lg },
  centered   : { flex: 1, alignItems: 'center', justifyContent: 'center' },

  summaryStrip: {
    flexDirection: 'row', backgroundColor: Colors.card, paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.screenPadding, marginBottom: Spacing.md,
    borderBottomWidth: 1, borderBottomColor: Colors.border, ...Shadows.card,
  },
  summaryItem   : { flex: 1, alignItems: 'center' },
  summaryValue  : { ...Typography.h4, color: Colors.primary },
  summaryLabel  : { ...Typography.tiny, color: Colors.textSecondary, marginTop: 4 },
  summaryDivider: { width: 1, backgroundColor: Colors.divider, marginVertical: Spacing.xs },

  tripCard: {
    backgroundColor: Colors.card, borderRadius: BorderRadius.lg, padding: Spacing.lg,
    marginBottom: Spacing.md, ...Shadows.card, borderWidth: 1, borderColor: Colors.border,
  },
  tripHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.xs },
  tripRoute : { ...Typography.bodyMedium, flex: 1, marginRight: Spacing.sm },
  tripFare  : { ...Typography.captionMed, color: Colors.textPrimary },
  tripMeta  : { flexDirection: 'row', justifyContent: 'space-between', marginBottom: Spacing.sm },
  tripDate  : { ...Typography.caption, color: Colors.textSecondary },
  tripSeat  : { ...Typography.caption, color: Colors.textSecondary },

  statusBadge   : { alignSelf: 'flex-start', paddingHorizontal: Spacing.sm, paddingVertical: 4, borderRadius: BorderRadius.full },
  statusCompleted: { backgroundColor: Colors.successTint },
  statusOther    : { backgroundColor: Colors.background },
  statusText     : { fontSize: 10, fontWeight: '700' },

  emptyContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: 100, gap: Spacing.sm },
  emptyText     : { ...Typography.body, color: Colors.textSecondary, marginTop: Spacing.md },
  emptySubtext  : { ...Typography.caption, color: Colors.textMuted },
});
