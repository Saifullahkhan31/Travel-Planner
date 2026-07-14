import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { adminRouteService, DeleteImpact } from '../services/adminRouteService';
import { Route, Stop } from '../types';
import RouteFormModal from './RouteFormModal';
import { CardListSkeleton } from '../components/LoadingSkeleton';
import { Trash2, Edit2, Plus, ChevronDown, ChevronUp } from 'lucide-react';

const ROUTE_BATCH_SIZE = 10;

export default function RouteManagementScreen() {
  const [routes, setRoutes] = useState<Route[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMoreRoutes, setHasMoreRoutes] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingRoute, setEditingRoute] = useState<Route | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [deleteImpact, setDeleteImpact] = useState<DeleteImpact | null>(null);
  const [expandedRoute, setExpandedRoute] = useState<string | null>(null);

  useEffect(() => {
    loadRoutes();
  }, []);

  const mapRoute = (route: any): Route => ({
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

  const formatTime = (minutes: number) => {
    const h = Math.floor(minutes / 60);
    const m = Math.round(minutes % 60);
    if (h > 0) return `${h} hrs ${m} mins`;
    return `${m} mins`;
  };

  const loadRoutes = async (offset = 0) => {
    try {
      if (offset === 0) {
        setLoading(true);
        setRoutes([]);
      } else {
        setLoadingMore(true);
      }

      const { data, error: err } = await supabase
        .from('routes')
        .select('*')
        .range(offset, offset + ROUTE_BATCH_SIZE - 1);
      if (err) throw err;

      const mappedRoutes = (data || []).map(mapRoute);
      setRoutes(prev => offset === 0 ? mappedRoutes : [...prev, ...mappedRoutes]);
      setHasMoreRoutes(mappedRoutes.length === ROUTE_BATCH_SIZE);

      setError(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const prepareDelete = async (routeId: string) => {
    try {
      const { data, error: err } = await adminRouteService.getRouteDeleteImpact(routeId);
      if (err) throw new Error(err);
      setDeleteImpact(data);
      setDeleteConfirm(routeId);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleDelete = async (routeId: string) => {
    try {
      const { error: err } = await adminRouteService.deleteRoute(routeId);
      if (err) throw new Error(err);
      setRoutes(routes.filter(r => r.id !== routeId));
      setDeleteConfirm(null);
      setDeleteImpact(null);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleDeactivate = async (routeId: string) => {
    try {
      const { error: err } = await adminRouteService.deactivateRoute(routeId);
      if (err) throw new Error(err);
      setDeleteConfirm(null);
      setDeleteImpact(null);
    } catch (err: any) {
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
    if (!loadingMore) loadRoutes(routes.length);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Route Management</h2>
          <p className="text-gray-600 text-sm mt-1">Loaded routes: {routes.length}</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition"
        >
          <Plus size={18} />
          Add Route
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {loading ? (
        <CardListSkeleton />
      ) : routes.length === 0 ? (
        <div className="bg-gray-50 rounded-lg p-8 text-center">
          <p className="text-gray-600">No routes found. Create one to get started.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {routes.map((route) => (
            <div key={route.id} className="bg-white rounded-lg shadow border border-gray-200">
              <div
                className="p-4 flex items-center justify-between hover:bg-gray-50 cursor-pointer"
                onClick={() => setExpandedRoute(expandedRoute === route.id ? null : route.id)}
              >
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">{route.routeName}</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    {Number(route.distance).toFixed(1)} km • {formatTime(Number(route.estimatedDuration))} • Rs. {route.baseFare}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  {expandedRoute === route.id ? (
                    <ChevronUp size={20} className="text-gray-400" />
                  ) : (
                    <ChevronDown size={20} className="text-gray-400" />
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingRoute(route);
                      setShowForm(true);
                    }}
                    className="p-2 hover:bg-blue-50 text-blue-600 rounded transition"
                  >
                    <Edit2 size={16} />
                  </button>
                  <div className="relative group">
                    <button className="p-2 hover:bg-red-50 text-red-600 rounded transition" onClick={(e) => e.stopPropagation()}>
                      <Trash2 size={16} />
                    </button>
                    <div className="absolute right-0 mt-1 hidden group-hover:block bg-white border rounded shadow-lg p-2 z-10 whitespace-nowrap">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          prepareDelete(route.id);
                        }}
                        className="block w-full text-left px-3 py-1 text-red-600 hover:bg-red-50 rounded text-sm"
                      >
                        Confirm delete
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {expandedRoute === route.id && (
                <div className="border-t bg-gray-50 p-4">
                  <h4 className="font-semibold text-gray-900 mb-2">Route Information</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm text-gray-700">
                    <div>
                      <span className="font-medium">Origin:</span> {route.origin}
                    </div>
                    <div>
                      <span className="font-medium">Destination:</span> {route.destination}
                    </div>
                    <div>
                      <span className="font-medium">Distance:</span> {Number(route.distance).toFixed(1)} km
                    </div>
                    <div>
                      <span className="font-medium">Duration:</span> {formatTime(Number(route.estimatedDuration))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
          {loadingMore && <CardListSkeleton rows={3} />}
          {hasMoreRoutes && !loadingMore && (
            <button
              onClick={handleLoadMore}
              className="w-full py-3 bg-white hover:bg-gray-50 border border-gray-200 rounded-lg text-sm font-medium text-blue-600 shadow-sm transition"
            >
              Load 10 more routes
            </button>
          )}
        </div>
      )}

      {showForm && (
        <RouteFormModal
          route={editingRoute}
          onClose={handleFormClose}
          onSave={handleFormSave}
        />
      )}

      {deleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm">
            <h3 className="text-lg font-bold mb-4">
              {deleteImpact?.hasActiveBookings ? 'Deactivate Route Instead?' : 'Delete Route?'}
            </h3>
            <p className="text-gray-600 mb-6">
              {deleteImpact?.hasActiveBookings
                ? `This route has ${deleteImpact.activeBookingCount} active/current/future booking(s). It can be safely deleted after ${deleteImpact.safeDeleteAfter}. Deactivate it now to close future scheduled trips while keeping existing tickets valid.`
                : 'This action cannot be undone. All associated stops will be deleted.'}
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setDeleteConfirm(null);
                  setDeleteImpact(null);
                }}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded transition"
              >
                Cancel
              </button>
              {deleteImpact?.hasActiveBookings ? (
                <button
                  onClick={() => handleDeactivate(deleteConfirm)}
                  className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded transition"
                >
                  Deactivate
                </button>
              ) : (
                <button
                  onClick={() => handleDelete(deleteConfirm)}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded transition"
                >
                  Delete
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
