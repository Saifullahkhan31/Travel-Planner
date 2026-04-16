import React, { useEffect, useState, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Animated, TouchableOpacity
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import MapView, { Marker, Polyline } from 'react-native-maps';

import { TicketsStackParamList, Booking } from '../../types';
import { Colors } from '../../constants/colors';
import { Spacing, BorderRadius } from '../../constants/spacing';
import { Typography } from '../../constants/typography';
import { Shadows } from '../../constants/shadows';
import { bookingService } from '../../services/bookingService';
import { MOCK_BUSES, MOCK_ROUTES } from '../../services/mockData';
import { aiService } from '../../services/aiService';
import ScreenHeader from '../../components/common/ScreenHeader';
import Button from '../../components/common/Button';
import { MAP_PROVIDER, MAP_TYPE, OSM_TILE_URL } from '../../utils/mapConfig';
import { Platform } from 'react-native';
import { UrlTile } from 'react-native-maps';

type Props = NativeStackScreenProps<TicketsStackParamList, 'ActiveTicket'>;

export default function ActiveTicketScreen({ navigation, route }: Props) {
  const { bookingId } = route.params;
  const [booking, setBooking] = useState<Booking | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(3600); // Demo: 1 hr to departure

  // Fetch booking details
  useEffect(() => {
    (async () => {
      const { data } = await bookingService.getBookingById(bookingId);
      if (data) setBooking(data);
    })();
  }, [bookingId]);

  // Countdown timer
  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  if (!booking) return null;

  const bus = MOCK_BUSES.find(b => b.id === booking.busId);
  const busRoute = MOCK_ROUTES.find(r => r.id === booking.routeId);
  if (!bus || !busRoute) return null;

  const crowd = aiService.predictCrowd(bus.id, bus.currentOccupancy, bus.totalSeats);

  const formatTime = (totalSeconds: number) => {
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const initialRegion = {
    latitude: busRoute.stops[0]?.latitude ?? bus.gpsLocation.latitude,
    longitude: busRoute.stops[0]?.longitude ?? bus.gpsLocation.longitude,
    latitudeDelta: 0.1,
    longitudeDelta: 0.1,
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScreenHeader title="Your Ticket" onBack={() => navigation.goBack()} />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        
        {/* Countdown Timer */}
        <View style={styles.timerCard}>
          <Text style={styles.timerLabel}>DEPARTS IN</Text>
          <Text style={styles.timerValue}>{formatTime(secondsLeft)}</Text>
          <Text style={styles.timerSub}>Please arrive 15 minutes before departure.</Text>
        </View>

        {/* Mini Map */}
        <View style={styles.mapContainer}>
          <MapView
            key={`map-${MAP_TYPE}`}
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
              strokeWidth={4}
            />
            {busRoute.stops.map((stop, i) => (
              <Marker key={stop.id} coordinate={stop}>
                <View style={[styles.stopDot, i === 0 || i === busRoute.stops.length - 1 ? styles.stopDotMain : null]} />
              </Marker>
            ))}
            <Marker coordinate={bus.gpsLocation} zIndex={10}>
              <View style={styles.busMarker}>
                <Ionicons name="bus" size={16} color={Colors.white} />
              </View>
            </Marker>
          </MapView>
          
          <Button 
            label="Track Live" 
            onPress={() => (navigation as any).getParent()?.navigate('MapTab', { screen: 'LiveTracking', params: { busId: bus.id, bookingId } })}
            style={styles.trackOverlayBtn}
            iconLeft="location-outline"
          />
        </View>

        {/* Bus / Route Details */}
        <View style={styles.detailsCard}>
          <Text style={styles.routeName}>{booking.routeName}</Text>
          <Text style={styles.travelDate}>{booking.travelDate}</Text>
          
          <View style={styles.divider} />
          
          <View style={styles.infoGrid}>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Seat</Text>
              <Text style={styles.infoValue}>{booking.seatNumber}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Bus</Text>
              <Text style={styles.infoValue}>{bus.busType}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Plate</Text>
              <Text style={styles.infoValue}>{bus.plateNumber}</Text>
            </View>
          </View>
        </View>

        {/* Crowd Alert */}
        {crowd.crowdLevel === 'high' && (
          <View style={styles.alertCard}>
            <Ionicons name="warning" size={20} color={Colors.error} />
            <View style={{ flex: 1 }}>
              <Text style={styles.alertTitle}>Crowd Alert</Text>
              <Text style={styles.alertMsg}>This bus is gaining high occupancy. Settle in your seat early!</Text>
            </View>
          </View>
        )}

      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <Button 
          label="View Full Ticket" 
          onPress={() => navigation.navigate('DigitalTicket', { bookingId })} 
          style={{ width: '100%' }}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  content: { paddingHorizontal: Spacing.screenPadding, paddingBottom: 100 },
  
  timerCard: {
    backgroundColor: Colors.primaryTint,
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
    alignItems: 'center',
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.primary + '30',
  },
  timerLabel: { ...Typography.tiny, color: Colors.primary, fontWeight: '700', letterSpacing: 1, marginBottom: Spacing.xs },
  timerValue: { ...Typography.h1, color: Colors.primary, fontVariant: ['tabular-nums'] },
  timerSub: { ...Typography.caption, color: Colors.textSecondary, marginTop: Spacing.xs },

  mapContainer: {
    height: 200,
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    marginBottom: Spacing.lg,
    ...Shadows.card,
  },
  map: { flex: 1 },
  stopDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: Colors.white, borderWidth: 2, borderColor: Colors.primary },
  stopDotMain: { width: 14, height: 14, borderRadius: 7 },
  busMarker: { backgroundColor: Colors.primary, width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: Colors.white },
  trackOverlayBtn: { position: 'absolute', bottom: Spacing.md, left: Spacing.xl, right: Spacing.xl, ...Shadows.button },

  detailsCard: {
    backgroundColor: Colors.card, borderRadius: BorderRadius.xl, padding: Spacing.lg, ...Shadows.card, marginBottom: Spacing.md
  },
  routeName: { ...Typography.h3, color: Colors.textPrimary },
  travelDate: { ...Typography.bodyMedium, color: Colors.textSecondary, marginTop: 2 },
  divider: { height: 1, backgroundColor: Colors.divider, marginVertical: Spacing.md },
  infoGrid: { flexDirection: 'row', justifyContent: 'space-between' },
  infoItem: { flex: 1, alignItems: 'center' },
  infoLabel: { ...Typography.caption, color: Colors.textMuted },
  infoValue: { ...Typography.h4, color: Colors.textPrimary, marginTop: 4 },

  alertCard: {
    backgroundColor: Colors.errorTint, borderRadius: BorderRadius.lg, padding: Spacing.md,
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md, borderWidth: 1, borderColor: Colors.error + '40',
  },
  alertTitle: { ...Typography.bodyMedium, color: Colors.error },
  alertMsg: { ...Typography.caption, color: Colors.error, opacity: 0.8 },

  footer: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: Colors.white, padding: Spacing.lg, borderTopWidth: 1, borderTopColor: Colors.border, paddingBottom: Spacing.safeBottom,
  },
});
