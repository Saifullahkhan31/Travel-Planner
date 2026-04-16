import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import { useAuth } from '../../context/AuthContext';
import { ProfileStackParamList } from '../../types';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { Spacing, BorderRadius } from '../../constants/spacing';
import { Shadows } from '../../constants/shadows';

// ─── Types ────────────────────────────────────────────────────────────────────
interface MenuRow {
  id       : string;
  icon     : keyof typeof Ionicons.glyphMap;
  label    : string;
  color?   : string;
  onPress  : () => void;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function AvatarPlaceholder({ name }: { name: string }) {
  const initials = name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <View style={styles.avatarCircle}>
      <Text style={styles.avatarInitials}>{initials}</Text>
    </View>
  );
}

function MenuRowItem({ item }: { item: MenuRow }) {
  return (
    <TouchableOpacity
      activeOpacity={0.75}
      style={styles.menuRow}
      onPress={item.onPress}
    >
      <View style={[styles.menuIconBg, item.color ? { backgroundColor: item.color + '18' } : {}]}>
        <Ionicons
          name={item.icon}
          size={18}
          color={item.color ?? Colors.textSecondary}
        />
      </View>
      <Text style={[styles.menuLabel, item.color ? { color: item.color } : {}]}>
        {item.label}
      </Text>
      <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} style={{ marginLeft: 'auto' }} />
    </TouchableOpacity>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
type Props = NativeStackScreenProps<ProfileStackParamList, 'Profile'>;

export default function ProfileScreen({ navigation }: Props) {
  const { user, signOut } = useAuth();
  const [signingOut, setSigningOut] = useState(false);

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            setSigningOut(true);
            try {
              await signOut();
            } finally {
              setSigningOut(false);
            }
          },
        },
      ],
    );
  };

  const accountRows: MenuRow[] = [
    {
      id      : 'edit_profile',
      icon    : 'person-outline',
      label   : 'Edit Profile',
      onPress : () => navigation.navigate('EditProfile'),
    },
    {
      id      : 'preferences',
      icon    : 'options-outline',
      label   : 'Travel Preferences',
      onPress : () => navigation.navigate('Preferences'),
    },
    {
      id      : 'notifications',
      icon    : 'notifications-outline',
      label   : 'Notifications / Settings',
      onPress : () => navigation.navigate('Settings'),
    },
  ];

  const supportRows: MenuRow[] = [
    {
      id      : 'help',
      icon    : 'help-circle-outline',
      label   : 'Help & Support',
      onPress : () => navigation.navigate('HelpSupport'),
    },
    {
      id      : 'privacy',
      icon    : 'shield-checkmark-outline',
      label   : 'Privacy Policy',
      onPress : () => navigation.navigate('PrivacyPolicy'),
    },
  ];

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profile</Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Identity Card ── */}
        <View style={styles.identityCard}>
          <AvatarPlaceholder name={user?.name ?? 'User'} />
          <View style={styles.identityInfo}>
            <Text style={styles.userName}>{user?.name ?? '—'}</Text>
            <Text style={styles.userEmail}>{user?.email ?? '—'}</Text>
            {user?.role && (
              <View style={styles.roleBadge}>
                <Text style={styles.roleBadgeText}>
                  {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* ── Stats Row ── */}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{user?.frequentRoutes?.length ?? 0}</Text>
            <Text style={styles.statLabel}>Saved Routes</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{user?.area ?? '—'}</Text>
            <Text style={styles.statLabel}>Area</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{user?.busTypePreference ?? '—'}</Text>
            <Text style={styles.statLabel}>Preferred Bus</Text>
          </View>
        </View>

        {/* ── Account Section ── */}
        <Text style={styles.sectionLabel}>ACCOUNT</Text>
        <View style={styles.menuCard}>
          {accountRows.map((row, idx) => (
            <View key={row.id}>
              <MenuRowItem item={row} />
              {idx < accountRows.length - 1 && <View style={styles.rowDivider} />}
            </View>
          ))}
        </View>

        {/* ── Support Section ── */}
        <Text style={styles.sectionLabel}>SUPPORT</Text>
        <View style={styles.menuCard}>
          {supportRows.map((row, idx) => (
            <View key={row.id}>
              <MenuRowItem item={row} />
              {idx < supportRows.length - 1 && <View style={styles.rowDivider} />}
            </View>
          ))}
        </View>

        {/* ── Sign Out Button ── */}
        <TouchableOpacity
          activeOpacity={0.8}
          style={styles.signOutButton}
          onPress={handleSignOut}
          disabled={signingOut}
        >
          {signingOut ? (
            <ActivityIndicator size="small" color={Colors.error} />
          ) : (
            <>
              <Ionicons name="log-out-outline" size={20} color={Colors.error} />
              <Text style={styles.signOutLabel}>Sign Out</Text>
            </>
          )}
        </TouchableOpacity>

        {/* ── Version ── */}
        <Text style={styles.versionText}>Smart AI Bus Planner · v1.0.0</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: {
    flex           : 1,
    backgroundColor: Colors.background,
  },
  header: {
    paddingHorizontal: Spacing.screenPadding,
    paddingVertical  : Spacing.lg,
    backgroundColor  : Colors.background,
  },
  headerTitle: {
    ...Typography.h2,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: Spacing.screenPadding,
    paddingBottom    : Spacing.xxxl + Spacing.safeBottom,
  },

  // Identity Card
  identityCard: {
    backgroundColor: Colors.card,
    borderRadius   : BorderRadius.lg,
    padding        : Spacing.cardPadding,
    flexDirection  : 'row',
    alignItems     : 'center',
    gap            : Spacing.lg,
    marginBottom   : Spacing.md,
    ...Shadows.card,
  },
  avatarCircle: {
    width          : 64,
    height         : 64,
    borderRadius   : 32,
    backgroundColor: Colors.primary,
    alignItems     : 'center',
    justifyContent : 'center',
  },
  avatarInitials: {
    fontSize  : 24,
    fontWeight: '700',
    color     : Colors.white,
  },
  identityInfo: {
    flex: 1,
    gap : Spacing.xs,
  },
  userName: {
    ...Typography.h3,
  },
  userEmail: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  roleBadge: {
    alignSelf      : 'flex-start',
    backgroundColor: Colors.primaryTint,
    borderRadius   : BorderRadius.full,
    paddingHorizontal: 10,
    paddingVertical  : 3,
  },
  roleBadgeText: {
    fontSize  : 11,
    fontWeight: '600',
    color     : Colors.primary,
  },

  // Stats
  statsRow: {
    backgroundColor: Colors.card,
    borderRadius   : BorderRadius.lg,
    flexDirection  : 'row',
    alignItems     : 'center',
    paddingVertical: Spacing.lg,
    marginBottom   : Spacing.sectionGap,
    ...Shadows.card,
  },
  statItem: {
    flex     : 1,
    alignItems: 'center',
    gap      : 2,
  },
  statValue: {
    ...Typography.h4,
    fontSize: 15,
  },
  statLabel: {
    ...Typography.tiny,
    textAlign: 'center',
  },
  statDivider: {
    width          : 1,
    height         : 32,
    backgroundColor: Colors.divider,
  },

  // Section label
  sectionLabel: {
    ...Typography.sectionLabel,
    marginBottom: Spacing.sm,
    marginTop   : Spacing.xs,
  },

  // Menu card
  menuCard: {
    backgroundColor: Colors.card,
    borderRadius   : BorderRadius.lg,
    marginBottom   : Spacing.sectionGap,
    overflow       : 'hidden',
    ...Shadows.card,
  },
  menuRow: {
    flexDirection: 'row',
    alignItems   : 'center',
    padding      : Spacing.cardPadding,
    gap          : Spacing.md,
  },
  menuIconBg: {
    width          : 36,
    height         : 36,
    borderRadius   : BorderRadius.sm,
    backgroundColor: Colors.background,
    alignItems     : 'center',
    justifyContent : 'center',
  },
  menuLabel: {
    ...Typography.bodyMedium,
    color: Colors.textPrimary,
  },
  rowDivider: {
    height         : 1,
    backgroundColor: Colors.divider,
    marginLeft     : Spacing.cardPadding + 36 + Spacing.md,
  },

  // Sign Out
  signOutButton: {
    flexDirection  : 'row',
    alignItems     : 'center',
    justifyContent : 'center',
    gap            : Spacing.sm,
    backgroundColor: Colors.card,
    borderRadius   : BorderRadius.lg,
    height         : 52,
    borderWidth    : 1,
    borderColor    : Colors.error + '40',
    marginBottom   : Spacing.lg,
    ...Shadows.card,
  },
  signOutLabel: {
    ...Typography.bodyMedium,
    color     : Colors.error,
    fontWeight: '600',
    fontSize  : 15,
  },

  // Version
  versionText: {
    ...Typography.tiny,
    textAlign: 'center',
    color    : Colors.textMuted,
  },
});
