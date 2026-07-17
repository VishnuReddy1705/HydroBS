import React, { useState, useEffect } from 'react';
import { ShieldCheck, Search, Calendar, User, Info, ArrowLeft, ArrowRight, RefreshCw } from 'lucide-react';
import api from '@/api';
import { toast } from 'sonner';

interface AuditLogItem {
  id: number;
  userEmail: string;
  actionType: string;
  details: string;
  ipAddress: string;
  createdAt: string;
}

export default function AuditLogViewer() {
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Pagination
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const res = await api.get('/api/audit-logs', {
        params: {
          page,
          size: 15,
          search: searchQuery
        }
      });
      setLogs(res.data.content || []);
      setTotalPages(res.data.totalPages || 0);
      setTotalElements(res.data.totalElements || 0);
    } catch (err) {
      toast.error('Failed to load system audit trails');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [page]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(0);
    fetchLogs();
  };

  const getActionBadgeColor = (action: string) => {
    if (action.includes('LOGIN') || action.includes('LOGOUT')) return 'bg-blue-50 text-blue-600 border-blue-100';
    if (action.includes('UPDATE') || action.includes('EDIT')) return 'bg-amber-50 text-amber-600 border-amber-100';
    if (action.includes('CREATE') || action.includes('GENERATE')) return 'bg-emerald-50 text-emerald-600 border-emerald-100';
    if (action.includes('DELETE') || action.includes('REMOVE')) return 'bg-rose-50 text-rose-600 border-rose-100';
    return 'bg-slate-50 text-slate-600 border-slate-100';
  };

  return (
    <div className="space-y-6 text-[#1F2937] dot-grid-bg animate-fade-in select-none">
      
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div>
          <h3 className="text-xl font-bold gradient-text-animated">Platform Audit Trails</h3>
          <p className="text-xs text-slate-500 font-medium mt-0.5">Immutable audit logs recording actions across HydroBS billing engine and administration</p>
        </div>
        <button
          onClick={fetchLogs}
          className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold text-[#0F4C81] hover:text-[#00B4D8] bg-slate-50 border border-slate-200/50 rounded-xl hover:bg-slate-100/80 transition-all cursor-pointer shadow-xs"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          <span>Refresh</span>
        </button>
      </div>

      {/* Filter Row */}
      <form onSubmit={handleSearchSubmit} className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative w-full md:w-80">
          <input
            type="text"
            placeholder="Search by action type or user email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white border border-slate-100 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-slate-700 font-semibold focus:outline-none focus:border-[#00B4D8]"
          />
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        </div>
        <button
          type="submit"
          className="px-4 py-2 bg-[#0F4C81] hover:bg-[#00B4D8] text-white text-xxs font-extrabold rounded-xl uppercase tracking-wider transition-all"
        >
          Query Logs
        </button>
      </form>

      {/* Audit Logs Table */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-16 bg-slate-50 border border-slate-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : logs.length === 0 ? (
        <div className="text-center py-12 clay-card bg-white space-y-3">
          <div className="h-12 w-12 rounded-full bg-slate-50 flex items-center justify-center mx-auto text-slate-400">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <div className="space-y-1">
            <h4 className="font-bold text-sm text-slate-700">No Action Trails Found</h4>
            <p className="text-xs text-slate-400">No audit log records matching the specified filters exist.</p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="clay-card overflow-hidden bg-white border border-slate-100">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-semibold">
                <thead className="bg-slate-50 text-slate-400 uppercase text-[9px] border-b border-slate-100">
                  <tr>
                    <th className="px-6 py-4">Action Event</th>
                    <th className="px-6 py-4">Actor Email</th>
                    <th className="px-6 py-4">Event Details</th>
                    <th className="px-6 py-4">Client IP</th>
                    <th className="px-6 py-4">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-600">
                  {logs.map(log => (
                    <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase border ${
                          getActionBadgeColor(log.actionType)
                        }`}>
                          {log.actionType}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-700 font-bold flex items-center gap-1">
                        <User className="h-3.5 w-3.5 text-slate-400" />
                        {log.userEmail}
                      </td>
                      <td className="px-6 py-4 text-slate-500 font-semibold max-w-xs truncate" title={log.details}>
                        {log.details}
                      </td>
                      <td className="px-6 py-4 text-slate-400 font-mono text-[10px]">
                        {log.ipAddress}
                      </td>
                      <td className="px-6 py-4 text-slate-400 text-[10px] font-bold">
                        {new Date(log.createdAt).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex justify-between items-center px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-2xl">
              <span className="text-[10px] text-slate-400 font-bold">
                Showing page {page + 1} of {totalPages} ({totalElements} elements)
              </span>
              <div className="flex gap-2">
                <button
                  disabled={page === 0}
                  onClick={() => setPage(prev => Math.max(0, prev - 1))}
                  className="p-1.5 bg-white border border-slate-200/50 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:hover:bg-white text-slate-500 transition-all"
                >
                  <ArrowLeft className="h-4 w-4" />
                </button>
                <button
                  disabled={page >= totalPages - 1}
                  onClick={() => setPage(prev => Math.min(totalPages - 1, prev + 1))}
                  className="p-1.5 bg-white border border-slate-200/50 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:hover:bg-white text-slate-500 transition-all"
                >
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

    </div>
  );
}
