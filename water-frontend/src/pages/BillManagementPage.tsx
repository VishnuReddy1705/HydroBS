import React, { useState, useEffect } from 'react';
import { 
  FileText, Search, Plus, Filter, Download, Mail, Edit3, 
  RotateCw, CheckCircle, XCircle, AlertTriangle, Eye, RefreshCw,
  Printer, ArrowRight, User, Settings, Info, ChevronLeft, ChevronRight
} from 'lucide-react';
import { billingService, type Bill } from '../services/billingService';
import { getCommunityId, getRole } from '@/lib/auth';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

export default function BillManagementPage() {
  const navigate = useNavigate();
  const communityId = Number(getCommunityId() || 0);
  const role = getRole();

  const [bills, setBills] = useState<Bill[]>([]);
  const [totalElements, setTotalElements] = useState(0);
  const [page, setPage] = useState(0);
  const [size] = useState(10);
  const [loading, setLoading] = useState(true);

  // Filters state
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [monthFilter, setMonthFilter] = useState(new Date().toISOString().substring(0, 7)); // yyyy-MM

  // Modals state
  const [showGenModal, setShowGenModal] = useState(false);
  const [genScope, setGenScope] = useState<'SINGLE_RESIDENT' | 'BUILDING' | 'COMMUNITY' | 'SYSTEM'>('COMMUNITY');
  const [genResidentId, setGenResidentId] = useState('');
  const [genBuilding, setGenBuilding] = useState('');
  const [genMonth, setGenMonth] = useState(new Date().toISOString().substring(0, 7));
  const [genNotes, setGenNotes] = useState('');
  const [generating, setGenerating] = useState(false);

  // Revision state
  const [showReviseModal, setShowReviseModal] = useState(false);
  const [selectedBill, setSelectedBill] = useState<Bill | null>(null);
  const [reviseReason, setReviseReason] = useState('');
  const [reviseAmount, setReviseAmount] = useState('');
  const [reviseTax, setReviseTax] = useState('');
  const [reviseLateFee, setReviseLateFee] = useState('');
  const [revisePenalty, setRevisePenalty] = useState('');
  const [reviseDiscount, setReviseDiscount] = useState('');
  const [reviseSubsidy, setReviseSubsidy] = useState('');
  const [reviseService, setReviseService] = useState('');
  const [reviseMaintenance, setReviseMaintenance] = useState('');
  const [reviseSewage, setReviseSewage] = useState('');
  const [revising, setRevising] = useState(false);

  useEffect(() => {
    fetchBills();
  }, [page, statusFilter, monthFilter]);

  const fetchBills = async () => {
    try {
      setLoading(true);
      const params = {
        communityId: role === 'SUPER_ADMIN' ? undefined : communityId,
        billNumber: searchTerm ? searchTerm : undefined,
        status: statusFilter !== 'ALL' ? statusFilter : undefined,
        billingMonth: monthFilter ? monthFilter : undefined,
        page,
        size
      };
      const data = await billingService.searchBills(params);
      setBills(data.content || []);
      setTotalElements(data.totalElements || 0);
    } catch (err: any) {
      toast.error('Failed to search utility bills');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(0);
    fetchBills();
  };

  const handleGenerateBills = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setGenerating(true);
      const payload = {
        scope: genScope,
        communityId: role === 'SUPER_ADMIN' ? undefined : communityId,
        residentId: genScope === 'SINGLE_RESIDENT' ? Number(genResidentId) : undefined,
        building: genScope === 'BUILDING' ? genBuilding : undefined,
        billingMonth: genMonth,
        notes: genNotes
      };
      await billingService.generateBills(payload);
      toast.success('Billing run completed successfully');
      setShowGenModal(false);
      fetchBills();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Billing run failed');
    } finally {
      setGenerating(false);
    }
  };

  const handleOpenRevision = (bill: Bill) => {
    setSelectedBill(bill);
    setReviseReason('');
    setReviseAmount(bill.amount.toString());
    setReviseTax(bill.taxAmount.toString());
    setReviseLateFee(bill.lateFee.toString());
    setRevisePenalty(bill.penalty.toString());
    setReviseDiscount(bill.discountAmount.toString());
    setReviseSubsidy(bill.subsidyAmount.toString());
    setReviseService(bill.serviceCharge.toString());
    setReviseMaintenance(bill.maintenanceCharge.toString());
    setReviseSewage(bill.sewageCharge.toString());
    setShowReviseModal(true);
  };

  const handleSaveRevision = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBill || !reviseReason) return;
    try {
      setRevising(true);
      const payload = {
        reason: reviseReason,
        amount: reviseAmount ? parseFloat(reviseAmount) : undefined,
        taxAmount: reviseTax ? parseFloat(reviseTax) : undefined,
        lateFee: reviseLateFee ? parseFloat(reviseLateFee) : undefined,
        penalty: revisePenalty ? parseFloat(revisePenalty) : undefined,
        discountAmount: reviseDiscount ? parseFloat(reviseDiscount) : undefined,
        subsidyAmount: reviseSubsidy ? parseFloat(reviseSubsidy) : undefined,
        serviceCharge: reviseService ? parseFloat(reviseService) : undefined,
        maintenanceCharge: reviseMaintenance ? parseFloat(reviseMaintenance) : undefined,
        sewageCharge: reviseSewage ? parseFloat(reviseSewage) : undefined
      };
      await billingService.reviseBill(selectedBill.id, payload);
      toast.success('Bill revision logged and applied');
      setShowReviseModal(false);
      fetchBills();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Revision failed');
    } finally {
      setRevising(false);
    }
  };

  const handleEmailInvoice = async (id: number) => {
    try {
      await billingService.triggerEmail(id);
      toast.success('Email invoice notification dispatched');
    } catch (err: any) {
      toast.error('Failed to send invoice email');
    }
  };

  const exportToCSV = () => {
    if (bills.length === 0) return;
    const headers = ['Invoice Number', 'Bill Number', 'Resident Name', 'Flat', 'Billing Month', 'Water Used (L)', 'Subtotal (INR)', 'Status'];
    const rows = bills.map(b => [
      b.invoiceNumber,
      b.billNumber,
      b.residentName,
      `${b.building}-${b.flatNumber}`,
      b.billingMonth,
      b.totalUsage,
      b.amount,
      b.status
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `billing_report_${monthFilter}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-[#090d16] p-6 text-white md:p-10">
      <div className="mx-auto max-w-7xl">
        
        {/* Header */}
        <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent flex items-center gap-3">
              <FileText className="h-8 w-8 text-blue-500" />
              Bill Management
            </h1>
            <p className="mt-2 text-slate-400">
              Generate utility bills, revision invoices, manage statuses, and view audit reports.
            </p>
          </div>
          
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => navigate('/admin/billing-settings')}
              className="flex items-center gap-2 rounded-lg border border-slate-700 bg-[#0e1626] px-4 py-2 text-sm font-semibold hover:bg-slate-800 transition"
            >
              <Settings className="h-4 w-4" /> Pricing Config
            </button>
            <button
              onClick={() => setShowGenModal(true)}
              className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold hover:bg-blue-700 transition"
            >
              <Plus className="h-4 w-4" /> Run Billing Cycle
            </button>
          </div>
        </div>

        {/* Filters Panel */}
        <div className="mb-6 rounded-xl border border-slate-800 bg-[#0e1626]/80 p-4 backdrop-blur-md">
          <form onSubmit={handleSearchSubmit} className="flex flex-wrap items-center gap-4">
            <div className="flex-1 min-w-[240px] relative">
              <span className="absolute inset-y-0 left-3 flex items-center text-slate-500">
                <Search className="h-4 w-4" />
              </span>
              <input
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Search by Bill / Invoice number..."
                className="w-full rounded-lg border border-slate-700 bg-[#162035] pl-10 pr-4 py-2 text-sm text-white placeholder-slate-500 focus:outline-none"
              />
            </div>

            <div className="min-w-[150px]">
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-[#162035] px-3 py-2 text-sm focus:outline-none"
              >
                <option value="ALL">All Statuses</option>
                <option value="DRAFT">Draft</option>
                <option value="GENERATED">Generated</option>
                <option value="SENT">Sent</option>
                <option value="PAID">Paid</option>
                <option value="OVERDUE">Overdue</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>

            <div className="min-w-[150px]">
              <input
                type="month"
                value={monthFilter}
                onChange={e => setMonthFilter(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-[#162035] px-3 py-2 text-sm focus:outline-none"
              />
            </div>

            <button
              type="submit"
              className="rounded-lg bg-slate-800 hover:bg-slate-700 px-4 py-2 text-sm font-semibold flex items-center gap-2 transition"
            >
              <Filter className="h-4 w-4" /> Filter
            </button>

            <button
              type="button"
              onClick={exportToCSV}
              className="rounded-lg border border-slate-700 px-4 py-2 text-sm font-semibold flex items-center gap-2 hover:bg-slate-800 transition"
            >
              <Download className="h-4 w-4" /> Export CSV
            </button>
          </form>
        </div>

        {/* Enterprise Data Table */}
        <div className="overflow-hidden rounded-xl border border-slate-800 bg-[#0e1626]/80 backdrop-blur-md">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-[#162035]/50 text-xs font-bold uppercase tracking-wider text-slate-400">
                  <th className="p-4">Invoice / Bill No</th>
                  <th className="p-4">Resident</th>
                  <th className="p-4">Flat Info</th>
                  <th className="p-4 text-center">Month</th>
                  <th className="p-4 text-right">Water (L)</th>
                  <th className="p-4 text-right">Payable (₹)</th>
                  <th className="p-4 text-center">Status</th>
                  <th className="p-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-sm">
                {bills.map(bill => (
                  <tr key={bill.id} className="hover:bg-slate-800/20 transition">
                    <td className="p-4">
                      <div className="font-semibold">{bill.invoiceNumber || `INV-${bill.id}`}</div>
                      <div className="text-xs text-slate-500">{bill.billNumber}</div>
                    </td>
                    <td className="p-4 font-medium">{bill.residentName}</td>
                    <td className="p-4 text-slate-300">
                      {bill.building}-{bill.flatNumber}
                    </td>
                    <td className="p-4 text-center font-medium text-slate-400">{bill.billingMonth.substring(0, 7)}</td>
                    <td className="p-4 text-right font-semibold">{bill.totalUsage.toFixed(0)} L</td>
                    <td className="p-4 text-right font-extrabold text-blue-400">₹{bill.amount.toFixed(2)}</td>
                    <td className="p-4 text-center">
                      <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        bill.status === 'PAID' ? 'bg-emerald-500/10 text-emerald-400' :
                        bill.status === 'OVERDUE' ? 'bg-red-500/10 text-red-400' :
                        bill.status === 'CANCELLED' ? 'bg-slate-800 text-slate-400' :
                        'bg-amber-500/10 text-amber-400'
                      }`}>
                        {bill.status}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => navigate(`/admin/billing/${bill.id}`)}
                          title="View Invoice Details"
                          className="rounded p-1 text-slate-400 hover:bg-slate-700/50 hover:text-white"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleOpenRevision(bill)}
                          title="Revise Invoice"
                          className="rounded p-1 text-slate-400 hover:bg-slate-700/50 hover:text-white"
                        >
                          <Edit3 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleEmailInvoice(bill.id)}
                          title="Send Email Reminder"
                          className="rounded p-1 text-slate-400 hover:bg-slate-700/50 hover:text-white"
                        >
                          <Mail className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

                {bills.length === 0 && !loading && (
                  <tr>
                    <td colSpan={8} className="p-12 text-center text-slate-500">
                      <Info className="mx-auto h-10 w-10 text-slate-600 mb-3" />
                      <p>No billing records matching the selection criteria were found.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          <div className="flex items-center justify-between border-t border-slate-800 p-4">
            <div className="text-xs text-slate-400">
              Showing page {page + 1} of {Math.ceil(totalElements / size) || 1} ({totalElements} total entries)
            </div>
            <div className="flex items-center gap-2">
              <button
                disabled={page === 0}
                onClick={() => setPage(page - 1)}
                className="rounded border border-slate-800 bg-[#162035] p-1.5 hover:bg-slate-800 disabled:opacity-40 transition"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                disabled={bills.length < size}
                onClick={() => setPage(page + 1)}
                className="rounded border border-slate-800 bg-[#162035] p-1.5 hover:bg-slate-800 disabled:opacity-40 transition"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Generate Bills Modal (Wizard) */}
        {showGenModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <form onSubmit={handleGenerateBills} className="w-full max-w-md rounded-xl border border-slate-800 bg-[#0e1626] p-6 text-white shadow-2xl">
              <h3 className="text-xl font-bold flex items-center gap-2 text-blue-400 mb-4">
                <RefreshCw className="h-5 w-5 animate-spin-slow" /> Generate Monthly Invoices
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-300">Run Scope</label>
                  <select
                    value={genScope}
                    onChange={e => setGenScope(e.target.value as any)}
                    className="w-full rounded-lg border border-slate-700 bg-[#162035] px-3 py-2 text-sm focus:outline-none"
                  >
                    <option value="COMMUNITY">Entire Community</option>
                    <option value="BUILDING">Entire Building</option>
                    <option value="SINGLE_RESIDENT">Single Resident</option>
                    {role === 'SUPER_ADMIN' && <option value="SYSTEM">Entire System (All Communities)</option>}
                  </select>
                </div>

                {genScope === 'SINGLE_RESIDENT' && (
                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-300">Resident ID</label>
                    <input
                      type="number"
                      required
                      value={genResidentId}
                      onChange={e => setGenResidentId(e.target.value)}
                      placeholder="e.g. 12"
                      className="w-full rounded-lg border border-slate-700 bg-[#162035] px-3 py-2 text-sm focus:outline-none"
                    />
                  </div>
                )}

                {genScope === 'BUILDING' && (
                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-300">Building / Tower Name</label>
                    <input
                      type="text"
                      required
                      value={genBuilding}
                      onChange={e => setGenBuilding(e.target.value)}
                      placeholder="e.g. Tower A"
                      className="w-full rounded-lg border border-slate-700 bg-[#162035] px-3 py-2 text-sm focus:outline-none"
                    />
                  </div>
                )}

                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-300">Billing Period</label>
                  <input
                    type="month"
                    required
                    value={genMonth}
                    onChange={e => setGenMonth(e.target.value)}
                    className="w-full rounded-lg border border-slate-700 bg-[#162035] px-3 py-2 text-sm focus:outline-none"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-300">Notes / Comments</label>
                  <textarea
                    value={genNotes}
                    onChange={e => setGenNotes(e.target.value)}
                    placeholder="Invoice remarks (printed on bill)..."
                    className="w-full rounded-lg border border-slate-700 bg-[#162035] px-3 py-2 text-sm focus:outline-none h-20 resize-none"
                  />
                </div>

                <div className="flex items-center gap-2 rounded bg-amber-500/10 p-3 border border-amber-500/20 text-xs text-amber-400">
                  <AlertTriangle className="h-4 w-4 shrink-0" />
                  <span>Existing bills for the matching criteria will be overwritten and recalculated.</span>
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowGenModal(false)}
                  className="rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-300 hover:bg-slate-800 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={generating}
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm hover:bg-blue-700 transition flex items-center gap-1.5"
                >
                  {generating ? <RotateCw className="h-4 w-4 animate-spin" /> : null}
                  {generating ? 'Processing...' : 'Run Generation'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Revise Bill Modal */}
        {showReviseModal && selectedBill && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <form onSubmit={handleSaveRevision} className="w-full max-w-lg rounded-xl border border-slate-800 bg-[#0e1626] p-6 text-white shadow-2xl overflow-y-auto max-h-[90vh]">
              <h3 className="text-xl font-bold flex items-center gap-2 text-indigo-400 mb-4">
                <Edit3 className="h-5 w-5" /> Adjust & Revise Invoice
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-300">Revision Reason (Required)</label>
                  <input
                    type="text"
                    required
                    value={reviseReason}
                    onChange={e => setReviseReason(e.target.value)}
                    placeholder="e.g. Subsidy rebate update, incorrect reading adjustment"
                    className="w-full rounded-lg border border-slate-700 bg-[#162035] px-3 py-2 text-sm focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-400">Total Payable Amount (₹)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={reviseAmount}
                      onChange={e => setReviseAmount(e.target.value)}
                      className="w-full rounded bg-[#162035] border border-slate-700 px-2 py-1 text-sm focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-400">Tax Surcharge (₹)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={reviseTax}
                      onChange={e => setReviseTax(e.target.value)}
                      className="w-full rounded bg-[#162035] border border-slate-700 px-2 py-1 text-sm focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-400">Late Fee Charge (₹)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={reviseLateFee}
                      onChange={e => setReviseLateFee(e.target.value)}
                      className="w-full rounded bg-[#162035] border border-slate-700 px-2 py-1 text-sm focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-400">Penalty Surcharge (₹)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={revisePenalty}
                      onChange={e => setRevisePenalty(e.target.value)}
                      className="w-full rounded bg-[#162035] border border-slate-700 px-2 py-1 text-sm focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-400">Coupon Discount (₹)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={reviseDiscount}
                      onChange={e => setReviseDiscount(e.target.value)}
                      className="w-full rounded bg-[#162035] border border-slate-700 px-2 py-1 text-sm focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-400">Water Subsidy (₹)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={reviseSubsidy}
                      onChange={e => setReviseSubsidy(e.target.value)}
                      className="w-full rounded bg-[#162035] border border-slate-700 px-2 py-1 text-sm focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-400">Fixed Service Charge (₹)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={reviseService}
                      onChange={e => setReviseService(e.target.value)}
                      className="w-full rounded bg-[#162035] border border-slate-700 px-2 py-1 text-sm focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-400">Maintenance Charge (₹)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={reviseMaintenance}
                      onChange={e => setReviseMaintenance(e.target.value)}
                      className="w-full rounded bg-[#162035] border border-slate-700 px-2 py-1 text-sm focus:outline-none"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="mb-1 block text-xs font-semibold text-slate-400">Sewage Charge (₹)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={reviseSewage}
                      onChange={e => setReviseSewage(e.target.value)}
                      className="w-full rounded bg-[#162035] border border-slate-700 px-2 py-1 text-sm focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowReviseModal(false)}
                  className="rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-300 hover:bg-slate-800 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={revising}
                  className="rounded-lg bg-indigo-600 px-4 py-2 text-sm hover:bg-indigo-700 transition flex items-center gap-1.5"
                >
                  {revising ? <RotateCw className="h-4 w-4 animate-spin" /> : null}
                  {revising ? 'Revising...' : 'Save Adjustments'}
                </button>
              </div>
            </form>
          </div>
        )}

      </div>
    </div>
  );
}
