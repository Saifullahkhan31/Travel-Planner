import { supabase } from '../lib/supabase';
import { Booking } from '../types';

export const driverService = {
  /**
   * Verifies a booking by ID and updates its status to 'boarded'.
   * Returns passenger details for UI display.
   */
  async verifyAndBoardPassenger(bookingId: string) {
    try {
      // 1. Fetch booking (without join to avoid schema relationship errors)
      const { data: booking, error: fetchError } = await supabase
        .from('bookings')
        .select('*')
        .eq('id', bookingId)
        .single();

      if (fetchError || !booking) {
        return { data: null, error: 'Booking not found in database.' };
      }

      // 2. Check current status
      if (booking.booking_status === 'boarded') {
        // Still try to get the passenger name for a nicer error
        let pName = 'Unknown Passenger';
        const { data: profile } = await supabase.from('profiles').select('full_name').eq('id', booking.user_id).single();
        if (profile?.full_name) pName = profile.full_name;
        
        return { 
          data: { passengerName: pName, seatNumber: booking.seat_number }, 
          error: 'Passenger is already marked as boarded.' 
        };
      }

      if (booking.booking_status === 'cancelled') {
        return { data: null, error: 'This ticket was cancelled.' };
      }

      if (booking.booking_status !== 'confirmed') {
        return { data: null, error: `Invalid ticket status: ${booking.booking_status}` };
      }

      // 3. Update status to 'boarded'
      const { error: updateError } = await supabase
        .from('bookings')
        .update({ booking_status: 'boarded' })
        .eq('id', bookingId);

      if (updateError) {
        return { data: null, error: 'Failed to update boarding status.' };
      }

      // 4. Fetch passenger profile
      let passengerName = 'Unknown Passenger';
      if (booking.user_id) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', booking.user_id)
          .single();
        if (profile?.full_name) passengerName = profile.full_name;
      }

      // 5. Return success data
      return { 
        data: { 
          passengerName, 
          seatNumber: booking.seat_number,
          busId: booking.bus_id
        }, 
        error: null 
      };

    } catch (err: any) {
      return { data: null, error: err.message || 'An unexpected error occurred.' };
    }
  },

  /**
   * Submits a report/alert from the driver to the backend.
   */
  async submitAlert(params: {
    busId: string;
    routeId: string;
    driverId: string;
    alertType: 'delay' | 'dispatch';
    reason: string;
    duration?: string;
    details?: string;
  }) {
    try {
      const { data, error } = await supabase
        .from('driver_alerts')
        .insert([{
          bus_id: params.busId,
          route_id: params.routeId,
          driver_id: params.driverId,
          alert_type: params.alertType,
          reason: params.reason,
          duration: params.duration,
          details: params.details,
          status: 'active'
        }])
        .select()
        .single();

      if (error) throw error;

      // 2. Fetch all users who have an active booking on this bus
      const { data: bookings } = await supabase
        .from('bookings')
        .select('user_id')
        .eq('bus_id', params.busId)
        .eq('booking_status', 'confirmed');

      // 3. Batch insert notifications for those users
      if (bookings && bookings.length > 0) {
        // Extract unique user_ids
        const uniqueUserIds = Array.from(new Set(bookings.map(b => b.user_id)));
        
        const title = params.alertType === 'dispatch' ? '⚠️ Emergency Update' : '🚌 Route Delay Alert';
        const message = params.alertType === 'dispatch' 
          ? `Dispatch called for your bus. Reason: ${params.reason}`
          : `Your bus is delayed due to ${params.reason}. Expected delay: ${params.duration}.`;

        const notifications = uniqueUserIds.map(userId => ({
          user_id: userId,
          title,
          message,
          type: 'route_alert',
          is_read: false
        }));

        await supabase.from('notifications').insert(notifications);
      }

      return { data, error: null };
    } catch (err: any) {
      return { data: null, error: err.message || 'Failed to submit alert.' };
    }
  }
};
