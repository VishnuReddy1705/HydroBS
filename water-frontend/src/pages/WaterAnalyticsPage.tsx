import React, { useState, useEffect } from 'react';
import { 
  Activity, Droplet, AlertTriangle, TrendingUp, Building, 
  UserCheck, ShieldAlert, Zap, Calendar, RefreshCw 
} from 'lucide-react';
import { waterService, type ReadingsAnalytics } from '../services/waterService';
import { 
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, 
  Tooltip, BarChart, Bar, LineChart, Line 
} from 'recharts';
import { toast } from 'sonner';

export default function WaterAnalyticsPage() {
  const [analytics, setAnalytics] = useState<ReadingsAnalytics | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const data = await waterService.getReadingsAnalytics();
      setAnalytics(data);
    } catch  {
      toast.error('Failed to load consumption analytics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        <div className="h-10 w-1/4 bg-slate-100 rounded-lg animate-pulse"></div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[...Array(4)].map((_, idx) => (
            <div key={idx} className="bg-white border border-slate-100 rounded-3xl p-6 h-28 animate-pulse"></div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white border border-slate-100 rounded-3xl p-6 h-96 animate-pulse"></div>
          <div className="bg-white border border-slate-100 rounded-3xl p-6 h-96 animate-pulse"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            Water Consumption Analytics
          </h1>
          <p className="text-slate-500 mt-1">Real-time water usage indicators, trends, building summaries, and anomalies.</p>
        </div>
        <button 
          onClick={fetchAnalytics}
          className="p-3 bg-white hover:bg-slate-50 text-slate-600 rounded-2xl border border-slate-150 transition-colors shadow-sm"
          title="Refresh analytics data"
        >
          <RefreshCw size={18} />
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm flex items-center gap-4 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-blue-500"></div>
          <div className="p-4 bg-blue-50 rounded-2xl text-blue-600">
            <Droplet size={24} />
          </div>
          <div>
            <span className="text-sm text-slate-400 font-semibold uppercase tracking-wider block">Total Usage</span>
            <span className="text-2xl font-black text-slate-800">{analytics?.totalWaterUsed || 0} L</span>
          </div>
        </div>

        <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm flex items-center gap-4 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-rose-500"></div>
          <div className="p-4 bg-rose-50 rounded-2xl text-rose-600">
            <AlertTriangle size={24} />
          </div>
          <div>
            <span className="text-sm text-slate-400 font-semibold uppercase tracking-wider block">Anomalies Detected</span>
            <span className="text-2xl font-black text-rose-600">{analytics?.anomalyCount || 0}</span>
          </div>
        </div>

        <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm flex items-center gap-4 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-amber-500"></div>
          <div className="p-4 bg-amber-50 rounded-2xl text-amber-600">
            <TrendingUp size={24} />
          </div>
          <div>
            <span className="text-sm text-slate-400 font-semibold uppercase tracking-wider block">Peak Single Read</span>
            <span className="text-2xl font-black text-slate-800">{analytics?.peakUsage || 0} L</span>
          </div>
        </div>

        <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm flex items-center gap-4 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-indigo-500"></div>
          <div className="p-4 bg-indigo-50 rounded-2xl text-indigo-600">
            <Activity size={24} />
          </div>
          <div>
            <span className="text-sm text-slate-400 font-semibold uppercase tracking-wider block">Lowest Record</span>
            <span className="text-2xl font-black text-slate-800">{analytics?.minUsage || 0} L</span>
          </div>
        </div>
      </div>

      {/* Main Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Weekly Line Chart */}
        <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-slate-800 flex items-center gap-2">
              <Zap className="text-indigo-500" size={18} />
              Daily Consumption Trend
            </h3>
            <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Last 7 Days</span>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={analytics?.weeklyUsageTrend || []}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                <Tooltip />
                <Line type="monotone" dataKey="usage" stroke="#6366f1" strokeWidth={3} dot={{ stroke: '#6366f1', strokeWidth: 2, r: 4 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Monthly Area Chart */}
        <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-slate-800 flex items-center gap-2">
              <Calendar className="text-blue-500" size={18} />
              Monthly Volume Statistics
            </h3>
            <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Last 6 Months</span>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={analytics?.monthlyUsageTrend || []}>
                <defs>
                  <linearGradient id="colorUsage" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                <Tooltip />
                <Area type="monotone" dataKey="usage" stroke="#3b82f6" strokeWidth={2.5} fillOpacity={1} fill="url(#colorUsage)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Building stats */}
        <div className="lg:col-span-2 bg-white border border-slate-100 rounded-3xl p-6 shadow-sm space-y-4">
          <h3 className="font-bold text-slate-800 flex items-center gap-2">
            <Building className="text-slate-500" size={18} />
            Consumption by Building / Tower
          </h3>
          <div className="h-80">
            {analytics?.consumptionByBuilding.length === 0 ? (
              <div className="h-full flex items-center justify-center text-slate-400">
                No building assignments registered to map data.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics?.consumptionByBuilding || []}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="building" stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <Tooltip />
                  <Bar dataKey="usage" fill="#10b981" radius={[8, 8, 0, 0]} maxBarSize={45} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Top Consumers list */}
        <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-slate-800 flex items-center gap-2 pb-3 border-b border-slate-50">
              <UserCheck className="text-emerald-500" size={18} />
              Top 5 Water Consumers
            </h3>
            <div className="mt-4 space-y-4">
              {analytics?.topConsumers.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-sm">No readings logged.</div>
              ) : (
                analytics?.topConsumers.map((consumer, idx) => (
                  <div key={idx} className="flex justify-between items-center py-2 border-b border-slate-50 last:border-0">
                    <div>
                      <span className="font-bold text-slate-700 block">Flat {consumer.flat}</span>
                      <span className="text-xs text-slate-400">{consumer.resident}</span>
                    </div>
                    <span className="font-extrabold text-slate-800 text-sm bg-slate-50 border border-slate-100 px-3 py-1 rounded-xl">
                      {consumer.usage} L
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="mt-6 flex items-center gap-2 text-xxs text-slate-400 bg-rose-50/50 p-3 rounded-2xl border border-rose-100/50">
            <ShieldAlert className="text-rose-500" size={18} />
            <span>High values could indicate silent meter leaks. Verify flats with continuous high usage logs.</span>
          </div>
        </div>
      </div>
    </div>
  );
}
