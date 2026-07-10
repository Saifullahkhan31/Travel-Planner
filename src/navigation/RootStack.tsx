import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';

import MainTabNavigator from './MainTabNavigator';

// Deep Screens
import SeatSelectionScreen     from '../screens/booking/SeatSelectionScreen';
import BookingSummaryScreen    from '../screens/booking/BookingSummaryScreen';
import QRPaymentScreen         from '../screens/booking/QRPaymentScreen';
import PaymentProcessingScreen from '../screens/booking/PaymentProcessingScreen';
import BookingConfirmedScreen  from '../screens/booking/BookingConfirmedScreen';
import DigitalTicketScreen     from '../screens/booking/DigitalTicketScreen';

import CrowdPredictionScreen   from '../screens/ai/CrowdPredictionScreen';
import ComfortScoreScreen      from '../screens/ai/ComfortScoreScreen';
import AITripSuggestionScreen  from '../screens/ai/AITripSuggestionScreen';

import RecommendedBusesScreen  from '../screens/main/RecommendedBusesScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MainTabs"          component={MainTabNavigator} />
      
      {/* Booking Flow */}
      <Stack.Screen name="SeatSelection"     component={SeatSelectionScreen} />
      <Stack.Screen name="BookingSummary"    component={BookingSummaryScreen} />
      <Stack.Screen name="QRPayment"         component={QRPaymentScreen} />
      <Stack.Screen name="PaymentProcessing" component={PaymentProcessingScreen} />
      <Stack.Screen name="BookingConfirmed"  component={BookingConfirmedScreen} />
      <Stack.Screen name="DigitalTicket"     component={DigitalTicketScreen} />

      {/* AI Flow */}
      <Stack.Screen name="CrowdPrediction"   component={CrowdPredictionScreen} />
      <Stack.Screen name="ComfortScore"      component={ComfortScoreScreen} />
      <Stack.Screen name="AITripSuggestion"  component={AITripSuggestionScreen} />

      {/* Browsing */}
      <Stack.Screen name="RecommendedBuses"  component={RecommendedBusesScreen} />
    </Stack.Navigator>
  );
}
