import React from 'react';
import { View, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

import HomeStack    from './HomeStack';
import TicketsStack from './TicketsStack';
import ProfileStack from './ProfileStack';
import MapStack     from './MapStack';
import AIStack      from './AIStack';
import { Colors } from '../constants/colors';
import { Typography } from '../constants/typography';

const Tab = createBottomTabNavigator();



export default function MainTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown  : false,
        tabBarStyle  : styles.tabBar,
        tabBarActiveTintColor  : Colors.primary,
        tabBarInactiveTintColor: Colors.textSecondary,
        tabBarLabelStyle: styles.tabLabel,
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap = 'home';
          if (route.name === 'HomeTab')    iconName = focused ? 'home'        : 'home-outline';
          if (route.name === 'MapTab')     iconName = focused ? 'map'         : 'map-outline';
          if (route.name === 'TicketsTab') iconName = focused ? 'ticket'      : 'ticket-outline';
          if (route.name === 'AITab')      iconName = focused ? 'sparkles'    : 'sparkles-outline';
          if (route.name === 'ProfileTab') iconName = focused ? 'person'      : 'person-outline';
          return (
            <View style={styles.iconWrapper}>
              <Ionicons name={iconName} size={22} color={color} />
              {focused && <View style={styles.activeDot} />}
            </View>
          );
        },
      })}
    >
      <Tab.Screen name="HomeTab"    component={HomeStack}    options={{ tabBarLabel: 'Home' }} />
      <Tab.Screen name="MapTab"     component={MapStack}     options={{ tabBarLabel: 'Map' }} />
      <Tab.Screen 
        name="TicketsTab" 
        component={TicketsStack} 
        options={{ tabBarLabel: 'Tickets' }} 
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            e.preventDefault();
            navigation.navigate('TicketsTab', { screen: 'MyBookings' });
          },
        })}
      />
      <Tab.Screen name="AITab"      component={AIStack}        options={{ tabBarLabel: 'Insights' }} />
      <Tab.Screen name="ProfileTab" component={ProfileStack}  options={{ tabBarLabel: 'Profile' }} />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    height         : 83,
    backgroundColor: Colors.white,
    borderTopWidth : 1,
    borderTopColor : Colors.border,
    paddingTop     : 8,
    paddingBottom  : 28,
  },
  tabLabel: {
    ...Typography.navLabel,
    marginTop: 2,
  },
  iconWrapper: {
    alignItems: 'center',
  },
  activeDot: {
    width        : 4,
    height       : 4,
    borderRadius : 2,
    backgroundColor: Colors.primary,
    marginTop    : 3,
  },
});
