import { supabase } from '../lib/supabase';
import { Booking, BookingStatus } from '../types';

// ─── Standalone helper — avoids 'this' context issues in object literal ──────
function generateQRCode(bookingId: string): string {
  return JSON.stringify({ bookingId, timestamp: Date.now(), verified: true });
}

export const bookingService = {
  async createBooking(
    userId: string, busId: string, seatId: string,
    routeId: string, travelDate: string, fare: number,
    routeName: string, busType: 'AC' | 'Non-AC' | 'Premium', seatNumber: number
  ): Promise<{ data: Booking | null; error: string | null }> {
    try {
      // ── Step 1: Find a valid trip for this bus + route ────────────────────────
      let tripId: string | null = null;

      const { data: existingTrips } = await supabase
        .from('trips')
        .select('id')
        .eq('bus_id', busId)
        .eq('route_id', routeId)
        .eq('status', 'scheduled')
        .limit(1);

      if (existingTrips && existingTrips.length > 0) {
        tripId = existingTrips[0].id;
      } else {
        // No scheduled trip — create one on-the-fly
        const departure = new Date();
        departure.setHours(departure.getHours() + 1);
        const { data: newTrip, error: tripErr } = await supabase
          .from('trips')
          .insert({
            bus_id        : busId,
            route_id      : routeId,
            departure_time: departure.toISOString(),
            status        : 'scheduled',
          })
          .select('id')
          .single();

        if (tripErr) throw new Error(`Could not create trip: ${tripErr.message}`);
        tripId = newTrip!.id;
      }

      // ── Step 2: Insert booking ────────────────────────────────────────────────
      const { data, error } = await supabase
        .from('bookings')
        .insert({
          user_id       : userId,
          trip_id       : tripId,
          bus_id        : busId,
          seat_number   : seatNumber,
          fare_amount   : fare,
          travel_date   : travelDate,
          booking_status: 'pending',
          payment_status: 'pending',
        })
        .select()
        .single();

      if (error) throw error;

      // ── Step 3: Map to UI Booking ─────────────────────────────────────────────
      const booking: Booking = {
        id            : data.id,
        userId        : data.user_id,
        busId,
        seatId,
        routeId,
        bookingTime   : data.booking_time ?? '',
        travelDate    : data.travel_date,
        bookingStatus : data.booking_status as BookingStatus,
        paymentStatus : data.payment_status as any,
        fareAmount    : data.fare_amount,
        qrCode        : generateQRCode(data.id),
        seatNumber    : data.seat_number,
        routeName,
        busType,
      };

      return { data: booking, error: null };
    } catch (err: any) {
      return { data: null, error: err.message };
    }
  },

  async confirmBooking(bookingId: string): Promise<{ data: any | null; error: string | null }> {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .update({ booking_status: 'confirmed', payment_status: 'success' })
        .eq('id', bookingId)
        .select()
        .single();

      if (error) throw error;

      // Increment bus occupancy visually
      if (data?.bus_id) {
        const { data: bus } = await supabase.from('buses').select('current_occupancy').eq('id', data.bus_id).single();
        if (bus) {
          await supabase.from('buses').update({ current_occupancy: (bus.current_occupancy || 0) + 1 }).eq('id', data.bus_id);
        }
      }

      return { data, error: null };
    } catch (err: any) {
      return { data: null, error: err.message };
    }
  },

  async cancelBooking(bookingId: string): Promise<{ data: any | null; error: string | null }> {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .update({ booking_status: 'cancelled' })
        .eq('id', bookingId)
        .select()
        .single();

      if (error) throw error;

      // Decrement bus occupancy visually
      if (data?.bus_id) {
        const { data: bus } = await supabase.from('buses').select('current_occupancy').eq('id', data.bus_id).single();
        if (bus && bus.current_occupancy > 0) {
          await supabase.from('buses').update({ current_occupancy: bus.current_occupancy - 1 }).eq('id', data.bus_id);
        }
      }

      return { data, error: null };
    } catch (err: any) {
      return { data: null, error: err.message };
    }
  },

  async getUserBookings(
    userId: string,
    status?: BookingStatus
  ): Promise<{ data: Booking[] | null; error: string | null }> {
    try {
      let query = supabase
        .from('bookings')
        .select(`
          id, user_id, booking_status, payment_status,
          fare_amount, travel_date, seat_number, bus_id, booking_time,
          trip:trips(
            route:routes(id, route_name),
            bus:buses(id, bus_type)
          )
        `)
        .eq('user_id', userId)
        .order('booking_time', { ascending: false });

      if (status) query = query.eq('booking_status', status);

      const { data, error } = await query;
      if (error) throw error;

      // Cast to 'any' — Supabase infers nested joins as arrays without generated
      // DB types, but at runtime they're single objects (many-to-one FK).
      const mapped: Booking[] = (data ?? []).map((b: any) => ({
        id            : b.id,
        userId        : b.user_id,
        busId         : b.bus_id ?? b.trip?.bus?.id ?? '',
        bookingStatus : b.booking_status as BookingStatus,
        paymentStatus : b.payment_status as any,
        fareAmount    : b.fare_amount,
        travelDate    : b.travel_date,
        seatNumber    : b.seat_number,
        routeName     : b.trip?.route?.route_name ?? 'Route',
        busType       : b.trip?.bus?.bus_type      ?? 'AC',
        seatId        : `s${b.seat_number}`,
        routeId       : b.trip?.route?.id ?? '',
        bookingTime   : b.booking_time ?? '',
        qrCode        : generateQRCode(b.id),
      }));

      return { data: mapped, error: null };
    } catch (err: any) {
      return { data: null, error: err.message };
    }
  },

  async getBookingById(bookingId: string): Promise<{ data: Booking | null; error: string | null }> {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          trip:trips(
            route:routes(id, route_name),
            bus:buses(id, bus_type)
          )
        `)
        .eq('id', bookingId)
        .single();

      if (error) throw error;

      // Cast to 'any' for the same reason as above
      const raw: any = data;
      const mapped: Booking = {
        id            : raw.id,
        userId        : raw.user_id,
        busId         : raw.bus_id ?? raw.trip?.bus?.id ?? '',
        seatId        : `s${raw.seat_number}`,
        routeId       : raw.trip?.route?.id ?? '',
        bookingTime   : raw.booking_time ?? '',
        travelDate    : raw.travel_date,
        bookingStatus : raw.booking_status as BookingStatus,
        paymentStatus : raw.payment_status as any,
        fareAmount    : raw.fare_amount,
        qrCode        : generateQRCode(raw.id),
        seatNumber    : raw.seat_number,
        routeName     : raw.trip?.route?.route_name ?? 'Route',
        busType       : raw.trip?.bus?.bus_type      ?? 'AC',
      };

      return { data: mapped, error: null };
    } catch (err: any) {
      return { data: null, error: err.message };
    }
  },

  // Keep for backward compatibility (some screens call bookingService.generateQRCode directly)
  generateQRCode,
};
