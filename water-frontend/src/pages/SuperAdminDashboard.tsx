import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import DashboardLayout from "../components/DashboardLayout";
import { api } from "@/lib/axios";
import { getErrorMessage } from "../utils/error";
import {
  Building2, Users, Droplets, AlertOctagon, TrendingUp,
  BarChart3, PieChart as PieIcon, ArrowRight, Info, DollarSign,
  Plus, Edit, Trash2, Power, ToggleRight, Search, X, Eye, ArrowLeft
} from "lucide-react";
import { 
  ResponsiveContainer, BarChart, Bar, 
  XAxis, YAxis, Tooltip, CartesianGrid, AreaChart, Area, 
  PieChart, Pie, Cell 
} from "recharts";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { CardSkeleton, ChartSkeleton, TableSkeleton } from "../components/ui/Skeletons";
import { AnimatedCounter } from "../components/ui/AnimatedCounter";
import ReportsPage from "./ReportsPage";
import ResidentDetails from "./ResidentDetails";
import SystemHealthDashboard from "./SystemHealthDashboard";
import AuditLogViewer from "./AuditLogViewer";
import AnnouncementCenter from "./AnnouncementCenter";

const COLORS = ["#00B4D8", "#0F4C81", "#2ECC71", "#FFB703", "#EC4899", "#8B5CF6"];
const TOOLTIP_STYLE = { 
  backgroundColor: "#ffffff", 
  borderColor: "#e2e8f0", 
  borderRadius: "12px", 
  color: "#1F2937", 
  fontSize: "11px",
  boxShadow: "0 4px 12px rgba(15,76,129,0.08)"
};

export default function SuperAdminDashboard() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const currentTab = searchParams.get("tab") || "dashboard";

  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [userRoleFilter, setUserRoleFilter] = useState("ALL");

  // Community Modal States
  const [showCommModal, setShowCommModal] = useState(false);
  const [editingComm, setEditingComm] = useState<any>(null);
  const [commName, setCommName] = useState("");
  const [tariffRate, setTariffRate] = useState("5.00");
  const [taxRate, setTaxRate] = useState("18.00");
  const [lateFeeRate, setLateFeeRate] = useState("50.00");
  const [discountRate, setDiscountRate] = useState("0.00");
  const [commCode, setCommCode] = useState("");
  const [commAddress, setCommAddress] = useState("");
  const [commCity, setCommCity] = useState("");
  const [commState, setCommState] = useState("");
  const [commCountry, setCommCountry] = useState("");
  const [commPostalCode, setCommPostalCode] = useState("");
  const [commBuildingsCount, setCommBuildingsCount] = useState("1");
  const [commBlocksCount, setCommBlocksCount] = useState("1");
  const [commTotalFlats, setCommTotalFlats] = useState("0");
  const [commStatus, setCommStatus] = useState("ACTIVE");
  const [commLogoUrl, setCommLogoUrl] = useState("");
  const [commDescription, setCommDescription] = useState("");
  const [commCurrency, setCommCurrency] = useState("INR");
  const [commWaterUnit, setCommWaterUnit] = useState("L");
  const [commBillingCycle, setCommBillingCycle] = useState("MONTHLY");
  const [commPrimaryAdminId, setCommPrimaryAdminId] = useState("");
  const [minMonthlyCharge, setMinMonthlyCharge] = useState("0.00");
  const [fixedServiceCharge, setFixedServiceCharge] = useState("0.00");
  const [dueDateDays, setDueDateDays] = useState("15");
  const [commModalTab, setCommModalTab] = useState("basic"); // tabs: basic, location, billing
  const [statusFilter, setStatusFilter] = useState("ALL");

  // User Modal States
  const [showUserModal, setShowUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [userEmail, setUserEmail] = useState("");
  const [userPassword, setUserPassword] = useState("");
  const [userFullName, setUserFullName] = useState("");
  const [userRole, setUserRole] = useState("RESIDENT");
  const [userCommunityId, setUserCommunityId] = useState("");
  const [userFlatNumber, setUserFlatNumber] = useState("");

  const [isRefreshing, setIsRefreshing] = useState(false);

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

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      const res = await api.get("/api/dashboard/super-admin");
      setStats(res.data);
      toast.success("Dashboard data updated successfully.");
    } catch  {
      toast.error("Failed to refresh dashboard.");
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    setSearchQuery("");
    const tabName = currentTab === "dashboard" ? "System Overview" : currentTab.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
    document.title = `${tabName} | Super Admin | HydroBS`;
  }, [currentTab]);

  useEffect(() => {
    fetchStats();
    const interval = setInterval(async () => {
      try {
        const res = await api.get("/api/dashboard/super-admin");
        setStats(res.data);
      } catch (err) {
        console.error("Auto refresh stats failed:", err);
      }
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const openCommModal = (comm: any = null) => {
    setCommModalTab("basic");
    if (comm) {
      setEditingComm(comm);
      setCommName(comm.name || "");
      setTariffRate(comm.tariffRate?.toString() || "5.00");
      setTaxRate(comm.taxRate?.toString() || "18.00");
      setLateFeeRate(comm.lateFeeRate?.toString() || "50.00");
      setDiscountRate(comm.discountRate?.toString() || "0.00");
      setCommCode(comm.code || "");
      setCommAddress(comm.address || "");
      setCommCity(comm.city || "");
      setCommState(comm.state || "");
      setCommCountry(comm.country || "");
      setCommPostalCode(comm.postalCode || "");
      setCommBuildingsCount(comm.buildingsCount?.toString() || "1");
      setCommBlocksCount(comm.blocksCount?.toString() || "1");
      setCommTotalFlats(comm.totalFlats?.toString() || "0");
      setCommStatus(comm.status || "ACTIVE");
      setCommLogoUrl(comm.logoUrl || "");
      setCommDescription(comm.description || "");
      setCommCurrency(comm.currency || "INR");
      setCommWaterUnit(comm.waterUnit || "L");
      setCommBillingCycle(comm.billingCycle || "MONTHLY");
      setCommPrimaryAdminId(comm.primaryAdminId?.toString() || "");
      setMinMonthlyCharge(comm.minimumMonthlyCharge?.toString() || "0.00");
      setFixedServiceCharge(comm.fixedServiceCharge?.toString() || "0.00");
      setDueDateDays(comm.dueDateDays?.toString() || "15");
    } else {
      setEditingComm(null);
      setCommName("");
      setTariffRate("5.00");
      setTaxRate("18.00");
      setLateFeeRate("50.00");
      setDiscountRate("0.00");
      setCommCode("");
      setCommAddress("");
      setCommCity("");
      setCommState("");
      setCommCountry("");
      setCommPostalCode("");
      setCommBuildingsCount("1");
      setCommBlocksCount("1");
      setCommTotalFlats("0");
      setCommStatus("ACTIVE");
      setCommLogoUrl("");
      setCommDescription("");
      setCommCurrency("INR");
      setCommWaterUnit("L");
      setCommBillingCycle("MONTHLY");
      setCommPrimaryAdminId("");
      setMinMonthlyCharge("0.00");
      setFixedServiceCharge("0.00");
      setDueDateDays("15");
    }
    setShowCommModal(true);
  };

  const handleCommSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commName.trim()) return;

    try {
      const payload = {
        name: commName,
        tariffRate: parseFloat(tariffRate),
        taxRate: parseFloat(taxRate),
        lateFeeRate: parseFloat(lateFeeRate),
        discountRate: parseFloat(discountRate),
        code: commCode || null,
        address: commAddress || null,
        city: commCity || null,
        state: commState || null,
        country: commCountry || null,
        postalCode: commPostalCode || null,
        latitude: null, // can add if needed, but not critical for simple modal
        longitude: null,
        buildingsCount: parseInt(commBuildingsCount) || 1,
        blocksCount: parseInt(commBlocksCount) || 1,
        totalFlats: parseInt(commTotalFlats) || 0,
        status: commStatus || "ACTIVE",
        logoUrl: commLogoUrl || null,
        description: commDescription || null,
        currency: commCurrency || "INR",
        waterUnit: commWaterUnit || "L",
        billingCycle: commBillingCycle || "MONTHLY",
        primaryAdminId: commPrimaryAdminId ? parseInt(commPrimaryAdminId) : null,
        minimumMonthlyCharge: parseFloat(minMonthlyCharge) || 0.0,
        fixedServiceCharge: parseFloat(fixedServiceCharge) || 0.0,
        dueDateDays: parseInt(dueDateDays) || 15
      };

      if (editingComm) {
        await api.put(`/api/super-admin/communities/${editingComm.id}`, payload);
        toast.success("Community configurations updated successfully.");
      } else {
        await api.post("/api/super-admin/communities", payload);
        toast.success("Community registered successfully.");
      }
      setShowCommModal(false);
      fetchStats();
    } catch (err: any) {
      toast.error(getErrorMessage(err, "Failed to save community settings."));
    }
  };

  const handleDeleteComm = async (id: number, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"? This will delete all its residents, meter readings, water bills, and upload history.`)) {
      return;
    }
    try {
      await api.delete(`/api/super-admin/communities/${id}`);
      toast.success("Community deleted successfully.");
      fetchStats();
    } catch (err: any) {
      toast.error(getErrorMessage(err, "Failed to delete community."));
    }
  };

  const openUserModal = (u: any = null) => {
    if (u) {
      setEditingUser(u);
      setUserEmail(u.email);
      setUserPassword("");
      setUserFullName(u.fullName);
      setUserRole(u.role);
      const matchingComm = allCommunities.find((c: any) => c.name === u.communityName);
      setUserCommunityId(matchingComm ? matchingComm.id.toString() : "");
      setUserFlatNumber(u.flatNumber === "N/A" ? "" : u.flatNumber);
    } else {
      setEditingUser(null);
      setUserEmail("");
      setUserPassword("");
      setUserFullName("");
      setUserRole("RESIDENT");
      setUserCommunityId("");
      setUserFlatNumber("");
    }
    setShowUserModal(true);
  };

  const handleUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userEmail.trim() || !userFullName.trim() || (!editingUser && !userPassword)) return;

    try {
      const payload: any = {
        email: userEmail,
        fullName: userFullName,
        role: userRole,
        communityId: userRole !== "SUPER_ADMIN" && userCommunityId ? parseInt(userCommunityId) : null,
        flatNumber: userRole === "RESIDENT" ? userFlatNumber : null
      };
      if (userPassword) {
        payload.password = userPassword;
      }

      if (editingUser) {
        await api.put(`/api/super-admin/users/${editingUser.id}`, payload);
        toast.success("User details updated successfully.");
      } else {
        await api.post("/api/super-admin/users", payload);
        toast.success("User account created successfully.");
      }
      setShowUserModal(false);
      fetchStats();
    } catch (err: any) {
      toast.error(getErrorMessage(err, "Failed to save user account."));
    }
  };

  const handleToggleUserActive = async (id: number) => {
    try {
      await api.post(`/api/super-admin/users/${id}/toggle-active`);
      toast.success("User active status toggled successfully.");
      fetchStats();
    } catch  {
      toast.error("Failed to change user status.");
    }
  };

  const handleDeleteUser = async (id: number, name: string) => {
    if (!confirm(`Are you sure you want to delete user "${name}"? This will clear all historical bills and consumption records.`)) {
      return;
    }
    try {
      await api.delete(`/api/super-admin/users/${id}`);
      toast.success("User account deleted successfully.");
      fetchStats();
    } catch  {
      toast.error("Failed to delete user.");
    }
  };

  const totalCommunities = stats?.totalCommunities || 0;
  const totalUsers = stats?.totalUsers || 0;
  const systemWideWaterUsage = stats?.systemWideWaterUsage || "0 L";
  const totalRevenue = stats?.totalRevenue || 0;

  const cards = [
    { label: "Total Communities", value: totalCommunities, icon: Building2, color: "bg-[#00B4D8]/10 text-[#00B4D8]", tab: "communities" },
    { label: "Total Users", value: totalUsers, icon: Users, color: "bg-[#0F4C81]/10 text-[#0F4C81]", tab: "users" },
    { label: "Water Usage", value: systemWideWaterUsage, icon: Droplets, color: "bg-[#2ECC71]/10 text-[#2ECC71]", tab: "reports" },
    { label: "Revenue Collected", value: `₹${totalRevenue}`, icon: DollarSign, color: "bg-[#FFB703]/10 text-[#FFB703]", tab: "reports" },
  ];

  const communities = stats?.recentCommunities || [];
  const allCommunities = stats?.allCommunities || [];
  const allUsersList = stats?.allUsers || [];
  const errors = stats?.recentErrors || [];
  const systemMonthlyTrend = stats?.systemMonthlyTrend || [];
  const userGrowthData = stats?.userGrowthData || [];
  const usageByCommunity = stats?.usageByCommunity || [];
  const monthlyRevenueData = stats?.monthlyRevenueData || [];
  const paymentStatusData = stats?.paymentStatusData || [];

  const filteredUsers = allUsersList.filter((u: any) => {
    const search = searchQuery.toLowerCase();
    const matchesSearch =
      (u.fullName || "").toLowerCase().includes(search) ||
      (u.email || "").toLowerCase().includes(search) ||
      (u.role || "").toLowerCase().includes(search) ||
      (u.communityName || "").toLowerCase().includes(search) ||
      (u.flatNumber || "").toLowerCase().includes(search);

    const matchesRole =
      userRoleFilter === "ALL" ||
      (userRoleFilter === "COMMUNITY_ADMIN" && (u.role === "ADMIN" || u.role === "COMMUNITY_ADMIN")) ||
      u.role === userRoleFilter;

    return matchesSearch && matchesRole;
  });

  const getTabTitle = () => {
    switch (currentTab) {
      case "communities":
        return "Communities Management";
      case "users":
        return "Users Directory";
      case "reports":
        return "System Analytics & Audits";
      case "audit-logs":
        return "Platform Audit Trails";
      case "system-health":
        return "System Health";
      case "settings":
        return "Global Settings";
      default:
        return "System Overview";
    }
  };

  return (
    <DashboardLayout 
      role="SUPER_ADMIN" 
      title={getTabTitle()} 
      subtitle="View metrics across all HydroBS communities"
      onRefresh={handleRefresh}
      isRefreshing={isRefreshing}
    >
      {currentTab === "dashboard" && (
        <div className="space-y-6 animate-fade-in text-[#1F2937]">
          {/* Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            {loading ? (
              <>
                <CardSkeleton />
                <CardSkeleton />
                <CardSkeleton />
                <CardSkeleton />
              </>
            ) : (
              cards.map((card) => (
                <motion.div 
                  whileHover={{ y: -4 }}
                  key={card.label} 
                  onClick={() => setSearchParams({ tab: card.tab })}
                  className="group relative overflow-hidden p-6 rounded-3xl border border-slate-100 bg-white shadow-sm cursor-pointer hover:shadow-md transition-all duration-200 flex justify-between items-start"
                >
                  <div className="text-left">
                    <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">{card.label}</p>
                    <p className="text-3xl font-extrabold text-[#0F4C81] mt-2">
                      {card.label.includes("Revenue") ? (
                        <AnimatedCounter value={card.value} prefix="₹" />
                      ) : card.label.includes("Water") || card.label.includes("Usage") ? (
                        <AnimatedCounter value={card.value} suffix=" L" />
                      ) : (
                        <AnimatedCounter value={card.value} />
                      )}
                    </p>
                  </div>
                  <div className={`p-3.5 rounded-2xl ${card.color} shadow-sm transition-transform duration-200 group-hover:scale-105`}>
                    <card.icon className="h-6 w-6" />
                  </div>
                  <ArrowRight className="absolute bottom-3.5 right-3.5 h-4 w-4 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                </motion.div>
              ))
            )}
          </div>

          {/* Visualizations Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {loading ? (
              <>
                <div className="lg:col-span-2">
                  <ChartSkeleton />
                </div>
                <ChartSkeleton />
              </>
            ) : (
              <>
                {/* System Water Trend */}
                <div className="lg:col-span-2 chart-container p-6 space-y-4">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-[#00B4D8]" />
                    <h3 className="text-xs font-bold tracking-wide uppercase text-slate-500">System Water Consumption Trend (Last 6 Months)</h3>
                  </div>
                  <div className="h-[240px] w-full">
                    {systemMonthlyTrend.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={systemMonthlyTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                          <defs>
                            <linearGradient id="colorUsage" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#00B4D8" stopOpacity={0.2}/>
                              <stop offset="95%" stopColor="#00B4D8" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                          <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} tickLine={false} />
                          <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} />
                          <Tooltip contentStyle={TOOLTIP_STYLE} />
                          <Area type="monotone" dataKey="usage" stroke="#00B4D8" strokeWidth={2.5} fillOpacity={1} fill="url(#colorUsage)" name="Usage (L)" />
                        </AreaChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-full flex items-center justify-center text-slate-400 text-xs">No monthly trend logs available.</div>
                    )}
                  </div>
                </div>

                {/* Community Usage Breakdown */}
                <div className="chart-container p-6 flex flex-col justify-between">
                  <div className="flex items-center gap-2">
                    <PieIcon className="h-5 w-5 text-[#2ECC71]" />
                    <h3 className="text-xs font-bold tracking-wide uppercase text-slate-500">Community Usage Breakdown</h3>
                  </div>
                  <div className="h-[200px] w-full flex items-center justify-center relative">
                    {usageByCommunity.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={usageByCommunity} cx="50%" cy="50%" innerRadius={55} outerRadius={75} paddingAngle={4} dataKey="usage">
                            {usageByCommunity.map((_entry: any, index: number) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip contentStyle={TOOLTIP_STYLE} />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="text-slate-400 text-xs">No community usage metrics.</div>
                    )}
                  </div>
                  <div className="flex flex-wrap justify-center gap-2 text-[9px] text-slate-500 font-semibold px-2">
                    {usageByCommunity.map((item: any, idx: number) => (
                      <span key={item.name} className="flex items-center gap-1">
                        <span className="h-2 w-2 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }}></span>
                        {item.name}
                      </span>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {loading ? (
              <>
                <ChartSkeleton />
                <TableSkeleton rows={4} cols={3} />
                <TableSkeleton rows={4} cols={3} />
              </>
            ) : (
              <>
                {/* User Growth Trend */}
                <div className="chart-container p-6 space-y-4">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-[#0F4C81]" />
                    <h3 className="text-xs font-bold tracking-wide uppercase text-slate-500">User Base Growth (Cumulative)</h3>
                  </div>
                  <div className="h-[200px] w-full">
                    {userGrowthData.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={userGrowthData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                          <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} tickLine={false} />
                          <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} />
                          <Tooltip contentStyle={TOOLTIP_STYLE} />
                          <Bar dataKey="users" fill="#0f4c81" radius={[5, 5, 0, 0]} name="Users" />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-full flex items-center justify-center text-slate-400 text-xs">No user growth records.</div>
                    )}
                  </div>
                </div>

                {/* Registered Communities Table */}
                <div className="clay-card overflow-hidden flex flex-col">
                  <div className="px-6 py-4.5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50">
                    <h3 className="text-xs font-bold uppercase tracking-wide text-[#0F4C81] dark:text-[#00B4D8]">Registered Communities</h3>
                    <button onClick={() => setSearchParams({ tab: "communities" })} className="text-[10px] text-[#00B4D8] font-bold hover:underline cursor-pointer">View All</button>
                  </div>
                  <div className="overflow-x-auto flex-1 custom-scrollbar">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400 font-bold uppercase border-b border-slate-100 dark:border-slate-800">
                        <tr>
                          <th className="px-5 py-3">ID</th>
                          <th className="px-5 py-3">Community Name</th>
                          <th className="px-5 py-3">Residents</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-600 dark:text-slate-300 font-medium">
                        {communities.length > 0 ? (
                          communities.map((c: any) => (
                            <tr key={c.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                              <td className="px-5 py-3 font-bold text-[#0F4C81] dark:text-[#00B4D8]">#{c.id}</td>
                              <td className="px-5 py-3 font-bold text-slate-800 dark:text-slate-200">{c.name}</td>
                              <td className="px-5 py-3 text-slate-500 dark:text-slate-400">{c.residentsCount} users</td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={3} className="px-5 py-8 text-center text-slate-400 dark:text-slate-500">No communities registered.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Recent DB Import Failures Table */}
                <div className="border border-slate-100 rounded-3xl bg-white overflow-hidden shadow-sm flex flex-col">
                  <div className="px-6 py-4.5 border-b border-slate-100 bg-slate-50/50">
                    <h3 className="text-xs font-bold uppercase tracking-wide text-slate-500 flex items-center gap-1.5">
                      <AlertOctagon className="h-4.5 w-4.5 text-rose-500 animate-pulse" />
                      Recent Import Failures
                    </h3>
                  </div>
                  <div className="overflow-x-auto flex-1 custom-scrollbar max-h-[220px]">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 text-slate-500 font-bold uppercase border-b border-slate-100 sticky top-0">
                        <tr>
                          <th className="px-5 py-3">Row</th>
                          <th className="px-5 py-3">Identifier</th>
                          <th className="px-5 py-3">Error Cause</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-600 font-medium">
                        {errors.length > 0 ? (
                          errors.map((e: any) => (
                            <tr key={e.id} className="hover:bg-slate-50/50 transition-colors">
                              <td className="px-5 py-3 text-slate-500">Row {e.csvRowNumber}</td>
                              <td className="px-5 py-3 font-bold text-rose-600">{e.residentIdentifier || "N/A"}</td>
                              <td className="px-5 py-3 text-slate-500 max-w-[140px] truncate" title={e.errorMessage}>{e.errorMessage}</td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={3} className="px-5 py-8 text-center text-slate-400">No import errors logged.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Quick Operations & System Activity Banner */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
            <div className="clay-card p-6 border border-slate-100 bg-gradient-to-br from-[#0F4C81] to-[#0B3A63] text-white flex items-center justify-between shadow-md">
              <div className="space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-widest text-[#00B4D8]">System Operations</span>
                <h4 className="text-lg font-extrabold text-white">Communities Management</h4>
                <p className="text-xs text-slate-300">View and configure parameters for all {communities.length} registered communities.</p>
              </div>
              <button 
                onClick={() => setSearchParams({ tab: "communities" })}
                className="px-4 py-2.5 bg-[#00B4D8] hover:bg-[#48CAE4] text-white font-extrabold text-xs rounded-xl shadow-sm transition-all cursor-pointer whitespace-nowrap"
              >
                Manage
              </button>
            </div>

            <div className="clay-card p-6 border border-slate-100 bg-gradient-to-br from-emerald-700 to-teal-800 text-white flex items-center justify-between shadow-md">
              <div className="space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-300">Telemetry & Maintenance</span>
                <h4 className="text-lg font-extrabold text-white">System Telemetry & Health</h4>
                <p className="text-xs text-emerald-100">Monitor API response latency, database pools, JVM memory, and CPU load.</p>
              </div>
              <button 
                onClick={() => setSearchParams({ tab: "system-health" })}
                className="px-4 py-2.5 bg-emerald-400 hover:bg-emerald-300 text-slate-900 font-extrabold text-xs rounded-xl shadow-sm transition-all cursor-pointer whitespace-nowrap"
              >
                Health Check
              </button>
            </div>

            <div className="clay-card p-6 border border-slate-100 bg-gradient-to-br from-purple-700 to-indigo-900 text-white flex items-center justify-between shadow-md">
              <div className="space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-widest text-purple-300">Security & Audits</span>
                <h4 className="text-lg font-extrabold text-white">Platform Audit Trails</h4>
                <p className="text-xs text-purple-100">Inspect security logs, administrator actions, and access telemetry history.</p>
              </div>
              <button 
                onClick={() => setSearchParams({ tab: "audit-logs" })}
                className="px-4 py-2.5 bg-purple-400 hover:bg-purple-300 text-slate-900 font-extrabold text-xs rounded-xl shadow-sm transition-all cursor-pointer whitespace-nowrap"
              >
                Audit Trails
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Communities Tab */}
      {currentTab === "communities" && (
        <div className="border border-slate-100 rounded-3xl bg-white p-6 space-y-6 animate-fade-in shadow-sm">
          <div className="flex justify-between items-center border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-lg font-bold text-[#0F4C81]">Registered Communities</h3>
              <p className="text-xs text-slate-500">Manage all registered residential communities on the platform</p>
            </div>
            <div className="flex gap-4 items-center">
              <button 
                onClick={() => openCommModal()} 
                className="bg-gradient-to-r from-[#00B4D8] to-[#0F4C81] hover:from-[#48CAE4] hover:to-[#00B4D8] px-4 py-2 rounded-xl text-xs font-bold text-white shadow-md flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Plus className="h-4 w-4" /> Add Community
              </button>
              <button onClick={() => setSearchParams({})} className="text-xs font-bold text-[#00B4D8] hover:underline cursor-pointer">Back to Dashboard</button>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
            <div className="relative w-full max-w-md">
              <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search communities by name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 hover:bg-slate-100/80 border border-transparent focus:border-slate-100 focus:bg-white rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#00B4D8]/20 transition-all font-medium"
              />
            </div>
            <div className="flex gap-2">
              <select 
                value={statusFilter} 
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-slate-50 border border-slate-100 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-600 focus:outline-none cursor-pointer"
              >
                <option value="ALL">All Statuses</option>
                <option value="ACTIVE">ACTIVE</option>
                <option value="INACTIVE">INACTIVE</option>
                <option value="ARCHIVED">ARCHIVED</option>
              </select>
            </div>
          </div>

          {loading ? (
            <TableSkeleton rows={5} cols={7} />
          ) : (
            <div className="overflow-hidden border border-slate-100 rounded-2xl bg-white shadow-sm custom-scrollbar">
              <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase border-b border-slate-100">
                <tr>
                  <th className="px-6 py-4">Community ID</th>
                  <th className="px-6 py-4">Name</th>
                  <th className="px-6 py-4">Tariff Plan</th>
                  <th className="px-6 py-4">Total Residents</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Registered Date</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-600 font-medium">
                {allCommunities.filter((c: any) => 
                  c.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
                  (statusFilter === "ALL" || c.status === statusFilter)
                ).length > 0 ? (
                  allCommunities
                    .filter((c: any) => 
                      c.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
                      (statusFilter === "ALL" || c.status === statusFilter)
                    )
                    .map((c: any) => (
                      <tr key={c.id} className="hover:bg-slate-50/50">
                        <td className="px-6 py-4 font-bold text-[#0F4C81]">#{c.id}</td>
                        <td className="px-6 py-4 font-bold text-slate-800">
                          <div className="flex flex-col">
                            <span className="font-bold">{c.name}</span>
                            {c.code && <span className="text-[10px] text-slate-400 font-mono">Code: {c.code}</span>}
                          </div>
                        </td>
                        <td className="px-6 py-4 font-bold text-[#00B4D8]">₹{c.tariffRate || "5.00"}/L (+{c.taxRate || "18"}% Tax)</td>
                        <td className="px-6 py-4">{c.residentsCount} users</td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase border ${
                            c.status === "ACTIVE"
                              ? "bg-emerald-50 text-emerald-600 border-emerald-100"
                              : c.status === "INACTIVE"
                              ? "bg-amber-50 text-amber-600 border-amber-100"
                              : "bg-rose-50 text-rose-500 border-rose-100"
                          }`}>
                            {c.status || "ACTIVE"}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-slate-400">{new Date(c.createdAt).toLocaleDateString()}</td>
                        <td className="px-6 py-4 text-right flex justify-end gap-2">
                          <button 
                            onClick={() => openCommModal(c)}
                            className="p-1.5 hover:bg-slate-100 rounded-lg text-[#00B4D8] transition-all cursor-pointer"
                            title="Edit Community configurations"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button 
                            onClick={() => handleDeleteComm(c.id, c.name)}
                            className="p-1.5 hover:bg-rose-50 rounded-lg text-rose-500 transition-all cursor-pointer"
                            title="Delete Community"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                ) : (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center text-slate-400">No communities found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          )}
        </div>
      )}

      {/* Users Tab */}
      {currentTab === "users" && (
        <div className="border border-slate-100 rounded-3xl bg-white p-6 space-y-6 animate-fade-in shadow-sm">
          <div className="flex justify-between items-center border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-lg font-bold text-[#0F4C81]">Platform Users</h3>
              <p className="text-xs text-slate-500">Overview of all active users across communities</p>
            </div>
            <div className="flex gap-4 items-center">
              <button 
                onClick={() => openUserModal()} 
                className="bg-gradient-to-r from-[#00B4D8] to-[#0F4C81] hover:from-[#48CAE4] hover:to-[#00B4D8] px-4 py-2 rounded-xl text-xs font-bold text-white shadow-md flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Plus className="h-4 w-4" /> Add User Account
              </button>
              <button onClick={() => setSearchParams({})} className="text-xs font-bold text-[#00B4D8] hover:underline cursor-pointer">Back to Dashboard</button>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
            <div className="flex flex-col sm:flex-row gap-3 w-full max-w-3xl">
              <div className="relative w-full max-w-md">
                <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search users by name, email, flat, or role..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-50 hover:bg-slate-100/80 border border-transparent focus:border-slate-100 focus:bg-white rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#00B4D8]/20 transition-all font-medium"
                />
              </div>
              <select
                value={userRoleFilter}
                onChange={(e) => setUserRoleFilter(e.target.value)}
                className="bg-slate-50 border border-slate-100 rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#00B4D8]/20 transition-all cursor-pointer min-w-[190px]"
              >
                <option value="ALL">All Roles</option>
                <option value="RESIDENT">Residents</option>
                <option value="COMMUNITY_ADMIN">Community Admins</option>
                <option value="SUPER_ADMIN">Super Admins</option>
              </select>
            </div>
            <div className="px-4 py-2 rounded-xl bg-slate-50 border border-slate-100 text-xs font-bold text-slate-600">
              Showing: {filteredUsers.length} / {totalUsers}
            </div>
          </div>

          {loading ? (
            <TableSkeleton rows={5} cols={8} />
          ) : (
            <div className="overflow-hidden border border-slate-100 rounded-2xl bg-white shadow-sm custom-scrollbar">
              <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase border-b border-slate-100">
                <tr>
                  <th className="px-5 py-4">User ID</th>
                  <th className="px-5 py-4">Full Name</th>
                  <th className="px-5 py-4">Email</th>
                  <th className="px-5 py-4">Role</th>
                  <th className="px-5 py-4">Community</th>
                  <th className="px-5 py-4">Flat Number</th>
                  <th className="px-5 py-4">Status</th>
                  <th className="px-5 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-600 font-medium">
                {filteredUsers.length > 0 ? (
                  filteredUsers.map((u: any) => (
                      <tr key={u.id} className="hover:bg-slate-50/50">
                        <td className="px-5 py-4 font-bold text-[#0F4C81]">#{u.id}</td>
                        <td className="px-5 py-4 font-bold text-slate-800">{u.fullName}</td>
                        <td className="px-5 py-4 text-slate-500">{u.email}</td>
                        <td className="px-5 py-4">
                          <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wider ${
                            u.role === "SUPER_ADMIN" 
                              ? "bg-rose-50 text-rose-600 border border-rose-100" 
                              : u.role === "ADMIN" || u.role === "COMMUNITY_ADMIN"
                              ? "bg-cyan-50 text-[#0F4C81] border border-cyan-100"
                              : "bg-emerald-50 text-emerald-600 border border-emerald-100"
                          }`}>
                            {u.role}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-slate-500">{u.communityName}</td>
                        <td className="px-5 py-4 text-slate-500">{u.flatNumber}</td>
                        <td className="px-5 py-4">
                          <button 
                            onClick={() => handleToggleUserActive(u.id)}
                            className={`px-2.5 py-1 rounded-xl text-[9px] font-bold flex items-center gap-1 cursor-pointer transition-all ${
                              u.isActive !== false 
                                ? "bg-emerald-50 text-emerald-600 border border-emerald-100 hover:bg-emerald-100" 
                                : "bg-rose-50 text-rose-500 border border-rose-100 hover:bg-rose-100"
                            }`}
                          >
                            <Power className="h-2.5 w-2.5" />
                            {u.isActive !== false ? "Active" : "Disabled"}
                          </button>
                        </td>
                        <td className="px-5 py-4 text-right flex justify-end gap-2">
                          {u.role === "RESIDENT" && (
                            <button
                              onClick={() => setSearchParams({ tab: "users", id: u.id.toString() })}
                              className="p-1.5 hover:bg-slate-100 rounded-lg text-[#0F4C81] transition-all cursor-pointer"
                              title="View Resident Profile"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                          )}
                          <button 
                            onClick={() => openUserModal(u)}
                            className="p-1.5 hover:bg-slate-100 rounded-lg text-[#00B4D8] transition-all cursor-pointer"
                            title="Edit User Detail"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button 
                            onClick={() => handleDeleteUser(u.id, u.fullName)}
                            className="p-1.5 hover:bg-rose-50 rounded-lg text-rose-500 transition-all cursor-pointer"
                            title="Delete User"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                ) : (
                  <tr>
                    <td colSpan={8} className="px-5 py-8 text-center text-slate-400">No users found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          )}
        </div>
      )}

      {/* RESIDENT DETAILS VIEW (from users tab) */}
      {currentTab === "users" && searchParams.get("id") && (
        <div className="space-y-4 animate-fade-in">
          <button
            onClick={() => setSearchParams({ tab: "users" })}
            className="flex items-center gap-2 text-[#0F4C81] hover:text-[#00B4D8] text-sm font-bold transition-colors"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Users List
          </button>
          <ResidentDetails id={searchParams.get("id")!} isTab={true} />
        </div>
      )}

      {currentTab === "audit-logs" && (
        <div className="space-y-6 animate-fade-in text-[#1F2937]">
          <AuditLogViewer />
        </div>
      )}

      {currentTab === "system-health" && (
        <div className="space-y-6 animate-fade-in text-[#1F2937]">
          <SystemHealthDashboard />
        </div>
      )}

      {currentTab === "announcements" && (
        <div className="space-y-6 animate-fade-in text-[#1F2937]">
          <AnnouncementCenter />
        </div>
      )}

      {/* Visualizations Tab */}
      {currentTab === "visualizations" && (
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="space-y-6 text-[#1F2937] dot-grid-bg"
        >
          {/* Header Row */}
          <div className="flex justify-between items-center border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-xl font-bold gradient-text-animated">Analytics & Data Visualizations</h3>
              <p className="text-xs text-slate-500 font-medium mt-0.5">Real-time system-wide resource trends and financial comparison models</p>
            </div>
            <button onClick={() => setSearchParams({})} className="text-xs font-bold text-[#00B4D8] hover:text-[#0F4C81] hover:underline transition-all cursor-pointer">
              Back to Dashboard
            </button>
          </div>

          {/* KPI Cards Row */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 cascade-enter">
            <div className="clay-card p-5 space-y-1 glow-border">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Total Water Consumption</span>
              <h4 className="text-2xl font-extrabold text-[#00B4D8]"><AnimatedCounter value={parseFloat(stats?.systemWideWaterUsage?.replace(/[^0-9.]/g, "") || "0")} /> L</h4>
              <span className="block text-[10px] text-slate-400">Total volume logged across all communities</span>
            </div>
            <div className="clay-card p-5 space-y-1 glow-border">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Platform Revenue</span>
              <h4 className="text-2xl font-extrabold text-[#2ECC71]">₹<AnimatedCounter value={parseFloat(stats?.totalRevenue || "0")} /></h4>
              <span className="block text-[10px] text-slate-400">Sum of all successfully settled invoices</span>
            </div>
            <div className="clay-card p-5 space-y-1 glow-border">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Outstanding Dues</span>
              <h4 className="text-2xl font-extrabold text-amber-500">₹<AnimatedCounter value={parseFloat(stats?.totalOutstanding || "0")} /></h4>
              <span className="block text-[10px] text-slate-400">Dues from unpaid invoices in all communities</span>
            </div>
            <div className="clay-card p-5 space-y-1 glow-border">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Total User Base</span>
              <h4 className="text-2xl font-extrabold text-indigo-500"><AnimatedCounter value={stats?.totalUsers || 0} /></h4>
              <span className="block text-[10px] text-slate-400">Administrators and resident flat owners</span>
            </div>
          </div>

          {/* Charts Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Total Water Consumption Trend */}
            <div className="chart-container p-5 space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">System Monthly Water Consumption (6-Month Trend)</h4>
              <div className="h-[250px] w-full">
                {stats?.systemMonthlyTrend?.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={stats.systemMonthlyTrend} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="usageGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#00B4D8" stopOpacity={0.2}/>
                          <stop offset="95%" stopColor="#00B4D8" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} tickLine={false} />
                      <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} />
                      <Tooltip contentStyle={TOOLTIP_STYLE} />
                      <Area type="monotone" dataKey="usage" stroke="#00B4D8" strokeWidth={2.5} fillOpacity={1} fill="url(#usageGrad)" name="Usage (L)" />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-slate-400 text-xs">No consumption data.</div>
                )}
              </div>
            </div>

            {/* Platform Revenue vs Outstanding Trend */}
            <div className="chart-container p-5 space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">Monthly Billing Revenue vs Outstanding Dues</h4>
              <div className="h-[250px] w-full">
                {stats?.monthlyRevenueData?.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stats.monthlyRevenueData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} tickLine={false} />
                      <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} />
                      <Tooltip contentStyle={TOOLTIP_STYLE} />
                      <Bar dataKey="revenue" fill="#2ECC71" radius={[4, 4, 0, 0]} name="Revenue (₹)" />
                      <Bar dataKey="outstanding" fill="#FFB703" radius={[4, 4, 0, 0]} name="Outstanding (₹)" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-slate-400 text-xs">No billing metrics.</div>
                )}
              </div>
            </div>

            {/* Water Consumption by Community */}
            <div className="chart-container p-5 space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">Water Consumption by Community</h4>
              <div className="h-[250px] w-full">
                {stats?.usageByCommunity?.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stats.usageByCommunity} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} tickLine={false} />
                      <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} />
                      <Tooltip contentStyle={TOOLTIP_STYLE} />
                      <Bar dataKey="usage" fill="#0F4C81" radius={[4, 4, 0, 0]} name="Usage (L)" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-slate-400 text-xs">No community usage data.</div>
                )}
              </div>
            </div>

            {/* User Base Growth */}
            <div className="chart-container p-5 space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">Platform User Base Growth (6-Month Cumulative)</h4>
              <div className="h-[250px] w-full">
                {stats?.userGrowthData?.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={stats.userGrowthData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="userGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.2}/>
                          <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} tickLine={false} />
                      <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} />
                      <Tooltip contentStyle={TOOLTIP_STYLE} />
                      <Area type="monotone" dataKey="users" stroke="#8B5CF6" strokeWidth={2.5} fillOpacity={1} fill="url(#userGrad)" name="Total Users" />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-slate-400 text-xs">No user metrics.</div>
                )}
              </div>
            </div>

            {/* Invoice Payment Status Ratio */}
            <div className="chart-container p-5 space-y-4 flex flex-col justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">Invoice Settlement Status Distribution</h4>
              <div className="h-[200px] w-full flex items-center justify-center relative">
                {stats?.paymentStatusData?.length > 0 && (stats.paymentStatusData[0]?.value > 0 || stats.paymentStatusData[1]?.value > 0) ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={stats.paymentStatusData} cx="50%" cy="50%" innerRadius={60} outerRadius={85} paddingAngle={4} dataKey="value">
                        {stats.paymentStatusData.map((_: any, idx: number) => (
                          <Cell key={`cell-${idx}`} fill={COLORS[(idx + 2) % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={TOOLTIP_STYLE} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="text-slate-400 text-xs">No invoices settled yet.</div>
                )}
              </div>
              <div className="flex justify-center gap-5 text-[10px] text-slate-500 font-bold border-t border-slate-50 pt-3">
                <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-[#2ECC71]"></span>Paid</span>
                <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-[#FFB703]"></span>Outstanding</span>
              </div>
            </div>

            {/* Top Communities Listing and Graph */}
            <div className="chart-container p-5 space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">Top Communities by Resident Base</h4>
              <div className="h-[250px] w-full">
                {stats?.allCommunities?.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={[...stats.allCommunities].sort((a, b) => b.residentsCount - a.residentsCount).slice(0, 5)} layout="vertical" margin={{ top: 5, right: 5, left: -10, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis type="number" stroke="#94a3b8" fontSize={10} tickLine={false} />
                      <YAxis dataKey="name" type="category" stroke="#94a3b8" fontSize={10} tickLine={false} width={80} />
                      <Tooltip contentStyle={TOOLTIP_STYLE} />
                      <Bar dataKey="residentsCount" fill="#EC4899" radius={[0, 4, 4, 0]} name="Residents Count" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-slate-400 text-xs">No communities registered.</div>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Settings Tab */}
      {currentTab === "settings" && (
        <div className="border border-slate-100 rounded-3xl bg-white p-6 space-y-6 animate-fade-in shadow-sm max-w-xl mx-auto">
          <div className="flex justify-between items-center border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-lg font-bold text-[#0F4C81]">System Settings</h3>
              <p className="text-xs text-slate-500">Configure global application variables and security policies</p>
            </div>
            <button onClick={() => setSearchParams({})} className="text-xs font-bold text-[#00B4D8] hover:underline cursor-pointer">Back to Dashboard</button>
          </div>

          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between">
              <div>
                <h4 className="font-bold text-xs text-slate-700">Maintenance Mode</h4>
                <p className="text-[10px] text-slate-400 mt-0.5">Toggle maintenance screen for all normal resident users</p>
              </div>
              <span className="px-2.5 py-1 bg-rose-50 text-rose-600 border border-rose-100 rounded-md font-extrabold text-[9px] uppercase tracking-wider">OFF</span>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between">
              <div>
                <h4 className="font-bold text-xs text-slate-700">System Log verbosity</h4>
                <p className="text-[10px] text-slate-400 mt-0.5">Define Spring Boot backend execution tracing levels</p>
              </div>
              <span className="px-2.5 py-1 bg-cyan-50 text-[#0F4C81] border border-cyan-100 rounded-md font-extrabold text-[9px] uppercase tracking-wider">DEBUG</span>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between">
              <div>
                <h4 className="font-bold text-xs text-slate-700">JWT Access Expiry Length</h4>
                <p className="text-[10px] text-slate-400 mt-0.5">Maximum seconds allowed for JWT to remain valid</p>
              </div>
              <span className="font-bold text-xs text-slate-700">900s (15m)</span>
            </div>
          </div>
        </div>
      )}

      {/* Modals using clean light animations */}
      <AnimatePresence>
        {/* Community Modal */}
        {showCommModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="border border-slate-100 rounded-[28px] bg-white p-6 w-full max-w-md space-y-4 shadow-2xl text-slate-800 relative"
            >
              <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                <h3 className="text-base font-bold text-[#0F4C81]">{editingComm ? "Edit Community Billing" : "Create New Community"}</h3>
                <button onClick={() => setShowCommModal(false)} className="text-slate-400 hover:text-slate-600 transition-colors p-1 rounded-lg hover:bg-slate-100 cursor-pointer"><X className="h-5 w-5" /></button>
              </div>
              <div className="flex border-b border-slate-100 mb-3 text-xs font-bold">
                <button 
                  type="button" 
                  onClick={() => setCommModalTab("basic")} 
                  className={`flex-1 pb-2 border-b-2 transition-all cursor-pointer ${commModalTab === "basic" ? "border-[#00B4D8] text-[#00B4D8]" : "border-transparent text-slate-400 hover:text-slate-600"}`}
                >
                  Basic Info
                </button>
                <button 
                  type="button" 
                  onClick={() => setCommModalTab("location")} 
                  className={`flex-1 pb-2 border-b-2 transition-all cursor-pointer ${commModalTab === "location" ? "border-[#00B4D8] text-[#00B4D8]" : "border-transparent text-slate-400 hover:text-slate-600"}`}
                >
                  Location
                </button>
                <button 
                  type="button" 
                  onClick={() => setCommModalTab("billing")} 
                  className={`flex-1 pb-2 border-b-2 transition-all cursor-pointer ${commModalTab === "billing" ? "border-[#00B4D8] text-[#00B4D8]" : "border-transparent text-slate-400 hover:text-slate-600"}`}
                >
                  Billing Params
                </button>
              </div>

              <form onSubmit={handleCommSubmit} className="space-y-4 text-xs font-medium max-h-[60vh] overflow-y-auto pr-1">
                {commModalTab === "basic" && (
                  <div className="space-y-3.5 animate-fade-in">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="block text-slate-500 font-bold">Community Name</label>
                        <input 
                          type="text" 
                          value={commName} 
                          onChange={(e) => setCommName(e.target.value)} 
                          placeholder="e.g. Golden Treasure"
                          className="w-full bg-slate-50 hover:bg-slate-100/50 border border-transparent focus:border-slate-100 focus:bg-white rounded-xl px-3.5 py-2.5 text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#00B4D8]/20 transition-all font-semibold"
                          required
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="block text-slate-500 font-bold">Unique Code</label>
                        <input 
                          type="text" 
                          value={commCode} 
                          onChange={(e) => setCommCode(e.target.value)} 
                          placeholder="e.g. GOLDEN-T"
                          className="w-full bg-slate-50 hover:bg-slate-100/50 border border-transparent focus:border-slate-100 focus:bg-white rounded-xl px-3.5 py-2.5 text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#00B4D8]/20 transition-all font-semibold"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="block text-slate-500 font-bold">Primary Admin</label>
                        <select 
                          value={commPrimaryAdminId} 
                          onChange={(e) => setCommPrimaryAdminId(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-100 rounded-xl px-3 py-2.5 text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#00B4D8]/20 transition-all font-semibold cursor-pointer"
                        >
                          <option value="">Not Assigned</option>
                          {allUsersList.filter((u: any) => u.role === "ADMIN").map((u: any) => (
                            <option key={u.id} value={u.id.toString()}>{u.fullName} ({u.email})</option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="block text-slate-500 font-bold">Status</label>
                        <select 
                          value={commStatus} 
                          onChange={(e) => setCommStatus(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-100 rounded-xl px-3 py-2.5 text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#00B4D8]/20 transition-all font-semibold cursor-pointer"
                        >
                          <option value="ACTIVE">ACTIVE</option>
                          <option value="INACTIVE">INACTIVE</option>
                          <option value="ARCHIVED">ARCHIVED</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <div className="space-y-1">
                        <label className="block text-slate-500 font-bold">Buildings</label>
                        <input 
                          type="number" 
                          value={commBuildingsCount} 
                          onChange={(e) => setCommBuildingsCount(e.target.value)} 
                          className="w-full bg-slate-50 border border-transparent focus:border-slate-100 rounded-xl px-3 py-2.5 text-slate-700 font-semibold"
                          min="1"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="block text-slate-500 font-bold">Blocks</label>
                        <input 
                          type="number" 
                          value={commBlocksCount} 
                          onChange={(e) => setCommBlocksCount(e.target.value)} 
                          className="w-full bg-slate-50 border border-transparent focus:border-slate-100 rounded-xl px-3 py-2.5 text-slate-700 font-semibold"
                          min="1"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="block text-slate-500 font-bold">Total Flats</label>
                        <input 
                          type="number" 
                          value={commTotalFlats} 
                          onChange={(e) => setCommTotalFlats(e.target.value)} 
                          className="w-full bg-slate-50 border border-transparent focus:border-slate-100 rounded-xl px-3 py-2.5 text-slate-700 font-semibold"
                          min="0"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="block text-slate-500 font-bold">Logo URL</label>
                      <input 
                        type="text" 
                        value={commLogoUrl} 
                        onChange={(e) => setCommLogoUrl(e.target.value)} 
                        placeholder="https://image-url"
                        className="w-full bg-slate-50 border border-transparent focus:border-slate-100 rounded-xl px-3 py-2.5 text-slate-700"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="block text-slate-500 font-bold">Description</label>
                      <textarea 
                        value={commDescription} 
                        onChange={(e) => setCommDescription(e.target.value)} 
                        rows={2}
                        placeholder="Short overview of the property..."
                        className="w-full bg-slate-50 border border-transparent focus:border-slate-100 rounded-xl px-3 py-2 text-slate-700 font-semibold focus:outline-none"
                      />
                    </div>
                  </div>
                )}

                {commModalTab === "location" && (
                  <div className="space-y-3.5 animate-fade-in">
                    <div className="space-y-1">
                      <label className="block text-slate-500 font-bold">Street Address</label>
                      <input 
                        type="text" 
                        value={commAddress} 
                        onChange={(e) => setCommAddress(e.target.value)} 
                        placeholder="e.g. 123 Main St, Near Central Mall"
                        className="w-full bg-slate-50 border border-transparent focus:border-slate-100 rounded-xl px-3 py-2.5 text-slate-700 font-semibold"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="block text-slate-500 font-bold">City</label>
                        <input 
                          type="text" 
                          value={commCity} 
                          onChange={(e) => setCommCity(e.target.value)} 
                          className="w-full bg-slate-50 border border-transparent focus:border-slate-100 rounded-xl px-3 py-2.5 text-slate-700 font-semibold"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="block text-slate-500 font-bold">State / Region</label>
                        <input 
                          type="text" 
                          value={commState} 
                          onChange={(e) => setCommState(e.target.value)} 
                          className="w-full bg-slate-50 border border-transparent focus:border-slate-100 rounded-xl px-3 py-2.5 text-slate-700 font-semibold"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="block text-slate-500 font-bold">Country</label>
                        <input 
                          type="text" 
                          value={commCountry} 
                          onChange={(e) => setCommCountry(e.target.value)} 
                          className="w-full bg-slate-50 border border-transparent focus:border-slate-100 rounded-xl px-3 py-2.5 text-slate-700 font-semibold"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="block text-slate-500 font-bold">Postal Code</label>
                        <input 
                          type="text" 
                          value={commPostalCode} 
                          onChange={(e) => setCommPostalCode(e.target.value)} 
                          className="w-full bg-slate-50 border border-transparent focus:border-slate-100 rounded-xl px-3 py-2.5 text-slate-700 font-semibold"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {commModalTab === "billing" && (
                  <div className="space-y-3.5 animate-fade-in">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="block text-slate-500 font-bold">Tariff Rate (₹/Litre)</label>
                        <input 
                          type="number" 
                          step="0.01"
                          value={tariffRate} 
                          onChange={(e) => setTariffRate(e.target.value)} 
                          className="w-full bg-slate-50 border border-transparent focus:border-slate-100 rounded-xl px-3 py-2.5 text-slate-700 font-semibold"
                          required
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="block text-slate-500 font-bold">Tax Rate (%)</label>
                        <input 
                          type="number" 
                          step="0.1"
                          value={taxRate} 
                          onChange={(e) => setTaxRate(e.target.value)} 
                          className="w-full bg-slate-50 border border-transparent focus:border-slate-100 rounded-xl px-3 py-2.5 text-slate-700 font-semibold"
                          required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="block text-slate-500 font-bold">Flat Late Fee (₹)</label>
                        <input 
                          type="number" 
                          step="1"
                          value={lateFeeRate} 
                          onChange={(e) => setLateFeeRate(e.target.value)} 
                          className="w-full bg-slate-50 border border-transparent focus:border-slate-100 rounded-xl px-3 py-2.5 text-slate-700 font-semibold"
                          required
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="block text-slate-500 font-bold">Discount Rate (%)</label>
                        <input 
                          type="number" 
                          step="0.1"
                          value={discountRate} 
                          onChange={(e) => setDiscountRate(e.target.value)} 
                          className="w-full bg-slate-50 border border-transparent focus:border-slate-100 rounded-xl px-3 py-2.5 text-slate-700 font-semibold"
                          required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <div className="space-y-1 col-span-2">
                        <label className="block text-slate-500 font-bold">Min Monthly Charge (₹)</label>
                        <input 
                          type="number" 
                          step="0.01"
                          value={minMonthlyCharge} 
                          onChange={(e) => setMinMonthlyCharge(e.target.value)} 
                          className="w-full bg-slate-50 border border-transparent focus:border-slate-100 rounded-xl px-3 py-2.5 text-slate-700 font-semibold"
                          required
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="block text-slate-500 font-bold">Due Days</label>
                        <input 
                          type="number" 
                          value={dueDateDays} 
                          onChange={(e) => setDueDateDays(e.target.value)} 
                          className="w-full bg-slate-50 border border-transparent focus:border-slate-100 rounded-xl px-3 py-2.5 text-slate-700 font-semibold"
                          required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="block text-slate-500 font-bold">Fixed Service Charge (₹)</label>
                        <input 
                          type="number" 
                          step="0.01"
                          value={fixedServiceCharge} 
                          onChange={(e) => setFixedServiceCharge(e.target.value)} 
                          className="w-full bg-slate-50 border border-transparent focus:border-slate-100 rounded-xl px-3 py-2.5 text-slate-700 font-semibold"
                          required
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="block text-slate-500 font-bold">Billing Cycle</label>
                        <select 
                          value={commBillingCycle} 
                          onChange={(e) => setCommBillingCycle(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-100 rounded-xl px-3 py-2.5 text-slate-700 font-semibold cursor-pointer"
                        >
                          <option value="WEEKLY">WEEKLY</option>
                          <option value="MONTHLY">MONTHLY</option>
                          <option value="BI_MONTHLY">BI-MONTHLY</option>
                          <option value="QUARTERLY">QUARTERLY</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="block text-slate-500 font-bold">Water Unit</label>
                        <select 
                          value={commWaterUnit} 
                          onChange={(e) => setCommWaterUnit(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-100 rounded-xl px-3 py-2.5 text-slate-700 font-semibold cursor-pointer"
                        >
                          <option value="L">Litres (L)</option>
                          <option value="KL">KiloLitres (kL)</option>
                          <option value="GAL">Gallons (Gal)</option>
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="block text-slate-500 font-bold">Currency</label>
                        <input 
                          type="text" 
                          value={commCurrency} 
                          onChange={(e) => setCommCurrency(e.target.value)} 
                          className="w-full bg-slate-50 border border-transparent focus:border-slate-100 rounded-xl px-3 py-2.5 text-slate-700 font-semibold"
                          required
                        />
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex gap-4 pt-3.5 justify-end border-t border-slate-100">
                  <button 
                    type="button" 
                    onClick={() => setShowCommModal(false)}
                    className="px-4 py-2 border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-600 transition-all font-bold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="px-5 py-2 bg-gradient-to-r from-[#00B4D8] to-[#0F4C81] hover:from-[#48CAE4] hover:to-[#00B4D8] rounded-xl text-white font-bold transition-all shadow-md cursor-pointer"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {/* User Modal */}
        {showUserModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="border border-slate-100 rounded-[28px] bg-white p-6 w-full max-w-md space-y-4 shadow-2xl text-slate-800 relative"
            >
              <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                <h3 className="text-base font-bold text-[#0F4C81]">{editingUser ? "Edit User Details" : "Create New User Account"}</h3>
                <button onClick={() => setShowUserModal(false)} className="text-slate-400 hover:text-slate-600 transition-colors p-1 rounded-lg hover:bg-slate-100 cursor-pointer"><X className="h-5 w-5" /></button>
              </div>
              <form onSubmit={handleUserSubmit} className="space-y-4 text-xs font-medium">
                <div className="space-y-1">
                  <label className="block text-slate-500 font-bold">Full Name</label>
                  <input 
                    type="text" 
                    value={userFullName} 
                    onChange={(e) => setUserFullName(e.target.value)} 
                    placeholder="e.g. Ravi Kumar"
                    className="w-full bg-slate-50 hover:bg-slate-100/50 border border-transparent focus:border-slate-100 focus:bg-white rounded-xl px-3.5 py-2.5 text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#00B4D8]/20 transition-all font-semibold"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-slate-500 font-bold">Email Address</label>
                  <input 
                    type="email" 
                    value={userEmail} 
                    onChange={(e) => setUserEmail(e.target.value)} 
                    placeholder="name@domain.com"
                    className="w-full bg-slate-50 hover:bg-slate-100/50 border border-transparent focus:border-slate-100 focus:bg-white rounded-xl px-3.5 py-2.5 text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#00B4D8]/20 transition-all font-semibold"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-slate-500 font-bold">
                    {editingUser ? "New Password (Leave blank to keep current)" : "Password"}
                  </label>
                  <input 
                    type="password" 
                    value={userPassword} 
                    onChange={(e) => setUserPassword(e.target.value)} 
                    className="w-full bg-slate-50 hover:bg-slate-100/50 border border-transparent focus:border-slate-100 focus:bg-white rounded-xl px-3.5 py-2.5 text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#00B4D8]/20 transition-all font-semibold"
                    required={!editingUser}
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-slate-500 font-bold">System Role</label>
                  <select 
                    value={userRole} 
                    onChange={(e) => setUserRole(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-100 rounded-xl px-3 py-2.5 text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#00B4D8]/20 transition-all font-semibold cursor-pointer"
                  >
                    <option value="RESIDENT">RESIDENT (Customer)</option>
                    <option value="ADMIN">ADMIN (Community Manager)</option>
                    <option value="SUPER_ADMIN">SUPER_ADMIN (Platform Owner)</option>
                  </select>
                </div>

                {userRole !== "SUPER_ADMIN" && (
                  <div className="space-y-1 animate-[floatBubble_0.3s_ease-out]">
                    <label className="block text-slate-500 font-bold">Assigned Community</label>
                    <select 
                      value={userCommunityId} 
                      onChange={(e) => setUserCommunityId(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-100 rounded-xl px-3 py-2.5 text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#00B4D8]/20 transition-all font-semibold cursor-pointer"
                      required
                    >
                      <option value="">Select Community...</option>
                      {allCommunities.map((c: any) => (
                        <option key={c.id} value={c.id.toString()}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                )}

                {userRole === "RESIDENT" && (
                  <div className="space-y-1 animate-[floatBubble_0.3s_ease-out]">
                    <label className="block text-slate-500 font-bold">Flat Number</label>
                    <input 
                      type="text" 
                      value={userFlatNumber} 
                      onChange={(e) => setUserFlatNumber(e.target.value)} 
                      placeholder="e.g. A-204"
                      className="w-full bg-slate-50 hover:bg-slate-100/50 border border-transparent focus:border-slate-100 focus:bg-white rounded-xl px-3.5 py-2.5 text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#00B4D8]/20 transition-all font-semibold"
                      required
                    />
                  </div>
                )}

                <div className="flex gap-4 pt-3 justify-end border-t border-slate-100">
                  <button 
                    type="button" 
                    onClick={() => setShowUserModal(false)}
                    className="px-4 py-2 border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-600 transition-all font-bold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="px-5 py-2 bg-gradient-to-r from-[#00B4D8] to-[#0F4C81] hover:from-[#48CAE4] hover:to-[#00B4D8] rounded-xl text-white font-bold transition-all shadow-md cursor-pointer"
                  >
                    Save Account
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </DashboardLayout>
  );
}