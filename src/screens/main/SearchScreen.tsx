import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Platform, KeyboardAvoidingView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { HomeStackParamList } from '../../types';
import { Colors } from '../../constants/colors';
import { Spacing, BorderRadius } from '../../constants/spacing';
import { Typography } from '../../constants/typography';
import { Shadows } from '../../constants/shadows';
import { busService } from '../../services/busService';
import InputField from '../../components/common/InputField';
import Button from '../../components/common/Button';
import ScreenHeader from '../../components/common/ScreenHeader';

type Props = { navigation: NativeStackNavigationProp<HomeStackParamList, 'Search'> };

export default function SearchScreen({ navigation }: Props) {
  const [from,    setFrom]    = useState('');
  const [to,      setTo]      = useState('');
  const [date,    setDate]    = useState(new Date().toDateString());
  const [popular, setPopular] = useState<{ from: string; to: string; label: string }[]>([]);
  const [availableCities, setAvailableCities] = useState<string[]>([]);

  // Load popular routes from Supabase on mount
  useEffect(() => {
    (async () => {
      const { data } = await busService.getAllRoutes();
      if (data && data.length > 0) {
        setPopular(
          data.slice(0, 5).map(r => ({
            from : r.origin,
            to   : r.destination,
            label: r.routeName,
          }))
        );

        const cities = new Set<string>();
        data.forEach(r => {
          cities.add(r.origin);
          cities.add(r.destination);
        });
        setAvailableCities(Array.from(cities));
      }
    })();
  }, []);

  const handleSwap = () => {
    const t = from;
    setFrom(to);
    setTo(t);
  };

  const handleSearch = () => {
    if (!from.trim() || !to.trim()) return;
    navigation.navigate('RouteResults', { origin: from, destination: to, date });
  };

  const handlePopular = (f: string, t: string) => {
    setFrom(f);
    setTo(t);
    navigation.navigate('RouteResults', { origin: f, destination: t, date });
  };

  const today = new Date();
  const dates = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    return {
      label: i === 0 ? 'Today' : i === 1 ? 'Tomorrow'
        : d.toLocaleDateString('en-PK', { weekday: 'short', day: 'numeric' }),
      value: d.toDateString(),
    };
  });

  const getSuggestions = (text: string) => {
    if (text.length < 1) return [];
    const lower = text.toLowerCase();
    const matches = availableCities.filter(c => c.toLowerCase().includes(lower) && c.toLowerCase() !== lower);
    return matches.slice(0, 3);
  };

  const fromMatches = getSuggestions(from);
  const toMatches = getSuggestions(to);

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <ScreenHeader title="Search Routes" onBack={() => navigation.goBack()} />

          {/* From / To Card */}
          <View style={styles.searchCard}>
            <InputField
              label="From"
              value={from}
              onChangeText={setFrom}
              placeholder="Departure city or area"
              leftIcon="radio-button-on-outline"
              autoCapitalize="words"
            />
            {fromMatches.length > 0 && (
              <View style={styles.suggestionBox}>
                {fromMatches.map(city => (
                  <TouchableOpacity key={city} style={styles.suggestionItem} onPress={() => setFrom(city)}>
                    <Ionicons name="location-outline" size={14} color={Colors.textMuted} />
                    <Text style={styles.suggestionText}>{city}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            <TouchableOpacity style={styles.swapBtn} onPress={handleSwap} activeOpacity={0.7}>
              <Ionicons name="swap-vertical" size={20} color={Colors.primary} />
            </TouchableOpacity>

            <InputField
              label="To"
              value={to}
              onChangeText={setTo}
              placeholder="Destination city or area"
              leftIcon="location-outline"
              autoCapitalize="words"
            />
            {toMatches.length > 0 && (
              <View style={styles.suggestionBox}>
                {toMatches.map(city => (
                  <TouchableOpacity key={city} style={styles.suggestionItem} onPress={() => setTo(city)}>
                    <Ionicons name="location-outline" size={14} color={Colors.textMuted} />
                    <Text style={styles.suggestionText}>{city}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* Date Selector */}
            <Text style={styles.dateLabel}>Travel Date</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.dateScroll}>
              {dates.map(d => (
                <TouchableOpacity
                  key={d.value}
                  style={[styles.dateChip, date === d.value && styles.dateChipActive]}
                  onPress={() => setDate(d.value)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.dateChipText, date === d.value && styles.dateChipTextActive]}>
                    {d.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Button
              label="Search Buses"
              onPress={handleSearch}
              iconLeft="search-outline"
              style={{ marginTop: Spacing.md }}
              disabled={!from.trim() || !to.trim()}
            />
          </View>

          {/* Popular Routes (live from DB) */}
          {popular.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>Popular Routes</Text>
              {popular.map((r, i) => (
                <TouchableOpacity
                  key={i}
                  style={styles.popularItem}
                  onPress={() => handlePopular(r.from, r.to)}
                  activeOpacity={0.7}
                >
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
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe      : { flex: 1, backgroundColor: Colors.background },
  content   : { paddingBottom: Spacing.safeBottom },
  searchCard: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    margin: Spacing.screenPadding,
    ...Shadows.card,
    position: 'relative',
  },
  swapBtn: {
    position: 'absolute', right: Spacing.lg, top: 96,
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: Colors.primaryTint,
    alignItems: 'center', justifyContent: 'center',
    zIndex: 10, ...Shadows.card,
  },
  dateLabel        : { ...Typography.captionMed, fontWeight: '600', marginBottom: Spacing.sm },
  dateScroll       : { marginBottom: Spacing.xs },
  dateChip         : {
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full, borderWidth: 1,
    borderColor: Colors.border, marginRight: Spacing.sm,
    backgroundColor: Colors.white,
  },
  dateChipActive   : { backgroundColor: Colors.primary, borderColor: Colors.primary },
  dateChipText     : { ...Typography.caption, color: Colors.textSecondary },
  dateChipTextActive: { color: Colors.white, fontWeight: '600' },
  sectionTitle  : { ...Typography.h4, marginHorizontal: Spacing.screenPadding, marginBottom: Spacing.sm },
  popularItem: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    backgroundColor: Colors.card, marginHorizontal: Spacing.screenPadding,
    borderRadius: BorderRadius.lg, padding: Spacing.md,
    marginBottom: Spacing.sm, ...Shadows.card,
  },
  popularIcon : {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: Colors.primaryTint,
    alignItems: 'center', justifyContent: 'center',
  },
  popularLabel: { ...Typography.bodyMedium },
  popularSub  : { ...Typography.caption },
  suggestionBox: {
    backgroundColor: Colors.white,
    borderColor: Colors.border, borderWidth: 1,
    borderRadius: BorderRadius.md,
    marginTop: -Spacing.sm, marginBottom: Spacing.md,
    paddingVertical: Spacing.xs,
    ...Shadows.card,
  },
  suggestionItem: {
    padding: Spacing.md,
    flexDirection: 'row', alignItems: 'center', gap: 6,
    borderBottomWidth: 1, borderBottomColor: Colors.divider,
  },
  suggestionText: {
    ...Typography.captionMed, color: Colors.textSecondary,
  },
});
