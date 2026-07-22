import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import DashboardLayout from "../components/DashboardLayout";
import { api } from "@/lib/axios";
import { getCommunityId } from "@/lib/auth";
import { getErrorMessage } from "../utils/error";
import { residentService } from "../services/residentService";
import {
  Users, Droplets, AlertTriangle, Check, X, Upload, Loader2,
  Receipt, ShoppingCart, Clock, AlertCircle, BarChart3, PieChart as PieIcon,
  Search, ArrowRight, TrendingUp, FileText,
  Bell, User, Download, Plus, Edit, Eye, Trash2, ArrowLeft, RefreshCw
} from "lucide-react";
import {
  ResponsiveContainer, BarChart, Bar,
  XAxis, YAxis, Tooltip, CartesianGrid, AreaChart, Area,
  PieChart, Pie, Cell
} from "recharts";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { CardSkeleton, ChartSkeleton, TableSkeleton, ActivitySkeleton } from "../components/ui/Skeletons";
import { AnimatedCounter } from "../components/ui/AnimatedCounter";
import ReportsPage from "./ReportsPage";
import ResidentDetails from "./ResidentDetails";
import CollectPaymentDialog from "../components/billing/CollectPaymentDialog";
import PaymentHistoryPanel from "../components/billing/PaymentHistoryPanel";
import MeterReadingsPage from "./MeterReadingsPage";
import BillManagementPage from "./BillManagementPage";
import BulkPurchasePage from "./BulkPurchasePage";
import AnnouncementCenter from "./AnnouncementCenter";
import AuditLogViewer from "./AuditLogViewer";
import BillingCycleManager from "./BillingCycleManager";

const COLORS = ["#00B4D8", "#0F4C81", "#2ECC71", "#FFB703", "#EC4899", "#8B5CF6"];
const TOOLTIP_STYLE = {
  backgroundColor: "#ffffff",
  borderColor: "#e2e8f0",
  borderRadius: "12px",
  color: "#1F2937",
  fontSize: "11px",
  boxShadow: "0 4px 12px rgba(15,76,129,0.08)"
};

export default function AdminDashboard() {
  const navigate = useNavigate();
  const rawCommunityId = getCommunityId();
  const myCommunityId = (rawCommunityId && rawCommunityId !== "null" && rawCommunityId !== "undefined") ? Number(rawCommunityId) : undefined;
  const [searchParams, setSearchParams] = useSearchParams();
  const currentTab = searchParams.get("tab") || "dashboard";

  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pendingRequests, setPendingRequests] = useState<any[]>([]);
  const [refreshingPending, setRefreshingPending] = useState(false);
  const [invoicesList, setInvoicesList] = useState<any[]>([]);
  const [bulkPurchasesList, setBulkPurchasesList] = useState<any[]>([]);
  const [showWaterPurchaseModal, setShowWaterPurchaseModal] = useState(false);
  const [purchaseSupplier, setPurchaseSupplier] = useState("");
  const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().split("T")[0]);
  const [purchaseVolume, setPurchaseVolume] = useState("");
  const [purchaseCost, setPurchaseCost] = useState("");
  const [purchaseNotes, setPurchaseNotes] = useState("");
  const [savingPurchase, setSavingPurchase] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const handleRefreshPendingRequests = async () => {
    setRefreshingPending(true);
    try {
      const res = await api.get("/api/communities/join-requests/pending");
      setPendingRequests(res.data || []);
      toast.success("Pending requests updated");
    } catch (err) {
      console.error("Error refreshing pending requests:", err);
    } finally {
      setRefreshingPending(false);
    }
  };

  // Resident management states
  const [resList, setResList] = useState<any[]>([]);
  const [resTotal, setResTotal] = useState(0);
  const [resPage, setResPage] = useState(0);
  const [resSearch, setResSearch] = useState("");
  const [resStatus, setResStatus] = useState("ALL");
  const [resOccupancy, setResOccupancy] = useState("ALL");
  const [resSortBy, setResSortBy] = useState("fullName");
  const [resSortDir, setResSortDir] = useState("asc");
  const [resLoading, setResLoading] = useState(false);

  // Modals
  const [showResModal, setShowResModal] = useState(false);
  const [editingRes, setEditingRes] = useState<any>(null);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [transferringRes, setTransferringRes] = useState<any>(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importResult, setImportResult] = useState<any>(null);
  const [isImporting, setIsImporting] = useState(false);

  // Form Fields
  const [resEmail, setResEmail] = useState("");
  const [resPassword, setResPassword] = useState("");
  const [resFullName, setResFullName] = useState("");
  const [resPhone, setResPhone] = useState("");
  const [resGender, setResGender] = useState("MALE");
  const [resDOB, setResDOB] = useState("");
  const [resEmergencyName, setResEmergencyName] = useState("");
  const [resEmergencyPhone, setResEmergencyPhone] = useState("");
  const [resAddress, setResAddress] = useState("");
  const [resBuilding, setResBuilding] = useState("");
  const [resBlock, setResBlock] = useState("");
  const [resFloor, setResFloor] = useState("");
  const [resFlatNumber, setResFlatNumber] = useState("");
  const [resFamilySize, setResFamilySize] = useState("1");
  const [resOccupancyType, setResOccupancyType] = useState("TENANT");
  const [resMoveInDate, setResMoveInDate] = useState("");
  const [resMeterNumber, setResMeterNumber] = useState("");
  const [resWaterBalance, setResWaterBalance] = useState("0.00");
  const [resIsActive, setResIsActive] = useState(true);

  // Transfer Fields
  const [transFlat, setTransFlat] = useState("");
  const [transBuilding, setTransBuilding] = useState("");
  const [transBlock, setTransBlock] = useState("");
  const [transFloor, setTransFloor] = useState("");

  // CSV Upload States
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<any>(null);
  const [dragOver, setDragOver] = useState(false);

  // Bill Gen States
  const [generatingBills, setGeneratingBills] = useState(false);
  const [recordPaymentBill, setRecordPaymentBill] = useState<any | null>(null);

  // Manual Reading Modal
  const [showReadingModal, setShowReadingModal] = useState(false);
  const [readingFlat, setReadingFlat] = useState("");
  const [readingDate, setReadingDate] = useState("");
  const [readingAmount, setReadingAmount] = useState("");
  const [submittingReading, setSubmittingReading] = useState(false);
  const [meterReadingsList, setMeterReadingsList] = useState<any[]>([]);

  // Billing Settings
  const [billingSettings, setBillingSettings] = useState({
    tariffRate: "5.00",
    tier1LimitLitres: "10000",
    tier1Rate: "5.00",
    tier2Rate: "8.00",
    taxRate: "18.00",
    lateFeeRate: "50.00",
    minimumMonthlyCharge: "100.00",
    fixedServiceCharge: "25.00",
    dueDateDays: "15"
  });
  const [savingSettings, setSavingSettings] = useState(false);

  const fetchDashboardData = async () => {
    try {
      const [statsRes, requestsRes, billsRes, purchasesRes, readingsRes] = await Promise.all([
        api.get("/api/dashboard/admin"),
        api.get("/api/communities/join-requests/pending"),
        api.get("/api/water/bills").catch(() => ({ data: [] })),
        api.get("/api/bulk-purchases").catch(() => ({ data: [] })),
        api.get("/api/water/readings/search?size=50").catch(() => ({ data: [] }))
      ]);
      setStats(statsRes.data);
      setPendingRequests(requestsRes.data);
      setInvoicesList(billsRes.data || []);
      const purchasesData = purchasesRes.data?.content || purchasesRes.data || [];
      setBulkPurchasesList(purchasesData);
      const readingsData = readingsRes.data?.content || readingsRes.data || [];
      setMeterReadingsList(readingsData);

      // Sync billing settings from backend
      const s = statsRes.data;
      if (s) {
        setBillingSettings(prev => ({
          tariffRate: s.tariffRate?.toString() || prev.tariffRate,
          tier1LimitLitres: s.tier1LimitLitres?.toString() || prev.tier1LimitLitres,
          tier1Rate: s.tier1Rate?.toString() || s.tariffRate?.toString() || prev.tier1Rate,
          tier2Rate: s.tier2Rate?.toString() || prev.tier2Rate,
          taxRate: s.taxRate?.toString() || prev.taxRate,
          lateFeeRate: s.lateFeeRate?.toString() || prev.lateFeeRate,
          minimumMonthlyCharge: s.minimumMonthlyCharge?.toString() || prev.minimumMonthlyCharge,
          fixedServiceCharge: s.fixedServiceCharge?.toString() || prev.fixedServiceCharge,
          dueDateDays: s.dueDateDays?.toString() || prev.dueDateDays
        }));
      }
    } catch (err) {
      console.error("Error loading community admin stats:", err);
    }
  };

  const fetchResidentsList = async () => {
    setResLoading(true);
    try {
      const params = {
        communityId: myCommunityId || undefined,
        search: resSearch || undefined,
        isActive: resStatus === "ACTIVE" ? true : resStatus === "INACTIVE" ? false : undefined,
        occupancyType: resOccupancy !== "ALL" ? resOccupancy : undefined,
        sortBy: resSortBy,
        sortDir: resSortDir,
        page: resPage,
        size: 50
      };
      const data = await residentService.getResidents(params);
      if (Array.isArray(data)) {
        setResList(data);
        setResTotal(data.length);
      } else {
        setResList(data.content || []);
        setResTotal(data.totalElements ?? (data.content?.length || 0));
      }
    } catch (err) {
      console.error("Failed to fetch residents list:", err);
      toast.error("Unable to load residents list. Please refresh and try again.");
    } finally {
      setResLoading(false);
    }
  };

  useEffect(() => {
    if (currentTab === "residents") {
      fetchResidentsList();
    }
  }, [currentTab, resPage, resSearch, resStatus, resOccupancy, resSortBy, resSortDir]);

  const openResModal = (res: any = null) => {
    if (res) {
      setEditingRes(res);
      setResEmail(res.email || "");
      setResPassword("");
      setResFullName(res.fullName || "");
      setResPhone(res.phoneNumber || "");
      setResGender(res.gender || "MALE");
      setResDOB(res.dateOfBirth || "");
      setResEmergencyName(res.emergencyContactName || "");
      setResEmergencyPhone(res.emergencyContactPhone || "");
      setResAddress(res.address || "");
      setResBuilding(res.building || "");
      setResBlock(res.block || "");
      setResFloor(res.floor || "");
      setResFlatNumber(res.flatNumber || "");
      setResFamilySize(res.familySize?.toString() || "1");
      setResOccupancyType(res.occupancyType || "TENANT");
      setResMoveInDate(res.moveInDate || "");
      setResMeterNumber(res.meterNumber || "");
      setResWaterBalance(res.waterBalance?.toString() || "0.00");
      setResIsActive(res.isActive !== false);
    } else {
      setEditingRes(null);
      setResEmail("");
      setResPassword("");
      setResFullName("");
      setResPhone("");
      setResGender("MALE");
      setResDOB("");
      setResEmergencyName("");
      setResEmergencyPhone("");
      setResAddress("");
      setResBuilding("");
      setResBlock("");
      setResFloor("");
      setResFlatNumber("");
      setResFamilySize("1");
      setResOccupancyType("TENANT");
      setResMoveInDate("");
      setResMeterNumber("");
      setResWaterBalance("0.00");
      setResIsActive(true);
    }
    setShowResModal(true);
  };

  const handleResSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resEmail || !resFullName || !resFlatNumber) {
      toast.error("Please fill in required fields: Email, Name, Flat.");
      return;
    }

    try {
      const payload: any = {
        email: resEmail,
        fullName: resFullName,
        phoneNumber: resPhone || undefined,
        gender: resGender,
        dateOfBirth: resDOB || undefined,
        emergencyContactName: resEmergencyName || undefined,
        emergencyContactPhone: resEmergencyPhone || undefined,
        address: resAddress || undefined,
        building: resBuilding || undefined,
        block: resBlock || undefined,
        floor: resFloor || undefined,
        flatNumber: resFlatNumber,
        familySize: parseInt(resFamilySize) || 1,
        occupancyType: resOccupancyType,
        moveInDate: resMoveInDate || undefined,
        meterNumber: resMeterNumber || undefined,
        waterBalance: parseFloat(resWaterBalance) || 0.00,
        isActive: resIsActive
      };

      if (resPassword) {
        payload.password = resPassword;
      }

      if (editingRes) {
        await residentService.editResident(editingRes.id, payload);
        toast.success("Resident details updated.");
      } else {
        await residentService.registerResident(payload);
        toast.success("Resident registered successfully.");
      }
      setShowResModal(false);
      fetchResidentsList();
    } catch (err: any) {
      toast.error(getErrorMessage(err, "Failed to save resident."));
    }
  };

  const handleToggleResStatus = async (id: number, active: boolean) => {
    try {
      await residentService.toggleResidentStatus(id, active);
      toast.success(`Resident ${active ? "activated" : "deactivated"} successfully.`);
      fetchResidentsList();
    } catch  {
      toast.error("Failed to toggle status.");
    }
  };

  const handleDeleteOrArchiveRes = async (id: number, name: string, archive: boolean) => {
    const promptMsg = archive 
      ? `Are you sure you want to archive "${name}"? This deactivates the profile but preserves bill records.`
      : `Are you sure you want to PERMANENTLY delete "${name}"? This deletes all associated history from database.`;

    if (!confirm(promptMsg)) return;

    try {
      await residentService.deleteResident(id, archive);
      toast.success(archive ? "Resident profile archived." : "Resident profile deleted permanently.");
      fetchResidentsList();
    } catch  {
      toast.error("Operation failed.");
    }
  };

  const openTransferModal = (res: any) => {
    setTransferringRes(res);
    setTransFlat(res.flatNumber || "");
    setTransBuilding(res.building || "");
    setTransBlock(res.block || "");
    setTransFloor(res.floor || "");
    setShowTransferModal(true);
  };

  const handleTransferSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!transFlat) return;

    try {
      await residentService.transferResident(transferringRes.id, {
        flatNumber: transFlat,
        building: transBuilding || undefined,
        block: transBlock || undefined,
        floor: transFloor || undefined
      });
      toast.success("Resident occupancy transferred successfully.");
      setShowTransferModal(false);
      fetchResidentsList();
    } catch (err: any) {
      toast.error(getErrorMessage(err, "Failed to transfer unit."));
    }
  };

  const handleImportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!importFile) return;
    setIsImporting(true);
    setImportResult(null);

    try {
      const result = await residentService.importResidents(importFile);
      setImportResult(result);
      toast.success(`CSV process done. Imported: ${result.successfulRows} rows.`);
      fetchResidentsList();
    } catch  {
      toast.error("Failed to process CSV file.");
    } finally {
      setIsImporting(false);
    }
  };

  const handleExportCSV = () => {
    window.open(`${api.defaults.baseURL}/api/residents/export`, "_blank");
  };

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await fetchDashboardData();
      setLoading(false);
    };
    init();

    const interval = setInterval(async () => {
      await fetchDashboardData();
    }, 3000);

    const handleFocus = () => fetchDashboardData();
    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleFocus);
    };
  }, []);

  useEffect(() => {
    setSearchQuery("");
    const tabName = currentTab === "dashboard" ? "Community Overview" : currentTab.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
    document.title = `${tabName} | Admin | HydroBS`;
  }, [currentTab]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await fetchDashboardData();
      toast.success("Dashboard data refreshed successfully.");
    } catch  {
      toast.error("Failed to refresh dashboard.");
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleApprove = async (requestId: number) => {
    try {
      await api.post(`/api/communities/join-requests/${requestId}/approve`);
      toast.success("Resident approved successfully.");
      await fetchDashboardData();
    } catch (err: any) {
      toast.error(getErrorMessage(err, "Error approving request"));
    }
  };

  const handleReject = async (requestId: number) => {
    try {
      await api.post(`/api/communities/join-requests/${requestId}/reject`);
      toast.success("Resident request rejected.");
      await fetchDashboardData();
    } catch (err: any) {
      toast.error(getErrorMessage(err, "Error rejecting request"));
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
        headers: { "Content-Type": "multipart/form-data" },
      });
      setUploadResult({ success: true, data: res.data });
      toast.success("CSV readings uploaded successfully!");
      await fetchDashboardData();
    } catch (err: any) {
      setUploadResult({
        success: false,
        error: getErrorMessage(err, "Failed to upload readings."),
      });
      toast.error(getErrorMessage(err, "Failed to upload readings."));
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.name.endsWith(".csv")) {
      const fakeEvent = { target: { files: [file] } } as unknown as React.ChangeEvent<HTMLInputElement>;
      handleCsvUpload(fakeEvent);
    } else {
      toast.error("Please drop a valid CSV file.");
    }
  };

  const handleGenerateBills = async () => {
    setGeneratingBills(true);
    try {
      const res = await api.post("/api/water/generate-bills");
      if (myCommunityId) {
        await api.post("/api/billing/generate", {
          scope: "COMMUNITY",
          communityId: Number(myCommunityId),
          notes: "Community Admin Billing Run"
        }).catch(() => {});
      }
      toast.success(typeof res.data === "string" ? res.data : "Invoices generated successfully for all community residents!");
      await fetchDashboardData();
    } catch (err: any) {
      toast.error(getErrorMessage(err, "Failed to generate community invoices."));
    } finally {
      setGeneratingBills(false);
    }
  };

  const handleManualReading = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!readingFlat || !readingDate || !readingAmount) return;
    setSubmittingReading(true);
    try {
      const res = await api.post("/api/water/readings/manual", {
        flatNumber: readingFlat,
        readingDate: readingDate,
        reading: parseFloat(readingAmount)
      });
      const newReading = res.data?.reading || res.data || {
        flatNumber: readingFlat,
        readingDate: readingDate,
        usageLitres: parseFloat(readingAmount),
        currentReading: parseFloat(readingAmount),
        source: "Manual Entry",
        createdAt: new Date().toISOString()
      };
      setMeterReadingsList(prev => [newReading, ...prev]);
      toast.success("Manual reading submitted & real-time telemetry updated!");
      setShowReadingModal(false);
      setReadingFlat("");
      setReadingDate("");
      setReadingAmount("");
      await fetchDashboardData();
    } catch (err: any) {
      toast.error(getErrorMessage(err, "Failed to submit reading."));
    } finally {
      setSubmittingReading(false);
    }
  };

  const handleSaveBillingSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSettings(true);
    try {
      const payload = {
        tariffRate: parseFloat(billingSettings.tariffRate),
        tier1LimitLitres: parseFloat(billingSettings.tier1LimitLitres),
        tier1Rate: parseFloat(billingSettings.tier1Rate),
        tier2Rate: parseFloat(billingSettings.tier2Rate),
        taxRate: parseFloat(billingSettings.taxRate),
        lateFeeRate: parseFloat(billingSettings.lateFeeRate),
        minimumMonthlyCharge: parseFloat(billingSettings.minimumMonthlyCharge),
        fixedServiceCharge: parseFloat(billingSettings.fixedServiceCharge),
        dueDateDays: parseInt(billingSettings.dueDateDays)
      };
      await api.put("/api/water/billing-settings", payload);

      // Instantly reflect in local stats so division cards above update IMMEDIATELY!
      setStats((prev: any) => ({
        ...prev,
        tariffRate: payload.tariffRate,
        tier1LimitLitres: payload.tier1LimitLitres,
        tier1Rate: payload.tier1Rate,
        tier2Rate: payload.tier2Rate,
        taxRate: payload.taxRate,
        lateFeeRate: payload.lateFeeRate,
        minimumMonthlyCharge: payload.minimumMonthlyCharge,
        fixedServiceCharge: payload.fixedServiceCharge,
        dueDateDays: payload.dueDateDays
      }));

      toast.success("Tiered Tariff & Billing settings saved & published! Active resident bills updated.");
      await fetchDashboardData();
    } catch (err: any) {
      toast.error(getErrorMessage(err, "Failed to save tariff settings."));
    } finally {
      setSavingSettings(false);
    }
  };

  const handleRecordWaterPurchase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!purchaseSupplier.trim() || !purchaseVolume || !purchaseCost) {
      toast.error("Please fill in Supplier, Volume, and Cost.");
      return;
    }
    setSavingPurchase(true);
    try {
      await api.post("/api/bulk-purchases", {
        supplier: purchaseSupplier,
        purchaseDate,
        volumeLitres: parseFloat(purchaseVolume),
        unitCost: parseFloat(purchaseVolume) > 0 ? parseFloat(purchaseCost) / parseFloat(purchaseVolume) : 0,
        totalCost: parseFloat(purchaseCost),
        invoiceReference: "INV-PUR-" + Date.now().toString().slice(-6),
        remarks: purchaseNotes
      });
      toast.success("Water purchase record logged successfully!");
      setShowWaterPurchaseModal(false);
      setPurchaseSupplier("");
      setPurchaseVolume("");
      setPurchaseCost("");
      setPurchaseNotes("");
      await fetchDashboardData();
    } catch (err: any) {
      toast.error(getErrorMessage(err, "Failed to record water purchase."));
    } finally {
      setSavingPurchase(false);
    }
  };

  // Extract data from stats
  const chartData = stats?.chartData || [];
  const residentUsageDistribution = stats?.residentUsageDistribution || [];
  const billingDistribution = stats?.billingDistribution || [];
  const recentActivities = stats?.recentActivity || [];
  const pendingBillsTable = stats?.pendingBillsList || [];
  const residents = stats?.residents || [];
  const invoices = invoicesList.length > 0 ? invoicesList : (stats?.invoices || stats?.pendingBillsList || []);
  const waterPurchases = bulkPurchasesList.length > 0 ? bulkPurchasesList : (stats?.waterPurchases || []);
  const meterReadings = stats?.allReadings || stats?.meterReadings || [];

  // Visualization mock data (falls back when API data not available)
  const monthlyConsumption = stats?.monthlyConsumption || chartData.map((d: any) => ({ name: d.name, usage: d.usage || 0, purchased: d.purchased || 0 }));
  const revenueVsOutstanding = stats?.revenueVsOutstanding || chartData.map((d: any) => ({ name: d.name, revenue: d.revenue || 0, outstanding: d.outstanding || 0 }));
  const invoiceSettlement = stats?.invoiceSettlement || billingDistribution;
  const topConsumers = stats?.topConsumers || residentUsageDistribution.slice(0, 6);

  const cards = [
    { label: "Total Residents", value: stats?.totalUsers || 0, icon: Users, color: "bg-[#0F4C81]/10 text-[#0F4C81]" },
    { label: "Total Water Used", value: stats?.totalWaterUsed || 0, suffix: " L", icon: Droplets, color: "bg-[#00B4D8]/10 text-[#00B4D8]" },
    { label: "Water Purchased", value: stats?.waterPurchased || 0, suffix: " L", icon: ShoppingCart, color: "bg-[#2ECC71]/10 text-[#2ECC71]" },
    { label: "Pending Bills", value: stats?.pendingBills || 0, icon: Receipt, color: "bg-[#FFB703]/10 text-[#FFB703]" },
    { label: "Leak Alerts", value: stats?.activeAlerts || 0, icon: AlertTriangle, color: stats?.activeAlerts > 0 ? "bg-rose-50 text-rose-500" : "bg-slate-50 text-slate-400" },
  ];

  const getTabTitle = () => {
    switch (currentTab) {
      case "residents": return "Residents Management";
      case "water-usage": return "Water Usage Analytics";
      case "meter-readings": return "Meter Readings";
      case "billing": return "Billing Management";
      case "tariff-plans": return "Tariff Plans";
      case "water-purchase": return "Water Purchase History";
      case "invoices": return "Invoices";
      case "calendar": return "Calendar";
      case "alerts": return "Alerts & Notifications";
      case "announcements": return "Community Announcements";
      case "audit-logs": return "Audit Logs";
      case "reports": return "Reports";
      case "visualizations": return "Analytics Hub";
      case "profile": return "Admin Profile";
      default: return "Community Dashboard";
    }
  };

  return (
    <DashboardLayout
      role="ADMIN"
      title={getTabTitle()}
      subtitle={stats?.communityName || "Community Management"}
      onRefresh={handleRefresh}
      isRefreshing={isRefreshing}
    >
      {/* ═══════════════════════════════════════════════════════════ */}
      {/* DASHBOARD TAB */}
      {/* ═══════════════════════════════════════════════════════════ */}
      {currentTab === "dashboard" && (
        <div className="space-y-6 animate-fade-in text-[#1F2937]">
          {/* KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {loading ? (
              <>{Array.from({ length: 5 }).map((_, i) => <CardSkeleton key={i} />)}</>
            ) : (
              cards.map((card, idx) => (
                <motion.div
                  whileHover={{ y: -4 }}
                  key={card.label}
                  className="group relative overflow-hidden p-5 rounded-3xl border border-slate-100 bg-white shadow-sm hover:shadow-md transition-all duration-200 flex justify-between items-start"
                >
                  <div className="text-left">
                    <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">{card.label}</p>
                    <p className="text-2xl font-extrabold text-[#0F4C81] mt-2">
                      <AnimatedCounter value={card.value} suffix={card.suffix} />
                    </p>
                  </div>
                  <div className={`p-3 rounded-2xl ${card.color} shadow-sm transition-transform duration-200 group-hover:scale-105`}>
                    <card.icon className="h-5 w-5" />
                  </div>
                </motion.div>
              ))
            )}
          </div>

          {/* Primary Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {loading ? (
              <>
                <div className="lg:col-span-2"><ChartSkeleton /></div>
                <ChartSkeleton />
              </>
            ) : (
              <>
                {/* Monthly Water Usage AreaChart */}
                <div className="lg:col-span-2 chart-container p-6 space-y-4">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-[#00B4D8]" />
                    <h3 className="text-xs font-bold tracking-wide uppercase text-slate-500">Monthly Water Usage</h3>
                  </div>
                  <div className="h-[220px] w-full">
                    {chartData.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                          <defs>
                            <linearGradient id="adminUsageGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#00B4D8" stopOpacity={0.2} />
                              <stop offset="95%" stopColor="#00B4D8" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                          <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} tickLine={false} />
                          <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} />
                          <Tooltip contentStyle={TOOLTIP_STYLE} />
                          <Area type="monotone" dataKey="usage" stroke="#00B4D8" strokeWidth={2.5} fillOpacity={1} fill="url(#adminUsageGrad)" name="Usage (L)" />
                        </AreaChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-full flex items-center justify-center text-slate-400 text-xs">No usage data available.</div>
                    )}
                  </div>
                </div>

                {/* Water Purchase BarChart */}
                <div className="chart-container p-6 space-y-4">
                  <div className="flex items-center gap-2">
                    <ShoppingCart className="h-5 w-5 text-[#2ECC71]" />
                    <h3 className="text-xs font-bold tracking-wide uppercase text-slate-500">Water Purchase History</h3>
                  </div>
                  <div className="h-[220px] w-full">
                    {chartData.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                          <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} tickLine={false} />
                          <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} />
                          <Tooltip contentStyle={TOOLTIP_STYLE} />
                          <Bar dataKey="purchased" fill="#2ECC71" radius={[5, 5, 0, 0]} name="Purchased (L)" />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-full flex items-center justify-center text-slate-400 text-xs">No purchase data available.</div>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Recent Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {loading ? (
              <>
                <ActivitySkeleton />
                <div className="lg:col-span-2"><ChartSkeleton /></div>
              </>
            ) : (
              <>
                <div className="clay-card p-6 space-y-4">
                  <h3 className="text-xs font-bold tracking-wide uppercase text-slate-500 flex items-center gap-1.5">
                    <Clock className="h-4 w-4 text-[#00B4D8]" />
                    Recent Activity
                  </h3>
                  <div className="space-y-4 overflow-y-auto max-h-[200px] pr-2">
                    {recentActivities.length > 0 ? (
                      recentActivities.map((act: any, idx: number) => (
                        <div key={act.id || idx} className="flex gap-3 items-start text-xs border-l-2 border-[#00B4D8]/20 pl-3">
                          <div className="space-y-0.5">
                            <p className="text-slate-800 dark:text-slate-200 font-bold">{act.title}</p>
                            <p className="text-slate-500 dark:text-slate-400 text-[11px]">{act.desc}</p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center text-slate-400 dark:text-slate-500 py-8 text-xs">No recent activity.</div>
                    )}
                  </div>
                </div>

                {/* Residents Water Distribution */}
                <div className="lg:col-span-2 chart-container p-6 space-y-4">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-[#0F4C81]" />
                    <h3 className="text-xs font-bold tracking-wide uppercase text-slate-500">Water Consumption by Flat</h3>
                  </div>
                  <div className="h-[200px] w-full">
                    {residentUsageDistribution.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={residentUsageDistribution} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                          <XAxis dataKey="flat" stroke="#94a3b8" fontSize={10} tickLine={false} />
                          <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} />
                          <Tooltip contentStyle={TOOLTIP_STYLE} />
                          <Bar dataKey="usage" fill="#0F4C81" radius={[5, 5, 0, 0]} name="Usage (L)" />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-full flex items-center justify-center text-slate-400 text-xs">No resident usage data available.</div>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Bill Payment PieChart + Pending Bills */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {loading ? (
              <>
                <ChartSkeleton />
                <div className="lg:col-span-2"><TableSkeleton rows={4} cols={5} /></div>
              </>
            ) : (
              <>
                {/* Bill Payment PieChart */}
                <div className="chart-container p-6 flex flex-col justify-between">
                  <div className="flex items-center gap-2">
                    <PieIcon className="h-5 w-5 text-[#FFB703]" />
                    <h3 className="text-xs font-bold tracking-wide uppercase text-slate-500">Bill Payment Status</h3>
                  </div>
                  <div className="h-[180px] w-full flex items-center justify-center">
                    {billingDistribution.length > 0 && (billingDistribution[0]?.value > 0 || billingDistribution[1]?.value > 0) ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={billingDistribution} cx="50%" cy="50%" innerRadius={50} outerRadius={70} paddingAngle={4} dataKey="value">
                            {billingDistribution.map((_entry: any, index: number) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip contentStyle={TOOLTIP_STYLE} />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="text-slate-400 text-xs">No billing data available.</div>
                    )}
                  </div>
                  <div className="flex justify-center gap-6 text-[10px] text-slate-500 font-bold">
                    <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-[#00B4D8]"></span>Paid</span>
                    <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-[#0F4C81]"></span>Unpaid</span>
                  </div>
                </div>

                {/* Pending Bills Table */}
                <div className="lg:col-span-2 clay-card overflow-hidden flex flex-col">
                  <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50">
                    <h3 className="text-xs font-bold uppercase tracking-wide text-[#0F4C81] dark:text-[#00B4D8]">Pending Bills</h3>
                    <span className="text-slate-400 text-xs font-semibold">{pendingBillsTable.length} Bills</span>
                  </div>
                  <div className="overflow-x-auto max-h-[220px]">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400 font-bold uppercase border-b border-slate-100 dark:border-slate-800">
                        <tr>
                          <th className="px-6 py-3">Bill #</th>
                          <th className="px-6 py-3">Flat</th>
                          <th className="px-6 py-3">Resident</th>
                          <th className="px-6 py-3">Amount</th>
                          <th className="px-6 py-3">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-600 dark:text-slate-300 font-medium">
                        {pendingBillsTable.length > 0 ? (
                          pendingBillsTable.map((bill: any) => (
                            <tr key={bill.billNo} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                              <td className="px-6 py-3 font-bold text-[#0F4C81] dark:text-[#00B4D8]">{bill.billNo}</td>
                              <td className="px-6 py-3 font-semibold">{bill.flat}</td>
                              <td className="px-6 py-3">{bill.residentName}</td>
                              <td className="px-6 py-3">₹{bill.amount}</td>
                              <td className="px-6 py-3">
                                <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wider bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 border border-amber-100 dark:border-amber-900/50">
                                  {bill.status}
                                </span>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={5} className="px-6 py-8 text-center text-slate-400 dark:text-slate-500">
                              No pending bills. Click &quot;Generate Bills&quot; to create new bills.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Quick Actions + Pending Approvals */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Quick Actions */}
            <div className="border border-slate-100 rounded-3xl bg-white p-6 space-y-5 shadow-sm">
              <h3 className="text-xs font-bold uppercase tracking-wide text-[#0F4C81]">Quick Actions</h3>

              {/* CSV Upload */}
              <div className="space-y-2">
                <label className="text-xs text-slate-500 font-semibold block">Upload Meter Readings (CSV)</label>
                <div
                  onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={handleDrop}
                  className={`relative border-2 border-dashed rounded-2xl p-4 flex flex-col items-center justify-center transition-all cursor-pointer ${
                    dragOver ? "border-[#00B4D8] bg-[#00B4D8]/5" : "border-slate-200 hover:border-slate-300 bg-slate-50/50 hover:bg-slate-50"
                  }`}
                >
                  <Upload className="h-6 w-6 text-slate-400 mb-2" />
                  <p className="text-[10px] text-slate-500 text-center font-medium">Drag or click to choose CSV file</p>
                  <input
                    type="file"
                    accept=".csv"
                    onChange={handleCsvUpload}
                    disabled={uploading}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                  {uploading && (
                    <div className="absolute inset-0 bg-white/90 rounded-2xl flex items-center justify-center gap-2">
                      <Loader2 className="h-4 w-4 text-[#00B4D8] animate-spin" />
                      <span className="text-xs text-[#0F4C81] font-bold">Uploading...</span>
                    </div>
                  )}
                </div>

                {uploadResult && (
                  <div className={`p-3 rounded-xl text-xs font-semibold border mt-2 ${
                    uploadResult.success
                      ? "bg-emerald-50 border-emerald-100 text-emerald-700"
                      : "bg-rose-50 border-rose-100 text-rose-700"
                  }`}>
                    {uploadResult.success ? (
                      <div>
                        <p className="font-bold flex items-center gap-1">✅ Upload Success!</p>
                        <p className="mt-1 text-[10px] text-slate-600">
                          Total: {uploadResult.data.totalRows} |
                          Success: {uploadResult.data.successfulRows} |
                          Failed: {uploadResult.data.failedRows}
                        </p>
                      </div>
                    ) : (
                      <p className="font-bold">❌ Error: {uploadResult.error}</p>
                    )}
                  </div>
                )}
              </div>

              {/* Generate Bills Button */}
              <button
                onClick={handleGenerateBills}
                disabled={generatingBills}
                className="w-full bg-gradient-to-r from-[#00B4D8] to-[#0F4C81] hover:from-[#48CAE4] hover:to-[#00B4D8] disabled:opacity-50 text-white font-bold py-3 px-4 rounded-2xl text-xs tracking-wide transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
              >
                {generatingBills ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Receipt className="h-3.5 w-3.5" />
                )}
                Generate Monthly Bills
              </button>
            </div>

            {/* Pending Resident Approvals */}
            <div className="lg:col-span-2 border border-slate-100 rounded-3xl bg-white overflow-hidden shadow-sm">
              <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <h3 className="text-xs font-bold uppercase tracking-wide text-[#0F4C81]">Pending Resident Approvals</h3>
                <div className="flex items-center gap-2">
                  <span className="bg-[#00B4D8]/10 text-[#00B4D8] border border-[#00B4D8]/20 text-xs font-bold px-3 py-1 rounded-full">{pendingRequests.length} Requests</span>
                  <button
                    onClick={handleRefreshPendingRequests}
                    disabled={refreshingPending}
                    className="p-1.5 hover:bg-slate-200/60 rounded-xl text-[#0F4C81] transition-all cursor-pointer disabled:opacity-50"
                    title="Refresh Pending Approvals"
                  >
                    <RefreshCw className={`h-4 w-4 ${refreshingPending ? "animate-spin" : ""}`} />
                  </button>
                </div>
              </div>
              <div className="divide-y divide-slate-100">
                {pendingRequests.length > 0 ? (
                  pendingRequests.map((req) => (
                    <div key={req.id} className="p-5 flex items-center justify-between hover:bg-slate-50/50 transition-colors">
                      <div>
                        <p className="text-slate-800 font-bold text-sm">
                          {req.fullName}
                          <span className="text-slate-500 text-xs ml-3 font-semibold bg-slate-100 px-2 py-0.5 rounded-lg">Flat {req.flatNumber}</span>
                        </p>
                        <p className="text-slate-400 text-xs mt-1">{req.email}</p>
                      </div>
                      <div className="flex gap-2.5">
                        <button
                          onClick={() => handleApprove(req.id)}
                          className="flex items-center gap-1 bg-[#2ECC71]/10 text-[#2ECC71] hover:bg-[#2ECC71]/20 border border-[#2ECC71]/20 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer"
                        >
                          <Check className="h-3.5 w-3.5" /> Approve
                        </button>
                        <button
                          onClick={() => handleReject(req.id)}
                          className="flex items-center gap-1 bg-rose-50 text-rose-500 hover:bg-rose-100 border border-rose-100 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer"
                        >
                          <X className="h-3.5 w-3.5" /> Reject
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-10 text-center text-slate-400 text-sm">No pending requests at the moment.</div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* RESIDENTS TAB */}
      {/* ═══════════════════════════════════════════════════════════ */}
      {currentTab === "residents" && !searchParams.get("id") && (
        <div className="space-y-6 animate-fade-in text-[#1F2937]">
          <div className="border border-slate-100 rounded-3xl bg-white p-6 space-y-6 shadow-sm">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-100 pb-4 gap-4">
              <div>
                <h3 className="text-lg font-bold text-[#0F4C81]">Community Residents</h3>
                <p className="text-xs text-slate-500">Register, transfer, and manage resident accounts and details</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button 
                  onClick={() => openResModal()}
                  className="px-3 py-1.5 bg-[#00B4D8] hover:bg-[#0F4C81] text-white rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center gap-1 transition-all cursor-pointer shadow-md"
                >
                  <Plus className="h-3.5 w-3.5" /> Register Resident
                </button>
                <button 
                  onClick={() => setShowImportModal(true)}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center gap-1 transition-all cursor-pointer"
                >
                  <Upload className="h-3.5 w-3.5" /> Bulk Import (CSV)
                </button>
                <button 
                  onClick={handleExportCSV}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center gap-1 transition-all cursor-pointer"
                >
                  <Download className="h-3.5 w-3.5" /> Export CSV
                </button>
                <button onClick={() => setSearchParams({})} className="text-xs font-bold text-[#00B4D8] hover:underline cursor-pointer px-2 py-1">Back</button>
              </div>
            </div>

            {/* Filters Row */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs font-bold text-slate-600">
              <div className="relative">
                <Search className="absolute left-3.5 top-3.5 h-3.5 w-3.5 text-slate-400" />
                <input 
                  type="text" 
                  value={resSearch}
                  onChange={(e) => setResSearch(e.target.value)}
                  placeholder="Search name, email, flat..."
                  className="w-full bg-slate-50 border border-transparent rounded-xl pl-9 pr-3 py-3 text-slate-700 focus:outline-none"
                />
              </div>

              <div>
                <select 
                  value={resStatus} 
                  onChange={(e) => setResStatus(e.target.value)}
                  className="w-full bg-slate-50 border border-transparent rounded-xl px-3 py-3 text-slate-700 cursor-pointer"
                >
                  <option value="ALL">Status: All</option>
                  <option value="ACTIVE">Active Only</option>
                  <option value="INACTIVE">Inactive Only</option>
                </select>
              </div>

              <div>
                <select 
                  value={resOccupancy} 
                  onChange={(e) => setResOccupancy(e.target.value)}
                  className="w-full bg-slate-50 border border-transparent rounded-xl px-3 py-3 text-slate-700 cursor-pointer"
                >
                  <option value="ALL">Occupancy: All</option>
                  <option value="OWNER">Owner</option>
                  <option value="TENANT">Tenant</option>
                </select>
              </div>

              <div className="flex items-center justify-end px-3">
                Total Matches: {resTotal}
              </div>
            </div>

            {/* Resident Table */}
            {resLoading ? (
              <TableSkeleton rows={5} cols={7} />
            ) : (
              <div className="overflow-hidden border border-slate-100 rounded-2xl bg-white shadow-sm">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 font-bold uppercase border-b border-slate-100">
                    <tr>
                      <th className="px-5 py-3.5 cursor-pointer" onClick={() => { setResSortBy("flatNumber"); setResSortDir(resSortDir === "asc" ? "desc" : "asc"); }}>Flat</th>
                      <th className="px-5 py-3.5 cursor-pointer" onClick={() => { setResSortBy("fullName"); setResSortDir(resSortDir === "asc" ? "desc" : "asc"); }}>Name</th>
                      <th className="px-5 py-3.5">Email</th>
                      <th className="px-5 py-3.5">Phone</th>
                      <th className="px-5 py-3.5">Occupancy</th>
                      <th className="px-5 py-3.5">Status</th>
                      <th className="px-5 py-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-600 font-medium">
                    {resList.length > 0 ? (
                      resList.map((r: any) => (
                        <tr key={r.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-5 py-3.5 font-bold text-[#0F4C81]">{r.flatNumber}</td>
                          <td className="px-5 py-3.5 font-bold text-slate-800">{r.fullName}</td>
                          <td className="px-5 py-3.5 text-slate-500">{r.email}</td>
                          <td className="px-5 py-3.5">{r.phoneNumber || "N/A"}</td>
                          <td className="px-5 py-3.5 capitalize">{r.occupancyType?.toLowerCase() || "Tenant"}</td>
                          <td className="px-5 py-3.5">
                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase border ${
                              r.isActive !== false
                                ? "bg-emerald-50 text-emerald-600 border-emerald-100"
                                : "bg-rose-50 text-rose-500 border-rose-100"
                            }`}>
                              {r.isActive !== false ? "Active" : "Inactive"}
                            </span>
                          </td>
                          <td className="px-5 py-3.5 text-right flex justify-end gap-1.5">
                            <button
                              onClick={() => setSearchParams({ tab: "residents", id: r.id.toString() })}
                              className="p-1.5 bg-slate-50 hover:bg-slate-100 text-[#0F4C81] rounded-lg cursor-pointer"
                              title="View details"
                            >
                              <Eye className="h-3.5 w-3.5" />
                            </button>
                            <button 
                              onClick={() => openResModal(r)}
                              className="p-1.5 bg-slate-50 hover:bg-slate-100 text-[#00B4D8] rounded-lg cursor-pointer"
                              title="Edit details"
                            >
                              <Edit className="h-3.5 w-3.5" />
                            </button>
                            <button 
                              onClick={() => handleToggleResStatus(r.id, !r.isActive)}
                              className="p-1.5 bg-slate-50 hover:bg-slate-100 text-[#2ECC71] rounded-lg cursor-pointer"
                              title={r.isActive ? "Deactivate" : "Activate"}
                            >
                              <Check className="h-3.5 w-3.5" />
                            </button>
                            <button 
                              onClick={() => openTransferModal(r)}
                              className="p-1.5 bg-slate-50 hover:bg-slate-100 text-amber-600 rounded-lg cursor-pointer"
                              title="Transfer Unit"
                            >
                              <ArrowRight className="h-3.5 w-3.5" />
                            </button>
                            <button 
                              onClick={() => handleDeleteOrArchiveRes(r.id, r.fullName, true)}
                              className="p-1.5 bg-slate-50 hover:bg-slate-100 text-slate-400 rounded-lg cursor-pointer"
                              title="Archive resident"
                            >
                              <FileText className="h-3.5 w-3.5" />
                            </button>
                            <button 
                              onClick={() => handleDeleteOrArchiveRes(r.id, r.fullName, false)}
                              className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg cursor-pointer"
                              title="Delete permanently"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={7} className="px-5 py-8 text-center text-slate-400">No residents matched your filter parameters.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination controls */}
            <div className="flex justify-between items-center text-xs font-bold text-slate-500 pt-3">
              <span>Showing {resPage * 10 + 1} to {Math.min((resPage + 1) * 10, resTotal)} of {resTotal} entries</span>
              <div className="flex gap-2">
                <button 
                  onClick={() => setResPage(prev => Math.max(0, prev - 1))}
                  disabled={resPage === 0}
                  className="px-3.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg disabled:opacity-40 cursor-pointer"
                >
                  Previous
                </button>
                <button 
                  onClick={() => setResPage(prev => ((prev + 1) * 10 < resTotal ? prev + 1 : prev))}
                  disabled={(resPage + 1) * 10 >= resTotal}
                  className="px-3.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg disabled:opacity-40 cursor-pointer"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* RESIDENTS DETAILS VIEW */}
      {currentTab === "residents" && searchParams.get("id") && (
        <div className="space-y-4 animate-fade-in">
          <button
            onClick={() => setSearchParams({ tab: "residents" })}
            className="flex items-center gap-2 text-[#0F4C81] hover:text-[#00B4D8] text-sm font-bold transition-colors"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Residents List
          </button>
          <ResidentDetails id={searchParams.get("id")!} isTab={true} />
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* WATER USAGE TAB */}
      {/* ═══════════════════════════════════════════════════════════ */}
      {currentTab === "water-usage" && (
        <div className="space-y-6 animate-fade-in text-[#1F2937]">
          <div className="flex justify-between items-center border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-lg font-bold text-[#0F4C81]">Water Usage Analytics</h3>
              <p className="text-xs text-slate-500">Monitor water consumption trends and metrics</p>
            </div>
            <button onClick={() => setSearchParams({})} className="text-xs font-bold text-[#00B4D8] hover:underline cursor-pointer">Back to Dashboard</button>
          </div>

          {/* Consumption Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="border border-slate-100 rounded-2xl bg-white p-5 shadow-sm space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Total Consumption</span>
              <h4 className="text-2xl font-extrabold text-[#00B4D8]"><AnimatedCounter value={stats?.totalWaterUsed || 0} suffix=" L" /></h4>
            </div>
            <div className="border border-slate-100 rounded-2xl bg-white p-5 shadow-sm space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Average Per Resident</span>
              <h4 className="text-2xl font-extrabold text-[#0F4C81]"><AnimatedCounter value={stats?.avgUsagePerResident || 0} suffix=" L" /></h4>
            </div>
            <div className="border border-slate-100 rounded-2xl bg-white p-5 shadow-sm space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Water Purchased</span>
              <h4 className="text-2xl font-extrabold text-[#2ECC71]"><AnimatedCounter value={stats?.waterPurchased || 0} suffix=" L" /></h4>
            </div>
          </div>

          {/* Monthly Chart */}
          <div className="border border-slate-100 rounded-3xl bg-white p-6 space-y-4 shadow-sm">
            <h3 className="text-xs font-bold tracking-wide uppercase text-slate-500">Monthly Consumption Trend</h3>
            <div className="h-[280px] w-full">
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="wuGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#00B4D8" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#00B4D8" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} tickLine={false} />
                    <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} />
                    <Tooltip contentStyle={TOOLTIP_STYLE} />
                    <Area type="monotone" dataKey="usage" stroke="#00B4D8" strokeWidth={2.5} fillOpacity={1} fill="url(#wuGrad)" name="Usage (L)" />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-slate-400 text-xs">No usage data available.</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* METER READINGS TAB */}
      {/* ═══════════════════════════════════════════════════════════ */}
      {currentTab === "meter-readings" && (
        <div className="space-y-6 animate-fade-in text-[#1F2937]">
          <div className="flex justify-between items-center border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-lg font-bold text-[#0F4C81]">Meter Readings</h3>
              <p className="text-xs text-slate-500">Submit manual readings or upload CSV batches</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowReadingModal(true)}
                className="bg-gradient-to-r from-[#00B4D8] to-[#0F4C81] px-4 py-2 rounded-xl text-xs font-bold text-white shadow-md flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="h-4 w-4" /> Add Manual Reading
              </button>
              <button onClick={() => setSearchParams({})} className="text-xs font-bold text-[#00B4D8] hover:underline cursor-pointer">Back to Dashboard</button>
            </div>
          </div>

          {/* CSV Upload Widget */}
          <div className="border border-slate-100 rounded-3xl bg-white p-6 shadow-sm space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">Bulk CSV Upload</h4>
            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              className={`relative border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center transition-all cursor-pointer ${
                dragOver ? "border-[#00B4D8] bg-[#00B4D8]/5" : "border-slate-200 hover:border-slate-300 bg-slate-50/50"
              }`}
            >
              <Upload className="h-8 w-8 text-slate-400 mb-3" />
              <p className="text-sm text-slate-500 font-medium">Drag & drop your CSV file here, or click to browse</p>
              <p className="text-[10px] text-slate-400 mt-1">Supported format: .csv</p>
              <input type="file" accept=".csv" onChange={handleCsvUpload} disabled={uploading} className="absolute inset-0 opacity-0 cursor-pointer" />
              {uploading && (
                <div className="absolute inset-0 bg-white/90 rounded-2xl flex items-center justify-center gap-2">
                  <Loader2 className="h-5 w-5 text-[#00B4D8] animate-spin" />
                  <span className="text-sm text-[#0F4C81] font-bold">Processing...</span>
                </div>
              )}
            </div>
          </div>

          {/* Recent Readings Table */}
          <div className="border border-slate-100 rounded-3xl bg-white overflow-hidden shadow-sm space-y-2">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
              <div>
                <h4 className="text-sm font-bold text-[#0F4C81]">Recent Meter Readings</h4>
                <p className="text-xs text-slate-500">Live readings history, timestamp posted, consumption delta, and source.</p>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-cyan-50 border border-cyan-200 text-[#00B4D8] text-[10px] font-bold uppercase flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-[#00B4D8] animate-ping" /> Real-time Sync
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-bold uppercase border-b border-slate-100">
                  <tr>
                    <th className="px-6 py-3">Flat & Resident</th>
                    <th className="px-6 py-3">Reading Date & Time Posted</th>
                    <th className="px-6 py-3">Meter Index (Prev → Curr)</th>
                    <th className="px-6 py-3">Net Volume (L)</th>
                    <th className="px-6 py-3">Ingestion Source</th>
                    <th className="px-6 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-600 font-medium">
                  {(meterReadingsList.length > 0 ? meterReadingsList : meterReadings).length > 0 ? (
                    (meterReadingsList.length > 0 ? meterReadingsList : meterReadings).map((r: any, idx: number) => {
                      const flatStr = r.flatNumber || r.flat || "Flat -";
                      const residentName = r.residentName || "Resident";
                      const blockStr = r.building || r.block ? `(${r.building || r.block})` : "";
                      const dateStr = r.readingDate || r.date || "Today";
                      const timePosted = r.createdAt 
                        ? new Date(r.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) 
                        : "Live";
                      const prevReading = r.previousReading != null ? r.previousReading : "-";
                      const currReading = r.currentReading != null ? r.currentReading : (r.reading || r.amount || 0);
                      const usageL = r.usageLitres != null ? r.usageLitres : (r.reading || r.amount || 0);
                      
                      const isCsv = r.source === "CSV" || (r.notes && r.notes.includes(".csv"));
                      const sourceLabel = isCsv ? (r.notes || "Bulk CSV Upload") : (r.source || "Manual Entry");

                      return (
                        <tr key={r.id || idx} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-6 py-3.5">
                            <div className="font-bold text-[#0F4C81]">{flatStr} <span className="text-[10px] text-slate-400 font-normal">{blockStr}</span></div>
                            <div className="text-[10px] text-slate-500 font-medium">{residentName}</div>
                          </td>
                          <td className="px-6 py-3.5">
                            <div className="font-semibold text-slate-700">{dateStr}</div>
                            <div className="text-[10px] text-slate-400 font-mono">Posted: {timePosted}</div>
                          </td>
                          <td className="px-6 py-3.5 font-mono">
                            <span className="text-slate-400">{prevReading} L</span>
                            <span className="text-slate-300 mx-1.5">→</span>
                            <span className="font-bold text-[#0F4C81]">{currReading} L</span>
                          </td>
                          <td className="px-6 py-3.5">
                            <span className="font-extrabold text-[#00B4D8] font-mono text-sm">{usageL} L</span>
                            <span className="text-[10px] text-slate-400 block font-normal">({(usageL / 1000).toFixed(2)} kL)</span>
                          </td>
                          <td className="px-6 py-3.5">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold ${
                              isCsv ? "bg-cyan-50 text-[#00B4D8] border border-cyan-200" : "bg-purple-50 text-purple-600 border border-purple-200"
                            }`}>
                              {isCsv ? "📄 CSV Batch" : "✍️ Manual"}
                            </span>
                            <span className="text-[9px] text-slate-400 block mt-0.5 truncate max-w-[120px]" title={sourceLabel}>{sourceLabel}</span>
                          </td>
                          <td className="px-6 py-3.5">
                            {r.isAnomaly ? (
                              <span className="px-2.5 py-1 rounded-full bg-rose-50 text-rose-600 border border-rose-200 text-[10px] font-bold uppercase inline-flex items-center gap-1">
                                ⚠️ Leak Alert
                              </span>
                            ) : (
                              <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200 text-[10px] font-bold uppercase inline-flex items-center gap-1">
                                ✓ Verified
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-slate-400">No meter readings recorded yet.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Manual Reading Modal */}
          <AnimatePresence>
            {showReadingModal && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm"
                onClick={() => setShowReadingModal(false)}
              >
                <motion.div
                  initial={{ scale: 0.95, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.95, opacity: 0 }}
                  onClick={(e) => e.stopPropagation()}
                  className="bg-white rounded-3xl p-6 w-full max-w-md shadow-xl border border-slate-100"
                >
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold text-[#0F4C81]">Add Manual Reading</h3>
                    <button onClick={() => setShowReadingModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer"><X className="h-5 w-5" /></button>
                  </div>
                  <form onSubmit={handleManualReading} className="space-y-4">
                    <div>
                      <label className="text-xs font-bold text-slate-500 block mb-1">Flat Number</label>
                      <input type="text" value={readingFlat} onChange={(e) => setReadingFlat(e.target.value)} placeholder="e.g. A-101" className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#00B4D8]/20 focus:border-[#00B4D8]" required />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-500 block mb-1">Date</label>
                      <input type="date" value={readingDate} onChange={(e) => setReadingDate(e.target.value)} className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#00B4D8]/20 focus:border-[#00B4D8]" required />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-500 block mb-1">Reading Amount (Liters)</label>
                      <input type="number" step="0.01" value={readingAmount} onChange={(e) => setReadingAmount(e.target.value)} placeholder="e.g. 1250.50" className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#00B4D8]/20 focus:border-[#00B4D8]" required />
                    </div>
                    <button
                      type="submit"
                      disabled={submittingReading}
                      className="w-full bg-gradient-to-r from-[#00B4D8] to-[#0F4C81] text-white font-bold py-2.5 rounded-xl text-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      {submittingReading && <Loader2 className="h-4 w-4 animate-spin" />}
                      Submit Reading
                    </button>
                  </form>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {recordPaymentBill && (
            <CollectPaymentDialog
              bill={recordPaymentBill}
              onClose={() => setRecordPaymentBill(null)}
              onSuccess={fetchDashboardData}
            />
          )}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* BILLING TAB */}
      {/* ═══════════════════════════════════════════════════════════ */}
      {currentTab === "billing" && (
        <div className="space-y-6 animate-fade-in text-[#1F2937]">
          <div className="flex justify-between items-center border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-lg font-bold text-[#0F4C81]">Billing Management</h3>
              <p className="text-xs text-slate-500">Generate bills, track resident balances, and record payments</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleGenerateBills}
                disabled={generatingBills}
                className="bg-gradient-to-r from-[#00B4D8] to-[#0F4C81] px-4 py-2 rounded-xl text-xs font-bold text-white shadow-md flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {generatingBills ? <Loader2 className="h-4 w-4 animate-spin" /> : <Receipt className="h-4 w-4" />}
                Generate Bills
              </button>
              <button onClick={() => setSearchParams({})} className="text-xs font-bold text-[#00B4D8] hover:underline cursor-pointer">Back to Dashboard</button>
            </div>
          </div>

          {/* Billing Overview Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="border border-slate-100 rounded-2xl bg-white p-5 shadow-xs">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Total Billed</span>
              <h4 className="text-2xl font-extrabold text-[#00B4D8] mt-1">
                ₹{invoices.reduce((sum: number, b: any) => sum + Number(b.amount || b.netAmount || 0), 0).toFixed(2)}
              </h4>
            </div>
            <div className="border border-slate-100 rounded-2xl bg-white p-5 shadow-xs">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Total Collected</span>
              <h4 className="text-2xl font-extrabold text-emerald-600 mt-1">
                ₹{invoices.filter((b: any) => (b.status || "").toUpperCase() === "PAID").reduce((sum: number, b: any) => sum + Number(b.amount || b.netAmount || 0), 0).toFixed(2)}
              </h4>
            </div>
            <div className="border border-slate-100 rounded-2xl bg-white p-5 shadow-xs">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Outstanding Balance</span>
              <h4 className="text-2xl font-extrabold text-amber-500 mt-1">
                ₹{invoices.filter((b: any) => (b.status || "").toUpperCase() !== "PAID").reduce((sum: number, b: any) => sum + Number(b.amount || b.netAmount || 0), 0).toFixed(2)}
              </h4>
            </div>
            <div className="border border-slate-100 rounded-2xl bg-white p-5 shadow-xs">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Total Bills Issued</span>
              <h4 className="text-2xl font-extrabold text-[#0F4C81] mt-1">
                {invoices.length}
              </h4>
            </div>
          </div>

          {/* Bills Table */}
          <div className="border border-slate-100 rounded-3xl bg-white overflow-hidden shadow-sm">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
              <h4 className="text-xs font-bold uppercase tracking-wide text-[#0F4C81]">All Community Resident Bills</h4>
              <span className="text-xs font-bold text-slate-400">{invoices.length} Record(s)</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-bold uppercase border-b border-slate-100">
                  <tr>
                    <th className="px-6 py-3">Bill #</th>
                    <th className="px-6 py-3">Flat</th>
                    <th className="px-6 py-3">Resident</th>
                    <th className="px-6 py-3">Usage (L)</th>
                    <th className="px-6 py-3">Amount</th>
                    <th className="px-6 py-3">Status</th>
                    <th className="px-6 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-600 font-medium">
                  {invoices.length > 0 ? (
                    invoices.map((bill: any, idx: number) => (
                      <tr key={bill.id || idx} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-3 font-bold text-[#0F4C81]">{bill.billNumber || bill.billNo || bill.invoiceNo || `BILL-${bill.id || idx + 100}`}</td>
                        <td className="px-6 py-3 font-bold text-slate-800">Flat {bill.flatNumber || bill.flat || "A-101"}</td>
                        <td className="px-6 py-3">{bill.residentName || "Resident"}</td>
                        <td className="px-6 py-3 text-[#00B4D8] font-bold">{bill.totalUsage || bill.usageLitres || "0"} L</td>
                        <td className="px-6 py-3 font-extrabold text-slate-900">₹{bill.amount || bill.netAmount || "0.00"}</td>
                        <td className="px-6 py-3">
                          <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wider ${
                            (bill.status || "").toUpperCase() === "PAID" ? "bg-emerald-50 text-emerald-600 border border-emerald-100" : "bg-amber-50 text-amber-600 border border-amber-100"
                          }`}>
                            {bill.status || "UNPAID"}
                          </span>
                        </td>
                        <td className="px-6 py-3 text-right space-x-2">
                          {(bill.status || "").toUpperCase() !== "PAID" && (
                            <button
                              onClick={() => setRecordPaymentBill({
                                id: bill.id,
                                billNumber: bill.billNumber || bill.billNo || `BILL-${bill.id}`,
                                residentName: bill.residentName,
                                amount: bill.amount || bill.netAmount,
                                flatNumber: bill.flatNumber || bill.flat
                              })}
                              className="px-2.5 py-1 text-[10px] font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg shadow-xs transition-all cursor-pointer"
                            >
                              Record Payment
                            </button>
                          )}
                          <a
                            href={`${api.defaults.baseURL}/api/water/bills/${bill.id}/pdf`}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-bold text-[#0F4C81] bg-slate-100 hover:bg-slate-200 rounded-lg transition-all cursor-pointer"
                          >
                            <FileText className="h-3 w-3" /> PDF
                          </a>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="px-6 py-8 text-center text-slate-400">No bills generated yet. Click "Generate Bills" above to issue new resident bills.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Payment Ledger / History Panel */}
          <div className="border border-slate-100 rounded-3xl bg-white p-6 shadow-sm">
            <PaymentHistoryPanel />
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* TARIFF PLANS TAB */}
      {/* ═══════════════════════════════════════════════════════════ */}
      {currentTab === "tariff-plans" && (
        <div className="space-y-6 animate-fade-in text-[#1F2937]">
          <div className="flex justify-between items-center border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-lg font-bold text-[#0F4C81]">Community Tiered Tariff Governance</h3>
              <p className="text-xs text-slate-500">Configure tiered unit rates, base slab limits, service fees, tax percentages, and late payment penalties per apartment</p>
            </div>
            <button onClick={() => setSearchParams({})} className="text-xs font-bold text-[#00B4D8] hover:underline cursor-pointer">Back to Dashboard</button>
          </div>

          {/* Division Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Division 1: Tiered Consumption Rates */}
            <div className="border border-slate-100 rounded-3xl bg-white p-6 shadow-sm space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                <div className="h-8 w-8 rounded-xl bg-cyan-50 text-[#00B4D8] flex items-center justify-center font-extrabold text-sm">1</div>
                <div>
                  <h4 className="text-xs font-extrabold text-[#0F4C81] uppercase tracking-wider">Tiered Tariff Engine</h4>
                  <p className="text-[10px] text-slate-400">Volumetric rates per household tier</p>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center p-2.5 rounded-xl bg-cyan-50/50 border border-cyan-100">
                  <div>
                    <span className="text-xs font-bold text-slate-700 block">Tier 1 (Base Range)</span>
                    <span className="text-[10px] text-slate-400">First 0 - {(parseFloat(billingSettings.tier1LimitLitres || "10000") / 1000).toFixed(0)} kL ({billingSettings.tier1LimitLitres || "10000"} L)</span>
                  </div>
                  <span className="text-sm font-extrabold text-[#00B4D8]">₹{billingSettings.tier1Rate || billingSettings.tariffRate}/L</span>
                </div>
                <div className="flex justify-between items-center p-2.5 rounded-xl bg-purple-50/50 border border-purple-100">
                  <div>
                    <span className="text-xs font-bold text-slate-700 block">Tier 2 (High Usage)</span>
                    <span className="text-[10px] text-slate-400">Beyond {(parseFloat(billingSettings.tier1LimitLitres || "10000") / 1000).toFixed(0)} kL ({billingSettings.tier1LimitLitres || "10000"} L)</span>
                  </div>
                  <span className="text-sm font-extrabold text-purple-600">₹{billingSettings.tier2Rate || "8.00"}/L</span>
                </div>
              </div>
            </div>

            {/* Division 2: Fixed & Maintenance Charges */}
            <div className="border border-slate-100 rounded-3xl bg-white p-6 shadow-sm space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                <div className="h-8 w-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-extrabold text-sm">2</div>
                <div>
                  <h4 className="text-xs font-extrabold text-[#0F4C81] uppercase tracking-wider">Fixed Charges & Infrastructure</h4>
                  <p className="text-[10px] text-slate-400">Pipeline & maintenance fees</p>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-xs font-semibold text-slate-600">Fixed Service Charge</span>
                  <span className="text-sm font-extrabold text-emerald-600">₹{billingSettings.fixedServiceCharge}</span>
                </div>
                <div className="flex justify-between items-center p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-xs font-semibold text-slate-600">Min Monthly Floor Charge</span>
                  <span className="text-sm font-extrabold text-purple-600">₹{billingSettings.minimumMonthlyCharge}</span>
                </div>
              </div>
            </div>

            {/* Division 3: Taxes & Governance */}
            <div className="border border-slate-100 rounded-3xl bg-white p-6 shadow-sm space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                <div className="h-8 w-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-extrabold text-sm">3</div>
                <div>
                  <h4 className="text-xs font-extrabold text-[#0F4C81] uppercase tracking-wider">Taxes & Penalty Governance</h4>
                  <p className="text-[10px] text-slate-400">Government taxes & overdue fees</p>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-xs font-semibold text-slate-600">Tax Percentage</span>
                  <span className="text-sm font-extrabold text-[#0F4C81]">{billingSettings.taxRate}%</span>
                </div>
                <div className="flex justify-between items-center p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-xs font-semibold text-slate-600">Overdue Penalty / Late Fee</span>
                  <span className="text-sm font-extrabold text-amber-600">₹{billingSettings.lateFeeRate}</span>
                </div>
              </div>
            </div>

          </div>

          {/* Real-time Tariff Structure Editor Form */}
          <div className="border border-slate-100 rounded-3xl bg-white p-6 shadow-sm space-y-4">
            <h4 className="text-sm font-bold text-[#0F4C81] flex items-center gap-2 border-b border-slate-100 pb-3">
              <FileText className="h-4 w-4 text-[#00B4D8]" /> Edit Household Tiered Tariff Rates & Rules
            </h4>
            <form onSubmit={handleSaveBillingSettings} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* Section A */}
                <div className="space-y-3 bg-slate-50/50 p-4 rounded-2xl border border-slate-100">
                  <h5 className="text-[11px] font-extrabold text-[#00B4D8] uppercase tracking-wider">A. Tiered Rate Engine</h5>
                  <div>
                    <label className="text-xs font-bold text-slate-500 block mb-1">Tier 1 Threshold Limit (Litres)</label>
                    <input type="number" value={billingSettings.tier1LimitLitres} onChange={(e) => setBillingSettings({ ...billingSettings, tier1LimitLitres: e.target.value })} className="w-full border border-slate-200 bg-white rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#00B4D8]/20 font-bold text-slate-800" placeholder="10000 (10 kL)" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500 block mb-1">Tier 1 Base Rate (₹/L, 0-10 kL)</label>
                    <input type="number" step="0.01" value={billingSettings.tier1Rate} onChange={(e) => setBillingSettings({ ...billingSettings, tier1Rate: e.target.value, tariffRate: e.target.value })} className="w-full border border-slate-200 bg-white rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#00B4D8]/20 font-bold text-[#00B4D8]" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500 block mb-1">Tier 2 Excess Rate (₹/L, &gt;10 kL)</label>
                    <input type="number" step="0.01" value={billingSettings.tier2Rate} onChange={(e) => setBillingSettings({ ...billingSettings, tier2Rate: e.target.value })} className="w-full border border-slate-200 bg-white rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#00B4D8]/20 font-bold text-purple-600" />
                  </div>
                </div>

                {/* Section B */}
                <div className="space-y-3 bg-slate-50/50 p-4 rounded-2xl border border-slate-100">
                  <h5 className="text-[11px] font-extrabold text-emerald-600 uppercase tracking-wider">B. Fixed Infrastructure</h5>
                  <div>
                    <label className="text-xs font-bold text-slate-500 block mb-1">Fixed Service Charge (₹)</label>
                    <input type="number" step="0.01" value={billingSettings.fixedServiceCharge} onChange={(e) => setBillingSettings({ ...billingSettings, fixedServiceCharge: e.target.value })} className="w-full border border-slate-200 bg-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#00B4D8]/20 font-bold text-slate-800" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500 block mb-1">Min Monthly Floor Charge (₹)</label>
                    <input type="number" step="0.01" value={billingSettings.minimumMonthlyCharge} onChange={(e) => setBillingSettings({ ...billingSettings, minimumMonthlyCharge: e.target.value })} className="w-full border border-slate-200 bg-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#00B4D8]/20 font-bold text-slate-800" />
                  </div>
                </div>

                {/* Section C */}
                <div className="space-y-3 bg-slate-50/50 p-4 rounded-2xl border border-slate-100">
                  <h5 className="text-[11px] font-extrabold text-amber-600 uppercase tracking-wider">C. Taxes & Overdue</h5>
                  <div>
                    <label className="text-xs font-bold text-slate-500 block mb-1">Tax Rate (%)</label>
                    <input type="number" step="0.01" value={billingSettings.taxRate} onChange={(e) => setBillingSettings({ ...billingSettings, taxRate: e.target.value })} className="w-full border border-slate-200 bg-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#00B4D8]/20 font-bold text-slate-800" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500 block mb-1">Overdue Penalty / Late Fee (₹)</label>
                    <input type="number" step="0.01" value={billingSettings.lateFeeRate} onChange={(e) => setBillingSettings({ ...billingSettings, lateFeeRate: e.target.value })} className="w-full border border-slate-200 bg-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#00B4D8]/20 font-bold text-slate-800" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500 block mb-1">Payment Due Window (Days)</label>
                    <input type="number" value={billingSettings.dueDateDays} onChange={(e) => setBillingSettings({ ...billingSettings, dueDateDays: e.target.value })} className="w-full border border-slate-200 bg-white rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#00B4D8]/20 font-bold text-slate-800" />
                  </div>
                </div>

              </div>

              <div className="flex justify-end pt-2">
                <button type="submit" disabled={savingSettings} className="bg-gradient-to-r from-[#00B4D8] to-[#0F4C81] text-white font-extrabold py-3 px-8 rounded-xl text-xs flex items-center gap-2 cursor-pointer disabled:opacity-50 shadow-md transition-all active:scale-95">
                  {savingSettings && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  Save & Publish Tiered Tariff Plan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* WATER PURCHASE TAB */}
      {/* ═══════════════════════════════════════════════════════════ */}
      {currentTab === "water-purchase" && (
        <div className="space-y-6 animate-fade-in text-[#1F2937]">
          <div className="flex justify-between items-center border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-lg font-bold text-[#0F4C81]">Water Purchase History</h3>
              <p className="text-xs text-slate-500">Track and log external bulk water supplier purchases</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowWaterPurchaseModal(true)}
                className="bg-gradient-to-r from-[#00B4D8] to-[#0F4C81] px-4 py-2 rounded-xl text-xs font-bold text-white shadow-md flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="h-4 w-4" /> Record Water Purchase
              </button>
              <button onClick={() => setSearchParams({})} className="text-xs font-bold text-[#00B4D8] hover:underline cursor-pointer">Back to Dashboard</button>
            </div>
          </div>

          {/* Water Purchase KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="border border-slate-100 rounded-2xl bg-white p-5 shadow-xs">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Total Purchased Volume</span>
              <h4 className="text-2xl font-extrabold text-[#00B4D8] mt-1">
                {(waterPurchases.reduce((acc: number, p: any) => acc + Number(p.volumeLitres || p.quantity || 0), 0) / 1000).toFixed(1)} kL
              </h4>
              <p className="text-[10px] text-slate-400 mt-1">{waterPurchases.reduce((acc: number, p: any) => acc + Number(p.volumeLitres || p.quantity || 0), 0).toLocaleString()} Litres total</p>
            </div>

            <div className="border border-slate-100 rounded-2xl bg-white p-5 shadow-xs">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Total Procurement Expenditure</span>
              <h4 className="text-2xl font-extrabold text-[#0F4C81] mt-1">
                ₹{waterPurchases.reduce((acc: number, p: any) => acc + Number(p.totalCost || p.cost || 0), 0).toFixed(2)}
              </h4>
              <p className="text-[10px] text-slate-400 mt-1">Tanker & Municipal Supply combined</p>
            </div>

            <div className="border border-slate-100 rounded-2xl bg-white p-5 shadow-xs">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Average Unit Cost</span>
              <h4 className="text-2xl font-extrabold text-purple-600 mt-1">
                ₹{(() => {
                  const vol = waterPurchases.reduce((acc: number, p: any) => acc + Number(p.volumeLitres || p.quantity || 0), 0);
                  const cost = waterPurchases.reduce((acc: number, p: any) => acc + Number(p.totalCost || p.cost || 0), 0);
                  return vol > 0 ? ((cost / vol) * 1000).toFixed(2) : "0.00";
                })()}/kL
              </h4>
              <p className="text-[10px] text-slate-400 mt-1">Cost per 1,000 Litres</p>
            </div>

            <div className="border border-slate-100 rounded-2xl bg-white p-5 shadow-xs">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Active Suppliers & Vendors</span>
              <h4 className="text-2xl font-extrabold text-emerald-600 mt-1">
                {new Set(waterPurchases.map((p: any) => p.supplier)).size} Supplier(s)
              </h4>
              <p className="text-[10px] text-slate-400 mt-1">{waterPurchases.length} total deliveries logged</p>
            </div>
          </div>

          <div className="border border-slate-100 rounded-3xl bg-white overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-bold uppercase border-b border-slate-100">
                  <tr>
                    <th className="px-6 py-4">Delivery Date</th>
                    <th className="px-6 py-4">Supplier / Source</th>
                    <th className="px-6 py-4">Volume (Litres)</th>
                    <th className="px-6 py-4">Unit Cost (₹/L & ₹/kL)</th>
                    <th className="px-6 py-4">Total Cost (₹)</th>
                    <th className="px-6 py-4">Invoice / Ref No.</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-600 font-medium">
                  {waterPurchases.length > 0 ? (
                    waterPurchases.map((p: any, idx: number) => {
                      const vol = Number(p.volumeLitres || p.quantity || 0);
                      const cost = Number(p.totalCost || p.cost || 0);
                      const unitCostL = vol > 0 ? (cost / vol).toFixed(2) : "0.00";
                      const unitCostKl = vol > 0 ? ((cost / vol) * 1000).toFixed(0) : "0";
                      return (
                        <tr key={p.id || idx} className="hover:bg-slate-50/50">
                          <td className="px-6 py-4 font-semibold">{p.purchaseDate || p.date}</td>
                          <td className="px-6 py-4 text-slate-800 font-bold flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase bg-cyan-50 text-[#00B4D8] border border-cyan-100">
                              {p.supplier?.toLowerCase().includes("municipal") ? "Municipal" : "Tanker"}
                            </span>
                            {p.supplier || "Water Supplier"}
                          </td>
                          <td className="px-6 py-4 font-bold text-[#00B4D8]">
                            {vol.toLocaleString()} L <span className="text-[10px] text-slate-400 font-normal">({(vol/1000).toFixed(1)} kL)</span>
                          </td>
                          <td className="px-6 py-4 font-semibold text-purple-700">
                            ₹{unitCostL}/L <span className="text-[10px] text-slate-400 font-normal">(₹{unitCostKl}/kL)</span>
                          </td>
                          <td className="px-6 py-4 font-extrabold text-slate-900">₹{cost.toFixed(2)}</td>
                          <td className="px-6 py-4 text-slate-400 text-[10px] font-mono">{p.invoiceReference || `INV-PUR-${p.id || idx + 1}`}</td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={6} className="px-6 py-8 text-center text-slate-400">No bulk water purchase records found. Click "Record Water Purchase" to track tanker & municipal procurement.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Record Water Purchase Modal */}
          <AnimatePresence>
            {showWaterPurchaseModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 overflow-y-auto">
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="border border-slate-100 rounded-3xl bg-white p-6 w-full max-w-lg space-y-4 shadow-2xl text-slate-800"
                >
                  <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                    <h4 className="text-sm font-bold text-[#0F4C81] flex items-center gap-2">
                      <ShoppingCart className="h-4 w-4 text-[#00B4D8]" /> Record Bulk Water Procurement
                    </h4>
                    <button onClick={() => setShowWaterPurchaseModal(false)} className="text-slate-400 hover:text-slate-600">
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                  <form onSubmit={handleRecordWaterPurchase} className="space-y-4">
                    <div>
                      <label className="text-xs font-bold text-slate-500 block mb-1">Supplier / Procurement Source</label>
                      <input type="text" placeholder="e.g. Tanker Delivery / Municipal Water Board" value={purchaseSupplier} onChange={(e) => setPurchaseSupplier(e.target.value)} className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#00B4D8]/20 font-medium" required />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-bold text-slate-500 block mb-1">Delivery / Procurement Date</label>
                        <input type="date" value={purchaseDate} onChange={(e) => setPurchaseDate(e.target.value)} className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#00B4D8]/20 font-medium" required />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-slate-500 block mb-1">Purchased Volume (Litres)</label>
                        <input type="number" placeholder="10000" value={purchaseVolume} onChange={(e) => setPurchaseVolume(e.target.value)} className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#00B4D8]/20 font-bold text-[#00B4D8]" required />
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-500 block mb-1">Total Procurement Cost (₹)</label>
                      <input type="number" step="0.01" placeholder="5000.00" value={purchaseCost} onChange={(e) => setPurchaseCost(e.target.value)} className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#00B4D8]/20 font-bold text-slate-900" required />
                    </div>
                    {purchaseVolume && purchaseCost && (
                      <div className="p-3 bg-purple-50 border border-purple-100 rounded-xl flex justify-between items-center text-xs">
                        <span className="font-semibold text-purple-700">Calculated Unit Cost:</span>
                        <span className="font-extrabold text-purple-900">
                          ₹{(Number(purchaseCost) / Number(purchaseVolume)).toFixed(2)}/L &nbsp;|&nbsp; ₹{((Number(purchaseCost) / Number(purchaseVolume)) * 1000).toFixed(0)}/kL
                        </span>
                      </div>
                    )}
                    <div>
                      <label className="text-xs font-bold text-slate-500 block mb-1">Invoice / Delivery Voucher Ref</label>
                      <input type="text" placeholder="e.g. VOUCHER-98765" value={purchaseNotes} onChange={(e) => setPurchaseNotes(e.target.value)} className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#00B4D8]/20" />
                    </div>
                    <button
                      type="submit"
                      disabled={savingPurchase}
                      className="w-full bg-gradient-to-r from-[#00B4D8] to-[#0F4C81] text-white font-extrabold py-3 rounded-xl text-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 shadow-md transition-all active:scale-95"
                    >
                      {savingPurchase && <Loader2 className="h-4 w-4 animate-spin" />}
                      Save & Log Bulk Water Procurement
                    </button>
                  </form>
                </motion.div>
              </div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* INVOICES TAB */}
      {/* ═══════════════════════════════════════════════════════════ */}
      {currentTab === "invoices" && (
        <div className="space-y-6 animate-fade-in text-[#1F2937]">
          <div className="flex justify-between items-center border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-lg font-bold text-[#0F4C81]">Community Invoices Database</h3>
              <p className="text-xs text-slate-500">Neat database of all invoices generated for community residents with status & PDF options</p>
            </div>
            <button onClick={() => setSearchParams({})} className="text-xs font-bold text-[#00B4D8] hover:underline cursor-pointer">Back to Dashboard</button>
          </div>

          <div className="border border-slate-100 rounded-3xl bg-white overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-bold uppercase border-b border-slate-100">
                  <tr>
                    <th className="px-6 py-4">Invoice #</th>
                    <th className="px-6 py-4">Flat No</th>
                    <th className="px-6 py-4">Resident Name</th>
                    <th className="px-6 py-4">Usage (L)</th>
                    <th className="px-6 py-4">Amount</th>
                    <th className="px-6 py-4">Billing Date</th>
                    <th className="px-6 py-4">Payment Status</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-600 font-medium">
                  {(invoices.length > 0 ? invoices : pendingBillsTable).length > 0 ? (
                    (invoices.length > 0 ? invoices : pendingBillsTable).map((inv: any, idx: number) => (
                      <tr key={inv.id || idx} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4 font-extrabold text-[#0F4C81]">{inv.invoiceNo || inv.billNo || `INV-${inv.id || idx + 100}`}</td>
                        <td className="px-6 py-4 font-bold text-slate-800">Flat {inv.flat || inv.flatNumber || "A-101"}</td>
                        <td className="px-6 py-4 font-semibold text-slate-700">{inv.residentName || "Resident"}</td>
                        <td className="px-6 py-4 text-[#00B4D8] font-bold">{inv.usageLitres || inv.totalUsage || "1200"} L</td>
                        <td className="px-6 py-4 font-extrabold text-slate-900">₹{inv.amount || inv.netAmount || "60.00"}</td>
                        <td className="px-6 py-4 text-slate-500">{inv.date || inv.billingMonth || "Current Cycle"}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2.5 py-1 rounded-full text-[9px] font-extrabold uppercase tracking-wider ${
                            (inv.status || "").toUpperCase() === "PAID" ? "bg-emerald-50 text-emerald-600 border border-emerald-100"
                            : (inv.status || "").toUpperCase() === "OVERDUE" ? "bg-rose-50 text-rose-500 border border-rose-100"
                            : "bg-amber-50 text-amber-600 border border-amber-100"
                          }`}>
                            {inv.status || "UNPAID"}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <a
                            href={`${api.defaults.baseURL}/api/water/bills/${inv.id}/pdf`}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 px-3 py-1.5 text-[10px] font-bold text-white bg-gradient-to-r from-[#00B4D8] to-[#0F4C81] hover:from-[#0096B4] hover:to-[#0A3860] rounded-xl shadow-xs transition-all cursor-pointer"
                          >
                            <FileText className="h-3 w-3" /> PDF Invoice
                          </a>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={8} className="px-6 py-8 text-center text-slate-400">No invoices found in database. Click "Generate Bills" to issue invoices.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* ALERTS TAB */}
      {/* ═══════════════════════════════════════════════════════════ */}
      {currentTab === "alerts" && (
        <div className="space-y-6 animate-fade-in text-[#1F2937]">
          <div className="flex justify-between items-center border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-lg font-bold text-[#0F4C81]">Alerts & Notifications</h3>
              <p className="text-xs text-slate-500">Leak alerts, usage anomalies, and system notifications</p>
            </div>
            <button onClick={() => setSearchParams({})} className="text-xs font-bold text-[#00B4D8] hover:underline cursor-pointer">Back to Dashboard</button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="border border-slate-100 rounded-2xl bg-white p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="h-5 w-5 text-rose-500" />
                <h4 className="text-sm font-bold text-slate-800">Active Leak Alerts</h4>
              </div>
              <p className="text-3xl font-extrabold text-rose-500"><AnimatedCounter value={stats?.activeAlerts || 0} /></p>
              <p className="text-xs text-slate-400 mt-1">{stats?.activeAlerts > 0 ? "Requires immediate attention" : "No active leak alerts"}</p>
            </div>
            <div className="border border-slate-100 rounded-2xl bg-white p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <Bell className="h-5 w-5 text-[#FFB703]" />
                <h4 className="text-sm font-bold text-slate-800">Pending Notifications</h4>
              </div>
              <p className="text-3xl font-extrabold text-[#FFB703]"><AnimatedCounter value={pendingRequests.length} /></p>
              <p className="text-xs text-slate-400 mt-1">Resident join requests awaiting action</p>
            </div>
          </div>

          <div className="border border-slate-100 rounded-3xl bg-white p-6 shadow-sm">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-4">Recent Alerts</h4>
            <div className="space-y-3">
              {(stats?.leakAlertsList || []).length > 0 ? (
                (stats.leakAlertsList as any[]).map((alert: any, idx: number) => (
                  <div key={idx} className="flex items-start gap-3 p-3 rounded-xl bg-rose-50/50 border border-rose-100">
                    <AlertCircle className="h-4 w-4 text-rose-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs font-bold text-slate-800">Flat {alert.flat} — {alert.name}</p>
                      <p className="text-[10px] text-slate-500">Abnormal usage of {alert.usage} L detected</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center text-slate-400 text-sm py-8">No recent alerts to display.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* REPORTS TAB */}
      {/* ═══════════════════════════════════════════════════════════ */}
      {currentTab === "reports" && (
        <div className="space-y-6 animate-fade-in text-[#1F2937]">
          <ReportsPage />
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* VISUALIZATIONS TAB — PREMIUM ANALYTICS HUB */}
      {/* ═══════════════════════════════════════════════════════════ */}
      {currentTab === "visualizations" && (
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
                Analytics Hub
              </h2>
              <p className="text-xs text-slate-500 mt-1">Real-time community resource trends and financial insights</p>
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
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Total Consumption</span>
              <h4 className="text-2xl font-extrabold text-[#00B4D8]"><AnimatedCounter value={stats?.totalWaterUsed || 0} suffix=" L" /></h4>
              <span className="block text-[10px] text-slate-400">Total volume logged this period</span>
            </div>
            <div className="clay-card p-5 glow-border space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Revenue Collected</span>
              <h4 className="text-2xl font-extrabold text-[#2ECC71]">₹<AnimatedCounter value={stats?.totalRevenue || 0} /></h4>
              <span className="block text-[10px] text-slate-400">From settled invoices</span>
            </div>
            <div className="clay-card p-5 glow-border space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Outstanding Dues</span>
              <h4 className="text-2xl font-extrabold text-amber-500">₹<AnimatedCounter value={stats?.totalOutstanding || 0} /></h4>
              <span className="block text-[10px] text-slate-400">Unpaid invoice balances</span>
            </div>
            <div className="clay-card p-5 glow-border space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Active Residents</span>
              <h4 className="text-2xl font-extrabold text-[#0F4C81]"><AnimatedCounter value={stats?.totalUsers || 0} /></h4>
              <span className="block text-[10px] text-slate-400">Registered community members</span>
            </div>
          </motion.div>

          {/* Chart 1: Monthly Water Consumption AreaChart */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="chart-container p-5"
          >
            <h3 className="text-xs font-bold tracking-wide uppercase text-slate-500 mb-4">Monthly Water Consumption</h3>
            <div className="h-[280px] w-full">
              {monthlyConsumption.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={monthlyConsumption} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
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
            {/* Chart 2: Resident Water Usage Share PieChart */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="chart-container p-5"
            >
              <h3 className="text-xs font-bold tracking-wide uppercase text-slate-500 mb-4">Resident Water Usage Share</h3>
              <div className="h-[260px] w-full">
                {residentUsageDistribution.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={residentUsageDistribution}
                        cx="50%"
                        cy="50%"
                        outerRadius={90}
                        paddingAngle={3}
                        dataKey="usage"
                        label={({ name, percent }: any) => `${name || ""} ${(percent * 100).toFixed(0)}%`}
                        labelLine={false}
                        style={{ fontSize: "9px" }}
                      >
                        {residentUsageDistribution.map((_: any, index: number) => (
                          <Cell key={`pie2-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={TOOLTIP_STYLE} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-slate-400 text-xs">No resident usage data.</div>
                )}
              </div>
            </motion.div>

            {/* Chart 3: Revenue vs Outstanding BarChart */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="chart-container p-5"
            >
              <h3 className="text-xs font-bold tracking-wide uppercase text-slate-500 mb-4">Revenue vs Outstanding Dues</h3>
              <div className="h-[260px] w-full">
                {revenueVsOutstanding.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={revenueVsOutstanding} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                      <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} tickLine={false} />
                      <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} />
                      <Tooltip contentStyle={TOOLTIP_STYLE} />
                      <Bar dataKey="revenue" fill="#2ECC71" radius={[4, 4, 0, 0]} name="Revenue (₹)" />
                      <Bar dataKey="outstanding" fill="#FFB703" radius={[4, 4, 0, 0]} name="Outstanding (₹)" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-slate-400 text-xs">No revenue data available.</div>
                )}
              </div>
            </motion.div>
          </div>

          {/* Chart 4 & 5 Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Chart 4: Water Loss Analysis AreaChart */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.5 }}
              className="chart-container p-5"
            >
              <h3 className="text-xs font-bold tracking-wide uppercase text-slate-500 mb-4">Water Loss Analysis — Purchased vs Consumed</h3>
              <div className="h-[260px] w-full">
                {monthlyConsumption.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={monthlyConsumption} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="vizPurchGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#0F4C81" stopOpacity={0.2} />
                          <stop offset="95%" stopColor="#0F4C81" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="vizConsGrad2" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#2ECC71" stopOpacity={0.2} />
                          <stop offset="95%" stopColor="#2ECC71" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                      <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} tickLine={false} />
                      <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} />
                      <Tooltip contentStyle={TOOLTIP_STYLE} />
                      <Area type="monotone" dataKey="purchased" stroke="#0F4C81" strokeWidth={2} fillOpacity={1} fill="url(#vizPurchGrad)" name="Purchased (L)" />
                      <Area type="monotone" dataKey="usage" stroke="#2ECC71" strokeWidth={2} fillOpacity={1} fill="url(#vizConsGrad2)" name="Consumed (L)" />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-slate-400 text-xs">No water loss data available.</div>
                )}
              </div>
            </motion.div>

            {/* Chart 5: Invoice Settlement Status Donut */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.6 }}
              className="chart-container p-5"
            >
              <h3 className="text-xs font-bold tracking-wide uppercase text-slate-500 mb-4">Invoice Settlement Status</h3>
              <div className="h-[220px] w-full flex items-center justify-center">
                {invoiceSettlement.length > 0 && (invoiceSettlement[0]?.value > 0 || invoiceSettlement[1]?.value > 0) ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={invoiceSettlement}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={85}
                        paddingAngle={4}
                        dataKey="value"
                      >
                        {invoiceSettlement.map((_: any, idx: number) => (
                          <Cell key={`settle-${idx}`} fill={COLORS[idx % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={TOOLTIP_STYLE} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="text-slate-400 text-xs">No invoice settlement data.</div>
                )}
              </div>
              <div className="flex justify-center gap-5 text-[10px] text-slate-500 font-bold mt-2">
                <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-[#00B4D8]"></span>Settled</span>
                <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-[#0F4C81]"></span>Pending</span>
              </div>
            </motion.div>
          </div>

          {/* Chart 6: Top Water Consuming Residents Horizontal BarChart */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.7 }}
            className="chart-container p-5"
          >
            <h3 className="text-xs font-bold tracking-wide uppercase text-slate-500 mb-4">Top Water Consuming Residents</h3>
            <div className="h-[280px] w-full">
              {topConsumers.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={topConsumers} layout="vertical" margin={{ top: 5, right: 20, left: 60, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                    <XAxis type="number" stroke="#94a3b8" fontSize={10} tickLine={false} />
                    <YAxis type="category" dataKey="flat" stroke="#94a3b8" fontSize={10} tickLine={false} width={50} />
                    <Tooltip contentStyle={TOOLTIP_STYLE} />
                    <Bar dataKey="usage" radius={[0, 5, 5, 0]} name="Usage (L)">
                      {topConsumers.map((_: any, index: number) => (
                        <Cell key={`top-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-slate-400 text-xs">No consumer data available.</div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* PROFILE TAB */}
      {/* ═══════════════════════════════════════════════════════════ */}
      {currentTab === "profile" && (
        <div className="space-y-6 animate-fade-in text-[#1F2937]">
          <div className="flex justify-between items-center border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-lg font-bold text-[#0F4C81]">Admin Profile</h3>
              <p className="text-xs text-slate-500">Your account information and community details</p>
            </div>
            <button onClick={() => setSearchParams({})} className="text-xs font-bold text-[#00B4D8] hover:underline cursor-pointer">Back to Dashboard</button>
          </div>

          <div className="border border-slate-100 rounded-3xl bg-white p-8 shadow-sm">
            <div className="flex items-center gap-6">
              <div className="h-20 w-20 rounded-full bg-gradient-to-br from-[#00B4D8] to-[#0F4C81] flex items-center justify-center text-white text-2xl font-extrabold shadow-lg">
                {(stats?.adminName || "A").charAt(0).toUpperCase()}
              </div>
              <div>
                <h4 className="text-xl font-extrabold text-[#0F4C81]">{stats?.adminName || "Community Admin"}</h4>
                <p className="text-sm text-slate-500">{stats?.adminEmail || "admin@community.com"}</p>
                <span className="inline-block mt-2 px-3 py-1 rounded-full text-[10px] font-bold uppercase bg-[#00B4D8]/10 text-[#00B4D8] border border-[#00B4D8]/20">
                  Community Admin
                </span>
              </div>
            </div>

            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="border border-slate-100 rounded-xl p-4">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Community</span>
                <p className="text-sm font-bold text-slate-800 mt-1">{stats?.communityName || "N/A"}</p>
              </div>
              <div className="border border-slate-100 rounded-xl p-4">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Total Residents</span>
                <p className="text-sm font-bold text-slate-800 mt-1">{stats?.totalUsers || 0}</p>
              </div>
              <div className="border border-slate-100 rounded-xl p-4">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Role</span>
                <p className="text-sm font-bold text-slate-800 mt-1">ADMIN</p>
              </div>
              <div className="border border-slate-100 rounded-xl p-4">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Account Status</span>
                <p className="text-sm font-bold text-emerald-600 mt-1">Active</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {currentTab === "announcements" && (
        <div className="space-y-6 animate-fade-in text-[#1F2937]">
          <AnnouncementCenter />
        </div>
      )}

      {currentTab === "audit-logs" && (
        <div className="space-y-6 animate-fade-in text-[#1F2937]">
          <AuditLogViewer />
        </div>
      )}

      {currentTab === "billing-cycles" && (
        <div className="space-y-6 animate-fade-in text-[#1F2937]">
          <BillingCycleManager />
        </div>
      )}

      {/* Register / Edit Resident Modal */}
      <AnimatePresence>
        {showResModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 overflow-y-auto">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="border border-slate-100 dark:border-slate-800 rounded-[28px] bg-white dark:bg-[#0c1929] p-6 w-full max-w-2xl space-y-4 shadow-2xl text-slate-800 dark:text-slate-100 my-8"
            >
              <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
                <h3 className="text-base font-bold text-[#0F4C81] dark:text-[#00B4D8]">{editingRes ? "Edit Resident Profile" : "Register New Resident"}</h3>
                <button onClick={() => setShowResModal(false)} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-900 cursor-pointer font-bold text-lg">×</button>
              </div>

              <form onSubmit={handleResSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-semibold text-left max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                <div className="space-y-1">
                  <label className="block text-slate-500 font-bold">Full Name *</label>
                  <input 
                    type="text" 
                    value={resFullName} 
                    onChange={(e) => setResFullName(e.target.value)} 
                    placeholder="e.g. Aditi Sharma"
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-transparent rounded-xl px-3.5 py-2.5 text-slate-700 dark:text-slate-200"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-slate-500 font-bold">Email Address *</label>
                  <input 
                    type="email" 
                    value={resEmail} 
                    onChange={(e) => setResEmail(e.target.value)} 
                    placeholder="e.g. aditi@gmail.com"
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-transparent rounded-xl px-3.5 py-2.5 text-slate-700 dark:text-slate-200"
                    required
                    disabled={!!editingRes}
                  />
                </div>

                {!editingRes && (
                  <div className="space-y-1">
                    <label className="block text-slate-500 font-bold">Password *</label>
                    <input 
                      type="password" 
                      value={resPassword} 
                      onChange={(e) => setResPassword(e.target.value)} 
                      placeholder="Min 6 characters"
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-transparent rounded-xl px-3.5 py-2.5 text-slate-700 dark:text-slate-200"
                      required={!editingRes}
                    />
                  </div>
                )}

                <div className="space-y-1">
                  <label className="block text-slate-500 font-bold">Phone Number</label>
                  <input 
                    type="text" 
                    value={resPhone} 
                    onChange={(e) => setResPhone(e.target.value)} 
                    placeholder="e.g. +91 98765 43210"
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-transparent rounded-xl px-3.5 py-2.5 text-slate-700 dark:text-slate-200"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-slate-500 font-bold">Gender</label>
                  <select 
                    value={resGender} 
                    onChange={(e) => setResGender(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-transparent rounded-xl px-3 py-2.5 text-slate-700 dark:text-slate-200"
                  >
                    <option value="MALE">MALE</option>
                    <option value="FEMALE">FEMALE</option>
                    <option value="OTHER">OTHER</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block text-slate-500 font-bold">Date of Birth</label>
                  <input 
                    type="date" 
                    value={resDOB} 
                    onChange={(e) => setResDOB(e.target.value)} 
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-transparent rounded-xl px-3.5 py-2.5 text-slate-700 dark:text-slate-200"
                  />
                </div>

                <div className="space-y-1 border-t border-slate-50 dark:border-slate-800 pt-3 md:col-span-2">
                  <span className="block text-[#00B4D8] font-bold text-xs uppercase tracking-wider mb-2">Location & Flat Details</span>
                </div>

                <div className="grid grid-cols-3 gap-2 md:col-span-2">
                  <div className="space-y-1">
                    <label className="block text-slate-500 font-bold">Building</label>
                    <input 
                      type="text" 
                      value={resBuilding} 
                      onChange={(e) => setResBuilding(e.target.value)} 
                      placeholder="e.g. Wing A"
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-transparent rounded-xl px-3.5 py-2.5 text-slate-700 dark:text-slate-200"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-slate-500 font-bold">Block</label>
                    <input 
                      type="text" 
                      value={resBlock} 
                      onChange={(e) => setResBlock(e.target.value)} 
                      placeholder="e.g. B2"
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-transparent rounded-xl px-3.5 py-2.5 text-slate-700 dark:text-slate-200"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-slate-500 font-bold">Floor</label>
                    <input 
                      type="number" 
                      value={resFloor} 
                      onChange={(e) => setResFloor(e.target.value)} 
                      placeholder="e.g. 4"
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-transparent rounded-xl px-3.5 py-2.5 text-slate-700 dark:text-slate-200"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-slate-500 font-bold">Flat Number *</label>
                  <input 
                    type="text" 
                    value={resFlatNumber} 
                    onChange={(e) => setResFlatNumber(e.target.value)} 
                    placeholder="e.g. 402"
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-transparent rounded-xl px-3.5 py-2.5 text-slate-700 dark:text-slate-200"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-slate-500 font-bold">Occupancy Type</label>
                  <select 
                    value={resOccupancyType} 
                    onChange={(e) => setResOccupancyType(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-transparent rounded-xl px-3 py-2.5 text-slate-700 dark:text-slate-200"
                  >
                    <option value="TENANT">TENANT</option>
                    <option value="OWNER">OWNER</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block text-slate-500 font-bold">Move-in Date</label>
                  <input 
                    type="date" 
                    value={resMoveInDate} 
                    onChange={(e) => setResMoveInDate(e.target.value)} 
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-transparent rounded-xl px-3.5 py-2.5 text-slate-700 dark:text-slate-200"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-slate-500 font-bold">Family Size</label>
                  <input 
                    type="number" 
                    value={resFamilySize} 
                    onChange={(e) => setResFamilySize(e.target.value)} 
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-transparent rounded-xl px-3.5 py-2.5 text-slate-700 dark:text-slate-200"
                  />
                </div>

                <div className="space-y-1 border-t border-slate-50 dark:border-slate-800 pt-3 md:col-span-2">
                  <span className="block text-[#00B4D8] font-bold text-xs uppercase tracking-wider mb-2">Utility & Balance Details</span>
                </div>

                <div className="space-y-1">
                  <label className="block text-slate-500 font-bold">Water Meter Number</label>
                  <input 
                    type="text" 
                    value={resMeterNumber} 
                    onChange={(e) => setResMeterNumber(e.target.value)} 
                    placeholder="e.g. MET-998811"
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-transparent rounded-xl px-3.5 py-2.5 text-slate-700 dark:text-slate-200"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-slate-500 font-bold">Initial Water Balance (₹)</label>
                  <input 
                    type="number" 
                    step="0.01"
                    value={resWaterBalance} 
                    onChange={(e) => setResWaterBalance(e.target.value)} 
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-transparent rounded-xl px-3.5 py-2.5 text-slate-700 dark:text-slate-200"
                  />
                </div>

                <div className="space-y-1 border-t border-slate-50 dark:border-slate-800 pt-3 md:col-span-2">
                  <span className="block text-[#00B4D8] font-bold text-xs uppercase tracking-wider mb-2">Emergency Details</span>
                </div>

                <div className="space-y-1">
                  <label className="block text-slate-500 font-bold">Emergency Contact Name</label>
                  <input 
                    type="text" 
                    value={resEmergencyName} 
                    onChange={(e) => setResEmergencyName(e.target.value)} 
                    placeholder="Contact person name"
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-transparent rounded-xl px-3.5 py-2.5 text-slate-700 dark:text-slate-200"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-slate-500 font-bold">Emergency Phone</label>
                  <input 
                    type="text" 
                    value={resEmergencyPhone} 
                    onChange={(e) => setResEmergencyPhone(e.target.value)} 
                    placeholder="Contact number"
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-transparent rounded-xl px-3.5 py-2.5 text-slate-700 dark:text-slate-200"
                  />
                </div>

                <div className="space-y-1 md:col-span-2">
                  <label className="block text-slate-500 font-bold">General Address</label>
                  <textarea 
                    value={resAddress} 
                    onChange={(e) => setResAddress(e.target.value)} 
                    placeholder="Detailed mailing address..."
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-transparent rounded-xl px-3.5 py-2.5 text-slate-700 dark:text-slate-200 h-16 resize-none"
                  />
                </div>

                <div className="flex gap-4 pt-3.5 justify-end border-t border-slate-100 dark:border-slate-800 md:col-span-2">
                  <button 
                    type="button" 
                    onClick={() => setShowResModal(false)}
                    className="px-4 py-2 border border-slate-200 dark:border-slate-800 rounded-xl hover:bg-slate-50 text-slate-600"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="px-5 py-2 bg-[#00B4D8] hover:bg-[#0F4C81] text-white rounded-xl shadow-md"
                  >
                    Save Resident
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Transfer Unit Modal */}
      <AnimatePresence>
        {showTransferModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="border border-slate-100 dark:border-slate-800 rounded-[28px] bg-white dark:bg-[#0c1929] p-6 w-full max-w-md space-y-4 shadow-2xl text-slate-800 dark:text-slate-100 relative"
            >
              <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
                <h3 className="text-base font-bold text-[#0F4C81] dark:text-[#00B4D8]">Transfer Flat / Unit</h3>
                <button onClick={() => setShowTransferModal(false)} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-900 cursor-pointer">×</button>
              </div>

              <div className="p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/30 text-amber-600 dark:text-amber-400 rounded-xl text-xs font-semibold">
                WARNING: Occupancy transfer checks if the target unit is already occupied by an active resident to prevent conflicts.
              </div>

              <form onSubmit={handleTransferSubmit} className="space-y-4 text-xs font-semibold text-left">
                <div className="grid grid-cols-3 gap-2">
                  <div className="space-y-1">
                    <label className="block text-slate-500 font-bold">Building</label>
                    <input 
                      type="text" 
                      value={transBuilding} 
                      onChange={(e) => setTransBuilding(e.target.value)} 
                      placeholder="e.g. A"
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-transparent rounded-xl px-3 py-2.5 text-slate-700 dark:text-slate-200"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-slate-500 font-bold">Block</label>
                    <input 
                      type="text" 
                      value={transBlock} 
                      onChange={(e) => setTransBlock(e.target.value)} 
                      placeholder="e.g. B2"
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-transparent rounded-xl px-3 py-2.5 text-slate-700 dark:text-slate-200"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-slate-500 font-bold">Floor</label>
                    <input 
                      type="number" 
                      value={transFloor} 
                      onChange={(e) => setTransFloor(e.target.value)} 
                      placeholder="e.g. 5"
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-transparent rounded-xl px-3 py-2.5 text-slate-700 dark:text-slate-200"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-slate-500 font-bold">Flat Number *</label>
                  <input 
                    type="text" 
                    value={transFlat} 
                    onChange={(e) => setTransFlat(e.target.value)} 
                    placeholder="e.g. 503"
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-transparent rounded-xl px-3.5 py-2.5 text-slate-700 dark:text-slate-200"
                    required
                  />
                </div>

                <div className="flex gap-4 pt-3.5 justify-end border-t border-slate-100 dark:border-slate-800">
                  <button 
                    type="button" 
                    onClick={() => setShowTransferModal(false)}
                    className="px-4 py-2 border border-slate-200 dark:border-slate-800 rounded-xl hover:bg-slate-50 text-slate-600"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="px-5 py-2 bg-[#00B4D8] hover:bg-[#0F4C81] text-white rounded-xl shadow-md"
                  >
                    Confirm Transfer
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* CSV Bulk Import Modal */}
      <AnimatePresence>
        {showImportModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="border border-slate-100 dark:border-slate-800 rounded-[28px] bg-white dark:bg-[#0c1929] p-6 w-full max-w-lg space-y-4 shadow-2xl text-slate-800 dark:text-slate-100 relative"
            >
              <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
                <h3 className="text-base font-bold text-[#0F4C81] dark:text-[#00B4D8]">Bulk Import Residents via CSV</h3>
                <button onClick={() => setShowImportModal(false)} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-900 cursor-pointer font-bold text-lg">×</button>
              </div>

              <form onSubmit={handleImportSubmit} className="space-y-4 text-xs font-semibold text-left">
                <div className="space-y-1">
                  <label className="block text-slate-500 font-bold">Select CSV File</label>
                  <input 
                    type="file" 
                    onChange={(e) => setImportFile(e.target.files?.[0] || null)}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-transparent rounded-xl px-3 py-2.5 text-slate-700 dark:text-slate-200"
                    accept=".csv"
                    required
                  />
                  <span className="block text-[10px] text-slate-400 mt-1">Headers required: Full Name, Email Address, Flat Number, Occupancy Type. Optional: Phone Number, Building, Block, Floor, Meter Number.</span>
                </div>

                {isImporting && (
                  <div className="flex items-center gap-2 text-[#00B4D8]">
                    <Loader2 className="h-4 w-4 animate-spin" /> Processing CSV lines...
                  </div>
                )}

                {importResult && (
                  <div className="space-y-2 border border-slate-100 dark:border-slate-800 p-4 rounded-2xl max-h-[200px] overflow-y-auto pr-2 custom-scrollbar">
                    <p className="font-bold text-[#2ECC71]">Import Summary:</p>
                    <ul className="space-y-1 list-disc list-inside">
                      <li>Total Rows Processed: {importResult.totalProcessed}</li>
                      <li>Successful Registrations: {importResult.successfulRows}</li>
                      <li>Failed Rows: {importResult.failedRows}</li>
                    </ul>
                    {importResult.rowLogs && importResult.rowLogs.length > 0 && (
                      <div className="pt-2 border-t border-slate-50 mt-2">
                        <span className="block text-rose-500 font-black mb-1">Row Logs:</span>
                        {importResult.rowLogs.map((log: string, idx: number) => (
                          <div key={idx} className="text-[10px] text-slate-400 font-mono">{log}</div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                <div className="flex gap-4 pt-3.5 justify-end border-t border-slate-100 dark:border-slate-800">
                  <button 
                    type="button" 
                    onClick={() => { setShowImportModal(false); setImportResult(null); }}
                    className="px-4 py-2 border border-slate-200 dark:border-slate-800 rounded-xl hover:bg-slate-50 text-slate-600"
                  >
                    Close
                  </button>
                  <button 
                    type="submit" 
                    disabled={isImporting}
                    className="px-5 py-2 bg-[#00B4D8] hover:bg-[#0F4C81] disabled:opacity-50 text-white rounded-xl shadow-md"
                  >
                    Process CSV
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