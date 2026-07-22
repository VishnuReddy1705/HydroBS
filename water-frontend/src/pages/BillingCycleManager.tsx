import React, { useState, useEffect } from 'react';
import { 
  Plus, Calendar, Play, CheckCircle2, Archive, RotateCcw, 
  Trash2, Layers, Loader2, ArrowRight 
} from 'lucide-react';
import { billingService, type BillingCycle } from '../services/billingService';
import { getCommunityId, getRole } from '@/lib/auth';
import { toast } from 'sonner';

export default function BillingCycleManager() {
  const communityId = Number(getCommunityId() || 0);
  const role = getRole();

  const [cycles, setCycles] = useState<BillingCycle[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal / Form state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState({
    name: '',
    startDate: '',
    endDate: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [billingRunningId, setBillingRunningId] = useState<number | null>(null);

  useEffect(() => {
    fetchCycles();
  }, []);

  const fetchCycles = async () => {
    setLoading(true);
    try {
      const data = await billingService.getBillingCycles(communityId);
      setCycles(data);
    } catch  {
      toast.error('Failed to load billing cycles');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.startDate || !form.endDate) {
      toast.error('All fields are required');
      return;
    }

    setSubmitting(true);
    try {
      const payload: Partial<BillingCycle> = {
        communityId,
        name: form.name,
        startDate: form.startDate,
        endDate: form.endDate
      };

      await billingService.createBillingCycle(payload);
      toast.success('Billing cycle created successfully');
      setIsModalOpen(false);
      setForm({ name: '', startDate: '', endDate: '' });
      fetchCycles();
    } catch  {
      toast.error('Failed to create cycle');
    } finally {
      setSubmitting(false);
    }
  };

  const handleTransition = async (id: number, status: string) => {
    try {
      await billingService.transitionBillingCycle(id, status);
      toast.success(`Cycle status updated to ${status}`);
      fetchCycles();
    } catch (e: any) {
      toast.error(e.response?.data || 'Failed to update status');
    }
  };

  const handleReopen = async (id: number) => {
    try {
      await billingService.reopenBillingCycle(id);
      toast.success('Cycle reopened successfully');
      fetchCycles();
    } catch (e: any) {
      toast.error(e.response?.data || 'Failed to reopen cycle');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this billing cycle?')) return;
    try {
      await billingService.deleteBillingCycle(id);
      toast.success('Billing cycle deleted');
      fetchCycles();
    } catch  {
      toast.error('Failed to delete cycle');
    }
  };

  const triggerBillingRun = async (cycleId: number) => {
    setBillingRunningId(cycleId);
    try {
      await billingService.generateBills({
        scope: 'COMMUNITY',
        communityId,
        billingMonth: new Date().toISOString().split('T')[0].substring(0, 7), // fallback
        billingCycleId: cycleId,
        notes: 'Cycle billing engine invocation'
      });
      toast.success('Billing run completed successfully. Bills generated.');
      fetchCycles();
    } catch (e: any) {
      toast.error(e.response?.data || 'Billing run failed');
    } finally {
      setBillingRunningId(null);
    }
  };

  const getStatusStyle = (status: string) => {
    switch (status.toUpperCase()) {
      case 'OPEN':
        return 'bg-slate-100 text-slate-600 border-slate-200';
      case 'ACTIVE':
        return 'bg-blue-50 text-blue-600 border-blue-100';
      case 'FINALIZED':
        return 'bg-emerald-50 text-emerald-600 border-emerald-100';
      case 'ARCHIVED':
        return 'bg-purple-50 text-purple-600 border-purple-100';
      default:
        return 'bg-slate-100 text-slate-600 border-slate-200';
    }
  };

  return (
    <div className="p-6 space-y-6 text-slate-800">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[#0F4C81]">Billing Cycle Management</h1>
          <p className="text-slate-500 text-sm">Open, active, and finalize progressive water billing runs.</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-xl shadow-lg hover:shadow-blue-500/20 transition"
        >
          <Plus className="w-4 h-4" /> Create Cycle
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        </div>
      ) : cycles.length === 0 ? (
        <div className="bg-white border border-slate-100 p-12 text-center rounded-3xl shadow-xs">
          <Layers className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-slate-800">No Billing Cycles</h3>
          <p className="text-slate-400 mt-1 max-w-sm mx-auto">Create a billing cycle to begin tracking and generating community water bills.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {cycles.map((cycle) => (
            <div 
              key={cycle.id}
              className="bg-white border border-slate-100 p-6 rounded-3xl shadow-xs space-y-4 flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex justify-between items-start">
                  <h3 className="text-xl font-bold text-[#0F4C81] tracking-tight">{cycle.name}</h3>
                  <span className={`px-2.5 py-1 text-xs font-semibold rounded-full border ${getStatusStyle(cycle.status)}`}>
                    {cycle.status}
                  </span>
                </div>

                <div className="flex gap-4 text-xs text-slate-500">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>Start: {cycle.startDate}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                    <span>End: {cycle.endDate}</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="border-t border-slate-100 pt-4 flex flex-wrap gap-2 justify-between items-center">
                <div className="flex gap-2">
                  {cycle.status === 'OPEN' && (
                    <button
                      onClick={() => handleTransition(cycle.id!, 'ACTIVE')}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium rounded-lg transition"
                    >
                      <Play className="w-3 h-3" /> Activate Cycle
                    </button>
                  )}

                  {cycle.status === 'ACTIVE' && (
                    <>
                      <button
                        onClick={() => triggerBillingRun(cycle.id!)}
                        disabled={billingRunningId === cycle.id}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white text-xs font-medium rounded-lg transition disabled:opacity-50"
                      >
                        {billingRunningId === cycle.id ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <Layers className="w-3 h-3" />
                        )}
                        Run Billing Engine
                      </button>
                      <button
                        onClick={() => handleTransition(cycle.id!, 'FINALIZED')}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium rounded-lg transition"
                      >
                        <CheckCircle2 className="w-3 h-3" /> Finalize
                      </button>
                    </>
                  )}

                  {cycle.status === 'FINALIZED' && (
                    <>
                      <button
                        onClick={() => handleTransition(cycle.id!, 'ARCHIVED')}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white text-xs font-medium rounded-lg transition"
                      >
                        <Archive className="w-3 h-3" /> Archive
                      </button>
                      {role === 'ADMIN' && (
                        <button
                          onClick={() => handleReopen(cycle.id!)}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded-lg border border-slate-200 transition"
                        >
                          <RotateCcw className="w-3 h-3" /> Reopen
                        </button>
                      )}
                    </>
                  )}

                  {cycle.status === 'ARCHIVED' && role === 'ADMIN' && (
                    <button
                      onClick={() => handleReopen(cycle.id!)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded-lg border border-slate-200 transition"
                    >
                      <RotateCcw className="w-3 h-3" /> Reopen
                    </button>
                  )}
                </div>

                {cycle.status === 'OPEN' && (
                  <button
                    onClick={() => handleDelete(cycle.id!)}
                    className="text-red-500 hover:text-red-600 p-1.5 rounded hover:bg-red-50 transition"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white border border-slate-100 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
              <h3 className="text-lg font-bold text-[#0F4C81]">Create Billing Cycle</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 transition">✕</button>
            </div>
            
            <form onSubmit={handleCreate} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Cycle Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. July 2026 Water Billing"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full bg-slate-50/50 border border-slate-100 rounded-xl px-4 py-2.5 text-slate-800 text-xs font-semibold focus:outline-none focus:border-[#00B4D8]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Start Date *</label>
                <input
                  type="date"
                  required
                  value={form.startDate}
                  onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                  className="w-full bg-slate-50/50 border border-slate-100 rounded-xl px-4 py-2.5 text-slate-800 text-xs font-semibold focus:outline-none focus:border-[#00B4D8]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">End Date *</label>
                <input
                  type="date"
                  required
                  value={form.endDate}
                  onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                  className="w-full bg-slate-50/50 border border-slate-100 rounded-xl px-4 py-2.5 text-slate-800 text-xs font-semibold focus:outline-none focus:border-[#00B4D8]"
                />
              </div>

              <div className="flex gap-3 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-50 border border-slate-200/50 text-[#0F4C81] hover:bg-slate-100/80 rounded-xl transition text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl transition text-xs disabled:opacity-50 shadow-md hover:shadow-blue-500/20"
                >
                  {submitting && <Loader2 className="w-4 h-4 animate-spin" />} Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
