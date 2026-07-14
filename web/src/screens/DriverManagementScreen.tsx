import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { supabase } from '../lib/supabaseClient';
import { TableSkeleton } from '../components/LoadingSkeleton';
import { Plus, Edit2, X } from 'lucide-react';
import DriverFormModal from './DriverFormModal';

interface UserProfile {
  id: string;
  email?: string;
  full_name: string;
  role: string;
}

export default function DriverManagementScreen() {
  const [drivers, setDrivers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDriverModal, setShowDriverModal] = useState(false);
  const [editingDriver, setEditingDriver] = useState<UserProfile | null>(null);

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

        if (fallbackErr) throw fallbackErr;
        setDrivers(fallbackData || []);
      } else {
        if (err) throw err;
        setDrivers(data || []);
      }

      setError(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Driver Management</h2>
          <p className="text-gray-600 text-sm mt-1">Total drivers: {drivers.length}</p>
        </div>
        <button
          onClick={() => setShowDriverModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition shadow-sm flex items-center gap-2"
        >
          <Plus size={20} />
          <span>Add Driver</span>
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {loading ? (
        <TableSkeleton rows={3} columns={3} />
      ) : (
        <div className="bg-white shadow-sm rounded-lg border overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {drivers.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                    No drivers found. Add one to get started.
                  </td>
                </tr>
              ) : (
                drivers.map((driver) => (
                  <tr key={driver.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{driver.full_name || 'N/A'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">{driver.email || 'N/A'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {driver.role === 'driver' ? (
                        <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-semibold">
                          Active
                        </span>
                      ) : (
                        <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded text-xs font-semibold">
                          Inactive
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => setEditingDriver(driver)}
                        className="text-blue-600 hover:text-blue-900 bg-blue-50 p-2 rounded transition"
                        title="Edit Driver"
                      >
                        <Edit2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {showDriverModal && (
        <DriverFormModal
          onClose={() => setShowDriverModal(false)}
          onSave={() => {
            setShowDriverModal(false);
            loadDrivers();
          }}
        />
      )}

      {editingDriver && (
        <EditDriverModal
          driver={editingDriver}
          onClose={() => setEditingDriver(null)}
          onSave={() => {
            setEditingDriver(null);
            loadDrivers();
          }}
        />
      )}
    </div>
  );
}

function EditDriverModal({ driver, onClose, onSave }: { driver: UserProfile, onClose: () => void, onSave: () => void }) {
  const [name, setName] = useState(driver.full_name);
  const [isActive, setIsActive] = useState(driver.role === 'driver');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      if (!name.trim()) throw new Error('Name is required');
      
      const newRole = isActive ? 'driver' : 'inactive_driver';
      const { error: err } = await supabase
        .from('profiles')
        .update({ full_name: name, role: newRole })
        .eq('id', driver.id);
        
      if (err) throw err;
      onSave();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100] p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
        <div className="flex justify-between items-center p-6 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-900">Edit Driver</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSave} className="p-6 space-y-5">
          {error && (
            <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={loading}
              placeholder="Driver's Full Name"
            />
          </div>

          <div className="flex items-center mt-2 bg-gray-50 p-4 rounded-lg border border-gray-200">
            <input
              type="checkbox"
              id="isActive"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              disabled={loading}
            />
            <label htmlFor="isActive" className="ml-2 block text-sm text-gray-900 font-medium">
              Active / Available for Assignments
            </label>
          </div>
          <p className="text-xs text-gray-500 italic mt-1">
            Unchecking this will deactivate the driver. They will not be deleted, but they can no longer be assigned to new buses.
          </p>

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
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
