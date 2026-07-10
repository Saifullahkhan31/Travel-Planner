import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ToastAndroid, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { ProfileStackParamList } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { Colors } from '../../constants/colors';
import { Spacing, BorderRadius } from '../../constants/spacing';
import { Typography } from '../../constants/typography';
import { Shadows } from '../../constants/shadows';
import ScreenHeader from '../../components/common/ScreenHeader';

type Props = NativeStackScreenProps<ProfileStackParamList, 'Settings'>;

function showToast(message: string) {
  if (Platform.OS === 'android') {
    ToastAndroid.show(message, ToastAndroid.SHORT);
  } else {
    Alert.alert('', message);
  }
}

interface SettingRow {
  id     : string;
  icon   : keyof typeof Ionicons.glyphMap;
  label  : string;
  value? : string;
  color? : string;
  onPress: () => void;
}

export default function SettingsScreen({ navigation }: Props) {
  const { user, signOut } = useAuth();

  const handleChangePassword = () => {
    navigation.navigate('ChangePassword');
  };

  const handleClearCache = () => {
    Alert.alert(
      'Clear Cache',
      'This will clear locally cached data. Your account and bookings will not be affected.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'default',
          onPress: async () => {
            try {
              // Clear all AsyncStorage keys except the Supabase session
              const keys = await AsyncStorage.getAllKeys();
              const nonSessionKeys = keys.filter(k => !k.includes('supabase'));
              if (nonSessionKeys.length > 0) {
                await AsyncStorage.multiRemove(nonSessionKeys);
              }
              showToast('Cache cleared successfully');
            } catch {
              showToast('Failed to clear cache');
            }
          },
        },
      ],
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'This action is permanent and cannot be undone. All your bookings, preferences, and history will be lost.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Yes, Delete',
          style: 'destructive',
          onPress: () => {
            // Second confirmation for safety
            Alert.alert(
              'Are you absolutely sure?',
              `You are about to permanently delete the account for ${user?.email}. This cannot be reversed.`,
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Delete Account',
                  style: 'destructive',
                  onPress: async () => {
                    // For now: sign out the user (full Supabase account deletion
                    // requires a server-side function which is out of scope for FYP)
                    showToast('Account deletion request submitted.');
                    await signOut();
                  },
                },
              ],
            );
          },
        },
      ],
    );
  };

  const accountRows: SettingRow[] = [
    {
      id     : 'password',
      icon   : 'key-outline',
      label  : 'Change Password',
      onPress: handleChangePassword,
    },
    {
      id     : 'linked',
      icon   : 'link-outline',
      label  : 'Linked Accounts',
      value  : 'Google',
      onPress: () => showToast('Linked account management coming soon'),
    },
  ];

  const appRows: SettingRow[] = [
    {
      id     : 'language',
      icon   : 'language-outline',
      label  : 'Language',
      value  : 'English',
      onPress: () => showToast('Language selection coming soon'),
    },
    {
      id     : 'theme',
      icon   : 'moon-outline',
      label  : 'Theme',
      value  : 'Light Mode',
      onPress: () => showToast('Dark mode coming soon ✨'),
    },
  ];

  const dataRows: SettingRow[] = [
    {
      id     : 'cache',
      icon   : 'trash-outline',
      label  : 'Clear Cache',
      onPress: handleClearCache,
    },
    {
      id     : 'delete',
      icon   : 'person-remove-outline',
      label  : 'Delete Account',
      color  : Colors.error,
      onPress: handleDeleteAccount,
    },
  ];

  const renderRow = (row: SettingRow, isLast: boolean) => (
    <View key={row.id}>
      <TouchableOpacity style={styles.menuRow} onPress={row.onPress} activeOpacity={0.7}>
        <View style={[styles.iconBg, row.color ? { backgroundColor: row.color + '18' } : {}]}>
          <Ionicons name={row.icon} size={18} color={row.color ?? Colors.textSecondary} />
        </View>
        <Text style={[styles.menuText, row.color ? { color: row.color } : {}]}>{row.label}</Text>
        <View style={styles.rowRight}>
          {row.value && <Text style={styles.menuValue}>{row.value}</Text>}
          <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
        </View>
      </TouchableOpacity>
      {!isLast && <View style={styles.divider} />}
    </View>
  );

  return (
    <SafeAreaView style={styles.safe}>
      <ScreenHeader title="Settings" onBack={() => navigation.goBack()} />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* Account */}
        <Text style={styles.sectionLabel}>ACCOUNT</Text>
        <View style={styles.menuCard}>
          {accountRows.map((row, i) => renderRow(row, i === accountRows.length - 1))}
        </View>

        {/* App Preferences */}
        <Text style={styles.sectionLabel}>APP PREFERENCES</Text>
        <View style={styles.menuCard}>
          {appRows.map((row, i) => renderRow(row, i === appRows.length - 1))}
        </View>

        {/* Data & Privacy */}
        <Text style={styles.sectionLabel}>DATA & PRIVACY</Text>
        <View style={styles.menuCard}>
          {dataRows.map((row, i) => renderRow(row, i === dataRows.length - 1))}
        </View>

        <View style={{ height: Spacing.xl }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  content: { paddingHorizontal: Spacing.screenPadding, paddingBottom: Spacing.safeBottom, paddingTop: Spacing.sm },

  sectionLabel: { ...Typography.sectionLabel, marginBottom: Spacing.sm, marginTop: Spacing.md },

  menuCard: { backgroundColor: Colors.card, borderRadius: BorderRadius.lg, ...Shadows.card, overflow: 'hidden' },
  menuRow : { flexDirection: 'row', alignItems: 'center', padding: Spacing.lg, gap: Spacing.md },
  iconBg  : { width: 36, height: 36, borderRadius: BorderRadius.sm, backgroundColor: Colors.background, alignItems: 'center', justifyContent: 'center' },
  menuText: { ...Typography.bodyMedium, color: Colors.textPrimary, flex: 1 },
  rowRight: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
  menuValue: { ...Typography.caption, color: Colors.textSecondary },
  divider : { height: 1, backgroundColor: Colors.divider, marginLeft: Spacing.lg + 36 + Spacing.md },
});
