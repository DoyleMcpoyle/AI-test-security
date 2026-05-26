import { useEffect, useState } from 'react';
import { supabase, UserProfile } from '../../lib/supabase';
import { Users, Shield, Eye } from 'lucide-react';

export function UserManagement() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const { data } = await supabase
        .from('user_profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (data) setUsers(data);
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-purple-100 text-purple-700';
      case 'internal_case_manager':
        return 'bg-blue-100 text-blue-700';
      case 'internal_investigator':
        return 'bg-green-100 text-green-700';
      case 'external_case_manager':
        return 'bg-orange-100 text-orange-700';
      default:
        return 'bg-slate-100 text-slate-700';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">User Management</h1>
        <p className="text-slate-600 mt-2">Manage system users and their access levels</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200">
        <div className="px-6 py-4 border-b border-slate-200">
          <h2 className="text-lg font-semibold text-slate-900">All Users ({users.length})</h2>
        </div>
        <div className="divide-y divide-slate-200">
          {users.length === 0 ? (
            <div className="px-6 py-12 text-center text-slate-500">
              <Users className="w-16 h-16 mx-auto text-slate-300 mb-4" />
              <p>No users found</p>
            </div>
          ) : (
            users.map((user) => (
              <div key={user.id} className="px-6 py-5 hover:bg-slate-50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-lg font-semibold text-slate-900">{user.full_name}</h3>
                      <span
                        className={`px-3 py-1 text-xs font-medium rounded-full ${getRoleBadgeColor(
                          user.role
                        )}`}
                      >
                        {user.role.replace(/_/g, ' ')}
                      </span>
                    </div>
                    <div className="space-y-1 text-sm text-slate-600">
                      <p>{user.email}</p>
                      {user.organization && (
                        <p className="flex items-center">
                          <Shield className="w-4 h-4 mr-2 text-slate-400" />
                          {user.organization}
                        </p>
                      )}
                      <p className="text-xs text-slate-500">
                        Joined {new Date(user.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
        <div className="flex items-start">
          <Eye className="w-6 h-6 text-blue-600 mt-1 mr-3" />
          <div>
            <h3 className="font-semibold text-blue-900 mb-1">User Roles</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li><strong>Admin:</strong> Full system access including user management</li>
              <li><strong>Internal Case Manager:</strong> Access to all videos and investigations</li>
              <li><strong>Internal Investigator:</strong> Can review and adjudicate violations</li>
              <li><strong>External Case Manager:</strong> Limited to their organization's data</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
