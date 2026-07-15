import React, { useState, useEffect } from 'react';
import { 
  DollarSign, Percent, Settings, Plus, Trash2, CheckCircle, 
  AlertTriangle, RotateCw, Shield, Info, Edit, ArrowLeft, Disc
} from 'lucide-react';
import { billingService, type Tariff, type TariffSlab } from '../services/billingService';
import { getCommunityId } from '@/lib/auth';
import { toast } from 'sonner';

export default function TariffSettingsPage() {
  const communityId = Number(getCommunityId() || 0);
  const [tariffs, setTariffs] = useState<Tariff[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Editor mode
  const [isEditing, setIsEditing] = useState(false);
  const [editingTariff, setEditingTariff] = useState<Partial<Tariff> | null>(null);

  useEffect(() => {
    fetchTariffs();
  }, []);

  const fetchTariffs = async () => {
    try {
      setLoading(true);
      const data = await billingService.getTariffs(communityId);
      setTariffs(data);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to fetch tariff rules');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNew = () => {
    setEditingTariff({
      name: 'Standard Tariff Rules',
      model: 'PER_UNIT',
      baseCharge: 0,
      unitPrice: 5.0,
      minimumCharge: 0,
      serviceCharge: 150,
      maintenanceCharge: 100,
      sewageCharge: 50,
      taxPercentage: 18.0,
      lateFee: 50.0,
      penalty: 0,
      discount: 0,
      subsidy: 0,
      currency: 'INR',
      billingCycle: 'MONTHLY',
      dueDays: 15,
      isActive: true,
      slabs: []
    });
    setIsEditing(true);
  };

  const handleEdit = (tariff: Tariff) => {
    setEditingTariff({ ...tariff });
    setIsEditing(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTariff || !editingTariff.name) return;

    try {
      // Basic slab validation
      if (editingTariff.model === 'SLAB') {
        if (!editingTariff.slabs || editingTariff.slabs.length === 0) {
          toast.error('At least one slab is required for slab pricing model.');
          return;
        }
      }

      if (editingTariff.id) {
        await billingService.updateTariff(communityId, editingTariff.id, editingTariff);
        toast.success('Tariff updated successfully');
      } else {
        await billingService.createTariff(communityId, editingTariff);
        toast.success('Tariff rules created successfully');
      }

      setIsEditing(false);
      setEditingTariff(null);
      fetchTariffs();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to save tariff rules');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this tariff? This action is irreversible.')) return;
    try {
      await billingService.deleteTariff(communityId, id);
      toast.success('Tariff rules deleted');
      fetchTariffs();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to delete tariff');
    }
  };

  const handleAddSlab = () => {
    if (!editingTariff) return;
    const slabs = [...(editingTariff.slabs || [])];
    const prevEnd = slabs.length > 0 ? slabs[slabs.length - 1].rangeEnd : 0;
    
    slabs.push({
      rangeStart: prevEnd || 0,
      rangeEnd: null,
      ratePerUnit: 2.0
    });
    setEditingTariff({ ...editingTariff, slabs });
  };

  const handleRemoveSlab = (index: number) => {
    if (!editingTariff) return;
    const slabs = (editingTariff.slabs || []).filter((_, idx) => idx !== index);
    setEditingTariff({ ...editingTariff, slabs });
  };

  const handleSlabChange = (index: number, field: keyof TariffSlab, value: any) => {
    if (!editingTariff) return;
    const slabs = [...(editingTariff.slabs || [])];
    slabs[index] = { ...slabs[index], [field]: value };
    setEditingTariff({ ...editingTariff, slabs });
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#090d16] text-white">
        <RotateCw className="h-10 w-10 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#090d16] p-6 text-white md:p-10">
      <div className="mx-auto max-w-6xl">
        
        {/* Header */}
        <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent flex items-center gap-3">
              <Settings className="h-8 w-8 text-blue-500" />
              Community Tariff Settings
            </h1>
            <p className="mt-2 text-slate-400">
              Configure billing models, tax rules, late fees, and slab-based pricing tiers.
            </p>
          </div>
          {!isEditing && (
            <button
              onClick={handleCreateNew}
              className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold hover:bg-blue-700 transition"
            >
              <Plus className="h-4 w-4" /> Add New Tariff Config
            </button>
          )}
        </div>

        {isEditing && editingTariff ? (
          /* Editor UI */
          <form onSubmit={handleSave} className="rounded-xl border border-slate-800 bg-[#0e1626]/80 p-6 backdrop-blur-md">
            <div className="mb-6 flex items-center justify-between border-b border-slate-800 pb-4">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Edit className="h-5 w-5 text-blue-500" />
                {editingTariff.id ? 'Edit Tariff Rules' : 'Create Tariff Config'}
              </h2>
              <button
                type="button"
                onClick={() => { setIsEditing(false); setEditingTariff(null); }}
                className="flex items-center gap-2 text-slate-400 hover:text-white transition"
              >
                <ArrowLeft className="h-4 w-4" /> Back
              </button>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              {/* Row 1: Name and Model */}
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">Tariff Configuration Name</label>
                <input
                  type="text"
                  required
                  value={editingTariff.name || ''}
                  onChange={e => setEditingTariff({ ...editingTariff, name: e.target.value })}
                  placeholder="e.g. Standard Summer Rates"
                  className="w-full rounded-lg border border-slate-700 bg-[#162035] px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">Billing Model</label>
                <select
                  value={editingTariff.model || 'PER_UNIT'}
                  onChange={e => setEditingTariff({ ...editingTariff, model: e.target.value })}
                  className="w-full rounded-lg border border-slate-700 bg-[#162035] px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="FIXED">Fixed Monthly Price (Flat Fee)</option>
                  <option value="PER_UNIT">Per Litre Usage pricing</option>
                  <option value="SLAB">Slab Pricing (Tiered progressive pricing)</option>
                </select>
              </div>

              {/* Pricing breakdown options */}
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">Base Charge (₹)</label>
                <input
                  type="number"
                  step="0.01"
                  value={editingTariff.baseCharge ?? 0}
                  onChange={e => setEditingTariff({ ...editingTariff, baseCharge: parseFloat(e.target.value) })}
                  className="w-full rounded-lg border border-slate-700 bg-[#162035] px-4 py-2.5 text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">Water Unit Price (₹ / Litre)</label>
                <input
                  type="number"
                  step="0.001"
                  disabled={editingTariff.model === 'FIXED' || editingTariff.model === 'SLAB'}
                  value={editingTariff.unitPrice ?? 0}
                  onChange={e => setEditingTariff({ ...editingTariff, unitPrice: parseFloat(e.target.value) })}
                  className="w-full rounded-lg border border-slate-700 bg-[#162035] px-4 py-2.5 text-white disabled:opacity-50 focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">Minimum Monthly Charge (₹)</label>
                <input
                  type="number"
                  step="0.01"
                  value={editingTariff.minimumCharge ?? 0}
                  onChange={e => setEditingTariff({ ...editingTariff, minimumCharge: parseFloat(e.target.value) })}
                  className="w-full rounded-lg border border-slate-700 bg-[#162035] px-4 py-2.5 text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">Fixed Service Charge (₹)</label>
                <input
                  type="number"
                  step="0.01"
                  value={editingTariff.serviceCharge ?? 0}
                  onChange={e => setEditingTariff({ ...editingTariff, serviceCharge: parseFloat(e.target.value) })}
                  className="w-full rounded-lg border border-slate-700 bg-[#162035] px-4 py-2.5 text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">Maintenance Charge (₹)</label>
                <input
                  type="number"
                  step="0.01"
                  value={editingTariff.maintenanceCharge ?? 0}
                  onChange={e => setEditingTariff({ ...editingTariff, maintenanceCharge: parseFloat(e.target.value) })}
                  className="w-full rounded-lg border border-slate-700 bg-[#162035] px-4 py-2.5 text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">Sewage Charge (₹)</label>
                <input
                  type="number"
                  step="0.01"
                  value={editingTariff.sewageCharge ?? 0}
                  onChange={e => setEditingTariff({ ...editingTariff, sewageCharge: parseFloat(e.target.value) })}
                  className="w-full rounded-lg border border-slate-700 bg-[#162035] px-4 py-2.5 text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">Tax Percentage (%)</label>
                <input
                  type="number"
                  step="0.1"
                  value={editingTariff.taxPercentage ?? 0}
                  onChange={e => setEditingTariff({ ...editingTariff, taxPercentage: parseFloat(e.target.value) })}
                  className="w-full rounded-lg border border-slate-700 bg-[#162035] px-4 py-2.5 text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">Late Fee Interest (₹)</label>
                <input
                  type="number"
                  step="0.01"
                  value={editingTariff.lateFee ?? 0}
                  onChange={e => setEditingTariff({ ...editingTariff, lateFee: parseFloat(e.target.value) })}
                  className="w-full rounded-lg border border-slate-700 bg-[#162035] px-4 py-2.5 text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">Penalty Charge (₹)</label>
                <input
                  type="number"
                  step="0.01"
                  value={editingTariff.penalty ?? 0}
                  onChange={e => setEditingTariff({ ...editingTariff, penalty: parseFloat(e.target.value) })}
                  className="w-full rounded-lg border border-slate-700 bg-[#162035] px-4 py-2.5 text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">Discount Coupon Amount (₹)</label>
                <input
                  type="number"
                  step="0.01"
                  value={editingTariff.discount ?? 0}
                  onChange={e => setEditingTariff({ ...editingTariff, discount: parseFloat(e.target.value) })}
                  className="w-full rounded-lg border border-slate-700 bg-[#162035] px-4 py-2.5 text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">Water Subsidy Benefit (₹)</label>
                <input
                  type="number"
                  step="0.01"
                  value={editingTariff.subsidy ?? 0}
                  onChange={e => setEditingTariff({ ...editingTariff, subsidy: parseFloat(e.target.value) })}
                  className="w-full rounded-lg border border-slate-700 bg-[#162035] px-4 py-2.5 text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">Billing Cycle Frequency</label>
                <select
                  value={editingTariff.billingCycle || 'MONTHLY'}
                  onChange={e => setEditingTariff({ ...editingTariff, billingCycle: e.target.value })}
                  className="w-full rounded-lg border border-slate-700 bg-[#162035] px-4 py-2.5 text-white focus:outline-none"
                >
                  <option value="MONTHLY">Monthly</option>
                  <option value="BI_MONTHLY">Bi-Monthly</option>
                  <option value="QUARTERLY">Quarterly</option>
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">Due Days</label>
                <input
                  type="number"
                  value={editingTariff.dueDays ?? 15}
                  onChange={e => setEditingTariff({ ...editingTariff, dueDays: parseInt(e.target.value) })}
                  className="w-full rounded-lg border border-slate-700 bg-[#162035] px-4 py-2.5 text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">Currency</label>
                <input
                  type="text"
                  value={editingTariff.currency || 'INR'}
                  onChange={e => setEditingTariff({ ...editingTariff, currency: e.target.value })}
                  className="w-full rounded-lg border border-slate-700 bg-[#162035] px-4 py-2.5 text-white focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={editingTariff.isActive ?? true}
                  onChange={e => setEditingTariff({ ...editingTariff, isActive: e.target.checked })}
                  className="h-5 w-5 rounded bg-[#162035] border-slate-700 text-blue-500 focus:ring-0 focus:outline-none"
                />
                <label htmlFor="isActive" className="text-sm font-medium text-slate-300">
                  Set this tariff configuration as active
                </label>
              </div>
            </div>

            {/* Slab Pricing Section */}
            {editingTariff.model === 'SLAB' && (
              <div className="mt-8 border-t border-slate-800 pt-6">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="text-lg font-semibold flex items-center gap-2 text-indigo-400">
                    <Disc className="h-5 w-5" /> Slab Tiers Config
                  </h3>
                  <button
                    type="button"
                    onClick={handleAddSlab}
                    className="flex items-center gap-1.5 rounded bg-indigo-600 px-3 py-1.5 text-xs font-semibold hover:bg-indigo-700 transition"
                  >
                    <Plus className="h-3.5 w-3.5" /> Add Slab
                  </button>
                </div>

                <div className="space-y-3">
                  {(editingTariff.slabs || []).map((slab, index) => (
                    <div key={index} className="flex flex-wrap items-center gap-4 rounded-lg bg-[#162035] p-3">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-500">Tier {index + 1}:</span>
                      </div>
                      <div className="flex-1 min-w-[120px]">
                        <label className="text-[10px] uppercase text-slate-400 block mb-1">Range Start (Litres)</label>
                        <input
                          type="number"
                          step="0.01"
                          required
                          value={slab.rangeStart}
                          onChange={e => handleSlabChange(index, 'rangeStart', parseFloat(e.target.value))}
                          className="w-full rounded bg-[#0e1626] border border-slate-700 px-2 py-1 text-sm focus:outline-none"
                        />
                      </div>
                      <div className="flex-1 min-w-[120px]">
                        <label className="text-[10px] uppercase text-slate-400 block mb-1">Range End (Litres)</label>
                        <input
                          type="number"
                          step="0.01"
                          placeholder="Infinity"
                          value={slab.rangeEnd ?? ''}
                          onChange={e => handleSlabChange(index, 'rangeEnd', e.target.value ? parseFloat(e.target.value) : null)}
                          className="w-full rounded bg-[#0e1626] border border-slate-700 px-2 py-1 text-sm focus:outline-none"
                        />
                      </div>
                      <div className="flex-1 min-w-[120px]">
                        <label className="text-[10px] uppercase text-slate-400 block mb-1">Rate (₹ / Litre)</label>
                        <input
                          type="number"
                          step="0.01"
                          required
                          value={slab.ratePerUnit}
                          onChange={e => handleSlabChange(index, 'ratePerUnit', parseFloat(e.target.value))}
                          className="w-full rounded bg-[#0e1626] border border-slate-700 px-2 py-1 text-sm focus:outline-none"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveSlab(index)}
                        className="rounded p-1.5 text-red-400 hover:bg-red-500/10 hover:text-red-500 transition mt-4"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                  {(!editingTariff.slabs || editingTariff.slabs.length === 0) && (
                    <p className="text-center text-sm text-slate-500 py-4">No pricing slabs defined. Click "Add Slab" to begin.</p>
                  )}
                </div>
              </div>
            )}

            <div className="mt-8 border-t border-slate-800 pt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => { setIsEditing(false); setEditingTariff(null); }}
                className="rounded-lg border border-slate-700 px-5 py-2.5 text-sm font-semibold text-slate-300 hover:bg-slate-800 hover:text-white transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold hover:bg-blue-700 transition"
              >
                Save Configuration
              </button>
            </div>
          </form>
        ) : (
          /* Tariff List View */
          <div className="grid gap-6 md:grid-cols-2">
            {tariffs.map(tariff => (
              <div 
                key={tariff.id} 
                className={`relative rounded-xl border p-6 transition hover:shadow-lg ${
                  tariff.isActive 
                    ? 'border-blue-500/50 bg-[#0e1626]/90 shadow-blue-900/10' 
                    : 'border-slate-800 bg-[#0e1626]/40'
                }`}
              >
                {tariff.isActive && (
                  <span className="absolute top-4 right-4 flex items-center gap-1 rounded-full bg-blue-500/10 px-2.5 py-0.5 text-xs font-semibold text-blue-400">
                    <CheckCircle className="h-3 w-3" /> Active Tariff
                  </span>
                )}

                <h3 className="text-lg font-bold">{tariff.name}</h3>
                
                <div className="mt-4 space-y-2 text-sm text-slate-400">
                  <div className="flex justify-between">
                    <span>Pricing Model:</span>
                    <span className="font-semibold text-slate-200">{tariff.model}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Base Charge:</span>
                    <span className="font-semibold text-slate-200">₹{tariff.baseCharge.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Water Unit Price:</span>
                    <span className="font-semibold text-slate-200">₹{tariff.unitPrice.toFixed(3)} / L</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Taxes (Surcharge):</span>
                    <span className="font-semibold text-slate-200">{tariff.taxPercentage}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Fixed Fees (Serv/Maint):</span>
                    <span className="font-semibold text-slate-200">₹{(tariff.serviceCharge + tariff.maintenanceCharge).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Billing Frequency:</span>
                    <span className="font-semibold text-slate-200">{tariff.billingCycle}</span>
                  </div>
                </div>

                {tariff.model === 'SLAB' && tariff.slabs && tariff.slabs.length > 0 && (
                  <div className="mt-4 border-t border-slate-800/80 pt-3">
                    <h4 className="text-xs font-bold uppercase text-slate-500 mb-2">Tiers Summary</h4>
                    <div className="space-y-1.5 max-h-[100px] overflow-y-auto pr-1">
                      {tariff.slabs.map((slab, i) => (
                        <div key={i} className="flex justify-between text-xs text-slate-400 bg-slate-800/20 px-2 py-1 rounded">
                          <span>{slab.rangeStart}L to {slab.rangeEnd ? slab.rangeEnd + 'L' : '∞'}</span>
                          <span className="font-bold text-slate-300">₹{slab.ratePerUnit.toFixed(2)}/L</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="mt-6 flex justify-end gap-2 border-t border-slate-800/80 pt-4">
                  <button
                    onClick={() => handleEdit(tariff)}
                    className="rounded bg-slate-800 px-3 py-1.5 text-xs font-semibold hover:bg-slate-700 transition"
                  >
                    Edit Config
                  </button>
                  <button
                    onClick={() => handleDelete(tariff.id!)}
                    className="rounded bg-red-950/20 text-red-400 px-3 py-1.5 text-xs font-semibold hover:bg-red-900/30 hover:text-red-300 transition"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}

            {tariffs.length === 0 && (
              <div className="col-span-full rounded-xl border border-dashed border-slate-800 bg-[#0e1626]/20 p-12 text-center text-slate-500">
                <AlertTriangle className="mx-auto h-12 w-12 text-amber-500/60 mb-3" />
                <p className="text-base font-semibold text-slate-400">No Custom Tariffs Configured</p>
                <p className="mt-1 text-sm text-slate-500">The platform will default to community flat-rate parameters until a custom ruleset is configured.</p>
                <button
                  onClick={handleCreateNew}
                  className="mt-4 rounded-lg bg-blue-600/10 border border-blue-500/20 text-blue-400 px-4 py-2 text-xs font-semibold hover:bg-blue-600/20 transition"
                >
                  Create Custom Tariff Rule
                </button>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
