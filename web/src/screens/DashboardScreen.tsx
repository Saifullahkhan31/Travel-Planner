import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdminAuth } from '../context/AdminAuthContext';
import BusManagementScreen from './BusManagementScreen';
import RouteManagementScreen from './RouteManagementScreen';
import UserManagementScreen from './UserManagementScreen';
import { LogOut, Bus, MapPin, Users } from 'lucide-react';

export default function DashboardScreen() {
  const navigate = useNavigate();
  const { user, logout } = useAdminAuth();
  const [activeTab, setActiveTab] = useState<'buses' | 'routes' | 'users'>('buses');
  const [visitedTabs, setVisitedTabs] = useState({ buses: true, routes: false, users: false });

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const handleTabChange = (tab: 'buses' | 'routes' | 'users') => {
    setActiveTab(tab);
    setVisitedTabs(prev => ({ ...prev, [tab]: true }));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">SmartBusPlanner Admin</h1>
            <p className="text-sm text-gray-600 mt-1">Welcome, {user?.name}</p>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-700 hover:bg-red-100 rounded-lg transition"
          >
            <LogOut size={18} />
            Logout
          </button>
        </div>
      </header>

      {/* Tabs */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-8">
            <button
              onClick={() => handleTabChange('buses')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition ${
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
              className={`py-4 px-1 border-b-2 font-medium text-sm transition ${
                activeTab === 'routes'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              <MapPin className="inline mr-2" size={18} />
              Routes
            </button>
            <button
              onClick={() => handleTabChange('users')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition ${
                activeTab === 'users'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              <Users className="inline mr-2" size={18} />
              Users
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
        {visitedTabs.users && (
          <div className={activeTab === 'users' ? 'block' : 'hidden'}>
            <UserManagementScreen />
          </div>
        )}
      </div>
    </div>
  );
}
