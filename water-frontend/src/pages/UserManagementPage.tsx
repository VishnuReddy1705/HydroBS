import React, { useState, useEffect } from 'react';
import { Users, Search, Plus, Edit, Trash2, Shield, ToggleLeft, ToggleRight, Loader2, Building, RefreshCw, X, Check } from 'lucide-react';
import api from '@/api';
import { toast } from 'sonner';

interface UserItem {
  id: number;
  fullName: string;
  email: string;
  role: string;
  isActive: boolean;
  flatNumber: string | null;
  community: {
    id: number;
    name: string;
  } | null;
}

export default function UserManagementPage() {
  const [users, setUsers] = useState<UserItem[]>([]);
  const [communities, setCommunities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Create / Edit modal state
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<UserItem | null>(null);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('RESIDENT');
  const [communityId, setCommunityId] = useState('');
  const [flatNumber, setFlatNumber] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await api.get('/api/super-admin/users');
      setUsers(res.data || []);

      const comms = await api.get('/api/super-admin/communities');
      setCommunities(comms.data || []);
    } catch (err) {
      toast.error('Failed to load platform users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleOpenCreate = () => {
    setEditingUser(null);
    setFullName('');
    setEmail('');
    setPassword('');
    setRole('RESIDENT');
    setCommunityId('');
    setFlatNumber('');
    setShowModal(true);
  };

  const handleOpenEdit = (user: UserItem) => {
    setEditingUser(user);
    setFullName(user.fullName);
    setEmail(user.email);
    setPassword('');
    setRole(user.role);
    setCommunityId(user.community ? user.community.id.toString() : '');
    setFlatNumber(user.flatNumber || '');
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload: any = {
        fullName,
        email,
        role,
        communityId: communityId ? parseInt(communityId) : null,
        flatNumber: role === 'RESIDENT' ? flatNumber : null
      };

      if (password) {
        payload.password = password;
      }

      if (editingUser) {
        await api.put(`/api/super-admin/users/${editingUser.id}`, payload);
        toast.success('User updated successfully');
      } else {
        if (!password) {
          toast.error('Password is required for new users');
          setSubmitting(false);
          return;
        }
        payload.password = password;
        await api.post('/api/super-admin/users', payload);
        toast.success('User registered successfully');
      }
      setShowModal(false);
      fetchUsers();
    } catch (err: any) {
      toast.error(err.response?.data || 'Failed to process user operation');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleActive = async (id: number) => {
    try {
      await api.post(`/api/super-admin/users/${id}/toggle-active`);
      setUsers(prev => prev.map(u => u.id === id ? { ...u, isActive: !u.isActive } : u));
      toast.success('User state toggled successfully');
    } catch (err) {
      toast.error('Failed to toggle user status');
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to permanently delete this user? This will also remove their invoices, bills, and readings.')) return;
    try {
      await api.delete(`/api/super-admin/users/${id}`);
      setUsers(prev => prev.filter(u => u.id !== id));
      toast.success('User deleted successfully');
    } catch (err) {
      toast.error('Failed to delete user');
    }
  };

  // Search & filter
  const filtered = users.filter(u => {
    const query = searchQuery.toLowerCase();
    return u.fullName.toLowerCase().includes(query) || 
           u.email.toLowerCase().includes(query) || 
           (u.flatNumber && u.flatNumber.toLowerCase().includes(query)) ||
           (u.community && u.community.name.toLowerCase().includes(query));
  });

  return (
    <div className="space-y-6 text-[#1F2937] dot-grid-bg animate-fade-in select-none">
      
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div>
          <h3 className="text-xl font-bold gradient-text-animated">Platform User Management</h3>
          <p className="text-xs text-slate-500 font-medium mt-0.5">Manage administrators, community managers, and resident accounts</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={fetchUsers}
            className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold text-[#0F4C81] hover:text-[#00B4D8] bg-slate-50 border border-slate-200/50 rounded-xl hover:bg-slate-100/80 transition-all cursor-pointer shadow-xs"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Refresh</span>
          </button>
          <button
            onClick={handleOpenCreate}
            className="flex items-center gap-1.5 px-4 py-2 bg-[#0F4C81] hover:bg-[#00B4D8] text-white text-xxs font-extrabold rounded-2xl uppercase tracking-wider transition-all shadow-sm"
          >
            <Plus className="h-4 w-4" /> Register User
          </button>
        </div>
      </div>

      {/* Filters & Action Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative w-full md:w-80">
          <input
            type="text"
            placeholder="Search by name, email, community, flat..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white border border-slate-100 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-slate-700 font-semibold focus:outline-none focus:border-[#00B4D8]"
          />
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        </div>
      </div>

      {/* Users Table */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-16 bg-slate-50 border border-slate-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="clay-card overflow-hidden bg-white border border-slate-100">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-semibold">
              <thead className="bg-slate-50 text-slate-400 uppercase text-[9px] border-b border-slate-100">
                <tr>
                  <th className="px-6 py-4">User Details</th>
                  <th className="px-6 py-4">Community Scope</th>
                  <th className="px-6 py-4">Flat No</th>
                  <th className="px-6 py-4">Role Auth</th>
                  <th className="px-6 py-4">Active State</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-600">
                {filtered.map(user => (
                  <tr key={user.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <span className="block font-bold text-slate-800">{user.fullName}</span>
                      <span className="block text-[10px] text-slate-400 font-bold">{user.email}</span>
                    </td>
                    <td className="px-6 py-4 text-slate-500">
                      {user.community ? (
                        <span className="flex items-center gap-1">
                          <Building className="h-3.5 w-3.5 text-[#0F4C81]" />
                          {user.community.name}
                        </span>
                      ) : (
                        <span className="text-slate-400">N/A</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-slate-500 font-bold">
                      {user.flatNumber || <span className="text-slate-400">-</span>}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase border ${
                        user.role === 'SUPER_ADMIN' 
                          ? 'bg-rose-50 text-rose-600 border-rose-100'
                          : user.role === 'ADMIN'
                          ? 'bg-amber-50 text-amber-600 border-amber-100'
                          : 'bg-blue-50 text-[#0F4C81] border-blue-100'
                      }`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleToggleActive(user.id)}
                        className={`flex items-center gap-1 text-xxs font-extrabold uppercase ${
                          user.isActive ? 'text-emerald-500' : 'text-slate-400'
                        }`}
                      >
                        {user.isActive ? (
                          <>
                            <ToggleRight className="h-5 w-5" /> Enabled
                          </>
                        ) : (
                          <>
                            <ToggleLeft className="h-5 w-5" /> Disabled
                          </>
                        )}
                      </button>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenEdit(user)}
                          className="p-1.5 text-slate-400 hover:text-[#0F4C81] hover:bg-slate-100 rounded-xl transition-all"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(user.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* User Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-[#071321]/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-100 shadow-2xl max-w-lg w-full overflow-hidden animate-zoom-in">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h4 className="text-xs font-extrabold text-[#0F4C81] uppercase tracking-wider">
                {editingUser ? 'Edit User Credentials' : 'Register New User'}
              </h4>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-700">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs font-bold text-slate-600">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Full Name</label>
                <input
                  type="text"
                  placeholder="e.g. Ramesh Kumar"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-2.5 text-xs text-slate-700 font-semibold focus:outline-none focus:border-[#00B4D8]"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Email Address</label>
                  <input
                    type="email"
                    placeholder="name@domain.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-2.5 text-xs text-slate-700 font-semibold focus:outline-none focus:border-[#00B4D8]"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">
                    Password {editingUser && '(Leave blank to preserve)'}
                  </label>
                  <input
                    type="password"
                    placeholder={editingUser ? '••••••••' : 'Password string'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-2.5 text-xs text-slate-700 font-semibold focus:outline-none focus:border-[#00B4D8]"
                    required={!editingUser}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">System Role</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-100 rounded-xl px-3 py-2.5 text-xs text-slate-700 font-semibold focus:outline-none"
                  >
                    <option value="SUPER_ADMIN">Super Admin</option>
                    <option value="ADMIN">Community Admin</option>
                    <option value="RESIDENT">Resident Owner</option>
                  </select>
                </div>

                {role !== 'SUPER_ADMIN' && (
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Community</label>
                    <select
                      value={communityId}
                      onChange={(e) => setCommunityId(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-100 rounded-xl px-3 py-2.5 text-xs text-slate-700 font-semibold focus:outline-none"
                      required
                    >
                      <option value="">Select Target Community...</option>
                      {communities.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {role === 'RESIDENT' && (
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Flat Number</label>
                  <input
                    type="text"
                    placeholder="e.g. 402B"
                    value={flatNumber}
                    onChange={(e) => setFlatNumber(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-2.5 text-xs text-slate-700 font-semibold focus:outline-none focus:border-[#00B4D8]"
                    required
                  />
                </div>
              )}

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-xxs font-extrabold text-slate-500 uppercase tracking-wider hover:bg-slate-50 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex items-center gap-1.5 px-4 py-2 bg-[#0F4C81] hover:bg-[#00B4D8] text-white text-xxs font-extrabold rounded-xl uppercase tracking-wider transition-all"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" /> Submitting
                    </>
                  ) : (
                    <>
                      <Check className="h-3.5 w-3.5" /> Confirm Save
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
