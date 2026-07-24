import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import DashboardLayout from "../components/DashboardLayout";
import NotificationCenter from "./NotificationCenter";
import AnnouncementCenter from "./AnnouncementCenter";
import AnalyticsDashboard from "./AnalyticsDashboard";
import ReportsPage from "./ReportsPage";
import { 
  Droplet, TrendingDown, Info, Shield, Search, Loader2, 
  CheckCircle2, AlertTriangle, Building2, ExternalLink, HelpCircle, 
  Clock, DollarSign, ArrowRight, Bell, Lightbulb, CreditCard, Download, Calendar, X, Gauge, RefreshCw
} from "lucide-react";
import { api } from "@/lib/axios";
import { getErrorMessage } from "../utils/error";
import { 
  ResponsiveContainer, LineChart, Line, BarChart, Bar, 
  XAxis, YAxis, Tooltip, CartesianGrid, Legend, AreaChart, Area
} from "recharts";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { CardSkeleton, ChartSkeleton, TableSkeleton, ActivitySkeleton } from "../components/ui/Skeletons";
import { AnimatedCounter } from "../components/ui/AnimatedCounter";
import { paymentService } from "../services/paymentService";

const COLORS = ["#00B4D8", "#0F4C81", "#2ECC71", "#FFB703", "#EC4899", "#8B5CF6"];
const TOOLTIP_STYLE = { 
  backgroundColor: "#ffffff", 
  borderColor: "#e2e8f0", 
  borderRadius: "12px", 
  color: "#1F2937", 
  fontSize: "11px",
  boxShadow: "0 4px 12px rgba(15,76,129,0.08)"
};

export default function ResidentDashboard() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const currentTab = searchParams.get("tab") || "dashboard";

  const [me, setMe] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const [historyReadings, setHistoryReadings] = useState<any[]>([]);
  const [historyPage, setHistoryPage] = useState(0);
  const [historyTotal, setHistoryTotal] = useState(0);
  const [historyStartDate, setHistoryStartDate] = useState('');
  const [historyEndDate, setHistoryEndDate] = useState('');
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [communities, setCommunities] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [myRequests, setMyRequests] = useState<any[]>([]);
  const [submittingRequest, setSubmittingRequest] = useState<number | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [payingBillId, setPayingBillId] = useState<number | null>(null);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [breakdownBill, setBreakdownBill] = useState<any>(null);

  const formatCycleDates = (bill: any) => {
    if (!bill) return "";
    let startStr = bill.billingStartDate;
    let endStr = bill.billingEndDate;

    if (!startStr && bill.billingMonth) {
      startStr = `${bill.billingMonth}-01`;
    }
    if (!endStr && bill.billingMonth) {
      const parts = bill.billingMonth.split("-");
      if (parts.length === 2) {
        const y = parseInt(parts[0]);
        const m = parseInt(parts[1]);
        const lastDay = new Date(y, m, 0).getDate();
        endStr = `${bill.billingMonth}-${lastDay}`;
      }
    }

    if (startStr && endStr) {
      const dStart = new Date(startStr);
      const dEnd = new Date(endStr);
      if (!isNaN(dStart.getTime()) && !isNaN(dEnd.getTime())) {
        const startFormatted = dStart.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
        const endFormatted = dEnd.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
        if (startFormatted === endFormatted) {
          return startFormatted;
        }
        return `${startFormatted} - ${endFormatted}`;
      }
    }
    return bill.month || bill.billingMonth || "Current Cycle";
  };

  // Interactive Calendar States
  const [calendarDate, setCalendarDate] = useState(new Date());
  const [calendarEvents, setCalendarEvents] = useState<any[]>([]);
  const [selectedDateEvents, setSelectedDateEvents] = useState<any[]>([]);
  const [selectedDayNum, setSelectedDayNum] = useState<number | null>(null);
  const [calendarViewMode, setCalendarViewMode] = useState<"month" | "week" | "day">("month");

  const fetchCalendar = async () => {
    try {
      const year = calendarDate.getFullYear();
      const month = String(calendarDate.getMonth() + 1).padStart(2, "0");
      const res = await api.get(`/api/calendar?month=${year}-${month}`);
      setCalendarEvents(res.data);
    } catch (err) {
      console.error("Error loading calendar events:", err);
    }
  };

  const loadRazorpaySDK = () => {
    return new Promise<boolean>((resolve) => {
      if ((window as any).Razorpay) {
        resolve(true);
        return;
      }
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handleStartPayment = async (billId: number) => {
    setPayingBillId(billId);
    setProcessingPayment(true);

    try {
      let orderAmount = 10000;
      let orderId = "order_" + Math.random().toString(36).substring(2, 10);
      try {
        const order = await paymentService.createOrder(billId);
        if (order.amount) orderAmount = order.amount;
        if (order.id) orderId = order.id;
      } catch {}

      const sdkLoaded = await loadRazorpaySDK();

      if (sdkLoaded && (window as any).Razorpay) {
        const razorpayKey = import.meta.env.VITE_RAZORPAY_KEY_ID || "rzp_test_sample_key_id";
        const options: any = {
          key: razorpayKey,
          amount: orderAmount,
          currency: "INR",
          name: "HydroBS Smart Water",
          description: `Water Bill Payment #${billId}`,
          handler: async function (response: any) {
            try {
              await paymentService.verifyPayment({
                billId,
                razorpayOrderId: response.razorpay_order_id || orderId,
                razorpayPaymentId: response.razorpay_payment_id || ("pay_" + Math.random().toString(36).substring(2, 10)),
                status: "SUCCESS"
              });
              toast.success("Payment verified & completed successfully via Razorpay!");
              fetchProfileAndStats();
            } catch (err: any) {
              toast.error(getErrorMessage(err, "Payment verification failed"));
            } finally {
              setProcessingPayment(false);
              setPayingBillId(null);
            }
          },
          modal: {
            ondismiss: function () {
              setProcessingPayment(false);
              toast.info("Payment session closed.");
            }
          },
          prefill: {
            name: me?.fullName || "Ravi Kumar",
            email: me?.email || "resident@hydrobs.com",
            contact: me?.phoneNumber || "9876543210"
          },
          theme: {
            color: "#00B4D8"
          }
        };

        const rzp = new (window as any).Razorpay(options);
        rzp.open();
      } else {
        setShowPaymentModal(true);
      }
    } catch {
      setShowPaymentModal(true);
    } finally {
      setProcessingPayment(false);
    }
  };

  const handleConfirmPayment = async (status: "SUCCESS" | "FAILED") => {
    if (!payingBillId) return;
    try {
      setProcessingPayment(true);
      if (status === "SUCCESS") {
        const order = await paymentService.createOrder(payingBillId);
        await paymentService.verifyPayment({
          billId: payingBillId,
          razorpayOrderId: order.id,
          razorpayPaymentId: "pay_" + Math.random().toString(36).substring(2, 10),
          status: "SUCCESS"
        });
        toast.success("Payment completed successfully!");
      } else {
        await paymentService.verifyPayment({
          billId: payingBillId,
          status: "FAILED"
        });
        toast.error("Payment failed. Please retry.");
      }
      setShowPaymentModal(false);
      setPayingBillId(null);
      fetchProfileAndStats();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to process payment");
    } finally {
      setProcessingPayment(false);
    }
  };

  const fetchProfileAndStats = async () => {
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
    }
  };

  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await fetchProfileAndStats();
      toast.success("Dashboard data updated successfully.");
    } catch  {
      toast.error("Failed to refresh dashboard.");
    } finally {
      setIsRefreshing(false);
    }
  };

  const fetchReadingsHistory = async () => {
    try {
      setLoadingHistory(true);
      const params = new URLSearchParams();
      params.append("page", String(historyPage));
      params.append("size", "10");
      if (historyStartDate) params.append("startDate", historyStartDate);
      if (historyEndDate) params.append("endDate", historyEndDate);

      const res = await api.get(`/api/water/readings/search?${params.toString()}`);
      setHistoryReadings(res.data.content || []);
      setHistoryTotal(res.data.totalElements || 0);
    } catch (err) {
      console.error("Error loading readings history:", err);
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    const fetchAllData = async () => {
      await fetchProfileAndStats();
      if (currentTab === "usage-history") {
        await fetchReadingsHistory();
      }
    };

    const init = async () => {
      setLoading(true);
      await fetchAllData();
      setLoading(false);
    };
    init();

    // Live database polling every 3 seconds for instant real-time updates
    const interval = setInterval(fetchAllData, 3000);

    // Instant sync when switching window focus or tab visibility
    const handleFocus = () => fetchAllData();
    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleFocus);
    };
  }, [currentTab, historyPage, historyStartDate, historyEndDate]);

  useEffect(() => {
    setSearchQuery("");
    const tabName = currentTab === "dashboard" ? "Resident Overview" : currentTab.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
    document.title = `${tabName} | Resident | HydroBS`;
  }, [currentTab]);



  const handleJoinRequest = async (communityId: number) => {
    setSubmittingRequest(communityId);
    try {
      await api.post(`/api/communities/${communityId}/join-request`);
      toast.success("Join request sent successfully to community admin.");
      const reqRes = await api.get("/api/communities/my-requests");
      setMyRequests(reqRes.data);
    } catch (err: any) {
      toast.error(getErrorMessage(err, "Failed to send join request."));
    } finally {
      setSubmittingRequest(null);
    }
  };

  // Download PDF Invoice
  const handleDownloadInvoicePdf = async (billId: number) => {
    try {
      const response = await api.get(`/api/water/bills/${billId}/pdf`, { responseType: "blob" });
      const blob = new Blob([response.data], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `invoice-${billId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success("Invoice PDF downloaded successfully.");
    } catch  {
      toast.error("Error downloading invoice PDF.");
    }
  };

  const filteredCommunities = communities.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading && !me) {
    return (
      <div className="min-h-screen bg-[#F5FAFC] flex flex-col items-center justify-center text-[#1F2937]">
        <Loader2 className="h-10 w-10 text-[#0F4C81] animate-spin mb-4" />
        <p className="text-slate-600 text-sm font-semibold">Loading your dashboard...</p>
      </div>
    );
  }

  const pendingRequest = myRequests.find(r => r.status === "PENDING");
  const rejectedRequests = myRequests.filter(r => r.status === "REJECTED");

  // Stats setup
  const todayUsage = stats?.todayUsage || 0;
  const thisMonthUsage = stats?.thisMonthUsage || 0;
  const currentBillStatus = stats?.currentBillStatus || "NO_BILL";
  const currentBillDueDate = stats?.currentBillDueDate || "";
  const avgDailyUsage = stats?.avgDailyUsage || 0;
  const leakStatus = stats?.leakStatus || "Safe";
  const leakMessage = stats?.leakMessage || "No leaks detected.";
  
  const billsList = stats?.recentBillsList || [];

  const calcOutstanding = billsList
    .filter((b: any) => (b.status || "").toUpperCase() !== "PAID")
    .reduce((sum: number, b: any) => sum + (parseFloat(b.amount) || 0), 0);

  const calcSpent = billsList
    .filter((b: any) => (b.status || "").toUpperCase() === "PAID")
    .reduce((sum: number, b: any) => sum + (parseFloat(b.amount) || 0), 0);

  const totalOutstanding = (stats?.totalOutstanding && stats?.totalOutstanding > 0)
    ? stats.totalOutstanding
    : calcOutstanding;

  const totalSpent = (stats?.totalSpent && stats?.totalSpent > 0)
    ? stats.totalSpent
    : calcSpent;

  const chartData = stats?.monthlyChart || [];
  const weeklyData = stats?.weeklyChart || [];
  const comparisonChart = stats?.comparisonChart || [];

  const cards = [
    { label: "Current Meter Index", value: `${stats?.currentReading || 0} L`, change: "Cumulative reading", icon: Gauge, color: "bg-[#0F4C81]/10 text-[#0F4C81]", tab: "my-usage" },
    { label: "Today's Usage", value: `${todayUsage} L`, change: "Latest reading", icon: Droplet, color: "bg-[#00B4D8]/10 text-[#00B4D8]", tab: "my-usage" },
    { label: "This Month", value: `${thisMonthUsage} L`, change: "Cycle cumulative", icon: TrendingDown, color: "bg-[#2ECC71]/10 text-[#2ECC71]", tab: "my-usage" },
    { label: "Outstanding Bills", value: `₹${totalOutstanding}`, change: currentBillStatus === "UNPAID" ? `Due on ${currentBillDueDate}` : "No unpaid bills", icon: AlertTriangle, color: totalOutstanding > 0 ? "bg-rose-500/10 text-rose-600 animate-pulse border border-rose-200" : "bg-slate-500/10 text-slate-600", tab: "my-bills" },
    { label: "Total Spent", value: `₹${totalSpent}`, change: "Lifetime bills paid", icon: DollarSign, color: "bg-purple-500/10 text-purple-600", tab: "my-bills" },
  ];

  const getTabTitle = () => {
    switch (currentTab) {
      case "my-usage":
        return "Detailed Consumption";
      case "usage-history":
        return "Consumption History";
      case "my-bills":
        return "Water Bills & Payments";
      case "my-invoices":
        return "Invoices Directory";
      case "reports":
        return "Water Reports";
      case "visualizations":
        return "Analytics Hub";
      case "notifications":
        return "My Inbox Notifications";
      case "water-tips":
        return "Smart Water Tips";
      case "profile":
        return "Resident Profile";
      default:
        return "Resident Overview";
    }
  };
  const renderNoCommunityPlaceholder = (featureName: string) => (
    <div className="p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 text-center space-y-4 max-w-lg mx-auto shadow-sm animate-fade-in text-slate-800 dark:text-slate-200">
      <div className="h-12 w-12 rounded-full bg-amber-50 dark:bg-amber-950/20 flex items-center justify-center mx-auto text-amber-500">
        <AlertTriangle className="h-6 w-6" />
      </div>
      <div className="space-y-2">
        <h4 className="font-bold text-base text-slate-850 dark:text-slate-200">Community Membership Required</h4>
        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
          You must be registered and approved in a community to view {featureName.toLowerCase()}.
        </p>
      </div>
      <button
        onClick={() => setSearchParams({ tab: "dashboard" })}
        className="px-4 py-2 bg-[#0F4C81] hover:bg-[#00B4D8] text-white text-xxs font-extrabold rounded-xl uppercase tracking-wider transition-all cursor-pointer"
      >
        Go to Community Finder
      </button>
    </div>
  );

  return (
    <DashboardLayout
      role="RESIDENT"
      title={getTabTitle()}
      subtitle={`${me?.communityName || "No Community"} • Flat ${me?.flatNumber || "N/A"}${me?.meterNumber ? ` • Meter ID: ${me.meterNumber}` : ""}`}
      onRefresh={handleRefresh}
      isRefreshing={isRefreshing}
    >
      {!me?.communityId ? (
        currentTab === "profile" ? (
          <div className="border border-slate-100 rounded-3xl bg-white p-6 space-y-6 shadow-sm max-w-xl mx-auto text-[#1F2937] animate-fade-in">
            <div className="flex justify-between items-center border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-lg font-bold text-[#0F4C81]">User Account Profile</h3>
                <p className="text-xs text-slate-500">Manage your credentials and details</p>
              </div>
              <button onClick={() => setSearchParams({})} className="text-xs font-bold text-[#00B4D8] hover:underline cursor-pointer">Back to Dashboard</button>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-4 border-b border-slate-100 pb-4">
                <div className="h-16 w-16 bg-gradient-to-br from-[#0F4C81] to-[#00B4D8] rounded-2xl flex items-center justify-center text-xl font-bold text-white shadow-md">
                  {me?.fullName?.split(" ").map((n: string) => n[0]).join("").toUpperCase()}
                </div>
                <div>
                  <h4 className="font-bold text-base text-slate-800">{me?.fullName}</h4>
                  <p className="text-xs text-slate-400 font-medium">{me?.email}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs font-semibold">
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                  <p className="text-slate-400">Apartment flat</p>
                  <p className="text-sm font-bold mt-1 text-slate-800">Flat {me?.flatNumber || "N/A"}</p>
                </div>
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                  <p className="text-slate-400">Community Name</p>
                  <p className="text-sm font-bold mt-1 text-slate-800">{me?.communityName || "No Community"}</p>
                </div>
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                  <p className="text-slate-400">Joined At</p>
                  <p className="text-sm font-bold mt-1 text-slate-800">{me?.createdAt ? new Date(me.createdAt).toLocaleDateString() : "N/A"}</p>
                </div>
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                  <p className="text-slate-400">Role Level</p>
                  <p className="text-sm font-bold mt-1 text-[#00B4D8]">{me?.role}</p>
                </div>
              </div>
            </div>
          </div>
        ) : currentTab === "dashboard" ? (
          <div className="max-w-3xl mx-auto space-y-8 animate-fade-in text-slate-800 dark:text-slate-100">
            {pendingRequest && (
              <div className="p-6 rounded-3xl bg-amber-50 dark:bg-amber-955 border border-amber-200 dark:border-amber-900/50 text-slate-800 dark:text-slate-200 flex items-start gap-4 shadow-sm animate-fade-in">
                <AlertTriangle className="h-6 w-6 text-amber-500 shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-extrabold text-amber-600 dark:text-amber-400 uppercase tracking-wide text-xs">Join Request Pending Approval</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-300 mt-2 leading-relaxed font-medium">
                    You have requested to join <strong className="text-slate-800 dark:text-slate-100">{pendingRequest.communityName}</strong>. 
                    The community administrator must approve your profile (Flat {me.flatNumber || 'N/A'}) before you can view stats.
                  </p>
                  <div className="mt-4 flex items-center gap-3">
                    <div className="flex items-center gap-2 text-xs text-amber-600 dark:text-amber-400 bg-white dark:bg-slate-900 border border-amber-100 dark:border-amber-800 px-3 py-1.5 rounded-xl font-bold shadow-xs">
                      <Loader2 className="h-3 w-3 animate-spin" /> Pending review...
                    </div>
                    <button
                      onClick={fetchProfileAndStats}
                      className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white font-extrabold text-xs rounded-xl transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
                    >
                      <RefreshCw className="h-3.5 w-3.5" /> Refresh Approval Status
                    </button>
                  </div>
                </div>
              </div>
            )}

            {!pendingRequest && (
              <div className="p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 space-y-6 shadow-sm animate-fade-in">
                <div className="space-y-2">
                  <h3 className="text-xl font-extrabold text-[#0F4C81] dark:text-[#00B4D8] flex items-center gap-2 uppercase tracking-wide text-xs">
                    <Building2 className="h-5 w-5 text-[#00B4D8]" />
                    Find and Join Your Community
                  </h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
                    Search for your community below to request access. Make sure your flat number is correctly set under your profile.
                  </p>
                </div>

                <div className="relative">
                  <Search className="absolute left-3.5 top-3.5 h-4.5 w-4.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search by community name..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 hover:bg-slate-100/80 dark:hover:bg-slate-700/80 border border-transparent focus:border-slate-100 dark:focus:border-slate-800 focus:bg-white dark:focus:bg-slate-800 rounded-xl pl-10 pr-4 py-3 text-sm text-slate-700 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#00B4D8]/20 transition-all font-medium"
                  />
                </div>

                <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-100 dark:border-slate-800 rounded-2xl overflow-hidden bg-white dark:bg-slate-900 shadow-xs">
                  {filteredCommunities.length > 0 ? (
                    filteredCommunities.map((comm) => {
                      const isRejected = rejectedRequests.some(r => r.communityId === comm.id);
                      return (
                        <div key={comm.id} className="p-5 flex items-center justify-between hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                          <div>
                            <p className="font-extrabold text-slate-800 dark:text-slate-200">{comm.name}</p>
                            {isRejected && <p className="text-xs text-rose-500 mt-1 font-bold">Previous request was rejected.</p>}
                          </div>
                          <button
                            onClick={() => handleJoinRequest(comm.id)}
                            disabled={submittingRequest !== null}
                            className="bg-[#0F4C81] dark:bg-[#00B4D8] hover:bg-[#00B4D8] dark:hover:bg-[#48CAE4] text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all shadow-sm active:scale-[0.98] cursor-pointer"
                          >
                            {submittingRequest === comm.id ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : "Request to Join"}
                          </button>
                        </div>
                      );
                    })
                  ) : (
                    <div className="p-8 text-center text-slate-400 dark:text-slate-500 text-sm font-medium">
                      No communities found. Ask your community admin to create one.
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        ) : (
          renderNoCommunityPlaceholder(getTabTitle())
        )
      ) : (
        <>
          {currentTab === "dashboard" && (
            <div className="space-y-6 animate-fade-in text-slate-800 dark:text-slate-100">
          {/* Dashboard Stats cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => <CardSkeleton key={i} />)
            ) : (
              cards.map((card) => (
                <motion.div
                  whileHover={{ y: -3 }}
                  key={card.label}
                  onClick={() => setSearchParams({ tab: card.tab })}
                  className="group relative overflow-hidden p-5 clay-card glow-border cursor-pointer hover:shadow-md transition-all duration-200 text-left"
                >
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <p className="text-slate-400 dark:text-slate-500 text-[10px] font-bold uppercase tracking-wider">{card.label}</p>
                      <p className="text-2xl font-extrabold text-[#0F4C81] dark:text-[#00B4D8]">
                        {card.label.includes("Bills") || card.label.includes("Spent") ? (
                          <AnimatedCounter value={card.value} prefix="₹" />
                        ) : card.label.includes("Usage") || card.label.includes("Month") || card.label.includes("Index") ? (
                          <AnimatedCounter value={card.value} suffix=" L" />
                        ) : (
                          <AnimatedCounter value={card.value} />
                        )}
                      </p>
                      <p className="text-slate-400 dark:text-slate-500 text-[10px] font-medium">{card.change}</p>
                    </div>
                    <div className={`p-3 rounded-2xl ${card.color} shadow-xs transition-transform duration-200 group-hover:scale-105`}>
                      <card.icon className="h-5 w-5" />
                    </div>
                  </div>
                  <ArrowRight className="absolute bottom-3 right-3 h-4.5 w-4.5 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                </motion.div>
              ))
            )}
          </div>

          {/* Consumption Charts */}
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
                <div className="lg:col-span-2 chart-container p-6 space-y-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Monthly Consumption Trend</h3>
                  <div className="h-[220px] w-full">
                    {chartData.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                          <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} tickLine={false} />
                          <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} />
                          <Tooltip contentStyle={TOOLTIP_STYLE} />
                          <Line type="monotone" dataKey="usage" stroke="#00B4D8" strokeWidth={2.5} dot={{ fill: "#00B4D8", r: 4 }} />
                        </LineChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-full flex items-center justify-center text-slate-400 text-xs">No consumption readings logged.</div>
                    )}
                  </div>
                </div>

                <div className="chart-container p-6 space-y-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Weekly Usage</h3>
                  <div className="h-[220px] w-full">
                    {weeklyData.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={weeklyData} margin={{ top: 5, right: 0, left: -25, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                          <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} tickLine={false} />
                          <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} />
                          <Tooltip contentStyle={TOOLTIP_STYLE} />
                          <Bar dataKey="usage" fill="#0F4C81" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-full flex items-center justify-center text-slate-400 text-xs">No weekly logs available.</div>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Comparison Trend & AI Water Advisor */}
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
                <div className="lg:col-span-2 chart-container p-6 space-y-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Usage Comparison (vs Community Average)</h3>
                  <div className="h-[220px] w-full">
                    {comparisonChart.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={comparisonChart} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                          <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} tickLine={false} />
                          <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} />
                          <Tooltip contentStyle={TOOLTIP_STYLE} />
                          <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: "11px", fontWeight: "bold" }} />
                          <Line name="My Usage" type="monotone" dataKey="myUsage" stroke="#00B4D8" strokeWidth={2.5} dot={{ r: 4 }} />
                          <Line name="Community Average" type="monotone" dataKey="averageUsage" stroke="#FFB703" strokeWidth={1.5} strokeDasharray="4 4" dot={{ r: 2 }} />
                        </LineChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-full flex items-center justify-center text-slate-400 text-xs">No comparative data.</div>
                    )}
                  </div>
                </div>

                <div className="clay-card glow-border p-6 flex flex-col justify-between">
                  <div className="space-y-4">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-[#0F4C81] dark:text-[#00B4D8] flex items-center gap-1.5">
                      <Info className="h-4.5 w-4.5 text-[#00B4D8]" />
                      AI Water Advisor
                    </h3>
                    <div className="flex gap-4 items-start text-slate-700 dark:text-slate-200">
                      <div className="h-10 w-10 shrink-0 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-800 flex items-center justify-center">
                        <svg className="w-5 h-5 text-[#00B4D8]" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364.364l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                        </svg>
                      </div>
                      <div className="space-y-1 text-left">
                        <p className="text-xs font-semibold leading-relaxed text-slate-600 dark:text-slate-300">{stats?.advisorText}</p>
                        {stats?.advisorPercentage > 0 && (
                          <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold">Estimated savings: <span className="text-[#2ECC71] font-extrabold">{stats?.advisorSavings}</span></p>
                        )}
                      </div>
                    </div>
                  </div>
                  <button onClick={() => setSearchParams({ tab: "water-tips" })} className="w-full text-center text-xs text-[#00B4D8] font-bold hover:underline flex justify-center items-center gap-1.5 mt-4 cursor-pointer">
                    View Water Tips <ExternalLink className="h-3 w-3" />
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Recent Bills List */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {loading ? (
              <>
                <div className="lg:col-span-2">
                  <TableSkeleton rows={4} cols={6} />
                </div>
                <ActivitySkeleton />
              </>
            ) : (
              <>
                <div className="lg:col-span-2 clay-card overflow-hidden">
                  <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Recent Invoices</h3>
                    <button onClick={() => setSearchParams({ tab: "my-bills" })} className="text-xs text-[#00B4D8] font-bold hover:underline cursor-pointer">View All</button>
                  </div>
                  <div className="overflow-x-auto max-h-[260px] custom-scrollbar">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 dark:bg-slate-900 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-100 dark:border-slate-800">
                        <tr>
                          <th className="px-5 py-3.5">ID #</th>
                          <th className="px-5 py-3.5">Billing Period (Dates)</th>
                          <th className="px-5 py-3.5">Usage</th>
                          <th className="px-5 py-3.5">Amount</th>
                          <th className="px-5 py-3.5">Status</th>
                          <th className="px-5 py-3.5 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-600 dark:text-slate-300 font-medium">
                        {billsList.length > 0 ? (
                          billsList.map((bill: any, idx: number) => (
                            <tr key={bill.billNo || idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                              <td className="px-5 py-3.5 font-bold text-[#0F4C81] dark:text-[#00B4D8]">ID: {idx + 1}</td>
                              <td className="px-5 py-3.5 text-slate-500 dark:text-slate-400 font-mono text-[11px]">{formatCycleDates(bill)}</td>
                              <td className="px-5 py-3.5 font-semibold">{bill.usage}</td>
                              <td className="px-5 py-3.5 font-bold text-slate-800 dark:text-slate-200">₹{bill.amount}</td>
                              <td className="px-5 py-3.5">
                                <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wider ${
                                  bill.status === "PAID" 
                                    ? "bg-emerald-50 text-emerald-600 border border-emerald-100 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/50" 
                                    : "bg-amber-50 text-amber-600 border border-amber-100 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/50"
                                }`}>
                                  {bill.status}
                                </span>
                              </td>
                              <td className="px-5 py-3.5 text-right">
                                <div className="flex items-center justify-end gap-2">
                                  <button
                                    onClick={() => setBreakdownBill(bill)}
                                    className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-[#0F4C81] dark:text-[#00B4D8] font-bold rounded-lg transition-all inline-flex items-center gap-1 cursor-pointer text-[10px]"
                                    title="View Billing Structure Breakdown"
                                  >
                                    <Info className="h-3 w-3" /> View Structure
                                  </button>

                                  {bill.status === "PAID" ? (
                                    <button 
                                      onClick={() => handleDownloadInvoicePdf(bill.id || parseInt(bill.billNo.replace("INV-", "")))}
                                      className="px-2.5 py-1 bg-[#00B4D8] text-white font-bold tracking-wide rounded-lg transition-all inline-flex items-center gap-1 cursor-pointer text-[10px] shadow-xs"
                                    >
                                      <Download className="h-3 w-3" /> PDF Invoice
                                    </button>
                                  ) : (
                                    <button 
                                      onClick={() => handleStartPayment(bill.id || parseInt(bill.billNo.replace("INV-", "")))}
                                      className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg transition-all inline-flex items-center gap-1 cursor-pointer text-[10px] shadow-xs"
                                    >
                                      <CreditCard className="h-3 w-3" /> Pay Now
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={6} className="px-5 py-8 text-center text-slate-400 dark:text-slate-500">No billing history found.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Notifications Panel */}
                <div className="clay-card p-5 space-y-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                    <Bell className="h-4.5 w-4.5 text-[#00B4D8]" />
                    Recent Notifications
                  </h3>
                  <ul className="space-y-3.5 text-xs font-medium text-slate-600 dark:text-slate-300">
                    <li className="flex gap-2">
                      <span className="h-2 w-2 shrink-0 bg-[#00B4D8] rounded-full mt-1.5"></span>
                      <div className="text-left">
                        <p className="text-slate-800 dark:text-slate-200 font-bold">New Bill Released</p>
                        <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">Your monthly consumption invoice is ready.</p>
                      </div>
                    </li>
                    <li className="flex gap-2">
                      <span className="h-2 w-2 shrink-0 bg-[#FFB703] rounded-full mt-1.5"></span>
                      <div className="text-left">
                        <p className="text-slate-800 dark:text-slate-200 font-bold">Maintenance Notice</p>
                        <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">Water storage cleaning on 18 Jul (10 PM to 4 AM).</p>
                      </div>
                    </li>
                  </ul>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* SUB-PAGES RENDERING */}
      {currentTab === "my-usage" && (
        <div className="border border-slate-100 rounded-3xl bg-white p-6 space-y-6 shadow-sm text-[#1F2937] animate-fade-in">
          <div className="flex justify-between items-center border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-lg font-bold text-[#0F4C81]">Detailed Water Consumption Log</h3>
              <p className="text-xs text-slate-500">View and analyze your apartment's daily consumption metrics</p>
            </div>
            <button onClick={() => setSearchParams({})} className="text-xs font-bold text-[#00B4D8] hover:underline cursor-pointer">Back to Dashboard</button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-100">
              <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Today's Flow Log</p>
              <h4 className="text-3xl font-extrabold text-slate-800 mt-1">{todayUsage} Litres</h4>
              <p className="text-[10px] text-slate-400 mt-1">Logged on {stats?.latestReadingDate}</p>
            </div>
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-100">
              <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Monthly Accumulated Usage</p>
              <h4 className="text-3xl font-extrabold text-slate-800 mt-1">{thisMonthUsage} Litres</h4>
              <p className="text-[10px] text-slate-400 mt-1">Cycle limit: 15,000 L</p>
            </div>
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-100">
              <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Leak Guard Status</p>
              <h4 className={`text-2xl font-extrabold mt-1 ${leakStatus === "Safe" ? "text-[#2ECC71]" : "text-rose-500 animate-pulse"}`}>{leakStatus}</h4>
              <p className="text-[10px] text-slate-400 mt-1 font-semibold">{leakMessage}</p>
            </div>
          </div>

          <div className="border border-slate-100 rounded-2xl bg-white p-5 shadow-xs">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-4">Water Usage Chart</h4>
            <div className="h-[280px] w-full">
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                    <defs>
                      <linearGradient id="usagePageGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#00B4D8" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#00B4D8" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="name" stroke="#94a3b8" />
                    <YAxis stroke="#94a3b8" />
                    <Tooltip contentStyle={TOOLTIP_STYLE} />
                    <Area type="monotone" dataKey="usage" stroke="#00B4D8" strokeWidth={2.5} fillOpacity={1} fill="url(#usagePageGrad)" name="Usage (L)" />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-slate-400 text-sm">No usage data logged yet.</div>
              )}
            </div>
          </div>
        </div>
      )}

      {currentTab === "my-bills" && (
        <div className="border border-slate-100 rounded-3xl bg-white p-6 space-y-6 shadow-sm text-[#1F2937] animate-fade-in">
          <div className="flex justify-between items-center border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-lg font-bold text-[#0F4C81]">Billing & Invoices</h3>
              <p className="text-xs text-slate-500">View bills and complete payments securely online</p>
            </div>
            <button onClick={() => setSearchParams({})} className="text-xs font-bold text-[#00B4D8] hover:underline cursor-pointer">Back to Dashboard</button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-100">
              <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Current Outstanding Bill</p>
              <h4 className="text-3xl font-extrabold text-slate-800 mt-1">₹{totalOutstanding}</h4>
              <p className="text-[10px] text-slate-400 mt-1">{currentBillStatus === "UNPAID" ? `Due by ${currentBillDueDate}` : "All bills paid!"}</p>
            </div>
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-100">
              <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Total Amount Paid</p>
              <h4 className="text-3xl font-extrabold text-[#2ECC71] mt-1">₹{totalSpent}</h4>
              <p className="text-[10px] text-slate-400 mt-1 font-semibold">Lifetime total spent</p>
            </div>
            {totalOutstanding > 0 && stats?.currentBillId && (
              <button onClick={() => handleStartPayment(stats.currentBillId)} className="h-full w-full bg-gradient-to-r from-[#2ECC71] to-[#27ae60] hover:from-emerald-400 hover:to-emerald-600 text-white font-bold rounded-2xl text-sm flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer">
                Pay Current Bill Online
              </button>
            )}
          </div>

          <div className="border border-slate-100 rounded-2xl bg-white shadow-xs overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">Bill History Table</h4>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-bold uppercase border-b border-slate-100">
                  <tr>
                    <th className="px-5 py-3.5">ID #</th>
                    <th className="px-5 py-3.5">Billing Period (Dates)</th>
                    <th className="px-5 py-3.5">Total Flow (Litres)</th>
                    <th className="px-5 py-3.5">Amount</th>
                    <th className="px-5 py-3.5">Status</th>
                    <th className="px-5 py-3.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-600 font-medium">
                  {billsList.length > 0 ? (
                    billsList.map((bill: any, idx: number) => (
                      <tr key={bill.billNo || idx} className="hover:bg-slate-50/50">
                        <td className="px-5 py-3.5 font-bold text-[#0F4C81]">ID: {idx + 1}</td>
                        <td className="px-5 py-3.5 text-slate-500 font-mono text-[11px]">{formatCycleDates(bill)}</td>
                        <td className="px-5 py-3.5 font-semibold">{bill.usage}</td>
                        <td className="px-5 py-3.5 font-bold text-slate-800">₹{bill.amount}</td>
                        <td className="px-5 py-3.5">
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wider ${
                            bill.status === "PAID" 
                              ? "bg-emerald-50 text-emerald-600 border border-emerald-100" 
                              : "bg-amber-50 text-amber-600 border border-amber-100"
                          }`}>
                            {bill.status}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => setBreakdownBill(bill)}
                              className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-[#0F4C81] font-bold rounded-lg transition-all inline-flex items-center gap-1 cursor-pointer text-[10px]"
                              title="View Billing Structure Breakdown"
                            >
                              <Info className="h-3 w-3" /> View Structure
                            </button>

                            {bill.status === "PAID" ? (
                              <button 
                                onClick={() => handleDownloadInvoicePdf(bill.id || parseInt(bill.billNo.replace(/\D/g, "")))}
                                className="px-2.5 py-1 bg-[#00B4D8] text-white font-bold tracking-wide rounded-lg transition-all inline-flex items-center gap-1 cursor-pointer text-[10px] shadow-xs"
                              >
                                <Download className="h-3 w-3" /> PDF Invoice
                              </button>
                            ) : (
                              <button 
                                onClick={() => handleStartPayment(bill.id || parseInt(bill.billNo.replace(/\D/g, "")))}
                                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg transition-all inline-flex items-center gap-1 cursor-pointer text-[10px] shadow-xs"
                              >
                                <CreditCard className="h-3 w-3" /> Pay Now
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="px-5 py-8 text-center text-slate-400">No billing history found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {currentTab === "water-tips" && (
        <div className="border border-slate-100 rounded-3xl bg-white p-6 space-y-6 shadow-sm text-[#1F2937] animate-fade-in">
          <div className="flex justify-between items-center border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-lg font-bold text-[#0F4C81]">Smart Water Conservation Tips</h3>
              <p className="text-xs text-slate-500">AI generated conservation methods based on usage patterns</p>
            </div>
            <button onClick={() => setSearchParams({})} className="text-xs font-bold text-[#00B4D8] hover:underline cursor-pointer">Back to Dashboard</button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
              <h4 className="font-bold text-[#0F4C81] flex items-center gap-1.5"><Lightbulb className="h-4.5 w-4.5 text-[#00B4D8]" /> Optimize Shower Timing</h4>
              <p className="text-xs text-slate-500 leading-relaxed font-semibold">Reducing your shower duration by 2 minutes can save up to 15-20 Litres of water per shower. Use a timer to stay track.</p>
            </div>
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
              <h4 className="font-bold text-[#0F4C81] flex items-center gap-1.5"><Shield className="h-4.5 w-4.5 text-[#2ECC71]" /> Check Faucets for Leakage</h4>
              <p className="text-xs text-slate-500 leading-relaxed font-semibold">A dripping faucet can waste more than 10-15 Litres of water daily. Ensure all taps are tightly closed and replace worn washers.</p>
            </div>
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
              <h4 className="font-bold text-[#0F4C81] flex items-center gap-1.5"><Info className="h-4.5 w-4.5 text-[#00B4D8]" /> Full Load Washing</h4>
              <p className="text-xs text-slate-500 leading-relaxed font-semibold">Run washing machines and dishwashers only when fully loaded. This saves up to 50 Litres of water per load cycle.</p>
            </div>
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
              <h4 className="font-bold text-[#0F4C81] flex items-center gap-1.5"><Droplet className="h-4.5 w-4.5 text-[#00B4D8]" /> Smart Cleaning</h4>
              <p className="text-xs text-slate-500 leading-relaxed font-semibold">Use a bucket to wash cars or sweep driveways instead of running direct hose connections, preventing hundreds of litres from washing away.</p>
            </div>
          </div>
        </div>
      )}

      {/* 13. Interactive Calendar Tab (Disabled) */}
      {false && (
        <div className="space-y-6 animate-fade-in text-[#1F2937]">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white border border-slate-100 rounded-3xl p-6 shadow-sm">
            <div>
              <h2 className="text-xl font-extrabold tracking-tight text-[#0F4C81]">My Utility Calendar</h2>
              <p className="text-xs text-slate-500 font-medium mt-1">Track reading log reminders, billing deadlines, payment due dates, and community alerts</p>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl p-1 text-xs">
                <button
                  onClick={() => setCalendarViewMode("month")}
                  className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                    calendarViewMode === "month" ? "bg-gradient-to-r from-[#00B4D8] to-[#0F4C81] text-white shadow-xs" : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  Month
                </button>
                <button
                  onClick={() => setCalendarViewMode("week")}
                  className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                    calendarViewMode === "week" ? "bg-gradient-to-r from-[#00B4D8] to-[#0F4C81] text-white shadow-xs" : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  Week
                </button>
                <button
                  onClick={() => setCalendarViewMode("day")}
                  className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                    calendarViewMode === "day" ? "bg-gradient-to-r from-[#00B4D8] to-[#0F4C81] text-white shadow-xs" : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  Timeline
                </button>
              </div>

              <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold">
                <button
                  onClick={() => {
                    const prev = new Date(calendarDate);
                    prev.setMonth(prev.getMonth() - 1);
                    setCalendarDate(prev);
                  }}
                  className="text-slate-400 hover:text-slate-700 transition-all font-black text-sm"
                >
                  &larr;
                </button>
                <span className="text-xs font-black min-w-28 text-center uppercase tracking-wider text-slate-700">
                  {calendarDate.toLocaleString([], { month: "long", year: "numeric" })}
                </span>
                <button
                  onClick={() => {
                    const next = new Date(calendarDate);
                    next.setMonth(next.getMonth() + 1);
                    setCalendarDate(next);
                  }}
                  className="text-slate-400 hover:text-slate-700 transition-all font-black text-sm"
                >
                  &rarr;
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Calendar Main Grid / List */}
            <div className="lg:col-span-2 border border-slate-100 rounded-3xl bg-white p-6 shadow-sm">
              {calendarViewMode === "month" && (
                <div className="space-y-4">
                  {/* Days label */}
                  <div className="grid grid-cols-7 gap-2 text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">
                    <div>Sun</div>
                    <div>Mon</div>
                    <div>Tue</div>
                    <div>Wed</div>
                    <div>Thu</div>
                    <div>Fri</div>
                    <div>Sat</div>
                  </div>

                  {/* Calendar cells */}
                  <div className="grid grid-cols-7 gap-2">
                    {(() => {
                      const daysInMonth = new Date(calendarDate.getFullYear(), calendarDate.getMonth() + 1, 0).getDate();
                      const firstDay = new Date(calendarDate.getFullYear(), calendarDate.getMonth(), 1).getDay();
                      const cells = [];

                      for (let i = 0; i < firstDay; i++) {
                        cells.push(<div key={`blank-${i}`} className="aspect-square bg-slate-50/50 border border-slate-100 rounded-xl opacity-30"></div>);
                      }

                      for (let d = 1; d <= daysInMonth; d++) {
                        const dStr = String(d).padStart(2, "0");
                        const yStr = calendarDate.getFullYear();
                        const mStr = String(calendarDate.getMonth() + 1).padStart(2, "0");
                        const fullDateStr = `${yStr}-${mStr}-${dStr}`;

                        const dayEvents = calendarEvents.filter((e: any) => e.eventDate === fullDateStr);
                        const hasUpload = dayEvents.some((e: any) => e.eventType === "UPLOAD_JOB");
                        const hasBillGen = dayEvents.some((e: any) => e.eventType === "BILL_GEN");
                        const hasReminder = dayEvents.some((e: any) => e.eventType === "REMINDER");

                        const isSelected = selectedDayNum === d;

                        let highlightClass = "border-slate-100 hover:border-slate-200 hover:bg-slate-50";
                        if (hasUpload && hasBillGen) {
                          highlightClass = "border-[#2ECC71]/30 bg-[#2ECC71]/5 hover:bg-[#2ECC71]/10 text-[#2ECC71]";
                        } else if (hasUpload) {
                          highlightClass = "border-teal-100 bg-teal-50/50 hover:bg-teal-50 text-teal-600";
                        } else if (hasBillGen) {
                          highlightClass = "border-cyan-100 bg-cyan-50/50 hover:bg-cyan-50 text-[#00B4D8]";
                        } else if (hasReminder) {
                          highlightClass = "border-purple-100 bg-purple-50/50 hover:bg-purple-50 text-purple-600";
                        }

                        cells.push(
                          <button
                            key={`day-${d}`}
                            onClick={() => {
                              setSelectedDayNum(d);
                              setSelectedDateEvents(dayEvents);
                            }}
                            className={`aspect-square border rounded-xl p-2 transition-all flex flex-col justify-between items-start text-left cursor-pointer ${highlightClass} ${
                              isSelected ? "ring-2 ring-[#00B4D8] border-[#00B4D8]" : ""
                            }`}
                          >
                            <span className="text-xs font-bold text-slate-800">{d}</span>
                            <div className="flex gap-1 mt-auto">
                              {hasUpload && <span className="h-1.5 w-1.5 rounded-full bg-teal-500"></span>}
                              {hasBillGen && <span className="h-1.5 w-1.5 rounded-full bg-[#00B4D8]"></span>}
                              {hasReminder && <span className="h-1.5 w-1.5 rounded-full bg-purple-500"></span>}
                            </div>
                          </button>
                        );
                      }

                      return cells;
                    })()}
                  </div>
                </div>
              )}

              {calendarViewMode === "week" && (
                <div className="space-y-4">
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Weekly Event Flow</p>
                  <div className="space-y-3">
                    {(() => {
                      const weekDays = [];
                      for (let i = 0; i < 7; i++) {
                        const dayDate = new Date(calendarDate);
                        dayDate.setDate(dayDate.getDate() - dayDate.getDay() + i);

                        const dStr = String(dayDate.getDate()).padStart(2, "0");
                        const yStr = dayDate.getFullYear();
                        const mStr = String(dayDate.getMonth() + 1).padStart(2, "0");
                        const fullDateStr = `${yStr}-${mStr}-${dStr}`;

                        const dayEvents = calendarEvents.filter((e: any) => e.eventDate === fullDateStr);

                        weekDays.push(
                          <div key={`week-day-${i}`} className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between gap-4">
                            <div className="w-20">
                              <p className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">
                                {dayDate.toLocaleDateString([], { weekday: "short" })}
                              </p>
                              <p className="text-base font-black text-slate-800">{dayDate.getDate()}</p>
                            </div>
                            <div className="flex-1 space-y-1.5">
                              {dayEvents.length === 0 ? (
                                <p className="text-xs text-slate-400 italic">No events scheduled</p>
                              ) : (
                                dayEvents.map((e: any) => (
                                  <div key={e.id} className="text-xs flex items-center justify-between bg-white px-3 py-1.5 rounded-xl border border-slate-100 shadow-xs font-semibold">
                                    <span className="font-bold text-[#0F4C81]">{e.title}</span>
                                    <span className="text-[10px] text-slate-500 truncate max-w-40">{e.description}</span>
                                  </div>
                                ))
                              )}
                            </div>
                          </div>
                        );
                      }
                      return weekDays;
                    })()}
                  </div>
                </div>
              )}

              {calendarViewMode === "day" && (
                <div className="space-y-4">
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Daily Schedule Timeline</p>
                  <div className="divide-y divide-slate-100 font-medium">
                    {calendarEvents.length === 0 ? (
                      <div className="p-8 text-center text-xs text-slate-400">No events found in this month.</div>
                    ) : (
                      calendarEvents.map((e: any) => (
                        <div key={e.id} className="py-4 flex flex-col md:flex-row justify-between gap-2">
                          <div>
                            <p className="text-xs font-bold text-slate-800">{e.title}</p>
                            <p className="text-[11px] text-slate-500 mt-0.5">{e.description}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-[10px] text-[#00B4D8] font-mono font-bold uppercase">{e.eventType}</p>
                            <p className="text-[9px] text-slate-400 mt-0.5">{e.eventDate}</p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar Event detail Card */}
            <div className="border border-slate-100 rounded-3xl bg-white p-6 space-y-4 shadow-sm h-fit">
              <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
                <h3 className="font-bold text-sm text-[#0F4C81]">Event Inspector</h3>
                {selectedDayNum && (
                  <span className="text-[10px] bg-cyan-50 text-[#00B4D8] border border-cyan-100 font-bold px-2 py-0.5 rounded-full">
                    Day {selectedDayNum}
                  </span>
                )}
              </div>

              {selectedDateEvents.length === 0 ? (
                <div className="text-center py-10 text-slate-400 text-xs flex flex-col items-center gap-3">
                  <Calendar className="h-10 w-10 text-[#00B4D8] animate-pulse" />
                  Select a highlighted day on the monthly grid to inspect scheduled items.
                </div>
              ) : (
                <div className="space-y-4">
                  {selectedDateEvents.map((e: any) => (
                    <div key={e.id} className={`p-4 rounded-2xl border ${
                      e.eventType === 'UPLOAD_JOB' ? 'bg-teal-50/50 border-teal-100 text-teal-700' :
                      e.eventType === 'BILL_GEN' ? 'bg-cyan-50/50 border-cyan-100 text-[#00B4D8]' :
                      'bg-purple-50/50 border-purple-100 text-purple-700'
                    } space-y-1.5 shadow-xs`}>
                      <p className="text-[9px] font-extrabold uppercase tracking-wider">{e.eventType}</p>
                      <h4 className="text-sm font-bold text-slate-800">{e.title}</h4>
                      <p className="text-xs text-slate-500 leading-relaxed font-semibold">{e.description}</p>
                      <div className="pt-2 border-t border-slate-100/50 text-[9px] text-slate-400">
                        Date: {e.eventDate}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Cycle reminder schedule static list */}
              <div className="mt-4 bg-slate-50 border border-slate-100 rounded-2xl p-4 space-y-3">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">My Cycle Dates</p>
                <div className="space-y-2 text-xs font-semibold">
                  <div className="flex justify-between items-center bg-white border border-slate-100 px-3 py-1.5 rounded-xl shadow-xs">
                    <span className="text-slate-500">Reading Logged Window</span>
                    <span className="font-bold text-[#00B4D8]">1st - 5th</span>
                  </div>
                  <div className="flex justify-between items-center bg-white border border-slate-100 px-3 py-1.5 rounded-xl shadow-xs">
                    <span className="text-slate-500">Invoice Generated</span>
                    <span className="font-bold text-[#2ECC71]">6th - 10th</span>
                  </div>
                  <div className="flex justify-between items-center bg-white border border-slate-100 px-3 py-1.5 rounded-xl shadow-xs">
                    <span className="text-slate-500">Payment Due Deadline</span>
                    <span className="font-bold text-rose-500">20th - 25th</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* REPORTS TAB */}
      {/* ═══════════════════════════════════════════════════════════ */}
      {currentTab === "reports" && me?.communityId && (
        <div className="space-y-6 animate-fade-in text-[#1F2937]">
          <ReportsPage />
        </div>
      )}

      {currentTab === "visualizations" && me?.communityId && (
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="space-y-6 text-[#1F2937] dot-grid-bg"
        >
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0 }}
            className="flex justify-between items-center"
          >
            <div>
              <h2 className="text-2xl font-extrabold gradient-text-animated">
                My Water Analytics Hub
              </h2>
              <p className="text-xs text-slate-500 mt-1">Real-time water index metrics and personal usage trends</p>
            </div>
            <button onClick={() => setSearchParams({})} className="text-xs font-bold text-[#00B4D8] hover:underline cursor-pointer">Back to Dashboard</button>
          </motion.div>

          {/* Animated KPI Cards */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="grid grid-cols-1 md:grid-cols-4 gap-4"
          >
            <div className="clay-card p-5 glow-border space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">This Month Usage</span>
              <h4 className="text-2xl font-extrabold text-[#00B4D8]"><AnimatedCounter value={thisMonthUsage} suffix=" L" /></h4>
              <span className="block text-[10px] text-slate-400">Total volume logged this cycle</span>
            </div>
            <div className="clay-card p-5 glow-border space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Today's Consumption</span>
              <h4 className="text-2xl font-extrabold text-[#2ECC71]"><AnimatedCounter value={todayUsage} suffix=" L" /></h4>
              <span className="block text-[10px] text-slate-400">Usage logged in last 24h</span>
            </div>
            <div className="clay-card p-5 glow-border space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Average Daily Flow</span>
              <h4 className="text-2xl font-extrabold text-[#0F4C81]"><AnimatedCounter value={avgDailyUsage} suffix=" L" /></h4>
              <span className="block text-[10px] text-slate-400">Calculated average usage</span>
            </div>
            <div className="clay-card p-5 glow-border space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Outstanding Balance</span>
              <h4 className="text-2xl font-extrabold text-amber-500">₹<AnimatedCounter value={totalOutstanding} /></h4>
              <span className="block text-[10px] text-slate-400">Unpaid invoice dues</span>
            </div>
          </motion.div>

          {/* Chart 1: Monthly Consumption Trend AreaChart */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="chart-container p-5"
          >
            <h3 className="text-xs font-bold tracking-wide uppercase text-slate-500 mb-4">Monthly consumption history</h3>
            <div className="h-[280px] w-full">
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="vizConsGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#00B4D8" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#00B4D8" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} tickLine={false} />
                    <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} />
                    <Tooltip contentStyle={TOOLTIP_STYLE} />
                    <Area type="monotone" dataKey="usage" stroke="#00B4D8" strokeWidth={2.5} fillOpacity={1} fill="url(#vizConsGrad)" name="Consumption (L)" />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-slate-400 text-xs">No consumption data available.</div>
              )}
            </div>
          </motion.div>

          {/* Chart 2 & 3 Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Chart 2: Weekly Usage */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="chart-container p-5"
            >
              <h3 className="text-xs font-bold tracking-wide uppercase text-slate-500 mb-4">Weekly Consumption Trend</h3>
              <div className="h-[260px] w-full">
                {weeklyData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={weeklyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                      <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} tickLine={false} />
                      <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} />
                      <Tooltip contentStyle={TOOLTIP_STYLE} />
                      <Bar dataKey="usage" fill="#0F4C81" radius={[4, 4, 0, 0]} name="Consumption (L)" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-slate-400 text-xs">No weekly logs available.</div>
                )}
              </div>
            </motion.div>

            {/* Chart 3: Usage vs Community Average */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="chart-container p-5"
            >
              <h3 className="text-xs font-bold tracking-wide uppercase text-slate-500 mb-4">My Usage vs Community Average</h3>
              <div className="h-[260px] w-full">
                {comparisonChart && comparisonChart.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={comparisonChart} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                      <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} tickLine={false} />
                      <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} />
                      <Tooltip contentStyle={TOOLTIP_STYLE} />
                      <Bar dataKey="myUsage" fill="#00B4D8" radius={[4, 4, 0, 0]} name="My Usage (L)" />
                      <Bar dataKey="averageUsage" fill="#FFB703" radius={[4, 4, 0, 0]} name="Community Average (L)" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-slate-400 text-xs">No comparison data available.</div>
                )}
              </div>
            </motion.div>
          </div>
        </motion.div>
      )}

      {currentTab === "usage-history" && (
        <div className="border border-slate-100 rounded-3xl bg-white p-6 space-y-6 shadow-sm text-[#1F2937] animate-fade-in">
          <div className="flex justify-between items-center border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-lg font-bold text-[#0F4C81]">Consumption History Log</h3>
              <p className="text-xs text-slate-500">Filter and view all logged water readings</p>
            </div>
            <button onClick={() => setSearchParams({})} className="text-xs font-bold text-[#00B4D8] hover:underline cursor-pointer">Back to Dashboard</button>
          </div>

          {/* Filters Bar */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-2xl items-end text-xs font-bold">
            <div className="space-y-1">
              <span className="text-slate-500 uppercase tracking-wider text-[10px]">Start Date</span>
              <input
                type="date"
                value={historyStartDate}
                onChange={(e) => setHistoryStartDate(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-700 focus:outline-none focus:border-[#00B4D8] font-semibold text-[11px]"
              />
            </div>
            <div className="space-y-1">
              <span className="text-slate-500 uppercase tracking-wider text-[10px]">End Date</span>
              <input
                type="date"
                value={historyEndDate}
                onChange={(e) => setHistoryEndDate(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-700 focus:outline-none focus:border-[#00B4D8] font-semibold text-[11px]"
              />
            </div>
            <div className="flex gap-2">
              <button
                disabled={loadingHistory}
                onClick={() => { setHistoryPage(0); fetchReadingsHistory(); }}
                className="flex-1 bg-gradient-to-r from-[#00B4D8] to-[#0F4C81] hover:from-[#0096B4] hover:to-[#0A3860] text-white font-extrabold px-4 py-2.5 rounded-xl transition-all shadow-md cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50 text-xs"
              >
                {loadingHistory ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                Fetch Usage Data
              </button>
              <button
                onClick={() => { setHistoryStartDate(''); setHistoryEndDate(''); setHistoryPage(0); fetchReadingsHistory(); }}
                className="bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold px-4 py-2.5 rounded-xl transition-all cursor-pointer text-xs"
              >
                Reset
              </button>
            </div>
          </div>

          {/* Usage Metrics Summary & Trend Graph */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="clay-card p-5 border border-slate-100 bg-gradient-to-br from-[#0F4C81] to-[#0B3A63] text-white rounded-2xl flex flex-col justify-between">
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#00B4D8]">Selected Range Usage</span>
              <h4 className="text-3xl font-extrabold mt-2">
                <AnimatedCounter value={historyReadings.reduce((acc, r) => acc + (r.usageLitres || 0), 0)} /> L
              </h4>
              <p className="text-[10px] text-slate-300 mt-2 font-medium">Cumulative water volume logged in chosen date range</p>
            </div>

            <div className="clay-card p-5 border border-slate-100 bg-white rounded-2xl flex flex-col justify-between shadow-xs">
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Average Daily Consumption</span>
              <h4 className="text-3xl font-extrabold text-[#00B4D8] mt-2">
                {(historyReadings.length > 0 
                  ? (historyReadings.reduce((acc, r) => acc + (r.usageLitres || 0), 0) / Math.max(1, historyReadings.length)).toFixed(1) 
                  : "0")} L/day
              </h4>
              <p className="text-[10px] text-slate-400 mt-2 font-medium">Mean daily usage rate over logged entries</p>
            </div>

            <div className="clay-card p-5 border border-slate-100 bg-white rounded-2xl flex flex-col justify-between shadow-xs">
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Logged Reading Entries</span>
              <h4 className="text-3xl font-extrabold text-[#2ECC71] mt-2">
                <AnimatedCounter value={historyReadings.length} />
              </h4>
              <p className="text-[10px] text-slate-400 mt-2 font-medium">Total verified meter readings recorded</p>
            </div>
          </div>

          {/* Daily Consumption Trend Chart */}
          <div className="border border-slate-100 rounded-2xl bg-white p-5 shadow-xs space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
              <Droplet className="h-4 w-4 text-[#00B4D8]" /> Daily Usage Consumption Trend Graph
            </h4>
            <div className="h-[200px] w-full">
              {historyReadings.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={[...historyReadings].reverse().map(r => ({
                    date: new Date(r.readingDate).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
                    usage: r.usageLitres || 0
                  }))} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorHist" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#00B4D8" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#00B4D8" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis dataKey="date" stroke="#94a3b8" fontSize={10} tickLine={false} />
                    <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} />
                    <Tooltip contentStyle={TOOLTIP_STYLE} />
                    <Area type="monotone" dataKey="usage" stroke="#00B4D8" strokeWidth={2.5} fillOpacity={1} fill="url(#colorHist)" name="Consumption (L)" />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-slate-400 text-xs font-bold">
                  No consumption data points available for chart rendering.
                </div>
              )}
            </div>
          </div>

          {/* Readings Table */}
          <div className="border border-slate-100 rounded-2xl bg-white shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-bold uppercase border-b border-slate-100">
                  <tr>
                    <th className="px-5 py-3.5">Reading Date</th>
                    <th className="px-5 py-3.5">Previous Reading (L)</th>
                    <th className="px-5 py-3.5">Current Reading (L)</th>
                    <th className="px-5 py-3.5">Net Usage (Litres)</th>
                    <th className="px-5 py-3.5">Status</th>
                    <th className="px-5 py-3.5">Source</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-600 font-medium">
                  {loadingHistory ? (
                    <tr>
                      <td colSpan={6} className="px-5 py-10 text-center"><Loader2 className="h-5 w-5 animate-spin mx-auto text-[#00B4D8]" /></td>
                    </tr>
                  ) : historyReadings.length > 0 ? (
                    historyReadings.map((r: any) => (
                      <tr key={r.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-5 py-3.5 font-bold">{new Date(r.readingDate).toLocaleDateString()}</td>
                        <td className="px-5 py-3.5">{r.previousReading} L</td>
                        <td className="px-5 py-3.5 font-semibold text-slate-800">{r.currentReading} L</td>
                        <td className="px-5 py-3.5 font-extrabold text-[#00B4D8]">{r.usageLitres} L</td>
                        <td className="px-5 py-3.5">
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                            r.isAnomaly ? "bg-rose-50 text-rose-500 border border-rose-100" : "bg-emerald-50 text-[#2ECC71] border border-emerald-100"
                          }`}>
                            {r.isAnomaly ? "Anomaly Alert" : "Normal"}
                          </span>
                        </td>
                        <td className="px-5 py-3.5">
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                            r.notes && r.notes.includes(".csv") ? "bg-cyan-50 text-[#00B4D8]" : "bg-purple-50 text-purple-500"
                          }`}>
                            {r.notes && r.notes.includes(".csv") ? "CSV Import" : "Manual Log"}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="px-5 py-8 text-center text-slate-400">No readings found for the selected criteria.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {historyTotal > 10 && (
              <div className="px-5 py-4 border-t border-slate-100 bg-slate-50/50 flex justify-between items-center text-xxs font-extrabold text-slate-500 uppercase tracking-wider">
                <span>Showing {historyPage * 10 + 1}-{Math.min((historyPage + 1) * 10, historyTotal)} of {historyTotal} records</span>
                <div className="flex gap-2">
                  <button
                    disabled={historyPage === 0}
                    onClick={() => setHistoryPage(p => p - 1)}
                    className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 cursor-pointer"
                  >
                    Previous
                  </button>
                  <button
                    disabled={(historyPage + 1) * 10 >= historyTotal}
                    onClick={() => setHistoryPage(p => p + 1)}
                    className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 cursor-pointer"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {currentTab === "my-invoices" && (
        <div className="border border-slate-100 rounded-3xl bg-white p-6 space-y-6 shadow-sm text-[#1F2937] animate-fade-in">
          <div className="flex justify-between items-center border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-lg font-bold text-[#0F4C81]">Invoices Directory</h3>
              <p className="text-xs text-slate-500">Overview of all generated consumption invoices</p>
            </div>
            <button onClick={() => setSearchParams({})} className="text-xs font-bold text-[#00B4D8] hover:underline cursor-pointer">Back to Dashboard</button>
          </div>
          <div className="border border-slate-100 rounded-2xl bg-white shadow-xs overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">Invoices List</h4>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-bold uppercase border-b border-slate-100">
                  <tr>
                    <th className="px-5 py-3.5">Invoice ID</th>
                    <th className="px-5 py-3.5">Billing Cycle</th>
                    <th className="px-5 py-3.5">Total Flow (Litres)</th>
                    <th className="px-5 py-3.5">Amount</th>
                    <th className="px-5 py-3.5">Status</th>
                    <th className="px-5 py-3.5 text-right">Download</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-600 font-medium">
                  {billsList.map((bill: any) => (
                    <tr key={bill.billNo} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-5 py-3.5 font-bold text-[#0F4C81]">{bill.billNo}</td>
                      <td className="px-5 py-3.5 text-slate-500">{bill.month}</td>
                      <td className="px-5 py-3.5">{bill.usage}</td>
                      <td className="px-5 py-3.5 font-bold text-slate-800">₹{bill.amount}</td>
                      <td className="px-5 py-3.5">
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wider ${
                          bill.status === "PAID" ? "bg-emerald-50 text-emerald-600 border border-emerald-100" : "bg-amber-50 text-amber-600 border-amber-100"
                        }`}>
                          {bill.status}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {bill.status !== "PAID" && (
                            <button 
                              onClick={() => handleStartPayment(parseInt(bill.billNo.replace("INV-", "")))}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg transition-all inline-flex items-center gap-1 cursor-pointer text-[10px] shadow-sm active:scale-95"
                            >
                              <CreditCard className="h-3 w-3" /> Pay Now
                            </button>
                          )}
                          <button 
                            onClick={() => handleDownloadInvoicePdf(parseInt(bill.billNo.replace("INV-", "")))}
                            className="px-2 py-1 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-[#00B4D8] font-bold tracking-wide transition-all inline-flex items-center gap-1 cursor-pointer text-[10px]"
                          >
                            <Download className="h-3 w-3" /> PDF
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {currentTab === "notifications" && (
        <NotificationCenter />
      )}

      {currentTab === "alerts" && (
        <NotificationCenter />
      )}

      {currentTab === "announcements" && (
        <AnnouncementCenter />
      )}

      {currentTab === "profile" && (
        <div className="border border-slate-100 rounded-3xl bg-white p-6 space-y-6 shadow-sm max-w-xl mx-auto text-[#1F2937] animate-fade-in">
          <div className="flex justify-between items-center border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-lg font-bold text-[#0F4C81]">User Account Profile</h3>
              <p className="text-xs text-slate-500">Manage your credentials and details</p>
            </div>
            <button onClick={() => setSearchParams({})} className="text-xs font-bold text-[#00B4D8] hover:underline cursor-pointer">Back to Dashboard</button>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-4 border-b border-slate-100 pb-4">
              <div className="h-16 w-16 bg-gradient-to-br from-[#0F4C81] to-[#00B4D8] rounded-2xl flex items-center justify-center text-xl font-bold text-white shadow-md">
                {me?.fullName?.split(" ").map((n: string) => n[0]).join("").toUpperCase()}
              </div>
              <div>
                <h4 className="font-bold text-base text-slate-800">{me?.fullName}</h4>
                <p className="text-xs text-slate-400 font-medium">{me?.email}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs font-semibold">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                <p className="text-slate-400">Apartment flat</p>
                <p className="text-sm font-bold mt-1 text-slate-800">Flat {me?.flatNumber || "N/A"}</p>
              </div>
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                <p className="text-slate-400">Community Name</p>
                <p className="text-sm font-bold mt-1 text-slate-800">{me?.communityName || "No Community"}</p>
              </div>
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                <p className="text-slate-400">Joined At</p>
                <p className="text-sm font-bold mt-1 text-slate-800">{me?.createdAt ? new Date(me.createdAt).toLocaleDateString() : "N/A"}</p>
              </div>
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                <p className="text-slate-400">Role Level</p>
                <p className="text-sm font-bold mt-1 text-[#00B4D8]">{me?.role}</p>
              </div>
            </div>
          </div>
        </div>
      )}
        </>
      )}

      {/* Razorpay Mock Payment Gateway Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm rounded-3xl border border-slate-200 bg-white shadow-2xl p-6 space-y-4 animate-in fade-in zoom-in-95 duration-200 text-slate-800">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
                  <CreditCard className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900">Razorpay Payment Gateway</h3>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">HydroBS Safe Payment Checkout</p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl bg-slate-50 p-4 border border-slate-100 space-y-2 text-xs">
              <div className="flex justify-between items-center text-slate-500">
                <span>Invoice Item ID:</span>
                <span className="font-mono font-bold text-slate-700">#{payingBillId}</span>
              </div>
              <div className="flex justify-between items-center border-t border-slate-200/60 pt-2 text-slate-700">
                <span className="font-bold">Total Amount Payable:</span>
                <span className="font-extrabold text-emerald-600 text-base">
                  ₹{stats?.pendingBillsList?.find((b: any) => b.id === payingBillId)?.amount || totalOutstanding}
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-2 pt-1">
              <button
                onClick={() => handleConfirmPayment("SUCCESS")}
                disabled={processingPayment}
                className="py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl font-extrabold text-xs tracking-wide uppercase transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {processingPayment ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                <span>Pay Now (Simulate Success)</span>
              </button>
              <button
                onClick={() => handleConfirmPayment("FAILED")}
                disabled={processingPayment}
                className="py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {processingPayment ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4" />}
                <span>Simulate Payment Failure</span>
              </button>
              <button
                onClick={() => { setShowPaymentModal(false); setPayingBillId(null); }}
                disabled={processingPayment}
                className="py-1.5 text-slate-400 hover:text-slate-600 text-xs font-semibold text-center cursor-pointer"
              >
                Cancel / Return
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bill Calculation Breakdown Structure Modal (Warm Cream Theme) */}
      <AnimatePresence>
        {breakdownBill && (() => {
          const totalVol = typeof breakdownBill.totalUsageNum === "number" 
            ? breakdownBill.totalUsageNum 
            : typeof breakdownBill.totalUsage === "number"
            ? breakdownBill.totalUsage
            : (parseFloat(String(breakdownBill.totalUsageNum || breakdownBill.totalUsage || breakdownBill.usage || "0").replace(/[^0-9.]/g, "")) || 0);

          const t1Limit = parseFloat(breakdownBill.tier1LimitLitres) || 5000;
          const t1Rate = parseFloat(breakdownBill.tier1Rate) || 1.00;
          const t2Rate = parseFloat(breakdownBill.tier2Rate) || 13.00;
          const serviceChargeVal = breakdownBill.serviceCharge !== undefined && breakdownBill.serviceCharge !== null ? parseFloat(breakdownBill.serviceCharge) : 1.00;
          const taxRateVal = breakdownBill.taxRate !== undefined && breakdownBill.taxRate !== null ? parseFloat(breakdownBill.taxRate) : 6;
          const taxVal = parseFloat(breakdownBill.taxAmount) || 0.00;

          const t1Vol = Math.min(totalVol, t1Limit);
          const t2Vol = Math.max(0, totalVol - t1Limit);

          const t1Amount = t1Vol * t1Rate;
          const t2Amount = t2Vol * t2Rate;

          return (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
              onClick={() => setBreakdownBill(null)}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0, y: 10 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.95, opacity: 0, y: 10 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-[#FAF6EE] rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-[#EBE3D5] space-y-6 text-[#2D2926] relative"
              >
                <button 
                  onClick={() => setBreakdownBill(null)}
                  className="absolute top-5 right-5 h-8 w-8 rounded-full bg-[#EFE8D8] flex items-center justify-center text-[#6B5E4C] hover:text-[#2D2926] transition-colors cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>

                <div className="border-b border-[#EBE3D5] pb-4">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#EFE5CE] text-[#8C6B28] text-[10px] font-bold uppercase tracking-wider mb-2 border border-[#E2D4B5]">
                    <Info className="h-3.5 w-3.5 text-[#00B4D8]" /> Tiered Tariff Breakdown
                  </div>
                  <h3 className="text-xl font-serif font-bold text-[#0F4C81]">Billing Structure</h3>
                  <p className="text-xs text-[#7A6E5D]">Itemized rate slabs and formula calculations for this period</p>
                </div>

                <div className="bg-[#F4ECE0] rounded-2xl p-4 space-y-2 text-xs border border-[#E5DAC6]">
                  <div className="flex justify-between text-[#6B5E4C]">
                    <span>Resident Name:</span>
                    <span className="font-bold text-[#2D2926]">{me?.fullName || breakdownBill.residentName || "Resident"}</span>
                  </div>
                  <div className="flex justify-between text-[#6B5E4C]">
                    <span>Flat Number:</span>
                    <span className="font-bold text-[#2D2926]">{me?.flatNumber || breakdownBill.flatNumber || "Flat -"}</span>
                  </div>
                  <div className="flex justify-between text-[#6B5E4C]">
                    <span>Billing Period (Dates):</span>
                    <span className="font-mono font-bold text-[#0F4C81]">{formatCycleDates(breakdownBill)}</span>
                  </div>
                  <div className="flex justify-between text-[#6B5E4C]">
                    <span>Total Metered Volume:</span>
                    <span className="font-mono font-extrabold text-[#00B4D8]">{totalVol.toLocaleString()} L <span className="text-[10px] text-[#7A6E5D]">({(totalVol / 1000).toFixed(2)} kL)</span></span>
                  </div>
                </div>

                {/* Itemized Slab Breakdown Table */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#7A6E5D]">Tariff Slab Calculation Items</h4>
                  <div className="border border-[#E5DAC6] rounded-2xl overflow-hidden text-xs bg-white shadow-xs">
                    {/* Tier 1 Row */}
                    <div className="p-3 bg-[#FAF6EE] flex justify-between items-center border-b border-[#EBE3D5]">
                      <div>
                        <span className="font-bold text-[#0F4C81] block">Tier 1 Base Usage Slab</span>
                        <span className="text-[10px] text-[#7A6E5D]">First {t1Vol.toLocaleString()} L @ ₹{t1Rate.toFixed(2)}/L</span>
                      </div>
                      <span className="font-mono font-bold text-[#2D2926]">₹{t1Amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>

                    {/* Tier 2 Row (if excess usage exists) */}
                    {t2Vol > 0 && (
                      <div className="p-3 bg-[#FFFDF9] flex justify-between items-center border-b border-[#EBE3D5]">
                        <div>
                          <span className="font-bold text-purple-700 block">Tier 2 Excess Usage Slab</span>
                          <span className="text-[10px] text-purple-500">Excess {t2Vol.toLocaleString()} L @ ₹{t2Rate.toFixed(2)}/L</span>
                        </div>
                        <span className="font-mono font-bold text-purple-700">₹{t2Amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                      </div>
                    )}

                    {/* Fixed Service Charge */}
                    <div className="p-3 bg-[#FAF6EE] flex justify-between items-center border-b border-[#EBE3D5]">
                      <span className="text-[#6B5E4C]">Fixed Infrastructure Service Charge</span>
                      <span className="font-mono font-bold text-[#2D2926]">₹{serviceChargeVal.toFixed(2)}</span>
                    </div>

                    {/* Tax */}
                    <div className="p-3 bg-[#FFFDF9] flex justify-between items-center border-b border-[#EBE3D5]">
                      <span className="text-[#6B5E4C]">Government Tax & Surcharges ({taxRateVal}%)</span>
                      <span className="font-mono font-bold text-[#2D2926]">₹{taxVal.toFixed(2)}</span>
                    </div>

                    {/* Net Total */}
                    <div className="p-3.5 bg-[#F2E8D5] flex justify-between items-center font-extrabold text-sm text-[#0F4C81]">
                      <span>Net Total Bill Amount</span>
                      <span className="font-mono text-base text-[#0F4C81]">₹{parseFloat(breakdownBill.amount || (t1Amount + t2Amount + serviceChargeVal + taxVal)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                  </div>
                </div>

                <div className="flex justify-between items-center pt-2 border-t border-[#EBE3D5]">
                  <span className={`px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                    breakdownBill.status === "PAID"
                      ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                      : "bg-amber-100 text-amber-800 border border-amber-300"
                  }`}>
                    Status: {breakdownBill.status}
                  </span>

                  <div className="flex gap-2">
                    {breakdownBill.status !== "PAID" ? (
                      <button
                        onClick={() => {
                          const bId = breakdownBill.id || parseInt(breakdownBill.billNo.replace(/\D/g, ""));
                          setBreakdownBill(null);
                          handleStartPayment(bId);
                        }}
                        className="px-5 py-2.5 bg-gradient-to-r from-[#2ECC71] to-[#27ae60] hover:from-emerald-500 hover:to-emerald-700 text-white font-bold text-xs rounded-xl shadow-md hover:shadow-lg transition-all flex items-center gap-1.5 cursor-pointer"
                      >
                        <CreditCard className="h-4 w-4" /> Pay Bill Online
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          const bId = breakdownBill.id || parseInt(breakdownBill.billNo.replace(/\D/g, ""));
                          handleDownloadInvoicePdf(bId);
                        }}
                        className="px-4 py-2.5 bg-[#00B4D8] hover:bg-[#0077B6] text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
                      >
                        <Download className="h-4 w-4" /> Download Official Invoice
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            </motion.div>
          );
        })()}
      </AnimatePresence>
    </DashboardLayout>
  );
}