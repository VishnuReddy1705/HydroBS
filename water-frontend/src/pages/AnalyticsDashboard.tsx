import React, { useState, useEffect } from 'react';
import { 
  BarChart3, Activity, Droplets, CreditCard, DollarSign, RefreshCw, 
  ChevronDown, ChevronUp, Eye, EyeOff, Layout, Sparkles, AlertCircle, TrendingUp
} from 'lucide-react';
import { 
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, 
  Tooltip, BarChart, Bar, LineChart, Line, Legend, PieChart, Pie, Cell 
} from 'recharts';
import api from '@/api';
import { getRole, getCommunityId } from '@/lib/auth';
import { toast } from 'sonner';

const COLORS = ['#17c8d8', '#00b4d8', '#0F4C81', '#34d8e8', '#f5fafc', '#a5f3fc'];

export default function AnalyticsDashboard() {
  const role = getRole();
  const myCommunityId = getCommunityId();

  const [loading, setLoading] = useState(true);
  const [kpis, setKpis] = useState<any>(null);
  const [charts, setCharts] = useState<any>(null);
  const [insights, setInsights] = useState<any[]>([]);

  // Widget settings
  const [visibleWidgets, setVisibleWidgets] = useState<Record<string, boolean>>({
    dailyUsage: true,
    monthlyUsage: true,
    yearlyUsage: true,
    buildingUsage: true,
    communityComparison: true,
    paymentStatusDistribution: true,
    paymentMethods: true,
    meterStats: true,
    insights: true
  });

  const [widgetsOrder, setWidgetsOrder] = useState<string[]>([
    'dailyUsage', 'monthlyUsage', 'yearlyUsage', 'buildingUsage', 
    'communityComparison', 'paymentStatusDistribution', 'paymentMethods', 'meterStats', 'insights'
  ]);

  useEffect(() => {
    // Load local storage preferences
    const savedVisibility = localStorage.getItem('bi_widget_visibility');
    if (savedVisibility) {
      try { setVisibleWidgets(JSON.parse(savedVisibility)); } catch (e) {}
    }
    const savedOrder = localStorage.getItem('bi_widget_order');
    if (savedOrder) {
      try { setWidgetsOrder(JSON.parse(savedOrder)); } catch (e) {}
    }

    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const [kpiRes, chartRes, insightRes] = await Promise.all([
        api.get('/api/analytics/kpis'),
        api.get('/api/analytics/charts'),
        api.get('/api/analytics/insights')
      ]);

      setKpis(kpiRes.data);
      setCharts(chartRes.data);
      setInsights(insightRes.data || []);
      toast.success('BI Metrics refreshed successfully.');
    } catch (err) {
      toast.error('Failed to load enterprise BI analytics data.');
    } finally {
      setLoading(false);
    }
  };

  const handleRefreshWidget = async (widgetKey: string) => {
    try {
      if (widgetKey === 'kpis') {
        const res = await api.get('/api/analytics/kpis');
        setKpis(res.data);
      } else {
        const res = await api.get('/api/analytics/charts');
        setCharts((prev: any) => ({
          ...prev,
          [widgetKey]: res.data[widgetKey]
        }));
      }
      toast.success('Widget refreshed.');
    } catch (err) {
      toast.error('Failed to refresh widget.');
    }
  };

  const toggleWidgetVisibility = (key: string) => {
    const updated = { ...visibleWidgets, [key]: !visibleWidgets[key] };
    setVisibleWidgets(updated);
    localStorage.setItem('bi_widget_visibility', JSON.stringify(updated));
  };

  const moveWidget = (idx: number, direction: 'up' | 'down') => {
    const newOrder = [...widgetsOrder];
    const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (targetIdx >= 0 && targetIdx < newOrder.length) {
      const temp = newOrder[idx];
      newOrder[idx] = newOrder[targetIdx];
      newOrder[targetIdx] = temp;
      setWidgetsOrder(newOrder);
      localStorage.setItem('bi_widget_order', JSON.stringify(newOrder));
    }
  };

  if (loading && !kpis) {
    return (
      <div className="min-h-screen bg-[#071321] text-slate-100 flex items-center justify-center gap-3">
        <RefreshCw className="h-10 w-10 animate-spin text-[#17c8d8]" />
        <span className="text-xs uppercase font-extrabold tracking-widest text-[#17c8d8]">Compiling BI Dashboards...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#071321] text-slate-100 p-6 md:p-10 select-none">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-[#17c8d8]/10 pb-6">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-[#17c8d8] via-[#34d8e8] to-[#f5fafc] bg-clip-text text-transparent flex items-center gap-3">
              <BarChart3 className="text-[#17c8d8] h-8 w-8" />
              Business Intelligence Dashboard
            </h1>
            <p className="text-slate-400 text-sm mt-2">Executive control panels showing consolidation matrices, water consumption trends, and financial rates.</p>
          </div>

          <button
            onClick={fetchAnalytics}
            className="flex items-center gap-2 px-4.5 py-2.5 bg-[#0b1f35] hover:bg-[#113a5c] text-[#17c8d8] border border-[#17c8d8]/30 rounded-2xl text-xs font-black uppercase tracking-wider transition-all"
          >
            <RefreshCw className="h-4 w-4" /> Refresh All
          </button>
        </div>

        {/* Executive KPI Cards */}
        {kpis && (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            <div className="bg-[#0b1f35] border border-white/5 p-4 rounded-2xl relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-[3px] bg-[#17c8d8]" />
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Total Communities</span>
              <span className="text-xl font-extrabold block mt-2 text-[#f5fafc]">{kpis.totalCommunities || 0}</span>
            </div>
            
            <div className="bg-[#0b1f35] border border-white/5 p-4 rounded-2xl relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-[3px] bg-[#34d8e8]" />
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Total Residents</span>
              <span className="text-xl font-extrabold block mt-2 text-[#f5fafc]">{kpis.totalResidents || 0}</span>
            </div>

            <div className="bg-[#0b1f35] border border-white/5 p-4 rounded-2xl relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-[3px] bg-indigo-500" />
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Active Meters</span>
              <span className="text-xl font-extrabold block mt-2 text-[#f5fafc]">{kpis.totalActiveMeters || 0}</span>
            </div>

            <div className="bg-[#0b1f35] border border-white/5 p-4 rounded-2xl relative overflow-hidden col-span-2 lg:col-span-1">
              <div className="absolute top-0 left-0 w-full h-[3px] bg-blue-500" />
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Total Water Used</span>
              <span className="text-xl font-extrabold block mt-2 text-[#17c8d8]">{kpis.totalWaterConsumption || 0} L</span>
            </div>

            <div className="bg-[#0b1f35] border border-white/5 p-4 rounded-2xl relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-[3px] bg-emerald-500" />
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Avg Consumed</span>
              <span className="text-xl font-extrabold block mt-2 text-[#f5fafc]">{kpis.averageWaterConsumption || 0} L</span>
            </div>

            <div className="bg-[#0b1f35] border border-white/5 p-4 rounded-2xl relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-[3px] bg-emerald-600" />
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Monthly Rev</span>
              <span className="text-xl font-extrabold block mt-2 text-emerald-400">₹{kpis.monthlyRevenue || 0}</span>
            </div>

            <div className="bg-[#0b1f35] border border-white/5 p-4 rounded-2xl relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-[3px] bg-teal-500" />
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Yearly Rev</span>
              <span className="text-xl font-extrabold block mt-2 text-emerald-400">₹{kpis.yearlyRevenue || 0}</span>
            </div>

            <div className="bg-[#0b1f35] border border-white/5 p-4 rounded-2xl relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-[3px] bg-rose-500" />
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Outstanding Balance</span>
              <span className="text-xl font-extrabold block mt-2 text-rose-400">₹{kpis.outstandingRevenue || 0}</span>
            </div>

            <div className="bg-[#0b1f35] border border-white/5 p-4 rounded-2xl relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-[3px] bg-amber-500" />
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Collection Rate</span>
              <span className="text-xl font-extrabold block mt-2 text-[#f5fafc]">{kpis.collectionRate || 0}%</span>
            </div>

            <div className="bg-[#0b1f35] border border-white/5 p-4 rounded-2xl relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-[3px] bg-[#17c8d8]" />
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Success Rate</span>
              <span className="text-xl font-extrabold block mt-2 text-[#f5fafc]">{kpis.paymentSuccessRate || 0}%</span>
            </div>

            <div className="bg-[#0b1f35] border border-white/5 p-4 rounded-2xl relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-[3px] bg-[#34d8e8]" />
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Growth Indices</span>
              <span className="text-xs font-bold block mt-2 text-slate-300">
                Res: +{kpis.monthlyGrowth} / Comm: +{kpis.communityGrowth}
              </span>
            </div>
          </div>
        )}

        {/* Dynamic & Draggable Grid Widgets */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {widgetsOrder.map((key, index) => {
            const isVisible = visibleWidgets[key];
            if (key === 'insights') {
              return (
                <div key={key} className={`lg:col-span-2 bg-[#0b1f35] border border-white/5 p-6 rounded-3xl backdrop-blur-md relative ${!isVisible ? 'hidden' : ''}`}>
                  <div className="flex justify-between items-center border-b border-[#17c8d8]/10 pb-4 mb-6">
                    <h3 className="text-xs font-extrabold uppercase tracking-widest text-[#17c8d8] flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-cyan-400" />
                      Rule-Based Platform Insights (AI Ready)
                    </h3>
                    <div className="flex items-center gap-2">
                      <button onClick={() => moveWidget(index, 'up')} className="p-1 hover:bg-white/5 rounded"><ChevronDown className="h-4 w-4 rotate-180" /></button>
                      <button onClick={() => moveWidget(index, 'down')} className="p-1 hover:bg-white/5 rounded"><ChevronDown className="h-4 w-4" /></button>
                      <button onClick={() => toggleWidgetVisibility(key)} className="p-1 hover:bg-white/5 rounded"><EyeOff className="h-4 w-4" /></button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {insights.map((insight: any, idx: number) => (
                      <div key={idx} className="bg-[#071321] border border-white/5 rounded-2xl p-5 space-y-4">
                        <div>
                          <h4 className="text-xs font-extrabold text-[#34d8e8] uppercase tracking-wider">{insight.title}</h4>
                          <p className="text-[10px] text-slate-500 mt-1 leading-relaxed">{insight.description}</p>
                        </div>

                        <div className="space-y-2 text-xxs font-bold text-slate-300">
                          {insight.items?.map((item: any, iIdx: number) => (
                            <div key={iIdx} className="flex justify-between py-1.5 border-b border-white/5 last:border-0">
                              <span>{item.residentName || item.name || item.metric}</span>
                              <span className="text-[#17c8d8]">{item.usage || item.outstanding || item.value}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            }

            const chartData = charts?.[key] || [];

            return (
              <div key={key} className={`bg-[#0b1f35] border border-white/5 p-6 rounded-3xl backdrop-blur-md relative ${!isVisible ? 'hidden' : ''}`}>
                <div className="flex justify-between items-center border-b border-[#17c8d8]/10 pb-4 mb-6">
                  <h3 className="text-xs font-extrabold uppercase tracking-widest text-[#17c8d8]">
                    {key.replace(/([A-Z])/g, ' $1')}
                  </h3>
                  <div className="flex items-center gap-2">
                    <button onClick={() => handleRefreshWidget(key)} className="p-1 hover:bg-white/5 rounded text-slate-400 hover:text-white"><RefreshCw className="h-3 w-3" /></button>
                    <button onClick={() => moveWidget(index, 'up')} className="p-1 hover:bg-white/5 rounded"><ChevronDown className="h-4 w-4 rotate-180" /></button>
                    <button onClick={() => moveWidget(index, 'down')} className="p-1 hover:bg-white/5 rounded"><ChevronDown className="h-4 w-4" /></button>
                    <button onClick={() => toggleWidgetVisibility(key)} className="p-1 hover:bg-white/5 rounded"><EyeOff className="h-4 w-4" /></button>
                  </div>
                </div>

                <div className="h-72 w-full">
                  {key === 'dailyUsage' && (
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#113a5c" vertical={false} />
                        <XAxis dataKey="name" stroke="#94a3b8" fontSize={9} />
                        <YAxis stroke="#94a3b8" fontSize={9} />
                        <Tooltip contentStyle={{ backgroundColor: '#071321', borderColor: '#17c8d8' }} />
                        <Line type="monotone" dataKey="usage" stroke="#17c8d8" strokeWidth={2.5} />
                      </LineChart>
                    </ResponsiveContainer>
                  )}

                  {key === 'monthlyUsage' && (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chartData}>
                        <defs>
                          <linearGradient id="usageColor" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#34d8e8" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#34d8e8" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#113a5c" vertical={false} />
                        <XAxis dataKey="name" stroke="#94a3b8" fontSize={9} />
                        <YAxis stroke="#94a3b8" fontSize={9} />
                        <Tooltip contentStyle={{ backgroundColor: '#071321', borderColor: '#17c8d8' }} />
                        <Area type="monotone" dataKey="usage" stroke="#34d8e8" fillOpacity={1} fill="url(#usageColor)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  )}

                  {key === 'yearlyUsage' && (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#113a5c" vertical={false} />
                        <XAxis dataKey="name" stroke="#94a3b8" fontSize={9} />
                        <YAxis stroke="#94a3b8" fontSize={9} />
                        <Tooltip contentStyle={{ backgroundColor: '#071321', borderColor: '#17c8d8' }} />
                        <Bar dataKey="usage" fill="#00b4d8" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  )}

                  {key === 'buildingUsage' && (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#113a5c" vertical={false} />
                        <XAxis dataKey="name" stroke="#94a3b8" fontSize={9} />
                        <YAxis stroke="#94a3b8" fontSize={9} />
                        <Tooltip contentStyle={{ backgroundColor: '#071321', borderColor: '#17c8d8' }} />
                        <Bar dataKey="usage" fill="#0F4C81" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  )}

                  {key === 'communityComparison' && (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#113a5c" vertical={false} />
                        <XAxis dataKey="name" stroke="#94a3b8" fontSize={9} />
                        <YAxis stroke="#94a3b8" fontSize={9} />
                        <Tooltip contentStyle={{ backgroundColor: '#071321', borderColor: '#17c8d8' }} />
                        <Bar dataKey="usage" fill="#34d8e8" radius={[4, 4, 0, 0]} name="Water Usage (L)" />
                        <Bar dataKey="revenue" fill="#10b981" radius={[4, 4, 0, 0]} name="Paid Revenue (₹)" />
                      </BarChart>
                    </ResponsiveContainer>
                  )}

                  {(key === 'paymentStatusDistribution' || key === 'paymentMethods' || key === 'meterStats') && (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={chartData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {chartData.map((entry: any, idx: number) => (
                            <Cell key={`cell-${idx}`} fill={COLORS[idx % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={{ backgroundColor: '#071321', borderColor: '#17c8d8' }} />
                        <Legend wrapperStyle={{ fontSize: 10 }} />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>
            );
          })}

        </div>

      </div>
    </div>
  );
}
