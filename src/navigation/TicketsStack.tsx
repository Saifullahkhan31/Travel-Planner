import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { TicketsStackParamList } from '../types';

import MyBookingsScreen        from '../screens/booking/MyBookingsScreen';
import SeatSelectionScreen     from '../screens/booking/SeatSelectionScreen';
import BookingSummaryScreen    from '../screens/booking/BookingSummaryScreen';
import QRPaymentScreen         from '../screens/booking/QRPaymentScreen';
import PaymentProcessingScreen from '../screens/booking/PaymentProcessingScreen';
import BookingConfirmedScreen  from '../screens/booking/BookingConfirmedScreen';
import DigitalTicketScreen     from '../screens/booking/DigitalTicketScreen';
import ActiveTicketScreen      from '../screens/history/ActiveTicketScreen';
import TravelHistoryScreen     from '../screens/history/TravelHistoryScreen';
import TripDetailScreen        from '../screens/history/TripDetailScreen';

const Stack = createNativeStackNavigator<TicketsStackParamList>();

export default function TicketsStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MyBookings"          component={MyBookingsScreen} />
      <Stack.Screen name="SeatSelection"       component={SeatSelectionScreen} />
      <Stack.Screen name="BookingSummary"      component={BookingSummaryScreen} />
      <Stack.Screen name="QRPayment"           component={QRPaymentScreen} />
      <Stack.Screen name="PaymentProcessing"   component={PaymentProcessingScreen} />
      <Stack.Screen name="BookingConfirmed"    component={BookingConfirmedScreen} />
      <Stack.Screen name="DigitalTicket"       component={DigitalTicketScreen} />
      <Stack.Screen name="ActiveTicket"        component={ActiveTicketScreen} />
      <Stack.Screen name="TravelHistory"       component={TravelHistoryScreen} />
      <Stack.Screen name="TripDetail"          component={TripDetailScreen} />
    </Stack.Navigator>
  );
}
