import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
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
    const [confirmDialog, setConfirmDialog] = useState(null);
    useEffect(() => {
        loadUsers();
    }, []);
    const loadUsers = async () => {
        try {
            setLoading(true);
            const { data, error: err } = await supabase
                .from('profiles')
                .select('id, full_name, role, email, updated_at');
            if (err && err.message.includes('profiles.email')) {
                const { data: fallbackData, error: fallbackErr } = await supabase
                    .from('profiles')
                    .select('id, full_name, role, updated_at');
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
            setConfirmDialog(null);
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
            setConfirmDialog(null);
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
        if (filter === 'driver')
            return u.role === 'driver' || u.role === 'inactive_driver';
        return true;
    });
    const adminCount = users.filter(u => u.role === 'admin').length;
    const commuterCount = users.filter(u => u.role === 'commuter').length;
    const driverCount = users.filter(u => u.role === 'driver' || u.role === 'inactive_driver').length;
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { children: [_jsx("h2", { className: "text-2xl font-bold", children: "User Management" }), _jsxs("p", { className: "text-gray-600 text-sm mt-1", children: ["Total users: ", users.length, " (Admins: ", adminCount, ", Users: ", commuterCount, ")"] })] }), error && (_jsx("div", { className: "bg-red-50 border border-red-200 rounded-lg p-4", children: _jsx("p", { className: "text-red-700", children: error }) })), _jsxs("div", { className: "flex gap-2", children: [_jsxs("button", { onClick: () => setFilter('all'), className: `px-4 py-2 font-medium text-sm border-b-2 transition-colors ${filter === 'all'
                            ? 'border-blue-600 text-blue-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`, children: ["All Users (", users.length, ")"] }), _jsxs("button", { onClick: () => setFilter('admin'), className: `px-4 py-2 font-medium text-sm border-b-2 transition-colors ${filter === 'admin'
                            ? 'border-blue-600 text-blue-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`, children: ["Admins (", adminCount, ")"] }), _jsxs("button", { onClick: () => setFilter('commuter'), className: `px-4 py-2 font-medium text-sm border-b-2 transition-colors ${filter === 'commuter'
                            ? 'border-blue-600 text-blue-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`, children: ["Commuters (", commuterCount, ")"] }), _jsxs("button", { onClick: () => setFilter('driver'), className: `px-4 py-2 font-medium text-sm border-b-2 transition-colors ${filter === 'driver'
                            ? 'border-blue-600 text-blue-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`, children: ["Drivers (", driverCount, ")"] })] }), loading ? (_jsx(TableSkeleton, { columns: 5 })) : filteredUsers.length === 0 ? (_jsx("div", { className: "bg-gray-50 rounded-lg p-8 text-center", children: _jsx("p", { className: "text-gray-600", children: "No users found." }) })) : (_jsx("div", { className: "overflow-x-auto bg-white rounded-lg shadow", children: _jsxs("table", { className: "w-full", children: [_jsx("thead", { children: _jsxs("tr", { className: "bg-gray-50 border-b", children: [_jsx("th", { className: "px-6 py-3 text-left text-sm font-semibold text-gray-700", children: "Name" }), _jsx("th", { className: "px-6 py-3 text-left text-sm font-semibold text-gray-700", children: "Email" }), _jsx("th", { className: "px-6 py-3 text-left text-sm font-semibold text-gray-700", children: "Role" }), _jsx("th", { className: "px-6 py-3 text-left text-sm font-semibold text-gray-700", children: "Joined" }), _jsx("th", { className: "px-6 py-3 text-left text-sm font-semibold text-gray-700", children: "Actions" })] }) }), _jsx("tbody", { className: "divide-y", children: filteredUsers.map((user) => (_jsxs("tr", { className: "hover:bg-gray-50", children: [_jsx("td", { className: "px-6 py-4 text-sm text-gray-900 font-medium", children: user.full_name || 'N/A' }), _jsx("td", { className: "px-6 py-4 text-sm text-gray-900 font-mono", children: user.email || 'N/A' }), _jsxs("td", { className: "px-6 py-4 whitespace-nowrap", children: [user.role === 'admin' && (_jsx("span", { className: "px-2 py-1 bg-purple-100 text-purple-800 rounded text-xs font-semibold", children: "Admin" })), user.role === 'commuter' && (_jsx("span", { className: "px-2 py-1 bg-gray-100 text-gray-800 rounded text-xs font-semibold", children: "Commuter" })), (user.role === 'driver' || user.role === 'inactive_driver') && (_jsx("span", { className: "px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-semibold", children: "Driver" }))] }), _jsx("td", { className: "px-6 py-4 whitespace-nowrap", children: _jsx("div", { className: "text-sm text-gray-500", children: user.updated_at ? new Date(user.updated_at).toLocaleDateString() : 'N/A' }) }), _jsx("td", { className: "px-6 py-4 text-sm", children: user.role === 'admin' ? (_jsxs("button", { onClick: () => setConfirmDialog({ type: 'demote', userId: user.id, userName: user.full_name }), disabled: demoting === user.id || promoting === user.id, className: "inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-700 hover:bg-red-100 rounded-md font-medium transition disabled:opacity-50", children: [_jsx(ShieldOff, { size: 16 }), demoting === user.id ? 'Demoting...' : 'Demote'] })) : (_jsxs("button", { onClick: () => setConfirmDialog({ type: 'promote', userId: user.id, userName: user.full_name }), disabled: promoting === user.id || demoting === user.id, className: "inline-flex items-center gap-1.5 px-3 py-1.5 bg-purple-50 text-purple-700 hover:bg-purple-100 rounded-md font-medium transition disabled:opacity-50", children: [_jsx(Shield, { size: 16 }), promoting === user.id ? 'Promoting...' : 'Promote'] })) })] }, user.id))) })] }) })), _jsxs("div", { className: "bg-blue-50 border border-blue-200 rounded-lg p-4", children: [_jsx("h4", { className: "font-semibold text-blue-900 mb-2", children: "Role Management Info" }), _jsxs("ul", { className: "text-sm text-blue-800 space-y-1", children: [_jsxs("li", { children: ["\u2022 ", _jsx("strong", { children: "Admin:" }), " Can create, edit, and delete buses, routes, and manage users"] }), _jsxs("li", { children: ["\u2022 ", _jsx("strong", { children: "Commuter:" }), " Regular app user with read-only access"] }), _jsx("li", { children: "\u2022 Use the buttons above to promote users to admins or demote admins to users" })] })] }), confirmDialog && createPortal(_jsx("div", { className: "fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4", children: _jsxs("div", { className: "bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden p-6 text-center", children: [_jsx("div", { className: `w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${confirmDialog.type === 'promote' ? 'bg-purple-100 text-purple-600' : 'bg-red-100 text-red-600'}`, children: confirmDialog.type === 'promote' ? _jsx(Shield, { size: 32 }) : _jsx(ShieldOff, { size: 32 }) }), _jsx("h2", { className: "text-xl font-bold text-gray-900 mb-2", children: confirmDialog.type === 'promote' ? 'Promote User?' : 'Demote Admin?' }), _jsx("p", { className: "text-gray-600 mb-6", children: confirmDialog.type === 'promote'
                                ? `You are about to grant full admin privileges to ${confirmDialog.userName}. They will have complete access to the web panel. Are you sure?`
                                : `You are about to revoke admin privileges from ${confirmDialog.userName}. They will be demoted to a regular user. Are you sure?` }), _jsxs("div", { className: "flex gap-3 justify-center", children: [_jsx("button", { onClick: () => setConfirmDialog(null), className: "px-6 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg font-medium transition", children: "Cancel" }), _jsx("button", { onClick: () => confirmDialog.type === 'promote' ? handlePromoteToAdmin(confirmDialog.userId) : handleDemoteToUser(confirmDialog.userId), className: `px-6 py-2 text-white rounded-lg font-medium transition ${confirmDialog.type === 'promote' ? 'bg-purple-600 hover:bg-purple-700' : 'bg-red-600 hover:bg-red-700'}`, children: confirmDialog.type === 'promote' ? 'Yes, Promote' : 'Yes, Demote' })] })] }) }), document.body)] }));
}
