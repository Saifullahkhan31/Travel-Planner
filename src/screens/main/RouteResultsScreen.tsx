import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp, NativeStackScreenProps } from '@react-navigation/native-stack';
import { HomeStackParamList, Bus, CrowdPrediction, ComfortScore } from '../../types';
import { Colors } from '../../constants/colors';
import { Spacing, BorderRadius } from '../../constants/spacing';
import { Typography } from '../../constants/typography';
import { Shadows } from '../../constants/shadows';
import { MOCK_BUSES, MOCK_ROUTES } from '../../services/mockData';
import { aiService } from '../../services/aiService';
import ScreenHeader from '../../components/common/ScreenHeader';
import BusCard      from '../../components/cards/BusCard';

type Props = NativeStackScreenProps<HomeStackParamList, 'RouteResults'>;

type Filter = 'All' | 'AC' | 'Non-AC' | 'Low Crowd' | 'Best Comfort';
const FILTERS: Filter[] = ['All', 'AC', 'Non-AC', 'Low Crowd', 'Best Comfort'];

interface BusResult {
  bus    : Bus;
  crowd  : CrowdPrediction;
  comfort: ComfortScore;
  fare   : number;
}

export default function RouteResultsScreen({ navigation, route }: Props) {
  const { origin, destination, date } = route.params;
  const [results,  setResults]  = useState<BusResult[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [filter,   setFilter]   = useState<Filter>('All');

  useEffect(() => {
    const allBuses = MOCK_BUSES.filter(b => b.isActive);
    const routeMatches = MOCK_ROUTES.filter(r =>
      r.origin.toLowerCase().includes(origin.toLowerCase()) ||
      r.destination.toLowerCase().includes(destination.toLowerCase()) ||
      origin === '' || destination === ''
    );
    const buses = allBuses.filter(b => routeMatches.some(r => r.id === b.routeId));
    const data: BusResult[] = buses.map(bus => {
      const r = MOCK_ROUTES.find(r => r.id === bus.routeId)!;
      return {
        bus, route: r,
        crowd  : aiService.predictCrowd(bus.id, bus.currentOccupancy, bus.totalSeats),
        comfort: aiService.getComfortScore(bus.id, bus.currentOccupancy, bus.totalSeats, bus.busType),
        fare   : aiService.estimateFare(r.id, bus.busType, r.distance).totalFare,
      };
    });
    setTimeout(() => { setResults(data); setLoading(false); }, 700);
  }, []);

  const filtered = results.filter(r => {
    if (filter === 'AC') return r.bus.busType === 'AC';
    if (filter === 'Non-AC') return r.bus.busType === 'Non-AC';
    if (filter === 'Low Crowd') return r.crowd.crowdLevel === 'low';
    if (filter === 'Best Comfort') return r.comfort.score >= 70;
    return true;
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
          <Text style={styles.emptySubtitle}>Try changing the filters or search different stops.</Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={item => item.bus.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => {
            const r = MOCK_ROUTES.find(route => route.id === item.bus.routeId)!;
            return (
              <BusCard
                bus={item.bus} route={r}
                crowdPrediction={item.crowd} comfortScore={item.comfort} fare={item.fare}
                onPress={() => navigation.navigate('BusDetail', { busId: item.bus.id, routeId: item.bus.routeId })}
              />
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe        : { flex: 1, backgroundColor: Colors.background },
  filtersContent: { paddingHorizontal: Spacing.screenPadding, paddingVertical: Spacing.sm, gap: Spacing.sm },
  filterChip  : { paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderRadius: BorderRadius.full, borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.card },
  filterChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  filterText  : { ...Typography.caption, color: Colors.textSecondary },
  filterTextActive: { color: Colors.white, fontWeight: '600' },
  resultsCount: { ...Typography.tiny, paddingHorizontal: Spacing.screenPadding, paddingBottom: Spacing.sm },
  listContent : { paddingHorizontal: Spacing.screenPadding, paddingBottom: Spacing.safeBottom },
  loadingView : { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.md },
  loadingText : { ...Typography.body, color: Colors.textSecondary },
  emptyView   : { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.xxxl },
  emptyIcon   : { fontSize: 48, marginBottom: Spacing.md },
  emptyTitle  : { ...Typography.h3, marginBottom: Spacing.sm },
  emptySubtitle: { ...Typography.body, color: Colors.textSecondary, textAlign: 'center' },
});
