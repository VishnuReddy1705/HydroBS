import React, { useState, useEffect } from 'react';
import { Bell, Check, Trash2, Archive, ShieldAlert, FileText, Settings, Volume2, Search, Filter, MailOpen, RefreshCw } from 'lucide-react';
import api from '@/api';
import { toast } from 'sonner';

interface NotificationItem {
  id: number;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  isArchived: boolean;
  createdAt: string;
}

export default function NotificationCenter() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('ALL'); // ALL, UNREAD, READ

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const res = await api.get('/api/notifications');
      setNotifications(res.data || []);
    } catch (err) {
      toast.error('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleMarkAsRead = async (id: number) => {
    try {
      await api.post(`/api/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
      toast.success('Notification marked as read');
    } catch (err) {
      toast.error('Failed to mark notification as read');
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await api.post('/api/notifications/read-all');
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      toast.success('All notifications marked as read');
    } catch (err) {
      toast.error('Failed to mark all as read');
    }
  };

  const handleArchive = async (id: number) => {
    try {
      await api.post(`/api/notifications/${id}/archive`);
      setNotifications(prev => prev.filter(n => n.id !== id));
      toast.success('Notification archived');
    } catch (err) {
      toast.error('Failed to archive notification');
    }
  };

  const handleArchiveAll = async () => {
    try {
      await api.post('/api/notifications/archive-all');
      setNotifications([]);
      toast.success('All notifications archived');
    } catch (err) {
      toast.error('Failed to archive all notifications');
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'BILL_GENERATED':
      case 'BILL_PAID':
      case 'PAYMENT_FAILED':
        return <FileText className="h-5 w-5 text-emerald-400" />;
      case 'HIGH_USAGE':
      case 'LEAK_DETECTED':
        return <ShieldAlert className="h-5 w-5 text-rose-400 animate-pulse" />;
      case 'SYSTEM_ANNOUNCEMENT':
        return <Volume2 className="h-5 w-5 text-cyan-400" />;
      default:
        return <Bell className="h-5 w-5 text-slate-400" />;
    }
  };

  // Filter & Search
  const filtered = notifications.filter(n => {
    const matchesSearch = n.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          n.message.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (filterType === 'UNREAD') return matchesSearch && !n.isRead;
    if (filterType === 'READ') return matchesSearch && n.isRead;
    return matchesSearch;
  });

  return (
    <div className="space-y-6 text-[#1F2937] dot-grid-bg animate-fade-in select-none">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div>
          <h3 className="text-xl font-bold gradient-text-animated">Notification Center</h3>
          <p className="text-xs text-slate-500 font-medium mt-0.5">Manage system alerts, water usage spikes, billing alerts and announcements</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={fetchNotifications}
            className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold text-[#0F4C81] hover:text-[#00B4D8] bg-slate-50 border border-slate-200/50 rounded-xl hover:bg-slate-100/80 transition-all cursor-pointer shadow-xs"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Refresh</span>
          </button>
          <button
            onClick={handleMarkAllAsRead}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#0F4C81]/10 text-[#0F4C81] hover:bg-[#0F4C81]/20 text-xxs font-extrabold rounded-xl uppercase tracking-wider transition-all"
          >
            <Check className="h-3.5 w-3.5" /> Mark All Read
          </button>
          <button
            onClick={handleArchiveAll}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 text-rose-600 hover:bg-rose-100 text-xxs font-extrabold rounded-xl uppercase tracking-wider transition-all"
          >
            <Archive className="h-3.5 w-3.5" /> Archive All
          </button>
        </div>
      </div>

      {/* Filters & Search Row */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative w-full md:w-80">
          <input
            type="text"
            placeholder="Search alerts or announcements..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white border border-slate-100 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-slate-700 font-semibold focus:outline-none focus:border-[#00B4D8]"
          />
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        </div>

        <div className="flex gap-1 bg-slate-100/80 p-1 rounded-2xl border border-slate-200/50">
          {['ALL', 'UNREAD', 'READ'].map(type => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`px-4 py-1.5 rounded-xl text-xxs font-extrabold uppercase tracking-wider transition-all ${
                filterType === type 
                  ? 'bg-white text-[#0F4C81] shadow-sm' 
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {/* Notifications List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-20 bg-slate-50 border border-slate-100 rounded-3xl animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 clay-card bg-white space-y-3">
          <div className="h-12 w-12 rounded-full bg-slate-50 flex items-center justify-center mx-auto text-slate-400">
            <Bell className="h-6 w-6" />
          </div>
          <div className="space-y-1">
            <h4 className="font-bold text-sm text-slate-700">No Notifications</h4>
            <p className="text-xs text-slate-400">All caught up! You don't have any matching alerts.</p>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(n => (
            <div
              key={n.id}
              className={`clay-card p-5 border flex items-start justify-between gap-4 transition-all duration-300 ${
                n.isRead ? 'bg-white/70 border-slate-100/50' : 'bg-gradient-to-r from-blue-50/30 to-cyan-50/20 border-blue-100/60 shadow-sm'
              }`}
            >
              <div className="flex items-start gap-4">
                <div className={`p-3 rounded-2xl ${n.isRead ? 'bg-slate-50 text-slate-400' : 'bg-blue-50 text-blue-500 animate-droplet'}`}>
                  {getIcon(n.type)}
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h4 className={`text-xs font-extrabold ${n.isRead ? 'text-slate-700' : 'text-[#0F4C81]'}`}>{n.title}</h4>
                    {!n.isRead && (
                      <span className="h-2 w-2 rounded-full bg-[#00B4D8] animate-pulse" />
                    )}
                  </div>
                  <p className="text-xxs text-slate-500 font-bold leading-relaxed">{n.message}</p>
                  <span className="block text-[10px] text-slate-400 font-bold mt-1">
                    {new Date(n.createdAt).toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="flex gap-1">
                {!n.isRead && (
                  <button
                    onClick={() => handleMarkAsRead(n.id)}
                    title="Mark as Read"
                    className="p-2 text-slate-400 hover:text-emerald-500 hover:bg-emerald-50 rounded-xl transition-all"
                  >
                    <MailOpen className="h-4 w-4" />
                  </button>
                )}
                <button
                  onClick={() => handleArchive(n.id)}
                  title="Archive Notification"
                  className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
                >
                  <Archive className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
