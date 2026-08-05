import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { supabase } from '../lib/supabaseClient';
import { TableSkeleton } from '../components/LoadingSkeleton';
import { Plus, Edit2, X } from 'lucide-react';
import DriverFormModal from './DriverFormModal';
export default function DriverManagementScreen() {
    const [drivers, setDrivers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showDriverModal, setShowDriverModal] = useState(false);
    const [editingDriver, setEditingDriver] = useState(null);
    useEffect(() => {
        loadDrivers();
    }, []);
    const loadDrivers = async () => {
        try {
            setLoading(true);
            const { data, error: err } = await supabase
                .from('profiles')
                .select('id, full_name, role, email')
                .in('role', ['driver', 'inactive_driver']);
            if (err && err.message.includes('profiles.email')) {
                const { data: fallbackData, error: fallbackErr } = await supabase
                    .from('profiles')
                    .select('id, full_name, role')
                    .in('role', ['driver', 'inactive_driver']);
                if (fallbackErr)
                    throw fallbackErr;
                setDrivers(fallbackData || []);
            }
            else {
                if (err)
                    throw err;
                setDrivers(data || []);
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
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "flex justify-between items-center", children: [_jsxs("div", { children: [_jsx("h2", { className: "text-2xl font-bold", children: "Driver Management" }), _jsxs("p", { className: "text-gray-600 text-sm mt-1", children: ["Total drivers: ", drivers.length] })] }), _jsxs("button", { onClick: () => setShowDriverModal(true), className: "bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition shadow-sm flex items-center gap-2", children: [_jsx(Plus, { size: 20 }), _jsx("span", { children: "Add Driver" })] })] }), error && (_jsx("div", { className: "bg-red-50 border border-red-200 rounded-lg p-4", children: _jsx("p", { className: "text-red-700", children: error }) })), loading ? (_jsx(TableSkeleton, { rows: 3, columns: 3 })) : (_jsx("div", { className: "bg-white shadow-sm rounded-lg border overflow-hidden", children: _jsxs("table", { className: "min-w-full divide-y divide-gray-200", children: [_jsx("thead", { className: "bg-gray-50", children: _jsxs("tr", { children: [_jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider", children: "Name" }), _jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider", children: "Email" }), _jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider", children: "Status" }), _jsx("th", { className: "px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider", children: "Actions" })] }) }), _jsx("tbody", { className: "bg-white divide-y divide-gray-200", children: drivers.length === 0 ? (_jsx("tr", { children: _jsx("td", { colSpan: 4, className: "px-6 py-8 text-center text-gray-500", children: "No drivers found. Add one to get started." }) })) : (drivers.map((driver) => (_jsxs("tr", { className: "hover:bg-gray-50", children: [_jsx("td", { className: "px-6 py-4 whitespace-nowrap", children: _jsx("div", { className: "text-sm font-medium text-gray-900", children: driver.full_name || 'N/A' }) }), _jsx("td", { className: "px-6 py-4 whitespace-nowrap", children: _jsx("div", { className: "text-sm text-gray-500", children: driver.email || 'N/A' }) }), _jsx("td", { className: "px-6 py-4 whitespace-nowrap", children: driver.role === 'driver' ? (_jsx("span", { className: "px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-semibold", children: "Active" })) : (_jsx("span", { className: "px-2 py-1 bg-gray-100 text-gray-800 rounded text-xs font-semibold", children: "Inactive" })) }), _jsx("td", { className: "px-6 py-4 whitespace-nowrap text-right text-sm font-medium", children: _jsx("button", { onClick: () => setEditingDriver(driver), className: "text-blue-600 hover:text-blue-900 bg-blue-50 p-2 rounded transition", title: "Edit Driver", children: _jsx(Edit2, { size: 16 }) }) })] }, driver.id)))) })] }) })), showDriverModal && (_jsx(DriverFormModal, { onClose: () => setShowDriverModal(false), onSave: () => {
                    setShowDriverModal(false);
                    loadDrivers();
                } })), editingDriver && (_jsx(EditDriverModal, { driver: editingDriver, onClose: () => setEditingDriver(null), onSave: () => {
                    setEditingDriver(null);
                    loadDrivers();
                } }))] }));
}
function EditDriverModal({ driver, onClose, onSave }) {
    const [name, setName] = useState(driver.full_name);
    const [isActive, setIsActive] = useState(driver.role === 'driver');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const handleSave = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            if (!name.trim())
                throw new Error('Name is required');
            const newRole = isActive ? 'driver' : 'inactive_driver';
            const { error: err } = await supabase
                .from('profiles')
                .update({ full_name: name, role: newRole })
                .eq('id', driver.id);
            if (err)
                throw err;
            onSave();
        }
        catch (err) {
            setError(err.message);
        }
        finally {
            setLoading(false);
        }
    };
    return createPortal(_jsx("div", { className: "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100] p-4", children: _jsxs("div", { className: "bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden", children: [_jsxs("div", { className: "flex justify-between items-center p-6 border-b border-gray-100", children: [_jsx("h2", { className: "text-xl font-bold text-gray-900", children: "Edit Driver" }), _jsx("button", { onClick: onClose, className: "text-gray-400 hover:text-gray-600 transition", children: _jsx(X, { size: 24 }) })] }), _jsxs("form", { onSubmit: handleSave, className: "p-6 space-y-5", children: [error && (_jsx("div", { className: "bg-red-50 text-red-700 p-3 rounded-lg text-sm", children: error })), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Full Name *" }), _jsx("input", { type: "text", value: name, onChange: (e) => setName(e.target.value), className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500", disabled: loading, placeholder: "Driver's Full Name" })] }), _jsxs("div", { className: "flex items-center mt-2 bg-gray-50 p-4 rounded-lg border border-gray-200", children: [_jsx("input", { type: "checkbox", id: "isActive", checked: isActive, onChange: (e) => setIsActive(e.target.checked), className: "h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded", disabled: loading }), _jsx("label", { htmlFor: "isActive", className: "ml-2 block text-sm text-gray-900 font-medium", children: "Active / Available for Assignments" })] }), _jsx("p", { className: "text-xs text-gray-500 italic mt-1", children: "Unchecking this will deactivate the driver. They will not be deleted, but they can no longer be assigned to new buses." }), _jsxs("div", { className: "flex gap-3 pt-4", children: [_jsx("button", { type: "button", onClick: onClose, className: "flex-1 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-900 rounded-lg transition", disabled: loading, children: "Cancel" }), _jsx("button", { type: "submit", className: "flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition disabled:opacity-50", disabled: loading, children: loading ? 'Saving...' : 'Save Changes' })] })] })] }) }), document.body);
}
