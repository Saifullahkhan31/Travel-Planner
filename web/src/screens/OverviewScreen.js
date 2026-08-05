import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Bus, MapPin, Users, KeySquare, Activity, TrendingUp, CheckCircle2, User } from 'lucide-react';
export default function OverviewScreen({ onNavigate }) {
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        totalBuses: 0,
        activeBuses: 0,
        totalRoutes: 0,
        totalDrivers: 0,
        totalCommuters: 0,
        totalUsers: 0,
    });
    const [boardings, setBoardings] = useState([]);
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
            }
            catch (err) {
                console.error("Error fetching stats", err);
            }
            finally {
                setLoading(false);
            }
        }
        fetchStats();
    }, []);
    if (loading) {
        return (_jsx("div", { className: "flex justify-center items-center h-64", children: _jsxs("div", { className: "animate-pulse flex flex-col items-center", children: [_jsx("div", { className: "h-12 w-12 bg-gray-200 rounded-full mb-4" }), _jsx("div", { className: "h-4 w-24 bg-gray-200 rounded" })] }) }));
    }
    // Calculate percentages for CSS charts
    const busActivePercent = stats.totalBuses > 0 ? Math.round((stats.activeBuses / stats.totalBuses) * 100) : 0;
    const commuterPercent = stats.totalUsers > 0 ? Math.round((stats.totalCommuters / stats.totalUsers) * 100) : 0;
    return (_jsxs("div", { className: "space-y-6 animate-in fade-in duration-500", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("h2", { className: "text-2xl font-bold text-gray-900 tracking-tight", children: "Dashboard Overview" }), _jsx("p", { className: "text-gray-500 mt-1", children: "High-level view of the SmartBusPlanner ecosystem." })] }), _jsxs("div", { className: "flex items-center gap-2 px-3 py-1.5 bg-green-50 text-green-700 rounded-full text-sm font-medium border border-green-100", children: [_jsx(Activity, { size: 16 }), "System Operational"] })] }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-6", children: [_jsxs("div", { onClick: () => onNavigate('buses'), className: "md:col-span-2 group relative bg-white rounded-3xl p-6 md:p-8 shadow-sm hover:shadow-xl border border-gray-100 transition-all cursor-pointer overflow-hidden", children: [_jsx("div", { className: "absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity", children: _jsx(Bus, { size: 120 }) }), _jsxs("div", { className: "flex justify-between items-start mb-8 relative z-10", children: [_jsxs("div", { children: [_jsx("p", { className: "text-sm font-semibold text-blue-600 uppercase tracking-wider mb-1", children: "Fleet Management" }), _jsxs("h3", { className: "text-3xl font-bold text-gray-900", children: [stats.totalBuses, " Buses"] })] }), _jsx("div", { className: "h-12 w-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform", children: _jsx(Bus, { size: 24 }) })] }), _jsxs("div", { className: "relative z-10", children: [_jsxs("div", { className: "flex justify-between text-sm mb-2", children: [_jsx("span", { className: "font-medium text-gray-700", children: "System Capacity Utilization" }), _jsxs("span", { className: "font-bold text-gray-900", children: [busActivePercent, "% Active"] })] }), _jsxs("div", { className: "w-full bg-gray-100 rounded-full h-3 overflow-hidden flex", children: [_jsx("div", { className: "bg-blue-600 h-full transition-all duration-1000 ease-out relative overflow-hidden", style: { width: `${busActivePercent}%` }, children: _jsx("div", { className: "absolute inset-0 bg-white/20 w-full animate-[shimmer_2s_infinite]" }) }), _jsx("div", { className: "bg-gray-300 h-full transition-all duration-1000 ease-out", style: { width: `${100 - busActivePercent}%` } })] }), _jsxs("div", { className: "flex gap-4 mt-4 text-sm", children: [_jsxs("div", { className: "flex items-center gap-1.5", children: [_jsx("div", { className: "w-3 h-3 rounded-full bg-blue-600" }), _jsxs("span", { className: "text-gray-600", children: [stats.activeBuses, " Active"] })] }), _jsxs("div", { className: "flex items-center gap-1.5", children: [_jsx("div", { className: "w-3 h-3 rounded-full bg-gray-300" }), _jsxs("span", { className: "text-gray-600", children: [stats.totalBuses - stats.activeBuses, " Inactive"] })] })] })] })] }), _jsxs("div", { onClick: () => onNavigate('users'), className: "md:row-span-2 group bg-gradient-to-br from-indigo-600 via-purple-600 to-indigo-800 rounded-3xl p-6 md:p-8 shadow-sm hover:shadow-xl text-white transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between", children: [_jsx("div", { className: "absolute -bottom-10 -right-10 opacity-10 group-hover:scale-110 transition-transform", children: _jsx(Users, { size: 200 }) }), _jsx("div", { className: "relative z-10", children: _jsxs("div", { className: "flex justify-between items-start mb-6", children: [_jsxs("div", { children: [_jsx("p", { className: "text-sm font-semibold text-indigo-200 uppercase tracking-wider mb-1", children: "Network Base" }), _jsx("h3", { className: "text-3xl font-bold", children: stats.totalUsers }), _jsx("p", { className: "text-indigo-100", children: "Total Users" })] }), _jsx("div", { className: "h-12 w-12 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-sm group-hover:bg-white/20 transition-colors", children: _jsx(Users, { size: 24 }) })] }) }), _jsxs("div", { className: "relative z-10 mt-12 bg-white/10 rounded-2xl p-5 backdrop-blur-sm", children: [_jsxs("h4", { className: "text-sm font-medium text-indigo-100 mb-4 flex items-center gap-2", children: [_jsx(TrendingUp, { size: 16 }), " User Distribution"] }), _jsxs("div", { className: "flex h-12 rounded-xl overflow-hidden mb-3", children: [_jsx("div", { className: "bg-white flex items-center justify-center font-bold text-indigo-600 text-sm transition-all duration-1000", style: { width: `${commuterPercent}%` }, children: commuterPercent > 15 ? `${commuterPercent}%` : '' }), _jsx("div", { className: "bg-purple-400 flex items-center justify-center font-bold text-white text-sm transition-all duration-1000", style: { width: `${100 - commuterPercent}%` }, children: 100 - commuterPercent > 15 ? `${100 - commuterPercent}%` : '' })] }), _jsxs("div", { className: "flex justify-between text-sm mt-3", children: [_jsxs("div", { className: "flex flex-col", children: [_jsx("span", { className: "font-bold text-white", children: stats.totalCommuters }), _jsx("span", { className: "text-indigo-200 text-xs", children: "Commuters" })] }), _jsxs("div", { className: "flex flex-col text-right", children: [_jsx("span", { className: "font-bold text-white", children: stats.totalDrivers }), _jsx("span", { className: "text-indigo-200 text-xs", children: "Drivers" })] })] })] })] }), _jsxs("div", { onClick: () => onNavigate('routes'), className: "group bg-white rounded-3xl p-6 shadow-sm hover:shadow-xl border border-gray-100 transition-all cursor-pointer flex flex-col justify-between", children: [_jsxs("div", { className: "flex justify-between items-start mb-4", children: [_jsx("div", { className: "h-12 w-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform", children: _jsx(MapPin, { size: 24 }) }), _jsx("p", { className: "text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg uppercase tracking-wider", children: "Active" })] }), _jsxs("div", { children: [_jsx("h3", { className: "text-3xl font-bold text-gray-900", children: stats.totalRoutes }), _jsx("p", { className: "text-gray-500 font-medium", children: "Mapped Routes" })] })] }), _jsxs("div", { onClick: () => onNavigate('drivers'), className: "group bg-white rounded-3xl p-6 shadow-sm hover:shadow-xl border border-gray-100 transition-all cursor-pointer flex flex-col justify-between", children: [_jsxs("div", { className: "flex justify-between items-start mb-4", children: [_jsx("div", { className: "h-12 w-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform", children: _jsx(KeySquare, { size: 24 }) }), _jsx("p", { className: "text-xs font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded-lg uppercase tracking-wider", children: "Staff" })] }), _jsxs("div", { children: [_jsx("h3", { className: "text-3xl font-bold text-gray-900", children: stats.totalDrivers }), _jsx("p", { className: "text-gray-500 font-medium", children: "Registered Drivers" })] })] })] }), boardings.length > 0 && (_jsxs("div", { className: "mt-8 bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-gray-100", children: [_jsxs("div", { className: "flex items-center gap-3 mb-6", children: [_jsx("div", { className: "h-10 w-10 bg-green-50 text-green-600 rounded-xl flex items-center justify-center", children: _jsx(CheckCircle2, { size: 20 }) }), _jsxs("div", { children: [_jsx("h3", { className: "text-xl font-bold text-gray-900", children: "Live Activity" }), _jsx("p", { className: "text-sm text-gray-500", children: "Recently boarded passengers from the mobile scanner" })] })] }), _jsx("div", { className: "space-y-4", children: boardings.map((boarding) => (_jsxs("div", { className: "flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100 hover:bg-green-50/50 hover:border-green-100 transition-colors", children: [_jsxs("div", { className: "flex items-center gap-4", children: [_jsx("div", { className: "h-10 w-10 bg-white shadow-sm rounded-full flex items-center justify-center text-gray-400", children: _jsx(User, { size: 18 }) }), _jsxs("div", { children: [_jsx("p", { className: "font-bold text-gray-900", children: boarding.passengerName }), _jsxs("p", { className: "text-sm text-gray-500", children: ["Bus ", boarding.busName, " \u2022 ", boarding.routeName] })] })] }), _jsxs("div", { className: "text-right", children: [_jsxs("span", { className: "inline-block px-3 py-1 bg-green-100 text-green-700 font-bold text-sm rounded-lg", children: ["Seat ", boarding.seatNumber] }), _jsx("p", { className: "text-xs text-gray-400 mt-1 uppercase font-semibold", children: "Boarded" })] })] }, boarding.id))) })] }))] }));
}
