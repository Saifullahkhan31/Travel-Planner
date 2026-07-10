import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AdminAuthProvider, useAdminAuth } from './context/AdminAuthContext';
import LoginScreen from './screens/LoginScreen';
import DashboardScreen from './screens/DashboardScreen';
function ProtectedRoute({ children }) {
    const { user, loading } = useAdminAuth();
    if (loading) {
        return (_jsx("div", { className: "flex items-center justify-center min-h-screen", children: _jsx("div", { className: "text-gray-600", children: "Loading..." }) }));
    }
    if (!user) {
        return _jsx(Navigate, { to: "/login", replace: true });
    }
    return _jsx(_Fragment, { children: children });
}
function AppRoutes() {
    const { user } = useAdminAuth();
    return (_jsxs(Routes, { children: [_jsx(Route, { path: "/login", element: !user ? _jsx(LoginScreen, {}) : _jsx(Navigate, { to: "/dashboard", replace: true }) }), _jsx(Route, { path: "/dashboard", element: _jsx(ProtectedRoute, { children: _jsx(DashboardScreen, {}) }) }), _jsx(Route, { path: "/", element: _jsx(Navigate, { to: "/dashboard", replace: true }) })] }));
}
function App() {
    return (_jsx(BrowserRouter, { children: _jsx(AdminAuthProvider, { children: _jsx(AppRoutes, {}) }) }));
}
export default App;
