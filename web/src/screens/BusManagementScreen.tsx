import { useEffect, useState } from 'react';
import { adminBusService, DeleteImpact } from '../services/adminBusService';
import { Bus } from '../types';
import BusFormModal from './BusFormModal';
import { TableSkeleton } from '../components/LoadingSkeleton';
import { Trash2, Edit2, Plus } from 'lucide-react';

export default function BusManagementScreen() {
  const [buses, setBuses] = useState<Bus[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingBus, setEditingBus] = useState<Bus | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [deleteImpact, setDeleteImpact] = useState<DeleteImpact | null>(null);
  const [checkingDelete, setCheckingDelete] = useState<string | null>(null);
  const [deletingBus, setDeletingBus] = useState<string | null>(null);
  const [deactivatingBus, setDeactivatingBus] = useState<string | null>(null);

  useEffect(() => {
    loadBuses();
  }, []);

  const loadBuses = async () => {
    try {
      setLoading(true);
      const { data, error: err } = await adminBusService.getAllBuses();
      if (err) throw new Error(err);
      setBuses(data || []);
      setError(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const prepareDelete = async (busId: string) => {
    try {
      setCheckingDelete(busId);
      const { data, error: err } = await adminBusService.getBusDeleteImpact(busId);
      if (err) throw new Error(err);
      setDeleteImpact(data);
      setDeleteConfirm(busId);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setCheckingDelete(null);
    }
  };

  const handleDelete = async (busId: string) => {
    try {
      setDeletingBus(busId);
      const { error: err } = await adminBusService.deleteBus(busId);
      if (err) throw new Error(err);
      setBuses(buses.filter(b => b.id !== busId));
      setDeleteConfirm(null);
      setDeleteImpact(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setDeletingBus(null);
    }
  };

  const handleDeactivate = async (busId: string) => {
    try {
      setDeactivatingBus(busId);
      const { error: err } = await adminBusService.deactivateBus(busId);
      if (err) throw new Error(err);
      await loadBuses();
      setDeleteConfirm(null);
      setDeleteImpact(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Bus Management</h2>
          <p className="text-gray-600 text-sm mt-1">Total buses: {buses.length}</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition"
        >
          <Plus size={18} />
          Add Bus
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {loading ? (
        <TableSkeleton columns={7} />
      ) : buses.length === 0 ? (
        <div className="bg-gray-50 rounded-lg p-8 text-center">
          <p className="text-gray-600">No buses found. Create one to get started.</p>
        </div>
      ) : (
        <div className="overflow-x-auto bg-white rounded-lg shadow">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b">
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Fleet ID</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Type</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Driver</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Plate</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Seats</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Status</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {buses.map((bus) => (
                <tr key={bus.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm text-gray-900 font-mono">
                    <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded font-semibold text-xs border border-gray-200">
                      FLT-{bus.id.slice(0, 4).toUpperCase()}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">{bus.busType}</td>
                  <td className="px-6 py-4 text-sm text-gray-900">{bus.driverName}</td>
                  <td className="px-6 py-4 text-sm text-gray-900 font-mono">{bus.plateNumber}</td>
                  <td className="px-6 py-4 text-sm text-gray-900">{bus.totalSeats}</td>
                  <td className="px-6 py-4 text-sm">
                    <span
                      className={`px-2 py-1 rounded text-xs font-semibold ${
                        bus.isActive
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {bus.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setEditingBus(bus);
                          setShowForm(true);
                        }}
                        className="p-2 hover:bg-blue-50 text-blue-600 rounded transition"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => prepareDelete(bus.id)}
                        disabled={checkingDelete === bus.id}
                        className="p-2 hover:bg-red-50 text-red-600 rounded transition disabled:opacity-50"
                        aria-label="Delete bus"
                      >
                        {checkingDelete === bus.id ? (
                          <span className="block h-4 w-4 animate-spin rounded-full border-2 border-red-600 border-t-transparent" />
                        ) : (
                          <Trash2 size={16} />
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showForm && (
        <BusFormModal
          bus={editingBus}
          onClose={handleFormClose}
          onSave={handleFormSave}
        />
      )}

      {deleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm">
            <h3 className="text-lg font-bold mb-4">
              {deleteImpact?.hasActiveBookings ? 'Deactivate Bus Instead?' : 'Delete Bus?'}
            </h3>
            <p className="text-gray-600 mb-6">
              {deleteImpact?.hasActiveBookings
                ? `This bus has ${deleteImpact.activeBookingCount} active/current/future booking(s). It can be safely deleted after ${deleteImpact.safeDeleteAfter}. Deactivate it now to remove it from new availability while keeping existing tickets valid.`
                : 'This action cannot be undone.'}
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setDeleteConfirm(null);
                  setDeleteImpact(null);
                }}
                disabled={deletingBus === deleteConfirm || deactivatingBus === deleteConfirm}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded transition"
              >
                Cancel
              </button>
              {deleteImpact?.hasActiveBookings ? (
                <button
                  onClick={() => handleDeactivate(deleteConfirm)}
                  disabled={deactivatingBus === deleteConfirm}
                  className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded transition disabled:opacity-60"
                >
                  {deactivatingBus === deleteConfirm ? 'Deactivating...' : 'Deactivate'}
                </button>
              ) : (
                <button
                  onClick={() => handleDelete(deleteConfirm)}
                  disabled={deletingBus === deleteConfirm}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded transition disabled:opacity-60"
                >
                  {deletingBus === deleteConfirm ? 'Deleting...' : 'Delete'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
