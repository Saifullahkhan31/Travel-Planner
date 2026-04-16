import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AIStackParamList } from '../types';

import TravelInsightsScreen from '../screens/ai/TravelInsightsScreen';
import CrowdPredictionScreen from '../screens/ai/CrowdPredictionScreen';
import ComfortScoreScreen from '../screens/ai/ComfortScoreScreen';
import AITripSuggestionScreen from '../screens/ai/AITripSuggestionScreen';

const Stack = createNativeStackNavigator<AIStackParamList>();

export default function AIStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="TravelInsights" component={TravelInsightsScreen} />
      <Stack.Screen name="CrowdPrediction" component={CrowdPredictionScreen} />
      <Stack.Screen name="ComfortScore" component={ComfortScoreScreen} />
      <Stack.Screen name="AITripSuggestion" component={AITripSuggestionScreen} />
    </Stack.Navigator>
  );
}
