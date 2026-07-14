import React from 'react';
import {
  View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView,
  Dimensions, Pressable
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { Spacing, BorderRadius } from '../../constants/spacing';
import { Typography } from '../../constants/typography';
import { Shadows } from '../../constants/shadows';
import { Route } from '../../types';

interface SavedRoutesModalProps {
  visible: boolean;
  onClose: () => void;
  savedRoutes: Route[];
  onSelectRoute: (route: Route) => void;
}

export default function SavedRoutesModal({ visible, onClose, savedRoutes, onSelectRoute }: SavedRoutesModalProps) {
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <View style={styles.container}>
          <Pressable style={styles.content} onPress={(e) => e.stopPropagation()}>
            <View style={styles.header}>
              <View style={styles.headerTitleRow}>
                <Ionicons name="heart" size={20} color={Colors.error} />
                <Text style={styles.title}>Saved Routes</Text>
              </View>
              <TouchableOpacity onPress={onClose} hitSlop={{top:10, bottom:10, left:10, right:10}}>
                <Ionicons name="close" size={24} color={Colors.textPrimary} />
              </TouchableOpacity>
            </View>

            {savedRoutes.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>You haven't saved any routes yet.</Text>
              </View>
            ) : (
              <ScrollView showsVerticalScrollIndicator={false} style={styles.list}>
                <View style={styles.grid}>
                  {savedRoutes.map(route => (
                    <TouchableOpacity 
                      key={route.id} 
                      style={styles.routeItem}
                      activeOpacity={0.7}
                      onPress={() => {
                        onClose();
                        onSelectRoute(route);
                      }}
                    >
                      <View style={styles.routeHeader}>
                        <Ionicons name="bus-outline" size={16} color={Colors.primary} />
                        <Text style={styles.routeName} numberOfLines={1}>
                          {route.routeName}
                        </Text>
                      </View>
                      <Text style={styles.routeSub}>
                        {route.origin} → {route.destination}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            )}
          </Pressable>
        </View>
      </Pressable>
    </Modal>
  );
}

const { height } = Dimensions.get('window');

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: Colors.background,
    borderTopLeftRadius: BorderRadius.xxl,
    borderTopRightRadius: BorderRadius.xxl,
    height: height * 0.5,
  },
  content: {
    padding: Spacing.xl,
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  title: {
    ...Typography.h3,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    ...Typography.body,
    color: Colors.textMuted,
  },
  list: {
    flex: 1,
  },
  grid: {
    gap: Spacing.md,
  },
  routeItem: {
    backgroundColor: Colors.card,
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    ...Shadows.card,
  },
  routeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: 4,
  },
  routeName: {
    ...Typography.bodyMedium,
    color: Colors.textPrimary,
    fontWeight: '700',
    flex: 1,
  },
  routeSub: {
    ...Typography.tiny,
    color: Colors.textSecondary,
    marginLeft: 24, // Align under text
  },
});
