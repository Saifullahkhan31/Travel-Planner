import React, { useEffect, useState } from 'react';
import { View, StyleSheet, FlatList, ActivityIndicator, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList, Bus, Route } from '../../types';
import { busService } from '../../services/busService';
import { aiService } from '../../services/aiService';
import { Colors } from '../../constants/colors';
import { Spacing } from '../../constants/spacing';
import { Typography } from '../../constants/typography';
import ScreenHeader from '../../components/common/ScreenHeader';
import BusCard from '../../components/cards/BusCard';

type Props = NativeStackScreenProps<RootStackParamList, 'RecommendedBuses'>;

export default function RecommendedBusesScreen({ navigation }: Props) {
  const [buses, setBuses] = useState<Bus[]>([]);
  const [routes, setRoutes] = useState<Route[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [busRes, routeRes] = await Promise.all([
          busService.getAllBuses(),
          busService.getAllRoutes()
        ]);
        
        const bList = busRes.data ?? [];
        const rList = routeRes.data ?? [];
        
        // Filter buses to only those that have a valid route
        const validBuses = bList.filter(b => b.isActive && rList.some(r => r.id === b.routeId));
        
        setRoutes(rList);
        setBuses(validBuses);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const renderBus = ({ item: bus }: { item: Bus }) => {
    const route = routes.find(r => r.id === bus.routeId);
    if (!route) return null; // Should not happen due to filtering

    const crowd = aiService.predictCrowd(bus.id, bus.currentOccupancy, bus.totalSeats);
    const comfort = aiService.getComfortScore(bus.id, bus.currentOccupancy, bus.totalSeats, bus.busType);
    const fare = aiService.estimateFare(route.id, bus.busType, route.distance ?? 200);

    return (
      <BusCard
        bus={bus}
        route={route}
        crowdPrediction={crowd}
        comfortScore={comfort}
        fare={fare.totalFare}
        onPress={() => (navigation as any).navigate('MainTabs', {
          screen: 'HomeTab',
          params: {
            screen: 'BusDetail',
            params: { busId: bus.id, routeId: route.id },
          },
        })}
      />
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScreenHeader title="Recommended Buses" onBack={() => navigation.goBack()} />
      
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : buses.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.emptyText}>No active buses available at the moment.</Text>
        </View>
      ) : (
        <FlatList
          data={buses}
          keyExtractor={(b, idx) => `${b.id}-${idx}`}
          renderItem={renderBus}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { ...Typography.body, color: Colors.textMuted },
  listContent: { padding: Spacing.md, gap: Spacing.md, paddingBottom: Spacing.safeBottom },
});
