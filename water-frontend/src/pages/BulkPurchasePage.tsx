import React, { useState, useEffect } from 'react';
import { 
  Plus, Search, Download, Trash2, FileText, 
  TrendingUp, Activity, DollarSign, Loader2 
} from 'lucide-react';
import { billingService, type BulkWaterPurchase, type BillingCycle } from '../services/billingService';
import { getCommunityId } from '@/lib/auth';
import { toast } from 'sonner';

export default function BulkPurchasePage() {
  const communityId = Number(getCommunityId() || 0);

  const [purchases, setPurchases] = useState<BulkWaterPurchase[]>([]);
  const [cycles, setCycles] = useState<BillingCycle[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalElements, setTotalElements] = useState(0);
  
  // Filtering & Pagination state
  const [search, setSearch] = useState('');
  const [selectedCycleId, setSelectedCycleId] = useState<string>('');
  const [page, setPage] = useState(0);
  const [size] = useState(10);

  // New Purchase Modal/Form state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState({
    supplier: '',
    purchaseDate: new Date().toISOString().split('T')[0],
    volumeLitres: '',
    unitCost: '',
    invoiceReference: '',
    billingCycleId: '',
    remarks: ''
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchCycles();
  }, []);

  useEffect(() => {
    fetchPurchases();
  }, [page, search, selectedCycleId]);

  const fetchCycles = async () => {
    try {
      const data = await billingService.getBillingCycles(communityId);
      setCycles(data);
    } catch  {
      toast.error('Failed to load billing cycles');
    }
  };

  const fetchPurchases = async () => {
    setLoading(true);
    try {
      const params: any = {
        communityId,
        page,
        size
      };
      if (search) params.search = search;
      if (selectedCycleId) params.billingCycleId = Number(selectedCycleId);
      
      const data = await billingService.getBulkWaterPurchases(params);
      setPurchases(data.content);
      setTotalElements(data.totalElements);
    } catch  {
      toast.error('Failed to load bulk purchase history');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.supplier || !form.volumeLitres || !form.unitCost || !form.invoiceReference) {
      toast.error('Please fill in all required fields');
      return;
    }

    setSubmitting(true);
    try {
      const payload: Partial<BulkWaterPurchase> = {
        communityId,
        supplier: form.supplier,
        purchaseDate: form.purchaseDate,
        volumeLitres: Number(form.volumeLitres),
        unitCost: Number(form.unitCost),
        invoiceReference: form.invoiceReference,
        remarks: form.remarks,
        billingCycleId: form.billingCycleId ? Number(form.billingCycleId) : null
      };

      await billingService.createBulkWaterPurchase(payload);
      toast.success('Bulk purchase logged successfully');
      setIsModalOpen(false);
      setForm({
        supplier: '',
        purchaseDate: new Date().toISOString().split('T')[0],
        volumeLitres: '',
        unitCost: '',
        invoiceReference: '',
        billingCycleId: '',
        remarks: ''
      });
      fetchPurchases();
    } catch (e: any) {
      toast.error(e.response?.data || 'Failed to record purchase');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this purchase log?')) return;
    try {
      await billingService.deleteBulkWaterPurchase(id);
      toast.success('Log entry deleted');
      fetchPurchases();
    } catch  {
      toast.error('Failed to delete log entry');
    }
  };

  const totalCostSum = purchases.reduce((acc, curr) => acc + curr.totalCost, 0);
  const totalVolumeSum = purchases.reduce((acc, curr) => acc + curr.volumeLitres, 0);
  const avgCostPerLitre = totalVolumeSum > 0 ? (totalCostSum / totalVolumeSum).toFixed(2) : '0.00';

  return (
    <div className="p-6 space-y-6 text-slate-800">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[#0F4C81]">Bulk Water Purchase Tracking</h1>
          <p className="text-slate-500 text-sm">Track and manage tanker deliveries & municipal supplies.</p>
        </div>
        <div className="flex gap-3">
          <a
            href={billingService.exportBulkWaterPurchasesUrl(communityId, selectedCycleId ? Number(selectedCycleId) : undefined)}
            className="flex items-center gap-2 px-4 py-2 bg-slate-50 border border-slate-200/50 text-[#0F4C81] hover:bg-slate-100/80 rounded-xl transition font-semibold text-xs"
          >
            <Download className="w-4 h-4" /> Export CSV
          </a>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-xl shadow-lg hover:shadow-blue-500/20 transition"
          >
            <Plus className="w-4 h-4" /> Log Purchase
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white border border-slate-100 p-6 rounded-3xl shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-sm text-slate-500">Total Expenditure</span>
            <h3 className="text-2xl font-bold text-slate-800">₹{totalCostSum.toLocaleString('en-IN')}</h3>
          </div>
          <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-blue-500">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white border border-slate-100 p-6 rounded-3xl shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-sm text-slate-500">Total Volume Purchased</span>
            <h3 className="text-2xl font-bold text-slate-800">{totalVolumeSum.toLocaleString('en-IN')} L</h3>
          </div>
          <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-500">
            <Activity className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white border border-slate-100 p-6 rounded-3xl shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-sm text-slate-500">Average Unit Cost</span>
            <h3 className="text-2xl font-bold text-slate-800">₹{avgCostPerLitre} / L</h3>
          </div>
          <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center text-purple-500">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="bg-white border border-slate-100 p-4 rounded-3xl shadow-xs flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by supplier, invoice ref, remarks..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-50/50 border border-slate-100 rounded-xl pl-10 pr-4 py-2.5 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#00B4D8] transition text-xs font-semibold"
          />
        </div>
        <div className="w-full md:w-64">
          <select
            value={selectedCycleId}
            onChange={(e) => setSelectedCycleId(e.target.value)}
            className="w-full bg-slate-50/50 border border-slate-100 rounded-xl px-4 py-2.5 text-slate-800 focus:outline-none focus:border-[#00B4D8] transition text-xs font-semibold"
          >
            <option value="">Filter by Billing Cycle</option>
            {cycles.map((c) => (
              <option key={c.id} value={c.id}>{c.name} ({c.status})</option>
            ))}
          </select>
        </div>
      </div>

      {/* Purchases Table */}
      <div className="bg-white border border-slate-100 rounded-3xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/30 text-slate-500 text-xs font-semibold uppercase tracking-wider">
                <th className="px-6 py-4">Supplier</th>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Volume (L)</th>
                <th className="px-6 py-4">Unit Cost</th>
                <th className="px-6 py-4">Total Cost</th>
                <th className="px-6 py-4">Invoice Reference</th>
                <th className="px-6 py-4">Billing Cycle</th>
                <th className="px-6 py-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm text-slate-600">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-slate-400">
                    <div className="flex items-center justify-center gap-2">
                      <Loader2 className="w-5 h-5 animate-spin text-blue-500" /> Loading purchases...
                    </div>
                  </td>
                </tr>
              ) : purchases.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-slate-400">
                    No bulk purchases recorded yet.
                  </td>
                </tr>
              ) : (
                purchases.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/50 transition">
                    <td className="px-6 py-4 font-semibold text-slate-800">{p.supplier}</td>
                    <td className="px-6 py-4">{p.purchaseDate}</td>
                    <td className="px-6 py-4">{p.volumeLitres.toLocaleString()} L</td>
                    <td className="px-6 py-4">₹{p.unitCost}</td>
                    <td className="px-6 py-4 font-bold text-emerald-600">₹{p.totalCost.toLocaleString()}</td>
                    <td className="px-6 py-4 text-slate-500">{p.invoiceReference}</td>
                    <td className="px-6 py-4">
                      {p.billingCycleName ? (
                        <span className="px-2 py-1 bg-slate-100 text-slate-600 text-xs rounded-full border border-slate-200">
                          {p.billingCycleName}
                        </span>
                      ) : (
                        <span className="text-slate-400 text-xs">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleDelete(p.id!)}
                        className="text-red-500 hover:text-red-600 transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        <div className="px-6 py-4 border-t border-slate-100 flex justify-between items-center">
          <span className="text-xs text-slate-400">Total Records: {totalElements}</span>
          <div className="flex gap-2">
            <button
              onClick={() => setPage(p => Math.max(0, p - 1))}
              disabled={page === 0}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200/50 text-[#0F4C81] hover:bg-slate-100/80 rounded-xl transition text-xs font-semibold disabled:opacity-50"
            >
              Previous
            </button>
            <button
              onClick={() => setPage(p => p + 1)}
              disabled={(page + 1) * size >= totalElements}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200/50 text-[#0F4C81] hover:bg-slate-100/80 rounded-xl transition text-xs font-semibold disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Creation Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white border border-slate-100 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
              <h3 className="text-lg font-bold text-[#0F4C81]">Log Bulk Water Purchase</h3>
              <button 
                onClick={() => setIsModalOpen(false)} 
                className="text-slate-400 hover:text-slate-600 transition"
              >
                ✕
              </button>
            </div>
            
            <form onSubmit={handleCreate} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Supplier Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Municipal Supply, private water tankers Ltd"
                  value={form.supplier}
                  onChange={(e) => setForm({ ...form, supplier: e.target.value })}
                  className="w-full bg-slate-50/50 border border-slate-100 rounded-xl px-4 py-2.5 text-slate-800 text-xs font-semibold focus:outline-none focus:border-[#00B4D8]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Volume (Litres) *</label>
                  <input
                    type="number"
                    required
                    placeholder="Volume in Litres"
                    value={form.volumeLitres}
                    onChange={(e) => setForm({ ...form, volumeLitres: e.target.value })}
                    className="w-full bg-slate-50/50 border border-slate-100 rounded-xl px-4 py-2.5 text-slate-800 text-xs font-semibold focus:outline-none focus:border-[#00B4D8]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Unit Cost (₹/Litre) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="Rate per Litre"
                    value={form.unitCost}
                    onChange={(e) => setForm({ ...form, unitCost: e.target.value })}
                    className="w-full bg-slate-50/50 border border-slate-100 rounded-xl px-4 py-2.5 text-slate-800 text-xs font-semibold focus:outline-none focus:border-[#00B4D8]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Invoice/Reference Number *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. REF-10938"
                    value={form.invoiceReference}
                    onChange={(e) => setForm({ ...form, invoiceReference: e.target.value })}
                    className="w-full bg-slate-50/50 border border-slate-100 rounded-xl px-4 py-2.5 text-slate-800 text-xs font-semibold focus:outline-none focus:border-[#00B4D8]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Purchase Date *</label>
                  <input
                    type="date"
                    required
                    value={form.purchaseDate}
                    onChange={(e) => setForm({ ...form, purchaseDate: e.target.value })}
                    className="w-full bg-slate-50/50 border border-slate-100 rounded-xl px-4 py-2.5 text-slate-800 text-xs font-semibold focus:outline-none focus:border-[#00B4D8]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Associate to Billing Cycle</label>
                <select
                  value={form.billingCycleId}
                  onChange={(e) => setForm({ ...form, billingCycleId: e.target.value })}
                  className="w-full bg-slate-50/50 border border-slate-100 rounded-xl px-4 py-2.5 text-slate-800 focus:outline-none focus:border-[#00B4D8] text-xs font-semibold"
                >
                  <option value="">No Billing Cycle association</option>
                  {cycles.filter(c => c.status === 'ACTIVE').map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Remarks</label>
                <textarea
                  placeholder="Any additional remarks..."
                  value={form.remarks}
                  onChange={(e) => setForm({ ...form, remarks: e.target.value })}
                  className="w-full bg-slate-50/50 border border-slate-100 rounded-xl px-4 py-2.5 text-slate-800 focus:outline-none focus:border-[#00B4D8] text-xs font-semibold h-20 resize-none"
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
                  {submitting && <Loader2 className="w-4 h-4 animate-spin" />} Save Log
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
