import { useState, useEffect } from "react";
import DashboardLayout from "../components/DashboardLayout";
import { api } from "@/lib/axios";
import { Loader2, Building2, Users, Droplets, AlertOctagon, TrendingUp, BarChart3, PieChart as PieIcon } from "lucide-react";
import { 
  ResponsiveContainer, BarChart, Bar, 
  XAxis, YAxis, Tooltip, CartesianGrid, AreaChart, Area, 
  PieChart, Pie, Cell 
} from "recharts";

const COLORS = ["#06b6d4", "#3b82f6", "#10b981", "#f59e0b", "#ec4899", "#8b5cf6"];

export default function SuperAdminDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.get("/api/dashboard/super-admin");
        setStats(res.data);
      } catch (err) {
        console.error("Error fetching super admin stats:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-sky-900 flex flex-col items-center justify-center text-white">
        <Loader2 className="h-10 w-10 text-white animate-spin mb-4" />
        <p className="text-white/80 text-sm font-semibold">Loading system overview...</p>
      </div>
    );
  }

  const cards = [
    { label: "Total Communities", value: stats?.totalCommunities || 0, icon: Building2, color: "text-cyan-300", bg: "bg-white/10" },
    { label: "Total Users", value: stats?.totalUsers || 0, icon: Users, color: "text-blue-300", bg: "bg-white/10" },
    { label: "System-wide Water Usage", value: stats?.systemWideWaterUsage || "0 L", icon: Droplets, color: "text-emerald-300", bg: "bg-white/10" },
    { label: "Active Alerts", value: stats?.activeAlerts || 0, icon: AlertOctagon, color: stats?.activeAlerts > 0 ? "text-rose-300 animate-pulse" : "text-white/50", bg: stats?.activeAlerts > 0 ? "bg-rose-500/20" : "bg-white/10" },
  ];

  const communities = stats?.recentCommunities || [];
  const errors = stats?.recentErrors || [];
  const systemMonthlyTrend = stats?.systemMonthlyTrend || [];
  const userGrowthData = stats?.userGrowthData || [];
  const usageByCommunity = stats?.usageByCommunity || [];

  return (
    <DashboardLayout 
      role="SUPER_ADMIN" 
      title="System Overview" 
      subtitle="View metrics across all HydroBS communities"
    >
      {/* Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {cards.map((card) => (
          <div key={card.label} className="p-6 rounded-3xl border border-white/20 bg-white/10 backdrop-blur-md shadow-2xl flex justify-between items-start text-white">
            <div>
              <p className="text-white/70 text-xs font-bold uppercase tracking-wider">{card.label}</p>
              <p className="text-3xl font-extrabold text-white mt-2">{card.value}</p>
            </div>
            <div className={`p-3 rounded-2xl border border-white/10 ${card.bg}`}>
              <card.icon className={`h-6 w-6 ${card.color}`} />
            </div>
          </div>
        ))}
      </div>

      {/* Visualizations Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
        {/* System Water Trend */}
        <div className="lg:col-span-2 border border-white/20 rounded-3xl bg-white/10 backdrop-blur-md p-6 space-y-4 shadow-2xl">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-cyan-300" />
            <h3 className="text-sm font-extrabold tracking-wide uppercase text-white">System Water Consumption Trend (Last 6 Months)</h3>
          </div>
          <div className="h-[220px] w-full">
            {systemMonthlyTrend.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={systemMonthlyTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorUsage" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="name" stroke="rgba(255,255,255,0.6)" fontSize={10} />
                  <YAxis stroke="rgba(255,255,255,0.6)" fontSize={10} />
                  <Tooltip contentStyle={{ backgroundColor: "rgba(10, 22, 40, 0.9)", borderColor: "rgba(255,255,255,0.15)", borderRadius: "12px", color: "#fff" }} />
                  <Area type="monotone" dataKey="usage" stroke="#06b6d4" strokeWidth={2.5} fillOpacity={1} fill="url(#colorUsage)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-white/50 text-xs">
                No monthly trend logs available.
              </div>
            )}
          </div>
        </div>

        {/* Community Usage Breakdown */}
        <div className="border border-white/20 rounded-3xl bg-white/10 backdrop-blur-md p-6 space-y-4 shadow-2xl">
          <div className="flex items-center gap-2">
            <PieIcon className="h-5 w-5 text-emerald-300" />
            <h3 className="text-sm font-extrabold tracking-wide uppercase text-white">Community Usage Breakdown</h3>
          </div>
          <div className="h-[220px] w-full flex items-center justify-center relative">
            {usageByCommunity.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={usageByCommunity}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="usage"
                  >
                    {usageByCommunity.map((_entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: "rgba(10, 22, 40, 0.9)", borderColor: "rgba(255,255,255,0.15)", borderRadius: "12px", color: "#fff" }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-white/50 text-xs">No community usage metrics.</div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        {/* User Growth Trend */}
        <div className="border border-white/20 rounded-3xl bg-white/10 backdrop-blur-md p-6 space-y-4 shadow-2xl">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-blue-300" />
            <h3 className="text-sm font-extrabold tracking-wide uppercase text-white">User Base Growth (Cumulative)</h3>
          </div>
          <div className="h-[180px] w-full">
            {userGrowthData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={userGrowthData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="name" stroke="rgba(255,255,255,0.6)" fontSize={10} />
                  <YAxis stroke="rgba(255,255,255,0.6)" fontSize={10} />
                  <Tooltip contentStyle={{ backgroundColor: "rgba(10, 22, 40, 0.9)", borderColor: "rgba(255,255,255,0.15)", borderRadius: "12px", color: "#fff" }} />
                  <Bar dataKey="users" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-white/50 text-xs">
                No user growth records.
              </div>
            )}
          </div>
        </div>

        {/* Registered Communities */}
        <div className="border border-white/20 rounded-3xl bg-white/10 backdrop-blur-md overflow-hidden shadow-2xl">
           <div className="px-6 py-4 border-b border-white/10">
              <h3 className="text-sm font-extrabold uppercase tracking-wide text-white">Registered Communities</h3>
           </div>
           <div className="overflow-x-auto max-h-[180px]">
              <table className="w-full text-left text-xs">
                <thead className="bg-white/10 text-white/80 font-bold uppercase border-b border-white/10">
                  <tr>
                    <th className="px-6 py-3">ID</th>
                    <th className="px-6 py-3">Community Name</th>
                    <th className="px-6 py-3">Total Residents</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10 text-white/90">
                  {communities.length > 0 ? (
                    communities.map((c: any) => (
                      <tr key={c.id} className="hover:bg-white/5 transition-colors">
                        <td className="px-6 py-3 font-bold">#{c.id}</td>
                        <td className="px-6 py-3 font-semibold">{c.name}</td>
                        <td className="px-6 py-3">{c.residentsCount} users</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={3} className="px-6 py-8 text-center text-white/50">No communities registered yet.</td>
                    </tr>
                  )}
                </tbody>
              </table>
           </div>
        </div>

        {/* Recent DB Import Errors */}
        <div className="border border-white/20 rounded-3xl bg-white/10 backdrop-blur-md overflow-hidden shadow-2xl">
           <div className="px-6 py-4 border-b border-white/10">
              <h3 className="text-sm font-extrabold uppercase tracking-wide text-white flex items-center gap-1.5">
                <AlertOctagon className="h-5 w-5 text-rose-300 animate-pulse" />
                Recent Import Failures
              </h3>
           </div>
           <div className="overflow-x-auto max-h-[180px]">
              <table className="w-full text-left text-xs">
                <thead className="bg-white/10 text-white/80 font-bold uppercase border-b border-white/10">
                  <tr>
                    <th className="px-6 py-3">Row</th>
                    <th className="px-6 py-3">Identifier</th>
                    <th className="px-6 py-3">Error Cause</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10 text-white/95">
                  {errors.length > 0 ? (
                    errors.map((e: any) => (
                      <tr key={e.id} className="hover:bg-white/5 transition-colors">
                        <td className="px-6 py-3">Row {e.csvRowNumber}</td>
                        <td className="px-6 py-3 font-bold text-rose-300">{e.residentIdentifier || "N/A"}</td>
                        <td className="px-6 py-3 text-white/80 max-w-[140px] truncate" title={e.errorMessage}>{e.errorMessage}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={3} className="px-6 py-8 text-center text-white/50">No import errors logged.</td>
                    </tr>
                  )}
                </tbody>
              </table>
           </div>
        </div>
      </div>
    </DashboardLayout>
  );
}