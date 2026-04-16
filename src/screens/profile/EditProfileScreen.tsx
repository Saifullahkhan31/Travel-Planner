import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';

import { ProfileStackParamList } from '../../types';
import { Colors } from '../../constants/colors';
import { Spacing, BorderRadius } from '../../constants/spacing';
import { Typography } from '../../constants/typography';
import { useAuth } from '../../context/AuthContext';
import ScreenHeader from '../../components/common/ScreenHeader';
import InputField from '../../components/common/InputField';
import Button from '../../components/common/Button';

type Props = NativeStackScreenProps<ProfileStackParamList, 'EditProfile'>;

const OCCUPATIONS = ['Student', 'Professional', 'Freelancer', 'Other'];

export default function EditProfileScreen({ navigation }: Props) {
  const { user, updateUser } = useAuth();

  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [area, setArea] = useState(user?.area || '');
  const [occupation, setOccupation] = useState(user?.role || 'user'); // Fallback placeholder

  const hasChanges = name !== user?.name || phone !== user?.phone || area !== user?.area;

  const handleBack = () => {
    if (hasChanges) {
      Alert.alert('Discard changes?', 'You have unsaved changes. Are you sure you want to discard them?', [
        { text: 'Keep Editing', style: 'cancel' },
        { text: 'Discard', style: 'destructive', onPress: () => navigation.goBack() },
      ]);
    } else {
      navigation.goBack();
    }
  };

  const handleSave = async () => {
    if (!name.trim()) return Alert.alert('Error', 'Name is required');
    await updateUser({ name, phone, area });
    navigation.goBack();
  };

  const initials = name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || 'U';

  return (
    <SafeAreaView style={styles.safe}>
      <ScreenHeader title="Edit Profile" onBack={handleBack} />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        
        {/* Avatar Section */}
        <View style={styles.avatarSection}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarInitials}>{initials}</Text>
            </View>
            <TouchableOpacity style={styles.editPhotoBtn} activeOpacity={0.8}>
              <Ionicons name="camera" size={14} color={Colors.white} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Form Fields */}
        <View style={styles.formSection}>
          <InputField label="Full Name" value={name} onChangeText={setName} placeholder="Your name" />
          <InputField label="Email Address" value={user?.email || ''} onChangeText={() => {}} editable={false} placeholder="Email" />
          <InputField label="Phone Number" value={phone} onChangeText={setPhone} placeholder="e.g. +92 300 1234567" keyboardType="phone-pad" />
          <InputField label="Area / City" value={area} onChangeText={setArea} placeholder="e.g. DHA, Lahore" />
        </View>

        {/* Occupation Pills */}
        <Text style={styles.sectionTitle}>Occupation</Text>
        <View style={styles.pillContainer}>
          {OCCUPATIONS.map(occ => {
            const isActive = occupation.toLowerCase() === occ.toLowerCase();
            return (
              <TouchableOpacity
                key={occ}
                style={[styles.pill, isActive && styles.pillActive]}
                onPress={() => setOccupation(occ)}
                activeOpacity={0.7}
              >
                <Text style={[styles.pillText, isActive && styles.pillTextActive]}>{occ}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={{ height: Spacing.xxxl }} />
      </ScrollView>

      <View style={styles.footer}>
        <Button label="Save Changes" onPress={handleSave} disabled={!hasChanges} style={{ width: '100%' }} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  content: { paddingHorizontal: Spacing.screenPadding, paddingBottom: 100 },

  avatarSection: { alignItems: 'center', marginVertical: Spacing.xl },
  avatarContainer: { position: 'relative' },
  avatarCircle: { width: 96, height: 96, borderRadius: 48, backgroundColor: Colors.primaryTint, alignItems: 'center', justifyContent: 'center' },
  avatarInitials: { fontSize: 36, fontWeight: '700', color: Colors.primary },
  editPhotoBtn: { position: 'absolute', bottom: 0, right: 0, width: 32, height: 32, borderRadius: 16, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: Colors.background },

  formSection: { gap: Spacing.md, marginBottom: Spacing.xl },
  sectionTitle: { ...Typography.sectionLabel, marginBottom: Spacing.sm },
  
  pillContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  pill: { paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm, borderRadius: BorderRadius.full, borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.card },
  pillActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  pillText: { ...Typography.caption, color: Colors.textSecondary },
  pillTextActive: { color: Colors.white, fontWeight: '600' },

  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: Colors.background, padding: Spacing.lg, borderTopWidth: 1, borderTopColor: Colors.border, paddingBottom: Spacing.safeBottom },
});
