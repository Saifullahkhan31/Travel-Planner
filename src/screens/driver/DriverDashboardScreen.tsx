import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { busService } from '../../services/busService';
import { Bus, Route } from '../../types';
import { Colors } from '../../constants/colors';
import { Spacing, BorderRadius } from '../../constants/spacing';
import { Typography } from '../../constants/typography';
import { Shadows } from '../../constants/shadows';
import Button from '../../components/common/Button';
import { driverService } from '../../services/driverService';
import ReportDelayModal from '../../components/modals/ReportDelayModal';
import DispatchModal from '../../components/modals/DispatchModal';

export default function DriverDashboardScreen() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [bus, setBus] = useState<Bus | null>(null);
  const [route, setRoute] = useState<Route | null>(null);
  const [currentStopIndex, setCurrentStopIndex] = useState(0);
  const [delayModalVisible, setDelayModalVisible] = useState(false);
  const [dispatchModalVisible, setDispatchModalVisible] = useState(false);

  useEffect(() => {
    async function loadDriverData() {
      if (!user) return;
      
      const { data: busData } = await busService.getBusByDriverId(user.id);
      if (busData) {
        setBus(busData);
        const { data: routeData } = await busService.getRouteById(busData.routeId);
        if (routeData) {
          setRoute(routeData);
        }
      }
      setLoading(false);
    }
    loadDriverData();
  }, [user]);

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (!bus || !route) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="bus-outline" size={64} color={Colors.textSecondary} />
          <Text style={styles.errorTitle}>No Bus Assigned</Text>
          <Text style={styles.errorText}>You currently do not have a bus assigned to you. Please contact your dispatch administrator.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const handleNextStop = () => {
    if (currentStopIndex < route.stops.length - 1) {
      setCurrentStopIndex(prev => prev + 1);
    } else {
      Alert.alert('Route Complete', 'You have reached the final destination of this route.');
    }
  };

  const handleReportDelay = async (reason: string, duration: string) => {
    if (!bus || !route || !user) return;
    
    const { error } = await driverService.submitAlert({
      busId: bus.id,
      routeId: route.id,
      driverId: user.id,
      alertType: 'delay',
      reason,
      duration
    });

    if (error) {
      Alert.alert('Error', error);
    } else {
      Alert.alert('Delay Reported', 'System and commuters have been notified of the delay.');
      setDelayModalVisible(false);
    }
  };

  const handleDispatch = async (reason: string, details: string) => {
    if (!bus || !route || !user) return;
    
    const { error } = await driverService.submitAlert({
      busId: bus.id,
      routeId: route.id,
      driverId: user.id,
      alertType: 'dispatch',
      reason,
      details
    });

    if (error) {
      Alert.alert('Error', error);
    } else {
      Alert.alert('SOS Sent', 'Dispatch administration has been notified and will contact you shortly.');
      setDispatchModalVisible(false);
    }
  };

  const currentStop = route.stops[currentStopIndex];
  const nextStop = route.stops[currentStopIndex + 1];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        
        {/* Header section */}
        <View style={styles.header}>
          <Text style={styles.greeting}>Hello, {user?.name.split(' ')[0]}</Text>
          <Text style={styles.title}>Driver Dashboard</Text>
        </View>

        {/* Assigned Bus Card */}
        <View style={styles.busCard}>
          <View style={styles.busHeader}>
            <View style={styles.busIconContainer}>
              <Ionicons name="bus" size={24} color={Colors.white} />
            </View>
            <View style={styles.busInfo}>
              <Text style={styles.plateNumber}>{bus.plateNumber}</Text>
              <Text style={styles.busType}>{bus.busType} Class</Text>
            </View>
            <View style={styles.statusBadge}>
              <Text style={styles.statusText}>ON DUTY</Text>
            </View>
          </View>
          
          <View style={styles.routeContainer}>
            <Text style={styles.routeLabel}>CURRENT ROUTE</Text>
            <Text style={styles.routeName}>{route.routeName}</Text>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Occupancy</Text>
              <Text style={styles.statValue}>{bus.currentOccupancy} / {bus.totalSeats}</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Total Stops</Text>
              <Text style={styles.statValue}>{route.stops.length}</Text>
            </View>
          </View>
        </View>

        {/* Trip Progress */}
        <Text style={styles.sectionTitle}>Trip Progress</Text>
        <View style={styles.progressCard}>
          <View style={styles.stopRow}>
            <View style={styles.iconCol}>
              <View style={[styles.dot, { backgroundColor: Colors.success }]} />
              <View style={styles.line} />
            </View>
            <View style={styles.stopInfo}>
              <Text style={styles.stopLabel}>Current Location</Text>
              <Text style={styles.stopName}>{currentStop?.name || 'Unknown'}</Text>
            </View>
          </View>

          <View style={styles.stopRow}>
            <View style={styles.iconCol}>
              <View style={[styles.dot, { backgroundColor: Colors.primary }]} />
            </View>
            <View style={styles.stopInfo}>
              <Text style={styles.stopLabel}>Next Stop</Text>
              <Text style={styles.stopName}>{nextStop?.name || 'End of Route'}</Text>
            </View>
          </View>

          {nextStop && (
            <Button 
              label="Arrive at Next Stop" 
              onPress={handleNextStop} 
              style={styles.arriveBtn} 
            />
          )}
        </View>

        {/* Quick Actions */}
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionsGrid}>
          <TouchableOpacity 
            style={styles.actionItem} 
            activeOpacity={0.7}
            onPress={() => setDelayModalVisible(true)}
          >
            <View style={[styles.actionIcon, { backgroundColor: Colors.errorTint }]}>
              <Ionicons name="warning-outline" size={24} color={Colors.error} />
            </View>
            <Text style={styles.actionText}>Report Delay</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.actionItem} 
            activeOpacity={0.7}
            onPress={() => setDispatchModalVisible(true)}
          >
            <View style={[styles.actionIcon, { backgroundColor: Colors.primaryTint }]}>
              <Ionicons name="chatbubbles-outline" size={24} color={Colors.primary} />
            </View>
            <Text style={styles.actionText}>Dispatch</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>

      <ReportDelayModal 
        visible={delayModalVisible} 
        onClose={() => setDelayModalVisible(false)} 
        onSubmit={handleReportDelay} 
      />

      <DispatchModal 
        visible={dispatchModalVisible} 
        onClose={() => setDispatchModalVisible(false)} 
        onSubmit={handleDispatch} 
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    padding: Spacing.screenPadding,
    paddingBottom: Spacing.xxxl,
  },
  header: {
    marginBottom: Spacing.lg,
  },
  greeting: {
    ...Typography.body,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  title: {
    ...Typography.h2,
  },
  busCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    ...Shadows.card,
    marginBottom: Spacing.xl,
  },
  busHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  busIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  busInfo: {
    flex: 1,
  },
  plateNumber: {
    ...Typography.h3,
    marginBottom: 2,
  },
  busType: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  statusBadge: {
    backgroundColor: Colors.successTint,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
  },
  statusText: {
    ...Typography.caption,
    color: Colors.success,
    fontWeight: '700',
  },
  routeContainer: {
    backgroundColor: Colors.background,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.lg,
  },
  routeLabel: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  routeName: {
    ...Typography.body,
    fontWeight: '600',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    backgroundColor: Colors.border,
  },
  statLabel: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  statValue: {
    ...Typography.h3,
    color: Colors.primary,
  },
  sectionTitle: {
    ...Typography.h3,
    marginBottom: Spacing.md,
  },
  progressCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    ...Shadows.card,
    marginBottom: Spacing.xl,
  },
  stopRow: {
    flexDirection: 'row',
    marginBottom: Spacing.md,
  },
  iconCol: {
    width: 24,
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  dot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 3,
    borderColor: Colors.white,
    elevation: 2,
    zIndex: 2,
  },
  line: {
    width: 2,
    flex: 1,
    backgroundColor: Colors.border,
    marginTop: -8,
    marginBottom: -16,
    zIndex: 1,
  },
  stopInfo: {
    flex: 1,
    justifyContent: 'center',
    paddingBottom: Spacing.md,
  },
  stopLabel: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  stopName: {
    ...Typography.body,
    fontWeight: '600',
  },
  arriveBtn: {
    marginTop: Spacing.md,
  },
  actionsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionItem: {
    flex: 1,
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    alignItems: 'center',
    ...Shadows.card,
    marginHorizontal: Spacing.xs,
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  actionText: {
    ...Typography.caption,
    fontWeight: '600',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xxl,
  },
  errorTitle: {
    ...Typography.h2,
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
  },
  errorText: {
    ...Typography.body,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
});
