import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { adminRouteService } from '../services/adminRouteService';
import RouteFormModal from './RouteFormModal';
import { CardListSkeleton } from '../components/LoadingSkeleton';
import { Trash2, Edit2, Plus, ChevronDown, ChevronUp } from 'lucide-react';
const ROUTE_BATCH_SIZE = 10;
export default function RouteManagementScreen() {
    const [routes, setRoutes] = useState([]);
    const [stops, setStops] = useState({});
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [hasMoreRoutes, setHasMoreRoutes] = useState(false);
    const [error, setError] = useState(null);
    const [showForm, setShowForm] = useState(false);
    const [editingRoute, setEditingRoute] = useState(null);
    const [deleteConfirm, setDeleteConfirm] = useState(null);
    const [deleteImpact, setDeleteImpact] = useState(null);
    const [expandedRoute, setExpandedRoute] = useState(null);
    useEffect(() => {
        loadRoutes();
    }, []);
    const mapRoute = (route) => ({
        id: route.id,
        routeName: route.route_name || [route.origin, route.destination].filter(Boolean).join(' → ') || 'Unnamed Route',
        origin: route.origin || '',
        destination: route.destination || '',
        stops: [],
        distance: route.distance ?? 0,
        estimatedDuration: route.estimated_duration ?? 0,
        baseFare: route.base_fare ?? 0,
        createdAt: route.created_at ?? new Date().toISOString(),
    });
    const loadStopsForRoutes = async (routeIds) => {
        if (routeIds.length === 0)
            return;
        const { data: stopsData, error: stopsErr } = await supabase
            .from('stops')
            .select('*')
            .in('route_id', routeIds)
            .order('order', { ascending: true });
        if (stopsErr)
            return;
        const groupedStops = (stopsData || []).reduce((acc, stop) => {
            if (!acc[stop.route_id])
                acc[stop.route_id] = [];
            acc[stop.route_id].push(stop);
            return acc;
        }, {});
        setStops(prev => ({ ...prev, ...groupedStops }));
    };
    const loadRoutes = async (offset = 0) => {
        try {
            if (offset === 0) {
                setLoading(true);
                setRoutes([]);
                setStops({});
            }
            else {
                setLoadingMore(true);
            }
            const { data, error: err } = await supabase
                .from('routes')
                .select('*')
                .range(offset, offset + ROUTE_BATCH_SIZE - 1);
            if (err)
                throw err;
            const mappedRoutes = (data || []).map(mapRoute);
            setRoutes(prev => offset === 0 ? mappedRoutes : [...prev, ...mappedRoutes]);
            setHasMoreRoutes(mappedRoutes.length === ROUTE_BATCH_SIZE);
            await loadStopsForRoutes(mappedRoutes.map(route => route.id));
            setError(null);
        }
        catch (err) {
            setError(err.message);
        }
        finally {
            setLoading(false);
            setLoadingMore(false);
        }
    };
    const prepareDelete = async (routeId) => {
        try {
            const { data, error: err } = await adminRouteService.getRouteDeleteImpact(routeId);
            if (err)
                throw new Error(err);
            setDeleteImpact(data);
            setDeleteConfirm(routeId);
        }
        catch (err) {
            setError(err.message);
        }
    };
    const handleDelete = async (routeId) => {
        try {
            const { error: err } = await adminRouteService.deleteRoute(routeId);
            if (err)
                throw new Error(err);
            setRoutes(routes.filter(r => r.id !== routeId));
            setDeleteConfirm(null);
            setDeleteImpact(null);
        }
        catch (err) {
            setError(err.message);
        }
    };
    const handleDeactivate = async (routeId) => {
        try {
            const { error: err } = await adminRouteService.deactivateRoute(routeId);
            if (err)
                throw new Error(err);
            setDeleteConfirm(null);
            setDeleteImpact(null);
        }
        catch (err) {
            setError(err.message);
        }
    };
    const handleFormClose = () => {
        setShowForm(false);
        setEditingRoute(null);
    };
    const handleFormSave = async () => {
        await loadRoutes();
        handleFormClose();
    };
    const handleLoadMore = () => {
        if (!loadingMore)
            loadRoutes(routes.length);
    };
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "flex justify-between items-center", children: [_jsxs("div", { children: [_jsx("h2", { className: "text-2xl font-bold", children: "Route Management" }), _jsxs("p", { className: "text-gray-600 text-sm mt-1", children: ["Loaded routes: ", routes.length] })] }), _jsxs("button", { onClick: () => setShowForm(true), className: "flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition", children: [_jsx(Plus, { size: 18 }), "Add Route"] })] }), error && (_jsx("div", { className: "bg-red-50 border border-red-200 rounded-lg p-4", children: _jsx("p", { className: "text-red-700", children: error }) })), loading ? (_jsx(CardListSkeleton, {})) : routes.length === 0 ? (_jsx("div", { className: "bg-gray-50 rounded-lg p-8 text-center", children: _jsx("p", { className: "text-gray-600", children: "No routes found. Create one to get started." }) })) : (_jsxs("div", { className: "space-y-3", children: [routes.map((route) => (_jsxs("div", { className: "bg-white rounded-lg shadow border border-gray-200", children: [_jsxs("div", { className: "p-4 flex items-center justify-between hover:bg-gray-50 cursor-pointer", onClick: () => setExpandedRoute(expandedRoute === route.id ? null : route.id), children: [_jsxs("div", { className: "flex-1", children: [_jsx("h3", { className: "font-semibold text-gray-900", children: route.routeName }), _jsxs("p", { className: "text-sm text-gray-600 mt-1", children: [route.distance, "km \u2022 ", route.estimatedDuration, "min \u2022 Rs. ", route.baseFare] })] }), _jsxs("div", { className: "flex items-center gap-3", children: [expandedRoute === route.id ? (_jsx(ChevronUp, { size: 20, className: "text-gray-400" })) : (_jsx(ChevronDown, { size: 20, className: "text-gray-400" })), _jsx("button", { onClick: (e) => {
                                                    e.stopPropagation();
                                                    setEditingRoute(route);
                                                    setShowForm(true);
                                                }, className: "p-2 hover:bg-blue-50 text-blue-600 rounded transition", children: _jsx(Edit2, { size: 16 }) }), _jsxs("div", { className: "relative group", children: [_jsx("button", { className: "p-2 hover:bg-red-50 text-red-600 rounded transition", onClick: (e) => e.stopPropagation(), children: _jsx(Trash2, { size: 16 }) }), _jsx("div", { className: "absolute right-0 mt-1 hidden group-hover:block bg-white border rounded shadow-lg p-2 z-10 whitespace-nowrap", children: _jsx("button", { onClick: (e) => {
                                                                e.stopPropagation();
                                                                prepareDelete(route.id);
                                                            }, className: "block w-full text-left px-3 py-1 text-red-600 hover:bg-red-50 rounded text-sm", children: "Confirm delete" }) })] })] })] }), expandedRoute === route.id && (_jsxs("div", { className: "border-t bg-gray-50 p-4", children: [_jsxs("h4", { className: "font-semibold text-gray-900 mb-3", children: ["Stops (", stops[route.id]?.length || 0, ")"] }), stops[route.id] && stops[route.id].length > 0 ? (_jsx("div", { className: "space-y-2", children: stops[route.id].map((stop, idx) => (_jsx("div", { className: "bg-white p-3 rounded border border-gray-200 text-sm flex items-center justify-between", children: _jsxs("div", { className: "flex-1", children: [_jsxs("span", { className: "font-semibold text-gray-900", children: ["#", idx + 1] }), _jsx("span", { className: "text-gray-600 ml-2", children: stop.name }), _jsxs("span", { className: "text-gray-500 text-xs ml-2", children: ["(", stop.latitude, ", ", stop.longitude, ")"] })] }) }, stop.id))) })) : (_jsx("p", { className: "text-gray-600 text-sm", children: "No stops added yet." }))] }))] }, route.id))), loadingMore && _jsx(CardListSkeleton, { rows: 3 }), hasMoreRoutes && !loadingMore && (_jsx("button", { onClick: handleLoadMore, className: "w-full py-3 bg-white hover:bg-gray-50 border border-gray-200 rounded-lg text-sm font-medium text-blue-600 shadow-sm transition", children: "Load 10 more routes" }))] })), showForm && (_jsx(RouteFormModal, { route: editingRoute, onClose: handleFormClose, onSave: handleFormSave })), deleteConfirm && (_jsx("div", { className: "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50", children: _jsxs("div", { className: "bg-white rounded-lg p-6 max-w-sm", children: [_jsx("h3", { className: "text-lg font-bold mb-4", children: deleteImpact?.hasActiveBookings ? 'Deactivate Route Instead?' : 'Delete Route?' }), _jsx("p", { className: "text-gray-600 mb-6", children: deleteImpact?.hasActiveBookings
                                ? `This route has ${deleteImpact.activeBookingCount} active/current/future booking(s). It can be safely deleted after ${deleteImpact.safeDeleteAfter}. Deactivate it now to close future scheduled trips while keeping existing tickets valid.`
                                : 'This action cannot be undone. All associated stops will be deleted.' }), _jsxs("div", { className: "flex gap-3 justify-end", children: [_jsx("button", { onClick: () => {
                                        setDeleteConfirm(null);
                                        setDeleteImpact(null);
                                    }, className: "px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded transition", children: "Cancel" }), deleteImpact?.hasActiveBookings ? (_jsx("button", { onClick: () => handleDeactivate(deleteConfirm), className: "px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded transition", children: "Deactivate" })) : (_jsx("button", { onClick: () => handleDelete(deleteConfirm), className: "px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded transition", children: "Delete" }))] })] }) }))] }));
}
