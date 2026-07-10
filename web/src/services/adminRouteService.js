import { supabase } from '../lib/supabaseClient';
function getTodayDate() {
    return new Date().toISOString().slice(0, 10);
}
function addDays(dateString, days) {
    const date = new Date(`${dateString}T00:00:00`);
    date.setDate(date.getDate() + days);
    return date.toISOString().slice(0, 10);
}
export const adminRouteService = {
    async createRoute(route) {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user)
                throw new Error('Not authenticated');
            const { data: profile } = await supabase
                .from('profiles').select('role').eq('id', user.id).single();
            if (profile?.role !== 'admin')
                throw new Error('Admin access required');
            const payload = {
                route_name: route.routeName,
                origin: route.origin,
                destination: route.destination,
                distance: route.distance,
                estimated_duration: route.estimatedDuration,
                base_fare: route.baseFare,
            };
            const { data, error } = await supabase
                .from('routes')
                .insert([payload])
                .select()
                .single();
            if (error)
                throw error;
            return { data: mapRoute(data), error: null };
        }
        catch (err) {
            return { data: null, error: err.message };
        }
    },
    async updateRoute(routeId, updates) {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user)
                throw new Error('Not authenticated');
            const { data: profile } = await supabase
                .from('profiles').select('role').eq('id', user.id).single();
            if (profile?.role !== 'admin')
                throw new Error('Admin access required');
            const payload = {
                route_name: updates.routeName,
                origin: updates.origin,
                destination: updates.destination,
                distance: updates.distance,
                estimated_duration: updates.estimatedDuration,
                base_fare: updates.baseFare,
            };
            Object.keys(payload).forEach(k => {
                if (payload[k] === undefined)
                    delete payload[k];
            });
            const { data, error } = await supabase
                .from('routes')
                .update(payload)
                .eq('id', routeId)
                .select()
                .single();
            if (error)
                throw error;
            return { data: mapRoute(data), error: null };
        }
        catch (err) {
            return { data: null, error: err.message };
        }
    },
    async getRouteDeleteImpact(routeId) {
        try {
            const today = getTodayDate();
            const { data: directBookings, error: directError } = await supabase
                .from('bookings')
                .select('id, travel_date')
                .eq('route_id', routeId)
                .in('booking_status', ['pending', 'confirmed'])
                .gte('travel_date', today);
            if (directError)
                throw directError;
            const { data: trips, error: tripsError } = await supabase
                .from('trips')
                .select('id')
                .eq('route_id', routeId);
            if (tripsError)
                throw tripsError;
            const tripIds = (trips || []).map(trip => trip.id);
            let tripBookings = [];
            if (tripIds.length > 0) {
                const { data, error } = await supabase
                    .from('bookings')
                    .select('id, travel_date')
                    .in('trip_id', tripIds)
                    .in('booking_status', ['pending', 'confirmed'])
                    .gte('travel_date', today);
                if (error)
                    throw error;
                tripBookings = data || [];
            }
            const bookingsById = new Map([...(directBookings || []), ...tripBookings].map(booking => [booking.id, booking]));
            const dates = Array.from(bookingsById.values()).map(booking => booking.travel_date).filter(Boolean).sort();
            const latestTravelDate = dates[dates.length - 1];
            return {
                data: {
                    hasActiveBookings: dates.length > 0,
                    activeBookingCount: dates.length,
                    safeDeleteAfter: latestTravelDate ? addDays(latestTravelDate, 2) : null,
                },
                error: null,
            };
        }
        catch (err) {
            return { data: null, error: err.message };
        }
    },
    async deactivateRoute(routeId) {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user)
                throw new Error('Not authenticated');
            const { data: profile } = await supabase
                .from('profiles').select('role').eq('id', user.id).single();
            if (profile?.role !== 'admin')
                throw new Error('Admin access required');
            const tomorrow = addDays(getTodayDate(), 1);
            const { error } = await supabase
                .from('trips')
                .update({ status: 'completed' })
                .eq('route_id', routeId)
                .eq('status', 'scheduled')
                .gte('departure_time', `${tomorrow}T00:00:00`);
            if (error)
                throw error;
            return { data: undefined, error: null };
        }
        catch (err) {
            return { data: undefined, error: err.message };
        }
    },
    async deleteRoute(routeId) {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user)
                throw new Error('Not authenticated');
            const { data: profile } = await supabase
                .from('profiles').select('role').eq('id', user.id).single();
            if (profile?.role !== 'admin')
                throw new Error('Admin access required');
            const { data: impact, error: impactError } = await this.getRouteDeleteImpact(routeId);
            if (impactError)
                throw new Error(impactError);
            if (impact?.hasActiveBookings) {
                throw new Error(`This route has ${impact.activeBookingCount} active/current/future booking(s). Deactivate it instead. Safe hard delete after ${impact.safeDeleteAfter}.`);
            }
            await this.deactivateRoute(routeId);
            const { error: stopsError } = await supabase
                .from('stops')
                .delete()
                .eq('route_id', routeId);
            if (stopsError)
                throw stopsError;
            const { error: tripsError } = await supabase
                .from('trips')
                .delete()
                .eq('route_id', routeId);
            if (tripsError)
                throw tripsError;
            const { error } = await supabase
                .from('routes')
                .delete()
                .eq('id', routeId);
            if (error)
                throw error;
            return { data: undefined, error: null };
        }
        catch (err) {
            return { data: undefined, error: err.message };
        }
    },
    async createStop(stop) {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user)
                throw new Error('Not authenticated');
            const { data: profile } = await supabase
                .from('profiles').select('role').eq('id', user.id).single();
            if (profile?.role !== 'admin')
                throw new Error('Admin access required');
            const payload = {
                route_id: stop.routeId,
                name: stop.name,
                latitude: stop.latitude,
                longitude: stop.longitude,
                order: stop.order ?? 0,
            };
            const { data, error } = await supabase
                .from('stops')
                .insert([payload])
                .select()
                .single();
            if (error)
                throw error;
            return { data: { ...data, estimatedArrival: '' }, error: null };
        }
        catch (err) {
            return { data: null, error: err.message };
        }
    },
    async updateStop(stopId, updates) {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user)
                throw new Error('Not authenticated');
            const { data: profile } = await supabase
                .from('profiles').select('role').eq('id', user.id).single();
            if (profile?.role !== 'admin')
                throw new Error('Admin access required');
            const payload = {
                name: updates.name,
                latitude: updates.latitude,
                longitude: updates.longitude,
                order: updates.order,
            };
            Object.keys(payload).forEach(k => {
                if (payload[k] === undefined)
                    delete payload[k];
            });
            const { data, error } = await supabase
                .from('stops')
                .update(payload)
                .eq('id', stopId)
                .select()
                .single();
            if (error)
                throw error;
            return { data: { ...data, estimatedArrival: '' }, error: null };
        }
        catch (err) {
            return { data: null, error: err.message };
        }
    },
    async deleteStop(stopId) {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user)
                throw new Error('Not authenticated');
            const { data: profile } = await supabase
                .from('profiles').select('role').eq('id', user.id).single();
            if (profile?.role !== 'admin')
                throw new Error('Admin access required');
            const { error } = await supabase
                .from('stops')
                .delete()
                .eq('id', stopId);
            if (error)
                throw error;
            return { data: undefined, error: null };
        }
        catch (err) {
            return { data: undefined, error: err.message };
        }
    },
    async reorderStops(routeId, stopIds) {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user)
                throw new Error('Not authenticated');
            const { data: profile } = await supabase
                .from('profiles').select('role').eq('id', user.id).single();
            if (profile?.role !== 'admin')
                throw new Error('Admin access required');
            for (const stopId of stopIds) {
                const order = stopIds.indexOf(stopId);
                const { error } = await supabase
                    .from('stops')
                    .update({ order })
                    .eq('route_id', routeId)
                    .eq('id', stopId);
                if (error)
                    throw error;
            }
            return { data: undefined, error: null };
        }
        catch (err) {
            return { data: undefined, error: err.message };
        }
    },
};
function mapRoute(raw) {
    return {
        id: raw.id,
        routeName: raw.route_name,
        origin: raw.origin || '',
        destination: raw.destination || '',
        distance: raw.distance ?? 0,
        estimatedDuration: raw.estimated_duration ?? 0,
        baseFare: raw.base_fare ?? 0,
        stops: [],
        createdAt: raw.created_at ?? new Date().toISOString(),
    };
}
