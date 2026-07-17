import React, { useState, useEffect } from 'react';
import { 
  FileText, Download, Printer, Filter, Calendar, Users, 
  Building, ChevronRight, FileSpreadsheet, RefreshCw, BarChart3, Search, AlertCircle
} from 'lucide-react';
import api from '@/api';
import { getRole, getCommunityId } from '@/lib/auth';
import { toast } from 'sonner';

export default function ReportsPage() {
  const role = getRole();
  const myCommunityId = getCommunityId();

  // Filters state
  const [reportType, setReportType] = useState('REVENUE');
  const [frequency, setFrequency] = useState('MONTHLY');
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [quarter, setQuarter] = useState(1);
  const [communityId, setCommunityId] = useState<string>(myCommunityId || '');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [building, setBuilding] = useState('');
  const [residentId, setResidentId] = useState('');
  const [billingCycleId, setBillingCycleId] = useState('');
  const [paymentStatus, setPaymentStatus] = useState('');
  const [minUsage, setMinUsage] = useState('');
  const [maxUsage, setMaxUsage] = useState('');

  // Dropdown lists
  const [communities, setCommunities] = useState<any[]>([]);
  const [residents, setResidents] = useState<any[]>([]);
  const [billingCycles, setBillingCycles] = useState<any[]>([]);

  // Report results state
  const [previewData, setPreviewData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState<string | null>(null);

  useEffect(() => {
    fetchMetadata();
  }, []);

  const fetchMetadata = async () => {
    try {
      if (role === 'SUPER_ADMIN') {
        const commRes = await api.get('/api/communities');
        setCommunities(commRes.data || []);
      }
      
      const resRes = await api.get('/api/residents');
      setResidents(resRes.data?.content || resRes.data || []);

      const cycleRes = await api.get('/api/billing-cycles');
      setBillingCycles(cycleRes.data || []);
    } catch (err) {
      console.error('Failed to load filter metadata options', err);
    }
  };

  const handlePreview = async () => {
    setLoading(true);
    setPreviewData(null);
    try {
      const params: any = {
        reportType,
        frequency,
        year,
        month: frequency === 'MONTHLY' ? month : undefined,
        quarter: frequency === 'QUARTERLY' ? quarter : undefined,
        communityId: communityId || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        building: building || undefined,
        residentId: residentId || undefined,
        billingCycleId: billingCycleId || undefined,
        paymentStatus: paymentStatus || undefined,
        minUsage: minUsage || undefined,
        maxUsage: maxUsage || undefined
      };

      const res = await api.get('/api/reports/preview', { params });
      setPreviewData(res.data);
      toast.success('Report preview generated successfully.');
    } catch (err: any) {
      toast.error(err.response?.data || 'Failed to preview report data.');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = (format: 'pdf' | 'excel' | 'csv') => {
    setExporting(format);
    try {
      const params = new URLSearchParams({
        reportType,
        frequency,
        year: String(year),
        month: frequency === 'MONTHLY' ? String(month) : '',
        quarter: frequency === 'QUARTERLY' ? String(quarter) : '',
        communityId: communityId || '',
        startDate: startDate || '',
        endDate: endDate || '',
        building: building || '',
        residentId: residentId || '',
        billingCycleId: billingCycleId || '',
        paymentStatus: paymentStatus || '',
        minUsage: minUsage || '',
        maxUsage: maxUsage || ''
      });

      const url = `http://localhost:8080/api/reports/download/${format}?${params.toString()}`;
      window.open(url, '_blank');
      toast.success(`Exporting as ${format.toUpperCase()}...`);
    } catch (err) {
      toast.error(`Failed to export as ${format.toUpperCase()}`);
    } finally {
      setExporting(null);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 text-slate-800 dark:text-slate-100 select-none">
      
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-100 dark:border-slate-800 pb-6">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-[#0F4C81] dark:text-[#00B4D8] flex items-center gap-3">
            <BarChart3 className="text-[#0F4C81] dark:text-[#00B4D8] h-8 w-8" />
            SaaS Analytics & Reports Center
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-2">Generate, preview, and download system-wide utility audit logs, billing revenues, and water consumption files.</p>
        </div>
        
        <div className="flex flex-wrap gap-3">
          <button
            onClick={fetchMetadata}
            className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold text-[#0F4C81] hover:text-[#00B4D8] bg-slate-50 border border-slate-200/50 rounded-xl hover:bg-slate-100/80 transition-all cursor-pointer shadow-xs"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Refresh</span>
          </button>
          <button
              onClick={() => handleExport('pdf')}
              disabled={!previewData || exporting === 'pdf'}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 transition-all disabled:opacity-40"
            >
              <FileText className="h-4 w-4" /> PDF Report
            </button>
            <button
              onClick={() => handleExport('excel')}
              disabled={!previewData || exporting === 'excel'}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 transition-all disabled:opacity-40"
            >
              <FileSpreadsheet className="h-4 w-4" /> Excel Grid
            </button>
            <button
              onClick={() => handleExport('csv')}
              disabled={!previewData || exporting === 'csv'}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-[#17c8d8]/10 hover:bg-[#17c8d8]/20 text-[#17c8d8] border border-[#17c8d8]/20 transition-all disabled:opacity-40"
            >
              <Download className="h-4 w-4" /> CSV Plain
            </button>
            <button
              onClick={handlePrint}
              disabled={!previewData}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all disabled:opacity-40"
            >
              <Printer className="h-4 w-4" /> Print Report
            </button>
          </div>
        </div>

        {/* Layout: Sidebar Filter + Report Grid Preview */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* Filters Sidebar */}
          <div className="bg-[#0b1f35]/90 border border-white/5 p-6 rounded-3xl backdrop-blur-md space-y-6">
            <h3 className="text-sm font-extrabold uppercase tracking-widest text-[#17c8d8] flex items-center gap-2 border-b border-white/5 pb-3">
              <Filter className="h-4 w-4" /> Report Parameters
            </h3>

            <div className="space-y-4 text-xs font-bold text-slate-300">
              {/* Report Type */}
              <div className="space-y-1">
                <label className="block text-slate-400">Report Category</label>
                <select
                  value={reportType}
                  onChange={(e) => setReportType(e.target.value)}
                  className="w-full bg-[#071321] border border-white/10 rounded-xl px-3 py-2.5 text-slate-200 focus:outline-none focus:border-[#17c8d8]"
                >
                  <option value="REVENUE">Revenue Billing Cycle Summary</option>
                  <option value="COLLECTION">Collection Dues & Efficiency</option>
                  <option value="CONSUMPTION">Water Consumption By Flat</option>
                  <option value="CUSTOMER">Residents Directory</option>
                  <option value="COMMUNITY">Communities Global Summary</option>
                  <option value="AUDIT">User & System Audit Logs</option>
                  <option value="PAYMENTS">Payment Transactions Ledgers</option>
                  <option value="BILLING">Billing Invoice Registers</option>
                  <option value="METER">Water Meter Status & Logs</option>
                </select>
              </div>

              {/* Frequency */}
              <div className="space-y-1">
                <label className="block text-slate-400">Time Interval Frequency</label>
                <select
                  value={frequency}
                  onChange={(e) => setFrequency(e.target.value)}
                  className="w-full bg-[#071321] border border-white/10 rounded-xl px-3 py-2.5 text-slate-200 focus:outline-none"
                >
                  <option value="MONTHLY">Monthly Segment</option>
                  <option value="QUARTERLY">Quarterly Segment</option>
                  <option value="YEARLY">Yearly Aggregate</option>
                </select>
              </div>

              {/* Year */}
              <div className="space-y-1">
                <label className="block text-slate-400">Target Year</label>
                <select
                  value={year}
                  onChange={(e) => setYear(Number(e.target.value))}
                  className="w-full bg-[#071321] border border-white/10 rounded-xl px-3 py-2.5 text-slate-200 focus:outline-none"
                >
                  <option value={2026}>2026 Calendar</option>
                  <option value={2025}>2025 Calendar</option>
                  <option value={2024}>2024 Calendar</option>
                </select>
              </div>

              {/* Month */}
              {frequency === 'MONTHLY' && (
                <div className="space-y-1">
                  <label className="block text-slate-400">Target Month</label>
                  <select
                    value={month}
                    onChange={(e) => setMonth(Number(e.target.value))}
                    className="w-full bg-[#071321] border border-white/10 rounded-xl px-3 py-2.5 text-slate-200 focus:outline-none"
                  >
                    {Array.from({ length: 12 }, (_, i) => (
                      <option key={i + 1} value={i + 1}>
                        {new Date(2026, i).toLocaleString('en', { month: 'long' })}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Quarter */}
              {frequency === 'QUARTERLY' && (
                <div className="space-y-1">
                  <label className="block text-slate-400">Target Quarter</label>
                  <select
                    value={quarter}
                    onChange={(e) => setQuarter(Number(e.target.value))}
                    className="w-full bg-[#071321] border border-white/10 rounded-xl px-3 py-2.5 text-slate-200 focus:outline-none"
                  >
                    <option value={1}>Q1 (Jan - Mar)</option>
                    <option value={2}>Q2 (Apr - Jun)</option>
                    <option value={3}>Q3 (Jul - Sep)</option>
                    <option value={4}>Q4 (Oct - Dec)</option>
                  </select>
                </div>
              )}

              {/* Super Admin community selector */}
              {role === 'SUPER_ADMIN' && (
                <div className="space-y-1">
                  <label className="block text-slate-400">Target Community</label>
                  <select
                    value={communityId}
                    onChange={(e) => setCommunityId(e.target.value)}
                    className="w-full bg-[#071321] border border-white/10 rounded-xl px-3 py-2.5 text-slate-200 focus:outline-none"
                  >
                    <option value="">System Wide (All)</option>
                    {communities.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Date Pickers */}
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="block text-slate-400">Start Date</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full bg-[#071321] border border-white/10 rounded-xl px-2 py-2.5 text-slate-200 focus:outline-none text-[11px]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-slate-400">End Date</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full bg-[#071321] border border-white/10 rounded-xl px-2 py-2.5 text-slate-200 focus:outline-none text-[11px]"
                  />
                </div>
              </div>

              {/* Building/Tower */}
              <div className="space-y-1">
                <label className="block text-slate-400">Building / Wing</label>
                <input
                  type="text"
                  placeholder="e.g. Tower A"
                  value={building}
                  onChange={(e) => setBuilding(e.target.value)}
                  className="w-full bg-[#071321] border border-white/10 rounded-xl px-3 py-2.5 text-slate-200 focus:outline-none placeholder-slate-500"
                />
              </div>

              {/* Resident selector */}
              <div className="space-y-1">
                <label className="block text-slate-400">Specific Resident</label>
                <select
                  value={residentId}
                  onChange={(e) => setResidentId(e.target.value)}
                  className="w-full bg-[#071321] border border-white/10 rounded-xl px-3 py-2.5 text-slate-200 focus:outline-none"
                >
                  <option value="">All Residents</option>
                  {residents.map((r) => (
                    <option key={r.id} value={r.id}>{r.fullName} (Flat {r.flatNumber})</option>
                  ))}
                </select>
              </div>

              {/* Billing Cycle selector */}
              <div className="space-y-1">
                <label className="block text-slate-400">Billing Cycle</label>
                <select
                  value={billingCycleId}
                  onChange={(e) => setBillingCycleId(e.target.value)}
                  className="w-full bg-[#071321] border border-white/10 rounded-xl px-3 py-2.5 text-slate-200 focus:outline-none"
                >
                  <option value="">All Cycles</option>
                  {billingCycles.map((cy) => (
                    <option key={cy.id} value={cy.id}>{cy.name}</option>
                  ))}
                </select>
              </div>

              {/* Payment status */}
              <div className="space-y-1">
                <label className="block text-slate-400">Payment Status</label>
                <select
                  value={paymentStatus}
                  onChange={(e) => setPaymentStatus(e.target.value)}
                  className="w-full bg-[#071321] border border-white/10 rounded-xl px-3 py-2.5 text-slate-200 focus:outline-none"
                >
                  <option value="">All Invoices</option>
                  <option value="PAID">Paid Only</option>
                  <option value="UNPAID">Unpaid Only</option>
                  <option value="OVERDUE">Overdue Only</option>
                </select>
              </div>

              {/* Usage range filters */}
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="block text-slate-400">Min Usage (L)</label>
                  <input
                    type="number"
                    value={minUsage}
                    onChange={(e) => setMinUsage(e.target.value)}
                    className="w-full bg-[#071321] border border-white/10 rounded-xl px-2.5 py-2 text-slate-200 focus:outline-none text-[11px]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-slate-400">Max Usage (L)</label>
                  <input
                    type="number"
                    value={maxUsage}
                    onChange={(e) => setMaxUsage(e.target.value)}
                    className="w-full bg-[#071321] border border-white/10 rounded-xl px-2.5 py-2 text-slate-200 focus:outline-none text-[11px]"
                  />
                </div>
              </div>

              <button
                onClick={handlePreview}
                disabled={loading}
                className="w-full py-3.5 bg-gradient-to-r from-[#17c8d8] to-[#0f8cc3] hover:from-[#34d8e8] hover:to-[#17c8d8] text-white font-extrabold rounded-2xl flex items-center justify-center gap-2 shadow-lg hover:shadow-cyan-500/25 active:scale-[0.98] transition-all disabled:opacity-50 text-xs uppercase tracking-wider mt-4"
              >
                {loading ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" /> Rendering...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4" /> Fetch Preview
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Preview Panel Output */}
          <div className="lg:col-span-3 bg-[#0b1f35]/90 border border-white/5 p-6 rounded-3xl backdrop-blur-md flex flex-col justify-between min-h-[500px]">
            
            {loading ? (
              <div className="flex-1 flex flex-col items-center justify-center py-20 text-slate-400 gap-3">
                <RefreshCw className="h-10 w-10 animate-spin text-[#17c8d8]" />
                <span className="text-xs font-bold uppercase tracking-widest">Compiling Analytics Data...</span>
              </div>
            ) : previewData ? (
              <div className="space-y-6">
                {/* Title */}
                <div>
                  <h3 className="text-[#17c8d8] font-extrabold text-sm uppercase tracking-wider">{previewData.title}</h3>
                  <span className="text-xxs text-slate-500 font-bold block">Generated dynamically on {new Date().toLocaleString()}</span>
                </div>

                {/* Highlights / Summary Cards */}
                {previewData.summary && Object.keys(previewData.summary).length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {Object.entries(previewData.summary).map(([key, val]: any) => (
                      <div key={key} className="bg-[#071321] border border-white/5 rounded-2xl p-4 space-y-1">
                        <span className="text-[10px] text-slate-400 uppercase font-black tracking-wider block">{key.replace(/([A-Z])/g, ' $1')}</span>
                        <span className="text-base font-extrabold text-[#34d8e8]">{val}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Data Grid Table */}
                <div className="overflow-x-auto border border-white/5 rounded-2xl">
                  <table className="w-full text-left text-xs font-semibold">
                    <thead className="bg-[#071321] text-slate-400 uppercase text-[10px] border-b border-white/5">
                      <tr>
                        {previewData.headers?.map((h: string, idx: number) => (
                          <th key={idx} className="px-5 py-4">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 text-slate-300">
                      {previewData.rows?.length > 0 ? (
                        previewData.rows.map((row: any[], rIdx: number) => (
                          <tr key={rIdx} className="hover:bg-white/5 transition-all">
                            {row.map((cell: any, cIdx: number) => (
                              <td key={cIdx} className="px-5 py-3.5">{cell}</td>
                            ))}
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={previewData.headers?.length || 1} className="px-5 py-10 text-center text-slate-500">
                            No matching records found in this category. Adjust the filter criteria.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center py-20 text-slate-500 text-center gap-3">
                <AlertCircle className="h-12 w-12 text-[#17c8d8]/30" />
                <div>
                  <h4 className="text-sm font-extrabold text-slate-400 uppercase tracking-widest">No Report Preview Loaded</h4>
                  <p className="text-xs text-slate-500 max-w-sm mt-1 mx-auto">Select a category, configure parameters, and click "Fetch Preview" to build a customized report dataset.</p>
                </div>
              </div>
            )}

            <div className="border-t border-white/5 pt-4 mt-6 flex justify-between items-center text-xxs text-slate-500 font-bold uppercase tracking-wider">
              <span>Security Classification: Business Confidential</span>
              <span>HydroBS BI & Invoicing Suite v2.6</span>
            </div>
          </div>

        </div>
      </div>
  );
}
