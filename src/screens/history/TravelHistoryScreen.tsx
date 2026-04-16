import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';

import { TicketsStackParamList, TripHistory } from '../../types';
import { Colors } from '../../constants/colors';
import { Spacing, BorderRadius } from '../../constants/spacing';
import { Typography } from '../../constants/typography';
import { Shadows } from '../../constants/shadows';
import { MOCK_TRIP_HISTORY } from '../../services/mockData';
import ScreenHeader from '../../components/common/ScreenHeader';

type Props = NativeStackScreenProps<TicketsStackParamList, 'TravelHistory'>;

export default function TravelHistoryScreen({ navigation }: Props) {
  const [history, setHistory] = useState<TripHistory[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = () => {
    setRefreshing(true);
    // In a real app we'd fetch from supabase
    setTimeout(() => {
      // Sort desc by time
      setHistory([...MOCK_TRIP_HISTORY].sort((a, b) => new Date(b.travelTime).getTime() - new Date(a.travelTime).getTime()));
      setRefreshing(false);
    }, 500);
  };

  useEffect(() => { loadData(); }, []);

  // Summary logic
  const totalTrips = history.length;
  const totalSpent = history.reduce((sum, trip) => sum + trip.fareAmount, 0);

  // Find most used route
  const counts: Record<string, { count: number; name: string }> = {};
  history.forEach(t => {
    if (!counts[t.routeId]) counts[t.routeId] = { count: 0, name: t.routeName };
    counts[t.routeId].count++;
  });
  let mostUsedRoute = 'None yet';
  let maxCount = 0;
  Object.values(counts).forEach(c => {
    if (c.count > maxCount) { maxCount = c.count; mostUsedRoute = c.name; }
  });

  const renderItem = ({ item }: { item: TripHistory }) => {
    const travelDate = new Date(item.travelTime);
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
          <Text style={styles.tripDate}>{format(travelDate, 'MMM d, yyyy h:mm a')}</Text>
          <Text style={styles.tripSeat}>Seat {item.seatSelected}</Text>
        </View>
        <View style={[styles.statusBadge, item.completionStatus === 'completed' ? styles.statusCompleted : styles.statusOther]}>
          <Text style={[styles.statusText, item.completionStatus === 'completed' ? {color: Colors.success} : {color: Colors.textMuted}]}>
            {item.completionStatus.toUpperCase()}
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
          <Text style={styles.summaryValue} numberOfLines={1}>{mostUsedRoute.slice(0, 8)}...</Text>
          <Text style={styles.summaryLabel}>Most Used</Text>
        </View>
      </View>

      <FlatList
        data={history}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={loadData} tintColor={Colors.primary} />}
        ListEmptyComponent={
          !refreshing ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="document-text-outline" size={64} color={Colors.border} />
              <Text style={styles.emptyText}>No travel history yet</Text>
            </View>
          ) : null
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  listContent: { paddingHorizontal: Spacing.screenPadding, paddingBottom: Spacing.safeBottom + Spacing.lg },

  summaryStrip: {
    flexDirection: 'row', backgroundColor: Colors.card, paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.screenPadding, marginBottom: Spacing.md,
    borderBottomWidth: 1, borderBottomColor: Colors.border, ...Shadows.card
  },
  summaryItem: { flex: 1, alignItems: 'center' },
  summaryValue: { ...Typography.h4, color: Colors.primary },
  summaryLabel: { ...Typography.tiny, color: Colors.textSecondary, marginTop: 4 },
  summaryDivider: { width: 1, backgroundColor: Colors.divider, marginVertical: Spacing.xs },

  tripCard: {
    backgroundColor: Colors.card, borderRadius: BorderRadius.lg, padding: Spacing.lg,
    marginBottom: Spacing.md, ...Shadows.card, borderWidth: 1, borderColor: Colors.border
  },
  tripHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.xs },
  tripRoute: { ...Typography.bodyMedium, flex: 1, marginRight: Spacing.sm },
  tripFare: { ...Typography.captionMed, color: Colors.textPrimary },
  tripMeta: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: Spacing.sm },
  tripDate: { ...Typography.caption, color: Colors.textSecondary },
  tripSeat: { ...Typography.caption, color: Colors.textSecondary },
  
  statusBadge: { alignSelf: 'flex-start', paddingHorizontal: Spacing.sm, paddingVertical: 4, borderRadius: BorderRadius.full },
  statusCompleted: { backgroundColor: Colors.successTint },
  statusOther: { backgroundColor: Colors.background },
  statusText: { fontSize: 10, fontWeight: '700' },

  emptyContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: 100 },
  emptyText: { ...Typography.body, color: Colors.textSecondary, marginTop: Spacing.md },
});
