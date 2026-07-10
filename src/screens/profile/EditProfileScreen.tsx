import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert,
  Modal, FlatList, TextInput, Platform, ToastAndroid,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';

import { ProfileStackParamList, OccupationType } from '../../types';
import { Colors } from '../../constants/colors';
import { Spacing, BorderRadius } from '../../constants/spacing';
import { Typography } from '../../constants/typography';
import { Shadows } from '../../constants/shadows';
import { useAuth } from '../../context/AuthContext';
import ScreenHeader from '../../components/common/ScreenHeader';
import InputField from '../../components/common/InputField';
import Button from '../../components/common/Button';

type Props = NativeStackScreenProps<ProfileStackParamList, 'EditProfile'>;

// ─── Pakistan Cities ──────────────────────────────────────────────────────────
const PK_CITIES = [
  'Karachi', 'Lahore', 'Islamabad', 'Rawalpindi', 'Faisalabad',
  'Multan', 'Peshawar', 'Quetta', 'Sialkot', 'Gujranwala',
  'Hyderabad', 'Bahawalpur', 'Sargodha', 'Sukkur', 'Larkana',
  'Sheikhupura', 'Jhang', 'Rahim Yar Khan', 'Gujrat', 'Kasur',
  'Mardan', 'Mingora', 'Nawabshah', 'Sahiwal', 'Mirpur Khas',
  'Okara', 'Chiniot', 'Kamoke', 'Hafizabad', 'Sadiqabad',
  'Jacobabad', 'Khanewal', 'Kohat', 'Muzaffargarh', 'Abbottabad',
  'Turbat', 'Khairpur', 'Dera Ghazi Khan', 'Wah Cantonment', 'Mansehra',
  'Muzaffarabad', 'Mirpur (AJK)', 'Gilgit', 'Skardu',
];

// ─── Occupation Options ───────────────────────────────────────────────────────
const OCCUPATIONS: { label: string; value: OccupationType; icon: string }[] = [
  { label: 'Student',      value: 'student',      icon: '🎓' },
  { label: 'Professional', value: 'professional', icon: '💼' },
  { label: 'Worker',       value: 'worker',       icon: '🔧' },
  { label: 'Other',        value: 'other',        icon: '👤' },
];

function showToast(msg: string) {
  if (Platform.OS === 'android') ToastAndroid.show(msg, ToastAndroid.SHORT);
  else Alert.alert('', msg);
}

// ─── City Picker Modal ────────────────────────────────────────────────────────
function CityPickerModal({
  visible, selected, onSelect, onClose,
}: {
  visible: boolean;
  selected: string;
  onSelect: (city: string) => void;
  onClose: () => void;
}) {
  const [query, setQuery] = useState('');
  const filtered = PK_CITIES.filter(c => c.toLowerCase().includes(query.toLowerCase()));

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={modal.safe}>
        {/* Header */}
        <View style={modal.header}>
          <Text style={modal.title}>Select City</Text>
          <TouchableOpacity onPress={onClose} style={modal.closeBtn} activeOpacity={0.7}>
            <Ionicons name="close" size={22} color={Colors.textPrimary} />
          </TouchableOpacity>
        </View>

        {/* Search */}
        <View style={modal.searchBar}>
          <Ionicons name="search" size={18} color={Colors.textMuted} />
          <TextInput
            style={modal.searchInput}
            placeholder="Search Pakistani cities…"
            placeholderTextColor={Colors.textMuted}
            value={query}
            onChangeText={setQuery}
            autoFocus
            returnKeyType="search"
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery('')}>
              <Ionicons name="close-circle" size={18} color={Colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>

        {/* City List */}
        <FlatList
          data={filtered}
          keyExtractor={item => item}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingBottom: Spacing.xxxl }}
          renderItem={({ item }) => {
            const isSelected = item === selected;
            return (
              <TouchableOpacity
                style={[modal.cityRow, isSelected && modal.cityRowActive]}
                onPress={() => { onSelect(item); onClose(); }}
                activeOpacity={0.7}
              >
                <Ionicons name="location-outline" size={16} color={isSelected ? Colors.primary : Colors.textMuted} />
                <Text style={[modal.cityText, isSelected && modal.cityTextActive]}>{item}</Text>
                {isSelected && <Ionicons name="checkmark" size={16} color={Colors.primary} style={{ marginLeft: 'auto' }} />}
              </TouchableOpacity>
            );
          }}
          ListEmptyComponent={
            <View style={modal.emptyView}>
              <Text style={modal.emptyText}>No city found for "{query}"</Text>
            </View>
          }
        />
      </SafeAreaView>
    </Modal>
  );
}

const modal = StyleSheet.create({
  safe        : { flex: 1, backgroundColor: Colors.background },
  header      : { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.screenPadding, paddingVertical: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.divider },
  title       : { ...Typography.h4, flex: 1 },
  closeBtn    : { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.background, alignItems: 'center', justifyContent: 'center' },
  searchBar   : { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.card, borderRadius: BorderRadius.lg, margin: Spacing.md, paddingHorizontal: Spacing.md, height: 48, gap: Spacing.sm, ...Shadows.card },
  searchInput : { flex: 1, ...Typography.body, color: Colors.textPrimary },
  cityRow     : { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, paddingHorizontal: Spacing.screenPadding, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: Colors.divider },
  cityRowActive: { backgroundColor: Colors.primaryTint },
  cityText    : { ...Typography.body, color: Colors.textPrimary, flex: 1 },
  cityTextActive: { color: Colors.primary, fontWeight: '600' },
  emptyView   : { padding: Spacing.xxxl, alignItems: 'center' },
  emptyText   : { ...Typography.caption, color: Colors.textMuted },
});

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function EditProfileScreen({ navigation }: Props) {
  const { user, updateUser } = useAuth();

  const [name, setName]           = useState(user?.name || '');
  const [phone, setPhone]         = useState(user?.phone || '');
  const [city, setCity]           = useState(user?.area || '');
  const [occupation, setOccupation] = useState<OccupationType>(user?.occupation || 'student');
  const [saving, setSaving]       = useState(false);
  const [cityPickerOpen, setCityPickerOpen] = useState(false);

  // ── Include occupation + city in dirty check ──
  const hasChanges =
    name       !== (user?.name || '') ||
    phone      !== (user?.phone || '') ||
    city       !== (user?.area || '') ||
    occupation !== (user?.occupation || 'student');

  const handleBack = () => {
    if (hasChanges) {
      Alert.alert('Discard changes?', 'You have unsaved changes.', [
        { text: 'Keep Editing', style: 'cancel' },
        { text: 'Discard', style: 'destructive', onPress: () => navigation.goBack() },
      ]);
    } else {
      navigation.goBack();
    }
  };

  const handleSave = async () => {
    if (!name.trim()) return Alert.alert('Error', 'Name is required');
    setSaving(true);
    await updateUser({ name, phone, area: city, occupation });
    setSaving(false);
    navigation.goBack();
  };

  const initials = name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || 'U';

  return (
    <SafeAreaView style={styles.safe}>
      <ScreenHeader title="Edit Profile" onBack={handleBack} />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* ── Avatar ── */}
        <View style={styles.avatarSection}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarInitials}>{initials}</Text>
            </View>
            <TouchableOpacity
              style={styles.editPhotoBtn}
              activeOpacity={0.8}
              onPress={() => showToast('Photo upload coming soon 📸')}
            >
              <Ionicons name="camera" size={14} color={Colors.white} />
            </TouchableOpacity>
          </View>
          <Text style={styles.avatarHint}>Tap the camera to change photo</Text>
        </View>

        {/* ── Form ── */}
        <View style={styles.formSection}>
          <InputField label="Full Name" value={name} onChangeText={setName} placeholder="Your full name" leftIcon="person-outline" />
          <InputField label="Email Address" value={user?.email || ''} onChangeText={() => {}} editable={false} placeholder="Email" leftIcon="mail-outline" />
          <InputField label="Phone Number" value={phone} onChangeText={setPhone} placeholder="e.g. +92 300 1234567" keyboardType="phone-pad" leftIcon="call-outline" />

          {/* City Picker */}
          <View>
            <Text style={styles.fieldLabel}>City</Text>
            <TouchableOpacity
              style={styles.cityField}
              onPress={() => setCityPickerOpen(true)}
              activeOpacity={0.7}
            >
              <Ionicons name="location-outline" size={18} color={city ? Colors.primary : Colors.textMuted} />
              <Text style={[styles.cityFieldText, !city && styles.cityPlaceholder]}>
                {city || 'Select your city'}
              </Text>
              <Ionicons name="chevron-down" size={16} color={Colors.textMuted} />
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Occupation ── */}
        <Text style={styles.sectionTitle}>Occupation</Text>
        <View style={styles.pillContainer}>
          {OCCUPATIONS.map(occ => {
            const isActive = occupation === occ.value;
            return (
              <TouchableOpacity
                key={occ.value}
                style={[styles.pill, isActive && styles.pillActive]}
                onPress={() => setOccupation(occ.value)}
                activeOpacity={0.7}
              >
                <Text style={{ fontSize: 14 }}>{occ.icon}</Text>
                <Text style={[styles.pillText, isActive && styles.pillTextActive]}>{occ.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      <View style={styles.footer}>
        <Button label={saving ? 'Saving…' : 'Save Changes'} onPress={handleSave} disabled={!hasChanges || saving} style={{ width: '100%' }} />
      </View>

      {/* City Picker Modal */}
      <CityPickerModal
        visible={cityPickerOpen}
        selected={city}
        onSelect={setCity}
        onClose={() => setCityPickerOpen(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe   : { flex: 1, backgroundColor: Colors.background },
  content: { paddingHorizontal: Spacing.screenPadding, paddingBottom: 100 },

  avatarSection  : { alignItems: 'center', marginVertical: Spacing.xl },
  avatarContainer: { position: 'relative' },
  avatarCircle   : { width: 96, height: 96, borderRadius: 48, backgroundColor: Colors.primaryTint, alignItems: 'center', justifyContent: 'center' },
  avatarInitials : { fontSize: 36, fontWeight: '700', color: Colors.primary },
  editPhotoBtn   : { position: 'absolute', bottom: 0, right: 0, width: 32, height: 32, borderRadius: 16, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: Colors.background },
  avatarHint     : { ...Typography.tiny, color: Colors.textMuted, marginTop: Spacing.sm },

  formSection : { gap: Spacing.md, marginBottom: Spacing.xl },
  fieldLabel  : { ...Typography.captionMed, color: Colors.textPrimary, marginBottom: Spacing.xs, fontWeight: '500' },
  cityField   : {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    height: 52, backgroundColor: Colors.white,
    borderRadius: BorderRadius.md, borderWidth: 1, borderColor: Colors.border,
    paddingHorizontal: Spacing.lg,
  },
  cityFieldText  : { ...Typography.body, color: Colors.textPrimary, flex: 1 },
  cityPlaceholder: { color: Colors.textMuted },

  sectionTitle: { ...Typography.sectionLabel, marginBottom: Spacing.sm },
  pillContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  pill        : { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm, borderRadius: BorderRadius.full, borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.card },
  pillActive  : { backgroundColor: Colors.primary, borderColor: Colors.primary },
  pillText    : { ...Typography.caption, color: Colors.textSecondary },
  pillTextActive: { color: Colors.white, fontWeight: '600' },

  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: Colors.background, padding: Spacing.lg, borderTopWidth: 1, borderTopColor: Colors.border, paddingBottom: Spacing.safeBottom },
});
