import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { HomeStackParamList } from '../types';

import HomeScreen          from '../screens/main/HomeScreen';
import SearchScreen        from '../screens/main/SearchScreen';
import RouteResultsScreen  from '../screens/main/RouteResultsScreen';
import BusDetailScreen     from '../screens/main/BusDetailScreen';
import NotificationsScreen from '../screens/main/NotificationsScreen';

const Stack = createNativeStackNavigator<HomeStackParamList>();

export default function HomeStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Home"          component={HomeScreen} />
      <Stack.Screen name="Search"        component={SearchScreen} />
      <Stack.Screen name="RouteResults"  component={RouteResultsScreen} />
      <Stack.Screen name="BusDetail"     component={BusDetailScreen} />
      <Stack.Screen name="Notifications" component={NotificationsScreen} />
    </Stack.Navigator>
  );
}
