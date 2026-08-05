import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { useAdminAuth } from '../context/AdminAuthContext';
import BusManagementScreen from './BusManagementScreen';
import RouteManagementScreen from './RouteManagementScreen';
import DriverManagementScreen from './DriverManagementScreen';
import UserManagementScreen from './UserManagementScreen';
import OverviewScreen from './OverviewScreen';
import { LogOut, Bus, MapPin, Users, KeySquare, LayoutDashboard, Bell, AlertTriangle } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
export default function DashboardScreen() {
    const navigate = useNavigate();
    const { user, logout } = useAdminAuth();
    const [activeTab, setActiveTab] = useState('overview');
    const [visitedTabs, setVisitedTabs] = useState({ overview: true, buses: false, routes: false, drivers: false, users: false });
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
    const [liveAlerts, setLiveAlerts] = useState([]);
    useEffect(() => {
        // Fetch initial active alerts
        const fetchActiveAlerts = async () => {
            const { data } = await supabase
                .from('driver_alerts')
                .select(`
          id, alert_type, reason, duration, details, created_at,
          buses(plate_number), routes(route_name), profiles(full_name)
        `)
                .eq('status', 'active')
                .order('created_at', { ascending: false });
            if (data)
                setLiveAlerts(data);
        };
        fetchActiveAlerts();
        // Subscribe to real-time inserts
        const channel = supabase
            .channel('driver-alerts-channel')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'driver_alerts' }, async (payload) => {
            // Fetch the full details with joins for the new alert
            const { data } = await supabase
                .from('driver_alerts')
                .select(`
              id, alert_type, reason, duration, details, created_at,
              buses(plate_number), routes(route_name), profiles(full_name)
            `)
                .eq('id', payload.new.id)
                .single();
            if (data) {
                setLiveAlerts(prev => [data, ...prev]);
            }
        })
            .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'driver_alerts' }, (payload) => {
            if (payload.new.status === 'resolved') {
                setLiveAlerts(prev => prev.filter(alert => alert.id !== payload.new.id));
            }
        })
            .subscribe();
        return () => {
            supabase.removeChannel(channel);
        };
    }, []);
    const dismissAlert = async (id) => {
        // Optimistically remove from UI
        setLiveAlerts(prev => prev.filter(alert => alert.id !== id));
        // Update DB
        await supabase.from('driver_alerts').update({ status: 'resolved' }).eq('id', id);
    };
    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };
    const handleTabChange = (tab) => {
        setActiveTab(tab);
        setVisitedTabs(prev => ({ ...prev, [tab]: true }));
    };
    return (_jsxs("div", { className: "min-h-screen bg-gray-50", children: [_jsx("header", { className: "bg-white shadow", children: _jsxs("div", { className: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center gap-4", children: [_jsx("button", { onClick: () => handleTabChange('overview'), className: "focus:outline-none hover:opacity-80 transition-opacity rounded-xl", children: _jsx("img", { src: "/logo.png", alt: "Logo", className: "w-16 h-16 rounded-xl object-contain" }) }), _jsxs("div", { children: [_jsx("h1", { className: "text-2xl font-bold text-gray-900", children: "SmartBusPlanner Admin" }), _jsxs("p", { className: "text-sm text-gray-600 mt-1", children: ["Welcome, ", user?.name] })] })] }) }), _jsx("div", { className: "fixed top-20 right-4 z-50 flex flex-col gap-3 max-w-sm w-full pointer-events-none", children: liveAlerts.map(alert => (_jsx("div", { className: "pointer-events-auto bg-white rounded-lg shadow-xl border-l-4 border-red-500 overflow-hidden animate-in slide-in-from-right-8 fade-in duration-300", children: _jsxs("div", { className: "p-4", children: [_jsxs("div", { className: "flex items-start justify-between", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("div", { className: `p-2 rounded-full ${alert.alert_type === 'dispatch' ? 'bg-red-100 text-red-600' : 'bg-orange-100 text-orange-600'}`, children: alert.alert_type === 'dispatch' ? _jsx(AlertTriangle, { size: 18 }) : _jsx(Bell, { size: 18 }) }), _jsxs("div", { children: [_jsx("h3", { className: "font-bold text-gray-900 capitalize", children: alert.alert_type === 'dispatch' ? 'Emergency Dispatch' : 'Route Delay' }), _jsx("p", { className: "text-xs text-gray-500", children: new Date(alert.created_at).toLocaleTimeString() })] })] }), _jsx("button", { onClick: () => dismissAlert(alert.id), className: "text-gray-400 hover:text-gray-600", children: "\u00D7" })] }), _jsxs("div", { className: "mt-3 text-sm text-gray-700", children: [_jsxs("p", { children: [_jsx("strong", { children: "Bus:" }), " ", alert.buses?.plate_number, " \u2022 ", _jsx("strong", { children: "Route:" }), " ", alert.routes?.route_name] }), _jsxs("p", { children: [_jsx("strong", { children: "Driver:" }), " ", alert.profiles?.full_name] }), _jsxs("div", { className: "mt-2 p-2 bg-gray-50 rounded border border-gray-100", children: [_jsx("p", { className: "font-medium", children: alert.reason }), alert.duration && _jsxs("p", { className: "text-xs text-gray-600 mt-1", children: ["Duration: ", alert.duration] }), alert.details && _jsxs("p", { className: "text-xs text-gray-600 mt-1 italic", children: ["\"", alert.details, "\""] })] })] }), _jsx("div", { className: "mt-3 flex justify-end", children: _jsx("button", { onClick: () => dismissAlert(alert.id), className: "text-xs font-medium text-blue-600 hover:text-blue-800 bg-blue-50 px-3 py-1 rounded", children: "Mark as Resolved" }) })] }) }, alert.id))) }), _jsx("div", { className: "bg-white border-b", children: _jsxs("div", { className: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center", children: [_jsxs("div", { className: "flex gap-8 overflow-x-auto", children: [_jsxs("button", { onClick: () => handleTabChange('overview'), className: `py-4 px-1 border-b-2 font-medium text-sm transition whitespace-nowrap ${activeTab === 'overview'
                                        ? 'border-blue-500 text-blue-600'
                                        : 'border-transparent text-gray-600 hover:text-gray-900'}`, children: [_jsx(LayoutDashboard, { className: "inline mr-2", size: 18 }), "Overview"] }), _jsxs("button", { onClick: () => handleTabChange('buses'), className: `py-4 px-1 border-b-2 font-medium text-sm transition whitespace-nowrap ${activeTab === 'buses'
                                        ? 'border-blue-500 text-blue-600'
                                        : 'border-transparent text-gray-600 hover:text-gray-900'}`, children: [_jsx(Bus, { className: "inline mr-2", size: 18 }), "Buses"] }), _jsxs("button", { onClick: () => handleTabChange('routes'), className: `py-4 px-1 border-b-2 font-medium text-sm transition whitespace-nowrap ${activeTab === 'routes'
                                        ? 'border-blue-500 text-blue-600'
                                        : 'border-transparent text-gray-600 hover:text-gray-900'}`, children: [_jsx(MapPin, { className: "inline mr-2", size: 18 }), "Routes"] }), _jsxs("button", { onClick: () => handleTabChange('drivers'), className: `py-4 px-1 border-b-2 font-medium text-sm transition whitespace-nowrap ${activeTab === 'drivers'
                                        ? 'border-blue-500 text-blue-600'
                                        : 'border-transparent text-gray-600 hover:text-gray-900'}`, children: [_jsx(KeySquare, { className: "inline mr-2", size: 18 }), "Drivers"] }), _jsxs("button", { onClick: () => handleTabChange('users'), className: `py-4 px-1 border-b-2 font-medium text-sm transition whitespace-nowrap ${activeTab === 'users'
                                        ? 'border-blue-500 text-blue-600'
                                        : 'border-transparent text-gray-600 hover:text-gray-900'}`, children: [_jsx(Users, { className: "inline mr-2", size: 18 }), "Users"] })] }), _jsxs("button", { onClick: () => setShowLogoutConfirm(true), className: "flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 rounded-md transition whitespace-nowrap", children: [_jsx(LogOut, { size: 16 }), "Logout"] })] }) }), _jsxs("div", { className: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8", children: [visitedTabs.overview && (_jsx("div", { className: activeTab === 'overview' ? 'block' : 'hidden', children: _jsx(OverviewScreen, { onNavigate: handleTabChange }) })), visitedTabs.buses && (_jsx("div", { className: activeTab === 'buses' ? 'block' : 'hidden', children: _jsx(BusManagementScreen, {}) })), visitedTabs.routes && (_jsx("div", { className: activeTab === 'routes' ? 'block' : 'hidden', children: _jsx(RouteManagementScreen, {}) })), visitedTabs.drivers && (_jsx("div", { className: activeTab === 'drivers' ? 'block' : 'hidden', children: _jsx(DriverManagementScreen, {}) })), visitedTabs.users && (_jsx("div", { className: activeTab === 'users' ? 'block' : 'hidden', children: _jsx(UserManagementScreen, {}) }))] }), showLogoutConfirm && createPortal(_jsx("div", { className: "fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4", children: _jsxs("div", { className: "bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden p-6 text-center", children: [_jsx("div", { className: "w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 bg-red-100 text-red-600", children: _jsx(LogOut, { size: 32 }) }), _jsx("h2", { className: "text-xl font-bold text-gray-900 mb-2", children: "Ready to leave?" }), _jsx("p", { className: "text-gray-600 mb-6", children: "You are about to securely log out of the SmartBusPlanner admin panel." }), _jsxs("div", { className: "flex gap-3 justify-center", children: [_jsx("button", { onClick: () => setShowLogoutConfirm(false), className: "px-6 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg font-medium transition", children: "Cancel" }), _jsx("button", { onClick: handleLogout, className: "px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition", children: "Yes, Logout" })] })] }) }), document.body)] }));
}
