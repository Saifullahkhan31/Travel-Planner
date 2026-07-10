import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { authService } from '../services/authService';
import { TableSkeleton } from '../components/LoadingSkeleton';
import { Shield, ShieldOff } from 'lucide-react';

interface UserProfile {
  id: string;
  email?: string;
  full_name: string;
  role: string;
}

export default function UserManagementScreen() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [promoting, setPromoting] = useState<string | null>(null);
  const [demoting, setDemoting] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'admin' | 'commuter'>('all');

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const { data, error: err } = await supabase
        .from('profiles')
        .select('id, full_name, role, email');

      if (err && err.message.includes('profiles.email')) {
        const { data: fallbackData, error: fallbackErr } = await supabase
          .from('profiles')
          .select('id, full_name, role');

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
    } catch (err: any) {
      setError(err.message);
      setDemoting(null);
    }
  };

  const filteredUsers = users.filter(u => {
    if (filter === 'admin') return u.role === 'admin';
    if (filter === 'commuter') return u.role === 'commuter';
    return true;
  });

  const adminCount = users.filter(u => u.role === 'admin').length;
  const commuterCount = users.filter(u => u.role === 'commuter').length;

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
          className={`px-4 py-2 rounded-lg transition ${
            filter === 'all'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-900 hover:bg-gray-300'
          }`}
        >
          All Users ({users.length})
        </button>
        <button
          onClick={() => setFilter('admin')}
          className={`px-4 py-2 rounded-lg transition ${
            filter === 'admin'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-900 hover:bg-gray-300'
          }`}
        >
          Admins ({adminCount})
        </button>
        <button
          onClick={() => setFilter('commuter')}
          className={`px-4 py-2 rounded-lg transition ${
            filter === 'commuter'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-900 hover:bg-gray-300'
          }`}
        >
          Commuters ({commuterCount})
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
                  <td className="px-6 py-4 text-sm">
                    <span
                      className={`px-2 py-1 rounded text-xs font-semibold ${
                        user.role === 'admin'
                          ? 'bg-purple-100 text-purple-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    N/A
                  </td>
                  <td className="px-6 py-4 text-sm">
                    {user.role === 'admin' ? (
                      <button
                        onClick={() => handleDemoteToUser(user.id)}
                        disabled={demoting === user.id}
                        className="flex items-center gap-1 px-3 py-1 bg-red-50 text-red-700 hover:bg-red-100 rounded transition disabled:opacity-50"
                      >
                        <ShieldOff size={14} />
                        {demoting === user.id ? 'Demoting...' : 'Demote'}
                      </button>
                    ) : (
                      <button
                        onClick={() => handlePromoteToAdmin(user.id)}
                        disabled={promoting === user.id}
                        className="flex items-center gap-1 px-3 py-1 bg-purple-50 text-purple-700 hover:bg-purple-100 rounded transition disabled:opacity-50"
                      >
                        <Shield size={14} />
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
          <li>• Use the buttons above to promote commuters to admins or demote admins to users</li>
        </ul>
      </div>
    </div>
  );
}
