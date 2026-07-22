import React, { useState, useEffect, useRef } from 'react';
import { 
  Upload, Search, FileText, CheckCircle2, AlertCircle, 
  ChevronLeft, ChevronRight, Download, Printer, Plus, Info, RefreshCw 
} from 'lucide-react';
import { waterService, type Reading, type ImportJob } from '../services/waterService';
import { toast } from 'sonner';

export default function MeterReadingsPage() {
  const [readings, setReadings] = useState<Reading[]>([]);
  const [importJobs, setImportJobs] = useState<ImportJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalElements, setTotalElements] = useState(0);
  
  // Filters & Pagination
  const [page, setPage] = useState(0);
  const [size] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [buildingFilter, setBuildingFilter] = useState('');
  const [anomalyFilter, setAnomalyFilter] = useState<boolean | undefined>(undefined);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Modals
  const [showManualModal, setShowManualModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Manual Entry Form
  const [manualFlat, setManualFlat] = useState('');
  const [manualDate, setManualDate] = useState(new Date().toISOString().split('T')[0]);
  const [manualUsage, setManualUsage] = useState('');
  
  // CSV Preview & Summary State
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadSummary, setUploadSummary] = useState<any | null>(null);

  const fetchReadings = async () => {
    try {
      setLoading(true);
      const data = await waterService.searchReadings({
        flatNumber: searchTerm || undefined,
        building: buildingFilter || undefined,
        isAnomaly: anomalyFilter,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        page,
        size
      });
      setReadings(data.content);
      setTotalElements(data.totalElements);
    } catch  {
      toast.error('Failed to load meter readings.');
    } finally {
      setLoading(false);
    }
  };

  const fetchImportJobs = async () => {
    try {
      const data = await waterService.getCSVImportJobs();
      setImportJobs(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchReadings();
  }, [page, buildingFilter, anomalyFilter, startDate, endDate]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(0);
    fetchReadings();
  };

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualFlat.trim() || !manualUsage) {
      toast.error('All fields are required');
      return;
    }
    try {
      const resp = await waterService.addManualReading({
        flatNumber: manualFlat.trim(),
        readingDate: manualDate,
        usageLitres: Number(manualUsage)
      });
      toast.success(resp);
      setShowManualModal(false);
      setManualFlat('');
      setManualUsage('');
      setPage(0);
      fetchReadings();
    } catch (err: any) {
      toast.error(err.response?.data || 'Failed to submit manual reading');
    }
  };

  // Drag and Drop handlers
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleCSVUpload(e.dataTransfer.files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleCSVUpload(e.target.files[0]);
    }
  };

  const handleCSVUpload = async (file: File) => {
    if (!file.name.endsWith('.csv')) {
      toast.error('Only CSV format files are supported.');
      return;
    }
    
    // Simulate upload progress
    setUploadProgress(10);
    const interval = setInterval(() => {
      setUploadProgress(prev => (prev < 90 ? prev + 15 : prev));
    }, 200);

    try {
      const summary = await waterService.uploadReadings(file);
      clearInterval(interval);
      setUploadProgress(100);
      setUploadSummary(summary);
      toast.success('CSV uploaded successfully!');
      fetchReadings();
      fetchImportJobs();
    } catch (err: any) {
      clearInterval(interval);
      setUploadProgress(0);
      toast.error(err.response?.data || 'CSV file parse failed');
    }
  };

  const triggerPrint = () => {
    window.print();
  };

  const triggerExport = () => {
    // Generate simple CSV download for current view
    const headers = ['Resident', 'Flat No', 'Meter No', 'Reading Date', 'Prev Reading', 'Curr Reading', 'Usage (L)', 'Anomaly'];
    const rows = readings.map(r => [
      r.residentName,
      r.flatNumber,
      r.meterNumber || 'N/A',
      r.readingDate,
      r.previousReading,
      r.currentReading,
      r.usageLitres,
      r.isAnomaly ? `Yes (${r.anomalyType})` : 'No'
    ]);

    const csvContent = [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `meter_readings_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            Meter Readings Hub
          </h1>
          <p className="text-slate-500 mt-1">Upload CSV reads, log manual entries, and review usage trends.</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => { fetchImportJobs(); setShowHistoryModal(true); }}
            className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl flex items-center gap-2 transition-colors font-medium text-sm"
          >
            <RefreshCw size={16} />
            Import History
          </button>
          <button 
            onClick={() => setShowManualModal(true)}
            className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl flex items-center gap-2 hover:opacity-90 transition-all shadow-md font-medium text-sm"
          >
            <Plus size={16} />
            Manual Entry
          </button>
        </div>
      </div>

      {/* CSV upload interface */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Upload box */}
        <div className="lg:col-span-2 bg-white border border-slate-100 rounded-3xl p-6 shadow-sm flex flex-col justify-center">
          <div 
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all flex flex-col items-center justify-center space-y-3 ${
              dragActive ? 'border-blue-500 bg-blue-50/50' : 'border-slate-200 hover:border-blue-400 bg-slate-50/50'
            }`}
          >
            <input 
              type="file" 
              ref={fileInputRef}
              onChange={handleFileInputChange}
              accept=".csv"
              className="hidden" 
            />
            <div className="p-4 bg-white rounded-full shadow-sm text-blue-600">
              <Upload size={28} />
            </div>
            <div>
              <p className="font-semibold text-slate-800">Drag & Drop CSV readings file here</p>
              <p className="text-xs text-slate-400 mt-1">Or click to browse from device. CSV format: Flat Number, Reading</p>
            </div>
          </div>

          {/* Upload progress */}
          {uploadProgress > 0 && (
            <div className="mt-4 space-y-2">
              <div className="flex justify-between text-xs text-slate-500 font-semibold">
                <span>Parsing CSV file...</span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                <div className="bg-blue-600 h-full rounded-full transition-all" style={{ width: `${uploadProgress}%` }}></div>
              </div>
            </div>
          )}
        </div>

        {/* Upload Summary Card */}
        <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm flex flex-col justify-between">
          <h3 className="font-bold text-slate-800 flex items-center gap-2 pb-3 border-b border-slate-50">
            <CheckCircle2 className="text-emerald-500" size={18} />
            Last Import Summary
          </h3>
          
          {uploadSummary ? (
            <div className="py-4 space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100/50 text-center">
                  <span className="text-2xl font-black text-slate-800">{uploadSummary.totalRows || 0}</span>
                  <span className="block text-xxs uppercase tracking-wider text-slate-400 font-bold mt-1">Total Rows</span>
                </div>
                <div className="bg-emerald-50/50 p-3 rounded-xl border border-emerald-100 text-center">
                  <span className="text-2xl font-black text-emerald-600">{uploadSummary.successfulRows || 0}</span>
                  <span className="block text-xxs uppercase tracking-wider text-emerald-500 font-bold mt-1">Success</span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 pt-2 text-center text-xs">
                <div className="bg-amber-50/50 p-2 rounded-xl text-amber-600">
                  <span className="font-bold block">{uploadSummary.duplicatesCount || 0}</span>
                  <span className="text-slate-400 text-xxs">Duplicates</span>
                </div>
                <div className="bg-rose-50/50 p-2 rounded-xl text-rose-600">
                  <span className="font-bold block">{uploadSummary.failedRows || 0}</span>
                  <span className="text-slate-400 text-xxs">Failed</span>
                </div>
                <div className="bg-indigo-50/50 p-2 rounded-xl text-indigo-600">
                  <span className="font-bold block">{uploadSummary.unknownFlatsCount || 0}</span>
                  <span className="text-slate-400 text-xxs">Unknown</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="py-8 text-center text-slate-400 text-sm space-y-1">
              <Info className="mx-auto text-slate-300" size={32} />
              <p>No imports run in this session.</p>
              <p className="text-xs">Drag a file to initiate bulk updates.</p>
            </div>
          )}

          <div className="text-xxs text-slate-400 bg-slate-50 p-2.5 rounded-xl border border-slate-100/50">
            Auto-mapping matches by Flat and Meter number automatically. Single invalid rows will log errors but won't block imports.
          </div>
        </div>
      </div>

      {/* Readings Log Search Table */}
      <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm space-y-4">
        <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <span className="absolute inset-y-0 left-3 flex items-center text-slate-400">
              <Search size={16} />
            </span>
            <input 
              type="text" 
              placeholder="Search flat number..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <input 
              type="date" 
              placeholder="Start"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
            <input 
              type="date" 
              placeholder="End"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>

          <div>
            <select
              value={anomalyFilter === undefined ? '' : String(anomalyFilter)}
              onChange={(e) => {
                const val = e.target.value;
                setAnomalyFilter(val === '' ? undefined : val === 'true');
                setPage(0);
              }}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            >
              <option value="">All Readings</option>
              <option value="true">Anomalies Only</option>
              <option value="false">Normal Only</option>
            </select>
          </div>

          <div className="flex gap-2 justify-end">
            <button 
              type="button" 
              onClick={triggerExport}
              className="p-2 border border-slate-200 hover:bg-slate-50 rounded-xl text-slate-600 transition-colors"
              title="Export CSV"
            >
              <Download size={18} />
            </button>
            <button 
              type="button" 
              onClick={triggerPrint}
              className="p-2 border border-slate-200 hover:bg-slate-50 rounded-xl text-slate-600 transition-colors"
              title="Print view"
            >
              <Printer size={18} />
            </button>
            <button 
              type="submit" 
              className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl font-medium text-sm transition-colors"
            >
              Apply Filter
            </button>
          </div>
        </form>

        {/* Enterprise Table */}
        <div className="overflow-x-auto border border-slate-100 rounded-2xl">
          <table className="min-w-full divide-y divide-slate-100">
            <thead className="bg-slate-50/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Flat</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Resident</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Meter Number</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Reading Date</th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Prev Index</th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Curr Index</th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Consumption (L)</th>
                <th className="px-6 py-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-50">
              {loading ? (
                [...Array(5)].map((_, idx) => (
                  <tr key={idx} className="animate-pulse">
                    <td colSpan={8} className="px-6 py-4 h-12 bg-slate-50/20"></td>
                  </tr>
                ))
              ) : readings.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-8 text-center text-slate-400 text-sm">
                    No matching meter readings logged.
                  </td>
                </tr>
              ) : (
                readings.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/30 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap font-semibold text-slate-800 text-sm">Flat {r.flatNumber}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-slate-600 text-sm">{r.residentName}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-slate-500 text-sm font-mono">{r.meterNumber || 'N/A'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-slate-600 text-sm">{r.readingDate}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-slate-500 text-sm">{r.previousReading}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-slate-700 text-sm font-medium">{r.currentReading}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right font-bold text-slate-800 text-sm">{r.usageLitres} L</td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      {r.isAnomaly ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-600 border border-rose-100" title={r.anomalyNotes}>
                          <AlertCircle size={12} />
                          {r.anomalyType || 'Anomaly'}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-600 border border-emerald-100">
                          <CheckCircle2 size={12} />
                          Normal
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Server Side Pagination */}
        <div className="flex justify-between items-center pt-3 text-sm text-slate-500">
          <span>Showing page {page + 1} of {Math.ceil(totalElements / size) || 1} ({totalElements} total records)</span>
          <div className="flex gap-2">
            <button 
              disabled={page === 0}
              onClick={() => setPage(p => p - 1)}
              className="p-2 border border-slate-200 rounded-xl hover:bg-slate-50 disabled:opacity-50 disabled:hover:bg-transparent transition-colors"
            >
              <ChevronLeft size={16} />
            </button>
            <button 
              disabled={(page + 1) * size >= totalElements}
              onClick={() => setPage(p => p + 1)}
              className="p-2 border border-slate-200 rounded-xl hover:bg-slate-50 disabled:opacity-50 disabled:hover:bg-transparent transition-colors"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Manual Entry Modal */}
      {showManualModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-xl space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold text-slate-800">Log Manual Water Reading</h2>
              <button onClick={() => setShowManualModal(false)} className="text-slate-400 hover:text-slate-600 text-2xl font-semibold">&times;</button>
            </div>

            <form onSubmit={handleManualSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-600 mb-1">Flat Number</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 101 or A-202"
                  value={manualFlat}
                  onChange={(e) => setManualFlat(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-600 mb-1">Reading Date</label>
                <input
                  type="date"
                  required
                  value={manualDate}
                  onChange={(e) => setManualDate(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-600 mb-1">Current Usage (Litres)</label>
                <input
                  type="number"
                  required
                  min="0"
                  placeholder="e.g. 150"
                  value={manualUsage}
                  onChange={(e) => setManualUsage(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowManualModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold hover:opacity-90 shadow-md transition-all"
                >
                  Log Reading
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CSV Import History Modal */}
      {showHistoryModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-4xl shadow-xl space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold text-slate-800">CSV Bulk Import History</h2>
              <button onClick={() => setShowHistoryModal(false)} className="text-slate-400 hover:text-slate-600 text-2xl font-semibold">&times;</button>
            </div>

            <div className="overflow-y-auto max-h-[450px] border border-slate-100 rounded-2xl">
              <table className="min-w-full divide-y divide-slate-100">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-slate-500">File Name</th>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-slate-500">Uploaded By</th>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-slate-500">Start Time</th>
                    <th className="px-4 py-2 text-right text-xs font-semibold text-slate-500">Total Rows</th>
                    <th className="px-4 py-2 text-right text-xs font-semibold text-slate-500">Success</th>
                    <th className="px-4 py-2 text-right text-xs font-semibold text-slate-500">Failed</th>
                    <th className="px-4 py-2 text-center text-xs font-semibold text-slate-500">Status</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-50 text-sm">
                  {importJobs.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-6 text-center text-slate-400">No import records.</td>
                    </tr>
                  ) : (
                    importJobs.map(job => (
                      <tr key={job.id}>
                        <td className="px-4 py-3 font-semibold text-slate-800">{job.originalFilename}</td>
                        <td className="px-4 py-3 text-slate-600">{job.uploadedBy}</td>
                        <td className="px-4 py-3 text-slate-500">{job.uploadStartedAt.replace('T', ' ').substring(0, 19)}</td>
                        <td className="px-4 py-3 text-right font-mono text-slate-600">{job.totalRows}</td>
                        <td className="px-4 py-3 text-right font-mono text-emerald-600 font-semibold">{job.successfulRows}</td>
                        <td className="px-4 py-3 text-right font-mono text-rose-600 font-semibold">{job.failedRows}</td>
                        <td className="px-4 py-3 text-center">
                          <span className={`px-2 py-0.5 rounded-full text-xxs font-bold ${
                            job.uploadStatus === 'COMPLETED' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
                            job.uploadStatus === 'COMPLETED_WITH_ERRORS' ? 'bg-amber-50 text-amber-600 border border-amber-100' :
                            'bg-rose-50 text-rose-600 border border-rose-100'
                          }`}>
                            {job.uploadStatus.replace(/_/g, ' ')}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <div className="flex justify-end pt-2">
              <button 
                onClick={() => setShowHistoryModal(false)}
                className="px-5 py-2 bg-slate-800 text-white rounded-xl text-sm font-semibold hover:bg-slate-900 transition-colors"
              >
                Close History
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
