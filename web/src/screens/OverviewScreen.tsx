import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Bus, MapPin, Users, KeySquare, Activity, TrendingUp, CheckCircle2, User } from 'lucide-react';

interface OverviewScreenProps {
  onNavigate: (tab: 'buses' | 'routes' | 'drivers' | 'users') => void;
}

export default function OverviewScreen({ onNavigate }: OverviewScreenProps) {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalBuses: 0,
    activeBuses: 0,
    totalRoutes: 0,
    totalDrivers: 0,
    totalCommuters: 0,
    totalUsers: 0,
  });
  const [boardings, setBoardings] = useState<any[]>([]);

  useEffect(() => {
    async function fetchStats() {
      setLoading(true);
      try {
        // Fetch buses
        const { data: buses } = await supabase.from('buses').select('id, is_active');
        const totalBuses = buses?.length || 0;
        const activeBuses = buses?.filter(b => b.is_active)?.length || 0;

        // Fetch routes
        const { count: totalRoutes } = await supabase.from('routes').select('*', { count: 'exact', head: true });

        // Fetch profiles
        const { data: profiles } = await supabase.from('profiles').select('id, role');
        const totalDrivers = profiles?.filter(p => p.role === 'driver' || p.role === 'inactive_driver')?.length || 0;
        const totalCommuters = profiles?.filter(p => p.role === 'commuter')?.length || 0;
        const totalUsers = profiles?.length || 0;

        setStats({
          totalBuses,
          activeBuses,
          totalRoutes: totalRoutes || 0,
          totalDrivers,
          totalCommuters,
          totalUsers,
        });

        // Fetch recent boardings
        const { data: recentBoardings } = await supabase
          .from('bookings')
          .select('id, user_id, bus_id, trip_id, seat_number')
          .eq('booking_status', 'boarded')
          .limit(5);

        if (recentBoardings && recentBoardings.length > 0) {
          const userIds = recentBoardings.map(b => b.user_id).filter(Boolean);
          const busIds = recentBoardings.map(b => b.bus_id).filter(Boolean);
          const tripIds = recentBoardings.map(b => b.trip_id).filter(Boolean);
          
          const { data: profiles } = await supabase.from('profiles').select('id, full_name').in('id', userIds);
          const { data: busData } = await supabase.from('buses').select('id, plate_number').in('id', busIds);
          const { data: trips } = await supabase.from('trips').select('id, route_id').in('id', tripIds);
          
          const routeIds = trips?.map(t => t.route_id).filter(Boolean) || [];
          const { data: routes } = await supabase.from('routes').select('id, route_name').in('id', routeIds);
          
          const enrichedBoardings = recentBoardings.map(b => {
            const trip = trips?.find(t => t.id === b.trip_id);
            const route = routes?.find(r => r.id === trip?.route_id);
            
            return {
              id: b.id,
              seatNumber: b.seat_number,
              passengerName: profiles?.find(p => p.id === b.user_id)?.full_name || 'Unknown Passenger',
              busName: busData?.find(bus => bus.id === b.bus_id)?.plate_number || 'Unknown Bus',
              routeName: route?.route_name || 'Unknown Route'
            };
          });
          setBoardings(enrichedBoardings);
        }
      } catch (err) {
        console.error("Error fetching stats", err);
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-pulse flex flex-col items-center">
          <div className="h-12 w-12 bg-gray-200 rounded-full mb-4"></div>
          <div className="h-4 w-24 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  // Calculate percentages for CSS charts
  const busActivePercent = stats.totalBuses > 0 ? Math.round((stats.activeBuses / stats.totalBuses) * 100) : 0;
  const commuterPercent = stats.totalUsers > 0 ? Math.round((stats.totalCommuters / stats.totalUsers) * 100) : 0;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Dashboard Overview</h2>
          <p className="text-gray-500 mt-1">High-level view of the SmartBusPlanner ecosystem.</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 text-green-700 rounded-full text-sm font-medium border border-green-100">
          <Activity size={16} />
          System Operational
        </div>
      </div>

      {/* Bento Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Large Card: Fleet Overview (Takes 2 columns) */}
        <div 
          onClick={() => onNavigate('buses')}
          className="md:col-span-2 group relative bg-white rounded-3xl p-6 md:p-8 shadow-sm hover:shadow-xl border border-gray-100 transition-all cursor-pointer overflow-hidden"
        >
          <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
            <Bus size={120} />
          </div>
          
          <div className="flex justify-between items-start mb-8 relative z-10">
            <div>
              <p className="text-sm font-semibold text-blue-600 uppercase tracking-wider mb-1">Fleet Management</p>
              <h3 className="text-3xl font-bold text-gray-900">{stats.totalBuses} Buses</h3>
            </div>
            <div className="h-12 w-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <Bus size={24} />
            </div>
          </div>

          <div className="relative z-10">
            <div className="flex justify-between text-sm mb-2">
              <span className="font-medium text-gray-700">System Capacity Utilization</span>
              <span className="font-bold text-gray-900">{busActivePercent}% Active</span>
            </div>
            {/* CSS Bar Chart */}
            <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden flex">
              <div 
                className="bg-blue-600 h-full transition-all duration-1000 ease-out relative overflow-hidden" 
                style={{ width: `${busActivePercent}%` }}
              >
                <div className="absolute inset-0 bg-white/20 w-full animate-[shimmer_2s_infinite]"></div>
              </div>
              <div 
                className="bg-gray-300 h-full transition-all duration-1000 ease-out" 
                style={{ width: `${100 - busActivePercent}%` }}
              ></div>
            </div>
            <div className="flex gap-4 mt-4 text-sm">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-blue-600"></div>
                <span className="text-gray-600">{stats.activeBuses} Active</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-gray-300"></div>
                <span className="text-gray-600">{stats.totalBuses - stats.activeBuses} Inactive</span>
              </div>
            </div>
          </div>
        </div>

        {/* Tall Card: Users (Takes 2 rows) */}
        <div 
          onClick={() => onNavigate('users')}
          className="md:row-span-2 group bg-gradient-to-br from-indigo-600 via-purple-600 to-indigo-800 rounded-3xl p-6 md:p-8 shadow-sm hover:shadow-xl text-white transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between"
        >
          <div className="absolute -bottom-10 -right-10 opacity-10 group-hover:scale-110 transition-transform">
            <Users size={200} />
          </div>
          
          <div className="relative z-10">
            <div className="flex justify-between items-start mb-6">
              <div>
                <p className="text-sm font-semibold text-indigo-200 uppercase tracking-wider mb-1">Network Base</p>
                <h3 className="text-3xl font-bold">{stats.totalUsers}</h3>
                <p className="text-indigo-100">Total Users</p>
              </div>
              <div className="h-12 w-12 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-sm group-hover:bg-white/20 transition-colors">
                <Users size={24} />
              </div>
            </div>
          </div>

          <div className="relative z-10 mt-12 bg-white/10 rounded-2xl p-5 backdrop-blur-sm">
            <h4 className="text-sm font-medium text-indigo-100 mb-4 flex items-center gap-2">
              <TrendingUp size={16} /> User Distribution
            </h4>
            
            {/* CSS Gauge / Multi-segment Bar */}
            <div className="flex h-12 rounded-xl overflow-hidden mb-3">
              <div 
                className="bg-white flex items-center justify-center font-bold text-indigo-600 text-sm transition-all duration-1000"
                style={{ width: `${commuterPercent}%` }}
              >
                {commuterPercent > 15 ? `${commuterPercent}%` : ''}
              </div>
              <div 
                className="bg-purple-400 flex items-center justify-center font-bold text-white text-sm transition-all duration-1000"
                style={{ width: `${100 - commuterPercent}%` }}
              >
                {100 - commuterPercent > 15 ? `${100 - commuterPercent}%` : ''}
              </div>
            </div>
            
            <div className="flex justify-between text-sm mt-3">
              <div className="flex flex-col">
                <span className="font-bold text-white">{stats.totalCommuters}</span>
                <span className="text-indigo-200 text-xs">Commuters</span>
              </div>
              <div className="flex flex-col text-right">
                <span className="font-bold text-white">{stats.totalDrivers}</span>
                <span className="text-indigo-200 text-xs">Drivers</span>
              </div>
            </div>
          </div>
        </div>

        {/* Small Card: Routes */}
        <div 
          onClick={() => onNavigate('routes')}
          className="group bg-white rounded-3xl p-6 shadow-sm hover:shadow-xl border border-gray-100 transition-all cursor-pointer flex flex-col justify-between"
        >
          <div className="flex justify-between items-start mb-4">
            <div className="h-12 w-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <MapPin size={24} />
            </div>
            <p className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg uppercase tracking-wider">Active</p>
          </div>
          <div>
            <h3 className="text-3xl font-bold text-gray-900">{stats.totalRoutes}</h3>
            <p className="text-gray-500 font-medium">Mapped Routes</p>
          </div>
        </div>

        {/* Small Card: Drivers */}
        <div 
          onClick={() => onNavigate('drivers')}
          className="group bg-white rounded-3xl p-6 shadow-sm hover:shadow-xl border border-gray-100 transition-all cursor-pointer flex flex-col justify-between"
        >
          <div className="flex justify-between items-start mb-4">
            <div className="h-12 w-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <KeySquare size={24} />
            </div>
            <p className="text-xs font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded-lg uppercase tracking-wider">Staff</p>
          </div>
          <div>
            <h3 className="text-3xl font-bold text-gray-900">{stats.totalDrivers}</h3>
            <p className="text-gray-500 font-medium">Registered Drivers</p>
          </div>
        </div>

      </div>

      {/* Live Activity: Recent Boardings */}
      {boardings.length > 0 && (
        <div className="mt-8 bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-10 w-10 bg-green-50 text-green-600 rounded-xl flex items-center justify-center">
              <CheckCircle2 size={20} />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">Live Activity</h3>
              <p className="text-sm text-gray-500">Recently boarded passengers from the mobile scanner</p>
            </div>
          </div>
          
          <div className="space-y-4">
            {boardings.map((boarding) => (
              <div key={boarding.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100 hover:bg-green-50/50 hover:border-green-100 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 bg-white shadow-sm rounded-full flex items-center justify-center text-gray-400">
                    <User size={18} />
                  </div>
                  <div>
                    <p className="font-bold text-gray-900">{boarding.passengerName}</p>
                    <p className="text-sm text-gray-500">Bus {boarding.busName} • {boarding.routeName}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="inline-block px-3 py-1 bg-green-100 text-green-700 font-bold text-sm rounded-lg">
                    Seat {boarding.seatNumber}
                  </span>
                  <p className="text-xs text-gray-400 mt-1 uppercase font-semibold">Boarded</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
