import { useState, useEffect } from "react";
import DashboardLayout from "../components/DashboardLayout";
import { 
  Users, Droplets, AlertTriangle, Check, X, Upload, Loader2, 
  Receipt, ShoppingCart, Clock, AlertCircle, BarChart3, PieChart as PieIcon
} from "lucide-react";
import { api } from "@/lib/axios";
import { 
  ResponsiveContainer, LineChart, Line, BarChart, Bar, 
  XAxis, YAxis, Tooltip, CartesianGrid, PieChart, Pie, Cell 
} from "recharts";

const COLORS = ["#10b981", "#f59e0b"]; // Paid vs Unpaid

export default function AdminDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [pendingRequests, setPendingRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // CSV Upload States
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<any>(null);
  
  // Bill Gen States
  const [generatingBills, setGeneratingBills] = useState(false);

  const fetchDashboardData = async () => {
    try {
      const statsRes = await api.get("/api/dashboard/admin");
      setStats(statsRes.data);

      const requestsRes = await api.get("/api/communities/join-requests/pending");
      setPendingRequests(requestsRes.data);
    } catch (err) {
      console.error("Error loading community admin stats:", err);
    }
  };

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await fetchDashboardData();
      setLoading(false);
    };
    init();
  }, []);

  const handleApprove = async (requestId: number) => {
    try {
      await api.post(`/api/communities/join-requests/${requestId}/approve`);
      await fetchDashboardData();
    } catch (err) {
      alert("Error approving request");
    }
  };

  const handleReject = async (requestId: number) => {
    try {
      await api.post(`/api/communities/join-requests/${requestId}/reject`);
      await fetchDashboardData();
    } catch (err) {
      alert("Error rejecting request");
    }
  };

  const handleCsvUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setUploadResult(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await api.post("/api/water/upload-readings", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      setUploadResult({
        success: true,
        data: res.data,
      });
      await fetchDashboardData();
    } catch (err: any) {
      setUploadResult({
        success: false,
        error: err.response?.data || "Failed to upload readings.",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleGenerateBills = async () => {
    setGeneratingBills(true);
    try {
      const res = await api.post("/api/water/generate-bills");
      alert(res.data);
      await fetchDashboardData();
    } catch (err: any) {
      alert(err.response?.data || "Failed to generate bills.");
    } finally {
      setGeneratingBills(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-sky-900 flex flex-col items-center justify-center text-white">
        <Loader2 className="h-10 w-10 text-white animate-spin mb-4" />
        <p className="text-white/80 text-sm font-semibold">Loading community stats...</p>
      </div>
    );
  }

  // Dashboard Stats Cards
  const cards = [
    { label: "Total Residents", value: stats?.totalUsers || 0, change: "+5 this month", icon: Users, color: "text-purple-300", bg: "bg-white/10" },
    { label: "Total Water Used", value: stats?.totalWaterUsed || "0 L", change: stats?.usageChange || "Stable", icon: Droplets, color: "text-cyan-300", bg: "bg-white/10" },
    { label: "Water Purchased", value: stats?.waterPurchased || "0 L", change: stats?.purchaseChange || "Stable", icon: ShoppingCart, color: "text-emerald-300", bg: "bg-white/10" },
    { label: "Pending Bills", value: stats?.pendingBills || 0, change: "Unpaid invoices", icon: Receipt, color: "text-amber-300", bg: "bg-white/10" },
    { label: "Leak Alerts", value: stats?.activeAlerts || 0, change: stats?.activeAlerts > 0 ? "Needs attention" : "No alerts", icon: AlertTriangle, color: stats?.activeAlerts > 0 ? "text-rose-300 animate-pulse" : "text-white/50", bg: stats?.activeAlerts > 0 ? "bg-rose-500/20" : "bg-white/10" },
  ];

  const chartData = stats?.chartData || [];
  const residentUsageDistribution = stats?.residentUsageDistribution || [];
  const billingDistribution = stats?.billingDistribution || [];
  const recentActivities = stats?.recentActivity || [];
  const pendingBillsTable = stats?.pendingBillsList || [];
  const leakAlertsList = stats?.leakAlertsList || [];

  return (
    <DashboardLayout
      role="ADMIN"
      title="Community Admin Dashboard"
      subtitle={stats?.communityName || "Green Valley Apartments"}
    >
      {/* Metrics Row (5 Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {cards.map((card) => (
          <div key={card.label} className="p-5 rounded-3xl border border-white/20 bg-white/10 backdrop-blur-md flex justify-between items-start text-white shadow-xl">
            <div>
              <p className="text-white/70 text-[10px] font-bold uppercase tracking-wider">{card.label}</p>
              <p className="text-2xl font-extrabold text-white mt-2">{card.value}</p>
              <p className="text-white/50 text-[9px] mt-1">{card.change}</p>
            </div>
            <div className={`p-2.5 rounded-xl border border-white/10 ${card.bg}`}>
              <card.icon className={`h-5 w-5 ${card.color}`} />
            </div>
          </div>
        ))}
      </div>

      {/* Primary Graphs & Activity Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly Water Chart */}
        <div className="border border-white/20 rounded-3xl bg-white/10 backdrop-blur-md p-6 space-y-4 shadow-xl">
          <h3 className="text-sm font-extrabold uppercase tracking-wide text-white">Monthly Water Usage</h3>
          <div className="h-[200px] w-full">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="name" stroke="rgba(255,255,255,0.6)" fontSize={10} />
                  <YAxis stroke="rgba(255,255,255,0.6)" fontSize={10} />
                  <Tooltip contentStyle={{ backgroundColor: "rgba(10, 22, 40, 0.9)", borderColor: "rgba(255,255,255,0.15)", borderRadius: "12px", color: "#fff" }} />
                  <Line type="monotone" dataKey="usage" stroke="#06b6d4" strokeWidth={2.5} dot={{ fill: "#06b6d4", r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-white/50 text-xs">
                No usage logs available.
              </div>
            )}
          </div>
        </div>

        {/* Water Purchase History Chart */}
        <div className="border border-white/20 rounded-3xl bg-white/10 backdrop-blur-md p-6 space-y-4 shadow-xl">
          <h3 className="text-sm font-extrabold uppercase tracking-wide text-white">Water Purchase History</h3>
          <div className="h-[200px] w-full">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="name" stroke="rgba(255,255,255,0.6)" fontSize={10} />
                  <YAxis stroke="rgba(255,255,255,0.6)" fontSize={10} />
                  <Tooltip contentStyle={{ backgroundColor: "rgba(10, 22, 40, 0.9)", borderColor: "rgba(255,255,255,0.15)", borderRadius: "12px", color: "#fff" }} />
                  <Bar dataKey="purchased" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-white/50 text-xs">
                No purchase logs available.
              </div>
            )}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="border border-white/20 rounded-3xl bg-white/10 backdrop-blur-md p-6 space-y-4 shadow-xl">
          <h3 className="text-sm font-extrabold uppercase tracking-wide text-white flex items-center gap-1.5">
            <Clock className="h-4.5 w-4.5 text-cyan-300" />
            Recent Activity
          </h3>
          <div className="space-y-4 overflow-y-auto max-h-[200px] pr-2 text-white/90">
            {recentActivities.length > 0 ? (
              recentActivities.map((act: any) => (
                <div key={act.id} className="flex gap-3 items-start text-xs border-l-2 border-white/20 pl-3">
                  <div className="space-y-0.5">
                    <p className="text-white font-bold">{act.title}</p>
                    <p className="text-white/70 text-[11px]">{act.desc}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center text-white/50 py-8">No recent activity.</div>
            )}
          </div>
        </div>
      </div>

      {/* Secondary Graphs Row (Residents Water Distribution & Bills Status) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        {/* Residents Water Distribution */}
        <div className="lg:col-span-2 border border-white/20 rounded-3xl bg-white/10 backdrop-blur-md p-6 space-y-4 shadow-xl">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-purple-300" />
            <h3 className="text-sm font-extrabold uppercase tracking-wide text-white">Water Consumption by Flat (This Month)</h3>
          </div>
          <div className="h-[220px] w-full">
            {residentUsageDistribution.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={residentUsageDistribution} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="flat" stroke="rgba(255,255,255,0.6)" fontSize={10} />
                  <YAxis stroke="rgba(255,255,255,0.6)" fontSize={10} />
                  <Tooltip contentStyle={{ backgroundColor: "rgba(10, 22, 40, 0.9)", borderColor: "rgba(255,255,255,0.15)", borderRadius: "12px", color: "#fff" }} />
                  <Bar dataKey="usage" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-white/50 text-xs">
                No resident usage logged yet.
              </div>
            )}
          </div>
        </div>

        {/* Invoice Payment Status */}
        <div className="border border-white/20 rounded-3xl bg-white/10 backdrop-blur-md p-6 space-y-4 shadow-xl flex flex-col justify-between">
          <div className="flex items-center gap-2">
            <PieIcon className="h-5 w-5 text-amber-300" />
            <h3 className="text-sm font-extrabold uppercase tracking-wide text-white">Bill Payment Status</h3>
          </div>
          <div className="h-[180px] w-full flex items-center justify-center relative">
            {billingDistribution.length > 0 && (billingDistribution[0].value > 0 || billingDistribution[1].value > 0) ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={billingDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={70}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {billingDistribution.map((_entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: "rgba(10, 22, 40, 0.9)", borderColor: "rgba(255,255,255,0.15)", borderRadius: "12px", color: "#fff" }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-white/50 text-xs">No bill records available.</div>
            )}
          </div>
          <div className="flex justify-center gap-6 text-xs text-white/80 pb-2">
            <div className="flex items-center gap-1.5">
              <div className="h-3 w-3 rounded bg-[#10b981]"></div>
              <span>Paid</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="h-3 w-3 rounded bg-[#f59e0b]"></div>
              <span>Unpaid</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        {/* Unpaid Bills */}
        <div className="lg:col-span-2 border border-white/20 rounded-3xl bg-white/10 backdrop-blur-md overflow-hidden flex flex-col justify-between shadow-xl">
          <div>
            <div className="px-6 py-4 border-b border-white/10 flex justify-between items-center">
              <h3 className="text-sm font-extrabold uppercase tracking-wide text-white">Pending Bills</h3>
              <span className="text-white/70 text-xs font-semibold">{pendingBillsTable.length} Bills</span>
            </div>
            <div className="overflow-x-auto max-h-[220px]">
              <table className="w-full text-left text-xs">
                <thead className="bg-white/10 text-white/80 font-bold uppercase tracking-wider border-b border-white/10">
                  <tr>
                    <th className="px-6 py-3">Bill #</th>
                    <th className="px-6 py-3">Flat</th>
                    <th className="px-6 py-3">Resident</th>
                    <th className="px-6 py-3">Amount</th>
                    <th className="px-6 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10 text-white/90">
                  {pendingBillsTable.length > 0 ? (
                    pendingBillsTable.map((bill: any) => (
                      <tr key={bill.billNo} className="hover:bg-white/5 transition-colors">
                        <td className="px-6 py-3 font-bold">{bill.billNo}</td>
                        <td className="px-6 py-3 font-semibold">{bill.flat}</td>
                        <td className="px-6 py-3">{bill.residentName}</td>
                        <td className="px-6 py-3">₹{bill.amount}</td>
                        <td className="px-6 py-3">
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30">
                            {bill.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="px-6 py-8 text-center text-white/50">
                        No pending bills found. Click 'Generate Month Bills' to compute.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Quick Actions Panel */}
        <div className="border border-white/20 rounded-3xl bg-white/10 backdrop-blur-md p-6 space-y-6 flex flex-col justify-between shadow-xl">
          <div className="space-y-4">
            <h3 className="text-sm font-extrabold uppercase tracking-wide text-white">Quick Actions</h3>
            <div className="grid grid-cols-1 gap-4">
              {/* CSV Upload */}
              <div className="space-y-2">
                <label className="text-xs text-white/70 font-semibold block">Upload Meter Readings (CSV)</label>
                <div className="relative border border-dashed border-white/20 hover:border-white/40 transition-all rounded-2xl p-4 flex flex-col items-center justify-center bg-white/5 hover:bg-white/10 cursor-pointer">
                  <Upload className="h-6 w-6 text-white/60 mb-2" />
                  <p className="text-[10px] text-white/75 text-center font-medium">Drag or click to choose CSV file</p>
                  <input
                    type="file"
                    accept=".csv"
                    onChange={handleCsvUpload}
                    disabled={uploading}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                  {uploading && (
                    <div className="absolute inset-0 bg-slate-900/90 rounded-2xl flex items-center justify-center gap-2">
                      <Loader2 className="h-4 w-4 text-cyan-300 animate-spin" />
                      <span className="text-xs text-white font-bold">Uploading...</span>
                    </div>
                  )}
                </div>
                
                {uploadResult && (
                  <div className={`p-3 rounded-xl text-xs font-semibold border mt-2 ${
                    uploadResult.success 
                      ? "bg-emerald-500/20 border-emerald-500/30 text-emerald-300"
                      : "bg-rose-500/20 border-rose-500/30 text-rose-300"
                  }`}>
                    {uploadResult.success ? (
                      <div>
                        <p className="font-bold flex items-center gap-1">✅ Upload Success!</p>
                        <p className="mt-1 text-[10px] text-white/80">
                          Total: {uploadResult.data.totalRows} | 
                          Success: {uploadResult.data.successfulRows} | 
                          Fail: {uploadResult.data.failedRows}
                        </p>
                      </div>
                    ) : (
                      <p className="font-bold">❌ Error: {uploadResult.error}</p>
                    )}
                  </div>
                )}
              </div>

              {/* Generate Bills */}
              <button
                onClick={handleGenerateBills}
                disabled={generatingBills}
                className="w-full bg-white hover:bg-white/90 disabled:opacity-50 text-blue-600 font-extrabold py-3.5 px-4 rounded-2xl text-xs tracking-wide transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-lg active:scale-[0.99]"
              >
                {generatingBills ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Receipt className="h-3.5 w-3.5" />
                )}
                Generate Month Bills
              </button>
            </div>
          </div>

          {/* Leak alert notifications */}
          {leakAlertsList.length > 0 && (
            <div className="p-4 bg-rose-500/20 border border-rose-500/30 rounded-2xl space-y-2 mt-4">
              <h4 className="text-xs font-extrabold text-rose-300 flex items-center gap-1.5">
                <AlertCircle className="h-4 w-4" />
                Active Leak Warning
              </h4>
              <p className="text-[10px] text-white/90 leading-relaxed font-medium">
                Flat {leakAlertsList[0].flat} ({leakAlertsList[0].name}) logged water flow of {leakAlertsList[0].usage} L today, exceeding normal bounds.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Pending approvals */}
      <div className="mt-6 border border-white/20 rounded-3xl overflow-hidden bg-white/10 backdrop-blur-md shadow-xl">
        <div className="px-6 py-4 border-b border-white/10 flex justify-between items-center">
          <h3 className="text-sm font-extrabold uppercase tracking-wide text-white">Pending Resident Approvals</h3>
          <span className="bg-white/20 text-white border border-white/10 text-xs font-bold px-3 py-1 rounded-full">{pendingRequests.length} New Requests</span>
        </div>
        <div className="divide-y divide-white/10">
          {pendingRequests.length > 0 ? (
            pendingRequests.map((req) => (
              <div key={req.id} className="p-6 flex items-center justify-between hover:bg-white/5 transition-colors">
                <div>
                  <p className="text-white font-extrabold text-sm">
                    {req.fullName} 
                    <span className="text-white/80 text-xs ml-3 font-bold bg-white/15 px-2 py-0.5 rounded-lg border border-white/10">Flat {req.flatNumber}</span>
                  </p>
                  <p className="text-white/60 text-xs mt-1">{req.email}</p>
                </div>
                <div className="flex gap-2.5">
                  <button
                    onClick={() => handleApprove(req.id)}
                    className="flex items-center gap-1 bg-white/15 text-white hover:bg-white/25 border border-white/25 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer"
                  >
                    <Check className="h-3.5 w-3.5" /> Approve
                  </button>
                  <button
                    onClick={() => handleReject(req.id)}
                    className="flex items-center gap-1 bg-rose-500/20 text-rose-300 hover:bg-rose-500/30 border border-rose-500/30 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer"
                  >
                    <X className="h-3.5 w-3.5" /> Reject
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="p-10 text-center text-white/50 text-sm">No pending requests at the moment.</div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}