import React, { useCallback, useMemo, useState, useEffect } from 'react';
import { 
  FileText, Download, Printer, Filter,
  FileSpreadsheet, RefreshCw, BarChart3, AlertCircle, TrendingUp, AlertTriangle, Sparkles
} from 'lucide-react';
import api from '@/api';
import { getRole, getCommunityId, getToken } from '@/lib/auth';
import { toast } from 'sonner';
import { Bar, BarChart, CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

const REPORT_PRESETS = [
  {
    id: 'collections-risk',
    label: 'Collections Risk',
    description: 'Outstanding dues and collection efficiency across communities.',
    reportType: 'COLLECTION',
    paymentStatus: 'OVERDUE'
  },
  {
    id: 'consumption-watch',
    label: 'Consumption Watch',
    description: 'High-usage and leak warning trends from meter data.',
    reportType: 'CONSUMPTION',
    paymentStatus: ''
  },
  {
    id: 'billing-control',
    label: 'Billing Control',
    description: 'Invoice status and revenue realization for billing cycles.',
    reportType: 'BILLING',
    paymentStatus: ''
  }
] as const;

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

  useEffect(() => {
    if (role === 'RESIDENT') {
      setReportType('CONSUMPTION');
    }
  }, [role]);

  // Dropdown lists
  const [communities, setCommunities] = useState<any[]>([]);
  const [residents, setResidents] = useState<any[]>([]);
  const [billingCycles, setBillingCycles] = useState<any[]>([]);

  // Report results state
  const [previewData, setPreviewData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState<string | null>(null);
  const yearOptions = useMemo(() => {
    const currentYear = new Date().getFullYear();
    return Array.from({ length: 5 }, (_, idx) => currentYear - idx);
  }, []);

  const normalizeValue = (value: any) => {
    if (typeof value === 'number') return value;
    if (typeof value === 'string') {
      const cleaned = value.replace(/[^0-9.-]/g, '');
      const parsed = Number(cleaned);
      return Number.isFinite(parsed) ? parsed : 0;
    }
    return 0;
  };

  const derivedChartConfig = useMemo(() => {
    const points = previewData?.chartData;
    if (!Array.isArray(points) || points.length === 0 || typeof points[0] !== 'object') {
      return null;
    }

    const firstPoint = points[0];
    const keys = Object.keys(firstPoint);
    const labelKey = keys.find((k) => typeof firstPoint[k] === 'string') || keys[0];
    const valueKey = keys.find((k) => typeof firstPoint[k] === 'number') || keys.find((k) => /\d/.test(String(firstPoint[k])));

    if (!labelKey || !valueKey) return null;

    return {
      labelKey,
      valueKey,
      data: points.map((point: Record<string, any>) => ({
        ...point,
        [valueKey]: normalizeValue(point[valueKey])
      }))
    };
  }, [previewData]);

  const insightList = useMemo(() => {
    if (!previewData?.summary) return [];
    const summary = previewData.summary as Record<string, any>;
    const insights: { level: 'warning' | 'info'; text: string }[] = [];

    const outstanding = normalizeValue(summary.outstandingAmount || summary.outstanding || summary.outstandingBalance);
    if (outstanding > 0) {
      insights.push({ level: 'warning', text: `Outstanding dues detected: ₹${outstanding.toLocaleString()}. Prioritize collection follow-ups.` });
    }

    const efficiency = normalizeValue(summary.efficiency);
    if (efficiency > 0 && efficiency < 85) {
      insights.push({ level: 'warning', text: `Collection efficiency is ${efficiency.toFixed(2)}%. Target at least 85% for healthy cash flow.` });
    }

    const warnings = normalizeValue(summary.activeLeaksBroke || summary.totalReadingsSummarized);
    if ((reportType === 'CONSUMPTION' || reportType === 'METER') && warnings > 0) {
      insights.push({ level: 'info', text: `Consumption risk signals found (${warnings.toLocaleString()}). Review high-usage flats and anomalies.` });
    }

    if (insights.length === 0) {
      insights.push({ level: 'info', text: 'No immediate risk flags from the current summary. Export and archive this report run.' });
    }

    return insights;
  }, [previewData, reportType]);

  const applyPreset = (preset: (typeof REPORT_PRESETS)[number]) => {
    setReportType(preset.reportType);
    setFrequency('MONTHLY');
    setPaymentStatus(preset.paymentStatus);
    setMonth(new Date().getMonth() + 1);
    setQuarter(1);
    setStartDate('');
    setEndDate('');
    setBuilding('');
    setResidentId('');
    setBillingCycleId('');
    setMinUsage('');
    setMaxUsage('');
    setPreviewData(null);
  };

  const fetchMetadata = useCallback(async () => {
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
  }, [role]);

  useEffect(() => {
    fetchMetadata();
    handlePreview();
  }, []);

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

      const baseUrl = api.defaults.baseURL || 'http://localhost:8080';
      const token = getToken();
      if (token) {
        params.append('token', token);
      }

      const url = `${baseUrl}/api/reports/download/${format}?${params.toString()}`;
      window.open(url, '_blank');
      toast.success(`Exporting as ${format.toUpperCase()}...`);
    } catch  {
      toast.error(`Failed to export as ${format.toUpperCase()}`);
    } finally {
      setExporting(null);
    }
  };

  const handlePrint = () => {
    window.print();
  };  return (
    <div className="space-y-6 text-slate-800 bg-slate-50/50 p-4 md:p-6 rounded-3xl select-none">

      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 flex items-center gap-2.5">
            <div className="p-2 bg-cyan-50 border border-cyan-100 rounded-xl text-cyan-600">
              <BarChart3 className="h-6 w-6" />
            </div>
            Analytics & Reports Center
          </h1>
          <p className="text-slate-500 text-xs font-medium mt-1">Generate, preview, and download system-wide utility audit logs, billing revenues, and water consumption records.</p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={fetchMetadata}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-xl transition-all cursor-pointer shadow-sm active:scale-95"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Refresh</span>
          </button>
          <button
            onClick={() => handleExport('pdf')}
            disabled={!previewData || exporting === 'pdf'}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 transition-all disabled:opacity-40 shadow-sm cursor-pointer active:scale-95"
          >
            <FileText className="h-4 w-4" /> PDF Report
          </button>
          <button
            onClick={() => handleExport('excel')}
            disabled={!previewData || exporting === 'excel'}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 transition-all disabled:opacity-40 shadow-sm cursor-pointer active:scale-95"
          >
            <FileSpreadsheet className="h-4 w-4" /> Excel Grid
          </button>
          <button
            onClick={() => handleExport('csv')}
            disabled={!previewData || exporting === 'csv'}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold bg-sky-50 text-sky-700 hover:bg-sky-100 border border-sky-200 transition-all disabled:opacity-40 shadow-sm cursor-pointer active:scale-95"
          >
            <Download className="h-4 w-4" /> CSV Plain
          </button>
          <button
            onClick={handlePrint}
            disabled={!previewData}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-300 transition-all disabled:opacity-40 shadow-sm cursor-pointer active:scale-95"
          >
            <Printer className="h-4 w-4" /> Print Report
          </button>
        </div>
      </div>

      {role === 'SUPER_ADMIN' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {REPORT_PRESETS.map((preset) => (
            <button
              key={preset.id}
              onClick={() => applyPreset(preset)}
              className="text-left p-4 rounded-2xl border border-slate-200 bg-white hover:border-cyan-500 hover:bg-cyan-50/50 transition-all shadow-sm group cursor-pointer"
            >
              <p className="text-xs font-extrabold text-cyan-700 uppercase tracking-wide flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-cyan-500 group-hover:rotate-12 transition-transform" /> {preset.label}
              </p>
              <p className="text-[11px] text-slate-500 font-medium mt-1">{preset.description}</p>
            </button>
          ))}
        </div>
      )}

      {/* Layout: Sidebar Filter + Report Grid Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">

        {/* Filters Sidebar */}
        <div className="bg-white border border-slate-200/80 p-5 rounded-2xl space-y-5 shadow-sm h-fit">
          <h3 className="text-xs font-extrabold uppercase tracking-widest text-slate-800 border-b border-slate-100 pb-3 flex items-center gap-2">
            <Filter className="h-4 w-4 text-cyan-600" /> Report Parameters
          </h3>

          <div className="space-y-4 text-xs font-bold text-slate-700">
            {/* Start Date */}
            <div className="space-y-1">
              <label className="block text-slate-700 font-bold mb-1">Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-800 focus:bg-white focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 text-xs font-medium"
              />
            </div>

            {/* End Date */}
            <div className="space-y-1">
              <label className="block text-slate-700 font-bold mb-1">End Date</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-800 focus:bg-white focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 text-xs font-medium"
              />
            </div>

            <button
              onClick={handlePreview}
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white font-extrabold rounded-xl flex items-center justify-center gap-2 shadow-md hover:shadow-cyan-500/20 active:scale-[0.98] transition-all disabled:opacity-50 text-xs uppercase tracking-wider mt-4 cursor-pointer"
            >
              {loading ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" /> Rendering...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4" /> Fetch Report
                </>
              )}
            </button>
          </div>
        </div>

        {/* Preview Panel Output */}
        <div className="lg:col-span-3 bg-white border border-slate-200/80 p-6 rounded-2xl flex flex-col justify-between min-h-[500px] shadow-sm">
          
          {loading ? (
            <div className="flex-1 flex flex-col items-center justify-center py-20 text-slate-500 gap-3">
              <RefreshCw className="h-10 w-10 animate-spin text-cyan-600" />
              <span className="text-xs font-bold uppercase tracking-widest text-cyan-700">Compiling Analytics Data...</span>
            </div>
          ) : previewData ? (
            <div className="space-y-6">
              {/* Title */}
              <div>
                <h3 className="text-cyan-800 font-extrabold text-base uppercase tracking-wider">{previewData.title}</h3>
                <span className="text-xs text-slate-400 font-medium block mt-0.5">Generated dynamically on {new Date().toLocaleString()}</span>
              </div>

              {/* Highlights / Summary Cards */}
              {previewData.summary && Object.keys(previewData.summary).length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-fade-in">
                  {Object.entries(previewData.summary).map(([key, val]: any) => (
                    <div key={key} className="bg-slate-50/80 border border-slate-200/80 rounded-xl p-4 space-y-1 relative overflow-hidden shadow-xs">
                      <div className="absolute top-0 left-0 w-full h-[3px] bg-cyan-500" />
                      <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block">{key.replace(/([A-Z])/g, ' $1')}</span>
                      <span className="text-xl font-black block mt-1.5 text-slate-900">{val}</span>
                    </div>
                  ))}
                </div>
              )}

              <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
                <div className="xl:col-span-2 bg-slate-50/80 border border-slate-200/80 rounded-xl p-4">
                  <h4 className="text-[11px] font-extrabold uppercase tracking-wide text-slate-600 mb-3 flex items-center gap-1.5">
                    <TrendingUp className="h-3.5 w-3.5 text-cyan-600" /> Trend Snapshot
                  </h4>
                  {derivedChartConfig ? (
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        {frequency === 'YEARLY' ? (
                          <BarChart data={derivedChartConfig.data}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                            <XAxis dataKey={derivedChartConfig.labelKey} stroke="#64748b" fontSize={10} />
                            <YAxis stroke="#64748b" fontSize={10} />
                            <Tooltip />
                            <Legend />
                            <Bar dataKey={derivedChartConfig.valueKey} fill="#06b6d4" radius={[6, 6, 0, 0]} />
                          </BarChart>
                        ) : (
                          <LineChart data={derivedChartConfig.data}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                            <XAxis dataKey={derivedChartConfig.labelKey} stroke="#64748b" fontSize={10} />
                            <YAxis stroke="#64748b" fontSize={10} />
                            <Tooltip />
                            <Legend />
                            <Line type="monotone" dataKey={derivedChartConfig.valueKey} stroke="#0284c7" strokeWidth={2.5} dot={{ r: 3 }} />
                          </LineChart>
                        )}
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400">Chart data not available for this report selection.</p>
                  )}
                </div>

                <div className="bg-slate-50/80 border border-slate-200/80 rounded-xl p-4">
                  <h4 className="text-[11px] font-extrabold uppercase tracking-wide text-slate-600 mb-3 flex items-center gap-1.5">
                    <AlertTriangle className="h-3.5 w-3.5 text-amber-500" /> Risk & Actions
                  </h4>
                  <ul className="space-y-2">
                    {insightList.map((insight, idx) => (
                      <li key={idx} className={`text-[11px] leading-relaxed px-3 py-2.5 rounded-lg border font-medium ${
                        insight.level === 'warning'
                          ? 'border-amber-200 bg-amber-50 text-amber-900'
                          : 'border-cyan-200 bg-cyan-50 text-cyan-900'
                      }`}>
                        {insight.text}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Data Grid Table */}
              <div className="overflow-x-auto border border-slate-200 rounded-xl shadow-xs">
                <table className="w-full text-left text-xs font-semibold">
                  <thead className="bg-slate-100/80 text-slate-700 uppercase text-[10px] tracking-wider border-b border-slate-200">
                    <tr>
                      {previewData.headers?.map((h: string, idx: number) => (
                        <th key={idx} className="px-5 py-3.5">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-800">
                    {previewData.rows?.length > 0 ? (
                      previewData.rows.map((row: any[], rIdx: number) => (
                        <tr key={rIdx} className="hover:bg-cyan-50/40 transition-colors">
                          {row.map((cell: any, cIdx: number) => (
                            <td key={cIdx} className="px-5 py-3.5">{cell}</td>
                          ))}
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={previewData.headers?.length || 1} className="px-5 py-10 text-center text-slate-400">
                          No matching records found in this category. Adjust the filter criteria.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center py-20 text-slate-400 text-center gap-3">
              <div className="p-4 bg-cyan-50 rounded-full text-cyan-500/80">
                <AlertCircle className="h-10 w-10" />
              </div>
              <div>
                <h4 className="text-sm font-extrabold text-slate-700 uppercase tracking-wider">No Report Preview Loaded</h4>
                <p className="text-xs text-slate-500 max-w-sm mt-1 mx-auto">Select a category, configure parameters, and click "Fetch Preview" to build a customized report dataset.</p>
              </div>
            </div>
          )}

          <div className="border-t border-slate-100 pt-4 mt-6 flex justify-between items-center text-[10px] text-slate-400 font-bold uppercase tracking-wider">
            <span>Security Classification: Business Confidential</span>
            <span>HydroBS BI & Invoicing Suite v2.6</span>
          </div>
        </div>

      </div>
    </div>
  );
}
