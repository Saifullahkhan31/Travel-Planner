import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Platform, KeyboardAvoidingView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { HomeStackParamList } from '../../types';
import { Colors } from '../../constants/colors';
import { Spacing, BorderRadius } from '../../constants/spacing';
import { Typography } from '../../constants/typography';
import { Shadows } from '../../constants/shadows';
import { MOCK_ROUTES } from '../../services/mockData';
import InputField from '../../components/common/InputField';
import Button from '../../components/common/Button';
import ScreenHeader from '../../components/common/ScreenHeader';

type Props = { navigation: NativeStackNavigationProp<HomeStackParamList, 'Search'> };

const POPULAR = MOCK_ROUTES.map(r => ({ from: r.origin, to: r.destination, label: r.routeName }));

export default function SearchScreen({ navigation }: Props) {
  const [from,  setFrom]  = useState('');
  const [to,    setTo]    = useState('');
  const [date,  setDate]  = useState(new Date().toDateString());
  const [recent, setRecent] = useState<{from:string;to:string}[]>([]);

  const handleSwap = () => { const t = from; setFrom(to); setTo(t); };

  const handleSearch = () => {
    if (!from.trim() || !to.trim()) return;
    navigation.navigate('RouteResults', { origin: from, destination: to, date });
  };

  const handlePopular = (f: string, t: string) => {
    setFrom(f); setTo(t);
    navigation.navigate('RouteResults', { origin: f, destination: t, date });
  };

  const today  = new Date();
  const dates  = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today); d.setDate(today.getDate() + i);
    return { label: i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : d.toLocaleDateString('en-PK', { weekday: 'short', day: 'numeric' }), value: d.toDateString() };
  });

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          <ScreenHeader title="Search Routes" onBack={() => navigation.goBack()} />

          {/* From / To */}
          <View style={styles.searchCard}>
            <InputField label="From" value={from} onChangeText={setFrom}
              placeholder="Departure stop or area" leftIcon="radio-button-on-outline"
              autoCapitalize="words" />

            <TouchableOpacity style={styles.swapBtn} onPress={handleSwap} activeOpacity={0.7}>
              <Ionicons name="swap-vertical" size={20} color={Colors.primary} />
            </TouchableOpacity>

            <InputField label="To" value={to} onChangeText={setTo}
              placeholder="Destination stop or area" leftIcon="location-outline"
              autoCapitalize="words" />

            {/* Date select */}
            <Text style={styles.dateLabel}>Travel Date</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.dateScroll}>
              {dates.map(d => (
                <TouchableOpacity key={d.value}
                  style={[styles.dateChip, date === d.value && styles.dateChipActive]}
                  onPress={() => setDate(d.value)} activeOpacity={0.7}
                >
                  <Text style={[styles.dateChipText, date === d.value && styles.dateChipTextActive]}>{d.label}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Button label="Search Buses" onPress={handleSearch}
              iconLeft="search-outline" style={{ marginTop: Spacing.md }}
              disabled={!from.trim() || !to.trim()} />
          </View>

          {/* Popular Routes */}
          <Text style={styles.sectionTitle}>Popular Routes</Text>
          {POPULAR.map((r, i) => (
            <TouchableOpacity key={i} style={styles.popularItem}
              onPress={() => handlePopular(r.from, r.to)} activeOpacity={0.7}>
              <View style={styles.popularIcon}>
                <Ionicons name="trending-up-outline" size={18} color={Colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.popularLabel}>{r.label}</Text>
                <Text style={styles.popularSub}>{r.from} → {r.to}</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
            </TouchableOpacity>
          ))}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe   : { flex: 1, backgroundColor: Colors.background },
  content: { paddingBottom: Spacing.safeBottom },
  searchCard: { backgroundColor: Colors.card, borderRadius: BorderRadius.xl, padding: Spacing.lg, margin: Spacing.screenPadding, ...Shadows.card, position: 'relative' },
  swapBtn: {
    position: 'absolute', right: Spacing.lg, top: 96,
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: Colors.primaryTint, alignItems: 'center', justifyContent: 'center',
    zIndex: 10, ...Shadows.card,
  },
  dateLabel    : { ...Typography.captionMed, fontWeight: '600', marginBottom: Spacing.sm },
  dateScroll   : { marginBottom: Spacing.xs },
  dateChip     : { paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderRadius: BorderRadius.full, borderWidth: 1, borderColor: Colors.border, marginRight: Spacing.sm, backgroundColor: Colors.white },
  dateChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  dateChipText  : { ...Typography.caption, color: Colors.textSecondary },
  dateChipTextActive: { color: Colors.white, fontWeight: '600' },
  sectionTitle  : { ...Typography.h4, marginHorizontal: Spacing.screenPadding, marginBottom: Spacing.sm },
  popularItem   : {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    backgroundColor: Colors.card, marginHorizontal: Spacing.screenPadding,
    borderRadius: BorderRadius.lg, padding: Spacing.md,
    marginBottom: Spacing.sm, ...Shadows.card,
  },
  popularIcon : { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.primaryTint, alignItems: 'center', justifyContent: 'center' },
  popularLabel: { ...Typography.bodyMedium },
  popularSub  : { ...Typography.caption },
});
