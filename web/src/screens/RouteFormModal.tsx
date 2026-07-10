import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { adminRouteService } from '../services/adminRouteService';
import { Route, Stop } from '../types';
import { X, Plus, Trash2 } from 'lucide-react';

interface RouteFormModalProps {
  route: Route | null;
  onClose: () => void;
  onSave: () => void;
}

export default function RouteFormModal({ route, onClose, onSave }: RouteFormModalProps) {
  const [formData, setFormData] = useState({
    routeName: '',
    origin: '',
    destination: '',
    distance: 0,
    estimatedDuration: 0,
    baseFare: 0,
  });
  const [stops, setStops] = useState<Partial<Stop>[]>([]);
  const [newStop, setNewStop] = useState({ name: '', latitude: '', longitude: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  const loadStops = async (routeId: string) => {
    try {
      const { data, error: err } = await supabase
        .from('stops')
        .select('*')
        .eq('route_id', routeId)
        .order('order', { ascending: true });
      if (err) throw err;
      setStops(data || []);
    } catch (err: any) {
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

  const removeStop = (idx: number) => {
    setStops(stops.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (!formData.routeName.trim()) throw new Error('Route name is required');
      if (!formData.origin.trim()) throw new Error('Origin is required');
      if (!formData.destination.trim()) throw new Error('Destination is required');
      if (formData.distance < 1) throw new Error('Distance must be at least 1 km');
      if (formData.estimatedDuration < 1) throw new Error('Duration must be at least 1 minute');
      if (formData.baseFare < 0) throw new Error('Fare cannot be negative');

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
        if (err) throw new Error(err);

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
              name: stop.name!,
              latitude: stop.latitude!,
              longitude: stop.longitude!,
              order: stops.indexOf(stop),
            });
          }
        }
      } else {
        const { data: newRoute, error: err } = await adminRouteService.createRoute(routeData);
        if (err) throw new Error(err);

        // Add stops to new route
        for (const stop of stops) {
          await adminRouteService.createStop({
            routeId: newRoute!.id,
            name: stop.name!,
            latitude: stop.latitude!,
            longitude: stop.longitude!,
            order: stops.indexOf(stop),
          });
        }
      }

      onSave();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-screen overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b sticky top-0 bg-white">
          <h2 className="text-xl font-bold">{route ? 'Edit Route' : 'Add New Route'}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X size={24} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          {/* Route Details */}
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900">Route Details</h3>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Route Name *</label>
              <input
                type="text"
                value={formData.routeName}
                onChange={(e) => setFormData({ ...formData, routeName: e.target.value })}
                placeholder="e.g., Karachi → Hyderabad"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={loading}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Origin *</label>
                <input
                  type="text"
                  value={formData.origin}
                  onChange={(e) => setFormData({ ...formData, origin: e.target.value })}
                  placeholder="e.g., Karachi"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={loading}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Destination *</label>
                <input
                  type="text"
                  value={formData.destination}
                  onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
                  placeholder="e.g., Hyderabad"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={loading}
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Distance (km) *</label>
                <input
                  type="number"
                  min="1"
                  value={formData.distance}
                  onChange={(e) => setFormData({ ...formData, distance: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={loading}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Duration (min) *</label>
                <input
                  type="number"
                  min="1"
                  value={formData.estimatedDuration}
                  onChange={(e) => setFormData({ ...formData, estimatedDuration: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={loading}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Base Fare (Rs) *</label>
                <input
                  type="number"
                  min="0"
                  value={formData.baseFare}
                  onChange={(e) => setFormData({ ...formData, baseFare: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={loading}
                />
              </div>
            </div>
          </div>

          {/* Stops */}
          <div className="space-y-3 border-t pt-4">
            <h3 className="font-semibold text-gray-900">Stops ({stops.length})</h3>

            {stops.length > 0 && (
              <div className="space-y-2">
                {stops.map((stop, idx) => (
                  <div key={idx} className="flex items-center justify-between bg-gray-50 p-3 rounded border border-gray-200">
                    <div className="flex-1 text-sm">
                      <span className="font-semibold text-gray-900">#{idx + 1}</span>
                      <span className="text-gray-600 ml-2">{stop.name}</span>
                      <span className="text-gray-500 text-xs ml-2">({stop.latitude}, {stop.longitude})</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeStop(idx)}
                      className="p-1 hover:bg-red-100 text-red-600 rounded"
                      disabled={loading}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="space-y-2 bg-blue-50 p-3 rounded border border-blue-200">
              <div className="grid grid-cols-1 gap-2">
                <input
                  type="text"
                  value={newStop.name}
                  onChange={(e) => setNewStop({ ...newStop, name: e.target.value })}
                  placeholder="Stop name"
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  disabled={loading}
                />
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="number"
                    step="0.0001"
                    value={newStop.latitude}
                    onChange={(e) => setNewStop({ ...newStop, latitude: e.target.value })}
                    placeholder="Latitude"
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    disabled={loading}
                  />
                  <input
                    type="number"
                    step="0.0001"
                    value={newStop.longitude}
                    onChange={(e) => setNewStop({ ...newStop, longitude: e.target.value })}
                    placeholder="Longitude"
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    disabled={loading}
                  />
                </div>
              </div>
              <button
                type="button"
                onClick={addStop}
                className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded transition text-sm"
                disabled={loading}
              >
                <Plus size={16} />
                Add Stop
              </button>
            </div>
          </div>

          <div className="flex gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-900 rounded-lg transition"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition disabled:opacity-50"
              disabled={loading}
            >
              {loading ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
