import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Activity, TrendingUp, AlertTriangle, ArrowUpRight, 
  RotateCw, RefreshCw, BarChart2, CheckCircle2, ShieldAlert,
  Building, Calendar, Users
} from 'lucide-react';
import { billingService } from '../services/billingService';
import { getCommunityId, getRole } from '@/lib/auth';
import { 
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, 
  Tooltip, BarChart, Bar, Legend 
} from 'recharts';
import { toast } from 'sonner';

export default function BillingDashboard() {
  const navigate = useNavigate();
  const role = getRole();
  const communityId = Number(getCommunityId() || 0);

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      let res;
      if (role === 'SUPER_ADMIN') {
        res = await billingService.getSuperAdminAnalytics();
      } else {
        res = await billingService.getAnalytics(communityId);
      }
      setData(res);
    } catch  {
      toast.error('Failed to load billing analytics dashboards');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#090d16] text-white">
        <RotateCw className="h-10 w-10 animate-spin text-blue-500" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#090d16] text-white">
        <div className="text-center text-slate-500">Failed to load billing metrics data.</div>
      </div>
    );
  }

  const isSuperAdmin = role === 'SUPER_ADMIN';

  // Format currency helpers
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val);
  };

  return (
    <div className="space-y-6 text-slate-800 dark:text-slate-100 select-none">
      
      {/* Header */}
      <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-center border-b border-slate-100 dark:border-slate-800 pb-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-[#0F4C81] dark:text-[#00B4D8] flex items-center gap-3">
            <BarChart2 className="h-8 w-8 text-[#0F4C81] dark:text-[#00B4D8]" />
            {isSuperAdmin ? 'Platform Billing Intelligence' : 'Utility Billing Dashboard'}
          </h1>
          <p className="mt-2 text-slate-500 dark:text-slate-400 text-sm">
            {isSuperAdmin 
              ? 'Consolidated view of revenue collections, community billing comparisons, and forecast trends.'
              : 'Track collections rate, review aging outstanding balances, and check top defaulting residents.'
            }
          </p>
        </div>
        
        <div className="flex flex-wrap gap-3">
          <button
            onClick={fetchAnalytics}
            className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold text-[#0F4C81] hover:text-[#00B4D8] bg-slate-50 border border-slate-200/50 rounded-xl hover:bg-slate-100/80 transition-all cursor-pointer shadow-xs"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Refresh</span>
          </button>
        </div>
      </div>


        {/* Super Admin Metric Cards */}
        {isSuperAdmin ? (
          <div className="mb-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl border border-slate-800 bg-[#0e1626]/80 p-5 backdrop-blur-md">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-slate-400">Total Collected Revenue</span>
                <span className="rounded bg-emerald-500/10 p-1 text-emerald-400">
                  <TrendingUp className="h-4 w-4" />
                </span>
              </div>
              <div className="mt-4 text-2xl font-black text-white">{formatCurrency(data.totalRevenue)}</div>
              <p className="mt-1 text-xs text-slate-500">Gross collections across all communities</p>
            </div>

            <div className="rounded-xl border border-slate-800 bg-[#0e1626]/80 p-5 backdrop-blur-md">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-slate-400">Total Outstanding Receivables</span>
                <span className="rounded bg-red-500/10 p-1 text-red-400">
                  <ShieldAlert className="h-4 w-4" />
                </span>
              </div>
              <div className="mt-4 text-2xl font-black text-white">{formatCurrency(data.totalOutstanding)}</div>
              <p className="mt-1 text-xs text-slate-500">Unpaid invoices currently outstanding</p>
            </div>

            <div className="rounded-xl border border-slate-800 bg-[#0e1626]/80 p-5 backdrop-blur-md">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-slate-400">Active Communities Count</span>
                <span className="rounded bg-blue-500/10 p-1 text-blue-400">
                  <Building className="h-4 w-4" />
                </span>
              </div>
              <div className="mt-4 text-2xl font-black text-white">{data.communityComparison?.length || 0}</div>
              <p className="mt-1 text-xs text-slate-500">Aggregating tariff operations</p>
            </div>

            <div className="rounded-xl border border-slate-800 bg-[#0e1626]/80 p-5 backdrop-blur-md">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-slate-400">Average Collections Rate</span>
                <span className="rounded bg-indigo-500/10 p-1 text-indigo-400">
                  <Activity className="h-4 w-4" />
                </span>
              </div>
              <div className="mt-4 text-2xl font-black text-white">
                {(() => {
                  const total = (data.totalRevenue || 0) + (data.totalOutstanding || 0);
                  return total > 0 ? `${((data.totalRevenue || 0) / total * 100).toFixed(1)}%` : '0%';
                })()}
              </div>
              <p className="mt-1 text-xs text-slate-500">Collection cycle average efficiency</p>
            </div>
          </div>
        ) : (
          /* Community Admin Metric Cards */
          <div className="mb-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl border border-slate-800 bg-[#0e1626]/80 p-5 backdrop-blur-md">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-slate-400">Revenue Collected</span>
                <span className="rounded bg-emerald-500/10 p-1 text-emerald-400">
                  <TrendingUp className="h-4 w-4" />
                </span>
              </div>
              <div className="mt-4 text-2xl font-black text-white">{formatCurrency(data.revenueCollected)}</div>
              <p className="mt-1 text-xs text-slate-500">Payments settled for this community</p>
            </div>

            <div className="rounded-xl border border-slate-800 bg-[#0e1626]/80 p-5 backdrop-blur-md">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-slate-400">Outstanding Receivables</span>
                <span className="rounded bg-red-500/10 p-1 text-red-400">
                  <ShieldAlert className="h-4 w-4" />
                </span>
              </div>
              <div className="mt-4 text-2xl font-black text-white">{formatCurrency(data.outstandingAmount)}</div>
              <p className="mt-1 text-xs text-slate-500">Unsettled invoices needing reminder</p>
            </div>

            <div className="rounded-xl border border-slate-800 bg-[#0e1626]/80 p-5 backdrop-blur-md">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-slate-400">Collection Efficiency</span>
                <span className="rounded bg-indigo-500/10 p-1 text-indigo-400">
                  <CheckCircle2 className="h-4 w-4" />
                </span>
              </div>
              <div className="mt-4 text-2xl font-black text-white">{data.collectionRate}%</div>
              <p className="mt-1 text-xs text-slate-500">Invoices paid vs total generated</p>
            </div>

            <div className="rounded-xl border border-slate-800 bg-[#0e1626]/80 p-5 backdrop-blur-md">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-slate-400">Total Bill Runs Count</span>
                <span className="rounded bg-blue-500/10 p-1 text-blue-400">
                  <Calendar className="h-4 w-4" />
                </span>
              </div>
              <div className="mt-4 text-2xl font-black text-white">{data.billsGenerated}</div>
              <p className="mt-1 text-xs text-slate-500">{data.billsPaid} paid | {data.billsPending} pending</p>
            </div>
          </div>
        )}

        {/* Charts & Graphs Grid */}
        <div className="grid gap-6 lg:grid-cols-3 mb-8">
          {/* Revenue Monthly Trend Area Chart */}
          <div className="lg:col-span-2 rounded-xl border border-slate-800 bg-[#0e1626]/80 p-6 backdrop-blur-md">
            <h2 className="text-lg font-bold flex items-center gap-2 mb-4">
              <TrendingUp className="h-5 w-5 text-blue-500" />
              Collections vs Outstanding Monthly Trend
            </h2>
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={isSuperAdmin ? data.billingTrends : data.monthlyRevenueData}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="collectedColor" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="outstandingColor" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#162035" vertical={false} />
                  <XAxis dataKey="month" stroke="#64748b" fontSize={11} tickLine={false} />
                  <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
                  <Tooltip contentStyle={{ backgroundColor: '#0e1626', borderColor: '#1e293b' }} />
                  <Legend verticalAlign="top" height={36} iconType="circle" />
                  <Area 
                    type="monotone" 
                    name="Revenue Collected" 
                    dataKey="revenueCollected" 
                    stroke="#10b981" 
                    strokeWidth={2}
                    fillOpacity={1} 
                    fill="url(#collectedColor)" 
                  />
                  <Area 
                    type="monotone" 
                    name="Outstanding Invoices" 
                    dataKey="outstanding" 
                    stroke="#ef4444" 
                    strokeWidth={2}
                    fillOpacity={1} 
                    fill="url(#outstandingColor)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Collection efficiency / outstanding aging or community comparisons */}
          <div className="rounded-xl border border-slate-800 bg-[#0e1626]/80 p-6 backdrop-blur-md">
            {isSuperAdmin ? (
              /* Super Admin: Community Comparison Bar Chart */
              <>
                <h2 className="text-lg font-bold flex items-center gap-2 mb-4">
                  <Building className="h-5 w-5 text-indigo-400" />
                  Community Revenue Share
                </h2>
                <div className="h-80 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={data.communityComparison}
                      margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#162035" vertical={false} />
                      <XAxis dataKey="communityName" stroke="#64748b" fontSize={10} tickLine={false} />
                      <YAxis stroke="#64748b" fontSize={10} tickLine={false} />
                      <Tooltip contentStyle={{ backgroundColor: '#0e1626', borderColor: '#1e293b' }} />
                      <Legend verticalAlign="top" height={36} iconType="square" />
                      <Bar name="Collected" dataKey="revenueCollected" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                      <Bar name="Outstanding" dataKey="outstanding" fill="#ef4444" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </>
            ) : (
              /* Community Admin: Outstanding Aging summary */
              <>
                <h2 className="text-lg font-bold flex items-center gap-2 mb-6">
                  <AlertTriangle className="h-5 w-5 text-amber-400" />
                  Outstanding Balance Aging
                </h2>
                <div className="space-y-6 mt-4">
                  <div>
                    <div className="flex justify-between text-sm mb-1.5">
                      <span className="text-slate-400">Current (0-30 Days)</span>
                      <span className="font-semibold text-slate-200">{formatCurrency(data.aging30)}</span>
                    </div>
                    <div className="w-full bg-[#162035] h-2.5 rounded-full overflow-hidden">
                      <div className="bg-blue-500 h-full rounded-full" style={{ width: data.outstandingAmount > 0 ? `${(data.aging30 / data.outstandingAmount) * 100}%` : '0%' }}></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-sm mb-1.5">
                      <span className="text-slate-400">Overdue (31-60 Days)</span>
                      <span className="font-semibold text-slate-200">{formatCurrency(data.aging60)}</span>
                    </div>
                    <div className="w-full bg-[#162035] h-2.5 rounded-full overflow-hidden">
                      <div className="bg-amber-500 h-full rounded-full" style={{ width: data.outstandingAmount > 0 ? `${(data.aging60 / data.outstandingAmount) * 100}%` : '0%' }}></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-sm mb-1.5">
                      <span className="text-slate-400">Delinquent (60+ Days)</span>
                      <span className="font-semibold text-slate-200">{formatCurrency(data.aging90)}</span>
                    </div>
                    <div className="w-full bg-[#162035] h-2.5 rounded-full overflow-hidden">
                      <div className="bg-red-500 h-full rounded-full" style={{ width: data.outstandingAmount > 0 ? `${(data.aging90 / data.outstandingAmount) * 100}%` : '0%' }}></div>
                    </div>
                  </div>
                </div>

                <div className="mt-8 rounded-lg bg-red-500/5 p-4 border border-red-500/10 text-xs text-slate-400 flex items-start gap-2">
                  <ShieldAlert className="h-4 w-4 text-red-400 shrink-0" />
                  <span>Dunning processes and late fee accruals auto-trigger when payments cross the due-date days setting.</span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Defaulters & Forecating list */}
        {!isSuperAdmin && data.topDefaulters && data.topDefaulters.length > 0 && (
          <div className="rounded-xl border border-slate-800 bg-[#0e1626]/80 p-6 backdrop-blur-md">
            <h2 className="text-lg font-bold flex items-center gap-2 mb-4 text-amber-500">
              <Users className="h-5 w-5" /> Top 5 Outstanding Account Defaulters
            </h2>
            <div className="space-y-3">
              {data.topDefaulters.map((def: any, idx: number) => (
                <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-[#162035]/40 hover:bg-[#162035]/70 transition">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-slate-500 bg-slate-800 px-2 py-0.5 rounded">#{idx + 1}</span>
                    <span className="font-semibold text-slate-200">{def.residentName}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-sm font-extrabold text-red-400">{formatCurrency(def.outstandingAmount)}</span>
                    <button 
                      onClick={() => navigate('/admin/billing')}
                      className="text-xs text-blue-400 hover:text-blue-300 font-semibold flex items-center gap-0.5 transition"
                    >
                      Remind <ArrowUpRight className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {isSuperAdmin && (
          <div className="rounded-xl border border-slate-800 bg-[#0e1626]/80 p-6 backdrop-blur-md">
            <h2 className="text-lg font-bold flex items-center gap-2 mb-4 text-indigo-400">
              <TrendingUp className="h-5 w-5" /> Super Admin Revenue Forecasting (6 Months Ahead)
            </h2>
            <div className="space-y-3">
              {(data.billingTrends || []).map((trend: any, idx: number) => (
                <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-[#162035]/40">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold text-slate-300">{trend.month}</span>
                  </div>
                  <div className="flex items-center gap-8">
                    <div className="text-xs text-slate-400">
                      Actual Collected: <span className="font-semibold text-slate-200">{formatCurrency(trend.revenueCollected)}</span>
                    </div>
                    <div className="text-xs text-slate-400">
                      Forecast Projection (+5%): <span className="font-bold text-indigo-400">{formatCurrency(trend.forecast)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
  );
}
