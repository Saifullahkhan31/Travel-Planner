import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { useAdminAuth } from '../context/AdminAuthContext';
export default function LoginScreen() {
    const { login, error: authError, loading } = useAdminAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        if (!email.trim()) {
            setError('Email is required');
            return;
        }
        if (!password.trim()) {
            setError('Password is required');
            return;
        }
        await login(email, password);
    };
    return (_jsx("div", { className: "min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4", children: _jsxs("div", { className: "bg-white rounded-lg shadow-xl p-8 w-full max-w-md", children: [_jsx("h1", { className: "text-3xl font-bold text-gray-900 mb-2", children: "SmartBusPlanner" }), _jsx("p", { className: "text-gray-600 mb-8", children: "Admin Dashboard" }), (error || authError) && (_jsx("div", { className: "bg-red-50 border border-red-200 rounded-lg p-4 mb-6", children: _jsx("p", { className: "text-red-700 text-sm", children: error || authError }) })), _jsxs("form", { onSubmit: handleLogin, className: "space-y-4", children: [_jsxs("div", { children: [_jsx("label", { htmlFor: "email", className: "block text-sm font-medium text-gray-700 mb-1", children: "Email" }), _jsx("input", { id: "email", type: "email", value: email, onChange: (e) => setEmail(e.target.value), placeholder: "admin@example.com", className: "w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500", disabled: loading })] }), _jsxs("div", { children: [_jsx("label", { htmlFor: "password", className: "block text-sm font-medium text-gray-700 mb-1", children: "Password" }), _jsx("input", { id: "password", type: "password", value: password, onChange: (e) => setPassword(e.target.value), placeholder: "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022", className: "w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500", disabled: loading })] }), _jsx("button", { type: "submit", disabled: loading, className: "w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed", children: loading ? 'Logging in...' : 'Login' })] }), _jsx("p", { className: "text-center text-gray-600 text-xs mt-6", children: "Admin access only. Contact system administrator for credentials." })] }) }));
}
