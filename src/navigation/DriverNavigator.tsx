import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { View, StyleSheet, Platform } from 'react-native';

import { Colors } from '../constants/colors';
import { Shadows } from '../constants/shadows';

// Import Driver Screens (to be created)
import DriverDashboardScreen from '../screens/driver/DriverDashboardScreen';
import DriverScannerScreen from '../screens/driver/DriverScannerScreen';
import ProfileStack from './ProfileStack';

export type DriverTabParamList = {
  DriverDashboard: undefined;
  DriverScanner: undefined;
  DriverProfile: undefined;
};

const Tab = createBottomTabNavigator<DriverTabParamList>();

export default function DriverNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textSecondary,
        tabBarStyle: styles.tabBar,
        tabBarShowLabel: true,
        tabBarLabelStyle: styles.tabLabel,
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap;

          if (route.name === 'DriverDashboard') {
            iconName = focused ? 'bus' : 'bus-outline';
          } else if (route.name === 'DriverScanner') {
            iconName = focused ? 'qr-code' : 'qr-code-outline';
          } else if (route.name === 'DriverProfile') {
            iconName = focused ? 'person' : 'person-outline';
          } else {
            iconName = 'help-circle';
          }

          return (
            <View style={focused ? styles.iconContainerActive : styles.iconContainer}>
              <Ionicons name={iconName} size={size} color={color} />
            </View>
          );
        },
      })}
    >
      <Tab.Screen 
        name="DriverDashboard" 
        component={DriverDashboardScreen} 
        options={{ title: 'My Route' }} 
      />
      <Tab.Screen 
        name="DriverScanner" 
        component={DriverScannerScreen} 
        options={{ title: 'Scanner' }} 
      />
      <Tab.Screen 
        name="DriverProfile" 
        component={ProfileStack} 
        options={{ title: 'Profile' }} 
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: Colors.white,
    borderTopWidth: 0,
    height: Platform.OS === 'ios' ? 88 : 65,
    paddingBottom: Platform.OS === 'ios' ? 28 : 10,
    paddingTop: 10,
    ...Shadows.card,
  },
  tabLabel: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 4,
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  iconContainerActive: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primary + '15',
  },
});
