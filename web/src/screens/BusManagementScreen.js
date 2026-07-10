import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { adminBusService } from '../services/adminBusService';
import BusFormModal from './BusFormModal';
import { TableSkeleton } from '../components/LoadingSkeleton';
import { Trash2, Edit2, Plus } from 'lucide-react';
export default function BusManagementScreen() {
    const [buses, setBuses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showForm, setShowForm] = useState(false);
    const [editingBus, setEditingBus] = useState(null);
    const [deleteConfirm, setDeleteConfirm] = useState(null);
    const [deleteImpact, setDeleteImpact] = useState(null);
    const [checkingDelete, setCheckingDelete] = useState(null);
    const [deletingBus, setDeletingBus] = useState(null);
    const [deactivatingBus, setDeactivatingBus] = useState(null);
    useEffect(() => {
        loadBuses();
    }, []);
    const loadBuses = async () => {
        try {
            setLoading(true);
            const { data, error: err } = await adminBusService.getAllBuses();
            if (err)
                throw new Error(err);
            setBuses(data || []);
            setError(null);
        }
        catch (err) {
            setError(err.message);
        }
        finally {
            setLoading(false);
        }
    };
    const prepareDelete = async (busId) => {
        try {
            setCheckingDelete(busId);
            const { data, error: err } = await adminBusService.getBusDeleteImpact(busId);
            if (err)
                throw new Error(err);
            setDeleteImpact(data);
            setDeleteConfirm(busId);
        }
        catch (err) {
            setError(err.message);
        }
        finally {
            setCheckingDelete(null);
        }
    };
    const handleDelete = async (busId) => {
        try {
            setDeletingBus(busId);
            const { error: err } = await adminBusService.deleteBus(busId);
            if (err)
                throw new Error(err);
            setBuses(buses.filter(b => b.id !== busId));
            setDeleteConfirm(null);
            setDeleteImpact(null);
        }
        catch (err) {
            setError(err.message);
        }
        finally {
            setDeletingBus(null);
        }
    };
    const handleDeactivate = async (busId) => {
        try {
            setDeactivatingBus(busId);
            const { error: err } = await adminBusService.deactivateBus(busId);
            if (err)
                throw new Error(err);
            await loadBuses();
            setDeleteConfirm(null);
            setDeleteImpact(null);
        }
        catch (err) {
            setError(err.message);
        }
        finally {
            setDeactivatingBus(null);
        }
    };
    const handleFormClose = () => {
        setShowForm(false);
        setEditingBus(null);
    };
    const handleFormSave = async () => {
        await loadBuses();
        handleFormClose();
    };
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "flex justify-between items-center", children: [_jsxs("div", { children: [_jsx("h2", { className: "text-2xl font-bold", children: "Bus Management" }), _jsxs("p", { className: "text-gray-600 text-sm mt-1", children: ["Total buses: ", buses.length] })] }), _jsxs("button", { onClick: () => setShowForm(true), className: "flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition", children: [_jsx(Plus, { size: 18 }), "Add Bus"] })] }), error && (_jsx("div", { className: "bg-red-50 border border-red-200 rounded-lg p-4", children: _jsx("p", { className: "text-red-700", children: error }) })), loading ? (_jsx(TableSkeleton, { columns: 7 })) : buses.length === 0 ? (_jsx("div", { className: "bg-gray-50 rounded-lg p-8 text-center", children: _jsx("p", { className: "text-gray-600", children: "No buses found. Create one to get started." }) })) : (_jsx("div", { className: "overflow-x-auto bg-white rounded-lg shadow", children: _jsxs("table", { className: "w-full", children: [_jsx("thead", { children: _jsxs("tr", { className: "bg-gray-50 border-b", children: [_jsx("th", { className: "px-6 py-3 text-left text-sm font-semibold text-gray-700", children: "ID" }), _jsx("th", { className: "px-6 py-3 text-left text-sm font-semibold text-gray-700", children: "Type" }), _jsx("th", { className: "px-6 py-3 text-left text-sm font-semibold text-gray-700", children: "Driver" }), _jsx("th", { className: "px-6 py-3 text-left text-sm font-semibold text-gray-700", children: "Plate" }), _jsx("th", { className: "px-6 py-3 text-left text-sm font-semibold text-gray-700", children: "Seats" }), _jsx("th", { className: "px-6 py-3 text-left text-sm font-semibold text-gray-700", children: "Status" }), _jsx("th", { className: "px-6 py-3 text-left text-sm font-semibold text-gray-700", children: "Actions" })] }) }), _jsx("tbody", { className: "divide-y", children: buses.map((bus) => (_jsxs("tr", { className: "hover:bg-gray-50", children: [_jsx("td", { className: "px-6 py-4 text-sm text-gray-900 font-mono", children: bus.id.slice(0, 8) }), _jsx("td", { className: "px-6 py-4 text-sm text-gray-900", children: bus.busType }), _jsx("td", { className: "px-6 py-4 text-sm text-gray-900", children: bus.driverName }), _jsx("td", { className: "px-6 py-4 text-sm text-gray-900 font-mono", children: bus.plateNumber }), _jsx("td", { className: "px-6 py-4 text-sm text-gray-900", children: bus.totalSeats }), _jsx("td", { className: "px-6 py-4 text-sm", children: _jsx("span", { className: `px-2 py-1 rounded text-xs font-semibold ${bus.isActive
                                                ? 'bg-green-100 text-green-800'
                                                : 'bg-gray-100 text-gray-800'}`, children: bus.isActive ? 'Active' : 'Inactive' }) }), _jsx("td", { className: "px-6 py-4 text-sm", children: _jsxs("div", { className: "flex gap-2", children: [_jsx("button", { onClick: () => {
                                                        setEditingBus(bus);
                                                        setShowForm(true);
                                                    }, className: "p-2 hover:bg-blue-50 text-blue-600 rounded transition", children: _jsx(Edit2, { size: 16 }) }), _jsx("button", { onClick: () => prepareDelete(bus.id), disabled: checkingDelete === bus.id, className: "p-2 hover:bg-red-50 text-red-600 rounded transition disabled:opacity-50", "aria-label": "Delete bus", children: checkingDelete === bus.id ? (_jsx("span", { className: "block h-4 w-4 animate-spin rounded-full border-2 border-red-600 border-t-transparent" })) : (_jsx(Trash2, { size: 16 })) })] }) })] }, bus.id))) })] }) })), showForm && (_jsx(BusFormModal, { bus: editingBus, onClose: handleFormClose, onSave: handleFormSave })), deleteConfirm && (_jsx("div", { className: "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50", children: _jsxs("div", { className: "bg-white rounded-lg p-6 max-w-sm", children: [_jsx("h3", { className: "text-lg font-bold mb-4", children: deleteImpact?.hasActiveBookings ? 'Deactivate Bus Instead?' : 'Delete Bus?' }), _jsx("p", { className: "text-gray-600 mb-6", children: deleteImpact?.hasActiveBookings
                                ? `This bus has ${deleteImpact.activeBookingCount} active/current/future booking(s). It can be safely deleted after ${deleteImpact.safeDeleteAfter}. Deactivate it now to remove it from new availability while keeping existing tickets valid.`
                                : 'This action cannot be undone.' }), _jsxs("div", { className: "flex gap-3 justify-end", children: [_jsx("button", { onClick: () => {
                                        setDeleteConfirm(null);
                                        setDeleteImpact(null);
                                    }, disabled: deletingBus === deleteConfirm || deactivatingBus === deleteConfirm, className: "px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded transition", children: "Cancel" }), deleteImpact?.hasActiveBookings ? (_jsx("button", { onClick: () => handleDeactivate(deleteConfirm), disabled: deactivatingBus === deleteConfirm, className: "px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded transition disabled:opacity-60", children: deactivatingBus === deleteConfirm ? 'Deactivating...' : 'Deactivate' })) : (_jsx("button", { onClick: () => handleDelete(deleteConfirm), disabled: deletingBus === deleteConfirm, className: "px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded transition disabled:opacity-60", children: deletingBus === deleteConfirm ? 'Deleting...' : 'Delete' }))] })] }) }))] }));
}
