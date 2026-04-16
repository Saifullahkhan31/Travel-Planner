import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';

import { ProfileStackParamList } from '../../types';
import { Colors } from '../../constants/colors';
import { Spacing, BorderRadius } from '../../constants/spacing';
import { Typography } from '../../constants/typography';
import { useAuth } from '../../context/AuthContext';
import ScreenHeader from '../../components/common/ScreenHeader';
import Button from '../../components/common/Button';
import { Shadows } from '../../constants/shadows';

type Props = NativeStackScreenProps<ProfileStackParamList, 'Preferences'>;

const MOCK_ROUTES = ['U1', 'U2', 'Speedo 14']; // For route mock chips

export default function PreferencesScreen({ navigation }: Props) {
  const { user, updateUser } = useAuth();

  const [seatPref, setSeatPref] = useState(user?.seatPreference || 'window');
  const [busType, setBusType] = useState(user?.busTypePreference || 'AC');
  const [frequentRoutes, setFrequentRoutes] = useState<string[]>(user?.frequentRoutes || []);

  const [toggles, setToggles] = useState({
    reminders: true,
    alerts: true,
    updates: true,
  });

  const handleSave = async () => {
    await updateUser({ seatPreference: seatPref as any, busTypePreference: busType as any, frequentRoutes });
    navigation.goBack();
  };

  const toggleRoute = (route: string) => {
    setFrequentRoutes(prev => prev.includes(route) ? prev.filter(r => r !== route) : [...prev, route]);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScreenHeader title="Travel Preferences" onBack={() => navigation.goBack()} />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        
        {/* Seat Preference */}
        <Text style={styles.sectionTitle}>Seat Preference</Text>
        <View style={styles.seatGrid}>
          {(['window', 'aisle'] as const).map(type => (
            <TouchableOpacity
              key={type}
              style={[styles.prefCard, seatPref === type && styles.prefCardActive]}
              onPress={() => setSeatPref(type)}
              activeOpacity={0.7}
            >
              <Text style={[styles.prefText, seatPref === type && styles.prefTextActive]}>
                {type.charAt(0).toUpperCase() + type.slice(1)} Seat
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Bus Type */}
        <Text style={styles.sectionTitle}>Preferred Bus Type</Text>
        <View style={styles.seatGrid}>
          {(['AC', 'Non-AC'] as const).map(type => (
            <TouchableOpacity
              key={type}
              style={[styles.prefCard, busType === type && styles.prefCardActive]}
              onPress={() => setBusType(type)}
              activeOpacity={0.7}
            >
              <Text style={[styles.prefText, busType === type && styles.prefTextActive]}>{type}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Frequent Routes */}
        <Text style={styles.sectionTitle}>Frequent Routes</Text>
        <Text style={styles.sectionSub}>Select routes you use often for better AI suggestions</Text>
        <View style={styles.pillContainer}>
          {MOCK_ROUTES.map(route => {
            const isActive = frequentRoutes.includes(route);
            return (
              <TouchableOpacity
                key={route}
                style={[styles.pill, isActive && styles.pillActive]}
                onPress={() => toggleRoute(route)}
                activeOpacity={0.7}
              >
                <Text style={[styles.pillText, isActive && styles.pillTextActive]}>{route}</Text>
                {isActive && <Ionicons name="close" size={14} color={Colors.white} style={{ marginLeft: 4 }} />}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Notifications */}
        <Text style={styles.sectionTitle}>Notifications</Text>
        <View style={styles.toggleCard}>
          <View style={styles.toggleRow}>
            <View>
              <Text style={styles.toggleTitle}>Trip Reminders</Text>
              <Text style={styles.toggleSub}>Get notified before departure</Text>
            </View>
            <Switch
              value={toggles.reminders}
              onValueChange={v => setToggles({...toggles, reminders: v})}
              trackColor={{ false: Colors.border, true: Colors.success }}
            />
          </View>
          <View style={styles.divider} />
          <View style={styles.toggleRow}>
            <View>
              <Text style={styles.toggleTitle}>Crowd Alerts</Text>
              <Text style={styles.toggleSub}>Notify if usual bus gets crowded</Text>
            </View>
            <Switch
              value={toggles.alerts}
              onValueChange={v => setToggles({...toggles, alerts: v})}
              trackColor={{ false: Colors.border, true: Colors.success }}
            />
          </View>
          <View style={styles.divider} />
          <View style={styles.toggleRow}>
            <View>
              <Text style={styles.toggleTitle}>Booking Updates</Text>
              <Text style={styles.toggleSub}>Ticket confirmations and changes</Text>
            </View>
            <Switch
              value={toggles.updates}
              onValueChange={v => setToggles({...toggles, updates: v})}
              trackColor={{ false: Colors.border, true: Colors.success }}
            />
          </View>
        </View>

        <View style={{ height: Spacing.xxxl }} />
      </ScrollView>

      <View style={styles.footer}>
        <Button label="Save Preferences" onPress={handleSave} style={{ width: '100%' }} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  content: { paddingHorizontal: Spacing.screenPadding, paddingBottom: 100, paddingTop: Spacing.md },

  sectionTitle: { ...Typography.h4, marginTop: Spacing.md, marginBottom: Spacing.xs },
  sectionSub: { ...Typography.tiny, color: Colors.textSecondary, marginBottom: Spacing.md },
  
  seatGrid: { flexDirection: 'row', gap: Spacing.md, marginBottom: Spacing.xl },
  prefCard: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.border, borderRadius: BorderRadius.md, height: 50, ...Shadows.card },
  prefCardActive: { backgroundColor: Colors.primaryTint, borderColor: Colors.primary },
  prefText: { ...Typography.bodyMedium, color: Colors.textPrimary },
  prefTextActive: { color: Colors.primary, fontWeight: '600' },

  pillContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginBottom: Spacing.xl },
  pill: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm, borderRadius: BorderRadius.full, borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.card },
  pillActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  pillText: { ...Typography.caption, color: Colors.textSecondary },
  pillTextActive: { color: Colors.white, fontWeight: '600' },

  toggleCard: { backgroundColor: Colors.card, borderRadius: BorderRadius.lg, ...Shadows.card, marginBottom: Spacing.xl },
  toggleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: Spacing.lg },
  toggleTitle: { ...Typography.bodyMedium, color: Colors.textPrimary },
  toggleSub: { ...Typography.caption, color: Colors.textSecondary, marginTop: 2 },
  divider: { height: 1, backgroundColor: Colors.divider, marginHorizontal: Spacing.lg },

  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: Colors.background, padding: Spacing.lg, borderTopWidth: 1, borderTopColor: Colors.border, paddingBottom: Spacing.safeBottom },
});
