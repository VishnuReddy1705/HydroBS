import React, { useState, useEffect } from 'react';
import { Volume2, Calendar, Archive, Plus, Trash2, Send, Clock, Globe, ShieldAlert, RefreshCw } from 'lucide-react';
import api from '@/api';
import { toast } from 'sonner';

interface AnnouncementItem {
  id: number;
  title: string;
  content: string;
  publishDate: string;
  expiryDate: string | null;
  isArchived: boolean;
  author: {
    fullName: string;
  };
  community: {
    id: number;
    name: string;
  } | null;
}

export default function AnnouncementCenter() {
  const [announcements, setAnnouncements] = useState<AnnouncementItem[]>([]);
  const [communities, setCommunities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string>('');
  
  // Form State
  const [showAddForm, setShowAddForm] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [communityId, setCommunityId] = useState('');
  const [expiryDays, setExpiryDays] = useState('7');
  const [submitting, setSubmitting] = useState(false);

  const fetchAnnouncements = async () => {
    try {
      setLoading(true);
      const res = await api.get('/api/announcements');
      setAnnouncements(res.data || []);
      
      // Resolve current user role
      const meRes = await api.get('/api/users/me');
      setUserRole(meRes.data.role);

      if (meRes.data.role === 'SUPER_ADMIN') {
        const commsRes = await api.get('/api/super-admin/communities');
        setCommunities(commsRes.data || []);
      }
    } catch (err) {
      toast.error('Failed to load announcements');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    setSubmitting(true);
    try {
      const expiry = new Date();
      expiry.setDate(expiry.getDate() + parseInt(expiryDays));
      
      const payload: any = {
        title,
        content,
        expiryDate: expiry.toISOString()
      };

      if (communityId) {
        payload.communityId = communityId;
      }

      await api.post('/api/announcements', payload);
      toast.success('Announcement broadcasted successfully');
      setShowAddForm(false);
      setTitle('');
      setContent('');
      setCommunityId('');
      fetchAnnouncements();
    } catch (err) {
      toast.error('Failed to broadcast announcement');
    } finally {
      setSubmitting(false);
    }
  };

  const handleArchive = async (id: number) => {
    try {
      await api.post(`/api/announcements/${id}/archive`);
      setAnnouncements(prev => prev.filter(a => a.id !== id));
      toast.success('Announcement archived');
    } catch (err) {
      toast.error('Failed to archive announcement');
    }
  };

  const isEditable = userRole === 'SUPER_ADMIN' || userRole === 'ADMIN';

  return (
    <div className="space-y-6 text-[#1F2937] dot-grid-bg animate-fade-in select-none">
      
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div>
          <h3 className="text-xl font-bold gradient-text-animated">Community Announcements</h3>
          <p className="text-xs text-slate-500 font-medium mt-0.5">Global announcements and localized community notices</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={fetchAnnouncements}
            className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold text-[#0F4C81] hover:text-[#00B4D8] bg-slate-50 border border-slate-200/50 rounded-xl hover:bg-slate-100/80 transition-all cursor-pointer shadow-xs"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Refresh</span>
          </button>
          {isEditable && (
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="flex items-center gap-1.5 px-4 py-2 bg-[#0F4C81] hover:bg-[#00B4D8] text-white text-xxs font-extrabold rounded-2xl uppercase tracking-wider transition-all shadow-sm"
            >
              <Plus className="h-4 w-4" /> Create Broadcast
            </button>
          )}
        </div>
      </div>

      {/* Broadcast Creator Form */}
      {showAddForm && (
        <form onSubmit={handleCreate} className="clay-card p-6 border border-[#00B4D8]/20 bg-gradient-to-r from-cyan-50/10 to-blue-50/15 space-y-4">
          <h4 className="text-xs font-extrabold text-[#0F4C81] uppercase tracking-wider flex items-center gap-1.5">
            <Volume2 className="h-4 w-4 text-[#00B4D8]" /> Write New Announcement
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Title</label>
              <input
                type="text"
                placeholder="e.g. Scheduled Maintenance, Water Meter Upgrades"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-white border border-slate-100 rounded-xl px-4 py-2 text-xs font-semibold focus:outline-none focus:border-[#00B4D8]"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Expiry Policy</label>
                <select
                  value={expiryDays}
                  onChange={(e) => setExpiryDays(e.target.value)}
                  className="w-full bg-white border border-slate-100 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none"
                >
                  <option value="3">Expires in 3 Days</option>
                  <option value="7">Expires in 1 Week</option>
                  <option value="30">Expires in 1 Month</option>
                </select>
              </div>

              {userRole === 'SUPER_ADMIN' && (
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Scope</label>
                  <select
                    value={communityId}
                    onChange={(e) => setCommunityId(e.target.value)}
                    className="w-full bg-white border border-slate-100 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none"
                  >
                    <option value="">Global (All Communities)</option>
                    {communities.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase">Content Body</label>
            <textarea
              placeholder="Provide clean and detailed notification details..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={4}
              className="w-full bg-white border border-slate-100 rounded-xl px-4 py-2 text-xs font-semibold focus:outline-none focus:border-[#00B4D8]"
              required
            />
          </div>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="px-4 py-2 text-xxs font-extrabold text-slate-500 uppercase tracking-wider hover:bg-slate-50 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center gap-1.5 px-4 py-2 bg-[#0F4C81] hover:bg-[#00B4D8] text-white text-xxs font-extrabold rounded-xl uppercase tracking-wider transition-all"
            >
              <Send className="h-3.5 w-3.5" /> Broadcast Now
            </button>
          </div>
        </form>
      )}

      {/* Announcements List */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2].map(i => (
            <div key={i} className="h-28 bg-slate-50 border border-slate-100 rounded-3xl animate-pulse" />
          ))}
        </div>
      ) : announcements.length === 0 ? (
        <div className="text-center py-12 clay-card bg-white space-y-3">
          <div className="h-12 w-12 rounded-full bg-slate-50 flex items-center justify-center mx-auto text-slate-400">
            <Volume2 className="h-6 w-6" />
          </div>
          <div className="space-y-1">
            <h4 className="font-bold text-sm text-slate-700">No Announcements</h4>
            <p className="text-xs text-slate-400">No announcements have been published recently.</p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {announcements.map(a => (
            <div key={a.id} className="clay-card p-6 space-y-4 border border-slate-100 relative hover:border-[#00B4D8]/30 transition-all duration-300">
              <div className="flex justify-between items-start gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="text-sm font-extrabold text-[#0F4C81]">{a.title}</h4>
                    {a.community ? (
                      <span className="px-2.5 py-0.5 rounded-full bg-[#0F4C81]/5 text-[#0F4C81] border border-[#0F4C81]/10 text-[9px] font-extrabold uppercase">
                        {a.community.name}
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded-full bg-cyan-50 text-cyan-600 border border-cyan-100 text-[9px] font-extrabold uppercase flex items-center gap-1">
                        <Globe className="h-3 w-3" /> Global
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-slate-400 font-bold flex items-center gap-1">
                    By {a.author.fullName} • Published {new Date(a.publishDate).toLocaleDateString()}
                  </p>
                </div>

                {isEditable && (
                  <button
                    onClick={() => handleArchive(a.id)}
                    title="Archive Announcement"
                    className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
                  >
                    <Archive className="h-4 w-4" />
                  </button>
                )}
              </div>

              <p className="text-xs text-slate-600 font-semibold leading-relaxed whitespace-pre-wrap">
                {a.content}
              </p>

              {a.expiryDate && (
                <div className="pt-2 border-t border-slate-50 flex items-center gap-1 text-[10px] text-slate-400 font-bold">
                  <Clock className="h-3.5 w-3.5" />
                  <span>Notice expires on {new Date(a.expiryDate).toLocaleDateString()}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

    </div>
  );
}
