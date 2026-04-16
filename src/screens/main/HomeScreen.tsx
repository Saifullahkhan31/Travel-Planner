import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  FlatList, RefreshControl, Dimensions, Platform,
} from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_DEFAULT, UrlTile } from 'react-native-maps';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { HomeStackParamList, Bus, Route, AITripSuggestion, CrowdPrediction, ComfortScore } from '../../types';
import { Colors } from '../../constants/colors';
import { Spacing, BorderRadius } from '../../constants/spacing';
import { Typography } from '../../constants/typography';
import { Shadows } from '../../constants/shadows';
import { MOCK_BUSES, MOCK_ROUTES, MOCK_NOTIFICATIONS } from '../../services/mockData';
import { aiService } from '../../services/aiService';
import { useAuth } from '../../context/AuthContext';
import { MAP_PROVIDER, MAP_TYPE, OSM_TILE_URL } from '../../utils/mapConfig';
import CrowdPill from '../../components/cards/CrowdPill';
import ComfortScoreRing from '../../components/cards/ComfortScoreRing';
import AISuggestionCard from '../../components/cards/AISuggestionCard';
import LocationPickerModal from '../../components/modals/LocationPickerModal';

// SCREEN : HomeScreen  ROUTE : Home

type Props = { navigation: NativeStackNavigationProp<HomeStackParamList, 'Home'> };

export default function HomeScreen({ navigation }: Props) {
  const { user } = useAuth();
  const [suggestions, setSuggestions]   = useState<AITripSuggestion[]>([]);
  const [refreshing,  setRefreshing]    = useState(false);
  const [unreadCount, setUnreadCount]   = useState(0);

  // Location State
  const [currentCity, setCurrentCity] = useState('Pakistan');
  const [locationModalVisible, setLocationModalVisible] = useState(false);

  const load = useCallback(() => {
    // Filter suggestions by city if applicable
    const allSuggestions = aiService.getTripSuggestions(user?.id ?? '');
    const filteredSuggestions = allSuggestions.filter(s => 
      currentCity === 'Pakistan' || s.routeName.toLowerCase().includes(currentCity.toLowerCase())
    );
    setSuggestions(filteredSuggestions);

    const unread = MOCK_NOTIFICATIONS.filter(n => !n.isRead && n.userId === 'u1').length;
    setUnreadCount(unread);
  }, [user, currentCity]);

  useEffect(() => { load(); }, [load]);

  const onRefresh = () => { setRefreshing(true); load(); setTimeout(() => setRefreshing(false), 800); };

  const topSuggestion = suggestions[0];
  const now = new Date();
  const greeting = now.getHours() < 12 ? 'Good Morning' : now.getHours() < 17 ? 'Good Afternoon' : 'Good Evening';

  const QUICK_ACTIONS = [
    { icon: 'map-outline',      label: 'Routes',      color: '#3B82F6', bg: '#EFF6FF',
      onPress: () => (navigation as any).getParent()?.navigate('MapTab') },
    { icon: 'ticket-outline',   label: 'My Tickets',  color: '#8B5CF6', bg: '#F5F3FF',
      onPress: () => (navigation as any).getParent()?.navigate('TicketsTab') },
    { icon: 'analytics-outline',label: 'Crowd Intel',  color: '#F59E0B', bg: '#FFFBEB',
      onPress: () => (navigation as any).getParent()?.navigate('AITab') },
    { icon: 'time-outline',     label: 'History',     color: '#10B981', bg: '#ECFDF5',
      onPress: () => (navigation as any).getParent()?.navigate('TicketsTab', { screen: 'TravelHistory' }) },
  ];

    const initials = (user?.name || 'Traveller')
      .split(' ')
      .map(w => w[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);

    return (
      <SafeAreaView style={styles.safe}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
        >
          {/* ── Header ── */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <TouchableOpacity 
                style={styles.avatar}
                onPress={() => navigation.getParent()?.navigate('ProfileTab')}
                activeOpacity={0.8}
              >
                <Text style={styles.avatarInitials}>{initials}</Text>
              </TouchableOpacity>
              <View>
                <Text style={styles.greeting}>{greeting}, {user?.name?.split(' ')[0] ?? 'Traveller'} 👋</Text>
                <TouchableOpacity 
                  style={styles.locationRow} 
                  onPress={() => setLocationModalVisible(true)}
                  activeOpacity={0.7}
                  hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
                >
                  <Ionicons name="location-outline" size={14} color={Colors.primary} />
                  <Text style={styles.location}>{currentCity}</Text>
                  <Ionicons name="chevron-down" size={12} color={Colors.textSecondary} />
                </TouchableOpacity>
              </View>
            </View>
          <TouchableOpacity
            style={styles.notifBtn}
            onPress={() => navigation.navigate('Notifications')}
            activeOpacity={0.7}
          >
            <Ionicons name="notifications-outline" size={22} color={Colors.textPrimary} />
            {unreadCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{unreadCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* ── Search Bar ── */}
        <TouchableOpacity
          style={styles.searchBar}
          onPress={() => navigation.navigate('Search')}
          activeOpacity={0.8}
        >
          <Ionicons name="search-outline" size={18} color={Colors.textMuted} />
          <Text style={styles.searchPlaceholder}>Where do you want to go?</Text>
          <View style={styles.aiBadge}>
            <Text style={styles.aiText}>✦ AI</Text>
          </View>
        </TouchableOpacity>

        {/* ── Quick Route Chips ── */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsScroll}>
          {MOCK_ROUTES.slice(0, 4).map(r => (
            <TouchableOpacity
              key={r.id}
              style={styles.routeChip}
              onPress={() => navigation.navigate('RouteResults', { origin: r.origin, destination: r.destination, date: new Date().toDateString() })}
              activeOpacity={0.7}
            >
              <Text style={styles.routeChipText} numberOfLines={1}>{r.routeName}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* ── AI Suggestion Card ── */}
        {topSuggestion && (
          <AISuggestionCard
            suggestion={topSuggestion}
            onPress={() => (navigation as any).getParent()?.navigate('AITab', { screen: 'AITripSuggestion', params: { suggestionData: topSuggestion } })}
            onBook={() => navigation.navigate('BusDetail', { busId: topSuggestion.suggestedBusId, routeId: topSuggestion.routeId })}
          />
        )}

        {/* ── Live Map Preview ── */}
        <View style={styles.mapCard}>
          <MapView
            style={styles.mapView}
            provider={MAP_PROVIDER}
            mapType={MAP_TYPE}
            initialRegion={{
              latitude      : 25.1,
              longitude     : 67.5,
              latitudeDelta : 2.5,
              longitudeDelta: 2.5,
            }}
            scrollEnabled={false}
            zoomEnabled={false}
            rotateEnabled={false}
            pitchEnabled={false}
            showsUserLocation={false}
            showsCompass={false}
            showsScale={false}
          >
            {Platform.OS === 'android' && (
              <UrlTile urlTemplate={OSM_TILE_URL} zIndex={-1} />
            )}
            {/* Karachi → Hyderabad route polyline */}
            <Polyline
              coordinates={MOCK_ROUTES[0].stops.map(s => ({ latitude: s.latitude, longitude: s.longitude }))}
              strokeColor={Colors.primary}
              strokeWidth={3}
            />
            {/* First active bus */}
            <Marker
              coordinate={MOCK_BUSES[0].gpsLocation}
              anchor={{ x: 0.5, y: 0.5 }}
            >
              <View style={styles.mapBusMarker}>
                <Text style={{ fontSize: 14 }}>🚌</Text>
              </View>
            </Marker>
          </MapView>

          {/* Overlay */}
          <View style={styles.mapOverlay}>
            <View style={styles.liveIndicator}>
              <View style={styles.liveDot} />
              <Text style={styles.liveText}>Live Tracking ON</Text>
            </View>
            <TouchableOpacity
              style={styles.fullMapBtn}
              activeOpacity={0.7}
              onPress={() => (navigation as any).getParent()?.navigate('MapTab')}
            >
              <Text style={styles.fullMapText}>↗ Full Map</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Recommended Buses ── */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recommended Buses</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Search')} activeOpacity={0.7}>
            <Text style={styles.seeAll}>See All</Text>
          </TouchableOpacity>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.busScroll}>
          {MOCK_BUSES
            .filter(bus => {
              const route = MOCK_ROUTES.find(r => r.id === bus.routeId);
              return currentCity === 'Pakistan' || route?.origin === currentCity;
            })
            .slice(0, 5).map(bus => {
            const route = MOCK_ROUTES.find(r => r.id === bus.routeId)!;
            const crowd  = aiService.predictCrowd(bus.id, bus.currentOccupancy, bus.totalSeats);
            const comfort= aiService.getComfortScore(bus.id, bus.currentOccupancy, bus.totalSeats, bus.busType);
            const fare   = aiService.estimateFare(route.id, bus.busType, route.distance);
            return (
              <TouchableOpacity
                key={bus.id}
                style={styles.miniCard}
                onPress={() => navigation.navigate('BusDetail', { busId: bus.id, routeId: bus.routeId })}
                activeOpacity={0.7}
              >
                <ComfortScoreRing score={comfort.score} size="sm" />
                <Text style={styles.miniRoute} numberOfLines={2}>{route.routeName}</Text>
                <CrowdPill crowdLevel={crowd.crowdLevel} />
                <Text style={styles.miniFare}>PKR {fare.totalFare}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* ── Quick Actions ── */}
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionsGrid}>
          {QUICK_ACTIONS.map((a, i) => (
            <TouchableOpacity
              key={i}
              style={[styles.actionBtn, { backgroundColor: a.bg }]}
              activeOpacity={0.7}
              onPress={a.onPress}
            >
              <Ionicons name={a.icon as any} size={26} color={a.color} />
              <Text style={[styles.actionLabel, { color: a.color }]}>{a.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ── Crowd Alert Banner ── */}
        <View style={styles.alertBanner}>
          <Text style={styles.alertText}>🚨 <Text style={{ fontWeight: '700' }}>Crowd Alert:</Text> Bus KHI-5522 on IoBM → Gulshan is filling up fast. Book now!</Text>
        </View>

        <LocationPickerModal
          visible={locationModalVisible}
          onClose={() => setLocationModalVisible(false)}
          onSelectCity={setCurrentCity}
          currentCity={currentCity}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe   : { flex: 1, backgroundColor: Colors.background },
  scroll : { flex: 1 },
  content: { paddingHorizontal: Spacing.screenPadding, paddingBottom: Spacing.safeBottom },

  // Header
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: Spacing.lg, marginBottom: Spacing.lg },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  avatar: { 
    width: 44, 
    height: 44, 
    borderRadius: 22, 
    backgroundColor: Colors.primary, 
    alignItems: 'center', 
    justifyContent: 'center',
    ...Shadows.card
  },
  avatarInitials: { fontSize: 16, fontWeight: '700', color: Colors.white },
  greeting: { ...Typography.bodyMedium },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  location: { ...Typography.captionMed, color: Colors.textPrimary },
  notifBtn: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.card,
    alignItems: 'center', justifyContent: 'center', ...Shadows.card,
  },
  badge: {
    position: 'absolute', top: 6, right: 6,
    width: 16, height: 16, borderRadius: 8, backgroundColor: Colors.error,
    alignItems: 'center', justifyContent: 'center',
  },
  badgeText: { ...Typography.tiny, color: Colors.white, fontSize: 9, fontWeight: '700' },

  // Search
  searchBar: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.card, borderRadius: BorderRadius.lg,
    padding: Spacing.md, gap: Spacing.sm, marginBottom: Spacing.md, ...Shadows.card,
  },
  searchPlaceholder: { ...Typography.body, color: Colors.textMuted, flex: 1 },
  aiBadge: { backgroundColor: Colors.primaryTint, borderRadius: BorderRadius.full, paddingHorizontal: 8, paddingVertical: 3 },
  aiText : { fontSize: 11, fontWeight: '700', color: Colors.primary },

  // Chips
  chipsScroll: { marginBottom: Spacing.lg },
  routeChip  : {
    backgroundColor: Colors.card, borderRadius: BorderRadius.full, paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm, marginRight: Spacing.sm, ...Shadows.card,
  },
  routeChipText: { ...Typography.caption, color: Colors.textSecondary, maxWidth: 150 },

  // AI Card
  aiCard: {
    backgroundColor: Colors.card, borderRadius: BorderRadius.xl,
    padding: Spacing.lg, marginBottom: Spacing.lg,
    borderLeftWidth: 4, borderLeftColor: Colors.primary, ...Shadows.float,
  },
  aiCardHeader  : { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.sm },
  aiBadgeLarge  : { backgroundColor: Colors.primaryTint, borderRadius: BorderRadius.full, paddingHorizontal: 10, paddingVertical: 4 },
  aiTextLarge   : { fontSize: 12, fontWeight: '600', color: Colors.primary },
  routineLabel  : { ...Typography.tiny },
  aiRouteName   : { ...Typography.h3, marginBottom: Spacing.sm },
  routeLine     : { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.md },
  routeDot      : { width: 10, height: 10, borderRadius: 5, backgroundColor: Colors.success },
  routeTrack    : { flex: 1, flexDirection: 'row', alignItems: 'center', marginHorizontal: 4, gap: 4 },
  routeSegment  : { flex: 1, height: 2, backgroundColor: Colors.border, borderRadius: 1 },
  aiCardMeta    : { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.md, marginBottom: Spacing.md },
  etaText       : { ...Typography.caption, marginBottom: Spacing.sm },
  crowdComfortRow: { flexDirection: 'row', gap: Spacing.sm, alignItems: 'center', marginBottom: Spacing.sm },
  busTypeBadge  : { backgroundColor: Colors.primaryTint, borderRadius: BorderRadius.full, paddingHorizontal: 8, paddingVertical: 3 },
  busTypeTxt    : { fontSize: 11, fontWeight: '500', color: Colors.primary },
  fareText      : { ...Typography.caption },
  bookNowBtn    : { backgroundColor: Colors.primary, borderRadius: BorderRadius.md, height: 44, alignItems: 'center', justifyContent: 'center', ...Shadows.button },
  bookNowText   : { ...Typography.buttonLabel },

  // Map Card
  mapCard        : { borderRadius: BorderRadius.xl, overflow: 'hidden', marginBottom: Spacing.lg, height: 160, ...Shadows.card },
  mapView        : { flex: 1 },
  mapBusMarker   : {
    width: 28, height: 28, borderRadius: BorderRadius.sm,
    backgroundColor: Colors.white, alignItems: 'center', justifyContent: 'center',
    ...Shadows.card,
  },
  mapOverlay     : { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', padding: Spacing.md },
  liveIndicator  : { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: BorderRadius.full, paddingHorizontal: 10, paddingVertical: 5 },
  liveDot        : { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.success },
  liveText       : { fontSize: 11, color: Colors.white, fontWeight: '600' },
  fullMapBtn     : { backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: BorderRadius.full, paddingHorizontal: 10, paddingVertical: 5 },
  fullMapText    : { fontSize: 11, color: Colors.white, fontWeight: '600' },

  // Sections
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.sm },
  sectionTitle : { ...Typography.h4, marginBottom: Spacing.sm },
  seeAll       : { ...Typography.caption, color: Colors.primary, fontWeight: '600' },

  // Mini Bus Cards
  busScroll: { marginBottom: Spacing.lg },
  miniCard : {
    width: 140, backgroundColor: Colors.card, borderRadius: BorderRadius.lg,
    padding: Spacing.md, marginRight: Spacing.sm, alignItems: 'center', ...Shadows.card,
  },
  miniRoute: { ...Typography.tiny, textAlign: 'center', marginVertical: Spacing.sm, height: 28 },
  miniFare : { ...Typography.captionMed, color: Colors.primary, marginTop: Spacing.xs },

  // Actions Grid
  actionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginBottom: Spacing.lg },
  actionBtn  : { width: '46%', padding: Spacing.md, borderRadius: BorderRadius.lg, alignItems: 'center', gap: 6 },
  actionLabel: { ...Typography.caption, fontWeight: '600' },

  // Alert
  alertBanner: {
    backgroundColor: Colors.errorTint, borderRadius: BorderRadius.md,
    padding: Spacing.md, marginBottom: Spacing.lg, borderLeftWidth: 3, borderLeftColor: Colors.error,
  },
  alertText: { ...Typography.caption, color: Colors.error, lineHeight: 18 },
});
