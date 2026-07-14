import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';

import { ProfileStackParamList } from '../../types';
import { Colors } from '../../constants/colors';
import { Spacing, BorderRadius } from '../../constants/spacing';
import { Typography } from '../../constants/typography';
import { useAuth } from '../../context/AuthContext';
import { busService } from '../../services/busService';
import ScreenHeader from '../../components/common/ScreenHeader';
import Button from '../../components/common/Button';
import { Shadows } from '../../constants/shadows';

type Props = NativeStackScreenProps<ProfileStackParamList, 'Preferences'>;

// ─── Option Pill ─────────────────────────────────────────────────────────────
function OptionPill({
  label, active, onPress, icon,
}: { label: string; active: boolean; onPress: () => void; icon?: string }) {
  return (
    <TouchableOpacity
      style={[styles.pill, active && styles.pillActive]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {icon && <Text style={{ fontSize: 14 }}>{icon}</Text>}
      <Text style={[styles.pillText, active && styles.pillTextActive]}>{label}</Text>
      {active && <Ionicons name="checkmark" size={13} color={Colors.white} />}
    </TouchableOpacity>
  );
}

// ─── Section Header ───────────────────────────────────────────────────────────
function SectionTitle({ icon, title, sub }: { icon: string; title: string; sub?: string }) {
  return (
    <View style={styles.sectionHeader}>
      <View style={styles.sectionIconBg}>
        <Ionicons name={icon as any} size={16} color={Colors.primary} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.sectionTitle}>{title}</Text>
        {sub && <Text style={styles.sectionSub}>{sub}</Text>}
      </View>
    </View>
  );
}

export default function PreferencesScreen({ navigation }: Props) {
  const { user, updateUser } = useAuth();

  // ── Travel Preferences ────────────────────────────────────────────────────
  const [seatPref, setSeatPref]       = useState<'window' | 'aisle' | 'front' | 'back'>(user?.seatPreference || 'window');
  const [busType, setBusType]         = useState<'AC' | 'Non-AC' | 'Premium'>(user?.busTypePreference || 'AC');
  const [genderPref, setGenderPref]   = useState<'no_preference' | 'female_only' | 'male_only'>(user?.genderPreference || 'no_preference');
  const [frequentRoutes, setFrequentRoutes] = useState<string[]>(user?.frequentRoutes || []);

  // ── Journey Style ──────────────────────────────────────────────────────────
  const [departureTime, setDepartureTime]     = useState<string>(user?.preferredDepartureTime || 'morning');
  const [travelPriority, setTravelPriority]   = useState<string>(user?.travelPriority || 'comfort');
  const [budgetRange, setBudgetRange]         = useState<string>(user?.budgetRange || 'medium');

  // ── Notifications ─────────────────────────────────────────────────────────
  const [notifTrips, setNotifTrips]           = useState(user?.notifTrips    ?? true);
  const [notifCrowd, setNotifCrowd]           = useState(user?.notifCrowd   ?? true);
  const [notifBookings, setNotifBookings]     = useState(user?.notifBookings ?? true);

  // ── Routes ────────────────────────────────────────────────────────────────
  const [availableRoutes, setAvailableRoutes] = useState<string[]>([]);
  const [routesLoading, setRoutesLoading]     = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await busService.getAllRoutes();
      if (data) {
        setAvailableRoutes(data.map(r => r.routeName));
      }
      setRoutesLoading(false);
    })();
  }, []);

  const toggleRoute = (route: string) => {
    setFrequentRoutes(prev =>
      prev.includes(route) ? prev.filter(r => r !== route) : [...prev, route]
    );
  };

  const handleSave = async () => {
    await updateUser({
      seatPreference   : seatPref as any,
      busTypePreference: busType  as any,
      genderPreference : genderPref as any,
      frequentRoutes,
      notifTrips,
      notifCrowd,
      notifBookings,
      // Extended preferences (stored in profile for LLM context)
      preferredDepartureTime: departureTime as any,
      travelPriority        : travelPriority as any,
      budgetRange           : budgetRange as any,
    });
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScreenHeader title={user?.role === 'driver' ? 'Notifications' : 'Preferences'} onBack={() => navigation.goBack()} />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {user?.role !== 'driver' && (
          <>
            {/* ── AI Context Banner ── */}
        <View style={styles.aiBanner}>
          <Ionicons name="sparkles" size={18} color={Colors.primary} />
          <Text style={styles.aiBannerText}>
            These preferences power your AI suggestions, crowd predictions, and personalised route recommendations.
          </Text>
        </View>

        {/* ── Seat Preference ── */}
        <SectionTitle icon="person-outline" title="Seat Preference" />
        <View style={styles.pillRow}>
          {[
            { value: 'window', label: 'Window', icon: '🪟' },
            { value: 'aisle',  label: 'Aisle',  icon: '🚶' },
            { value: 'front',  label: 'Front',  icon: '⬆️' },
            { value: 'back',   label: 'Back',   icon: '⬇️' },
          ].map(o => (
            <OptionPill key={o.value} label={o.label} icon={o.icon} active={seatPref === o.value} onPress={() => setSeatPref(o.value as any)} />
          ))}
        </View>

        {/* ── Bus Type ── */}
        <SectionTitle icon="bus-outline" title="Preferred Bus Type" />
        <View style={styles.pillRow}>
          {[
            { value: 'AC',      label: 'AC',       icon: '❄️' },
            { value: 'Non-AC',  label: 'Non-AC',   icon: '🌬️' },
            { value: 'Premium', label: 'Premium',  icon: '⭐' },
          ].map(o => (
            <OptionPill key={o.value} label={o.label} icon={o.icon} active={busType === o.value} onPress={() => setBusType(o.value as any)} />
          ))}
        </View>

        {/* ── Gender Section Preference ── */}
        <SectionTitle icon="people-outline" title="Section Preference" sub="Choose your preferred seating section" />
        <View style={styles.pillRow}>
          {[
            { value: 'no_preference', label: 'No Preference', icon: '✌️' },
            { value: 'female_only',   label: 'Female Section', icon: '🚺' },
            { value: 'male_only',     label: 'Male Section',  icon: '🚹' },
          ].map(o => (
            <OptionPill key={o.value} label={o.label} icon={o.icon} active={genderPref === o.value} onPress={() => setGenderPref(o.value as any)} />
          ))}
        </View>

        {/* ── Preferred Departure Time ── */}
        <SectionTitle icon="time-outline" title="Preferred Departure Time" sub="AI uses this to tailor crowd predictions" />
        <View style={styles.pillRow}>
          {[
            { value: 'early_morning', label: 'Early Morning', icon: '🌅' },
            { value: 'morning',       label: 'Morning',       icon: '☀️' },
            { value: 'afternoon',     label: 'Afternoon',     icon: '🌤️' },
            { value: 'evening',       label: 'Evening',       icon: '🌆' },
            { value: 'night',         label: 'Night',         icon: '🌙' },
          ].map(o => (
            <OptionPill key={o.value} label={o.label} icon={o.icon} active={departureTime === o.value} onPress={() => setDepartureTime(o.value)} />
          ))}
        </View>

        {/* ── Travel Priority ── */}
        <SectionTitle icon="trophy-outline" title="Travel Priority" sub="AI ranks route suggestions based on this" />
        <View style={styles.pillRow}>
          {[
            { value: 'comfort',  label: 'Comfort',   icon: '🛋️' },
            { value: 'speed',    label: 'Speed',     icon: '⚡' },
            { value: 'cost',     label: 'Low Cost',  icon: '💰' },
            { value: 'crowd',    label: 'Low Crowd', icon: '🧘' },
          ].map(o => (
            <OptionPill key={o.value} label={o.label} icon={o.icon} active={travelPriority === o.value} onPress={() => setTravelPriority(o.value)} />
          ))}
        </View>

        {/* ── Budget Range ── */}
        <SectionTitle icon="wallet-outline" title="Budget Range" sub="Helps AI filter fare-appropriate routes" />
        <View style={styles.pillRow}>
          {[
            { value: 'low',    label: 'Budget  (< PKR 500)',   icon: '🟢' },
            { value: 'medium', label: 'Medium (PKR 500-1500)', icon: '🟡' },
            { value: 'high',   label: 'Premium (> PKR 1500)',  icon: '🔴' },
          ].map(o => (
            <OptionPill key={o.value} label={o.label} icon={o.icon} active={budgetRange === o.value} onPress={() => setBudgetRange(o.value)} />
          ))}
        </View>

        {/* ── Frequent Routes ── */}
        <SectionTitle icon="map-outline" title="Frequent Routes" sub="Mark routes you travel often for smarter AI routine detection" />
        {routesLoading ? (
          <ActivityIndicator color={Colors.primary} style={{ marginBottom: Spacing.xl }} />
        ) : (
          <View style={styles.pillRow}>
            {availableRoutes.map(route => (
              <OptionPill
                key={route}
                label={route}
                active={frequentRoutes.includes(route)}
                onPress={() => toggleRoute(route)}
              />
            ))}
          </View>
        )}
          </>
        )}

        {/* ── Notifications ── */}
        <SectionTitle icon="notifications-outline" title="Notifications" />
        <View style={styles.toggleCard}>
          {[
            { key: 'reminders', title: 'Trip Reminders',  sub: 'Get notified before your departure time',  value: notifTrips,    set: setNotifTrips },
            { key: 'crowd',     title: 'Crowd Alerts',    sub: 'Notify when your usual bus gets crowded',  value: notifCrowd,    set: setNotifCrowd },
            { key: 'bookings',  title: 'Booking Updates', sub: 'Ticket confirmations and booking changes', value: notifBookings, set: setNotifBookings },
          ].map((item, i, arr) => (
            <View key={item.key}>
              <View style={styles.toggleRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.toggleTitle}>{item.title}</Text>
                  <Text style={styles.toggleSub}>{item.sub}</Text>
                </View>
                <Switch
                  value={item.value}
                  onValueChange={item.set}
                  trackColor={{ false: Colors.border, true: Colors.primary + 'AA' }}
                  thumbColor={item.value ? Colors.primary : Colors.textMuted}
                />
              </View>
              {i < arr.length - 1 && <View style={styles.divider} />}
            </View>
          ))}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      <View style={styles.footer}>
        <Button label="Save Preferences" onPress={handleSave} style={{ width: '100%' }} iconLeft="checkmark-outline" />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe   : { flex: 1, backgroundColor: Colors.background },
  content: { paddingHorizontal: Spacing.screenPadding, paddingTop: Spacing.md },

  // AI Banner
  aiBanner: {
    flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm,
    backgroundColor: Colors.primaryTint, borderRadius: BorderRadius.md,
    padding: Spacing.md, marginBottom: Spacing.lg,
    borderLeftWidth: 3, borderLeftColor: Colors.primary,
  },
  aiBannerText: { ...Typography.caption, color: Colors.primary, flex: 1, lineHeight: 18 },

  // Section headers
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginTop: Spacing.lg, marginBottom: Spacing.sm },
  sectionIconBg : { width: 32, height: 32, borderRadius: BorderRadius.sm, backgroundColor: Colors.primaryTint, alignItems: 'center', justifyContent: 'center' },
  sectionTitle  : { ...Typography.bodyMedium, fontWeight: '700', color: Colors.textPrimary },
  sectionSub    : { ...Typography.tiny, color: Colors.textSecondary, marginTop: 1 },

  // Pills
  pillRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginBottom: Spacing.sm },
  pill   : {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: Spacing.md, paddingVertical: 8,
    borderRadius: BorderRadius.full, borderWidth: 1,
    borderColor: Colors.border, backgroundColor: Colors.card,
  },
  pillActive    : { backgroundColor: Colors.primary, borderColor: Colors.primary },
  pillText      : { ...Typography.caption, color: Colors.textSecondary },
  pillTextActive: { color: Colors.white, fontWeight: '600' },

  // Toggles
  toggleCard : { backgroundColor: Colors.card, borderRadius: BorderRadius.lg, ...Shadows.card, marginBottom: Spacing.md },
  toggleRow  : { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: Spacing.lg },
  toggleTitle: { ...Typography.bodyMedium, color: Colors.textPrimary },
  toggleSub  : { ...Typography.tiny, color: Colors.textSecondary, marginTop: 2, lineHeight: 16 },
  divider    : { height: 1, backgroundColor: Colors.divider, marginHorizontal: Spacing.lg },

  // Footer
  footer: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: Colors.background, padding: Spacing.lg,
    borderTopWidth: 1, borderTopColor: Colors.border,
    paddingBottom: Spacing.safeBottom,
  },
});
