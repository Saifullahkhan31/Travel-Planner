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
  const [activeTab, setActiveTab] = useState<'overview' | 'buses' | 'routes' | 'drivers' | 'users'>('overview');
  const [visitedTabs, setVisitedTabs] = useState({ overview: true, buses: false, routes: false, drivers: false, users: false });
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [liveAlerts, setLiveAlerts] = useState<any[]>([]);

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
      
      if (data) setLiveAlerts(data);
    };

    fetchActiveAlerts();

    // Subscribe to real-time inserts
    const channel = supabase
      .channel('driver-alerts-channel')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'driver_alerts' },
        async (payload) => {
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
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'driver_alerts' },
        (payload) => {
          if (payload.new.status === 'resolved') {
            setLiveAlerts(prev => prev.filter(alert => alert.id !== payload.new.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const dismissAlert = async (id: string) => {
    // Optimistically remove from UI
    setLiveAlerts(prev => prev.filter(alert => alert.id !== id));
    // Update DB
    await supabase.from('driver_alerts').update({ status: 'resolved' }).eq('id', id);
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const handleTabChange = (tab: 'overview' | 'buses' | 'routes' | 'drivers' | 'users') => {
    setActiveTab(tab);
    setVisitedTabs(prev => ({ ...prev, [tab]: true }));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center gap-4">
          <button 
            onClick={() => handleTabChange('overview')}
            className="focus:outline-none hover:opacity-80 transition-opacity rounded-xl"
          >
            <img src="/logo.png" alt="Logo" className="w-16 h-16 rounded-xl object-contain" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">SmartBusPlanner Admin</h1>
            <p className="text-sm text-gray-600 mt-1">Welcome, {user?.name}</p>
          </div>
        </div>
      </header>

      {/* Floating Alerts Container */}
      <div className="fixed top-20 right-4 z-50 flex flex-col gap-3 max-w-sm w-full pointer-events-none">
        {liveAlerts.map(alert => (
          <div key={alert.id} className="pointer-events-auto bg-white rounded-lg shadow-xl border-l-4 border-red-500 overflow-hidden animate-in slide-in-from-right-8 fade-in duration-300">
            <div className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <div className={`p-2 rounded-full ${alert.alert_type === 'dispatch' ? 'bg-red-100 text-red-600' : 'bg-orange-100 text-orange-600'}`}>
                    {alert.alert_type === 'dispatch' ? <AlertTriangle size={18} /> : <Bell size={18} />}
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 capitalize">
                      {alert.alert_type === 'dispatch' ? 'Emergency Dispatch' : 'Route Delay'}
                    </h3>
                    <p className="text-xs text-gray-500">
                      {new Date(alert.created_at).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
                <button onClick={() => dismissAlert(alert.id)} className="text-gray-400 hover:text-gray-600">
                  &times;
                </button>
              </div>
              <div className="mt-3 text-sm text-gray-700">
                <p><strong>Bus:</strong> {alert.buses?.plate_number} • <strong>Route:</strong> {alert.routes?.route_name}</p>
                <p><strong>Driver:</strong> {alert.profiles?.full_name}</p>
                <div className="mt-2 p-2 bg-gray-50 rounded border border-gray-100">
                  <p className="font-medium">{alert.reason}</p>
                  {alert.duration && <p className="text-xs text-gray-600 mt-1">Duration: {alert.duration}</p>}
                  {alert.details && <p className="text-xs text-gray-600 mt-1 italic">"{alert.details}"</p>}
                </div>
              </div>
              <div className="mt-3 flex justify-end">
                <button 
                  onClick={() => dismissAlert(alert.id)}
                  className="text-xs font-medium text-blue-600 hover:text-blue-800 bg-blue-50 px-3 py-1 rounded"
                >
                  Mark as Resolved
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <div className="flex gap-8 overflow-x-auto">
            <button
              onClick={() => handleTabChange('overview')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition whitespace-nowrap ${
                activeTab === 'overview'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              <LayoutDashboard className="inline mr-2" size={18} />
              Overview
            </button>
            <button
              onClick={() => handleTabChange('buses')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition whitespace-nowrap ${
                activeTab === 'buses'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              <Bus className="inline mr-2" size={18} />
              Buses
            </button>
            <button
              onClick={() => handleTabChange('routes')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition whitespace-nowrap ${
                activeTab === 'routes'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              <MapPin className="inline mr-2" size={18} />
              Routes
            </button>
            <button
              onClick={() => handleTabChange('drivers')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition whitespace-nowrap ${
                activeTab === 'drivers'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              <KeySquare className="inline mr-2" size={18} />
              Drivers
            </button>
            <button
              onClick={() => handleTabChange('users')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition whitespace-nowrap ${
                activeTab === 'users'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              <Users className="inline mr-2" size={18} />
              Users
            </button>
          </div>
          
          <button
            onClick={() => setShowLogoutConfirm(true)}
            className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 rounded-md transition whitespace-nowrap"
          >
            <LogOut size={16} />
            Logout
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {visitedTabs.overview && (
          <div className={activeTab === 'overview' ? 'block' : 'hidden'}>
            <OverviewScreen onNavigate={handleTabChange} />
          </div>
        )}
        {visitedTabs.buses && (
          <div className={activeTab === 'buses' ? 'block' : 'hidden'}>
            <BusManagementScreen />
          </div>
        )}
        {visitedTabs.routes && (
          <div className={activeTab === 'routes' ? 'block' : 'hidden'}>
            <RouteManagementScreen />
          </div>
        )}
        {visitedTabs.drivers && (
          <div className={activeTab === 'drivers' ? 'block' : 'hidden'}>
            <DriverManagementScreen />
          </div>
        )}
        {visitedTabs.users && (
          <div className={activeTab === 'users' ? 'block' : 'hidden'}>
            <UserManagementScreen />
          </div>
        )}
      </div>

      {showLogoutConfirm && createPortal(
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden p-6 text-center">
            <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 bg-red-100 text-red-600">
              <LogOut size={32} />
            </div>
            
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              Ready to leave?
            </h2>
            
            <p className="text-gray-600 mb-6">
              You are about to securely log out of the SmartBusPlanner admin panel.
            </p>
            
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="px-6 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg font-medium transition"
              >
                Cancel
              </button>
              <button
                onClick={handleLogout}
                className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition"
              >
                Yes, Logout
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
