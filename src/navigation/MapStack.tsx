import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { MapStackParamList } from '../types';
import MapScreen                  from '../screens/map/MapScreen';
import LiveTrackingScreen         from '../screens/map/LiveTrackingScreen';
import RouteVisualizationScreen   from '../screens/map/RouteVisualizationScreen';

const Stack = createNativeStackNavigator<MapStackParamList>();

export default function MapStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Map"                component={MapScreen} />
      <Stack.Screen name="LiveTracking"       component={LiveTrackingScreen} />
      <Stack.Screen name="RouteVisualization" component={RouteVisualizationScreen} />
    </Stack.Navigator>
  );
}
