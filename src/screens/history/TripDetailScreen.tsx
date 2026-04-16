import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import MapView, { Marker, Polyline } from 'react-native-maps';

import { TicketsStackParamList } from '../../types';
import { Colors } from '../../constants/colors';
import { Spacing, BorderRadius } from '../../constants/spacing';
import { Typography } from '../../constants/typography';
import { Shadows } from '../../constants/shadows';
import { MOCK_TRIP_HISTORY, MOCK_BUSES, MOCK_ROUTES } from '../../services/mockData';
import { aiService } from '../../services/aiService';
import ScreenHeader from '../../components/common/ScreenHeader';
import Button from '../../components/common/Button';
import ComfortScoreRing from '../../components/cards/ComfortScoreRing';
import { MAP_PROVIDER, MAP_TYPE, OSM_TILE_URL } from '../../utils/mapConfig';
import { Platform } from 'react-native';
import { UrlTile } from 'react-native-maps';

type Props = NativeStackScreenProps<TicketsStackParamList, 'TripDetail'>;

export default function TripDetailScreen({ navigation, route }: Props) {
  const { tripId } = route.params;
  const trip = MOCK_TRIP_HISTORY.find(t => t.id === tripId);

  if (!trip) return null;

  const bus = MOCK_BUSES.find(b => b.id === trip.busId);
  const busRoute = MOCK_ROUTES.find(r => r.id === trip.routeId);
  
  if (!bus || !busRoute) return null;

  const comfort = aiService.getComfortScore(bus.id, bus.currentOccupancy, bus.totalSeats, bus.busType);
  
  const origin = busRoute.origin;
  const destination = busRoute.destination;
  const travelDate = new Date(trip.travelTime);

  const initialRegion = {
    latitude: (busRoute.stops[0].latitude + busRoute.stops[busRoute.stops.length-1].latitude) / 2,
    longitude: (busRoute.stops[0].longitude + busRoute.stops[busRoute.stops.length-1].longitude) / 2,
    latitudeDelta: Math.abs(busRoute.stops[0].latitude - busRoute.stops[busRoute.stops.length-1].latitude) + 0.5,
    longitudeDelta: Math.abs(busRoute.stops[0].longitude - busRoute.stops[busRoute.stops.length-1].longitude) + 0.5,
  };

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
              <Text style={styles.routeCode}>{destination.slice(0, 3).toUpperCase()}</Text>
              <Text style={styles.routeCity}>{destination}</Text>
            </View>
          </View>
        </View>

        {/* Status & Comfort */}
        <View style={styles.statusRow}>
          <View style={styles.statusPill}>
            <Ionicons name="checkmark-circle" size={16} color={Colors.success} />
            <Text style={styles.statusText}>Completed</Text>
          </View>
          <View style={styles.comfortPill}>
            <ComfortScoreRing score={comfort.score} size="sm" />
            <Text style={styles.comfortText}>Comfort: {comfort.label}</Text>
          </View>
        </View>

        {/* Trip Info Grid */}
        <Text style={styles.sectionLabel}>TRIP INFO</Text>
        <View style={styles.infoCard}>
          {[
            { label: 'Date & Time', value: format(travelDate, 'MMM d, yyyy h:mm a') },
            { label: 'Bus Type', value: bus.busType },
            { label: 'Seat Assigned', value: `Seat ${trip.seatSelected}` },
            { label: 'Fare Paid', value: `PKR ${trip.fareAmount}` },
            { label: 'Booking Ref', value: trip.id.toUpperCase() },
          ].map((item, idx) => (
            <View key={item.label} style={[styles.infoRow, idx === 4 && { borderBottomWidth: 0 }]}>
              <Text style={styles.infoLabel}>{item.label}</Text>
              <Text style={styles.infoValue}>{item.value}</Text>
            </View>
          ))}
        </View>

        {/* Map Snapshot */}
        <Text style={styles.sectionLabel}>ROUTE TAKEN</Text>
        <View style={styles.mapContainer}>
          <MapView
            style={styles.map}
            provider={MAP_PROVIDER}
            mapType={MAP_TYPE}
            initialRegion={initialRegion}
            scrollEnabled={false}
            zoomEnabled={false}
          >
            {Platform.OS === 'android' && (
              <UrlTile urlTemplate={OSM_TILE_URL} maximumZ={19} flipY={false} />
            )}
            <Polyline
              coordinates={busRoute.stops}
              strokeColor={Colors.primary}
              strokeWidth={3}
            />
            {busRoute.stops.map((stop, i) => (
              <Marker key={stop.id} coordinate={stop}>
                <View style={styles.stopDot} />
              </Marker>
            ))}
          </MapView>
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

  routeCard: {
    backgroundColor: Colors.card, borderRadius: BorderRadius.xl,
    padding: Spacing.xl, ...Shadows.card, marginBottom: Spacing.lg,
  },
  routeRow: { flexDirection: 'row', alignItems: 'center' },
  routeEndpoint: { flex: 1 },
  routeCode    : { fontSize: 24, fontWeight: '800', color: Colors.textPrimary },
  routeCity    : { ...Typography.tiny, marginTop: 2 },
  routeArrow   : { flex: 1, flexDirection: 'row', alignItems: 'center' },
  arrowLine    : { flex: 1, height: 1, backgroundColor: Colors.border },

  statusRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: Spacing.xl },
  statusPill: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: Colors.successTint, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderRadius: BorderRadius.full },
  statusText: { ...Typography.captionMed, color: Colors.success, fontWeight: '700' },
  comfortPill: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, backgroundColor: Colors.card, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderRadius: BorderRadius.full, ...Shadows.card },
  comfortText: { ...Typography.caption, color: Colors.textSecondary },

  sectionLabel: { ...Typography.sectionLabel, marginBottom: Spacing.sm },
  infoCard: { backgroundColor: Colors.card, borderRadius: BorderRadius.lg, padding: Spacing.lg, ...Shadows.card, marginBottom: Spacing.xl },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.divider },
  infoLabel: { ...Typography.body, color: Colors.textSecondary },
  infoValue: { ...Typography.bodyMedium, color: Colors.textPrimary },

  mapContainer: { height: 180, borderRadius: BorderRadius.lg, overflow: 'hidden', ...Shadows.card, marginBottom: Spacing.lg },
  map: { flex: 1 },
  stopDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.white, borderWidth: 2, borderColor: Colors.primary },

  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: Colors.card, padding: Spacing.lg, borderTopWidth: 1, borderTopColor: Colors.border, paddingBottom: Spacing.safeBottom },
  shareBtn: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6, paddingVertical: Spacing.sm },
  shareText: { ...Typography.captionMed, color: Colors.textMuted },
});
