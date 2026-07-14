import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { supabase } from '../lib/supabaseClient';
import { authService } from '../services/authService';
import { TableSkeleton } from '../components/LoadingSkeleton';
import { Shield, ShieldOff } from 'lucide-react';

interface UserProfile {
  id: string;
  email?: string;
  full_name: string;
  role: string;
  updated_at?: string;
}

export default function UserManagementScreen() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [promoting, setPromoting] = useState<string | null>(null);
  const [demoting, setDemoting] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'admin' | 'commuter' | 'driver'>('all');
  const [confirmDialog, setConfirmDialog] = useState<{ type: 'promote' | 'demote', userId: string, userName: string } | null>(null);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const { data, error: err } = await supabase
        .from('profiles')
        .select('id, full_name, role, email, updated_at');

      if (err && err.message.includes('profiles.email')) {
        const { data: fallbackData, error: fallbackErr } = await supabase
          .from('profiles')
          .select('id, full_name, role, updated_at');

        if (fallbackErr) throw fallbackErr;
        setUsers(fallbackData || []);
      } else {
        if (err) throw err;
        setUsers(data || []);
      }

      setError(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePromoteToAdmin = async (userId: string) => {
    try {
      setPromoting(userId);
      const { error: err } = await authService.promoteUserToAdmin(userId);
      if (err) throw new Error(err);
      await loadUsers();
      setPromoting(null);
      setConfirmDialog(null);
    } catch (err: any) {
      setError(err.message);
      setPromoting(null);
    }
  };

  const handleDemoteToUser = async (userId: string) => {
    try {
      setDemoting(userId);
      const { error: err } = await authService.demoteAdminToUser(userId);
      if (err) throw new Error(err);
      await loadUsers();
      setDemoting(null);
      setConfirmDialog(null);
    } catch (err: any) {
      setError(err.message);
      setDemoting(null);
    }
  };

  const filteredUsers = users.filter(u => {
    if (filter === 'admin') return u.role === 'admin';
    if (filter === 'commuter') return u.role === 'commuter';
    if (filter === 'driver') return u.role === 'driver' || u.role === 'inactive_driver';
    return true;
  });

  const adminCount = users.filter(u => u.role === 'admin').length;
  const commuterCount = users.filter(u => u.role === 'commuter').length;
  const driverCount = users.filter(u => u.role === 'driver' || u.role === 'inactive_driver').length;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">User Management</h2>
        <p className="text-gray-600 text-sm mt-1">Total users: {users.length} (Admins: {adminCount}, Users: {commuterCount})</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex gap-2">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
            filter === 'all' 
              ? 'border-blue-600 text-blue-600' 
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
        >
          All Users ({users.length})
        </button>
        <button
          onClick={() => setFilter('admin')}
          className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
            filter === 'admin' 
              ? 'border-blue-600 text-blue-600' 
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
        >
          Admins ({adminCount})
        </button>
        <button
          onClick={() => setFilter('commuter')}
          className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
            filter === 'commuter' 
              ? 'border-blue-600 text-blue-600' 
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
        >
          Commuters ({commuterCount})
        </button>
        <button
          onClick={() => setFilter('driver')}
          className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
            filter === 'driver' 
              ? 'border-blue-600 text-blue-600' 
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
        >
          Drivers ({driverCount})
        </button>
      </div>

      {loading ? (
        <TableSkeleton columns={5} />
      ) : filteredUsers.length === 0 ? (
        <div className="bg-gray-50 rounded-lg p-8 text-center">
          <p className="text-gray-600">No users found.</p>
        </div>
      ) : (
        <div className="overflow-x-auto bg-white rounded-lg shadow">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b">
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Name</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Email</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Role</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Joined</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm text-gray-900 font-medium">{user.full_name || 'N/A'}</td>
                  <td className="px-6 py-4 text-sm text-gray-900 font-mono">{user.email || 'N/A'}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {user.role === 'admin' && (
                        <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded text-xs font-semibold">
                          Admin
                        </span>
                      )}
                      {user.role === 'commuter' && (
                        <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded text-xs font-semibold">
                          Commuter
                        </span>
                      )}
                      {(user.role === 'driver' || user.role === 'inactive_driver') && (
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-semibold">
                          Driver
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">
                        {user.updated_at ? new Date(user.updated_at).toLocaleDateString() : 'N/A'}
                      </div>
                    </td>
                  <td className="px-6 py-4 text-sm">
                    {user.role === 'admin' ? (
                      <button
                        onClick={() => setConfirmDialog({ type: 'demote', userId: user.id, userName: user.full_name })}
                        disabled={demoting === user.id || promoting === user.id}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-700 hover:bg-red-100 rounded-md font-medium transition disabled:opacity-50"
                      >
                        <ShieldOff size={16} />
                        {demoting === user.id ? 'Demoting...' : 'Demote'}
                      </button>
                    ) : (
                      <button
                        onClick={() => setConfirmDialog({ type: 'promote', userId: user.id, userName: user.full_name })}
                        disabled={promoting === user.id || demoting === user.id}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-purple-50 text-purple-700 hover:bg-purple-100 rounded-md font-medium transition disabled:opacity-50"
                      >
                        <Shield size={16} />
                        {promoting === user.id ? 'Promoting...' : 'Promote'}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-semibold text-blue-900 mb-2">Role Management Info</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• <strong>Admin:</strong> Can create, edit, and delete buses, routes, and manage users</li>
          <li>• <strong>Commuter:</strong> Regular app user with read-only access</li>
          <li>• Use the buttons above to promote users to admins or demote admins to users</li>
        </ul>
      </div>

      {confirmDialog && createPortal(
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden p-6 text-center">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${confirmDialog.type === 'promote' ? 'bg-purple-100 text-purple-600' : 'bg-red-100 text-red-600'}`}>
              {confirmDialog.type === 'promote' ? <Shield size={32} /> : <ShieldOff size={32} />}
            </div>
            
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              {confirmDialog.type === 'promote' ? 'Promote User?' : 'Demote Admin?'}
            </h2>
            
            <p className="text-gray-600 mb-6">
              {confirmDialog.type === 'promote' 
                ? `You are about to grant full admin privileges to ${confirmDialog.userName}. They will have complete access to the web panel. Are you sure?`
                : `You are about to revoke admin privileges from ${confirmDialog.userName}. They will be demoted to a regular user. Are you sure?`
              }
            </p>
            
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => setConfirmDialog(null)}
                className="px-6 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg font-medium transition"
              >
                Cancel
              </button>
              <button
                onClick={() => confirmDialog.type === 'promote' ? handlePromoteToAdmin(confirmDialog.userId) : handleDemoteToUser(confirmDialog.userId)}
                className={`px-6 py-2 text-white rounded-lg font-medium transition ${confirmDialog.type === 'promote' ? 'bg-purple-600 hover:bg-purple-700' : 'bg-red-600 hover:bg-red-700'}`}
              >
                {confirmDialog.type === 'promote' ? 'Yes, Promote' : 'Yes, Demote'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
