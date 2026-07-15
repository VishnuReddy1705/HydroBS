import React, { useState, useEffect } from 'react';
import { 
  Plus, Search, Edit2, RotateCw, CheckCircle, XCircle, AlertTriangle, 
  Trash2, UserPlus, Info, Check, RefreshCw, Layers, Calendar, Disc 
} from 'lucide-react';
import { waterService, type Meter } from '../services/waterService';
import { residentService } from '../services/residentService';
import { toast } from 'sonner';

export default function MeterManagementPage() {
  const [meters, setMeters] = useState<Meter[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  
  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showReplaceModal, setShowReplaceModal] = useState(false);
  const [selectedMeter, setSelectedMeter] = useState<Meter | null>(null);

  // Forms
  const [newMeterNumber, setNewMeterNumber] = useState('');
  const [newMeterType, setNewMeterType] = useState('MECHANICAL');
  const [installationDate, setInstallationDate] = useState('');
  const [calibrationDate, setCalibrationDate] = useState('');
  const [lastServiceDate, setLastServiceDate] = useState('');
  const [nextServiceDate, setNextServiceDate] = useState('');
  const [residentSearchQuery, setResidentSearchQuery] = useState('');
  const [residents, setResidents] = useState<any[]>([]);
  const [selectedResidentId, setSelectedResidentId] = useState<number | null>(null);
  
  // Replacement meter number
  const [replacementNumber, setReplacementNumber] = useState('');

  const fetchMeters = async () => {
    try {
      setLoading(true);
      const data = await waterService.getMeters(statusFilter === 'ALL' ? undefined : statusFilter);
      setMeters(data);
    } catch (err: any) {
      toast.error('Failed to load water meters.');
    } finally {
      setLoading(false);
    }
  };

  const fetchResidents = async () => {
    try {
      // Fetch all active residents for assignment dropdown mapping
      const res = await residentService.getResidents({ page: 0, size: 200 });
      setResidents(res.content);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchMeters();
    fetchResidents();
  }, [statusFilter]);

  const handleCreateMeter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMeterNumber.trim()) {
      toast.error('Meter number is required');
      return;
    }
    try {
      await waterService.createMeter({
        meterNumber: newMeterNumber.trim(),
        meterType: newMeterType,
        installationDate: installationDate || undefined,
        calibrationDate: calibrationDate || undefined,
        lastServiceDate: lastServiceDate || undefined,
        nextServiceDate: nextServiceDate || undefined,
        residentId: selectedResidentId || undefined
      });
      toast.success('Meter registered successfully!');
      setShowAddModal(false);
      resetAddForm();
      fetchMeters();
    } catch (err: any) {
      toast.error(err.response?.data || 'Failed to register meter');
    }
  };

  const handleAssignMeter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMeter) return;
    try {
      await waterService.assignMeter(selectedMeter.id, selectedResidentId || undefined);
      toast.success('Meter assigned successfully!');
      setShowAssignModal(false);
      setSelectedResidentId(null);
      fetchMeters();
    } catch (err: any) {
      toast.error(err.response?.data || 'Failed to assign meter');
    }
  };

  const handleReplaceMeter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMeter || !replacementNumber.trim()) {
      toast.error('Replacement meter number is required');
      return;
    }
    try {
      await waterService.replaceMeter(selectedMeter.id, replacementNumber.trim());
      toast.success('Meter replaced successfully! Previous meter decommissioned.');
      setShowReplaceModal(false);
      setReplacementNumber('');
      fetchMeters();
    } catch (err: any) {
      toast.error(err.response?.data || 'Failed to replace meter');
    }
  };

  const handleToggleStatus = async (id: number, currentStatus: string) => {
    const nextStatus = currentStatus === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    try {
      await waterService.toggleMeterStatus(id, nextStatus);
      toast.success(`Meter set to ${nextStatus.toLowerCase()}`);
      fetchMeters();
    } catch (err) {
      toast.error('Failed to change status');
    }
  };

  const handleDeleteMeter = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this meter record?')) return;
    try {
      await waterService.deleteMeter(id);
      toast.success('Meter record removed');
      fetchMeters();
    } catch (err) {
      toast.error('Failed to delete meter');
    }
  };

  const resetAddForm = () => {
    setNewMeterNumber('');
    setNewMeterType('MECHANICAL');
    setInstallationDate('');
    setCalibrationDate('');
    setLastServiceDate('');
    setNextServiceDate('');
    setSelectedResidentId(null);
  };

  const filteredMeters = meters.filter(m => 
    m.meterNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (m.residentName && m.residentName.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (m.flatNumber && m.flatNumber.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            Meter Inventory Management
          </h1>
          <p className="text-slate-500 mt-1">Register, track, calibrate and assign water meters.</p>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="px-5 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl flex items-center gap-2 hover:opacity-90 transition-all shadow-md font-medium"
        >
          <Plus size={20} />
          Register Meter
        </button>
      </div>

      {/* Filter and Search controls */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-white p-5 rounded-3xl border border-slate-100 shadow-sm">
        <div className="relative col-span-2">
          <span className="absolute inset-y-0 left-4 flex items-center text-slate-400">
            <Search size={20} />
          </span>
          <input
            type="text"
            placeholder="Search by meter number, resident name, or flat number..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none bg-no-repeat bg-right"
          >
            <option value="ALL">All Statuses</option>
            <option value="ACTIVE">Active Only</option>
            <option value="INACTIVE">Inactive Only</option>
            <option value="DECOMMISSIONED">Decommissioned</option>
          </select>
        </div>
      </div>

      {/* Grid inventory */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, idx) => (
            <div key={idx} className="bg-white border border-slate-100 rounded-3xl p-6 h-60 animate-pulse space-y-4">
              <div className="h-6 w-1/2 bg-slate-100 rounded-lg"></div>
              <div className="h-4 w-3/4 bg-slate-100 rounded-lg"></div>
              <div className="h-4 w-2/3 bg-slate-100 rounded-lg"></div>
              <div className="h-10 w-full bg-slate-100 rounded-xl"></div>
            </div>
          ))}
        </div>
      ) : filteredMeters.length === 0 ? (
        <div className="bg-white border border-slate-100 rounded-3xl p-12 text-center text-slate-500 space-y-3">
          <Info size={48} className="mx-auto text-blue-500" />
          <p className="text-lg font-semibold">No meters found</p>
          <p className="text-sm">Try modifying your search or filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredMeters.map((meter) => (
            <div 
              key={meter.id} 
              className={`bg-white border border-slate-100 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between relative overflow-hidden ${
                meter.status === 'DECOMMISSIONED' ? 'opacity-65' : ''
              }`}
            >
              {/* Top Accent line */}
              <div className={`absolute top-0 left-0 right-0 h-1.5 ${
                meter.status === 'ACTIVE' ? 'bg-emerald-500' :
                meter.status === 'INACTIVE' ? 'bg-amber-500' : 'bg-slate-400'
              }`}></div>

              <div>
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-xs uppercase tracking-wider text-slate-400 font-semibold">{meter.meterType}</span>
                    <h3 className="text-xl font-bold text-slate-800 mt-1 flex items-center gap-1.5">
                      <Disc className="text-blue-500 animate-spin" style={{ animationDuration: '6s' }} size={18} />
                      {meter.meterNumber}
                    </h3>
                  </div>

                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    meter.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
                    meter.status === 'INACTIVE' ? 'bg-amber-50 text-amber-600 border border-amber-100' :
                    'bg-slate-100 text-slate-500 border border-slate-200'
                  }`}>
                    {meter.status}
                  </span>
                </div>

                <div className="mt-4 space-y-2.5 text-sm text-slate-600 border-t border-slate-50 pt-4">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Assigned Flat</span>
                    <span className="font-semibold text-slate-700">
                      {meter.flatNumber ? `Flat ${meter.flatNumber}` : 'Unassigned'}
                    </span>
                  </div>

                  {meter.residentName && (
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Resident</span>
                      <span className="font-medium text-slate-800">{meter.residentName}</span>
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Calibration Date</span>
                    <span className="text-slate-700">{meter.calibrationDate || 'Not Calibrated'}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Next Service</span>
                    <span className="text-slate-700">{meter.nextServiceDate || 'Not Scheduled'}</span>
                  </div>
                </div>
              </div>

              {meter.status !== 'DECOMMISSIONED' && (
                <div className="mt-6 pt-4 border-t border-slate-100 flex gap-2">
                  <button 
                    onClick={() => {
                      setSelectedMeter(meter);
                      setShowAssignModal(true);
                    }}
                    className="flex-1 px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <UserPlus size={14} />
                    Assign
                  </button>

                  <button 
                    onClick={() => {
                      setSelectedMeter(meter);
                      setShowReplaceModal(true);
                    }}
                    className="flex-1 px-3 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <RefreshCw size={14} />
                    Replace
                  </button>

                  <button 
                    onClick={() => handleToggleStatus(meter.id, meter.status)}
                    className={`p-2 rounded-xl border transition-colors ${
                      meter.status === 'ACTIVE' 
                        ? 'border-amber-200 text-amber-500 bg-amber-50 hover:bg-amber-100' 
                        : 'border-emerald-200 text-emerald-500 bg-emerald-50 hover:bg-emerald-100'
                    }`}
                    title={meter.status === 'ACTIVE' ? 'Deactivate Meter' : 'Activate Meter'}
                  >
                    {meter.status === 'ACTIVE' ? <XCircle size={16} /> : <CheckCircle size={16} />}
                  </button>

                  <button 
                    onClick={() => handleDeleteMeter(meter.id)}
                    className="p-2 border border-rose-200 text-rose-500 bg-rose-50 hover:bg-rose-100 rounded-xl transition-colors"
                    title="Delete Meter Record"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-lg shadow-xl space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-slate-800">Register New Water Meter</h2>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600 text-2xl font-semibold">&times;</button>
            </div>

            <form onSubmit={handleCreateMeter} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-600 mb-1">Meter Number (Unique)</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. WM-2026-908"
                  value={newMeterNumber}
                  onChange={(e) => setNewMeterNumber(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-600 mb-1">Meter Type</label>
                  <select
                    value={newMeterType}
                    onChange={(e) => setNewMeterType(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    <option value="MECHANICAL">Mechanical</option>
                    <option value="DIGITAL">Digital</option>
                    <option value="SMART">Smart Meter</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-600 mb-1">Assign Resident (Optional)</label>
                  <select
                    value={selectedResidentId || ''}
                    onChange={(e) => setSelectedResidentId(Number(e.target.value) || null)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    <option value="">Unassigned</option>
                    {residents.map((r) => (
                      <option key={r.id} value={r.id}>{r.fullName} ({r.flatNumber})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-600 mb-1">Installation Date</label>
                  <input
                    type="date"
                    value={installationDate}
                    onChange={(e) => setInstallationDate(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-600 mb-1">Calibration Date</label>
                  <input
                    type="date"
                    value={calibrationDate}
                    onChange={(e) => setCalibrationDate(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-600 mb-1">Last Service Date</label>
                  <input
                    type="date"
                    value={lastServiceDate}
                    onChange={(e) => setLastServiceDate(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-600 mb-1">Next Service Date</label>
                  <input
                    type="date"
                    value={nextServiceDate}
                    onChange={(e) => setNextServiceDate(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold hover:opacity-90 shadow-md transition-all"
                >
                  Register Meter
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Assign Modal */}
      {showAssignModal && selectedMeter && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-xl space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold text-slate-800">Assign Meter</h2>
              <button onClick={() => setShowAssignModal(false)} className="text-slate-400 hover:text-slate-600 text-2xl font-semibold">&times;</button>
            </div>

            <form onSubmit={handleAssignMeter} className="space-y-4">
              <div className="p-4 bg-blue-50/50 rounded-2xl border border-blue-100/50">
                <p className="text-sm text-slate-600">Assigning Meter: <span className="font-semibold text-blue-600">{selectedMeter.meterNumber}</span></p>
                {selectedMeter.residentName && (
                  <p className="text-xs text-amber-600 mt-1">Currently assigned to: {selectedMeter.residentName} (Flat {selectedMeter.flatNumber})</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-600 mb-1">Select Resident Flat</label>
                <select
                  value={selectedResidentId || ''}
                  onChange={(e) => setSelectedResidentId(Number(e.target.value) || null)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  <option value="">Unassigned (Remove Assignment)</option>
                  {residents.map((r) => (
                    <option key={r.id} value={r.id}>{r.fullName} ({r.flatNumber})</option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAssignModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-colors"
                >
                  Confirm Assignment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Replace Modal */}
      {showReplaceModal && selectedMeter && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-xl space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold text-slate-800">Replace Water Meter</h2>
              <button onClick={() => setShowReplaceModal(false)} className="text-slate-400 hover:text-slate-600 text-2xl font-semibold">&times;</button>
            </div>

            <form onSubmit={handleReplaceMeter} className="space-y-4">
              <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 text-amber-700 space-y-1.5">
                <div className="flex items-center gap-2 font-semibold">
                  <AlertTriangle size={18} />
                  <span>Replacement Warning</span>
                </div>
                <p className="text-xs">
                  This action will change the current meter status of <b>{selectedMeter.meterNumber}</b> to <b>DECOMMISSIONED</b>, remove its resident assignment, and register a new active meter assigned to this resident.
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-600 mb-1">Old Meter Number</label>
                <input
                  type="text"
                  disabled
                  value={selectedMeter.meterNumber}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-600 mb-1">New Meter Number</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. WM-2026-999"
                  value={replacementNumber}
                  onChange={(e) => setReplacementNumber(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowReplaceModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition-colors"
                >
                  Decommission & Swap
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
