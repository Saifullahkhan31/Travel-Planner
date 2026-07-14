import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { HomeStackParamList, Bus, Route, CrowdPrediction, ComfortScore } from '../../types';
import { Colors } from '../../constants/colors';
import { Spacing, BorderRadius } from '../../constants/spacing';
import { Typography } from '../../constants/typography';
import { busService } from '../../services/busService';
import { aiService } from '../../services/aiService';
import { useAuth } from '../../context/AuthContext';
import ScreenHeader from '../../components/common/ScreenHeader';
import BusCard      from '../../components/cards/BusCard';

type Props = NativeStackScreenProps<HomeStackParamList, 'RouteResults'>;

type Filter = 'All' | 'AC' | 'Non-AC' | 'Low Crowd' | 'Best Comfort';
const FILTERS: Filter[] = ['All', 'AC', 'Non-AC', 'Low Crowd', 'Best Comfort'];

// Each item must carry both its bus AND its route so BusCard can render routeName
interface BusResult {
  bus    : Bus;
  route  : Route;
  crowd  : CrowdPrediction;
  comfort: ComfortScore;
  fare   : number;
}

export default function RouteResultsScreen({ navigation, route }: Props) {
  const { origin, destination, date } = route.params;
  const [results,  setResults]  = useState<BusResult[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [filter,   setFilter]   = useState<Filter>('All');

  const { user } = useAuth();
  const priority = user?.travelPriority || 'comfort';

  useEffect(() => {
    (async () => {
      const { data, error } = await busService.searchRoutes(origin, destination);
      if (data && data.length > 0) {
        const busResults: BusResult[] = data.map(item => ({
          bus    : item.bus,
          route  : item.route,
          crowd  : aiService.predictCrowd(item.bus.id, item.bus.currentOccupancy, item.bus.totalSeats),
          comfort: aiService.getComfortScore(item.bus.id, item.bus.currentOccupancy, item.bus.totalSeats, item.bus.busType),
          fare   : aiService.estimateFare(item.route.id, item.bus.busType, item.route.distance).totalFare,
        }));
        setResults(busResults);
      }
      setLoading(false);
    })();
  }, [origin, destination]);

  const filtered = results.filter(r => {
    if (filter === 'AC') return r.bus.busType === 'AC';
    if (filter === 'Non-AC') return r.bus.busType === 'Non-AC';
    if (filter === 'Low Crowd') return r.crowd.crowdLevel === 'low';
    if (filter === 'Best Comfort') return r.comfort.score >= 70;
    return true;
  }).sort((a, b) => {
    if (priority === 'speed') return a.route.estimatedDuration - b.route.estimatedDuration;
    if (priority === 'cost') return a.fare - b.fare;
    if (priority === 'comfort') return b.comfort.score - a.comfort.score;
    // For 'crowd' or anything else, try to sort by lowest occupancy
    return a.crowd.occupancyPercentage - b.crowd.occupancyPercentage;
  });

  return (
    <SafeAreaView style={styles.safe}>
      <ScreenHeader
        title="Available Buses"
        subtitle={`${origin} → ${destination}`}
        onBack={() => navigation.goBack()}
      />

      {/* Filters */}
      <View>
        <FlatList
          data={FILTERS}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filtersContent}
          keyExtractor={item => item}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.filterChip, filter === item && styles.filterChipActive]}
              onPress={() => setFilter(item)} activeOpacity={0.7}
            >
              <Text style={[styles.filterText, filter === item && styles.filterTextActive]}>{item}</Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {/* Smart Sort Banner */}
      {!loading && filtered.length > 0 && (
        <View style={styles.smartBanner}>
          <Text style={styles.smartBannerText}>
            ✨ Sorted by your priority: <Text style={{fontWeight: '700'}}>{priority.charAt(0).toUpperCase() + priority.slice(1)}</Text>
          </Text>
        </View>
      )}

      {/* Results count */}
      {!loading && (
        <Text style={styles.resultsCount}>{filtered.length} bus{filtered.length !== 1 ? 'es' : ''} found · {date}</Text>
      )}

      {/* List */}
      {loading ? (
        <View style={styles.loadingView}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Finding the best buses...</Text>
        </View>
      ) : filtered.length === 0 ? (
        <View style={styles.emptyView}>
          <Text style={styles.emptyIcon}>🔍</Text>
          <Text style={styles.emptyTitle}>No buses found</Text>
          <Text style={styles.emptySubtitle}>
            No trips are scheduled for this route right now. Try a different route or check back later.
          </Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item, idx) => `${item.bus.id}-${item.route.id}-${idx}`}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <BusCard
              bus={item.bus}
              route={item.route}
              crowdPrediction={item.crowd}
              comfortScore={item.comfort}
              fare={item.fare}
              onPress={() => navigation.navigate('BusDetail', { busId: item.bus.id, routeId: item.route.id })}
            />
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe          : { flex: 1, backgroundColor: Colors.background },
  filtersContent: { paddingHorizontal: Spacing.screenPadding, paddingVertical: Spacing.sm, gap: Spacing.sm },
  filterChip    : { paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderRadius: BorderRadius.full, borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.card },
  filterChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  filterText    : { ...Typography.caption, color: Colors.textSecondary },
  filterTextActive: { color: Colors.white, fontWeight: '600' },
  resultsCount  : { ...Typography.tiny, paddingHorizontal: Spacing.screenPadding, paddingBottom: Spacing.sm },
  listContent   : { paddingHorizontal: Spacing.screenPadding, paddingBottom: Spacing.safeBottom },
  loadingView   : { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.md },
  loadingText   : { ...Typography.body, color: Colors.textSecondary },
  emptyView     : { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.xxxl },
  emptyIcon     : { fontSize: 48, marginBottom: Spacing.md },
  emptyTitle    : { ...Typography.h3, marginBottom: Spacing.sm },
  emptySubtitle : { ...Typography.body, color: Colors.textSecondary, textAlign: 'center' },
  smartBanner   : { 
    backgroundColor: Colors.primaryTint, 
    marginHorizontal: Spacing.screenPadding, 
    padding: Spacing.sm, 
    borderRadius: BorderRadius.md, 
    marginBottom: Spacing.sm,
    borderLeftWidth: 3,
    borderLeftColor: Colors.primary,
  },
  smartBannerText: { ...Typography.caption, color: Colors.primary },
});
