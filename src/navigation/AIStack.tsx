import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AIStackParamList } from '../types';

import TravelInsightsScreen   from '../screens/ai/TravelInsightsScreen';

const Stack = createNativeStackNavigator<AIStackParamList>();

export default function AIStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="TravelInsights"   component={TravelInsightsScreen} />
    </Stack.Navigator>
  );
}
