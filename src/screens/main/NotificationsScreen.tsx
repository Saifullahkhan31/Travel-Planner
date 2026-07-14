import React, { useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { HomeStackParamList, Notification, NotificationType } from '../../types';
import { Colors } from '../../constants/colors';
import { Spacing, BorderRadius } from '../../constants/spacing';
import { Typography } from '../../constants/typography';
import { Shadows } from '../../constants/shadows';
import ScreenHeader from '../../components/common/ScreenHeader';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { useFocusEffect } from '@react-navigation/native';

type Props = { navigation: NativeStackNavigationProp<HomeStackParamList, 'Notifications'> };

function getIcon(type: NotificationType): { name: string; color: string; bg: string } {
  switch (type) {
    case 'booking_confirmed': return { name: 'checkmark-circle', color: Colors.success,  bg: Colors.successTint };
    case 'booking_cancelled': return { name: 'close-circle',     color: Colors.error,    bg: Colors.errorTint };
    case 'payment_success'  : return { name: 'card',             color: Colors.success,  bg: Colors.successTint };
    case 'payment_failed'   : return { name: 'card',             color: Colors.error,    bg: Colors.errorTint };
    case 'crowd_alert'      : return { name: 'alert-circle',     color: Colors.warning,  bg: Colors.warningTint };
    case 'trip_reminder'    : return { name: 'time',             color: Colors.primary,  bg: Colors.primaryTint };
    default                 : return { name: 'notifications',    color: Colors.primary,  bg: Colors.primaryTint };
  }
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function NotificationsScreen({ navigation }: Props) {
  const { user } = useAuth();
  const [notifs, setNotifs] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const fetchNotifications = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    
    if (data) {
      setNotifs(data.map(n => ({
        id: n.id,
        title: n.title,
        message: n.message,
        type: n.type as NotificationType,
        isRead: n.is_read,
        createdAt: n.created_at
      })));
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchNotifications();
    setRefreshing(false);
  };

  useFocusEffect(
    React.useCallback(() => {
      fetchNotifications();
    }, [user])
  );

  const markAll = async () => {
    if (!user) return;
    
    const updated = notifs.map(n => ({ ...n, isRead: true }));
    setNotifs(updated);
    
    await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', user.id)
      .eq('is_read', false);
  };

  const today     = notifs.filter(n => new Date(n.createdAt) > new Date(Date.now() - 86400000));
  const earlier   = notifs.filter(n => new Date(n.createdAt) <= new Date(Date.now() - 86400000));

  const renderSection = (title: string, items: Notification[]) =>
    items.length > 0 ? (
      <View>
        <Text style={styles.sectionHeader}>{title}</Text>
        {items.map(n => {
          const icon = getIcon(n.type);
          return (
            <View key={n.id} style={[styles.notifItem, !n.isRead && styles.unread]}>
              <View style={[styles.iconCircle, { backgroundColor: icon.bg }]}>
                <Ionicons name={icon.name as any} size={20} color={icon.color} />
              </View>
              <View style={styles.notifContent}>
                <View style={styles.notifTitleRow}>
                  <Text style={styles.notifTitle}>{n.title}</Text>
                  {!n.isRead && <View style={styles.unreadDot} />}
                </View>
                <Text style={styles.notifMessage}>{n.message}</Text>
                <Text style={styles.notifTime}>{timeAgo(n.createdAt)}</Text>
              </View>
            </View>
          );
        })}
      </View>
    ) : null;

  return (
    <SafeAreaView style={styles.safe}>
      <ScreenHeader
        title="Notifications"
        onBack={() => navigation.goBack()}
        rightComponent={
          <TouchableOpacity onPress={markAll} activeOpacity={0.7}>
            <Text style={styles.markAll}>Mark all read</Text>
          </TouchableOpacity>
        }
      />

      <FlatList
        data={[]}
        renderItem={() => null}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />
        }
        ListHeaderComponent={
          <View style={styles.content}>
            {notifs.length === 0 ? (
              <View style={styles.empty}>
                <Text style={{ fontSize: 48 }}>🔔</Text>
                <Text style={styles.emptyTitle}>No notifications yet</Text>
                <Text style={styles.emptySubtitle}>We'll notify you about trips, bookings & AI alerts.</Text>
              </View>
            ) : (
              <>
                {renderSection('Today', today)}
                {renderSection('Earlier', earlier)}
              </>
            )}
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe          : { flex: 1, backgroundColor: Colors.background },
  content       : { paddingHorizontal: Spacing.screenPadding, paddingBottom: Spacing.safeBottom },
  markAll       : { ...Typography.captionMed, color: Colors.primary },
  sectionHeader : { ...Typography.sectionLabel, paddingVertical: Spacing.sm },
  notifItem     : {
    flexDirection  : 'row', gap: Spacing.md,
    backgroundColor: Colors.card, borderRadius: BorderRadius.lg,
    padding        : Spacing.md, marginBottom: Spacing.sm, ...Shadows.card,
  },
  unread        : { borderLeftWidth: 3, borderLeftColor: Colors.primary },
  iconCircle    : { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  notifContent  : { flex: 1 },
  notifTitleRow : { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  notifTitle    : { ...Typography.bodyMedium },
  unreadDot     : { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.primary },
  notifMessage  : { ...Typography.caption, lineHeight: 18, marginBottom: 4 },
  notifTime     : { ...Typography.tiny },
  empty         : { alignItems: 'center', paddingTop: 80, gap: Spacing.md },
  emptyTitle    : { ...Typography.h3 },
  emptySubtitle : { ...Typography.body, color: Colors.textSecondary, textAlign: 'center' },
});
