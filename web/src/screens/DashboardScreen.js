import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
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
    const [activeTab, setActiveTab] = useState('buses');
    const [visitedTabs, setVisitedTabs] = useState({ buses: true, routes: false, users: false });
    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };
    const handleTabChange = (tab) => {
        setActiveTab(tab);
        setVisitedTabs(prev => ({ ...prev, [tab]: true }));
    };
    return (_jsxs("div", { className: "min-h-screen bg-gray-50", children: [_jsx("header", { className: "bg-white shadow", children: _jsxs("div", { className: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-2xl font-bold text-gray-900", children: "SmartBusPlanner Admin" }), _jsxs("p", { className: "text-sm text-gray-600 mt-1", children: ["Welcome, ", user?.name] })] }), _jsxs("button", { onClick: handleLogout, className: "flex items-center gap-2 px-4 py-2 bg-red-50 text-red-700 hover:bg-red-100 rounded-lg transition", children: [_jsx(LogOut, { size: 18 }), "Logout"] })] }) }), _jsx("div", { className: "bg-white border-b", children: _jsx("div", { className: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8", children: _jsxs("div", { className: "flex gap-8", children: [_jsxs("button", { onClick: () => handleTabChange('buses'), className: `py-4 px-1 border-b-2 font-medium text-sm transition ${activeTab === 'buses'
                                    ? 'border-blue-500 text-blue-600'
                                    : 'border-transparent text-gray-600 hover:text-gray-900'}`, children: [_jsx(Bus, { className: "inline mr-2", size: 18 }), "Buses"] }), _jsxs("button", { onClick: () => handleTabChange('routes'), className: `py-4 px-1 border-b-2 font-medium text-sm transition ${activeTab === 'routes'
                                    ? 'border-blue-500 text-blue-600'
                                    : 'border-transparent text-gray-600 hover:text-gray-900'}`, children: [_jsx(MapPin, { className: "inline mr-2", size: 18 }), "Routes"] }), _jsxs("button", { onClick: () => handleTabChange('users'), className: `py-4 px-1 border-b-2 font-medium text-sm transition ${activeTab === 'users'
                                    ? 'border-blue-500 text-blue-600'
                                    : 'border-transparent text-gray-600 hover:text-gray-900'}`, children: [_jsx(Users, { className: "inline mr-2", size: 18 }), "Users"] })] }) }) }), _jsxs("div", { className: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8", children: [visitedTabs.buses && (_jsx("div", { className: activeTab === 'buses' ? 'block' : 'hidden', children: _jsx(BusManagementScreen, {}) })), visitedTabs.routes && (_jsx("div", { className: activeTab === 'routes' ? 'block' : 'hidden', children: _jsx(RouteManagementScreen, {}) })), visitedTabs.users && (_jsx("div", { className: activeTab === 'users' ? 'block' : 'hidden', children: _jsx(UserManagementScreen, {}) }))] })] }));
}
