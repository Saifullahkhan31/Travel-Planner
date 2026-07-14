import { supabase } from '../lib/supabaseClient';

export interface Bus {
  id: string;
  routeId: string;
  busType: string;
  totalSeats: number;
  currentOccupancy: number;
  gpsLocation: { latitude: number; longitude: number };
  driverId?: string;
  driverName: string;
  plateNumber: string;
  isActive: boolean;
  createdAt: string;
}

export interface DeleteImpact {
  hasActiveBookings: boolean;
  activeBookingCount: number;
  safeDeleteAfter: string | null;
}

function getTodayDate() {
  return new Date().toISOString().slice(0, 10);
}

function addDays(dateString: string, days: number) {
  const date = new Date(`${dateString}T00:00:00`);
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

export const adminBusService = {
  async getAllBuses(): Promise<{ data: Bus[] | null; error: string | null }> {
    try {
      const { data, error } = await supabase
        .from('buses')
        .select('*, trips(route_id, status)');

      if (error) throw error;
      return { data: (data ?? []).map(mapBus), error: null };
    } catch (err: any) {
      return { data: null, error: err.message };
    }
  },

  async getBusDeleteImpact(busId: string): Promise<{ data: DeleteImpact | null; error: string | null }> {
    try {
      const { data: trips, error: tripsError } = await supabase
        .from('trips')
        .select('id, departure_time, status')
        .eq('bus_id', busId);

      if (tripsError) throw tripsError;

      const tripIds = (trips || []).map(trip => trip.id);
      const { data: directBookings, error: directError } = await supabase
        .from('bookings')
        .select('id, travel_date, booking_status')
        .eq('bus_id', busId)
        .in('booking_status', ['pending', 'confirmed']);

      if (directError) throw directError;

      let tripBookings: any[] = [];
      if (tripIds.length > 0) {
        const { data, error } = await supabase
          .from('bookings')
          .select('id, travel_date, booking_status')
          .in('trip_id', tripIds)
          .in('booking_status', ['pending', 'confirmed']);

        if (error) throw error;
        tripBookings = data || [];
      }

      const bookingsById = new Map([...(directBookings || []), ...tripBookings].map(booking => [booking.id, booking]));
      const dates = Array.from(bookingsById.values())
        .map(booking => booking.travel_date)
        .filter(Boolean)
        .sort();
      const latestTravelDate = dates[dates.length - 1];
      const hasActiveTrips = (trips || []).some(trip => trip.status === 'scheduled' || trip.status === 'ongoing');
      const activeItemCount = bookingsById.size + (hasActiveTrips ? 1 : 0);

      return {
        data: {
          hasActiveBookings: activeItemCount > 0,
          activeBookingCount: activeItemCount,
          safeDeleteAfter: latestTravelDate ? addDays(latestTravelDate, 2) : null,
        },
        error: null,
      };
    } catch (err: any) {
      return { data: null, error: err.message };
    }
  },

  async deactivateBus(busId: string): Promise<{ data: void; error: string | null }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data: profile } = await supabase
        .from('profiles').select('role').eq('id', user.id).single();
      if (profile?.role !== 'admin') throw new Error('Admin access required');

      const { error: busError } = await supabase
        .from('buses')
        .update({ is_active: false })
        .eq('id', busId);

      if (busError) throw busError;

      const tomorrow = addDays(getTodayDate(), 1);
      const { error: tripError } = await supabase
        .from('trips')
        .update({ status: 'completed' })
        .eq('bus_id', busId)
        .eq('status', 'scheduled')
        .gte('departure_time', `${tomorrow}T00:00:00`);

      if (tripError) throw new Error(`Bus deactivated, but future trips could not be closed: ${tripError.message}`);

      return { data: undefined, error: null };
    } catch (err: any) {
      return { data: undefined, error: err.message };
    }
  },

  async createBus(bus: Partial<Bus>): Promise<{ data: Bus | null; error: string | null }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data: profile } = await supabase
        .from('profiles').select('role').eq('id', user.id).single();
      if (profile?.role !== 'admin') throw new Error('Admin access required');

      const payload = {
        bus_type: bus.busType,
        total_seats: bus.totalSeats,
        current_occupancy: bus.currentOccupancy ?? 0,
        gps_lat: bus.gpsLocation?.latitude ?? 30.3753,
        gps_lng: bus.gpsLocation?.longitude ?? 69.3451,
        driver_id: bus.driverId,
        driver_name: bus.driverName,
        plate_number: bus.plateNumber,
        is_active: bus.isActive ?? true,
      };

      const { data, error } = await supabase
        .from('buses')
        .insert([payload])
        .select()
        .single();

      if (error) throw error;

      if (bus.routeId) {
        const departure = new Date();
        departure.setHours(departure.getHours() + 1);

        const { error: tripError } = await supabase
          .from('trips')
          .insert({
            bus_id: data.id,
            route_id: bus.routeId,
            departure_time: departure.toISOString(),
            status: 'scheduled',
          });

        if (tripError) throw new Error(`Bus created, but route assignment failed: ${tripError.message}`);
      }

      return { data: mapBus({ ...data, trips: bus.routeId ? [{ route_id: bus.routeId, status: 'scheduled' }] : [] }), error: null };
    } catch (err: any) {
      return { data: null, error: err.message };
    }
  },

  async updateBus(busId: string, updates: Partial<Bus>): Promise<{ data: Bus | null; error: string | null }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data: profile } = await supabase
        .from('profiles').select('role').eq('id', user.id).single();
      if (profile?.role !== 'admin') throw new Error('Admin access required');

      const payload: Record<string, any> = {
        bus_type: updates.busType,
        total_seats: updates.totalSeats,
        current_occupancy: updates.currentOccupancy,
        gps_lat: updates.gpsLocation?.latitude,
        gps_lng: updates.gpsLocation?.longitude,
        driver_id: updates.driverId,
        driver_name: updates.driverName,
        plate_number: updates.plateNumber,
        is_active: updates.isActive,
      };

      Object.keys(payload).forEach(k => {
        if (payload[k] === undefined) delete payload[k];
      });

      const { data, error } = await supabase
        .from('buses')
        .update(payload)
        .eq('id', busId)
        .select()
        .single();

      if (error) throw error;

      if (updates.routeId !== undefined) {
        const { data: existingTrips, error: existingTripError } = await supabase
          .from('trips')
          .select('id')
          .eq('bus_id', busId)
          .in('status', ['scheduled', 'ongoing'])
          .limit(1);

        if (existingTripError) throw existingTripError;

        if (existingTrips && existingTrips.length > 0) {
          const { error: tripUpdateError } = await supabase
            .from('trips')
            .update({ route_id: updates.routeId })
            .eq('id', existingTrips[0].id);

          if (tripUpdateError) throw new Error(`Bus updated, but route assignment failed: ${tripUpdateError.message}`);
        } else if (updates.routeId) {
          const departure = new Date();
          departure.setHours(departure.getHours() + 1);

          const { error: tripInsertError } = await supabase
            .from('trips')
            .insert({
              bus_id: busId,
              route_id: updates.routeId,
              departure_time: departure.toISOString(),
              status: 'scheduled',
            });

          if (tripInsertError) throw new Error(`Bus updated, but route assignment failed: ${tripInsertError.message}`);
        }
      }

      return { data: mapBus({ ...data, trips: updates.routeId ? [{ route_id: updates.routeId, status: 'scheduled' }] : [] }), error: null };
    } catch (err: any) {
      return { data: null, error: err.message };
    }
  },

  async deleteBus(busId: string): Promise<{ data: void; error: string | null }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data: profile } = await supabase
        .from('profiles').select('role').eq('id', user.id).single();
      if (profile?.role !== 'admin') throw new Error('Admin access required');

      const { data: impact, error: impactError } = await this.getBusDeleteImpact(busId);
      if (impactError) throw new Error(impactError);
      if (impact?.hasActiveBookings) {
        throw new Error(`This bus has ${impact.activeBookingCount} active/current/future booking(s). Deactivate it instead. Safe hard delete after ${impact.safeDeleteAfter}.`);
      }

      const { data: trips, error: tripsError } = await supabase
        .from('trips')
        .select('id')
        .eq('bus_id', busId);

      if (tripsError) throw tripsError;

      const tripIds = (trips || []).map(trip => trip.id);

      const { error: directBookingUpdateError } = await supabase
        .from('bookings')
        .update({ bus_id: null })
        .eq('bus_id', busId);

      if (directBookingUpdateError) throw new Error(`Could not detach bus bookings: ${directBookingUpdateError.message}`);

      if (tripIds.length > 0) {
        const { error: tripBookingUpdateError } = await supabase
          .from('bookings')
          .update({ trip_id: null, bus_id: null })
          .in('trip_id', tripIds);

        if (tripBookingUpdateError) throw new Error(`Could not detach trip bookings: ${tripBookingUpdateError.message}`);

        const { error: tripDeleteError } = await supabase
          .from('trips')
          .delete()
          .eq('bus_id', busId);

        if (tripDeleteError) throw new Error(`Could not delete bus trips: ${tripDeleteError.message}`);
      }

      const { error } = await supabase
        .from('buses')
        .delete()
        .eq('id', busId);

      if (error) throw error;
      return { data: undefined, error: null };
    } catch (err: any) {
      return { data: undefined, error: err.message };
    }
  },
};

function mapBus(raw: any): Bus {
  let activeRouteId = '';
  if (raw.trips && Array.isArray(raw.trips)) {
    const activeTrip = raw.trips.find((trip: any) => trip.status === 'scheduled' || trip.status === 'ongoing');
    if (activeTrip) activeRouteId = activeTrip.route_id;
  }

  return {
    id: raw.id,
    routeId: activeRouteId || raw.route_id || '',
    busType: raw.bus_type,
    totalSeats: raw.total_seats,
    currentOccupancy: raw.current_occupancy ?? 0,
    gpsLocation: {
      latitude: raw.gps_lat ?? 30.3753,
      longitude: raw.gps_lng ?? 69.3451,
    },
    driverId: raw.driver_id,
    driverName: raw.driver_name ?? 'Unknown',
    plateNumber: raw.plate_number ?? 'N/A',
    isActive: raw.is_active ?? true,
    createdAt: raw.created_at ?? new Date().toISOString(),
  };
}
