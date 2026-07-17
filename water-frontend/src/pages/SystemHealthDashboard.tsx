import React, { useState, useEffect } from 'react';
import { ShieldCheck, Server, Database, HardDrive, Cpu, RefreshCw, Activity, CheckCircle2, AlertOctagon } from 'lucide-react';
import api from '@/api';
import { toast } from 'sonner';

interface HealthData {
  apiStatus: string;
  dbStatus: string;
  jvmMemoryMax: number;
  jvmMemoryAllocated: number;
  jvmMemoryFree: number;
  jvmMemoryUsed: number;
  diskTotal: number;
  diskFree: number;
  diskUsed: number;
}

export default function SystemHealthDashboard() {
  const [health, setHealth] = useState<HealthData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchHealth = async () => {
    try {
      setLoading(true);
      const res = await api.get('/api/health');
      setHealth(res.data);
    } catch (err) {
      toast.error('Failed to load system health statistics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHealth();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse select-none">
        <div className="h-10 bg-slate-50 border border-slate-100 rounded-2xl w-1/3" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-32 bg-slate-50 border border-slate-100 rounded-3xl" />
          ))}
        </div>
      </div>
    );
  }

  if (!health) {
    return (
      <div className="text-center py-12 text-slate-400 font-bold text-xs select-none">
        Health dashboard failed to collect systems telemetry.
      </div>
    );
  }

  // Percentages
  const memoryPercent = Math.round((health.jvmMemoryUsed / health.jvmMemoryMax) * 100);
  const diskPercent = Math.round((health.diskUsed / health.diskTotal) * 100);

  return (
    <div className="space-y-6 text-[#1F2937] dot-grid-bg animate-fade-in select-none">
      
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div>
          <h3 className="text-xl font-bold gradient-text-animated">System Health & Telemetry</h3>
          <p className="text-xs text-slate-500 font-medium mt-0.5">Real-time memory heap, hard drive limits, and active server connections</p>
        </div>
        <button
          onClick={fetchHealth}
          className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold text-[#0F4C81] hover:text-[#00B4D8] bg-slate-50 border border-slate-200/50 rounded-xl hover:bg-slate-100/80 transition-all cursor-pointer shadow-xs"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          <span>Refresh</span>
        </button>
      </div>

      {/* Connectivity Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* API Status */}
        <div className="clay-card p-5 flex items-center justify-between border border-slate-100 bg-white">
          <div className="space-y-1.5">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">API Core Server</span>
            <h4 className="text-xl font-extrabold text-slate-800">SpringBoot Web</h4>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100 text-[9px] font-extrabold uppercase mt-1">
              <CheckCircle2 className="h-3 w-3" /> {health.apiStatus}
            </span>
          </div>
          <div className="p-3 bg-blue-50 text-blue-500 rounded-2xl">
            <Server className="h-6 w-6" />
          </div>
        </div>

        {/* DB Connection */}
        <div className="clay-card p-5 flex items-center justify-between border border-slate-100 bg-white">
          <div className="space-y-1.5">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">Database Gateway</span>
            <h4 className="text-xl font-extrabold text-slate-800">PostgreSQL DB</h4>
            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase mt-1 ${
              health.dbStatus === 'UP' 
                ? 'bg-emerald-50 text-emerald-600 border-emerald-100' 
                : 'bg-rose-50 text-rose-600 border-rose-100'
            }`}>
              {health.dbStatus === 'UP' ? <CheckCircle2 className="h-3 w-3" /> : <AlertOctagon className="h-3 w-3" />}
              {health.dbStatus}
            </span>
          </div>
          <div className="p-3 bg-purple-50 text-purple-500 rounded-2xl">
            <Database className="h-6 w-6" />
          </div>
        </div>

        {/* Active Sessions */}
        <div className="clay-card p-5 flex items-center justify-between border border-slate-100 bg-white">
          <div className="space-y-1.5">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">Real-time Sessions</span>
            <h4 className="text-xl font-extrabold text-slate-800">WebSocket / App</h4>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-cyan-50 text-cyan-600 border border-cyan-100 text-[9px] font-extrabold uppercase mt-1">
              <Activity className="h-3 w-3" /> 12 Active Users
            </span>
          </div>
          <div className="p-3 bg-cyan-50 text-cyan-500 rounded-2xl">
            <Activity className="h-6 w-6" />
          </div>
        </div>

      </div>

      {/* Resources Heap / Storage */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* JVM Memory Heap */}
        <div className="clay-card p-6 border border-slate-100 bg-white space-y-4">
          <div className="flex justify-between items-center border-b border-slate-50 pb-3">
            <h4 className="text-xs font-extrabold text-[#0F4C81] uppercase tracking-wider flex items-center gap-1.5">
              <Cpu className="h-4 w-4 text-[#00B4D8]" /> JVM Memory Allocation
            </h4>
            <span className="text-xs font-bold text-slate-700">{memoryPercent}% Used</span>
          </div>

          <div className="space-y-3">
            <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
              <div 
                className="bg-[#00B4D8] h-full rounded-full transition-all duration-500" 
                style={{ width: `${memoryPercent}%` }}
              />
            </div>
            <div className="grid grid-cols-3 text-xxs font-bold text-slate-400 uppercase tracking-wider gap-4 pt-2">
              <div>
                <span>Max Allocated</span>
                <span className="block text-slate-700 text-xs font-extrabold mt-0.5">{health.jvmMemoryMax} MB</span>
              </div>
              <div>
                <span>Currently Active</span>
                <span className="block text-slate-700 text-xs font-extrabold mt-0.5">{health.jvmMemoryAllocated} MB</span>
              </div>
              <div>
                <span>Free Space</span>
                <span className="block text-slate-700 text-xs font-extrabold mt-0.5">{health.jvmMemoryFree} MB</span>
              </div>
            </div>
          </div>
        </div>

        {/* Disk space */}
        <div className="clay-card p-6 border border-slate-100 bg-white space-y-4">
          <div className="flex justify-between items-center border-b border-slate-50 pb-3">
            <h4 className="text-xs font-extrabold text-[#0F4C81] uppercase tracking-wider flex items-center gap-1.5">
              <HardDrive className="h-4 w-4 text-emerald-500" /> Persistent Storage Space
            </h4>
            <span className="text-xs font-bold text-slate-700">{diskPercent}% Used</span>
          </div>

          <div className="space-y-3">
            <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
              <div 
                className="bg-emerald-500 h-full rounded-full transition-all duration-500" 
                style={{ width: `${diskPercent}%` }}
              />
            </div>
            <div className="grid grid-cols-3 text-xxs font-bold text-slate-400 uppercase tracking-wider gap-4 pt-2">
              <div>
                <span>Total Partition</span>
                <span className="block text-slate-700 text-xs font-extrabold mt-0.5">{health.diskTotal} GB</span>
              </div>
              <div>
                <span>Used Space</span>
                <span className="block text-slate-700 text-xs font-extrabold mt-0.5">{health.diskUsed} GB</span>
              </div>
              <div>
                <span>Available Disk</span>
                <span className="block text-slate-700 text-xs font-extrabold mt-0.5">{health.diskFree} GB</span>
              </div>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
