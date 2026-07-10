import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { adminBusService } from '../services/adminBusService';
import { Bus, Route } from '../types';
import { X } from 'lucide-react';

interface BusFormModalProps {
  bus: Bus | null;
  onClose: () => void;
  onSave: () => void;
}

export default function BusFormModal({ bus, onClose, onSave }: BusFormModalProps) {
  const [routes, setRoutes] = useState<Route[]>([]);
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
  const [error, setError] = useState<string | null>(null);

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
      if (err) throw err;
      setRoutes((data || []).map((route: any) => ({
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
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (!formData.routeId) throw new Error('Route is required');
      if (!formData.driverName.trim()) throw new Error('Driver name is required');
      if (!formData.plateNumber.trim()) throw new Error('Plate number is required');
      if (formData.totalSeats < 1) throw new Error('Seats must be at least 1');

      const busData = {
        routeId: formData.routeId,
        busType: formData.busType as any,
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
        if (err) throw new Error(err);
      } else {
        const { error: err } = await adminBusService.createBus(busData);
        if (err) throw new Error(err);
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
      <div className="bg-white rounded-lg max-w-md w-full max-h-screen overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b sticky top-0 bg-white">
          <h2 className="text-xl font-bold">{bus ? 'Edit Bus' : 'Add New Bus'}</h2>
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

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Route *</label>
            <select
              value={formData.routeId}
              onChange={(e) => setFormData({ ...formData, routeId: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={loading}
            >
              <option value="">Select a route</option>
              {routes.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.routeName || `${r.origin} → ${r.destination}`}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Bus Type *</label>
            <select
              value={formData.busType}
              onChange={(e) => setFormData({ ...formData, busType: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={loading}
            >
              <option value="AC">AC</option>
              <option value="Non-AC">Non-AC</option>
              <option value="Premium">Premium</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Total Seats *</label>
            <input
              type="number"
              min="1"
              max="100"
              value={formData.totalSeats}
              onChange={(e) => setFormData({ ...formData, totalSeats: parseInt(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Driver Name *</label>
            <input
              type="text"
              value={formData.driverName}
              onChange={(e) => setFormData({ ...formData, driverName: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Plate Number *</label>
            <input
              type="text"
              value={formData.plateNumber}
              onChange={(e) => setFormData({ ...formData, plateNumber: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={loading}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">GPS Latitude</label>
              <input
                type="number"
                step="0.0001"
                value={formData.gpsLat}
                onChange={(e) => setFormData({ ...formData, gpsLat: parseFloat(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={loading}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">GPS Longitude</label>
              <input
                type="number"
                step="0.0001"
                value={formData.gpsLng}
                onChange={(e) => setFormData({ ...formData, gpsLng: parseFloat(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={loading}
              />
            </div>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="isActive"
              checked={formData.isActive}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              className="h-4 w-4 text-blue-600 rounded"
              disabled={loading}
            />
            <label htmlFor="isActive" className="ml-2 text-sm text-gray-700">
              Active
            </label>
          </div>

          <div className="flex gap-3 pt-4">
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
              {loading ? (bus ? 'Updating...' : 'Creating...') : (bus ? 'Update Bus' : 'Create Bus')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
