import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, Platform, KeyboardAvoidingView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AuthStackParamList, SeatPosition, BusType, OccupationType } from '../../types';
import { Colors } from '../../constants/colors';
import { Spacing, BorderRadius } from '../../constants/spacing';
import { Typography } from '../../constants/typography';
import { Shadows } from '../../constants/shadows';
import { PAKISTAN_CITIES } from '../../constants/locations';
import InputField from '../../components/common/InputField';
import Button     from '../../components/common/Button';
import { useAuth } from '../../context/AuthContext';

type Props = {
  navigation: NativeStackNavigationProp<AuthStackParamList, 'ProfileSetup'>;
  route     : { params: { userId: string } };
};

const OCCUPATIONS: OccupationType[] = ['student', 'professional', 'worker', 'other'];
const SEAT_POSITIONS: { label: string; value: SeatPosition; icon: string }[] = [
  { label: 'Window',  value: 'window',  icon: '🪟' },
  { label: 'Aisle',   value: 'aisle',   icon: '🚶' },
  { label: 'Front',   value: 'front',   icon: '⬆️' },
  { label: 'Back',    value: 'back',    icon: '⬇️' },
];

export default function ProfileSetupScreen({ navigation }: Props) {
  const { updateUser } = useAuth();
  const [area,     setArea]     = useState('');
  const [occ,      setOcc]      = useState<OccupationType>('student');
  const [seatPref, setSeat]     = useState<SeatPosition>('window');
  const [busType,  setBus]      = useState<BusType>('AC');
  const [notifTrips,    setNT]  = useState(true);
  const [notifCrowd,    setNC]  = useState(true);
  const [notifBookings, setNB]  = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleComplete = async () => {
    setLoading(true);
    setError(null);
    await updateUser({
      area, occupation: occ,
      seatPreference: seatPref,
      busTypePreference: busType,
      notifTrips, notifCrowd, notifBookings,
    });
    setLoading(false);
    // Navigate to the main app regardless — profile is optional
    (navigation as any).reset({ index: 0, routes: [{ name: 'Login' }] });
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          {/* Progress */}
          <View style={styles.progressRow}>
            <View style={[styles.progressBar, { flex: 1, backgroundColor: Colors.success }]} />
            <View style={[styles.progressBar, { flex: 1, backgroundColor: Colors.primary }]} />
          </View>
          <Text style={styles.progressLabel}>Step 2 of 2 — Complete</Text>

          <Text style={styles.title}>Set Up Your Profile</Text>
          <Text style={styles.subtitle}>Help AI personalise your travel experience</Text>

          {/* Avatar placeholder */}
          <View style={styles.avatarRow}>
            <View style={styles.avatar}>
              <Text style={{ fontSize: 48 }}>👤</Text>
            </View>
            <TouchableOpacity style={styles.avatarEdit} activeOpacity={0.7}>
              <Text style={styles.avatarEditText}>Change Photo</Text>
            </TouchableOpacity>
          </View>

          {/* About You */}
          <Text style={styles.sectionTitle}>About You</Text>
          <View style={styles.card}>
            <InputField label="Your City" value={area} onChangeText={setArea}
              placeholder="e.g. Lahore" leftIcon="location-outline" autoCapitalize="words" />

            <Text style={styles.fieldLabel}>Occupation</Text>
            <View style={styles.pillRow}>
              {OCCUPATIONS.map(o => (
                <TouchableOpacity key={o} style={[styles.pill, occ === o && styles.pillActive]}
                  onPress={() => setOcc(o)} activeOpacity={0.7}>
                  <Text style={[styles.pillText, occ === o && styles.pillTextActive]}>
                    {o.charAt(0).toUpperCase() + o.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Travel Preferences */}
          <Text style={styles.sectionTitle}>Travel Preferences</Text>
          <View style={styles.card}>
            <Text style={styles.fieldLabel}>Preferred Seat Position</Text>
            <View style={styles.seatGrid}>
              {SEAT_POSITIONS.map(s => (
                <TouchableOpacity key={s.value}
                  style={[styles.seatBox, seatPref === s.value && styles.seatBoxActive]}
                  onPress={() => setSeat(s.value)} activeOpacity={0.7}>
                  <Text style={styles.seatIcon}>{s.icon}</Text>
                  <Text style={[styles.seatLabel, seatPref === s.value && styles.seatLabelActive]}>{s.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={[styles.fieldLabel, { marginTop: Spacing.md }]}>Preferred Bus Type</Text>
            <View style={styles.pillRow}>
              {(['AC', 'Non-AC'] as BusType[]).map(bt => (
                <TouchableOpacity key={bt} style={[styles.pill, busType === bt && styles.pillActive]}
                  onPress={() => setBus(bt)} activeOpacity={0.7}>
                  <Text style={[styles.pillText, busType === bt && styles.pillTextActive]}>{bt}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Notifications */}
          <Text style={styles.sectionTitle}>Notifications</Text>
          <View style={styles.card}>
            {[
              { label: 'Trip Reminders', value: notifTrips, setter: setNT },
              { label: 'Crowd Alerts',   value: notifCrowd, setter: setNC },
              { label: 'Booking Updates',value: notifBookings, setter: setNB },
            ].map(n => (
              <View key={n.label} style={styles.switchRow}>
                <Text style={styles.switchLabel}>{n.label}</Text>
                <Switch value={n.value} onValueChange={n.setter} trackColor={{ true: Colors.primary }} />
              </View>
            ))}
          </View>

          <Button label="Complete Setup" onPress={handleComplete} loading={loading} style={{ marginBottom: Spacing.md }} />
          <TouchableOpacity onPress={handleComplete} activeOpacity={0.7} style={styles.skipLink}>
            <Text style={styles.skipText}>Skip for now</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe   : { flex: 1, backgroundColor: Colors.background },
  content: { paddingHorizontal: Spacing.screenPadding, paddingBottom: Spacing.safeBottom },
  progressRow  : { flexDirection: 'row', gap: 4, marginTop: Spacing.xl, marginBottom: Spacing.xs },
  progressBar  : { height: 6, borderRadius: 3 },
  progressLabel: { ...Typography.tiny, marginBottom: Spacing.lg },
  title     : { ...Typography.h2, marginBottom: Spacing.xs },
  subtitle  : { ...Typography.body, color: Colors.textSecondary, marginBottom: Spacing.xxl },
  avatarRow : { alignItems: 'center', marginBottom: Spacing.xxl },
  avatar    : {
    width: 100, height: 100, borderRadius: 50,
    backgroundColor: Colors.primaryTint, alignItems: 'center', justifyContent: 'center',
    ...Shadows.card,
  },
  avatarEdit    : { marginTop: Spacing.sm },
  avatarEditText: { ...Typography.captionMed, color: Colors.primary },
  sectionTitle  : { ...Typography.h4, marginBottom: Spacing.sm, marginTop: Spacing.xs },
  card  : { backgroundColor: Colors.card, borderRadius: BorderRadius.xl, padding: Spacing.lg, ...Shadows.card, marginBottom: Spacing.lg },
  fieldLabel: { ...Typography.captionMed, fontWeight: '600', color: Colors.textPrimary, marginBottom: Spacing.sm },
  pillRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  pill  : { paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderRadius: BorderRadius.full, borderWidth: 1, borderColor: Colors.border },
  pillActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  pillText   : { ...Typography.caption, color: Colors.textSecondary },
  pillTextActive: { color: Colors.white, fontWeight: '600' },
  seatGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  seatBox : {
    width: '46%', paddingVertical: Spacing.md, borderRadius: BorderRadius.md,
    borderWidth: 1.5, borderColor: Colors.border, alignItems: 'center', backgroundColor: Colors.white,
  },
  seatBoxActive: { borderColor: Colors.primary, backgroundColor: Colors.primaryTint },
  seatIcon     : { fontSize: 24, marginBottom: 4 },
  seatLabel    : { ...Typography.caption, color: Colors.textSecondary },
  seatLabelActive: { color: Colors.primary, fontWeight: '600' },
  switchRow  : { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: Spacing.sm, borderBottomWidth: 1, borderBottomColor: Colors.divider },
  switchLabel: { ...Typography.body },
  skipLink   : { alignItems: 'center', marginBottom: Spacing.xxl },
  skipText   : { ...Typography.caption, color: Colors.textMuted },
});
