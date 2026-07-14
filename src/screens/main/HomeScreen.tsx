import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  FlatList, RefreshControl, Dimensions, Platform, Modal
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import MapView, { Marker, Polyline, PROVIDER_DEFAULT, UrlTile } from 'react-native-maps';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { HomeStackParamList, Bus, Route, AITripSuggestion, CrowdPrediction, ComfortScore } from '../../types';
import { Colors } from '../../constants/colors';
import { Spacing, BorderRadius } from '../../constants/spacing';
import { Typography } from '../../constants/typography';
import { Shadows } from '../../constants/shadows';
import { aiService } from '../../services/aiService';
import { busService } from '../../services/busService';
import { useAuth } from '../../context/AuthContext';
import { HOME_MAP_POLYLINE_COORDS, HOME_MAP_BUS_LOCATION } from '../../services/aiMockData';
import { supabase } from '../../lib/supabase';
import { MAP_PROVIDER, MAP_TYPE, OSM_TILE_URL } from '../../utils/mapConfig';
import CrowdPill from '../../components/cards/CrowdPill';
import ComfortScoreRing from '../../components/cards/ComfortScoreRing';
import AISuggestionCard from '../../components/cards/AISuggestionCard';
import LocationPickerModal from '../../components/modals/LocationPickerModal';
import SavedRoutesModal from '../../components/modals/SavedRoutesModal';

// SCREEN : HomeScreen  ROUTE : Home

type Props = { navigation: NativeStackNavigationProp<HomeStackParamList, 'Home'> };

export default function HomeScreen({ navigation }: Props) {
  const { user } = useAuth();
  const [suggestions, setSuggestions] = useState<AITripSuggestion[]>([]);
  const [liveBuses,   setLiveBuses]   = useState<Bus[]>([]);
  const [refreshing,  setRefreshing]  = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // Location State
  const [currentCity, setCurrentCityState] = useState('Pakistan');
  const [locationModalVisible, setLocationModalVisible] = useState(false);
  const [savedRoutesModalVisible, setSavedRoutesModalVisible] = useState(false);

  const [routeList, setRouteList] = useState<any[]>([]);

  useEffect(() => {
    AsyncStorage.getItem('HomeScreen_CurrentCity').then(city => {
      if (city) setCurrentCityState(city);
    });
  }, []);

  const setCurrentCity = useCallback((city: string) => {
    setCurrentCityState(city);
    AsyncStorage.setItem('HomeScreen_CurrentCity', city);
  }, []);

  const load = useCallback(async () => {
    // Fetch live buses and routes together
    const { data: buses }  = await busService.getAllBuses();
    const { data: routes } = await busService.getAllRoutes();

    const busList   = buses  ?? [];
    const rList = routes ?? [];

    setRouteList(rList);
    if (busList.length > 0) setLiveBuses(busList);

    // Filter relevant buses before feeding to AI generator so it doesn't truncate prematurely
    const relevantBuses = currentCity === 'Pakistan' 
      ? busList 
      : busList.filter(b => {
          const matchingRoute = rList.find(r => r.id === b.routeId);
          return matchingRoute?.origin?.toLowerCase() === currentCity.toLowerCase() || 
                 matchingRoute?.routeName?.toLowerCase().startsWith(currentCity.toLowerCase());
        });

    // AI suggestions now reliably use live IDs from the targeted city pool
    const targetedSuggestions = aiService.getTripSuggestions(user, relevantBuses, rList);
    setSuggestions(targetedSuggestions);

  }, [user, currentCity]);

  useFocusEffect(
    useCallback(() => {
      const fetchUnreadCount = async () => {
        if (!user) return;
        const { count } = await supabase
          .from('notifications')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .eq('is_read', false);
        
        if (count !== null) {
          setUnreadCount(count);
        }
      };
      fetchUnreadCount();
    }, [user])
  );

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

    // ── Intelligent Filtering ──
    const validRoutes = routeList.filter(r => liveBuses.some(b => b.routeId === r.id && b.isActive));
    // User's frequent routes
    const userFavs = validRoutes.filter(r => user?.frequentRoutes?.includes(r.routeName));

    let quickRoutes = currentCity === 'Pakistan' 
      ? validRoutes 
      : validRoutes.filter(r => r.origin?.toLowerCase() === currentCity.toLowerCase());

    if (quickRoutes.length < 4 && currentCity !== 'Pakistan') {
      const arrivingRoutes = validRoutes.filter(r => 
        r.destination?.toLowerCase() === currentCity.toLowerCase() &&
        !quickRoutes.find(qr => qr.id === r.id)
      );
      quickRoutes = [...quickRoutes, ...arrivingRoutes];
    }

    // Remove userFavs from quickRoutes to avoid duplication if we have a separate favorites button
    quickRoutes = quickRoutes.filter(r => !userFavs.some(fav => fav.id === r.id));
    const displayRoutes = quickRoutes.slice(0, 4);

    const displayBuses = liveBuses
      .filter(bus => bus.isActive && routeList.some(r => r.id === bus.routeId))
      .slice(0, 5);

    return (
    <SafeAreaView style={styles.safe} edges={['top']}>
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
          {userFavs.length > 0 && (
            <TouchableOpacity
              style={[styles.routeChip, { borderColor: Colors.error, borderWidth: 1 }]}
              onPress={() => setSavedRoutesModalVisible(true)}
              activeOpacity={0.7}
            >
              <Ionicons name="heart" size={12} color={Colors.error} style={{ marginRight: 4 }} />
              <Text style={styles.routeChipText}>Saved Routes ({userFavs.length})</Text>
            </TouchableOpacity>
          )}
          {displayRoutes.map((r, idx) => (
            <TouchableOpacity
              key={`${r.id}-${idx}`}
              style={styles.routeChip}
              onPress={() => navigation.navigate('RouteResults', {
                origin: r.origin,
                destination: r.destination,
                date: new Date().toISOString().split('T')[0],
              })}
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
            onPress={() => (navigation as any).navigate('AITripSuggestion', { suggestionData: topSuggestion })}
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
            {/* Karachi → Hyderabad decorative polyline (static highway coords) */}
            <Polyline
              coordinates={HOME_MAP_POLYLINE_COORDS}
              strokeColor={Colors.primary}
              strokeWidth={3}
            />
            {/* Static bus marker for map preview */}
            <Marker
              coordinate={HOME_MAP_BUS_LOCATION}
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
          <TouchableOpacity onPress={() => (navigation as any).navigate('RecommendedBuses')} activeOpacity={0.7}>
            <Text style={styles.seeAll}>See All</Text>
          </TouchableOpacity>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.busScroll}>
          {displayBuses.map((bus, idx) => {
              const crowd   = aiService.predictCrowd(bus.id, bus.currentOccupancy, bus.totalSeats);
              const comfort = aiService.getComfortScore(bus.id, bus.currentOccupancy, bus.totalSeats, bus.busType);
              const fare    = aiService.estimateFare(bus.routeId || 'r1', bus.busType, 200);
              return (
                <TouchableOpacity
                  key={`${bus.id}-${idx}`}
                  style={styles.miniCard}
                  onPress={() => navigation.navigate('BusDetail', { busId: bus.id, routeId: bus.routeId || '' })}
                  activeOpacity={0.7}
                >
                  <ComfortScoreRing score={comfort.score} size="sm" />
                  <Text style={styles.miniRoute} numberOfLines={2}>{bus.plateNumber}</Text>
                  <CrowdPill crowdLevel={crowd.crowdLevel} />
                  <Text style={styles.miniFare}>PKR {fare.totalFare}</Text>
                </TouchableOpacity>
              );
            })
          }
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
          <Text style={styles.alertText}>🚨 <Text style={{ fontWeight: '700' }}>Crowd Alert:</Text> Bus KHI-001 on Karachi → Hyderabad is filling up fast. Book now!</Text>
        </View>

        <LocationPickerModal
          visible={locationModalVisible}
          onClose={() => setLocationModalVisible(false)}
          onSelectCity={setCurrentCity}
          currentCity={currentCity}
        />

        <SavedRoutesModal
          visible={savedRoutesModalVisible}
          onClose={() => setSavedRoutesModalVisible(false)}
          savedRoutes={userFavs}
          onSelectRoute={(r) => {
            navigation.navigate('RouteResults', {
              origin: r.origin,
              destination: r.destination,
              date: new Date().toISOString().split('T')[0],
            });
          }}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe   : { flex: 1, backgroundColor: Colors.background },
  scroll : { flex: 1 },
  content: { paddingHorizontal: Spacing.screenPadding, paddingBottom: Spacing.lg },

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
    paddingVertical: Spacing.sm, marginRight: Spacing.sm, flexDirection: 'row', alignItems: 'center', ...Shadows.card,
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
  actionsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: Spacing.sm, marginBottom: Spacing.lg },
  actionBtn  : { width: '48%', padding: Spacing.md, borderRadius: BorderRadius.lg, alignItems: 'center', gap: 6 },
  actionLabel: { ...Typography.caption, fontWeight: '600' },

  // Alert
  alertBanner: {
    backgroundColor: Colors.errorTint, borderRadius: BorderRadius.md,
    padding: Spacing.md, marginBottom: Spacing.lg, borderLeftWidth: 3, borderLeftColor: Colors.error,
  },
  alertText: { ...Typography.caption, color: Colors.error, lineHeight: 18 },
});
