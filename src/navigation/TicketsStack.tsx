import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { TicketsStackParamList } from '../types';

import MyBookingsScreen        from '../screens/booking/MyBookingsScreen';
import ActiveTicketScreen      from '../screens/history/ActiveTicketScreen';
import DigitalTicketScreen     from '../screens/booking/DigitalTicketScreen';
import TravelHistoryScreen     from '../screens/history/TravelHistoryScreen';
import TripDetailScreen        from '../screens/history/TripDetailScreen';

const Stack = createNativeStackNavigator<TicketsStackParamList>();

export default function TicketsStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MyBookings"          component={MyBookingsScreen} />
      <Stack.Screen name="ActiveTicket"        component={ActiveTicketScreen} />
      <Stack.Screen name="DigitalTicket"       component={DigitalTicketScreen} />
      <Stack.Screen name="TravelHistory"       component={TravelHistoryScreen} />
      <Stack.Screen name="TripDetail"          component={TripDetailScreen} />
    </Stack.Navigator>
  );
}
