import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { adminBusService } from '../services/adminBusService';
import { X } from 'lucide-react';
export default function BusFormModal({ bus, onClose, onSave }) {
    const [routes, setRoutes] = useState([]);
    const [formData, setFormData] = useState({
        routeId: '',
        busType: 'AC',
        totalSeats: 40,
        driverName: '',
        plateNumber: '',
        gpsLat: 30.3753,
        gpsLng: 69.3451,
        isActive: true,
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    useEffect(() => {
        loadRoutes();
        if (bus) {
            setFormData({
                routeId: bus.routeId,
                busType: bus.busType,
                totalSeats: bus.totalSeats,
                driverName: bus.driverName,
                plateNumber: bus.plateNumber,
                gpsLat: bus.gpsLocation.latitude,
                gpsLng: bus.gpsLocation.longitude,
                isActive: bus.isActive,
            });
        }
    }, [bus]);
    const loadRoutes = async () => {
        try {
            const { data, error: err } = await supabase.from('routes').select('*');
            if (err)
                throw err;
            setRoutes((data || []).map((route) => ({
                id: route.id,
                routeName: route.route_name || [route.origin, route.destination].filter(Boolean).join(' → ') || 'Unnamed Route',
                origin: route.origin || '',
                destination: route.destination || '',
                stops: [],
                distance: route.distance ?? 0,
                estimatedDuration: route.estimated_duration ?? 0,
                baseFare: route.base_fare ?? 0,
                createdAt: route.created_at ?? new Date().toISOString(),
            })));
        }
        catch (err) {
            setError(err.message);
        }
    };
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setLoading(true);
        try {
            if (!formData.routeId)
                throw new Error('Route is required');
            if (!formData.driverName.trim())
                throw new Error('Driver name is required');
            if (!formData.plateNumber.trim())
                throw new Error('Plate number is required');
            if (formData.totalSeats < 1)
                throw new Error('Seats must be at least 1');
            const busData = {
                routeId: formData.routeId,
                busType: formData.busType,
                totalSeats: formData.totalSeats,
                currentOccupancy: bus?.currentOccupancy || 0,
                driverName: formData.driverName,
                plateNumber: formData.plateNumber,
                gpsLocation: {
                    latitude: formData.gpsLat,
                    longitude: formData.gpsLng,
                },
                isActive: formData.isActive,
            };
            if (bus) {
                const { error: err } = await adminBusService.updateBus(bus.id, busData);
                if (err)
                    throw new Error(err);
            }
            else {
                const { error: err } = await adminBusService.createBus(busData);
                if (err)
                    throw new Error(err);
            }
            onSave();
        }
        catch (err) {
            setError(err.message);
        }
        finally {
            setLoading(false);
        }
    };
    return (_jsx("div", { className: "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4", children: _jsxs("div", { className: "bg-white rounded-lg max-w-md w-full max-h-screen overflow-y-auto", children: [_jsxs("div", { className: "flex justify-between items-center p-6 border-b sticky top-0 bg-white", children: [_jsx("h2", { className: "text-xl font-bold", children: bus ? 'Edit Bus' : 'Add New Bus' }), _jsx("button", { onClick: onClose, className: "text-gray-500 hover:text-gray-700", children: _jsx(X, { size: 24 }) })] }), _jsxs("form", { onSubmit: handleSubmit, className: "p-6 space-y-4", children: [error && (_jsx("div", { className: "bg-red-50 border border-red-200 rounded-lg p-3", children: _jsx("p", { className: "text-red-700 text-sm", children: error }) })), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Route *" }), _jsxs("select", { value: formData.routeId, onChange: (e) => setFormData({ ...formData, routeId: e.target.value }), className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500", disabled: loading, children: [_jsx("option", { value: "", children: "Select a route" }), routes.map((r) => (_jsx("option", { value: r.id, children: r.routeName || `${r.origin} → ${r.destination}` }, r.id)))] })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Bus Type *" }), _jsxs("select", { value: formData.busType, onChange: (e) => setFormData({ ...formData, busType: e.target.value }), className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500", disabled: loading, children: [_jsx("option", { value: "AC", children: "AC" }), _jsx("option", { value: "Non-AC", children: "Non-AC" }), _jsx("option", { value: "Premium", children: "Premium" })] })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Total Seats *" }), _jsx("input", { type: "number", min: "1", max: "100", value: formData.totalSeats, onChange: (e) => setFormData({ ...formData, totalSeats: parseInt(e.target.value) }), className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500", disabled: loading })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Driver Name *" }), _jsx("input", { type: "text", value: formData.driverName, onChange: (e) => setFormData({ ...formData, driverName: e.target.value }), className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500", disabled: loading })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Plate Number *" }), _jsx("input", { type: "text", value: formData.plateNumber, onChange: (e) => setFormData({ ...formData, plateNumber: e.target.value }), className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500", disabled: loading })] }), _jsxs("div", { className: "grid grid-cols-2 gap-4", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "GPS Latitude" }), _jsx("input", { type: "number", step: "0.0001", value: formData.gpsLat, onChange: (e) => setFormData({ ...formData, gpsLat: parseFloat(e.target.value) }), className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500", disabled: loading })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "GPS Longitude" }), _jsx("input", { type: "number", step: "0.0001", value: formData.gpsLng, onChange: (e) => setFormData({ ...formData, gpsLng: parseFloat(e.target.value) }), className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500", disabled: loading })] })] }), _jsxs("div", { className: "flex items-center", children: [_jsx("input", { type: "checkbox", id: "isActive", checked: formData.isActive, onChange: (e) => setFormData({ ...formData, isActive: e.target.checked }), className: "h-4 w-4 text-blue-600 rounded", disabled: loading }), _jsx("label", { htmlFor: "isActive", className: "ml-2 text-sm text-gray-700", children: "Active" })] }), _jsxs("div", { className: "flex gap-3 pt-4", children: [_jsx("button", { type: "button", onClick: onClose, className: "flex-1 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-900 rounded-lg transition", disabled: loading, children: "Cancel" }), _jsx("button", { type: "submit", className: "flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition disabled:opacity-50", disabled: loading, children: loading ? (bus ? 'Updating...' : 'Creating...') : (bus ? 'Update Bus' : 'Create Bus') })] })] })] }) }));
}
