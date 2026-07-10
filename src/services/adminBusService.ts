import { supabase } from '../lib/supabase';
import { Bus } from '../types';

function mapBus(raw: any): Bus {
  let activeRouteId = '';
  if (raw.trips && Array.isArray(raw.trips)) {
    const activeTrip = raw.trips.find((t: any) => t.status === 'scheduled' || t.status === 'ongoing');
    if (activeTrip) activeRouteId = activeTrip.route_id;
  }

  return {
    id              : raw.id,
    routeId         : activeRouteId || raw.route_id || '',
    busType         : raw.bus_type,
    totalSeats      : raw.total_seats,
    currentOccupancy: raw.current_occupancy ?? 0,
    gpsLocation     : {
      latitude : raw.gps_lat  ?? 30.3753,
      longitude: raw.gps_lng  ?? 69.3451,
    },
    driverName : raw.driver_name  ?? 'Unknown',
    plateNumber: raw.plate_number ?? 'N/A',
    isActive   : raw.is_active    ?? true,
    createdAt  : raw.created_at   ?? new Date().toISOString(),
  };
}

export const adminBusService = {
  async createBus(bus: Partial<Bus>): Promise<{ data: Bus | null; error: string | null }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data: profile } = await supabase
        .from('profiles').select('role').eq('id', user.id).single();
      if (profile?.role !== 'admin') throw new Error('Admin access required');

      const payload = {
        route_id         : bus.routeId,
        bus_type         : bus.busType,
        total_seats      : bus.totalSeats,
        current_occupancy: bus.currentOccupancy ?? 0,
        gps_lat          : bus.gpsLocation?.latitude ?? 30.3753,
        gps_lng          : bus.gpsLocation?.longitude ?? 69.3451,
        driver_name      : bus.driverName,
        plate_number     : bus.plateNumber,
        is_active        : bus.isActive ?? true,
      };

      const { data, error } = await supabase
        .from('buses')
        .insert([payload])
        .select()
        .single();

      if (error) throw error;
      return { data: mapBus(data), error: null };
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
        route_id         : updates.routeId,
        bus_type         : updates.busType,
        total_seats      : updates.totalSeats,
        current_occupancy: updates.currentOccupancy,
        gps_lat          : updates.gpsLocation?.latitude,
        gps_lng          : updates.gpsLocation?.longitude,
        driver_name      : updates.driverName,
        plate_number     : updates.plateNumber,
        is_active        : updates.isActive,
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
      return { data: mapBus(data), error: null };
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
