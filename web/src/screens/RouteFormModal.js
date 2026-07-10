import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { adminRouteService } from '../services/adminRouteService';
import { X, Plus, Trash2 } from 'lucide-react';
export default function RouteFormModal({ route, onClose, onSave }) {
    const [formData, setFormData] = useState({
        routeName: '',
        origin: '',
        destination: '',
        distance: 0,
        estimatedDuration: 0,
        baseFare: 0,
    });
    const [stops, setStops] = useState([]);
    const [newStop, setNewStop] = useState({ name: '', latitude: '', longitude: '' });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    useEffect(() => {
        if (route) {
            setFormData({
                routeName: route.routeName,
                origin: route.origin,
                destination: route.destination,
                distance: route.distance,
                estimatedDuration: route.estimatedDuration,
                baseFare: route.baseFare,
            });
            loadStops(route.id);
        }
    }, [route]);
    const loadStops = async (routeId) => {
        try {
            const { data, error: err } = await supabase
                .from('stops')
                .select('*')
                .eq('route_id', routeId)
                .order('order', { ascending: true });
            if (err)
                throw err;
            setStops(data || []);
        }
        catch (err) {
            setError(err.message);
        }
    };
    const addStop = () => {
        if (!newStop.name.trim()) {
            setError('Stop name is required');
            return;
        }
        if (!newStop.latitude || !newStop.longitude) {
            setError('Latitude and longitude are required');
            return;
        }
        setStops([...stops, {
                name: newStop.name,
                latitude: parseFloat(newStop.latitude),
                longitude: parseFloat(newStop.longitude),
                order: stops.length,
            }]);
        setNewStop({ name: '', latitude: '', longitude: '' });
        setError(null);
    };
    const removeStop = (idx) => {
        setStops(stops.filter((_, i) => i !== idx));
    };
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setLoading(true);
        try {
            if (!formData.routeName.trim())
                throw new Error('Route name is required');
            if (!formData.origin.trim())
                throw new Error('Origin is required');
            if (!formData.destination.trim())
                throw new Error('Destination is required');
            if (formData.distance < 1)
                throw new Error('Distance must be at least 1 km');
            if (formData.estimatedDuration < 1)
                throw new Error('Duration must be at least 1 minute');
            if (formData.baseFare < 0)
                throw new Error('Fare cannot be negative');
            const routeData = {
                routeName: formData.routeName,
                origin: formData.origin,
                destination: formData.destination,
                distance: formData.distance,
                estimatedDuration: formData.estimatedDuration,
                baseFare: formData.baseFare,
            };
            if (route) {
                const { error: err } = await adminRouteService.updateRoute(route.id, routeData);
                if (err)
                    throw new Error(err);
                // Delete old stops and add new ones
                for (const stop of stops) {
                    if (stop.id) {
                        await adminRouteService.deleteStop(stop.id);
                    }
                }
                for (const stop of stops) {
                    if (!stop.id) {
                        await adminRouteService.createStop({
                            routeId: route.id,
                            name: stop.name,
                            latitude: stop.latitude,
                            longitude: stop.longitude,
                            order: stops.indexOf(stop),
                        });
                    }
                }
            }
            else {
                const { data: newRoute, error: err } = await adminRouteService.createRoute(routeData);
                if (err)
                    throw new Error(err);
                // Add stops to new route
                for (const stop of stops) {
                    await adminRouteService.createStop({
                        routeId: newRoute.id,
                        name: stop.name,
                        latitude: stop.latitude,
                        longitude: stop.longitude,
                        order: stops.indexOf(stop),
                    });
                }
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
    return (_jsx("div", { className: "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4", children: _jsxs("div", { className: "bg-white rounded-lg max-w-2xl w-full max-h-screen overflow-y-auto", children: [_jsxs("div", { className: "flex justify-between items-center p-6 border-b sticky top-0 bg-white", children: [_jsx("h2", { className: "text-xl font-bold", children: route ? 'Edit Route' : 'Add New Route' }), _jsx("button", { onClick: onClose, className: "text-gray-500 hover:text-gray-700", children: _jsx(X, { size: 24 }) })] }), _jsxs("form", { onSubmit: handleSubmit, className: "p-6 space-y-4", children: [error && (_jsx("div", { className: "bg-red-50 border border-red-200 rounded-lg p-3", children: _jsx("p", { className: "text-red-700 text-sm", children: error }) })), _jsxs("div", { className: "space-y-4", children: [_jsx("h3", { className: "font-semibold text-gray-900", children: "Route Details" }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Route Name *" }), _jsx("input", { type: "text", value: formData.routeName, onChange: (e) => setFormData({ ...formData, routeName: e.target.value }), placeholder: "e.g., Karachi \u2192 Hyderabad", className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500", disabled: loading })] }), _jsxs("div", { className: "grid grid-cols-2 gap-4", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Origin *" }), _jsx("input", { type: "text", value: formData.origin, onChange: (e) => setFormData({ ...formData, origin: e.target.value }), placeholder: "e.g., Karachi", className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500", disabled: loading })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Destination *" }), _jsx("input", { type: "text", value: formData.destination, onChange: (e) => setFormData({ ...formData, destination: e.target.value }), placeholder: "e.g., Hyderabad", className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500", disabled: loading })] })] }), _jsxs("div", { className: "grid grid-cols-3 gap-4", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Distance (km) *" }), _jsx("input", { type: "number", min: "1", value: formData.distance, onChange: (e) => setFormData({ ...formData, distance: parseInt(e.target.value) }), className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500", disabled: loading })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Duration (min) *" }), _jsx("input", { type: "number", min: "1", value: formData.estimatedDuration, onChange: (e) => setFormData({ ...formData, estimatedDuration: parseInt(e.target.value) }), className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500", disabled: loading })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Base Fare (Rs) *" }), _jsx("input", { type: "number", min: "0", value: formData.baseFare, onChange: (e) => setFormData({ ...formData, baseFare: parseInt(e.target.value) }), className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500", disabled: loading })] })] })] }), _jsxs("div", { className: "space-y-3 border-t pt-4", children: [_jsxs("h3", { className: "font-semibold text-gray-900", children: ["Stops (", stops.length, ")"] }), stops.length > 0 && (_jsx("div", { className: "space-y-2", children: stops.map((stop, idx) => (_jsxs("div", { className: "flex items-center justify-between bg-gray-50 p-3 rounded border border-gray-200", children: [_jsxs("div", { className: "flex-1 text-sm", children: [_jsxs("span", { className: "font-semibold text-gray-900", children: ["#", idx + 1] }), _jsx("span", { className: "text-gray-600 ml-2", children: stop.name }), _jsxs("span", { className: "text-gray-500 text-xs ml-2", children: ["(", stop.latitude, ", ", stop.longitude, ")"] })] }), _jsx("button", { type: "button", onClick: () => removeStop(idx), className: "p-1 hover:bg-red-100 text-red-600 rounded", disabled: loading, children: _jsx(Trash2, { size: 16 }) })] }, idx))) })), _jsxs("div", { className: "space-y-2 bg-blue-50 p-3 rounded border border-blue-200", children: [_jsxs("div", { className: "grid grid-cols-1 gap-2", children: [_jsx("input", { type: "text", value: newStop.name, onChange: (e) => setNewStop({ ...newStop, name: e.target.value }), placeholder: "Stop name", className: "px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm", disabled: loading }), _jsxs("div", { className: "grid grid-cols-2 gap-2", children: [_jsx("input", { type: "number", step: "0.0001", value: newStop.latitude, onChange: (e) => setNewStop({ ...newStop, latitude: e.target.value }), placeholder: "Latitude", className: "px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm", disabled: loading }), _jsx("input", { type: "number", step: "0.0001", value: newStop.longitude, onChange: (e) => setNewStop({ ...newStop, longitude: e.target.value }), placeholder: "Longitude", className: "px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm", disabled: loading })] })] }), _jsxs("button", { type: "button", onClick: addStop, className: "w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded transition text-sm", disabled: loading, children: [_jsx(Plus, { size: 16 }), "Add Stop"] })] })] }), _jsxs("div", { className: "flex gap-3 pt-4 border-t", children: [_jsx("button", { type: "button", onClick: onClose, className: "flex-1 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-900 rounded-lg transition", disabled: loading, children: "Cancel" }), _jsx("button", { type: "submit", className: "flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition disabled:opacity-50", disabled: loading, children: loading ? 'Saving...' : 'Save' })] })] })] }) }));
}
