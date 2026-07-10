import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { authService } from '../services/authService';
import { TableSkeleton } from '../components/LoadingSkeleton';
import { Shield, ShieldOff } from 'lucide-react';
export default function UserManagementScreen() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [promoting, setPromoting] = useState(null);
    const [demoting, setDemoting] = useState(null);
    const [filter, setFilter] = useState('all');
    useEffect(() => {
        loadUsers();
    }, []);
    const loadUsers = async () => {
        try {
            setLoading(true);
            const { data, error: err } = await supabase
                .from('profiles')
                .select('id, full_name, role, email');
            if (err && err.message.includes('profiles.email')) {
                const { data: fallbackData, error: fallbackErr } = await supabase
                    .from('profiles')
                    .select('id, full_name, role');
                if (fallbackErr)
                    throw fallbackErr;
                setUsers(fallbackData || []);
            }
            else {
                if (err)
                    throw err;
                setUsers(data || []);
            }
            setError(null);
        }
        catch (err) {
            setError(err.message);
        }
        finally {
            setLoading(false);
        }
    };
    const handlePromoteToAdmin = async (userId) => {
        try {
            setPromoting(userId);
            const { error: err } = await authService.promoteUserToAdmin(userId);
            if (err)
                throw new Error(err);
            await loadUsers();
            setPromoting(null);
        }
        catch (err) {
            setError(err.message);
            setPromoting(null);
        }
    };
    const handleDemoteToUser = async (userId) => {
        try {
            setDemoting(userId);
            const { error: err } = await authService.demoteAdminToUser(userId);
            if (err)
                throw new Error(err);
            await loadUsers();
            setDemoting(null);
        }
        catch (err) {
            setError(err.message);
            setDemoting(null);
        }
    };
    const filteredUsers = users.filter(u => {
        if (filter === 'admin')
            return u.role === 'admin';
        if (filter === 'commuter')
            return u.role === 'commuter';
        return true;
    });
    const adminCount = users.filter(u => u.role === 'admin').length;
    const commuterCount = users.filter(u => u.role === 'commuter').length;
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { children: [_jsx("h2", { className: "text-2xl font-bold", children: "User Management" }), _jsxs("p", { className: "text-gray-600 text-sm mt-1", children: ["Total users: ", users.length, " (Admins: ", adminCount, ", Users: ", commuterCount, ")"] })] }), error && (_jsx("div", { className: "bg-red-50 border border-red-200 rounded-lg p-4", children: _jsx("p", { className: "text-red-700", children: error }) })), _jsxs("div", { className: "flex gap-2", children: [_jsxs("button", { onClick: () => setFilter('all'), className: `px-4 py-2 rounded-lg transition ${filter === 'all'
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-200 text-gray-900 hover:bg-gray-300'}`, children: ["All Users (", users.length, ")"] }), _jsxs("button", { onClick: () => setFilter('admin'), className: `px-4 py-2 rounded-lg transition ${filter === 'admin'
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-200 text-gray-900 hover:bg-gray-300'}`, children: ["Admins (", adminCount, ")"] }), _jsxs("button", { onClick: () => setFilter('commuter'), className: `px-4 py-2 rounded-lg transition ${filter === 'commuter'
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-200 text-gray-900 hover:bg-gray-300'}`, children: ["Commuters (", commuterCount, ")"] })] }), loading ? (_jsx(TableSkeleton, { columns: 5 })) : filteredUsers.length === 0 ? (_jsx("div", { className: "bg-gray-50 rounded-lg p-8 text-center", children: _jsx("p", { className: "text-gray-600", children: "No users found." }) })) : (_jsx("div", { className: "overflow-x-auto bg-white rounded-lg shadow", children: _jsxs("table", { className: "w-full", children: [_jsx("thead", { children: _jsxs("tr", { className: "bg-gray-50 border-b", children: [_jsx("th", { className: "px-6 py-3 text-left text-sm font-semibold text-gray-700", children: "Name" }), _jsx("th", { className: "px-6 py-3 text-left text-sm font-semibold text-gray-700", children: "Email" }), _jsx("th", { className: "px-6 py-3 text-left text-sm font-semibold text-gray-700", children: "Role" }), _jsx("th", { className: "px-6 py-3 text-left text-sm font-semibold text-gray-700", children: "Joined" }), _jsx("th", { className: "px-6 py-3 text-left text-sm font-semibold text-gray-700", children: "Actions" })] }) }), _jsx("tbody", { className: "divide-y", children: filteredUsers.map((user) => (_jsxs("tr", { className: "hover:bg-gray-50", children: [_jsx("td", { className: "px-6 py-4 text-sm text-gray-900 font-medium", children: user.full_name || 'N/A' }), _jsx("td", { className: "px-6 py-4 text-sm text-gray-900 font-mono", children: user.email || 'N/A' }), _jsx("td", { className: "px-6 py-4 text-sm", children: _jsx("span", { className: `px-2 py-1 rounded text-xs font-semibold ${user.role === 'admin'
                                                ? 'bg-purple-100 text-purple-800'
                                                : 'bg-gray-100 text-gray-800'}`, children: user.role.charAt(0).toUpperCase() + user.role.slice(1) }) }), _jsx("td", { className: "px-6 py-4 text-sm text-gray-600", children: "N/A" }), _jsx("td", { className: "px-6 py-4 text-sm", children: user.role === 'admin' ? (_jsxs("button", { onClick: () => handleDemoteToUser(user.id), disabled: demoting === user.id, className: "flex items-center gap-1 px-3 py-1 bg-red-50 text-red-700 hover:bg-red-100 rounded transition disabled:opacity-50", children: [_jsx(ShieldOff, { size: 14 }), demoting === user.id ? 'Demoting...' : 'Demote'] })) : (_jsxs("button", { onClick: () => handlePromoteToAdmin(user.id), disabled: promoting === user.id, className: "flex items-center gap-1 px-3 py-1 bg-purple-50 text-purple-700 hover:bg-purple-100 rounded transition disabled:opacity-50", children: [_jsx(Shield, { size: 14 }), promoting === user.id ? 'Promoting...' : 'Promote'] })) })] }, user.id))) })] }) })), _jsxs("div", { className: "bg-blue-50 border border-blue-200 rounded-lg p-4", children: [_jsx("h4", { className: "font-semibold text-blue-900 mb-2", children: "Role Management Info" }), _jsxs("ul", { className: "text-sm text-blue-800 space-y-1", children: [_jsxs("li", { children: ["\u2022 ", _jsx("strong", { children: "Admin:" }), " Can create, edit, and delete buses, routes, and manage users"] }), _jsxs("li", { children: ["\u2022 ", _jsx("strong", { children: "Commuter:" }), " Regular app user with read-only access"] }), _jsx("li", { children: "\u2022 Use the buttons above to promote commuters to admins or demote admins to users" })] })] })] }));
}
