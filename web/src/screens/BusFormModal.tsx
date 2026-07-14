import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { supabase } from '../lib/supabaseClient';
import { adminBusService } from '../services/adminBusService';
import { Bus, Route } from '../types';
import { X } from 'lucide-react';
import LocationPickerMap from '../components/LocationPickerMap';

interface BusFormModalProps {
  bus: Bus | null;
  onClose: () => void;
  onSave: () => void;
}

const PAKISTAN_CITIES = [
  { name: 'Karachi', lat: 24.8607, lng: 67.0011 },
  { name: 'Lahore', lat: 31.5204, lng: 74.3587 },
  { name: 'Islamabad', lat: 33.6844, lng: 73.0479 },
  { name: 'Rawalpindi', lat: 33.5909, lng: 73.0535 },
  { name: 'Peshawar', lat: 34.0151, lng: 71.5249 },
  { name: 'Quetta', lat: 30.1798, lng: 66.9750 },
  { name: 'Multan', lat: 30.1978, lng: 71.4697 },
  { name: 'Faisalabad', lat: 31.4181, lng: 73.0776 },
];

export default function BusFormModal({ bus, onClose, onSave }: BusFormModalProps) {
  const [routes, setRoutes] = useState<Route[]>([]);
  const [drivers, setDrivers] = useState<{ id: string; name: string }[]>([]);
  const [formData, setFormData] = useState({
    routeId: '',
    busType: 'AC',
    totalSeats: 40,
    driverId: '',
    driverName: '',
    plateNumber: '',
    gpsLat: PAKISTAN_CITIES[0].lat,
    gpsLng: PAKISTAN_CITIES[0].lng,
    isActive: true,
  });
  const [selectedCity, setSelectedCity] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadRoutes();
    loadDrivers();
    if (bus) {
      setFormData({
        routeId: bus.routeId,
        busType: bus.busType,
        totalSeats: bus.totalSeats,
        driverId: bus.driverId || '',
        driverName: bus.driverName,
        plateNumber: bus.plateNumber,
        gpsLat: bus.gpsLocation.latitude,
        gpsLng: bus.gpsLocation.longitude,
        isActive: bus.isActive,
      });
      
      // Determine if bus coordinates match a preset city
      const match = PAKISTAN_CITIES.find(
        c => Math.abs(c.lat - bus.gpsLocation.latitude) < 0.05 && Math.abs(c.lng - bus.gpsLocation.longitude) < 0.05
      );
      setSelectedCity(match ? match.name : 'Custom');
    } else {
      setSelectedCity(PAKISTAN_CITIES[0].name);
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

  const loadDrivers = async () => {
    try {
      const { data, error: err } = await supabase
        .from('profiles')
        .select('id, full_name')
        .eq('role', 'driver');
      
      if (err) throw err;
      setDrivers((data || []).map((d: any) => ({
        id: d.id,
        name: d.full_name || 'Unnamed Driver'
      })));
    } catch (err: any) {
      console.error('Failed to load drivers:', err.message);
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
        driverId: formData.driverId || undefined,
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

  return createPortal(
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100] p-4">
      <div className="bg-white rounded-lg max-w-5xl w-11/12 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b sticky top-0 bg-white">
          <h2 className="text-xl font-bold">{bus ? 'Edit Bus' : 'Add New Bus'}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X size={24} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-4 pb-20">
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
            <label className="block text-sm font-medium text-gray-700 mb-1">Assigned Driver *</label>
            <select
              value={formData.driverId}
              onChange={(e) => {
                const selectedId = e.target.value;
                const driver = drivers.find(d => d.id === selectedId);
                setFormData({ 
                  ...formData, 
                  driverId: selectedId,
                  driverName: driver ? driver.name : formData.driverName 
                });
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              disabled={loading}
            >
              <option value="">-- Select a driver --</option>
              {drivers.map(driver => (
                <option key={driver.id} value={driver.id}>
                  {driver.name}
                </option>
              ))}
              {/* Fallback for manually typed driver names from older records */}
              {!drivers.find(d => d.id === formData.driverId) && formData.driverName && (
                <option value={formData.driverId || 'legacy'} disabled>
                  {formData.driverName} (Legacy)
                </option>
              )}
            </select>
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

            <div className="flex items-center mt-2">
              <input
                type="checkbox"
                id="isActive"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                disabled={loading}
              />
              <label htmlFor="isActive" className="ml-2 block text-sm text-gray-900">
                Active / Available for Bookings
              </label>
            </div>
            
            </div> {/* End of left column */}

            {/* Right column: Map */}
            <div className="flex flex-col h-[500px]">
              <div className="flex justify-between items-end mb-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Bus Location (GPS)</label>
                  <p className="text-xs text-gray-500">Select a city or click anywhere on the map to drop a pin.</p>
                </div>
                <div className="w-1/2">
                  <select
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={selectedCity}
                    onChange={(e) => {
                      const city = PAKISTAN_CITIES.find(c => c.name === e.target.value);
                      if (city) {
                        setSelectedCity(city.name);
                        setFormData({ ...formData, gpsLat: city.lat, gpsLng: city.lng });
                      }
                    }}
                  >
                    <option value="" disabled>Jump to City...</option>
                    <option value="Custom" disabled>Custom Location</option>
                    {PAKISTAN_CITIES.map(city => (
                      <option key={city.name} value={city.name}>{city.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <LocationPickerMap 
                latitude={formData.gpsLat} 
                longitude={formData.gpsLng} 
                onLocationChange={(lat, lng) => {
                  setFormData({ ...formData, gpsLat: lat, gpsLng: lng });
                  // If clicked manually, we are in a custom location
                  setSelectedCity('Custom');
                }}
                height="100%"
              />
              <div className="flex gap-4 mt-2 text-xs text-gray-500">
                <span>Lat: {formData.gpsLat.toFixed(4)}</span>
                <span>Lng: {formData.gpsLng.toFixed(4)}</span>
              </div>
            </div>

          </div> {/* End of grid */}

          <div className="flex justify-end gap-3 pt-6 border-t mt-6">
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
    </div>,
    document.body
  );
}
