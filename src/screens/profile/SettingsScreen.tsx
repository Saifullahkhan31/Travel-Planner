import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';

import { ProfileStackParamList } from '../../types';
import { Colors } from '../../constants/colors';
import { Spacing, BorderRadius } from '../../constants/spacing';
import { Typography } from '../../constants/typography';
import { Shadows } from '../../constants/shadows';
import ScreenHeader from '../../components/common/ScreenHeader';

type Props = NativeStackScreenProps<ProfileStackParamList, 'Settings'>;

export default function SettingsScreen({ navigation }: Props) {
  const handleClearCache = () => {
    Alert.alert('Clear Cache', 'Are you sure you want to clear app cache? This will not delete your data.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Clear', style: 'default' },
    ]);
  };

  const handleDeleteAccount = () => {
    Alert.alert('Delete Account', 'This action is irreversible. All your data will be permanently lost.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive' },
    ]);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScreenHeader title="Settings" onBack={() => navigation.goBack()} />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        
        {/* Account Section */}
        <Text style={styles.sectionLabel}>ACCOUNT</Text>
        <View style={styles.menuCard}>
          <TouchableOpacity style={styles.menuRow} activeOpacity={0.7}>
            <Text style={styles.menuText}>Change Password</Text>
            <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
          </TouchableOpacity>
          <View style={styles.divider} />
          <TouchableOpacity style={styles.menuRow} activeOpacity={0.7}>
            <Text style={styles.menuText}>Linked Accounts</Text>
            <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
          </TouchableOpacity>
        </View>

        {/* App Section */}
        <Text style={styles.sectionLabel}>APP PREFERENCES</Text>
        <View style={styles.menuCard}>
          <View style={styles.menuRow}>
            <Text style={styles.menuText}>Language</Text>
            <Text style={styles.menuValue}>English</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.menuRow}>
            <Text style={styles.menuText}>Theme</Text>
            <Text style={styles.menuValue}>Light Mode</Text>
          </View>
        </View>

        {/* Data Section */}
        <Text style={styles.sectionLabel}>DATA & PRIVACY</Text>
        <View style={styles.menuCard}>
          <TouchableOpacity style={styles.menuRow} activeOpacity={0.7} onPress={handleClearCache}>
            <Text style={styles.menuText}>Clear Cache</Text>
          </TouchableOpacity>
          <View style={styles.divider} />
          <TouchableOpacity style={styles.menuRow} activeOpacity={0.7} onPress={handleDeleteAccount}>
            <Text style={[styles.menuText, { color: Colors.error }]}>Delete Account</Text>
          </TouchableOpacity>
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
  
  menuCard: { backgroundColor: Colors.card, borderRadius: BorderRadius.lg, ...Shadows.card, marginBottom: Spacing.sm },
  menuRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: Spacing.lg },
  menuText: { ...Typography.bodyMedium, color: Colors.textPrimary },
  menuValue: { ...Typography.caption, color: Colors.textSecondary },
  divider: { height: 1, backgroundColor: Colors.divider, marginLeft: Spacing.lg },
});
