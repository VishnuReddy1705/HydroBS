import { useState, useEffect } from "react";
import DashboardLayout from "../components/DashboardLayout";
import { 
  Droplet, TrendingDown, Receipt, Info, Shield, Search, Loader2, 
  CheckCircle2, AlertTriangle, Building2, ExternalLink, FileText, HelpCircle, BarChart3
} from "lucide-react";
import { api } from "@/lib/axios";
import { 
  ResponsiveContainer, LineChart, Line, BarChart, Bar, 
  XAxis, YAxis, Tooltip, CartesianGrid, Legend 
} from "recharts";

export default function ResidentDashboard() {
  const [me, setMe] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const [communities, setCommunities] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [myRequests, setMyRequests] = useState<any[]>([]);
  const [submittingRequest, setSubmittingRequest] = useState<number | null>(null);

  const fetchProfileAndStats = async () => {
    setLoading(true);
    try {
      const meRes = await api.get("/api/users/me");
      setMe(meRes.data);

      if (meRes.data.communityId) {
        const statsRes = await api.get("/api/dashboard/resident");
        setStats(statsRes.data);
      } else {
        const commRes = await api.get("/api/communities/public");
        setCommunities(commRes.data);
        const reqRes = await api.get("/api/communities/my-requests");
        setMyRequests(reqRes.data);
      }
    } catch (err) {
      console.error("Error loading resident dashboard:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfileAndStats();
  }, []);

  const handleJoinRequest = async (communityId: number) => {
    setSubmittingRequest(communityId);
    try {
      await api.post(`/api/communities/${communityId}/join-request`);
      const reqRes = await api.get("/api/communities/my-requests");
      setMyRequests(reqRes.data);
    } catch (err: any) {
      alert(err.response?.data || "Failed to send join request.");
    } finally {
      setSubmittingRequest(null);
    }
  };

  const filteredCommunities = communities.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-sky-900 flex flex-col items-center justify-center text-white">
        <Loader2 className="h-10 w-10 text-white animate-spin mb-4" />
        <p className="text-white/80 text-sm font-semibold">Loading your dashboard...</p>
      </div>
    );
  }

  // Render State A: No community approved yet
  if (!me?.communityId) {
    const pendingRequest = myRequests.find(r => r.status === "PENDING");
    const rejectedRequests = myRequests.filter(r => r.status === "REJECTED");

    return (
      <DashboardLayout
        role="RESIDENT"
        title="Welcome to HydroBS"
        subtitle="Get started by joining your community"
      >
        <div className="max-w-3xl mx-auto space-y-8">
          
          {pendingRequest && (
            <div className="p-6 rounded-3xl bg-amber-500/20 border border-amber-500/30 text-white flex items-start gap-4 shadow-2xl animate-pulse">
              <AlertTriangle className="h-6 w-6 text-amber-300 shrink-0 mt-0.5" />
              <div>
                <h3 className="font-extrabold text-amber-300 uppercase tracking-wide text-sm">Join Request Pending Approval</h3>
                <p className="text-sm text-white/90 mt-2 leading-relaxed">
                  You have requested to join <strong className="text-white">{pendingRequest.communityName}</strong>. 
                  The community administrator must approve your profile (Flat {me.flatNumber || 'N/A'}) before you can view consumption stats.
                </p>
                <div className="mt-4 flex items-center gap-2 text-xs text-amber-300/80 bg-white/10 border border-white/10 px-3 py-1.5 rounded-xl w-fit">
                  <Loader2 className="h-3 w-3 animate-spin" /> Pending review...
                </div>
              </div>
            </div>
          )}

          {!pendingRequest && (
            <div className="p-8 rounded-3xl bg-white/10 backdrop-blur-md border border-white/20 space-y-6 shadow-2xl">
              <div className="space-y-2">
                <h3 className="text-xl font-extrabold text-white flex items-center gap-2 uppercase tracking-wide text-sm">
                  <Building2 className="h-5 w-5 text-cyan-300" />
                  Find and Join Your Community
                </h3>
                <p className="text-sm text-white/80">
                  Search for your community below to request access. Make sure your flat number is correctly set under your profile.
                </p>
              </div>

              <div className="relative">
                <Search className="absolute left-3.5 top-3.5 h-4.5 w-4.5 text-white/50" />
                <input
                  type="text"
                  placeholder="Search by community name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-white/10 border border-white/20 rounded-2xl pl-10 pr-4 py-3 text-sm text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-cyan-300 transition-all"
                />
              </div>

              <div className="divide-y divide-white/10 border border-white/20 rounded-2xl overflow-hidden bg-white/5 shadow-inner">
                {filteredCommunities.length > 0 ? (
                  filteredCommunities.map((comm) => {
                    const isRejected = rejectedRequests.some(r => r.communityId === comm.id);
                    return (
                      <div key={comm.id} className="p-5 flex items-center justify-between hover:bg-white/5 transition-colors">
                        <div>
                          <p className="font-extrabold text-white">{comm.name}</p>
                          {isRejected && <p className="text-xs text-rose-300 mt-1 font-semibold">Previous request was rejected.</p>}
                        </div>
                        <button
                          onClick={() => handleJoinRequest(comm.id)}
                          disabled={submittingRequest !== null}
                          className="bg-white hover:bg-white/90 text-blue-600 text-xs font-bold px-4 py-2.5 rounded-xl transition-all shadow-md active:scale-[0.98] cursor-pointer"
                        >
                          {submittingRequest === comm.id ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : "Request to Join"}
                        </button>
                      </div>
                    );
                  })
                ) : (
                  <div className="p-8 text-center text-white/50 text-sm">
                    No communities found. Ask your community admin to create one.
                  </div>
                )}
              </div>
            </div>
          )}
          
        </div>
      </DashboardLayout>
    );
  }

  // Render State B: Approved community stats
  const today = stats?.todayUsage || 0;
  const thisMonth = stats?.thisMonthUsage || 0;
  const currentBillAmount = stats?.currentBillAmount || 0;
  const currentBillStatus = stats?.currentBillStatus || "NO_BILL";
  const currentBillDueDate = stats?.currentBillDueDate || "";
  const avgDaily = stats?.avgDailyUsage || 0;
  const leakStatus = stats?.leakStatus || "Safe";
  const leakMessage = stats?.leakMessage || "No leak detected";
  
  const chartData = stats?.monthlyChart || [];
  const weeklyData = stats?.weeklyChart || [];
  const comparisonChart = stats?.comparisonChart || [];
  const billsList = stats?.recentBillsList || [];

  return (
    <DashboardLayout
      role="RESIDENT"
      title="Resident Dashboard"
      subtitle={`${me?.communityName} • Flat ${me?.flatNumber || "N/A"}`}
    >
      {/* 5 Cards Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="p-5 rounded-3xl border border-white/20 bg-white/10 backdrop-blur-md flex justify-between items-start text-white shadow-xl">
          <div>
            <p className="text-white/70 text-xs font-bold uppercase tracking-wider">Today's Usage</p>
            <p className="text-2xl font-extrabold text-white mt-2">{today} L</p>
            <p className="text-emerald-300 text-[10px] mt-1.5 font-semibold">
              Latest reading logged
            </p>
          </div>
          <div className="p-2.5 bg-white/10 rounded-xl border border-white/10">
            <Droplet className="h-5 w-5 text-cyan-300" />
          </div>
        </div>

        <div className="p-5 rounded-3xl border border-white/20 bg-white/10 backdrop-blur-md flex justify-between items-start text-white shadow-xl">
          <div>
            <p className="text-white/70 text-xs font-bold uppercase tracking-wider">This Month</p>
            <p className="text-2xl font-extrabold text-white mt-2">{thisMonth} L</p>
            <p className="text-white/50 text-[10px] mt-1.5">Cycle: Current Month</p>
          </div>
          <div className="p-2.5 bg-white/10 rounded-xl border border-white/10">
            <TrendingDown className="h-5 w-5 text-emerald-300" />
          </div>
        </div>

        <div className="p-5 rounded-3xl border border-white/20 bg-white/10 backdrop-blur-md flex justify-between items-start text-white shadow-xl">
          <div>
            <p className="text-white/70 text-xs font-bold uppercase tracking-wider">Current Bill</p>
            <p className="text-2xl font-extrabold text-white mt-2">₹{currentBillAmount}</p>
            <p className={`text-[10px] mt-1.5 font-bold ${
              currentBillStatus === "UNPAID" ? "text-amber-300" : currentBillStatus === "PAID" ? "text-emerald-300" : "text-white/50"
            }`}>
              {currentBillStatus === "UNPAID" ? `Due on ${currentBillDueDate}` : currentBillStatus === "PAID" ? "Paid" : "No active bill"}
            </p>
          </div>
          <div className="p-2.5 bg-white/10 rounded-xl border border-white/10">
            <Receipt className="h-5 w-5 text-purple-300" />
          </div>
        </div>

        <div className="p-5 rounded-3xl border border-white/20 bg-white/10 backdrop-blur-md flex justify-between items-start text-white shadow-xl">
          <div>
            <p className="text-white/70 text-xs font-bold uppercase tracking-wider">Avg Daily Usage</p>
            <p className="text-2xl font-extrabold text-white mt-2">{avgDaily} L</p>
            <p className="text-white/50 text-[10px] mt-1.5">This month average</p>
          </div>
          <div className="p-2.5 bg-white/10 rounded-xl border border-white/10">
            <TrendingDown className="h-5 w-5 text-cyan-300" />
          </div>
        </div>

        <div className="p-5 rounded-3xl border border-white/20 bg-white/10 backdrop-blur-md flex justify-between items-start text-white shadow-xl">
          <div>
            <p className="text-white/70 text-xs font-bold uppercase tracking-wider">Leak Status</p>
            <p className={`text-2xl font-extrabold mt-2 ${leakStatus === "Safe" ? "text-emerald-300" : "text-rose-300 animate-pulse"}`}>{leakStatus}</p>
            <p className="text-white/60 text-[10px] mt-1.5 truncate max-w-[120px] font-semibold" title={leakMessage}>{leakMessage}</p>
          </div>
          <div className={`p-2.5 rounded-xl border ${
            leakStatus === "Safe" ? "bg-white/10 border-white/15" : "bg-rose-500/20 border-rose-500/30"
          }`}>
            <Shield className={`h-5 w-5 ${leakStatus === "Safe" ? "text-emerald-300" : "text-rose-300"}`} />
          </div>
        </div>
      </div>

      {/* Main Consumption Graphs Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly Chart */}
        <div className="lg:col-span-2 border border-white/20 rounded-3xl bg-white/10 backdrop-blur-md p-6 space-y-4 shadow-xl">
          <h3 className="text-sm font-extrabold uppercase tracking-wide text-white">Monthly Consumption</h3>
          <div className="h-[220px] w-full">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="name" stroke="rgba(255,255,255,0.6)" fontSize={11} />
                  <YAxis stroke="rgba(255,255,255,0.6)" fontSize={11} />
                  <Tooltip contentStyle={{ backgroundColor: "rgba(10, 22, 40, 0.9)", borderColor: "rgba(255,255,255,0.15)", borderRadius: "12px", color: "#fff" }} />
                  <Line type="monotone" dataKey="usage" stroke="#06b6d4" strokeWidth={2.5} dot={{ fill: "#06b6d4", r: 4 }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-white/50 text-sm">
                No consumption readings logged for this month.
              </div>
            )}
          </div>
        </div>

        {/* Weekly Chart */}
        <div className="border border-white/20 rounded-3xl bg-white/10 backdrop-blur-md p-6 space-y-4 shadow-xl">
          <h3 className="text-sm font-extrabold uppercase tracking-wide text-white">Weekly Usage</h3>
          <div className="h-[220px] w-full">
            {weeklyData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weeklyData} margin={{ top: 5, right: 0, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="name" stroke="rgba(255,255,255,0.6)" fontSize={10} />
                  <YAxis stroke="rgba(255,255,255,0.6)" fontSize={10} />
                  <Tooltip contentStyle={{ backgroundColor: "rgba(10, 22, 40, 0.9)", borderColor: "rgba(255,255,255,0.15)", borderRadius: "12px", color: "#fff" }} />
                  <Bar dataKey="usage" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-white/50 text-sm">
                No readings logged for this week.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Advanced Visualization Comparison & Advisor Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Personal vs Community Average Usage */}
        <div className="lg:col-span-2 border border-white/20 rounded-3xl bg-white/10 backdrop-blur-md p-6 space-y-4 shadow-xl">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-cyan-300" />
            <h3 className="text-sm font-extrabold uppercase tracking-wide text-white">My Usage vs. Community Average (6-Month Trend)</h3>
          </div>
          <div className="h-[200px] w-full">
            {comparisonChart.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={comparisonChart} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="name" stroke="rgba(255,255,255,0.6)" fontSize={10} />
                  <YAxis stroke="rgba(255,255,255,0.6)" fontSize={10} />
                  <Tooltip contentStyle={{ backgroundColor: "rgba(10, 22, 40, 0.9)", borderColor: "rgba(255,255,255,0.15)", borderRadius: "12px", color: "#fff" }} />
                  <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: "11px", color: "white" }} />
                  <Line name="My Usage" type="monotone" dataKey="myUsage" stroke="#06b6d4" strokeWidth={2.5} dot={{ r: 3 }} />
                  <Line name="Community Average" type="monotone" dataKey="averageUsage" stroke="#f59e0b" strokeWidth={2} strokeDasharray="5 5" dot={{ r: 2 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-white/50 text-sm">
                No comparative logs available.
              </div>
            )}
          </div>
        </div>

        {/* AI Water Advisor */}
        <div className="border border-white/20 rounded-3xl bg-white/10 backdrop-blur-md p-6 flex flex-col justify-between shadow-xl">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-extrabold uppercase tracking-wide text-white flex items-center gap-1.5">
                <Info className="h-5 w-5 text-cyan-300" />
                AI Water Advisor
              </h3>
              <span className="bg-white/20 text-white border border-white/10 text-[9px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider">Beta</span>
            </div>

            {/* Advisor Advice content */}
            <div className="flex gap-4 items-start text-white/95">
              <div className="h-10 w-10 shrink-0 rounded-xl bg-white/15 border border-white/20 flex items-center justify-center">
                <svg className="w-5 h-5 text-cyan-300" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                </svg>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-white/90 leading-relaxed font-semibold">
                  {stats?.advisorText}
                </p>
                {stats?.advisorPercentage > 0 && (
                  <p className="text-xs text-white/60">
                    Potential savings: <span className="text-emerald-300 font-extrabold">{stats?.advisorSavings}</span>
                  </p>
                )}
              </div>
            </div>
          </div>

          <button className="w-full text-center text-xs text-cyan-300 font-bold mt-4 hover:underline flex justify-center items-center gap-1 cursor-pointer">
            View More Tips <ExternalLink className="h-3 w-3" />
          </button>
        </div>
      </div>

      {/* Bottom Table Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Bills Table */}
        <div className="lg:col-span-2 border border-white/20 rounded-3xl bg-white/10 backdrop-blur-md overflow-hidden shadow-xl">
          <div className="px-6 py-4 border-b border-white/10 flex justify-between items-center">
            <h3 className="text-sm font-extrabold uppercase tracking-wide text-white">Recent Bills</h3>
            <button className="text-xs text-cyan-300 font-bold hover:underline cursor-pointer">View All</button>
          </div>
          <div className="overflow-x-auto max-h-[180px]">
            <table className="w-full text-left text-xs">
              <thead className="bg-white/10 text-white/80 font-bold uppercase tracking-wider border-b border-white/10">
                <tr>
                  <th className="px-6 py-3.5">Bill #</th>
                  <th className="px-6 py-3.5">Month</th>
                  <th className="px-6 py-3.5">Usage</th>
                  <th className="px-6 py-3.5">Amount</th>
                  <th className="px-6 py-3.5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10 text-white/90">
                {billsList.length > 0 ? (
                  billsList.map((bill: any) => (
                    <tr key={bill.billNo} className="hover:bg-white/5 transition-colors">
                      <td className="px-6 py-4 font-bold">{bill.billNo}</td>
                      <td className="px-6 py-4">{bill.month}</td>
                      <td className="px-6 py-4">{bill.usage}</td>
                      <td className="px-6 py-4 font-bold">₹{bill.amount}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                          bill.status === "PAID" 
                            ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30" 
                            : "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                        }`}>
                          {bill.status}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-white/50">
                      No invoices found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Info list / Quick Links */}
        <div className="border border-white/20 rounded-3xl bg-white/10 backdrop-blur-md p-6 space-y-6 flex flex-col justify-between shadow-xl">
          <div className="space-y-4">
            <h3 className="text-sm font-extrabold uppercase tracking-wide text-white flex items-center gap-1.5">
              <CheckCircle2 className="h-5 w-5 text-emerald-300" />
              Notifications
            </h3>
            <ul className="space-y-3 text-xs text-white/90 font-medium">
              <li className="flex gap-2">
                <span className="h-2 w-2 shrink-0 bg-cyan-300 rounded-full mt-1.5 shadow-md shadow-cyan-300/40"></span>
                <div>
                  <p className="text-white font-bold">Bill generated</p>
                  <p className="text-[10px] text-white/70 mt-0.5">Your bill is ready for payment.</p>
                </div>
              </li>
              <li className="flex gap-2">
                <span className="h-2 w-2 shrink-0 bg-amber-300 rounded-full mt-1.5 shadow-md shadow-amber-300/40"></span>
                <div>
                  <p className="text-white font-bold">Water supply maintenance</p>
                  <p className="text-[10px] text-white/70 mt-0.5">Water supply will be closed on 18 Jul from 10 PM to 4 AM.</p>
                </div>
              </li>
              <li className="flex gap-2">
                <span className="h-2 w-2 shrink-0 bg-emerald-300 rounded-full mt-1.5 shadow-md shadow-emerald-300/40"></span>
                <div>
                  <p className="text-white font-bold">Leak check completed</p>
                  <p className="text-[10px] text-white/70 mt-0.5">No leaks detected in your building block.</p>
                </div>
              </li>
            </ul>
          </div>

          <div className="space-y-2 mt-4">
            <h4 className="text-[10px] font-extrabold text-white/60 uppercase tracking-wider">Quick Links</h4>
            <div className="grid grid-cols-2 gap-2 text-white">
              <button className="flex items-center gap-2 bg-white/10 border border-white/10 hover:bg-white/20 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer">
                <FileText className="h-4 w-4 text-white/70" />
                Invoices
              </button>
              <button className="flex items-center gap-2 bg-white/10 border border-white/10 hover:bg-white/20 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer">
                <TrendingDown className="h-4 w-4 text-white/70" />
                History
              </button>
              <button className="flex items-center gap-2 bg-white/10 border border-white/10 hover:bg-white/20 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer">
                <Info className="h-4 w-4 text-white/70" />
                Tips
              </button>
              <button className="flex items-center gap-2 bg-white/10 border border-white/10 hover:bg-white/20 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer">
                <HelpCircle className="h-4 w-4 text-white/70" />
                Support
              </button>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}