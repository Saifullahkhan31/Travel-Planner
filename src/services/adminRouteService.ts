import { supabase } from '../lib/supabase';
import { Route, Stop } from '../types';

function mapRoute(raw: any): Route {
  const originName = raw.origin?.name ?? raw.route_name?.split(' → ')[0] ?? '';
  const destName   = raw.dest?.name   ?? raw.route_name?.split(' → ')[1] ?? '';
  const estDur = raw.estimated_duration || 120;

  const mockStops = [
    { id: 's1', routeId: raw.id ?? '', latitude: 0, longitude: 0, order: 1, name: `${originName} Main Terminal`, estimatedArrival: 'Departure' },
    { id: 's2', routeId: raw.id ?? '', latitude: 0, longitude: 0, order: 2, name: 'Highway Rest Area',       estimatedArrival: `+${Math.floor(estDur * 0.35)} min` },
    { id: 's3', routeId: raw.id ?? '', latitude: 0, longitude: 0, order: 3, name: 'Intercity Checkpoint',     estimatedArrival: `+${Math.floor(estDur * 0.75)} min` },
    { id: 's4', routeId: raw.id ?? '', latitude: 0, longitude: 0, order: 4, name: `${destName} Central Hub`,  estimatedArrival: `+${estDur} min` },
  ];

  return {
    id               : raw.id,
    routeName        : raw.route_name,
    origin           : originName,
    destination      : destName,
    routePath        : raw.route_path ?? undefined,
    stops            : mockStops,
    distance         : raw.distance          ?? 0,
    estimatedDuration: raw.estimated_duration ?? 0,
    baseFare         : raw.base_fare         ?? 0,
    createdAt        : raw.created_at        ?? new Date().toISOString(),
  };
}

export const adminRouteService = {
  async createRoute(route: Partial<Route>): Promise<{ data: Route | null; error: string | null }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data: profile } = await supabase
        .from('profiles').select('role').eq('id', user.id).single();
      if (profile?.role !== 'admin') throw new Error('Admin access required');

      const payload = {
        route_name        : route.routeName,
        origin            : route.origin,
        destination       : route.destination,
        distance          : route.distance,
        estimated_duration: route.estimatedDuration,
        base_fare         : route.baseFare,
        route_path        : route.routePath ?? null,
      };

      const { data, error } = await supabase
        .from('routes')
        .insert([payload])
        .select()
        .single();

      if (error) throw error;
      return { data: mapRoute(data), error: null };
    } catch (err: any) {
      return { data: null, error: err.message };
    }
  },

  async updateRoute(routeId: string, updates: Partial<Route>): Promise<{ data: Route | null; error: string | null }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data: profile } = await supabase
        .from('profiles').select('role').eq('id', user.id).single();
      if (profile?.role !== 'admin') throw new Error('Admin access required');

      const payload: Record<string, any> = {
        route_name        : updates.routeName,
        origin            : updates.origin,
        destination       : updates.destination,
        distance          : updates.distance,
        estimated_duration: updates.estimatedDuration,
        base_fare         : updates.baseFare,
        route_path        : updates.routePath,
      };

      Object.keys(payload).forEach(k => {
        if (payload[k] === undefined) delete payload[k];
      });

      const { data, error } = await supabase
        .from('routes')
        .update(payload)
        .eq('id', routeId)
        .select()
        .single();

      if (error) throw error;
      return { data: mapRoute(data), error: null };
    } catch (err: any) {
      return { data: null, error: err.message };
    }
  },

  async deleteRoute(routeId: string): Promise<{ data: void; error: string | null }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data: profile } = await supabase
        .from('profiles').select('role').eq('id', user.id).single();
      if (profile?.role !== 'admin') throw new Error('Admin access required');

      const { error } = await supabase
        .from('routes')
        .delete()
        .eq('id', routeId);

      if (error) throw error;
      return { data: undefined, error: null };
    } catch (err: any) {
      return { data: undefined, error: err.message };
    }
  },

  async createStop(stop: Partial<Stop>): Promise<{ data: Stop | null; error: string | null }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data: profile } = await supabase
        .from('profiles').select('role').eq('id', user.id).single();
      if (profile?.role !== 'admin') throw new Error('Admin access required');

      const payload = {
        route_id: stop.routeId,
        name    : stop.name,
        latitude: stop.latitude,
        longitude: stop.longitude,
        order   : stop.order ?? 0,
      };

      const { data, error } = await supabase
        .from('stops')
        .insert([payload])
        .select()
        .single();

      if (error) throw error;
      return { data: { ...data, estimatedArrival: '' }, error: null };
    } catch (err: any) {
      return { data: null, error: err.message };
    }
  },

  async updateStop(stopId: string, updates: Partial<Stop>): Promise<{ data: Stop | null; error: string | null }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data: profile } = await supabase
        .from('profiles').select('role').eq('id', user.id).single();
      if (profile?.role !== 'admin') throw new Error('Admin access required');

      const payload: Record<string, any> = {
        name     : updates.name,
        latitude : updates.latitude,
        longitude: updates.longitude,
        order    : updates.order,
      };

      Object.keys(payload).forEach(k => {
        if (payload[k] === undefined) delete payload[k];
      });

      const { data, error } = await supabase
        .from('stops')
        .update(payload)
        .eq('id', stopId)
        .select()
        .single();

      if (error) throw error;
      return { data: { ...data, estimatedArrival: '' }, error: null };
    } catch (err: any) {
      return { data: null, error: err.message };
    }
  },

  async deleteStop(stopId: string): Promise<{ data: void; error: string | null }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data: profile } = await supabase
        .from('profiles').select('role').eq('id', user.id).single();
      if (profile?.role !== 'admin') throw new Error('Admin access required');

      const { error } = await supabase
        .from('stops')
        .delete()
        .eq('id', stopId);

      if (error) throw error;
      return { data: undefined, error: null };
    } catch (err: any) {
      return { data: undefined, error: err.message };
    }
  },

  async reorderStops(routeId: string, stopIds: string[]): Promise<{ data: void; error: string | null }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data: profile } = await supabase
        .from('profiles').select('role').eq('id', user.id).single();
      if (profile?.role !== 'admin') throw new Error('Admin access required');

      const updates = stopIds.map((stopId, index) => ({
        id: stopId,
        order: index,
      }));

      for (const update of updates) {
        const { error } = await supabase
          .from('stops')
          .update({ order: update.order })
          .eq('id', update.id);
        if (error) throw error;
      }

      return { data: undefined, error: null };
    } catch (err: any) {
      return { data: undefined, error: err.message };
    }
  },
};
