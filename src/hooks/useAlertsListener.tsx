import { useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import * as Notifications from 'expo-notifications';

export function useAlertsListener() {
  const { user } = useAuth();

  useEffect(() => {
    if (!user || user.role !== 'commuter') return;

    const channel = supabase
      .channel('public:driver_alerts')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'driver_alerts' },
        async (payload) => {
          const alert = payload.new;
          
          // Verify if the commuter has an active booking on this bus
          const { data: bookings } = await supabase
            .from('bookings')
            .select('id')
            .eq('user_id', user.id)
            .eq('bus_id', alert.bus_id)
            .eq('booking_status', 'confirmed');
            
          if (bookings && bookings.length > 0) {
            // Commuter is on this route, show local push notification
            await Notifications.scheduleNotificationAsync({
              content: {
                title: alert.alert_type === 'dispatch' ? '⚠️ Emergency Update' : '🚌 Route Delay Alert',
                body: alert.alert_type === 'dispatch' 
                  ? `Dispatch called for your bus. Reason: ${alert.reason}`
                  : `Your bus is delayed due to ${alert.reason}. Expected delay: ${alert.duration}.`,
                sound: true,
              },
              trigger: null, // trigger immediately
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);
}
