import { supabase } from '../lib/supabase';
import { Bus, Route, Seat } from '../types';

// ─── Type mappers: Supabase (snake_case) → App interfaces (camelCase) ────────

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
      latitude : raw.gps_lat  ?? 30.3753, // Fallback to Pakistan center
      longitude: raw.gps_lng  ?? 69.3451,
    },
    driverName : raw.driver_name  ?? 'Unknown',
    plateNumber: raw.plate_number ?? 'N/A',
    isActive   : raw.is_active    ?? true,
    createdAt  : raw.created_at   ?? new Date().toISOString(),
  };
}

function mapRoute(raw: any): Route {
  const originName = raw.origin?.name ?? raw.route_name?.split(' → ')[0] ?? '';
  const destName   = raw.dest?.name   ?? raw.route_name?.split(' → ')[1] ?? '';

  // Dynamically generate realistic physical stops for the timeline visualization
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
    baseFare         : raw.base_fare          ?? 0,
    createdAt        : raw.created_at         ?? new Date().toISOString(),
  };
}

// ─── Service ─────────────────────────────────────────────────────────────────

export const busService = {

  async getAllRoutes(): Promise<{ data: Route[] | null; error: string | null }> {
    try {
      const { data, error } = await supabase
        .from('routes')
        .select(`
          *,
          origin:hubs!origin_id(name),
          dest:hubs!dest_id(name)
        `);
      if (error) throw error;
      return { data: (data ?? []).map(mapRoute), error: null };
    } catch (err: any) {
      return { data: null, error: err.message };
    }
  },

  async getAllActiveBuses(): Promise<{ data: Bus[] | null; error: string | null }> {
    try {
      const { data, error } = await supabase
        .from('buses')
        .select(`*, trips(route_id, status)`)
        .eq('is_active', true);
      if (error) throw error;
      return { data: (data ?? []).map(mapBus), error: null };
    } catch (err: any) {
      return { data: null, error: err.message };
    }
  },

  async getAllBuses(): Promise<{ data: Bus[] | null; error: string | null }> {
    try {
      const { data, error } = await supabase
        .from('buses')
        .select(`*, trips(route_id, status)`);
      if (error) throw error;
      return { data: (data ?? []).map(mapBus), error: null };
    } catch (err: any) {
      return { data: null, error: err.message };
    }
  },

  async getBusById(busId: string): Promise<{ data: Bus | null; error: string | null }> {
    try {
      const { data, error } = await supabase
        .from('buses')
        .select('*')
        .eq('id', busId)
        .single();
      if (error) throw error;
      return { data: mapBus(data), error: null };
    } catch (err: any) {
      return { data: null, error: err.message };
    }
  },

  async getRouteById(routeId: string): Promise<{ data: Route | null; error: string | null }> {
    try {
      const { data, error } = await supabase
        .from('routes')
        .select(`
          *,
          origin:hubs!origin_id(name),
          dest:hubs!dest_id(name)
        `)
        .eq('id', routeId)
        .single();
      if (error) throw error;
      return { data: mapRoute(data), error: null };
    } catch (err: any) {
      return { data: null, error: err.message };
    }
  },

  async getFirstRouteByName(routeName: string): Promise<{ data: Route | null; error: string | null }> {
    try {
      const { data, error } = await supabase
        .from('routes')
        .select(`
          *,
          origin:hubs!origin_id(name),
          dest:hubs!dest_id(name)
        `)
        .ilike('route_name', `%${routeName}%`)
        .limit(1)
        .single();
      if (error) throw error;
      return { data: mapRoute(data), error: null };
    } catch (err: any) {
      return { data: null, error: err.message };
    }
  },

  /**
   * searchRoutes — Returns a list of {bus, route} pairs for the RouteResultsScreen.
   * Each item contains a properly mapped Bus and Route so BusCard can render
   * route.routeName without crashing.
   */
  async searchRoutes(
    origin: string,
    destination: string
  ): Promise<{ data: { bus: Bus; route: Route }[] | null; error: string | null }> {
    try {
      // 1. Find routes matching the origin + destination text
      const { data: routes, error: routeError } = await supabase
        .from('routes')
        .select(`
          *,
          origin:hubs!origin_id(name),
          dest:hubs!dest_id(name)
        `)
        .ilike('route_name', `%${origin}%`)
        .ilike('route_name', `%${destination}%`);

      if (routeError) throw routeError;
      if (!routes || routes.length === 0) return { data: [], error: null };

      // Filter out reverse routes by strictly matching the origin name or the first part of the route name
      const exactRoutes = routes.filter(r => 
        (r.origin?.name?.toLowerCase() === origin.toLowerCase() && r.dest?.name?.toLowerCase() === destination.toLowerCase()) ||
        r.route_name.toLowerCase().startsWith(origin.toLowerCase())
      );

      if (exactRoutes.length === 0) return { data: [], error: null };

      // 2. Fetch scheduled trips for those routes (with nested bus data)
      const routeIds = exactRoutes.map(r => r.id);
      const { data: trips, error: tripError } = await supabase
        .from('trips')
        .select('*, bus:buses(*)')
        .in('route_id', routeIds)
        .eq('status', 'scheduled');

      if (tripError) throw tripError;

      // 3. Merge — each result has a proper Bus + Route object
      const results = (trips ?? [])
        .filter(t => t.bus && t.bus.is_active !== false)         // skip inactive buses and trips without a linked bus
        .map(t => {
          const rawRoute = exactRoutes.find(r => r.id === t.route_id);
          return {
            bus  : mapBus(t.bus),
            route: rawRoute ? mapRoute(rawRoute) : ({
              id: t.route_id, routeName: 'Unknown Route',
              origin: origin, destination: destination,
              stops: [], distance: 0, estimatedDuration: 0,
              baseFare: 0, createdAt: new Date().toISOString(),
            } as Route),
          };
        });

      return { data: results, error: null };
    } catch (err: any) {
      return { data: null, error: err.message };
    }
  },

  async getSeatsByBus(busId: string, travelDate: string): Promise<{ data: Seat[] | null; error: string | null }> {
    try {
      // 1. Fetch bus for total seat count
      const { data: bus } = await this.getBusById(busId);
      if (!bus) throw new Error('Bus not found');

      // 2. Fetch already-booked seat numbers for this bus on this date
      const { data: bookings } = await supabase
        .from('bookings')
        .select('seat_number')
        .eq('bus_id', busId)
        .eq('travel_date', travelDate)
        .eq('booking_status', 'confirmed');

      const takenSeats = new Set((bookings ?? []).map(b => b.seat_number));

      // If we don't have enough bookings in the DB for this date to match the bus's current occupancy,
      // dynamically block additional seats deterministically based on travelDate + busId + seat number.
      const targetOccupancy = bus.currentOccupancy;
      if (takenSeats.size < targetOccupancy) {
        const needed = targetOccupancy - takenSeats.size;
        
        // Build a list of available seat numbers with their deterministic scores
        const candidates: { seatNo: number; score: number }[] = [];
        for (let i = 1; i <= bus.totalSeats; i++) {
          if (!takenSeats.has(i)) {
            // Seeded hash score for seat
            const str = `${busId}-${travelDate}-${i}`;
            let hash = 0;
            for (let j = 0; j < str.length; j++) {
              hash = str.charCodeAt(j) + ((hash << 5) - hash);
            }
            candidates.push({ seatNo: i, score: Math.abs(hash) });
          }
        }
        
        // Sort candidates by score ascending and block the top needed seats
        candidates.sort((a, b) => a.score - b.score);
        const extraTaken = candidates.slice(0, needed);
        for (const candidate of extraTaken) {
          takenSeats.add(candidate.seatNo);
        }
      }

      // 3. Generate the full seat map (4 columns)
      const seats: Seat[] = [];
      const cols       = 4;
      const totalSeats = bus.totalSeats;

      for (let i = 1; i <= totalSeats; i++) {
        const seatRow = Math.ceil(i / cols);
        const col     = ((i - 1) % cols) + 1;
        // First 4 rows = female zone, last 3 rows = male zone, rest = no preference
        const totalRows   = Math.ceil(totalSeats / cols);
        const isFemaleZone = seatRow <= 4;
        const isMaleZone   = seatRow > totalRows - 3;

        seats.push({
          id                : `s${i}`,
          busId,
          seatNumber        : i,
          row               : seatRow,
          column            : col,
          position          : col === 1 || col === 4 ? 'window' : 'aisle',
          seatGenderZone    : isFemaleZone ? 'female_only' : isMaleZone ? 'male_only' : 'no_preference',
          availabilityStatus: !takenSeats.has(i),   // true = still bookable
        });
      }

      return { data: seats, error: null };
    } catch (err: any) {
      return { data: null, error: err.message };
    }
  },
};
