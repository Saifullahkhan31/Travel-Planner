import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { adminRouteService } from '../services/adminRouteService';
import { X } from 'lucide-react';
const PAKISTAN_CITIES = [
    { name: 'Karachi', lat: 24.8607, lng: 67.0011 },
    { name: 'Lahore', lat: 31.5204, lng: 74.3587 },
    { name: 'Islamabad', lat: 33.6844, lng: 73.0479 },
    { name: 'Quetta', lat: 30.1798, lng: 66.9750 },
    { name: 'Peshawar', lat: 34.0151, lng: 71.5249 },
    { name: 'Multan', lat: 30.1575, lng: 71.5249 },
    { name: 'Faisalabad', lat: 31.4504, lng: 73.1350 },
    { name: 'Hyderabad', lat: 25.3960, lng: 68.3578 },
    { name: 'Rawalpindi', lat: 33.5909, lng: 73.0537 },
    { name: 'Sukkur', lat: 27.7132, lng: 68.8622 },
    { name: 'Bahawalpur', lat: 29.3957, lng: 71.6833 },
    { name: 'Sargodha', lat: 32.0836, lng: 72.6711 },
    { name: 'Sialkot', lat: 32.4925, lng: 74.5310 },
    { name: 'Gujranwala', lat: 32.1617, lng: 74.1883 },
    { name: 'Swat', lat: 35.2227, lng: 72.4258 },
    { name: 'Gwadar', lat: 25.1216, lng: 62.3254 },
];
export default function RouteFormModal({ route, onClose, onSave }) {
    const [formData, setFormData] = useState({
        routeName: '',
        origin: '',
        destination: '',
        distance: 0,
        estimatedDuration: 0,
        baseFare: 0,
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [lastCalculatedPair, setLastCalculatedPair] = useState('');
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
        }
    }, [route]);
    // Auto-calculate distance and duration when origin and destination are filled
    useEffect(() => {
        const originCity = PAKISTAN_CITIES.find(c => c.name.toLowerCase() === formData.origin.trim().toLowerCase());
        const destCity = PAKISTAN_CITIES.find(c => c.name.toLowerCase() === formData.destination.trim().toLowerCase());
        if (originCity && destCity && originCity.name !== destCity.name) {
            const pair = `${originCity.name}-${destCity.name}`;
            // Only fetch if we haven't already calculated this exact pair, to prevent infinite loops and allow manual edits
            if (pair !== lastCalculatedPair) {
                setLastCalculatedPair(pair);
                // Auto update route name
                setFormData(prev => ({ ...prev, routeName: `${originCity.name} → ${destCity.name}` }));
                // Fetch from OSRM public API
                fetch(`https://router.project-osrm.org/route/v1/driving/${originCity.lng},${originCity.lat};${destCity.lng},${destCity.lat}?overview=false`)
                    .then(res => res.json())
                    .then(data => {
                    if (data.routes && data.routes[0]) {
                        const distanceKm = Math.round(data.routes[0].distance / 1000);
                        const durationMin = Math.round(data.routes[0].duration / 60);
                        setFormData(prev => ({
                            ...prev,
                            distance: distanceKm,
                            estimatedDuration: durationMin
                        }));
                    }
                })
                    .catch(err => console.error("OSRM error:", err));
            }
        }
    }, [formData.origin, formData.destination, lastCalculatedPair]);
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
            const isValidOrigin = PAKISTAN_CITIES.find(c => c.name.toLowerCase() === formData.origin.trim().toLowerCase());
            const isValidDest = PAKISTAN_CITIES.find(c => c.name.toLowerCase() === formData.destination.trim().toLowerCase());
            if (!isValidOrigin)
                throw new Error('Please select a valid Origin city from the dropdown list');
            if (!isValidDest)
                throw new Error('Please select a valid Destination city from the dropdown list');
            if (isValidOrigin.name === isValidDest.name)
                throw new Error('Origin and Destination cannot be the same city');
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
            }
            else {
                const { error: err } = await adminRouteService.createRoute(routeData);
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
    return createPortal(_jsx("div", { className: "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100] p-4", children: _jsxs("div", { className: "bg-white rounded-lg max-w-5xl w-11/12 overflow-y-auto", children: [_jsxs("div", { className: "flex justify-between items-center p-6 border-b sticky top-0 bg-white", children: [_jsx("h2", { className: "text-xl font-bold", children: route ? 'Edit Route' : 'Add New Route' }), _jsx("button", { onClick: onClose, className: "text-gray-500 hover:text-gray-700", children: _jsx(X, { size: 24 }) })] }), _jsxs("form", { onSubmit: handleSubmit, className: "p-6", children: [_jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-2 gap-8", children: [_jsxs("div", { className: "space-y-4", children: [error && (_jsx("div", { className: "bg-red-50 border border-red-200 rounded-lg p-3", children: _jsx("p", { className: "text-red-700 text-sm", children: error }) })), _jsx("h3", { className: "font-semibold text-gray-900 border-b pb-2", children: "Route Path" }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Route Name *" }), _jsx("input", { type: "text", value: formData.routeName, onChange: (e) => setFormData({ ...formData, routeName: e.target.value }), placeholder: "e.g., Karachi \u2192 Hyderabad", className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500", disabled: loading })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Origin *" }), _jsx("input", { type: "text", list: "origin-cities", value: formData.origin, onChange: (e) => setFormData({ ...formData, origin: e.target.value }), placeholder: "Select or type Origin", className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500", disabled: loading }), _jsx("datalist", { id: "origin-cities", children: PAKISTAN_CITIES.map(c => _jsx("option", { value: c.name }, c.name)) })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Destination *" }), _jsx("input", { type: "text", list: "dest-cities", value: formData.destination, onChange: (e) => setFormData({ ...formData, destination: e.target.value }), placeholder: "Select or type Destination", className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500", disabled: loading }), _jsx("datalist", { id: "dest-cities", children: PAKISTAN_CITIES.map(c => _jsx("option", { value: c.name }, c.name)) })] })] }), _jsxs("div", { className: "space-y-4", children: [_jsx("h3", { className: "font-semibold text-gray-900 border-b pb-2", children: "Route Details" }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Distance (km) *" }), _jsx("input", { type: "number", min: "1", step: "0.1", value: formData.distance, onChange: (e) => setFormData({ ...formData, distance: parseFloat(e.target.value) }), className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500", disabled: loading })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Duration (minutes) *" }), _jsx("input", { type: "number", min: "1", value: formData.estimatedDuration, onChange: (e) => setFormData({ ...formData, estimatedDuration: parseInt(e.target.value) }), className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500", disabled: loading }), _jsx("p", { className: "text-xs text-gray-500 mt-1", children: "Example: 165 minutes = 2 hrs 45 mins" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Base Fare (Rs) *" }), _jsx("input", { type: "number", min: "0", value: formData.baseFare, onChange: (e) => setFormData({ ...formData, baseFare: parseInt(e.target.value) }), className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500", disabled: loading })] })] })] }), "          ", _jsxs("div", { className: "flex justify-end gap-3 pt-6 border-t mt-8", children: [_jsx("button", { type: "button", onClick: onClose, className: "px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-200 bg-gray-100", disabled: loading, children: "Cancel" }), _jsx("button", { type: "submit", className: "px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 flex-1 max-w-[200px]", disabled: loading, children: loading ? 'Saving...' : (route ? 'Update Route' : 'Create Route') })] })] })] }) }), document.body);
}
